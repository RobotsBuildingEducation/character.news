import { useSeoMeta } from "@unhead/react";
import { Link } from "react-router-dom";
import { NoteContent } from "~/components/NoteContent";
import { useSavedPosts } from "~/hooks/useSavedPosts";

export default function SavedPosts() {
  useSeoMeta({
    title: "Saved Posts - Character News",
  });

  const { savedEvents } = useSavedPosts();

  return (
    <div className="min-h-screen flex flex-col items-center gap-6 p-6" style={{ marginTop: 56 }}>
      <h1 className="text-2xl font-bold">Saved Posts</h1>
      <Link to="/" className="text-sm">
        Back to front page
      </Link>
      <div className="w-full max-w-xl space-y-6">
        {savedEvents.map((ev) => (
          <div key={ev.id} className="border-b pb-4">
            <NoteContent event={ev} />
          </div>
        ))}
        {savedEvents.length === 0 && (
          <p className="text-sm text-gray-700 dark:text-gray-300">No saved posts.</p>
        )}
      </div>
    </div>
  );
}
