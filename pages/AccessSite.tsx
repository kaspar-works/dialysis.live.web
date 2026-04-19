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
  {
    key: 'infiltration', label: 'Infiltration', icon: '💧',
    explain: 'Fluid leaking outside the vessel.',
    action: 'Stop needle use at this site. Switch to a different site next session.',
  },
  {
    key: 'signsOfInfection', label: 'Infection signs', icon: '🔥',
    explain: 'Redness, warmth, or drainage around the access.',
    action: 'Monitor site closely. Contact your care team if it worsens.',
  },
  {
    key: 'swelling', label: 'Swelling', icon: '📈',
    explain: 'Fluid buildup around the site.',
    action: 'Note if it grows. Report to your care team at next contact.',
  },
  {
    key: 'pain', label: 'Pain', icon: '⚡',
    explain: 'Discomfort at or around the access site.',
    action: 'Record intensity. Tell your care team if it\u2019s new or worsening.',
  },
  {
    key: 'bleeding', label: 'Bleeding', icon: '🩸',
    explain: 'Active bleeding from the access site.',
    action: 'Apply firm pressure. Seek immediate help if it doesn\u2019t stop within 10 minutes.',
  },
  {
    key: 'clotting', label: 'Clotting', icon: '🚫',
    explain: 'Reduced thrill/bruit can suggest thrombosis.',
    action: 'Contact your care team urgently for evaluation.',
  },
  {
    key: 'stenosis', label: 'Stenosis', icon: '↘️',
    explain: 'Narrowing of the access vessel.',
    action: 'A scheduled intervention may be needed. Flag at your next clinic visit.',
  },
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
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
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

  // Derived summary data for the top status card
  const now = Date.now();
  const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;
  const recentComplications = events.filter(
    e => e.eventType === AccessSiteEventType.COMPLICATION && new Date(e.date).getTime() > twoWeeksAgo
  );
  const lastAssessment = events.find(e => e.eventType === AccessSiteEventType.ASSESSMENT);
  const primaryAccess = events[0]
    ? { type: getAccessTypeLabel(events[0].accessType), site: getSiteLabel(events[0].site) }
    : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24" style={{ color: '#2F8F87' }}>
        <div className="w-10 h-10 rounded-full animate-spin" style={{ border: '4px solid #E6E1D7', borderTopColor: '#4EC7B8' }} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: '#4EC7B8', color: '#fff', opacity: 0.9 }}>Vascular access</span>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1F2D2A] tracking-tight mt-2">Access site</h1>
          <p className="text-sm mt-1" style={{ color: '#7B7A74' }}>
            Track your vascular access assessments and care.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium" style={{ backgroundColor: '#EDE9E1', color: '#4A4F5C', border: '1px solid #E6E1D7' }}>🔒 Your vascular access data is private & secure</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium" style={{ backgroundColor: '#EDE9E1', color: '#4A4F5C', border: '1px solid #E6E1D7' }}>🏥 Designed for dialysis care tracking</span>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-5 py-3 text-white text-sm font-bold rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg, #4EC7B8 0%, #7ED6A7 100%)', boxShadow: '0 8px 24px -8px rgba(78,199,184,0.5)' }}
        >
          {showForm ? 'Cancel' : '+ Log event'}
        </button>
      </div>

      {/* Status summary card */}
      {primaryAccess && (
        <div
          className="rounded-3xl p-5 md:p-6 transition-all hover:shadow-md"
          style={{ background: 'linear-gradient(135deg, #D8E7F8 0%, #D6EFDD 100%)', border: '1px solid rgba(92,143,209,0.22)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-base">🩹</span>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: '#2F8F87' }}>Access site status</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatusTile
              icon="✅"
              tint="#D6EFDD"
              inkColor="#4FA872"
              label="Primary access"
              value={primaryAccess.type}
              sub={primaryAccess.site}
            />
            <StatusTile
              icon={recentComplications.length === 0 ? '✅' : recentComplications.length === 1 ? '⚠️' : '🚨'}
              tint={recentComplications.length === 0 ? '#D6EFDD' : recentComplications.length === 1 ? '#FBEBC7' : '#FFE2D6'}
              inkColor={recentComplications.length === 0 ? '#4FA872' : recentComplications.length === 1 ? '#C99638' : '#E87556'}
              label="Recent complications"
              value={`${recentComplications.length}`}
              sub={recentComplications.length === 0 ? 'All clear in last 14 days' : 'Logged in last 14 days'}
            />
            <StatusTile
              icon={lastAssessment ? (lastAssessment.thrillPresent && lastAssessment.bruitPresent ? '🟢' : '🟡') : '⚪'}
              tint={lastAssessment ? (lastAssessment.thrillPresent && lastAssessment.bruitPresent ? '#D6EFDD' : '#FBEBC7') : '#EDE9E1'}
              inkColor={lastAssessment ? (lastAssessment.thrillPresent && lastAssessment.bruitPresent ? '#4FA872' : '#C99638') : '#7B7A74'}
              label="Last assessment"
              value={lastAssessment ? (lastAssessment.thrillPresent && lastAssessment.bruitPresent ? 'Stable' : 'Check findings') : 'None yet'}
              sub={lastAssessment ? new Date(lastAssessment.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : 'Log your first assessment'}
            />
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#FAF7F1] rounded-2xl p-5 space-y-5 border border-[#E6E1D7]">
          {/* Event Type */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: '#2F8F87' }}>
              Event Type
            </label>
            <div className="flex gap-2">
              {EVENT_TYPES.map(t => {
                const active = formData.eventType === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, eventType: t.value }))}
                    className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      active ? 'text-white' : 'bg-white text-[#4A4F5C] border border-[#E6E1D7] hover:bg-[#EDE9E1]'
                    }`}
                    style={active ? { background: 'linear-gradient(135deg, #4EC7B8 0%, #7ED6A7 100%)' } : undefined}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Access Type */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: '#2F8F87' }}>
              Access Type
            </label>
            <div className="flex gap-2">
              {ACCESS_TYPES.map(t => {
                const active = formData.accessType === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, accessType: t.value }))}
                    className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      active ? 'text-white' : 'bg-white text-[#4A4F5C] border border-[#E6E1D7] hover:bg-[#EDE9E1]'
                    }`}
                    style={active ? { background: 'linear-gradient(135deg, #4EC7B8 0%, #7ED6A7 100%)' } : undefined}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Site Location */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: '#2F8F87' }}>
              Site location
            </label>
            <select
              value={formData.site}
              onChange={e => setFormData(p => ({ ...p, site: e.target.value as AccessSiteLocation }))}
              className="w-full bg-white rounded-xl px-4 py-3 font-semibold outline-none"
              style={{ color: '#1F2D2A', border: '1.5px solid #E6E1D7' }}
            >
              {SITE_LOCATIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Assessment Fields */}
          {formData.eventType === AccessSiteEventType.ASSESSMENT && (
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: '#2F8F87' }}>
                Assessment findings
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'thrillPresent' as const, label: 'Thrill' },
                  { key: 'bruitPresent' as const, label: 'Bruit' },
                ].map(item => {
                  const present = formData[item.key];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, [item.key]: !p[item.key] }))}
                      className="flex items-center justify-between gap-2 rounded-xl px-4 py-3 transition-all hover:-translate-y-0.5"
                      style={{
                        backgroundColor: present ? '#D6EFDD' : '#FFE2D6',
                        border: `1.5px solid ${present ? 'rgba(79,168,114,0.35)' : 'rgba(232,117,86,0.35)'}`,
                      }}
                    >
                      <span className="text-sm font-bold" style={{ color: '#1F2D2A' }}>{item.label}</span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold" style={{ color: present ? '#4FA872' : '#E87556' }}>
                        <span>{present ? '✅' : '❌'}</span>
                        {present ? 'Present' : 'Not present'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Complication Fields */}
          {formData.eventType === AccessSiteEventType.COMPLICATION && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: '#2F8F87' }}>
                  Complication signs
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMPLICATION_FLAGS.map(flag => {
                    const active = formData[flag.key];
                    return (
                      <button
                        key={flag.key}
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, [flag.key]: !p[flag.key] }))}
                        className="px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 inline-flex items-center gap-1.5"
                        style={
                          active
                            ? { backgroundColor: '#FFE2D6', color: '#E87556', border: '1.5px solid rgba(232,117,86,0.45)' }
                            : { backgroundColor: '#fff', color: '#4A4F5C', border: '1.5px solid #E6E1D7' }
                        }
                      >
                        <span>{flag.icon}</span>
                        {flag.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: '#2F8F87' }}>
                  Severity
                </label>
                <div className="flex gap-2">
                  {SEVERITY_OPTIONS.map(s => {
                    const active = formData.severity === s.value;
                    const activeBg = s.value === ComplicationSeverity.MILD
                      ? '#FBEBC7' : s.value === ComplicationSeverity.MODERATE
                      ? '#FFE2D6' : '#FFD4C4';
                    const activeFg = s.value === ComplicationSeverity.MILD
                      ? '#C99638' : s.value === ComplicationSeverity.MODERATE
                      ? '#E87556' : '#C0392B';
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, severity: s.value }))}
                        className="flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
                        style={
                          active
                            ? { backgroundColor: activeBg, color: activeFg, border: `1.5px solid ${activeFg}55` }
                            : { backgroundColor: '#fff', color: '#4A4F5C', border: '1.5px solid #E6E1D7' }
                        }
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Maintenance Fields */}
          {formData.eventType === AccessSiteEventType.MAINTENANCE && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: '#2F8F87' }}>
                  Needle site used
                </label>
                <input
                  type="text"
                  value={formData.needleSiteUsed}
                  onChange={e => setFormData(p => ({ ...p, needleSiteUsed: e.target.value }))}
                  placeholder="e.g. Arterial, Venous"
                  className="w-full bg-white rounded-xl px-4 py-3 font-semibold outline-none placeholder:font-normal"
                  style={{ color: '#1F2D2A', border: '1.5px solid #E6E1D7' }}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: '#2F8F87' }}>
                  Needle gauge
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.needleGauge}
                  onChange={e => setFormData(p => ({ ...p, needleGauge: e.target.value }))}
                  placeholder="e.g. 15"
                  className="w-full bg-white rounded-xl px-4 py-3 font-semibold outline-none placeholder:font-normal"
                  style={{ color: '#1F2D2A', border: '1.5px solid #E6E1D7' }}
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: '#2F8F87' }}>
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
              rows={3}
              placeholder="Additional observations..."
              className="w-full bg-white rounded-xl px-4 py-3 font-semibold outline-none resize-none placeholder:font-normal"
              style={{ color: '#1F2D2A', border: '1.5px solid #E6E1D7' }}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, #4EC7B8 0%, #7ED6A7 100%)', boxShadow: '0 8px 24px -8px rgba(78,199,184,0.5)' }}
          >
            {isSubmitting ? 'Saving…' : 'Save event'}
          </button>
        </form>
      )}

      {/* Filter + view mode toggle */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 overflow-x-auto">
          {[{ value: null, label: 'All' }, ...EVENT_TYPES].map(f => (
            <button
              key={f.value ?? 'all'}
              onClick={() => setFilterEventType(f.value as AccessSiteEventType | null)}
              className="px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all"
              style={
                filterEventType === f.value
                  ? { background: 'linear-gradient(135deg, #4EC7B8 0%, #7ED6A7 100%)', color: '#fff' }
                  : { backgroundColor: '#EDE9E1', color: '#4A4F5C', border: '1px solid #E6E1D7' }
              }
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="inline-flex items-center gap-1 p-1 rounded-full" style={{ backgroundColor: '#EDE9E1', border: '1px solid #E6E1D7' }}>
          {(['list', 'timeline'] as const).map(m => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className="px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all"
              style={
                viewMode === m
                  ? { background: 'linear-gradient(135deg, #4EC7B8 0%, #7ED6A7 100%)', color: '#fff' }
                  : { color: '#7B7A74' }
              }
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Events rendering */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-16 rounded-3xl" style={{ backgroundColor: '#EDE9E1', border: '1px solid #E6E1D7' }}>
          <div className="text-4xl mb-3">🩹</div>
          <p className="text-sm font-semibold" style={{ color: '#1F2D2A' }}>
            {filterEventType
              ? `No ${getEventTypeLabel(filterEventType).toLowerCase()} events yet.`
              : 'No access site events yet.'}
          </p>
          <p className="text-xs mt-1" style={{ color: '#7B7A74' }}>Log your first event to start tracking.</p>
        </div>
      ) : viewMode === 'timeline' ? (
        /* Timeline view */
        <div className="relative pl-6 border-l-2 space-y-5" style={{ borderColor: '#E6E1D7' }}>
          {filteredEvents.map(event => {
            const tone =
              event.eventType === AccessSiteEventType.COMPLICATION
                ? { bg: '#FFE2D6', fg: '#E87556', icon: '⚠️' }
                : event.eventType === AccessSiteEventType.ASSESSMENT
                  ? { bg: '#D8E7F8', fg: '#5C8FD1', icon: '✅' }
                  : { bg: '#D6EFDD', fg: '#4FA872', icon: '🔧' };
            return (
              <div key={event._id} className="relative">
                <div
                  className="absolute -left-[34px] top-2 w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-sm"
                  style={{ backgroundColor: tone.bg, border: `2px solid ${tone.fg}` }}
                >
                  {tone.icon}
                </div>
                <div className="rounded-2xl p-4 bg-white transition-all hover:-translate-y-0.5 hover:shadow-md" style={{ border: '1px solid #E6E1D7' }}>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-xs font-bold" style={{ color: tone.fg }}>
                        {new Date(event.date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <div className="text-sm font-bold mt-0.5" style={{ color: '#1F2D2A' }}>
                        {getEventTypeLabel(event.eventType)}
                        {event.eventType === AccessSiteEventType.COMPLICATION && event.severity && (
                          <span className="ml-2 text-xs font-semibold" style={{ color: tone.fg }}>· {event.severity}</span>
                        )}
                      </div>
                      <div className="text-xs" style={{ color: '#7B7A74' }}>{getAccessTypeLabel(event.accessType)} — {getSiteLabel(event.site)}</div>
                    </div>
                    <button onClick={() => handleDelete(event._id)} className="p-1 transition-colors" style={{ color: '#9B9A94' }} title="Delete">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List view — structured cards */
        <div className="space-y-3">
          {filteredEvents.map(event => (
            <div key={event._id} className="bg-white rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-md" style={{ border: '1px solid #E6E1D7' }}>
              {/* Top row */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <EventBadge type={event.eventType} />
                  {event.eventType === AccessSiteEventType.COMPLICATION && event.severity && (
                    <SeverityBadge severity={event.severity} />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold" style={{ color: '#7B7A74' }}>
                    {new Date(event.date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <button onClick={() => handleDelete(event._id)} className="p-1 transition-colors hover:text-[#E87556]" style={{ color: '#9B9A94' }} title="Delete">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Middle row */}
              <div className="text-sm font-bold mb-3" style={{ color: '#1F2D2A' }}>
                {getAccessTypeLabel(event.accessType)} · {getSiteLabel(event.site)}
              </div>

              {/* Bottom row — key findings */}
              {event.eventType === AccessSiteEventType.ASSESSMENT && (
                <div className="flex flex-wrap gap-2">
                  <FindingChip ok={event.thrillPresent} label="Thrill" />
                  <FindingChip ok={event.bruitPresent} label="Bruit" />
                </div>
              )}

              {event.eventType === AccessSiteEventType.COMPLICATION && (
                <div className="space-y-2">
                  {COMPLICATION_FLAGS.filter(f => event[f.key]).map(f => (
                    <div
                      key={f.key}
                      className="flex items-start gap-3 p-3 rounded-xl"
                      style={{ backgroundColor: '#FFE2D6', border: '1px solid rgba(232,117,86,0.25)' }}
                    >
                      <span className="text-base shrink-0">{f.icon}</span>
                      <div className="min-w-0">
                        <div className="text-sm font-bold" style={{ color: '#E87556' }}>{f.label}</div>
                        <div className="text-xs font-medium" style={{ color: '#1F2D2A' }}>{f.explain}</div>
                        <div className="text-[11px] mt-1 italic" style={{ color: '#4A4F5C' }}>→ {f.action}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {event.eventType === AccessSiteEventType.MAINTENANCE && (
                <div className="flex gap-4 text-xs flex-wrap" style={{ color: '#4A4F5C' }}>
                  {event.needleSiteUsed && <span><span className="font-semibold">Needle site:</span> {event.needleSiteUsed}</span>}
                  {event.needleGauge && <span><span className="font-semibold">Gauge:</span> {event.needleGauge}G</span>}
                </div>
              )}

              {event.notes && (
                <p className="text-xs italic mt-3 pt-3" style={{ color: '#7B7A74', borderTop: '1px dashed #E6E1D7' }}>
                  {event.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* AI Insight */}
      {filteredEvents.length > 0 && (
        <div
          className="rounded-3xl p-5 mt-2"
          style={{ background: 'linear-gradient(135deg, #E4DAF2 0%, #D8E7F8 100%)', border: '1px solid rgba(138,111,196,0.22)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span>🧠</span>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: '#8A6FC4' }}>Access site insight</h3>
          </div>
          <ul className="space-y-2">
            {(() => {
              const tips: string[] = [];
              if (recentComplications.length >= 2) {
                tips.push('Multiple complications detected in the last 14 days.');
                tips.push('Monitor the access site closely for infection signs.');
                tips.push('Consider reaching out to your care team for a check.');
              } else if (recentComplications.length === 1) {
                tips.push('One complication in the last 14 days — keep an eye on it.');
                tips.push('Mention this at your next appointment.');
              } else if (lastAssessment && lastAssessment.thrillPresent && lastAssessment.bruitPresent) {
                tips.push('Last assessment shows both thrill and bruit — a good sign.');
                tips.push('Keep doing a quick daily check before each session.');
              } else if (lastAssessment && (!lastAssessment.thrillPresent || !lastAssessment.bruitPresent)) {
                tips.push('Last assessment missing thrill or bruit — worth re-checking.');
                tips.push('If it persists, flag with your care team.');
              } else {
                tips.push('No recent assessments. Try logging one today.');
              }
              return tips.map((t, i) => (
                <li key={i} className="flex items-start gap-2 px-3 py-2 rounded-xl bg-white/70">
                  <span className="text-sm shrink-0" style={{ color: '#8A6FC4' }}>•</span>
                  <span className="text-sm font-medium" style={{ color: '#1F2D2A' }}>{t}</span>
                </li>
              ));
            })()}
          </ul>
          <p className="text-[11px] mt-3" style={{ color: '#4A4F5C' }}>
            Based on your recent entries. Always discuss clinical concerns with your care team.
          </p>
        </div>
      )}
    </div>
  );
}

// Small reusable bits for the detail cards
const StatusTile: React.FC<{ icon: string; label: string; value: string; sub?: string; tint: string; inkColor: string }> = ({
  icon, label, value, sub, tint, inkColor,
}) => (
  <div className="rounded-2xl p-4" style={{ backgroundColor: tint, border: `1px solid ${inkColor}22` }}>
    <div className="flex items-center gap-2 mb-1">
      <span className="text-base">{icon}</span>
      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: inkColor }}>{label}</span>
    </div>
    <div className="text-lg font-bold" style={{ color: '#1F2D2A' }}>{value}</div>
    {sub && <div className="text-[11px] mt-0.5" style={{ color: '#4A4F5C' }}>{sub}</div>}
  </div>
);

const EventBadge: React.FC<{ type: AccessSiteEventType }> = ({ type }) => {
  const s =
    type === AccessSiteEventType.ASSESSMENT
      ? { bg: '#D8E7F8', fg: '#5C8FD1', icon: '✅' }
      : type === AccessSiteEventType.COMPLICATION
        ? { bg: '#FFE2D6', fg: '#E87556', icon: '⚠️' }
        : { bg: '#D6EFDD', fg: '#4FA872', icon: '🔧' };
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: s.bg, color: s.fg }}>
      <span>{s.icon}</span>
      {getEventTypeLabel(type)}
    </span>
  );
};

const SeverityBadge: React.FC<{ severity: ComplicationSeverity }> = ({ severity }) => {
  const s =
    severity === ComplicationSeverity.MILD
      ? { bg: '#FBEBC7', fg: '#C99638' }
      : severity === ComplicationSeverity.MODERATE
        ? { bg: '#FFE2D6', fg: '#E87556' }
        : { bg: '#FFD4C4', fg: '#C0392B' };
  return (
    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold capitalize" style={{ backgroundColor: s.bg, color: s.fg }}>
      {severity}
    </span>
  );
};

const FindingChip: React.FC<{ ok: boolean | undefined; label: string }> = ({ ok, label }) => (
  <span
    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
    style={
      ok
        ? { backgroundColor: '#D6EFDD', color: '#4FA872', border: '1px solid rgba(79,168,114,0.3)' }
        : { backgroundColor: '#FFE2D6', color: '#E87556', border: '1px solid rgba(232,117,86,0.3)' }
    }
  >
    <span>{ok ? '✅' : '❌'}</span>
    <span>{label}</span>
    <span style={{ color: ok ? '#4FA872aa' : '#E87556aa' }}>· {ok ? 'Present' : 'Absent'}</span>
  </span>
);
