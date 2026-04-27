'use client';

import { useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'minerva-essay-builder';

const PROMPTS = [
  {
    key: 'motivation',
    theme: 'Motivation for Minerva',
    title: 'Why are you drawn to Minerva University? What about our approach to education resonates with you?',
    decode: "Have you done genuine research into how Minerva works, or are you attracted to the surface-level appeal of \"traveling the world\"? They want to see that you understand the pedagogical model -- active learning, the Forum, Cornerstone courses, HCs -- and that it connects to something real in your own learning history.",
    weak: [
      'Listing Minerva features like a brochure ("I love that you learn in 7 cities")',
      'Generic praise that could apply to any innovative school',
      'Focusing entirely on travel and the "experience" without mentioning the academic model',
      'Name-dropping Cornerstone concepts without explaining why they matter to you personally',
    ],
    strong: [
      'Connect a specific Minerva feature to a concrete personal learning experience',
      'Show evidence of genuine research (mentioning specific courses, the Forum structure, or HC methodology)',
      "Demonstrate that you've identified a gap in traditional education that Minerva's model addresses for you specifically",
      'Reflect on how you already learn in ways that align with active learning',
    ],
    elements: [
      'A specific moment where traditional education failed you or where you thrived outside it',
      'Evidence you understand what daily learning at Minerva actually looks like',
      "Your own learning philosophy and why Minerva's model fits it",
      "What you would contribute to the Minerva community, not just what you'd take from it",
    ],
  },
  {
    key: 'challenge',
    theme: 'Personal Challenge',
    title: "Describe a significant challenge you've faced. How did you respond, and what did the experience teach you?",
    decode: 'Minerva students live in a new city every semester, work in unfamiliar teams, and face ambiguity constantly. They want to know: when things got hard, did you crumble, cope, or grow? The emphasis is on the "how" and "what you learned" -- not on how dramatic the challenge was.',
    weak: [
      'Choosing a challenge primarily because it sounds impressive (poverty, war, illness) without genuine personal reflection',
      'Framing yourself as a pure hero who overcame everything alone',
      'Describing the challenge at length but rushing through what you learned',
      'Ending with a generic lesson like "I learned that hard work pays off"',
    ],
    strong: [
      'Show the internal struggle -- doubt, frustration, confusion -- not just the external events',
      'Describe specific actions taken, not vague claims about resilience',
      'Acknowledge mistakes or moments of failure within the larger challenge',
      'Articulate a nuanced lesson that changed how they approach problems going forward',
    ],
    elements: [
      'Concrete details that put the reader in the moment',
      'Your emotional state -- what you felt, not just what you did',
      'A turning point where your thinking or behavior shifted',
      "Evidence that the lesson stuck: how you've applied it since",
    ],
  },
  {
    key: 'curiosity',
    theme: 'Intellectual Curiosity',
    title: 'Tell us about a topic, idea, or question that captivates you. Why does it matter, and how have you explored it?',
    decode: "Minerva's curriculum demands students who are genuinely excited about ideas, not just grades. They want to see how your mind works when you're following your own curiosity -- where you go, how deep you dig, and whether you connect ideas across domains (which is central to the Cornerstone model).",
    weak: [
      'Picking a topic because it sounds "smart" (quantum physics, AI) without genuine depth',
      "Summarizing what you've learned about the topic without showing how you explored it",
      'Treating this as a mini-research-paper instead of a personal intellectual journey',
      "Failing to explain why you personally care -- what's at stake for you",
    ],
    strong: [
      'Show the origin of the curiosity -- a specific moment or question that triggered it',
      'Trace the path of exploration: books, experiments, conversations, projects',
      'Connect the topic to other fields or to personal experience in unexpected ways',
      "Show that the exploration changed the applicant's thinking or led to more questions",
    ],
    elements: [
      'The triggering question or moment that sparked your interest',
      'Specific resources, people, or experiences that deepened your understanding',
      'A connection between this topic and another domain (demonstrating interdisciplinary thinking)',
      'An open question you still have -- showing the curiosity is ongoing',
    ],
  },
  {
    key: 'community',
    theme: 'Community Impact',
    title: 'Describe a time you made a meaningful contribution to a community you belong to. What did you do, and what was the impact?',
    decode: "Minerva's residential model means you're living and learning in tight-knit cohorts across the world. They need students who actively build community, not just benefit from it. They care less about the scale of your impact and more about whether you identified a real need and took initiative without being asked.",
    weak: [
      'Listing volunteer hours or club positions without describing what you actually did',
      'Choosing a community service activity you did for a resume rather than out of genuine care',
      'Focusing on what the community gave you rather than what you gave it',
      'Claiming large-scale impact without evidence ("I changed the lives of hundreds")',
    ],
    strong: [
      'Define "community" in a personal and specific way (it doesn\'t have to be a nonprofit)',
      'Show how you noticed a need that others overlooked',
      'Describe the messy, iterative process of actually making something happen',
      "Measure impact honestly, including what didn't work",
    ],
    elements: [
      'Why this particular community matters to you personally',
      'The specific gap or problem you identified',
      'The concrete steps you took (not just that you "organized" or "led")',
      'Honest reflection on what the experience taught you about working with people',
    ],
  },
  {
    key: 'global',
    theme: 'Global Perspective',
    title: 'Describe an experience that broadened your understanding of the world or exposed you to a perspective very different from your own.',
    decode: "You'll be living in Seoul, Hyderabad, Berlin, Buenos Aires, London, Taipei, and San Francisco. They need to know you can genuinely engage with difference -- not just tolerate it, but learn from it. They're testing for cultural humility and the ability to question your own assumptions.",
    weak: [
      '"I went on a trip abroad and realized we\'re all the same" -- flattening difference',
      'Framing other cultures as exotic or treating people as learning props',
      'Describing the experience without describing how it changed your thinking',
      'Relying on travel when a local experience of difference could be more genuine',
    ],
    strong: [
      'Show a genuine moment of discomfort, confusion, or having an assumption challenged',
      'Demonstrate that you listened and engaged rather than just observed',
      'Articulate what specifically changed in your worldview (not just "I became more open-minded")',
      "The experience doesn't have to involve travel -- encountering difference can happen anywhere",
    ],
    elements: [
      'What you believed or assumed before the experience',
      'The specific moment or interaction that disrupted that assumption',
      'What you learned about the other perspective (show you actually understood it)',
      'How this experience prepared you for living and learning across cultures at Minerva',
    ],
  },
  {
    key: 'creative',
    theme: 'Creative Thinking',
    title: 'Tell us about a time you approached a problem in an unconventional way. What was the problem, and what made your approach different?',
    decode: "Minerva's curriculum explicitly teaches creative and critical thinking through the Habits of Mind and Foundational Concepts. They want students who naturally question default approaches. This isn't about being \"artsy\" -- it's about thinking flexibly, challenging constraints, and combining ideas from different domains.",
    weak: [
      'Describing something creative you made (art, music) without explaining the thinking process',
      'Claiming an idea was unconventional when it was actually fairly standard',
      'Focusing on the outcome without explaining why your approach was different and why you chose it',
      'Being vague about the problem itself, making it hard to appreciate the creativity of the solution',
    ],
    strong: [
      'Clearly define the problem and the conventional approach others were taking',
      'Explain the reasoning behind the unconventional approach (not just what, but why)',
      'Show the process of getting to the creative solution, including dead ends',
      'Reflect on what the experience taught about how they think and solve problems',
    ],
    elements: [
      'The constraint or assumption that others accepted but you questioned',
      'Where your alternative approach came from (analogy from another field, a question, an observation)',
      'The result -- including partial failures or unexpected outcomes',
      "How this way of thinking connects to how you'd engage with Minerva's interdisciplinary curriculum",
    ],
  },
];

const MOMENT_PLACEHOLDERS = [
  'e.g. The day I realized my debate coach was wrong about something fundamental',
  "e.g. Failing a test I'd studied 40 hours for",
  "e.g. A stranger's question that I couldn't answer",
  'e.g. Moving to a place where nobody knew me',
  'e.g. Building something that actually worked on the first try',
];

const ESSAY_TYPES = [
  { key: 'narrative', icon: '✎', name: 'Narrative', desc: 'Story-driven' },
  { key: 'reflective', icon: '\u{1F4A1}', name: 'Reflective', desc: 'Idea-driven' },
  { key: 'problem', icon: '⚙', name: 'Problem-Solving', desc: 'Challenge-driven' },
];

const OUTLINES = {
  narrative: [
    { field: 'hook', category: 'setup', label: 'Hook / Opening Line', hint: 'Drop the reader into the middle of the action', placeholder: 'Start with a specific moment, image, or line of dialogue. Avoid starting with a question or a dictionary definition.' },
    { field: 'context', category: 'setup', label: 'Context / Setup', hint: "Just enough background -- don't over-explain", placeholder: 'Give the reader what they need to understand the story, but no more. 2-3 sentences is often enough.' },
    { field: 'core', category: 'story', label: 'Core Story', hint: 'The main event -- show, don\'t tell', placeholder: 'What happened? Use specific details, dialogue, and sensory language. Let the reader experience it with you.' },
    { field: 'turning', category: 'insight', label: 'Turning Point / Key Insight', hint: 'The moment everything shifted', placeholder: 'What changed in how you saw things? This is the heart of the essay -- spend your best writing here.' },
    { field: 'minerva', category: 'insight', label: 'Connection to Minerva', hint: 'Organic, not forced', placeholder: "How does this story connect to why you belong at Minerva? Be specific about the program, not generic about 'global education.'" },
    { field: 'closing', category: 'insight', label: 'Closing', hint: 'Land the plane -- resonate, don\'t summarize', placeholder: "End with an image, a question, or a forward-looking statement. Don't restate what you've already said." },
  ],
  reflective: [
    { field: 'hook', category: 'setup', label: 'Hook / Opening Line', hint: 'Start with the idea that grips you', placeholder: 'Lead with the question, tension, or paradox that drives your reflection. Make the reader curious.' },
    { field: 'context', category: 'setup', label: 'Context / Setup', hint: 'Where this idea comes from in your life', placeholder: 'Ground the reflection in your experience. Why does this idea matter to you personally, not just intellectually?' },
    { field: 'core', category: 'story', label: 'Core Argument / Exploration', hint: 'Develop the idea with depth and nuance', placeholder: "Build your thinking. Show how you've wrestled with the idea, considered different angles, and deepened your understanding." },
    { field: 'turning', category: 'insight', label: 'Turning Point / Key Insight', hint: 'The realization that changed your framework', placeholder: "Where did your thinking shift? What do you understand now that you didn't before? Be precise." },
    { field: 'minerva', category: 'insight', label: 'Connection to Minerva', hint: 'How this thinking connects to your Minerva journey', placeholder: "What about Minerva's model -- its curriculum, cities, community -- connects to the ideas you've been exploring?" },
    { field: 'closing', category: 'insight', label: 'Closing', hint: 'Leave the reader thinking', placeholder: "End with a question that's still open, a tension you're still navigating, or a commitment you've made." },
  ],
  problem: [
    { field: 'hook', category: 'setup', label: 'Hook / Opening Line', hint: 'Drop the reader into the problem', placeholder: 'Start with the moment you encountered the problem. What was at stake? Why did it matter?' },
    { field: 'context', category: 'setup', label: 'Context / Setup', hint: 'Define the challenge clearly', placeholder: 'What was the problem? Why was it hard? What had others tried? Set up the constraints you were working within.' },
    { field: 'core', category: 'story', label: 'Core Story / Your Approach', hint: 'Show your process, not just the solution', placeholder: 'Walk through how you tackled it. Include dead ends and iterations -- the process reveals more about you than the result.' },
    { field: 'turning', category: 'insight', label: 'Turning Point / Key Insight', hint: 'The breakthrough or the lesson from failure', placeholder: "What was the pivotal moment? Even if the problem wasn't fully solved, what did you learn about how to approach hard problems?" },
    { field: 'minerva', category: 'insight', label: 'Connection to Minerva', hint: 'How this problem-solving mindset fits Minerva', placeholder: "Connect your approach to Minerva's emphasis on applied learning, interdisciplinary thinking, or real-world problem solving." },
    { field: 'closing', category: 'insight', label: 'Closing', hint: "What's next -- where does this lead?", placeholder: "End with where this problem-solving drive is taking you next. What's the bigger question you're now pursuing?" },
  ],
};

const REVIEW_ITEMS = [
  'Is my opening specific and engaging (not generic)?',
  'Do I show growth or change?',
  'Is this authentically MY voice?',
  'Would this essay only work for ME (not any applicant)?',
  'Do I connect to Minerva specifically (not just "global education")?',
  'Am I under the word limit?',
  'Have I avoided cliches ("passion," "changed my life," "think outside the box")?',
  'Did I show, not tell (specific scenes rather than abstract claims)?',
  'Is there a clear "so what" -- what did I learn?',
  'Would I be proud to read this aloud?',
];

function countWords(text) {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

function emptyStructure() {
  const make = () => ({ hook: '', context: '', core: '', turning: '', minerva: '', closing: '' });
  return { narrative: make(), reflective: make(), problem: make() };
}

export default function EssaysPage() {
  const [openPrompts, setOpenPrompts] = useState({});
  const [moments, setMoments] = useState(['', '', '', '', '']);
  const [beliefs, setBeliefs] = useState({});
  const [surprises, setSurprises] = useState([]);
  const [selectedStory, setSelectedStory] = useState(0);
  const [deepen, setDeepen] = useState({ what: '', feel: '', action: '', learn: '', apply: '' });
  const [wizardStep, setWizardStep] = useState(0);
  const [essayType, setEssayType] = useState('narrative');
  const [structure, setStructure] = useState(emptyStructure());
  const [reviewChecked, setReviewChecked] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [saveVisible, setSaveVisible] = useState(false);
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (Array.isArray(data.moments) && data.moments.length === 5) setMoments(data.moments);
        if (data.beliefs && typeof data.beliefs === 'object') setBeliefs(data.beliefs);
        if (Array.isArray(data.surprises)) setSurprises(data.surprises);
        if (typeof data.selectedStory === 'number') setSelectedStory(data.selectedStory);
        if (data.deepen && typeof data.deepen === 'object') {
          setDeepen({ what: '', feel: '', action: '', learn: '', apply: '', ...data.deepen });
        }
        if (typeof data.wizardStep === 'number') setWizardStep(data.wizardStep);
        if (data.essayType) setEssayType(data.essayType);
        if (data.structure) {
          setStructure({ ...emptyStructure(), ...data.structure });
        }
        if (Array.isArray(data.review)) setReviewChecked(data.review);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          moments,
          beliefs,
          surprises,
          selectedStory,
          deepen,
          wizardStep,
          essayType,
          structure,
          review: reviewChecked,
        })
      );
      setSaveVisible(true);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaveVisible(false), 1500);
    } catch {
      /* ignore */
    }
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [moments, beliefs, surprises, selectedStory, deepen, wizardStep, essayType, structure, reviewChecked, hydrated]);

  const togglePrompt = (key) => setOpenPrompts((s) => ({ ...s, [key]: !s[key] }));

  const setMoment = (idx, val) => {
    setMoments((m) => m.map((v, i) => (i === idx ? val : v)));
  };

  const goToWizardStep = (step) => {
    if (step > 0) {
      const filled = moments.filter((m) => m.trim()).length;
      if (filled === 0) return;
    }
    setWizardStep(step);
  };

  const setBelief = (which, idx, val) => {
    setBeliefs((b) => ({ ...b, [`${which}-${idx}`]: val }));
  };

  const toggleSurprise = (idx) => {
    setSurprises((s) => (s.includes(idx) ? s.filter((x) => x !== idx) : [...s, idx]));
  };

  const setDeepenField = (key, val) => {
    setDeepen((d) => ({ ...d, [key]: val }));
  };

  const setStructureField = (type, field, val) => {
    setStructure((s) => ({ ...s, [type]: { ...s[type], [field]: val } }));
  };

  const toggleReview = (idx) => {
    setReviewChecked((r) => (r.includes(idx) ? r.filter((x) => x !== idx) : [...r, idx]));
  };

  return (
    <>
      <section className="hero">
        <h1>Essay <span>Builder</span></h1>
        <p>Analyze prompts, mine your stories, build your structure, and self-review before you submit. Everything stays saved in your browser.</p>
        <div className="section-nav">
          <a href="#prompts">Prompt Analyzer</a>
          <a href="#stories">Story Mining</a>
          <a href="#structure">Structure Builder</a>
          <a href="#review">Self-Review</a>
          <a href="#examples">Example Breakdowns</a>
        </div>
      </section>

      <section id="prompts">
        <div className="container">
          <div className="section-label">Section 1</div>
          <h2 className="section-title">Essay Prompt Analyzer</h2>
          <p className="section-subtitle">Minerva's essay prompts are deceptively simple. Click any prompt below to decode what the admissions team is really looking for, and learn what separates forgettable responses from compelling ones.</p>

          {PROMPTS.map((p) => (
            <div key={p.key} className={`prompt-card${openPrompts[p.key] ? ' open' : ''}`} data-prompt={p.key}>
              <div className="prompt-header" onClick={() => togglePrompt(p.key)}>
                <div>
                  <div className="prompt-theme">{p.theme}</div>
                  <div className="prompt-title">{p.title}</div>
                </div>
                <span className="prompt-chevron">▼</span>
              </div>
              <div className="prompt-body">
                <div className="prompt-body-inner">
                  <div className="prompt-section">
                    <div className="prompt-section-label decode">What they're really asking</div>
                    <p>{p.decode}</p>
                  </div>
                  <div className="prompt-section weak-section">
                    <div className="prompt-section-label weak">Weak response patterns</div>
                    <ul>
                      {p.weak.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                  <div className="prompt-section strong-section">
                    <div className="prompt-section-label strong">What strong responses do</div>
                    <ul>
                      {p.strong.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                  <div className="prompt-section elements-section">
                    <div className="prompt-section-label elements">Key elements to include</div>
                    <ul>
                      {p.elements.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="stories" className="alt-bg">
        <div className="container">
          <div className="section-label">Section 2</div>
          <h2 className="section-title">Story Mining Tool</h2>
          <p className="section-subtitle">Your best essay material is already inside you. This guided wizard helps you surface it, step by step. Your progress is saved automatically.</p>

          <div className="wizard-progress">
            {['1. Moments', '2. Beliefs', '3. Surprise', '4. Deepen'].map((label, i) => (
              <div
                key={i}
                className={`wizard-step-indicator${i === wizardStep ? ' active' : ''}${i < wizardStep ? ' completed' : ''}`}
                onClick={() => goToWizardStep(i)}
              >
                {label}
              </div>
            ))}
          </div>

          {wizardStep === 0 && (
            <div className="wizard-panel active">
              <h3>List 5 moments that changed how you think</h3>
              <p className="wizard-desc">These don't have to be dramatic. A conversation, a failure, a book, a realization at 2 AM -- anything that shifted your perspective. Write quickly and honestly; don't censor yourself.</p>
              {moments.map((m, i) => (
                <div className="moment-group" key={i}>
                  <div className="moment-label">Moment {i + 1}</div>
                  <input
                    type="text"
                    className="moment-input"
                    value={m}
                    placeholder={MOMENT_PLACEHOLDERS[i]}
                    onChange={(e) => setMoment(i, e.target.value)}
                  />
                </div>
              ))}
              <div className="wizard-nav">
                <div />
                <button className="wizard-btn primary" onClick={() => goToWizardStep(1)}>Next: Beliefs →</button>
              </div>
            </div>
          )}

          {wizardStep === 1 && (
            <div className="wizard-panel active">
              <h3>For each moment, what did you believe before vs. after?</h3>
              <p className="wizard-desc">Growth happens at the boundary between old and new thinking. Identifying the shift is what makes a story compelling. If a moment didn't change a belief, that's fine -- leave it blank.</p>
              <div>
                {moments.map((m, i) => {
                  if (!m.trim()) return null;
                  return (
                    <div className="belief-pair" key={i}>
                      <div className="moment-label">Moment {i + 1}: {m}</div>
                      <div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text2)', marginBottom: '0.3rem' }}>I believed before...</div>
                        <input
                          type="text"
                          className="moment-input"
                          placeholder="What I thought was true"
                          value={beliefs[`before-${i}`] || ''}
                          onChange={(e) => setBelief('before', i, e.target.value)}
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text2)', marginBottom: '0.3rem' }}>I believe now...</div>
                        <input
                          type="text"
                          className="moment-input"
                          placeholder="What I now understand"
                          value={beliefs[`after-${i}`] || ''}
                          onChange={(e) => setBelief('after', i, e.target.value)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="wizard-nav">
                <button className="wizard-btn secondary" onClick={() => goToWizardStep(0)}>← Back</button>
                <button className="wizard-btn primary" onClick={() => goToWizardStep(2)}>Next: Surprise Test →</button>
              </div>
            </div>
          )}

          {wizardStep === 2 && (
            <div className="wizard-panel active">
              <h3>Which of these would surprise someone who doesn't know you?</h3>
              <p className="wizard-desc">The best essay stories reveal something unexpected about you. Select the moments that would make a stranger think "I wouldn't have guessed that about this person."</p>
              <div>
                {moments.map((m, i) => {
                  if (!m.trim()) return null;
                  const isSel = surprises.includes(i);
                  return (
                    <div
                      key={i}
                      className={`surprise-row${isSel ? ' selected' : ''}`}
                      onClick={() => toggleSurprise(i)}
                    >
                      <span className="surprise-check">{isSel ? '✓' : ''}</span>
                      <span className="surprise-text">{m}</span>
                    </div>
                  );
                })}
              </div>
              <div className="wizard-nav">
                <button className="wizard-btn secondary" onClick={() => goToWizardStep(1)}>← Back</button>
                <button className="wizard-btn primary" onClick={() => goToWizardStep(3)}>Next: Deepen Your Story →</button>
              </div>
            </div>
          )}

          {wizardStep === 3 && (
            <div className="wizard-panel active">
              <h3>Deepen your strongest story</h3>
              <p className="wizard-desc">Pick the moment you feel strongest about (ideally one you marked as surprising) and answer these questions. This is the raw material for your essay.</p>

              <div style={{ marginBottom: '1.5rem' }}>
                {moments.filter((m) => m.trim()).length === 0 ? (
                  <p style={{ fontSize: '0.9rem', color: 'var(--text2)' }}>Go back to Step 1 and enter some moments first.</p>
                ) : (
                  <select
                    className="moment-input"
                    style={{ maxWidth: '100%' }}
                    value={selectedStory}
                    onChange={(e) => setSelectedStory(parseInt(e.target.value, 10))}
                  >
                    {moments.map((m, i) => m.trim() ? (
                      <option key={i} value={i}>Moment {i + 1}: {m}</option>
                    ) : null)}
                  </select>
                )}
              </div>

              {[
                { key: 'what', label: 'What specifically happened?', placeholder: 'Set the scene. Where were you? Who was there? What triggered the moment?' },
                { key: 'feel', label: 'How did you feel in the moment?', placeholder: 'Be honest. Confused? Angry? Excited? Ashamed? The emotional truth is what makes readers connect.' },
                { key: 'action', label: 'What did you do about it?', placeholder: 'Concrete actions, not vague claims. Did you research? Build something? Have a conversation? Change a habit?' },
                { key: 'learn', label: "What did you learn that you couldn't have learned any other way?", placeholder: "What's the lesson that only THIS experience could teach? Not a platitude -- something specific to you." },
                { key: 'apply', label: 'How has this changed how you approach new situations?', placeholder: "Give a concrete example of how you've since applied this lesson. Show the growth was real and lasting." },
              ].map(({ key, label, placeholder }) => (
                <div className="deepen-group" key={key}>
                  <label>{label}</label>
                  <textarea
                    className="moment-textarea"
                    placeholder={placeholder}
                    value={deepen[key] || ''}
                    onChange={(e) => setDeepenField(key, e.target.value)}
                  />
                </div>
              ))}

              <div className="wizard-nav">
                <button className="wizard-btn secondary" onClick={() => goToWizardStep(2)}>← Back</button>
                <button
                  className="wizard-btn primary"
                  onClick={() => document.getElementById('structure')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Use This in Structure Builder ↓
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section id="structure">
        <div className="container">
          <div className="section-label">Section 3</div>
          <h2 className="section-title">Essay Structure Builder</h2>
          <p className="section-subtitle">Choose an essay type that fits your story, then fill in the outline. The balance meter shows whether you're spending your words where they matter most.</p>

          <div className="type-selector">
            {ESSAY_TYPES.map((t) => (
              <button
                key={t.key}
                className={`type-btn${essayType === t.key ? ' active' : ''}`}
                onClick={() => setEssayType(t.key)}
              >
                <div className="type-icon">{t.icon}</div>
                <span className="type-name">{t.name}</span>
                <span className="type-desc">{t.desc}</span>
              </button>
            ))}
          </div>

          <StructureOutline
            essayType={essayType}
            structure={structure}
            onChange={setStructureField}
          />
        </div>
      </section>

      <section id="review" className="alt-bg">
        <div className="container">
          <div className="section-label">Section 4</div>
          <h2 className="section-title">Self-Review Checklist</h2>
          <p className="section-subtitle">Before you submit, run your essay through this checklist. Be honest with yourself -- every unchecked item is an area to improve.</p>

          <ul className="review-list">
            {REVIEW_ITEMS.map((text, i) => {
              const checked = reviewChecked.includes(i);
              return (
                <li
                  key={i}
                  className={`review-item${checked ? ' checked' : ''}`}
                  onClick={() => toggleReview(i)}
                >
                  <span className="review-check">✓</span>
                  <span>{text}</span>
                </li>
              );
            })}
          </ul>

          <ReviewProgress reviewChecked={reviewChecked} />
        </div>
      </section>

      <section id="examples">
        <div className="container">
          <div className="section-label">Section 5</div>
          <h2 className="section-title">Example Essay Breakdowns</h2>
          <p className="section-subtitle">Three annotated excerpts showing specific techniques that make Minerva essays work. Study the technique, not the topic.</p>

          <div className="example-card">
            <span className="example-badge detail">Technique: Specific Detail</span>
            <div className="example-excerpt">
              "The fluorescent light in room 3B buzzed at exactly the frequency that made my left eye twitch. I'd been staring at the same equation for forty minutes -- not because I couldn't solve it, but because the answer contradicted everything my textbook said. My teacher had already moved on. I hadn't."
            </div>
            <div className="example-annotation">
              <strong>Why it works:</strong> Instead of saying "I was curious and persistent," the writer drops you into a physical moment. The buzzing light, the twitching eye, the forty minutes, the contradiction -- these details make the scene real. The last two sentences ("My teacher had already moved on. I hadn't.") reveal character without ever stating it directly. The reader draws their own conclusion about this person's intellectual drive, which is far more convincing than a self-description.
            </div>
          </div>

          <div className="example-card">
            <span className="example-badge vulnerability">Technique: Vulnerability</span>
            <div className="example-excerpt">
              "I spent three months building a community garden program, mapped the plots, recruited volunteers, wrote a grant proposal -- and then nobody came to the launch. I sat on a folding chair next to forty empty seats and pretended to check my phone so the venue manager wouldn't see me cry."
            </div>
            <div className="example-annotation">
              <strong>Why it works:</strong> Most applicants would skip this part or spin it immediately into a success story. This writer sits in the failure. The "pretending to check my phone" detail is painfully specific and universally recognizable -- every reader has done some version of this. By showing the low point without rushing to redemption, the writer earns the reader's trust. Whatever growth comes next will feel genuine because we saw the real cost of the setback.
            </div>
          </div>

          <div className="example-card">
            <span className="example-badge connection">Technique: Unexpected Connection</span>
            <div className="example-excerpt">
              "I understood urban planning the day I learned to cook Ethiopian food. My neighbor Almaz showed me how injera has to ferment for three days -- you can't rush it. The best neighborhoods work the same way. You can't drop a park into a community and call it development. Things need time to become part of the fabric."
            </div>
            <div className="example-annotation">
              <strong>Why it works:</strong> This is interdisciplinary thinking in action -- exactly what Minerva's Cornerstone curriculum is designed to develop. The writer takes two seemingly unrelated domains (cooking and urban planning) and finds a genuine structural parallel. It doesn't feel forced because the connection arose from a real experience with a real person. This signals that the writer naturally thinks across boundaries, which is the core intellectual disposition Minerva selects for.
            </div>
          </div>

          <div className="tip-box">
            <h4>How to apply these techniques</h4>
            <p>Notice that none of these excerpts are about impressive accomplishments. They're about specific moments rendered with honesty and precision. When you revise your essay, ask yourself: could I make this more specific? Could I let the reader see what happened instead of telling them what it meant?</p>
          </div>
        </div>
      </section>

      <div className={`save-indicator${saveVisible ? ' visible' : ''}`}>Saved</div>
    </>
  );
}

function StructureOutline({ essayType, structure, onChange }) {
  const blocks = OUTLINES[essayType];
  let totalWords = 0;
  let setupWords = 0;
  let storyWords = 0;
  let insightWords = 0;

  blocks.forEach((b) => {
    const wc = countWords(structure[essayType][b.field]);
    totalWords += wc;
    if (b.category === 'setup') setupWords += wc;
    else if (b.category === 'story') storyWords += wc;
    else insightWords += wc;
  });

  let totalClass = 'count ok';
  if (totalWords > 500) totalClass = 'count over';
  else if (totalWords > 400) totalClass = 'count warn';

  return (
    <>
      <div className="outline-area active">
        {blocks.map((b) => {
          const val = structure[essayType][b.field] || '';
          const wc = countWords(val);
          return (
            <div key={b.field} className="outline-block" data-category={b.category}>
              <div className="outline-block-header">
                <label>{b.label}</label>
                <span className="hint">{b.hint}</span>
              </div>
              <textarea
                placeholder={b.placeholder}
                value={val}
                onChange={(e) => onChange(essayType, b.field, e.target.value)}
              />
              <div className="word-count">{wc} word{wc !== 1 ? 's' : ''}</div>
            </div>
          );
        })}
      </div>

      <div className="total-word-count">
        <span className="label">Total word count</span>
        <span className={totalClass}>{totalWords} words</span>
      </div>

      <BalanceMeter setup={setupWords} story={storyWords} insight={insightWords} total={totalWords} />
    </>
  );
}

function BalanceMeter({ setup, story, insight, total }) {
  if (total === 0) {
    return (
      <div className="balance-meter">
        <h4>Balance Meter</h4>
        <div className="balance-bar-container">
          <div className="balance-segment setup" style={{ width: '33.3%' }}>Setup</div>
          <div className="balance-segment story" style={{ width: '33.3%' }}>Story</div>
          <div className="balance-segment insight" style={{ width: '33.4%' }}>Insight</div>
        </div>
        <BalanceLabels />
        <div className="balance-feedback good">
          Write in the sections above to see your word distribution. Aim for roughly 20% setup, 35% story, and 45% insight and reflection.
        </div>
      </div>
    );
  }

  const setupPct = Math.round((setup / total) * 100);
  const storyPct = Math.round((story / total) * 100);
  const insightPct = 100 - setupPct - storyPct;

  let feedback;
  let feedbackClass = 'good';
  if (setupPct > 40) {
    feedback = "You're spending too much of your essay on setup and context. Readers don't need a full backstory -- get to the substance faster. Cut your setup down to 15-25% and redistribute those words to insight and reflection.";
    feedbackClass = 'warn';
  } else if (insightPct < 25 && total > 50) {
    feedback = 'Your insight and reflection sections are thin. This is where the admissions reader learns who you are -- the "so what" of your essay. Consider cutting some narrative and spending more words on what you learned and how it connects to Minerva.';
    feedbackClass = 'warn';
  } else if (storyPct < 15 && total > 50) {
    feedback = 'Your core story section is very short. Without enough concrete detail and narrative, your essay can read as abstract. Add specific scenes, dialogue, or sensory details to bring the story to life.';
    feedbackClass = 'warn';
  } else if (total > 50) {
    feedback = "Your balance looks solid. Setup is concise, the story has substance, and you're dedicating real space to insight and reflection. Keep refining the quality of each section.";
  } else {
    feedback = 'Keep writing. You need more content before the balance meter can give meaningful feedback.';
  }

  return (
    <div className="balance-meter">
      <h4>Balance Meter</h4>
      <div className="balance-bar-container">
        <div className="balance-segment setup" style={{ width: `${Math.max(setupPct, 2)}%` }}>{setupPct > 10 ? `${setupPct}%` : ''}</div>
        <div className="balance-segment story" style={{ width: `${Math.max(storyPct, 2)}%` }}>{storyPct > 10 ? `${storyPct}%` : ''}</div>
        <div className="balance-segment insight" style={{ width: `${Math.max(insightPct, 2)}%` }}>{insightPct > 10 ? `${insightPct}%` : ''}</div>
      </div>
      <BalanceLabels />
      <div className={`balance-feedback ${feedbackClass}`}>{feedback}</div>
    </div>
  );
}

function BalanceLabels() {
  return (
    <div className="balance-labels">
      <span className="balance-label"><span className="balance-dot setup" /> Setup / Context</span>
      <span className="balance-label"><span className="balance-dot story" /> Core Story</span>
      <span className="balance-label"><span className="balance-dot insight" /> Insight / Reflection</span>
    </div>
  );
}

function ReviewProgress({ reviewChecked }) {
  const total = REVIEW_ITEMS.length;
  const done = reviewChecked.length;
  const pct = Math.round((done / total) * 100);
  const showRemaining = done > 0 && done < total;
  const unchecked = REVIEW_ITEMS.filter((_, i) => !reviewChecked.includes(i));

  return (
    <>
      <div className="review-progress-bar">
        <div className="review-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="review-progress-text">
        <span>{done}</span> of {total} checked ({pct}%)
      </div>
      {showRemaining && (
        <div className="review-remaining visible">
          <strong>Areas to revisit:</strong> {unchecked.join(' / ')}
        </div>
      )}
    </>
  );
}
