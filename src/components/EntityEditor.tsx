import React, { useState } from 'react';
import type { PadarthaEntity, LanguageMode, PadarthaCategory, EternalStatus } from '../types/ontology';
import { PlusCircle, Save, CheckCircle } from 'lucide-react';

interface EntityEditorProps {
  onAddEntity: (newEntity: PadarthaEntity) => void;
  langMode: LanguageMode;
}

export const EntityEditor: React.FC<EntityEditorProps> = ({
  onAddEntity
}) => {
  const [category, setCategory] = useState<PadarthaCategory>('Dravya');
  const [nameSa, setNameSa] = useState<string>('');
  const [nameIast, setNameIast] = useState<string>('');
  const [nameEn, setNameEn] = useState<string>('');
  const [descriptionEn, setDescriptionEn] = useState<string>('');
  const [eternalStatus, setEternalStatus] = useState<EternalStatus>('Non-Eternal');
  const [attributesStr, setAttributesStr] = useState<string>('');
  const [sutraTextSa, setSutraTextSa] = useState<string>('');
  const [sutraSource, setSutraSource] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn || !nameSa) return;

    const newId = `custom-${Date.now()}`;
    const newEntity: PadarthaEntity = {
      id: newId,
      category,
      name: {
        sa: nameSa,
        iast: nameIast || nameEn,
        en: nameEn
      },
      description: {
        sa: nameSa,
        iast: nameIast || nameEn,
        en: descriptionEn || 'Custom user-added ontology entity.'
      },
      eternalStatus,
      attributes: attributesStr ? attributesStr.split(',').map(s => s.trim()) : ['Custom Entity'],
      tags: ['Custom', category],
      color: category === 'Dravya' ? '#EAB308' : category === 'Guna' ? '#3B82F6' : '#EF4444',
      ...(sutraTextSa ? {
        sutra: {
          textSa: sutraTextSa,
          textIast: nameIast,
          translation: descriptionEn,
          source: sutraSource || 'Custom Axiom'
        }
      } : {})
    };

    onAddEntity(newEntity);
    setIsSuccess(true);
    setNameSa('');
    setNameIast('');
    setNameEn('');
    setDescriptionEn('');
    setAttributesStr('');
    setSutraTextSa('');
    setSutraSource('');
    setTimeout(() => setIsSuccess(false), 3000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-amber-400" />
            <span>पदार्थसम्पादकः (Ontology Entity & Axiom Editor)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Add custom Padārthas, Dravyas, Guṇas, or Axioms to expand the Padārtha Knowledge Base.
          </p>
        </div>
      </div>

      {isSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>New Padārtha entity successfully added to the knowledge graph!</span>
        </div>
      )}

      {/* Main Creation Form */}
      <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Padārtha Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as PadarthaCategory)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
            >
              <option value="Dravya">Dravya (Substance)</option>
              <option value="Guna">Guṇa (Quality)</option>
              <option value="Karma">Karma (Action)</option>
              <option value="Samanya">Sāmānya (Universal)</option>
              <option value="Visesa">Viśeṣa (Particularity)</option>
              <option value="Samavaya">Samavāya (Inherence)</option>
              <option value="Abhava">Abhāva (Non-existence)</option>
            </select>
          </div>

          {/* Eternal Status */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Eternality Status (Nityatva) *</label>
            <select
              value={eternalStatus}
              onChange={(e) => setEternalStatus(e.target.value as EternalStatus)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
            >
              <option value="Eternal">Eternal (Nitya)</option>
              <option value="Non-Eternal">Non-Eternal (Anitya)</option>
              <option value="Both">Both (Atomic/Composite)</option>
            </select>
          </div>
        </div>

        {/* Names in 3 scripts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Name (Devanagari Sanskrit) *</label>
            <input
              type="text"
              placeholder="e.g. स्फटिकः"
              value={nameSa}
              onChange={(e) => setNameSa(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none font-serif"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Name (IAST Transliteration)</label>
            <input
              type="text"
              placeholder="e.g. Sphaṭikaḥ"
              value={nameIast}
              onChange={(e) => setNameIast(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Name (English) *</label>
            <input
              type="text"
              placeholder="e.g. Quartz Crystal"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Description & Attributes */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">Philosophical Definition & Description</label>
          <textarea
            value={descriptionEn}
            onChange={(e) => setDescriptionEn(e.target.value)}
            rows={3}
            placeholder="Describe the category, substrate, qualities, or causal function..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">Attributes (Comma-separated)</label>
          <input
            type="text"
            placeholder="Transparent, Solid, Refractive"
            value={attributesStr}
            onChange={(e) => setAttributesStr(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
          />
        </div>

        {/* Optional Sūtra Text */}
        <div className="border-t border-slate-800 pt-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Classical Sūtra Citation (Optional)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Sanskrit Sūtra Text</label>
              <input
                type="text"
                placeholder="स्फटिकः स्वच्छपृथिवीप्रभेदः।"
                value={sutraTextSa}
                onChange={(e) => setSutraTextSa(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none font-serif"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Source Citation</label>
              <input
                type="text"
                placeholder="e.g. Tarkasaṃgraha Dīpikā"
                value={sutraSource}
                onChange={(e) => setSutraSource(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold text-sm hover:from-amber-400 hover:to-yellow-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
        >
          <Save className="w-4 h-4" />
          <span>Save & Register Padārtha Entity</span>
        </button>
      </form>
    </div>
  );
};
