# backend/main.py
import os
import json
import hashlib
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, inspect, text
import pandas as pd
import ollama

app = FastAPI()
CACHE_DIR = "analysis_cache"

# Allow Frontend to communicate with Backend
# WARNING: In a production environment, you should restrict the allowed origins
# to the specific domain of your frontend application for security reasons.
# Example: allow_origins=["http://localhost:5173", "https://your-frontend-app.com"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Caching Helpers ---
def get_cache_path(connection_string: str, schema_name: str, item_name: str) -> str:
    """Creates a unique and safe cache file path."""
    # Create a hash from the connection string, schema, and item name
    cache_key = hashlib.md5(f"{connection_string}_{schema_name}_{item_name}".encode()).hexdigest()
    os.makedirs(CACHE_DIR, exist_ok=True)
    return os.path.join(CACHE_DIR, f"{cache_key}.json")

# --- 1. Connection Helper ---
def get_engine(db_url):
    try:
        engine = create_engine(db_url)
        # Test connection by trying to connect
        with engine.connect():
            pass
        return engine
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Connection failed: {str(e)}")

# --- 2. Routes ---

@app.post("/connect")
def connect_db(connection_string: str = Body(..., embed=True)):
    """Validates connection and returns a list of schemas with their tables and views."""
    engine = get_engine(connection_string)
    inspector = inspect(engine)

    try:
        # Get all schema names. Some DBs like SQLite return an empty list.
        # The default schema is represented by `None`, so we always check it.
        schemas_to_check = [None] + inspector.get_schema_names()
        if 'dbo' in schemas_to_check:
           schemas_to_check.remove('dbo')  # Remove 'dbo' if present, as it's the default schema in SQL Server

        all_schemas_info = []

        for schema_name in schemas_to_check:
            tables = inspector.get_table_names(schema=schema_name)
            views = []
            try:
                # get_view_names might not be supported by all dialects
                views = inspector.get_view_names(schema=schema_name)
            except NotImplementedError:
                print(f"⚠️ Dialect {engine.dialect.name} does not support get_view_names().")
            
            if tables or views:
                # Use a placeholder for the default schema name for frontend/URL safety
                schema_key = schema_name if schema_name is not None else "_default_"
                all_schemas_info.append({
                    "schema_name": schema_key,
                    "tables": sorted(tables),
                    "views": sorted(views)
                })

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to retrieve database structure: {str(e)}")

    return {"schemas": all_schemas_info}

@app.post("/analyze/{schema_name}/{item_name}")
def analyze_table(
    schema_name: str,
    item_name: str,
    connection_string: str = Body(..., embed=True),
    force_rerun: bool = False
):
    """
    Generates Metrics, Schema, and AI Insights for a table or view.
    Stores results permanently and uses a flag to force re-analysis.
    """
    cache_path = get_cache_path(connection_string, schema_name, item_name)

    # If not forcing a rerun, try to load from cache
    if not force_rerun and os.path.exists(cache_path):
        try:
            with open(cache_path, "r") as f:
                print(f"✅ Loading from cache: {cache_path}")
                return json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            print(f"⚠️ Cache read failed for {cache_path}: {e}. Rerunning analysis.")

    print(f"🚀 Running new analysis for '{schema_name}.{item_name}'...")
    engine = get_engine(connection_string)
    
    # Convert placeholder for default schema back to None for SQLAlchemy
    effective_schema = None if schema_name == "_default_" else schema_name

    # 1. Validate that the table/view exists in the target schema to prevent SQL injection.
    try:
        inspector = inspect(engine)
        all_tables = inspector.get_table_names(schema=effective_schema)
        all_views = []
        try:
            all_views = inspector.get_view_names(schema=effective_schema)
        except NotImplementedError:
            pass # Dialect doesn't support views, continue with just tables

        if item_name not in all_tables and item_name not in all_views:
            raise HTTPException(
                status_code=404,
                detail=f"Table or view '{item_name}' not found in schema '{schema_name}'.",
            )
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Could not verify item existence: {str(e)}"
        )

    # 2. Safely quote identifiers for the query.
    preparer = engine.dialect.identifier_preparer
    quoted_item = preparer.quote(item_name)
    if effective_schema:
        full_item_ref = f"{preparer.quote(effective_schema)}.{quoted_item}"
    else:
        full_item_ref = quoted_item

    # 3. Handle SQL Syntax (TOP vs LIMIT) based on the database dialect.
    if engine.dialect.name == "mssql":
        query = f"SELECT TOP 100 * FROM {full_item_ref}"
    else:
        query = f"SELECT * FROM {full_item_ref} LIMIT 100"

    count_query = f"SELECT COUNT(*) FROM {full_item_ref}"

    # A. Fetch Data
    try:
        df = pd.read_sql(query, engine)
        total_rows = pd.read_sql(count_query, engine).iloc[0, 0]
    except Exception as e:
        print(f"❌ Query Failed: {query}")
        raise HTTPException(status_code=400, detail=f"Execution failed on sql '{query}': {str(e)}")

    # B. Calculate Dashboard Metrics
    metrics = {
        "total_rows": int(total_rows),
        "columns": len(df.columns),
        "completeness": round((1 - df.isna().mean().mean()) * 100, 2),
        "freshness": "N/A", 
        "duplicate_rows": int(df.duplicated().sum())
    }

    # C. Generate Schema Info
    schema_info = df.dtypes.astype(str).to_dict()
    
    # D. AI Generation
    data_pretable = df.head(5).to_markdown(index=False)
    columns_list = list(df.columns)

    summary_prompt = f"""
    As a senior business analyst, you have just received a new dataset.

    Analyze this database table/view named '{item_name}'.
    Columns: {columns_list}
    Sample Data:
    {data_pretable}
    
    Write a brief "Business Friendly Summary" (2-3 sentences) describing what this data represents and a "Use Case" for why a business would analyze it.
    """
    
    schema_prompt = f"""
    Explain the technical schema of table/view '{item_name}' to a non-technical user.
    Columns and types: {schema_info}
    
    Explain the relationships between columns if obvious (e.g., ID linking to other things). Keep it human-friendly.

    Do not end on a question. Just provide a clear explanation of the schema and its potential use cases in simple terms.
    """

    model = "llama3" # Ensure you have run 'ollama pull llama3'
    try:
        summary_response = ollama.chat(model=model, messages=[{'role': 'user', 'content': summary_prompt}])
        schema_response = ollama.chat(model=model, messages=[{'role': 'user', 'content': schema_prompt}])
        
        summary_text = summary_response['message']['content']
        schema_text = schema_response['message']['content']
    except Exception as e:
        summary_text = "AI generation failed. Is Ollama running?"
        schema_text = f"Error: {str(e)}"

    result = {
        "metrics": metrics,
        "summary": summary_text,
        "schema_explanation": schema_text,
        "raw_schema": schema_info
    }

    # Store the new result in the cache
    try:
        with open(cache_path, "w") as f:
            json.dump(result, f, indent=4)
        print(f"💾 Saved analysis to cache: {cache_path}")
    except IOError as e:
        # Log the error, but don't fail the request if caching fails
        print(f"❌ Could not write to cache file {cache_path}: {e}")

    return result

@app.post("/chat")
def chat_with_agent(
    question: str = Body(..., embed=True),
    connection_string: str = Body(..., embed=True)
):
    """
    Answers natural language questions about the database using schema information
    and cached analysis as context.
    """
    print("🚀 Received chat request...")
    
    # 1. Get database schema structure
    try:
        engine = get_engine(connection_string)
        inspector = inspect(engine)
        schemas_to_check = [None] + inspector.get_schema_names()
        if 'dbo' in schemas_to_check:
           schemas_to_check.remove('dbo')

        all_items = []
        for schema_name in schemas_to_check:
            schema_key = schema_name if schema_name is not None else "_default_"
            tables = inspector.get_table_names(schema=schema_name)
            views = []
            try:
                views = inspector.get_view_names(schema=schema_name)
            except NotImplementedError:
                pass
            
            for table in tables:
                all_items.append({"schema": schema_key, "item": table, "type": "TABLE"})
            for view in views:
                all_items.append({"schema": schema_key, "item": view, "type": "VIEW"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve database structure for chat context: {str(e)}")

    # 2. Build context from schema and cached analysis
    context_str = "Here is the available database structure:\n"
    for item in all_items:
        context_str += f"- {item['type']}: {item['schema']}.{item['item']}\n"
    
    context_str += "\nHere are summaries for some of the analyzed items:\n"
    
    found_cache = False
    for item in all_items:
        cache_path = get_cache_path(connection_string, item['schema'], item['item'])
        if os.path.exists(cache_path):
            found_cache = True
            with open(cache_path, 'r') as f:
                cache_data = json.load(f)
                summary = cache_data.get('summary', 'No summary available.')
                context_str += f"\n--- Analysis for {item['type']} `{item['schema']}.{item['item']}` ---\n"
                context_str += f"{summary}\n"

    if not found_cache:
        context_str += "No pre-analyzed information is available for any tables or views yet.\n"

    # 3. Construct the final prompt for the LLM
    prompt = f"""
You are an expert data analyst assistant. Your task is to answer questions about a database based on the provided context.
The context includes the database's schema structure and, where available, AI-generated summaries of tables and views.
Use only the information provided in the context to answer the question. Do not make up information.
If the context is insufficient to answer the question, state that you don't have enough information.

--- CONTEXT ---
{context_str}
--- END CONTEXT ---

Based on the context above, please answer the following question:
Question: "{question}"
"""

    # 4. Call the LLM and return the response
    model = "llama3"
    print("💬 Sending prompt to LLM...")
    try:
        response = ollama.chat(model=model, messages=[{'role': 'user', 'content': prompt}])
        answer = response['message']['content']
        return {"answer": answer}
    except Exception as e:
        print(f"❌ LLM call failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get response from LLM: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)