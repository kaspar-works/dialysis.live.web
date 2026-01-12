
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ICONS } from '../constants';
import { useStore } from '../store';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';
import HelpChatWidget from './HelpChatWidget';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { profile, setTheme } = useStore();
  const { authProfile, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Use AuthContext profile (shared state) with fallback to local store
  const displayName = authProfile?.fullName || profile.name || 'User';
  const displayEmail = user?.email || profile.email || '';

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const handleLogout = () => {
    navigate('/logout');
  };

  const toggleTheme = () => {
    setTheme(profile.settings.display.theme === 'dark' ? 'light' : 'dark');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: ICONS.Dashboard },
    { name: 'Sessions', path: '/sessions', icon: ICONS.Activity },
    { name: 'Vitals Hub', path: '/vitals', icon: ICONS.Vitals },
    { name: 'Symptoms', path: '/symptoms', icon: (props: any) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
    )},
    { name: 'Weight', path: '/weight', icon: ICONS.Scale },
    { name: 'Hydration', path: '/fluid', icon: ICONS.Droplet },
    { name: 'Nutri-Scan', path: '/nutri-scan', icon: (props: any) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
    )},
    { name: 'Labs', path: '/labs', icon: (props: any) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/></svg>
    )},
    { name: 'Meds', path: '/meds', icon: ICONS.Pill },
    { name: 'Reminders', path: '/reminders', icon: ICONS.Bell },
    { name: 'Appointments', path: '/appointments', icon: ICONS.Calendar },
    { name: 'Reports', path: '/reports', icon: (props: any) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
    )},
    { name: 'AI Chat', path: '/ai-chat', icon: (props: any) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    )},
    { name: 'AI Insights', path: '/ai-insights', icon: ICONS.Sparkles },
    { name: 'Symptom Check', path: '/symptom-analysis', icon: (props: any) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>
    )},
  ];

  const defaultAvatar = "https://ui-avatars.com/api/?name=" + encodeURIComponent(displayName) + "&background=0ea5e9&color=fff&bold=true";

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-500">
      {/* Desktop Sidebar */}
      <aside
        className={`${isSidebarOpen ? 'w-72' : 'w-24'} bg-white dark:bg-slate-950 border-r border-slate-100 dark:border-white/5 transition-all duration-500 ease-in-out flex flex-col hidden lg:flex relative z-30 shadow-[10px_0_30px_rgba(0,0,0,0.01)] dark:shadow-none`}
        role="complementary"
        aria-label="Main sidebar navigation"
      >
        <div className="p-8">
          <Link to="/dashboard" aria-label="Go to dashboard">
            <Logo showText={isSidebarOpen} className="w-10 h-10" />
          </Link>
        </div>

        <nav className="flex-1 mt-4 px-4 space-y-2 overflow-y-auto custom-scrollbar" aria-label="Main navigation">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                aria-label={`Navigate to ${item.name}`}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group ${
                  isActive
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xl dark:shadow-white/5'
                    : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-sky-400 dark:text-sky-500' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white'}`} />
                {isSidebarOpen && <span className="font-bold text-sm tracking-tight">{item.name}</span>}
                {isActive && isSidebarOpen && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_#0EA5E9]"></div>}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 space-y-4">
          <Link to="/settings" className={`flex items-center gap-4 px-4 py-3 rounded-2xl text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all ${location.pathname === '/settings' ? 'text-slate-900 dark:text-white bg-slate-50 dark:bg-white/5' : ''}`}>
            <ICONS.Settings className="w-5 h-5" />
            {isSidebarOpen && <span className="font-bold text-sm">Settings</span>}
          </Link>
          <button
            onClick={handleLogout}
            aria-label="Logout from your account"
            className="w-full flex items-center gap-4 px-4 py-3 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-2xl transition-all font-bold text-sm"
          >
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
             {isSidebarOpen && <span>Logout</span>}
          </button>
          
          {isSidebarOpen && (
            <div className="px-4 pt-4 border-t border-slate-50 dark:border-white/5">
               <p className="text-[8px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">
                  Developed by <a href="https://kaspar.works/" target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:text-pink-500 transition-colors">kaspar.works</a>
               </p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Universal Header */}
        <header
          className="h-16 sm:h-20 lg:h-24 bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl border-b border-slate-100 dark:border-white/5 flex items-center justify-between px-4 sm:px-6 lg:px-12 z-40 sticky top-0 safe-pt"
          role="banner"
        >
          {/* Mobile: Hamburger + Logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-white/10 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 transition-all active:scale-95"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <Link to="/dashboard" className="flex items-center gap-2">
              <Logo className="w-8 h-8" />
              <span className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight hidden xs:block">dialysis.live</span>
            </Link>
          </div>

          {/* Desktop: Page Title */}
          <div className="hidden lg:flex flex-col">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em]">Patient Node Sync</span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {menuItems.find(m => m.path === location.pathname)?.name || 'Application Hub'}
            </h2>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
             {/* Day/Night Toggle */}
             <button
                onClick={toggleTheme}
                aria-label="Toggle Theme"
                className="w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center bg-slate-100 dark:bg-white/10 rounded-xl lg:rounded-2xl text-slate-500 dark:text-slate-400 hover:text-sky-500 hover:bg-slate-200 dark:hover:bg-white/20 transition-all active:scale-95"
              >
                {profile.settings.display.theme === 'dark' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                )}
             </button>

             {/* New Cycle Button */}
             <button
                onClick={() => navigate('/sessions')}
                aria-label="Start new dialysis session"
                className="w-10 h-10 lg:w-auto lg:px-6 lg:py-3 bg-sky-500 dark:bg-sky-500 text-white rounded-xl lg:rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 hover:bg-sky-600 dark:hover:bg-sky-400 transition-all active:scale-95 group"
              >
                <ICONS.Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                <span className="hidden lg:block text-xs font-black uppercase tracking-widest">New Cycle</span>
             </button>

             {/* Profile Avatar */}
             <Link to="/profile" aria-label="View your profile" className="flex items-center">
                <div className="relative">
                  <img src={profile.avatarUrl || defaultAvatar} className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl ring-2 ring-slate-100 dark:ring-white/10 shadow-md object-cover" alt={`${displayName}'s profile picture`} />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-950 rounded-full"></div>
                </div>
             </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-white dark:bg-slate-950 relative custom-scrollbar pb-28 sm:pb-32 lg:pb-12 flex flex-col transition-colors duration-500" role="main" aria-label="Main content">
          {/* Subtle Dynamic BG Elements */}
          <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden opacity-40 dark:opacity-10">
            <div className="absolute top-0 right-0 w-[400px] sm:w-[600px] lg:w-[800px] h-[400px] sm:h-[600px] lg:h-[800px] bg-sky-50 dark:bg-sky-500/10 rounded-full blur-[100px] sm:blur-[120px] lg:blur-[150px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-[300px] sm:w-[450px] lg:w-[600px] h-[300px] sm:h-[450px] lg:h-[600px] bg-pink-50 dark:bg-pink-500/10 rounded-full blur-[80px] sm:blur-[100px] lg:blur-[120px] translate-y-1/2 -translate-x-1/2"></div>
          </div>

          <div className="p-4 sm:p-6 lg:p-12 max-w-7xl mx-auto w-full animate-in fade-in duration-700 flex-1">
            {children}
          </div>

          <footer className="p-4 sm:p-6 lg:p-12 pt-8 sm:pt-10 max-w-7xl mx-auto w-full">
             <div className="border-t border-slate-100 dark:border-white/5 pt-6 sm:pt-8 space-y-4 sm:space-y-6">
                <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-amber-50 dark:bg-amber-500/10 rounded-xl sm:rounded-2xl border border-amber-100 dark:border-amber-500/20">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-amber-600 dark:text-amber-400"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">Important</p>
                    <p className="text-xs text-amber-700 dark:text-amber-400/80 leading-relaxed">
                      This platform is intended for tracking and informational purposes only. It is not medical advice and should not be used as a substitute for professional clinical judgment. Always talk to your doctor or nephrologist for all medical decisions, diagnoses, or treatments.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
                   <p className="text-xs font-bold text-slate-400 dark:text-slate-600">© 2025 dialysis.live</p>
                   <p className="text-xs text-slate-400 dark:text-slate-600">
                     Website developed by <a href="https://kaspar.works/" target="_blank" rel="noopener noreferrer" className="font-bold text-sky-500 hover:text-pink-500 transition-colors">kaspar.works</a>
                   </p>
                </div>
             </div>
          </footer>
        </main>

        {/* Mobile Bottom Navigation Bar - Quick Access */}
        <nav
          className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 lg:hidden z-50 safe-pb"
          role="navigation"
          aria-label="Mobile quick navigation"
        >
          <div className="flex items-center justify-around px-2 py-2">
            {[
              { path: '/dashboard', icon: ICONS.Dashboard, label: 'Home' },
              { path: '/sessions', icon: ICONS.Activity, label: 'Sessions' },
              { path: '/vitals', icon: ICONS.Vitals, label: 'Vitals' },
              { path: '/fluid', icon: ICONS.Droplet, label: 'Hydration' },
              { path: '/meds', icon: ICONS.Pill, label: 'Meds' }
            ].map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-label={`Navigate to ${item.label}`}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all min-w-[56px] ${
                    isActive
                      ? 'text-sky-500'
                      : 'text-slate-400 dark:text-slate-500 active:bg-slate-100 dark:active:bg-white/10'
                  }`}
                >
                  <div className={`p-2 rounded-xl transition-all ${
                    isActive
                      ? 'bg-sky-500/10 dark:bg-sky-500/20'
                      : ''
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-bold ${isActive ? 'text-sky-500' : ''}`}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Mobile Slide-out Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <aside
            className="absolute top-0 left-0 bottom-0 w-[85%] max-w-[320px] bg-white dark:bg-slate-900 shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/10">
              <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3">
                <Logo className="w-10 h-10" />
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">dialysis.live</h2>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Patient Portal</p>
                </div>
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/20 transition-all active:scale-95"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Profile Quick Access */}
            <Link
              to="/profile"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/10"
            >
              <img
                src={profile.avatarUrl || defaultAvatar}
                className="w-12 h-12 rounded-xl ring-2 ring-white dark:ring-white/20 shadow-md object-cover"
                alt={`${displayName}'s profile`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{displayName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{displayEmail}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-400 dark:text-slate-500">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </Link>

            {/* Scrollable Menu Items */}
            <nav className="flex-1 overflow-y-auto py-4 px-3">
              <div className="space-y-1">
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all ${
                        isActive
                          ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 active:bg-slate-200 dark:active:bg-white/15'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                      <span className="font-semibold text-sm">{item.name}</span>
                      {isActive && (
                        <div className="ml-auto w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]"></div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-white/10 space-y-2">
              <Link
                to="/settings"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                  location.pathname === '/settings'
                    ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'
                }`}
              >
                <ICONS.Settings className="w-5 h-5" />
                <span className="font-semibold text-sm">Settings</span>
              </Link>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-4 px-4 py-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                <span className="font-semibold text-sm">Logout</span>
              </button>

              <div className="pt-3 mt-2 border-t border-slate-100 dark:border-white/10">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 text-center uppercase tracking-wider">
                  Developed by <a href="https://kaspar.works/" target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:text-pink-500 transition-colors">kaspar.works</a>
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Help Chat Widget */}
      <HelpChatWidget />
    </div>
  );
};

export default Layout;
