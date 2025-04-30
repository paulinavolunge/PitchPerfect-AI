
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Practice from "./pages/Practice";
import Tips from "./pages/Tips";
import RolePlay from "./pages/RolePlay";
import Subscription from "./pages/Subscription";
import Progress from "./pages/Progress";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PasswordReset from "./pages/PasswordReset";
import UpdatePassword from "./pages/UpdatePassword";
import PremiumModal from "./components/PremiumModal";
import SuccessPage from "./pages/Success";
import CancelPage from "./pages/Cancel";
import { useState } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-brand-blue">
          <div className="h-8 w-8 rounded-full border-4 border-current border-r-transparent animate-spin"></div>
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Premium route component
const PremiumRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isPremium, loading } = useAuth();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const navigate = useNavigate();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-brand-blue">
          <div className="h-8 w-8 rounded-full border-4 border-current border-r-transparent animate-spin"></div>
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (!isPremium) {
    return (
      <>
        <Navigate to="/subscription" replace />
        <PremiumModal
          open={true}
          onOpenChange={() => {
            setShowPremiumModal(false);
            navigate("/subscription");
          }}
          featureName="premium features"
        />
      </>
    );
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <BrowserRouter>
          <Toaster />
          <SonnerToaster position="top-right" />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/password-reset" element={<PasswordReset />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/practice" element={<ProtectedRoute><Practice /></ProtectedRoute>} />
            <Route path="/tips" element={<ProtectedRoute><Tips /></ProtectedRoute>} />
            <Route path="/roleplay" element={<PremiumRoute><RolePlay /></PremiumRoute>} />
            <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
            <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
            <Route path="/success" element={<ProtectedRoute><SuccessPage /></ProtectedRoute>} />
            <Route path="/cancel" element={<ProtectedRoute><CancelPage /></ProtectedRoute>} />
            <Route path="/about" element={<About />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
