import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/shared/components/ui/sonner";
import { Toaster } from "@/shared/components/ui/toaster";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { ThemeProvider } from "@/shared/components/common/ThemeProvider";
import { AuthProvider } from "@/features/auth/hooks/useAuth";
import { ProtectedRoute } from "@/shared/components/common/ProtectedRoute";
import { SuperAdminRoute } from "@/shared/components/common/SuperAdminRoute";
import { Loader2 } from "lucide-react";

// Lazy loading components for performance optimization
const Landing = lazy(() => import("./features/landing/pages/Landing"));
const Login = lazy(() => import("./features/auth/pages/Login"));
const Register = lazy(() => import("./features/auth/pages/Register"));

const ForgotPassword = lazy(() => import("./features/auth/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./features/auth/pages/ResetPassword"));
const Onboarding = lazy(() => import("./features/auth/pages/Onboarding"));
const Dashboard = lazy(() => import("./features/dashboard/pages/Dashboard"));
const Products = lazy(() => import("./features/products/pages/Products"));
const Delivery = lazy(() => import("./features/store-settings/pages/Delivery"));
const Branding = lazy(() => import("./features/store-settings/pages/Branding"));
const PublicMenu = lazy(() => import("./features/public-menu/pages/PublicMenu"));
const SuperAdminDashboard = lazy(() => import("./features/super-admin/pages/SuperAdminDashboard"));
const SuperAdminSettings = lazy(() => import("./features/super-admin/pages/SuperAdminSettings"));
const SuperAdminTenants = lazy(() => import("./features/super-admin/pages/SuperAdminTenants"));
const SuperAdminFinancial = lazy(() => import("./features/super-admin/pages/SuperAdminFinancial"));
const SuperAdminSystem = lazy(() => import("./features/super-admin/pages/SuperAdminSystem"));
const MenuImport = lazy(() => import("./features/products/pages/MenuImport"));
const Coupons = lazy(() => import("./features/store-settings/pages/Coupons"));
const Orders = lazy(() => import("./features/orders/pages/Orders"));
const BusinessHours = lazy(() => import("./features/store-settings/pages/BusinessHours"));
const SuperAdminLanding = lazy(() => import("./features/super-admin/pages/SuperAdminLanding"));
const OrderTracking = lazy(() => import("./features/orders/pages/OrderTracking"));
const Analytics = lazy(() => import("./features/dashboard/pages/Analytics"));
const BioLinks = lazy(() => import("./features/bio-link/pages/BioLinks"));
const BioLinkPage = lazy(() => import("./features/bio-link/pages/BioLinkPage"));
const Marketing = lazy(() => import("./features/marketing/pages/Marketing"));
const NotFound = lazy(() => import("./shared/components/common/NotFound"));

import { AdminLayout } from "./layouts/AdminLayout";
import { PublicLayout } from "./layouts/PublicLayout";
import { SuperAdminLayout } from "./layouts/SuperAdminLayout";
const GlobalLoader = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase opacity-50 animate-pulse">Carregando...</span>
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Suspense fallback={<GlobalLoader />}>
              <Routes>
                {/* Public */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Onboarding (protected but separate from admin) */}
                <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

                {/* Public menu — mobile-first layout */}
                <Route element={<PublicLayout />}>
                  <Route path="/menu/:slug" element={<PublicMenu />} />
                  <Route path="/links/:slug" element={<BioLinkPage />} />
                  <Route path="/order/:orderId" element={<OrderTracking />} />
                </Route>

                {/* Admin (multi-tenant, protected) */}
                <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                  <Route index element={<Dashboard />} />
                  <Route path="orders" element={<Orders />} />
                  <Route path="products" element={<Products />} />
                  <Route path="delivery" element={<Delivery />} />
                  <Route path="branding" element={<Branding />} />
                  <Route path="links" element={<BioLinks />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="menu-import" element={<MenuImport />} />
                  <Route path="coupons" element={<Coupons />} />
                  <Route path="hours" element={<BusinessHours />} />
                  <Route path="marketing" element={<Marketing />} />
                </Route>

                {/* Super Admin */}
                <Route path="/super-admin" element={<SuperAdminRoute><SuperAdminLayout /></SuperAdminRoute>}>
                  <Route index element={<SuperAdminDashboard />} />
                  <Route path="settings" element={<SuperAdminSettings />} />
                  <Route path="landing" element={<SuperAdminLanding />} />
                  <Route path="tenants" element={<SuperAdminTenants />} />
                  <Route path="financial" element={<SuperAdminFinancial />} />
                  <Route path="system" element={<SuperAdminSystem />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
