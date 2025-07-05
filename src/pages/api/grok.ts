// pages/api/grok.ts
// Minimal typings to avoid requiring Next.js types
type NextApiRequest = { body?: Record<string, unknown> };
type NextApiResponse = {
  status: (code: number) => NextApiResponse;
  json: (data: unknown) => void;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { prompt } = req.body as Record<string, string>;
  const key = process.env.XAI_API_KEY;
  if (!key) return res.status(500).json({ error: "Key not configured" });

  const r = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "grok-3-latest",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.9,
      stream: false,
    }),
  });
  if (!r.ok) {
    const err = await r.text();
    return res.status(r.status).json({ error: err });
  }
  const data = await r.json();
  res.status(200).json(data);
}
