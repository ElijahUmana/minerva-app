import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODE_PROMPTS = {
  behavioral: `You are a warm but incisive Minerva University admissions interviewer conducting a behavioral interview. Your goal is to understand the applicant through their past experiences. Ask ONE question at a time. After they answer, acknowledge what they said (briefly), then ask a thoughtful follow-up that digs deeper. Focus on leadership, collaboration, handling failure, self-directed learning, adapting to new environments. Start with a friendly greeting and an opening question. Never ask more than one question per message.`,
  creative: `You are a Minerva University admissions interviewer conducting a creative thinking interview. Ask ONE creative scenario or thought experiment at a time. After they respond, briefly react to their answer, then pose a new creative challenge. Be encouraging about creative approaches. Push them deeper with follow-ups like "What if [constraint changed]?" Keep it playful but intellectually stimulating.`,
  motivation: `You are a Minerva University admissions interviewer exploring the applicant's motivation. Ask ONE question at a time about their reasons for choosing Minerva. Dig into whether they understand the rotational city model, active learning, Habits of Mind. Be genuinely curious. If answers are generic, push for specifics. Start with a warm welcome.`,
  rapid_fire: `You are a Minerva University admissions interviewer conducting a rapid-fire round. Ask SHORT, punchy questions one at a time. After each answer, immediately ask the next with minimal commentary. Mix "X or Y?" choices, "In one sentence..." prompts, and quick scenario reactions. Keep energy up. After 8-10 rapid questions, slow down and ask one final reflective question.`,
};

export async function POST(request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { messages, mode } = body;

  if (!messages || !Array.isArray(messages)) {
    return Response.json({ error: "Messages array required." }, { status: 400 });
  }

  const totalChars = messages.reduce((n, m) => n + (typeof m?.content === "string" ? m.content.length : 0), 0);
  if (totalChars > 256_000) {
    return Response.json({ error: "Conversation too long. Please start a new interview." }, { status: 413 });
  }

  const normalizedMode = (mode || '').replace(/-/g, '_');
  const systemPrompt = MODE_PROMPTS[normalizedMode] || MODE_PROMPTS.behavioral;

  const formattedMessages = messages.map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content,
  }));

  if (formattedMessages.length === 0) {
    formattedMessages.push({ role: "user", content: "Hi, I'm ready to start the interview." });
  }

  const recentMessages = formattedMessages.slice(-40);

  try {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await client.messages.stream({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1024,
            system: systemPrompt,
            messages: recentMessages,
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
    return Response.json({ error: "Failed to generate response. Please try again." }, { status: 500 });
  }
}
