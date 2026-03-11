
import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { PageSettingsProvider } from './contexts/PageSettingsContext';
import { AlertProvider } from './contexts/AlertContext';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import PageGuard from './components/PageGuard';
import SessionExpiredModal from './components/SessionExpiredModal';
import ErrorBoundary from './components/ErrorBoundary';
import SEO from './components/SEO';
import RouterReady from './components/RouterReady';

// Loading component for Suspense fallback
const PageLoader: React.FC = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="w-12 h-12 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mx-auto" />
      <p className="text-white/50 text-sm font-medium">Loading...</p>
    </div>
  </div>
);

// Retry dynamic imports — on chunk load failure (stale deploy), reload the page once
function lazyWithRetry(importFn: () => Promise<any>) {
  return lazy(() =>
    importFn().catch((error: Error) => {
      const isChunkError =
        error.message?.includes('Failed to fetch dynamically imported module') ||
        error.message?.includes('Importing a module script failed') ||
        error.message?.includes('Loading chunk') ||
        error.message?.includes('Loading CSS chunk');

      if (isChunkError) {
        const key = 'chunk_reload';
        const last = sessionStorage.getItem(key);
        const now = Date.now();
        if (!last || now - parseInt(last) > 60000) {
          sessionStorage.setItem(key, String(now));
          window.location.reload();
        }
      }
      throw error;
    })
  );
}

// Lazy load pages for code splitting
// Public pages
const Landing = lazyWithRetry(() => import('./pages/Landing'));
const Login = lazyWithRetry(() => import('./pages/Login'));
const Register = lazyWithRetry(() => import('./pages/Register'));
const ForgotPassword = lazyWithRetry(() => import('./pages/ForgotPassword'));
const ResetPassword = lazyWithRetry(() => import('./pages/ResetPassword'));
const VerifyEmail = lazyWithRetry(() => import('./pages/VerifyEmail'));
const Logout = lazyWithRetry(() => import('./pages/Logout'));
const Privacy = lazyWithRetry(() => import('./pages/Privacy'));
const Terms = lazyWithRetry(() => import('./pages/Terms'));
const Features = lazyWithRetry(() => import('./pages/Features'));
const Pricing = lazyWithRetry(() => import('./pages/Pricing'));
const NotFound = lazyWithRetry(() => import('./pages/NotFound'));
const EmergencyCard = lazyWithRetry(() => import('./pages/EmergencyCard'));
const Demo = lazyWithRetry(() => import('./pages/Demo'));

// Protected pages
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'));
const Sessions = lazyWithRetry(() => import('./pages/Sessions'));
const WeightLog = lazyWithRetry(() => import('./pages/WeightLog'));
const Exercise = lazyWithRetry(() => import('./pages/Exercise'));
const FluidLog = lazyWithRetry(() => import('./pages/FluidLog'));
const Medications = lazyWithRetry(() => import('./pages/Medications'));
const Education = lazyWithRetry(() => import('./pages/Education'));
const Profile = lazyWithRetry(() => import('./pages/Profile'));
const Settings = lazyWithRetry(() => import('./pages/Settings'));
const Vitals = lazyWithRetry(() => import('./pages/Vitals'));
const Subscription = lazyWithRetry(() => import('./pages/Subscription'));
const SubscriptionDetail = lazyWithRetry(() => import('./pages/SubscriptionDetail'));
const Reports = lazyWithRetry(() => import('./pages/Reports'));
const NutritionScan = lazyWithRetry(() => import('./pages/NutritionScan'));
const LabReports = lazyWithRetry(() => import('./pages/LabReports'));
const Symptoms = lazyWithRetry(() => import('./pages/Symptoms'));
const Reminders = lazyWithRetry(() => import('./pages/Reminders'));
const Appointments = lazyWithRetry(() => import('./pages/Appointments'));
const HealthCheck = lazyWithRetry(() => import('./pages/HealthCheck'));
const AIChat = lazyWithRetry(() => import('./pages/AIChat'));
const AIInsights = lazyWithRetry(() => import('./pages/AIInsights'));
const SymptomAnalysis = lazyWithRetry(() => import('./pages/SymptomAnalysis'));
const Alerts = lazyWithRetry(() => import('./pages/Alerts'));
const Achievements = lazyWithRetry(() => import('./pages/Achievements'));
const AccessSite = lazyWithRetry(() => import('./pages/AccessSite'));
const Admin = lazyWithRetry(() => import('./pages/Admin'));
const Nutrition = lazyWithRetry(() => import('./pages/Nutrition'));
const Help = lazyWithRetry(() => import('./pages/Help'));
const TwoFactorSettings = lazyWithRetry(() => import('./pages/TwoFactorSettings'));
const PaymentHistory = lazyWithRetry(() => import('./pages/PaymentHistory'));
const PaymentMethods = lazyWithRetry(() => import('./pages/PaymentMethods'));
const ChangePassword = lazyWithRetry(() => import('./pages/ChangePassword'));
const Messages = lazyWithRetry(() => import('./pages/Messages'));
const FatiguePrediction = lazyWithRetry(() => import('./pages/FatiguePrediction'));

// Community pages
const Community = lazyWithRetry(() => import('./pages/Community'));
const CommunityProfile = lazyWithRetry(() => import('./pages/CommunityProfile'));
const Forums = lazyWithRetry(() => import('./pages/Forums'));
const ForumCategory = lazyWithRetry(() => import('./pages/ForumCategory'));
const ForumPost = lazyWithRetry(() => import('./pages/ForumPost'));
const NewForumPost = lazyWithRetry(() => import('./pages/NewForumPost'));
const SuccessStories = lazyWithRetry(() => import('./pages/SuccessStories'));
const SuccessStoryDetail = lazyWithRetry(() => import('./pages/SuccessStoryDetail'));
const SubmitStory = lazyWithRetry(() => import('./pages/SubmitStory'));
const HCPVerification = lazyWithRetry(() => import('./pages/HCPVerification'));

// Check if health check page is enabled via env variable
const ENABLE_HEALTH_CHECK = import.meta.env.VITE_ENABLE_HEALTH_CHECK === 'true';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Router>
        <RouterReady fallback={<PageLoader />}>
          <AlertProvider>
            <AuthProvider>
              <SettingsProvider>
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
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/logout" element={<Logout />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/features" element={<Features />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/emergency/:token" element={<EmergencyCard />} />
              <Route path="/demo" element={<Demo />} />

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
                path="/exercise"
                element={
                  <ProtectedRoute>
                    <PageGuard><Layout><SEO title="Exercise" noIndex /><Exercise /></Layout></PageGuard>
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
                path="/access-site"
                element={
                  <ProtectedRoute>
                    <PageGuard><Layout><SEO title="Access Site Tracking" noIndex /><AccessSite /></Layout></PageGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/achievements"
                element={
                  <ProtectedRoute>
                    <PageGuard><Layout><SEO title="Achievements" noIndex /><Achievements /></Layout></PageGuard>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/nutrition"
                element={
                  <ProtectedRoute>
                    <PageGuard><Layout><SEO title="Nutrition Tracker" noIndex /><Nutrition /></Layout></PageGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/help"
                element={
                  <ProtectedRoute>
                    <PageGuard><Layout><SEO title="Help & Support" noIndex /><Help /></Layout></PageGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/two-factor"
                element={
                  <ProtectedRoute>
                    <PageGuard><Layout><SEO title="Two-Factor Authentication" noIndex /><TwoFactorSettings /></Layout></PageGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payment-history"
                element={
                  <ProtectedRoute>
                    <PageGuard><Layout><SEO title="Payment History" noIndex /><PaymentHistory /></Layout></PageGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payment-methods"
                element={
                  <ProtectedRoute>
                    <PageGuard><Layout><SEO title="Payment Methods" noIndex /><PaymentMethods /></Layout></PageGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/change-password"
                element={
                  <ProtectedRoute>
                    <PageGuard><Layout><SEO title="Change Password" noIndex /><ChangePassword /></Layout></PageGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/messages"
                element={
                  <ProtectedRoute>
                    <PageGuard><Layout><SEO title="Messages" noIndex /><Messages /></Layout></PageGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fatigue-prediction"
                element={
                  <ProtectedRoute>
                    <PageGuard><Layout><SEO title="Fatigue Prediction" noIndex /><FatiguePrediction /></Layout></PageGuard>
                  </ProtectedRoute>
                }
              />

              {/* Community Routes */}
              <Route
                path="/community"
                element={
                  <ProtectedRoute>
                    <PageGuard><Layout><SEO title="Community" noIndex /><Community /></Layout></PageGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/community/my-profile"
                element={
                  <ProtectedRoute>
                    <PageGuard><Layout><SEO title="Community Profile" noIndex /><CommunityProfile /></Layout></PageGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/community/forums"
                element={
                  <ProtectedRoute>
                    <PageGuard><Layout><SEO title="Forums" noIndex /><Forums /></Layout></PageGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/community/forums/new-post"
                element={
                  <ProtectedRoute>
                    <PageGuard><Layout><SEO title="New Post" noIndex /><NewForumPost /></Layout></PageGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/community/forums/:slug"
                element={
                  <ProtectedRoute>
                    <PageGuard><Layout><SEO title="Forum Category" noIndex /><ForumCategory /></Layout></PageGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/community/forums/post/:slug"
                element={
                  <ProtectedRoute>
                    <PageGuard><Layout><SEO title="Forum Post" noIndex /><ForumPost /></Layout></PageGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/community/stories"
                element={
                  <ProtectedRoute>
                    <PageGuard><Layout><SEO title="Success Stories" noIndex /><SuccessStories /></Layout></PageGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/community/stories/submit"
                element={
                  <ProtectedRoute>
                    <PageGuard><Layout><SEO title="Share Your Story" noIndex /><SubmitStory /></Layout></PageGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/community/stories/:slug"
                element={
                  <ProtectedRoute>
                    <PageGuard><Layout><SEO title="Success Story" noIndex /><SuccessStoryDetail /></Layout></PageGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/community/hcp-apply"
                element={
                  <ProtectedRoute>
                    <PageGuard><Layout><SEO title="HCP Verification" noIndex /><HCPVerification /></Layout></PageGuard>
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
              <Route
                path="/admin/activity"
                element={
                  <ProtectedRoute>
                    <AdminLayout><SEO title="Admin - Activity Logs" noIndex /><Admin /></AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/alerts"
                element={
                  <ProtectedRoute>
                    <AdminLayout><SEO title="Admin - System Alerts" noIndex /><Admin /></AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/build"
                element={
                  <ProtectedRoute>
                    <AdminLayout><SEO title="Admin - Build Info" noIndex /><Admin /></AdminLayout>
                  </ProtectedRoute>
                }
              />

                    {/* 404 Catch-all Route */}
                    <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </PageSettingsProvider>
              </SettingsProvider>
            </AuthProvider>
          </AlertProvider>
        </RouterReady>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
