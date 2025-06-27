import { useState } from "react";
import { useCharacters } from "@/hooks/useCharacters";
import { useNostrPublishWithKey } from "@/hooks/useNostrPublishWithKey";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function AdminCharacterPostEditor() {
  const { characters } = useCharacters();
  const { mutateAsync: publish } = useNostrPublishWithKey();
  const [eventId, setEventId] = useState("");
  const [characterId, setCharacterId] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const char = characters.find((c) => (c.id ?? c.nsec) === characterId);
    if (!char) return;
    await publish({
      nsec: char.nsec,
      content: `Character: ${char.name}\n\n${content}`,
      tags: [["e", eventId]],
    });
    setContent("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="Event ID"
        value={eventId}
        onChange={(e) => setEventId(e.target.value)}
      />
      <select
        className="w-full border rounded p-2"
        value={characterId}
        onChange={(e) => setCharacterId(e.target.value)}
      >
        <option value="">Select character</option>
        {characters.map((c) => (
          <option key={c.id ?? c.nsec} value={c.id ?? c.nsec}>
            {c.name}
          </option>
        ))}
      </select>
      <Textarea
        placeholder="Content"
        className="h-40"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <Button type="submit" disabled={!eventId || !characterId || !content}>
        Publish Correction
      </Button>
    </form>
  );
}
