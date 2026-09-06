import React from 'react';

export const Shimmer: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative overflow-hidden bg-zinc-900/80 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/[0.06] before:to-transparent ${className}`} />
);

export const MovieCardSkeleton: React.FC = () => (
  <div className="rounded-md overflow-hidden bg-[#18181c] border border-white/[0.05] shadow-md flex flex-col justify-between select-none">
    <Shimmer className="aspect-[2/3] w-full" />
    <div className="p-2.5 space-y-2 bg-[#16161a]">
      <Shimmer className="h-3 w-3/4 rounded" />
      <div className="flex items-center justify-between pt-1">
        <Shimmer className="h-2.5 w-1/3 rounded" />
        <Shimmer className="h-2.5 w-1/4 rounded" />
      </div>
    </div>
  </div>
);

export const LandscapeCardSkeleton: React.FC = () => (
  <div className="flex-shrink-0 w-36 sm:w-52 md:w-64 rounded-md overflow-hidden bg-[#18181c] border border-white/[0.05] shadow select-none">
    <Shimmer className="aspect-video w-full" />
    <div className="p-2 sm:p-2.5 bg-[#16161a] space-y-2">
      <Shimmer className="h-3 w-2/3 rounded" />
      <Shimmer className="h-2.5 w-1/2 rounded" />
    </div>
  </div>
);

export const MovieRowSkeleton: React.FC<{ title?: string; count?: number }> = ({
  title,
  count = 6,
}) => (
  <section className="space-y-2 px-3 sm:px-8 lg:px-12 my-3 sm:my-6 select-none">
    <div className="flex items-center justify-between px-1 py-1">
      {title ? (
        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{title}</span>
      ) : (
        <div className="h-5 w-48 bg-zinc-800/80 rounded animate-pulse" />
      )}
      <div className="h-4 w-20 bg-zinc-800/60 rounded-full animate-pulse" />
    </div>
    <div className="flex items-center gap-2 sm:gap-3 overflow-hidden py-2 px-1">
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
  <div className="relative w-full h-[60vh] sm:h-[75vh] lg:h-[85vh] bg-[#121214] overflow-hidden select-none">
    <Shimmer className="w-full h-full" />
    <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/50 to-transparent" />
    <div className="absolute bottom-10 sm:bottom-20 left-4 sm:left-12 space-y-4 max-w-xl">
      <Shimmer className="h-8 sm:h-12 w-3/4 rounded-lg" />
      <Shimmer className="h-4 w-full rounded" />
      <Shimmer className="h-4 w-2/3 rounded" />
      <div className="flex gap-3 pt-2">
        <Shimmer className="h-10 w-28 rounded-lg" />
        <Shimmer className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  </div>
);
