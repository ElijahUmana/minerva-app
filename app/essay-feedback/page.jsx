'use client';

import { useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'minerva-essay-feedback';

const ESSAY_TYPES = [
  { value: 'motivation', label: 'Why Minerva? (Motivation)' },
  { value: 'personal_challenge', label: 'Personal Challenge' },
  { value: 'intellectual_curiosity', label: 'Intellectual Curiosity' },
  { value: 'community_impact', label: 'Community Impact' },
  { value: 'global_perspective', label: 'Global Perspective' },
  { value: 'creative_thinking', label: 'Creative Thinking' },
];

const CATEGORIES = [
  { key: 'structure', label: 'Structure', icon: '⚙' },
  { key: 'authentic_voice', label: 'Authentic Voice', icon: '✎' },
  { key: 'specificity', label: 'Specificity', icon: '\u{1F50E}' },
  { key: 'minerva_fit', label: 'Minerva Fit', icon: '\u{1F393}' },
  { key: 'growth_reflection', label: 'Growth & Reflection', icon: '\u{1F331}' },
];

function getScoreClass(score) {
  if (score >= 7) return 'high';
  if (score >= 5) return 'mid';
  return 'low';
}

function parseBullets(text) {
  return text
    .split('\n')
    .filter((l) => /^[-•*]\s/.test(l.trim()))
    .map((l) => l.trim().replace(/^[-•*]\s+/, '').trim())
    .filter(Boolean);
}

function parseEssayFeedback(text) {
  const result = { scores: {}, strengths: [], improvements: [], summary: '' };
  const scoreMap = {
    Structure: 'structure',
    'Authentic Voice': 'authentic_voice',
    Specificity: 'specificity',
    'Minerva Fit': 'minerva_fit',
    'Growth/Reflection': 'growth_reflection',
    'Growth & Reflection': 'growth_reflection',
    Growth: 'growth_reflection',
  };

  const scoreRe = /\*\*([^:*]+):\s*(\d+)\/10\*\*\s*[—–-]+\s*(.+)/g;
  let m;
  while ((m = scoreRe.exec(text)) !== null) {
    const key = scoreMap[m[1].trim()];
    if (key) result.scores[key] = { score: parseInt(m[2], 10), feedback: m[3].trim() };
  }

  const sectionRe = /##\s+([^\n]+)\n([\s\S]*?)(?=\n##\s|\s*$)/g;
  while ((m = sectionRe.exec(text)) !== null) {
    const heading = m[1].trim();
    const body = m[2].trim();
    if (/Strengths/i.test(heading)) result.strengths = parseBullets(body);
    else if (/Improv|Areas/i.test(heading)) result.improvements = parseBullets(body);
    else if (/Overall|Assessment/i.test(heading)) result.summary = body;
  }
  return result;
}

function humanizeError(message) {
  if (!message) return 'Something went wrong. Please try again.';
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'Could not reach the server. Check your internet connection and try again.';
  }
  if (message.includes('429') || message.toLowerCase().includes('rate')) {
    return "You've sent too many requests. Please wait 30–60 seconds before trying again.";
  }
  if (message.includes('500') || message.includes('server')) {
    return 'The server encountered an error. This is usually temporary — try again in a few seconds.';
  }
  if (message.includes('50 characters') || message.includes('50 char')) return message;
  return message;
}

export default function EssayFeedbackPage() {
  const [essay, setEssay] = useState('');
  const [type, setType] = useState('motivation');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const [saveVisible, setSaveVisible] = useState(false);

  const abortRef = useRef(null);
  const saveDebounceRef = useRef(null);
  const saveIndicatorRef = useRef(null);
  const resultsRef = useRef(null);
  const errorRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (typeof draft.essay === 'string') setEssay(draft.essay);
        if (draft.type) setType(draft.type);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ essay, type }));
        setSaveVisible(true);
        if (saveIndicatorRef.current) clearTimeout(saveIndicatorRef.current);
        saveIndicatorRef.current = setTimeout(() => setSaveVisible(false), 1500);
      } catch {
        /* ignore */
      }
    }, 500);
    return () => {
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    };
  }, [essay, type, hydrated]);

  useEffect(() => {
    return () => {
      if (saveIndicatorRef.current) clearTimeout(saveIndicatorRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const words = essay.trim() ? essay.trim().split(/\s+/).length : 0;
  const chars = essay.length;
  const wordClass = `count-num${words > 600 ? ' over' : words > 450 ? ' warn' : ''}`;
  const charClass = `count-num${chars > 10_000 ? ' over' : chars > 9_500 ? ' warn' : ''}`;

  const submit = async () => {
    const trimmed = essay.trim();
    if (!trimmed) return;
    if (trimmed.length < 50) {
      setError('Your essay must be at least 50 characters. Please paste more of your draft.');
      setStatus('error');
      setTimeout(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
      return;
    }
    if (essay.length > 10_000) {
      setError('Your essay is too long. Please trim to under 10,000 characters.');
      setStatus('error');
      setTimeout(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
      return;
    }

    setStatus('loading');
    setError(null);
    setResult(null);

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/essay-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ essay: trimmed, prompt_type: type }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
      }

      const errMatch = buffer.match(/\n\n\[ERROR\]:\s*(.*)$/s);
      if (errMatch) {
        throw new Error(errMatch[1].trim() || 'Stream interrupted before completion.');
      }

      setResult(parseEssayFeedback(buffer));
      setStatus('success');
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(humanizeError(err.message));
      setStatus('error');
      setTimeout(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
    }
  };

  const isLoading = status === 'loading';

  return (
    <>
      <section className="hero">
        <h1>AI Essay <span>Feedback</span></h1>
        <p>Paste your essay draft and get detailed feedback powered by Claude. Scores across five dimensions, specific strengths, and actionable improvements.</p>
      </section>

      <section>
        <div className="container">
          <div className="section-label">Your Draft</div>
          <h2 className="section-title">Submit Your Essay</h2>
          <p className="section-subtitle">Select the essay prompt type and paste your draft below. Your essay is saved locally so you won't lose it.</p>

          <div className="input-group">
            <label className="input-label" htmlFor="essay-type">Essay Prompt Type</label>
            <div className="input-hint">Choose the prompt your essay responds to</div>
            <select
              className="essay-select"
              id="essay-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {ESSAY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="essay-text">Your Essay</label>
            <div className="input-hint">Paste or type your full essay draft</div>
            <textarea
              className="essay-textarea"
              id="essay-text"
              placeholder="Paste your essay draft here..."
              value={essay}
              maxLength={10_000}
              onChange={(e) => setEssay(e.target.value)}
            />
            <div className="textarea-footer">
              <div className="word-char-count">
                <div className="count-item"><span className={wordClass}>{words}</span> words</div>
                <div className="count-item"><span className={charClass}>{chars}</span> / 10,000 characters</div>
              </div>
              <button
                className={`submit-btn${isLoading ? ' loading' : ''}`}
                onClick={submit}
                disabled={isLoading}
              >
                <span className="btn-label">Get AI Feedback</span>
                <span className="btn-loading-label">Analyzing</span>
                <div className="btn-spinner" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className={`skeleton-area${isLoading ? ' visible' : ''}`}>
        <div className="container">
          <div className="skeleton-loading-text">
            Analyzing your essay
            <div className="dot-pulse"><span /><span /><span /></div>
          </div>
          <div className="skeleton-grid">
            {Array.from({ length: 5 }).map((_, i) => (
              <div className="skeleton-card" key={i}>
                <div className="skeleton-line short" />
                <div className="skeleton-line score" />
                <div className="skeleton-line bar" />
                <div className="skeleton-line medium" />
                <div className="skeleton-line" />
              </div>
            ))}
          </div>
          {Array.from({ length: 2 }).map((_, i) => (
            <div className="skeleton-block" key={i}>
              <div className="skeleton-line short" />
              <div className="skeleton-line" />
              <div className="skeleton-line medium" />
              <div className="skeleton-line" />
            </div>
          ))}
        </div>
      </section>

      <section className={`error-area${status === 'error' ? ' visible' : ''}`} ref={errorRef}>
        <div className="container">
          <div className="error-card">
            <div className="error-icon">⚠</div>
            <div className="error-title">Something went wrong</div>
            <div className="error-message">{error || "We couldn't analyze your essay right now. This might be a temporary issue with the server."}</div>
            <button className="retry-btn" onClick={submit}>Try Again</button>
          </div>
        </div>
      </section>

      <section className={`results-area${status === 'success' && result ? ' visible' : ''}`} ref={resultsRef}>
        <div className="container">
          <div className="section-label">Feedback</div>
          <h2 className="section-title">Your Essay Analysis</h2>

          {result && (
            <>
              <div className="score-grid">
                {CATEGORIES.map((cat) => {
                  const scoreObj = result.scores[cat.key] || {};
                  const score = typeof scoreObj === 'number' ? scoreObj : (scoreObj.score || 0);
                  const desc = typeof scoreObj === 'object' ? (scoreObj.feedback || scoreObj.description || '') : '';
                  const cls = getScoreClass(score);
                  return (
                    <div className="score-card" key={cat.key}>
                      <div className="score-card-header">
                        <div className="score-card-title">{cat.icon} {cat.label}</div>
                        <div className={`score-card-value ${cls}`}>
                          {score}<span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text2)' }}>/10</span>
                        </div>
                      </div>
                      <div className="score-bar">
                        <div className={`score-bar-fill ${cls}`} style={{ width: `${score * 10}%` }} />
                      </div>
                      <div className="score-card-desc">{desc}</div>
                    </div>
                  );
                })}
              </div>

              <div className="feedback-block">
                <div className="feedback-block-header">
                  <div className="feedback-block-icon strengths">✓</div>
                  <div className="feedback-block-title">Strengths</div>
                </div>
                <ul className="feedback-list strengths-list">
                  {(result.strengths || []).map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>

              <div className="feedback-block">
                <div className="feedback-block-header">
                  <div className="feedback-block-icon improvements">▲</div>
                  <div className="feedback-block-title">Areas for Improvement</div>
                </div>
                <ul className="feedback-list improvements-list">
                  {(result.improvements || []).map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>

              <div className="summary-box">
                <h4>Overall Assessment</h4>
                <p>{result.summary}</p>
              </div>
            </>
          )}
        </div>
      </section>

      <div className={`save-indicator${saveVisible ? ' visible' : ''}`}>Saved</div>
    </>
  );
}
