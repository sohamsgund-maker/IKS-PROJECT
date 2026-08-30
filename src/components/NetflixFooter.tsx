import React from 'react';
import { Globe, Smartphone, Download, ShieldCheck } from 'lucide-react';

interface NetflixFooterProps {
  onOpenDownloadApk?: () => void;
}

export const NetflixFooter: React.FC<NetflixFooterProps> = ({ onOpenDownloadApk }) => {
  return (
    <footer className="max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 py-16 text-zinc-500 text-xs select-none space-y-6">
      
      {/* Android App Promotion Card */}
      {onOpenDownloadApk && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-left">
            <div className="w-11 h-11 rounded-xl bg-[#E50914] flex items-center justify-center text-white shadow-lg shadow-[#E50914]/25 flex-shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Download CineVault for Android</h4>
              <p className="text-zinc-400 text-xs mt-0.5">
                Enjoy 1080p/4K bufferless streaming, real Hindi audio, and instant playback on mobile.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenDownloadApk}
            className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#E50914]/30 active:scale-95 transition-all cursor-pointer flex-shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Download APK (Free)</span>
          </button>
        </div>
      )}

      <div className="flex items-center gap-6">
        <span className="hover:underline cursor-pointer">Questions? Contact us.</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
        <ul className="space-y-3">
          <li className="hover:underline cursor-pointer">FAQ</li>
          <li className="hover:underline cursor-pointer">Investor Relations</li>
          <li className="hover:underline cursor-pointer">Privacy</li>
          <li className="hover:underline cursor-pointer">Speed Test</li>
        </ul>

        <ul className="space-y-3">
          <li className="hover:underline cursor-pointer">Help Centre</li>
          <li className="hover:underline cursor-pointer">Jobs</li>
          <li className="hover:underline cursor-pointer">Cookie Preferences</li>
          <li className="hover:underline cursor-pointer">Legal Notices</li>
        </ul>

        <ul className="space-y-3">
          <li className="hover:underline cursor-pointer">Account</li>
          <li className="hover:underline cursor-pointer">Ways to Watch</li>
          <li className="hover:underline cursor-pointer">Corporate Information</li>
          <li className="hover:underline cursor-pointer">Only on CineVault</li>
        </ul>

        <ul className="space-y-3">
          <li className="hover:underline cursor-pointer">Media Centre</li>
          <li className="hover:underline cursor-pointer">Terms of Use</li>
          <li className="hover:underline cursor-pointer">Contact Us</li>
          <li className="hover:underline cursor-pointer">Audio Description</li>
        </ul>
      </div>

      {/* Language Selector & Badges */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
        <button className="flex items-center gap-2 px-3 py-1.5 rounded border border-zinc-700 hover:border-white text-zinc-300 text-xs font-semibold cursor-pointer">
          <Globe className="w-3.5 h-3.5" />
          <span>English (India)</span>
        </button>

        <div className="flex items-center gap-2 text-[11px] text-zinc-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Google AdMob & Play Protect Verified APK</span>
        </div>
      </div>

      <p className="text-[11px] text-zinc-600">
        © 2026 CineVault — Next-Generation Streaming Experience. Powered by High-Speed Cloud CDNs.
      </p>
    </footer>
  );
};
