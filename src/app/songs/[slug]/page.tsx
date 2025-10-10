import { notFound } from "next/navigation";
import StudySession from "@/components/StudySession";
import { getSongSet } from "@/lib/songData";

interface SongStudyPageProps {
  params: {
    slug: string;
  };
}

export default async function SongStudyPage({ params }: SongStudyPageProps) {
  const songSet = await getSongSet(params.slug);

  if (!songSet) {
    notFound();
  }

  return (
    <StudySession
      words={songSet.words}
      title={`${songSet.title} 가사 단어`}
      backPath="/songs"
    />
  );
}
