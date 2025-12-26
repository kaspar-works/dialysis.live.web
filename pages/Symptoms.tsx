import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ICONS } from '../constants';
import { SymptomType } from '../types';
import { createSymptomLog, getSymptomLogs, SymptomLog } from '../services/symptoms';

const symptomConfig: Record<SymptomType, { label: string; icon: string; color: string }> = {
  [SymptomType.CRAMPING]: { label: 'Cramping', icon: '💪', color: '#f43f5e' },
  [SymptomType.NAUSEA]: { label: 'Nausea', icon: '🤢', color: '#10b981' },
  [SymptomType.HEADACHE]: { label: 'Headache', icon: '🤕', color: '#a855f7' },
  [SymptomType.DIZZINESS]: { label: 'Dizziness', icon: '😵‍💫', color: '#f59e0b' },
  [SymptomType.FATIGUE]: { label: 'Fatigue', icon: '😴', color: '#6366f1' },
  [SymptomType.SHORTNESS_OF_BREATH]: { label: 'Breathing', icon: '😮‍💨', color: '#0ea5e9' },
  [SymptomType.ITCHING]: { label: 'Itching', icon: '🫳', color: '#ec4899' },
  [SymptomType.CHEST_PAIN]: { label: 'Chest Pain', icon: '💔', color: '#ef4444' },
  [SymptomType.LOW_BP]: { label: 'Low BP', icon: '📉', color: '#8b5cf6' },
  [SymptomType.MUSCLE_WEAKNESS]: { label: 'Weakness', icon: '🦵', color: '#f97316' },
  [SymptomType.RESTLESS_LEGS]: { label: 'Restless', icon: '🦶', color: '#14b8a6' },
  [SymptomType.INSOMNIA]: { label: 'Insomnia', icon: '🌙', color: '#7c3aed' },
  [SymptomType.OTHER]: { label: 'Other', icon: '📝', color: '#64748b' },
};

const Symptoms: React.FC = () => {
  const [symptoms, setSymptoms] = useState<SymptomLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSymptom, setSelectedSymptom] = useState<SymptomType | null>(null);
  const [severity, setSeverity] = useState(3);
  const [isLogging, setIsLogging] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchSymptoms();
  }, []);

  const fetchSymptoms = async () => {
    setIsLoading(true);
    try {
      const response = await getSymptomLogs({ limit: 50 });
      setSymptoms(response.logs);
    } catch (err) {
      console.error('Failed to fetch symptoms:', err);
      setError('Failed to load symptoms');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLog = async (type: SymptomType, sev: number) => {
    setIsLogging(true);
    try {
      const newSymptom = await createSymptomLog({
        symptomType: type,
        severity: sev,
        loggedAt: new Date().toISOString(),
      });
      setSymptoms(prev => [newSymptom, ...prev]);
      setSelectedSymptom(null);
      setSeverity(3);
    } catch (err) {
      console.error('Failed to log symptom:', err);
      setError('Failed to log symptom');
    } finally {
      setIsLogging(false);
    }
  };

  const todaySymptoms = useMemo(() => {
    const today = new Date().toDateString();
    return symptoms.filter(s => new Date(s.loggedAt).toDateString() === today);
  }, [symptoms]);

  const symptomCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    symptoms.forEach(s => {
      counts[s.symptomType] = (counts[s.symptomType] || 0) + 1;
    });
    return counts;
  }, [symptoms]);

  const topSymptoms = useMemo(() => {
    return Object.entries(symptomCounts)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 4)
      .map(([type]) => type as SymptomType);
  }, [symptomCounts]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-24 px-4">
      {/* Header */}
      <header className="text-center space-y-2">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          How are you feeling?
        </h1>
        <p className="text-slate-400 text-lg">Tap a symptom to log it</p>
      </header>

      {/* Error */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center justify-between">
          <p className="text-rose-500 font-medium">{error}</p>
          <button onClick={() => setError(null)} className="text-rose-500">
            <ICONS.X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Quick Log Section */}
      {topSymptoms.length > 0 && !selectedSymptom && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
            Quick Log
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            {topSymptoms.map(type => {
              const config = symptomConfig[type];
              return (
                <button
                  key={type}
                  onClick={() => setSelectedSymptom(type)}
                  className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:scale-105 hover:shadow-lg transition-all"
                >
                  <span className="text-2xl">{config.icon}</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{config.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Severity Selector - Shows when symptom is selected */}
      {selectedSymptom && (
        <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-700 shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-3">
              <span className="text-5xl">{symptomConfig[selectedSymptom].icon}</span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {symptomConfig[selectedSymptom].label}
              </h3>
            </div>

            <p className="text-slate-400">How severe is it?</p>

            {/* Visual Severity Picker */}
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map(level => (
                <button
                  key={level}
                  onClick={() => setSeverity(level)}
                  className={`relative w-14 h-14 rounded-2xl font-black text-xl transition-all ${
                    severity === level
                      ? 'scale-125 shadow-xl'
                      : 'opacity-50 hover:opacity-100 hover:scale-110'
                  }`}
                  style={{
                    backgroundColor: severity === level
                      ? symptomConfig[selectedSymptom].color
                      : undefined,
                    color: severity === level ? 'white' : undefined,
                  }}
                >
                  <span className={severity !== level ? 'text-slate-400' : ''}>{level}</span>
                  {severity === level && (
                    <div
                      className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-bold whitespace-nowrap"
                      style={{ color: symptomConfig[selectedSymptom].color }}
                    >
                      {['', 'Mild', 'Light', 'Moderate', 'Strong', 'Severe'][level]}
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-3 pt-6">
              <button
                onClick={() => setSelectedSymptom(null)}
                className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 rounded-2xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleQuickLog(selectedSymptom, severity)}
                disabled={isLogging}
                className="flex-1 py-4 rounded-2xl font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: symptomConfig[selectedSymptom].color }}
              >
                {isLogging ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ICONS.Plus className="w-5 h-5" />
                    Log
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Symptoms Grid */}
      {!selectedSymptom && (
        <div className="space-y-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
            All Symptoms
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {Object.entries(symptomConfig).map(([type, config]) => (
              <button
                key={type}
                onClick={() => setSelectedSymptom(type as SymptomType)}
                className="group relative bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:scale-105 hover:-translate-y-1 transition-all duration-300"
              >
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity"
                  style={{ backgroundColor: config.color }}
                />
                <div className="relative text-center space-y-2">
                  <span className="text-3xl block group-hover:scale-110 transition-transform">
                    {config.icon}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    {config.label}
                  </span>
                </div>
                {symptomCounts[type] && (
                  <div
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center"
                    style={{ backgroundColor: config.color }}
                  >
                    {symptomCounts[type]}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Today's Log */}
      {!selectedSymptom && todaySymptoms.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Today's Log
            </p>
            <span className="text-xs font-bold text-slate-400">
              {todaySymptoms.length} logged
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {todaySymptoms.map(symptom => {
              const config = symptomConfig[symptom.symptomType];
              return (
                <div
                  key={symptom._id}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-full border border-slate-100 dark:border-slate-700"
                >
                  <span className="text-lg">{config?.icon}</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {config?.label}
                  </span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div
                        key={i}
                        className={`w-1.5 h-4 rounded-full ${
                          i <= symptom.severity ? '' : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                        style={{
                          backgroundColor: i <= symptom.severity ? config?.color : undefined,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(symptom.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* History */}
      {!selectedSymptom && !isLoading && (
        <div className="space-y-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Recent History
          </p>

          {symptoms.length > 0 ? (
            <div className="space-y-2">
              {symptoms.slice(0, 15).map(symptom => {
                const config = symptomConfig[symptom.symptomType];
                const isToday = new Date(symptom.loggedAt).toDateString() === new Date().toDateString();

                return (
                  <div
                    key={symptom._id}
                    className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all"
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                      style={{ backgroundColor: `${config?.color}15` }}
                    >
                      {config?.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {config?.label}
                      </p>
                      <p className="text-xs text-slate-400">
                        {isToday ? 'Today' : new Date(symptom.loggedAt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                        {' · '}
                        {new Date(symptom.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div
                            key={i}
                            className={`w-2 h-6 rounded-full ${
                              i <= symptom.severity ? '' : 'bg-slate-100 dark:bg-slate-700'
                            }`}
                            style={{
                              backgroundColor: i <= symptom.severity ? config?.color : undefined,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="text-6xl mb-4">🌟</div>
              <p className="text-slate-500 font-medium">No symptoms logged yet</p>
              <p className="text-slate-400 text-sm">Tap any symptom above to start tracking</p>
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="py-12 text-center">
          <div className="w-8 h-8 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto" />
        </div>
      )}
    </div>
  );
};

export default Symptoms;
