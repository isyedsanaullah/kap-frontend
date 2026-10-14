// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider }  from "./context/SidebarContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { OfflineProvider }  from "./context/OfflineContext";
import MainLayout           from "./components/layout/MainLayout";
import Login                from "./pages/Login";
import CompanyProfile       from "./pages/CompanyProfile";
import ProtectedRoute       from "./components/auth/ProtectedRoute";
import DatabaseErrorPopup   from "./components/ui/DatabaseErrorPopup";

function RootRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <CompanyProfile />;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <OfflineProvider>
          <SidebarProvider>
            <DatabaseErrorPopup />
            <Routes>
              <Route path="/" element={<RootRoute />} />
              <Route path="/company" element={<CompanyProfile />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </SidebarProvider>
        </OfflineProvider>
      </AuthProvider>
    </Router>
  );
}