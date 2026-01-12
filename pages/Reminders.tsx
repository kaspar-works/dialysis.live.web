import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants';
import { useAlert } from '../contexts/AlertContext';
import {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  toggleReminder,
  snoozeReminder,
  completeReminder,
  getUpcomingReminders,
  getReminderStats,
  Reminder,
  ReminderType,
  ReminderFrequency,
  ReminderStats,
  CreateReminderData,
  REMINDER_TYPE_LABELS,
  REMINDER_TYPE_ICONS,
  FREQUENCY_LABELS,
  DAY_NAMES,
  formatReminderTime,
  formatNextTrigger,
  getScheduleDescription,
} from '../services/reminders';

const Reminders: React.FC = () => {
  const { showConfirm } = useAlert();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [upcoming, setUpcoming] = useState<Reminder[]>([]);
  const [stats, setStats] = useState<ReminderStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming'>('upcoming');
  const [filterType, setFilterType] = useState<ReminderType | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateReminderData>({
    title: '',
    description: '',
    type: 'custom',
    frequency: 'daily',
    time: '09:00',
    daysOfWeek: [1, 2, 3, 4, 5],
    notificationSettings: { push: true, email: false, sms: false },
  });

  // Validation state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  // Validation functions
  const validateTitle = (value: string): string => {
    if (!value || value.trim() === '') return 'Title is required';
    if (value.trim().length < 2) return 'Title must be at least 2 characters';
    if (value.trim().length > 100) return 'Title cannot exceed 100 characters';
    return '';
  };

  const validateDescription = (value: string): string => {
    if (value && value.length > 300) return 'Description cannot exceed 300 characters';
    return '';
  };

  const validateTime = (value: string): string => {
    if (!value) return 'Time is required';
    return '';
  };

  const validateDaysOfWeek = (days: number[] | undefined, frequency: string): string => {
    if (frequency === 'weekly' && (!days || days.length === 0)) {
      return 'Select at least one day';
    }
    return '';
  };

  // Handle field change with validation
  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touchedFields[field]) {
      let error = '';
      switch (field) {
        case 'title': error = validateTitle(value); break;
        case 'description': error = validateDescription(value); break;
        case 'time': error = validateTime(value); break;
      }
      setFieldErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  // Handle field blur
  const handleFieldBlur = (field: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    let error = '';
    switch (field) {
      case 'title': error = validateTitle(formData.title); break;
      case 'description': error = validateDescription(formData.description || ''); break;
      case 'time': error = validateTime(formData.time); break;
    }
    setFieldErrors(prev => ({ ...prev, [field]: error }));
  };

  // Check if form has errors
  const hasFormErrors = Object.values(fieldErrors).some(error => error !== '');

  // Reset form validation
  const resetFormValidation = () => {
    setFieldErrors({});
    setTouchedFields({});
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [allReminders, upcomingReminders, reminderStats] = await Promise.all([
        getReminders(),
        getUpcomingReminders(24),
        getReminderStats(),
      ]);
      setReminders(allReminders);
      setUpcoming(upcomingReminders);
      setStats(reminderStats);
    } catch (err: any) {
      console.error('Failed to fetch reminders:', err);
      setError(err.message || 'Failed to load reminders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Mark all fields as touched
    const newTouchedFields: Record<string, boolean> = {
      title: true,
      description: true,
      time: true,
      daysOfWeek: true,
    };
    setTouchedFields(newTouchedFields);

    // Validate all fields
    const newErrors: Record<string, string> = {
      title: validateTitle(formData.title),
      description: validateDescription(formData.description || ''),
      time: validateTime(formData.time),
      daysOfWeek: validateDaysOfWeek(formData.daysOfWeek, formData.frequency),
    };
    setFieldErrors(newErrors);

    // Check for validation errors
    const hasErrors = Object.values(newErrors).some(error => error !== '');
    if (hasErrors) {
      return;
    }

    try {
      if (editingReminder) {
        await updateReminder(editingReminder._id, formData);
      } else {
        await createReminder(formData);
      }
      setShowModal(false);
      setEditingReminder(null);
      resetForm();
      resetFormValidation();
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to save reminder');
    }
  };

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setFormData({
      title: reminder.title,
      description: reminder.description || '',
      type: reminder.type,
      frequency: reminder.frequency,
      time: reminder.time,
      daysOfWeek: reminder.daysOfWeek || [],
      dayOfMonth: reminder.dayOfMonth,
      notificationSettings: reminder.notificationSettings,
    });
    setShowModal(true);
  };

  const handleDelete = (reminderId: string) => {
    showConfirm(
      'Delete Reminder',
      'Are you sure you want to delete this reminder?',
      async () => {
        try {
          await deleteReminder(reminderId);
          fetchData();
        } catch (err: any) {
          setError(err.message || 'Failed to delete reminder');
        }
      },
      { confirmText: 'Delete', cancelText: 'Cancel' }
    );
  };

  const handleToggle = async (reminderId: string) => {
    try {
      await toggleReminder(reminderId);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to toggle reminder');
    }
  };

  const handleSnooze = async (reminderId: string, minutes: number) => {
    try {
      await snoozeReminder(reminderId, minutes);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to snooze reminder');
    }
  };

  const handleComplete = async (reminderId: string) => {
    try {
      await completeReminder(reminderId);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to complete reminder');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'custom',
      frequency: 'daily',
      time: '09:00',
      daysOfWeek: [1, 2, 3, 4, 5],
      notificationSettings: { push: true, email: false, sms: false },
    });
  };

  const toggleDayOfWeek = (day: number) => {
    const days = formData.daysOfWeek || [];
    let newDays: number[];
    if (days.includes(day)) {
      newDays = days.filter((d) => d !== day);
    } else {
      newDays = [...days, day].sort();
    }
    setFormData({ ...formData, daysOfWeek: newDays });
    // Validate if touched
    if (touchedFields.daysOfWeek) {
      const error = validateDaysOfWeek(newDays, formData.frequency);
      setFieldErrors(prev => ({ ...prev, daysOfWeek: error }));
    }
  };

  const filteredReminders = filterType === 'all'
    ? reminders
    : reminders.filter((r) => r.type === filterType);

  const displayReminders = activeTab === 'upcoming' ? upcoming : filteredReminders;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 relative mx-auto">
            <div className="absolute inset-0 border-4 border-sky-500/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-sky-500 rounded-full animate-spin" />
          </div>
          <p className="text-slate-400 text-sm font-medium">Loading reminders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-24 px-4 animate-in fade-in duration-500">
      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center justify-between">
          <p className="text-rose-500 font-medium">{error}</p>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-600">
            <ICONS.X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Reminders</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Stay on track with your health routine
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingReminder(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-5 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-semibold transition-colors"
        >
          <ICONS.Plus className="w-5 h-5" />
          Add Reminder
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Active</p>
            <p className="text-3xl font-black text-emerald-600">{stats.enabled}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Upcoming (24h)</p>
            <p className="text-3xl font-black text-sky-600">{upcoming.length}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Disabled</p>
            <p className="text-3xl font-black text-slate-400">{stats.disabled}</p>
          </div>
        </div>
      )}

      {/* Tabs & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'upcoming'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            All Reminders
          </button>
        </div>

        {activeTab === 'all' && (
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as ReminderType | 'all')}
            className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Types</option>
            {Object.entries(REMINDER_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {REMINDER_TYPE_ICONS[value as ReminderType]} {label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Reminders List */}
      {displayReminders.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-4xl">
            🔔
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {activeTab === 'upcoming' ? 'No upcoming reminders' : 'No reminders yet'}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            {activeTab === 'upcoming'
              ? 'You have no reminders scheduled for the next 24 hours'
              : 'Create your first reminder to stay on track'}
          </p>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-semibold transition-colors"
          >
            <ICONS.Plus className="w-5 h-5" />
            Create Reminder
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {displayReminders.map((reminder) => (
            <div
              key={reminder._id}
              className={`bg-white dark:bg-slate-800 rounded-2xl p-5 border transition-all ${
                reminder.enabled
                  ? 'border-slate-200 dark:border-slate-700'
                  : 'border-slate-200 dark:border-slate-700 opacity-60'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                    reminder.enabled
                      ? 'bg-sky-100 dark:bg-sky-500/20'
                      : 'bg-slate-100 dark:bg-slate-700'
                  }`}
                >
                  {REMINDER_TYPE_ICONS[reminder.type]}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{reminder.title}</h3>
                      {reminder.description && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                          {reminder.description}
                        </p>
                      )}
                    </div>

                    {/* Toggle */}
                    <button
                      onClick={() => handleToggle(reminder._id)}
                      className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${
                        reminder.enabled ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                          reminder.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Schedule Info */}
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-xs font-medium text-slate-600 dark:text-slate-400">
                      <ICONS.Calendar className="w-3.5 h-3.5" />
                      {getScheduleDescription(reminder)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                        reminder.status === 'active'
                          ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : reminder.status === 'snoozed'
                          ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {reminder.status === 'snoozed' && reminder.snoozedUntil
                        ? `Snoozed until ${formatReminderTime(new Date(reminder.snoozedUntil).toTimeString().slice(0, 5))}`
                        : reminder.status.charAt(0).toUpperCase() + reminder.status.slice(1)}
                    </span>
                    {reminder.nextTrigger && reminder.enabled && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Next: {formatNextTrigger(reminder.nextTrigger)}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4">
                    {reminder.enabled && (
                      <>
                        <button
                          onClick={() => handleComplete(reminder._id)}
                          className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-semibold hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-colors"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => handleSnooze(reminder._id, 30)}
                          className="px-3 py-1.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-semibold hover:bg-amber-200 dark:hover:bg-amber-500/30 transition-colors"
                        >
                          Snooze 30m
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleEdit(reminder)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(reminder._id)}
                      className="px-3 py-1.5 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-semibold hover:bg-rose-200 dark:hover:bg-rose-500/30 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            {/* Mobile drag indicator */}
            <div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mt-3 sm:hidden" />

            <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {editingReminder ? 'Edit Reminder' : 'New Reminder'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingReminder(null);
                  }}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                >
                  <ICONS.X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  onBlur={() => handleFieldBlur('title')}
                  placeholder="e.g., Take morning medication"
                  className={`w-full px-4 py-3 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition-all ${
                    fieldErrors.title && touchedFields.title
                      ? 'bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-400 dark:border-rose-500'
                      : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-sky-500'
                  }`}
                />
                {fieldErrors.title && touchedFields.title && (
                  <p className="text-xs text-rose-500 mt-1">{fieldErrors.title}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  onBlur={() => handleFieldBlur('description')}
                  placeholder="Optional details..."
                  rows={2}
                  className={`w-full px-4 py-3 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none resize-none transition-all ${
                    fieldErrors.description && touchedFields.description
                      ? 'bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-400 dark:border-rose-500'
                      : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-sky-500'
                  }`}
                />
                {fieldErrors.description && touchedFields.description && (
                  <p className="text-xs text-rose-500 mt-1">{fieldErrors.description}</p>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Type *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(REMINDER_TYPE_LABELS).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: value as ReminderType })}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                        formData.type === value
                          ? 'bg-sky-500 border-sky-500 text-white'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-sky-300'
                      }`}
                    >
                      <span>{REMINDER_TYPE_ICONS[value as ReminderType]}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleFieldChange('time', e.target.value)}
                  onBlur={() => handleFieldBlur('time')}
                  className={`w-full px-4 py-3 rounded-xl text-slate-900 dark:text-white focus:outline-none transition-all ${
                    fieldErrors.time && touchedFields.time
                      ? 'bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-400 dark:border-rose-500'
                      : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-sky-500'
                  }`}
                />
                {fieldErrors.time && touchedFields.time && (
                  <p className="text-xs text-rose-500 mt-1">{fieldErrors.time}</p>
                )}
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Frequency *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormData({ ...formData, frequency: value as ReminderFrequency })}
                      className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        formData.frequency === value
                          ? 'bg-sky-500 border-sky-500 text-white'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-sky-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Days of Week (for weekly) */}
              {formData.frequency === 'weekly' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Days of Week <span className="text-rose-500">*</span>
                  </label>
                  <div className={`flex gap-2 p-2 rounded-xl transition-all ${
                    fieldErrors.daysOfWeek && touchedFields.daysOfWeek
                      ? 'bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-400 dark:border-rose-500'
                      : ''
                  }`}>
                    {DAY_NAMES.map((day, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setTouchedFields(prev => ({ ...prev, daysOfWeek: true }));
                          toggleDayOfWeek(index);
                        }}
                        className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${
                          formData.daysOfWeek?.includes(index)
                            ? 'bg-sky-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                  {fieldErrors.daysOfWeek && touchedFields.daysOfWeek && (
                    <p className="text-xs text-rose-500 mt-1">{fieldErrors.daysOfWeek}</p>
                  )}
                </div>
              )}

              {/* Day of Month (for monthly) */}
              {formData.frequency === 'monthly' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Day of Month
                  </label>
                  <select
                    value={formData.dayOfMonth || 1}
                    onChange={(e) => setFormData({ ...formData, dayOfMonth: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notification Settings */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Notifications
                </label>
                <div className="flex gap-4">
                  {[
                    { key: 'push', label: 'Push', icon: '🔔' },
                    { key: 'email', label: 'Email', icon: '📧' },
                    { key: 'sms', label: 'SMS', icon: '📱' },
                  ].map(({ key, label, icon }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.notificationSettings?.[key as keyof typeof formData.notificationSettings] || false}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            notificationSettings: {
                              ...formData.notificationSettings,
                              [key]: e.target.checked,
                            } as any,
                          })
                        }
                        className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-sky-500 focus:ring-sky-500"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {icon} {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 pt-3 sm:pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingReminder(null);
                    resetFormValidation();
                  }}
                  className="flex-1 px-4 sm:px-5 py-2.5 sm:py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-sm sm:text-base hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={hasFormErrors}
                  className="flex-1 px-4 sm:px-5 py-2.5 sm:py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-semibold text-sm sm:text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {editingReminder ? 'Update' : 'Create'}
                </button>
              </div>

              {/* Safe area spacing for mobile */}
              <div className="h-2 sm:h-0" />
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reminders;
