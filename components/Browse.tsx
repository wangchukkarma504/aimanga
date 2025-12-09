import React, { useEffect, useState, useCallback } from 'react';
import { fetchMangaList } from '../services/api';
import { Manga } from '../types';
import MangaCard from './MangaCard';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

const STORAGE_KEYS = {
  LIST: 'manga_list_v1',
  PAGE: 'manga_page_v1',
  HAS_MORE: 'manga_has_more_v1'
};

interface BrowseProps {
  onNavigateToReader: (manga: Manga) => void;
}

const Browse: React.FC<BrowseProps> = ({ onNavigateToReader }) => {
  const [mangaList, setMangaList] = useState<Manga[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LIST);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  });

  const [page, setPage] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PAGE);
      return saved ? parseInt(saved, 10) : 1;
    } catch { return 1; }
  });

  const [hasMore, setHasMore] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HAS_MORE);
      return saved ? JSON.parse(saved) : true;
    } catch { return true; }
  });

  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LIST, JSON.stringify(mangaList));
      localStorage.setItem(STORAGE_KEYS.PAGE, page.toString());
      localStorage.setItem(STORAGE_KEYS.HAS_MORE, JSON.stringify(hasMore));
    } catch (e) { console.warn(e); }
  }, [mangaList, page, hasMore]);

  const { targetRef, isIntersecting } = useIntersectionObserver({
    root: null,
    rootMargin: '200px',
    threshold: 0.1,
  });

  const loadData = useCallback(async (pageNum: number) => {
    setLoading(true);
    const newItems = await fetchMangaList(pageNum);
    setLoading(false);

    if (newItems.length === 0) {
      if (pageNum > 1) setHasMore(false); 
      return;
    }

    setMangaList(prevList => {
      // Ensure prevList is an array before mapping
      const safePrevList = Array.isArray(prevList) ? prevList : [];
      const existingSlugs = new Set(safePrevList.map(m => m.slug));
      const uniqueNewItems: Manga[] = [];
      for (const item of newItems) {
        if (!existingSlugs.has(item.slug)) {
          uniqueNewItems.push(item);
          existingSlugs.add(item.slug);
        }
      }
      return [...safePrevList, ...uniqueNewItems];
    });

  }, []);

  useEffect(() => {
    if (mangaList.length === 0) {
      loadData(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isIntersecting && hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadData(nextPage);
    }
  }, [isIntersecting, hasMore, loading, page, loadData]);

  // Removed handleClearCache and header as they are now in App.tsx

  return (
    <div className="pb-2"> {/* Reduced bottom padding as nav is in App.tsx */}
      <main className="px-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.isArray(mangaList) && mangaList.map((manga) => (
            <MangaCard key={manga.slug} manga={manga} onNavigateToReader={onNavigateToReader} />
          ))}
        </div>

        <div ref={targetRef} className="w-full py-8 flex items-center justify-center">
          {loading && (
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          )}
          {!hasMore && mangaList.length > 0 && (
            <p className="text-gray-600 text-sm italic">End of results</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default Browse;