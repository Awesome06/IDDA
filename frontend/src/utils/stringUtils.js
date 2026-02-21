// src/utils/stringUtils.js

/**
 * Converts a string from various cases (camelCase, snake_case, kebab-case)
 * to Title Case.
 * @param {string} str The input string.
 * @returns {string} The Title Cased string.
 */
export const toTitleCase = (str) => {
  if (!str) return '';

  const spaced = String(str)
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2') // For acronyms like HTTPRequest -> HTTP Request
    .replace(/([a-z\d])([A-Z])/g, '$1 $2') // For camelCase -> camel Case
    .replace(/[_-]+/g, ' ') // For snake_case or kebab-case
    .trim();

  if (!spaced) return '';

  return spaced
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter of each word
    .join(' ');
};
