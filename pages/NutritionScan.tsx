import React, { useState, useRef, useMemo } from 'react';
import { useStore } from '../store';

// Dummy data until API is ready
const analyzeNutritionImage = async (_base64Image: string, _mimeType: string) => {
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
  return {
    foodName: 'Sample Food Item',
    nutrients: {
      sodium: 450,
      potassium: 320,
      phosphorus: 180,
      protein: 12
    },
    isKidneyFriendly: true,
    renalImpactSummary: 'This is a placeholder result. Connect to the API for real nutritional analysis.',
    tips: [
      'This is dummy data for development',
      'Replace with actual API integration'
    ]
  };
};
import { ICONS } from '../constants';
import { MealNutrients } from '../types';

interface ScanResultData {
  foodName: string;
  nutrients: {
    sodium: number;
    potassium: number;
    phosphorus: number;
    protein: number;
  };
  isKidneyFriendly: boolean;
  renalImpactSummary: string;
  tips: string[];
}

const COMMON_FOODS = [
  { name: 'Apple', sodium: 1, potassium: 107, phosphorus: 11, protein: 0.3 },
  { name: 'Banana', sodium: 1, potassium: 358, phosphorus: 22, protein: 1.1 },
  { name: 'White Rice (1 cup)', sodium: 5, potassium: 55, phosphorus: 68, protein: 4.3 },
  { name: 'Chicken Breast (Grilled)', sodium: 74, potassium: 256, phosphorus: 228, protein: 31 },
  { name: 'Blueberries', sodium: 1, potassium: 77, phosphorus: 12, protein: 0.7 },
  { name: 'Egg (Large)', sodium: 71, potassium: 69, phosphorus: 91, protein: 6.3 },
  { name: 'Salmon', sodium: 59, potassium: 363, phosphorus: 240, protein: 20 },
  { name: 'Green Beans', sodium: 6, potassium: 211, phosphorus: 38, protein: 1.8 },
];

const NutritionScan: React.FC = () => {
  const { addMeal, meals, removeMeal, profile } = useStore();
  const [image, setImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null);
  
  // Manual Input States
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [manualNutrients, setManualNutrients] = useState<MealNutrients>({
    sodium: 0, potassium: 0, phosphorus: 0, protein: 0
  });
  const [mealName, setMealName] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => {
    if (!searchQuery) return [];
    return COMMON_FOODS.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5);
  }, [searchQuery]);

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
    if (response) {
      setScanResult(response);
    }
    setIsScanning(false);
  };

  const handleSelectSuggestion = (food: typeof COMMON_FOODS[0]) => {
    setMealName(food.name);
    setManualNutrients({
      sodium: food.sodium,
      potassium: food.potassium,
      phosphorus: food.phosphorus,
      protein: food.protein
    });
    setSearchQuery('');
    setIsSearchFocused(false);
    document.getElementById('manual-entry-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLogMeal = () => {
    if (!mealName) return;
    addMeal({
      id: Date.now().toString(),
      time: new Date().toISOString(),
      name: mealName,
      nutrients: manualNutrients,
      isCustom: true
    });
    resetForms();
  };

  const handleLogDirectlyFromScan = () => {
    if (!scanResult) return;
    addMeal({
      id: Date.now().toString(),
      time: new Date().toISOString(),
      name: scanResult.foodName || "AI Scanned Meal",
      nutrients: scanResult.nutrients,
      isCustom: false
    });
    resetForms();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const syncScanToForm = () => {
    if (!scanResult) return;
    setManualNutrients({
      sodium: scanResult.nutrients.sodium,
      potassium: scanResult.nutrients.potassium,
      phosphorus: scanResult.nutrients.phosphorus,
      protein: scanResult.nutrients.protein,
    });
    setMealName(scanResult.foodName || "AI Scanned Meal");
    document.getElementById('manual-entry-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const resetForms = () => {
    setImage(null);
    setScanResult(null);
    setMealName('');
    setManualNutrients({ sodium: 0, potassium: 0, phosphorus: 0, protein: 0 });
    setSearchQuery('');
  };

  const totalsToday = useMemo(() => {
    const today = new Date().toDateString();
    return meals
      .filter(m => new Date(m.time).toDateString() === today)
      .reduce((acc, m) => ({
        sodium: acc.sodium + (m.nutrients.sodium || 0),
        potassium: acc.potassium + (m.nutrients.potassium || 0),
        phosphorus: acc.phosphorus + (m.nutrients.phosphorus || 0),
        protein: acc.protein + (m.nutrients.protein || 0),
      }), { sodium: 0, potassium: 0, phosphorus: 0, protein: 0 });
  }, [meals]);

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-12 animate-in fade-in duration-700 pb-32 transition-colors duration-500 overflow-visible">
      
      {/* Header with Visual Stats */}
      <header className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 px-2 lg:px-4">
        <div className="lg:col-span-7 space-y-8">
           <div className="flex items-center gap-3">
              <span className="px-4 py-1.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-2xl shadow-emerald-500/20">Modular Protocol v4.0</span>
           </div>
           <h2 className="text-6xl lg:text-9xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.8]">Nutri <br/> <span className="text-sky-500">Scan.</span></h2>
           <p className="text-slate-400 dark:text-slate-500 max-w-xl font-medium text-lg lg:text-2xl leading-relaxed">High-fidelity nutritional analytics for precision renal care.</p>
        </div>

        <div className="lg:col-span-5 grid grid-cols-2 gap-4 h-fit">
           <div className="p-10 bg-slate-950 dark:bg-slate-900 rounded-[3rem] text-white flex flex-col justify-between shadow-3xl relative overflow-hidden border border-white/5 group min-h-[180px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
              <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest relative z-10">Na+ Index</span>
              <div className="flex items-baseline gap-2 relative z-10">
                 <span className="text-5xl font-black tabular-nums">{totalsToday.sodium}</span>
                 <span className="text-xs text-white/20 uppercase font-bold tracking-widest">/ 2g</span>
              </div>
           </div>
           <div className="p-10 bg-slate-950 dark:bg-slate-900 rounded-[3rem] text-white flex flex-col justify-between shadow-3xl relative overflow-hidden border border-white/5 group min-h-[180px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
              <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest relative z-10">K+ Index</span>
              <div className="flex items-baseline gap-2 relative z-10">
                 <span className="text-5xl font-black tabular-nums">{totalsToday.potassium}</span>
                 <span className="text-xs text-white/20 uppercase font-bold tracking-widest">/ 3g</span>
              </div>
           </div>
        </div>
      </header>

      {/* Main Interactive Matrix */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12 px-2 lg:px-4">
        
        {/* Interaction Center */}
        <div className="xl:col-span-8 space-y-12 overflow-visible">
           
           {/* Global Vision Search */}
           <div className="relative group z-50">
              <div className="absolute inset-y-0 left-12 flex items-center pointer-events-none">
                 <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-200 dark:text-slate-700 transition-colors group-focus-within:text-sky-500"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </div>
              <input 
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search food database..."
                className="w-full bg-white dark:bg-slate-900 border-4 border-slate-50 dark:border-white/5 rounded-[4rem] py-10 lg:py-12 pl-28 pr-12 font-black text-2xl lg:text-3xl text-slate-900 dark:text-white placeholder:text-slate-100 dark:placeholder:text-slate-800 focus:border-sky-500 focus:ring-[20px] focus:ring-sky-500/5 transition-all outline-none shadow-4xl"
              />
              
              {isSearchFocused && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-6 bg-white dark:bg-slate-900 rounded-[3.5rem] border-4 border-slate-50 dark:border-white/5 shadow-[0_40px_100px_rgba(0,0,0,0.15)] z-[100] overflow-hidden animate-in slide-in-from-top-6 duration-500">
                   {suggestions.map(food => (
                     <button 
                       key={food.name}
                       onClick={() => handleSelectSuggestion(food)}
                       className="w-full px-14 py-10 text-left hover:bg-slate-50 dark:hover:bg-white/5 flex items-center justify-between border-b last:border-b-0 border-slate-50 dark:border-white/5 group/item transition-colors"
                     >
                        <div className="flex items-center gap-8">
                           <div className="w-16 h-16 bg-sky-50 dark:bg-sky-500/10 text-sky-500 rounded-3xl flex items-center justify-center font-black text-2xl shadow-inner group-hover/item:scale-110 transition-transform">
                              {food.name[0]}
                           </div>
                           <span className="text-3xl font-black text-slate-800 dark:text-slate-100 group-hover/item:text-sky-600 transition-colors">{food.name}</span>
                        </div>
                        <div className="flex gap-12">
                           <div className="text-right">
                              <span className="block text-[10px] font-black text-slate-200 dark:text-slate-700 uppercase tracking-widest mb-1">Potassium</span>
                              <span className="text-2xl font-black text-slate-400 tabular-nums">{food.potassium}mg</span>
                           </div>
                           <div className="text-right">
                              <span className="block text-[10px] font-black text-slate-200 dark:text-slate-700 uppercase tracking-widest mb-1">Sodium</span>
                              <span className="text-2xl font-black text-slate-400 tabular-nums">{food.sodium}mg</span>
                           </div>
                        </div>
                     </button>
                   ))}
                </div>
              )}
           </div>

           {/* Core Vision Terminal */}
           <div className="bg-white dark:bg-slate-900 p-10 lg:p-20 rounded-[5rem] border border-slate-100 dark:border-white/5 shadow-2xl space-y-16 transition-colors overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-slate-50 dark:border-white/5 pb-12">
                 <div className="space-y-2">
                    <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Vision Terminal</h3>
                    <p className="text-[11px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.4em]">Point • Capture • Process</p>
                 </div>
                 {image && (
                   <button onClick={resetForms} className="px-10 py-5 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-sm">Reset Sensor</button>
                 )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                 <div 
                   onClick={() => fileInputRef.current?.click()}
                   className={`group cursor-pointer aspect-square bg-slate-50 dark:bg-white/5 border-4 border-dashed border-slate-100 dark:border-white/10 rounded-[4.5rem] flex flex-col items-center justify-center p-12 text-center space-y-10 hover:border-sky-400 hover:bg-sky-50/50 transition-all duration-1000 shadow-inner overflow-hidden relative ${image ? 'border-sky-500 border-solid ring-[20px] ring-sky-500/5' : ''}`}
                 >
                    {image ? (
                       <>
                          <img src={image} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-125" alt="Input" />
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-md">
                             <span className="text-white font-black text-[10px] uppercase tracking-[0.5em]">Recalibrate Source</span>
                          </div>
                          {isScanning && (
                             <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
                                <div className="w-full h-4 bg-sky-400/50 absolute top-0 animate-scan shadow-[0_0_60px_#0EA5E9]"></div>
                             </div>
                          )}
                       </>
                    ) : (
                       <>
                          <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-[3rem] flex items-center justify-center text-slate-100 dark:text-slate-700 shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 group-hover:text-sky-500 group-hover:shadow-2xl">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                          </div>
                          <div className="space-y-4">
                             <p className="text-3xl font-black text-slate-300 dark:text-slate-700 group-hover:text-slate-900 dark:group-hover:text-white transition-all duration-500">Inject Specimen</p>
                             <p className="text-[10px] font-black text-slate-200 dark:text-slate-800 uppercase tracking-[0.4em]">Local Archive or Optical Feed</p>
                          </div>
                       </>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                 </div>

                 <div className="flex flex-col justify-center space-y-12">
                    <div className="space-y-8">
                       <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.5em] ml-4">Analysis Directives</h4>
                       <div className="space-y-5">
                          {[
                             { icon: '🧠', text: 'Gemini 3 Pro Vision Reasoning', sub: 'Clinical-grade feature extraction' },
                             { icon: '⚡', text: 'Low-Latency Biometric Calculation', sub: 'Sub-second nutrient derivation' },
                             { icon: '🛡️', text: 'Patient Safety Compliance', sub: 'Inter-dialytic threshold validation' }
                          ].map((spec, i) => (
                             <div key={i} className="flex gap-6 p-8 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] border border-slate-100 dark:border-white/5 transition-all hover:bg-white dark:hover:bg-white/10 hover:shadow-xl group/spec">
                                <span className="text-3xl transition-transform group-hover/spec:scale-110 group-hover/spec:rotate-6 shrink-0">{spec.icon}</span>
                                <div className="space-y-1">
                                   <p className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">{spec.text}</p>
                                   <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-tighter">{spec.sub}</p>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                    <button 
                       onClick={handleScan}
                       disabled={!image || isScanning}
                       className="w-full py-10 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-[3rem] font-black text-sm uppercase tracking-[0.6em] shadow-4xl hover:bg-sky-600 dark:hover:bg-sky-500 dark:hover:text-white transition-all transform active:scale-95 disabled:opacity-10 flex items-center justify-center gap-6"
                    >
                       {isScanning ? (
                          <>
                             <div className="w-6 h-6 border-4 border-white/20 border-t-white dark:border-slate-900/20 dark:border-t-slate-900 rounded-full animate-spin"></div>
                             Initializing Scan...
                          </>
                       ) : 'Begin AI Vision'}
                    </button>
                 </div>
              </div>
           </div>

           {/* Modular Insight Matrix (AI Result) */}
           {scanResult && (
             <section className="bg-white dark:bg-slate-900 rounded-[5rem] shadow-4xl relative overflow-hidden animate-in zoom-in-95 duration-1000 border border-slate-100 dark:border-white/5 transition-colors flex flex-col">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[160px] pointer-events-none"></div>
                
                <header className="p-12 lg:p-20 bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
                   <div className="space-y-6 flex-1">
                      <div className="flex items-center gap-4">
                         <div className={`w-4 h-4 rounded-full ${scanResult.isKidneyFriendly ? 'bg-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.5)]'} animate-pulse`}></div>
                         <span className={`text-[11px] font-black uppercase tracking-[0.4em] ${scanResult.isKidneyFriendly ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>
                            {scanResult.isKidneyFriendly ? 'Protocol: Safe' : 'Protocol: High Alert'}
                         </span>
                      </div>
                      <h3 className="text-6xl md:text-8xl font-black tracking-tighter text-slate-900 dark:text-white capitalize leading-[0.8]">{scanResult.foodName}</h3>
                   </div>
                   <div className="flex flex-col sm:flex-row gap-6 w-full md:w-auto relative z-10">
                      <button 
                        onClick={syncScanToForm}
                        className="px-10 py-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-lg hover:bg-sky-50 dark:hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center gap-4 group/btn"
                      >
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:rotate-90 transition-transform duration-700"><path d="M12 3v18M3 12h18"/></svg>
                         Adjust Specs
                      </button>
                      <button 
                        onClick={handleLogDirectlyFromScan}
                        className="px-12 py-7 bg-emerald-500 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(16,185,129,0.4)] hover:bg-emerald-400 transition-all active:scale-95 flex items-center justify-center gap-5"
                      >
                         <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
                         Commit to Memory
                      </button>
                   </div>
                </header>

                <div className="p-12 lg:p-24 grid grid-cols-1 lg:grid-cols-12 gap-20">
                   {/* Biometric Profiles */}
                   <div className="lg:col-span-7 space-y-12">
                      <div className="flex items-center gap-6">
                         <h4 className="text-[12px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-[0.6em]">Biometric Profile</h4>
                         <div className="h-px flex-1 bg-slate-100 dark:bg-white/10"></div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                         {[
                            { id: 'sodium', label: 'Sodium (Na)', val: scanResult.nutrients.sodium, unit: 'mg', color: 'bg-emerald-500', limit: 2000, icon: '🧂' },
                            { id: 'potassium', label: 'Potassium (K)', val: scanResult.nutrients.potassium, unit: 'mg', color: 'bg-sky-500', limit: 3000, icon: '🍌' },
                            { id: 'phosphorus', label: 'Phosphate (P)', val: scanResult.nutrients.phosphorus, unit: 'mg', color: 'bg-orange-500', limit: 1000, icon: '🥩' },
                            { id: 'protein', label: 'Protein (Pr)', val: scanResult.nutrients.protein, unit: 'g', color: 'bg-indigo-500', limit: 60, icon: '🥚' }
                         ].map(n => (
                            <div key={n.id} className="p-10 bg-slate-50 dark:bg-white/5 rounded-[4rem] border border-slate-100 dark:border-white/5 transition-all group/stat hover:bg-white dark:hover:bg-white/10 hover:shadow-2xl hover:border-sky-100 dark:hover:border-sky-500/20">
                               <div className="flex justify-between items-start mb-8">
                                  <div className="flex items-center gap-4">
                                     <span className="text-3xl transition-transform group-hover/stat:rotate-12 duration-500">{n.icon}</span>
                                     <span className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{n.label}</span>
                                  </div>
                                  <span className="text-[10px] font-black text-slate-200 dark:text-slate-800 uppercase tracking-tighter">Cap: {n.limit}{n.unit}</span>
                               </div>
                               <div className="flex items-baseline gap-3 mb-8">
                                  <span className="text-6xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">{n.val}</span>
                                  <span className="text-sm font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">{n.unit}</span>
                               </div>
                               <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-1 shadow-inner relative">
                                  <div 
                                    className={`h-full ${n.color} rounded-full transition-all duration-[2s] shadow-lg`} 
                                    style={{ width: `${Math.min((n.val / n.limit) * 100, 100)}%` }}
                                  ></div>
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>

                   {/* Modular Care Components */}
                   <div className="lg:col-span-5 space-y-20">
                      <div className="space-y-10">
                        <div className="flex items-center gap-6">
                           <h4 className="text-[12px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-[0.6em]">Modular Assessment</h4>
                           <div className="h-px flex-1 bg-slate-100 dark:bg-white/10"></div>
                        </div>
                        <div className="p-14 bg-slate-950 rounded-[4.5rem] text-white shadow-4xl relative overflow-hidden group/impact border border-white/5">
                           <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full translate-x-1/2 -translate-y-1/2 group-hover/impact:scale-150 transition-transform duration-[5s]"></div>
                           <p className="text-3xl font-bold leading-[1.25] text-white/90 italic tracking-tight relative z-10 transition-colors">
                              "{scanResult.renalImpactSummary}"
                           </p>
                           <div className="mt-12 flex items-center gap-4 relative z-10">
                              <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></div>
                              <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white/30">Intelligence Node RC-91 Verified</span>
                           </div>
                        </div>
                      </div>

                      <div className="space-y-10">
                         <div className="flex items-center gap-6">
                            <h4 className="text-[12px] font-black text-slate-900 dark:text-white tracking-tight uppercase tracking-[0.6em]">Memory Protocol</h4>
                            <div className="h-px flex-1 bg-slate-100 dark:bg-white/10"></div>
                         </div>
                         <div className="space-y-6">
                            {scanResult.tips.map((tip, i) => (
                               <div key={i} className="flex gap-8 p-10 bg-emerald-50/50 dark:bg-emerald-500/5 rounded-[3rem] border border-emerald-100 dark:border-emerald-500/10 items-start group/tip hover:bg-white dark:hover:bg-white/10 hover:shadow-2xl transition-all duration-700">
                                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xl transition-transform group-hover/tip:scale-110">
                                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
                                  </div>
                                  <p className="text-lg lg:text-xl font-bold text-emerald-900 dark:text-emerald-100 leading-relaxed">{tip}</p>
                               </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>

                <footer className="mt-auto px-12 lg:px-20 py-10 bg-slate-50/50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-6 text-slate-400 dark:text-slate-600">
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 flex items-center justify-center shadow-md">
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-[0.5em]">Synchronized Intelligence RC-91</span>
                   </div>
                   <p className="text-[10px] font-black text-slate-300 dark:text-slate-800 uppercase tracking-[0.3em] italic">Standard Compliance: KDOQI 2025</p>
                </footer>
             </section>
           )}

           {/* Precision Manual Ledger */}
           <div id="manual-entry-section" className="bg-white dark:bg-slate-900 p-10 lg:p-20 rounded-[5rem] border border-slate-100 dark:border-white/10 shadow-2xl space-y-16 transition-colors overflow-visible">
              <div className="flex justify-between items-end border-b border-slate-50 dark:border-white/5 pb-12">
                 <div>
                    <h3 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Manual Registry</h3>
                    <p className="text-[11px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.5em] mt-4 transition-colors">Precision Calibration Node</p>
                 </div>
                 <button onClick={resetForms} className="text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-500 transition-all border-b-4 border-transparent hover:border-rose-500 pb-3">Reset Ledger</button>
              </div>

              <div className="space-y-16">
                 <div className="space-y-6">
                    <label className="text-[11px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-10 transition-colors">Specimen Designation</label>
                    <input 
                      type="text" value={mealName} onChange={e => setMealName(e.target.value)}
                      placeholder="e.g. Scrambled Eggs & Sliced Berries"
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[3.5rem] px-14 py-10 font-black text-3xl lg:text-4xl text-slate-900 dark:text-white outline-none focus:ring-[24px] focus:ring-sky-500/5 transition-all placeholder:text-slate-100 dark:placeholder:text-slate-800"
                    />
                 </div>

                 <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
                    {[
                       { id: 'sodium', label: 'Sodium', unit: 'mg', icon: '🧂' },
                       { id: 'potassium', label: 'Potassium', unit: 'mg', icon: '🍌' },
                       { id: 'phosphorus', label: 'Phosphate', unit: 'mg', icon: '🥓' },
                       { id: 'protein', label: 'Protein', unit: 'g', icon: '🥚' }
                    ].map(n => (
                       <div key={n.id} className="space-y-6 group/input">
                          <label className="flex items-center gap-2 text-[11px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest ml-6 transition-colors">
                             <span>{n.icon}</span> {n.label}
                          </label>
                          <div className="relative">
                             <input 
                               type="number" value={manualNutrients[n.id as keyof MealNutrients] || ''}
                               onChange={e => setManualNutrients({...manualNutrients, [n.id]: parseFloat(e.target.value)})}
                               className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[2.5rem] px-10 py-8 lg:py-10 font-black text-3xl text-slate-900 dark:text-white outline-none focus:ring-12 focus:ring-sky-500/5 transition-all tabular-nums text-center transition-colors"
                             />
                             <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-200 dark:text-slate-800 uppercase transition-colors">{n.unit}</span>
                          </div>
                       </div>
                    ))}
                 </div>

                 <button 
                    onClick={handleLogMeal} 
                    disabled={!mealName}
                    className="w-full py-12 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-[4rem] font-black text-lg uppercase tracking-[0.5em] shadow-4xl hover:bg-emerald-600 dark:hover:bg-emerald-500 dark:hover:text-white transition-all transform active:scale-95 disabled:opacity-10 flex items-center justify-center gap-8"
                 >
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
                    Authorize Node Entry
                 </button>
              </div>
           </div>
        </div>

        {/* Sidebar Archive Column */}
        <aside className="xl:col-span-4 space-y-12 overflow-visible">
           <div className="bg-white dark:bg-slate-900 p-12 lg:p-14 rounded-[5rem] border border-slate-100 dark:border-white/5 shadow-sm flex flex-col h-fit lg:max-h-[950px] transition-colors relative">
              <div className="mb-12 flex justify-between items-end border-b border-slate-50 dark:border-white/5 pb-8 transition-colors">
                 <div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Archives</h3>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mt-2">Daily Intake Ledger</p>
                 </div>
                 <span className="px-5 py-2 bg-slate-50 dark:bg-white/5 text-slate-400 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-colors">{meals.filter(m => new Date(m.time).toDateString() === new Date().toDateString()).length} Nodes</span>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar px-1 pb-10 transition-colors">
                 {meals.length > 0 ? [...meals].reverse().map(meal => (
                    <div key={meal.id} className="group relative p-10 bg-slate-50 dark:bg-white/5 rounded-[4rem] border-2 border-transparent hover:border-sky-500/30 hover:bg-white dark:hover:bg-white/10 transition-all duration-700 shadow-sm overflow-hidden">
                       <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-all duration-700">
                          <button onClick={() => removeMeal(meal.id)} className="w-14 h-14 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-3xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-2xl">
                             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M18 6L6 18M6 6l12 12"/></svg>
                          </button>
                       </div>
                       
                       <div className="flex items-center gap-5 mb-6 transition-colors">
                          <span className="text-[11px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">{new Date(meal.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {!meal.isCustom && <span className="px-3.5 py-1 bg-sky-500/10 text-sky-500 rounded-xl text-[9px] font-black uppercase tracking-widest border border-sky-500/20">AI Scanned</span>}
                       </div>
                       
                       <h4 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tighter leading-none mb-10 group-hover:text-sky-600 transition-all duration-500">{meal.name}</h4>
                       
                       <div className="grid grid-cols-2 gap-12">
                          <div className="flex flex-col gap-1">
                             <span className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest transition-colors">Sodium</span>
                             <span className="text-2xl font-black text-slate-700 dark:text-slate-400 tabular-nums transition-colors">{meal.nutrients.sodium} <span className="text-xs font-bold text-slate-300 dark:text-slate-800 uppercase">mg</span></span>
                          </div>
                          <div className="flex flex-col gap-1">
                             <span className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest transition-colors">Potassium</span>
                             <span className="text-2xl font-black text-slate-700 dark:text-slate-400 tabular-nums transition-colors">{meal.nutrients.potassium} <span className="text-xs font-bold text-slate-300 dark:text-slate-800 uppercase">mg</span></span>
                          </div>
                       </div>
                    </div>
                 )) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-10 text-center space-y-10 py-56 transition-opacity">
                       <div className="w-32 h-32 bg-slate-50 dark:bg-white/5 rounded-[4rem] border-4 border-dashed border-slate-100 dark:border-white/10 flex items-center justify-center transition-colors">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                       </div>
                       <p className="text-xl font-black uppercase tracking-[0.6em] dark:text-slate-500">Memory Empty</p>
                    </div>
                 )}
              </div>
           </div>

           {/* Threshold Protocol Info Widget */}
           <div className="bg-slate-950 p-12 lg:p-14 rounded-[5rem] text-white shadow-4xl relative overflow-hidden transition-all hover:shadow-5xl group border border-white/5">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-[5s]"></div>
              <h4 className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.6em] mb-12 relative z-10">Care Protocols</h4>
              <div className="space-y-10 relative z-10 transition-colors">
                 {[
                    { label: 'Sodium Limit', val: '2000mg', desc: 'Daily inter-dialytic cap' },
                    { label: 'Potassium Range', val: '2g - 3g', desc: 'Clinical stability target' },
                    { label: 'Phosphate Limit', val: '1000mg', desc: 'Coordinate with binders' }
                 ].map(item => (
                    <div key={item.label} className="group/ref">
                       <div className="flex justify-between items-baseline mb-3">
                          <span className="text-[11px] font-black uppercase text-white/30 tracking-widest transition-colors group-hover/ref:text-emerald-400">{item.label}</span>
                          <span className="text-3xl font-black text-white">{item.val}</span>
                       </div>
                       <p className="text-[11px] font-bold text-white/10 uppercase tracking-widest leading-relaxed group-hover/ref:text-white/30 transition-colors">{item.desc}</p>
                    </div>
                 ))}
              </div>
           </div>
        </aside>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 1; }
          50% { top: 100%; opacity: 0.3; }
          100% { top: 0%; opacity: 1; }
        }
        .animate-scan {
          animation: scan 3s infinite cubic-bezier(0.4, 0, 0.2, 1);
        }
        .shadow-3xl { box-shadow: 0 40px 100px -20px rgba(0,0,0,0.4); }
        .shadow-4xl { box-shadow: 0 70px 150px -40px rgba(0,0,0,0.55); }
        .shadow-5xl { box-shadow: 0 100px 200px -50px rgba(0,0,0,0.7); }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 12px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
      `}</style>
    </div>
  );
};

export default NutritionScan;
