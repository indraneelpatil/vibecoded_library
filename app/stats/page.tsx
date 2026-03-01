"use client";

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@heroui/react";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";

type ReadBook = {
  id: string;
  title: string;
  genre: string;
  recommendedBy: string;
  rating: number;
  year: number;
};

type ToReadBook = {
  id: string;
};

type LibraryData = {
  readBooks: ReadBook[];
  toReadBooks: ToReadBook[];
};

const STORAGE_KEY = "neels-library-v2";
const GENRE_PALETTE = ["#111827", "#334155", "#64748b", "#94a3b8", "#cbd5e1", "#e2e8f0"];

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

export default function StatsPage() {
  const [library] = useState<LibraryData>(() => {
    if (typeof window === "undefined") {
      return { readBooks: [], toReadBooks: [] };
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem("neels-library-v1");
      if (!raw) return { readBooks: [], toReadBooks: [] };
      const parsed = JSON.parse(raw) as LibraryData;

      const migratedRead = (parsed.readBooks ?? []).map((book) => ({
        id: book.id ?? crypto.randomUUID(),
        title: (book.title ?? "untitled").trim(),
        genre: (book.genre ?? "").trim(),
        recommendedBy: (book.recommendedBy ?? "").trim(),
        rating: safeRating(book.rating),
        year: safeYear(book.year),
      }));

      const migratedToRead = (parsed.toReadBooks ?? []).map((book) => ({
        id: book.id ?? crypto.randomUUID(),
      }));

      return { readBooks: migratedRead, toReadBooks: migratedToRead };
    } catch {
      return { readBooks: [], toReadBooks: [] };
    }
  });

  const readBooks = library.readBooks;
  const toReadBooks = library.toReadBooks;

  const booksReadThisYear = useMemo(() => {
    const current = new Date().getFullYear();
    return readBooks.filter((book) => book.year === current).length;
  }, [readBooks]);

  const booksByYear = useMemo(() => {
    const bucket = new Map<number, number>();
    for (const book of readBooks) {
      bucket.set(book.year, (bucket.get(book.year) ?? 0) + 1);
    }
    return [...bucket.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([year, count]) => ({ year, count }));
  }, [readBooks]);

  const maxYearCount = useMemo(() => Math.max(...booksByYear.map((x) => x.count), 1), [booksByYear]);

  const averageRating = useMemo(() => {
    const rated = readBooks.filter((book) => book.rating > 0);
    if (rated.length === 0) return 0;
    const total = rated.reduce((sum, book) => sum + book.rating, 0);
    return total / rated.length;
  }, [readBooks]);

  const topRatedBooks = useMemo(
    () =>
      [...readBooks]
        .filter((book) => book.rating > 0)
        .sort((a, b) => b.rating - a.rating || b.year - a.year || a.title.localeCompare(b.title))
        .slice(0, 8),
    [readBooks],
  );

  const genreBreakdown = useMemo(() => {
    const bucket = new Map<string, number>();
    for (const book of readBooks) {
      const key = book.genre?.trim() ? book.genre.trim() : "uncategorized";
      bucket.set(key, (bucket.get(key) ?? 0) + 1);
    }
    return [...bucket.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([genre, count]) => ({ genre, count }));
  }, [readBooks]);

  const topGenre = genreBreakdown[0]?.genre ?? "none yet";

  const ratingBreakdown = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    for (const book of readBooks) {
      if (book.rating >= 1 && book.rating <= 5) counts[book.rating - 1] += 1;
    }
    return counts.map((count, idx) => ({ stars: idx + 1, count }));
  }, [readBooks]);

  const maxRatingBucket = useMemo(
    () => Math.max(...ratingBreakdown.map((x) => x.count), 1),
    [ratingBreakdown],
  );

  const recommenderBreakdown = useMemo(() => {
    const bucket = new Map<string, number>();
    for (const book of readBooks) {
      const key = book.recommendedBy?.trim() ? book.recommendedBy.trim() : "self-picked";
      bucket.set(key, (bucket.get(key) ?? 0) + 1);
    }
    return [...bucket.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }))
      .slice(0, 6);
  }, [readBooks]);

  const genrePieStyle = useMemo(() => {
    const total = genreBreakdown.reduce((sum, item) => sum + item.count, 0);
    if (total === 0) {
      return { background: "conic-gradient(#e5e7eb 0deg 360deg)" };
    }
    let start = 0;
    const stops = genreBreakdown.map((item, idx) => {
      const sweep = (item.count / total) * 360;
      const end = start + sweep;
      const color = GENRE_PALETTE[idx % GENRE_PALETTE.length];
      const segment = `${color} ${start}deg ${end}deg`;
      start = end;
      return segment;
    });
    return { background: `conic-gradient(${stops.join(", ")})` };
  }, [genreBreakdown]);

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
            <Button as="a" href="/" size="sm" variant="flat" className="text-zinc-600 bg-zinc-100">
              library
            </Button>
          </NavbarItem>
          <NavbarItem>
            <Button as="a" href="/stats" size="sm" className="bg-zinc-900 text-white hover:bg-black">
              stats
            </Button>
          </NavbarItem>
        </NavbarContent>
      </Navbar>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <motion.section
          className="mb-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <Card className="bg-white border border-zinc-200 shadow-[0_10px_24px_rgba(0,0,0,0.08)]">
            <CardBody className="gap-3 p-6 sm:p-8">
              <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight text-zinc-900">
                your reading stats
              </h1>
              <p className="text-zinc-600">your reading numbers and trends live here now.</p>
            </CardBody>
          </Card>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease: "easeOut" }}
        >
          <Card className="bg-white border border-zinc-200 shadow-[0_10px_24px_rgba(0,0,0,0.08)]">
            <CardHeader className="font-semibold text-2xl tracking-tight text-zinc-900">
              stats
            </CardHeader>
            <Divider />
            <CardBody className="gap-5">
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-xl bg-zinc-50 p-4 border border-zinc-200">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">books read total</p>
                  <p className="text-2xl font-semibold text-zinc-900">{readBooks.length}</p>
                </div>
                <div className="rounded-xl bg-zinc-50 p-4 border border-zinc-200">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">books to read</p>
                  <p className="text-2xl font-semibold text-zinc-900">{toReadBooks.length}</p>
                </div>
                <div className="rounded-xl bg-zinc-50 p-4 border border-zinc-200">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">read this year</p>
                  <p className="text-2xl font-semibold text-zinc-900">{booksReadThisYear}</p>
                </div>
                <div className="rounded-xl bg-zinc-50 p-4 border border-zinc-200">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">avg rating</p>
                  <p className="text-2xl font-semibold text-zinc-900">{averageRating.toFixed(1)}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-zinc-50 p-4 border border-zinc-200">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">most read genre</p>
                  <p className="text-xl font-semibold text-zinc-900 capitalize">{topGenre}</p>
                </div>
                <div className="rounded-xl bg-zinc-50 p-4 border border-zinc-200">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">rated books</p>
                  <p className="text-xl font-semibold text-zinc-900">
                    {readBooks.filter((book) => book.rating > 0).length}
                  </p>
                </div>
                <div className="rounded-xl bg-zinc-50 p-4 border border-zinc-200">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">self picked</p>
                  <p className="text-xl font-semibold text-zinc-900">
                    {readBooks.filter((book) => !book.recommendedBy?.trim()).length}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-700">books per year</p>
                {booksByYear.length === 0 ? (
                  <p className="text-sm text-zinc-500">add books to your read list and the chart appears here.</p>
                ) : (
                  booksByYear.map((item) => (
                    <div key={item.year} className="flex items-center gap-3">
                      <div className="w-14 text-sm text-zinc-500">{item.year}</div>
                      <div className="h-7 flex-1 rounded-md bg-zinc-100 overflow-hidden border border-zinc-200">
                        <div
                          className="h-full rounded-md bg-gradient-to-r from-zinc-900 to-zinc-700 px-2 text-right text-xs font-medium text-white leading-7"
                          style={{ width: `${Math.max((item.count / maxYearCount) * 100, 12)}%` }}
                        >
                          {item.count}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-sm font-medium text-zinc-700 mb-3">genre pie</p>
                  <div className="mx-auto h-48 w-48 rounded-full border border-zinc-200" style={genrePieStyle} />
                </div>
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-sm font-medium text-zinc-700 mb-3">genre breakdown</p>
                  {genreBreakdown.length === 0 ? (
                    <p className="text-sm text-zinc-500">add genres to your books and this chart appears here.</p>
                  ) : (
                    <div className="space-y-2">
                      {genreBreakdown.map((item, idx) => (
                        <div key={item.genre} className="flex items-center gap-3">
                          <span
                            className="h-3 w-3 rounded-full border border-zinc-300"
                            style={{ backgroundColor: GENRE_PALETTE[idx % GENRE_PALETTE.length] }}
                          />
                          <p className="min-w-0 flex-1 truncate text-sm text-zinc-700 capitalize">{item.genre}</p>
                          <p className="text-sm font-semibold text-zinc-900">{item.count}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-700">rating spread</p>
                <div className="space-y-2">
                  {ratingBreakdown.map((item) => (
                    <div key={item.stars} className="flex items-center gap-3">
                      <div className="w-12 text-sm text-zinc-600">{item.stars}★</div>
                      <div className="h-6 flex-1 rounded-md bg-zinc-100 border border-zinc-200">
                        <div
                          className="h-full rounded-md bg-zinc-800"
                          style={{ width: `${Math.max((item.count / maxRatingBucket) * 100, item.count > 0 ? 8 : 0)}%` }}
                        />
                      </div>
                      <div className="w-8 text-sm text-zinc-700">{item.count}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-700">who influences your reading</p>
                {recommenderBreakdown.length === 0 ? (
                  <p className="text-sm text-zinc-500">add a few books and recommenders to see this pattern.</p>
                ) : (
                  <div className="space-y-2">
                    {recommenderBreakdown.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2"
                      >
                        <p className="text-sm text-zinc-700">{item.name}</p>
                        <p className="text-sm font-semibold text-zinc-900">{item.count}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-700">top rated books</p>
                {topRatedBooks.length === 0 ? (
                  <p className="text-sm text-zinc-500">rate a few read books and they&apos;ll show up here.</p>
                ) : (
                  <div className="space-y-2">
                    {topRatedBooks.map((book) => (
                      <div
                        key={book.id}
                        className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2"
                      >
                        <p className="text-sm font-medium text-zinc-900">{book.title}</p>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={`${book.id}-top-star-${i}`} className={i < book.rating ? "text-zinc-900" : "text-zinc-300"}>
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </motion.section>
      </main>
    </div>
  );
}
