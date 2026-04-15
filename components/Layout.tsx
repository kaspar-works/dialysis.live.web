
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ICONS } from '../constants';
import { useStore } from '../store';
import { version } from '../package.json';
import { useAuth } from '../contexts/AuthContext';
import { getAIUsage, AIUsage } from '../services/ai';
import { getCurrentSubscription, Subscription } from '../services/subscription';
import Logo from './Logo';
import HelpChatWidget from './HelpChatWidget';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('sidebar-collapsed');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const { profile } = useStore();
  const { authProfile, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => {
      const next = { ...prev, [section]: !prev[section] };
      localStorage.setItem('sidebar-collapsed', JSON.stringify(next));
      return next;
    });
  };

  const [aiUsage, setAiUsage] = useState<AIUsage | null>(null);
  const [subPlan, setSubPlan] = useState<string>('free');

  // Use AuthContext profile (shared state) with fallback to local store
  const displayName = authProfile?.fullName || profile.name || 'User';
  const displayEmail = user?.email || profile.email || '';

  // Fetch AI usage and subscription on mount
  useEffect(() => {
    getAIUsage().then(setAiUsage).catch(() => {});
    getCurrentSubscription().then((sub) => setSubPlan(sub.plan)).catch(() => {});
  }, []);

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

const menuSections = [
    { label: null, items: [
      { name: 'Dashboard', path: '/dashboard', icon: ICONS.Dashboard },
    ]},
    { label: 'Dialysis', items: [
      { name: 'Sessions', path: '/sessions', icon: ICONS.Activity },
      { name: 'Access Site', path: '/access-site', icon: (props: any) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
      )},
    ]},
    { label: 'Tracking', items: [
      { name: 'Vitals Hub', path: '/vitals', icon: ICONS.Vitals },
      { name: 'Weight', path: '/weight', icon: ICONS.Scale },
      { name: 'Hydration', path: '/fluid', icon: ICONS.Droplet },
      { name: 'Exercise', path: '/exercise', icon: (props: any) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="18.5" cy="3.5" r="2.5"/><path d="M12 7.5 7.5 12 4 8.5"/><path d="m7.5 12 5 5"/><path d="M12 17.5V22"/><path d="m4.5 16.5 3-3"/><path d="m14.5 8.5 5 5"/></svg>
      )},
      { name: 'Nutrition', path: '/nutrition', icon: (props: any) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
      )},
      { name: 'Nutri-Scan', path: '/nutri-scan', icon: (props: any) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
      )},
    ]},
    { label: 'Clinical', items: [
      { name: 'Symptoms', path: '/symptoms', icon: (props: any) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
      )},
      { name: 'Labs', path: '/labs', icon: (props: any) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/></svg>
      )},
      { name: 'Meds', path: '/meds', icon: ICONS.Pill },
      { name: 'Symptom Check', path: '/symptom-analysis', icon: (props: any) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>
      )},
    ]},
    { label: 'Planning', items: [
      { name: 'Reminders', path: '/reminders', icon: ICONS.Bell },
      { name: 'Appointments', path: '/appointments', icon: ICONS.Calendar },
    ]},
    { label: 'AI & Analytics', items: [
      { name: 'AI Chat', path: '/ai-chat', icon: (props: any) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      )},
      { name: 'AI Insights', path: '/ai-insights', icon: ICONS.Sparkles },
      { name: 'Fatigue AI', path: '/fatigue-prediction', icon: (props: any) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
      )},
      { name: 'Reports', path: '/reports', icon: (props: any) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
      )},
    ]},
    { label: 'Social', items: [
      { name: 'Community Q&A', path: '/messages', icon: (props: any) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      )},
      { name: 'Achievements', path: '/achievements', icon: (props: any) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
      )},
    ]},
  ];

  // Flat list for header title lookup and mobile drawer
  const menuItems = menuSections.flatMap(s => s.items);

  const defaultAvatar = "https://ui-avatars.com/api/?name=" + encodeURIComponent(displayName) + "&background=0ea5e9&color=fff&bold=true";

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F1EC] transition-colors duration-500">
      {/* Desktop Sidebar */}
      <aside
        className={`${isSidebarOpen ? 'w-72' : 'w-24'} bg-[#F4F1EC] border-r border-[#E6E1D7] transition-all duration-500 ease-in-out flex flex-col hidden lg:flex relative z-30 shadow-[10px_0_30px_rgba(0,0,0,0.01)] dark:shadow-none`}
        role="complementary"
        aria-label="Main sidebar navigation"
      >
        <div className="p-8">
          <Link to="/dashboard" aria-label="Go to dashboard">
            <Logo showText={isSidebarOpen} className="w-10 h-10" />
          </Link>
        </div>

        <nav className="flex-1 mt-4 px-4 space-y-1 overflow-y-auto custom-scrollbar" aria-label="Main navigation">
          {menuSections.map((section) => {
            const isCollapsed = section.label ? collapsedSections[section.label] : false;
            const hasActiveItem = section.items.some(item => location.pathname === item.path);
            return (
              <div key={section.label || 'top'}>
                {section.label && isSidebarOpen && (
                  <button
                    onClick={() => toggleSection(section.label!)}
                    className="w-full flex items-center justify-between px-4 pt-5 pb-2 group"
                  >
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${hasActiveItem ? 'text-[#2F8F87]' : 'text-[#9B9A94] group-hover:text-[#7B7A74]'}`}>
                      {section.label}
                    </span>
                    <svg
                      width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                      className={`text-[#9B9A94] transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                )}
                {section.label && !isSidebarOpen && (
                  <div className="mx-auto w-6 border-t border-[#E6E1D7] mt-4 mb-2" />
                )}
                <div className={`space-y-1 overflow-hidden transition-all duration-200 ${isCollapsed && isSidebarOpen ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'}`}>
                  {section.items.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.path}
                        aria-label={`Navigate to ${item.name}`}
                        aria-current={isActive ? 'page' : undefined}
                        className="flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group"
                        style={
                          isActive
                            ? {
                                background: 'linear-gradient(135deg, #4EC7B8 0%, #7ED6A7 100%)',
                                color: '#fff',
                                boxShadow: '0 8px 24px -8px rgba(78,199,184,0.45)',
                              }
                            : { color: '#7B7A74' }
                        }
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            (e.currentTarget as HTMLElement).style.backgroundColor = '#EDE9E1';
                            (e.currentTarget as HTMLElement).style.color = '#1F2D2A';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            (e.currentTarget as HTMLElement).style.backgroundColor = '';
                            (e.currentTarget as HTMLElement).style.color = '#7B7A74';
                          }
                        }}
                      >
                        <Icon className="w-5 h-5 transition-colors" style={{ color: isActive ? '#fff' : 'currentColor' }} />
                        {isSidebarOpen && <span className="font-bold text-sm tracking-tight">{item.name}</span>}
                        {isActive && isSidebarOpen && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80"></div>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="p-6 space-y-4">
          <Link to="/help" className={`flex items-center gap-4 px-4 py-3 rounded-2xl text-[#7B7A74] hover:text-[#1F2D2A] transition-all ${location.pathname === '/help' ? 'text-[#1F2D2A] bg-[#EDE9E1]' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            {isSidebarOpen && <span className="font-bold text-sm">Help</span>}
          </Link>
          <Link to="/settings" className={`flex items-center gap-4 px-4 py-3 rounded-2xl text-[#7B7A74] hover:text-[#1F2D2A] transition-all ${location.pathname === '/settings' ? 'text-[#1F2D2A] bg-[#EDE9E1]' : ''}`}>
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
            <div className="px-4 pt-4 border-t border-[#E6E1D7]">
               <p className="text-[8px] font-black text-[#9B9A94] uppercase tracking-widest">
                  Developed by <a href="https://kaspar.works/" target="_blank" rel="noopener noreferrer" className="text-[#2F8F87] hover:text-[#E87556] transition-colors">kaspar.works</a>
               </p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Universal Header */}
        <header
          className="bg-[#F4F1EC]/85 backdrop-blur-2xl border-b border-[#E6E1D7] z-50 sticky top-0 safe-pt relative"
          role="banner"
        >
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-12 h-16 sm:h-20 lg:h-[72px]">
            {/* Mobile: Hamburger + Logo */}
            <div className="flex items-center gap-3 lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open navigation menu"
                className="w-10 h-10 flex items-center justify-center bg-[#EDE9E1] rounded-xl text-[#4A4F5C] hover:bg-[#E6E1D7] transition-all active:scale-95"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              </button>
              <Link to="/dashboard" className="flex items-center gap-2">
                <Logo className="w-8 h-8" />
                <span className="text-base font-black text-[#1F2D2A] uppercase tracking-tight hidden xs:block">dialysis.live</span>
              </Link>
            </div>

            {/* Desktop: Page Title */}
            <div className="hidden lg:flex flex-col">
              <span className="text-[10px] font-black text-[#9B9A94] uppercase tracking-[0.3em]">Patient Node Sync</span>
              <h2 className="text-xl font-black text-[#1F2D2A] uppercase tracking-tight">
                {menuItems.find(m => m.path === location.pathname)?.name || 'Application Hub'}
              </h2>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
              {/* AI Usage Badge */}
              {aiUsage && (
                <Link
                  to="/subscription"
                  className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-violet-500/10 to-purple-500/10 dark:from-violet-500/20 dark:to-purple-500/20 border border-violet-500/20 dark:border-violet-500/30 rounded-xl hover:border-violet-500/40 transition-all"
                >
                  <svg className="w-4 h-4 text-violet-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider leading-none">AI Calls</span>
                    <span className="text-xs font-black text-violet-700 dark:text-violet-300 leading-tight">
                      {aiUsage.unlimited ? (
                        <>{aiUsage.used} / <span className="text-violet-400">&#8734;</span></>
                      ) : (
                        <>{aiUsage.used} / {aiUsage.limit}</>
                      )}
                    </span>
                  </div>
                </Link>
              )}

              {/* Plan Badge */}
              <Link
                to="/subscription"
                className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  subPlan === 'premium'
                    ? 'bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 hover:border-amber-500/40'
                    : subPlan === 'basic'
                      ? 'bg-gradient-to-r from-sky-500/10 to-cyan-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 hover:border-sky-500/40'
                      : 'bg-[#EDE9E1] border border-[#E6E1D7] text-[#7B7A74] hover:border-slate-300'
                }`}
              >
                {subPlan === 'premium' && <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>}
                {subPlan}
              </Link>

              {/* New Cycle Button */}
              <button
                onClick={() => navigate('/sessions')}
                aria-label="Start new dialysis session"
                className="w-10 h-10 lg:w-auto lg:px-5 lg:py-2.5 text-white rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 hover:-translate-y-0.5 hover:shadow-lg group"
                style={{
                  background: 'linear-gradient(135deg, #4EC7B8 0%, #7ED6A7 100%)',
                  boxShadow: '0 8px 24px -8px rgba(78,199,184,0.5)',
                }}
              >
                <ICONS.Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                <span className="hidden lg:block text-xs font-black uppercase tracking-widest">New Cycle</span>
              </button>

              {/* Profile Card */}
              <Link to="/profile" aria-label="View your profile" className="flex items-center gap-3">
                <div className="hidden lg:flex flex-col items-end">
                  <span className="text-sm font-bold text-[#1F2D2A] leading-tight truncate max-w-[160px]">{displayName}</span>
                  <span className="text-[11px] text-[#7B7A74] leading-tight truncate max-w-[160px]">{displayEmail}</span>
                </div>
                <div className="relative">
                  <img src={profile.avatarUrl || defaultAvatar} className="w-10 h-10 lg:w-11 lg:h-11 rounded-xl ring-2 ring-[#E6E1D7] shadow-md object-cover" alt={`${displayName}'s profile picture`} />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#F4F1EC] rounded-full"></div>
                </div>
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#F4F1EC] relative custom-scrollbar pb-28 sm:pb-32 lg:pb-12 flex flex-col transition-colors duration-500" role="main" aria-label="Main content">
          {/* Subtle Dynamic BG Elements */}
          <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden opacity-40 dark:opacity-10">
            <div className="absolute top-0 right-0 w-[400px] sm:w-[600px] lg:w-[800px] h-[400px] sm:h-[600px] lg:h-[800px] rounded-full blur-[100px] sm:blur-[120px] lg:blur-[150px] -translate-y-1/2 translate-x-1/2" style={{ backgroundColor: '#D8E7F8' }}></div>
            <div className="absolute bottom-0 left-0 w-[300px] sm:w-[450px] lg:w-[600px] h-[300px] sm:h-[450px] lg:h-[600px] rounded-full blur-[80px] sm:blur-[100px] lg:blur-[120px] translate-y-1/2 -translate-x-1/2" style={{ backgroundColor: '#E4DAF2' }}></div>
          </div>

          <div className="p-4 sm:p-6 lg:p-12 max-w-7xl mx-auto w-full animate-in fade-in duration-700 flex-1">
            {children}
          </div>

          <footer className="p-4 sm:p-6 lg:p-12 pt-8 sm:pt-10 max-w-7xl mx-auto w-full">
             <div className="border-t border-[#E6E1D7] pt-6 sm:pt-8 space-y-4 sm:space-y-6">
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
                   <p className="text-xs font-bold text-[#9B9A94]">© 2026 dialysis.live · v{version}</p>
                   <p className="text-xs text-[#9B9A94]">
                     Website developed by <a href="https://kaspar.works/" target="_blank" rel="noopener noreferrer" className="font-bold text-[#2F8F87] hover:text-[#E87556] transition-colors">kaspar.works</a>
                   </p>
                </div>
             </div>
          </footer>
        </main>

        {/* Mobile Bottom Navigation Bar - Quick Access */}
        <nav
          className="fixed bottom-0 left-0 right-0 bg-[#F4F1EC]/95 backdrop-blur-xl border-t border-[#E6E1D7] lg:hidden z-50 safe-pb"
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
                      ? 'text-[#2F8F87]'
                      : 'text-[#7B7A74] active:bg-[#E6E1D7]'
                  }`}
                >
                  <div className={`p-2 rounded-xl transition-all ${
                    isActive
                      ? 'bg-[#4EC7B8]/20'
                      : ''
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-bold ${isActive ? 'text-[#2F8F87]' : ''}`}>{item.label}</span>
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
            className="absolute top-0 left-0 bottom-0 w-[85%] max-w-[320px] bg-[#F4F1EC] shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#E6E1D7]">
              <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3">
                <Logo className="w-10 h-10" />
                <div>
                  <h2 className="text-lg font-black text-[#1F2D2A] uppercase tracking-tight">dialysis.live</h2>
                  <p className="text-[10px] font-bold text-[#7B7A74] uppercase tracking-wider">Patient Portal</p>
                </div>
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#EDE9E1] text-[#7B7A74] hover:bg-[#E6E1D7] transition-all active:scale-95"
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
              className="flex items-center gap-4 p-5 bg-[#EDE9E1] border-b border-[#E6E1D7]"
            >
              <img
                src={profile.avatarUrl || defaultAvatar}
                className="w-12 h-12 rounded-xl ring-2 ring-white shadow-md object-cover"
                alt={`${displayName}'s profile`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#1F2D2A] truncate">{displayName}</p>
                <p className="text-xs text-[#7B7A74] truncate">{displayEmail}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#7B7A74]">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </Link>

            {/* Scrollable Menu Items */}
            <nav className="flex-1 overflow-y-auto py-4 px-3">
              {menuSections.map((section) => {
                const isCollapsed = section.label ? collapsedSections[section.label] : false;
                const hasActiveItem = section.items.some(item => location.pathname === item.path);
                return (
                  <div key={section.label || 'top'}>
                    {section.label && (
                      <button
                        onClick={() => toggleSection(section.label!)}
                        className="w-full flex items-center justify-between px-4 pt-4 pb-2 group"
                      >
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${hasActiveItem ? 'text-[#2F8F87]' : 'text-[#7B7A74]'}`}>
                          {section.label}
                        </span>
                        <svg
                          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                          className={`text-[#7B7A74] transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
                        >
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </button>
                    )}
                    <div className={`space-y-1 overflow-hidden transition-all duration-200 ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'}`}>
                      {section.items.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.name}
                            to={item.path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all"
                            style={
                              isActive
                                ? {
                                    background: 'linear-gradient(135deg, #4EC7B8 0%, #7ED6A7 100%)',
                                    color: '#fff',
                                    boxShadow: '0 8px 24px -8px rgba(78,199,184,0.45)',
                                  }
                                : { color: '#4A4F5C' }
                            }
                          >
                            <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#7B7A74]'}`} />
                            <span className="font-semibold text-sm">{item.name}</span>
                            {isActive && (
                              <div className="ml-auto w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]"></div>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-[#E6E1D7] space-y-2">
              <Link
                to="/help"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                  location.pathname === '/help'
                    ? 'bg-[#EDE9E1] text-[#1F2D2A]'
                    : 'text-[#7B7A74] hover:bg-[#EDE9E1]'
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <span className="font-semibold text-sm">Help</span>
              </Link>
              <Link
                to="/settings"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                  location.pathname === '/settings'
                    ? 'bg-[#EDE9E1] text-[#1F2D2A]'
                    : 'text-[#7B7A74] hover:bg-[#EDE9E1]'
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

              <div className="pt-3 mt-2 border-t border-[#E6E1D7]">
                <p className="text-[10px] font-bold text-[#9B9A94] text-center uppercase tracking-wider">
                  Developed by <a href="https://kaspar.works/" target="_blank" rel="noopener noreferrer" className="text-[#2F8F87] hover:text-[#E87556] transition-colors">kaspar.works</a>
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
