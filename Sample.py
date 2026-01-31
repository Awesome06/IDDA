import pyodbc
import pandas as pd
from vanna.google import GoogleGeminiChat
from vanna.chromadb import ChromaDB_VectorStore

# 1. Define the Vanna Client with manual SQL handling
class MyVanna(ChromaDB_VectorStore, GoogleGeminiChat):
    def __init__(self, config=None):
        ChromaDB_VectorStore.__init__(self, config=config)
        GoogleGeminiChat.__init__(self, config=config)

    # OVERRIDE: This is how Vanna talks to SQL Server
    def run_sql(self, sql: str) -> pd.DataFrame:
        # Build your connection string
        conn_str = (
            "DRIVER={ODBC Driver 17 for SQL Server};"
            "SERVER=localhost;"  # e.g., localhost or 192.168.1.5
            "DATABASE=YOUR_DB_NAME;"
            "UID=YOUR_USERNAME;"
            "PWD=YOUR_PASSWORD;"
            # "Trusted_Connection=yes;" # Uncomment this line if using Windows Auth instead of User/Pass
        )
    
        try:
            conn = pyodbc.connect(conn_str)
            df = pd.read_sql(sql, conn)
            conn.close()
            return df
        except Exception as e:
            print(f"SQL Error: {e}")
            return None

# 2. Configuration & Initialization
api_key = "YOUR_GOOGLE_API_KEY"
config = {
    "api_key": api_key,
    "model": "gemini-1.5-pro",
    "path": "./chroma_db"
}

vn = MyVanna(config=config)

# 3. Train on the SQL Server Schema
# Note: SQL Server has a specific way to get schema info (INFORMATION_SCHEMA)
sql_get_schema = """
SELECT 
    TABLE_NAME, 
    COLUMN_NAME, 
    DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'dbo' 
"""

# Fetch schema and train
# We manually fetch the schema dataframe first to ensure it works
df_schema = vn.run_sql(sql_get_schema)

if df_schema is not None:
    # Train the "Plan" (Tables and Columns)
    plan = vn.train(plan=df_schema)
    print("Training Complete! Connected to SQL Server.")
else:
    print("Could not connect to SQL Server.")

# 4. Launch UI
from vanna.flask import VannaFlaskApp
app = VannaFlaskApp(vn)
app.run()