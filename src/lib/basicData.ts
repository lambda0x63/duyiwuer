"use server";

import { cache } from "react";
import path from "path";
import { promises as fs } from "fs";
import type { WordData } from "@/types/word";

// Fisher-Yates Shuffle
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const getAllWords = cache(async (): Promise<WordData[]> => {
  try {
    const dataDirectory = path.join(process.cwd(), "public", "data");
    const files = await fs.readdir(dataDirectory);
    const jsonFiles = files.filter((file) => file.endsWith(".json"));

    const contents = await Promise.all(
      jsonFiles.map(async (file) => {
        const absolutePath = path.join(dataDirectory, file);
        const raw = await fs.readFile(absolutePath, "utf-8");
        return JSON.parse(raw) as WordData[];
      })
    );

    const allWords = contents.flat();
    return shuffle(allWords);
  } catch (error) {
    console.error("Failed to load data:", error);
    return [];
  }
});


