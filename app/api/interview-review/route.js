import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an experienced Minerva University interview coach reviewing a video-recorded practice interview response. You have access to the applicant's spoken transcript AND quantitative delivery metrics from computer vision and audio analysis.

Your feedback must be specific, actionable, and grounded in evidence from the transcript. Quote exact phrases the applicant used. Never be generic. Your tone is that of a supportive but honest mentor — someone who genuinely wants this person to improve.

Structure your response EXACTLY in this markdown format:

## Overall Score: [X]/100

[One sentence summary tying together content quality and delivery metrics.]

## Answer Quality

### Relevance: [X]/10
[Did they actually answer the question asked? Did they stay on topic or drift? Quote a specific phrase.]

### Depth & Specificity: [X]/10
[Did they give concrete examples, specific details, real stories? Or was it vague? Quote what was strong or weak.]

### Structure: [X]/10
[Was there a clear opening, development, conclusion? Or did they ramble? Note natural framework usage like STAR.]

### Minerva Alignment: [X]/10
[Does the answer reveal qualities Minerva values: intellectual curiosity, creative problem-solving, self-directed learning, global perspective, resilience, collaborative spirit?]

## Delivery Analysis

[For each metric provided, interpret what it means and give specific advice. If a metric is missing because speech recognition was unavailable, skip that section gracefully without mentioning the absence.]

### Posture
[Interpret the score. Strong posture: shoulders level, slight forward lean showing engagement, head centered. If weak, give camera-specific advice.]

### Eye Contact
[Interpret the percentage. On video, looking at the camera lens reads as eye contact. If low, give concrete advice — sticky note near the lens, raising the camera to eye level, etc.]

### Speaking Pace
[Interpret WPM against ideal 130-160 range. Too fast suggests nervousness; too slow loses the interviewer.]

### Filler Words
[Calculate density yourself. Some fillers are natural. If excessive, suggest "pause instead of fill" technique.]

## Top 3 Specific Tips

1. **[Short tip title]**: [Concrete, actionable advice tied to something specific in their response.]
2. **[Short tip title]**: [Another specific tip.]
3. **[Short tip title]**: [Another specific tip.]

## Suggested Stronger Response Framework

[Outline a 3-4 sentence skeleton of how a standout candidate might structure their answer to THIS specific question. Not a full script — a framework they can fill with their own stories.]

IMPORTANT RULES:
- Always quote the applicant's actual words when giving feedback
- If the transcript is very short or seems incomplete, note this gently and work with what you have
- The overall score should roughly align with the weighted delivery metrics but also factor in content quality
- Be culturally sensitive — the applicant may be a non-native English speaker
- Never be condescending. This is practice — the whole point is to improve
- If specific delivery metrics are absent, omit those subsections entirely`;

export async function POST(request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { question, transcript, metrics } = body;

  if (!transcript || transcript.trim().length < 10) {
    return Response.json({ error: "Transcript too short for meaningful analysis." }, { status: 400 });
  }

  const totalWords = (metrics && typeof metrics.total_words === "number")
    ? metrics.total_words
    : transcript.trim().split(/\s+/).filter(Boolean).length;

  let metricsText = "";
  if (metrics) {
    const lines = [];
    if (typeof metrics.duration_sec === "number") {
      lines.push(`- Recording duration: ${metrics.duration_sec} seconds`);
    }
    lines.push(`- Total words spoken: ${totalWords}`);
    if (typeof metrics.posture_avg === "number") {
      lines.push(`- Average posture score: ${metrics.posture_avg}/100`);
    }
    if (typeof metrics.eye_contact_pct === "number") {
      lines.push(`- Eye contact maintained: ${metrics.eye_contact_pct}% of the time`);
    }
    if (typeof metrics.filler_count === "number") {
      const per100 = totalWords > 0 ? ((metrics.filler_count / totalWords) * 100).toFixed(1) : "0.0";
      lines.push(`- Filler words detected: ${metrics.filler_count} (${per100} per 100 words)`);
    }
    if (typeof metrics.wpm_avg === "number" && metrics.wpm_avg > 0) {
      lines.push(`- Average speaking pace: ${metrics.wpm_avg} words per minute (ideal range: 130-160 WPM)`);
    }
    if (lines.length) {
      metricsText = `\n\nDelivery Metrics (from computer vision and audio analysis):\n${lines.join("\n")}`;
    }
  }

  const lengthAdvisory = transcript.trim().length < 50
    ? "\n\nNOTE: The transcript is very short. Encourage the applicant to elaborate further with concrete examples and personal reflection."
    : "";

  const userMessage = `Interview Question: "${question}"

Transcript of the applicant's spoken response:
---
${transcript}
---${metricsText}${lengthAdvisory}`;

  try {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await client.messages.stream({
            model: "claude-sonnet-4-20250514",
            max_tokens: 2048,
            system: SYSTEM_PROMPT,
            messages: [{ role: "user", content: userMessage }],
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
    return Response.json({ error: "Failed to analyze. Please try again." }, { status: 500 });
  }
}
