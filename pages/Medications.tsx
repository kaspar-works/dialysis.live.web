import React, { useState, useEffect, useCallback } from 'react';
import { ICONS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import {
  Medication,
  MedicationDose,
  MedicationSchedule,
  MedicationRoute,
  ScheduleType,
  DoseStatus,
  getMedications,
  createMedication,
  deleteMedication,
  createSchedule,
  getSchedule,
  getTodayDoses,
  markDoseTaken,
  markDoseSkipped,
  getTodayDoseStats,
} from '../services/medications';

type ViewMode = 'today' | 'all';

interface DoseWithMed extends MedicationDose {
  medication?: Medication;
}

const Medications: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<ViewMode>('today');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [todayDoses, setTodayDoses] = useState<DoseWithMed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState({ total: 0, taken: 0, completionRate: 0 });

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

      // Map doses with medication info
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

  // Handle marking dose as taken
  const handleTakeDose = async (doseId: string) => {
    try {
      await markDoseTaken(doseId);
      // Refresh data
      fetchData();
    } catch (err) {
      console.error('Failed to mark dose as taken:', err);
    }
  };

  // Handle marking dose as skipped
  const handleSkipDose = async (doseId: string) => {
    try {
      await markDoseSkipped(doseId);
      fetchData();
    } catch (err) {
      console.error('Failed to skip dose:', err);
    }
  };

  // Handle adding new medication
  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMed.name || !newMed.dose) return;

    setIsSubmitting(true);
    try {
      // Create medication
      const medication = await createMedication({
        name: newMed.name,
        dose: newMed.dose,
        route: newMed.route,
        instructions: newMed.instructions || undefined,
      });

      // Create schedule
      await createSchedule(medication._id, {
        scheduleType: newMed.scheduleType,
        times: newMed.times.filter(t => t),
      });

      // Reset form and close modal
      setNewMed({
        name: '',
        dose: '',
        route: MedicationRoute.ORAL,
        instructions: '',
        scheduleType: ScheduleType.DAILY,
        times: ['08:00'],
      });
      setIsModalOpen(false);

      // Refresh data
      fetchData();
    } catch (err) {
      console.error('Failed to add medication:', err);
      alert('Failed to add medication');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle deleting medication
  const handleDeleteMedication = async (medicationId: string) => {
    if (!confirm('Are you sure you want to remove this medication?')) return;

    try {
      await deleteMedication(medicationId);
      fetchData();
    } catch (err) {
      console.error('Failed to delete medication:', err);
    }
  };

  // Add/remove time slots
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

  // Get status color
  const getStatusColor = (status: DoseStatus) => {
    switch (status) {
      case DoseStatus.TAKEN:
        return 'bg-emerald-500 text-white';
      case DoseStatus.SKIPPED:
        return 'bg-amber-500 text-white';
      case DoseStatus.MISSED:
        return 'bg-rose-500 text-white';
      default:
        return 'bg-slate-100 dark:bg-white/5 text-slate-400';
    }
  };

  // Format time for display
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 md:space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-slate-100 dark:border-white/10 shadow-sm">
              Your Medicines
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Dosing Log
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md font-medium text-base md:text-lg">
            Track your medications and stay on schedule.
          </p>
        </div>

        <div className="flex bg-white dark:bg-white/5 p-1 rounded-xl md:rounded-2xl border border-slate-100 dark:border-white/10 shadow-sm">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-4 md:px-8 py-2 md:py-3 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'today'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-lg'
                : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 md:px-8 py-2 md:py-3 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-lg'
                : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'
            }`}
          >
            All
          </button>
        </div>
      </section>

      {/* Stats Overview */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
        <div className="bg-slate-900 p-8 md:p-10 rounded-3xl md:rounded-[3.5rem] text-white shadow-xl relative overflow-hidden border border-white/5">
          <p className="text-[9px] md:text-[10px] font-black text-pink-400 uppercase tracking-widest mb-4">
            Taken Today
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl md:text-6xl font-black tabular-nums">{stats.taken}</span>
            <span className="text-lg md:text-xl font-bold opacity-30 uppercase">/ {stats.total}</span>
          </div>
          <div className="mt-6 md:mt-8 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-orange-400 rounded-full transition-all duration-1000"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-3xl md:rounded-[3.5rem] border border-slate-100 dark:border-white/10 shadow-sm flex flex-col justify-between hover:border-sky-500 transition-all">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-black text-slate-900 dark:text-white uppercase text-[10px] tracking-widest mb-1 px-1">
                Active Medications
              </h4>
              <p className="text-sky-600 dark:text-sky-400 text-xl font-black px-1 uppercase tracking-tight">
                {medications.length} Total
              </p>
            </div>
            <div className="w-12 h-12 bg-sky-50 dark:bg-sky-500/10 text-sky-500 rounded-xl flex items-center justify-center">
              <ICONS.Pill className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-3xl md:rounded-[3.5rem] border border-slate-100 dark:border-white/10 shadow-sm flex flex-col justify-between hover:border-pink-400 transition-all">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-black text-slate-900 dark:text-white uppercase text-[10px] tracking-widest mb-1 px-1">
                Completion Rate
              </h4>
              <p className="text-pink-600 dark:text-pink-400 text-xl font-black px-1 uppercase tracking-tight">
                {stats.completionRate}% Today
              </p>
            </div>
            <div className="w-12 h-12 bg-pink-50 dark:bg-pink-500/10 text-pink-600 rounded-xl flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="text-pink-500">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Today's Doses View */}
      {activeTab === 'today' && (
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white px-2">Today's Schedule</h3>

          {todayDoses.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-100 dark:border-white/10">
              <ICONS.Pill className="w-12 h-12 mx-auto text-slate-200 dark:text-slate-700 mb-4" />
              <p className="text-slate-400 font-bold">No doses scheduled for today</p>
              <p className="text-slate-300 dark:text-slate-600 text-sm mt-1">Add medications to see your daily schedule</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayDoses.map((dose) => {
                const med = dose.medication;
                const isTaken = dose.status === DoseStatus.TAKEN;
                const isSkipped = dose.status === DoseStatus.SKIPPED;
                const isCompleted = isTaken || isSkipped;

                return (
                  <div
                    key={dose._id}
                    className={`bg-white dark:bg-slate-900 p-6 rounded-2xl border transition-all ${
                      isTaken
                        ? 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/5'
                        : isSkipped
                        ? 'border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/5'
                        : 'border-slate-100 dark:border-white/10 hover:border-pink-200 dark:hover:border-pink-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-3 rounded-xl transition-all ${
                            isTaken
                              ? 'bg-emerald-500 text-white'
                              : isSkipped
                              ? 'bg-amber-500 text-white'
                              : 'bg-pink-50 dark:bg-pink-500/10 text-pink-500'
                          }`}
                        >
                          <ICONS.Pill className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white">
                            {med?.name || 'Unknown Medication'}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-pink-600 dark:text-pink-400 font-bold text-sm">
                              {med?.dose}
                            </span>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span className="text-xs text-slate-400">
                              {formatTime(dose.scheduledFor)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isCompleted ? (
                          <span
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${getStatusColor(
                              dose.status
                            )}`}
                          >
                            {dose.status}
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleSkipDose(dose._id)}
                              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                            >
                              Skip
                            </button>
                            <button
                              onClick={() => handleTakeDose(dose._id)}
                              className="px-6 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                            >
                              Take
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* All Medications View */}
      {activeTab === 'all' && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {medications.map((med) => (
            <div
              key={med._id}
              className="group relative bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] border border-slate-100 dark:border-white/10 shadow-sm hover:shadow-xl hover:border-pink-200 dark:hover:border-pink-500/30 transition-all"
            >
              {/* Delete button */}
              <button
                onClick={() => handleDeleteMedication(med._id)}
                className="absolute top-6 right-6 p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <ICONS.Trash className="w-4 h-4" />
              </button>

              <div className="flex justify-between items-start mb-6 md:mb-8">
                <div className="p-4 md:p-5 rounded-2xl bg-pink-50 dark:bg-pink-500/10 text-pink-500 group-hover:bg-pink-600 group-hover:text-white transition-all">
                  <ICONS.Pill className="w-5 h-5 md:w-6 md:h-6" />
                </div>
              </div>

              <div className="mb-8 md:mb-10">
                <h3 className="text-xl md:text-2xl font-black tracking-tighter text-slate-900 dark:text-white">
                  {med.name}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-pink-600 dark:text-pink-400 font-black text-xs md:text-sm">
                    {med.dose}
                  </span>
                  <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                  <span className="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                    {med.route}
                  </span>
                </div>
                {med.instructions && (
                  <p className="text-xs text-slate-400 mt-3">{med.instructions}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                    med.active
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-400'
                  }`}
                >
                  {med.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}

          {/* Add New Medication Card */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex flex-col items-center justify-center p-8 md:p-12 border-4 border-dashed border-slate-100 dark:border-white/10 rounded-[2.5rem] md:rounded-[3.5rem] hover:border-sky-500 dark:hover:border-sky-500 hover:bg-sky-50/30 dark:hover:bg-sky-500/5 transition-all min-h-[250px] md:min-h-[320px] group"
          >
            <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-50 dark:bg-white/5 text-slate-200 dark:text-slate-800 rounded-xl md:rounded-[1.5rem] flex items-center justify-center mb-4 md:mb-6 border border-slate-100 dark:border-white/10 group-hover:bg-sky-500 group-hover:text-white transition-all">
              <ICONS.Plus className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <p className="text-[9px] md:text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest group-hover:text-sky-500 transition-colors">
              New Medicine
            </p>
          </button>
        </section>
      )}

      {/* Add Medication Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />

          <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Add Medication</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <ICONS.X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddMedication} className="p-6 space-y-6">
              {/* Name */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  Medication Name
                </label>
                <input
                  type="text"
                  value={newMed.name}
                  onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                  placeholder="e.g. Phosphate Binder"
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-pink-500/20"
                  required
                />
              </div>

              {/* Dose */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  Dose
                </label>
                <input
                  type="text"
                  value={newMed.dose}
                  onChange={(e) => setNewMed({ ...newMed, dose: e.target.value })}
                  placeholder="e.g. 800mg"
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-pink-500/20"
                  required
                />
              </div>

              {/* Route */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  Route
                </label>
                <select
                  value={newMed.route}
                  onChange={(e) => setNewMed({ ...newMed, route: e.target.value as MedicationRoute })}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none"
                >
                  {Object.values(MedicationRoute).map((route) => (
                    <option key={route} value={route}>
                      {route.charAt(0).toUpperCase() + route.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Schedule Type */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  Schedule
                </label>
                <select
                  value={newMed.scheduleType}
                  onChange={(e) => setNewMed({ ...newMed, scheduleType: e.target.value as ScheduleType })}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none"
                >
                  <option value={ScheduleType.DAILY}>Daily</option>
                  <option value={ScheduleType.DIALYSIS_DAYS}>Dialysis Days Only</option>
                  <option value={ScheduleType.NON_DIALYSIS_DAYS}>Non-Dialysis Days Only</option>
                  <option value={ScheduleType.AS_NEEDED}>As Needed</option>
                </select>
              </div>

              {/* Times */}
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
                        className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none"
                      />
                      {newMed.times.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTimeSlot(index)}
                          className="p-3 text-slate-400 hover:text-rose-500 transition-colors"
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
                  className="mt-2 text-xs font-bold text-sky-500 hover:text-sky-600 flex items-center gap-1"
                >
                  <ICONS.Plus className="w-4 h-4" /> Add Time
                </button>
              </div>

              {/* Instructions */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  Instructions (Optional)
                </label>
                <textarea
                  value={newMed.instructions}
                  onChange={(e) => setNewMed({ ...newMed, instructions: e.target.value })}
                  placeholder="e.g. Take with food"
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl px-4 py-3 font-medium text-slate-900 dark:text-white outline-none resize-none"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newMed.name || !newMed.dose}
                  className="flex-[2] py-4 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-black text-sm uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
    </div>
  );
};

export default Medications;
