
import React, { useState, useRef, useMemo } from 'react';
import { useStore } from '../store';
import { ICONS } from '../constants';
import { MealNutrients } from '../types';

// Dummy API until ready
const analyzeNutritionImage = async (_base64Image: string, _mimeType: string) => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  return {
    foodName: 'Grilled Chicken Salad',
    nutrients: { sodium: 380, potassium: 520, phosphorus: 210, protein: 28 },
    isKidneyFriendly: true,
    renalImpactSummary: 'This meal is within recommended limits for dialysis patients. The protein content supports muscle maintenance while keeping phosphorus moderate.',
    tips: ['Consider pairing with low-potassium vegetables', 'Stay hydrated within your fluid limits']
  };
};

interface ScanResult {
  foodName: string;
  nutrients: { sodium: number; potassium: number; phosphorus: number; protein: number };
  isKidneyFriendly: boolean;
  renalImpactSummary: string;
  tips: string[];
}

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

const LIMITS = { sodium: 2000, potassium: 3000, phosphorus: 1000, protein: 60 };

const NutritionScan: React.FC = () => {
  const { addMeal, meals, removeMeal } = useStore();
  const [image, setImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [mealName, setMealName] = useState('');
  const [manualNutrients, setManualNutrients] = useState<MealNutrients>({ sodium: 0, potassium: 0, phosphorus: 0, protein: 0 });
  const [activeTab, setActiveTab] = useState<'scan' | 'manual'>('scan');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => {
    if (!searchQuery) return [];
    return COMMON_FOODS.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5);
  }, [searchQuery]);

  const todayMeals = useMemo(() => {
    const today = new Date().toDateString();
    return meals.filter(m => new Date(m.time).toDateString() === today);
  }, [meals]);

  const totals = useMemo(() => {
    return todayMeals.reduce((acc, m) => ({
      sodium: acc.sodium + (m.nutrients.sodium || 0),
      potassium: acc.potassium + (m.nutrients.potassium || 0),
      phosphorus: acc.phosphorus + (m.nutrients.phosphorus || 0),
      protein: acc.protein + (m.nutrients.protein || 0),
    }), { sodium: 0, potassium: 0, phosphorus: 0, protein: 0 });
  }, [todayMeals]);

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
    const mimeType = image.split(';')[0].split(':')[1];
    const response = await analyzeNutritionImage(image, mimeType);
    if (response) setScanResult(response);
    setIsScanning(false);
  };

  const handleSelectFood = (food: typeof COMMON_FOODS[0]) => {
    setMealName(food.name);
    setManualNutrients({ sodium: food.sodium, potassium: food.potassium, phosphorus: food.phosphorus, protein: food.protein });
    setSearchQuery('');
    setIsSearchFocused(false);
    setActiveTab('manual');
  };

  const handleLogMeal = (name: string, nutrients: MealNutrients) => {
    addMeal({ id: Date.now().toString(), time: new Date().toISOString(), name, nutrients, isCustom: true });
    resetForm();
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
          <span className={`text-3xl font-black tabular-nums ${isHigh ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>{value}</span>
          <span className="text-sm text-slate-400">{unit}</span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${percent}%` }} />
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-6 pb-24 px-4 animate-in fade-in duration-500">

      {/* Header */}
      <header className="flex items-center justify-between pt-2">
        <div>
          <span className="text-emerald-500 text-xs font-bold uppercase tracking-wider">Nutrition</span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">NutriScan</h1>
        </div>
        <span className="text-xs text-slate-400">{todayMeals.length} meals today</span>
      </header>

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

          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <ICONS.Activity className="w-5 h-5 text-slate-300 dark:text-slate-600" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              placeholder="Search foods..."
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 pl-12 pr-4 font-medium text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
            />

            {isSearchFocused && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl z-50 overflow-hidden">
                {suggestions.map(food => (
                  <button
                    key={food.name}
                    onClick={() => handleSelectFood(food)}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between border-b last:border-b-0 border-slate-100 dark:border-slate-700 transition-colors"
                  >
                    <span className="font-bold text-slate-900 dark:text-white">{food.name}</span>
                    <div className="flex gap-4 text-xs text-slate-400">
                      <span>K: {food.potassium}mg</span>
                      <span>Na: {food.sodium}mg</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab('scan')}
              className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'scan' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-400'}`}
            >
              AI Scan
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'manual' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-400'}`}
            >
              Manual Entry
            </button>
          </div>

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
              {scanResult && (
                <div className="border-t border-slate-100 dark:border-slate-700">
                  {/* Header */}
                  <div className="p-6 bg-slate-50 dark:bg-slate-900 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${scanResult.isKidneyFriendly ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span className={`text-xs font-bold uppercase ${scanResult.isKidneyFriendly ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {scanResult.isKidneyFriendly ? 'Kidney Friendly' : 'Use Caution'}
                        </span>
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white">{scanResult.foodName}</h3>
                    </div>
                    <button
                      onClick={() => handleLogMeal(scanResult.foodName, scanResult.nutrients)}
                      className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-all flex items-center gap-2"
                    >
                      <ICONS.Plus className="w-4 h-4" />
                      Log Meal
                    </button>
                  </div>

                  {/* Nutrients */}
                  <div className="p-6 grid grid-cols-4 gap-4">
                    {[
                      { key: 'sodium', label: 'Sodium', icon: '🧂', unit: 'mg', color: 'text-sky-500' },
                      { key: 'potassium', label: 'Potassium', icon: '🍌', unit: 'mg', color: 'text-orange-500' },
                      { key: 'phosphorus', label: 'Phosphorus', icon: '🥩', unit: 'mg', color: 'text-purple-500' },
                      { key: 'protein', label: 'Protein', icon: '🥚', unit: 'g', color: 'text-emerald-500' },
                    ].map(n => (
                      <div key={n.key} className="text-center">
                        <span className="text-2xl block mb-1">{n.icon}</span>
                        <p className={`text-2xl font-black ${n.color}`}>{scanResult.nutrients[n.key as keyof typeof scanResult.nutrients]}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{n.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Summary */}
                  <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{scanResult.renalImpactSummary}</p>
                    {scanResult.tips.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {scanResult.tips.map((tip, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-emerald-500 mt-0.5">•</span>
                            <span className="text-slate-500 dark:text-slate-400">{tip}</span>
                          </div>
                        ))}
                      </div>
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
                onClick={() => handleLogMeal(mealName, manualNutrients)}
                disabled={!mealName}
                className="w-full py-4 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ICONS.Plus className="w-5 h-5" />
                Log Meal
              </button>
            </div>
          )}
        </div>

        {/* Right: History */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Today's Meals</h3>

          {todayMeals.length > 0 ? (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {[...todayMeals].reverse().map(meal => (
                <div key={meal.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 group">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{meal.name}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(meal.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {!meal.isCustom && <span className="ml-2 text-emerald-500">AI</span>}
                      </p>
                    </div>
                    <button
                      onClick={() => removeMeal(meal.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-rose-500 transition-all"
                    >
                      <ICONS.X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-sm font-black text-slate-700 dark:text-slate-300 tabular-nums">{meal.nutrients.sodium}</p>
                      <p className="text-[9px] text-slate-400 uppercase">Na</p>
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-700 dark:text-slate-300 tabular-nums">{meal.nutrients.potassium}</p>
                      <p className="text-[9px] text-slate-400 uppercase">K</p>
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-700 dark:text-slate-300 tabular-nums">{meal.nutrients.phosphorus}</p>
                      <p className="text-[9px] text-slate-400 uppercase">P</p>
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-700 dark:text-slate-300 tabular-nums">{meal.nutrients.protein}g</p>
                      <p className="text-[9px] text-slate-400 uppercase">Pr</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-100 dark:border-slate-700 text-center">
              <div className="text-4xl mb-3">🍽️</div>
              <p className="font-bold text-slate-400">No meals logged</p>
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
    </div>
  );
};

export default NutritionScan;
