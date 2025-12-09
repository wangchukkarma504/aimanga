import React from 'react';
import { Manga, LibraryMangaItem } from '../types'; // Import LibraryMangaItem for type checking
import ProxyImage from './ProxyImage';

interface MangaCardProps {
  manga: Manga | LibraryMangaItem; // Allow Manga or LibraryMangaItem
  onNavigateToReader: (manga: Manga) => void;
}

const MangaCard: React.FC<MangaCardProps> = ({ manga, onNavigateToReader }) => {
  const handleClick = () => {
    // Pass the entire manga object, App.tsx will handle chapter determination (1 or last read)
    onNavigateToReader(manga); 
  };

  // Determine if it's a LibraryMangaItem to show "Last Read" info
  const isLibraryItem = (manga as LibraryMangaItem).lastReadChapter !== undefined;
  const chapterInfo = isLibraryItem 
    ? `Last Read: Ch. ${(manga as LibraryMangaItem).lastReadChapter}`
    : `Ch. ${manga.last_chapter || '?'}`; // Fallback for browse if last_chapter is null

  // Use a different color for "Last Read" badge
  const badgeColorClass = isLibraryItem ? 'bg-green-600/90' : 'bg-blue-600/90';

  return (
    <div 
      onClick={handleClick}
      className="relative w-full aspect-[2/3] rounded-xl overflow-hidden cursor-pointer shadow-lg active:scale-95 transition-transform duration-200 bg-gray-800 border border-gray-700 group"
    >
      <ProxyImage 
        src={manga.default_thumbnail || "https://placehold.co/300x450/1E1E1E/6b7280?text=No+Cover"}
        alt={manga.display_title}
        className="absolute inset-0 w-full h-full"
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 z-20 pointer-events-none" />
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 w-full p-3 flex flex-col justify-end h-full text-shadow z-30 pointer-events-none">
        <h3 className="text-white text-sm font-bold leading-tight line-clamp-2 drop-shadow-md group-hover:text-blue-300 transition-colors">
          {manga.display_title}
        </h3>
        
        {/* Always show chapter info, either last read or latest available */}
        <div className="mt-1.5 flex items-center">
             <span className={`px-2 py-0.5 ${badgeColorClass} backdrop-blur-sm rounded text-[10px] font-bold text-white shadow-sm border border-white/10`}>
               {chapterInfo}
             </span>
          </div>
      </div>
    </div>
  );
};

export default MangaCard;