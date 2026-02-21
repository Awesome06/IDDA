import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// 1. Import Common UI Elements
// THE FIX: Header is removed from here because it is now handled locally within pages like HomePage
import Footer from './components/common/Footer';

// 2. Import Page Components
import EntryForm from './components/EntryForm';
import HomePage from './components/HomePage';
import LinkingPage from './components/LinkingPage';

// 3. Global Style Paths
import './styles/index.css';
import './styles/App.css'; 

// 4. Import Custom Hooks
import { useIddaStatus } from './hooks/useIddaStatus';

/**
 * IDDA PROJECT - MAIN ROOT COMPONENT
 */
const App = () => {
  // Status hook available for future use
  useIddaStatus();

  return (
    <Router>
      <div className="app-container" style={styles.appContainer}>
        {/* THE CHANGE: 
            The global <Header /> is removed. 
            The HomePage now manages its own unified navigation bar 
            containing the logo, title, and search bar.
        */}

        {/* Main Content Area with Route Switching */}
        <main className="main-content fade-in" style={styles.mainContent}>
          <Routes>
            {/* Initial Entry Form (Entry Point) */}
            <Route path="/" element={<EntryForm />} />

            {/* Main Dashboard - Now contains the unified single-line header */}
            <Route path="/home" element={<HomePage />} />

            {/* Specialized Data Linking Page */}
            <Route path="/linking" element={<LinkingPage />} />

            {/* Fallback: Redirect any unknown URL to the Entry Form */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        {/* Global Footer remains at the bottom of the layout */}
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
    // Adjusting padding since the global header is gone
    minHeight: '100vh', 
  }
};

export default App;