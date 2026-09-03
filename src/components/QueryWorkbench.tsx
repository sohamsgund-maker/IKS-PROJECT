import React, { useState } from 'react';
import type { PadarthaEntity, EntityRelation, LanguageMode } from '../types/ontology';
import { SAMPLE_SPARQL_QUERIES } from '../data/padarthaData';
import { Terminal, Play, Copy, Check, Table, Database } from 'lucide-react';

interface QueryWorkbenchProps {
  entities: PadarthaEntity[];
  relations: EntityRelation[];
  langMode: LanguageMode;
}

export const QueryWorkbench: React.FC<QueryWorkbenchProps> = ({
  entities,
  relations
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(SAMPLE_SPARQL_QUERIES[0].id);
  const [queryCode, setQueryCode] = useState<string>(SAMPLE_SPARQL_QUERIES[0].query);
  const [queryResults, setQueryResults] = useState<any[] | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleSelectPreset = (id: string) => {
    setSelectedPresetId(id);
    const q = SAMPLE_SPARQL_QUERIES.find(p => p.id === id);
    if (q) {
      setQueryCode(q.query);
      setQueryResults(null);
    }
  };

  const handleExecuteQuery = () => {
    // Basic SPARQL Execution simulation based on selected preset query
    if (selectedPresetId === 'q1') {
      const filtered = entities.filter(e => e.category === 'Dravya' && (e.eternalStatus === 'Eternal' || e.eternalStatus === 'Both'));
      setQueryResults(filtered.map(e => ({
        dravya: `poms:${e.id}`,
        name_en: e.name.en,
        name_sa: e.name.sa,
        category: e.category,
        eternalStatus: e.eternalStatus
      })));
    } else if (selectedPresetId === 'q2') {
      const exclusiveRels = relations.filter(r => r.type === 'exclusiveQualityOf');
      setQueryResults(exclusiveRels.map(r => {
        const quality = entities.find(e => e.id === r.sourceId);
        const substance = entities.find(e => e.id === r.targetId);
        return {
          quality: quality ? `${quality.name.sa} (${quality.name.iast})` : r.sourceId,
          substance: substance ? `${substance.name.sa} (${substance.name.iast})` : r.targetId,
          relation: 'Asādhāraṇa-Guṇa'
        };
      }));
    } else if (selectedPresetId === 'q3') {
      const bhutas = entities.filter(e => e.tags.includes('Bhūta'));
      setQueryResults(bhutas.map(e => ({
        element: `poms:${e.id}`,
        name_sa: e.name.sa,
        name_iast: e.name.iast,
        name_en: e.name.en
      })));
    } else {
      // Fallback: return top 5 entities
      setQueryResults(entities.slice(0, 6).map(e => ({
        id: `poms:${e.id}`,
        name: e.name.en,
        category: e.category
      })));
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(queryCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-amber-400" />
            <span>SPARQL Query Workbench & Graph Analytics</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Query the Padārtha RDF knowledge graph using SPARQL syntax or select pre-compiled ontology query patterns.
          </p>
        </div>
        <div className="hidden sm:block">
          <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5" />
            <span>SPARQL 1.1 Endpoint</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Query Presets Panel */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Pre-built Query Presets</h3>
          <div className="space-y-2">
            {SAMPLE_SPARQL_QUERIES.map(q => (
              <button
                key={q.id}
                onClick={() => handleSelectPreset(q.id)}
                className={`w-full text-left p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                  selectedPresetId === q.id
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 font-semibold shadow-lg shadow-amber-500/10'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-900'
                }`}
              >
                <span className="block text-sm font-bold">{q.title}</span>
                <span className="text-[11px] text-slate-400 mt-1 block line-clamp-2">{q.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Query Code Editor & Execution Results */}
        <div className="lg:col-span-2 space-y-5">
          {/* Editor Box */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="bg-slate-900/80 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">SPARQL Query Editor</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-amber-400 transition-colors text-xs flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy</span>
                </button>
                <button
                  onClick={handleExecuteQuery}
                  className="px-3 py-1 rounded bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors flex items-center gap-1 shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Execute</span>
                </button>
              </div>
            </div>
            <textarea
              value={queryCode}
              onChange={(e) => setQueryCode(e.target.value)}
              rows={8}
              className="w-full bg-slate-950 p-4 font-mono text-xs text-amber-300 focus:outline-none leading-relaxed resize-none"
            />
          </div>

          {/* Results Table */}
          {queryResults && (
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Table className="w-4 h-4 text-emerald-400" />
                  <span>Query Results ({queryResults.length} records returned)</span>
                </h3>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-300 border-b border-slate-800">
                    <tr>
                      {Object.keys(queryResults[0] || {}).map(key => (
                        <th key={key} className="px-4 py-2.5 font-mono uppercase text-[10px] text-amber-400">
                          ?{key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/60">
                    {queryResults.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                        {Object.values(row).map((val: any, colIdx) => (
                          <td key={colIdx} className="px-4 py-2.5 font-mono text-slate-300">
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
