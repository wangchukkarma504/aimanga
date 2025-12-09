import { Manga, ApiItem, ChapterData } from '../types';

export const fetchMangaList = async (page: number): Promise<Manga[]> => {
  const url = `https://comick.live/api/chapters/latest?order=hot&page=${page}`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Status: ${res.status}`);
    }

    const apiData = await res.json();
    
    // Safety check: Ensure apiData is not null/undefined before accessing properties
    if (!apiData) return [];

    const items: ApiItem[] = Array.isArray(apiData) ? apiData : (apiData.data || []);

    const mappedItems = items.map((item) => {
      const slug = item.slug || "";
      const title = item.title || "";
      const originalThumbnail = item.default_thumbnail || "";
      
      const recentChapters = item.recent_chapters;
      const firstRecentChapter = Array.isArray(recentChapters) && recentChapters.length > 0 ? recentChapters[0] : null;

      const last_chapter = firstRecentChapter?.chapter_number ?? null;
      const hid = firstRecentChapter?.hid ?? ""; // Ensured to be string, defaults to ""

      if (!slug || !hid) return null; // Filter out items with missing slug or hid

      // Construct the proxy URL string. 
      let default_thumbnail = "";
      if (originalThumbnail) {
        default_thumbnail = `https://image-proxy-viewer.onrender.com/?image_url=${originalThumbnail}`;
      }

      return {
        slug: slug,
        title: slug,
        display_title: title, 
        last_chapter: last_chapter,
        latest_chapter_hid: hid, // Now guaranteed to be a string due to filter above
        default_thumbnail: default_thumbnail,
        // Ensure last_chapter is always a string for the URL
        manga_url: `https://comick.live/api/comics/${slug}/${hid}-chapter-${String(last_chapter || '1')}-en`
      } as Manga;
    }).filter((item): item is Manga => item !== null);

    // Deduplication Logic (Per Page)
    const uniqueItems: Manga[] = [];
    const seen = new Set<string>();
    
    for (const item of mappedItems) {
      if (!seen.has(item.slug)) {
        seen.add(item.slug);
        uniqueItems.push(item);
      }
    }

    return uniqueItems;

  } catch (error) {
    console.error("Fetch error:", error);
    return [];
  }
};

export const fetchChapter = async (slug: string, hid: string, chapter: string): Promise<ChapterData | null> => {
  // Correct API endpoint as requested
  const url = `https://comick.live/api/comics/${slug}/${hid}-chapter-${chapter}-en`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch chapter");
    const data = await res.json();
    return data;
  } catch (e) {
    console.error("Chapter fetch failed", e);
    return null;
  }
};