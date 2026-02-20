# backend/main.py
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, inspect, text
import pandas as pd
import ollama

app = FastAPI()
TARGET_SCHEMA = "dbo"

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
    """Validates connection and returns list of tables in the dbo schema."""
    engine = get_engine(connection_string)

    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names(schema=TARGET_SCHEMA)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to retrieve tables: {str(e)}")

    return {"tables": tables}

@app.post("/analyze/{table_name}")
def analyze_table(table_name: str, connection_string: str = Body(..., embed=True)):
    """Generates Metrics, Schema, and AI Insights."""
    engine = get_engine(connection_string)

    # 1. Validate that the table exists in the target schema to prevent SQL injection.
    try:
        inspector = inspect(engine)
        if table_name not in inspector.get_table_names(schema=TARGET_SCHEMA):
            raise HTTPException(
                status_code=404,
                detail=f"Table '{table_name}' not found in schema '{TARGET_SCHEMA}'.",
            )
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Could not verify table existence: {str(e)}"
        )

    # 2. Safely quote identifiers for the query to provide a defense-in-depth layer.
    preparer = engine.dialect.identifier_preparer
    full_table_ref = f"{preparer.quote(TARGET_SCHEMA)}.{preparer.quote(table_name)}"

    # 3. Handle SQL Syntax (TOP vs LIMIT) based on the database dialect.
    if engine.dialect.name == "mssql":
        query = f"SELECT TOP 100 * FROM {full_table_ref}"
    else:
        query = f"SELECT * FROM {full_table_ref} LIMIT 100"

    count_query = f"SELECT COUNT(*) FROM {full_table_ref}"

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
    Analyze this database table named '{table_name}'.
    Columns: {columns_list}
    Sample Data:
    {data_pretable}
    
    Write a brief "Business Friendly Summary" (2-3 sentences) describing what this data represents and a "Use Case" for why a business would analyze it.
    """
    
    schema_prompt = f"""
    Explain the technical schema of table '{table_name}' to a non-technical user.
    Columns and types: {schema_info}
    
    Explain the relationships between columns if obvious (e.g., ID linking to other things). Keep it human-friendly.
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

    return {
        "metrics": metrics,
        "summary": summary_text,
        "schema_explanation": schema_text,
        "raw_schema": schema_info
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)