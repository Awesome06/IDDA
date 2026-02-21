# backend/main.py
import os
import json
import hashlib
import asyncio
import functools
import re
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, inspect, engine as sqlalchemy_engine
import pandas as pd
import ollama
from typing import Any, Dict, List, Set

# --- Constants ---
CACHE_DIR = "analysis_cache"
DEFAULT_SCHEMA_PLACEHOLDER = "_default_"
BUSINESS_SUMMARY_MODEL = "llama3"
SQL_GENERATION_MODEL = "codellama"  # Or another model optimized for SQL
# For production, lock this down to your frontend's domain via an environment variable
# e.g., ALLOWED_ORIGINS=http://localhost:5173,https://your-app.com
ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "*").split(",")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Caching Helpers ---
def get_cache_path(connection_string: str, schema_name: str, item_name: str) -> str:
    """Creates a unique and safe cache file path."""
    cache_key = hashlib.md5(f"{connection_string}_{schema_name}_{item_name}".encode()).hexdigest()
    os.makedirs(CACHE_DIR, exist_ok=True)
    return os.path.join(CACHE_DIR, f"{cache_key}.json")

def load_from_cache(cache_path: str) -> Dict[str, Any] | None:
    """Loads analysis result from a cache file."""
    if os.path.exists(cache_path):
        try:
            with open(cache_path, "r") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            print(f"⚠️ Cache read failed for {cache_path}: {e}. Rerunning analysis.")
    return None

def save_to_cache(cache_path: str, data: Dict[str, Any]):
    """Saves analysis result to a cache file."""
    try:
        with open(cache_path, "w") as f:
            json.dump(data, f, indent=4)
        print(f"💾 Saved analysis to cache: {cache_path}")
    except IOError as e:
        print(f"❌ Could not write to cache file {cache_path}: {e}")

# --- Database Helpers ---
def get_engine(db_url: str) -> sqlalchemy_engine.Engine:
    """Creates and tests a SQLAlchemy engine."""
    try:
        engine = create_engine(db_url)
        with engine.connect():
            pass
        return engine
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Connection failed: {str(e)}")

@app.post("/connect")
def connect_db(connection_string: str = Body(..., embed=True)):
    """Validates connection and returns a list of schemas with their tables and views."""
    try:
        engine = get_engine(connection_string)
        inspector = inspect(engine)
        all_schemas_info = get_db_schema_structure(inspector)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to retrieve database structure: {str(e)}")

    return {"schemas": all_schemas_info}

def get_db_schema_structure(inspector: sqlalchemy_engine.Inspector) -> List[Dict[str, Any]]:
    """Retrieves the full schema structure (schemas, tables, views) from the database."""
    all_schemas_info = []
    schemas_to_check = [None] + inspector.get_schema_names()
    if 'dbo' in schemas_to_check:
        schemas_to_check.remove('dbo')

    for schema_name in schemas_to_check:
        tables = inspector.get_table_names(schema=schema_name)
        views = []
        try:
            views = inspector.get_view_names(schema=schema_name)
        except NotImplementedError:
            print(f"⚠️ Dialect does not support get_view_names() for schema '{schema_name}'.")
        
        if tables or views:
            schema_key = schema_name if schema_name is not None else DEFAULT_SCHEMA_PLACEHOLDER
            all_schemas_info.append({
                "schema_name": schema_key,
                "tables": sorted(tables),
                "views": sorted(views)
            })
    return all_schemas_info

def validate_item_exists(inspector: sqlalchemy_engine.Inspector, schema_name: str | None, item_name: str):
    """Validates that a table or view exists in the given schema."""
    try:
        all_tables = inspector.get_table_names(schema=schema_name)
        all_views = []
        try:
            all_views = inspector.get_view_names(schema=schema_name)
        except NotImplementedError:
            pass

        if item_name not in all_tables and item_name not in all_views:
            raise HTTPException(
                status_code=404,
                detail=f"Table or view '{item_name}' not found in schema '{schema_name or 'default'}'.",
            )
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Could not verify item existence: {str(e)}"
        )

# --- Analysis Helpers ---
def fetch_data_and_metrics(engine: sqlalchemy_engine.Engine, full_item_ref: str) -> tuple[pd.DataFrame, Dict[str, Any]]:
    """Fetches sample data and calculates key metrics."""
    if engine.dialect.name == "mssql":
        query = f"SELECT TOP 100 * FROM {full_item_ref}"
    else:
        query = f"SELECT * FROM {full_item_ref} LIMIT 100"
    count_query = f"SELECT COUNT(*) FROM {full_item_ref}"

    try:
        df = pd.read_sql(query, engine)
        total_rows = pd.read_sql(count_query, engine).iloc[0, 0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Execution failed on sql '{query}': {str(e)}")

    metrics = {
        "total_rows": int(total_rows),
        "columns": len(df.columns),
        "completeness": round((1 - df.isna().mean().mean()) * 100, 2) if not df.empty else 100,
        "freshness": "N/A",
        "duplicate_rows": int(df.duplicated().sum())
    }
    return df, metrics

def generate_ai_insights(item_name: str, df: pd.DataFrame, schema_info: Dict[str, str]) -> tuple[str, str, str]:
    """Generates business summary, schema explanation, and data preview."""
    data_preview = df.head(5).to_markdown(index=False)
    columns_list = list(df.columns)

    summary_prompt = f"""
    As a senior business analyst, analyze the database table/view named '{item_name}'.
    Columns: {columns_list}
    Sample Data:
    {data_preview}
    
    Write a brief "Business Friendly Summary" (2-3 sentences) describing what this data represents and a "Use Case" for why a business would analyze it.
    """
    
    schema_prompt = f"""
    Explain the technical schema of table/view '{item_name}' to a non-technical user.
    Columns and types: {schema_info}
    
    Explain relationships between columns if obvious (e.g., an ID linking to other things). Keep it human-friendly.
    Do not end on a question. Provide a clear explanation of the schema and its potential use cases in simple terms.
    """

    try:
        summary_response = ollama.chat(model=BUSINESS_SUMMARY_MODEL, messages=[{'role': 'user', 'content': summary_prompt}])
        schema_response = ollama.chat(model=BUSINESS_SUMMARY_MODEL, messages=[{'role': 'user', 'content': schema_prompt}])
        
        summary_text = summary_response['message']['content']
        schema_text = schema_response['message']['content']
    except Exception as e:
        summary_text = "AI generation failed. Is Ollama running and the model downloaded?"
        schema_text = f"Error: {str(e)}"
    
    return summary_text, schema_text, data_preview

# --- API Routes ---

@app.post("/analyze/{schema_name}/{item_name}")
def analyze_item(
    schema_name: str,
    item_name: str,
    connection_string: str = Body(...),
    force_rerun: bool = Body(False)
):
    """
    Generates Metrics, Schema, and AI Insights for a table or view.
    Uses caching and a flag to force re-analysis.
    """
    cache_path = get_cache_path(connection_string, schema_name, item_name)

    if not force_rerun:
        cached_result = load_from_cache(cache_path)
        if cached_result:
            print(f"✅ Loading from cache: {cache_path}")
            return cached_result

    print(f"🚀 Running new analysis for '{schema_name}.{item_name}'...")
    engine = get_engine(connection_string)
    inspector = inspect(engine)
    
    effective_schema = None if schema_name == DEFAULT_SCHEMA_PLACEHOLDER else schema_name

    validate_item_exists(inspector, effective_schema, item_name)

    preparer = engine.dialect.identifier_preparer
    quoted_item = preparer.quote(item_name)
    full_item_ref = f"{preparer.quote(effective_schema)}.{quoted_item}" if effective_schema else quoted_item

    df, metrics = fetch_data_and_metrics(engine, full_item_ref)
    schema_info = df.dtypes.astype(str).to_dict()
    
    summary_text, schema_text, data_preview = generate_ai_insights(item_name, df, schema_info)

    result = {
        "metrics": metrics,
        "summary": summary_text,
        "schema_explanation": schema_text,
        "raw_schema": schema_info,
        "data_preview": data_preview
    }

    save_to_cache(cache_path, result)

    return result

async def handle_summary_chat(question: str, connection_string: str, schemas_structure: List[Dict[str, Any]]):
    """
    Answers questions using a two-step agentic approach based on table summaries.
    1. A "router" LLM selects the most relevant tables based on summaries.
    2. An "answerer" LLM uses detailed schema from selected tables to answer the question.
    """
    # 1. Build a list of all tables/views
    all_items = []
    for schema_info in schemas_structure:
        schema_name = schema_info['schema_name']
        for table in schema_info['tables']:
            all_items.append({"schema": schema_name, "item": table, "type": "TABLE"})
        for view in schema_info['views']:
            all_items.append({"schema": schema_name, "item": view, "type": "VIEW"})

    if not all_items:
        return {"answer": "I could not find any tables or views in the database to analyze."}

    # 2. Concurrently get a summary for each item (from cache or by running analysis)
    async def get_summary(item: Dict[str, str]) -> Dict[str, Any]:
        """Wrapper to run sync analyze_item in a thread and extract summary."""
        loop = asyncio.get_running_loop()
        try:
            # Run the synchronous `analyze_item` in the default thread pool
            analysis_result = await loop.run_in_executor(
                None, 
                analyze_item,
                item['schema'],
                item['item'],
                connection_string,
                False # force_rerun=False
            )
            return {
                "full_name": f"{item['schema']}.{item['item']}",
                "type": item['type'],
                "summary": analysis_result.get('summary', 'No summary available.'),
                "columns": list(analysis_result.get('raw_schema', {}).keys())
            }
        except Exception as e:
            print(f"❌ Failed to get summary for {item['schema']}.{item['item']}: {e}")
            return {
                "full_name": f"{item['schema']}.{item['item']}",
                "type": item['type'],
                "summary": "Failed to generate summary.",
                "columns": []
            }

    print(f"⏳ Fetching summaries for {len(all_items)} items...")
    summary_tasks = [get_summary(item) for item in all_items]
    all_summaries = await asyncio.gather(*summary_tasks)

    # 3. ROUTER STEP: Select relevant tables
    print("🧠 Router: Selecting relevant tables...")
    selection_context = "Available data sources:\n"
    for s in all_summaries:
        # Clean up the summary for the router by removing markdown headers but keeping all text.
        summary_text = s['summary']
        # Remove markdown bolding and headers like **...:**
        clean_summary = re.sub(r'\*\*.+?\*\*:', '', summary_text).replace('**', '').strip()
        # Consolidate newlines and spaces into a single line for a cleaner prompt.
        clean_summary = re.sub(r'\s*\n\s*', ' ', clean_summary).strip()
        columns_list = ", ".join(s.get('columns', []))
        selection_context += f"- {s['type']}: {s['full_name']}\n  Summary: {clean_summary}\n  Columns: {columns_list}\n"

    selection_prompt = f"""
You are an expert database router. Your goal is to identify which tables are needed to answer the user's question.
You will be given a user's question and a list of available data sources with their summaries and columns.
Analyze the user's question and the data sources to determine the complete set of tables required.
Think step-by-step: what information is needed, and which tables contain that information? How can they be linked together via ID columns?
For example, to answer "what categories of products are most popular?", you would need to link `order_items` (for sales data) to `products` (to get `category_id`) and then to `categories` (to get the category name).

Based on this logic, identify all necessary tables from the list below to answer the user's question.

User question: "{question}"

Available data sources:
{selection_context}

Return ONLY a comma-separated list of the full data source names (e.g., schema_name.table_name). Do not add any other text or explanation.
"""
    
    try:
        loop = asyncio.get_running_loop()
        router_chat_func = functools.partial(
            ollama.chat, model=BUSINESS_SUMMARY_MODEL, messages=[{'role': 'user', 'content': selection_prompt}]
        )
        router_response = await loop.run_in_executor(
            None,
            router_chat_func
        )
        selected_items_str = router_response['message']['content']
        selected_item_names: Set[str] = {name.strip() for name in selected_items_str.split(',') if name.strip()}
        print(f"✅ Router selected: {selected_item_names}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Router LLM call failed: {str(e)}")

    if not selected_item_names:
        return {"answer": "I couldn't determine which tables are relevant to your question. Please try rephrasing."}

    # 4. ANSWERER STEP: Build detailed context for selected tables
    print(f"📝 Answerer: Building detailed context for {len(selected_item_names)} tables...")
    
    async def get_details(full_name: str) -> str:
        """Wrapper to get full details and format them for the prompt."""
        try:
            schema_name, item_name = full_name.split('.', 1)
        except ValueError:
            return "" # Skip malformed names

        loop = asyncio.get_running_loop()
        try:
            # This should be a fast cache hit since get_summary already ran
            analysis_result = await loop.run_in_executor(
                None, analyze_item, schema_name, item_name, connection_string, False
            )
            
            # Use a more token-efficient format (YAML-like)
            item_context = f"\n--- Analysis for table/view `{full_name}` ---\n"
            item_context += f"Summary: {analysis_result.get('summary', 'N/A')}\n"
            
            raw_schema = analysis_result.get('raw_schema', {})
            if raw_schema:
                item_context += "Schema:\n"
                for col, dtype in raw_schema.items():
                    item_context += f"- {col} ({dtype})\n"
            
            data_preview = analysis_result.get('data_preview')
            if data_preview:
                item_context += f"Sample Data:\n{data_preview}\n"

            return item_context
        except Exception as e:
            print(f"❌ Failed to get details for {full_name}: {e}")
            return f"\n--- Analysis for table/view `{full_name}` ---\nAnalysis failed.\n"

    detail_tasks = [get_details(name) for name in selected_item_names]
    detailed_contexts = await asyncio.gather(*detail_tasks)
    detailed_context_str = "".join(detailed_contexts)

    # 5. Final prompt and LLM call
    final_prompt = f"""
You are an expert data analyst assistant. Your task is to answer questions about a database based on the provided context.
The context below contains detailed analysis for the tables/views that are relevant to the user's question, including summaries, schemas, and sample data.
Use only the information provided in the context to answer the question. Refer to the sample data to give specific examples in your answer. Do not make up information.
    If the context is not sufficient, say so.

--- CONTEXT ---
{detailed_context_str}
--- END CONTEXT ---

Based on the context above, please answer the following question.
    Question: "{question}"
    """

    print("💬 Answerer: Sending final prompt to LLM...")
    try:
        loop = asyncio.get_running_loop()
        answerer_chat_func = functools.partial(
            ollama.chat, model=BUSINESS_SUMMARY_MODEL, messages=[{'role': 'user', 'content': final_prompt}]
        )
        answer_response = await loop.run_in_executor(
            None,
            answerer_chat_func
        )
        answer = answer_response['message']['content']
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Answerer LLM call failed: {str(e)}")

async def handle_sql_chat(question: str, schemas_structure: List[Dict[str, Any]], engine: sqlalchemy_engine.Engine):
    """
    Generates and executes a SQL query to answer a question, then summarizes the result.
    """
    # 1. Build schema context for the SQL generation model
    schema_context = f"Database Schema (Dialect: {engine.dialect.name}):\n"
    inspector = inspect(engine)
    preparer = engine.dialect.identifier_preparer

    for schema_info in schemas_structure:
        schema_name = schema_info['schema_name']
        effective_schema = None if schema_name == DEFAULT_SCHEMA_PLACEHOLDER else schema_name
        
        if effective_schema:
            schema_context += f"\n-- Schema: {preparer.quote(effective_schema)}\n"

        for item_type, item_list in [("TABLE", schema_info['tables']), ("VIEW", schema_info['views'])]:
            for item_name in item_list:
                try:
                    columns = inspector.get_columns(item_name, schema=effective_schema)
                    column_defs = ", ".join([f"{preparer.quote(col['name'])} {col['type']}" for col in columns])
                    
                    full_name = f"{preparer.quote(effective_schema)}.{preparer.quote(item_name)}" if effective_schema else preparer.quote(item_name)
                    schema_context += f"{item_type} {full_name} ({column_defs});\n"
                except Exception as e:
                    print(f"⚠️ Could not get columns for {item_name} in schema {effective_schema}: {e}")

    # 2. Prompt for SQL generation
    sql_prompt = f"""
You are an expert SQL developer. Given the following database schema and a user question, write a single, executable SQL query to answer the question.
Only return the SQL query inside a single ```sql code block. Do not include any other text or explanation.

Database Schema:
{schema_context}

User Question: "{question}"
"""
    
    print("🧠 SQL Generator: Creating SQL query...")
    try:
        loop = asyncio.get_running_loop()
        sql_gen_chat_func = functools.partial(
            ollama.chat, model=SQL_GENERATION_MODEL, messages=[{'role': 'user', 'content': sql_prompt}]
        )
        sql_response = await loop.run_in_executor(None, sql_gen_chat_func)
        generated_sql = sql_response['message']['content'].strip()
        
        # Extract SQL from markdown code block
        match = re.search(r"```sql\n(.*?)\n```", generated_sql, re.DOTALL)
        if match:
            generated_sql = match.group(1).strip()
        else: # Fallback for no markdown
            generated_sql = generated_sql.replace("```sql", "").replace("```", "").strip()
        
        print(f"✅ Generated SQL:\n{generated_sql}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SQL generation LLM call failed: {str(e)}")

    # 3. Execute SQL and return result
    try:
        print("Executing SQL query...")
        with engine.connect() as connection:
            result_df = pd.read_sql(generated_sql, connection)
        
        # 4. Summarize result with another LLM call
        print("💬 Summarizing SQL results...")
        result_summary_prompt = f"""
A user asked the question: "{question}"
The following SQL query was generated and executed:
```sql
{generated_sql}
```
The query returned {len(result_df)} rows. The result is:
{result_df.to_markdown(index=False) if not result_df.empty else "No results found."}

Based on this, provide a concise, natural language answer to the user's original question. If the query returned no results, state that.
"""
        answer_chat_func = functools.partial(
            ollama.chat, model=BUSINESS_SUMMARY_MODEL, messages=[{'role': 'user', 'content': result_summary_prompt}]
        )
        answer_response = await loop.run_in_executor(None, answer_chat_func)
        answer = answer_response['message']['content']

        return {"answer": answer, "generated_sql": generated_sql}

    except Exception as e:
        error_message = f"I generated a SQL query, but it failed to execute. This could be due to a complex question or an issue with the query itself.\n\n**Error:** {str(e)}"
        print(f"❌ SQL Execution Error: {e}")
        return {"answer": error_message, "generated_sql": generated_sql}

@app.post("/chat")
async def chat_with_agent(
    question: str = Body(...),
    connection_string: str = Body(...),
    chat_mode: str = Body("summary")
):
    """
    Answers natural language questions about the database.
    - 'summary' mode: Uses a two-step agentic approach to answer questions based on table summaries.
    - 'sql' mode: Attempts to generate and execute a SQL query to answer the question.
    """
    print(f"🚀 Received chat request in '{chat_mode}' mode...")

    try:
        engine = get_engine(connection_string)
        inspector = inspect(engine)
        schemas_structure = get_db_schema_structure(inspector)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve database structure for chat context: {str(e)}")

    if chat_mode == "sql":
        return await handle_sql_chat(question, schemas_structure, engine)
    elif chat_mode == "summary":
        return await handle_summary_chat(question, connection_string, schemas_structure)
    else:
        raise HTTPException(status_code=400, detail=f"Invalid chat_mode: '{chat_mode}'. Must be 'summary' or 'sql'.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)