// src/hooks/useApi.js
import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = './api/api.php';
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export const useApi = () => {
  const { token, logout, AUTH_ENABLED } = useAuth();

  const createApiRequest = useCallback(async (action, body = null, isFormData = false, method = 'POST') => {
    if (!AUTH_ENABLED && !USE_MOCK_DATA) { 
        console.warn('API call attempted with AUTH_ENABLED=false and not USE_MOCK_DATA.');
        throw new Error('API calls disabled in non-authenticated mode or mock data.');
    }
    
    const headers = {};
    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }
    
    // URL e Token
    let url = `${API_URL}?action=${action}`;
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        url += `&token=${token}`;
    }

    // Gestione Body
    let bodyToSend = body;
    if (method !== 'GET') {
        if (token) {
            if (isFormData) {
                if (body instanceof FormData && !body.has('token')) {
                    body.append('token', token);
                }
                bodyToSend = body;
            } else if (body && typeof body === 'object') {
                bodyToSend = JSON.stringify({ ...body, token: token });
            }
        } else if (!isFormData) {
            bodyToSend = JSON.stringify(body);
        }
    }

    const fetchOptions = {
        method: method,
        headers,
    };

    if (method !== 'GET') {
        fetchOptions.body = bodyToSend;
    }

    try {
      const response = await fetch(url, fetchOptions);

      if (response.status === 401) {
          logout();
          throw new Error("Unauthorized");
      }
      return await response.json();

    } catch (error) {
      console.error(`API request failed: ${action}`, error);
      throw error;
    }
  }, [token, logout, AUTH_ENABLED]);

  return { createApiRequest };
};
