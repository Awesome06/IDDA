import { useState, useCallback } from 'react';
// THE FIX: Import the real API service
import apiService from '../services/api';

export const useIddaChat = () => {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'IDDA Agent online. How can I assist with your data dictionary today?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = useCallback(async (userInput) => {
    if (!userInput.trim()) return;

    // 1. Add user message to history immediately
    const userMessage = { role: 'user', text: userInput };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // 2. REAL API Interaction: Using askAgent from your services
      const response = await apiService.askAgent(userInput);
      
      // Handle the response (assuming apiService returns an object with a text property or a string)
      const aiText = response.text || response || "No response received.";
      
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch (error) {
      console.error("IDDA API Error:", error);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: "Sorry, I'm having trouble connecting to the intelligence server. Please check your connection." 
      }]);
    } finally {
      setIsTyping(false);
    }
  }, []); // Removed 'messages' from dependency to avoid unnecessary re-renders

  return { messages, sendMessage, isTyping };
};

// Mock API function removed as it is no longer needed