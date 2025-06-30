import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { useCharacters } from "~/hooks/useCharacters";

export function AdminCharacterForm() {
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const { addCharacter } = useCharacters();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addCharacter.mutateAsync({ name, prompt });
    setName("");
    setPrompt("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="Character Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Textarea
        placeholder="Prompt"
        className="h-20"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <Button type="submit">Create Character</Button>
    </form>
  );
}
