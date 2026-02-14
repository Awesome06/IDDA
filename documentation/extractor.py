import pandas as pd
import json
from sqlalchemy import create_engine, inspect, text
import urllib.parse

# Define your raw connection parameters
params = urllib.parse.quote_plus(
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=localhost\\SQLEXPRESS;"
    "DATABASE=DataWarehouse;"
    "Trusted_Connection=yes;"
)

# Create the engine using the 'odbc_connect' query
DATABASE_URL = f"mssql+pyodbc:///?odbc_connect={params}"
engine = create_engine(DATABASE_URL)

def get_target_tables():
    """
    Fetches the specific list of views from the Gold layer
    using your custom SQL query.
    """
    sql = """
    SELECT 
        TABLE_SCHEMA AS Layer,
        TABLE_NAME
    FROM [DataWarehouse].INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = 'Gold' AND TABLE_TYPE = 'VIEW'
    ORDER BY TABLE_SCHEMA, TABLE_NAME;
    """
    
    with engine.connect() as connection:
        result = pd.read_sql(sql, connection)
    
    return result

def get_table_profile(schema, table_name):
    """
    Fetches schema + basic stats for a specific table.
    """
    inspector = inspect(engine)
    
    # Construct schema-qualified name (e.g. [Silver].[TableName])
    full_table_name = f"[{schema}].[{table_name}]"
    
    print(f"Processing: {full_table_name}...")
    
    # B. Get Data Profile (Lightweight)
    # We use the full name here to ensure we query the right layer
    query = text(f"SELECT TOP 1000 * FROM {full_table_name}")
    
    try:
        # A. Get Technical Metadata (Columns, PKs)
        columns = inspector.get_columns(table_name, schema=schema)
        pks = inspector.get_pk_constraint(table_name, schema=schema)

        df = pd.read_sql(query, engine)
        
        stats = {
            "row_count_sample": len(df),
            "columns": {}
        }
        
        for col in df.columns:
            if df[col].isnull().all():
                sample_vals = []
            else:
                sample_vals = df[col].dropna().unique()[:3].tolist()

            stats["columns"][col] = {
                "type": str(df[col].dtype),
                "unique_values": df[col].nunique(),
                "missing_values": int(df[col].isnull().sum()),
                "sample_values": sample_vals
            }
            
        return {
            "table_name": table_name,
            "schema": schema,
            "columns": [c['name'] for c in columns],
            "primary_keys": pks,
            "profile": stats
        }
        
    except Exception as e:
        print(f"Error profiling {full_table_name}: {e}")
        return None

# --- Main Execution ---
if __name__ == "__main__":
    
    # 1. Get the list of tables to scan
    print("Fetching view list from Gold layer...")
    tables_df = get_target_tables()
    
    all_profiles = []
    
    # 2. Loop through each table
    for index, row in tables_df.iterrows():
        schema = row['Layer']
        table = row['TABLE_NAME']
        
        profile_data = get_table_profile(schema, table)
        
        if profile_data:
            all_profiles.append(profile_data)

    # 3. Save to JSON (This file will be fed to the AI Generator)
    output_file = "./documentation/raw_metadata.json"
    with open(output_file, "w") as f:
        json.dump(all_profiles, f, indent=4, default=str)
        
    print(f"✅ Success! Extracted metadata for {len(all_profiles)} tables to {output_file}")