'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'minerva-interviews';
const SESSION_KEY = 'minerva-interview-active';

const MODES = {
  behavioral: { label: 'Behavioral', icon: '\u{1F4AC}', color: 'red' },
  creative: { label: 'Creative', icon: '\u{1F4A1}', color: 'purple' },
  motivation: { label: 'Motivation', icon: '\u{1F3AF}', color: 'blue' },
  'rapid-fire': { label: 'Rapid-Fire', icon: '⚡', color: 'green' },
};

const INITIAL_MESSAGES = {
  behavioral: "Welcome to your behavioral interview practice. I'll ask you questions about your past experiences to understand how you think and act in real situations. Take your time with each response — depth and specificity matter more than speed.\n\nLet's begin: Tell me about a time you identified a problem that others overlooked. What did you notice, what did you do about it, and what happened as a result?",
  creative: "Welcome to the creative thinking interview. I'll present you with unusual scenarios and thought experiments. There are no right or wrong answers — I'm interested in how you reason, what assumptions you challenge, and where your thinking leads you.\n\nHere's your first prompt: If you could redesign one fundamental aspect of how schools work — not just adding technology or changing schedules, but rethinking a core assumption — what would you change and why?",
  motivation: "Welcome to the motivation deep-dive. This is about understanding what genuinely drives you and why Minerva's model resonates with who you are and who you want to become. Be honest — authentic self-reflection is far more valuable than telling me what you think I want to hear.\n\nLet's start: What is it about the way you currently learn that frustrates you most, and how does Minerva's approach address that?",
  'rapid-fire': "Welcome to the rapid-fire round. I'll ask quick questions one after another. Keep your answers focused — aim for 2-3 sentences each. Don't overthink it; your instinctive responses often reveal the most.\n\nReady? First question: What's the most interesting thing you've learned outside of school in the past month?",
};

function formatDuration(ms) {
  const totalSec = Math.floor(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function formatTimestamp(date) {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function humanizeError(msg) {
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('network')) {
    return 'Could not reach the server. Check your connection and try again.';
  }
  if (msg.includes('429') || msg.toLowerCase().includes('rate')) {
    return 'Too many requests. Please wait 30–60 seconds before trying again.';
  }
  if (msg.includes('500') || msg.includes('server')) {
    return 'Server error. This is usually temporary — try again in a few seconds.';
  }
  return 'Failed to get response. Please try again.';
}

export default function InterviewPage() {
  const [view, setView] = useState('modes');
  const [mode, setMode] = useState(null);
  const [messages, setMessages] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [showTyping, setShowTyping] = useState(false);
  const [error, setError] = useState(null);
  const [input, setInput] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [chatTipsOpen, setChatTipsOpen] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [resumable, setResumable] = useState(null);
  const [summary, setSummary] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  const messagesRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHistory(JSON.parse(raw) || []);
    } catch {
      /* ignore */
    }
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const session = JSON.parse(raw);
        if (session && session.mode && Array.isArray(session.messages) && session.messages.length > 0) {
          setResumable(session);
        }
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (view !== 'chat' || !startTime) return;
    const update = () => setElapsed(Date.now() - startTime);
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [view, startTime]);

  useEffect(() => {
    if (messagesRef.current) {
      requestAnimationFrame(() => {
        if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      });
    }
  }, [messages, streamingText, showTyping]);

  const persistActiveSession = useCallback((session) => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      /* ignore */
    }
  }, []);

  const clearActiveSession = useCallback(() => {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const persistHistory = useCallback((next) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const saveInterview = useCallback((interview) => {
    setHistory((prev) => {
      let next = prev.filter((h) => h.id !== interview.id);
      next.unshift(interview);
      if (next.length > 20) next = next.slice(0, 20);
      persistHistory(next);
      return next;
    });
  }, [persistHistory]);

  const selectMode = (newMode) => {
    setMode(newMode);
    const greeting = INITIAL_MESSAGES[newMode];
    const initialMessages = [{ role: 'assistant', content: greeting }];
    const ts = Date.now();
    setMessages(initialMessages);
    setQuestionCount(1);
    setStartTime(ts);
    setView('chat');
    setError(null);
    setStreamingText('');
    setShowTyping(false);
    persistActiveSession({ mode: newMode, messages: initialMessages, startTime: ts, questionCount: 1 });
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const resumeInterview = () => {
    if (!resumable) return;
    setMode(resumable.mode);
    setMessages(resumable.messages);
    setStartTime(resumable.startTime);
    setQuestionCount(resumable.questionCount || 1);
    setView('chat');
    setError(null);
    setResumable(null);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const fetchAIResponse = useCallback(async (currentMessages, currentMode) => {
    setIsStreaming(true);
    setShowTyping(true);
    setError(null);

    try {
      const response = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: currentMessages, mode: currentMode }),
      });

      if (!response.ok) {
        if (response.status === 429) throw new Error('429 rate limit');
        throw new Error(`Server responded with ${response.status}`);
      }

      setShowTyping(false);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setStreamingText(fullText);
      }
      const tail = decoder.decode();
      if (tail) {
        fullText += tail;
        setStreamingText(fullText);
      }

      const errMatch = fullText.match(/\n\n\[ERROR\]:\s*(.*)$/s);
      if (errMatch) {
        throw new Error(errMatch[1].trim() || 'Stream interrupted before completion.');
      }

      setMessages((prev) => {
        const next = [...prev, { role: 'assistant', content: fullText, time: formatTimestamp(new Date()) }];
        setQuestionCount((qc) => {
          const newQc = qc + 1;
          persistActiveSession({ mode: currentMode, messages: next, startTime, questionCount: newQc });
          return newQc;
        });
        return next;
      });
      setStreamingText('');
    } catch (err) {
      setShowTyping(false);
      setStreamingText('');
      setError(humanizeError(err.message));
    } finally {
      setIsStreaming(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [persistActiveSession, startTime]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    if (mode !== 'rapid-fire' && text.length < 10) {
      if (textareaRef.current) {
        textareaRef.current.style.borderColor = 'var(--clay)';
        setTimeout(() => {
          if (textareaRef.current) textareaRef.current.style.borderColor = '';
        }, 2000);
      }
      return;
    }

    const userMsg = { role: 'user', content: text, time: formatTimestamp(new Date()) };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    persistActiveSession({ mode, messages: next, startTime, questionCount });
    fetchAIResponse(next, mode);
  };

  const retryLast = () => {
    setError(null);
    fetchAIResponse(messages, mode);
  };

  const handleTextareaInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 110)}px`;
  };

  const handleTextareaKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const endInterview = () => {
    if (messages.length < 2) return;
    const endTime = Date.now();
    const interview = {
      id: startTime,
      mode,
      messages: messages.slice(),
      startedAt: new Date(startTime).toISOString(),
      endedAt: new Date(endTime).toISOString(),
      duration: endTime - startTime,
    };
    saveInterview(interview);
    clearActiveSession();
    setSummary({ ...interview, isReview: false });
    setView('summary');
    setTranscriptOpen(false);
  };

  const startNewInterview = () => {
    if (isStreaming) return;
    if (messages.length > 1) {
      if (typeof window !== 'undefined' && !window.confirm('Start a new interview? Your current progress will be saved.')) return;
      const endTime = Date.now();
      saveInterview({
        id: startTime,
        mode,
        messages: messages.slice(),
        startedAt: new Date(startTime).toISOString(),
        endedAt: new Date(endTime).toISOString(),
        duration: endTime - startTime,
      });
    }
    clearActiveSession();
    setMode(null);
    setMessages([]);
    setQuestionCount(0);
    setStartTime(null);
    setStreamingText('');
    setShowTyping(false);
    setError(null);
    setView('modes');
  };

  const backToModes = () => {
    setView('modes');
  };

  const viewPastInterview = (id) => {
    const interview = history.find((h) => h.id === id);
    if (!interview) return;
    setSummary({ ...interview, isReview: true });
    setTranscriptOpen(false);
    setView('summary');
  };

  const clearHistory = () => {
    if (typeof window !== 'undefined' && !window.confirm('Clear all past interview history?')) return;
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const sendDisabled = !input.trim() || isStreaming;
  const elapsedDisplay = (() => {
    const totalSec = Math.floor(elapsed / 1000);
    const mins = String(Math.floor(totalSec / 60)).padStart(2, '0');
    const secs = String(totalSec % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  })();

  return (
    <>
      <section className="hero">
        <h1>AI Mock <span>Interview</span></h1>
        <p>Practice for your Minerva admissions interview with an AI interviewer. Choose a mode, answer questions, and get feedback on your responses.</p>
      </section>

      {view === 'modes' && (
        <section id="mode-section">
          <div className="container">
            <span className="section-label">Choose Your Mode</span>
            <h2 className="section-title">Interview Practice Modes</h2>
            <p className="section-subtitle">Each mode focuses on a different aspect of the Minerva interview experience. Select one to begin a practice session.</p>

            <div className="mode-grid">
              <ModeCard color="red" icon={'\u{1F4AC}'} title="Behavioral" desc="Experience-based questions that probe how you've handled past situations, demonstrated leadership, and solved real problems." onClick={() => selectMode('behavioral')} />
              <ModeCard color="purple" icon={'\u{1F4A1}'} title="Creative" desc="Unusual thought experiments and hypothetical scenarios that test your ability to think creatively and reason through novel problems." onClick={() => selectMode('creative')} />
              <ModeCard color="blue" icon={'\u{1F3AF}'} title="Motivation" desc="Deep, reflective questions exploring why Minerva specifically resonates with your goals, values, and vision for your education." onClick={() => selectMode('motivation')} />
              <ModeCard color="green" icon="⚡" title="Rapid-Fire" desc="A quick succession of short questions testing your ability to think on your feet. Keep answers concise and direct." onClick={() => selectMode('rapid-fire')} />
            </div>

            {resumable && (
              <div className="resume-notice" style={{ display: 'block' }}>
                <p>You have a {MODES[resumable.mode]?.label} interview in progress ({resumable.messages.filter((m) => m.role === 'user').length} responses).</p>
                <button onClick={resumeInterview}>Resume</button>
              </div>
            )}

            <div className={`tips-wrap${tipsOpen ? ' tips-open' : ''}`}>
              <div className="tips-toggle" onClick={() => setTipsOpen((o) => !o)}>
                <h3>{'\u{1F4DA}'} Interview Tips</h3>
                <span className="tips-arrow">▼</span>
              </div>
              <div className="tips-body">
                <ul className="tips-list">
                  <li><strong>Be authentic.</strong> Minerva values genuine self-reflection over rehearsed, polished answers.</li>
                  <li><strong>Think out loud.</strong> Share your reasoning process, not just your conclusions. Interviewers want to see how you think.</li>
                  <li><strong>Use specific examples.</strong> Draw from real experiences rather than speaking in generalities.</li>
                  <li><strong>Stay concise.</strong> Quality over quantity. Clear, focused responses are more impactful than rambling ones.</li>
                  <li><strong>Show intellectual curiosity.</strong> Ask clarifying questions and explore ideas beyond the obvious.</li>
                  <li><strong>Embrace uncertainty.</strong> Saying "I don't know, but here's how I'd think about it" is perfectly valid.</li>
                  <li><strong>Connect to Minerva's values.</strong> Reference active learning, global rotation, and interdisciplinary thinking when relevant.</li>
                  <li><strong>Reflect on growth.</strong> Discuss what you've learned from failures and how you've changed as a result.</li>
                </ul>
              </div>
            </div>

            {history.length > 0 && (
              <div className="past-section" style={{ display: 'block' }}>
                <h3>Past Practice Sessions</h3>
                <div>
                  {history.slice(0, 8).map((h) => {
                    const m = MODES[h.mode] || { label: h.mode, icon: '\u{1F4AC}', color: 'red' };
                    const userCount = h.messages ? h.messages.filter((mm) => mm.role === 'user').length : 0;
                    const dateStr = new Date(h.startedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                    const durStr = h.duration ? formatDuration(h.duration) : '';
                    return (
                      <div key={h.id} className="past-item" onClick={() => viewPastInterview(h.id)}>
                        <div className={`past-icon card-icon ${m.color}`}>{m.icon}</div>
                        <div className="past-info">
                          <span className="past-mode">{m.label}</span>
                          <span className="past-meta">{userCount} responses{durStr ? ` · ${durStr}` : ''} · {dateStr}</span>
                        </div>
                        <span className="past-arrow">→</span>
                      </div>
                    );
                  })}
                </div>
                <button className="past-clear" onClick={clearHistory}>Clear history</button>
              </div>
            )}
          </div>
        </section>
      )}

      {view === 'chat' && (
        <section className="chat-section" style={{ display: 'block' }}>
          <div className="chat-container">
            <div className="chat-header">
              <span className="mode-badge">{MODES[mode]?.label}</span>
              <span className="chat-timer">{elapsedDisplay}</span>
              <span className="chat-q-count">Q{questionCount}</span>
              <div className="chat-header-spacer" />
              <button className="chat-header-btn tips-btn" onClick={() => setChatTipsOpen((o) => !o)}>Tips</button>
              <button className="chat-header-btn" onClick={startNewInterview}>New</button>
              <button className="chat-header-btn end" onClick={endInterview}>End &amp; Review</button>
            </div>
            <div className={`chat-tips-panel${chatTipsOpen ? ' open' : ''}`}>
              <ul>
                <li>Be genuine and specific with your responses</li>
                <li>Think out loud — show your reasoning process</li>
                <li>Draw from real personal experiences</li>
                <li>Quality matters more than length</li>
                <li>Ask clarifying questions if unsure</li>
                <li>Connect answers to Minerva's values</li>
              </ul>
            </div>
            <div className="chat-messages" ref={messagesRef}>
              {messages.map((m, i) => (
                <MessageBubble key={i} role={m.role} content={m.content} time={m.time} />
              ))}
              {streamingText && <MessageBubble role="assistant" content={streamingText} time="" />}
              {showTyping && <TypingIndicator />}
              {error && (
                <div className="chat-error">
                  <p>{error}</p>
                  <button className="retry-btn" onClick={retryLast}>Retry</button>
                </div>
              )}
            </div>
            <div className="chat-input">
              <textarea
                ref={textareaRef}
                placeholder="Type your response..."
                rows={1}
                value={input}
                onChange={handleTextareaInput}
                onKeyDown={handleTextareaKeyDown}
              />
              <button className="send-btn" onClick={handleSend} disabled={sendDisabled}>Send</button>
            </div>
          </div>
        </section>
      )}

      {view === 'summary' && summary && (
        <SummarySection
          summary={summary}
          onStartNew={startNewInterview}
          onBack={backToModes}
          transcriptOpen={transcriptOpen}
          onToggleTranscript={() => setTranscriptOpen((o) => !o)}
        />
      )}
    </>
  );
}

function ModeCard({ color, icon, title, desc, onClick }) {
  return (
    <div className="mode-card" onClick={onClick}>
      <div className={`card-icon ${color}`}>{icon}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
      <span className="start-label">Start practice →</span>
    </div>
  );
}

function MessageBubble({ role, content, time }) {
  const isAssistant = role === 'assistant';
  return (
    <div className={`message ${isAssistant ? 'interviewer' : 'user'}`}>
      <div className="msg-avatar">{isAssistant ? '\u{1F393}' : '\u{1F464}'}</div>
      <div className="msg-body">
        <div className="msg-bubble"><span className="msg-content">{content}</span></div>
        <div className="msg-time">{content && time ? time : ''}</div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="typing-row" id="typing-indicator">
      <div className="msg-avatar">{'\u{1F393}'}</div>
      <div className="typing-dots"><span /><span /><span /></div>
    </div>
  );
}

function SummarySection({ summary, onStartNew, onBack, transcriptOpen, onToggleTranscript }) {
  const userMsgs = summary.messages.filter((m) => m.role === 'user');
  const totalWords = userMsgs.reduce((sum, m) => sum + m.content.split(/\s+/).length, 0);
  const avgWords = userMsgs.length > 0 ? Math.round(totalWords / userMsgs.length) : 0;
  const modeInfo = MODES[summary.mode] || { label: summary.mode };

  const strengths = [];
  if (userMsgs.length >= 3) strengths.push('You engaged with multiple questions, showing sustained focus throughout the interview.');
  if (avgWords >= 40) strengths.push('Your responses showed good depth and elaboration — interviewers value thorough answers.');
  if (avgWords >= 20 && avgWords < 40) strengths.push('Your response length was well-balanced — detailed enough to be substantive without being overwhelming.');
  if (summary.duration > 300000) strengths.push('You spent meaningful time on the practice session, which shows commitment to preparation.');
  if (strengths.length === 0) strengths.push('You completed a practice session — showing up and practicing is the most important step.');

  const areas = [];
  if (avgWords < 20 && userMsgs.length > 0) areas.push('Try to elaborate more on your answers. Aim for at least 3-4 sentences per response to give the interviewer enough to work with.');
  if (avgWords > 100) areas.push('Consider being more concise. While depth is good, overly long responses can lose focus. Aim for clear, structured answers.');
  if (userMsgs.length < 3) areas.push('Try to answer more questions per session. Longer practice sessions help you build stamina and comfort.');
  if (summary.mode === 'behavioral') areas.push('For behavioral questions, structure your answers using the STAR method: Situation, Task, Action, Result.');
  if (summary.mode === 'creative') areas.push('For creative questions, try presenting multiple perspectives before settling on your position.');
  if (summary.mode === 'motivation') areas.push('For motivation questions, connect your personal experiences directly to specific Minerva programs or values.');
  if (summary.mode === 'rapid-fire') areas.push('For rapid-fire, practice giving complete thoughts in 2-3 sentences. Brevity with substance is the goal.');

  const next = [
    'Practice another mode to develop different interview skills.',
    'Review your transcript below to identify patterns in your responses.',
  ];
  if (summary.mode !== 'rapid-fire') next.push('Try the Rapid-Fire mode to practice thinking on your feet.');
  next.push('Record yourself answering questions out loud to practice verbal delivery.');

  const title = summary.isReview ? `${modeInfo.label} Interview Review` : 'Interview Complete';
  const subtitle = summary.isReview
    ? `Practiced on ${new Date(summary.startedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`
    : `Here's a breakdown of your ${modeInfo.label.toLowerCase()} practice session.`;

  return (
    <section className="summary-section" style={{ display: 'block' }}>
      <div className="container">
        <div className="summary-header">
          <div className="done-icon">✓</div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        <div className="stats-grid">
          <StatCard value={modeInfo.label} label="Mode" />
          <StatCard value={formatDuration(summary.duration)} label="Duration" />
          <StatCard value={userMsgs.length} label="Responses" />
          <StatCard value={avgWords} label="Avg Words" />
        </div>

        <div>
          <div className="insights-card strengths">
            <h3>✅ What Went Well</h3>
            <ul>{strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </div>
          <div className="insights-card areas">
            <h3>{'\u{1F4A1}'} Areas to Develop</h3>
            <ul>{areas.map((a, i) => <li key={i}>{a}</li>)}</ul>
          </div>
          <div className="insights-card next-steps">
            <h3>{'\u{1F3AF}'} Next Steps</h3>
            <ul>{next.map((n, i) => <li key={i}>{n}</li>)}</ul>
          </div>
        </div>

        <div className={`transcript-toggle${transcriptOpen ? ' transcript-open' : ''}`} onClick={onToggleTranscript}>
          <h3>Full Transcript</h3>
          <span className="transcript-arrow">▼</span>
        </div>
        <div className={`transcript-body${transcriptOpen ? ' transcript-open' : ''}`}>
          {summary.messages.map((m, i) => (
            <div key={i} className={`transcript-msg ${m.role === 'assistant' ? 'interviewer' : 'user'}`}>
              <div className="t-role">{m.role === 'assistant' ? 'Interviewer' : 'You'}</div>
              <div>{m.content}</div>
            </div>
          ))}
        </div>

        <div className="summary-actions">
          <button className="btn btn-primary" onClick={onStartNew}>Start New Interview</button>
          <button className="btn btn-secondary" onClick={onBack}>Back to Modes</button>
        </div>
      </div>
    </section>
  );
}

function StatCard({ value, label }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
