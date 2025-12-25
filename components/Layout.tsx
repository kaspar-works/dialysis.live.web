
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ICONS } from '../constants';
import { useStore } from '../store';
import Logo from './Logo';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { logout, profile, setTheme } = useStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
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
    { name: 'Biometrics', path: '/weight', icon: ICONS.Scale },
    { name: 'Hydration', path: '/fluid', icon: ICONS.Droplet },
    { name: 'Nutri-Scan', path: '/nutri-scan', icon: (props: any) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
    )},
    { name: 'Meds', path: '/meds', icon: ICONS.Pill },
    { name: 'Reports', path: '/reports', icon: (props: any) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
    )},
  ];

  const defaultAvatar = "https://ui-avatars.com/api/?name=" + encodeURIComponent(profile.name) + "&background=0ea5e9&color=fff&bold=true";

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-500">
      {/* Desktop Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-24'} bg-white dark:bg-slate-950 border-r border-slate-100 dark:border-white/5 transition-all duration-500 ease-in-out flex flex-col hidden lg:flex relative z-30 shadow-[10px_0_30px_rgba(0,0,0,0.01)] dark:shadow-none`}>
        <div className="p-8">
          <Link to="/dashboard">
            <Logo showText={isSidebarOpen} className="w-10 h-10" />
          </Link>
        </div>
        
        <nav className="flex-1 mt-4 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
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
        <header className="h-20 lg:h-24 bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-b border-slate-50 dark:border-white/5 flex items-center justify-between px-6 lg:px-12 z-40 sticky top-0 safe-pt">
          <div className="flex items-center gap-4 lg:hidden">
            <Logo className="w-8 h-8" />
            <h1 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">dialysis.live</h1>
          </div>
          <div className="hidden lg:flex flex-col">
            <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.3em]">Patient Node Sync</span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {menuItems.find(m => m.path === location.pathname)?.name || 'Application Hub'}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Day/Night Toggle */}
             <button 
                onClick={toggleTheme}
                aria-label="Toggle Theme"
                className="w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center bg-slate-50 dark:bg-white/5 rounded-2xl text-slate-400 dark:text-slate-500 hover:text-sky-500 transition-all border border-slate-100 dark:border-white/5 shadow-sm"
              >
                {profile.settings.display.theme === 'dark' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                )}
             </button>

             <button 
                onClick={() => navigate('/sessions')}
                className="w-10 h-10 lg:w-auto lg:px-6 lg:py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-2xl flex items-center justify-center gap-2 shadow-xl hover:bg-sky-600 dark:hover:bg-sky-500 dark:hover:text-white transition-all active:scale-95 group"
              >
                <ICONS.Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                <span className="hidden lg:block text-xs font-black uppercase tracking-widest">New Cycle</span>
             </button>

             <Link to="/profile" className="flex items-center gap-3">
                <div className="relative">
                  <img src={profile.avatarUrl || defaultAvatar} className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl ring-4 ring-slate-50 dark:ring-white/5 shadow-md object-cover" alt="user" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-950 rounded-full shadow-sm animate-pulse"></div>
                </div>
             </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-white dark:bg-slate-950 relative custom-scrollbar pb-32 lg:pb-12 flex flex-col transition-colors duration-500">
          {/* Subtle Dynamic BG Elements */}
          <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden opacity-40 dark:opacity-10">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-sky-50 dark:bg-sky-500/10 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-pink-50 dark:bg-pink-500/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2"></div>
          </div>
          
          <div className="p-6 lg:p-12 max-w-7xl mx-auto w-full animate-in fade-in duration-700 flex-1">
            {children}
          </div>

          <footer className="p-6 lg:p-12 pt-10 max-w-7xl mx-auto w-full group transition-all">
             <div className="border-t border-slate-100 dark:border-white/5 pt-8 space-y-6">
                <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 opacity-40 group-hover:opacity-100 transition-opacity">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-white/5 flex items-center justify-center shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-400 dark:text-slate-600"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  </div>
                  <p className="text-[10px] md:text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-relaxed text-center md:text-left">
                    Important: This platform is intended for tracking and informational purposes only. It is not medical advice and should not be used as a substitute for professional clinical judgment. Always talk to your doctor or nephrologist for all medical decisions, diagnoses, or treatments.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 opacity-30 group-hover:opacity-100 transition-opacity">
                   <p className="text-[10px] font-black text-slate-400 dark:text-slate-700 uppercase tracking-widest">© 2025 dialysis.live</p>
                   <p className="text-[10px] font-black text-slate-400 dark:text-slate-700 uppercase tracking-widest">
                     Website developed by <a href="https://kaspar.works/" target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:text-pink-500 transition-colors underline decoration-dotted underline-offset-4">kaspar.works</a>
                   </p>
                </div>
             </div>
          </footer>
        </main>

        {/* Native-feeling Mobile Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 h-24 glass-panel border-t border-slate-100 dark:border-white/5 lg:hidden flex items-center justify-around px-4 z-50 safe-pb">
          {[
            { path: '/dashboard', icon: ICONS.Dashboard, label: 'Home' },
            { path: '/sessions', icon: ICONS.Activity, label: 'Cycles' },
            { path: '/vitals', icon: ICONS.Vitals, label: 'Vitals' },
            { path: '/fluid', icon: ICONS.Droplet, label: 'Fluid' },
            { path: '/settings', icon: ICONS.Settings, label: 'Config' }
          ].map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`flex flex-col items-center gap-1.5 transition-all duration-500 ${isActive ? 'text-slate-900 dark:text-white -translate-y-1' : 'text-slate-400 dark:text-slate-600'}`}
              >
                <div className={`p-3 rounded-2xl transition-all duration-500 ${isActive ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-2xl shadow-slate-400 dark:shadow-none rotate-6 scale-110' : 'bg-slate-50 dark:bg-white/5'}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-60'}`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Layout;
