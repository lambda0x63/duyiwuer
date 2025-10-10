import { getSongSets } from "@/lib/songData";
import SongListClient from "./SongListClient";

export default async function SongStudyMenuPage() {
  const songSets = await getSongSets();

  return <SongListClient songSets={songSets} />;
}
