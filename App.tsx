
import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { PageSettingsProvider } from './contexts/PageSettingsContext';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import PageGuard from './components/PageGuard';
import SessionExpiredModal from './components/SessionExpiredModal';
import ErrorBoundary from './components/ErrorBoundary';
import SEO from './components/SEO';

// Loading component for Suspense fallback
const PageLoader: React.FC = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="w-12 h-12 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mx-auto" />
      <p className="text-white/50 text-sm font-medium">Loading...</p>
    </div>
  </div>
);

// Lazy load pages for code splitting
// Public pages
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Logout = lazy(() => import('./pages/Logout'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const Features = lazy(() => import('./pages/Features'));
const Pricing = lazy(() => import('./pages/Pricing'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Protected pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Sessions = lazy(() => import('./pages/Sessions'));
const WeightLog = lazy(() => import('./pages/WeightLog'));
const FluidLog = lazy(() => import('./pages/FluidLog'));
const Medications = lazy(() => import('./pages/Medications'));
const Education = lazy(() => import('./pages/Education'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Vitals = lazy(() => import('./pages/Vitals'));
const Subscription = lazy(() => import('./pages/Subscription'));
const SubscriptionDetail = lazy(() => import('./pages/SubscriptionDetail'));
const Reports = lazy(() => import('./pages/Reports'));
const NutritionScan = lazy(() => import('./pages/NutritionScan'));
const LabReports = lazy(() => import('./pages/LabReports'));
const Symptoms = lazy(() => import('./pages/Symptoms'));
const Reminders = lazy(() => import('./pages/Reminders'));
const Appointments = lazy(() => import('./pages/Appointments'));
const HealthCheck = lazy(() => import('./pages/HealthCheck'));
const AIChat = lazy(() => import('./pages/AIChat'));
const AIInsights = lazy(() => import('./pages/AIInsights'));
const SymptomAnalysis = lazy(() => import('./pages/SymptomAnalysis'));
const Alerts = lazy(() => import('./pages/Alerts'));
const Admin = lazy(() => import('./pages/Admin'));

// Check if health check page is enabled via env variable
const ENABLE_HEALTH_CHECK = import.meta.env.VITE_ENABLE_HEALTH_CHECK === 'true';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SettingsProvider>
          <Router>
            <PageSettingsProvider>
            <SEO />
            <SessionExpiredModal />
            <Suspense fallback={<PageLoader />}>
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
                    <PageGuard><Layout><SEO title="Clinical Dashboard" noIndex /><Dashboard /></Layout></PageGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sessions"
                element={
                  <ProtectedRoute>
                    <PageGuard><Layout><SEO title="Treatment Sessions" noIndex /><Sessions /></Layout></PageGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vitals"
                element={
                  <ProtectedRoute>
                    <PageGuard><Layout><SEO title="Vital Signs Ledger" noIndex /><Vitals /></Layout></PageGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/symptoms"
                element={
                  <ProtectedRoute>
                    <PageGuard><Layout><SEO title="Symptom Tracker" noIndex /><Symptoms /></Layout></PageGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reminders"
                element={
                  <ProtectedRoute>
                    <PageGuard><Layout><SEO title="Reminders" noIndex /><Reminders /></Layout></PageGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/appointments"
                element={
                  <ProtectedRoute>
                    <PageGuard><Layout><SEO title="Appointments" noIndex /><Appointments /></Layout></PageGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/weight"
                element={
                  <ProtectedRoute>
                    <PageGuard><Layout><SEO title="Weight Analytics" noIndex /><WeightLog /></Layout></PageGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fluid"
                element={
                  <ProtectedRoute>
                    <PageGuard><Layout><SEO title="Hydration Tracking" noIndex /><FluidLog /></Layout></PageGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/meds"
                element={
                  <ProtectedRoute>
                    <PageGuard><Layout><SEO title="Medication Adherence" noIndex /><Medications /></Layout></PageGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/nutri-scan"
                element={
                  <ProtectedRoute>
                    <PageGuard><Layout><SEO title="AI Nutrition Scan" noIndex /><NutritionScan /></Layout></PageGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/labs"
                element={
                  <ProtectedRoute>
                    <PageGuard><Layout><SEO title="Lab Reports" noIndex /><LabReports /></Layout></PageGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/edu"
                element={
                  <ProtectedRoute>
                    <PageGuard><Layout><SEO title="Education Center" noIndex /><Education /></Layout></PageGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <PageGuard><Layout><SEO title="Patient Profile" noIndex /><Profile /></Layout></PageGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <PageGuard><Layout><SEO title="System Settings" noIndex /><Settings /></Layout></PageGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/subscription"
                element={
                  <ProtectedRoute>
                    <PageGuard><Layout><SEO title="Plan Management" noIndex /><SubscriptionDetail /></Layout></PageGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/subscription/pricing"
                element={
                  <ProtectedRoute>
                    <PageGuard><Layout><SEO title="Subscription Plans" noIndex /><Subscription /></Layout></PageGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <PageGuard><Layout><SEO title="Clinical Reports" noIndex /><Reports /></Layout></PageGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ai-chat"
                element={
                  <ProtectedRoute>
                    <PageGuard><Layout><SEO title="AI Health Assistant" noIndex /><AIChat /></Layout></PageGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ai-insights"
                element={
                  <ProtectedRoute>
                    <PageGuard><Layout><SEO title="AI Health Insights" noIndex /><AIInsights /></Layout></PageGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/symptom-analysis"
                element={
                  <ProtectedRoute>
                    <PageGuard><Layout><SEO title="Symptom Analysis" noIndex /><SymptomAnalysis /></Layout></PageGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/alerts"
                element={
                  <ProtectedRoute>
                    <PageGuard><Layout><SEO title="Alerts" noIndex /><Alerts /></Layout></PageGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminLayout><SEO title="Admin Dashboard" noIndex /><Admin /></AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute>
                    <AdminLayout><SEO title="Admin - Users" noIndex /><Admin /></AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/errors"
                element={
                  <ProtectedRoute>
                    <AdminLayout><SEO title="Admin - Error Logs" noIndex /><Admin /></AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/announcements"
                element={
                  <ProtectedRoute>
                    <AdminLayout><SEO title="Admin - Announcements" noIndex /><Admin /></AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/pages"
                element={
                  <ProtectedRoute>
                    <AdminLayout><SEO title="Admin - Page Settings" noIndex /><Admin /></AdminLayout>
                  </ProtectedRoute>
                }
              />

              {/* 404 Catch-all Route */}
              <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            </PageSettingsProvider>
          </Router>
        </SettingsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
