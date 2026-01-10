import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ICONS } from '../constants';
import { useStore } from '../store';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { profile, setTheme } = useStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/logout');
  };

  const toggleTheme = () => {
    setTheme(profile.settings.display.theme === 'dark' ? 'light' : 'dark');
  };

  const adminMenuItems = [
    { name: 'Overview', path: '/admin', icon: ICONS.Dashboard, exact: true },
    { name: 'Users', path: '/admin/users', icon: ICONS.User },
    { name: 'Error Logs', path: '/admin/errors', icon: ICONS.AlertCircle },
    { name: 'Activity Logs', path: '/admin/activity', icon: ICONS.Activity },
    { name: 'System Alerts', path: '/admin/alerts', icon: ICONS.Bell },
    { name: 'Announcements', path: '/admin/announcements', icon: ICONS.MessageSquare },
    { name: 'Page Settings', path: '/admin/pages', icon: ICONS.Settings },
    { name: 'Build Info', path: '/admin/build', icon: ICONS.Code },
  ];

  const isActivePath = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Admin Sidebar */}
      <aside
        className={`${isSidebarCollapsed ? 'w-20' : 'w-72'} bg-slate-900 border-r border-slate-800 transition-all duration-300 ease-in-out flex flex-col hidden lg:flex relative z-30`}
      >
        {/* Admin Logo */}
        <div className="p-6 border-b border-slate-800">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <ICONS.Shield className="w-5 h-5 text-white" />
            </div>
            {!isSidebarCollapsed && (
              <div>
                <h1 className="text-white font-black text-lg tracking-tight">Admin</h1>
                <p className="text-violet-400 text-[10px] font-bold uppercase tracking-wider">Control Panel</p>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {adminMenuItems.map((item) => {
            const isActive = isActivePath(item.path, item.exact);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-violet-400' : 'text-slate-500 group-hover:text-white'}`} />
                {!isSidebarCollapsed && <span className="font-semibold text-sm">{item.name}</span>}
                {isActive && !isSidebarCollapsed && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          {/* Back to Dashboard */}
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all border border-transparent"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
            </svg>
            {!isSidebarCollapsed && <span className="font-semibold text-sm">Back to App</span>}
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all font-semibold text-sm border border-transparent"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            {!isSidebarCollapsed && <span>Logout</span>}
          </button>

          {/* Collapse Toggle */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full flex items-center justify-center gap-3 px-4 py-2 text-slate-500 hover:text-slate-300 transition-all text-sm"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`}
            >
              <path d="m11 17-5-5 5-5"/><path d="m18 17-5-5 5-5"/>
            </svg>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Admin Header */}
        <header className="h-16 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-40">
          {/* Mobile Menu & Breadcrumb */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              onClick={() => navigate('/admin')}
            >
              <ICONS.Shield className="w-6 h-6 text-violet-400" />
            </button>

            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="text-slate-500">Admin</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-600">
                <path d="m9 18 6-6-6-6"/>
              </svg>
              <span className="text-white font-semibold">
                {adminMenuItems.find(m => isActivePath(m.path, m.exact))?.name || 'Dashboard'}
              </span>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            {/* Status Indicator */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-emerald-400 text-xs font-semibold">System Online</span>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              {profile.settings.display.theme === 'dark' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>

            {/* Admin Profile */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-700">
              <div className="hidden sm:block text-right">
                <p className="text-white text-sm font-semibold">{profile.name || 'Admin'}</p>
                <p className="text-violet-400 text-xs">Administrator</p>
              </div>
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {(profile.name || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-violet-500 border-2 border-slate-900 rounded-full" />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-950 relative">
          {/* Background Elements */}
          <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
          </div>

          {/* Content */}
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 flex items-center justify-around px-2 z-50 safe-pb">
          {[
            { path: '/admin', icon: ICONS.Dashboard, label: 'Home', exact: true },
            { path: '/admin/users', icon: ICONS.User, label: 'Users' },
            { path: '/admin/errors', icon: ICONS.AlertCircle, label: 'Errors' },
            { path: '/admin/activity', icon: ICONS.Activity, label: 'Activity' },
            { path: '/dashboard', icon: (props: any) => (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
                <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
              </svg>
            ), label: 'Exit' },
          ].map((item) => {
            const isActive = isActivePath(item.path, item.exact);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 transition-all ${
                  isActive ? 'text-violet-400' : 'text-slate-500'
                }`}
              >
                <div className={`p-2 rounded-xl transition-all ${
                  isActive ? 'bg-violet-500/20' : ''
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default AdminLayout;
