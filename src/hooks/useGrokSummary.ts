import { useState } from "react";
import { nip19, getEventHash, getPublicKey } from "nostr-tools";
import { SOCIALISM_NSEC, CAPITALISM_NSEC } from "@/constants";
import { useNostrPublish } from "@/hooks/useNostrPublish";
import { useNostrPublishWithKey } from "./useNostrPublishWithKey";

async function callGrok(
  prompt: string
  // signal?: AbortSignal
) {
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer nvm`,
    },
    body: JSON.stringify({
      model: "grok-3-latest",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.9,
      stream: false,
    }),
    // signal,
  });
  if (!res.ok) throw new Error(`Grok API error: ${res.statusText}`);
  const { choices } = await res.json();
  return choices[0].message.content.trim();
}

export function useGrokSummary() {
  const { mutateAsync: publishAnon } = useNostrPublishWithKey();
  const [socialist, setSocialist] = useState("");
  const [capitalist, setCapitalist] = useState("");

  const publishEvent = async (
    nsec: string, // you can drop this if publishEvent reads it from storage
    summary: string,
    parentId: string
  ) => {
    await publishAnon({
      nsec: nsec,
      content: summary,
      tags: [["e", parentId]],
    });
  };

  const summarize = async (content: string, parentId: string) => {
    const basePrompt = `Summarize the following text from a`;
    const prompts = [
      `${basePrompt} socialist  st perspective:\n\n${content}`,
      `${basePrompt} capitalist perspective:\n\n${content}`,
    ];

    // const controller = new AbortController();
    // const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const [soc, cap] = await Promise.all(
        prompts.map((p) =>
          callGrok(
            p
            // ,
            // controller.signal
          )
        )
      );
      setSocialist(soc);
      setCapitalist(cap);

      await publishEvent(SOCIALISM_NSEC, soc, parentId);
      await publishEvent(CAPITALISM_NSEC, cap, parentId);
    } catch (err) {
      console.error("Grok summary or publish failed:", err);
    } finally {
      // clearTimeout(timeout);
    }
  };

  return { socialist, capitalist, summarize };
}
