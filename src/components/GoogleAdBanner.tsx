import React, { useEffect } from 'react';
import { Sparkles } from 'lucide-react';

interface GoogleAdBannerProps {
  slotId?: string;
  format?: 'auto' | 'fluid' | 'horizontal' | 'rectangle';
  className?: string;
}

export const GoogleAdBanner: React.FC<GoogleAdBannerProps> = ({
  format = 'auto',
  className = ''
}) => {
  useEffect(() => {
    // Push AdSense ad if on web browser
    try {
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch (e) {}
  }, []);

  return (
    <div className={`w-full max-w-[1200px] mx-auto my-4 px-4 overflow-hidden ${className}`}>
      <div className="relative w-full rounded-xl bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800/80 p-3 flex flex-col items-center justify-center text-center shadow-lg">
        
        {/* Ad Tag */}
        <div className="absolute top-1.5 right-2 text-[9px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-amber-400" />
          <span>Advertisement • Google Ads</span>
        </div>

        {/* Google AdSense Responsive Ad Block */}
        <ins
          className="adsbygoogle block w-full text-center"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-3940256099942544"
          data-ad-slot="6300978111"
          data-ad-format={format}
          data-full-width-responsive="true"
        />

        {/* Display Placeholder */}
        <div className="py-2 flex flex-col items-center justify-center gap-1">
          <p className="text-xs font-semibold text-zinc-300">
            🎬 Stream All Movies & Web Series in 1080p Full HD Free
          </p>
          <p className="text-[10px] text-zinc-500">
            High-Speed Cloud Streaming
          </p>
        </div>
      </div>
    </div>
  );
};
