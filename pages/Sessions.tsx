
import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store';
import { ICONS } from '../constants';
import { getAuthToken } from '../services/auth';
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

type ViewMode = 'list' | 'create' | 'active' | 'end' | 'detail';

const Sessions: React.FC = () => {
  const { profile } = useStore();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sessions, setSessions] = useState<DialysisSession[]>([]);
  const [activeSession, setActiveSession] = useState<DialysisSession | null>(null);
  const [selectedSession, setSelectedSession] = useState<DialysisSession | null>(null);
  const [sessionEvents, setSessionEvents] = useState<SessionEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [elapsed, setElapsed] = useState('00:00:00');

  // Form states for new session
  const [newSession, setNewSession] = useState({
    mode: DialysisMode.HOME,
    type: DialysisType.HD,
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
  });

  // Form states for post-session data
  const [postData, setPostData] = useState({
    postWeightKg: '',
    actualUfMl: '',
    postBpSystolic: '',
    postBpDiastolic: '',
    sessionRating: '' as SessionRating | '',
    notes: '',
  });

  // Fetch sessions on mount
  useEffect(() => {
    const fetchData = async () => {
      const token = getAuthToken();
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      setIsAuthenticated(true);

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
  }, []);

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

  const handleCreateSession = async () => {
    setIsSubmitting(true);
    try {
      const session = await createSession(newSession);

      // Update with pre-session data if provided
      if (preData.preWeightKg || preData.targetUfMl || preData.preBpSystolic) {
        const updateData: any = {};
        if (preData.preWeightKg) updateData.preWeightKg = parseFloat(preData.preWeightKg);
        if (preData.targetUfMl) updateData.targetUfMl = parseInt(preData.targetUfMl);
        if (preData.preBpSystolic) updateData.preBpSystolic = parseInt(preData.preBpSystolic);
        if (preData.preBpDiastolic) updateData.preBpDiastolic = parseInt(preData.preBpDiastolic);

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
      if (postData.sessionRating) endData.sessionRating = postData.sessionRating;
      if (postData.notes) endData.notes = postData.notes;

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
      type: DialysisType.HD,
      plannedDurationMin: 240,
      locationName: '',
      machineName: '',
    });
    setPreData({ preWeightKg: '', targetUfMl: '', preBpSystolic: '', preBpDiastolic: '' });
    setPostData({ postWeightKg: '', actualUfMl: '', postBpSystolic: '', postBpDiastolic: '', sessionRating: '', notes: '' });
  };

  const completedSessions = useMemo(() =>
    sessions.filter(s => s.status === SessionStatus.COMPLETED),
    [sessions]
  );

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
                <option value={DialysisType.HD}>Hemodialysis (HD)</option>
                <option value={DialysisType.HDF}>Hemodiafiltration (HDF)</option>
                <option value={DialysisType.PD_CAPD}>PD - CAPD</option>
                <option value={DialysisType.PD_APD}>PD - APD</option>
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
                <option value={DialysisMode.IN_CENTER}>In-Center</option>
                <option value={DialysisMode.HOSPITAL}>Hospital</option>
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

            <div className="grid grid-cols-3 gap-4 mb-8">
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

            <button
              onClick={() => setViewMode('end')}
              className="px-12 py-4 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-100 transition-all"
            >
              End Session
            </button>
          </div>
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
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Actual UF</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedSession.actualUfMl || '--'} ml</span>
                </div>
              </div>
            </div>
          </div>

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
