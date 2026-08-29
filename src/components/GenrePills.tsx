import React from 'react';

const GENRES = [
  'All',
  'Bollywood',
  'South Indian',
  'Hollywood',
  'Anime',
  'Action',
  'Sci-Fi',
  'Comedy',
  'Drama',
  'Adventure',
  'Fantasy',
  'Thriller',
  'Crime',
  'Horror'
];

interface GenrePillsProps {
  selectedGenre: string;
  onSelectGenre: (genre: string) => void;
}

export const GenrePills: React.FC<GenrePillsProps> = ({
  selectedGenre,
  onSelectGenre,
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-2">
      {GENRES.map((genre) => (
        <button
          key={genre}
          onClick={() => onSelectGenre(genre)}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedGenre === genre
              ? 'bg-[#7c5cff] text-white shadow-lg shadow-purple-500/30'
              : 'bg-white/[0.04] text-zinc-400 border border-white/[0.06] hover:text-white hover:border-white/[0.15]'
          }`}
        >
          {genre}
        </button>
      ))}
    </div>
  );
};
