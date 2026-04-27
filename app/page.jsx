'use client';

import { useCallback, useEffect, useState } from 'react';

const PROMPTS = [
  { text: "What's a problem in your community that most people have accepted as 'just the way things are'?", hint: "Minerva values people who question the status quo. Think about something you noticed that others overlooked." },
  { text: "Describe a time you changed your mind about something important. What caused the shift?", hint: "This shows intellectual humility and growth — two things Minerva prizes above almost everything else." },
  { text: "What's something you taught yourself, and why?", hint: "Self-directed learning is core to the Minerva experience. Show your curiosity and initiative." },
  { text: "Tell a story about a failure that taught you something you couldn't have learned from success.", hint: "Minerva wants to see how you handle setbacks. The lesson matters more than the failure." },
  { text: "If you could spend a year in any city in the world working on one project, what would it be and why?", hint: "This connects directly to Minerva's rotational model. Show how place shapes your thinking." },
  { text: "What's an idea from one field that you've applied to a completely different field?", hint: "Interdisciplinary thinking is baked into Minerva's curriculum. Show you already think this way." },
  { text: "Who has influenced how you think (not what you think), and how?", hint: "This reveals your intellectual influences and self-awareness about your own thinking process." },
  { text: "What's a question you've been thinking about for a long time that you still can't fully answer?", hint: "Living with open questions shows intellectual maturity. Minerva doesn't expect you to have everything figured out." },
  { text: "Describe a time you had to work with someone whose perspective was fundamentally different from yours.", hint: "At Minerva, you'll live and learn with people from 90+ countries. This shows you're ready for that." },
  { text: "What would you do with four years of access to seven different cities and a cohort of diverse thinkers?", hint: "Be specific. Don't just say 'explore cultures.' What projects, research, or initiatives would you pursue?" },
  { text: "What's something you're genuinely curious about that has nothing to do with your intended major?", hint: "Minerva values intellectual breadth. Your interests outside your main field reveal how you think." },
  { text: "If you had to explain the most important thing you've learned in your life in under 60 seconds, what would you say?", hint: "Conciseness and clarity are skills Minerva develops. This is practice for being precise with ideas." },
];

const CHECKLIST = [
  { id: 'c1', label: "Research Minerva's curriculum and Habits of Mind" },
  { id: 'c2', label: 'Create applicant account at apply.minerva.edu' },
  { id: 'c3', label: 'Fill in personal information and contact details' },
  { id: 'c4', label: 'Self-report academic history and grades' },
  { id: 'c5', label: 'List extracurricular activities and achievements' },
  { id: 'c6', label: 'Brainstorm ideas for short-answer responses' },
  { id: 'c7', label: 'Write first draft of short-answer responses' },
  { id: 'c8', label: 'Revise responses — have someone you trust read them' },
  { id: 'c9', label: 'Finalize short-answer responses' },
  { id: 'c10', label: 'Practice creative thinking exercises (puzzles, brain teasers)' },
  { id: 'c11', label: 'Complete the creative challenges (timed — find a quiet space)' },
  { id: 'c12', label: 'Review entire application for errors or gaps' },
  { id: 'c13', label: 'Submit your application' },
  { id: 'c14', label: 'Sign up for an admissions interview (optional but recommended)' },
  { id: 'c15', label: 'Prepare for interview — think about questions to ask THEM' },
  { id: 'c16', label: 'Explore financial aid options and scholarship deadlines' },
];

const FAQS = [
  {
    q: 'Is Minerva a "real" university?',
    a: "Yes. Minerva University is accredited and grants bachelor's degrees. It was initially part of the Keck Graduate Institute (KGI) system and is now an independent, accredited institution. Graduates work at places like Google, McKinsey, NASA, and pursue graduate studies at Stanford, MIT, Oxford, etc. The degree is recognized worldwide.",
  },
  {
    q: 'Is it all online?',
    a: 'No. The classes happen on a live video platform (the Active Learning Forum), but you physically live with your cohort in a different city each semester. You eat together, explore together, do projects in the city together. The Forum replaces the lecture hall, not the college experience. Think of it as: the classroom is digital, but the campus is the world.',
  },
  {
    q: 'How hard is it to get in?',
    a: 'Minerva is highly selective, with acceptance rates historically around 1-2%. But "selective" doesn\'t mean "elitist." The application is free, doesn\'t require standardized tests, and is designed to identify potential regardless of background. If you\'re intellectually curious and can demonstrate creative thinking, you have a real shot regardless of where you\'re from.',
  },
  {
    q: 'Can I study what I want?',
    a: 'Minerva offers five concentrations: Arts & Humanities, Business, Computational Sciences, Natural Sciences, and Social Sciences. Your first year is a shared foundation (the "cornerstone" courses). From year two onward, you specialize. Many students double-concentrate. The curriculum emphasizes transferable skills that work across fields.',
  },
  {
    q: "What if I don't speak multiple languages?",
    a: "All instruction is in English. You don't need to speak the local language of each rotation city, though many students pick up basics. Minerva provides support for navigating each city. Being multilingual is a plus but absolutely not a requirement.",
  },
  {
    q: 'Do I need amazing grades or test scores?',
    a: "You need to demonstrate academic capability, but Minerva doesn't use GPA cutoffs or standardized test scores. Strong grades help, but they're not the deciding factor. The creative challenges and your responses reveal more about your potential than any transcript. Many admitted students come from non-traditional educational backgrounds.",
  },
  {
    q: "What's the social life like?",
    a: 'You live in shared housing with your cohort in every city. Your classmates become very close friends because you\'re literally navigating new cities together every semester. There\'s no traditional "campus life" with Greek life or football games, but there are student clubs, city exploration, and a tight-knit community. Most students describe Minerva as having the strongest community they\'ve ever been part of.',
  },
  {
    q: 'Should I use AI to write my application?',
    a: "No. Minerva's admissions team can detect AI-generated writing, and using it undermines the entire point of the application — to understand how YOU think. Use AI to brainstorm, organize your thoughts, or check grammar if you want, but the ideas and voice must be genuinely yours. Authenticity is the single most important quality in your application.",
  },
];

export default function GuidePage() {
  const [openFaqs, setOpenFaqs] = useState(() => new Set());
  const [checked, setChecked] = useState({});
  const [promptIdx, setPromptIdx] = useState(0);
  const [notes, setNotes] = useState('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const c = JSON.parse(localStorage.getItem('minerva-checklist') || '{}');
      setChecked(c);
      setNotes(localStorage.getItem('minerva-brainstorm') || '');
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem('minerva-checklist', JSON.stringify(checked));
  }, [checked, hydrated]);

  useEffect(() => {
    if (hydrated) localStorage.setItem('minerva-brainstorm', notes);
  }, [notes, hydrated]);

  const toggleFaq = useCallback((idx) => {
    setOpenFaqs((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  const toggleCheck = useCallback((id) => {
    setChecked((c) => ({ ...c, [id]: !c[id] }));
  }, []);

  const prevPrompt = () => setPromptIdx((i) => (i - 1 + PROMPTS.length) % PROMPTS.length);
  const nextPrompt = () => setPromptIdx((i) => (i + 1) % PROMPTS.length);

  const total = CHECKLIST.length;
  const done = CHECKLIST.filter((i) => checked[i.id]).length;
  const pct = (done / total) * 100;

  const onKey = (handler) => (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handler();
    }
  };

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>
            Your Complete Guide to<br />Applying to <span>Minerva University</span>
          </h1>
          <p>
            Everything you need to know about the application process, from a current Minerva student. Step-by-step guidance, challenge preparation, essay tips, and an interactive checklist to keep you on track.
          </p>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="num">7</span>
              <span className="label">Cities in 4 Years</span>
            </div>
            <div className="hero-stat">
              <span className="num">~20</span>
              <span className="label">Students per Class</span>
            </div>
            <div className="hero-stat">
              <span className="num">100%</span>
              <span className="label">Seminar-Based Learning</span>
            </div>
            <div className="hero-stat">
              <span className="num">0</span>
              <span className="label">Standardized Tests Required</span>
            </div>
          </div>
        </div>
      </section>

      <section id="why">
        <div className="container">
          <span className="section-label">Understanding Minerva</span>
          <h2 className="section-title">Why Minerva Is Different</h2>
          <p className="section-subtitle">
            Before you apply, understand what makes Minerva unlike any other university. This isn&apos;t just a different school — it&apos;s a fundamentally different model of higher education.
          </p>

          <div className="card-grid">
            <div className="card">
              <div className="card-icon red" aria-hidden="true">{'\u{1F30E}'}</div>
              <h3>Global Immersion, Not Study Abroad</h3>
              <p>
                You don&apos;t visit other countries — you live in them. Over four years, you rotate through cities including San Francisco, Seoul, Hyderabad, Berlin, Buenos Aires, London, and Taipei. Each semester is a new city with real-world projects embedded in that context.
              </p>
            </div>
            <div className="card">
              <div className="card-icon blue" aria-hidden="true">{'\u{1F4AC}'}</div>
              <h3>Active Learning Forum</h3>
              <p>
                There are zero lectures. Every class is a live, fully interactive seminar capped at ~20 students on Minerva&apos;s custom platform. Professors cold-call, run polls, facilitate debates, and give real-time feedback. You&apos;re expected to participate in every single class.
              </p>
            </div>
            <div className="card">
              <div className="card-icon green" aria-hidden="true">{'\u{1F9E0}'}</div>
              <h3>Habits of Mind &amp; Foundational Concepts</h3>
              <p>
                Minerva&apos;s curriculum is built around transferable thinking skills, not memorization. In your first year you learn ~120 &ldquo;Habits of Mind&rdquo; across four cornerstone courses: formal analyses, empirical analyses, complex systems, and multimodal communications.
              </p>
            </div>
            <div className="card">
              <div className="card-icon purple" aria-hidden="true">{'\u{1F3AF}'}</div>
              <h3>Admissions: Potential Over Privilege</h3>
              <p>
                No SAT/ACT, no legacy preference, no &ldquo;demonstrated interest.&rdquo; Minerva evaluates your intellectual curiosity, creative problem-solving, and capacity for growth. The application is designed so that your socioeconomic background cannot advantage or disadvantage you.
              </p>
            </div>
          </div>

          <div className="insight-box">
            <h4>Current Student Perspective</h4>
            <p>
              The biggest misconception applicants have is thinking Minerva is &ldquo;just online school.&rdquo; It&apos;s not. You&apos;re physically together with your cohort in a new city every semester, taking classes together on the Forum, and doing location-based assignments. The Forum is the classroom — the city is the campus.
            </p>
          </div>
        </div>
      </section>

      <section id="process" className="alt-bg">
        <div className="container">
          <span className="section-label">Application Process</span>
          <h2 className="section-title">Step by Step: How to Apply</h2>
          <p className="section-subtitle">
            Minerva&apos;s application is free and designed to be completed in stages. There is no application fee, and no standardized test scores are required.
          </p>

          <div className="steps">
            <div className="step-item">
              <div className="step-num">1</div>
              <div className="step-content">
                <h3>Create Your Account</h3>
                <p>
                  Go to <strong>apply.minerva.edu</strong> and create your applicant account. You&apos;ll use this to complete your application over time — you don&apos;t have to finish it in one sitting. Start early so you have time to reflect on your responses.
                </p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-num">2</div>
              <div className="step-content">
                <h3>Personal Information &amp; Academic History</h3>
                <p>
                  Fill in your background, schooling, and extracurricular activities. You&apos;ll self-report your grades — official transcripts are only needed after admission. There&apos;s no place to enter SAT/ACT scores because they&apos;re not considered.
                </p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-num">3</div>
              <div className="step-content">
                <h3>Short-Answer Responses</h3>
                <p>
                  These are your chance to show who you are beyond academics. Minerva asks about your motivations, experiences, and how you think. Be genuine and specific — they read every word, and they can tell the difference between authentic reflection and polished performance.
                </p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-num">4</div>
              <div className="step-content">
                <h3>Creative Challenges</h3>
                <p>
                  This is Minerva&apos;s signature. You&apos;ll complete timed, interactive challenges that test how you think, not what you know. These are designed to be novel — you cannot study for them in the traditional sense. They assess creative thinking, logical reasoning, and how you approach unfamiliar problems.
                </p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-num">5</div>
              <div className="step-content">
                <h3>Submit &amp; (Optionally) Interview</h3>
                <p>
                  Review everything, submit, and optionally sign up for an admissions interview. The interview is a genuine conversation, not a test. It&apos;s your chance to ask questions and for the admissions team to understand your thinking style in real time.
                </p>
              </div>
            </div>
          </div>

          <div className="tip-box">
            <h4>Timing Tip</h4>
            <p>
              Apply in the earliest round you can. Minerva has rolling admissions with multiple rounds (typically Early Action in November, Regular rounds through Spring). Earlier rounds aren&apos;t &ldquo;easier,&rdquo; but they give you more time to hear back and consider financial aid packages.
            </p>
          </div>
        </div>
      </section>

      <section id="challenges">
        <div className="container">
          <span className="section-label">Challenge Preparation</span>
          <h2 className="section-title">How to Approach the Creative Challenges</h2>
          <p className="section-subtitle">
            Minerva&apos;s challenges are unlike anything on a standardized test. You can&apos;t &ldquo;prep&rdquo; for them in the traditional sense, but you can develop the right mindset.
          </p>

          <div className="card-grid">
            <div className="card">
              <div className="card-icon red" aria-hidden="true">{'\u{1F4A1}'}</div>
              <h3>Think Process, Not Answer</h3>
              <p>
                The challenges care about HOW you think, not whether you get the &ldquo;right&rdquo; answer. Show your reasoning. If you&apos;re unsure, explain your logic rather than guessing. Minerva values intellectual honesty over polish.
              </p>
            </div>
            <div className="card">
              <div className="card-icon blue" aria-hidden="true">{'\u{1F551}'}</div>
              <h3>Manage Your Time</h3>
              <p>
                Challenges are timed. Don&apos;t panic — the time limits are designed to prevent overthinking, not to trick you. Read each prompt carefully once, formulate your approach, then execute. It&apos;s better to give a clear, concise answer than to ramble.
              </p>
            </div>
            <div className="card">
              <div className="card-icon green" aria-hidden="true">{'\u{1F914}'}</div>
              <h3>Embrace the Unfamiliar</h3>
              <p>
                You WILL encounter problems unlike anything you&apos;ve seen before. That&apos;s the point. Minerva wants to see how you handle novelty. Stay calm, break the problem into parts, and think out loud (or in writing). Your comfort with discomfort is what they&apos;re evaluating.
              </p>
            </div>
            <div className="card">
              <div className="card-icon purple" aria-hidden="true">{'\u{1F3A8}'}</div>
              <h3>Creative Doesn&apos;t Mean Artsy</h3>
              <p>
                &ldquo;Creative challenges&rdquo; doesn&apos;t mean drawing or music. It means finding novel approaches to problems. Think divergent thinking: how many ways can you look at this? What assumptions can you question? What connections can you draw from different fields?
              </p>
            </div>
          </div>

          <div className="tip-box">
            <h4>Practice Strategy</h4>
            <p>
              While you can&apos;t study specific content, you CAN practice the skills. Try brain teasers, logic puzzles, lateral thinking exercises, or even improvisational games. Read about topics you know nothing about and try to reason through them. The goal is to become comfortable thinking in unfamiliar territory — not to memorize answers.
            </p>
          </div>

          <div className="insight-box">
            <h4>Current Student Perspective</h4>
            <p>
              When I did the challenges, I remember being thrown off by how different they were from any test I&apos;d taken before. The best thing I did was just be honest about my thought process. I didn&apos;t try to sound smart — I just showed how I was actually thinking through each problem. That authenticity matters more than arriving at a &ldquo;perfect&rdquo; answer.
            </p>
          </div>
        </div>
      </section>

      <section id="essays" className="alt-bg">
        <div className="container">
          <span className="section-label">Essay Workshop</span>
          <h2 className="section-title">Writing Responses That Stand Out</h2>
          <p className="section-subtitle">
            Minerva reads thousands of applications. Here&apos;s how to write responses that are genuinely memorable — not because they&apos;re flashy, but because they&apos;re real.
          </p>

          <div className="card-grid" style={{ marginBottom: '2rem' }}>
            <div className="card">
              <h3>Be Specific, Not Grand</h3>
              <p>
                &ldquo;I want to change the world&rdquo; tells them nothing. &ldquo;I spent three months mapping water access points in my district because I noticed classmates missing school during dry season&rdquo; tells them everything. Concrete details &gt; abstract ambitions.
              </p>
            </div>
            <div className="card">
              <h3>Show Growth, Not Perfection</h3>
              <p>
                Minerva values learning over achievement. Write about something you struggled with, got wrong, or changed your mind about. How did you evolve? What did you learn about yourself? Vulnerability is strength here.
              </p>
            </div>
            <div className="card">
              <h3>Connect to Minerva Specifically</h3>
              <p>
                Don&apos;t write a generic &ldquo;why this school&rdquo; response. Research the Habits of Mind, the city rotations, the Active Learning Forum. Reference specific things that excite you. Show that you understand what you&apos;re signing up for and WHY this model fits you.
              </p>
            </div>
            <div className="card">
              <h3>Your Voice, Not a Template</h3>
              <p>
                Admissions officers can spot ChatGPT, essay coaches, and formulaic structures instantly. Write in your actual voice. If you&apos;re funny, be funny. If you&apos;re analytical, be analytical. The worst thing you can do is sound like every other applicant.
              </p>
            </div>
          </div>

          <div className="brainstorm-area">
            <h3 style={{ marginBottom: '1rem' }}>Brainstorming Prompts</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text2)', marginBottom: '1rem' }}>
              Use these prompts to discover stories and angles for your essays. Click through them and jot down whatever comes to mind — don&apos;t filter yourself.
            </p>
            <div className="prompt-carousel" id="prompt-display" aria-live="polite">
              <p id="prompt-text">{PROMPTS[promptIdx].text}</p>
              <p className="prompt-hint" id="prompt-hint">{PROMPTS[promptIdx].hint}</p>
            </div>
            <div className="prompt-nav">
              <button type="button" onClick={prevPrompt} aria-label="Previous prompt">Previous</button>
              <span className="prompt-count" id="prompt-count">{promptIdx + 1} / {PROMPTS.length}</span>
              <button type="button" onClick={nextPrompt} aria-label="Next prompt">Next</button>
            </div>
            <label htmlFor="brainstorm-notes" className="sr-only">
              Brainstorm notes (saved in your browser only)
            </label>
            <textarea
              id="brainstorm-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Jot down your thoughts, stories, memories... anything that comes to mind. This is your private brainstorming space — nothing is saved or sent anywhere."
            />
            <p className="textarea-label">Your notes are saved in your browser only. Nothing leaves this page.</p>
          </div>
        </div>
      </section>

      <section id="checklist">
        <div className="container">
          <span className="section-label">Application Tracker</span>
          <h2 className="section-title">Interactive Application Checklist</h2>
          <p className="section-subtitle">
            Track your progress through each component. Click items to mark them complete. Your progress is saved in your browser.
          </p>

          <div className="card" style={{ padding: '2rem' }}>
            <ul className="checklist" id="checklist-list">
              {CHECKLIST.map(({ id, label }) => {
                const isChecked = !!checked[id];
                return (
                  <li
                    key={id}
                    className={isChecked ? 'checked' : ''}
                    onClick={() => toggleCheck(id)}
                    onKeyDown={onKey(() => toggleCheck(id))}
                    role="checkbox"
                    aria-checked={isChecked}
                    tabIndex={0}
                    data-id={id}
                  >
                    <div className="check-box" aria-hidden="true">{isChecked ? '✓' : ''}</div>
                    {label}
                  </li>
                );
              })}
            </ul>
            <div
              className="checklist-progress"
              role="progressbar"
              aria-valuenow={done}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-label="Application checklist progress"
            >
              <div className="checklist-progress-bar" id="progress-bar" style={{ width: `${pct}%` }} />
            </div>
            <div className="checklist-count" id="progress-text">{done} of {total} complete</div>
          </div>
        </div>
      </section>

      <section id="aid" className="alt-bg">
        <div className="container">
          <span className="section-label">Affordability</span>
          <h2 className="section-title">Financial Aid at Minerva</h2>
          <p className="section-subtitle">
            Minerva is committed to making education accessible. Here&apos;s what you need to know about funding your Minerva education.
          </p>

          <div className="card-grid">
            <div className="card">
              <div className="card-icon green" aria-hidden="true">{'\u{1F4B0}'}</div>
              <h3>Need-Based Aid</h3>
              <p>
                Minerva provides generous need-based financial aid. Over 80% of students receive some form of aid. The financial aid application is separate from the admissions application — applying for aid does NOT affect your admissions decision.
              </p>
            </div>
            <div className="card">
              <div className="card-icon blue" aria-hidden="true">{'\u{1F3E0}'}</div>
              <h3>Lower Cost Structure</h3>
              <p>
                Minerva&apos;s tuition is significantly lower than comparable U.S. institutions. There are no expensive campus facilities to maintain. Housing is arranged through residential partners in each city, and the total cost of attendance is designed to be more accessible.
              </p>
            </div>
            <div className="card">
              <div className="card-icon red" aria-hidden="true">{'\u{1F4C4}'}</div>
              <h3>External Scholarships</h3>
              <p>
                You can apply for external scholarships and grants alongside Minerva&apos;s own aid. Many country-specific and international scholarship programs recognize Minerva. Start researching scholarships relevant to your background early.
              </p>
            </div>
          </div>

          <div className="tip-box">
            <h4>Important</h4>
            <p>
              Don&apos;t let cost stop you from applying. Minerva explicitly states that financial circumstances should never prevent a qualified student from attending. Apply first, discuss finances after admission. The financial aid team works with every admitted student to find a way to make it work.
            </p>
          </div>
        </div>
      </section>

      <section id="faq">
        <div className="container">
          <span className="section-label">Frequently Asked Questions</span>
          <h2 className="section-title">Common Questions, Honest Answers</h2>
          <p className="section-subtitle">
            Questions applicants actually ask, answered from the perspective of a current Minerva student.
          </p>

          <div id="faq-list">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqs.has(idx);
              return (
                <div
                  key={idx}
                  className={`faq-item${isOpen ? ' open' : ''}`}
                  onClick={() => toggleFaq(idx)}
                  onKeyDown={onKey(() => toggleFaq(idx))}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                >
                  <div className="faq-q">
                    {faq.q}
                    <span className="faq-arrow" aria-hidden="true">{'▼'}</span>
                  </div>
                  <div className="faq-a">{faq.a}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="cta-section">
        <div className="container">
          <h2>Ready to Start Your Application?</h2>
          <p>
            The application is free, no standardized tests are required, and you can work on it at your own pace. The hardest part is clicking &ldquo;start.&rdquo;
          </p>
          <a
            href="https://apply.minerva.edu"
            target="_blank"
            rel="noopener noreferrer"
            className="cta-btn"
          >
            Apply to Minerva
          </a>
        </div>
      </div>
    </>
  );
}
