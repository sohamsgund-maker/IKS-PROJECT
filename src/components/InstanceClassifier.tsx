import React, { useState } from 'react';
import type { PadarthaEntity, LanguageMode } from '../types/ontology';
import { REAL_WORLD_INSTANCES } from '../data/padarthaData';
import { Box, CheckCircle } from 'lucide-react';

interface InstanceClassifierProps {
  entities: PadarthaEntity[];
  langMode: LanguageMode;
}

export const InstanceClassifier: React.FC<InstanceClassifierProps> = ({
  entities
}) => {
  const [instances] = useState(REAL_WORLD_INSTANCES);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>(REAL_WORLD_INSTANCES[0].id);

  const selectedInst = instances.find(i => i.id === selectedInstanceId) || instances[0];
  const matchedDravya = entities.find(e => e.id === selectedInst.primaryDravya);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Box className="w-5 h-5 text-amber-400" />
            <span>वस्तुपरीक्षणम् (Instance Classifier Sandbox)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Map real-world items to their underlying Padārtha categories, inherent qualities (Guṇas), and causal nature.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Instance Selector List */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Select Test Object</h3>
          <div className="space-y-2">
            {instances.map(inst => (
              <button
                key={inst.id}
                onClick={() => setSelectedInstanceId(inst.id)}
                className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                  selectedInstanceId === inst.id
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 font-semibold shadow-lg shadow-amber-500/10'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-900'
                }`}
              >
                <span className="block text-sm font-bold">{inst.name}</span>
                <span className="text-[11px] text-slate-400 mt-1 block line-clamp-1">{inst.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Detailed Padartha Analysis Card */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <div>
            <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {selectedInst.causeType} • {selectedInst.isEternal ? 'Eternal (Nitya)' : 'Non-Eternal Produced Effect (Kārya)'}
            </span>
            <h3 className="text-2xl font-bold text-slate-100 mt-2">{selectedInst.name}</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{selectedInst.description}</p>
          </div>

          {/* Primary Dravya Substratum */}
          {matchedDravya && (
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Primary Dravya Substrate</span>
              <div className="flex items-center gap-3">
                <span
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: matchedDravya.color || '#EAB308' }}
                />
                <div>
                  <h4 className="text-base font-bold text-slate-100">{matchedDravya.name.sa} ({matchedDravya.name.iast})</h4>
                  <p className="text-xs text-amber-400">{matchedDravya.name.en}</p>
                </div>
              </div>
            </div>
          )}

          {/* Inherent Qualities (Guṇas) */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Inherent Qualities (Samavāyi-Guṇas)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {selectedInst.inherentGunas.map(gId => {
                const gEntity = entities.find(e => e.id === gId);
                return (
                  <div key={gId} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">{gEntity?.name.sa || gId}</span>
                      <span className="text-[10px] text-amber-400">{gEntity?.name.en}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
