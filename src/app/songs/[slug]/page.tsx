import { notFound } from "next/navigation";
import StudySession from "@/components/StudySession";
import { getSongSet } from "@/lib/songData";

interface SongStudyPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function SongStudyPage({ params }: SongStudyPageProps) {
  const { slug } = await params;
  const songSet = await getSongSet(slug);

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
