import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';


// 1. Import Common UI Elements (Header and Footer are global)
import Header from './components/common/Header';
import Footer from './components/common/Footer';

// 2. Import Page Components
import EntryForm from './components/EntryForm';
import HomePage from './components/HomePage';
import LinkingPage from './components/LinkingPage';

// 3. THE FIX: Corrected Global Style Paths
// Ensure these files exist inside src/styles/
import './styles/index.css';
import './styles/App.css'; 

// 4. Import Custom Hooks
import { useIddaStatus } from './hooks/useIddaStatus';

/**
 * IDDA PROJECT - MAIN ROOT COMPONENT
 */
const App = () => {
  // Use the hook to manage global state (connection, user info)
  // Fallback object prevents the app from crashing if the hook returns undefined
  const { isConnected, user } = useIddaStatus() || { isConnected: false, user: null };

  return (
    <Router>
      <div className="app-container" style={styles.appContainer}>
        {/* Constant Header: Appears on every page */}
        <Header connectionStatus={isConnected} userName={user?.name} />

        {/* Main Content Area with Route Switching */}
        <main className="main-content fade-in" style={styles.mainContent}>
          <Routes>
            {/* Initial Entry Form (Entry Point) */}
            <Route path="/" element={<EntryForm />} />

            {/* Main Dashboard - Accessed after EntryForm submission */}
            <Route path="/home" element={<HomePage />} />

            {/* Specialized Data Linking Page */}
            <Route path="/linking" element={<LinkingPage />} />

            {/* Fallback: Redirect any unknown URL to the Entry Form */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        {/* Global Footer */}
        <Footer />
      </div>
    </Router>
  );
};

// Layout Styling for the App Shell
const styles = {
  appContainer: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    position: 'relative'
  },
  mainContent: {
    flex: 1,
    paddingBottom: '20px', // Space for Footer
    minHeight: 'calc(100vh - 140px)', 
  }
};

export default App;