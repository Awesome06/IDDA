import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const schemas = JSON.parse(localStorage.getItem('schemas') || "[]");

  const handleItemClick = (schemaName, itemName) => {
    navigate(`/table/${schemaName}/${itemName}`);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {schemas.map(schema => (
        <div key={schema.schema_name} className="mb-12">
          <div className="flex items-center mb-4 border-b pb-2">
            <svg className="w-6 h-6 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2z" /><path d="M3 7l9 6 9-6" /></svg>
            <h2 className="text-2xl font-bold text-gray-800">
              Schema: <span className="font-mono bg-gray-100 px-2 py-1 rounded text-blue-600">{schema.schema_name === '_default_' ? 'default' : schema.schema_name}</span>
            </h2>
          </div>

          {/* Tables */}
          {schema.tables.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-gray-600 mb-3 ml-9">Tables</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ml-9">
                {schema.tables.map(table => (
                  <div 
                    key={table} 
                    onClick={() => handleItemClick(schema.schema_name, table)}
                    className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-500 transition-all cursor-pointer"
                  >
                    <h4 title={table} className="text-md font-semibold text-gray-900 truncate">
                      {table}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Click to analyze with AI
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Views */}
          {schema.views.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-gray-600 mt-6 mb-3 ml-9">Views</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ml-9">
                {schema.views.map(view => (
                  <div 
                    key={view} 
                    onClick={() => handleItemClick(schema.schema_name, view)}
                    className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-500 transition-all cursor-pointer"
                  >
                    <h4 title={view} className="text-md font-semibold text-gray-900 truncate">
                      {view}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Click to analyze with AI
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
          
          {schema.tables.length === 0 && schema.views.length === 0 && (
            <p className="ml-9 text-gray-500">No tables or views found in this schema.</p>
          )}

        </div>
      ))}
    </div>
  );
}