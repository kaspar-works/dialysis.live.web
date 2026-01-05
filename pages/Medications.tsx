import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ICONS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { SubscriptionLimitError } from '../services/auth';
import {
  Medication,
  MedicationDose,
  MedicationRoute,
  ScheduleType,
  DoseStatus,
  getMedications,
  createMedication,
  deleteMedication,
  createSchedule,
  getTodayDoses,
  markDoseTaken,
  markDoseSkipped,
  getTodayDoseStats,
} from '../services/medications';

type TabView = 'today' | 'medications';

interface DoseWithMed extends MedicationDose {
  medication?: Medication;
}

const Medications: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabView>('today');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [todayDoses, setTodayDoses] = useState<DoseWithMed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState({ total: 0, taken: 0, completionRate: 0 });
  const [limitError, setLimitError] = useState<{ message: string; limit?: number } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [medToDelete, setMedToDelete] = useState<Medication | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // New medication form
  const [newMed, setNewMed] = useState({
    name: '',
    dose: '',
    route: MedicationRoute.ORAL,
    instructions: '',
    scheduleType: ScheduleType.DAILY,
    times: ['08:00'],
  });

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      const [medsData, dosesData, statsData] = await Promise.all([
        getMedications(true),
        getTodayDoses(),
        getTodayDoseStats(),
      ]);

      setMedications(medsData);

      const dosesWithMeds = dosesData.map(dose => ({
        ...dose,
        medication: typeof dose.medicationId === 'object'
          ? dose.medicationId as Medication
          : medsData.find(m => m._id === dose.medicationId),
      }));
      setTodayDoses(dosesWithMeds);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch medications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTakeDose = async (doseId: string) => {
    try {
      await markDoseTaken(doseId);
      fetchData();
    } catch (err) {
      console.error('Failed to mark dose as taken:', err);
    }
  };

  const handleSkipDose = async (doseId: string) => {
    try {
      await markDoseSkipped(doseId);
      fetchData();
    } catch (err) {
      console.error('Failed to skip dose:', err);
    }
  };

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newMed.name || newMed.name.trim().length < 2) {
      setFormError('Medication name must be at least 2 characters');
      return;
    }

    if (!newMed.dose || newMed.dose.trim() === '') {
      setFormError('Dose/strength is required');
      return;
    }

    const validTimes = newMed.times.filter(t => t && t.trim() !== '');
    if (validTimes.length === 0) {
      setFormError('At least one schedule time is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const medication = await createMedication({
        name: newMed.name.trim(),
        dose: newMed.dose.trim(),
        route: newMed.route,
        instructions: newMed.instructions?.trim() || undefined,
      });

      await createSchedule(medication._id, {
        scheduleType: newMed.scheduleType,
        times: validTimes,
      });

      setNewMed({
        name: '',
        dose: '',
        route: MedicationRoute.ORAL,
        instructions: '',
        scheduleType: ScheduleType.DAILY,
        times: ['08:00'],
      });
      setFormError(null);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      if (err instanceof SubscriptionLimitError) {
        setLimitError({ message: err.message, limit: err.limit });
        setIsModalOpen(false);
      } else {
        setFormError('Failed to add medication. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMedication = async () => {
    if (!medToDelete) return;
    setIsDeleting(true);
    try {
      await deleteMedication(medToDelete._id);
      setShowDeleteModal(false);
      setMedToDelete(null);
      fetchData();
    } catch (err) {
      console.error('Failed to delete medication:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const addTimeSlot = () => {
    setNewMed(prev => ({ ...prev, times: [...prev.times, '12:00'] }));
  };

  const removeTimeSlot = (index: number) => {
    setNewMed(prev => ({
      ...prev,
      times: prev.times.filter((_, i) => i !== index),
    }));
  };

  const updateTimeSlot = (index: number, value: string) => {
    setNewMed(prev => ({
      ...prev,
      times: prev.times.map((t, i) => (i === index ? value : t)),
    }));
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Group doses by time period
  const groupedDoses = todayDoses.reduce((acc, dose) => {
    const hour = new Date(dose.scheduledFor).getHours();
    let period = 'Morning';
    if (hour >= 12 && hour < 17) period = 'Afternoon';
    else if (hour >= 17) period = 'Evening';

    if (!acc[period]) acc[period] = [];
    acc[period].push(dose);
    return acc;
  }, {} as Record<string, DoseWithMed[]>);

  const pendingDoses = todayDoses.filter(d => d.status === DoseStatus.PENDING);
  const nextDose = pendingDoses.length > 0 ? pendingDoses[0] : null;

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-12 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-700 pb-24 px-4">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-pink-500/10 text-pink-500 text-[10px] font-bold uppercase tracking-wider rounded-full">
            Medications
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-2">
            Dosing Log
          </h1>
          {medications.length > 0 && (
            <p className="text-slate-400 text-sm mt-1">{medications.length} active medication{medications.length !== 1 ? 's' : ''}</p>
          )}
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 bg-pink-500 text-white rounded-xl font-bold hover:bg-pink-600 transition-all shadow-lg shadow-pink-500/20"
        >
          <ICONS.Plus className="w-5 h-5" />
          Add Medication
        </button>
      </header>

      {/* Limit Error Banner */}
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
                  to="/subscription/pricing"
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-sm hover:from-amber-600 hover:to-orange-600 transition-all"
                >
                  Upgrade Plan
                </Link>
                <button onClick={() => setLimitError(null)} className="px-4 py-2.5 text-amber-600 font-medium text-sm">
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Card - Next Dose */}
      {nextDose && nextDose.medication && (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <p className="text-pink-400 text-xs font-bold uppercase tracking-wider mb-2">Next Dose</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-pink-500/20 rounded-2xl flex items-center justify-center">
                  <ICONS.Pill className="w-7 h-7 text-pink-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{nextDose.medication.name}</h3>
                  <p className="text-slate-400 text-sm">
                    {nextDose.medication.dose} • {formatTime(nextDose.scheduledFor)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSkipDose(nextDose._id)}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all"
                >
                  Skip
                </button>
                <button
                  onClick={() => handleTakeDose(nextDose._id)}
                  className="px-6 py-2.5 bg-pink-500 hover:bg-pink-600 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                >
                  <ICONS.Check className="w-4 h-4" />
                  Take Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today</span>
            <div className="w-8 h-8 bg-pink-500/10 rounded-lg flex items-center justify-center">
              <ICONS.Check className="w-4 h-4 text-pink-500" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.taken}<span className="text-lg text-slate-300 dark:text-slate-600">/{stats.total}</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">doses taken</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rate</span>
            <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <span className="text-emerald-500 text-sm font-bold">%</span>
            </div>
          </div>
          <p className={`text-2xl font-black ${stats.completionRate >= 80 ? 'text-emerald-500' : stats.completionRate >= 50 ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>
            {stats.completionRate}%
          </p>
          <p className="text-xs text-slate-400 mt-1">completion</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending</span>
            <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center">
              <ICONS.Clock className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{pendingDoses.length}</p>
          <p className="text-xs text-slate-400 mt-1">remaining</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active</span>
            <div className="w-8 h-8 bg-sky-500/10 rounded-lg flex items-center justify-center">
              <ICONS.Pill className="w-4 h-4 text-sky-500" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{medications.length}</p>
          <p className="text-xs text-slate-400 mt-1">medications</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
        <button
          onClick={() => setActiveTab('today')}
          className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${
            activeTab === 'today'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Today's Schedule
        </button>
        <button
          onClick={() => setActiveTab('medications')}
          className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${
            activeTab === 'medications'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          All Medications
        </button>
      </div>

      {/* Today's Schedule Tab */}
      {activeTab === 'today' && (
        <div className="space-y-6">
          {todayDoses.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-100 dark:border-slate-700">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ICONS.Pill className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-slate-900 dark:text-white font-bold text-lg">No doses scheduled</p>
              <p className="text-slate-400 text-sm mt-1">Add medications to see your daily schedule</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-6 px-6 py-3 bg-pink-500 text-white rounded-xl font-bold hover:bg-pink-600 transition-all"
              >
                Add Medication
              </button>
            </div>
          ) : (
            Object.entries(groupedDoses).map(([period, doses]) => (
              <div key={period}>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">{period}</h3>
                <div className="space-y-2">
                  {doses.map((dose) => {
                    const med = dose.medication;
                    const isTaken = dose.status === DoseStatus.TAKEN;
                    const isSkipped = dose.status === DoseStatus.SKIPPED;
                    const isMissed = dose.status === DoseStatus.MISSED;
                    const isPending = dose.status === DoseStatus.PENDING;

                    return (
                      <div
                        key={dose._id}
                        className={`bg-white dark:bg-slate-800 rounded-xl p-4 border transition-all ${
                          isTaken
                            ? 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/5'
                            : isSkipped
                            ? 'border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/5'
                            : isMissed
                            ? 'border-rose-200 dark:border-rose-500/30 bg-rose-50/50 dark:bg-rose-500/5'
                            : 'border-slate-100 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                isTaken
                                  ? 'bg-emerald-500 text-white'
                                  : isSkipped
                                  ? 'bg-amber-500 text-white'
                                  : isMissed
                                  ? 'bg-rose-500 text-white'
                                  : 'bg-pink-50 dark:bg-pink-500/10 text-pink-500'
                              }`}
                            >
                              {isTaken ? (
                                <ICONS.Check className="w-5 h-5" />
                              ) : (
                                <ICONS.Pill className="w-5 h-5" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 dark:text-white">
                                {med?.name || 'Unknown'}
                              </h4>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-pink-500 font-semibold">{med?.dose}</span>
                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                <span className="text-slate-400">{formatTime(dose.scheduledFor)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isPending ? (
                              <>
                                <button
                                  onClick={() => handleSkipDose(dose._id)}
                                  className="px-3 py-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-all"
                                >
                                  Skip
                                </button>
                                <button
                                  onClick={() => handleTakeDose(dose._id)}
                                  className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-sm font-bold transition-all"
                                >
                                  Take
                                </button>
                              </>
                            ) : (
                              <span
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${
                                  isTaken
                                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                    : isSkipped
                                    ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                    : 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400'
                                }`}
                              >
                                {dose.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* All Medications Tab */}
      {activeTab === 'medications' && (
        <div className="space-y-3">
          {medications.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-100 dark:border-slate-700">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ICONS.Pill className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-slate-900 dark:text-white font-bold text-lg">No medications yet</p>
              <p className="text-slate-400 text-sm mt-1">Add your first medication to get started</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-6 px-6 py-3 bg-pink-500 text-white rounded-xl font-bold hover:bg-pink-600 transition-all"
              >
                Add Medication
              </button>
            </div>
          ) : (
            medications.map((med) => (
              <div
                key={med._id}
                className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700 hover:border-pink-200 dark:hover:border-pink-500/30 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-pink-50 dark:bg-pink-500/10 rounded-xl flex items-center justify-center group-hover:bg-pink-500 group-hover:text-white transition-all">
                      <ICONS.Pill className="w-6 h-6 text-pink-500 group-hover:text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-lg">{med.name}</h4>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-pink-500 font-semibold">{med.dose}</span>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span className="text-slate-400 capitalize">{med.route}</span>
                        {med.instructions && (
                          <>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span className="text-slate-400">{med.instructions}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${
                        med.active
                          ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                      }`}
                    >
                      {med.active ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() => {
                        setMedToDelete(med);
                        setShowDeleteModal(true);
                      }}
                      className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ICONS.Trash className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Medication Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-lg w-full animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add Medication</h2>
                <p className="text-sm text-slate-400 mt-1">Set up your medication schedule</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
              >
                <ICONS.X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMedication} className="p-6 space-y-5">
              {formError && (
                <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl p-3 flex items-center gap-2">
                  <ICONS.AlertCircle className="w-5 h-5 text-rose-500" />
                  <p className="text-rose-600 dark:text-rose-400 text-sm font-medium">{formError}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                    Medication Name
                  </label>
                  <input
                    type="text"
                    value={newMed.name}
                    onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                    placeholder="e.g. Phosphate Binder"
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                    Dose
                  </label>
                  <input
                    type="text"
                    value={newMed.dose}
                    onChange={(e) => setNewMed({ ...newMed, dose: e.target.value })}
                    placeholder="e.g. 800mg"
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                    Route
                  </label>
                  <select
                    value={newMed.route}
                    onChange={(e) => setNewMed({ ...newMed, route: e.target.value as MedicationRoute })}
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 font-medium text-slate-900 dark:text-white outline-none"
                  >
                    {Object.values(MedicationRoute).map((route) => (
                      <option key={route} value={route}>
                        {route.charAt(0).toUpperCase() + route.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  Schedule
                </label>
                <select
                  value={newMed.scheduleType}
                  onChange={(e) => setNewMed({ ...newMed, scheduleType: e.target.value as ScheduleType })}
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 font-medium text-slate-900 dark:text-white outline-none"
                >
                  <option value={ScheduleType.DAILY}>Daily</option>
                  <option value={ScheduleType.DIALYSIS_DAYS}>Dialysis Days Only</option>
                  <option value={ScheduleType.NON_DIALYSIS_DAYS}>Non-Dialysis Days Only</option>
                  <option value={ScheduleType.AS_NEEDED}>As Needed</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  Times
                </label>
                <div className="space-y-2">
                  {newMed.times.map((time, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => updateTimeSlot(index, e.target.value)}
                        className="flex-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 font-medium text-slate-900 dark:text-white outline-none"
                      />
                      {newMed.times.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTimeSlot(index)}
                          className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                        >
                          <ICONS.X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addTimeSlot}
                  className="mt-2 text-sm font-bold text-pink-500 hover:text-pink-600 flex items-center gap-1"
                >
                  <ICONS.Plus className="w-4 h-4" /> Add Time
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  Instructions (Optional)
                </label>
                <textarea
                  value={newMed.instructions}
                  onChange={(e) => setNewMed({ ...newMed, instructions: e.target.value })}
                  placeholder="e.g. Take with food"
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 font-medium text-slate-900 dark:text-white outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newMed.name || !newMed.dose}
                  className="flex-1 py-3 bg-pink-500 text-white font-bold rounded-xl hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <ICONS.Plus className="w-5 h-5" />
                      Add Medication
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && medToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center">
                <ICONS.Trash className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Delete Medication</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">This action cannot be undone</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl mb-6">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Are you sure you want to delete <strong>{medToDelete.name}</strong>?
              </p>
              <p className="text-xs text-slate-400 mt-2">
                {medToDelete.dose} • {medToDelete.route}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setMedToDelete(null);
                }}
                disabled={isDeleting}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMedication}
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
    </div>
  );
};

export default Medications;
