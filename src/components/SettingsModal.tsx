import React, { useState } from 'react';
import { X, Settings, Server, Trash2, Check } from 'lucide-react';
import { STREAMING_SERVERS } from '../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearCache?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onClearCache,
}) => {
  const [defaultServer, setDefaultServer] = useState<string>(() => {
    return localStorage.getItem('cinevault_default_server') || '2embed';
  });

  const [autoplayNext, setAutoplayNext] = useState<boolean>(() => {
    return localStorage.getItem('cinevault_autoplay_next') !== 'false';
  });

  const [preferHindiDub, setPreferHindiDub] = useState<boolean>(() => {
    return localStorage.getItem('cinevault_prefer_hindi') === 'true';
  });

  const [showToast, setShowToast] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('cinevault_default_server', defaultServer);
    localStorage.setItem('cinevault_autoplay_next', String(autoplayNext));
    localStorage.setItem('cinevault_prefer_hindi', String(preferHindiDub));
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#10101a] border border-white/[0.1] rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#7c5cff]/20 text-[#a28bff] border border-[#7c5cff]/30 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Player & Stream Settings</h2>
              <p className="text-xs text-zinc-400">Configure playback and server preferences</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Controls */}
        <div className="space-y-4 text-xs sm:text-sm">
          {/* Default Server */}
          <div className="space-y-1.5">
            <label className="text-zinc-300 font-bold flex items-center gap-2">
              <Server className="w-4 h-4 text-[#7c5cff]" />
              <span>Default Streaming Server</span>
            </label>
            <select
              value={defaultServer}
              onChange={(e) => setDefaultServer(e.target.value)}
              className="w-full bg-[#181824] border border-white/[0.1] focus:border-[#7c5cff] rounded-xl px-3 py-2 text-white focus:outline-none"
            >
              {STREAMING_SERVERS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.badge ? `(${s.badge})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Autoplay Next Episode */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#161622] border border-white/[0.06]">
            <div className="space-y-0.5">
              <span className="font-bold text-white block">Auto-Play Next Episode</span>
              <span className="text-[11px] text-zinc-400 block">Automatically queue and play next TV episode</span>
            </div>
            <input
              type="checkbox"
              checked={autoplayNext}
              onChange={(e) => setAutoplayNext(e.target.checked)}
              className="w-5 h-5 accent-[#7c5cff] cursor-pointer rounded"
            />
          </div>

          {/* Prefer Hindi Dubbed */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#161622] border border-white/[0.06]">
            <div className="space-y-0.5">
              <span className="font-bold text-white block">Prefer Hindi Dubbed Streams</span>
              <span className="text-[11px] text-zinc-400 block">Default to Peachify dual-audio when available</span>
            </div>
            <input
              type="checkbox"
              checked={preferHindiDub}
              onChange={(e) => setPreferHindiDub(e.target.checked)}
              className="w-5 h-5 accent-[#7c5cff] cursor-pointer rounded"
            />
          </div>

          {/* Cache & Data Management */}
          {onClearCache && (
            <div className="pt-2">
              <button
                onClick={onClearCache}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold text-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear Playback History & Offline Cache</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-white/[0.08] pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-[#7c5cff] hover:bg-[#6a46ff] text-white text-xs font-bold shadow-lg shadow-purple-500/30 transition-all cursor-pointer"
          >
            {showToast ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save Preferences</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
