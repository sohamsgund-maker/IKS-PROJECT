import React, { useState } from 'react';
import type { PadarthaEntity, LanguageMode } from '../types/ontology';
import { ChevronRight, ChevronDown, BookOpen, Copy, Check, Sparkles } from 'lucide-react';

interface HierarchyExplorerProps {
  entities: PadarthaEntity[];
  langMode: LanguageMode;
  searchQuery: string;
}

export const HierarchyExplorer: React.FC<HierarchyExplorerProps> = ({
  entities,
  langMode
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'cat-dravya': true,
    'cat-guna': true,
    'cat-karma': true
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copySutra = (sutraText: string, id: string) => {
    navigator.clipboard.writeText(sutraText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Top-level 7 Padārthas
  const topCategories = entities.filter(e => !e.parentId && e.tags.includes('Padārtha'));

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>पदार्थवर्गानुक्रमः (Padārtha Taxonomy Tree)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Hierarchical classification of classical Vaiśeṣika & Nyāya categories from *Tarkasaṃgraha* and *Vaiśeṣikasūtra*.
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            7 Categories • 9 Dravyas • 24 Guṇas
          </span>
        </div>
      </div>

      {/* Main Taxonomy Tree */}
      <div className="space-y-4">
        {topCategories.map(cat => {
          const isExpanded = expandedCategories[cat.id] ?? false;
          const childEntities = entities.filter(e => e.parentId === cat.id);
          const catName = cat.name[langMode] || cat.name.en;

          return (
            <div key={cat.id} className="glass-panel rounded-2xl border border-slate-800/90 overflow-hidden">
              {/* Category Header Bar */}
              <div
                onClick={() => toggleCategory(cat.id)}
                className="w-full p-4 flex items-center justify-between cursor-pointer bg-slate-900/60 hover:bg-slate-900 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1 rounded-lg bg-slate-800 text-slate-300">
                    {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color || '#EAB308' }}
                      />
                      <h3 className="text-lg font-bold text-slate-100">{catName}</h3>
                      <span className="text-xs font-mono text-slate-400">({cat.category})</span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{cat.description[langMode] || cat.description.en}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-mono">
                    {childEntities.length} items
                  </span>
                </div>
              </div>

              {/* Collapsible Content */}
              {isExpanded && (
                <div className="p-5 border-t border-slate-800/80 bg-slate-950/40 space-y-4">
                  {/* Category Sūtra */}
                  {cat.sutra && (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl relative">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                          <BookOpen className="w-4 h-4" />
                          <span>{cat.sutra.source}</span>
                        </div>
                        <button
                          onClick={() => copySutra(cat.sutra!.textSa, cat.id)}
                          className="p-1 rounded bg-slate-900/60 text-slate-400 hover:text-amber-400 transition-colors text-xs flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === cat.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <p className="font-serif text-slate-100 text-base">{cat.sutra.textSa}</p>
                      <p className="text-amber-300 text-xs mt-1">{cat.sutra.textIast}</p>
                      <p className="text-slate-300 text-xs mt-2 leading-relaxed">{cat.sutra.translation}</p>
                    </div>
                  )}

                  {/* Child Entities Grid */}
                  {childEntities.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                      {childEntities.map(child => (
                        <div
                          key={child.id}
                          className="glass-card p-4 rounded-xl border border-slate-800 hover:border-amber-500/30 transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <h4 className="font-bold text-slate-100 text-base">{child.name.sa}</h4>
                                <p className="text-xs text-amber-400 font-medium">{child.name.iast} • {child.name.en}</p>
                              </div>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                                {child.eternalStatus}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed mb-3">
                              {child.description[langMode] || child.description.en}
                            </p>
                          </div>

                          <div className="border-t border-slate-800/80 pt-2 mt-auto">
                            <div className="flex flex-wrap gap-1">
                              {child.attributes.slice(0, 3).map((attr, i) => (
                                <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400">
                                  {attr}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic py-2">No sub-items defined for this category.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
