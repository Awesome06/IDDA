import React, { useState } from 'react';
// THE FIX: Ensure path is correct and component is USED below
import IddaLogo from '../assets/IddaLogo';
import IddaIcon from './IconManager'; 

const HomePage = () => {
  const [filterType, setFilterType] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const clients = {
    Investors: ['Alpha Ventures', 'Global Capital'],
    Buyers: ['Retail Corp', 'Prime Goods'],
    Shareholders: ['Jane Doe', 'Investment Trust']
  };

  return (
    <div style={styles.pageContainer}>
      {/* C. TOP NAVIGATION BAR */}
      <nav style={styles.topNav}>
        {/* INTEGRATED LOGO HERE */}
        <div style={styles.logoSection}>
          <IddaLogo height="40px" />
        </div>

        <div style={styles.searchBar}>
          <IddaIcon name="search" size="20px" />
          <input 
            type="text" 
            placeholder="Search within IDDA..." 
            style={styles.searchInput}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={styles.toolIcons}>
          <div title="Auto Documentation"><IddaIcon name="autodocs" size="24px" /></div>
          <div title="Bookmark Work"><IddaIcon name="bookmark" size="24px" /></div>
          <div title="Edit Data"><IddaIcon name="edit" size="24px" /></div>
          <div title="Data Linking"><IddaIcon name="linking" size="24px" /></div>
        </div>
      </nav>

      <div style={styles.contentLayout}>
        {/* A. LEFT SIDEBAR */}
        <aside style={styles.sidebar}>
          <div style={styles.sectionHeader}>
            <IddaIcon name="filter" size="18px" />
            <span style={{marginLeft: '8px'}}>Client Filters</span>
          </div>
          
          {Object.keys(clients).map(type => (
            <div key={type} style={styles.filterGroup}>
              <button 
                onClick={() => setFilterType(type)}
                style={{...styles.filterBtn, fontWeight: filterType === type ? 'bold' : 'normal'}}
              >
                <IddaIcon name="tags" size="14px" /> {type}
              </button>
              {filterType === type && (
                <ul style={styles.clientList}>
                  {clients[type].map(name => <li key={name} style={styles.clientItem}>{name}</li>)}
                </ul>
              )}
            </div>
          ))}
        </aside>

        {/* B. CENTER DICTIONARY AREA */}
        <main style={styles.mainArea}>
          {filterType ? (
            <div style={styles.dictionaryContainer}>
              <header style={styles.dictHeader}>
                <IddaIcon name="dictionary" size="30px" />
                <h2 style={{marginLeft: '10px'}}>Dictionary: {filterType}</h2>
              </header>
              
              <div style={styles.alphabetGrid}>
                {['A', 'B', 'C', 'L'].map(letter => (
                  <section key={letter} style={styles.dictSection}>
                    <h3 style={styles.alphaLetter}>{letter}</h3>
                    <div style={styles.dataPlaceholder}>
                      {letter === 'L' ? 'Logistics Data File' : letter === 'A' ? 'Accounts Record' : 'Data Entry'}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          ) : (
            <div style={styles.emptyState}>
              <IddaIcon name="database" size="50px" />
              <p>Please select a Client Filter to open the Dictionary</p>
            </div>
          )}
        </main>
      </div>

      {/* D. BOTTOM LEFT CHATBOX */}
      <div style={styles.aiChatbox}>
        <IddaIcon name="chat" size="24px" />
        <span style={{marginLeft: '10px'}}>IDDA AI Help</span>
      </div>
    </div>
  );
};

const styles = {
  pageContainer: { height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f0f2f5', fontFamily: 'Segoe UI, sans-serif' },
  topNav: { height: '70px', backgroundColor: '#fff', borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', position: 'sticky', top: 0, zIndex: 10 },
  logoSection: { display: 'flex', alignItems: 'center', marginRight: '20px' },
  searchBar: { display: 'flex', alignItems: 'center', backgroundColor: '#f0f2f5', padding: '5px 15px', borderRadius: '20px', width: '40%' },
  searchInput: { border: 'none', background: 'none', marginLeft: '10px', outline: 'none', width: '100%' },
  toolIcons: { display: 'flex', gap: '20px', color: '#555' },
  contentLayout: { display: 'flex', flex: 1, overflow: 'hidden' },
  sidebar: { width: '240px', backgroundColor: '#fff', borderRight: '1px solid #ddd', padding: '20px', overflowY: 'auto' },
  sectionHeader: { display: 'flex', alignItems: 'center', fontWeight: 'bold', marginBottom: '20px', color: '#2c3e50' },
  filterGroup: { marginBottom: '15px' },
  filterBtn: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#444', fontSize: '15px' },
  clientList: { listStyle: 'none', paddingLeft: '25px', marginTop: '5px', color: '#666', fontSize: '14px' },
  clientItem: { padding: '3px 0' },
  mainArea: { flex: 1, padding: '30px', overflowY: 'auto' },
  dictionaryContainer: { backgroundColor: '#fff', borderRadius: '12px', padding: '25px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  dictHeader: { display: 'flex', alignItems: 'center', marginBottom: '25px', borderBottom: '2px solid #f0f2f5', paddingBottom: '15px' },
  alphabetGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' },
  dictSection: { border: '1px solid #eee', borderRadius: '8px', padding: '15px' },
  alphaLetter: { margin: '0 0 10px 0', color: '#2c3e50', borderBottom: '1px solid #eee' },
  dataPlaceholder: { fontSize: '13px', color: '#888', fontStyle: 'italic' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' },
  aiChatbox: { position: 'fixed', bottom: '20px', left: '20px', backgroundColor: '#2c3e50', color: 'white', padding: '12px 20px', borderRadius: '30px', display: 'flex', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', cursor: 'pointer', zIndex: 100 }
};

export default HomePage;