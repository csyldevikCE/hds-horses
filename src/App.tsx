import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorFallback } from "@/components/ErrorFallback";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import HorseDetail from "./pages/HorseDetail";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ConfirmEmail from "./pages/ConfirmEmail";
import ForgotPassword from "./pages/ForgotPassword";
import AuthCallback from "./pages/AuthCallback";
import SharedHorse from "./pages/SharedHorse";
import AcceptInvitation from "./pages/AcceptInvitation";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Disable refetch on tab focus - was causing infinite loading loops
      refetchOnMount: true, // Refetch stale data on component mount
      refetchOnReconnect: true, // Refetch when reconnecting to internet
      staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
      retry: 1, // Only retry failed requests once
    },
  },
});

const App = () => (
  <ErrorBoundary
    fallback={<ErrorFallback />}
    onError={(error, errorInfo) => {
      // Log to console in development
      console.error('Application Error:', error, errorInfo);

      // In production, you would send to error tracking service (e.g., Sentry)
      // if (import.meta.env.PROD) {
      //   Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
      // }
    }}
  >
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/confirm-email" element={<ConfirmEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/shared/:token" element={<SharedHorse />} />
              <Route path="/accept-invitation" element={<AcceptInvitation />} />

              {/* Protected routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="/horse/:id" element={
                <ProtectedRoute>
                  <HorseDetail />
                </ProtectedRoute>
              } />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
