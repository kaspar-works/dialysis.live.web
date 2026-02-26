import React, { useState, useEffect, useRef } from 'react';
import {
  AccessSiteEventType,
  AccessType,
  AccessSiteLocation,
  ComplicationSeverity,
  AccessSiteEvent,
  CreateAccessSiteEventData,
  createAccessSiteEvent,
  listAccessSiteEvents,
  deleteAccessSiteEvent,
  getEventTypeLabel,
  getAccessTypeLabel,
  getSiteLabel,
} from '../services/accessSite';

const EVENT_TYPES = [
  { value: AccessSiteEventType.ASSESSMENT, label: 'Assessment' },
  { value: AccessSiteEventType.COMPLICATION, label: 'Complication' },
  { value: AccessSiteEventType.MAINTENANCE, label: 'Maintenance' },
];

const ACCESS_TYPES = [
  { value: AccessType.FISTULA, label: 'AV Fistula' },
  { value: AccessType.GRAFT, label: 'AV Graft' },
  { value: AccessType.CATHETER, label: 'Catheter' },
];

const SITE_LOCATIONS = [
  { value: AccessSiteLocation.LEFT_UPPER_ARM, label: 'Left Upper Arm' },
  { value: AccessSiteLocation.LEFT_FOREARM, label: 'Left Forearm' },
  { value: AccessSiteLocation.RIGHT_UPPER_ARM, label: 'Right Upper Arm' },
  { value: AccessSiteLocation.RIGHT_FOREARM, label: 'Right Forearm' },
  { value: AccessSiteLocation.CHEST, label: 'Chest' },
  { value: AccessSiteLocation.NECK, label: 'Neck' },
  { value: AccessSiteLocation.GROIN, label: 'Groin' },
  { value: AccessSiteLocation.OTHER, label: 'Other' },
];

const SEVERITY_OPTIONS = [
  { value: ComplicationSeverity.MILD, label: 'Mild' },
  { value: ComplicationSeverity.MODERATE, label: 'Moderate' },
  { value: ComplicationSeverity.SEVERE, label: 'Severe' },
];

const COMPLICATION_FLAGS = [
  { key: 'signsOfInfection', label: 'Infection Signs' },
  { key: 'swelling', label: 'Swelling' },
  { key: 'pain', label: 'Pain' },
  { key: 'bleeding', label: 'Bleeding' },
  { key: 'clotting', label: 'Clotting' },
  { key: 'stenosis', label: 'Stenosis' },
  { key: 'infiltration', label: 'Infiltration' },
] as const;

type FormData = {
  eventType: AccessSiteEventType;
  accessType: AccessType;
  site: AccessSiteLocation;
  thrillPresent: boolean;
  bruitPresent: boolean;
  signsOfInfection: boolean;
  swelling: boolean;
  pain: boolean;
  bleeding: boolean;
  clotting: boolean;
  stenosis: boolean;
  infiltration: boolean;
  severity: ComplicationSeverity;
  needleSiteUsed: string;
  needleGauge: string;
  notes: string;
};

const DEFAULT_FORM: FormData = {
  eventType: AccessSiteEventType.ASSESSMENT,
  accessType: AccessType.FISTULA,
  site: AccessSiteLocation.LEFT_FOREARM,
  thrillPresent: false,
  bruitPresent: false,
  signsOfInfection: false,
  swelling: false,
  pain: false,
  bleeding: false,
  clotting: false,
  stenosis: false,
  infiltration: false,
  severity: ComplicationSeverity.MILD,
  needleSiteUsed: '',
  needleGauge: '',
  notes: '',
};

function getSeverityColor(severity: ComplicationSeverity): string {
  switch (severity) {
    case ComplicationSeverity.MILD:
      return 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400';
    case ComplicationSeverity.MODERATE:
      return 'bg-orange-500/15 text-orange-600 dark:text-orange-400';
    case ComplicationSeverity.SEVERE:
      return 'bg-red-500/15 text-red-600 dark:text-red-400';
    default:
      return 'bg-slate-500/15 text-slate-600 dark:text-slate-400';
  }
}

function getEventTypeColor(type: AccessSiteEventType): string {
  switch (type) {
    case AccessSiteEventType.ASSESSMENT:
      return 'bg-blue-500/15 text-blue-600 dark:text-blue-400';
    case AccessSiteEventType.COMPLICATION:
      return 'bg-red-500/15 text-red-600 dark:text-red-400';
    case AccessSiteEventType.MAINTENANCE:
      return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400';
    default:
      return 'bg-slate-500/15 text-slate-600 dark:text-slate-400';
  }
}

export default function AccessSite() {
  const [events, setEvents] = useState<AccessSiteEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>({ ...DEFAULT_FORM });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterEventType, setFilterEventType] = useState<AccessSiteEventType | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await listAccessSiteEvents({ limit: 50 });
      setEvents(data.events);
    } catch (err) {
      console.error('Failed to load access site events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload: CreateAccessSiteEventData = {
        eventType: formData.eventType,
        accessType: formData.accessType,
        site: formData.site,
        notes: formData.notes || undefined,
      };

      if (formData.eventType === AccessSiteEventType.ASSESSMENT) {
        payload.thrillPresent = formData.thrillPresent;
        payload.bruitPresent = formData.bruitPresent;
      }

      if (formData.eventType === AccessSiteEventType.COMPLICATION) {
        payload.signsOfInfection = formData.signsOfInfection;
        payload.swelling = formData.swelling;
        payload.pain = formData.pain;
        payload.bleeding = formData.bleeding;
        payload.clotting = formData.clotting;
        payload.stenosis = formData.stenosis;
        payload.infiltration = formData.infiltration;
        payload.severity = formData.severity;
      }

      if (formData.eventType === AccessSiteEventType.MAINTENANCE) {
        payload.needleSiteUsed = formData.needleSiteUsed || undefined;
        payload.needleGauge = formData.needleGauge ? parseInt(formData.needleGauge) : undefined;
      }

      await createAccessSiteEvent(payload);
      setShowForm(false);
      setFormData({ ...DEFAULT_FORM });
      hasFetched.current = false;
      setIsLoading(true);
      hasFetched.current = true;
      await loadData();
    } catch (err) {
      console.error('Failed to create access site event:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Delete this access site event?')) return;
    try {
      await deleteAccessSiteEvent(eventId);
      setEvents(prev => prev.filter(ev => ev._id !== eventId));
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const filteredEvents = filterEventType
    ? events.filter(ev => ev.eventType === filterEventType)
    : events;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Access Site</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track your vascular access assessments and care
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors"
        >
          {showForm ? 'Cancel' : '+ Log Event'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 space-y-5 border border-slate-200 dark:border-slate-800">
          {/* Event Type */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
              Event Type
            </label>
            <div className="flex gap-2">
              {EVENT_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, eventType: t.value }))}
                  className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    formData.eventType === t.value
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Access Type */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
              Access Type
            </label>
            <div className="flex gap-2">
              {ACCESS_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, accessType: t.value }))}
                  className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    formData.accessType === t.value
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Site Location */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
              Site Location
            </label>
            <select
              value={formData.site}
              onChange={e => setFormData(p => ({ ...p, site: e.target.value as AccessSiteLocation }))}
              className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none"
            >
              {SITE_LOCATIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Assessment Fields */}
          {formData.eventType === AccessSiteEventType.ASSESSMENT && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                Assessment Findings
              </label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 flex-1 bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.thrillPresent}
                    onChange={e => setFormData(p => ({ ...p, thrillPresent: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">Thrill Present</span>
                </label>
                <label className="flex items-center gap-2 flex-1 bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.bruitPresent}
                    onChange={e => setFormData(p => ({ ...p, bruitPresent: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">Bruit Present</span>
                </label>
              </div>
            </div>
          )}

          {/* Complication Fields */}
          {formData.eventType === AccessSiteEventType.COMPLICATION && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  Complication Signs
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMPLICATION_FLAGS.map(flag => (
                    <button
                      key={flag.key}
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, [flag.key]: !p[flag.key] }))}
                      className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                        formData[flag.key]
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {flag.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  Severity
                </label>
                <div className="flex gap-2">
                  {SEVERITY_OPTIONS.map(s => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, severity: s.value }))}
                      className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                        formData.severity === s.value
                          ? s.value === ComplicationSeverity.MILD
                            ? 'bg-yellow-500 text-white'
                            : s.value === ComplicationSeverity.MODERATE
                              ? 'bg-orange-500 text-white'
                              : 'bg-red-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Maintenance Fields */}
          {formData.eventType === AccessSiteEventType.MAINTENANCE && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  Needle Site Used
                </label>
                <input
                  type="text"
                  value={formData.needleSiteUsed}
                  onChange={e => setFormData(p => ({ ...p, needleSiteUsed: e.target.value }))}
                  placeholder="e.g. Arterial, Venous"
                  className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  Needle Gauge
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.needleGauge}
                  onChange={e => setFormData(p => ({ ...p, needleGauge: e.target.value }))}
                  placeholder="e.g. 15"
                  className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
              rows={3}
              placeholder="Additional observations..."
              className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none resize-none placeholder:text-slate-400 placeholder:font-normal"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
          >
            {isSubmitting ? 'Saving...' : 'Save Event'}
          </button>
        </form>
      )}

      {/* Filter Buttons */}
      <div className="flex gap-2 overflow-x-auto">
        {[
          { value: null, label: 'All' },
          ...EVENT_TYPES,
        ].map(f => (
          <button
            key={f.value ?? 'all'}
            onClick={() => setFilterEventType(f.value as AccessSiteEventType | null)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
              filterEventType === f.value
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Events List */}
      {filteredEvents.length > 0 ? (
        <div className="space-y-3">
          {filteredEvents.map(event => (
            <div key={event._id} className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Top row: event type badge + severity badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${getEventTypeColor(event.eventType)}`}>
                      {getEventTypeLabel(event.eventType)}
                    </span>
                    {event.eventType === AccessSiteEventType.COMPLICATION && event.severity && (
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${getSeverityColor(event.severity)}`}>
                        {event.severity.charAt(0).toUpperCase() + event.severity.slice(1)}
                      </span>
                    )}
                  </div>

                  {/* Access type and site */}
                  <div className="text-sm font-medium text-slate-900 dark:text-white">
                    {getAccessTypeLabel(event.accessType)} -- {getSiteLabel(event.site)}
                  </div>

                  {/* Assessment details */}
                  {event.eventType === AccessSiteEventType.ASSESSMENT && (
                    <div className="flex gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span>Thrill: {event.thrillPresent ? 'Yes' : 'No'}</span>
                      <span>Bruit: {event.bruitPresent ? 'Yes' : 'No'}</span>
                    </div>
                  )}

                  {/* Complication details */}
                  {event.eventType === AccessSiteEventType.COMPLICATION && (
                    <div className="flex flex-wrap gap-1.5">
                      {COMPLICATION_FLAGS.filter(f => event[f.key]).map(f => (
                        <span
                          key={f.key}
                          className="inline-block px-2 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium"
                        >
                          {f.label}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Maintenance details */}
                  {event.eventType === AccessSiteEventType.MAINTENANCE && (
                    <div className="flex gap-3 text-xs text-slate-500 dark:text-slate-400">
                      {event.needleSiteUsed && <span>Needle Site: {event.needleSiteUsed}</span>}
                      {event.needleGauge && <span>Gauge: {event.needleGauge}G</span>}
                    </div>
                  )}

                  {/* Notes */}
                  {event.notes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic">{event.notes}</p>
                  )}

                  {/* Date */}
                  <div className="text-xs text-slate-400 dark:text-slate-500">
                    {new Date(event.date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => handleDelete(event._id)}
                  className="text-slate-400 hover:text-red-500 transition-colors p-1 shrink-0"
                  title="Delete"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {filterEventType
              ? `No ${getEventTypeLabel(filterEventType).toLowerCase()} events yet.`
              : 'No access site events yet. Log an event to get started.'}
          </p>
        </div>
      )}
    </div>
  );
}
