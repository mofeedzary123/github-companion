import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { toast } from "sonner";
import { WarehouseProvider } from "@/contexts/WarehouseContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import ProductsPage from "@/pages/ProductsPage";
import CategoriesPage from "@/pages/CategoriesPage";
import WarehousesPage from "@/pages/WarehousesPage";
import SuppliersPage from "@/pages/SuppliersPage";
import ClientsPage from "@/pages/ClientsPage";
import MovementsPage from "@/pages/MovementsPage";
import SettingsPage from "@/pages/SettingsPage";
import ReportsPage from "@/pages/ReportsPage";
import LoginPage from "@/pages/LoginPage";
import NotFound from "./pages/NotFound";

// استيراد واجهة مخازن التسليح الجديدة
import ArmoryPage from "@/pages/ArmoryPage"; 

const queryClient = new QueryClient();

const BackButtonManager = () => {
  const navigate = useNavigate();
  const location = useLocation();
  let lastTimeBackPress = 0;

  useEffect(() => {
    const backButtonListener = CapacitorApp.addListener('backButton', () => {
      if (location.pathname !== '/' && location.pathname !== '/login') {
        navigate(-1);
      } 
      else {
        const currentTime = new Date().getTime();
        if (currentTime - lastTimeBackPress < 2000) {
          CapacitorApp.exitApp();
        } else {
          lastTimeBackPress = currentTime;
          toast.info("اضغط مرة أخرى للخروج من التطبيق", {
            position: "bottom-center",
          });
        }
      }
    });

    return () => {
      backButtonListener.then(l => l.remove());
    };
  }, [location, navigate]);

  return null;
};

const ProtectedRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <WarehouseProvider>
      <BackButtonManager />
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/warehouses" element={<WarehousesPage />} />
          
          {/* ربط مسار مخازن التسليح الجديد */}
          <Route path="/armory-warehouses" element={<ArmoryPage />} />

          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/movements" element={<MovementsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </WarehouseProvider>
  );
};

const LoginRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return (
    <>
      <BackButtonManager />
      <LoginPage />
    </>
  );
};

// المكون الرئيسي للتطبيق الذي يجمع كل المزودات
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginRoute />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
