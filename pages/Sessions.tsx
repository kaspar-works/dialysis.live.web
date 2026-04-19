
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router';
import { useStore } from '../store';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { ICONS } from '../constants';
import { SubscriptionLimitError } from '../services/auth';
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
  cancelSession,
  pauseSession,
  resumeSession,
  deleteSession,
  formatDuration,
  getStatusColor,
  getRatingColor,
  SessionEvent,
  analyzeSessions,
  SessionAnalysis,
  quickLogSession,
  QuickLogSessionData,
  PDSolutionType,
  PDEffluentAppearance,
  isPDType,
  AdequacyTrendResponse,
  getAdequacyTrend,
} from '../services/dialysis';
import { createVitalRecord, getVitalRecords, VitalRecord } from '../services/vitals';

type ViewMode = 'list' | 'create' | 'active' | 'end' | 'detail';

const Sessions: React.FC = () => {
  const { profile } = useStore();
  const { isAuthenticated } = useAuth();
  const { weightUnit, fluidUnit, displayWeight, displayFluid, formatWeight, formatFluid, convertWeightToKg, convertWeightFromKg, convertFluidToMl, convertFluidFromMl, displayShortDate, displayFullDate, displayTime } = useSettings();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sessions, setSessions] = useState<DialysisSession[]>([]);
  const [activeSession, setActiveSession] = useState<DialysisSession | null>(null);
  const [selectedSession, setSelectedSession] = useState<DialysisSession | null>(null);
  const [sessionEvents, setSessionEvents] = useState<SessionEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalSessions, setTotalSessions] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [elapsed, setElapsed] = useState('00:00:00');

  // Form states for new session
  const [newSession, setNewSession] = useState({
    mode: DialysisMode.HOME,
    type: DialysisType.HOME_HD,
    plannedDurationMin: 240,
    locationName: '',
    machineName: '',
    // PD fields
    pdExchangeVolumeMl: '',
    pdDwellTimeMin: '',
    pdSolutionType: '' as PDSolutionType | '',
    pdNumberOfExchanges: '',
    pdCyclerTotalVolumeMl: '',
    pdCyclerNumberOfCycles: '',
    pdCyclerLastFillMl: '',
    // BUN
    preDialysisBUN: '',
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
    // PD end fields
    pdDrainVolumeMl: '',
    pdUltrafiltrationMl: '',
    pdEffluentAppearance: '' as PDEffluentAppearance | '',
    // BUN
    preDialysisBUN: '',
    postDialysisBUN: '',
  });

  // Quick Log mode state
  const [isQuickLog, setIsQuickLog] = useState(false);
  const [quickLogData, setQuickLogData] = useState({
    sessionDate: new Date().toISOString().split('T')[0],
    durationHours: 4,
    durationMinutes: 0,
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
  const [limitError, setLimitError] = useState<{ message: string; limit?: number } | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Selected session vitals (for detail view)
  const [selectedSessionVitals, setSelectedSessionVitals] = useState<VitalRecord[]>([]);
  const [isLoadingSelectedVitals, setIsLoadingSelectedVitals] = useState(false);

  // Validation state
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showValidationModal, setShowValidationModal] = useState(false);

  // Field-level validation errors for inline display
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  // AI Analysis state
  const [analysisData, setAnalysisData] = useState<SessionAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showAnalysisDropdown, setShowAnalysisDropdown] = useState(false);

  // Adequacy trend state
  const [adequacyData, setAdequacyData] = useState<AdequacyTrendResponse | null>(null);
  const [isLoadingAdequacy, setIsLoadingAdequacy] = useState(false);

  // Delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<DialysisSession | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

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
        setTotalSessions(sessionsData.pagination?.total || sessionsData.sessions.length);

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
    // Mark all create session fields as touched to show inline errors
    const createFields = ['plannedDurationMin', 'preWeightKg', 'targetUfMl', 'preBpSystolic', 'preBpDiastolic', 'preHeartRate'];
    const newTouched: Record<string, boolean> = {};
    createFields.forEach(f => newTouched[f] = true);
    setTouchedFields(prev => ({ ...prev, ...newTouched }));

    // Validate individual fields and set errors
    const newFieldErrors: Record<string, string> = {};
    newFieldErrors.plannedDurationMin = validateField('plannedDurationMin', String(newSession.plannedDurationMin));
    newFieldErrors.preWeightKg = validateField('preWeightKg', preData.preWeightKg);
    if (preData.targetUfMl) newFieldErrors.targetUfMl = validateField('targetUfMl', preData.targetUfMl);
    if (preData.preBpSystolic) newFieldErrors.preBpSystolic = validateField('preBpSystolic', preData.preBpSystolic);
    if (preData.preBpDiastolic) newFieldErrors.preBpDiastolic = validateField('preBpDiastolic', preData.preBpDiastolic);
    if (preData.preBpSystolic && preData.preBpDiastolic) {
      newFieldErrors.preBpPair = validateBpPair(preData.preBpSystolic, preData.preBpDiastolic);
    }
    if (preData.preHeartRate) newFieldErrors.preHeartRate = validateField('preHeartRate', preData.preHeartRate);

    setFieldErrors(prev => ({ ...prev, ...newFieldErrors }));

    // Validate before submitting
    const errors = validateCreateSession();
    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationModal(true);
      return;
    }

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
      // PD fields
      if (isPDType(newSession.type)) {
        if (newSession.pdExchangeVolumeMl) createData.pdExchangeVolumeMl = parseInt(newSession.pdExchangeVolumeMl);
        if (newSession.pdDwellTimeMin) createData.pdDwellTimeMin = parseInt(newSession.pdDwellTimeMin);
        if (newSession.pdSolutionType) createData.pdSolutionType = newSession.pdSolutionType;
        if (newSession.pdNumberOfExchanges) createData.pdNumberOfExchanges = parseInt(newSession.pdNumberOfExchanges);
        if (newSession.pdCyclerTotalVolumeMl) createData.pdCyclerTotalVolumeMl = parseInt(newSession.pdCyclerTotalVolumeMl);
        if (newSession.pdCyclerNumberOfCycles) createData.pdCyclerNumberOfCycles = parseInt(newSession.pdCyclerNumberOfCycles);
        if (newSession.pdCyclerLastFillMl) createData.pdCyclerLastFillMl = parseInt(newSession.pdCyclerLastFillMl);
      }
      if (newSession.preDialysisBUN) createData.preDialysisBUN = parseFloat(newSession.preDialysisBUN);

      const session = await createSession(createData);

      // Update with pre-session data if provided
      if (preData.preWeightKg || preData.targetUfMl || preData.preBpSystolic || preData.preHeartRate) {
        const updateData: any = {};
        if (preData.preWeightKg) updateData.preWeightKg = convertWeightToKg(parseFloat(preData.preWeightKg));
        if (preData.targetUfMl) updateData.targetUfMl = Math.round(convertFluidToMl(parseInt(preData.targetUfMl)));
        if (preData.preBpSystolic) updateData.preBpSystolic = parseInt(preData.preBpSystolic);
        if (preData.preBpDiastolic) updateData.preBpDiastolic = parseInt(preData.preBpDiastolic);
        if (preData.preHeartRate) updateData.preHeartRate = parseInt(preData.preHeartRate);

        const updated = await updateSession(session._id, updateData);
        setActiveSession(updated);
      } else {
        setActiveSession(session);
      }

      setViewMode('active');
    } catch (err: any) {
      if (err instanceof SubscriptionLimitError) {
        setLimitError({ message: err.message, limit: err.limit });
        setViewMode('list');
      } else {
        console.error('Failed to create session:', err);
        const errorMessage = err?.message || 'Failed to start session. Please try again.';
        setValidationErrors([errorMessage]);
        setShowValidationModal(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Quick Log submission (manual entry of completed session)
  const handleQuickLogSession = async () => {
    // Mark all Quick Log fields as touched
    const quickLogFields = [
      'sessionDate', 'quickLogDuration', 'preWeightKg', 'targetUfMl',
      'preBpSystolic', 'preBpDiastolic', 'preHeartRate',
      'postWeightKg', 'actualUfMl', 'postBpSystolic', 'postBpDiastolic', 'postHeartRate'
    ];
    const newTouched: Record<string, boolean> = {};
    quickLogFields.forEach(f => newTouched[f] = true);
    setTouchedFields(prev => ({ ...prev, ...newTouched }));

    // Validate all Quick Log fields
    const errors: string[] = [];
    const newFieldErrors: Record<string, string> = {};

    // Session date validation
    const dateError = validateField('sessionDate', quickLogData.sessionDate);
    if (dateError) {
      errors.push(dateError);
      newFieldErrors.sessionDate = dateError;
    }

    // Duration validation
    const durationMin = (quickLogData.durationHours * 60) + quickLogData.durationMinutes;
    if (durationMin < 30) {
      errors.push('Duration must be at least 30 minutes');
      newFieldErrors.quickLogDuration = 'Must be at least 30 min';
    } else if (durationMin > 720) {
      errors.push('Duration cannot exceed 12 hours');
      newFieldErrors.quickLogDuration = 'Cannot exceed 12 hours';
    }

    // Validate optional vitals fields if provided
    if (preData.preWeightKg) {
      const e = validateField('preWeightKg', preData.preWeightKg);
      if (e) { errors.push(e); newFieldErrors.preWeightKg = e; }
    }
    if (preData.targetUfMl) {
      const e = validateField('targetUfMl', preData.targetUfMl);
      if (e) { errors.push(e); newFieldErrors.targetUfMl = e; }
    }
    if (preData.preBpSystolic) {
      const e = validateField('preBpSystolic', preData.preBpSystolic);
      if (e) { errors.push(e); newFieldErrors.preBpSystolic = e; }
    }
    if (preData.preBpDiastolic) {
      const e = validateField('preBpDiastolic', preData.preBpDiastolic);
      if (e) { errors.push(e); newFieldErrors.preBpDiastolic = e; }
    }
    if (preData.preBpSystolic && preData.preBpDiastolic) {
      const bpError = validateBpPair(preData.preBpSystolic, preData.preBpDiastolic);
      if (bpError) { errors.push(bpError); newFieldErrors.preBpPair = bpError; }
    }
    if (preData.preHeartRate) {
      const e = validateField('preHeartRate', preData.preHeartRate);
      if (e) { errors.push(e); newFieldErrors.preHeartRate = e; }
    }
    if (postData.postWeightKg) {
      const e = validateField('postWeightKg', postData.postWeightKg);
      if (e) { errors.push(e); newFieldErrors.postWeightKg = e; }
    }
    if (postData.actualUfMl) {
      const e = validateField('actualUfMl', postData.actualUfMl);
      if (e) { errors.push(e); newFieldErrors.actualUfMl = e; }
    }
    if (postData.postBpSystolic) {
      const e = validateField('postBpSystolic', postData.postBpSystolic);
      if (e) { errors.push(e); newFieldErrors.postBpSystolic = e; }
    }
    if (postData.postBpDiastolic) {
      const e = validateField('postBpDiastolic', postData.postBpDiastolic);
      if (e) { errors.push(e); newFieldErrors.postBpDiastolic = e; }
    }
    if (postData.postBpSystolic && postData.postBpDiastolic) {
      const bpError = validateBpPair(postData.postBpSystolic, postData.postBpDiastolic);
      if (bpError) { errors.push(bpError); newFieldErrors.postBpPair = bpError; }
    }
    if (postData.postHeartRate) {
      const e = validateField('postHeartRate', postData.postHeartRate);
      if (e) { errors.push(e); newFieldErrors.postHeartRate = e; }
    }

    setFieldErrors(prev => ({ ...prev, ...newFieldErrors }));

    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationModal(true);
      return;
    }

    setIsSubmitting(true);
    try {

      const data: QuickLogSessionData = {
        mode: newSession.mode,
        type: newSession.type,
        sessionDate: quickLogData.sessionDate ? new Date(quickLogData.sessionDate).toISOString() : undefined,
        durationMin,
        locationName: newSession.locationName?.trim() || undefined,
        machineName: newSession.machineName?.trim() || undefined,
      };

      // Add pre-session data
      if (preData.preWeightKg) data.preWeightKg = convertWeightToKg(parseFloat(preData.preWeightKg));
      if (preData.targetUfMl) data.targetUfMl = Math.round(convertFluidToMl(parseInt(preData.targetUfMl)));
      if (preData.preBpSystolic) data.preBpSystolic = parseInt(preData.preBpSystolic);
      if (preData.preBpDiastolic) data.preBpDiastolic = parseInt(preData.preBpDiastolic);
      if (preData.preHeartRate) data.preHeartRate = parseInt(preData.preHeartRate);

      // Add post-session data
      if (postData.postWeightKg) data.postWeightKg = convertWeightToKg(parseFloat(postData.postWeightKg));
      if (postData.actualUfMl) data.actualUfMl = Math.round(convertFluidToMl(parseInt(postData.actualUfMl)));
      if (postData.postBpSystolic) data.postBpSystolic = parseInt(postData.postBpSystolic);
      if (postData.postBpDiastolic) data.postBpDiastolic = parseInt(postData.postBpDiastolic);
      if (postData.postHeartRate) data.postHeartRate = parseInt(postData.postHeartRate);
      if (postData.sessionRating) data.sessionRating = postData.sessionRating as SessionRating;
      if (postData.notes) data.notes = postData.notes;
      if (postData.complications.length > 0) data.complications = postData.complications;
      // PD fields
      if (isPDType(newSession.type)) {
        if (newSession.pdExchangeVolumeMl) data.pdExchangeVolumeMl = parseInt(newSession.pdExchangeVolumeMl);
        if (newSession.pdDwellTimeMin) data.pdDwellTimeMin = parseInt(newSession.pdDwellTimeMin);
        if (newSession.pdSolutionType) data.pdSolutionType = newSession.pdSolutionType;
        if (newSession.pdNumberOfExchanges) data.pdNumberOfExchanges = parseInt(newSession.pdNumberOfExchanges);
        if (postData.pdDrainVolumeMl) data.pdDrainVolumeMl = parseInt(postData.pdDrainVolumeMl);
        if (postData.pdUltrafiltrationMl) data.pdUltrafiltrationMl = parseInt(postData.pdUltrafiltrationMl);
        if (postData.pdEffluentAppearance) data.pdEffluentAppearance = postData.pdEffluentAppearance;
        if (newSession.pdCyclerTotalVolumeMl) data.pdCyclerTotalVolumeMl = parseInt(newSession.pdCyclerTotalVolumeMl);
        if (newSession.pdCyclerNumberOfCycles) data.pdCyclerNumberOfCycles = parseInt(newSession.pdCyclerNumberOfCycles);
        if (newSession.pdCyclerLastFillMl) data.pdCyclerLastFillMl = parseInt(newSession.pdCyclerLastFillMl);
      }
      // BUN
      if (postData.preDialysisBUN) data.preDialysisBUN = parseFloat(postData.preDialysisBUN);
      if (postData.postDialysisBUN) data.postDialysisBUN = parseFloat(postData.postDialysisBUN);

      await quickLogSession(data);

      // Refresh sessions list
      const sessionsData = await listSessions({ limit: 20 });
      setSessions(sessionsData.sessions);

      setViewMode('list');
      resetForms();
    } catch (err: any) {
      if (err instanceof SubscriptionLimitError) {
        setLimitError({ message: err.message, limit: err.limit });
        setViewMode('list');
      } else {
        console.error('Failed to quick log session:', err);
        const errorMessage = err?.message || 'Failed to log session. Please try again.';
        setValidationErrors([errorMessage]);
        setShowValidationModal(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;

    // Validate before submitting
    const errors = validateEndSession();
    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const endData: any = {};
      if (postData.postWeightKg) endData.postWeightKg = convertWeightToKg(parseFloat(postData.postWeightKg));
      if (postData.actualUfMl) endData.actualUfMl = Math.round(convertFluidToMl(parseInt(postData.actualUfMl)));
      if (postData.postBpSystolic) endData.postBpSystolic = parseInt(postData.postBpSystolic);
      if (postData.postBpDiastolic) endData.postBpDiastolic = parseInt(postData.postBpDiastolic);
      if (postData.postHeartRate) endData.postHeartRate = parseInt(postData.postHeartRate);
      if (postData.sessionRating) endData.sessionRating = postData.sessionRating;
      if (postData.notes) endData.notes = postData.notes;
      if (postData.complications.length > 0) endData.complications = postData.complications;
      // PD end fields
      if (activeSession.type && isPDType(activeSession.type)) {
        if (postData.pdDrainVolumeMl) endData.pdDrainVolumeMl = parseInt(postData.pdDrainVolumeMl);
        if (postData.pdUltrafiltrationMl) endData.pdUltrafiltrationMl = parseInt(postData.pdUltrafiltrationMl);
        if (postData.pdEffluentAppearance) endData.pdEffluentAppearance = postData.pdEffluentAppearance;
      }
      // BUN
      if (postData.preDialysisBUN) endData.preDialysisBUN = parseFloat(postData.preDialysisBUN);
      if (postData.postDialysisBUN) endData.postDialysisBUN = parseFloat(postData.postDialysisBUN);

      await endSession(activeSession._id, endData);

      // Refresh sessions list
      const sessionsData = await listSessions({ limit: 20 });
      setSessions(sessionsData.sessions);

      setActiveSession(null);
      setViewMode('list');
      resetForms();
    } catch (err: any) {
      if (err instanceof SubscriptionLimitError) {
        setLimitError({ message: err.message, limit: err.limit });
      } else {
        console.error('Failed to end session:', err);
        const errorMessage = err?.message || 'Failed to end session. Please try again.';
        setValidationErrors([errorMessage]);
        setShowValidationModal(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePauseResume = async () => {
    if (!activeSession) return;
    try {
      if (isPaused) {
        await resumeSession(activeSession._id);
        setIsPaused(false);
      } else {
        await pauseSession(activeSession._id);
        setIsPaused(true);
      }
    } catch (err) {
      console.error('Failed to pause/resume:', err);
    }
  };

  const handleCancelSession = async () => {
    if (!activeSession) return;
    setIsCancelling(true);
    try {
      await cancelSession(activeSession._id);
      const sessionsData = await listSessions({ limit: 20 });
      setSessions(sessionsData.sessions);
      setActiveSession(null);
      setViewMode('list');
      setShowCancelConfirm(false);
      resetForms();
    } catch (err: any) {
      console.error('Failed to cancel session:', err);
      setValidationErrors([err?.message || 'Failed to cancel session.']);
      setShowValidationModal(true);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    try {
      const sessionsData = await listSessions({ limit: 20, offset: sessions.length });
      setSessions(prev => [...prev, ...sessionsData.sessions]);
      setTotalSessions(sessionsData.pagination?.total || sessions.length + sessionsData.sessions.length);
    } catch (err) {
      console.error('Failed to load more sessions:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleViewDetails = async (session: DialysisSession) => {
    try {
      setIsLoadingSelectedVitals(true);
      const details = await getSessionDetails(session._id);
      setSelectedSession(details.session);
      setSessionEvents(details.events);
      setSelectedSessionVitals(details.vitals || []);
      setViewMode('detail');
    } catch (err) {
      console.error('Failed to fetch session details:', err);
    } finally {
      setIsLoadingSelectedVitals(false);
    }
  };

  const resetForms = () => {
    setNewSession({
      mode: DialysisMode.HOME,
      type: DialysisType.HOME_HD,
      plannedDurationMin: 240,
      locationName: '',
      machineName: '',
      pdExchangeVolumeMl: '',
      pdDwellTimeMin: '',
      pdSolutionType: '',
      pdNumberOfExchanges: '',
      pdCyclerTotalVolumeMl: '',
      pdCyclerNumberOfCycles: '',
      pdCyclerLastFillMl: '',
      preDialysisBUN: '',
    });
    setPreData({ preWeightKg: '', targetUfMl: '', preBpSystolic: '', preBpDiastolic: '', preHeartRate: '' });
    setPostData({ postWeightKg: '', actualUfMl: '', postBpSystolic: '', postBpDiastolic: '', postHeartRate: '', sessionRating: '', notes: '', complications: [], pdDrainVolumeMl: '', pdUltrafiltrationMl: '', pdEffluentAppearance: '', preDialysisBUN: '', postDialysisBUN: '' });
    setIsQuickLog(false);
    setQuickLogData({
      sessionDate: new Date().toISOString().split('T')[0],
      durationHours: 4,
      durationMinutes: 0,
    });
    setFieldErrors({});
    setTouchedFields({});
  };

  // Field-level validation helpers for inline feedback
  const validateField = (fieldName: string, value: string): string => {
    switch (fieldName) {
      case 'plannedDurationMin': {
        const duration = parseInt(value);
        if (isNaN(duration) || duration < 30) return 'Must be at least 30 minutes';
        if (duration > 480) return 'Cannot exceed 8 hours (480 min)';
        return '';
      }
      case 'preWeightKg': {
        if (!value || value.trim() === '') return isQuickLog ? '' : 'Pre-weight is required';
        const inputWeight = parseFloat(value);
        if (isNaN(inputWeight)) return 'Enter a valid number';
        const weightKg = convertWeightToKg(inputWeight);
        if (weightKg < 20 || weightKg > 250) {
          const minDisplay = convertWeightFromKg(20);
          const maxDisplay = convertWeightFromKg(250);
          return `Must be ${minDisplay.toFixed(0)}-${maxDisplay.toFixed(0)} ${weightUnit}`;
        }
        return '';
      }
      case 'postWeightKg': {
        if (!value || value.trim() === '') return '';
        const inputWeight = parseFloat(value);
        if (isNaN(inputWeight)) return 'Enter a valid number';
        const weightKg = convertWeightToKg(inputWeight);
        if (weightKg < 20 || weightKg > 250) {
          const minDisplay = convertWeightFromKg(20);
          const maxDisplay = convertWeightFromKg(250);
          return `Must be ${minDisplay.toFixed(0)}-${maxDisplay.toFixed(0)} ${weightUnit}`;
        }
        return '';
      }
      case 'targetUfMl':
      case 'actualUfMl': {
        if (!value) return '';
        const inputUf = parseInt(value);
        if (isNaN(inputUf)) return 'Enter a valid number';
        const ufMl = convertFluidToMl(inputUf);
        if (ufMl < 0) return 'Cannot be negative';
        const maxUf = fieldName === 'targetUfMl' ? 6000 : 8000;
        if (ufMl > maxUf) {
          const maxDisplay = Math.round(convertFluidFromMl(maxUf));
          return `Exceeds safe limit (${maxDisplay} ${fluidUnit})`;
        }
        return '';
      }
      case 'preBpSystolic':
      case 'postBpSystolic': {
        if (!value) return '';
        const sys = parseInt(value);
        if (isNaN(sys)) return 'Enter a valid number';
        if (sys < 60 || sys > 250) return 'Must be 60-250 mmHg';
        return '';
      }
      case 'preBpDiastolic':
      case 'postBpDiastolic': {
        if (!value) return '';
        const dia = parseInt(value);
        if (isNaN(dia)) return 'Enter a valid number';
        if (dia < 30 || dia > 150) return 'Must be 30-150 mmHg';
        return '';
      }
      case 'preHeartRate':
      case 'postHeartRate': {
        if (!value) return '';
        const hr = parseInt(value);
        if (isNaN(hr)) return 'Enter a valid number';
        if (hr < 30 || hr > 220) return 'Must be 30-220 bpm';
        return '';
      }
      case 'sessionDate': {
        if (!value) return 'Session date is required';
        const date = new Date(value);
        if (isNaN(date.getTime())) return 'Enter a valid date';
        if (date > new Date()) return 'Cannot be in the future';
        return '';
      }
      case 'quickLogDuration': {
        const totalMin = (quickLogData.durationHours * 60) + quickLogData.durationMinutes;
        if (totalMin < 30) return 'Must be at least 30 minutes';
        if (totalMin > 720) return 'Cannot exceed 12 hours';
        return '';
      }
      // Vitals form fields
      case 'vitalsBpSystolic': {
        if (!value) return '';
        const sys = parseInt(value);
        if (isNaN(sys)) return 'Enter a valid number';
        if (sys < 60 || sys > 250) return 'Must be 60-250 mmHg';
        return '';
      }
      case 'vitalsBpDiastolic': {
        if (!value) return '';
        const dia = parseInt(value);
        if (isNaN(dia)) return 'Enter a valid number';
        if (dia < 30 || dia > 150) return 'Must be 30-150 mmHg';
        return '';
      }
      case 'vitalsHeartRate': {
        if (!value) return '';
        const hr = parseInt(value);
        if (isNaN(hr)) return 'Enter a valid number';
        if (hr < 30 || hr > 220) return 'Must be 30-220 bpm';
        return '';
      }
      case 'vitalsSpo2': {
        if (!value) return '';
        const spo2 = parseFloat(value);
        if (isNaN(spo2)) return 'Enter a valid number';
        if (spo2 < 50 || spo2 > 100) return 'Must be 50-100%';
        return '';
      }
      case 'vitalsTemperature': {
        if (!value) return '';
        const temp = parseFloat(value);
        if (isNaN(temp)) return 'Enter a valid number';
        if (temp < 30 || temp > 43) return 'Must be 30-43°C';
        return '';
      }
      default:
        return '';
    }
  };

  // Validate BP pair (systolic must be > diastolic)
  const validateBpPair = (systolic: string, diastolic: string): string => {
    if (!systolic || !diastolic) return '';
    const sys = parseInt(systolic);
    const dia = parseInt(diastolic);
    if (!isNaN(sys) && !isNaN(dia) && sys <= dia) {
      return 'Systolic must be higher than diastolic';
    }
    return '';
  };

  // Handle field blur for validation
  const handleFieldBlur = (fieldName: string, value: string) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
    const error = validateField(fieldName, value);
    setFieldErrors(prev => ({ ...prev, [fieldName]: error }));

    // Check BP pair if either BP field is blurred
    if (fieldName === 'preBpSystolic' || fieldName === 'preBpDiastolic') {
      const bpError = validateBpPair(preData.preBpSystolic, preData.preBpDiastolic);
      setFieldErrors(prev => ({ ...prev, preBpPair: bpError }));
    }
    if (fieldName === 'postBpSystolic' || fieldName === 'postBpDiastolic') {
      const bpError = validateBpPair(postData.postBpSystolic, postData.postBpDiastolic);
      setFieldErrors(prev => ({ ...prev, postBpPair: bpError }));
    }
  };

  // Handle field change with real-time validation for touched fields
  const handleFieldChange = (fieldName: string, value: string, setter: (val: string) => void) => {
    setter(value);
    // Only validate if field was already touched
    if (touchedFields[fieldName]) {
      const error = validateField(fieldName, value);
      setFieldErrors(prev => ({ ...prev, [fieldName]: error }));
    }
  };

  // Check if form has any errors
  const hasFieldErrors = Object.values(fieldErrors).some(error => error !== '');

  // Check if vitals form has any errors
  const hasVitalsFieldErrors = ['vitalsBpSystolic', 'vitalsBpDiastolic', 'vitalsBpPair', 'vitalsHeartRate', 'vitalsSpo2', 'vitalsTemperature']
    .some(f => fieldErrors[f] && fieldErrors[f] !== '');

  // Validation functions
  const validateCreateSession = (): string[] => {
    const errors: string[] = [];

    // Duration validation
    if (newSession.plannedDurationMin < 30) {
      errors.push('Planned duration must be at least 30 minutes');
    }
    if (newSession.plannedDurationMin > 480) {
      errors.push('Planned duration cannot exceed 8 hours (480 minutes)');
    }

    // Pre-weight validation (required)
    if (!preData.preWeightKg || preData.preWeightKg.trim() === '') {
      errors.push('Pre-weight is required');
    } else {
      const inputWeight = parseFloat(preData.preWeightKg);
      const weightKg = convertWeightToKg(inputWeight);
      const minDisplay = convertWeightFromKg(20);
      const maxDisplay = convertWeightFromKg(250);
      if (isNaN(weightKg) || weightKg < 20 || weightKg > 250) {
        errors.push(`Pre-weight must be between ${minDisplay.toFixed(0)} and ${maxDisplay.toFixed(0)} ${weightUnit}`);
      }
    }

    // Target UF validation
    if (preData.targetUfMl) {
      const inputUf = parseInt(preData.targetUfMl);
      const ufMl = convertFluidToMl(inputUf);
      const maxDisplay = Math.round(convertFluidFromMl(6000));
      if (isNaN(ufMl) || ufMl < 0) {
        errors.push('Target UF cannot be negative');
      }
      if (ufMl > 6000) {
        errors.push(`Target UF exceeds safe limit (${maxDisplay} ${fluidUnit}). Please verify this value.`);
      }
    }

    // BP validation
    if (preData.preBpSystolic || preData.preBpDiastolic) {
      const sys = parseInt(preData.preBpSystolic);
      const dia = parseInt(preData.preBpDiastolic);

      if (preData.preBpSystolic && (isNaN(sys) || sys < 60 || sys > 250)) {
        errors.push('Systolic blood pressure must be between 60 and 250 mmHg');
      }
      if (preData.preBpDiastolic && (isNaN(dia) || dia < 30 || dia > 150)) {
        errors.push('Diastolic blood pressure must be between 30 and 150 mmHg');
      }
      if (sys && dia && sys <= dia) {
        errors.push('Systolic pressure must be higher than diastolic pressure');
      }
    }

    // Heart rate validation
    if (preData.preHeartRate) {
      const hr = parseInt(preData.preHeartRate);
      if (isNaN(hr) || hr < 30 || hr > 220) {
        errors.push('Heart rate must be between 30 and 220 bpm');
      }
    }

    return errors;
  };

  const validateEndSession = (): string[] => {
    const errors: string[] = [];

    // Post-weight validation
    if (postData.postWeightKg) {
      const inputWeight = parseFloat(postData.postWeightKg);
      const weightKg = convertWeightToKg(inputWeight);
      const minDisplay = convertWeightFromKg(20);
      const maxDisplay = convertWeightFromKg(250);
      if (isNaN(weightKg) || weightKg < 20 || weightKg > 250) {
        errors.push(`Post-weight must be between ${minDisplay.toFixed(0)} and ${maxDisplay.toFixed(0)} ${weightUnit}`);
      }

      // Check if post weight is reasonable compared to pre weight
      if (activeSession?.preWeightKg && weightKg) {
        const diff = activeSession.preWeightKg - weightKg;
        const diffDisplay = convertWeightFromKg(2);
        const maxLossDisplay = convertWeightFromKg(10);
        if (diff < -2) {
          errors.push(`Post-weight is higher than pre-weight by more than ${diffDisplay.toFixed(1)} ${weightUnit}. Please verify.`);
        }
        if (diff > 10) {
          errors.push(`Weight loss exceeds ${maxLossDisplay.toFixed(0)} ${weightUnit}. Please verify the values.`);
        }
      }
    }

    // Actual UF validation
    if (postData.actualUfMl) {
      const inputUf = parseInt(postData.actualUfMl);
      const ufMl = convertFluidToMl(inputUf);
      const maxDisplay = Math.round(convertFluidFromMl(8000));
      if (isNaN(ufMl) || ufMl < 0) {
        errors.push('Actual UF cannot be negative');
      }
      if (ufMl > 8000) {
        errors.push(`Actual UF exceeds ${maxDisplay} ${fluidUnit}. Please verify this value.`);
      }
    }

    // Post BP validation
    if (postData.postBpSystolic || postData.postBpDiastolic) {
      const sys = parseInt(postData.postBpSystolic);
      const dia = parseInt(postData.postBpDiastolic);

      if (postData.postBpSystolic && (isNaN(sys) || sys < 60 || sys > 250)) {
        errors.push('Post systolic blood pressure must be between 60 and 250 mmHg');
      }
      if (postData.postBpDiastolic && (isNaN(dia) || dia < 30 || dia > 150)) {
        errors.push('Post diastolic blood pressure must be between 30 and 150 mmHg');
      }
      if (sys && dia && sys <= dia) {
        errors.push('Systolic pressure must be higher than diastolic pressure');
      }
    }

    // Post heart rate validation
    if (postData.postHeartRate) {
      const hr = parseInt(postData.postHeartRate);
      if (isNaN(hr) || hr < 30 || hr > 220) {
        errors.push('Post heart rate must be between 30 and 220 bpm');
      }
    }

    return errors;
  };

  const validateVitals = (): string[] => {
    const errors: string[] = [];

    // Check if at least one vital is provided
    if (!vitalsData.bpSystolic && !vitalsData.bpDiastolic && !vitalsData.heartRate && !vitalsData.spo2 && !vitalsData.temperature) {
      errors.push('Please enter at least one vital sign');
      return errors;
    }

    // BP validation
    if (vitalsData.bpSystolic || vitalsData.bpDiastolic) {
      const sys = parseFloat(vitalsData.bpSystolic);
      const dia = parseFloat(vitalsData.bpDiastolic);

      if (vitalsData.bpSystolic && !vitalsData.bpDiastolic) {
        errors.push('Please enter both systolic and diastolic blood pressure');
      }
      if (!vitalsData.bpSystolic && vitalsData.bpDiastolic) {
        errors.push('Please enter both systolic and diastolic blood pressure');
      }
      if (vitalsData.bpSystolic && (isNaN(sys) || sys < 60 || sys > 250)) {
        errors.push('Systolic blood pressure must be between 60 and 250 mmHg');
      }
      if (vitalsData.bpDiastolic && (isNaN(dia) || dia < 30 || dia > 150)) {
        errors.push('Diastolic blood pressure must be between 30 and 150 mmHg');
      }
      if (sys && dia && sys <= dia) {
        errors.push('Systolic pressure must be higher than diastolic pressure');
      }
    }

    // Heart rate validation
    if (vitalsData.heartRate) {
      const hr = parseFloat(vitalsData.heartRate);
      if (isNaN(hr) || hr < 30 || hr > 220) {
        errors.push('Heart rate must be between 30 and 220 bpm');
      }
    }

    // SpO2 validation
    if (vitalsData.spo2) {
      const spo2 = parseFloat(vitalsData.spo2);
      if (isNaN(spo2) || spo2 < 50 || spo2 > 100) {
        errors.push('SpO2 must be between 50% and 100%');
      }
    }

    // Temperature validation
    if (vitalsData.temperature) {
      const temp = parseFloat(vitalsData.temperature);
      if (isNaN(temp) || temp < 30 || temp > 43) {
        errors.push('Temperature must be between 30°C and 43°C');
      }
    }

    return errors;
  };

  // Log vitals during session using new consolidated API
  const handleLogVitals = async () => {
    if (!activeSession) return;

    // Mark all vitals fields as touched to show inline errors
    const vitalsFields = ['vitalsBpSystolic', 'vitalsBpDiastolic', 'vitalsHeartRate', 'vitalsSpo2', 'vitalsTemperature'];
    const newTouched: Record<string, boolean> = {};
    vitalsFields.forEach(f => newTouched[f] = true);
    setTouchedFields(prev => ({ ...prev, ...newTouched }));

    // Validate individual fields and set field errors
    const newFieldErrors: Record<string, string> = {};
    if (vitalsData.bpSystolic) newFieldErrors.vitalsBpSystolic = validateField('vitalsBpSystolic', vitalsData.bpSystolic);
    if (vitalsData.bpDiastolic) newFieldErrors.vitalsBpDiastolic = validateField('vitalsBpDiastolic', vitalsData.bpDiastolic);
    if (vitalsData.bpSystolic && vitalsData.bpDiastolic) {
      newFieldErrors.vitalsBpPair = validateBpPair(vitalsData.bpSystolic, vitalsData.bpDiastolic);
    }
    if (vitalsData.heartRate) newFieldErrors.vitalsHeartRate = validateField('vitalsHeartRate', vitalsData.heartRate);
    if (vitalsData.spo2) newFieldErrors.vitalsSpo2 = validateField('vitalsSpo2', vitalsData.spo2);
    if (vitalsData.temperature) newFieldErrors.vitalsTemperature = validateField('vitalsTemperature', vitalsData.temperature);

    setFieldErrors(prev => ({ ...prev, ...newFieldErrors }));

    // Validate before submitting
    const errors = validateVitals();
    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationModal(true);
      return;
    }

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

      await createVitalRecord(recordData);
      setVitalsSuccess(`${vitalCount} vital(s) logged!`);
      setVitalsData({ bpSystolic: '', bpDiastolic: '', heartRate: '', spo2: '', temperature: '' });
      // Clear vitals field errors and touched state
      setFieldErrors(prev => {
        const { vitalsBpSystolic, vitalsBpDiastolic, vitalsBpPair, vitalsHeartRate, vitalsSpo2, vitalsTemperature, ...rest } = prev;
        return rest;
      });
      setTouchedFields(prev => {
        const { vitalsBpSystolic, vitalsBpDiastolic, vitalsHeartRate, vitalsSpo2, vitalsTemperature, ...rest } = prev;
        return rest;
      });
      // Refresh the vitals list
      fetchSessionVitals(activeSession._id);
      setTimeout(() => setVitalsSuccess(''), 3000);
    } catch (err: any) {
      if (err instanceof SubscriptionLimitError) {
        setLimitError({ message: err.message, limit: err.limit });
        setShowVitalsForm(false);
      } else {
        console.error('Failed to log vitals:', err);
        const errorMessage = err?.message || 'Failed to log vitals. Please try again.';
        setValidationErrors([errorMessage]);
        setShowValidationModal(true);
      }
    } finally {
      setIsLoggingVitals(false);
    }
  };

  // AI Analysis handler
  const handleAnalyzeSessions = async (days: number) => {
    setShowAnalysisDropdown(false);
    setIsAnalyzing(true);
    try {
      const data = await analyzeSessions(days);
      setAnalysisData(data);
      setShowAnalysisModal(true);
    } catch (err: any) {
      console.error('Failed to analyze sessions:', err);
      setValidationErrors([err?.message || 'Failed to analyze sessions. Please try again.']);
      setShowValidationModal(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Delete handler
  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSession(sessionToDelete._id);
      setSessions(prev => prev.filter(s => s._id !== sessionToDelete._id));
      setShowDeleteModal(false);
      setSessionToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete session:', err);
      setValidationErrors([err?.message || 'Failed to delete session. Please try again.']);
      setShowValidationModal(true);
    } finally {
      setIsDeleting(false);
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
        name: displayShortDate(session.startedAt),
        preWeight: session.preWeightKg ? convertWeightFromKg(session.preWeightKg) : null,
        postWeight: session.postWeightKg ? convertWeightFromKg(session.postWeightKg) : null,
        ufRemoved: session.actualUfMl ? convertFluidFromMl(session.actualUfMl) : 0,
        targetUf: session.targetUfMl ? convertFluidFromMl(session.targetUfMl) : 0,
        weightLoss: session.preWeightKg && session.postWeightKg
          ? parseFloat(convertWeightFromKg(session.preWeightKg - session.postWeightKg).toFixed(1))
          : 0,
      }));
  }, [completedSessions, convertWeightFromKg, convertFluidFromMl, displayShortDate]);

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
          <span className="px-3 py-1 bg-[#4EC7B8]/12 text-[#2F8F87] text-[10px] font-bold uppercase tracking-wider rounded-full">Dialysis</span>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1F2D2A] tracking-tight mt-2">Sessions</h1>
          <p className="text-sm mt-1" style={{ color: '#7B7A74' }}>
            Track your dialysis sessions and monitor trends over time.
          </p>
        </div>
        {viewMode === 'list' && !activeSession && (
          <div className="flex items-center gap-3">
            {/* AI Analysis Button */}
            <div className="relative">
              <button
                onClick={() => setShowAnalysisDropdown(!showAnalysisDropdown)}
                disabled={isAnalyzing || completedSessions.length < 2}
                className="flex items-center gap-2 px-4 py-3 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #C5B4E3 0%, #8A6FC4 100%)', boxShadow: '0 8px 20px -8px rgba(138,111,196,0.35)' }}
                title={completedSessions.length < 2 ? 'Need at least 2 completed sessions' : 'AI Analysis'}
              >
                {isAnalyzing ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                )}
                AI Analysis
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showAnalysisDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    onClick={() => handleAnalyzeSessions(10)}
                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    Last 10 days
                  </button>
                  <button
                    onClick={() => handleAnalyzeSessions(30)}
                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    Last 30 days
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => setViewMode('create')}
              className="flex items-center gap-2 px-6 py-3 text-white rounded-xl font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #4EC7B8 0%, #7ED6A7 100%)', boxShadow: '0 8px 24px -8px rgba(78,199,184,0.5)' }}
            >
              <ICONS.Plus className="w-5 h-5" />
              New Session
            </button>
          </div>
        )}
      </header>

      {/* Subscription Limit Banner */}
      {limitError && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-amber-700 dark:text-amber-400 text-lg">Plan Limit Reached</h3>
              <p className="text-amber-600 dark:text-amber-500 mt-1">{limitError.message}</p>
              <div className="flex items-center gap-3 mt-4">
                <Link
                  to="/pricing"
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-sm hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/20"
                >
                  Upgrade Plan
                </Link>
                <button
                  onClick={() => setLimitError(null)}
                  className="px-4 py-2.5 text-amber-600 dark:text-amber-400 font-medium text-sm hover:bg-amber-500/10 rounded-xl transition-all"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-7">
          {/* Trust chip + overview summary bar + quick actions */}
          {!activeSession && completedSessions.length > 0 && (() => {
            const last = completedSessions[0];
            const lastDurMin = last.startedAt && last.endedAt
              ? Math.max(0, Math.round((new Date(last.endedAt).getTime() - new Date(last.startedAt).getTime()) / 60000))
              : null;
            const lastDur = lastDurMin !== null
              ? `${Math.floor(lastDurMin / 60)}h ${lastDurMin % 60}m`
              : '—';
            const lastUf = last.actualUfMl ? displayFluid(last.actualUfMl) : '—';
            const lastWhen = displayShortDate(last.startedAt);
            return (
              <>
                {/* Section header */}
                <SectionBand label="Overview" sub="Your last session & next steps" />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Last session tile */}
                  <div className="rounded-2xl p-5" style={{ backgroundColor: '#D8E7F8', border: '1px solid rgba(92,143,209,0.22)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span>🩺</span>
                      <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#5C8FD1' }}>Last session</span>
                    </div>
                    <div className="text-2xl font-bold tabular-nums" style={{ color: '#1F2D2A' }}>{lastDur}</div>
                    <div className="text-xs mt-1" style={{ color: '#4A4F5C' }}>UF removed · <span className="font-semibold">{lastUf}</span></div>
                    <div className="text-[11px] mt-0.5" style={{ color: '#7B7A74' }}>{lastWhen}</div>
                  </div>
                  {/* This week tile */}
                  <div className="rounded-2xl p-5" style={{ backgroundColor: '#D6EFDD', border: '1px solid rgba(79,168,114,0.22)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span>📅</span>
                      <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#4FA872' }}>This week</span>
                    </div>
                    <div className="text-2xl font-bold tabular-nums" style={{ color: '#1F2D2A' }}>
                      {completedSessions.filter(s => {
                        const d = new Date(s.startedAt);
                        const now = new Date();
                        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
                        return d >= weekStart;
                      }).length} sessions
                    </div>
                    <div className="text-xs mt-1" style={{ color: '#4A4F5C' }}>Target 3/wk · keep going</div>
                  </div>
                  {/* Quick actions tile */}
                  <div className="rounded-2xl p-5" style={{ backgroundColor: '#FFE2D6', border: '1px solid rgba(232,117,86,0.22)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <span>⚡</span>
                      <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#E87556' }}>Quick actions</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link to="/weight" className="px-3 py-1.5 rounded-full text-xs font-bold bg-white hover:-translate-y-0.5 transition-all" style={{ color: '#1F2D2A', border: '1px solid rgba(232,117,86,0.25)' }}>⚖️ Add Weight</Link>
                      <Link to="/fluid" className="px-3 py-1.5 rounded-full text-xs font-bold bg-white hover:-translate-y-0.5 transition-all" style={{ color: '#1F2D2A', border: '1px solid rgba(232,117,86,0.25)' }}>💧 Add Fluid</Link>
                    </div>
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium" style={{ backgroundColor: '#EDE9E1', color: '#4A4F5C', border: '1px solid #E6E1D7' }}>
                  🔒 Secure & private health data
                </div>
              </>
            );
          })()}

          {/* Active Session Alert */}
          {activeSession && (
            <div
              onClick={() => setViewMode('active')}
              className="text-white rounded-2xl p-6 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #4EC7B8 0%, #7ED6A7 100%)', boxShadow: '0 10px 28px -10px rgba(78,199,184,0.55)' }}
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
            <>
              <SectionBand label="Trends" sub="Weight & fluid patterns over time" />
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
                      <div className="w-3 h-3 rounded-full bg-[#4EC7B8]" />
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
                        tickFormatter={(v) => `${v}${weightUnit}`}
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
                        formatter={(value: number) => [`${value.toFixed(1)} ${weightUnit}`, '']}
                      />
                      {dryWeight && (
                        <ReferenceLine
                          y={convertWeightFromKg(dryWeight)}
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
                        tickFormatter={(v) => fluidUnit === 'oz' ? `${v.toFixed(0)}oz` : `${(v / 1000).toFixed(1)}L`}
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
                        formatter={(value: number) => [fluidUnit === 'oz' ? `${value.toFixed(1)} oz` : `${Math.round(value)} ml`, '']}
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
            </>
          )}

          {/* Sessions List */}
          <SectionBand label="Sessions" sub="Your recent history" />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#1F2D2A]">Recent Sessions</h2>
              <span className="text-sm" style={{ color: '#7B7A74' }}>{completedSessions.length} completed</span>
            </div>

            {completedSessions.length > 0 ? (<>
              <div className="space-y-3">
                {completedSessions.map(session => {
                  // Derive a lightweight status: good / watch / attention
                  let statusTone: 'good' | 'watch' | 'attention' = 'good';
                  if (session.sessionRating === SessionRating.BAD) statusTone = 'attention';
                  else if (session.sessionRating === SessionRating.OK) statusTone = 'watch';
                  else if (session.actualUfMl && session.targetUfMl && session.actualUfMl < session.targetUfMl * 0.7) statusTone = 'watch';
                  const statusStyle = {
                    good: { bg: '#D6EFDD', fg: '#4FA872', icon: '✅', label: 'Good session' },
                    watch: { bg: '#FBEBC7', fg: '#C99638', icon: '⚠️', label: 'Watch' },
                    attention: { bg: '#FFE2D6', fg: '#E87556', icon: '🔴', label: 'Needs attention' },
                  }[statusTone];
                  return (
                  <div
                    key={session._id}
                    onClick={() => handleViewDetails(session)}
                    className="bg-white rounded-2xl p-5 border border-[#E6E1D7] cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#4EC7B8]/12 rounded-xl flex items-center justify-center">
                          <ICONS.Activity className="w-6 h-6 text-[#2F8F87]" />
                        </div>
                        <div>
                          <p className="font-bold text-[#1F2D2A]">
                            {session.type.toUpperCase()} - {session.mode}
                          </p>
                          <p className="text-sm" style={{ color: '#7B7A74' }}>
                            {displayFullDate(session.startedAt)} at {displayTime(session.startedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 sm:gap-6">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: '#7B7A74' }}>Duration</p>
                          <p className="font-extrabold text-base tabular-nums text-[#1F2D2A]">
                            {session.actualDurationMin ? formatDuration(session.actualDurationMin) : '--'}
                          </p>
                        </div>
                        <div className="text-right hidden sm:block">
                          <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: '#7B7A74' }}>UF Removed</p>
                          <p className="font-extrabold text-base tabular-nums" style={{ color: '#2F8F87' }}>
                            {session.actualUfMl ? displayFluid(session.actualUfMl) : '--'}
                          </p>
                        </div>
                        <span
                          className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
                          style={{ backgroundColor: statusStyle.bg, color: statusStyle.fg }}
                        >
                          <span>{statusStyle.icon}</span>
                          {statusStyle.label}
                        </span>
                        {session.sessionRating && (
                          <span className={`text-xl ${getRatingColor(session.sessionRating)}`}>
                            {session.sessionRating === SessionRating.GOOD ? '😊' : session.sessionRating === SessionRating.OK ? '😐' : '😞'}
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSessionToDelete(session);
                            setShowDeleteModal(true);
                          }}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                          title="Delete session"
                        >
                          <ICONS.Trash className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
              {sessions.length < totalSessions && (
                <div className="flex justify-center mt-4">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all disabled:opacity-50"
                  >
                    {isLoadingMore ? 'Loading...' : `Load More (${sessions.length} of ${totalSessions})`}
                  </button>
                </div>
              )}
            </>
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
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {isQuickLog ? 'Quick Log Session' : 'Start New Session'}
            </h2>
            <button onClick={() => { setViewMode('list'); resetForms(); }} className="text-slate-400 hover:text-slate-600">
              <ICONS.X className="w-6 h-6" />
            </button>
          </div>

          {/* Mode Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
            <button
              onClick={() => { setIsQuickLog(false); setFieldErrors({}); setTouchedFields({}); }}
              className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all ${
                !isQuickLog
                  ? 'bg-white dark:bg-slate-600 text-[#2F8F87] shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Start Timer
              </span>
            </button>
            <button
              onClick={() => { setIsQuickLog(true); setFieldErrors({}); setTouchedFields({}); }}
              className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all ${
                isQuickLog
                  ? 'bg-white dark:bg-slate-600 text-[#2F8F87] shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Quick Log
              </span>
            </button>
          </div>

          {isQuickLog && (
            <div className="bg-[#D6EFDD] border border-[#4FA872]/30 rounded-xl p-4">
              <p className="text-sm text-[#1F2D2A]">
                Log a completed session manually. Enter the date, duration, and details without using a timer.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Session Date (Quick Log only) */}
            {isQuickLog && (
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  Session Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={quickLogData.sessionDate}
                  onChange={e => {
                    setQuickLogData({ ...quickLogData, sessionDate: e.target.value });
                    if (touchedFields.sessionDate) {
                      setFieldErrors(prev => ({ ...prev, sessionDate: validateField('sessionDate', e.target.value) }));
                    }
                  }}
                  onBlur={e => handleFieldBlur('sessionDate', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className={`w-full rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none transition-colors ${
                    fieldErrors.sessionDate && touchedFields.sessionDate
                      ? 'bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-400 dark:border-rose-500'
                      : 'bg-slate-100 dark:bg-slate-700 border-2 border-transparent'
                  }`}
                />
                {fieldErrors.sessionDate && touchedFields.sessionDate && (
                  <p className="text-xs text-rose-500 mt-1">{fieldErrors.sessionDate}</p>
                )}
              </div>
            )}

            {/* Duration (Quick Log only) */}
            {isQuickLog && (
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  Duration <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      max="12"
                      value={quickLogData.durationHours}
                      onChange={e => {
                        const hours = parseInt(e.target.value) || 0;
                        setQuickLogData({ ...quickLogData, durationHours: hours });
                        if (touchedFields.quickLogDuration) {
                          const totalMin = (hours * 60) + quickLogData.durationMinutes;
                          setFieldErrors(prev => ({
                            ...prev,
                            quickLogDuration: totalMin < 30 ? 'Must be at least 30 min' : totalMin > 720 ? 'Cannot exceed 12 hours' : ''
                          }));
                        }
                      }}
                      onBlur={() => {
                        setTouchedFields(prev => ({ ...prev, quickLogDuration: true }));
                        const totalMin = (quickLogData.durationHours * 60) + quickLogData.durationMinutes;
                        setFieldErrors(prev => ({
                          ...prev,
                          quickLogDuration: totalMin < 30 ? 'Must be at least 30 min' : totalMin > 720 ? 'Cannot exceed 12 hours' : ''
                        }));
                      }}
                      className={`w-full rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none transition-colors ${
                        fieldErrors.quickLogDuration && touchedFields.quickLogDuration
                          ? 'bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-400 dark:border-rose-500'
                          : 'bg-slate-100 dark:bg-slate-700 border-2 border-transparent'
                      }`}
                    />
                    <span className="text-xs text-slate-400 mt-1 block text-center">Hours</span>
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={quickLogData.durationMinutes}
                      onChange={e => {
                        const minutes = parseInt(e.target.value) || 0;
                        setQuickLogData({ ...quickLogData, durationMinutes: minutes });
                        if (touchedFields.quickLogDuration) {
                          const totalMin = (quickLogData.durationHours * 60) + minutes;
                          setFieldErrors(prev => ({
                            ...prev,
                            quickLogDuration: totalMin < 30 ? 'Must be at least 30 min' : totalMin > 720 ? 'Cannot exceed 12 hours' : ''
                          }));
                        }
                      }}
                      onBlur={() => {
                        setTouchedFields(prev => ({ ...prev, quickLogDuration: true }));
                        const totalMin = (quickLogData.durationHours * 60) + quickLogData.durationMinutes;
                        setFieldErrors(prev => ({
                          ...prev,
                          quickLogDuration: totalMin < 30 ? 'Must be at least 30 min' : totalMin > 720 ? 'Cannot exceed 12 hours' : ''
                        }));
                      }}
                      className={`w-full rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none transition-colors ${
                        fieldErrors.quickLogDuration && touchedFields.quickLogDuration
                          ? 'bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-400 dark:border-rose-500'
                          : 'bg-slate-100 dark:bg-slate-700 border-2 border-transparent'
                      }`}
                    />
                    <span className="text-xs text-slate-400 mt-1 block text-center">Minutes</span>
                  </div>
                </div>
                {fieldErrors.quickLogDuration && touchedFields.quickLogDuration && (
                  <p className="text-xs text-rose-500 mt-1">{fieldErrors.quickLogDuration}</p>
                )}
              </div>
            )}

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

            {/* Planned Duration (Timer mode only) */}
            {!isQuickLog && (
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Planned Duration (min)</label>
                <input
                  type="number"
                  value={newSession.plannedDurationMin}
                  onChange={e => {
                    const val = parseInt(e.target.value) || 0;
                    setNewSession({ ...newSession, plannedDurationMin: val });
                    if (touchedFields.plannedDurationMin) {
                      setFieldErrors(prev => ({ ...prev, plannedDurationMin: validateField('plannedDurationMin', e.target.value) }));
                    }
                  }}
                  onBlur={e => handleFieldBlur('plannedDurationMin', e.target.value)}
                  className={`w-full rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none transition-colors ${
                    fieldErrors.plannedDurationMin && touchedFields.plannedDurationMin
                      ? 'bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-400 dark:border-rose-500'
                      : 'bg-slate-100 dark:bg-slate-700 border-2 border-transparent'
                  }`}
                />
                {fieldErrors.plannedDurationMin && touchedFields.plannedDurationMin && (
                  <p className="text-xs text-rose-500 mt-1">{fieldErrors.plannedDurationMin}</p>
                )}
              </div>
            )}

            {/* Pre Weight */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                Pre-Weight ({weightUnit}) {!isQuickLog && <span className="text-rose-500">*</span>}
              </label>
              <input
                type="number"
                step="0.1"
                value={preData.preWeightKg}
                onChange={e => handleFieldChange('preWeightKg', e.target.value, val => setPreData({ ...preData, preWeightKg: val }))}
                onBlur={e => handleFieldBlur('preWeightKg', e.target.value)}
                placeholder={weightUnit === 'lb' ? 'e.g. 168.5' : 'e.g. 76.5'}
                required={!isQuickLog}
                className={`w-full rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none transition-colors ${
                  fieldErrors.preWeightKg && touchedFields.preWeightKg
                    ? 'bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-400 dark:border-rose-500'
                    : 'bg-slate-100 dark:bg-slate-700 border-2 border-transparent'
                }`}
              />
              {fieldErrors.preWeightKg && touchedFields.preWeightKg && (
                <p className="text-xs text-rose-500 mt-1">{fieldErrors.preWeightKg}</p>
              )}
            </div>

            {/* Target UF */}
            <div>
              <label className="text-xs font-bold text-sky-500 uppercase tracking-wider mb-2 block">Target UF ({fluidUnit})</label>
              <input
                type="number"
                value={preData.targetUfMl}
                onChange={e => handleFieldChange('targetUfMl', e.target.value, val => setPreData({ ...preData, targetUfMl: val }))}
                onBlur={e => handleFieldBlur('targetUfMl', e.target.value)}
                placeholder={fluidUnit === 'oz' ? 'e.g. 84' : 'e.g. 2500'}
                className={`w-full rounded-xl px-4 py-3 font-semibold outline-none transition-colors ${
                  fieldErrors.targetUfMl && touchedFields.targetUfMl
                    ? 'bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-400 dark:border-rose-500 text-rose-600 dark:text-rose-400'
                    : 'bg-sky-50 dark:bg-sky-500/10 border-2 border-sky-100 dark:border-sky-500/20 text-sky-600 dark:text-sky-400'
                }`}
              />
              {fieldErrors.targetUfMl && touchedFields.targetUfMl && (
                <p className="text-xs text-rose-500 mt-1">{fieldErrors.targetUfMl}</p>
              )}
            </div>

            {/* Blood Pressure */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Pre Blood Pressure (mmHg)</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="number"
                    value={preData.preBpSystolic}
                    onChange={e => handleFieldChange('preBpSystolic', e.target.value, val => setPreData({ ...preData, preBpSystolic: val }))}
                    onBlur={e => handleFieldBlur('preBpSystolic', e.target.value)}
                    placeholder="Systolic"
                    className={`w-full rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none transition-colors ${
                      (fieldErrors.preBpSystolic || fieldErrors.preBpPair) && touchedFields.preBpSystolic
                        ? 'bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-400 dark:border-rose-500'
                        : 'bg-slate-100 dark:bg-slate-700 border-2 border-transparent'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    value={preData.preBpDiastolic}
                    onChange={e => handleFieldChange('preBpDiastolic', e.target.value, val => setPreData({ ...preData, preBpDiastolic: val }))}
                    onBlur={e => handleFieldBlur('preBpDiastolic', e.target.value)}
                    placeholder="Diastolic"
                    className={`w-full rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none transition-colors ${
                      (fieldErrors.preBpDiastolic || fieldErrors.preBpPair) && touchedFields.preBpDiastolic
                        ? 'bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-400 dark:border-rose-500'
                        : 'bg-slate-100 dark:bg-slate-700 border-2 border-transparent'
                    }`}
                  />
                </div>
              </div>
              {((fieldErrors.preBpSystolic && touchedFields.preBpSystolic) ||
                (fieldErrors.preBpDiastolic && touchedFields.preBpDiastolic) ||
                (fieldErrors.preBpPair && (touchedFields.preBpSystolic || touchedFields.preBpDiastolic))) && (
                <p className="text-xs text-rose-500 mt-1">
                  {fieldErrors.preBpSystolic || fieldErrors.preBpDiastolic || fieldErrors.preBpPair}
                </p>
              )}
            </div>

            {/* Heart Rate */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Pre Heart Rate (bpm)</label>
              <input
                type="number"
                value={preData.preHeartRate}
                onChange={e => handleFieldChange('preHeartRate', e.target.value, val => setPreData({ ...preData, preHeartRate: val }))}
                onBlur={e => handleFieldBlur('preHeartRate', e.target.value)}
                placeholder="e.g. 72"
                className={`w-full rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none transition-colors ${
                  fieldErrors.preHeartRate && touchedFields.preHeartRate
                    ? 'bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-400 dark:border-rose-500'
                    : 'bg-slate-100 dark:bg-slate-700 border-2 border-transparent'
                }`}
              />
              {fieldErrors.preHeartRate && touchedFields.preHeartRate && (
                <p className="text-xs text-rose-500 mt-1">{fieldErrors.preHeartRate}</p>
              )}
            </div>

            {/* PD Settings (conditional) */}
            {isPDType(newSession.type) && (
              <>
                <div className="md:col-span-2 pt-4 border-t border-slate-200 dark:border-slate-600">
                  <h3 className="text-sm font-bold text-indigo-500 uppercase tracking-wider">PD Settings</h3>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Solution Type</label>
                  <select
                    value={newSession.pdSolutionType}
                    onChange={e => setNewSession({ ...newSession, pdSolutionType: e.target.value as PDSolutionType })}
                    className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none"
                  >
                    <option value="">Select...</option>
                    <option value={PDSolutionType.DEXTROSE_1_5}>Dextrose 1.5%</option>
                    <option value={PDSolutionType.DEXTROSE_2_5}>Dextrose 2.5%</option>
                    <option value={PDSolutionType.DEXTROSE_4_25}>Dextrose 4.25%</option>
                    <option value={PDSolutionType.ICODEXTRIN}>Icodextrin</option>
                    <option value={PDSolutionType.AMINO_ACID}>Amino Acid</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Exchange Volume (mL)</label>
                  <input type="number" value={newSession.pdExchangeVolumeMl} onChange={e => setNewSession({ ...newSession, pdExchangeVolumeMl: e.target.value })} placeholder="e.g. 2000" className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Dwell Time (min)</label>
                  <input type="number" value={newSession.pdDwellTimeMin} onChange={e => setNewSession({ ...newSession, pdDwellTimeMin: e.target.value })} placeholder="e.g. 240" className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Number of Exchanges</label>
                  <input type="number" value={newSession.pdNumberOfExchanges} onChange={e => setNewSession({ ...newSession, pdNumberOfExchanges: e.target.value })} placeholder="e.g. 4" className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none" />
                </div>
                {newSession.type === DialysisType.PD_APD && (
                  <>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Cycler Total Volume (mL)</label>
                      <input type="number" value={newSession.pdCyclerTotalVolumeMl} onChange={e => setNewSession({ ...newSession, pdCyclerTotalVolumeMl: e.target.value })} placeholder="e.g. 10000" className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Cycler Cycles</label>
                      <input type="number" value={newSession.pdCyclerNumberOfCycles} onChange={e => setNewSession({ ...newSession, pdCyclerNumberOfCycles: e.target.value })} placeholder="e.g. 5" className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Last Fill Volume (mL)</label>
                      <input type="number" value={newSession.pdCyclerLastFillMl} onChange={e => setNewSession({ ...newSession, pdCyclerLastFillMl: e.target.value })} placeholder="e.g. 1500" className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none" />
                    </div>
                  </>
                )}
              </>
            )}

            {/* Pre-Dialysis BUN */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Pre-Dialysis BUN (mg/dL)</label>
              <input type="number" value={newSession.preDialysisBUN} onChange={e => setNewSession({ ...newSession, preDialysisBUN: e.target.value })} placeholder="e.g. 60" className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none" />
            </div>

            {/* Post-session fields (Quick Log only) */}
            {isQuickLog && (
              <>
                <div className="md:col-span-2 pt-4 border-t border-slate-200 dark:border-slate-600">
                  <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Post-Session Data</h3>
                </div>

                {/* Post Weight */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Post-Weight ({weightUnit})</label>
                  <input
                    type="number"
                    step="0.1"
                    value={postData.postWeightKg}
                    onChange={e => handleFieldChange('postWeightKg', e.target.value, val => setPostData({ ...postData, postWeightKg: val }))}
                    onBlur={e => handleFieldBlur('postWeightKg', e.target.value)}
                    placeholder={weightUnit === 'lb' ? 'e.g. 164.0' : 'e.g. 74.5'}
                    className={`w-full rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none transition-colors ${
                      fieldErrors.postWeightKg && touchedFields.postWeightKg
                        ? 'bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-400 dark:border-rose-500'
                        : 'bg-slate-100 dark:bg-slate-700 border-2 border-transparent'
                    }`}
                  />
                  {fieldErrors.postWeightKg && touchedFields.postWeightKg && (
                    <p className="text-xs text-rose-500 mt-1">{fieldErrors.postWeightKg}</p>
                  )}
                </div>

                {/* Actual UF */}
                <div>
                  <label className="text-xs font-bold text-sky-500 uppercase tracking-wider mb-2 block">Actual UF Removed ({fluidUnit})</label>
                  <input
                    type="number"
                    value={postData.actualUfMl}
                    onChange={e => handleFieldChange('actualUfMl', e.target.value, val => setPostData({ ...postData, actualUfMl: val }))}
                    onBlur={e => handleFieldBlur('actualUfMl', e.target.value)}
                    placeholder={fluidUnit === 'oz' ? 'e.g. 84' : 'e.g. 2500'}
                    className={`w-full rounded-xl px-4 py-3 font-semibold outline-none transition-colors ${
                      fieldErrors.actualUfMl && touchedFields.actualUfMl
                        ? 'bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-400 dark:border-rose-500 text-rose-600 dark:text-rose-400'
                        : 'bg-sky-50 dark:bg-sky-500/10 border-2 border-sky-100 dark:border-sky-500/20 text-sky-600 dark:text-sky-400'
                    }`}
                  />
                  {fieldErrors.actualUfMl && touchedFields.actualUfMl && (
                    <p className="text-xs text-rose-500 mt-1">{fieldErrors.actualUfMl}</p>
                  )}
                </div>

                {/* Post Blood Pressure */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Post Blood Pressure (mmHg)</label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="number"
                        value={postData.postBpSystolic}
                        onChange={e => handleFieldChange('postBpSystolic', e.target.value, val => setPostData({ ...postData, postBpSystolic: val }))}
                        onBlur={e => handleFieldBlur('postBpSystolic', e.target.value)}
                        placeholder="Systolic"
                        className={`w-full rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none transition-colors ${
                          (fieldErrors.postBpSystolic || fieldErrors.postBpPair) && touchedFields.postBpSystolic
                            ? 'bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-400 dark:border-rose-500'
                            : 'bg-slate-100 dark:bg-slate-700 border-2 border-transparent'
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="number"
                        value={postData.postBpDiastolic}
                        onChange={e => handleFieldChange('postBpDiastolic', e.target.value, val => setPostData({ ...postData, postBpDiastolic: val }))}
                        onBlur={e => handleFieldBlur('postBpDiastolic', e.target.value)}
                        placeholder="Diastolic"
                        className={`w-full rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none transition-colors ${
                          (fieldErrors.postBpDiastolic || fieldErrors.postBpPair) && touchedFields.postBpDiastolic
                            ? 'bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-400 dark:border-rose-500'
                            : 'bg-slate-100 dark:bg-slate-700 border-2 border-transparent'
                        }`}
                      />
                    </div>
                  </div>
                  {((fieldErrors.postBpSystolic && touchedFields.postBpSystolic) ||
                    (fieldErrors.postBpDiastolic && touchedFields.postBpDiastolic) ||
                    (fieldErrors.postBpPair && (touchedFields.postBpSystolic || touchedFields.postBpDiastolic))) && (
                    <p className="text-xs text-rose-500 mt-1">
                      {fieldErrors.postBpSystolic || fieldErrors.postBpDiastolic || fieldErrors.postBpPair}
                    </p>
                  )}
                </div>

                {/* Post Heart Rate */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Post Heart Rate (bpm)</label>
                  <input
                    type="number"
                    value={postData.postHeartRate}
                    onChange={e => handleFieldChange('postHeartRate', e.target.value, val => setPostData({ ...postData, postHeartRate: val }))}
                    onBlur={e => handleFieldBlur('postHeartRate', e.target.value)}
                    placeholder="e.g. 70"
                    className={`w-full rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none transition-colors ${
                      fieldErrors.postHeartRate && touchedFields.postHeartRate
                        ? 'bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-400 dark:border-rose-500'
                        : 'bg-slate-100 dark:bg-slate-700 border-2 border-transparent'
                    }`}
                  />
                  {fieldErrors.postHeartRate && touchedFields.postHeartRate && (
                    <p className="text-xs text-rose-500 mt-1">{fieldErrors.postHeartRate}</p>
                  )}
                </div>

                {/* Session Rating */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">How did it go?</label>
                  <div className="flex gap-2">
                    {[
                      { value: SessionRating.GOOD, label: 'Good', emoji: '😊', color: 'emerald' },
                      { value: SessionRating.OK, label: 'OK', emoji: '😐', color: 'amber' },
                      { value: SessionRating.BAD, label: 'Bad', emoji: '😟', color: 'rose' },
                    ].map(rating => (
                      <button
                        key={rating.value}
                        type="button"
                        onClick={() => setPostData({ ...postData, sessionRating: rating.value })}
                        className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                          postData.sessionRating === rating.value
                            ? `bg-${rating.color}-500 text-white`
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}
                      >
                        <span className="text-lg mr-1">{rating.emoji}</span> {rating.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* PD End Fields (Quick Log) */}
                {isPDType(newSession.type) && (
                  <>
                    <div className="md:col-span-2 pt-4 border-t border-slate-200 dark:border-slate-600">
                      <h3 className="text-sm font-bold text-indigo-500 uppercase tracking-wider">PD Results</h3>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Drain Volume (mL)</label>
                      <input type="number" value={postData.pdDrainVolumeMl} onChange={e => setPostData({ ...postData, pdDrainVolumeMl: e.target.value })} placeholder="e.g. 2200" className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">PD Ultrafiltration (mL)</label>
                      <input type="number" value={postData.pdUltrafiltrationMl} onChange={e => setPostData({ ...postData, pdUltrafiltrationMl: e.target.value })} placeholder="e.g. 200" className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Effluent Appearance</label>
                      <select value={postData.pdEffluentAppearance} onChange={e => setPostData({ ...postData, pdEffluentAppearance: e.target.value as PDEffluentAppearance })} className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none">
                        <option value="">Select...</option>
                        <option value={PDEffluentAppearance.CLEAR}>Clear</option>
                        <option value={PDEffluentAppearance.SLIGHTLY_CLOUDY}>Slightly Cloudy</option>
                        <option value={PDEffluentAppearance.CLOUDY}>Cloudy</option>
                        <option value={PDEffluentAppearance.BLOODY}>Bloody</option>
                        <option value={PDEffluentAppearance.FIBRIN}>Fibrin</option>
                      </select>
                    </div>
                  </>
                )}

                {/* BUN (Quick Log) */}
                <div className="md:col-span-2 pt-4 border-t border-slate-200 dark:border-slate-600">
                  <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dialysis Adequacy (Optional)</h3>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Pre-Dialysis BUN (mg/dL)</label>
                  <input type="number" value={postData.preDialysisBUN} onChange={e => setPostData({ ...postData, preDialysisBUN: e.target.value })} placeholder="e.g. 60" className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Post-Dialysis BUN (mg/dL)</label>
                  <input type="number" value={postData.postDialysisBUN} onChange={e => setPostData({ ...postData, postDialysisBUN: e.target.value })} placeholder="e.g. 20" className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none" />
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Notes</label>
                  <textarea
                    value={postData.notes}
                    onChange={e => setPostData({ ...postData, notes: e.target.value })}
                    placeholder="Any notes about the session..."
                    rows={2}
                    className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none resize-none"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={() => { setViewMode('list'); resetForms(); }}
              className="flex-1 py-4 text-slate-400 font-bold hover:text-slate-600 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={isQuickLog ? handleQuickLogSession : handleCreateSession}
              disabled={isSubmitting || hasFieldErrors}
              className={`flex-[2] py-4 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                hasFieldErrors ? 'bg-slate-400 cursor-not-allowed' : 'hover:-translate-y-0.5 hover:shadow-lg'
              }`}
              style={hasFieldErrors ? undefined : { background: 'linear-gradient(135deg, #4EC7B8 0%, #7ED6A7 100%)', boxShadow: '0 8px 24px -8px rgba(78,199,184,0.5)' }}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isQuickLog ? (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Log Session
                    </>
                  ) : (
                    <>
                      <ICONS.Activity className="w-5 h-5" />
                      Start Session
                    </>
                  )}
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

            <button
              onClick={handlePauseResume}
              className={`mx-auto mb-4 px-5 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
                isPaused
                  ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                {isPaused ? (
                  <path d="M8 5v14l11-7z" />
                ) : (
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                )}
              </svg>
              {isPaused ? 'Resume' : 'Pause'}
            </button>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white/5 rounded-2xl p-4">
                <p className="text-white/40 text-xs uppercase">Target UF</p>
                <p className="text-2xl font-bold">{activeSession.targetUfMl ? displayFluid(activeSession.targetUfMl) : '--'}</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-4">
                <p className="text-white/40 text-xs uppercase">Pre Weight</p>
                <p className="text-2xl font-bold">{activeSession.preWeightKg ? displayWeight(activeSession.preWeightKg) : '--'}</p>
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
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="px-6 py-4 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all text-sm"
              >
                Cancel
              </button>
            </div>

            {/* Cancel Confirmation Modal */}
            {showCancelConfirm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCancelConfirm(false)}>
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Cancel Session?</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">This will cancel the current session. Session data logged so far will be preserved.</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                    >
                      Keep Going
                    </button>
                    <button
                      onClick={handleCancelSession}
                      disabled={isCancelling}
                      className="flex-1 px-4 py-2.5 bg-rose-500 text-white rounded-xl font-semibold hover:bg-rose-600 transition-all disabled:opacity-50"
                    >
                      {isCancelling ? 'Cancelling...' : 'Cancel Session'}
                    </button>
                  </div>
                </div>
              </div>
            )}
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
                  <label className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-2 block">Blood Pressure (mmHg)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={vitalsData.bpSystolic}
                      onChange={e => handleFieldChange('vitalsBpSystolic', e.target.value, val => setVitalsData({ ...vitalsData, bpSystolic: val }))}
                      onBlur={e => {
                        handleFieldBlur('vitalsBpSystolic', e.target.value);
                        if (vitalsData.bpDiastolic) {
                          const bpError = validateBpPair(e.target.value, vitalsData.bpDiastolic);
                          setFieldErrors(prev => ({ ...prev, vitalsBpPair: bpError }));
                        }
                      }}
                      placeholder="Systolic"
                      className={`w-full rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white outline-none text-sm transition-colors ${
                        (fieldErrors.vitalsBpSystolic || fieldErrors.vitalsBpPair) && touchedFields.vitalsBpSystolic
                          ? 'bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-400 dark:border-rose-500'
                          : 'bg-slate-100 dark:bg-slate-700 border-2 border-transparent'
                      }`}
                    />
                    <span className="text-slate-400 self-center">/</span>
                    <input
                      type="number"
                      value={vitalsData.bpDiastolic}
                      onChange={e => handleFieldChange('vitalsBpDiastolic', e.target.value, val => setVitalsData({ ...vitalsData, bpDiastolic: val }))}
                      onBlur={e => {
                        handleFieldBlur('vitalsBpDiastolic', e.target.value);
                        if (vitalsData.bpSystolic) {
                          const bpError = validateBpPair(vitalsData.bpSystolic, e.target.value);
                          setFieldErrors(prev => ({ ...prev, vitalsBpPair: bpError }));
                        }
                      }}
                      placeholder="Diastolic"
                      className={`w-full rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white outline-none text-sm transition-colors ${
                        (fieldErrors.vitalsBpDiastolic || fieldErrors.vitalsBpPair) && touchedFields.vitalsBpDiastolic
                          ? 'bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-400 dark:border-rose-500'
                          : 'bg-slate-100 dark:bg-slate-700 border-2 border-transparent'
                      }`}
                    />
                  </div>
                  {((fieldErrors.vitalsBpSystolic && touchedFields.vitalsBpSystolic) ||
                    (fieldErrors.vitalsBpDiastolic && touchedFields.vitalsBpDiastolic) ||
                    (fieldErrors.vitalsBpPair && (touchedFields.vitalsBpSystolic || touchedFields.vitalsBpDiastolic))) && (
                    <p className="text-xs text-rose-500 mt-1">
                      {fieldErrors.vitalsBpSystolic || fieldErrors.vitalsBpDiastolic || fieldErrors.vitalsBpPair}
                    </p>
                  )}
                </div>

                {/* Heart Rate */}
                <div>
                  <label className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-2 block">Heart Rate</label>
                  <input
                    type="number"
                    value={vitalsData.heartRate}
                    onChange={e => handleFieldChange('vitalsHeartRate', e.target.value, val => setVitalsData({ ...vitalsData, heartRate: val }))}
                    onBlur={e => handleFieldBlur('vitalsHeartRate', e.target.value)}
                    placeholder="bpm"
                    className={`w-full rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white outline-none text-sm transition-colors ${
                      fieldErrors.vitalsHeartRate && touchedFields.vitalsHeartRate
                        ? 'bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-400 dark:border-rose-500'
                        : 'bg-slate-100 dark:bg-slate-700 border-2 border-transparent'
                    }`}
                  />
                  {fieldErrors.vitalsHeartRate && touchedFields.vitalsHeartRate && (
                    <p className="text-xs text-rose-500 mt-1">{fieldErrors.vitalsHeartRate}</p>
                  )}
                </div>

                {/* SpO2 */}
                <div>
                  <label className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2 block">SpO2</label>
                  <input
                    type="number"
                    value={vitalsData.spo2}
                    onChange={e => handleFieldChange('vitalsSpo2', e.target.value, val => setVitalsData({ ...vitalsData, spo2: val }))}
                    onBlur={e => handleFieldBlur('vitalsSpo2', e.target.value)}
                    placeholder="%"
                    className={`w-full rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white outline-none text-sm transition-colors ${
                      fieldErrors.vitalsSpo2 && touchedFields.vitalsSpo2
                        ? 'bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-400 dark:border-rose-500'
                        : 'bg-slate-100 dark:bg-slate-700 border-2 border-transparent'
                    }`}
                  />
                  {fieldErrors.vitalsSpo2 && touchedFields.vitalsSpo2 && (
                    <p className="text-xs text-rose-500 mt-1">{fieldErrors.vitalsSpo2}</p>
                  )}
                </div>

                {/* Temperature */}
                <div>
                  <label className="text-xs font-bold text-[#2F8F87] uppercase tracking-wider mb-2 block">Temp (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={vitalsData.temperature}
                    onChange={e => handleFieldChange('vitalsTemperature', e.target.value, val => setVitalsData({ ...vitalsData, temperature: val }))}
                    onBlur={e => handleFieldBlur('vitalsTemperature', e.target.value)}
                    placeholder="°C"
                    className={`w-full rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white outline-none text-sm transition-colors ${
                      fieldErrors.vitalsTemperature && touchedFields.vitalsTemperature
                        ? 'bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-400 dark:border-rose-500'
                        : 'bg-slate-100 dark:bg-slate-700 border-2 border-transparent'
                    }`}
                  />
                  {fieldErrors.vitalsTemperature && touchedFields.vitalsTemperature && (
                    <p className="text-xs text-rose-500 mt-1">{fieldErrors.vitalsTemperature}</p>
                  )}
                </div>
              </div>

              <button
                onClick={handleLogVitals}
                disabled={isLoggingVitals || hasVitalsFieldErrors}
                className={`w-full py-3 text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-all ${
                  hasVitalsFieldErrors ? 'bg-slate-400 cursor-not-allowed' : 'bg-rose-500 hover:bg-rose-600'
                }`}
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
                          <span className="w-8 h-8 bg-[#4EC7B8]/12 rounded-lg flex items-center justify-center text-[#2F8F87] text-sm">🌡️</span>
                          <div>
                            <p className="text-xs text-slate-400">Temp</p>
                            <p className="font-bold text-slate-900 dark:text-white">{vital.temperature.value}°{vital.temperature.unit === 'celsius' ? 'C' : 'F'}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {displayTime(vital.loggedAt)}
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
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Post-Weight ({weightUnit})</label>
              <input
                type="number"
                step="0.1"
                value={postData.postWeightKg}
                onChange={e => handleFieldChange('postWeightKg', e.target.value, val => setPostData({ ...postData, postWeightKg: val }))}
                onBlur={e => handleFieldBlur('postWeightKg', e.target.value)}
                placeholder={weightUnit === 'lb' ? 'e.g. 164.0' : 'e.g. 74.5'}
                className={`w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none ${
                  fieldErrors.postWeightKg && touchedFields.postWeightKg ? 'ring-2 ring-rose-500' : ''
                }`}
              />
              {fieldErrors.postWeightKg && touchedFields.postWeightKg && (
                <p className="text-xs text-rose-500 mt-1">{fieldErrors.postWeightKg}</p>
              )}
            </div>

            {/* Actual UF */}
            <div>
              <label className="text-xs font-bold text-sky-500 uppercase tracking-wider mb-2 block">Actual UF Removed ({fluidUnit})</label>
              <input
                type="number"
                value={postData.actualUfMl}
                onChange={e => handleFieldChange('actualUfMl', e.target.value, val => setPostData({ ...postData, actualUfMl: val }))}
                onBlur={e => handleFieldBlur('actualUfMl', e.target.value)}
                placeholder={fluidUnit === 'oz' ? 'e.g. 81' : 'e.g. 2400'}
                className={`w-full bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 rounded-xl px-4 py-3 font-semibold text-sky-600 dark:text-sky-400 outline-none ${
                  fieldErrors.actualUfMl && touchedFields.actualUfMl ? 'ring-2 ring-rose-500' : ''
                }`}
              />
              {fieldErrors.actualUfMl && touchedFields.actualUfMl && (
                <p className="text-xs text-rose-500 mt-1">{fieldErrors.actualUfMl}</p>
              )}
            </div>

            {/* Post BP */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Post Blood Pressure</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={postData.postBpSystolic}
                  onChange={e => handleFieldChange('postBpSystolic', e.target.value, val => setPostData({ ...postData, postBpSystolic: val }))}
                  onBlur={e => handleFieldBlur('postBpSystolic', e.target.value)}
                  placeholder="Sys"
                  className={`w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none ${
                    fieldErrors.postBpSystolic && touchedFields.postBpSystolic ? 'ring-2 ring-rose-500' : ''
                  }`}
                />
                <input
                  type="number"
                  value={postData.postBpDiastolic}
                  onChange={e => handleFieldChange('postBpDiastolic', e.target.value, val => setPostData({ ...postData, postBpDiastolic: val }))}
                  onBlur={e => handleFieldBlur('postBpDiastolic', e.target.value)}
                  placeholder="Dia"
                  className={`w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none ${
                    fieldErrors.postBpDiastolic && touchedFields.postBpDiastolic ? 'ring-2 ring-rose-500' : ''
                  }`}
                />
              </div>
              {((fieldErrors.postBpSystolic && touchedFields.postBpSystolic) || (fieldErrors.postBpDiastolic && touchedFields.postBpDiastolic) || (fieldErrors.postBpPair && (touchedFields.postBpSystolic || touchedFields.postBpDiastolic))) && (
                <p className="text-xs text-rose-500 mt-1">{fieldErrors.postBpSystolic || fieldErrors.postBpDiastolic || fieldErrors.postBpPair}</p>
              )}
            </div>

            {/* Post Heart Rate */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Post Heart Rate (bpm)</label>
              <input
                type="number"
                value={postData.postHeartRate}
                onChange={e => handleFieldChange('postHeartRate', e.target.value, val => setPostData({ ...postData, postHeartRate: val }))}
                onBlur={e => handleFieldBlur('postHeartRate', e.target.value)}
                placeholder="e.g. 68"
                className={`w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none ${
                  fieldErrors.postHeartRate && touchedFields.postHeartRate ? 'ring-2 ring-rose-500' : ''
                }`}
              />
              {fieldErrors.postHeartRate && touchedFields.postHeartRate && (
                <p className="text-xs text-rose-500 mt-1">{fieldErrors.postHeartRate}</p>
              )}
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
                        ? 'bg-[#4EC7B8] shadow-lg scale-105'
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

            {/* PD End Fields */}
            {activeSession?.type && isPDType(activeSession.type) && (
              <>
                <div className="md:col-span-2 pt-4 border-t border-slate-200 dark:border-slate-600">
                  <h3 className="text-sm font-bold text-indigo-500 uppercase tracking-wider">PD Results</h3>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Drain Volume (mL)</label>
                  <input type="number" value={postData.pdDrainVolumeMl} onChange={e => setPostData({ ...postData, pdDrainVolumeMl: e.target.value })} placeholder="e.g. 2200" className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">PD Ultrafiltration (mL)</label>
                  <input type="number" value={postData.pdUltrafiltrationMl} onChange={e => setPostData({ ...postData, pdUltrafiltrationMl: e.target.value })} placeholder="e.g. 200" className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Effluent Appearance</label>
                  <select value={postData.pdEffluentAppearance} onChange={e => setPostData({ ...postData, pdEffluentAppearance: e.target.value as PDEffluentAppearance })} className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none">
                    <option value="">Select...</option>
                    <option value={PDEffluentAppearance.CLEAR}>Clear</option>
                    <option value={PDEffluentAppearance.SLIGHTLY_CLOUDY}>Slightly Cloudy</option>
                    <option value={PDEffluentAppearance.CLOUDY}>Cloudy</option>
                    <option value={PDEffluentAppearance.BLOODY}>Bloody</option>
                    <option value={PDEffluentAppearance.FIBRIN}>Fibrin</option>
                  </select>
                </div>
              </>
            )}

            {/* BUN / Adequacy */}
            <div className="md:col-span-2 pt-4 border-t border-slate-200 dark:border-slate-600">
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dialysis Adequacy (Optional)</h3>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Pre-Dialysis BUN (mg/dL)</label>
              <input type="number" value={postData.preDialysisBUN} onChange={e => setPostData({ ...postData, preDialysisBUN: e.target.value })} placeholder="e.g. 60" className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Post-Dialysis BUN (mg/dL)</label>
              <input type="number" value={postData.postDialysisBUN} onChange={e => setPostData({ ...postData, postDialysisBUN: e.target.value })} placeholder="e.g. 20" className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none" />
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
      {viewMode === 'detail' && selectedSession && (() => {
        // Clinical interpretation — derived from available data
        const bpPre = selectedSession.preBpSystolic;
        const bpPost = selectedSession.postBpSystolic;
        const bpDrop = (bpPre && bpPost) ? bpPre - bpPost : null;
        const wLoss = (selectedSession.preWeightKg && selectedSession.postWeightKg)
          ? selectedSession.preWeightKg - selectedSession.postWeightKg : null;
        const wLossPct = (wLoss !== null && selectedSession.preWeightKg)
          ? (wLoss / selectedSession.preWeightKg) * 100 : null;
        const uf = selectedSession.actualUfMl ?? null;
        const ufTarget = selectedSession.targetUfMl ?? null;
        const ufPct = (uf && ufTarget) ? Math.round((uf / ufTarget) * 100) : null;

        const interpretation: { tone: 'good' | 'watch' | 'attention'; icon: string; text: string }[] = [];
        if (ufPct !== null) {
          if (ufPct >= 90 && ufPct <= 110) interpretation.push({ tone: 'good', icon: '✅', text: `UF achieved target (${ufPct}%)` });
          else if (ufPct < 90) interpretation.push({ tone: 'watch', icon: '⚠️', text: `UF below target (${ufPct}%) — monitor next session` });
          else interpretation.push({ tone: 'watch', icon: '⚠️', text: `UF over target (${ufPct}%) — watch for hypotension` });
        }
        if (bpDrop !== null) {
          if (bpDrop >= 30) interpretation.push({ tone: 'attention', icon: '🚨', text: `Significant BP drop (${bpDrop} mmHg) — flag with care team` });
          else if (bpDrop >= 20) interpretation.push({ tone: 'watch', icon: '⚠️', text: `Notable BP drop (${bpDrop} mmHg) — keep an eye` });
          else if (bpDrop >= 0) interpretation.push({ tone: 'good', icon: '✅', text: `BP change within expected range (${bpDrop} mmHg)` });
        }
        if (wLossPct !== null) {
          if (wLossPct >= 1.5 && wLossPct <= 3.5) interpretation.push({ tone: 'good', icon: '✅', text: `Weight reduction within expected range (${wLossPct.toFixed(1)}%)` });
          else if (wLossPct < 1.5) interpretation.push({ tone: 'watch', icon: '⚠️', text: `Weight reduction lower than expected (${wLossPct.toFixed(1)}%)` });
          else interpretation.push({ tone: 'watch', icon: '⚠️', text: `Weight reduction higher than expected (${wLossPct.toFixed(1)}%)` });
        }
        if (selectedSession.ktV != null) {
          if (selectedSession.ktV >= 1.2) interpretation.push({ tone: 'good', icon: '✅', text: `Dialysis adequacy within healthy range (Kt/V ${selectedSession.ktV.toFixed(2)})` });
          else interpretation.push({ tone: 'watch', icon: '⚠️', text: `Dialysis adequacy below target (Kt/V ${selectedSession.ktV.toFixed(2)})` });
        }

        const toneColor = (t: 'good' | 'watch' | 'attention') =>
          t === 'good' ? { bg: '#D6EFDD', fg: '#4FA872' } : t === 'watch' ? { bg: '#FBEBC7', fg: '#C99638' } : { bg: '#FFE2D6', fg: '#E87556' };

        return (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#E6E1D7] space-y-6 transition-shadow hover:shadow-md">
          {/* Breadcrumb + close */}
          <div className="flex items-center justify-between">
            <nav className="flex items-center gap-2 text-sm font-semibold" aria-label="Breadcrumb">
              <button
                onClick={() => { setViewMode('list'); setSelectedSession(null); setSelectedSessionVitals([]); }}
                className="transition-colors hover:underline"
                style={{ color: '#2F8F87' }}
              >
                ← Sessions
              </button>
              <span style={{ color: '#9B9A94' }}>/</span>
              <span style={{ color: '#1F2D2A' }}>{displayShortDate(selectedSession.startedAt)} session</span>
            </nav>
            <button onClick={() => { setViewMode('list'); setSelectedSession(null); setSelectedSessionVitals([]); }} className="text-[#7B7A74] hover:text-[#1F2D2A] transition-colors">
              <ICONS.X className="w-5 h-5" />
            </button>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#1F2D2A] tracking-tight">Session Details</h2>
            <p className="text-sm mt-1" style={{ color: '#7B7A74' }}>
              {displayFullDate(selectedSession.startedAt)} at {displayTime(selectedSession.startedAt)}
            </p>
            {/* Trust chips */}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium" style={{ backgroundColor: '#EDE9E1', color: '#4A4F5C', border: '1px solid #E6E1D7' }}>🔒 Data securely stored</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium" style={{ backgroundColor: '#EDE9E1', color: '#4A4F5C', border: '1px solid #E6E1D7' }}>🏥 Informational use only</span>
            </div>
          </div>

          {/* Clinical Interpretation */}
          {interpretation.length > 0 && (
            <div
              className="rounded-2xl p-5 transition-all"
              style={{ background: 'linear-gradient(135deg, #D8E7F8 0%, #E4DAF2 100%)', border: '1px solid rgba(92,143,209,0.22)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">🧠</span>
                <h3 className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: '#5C8FD1' }}>
                  Clinical interpretation
                </h3>
              </div>
              <ul className="space-y-2">
                {interpretation.map((item, i) => {
                  const c = toneColor(item.tone);
                  return (
                    <li key={i} className="flex items-start gap-3 px-3 py-2 rounded-xl" style={{ backgroundColor: c.bg }}>
                      <span className="text-sm shrink-0 mt-0.5">{item.icon}</span>
                      <span className="text-sm font-medium" style={{ color: '#1F2D2A' }}>{item.text}</span>
                    </li>
                  );
                })}
              </ul>
              <p className="text-[11px] mt-3" style={{ color: '#4A4F5C' }}>
                Based on the numbers from this session. Always confirm with your care team for clinical decisions.
              </p>
            </div>
          )}

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
              <p className="text-lg font-bold text-sky-600">{selectedSession.actualUfMl ? displayFluid(selectedSession.actualUfMl) : '--'}</p>
            </div>
            <div className="bg-[#D6EFDD] rounded-2xl p-4">
              <p className="text-[#2F8F87] text-xs uppercase">Weight Loss</p>
              <p className="text-lg font-bold text-[#2F8F87]">
                {selectedSession.preWeightKg && selectedSession.postWeightKg
                  ? displayWeight(selectedSession.preWeightKg - selectedSession.postWeightKg)
                  : '--'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-400 uppercase">Pre-Session</h3>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-slate-500">Weight</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedSession.preWeightKg ? displayWeight(selectedSession.preWeightKg) : '--'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E6E1D7]">
                  <span style={{ color: '#7B7A74' }}>Blood Pressure</span>
                  <span className="font-bold text-[#1F2D2A]">
                    {selectedSession.preBpSystolic && selectedSession.preBpDiastolic
                      ? `${selectedSession.preBpSystolic}/${selectedSession.preBpDiastolic}`
                      : '--'} mmHg
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E6E1D7]">
                  <span style={{ color: '#7B7A74' }}>Heart Rate</span>
                  <span className="font-bold text-[#1F2D2A]">{selectedSession.preHeartRate || '--'} bpm</span>
                </div>
                <div className="flex justify-between py-2">
                  <span style={{ color: '#7B7A74' }}>Target UF</span>
                  <span className="font-bold text-[#1F2D2A]">{selectedSession.targetUfMl ? displayFluid(selectedSession.targetUfMl) : '--'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-400 uppercase">Post-Session</h3>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-slate-500">Weight</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedSession.postWeightKg ? displayWeight(selectedSession.postWeightKg) : '--'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E6E1D7]">
                  <span style={{ color: '#7B7A74' }}>Blood Pressure</span>
                  <span className="font-bold flex items-center gap-1.5">
                    <span className="text-[#1F2D2A]">
                      {selectedSession.postBpSystolic && selectedSession.postBpDiastolic
                        ? `${selectedSession.postBpSystolic}/${selectedSession.postBpDiastolic}`
                        : '--'} mmHg
                    </span>
                    {bpDrop !== null && bpDrop >= 20 && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: bpDrop >= 30 ? '#FFE2D6' : '#FBEBC7',
                          color: bpDrop >= 30 ? '#E87556' : '#C99638',
                        }}
                        title={bpDrop >= 30 ? 'Significant drop detected' : 'Notable drop'}
                      >
                        ↓ {bpDrop}
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E6E1D7]">
                  <span style={{ color: '#7B7A74' }}>Heart Rate</span>
                  <span className="font-bold text-[#1F2D2A]">{selectedSession.postHeartRate || '--'} bpm</span>
                </div>
                <div className="flex justify-between py-2">
                  <span style={{ color: '#7B7A74' }}>Actual UF</span>
                  <span className="font-bold flex items-center gap-2">
                    <span className="text-[#1F2D2A]">{selectedSession.actualUfMl ? displayFluid(selectedSession.actualUfMl) : '--'}</span>
                    {ufPct !== null && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: ufPct >= 90 && ufPct <= 110 ? '#D6EFDD' : '#FBEBC7',
                          color: ufPct >= 90 && ufPct <= 110 ? '#4FA872' : '#C99638',
                        }}
                      >
                        {ufPct >= 90 && ufPct <= 110 ? `✓ Target achieved (${ufPct}%)` : `${ufPct}% of target`}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* PD Details */}
          {selectedSession.type && isPDType(selectedSession.type) && (selectedSession.pdExchangeVolumeMl || selectedSession.pdDrainVolumeMl || selectedSession.pdSolutionType) && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-indigo-500 uppercase">PD Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {selectedSession.pdSolutionType && (
                  <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl p-4">
                    <p className="text-indigo-500 text-xs uppercase">Solution</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedSession.pdSolutionType.replace(/_/g, ' ')}</p>
                  </div>
                )}
                {selectedSession.pdExchangeVolumeMl != null && (
                  <div className="bg-slate-50 dark:bg-slate-700 rounded-2xl p-4">
                    <p className="text-slate-400 text-xs uppercase">Exchange Vol</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedSession.pdExchangeVolumeMl} mL</p>
                  </div>
                )}
                {selectedSession.pdDwellTimeMin != null && (
                  <div className="bg-slate-50 dark:bg-slate-700 rounded-2xl p-4">
                    <p className="text-slate-400 text-xs uppercase">Dwell Time</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedSession.pdDwellTimeMin} min</p>
                  </div>
                )}
                {selectedSession.pdDrainVolumeMl != null && (
                  <div className="bg-slate-50 dark:bg-slate-700 rounded-2xl p-4">
                    <p className="text-slate-400 text-xs uppercase">Drain Vol</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedSession.pdDrainVolumeMl} mL</p>
                  </div>
                )}
                {selectedSession.pdUltrafiltrationMl != null && (
                  <div className="bg-sky-50 dark:bg-sky-500/10 rounded-2xl p-4">
                    <p className="text-sky-500 text-xs uppercase">PD UF</p>
                    <p className="text-lg font-bold text-sky-600">{selectedSession.pdUltrafiltrationMl} mL</p>
                  </div>
                )}
                {selectedSession.pdEffluentAppearance && (
                  <div className="bg-slate-50 dark:bg-slate-700 rounded-2xl p-4">
                    <p className="text-slate-400 text-xs uppercase">Effluent</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedSession.pdEffluentAppearance.replace(/_/g, ' ')}</p>
                  </div>
                )}
                {selectedSession.pdNumberOfExchanges != null && (
                  <div className="bg-slate-50 dark:bg-slate-700 rounded-2xl p-4">
                    <p className="text-slate-400 text-xs uppercase">Exchanges</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedSession.pdNumberOfExchanges}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Kt/V & Adequacy */}
          {(selectedSession.ktV != null || selectedSession.urr != null) && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-emerald-500 uppercase">Dialysis Adequacy</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {selectedSession.ktV != null && (() => {
                  const ok = selectedSession.ktV >= 1.2;
                  const borderline = selectedSession.ktV >= 1.0 && selectedSession.ktV < 1.2;
                  const tile = ok ? '#D6EFDD' : borderline ? '#FBEBC7' : '#FFE2D6';
                  const ink = ok ? '#4FA872' : borderline ? '#C99638' : '#E87556';
                  const label = ok ? '✅ Within healthy range' : borderline ? '⚠️ Borderline' : '🔴 Below target';
                  return (
                    <div className="rounded-2xl p-4" style={{ backgroundColor: tile, border: `1px solid ${ink}22` }}>
                      <p className="text-xs uppercase font-bold" style={{ color: ink }}>Kt/V</p>
                      <p className="text-2xl font-black" style={{ color: '#1F2D2A' }}>{selectedSession.ktV.toFixed(2)}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: '#7B7A74' }}>Target ≥ 1.2</p>
                      <p className="text-[11px] font-bold mt-1" style={{ color: ink }}>{label}</p>
                    </div>
                  );
                })()}
                {selectedSession.urr != null && (() => {
                  const ok = selectedSession.urr >= 65;
                  const borderline = selectedSession.urr >= 55 && selectedSession.urr < 65;
                  const tile = ok ? '#D6EFDD' : borderline ? '#FBEBC7' : '#FFE2D6';
                  const ink = ok ? '#4FA872' : borderline ? '#C99638' : '#E87556';
                  const label = ok ? '✅ Within healthy range' : borderline ? '⚠️ Borderline' : '🔴 Below target';
                  return (
                    <div className="rounded-2xl p-4" style={{ backgroundColor: tile, border: `1px solid ${ink}22` }}>
                      <p className="text-xs uppercase font-bold" style={{ color: ink }}>URR</p>
                      <p className="text-2xl font-black" style={{ color: '#1F2D2A' }}>{selectedSession.urr.toFixed(1)}%</p>
                      <p className="text-[10px] mt-0.5" style={{ color: '#7B7A74' }}>Target ≥ 65%</p>
                      <p className="text-[11px] font-bold mt-1" style={{ color: ink }}>{label}</p>
                    </div>
                  );
                })()}
                {selectedSession.preDialysisBUN != null && (
                  <div className="bg-slate-50 dark:bg-slate-700 rounded-2xl p-4">
                    <p className="text-slate-400 text-xs uppercase">Pre BUN</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedSession.preDialysisBUN} mg/dL</p>
                  </div>
                )}
                {selectedSession.postDialysisBUN != null && (
                  <div className="bg-slate-50 dark:bg-slate-700 rounded-2xl p-4">
                    <p className="text-slate-400 text-xs uppercase">Post BUN</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedSession.postDialysisBUN} mg/dL</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Session Vitals */}
          {(selectedSessionVitals.length > 0 || isLoadingSelectedVitals) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-400 uppercase">Session Vitals</h3>
                {isLoadingSelectedVitals ? (
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                ) : (
                  <span className="text-xs text-slate-400">{selectedSessionVitals.length} reading{selectedSessionVitals.length !== 1 ? 's' : ''}</span>
                )}
              </div>
              {selectedSessionVitals.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl overflow-hidden">
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-600">
                    {selectedSessionVitals.map((vital, index) => (
                      <div key={vital._id} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            Reading #{index + 1}
                          </span>
                          <span className="text-xs text-slate-400">
                            {displayTime(vital.loggedAt)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {vital.bloodPressure && (
                            <div className="flex items-center gap-2">
                              <span className="w-8 h-8 bg-rose-500/10 rounded-lg flex items-center justify-center text-sm">🫀</span>
                              <div>
                                <p className="text-[10px] text-slate-400 uppercase">BP</p>
                                <p className="font-bold text-slate-900 dark:text-white text-sm">
                                  {vital.bloodPressure.systolic}/{vital.bloodPressure.diastolic}
                                </p>
                              </div>
                            </div>
                          )}
                          {vital.heartRate && (
                            <div className="flex items-center gap-2">
                              <span className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center text-sm">💓</span>
                              <div>
                                <p className="text-[10px] text-slate-400 uppercase">HR</p>
                                <p className="font-bold text-slate-900 dark:text-white text-sm">{vital.heartRate} bpm</p>
                              </div>
                            </div>
                          )}
                          {vital.spo2 && (
                            <div className="flex items-center gap-2">
                              <span className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-sm">🩸</span>
                              <div>
                                <p className="text-[10px] text-slate-400 uppercase">SpO2</p>
                                <p className="font-bold text-slate-900 dark:text-white text-sm">{vital.spo2}%</p>
                              </div>
                            </div>
                          )}
                          {vital.temperature && (
                            <div className="flex items-center gap-2">
                              <span className="w-8 h-8 bg-[#4EC7B8]/12 rounded-lg flex items-center justify-center text-sm">🌡️</span>
                              <div>
                                <p className="text-[10px] text-slate-400 uppercase">Temp</p>
                                <p className="font-bold text-slate-900 dark:text-white text-sm">
                                  {vital.temperature.value}°{vital.temperature.unit === 'celsius' ? 'C' : 'F'}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

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
            <div className="rounded-2xl p-4" style={{ backgroundColor: '#EDE9E1', border: '1px solid #E6E1D7' }}>
              <p className="text-xs uppercase font-bold mb-2" style={{ color: '#2F8F87' }}>Patient notes / symptoms</p>
              <p style={{ color: '#1F2D2A' }}>{selectedSession.notes}</p>
              <p className="text-[11px] mt-2 italic" style={{ color: '#7B7A74' }}>
                e.g. dizziness, cramps, fatigue, low energy — useful context for your care team.
              </p>
            </div>
          )}

          {/* Next Steps guidance */}
          <div
            className="rounded-2xl p-5"
            style={{ background: 'linear-gradient(135deg, #D6EFDD 0%, #D8E7F8 100%)', border: '1px solid rgba(79,168,114,0.22)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">🎯</span>
              <h3 className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: '#2F8F87' }}>
                What should you do next?
              </h3>
            </div>
            <ul className="space-y-2">
              {(() => {
                const steps: { icon: string; text: string; to?: string }[] = [];
                if (bpDrop !== null && bpDrop >= 30) steps.push({ icon: '🩺', text: 'Continue monitoring blood pressure — log a reading in 30 minutes', to: '/vitals' });
                else steps.push({ icon: '🩺', text: 'Continue monitoring vitals through the day', to: '/vitals' });
                steps.push({ icon: '💧', text: 'Maintain fluid intake within your daily limit', to: '/fluid' });
                steps.push({ icon: '📅', text: 'Schedule or confirm your next session', to: '/appointments' });
                if (ufPct !== null && (ufPct < 90 || ufPct > 110)) steps.push({ icon: '📝', text: 'Add a quick note about anything unusual for your care team' });
                return steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-3 px-3 py-2 rounded-xl bg-white/70">
                    <span className="text-sm shrink-0 mt-0.5">{s.icon}</span>
                    {s.to ? (
                      <Link to={s.to} className="text-sm font-semibold hover:underline" style={{ color: '#2F8F87' }}>
                        {s.text}
                      </Link>
                    ) : (
                      <span className="text-sm font-medium" style={{ color: '#1F2D2A' }}>{s.text}</span>
                    )}
                  </li>
                ));
              })()}
            </ul>
          </div>

          <button
            onClick={() => { setViewMode('list'); setSelectedSession(null); setSelectedSessionVitals([]); }}
            className="w-full py-3.5 rounded-xl font-bold transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: '#EDE9E1', color: '#1F2D2A', border: '1px solid #E6E1D7' }}
          >
            ← Back to sessions
          </button>
        </div>
        );
      })()}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && sessionToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center">
                <ICONS.Trash className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Delete Session</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">This action cannot be undone</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl mb-6">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Are you sure you want to delete the <strong>{sessionToDelete.type.toUpperCase()}</strong> session from{' '}
                <strong>{displayFullDate(sessionToDelete.startedAt)}</strong>?
              </p>
              {sessionToDelete.actualDurationMin && (
                <p className="text-xs text-slate-400 mt-2">
                  Duration: {formatDuration(sessionToDelete.actualDurationMin)}
                  {sessionToDelete.actualUfMl && ` • UF: ${displayFluid(sessionToDelete.actualUfMl)}`}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSessionToDelete(null);
                }}
                disabled={isDeleting}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSession}
                disabled={isDeleting}
                className="flex-1 py-3 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <ICONS.Trash className="w-5 h-5" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Validation Error Modal */}
      {showValidationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Validation Error</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Please fix the following issues</p>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              {validationErrors.map((error, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl"
                >
                  <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setShowValidationModal(false);
                setValidationErrors([]);
              }}
              className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* AI Analysis Modal */}
      {showAnalysisModal && analysisData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-3xl w-full my-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-800 p-6 border-b border-slate-100 dark:border-slate-700 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-500 rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Session Analysis</h2>
                    <p className="text-sm text-slate-500">{analysisData.period} - {analysisData.statistics.totalSessions} sessions</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAnalysisModal(false)}
                  className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <ICONS.X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Overall Status */}
              <div className={`p-5 rounded-2xl ${
                analysisData.analysis.overallStatus === 'good' ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20' :
                analysisData.analysis.overallStatus === 'fair' ? 'bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20' :
                'bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    analysisData.analysis.overallStatus === 'good' ? 'bg-emerald-500 text-white' :
                    analysisData.analysis.overallStatus === 'fair' ? 'bg-amber-500 text-white' :
                    'bg-rose-500 text-white'
                  }`}>
                    {analysisData.analysis.overallStatus}
                  </span>
                  <span className="text-slate-500 text-sm">Overall Status</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300">{analysisData.analysis.summary}</p>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-[#2F8F87]">{analysisData.statistics.totalSessions}</p>
                  <p className="text-xs text-slate-500 mt-1">Sessions</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-sky-500">
                    {analysisData.statistics.avgDuration ? `${Math.floor(analysisData.statistics.avgDuration / 60)}h ${analysisData.statistics.avgDuration % 60}m` : '--'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Avg Duration</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-500">
                    {analysisData.statistics.avgWeightLoss ? displayWeight(analysisData.statistics.avgWeightLoss) : '--'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Avg Weight Loss</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-blue-500">
                    {analysisData.statistics.avgUfRemoved ? displayFluid(analysisData.statistics.avgUfRemoved) : '--'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Avg UF Removed</p>
                </div>
              </div>

              {/* Category Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Session Adherence */}
                <div className="bg-white dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${
                      analysisData.analysis.sessionAdherence.status === 'excellent' ? 'bg-emerald-500' :
                      analysisData.analysis.sessionAdherence.status === 'good' ? 'bg-sky-500' :
                      'bg-amber-500'
                    }`} />
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Session Adherence</h4>
                    <span className="text-xs text-slate-400 capitalize">({analysisData.analysis.sessionAdherence.status.replace('_', ' ')})</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{analysisData.analysis.sessionAdherence.insight}</p>
                </div>

                {/* Fluid Management */}
                <div className="bg-white dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${
                      analysisData.analysis.fluidManagement.status === 'well_controlled' ? 'bg-emerald-500' :
                      analysisData.analysis.fluidManagement.status === 'moderate' ? 'bg-amber-500' :
                      'bg-rose-500'
                    }`} />
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Fluid Management</h4>
                    <span className="text-xs text-slate-400 capitalize">({analysisData.analysis.fluidManagement.status.replace('_', ' ')})</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{analysisData.analysis.fluidManagement.insight}</p>
                </div>

                {/* Blood Pressure */}
                <div className="bg-white dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Blood Pressure</h4>
                    <span className="text-xs text-slate-400 capitalize">
                      (Pre: {analysisData.analysis.bloodPressure.preTrend}, Post: {analysisData.analysis.bloodPressure.postTrend.replace('_', ' ')})
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{analysisData.analysis.bloodPressure.insight}</p>
                </div>

                {/* Complications */}
                <div className="bg-white dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${
                      analysisData.analysis.complications.frequency === 'none' || analysisData.analysis.complications.frequency === 'rare' ? 'bg-emerald-500' :
                      analysisData.analysis.complications.frequency === 'occasional' ? 'bg-amber-500' :
                      'bg-rose-500'
                    }`} />
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Complications</h4>
                    <span className="text-xs text-slate-400 capitalize">({analysisData.analysis.complications.frequency})</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{analysisData.analysis.complications.insight}</p>
                </div>
              </div>

              {/* Positives */}
              {analysisData.analysis.positives && analysisData.analysis.positives.length > 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4">
                  <h4 className="font-bold text-emerald-700 dark:text-emerald-400 text-sm mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Positive Observations
                  </h4>
                  <ul className="space-y-2">
                    {analysisData.analysis.positives.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                        <span className="text-emerald-500 mt-1">+</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Areas to Discuss */}
              {analysisData.analysis.areasToDiscuss && analysisData.analysis.areasToDiscuss.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4">
                  <h4 className="font-bold text-amber-700 dark:text-amber-400 text-sm mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Topics to Discuss with Care Team
                  </h4>
                  <ul className="space-y-2">
                    {analysisData.analysis.areasToDiscuss.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300">
                        <span className="text-amber-500 mt-1">-</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              {analysisData.analysis.suggestions && analysisData.analysis.suggestions.length > 0 && (
                <div className="bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 rounded-xl p-4">
                  <h4 className="font-bold text-sky-700 dark:text-sky-400 text-sm mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Wellness Suggestions
                  </h4>
                  <ul className="space-y-2">
                    {analysisData.analysis.suggestions.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-sky-700 dark:text-sky-300">
                        <span className="text-sky-500 mt-1">-</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Disclaimer */}
              <div className="bg-slate-100 dark:bg-slate-700/50 rounded-xl p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  <strong>Disclaimer:</strong> {analysisData.disclaimer}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-slate-800 p-6 border-t border-slate-100 dark:border-slate-700 rounded-b-3xl">
              <button
                onClick={() => setShowAnalysisModal(false)}
                className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
              >
                Close Analysis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Quick Actions */}
      {viewMode === 'list' && !activeSession && (
        <div className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 z-40 flex flex-col items-end gap-3">
          {fabOpen && (
            <div className="flex flex-col items-end gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
              {[
                { onClick: () => { setFabOpen(false); setViewMode('create'); }, icon: '🩺', label: 'Log Session', tile: '#D8E7F8' },
                { to: '/weight', icon: '⚖️', label: 'Add Weight', tile: '#FFE2D6' },
                { to: '/fluid', icon: '💧', label: 'Add Fluid', tile: '#E4DAF2' },
              ].map((a: any) => {
                const inner = (
                  <span className="flex items-center gap-3 pl-4 pr-5 py-2.5 rounded-full shadow-lg transition-all" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E6E1D7' }}>
                    <span className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0" style={{ backgroundColor: a.tile }}>{a.icon}</span>
                    <span className="text-sm font-bold" style={{ color: '#1F2D2A' }}>{a.label}</span>
                  </span>
                );
                return a.to ? (
                  <Link key={a.label} to={a.to} onClick={() => setFabOpen(false)}>{inner}</Link>
                ) : (
                  <button key={a.label} type="button" onClick={a.onClick}>{inner}</button>
                );
              })}
            </div>
          )}
          <button
            type="button"
            onClick={() => setFabOpen((v) => !v)}
            aria-label={fabOpen ? 'Close quick actions' : 'Open quick actions'}
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all hover:-translate-y-0.5 hover:shadow-2xl active:scale-95"
            style={{ background: 'linear-gradient(135deg, #4EC7B8 0%, #7ED6A7 100%)', boxShadow: '0 12px 30px -8px rgba(47,143,135,0.55)', color: '#fff' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`transition-transform ${fabOpen ? 'rotate-45' : ''}`}>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

const SectionBand: React.FC<{ label: string; sub?: string }> = ({ label, sub }) => (
  <div className="flex items-baseline gap-3 pt-2">
    <h3 className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: '#2F8F87' }}>{label}</h3>
    <div className="flex-1 h-px" style={{ backgroundColor: '#E6E1D7' }} />
    {sub && <span className="text-xs font-medium" style={{ color: '#9B9A94' }}>{sub}</span>}
  </div>
);

export default Sessions;
