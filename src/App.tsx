import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import PasswordReset from '@/pages/PasswordReset';
import UpdatePassword from '@/pages/UpdatePassword';
import Dashboard from '@/pages/Dashboard';
import Practice from '@/pages/Practice';
import RolePlay from '@/pages/RolePlay';
import Progress from '@/pages/Progress';
import CallRecordings from '@/pages/CallRecordings';
import TeamDashboard from '@/pages/TeamDashboard';
import Tips from '@/pages/Tips';
import About from '@/pages/About';
import Pricing from '@/pages/Pricing';
import Subscription from '@/pages/Subscription';
import Success from '@/pages/Success';
import Cancel from '@/pages/Cancel';
import Compare from '@/pages/Compare';
import Demo from '@/pages/Demo';
import Privacy from '@/pages/Privacy';
import Terms from '@/pages/Terms';
import NotFound from '@/pages/NotFound';
import AccountDelete from '@/pages/AccountDelete';
import DataSafety from '@/pages/DataSafety';
import { AuthProvider } from '@/context/AuthContext';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'

const queryClient = new QueryClient()

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/password-reset" element={<PasswordReset />} />
              <Route path="/update-password" element={<UpdatePassword />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/practice" element={<Practice />} />
              <Route path="/roleplay" element={<RolePlay />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/recordings" element={<CallRecordings />} />
              <Route path="/team-dashboard" element={<TeamDashboard />} />
              <Route path="/tips" element={<Tips />} />
              <Route path="/about" element={<About />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/subscription" element={<Subscription />} />
              <Route path="/success" element={<Success />} />
              <Route path="/cancel" element={<Cancel />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/demo" element={<Demo />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/data-safety" element={<DataSafety />} />
              <Route path="/account-delete" element={<AccountDelete />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
