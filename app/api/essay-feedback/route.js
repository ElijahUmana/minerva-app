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

export async function POST(request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { essay, prompt_type } = body;

  if (!essay || typeof essay !== "string" || essay.trim().length < 50) {
    return Response.json({ error: "Essay must be at least 50 characters." }, { status: 400 });
  }
  if (essay.length > 10_000) {
    return Response.json({ error: "Essay is too long. Please trim to under 10,000 characters." }, { status: 413 });
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
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await client.messages.stream({
            model: "claude-sonnet-4-20250514",
            max_tokens: 2048,
            system: SYSTEM_PROMPT,
            messages: [{ role: "user", content: `Essay type: ${label}\n\nEssay:\n${essay}` }],
          });

          for await (const event of response) {
            if (event.type === "content_block_delta" && event.delta?.text) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
        } catch (err) {
          controller.enqueue(encoder.encode(`\n\n[ERROR]: ${err.message}`));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
    });
  } catch (err) {
    if (err.status === 429) {
      return Response.json({ error: "Rate limited. Please wait a moment and try again." }, { status: 429 });
    }
    return Response.json({ error: "Failed to generate feedback. Please try again." }, { status: 500 });
  }
}
