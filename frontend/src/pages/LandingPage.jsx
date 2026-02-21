import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function LandingPage() {
  // Default string for testing (SQL Server example)
  const [dbUrl, setDbUrl] = useState("");
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
  <div className="landing-page-container">
    <div className="landing-page-card">
      <h1 className="landing-page-title">
        AI Database Explorer
      </h1>
      <input 
        className="landing-page-input"
        value={dbUrl} 
        onChange={(e) => setDbUrl(e.target.value)} 
        placeholder="Enter Your Database Connection String" 
      />
      <button 
        onClick={handleConnect}
        className="landing-page-button"
      >
        Connect & Scan
      </button>
    </div>
  </div>
);
}