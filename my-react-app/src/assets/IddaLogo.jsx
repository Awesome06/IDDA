import React from 'react';
// This assumes your image is physically sitting in: src/assets/logos/idda-logo.png
import iddaLogo from './idda-logo.png';

const IddaLogo = ({ height = '100px', className = '' }) => {
  return (
    <div className={`logo-container ${className}`} style={{ textAlign: 'center' }}>
      <img 
        src={iddaLogo} 
        alt="Intelligent Data Dictionary Agent Logo" 
        style={{ 
          height: height, 
          width: 'auto', 
          objectFit: 'contain',
          filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.1))' 
        }} 
      />
    </div>
  );
};

export default IddaLogo;