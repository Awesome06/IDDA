import React from 'react';
import IddaLogo from '../../assets/IddaLogo';

const Header = () => {
  return (
    <header style={styles.header}>
      <div style={styles.logoContainer}>
        <IddaLogo height="50px" />
        <h1 style={styles.brandName}>Intelligent Data Dictionary</h1>
      </div>
    </header>
  );
};

const styles = {
  header: {
    width: '100%',
    padding: '10px 40px',
    backgroundColor: '#ffffff',
    borderBottom: '2px solid #2c3e50',
    display: 'flex',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  brandName: {
    fontSize: '1.4rem',
    color: '#2c3e50',
    margin: 0,
    fontWeight: '600'
  }
};

export default Header;