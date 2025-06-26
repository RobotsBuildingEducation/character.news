import { useState } from "react";
import { useNostrPublishWithKey } from "./useNostrPublishWithKey";
import { model } from "@/lib/firebaseResources";
import type { Character } from "./useCharacters";

const callGrok = async (prompt: string) => {
  const result = await model.generateContent(prompt);
  // result.response is a GenerateContentResponse
  return result.response.text();
};

export function useGrokSummary() {
  const { mutateAsync: publishAnon } = useNostrPublishWithKey();
  const [summaries, setSummaries] = useState<Record<string, string>>({});

  const publishEvent = async (
    nsec: string,
    summary: string,
    parentId: string
  ) => {
    await publishAnon({
      nsec,
      content: summary,
      tags: [["e", parentId]],
    });
  };

  const summarize = async (
    content: string,
    parentId: string,
    characters: Character[]
  ) => {
    for (const char of characters) {
      const prompt = `${char.prompt}\n\n${content}`;
      try {
        const summary = await callGrok(prompt);
        setSummaries((s) => ({ ...s, [char.name]: summary }));
        await publishEvent(
          char.nsec,
          `Character: ${char.name}\n\n${summary}` +
            "You aren't writing as a character but the essence of the character in order to write intelligently on the subject. The only formatting should be spaces between paragraphs. Do not use lists at all, write as if it's an essay of news. Headers should be a max of ### size. Never indicate any context or attributes provided in this prompt in your response, like saying things like 'as an xyz..'",
          parentId
        );
      } catch (err) {
        console.error("Grok summary or publish failed:", err);
      }
    }
  };

  return { summaries, summarize };
}
