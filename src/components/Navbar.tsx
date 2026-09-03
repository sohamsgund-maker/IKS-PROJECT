import React from 'react';
import type { LanguageMode } from '../types/ontology';
import { 
  Network, 
  GitFork, 
  Cpu, 
  Terminal, 
  PlusCircle, 
  Box, 
  Compass, 
  Download, 
  Search,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  langMode: LanguageMode;
  setLangMode: (mode: LanguageMode) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenExportModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  langMode,
  setLangMode,
  searchQuery,
  setSearchQuery,
  onOpenExportModal
}) => {
  const tabs = [
    { id: 'graph', label: { sa: 'ज्ञानचित्रम्', iast: 'Jñānacitram', en: 'Knowledge Graph' }, icon: Network },
    { id: 'taxonomy', label: { sa: 'वर्गानुक्रमः', iast: 'Vargānukramaḥ', en: 'Taxonomy Tree' }, icon: GitFork },
    { id: 'inference', label: { sa: 'तर्कानुमानम्', iast: 'Tarkānumānam', en: 'Inference Reasoner' }, icon: Cpu },
    { id: 'query', label: { sa: 'प्रश्नमञ्चः', iast: 'Praśnamañcaḥ', en: 'SPARQL Workbench' }, icon: Terminal },
    { id: 'editor', label: { sa: 'पदार्थसम्पादकः', iast: 'Padārtha-Sampādakaḥ', en: 'Entity Editor' }, icon: PlusCircle },
    { id: 'instances', label: { sa: 'वस्तुपरीक्षणम्', iast: 'Vastu-Parīkṣaṇam', en: 'Instance Sandbox' }, icon: Box },
    { id: 'darshana', label: { sa: 'दर्शनतुलना', iast: 'Darśana-Tulanā', en: 'Darśana Matrix' }, icon: Compass }
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-400/40">
            <Sparkles className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent tracking-wide">
                पदार्थ Padārtha Ontology
              </h1>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                POMS v2.5
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Nyāya-Vaiśeṣika Philosophical Knowledge Graph & Ontology Management System
            </p>
          </div>
        </div>

        {/* Global Controls: Search, Language Switcher, Export */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {/* Search bar */}
          <div className="relative flex-1 md:w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Padārtha..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900/90 text-xs text-slate-200 rounded-lg border border-slate-700/80 focus:outline-none focus:border-amber-500 transition-colors placeholder:text-slate-500"
            />
          </div>

          {/* Language Toggle */}
          <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setLangMode('sa')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                langMode === 'sa'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Devanagari Sanskrit"
            >
              संस्कृतम्
            </button>
            <button
              onClick={() => setLangMode('iast')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                langMode === 'iast'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="IAST Transliteration"
            >
              IAST
            </button>
            <button
              onClick={() => setLangMode('en')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                langMode === 'en'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="English"
            >
              EN
            </button>
          </div>

          {/* Export Button */}
          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-semibold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto mt-3 border-t border-slate-800/60 pt-2">
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const labelText = tab.label[langMode] || tab.label.en;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-amber-400 border border-amber-500/40 shadow-sm shadow-amber-500/10 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{labelText}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
