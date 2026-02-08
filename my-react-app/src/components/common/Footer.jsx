import React from 'react';

const Footer = () => {
  return (
    <footer style={styles.footer}>
      <div style={styles.companyInfo}>
        <strong>IDDA Project</strong> © 2026
      </div>
      <div style={styles.contactBar}>
        <span style={styles.label}>Reception:</span>
        <a href="tel:+123456789" style={styles.number}>+1 (234) 567-890</a>
        <span style={styles.separator}>|</span>
        <a href="tel:+198765432" style={styles.number}>+1 (987) 654-321</a>
      </div>
    </footer>
  );
};

const styles = {
  footer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    width: '100%',
    backgroundColor: 'rgba(44, 62, 80, 0.95)', // Semi-transparent slate
    color: 'white',
    padding: '10px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '14px',
    zIndex: 1000,
    backdropFilter: 'blur(5px)', // Modern glass effect
  },
  companyInfo: {
    letterSpacing: '0.5px'
  },
  contactBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  label: {
    color: '#bdc3c7'
  },
  number: {
    color: '#3498db',
    textDecoration: 'none',
    fontWeight: '500'
  },
  separator: {
    color: '#7f8c8d'
  }
};

export default Footer;