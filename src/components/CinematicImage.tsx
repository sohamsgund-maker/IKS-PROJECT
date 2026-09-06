import React, { useState } from 'react';
import { Film } from 'lucide-react';

interface CinematicImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  fallbackSrc?: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
  aspectRatioClass?: string;
  titleFallback?: string;
}

export const CinematicImage: React.FC<CinematicImageProps> = ({
  src,
  fallbackSrc,
  alt,
  className = '',
  aspectRatio,
  aspectRatioClass,
  titleFallback,
  ...props
}) => {
  const ratioClass = aspectRatioClass || (aspectRatio ? (aspectRatio.startsWith('aspect-') ? aspectRatio : `aspect-[${aspectRatio}]`) : 'aspect-[2/3]');
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src);
  const [hasFailed, setHasFailed] = useState(false);

  // Sync if src prop changes
  React.useEffect(() => {
    setCurrentSrc(src);
    setHasFailed(false);
    setIsLoaded(false);
  }, [src]);

  const handleError = () => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    } else {
      setHasFailed(true);
      setIsLoaded(true);
    }
  };

  return (
    <div className={`relative overflow-hidden bg-zinc-900 ${ratioClass}`}>
      {/* Shimmer skeleton while loading */}
      {!isLoaded && !hasFailed && (
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 animate-pulse" />
      )}

      {/* Styled Fallback if image fails completely */}
      {hasFailed ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-[#18181c] border border-zinc-800 text-zinc-500">
          <Film className="w-8 h-8 text-zinc-600 mb-1" />
          <span className="text-[11px] font-bold text-zinc-400 line-clamp-2 px-1">
            {titleFallback || alt || 'CineVault'}
          </span>
        </div>
      ) : (
        <img
          src={currentSrc}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onError={handleError}
          loading="lazy"
          decoding="async"
          className={`${className} transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          {...props}
        />
      )}
    </div>
  );
};

export default CinematicImage;
