import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

export default function TableView() {
  const { tableName } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const dbUrl = localStorage.getItem('dbUrl');
      try {
        const res = await axios.post(`http://localhost:8000/analyze/${tableName}`, { 
          connection_string: dbUrl 
        });
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tableName]);

  if (loading) return <div className="text-center mt-20 text-xl animate-pulse">Generating AI Analysis... (This may take a moment)</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      
      {/* SECTION 1: Top (Business Summary) */}
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100">
        <h2 className="text-2xl font-bold text-blue-800 mb-4">📢 Executive Summary</h2>
        <div className="prose text-gray-700">
          <ReactMarkdown>{data.summary}</ReactMarkdown>
        </div>
      </section>

      {/* SECTION 2: Middle (Dashboard Metrics) */}
      <section className="grid grid-cols-3 gap-4">
        <MetricCard title="Total Rows" value={data.metrics.total_rows} />
        <MetricCard title="Completeness" value={`${data.metrics.completeness}%`} color="text-green-600" />
        <MetricCard title="Columns" value={data.metrics.columns} />
      </section>

      {/* SECTION 3: Bottom (Schema & Explanation) */}
      <section className="bg-white p-6 rounded shadow border">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">🧬 Schema Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="prose text-sm text-gray-600">
             <h3 className="font-semibold text-gray-900">AI Explanation</h3>
             <ReactMarkdown>{data.schema_explanation}</ReactMarkdown>
          </div>
          <div className="bg-gray-50 p-4 rounded text-xs font-mono">
            <h3 className="font-semibold text-gray-900 mb-2">Technical Types</h3>
            <pre>{JSON.stringify(data.raw_schema, null, 2)}</pre>
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ title, value, color = "text-gray-900" }) {
  return (
    <div className="bg-white p-6 rounded shadow text-center">
      <h3 className="text-gray-500 text-sm uppercase tracking-wider">{title}</h3>
      <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
    </div>
  );
}