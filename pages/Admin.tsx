import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { ICONS } from '../constants';
import {
  verifyAdmin,
  getSystemStats,
  getUsers,
  getAnnouncements,
  getErrorLogs,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  resolveError,
  deleteErrorLog,
  deleteResolvedErrors,
  getPageSettings,
  togglePageSetting,
  SystemStats,
  AdminUser,
  SystemAnnouncement,
  ErrorLogEntry,
  ErrorLogStats,
  PageSetting,
} from '../services/admin';

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Determine active section from URL
  const getActiveSection = () => {
    if (location.pathname === '/admin/users') return 'users';
    if (location.pathname === '/admin/errors') return 'logs';
    if (location.pathname === '/admin/announcements') return 'announcements';
    if (location.pathname === '/admin/pages') return 'pages';
    return 'overview';
  };
  const activeSection = getActiveSection();

  // Data states
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersPagination, setUsersPagination] = useState({ total: 0, limit: 50, offset: 0 });
  const [errorLogs, setErrorLogs] = useState<ErrorLogEntry[]>([]);
  const [errorStats, setErrorStats] = useState<ErrorLogStats | null>(null);
  const [errorsPagination, setErrorsPagination] = useState({ total: 0, limit: 100, offset: 0 });
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([]);
  const [errorFilter, setErrorFilter] = useState<'all' | 'critical' | 'error' | 'warn' | 'unresolved'>('all');
  const [selectedError, setSelectedError] = useState<ErrorLogEntry | null>(null);
  const [pageSettings, setPageSettings] = useState<PageSetting[]>([]);
  const [togglingPage, setTogglingPage] = useState<string | null>(null);

  // Form states
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<SystemAnnouncement | null>(null);
  const [announcementForm, setAnnouncementForm] = useState({
    type: 'info' as 'info' | 'warning' | 'success' | 'error',
    title: '',
    message: '',
    dismissible: true,
    active: true,
    priority: 1,
    targetPages: ['dashboard'],
  });
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Search states
  const [userSearch, setUserSearch] = useState('');

  const hasFetched = useRef(false);

  // Verify admin and load initial data
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const initAdmin = async () => {
      try {
        await verifyAdmin();
        setIsAdmin(true);

        // Load initial data
        const [statsData, usersData, errorsData, announcementsData, pageSettingsData] = await Promise.all([
          getSystemStats(),
          getUsers({ limit: 50 }),
          getErrorLogs({ limit: 100 }),
          getAnnouncements(),
          getPageSettings(),
        ]);

        setStats(statsData);
        setUsers(usersData.users);
        setUsersPagination(usersData.pagination);
        setErrorLogs(errorsData.errors);
        setErrorStats(errorsData.stats);
        setErrorsPagination(errorsData.pagination);
        setAnnouncements(announcementsData.announcements);
        setPageSettings(pageSettingsData.pages);
      } catch (err) {
        console.error('Admin access denied:', err);
        setIsAdmin(false);
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    initAdmin();
  }, [navigate]);

  // Search users
  const handleSearchUsers = async () => {
    try {
      const data = await getUsers({ search: userSearch, limit: 50 });
      setUsers(data.users);
      setUsersPagination(data.pagination);
    } catch (err) {
      console.error('Failed to search users:', err);
    }
  };

  // Filter error logs
  const handleFilterErrors = async (filter: typeof errorFilter) => {
    setErrorFilter(filter);
    try {
      const params: { level?: 'error' | 'warn' | 'critical'; resolved?: boolean; limit: number } = { limit: 100 };
      if (filter === 'critical') params.level = 'critical';
      if (filter === 'error') params.level = 'error';
      if (filter === 'warn') params.level = 'warn';
      if (filter === 'unresolved') params.resolved = false;

      const data = await getErrorLogs(params);
      setErrorLogs(data.errors);
      setErrorStats(data.stats);
      setErrorsPagination(data.pagination);
    } catch (err) {
      console.error('Failed to filter errors:', err);
    }
  };

  // Resolve error
  const handleResolveError = async (id: string) => {
    try {
      const result = await resolveError(id);
      setErrorLogs(prev => prev.map(e => e._id === id ? result.error : e));
      if (errorStats) {
        setErrorStats({ ...errorStats, unresolved: errorStats.unresolved - 1 });
      }
    } catch (err) {
      console.error('Failed to resolve error:', err);
    }
  };

  // Delete error log
  const handleDeleteError = async (id: string) => {
    if (!confirm('Are you sure you want to delete this error log?')) return;
    try {
      await deleteErrorLog(id);
      setErrorLogs(prev => prev.filter(e => e._id !== id));
      setSelectedError(null);
    } catch (err) {
      console.error('Failed to delete error:', err);
    }
  };

  // Delete all resolved errors
  const handleDeleteResolvedErrors = async () => {
    if (!confirm('Are you sure you want to delete all resolved error logs?')) return;
    try {
      const result = await deleteResolvedErrors();
      setErrorLogs(prev => prev.filter(e => !e.resolved));
      alert(`Deleted ${result.deletedCount} resolved error logs`);
    } catch (err) {
      console.error('Failed to delete resolved errors:', err);
    }
  };

  // Create or update announcement
  const handleSaveAnnouncement = async () => {
    if (!announcementForm.title || !announcementForm.message) {
      setFormError('Title and message are required');
      return;
    }

    setIsSaving(true);
    setFormError('');

    try {
      if (editingAnnouncement) {
        const result = await updateAnnouncement(editingAnnouncement.id, announcementForm);
        setAnnouncements(prev => prev.map(a => a.id === editingAnnouncement.id ? result.announcement : a));
      } else {
        const result = await createAnnouncement(announcementForm);
        setAnnouncements(prev => [...prev, result.announcement]);
      }

      setShowAnnouncementForm(false);
      setEditingAnnouncement(null);
      setAnnouncementForm({
        type: 'info',
        title: '',
        message: '',
        dismissible: true,
        active: true,
        priority: 1,
        targetPages: ['dashboard'],
      });
    } catch (err: any) {
      setFormError(err.message || 'Failed to save announcement');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete announcement
  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      await deleteAnnouncement(id);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Failed to delete announcement:', err);
    }
  };

  // Edit announcement
  const handleEditAnnouncement = (announcement: SystemAnnouncement) => {
    setEditingAnnouncement(announcement);
    setAnnouncementForm({
      type: announcement.type,
      title: announcement.title,
      message: announcement.message,
      dismissible: announcement.dismissible,
      active: announcement.active,
      priority: announcement.priority,
      targetPages: announcement.targetPages,
    });
    setShowAnnouncementForm(true);
  };

  // Toggle announcement active status
  const handleToggleActive = async (announcement: SystemAnnouncement) => {
    try {
      const result = await updateAnnouncement(announcement.id, { active: !announcement.active });
      setAnnouncements(prev => prev.map(a => a.id === announcement.id ? result.announcement : a));
    } catch (err) {
      console.error('Failed to toggle announcement:', err);
    }
  };

  // Toggle page enabled/disabled
  const handleTogglePage = async (page: PageSetting) => {
    setTogglingPage(page.path);
    try {
      const result = await togglePageSetting(page.path, !page.enabled);
      setPageSettings(prev => prev.map(p => p.path === page.path ? result.page : p));
    } catch (err) {
      console.error('Failed to toggle page:', err);
    } finally {
      setTogglingPage(null);
    }
  };

  // Group pages by category
  const pagesByCategory = pageSettings.reduce((acc, page) => {
    if (!acc[page.category]) acc[page.category] = [];
    acc[page.category].push(page);
    return acc;
  }, {} as Record<string, PageSetting[]>);

  const categoryLabels: Record<string, string> = {
    health: 'Health & Monitoring',
    tracking: 'Tracking',
    ai: 'AI Features',
    settings: 'Settings',
    other: 'Other',
  };

  const categoryIcons: Record<string, React.ReactNode> = {
    health: <ICONS.Heart className="w-5 h-5" />,
    tracking: <ICONS.Activity className="w-5 h-5" />,
    ai: <ICONS.Sparkles className="w-5 h-5" />,
    settings: <ICONS.Settings className="w-5 h-5" />,
    other: <ICONS.Grid className="w-5 h-5" />,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 relative mx-auto">
            <div className="absolute inset-0 border-4 border-violet-500/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-violet-500 rounded-full animate-spin" />
            <div className="absolute inset-4 bg-gradient-to-br from-violet-500 to-purple-500 rounded-full flex items-center justify-center">
              <ICONS.Shield className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-slate-400 font-medium">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto">
            <ICONS.X className="w-10 h-10 text-rose-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Access Denied</h1>
          <p className="text-slate-500 dark:text-slate-400">You don't have admin privileges.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-24 lg:pb-8 animate-in fade-in duration-700">
      {/* Overview Section */}
      {activeSection === 'overview' && stats && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/50 rounded-2xl p-5 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center">
                  <ICONS.User className="w-5 h-5 text-white" />
                </div>
                <span className="text-slate-400 text-sm font-medium">Total Users</span>
              </div>
              <p className="text-3xl font-black text-white">{stats.users.total}</p>
            </div>

            <div className="bg-slate-900/50 rounded-2xl p-5 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                  <ICONS.Check className="w-5 h-5 text-white" />
                </div>
                <span className="text-slate-400 text-sm font-medium">Active Users</span>
              </div>
              <p className="text-3xl font-black text-white">{stats.users.active}</p>
            </div>

            <div className="bg-slate-900/50 rounded-2xl p-5 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <ICONS.Plus className="w-5 h-5 text-white" />
                </div>
                <span className="text-slate-400 text-sm font-medium">New Today</span>
              </div>
              <p className="text-3xl font-black text-white">{stats.users.newToday}</p>
            </div>

            <div className="bg-slate-900/50 rounded-2xl p-5 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                  <ICONS.Activity className="w-5 h-5 text-white" />
                </div>
                <span className="text-slate-400 text-sm font-medium">New This Week</span>
              </div>
              <p className="text-3xl font-black text-white">{stats.users.newThisWeek}</p>
            </div>
          </div>

          {/* User Growth Chart */}
          {stats.userGrowth.length > 0 && (
            <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-bold text-white mb-4">User Growth (Last 30 Days)</h3>
              <div className="h-48 flex items-end gap-1">
                {stats.userGrowth.map((day, i) => {
                  const maxCount = Math.max(...stats.userGrowth.map(d => d.count));
                  const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-violet-500 to-purple-400 rounded-t-lg transition-all hover:opacity-80"
                      style={{ height: `${Math.max(height, 4)}%` }}
                      title={`${day._id}: ${day.count} users`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-slate-400">
                <span>{stats.userGrowth[0]?._id}</span>
                <span>{stats.userGrowth[stats.userGrowth.length - 1]?._id}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Users Section */}
      {activeSection === 'users' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="flex gap-2">
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
              placeholder="Search by email..."
              className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button
              onClick={handleSearchUsers}
              className="px-6 py-3 bg-violet-500 text-white rounded-xl font-bold hover:bg-violet-600 transition-colors"
            >
              Search
            </button>
          </div>

          {/* Users List */}
          <div className="bg-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="p-4 border-b border-slate-700">
              <p className="text-sm text-slate-400">
                Showing {users.length} of {usersPagination.total} users
              </p>
            </div>
            <div className="divide-y divide-slate-700 max-h-[600px] overflow-y-auto">
              {users.map(user => (
                <div key={user._id} className="p-4 flex items-center justify-between hover:bg-slate-800/50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-white">{user.email}</p>
                      <p className="text-xs text-slate-400">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                      user.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-slate-700 text-slate-500'
                    }`}>
                      {user.status}
                    </span>
                    {user.isAdmin && (
                      <span className="px-2 py-1 rounded-lg text-xs font-bold bg-violet-500/10 text-violet-400">
                        Admin
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error Logs Section */}
      {activeSection === 'logs' && (
        <div className="space-y-4">
          {/* Stats Cards */}
          {errorStats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-rose-500/10 rounded-xl p-4 border border-rose-500/20">
                <p className="text-rose-600 dark:text-rose-400 text-2xl font-black">{errorStats.critical}</p>
                <p className="text-rose-600/70 text-sm font-medium">Critical</p>
              </div>
              <div className="bg-orange-500/10 rounded-xl p-4 border border-orange-500/20">
                <p className="text-orange-600 dark:text-orange-400 text-2xl font-black">{errorStats.error}</p>
                <p className="text-orange-600/70 text-sm font-medium">Errors</p>
              </div>
              <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
                <p className="text-amber-600 dark:text-amber-400 text-2xl font-black">{errorStats.warn}</p>
                <p className="text-amber-600/70 text-sm font-medium">Warnings</p>
              </div>
              <div className="bg-violet-500/10 rounded-xl p-4 border border-violet-500/20">
                <p className="text-violet-600 dark:text-violet-400 text-2xl font-black">{errorStats.unresolved}</p>
                <p className="text-violet-600/70 text-sm font-medium">Unresolved</p>
              </div>
            </div>
          )}

          {/* Filter and Actions */}
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2 overflow-x-auto">
              {(['all', 'critical', 'error', 'warn', 'unresolved'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => handleFilterErrors(filter)}
                  className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                    errorFilter === filter
                      ? 'bg-violet-500 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
            <button
              onClick={handleDeleteResolvedErrors}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-700 transition-colors"
            >
              Clear Resolved
            </button>
          </div>

          {/* Error Logs List */}
          <div className="bg-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="p-4 border-b border-slate-700">
              <p className="text-sm text-slate-400">
                Showing {errorLogs.length} of {errorsPagination.total} error logs
              </p>
            </div>
            <div className="divide-y divide-slate-700 max-h-[500px] overflow-y-auto">
              {errorLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400">No error logs found</div>
              ) : (
                errorLogs.map(error => {
                  const levelColors: Record<string, string> = {
                    critical: 'bg-rose-500/10 text-rose-400',
                    error: 'bg-orange-500/10 text-orange-400',
                    warn: 'bg-amber-500/10 text-amber-400',
                  };
                  return (
                    <div
                      key={error._id}
                      className={`p-4 hover:bg-slate-800/50 cursor-pointer ${error.resolved ? 'opacity-50' : ''}`}
                      onClick={() => setSelectedError(error)}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          error.level === 'critical' ? 'bg-rose-500/10' :
                          error.level === 'error' ? 'bg-orange-500/10' : 'bg-amber-500/10'
                        }`}>
                          <ICONS.AlertCircle className={`w-5 h-5 ${
                            error.level === 'critical' ? 'text-rose-500' :
                            error.level === 'error' ? 'text-orange-500' : 'text-amber-500'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${levelColors[error.level]}`}>
                              {error.level.toUpperCase()}
                            </span>
                            {error.code && (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-400">
                                {error.code}
                              </span>
                            )}
                            {error.resolved && (
                              <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/10 text-emerald-400">
                                Resolved
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-white font-medium truncate">{error.message}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                            {error.endpoint && <span>{error.method} {error.endpoint}</span>}
                            {error.userEmail && <span>- {error.userEmail}</span>}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(error.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {!error.resolved && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleResolveError(error._id); }}
                              className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-colors"
                              title="Mark as resolved"
                            >
                              <ICONS.Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteError(error._id); }}
                            className="p-2 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500/20 transition-colors"
                            title="Delete"
                          >
                            <ICONS.Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Error Detail Modal */}
          {selectedError && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelectedError(null)}>
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">Error Details</h3>
                  <button onClick={() => setSelectedError(null)} className="p-2 hover:bg-slate-700 rounded-lg">
                    <ICONS.X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                      selectedError.level === 'critical' ? 'bg-rose-500/10 text-rose-400' :
                      selectedError.level === 'error' ? 'bg-orange-500/10 text-orange-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {selectedError.level.toUpperCase()}
                    </span>
                    {selectedError.code && (
                      <span className="px-3 py-1 rounded-lg text-sm font-medium bg-slate-700 text-slate-400">
                        {selectedError.code}
                      </span>
                    )}
                    {selectedError.resolved && (
                      <span className="px-3 py-1 rounded-lg text-sm font-bold bg-emerald-500/10 text-emerald-400">
                        Resolved
                      </span>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 mb-1">Message</p>
                    <p className="text-white font-medium">{selectedError.message}</p>
                  </div>

                  {selectedError.endpoint && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Endpoint</p>
                      <p className="text-white font-mono text-sm">{selectedError.method} {selectedError.endpoint}</p>
                    </div>
                  )}

                  {selectedError.stack && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Stack Trace</p>
                      <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
                        {selectedError.stack}
                      </pre>
                    </div>
                  )}

                  {selectedError.requestBody && Object.keys(selectedError.requestBody).length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Request Body</p>
                      <pre className="bg-slate-900 text-slate-300 p-4 rounded-lg text-xs overflow-x-auto">
                        {JSON.stringify(selectedError.requestBody, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedError.userEmail && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">User</p>
                        <p className="text-white">{selectedError.userEmail}</p>
                      </div>
                    )}
                    {selectedError.ip && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">IP Address</p>
                        <p className="text-white font-mono">{selectedError.ip}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Created</p>
                      <p className="text-white">{new Date(selectedError.createdAt).toLocaleString()}</p>
                    </div>
                    {selectedError.resolvedAt && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Resolved</p>
                        <p className="text-white">{new Date(selectedError.resolvedAt).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  {!selectedError.resolved && (
                    <button
                      onClick={() => { handleResolveError(selectedError._id); setSelectedError(null); }}
                      className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors"
                    >
                      Mark as Resolved
                    </button>
                  )}
                  <button
                    onClick={() => { handleDeleteError(selectedError._id); }}
                    className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-colors"
                  >
                    Delete Error
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Announcements Section */}
      {activeSection === 'announcements' && (
        <div className="space-y-4">
          {/* Create Button */}
          <button
            onClick={() => {
              setEditingAnnouncement(null);
              setAnnouncementForm({
                type: 'info',
                title: '',
                message: '',
                dismissible: true,
                active: true,
                priority: 1,
                targetPages: ['dashboard'],
              });
              setShowAnnouncementForm(true);
            }}
            className="px-6 py-3 bg-violet-500 text-white rounded-xl font-bold hover:bg-violet-600 transition-colors flex items-center gap-2"
          >
            <ICONS.Plus className="w-5 h-5" />
            Create Announcement
          </button>

          {/* Announcement Form Modal */}
          {showAnnouncementForm && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold text-white mb-4">
                  {editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
                </h3>

                {formError && (
                  <div className="mb-4 p-3 bg-rose-500/10 text-rose-400 rounded-xl text-sm">
                    {formError}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
                    <select
                      value={announcementForm.type}
                      onChange={(e) => setAnnouncementForm(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="success">Success</option>
                      <option value="error">Error</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                    <input
                      type="text"
                      value={announcementForm.title}
                      onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="Announcement title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Message</label>
                    <textarea
                      value={announcementForm.message}
                      onChange={(e) => setAnnouncementForm(prev => ({ ...prev, message: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                      placeholder="Announcement message"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Target Pages</label>
                    <div className="flex flex-wrap gap-2">
                      {['dashboard', 'pricing', 'subscription', 'settings', 'all'].map(page => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => {
                            setAnnouncementForm(prev => ({
                              ...prev,
                              targetPages: prev.targetPages.includes(page)
                                ? prev.targetPages.filter(p => p !== page)
                                : [...prev.targetPages, page]
                            }));
                          }}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            announcementForm.targetPages.includes(page)
                              ? 'bg-violet-500 text-white'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={announcementForm.dismissible}
                        onChange={(e) => setAnnouncementForm(prev => ({ ...prev, dismissible: e.target.checked }))}
                        className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-violet-500 focus:ring-violet-500"
                      />
                      <span className="text-sm text-slate-300">Dismissible</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={announcementForm.active}
                        onChange={(e) => setAnnouncementForm(prev => ({ ...prev, active: e.target.checked }))}
                        className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-violet-500 focus:ring-violet-500"
                      />
                      <span className="text-sm text-slate-300">Active</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Priority (1-100)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={announcementForm.priority}
                      onChange={(e) => setAnnouncementForm(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowAnnouncementForm(false);
                      setEditingAnnouncement(null);
                      setFormError('');
                    }}
                    className="flex-1 py-3 bg-slate-700 text-slate-300 rounded-xl font-bold hover:bg-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveAnnouncement}
                    disabled={isSaving}
                    className="flex-1 py-3 bg-violet-500 text-white rounded-xl font-bold hover:bg-violet-600 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : editingAnnouncement ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Announcements List */}
          <div className="bg-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="divide-y divide-slate-700">
              {announcements.length === 0 ? (
                <div className="p-8 text-center text-slate-400">No announcements yet</div>
              ) : (
                announcements.map(announcement => {
                  const typeColors: Record<string, string> = {
                    info: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
                    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                    error: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                  };
                  return (
                    <div key={announcement.id} className={`p-4 hover:bg-slate-800/50 ${!announcement.active ? 'opacity-50' : ''}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold border ${typeColors[announcement.type]}`}>
                              {announcement.type}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              announcement.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-500'
                            }`}>
                              {announcement.active ? 'Active' : 'Inactive'}
                            </span>
                            <span className="text-xs text-slate-500">Priority: {announcement.priority}</span>
                          </div>
                          <p className="font-medium text-white">{announcement.title}</p>
                          <p className="text-sm text-slate-400 mt-1">{announcement.message}</p>
                          <p className="text-xs text-slate-500 mt-2">
                            Pages: {announcement.targetPages.join(', ')} - Updated {new Date(announcement.updatedAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleActive(announcement)}
                            className={`p-2 rounded-lg transition-colors ${
                              announcement.active
                                ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                : 'bg-slate-700 text-slate-500 hover:bg-slate-600'
                            }`}
                            title={announcement.active ? 'Deactivate' : 'Activate'}
                          >
                            {announcement.active ? <ICONS.Check className="w-4 h-4" /> : <ICONS.X className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleEditAnnouncement(announcement)}
                            className="p-2 bg-violet-500/10 text-violet-400 rounded-lg hover:bg-violet-500/20 transition-colors"
                            title="Edit"
                          >
                            <ICONS.Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAnnouncement(announcement.id)}
                            className="p-2 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500/20 transition-colors"
                            title="Delete"
                          >
                            <ICONS.Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Page Settings Section */}
      {activeSection === 'pages' && (
        <div className="space-y-6">
          {/* Info Banner */}
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-4 flex items-start gap-3">
            <ICONS.Info className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-violet-300 text-sm font-medium">Page Visibility Control</p>
              <p className="text-violet-400/70 text-xs mt-1">
                Enable or disable pages for all users. Disabled pages will show a "Page Unavailable" message.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
              <p className="text-emerald-400 text-2xl font-black">{pageSettings.filter(p => p.enabled).length}</p>
              <p className="text-slate-400 text-sm">Enabled Pages</p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
              <p className="text-rose-400 text-2xl font-black">{pageSettings.filter(p => !p.enabled).length}</p>
              <p className="text-slate-400 text-sm">Disabled Pages</p>
            </div>
          </div>

          {/* Pages by Category */}
          {['health', 'tracking', 'ai', 'settings', 'other'].map(category => {
            const pages = pagesByCategory[category] || [];
            if (pages.length === 0) return null;

            return (
              <div key={category} className="bg-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400">
                    {categoryIcons[category]}
                  </div>
                  <h3 className="text-white font-semibold">{categoryLabels[category]}</h3>
                  <span className="ml-auto text-xs text-slate-500">
                    {pages.filter(p => p.enabled).length}/{pages.length} enabled
                  </span>
                </div>
                <div className="divide-y divide-slate-700">
                  {pages.map(page => (
                    <div
                      key={page.path}
                      className={`px-4 py-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors ${
                        !page.enabled ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${page.enabled ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                        <div>
                          <p className="text-white font-medium text-sm">{page.name}</p>
                          <p className="text-slate-500 text-xs font-mono">{page.path}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleTogglePage(page)}
                        disabled={togglingPage === page.path}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          page.enabled ? 'bg-emerald-500' : 'bg-slate-600'
                        } ${togglingPage === page.path ? 'opacity-50' : ''}`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                            page.enabled ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Admin;
