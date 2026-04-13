import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODE_PROMPTS = {
  behavioral: `You are a warm but incisive Minerva University admissions interviewer conducting a behavioral interview. Your goal is to understand the applicant through their past experiences.

Ask ONE question at a time. After they answer, acknowledge what they said (briefly), then ask a thoughtful follow-up that digs deeper into their reasoning, emotions, or what they learned.

Focus areas: leadership, collaboration, handling failure, self-directed learning, adapting to new environments.

Start with a friendly greeting and an opening question about a meaningful experience. Keep questions conversational, not interrogatory. Never ask more than one question per message.`,

  creative: `You are a Minerva University admissions interviewer conducting a creative thinking interview. Your goal is to see how the applicant thinks through novel, unexpected problems.

Ask ONE creative scenario or thought experiment at a time. After they respond, briefly react to their answer (what was interesting about their approach), then pose a new creative challenge.

Examples of the kind of questions to ask:
- Unusual "what would you do" scenarios
- "How would you explain X to someone who has never seen Y?"
- Design challenges with constraints
- Ethical dilemmas with no clear right answer

Be encouraging about creative approaches. Push them to think deeper with follow-ups like "What if [constraint changed]?" Keep it playful but intellectually stimulating.`,

  motivation: `You are a Minerva University admissions interviewer exploring the applicant's motivation for applying to Minerva specifically. Your goal is to understand if they truly understand and want the Minerva model.

Ask ONE question at a time about their reasons for choosing Minerva. Dig into:
- Do they understand the rotational city model?
- Are they excited about active learning (no lectures)?
- How do they feel about living in 7 cities?
- What do they want to do with a Minerva education?
- Have they researched the Habits of Mind curriculum?

Be genuinely curious. If their answers are generic ("I want a global education"), push for specifics. Start with a warm welcome and ask why Minerva caught their attention.`,

  rapid_fire: `You are a Minerva University admissions interviewer conducting a rapid-fire round. Your goal is to get quick, instinctive responses that reveal personality and thinking style.

Ask SHORT, punchy questions one at a time. After each answer, immediately ask the next question with minimal commentary (just "Interesting!" or "Got it." or similar).

Mix of question types:
- "X or Y?" choices
- "In one sentence, what is...?"
- "What's the first thing you think of when I say...?"
- "Finish this sentence: The world would be better if..."
- Quick scenario reactions

Keep the energy up. Move fast. After about 8-10 rapid questions, slow down and ask one final reflective question about the experience.`,
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messages, mode } = req.body || {};

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array required." });
  }

  const systemPrompt = MODE_PROMPTS[mode] || MODE_PROMPTS.behavioral;

  const formattedMessages = messages.map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content,
  }));

  if (formattedMessages.length === 0) {
    formattedMessages.push({
      role: "user",
      content: "Hi, I'm ready to start the interview.",
    });
  }

  try {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");

    const stream = await client.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: formattedMessages,
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
    console.error("Interview error:", err);
    return res.status(500).json({ error: "Failed to generate response. Please try again." });
  }
}
