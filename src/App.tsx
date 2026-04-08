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

// Layouts - Also lazy loaded for better chunking
const AdminLayout = lazy(() => import("./layouts/AdminLayout").then(m => ({ default: m.AdminLayout })));
const PublicLayout = lazy(() => import("./layouts/PublicLayout").then(m => ({ default: m.PublicLayout })));
const SuperAdminLayout = lazy(() => import("./layouts/SuperAdminLayout").then(m => ({ default: m.SuperAdminLayout })));
const GlobalLoader = () => (
  <div className="fixed inset-0 z-[999] flex items-center justify-center bg-background/60 backdrop-blur-xl">
    <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-700">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full animate-pulse" />
        <div className="w-16 h-16 rounded-2xl bg-card border border-primary/20 shadow-2xl flex items-center justify-center relative z-10 rotate-3 animate-bounce">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-[1px] bg-gradient-to-r from-transparent to-primary/40" />
          <span className="text-[11px] font-black tracking-[0.4em] text-primary uppercase">Menu Pro</span>
          <div className="w-8 h-[1px] bg-gradient-to-l from-transparent to-primary/40" />
        </div>
        <span className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase opacity-40">Otimizando sua experiência...</span>
      </div>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

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
                  {/* Rota curta: acesso direto pelo slug na raiz do domínio */}
                  <Route path="/:slug" element={<PublicMenu />} />
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
