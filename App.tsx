
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
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
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Features from './pages/Features';
import SEO from './components/SEO';
import { useStore } from './store';

const App: React.FC = () => {
  const { isAuthenticated } = useStore();

  return (
    <Router>
      <SEO />
      <Routes>
        {/* Public Marketing Routes */}
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Landing />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/features" element={<Features />} />

        {/* Private Application Routes - Redirect to home if not logged in */}
        <Route
          path="/dashboard"
          element={isAuthenticated ? <Layout><SEO title="Clinical Dashboard" /><Dashboard /></Layout> : <Navigate to="/" />}
        />
        <Route
          path="/sessions"
          element={isAuthenticated ? <Layout><SEO title="Treatment Sessions" /><Sessions /></Layout> : <Navigate to="/" />}
        />
        <Route
          path="/vitals"
          element={isAuthenticated ? <Layout><SEO title="Vital Signs Ledger" /><Vitals /></Layout> : <Navigate to="/" />}
        />
        <Route
          path="/weight"
          element={isAuthenticated ? <Layout><SEO title="Weight Analytics" /><WeightLog /></Layout> : <Navigate to="/" />}
        />
        <Route
          path="/fluid"
          element={isAuthenticated ? <Layout><SEO title="Hydration Tracking" /><FluidLog /></Layout> : <Navigate to="/" />}
        />
        <Route
          path="/meds"
          element={isAuthenticated ? <Layout><SEO title="Medication Adherence" /><Medications /></Layout> : <Navigate to="/" />}
        />
        <Route
          path="/nutri-scan"
          element={isAuthenticated ? <Layout><SEO title="AI Nutrition Scan" /><NutritionScan /></Layout> : <Navigate to="/" />}
        />
        <Route
          path="/edu"
          element={isAuthenticated ? <Layout><SEO title="Education Center" /><Education /></Layout> : <Navigate to="/" />}
        />
        <Route
          path="/profile"
          element={isAuthenticated ? <Layout><SEO title="Patient Profile" /><Profile /></Layout> : <Navigate to="/" />}
        />
        <Route
          path="/settings"
          element={isAuthenticated ? <Layout><SEO title="System Settings" /><Settings /></Layout> : <Navigate to="/" />}
        />
        <Route
          path="/subscription"
          element={isAuthenticated ? <Layout><SEO title="Plan Management" /><SubscriptionDetail /></Layout> : <Navigate to="/" />}
        />
        <Route
          path="/subscription/pricing"
          element={isAuthenticated ? <Layout><SEO title="Subscription Plans" /><Subscription /></Layout> : <Navigate to="/" />}
        />
        <Route
          path="/reports"
          element={isAuthenticated ? <Layout><SEO title="Clinical Reports" /><Reports /></Layout> : <Navigate to="/" />}
        />
      </Routes>
    </Router>
  );
};

export default App;
