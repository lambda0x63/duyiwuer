"use server";

import { cache } from "react";
import path from "path";
import { promises as fs } from "fs";
import type { WordData } from "@/types/word";

export interface SongSet {
  slug: string;
  title: string;
  description: string;
  words: WordData[];
}

const songsDirectory = path.join(process.cwd(), "public", "data", "song");

const readSongFile = async (fileName: string): Promise<SongSet | null> => {
  const absolutePath = path.join(songsDirectory, fileName);

  try {
    const raw = await fs.readFile(absolutePath, "utf-8");
    const words = JSON.parse(raw) as WordData[];
    const title = decodeURIComponent(fileName.replace(/\.json$/i, ""));

    return {
      slug: title,
      title,
      description: `${title} 가사 기반 어휘 학습`,
      words,
    };
  } catch {
    return null;
  }
};

const loadSongSets = cache(async (): Promise<SongSet[]> => {
  const files = await fs.readdir(songsDirectory);
  const jsonFiles = files.filter((file) => file.endsWith(".json"));

  const results = await Promise.all(jsonFiles.map(readSongFile));
  const sets = results.filter((set): set is SongSet => Boolean(set));

  return sets.sort((a, b) => a.title.localeCompare(b.title, "zh-Hans"));
});

export const getSongSets = async (): Promise<SongSet[]> => loadSongSets();

export const getSongSet = cache(async (slug: string): Promise<SongSet | null> => {
  const sets = await loadSongSets();
  const decoded = decodeURIComponent(slug);

  return sets.find((set) => set.slug === decoded) ?? null;
});
