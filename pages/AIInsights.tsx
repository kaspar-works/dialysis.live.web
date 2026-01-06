import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ICONS } from '../constants';
import { getInsights, getAIUsage, HealthInsights, AIUsage, getWeightTrendIcon, MEDICAL_DISCLAIMER } from '../services/ai';
import { FeatureRestrictedError, SubscriptionLimitError } from '../services/auth';

const AIInsightsPage: React.FC = () => {
  const [insights, setInsights] = useState<HealthInsights | null>(null);
  const [usage, setUsage] = useState<AIUsage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [featureError, setFeatureError] = useState<{ message: string } | null>(null);
  const [limitError, setLimitError] = useState<{ message: string; limit?: number } | null>(null);

  const fetchInsights = async () => {
    setIsLoading(true);
    setError(null);
    setFeatureError(null);
    setLimitError(null);

    try {
      const [insightsData, usageData] = await Promise.all([
        getInsights(),
        getAIUsage().catch(() => null),
      ]);
      setInsights(insightsData);
      if (usageData) setUsage(usageData);
    } catch (err) {
      if (err instanceof FeatureRestrictedError) {
        setFeatureError({ message: err.message });
      } else if (err instanceof SubscriptionLimitError) {
        setLimitError({ message: err.message, limit: err.limit });
      } else {
        setError('Failed to generate insights. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const WeightTrendIcon = () => {
    if (!insights) return null;
    const trend = insights.analyzedData.weightTrend;
    switch (trend) {
      case 'increasing':
        return <ICONS.TrendingUp className="w-5 h-5 text-amber-500" />;
      case 'decreasing':
        return <ICONS.TrendingDown className="w-5 h-5 text-emerald-500" />;
      default:
        return <ICONS.Minus className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <ICONS.Sparkles className="w-5 h-5 text-white" />
            </div>
            AI Health Insights
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Personalized health analysis based on your data
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

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Generate Button & Data Summary */}
        <div className="space-y-6">
          {/* Generate Button */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="font-bold text-slate-800 dark:text-white mb-4">Generate Insights</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Our AI analyzes your recent dialysis sessions, weight trends, medication adherence, and symptoms to provide personalized health insights.
            </p>
            <button
              onClick={fetchInsights}
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <ICONS.RefreshCw className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <ICONS.Sparkles className="w-5 h-5" />
                  Get AI Insights
                </>
              )}
            </button>
          </div>

          {/* Data Summary */}
          {insights && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="font-bold text-slate-800 dark:text-white mb-4">Data Analyzed</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-300 text-sm flex items-center gap-2">
                    <ICONS.Activity className="w-4 h-4 text-sky-500" />
                    Recent Sessions
                  </span>
                  <span className="font-bold text-slate-800 dark:text-white">
                    {insights.analyzedData.recentSessions}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-300 text-sm flex items-center gap-2">
                    <ICONS.TrendingUp className="w-4 h-4 text-emerald-500" />
                    Avg. Fluid Removal
                  </span>
                  <span className="font-bold text-slate-800 dark:text-white">
                    {insights.analyzedData.averageUf.toFixed(1)} L
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-300 text-sm flex items-center gap-2">
                    <WeightTrendIcon />
                    Weight Trend
                  </span>
                  <span className="font-bold text-slate-800 dark:text-white capitalize">
                    {insights.analyzedData.weightTrend}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-300 text-sm flex items-center gap-2">
                    <ICONS.Pill className="w-4 h-4 text-amber-500" />
                    Missed Medications
                  </span>
                  <span className={`font-bold ${insights.analyzedData.missedMedications > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {insights.analyzedData.missedMedications}
                  </span>
                </div>
                {insights.analyzedData.symptoms.length > 0 && (
                  <div>
                    <span className="text-slate-600 dark:text-slate-300 text-sm flex items-center gap-2 mb-2">
                      <ICONS.AlertCircle className="w-4 h-4 text-orange-500" />
                      Recent Symptoms
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {insights.analyzedData.symptoms.map((symptom, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs rounded-lg"
                        >
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Insights */}
        <div className="lg:col-span-2">
          {!insights && !isLoading && !featureError && !limitError && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center">
              <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ICONS.Sparkles className="w-8 h-8 text-violet-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                Ready for Insights?
              </h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Click "Get AI Insights" to analyze your health data and receive personalized recommendations.
              </p>
            </div>
          )}

          {isLoading && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center">
              <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                <ICONS.Sparkles className="w-8 h-8 text-violet-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                Analyzing Your Health Data...
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                This may take a few seconds
              </p>
            </div>
          )}

          {insights && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <ICONS.Sparkles className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Your Personalized Insights</h2>
              </div>

              <div className="prose prose-slate dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">
                  {insights.response}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                  {insights.disclaimer || MEDICAL_DISCLAIMER}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIInsightsPage;
