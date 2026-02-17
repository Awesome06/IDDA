import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const tables = JSON.parse(localStorage.getItem('tables') || "[]");

  return (
    <div className="p-10 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Available Tables</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tables.map(table => (
          <div 
            key={table} 
            onClick={() => navigate(`/table/${table}`)}
            className="bg-white p-6 rounded shadow cursor-pointer hover:shadow-lg hover:border-blue-500 border border-transparent transition"
          >
            <h3 className="text-xl font-semibold text-gray-700">{table}</h3>
            <p className="text-gray-400 text-sm mt-2">Click to analyze with AI</p>
          </div>
        ))}
      </div>
    </div>
  );
}