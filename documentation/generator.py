import json
import os
import re
from langchain_ollama import OllamaLLM
from langchain_core.prompts import PromptTemplate

# 1. Setup Local LLM
print("🔌 Connecting to Ollama (Llama 3)...")
llm = OllamaLLM(model="llama3", temperature=0.1)

# 2. Define the Prompt (Made stricter)
template = """
You are a Data Steward. I will provide table metadata. 
You must output a single valid JSON object containing a business description.

**Table:** {table_name}
**Data Profile:** {profile}

**STRICT RULES:**
1. Output ONLY the JSON object. 
2. Do NOT add introductions like "Here is the JSON".
3. Do NOT add markdown formatting like ```json.
4. Ensure the JSON is valid (proper quotes, commas).

**Required JSON Structure:**
{{
    "business_name": "Human Friendly Name",
    "summary": "A 2-sentence description.",
    "usage_warnings": "Data quality notes (or 'None').",
    "key_metrics": ["Metric 1", "Metric 2", "Metric 3"]
}}
"""

prompt = PromptTemplate(template=template, input_variables=["table_name", "profile"])
chain = prompt | llm

def extract_json_snippet(text):
    """
    Finds the first '{' and the last '}' to isolate the JSON 
    from any conversational filler text.
    """
    try:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            return match.group(0)
        return text
    except Exception:
        return text

def enrich_metadata(raw_data):
    table_name = raw_data.get('table_name', 'Unknown')
    print(f"🤖 Analyzing: {table_name}...")
    
    # Convert profile dict to string
    profile_str = json.dumps(raw_data.get('profile', {}), default=str)
    
    try:
        # Invoke LLM
        response_text = chain.invoke({
            "table_name": table_name, 
            "profile": profile_str
        })
        clean_json_text = extract_json_snippet(response_text)
        
        # Parse
        enriched_data = json.loads(clean_json_text)
        
        # Merge
        full_record = {**raw_data, "documentation": enriched_data}
        return full_record

    except json.JSONDecodeError:
        print(f"⚠️  Parsing Failed for {table_name}. \n   DEBUG: Model Output: {response_text[:100]}...")
        # Save raw response so you can see what went wrong
        return {**raw_data, "documentation": {"error": "Parse Failed", "raw_response": response_text}}
    except Exception as e:
        print(f"❌ General Error for {table_name}: {e}")
        return None

# --- Main Execution ---
if __name__ == "__main__":
    
    input_file = "./documentation/raw_metadata.json"
    output_file = "./documentation/enriched_documentation.json"
    
    if not os.path.exists(input_file):
        print(f"❌ File {input_file} not found!")
    else:
        with open(input_file, "r") as f:
            tables = json.load(f)
        
        results = []
        for table in tables:
            doc = enrich_metadata(table)
            if doc:
                results.append(doc)
        
        with open(output_file, "w") as f:
            json.dump(results, f, indent=4)
            
        print(f"\n✅ Done! Check {output_file}")