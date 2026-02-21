import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const schemas = JSON.parse(localStorage.getItem('schemas') || "[]");

  const [selectedSchemaName, setSelectedSchemaName] = useState(
    schemas.length > 0 ? schemas[0].schema_name : null
  );

  const handleItemClick = (schemaName, itemName) => {
    navigate(`/table/${schemaName}/${itemName}`);
  };

  const selectedSchema = schemas.find(s => s.schema_name === selectedSchemaName);

  return (
    <div className="dashboard-page">
      {/* Header */}
      <header className="dashboard-header">
        <div className="flex-1"></div> {/* Left Spacer */}
        <h1 className="dashboard-header-title">Intelligent Data Agent</h1>
        <div className="dashboard-header-actions">
          <button
            className="dashboard-chat-button"
            onClick={() => navigate('/chat')}
          >
            Chat
          </button>
        </div>
      </header>

      <div className="dashboard-main-layout">
        {/* Left Sidebar for Schemas */}
        <aside className="dashboard-sidebar">
          <h2 className="dashboard-sidebar-heading">Schemas</h2>
          <nav>
            {schemas.map((schema) => (
              <button
                key={schema.schema_name}
                className={`schema-button ${selectedSchemaName === schema.schema_name ? 'active' : ''}`}
                onClick={() => setSelectedSchemaName(schema.schema_name)}
              >
                {schema.schema_name === '_default_' ? 'default' : schema.schema_name}
              </button>
            ))}
          </nav>
        </aside>

        {/* Right Content Area */}
        <main className="dashboard-content-area">
          {selectedSchema ? (
            <div>
              <h2 className="dashboard-schema-title">
                {selectedSchema.schema_name === '_default_' ? 'default' : selectedSchema.schema_name}
              </h2>

              {/* Tables Grid */}
              {selectedSchema.tables && selectedSchema.tables.length > 0 && (
                <>
                  <h3 className="section-title">Tables</h3>
                  <div className="items-grid-container">
                    {selectedSchema.tables.map((table) => (
                      <div
                        key={table}
                        className="item-card"
                        onClick={() => handleItemClick(selectedSchema.schema_name, table)}
                      >
                        <div className="item-card-name">{table}</div>
                        <div className="item-card-type">TABLE</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Views Grid */}
              {selectedSchema.views && selectedSchema.views.length > 0 && (
                <>
                  <h3 className="section-title">Views</h3>
                  <div className="items-grid-container">
                    {selectedSchema.views.map((view) => (
                      <div
                        key={view}
                        className="item-card"
                        onClick={() => handleItemClick(selectedSchema.schema_name, view)}
                      >
                        <div className="item-card-name">{view}</div>
                        <div className="item-card-type">VIEW</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {(!selectedSchema.tables || selectedSchema.tables.length === 0) &&
               (!selectedSchema.views || selectedSchema.views.length === 0) && (
                <div className="empty-schema-message">
                  <p>No tables or views found in this schema.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="placeholder-message">
              <h2>{schemas.length > 0 ? 'Select a schema to view details' : 'No Schemas Found'}</h2>
              {schemas.length === 0 && <p>Please connect to a database to see schemas.</p>}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}