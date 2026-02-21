# Intelligent_Data_Dictionary_Agent

A smart, AI-powered tool that automatically connects to your database, analyzes its structure, and generates easy-to-understand documentation and insights. Ask questions about your data in plain English and get instant answers.

![Application Architecture](docs/flowDiagram.png)

## ✨ Features

- **Connect to Anything**: Works with any database supported by SQLAlchemy (PostgreSQL, MySQL, SQLite, SQL Server, etc.).
- **Automatic Discovery**: Scans and lists all schemas, tables, and views in your database.
- **AI-Powered Analysis**: For any table or view, the agent generates:
    - **Key Metrics**: Total rows, column count, data completeness, and duplicate row count.
    - **Executive Summary**: A business-friendly summary explaining what the data represents and its potential use cases.
    - **Schema Explanation**: A plain-English breakdown of the table's columns and data types.
- **Interactive Chat Agent**: Ask natural language questions about your database (e.g., "What tables have customer information?" or "Explain the schema for the products table").
- **Smart Caching**: Analysis results are cached to provide instant responses on subsequent views.

## 🛠️ Tech Stack

- **Backend**: Python, FastAPI, SQLAlchemy, Pandas
- **Frontend**: React, Vite, Axios
- **AI**: Llama 3 running locally via [Ollama](https://ollama.com/)

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

You need to have the Llama 3 model available through Ollama.

```bash
# Download the Llama 3 model
ollama pull llama3

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

# You may also need a database driver, e.g.:
# pip install psycopg2-binary  # For PostgreSQL
# pip install pymssql          # For SQL Server

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
4.  **Chat**: Click the "Chat" button on the dashboard. You can now ask questions about your database. The agent use