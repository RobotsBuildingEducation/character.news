import { useState } from "react";
import { useNostrPublish } from "~/hooks/useNostrPublish";
import { useToast } from "~/hooks/useToast";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { useGrokSummary } from "~/hooks/useGrokSummary";
import { useCharacters } from "~/hooks/useCharacters";
import { Checkbox } from "~/components/ui/checkbox";

export function AdminPostForm() {
  const [title, setTitle] = useState("");
  const [datetime, setDatetime] = useState("");
  const [content, setContent] = useState("");
  const { mutateAsync: publish } = useNostrPublish();
  const { toast } = useToast();
  const { summaries, summarize } = useGrokSummary();
  const { characters } = useCharacters();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const noteContent = `Title: ${title}\n\n${content}`;
      const event = await publish({
        kind: 1,
        content: noteContent,
        tags: [["published_at", datetime || new Date().toISOString()]],
      });

      const selectedChars = characters.filter((c) =>
        selected.includes(c.id ?? c.nsec)
      );
      await summarize(noteContent, event.id, selectedChars);
      toast({ title: "Post published" });
      setTitle("");
      setDatetime("");
      setContent("");
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to post", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Input
          type="datetime-local"
          value={datetime}
          onChange={(e) => setDatetime(e.target.value)}
        />
        <Textarea
          placeholder="Content"
          className="h-40"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="space-y-2">
          {characters.map((c) => (
            <label key={c.id ?? c.nsec} className="flex items-center gap-2">
              <Checkbox
                checked={selected.includes(c.id ?? c.nsec)}
                onCheckedChange={() => toggle(c.id ?? c.nsec)}
              />
              {c.name}
            </label>
          ))}
        </div>
        <Button type="submit">Post Article</Button>
      </form>
      {Object.entries(summaries).map(([name, text]) => (
        <div key={name} className="space-y-2">
          <p className="font-semibold">{name} Summary</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{text}</p>
        </div>
      ))}
    </div>
  );
}
