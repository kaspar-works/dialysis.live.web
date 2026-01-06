import React, { useState } from 'react';
import { Link } from 'react-router';
import { ICONS } from '../constants';
import { analyzeSymptoms, getAIUsage, SymptomAnalysis, AIUsage, getSeverityColor, getSeverityLabel, MEDICAL_DISCLAIMER } from '../services/ai';
import { FeatureRestrictedError, SubscriptionLimitError } from '../services/auth';

const SymptomAnalysisPage: React.FC = () => {
  const [symptoms, setSymptoms] = useState('');
  const [analysis, setAnalysis] = useState<SymptomAnalysis | null>(null);
  const [usage, setUsage] = useState<AIUsage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [featureError, setFeatureError] = useState<{ message: string } | null>(null);
  const [limitError, setLimitError] = useState<{ message: string; limit?: number } | null>(null);

  const handleAnalyze = async () => {
    if (!symptoms.trim()) return;

    setIsLoading(true);
    setError(null);
    setFeatureError(null);
    setLimitError(null);

    try {
      const [analysisData, usageData] = await Promise.all([
        analyzeSymptoms(symptoms),
        getAIUsage().catch(() => null),
      ]);
      setAnalysis(analysisData);
      if (usageData) setUsage(usageData);
    } catch (err) {
      if (err instanceof FeatureRestrictedError) {
        setFeatureError({ message: err.message });
      } else if (err instanceof SubscriptionLimitError) {
        setLimitError({ message: err.message, limit: err.limit });
      } else {
        setError('Failed to analyze symptoms. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSymptoms('');
    setAnalysis(null);
    setError(null);
  };

  const SeverityIcon = ({ severity }: { severity: SymptomAnalysis['severity'] }) => {
    switch (severity) {
      case 'mild':
        return <ICONS.CheckCircle className="w-5 h-5" />;
      case 'moderate':
        return <ICONS.AlertCircle className="w-5 h-5" />;
      case 'severe':
      case 'emergency':
        return <ICONS.AlertTriangle className="w-5 h-5" />;
      default:
        return <ICONS.AlertCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center">
              <ICONS.Stethoscope className="w-5 h-5 text-white" />
            </div>
            Symptom Analysis
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            AI-powered symptom assessment for dialysis patients
          </p>
        </div>
        {usage && (
          <div className="text-sm text-slate-500 dark:text-slate-400">
            <span className="font-medium">{usage.used}</span>
            {usage.limit ? ` / ${usage.limit}` : ''} AI requests used
          </div>
        )}
      </div>

      {/* Feature Restricted Banner */}
      {featureError && (
        <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <ICONS.Lock className="w-6 h-6 text-purple-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-800 dark:text-white">Premium Feature</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">{featureError.message}</p>
              <Link
                to="/subscription/pricing"
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-purple-500 text-white rounded-xl text-sm font-medium hover:bg-purple-600 transition-colors"
              >
                View Plans <ICONS.ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <button onClick={() => setFeatureError(null)} className="text-slate-400 hover:text-slate-600">
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Limit Reached Banner */}
      {limitError && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <ICONS.AlertCircle className="w-6 h-6 text-amber-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-800 dark:text-white">Plan Limit Reached</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">{limitError.message}</p>
              <Link
                to="/subscription/pricing"
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors"
              >
                Upgrade Plan <ICONS.ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <button onClick={() => setLimitError(null)} className="text-slate-400 hover:text-slate-600">
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="font-bold text-slate-800 dark:text-white mb-4">Describe Your Symptoms</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Describe what you're experiencing in detail. Include when it started, severity, and any related factors.
          </p>
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Example: I've been experiencing muscle cramps in my legs during and after dialysis sessions for the past week. The pain is moderate and usually lasts about 30 minutes..."
            className="w-full h-48 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          />
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleAnalyze}
              disabled={!symptoms.trim() || isLoading}
              className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <ICONS.RefreshCw className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <ICONS.Send className="w-5 h-5" />
                  Analyze Symptoms
                </>
              )}
            </button>
            {analysis && (
              <button
                onClick={handleReset}
                className="px-4 py-3 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-4 italic">
            {MEDICAL_DISCLAIMER}
          </p>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {!analysis && !isLoading && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center">
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ICONS.Stethoscope className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                Describe Your Symptoms
              </h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Enter your symptoms on the left and click "Analyze" to get AI-powered insights.
              </p>
            </div>
          )}

          {isLoading && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center">
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                <ICONS.Stethoscope className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                Analyzing Symptoms...
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                Please wait while we assess your symptoms
              </p>
            </div>
          )}

          {analysis && (
            <>
              {/* Emergency Alert */}
              {analysis.seekMedicalAttention && (
                <div className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <ICONS.Phone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-red-600 dark:text-red-400 text-lg">
                        Seek Medical Attention
                      </h3>
                      <p className="text-red-600/80 dark:text-red-400/80 text-sm mt-1">
                        Based on your symptoms, we recommend contacting your healthcare provider or seeking emergency care.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Severity Badge */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-800 dark:text-white">Assessment</h3>
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border ${getSeverityColor(analysis.severity)}`}>
                    <SeverityIcon severity={analysis.severity} />
                    {getSeverityLabel(analysis.severity)}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  Confidence: <span className="font-medium capitalize">{analysis.confidence}</span>
                </p>
              </div>

              {/* AI Response */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="font-bold text-slate-800 dark:text-white mb-4">Analysis</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {analysis.response}
                </p>
              </div>

              {/* Possible Causes */}
              {analysis.possibleCauses.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                  <h3 className="font-bold text-slate-800 dark:text-white mb-4">Possible Causes</h3>
                  <ul className="space-y-2">
                    {analysis.possibleCauses.map((cause, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                        <span className="w-6 h-6 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center text-amber-600 dark:text-amber-400 text-sm font-bold flex-shrink-0">
                          {idx + 1}
                        </span>
                        {cause}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {analysis.recommendations.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                  <h3 className="font-bold text-slate-800 dark:text-white mb-4">Recommendations</h3>
                  <ul className="space-y-2">
                    {analysis.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                        <ICONS.CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Disclaimer */}
              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
                <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                  {analysis.disclaimer || MEDICAL_DISCLAIMER}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SymptomAnalysisPage;
