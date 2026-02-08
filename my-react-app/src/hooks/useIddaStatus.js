import { useState, useEffect } from 'react';

export const useIddaStatus = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Logic to check database connection status
    const checkConnection = async () => {
      // Simulated check
      const status = true; 
      setIsConnected(status);
      setUser({ name: "Adrija Roy", role: "ECE Student" }); // Example user data
    };

    checkConnection();
  }, []);

  const login = (userData) => setUser(userData);
  const logout = () => {
    setUser(null);
    setIsConnected(false);
  };

  return { isConnected, user, login, logout };
};