# Minerva Application Companion

A free, open-source web application that helps prospective students prepare for the [Minerva University](https://www.minerva.edu) admissions process. Built by a current Minerva student.

**Live**: https://minerva-app-v3.vercel.app

## Features

Nine pages covering the full application journey:

- **Guide** — overview, brainstorming prompts, and a 16-item readiness checklist (saved locally)
- **Timeline** — live countdowns to all four application deadlines (EA1, EA2, RD1, RD2) with month-by-month prep guidance
- **Practice** — five interactive challenge types (Pattern Recognition, Lateral Thinking, Creative Problem Solving with 3-min timer, Data Interpretation, Argument Analysis), with streamed Claude feedback on free-response answers
- **Essays** — story-mining wizard, 3-format structure builder with live word-balance meter, and a self-review checklist
- **Essay Feedback** — paste a draft (up to 10,000 chars) and get streamed Claude feedback across five categories with scores, strengths, and improvements
- **Interview** — four AI mock-interview modes (Behavioral, Creative, Motivation, Rapid-Fire) with full session history saved locally
- **Video Interview** — record a video answer; client-side MediaPipe pose tracking, on-device speech recognition, and filler-word detection feed into a streamed Claude analysis with delivery + content scores
- **Simulator** — five-step readiness assessment across 20 questions with category-by-category feedback and an actionable next-steps plan
- **Resources** — searchable curated link collection (official Minerva URLs, video resources, parent/guardian guides, city info)

## Stack

- **Next.js 16** (App Router) + **React 19**
- **Tailwind CSS v4**
- **`@anthropic-ai/sdk`** for streaming Claude responses on four API routes (`/api/essay-feedback`, `/api/interview`, `/api/challenge-eval`, `/api/interview-review`)
- **`@mediapipe/tasks-vision`** for client-side pose detection on the Video Interview page
- Browser **Web Speech API** for client-side transcription
- All persistent state in `localStorage` / `sessionStorage` — no database, no auth

## Local development

```bash
npm install
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local
npm run dev
```

Open http://localhost:3000.

## Deploy

Production runs on Vercel. From the repo root:

```bash
vercel link               # one-time
vercel env add ANTHROPIC_API_KEY production
vercel --prod
```

The `ANTHROPIC_API_KEY` environment variable is required in the Vercel project for any of the AI-powered routes to work. Public traffic hits the production alias; deployment-protection must be set to `none` for `.vercel.app` URLs to be reachable without Vercel SSO.

## Disclaimer

This is an independent student project. It is not affiliated with, endorsed by, or operated by Minerva University.
