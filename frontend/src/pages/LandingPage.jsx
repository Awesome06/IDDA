import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function LandingPage() {
  // Default string for testing (SQL Server example)
  const [dbUrl, setDbUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleConnect = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await axios.post('http://localhost:8000/connect', { connection_string: dbUrl });
      // Store connection string in localStorage for simplicity in this demo
      localStorage.setItem('dbUrl', dbUrl); 
      localStorage.setItem('schemas', JSON.stringify(res.data.schemas));
      navigate('/dashboard');
    } catch (err) {
      const detail = err.response?.data?.detail || err.message;
      setError(`Connection Failed: ${detail}`);
    } finally {
      setIsLoading(false);
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
        disabled={isLoading}
      />
      <button 
        onClick={handleConnect}
        className="landing-page-button"
        disabled={isLoading || !dbUrl.trim()}
      >
        {isLoading ? 'Connecting...' : 'Connect & Scan'}
      </button>
      {error && <p className="landing-page-error">{error}</p>}
    </div>
  </div>
);
}