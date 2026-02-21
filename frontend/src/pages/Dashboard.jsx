import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const tables = JSON.parse(localStorage.getItem('tables') || "[]");

  return (
    <div className="dashboard-container">
      
      {/* Header section matching the screenshot */}
      <div className="dashboard-header">
        <svg 
          className="dashboard-header-icon"
          fill="currentColor" 
          viewBox="0 0 20 20" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"></path>
        </svg>
        <h2 className="dashboard-title">
          Available Tables
        </h2>
      </div>

      {/* Main Grid Container */}
      <div className="tables-grid-container">
        
        {tables.map(table => (
          <div 
            key={table} 
            onClick={() => navigate(`/table/${table}`)}
            className="table-card"
          >
            {/* Truncated Title */}
            <h3 title={table} className="table-card-title">
              {table}
            </h3>
            
            {/* Truncated Subtext */}
            <p className="table-card-subtext">
              Click to analyze with AI
            </p>
          </div>
        ))}
        
      </div>
    </div>
  );
}