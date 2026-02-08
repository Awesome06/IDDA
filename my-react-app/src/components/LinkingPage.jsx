import React, { useState } from 'react';
import IddaIcon from './IconManager'; //

const LinkingPage = () => {
  const [sourceData, setSourceData] = useState('');
  const [targetLinks, setTargetLinks] = useState(['']); // Array to handle multiple targets

  // Function to add a new link field (the plus sign logic)
  const addTargetField = () => {
    setTargetLinks([...targetLinks, '']);
  };

  // Function to update a specific target field
  const updateTargetField = (index, value) => {
    const newTargets = [...targetLinks];
    newTargets[index] = value;
    setTargetLinks(newTargets);
  };

  const handleLinkExecution = () => {
    console.log("Linking Source:", sourceData, "to Targets:", targetLinks);
    alert(`Successfully linked ${targetLinks.length} items to ${sourceData}`);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <IddaIcon name="linking" size="40px" />
        <h2 style={styles.title}>Data Relationship Linker</h2>
        <p style={styles.subtitle}>Establish connections across the IDDA Dictionary</p>
      </header>

      <div style={styles.card}>
        {/* 1. SOURCE DATA SECTION */}
        <div style={styles.section}>
          <label style={styles.label}>1. From which data do you want to link?</label>
          <div style={styles.inputWrapper}>
            <IddaIcon name="database" size="18px" />
            <input 
              style={styles.input} 
              placeholder="e.g., Q1_Logistics_Report" 
              value={sourceData}
              onChange={(e) => setSourceData(e.target.value)}
            />
          </div>
        </div>

        <div style={styles.connectorLine}></div>

        {/* 2. TARGET DATA SECTION */}
        <div style={styles.section}>
          <label style={styles.label}>2. To which data do you want to link it?</label>
          {targetLinks.map((link, index) => (
            <div key={index} style={{...styles.inputWrapper, marginBottom: '10px'}}>
              <IddaIcon name="elements" size="18px" />
              <input 
                style={styles.input} 
                placeholder="e.g., Global_Investors_List" 
                value={link}
                onChange={(e) => updateTargetField(index, e.target.value)}
              />
            </div>
          ))}

          {/* 3. THE PLUS SIGN FOR MULTIPLE DATA */}
          <button onClick={addTargetField} style={styles.addButton}>
            <span style={{ fontSize: '24px', marginRight: '8px' }}>+</span> 
            Add Multiple Data Sources
          </button>
        </div>

        <button onClick={handleLinkExecution} style={styles.submitBtn}>
          Execute Data Link
        </button>
      </div>
    </div>
  );
};

// Styles for a clean, technical interface
const styles = {
  container: { padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#f8f9fa', minHeight: '100vh' },
  header: { textAlign: 'center', marginBottom: '30px' },
  title: { color: '#2c3e50', margin: '10px 0 5px 0' },
  subtitle: { color: '#7f8c8d', fontSize: '14px' },
  card: { backgroundColor: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', width: '100%', maxWidth: '500px' },
  section: { marginBottom: '20px' },
  label: { display: 'block', fontWeight: 'bold', marginBottom: '12px', color: '#34495e', fontSize: '14px' },
  inputWrapper: { display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '6px', padding: '8px 12px', backgroundColor: '#fff' },
  input: { border: 'none', outline: 'none', marginLeft: '10px', width: '100%', fontSize: '14px' },
  connectorLine: { height: '30px', borderLeft: '2px dashed #bdc3c7', marginLeft: '25px', marginBottom: '10px' },
  addButton: { display: 'flex', alignItems: 'center', background: 'none', border: 'none', color: '#3498db', cursor: 'pointer', fontWeight: 'bold', padding: '0', marginTop: '10px', transition: 'color 0.2s' },
  submitBtn: { width: '100%', marginTop: '30px', padding: '15px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }
};

export default LinkingPage;