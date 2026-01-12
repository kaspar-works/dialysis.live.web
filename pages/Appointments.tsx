import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants';
import { useAlert } from '../contexts/AlertContext';
import {
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  confirmAppointment,
  cancelAppointment,
  completeAppointment,
  getUpcomingAppointments,
  getAppointmentStats,
  Appointment,
  AppointmentType,
  AppointmentStatus,
  AppointmentStats,
  CreateAppointmentData,
  APPOINTMENT_TYPE_LABELS,
  APPOINTMENT_TYPE_ICONS,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_COLORS,
  formatAppointmentTime,
  formatAppointmentDate,
  getRelativeDate,
  getDurationString,
} from '../services/appointments';

const Appointments: React.FC = () => {
  const { showConfirm, showError, showSuccess } = useAlert();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'all' | 'past'>('upcoming');
  const [filterType, setFilterType] = useState<AppointmentType | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateAppointmentData>({
    title: '',
    description: '',
    type: 'checkup',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '',
    location: '',
    address: '',
    provider: { name: '', specialty: '', phone: '' },
    notes: '',
    reminderEnabled: true,
    reminderMinutesBefore: 60,
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

  const validateDate = (value: string): string => {
    if (!value) return 'Date is required';
    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Allow dates up to 1 year in the future
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    if (selectedDate > maxDate) {
      return 'Date cannot be more than 1 year in the future';
    }
    return '';
  };

  const validateStartTime = (value: string): string => {
    if (!value) return 'Start time is required';
    return '';
  };

  const validateEndTime = (startTime: string, endTime: string): string => {
    if (endTime && startTime) {
      if (endTime <= startTime) {
        return 'End time must be after start time';
      }
    }
    return '';
  };

  const validateLocation = (value: string): string => {
    if (value && value.length > 100) return 'Location cannot exceed 100 characters';
    return '';
  };

  const validateAddress = (value: string): string => {
    if (value && value.length > 200) return 'Address cannot exceed 200 characters';
    return '';
  };

  const validateProviderPhone = (value: string): string => {
    if (value && value.length > 0) {
      // Basic phone validation - allow digits, spaces, dashes, parens, plus
      const phoneRegex = /^[+]?[\d\s\-()]{7,20}$/;
      if (!phoneRegex.test(value)) {
        return 'Enter a valid phone number';
      }
    }
    return '';
  };

  const validateDescription = (value: string): string => {
    if (value && value.length > 500) return 'Description cannot exceed 500 characters';
    return '';
  };

  const validateNotes = (value: string): string => {
    if (value && value.length > 500) return 'Notes cannot exceed 500 characters';
    return '';
  };

  // Handle field change with validation
  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touchedFields[field]) {
      let error = '';
      switch (field) {
        case 'title': error = validateTitle(value); break;
        case 'date': error = validateDate(value); break;
        case 'startTime': error = validateStartTime(value); break;
        case 'endTime': error = validateEndTime(formData.startTime, value); break;
        case 'location': error = validateLocation(value); break;
        case 'address': error = validateAddress(value); break;
        case 'description': error = validateDescription(value); break;
        case 'notes': error = validateNotes(value); break;
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
      case 'date': error = validateDate(formData.date); break;
      case 'startTime': error = validateStartTime(formData.startTime); break;
      case 'endTime': error = validateEndTime(formData.startTime, formData.endTime || ''); break;
      case 'location': error = validateLocation(formData.location || ''); break;
      case 'address': error = validateAddress(formData.address || ''); break;
      case 'description': error = validateDescription(formData.description || ''); break;
      case 'notes': error = validateNotes(formData.notes || ''); break;
    }
    setFieldErrors(prev => ({ ...prev, [field]: error }));
  };

  // Handle provider field change
  const handleProviderChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      provider: { ...prev.provider, [field]: value },
    }));
    if (touchedFields[`provider_${field}`] && field === 'phone') {
      const error = validateProviderPhone(value);
      setFieldErrors(prev => ({ ...prev, [`provider_${field}`]: error }));
    }
  };

  // Handle provider field blur
  const handleProviderBlur = (field: string) => {
    setTouchedFields(prev => ({ ...prev, [`provider_${field}`]: true }));
    if (field === 'phone') {
      const error = validateProviderPhone(formData.provider?.phone || '');
      setFieldErrors(prev => ({ ...prev, [`provider_${field}`]: error }));
    }
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
      const [allAppointments, upcomingAppointments, appointmentStats] = await Promise.all([
        getAppointments(),
        getUpcomingAppointments(14),
        getAppointmentStats(),
      ]);
      setAppointments(allAppointments);
      setUpcoming(upcomingAppointments);
      setStats(appointmentStats);
    } catch (err: any) {
      console.error('Failed to fetch appointments:', err);
      setError(err.message || 'Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Mark all fields as touched
    const fieldsToValidate = ['title', 'date', 'startTime', 'endTime', 'location', 'address', 'description', 'notes', 'provider_phone'];
    const newTouchedFields: Record<string, boolean> = {};
    fieldsToValidate.forEach(field => { newTouchedFields[field] = true; });
    setTouchedFields(newTouchedFields);

    // Validate all fields
    const newErrors: Record<string, string> = {
      title: validateTitle(formData.title),
      date: validateDate(formData.date),
      startTime: validateStartTime(formData.startTime),
      endTime: validateEndTime(formData.startTime, formData.endTime || ''),
      location: validateLocation(formData.location || ''),
      address: validateAddress(formData.address || ''),
      description: validateDescription(formData.description || ''),
      notes: validateNotes(formData.notes || ''),
      provider_phone: validateProviderPhone(formData.provider?.phone || ''),
    };
    setFieldErrors(newErrors);

    // Check for validation errors
    const hasErrors = Object.values(newErrors).some(error => error !== '');
    if (hasErrors) {
      return;
    }

    try {
      if (editingAppointment) {
        await updateAppointment(editingAppointment._id, formData);
      } else {
        await createAppointment(formData);
      }
      setShowModal(false);
      setEditingAppointment(null);
      resetForm();
      resetFormValidation();
      fetchData();
    } catch (err: any) {
      console.error('Appointment save error:', err);
      // Handle validation errors from API
      if (err.errors && Array.isArray(err.errors)) {
        const errorMessages = err.errors.map((e: any) => e.msg || e.message).join(', ');
        setError(errorMessages || 'Validation failed');
      } else {
        setError(err.message || 'Failed to save appointment');
      }
    }
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setFormData({
      title: appointment.title,
      description: appointment.description || '',
      type: appointment.type,
      date: appointment.date.split('T')[0],
      startTime: appointment.startTime,
      endTime: appointment.endTime || '',
      location: appointment.location || '',
      address: appointment.address || '',
      provider: appointment.provider || { name: '', specialty: '', phone: '' },
      notes: appointment.notes || '',
      reminderEnabled: appointment.reminderEnabled,
      reminderMinutesBefore: appointment.reminderMinutesBefore || 60,
    });
    setShowModal(true);
  };

  const handleDelete = (appointmentId: string) => {
    showConfirm(
      'Delete Appointment',
      'Are you sure you want to delete this appointment? This action cannot be undone.',
      async () => {
        try {
          await deleteAppointment(appointmentId);
          showSuccess('Deleted', 'Appointment has been deleted successfully.');
          fetchData();
        } catch (err: any) {
          showError('Error', err.message || 'Failed to delete appointment');
        }
      },
      { confirmText: 'Delete', cancelText: 'Keep' }
    );
  };

  const handleConfirmAppointment = async (appointmentId: string) => {
    try {
      await confirmAppointment(appointmentId);
      showSuccess('Confirmed', 'Appointment has been confirmed.');
      fetchData();
    } catch (err: any) {
      showError('Error', err.message || 'Failed to confirm appointment');
    }
  };

  const handleCancelAppointment = (appointmentId: string) => {
    showConfirm(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      async () => {
        try {
          await cancelAppointment(appointmentId);
          showSuccess('Cancelled', 'Appointment has been cancelled.');
          fetchData();
        } catch (err: any) {
          showError('Error', err.message || 'Failed to cancel appointment');
        }
      },
      { confirmText: 'Yes, Cancel', cancelText: 'No, Keep' }
    );
  };

  const handleComplete = async (appointmentId: string) => {
    try {
      await completeAppointment(appointmentId);
      showSuccess('Completed', 'Appointment marked as completed.');
      fetchData();
    } catch (err: any) {
      showError('Error', err.message || 'Failed to complete appointment');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'checkup',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '',
      location: '',
      address: '',
      provider: { name: '', specialty: '', phone: '' },
      notes: '',
      reminderEnabled: true,
      reminderMinutesBefore: 60,
    });
  };

  const getFilteredAppointments = () => {
    let filtered = appointments;

    if (activeTab === 'upcoming') {
      filtered = upcoming;
    } else if (activeTab === 'past') {
      const now = new Date();
      filtered = appointments.filter((apt) => new Date(apt.date) < now);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter((apt) => apt.type === filterType);
    }

    return filtered;
  };

  const displayAppointments = getFilteredAppointments();

  const getStatusColor = (status: AppointmentStatus) => {
    const colors = APPOINTMENT_STATUS_COLORS[status] || 'slate';
    return {
      bg: `bg-${colors}-100 dark:bg-${colors}-500/20`,
      text: `text-${colors}-600 dark:text-${colors}-400`,
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 relative mx-auto">
            <div className="absolute inset-0 border-4 border-sky-500/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-sky-500 rounded-full animate-spin" />
          </div>
          <p className="text-slate-400 text-sm font-medium">Loading appointments...</p>
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
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Appointments</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage your medical appointments
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingAppointment(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-5 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-semibold transition-colors"
        >
          <ICONS.Plus className="w-5 h-5" />
          New Appointment
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
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Upcoming</p>
            <p className="text-3xl font-black text-sky-600">{stats.upcoming}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">This Month</p>
            <p className="text-3xl font-black text-emerald-600">{stats.thisMonth}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Completed</p>
            <p className="text-3xl font-black text-slate-400">{stats.byStatus?.completed || 0}</p>
          </div>
        </div>
      )}

      {/* Tabs & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
          {(['upcoming', 'all', 'past'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all capitalize ${
                activeTab === tab
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as AppointmentType | 'all')}
          className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          <option value="all">All Types</option>
          {Object.entries(APPOINTMENT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {APPOINTMENT_TYPE_ICONS[value as AppointmentType]} {label}
            </option>
          ))}
        </select>
      </div>

      {/* Appointments List */}
      {displayAppointments.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-4xl">
            📅
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            No appointments found
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            {activeTab === 'upcoming'
              ? 'You have no upcoming appointments'
              : 'Schedule your first appointment to get started'}
          </p>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-semibold transition-colors"
          >
            <ICONS.Plus className="w-5 h-5" />
            Schedule Appointment
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {displayAppointments.map((appointment) => (
            <div
              key={appointment._id}
              className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 transition-all hover:shadow-lg"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-sky-100 dark:bg-sky-500/20 flex items-center justify-center text-2xl flex-shrink-0">
                  {APPOINTMENT_TYPE_ICONS[appointment.type]}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                        {appointment.title}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {APPOINTMENT_TYPE_LABELS[appointment.type]}
                        {appointment.provider?.name && ` • ${appointment.provider.name}`}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        appointment.status === 'scheduled'
                          ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400'
                          : appointment.status === 'confirmed'
                          ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : appointment.status === 'completed'
                          ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                          : appointment.status === 'cancelled'
                          ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400'
                          : 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {APPOINTMENT_STATUS_LABELS[appointment.status]}
                    </span>
                  </div>

                  {/* Date/Time & Location */}
                  <div className="flex flex-wrap items-center gap-4 mt-3">
                    <div className="flex items-center gap-2 text-sm">
                      <ICONS.Calendar className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {getRelativeDate(appointment.date)}
                      </span>
                      <span className="text-slate-500">
                        {formatAppointmentTime(appointment.startTime)}
                        {appointment.endTime && ` - ${formatAppointmentTime(appointment.endTime)}`}
                      </span>
                    </div>
                    {appointment.location && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {appointment.location}
                      </div>
                    )}
                    {appointment.duration && (
                      <span className="text-sm text-slate-400">
                        {getDurationString(appointment.duration)}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {appointment.description && (
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                      {appointment.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    {appointment.status === 'scheduled' && (
                      <button
                        onClick={() => handleConfirmAppointment(appointment._id)}
                        className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-semibold hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-colors"
                      >
                        Confirm
                      </button>
                    )}
                    {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                      <>
                        <button
                          onClick={() => handleComplete(appointment._id)}
                          className="px-3 py-1.5 bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 rounded-lg text-xs font-semibold hover:bg-sky-200 dark:hover:bg-sky-500/30 transition-colors"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => handleCancelAppointment(appointment._id)}
                          className="px-3 py-1.5 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-semibold hover:bg-rose-200 dark:hover:bg-rose-500/30 transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleEdit(appointment)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(appointment._id)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
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
          <div className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            {/* Mobile drag indicator */}
            <div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mt-3 sm:hidden" />

            <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {editingAppointment ? 'Edit Appointment' : 'New Appointment'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingAppointment(null);
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
                  placeholder="e.g., Nephrologist Consultation"
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

              {/* Type */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Type *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(APPOINTMENT_TYPE_LABELS).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: value as AppointmentType })}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        formData.type === value
                          ? 'bg-sky-500 border-sky-500 text-white'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-sky-300'
                      }`}
                    >
                      <span>{APPOINTMENT_TYPE_ICONS[value as AppointmentType]}</span>
                      <span className="truncate">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleFieldChange('date', e.target.value)}
                    onBlur={() => handleFieldBlur('date')}
                    className={`w-full px-4 py-3 rounded-xl text-slate-900 dark:text-white focus:outline-none transition-all ${
                      fieldErrors.date && touchedFields.date
                        ? 'bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-400 dark:border-rose-500'
                        : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-sky-500'
                    }`}
                  />
                  {fieldErrors.date && touchedFields.date && (
                    <p className="text-xs text-rose-500 mt-1">{fieldErrors.date}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Start Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleFieldChange('startTime', e.target.value)}
                    onBlur={() => handleFieldBlur('startTime')}
                    className={`w-full px-4 py-3 rounded-xl text-slate-900 dark:text-white focus:outline-none transition-all ${
                      fieldErrors.startTime && touchedFields.startTime
                        ? 'bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-400 dark:border-rose-500'
                        : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-sky-500'
                    }`}
                  />
                  {fieldErrors.startTime && touchedFields.startTime && (
                    <p className="text-xs text-rose-500 mt-1">{fieldErrors.startTime}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleFieldChange('endTime', e.target.value)}
                    onBlur={() => handleFieldBlur('endTime')}
                    className={`w-full px-4 py-3 rounded-xl text-slate-900 dark:text-white focus:outline-none transition-all ${
                      fieldErrors.endTime && touchedFields.endTime
                        ? 'bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-400 dark:border-rose-500'
                        : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-sky-500'
                    }`}
                  />
                  {fieldErrors.endTime && touchedFields.endTime && (
                    <p className="text-xs text-rose-500 mt-1">{fieldErrors.endTime}</p>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleFieldChange('location', e.target.value)}
                    onBlur={() => handleFieldBlur('location')}
                    placeholder="e.g., City Hospital"
                    className={`w-full px-4 py-3 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition-all ${
                      fieldErrors.location && touchedFields.location
                        ? 'bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-400 dark:border-rose-500'
                        : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-sky-500'
                    }`}
                  />
                  {fieldErrors.location && touchedFields.location && (
                    <p className="text-xs text-rose-500 mt-1">{fieldErrors.location}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleFieldChange('address', e.target.value)}
                    onBlur={() => handleFieldBlur('address')}
                    placeholder="Full address"
                    className={`w-full px-4 py-3 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition-all ${
                      fieldErrors.address && touchedFields.address
                        ? 'bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-400 dark:border-rose-500'
                        : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-sky-500'
                    }`}
                  />
                  {fieldErrors.address && touchedFields.address && (
                    <p className="text-xs text-rose-500 mt-1">{fieldErrors.address}</p>
                  )}
                </div>
              </div>

              {/* Provider Info */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Provider Details
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <input
                    type="text"
                    value={formData.provider?.name || ''}
                    onChange={(e) => handleProviderChange('name', e.target.value)}
                    placeholder="Doctor name"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <input
                    type="text"
                    value={formData.provider?.specialty || ''}
                    onChange={(e) => handleProviderChange('specialty', e.target.value)}
                    placeholder="Specialty"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <div>
                    <input
                      type="tel"
                      value={formData.provider?.phone || ''}
                      onChange={(e) => handleProviderChange('phone', e.target.value)}
                      onBlur={() => handleProviderBlur('phone')}
                      placeholder="Phone"
                      className={`w-full px-4 py-3 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition-all ${
                        fieldErrors.provider_phone && touchedFields.provider_phone
                          ? 'bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-400 dark:border-rose-500'
                          : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-sky-500'
                      }`}
                    />
                    {fieldErrors.provider_phone && touchedFields.provider_phone && (
                      <p className="text-xs text-rose-500 mt-1">{fieldErrors.provider_phone}</p>
                    )}
                  </div>
                </div>
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
                  placeholder="Additional details about the appointment..."
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

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  onBlur={() => handleFieldBlur('notes')}
                  placeholder="Personal notes, things to remember..."
                  rows={2}
                  className={`w-full px-4 py-3 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none resize-none transition-all ${
                    fieldErrors.notes && touchedFields.notes
                      ? 'bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-400 dark:border-rose-500'
                      : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-sky-500'
                  }`}
                />
                {fieldErrors.notes && touchedFields.notes && (
                  <p className="text-xs text-rose-500 mt-1">{fieldErrors.notes}</p>
                )}
              </div>

              {/* Reminder */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <div className="flex items-center gap-3">
                  <ICONS.Bell className="w-5 h-5 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Reminder
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={formData.reminderMinutesBefore}
                    onChange={(e) =>
                      setFormData({ ...formData, reminderMinutesBefore: Number(e.target.value) })
                    }
                    disabled={!formData.reminderEnabled}
                    className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm disabled:opacity-50"
                  >
                    <option value={15}>15 min before</option>
                    <option value={30}>30 min before</option>
                    <option value={60}>1 hour before</option>
                    <option value={120}>2 hours before</option>
                    <option value={1440}>1 day before</option>
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, reminderEnabled: !formData.reminderEnabled })
                    }
                    className={`relative w-12 h-7 rounded-full transition-colors ${
                      formData.reminderEnabled ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                        formData.reminderEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 pt-3 sm:pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingAppointment(null);
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
                  {editingAppointment ? 'Update' : 'Create'}
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

export default Appointments;
