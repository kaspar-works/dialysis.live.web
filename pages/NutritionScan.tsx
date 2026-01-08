
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Link } from 'react-router';
import { ICONS } from '../constants';
import { MealNutrients } from '../types';
import {
  analyzeFoodByText,
  searchCachedFoods,
  createMeal,
  getTodayMeals,
  getMeals,
  deleteMeal,
  MealType,
  TodayMealsResponse,
  Meal,
  DAILY_LIMITS,
  NutriAuditResult,
  CachedFood,
} from '../services/nutrition';
import { authFetch, SubscriptionLimitError, FeatureRestrictedError } from '../services/auth';
import { useSettings } from '../contexts/SettingsContext';

const COMMON_FOODS = [
  { name: 'Apple', sodium: 1, potassium: 107, phosphorus: 11, protein: 0.3 },
  { name: 'Banana', sodium: 1, potassium: 358, phosphorus: 22, protein: 1.1 },
  { name: 'White Rice (1 cup)', sodium: 5, potassium: 55, phosphorus: 68, protein: 4.3 },
  { name: 'Chicken Breast', sodium: 74, potassium: 256, phosphorus: 228, protein: 31 },
  { name: 'Egg (Large)', sodium: 71, potassium: 69, phosphorus: 91, protein: 6.3 },
  { name: 'Salmon Fillet', sodium: 59, potassium: 363, phosphorus: 240, protein: 20 },
  { name: 'Green Beans', sodium: 6, potassium: 211, phosphorus: 38, protein: 1.8 },
  { name: 'Blueberries', sodium: 1, potassium: 77, phosphorus: 12, protein: 0.7 },
];

const LIMITS = { sodium: DAILY_LIMITS.sodium, potassium: DAILY_LIMITS.potassium, phosphorus: DAILY_LIMITS.phosphorus, protein: DAILY_LIMITS.protein };

const NutritionScan: React.FC = () => {
  const { displayTime, displayWeekdayDate } = useSettings();
  const [image, setImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<NutriAuditResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [mealName, setMealName] = useState('');
  const [manualNutrients, setManualNutrients] = useState<MealNutrients>({ sodium: 0, potassium: 0, phosphorus: 0, protein: 0 });
  const [activeTab, setActiveTab] = useState<'scan' | 'search' | 'manual'>('search');
  const [isLoading, setIsLoading] = useState(true);
  const [isLogging, setIsLogging] = useState(false);
  const [todayData, setTodayData] = useState<TodayMealsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Page-level tab state
  const [pageTab, setPageTab] = useState<'scan' | 'history'>('scan');
  // All meals view state
  const [allMeals, setAllMeals] = useState<Meal[]>([]);
  const [allMealsTotal, setAllMealsTotal] = useState(0);
  const [isLoadingAllMeals, setIsLoadingAllMeals] = useState(false);
  // Pagination for history
  const [historyPage, setHistoryPage] = useState(1);
  const historyItemsPerPage = 10;
  const [limitError, setLimitError] = useState<{ message: string; limit?: number } | null>(null);
  const [featureError, setFeatureError] = useState<{ message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasFetched = useRef(false);

  // Text-based search state
  const [cachedSuggestions, setCachedSuggestions] = useState<CachedFood[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [textAnalysisResult, setTextAnalysisResult] = useState<NutriAuditResult | null>(null);
  const [isAnalyzingText, setIsAnalyzingText] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch today's meals on mount
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchTodayMeals = async () => {
      try {
        const data = await getTodayMeals();
        setTodayData(data);
      } catch (err) {
        console.error('Failed to fetch today meals:', err);
        setError('Failed to load meals');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTodayMeals();
  }, []);

  // Fetch all meals when switching to history tab
  useEffect(() => {
    if (pageTab !== 'history') return;

    const fetchAllMeals = async () => {
      setIsLoadingAllMeals(true);
      try {
        const data = await getMeals({ limit: 200 });
        setAllMeals(data.meals);
        setAllMealsTotal(data.pagination?.total || data.meals.length);
      } catch (err) {
        console.error('Failed to fetch all meals:', err);
        setError('Failed to load all meals');
      } finally {
        setIsLoadingAllMeals(false);
      }
    };
    fetchAllMeals();
  }, [pageTab]);

  // Search cached foods when query changes
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery || searchQuery.length < 2) {
      setCachedSuggestions([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const result = await searchCachedFoods(searchQuery, 5);
        setCachedSuggestions(result.foods);
      } catch (err) {
        console.error('Failed to search foods:', err);
        setCachedSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Combined suggestions (API + local fallback)
  const suggestions = useMemo(() => {
    if (!searchQuery) return [];
    // If we have API results, use those
    if (cachedSuggestions.length > 0) return cachedSuggestions;
    // Fallback to local common foods while API is loading or if no results
    return COMMON_FOODS.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5);
  }, [searchQuery, cachedSuggestions]);

  const todayMeals = useMemo(() => {
    return todayData?.meals || [];
  }, [todayData]);

  const totals = useMemo(() => {
    return todayData?.totals || { sodium: 0, potassium: 0, phosphorus: 0, protein: 0, calories: 0 };
  }, [todayData]);

  // Paginated meals for history view
  const paginatedMeals = useMemo(() => {
    const startIndex = (historyPage - 1) * historyItemsPerPage;
    return allMeals.slice(startIndex, startIndex + historyItemsPerPage);
  }, [allMeals, historyPage, historyItemsPerPage]);

  const totalHistoryPages = Math.ceil(allMeals.length / historyItemsPerPage);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setScanResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScan = async () => {
    if (!image) return;
    setIsScanning(true);
    setError(null);

    try {
      // Extract base64 data and mime type from data URL
      const mimeType = image.split(';')[0].split(':')[1] || 'image/jpeg';
      const base64Data = image.includes(',') ? image.split(',')[1] : image;

      // Call analyze endpoint directly
      const response = await authFetch('/nutri-audit/analyze', {
        method: 'POST',
        body: JSON.stringify({ image: base64Data, mimeType }),
      });

      // Store the NutriAuditResult directly
      setScanResult(response.data as NutriAuditResult);
    } catch (err) {
      if (err instanceof SubscriptionLimitError) {
        setLimitError({ message: err.message, limit: err.limit });
      } else if (err instanceof FeatureRestrictedError) {
        setFeatureError({ message: err.message });
      } else {
        console.error('Failed to analyze image:', err);
        setError('Failed to analyze image. Please try again.');
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectFood = (food: typeof COMMON_FOODS[0] | CachedFood) => {
    // Check if it's a cached food from API (has _id)
    if ('_id' in food) {
      // It's a CachedFood
      setMealName(food.name);
      setManualNutrients({
        sodium: food.sodium.amount,
        potassium: food.potassium.amount,
        phosphorus: food.phosphorus.amount,
        protein: food.protein?.amount || 0,
      });
    } else {
      // It's a local common food
      setMealName(food.name);
      setManualNutrients({ sodium: food.sodium, potassium: food.potassium, phosphorus: food.phosphorus, protein: food.protein });
    }
    setSearchQuery('');
    setIsSearchFocused(false);
    setCachedSuggestions([]);
    setActiveTab('manual');
  };

  // Analyze food by text
  const handleAnalyzeText = async () => {
    if (!searchQuery || searchQuery.length < 2) return;

    setIsAnalyzingText(true);
    setError(null);
    setTextAnalysisResult(null);

    try {
      const result = await analyzeFoodByText(searchQuery);
      setTextAnalysisResult(result);
      setSearchQuery('');
      setIsSearchFocused(false);
      setCachedSuggestions([]);
    } catch (err) {
      if (err instanceof SubscriptionLimitError) {
        setLimitError({ message: err.message, limit: err.limit });
      } else if (err instanceof FeatureRestrictedError) {
        setFeatureError({ message: err.message });
      } else {
        console.error('Failed to analyze food:', err);
        setError('Failed to analyze food. Please try again.');
      }
    } finally {
      setIsAnalyzingText(false);
    }
  };

  // Log meal from text analysis result
  const handleLogTextAnalysisResult = async () => {
    if (!textAnalysisResult || !textAnalysisResult.foods.length) return;

    const food = textAnalysisResult.foods[0];
    await handleLogMeal(food.name, {
      sodium: food.sodium.amount,
      potassium: food.potassium.amount,
      phosphorus: food.phosphorus.amount,
      protein: food.protein?.amount || 0,
    }, true);
    setTextAnalysisResult(null);
  };

  // Log meal from image scan result
  const handleLogScanResult = async () => {
    if (!scanResult || !scanResult.foods.length) return;

    const food = scanResult.foods[0];
    await handleLogMeal(food.name, {
      sodium: food.sodium.amount,
      potassium: food.potassium.amount,
      phosphorus: food.phosphorus.amount,
      protein: food.protein?.amount || 0,
    }, true);
    setScanResult(null);
    setImage(null);
  };

  const handleLogMeal = async (name: string, nutrients: MealNutrients, isAiScanned: boolean = false) => {
    setIsLogging(true);
    setError(null);

    try {
      const newMeal = await createMeal({
        mealType: MealType.SNACK, // Default to snack, could be enhanced with a selector
        name,
        nutrients: {
          sodium: nutrients.sodium,
          potassium: nutrients.potassium,
          phosphorus: nutrients.phosphorus,
          protein: nutrients.protein,
        },
      });

      // Refresh today's data
      const data = await getTodayMeals();
      setTodayData(data);

      // Also refresh all meals if in history tab
      if (pageTab === 'history') {
        const allData = await getMeals({ limit: 200 });
        setAllMeals(allData.meals);
        setAllMealsTotal(allData.pagination?.total || allData.meals.length);
      }

      resetForm();
    } catch (err) {
      if (err instanceof SubscriptionLimitError) {
        setLimitError({ message: err.message, limit: err.limit });
      } else {
        console.error('Failed to log meal:', err);
        setError('Failed to log meal. Please try again.');
      }
    } finally {
      setIsLogging(false);
    }
  };

  const handleRemoveMeal = async (mealId: string) => {
    try {
      await deleteMeal(mealId);
      // Refresh today's data
      const data = await getTodayMeals();
      setTodayData(data);
      // Also refresh all meals if in history tab
      if (pageTab === 'history') {
        const allData = await getMeals({ limit: 200 });
        setAllMeals(allData.meals);
        setAllMealsTotal(allData.pagination?.total || allData.meals.length);
      }
    } catch (err) {
      console.error('Failed to delete meal:', err);
      setError('Failed to delete meal');
    }
  };

  const resetForm = () => {
    setImage(null);
    setScanResult(null);
    setMealName('');
    setManualNutrients({ sodium: 0, potassium: 0, phosphorus: 0, protein: 0 });
  };

  const NutrientCard = ({ label, value, limit, unit, color, icon }: { label: string; value: number; limit: number; unit: string; color: string; icon: string }) => {
    const percent = Math.min((value / limit) * 100, 100);
    const isHigh = percent > 80;
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
          </div>
          <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600">/{limit}{unit}</span>
        </div>
        <div className="flex items-baseline gap-1 mb-3">
          <span className={`text-3xl font-black tabular-nums ${isHigh ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>{unit === 'g' ? value.toFixed(1) : Math.round(value)}</span>
          <span className="text-sm text-slate-400">{unit}</span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${percent}%` }} />
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading meals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-24 px-4 animate-in fade-in duration-500">

      {/* Header */}
      <header className="flex items-center justify-between pt-2">
        <div>
          <span className="text-emerald-500 text-xs font-bold uppercase tracking-wider">Nutrition</span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">NutriScan</h1>
        </div>
      </header>

      {/* Page-level Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
        <button
          onClick={() => setPageTab('scan')}
          className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            pageTab === 'scan'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <ICONS.Camera className="w-5 h-5" />
          Scan Food
        </button>
        <button
          onClick={() => setPageTab('history')}
          className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            pageTab === 'history'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <ICONS.Activity className="w-5 h-5" />
          Meal History
        </button>
      </div>

      {/* Subscription Limit Banner */}
      {limitError && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-amber-700 dark:text-amber-400 text-lg">Plan Limit Reached</h3>
              <p className="text-amber-600 dark:text-amber-500 mt-1">{limitError.message}</p>
              <div className="flex items-center gap-3 mt-4">
                <Link
                  to="/pricing"
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-sm hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/20"
                >
                  Upgrade Plan
                </Link>
                <button
                  onClick={() => setLimitError(null)}
                  className="px-4 py-2.5 text-amber-600 dark:text-amber-400 font-medium text-sm hover:bg-amber-500/10 rounded-xl transition-all"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature Restriction Banner */}
      {featureError && (
        <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🔒</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-purple-700 dark:text-purple-400 text-lg">Premium Feature</h3>
              <p className="text-purple-600 dark:text-purple-500 mt-1">{featureError.message}</p>
              <div className="flex items-center gap-3 mt-4">
                <Link
                  to="/pricing"
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-bold text-sm hover:from-purple-600 hover:to-indigo-600 transition-all shadow-lg shadow-purple-500/20"
                >
                  View Plans
                </Link>
                <button
                  onClick={() => setFeatureError(null)}
                  className="px-4 py-2.5 text-purple-600 dark:text-purple-400 font-medium text-sm hover:bg-purple-500/10 rounded-xl transition-all"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center justify-between">
          <p className="text-rose-500 font-medium">{error}</p>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-600">
            <ICONS.X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ===== SCAN TAB CONTENT ===== */}
      {pageTab === 'scan' && (
        <>
          {/* Today's Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <NutrientCard label="Sodium" value={totals.sodium} limit={LIMITS.sodium} unit="mg" color="bg-sky-500" icon="🧂" />
            <NutrientCard label="Potassium" value={totals.potassium} limit={LIMITS.potassium} unit="mg" color="bg-orange-500" icon="🍌" />
            <NutrientCard label="Phosphorus" value={totals.phosphorus} limit={LIMITS.phosphorus} unit="mg" color="bg-purple-500" icon="🥩" />
            <NutrientCard label="Protein" value={totals.protein} limit={LIMITS.protein} unit="g" color="bg-emerald-500" icon="🥚" />
          </div>

          {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Input Section */}
        <div className="lg:col-span-2 space-y-6">

          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'search' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-400'}`}
            >
              Text Search
            </button>
            <button
              onClick={() => setActiveTab('scan')}
              className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'scan' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-400'}`}
            >
              Photo Scan
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'manual' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-400'}`}
            >
              Manual
            </button>
          </div>

          {/* Text Search Tab */}
          {activeTab === 'search' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {/* Search Input */}
              <div className="p-6 space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    {isSearching || isAnalyzingText ? (
                      <div className="w-5 h-5 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                    ) : (
                      <ICONS.Activity className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                    )}
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                    onKeyDown={e => e.key === 'Enter' && handleAnalyzeText()}
                    placeholder="Search or type any food (e.g., banana, pizza, chicken curry)..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-4 pl-12 pr-4 font-medium text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  />
                </div>

                {/* Suggestions Dropdown */}
                {isSearchFocused && suggestions.length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                      {cachedSuggestions.length > 0 ? 'Previously Analyzed' : 'Common Foods'}
                    </div>
                    {suggestions.map((food, idx) => {
                      const isCached = '_id' in food;
                      return (
                        <button
                          key={isCached ? food._id : idx}
                          onClick={() => handleSelectFood(food)}
                          className="w-full px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between border-b last:border-b-0 border-slate-100 dark:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {isCached && (
                              <span className={`w-2 h-2 rounded-full ${
                                food.renalRisk === 'safe' ? 'bg-emerald-500' :
                                food.renalRisk === 'caution' ? 'bg-amber-500' : 'bg-rose-500'
                              }`} />
                            )}
                            <span className="font-bold text-slate-900 dark:text-white">{food.name}</span>
                            {isCached && food.portion && (
                              <span className="text-xs text-slate-400">({food.portion})</span>
                            )}
                          </div>
                          <div className="flex gap-4 text-xs text-slate-400">
                            <span>K: {isCached ? food.potassium.amount : food.potassium}mg</span>
                            <span>Na: {isCached ? food.sodium.amount : food.sodium}mg</span>
                            <span>P: {isCached ? food.phosphorus.amount : food.phosphorus}mg</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Analyze Button */}
                <button
                  onClick={handleAnalyzeText}
                  disabled={!searchQuery || searchQuery.length < 2 || isAnalyzingText}
                  className="w-full py-4 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isAnalyzingText ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <ICONS.Activity className="w-5 h-5" />
                      Analyze Food
                    </>
                  )}
                </button>

                <p className="text-xs text-slate-400 text-center">
                  Type any food name and press Enter or click Analyze. Results are cached for faster lookups.
                </p>
              </div>

              {/* Text Analysis Result */}
              {textAnalysisResult && textAnalysisResult.foods.length > 0 && (
                <div className="border-t border-slate-100 dark:border-slate-700">
                  {/* Header */}
                  <div className="p-6 bg-slate-50 dark:bg-slate-900 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${
                          textAnalysisResult.overallRisk === 'safe' ? 'bg-emerald-500' :
                          textAnalysisResult.overallRisk === 'caution' ? 'bg-amber-500' : 'bg-rose-500'
                        }`} />
                        <span className={`text-xs font-bold uppercase ${
                          textAnalysisResult.overallRisk === 'safe' ? 'text-emerald-500' :
                          textAnalysisResult.overallRisk === 'caution' ? 'text-amber-500' : 'text-rose-500'
                        }`}>
                          {textAnalysisResult.overallRisk === 'safe' ? 'Kidney Friendly' :
                           textAnalysisResult.overallRisk === 'caution' ? 'Use Caution' : 'High Risk'}
                        </span>
                        {textAnalysisResult.fromCache && (
                          <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-500">Cached</span>
                        )}
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white">{textAnalysisResult.foods[0].name}</h3>
                      {textAnalysisResult.foods[0].portion && (
                        <p className="text-sm text-slate-400 mt-1">Portion: {textAnalysisResult.foods[0].portion}</p>
                      )}
                    </div>
                    <button
                      onClick={handleLogTextAnalysisResult}
                      disabled={isLogging}
                      className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {isLogging ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        <ICONS.Plus className="w-4 h-4" />
                      )}
                      {isLogging ? 'Logging...' : 'Log Meal'}
                    </button>
                  </div>

                  {/* Nutrients with Risk Levels */}
                  <div className="p-6 grid grid-cols-3 gap-4">
                    {[
                      { key: 'sodium', label: 'Sodium', icon: '🧂', color: 'sky' },
                      { key: 'potassium', label: 'Potassium', icon: '🍌', color: 'orange' },
                      { key: 'phosphorus', label: 'Phosphorus', icon: '🥩', color: 'purple' },
                    ].map(n => {
                      const nutrient = textAnalysisResult.foods[0][n.key as keyof typeof textAnalysisResult.foods[0]] as { amount: number; unit: string; level: string; dailyLimitPercent: number };
                      const levelColor = nutrient.level === 'low' ? 'text-emerald-500' :
                                        nutrient.level === 'moderate' ? 'text-amber-500' :
                                        nutrient.level === 'high' ? 'text-orange-500' : 'text-rose-500';
                      return (
                        <div key={n.key} className="text-center">
                          <span className="text-2xl block mb-1">{n.icon}</span>
                          <p className={`text-2xl font-black text-${n.color}-500`}>{nutrient.amount}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{n.label}</p>
                          <p className={`text-xs font-bold ${levelColor} capitalize`}>{nutrient.level.replace('_', ' ')}</p>
                          <p className="text-xs text-slate-400">{nutrient.dailyLimitPercent}% daily</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Recommendations & Alternatives */}
                  <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 space-y-4">
                    {textAnalysisResult.foods[0].notes && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">{textAnalysisResult.foods[0].notes}</p>
                    )}

                    {textAnalysisResult.recommendations.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Recommendations</h4>
                        <div className="space-y-2">
                          {textAnalysisResult.recommendations.map((rec, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm">
                              <span className="text-emerald-500 mt-0.5">•</span>
                              <span className="text-slate-600 dark:text-slate-400">{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {textAnalysisResult.alternatives.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kidney-Friendly Alternatives</h4>
                        <div className="space-y-2">
                          {textAnalysisResult.alternatives.map((alt, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm">
                              <span className="text-sky-500 mt-0.5">→</span>
                              <span className="text-slate-600 dark:text-slate-400">{alt}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-slate-400 italic">{textAnalysisResult.disclaimer}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Scan Tab */}
          {activeTab === 'scan' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {/* Upload Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`relative cursor-pointer aspect-video flex flex-col items-center justify-center p-8 ${image ? '' : 'bg-slate-50 dark:bg-slate-900'}`}
              >
                {image ? (
                  <>
                    <img src={image} className="absolute inset-0 w-full h-full object-cover" alt="Food" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <span className="text-white font-bold text-sm">Click to change</span>
                    </div>
                    {isScanning && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="text-center text-white">
                          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
                          <p className="font-bold">Analyzing...</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <ICONS.Camera className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white mb-1">Upload food photo</p>
                    <p className="text-sm text-slate-400">Click or drag image here</p>
                  </div>
                )}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
              </div>

              {/* Scan Button */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={handleScan}
                  disabled={!image || isScanning}
                  className="w-full py-4 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isScanning ? 'Analyzing...' : 'Analyze with AI'}
                </button>
              </div>

              {/* Scan Result */}
              {scanResult && scanResult.foods && scanResult.foods.length > 0 && (
                <div className="border-t border-slate-100 dark:border-slate-700">
                  {/* Header */}
                  <div className="p-6 bg-slate-50 dark:bg-slate-900 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${
                          scanResult.overallRisk === 'safe' ? 'bg-emerald-500' :
                          scanResult.overallRisk === 'caution' ? 'bg-amber-500' : 'bg-rose-500'
                        }`} />
                        <span className={`text-xs font-bold uppercase ${
                          scanResult.overallRisk === 'safe' ? 'text-emerald-500' :
                          scanResult.overallRisk === 'caution' ? 'text-amber-500' : 'text-rose-500'
                        }`}>
                          {scanResult.overallRisk === 'safe' ? 'Kidney Friendly' :
                           scanResult.overallRisk === 'caution' ? 'Use Caution' : 'High Risk'}
                        </span>
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white">{scanResult.mealDescription || scanResult.foods[0].name}</h3>
                      {scanResult.foods[0].portion && (
                        <p className="text-sm text-slate-400 mt-1">Portion: {scanResult.foods[0].portion}</p>
                      )}
                    </div>
                    <button
                      onClick={handleLogScanResult}
                      disabled={isLogging}
                      className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {isLogging ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        <ICONS.Plus className="w-4 h-4" />
                      )}
                      {isLogging ? 'Logging...' : 'Log Meal'}
                    </button>
                  </div>

                  {/* Foods List */}
                  {scanResult.foods.map((food, foodIdx) => (
                    <div key={foodIdx} className="border-t border-slate-100 dark:border-slate-700">
                      {scanResult.foods.length > 1 && (
                        <div className="px-6 pt-4 flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            food.renalRisk === 'safe' ? 'bg-emerald-500' :
                            food.renalRisk === 'caution' ? 'bg-amber-500' : 'bg-rose-500'
                          }`} />
                          <span className="font-bold text-slate-900 dark:text-white">{food.name}</span>
                          {food.portion && <span className="text-xs text-slate-400">({food.portion})</span>}
                        </div>
                      )}

                      {/* Nutrients with Risk Levels */}
                      <div className="p-6 grid grid-cols-3 gap-4">
                        {[
                          { key: 'sodium', label: 'Sodium', icon: '🧂', color: 'sky' },
                          { key: 'potassium', label: 'Potassium', icon: '🍌', color: 'orange' },
                          { key: 'phosphorus', label: 'Phosphorus', icon: '🥩', color: 'purple' },
                        ].map(n => {
                          const nutrient = food[n.key as keyof typeof food] as { amount: number; unit: string; level: string; dailyLimitPercent: number };
                          const levelColor = nutrient.level === 'low' ? 'text-emerald-500' :
                                            nutrient.level === 'moderate' ? 'text-amber-500' :
                                            nutrient.level === 'high' ? 'text-orange-500' : 'text-rose-500';
                          return (
                            <div key={n.key} className="text-center">
                              <span className="text-2xl block mb-1">{n.icon}</span>
                              <p className={`text-2xl font-black text-${n.color}-500`}>{nutrient.amount}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">{n.label}</p>
                              <p className={`text-xs font-bold ${levelColor} capitalize`}>{nutrient.level.replace('_', ' ')}</p>
                              <p className="text-xs text-slate-400">{nutrient.dailyLimitPercent}% daily</p>
                            </div>
                          );
                        })}
                      </div>

                      {food.notes && (
                        <div className="px-6 pb-4">
                          <p className="text-sm text-slate-600 dark:text-slate-400 italic">{food.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Recommendations & Alternatives */}
                  <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 space-y-4">
                    {scanResult.recommendations && scanResult.recommendations.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Recommendations</h4>
                        <div className="space-y-2">
                          {scanResult.recommendations.map((rec, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm">
                              <span className="text-emerald-500 mt-0.5">•</span>
                              <span className="text-slate-600 dark:text-slate-400">{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {scanResult.alternatives && scanResult.alternatives.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kidney-Friendly Alternatives</h4>
                        <div className="space-y-2">
                          {scanResult.alternatives.map((alt, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm">
                              <span className="text-sky-500 mt-0.5">→</span>
                              <span className="text-slate-600 dark:text-slate-400">{alt}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {scanResult.disclaimer && (
                      <p className="text-xs text-slate-400 italic">{scanResult.disclaimer}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Manual Entry Tab */}
          {activeTab === 'manual' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Meal Name</label>
                <input
                  type="text"
                  value={mealName}
                  onChange={e => setMealName(e.target.value)}
                  placeholder="e.g. Grilled Chicken Salad"
                  className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-4 font-bold text-lg text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'sodium', label: 'Sodium', unit: 'mg', icon: '🧂' },
                  { key: 'potassium', label: 'Potassium', unit: 'mg', icon: '🍌' },
                  { key: 'phosphorus', label: 'Phosphorus', unit: 'mg', icon: '🥩' },
                  { key: 'protein', label: 'Protein', unit: 'g', icon: '🥚' },
                ].map(n => (
                  <div key={n.key}>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <span>{n.icon}</span> {n.label}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={manualNutrients[n.key as keyof MealNutrients] || ''}
                        onChange={e => setManualNutrients({ ...manualNutrients, [n.key]: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-4 font-bold text-xl text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 tabular-nums"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-300 dark:text-slate-600">{n.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleLogMeal(mealName, manualNutrients, false)}
                disabled={!mealName || isLogging}
                className="w-full py-4 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLogging ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <ICONS.Plus className="w-5 h-5" />
                )}
                {isLogging ? 'Logging...' : 'Log Meal'}
              </button>
            </div>
          )}
        </div>

        {/* Right: Today's Meals */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Today's Meals</h3>
            <button
              onClick={() => setPageTab('history')}
              className="text-xs font-medium text-emerald-500 hover:text-emerald-600 transition-colors"
            >
              View All →
            </button>
          </div>

          <p className="text-xs text-slate-400">{todayMeals.length} meals today</p>

          {/* Today's Meals list */}
          {todayMeals.length > 0 ? (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {[...todayMeals].reverse().map(meal => (
                <div key={meal._id} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 group">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{meal.name}</p>
                      <p className="text-xs text-slate-400">
                        {displayTime(meal.loggedAt)}
                        {meal.aiAnalyzed && <span className="ml-2 text-emerald-500">AI</span>}
                        <span className="ml-2 capitalize text-slate-300">{meal.mealType}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveMeal(meal._id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-rose-500 transition-all"
                    >
                      <ICONS.X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-sm font-black text-slate-700 dark:text-slate-300 tabular-nums">{meal.nutrients.sodium || 0}</p>
                      <p className="text-[9px] text-slate-400 uppercase">Na</p>
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-700 dark:text-slate-300 tabular-nums">{meal.nutrients.potassium || 0}</p>
                      <p className="text-[9px] text-slate-400 uppercase">K</p>
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-700 dark:text-slate-300 tabular-nums">{meal.nutrients.phosphorus || 0}</p>
                      <p className="text-[9px] text-slate-400 uppercase">P</p>
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-700 dark:text-slate-300 tabular-nums">{meal.nutrients.protein || 0}g</p>
                      <p className="text-[9px] text-slate-400 uppercase">Pr</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-100 dark:border-slate-700 text-center">
              <div className="text-4xl mb-3">🍽️</div>
              <p className="font-bold text-slate-400">No meals logged today</p>
              <p className="text-sm text-slate-400">Scan or add your first meal</p>
            </div>
          )}

          {/* Daily Limits Reference */}
          <div className="bg-slate-900 rounded-xl p-5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Daily Limits</h4>
            <div className="space-y-3">
              {[
                { label: 'Sodium', limit: '< 2,000 mg', icon: '🧂' },
                { label: 'Potassium', limit: '2,000 - 3,000 mg', icon: '🍌' },
                { label: 'Phosphorus', limit: '< 1,000 mg', icon: '🥩' },
                { label: 'Protein', limit: '~60 g', icon: '🥚' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-white/60 flex items-center gap-2">
                    <span>{item.icon}</span> {item.label}
                  </span>
                  <span className="text-sm font-bold text-white">{item.limit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
          </div>
        </>
      )}

      {/* ===== HISTORY TAB CONTENT ===== */}
      {pageTab === 'history' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Meal History</h2>
              <p className="text-sm text-slate-400">{allMealsTotal} total meals logged</p>
            </div>
          </div>

          {/* Loading State */}
          {isLoadingAllMeals && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-500">Loading meals...</p>
              </div>
            </div>
          )}

          {/* Meals Grid */}
          {!isLoadingAllMeals && paginatedMeals.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedMeals.map(meal => (
                <div key={meal._id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 group hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{meal.name}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {displayWeekdayDate(meal.loggedAt)} at {displayTime(meal.loggedAt)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {meal.aiAnalyzed && (
                          <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full">AI</span>
                        )}
                        <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-500 px-2 py-0.5 rounded-full capitalize">{meal.mealType}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMeal(meal._id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                    >
                      <ICONS.X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center bg-slate-50 dark:bg-slate-900 rounded-xl p-3">
                    <div>
                      <p className="text-lg font-black text-slate-700 dark:text-slate-300 tabular-nums">{meal.nutrients.sodium || 0}</p>
                      <p className="text-[9px] text-slate-400 uppercase font-bold">Sodium</p>
                    </div>
                    <div>
                      <p className="text-lg font-black text-slate-700 dark:text-slate-300 tabular-nums">{meal.nutrients.potassium || 0}</p>
                      <p className="text-[9px] text-slate-400 uppercase font-bold">Potassium</p>
                    </div>
                    <div>
                      <p className="text-lg font-black text-slate-700 dark:text-slate-300 tabular-nums">{meal.nutrients.phosphorus || 0}</p>
                      <p className="text-[9px] text-slate-400 uppercase font-bold">Phosphorus</p>
                    </div>
                    <div>
                      <p className="text-lg font-black text-slate-700 dark:text-slate-300 tabular-nums">{meal.nutrients.protein || 0}g</p>
                      <p className="text-[9px] text-slate-400 uppercase font-bold">Protein</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoadingAllMeals && allMeals.length === 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 border border-slate-100 dark:border-slate-700 text-center">
              <div className="text-5xl mb-4">🍽️</div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-2">No meals logged yet</h3>
              <p className="text-slate-400 mb-6">Start tracking your meals to see your history here</p>
              <button
                onClick={() => setPageTab('scan')}
                className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all"
              >
                Scan Your First Meal
              </button>
            </div>
          )}

          {/* Pagination */}
          {!isLoadingAllMeals && totalHistoryPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                disabled={historyPage === 1}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalHistoryPages) }, (_, i) => {
                  let pageNum;
                  if (totalHistoryPages <= 5) {
                    pageNum = i + 1;
                  } else if (historyPage <= 3) {
                    pageNum = i + 1;
                  } else if (historyPage >= totalHistoryPages - 2) {
                    pageNum = totalHistoryPages - 4 + i;
                  } else {
                    pageNum = historyPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setHistoryPage(pageNum)}
                      className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${
                        historyPage === pageNum
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setHistoryPage(p => Math.min(totalHistoryPages, p + 1))}
                disabled={historyPage === totalHistoryPages}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                Next
              </button>
            </div>
          )}

          {/* Page Info */}
          {!isLoadingAllMeals && totalHistoryPages > 1 && (
            <p className="text-center text-sm text-slate-400">
              Showing {((historyPage - 1) * historyItemsPerPage) + 1} - {Math.min(historyPage * historyItemsPerPage, allMeals.length)} of {allMeals.length} meals
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default NutritionScan;
