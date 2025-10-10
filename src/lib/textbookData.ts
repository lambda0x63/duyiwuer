"use server";

import { cache } from "react";
import path from "path";
import { promises as fs } from "fs";
import type { WordData } from "@/types/word";

const textbookDirectory = path.join(process.cwd(), "public", "data", "textbook");

const loadTextbookWords = cache(async (): Promise<WordData[]> => {
  try {
    const files = await fs.readdir(textbookDirectory);
    const jsonFiles = files.filter((file) => file.endsWith(".json")).sort();

    const contents = await Promise.all(
      jsonFiles.map(async (file) => {
        const absolutePath = path.join(textbookDirectory, file);
        const raw = await fs.readFile(absolutePath, "utf-8");
        return JSON.parse(raw) as WordData[];
      })
    );

    return contents.flat();
  } catch (error) {
    console.error("Failed to load textbook data:", error);
    return [];
  }
});

export const getTextbookWords = async (): Promise<WordData[]> => loadTextbookWords();

