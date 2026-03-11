import React, { useState, useEffect, useRef } from 'react';
import {
  getTodayMeals,
  getMeals,
  createMeal,
  deleteMeal,
  getNutrientSummary,
  MealType,
  Meal,
  TodayMealsResponse,
  NutrientSummary,
  DAILY_LIMITS,
  getLimitColor,
  getLimitBgColor,
  formatNutrient,
  getMealTypeIcon,
  getMealTypeName,
} from '../services/nutrition';

const MEAL_TYPES: MealType[] = [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER, MealType.SNACK];

const NUTRIENT_LABELS: { key: 'sodium' | 'potassium' | 'phosphorus' | 'protein'; label: string; unit: string }[] = [
  { key: 'sodium', label: 'Sodium', unit: 'mg' },
  { key: 'potassium', label: 'Potassium', unit: 'mg' },
  { key: 'phosphorus', label: 'Phosphorus', unit: 'mg' },
  { key: 'protein', label: 'Protein', unit: 'g' },
];

export default function Nutrition() {
  const [todayData, setTodayData] = useState<TodayMealsResponse | null>(null);
  const [recentMeals, setRecentMeals] = useState<Meal[]>([]);
  const [summary, setSummary] = useState<NutrientSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    mealType: MealType.LUNCH as MealType,
    name: '',
    sodium: '',
    potassium: '',
    phosphorus: '',
    protein: '',
    calories: '',
    servingSize: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [todayRes, mealsRes, summaryRes] = await Promise.all([
        getTodayMeals().catch(() => null),
        getMeals({ limit: 30 }).catch(() => ({ meals: [], pagination: { total: 0, limit: 30, offset: 0 } })),
        getNutrientSummary(7).catch(() => null),
      ]);
      if (todayRes) setTodayData(todayRes);
      setRecentMeals(mealsRes.meals);
      if (summaryRes) setSummary(summaryRes);
    } catch (err) {
      console.error('Failed to load nutrition data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setIsSubmitting(true);
    try {
      await createMeal({
        mealType: formData.mealType,
        name: formData.name.trim(),
        nutrients: {
          sodium: formData.sodium ? parseFloat(formData.sodium) : undefined,
          potassium: formData.potassium ? parseFloat(formData.potassium) : undefined,
          phosphorus: formData.phosphorus ? parseFloat(formData.phosphorus) : undefined,
          protein: formData.protein ? parseFloat(formData.protein) : undefined,
          calories: formData.calories ? parseFloat(formData.calories) : undefined,
        },
        servingSize: formData.servingSize || undefined,
        notes: formData.notes || undefined,
      });
      setShowForm(false);
      setFormData({ mealType: MealType.LUNCH, name: '', sodium: '', potassium: '', phosphorus: '', protein: '', calories: '', servingSize: '', notes: '' });
      hasFetched.current = false;
      setIsLoading(true);
      hasFetched.current = true;
      await loadData();
    } catch (err) {
      console.error('Failed to create meal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (mealId: string) => {
    if (!confirm('Delete this meal?')) return;
    try {
      await deleteMeal(mealId);
      setRecentMeals(prev => prev.filter(m => m._id !== mealId));
      // Refresh today data if the deleted meal was from today
      const refreshed = await getTodayMeals().catch(() => null);
      if (refreshed) setTodayData(refreshed);
    } catch (err) {
      console.error('Failed to delete meal:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const totals = todayData?.totals || { sodium: 0, potassium: 0, phosphorus: 0, protein: 0, calories: 0 };
  const percentOfLimit = todayData?.percentOfLimit || { sodium: 0, potassium: 0, phosphorus: 0, protein: 0 };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Nutrition</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track meals and nutrients for your renal diet
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors"
        >
          {showForm ? 'Cancel' : '+ Log Meal'}
        </button>
      </div>

      {/* Meal Logging Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 space-y-4 border border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Meal Type</label>
              <select
                value={formData.mealType}
                onChange={e => setFormData(p => ({ ...p, mealType: e.target.value as MealType }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
              >
                {MEAL_TYPES.map(t => (
                  <option key={t} value={t}>{getMealTypeIcon(t)} {getMealTypeName(t)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Food Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                placeholder="e.g. Grilled Chicken"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Sodium (mg)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={formData.sodium}
                onChange={e => setFormData(p => ({ ...p, sodium: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Potassium (mg)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={formData.potassium}
                onChange={e => setFormData(p => ({ ...p, potassium: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Phosphorus (mg)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={formData.phosphorus}
                onChange={e => setFormData(p => ({ ...p, phosphorus: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Protein (g)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={formData.protein}
                onChange={e => setFormData(p => ({ ...p, protein: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Calories</label>
              <input
                type="number"
                min="0"
                step="any"
                value={formData.calories}
                onChange={e => setFormData(p => ({ ...p, calories: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Serving Size</label>
              <input
                type="text"
                value={formData.servingSize}
                onChange={e => setFormData(p => ({ ...p, servingSize: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                placeholder="e.g. 4 oz"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Notes (optional)</label>
            <input
              type="text"
              value={formData.notes}
              onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
              placeholder="Any notes about this meal"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
          >
            {isSubmitting ? 'Saving...' : 'Save Meal'}
          </button>
        </form>
      )}

      {/* Daily Nutrient Progress */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Daily Nutrient Limits</h2>
          <span className="text-xs text-slate-400 dark:text-slate-500">{todayData?.totalMeals || 0} meals today</span>
        </div>
        <div className="space-y-3">
          {NUTRIENT_LABELS.map(({ key, label, unit }) => {
            const pct = percentOfLimit[key] || 0;
            const current = totals[key] || 0;
            const limit = DAILY_LIMITS[key];
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
                  <span className={`text-sm font-semibold ${getLimitColor(pct)}`}>
                    {Math.round(current)}{unit} / {limit}{unit} ({pct}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getLimitBgColor(pct)}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
          {/* Calories row - no limit, just display */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Calories</span>
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{Math.round(totals.calories || 0)} cal</span>
          </div>
        </div>
      </div>

      {/* Today's Meals by Type */}
      {todayData && todayData.totalMeals > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Today's Meals</h2>
          <div className="space-y-4">
            {MEAL_TYPES.map(type => {
              const meals = todayData.mealsByType[type];
              if (!meals || meals.length === 0) return null;
              return (
                <div key={type}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{getMealTypeIcon(type)}</span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{getMealTypeName(type)}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">({meals.length})</span>
                  </div>
                  <div className="space-y-2 ml-7">
                    {meals.map(meal => (
                      <div key={meal._id} className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{meal.name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {[
                              meal.nutrients.sodium !== undefined && formatNutrient('sodium', meal.nutrients.sodium),
                              meal.nutrients.potassium !== undefined && formatNutrient('potassium', meal.nutrients.potassium),
                              meal.nutrients.phosphorus !== undefined && formatNutrient('phosphorus', meal.nutrients.phosphorus),
                              meal.nutrients.protein !== undefined && formatNutrient('protein', meal.nutrients.protein),
                            ].filter(Boolean).join(' / ') || 'No nutrient data'}
                            {meal.servingSize && ` - ${meal.servingSize}`}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(meal._id)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1 ml-2 flex-shrink-0"
                          title="Delete"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7-Day Nutrient Summary */}
      {summary && summary.daysWithData > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">7-Day Summary</h2>
            <span className="text-xs text-slate-400 dark:text-slate-500">{summary.daysWithData} days with data / {summary.totalMeals} meals</span>
          </div>

          {/* Daily Averages */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {NUTRIENT_LABELS.map(({ key, label, unit }) => {
              const avg = summary.dailyAverages[key] || 0;
              const limit = DAILY_LIMITS[key];
              const avgPct = Math.round((avg / limit) * 100);
              const overDays = summary.daysOverLimit[key as keyof typeof summary.daysOverLimit] || 0;
              return (
                <div key={key} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Avg {label}</div>
                  <div className={`text-lg font-bold ${getLimitColor(avgPct)}`}>
                    {Math.round(avg)}{unit}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500">
                    {avgPct}% of limit
                  </div>
                  {overDays > 0 && (
                    <div className="text-[10px] text-rose-500 font-medium mt-0.5">
                      Over limit {overDays}d
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Daily Breakdown Bars */}
          {Object.keys(summary.dailyBreakdown).length > 0 && (
            <div>
              <h3 className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Daily Sodium Trend</h3>
              <div className="flex items-end gap-1.5 h-20">
                {Object.entries(summary.dailyBreakdown)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([date, entry]) => {
                    const pct = Math.round((entry.sodium / DAILY_LIMITS.sodium) * 100);
                    const barHeight = Math.max(4, Math.min(pct, 150));
                    return (
                      <div key={date} className="flex-1 flex flex-col items-center gap-0.5">
                        <div className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">{entry.mealCount}m</div>
                        <div
                          className={`w-full rounded-t min-h-[4px] transition-all ${getLimitBgColor(pct)}`}
                          style={{ height: `${(barHeight / 150) * 100}%` }}
                          title={`${date}: ${Math.round(entry.sodium)}mg sodium (${pct}%)`}
                        />
                        <div className="text-[9px] text-slate-400 dark:text-slate-500">
                          {new Date(date + 'T00:00:00').toLocaleDateString('en', { weekday: 'narrow' })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Meal History */}
      {recentMeals.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Recent Meals</h2>
          <div className="space-y-3">
            {recentMeals.map(meal => (
              <div key={meal._id} className="flex items-center gap-3 py-2 border-b border-slate-200 dark:border-slate-800 last:border-0">
                <span className="text-xl flex-shrink-0">{getMealTypeIcon(meal.mealType)}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{meal.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {getMealTypeName(meal.mealType)}
                    {meal.servingSize && ` - ${meal.servingSize}`}
                    {meal.nutrients.calories !== undefined && ` - ${Math.round(meal.nutrients.calories)} cal`}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                    {[
                      meal.nutrients.sodium !== undefined && `Na: ${formatNutrient('sodium', meal.nutrients.sodium)}`,
                      meal.nutrients.potassium !== undefined && `K: ${formatNutrient('potassium', meal.nutrients.potassium)}`,
                      meal.nutrients.phosphorus !== undefined && `P: ${formatNutrient('phosphorus', meal.nutrients.phosphorus)}`,
                      meal.nutrients.protein !== undefined && `Pro: ${formatNutrient('protein', meal.nutrients.protein)}`,
                    ].filter(Boolean).join(' / ')}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(meal.loggedAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500">
                    {new Date(meal.loggedAt).toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(meal._id)}
                  className="text-slate-400 hover:text-red-500 transition-colors p-1 flex-shrink-0"
                  title="Delete"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {recentMeals.length === 0 && (!todayData || todayData.totalMeals === 0) && (
        <div className="text-center py-12">
          <p className="text-slate-500 dark:text-slate-400 text-sm">No meals logged yet. Tap "Log Meal" to start tracking your renal diet.</p>
        </div>
      )}
    </div>
  );
}
