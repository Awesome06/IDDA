import React, { useState } from 'react';
// THE FIX: Import the logo and ensure the path matches your project structure
import IddaLogo from '../assets/IddaLogo';
// THE FIX: Import useNavigate for routing
import { useNavigate } from 'react-router-dom';

const EntryForm = () => {
  const navigate = useNavigate(); // Initialize the navigation hook
  
  const [formData, setFormData] = useState({
    department: '',
    name: '',
    id_number: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 1. Log the data for debugging
    console.log('IDDA Project - Form Submitted:', formData);
    
    // 2. Save user info to localStorage so the app "remembers" you on the Home page
    localStorage.setItem('idda_user', JSON.stringify(formData));

    // 3. THE FIX: Programmatically move the user to the main dashboard
    navigate('/home'); 
  };

  return (
    <div style={styles.container}>
      {/* BACKGROUND LOGO: Acting as a subtle watermark */}
      <div style={styles.backgroundWatermark}>
        <IddaLogo height="500px" />
      </div>

      <main style={styles.main}>
        <div style={styles.formHeader}>
          {/* Logo integrated above the form title */}
          <IddaLogo height="60px" style={{ marginBottom: '15px' }} />
          <h2 style={styles.formTitle}>Project Entry</h2>
          <p style={styles.subtitle}>Please enter your details to access the IDDA dashboard</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Which Department?</label>
            <input 
              type="text" 
              placeholder="e.g. Computer Science"
              style={styles.input}
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Name</label>
            <input 
              type="text" 
              placeholder="Enter your full name"
              style={styles.input}
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>ID Number</label>
            <input 
              type="text" 
              placeholder="Enter ID Number"
              style={styles.input}
              value={formData.id_number}
              onChange={(e) => setFormData({...formData, id_number: e.target.value})}
              required
            />
          </div>

          <button type="submit" style={styles.button}>
            Access IDDA Dashboard
          </button>
        </form>
      </main>
    </div>
  );
};

// Layout Styles
const styles = {
  container: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    position: 'relative', 
    overflow: 'hidden',
    backgroundColor: '#f8fafc'
  },
  backgroundWatermark: {
    position: 'absolute',
    zIndex: 0,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none', 
    opacity: 0.05 
  },
  main: {
    width: '100%',
    maxWidth: '450px',
    position: 'relative',
    zIndex: 1 
  },
  formHeader: {
    textAlign: 'center',
    marginBottom: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  formTitle: {
    color: '#2c3e50',
    marginBottom: '5px',
    fontSize: '1.8rem'
  },
  subtitle: {
    color: '#7f8c8d',
    fontSize: '0.95rem'
  },
  form: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    border: '1px solid #eee'
  },
  inputGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: '#34495e',
    fontWeight: '600',
    fontSize: '0.9rem'
  },
  input: {
    width: '100%',
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #dcdde1',
    boxSizing: 'border-box',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  button: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    transition: 'background 0.3s ease',
    marginTop: '10px'
  }
};

export default EntryForm;