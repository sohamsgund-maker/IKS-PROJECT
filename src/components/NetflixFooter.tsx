import React from 'react';
import { Globe, ShieldCheck } from 'lucide-react';

export const NetflixFooter: React.FC = () => {
  return (
    <footer className="max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 py-16 text-zinc-500 text-xs select-none space-y-6">
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
          <span>High-Speed Cloud CDNs • Real Hindi Audio</span>
        </div>
      </div>

      <p className="text-[11px] text-zinc-600">
        © 2026 CineVault — Next-Generation Streaming Experience. Powered by High-Speed Cloud CDNs.
      </p>
    </footer>
  );
};
