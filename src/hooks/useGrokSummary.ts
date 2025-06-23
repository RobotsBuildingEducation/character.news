import { useState } from "react";
import { useNostr } from "@nostrify/react";
import { nip19, getEventHash, getPublicKey } from "nostr-tools";
import { SOCIALISM_NSEC, CAPITALISM_NSEC } from "@/constants";

async function callGrok(prompt: string, signal?: AbortSignal) {
  const res = await fetch("https://api.grok.ai/v1/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_GROK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "grok-3",
      prompt,
      // max_tokens: 150,
      temperature: 0.9,
    }),
    signal,
  });
  if (!res.ok) throw new Error(`Grok API error: ${res.statusText}`);
  const { choices } = await res.json();
  return choices[0].text.trim();
}

export function useGrokSummary() {
  const { nostr } = useNostr();
  const [socialist, setSocialist] = useState("");
  const [communist, setCommunist] = useState("");

  const publishSummary = async (
    nsec: string,
    summary: string,
    parentId: string
  ) => {
    const sk = nip19.decode(nsec).data as string;
    const pk = getPublicKey(sk);
    const event = {
      kind: 1,
      pubkey: pk,
      content: summary,
      tags: [["e", parentId]],
      created_at: Math.floor(Date.now() / 1000),
    } as any;
    event.id = getEventHash(event);
    event.sig = await event.sign(event, sk);
    await nostr.event(event, { signal: AbortSignal.timeout(5000) });
  };

  const summarize = async (content: string, parentId: string) => {
    // build prompts
    const base = `Summarize the following text from a`;
    const prompts = [
      `${base} socialist perspective:\n\n${content}`,
      `${base} communist perspective:\n\n${content}`,
    ];

    // fire both requests in parallel with a 5s timeout each
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const [soc, com] = await Promise.all(
        prompts.map((p) => callGrok(p, controller.signal))
      );
      setSocialist(soc);
      setCommunist(com);

      await publishSummary(SOCIALISM_NSEC, soc, parentId);
      await publishSummary(CAPITALISM_NSEC, com, parentId);
    } catch (err) {
      console.error("Grok summary failed:", err);
    } finally {
      clearTimeout(timeout);
    }
  };

  return { socialist, communist, summarize };
}
