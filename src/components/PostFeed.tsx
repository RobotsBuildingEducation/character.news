import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { type NostrEvent } from '@nostrify/nostrify';
import { NoteContent } from './NoteContent';
import { useEffect } from 'react';

interface PostItemProps {
  event: NostrEvent;
}

function PostItem({ event }: PostItemProps) {
  const { nostr } = useNostr();
  const { data: replies = [] } = useQuery({
    queryKey: ['replies', event.id],
    queryFn: async ({ signal }) => {
      const events = await nostr.query(
        [{ kinds: [1], '#e': [event.id], limit: 2 }],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(2000)]) },
      );
      return events.sort((a, b) => a.created_at - b.created_at);
    },
  });

  return (
    <div className="space-y-2 p-4 border rounded-md">
      <NoteContent event={event} />
      {replies.map((r) => (
        <div key={r.id} className="pl-4 border-l">
          <NoteContent event={r} />
        </div>
      ))}
    </div>
  );
}

export function PostFeed() {
  const { nostr } = useNostr();
  const { data: events = [], refetch } = useQuery({
    queryKey: ['feed'],
    queryFn: async ({ signal }) => {
      const events = await nostr.query(
        [{ kinds: [1], limit: 20 }],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(2000)]) },
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

  return (
    <div className="space-y-4">
      {events.map((e) => (
        <PostItem key={e.id} event={e} />
      ))}
    </div>
  );
}
