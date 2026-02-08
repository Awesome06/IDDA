import React from 'react';
import IddaIcon from '../../components/IconManager'; //

const DictionaryManager = ({ dataItems = [] }) => {
  // Logic to categorize data regardless of original developer names
  const categorizeData = (items) => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const dictionary = {};
    
    alphabet.forEach(letter => dictionary[letter] = []);

    items.forEach(item => {
      // Use the 'contentType' property to decide the letter
      const firstLetter = item.contentType.charAt(0).toUpperCase();
      if (dictionary[firstLetter]) {
        dictionary[firstLetter].push(item);
      }
    });
    return dictionary;
  };

  const categorized = categorizeData(dataItems);

  return (
    <div style={styles.grid}>
      {Object.keys(categorized).map(letter => (
        categorized[letter].length > 0 && (
          <div key={letter} style={styles.card}>
            <div style={styles.letterHeader}>
              <IddaIcon name="dictionary" size="18px" />
              <span style={styles.letterText}>{letter}</span>
            </div>
            <ul style={styles.list}>
              {categorized[letter].map((file, idx) => (
                <li key={idx} style={styles.listItem}>
                  <IddaIcon name="elements" size="14px" />
                  <span title={`Original Name: ${file.fileName}`}>{file.contentType}</span>
                </li>
              ))}
            </ul>
          </div>
        )
      ))}
    </div>
  );
};

const styles = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' },
  card: { background: '#fff', border: '1px solid #eee', borderRadius: '8px', padding: '15px' },
  letterHeader: { display: 'flex', alignItems: 'center', borderBottom: '1px solid #f0f2f5', paddingBottom: '8px', marginBottom: '10px' },
  letterText: { marginLeft: '10px', fontWeight: 'bold', fontSize: '18px', color: '#2c3e50' },
  list: { listStyle: 'none', padding: 0, margin: 0 },
  listItem: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#555', marginBottom: '5px' }
};

export default DictionaryManager;