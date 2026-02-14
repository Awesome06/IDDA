import json
import os
from langchain_community.vectorstores import Chroma
from langchain_ollama import OllamaEmbeddings
from langchain_core.documents import Document

# --- Configuration ---
input_file = "./documentation/enriched_documentation.json"
persist_dir = "./documentation/local_chroma_db"

# 1. Load the Data
if not os.path.exists(input_file):
    print(f"❌ Error: {input_file} not found. Did you run generator.py?")
    exit()

with open(input_file, "r") as f:
    docs_data = json.load(f)

print(f"📂 Loaded {len(docs_data)} records.")

# 2. Convert JSON to LangChain Documents
documents = []
for entry in docs_data:
    doc_info = entry.get('documentation', {})
    
    # Skip entries that failed parsing
    if "error" in doc_info:
        continue
        
    table_name = entry.get('table_name', 'Unknown')
    business_name = doc_info.get('business_name', 'N/A')
    summary = doc_info.get('summary', 'N/A')
    metrics = doc_info.get('key_metrics', [])

    # FORMAT: Create a rich text representation for the LLM to read later
    content = f"""
    Table Technical Name: {table_name}
    Business Name: {business_name}
    Description: {summary}
    Key Business Metrics: {", ".join(metrics) if isinstance(metrics, list) else metrics}
    """
    
    # METADATA: Helps us trace back to the source table
    documents.append(Document(page_content=content, metadata={"source": table_name}))

# 3. Embed and Store
print("🧠 Initializing Embeddings (Llama 3)...")
embeddings = OllamaEmbeddings(model="llama3") 

print(f"START: Indexing {len(documents)} documents into ChromaDB...")

# Create (or update) the vector store
vector_db = Chroma.from_documents(
    documents=documents, 
    embedding=embeddings,
    persist_directory=persist_dir
)

print(f"✅ Indexing Complete! Database saved to {persist_dir}")