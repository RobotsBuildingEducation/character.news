import { useNostr } from "@nostrify/react";
import { useQuery } from "@tanstack/react-query";
import { type NostrEvent } from "@nostrify/nostrify";
import { nip19 } from "nostr-tools";
import { ADMIN_NPUB } from "@/constants";
import { NoteContent } from "./NoteContent";
import { useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface PostItemProps {
  event: NostrEvent;
}

function PostItem({ event }: PostItemProps) {
  const { nostr } = useNostr();
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

  const parseHeader = (ev: NostrEvent) => {
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
    const text = lines.slice(idx).join(" ");
    const header =
      title || character || text.slice(0, 50) + (text.length > 50 ? "..." : "");
    return header;
  };

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value={event.id}>
        <AccordionTrigger>{parseHeader(event)}</AccordionTrigger>
        <AccordionContent>
          <NoteContent event={event} />
          {replies.map((r, index) => (
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
                    {parseHeader(r)}
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

  let xr = events.reverse();
  return (
    <div className="space-y-4">
      {xr.map((e, index) => {
        if (index === 0) {
          return;
        }
        return <PostItem key={e.id} event={e} />;
      })}
    </div>
  );
}
