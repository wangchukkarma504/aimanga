export interface ApiRecentChapter {
  hid: string;
  chapter_number: string | number;
}

export interface ApiItem {
  slug?: string;
  title?: string;
  default_thumbnail?: string;
  recent_chapters?: ApiRecentChapter[];
}

export interface Manga {
  slug: string;
  title: string;           // Mapped from slug in python script
  display_title: string;   // Mapped from title in python script
  last_chapter: string | number | null;
  latest_chapter_hid: string; // Changed from optional to required
  default_thumbnail: string;
  manga_url: string;
}

export interface LibraryMangaItem extends Manga {
  lastReadChapter: string; // The last chapter the user was on
  lastReadHid: string;     // The HID of the last chapter
}

export interface ChapterImage {
  url: string;
  w: number;
  h: number;
  name?: string;
}

export interface ChapterItem {
  hid: string;
  chap: string;
  title: string | null;
  lang: string;
  id: number;
}

export interface ChapterData {
  chapter: {
    images: ChapterImage[];
  };
  chapterList: ChapterItem[];
}