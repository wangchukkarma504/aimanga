import React, { useState, useCallback, useEffect } from 'react';
import Browse from './components/Browse';
import Reader from './components/Reader';
import Library from './components/Library'; // New Library component
import { Manga, LibraryMangaItem } from './types'; // Import Manga and LibraryMangaItem types

// Keys for storing reader state in localStorage
const READER_SLUG_KEY = 'reader_slug';
const READER_HID_KEY = 'reader_hid';
const READER_CHAPTER_KEY = 'reader_chapter';
const LIBRARY_STORAGE_KEY = 'manga_library'; // Key for the library list
const ACTIVE_TAB_KEY = 'active_tab'; // Key for the active navigation tab

const App: React.FC = () => {
  // State to manage the active reader session
  const [readerView, setReaderView] = useState<{
    slug: string;
    hid: string;
    chapter: string;
  } | null>(() => {
    // Attempt to restore reader state from localStorage on initial load
    const slug = localStorage.getItem(READER_SLUG_KEY);
    const hid = localStorage.getItem(READER_HID_KEY);
    const chapter = localStorage.getItem(READER_CHAPTER_KEY);
    return (slug && hid && chapter) ? { slug, hid, chapter } : null;
  });

  // State to manage the active navigation tab (Browse or Library)
  const [activeTab, setActiveTab] = useState<'browse' | 'library'>(() => {
    return (localStorage.getItem(ACTIVE_TAB_KEY) as 'browse' | 'library') || 'browse';
  });

  // Effect to persist the active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(ACTIVE_TAB_KEY, activeTab);
  }, [activeTab]);

  // Callback to navigate to the Reader component and manage the library
  const navigateToReader = useCallback((manga: Manga) => {
    let chapterToLoad = '1'; // Default starting chapter
    let hidToLoad = manga.latest_chapter_hid; // Default HID to manga's latest chapter

    const currentLibrary = JSON.parse(localStorage.getItem(LIBRARY_STORAGE_KEY) || '[]') as LibraryMangaItem[];
    const existingIndex = currentLibrary.findIndex(item => item.slug === manga.slug);

    if (existingIndex > -1) {
      // Manga is already in the library, resume from last read chapter
      const libraryEntry = currentLibrary[existingIndex];
      chapterToLoad = libraryEntry.lastReadChapter;
      hidToLoad = libraryEntry.lastReadHid;
      // Ensure manga object in library is up-to-date with latest info from Browse
      currentLibrary[existingIndex] = { ...libraryEntry, ...manga };
    } else {
      // New manga, add to library with initial read state
      const newEntry: LibraryMangaItem = {
        ...manga,
        lastReadChapter: chapterToLoad,
        lastReadHid: hidToLoad,
      };
      currentLibrary.push(newEntry);
    }
    localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(currentLibrary));

    // Persist the current reader session to localStorage
    localStorage.setItem(READER_SLUG_KEY, manga.slug);
    localStorage.setItem(READER_HID_KEY, hidToLoad);
    localStorage.setItem(READER_CHAPTER_KEY, chapterToLoad);

    // Set readerView state to render the Reader component
    setReaderView({
      slug: manga.slug,
      hid: hidToLoad,
      chapter: chapterToLoad,
    });
  }, []);

  // Callback to handle navigating back from the Reader component
  const handleBackFromReader = useCallback(() => {
    // The Reader component itself handles saving the specific chapter's scroll position.
    // Here, we update the library entry with the *final* chapter and HID the user was on.
    const lastReadChapterFromReader = localStorage.getItem(READER_CHAPTER_KEY);
    const lastReadHidFromReader = localStorage.getItem(READER_HID_KEY);
    const slugFromReader = localStorage.getItem(READER_SLUG_KEY);

    if (slugFromReader && lastReadChapterFromReader && lastReadHidFromReader) {
      const currentLibrary = JSON.parse(localStorage.getItem(LIBRARY_STORAGE_KEY) || '[]') as LibraryMangaItem[];
      const existingIndex = currentLibrary.findIndex(item => item.slug === slugFromReader);
      
      if (existingIndex > -1) {
        currentLibrary[existingIndex] = {
          ...currentLibrary[existingIndex],
          lastReadChapter: lastReadChapterFromReader,
          lastReadHid: lastReadHidFromReader,
        };
        localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(currentLibrary));
      }
    }

    // Clear session-specific reader state from localStorage
    localStorage.removeItem(READER_SLUG_KEY);
    localStorage.removeItem(READER_HID_KEY);
    localStorage.removeItem(READER_CHAPTER_KEY);
    setReaderView(null); // Exit reader view
  }, []);

  // If readerView is active, render the Reader component
  if (readerView) {
    return (
      <Reader 
        slug={readerView.slug}
        hid={readerView.hid}
        initialChapter={readerView.chapter}
        onBack={handleBackFromReader}
      />
    );
  }

  // Otherwise, render the main application view (Browse or Library)
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-800 px-4 py-3 flex items-center justify-between shadow-md">
        <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          MangaReader
        </h1>
        {/* Clear Cache button, only visible on Browse tab */}
        {activeTab === 'browse' && (
          <button 
            onClick={() => {
              // Clear only browse-related cache keys
              localStorage.removeItem('manga_list_v1');
              localStorage.removeItem('manga_page_v1');
              localStorage.removeItem('manga_has_more_v1');
              window.location.reload(); // Force a full reload to re-fetch browse data
            }}
            className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700 text-gray-400 hover:text-white transition-colors"
            aria-label="Clear Browse Cache"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
          </button>
        )}
      </header>
      
      {/* Main Content Area: Scrolls independently */}
      <main className="flex-grow pt-16 pb-20 overflow-y-auto"> {/* Added pt-16 for header, pb-20 for nav, and overflow-y-auto */}
        {activeTab === 'browse' && <Browse onNavigateToReader={navigateToReader} />}
        {activeTab === 'library' && <Library onNavigateToReader={navigateToReader} />}
      </main>

      {/* Fixed Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 flex justify-around py-3 z-40 pb-safe shadow-lg">
        <button 
          onClick={() => setActiveTab('browse')}
          className={`flex flex-col items-center space-y-1 ${activeTab === 'browse' ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
          aria-current={activeTab === 'browse' ? 'page' : undefined}
          aria-label="Navigate to Browse"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          <span className="text-[10px] font-medium">Browse</span>
        </button>
        <button 
          onClick={() => setActiveTab('library')}
          className={`flex flex-col items-center space-y-1 ${activeTab === 'library' ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
          aria-current={activeTab === 'library' ? 'page' : undefined}
          aria-label="Navigate to Library"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          <span className="text-[10px] font-medium">Library</span>
        </button>
      </nav>
    </div>
  );
};

export default App;