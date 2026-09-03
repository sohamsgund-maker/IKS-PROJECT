import React, { useState } from 'react';
import type { PadarthaEntity, EntityRelation, LanguageMode, InferenceResult } from '../types/ontology';
import { SYSTEM_RULES } from '../services/inferenceEngine';
import { Cpu, Play, CheckCircle2, AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface InferencePlaygroundProps {
  entities: PadarthaEntity[];
  relations: EntityRelation[];
  langMode: LanguageMode;
}

export const InferencePlayground: React.FC<InferencePlaygroundProps> = ({
  entities,
  relations,
  langMode
}) => {
  const [selectedRuleId, setSelectedRuleId] = useState<string>(SYSTEM_RULES[0].id);
  const [result, setResult] = useState<InferenceResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  const selectedRule = SYSTEM_RULES.find(r => r.id === selectedRuleId) || SYSTEM_RULES[0];

  const handleRunInference = () => {
    setIsEvaluating(true);
    setTimeout(() => {
      const res = selectedRule.evaluate(entities, relations);
      setResult(res);
      setIsEvaluating(false);

      if (res.passed) {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.7 }
        });
      }
    }, 400);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-amber-400" />
            <span>न्यायवैशेषिक-तर्कानुमानम् (Nyāya Inference Reasoner)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Automated logical inference engine testing Padārtha qualitative inherence, causality axioms, and 5-step syllogistic logic.
          </p>
        </div>
        <div className="hidden sm:block">
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Nyāya Axiomatic Reasoner</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rule Selector Panel */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Select Logical Rule / Axiom</h3>
          <div className="space-y-2">
            {SYSTEM_RULES.map(rule => (
              <button
                key={rule.id}
                onClick={() => { setSelectedRuleId(rule.id); setResult(null); }}
                className={`w-full text-left p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                  selectedRuleId === rule.id
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 font-semibold shadow-lg shadow-amber-500/10'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-900'
                }`}
              >
                <span className="block text-sm font-bold">{rule.name[langMode] || rule.name.en}</span>
                <span className="text-[11px] text-slate-400 mt-1 block font-mono">Premise: {rule.premise}</span>
              </button>
            ))}
          </div>

          <button
            onClick={handleRunInference}
            disabled={isEvaluating}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold text-sm hover:from-amber-400 hover:to-yellow-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
          >
            {isEvaluating ? (
              <Sparkles className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-slate-950" />
            )}
            <span>{isEvaluating ? 'Evaluating Tarka Logic...' : 'Run Logical Reasoner'}</span>
          </button>
        </div>

        {/* Inference Execution & Proof Trace Display */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <div>
            <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-full bg-slate-800 text-amber-400">
              {selectedRule.ruleType}
            </span>
            <h3 className="text-xl font-bold text-slate-100 mt-2">
              {selectedRule.name[langMode] || selectedRule.name.en}
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {selectedRule.description[langMode] || selectedRule.description.en}
            </p>
          </div>

          {/* Result Banner */}
          {result ? (
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${
              result.passed
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              {result.passed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="font-bold text-sm">{result.conclusion}</h4>
                <p className="text-xs text-slate-300 mt-1">{result.details}</p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 text-center py-6">
              Click <span className="text-amber-400 font-semibold">"Run Logical Reasoner"</span> to evaluate this rule against the ontology knowledge base.
            </div>
          )}

          {/* 5-Step Nyāya Syllogism Trace (Pancavayava Vākya) */}
          {result && result.proofTrace.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>पञ्चअवयववाक्यम् (5-Step Nyāya Syllogistic Trace)</span>
              </h4>

              <div className="space-y-2">
                {result.proofTrace.map((step, idx) => (
                  <div key={idx} className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200 text-xs">{step.nameSa}</span>
                        <span className="text-[10px] text-amber-400 font-mono">({step.nameEn})</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 font-serif">{step.statement}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
