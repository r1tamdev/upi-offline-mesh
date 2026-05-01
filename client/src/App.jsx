import React from "react";
import { Routes,Route,Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import PayPage from "./pages/PaymentPage";
import RelayPage from "./pages/RelayPage";

function RequireAuth({ children }) {
  const { user, ready } = useAuth()
  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  return user ? children : <Navigate to="/auth" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<RequireAuth><HomePage /></RequireAuth>} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/pay" element={<RequireAuth><PayPage /></RequireAuth>} />
        <Route path="/relay" element={<RequireAuth><RelayPage /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}