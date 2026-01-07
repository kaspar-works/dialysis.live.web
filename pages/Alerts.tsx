import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { ICONS } from '../constants';
import {
  getAlerts,
  markAsRead,
  markAllAsRead,
  dismissAlert,
  dismissAllAlerts,
  Alert,
  AlertSeverity,
  AlertStatus,
  AlertCategory,
  getSeverityColor,
  getSeverityIcon,
  getCategoryIcon,
} from '../services/alerts';

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'read' | 'all'>('active');
  const [selectedCategory, setSelectedCategory] = useState<AlertCategory | 'all'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
      const response = await getAlerts({ limit: 100 });
      setAlerts(response.alerts);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (alertId: string) => {
    setProcessingId(alertId);
    try {
      await markAsRead(alertId);
      setAlerts(prev => prev.map(a =>
        a._id === alertId ? { ...a, status: 'acknowledged' as AlertStatus, acknowledgedAt: new Date().toISOString() } : a
      ));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDismiss = async (alertId: string) => {
    setProcessingId(alertId);
    try {
      await dismissAlert(alertId);
      setAlerts(prev => prev.map(a =>
        a._id === alertId ? { ...a, status: 'dismissed' as AlertStatus, dismissedAt: new Date().toISOString() } : a
      ));
    } catch (err) {
      console.error('Failed to dismiss alert:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    setIsMarkingAllRead(true);
    try {
      await markAllAsRead();
      setAlerts(prev => prev.map(a =>
        a.status === 'active' ? { ...a, status: 'acknowledged' as AlertStatus, acknowledgedAt: new Date().toISOString() } : a
      ));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const handleDismissAll = async () => {
    if (!confirm('Are you sure you want to dismiss all alerts?')) return;
    setIsMarkingAllRead(true);
    try {
      await dismissAllAlerts();
      setAlerts(prev => prev.map(a =>
        (a.status === 'active' || a.status === 'acknowledged')
          ? { ...a, status: 'dismissed' as AlertStatus, dismissedAt: new Date().toISOString() }
          : a
      ));
    } catch (err) {
      console.error('Failed to dismiss all:', err);
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  // Filter alerts based on tab and category
  const filteredAlerts = alerts.filter(alert => {
    // Tab filter
    if (activeTab === 'active' && alert.status !== 'active') return false;
    if (activeTab === 'read' && alert.status !== 'acknowledged') return false;

    // Category filter
    if (selectedCategory !== 'all' && alert.category !== selectedCategory) return false;

    return true;
  });

  const activeCount = alerts.filter(a => a.status === 'active').length;
  const readCount = alerts.filter(a => a.status === 'acknowledged').length;

  const severityColors: Record<AlertSeverity, { bg: string; border: string; text: string; badge: string }> = {
    critical: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-600 dark:text-rose-400', badge: 'bg-rose-500' },
    high: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-600 dark:text-orange-400', badge: 'bg-orange-500' },
    medium: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-500' },
    low: { bg: 'bg-sky-500/10', border: 'border-sky-500/30', text: 'text-sky-600 dark:text-sky-400', badge: 'bg-sky-500' },
  };

  const categories: { value: AlertCategory | 'all'; label: string; icon: string }[] = [
    { value: 'all', label: 'All', icon: '📋' },
    { value: 'weight', label: 'Weight', icon: '⚖️' },
    { value: 'fluid', label: 'Fluid', icon: '💧' },
    { value: 'vitals', label: 'Vitals', icon: '❤️' },
    { value: 'symptoms', label: 'Symptoms', icon: '🩺' },
    { value: 'session', label: 'Sessions', icon: '🏥' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 relative mx-auto">
            <div className="absolute inset-0 border-4 border-amber-500/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-amber-500 rounded-full animate-spin" />
          </div>
          <p className="text-slate-400 font-medium">Loading alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <ICONS.ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Alerts</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {activeCount} unread • {readCount} read
            </p>
          </div>
        </div>

        {activeCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAllRead}
            className="px-4 py-2 bg-sky-500 text-white rounded-xl text-sm font-bold hover:bg-sky-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isMarkingAllRead ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <ICONS.Check className="w-4 h-4" />
            )}
            Mark All Read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
        {[
          { value: 'active', label: 'Unread', count: activeCount },
          { value: 'read', label: 'Read', count: readCount },
          { value: 'all', label: 'All', count: alerts.length },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value as typeof activeTab)}
            className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition-all ${
              activeTab === tab.value
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.value
                  ? 'bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              selectedCategory === cat.value
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
            <ICONS.Bell className="w-10 h-10 text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">No alerts found</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
            {activeTab === 'active' ? 'All caught up!' : 'No alerts in this category'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const colors = severityColors[alert.severity];
            const isProcessing = processingId === alert._id;
            const isRead = alert.status === 'acknowledged';
            const isDismissed = alert.status === 'dismissed';

            return (
              <div
                key={alert._id}
                className={`rounded-2xl p-4 border transition-all ${colors.bg} ${colors.border} ${
                  isRead || isDismissed ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colors.bg}`}>
                    <span className="text-2xl">{getSeverityIcon(alert.severity)}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white ${colors.badge}`}>
                        {alert.severity}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <span>{getCategoryIcon(alert.category)}</span>
                        {alert.category}
                      </span>
                      {isRead && (
                        <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-bold text-slate-500 uppercase">
                          Read
                        </span>
                      )}
                      {isDismissed && (
                        <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-bold text-slate-500 uppercase">
                          Dismissed
                        </span>
                      )}
                    </div>

                    <h3 className={`font-bold ${colors.text}`}>{alert.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{alert.message}</p>

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-slate-400">
                        {new Date(alert.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>

                      {/* Actions */}
                      {!isDismissed && (
                        <div className="flex items-center gap-2">
                          {!isRead && (
                            <button
                              onClick={() => handleMarkAsRead(alert._id)}
                              disabled={isProcessing}
                              className="px-3 py-1.5 bg-white dark:bg-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                              {isProcessing ? (
                                <div className="w-3 h-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                              ) : (
                                <ICONS.Check className="w-3 h-3" />
                              )}
                              Mark Read
                            </button>
                          )}
                          <button
                            onClick={() => handleDismiss(alert._id)}
                            disabled={isProcessing}
                            className="px-3 py-1.5 bg-white dark:bg-slate-700 rounded-lg text-xs font-bold text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            <ICONS.X className="w-3 h-3" />
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dismiss All Button */}
      {alerts.filter(a => a.status !== 'dismissed').length > 0 && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={handleDismissAll}
            disabled={isMarkingAllRead}
            className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Dismiss All Alerts
          </button>
        </div>
      )}
    </div>
  );
};

export default Alerts;
