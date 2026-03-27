import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { useAuthStore } from './store/useAuthStore';

import { PublicMenu } from './pages/PublicMenu';
import { PublicBioLink } from './pages/PublicBioLink';
import { AdminLayout } from './components/AdminLayout';
// ... rest
import { DashboardHome } from './pages/DashboardHome';
import { AISettings } from './pages/AISettings';
import { PaymentSettings } from './pages/PaymentSettings';
import { RestaurantBranding } from './pages/RestaurantBranding';
import { ProductManager } from './pages/ProductManager';
import { BioLinkManager } from './pages/BioLinkManager';
import { DeliveryLabels } from './pages/DeliveryLabels';

// Componente Admin Real (Dashboard)
const AdminDashboard = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="branding" element={<RestaurantBranding />} />
        <Route path="products" element={<ProductManager />} />
        <Route path="biolink" element={<BioLinkManager />} />
        <Route path="labels" element={<DeliveryLabels />} />
        <Route path="settings/ia" element={<AISettings />} />
        <Route path="settings/payments" element={<PaymentSettings />} />
        <Route path="metrics" element={<DashboardHome />} />
        <Route path="restaurants" element={<DashboardHome />} />
      </Routes>
    </AdminLayout>
  );
};

// Guarda de Rota Privada
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PublicMenu />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/b/:slug" element={<PublicBioLink />} />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
