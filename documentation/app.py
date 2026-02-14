import streamlit as st
from langchain_community.vectorstores import Chroma
from langchain_ollama import OllamaEmbeddings, OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
from langchain_classic.chains import create_retrieval_chain
from langchain_classic.chains.combine_documents import create_stuff_documents_chain

# Page Config
st.set_page_config(page_title="Local AI Data Dictionary", layout="wide")
st.title("🤖 Enterprise Data Chat (Local)")

# Initialize Local Resources
@st.cache_resource
def load_chain():
    # 1. Setup Embeddings
    embeddings = OllamaEmbeddings(model="llama3")
    
    # 2. Setup Vector DB
    vector_db = Chroma(persist_directory="./documentation/local_chroma_db", embedding_function=embeddings)
    
    # 3. Setup LLM
    llm = OllamaLLM(model="llama3")
    
    # 4. Create Prompt (REQUIRED for create_stuff_documents_chain)
    prompt = ChatPromptTemplate.from_template("""
    Answer the user's question based strictly on the context below:
    
    <context>
    {context}
    </context>

    Question: {input}
    """)

    # 5. Build the Chains
    # First: The chain that combines docs + prompt -> answer
    document_chain = create_stuff_documents_chain(llm, prompt)
    
    # Second: The chain that retrieves docs -> feeds them to document_chain
    retrieval_chain = create_retrieval_chain(vector_db.as_retriever(), document_chain)
    
    return retrieval_chain

chain = load_chain()

# Chat UI
if "messages" not in st.session_state:
    st.session_state.messages = []

# Display History
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# Handle Input
if user_input := st.chat_input("Ask about your data..."):
    st.session_state.messages.append({"role": "user", "content": user_input})
    with st.chat_message("user"):
        st.markdown(user_input)

    with st.chat_message("assistant"):
        with st.spinner("Thinking locally..."):
            # The new chain expects a dictionary with "input"
            response = chain.invoke({"input": user_input})
            
            # The answer is in the "answer" key
            answer = response['answer']
            
            # Extract Sources if available
            sources = []
            if "context" in response:
                sources = [doc.metadata.get('source', 'Unknown') for doc in response['context']]
            
            final_reply = f"{answer}\n\n*Sources: {', '.join(set(sources))}*"
            st.markdown(final_reply)
            st.session_state.messages.append({"role": "assistant", "content": final_reply})