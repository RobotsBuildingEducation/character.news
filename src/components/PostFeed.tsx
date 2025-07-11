import { useNostr } from "@nostrify/react";
import { useQuery } from "@tanstack/react-query";
import { type NostrEvent } from "@nostrify/nostrify";
import { nip19 } from "nostr-tools";
import { ADMIN_NPUB } from "~/constants";
import { NoteContent } from "./NoteContent";
import { useEffect, useMemo } from "react";
import { Button } from "~/components/ui/button";
import { useToast } from "~/hooks/useToast";
import { useSavedPosts } from "~/hooks/useSavedPosts";
import { useCurrentUser } from "~/hooks/useCurrentUser";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";

interface PostItemProps {
  event: NostrEvent;
}

function PostItem({ event }: PostItemProps) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const { savedPostIds, savePost, removePost } = useSavedPosts();
  const { data: replies = [] } = useQuery({
    queryKey: ["replies", event.id],
    queryFn: async ({ signal }) => {
      const events = await nostr.query(
        [{ kinds: [1], "#e": [event.id], limit: 4 }],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(2000)]) }
      );
      return events.sort((a, b) => a.created_at - b.created_at);
    },
  });

  const parseEvent = (ev: NostrEvent) => {
    const lines = ev.content.split("\n");
    let title = "";
    let character = "";
    let idx = 0;
    while (idx < lines.length) {
      const line = lines[idx].trim();
      if (line.startsWith("Title:")) {
        title = line.replace("Title:", "").trim();
      } else if (line.startsWith("Character:")) {
        character = line.replace("Character:", "").trim();
      } else if (line !== "") {
        break;
      }
      idx++;
    }
    const text = lines.slice(idx).join("\n").trim();
    const header =
      title || character || text.slice(0, 50) + (text.length > 50 ? "..." : "");
    return { title, character, text, header };
  };

  const filteredReplies = useMemo(() => {
    const map = new Map<string, NostrEvent>();
    for (const r of replies) {
      const { text } = parseEvent(r);
      if (!text) continue;
      const existing = map.get(r.pubkey);
      if (!existing || existing.created_at < r.created_at) {
        map.set(r.pubkey, r);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.created_at - b.created_at);
  }, [replies]);

  const isSaved = savedPostIds.includes(event.id);

  const handleSave = async () => {
    if (!user) {
      toast({ title: "Please log in to save posts", variant: "destructive" });
      return;
    }
    try {
      if (isSaved) await removePost(event.id);
      else await savePost(event.id);
    } catch (err) {
      console.error("Failed to save post", err);
    }
  };

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value={event.id}>
        <AccordionTrigger>{parseEvent(event).header}</AccordionTrigger>
        <AccordionContent>
          <NoteContent event={event} />
          <div className="mt-2">
            <Button variant="secondary" size="sm" onClick={handleSave}>
              {isSaved ? "Unsave" : "Save"}
            </Button>
          </div>
          {filteredReplies.map((r) => (
            <div
              key={r.id}
              className="pt-4 border-l pl-4"
              style={{ borderLeft: "1px solid #bfbfbf" }}
            >
              <Accordion
                type="single"
                collapsible
                style={{ borderBottom: "1px solid #bfbfbf" }}
              >
                <AccordionItem value={r.id}>
                  <AccordionTrigger className="text-sm">
                    {parseEvent(r).header}
                  </AccordionTrigger>
                  <AccordionContent>
                    <NoteContent event={r} />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          ))}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export function PostFeed() {
  const { nostr } = useNostr();
  const ADMIN_PUBKEY = nip19.decode(ADMIN_NPUB).data as string;
  const { data: events = [], refetch } = useQuery({
    queryKey: ["feed"],
    queryFn: async ({ signal }) => {
      const events = await nostr.query(
        [{ kinds: [1], authors: [ADMIN_PUBKEY], limit: 20 }],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(2000)]) }
      );
      return events.sort((a, b) => b.created_at - a.created_at);
    },
  });

  useEffect(() => {
    const id = setInterval(() => {
      refetch();
    }, 10000);
    return () => clearInterval(id);
  }, [refetch]);

  console.log("events", events);

  // let xr = events.reverse();
  return (
    <div className="space-y-4">
      {events.map((e, index) => {
        if (index === events.length - 1) {
          return;
        }
        return <PostItem key={e.id} event={e} />;
      })}
    </div>
  );
}
