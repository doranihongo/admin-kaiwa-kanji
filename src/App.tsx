import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ModeSelection from './pages/ModeSelection';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, user, isInitializing } = useAuth();
  
  if (isInitializing) {
    return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;
  }
  
  if (!token || user?.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      {/* HashRouter: GitHub Pages không có rewrite SPA, nên dùng /#/đường-dẫn để refresh không bị 404 */}
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <ModeSelection />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/xoa-mu-kanji" 
            element={
              <ProtectedRoute>
                <AdminDashboard title="XÓA MÙ KANJI - Quản Trị Hệ Thống" mode="xoa_mu_kanji" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dora-kaiwa" 
            element={
              <ProtectedRoute>
                <AdminDashboard title="DORA KAIWA - Quản Trị Hệ Thống" mode="dora_kaiwa" />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
