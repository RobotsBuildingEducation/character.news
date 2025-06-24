import { useState } from "react";
import { HISTORIAN_NSEC } from "@/constants";
import { useNostrPublishWithKey } from "./useNostrPublishWithKey";
import { model } from "@/lib/firebaseResources";

const callGrok = async (prompt: string) => {
  const result = await model.generateContent(prompt);
  // result.response is a GenerateContentResponse
  return result.response.text();
};

export function useGrokSummary() {
  const { mutateAsync: publishAnon } = useNostrPublishWithKey();
  const [historian, setHistorian] = useState("");

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

  const summarize = async (content: string, parentId: string) => {
    const prompt =
      `Give information and educational background before discussing the current state of affairs. Additionally, offer frequent debates related to the matter and forms of propaganda that may be flourishing as a result of it. Make it expository and connect the dots for the audience to process further. Context:` +
      "\n\n" +
      content;

    // const controller = new AbortController();
    // const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const his = await callGrok(prompt);
      setHistorian(his);
      await publishEvent(
        HISTORIAN_NSEC,
        `Character: Historian\n\n${his}`,
        parentId
      );
    } catch (err) {
      console.error("Grok summary or publish failed:", err);
    } finally {
      // clearTimeout(timeout);
    }
  };

  return { historian, summarize };
}
