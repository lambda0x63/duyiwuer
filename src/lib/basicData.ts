"use server";

import { cache } from "react";
import path from "path";
import { promises as fs } from "fs";
import type { WordData } from "@/types/word";

type WordType = "basic" | "textbook";

const loadWords = cache(
  async (type: WordType): Promise<WordData[]> => {
    try {
      const dataDirectory = path.join(process.cwd(), "public", "data", type);
      const files = await fs.readdir(dataDirectory);
      const jsonFiles = files.filter((file) => file.endsWith(".json")).sort();

      const contents = await Promise.all(
        jsonFiles.map(async (file) => {
          const absolutePath = path.join(dataDirectory, file);
          const raw = await fs.readFile(absolutePath, "utf-8");
          return JSON.parse(raw) as WordData[];
        })
      );

      return contents.flat();
    } catch (error) {
      console.error(`Failed to load ${type} data:`, error);
      return [];
    }
  }
);

export const getBasicWords = async (): Promise<WordData[]> => loadWords("basic");
export const getTextbookWords = async (): Promise<WordData[]> => loadWords("textbook");

