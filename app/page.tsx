"use client";

import {
  Button,
  Card,
  CardBody,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Tab,
  Tabs,
  Textarea,
} from "@heroui/react";
import { motion } from "framer-motion";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

type ReadBook = {
  id: string;
  title: string;
  author: string;
  genre: string;
  recommendedBy: string;
  rating: number;
  liked: string;
  notes: string;
  year: number;
  coverUrl: string | null;
  createdAt: string;
};

type ToReadBook = {
  id: string;
  title: string;
  author: string;
  genre: string;
  recommendedBy: string;
  reason: string;
  coverUrl: string | null;
  createdAt: string;
};

type LibraryData = {
  readBooks: ReadBook[];
  toReadBooks: ToReadBook[];
};

type BookDetail = {
  title: string;
  author: string;
  genre?: string;
  recommendedBy: string;
  rating?: number;
  year?: number;
  coverUrl: string | null;
  notes: string;
};

const STORAGE_KEY = "neels-library-v2";
const SUPABASE_TABLE = "library_state";
const SUPABASE_ROW_ID = "main";
const BULK_IMPORT_KEY = "neels-library-bulk-import-v1";
const BULK_READ_IMPORT_KEY = "neels-library-bulk-read-import-v1";
const COVER_CACHE_KEY = "neels-library-cover-cache-v1";
const AUTO_COVER_BATCH = 120;

const BULK_TO_READ_BOOKS: Array<{ title: string; author: string }> = [
  { title: "Straight from the Gut", author: "Jack Welch" },
  { title: "Greenlights", author: "Matthew McConaughey" },
  { title: "The Innovator's Dilemma", author: "Clayton M. Christensen" },
  { title: "Fitness Superman", author: "Jack Robbins" },
  { title: "Becoming", author: "Michelle Obama" },
  { title: "Lying", author: "Sam Harris" },
  { title: "Antifragile", author: "Nassim Nicholas Taleb" },
  { title: "Six Easy Pieces", author: "Richard Feynman" },
  { title: "The Hitchhiker's Guide to the Galaxy", author: "Douglas Adams" },
  { title: "Design and Engineering of Curiosity", author: "" },
  { title: "You Are a Champion: How to Be the Best You Can Be", author: "Marcus Rashford" },
  { title: "The Top Five Regrets of the Dying", author: "Bronnie Ware" },
  { title: "How to Win Friends and Influence People", author: "Dale Carnegie" },
  { title: "Animal Eyes", author: "" },
  { title: "Moment of Clarity", author: "" },
  { title: "Men Without Women", author: "Haruki Murakami" },
  { title: "The Code Book", author: "Simon Singh" },
  { title: "Measure What Matters", author: "John Doerr" },
  { title: "Business Model Generation", author: "Alexander Osterwalder" },
  { title: "The Four Steps to the Epiphany", author: "Steve Blank" },
  { title: "The Mom Test", author: "Rob Fitzpatrick" },
  { title: "Superintelligence", author: "Nick Bostrom" },
  { title: "Getting to Yes", author: "Roger Fisher, William Ury" },
  { title: "Stealing from Your Future Self", author: "" },
  { title: "The Culture Map", author: "Erin Meyer" },
  { title: "Good to Great", author: "Jim Collins" },
  { title: "Tribal Leadership", author: "Dave Logan" },
  { title: "Einstein's Dreams", author: "Alan Lightman" },
  { title: "The Choice", author: "Edith Eger" },
  { title: "The Black Swan", author: "Nassim Nicholas Taleb" },
  { title: "Play to Win", author: "A.G. Lafley, Roger L. Martin" },
  { title: "From Third World to First", author: "Lee Kuan Yew" },
  { title: "Shogun", author: "James Clavell" },
  { title: "Guns, Germs, and Steel", author: "Jared Diamond" },
  { title: "The Macintosh Way", author: "Guy Kawasaki" },
  { title: "Can't Hurt Me", author: "David Goggins" },
  { title: "The Toyota Way", author: "Jeffrey K. Liker" },
  { title: "The Lean Startup", author: "Eric Ries" },
  { title: "Attached", author: "Amir Levine, Rachel Heller" },
  { title: "The Little Book of Common Sense Investing", author: "John C. Bogle" },
  { title: "One Up On Wall Street", author: "Peter Lynch" },
  { title: "Why Nations Fail", author: "Daron Acemoglu, James A. Robinson" },
  { title: "The Simple Path to Wealth", author: "JL Collins" },
  { title: "Die with Zero", author: "Bill Perkins" },
  { title: "Enough", author: "John C. Bogle" },
  { title: "My Secret Garden", author: "Nancy Friday" },
  { title: "Games Mother Never Taught You", author: "Betty Lehan Harragan" },
  { title: "The One Minute Manager", author: "Ken Blanchard, Spencer Johnson" },
  { title: "Time Management for Teachers", author: "Cathy Collins" },
  { title: "Career Track Seminar: Taking Control of Your Work Day", author: "" },
  { title: "Untangling Conflict", author: "" },
  { title: "The Physics of War: From Arrows to Atoms", author: "Barry Parker" },
  { title: "The Beginning of Infinity", author: "David Deutsch" },
  { title: "7 Powers", author: "Hamilton Helmer" },
  { title: "Autobiography of a Yogi", author: "Paramahansa Yogananda" },
  { title: "Metamorphosis", author: "Franz Kafka" },
  { title: "Don't Believe Everything You Think", author: "" },
  { title: "The Culture Series", author: "Iain M. Banks" },
  { title: "Hardcore History", author: "Dan Carlin" },
  { title: "Mind in Motion", author: "Barbara Tversky" },
];

const BULK_READ_BOOKS: Array<{ title: string; author: string }> = [
  { title: "No More Mr. Nice Guy", author: "Robert A. Glover" },
  { title: "Zero to One", author: "Peter Thiel" },
  { title: "The 4-Hour Workweek", author: "Tim Ferriss" },
  { title: "Ego Is the Enemy", author: "Ryan Holiday" },
  { title: "Thinking, Fast and Slow", author: "Daniel Kahneman" },
  { title: "Made in Japan", author: "Akio Morita" },
  { title: "Why We Sleep", author: "Matthew Walker" },
  { title: "Longitude", author: "Dava Sobel" },
  { title: "The One Thing", author: "Gary Keller, Jay Papasan" },
  { title: "Atomic Habits", author: "James Clear" },
  { title: "For the Love of Physics", author: "Walter Lewin" },
  { title: "The Last Lecture", author: "Randy Pausch" },
  { title: "Mindset", author: "Carol S. Dweck" },
  { title: "Phantoms in the Brain", author: "V.S. Ramachandran" },
  { title: "Vagabonding", author: "Rolf Potts" },
  { title: "Alibaba", author: "" },
  { title: "No Limits", author: "Michael Phelps" },
  { title: "The Third Door", author: "Alex Banayan" },
  { title: "Start with Why", author: "Simon Sinek" },
  { title: "A Prisoner of Birth", author: "Jeffrey Archer" },
  { title: "Sapiens", author: "Yuval Noah Harari" },
  { title: "The Great Gatsby", author: "F. Scott Fitzgerald" },
  { title: "Wings of Fire", author: "A.P.J. Abdul Kalam" },
  { title: "No Filter", author: "Sarah Frier" },
];

function safeYear(value: unknown): number {
  const parsed = Number(value);
  const current = new Date().getFullYear();
  if (!Number.isFinite(parsed) || parsed < 1900 || parsed > current + 1) return current;
  return Math.floor(parsed);
}

function safeRating(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  const rounded = Math.round(parsed);
  if (rounded < 0) return 0;
  if (rounded > 5) return 5;
  return rounded;
}

async function fetchCoverUrl(title: string, author?: string): Promise<string | null> {
  const trimmed = title.trim();
  if (!trimmed) return null;
  try {
    const authorPart = author?.trim() ? `&author=${encodeURIComponent(author.trim())}` : "";
    const response = await fetch(
      `https://openlibrary.org/search.json?title=${encodeURIComponent(trimmed)}${authorPart}&limit=5`,
    );
    if (!response.ok) return null;
    const data = (await response.json()) as {
      docs?: Array<{ cover_i?: number }>;
    };
    const coverId = data.docs?.find((doc) => typeof doc.cover_i === "number")?.cover_i;
    if (!coverId) return null;
    return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
  } catch {
    return null;
  }
}

function coverCacheKey(title: string, author?: string) {
  return `${title.trim().toLowerCase()}::${(author ?? "").trim().toLowerCase()}`;
}

function instantCoverFallback(title: string) {
  const trimmed = title.trim();
  if (!trimmed) return null;
  return `https://covers.openlibrary.org/b/title/${encodeURIComponent(trimmed)}-L.jpg`;
}

export default function Home() {
  const [readTitle, setReadTitle] = useState("");
  const [readAuthor, setReadAuthor] = useState("");
  const [readGenre, setReadGenre] = useState("");
  const [readRecommendedBy, setReadRecommendedBy] = useState("");
  const [readRating, setReadRating] = useState(0);
  const [readLiked, setReadLiked] = useState("");
  const [readNotes, setReadNotes] = useState("");
  const [readYear, setReadYear] = useState(String(new Date().getFullYear()));

  const [toReadTitle, setToReadTitle] = useState("");
  const [toReadAuthor, setToReadAuthor] = useState("");
  const [toReadGenre, setToReadGenre] = useState("");
  const [toReadRecommendedBy, setToReadRecommendedBy] = useState("");
  const [toReadReason, setToReadReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [readBooks, setReadBooks] = useState<ReadBook[]>([]);
  const [toReadBooks, setToReadBooks] = useState<ToReadBook[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [isSavingRead, setIsSavingRead] = useState(false);
  const [isSavingToRead, setIsSavingToRead] = useState(false);
  const [busyCoverId, setBusyCoverId] = useState<string | null>(null);
  const [isAutoFetchingCovers, setIsAutoFetchingCovers] = useState(false);
  const [isDbSyncing, setIsDbSyncing] = useState(false);
  const [hasDbHydrated, setHasDbHydrated] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const autoFetchInFlight = useRef(false);
  const attemptedCoverKeys = useRef<Set<string>>(new Set());
  const dbWriteTimeoutRef = useRef<number | null>(null);
  const coverCacheRef = useRef<Map<string, string>>(new Map());

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAuthor, setEditAuthor] = useState("");
  const [editGenre, setEditGenre] = useState("");
  const [editRecommendedBy, setEditRecommendedBy] = useState("");
  const [editRating, setEditRating] = useState(0);
  const [editLiked, setEditLiked] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editYear, setEditYear] = useState("");
  const [detailBook, setDetailBook] = useState<BookDetail | null>(null);

  const query = searchQuery.trim().toLowerCase();
  const filteredReadBooks = query
    ? readBooks.filter((book) =>
        [
          book.title,
          book.author,
          book.genre,
          book.recommendedBy,
          book.notes,
          book.liked,
          String(book.year),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query),
      )
    : readBooks;
  const filteredToReadBooks = query
    ? toReadBooks.filter((book) =>
        [book.title, book.author, book.genre, book.recommendedBy, book.reason]
          .join(" ")
          .toLowerCase()
          .includes(query),
      )
    : toReadBooks;

  const saveCoverToCache = (title: string, author: string, coverUrl: string) => {
    const key = coverCacheKey(title, author);
    if (!key || !coverUrl) return;
    coverCacheRef.current.set(key, coverUrl);
    localStorage.setItem(
      COVER_CACHE_KEY,
      JSON.stringify(Object.fromEntries(coverCacheRef.current.entries())),
    );
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem("neels-library-v1");
      const parsed = (raw ? JSON.parse(raw) : {}) as {
        readBooks?: Array<Partial<ReadBook>>;
        toReadBooks?: Array<Partial<ToReadBook>>;
      };
      const cachedCoversRaw = localStorage.getItem(COVER_CACHE_KEY);
      const cachedCovers = cachedCoversRaw
        ? (JSON.parse(cachedCoversRaw) as Record<string, string>)
        : {};
      coverCacheRef.current = new Map(Object.entries(cachedCovers));

      const migratedRead = (parsed.readBooks ?? []).map((book) => ({
        id: book.id ?? crypto.randomUUID(),
        title: (book.title ?? "untitled").trim(),
        author: (book.author ?? "").trim(),
        genre: (book.genre ?? "").trim(),
        recommendedBy: (book.recommendedBy ?? "").trim(),
        rating: safeRating(book.rating),
        liked: (book.liked ?? "").trim(),
        notes: (book.notes ?? "").trim(),
        year: safeYear(book.year),
        coverUrl:
          book.coverUrl ??
          coverCacheRef.current.get(coverCacheKey(book.title ?? "untitled", book.author ?? "")) ??
          null,
        createdAt: book.createdAt ?? new Date().toISOString(),
      }));

      const migratedToRead = (parsed.toReadBooks ?? []).map((book) => ({
        id: book.id ?? crypto.randomUUID(),
        title: (book.title ?? "untitled").trim(),
        author: (book.author ?? "").trim(),
        genre: (book.genre ?? "").trim(),
        recommendedBy: (book.recommendedBy ?? "").trim(),
        reason: (book.reason ?? "").trim(),
        coverUrl:
          book.coverUrl ??
          coverCacheRef.current.get(coverCacheKey(book.title ?? "untitled", book.author ?? "")) ??
          null,
        createdAt: book.createdAt ?? new Date().toISOString(),
      }));

      const hasImportedBulk = localStorage.getItem(BULK_IMPORT_KEY) === "done";
      const existingTitleSet = new Set(migratedToRead.map((book) => book.title.toLowerCase()));
      const importedToRead = hasImportedBulk
        ? migratedToRead
        : [
            ...migratedToRead,
            ...BULK_TO_READ_BOOKS.filter((book) => !existingTitleSet.has(book.title.toLowerCase())).map((book) => ({
              id: crypto.randomUUID(),
              title: book.title,
              author: book.author,
              genre: "",
              recommendedBy: "",
              reason: "",
              coverUrl: null,
              createdAt: new Date().toISOString(),
            })),
          ];
      if (!hasImportedBulk) {
        localStorage.setItem(BULK_IMPORT_KEY, "done");
      }

      const hasImportedReadBulk = localStorage.getItem(BULK_READ_IMPORT_KEY) === "done";
      const existingReadTitleSet = new Set(migratedRead.map((book) => book.title.toLowerCase()));
      const importedRead = hasImportedReadBulk
        ? migratedRead
        : [
            ...migratedRead,
            ...BULK_READ_BOOKS.filter((book) => !existingReadTitleSet.has(book.title.toLowerCase())).map((book) => ({
              id: crypto.randomUUID(),
              title: book.title,
              author: book.author,
              genre: "",
              recommendedBy: "",
              rating: 0,
              liked: "",
              notes: "",
              year: new Date().getFullYear(),
              coverUrl: null,
              createdAt: new Date().toISOString(),
            })),
          ];
      if (!hasImportedReadBulk) {
        localStorage.setItem(BULK_READ_IMPORT_KEY, "done");
      }

      setReadBooks(importedRead);
      setToReadBooks(importedToRead);
    } catch {
      // Ignore broken local data and start fresh.
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const payload: LibraryData = { readBooks, toReadBooks };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [isLoaded, readBooks, toReadBooks]);

  useEffect(() => {
    if (!isLoaded) return;
    const db = supabase;
    if (!isSupabaseConfigured || !db) {
      setHasDbHydrated(true);
      return;
    }

    let cancelled = false;

    const hydrateFromDb = async () => {
      setIsDbSyncing(true);
      const { data } = await db
        .from(SUPABASE_TABLE)
        .select("payload")
        .eq("id", SUPABASE_ROW_ID)
        .maybeSingle();

      if (cancelled) return;

      if (data?.payload && typeof data.payload === "object") {
        const payload = data.payload as {
          readBooks?: Array<Partial<ReadBook>>;
          toReadBooks?: Array<Partial<ToReadBook>>;
        };
        const remoteRead = (payload.readBooks ?? []).map((book) => ({
          id: book.id ?? crypto.randomUUID(),
          title: (book.title ?? "untitled").trim(),
          author: (book.author ?? "").trim(),
          genre: (book.genre ?? "").trim(),
          recommendedBy: (book.recommendedBy ?? "").trim(),
          rating: safeRating(book.rating),
          liked: (book.liked ?? "").trim(),
          notes: (book.notes ?? "").trim(),
          year: safeYear(book.year),
          coverUrl:
            book.coverUrl ??
            coverCacheRef.current.get(coverCacheKey(book.title ?? "untitled", book.author ?? "")) ??
            null,
          createdAt: book.createdAt ?? new Date().toISOString(),
        }));
        const remoteToRead = (payload.toReadBooks ?? []).map((book) => ({
          id: book.id ?? crypto.randomUUID(),
          title: (book.title ?? "untitled").trim(),
          author: (book.author ?? "").trim(),
          genre: (book.genre ?? "").trim(),
          recommendedBy: (book.recommendedBy ?? "").trim(),
          reason: (book.reason ?? "").trim(),
          coverUrl:
            book.coverUrl ??
            coverCacheRef.current.get(coverCacheKey(book.title ?? "untitled", book.author ?? "")) ??
            null,
          createdAt: book.createdAt ?? new Date().toISOString(),
        }));

        setReadBooks(remoteRead);
        setToReadBooks(remoteToRead);
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ readBooks: remoteRead, toReadBooks: remoteToRead }),
        );
      } else {
        const fallbackRaw = localStorage.getItem(STORAGE_KEY);
        const fallbackParsed = fallbackRaw
          ? (JSON.parse(fallbackRaw) as LibraryData)
          : { readBooks: [], toReadBooks: [] };
        await db.from(SUPABASE_TABLE).upsert({
          id: SUPABASE_ROW_ID,
          payload: {
            readBooks: fallbackParsed.readBooks ?? [],
            toReadBooks: fallbackParsed.toReadBooks ?? [],
          },
          updated_at: new Date().toISOString(),
        });
      }

      if (!cancelled) {
        setHasDbHydrated(true);
        setIsDbSyncing(false);
      }
    };

    hydrateFromDb();

    return () => {
      cancelled = true;
    };
  }, [isLoaded]);

  useEffect(() => {
    const db = supabase;
    if (!isLoaded || !hasDbHydrated || !isSupabaseConfigured || !db) return;
    if (dbWriteTimeoutRef.current !== null) {
      window.clearTimeout(dbWriteTimeoutRef.current);
    }
    dbWriteTimeoutRef.current = window.setTimeout(async () => {
      await db.from(SUPABASE_TABLE).upsert({
        id: SUPABASE_ROW_ID,
        payload: { readBooks, toReadBooks },
        updated_at: new Date().toISOString(),
      });
    }, 500);

    return () => {
      if (dbWriteTimeoutRef.current !== null) {
        window.clearTimeout(dbWriteTimeoutRef.current);
      }
    };
  }, [isLoaded, hasDbHydrated, readBooks, toReadBooks]);

  useEffect(() => {
    if (!isLoaded || autoFetchInFlight.current) return;
    let cancelled = false;

    const autoFetch = async () => {
      const readMissing = readBooks
        .filter((book) => {
          const key = coverCacheKey(book.title, book.author);
          return !book.coverUrl && !attemptedCoverKeys.current.has(key);
        })
        .slice(0, AUTO_COVER_BATCH);
      const toReadMissing = toReadBooks
        .filter((book) => {
          const key = coverCacheKey(book.title, book.author);
          return !book.coverUrl && !attemptedCoverKeys.current.has(key);
        })
        .slice(0, AUTO_COVER_BATCH);
      if (readMissing.length === 0 && toReadMissing.length === 0) return;

      autoFetchInFlight.current = true;
      setIsAutoFetchingCovers(true);

      const allMissing = [
        ...readMissing.map((book) => ({ ...book, kind: "read" as const })),
        ...toReadMissing.map((book) => ({ ...book, kind: "to-read" as const })),
      ];

      const updates = await Promise.all(
        allMissing.map(async (book) => ({
          id: book.id,
          kind: book.kind,
          title: book.title,
          author: book.author,
          coverUrl: await fetchCoverUrl(book.title, book.author),
        })),
      );
      for (const item of allMissing) {
        attemptedCoverKeys.current.add(coverCacheKey(item.title, item.author));
      }

      if (!cancelled) {
        const readMap = new Map(
          updates
            .filter((x) => x.kind === "read" && x.coverUrl)
            .map((x) => [x.id, x.coverUrl as string]),
        );
        const toReadMap = new Map(
          updates
            .filter((x) => x.kind === "to-read" && x.coverUrl)
            .map((x) => [x.id, x.coverUrl as string]),
        );

        for (const item of updates) {
          if (item.coverUrl) saveCoverToCache(item.title, item.author, item.coverUrl);
        }

        if (readMap.size > 0) {
          setReadBooks((prev) =>
            prev.map((book) => (readMap.has(book.id) ? { ...book, coverUrl: readMap.get(book.id)! } : book)),
          );
        }
        if (toReadMap.size > 0) {
          setToReadBooks((prev) =>
            prev.map((book) => (toReadMap.has(book.id) ? { ...book, coverUrl: toReadMap.get(book.id)! } : book)),
          );
        }
      }
      setIsAutoFetchingCovers(false);
      autoFetchInFlight.current = false;
    };

    autoFetch();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, readBooks, toReadBooks]);

  const addReadBook = async () => {
    if (!readTitle.trim()) return;
    setIsSavingRead(true);
    const coverUrl = await fetchCoverUrl(readTitle, readAuthor);
    if (coverUrl) saveCoverToCache(readTitle, readAuthor, coverUrl);
    const book: ReadBook = {
      id: crypto.randomUUID(),
      title: readTitle.trim(),
      author: readAuthor.trim(),
      genre: readGenre.trim(),
      recommendedBy: readRecommendedBy.trim(),
      rating: readRating,
      liked: readLiked.trim(),
      notes: readNotes.trim(),
      year: safeYear(readYear),
      coverUrl,
      createdAt: new Date().toISOString(),
    };
    setReadBooks((prev) => [book, ...prev]);
    setReadTitle("");
    setReadAuthor("");
    setReadGenre("");
    setReadRecommendedBy("");
    setReadRating(0);
    setReadLiked("");
    setReadNotes("");
    setReadYear(String(new Date().getFullYear()));
    setIsSavingRead(false);
    setIsAddModalOpen(false);
  };

  const addToReadBook = async () => {
    if (!toReadTitle.trim()) return;
    setIsSavingToRead(true);
    const coverUrl = await fetchCoverUrl(toReadTitle, toReadAuthor);
    if (coverUrl) saveCoverToCache(toReadTitle, toReadAuthor, coverUrl);
    const book: ToReadBook = {
      id: crypto.randomUUID(),
      title: toReadTitle.trim(),
      author: toReadAuthor.trim(),
      genre: toReadGenre.trim(),
      recommendedBy: toReadRecommendedBy.trim(),
      reason: toReadReason.trim(),
      coverUrl,
      createdAt: new Date().toISOString(),
    };
    setToReadBooks((prev) => [book, ...prev]);
    setToReadTitle("");
    setToReadAuthor("");
    setToReadGenre("");
    setToReadRecommendedBy("");
    setToReadReason("");
    setIsSavingToRead(false);
    setIsAddModalOpen(false);
  };

  const removeReadBook = (id: string) => {
    setReadBooks((prev) => prev.filter((book) => book.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const removeToReadBook = (id: string) => {
    setToReadBooks((prev) => prev.filter((book) => book.id !== id));
  };

  const startEdit = (book: ReadBook) => {
    setEditingId(book.id);
    setEditAuthor(book.author);
    setEditGenre(book.genre);
    setEditRecommendedBy(book.recommendedBy);
    setEditRating(book.rating);
    setEditLiked(book.liked);
    setEditNotes(book.notes);
    setEditYear(String(book.year));
  };

  const saveEdit = (id: string) => {
    setReadBooks((prev) =>
      prev.map((book) =>
        book.id === id
          ? {
              ...book,
              author: editAuthor.trim(),
              genre: editGenre.trim(),
              recommendedBy: editRecommendedBy.trim(),
              rating: editRating,
              liked: editLiked.trim(),
              notes: editNotes.trim(),
              year: safeYear(editYear),
            }
          : book,
      ),
    );
    setEditingId(null);
  };

  const moveToRead = async (book: ToReadBook) => {
    const currentYear = new Date().getFullYear();
    setReadBooks((prev) => [
      {
        id: crypto.randomUUID(),
        title: book.title,
        author: book.author,
        genre: book.genre,
        recommendedBy: book.recommendedBy,
        rating: 0,
        liked: "",
        notes: book.reason,
        year: currentYear,
        coverUrl: book.coverUrl,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setToReadBooks((prev) => prev.filter((item) => item.id !== book.id));
  };

  const refreshCoverForRead = async (id: string, title: string) => {
    setBusyCoverId(id);
    const target = readBooks.find((book) => book.id === id);
    const cover = await fetchCoverUrl(title, target?.author);
    if (cover) {
      const author = target?.author ?? "";
      saveCoverToCache(title, author, cover);
      setReadBooks((prev) => prev.map((book) => (book.id === id ? { ...book, coverUrl: cover } : book)));
    }
    setBusyCoverId(null);
  };

  const refreshCoverForToRead = async (id: string, title: string) => {
    setBusyCoverId(id);
    const target = toReadBooks.find((book) => book.id === id);
    const cover = await fetchCoverUrl(title, target?.author);
    if (cover) {
      const author = target?.author ?? "";
      saveCoverToCache(title, author, cover);
      setToReadBooks((prev) => prev.map((book) => (book.id === id ? { ...book, coverUrl: cover } : book)));
    }
    setBusyCoverId(null);
  };

  const renderNotes = (text: string) => {
    const lines = text.split("\n");
    const blocks: ReactNode[] = [];
    let bullets: string[] = [];

    const flushBullets = () => {
      if (bullets.length === 0) return;
      blocks.push(
        <ul key={`bullets-${blocks.length}`} className="list-disc pl-5 space-y-1">
          {bullets.map((item, i) => (
            <li key={`bullet-${i}`}>{item}</li>
          ))}
        </ul>,
      );
      bullets = [];
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        flushBullets();
        continue;
      }
      const bulletMatch = line.match(/^[-*]\s+(.+)$/);
      if (bulletMatch) {
        bullets.push(bulletMatch[1]);
      } else {
        flushBullets();
        blocks.push(
          <p key={`line-${blocks.length}`} className="leading-relaxed">
            {line}
          </p>,
        );
      }
    }
    flushBullets();

    if (blocks.length === 0) {
      return <p className="text-zinc-500">no notes yet.</p>;
    }
    return <div className="space-y-2">{blocks}</div>;
  };

  const getDisplayCover = (title: string, coverUrl: string | null) =>
    coverUrl ?? instantCoverFallback(title);

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#ffffff_0%,#f5f5f7_48%,#eef0f3_100%)] font-sans text-zinc-900">
      <div className="pointer-events-none fixed inset-0 opacity-100 [background:radial-gradient(circle_at_15%_10%,rgba(255,255,255,0.9),transparent_30%),radial-gradient(circle_at_85%_0%,rgba(255,255,255,0.75),transparent_26%)]" />

      <Navbar className="bg-white/70 backdrop-blur-xl border-b border-zinc-200" maxWidth="2xl">
        <NavbarBrand>
          <p className="font-semibold text-xl tracking-tight text-zinc-900">
            Neel&apos;s Library
          </p>
        </NavbarBrand>
        <NavbarContent justify="end">
          <NavbarItem>
            <Button as="a" href="/" size="sm" className="bg-white text-black hover:bg-zinc-200">
              library
            </Button>
          </NavbarItem>
          <NavbarItem>
            <Button as="a" href="/stats" size="sm" variant="flat" className="text-zinc-600 bg-zinc-100">
              stats
            </Button>
          </NavbarItem>
        </NavbarContent>
      </Navbar>

      <main className="relative z-10 mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease: "easeOut" }}
        >
          <div className="mb-4">
            <Input
              placeholder="search books, authors, genre, notes..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
          </div>
          <Tabs
            fullWidth
            aria-label="Library sections"
            classNames={{
              tabList: "bg-white/90 border border-zinc-200 p-1",
              cursor: "bg-zinc-900",
              tabContent: "group-data-[selected=true]:text-white font-medium",
            }}
          >
            <Tab key="read" title={`read (${filteredReadBooks.length})`}>
              <div className="mt-4 rounded-2xl border border-zinc-200 bg-white/80 p-3 sm:p-4">
                {filteredReadBooks.length === 0 ? (
                  <Card className="bg-white border border-dashed border-zinc-300">
                    <CardBody className="text-zinc-500">
                      {readBooks.length === 0
                        ? "no books logged yet. tap + to add your first one."
                        : "no matches for that search in read books."}
                    </CardBody>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {filteredReadBooks.map((book) => {
                      const isEditing = editingId === book.id;
                      return (
                        <Card
                          key={book.id}
                          className="relative h-full min-h-[340px] sm:min-h-[390px] overflow-hidden bg-white border border-zinc-200 shadow-[0_10px_24px_rgba(0,0,0,0.08)]"
                        >
                          <CardBody className="h-full gap-3 pb-5">
                            <div
                              className={`flex flex-col gap-4 sm:flex-row ${isEditing ? "" : "cursor-pointer"}`}
                              onClick={
                                isEditing
                                  ? undefined
                                  : () =>
                                      setDetailBook({
                                        title: book.title,
                                        author: book.author,
                                        genre: book.genre,
                                        recommendedBy: book.recommendedBy,
                                        rating: book.rating,
                                        year: book.year,
                                        coverUrl: book.coverUrl,
                                        notes: book.notes,
                                      })
                              }
                              onKeyDown={
                                isEditing
                                  ? undefined
                                  : (e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        setDetailBook({
                                          title: book.title,
                                          author: book.author,
                                          genre: book.genre,
                                          recommendedBy: book.recommendedBy,
                                          rating: book.rating,
                                          year: book.year,
                                          coverUrl: book.coverUrl,
                                          notes: book.notes,
                                        });
                                      }
                                    }
                              }
                              role={isEditing ? undefined : "button"}
                              tabIndex={isEditing ? -1 : 0}
                            >
                              {getDisplayCover(book.title, book.coverUrl) ? (
                                <Image
                                  src={getDisplayCover(book.title, book.coverUrl)!}
                                  alt={`${book.title} cover`}
                                  width={170}
                                  height={255}
                                  className="h-[280px] w-full rounded-md object-cover shadow-sm sm:h-[255px] sm:w-[170px]"
                                />
                              ) : (
                                <div className="h-[280px] w-full rounded-md bg-zinc-100 text-[11px] text-zinc-500 grid place-items-center px-1 text-center sm:h-[255px] sm:w-[170px]">
                                  no cover
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-lg font-semibold leading-tight">{book.title}</p>
                                {!isEditing && book.author ? <p className="text-sm text-zinc-600 mt-1">author: {book.author}</p> : null}
                                {!isEditing && book.genre ? <p className="text-sm text-zinc-600">genre: {book.genre}</p> : null}
                                {!isEditing && book.recommendedBy ? <p className="text-sm text-zinc-600">recommended by: {book.recommendedBy}</p> : null}
                                {!isEditing ? <p className="text-sm text-zinc-500 mt-1">finished: {book.year}</p> : null}
                                {!isEditing ? (
                                  <div className="mt-2 flex items-center gap-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <span key={`${book.id}-star-${i}`} className={i < book.rating ? "text-zinc-900" : "text-zinc-300"}>
                                        ★
                                      </span>
                                    ))}
                                  </div>
                                ) : null}
                                {!isEditing && book.liked ? (
                                  <p className="text-sm text-zinc-700 mt-2">
                                    <span className="font-medium">liked:</span> {book.liked}
                                  </p>
                                ) : null}
                                {!isEditing ? <p className="mt-3 text-xs text-zinc-500">tap card to view notes</p> : null}
                              </div>
                            </div>

                            {isEditing ? (
                              <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1" onClick={(e) => e.stopPropagation()}>
                                <Input label="author" value={editAuthor} onValueChange={setEditAuthor} />
                                <Input label="genre" value={editGenre} onValueChange={setEditGenre} />
                                <Input label="who recommended it" value={editRecommendedBy} onValueChange={setEditRecommendedBy} />
                                <div>
                                  <p className="mb-1 text-sm text-zinc-600">rating</p>
                                  <div className="flex items-center gap-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <button
                                        key={`edit-star-${i}`}
                                        type="button"
                                        className={i < editRating ? "text-xl text-zinc-900" : "text-xl text-zinc-300"}
                                        onClick={() => setEditRating(i + 1)}
                                        aria-label={`set rating to ${i + 1}`}
                                      >
                                        ★
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <Input label="what you liked" value={editLiked} onValueChange={setEditLiked} />
                                <Input label="year finished" value={editYear} onValueChange={setEditYear} />
                                <Textarea
                                  label="notes"
                                  minRows={4}
                                  value={editNotes}
                                  onValueChange={setEditNotes}
                                  placeholder={"- key idea\n- favorite quote\n- what i learned"}
                                />
                                <div className="flex flex-wrap gap-2">
                                  <Button size="sm" onPress={() => saveEdit(book.id)}>
                                    save edits
                                  </Button>
                                  <Button size="sm" variant="flat" onPress={() => setEditingId(null)}>
                                    cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-auto flex flex-wrap gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                                <Button size="sm" variant="flat" onPress={() => startEdit(book)}>
                                  edit notes
                                </Button>
                                <Button
                                  size="sm"
                                  variant="flat"
                                  onPress={() => refreshCoverForRead(book.id, book.title)}
                                  isLoading={busyCoverId === book.id}
                                >
                                  refresh cover
                                </Button>
                                <Button size="sm" variant="flat" onPress={() => removeReadBook(book.id)}>
                                  remove
                                </Button>
                              </div>
                            )}
                          </CardBody>
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3 bg-gradient-to-b from-zinc-100 to-transparent" />
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </Tab>

            <Tab key="to-read" title={`to read (${filteredToReadBooks.length})`}>
              <div className="mt-4 rounded-2xl border border-zinc-200 bg-white/80 p-3 sm:p-4">
                {filteredToReadBooks.length === 0 ? (
                  <Card className="bg-white border border-dashed border-zinc-300">
                    <CardBody className="text-zinc-500">
                      {toReadBooks.length === 0
                        ? "no to-read books yet. tap + to add one."
                        : "no matches for that search in to-read books."}
                    </CardBody>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {filteredToReadBooks.map((book) => (
                      <Card
                        key={book.id}
                        className="relative h-full min-h-[340px] sm:min-h-[390px] overflow-hidden bg-white border border-zinc-200 shadow-[0_10px_24px_rgba(0,0,0,0.08)]"
                      >
                        <CardBody className="h-full gap-3 pb-5">
                          <div
                            className="flex flex-col gap-4 sm:flex-row cursor-pointer"
                            onClick={() =>
                              setDetailBook({
                                title: book.title,
                                author: book.author,
                                genre: book.genre,
                                recommendedBy: book.recommendedBy,
                                coverUrl: book.coverUrl,
                                notes: book.reason,
                              })
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setDetailBook({
                                  title: book.title,
                                  author: book.author,
                                  genre: book.genre,
                                  recommendedBy: book.recommendedBy,
                                  coverUrl: book.coverUrl,
                                  notes: book.reason,
                                });
                              }
                            }}
                            role="button"
                            tabIndex={0}
                          >
                            {getDisplayCover(book.title, book.coverUrl) ? (
                              <Image
                                src={getDisplayCover(book.title, book.coverUrl)!}
                                alt={`${book.title} cover`}
                                width={170}
                                height={255}
                                className="h-[280px] w-full rounded-md object-cover shadow-sm sm:h-[255px] sm:w-[170px]"
                              />
                          ) : (
                              <div className="h-[280px] w-full rounded-md bg-zinc-100 text-[11px] text-zinc-500 grid place-items-center px-1 text-center sm:h-[255px] sm:w-[170px]">
                              no cover
                            </div>
                          )}
                            <div>
                            <p className="text-lg font-semibold">{book.title}</p>
                            {book.author ? <p className="text-sm text-zinc-600">author: {book.author}</p> : null}
                            {book.genre ? <p className="text-sm text-zinc-600">genre: {book.genre}</p> : null}
                            {book.recommendedBy ? <p className="text-sm text-zinc-600">recommended by: {book.recommendedBy}</p> : null}
                            <p className="mt-3 text-xs text-zinc-500">tap card to view notes</p>
                            </div>
                          </div>

                          <div className="mt-auto flex flex-wrap gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                            <Button size="sm" variant="flat" onPress={() => moveToRead(book)}>
                              move to read
                            </Button>
                            <Button
                              size="sm"
                              variant="flat"
                              onPress={() => refreshCoverForToRead(book.id, book.title)}
                              isLoading={busyCoverId === book.id}
                            >
                              refresh cover
                            </Button>
                            <Button size="sm" variant="flat" onPress={() => removeToReadBook(book.id)}>
                              remove
                            </Button>
                          </div>
                        </CardBody>
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3 bg-gradient-to-b from-zinc-100 to-transparent" />
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </Tab>
          </Tabs>
        </motion.section>
      </main>

      <Button
        color="default"
        radius="full"
        className="fixed bottom-8 right-6 z-40 h-14 w-14 min-w-0 text-3xl shadow-[0_12px_24px_rgba(0,0,0,0.18)] bg-zinc-900 text-white"
        onPress={() => setIsAddModalOpen(true)}
      >
        +
      </Button>

      <Modal
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        size="2xl"
        placement="center"
        scrollBehavior="inside"
      >
        <ModalContent className="bg-white border border-zinc-200 text-zinc-900">
          <ModalHeader className="text-2xl font-semibold tracking-tight text-zinc-900">
            add a new book
          </ModalHeader>
          <ModalBody className="pb-6">
            <Tabs
              fullWidth
              aria-label="Add book type"
              classNames={{
                tabList: "bg-zinc-100 border border-zinc-200 p-1",
                cursor: "bg-zinc-900",
                tabContent: "group-data-[selected=true]:text-white font-medium",
              }}
            >
              <Tab key="add-read" title="read">
                <div className="mt-2 space-y-3">
                  <Input label="book title" value={readTitle} onValueChange={setReadTitle} />
                  <Input label="author" value={readAuthor} onValueChange={setReadAuthor} />
                  <Input label="genre" value={readGenre} onValueChange={setReadGenre} />
                  <Input label="who recommended it" value={readRecommendedBy} onValueChange={setReadRecommendedBy} />
                  <div>
                    <p className="mb-1 text-sm text-zinc-600">rating</p>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button
                          key={`add-star-${i}`}
                          type="button"
                          className={i < readRating ? "text-2xl text-zinc-900" : "text-2xl text-zinc-300"}
                          onClick={() => setReadRating(i + 1)}
                          aria-label={`set rating to ${i + 1}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <Input label="what you liked" value={readLiked} onValueChange={setReadLiked} />
                  <Input label="year finished" value={readYear} onValueChange={setReadYear} />
                  <Textarea
                    label="notes"
                    minRows={4}
                    value={readNotes}
                    onValueChange={setReadNotes}
                    placeholder={"- key idea\n- favorite quote\n- what i learned"}
                  />
                  <Button onPress={addReadBook} isLoading={isSavingRead}>
                    save to read list
                  </Button>
                </div>
              </Tab>
              <Tab key="add-to-read" title="to read">
                <div className="mt-2 space-y-3">
                  <Input label="book title" value={toReadTitle} onValueChange={setToReadTitle} />
                  <Input label="author" value={toReadAuthor} onValueChange={setToReadAuthor} />
                  <Input label="genre" value={toReadGenre} onValueChange={setToReadGenre} />
                  <Input
                    label="who recommended it"
                    value={toReadRecommendedBy}
                    onValueChange={setToReadRecommendedBy}
                  />
                  <Textarea label="why this one" minRows={3} value={toReadReason} onValueChange={setToReadReason} />
                  <Button onPress={addToReadBook} isLoading={isSavingToRead}>
                    save to to-read list
                  </Button>
                </div>
              </Tab>
            </Tabs>
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={Boolean(detailBook)}
        onOpenChange={(open) => {
          if (!open) setDetailBook(null);
        }}
        size="2xl"
        placement="center"
        scrollBehavior="inside"
      >
        <ModalContent className="bg-white border border-zinc-200 text-zinc-900">
          <ModalHeader className="text-2xl font-semibold tracking-tight text-zinc-900">book notes</ModalHeader>
          {detailBook ? (
            <ModalBody className="pb-6">
              <div className="flex flex-col gap-4 sm:flex-row">
                {getDisplayCover(detailBook.title, detailBook.coverUrl) ? (
                  <Image
                    src={getDisplayCover(detailBook.title, detailBook.coverUrl)!}
                    alt={`${detailBook.title} cover`}
                    width={130}
                    height={195}
                    className="h-[240px] w-full rounded-md object-cover shadow-sm sm:h-[195px] sm:w-[130px]"
                  />
                ) : (
                  <div className="h-[240px] w-full rounded-md bg-zinc-100 text-[11px] text-zinc-500 grid place-items-center px-1 text-center sm:h-[195px] sm:w-[130px]">
                    no cover
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xl font-semibold">{detailBook.title}</p>
                  {detailBook.author ? <p className="text-sm text-zinc-600 mt-1">author: {detailBook.author}</p> : null}
                  {detailBook.genre ? <p className="text-sm text-zinc-600">genre: {detailBook.genre}</p> : null}
                  {detailBook.recommendedBy ? (
                    <p className="text-sm text-zinc-600">recommended by: {detailBook.recommendedBy}</p>
                  ) : null}
                  {typeof detailBook.year === "number" ? (
                    <p className="text-sm text-zinc-500">finished: {detailBook.year}</p>
                  ) : null}
                  {typeof detailBook.rating === "number" ? (
                    <div className="mt-2 flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={`detail-star-${i}`} className={i < detailBook.rating! ? "text-zinc-900" : "text-zinc-300"}>
                          ★
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="mt-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-800">
                {renderNotes(detailBook.notes)}
              </div>
            </ModalBody>
          ) : null}
        </ModalContent>
      </Modal>

      <motion.div
        className="fixed bottom-4 left-4 text-xs text-zinc-500"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {isDbSyncing
          ? "syncing with database..."
          : isAutoFetchingCovers
            ? "auto-fetching book covers..."
            : isSupabaseConfigured
              ? "auto-saves to database"
              : "auto-saves in your browser"}
      </motion.div>
    </div>
  );
}
