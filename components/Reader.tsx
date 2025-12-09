import React, { useEffect, useState, useRef, useCallback } from 'react';
import { fetchChapter } from '../services/api';
import { ChapterData, ChapterItem } from '../types';
import ProxyImage from './ProxyImage';

// Define localStorage keys for reader state
const READER_SLUG_KEY = 'reader_slug';
const READER_HID_KEY = 'reader_hid';
const READER_CHAPTER_KEY = 'reader_chapter';
const READER_SCROLL_POS_KEY_PREFIX = 'reader_scroll_position_'; // Prefix for unique scroll position keys

interface ReaderProps {
  slug: string;
  hid: string;
  initialChapter: string;
  onBack: () => void;
}

const Reader: React.FC<ReaderProps> = ({ slug, hid, initialChapter, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ChapterData | null>(null);
  const [immersive, setImmersive] = useState(false);
  
  // Internal state for current chapter, initialized from props
  const [currentChapter, setCurrentChapter] = useState(initialChapter);
  const [currentHid, setCurrentHid] = useState(hid);
  const [scrolledToPosition, setScrolledToPosition] = useState(false); // New state to track if scroll has been restored

  // Helper to generate a unique key for scroll position for the current manga and chapter
  const getScrollStorageKey = useCallback((s: string, h: string) => {
    return `${READER_SCROLL_POS_KEY_PREFIX}${s}_${h}`;
  }, []);

  // Load Chapter Data
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      window.scrollTo(0, 0); // Reset scroll to top before loading new chapter
      setScrolledToPosition(false); // Reset scroll position flag for new chapter
      
      const res = await fetchChapter(slug, currentHid, currentChapter);
      
      // Ensure we have a valid response structure before processing
      if (res && res.chapter && res.chapter.images) {
        // Fix titles in chapter list and save
        const list = Array.isArray(res.chapterList) ? res.chapterList : [];
        const fixedList = list.map(c => ({
            ...c,
            title: c.title || slug
        }));
        
        setData({ ...res, chapterList: fixedList });
        
        // Synchronize currentHid with the actual HID for the currentChapter
        // Find the actual chapter item that matches the current chapter number
        const actualChapterItem = fixedList.find(c => c.chap === currentChapter);
        // If we found a matching chapter item and its HID is different from our currentHid state, update it.
        if (actualChapterItem && actualChapterItem.hid !== currentHid) {
            setCurrentHid(actualChapterItem.hid);
            // Also persist this corrected HID to localStorage
            try {
              localStorage.setItem(READER_HID_KEY, actualChapterItem.hid);
            } catch (e) { console.warn("LS Error (sync hid)", e); }
        }

        // Save entire chapter list to local storage
        try {
          localStorage.setItem(`chapter_list_${slug}`, JSON.stringify(fixedList));
        } catch (e) { console.warn("LS Error (chapter list)", e); }
      } else {
        setData(null);
      }
      setLoading(false);
    };
    load();
  }, [slug, currentHid, currentChapter]); // Dependencies on internal chapter state

  // Effect for restoring scroll position after images are loaded
  useEffect(() => {
    if (!loading && data && !scrolledToPosition) {
      const scrollKey = getScrollStorageKey(slug, currentHid);
      const savedScrollY = localStorage.getItem(scrollKey);
      if (savedScrollY) {
        // Delay scrolling slightly to ensure all images have rendered and taken up space
        const timer = setTimeout(() => {
          window.scrollTo(0, parseInt(savedScrollY, 10));
          setScrolledToPosition(true);
        }, 100); // Small delay to allow content to render
        return () => clearTimeout(timer);
      } else {
        setScrolledToPosition(true); // Mark as scrolled even if no saved position
      }
    }
  }, [loading, data, scrolledToPosition, slug, currentHid, getScrollStorageKey]);

  // Effect for saving scroll position on unmount or chapter change
  useEffect(() => {
    const saveCurrentScrollPosition = () => {
      const scrollKey = getScrollStorageKey(slug, currentHid);
      localStorage.setItem(scrollKey, window.scrollY.toString());
    };

    // Save scroll position when navigating away or changing chapter
    const handleBeforeUnload = () => {
      saveCurrentScrollPosition();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload); // For mobile browsers

    // Setup interval to periodically save scroll position (optional, for robustness)
    const interval = setInterval(saveCurrentScrollPosition, 5000); // Save every 5 seconds

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      saveCurrentScrollPosition(); // Final save on unmount or dependency change
    };
  }, [slug, currentHid, getScrollStorageKey]);


  // Handle Chapter Change
  const handleChapterChange = (newHid: string, newChap: string) => {
    // Save current scroll position before changing chapter
    const scrollKey = getScrollStorageKey(slug, currentHid);
    localStorage.setItem(scrollKey, window.scrollY.toString());

    // Update internal state
    setCurrentHid(newHid);
    setCurrentChapter(newChap);

    // Persist to localStorage for overall app resume
    try {
      localStorage.setItem(READER_HID_KEY, newHid);
      localStorage.setItem(READER_CHAPTER_KEY, newChap);
    } catch (e) { console.warn("LS Error (save new chapter)", e); }
  };

  const handleNextPrev = (direction: 'next' | 'prev') => {
    if (!data?.chapterList) return;
    
    // Sort logic to determine order (oldest first for sequential reading)
    const sortedChapters = [...data.chapterList].sort((a, b) => parseFloat(a.chap) - parseFloat(b.chap));
    const currentSortedIdx = sortedChapters.findIndex(c => c.hid === currentHid);
    
    if (currentSortedIdx === -1) return;

    let targetIdx = -1;
    if (direction === 'next') targetIdx = currentSortedIdx + 1;
    else targetIdx = currentSortedIdx - 1;

    if (targetIdx >= 0 && targetIdx < sortedChapters.length) {
      const target = sortedChapters[targetIdx];
      handleChapterChange(target.hid, target.chap);
    }
  };

  const toggleImmersive = () => setImmersive(!immersive);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>Loading Chapter {currentChapter}...</p>
        </div>
      </div>
    );
  }

  // Safe check for missing data
  if (!data || !data.chapter || !data.chapter.images) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6">
            <p className="mb-4 text-center">Failed to load content or chapter unavailable.</p>
            <button onClick={onBack} className="text-blue-400 underline hover:text-blue-300">Go Back</button>
        </div>
      );
  }

  // Determine if previous/next buttons should be enabled
  const sortedChapters = [...data.chapterList].sort((a, b) => parseFloat(a.chap) - parseFloat(b.chap));
  const currentSortedIdx = sortedChapters.findIndex(c => c.hid === currentHid);
  const canGoPrev = currentSortedIdx > 0;
  const canGoNext = currentSortedIdx < sortedChapters.length - 1;

  return (
    <div className="min-h-screen bg-black relative">
      {/* Top Bar */}
      <div className={`fixed top-0 left-0 right-0 bg-gray-900/90 backdrop-blur border-b border-gray-800 p-3 z-50 flex items-center justify-between transition-transform duration-300 ${immersive ? '-translate-y-full' : 'translate-y-0'}`}>
        <button onClick={onBack} className="text-gray-300 hover:text-white flex items-center gap-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        <span className="text-white font-bold text-sm truncate max-w-[40%]">Ch. {currentChapter}</span>
        
        {data.chapterList && data.chapterList.length > 0 && (
            <select 
            className="bg-gray-800 text-white text-xs border border-gray-700 rounded px-2 py-1 outline-none max-w-[40%]"
            value={currentHid} // This value determines the selected option
            onChange={(e) => {
                const sel = data.chapterList.find(c => c.hid === e.target.value);
                if (sel) handleChapterChange(sel.hid, sel.chap);
            }}
            >
            {sortedChapters.map(c => ( // Use sortedChapters for the dropdown as well
                <option key={c.hid} value={c.hid}>Ch. {c.chap}</option>
            ))}
            </select>
        )}
      </div>

      {/* Content Area */}
      <div className="flex flex-col items-center min-h-screen pb-20 pt-0" onClick={toggleImmersive}>
        {data.chapter.images.map((img, i) => {
            // Construct proxy url for the image
            const proxyUrl = `https://image-proxy-viewer.onrender.com/?image_url=${img.url}`;
            return (
              <ProxyImage 
                key={i} 
                src={proxyUrl} 
                alt={`Page ${i + 1}`}
                className="w-full max-w-2xl min-h-[300px] bg-gray-900"
                priority={i < 2} 
              />
            );
        })}
      </div>

      {/* Bottom Bar */}
      <div className={`fixed bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur border-t border-gray-800 p-4 z-50 flex justify-between items-center transition-transform duration-300 ${immersive ? 'translate-y-full' : 'translate-y-0'}`}>
         <button 
           onClick={(e) => { e.stopPropagation(); handleNextPrev('prev'); }}
           className="px-4 py-2 bg-gray-800 rounded text-white text-sm hover:bg-gray-700 disabled:opacity-50"
           disabled={!canGoPrev}
         >
           Previous
         </button>
         <span className="text-gray-400 text-xs">
           {data.chapter.images.length} Pages
         </span>
         <button 
           onClick={(e) => { e.stopPropagation(); handleNextPrev('next'); }}
           className="px-4 py-2 bg-blue-600 rounded text-white text-sm hover:bg-blue-500 disabled:opacity-50"
           disabled={!canGoNext}
         >
           Next
         </button>
      </div>
    </div>
  );
};

export default Reader;