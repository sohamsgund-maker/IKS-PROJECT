import React, { useState } from 'react';
import { X, Crown, ShieldCheck, Server, Trash2, Check, Sparkles, Zap } from 'lucide-react';
import { STREAM_SERVERS } from '../constants/streamingServers';

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
    return localStorage.getItem('cinevault_default_server') || 'vidlink';
  });

  const [autoplayNext, setAutoplayNext] = useState<boolean>(() => {
    return localStorage.getItem('cinevault_autoplay_next') !== 'false';
  });

  const [preferHindiDub, setPreferHindiDub] = useState<boolean>(() => {
    return localStorage.getItem('cinevault_prefer_hindi') !== 'false';
  });

  const [adShieldActive, setAdShieldActive] = useState<boolean>(() => {
    return localStorage.getItem('cinevault_ad_shield') !== 'false';
  });

  const [showToast, setShowToast] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('cinevault_default_server', defaultServer);
    localStorage.setItem('cinevault_autoplay_next', String(autoplayNext));
    localStorage.setItem('cinevault_prefer_hindi', String(preferHindiDub));
    localStorage.setItem('cinevault_ad_shield', String(adShieldActive));
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="bg-[#121218] border border-amber-500/30 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-[0_0_50px_rgba(245,158,11,0.15)] relative text-zinc-100 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-black flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Crown className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">VIP MOD Control Center</h2>
                <span className="px-1.5 py-0.2 rounded bg-amber-400 text-black text-[9px] font-black uppercase">PRO</span>
              </div>
              <p className="text-xs text-amber-300/80 font-medium">Lifetime Unlocked • 100% Ad-Free Premium</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* VIP Status Gold Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-950/30 border border-amber-500/40 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black text-amber-300 uppercase tracking-wide">
                VIP Mod Tier: Lifetime Active
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-[10px] flex items-center gap-1">
              <Check className="w-3 h-3" />
              <span>UNLOCKED</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
            <div className="flex items-center gap-1.5 text-zinc-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Zero Popup Ads (100% Off)</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-300">
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Bufferless 4K Ultra HD</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-300">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Hindi Multi-Audio Priority</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-300">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>VIP CDN Server Mirrors</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-3.5 text-xs sm:text-sm">
          
          {/* Ad-Shield Pro Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#161622] border border-amber-500/20">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white block">Ad-Blocker Shield Pro</span>
              </div>
              <span className="text-[11px] text-zinc-400 block">
                Natively suppress video ads, redirects, and third-party click popups
              </span>
            </div>
            <input
              type="checkbox"
              checked={adShieldActive}
              onChange={(e) => setAdShieldActive(e.target.checked)}
              className="w-5 h-5 accent-amber-400 cursor-pointer rounded"
            />
          </div>

          {/* Default Server */}
          <div className="space-y-1.5">
            <label className="text-zinc-300 font-bold flex items-center gap-2">
              <Server className="w-4 h-4 text-amber-400" />
              <span>Default VIP Streaming Server</span>
            </label>
            <select
              value={defaultServer}
              onChange={(e) => setDefaultServer(e.target.value)}
              className="w-full bg-[#181824] border border-white/[0.1] focus:border-amber-400 rounded-xl px-3 py-2 text-white focus:outline-none"
            >
              {STREAM_SERVERS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Prefer Hindi Dubbed */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#161622] border border-white/[0.06]">
            <div className="space-y-0.5">
              <span className="font-bold text-white block">Prefer Hindi Audio & Dubbed Streams</span>
              <span className="text-[11px] text-zinc-400 block">Automatically select Hindi audio track whenever available</span>
            </div>
            <input
              type="checkbox"
              checked={preferHindiDub}
              onChange={(e) => setPreferHindiDub(e.target.checked)}
              className="w-5 h-5 accent-amber-400 cursor-pointer rounded"
            />
          </div>

          {/* Autoplay Next Episode */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#161622] border border-white/[0.06]">
            <div className="space-y-0.5">
              <span className="font-bold text-white block">Auto-Play Next Episode</span>
              <span className="text-[11px] text-zinc-400 block">Automatically queue and play next TV episode without interruption</span>
            </div>
            <input
              type="checkbox"
              checked={autoplayNext}
              onChange={(e) => setAutoplayNext(e.target.checked)}
              className="w-5 h-5 accent-amber-400 cursor-pointer rounded"
            />
          </div>

          {/* Cache & Data Management */}
          {onClearCache && (
            <div className="pt-1">
              <button
                onClick={onClearCache}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold text-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear Playback History & Cache</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-white/[0.08] pt-4">
          <span className="text-[11px] text-zinc-500">
            CineVault VIP MOD v2.0
          </span>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black text-xs font-black shadow-lg shadow-amber-500/30 transition-all cursor-pointer"
            >
              {showToast ? (
                <>
                  <Check className="w-4 h-4 text-black" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save VIP Settings</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
