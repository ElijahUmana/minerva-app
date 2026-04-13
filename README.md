# Minerva Application Companion

A comprehensive, multi-page web application to support prospective students in applying to Minerva University. Built by a current Minerva student with insider perspective and practical, actionable guidance across every stage of the application process.

**Live App: [https://minerva-app-ivory.vercel.app](https://minerva-app-ivory.vercel.app)**

Also available at: [https://elijahumana.github.io/minerva-app](https://elijahumana.github.io/minerva-app) (static pages only, no AI features)

## Pages & Features

### [Application Guide](https://elijahumana.github.io/minerva-app/) (index.html)
- What makes Minerva different (global immersion, Active Learning Forum, Habits of Mind, admissions philosophy)
- Step-by-step application walkthrough (5 stages with detailed guidance)
- Challenge preparation strategies with current student perspectives
- Interactive brainstorming prompts (12 prompts with hints)
- 16-item interactive application checklist with progress bar
- Financial aid breakdown (need-based aid, cost structure, external scholarships)
- 8 FAQ questions answered from a student perspective

### [Application Timeline](https://elijahumana.github.io/minerva-app/timeline.html)
- Visual interactive timeline showing all application rounds (EA I, EA II, RD I, RD II)
- Live countdown timer for each round deadline
- Month-by-month preparation calendar (6 months before through post-submission)
- Round-by-round advantages and tips

### [Practice Challenges](https://elijahumana.github.io/minerva-app/practice.html)
- **Pattern Recognition** — 8 increasingly difficult number sequence puzzles with explanations
- **Lateral Thinking** — 6 classic puzzles with self-assessment tracking
- **Creative Problem Solving** — 4 timed open-ended problems (3-min timer) with sample strong responses
- **Data Interpretation** — 3 data table scenarios with analysis questions
- **Argument Analysis** — 4 substantive arguments to identify claims, evidence, and assumptions
- Progress tracker across all 5 challenge types

### [Essay Builder](https://elijahumana.github.io/minerva-app/essays.html)
- **Prompt Analyzer** — 6 common Minerva essay themes decoded (what they're really asking, weak vs. strong patterns)
- **Story Mining Tool** — 4-step guided brainstorming wizard to discover your stories
- **Structure Builder** — fillable essay outlines for narrative, reflective, and problem-solving styles with word counts and balance meter
- **Self-Review Checklist** — 10-item quality criteria with progress tracking
- **Example Breakdowns** — 3 annotated excerpts showing specific techniques

### [Readiness Simulator](https://elijahumana.github.io/minerva-app/simulator.html)
- 5-step interactive self-assessment (20 questions across academic, creative, global, communication, motivation)
- Results dashboard with overall score, category breakdowns, and circular progress indicator
- Personalized strengths, areas to develop, and specific action items per category
- Prioritized action plan based on weakest areas

### [Resources](https://elijahumana.github.io/minerva-app/resources.html)
- Official Minerva links and application portal
- Student life insights with city rotation descriptions (7 cities)
- Academic preparation resources (books, courses, creative thinking tools)
- Community and support (social media, ambassadors, student groups)
- Section for parents and guardians
- Searchable/filterable resource grid

### [AI Essay Feedback](https://minerva-app-ivory.vercel.app/essay-feedback.html) (essay-feedback.html)
- Paste your essay draft and get real AI feedback from Claude
- Scores across 5 categories: Structure, Authentic Voice, Specificity, Minerva Fit, Growth/Reflection
- Specific strengths identified with quotes from your essay
- Actionable improvement suggestions
- Streaming responses for real-time feedback display

### [AI Mock Interview](https://minerva-app-ivory.vercel.app/interview.html) (interview.html)
- Practice admissions interviews with an AI interviewer
- 4 interview modes: Behavioral, Creative, Motivation, Rapid-Fire
- Chat-style interface with streaming responses
- Interview history and session review
- End-of-interview performance summary

### AI Challenge Evaluation (integrated in practice.html)
- Get AI feedback on your creative problem solving and lateral thinking answers
- Scored evaluation with thinking process and creativity assessments
- Strengths, improvements, and model strong responses for comparison

## Tech Stack

- Vanilla HTML5, CSS3, JavaScript (no frameworks)
- Vercel serverless functions (Node.js) for AI API routes
- Anthropic Claude Sonnet 4 for AI features
- Streaming responses for real-time UX
- Responsive design across all pages
- All user data persists in localStorage (checklist progress, essay drafts, simulator results, practice scores, interview history)
- Deployed on Vercel (AI features) + GitHub Pages (static fallback)

## AI Disclosure

This project was developed with AI assistance (Claude Code) for code generation and content structuring. All Minerva-specific information and student perspectives come from the developer's firsthand experience as a current Minerva University student.
