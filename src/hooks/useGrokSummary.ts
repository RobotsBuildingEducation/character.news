import { useState } from 'react';
import { useNostr } from '@nostrify/react';
import { nip19, getEventHash, getPublicKey } from 'nostr-tools';
import { signEvent } from 'nostr-tools/pure';
import { SOCIALISM_NSEC, CAPITALISM_NSEC } from '@/constants';

export function useGrokSummary() {
  const { nostr } = useNostr();
  const [socialist, setSocialist] = useState('');
  const [communist, setCommunist] = useState('');

  const publishSummary = async (
    nsec: string,
    summary: string,
    parentId: string,
  ) => {
    const sk = nip19.decode(nsec).data as string;
    const pk = getPublicKey(sk);
    const event = {
      kind: 1,
      pubkey: pk,
      content: summary,
      tags: [['e', parentId]],
      created_at: Math.floor(Date.now() / 1000),
    } as any;
    event.id = getEventHash(event);
    event.sig = await signEvent(event, sk);
    await nostr.event(event, { signal: AbortSignal.timeout(5000) });
  };

  const summarize = async (content: string, parentId: string) => {
    // Placeholder for Grok API call
    const soc = `Socialist view: ${content.slice(0, 50)}...`;
    const com = `Communist view: ${content.slice(0, 50)}...`;
    setSocialist(soc);
    setCommunist(com);
    await publishSummary(SOCIALISM_NSEC, soc, parentId);
    await publishSummary(CAPITALISM_NSEC, com, parentId);
  };

  return { socialist, communist, summarize };
}
