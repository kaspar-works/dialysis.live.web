import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { CustomReportConfig } from '../types';
import { exportDataAsJSON, exportAsPDF } from '../services/export';
import { ICONS } from '../constants';

const Reports: React.FC = () => {
  const { profile, sessions, weights, fluids, vitals, medications, moods, savedReports, addSavedReport, removeSavedReport } = useStore();

  const [reportName, setReportName] = useState('');
  const [selectedDataPoints, setSelectedDataPoints] = useState<string[]>(['sessions', 'weights', 'vitals']);
  const [dateRange, setDateRange] = useState('30');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [activeTab, setActiveTab] = useState<'create' | 'saved'>('create');

  const dataPoints = [
    { id: 'sessions', label: 'Sessions', icon: '💉', desc: 'Dialysis treatments', color: 'sky' },
    { id: 'weights', label: 'Weight', icon: '⚖️', desc: 'Body mass logs', color: 'purple' },
    { id: 'vitals', label: 'Vitals', icon: '❤️', desc: 'BP & heart rate', color: 'rose' },
    { id: 'fluids', label: 'Fluids', icon: '💧', desc: 'Intake tracking', color: 'cyan' },
    { id: 'meds', label: 'Medications', icon: '💊', desc: 'Prescriptions', color: 'indigo' },
    { id: 'wellness', label: 'Wellness', icon: '🧠', desc: 'Mood & symptoms', color: 'amber' },
  ];

  const dateRanges = [
    { value: '7', label: '7 Days' },
    { value: '14', label: '2 Weeks' },
    { value: '30', label: '30 Days' },
    { value: '60', label: '60 Days' },
    { value: '90', label: '90 Days' },
  ];

  const quickTemplates = [
    { name: 'Monthly Summary', dataPoints: ['sessions', 'weights', 'vitals'], range: '30', icon: '📊' },
    { name: 'Doctor Visit', dataPoints: ['sessions', 'weights', 'vitals', 'meds'], range: '14', icon: '👨‍⚕️' },
    { name: 'Full Export', dataPoints: ['sessions', 'weights', 'vitals', 'fluids', 'meds', 'wellness'], range: '30', icon: '📁' },
  ];

  const generationSteps = [
    "Gathering data...",
    "Processing records...",
    "Generating report...",
    "Finalizing..."
  ];

  const recordCounts = useMemo(() => {
    const now = new Date();
    const days = parseInt(dateRange);
    const threshold = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).getTime();

    return {
      sessions: sessions.filter(s => new Date(s.startTime).getTime() > threshold).length,
      weights: weights.filter(w => new Date(w.date).getTime() > threshold).length,
      fluids: fluids.filter(f => new Date(f.time).getTime() > threshold).length,
      vitals: vitals.filter(v => new Date(v.loggedAt).getTime() > threshold).length,
      wellness: moods.filter(m => new Date(m.time).getTime() > threshold).length,
      meds: medications.length,
    };
  }, [dateRange, sessions, weights, fluids, vitals, medications, moods]);

  const totalRecords = useMemo(() => {
    return selectedDataPoints.reduce((sum, id) => sum + (recordCounts[id as keyof typeof recordCounts] || 0), 0);
  }, [selectedDataPoints, recordCounts]);

  const toggleDataPoint = (id: string) => {
    setSelectedDataPoints(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const applyTemplate = (template: typeof quickTemplates[0]) => {
    setSelectedDataPoints(template.dataPoints);
    setDateRange(template.range);
    setReportName(template.name);
  };

  const exportReport = (format: 'json' | 'pdf', config?: Partial<CustomReportConfig>) => {
    const finalDataPoints = config?.dataPoints || selectedDataPoints;
    const finalRange = config?.dateRange || dateRange;

    const exportPayload: any = {
      profile,
      generatedAt: new Date().toISOString(),
      reportName: config?.name || reportName || 'Health Report',
      dateRange: `${finalRange} days`,
    };

    if (finalDataPoints.includes('sessions')) exportPayload.sessions = sessions;
    if (finalDataPoints.includes('weights')) exportPayload.weights = weights;
    if (finalDataPoints.includes('fluids')) exportPayload.fluids = fluids;
    if (finalDataPoints.includes('vitals')) exportPayload.vitals = vitals;
    if (finalDataPoints.includes('meds')) exportPayload.medications = medications;
    if (finalDataPoints.includes('wellness')) exportPayload.moods = moods;

    if (format === 'pdf') {
      exportAsPDF(exportPayload);
    } else {
      exportDataAsJSON(exportPayload, `health-report-${finalRange}days`);
    }
  };

  const handleGenerate = (format: 'json' | 'pdf', config?: CustomReportConfig) => {
    setIsGenerating(true);
    setGenerationStep(0);

    const interval = setInterval(() => {
      setGenerationStep(prev => {
        if (prev === generationSteps.length - 1) {
          clearInterval(interval);
          setTimeout(() => {
            setIsGenerating(false);
            exportReport(format, config);
          }, 500);
          return prev;
        }
        return prev + 1;
      });
    }, 600);
  };

  const handleSaveAndGenerate = (format: 'json' | 'pdf') => {
    const newConfig: CustomReportConfig = {
      id: Date.now().toString(),
      name: reportName || 'Report ' + new Date().toLocaleDateString(),
      dataPoints: selectedDataPoints,
      dateRange: dateRange,
      createdAt: new Date().toISOString()
    };
    addSavedReport(newConfig);
    handleGenerate(format, newConfig);
    setReportName('');
  };

  return (
    <div className="w-full space-y-6 pb-24 px-4 animate-in fade-in duration-500">

      {/* Header */}
      <header className="flex items-center justify-between pt-2">
        <div>
          <span className="text-indigo-500 text-xs font-bold uppercase tracking-wider">Export</span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Clinical Reports</h1>
        </div>
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'create' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-400'}`}
          >
            Create
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'saved' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-400'}`}
          >
            Saved ({savedReports.length})
          </button>
        </div>
      </header>

      {activeTab === 'create' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">

            {/* Quick Templates */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Quick Templates</h3>
              <div className="grid grid-cols-3 gap-3">
                {quickTemplates.map((template, i) => (
                  <button
                    key={i}
                    onClick={() => applyTemplate(template)}
                    className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:border-indigo-200 dark:hover:border-indigo-500/30 border border-transparent transition-all text-center group"
                  >
                    <span className="text-2xl block mb-2">{template.icon}</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{template.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Report Name */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Report Name</label>
              <input
                type="text"
                value={reportName}
                onChange={e => setReportName(e.target.value)}
                placeholder="e.g. Monthly Summary - December"
                className="w-full bg-slate-50 dark:bg-slate-700 rounded-xl px-4 py-4 font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
            </div>

            {/* Date Range */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Date Range</label>
              <div className="flex gap-2 flex-wrap">
                {dateRanges.map(range => (
                  <button
                    key={range.value}
                    onClick={() => setDateRange(range.value)}
                    className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                      dateRange === range.value
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Data Points */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 block">Include Data</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {dataPoints.map(dp => {
                  const isSelected = selectedDataPoints.includes(dp.id);
                  const count = recordCounts[dp.id as keyof typeof recordCounts] || 0;
                  return (
                    <button
                      key={dp.id}
                      onClick={() => toggleDataPoint(dp.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                          : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xl">{dp.icon}</span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300 dark:border-slate-600'
                        }`}>
                          {isSelected && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <p className={`font-bold text-sm ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>{dp.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{count} records</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Generate Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => handleSaveAndGenerate('pdf')}
                disabled={selectedDataPoints.length === 0}
                className="flex-1 py-4 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                Generate PDF
              </button>
              <button
                onClick={() => handleSaveAndGenerate('json')}
                disabled={selectedDataPoints.length === 0}
                className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export JSON
              </button>
            </div>
          </div>

          {/* Preview Sidebar */}
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl" />

              <div className="relative">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-4">Report Preview</h4>

                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-white/40 text-xs">Report Name</p>
                    <p className="font-bold text-lg truncate">{reportName || 'Untitled Report'}</p>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <p className="text-white/40 text-xs">Date Range</p>
                      <p className="font-bold">{dateRange} days</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-xs">Total Records</p>
                      <p className="font-bold text-indigo-400">{totalRecords}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-white/40 text-xs mb-2">Included Data</p>
                  {selectedDataPoints.length > 0 ? (
                    selectedDataPoints.map(id => {
                      const dp = dataPoints.find(d => d.id === id);
                      const count = recordCounts[id as keyof typeof recordCounts] || 0;
                      return (
                        <div key={id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <span className="flex items-center gap-2">
                            <span>{dp?.icon}</span>
                            <span className="text-sm font-medium">{dp?.label}</span>
                          </span>
                          <span className="text-xs font-bold text-indigo-400">{count}</span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-white/30 text-sm py-4 text-center">No data selected</p>
                  )}
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-amber-50 dark:bg-amber-500/10 rounded-xl p-4 border border-amber-100 dark:border-amber-500/20">
              <div className="flex gap-3">
                <span className="text-xl">💡</span>
                <div>
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">Tip</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400/80">Reports are saved automatically and can be regenerated anytime from the Saved tab.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Saved Reports */
        <div className="space-y-6">
          {savedReports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedReports.map(report => (
                <div key={report.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 group hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{report.name}</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(report.createdAt).toLocaleDateString()} • {report.dateRange} days
                      </p>
                    </div>
                    <button
                      onClick={() => removeSavedReport(report.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ICONS.X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {report.dataPoints.map(id => {
                      const dp = dataPoints.find(d => d.id === id);
                      return (
                        <span key={id} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-medium text-slate-600 dark:text-slate-300">
                          {dp?.icon} {dp?.label}
                        </span>
                      );
                    })}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleGenerate('pdf', report)}
                      className="flex-1 py-2.5 bg-indigo-500 text-white rounded-lg text-xs font-bold hover:bg-indigo-600 transition-all"
                    >
                      Download PDF
                    </button>
                    <button
                      onClick={() => handleGenerate('json', report)}
                      className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                    >
                      JSON
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 border border-slate-100 dark:border-slate-700 text-center">
              <div className="text-5xl mb-4">📋</div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Saved Reports</h3>
              <p className="text-slate-400 mb-6">Create your first report to get started</p>
              <button
                onClick={() => setActiveTab('create')}
                className="px-6 py-3 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 transition-all"
              >
                Create Report
              </button>
            </div>
          )}
        </div>
      )}

      {/* Generation Modal */}
      {isGenerating && (
        <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-8 animate-in fade-in duration-300">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-8" />
            <h3 className="text-2xl font-black text-white mb-2">{generationSteps[generationStep]}</h3>
            <div className="flex justify-center gap-1.5 mt-6">
              {generationSteps.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${i <= generationStep ? 'bg-indigo-500' : 'bg-white/20'}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
