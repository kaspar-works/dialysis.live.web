import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { ICONS } from '../constants';
import { useAlert } from '../contexts/AlertContext';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, CartesianGrid
} from 'recharts';
import {
  getLabReports,
  getLatestResults,
  getLabTrends,
  analyzeLabReport,
  createLabReport,
  deleteLabReport,
  LabReport,
  LatestResult,
  LabTrendResult,
  LabReportAnalysis,
  LAB_TEST_CONFIG,
  CATEGORY_CONFIG,
  LabTestCategory,
  LabTestCode,
  getResultColor,
  getResultStatus,
  getCommonTestPresets,
  groupResultsByCategory,
} from '../services/labReports';
import { SubscriptionLimitError } from '../services/auth';
import { useSettings } from '../contexts/SettingsContext';

type ViewTab = 'overview' | 'trends' | 'history';

const LabReports: React.FC = () => {
  const { showConfirm, showSuccess, showError } = useAlert();
  const { displayShortDate, displayFullDate, displayFullWeekday, timezone } = useSettings();
  const [activeTab, setActiveTab] = useState<ViewTab>('overview');
  const [reports, setReports] = useState<LabReport[]>([]);
  const [latestResults, setLatestResults] = useState<LatestResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [limitError, setLimitError] = useState<{ message: string } | null>(null);
  const hasFetched = useRef(false);

  // Trend state
  const [selectedTestCode, setSelectedTestCode] = useState<string>(LabTestCode.POTASSIUM);
  const [trendData, setTrendData] = useState<LabTrendResult | null>(null);
  const [isLoadingTrend, setIsLoadingTrend] = useState(false);

  // AI Analysis state
  const [analyzingReportId, setAnalyzingReportId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<LabReport | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    reportDate: new Date().toISOString().split('T')[0],
    labName: '',
    results: [] as Array<{ testCode: string; testName: string; value: string }>,
  });

  // Validation state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  // Validate report date
  const validateReportDate = (value: string): string => {
    if (!value) {
      return 'Report date is required';
    }
    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (selectedDate > today) {
      return 'Date cannot be in the future';
    }
    // Check if date is not too old (e.g., more than 2 years)
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    if (selectedDate < twoYearsAgo) {
      return 'Date cannot be more than 2 years ago';
    }
    return '';
  };

  // Validate lab name
  const validateLabName = (value: string): string => {
    if (value && value.length > 100) {
      return 'Lab name cannot exceed 100 characters';
    }
    return '';
  };

  // Validate test value
  const validateTestValue = (testCode: string, value: string): string => {
    if (!value || value.trim() === '') {
      return 'Value is required';
    }
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return 'Enter a valid number';
    }
    if (numValue < 0) {
      return 'Value cannot be negative';
    }
    // Get config for this test to check reasonable bounds
    const config = LAB_TEST_CONFIG[testCode];
    if (config) {
      // Allow values up to 10x the high reference range as a reasonable max
      const maxAllowed = config.dialysisRange.high * 10;
      if (numValue > maxAllowed) {
        return `Value seems too high (max ${maxAllowed})`;
      }
    }
    return '';
  };

  // Handle field change with validation
  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touchedFields[field]) {
      let error = '';
      switch (field) {
        case 'reportDate': error = validateReportDate(value); break;
        case 'labName': error = validateLabName(value); break;
      }
      setFieldErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  // Handle field blur
  const handleFieldBlur = (field: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    let error = '';
    switch (field) {
      case 'reportDate': error = validateReportDate(formData.reportDate); break;
      case 'labName': error = validateLabName(formData.labName); break;
    }
    setFieldErrors(prev => ({ ...prev, [field]: error }));
  };

  // Handle test value change with validation
  const handleTestValueChange = (testCode: string, value: string) => {
    updateTestValue(testCode, value);
    if (touchedFields[`test_${testCode}`]) {
      const error = validateTestValue(testCode, value);
      setFieldErrors(prev => ({ ...prev, [`test_${testCode}`]: error }));
    }
  };

  // Handle test value blur
  const handleTestValueBlur = (testCode: string, value: string) => {
    setTouchedFields(prev => ({ ...prev, [`test_${testCode}`]: true }));
    const error = validateTestValue(testCode, value);
    setFieldErrors(prev => ({ ...prev, [`test_${testCode}`]: error }));
  };

  // Check if form has errors
  const hasFormErrors = Object.values(fieldErrors).some(error => error !== '');

  // Reset form validation
  const resetFormValidation = () => {
    setFieldErrors({});
    setTouchedFields({});
  };

  // Fetch data on mount
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [reportsRes, latestRes] = await Promise.all([
        getLabReports({ limit: 50 }),
        getLatestResults(),
      ]);
      setReports(reportsRes.reports || []);
      setLatestResults(latestRes || []);
    } catch (err: any) {
      console.error('Failed to fetch lab data:', err);
      setError('Failed to load lab reports');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch trend data when test code changes
  useEffect(() => {
    if (activeTab === 'trends' && selectedTestCode) {
      fetchTrendData();
    }
  }, [activeTab, selectedTestCode]);

  const fetchTrendData = async () => {
    setIsLoadingTrend(true);
    try {
      const data = await getLabTrends(selectedTestCode, 365);
      setTrendData(data);
    } catch (err) {
      console.error('Failed to fetch trend:', err);
    } finally {
      setIsLoadingTrend(false);
    }
  };

  // Group latest results by category
  const groupedResults = useMemo(() => {
    return groupResultsByCategory(latestResults);
  }, [latestResults]);

  // Add test to form
  const addTestToForm = (testCode: string, testName: string) => {
    if (formData.results.find(r => r.testCode === testCode)) return;
    setFormData(prev => ({
      ...prev,
      results: [...prev.results, { testCode, testName, value: '' }],
    }));
  };

  // Remove test from form
  const removeTestFromForm = (testCode: string) => {
    setFormData(prev => ({
      ...prev,
      results: prev.results.filter(r => r.testCode !== testCode),
    }));
  };

  // Update test value
  const updateTestValue = (testCode: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      results: prev.results.map(r =>
        r.testCode === testCode ? { ...r, value } : r
      ),
    }));
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Mark all fields as touched
    const newTouchedFields: Record<string, boolean> = {
      reportDate: true,
      labName: true,
    };
    formData.results.forEach(r => {
      newTouchedFields[`test_${r.testCode}`] = true;
    });
    setTouchedFields(newTouchedFields);

    // Validate all fields
    const dateError = validateReportDate(formData.reportDate);
    const labNameError = validateLabName(formData.labName);

    const newErrors: Record<string, string> = {
      reportDate: dateError,
      labName: labNameError,
    };

    // Validate each test value
    formData.results.forEach(r => {
      const testError = validateTestValue(r.testCode, r.value);
      newErrors[`test_${r.testCode}`] = testError;
    });

    setFieldErrors(newErrors);

    // Check for validation errors
    const hasErrors = Object.values(newErrors).some(error => error !== '');
    if (hasErrors) {
      return;
    }

    // Check if at least one test is added
    if (formData.results.length === 0) {
      setError('Please add at least one test result');
      return;
    }

    setIsSubmitting(true);

    try {
      const newReport = await createLabReport({
        reportDate: formData.reportDate,
        labName: formData.labName || undefined,
        results: formData.results.map(r => ({
          testName: r.testName,
          testCode: r.testCode,
          value: parseFloat(r.value),
        })),
      });

      setReports(prev => [newReport, ...prev]);
      setShowForm(false);
      setFormData({
        reportDate: new Date().toISOString().split('T')[0],
        labName: '',
        results: [],
      });
      resetFormValidation();
      setNotification({ message: 'Lab report saved', type: 'success' });
      setTimeout(() => setNotification(null), 3000);

      // Refresh latest results
      const latestRes = await getLatestResults();
      setLatestResults(latestRes);
    } catch (err) {
      console.error('Failed to save lab report:', err);
      if (err instanceof SubscriptionLimitError) {
        setLimitError({ message: err.message });
        setShowForm(false);
      } else {
        setError('Failed to save lab report');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle AI analysis
  const handleAnalyze = async (reportId: string) => {
    setAnalyzingReportId(reportId);
    try {
      const analysis = await analyzeLabReport(reportId);
      const analysisTimestamp = new Date().toISOString();

      // Update report with analysis using functional update to get latest state
      setReports(prev => {
        const updatedReports = prev.map(r =>
          r._id === reportId ? { ...r, aiAnalysis: analysis, aiAnalyzedAt: analysisTimestamp } : r
        );

        // Also update selected report if viewing (using updated data)
        const updatedReport = updatedReports.find(r => r._id === reportId);
        if (updatedReport && selectedReport?._id === reportId) {
          setSelectedReport(updatedReport);
        }

        return updatedReports;
      });

      setNotification({ message: 'AI analysis complete', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      console.error('Failed to analyze:', err);
      if (err instanceof SubscriptionLimitError) {
        setLimitError({ message: err.message });
      } else {
        setError('Failed to analyze lab report');
      }
    } finally {
      setAnalyzingReportId(null);
    }
  };

  // Handle delete
  const handleDelete = (reportId: string) => {
    showConfirm(
      'Delete Lab Report',
      'Are you sure you want to delete this lab report? This action cannot be undone.',
      async () => {
        try {
          await deleteLabReport(reportId);
          setReports(prev => prev.filter(r => r._id !== reportId));
          setSelectedReport(null);
          showSuccess('Deleted', 'Lab report has been deleted successfully.');
        } catch (err) {
          console.error('Failed to delete:', err);
          showError('Error', 'Failed to delete lab report. Please try again.');
        }
      },
      { confirmText: 'Delete', cancelText: 'Cancel' }
    );
  };

  const tabs: { id: ViewTab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'trends', label: 'Trends', icon: '📈' },
    { id: 'history', label: 'History', icon: '📋' },
  ];

  const testPresets = getCommonTestPresets();

  // Chart data for trends
  const chartData = useMemo(() => {
    if (!trendData?.data) return [];
    return trendData.data.map(d => ({
      date: displayShortDate(d.date),
      value: d.value,
      isAbnormal: d.isAbnormal,
    }));
  }, [trendData, displayShortDate]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-24 px-4">
      {/* Header */}
      <header className="flex items-center justify-between pt-2">
        <div>
          <span className="px-3 py-1 bg-indigo-500/10 text-indigo-500 text-[10px] font-bold uppercase tracking-wider rounded-full">
            Health Records
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-2">
            Lab Reports
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {reports.length} reports logged
          </p>
        </div>
        <button
          onClick={() => {
            if (showForm) {
              // Reset validation when closing form
              resetFormValidation();
            }
            setShowForm(!showForm);
          }}
          className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${
            showForm
              ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-500/20'
          }`}
        >
          <ICONS.Plus className={`w-4 h-4 transition-transform ${showForm ? 'rotate-45' : ''}`} />
          <span className="hidden sm:inline">{showForm ? 'Cancel' : 'Add Report'}</span>
        </button>
      </header>

      {/* Error Display */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-top">
          <p className="text-rose-500 font-medium">{error}</p>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-600">
            <ICONS.X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Subscription Limit Banner */}
      {limitError && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-5 animate-in slide-in-from-top">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-amber-700 dark:text-amber-400 text-lg">Plan Limit Reached</h3>
              <p className="text-amber-600 dark:text-amber-300/80 mt-1">{limitError.message}</p>
              <div className="flex items-center gap-3 mt-4">
                <Link
                  to="/pricing"
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
                >
                  Upgrade Plan
                </Link>
                <button
                  onClick={() => setLimitError(null)}
                  className="px-4 py-2.5 text-amber-600 dark:text-amber-400 font-medium text-sm hover:bg-amber-500/10 rounded-xl transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Lab Report Form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 animate-in slide-in-from-top duration-300 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add Lab Report</h2>
            <p className="text-slate-400 text-sm mt-1">Enter your lab test results</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Date and Lab */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Report Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.reportDate}
                  onChange={e => handleFieldChange('reportDate', e.target.value)}
                  onBlur={() => handleFieldBlur('reportDate')}
                  className={`w-full px-4 py-3 rounded-xl text-slate-900 dark:text-white transition-all ${
                    fieldErrors.reportDate && touchedFields.reportDate
                      ? 'bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-400 dark:border-rose-500'
                      : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                  }`}
                />
                {fieldErrors.reportDate && touchedFields.reportDate && (
                  <p className="text-xs text-rose-500 mt-1">{fieldErrors.reportDate}</p>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Lab Name (Optional)
                </label>
                <input
                  type="text"
                  value={formData.labName}
                  onChange={e => handleFieldChange('labName', e.target.value)}
                  onBlur={() => handleFieldBlur('labName')}
                  placeholder="e.g., Quest Diagnostics"
                  className={`w-full px-4 py-3 rounded-xl text-slate-900 dark:text-white transition-all ${
                    fieldErrors.labName && touchedFields.labName
                      ? 'bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-400 dark:border-rose-500'
                      : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                  }`}
                />
                {fieldErrors.labName && touchedFields.labName && (
                  <p className="text-xs text-rose-500 mt-1">{fieldErrors.labName}</p>
                )}
              </div>
            </div>

            {/* Quick Add Presets */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                Quick Add Common Panels
              </label>
              <div className="flex flex-wrap gap-2">
                {testPresets.map(preset => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      preset.tests.forEach(t => addTestToForm(t.testCode, t.testName));
                    }}
                    className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-bold transition-colors"
                  >
                    + {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Individual Tests */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                Add Individual Tests
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {Object.entries(LAB_TEST_CONFIG).map(([code, config]) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => addTestToForm(code, config.name)}
                    disabled={formData.results.some(r => r.testCode === code)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      formData.results.some(r => r.testCode === code)
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {config.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Tests with Values */}
            {formData.results.length > 0 && (
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                  Enter Values ({formData.results.length} tests) <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-3">
                  {formData.results.map(result => {
                    const config = LAB_TEST_CONFIG[result.testCode];
                    const testFieldKey = `test_${result.testCode}`;
                    const hasError = fieldErrors[testFieldKey] && touchedFields[testFieldKey];
                    return (
                      <div
                        key={result.testCode}
                        className={`rounded-xl p-3 transition-all ${
                          hasError
                            ? 'bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30'
                            : 'bg-slate-50 dark:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <p className="font-bold text-slate-900 dark:text-white text-sm">{result.testName}</p>
                            <p className="text-[10px] text-slate-400">
                              Reference: {config?.dialysisRange.low} - {config?.dialysisRange.high} {config?.unit}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="any"
                              value={result.value}
                              onChange={e => handleTestValueChange(result.testCode, e.target.value)}
                              onBlur={e => handleTestValueBlur(result.testCode, e.target.value)}
                              placeholder="Value"
                              className={`w-24 px-3 py-2 rounded-lg text-right font-bold text-slate-900 dark:text-white transition-all ${
                                hasError
                                  ? 'bg-white dark:bg-slate-800 border-2 border-rose-400 dark:border-rose-500'
                                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                              }`}
                            />
                            <span className="text-xs text-slate-400 w-16">{config?.unit}</span>
                            <button
                              type="button"
                              onClick={() => {
                                removeTestFromForm(result.testCode);
                                // Clear validation for this test
                                setFieldErrors(prev => {
                                  const newErrors = { ...prev };
                                  delete newErrors[testFieldKey];
                                  return newErrors;
                                });
                                setTouchedFields(prev => {
                                  const newTouched = { ...prev };
                                  delete newTouched[testFieldKey];
                                  return newTouched;
                                });
                              }}
                              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                            >
                              <ICONS.X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {hasError && (
                          <p className="text-xs text-rose-500 mt-2">{fieldErrors[testFieldKey]}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || formData.results.length === 0 || hasFormErrors}
              className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="text-xl">🔬</span>
                  Save Lab Report
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="py-12 text-center">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 mt-4">Loading lab reports...</p>
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Latest Results by Category */}
              {Object.entries(groupedResults).map(([category, results]: [string, LatestResult[]]) => {
                if (results.length === 0) return null;
                const catConfig = CATEGORY_CONFIG[category as LabTestCategory];

                return (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{catConfig.name}</h3>
                      <span className="text-xs text-slate-400">{results.length} tests</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {results.map(result => {
                        const config = LAB_TEST_CONFIG[result.testCode];
                        const statusColor = getResultColor(result);
                        const status = getResultStatus(result);

                        const colorClasses: Record<string, string> = {
                          green: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
                          red: 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400',
                          amber: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
                        };

                        return (
                          <div
                            key={result.testCode}
                            onClick={() => {
                              setSelectedTestCode(result.testCode);
                              setActiveTab('trends');
                            }}
                            className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 hover:shadow-lg hover:border-slate-200 dark:hover:border-slate-600 transition-all cursor-pointer"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                {config?.name || result.testCode}
                              </span>
                              <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-lg ${colorClasses[statusColor]}`}>
                                {status}
                              </span>
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                                {result.latestValue.toFixed(1)}
                              </span>
                              <span className="text-xs text-slate-400">{result.unit}</span>
                            </div>
                            <div className="mt-2 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  statusColor === 'green' ? 'bg-emerald-500' :
                                  statusColor === 'red' ? 'bg-rose-500' : 'bg-amber-500'
                                }`}
                                style={{
                                  width: `${Math.min(100, Math.max(0,
                                    (result.latestValue - result.referenceRange.low) /
                                    (result.referenceRange.high - result.referenceRange.low) * 100
                                  ))}%`
                                }}
                              />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2">
                              Range: {result.referenceRange.low} - {result.referenceRange.high}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Empty State */}
              {latestResults.length === 0 && (
                <div className="py-16 text-center bg-slate-50 dark:bg-slate-800/50 rounded-3xl">
                  <div className="text-6xl mb-4">🔬</div>
                  <p className="text-slate-600 dark:text-slate-300 font-bold text-lg">No lab reports yet</p>
                  <p className="text-slate-400 text-sm mt-1">Add your first lab report to track your health</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-6 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-all"
                  >
                    Add Your First Report
                  </button>
                </div>
              )}
            </>
          )}

          {/* Trends Tab */}
          {activeTab === 'trends' && (
            <>
              {/* Test Selector */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                  Select Test to View Trends
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(LAB_TEST_CONFIG).map(([code, config]) => (
                    <button
                      key={code}
                      onClick={() => setSelectedTestCode(code)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        selectedTestCode === code
                          ? 'bg-indigo-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {config.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trend Chart */}
              {isLoadingTrend ? (
                <div className="py-12 text-center">
                  <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto" />
                  <p className="text-slate-400 mt-4">Loading trend data...</p>
                </div>
              ) : trendData && chartData.length > 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {LAB_TEST_CONFIG[selectedTestCode]?.name || selectedTestCode} Trend
                      </h3>
                      <p className="text-slate-400 text-sm">
                        {chartData.length} readings over the past year
                      </p>
                    </div>
                    {trendData.statistics && (
                      <div className={`px-3 py-1.5 rounded-full text-sm font-bold ${
                        trendData.statistics.trend === 'improving' ? 'bg-emerald-500/10 text-emerald-500' :
                        trendData.statistics.trend === 'worsening' ? 'bg-rose-500/10 text-rose-500' :
                        'bg-slate-100 dark:bg-slate-700 text-slate-500'
                      }`}>
                        {trendData.statistics.trend === 'improving' && '↑ '}
                        {trendData.statistics.trend === 'worsening' && '↓ '}
                        {trendData.statistics.trend === 'stable' && '→ '}
                        {trendData.statistics.trend.charAt(0).toUpperCase() + trendData.statistics.trend.slice(1)}
                      </div>
                    )}
                  </div>

                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3}/>
                            <stop offset="100%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} width={45} />
                        <ReferenceLine y={trendData.referenceRange.high} stroke="#f43f5e" strokeDasharray="5 5" strokeWidth={1} label={{ value: 'High', position: 'right', fill: '#f43f5e', fontSize: 10 }} />
                        <ReferenceLine y={trendData.referenceRange.low} stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={1} label={{ value: 'Low', position: 'right', fill: '#f59e0b', fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: '#fff' }}
                          formatter={(value: number) => [`${value} ${trendData.unit}`, trendData.testName]}
                        />
                        <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fill="url(#trendGradient)" dot={{ r: 4, fill: '#fff', strokeWidth: 2, stroke: '#6366f1' }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Statistics */}
                  {trendData.statistics && (
                    <div className="grid grid-cols-4 gap-4 mt-6">
                      {[
                        { label: 'Latest', value: trendData.statistics.latest, icon: '📍' },
                        { label: 'Average', value: trendData.statistics.average.toFixed(1), icon: '📊' },
                        { label: 'Min', value: trendData.statistics.min, icon: '📉' },
                        { label: 'Max', value: trendData.statistics.max, icon: '📈' },
                      ].map((stat, i) => (
                        <div key={i} className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 text-center">
                          <span className="text-xl">{stat.icon}</span>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{stat.label}</p>
                          <p className="text-lg font-black text-slate-900 dark:text-white tabular-nums">{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-3xl">
                  <div className="text-4xl mb-3">📈</div>
                  <p className="text-slate-600 dark:text-slate-300 font-bold">No trend data available</p>
                  <p className="text-slate-400 text-sm mt-1">Add lab reports with {LAB_TEST_CONFIG[selectedTestCode]?.name} to see trends</p>
                </div>
              )}
            </>
          )}

          {/* History Tab - Table View */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">All Reports</h3>
                <span className="text-sm text-slate-400">{reports.length} reports</span>
              </div>

              {reports.length > 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                  {/* Table Header */}
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                          <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                          <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lab</th>
                          <th className="text-center px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tests</th>
                          <th className="text-center px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Abnormal</th>
                          <th className="text-center px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Status</th>
                          <th className="text-right px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {reports.map(report => {
                          const abnormalCount = report.results.filter(r => r.isAbnormal).length;
                          return (
                            <tr key={report._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                              {/* Date */}
                              <td className="px-4 py-4">
                                <div>
                                  <p className="font-bold text-slate-900 dark:text-white text-sm">
                                    {displayFullDate(report.reportDate)}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    {displayFullWeekday(report.reportDate)}
                                  </p>
                                </div>
                              </td>
                              {/* Lab Name */}
                              <td className="px-4 py-4">
                                {report.labName ? (
                                  <span className="text-sm text-slate-600 dark:text-slate-300">{report.labName}</span>
                                ) : (
                                  <span className="text-sm text-slate-300 dark:text-slate-600 italic">Not specified</span>
                                )}
                              </td>
                              {/* Tests Count */}
                              <td className="px-4 py-4 text-center">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                                  {report.results.length}
                                </span>
                              </td>
                              {/* Abnormal Count */}
                              <td className="px-4 py-4 text-center">
                                {abnormalCount > 0 ? (
                                  <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs">
                                    {abnormalCount} abnormal
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                                    All normal
                                  </span>
                                )}
                              </td>
                              {/* AI Status */}
                              <td className="px-4 py-4 text-center">
                                {report.aiAnalysis ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold text-xs">
                                    <ICONS.Sparkles className="w-3 h-3" />
                                    Analyzed
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-400">—</span>
                                )}
                              </td>
                              {/* Actions */}
                              <td className="px-4 py-4">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => setSelectedReport(report)}
                                    className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-colors"
                                    title="View Details"
                                  >
                                    <ICONS.Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleAnalyze(report._id)}
                                    disabled={analyzingReportId === report._id}
                                    className="p-2 text-slate-400 hover:text-purple-500 hover:bg-purple-500/10 rounded-lg transition-colors disabled:opacity-50"
                                    title="AI Analysis"
                                  >
                                    {analyzingReportId === report._id ? (
                                      <div className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                                    ) : (
                                      <ICONS.Sparkles className="w-4 h-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleDelete(report._id)}
                                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                                    title="Delete"
                                  >
                                    <ICONS.Trash className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center bg-slate-50 dark:bg-slate-800/50 rounded-3xl">
                  <div className="text-6xl mb-4">📋</div>
                  <p className="text-slate-600 dark:text-slate-300 font-bold text-lg">No lab reports</p>
                  <p className="text-slate-400 text-sm mt-1">Add your lab results to start tracking</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setSelectedReport(null)}
          />
          <div className="relative bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 fade-in duration-200">
            {/* Mobile drag indicator */}
            <div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mt-3 sm:hidden" />

            <div className="sticky top-0 bg-white dark:bg-slate-800 p-4 sm:p-6 border-b border-slate-100 dark:border-slate-700 z-10">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-3">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">
                    Lab Report - {displayFullDate(selectedReport.reportDate)}
                  </h3>
                  {selectedReport.labName && (
                    <p className="text-slate-400 text-xs sm:text-sm truncate">{selectedReport.labName}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors flex-shrink-0"
                >
                  <ICONS.X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
              {/* Results Grid */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Test Results</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  {selectedReport.results.map((result, i) => {
                    const config = LAB_TEST_CONFIG[result.testCode];
                    const statusColor = getResultColor(result);

                    return (
                      <div
                        key={i}
                        className={`p-3 rounded-xl border ${
                          result.isAbnormal
                            ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                            {result.testName}
                          </span>
                          {result.isAbnormal && (
                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                              result.abnormalDirection === 'high'
                                ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                                : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                            }`}>
                              {result.abnormalDirection}
                            </span>
                          )}
                        </div>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className={`text-xl font-black ${
                            result.isAbnormal
                              ? result.abnormalDirection === 'high'
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-900 dark:text-white'
                          }`}>
                            {result.value.toFixed(1)}
                          </span>
                          <span className="text-xs text-slate-400">{result.unit}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Ref: {result.referenceRange.low} - {result.referenceRange.high}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Analysis */}
              {selectedReport.aiAnalysis ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ICONS.Sparkles className="w-5 h-5 text-purple-500" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">AI Analysis</h4>
                    {selectedReport.aiAnalyzedAt && (
                      <span className="text-[10px] text-slate-400">
                        {displayFullDate(selectedReport.aiAnalyzedAt)}
                      </span>
                    )}
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-500/10 rounded-xl p-4">
                    <p className="text-slate-700 dark:text-slate-300 text-sm">{selectedReport.aiAnalysis.summary}</p>
                  </div>

                  {selectedReport.aiAnalysis.highlights && selectedReport.aiAnalysis.highlights.length > 0 && (
                    <div>
                      <h5 className="text-xs font-bold text-cyan-500 uppercase mb-2">Highlights</h5>
                      <ul className="space-y-2">
                        {selectedReport.aiAnalysis.highlights.map((h, i) => (
                          <li key={i} className="text-sm text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-2">
                              <span className="text-cyan-500">★</span>
                              <span className="font-medium text-slate-900 dark:text-white">{h.testName}</span>
                              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                h.status === 'normal' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                                h.status === 'critical' ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400' :
                                'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                              }`}>{h.status}</span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-500 ml-5 mt-0.5">{h.message}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedReport.aiAnalysis.concerns.length > 0 && (
                    <div>
                      <h5 className="text-xs font-bold text-rose-500 uppercase mb-2">Concerns</h5>
                      <ul className="space-y-1">
                        {selectedReport.aiAnalysis.concerns.map((c, i) => (
                          <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                            <span className="text-rose-500">•</span>
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedReport.aiAnalysis.positives.length > 0 && (
                    <div>
                      <h5 className="text-xs font-bold text-emerald-500 uppercase mb-2">Positive Findings</h5>
                      <ul className="space-y-1">
                        {selectedReport.aiAnalysis.positives.map((p, i) => (
                          <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                            <span className="text-emerald-500">•</span>
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedReport.aiAnalysis.trends && selectedReport.aiAnalysis.trends.length > 0 && (
                    <div>
                      <h5 className="text-xs font-bold text-purple-500 uppercase mb-2">Trends</h5>
                      <ul className="space-y-2">
                        {selectedReport.aiAnalysis.trends.map((t, i) => (
                          <li key={i} className="text-sm text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs ${
                                t.direction === 'up' ? 'text-rose-500' :
                                t.direction === 'down' ? 'text-emerald-500' : 'text-slate-400'
                              }`}>
                                {t.direction === 'up' ? '↑' : t.direction === 'down' ? '↓' : '→'}
                              </span>
                              <span className="font-medium text-slate-900 dark:text-white">{t.testName}</span>
                            </div>
                            {t.description && (
                              <p className="text-xs text-slate-500 dark:text-slate-500 ml-5 mt-0.5">{t.description}</p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedReport.aiAnalysis.recommendations.length > 0 && (
                    <div>
                      <h5 className="text-xs font-bold text-indigo-500 uppercase mb-2">Recommendations</h5>
                      <ul className="space-y-1">
                        {selectedReport.aiAnalysis.recommendations.map((r, i) => (
                          <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                            <span className="text-indigo-500">•</span>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedReport.aiAnalysis.dialysisRelevance && (
                    <div>
                      <h5 className="text-xs font-bold text-pink-500 uppercase mb-2">Dialysis Relevance</h5>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{selectedReport.aiAnalysis.dialysisRelevance}</p>
                    </div>
                  )}

                  <p className="text-[10px] text-slate-400 italic pt-2 border-t border-slate-200 dark:border-slate-700">
                    {selectedReport.aiAnalysis.disclaimer}
                  </p>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 text-center">
                  <ICONS.Sparkles className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400 text-sm">No AI analysis yet</p>
                  <button
                    onClick={() => handleAnalyze(selectedReport._id)}
                    disabled={analyzingReportId === selectedReport._id}
                    className="mt-4 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
                  >
                    {analyzingReportId === selectedReport._id ? 'Analyzing...' : 'Generate AI Analysis'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top fade-in duration-300">
          <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg ${
            notification.type === 'success'
              ? 'bg-emerald-500 text-white'
              : 'bg-rose-500 text-white'
          }`}>
            {notification.type === 'success' ? (
              <ICONS.Check className="w-5 h-5" />
            ) : (
              <ICONS.X className="w-5 h-5" />
            )}
            <span className="font-bold">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ICONS.X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabReports;
