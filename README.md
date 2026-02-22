# Alphabetic - Intelligent Data Agent

A smart, AI-powered tool that automatically connects to your database, analyzes its structure, and generates easy-to-understand documentation and insights. Ask questions about your data in plain English and get instant answers.

![Application Architecture](docs/flowDiagram.png)

## ✨ Features

- **Connect to Anything**: Works with any database supported by SQLAlchemy (PostgreSQL, MySQL, SQLite, SQL Server, etc.).
- **Automatic Discovery**: Scans and lists all schemas, tables, and views in your database.
- **AI-Powered Analysis**: For any table or view, the agent generates:
    - **Key Metrics**: Total rows, column count, data completeness, and duplicate row count.
    - **Business Summary**: A business-friendly summary explaining what the data represents and its potential use cases.
    - **Schema Explanation**: A plain-English breakdown of the table's columns and data types.
- **Interactive Chat Agent**: Ask natural language questions about your database (e.g., "What tables have customer information?" or "Explain the schema for the products table").
- **Dual Chat Modes**: Choose between a 'Summary' mode for high-level answers based on metadata and a powerful 'SQL' mode that generates and executes queries for precise, data-driven answers.
- **SQL Self-Correction**: The SQL chat agent can analyze its own query errors, correct them, and retry, significantly improving success rates for complex questions.
- **Smart Caching**: Analysis results are cached to provide instant responses on subsequent views.

## 🛠️ Tech Stack

- **Backend**: Python, FastAPI, SQLAlchemy, Pandas
- **Frontend**: React, Vite, Axios
- **AI**: Llama 3 and Code Llama running locally via [Ollama](https://ollama.com/)

## 📋 Prerequisites

- [Python 3.8+](https://www.python.org/downloads/)
- [Node.js and npm](https://nodejs.org/en)
- [Ollama](https://ollama.com/) installed and running on your machine.

## 🚀 Getting Started

Follow these steps to get the project up and running on your local machine.

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/Intelligent_Data_Dictionary_Agent.git
cd Intelligent_Data_Dictionary_Agent
```

### 2. Set up the AI Model

You need to have the Llama 3 and Code Llama models available through Ollama.

```bash
# Download the required AI models
ollama pull llama3
ollama pull codellama

# Keep this terminal open or run it as a background service
ollama serve
```

### 3. Set up the Backend

The backend is a Python FastAPI server.

```bash
# Navigate to the backend directory
cd backend
# Create and activate a virtual environment (recommended)
python -m venv .venv
# On Windows: .\.venv\Scripts\activate
# On macOS/Linux: source .venv/bin/activate

# Install the required Python packages
pip install -r requirements.txt

# You will also need a database driver for SQLAlchemy to connect to your database.
# Install the one you need, for example:
# pip install psycopg2-binary  # For PostgreSQL
# pip install pyodbc           # For SQL Server on Windows
# pip install pymssql          # For SQL Server on Linux/macOS

# Run the backend server
python main.py
```
The backend will be running at `http://localhost:8000`.

### 4. Set up the Frontend

The frontend is a React application

```bash
# Navigate to the frontend directory from the root
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```

### 5. Access the Application

Open your web browser and navigate to **`http://localhost:5173`** (or the address shown in your terminal after running `npm run dev`).

## 📖 How to Use

1.  **Connect**: On the landing page, enter the full SQLAlchemy connection string for your database and click "Connect & Scan".
2.  **Explore**: The dashboard will appear, showing all the schemas found in your database. Select a schema from the left sidebar to view its tables and views.
3.  **Analyze**: Click on any table or view card. The application will perform a detailed analysis and display the metrics, AI summary, and schema explanation.
4.  **Chat**: Click the "Chat" button on the dashboard. You can now ask questions about your database. The agent uses one of two modes to answer:
    -   **Summary Mode**: This mode is best for general questions about your database structure or high-level concepts. It uses AI-generated summaries of your tables to provide answers without running new queries. It's fast and good for exploration.
    -   **SQL Mode**: This mode is for specific, quantitative questions (e.g., "How many orders were placed last month?"). It generates a SQL query, executes it against your database, and then provides a natural language summary of the results. If the query fails, it will attempt to fix itself and retry.
