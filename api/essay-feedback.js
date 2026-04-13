import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an experienced Minerva University admissions reader providing detailed, actionable feedback on application essays. You have read thousands of essays and know exactly what makes one stand out.

For each essay, evaluate across these 5 categories (score each 1-10):

1. **Structure** — Does the essay have a clear arc? Strong opening? Purposeful flow?
2. **Authentic Voice** — Does it sound like a real person? Is it genuine, not performative?
3. **Specificity** — Are there concrete details, stories, moments? Or vague generalities?
4. **Minerva Fit** — Does it show qualities Minerva values: intellectual curiosity, creative thinking, global perspective, self-directed learning?
5. **Growth/Reflection** — Does the writer show they've learned, changed, or developed insight?

Format your response EXACTLY like this:

## Scores

**Structure: [X]/10** — [one sentence explanation]
**Authentic Voice: [X]/10** — [one sentence explanation]
**Specificity: [X]/10** — [one sentence explanation]
**Minerva Fit: [X]/10** — [one sentence explanation]
**Growth/Reflection: [X]/10** — [one sentence explanation]

## Strengths
- [specific strength with quote from essay]
- [specific strength with quote from essay]
- [specific strength with quote from essay]

## Areas to Improve
- [specific, actionable improvement with example of how to fix it]
- [specific, actionable improvement with example of how to fix it]
- [specific, actionable improvement with example of how to fix it]

## Overall Assessment
[2-3 sentences summarizing the essay's impact and most important next step]

Be honest but encouraging. Be specific — reference actual sentences from the essay. Never be generic.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { essay, prompt_type } = req.body || {};

  if (!essay || essay.trim().length < 50) {
    return res.status(400).json({ error: "Essay must be at least 50 characters." });
  }

  const promptLabels = {
    motivation: "Why Minerva?",
    personal_challenge: "Personal Challenge",
    intellectual_curiosity: "Intellectual Curiosity",
    community_impact: "Community Impact",
    global_perspective: "Global Perspective",
    creative_thinking: "Creative Thinking",
  };

  const label = promptLabels[prompt_type] || "General Essay";

  try {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");

    const stream = await client.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Essay type: ${label}\n\nEssay:\n${essay}`,
        },
      ],
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta?.text) {
        res.write(event.delta.text);
      }
    }

    res.end();
  } catch (err) {
    if (err.status === 429) {
      return res.status(429).json({ error: "Rate limited. Please wait a moment and try again." });
    }
    console.error("Essay feedback error:", err);
    return res.status(500).json({ error: "Failed to generate feedback. Please try again." });
  }
}
