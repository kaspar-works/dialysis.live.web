
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

  const defaultAvatar = "https://ui-avatars.com/api/?name=" + encodeURIComponent(displayName) + "&background=4EC7B8&color=fff&bold=true";

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
        {/* Universal Header — Editorial Horology */}
        {(() => {
          const currentItem = menuItems.find(m => m.path === location.pathname);
          const pageTitle = currentItem?.name || 'Overview';
          const pageIndex = menuItems.findIndex(m => m.path === location.pathname);
          const serial = String(pageIndex >= 0 ? pageIndex + 1 : 0).padStart(2, '0');
          const planColor = subPlan === 'premium' ? '#C99638' : subPlan === 'basic' ? '#5C8FD1' : '#7B7A74';

          return (
            <header
              className="header-edge z-50 sticky top-0 safe-pt relative"
              role="banner"
              style={{
                backgroundColor: 'rgba(244,241,236,0.78)',
                backdropFilter: 'blur(28px) saturate(180%)',
                WebkitBackdropFilter: 'blur(28px) saturate(180%)',
              }}
            >
              <div className="flex items-center justify-between gap-3 sm:gap-4 px-4 sm:px-6 lg:px-10 h-16 sm:h-20 lg:h-[78px]">

                {/* LEFT — Mobile: hamburger + wordmark + title */}
                <div className="flex items-center gap-3 lg:hidden min-w-0">
                  <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    aria-label="Open navigation menu"
                    className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl text-[#4A4F5C] active:scale-95 transition-all"
                    style={{ backgroundColor: '#EDE9E1', border: '1px solid rgba(230,225,215,0.9)' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                      <line x1="4" y1="7" x2="20" y2="7"/>
                      <line x1="4" y1="12" x2="20" y2="12"/>
                      <line x1="4" y1="17" x2="14" y2="17"/>
                    </svg>
                  </button>
                  <div className="flex flex-col leading-none min-w-0">
                    <span className="font-mono-brand text-[9px] font-medium uppercase truncate editorial-serial" style={{ color: '#7B7A74' }}>
                      <span style={{ color: '#2F8F87' }}>No. {serial}</span>
                      <span className="mx-1.5 opacity-40">·</span>
                      Dialysis.live
                    </span>
                    <h2 className="font-editorial text-[22px] leading-[1.1] truncate mt-0.5" style={{ color: '#1F2D2A' }}>
                      <em>{pageTitle}</em>
                    </h2>
                  </div>
                </div>

                {/* LEFT — Desktop: editorial title block */}
                <div className="hidden lg:flex items-stretch gap-5 min-w-0 flex-1">
                  <div className="flex flex-col justify-center">
                    <div
                      className="w-[3px] h-12 rounded-full shrink-0"
                      style={{
                        background: 'linear-gradient(180deg, #2F8F87 0%, #4EC7B8 55%, rgba(126,214,167,0.15) 100%)',
                      }}
                    />
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-brand text-[10px] font-semibold uppercase editorial-serial" style={{ color: '#2F8F87' }}>
                        No. {serial}
                      </span>
                      <span className="w-1 h-1 rounded-full" style={{ backgroundColor: 'rgba(31,45,42,0.25)' }} />
                      <span className="font-mono-brand text-[10px] font-medium uppercase tracking-[0.32em]" style={{ color: '#7B7A74' }}>
                        Patient Care
                      </span>
                    </div>
                    <h2
                      className="font-editorial text-[30px] leading-[1.05] truncate mt-0.5"
                      style={{ color: '#1F2D2A' }}
                    >
                      <em>{pageTitle}</em>
                    </h2>
                  </div>
                </div>

                {/* RIGHT — Instrument cluster + CTA + avatar */}
                <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">

                  {/* Unified Status Instrument (AI + Plan) */}
                  {aiUsage && (
                    <Link
                      to="/subscription"
                      aria-label="View subscription and AI usage"
                      className="hidden md:flex items-center h-11 rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5 group"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.62) 100%)',
                        boxShadow:
                          'inset 0 1px 0 rgba(255,255,255,0.85), inset 0 -1px 0 rgba(31,45,42,0.04), 0 1px 2px rgba(31,45,42,0.04), 0 6px 22px -12px rgba(31,45,42,0.15)',
                        border: '1px solid rgba(230,225,215,0.85)',
                        backdropFilter: 'blur(12px)',
                      }}
                    >
                      {/* AI half */}
                      <div className="flex items-center gap-2 pl-3.5 pr-3 h-full">
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center"
                          style={{
                            background: 'linear-gradient(135deg, rgba(228,218,242,0.9), rgba(228,218,242,0.4))',
                            border: '1px solid rgba(138,111,196,0.2)',
                          }}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8A6FC4" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                          </svg>
                        </div>
                        <div className="flex flex-col leading-none">
                          <span className="font-mono-brand text-[8px] font-semibold tracking-[0.24em] uppercase" style={{ color: '#9B9A94' }}>AI</span>
                          <span className="font-mono-brand text-[12.5px] font-semibold tabular-nums mt-0.5" style={{ color: '#1F2D2A' }}>
                            {aiUsage.used}
                            <span className="mx-[2px] font-normal" style={{ color: '#8A6FC4' }}>/</span>
                            {aiUsage.unlimited ? <span style={{ color: '#8A6FC4' }}>∞</span> : aiUsage.limit}
                          </span>
                        </div>
                      </div>

                      {/* Divider */}
                      <div
                        className="w-px h-7 shrink-0"
                        style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(31,45,42,0.14) 50%, transparent 100%)' }}
                      />

                      {/* Plan half */}
                      <div className="flex items-center gap-1.5 pl-3 pr-3.5 h-full">
                        {subPlan === 'premium' ? (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="#C99638">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                        ) : (
                          <span
                            className="w-[7px] h-[7px] rounded-full"
                            style={{ backgroundColor: planColor, boxShadow: `0 0 0 3px ${planColor}22` }}
                          />
                        )}
                        <span
                          className="font-mono-brand text-[10px] font-bold uppercase tracking-[0.22em]"
                          style={{ color: planColor }}
                        >
                          {subPlan}
                        </span>
                      </div>
                    </Link>
                  )}

                  {/* New Cycle — editorial CTA pill */}
                  <button
                    onClick={() => navigate('/sessions')}
                    aria-label="Start new dialysis session"
                    className="relative h-11 w-11 lg:w-auto lg:px-5 rounded-2xl flex items-center justify-center gap-2.5 text-white transition-all active:scale-[0.97] hover:-translate-y-0.5 group overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, #2F8F87 0%, #4EC7B8 55%, #7ED6A7 100%)',
                      boxShadow:
                        'inset 0 1px 0 rgba(255,255,255,0.42), inset 0 -1px 0 rgba(0,0,0,0.1), 0 10px 26px -10px rgba(47,143,135,0.55), 0 2px 6px -2px rgba(47,143,135,0.35)',
                    }}
                  >
                    <span className="header-shimmer-sweep" aria-hidden="true" />
                    <svg
                      width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                      className="relative z-10 transition-transform duration-500 group-hover:rotate-[135deg]"
                    >
                      <circle cx="12" cy="12" r="9" opacity="0.35"/>
                      <line x1="12" y1="8" x2="12" y2="16"/>
                      <line x1="8" y1="12" x2="16" y2="12"/>
                    </svg>
                    <span className="relative z-10 hidden lg:block font-mono-brand text-[10.5px] font-bold uppercase tracking-[0.28em]">
                      New Cycle
                    </span>
                  </button>

                  {/* Profile — avatar with breathing ring */}
                  <Link
                    to="/profile"
                    aria-label={`View ${displayName}'s profile`}
                    className="relative flex items-center shrink-0"
                  >
                    <span className="presence-ring" aria-hidden="true" />
                    <img
                      src={profile.avatarUrl || defaultAvatar}
                      className="w-11 h-11 rounded-2xl object-cover relative z-10"
                      style={{
                        boxShadow:
                          '0 0 0 2px #F4F1EC, 0 0 0 3px rgba(230,225,215,0.95), 0 8px 18px -8px rgba(31,45,42,0.22)',
                      }}
                      alt=""
                    />
                    <span
                      className="presence-dot absolute bottom-[2px] right-[2px] w-2.5 h-2.5 rounded-full z-20"
                      style={{ backgroundColor: '#4FA872' }}
                      aria-hidden="true"
                    />
                  </Link>
                </div>
              </div>
            </header>
          );
        })()}

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
