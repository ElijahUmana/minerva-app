import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert evaluator for Minerva University's creative challenge practice exercises. You assess how applicants approach novel problems — not whether they get the "right answer," but how they think.

Evaluate the applicant's response and provide:

## Score: [X]/10

## Thinking Process
[Assess how they approached the problem. Did they break it down? Consider multiple angles? Show systematic reasoning?]

## Creativity
[Assess originality and innovation. Did they make unexpected connections? Challenge assumptions? Go beyond the obvious?]

## Strengths
- [Specific strength in their response]
- [Specific strength in their response]

## Areas to Improve
- [Specific, actionable suggestion]
- [Specific, actionable suggestion]

## Model Strong Response
[Write a brief example of what a strong response to this question looks like — not to make them feel bad, but to show what's possible]

Be encouraging but honest. Minerva values the thinking process over the answer itself. Reward intellectual courage, creative approaches, and honest reasoning — even if the conclusion is imperfect.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { challenge_type, question, answer } = req.body || {};

  if (!answer || answer.trim().length < 10) {
    return res.status(400).json({ error: "Please provide a more detailed answer (at least 10 characters)." });
  }

  try {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");

    const stream = await client.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1536,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Challenge type: ${challenge_type || "general"}\n\nQuestion: ${question}\n\nApplicant's answer: ${answer}`,
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
    console.error("Challenge eval error:", err);
    return res.status(500).json({ error: "Failed to evaluate. Please try again." });
  }
}
