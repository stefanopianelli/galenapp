// src/App.jsx
import React from 'react';
import { AuthProvider } from './context/AuthContext';
import AppRouter from './AppRouter';

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
