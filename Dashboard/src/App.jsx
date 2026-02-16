import React, { useState, useEffect } from 'react';
import './App.css'; // We will create this CSS file next

function App() {
  // State to store the data from the API
  const [databases, setDatabases] = useState([]);
  const [selectedDbId, setSelectedDbId] = useState(null);
  const [loading, setLoading] = useState(true); // To show a loading state
  const [error, setError] = useState(null);

  // Fetch data when the component mounts
  useEffect(() => {
    fetch('http://localhost:5000/api/databases')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setDatabases(data);
        // Automatically select the first database if data exists
        if (data.length > 0) {
          setSelectedDbId(data[0].id);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []); // Empty dependency array means this runs once on load

  // Helper to find the selected DB
  const selectedDb = databases.find(db => db.id === selectedDbId);

  // --- RENDER LOGIC ---

  if (loading) return <div className="app-container">Loading...</div>;
  if (error) return <div className="app-container">Error: {error}</div>;
  if (!selectedDb) return <div className="app-container">No databases found.</div>;

  return (
    <div className="app-container">
      {/* --- HEADER --- */}
      <header className="top-bar">
        <h1>Database Manager</h1>
      </header>

      <div className="main-layout">
        {/* --- LEFT SIDEBAR (Databases) --- */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <h2>Databases</h2>
          </div>
          <ul className="db-list">
            {databases.map((db) => (
              <li 
                key={db.id} 
                className={`db-item ${selectedDbId === db.id ? 'active' : ''}`}
                onClick={() => setSelectedDbId(db.id)}
              >
                <span className="icon">🗄️</span>
                {db.name}
              </li>
            ))}
          </ul>
        </aside>

        {/* --- RIGHT CONTENT (Tables) --- */}
        <main className="content-area">
          <div className="content-header">
            <h2>
              Tables in: <span>{selectedDb.name}</span>
              <span className="badge" style={{ marginLeft: '15px' }}>{selectedDb.tables.length} tables found</span>
            </h2>
          </div>

          <div className="table-grid">
            {selectedDb.tables.map((table, index) => (
              <div key={index} className="table-card">
                <div className="card-header">
                  <span className="icon">📄</span>
                  <h3>{table.name}</h3>
                </div>
                <div className="card-details">
                  <p><strong>Rows:</strong> {table.rows.toLocaleString()}</p>
                  <p><strong>Size:</strong> {table.size}</p>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;