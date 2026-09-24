import React from 'react';

export const Shimmer: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative overflow-hidden bg-[#15181D] before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/[0.05] before:to-transparent ${className}`} />
);

export const MovieCardSkeleton: React.FC = () => (
  <div className="rounded-xl overflow-hidden bg-[#15181D] border border-[#292E35] shadow-md flex flex-col justify-between select-none">
    <Shimmer className="aspect-[2/3] w-full" />
    <div className="p-2.5 bg-[#1D2127]">
      <Shimmer className="h-3 w-3/4 rounded-md" />
    </div>
  </div>
);

export const LandscapeCardSkeleton: React.FC = () => (
  <div className="flex-shrink-0 w-36 sm:w-52 md:w-64 rounded-xl overflow-hidden bg-[#15181D] border border-[#292E35] shadow select-none">
    <Shimmer className="aspect-video w-full" />
    <div className="p-2 sm:p-2.5 bg-[#1D2127] space-y-2">
      <Shimmer className="h-3 w-2/3 rounded-md" />
      <div className="h-2.5 w-1/2 rounded-md" />
    </div>
  </div>
);

export const MovieRowSkeleton: React.FC<{ title?: string; count?: number }> = ({
  title,
  count = 6,
}) => (
  <section className="space-y-2 px-4 sm:px-6 md:px-8 my-3 sm:my-4 select-none">
    <div className="flex items-center justify-between px-1 py-1">
      {title ? (
        <span className="text-xs font-bold text-[#9A9FA8] uppercase tracking-wider font-mono">{title}</span>
      ) : (
        <div className="h-5 w-44 bg-[#1D2127] rounded-md animate-pulse" />
      )}
      <div className="h-4 w-16 bg-[#1D2127] rounded-full animate-pulse" />
    </div>
    <div className="flex items-center gap-3 sm:gap-4 overflow-hidden py-2 px-1">
      {Array.from({ length: count }).map((_, i) => (
        <LandscapeCardSkeleton key={i} />
      ))}
    </div>
  </section>
);

export const SearchResultsSkeleton: React.FC<{ count?: number }> = ({ count = 12 }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 animate-fade-in">
    {Array.from({ length: count }).map((_, i) => (
      <MovieCardSkeleton key={i} />
    ))}
  </div>
);

export const HeroBillboardSkeleton: React.FC = () => (
  <div className="relative w-full h-[50vh] sm:h-[56vh] md:h-[66vh] min-h-[340px] max-h-[640px] bg-[#0B0D10] overflow-hidden select-none">
    <Shimmer className="w-full h-full" />
    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D10] via-[#0B0D10]/60 to-transparent" />
    <div className="absolute bottom-6 sm:bottom-8 left-4 sm:left-8 md:left-12 space-y-3 max-w-xl">
      <div className="h-4 w-28 bg-white/10 rounded-full" />
      <Shimmer className="h-8 sm:h-12 w-3/4 rounded-xl" />
      <Shimmer className="h-4 w-full rounded-md" />
      <Shimmer className="h-4 w-2/3 rounded-md" />
      <div className="flex gap-3 pt-2">
        <Shimmer className="h-12 w-32 rounded-xl" />
        <Shimmer className="h-12 w-28 rounded-xl" />
      </div>
    </div>
  </div>
);
