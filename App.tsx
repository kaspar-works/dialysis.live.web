
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import SessionExpiredModal from './components/SessionExpiredModal';
import Dashboard from './pages/Dashboard';
import Sessions from './pages/Sessions';
import WeightLog from './pages/WeightLog';
import FluidLog from './pages/FluidLog';
import Medications from './pages/Medications';
import Education from './pages/Education';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Vitals from './pages/Vitals';
import Subscription from './pages/Subscription';
import SubscriptionDetail from './pages/SubscriptionDetail';
import Reports from './pages/Reports';
import NutritionScan from './pages/NutritionScan';
import LabReports from './pages/LabReports';
import Symptoms from './pages/Symptoms';
import Reminders from './pages/Reminders';
import Appointments from './pages/Appointments';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Logout from './pages/Logout';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import SEO from './components/SEO';
import HealthCheck from './pages/HealthCheck';

// Check if health check page is enabled via env variable
const ENABLE_HEALTH_CHECK = import.meta.env.VITE_ENABLE_HEALTH_CHECK === 'true';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <SEO />
        <SessionExpiredModal />
        <Routes>
          {/* Public Marketing Routes - redirect to dashboard if authenticated */}
          <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Public routes that don't redirect */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<Pricing />} />

          {/* Development: Health Check (disabled in production via env) */}
          {ENABLE_HEALTH_CHECK && (
            <Route path="/health" element={<Layout><SEO title="Health Check" /><HealthCheck /></Layout>} />
          )}

          {/* Protected Application Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout><SEO title="Clinical Dashboard" noIndex /><Dashboard /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sessions"
            element={
              <ProtectedRoute>
                <Layout><SEO title="Treatment Sessions" noIndex /><Sessions /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vitals"
            element={
              <ProtectedRoute>
                <Layout><SEO title="Vital Signs Ledger" noIndex /><Vitals /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/symptoms"
            element={
              <ProtectedRoute>
                <Layout><SEO title="Symptom Tracker" noIndex /><Symptoms /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reminders"
            element={
              <ProtectedRoute>
                <Layout><SEO title="Reminders" noIndex /><Reminders /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointments"
            element={
              <ProtectedRoute>
                <Layout><SEO title="Appointments" noIndex /><Appointments /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/weight"
            element={
              <ProtectedRoute>
                <Layout><SEO title="Weight Analytics" noIndex /><WeightLog /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/fluid"
            element={
              <ProtectedRoute>
                <Layout><SEO title="Hydration Tracking" noIndex /><FluidLog /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/meds"
            element={
              <ProtectedRoute>
                <Layout><SEO title="Medication Adherence" noIndex /><Medications /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/nutri-scan"
            element={
              <ProtectedRoute>
                <Layout><SEO title="AI Nutrition Scan" noIndex /><NutritionScan /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/labs"
            element={
              <ProtectedRoute>
                <Layout><SEO title="Lab Reports" noIndex /><LabReports /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/edu"
            element={
              <ProtectedRoute>
                <Layout><SEO title="Education Center" noIndex /><Education /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout><SEO title="Patient Profile" noIndex /><Profile /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Layout><SEO title="System Settings" noIndex /><Settings /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/subscription"
            element={
              <ProtectedRoute>
                <Layout><SEO title="Plan Management" noIndex /><SubscriptionDetail /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/subscription/pricing"
            element={
              <ProtectedRoute>
                <Layout><SEO title="Subscription Plans" noIndex /><Subscription /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Layout><SEO title="Clinical Reports" noIndex /><Reports /></Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
