
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useStore } from '../store';
import { useAuth } from '../contexts/AuthContext';
import { ICONS } from '../constants';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import UFSafetyIndicator from '../components/UFSafetyIndicator';
import {
  DialysisSession,
  DialysisMode,
  DialysisType,
  SessionStatus,
  SessionRating,
  createSession,
  updateSession,
  endSession,
  listSessions,
  getActiveSession,
  getSessionDetails,
  formatDuration,
  getStatusColor,
  getRatingColor,
  SessionEvent,
} from '../services/dialysis';
import { createVitalRecord, getVitalRecords, VitalRecord } from '../services/vitals';

type ViewMode = 'list' | 'create' | 'active' | 'end' | 'detail';

const Sessions: React.FC = () => {
  const { profile } = useStore();
  const { isAuthenticated } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sessions, setSessions] = useState<DialysisSession[]>([]);
  const [activeSession, setActiveSession] = useState<DialysisSession | null>(null);
  const [selectedSession, setSelectedSession] = useState<DialysisSession | null>(null);
  const [sessionEvents, setSessionEvents] = useState<SessionEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [elapsed, setElapsed] = useState('00:00:00');

  // Form states for new session
  const [newSession, setNewSession] = useState({
    mode: DialysisMode.HOME,
    type: DialysisType.HOME_HD,
    plannedDurationMin: 240,
    locationName: '',
    machineName: '',
  });

  // Form states for pre-session data
  const [preData, setPreData] = useState({
    preWeightKg: '',
    targetUfMl: '',
    preBpSystolic: '',
    preBpDiastolic: '',
    preHeartRate: '',
  });

  // Form states for post-session data
  const [postData, setPostData] = useState({
    postWeightKg: '',
    actualUfMl: '',
    postBpSystolic: '',
    postBpDiastolic: '',
    postHeartRate: '',
    sessionRating: '' as SessionRating | '',
    notes: '',
    complications: [] as string[],
  });

  // Quick vitals during session
  const [showVitalsForm, setShowVitalsForm] = useState(false);
  const [vitalsData, setVitalsData] = useState({
    bpSystolic: '',
    bpDiastolic: '',
    heartRate: '',
    spo2: '',
    temperature: '',
  });
  const [isLoggingVitals, setIsLoggingVitals] = useState(false);
  const [vitalsSuccess, setVitalsSuccess] = useState('');
  const [sessionVitals, setSessionVitals] = useState<VitalRecord[]>([]);
  const [isLoadingVitals, setIsLoadingVitals] = useState(false);

  const hasFetched = useRef(false);

  // Fetch sessions on mount
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchData = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        const [sessionsData, active] = await Promise.all([
          listSessions({ limit: 20 }),
          getActiveSession(),
        ]);

        setSessions(sessionsData.sessions);

        if (active) {
          setActiveSession(active);
          setViewMode('active');
        }
      } catch (err) {
        console.error('Failed to fetch sessions:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  // Timer for active session
  useEffect(() => {
    if (viewMode !== 'active' || !activeSession) return;

    const interval = setInterval(() => {
      const start = new Date(activeSession.startedAt).getTime();
      const diff = Date.now() - start;
      const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setElapsed(`${h}:${m}:${s}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [viewMode, activeSession]);

  // Fetch vitals for active session
  const fetchSessionVitals = async (sessionId: string) => {
    setIsLoadingVitals(true);
    try {
      const response = await getVitalRecords({ sessionId, limit: 50 });
      setSessionVitals(response.records);
    } catch (err) {
      console.error('Failed to fetch session vitals:', err);
    } finally {
      setIsLoadingVitals(false);
    }
  };

  // Load vitals when active session changes
  useEffect(() => {
    if (activeSession && viewMode === 'active') {
      fetchSessionVitals(activeSession._id);
    } else {
      setSessionVitals([]);
    }
  }, [activeSession?._id, viewMode]);

  const handleCreateSession = async () => {
    setIsSubmitting(true);
    try {
      // Build payload without empty optional fields
      const createData: any = {
        mode: newSession.mode,
        type: newSession.type,
        plannedDurationMin: newSession.plannedDurationMin,
      };
      if (newSession.locationName?.trim()) createData.locationName = newSession.locationName.trim();
      if (newSession.machineName?.trim()) createData.machineName = newSession.machineName.trim();

      const session = await createSession(createData);

      // Update with pre-session data if provided
      if (preData.preWeightKg || preData.targetUfMl || preData.preBpSystolic || preData.preHeartRate) {
        const updateData: any = {};
        if (preData.preWeightKg) updateData.preWeightKg = parseFloat(preData.preWeightKg);
        if (preData.targetUfMl) updateData.targetUfMl = parseInt(preData.targetUfMl);
        if (preData.preBpSystolic) updateData.preBpSystolic = parseInt(preData.preBpSystolic);
        if (preData.preBpDiastolic) updateData.preBpDiastolic = parseInt(preData.preBpDiastolic);
        if (preData.preHeartRate) updateData.preHeartRate = parseInt(preData.preHeartRate);

        const updated = await updateSession(session._id, updateData);
        setActiveSession(updated);
      } else {
        setActiveSession(session);
      }

      setViewMode('active');
    } catch (err) {
      console.error('Failed to create session:', err);
      alert('Failed to start session. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;

    setIsSubmitting(true);
    try {
      const endData: any = {};
      if (postData.postWeightKg) endData.postWeightKg = parseFloat(postData.postWeightKg);
      if (postData.actualUfMl) endData.actualUfMl = parseInt(postData.actualUfMl);
      if (postData.postBpSystolic) endData.postBpSystolic = parseInt(postData.postBpSystolic);
      if (postData.postBpDiastolic) endData.postBpDiastolic = parseInt(postData.postBpDiastolic);
      if (postData.postHeartRate) endData.postHeartRate = parseInt(postData.postHeartRate);
      if (postData.sessionRating) endData.sessionRating = postData.sessionRating;
      if (postData.notes) endData.notes = postData.notes;
      if (postData.complications.length > 0) endData.complications = postData.complications;

      await endSession(activeSession._id, endData);

      // Refresh sessions list
      const sessionsData = await listSessions({ limit: 20 });
      setSessions(sessionsData.sessions);

      setActiveSession(null);
      setViewMode('list');
      resetForms();
    } catch (err) {
      console.error('Failed to end session:', err);
      alert('Failed to end session. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetails = async (session: DialysisSession) => {
    try {
      const details = await getSessionDetails(session._id);
      setSelectedSession(details.session);
      setSessionEvents(details.events);
      setViewMode('detail');
    } catch (err) {
      console.error('Failed to fetch session details:', err);
    }
  };

  const resetForms = () => {
    setNewSession({
      mode: DialysisMode.HOME,
      type: DialysisType.HOME_HD,
      plannedDurationMin: 240,
      locationName: '',
      machineName: '',
    });
    setPreData({ preWeightKg: '', targetUfMl: '', preBpSystolic: '', preBpDiastolic: '', preHeartRate: '' });
    setPostData({ postWeightKg: '', actualUfMl: '', postBpSystolic: '', postBpDiastolic: '', postHeartRate: '', sessionRating: '', notes: '', complications: [] });
  };

  // Log vitals during session using new consolidated API
  const handleLogVitals = async () => {
    if (!activeSession) return;
    setIsLoggingVitals(true);
    setVitalsSuccess('');

    try {
      // Build the vital record with all provided vitals
      const recordData: any = {
        sessionId: activeSession._id,
        loggedAt: new Date().toISOString(),
      };

      let vitalCount = 0;

      // Add BP if provided
      if (vitalsData.bpSystolic && vitalsData.bpDiastolic) {
        recordData.bloodPressure = {
          systolic: parseFloat(vitalsData.bpSystolic),
          diastolic: parseFloat(vitalsData.bpDiastolic),
        };
        vitalCount++;
      }

      // Add heart rate if provided
      if (vitalsData.heartRate) {
        recordData.heartRate = parseFloat(vitalsData.heartRate);
        vitalCount++;
      }

      // Add SpO2 if provided
      if (vitalsData.spo2) {
        recordData.spo2 = parseFloat(vitalsData.spo2);
        vitalCount++;
      }

      // Add temperature if provided
      if (vitalsData.temperature) {
        recordData.temperature = {
          value: parseFloat(vitalsData.temperature),
          unit: 'celsius',
        };
        vitalCount++;
      }

      if (vitalCount === 0) {
        alert('Please enter at least one vital sign');
        return;
      }

      await createVitalRecord(recordData);
      setVitalsSuccess(`${vitalCount} vital(s) logged!`);
      setVitalsData({ bpSystolic: '', bpDiastolic: '', heartRate: '', spo2: '', temperature: '' });
      // Refresh the vitals list
      fetchSessionVitals(activeSession._id);
      setTimeout(() => setVitalsSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to log vitals:', err);
      alert('Failed to log vitals');
    } finally {
      setIsLoggingVitals(false);
    }
  };

  const completedSessions = useMemo(() =>
    sessions.filter(s => s.status === SessionStatus.COMPLETED),
    [sessions]
  );

  // Prepare chart data from completed sessions (reverse to show oldest first)
  const chartData = useMemo(() => {
    return [...completedSessions]
      .reverse()
      .slice(-10) // Last 10 sessions
      .map((session, index) => ({
        name: new Date(session.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        preWeight: session.preWeightKg || null,
        postWeight: session.postWeightKg || null,
        ufRemoved: session.actualUfMl || 0,
        targetUf: session.targetUfMl || 0,
        weightLoss: session.preWeightKg && session.postWeightKg
          ? parseFloat((session.preWeightKg - session.postWeightKg).toFixed(1))
          : 0,
      }));
  }, [completedSessions]);

  // Get dry weight from profile if available
  const dryWeight = profile?.dryWeightKg;

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-12 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-700 pb-24 px-4">

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-purple-500/10 text-purple-500 text-[10px] font-bold uppercase tracking-wider rounded-full">Dialysis</span>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-2">Sessions</h1>
        </div>
        {viewMode === 'list' && !activeSession && (
          <button
            onClick={() => setViewMode('create')}
            className="flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600 transition-all"
          >
            <ICONS.Plus className="w-5 h-5" />
            New Session
          </button>
        )}
      </header>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {/* Active Session Alert */}
          {activeSession && (
            <div
              onClick={() => setViewMode('active')}
              className="bg-emerald-500 text-white rounded-2xl p-6 cursor-pointer hover:bg-emerald-600 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                  <div>
                    <p className="font-bold text-lg">Session In Progress</p>
                    <p className="text-emerald-100 text-sm">Click to view</p>
                  </div>
                </div>
                <ICONS.Activity className="w-8 h-8" />
              </div>
            </div>
          )}

          {/* Charts Section */}
          {chartData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weight Trend Chart */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Weight Trend</h3>
                    <p className="text-sm text-slate-400">Pre & Post session weights</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-purple-500" />
                      <span className="text-slate-400">Pre</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-slate-400">Post</span>
                    </div>
                    {dryWeight && (
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-0.5 bg-rose-400" />
                        <span className="text-slate-400">Dry</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                      />
                      <YAxis
                        domain={['auto', 'auto']}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        tickFormatter={(v) => `${v}kg`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                        }}
                        labelStyle={{ color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}
                        itemStyle={{ color: '#fff', fontWeight: 700 }}
                        formatter={(value: number) => [`${value} kg`, '']}
                      />
                      {dryWeight && (
                        <ReferenceLine
                          y={dryWeight}
                          stroke="#f43f5e"
                          strokeDasharray="5 5"
                          strokeWidth={2}
                          label={{ value: 'Dry Weight', fill: '#f43f5e', fontSize: 10, position: 'right' }}
                        />
                      )}
                      <Line
                        type="monotone"
                        dataKey="preWeight"
                        stroke="#a855f7"
                        strokeWidth={3}
                        dot={{ fill: '#a855f7', strokeWidth: 0, r: 4 }}
                        activeDot={{ r: 6, fill: '#a855f7' }}
                        name="Pre Weight"
                        connectNulls
                      />
                      <Line
                        type="monotone"
                        dataKey="postWeight"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ fill: '#10b981', strokeWidth: 0, r: 4 }}
                        activeDot={{ r: 6, fill: '#10b981' }}
                        name="Post Weight"
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Fluid Removal Chart */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Fluid Removal</h3>
                    <p className="text-sm text-slate-400">UF removed per session</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-sky-500" />
                      <span className="text-slate-400">Actual</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-sky-200 dark:bg-sky-800" />
                      <span className="text-slate-400">Target</span>
                    </div>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} vertical={false} />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        tickFormatter={(v) => `${(v / 1000).toFixed(1)}L`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                        }}
                        labelStyle={{ color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}
                        itemStyle={{ color: '#fff', fontWeight: 700 }}
                        formatter={(value: number) => [`${value} ml`, '']}
                      />
                      <Bar
                        dataKey="targetUf"
                        fill="#bae6fd"
                        radius={[4, 4, 0, 0]}
                        name="Target UF"
                        className="dark:fill-sky-900"
                      />
                      <Bar
                        dataKey="ufRemoved"
                        fill="#0ea5e9"
                        radius={[4, 4, 0, 0]}
                        name="Actual UF"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Sessions List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Sessions</h2>
              <span className="text-sm text-slate-400">{completedSessions.length} completed</span>
            </div>

            {completedSessions.length > 0 ? (
              <div className="space-y-3">
                {completedSessions.map(session => (
                  <div
                    key={session._id}
                    onClick={() => handleViewDetails(session)}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 cursor-pointer hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                          <ICONS.Activity className="w-6 h-6 text-purple-500" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {session.type.toUpperCase()} - {session.mode}
                          </p>
                          <p className="text-sm text-slate-400">
                            {new Date(session.startedAt).toLocaleDateString()} at {new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                          <p className="text-sm text-slate-400">Duration</p>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {session.actualDurationMin ? formatDuration(session.actualDurationMin) : '--'}
                          </p>
                        </div>
                        <div className="text-right hidden sm:block">
                          <p className="text-sm text-slate-400">UF Removed</p>
                          <p className="font-bold text-sky-500">
                            {session.actualUfMl ? `${session.actualUfMl} ml` : '--'}
                          </p>
                        </div>
                        {session.sessionRating && (
                          <span className={`text-xl ${getRatingColor(session.sessionRating)}`}>
                            {session.sessionRating === SessionRating.GOOD ? '😊' : session.sessionRating === SessionRating.OK ? '😐' : '😞'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <ICONS.Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-bold">No sessions yet</p>
                <p className="text-sm">Start your first dialysis session</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Session View */}
      {viewMode === 'create' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Start New Session</h2>
            <button onClick={() => { setViewMode('list'); resetForms(); }} className="text-slate-400 hover:text-slate-600">
              <ICONS.X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Session Type */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Dialysis Type</label>
              <select
                value={newSession.type}
                onChange={e => setNewSession({ ...newSession, type: e.target.value as DialysisType })}
                className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none"
              >
                <option value={DialysisType.HOME_HD}>Home HD</option>
                <option value={DialysisType.IN_CENTER_HD}>In-Center HD</option>
                <option value={DialysisType.PD_CAPD}>PD - CAPD</option>
                <option value={DialysisType.PD_APD}>PD - APD</option>
                <option value={DialysisType.PRE_DIALYSIS}>Pre-Dialysis</option>
              </select>
            </div>

            {/* Mode */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Location</label>
              <select
                value={newSession.mode}
                onChange={e => setNewSession({ ...newSession, mode: e.target.value as DialysisMode })}
                className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none"
              >
                <option value={DialysisMode.HOME}>Home</option>
                <option value={DialysisMode.CLINIC}>Clinic</option>
              </select>
            </div>

            {/* Planned Duration */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Planned Duration (min)</label>
              <input
                type="number"
                value={newSession.plannedDurationMin}
                onChange={e => setNewSession({ ...newSession, plannedDurationMin: parseInt(e.target.value) || 240 })}
                className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none"
              />
            </div>

            {/* Pre Weight */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Pre-Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={preData.preWeightKg}
                onChange={e => setPreData({ ...preData, preWeightKg: e.target.value })}
                placeholder="e.g. 76.5"
                className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none"
              />
            </div>

            {/* Target UF */}
            <div>
              <label className="text-xs font-bold text-sky-500 uppercase tracking-wider mb-2 block">Target UF (ml)</label>
              <input
                type="number"
                value={preData.targetUfMl}
                onChange={e => setPreData({ ...preData, targetUfMl: e.target.value })}
                placeholder="e.g. 2500"
                className="w-full bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 rounded-xl px-4 py-3 font-semibold text-sky-600 dark:text-sky-400 outline-none"
              />
            </div>

            {/* Blood Pressure */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Pre Blood Pressure</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={preData.preBpSystolic}
                  onChange={e => setPreData({ ...preData, preBpSystolic: e.target.value })}
                  placeholder="Sys"
                  className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none"
                />
                <input
                  type="number"
                  value={preData.preBpDiastolic}
                  onChange={e => setPreData({ ...preData, preBpDiastolic: e.target.value })}
                  placeholder="Dia"
                  className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none"
                />
              </div>
            </div>

            {/* Heart Rate */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Pre Heart Rate (bpm)</label>
              <input
                type="number"
                value={preData.preHeartRate}
                onChange={e => setPreData({ ...preData, preHeartRate: e.target.value })}
                placeholder="e.g. 72"
                className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={() => { setViewMode('list'); resetForms(); }}
              className="flex-1 py-4 text-slate-400 font-bold hover:text-slate-600 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateSession}
              disabled={isSubmitting}
              className="flex-[2] py-4 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ICONS.Activity className="w-5 h-5" />
                  Start Session
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Active Session View */}
      {viewMode === 'active' && activeSession && (
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-3xl p-8 text-white text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-emerald-400 text-sm font-bold uppercase tracking-wider">Session Active</span>
            </div>

            <p className="text-slate-400 text-sm mb-2">{activeSession.type.toUpperCase()} - {activeSession.mode}</p>

            <div className="text-7xl md:text-8xl font-black tabular-nums tracking-tighter my-8">
              {elapsed}
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white/5 rounded-2xl p-4">
                <p className="text-white/40 text-xs uppercase">Target UF</p>
                <p className="text-2xl font-bold">{activeSession.targetUfMl || '--'} ml</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-4">
                <p className="text-white/40 text-xs uppercase">Pre Weight</p>
                <p className="text-2xl font-bold">{activeSession.preWeightKg || '--'} kg</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-4">
                <p className="text-white/40 text-xs uppercase">Planned</p>
                <p className="text-2xl font-bold">{activeSession.plannedDurationMin ? formatDuration(activeSession.plannedDurationMin) : '--'}</p>
              </div>
            </div>

            {/* UF Rate Indicator - Show projected rate based on target and planned duration */}
            {activeSession.targetUfMl && activeSession.preWeightKg && activeSession.plannedDurationMin && (
              <div className="mb-8">
                {(() => {
                  const ufRate = activeSession.targetUfMl / activeSession.preWeightKg / (activeSession.plannedDurationMin / 60);
                  const isSafe = ufRate < 10;
                  const isCaution = ufRate >= 10 && ufRate < 13;
                  const statusLabel = isSafe ? 'Safe' : isCaution ? 'Caution' : 'Risk';
                  const bgClass = isSafe ? 'bg-emerald-500/20 border-emerald-500/30' : isCaution ? 'bg-amber-500/20 border-amber-500/30' : 'bg-rose-500/20 border-rose-500/30';
                  const iconBgClass = isSafe ? 'bg-emerald-500/30' : isCaution ? 'bg-amber-500/30' : 'bg-rose-500/30';
                  const iconTextClass = isSafe ? 'text-emerald-400' : isCaution ? 'text-amber-400' : 'text-rose-400';
                  const badgeClass = isSafe ? 'bg-emerald-500' : isCaution ? 'bg-amber-500' : 'bg-rose-500';
                  return (
                    <div className={`${bgClass} border rounded-2xl p-4`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 ${iconBgClass} rounded-xl flex items-center justify-center`}>
                            <svg className={`w-5 h-5 ${iconTextClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-white/60 text-xs uppercase tracking-wider">Projected UF Rate</p>
                            <p className="text-2xl font-black text-white tabular-nums">
                              {ufRate.toFixed(1)} <span className="text-sm font-medium text-white/50">ml/kg/hr</span>
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${badgeClass} text-white`}>
                          {statusLabel}
                        </span>
                      </div>
                      {!isSafe && (
                        <p className="text-white/50 text-xs mt-2">
                          {isCaution ? 'Monitor for cramping or BP drops' : 'High rate may cause cramps or hypotension'}
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowVitalsForm(!showVitalsForm)}
                className="px-8 py-4 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Log Vitals
              </button>
              <button
                onClick={() => setViewMode('end')}
                className="px-12 py-4 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-100 transition-all"
              >
                End Session
              </button>
            </div>
          </div>

          {/* Quick Vitals Form */}
          {showVitalsForm && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 animate-in slide-in-from-top duration-300">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Log Vitals</h3>
                  <p className="text-sm text-slate-400">Record vitals during session</p>
                </div>
                {vitalsSuccess && (
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-sm font-bold rounded-full animate-in fade-in">
                    {vitalsSuccess}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                {/* BP */}
                <div className="col-span-2">
                  <label className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-2 block">Blood Pressure</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={vitalsData.bpSystolic}
                      onChange={e => setVitalsData({ ...vitalsData, bpSystolic: e.target.value })}
                      placeholder="Sys"
                      className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white outline-none text-sm"
                    />
                    <span className="text-slate-400 self-center">/</span>
                    <input
                      type="number"
                      value={vitalsData.bpDiastolic}
                      onChange={e => setVitalsData({ ...vitalsData, bpDiastolic: e.target.value })}
                      placeholder="Dia"
                      className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white outline-none text-sm"
                    />
                  </div>
                </div>

                {/* Heart Rate */}
                <div>
                  <label className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-2 block">Heart Rate</label>
                  <input
                    type="number"
                    value={vitalsData.heartRate}
                    onChange={e => setVitalsData({ ...vitalsData, heartRate: e.target.value })}
                    placeholder="bpm"
                    className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white outline-none text-sm"
                  />
                </div>

                {/* SpO2 */}
                <div>
                  <label className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2 block">SpO2</label>
                  <input
                    type="number"
                    value={vitalsData.spo2}
                    onChange={e => setVitalsData({ ...vitalsData, spo2: e.target.value })}
                    placeholder="%"
                    className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white outline-none text-sm"
                  />
                </div>

                {/* Temperature */}
                <div>
                  <label className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-2 block">Temp</label>
                  <input
                    type="number"
                    step="0.1"
                    value={vitalsData.temperature}
                    onChange={e => setVitalsData({ ...vitalsData, temperature: e.target.value })}
                    placeholder="°C"
                    className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white outline-none text-sm"
                  />
                </div>
              </div>

              <button
                onClick={handleLogVitals}
                disabled={isLoggingVitals}
                className="w-full py-3 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
              >
                {isLoggingVitals ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Save Vitals
                  </>
                )}
              </button>
            </div>
          )}

          {/* Session Vitals List */}
          {sessionVitals.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Session Vitals</h3>
                  <p className="text-sm text-slate-400">{sessionVitals.length} reading{sessionVitals.length !== 1 ? 's' : ''} logged</p>
                </div>
                {isLoadingVitals && (
                  <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                )}
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {sessionVitals.map((vital) => (
                  <div
                    key={vital._id}
                    className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4 flex-wrap">
                      {vital.bloodPressure && (
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 bg-rose-500/10 rounded-lg flex items-center justify-center text-rose-500 text-sm">🫀</span>
                          <div>
                            <p className="text-xs text-slate-400">BP</p>
                            <p className="font-bold text-slate-900 dark:text-white">{vital.bloodPressure.systolic}/{vital.bloodPressure.diastolic}</p>
                          </div>
                        </div>
                      )}
                      {vital.heartRate && (
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-500 text-sm">💓</span>
                          <div>
                            <p className="text-xs text-slate-400">HR</p>
                            <p className="font-bold text-slate-900 dark:text-white">{vital.heartRate} bpm</p>
                          </div>
                        </div>
                      )}
                      {vital.spo2 && (
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500 text-sm">🩸</span>
                          <div>
                            <p className="text-xs text-slate-400">SpO2</p>
                            <p className="font-bold text-slate-900 dark:text-white">{vital.spo2}%</p>
                          </div>
                        </div>
                      )}
                      {vital.temperature && (
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-500 text-sm">🌡️</span>
                          <div>
                            <p className="text-xs text-slate-400">Temp</p>
                            <p className="font-bold text-slate-900 dark:text-white">{vital.temperature.value}°{vital.temperature.unit === 'celsius' ? 'C' : 'F'}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {new Date(vital.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* End Session View */}
      {viewMode === 'end' && activeSession && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">End Session</h2>
            <button onClick={() => setViewMode('active')} className="text-slate-400 hover:text-slate-600">
              <ICONS.X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Post Weight */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Post-Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={postData.postWeightKg}
                onChange={e => setPostData({ ...postData, postWeightKg: e.target.value })}
                placeholder="e.g. 74.5"
                className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none"
              />
            </div>

            {/* Actual UF */}
            <div>
              <label className="text-xs font-bold text-sky-500 uppercase tracking-wider mb-2 block">Actual UF Removed (ml)</label>
              <input
                type="number"
                value={postData.actualUfMl}
                onChange={e => setPostData({ ...postData, actualUfMl: e.target.value })}
                placeholder="e.g. 2400"
                className="w-full bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 rounded-xl px-4 py-3 font-semibold text-sky-600 dark:text-sky-400 outline-none"
              />
            </div>

            {/* Post BP */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Post Blood Pressure</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={postData.postBpSystolic}
                  onChange={e => setPostData({ ...postData, postBpSystolic: e.target.value })}
                  placeholder="Sys"
                  className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none"
                />
                <input
                  type="number"
                  value={postData.postBpDiastolic}
                  onChange={e => setPostData({ ...postData, postBpDiastolic: e.target.value })}
                  placeholder="Dia"
                  className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none"
                />
              </div>
            </div>

            {/* Post Heart Rate */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Post Heart Rate (bpm)</label>
              <input
                type="number"
                value={postData.postHeartRate}
                onChange={e => setPostData({ ...postData, postHeartRate: e.target.value })}
                placeholder="e.g. 68"
                className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none"
              />
            </div>

            {/* Rating */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">How did it go?</label>
              <div className="flex gap-2">
                {[SessionRating.GOOD, SessionRating.OK, SessionRating.BAD].map(rating => (
                  <button
                    key={rating}
                    onClick={() => setPostData({ ...postData, sessionRating: rating })}
                    className={`flex-1 py-3 rounded-xl text-2xl transition-all ${
                      postData.sessionRating === rating
                        ? 'bg-purple-500 shadow-lg scale-105'
                        : 'bg-slate-100 dark:bg-slate-700'
                    }`}
                  >
                    {rating === SessionRating.GOOD ? '😊' : rating === SessionRating.OK ? '😐' : '😞'}
                  </button>
                ))}
              </div>
            </div>

            {/* Complications */}
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Any Complications?</label>
              <div className="flex flex-wrap gap-2">
                {['Cramping', 'Nausea', 'Headache', 'Low BP', 'Bleeding', 'Clotting', 'Access Issues', 'Other'].map(comp => (
                  <button
                    key={comp}
                    type="button"
                    onClick={() => {
                      if (postData.complications.includes(comp)) {
                        setPostData({ ...postData, complications: postData.complications.filter(c => c !== comp) });
                      } else {
                        setPostData({ ...postData, complications: [...postData.complications, comp] });
                      }
                    }}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      postData.complications.includes(comp)
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {comp}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Notes</label>
              <textarea
                value={postData.notes}
                onChange={e => setPostData({ ...postData, notes: e.target.value })}
                placeholder="How did you feel during the session?"
                rows={3}
                className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 font-medium text-slate-900 dark:text-white outline-none resize-none"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={() => setViewMode('active')}
              className="flex-1 py-4 text-slate-400 font-bold hover:text-slate-600 transition-all"
            >
              Back
            </button>
            <button
              onClick={handleEndSession}
              disabled={isSubmitting}
              className="flex-[2] py-4 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Complete Session'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Session Detail View */}
      {viewMode === 'detail' && selectedSession && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Session Details</h2>
              <p className="text-slate-400 text-sm">
                {new Date(selectedSession.startedAt).toLocaleDateString()} at {new Date(selectedSession.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <button onClick={() => { setViewMode('list'); setSelectedSession(null); }} className="text-slate-400 hover:text-slate-600">
              <ICONS.X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 dark:bg-slate-700 rounded-2xl p-4">
              <p className="text-slate-400 text-xs uppercase">Type</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedSession.type.toUpperCase()}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700 rounded-2xl p-4">
              <p className="text-slate-400 text-xs uppercase">Duration</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {selectedSession.actualDurationMin ? formatDuration(selectedSession.actualDurationMin) : '--'}
              </p>
            </div>
            <div className="bg-sky-50 dark:bg-sky-500/10 rounded-2xl p-4">
              <p className="text-sky-500 text-xs uppercase">UF Removed</p>
              <p className="text-lg font-bold text-sky-600">{selectedSession.actualUfMl || '--'} ml</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-500/10 rounded-2xl p-4">
              <p className="text-purple-500 text-xs uppercase">Weight Loss</p>
              <p className="text-lg font-bold text-purple-600">
                {selectedSession.preWeightKg && selectedSession.postWeightKg
                  ? (selectedSession.preWeightKg - selectedSession.postWeightKg).toFixed(1)
                  : '--'} kg
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-400 uppercase">Pre-Session</h3>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-slate-500">Weight</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedSession.preWeightKg || '--'} kg</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-slate-500">Blood Pressure</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedSession.preBpSystolic && selectedSession.preBpDiastolic
                      ? `${selectedSession.preBpSystolic}/${selectedSession.preBpDiastolic}`
                      : '--'} mmHg
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-slate-500">Heart Rate</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedSession.preHeartRate || '--'} bpm</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Target UF</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedSession.targetUfMl || '--'} ml</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-400 uppercase">Post-Session</h3>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-slate-500">Weight</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedSession.postWeightKg || '--'} kg</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-slate-500">Blood Pressure</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedSession.postBpSystolic && selectedSession.postBpDiastolic
                      ? `${selectedSession.postBpSystolic}/${selectedSession.postBpDiastolic}`
                      : '--'} mmHg
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-slate-500">Heart Rate</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedSession.postHeartRate || '--'} bpm</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Actual UF</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedSession.actualUfMl || '--'} ml</span>
                </div>
              </div>
            </div>
          </div>

          {/* UF Safety Indicator - Show if we have the required data */}
          {selectedSession.actualUfMl && selectedSession.preWeightKg && selectedSession.actualDurationMin && (
            <UFSafetyIndicator
              ufVolumeMl={selectedSession.actualUfMl}
              weightKg={selectedSession.preWeightKg}
              durationMin={selectedSession.actualDurationMin}
              targetUfMl={selectedSession.targetUfMl}
            />
          )}

          {selectedSession.complications && selectedSession.complications.length > 0 && (
            <div className="bg-rose-50 dark:bg-rose-500/10 rounded-2xl p-4">
              <p className="text-rose-500 text-xs uppercase mb-2">Complications</p>
              <div className="flex flex-wrap gap-2">
                {selectedSession.complications.map((comp, i) => (
                  <span key={i} className="px-3 py-1 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-bold rounded-full">
                    {comp}
                  </span>
                ))}
              </div>
            </div>
          )}

          {selectedSession.notes && (
            <div className="bg-slate-50 dark:bg-slate-700 rounded-2xl p-4">
              <p className="text-slate-400 text-xs uppercase mb-2">Notes</p>
              <p className="text-slate-900 dark:text-white">{selectedSession.notes}</p>
            </div>
          )}

          <button
            onClick={() => { setViewMode('list'); setSelectedSession(null); }}
            className="w-full py-4 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
          >
            Back to Sessions
          </button>
        </div>
      )}
    </div>
  );
};

export default Sessions;
