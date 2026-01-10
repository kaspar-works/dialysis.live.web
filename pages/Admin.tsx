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
  updateUserSubscription,
  getAllAlerts,
  getActivityLogs,
  SystemStats,
  AdminUser,
  SystemAnnouncement,
  ErrorLogEntry,
  ErrorLogStats,
  PageSetting,
  PlanType,
  SystemAlert,
  ActivityLog,
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
    if (location.pathname === '/admin/activity') return 'activity';
    if (location.pathname === '/admin/alerts') return 'alerts';
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

  // Activity logs states
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [activityPagination, setActivityPagination] = useState({ total: 0, limit: 50, offset: 0 });

  // System alerts states
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [alertsPagination, setAlertsPagination] = useState({ total: 0, limit: 50, offset: 0 });
  const [alertFilter, setAlertFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  // User details states
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [selectedUserDetails, setSelectedUserDetails] = useState<AdminUser | null>(null);

  // Refresh states
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form states
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<SystemAnnouncement | null>(null);
  const [announcementForm, setAnnouncementForm] = useState({
    type: 'info' as 'info' | 'warning' | 'success' | 'error',
    title: '',
    message: '',
    dismissible: true,
    isActive: true,
    priority: 0,
    linkUrl: '',
    linkText: '',
  });
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Search states
  const [userSearch, setUserSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | 'paid' | 'free' | 'basic' | 'premium'>('all');

  // Subscription management states
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [updatingSubscription, setUpdatingSubscription] = useState(false);

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
        const [statsData, usersData, errorsData, announcementsData, pageSettingsData, activityData, alertsData] = await Promise.all([
          getSystemStats(),
          getUsers({ limit: 50 }),
          getErrorLogs({ limit: 100 }),
          getAnnouncements(),
          getPageSettings(),
          getActivityLogs({ limit: 50 }),
          getAllAlerts({ limit: 50 }),
        ]);

        setStats(statsData);
        setUsers(usersData.users);
        setUsersPagination(usersData.pagination);
        setErrorLogs(errorsData.errors);
        setErrorStats(errorsData.stats);
        setErrorsPagination(errorsData.pagination);
        setAnnouncements(announcementsData.announcements);
        setPageSettings(pageSettingsData.pages);
        setActivityLogs(activityData.logs);
        setActivityPagination(activityData.pagination);
        setSystemAlerts(alertsData.alerts);
        setAlertsPagination(alertsData.pagination);
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

  // Update user subscription
  const handleUpdateSubscription = async (plan: PlanType) => {
    if (!selectedUser) return;
    setUpdatingSubscription(true);
    try {
      await updateUserSubscription(selectedUser._id, plan);
      // Update local state
      setUsers(prev => prev.map(u =>
        u._id === selectedUser._id
          ? { ...u, subscription: { plan, status: 'active' } }
          : u
      ));
      setShowSubscriptionModal(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Failed to update subscription:', err);
      alert('Failed to update subscription');
    } finally {
      setUpdatingSubscription(false);
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
        const result = await updateAnnouncement(editingAnnouncement._id, announcementForm);
        setAnnouncements(prev => prev.map(a => a._id === editingAnnouncement._id ? result.announcement : a));
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
        isActive: true,
        priority: 0,
        linkUrl: '',
        linkText: '',
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
      setAnnouncements(prev => prev.filter(a => a._id !== id));
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
      isActive: announcement.isActive,
      priority: announcement.priority,
      linkUrl: announcement.linkUrl || '',
      linkText: announcement.linkText || '',
    });
    setShowAnnouncementForm(true);
  };

  // Toggle announcement active status
  const handleToggleActive = async (announcement: SystemAnnouncement) => {
    try {
      const result = await updateAnnouncement(announcement._id, { isActive: !announcement.isActive });
      setAnnouncements(prev => prev.map(a => a._id === announcement._id ? result.announcement : a));
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

  // Refresh all data
  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      const [statsData, usersData, errorsData, announcementsData, pageSettingsData, activityData, alertsData] = await Promise.all([
        getSystemStats(),
        getUsers({ limit: 50, search: userSearch || undefined }),
        getErrorLogs({ limit: 100 }),
        getAnnouncements(),
        getPageSettings(),
        getActivityLogs({ limit: 50 }),
        getAllAlerts({ limit: 50 }),
      ]);

      setStats(statsData);
      setUsers(usersData.users);
      setUsersPagination(usersData.pagination);
      setErrorLogs(errorsData.errors);
      setErrorStats(errorsData.stats);
      setErrorsPagination(errorsData.pagination);
      setAnnouncements(announcementsData.announcements);
      setPageSettings(pageSettingsData.pages);
      setActivityLogs(activityData.logs);
      setActivityPagination(activityData.pagination);
      setSystemAlerts(alertsData.alerts);
      setAlertsPagination(alertsData.pagination);
    } catch (err) {
      console.error('Failed to refresh data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter alerts
  const handleFilterAlerts = async (filter: typeof alertFilter) => {
    setAlertFilter(filter);
    try {
      const params: { severity?: string; limit: number } = { limit: 50 };
      if (filter !== 'all') params.severity = filter;
      const data = await getAllAlerts(params);
      setSystemAlerts(data.alerts);
      setAlertsPagination(data.pagination);
    } catch (err) {
      console.error('Failed to filter alerts:', err);
    }
  };

  // Load more activity logs
  const handleLoadMoreActivity = async () => {
    try {
      const data = await getActivityLogs({
        limit: 50,
        offset: activityPagination.offset + 50
      });
      setActivityLogs(prev => [...prev, ...data.logs]);
      setActivityPagination(data.pagination);
    } catch (err) {
      console.error('Failed to load more activity:', err);
    }
  };

  // Export users to CSV
  const handleExportUsers = () => {
    const headers = ['Email', 'Status', 'Plan', 'Admin', 'Onboarding', 'Created'];
    const csvContent = [
      headers.join(','),
      ...users.map(user => [
        user.email,
        user.status,
        user.subscription?.plan || 'free',
        user.isAdmin ? 'Yes' : 'No',
        user.onboardingCompleted ? 'Yes' : 'No',
        new Date(user.createdAt).toLocaleDateString(),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Export error logs to CSV
  const handleExportErrors = () => {
    const headers = ['Level', 'Message', 'Endpoint', 'User', 'Resolved', 'Created'];
    const csvContent = [
      headers.join(','),
      ...errorLogs.map(error => [
        error.level,
        `"${error.message.replace(/"/g, '""')}"`,
        error.endpoint || '',
        error.userEmail || '',
        error.resolved ? 'Yes' : 'No',
        new Date(error.createdAt).toLocaleDateString(),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `errors_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Export activity logs to CSV
  const handleExportActivity = () => {
    const headers = ['Action', 'User', 'Details', 'Date'];
    const csvContent = [
      headers.join(','),
      ...activityLogs.map(log => [
        log.action,
        log.userId?.email || 'System',
        `"${(log.details || '').replace(/"/g, '""')}"`,
        new Date(log.createdAt).toLocaleDateString(),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `activity_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Calculate subscription statistics
  const subscriptionStats = {
    premium: users.filter(u => u.subscription?.plan === 'premium').length,
    basic: users.filter(u => u.subscription?.plan === 'basic').length,
    free: users.filter(u => !u.subscription?.plan || u.subscription?.plan === 'free').length,
  };
  const paidUsers = subscriptionStats.premium + subscriptionStats.basic;

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
          {/* Header with Refresh */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Dashboard Overview</h2>
            <button
              onClick={handleRefreshData}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              <ICONS.RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

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

          {/* Subscription Stats */}
          <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-bold text-white mb-4">Subscription Distribution</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-3xl font-black text-emerald-400">{subscriptionStats.premium}</p>
                <p className="text-sm text-slate-400">Premium</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-sky-400">{subscriptionStats.basic}</p>
                <p className="text-sm text-slate-400">Basic</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-slate-400">{subscriptionStats.free}</p>
                <p className="text-sm text-slate-400">Free</p>
              </div>
            </div>
            {/* Progress bar visualization */}
            <div className="h-4 bg-slate-700 rounded-full overflow-hidden flex">
              {subscriptionStats.premium > 0 && (
                <div
                  className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full"
                  style={{ width: `${(subscriptionStats.premium / users.length) * 100}%` }}
                />
              )}
              {subscriptionStats.basic > 0 && (
                <div
                  className="bg-gradient-to-r from-sky-500 to-sky-400 h-full"
                  style={{ width: `${(subscriptionStats.basic / users.length) * 100}%` }}
                />
              )}
              {subscriptionStats.free > 0 && (
                <div
                  className="bg-slate-600 h-full"
                  style={{ width: `${(subscriptionStats.free / users.length) * 100}%` }}
                />
              )}
            </div>
            <div className="flex justify-between mt-2 text-xs">
              <span className="text-emerald-400">{users.length > 0 ? ((subscriptionStats.premium / users.length) * 100).toFixed(1) : 0}% Premium</span>
              <span className="text-sky-400">{users.length > 0 ? ((subscriptionStats.basic / users.length) * 100).toFixed(1) : 0}% Basic</span>
              <span className="text-slate-400">{users.length > 0 ? ((subscriptionStats.free / users.length) * 100).toFixed(1) : 0}% Free</span>
            </div>
          </div>

          {/* System Health */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/50 rounded-2xl p-5 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                  <ICONS.Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-slate-400 text-sm font-medium">Paid Users</span>
              </div>
              <p className="text-3xl font-black text-emerald-400">{paidUsers}</p>
            </div>

            <div className="bg-slate-900/50 rounded-2xl p-5 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
                  <ICONS.AlertCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-slate-400 text-sm font-medium">Unresolved Errors</span>
              </div>
              <p className="text-3xl font-black text-rose-400">{errorStats?.unresolved || 0}</p>
            </div>

            <div className="bg-slate-900/50 rounded-2xl p-5 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <ICONS.Bell className="w-5 h-5 text-white" />
                </div>
                <span className="text-slate-400 text-sm font-medium">Active Alerts</span>
              </div>
              <p className="text-3xl font-black text-amber-400">{stats.alerts.active}</p>
            </div>

            <div className="bg-slate-900/50 rounded-2xl p-5 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                  <ICONS.MessageSquare className="w-5 h-5 text-white" />
                </div>
                <span className="text-slate-400 text-sm font-medium">Announcements</span>
              </div>
              <p className="text-3xl font-black text-violet-400">{announcements.filter(a => a.isActive).length}</p>
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
          {/* Header with Export */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-xl font-bold text-white">User Management</h2>
            <div className="flex gap-2">
              <button
                onClick={handleRefreshData}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                <ICONS.RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleExportUsers}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl font-medium hover:bg-emerald-500/20 transition-colors"
              >
                <ICONS.Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

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

          {/* Plan Filter */}
          <div className="flex gap-2 flex-wrap">
            {([
              { id: 'all', label: 'All Users', color: 'slate' },
              { id: 'paid', label: 'Paid Users', color: 'emerald' },
              { id: 'premium', label: 'Premium', color: 'emerald' },
              { id: 'basic', label: 'Basic', color: 'sky' },
              { id: 'free', label: 'Free', color: 'slate' },
            ] as const).map(filter => (
              <button
                key={filter.id}
                onClick={() => setPlanFilter(filter.id)}
                className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                  planFilter === filter.id
                    ? filter.color === 'emerald'
                      ? 'bg-emerald-500 text-white'
                      : filter.color === 'sky'
                      ? 'bg-sky-500 text-white'
                      : 'bg-violet-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Users List */}
          <div className="bg-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="p-4 border-b border-slate-700">
              {(() => {
                const filteredUsers = users.filter(user => {
                  const plan = user.subscription?.plan || 'free';
                  if (planFilter === 'all') return true;
                  if (planFilter === 'paid') return plan === 'basic' || plan === 'premium';
                  return plan === planFilter;
                });
                const paidCount = users.filter(u => u.subscription?.plan === 'basic' || u.subscription?.plan === 'premium').length;
                return (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-400">
                      Showing {filteredUsers.length} of {usersPagination.total} users
                      {planFilter !== 'all' && ` (filtered by ${planFilter})`}
                    </p>
                    <p className="text-sm">
                      <span className="text-emerald-400 font-bold">{paidCount}</span>
                      <span className="text-slate-500"> paid users</span>
                    </p>
                  </div>
                );
              })()}
            </div>
            <div className="divide-y divide-slate-700 max-h-[600px] overflow-y-auto">
              {users.filter(user => {
                const plan = user.subscription?.plan || 'free';
                if (planFilter === 'all') return true;
                if (planFilter === 'paid') return plan === 'basic' || plan === 'premium';
                return plan === planFilter;
              }).map(user => (
                <div
                  key={user._id}
                  className="p-4 flex items-center justify-between hover:bg-slate-800/50 cursor-pointer"
                  onClick={() => {
                    setSelectedUserDetails(user);
                    setShowUserDetails(true);
                  }}
                >
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
                    {/* Subscription Badge */}
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                      user.subscription?.plan === 'premium'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : user.subscription?.plan === 'basic'
                        ? 'bg-sky-500/10 text-sky-400'
                        : 'bg-slate-700 text-slate-400'
                    }`}>
                      {user.subscription?.plan?.toUpperCase() || 'FREE'}
                    </span>
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
                    {/* Edit Subscription Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUser(user);
                        setShowSubscriptionModal(true);
                      }}
                      className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                      title="Edit Subscription"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
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
          {/* Header with Export */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-xl font-bold text-white">Error Logs</h2>
            <div className="flex gap-2">
              <button
                onClick={handleRefreshData}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                <ICONS.RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleExportErrors}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl font-medium hover:bg-emerald-500/20 transition-colors"
              >
                <ICONS.Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

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
                isActive: true,
                priority: 0,
                linkUrl: '',
                linkText: '',
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
                        checked={announcementForm.isActive}
                        onChange={(e) => setAnnouncementForm(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-violet-500 focus:ring-violet-500"
                      />
                      <span className="text-sm text-slate-300">Active</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Priority (0-100, higher = first)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={announcementForm.priority}
                      onChange={(e) => setAnnouncementForm(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Link URL (optional)</label>
                    <input
                      type="url"
                      value={announcementForm.linkUrl}
                      onChange={(e) => setAnnouncementForm(prev => ({ ...prev, linkUrl: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="https://example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Link Text (optional)</label>
                    <input
                      type="text"
                      value={announcementForm.linkText}
                      onChange={(e) => setAnnouncementForm(prev => ({ ...prev, linkText: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="Learn more"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowAnnouncementForm(false);
                      setEditingAnnouncement(null);
                      setFormError('');
                      setAnnouncementForm({
                        type: 'info',
                        title: '',
                        message: '',
                        dismissible: true,
                        isActive: true,
                        priority: 0,
                        linkUrl: '',
                        linkText: '',
                      });
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
                    <div key={announcement._id} className={`p-4 hover:bg-slate-800/50 ${!announcement.isActive ? 'opacity-50' : ''}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold border ${typeColors[announcement.type]}`}>
                              {announcement.type}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              announcement.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-500'
                            }`}>
                              {announcement.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <span className="text-xs text-slate-500">Priority: {announcement.priority}</span>
                          </div>
                          <p className="font-medium text-white">{announcement.title}</p>
                          <p className="text-sm text-slate-400 mt-1">{announcement.message}</p>
                          {announcement.linkUrl && (
                            <p className="text-xs text-violet-400 mt-1">
                              Link: {announcement.linkText || announcement.linkUrl}
                            </p>
                          )}
                          <p className="text-xs text-slate-500 mt-2">
                            Updated {new Date(announcement.updatedAt).toLocaleString()}
                            {announcement.createdBy?.email && ` by ${announcement.createdBy.email}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleActive(announcement)}
                            className={`p-2 rounded-lg transition-colors ${
                              announcement.isActive
                                ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                : 'bg-slate-700 text-slate-500 hover:bg-slate-600'
                            }`}
                            title={announcement.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {announcement.isActive ? <ICONS.Check className="w-4 h-4" /> : <ICONS.X className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleEditAnnouncement(announcement)}
                            className="p-2 bg-violet-500/10 text-violet-400 rounded-lg hover:bg-violet-500/20 transition-colors"
                            title="Edit"
                          >
                            <ICONS.Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAnnouncement(announcement._id)}
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

      {/* Activity Logs Section */}
      {activeSection === 'activity' && (
        <div className="space-y-4">
          {/* Header with Export */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-xl font-bold text-white">Activity Logs</h2>
            <div className="flex gap-2">
              <button
                onClick={handleRefreshData}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                <ICONS.RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleExportActivity}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl font-medium hover:bg-emerald-500/20 transition-colors"
              >
                <ICONS.Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Activity Logs List */}
          <div className="bg-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="p-4 border-b border-slate-700">
              <p className="text-sm text-slate-400">
                Showing {activityLogs.length} of {activityPagination.total} activity logs
              </p>
            </div>
            <div className="divide-y divide-slate-700 max-h-[600px] overflow-y-auto">
              {activityLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400">No activity logs found</div>
              ) : (
                activityLogs.map(log => {
                  const actionColors: Record<string, string> = {
                    login: 'bg-emerald-500/10 text-emerald-400',
                    logout: 'bg-slate-700 text-slate-400',
                    register: 'bg-sky-500/10 text-sky-400',
                    update: 'bg-amber-500/10 text-amber-400',
                    delete: 'bg-rose-500/10 text-rose-400',
                    create: 'bg-violet-500/10 text-violet-400',
                  };
                  const actionType = log.action.toLowerCase().split('_')[0];
                  const colorClass = actionColors[actionType] || 'bg-slate-700 text-slate-400';

                  return (
                    <div key={log._id} className="p-4 hover:bg-slate-800/50">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                          <ICONS.Activity className="w-5 h-5 text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${colorClass}`}>
                              {log.action}
                            </span>
                          </div>
                          <p className="text-sm text-white">{log.details || 'No details'}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                            <span>{log.userId?.email || 'System'}</span>
                            <span>•</span>
                            <span>{new Date(log.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {activityLogs.length < activityPagination.total && (
              <div className="p-4 border-t border-slate-700">
                <button
                  onClick={handleLoadMoreActivity}
                  className="w-full py-2 bg-slate-800 text-slate-300 rounded-xl font-medium hover:bg-slate-700 transition-colors"
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* System Alerts Section */}
      {activeSection === 'alerts' && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-xl font-bold text-white">System Alerts</h2>
            <button
              onClick={handleRefreshData}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              <ICONS.RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Filter */}
          <div className="flex gap-2 overflow-x-auto">
            {(['all', 'critical', 'warning', 'info'] as const).map(filter => (
              <button
                key={filter}
                onClick={() => handleFilterAlerts(filter)}
                className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                  alertFilter === filter
                    ? filter === 'critical'
                      ? 'bg-rose-500 text-white'
                      : filter === 'warning'
                      ? 'bg-amber-500 text-white'
                      : 'bg-violet-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          {/* Alerts List */}
          <div className="bg-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="p-4 border-b border-slate-700">
              <p className="text-sm text-slate-400">
                Showing {systemAlerts.length} of {alertsPagination.total} alerts
              </p>
            </div>
            <div className="divide-y divide-slate-700 max-h-[600px] overflow-y-auto">
              {systemAlerts.length === 0 ? (
                <div className="p-8 text-center text-slate-400">No system alerts found</div>
              ) : (
                systemAlerts.map(alert => {
                  const severityColors: Record<string, string> = {
                    critical: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                    info: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
                  };
                  const colorClass = severityColors[alert.severity] || severityColors.info;

                  return (
                    <div key={alert._id} className="p-4 hover:bg-slate-800/50">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          alert.severity === 'critical' ? 'bg-rose-500/10' :
                          alert.severity === 'warning' ? 'bg-amber-500/10' : 'bg-sky-500/10'
                        }`}>
                          <ICONS.Bell className={`w-5 h-5 ${
                            alert.severity === 'critical' ? 'text-rose-500' :
                            alert.severity === 'warning' ? 'text-amber-500' : 'text-sky-500'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold border ${colorClass}`}>
                              {alert.severity.toUpperCase()}
                            </span>
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-400">
                              {alert.category}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              alert.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-500'
                            }`}>
                              {alert.status}
                            </span>
                          </div>
                          <p className="font-medium text-white">{alert.title}</p>
                          <p className="text-sm text-slate-400 mt-1">{alert.message}</p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                            {alert.userId?.email && <span>{alert.userId.email}</span>}
                            <span>{new Date(alert.createdAt).toLocaleString()}</span>
                          </div>
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

      {/* User Details Modal */}
      {showUserDetails && selectedUserDetails && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowUserDetails(false)}>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">User Details</h3>
              <button onClick={() => setShowUserDetails(false)} className="p-2 hover:bg-slate-700 rounded-lg">
                <ICONS.X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* User Avatar & Email */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                {selectedUserDetails.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-bold text-white">{selectedUserDetails.email}</p>
                <p className="text-sm text-slate-400">User ID: {selectedUserDetails._id}</p>
              </div>
            </div>

            {/* User Info Grid */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700/50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">Status</p>
                  <span className={`px-2 py-1 rounded-lg text-sm font-bold ${
                    selectedUserDetails.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-slate-600 text-slate-400'
                  }`}>
                    {selectedUserDetails.status}
                  </span>
                </div>
                <div className="bg-slate-700/50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">Subscription</p>
                  <span className={`px-2 py-1 rounded-lg text-sm font-bold ${
                    selectedUserDetails.subscription?.plan === 'premium'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : selectedUserDetails.subscription?.plan === 'basic'
                      ? 'bg-sky-500/10 text-sky-400'
                      : 'bg-slate-600 text-slate-400'
                  }`}>
                    {selectedUserDetails.subscription?.plan?.toUpperCase() || 'FREE'}
                  </span>
                </div>
                <div className="bg-slate-700/50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">Admin</p>
                  <span className={`px-2 py-1 rounded-lg text-sm font-bold ${
                    selectedUserDetails.isAdmin
                      ? 'bg-violet-500/10 text-violet-400'
                      : 'bg-slate-600 text-slate-400'
                  }`}>
                    {selectedUserDetails.isAdmin ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="bg-slate-700/50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">Onboarding</p>
                  <span className={`px-2 py-1 rounded-lg text-sm font-bold ${
                    selectedUserDetails.onboardingCompleted
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {selectedUserDetails.onboardingCompleted ? 'Completed' : 'Pending'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-700/50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-1">Joined</p>
                <p className="text-white font-medium">
                  {new Date(selectedUserDetails.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowUserDetails(false);
                  setSelectedUser(selectedUserDetails);
                  setShowSubscriptionModal(true);
                }}
                className="flex-1 py-3 bg-violet-500 text-white rounded-xl font-bold hover:bg-violet-600 transition-colors"
              >
                Change Subscription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Management Modal */}
      {showSubscriptionModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-2">Manage Subscription</h3>
            <p className="text-slate-400 text-sm mb-6">{selectedUser.email}</p>

            <div className="space-y-3">
              {(['free', 'basic', 'premium'] as PlanType[]).map(plan => (
                <button
                  key={plan}
                  onClick={() => handleUpdateSubscription(plan)}
                  disabled={updatingSubscription}
                  className={`w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all ${
                    selectedUser.subscription?.plan === plan
                      ? plan === 'premium'
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : plan === 'basic'
                        ? 'border-sky-500 bg-sky-500/10'
                        : 'border-slate-500 bg-slate-500/10'
                      : 'border-slate-600 hover:border-slate-500 bg-slate-700/50'
                  } ${updatingSubscription ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                      plan === 'premium'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : plan === 'basic'
                        ? 'bg-sky-500/20 text-sky-400'
                        : 'bg-slate-600 text-slate-400'
                    }`}>
                      {plan === 'premium' ? '👑' : plan === 'basic' ? '⭐' : '🆓'}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-white">{plan.charAt(0).toUpperCase() + plan.slice(1)}</p>
                      <p className="text-xs text-slate-400">
                        {plan === 'premium' ? 'Full access + AI features'
                          : plan === 'basic' ? 'Unlimited tracking'
                          : 'Limited tracking'}
                      </p>
                    </div>
                  </div>
                  {selectedUser.subscription?.plan === plan && (
                    <span className="px-2 py-1 rounded text-xs font-bold bg-violet-500/20 text-violet-400">
                      Current
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowSubscriptionModal(false);
                  setSelectedUser(null);
                }}
                disabled={updatingSubscription}
                className="flex-1 px-4 py-3 bg-slate-700 text-slate-300 rounded-xl font-bold hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
