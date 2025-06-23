import { useState } from "react";
import { nip19, getEventHash, getPublicKey } from "nostr-tools";
import { SOCIALISM_NSEC, CAPITALISM_NSEC } from "@/constants";
import { useNostrPublish } from "@/hooks/useNostrPublish";
import { useNostrPublishWithKey } from "./useNostrPublishWithKey";
import { model } from "@/lib/firebaseResources";

const callGrok = async (prompt: string) => {
  const result = await model.generateContent(prompt);
  // result.response is a GenerateContentResponse
  return result.response.text();
};

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
