
import React, { useState } from 'react';
import { useStore } from '../store';
import { ICONS, COLORS } from '../constants';
import { Medication } from '../types';

const Medications: React.FC = () => {
  const { medications, addMed } = useStore();
  const [takenIds, setTakenIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'today' | 'all'>('today');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMed, setNewMed] = useState({ name: '', dosage: '', frequency: '', onDialysisDays: true, onNonDialysisDays: true });

  const toggleTaken = (id: string) => {
    setTakenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMed.name || !newMed.dosage) return;
    addMed({ id: Date.now().toString(), ...newMed });
    setIsModalOpen(false);
    setNewMed({ name: '', dosage: '', frequency: '', onDialysisDays: true, onNonDialysisDays: true });
  };

  const today = new Date().toLocaleDateString(undefined, { weekday: 'long' });
  const isDialysisDay = true;
  const todayMeds = medications.filter(m => isDialysisDay ? m.onDialysisDays : m.onNonDialysisDays);
  const displayMeds = activeTab === 'today' ? todayMeds : medications;

  return (
    <div className="space-y-8 md:space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20 transition-colors duration-500">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <span className="px-3 py-1 bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-slate-100 dark:border-white/10 shadow-sm">Your Medicines</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Dosing Log</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md font-medium text-base md:text-lg">Track your meds for treatment and regular days.</p>
        </div>

        <div className="flex bg-white dark:bg-white/5 p-1 rounded-xl md:rounded-2xl border border-slate-100 dark:border-white/10 shadow-sm transition-colors">
           <button onClick={() => setActiveTab('today')} className={`px-4 md:px-8 py-2 md:py-3 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'today' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-lg' : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'}`}>Today</button>
           <button onClick={() => setActiveTab('all')} className={`px-4 md:px-8 py-2 md:py-3 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'all' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-lg' : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'}`}>All</button>
        </div>
      </section>

      {/* Adherence Overview */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
        <div className="bg-slate-900 p-8 md:p-10 rounded-3xl md:rounded-[3.5rem] text-white shadow-xl relative overflow-hidden group border border-white/5">
           <p className="text-[9px] md:text-[10px] font-black text-pink-400 uppercase tracking-widest mb-4">Taken Today</p>
           <div className="flex items-baseline gap-2">
              <span className="text-5xl md:text-6xl font-black tabular-nums">{takenIds.size}</span>
              <span className="text-lg md:text-xl font-bold opacity-30 uppercase">/ {todayMeds.length}</span>
           </div>
           <div className="mt-6 md:mt-8 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div className="h-full bg-gradient-to-r from-pink-500 to-orange-400 rounded-full transition-all duration-1000" style={{ width: `${(takenIds.size / (todayMeds.length || 1)) * 100}%` }}></div>
           </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-3xl md:rounded-[3.5rem] border border-slate-100 dark:border-white/10 shadow-sm flex flex-col justify-between group hover:border-sky-500 transition-all">
           <div className="flex justify-between items-center">
              <div>
                 <h4 className="font-black text-slate-900 dark:text-white uppercase text-[10px] tracking-widest mb-1 px-1">Schedule Type</h4>
                 <p className="text-sky-600 dark:text-sky-400 text-xl font-black px-1 uppercase tracking-tight">{isDialysisDay ? 'Treatment Day' : 'Rest Day'}</p>
              </div>
              <div className="w-12 h-12 bg-sky-50 dark:bg-sky-500/10 text-sky-500 rounded-xl flex items-center justify-center">
                 <ICONS.Activity className="w-6 h-6" />
              </div>
           </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-3xl md:rounded-[3.5rem] border border-slate-100 dark:border-white/10 shadow-sm flex flex-col justify-between group hover:border-pink-400 transition-all">
           <div className="flex justify-between items-center">
              <div>
                 <h4 className="font-black text-slate-900 dark:text-white uppercase text-[10px] tracking-widest mb-1 px-1">Weekly Success</h4>
                 <p className="text-pink-600 dark:text-pink-400 text-xl font-black px-1 uppercase tracking-tight">96% Accuracy</p>
              </div>
              <div className="w-12 h-12 bg-pink-50 dark:bg-pink-500/10 text-pink-600 rounded-xl flex items-center justify-center">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="text-pink-500"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
           </div>
        </div>
      </section>

      {/* Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {displayMeds.map((med) => {
          const isTaken = takenIds.has(med.id);
          return (
            <div key={med.id} className={`group relative bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] border transition-all duration-500 ${isTaken ? 'border-emerald-100 dark:border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-500/5 opacity-80' : 'border-slate-100 dark:border-white/10 shadow-sm hover:shadow-xl hover:border-pink-200 dark:hover:border-pink-500/30'}`}>
              <div className="flex justify-between items-start mb-6 md:mb-8 relative z-10">
                <div className={`p-4 md:p-5 rounded-2xl transition-all duration-500 ${isTaken ? 'bg-emerald-500 text-white' : 'bg-pink-50 dark:bg-pink-500/10 text-pink-500 group-hover:bg-pink-600 group-hover:text-white'}`}>
                  <ICONS.Pill className="w-5 h-5 md:w-6 md:h-6" />
                </div>
              </div>
              <div className="mb-8 md:mb-10 relative z-10">
                <h3 className={`text-xl md:text-2xl font-black tracking-tighter transition-colors ${isTaken ? 'text-emerald-900 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>{med.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                   <span className="text-pink-600 dark:text-pink-400 font-black text-xs md:text-sm">{med.dosage}</span>
                   <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                   <span className="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">{med.frequency}</span>
                </div>
              </div>
              <button onClick={() => toggleTaken(med.id)} className={`w-full py-4 md:py-6 rounded-xl md:rounded-[2rem] font-black text-[9px] md:text-[10px] uppercase tracking-[0.3em] transition-all transform active:scale-95 flex items-center justify-center gap-3 relative z-10 ${isTaken ? 'bg-emerald-500 text-white shadow-xl' : 'bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-600 hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-950'}`}>
                {isTaken ? (
                  <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>TAKEN</>
                ) : 'TAKE NOW'}
              </button>
            </div>
          );
        })}

        <button onClick={() => setIsModalOpen(true)} className="flex flex-col items-center justify-center p-8 md:p-12 border-4 border-dashed border-slate-100 dark:border-white/10 rounded-[2.5rem] md:rounded-[3.5rem] hover:border-sky-500 dark:hover:border-sky-500 hover:bg-sky-50/30 dark:hover:bg-sky-500/5 transition-all min-h-[250px] md:min-h-[320px] group transition-colors duration-500">
           <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-50 dark:bg-white/5 text-slate-200 dark:text-slate-800 rounded-xl md:rounded-[1.5rem] flex items-center justify-center mb-4 md:mb-6 border border-slate-100 dark:border-white/10 group-hover:bg-sky-500 group-hover:text-white transition-all">
              <ICONS.Plus className="w-6 h-6 md:w-8 md:h-8" />
           </div>
           <p className="text-[9px] md:text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest group-hover:text-sky-500 transition-colors">New Medicine</p>
        </button>
      </section>
    </div>
  );
};

export default Medications;
