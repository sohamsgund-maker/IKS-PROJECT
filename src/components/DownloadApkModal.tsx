import React, { useState } from 'react';
import { X, Download, ShieldCheck, Smartphone, CheckCircle, Sparkles, ExternalLink, Share2, Globe } from 'lucide-react';

interface DownloadApkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadApkModal: React.FC<DownloadApkModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const directApkUrl = 'https://github.com/aditys4444/cinevault/releases/download/v1.0.0/CineVault-v1.0.apk';
  const releasesUrl = 'https://github.com/aditys4444/cinevault/releases';
  const actionsUrl = 'https://github.com/aditys4444/cinevault/actions';

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#141414] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-white">
        
        {/* Header with Red Accent */}
        <div className="relative p-6 pb-4 bg-gradient-to-b from-[#E50914]/25 via-[#181818] to-[#141414] border-b border-zinc-800/80">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#E50914] flex items-center justify-center shadow-lg shadow-[#E50914]/30">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white font-display">Download CineVault APK</h2>
              <p className="text-xs text-zinc-400">Official Android App • Version 1.0.0</p>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 text-sm">
          
          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-zinc-200">Play Protect Safe</span>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-zinc-200">Google Ads Ready</span>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#E50914] flex-shrink-0" />
              <span className="text-xs font-semibold text-zinc-200">Real Hindi Audio</span>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-sky-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-zinc-200">0% Buffer 4K</span>
            </div>
          </div>

          {/* Quick Install Instructions */}
          <div className="p-4 rounded-xl bg-[#181818] border border-zinc-800 space-y-2 text-xs text-zinc-300">
            <p className="font-bold text-white uppercase tracking-wider text-[10px]">How to Install on Android:</p>
            <ol className="list-decimal list-inside space-y-1.5 text-zinc-400">
              <li>Tap <strong className="text-white">Download APK File</strong> below.</li>
              <li>When the download completes, tap the file in your notification bar.</li>
              <li>If prompted, tap <strong className="text-white">Settings</strong> and enable <strong className="text-white">"Allow from this source"</strong>.</li>
              <li>Tap <strong className="text-[#46d369]">Install</strong> to launch CineVault!</li>
            </ol>
          </div>

          {/* Download Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <a
              href={directApkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-xl bg-[#E50914] hover:bg-[#b80710] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#E50914]/25 transition-all active:scale-98 cursor-pointer"
            >
              <Download className="w-5 h-5" />
              <span>Download CineVault APK (Direct)</span>
            </a>

            <div className="grid grid-cols-2 gap-2">
              <a
                href={releasesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>GitHub Releases</span>
              </a>

              <a
                href={actionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Cloud Build Artifacts</span>
              </a>
            </div>

            <button
              onClick={handleShare}
              className="w-full py-2 px-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copied ? '✅ Link Copied to Clipboard!' : 'Share Download Link'}</span>
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="px-6 py-3 bg-[#111111] border-t border-zinc-800/80 text-center text-[10px] text-zinc-500">
          Android 7.0+ (API 24+) Supported • Safe & AdMob Verified
        </div>
      </div>
    </div>
  );
};
