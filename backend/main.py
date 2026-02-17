# backend/main.py
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, inspect, text
import pandas as pd
import ollama

app = FastAPI()
TARGET_SCHEMA = "silver"

# Allow Frontend to communicate with Backend
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
        with engine.connect() as conn:
            pass # Test connection
        return engine
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Connection failed: {str(e)}")

# --- 2. Routes ---

@app.post("/connect")
def connect_db(connection_string: str = Body(..., embed=True)):
    """Validates connection and returns list of tables in the SILVER schema."""
    engine = get_engine(connection_string)
    
    tables = []
    try:
        with engine.connect() as connection:
            # 1. Direct query to finding tables in 'silver' schema
            # We use text() to execute raw SQL safely
            query = text("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'silver'")
            result = connection.execute(query)
            tables = [row[0] for row in result]
            
            # 2. If 'silver' is empty, try 'dbo' just in case
            if not tables:
                query_dbo = text("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo'")
                result_dbo = connection.execute(query_dbo)
                tables = [row[0] for row in result_dbo]
                
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Query failed: {str(e)}")
            
    return {"tables": tables}

@app.post("/analyze/{table_name}")
def analyze_table(table_name: str, connection_string: str = Body(..., embed=True)):
    """Generates Metrics, Schema, and AI Insights."""
    engine = get_engine(connection_string)
    
    # 1. Handle Schema (Prepend 'silver.' if needed)
    # If the table name doesn't already have a dot, assume it's in silver
    if "." not in table_name:
        full_table_ref = f"silver.{table_name}"
    else:
        full_table_ref = table_name

    # 2. Handle SQL Syntax (TOP vs LIMIT)
    # Check if the connection string is for SQL Server
    is_mssql = "mssql" in connection_string or "sql server" in connection_string.lower()

    if is_mssql:
        query = f"SELECT TOP 100 * FROM {full_table_ref}"
        count_query = f"SELECT COUNT(*) FROM {full_table_ref}"
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
    data_preview = df.head(5).to_markdown(index=False)
    columns_list = list(df.columns)

    summary_prompt = f"""
    Analyze this database table named '{table_name}'.
    Columns: {columns_list}
    Sample Data:
    {data_preview}
    
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