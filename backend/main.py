# backend/main.py
import os
import json
import hashlib
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, inspect, engine as sqlalchemy_engine
import pandas as pd
import ollama
from typing import Any, Dict, List

# --- Constants ---
CACHE_DIR = "analysis_cache"
DEFAULT_SCHEMA_PLACEHOLDER = "_default_"
OLLAMA_MODEL = "llama3"
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

def generate_ai_insights(item_name: str, df: pd.DataFrame, schema_info: Dict[str, str]) -> tuple[str, str]:
    """Generates business summary and schema explanation using an LLM."""
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
        summary_response = ollama.chat(model=OLLAMA_MODEL, messages=[{'role': 'user', 'content': summary_prompt}])
        schema_response = ollama.chat(model=OLLAMA_MODEL, messages=[{'role': 'user', 'content': schema_prompt}])
        
        summary_text = summary_response['message']['content']
        schema_text = schema_response['message']['content']
    except Exception as e:
        summary_text = "AI generation failed. Is Ollama running and the model downloaded?"
        schema_text = f"Error: {str(e)}"
    
    return summary_text, schema_text

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
    
    summary_text, schema_text = generate_ai_insights(item_name, df, schema_info)

    result = {
        "metrics": metrics,
        "summary": summary_text,
        "schema_explanation": schema_text,
        "raw_schema": schema_info
    }

    save_to_cache(cache_path, result)

    return result

@app.post("/chat")
def chat_with_agent(
    question: str = Body(...),
    connection_string: str = Body(...)
):
    """
    Answers natural language questions about the database.
    It builds context by retrieving schema information and running analysis
    for each table/view if not already cached.
    """
    print("🚀 Received chat request...")
    
    try:
        engine = get_engine(connection_string)
        inspector = inspect(engine)
        schemas_structure = get_db_schema_structure(inspector)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve database structure for chat context: {str(e)}")

    # 1. Build a list of all tables/views and the initial schema context string
    all_items = []
    context_str = "Here is the available database structure:\n"
    for schema_info in schemas_structure:
        schema_name = schema_info['schema_name']
        for table in schema_info['tables']:
            all_items.append({"schema": schema_name, "item": table, "type": "TABLE"})
            context_str += f"- TABLE: {schema_name}.{table}\n"
        for view in schema_info['views']:
            all_items.append({"schema": schema_name, "item": view, "type": "VIEW"})
            context_str += f"- VIEW: {schema_name}.{view}\n"

    # 2. For each item, get its summary (from cache or by running analysis)
    context_str += "\nHere are the detailed analyses for all database items:\n"
    
    for item in all_items:
        context_str += f"\n--- Analysis for {item['type']} `{item['schema']}.{item['item']}` ---\n"
        try:
            # This will either load from cache or run a new analysis.
            # The `analyze_item` function handles its own caching logic.
            print(f"⏳ Building context for {item['type']} '{item['schema']}.{item['item']}'...")
            analysis_result = analyze_item(
                schema_name=item['schema'],
                item_name=item['item'],
                connection_string=connection_string,
                force_rerun=False,
            )
            summary = analysis_result.get('summary', 'No summary available.')
            schema_explanation = analysis_result.get('schema_explanation', 'No schema explanation available.')
            raw_schema = analysis_result.get('raw_schema', {})

            context_str += f"Summary: {summary}\n"
            context_str += f"Schema (columns and types): {json.dumps(raw_schema)}\n"
            context_str += f"Schema Explanation: {schema_explanation}\n"
        except HTTPException as e:
            error_message = f"Analysis failed: {e.detail}"
            context_str += f"{error_message}\n"
            print(f"❌ Analysis for {item['schema']}.{item['item']} failed during chat context building: {e.detail}")
        except Exception as e:
            error_message = "Analysis failed with an unexpected error."
            context_str += f"{error_message}\n"
            print(f"❌ Unexpected error for {item['schema']}.{item['item']} during chat context building: {str(e)}")

    # 3. Construct the final prompt for the LLM
    prompt = f"""
You are an expert data analyst assistant. Your task is to answer questions about a database based on the provided context.
The context below contains two parts:
1. A list of all available tables and views in the database.
2. A detailed analysis for each of those tables/views, which includes:
   - A business-friendly summary.
   - The raw schema (column names and data types).
   - A human-friendly explanation of the schema.

Use only the information provided in the context to answer the question. Do not make up information.
If the context is insufficient to answer the question, state that you don't have enough information.

--- CONTEXT ---
{context_str}
--- END CONTEXT ---

Based on the context above, please answer the following question:
Question: "{question}"
"""

    # 4. Call the LLM and return the response
    print("💬 Sending prompt to LLM...")
    try:
        response = ollama.chat(model=OLLAMA_MODEL, messages=[{'role': 'user', 'content': prompt}])
        answer = response['message']['content']
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get response from LLM: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)