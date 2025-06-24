import { useState } from "react";
import { useNostrPublish } from "@/hooks/useNostrPublish";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useGrokSummary } from "@/hooks/useGrokSummary";

export function AdminArticleForm() {
  const [title, setTitle] = useState("");
  const [datetime, setDatetime] = useState("");
  const [content, setContent] = useState("");
  const { mutateAsync: publish } = useNostrPublish();
  const { toast } = useToast();
  const { socialist, capitalist, summarize } = useGrokSummary();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await publish({
        kind: 30023,
        content,
        tags: [
          ["title", title],
          ["published_at", datetime || new Date().toISOString()],
        ],
      });
      await summarize(content);
      toast({ title: "Article posted" });
      setTitle("");
      setDatetime("");
      setContent("");
    } catch (err) {
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
        <Button type="submit">Post Article</Button>
      </form>
      {socialist && (
        <div className="space-y-2">
          <p className="font-semibold">Socialist Summary</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {socialist}
          </p>
        </div>
      )}
      {communist && (
        <div className="space-y-2">
          <p className="font-semibold">Communist Summary</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {communist}
          </p>
        </div>
      )}
    </div>
  );
}
