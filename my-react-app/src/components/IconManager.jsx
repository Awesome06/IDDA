import React from 'react';

// Import all icon assets
import dictionaryIcon from '../assets/icons/dictionary.png';
import databaseIcon from '../assets/icons/database.png';
import elementsIcon from '../assets/icons/elements.png';
import tagsIcon from '../assets/icons/tags.png';
import docsIcon from '../assets/icons/auto-docs.png';
import chatIcon from '../assets/icons/chatbox.png';
import searchIcon from '../assets/icons/search.png';
import linkingIcon from '../assets/icons/linking.png';
import filterIcon from '../assets/icons/filter.png';
import bookmarkIcon from '../assets/icons/bookmark.png';

// NEW IMPORTS: Ensure these files exist in src/assets/icons/
import shareIcon from '../assets/icons/share.png';
import editIcon from '../assets/icons/edit.png';

const IddaIcon = ({ name, size = '24px', className = '', onClick }) => {
  // Centralized icon map for the IDDA project
  const icons = {
    dictionary: dictionaryIcon,
    database: databaseIcon,
    elements: elementsIcon,
    tags: tagsIcon,
    autodocs: docsIcon,
    chat: chatIcon,
    search: searchIcon,
    linking: linkingIcon,
    filter: filterIcon,
    bookmark: bookmarkIcon,
    
    // New keys for Share and Edit functionality
    share: shareIcon,
    edit: editIcon,
    
    // Aliases to prevent crashes if different labels are used in code
    update: editIcon, 
    change: editIcon
  };

  // Convert name to lowercase and handle undefined/null names
  const iconKey = name ? name.toLowerCase() : '';
  const selectedIcon = icons[iconKey];

  if (!selectedIcon) {
    console.warn(`Icon "${name}" not found in IddaIcon component.`);
    // Return null or a fallback placeholder to prevent the UI from "exploding"
    return null; 
  }

  return (
    <img 
      src={selectedIcon} 
      alt={`${name} icon`} 
      className={`idda-icon ${className}`}
      onClick={onClick}
      style={{ 
        width: size, 
        height: 'auto', 
        display: 'inline-block',
        cursor: onClick ? 'pointer' : 'default',
        objectFit: 'contain'
      }} 
    />
  );
};

export default IddaIcon;