import React, { useState } from 'react';
import type { PadarthaEntity, EntityRelation } from '../types/ontology';
import { exportToJSONLD, exportToTurtle, exportToOWL } from '../services/exportService';
import { X, Download, Copy, Check, FileCode } from 'lucide-react';

interface ExportModalProps {
  entities: PadarthaEntity[];
  relations: EntityRelation[];
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ entities, relations, onClose }) => {
  const [format, setFormat] = useState<'jsonld' | 'turtle' | 'owl' | 'json'>('jsonld');
  const [copied, setCopied] = useState<boolean>(false);

  const getExportData = (): string => {
    if (format === 'jsonld') return exportToJSONLD(entities, relations);
    if (format === 'turtle') return exportToTurtle(entities, relations);
    if (format === 'owl') return exportToOWL(entities, relations);
    return JSON.stringify({ entities, relations }, null, 2);
  };

  const codeData = getExportData();

  const handleDownload = () => {
    const extMap = { jsonld: 'jsonld', turtle: 'ttl', owl: 'owl', json: 'json' };
    const blob = new Blob([codeData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `padartha_ontology.${extMap[format]}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(codeData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-slate-100">Export Padārtha Ontology</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector Tabs */}
        <div className="flex items-center gap-2">
          {[
            { id: 'jsonld', label: 'JSON-LD' },
            { id: 'turtle', label: 'RDF / Turtle (.ttl)' },
            { id: 'owl', label: 'OWL / XML (.owl)' },
            { id: 'json', label: 'Native JSON' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFormat(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                format === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Code Preview Box */}
        <div className="relative">
          <textarea
            value={codeData}
            readOnly
            rows={14}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-amber-300 focus:outline-none resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Code'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-xs font-bold hover:from-amber-400 hover:to-yellow-400 flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Schema File</span>
          </button>
        </div>
      </div>
    </div>
  );
};
