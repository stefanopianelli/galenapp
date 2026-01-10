// src/AppRouter.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import MainApp from './MainApp';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500 gap-2"><Loader2 className="animate-spin" /> Caricamento...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Componente per gestire la root: Se loggato vai a /app, altrimenti Landing
const RootRoute = () => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return null;
    return isAuthenticated ? <Navigate to="/app" replace /> : <LandingPage />;
};

const AppRouter = () => {
  const { AUTH_ENABLED } = useAuth();

  if (!AUTH_ENABLED) {
    return (
      <BrowserRouter>
        <MainApp />
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/app/*" element={
          <ProtectedRoute>
            <MainApp />
          </ProtectedRoute>
        } />
        {/* Fallback per rotte sconosciute */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
