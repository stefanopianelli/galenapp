// src/App.jsx
import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { ConfirmationProvider } from './context/ConfirmationContext';
import AppRouter from './AppRouter';

function App() {
  return (
    <AuthProvider>
      <ConfirmationProvider>
        <AppRouter />
      </ConfirmationProvider>
    </AuthProvider>
  );
}

export default App;
