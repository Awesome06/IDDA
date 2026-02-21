import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

// Reusable component for loading state
const LoadingSpinner = ({ message }) => (
  <div className="loading-overlay">
    <div className="loading-spinner-container">
      <div className="loading-spinner"></div>
      <p className="loading-message">{message}</p>
    </div>
  </div>
);

// Reusable component for metric cards
function MetricCard({ title, value }) {
  return (
    <div className="analysis-card metric-card">
      <h3 className="metric-card-title">{title}</h3>
      <p className="metric-card-value">{value}</p>
    </div>
  );
}

export default function TableView() {
  const { schemaName, itemName } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (force = false) => {
      setLoading(true);
      setError(null);
      const dbUrl = localStorage.getItem('dbUrl');
      if (!dbUrl) {
        navigate('/');
        return;
      }
  
      try {
        const res = await axios.post(`http://localhost:8000/analyze/${schemaName}/${itemName}`, { 
          connection_string: dbUrl,
          force_rerun: force
        });
        setData(res.data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.detail || 'Failed to fetch analysis. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [navigate, schemaName, itemName]
  );

  useEffect(() => {
    fetchData(false); // Initial fetch, don't force rerun
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData(true); // Force a rerun
  };

  if (loading && !data) {
    return <LoadingSpinner message="Generating AI Analysis... (This may take a moment)" />;
  }

  if (error && !data) {
    return (
      <div className="table-view-page">
        <header className="table-view-header">
          <button onClick={() => navigate('/dashboard')} className="back-button">
            &larr; Dashboard
          </button>
          <h1 className="table-view-title">Error</h1>
          <div className="header-actions"></div>
        </header>
        <main className="table-view-content error-content">
          <h2>Could not load analysis</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/dashboard')} className="dashboard-chat-button">Go Back</button>
        </main>
      </div>
    );
  }

  return (
    <div className="table-view-page">
      <header className="table-view-header">
        <button onClick={() => navigate('/dashboard')} className="back-button">
          &larr; Dashboard
        </button>
        <h1 className="table-view-title">
          Analysis: <span className="font-mono">{schemaName === '_default_' ? '' : `${schemaName}.`}{itemName}</span>
        </h1>
        <div className="header-actions">
          <button onClick={handleRefresh} className="refresh-button" disabled={loading}>
            {/* Simple refresh icon */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0M2.985 19.644L6.166 16.46" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.977 4.356h4.992v.001M21.015 4.356v4.992m0 0h-4.992m4.992 0l-3.181-3.183a8.25 8.25 0 00-11.664 0M21.015 4.356L17.834 7.539" />
            </svg>
            Refresh
          </button>
        </div>
      </header>
      
      <main className="table-view-content">
        {loading ? (
          <div className="table-view-loading-container">
            <p className="loading-message">Waiting for Analysis</p>
            <div className="loading-spinner"></div>
          </div>
        ) : error ? (
          <div className="error-content">
            <h2>Could not refresh analysis</h2>
            <p>{error}</p>
            <button onClick={handleRefresh} className="dashboard-chat-button">Try Again</button>
          </div>
        ) : (
          data && (
            <>
              {/* SECTION 1: Top (Business Summary) */}
              <section className="analysis-card">
                <h2 className="analysis-card-header">📢 Executive Summary</h2>
                <div className="prose">
                  <ReactMarkdown>{data.summary}</ReactMarkdown>
                </div>
              </section>

              {/* SECTION 2: Middle (Dashboard Metrics) */}
              <section className="metric-grid">
                <MetricCard title="Total Rows" value={data.metrics.total_rows.toLocaleString()} />
                <MetricCard title="Completeness" value={`${data.metrics.completeness}%`} />
                <MetricCard title="Columns" value={data.metrics.columns} />
                <MetricCard title="Duplicate Rows" value={data.metrics.duplicate_rows.toLocaleString()} />
              </section>

              {/* SECTION 3: Bottom (Schema & Explanation) */}
              <section className="analysis-card">
                <h2 className="analysis-card-header">🧬 Schema Analysis</h2>
                <div className="schema-grid">
                  <div className="prose">
                    <h3 className="schema-subheader">AI Explanation</h3>
                    <ReactMarkdown>{data.schema_explanation}</ReactMarkdown>
                  </div>
                  <div className="raw-schema-container">
                    <h3 className="schema-subheader">Technical Types</h3>
                    <pre className="raw-schema-pre">{JSON.stringify(data.raw_schema, null, 2)}</pre>
                  </div>
                </div>
              </section>
            </>
          )
        )}
      </main>
    </div>
  );
}