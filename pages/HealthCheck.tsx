import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants';

interface CheckResult {
  name: string;
  status: 'pending' | 'checking' | 'success' | 'error' | 'warning';
  message: string;
  details?: Record<string, any>;
  duration?: number;
}

const HealthCheck: React.FC = () => {
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const initialChecks: CheckResult[] = [
    { name: 'Environment Variables', status: 'pending', message: 'Not checked' },
    { name: 'API Base URL', status: 'pending', message: 'Not checked' },
    { name: 'API Server Info', status: 'pending', message: 'Not checked' },
    { name: 'API Health Endpoint', status: 'pending', message: 'Not checked' },
    { name: 'API Auth Endpoint', status: 'pending', message: 'Not checked' },
    { name: 'Google OAuth Config', status: 'pending', message: 'Not checked' },
    { name: 'Google OAuth Script', status: 'pending', message: 'Not checked' },
    { name: 'LocalStorage Access', status: 'pending', message: 'Not checked' },
    { name: 'SessionStorage Access', status: 'pending', message: 'Not checked' },
    { name: 'IndexedDB Access', status: 'pending', message: 'Not checked' },
  ];

  useEffect(() => {
    setChecks(initialChecks);
  }, []);

  const updateCheck = (name: string, update: Partial<CheckResult>) => {
    setChecks(prev => prev.map(c => c.name === name ? { ...c, ...update } : c));
  };

  const runChecks = async () => {
    setIsRunning(true);
    setChecks(initialChecks.map(c => ({ ...c, status: 'pending', message: 'Waiting...' })));

    // 1. Environment Variables Check
    updateCheck('Environment Variables', { status: 'checking', message: 'Checking...' });
    await delay(200);
    const envDetails = {
      VITE_API_BASE_URL: API_BASE_URL ? 'Set' : 'Missing',
      VITE_GOOGLE_CLIENT_ID: GOOGLE_CLIENT_ID ? 'Set' : 'Missing',
      VITE_ENABLE_HEALTH_CHECK: import.meta.env.VITE_ENABLE_HEALTH_CHECK || 'Not set',
      MODE: import.meta.env.MODE,
      DEV: import.meta.env.DEV,
      PROD: import.meta.env.PROD,
    };
    const envOk = API_BASE_URL && GOOGLE_CLIENT_ID;
    updateCheck('Environment Variables', {
      status: envOk ? 'success' : 'error',
      message: envOk ? 'All required variables set' : 'Missing required variables',
      details: envDetails,
    });

    // 2. API Base URL Check
    updateCheck('API Base URL', { status: 'checking', message: 'Validating...' });
    await delay(100);
    try {
      const url = new URL(API_BASE_URL);
      updateCheck('API Base URL', {
        status: 'success',
        message: `Valid URL: ${url.origin}`,
        details: { protocol: url.protocol, host: url.host, pathname: url.pathname },
      });
    } catch {
      updateCheck('API Base URL', {
        status: 'error',
        message: 'Invalid URL format',
        details: { raw: API_BASE_URL },
      });
    }

    // 3. API Server Info - calls root endpoint
    updateCheck('API Server Info', { status: 'checking', message: 'Fetching server info...' });
    const serverInfoStart = Date.now();
    try {
      const rootUrl = API_BASE_URL.replace('/api/v1', '');
      const res = await fetch(rootUrl, { method: 'GET', mode: 'cors' });
      const serverInfoDuration = Date.now() - serverInfoStart;
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          updateCheck('API Server Info', {
            status: 'success',
            message: `${data.data.name} v${data.data.version || '?'} (${serverInfoDuration}ms)`,
            details: {
              name: data.data.name,
              version: data.data.version,
              docs: data.data.documentation,
              health: data.data.health,
              timestamp: data.meta?.timestamp,
            },
            duration: serverInfoDuration,
          });
        } else {
          updateCheck('API Server Info', {
            status: 'warning',
            message: `Server responded but unexpected format (${serverInfoDuration}ms)`,
            details: data,
            duration: serverInfoDuration,
          });
        }
      } else {
        updateCheck('API Server Info', {
          status: 'warning',
          message: `HTTP ${res.status} (${serverInfoDuration}ms)`,
          details: { status: res.status, statusText: res.statusText },
          duration: serverInfoDuration,
        });
      }
    } catch (err: any) {
      updateCheck('API Server Info', {
        status: 'error',
        message: err.message || 'Connection failed',
        details: { error: err.toString() },
        duration: Date.now() - serverInfoStart,
      });
    }

    // 4. API Health Endpoint - use path from server info or try common paths
    updateCheck('API Health Endpoint', { status: 'checking', message: 'Connecting...' });
    const healthStart = Date.now();
    const healthPaths = [
      `${API_BASE_URL}/health`,
      API_BASE_URL.replace('/api/v1', '/health'),
      API_BASE_URL.replace('/api/v1', '/api/health'),
    ];
    let healthSuccess = false;
    for (const healthUrl of healthPaths) {
      try {
        const res = await fetch(healthUrl, { method: 'GET', mode: 'cors' });
        const healthDuration = Date.now() - healthStart;
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          updateCheck('API Health Endpoint', {
            status: 'success',
            message: `Healthy (${healthDuration}ms)`,
            details: { ...data, endpoint: healthUrl },
            duration: healthDuration,
          });
          healthSuccess = true;
          break;
        }
      } catch {
        // Try next path
      }
    }
    if (!healthSuccess) {
      // No health endpoint found, but API might still work - try a simple GET
      try {
        const baseUrl = API_BASE_URL.replace('/api/v1', '');
        const res = await fetch(baseUrl, { method: 'GET', mode: 'cors' });
        const healthDuration = Date.now() - healthStart;
        updateCheck('API Health Endpoint', {
          status: 'warning',
          message: `No health endpoint, but server responds (${healthDuration}ms)`,
          details: { status: res.status, triedPaths: healthPaths },
          duration: healthDuration,
        });
      } catch (err: any) {
        updateCheck('API Health Endpoint', {
          status: 'error',
          message: err.message || 'Connection failed',
          details: { error: err.toString(), triedPaths: healthPaths },
          duration: Date.now() - healthStart,
        });
      }
    }

    // 4. API Auth Endpoint - try multiple auth endpoints
    updateCheck('API Auth Endpoint', { status: 'checking', message: 'Testing...' });
    const authStart = Date.now();
    const authEndpoints = [
      { url: `${API_BASE_URL}/auth/session`, name: 'session' },
      { url: `${API_BASE_URL}/auth/me`, name: 'me' },
      { url: `${API_BASE_URL}/auth/verify`, name: 'verify' },
      { url: `${API_BASE_URL}/user/profile`, name: 'profile' },
    ];
    let authSuccess = false;
    for (const endpoint of authEndpoints) {
      try {
        const res = await fetch(endpoint.url, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        const authDuration = Date.now() - authStart;
        // 401/403 is expected if not logged in, 200 if logged in - both mean endpoint exists
        if (res.status === 401 || res.status === 403 || res.ok) {
          updateCheck('API Auth Endpoint', {
            status: 'success',
            message: `Reachable (${authDuration}ms) - ${res.ok ? 'Authenticated' : 'Not authenticated'}`,
            details: { status: res.status, endpoint: endpoint.name },
            duration: authDuration,
          });
          authSuccess = true;
          break;
        }
      } catch {
        // Try next endpoint
      }
    }
    if (!authSuccess) {
      const authDuration = Date.now() - authStart;
      updateCheck('API Auth Endpoint', {
        status: 'warning',
        message: `No standard auth endpoint found (${authDuration}ms)`,
        details: { triedEndpoints: authEndpoints.map(e => e.name) },
        duration: authDuration,
      });
    }

    // 5. Google OAuth Config
    updateCheck('Google OAuth Config', { status: 'checking', message: 'Validating...' });
    await delay(100);
    const googleIdValid = GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID.includes('.apps.googleusercontent.com');
    updateCheck('Google OAuth Config', {
      status: googleIdValid ? 'success' : 'error',
      message: googleIdValid ? 'Valid Google Client ID format' : 'Invalid or missing Client ID',
      details: {
        clientId: GOOGLE_CLIENT_ID ? `${GOOGLE_CLIENT_ID.substring(0, 20)}...` : 'Not set',
        format: googleIdValid ? 'Valid' : 'Invalid',
      },
    });

    // 6. Google OAuth Script
    updateCheck('Google OAuth Script', { status: 'checking', message: 'Checking...' });
    await delay(100);
    const googleScript = document.querySelector('script[src*="accounts.google.com"]');
    const googleLoaded = !!(window as any).google?.accounts;
    if (googleLoaded) {
      updateCheck('Google OAuth Script', {
        status: 'success',
        message: 'Google Identity Services loaded',
        details: { scriptPresent: true, apiLoaded: true },
      });
    } else if (googleScript) {
      updateCheck('Google OAuth Script', {
        status: 'warning',
        message: 'Script present but not initialized',
        details: { scriptPresent: true, apiLoaded: false },
      });
    } else {
      // Script not loaded is OK - it's loaded dynamically on login page
      updateCheck('Google OAuth Script', {
        status: 'warning',
        message: 'Script loads on login page (lazy loaded)',
        details: {
          scriptPresent: false,
          apiLoaded: false,
          note: 'Google script is lazy-loaded only when needed',
        },
      });
    }

    // 7. LocalStorage Access
    updateCheck('LocalStorage Access', { status: 'checking', message: 'Testing...' });
    await delay(100);
    try {
      const testKey = '__health_check_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      const storageUsed = JSON.stringify(localStorage).length;
      updateCheck('LocalStorage Access', {
        status: 'success',
        message: 'Read/Write OK',
        details: {
          itemCount: localStorage.length,
          estimatedSize: `${(storageUsed / 1024).toFixed(2)} KB`,
        },
      });
    } catch (err: any) {
      updateCheck('LocalStorage Access', {
        status: 'error',
        message: err.message || 'Access denied',
        details: { error: err.toString() },
      });
    }

    // 8. SessionStorage Access
    updateCheck('SessionStorage Access', { status: 'checking', message: 'Testing...' });
    await delay(100);
    try {
      const testKey = '__health_check_test__';
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
      updateCheck('SessionStorage Access', {
        status: 'success',
        message: 'Read/Write OK',
        details: { itemCount: sessionStorage.length },
      });
    } catch (err: any) {
      updateCheck('SessionStorage Access', {
        status: 'error',
        message: err.message || 'Access denied',
        details: { error: err.toString() },
      });
    }

    // 9. IndexedDB Access
    updateCheck('IndexedDB Access', { status: 'checking', message: 'Testing...' });
    try {
      const dbName = '__health_check_test__';
      const request = indexedDB.open(dbName, 1);
      await new Promise<void>((resolve, reject) => {
        request.onerror = () => reject(new Error('IndexedDB access denied'));
        request.onsuccess = () => {
          request.result.close();
          indexedDB.deleteDatabase(dbName);
          resolve();
        };
      });
      updateCheck('IndexedDB Access', {
        status: 'success',
        message: 'Access OK',
        details: { supported: true },
      });
    } catch (err: any) {
      updateCheck('IndexedDB Access', {
        status: 'error',
        message: err.message || 'Access denied',
        details: { error: err.toString() },
      });
    }

    setIsRunning(false);
    setLastRun(new Date());
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const getStatusIcon = (status: CheckResult['status']) => {
    switch (status) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'checking': return '○';
      default: return '○';
    }
  };

  const getStatusColor = (status: CheckResult['status']) => {
    switch (status) {
      case 'success': return 'text-emerald-500 bg-emerald-500/10';
      case 'error': return 'text-rose-500 bg-rose-500/10';
      case 'warning': return 'text-amber-500 bg-amber-500/10';
      case 'checking': return 'text-sky-500 bg-sky-500/10 animate-pulse';
      default: return 'text-slate-400 bg-slate-100 dark:bg-slate-700';
    }
  };

  const summary = {
    total: checks.length,
    success: checks.filter(c => c.status === 'success').length,
    error: checks.filter(c => c.status === 'error').length,
    warning: checks.filter(c => c.status === 'warning').length,
  };

  const overallStatus = summary.error > 0 ? 'error' : summary.warning > 0 ? 'warning' : summary.success === summary.total ? 'success' : 'pending';

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-24 px-4">
      {/* Header */}
      <header className="flex items-center justify-between pt-2">
        <div>
          <span className="px-3 py-1 bg-purple-500/10 text-purple-500 text-[10px] font-bold uppercase tracking-wider rounded-full">
            Development
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-2">
            Health Check
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            System diagnostics & connectivity tests
          </p>
        </div>
        <button
          onClick={runChecks}
          disabled={isRunning}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${
            isRunning
              ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-purple-500 hover:bg-purple-600 text-white shadow-purple-500/20'
          }`}
        >
          {isRunning ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
              Running...
            </>
          ) : (
            <>
              <ICONS.Activity className="w-4 h-4" />
              Run Checks
            </>
          )}
        </button>
      </header>

      {/* Summary Card */}
      <div className={`rounded-3xl p-6 border ${
        overallStatus === 'success' ? 'bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/30' :
        overallStatus === 'error' ? 'bg-rose-500/5 border-rose-200 dark:border-rose-500/30' :
        overallStatus === 'warning' ? 'bg-amber-500/5 border-amber-200 dark:border-amber-500/30' :
        'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${
              overallStatus === 'success' ? 'bg-emerald-500/10' :
              overallStatus === 'error' ? 'bg-rose-500/10' :
              overallStatus === 'warning' ? 'bg-amber-500/10' :
              'bg-slate-100 dark:bg-slate-700'
            }`}>
              {overallStatus === 'success' ? '✓' :
               overallStatus === 'error' ? '✕' :
               overallStatus === 'warning' ? '⚠' : '○'}
            </div>
            <div>
              <h2 className={`text-2xl font-black ${
                overallStatus === 'success' ? 'text-emerald-500' :
                overallStatus === 'error' ? 'text-rose-500' :
                overallStatus === 'warning' ? 'text-amber-500' :
                'text-slate-400'
              }`}>
                {overallStatus === 'success' ? 'All Systems Operational' :
                 overallStatus === 'error' ? 'Issues Detected' :
                 overallStatus === 'warning' ? 'Warnings Present' :
                 'Ready to Check'}
              </h2>
              {lastRun && (
                <p className="text-slate-400 text-sm">
                  Last run: {lastRun.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-4 text-center">
            <div>
              <p className="text-2xl font-black text-emerald-500">{summary.success}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Passed</p>
            </div>
            <div>
              <p className="text-2xl font-black text-amber-500">{summary.warning}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Warnings</p>
            </div>
            <div>
              <p className="text-2xl font-black text-rose-500">{summary.error}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Failed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Environment Info */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Environment</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <p className="text-slate-400 font-bold uppercase text-[9px]">Mode</p>
            <p className="font-bold text-slate-900 dark:text-white">{import.meta.env.MODE}</p>
          </div>
          <div className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <p className="text-slate-400 font-bold uppercase text-[9px]">API</p>
            <p className="font-bold text-slate-900 dark:text-white truncate" title={API_BASE_URL}>
              {API_BASE_URL ? new URL(API_BASE_URL).host : 'Not set'}
            </p>
          </div>
          <div className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <p className="text-slate-400 font-bold uppercase text-[9px]">Browser</p>
            <p className="font-bold text-slate-900 dark:text-white truncate">
              {navigator.userAgent.includes('Chrome') ? 'Chrome' :
               navigator.userAgent.includes('Firefox') ? 'Firefox' :
               navigator.userAgent.includes('Safari') ? 'Safari' : 'Other'}
            </p>
          </div>
          <div className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <p className="text-slate-400 font-bold uppercase text-[9px]">Online</p>
            <p className={`font-bold ${navigator.onLine ? 'text-emerald-500' : 'text-rose-500'}`}>
              {navigator.onLine ? 'Yes' : 'No'}
            </p>
          </div>
        </div>
      </div>

      {/* Checks List */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Diagnostic Checks</h3>
        {checks.map((check, i) => (
          <div
            key={check.name}
            className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${getStatusColor(check.status)}`}>
                {check.status === 'checking' ? (
                  <div className="w-5 h-5 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
                ) : (
                  getStatusIcon(check.status)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 dark:text-white">{check.name}</p>
                <p className="text-sm text-slate-400 truncate">{check.message}</p>
              </div>
              {check.duration !== undefined && (
                <span className="text-xs text-slate-400 tabular-nums">{check.duration}ms</span>
              )}
            </div>

            {/* Details */}
            {check.details && Object.keys(check.details).length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  {Object.entries(check.details).map(([key, value]) => (
                    <div key={key} className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <p className="text-slate-400 font-bold uppercase text-[9px]">{key}</p>
                      <p className="font-mono text-slate-900 dark:text-white truncate" title={String(value)}>
                        {typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              alert('Storage cleared!');
            }}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
          >
            Clear Storage
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
          >
            Reload Page
          </button>
          <button
            onClick={() => {
              const report = {
                timestamp: new Date().toISOString(),
                checks,
                environment: {
                  mode: import.meta.env.MODE,
                  apiUrl: API_BASE_URL,
                  userAgent: navigator.userAgent,
                  online: navigator.onLine,
                },
              };
              navigator.clipboard.writeText(JSON.stringify(report, null, 2));
              alert('Report copied to clipboard!');
            }}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
          >
            Copy Report
          </button>
          <button
            onClick={() => console.log({ checks, env: import.meta.env })}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
          >
            Log to Console
          </button>
        </div>
      </div>

      {/* Footer Note */}
      <p className="text-center text-xs text-slate-400">
        This page is only available when <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">VITE_ENABLE_HEALTH_CHECK=true</code>
      </p>
    </div>
  );
};

export default HealthCheck;
