import React from 'react';

interface SplashScreenProps {
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = () => {
  return (
    <div className="fixed inset-0 z-[120] grid place-items-center bg-ink animate-fade-in">
      <div className="flex flex-col items-center gap-5">
        <img
          src="https://netplay-one.vercel.app/logo.png"
          alt="Netplay"
          width="64"
          height="64"
          draggable="false"
          className="rounded-[22%] object-cover select-none shadow-2xl shadow-purple-500/20"
        />
        <div className="text-center">
          <div className="font-display font-bold text-xl tracking-tight text-white">Netplay</div>
          <div className="text-[11px] text-white/40 mt-1 tracking-wide">
            welcome to sitara and made by Sigma Devs
          </div>
        </div>
        <div className="h-[3px] w-36 rounded-full bg-white/[.08] overflow-hidden">
          <div className="h-full w-1/3 accent-bg rounded-full animate-sweep"></div>
        </div>
      </div>
    </div>
  );
};
