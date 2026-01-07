// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const AUTH_ENABLED = import.meta.env.VITE_AUTH_ENABLED === 'true';

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null); // { username, role }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!AUTH_ENABLED) {
      setIsAuthenticated(true);
      setUser({ username: 'Dr. Farmacista', role: 'admin' }); // Ruolo default in dev
      setLoading(false);
      return;
    }

    const storedToken = localStorage.getItem('jwt_token');
    const storedUser = localStorage.getItem('galenico_user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('jwt_token', data.token);
        const userData = { username: data.username, role: data.role };
        localStorage.setItem('galenico_user', JSON.stringify(userData));
        
        setToken(data.token);
        setUser(userData);
        setIsAuthenticated(true);
        setLoading(false);
        return { success: true };
      } else {
        logout();
        setLoading(false);
        return { success: false, message: data.error || 'Credenziali non valide.' };
      }
    } catch (error) {
      console.error('Login error:', error);
      logout();
      setLoading(false);
      return { success: false, message: 'Errore di connessione.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('galenico_user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, user, loading, login, logout, AUTH_ENABLED }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
