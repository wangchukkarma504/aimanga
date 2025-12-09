import React, { useEffect, useState } from 'react';
import { LibraryMangaItem, Manga } from '../types';
import MangaCard from './MangaCard';

interface LibraryProps {
  onNavigateToReader: (manga: Manga) => void;
}

const LIBRARY_STORAGE_KEY = 'manga_library';

const Library: React.FC<LibraryProps> = ({ onNavigateToReader }) => {
  const [libraryManga, setLibraryManga] = useState<LibraryMangaItem[]>([]);

  useEffect(() => {
    try {
      const savedLibrary = localStorage.getItem(LIBRARY_STORAGE_KEY);
      const parsedLibrary = savedLibrary ? JSON.parse(savedLibrary) : [];
      // Ensure the parsed data is an array and conforms to LibraryMangaItem structure
      setLibraryManga(Array.isArray(parsedLibrary) ? parsedLibrary : []);
    } catch (e) {
      console.error("Failed to load library from localStorage", e);
      setLibraryManga([]);
    }
  }, []); // Only run once on mount

  return (
    <div className="p-3">
      {libraryManga.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-gray-400 py-10 px-4 text-center">
          <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          <p className="text-lg font-semibold mb-2">Your library is empty!</p>
          <p className="text-sm">Browse for manga and click on a card to add it to your library.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {libraryManga.map((manga) => (
            // Cast to Manga type, as onNavigateToReader expects Manga,
            // but the MangaCard itself will know how to display LibraryMangaItem.
            <MangaCard key={manga.slug} manga={manga} onNavigateToReader={onNavigateToReader as (manga: Manga) => void} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Library;