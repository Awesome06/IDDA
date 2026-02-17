import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function LandingPage() {
  // Default string for testing (Postgres example)
  const [dbUrl, setDbUrl] = useState("postgresql://user:password@localhost/dbname");
  const navigate = useNavigate();

  const handleConnect = async () => {
    try {
      const res = await axios.post('http://localhost:8000/connect', { connection_string: dbUrl });
      // Store connection string in localStorage for simplicity in this demo
      localStorage.setItem('dbUrl', dbUrl); 
      localStorage.setItem('tables', JSON.stringify(res.data.tables));
      navigate('/dashboard');
    } catch (err) {
      alert("Connection Failed: " + err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold mb-8 text-blue-600">AI Database Explorer</h1>
      <div className="bg-white p-8 rounded shadow-lg w-96">
        <label className="block mb-2 font-semibold">Database Connection String</label>
        <input 
          className="w-full border p-2 rounded mb-4" 
          value={dbUrl} 
          onChange={(e) => setDbUrl(e.target.value)} 
          placeholder="postgresql://..." 
        />
        <button 
          onClick={handleConnect}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
        >
          Connect & Scan
        </button>
      </div>
    </div>
  );
}