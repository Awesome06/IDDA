// Base URL for your Python backend (adjust port if necessary)
const API_BASE_URL = 'http://localhost:8000/api';

/**
 * IDDA Backend Service Handler
 *
 */
const apiService = {
  // 1. Fetching categorized dictionary items
  async getDictionaryData(department) {
    try {
      const response = await fetch(`${API_BASE_URL}/dictionary?dept=${department}`);
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error("Error fetching dictionary:", error);
      throw error;
    }
  },

  // 2. Sending prompt to your Python/Gemini Agent
  async askAgent(query) {
    try {
      const response = await fetch(`${API_BASE_URL}/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query }),
      });
      return await response.json();
    } catch (error) {
      console.error("Agent API error:", error);
      return { error: "Could not reach the Agent" };
    }
  },

  // 3. Executing the Data Link logic
  async executeLink(source, targets) {
    try {
      const response = await fetch(`${API_BASE_URL}/links/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, targets }),
      });
      return await response.json();
    } catch (error) {
      console.error("Linking service error:", error);
      throw error;
    }
  }
};

export default apiService;