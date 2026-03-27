import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { useAuthStore } from './store/useAuthStore';
import { useThemeStore } from './store/useThemeStore';

import { PublicMenu } from './pages/PublicMenu';
import { PublicBioLink } from './pages/PublicBioLink';
import { AdminLayout } from './components/AdminLayout';
// ... rest
import { DashboardHome } from './pages/DashboardHome';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminClients } from './pages/AdminClients';
import { AISettings } from './pages/AISettings';
import { PaymentSettings } from './pages/PaymentSettings';
import { RestaurantBranding } from './pages/RestaurantBranding';
import { ProductManager } from './pages/ProductManager';
import { BioLinkManager } from './pages/BioLinkManager';
import { DeliveryLabels } from './pages/DeliveryLabels';
import { MetricsPage } from './pages/MetricsPage';

// Componente Admin Real (Dashboard)
const AdminRoutes = () => {
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.is_super_admin;

  return (
    <AdminLayout>
      <Routes>
        {isSuperAdmin ? (
          <>
            <Route index element={<AdminDashboard />} />
            <Route path="clients" element={<AdminClients />} />
            <Route path="settings/ia" element={<AISettings />} />
            <Route path="settings/payments" element={<PaymentSettings />} />
          </>
        ) : (
          <>
            <Route index element={<DashboardHome />} />
            <Route path="branding" element={<RestaurantBranding />} />
            <Route path="products" element={<ProductManager />} />
            <Route path="biolink" element={<BioLinkManager />} />
            <Route path="labels" element={<DeliveryLabels />} />
            <Route path="metrics" element={<MetricsPage />} />
          </>
        )}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  );
};

// Guarda de Rota Privada
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// Converte hex para "r, g, b"
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '245, 158, 11'; // fallback amber
};

// Injeta a cor de destaque do lojista como variável CSS global
const AccentColorInjector = () => {
  const user = useAuthStore((state) => state.user);
  const { setAccentColor } = useThemeStore();
  const accent = user?.restaurant?.accent_color || '#f59e0b';

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accent);
    document.documentElement.style.setProperty('--accent-rgb', hexToRgb(accent));
    setAccentColor(accent);
  }, [accent, setAccentColor]);

  return null;
};

function App() {
  return (
    <Router>
      <AccentColorInjector />
      <Routes>
        <Route path="/" element={<PublicMenu />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/b/:slug" element={<PublicBioLink />} />
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute>
              <AdminRoutes />
            </ProtectedRoute>
          } 
        />
        <Route path="/menu/:slug" element={<PublicMenu />} />
      </Routes>
    </Router>
  );
}

export default App;
