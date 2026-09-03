import React, { useState } from 'react';
import type { PadarthaEntity, EntityRelation, LanguageMode } from './types/ontology';
import { INITIAL_PADARTHAS, INITIAL_RELATIONS } from './data/padarthaData';
import { Navbar } from './components/Navbar';
import { GraphView } from './components/GraphView';
import { HierarchyExplorer } from './components/HierarchyExplorer';
import { InferencePlayground } from './components/InferencePlayground';
import { QueryWorkbench } from './components/QueryWorkbench';
import { EntityEditor } from './components/EntityEditor';
import { InstanceClassifier } from './components/InstanceClassifier';
import { SchoolComparison } from './components/SchoolComparison';
import { ExportModal } from './components/ExportModal';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('graph');
  const [langMode, setLangMode] = useState<LanguageMode>('sa');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [entities, setEntities] = useState<PadarthaEntity[]>(INITIAL_PADARTHAS);
  const [relations, setRelations] = useState<EntityRelation[]>(INITIAL_RELATIONS);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  const handleAddEntity = (newEntity: PadarthaEntity) => {
    setEntities(prev => [...prev, newEntity]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        langMode={langMode}
        setLangMode={setLangMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenExportModal={() => setIsExportOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {activeTab === 'graph' && (
          <GraphView
            entities={entities}
            relations={relations}
            langMode={langMode}
            searchQuery={searchQuery}
          />
        )}

        {activeTab === 'taxonomy' && (
          <HierarchyExplorer
            entities={entities}
            langMode={langMode}
            searchQuery={searchQuery}
          />
        )}

        {activeTab === 'inference' && (
          <InferencePlayground
            entities={entities}
            relations={relations}
            langMode={langMode}
          />
        )}

        {activeTab === 'query' && (
          <QueryWorkbench
            entities={entities}
            relations={relations}
            langMode={langMode}
          />
        )}

        {activeTab === 'editor' && (
          <EntityEditor
            onAddEntity={handleAddEntity}
            langMode={langMode}
          />
        )}

        {activeTab === 'instances' && (
          <InstanceClassifier
            entities={entities}
            langMode={langMode}
          />
        )}

        {activeTab === 'darshana' && (
          <SchoolComparison
            langMode={langMode}
          />
        )}
      </main>

      {/* Export Modal */}
      {isExportOpen && (
        <ExportModal
          entities={entities}
          relations={relations}
          onClose={() => setIsExportOpen(false)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            Padārtha Ontology Management System • Nyāya-Vaiśeṣika Knowledge Engineering
          </p>
          <p className="font-serif italic text-amber-500/80">
            "कणादेन तु संप्रोक्तं शास्त्रं वैशेषिकं महत्"
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
