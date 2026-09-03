import React from 'react';
import type { LanguageMode } from '../types/ontology';
import { DARSHANA_COMPARISONS } from '../data/padarthaData';
import { Compass } from 'lucide-react';

interface SchoolComparisonProps {
  langMode: LanguageMode;
}

export const SchoolComparison: React.FC<SchoolComparisonProps> = ({ langMode }) => {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-400" />
            <span>दर्शनतुलना (Darśana Comparative Matrix)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Comparative analysis of Padārtha categories and ontologies across major Classical Indian Philosophical Schools.
          </p>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-300">
              <tr>
                <th className="p-4 font-bold text-amber-400 uppercase text-[11px]">Feature / Dimension</th>
                <th className="p-4 font-bold text-amber-300 uppercase text-[11px] bg-amber-500/10 border-x border-amber-500/20">Vaiśeṣika (वैशेषिकम्)</th>
                <th className="p-4 font-bold text-blue-400 uppercase text-[11px]">Nyāya (न्यायः)</th>
                <th className="p-4 font-bold text-purple-400 uppercase text-[11px]">Sāṅkhya (सांख्यम्)</th>
                <th className="p-4 font-bold text-emerald-400 uppercase text-[11px]">Advaita Vedānta (अद्वैतम्)</th>
                <th className="p-4 font-bold text-rose-400 uppercase text-[11px]">Jaina (जैनदर्शनम्)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-950/60">
              {DARSHANA_COMPARISONS.map((comp, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                  <td className="p-4 font-bold text-slate-200 bg-slate-900/40">
                    {comp.categoryName[langMode] || comp.categoryName.en}
                  </td>
                  <td className="p-4 text-amber-200 font-medium bg-amber-500/5 border-x border-amber-500/10 leading-relaxed">
                    {comp.vaisesika}
                  </td>
                  <td className="p-4 text-slate-300 leading-relaxed">{comp.nyaya}</td>
                  <td className="p-4 text-slate-300 leading-relaxed">{comp.sankhya}</td>
                  <td className="p-4 text-slate-300 leading-relaxed">{comp.advaita}</td>
                  <td className="p-4 text-slate-300 leading-relaxed">{comp.jaina}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
