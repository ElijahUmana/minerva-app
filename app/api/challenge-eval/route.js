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

Be encouraging but honest. Minerva values the thinking process over the answer itself.`;

export async function POST(request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { challenge_type, question, answer } = body;

  if (!answer || typeof answer !== "string" || answer.trim().length < 10) {
    return Response.json({ error: "Please provide a more detailed answer (at least 10 characters)." }, { status: 400 });
  }
  if (answer.length > 10_000) {
    return Response.json({ error: "Answer is too long. Please trim to under 10,000 characters." }, { status: 413 });
  }
  if (typeof question === "string" && question.length > 4_000) {
    return Response.json({ error: "Question payload too large." }, { status: 413 });
  }

  try {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await client.messages.stream({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1536,
            system: SYSTEM_PROMPT,
            messages: [{ role: "user", content: `Challenge type: ${challenge_type || "general"}\n\nQuestion: ${question}\n\nApplicant's answer: ${answer}` }],
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
    return Response.json({ error: "Failed to evaluate. Please try again." }, { status: 500 });
  }
}
