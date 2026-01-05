import React, { useState, useEffect, useMemo } from 'react';
import { ICONS } from '../constants';
import { listSessions, DialysisSession } from '../services/dialysis';
import { getWeightLogs, WeightLog } from '../services/weight';
import { getFluidLogs, FluidLog } from '../services/fluid';
import { getVitalLogs, VitalLog } from '../services/vitals';
import { getMedications, Medication } from '../services/medications';
import { getCurrentSubscription } from '../services/subscription';

interface ReportData {
  sessions: DialysisSession[];
  weights: WeightLog[];
  fluids: FluidLog[];
  vitals: VitalLog[];
  medications: Medication[];
}

const Reports: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<ReportData>({
    sessions: [],
    weights: [],
    fluids: [],
    vitals: [],
    medications: [],
  });
  const [subscription, setSubscription] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [reportName, setReportName] = useState('');
  const [selectedDataPoints, setSelectedDataPoints] = useState<string[]>(['sessions', 'weights', 'vitals']);
  const [dateRange, setDateRange] = useState('30');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sessionsRes, weightsRes, fluidsRes, vitalsRes, medsRes, subRes] = await Promise.all([
        listSessions({ limit: 100 }).catch(() => ({ sessions: [] })),
        getWeightLogs({ limit: 100 }).catch(() => ({ logs: [] })),
        getFluidLogs({ limit: 100 }).catch(() => ({ logs: [] })),
        getVitalLogs({ limit: 100 }).catch(() => ({ logs: [] })),
        getMedications().catch(() => []),
        getCurrentSubscription().catch(() => null),
      ]);

      setData({
        sessions: sessionsRes.sessions || [],
        weights: weightsRes.logs || [],
        fluids: fluidsRes.logs || [],
        vitals: vitalsRes.logs || [],
        medications: Array.isArray(medsRes) ? medsRes : (medsRes.medications || []),
      });
      setSubscription(subRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const dataPoints = [
    { id: 'sessions', label: 'Sessions', icon: '💉', desc: 'Dialysis treatments', color: 'sky' },
    { id: 'weights', label: 'Weight', icon: '⚖️', desc: 'Body mass logs', color: 'purple' },
    { id: 'vitals', label: 'Vitals', icon: '❤️', desc: 'BP & heart rate', color: 'rose' },
    { id: 'fluids', label: 'Fluids', icon: '💧', desc: 'Intake tracking', color: 'cyan' },
    { id: 'meds', label: 'Medications', icon: '💊', desc: 'Prescriptions', color: 'indigo' },
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
    { name: 'Full Export', dataPoints: ['sessions', 'weights', 'vitals', 'fluids', 'meds'], range: '30', icon: '📁' },
  ];

  const generationSteps = ["Gathering data...", "Processing records...", "Generating report...", "Finalizing..."];

  const recordCounts = useMemo(() => {
    const now = new Date();
    const days = parseInt(dateRange);
    const threshold = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    return {
      sessions: data.sessions.filter(s => new Date(s.startedAt) > threshold).length,
      weights: data.weights.filter(w => new Date(w.loggedAt) > threshold).length,
      fluids: data.fluids.filter(f => new Date(f.loggedAt) > threshold).length,
      vitals: data.vitals.filter(v => new Date(v.loggedAt) > threshold).length,
      meds: data.medications.length,
    };
  }, [dateRange, data]);

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

  const canExport = subscription?.features?.exportData === true;

  const filterByDateRange = <T extends { loggedAt?: string; startedAt?: string }>(items: T[]): T[] => {
    const days = parseInt(dateRange);
    const threshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return items.filter(item => {
      const date = new Date(item.loggedAt || item.startedAt || '');
      return date > threshold;
    });
  };

  const exportAsJSON = () => {
    const exportData: any = {
      reportName: reportName || 'Health Report',
      generatedAt: new Date().toISOString(),
      dateRange: `${dateRange} days`,
    };

    if (selectedDataPoints.includes('sessions')) exportData.sessions = filterByDateRange(data.sessions);
    if (selectedDataPoints.includes('weights')) exportData.weights = filterByDateRange(data.weights);
    if (selectedDataPoints.includes('fluids')) exportData.fluids = filterByDateRange(data.fluids);
    if (selectedDataPoints.includes('vitals')) exportData.vitals = filterByDateRange(data.vitals);
    if (selectedDataPoints.includes('meds')) exportData.medications = data.medications;

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `health-report-${dateRange}days-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportAsPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setError('Please allow popups to generate PDF reports');
      return;
    }

    const sessions = selectedDataPoints.includes('sessions') ? filterByDateRange(data.sessions) : [];
    const weights = selectedDataPoints.includes('weights') ? filterByDateRange(data.weights) : [];
    const vitals = selectedDataPoints.includes('vitals') ? filterByDateRange(data.vitals) : [];
    const medications = selectedDataPoints.includes('meds') ? data.medications : [];

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${reportName || 'Health Report'}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
          * { box-sizing: border-box; }
          body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 40px; line-height: 1.6; max-width: 800px; margin: 0 auto; }
          .header { border-bottom: 3px solid #0ea5e9; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { margin: 0 0 8px; font-size: 28px; font-weight: 900; color: #0f172a; }
          .header p { margin: 0; color: #64748b; font-size: 14px; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #0ea5e9; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px; }
          .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
          .stat-card { background: #f8fafc; padding: 16px; border-radius: 12px; text-align: center; }
          .stat-card .value { font-size: 24px; font-weight: 900; color: #0f172a; }
          .stat-card .label { font-size: 11px; color: #64748b; text-transform: uppercase; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { text-align: left; font-weight: 700; color: #64748b; padding: 10px 8px; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; font-size: 10px; }
          td { padding: 10px 8px; border-bottom: 1px solid #f1f5f9; }
          tr:nth-child(even) { background: #f8fafc; }
          .footer { margin-top: 40px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${reportName || 'Health Report'}</h1>
          <p>Generated on ${new Date().toLocaleString()} | Period: Last ${dateRange} days</p>
        </div>

        <div class="stat-grid">
          ${selectedDataPoints.includes('sessions') ? `<div class="stat-card"><div class="value">${sessions.length}</div><div class="label">Sessions</div></div>` : ''}
          ${selectedDataPoints.includes('weights') ? `<div class="stat-card"><div class="value">${weights.length}</div><div class="label">Weight Logs</div></div>` : ''}
          ${selectedDataPoints.includes('vitals') ? `<div class="stat-card"><div class="value">${vitals.length}</div><div class="label">Vital Records</div></div>` : ''}
        </div>

        ${sessions.length > 0 ? `
          <div class="section">
            <div class="section-title">Dialysis Sessions</div>
            <table>
              <thead><tr><th>Date</th><th>Type</th><th>Duration</th><th>Pre/Post Weight</th><th>UF Removed</th></tr></thead>
              <tbody>
                ${sessions.slice(0, 10).map(s => `
                  <tr>
                    <td>${new Date(s.startedAt).toLocaleDateString()}</td>
                    <td>${s.type?.replace(/_/g, ' ') || 'N/A'}</td>
                    <td>${s.actualDurationMin || s.plannedDurationMin || '--'} min</td>
                    <td>${s.preWeightKg || '--'} / ${s.postWeightKg || '--'} kg</td>
                    <td>${s.actualUfMl || '--'} ml</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        ${vitals.length > 0 ? `
          <div class="section">
            <div class="section-title">Vital Signs</div>
            <table>
              <thead><tr><th>Date</th><th>Type</th><th>Reading</th><th>Notes</th></tr></thead>
              <tbody>
                ${vitals.slice(0, 10).map(v => `
                  <tr>
                    <td>${new Date(v.loggedAt).toLocaleDateString()}</td>
                    <td>${v.type?.replace(/_/g, ' ')}</td>
                    <td>${v.value1}${v.value2 ? '/' + v.value2 : ''} ${v.unit}</td>
                    <td>${v.notes || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        ${medications.length > 0 ? `
          <div class="section">
            <div class="section-title">Current Medications</div>
            <table>
              <thead><tr><th>Medication</th><th>Dosage</th><th>Frequency</th><th>Instructions</th></tr></thead>
              <tbody>
                ${medications.map(m => `
                  <tr>
                    <td><strong>${m.name}</strong></td>
                    <td>${m.dosage} ${m.dosageUnit}</td>
                    <td>${m.frequency}</td>
                    <td>${m.instructions || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        <div class="footer">
          <p>This report was generated by dialysis.live for informational purposes only.</p>
          <p>Always consult your healthcare provider for medical advice.</p>
        </div>

        <script>window.onload = () => window.print();</script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleGenerate = (format: 'json' | 'pdf') => {
    if (!canExport) {
      setError('Data export requires a Premium subscription');
      return;
    }

    setIsGenerating(true);
    setGenerationStep(0);

    const interval = setInterval(() => {
      setGenerationStep(prev => {
        if (prev === generationSteps.length - 1) {
          clearInterval(interval);
          setTimeout(() => {
            setIsGenerating(false);
            if (format === 'pdf') exportAsPDF();
            else exportAsJSON();
          }, 400);
          return prev;
        }
        return prev + 1;
      });
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-24 px-4 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex items-center justify-between pt-2">
        <div>
          <span className="text-indigo-500 text-xs font-bold uppercase tracking-wider">Export</span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Clinical Reports</h1>
        </div>
        <button
          onClick={fetchAllData}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
        >
          <ICONS.RefreshCw className="w-5 h-5 text-slate-500" />
        </button>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl p-4 flex items-center justify-between">
          <p className="text-rose-700 dark:text-rose-400 text-sm font-medium">{error}</p>
          <button onClick={() => setError(null)} className="text-rose-500 p-1">
            <ICONS.X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Premium Gate Banner */}
      {!canExport && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">👑</span>
          <div className="flex-1">
            <p className="text-amber-800 dark:text-amber-300 font-bold text-sm">Premium Feature</p>
            <p className="text-amber-700 dark:text-amber-400/80 text-xs">Upgrade to Premium to export your health data as PDF or JSON.</p>
          </div>
          <a href="/subscription" className="px-4 py-2 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition-all">
            Upgrade
          </a>
        </div>
      )}

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
                  className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-500/10 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all text-center group"
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
              placeholder="e.g. Monthly Summary - January"
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
              onClick={() => handleGenerate('pdf')}
              disabled={selectedDataPoints.length === 0 || !canExport}
              className="flex-1 py-4 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ICONS.FileText className="w-5 h-5" />
              Generate PDF
            </button>
            <button
              onClick={() => handleGenerate('json')}
              disabled={selectedDataPoints.length === 0 || !canExport}
              className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ICONS.Download className="w-5 h-5" />
              Export JSON
            </button>
          </div>
        </div>

        {/* Preview Sidebar */}
        <div className="space-y-6">
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

          <div className="bg-sky-50 dark:bg-sky-500/10 rounded-xl p-4 border border-sky-100 dark:border-sky-500/20">
            <div className="flex gap-3">
              <span className="text-xl">💡</span>
              <div>
                <p className="text-xs font-bold text-sky-800 dark:text-sky-300 mb-1">Tip</p>
                <p className="text-xs text-sky-700 dark:text-sky-400/80">Share PDF reports with your healthcare team for better care coordination.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

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
