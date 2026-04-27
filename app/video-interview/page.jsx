'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/* ============================================================
 * Constants
 * ============================================================ */

const QUESTIONS = [
  { id: 'mot-1', category: 'Motivation', icon: '🎯', text: 'Minerva students live in seven different cities over four years. What specifically about that model excites you, and how does it connect to something you want to learn that can’t be learned in a single place?' },
  { id: 'mot-2', category: 'Motivation', icon: '🎯', text: 'Imagine you’re two years into Minerva and a friend asks why you didn’t choose a traditional university. What would you tell them?' },
  { id: 'mot-3', category: 'Motivation', icon: '🎯', text: 'Minerva has no lectures — all classes are seminar-based with active participation. Describe a time you learned something more deeply through discussion or debate than you would have through a textbook.' },

  { id: 'cha-1', category: 'Challenge', icon: '🔥', text: 'Tell me about a time you committed to something difficult and wanted to quit. What kept you going, and what did you learn about yourself?' },
  { id: 'cha-2', category: 'Challenge', icon: '🔥', text: 'Describe a situation where you received feedback that was hard to hear. How did you process it, and what changed as a result?' },
  { id: 'cha-3', category: 'Challenge', icon: '🔥', text: 'Think about a failure that still stings. What would you do differently now, and why didn’t you see it at the time?' },

  { id: 'cur-1', category: 'Curiosity', icon: '🔍', text: 'What question have you been thinking about recently that doesn’t have a clear answer? Walk me through how you’ve been exploring it.' },
  { id: 'cur-2', category: 'Curiosity', icon: '🔍', text: 'Tell me about something you taught yourself outside of school. What drove you to learn it, and how did you go about it without formal instruction?' },
  { id: 'cur-3', category: 'Curiosity', icon: '🔍', text: 'If you could design a one-semester research project on any topic, what would you investigate, and why does it matter to you personally?' },

  { id: 'tea-1', category: 'Teamwork', icon: '🤝', text: 'Describe a group project where you and a teammate had fundamentally different visions. How did you navigate that disagreement without simply compromising?' },
  { id: 'tea-2', category: 'Teamwork', icon: '🤝', text: 'At Minerva, you’ll collaborate with students from 90+ countries. Tell me about a time you worked closely with someone whose background or perspective was very different from yours.' },
  { id: 'tea-3', category: 'Teamwork', icon: '🤝', text: 'Think about a team you were part of that wasn’t functioning well. What role did you play in changing the dynamic, and what did you learn about how groups work?' },

  { id: 'cre-1', category: 'Creative Thinking', icon: '💡', text: 'Pick an everyday system you interact with — transportation, education, food, anything — and tell me what’s fundamentally broken about it and how you’d redesign it from scratch.' },
  { id: 'cre-2', category: 'Creative Thinking', icon: '💡', text: 'Describe a time you solved a problem by connecting ideas from two completely unrelated fields or experiences. What made you see that connection?' },
  { id: 'cre-3', category: 'Creative Thinking', icon: '💡', text: 'If you had unlimited resources and one year, what would you build, create, or change? Walk me through your thinking — not just the "what" but the "why" and "how."' },
];

const CATEGORY_ORDER = ['Motivation', 'Challenge', 'Curiosity', 'Teamwork', 'Creative Thinking'];

const CATEGORY_COLORS = {
  'Motivation': 'red',
  'Challenge': 'purple',
  'Curiosity': 'blue',
  'Teamwork': 'green',
  'Creative Thinking': 'red',
};

const FILLER_WORDS = ['you know', 'i mean', 'um', 'uh', 'like', 'basically', 'actually', 'literally', 'so', 'right'];
const FILLER_RE = new RegExp(
  '\\b(' +
    [...FILLER_WORDS]
      .sort((a, b) => b.length - a.length)
      .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|') +
  ')\\b',
  'gi'
);

const MAX_RECORDING_SECONDS = 300; // 5 minutes
const SAMPLE_INTERVAL_MS = 500;
const DETECT_INTERVAL_MS_FAST = 66;   // ~15fps
const DETECT_INTERVAL_MS_SLOW = 133;  // ~7.5fps for slow devices
const SLOW_DEVICE_THRESHOLD_MS = 120;

const POSE_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task';
const FACE_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task';
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm';

/* ============================================================
 * Utility Functions
 * ============================================================ */

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function computePosture(landmarks) {
  if (!landmarks || landmarks.length < 13) return 50;
  const nose = landmarks[0];
  const leftEar = landmarks[7];
  const rightEar = landmarks[8];
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];

  if (!leftShoulder || !rightShoulder || !nose) return 50;

  // 1. Shoulder level (weight 0.35)
  const shoulderDiffY = Math.abs(leftShoulder.y - rightShoulder.y);
  const shoulderScore = Math.max(0, 100 - (shoulderDiffY / 0.08) * 100);

  // 2. Forward lean (weight 0.35)
  const shoulderMidZ = (leftShoulder.z + rightShoulder.z) / 2;
  const leanDelta = nose.z - shoulderMidZ;
  let leanScore;
  if (leanDelta >= -0.15 && leanDelta <= -0.02) {
    leanScore = 100;
  } else if (leanDelta > -0.02 && leanDelta <= 0.05) {
    leanScore = 100 - ((leanDelta + 0.02) / 0.07) * 50;
  } else if (leanDelta < -0.15 && leanDelta >= -0.30) {
    leanScore = 100 - ((Math.abs(leanDelta) - 0.15) / 0.15) * 60;
  } else {
    leanScore = 20;
  }

  // 3. Head tilt / centering (weight 0.30)
  const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
  const headOffsetX = Math.abs(nose.x - shoulderMidX);
  const headBaseScore = Math.max(0, 100 - (headOffsetX / 0.10) * 100);
  let earTiltPenalty = 0;
  if (leftEar && rightEar) {
    const earDiffY = Math.abs(leftEar.y - rightEar.y);
    earTiltPenalty = Math.min(40, (earDiffY / 0.06) * 40);
  }
  const headScore = Math.max(0, headBaseScore - earTiltPenalty);

  return clamp(Math.round(shoulderScore * 0.35 + leanScore * 0.35 + headScore * 0.30), 0, 100);
}

function computeEyeContact(faceLandmarks) {
  if (!faceLandmarks || faceLandmarks.length < 478) return false;

  const noseTip = faceLandmarks[1];
  const cheekR = faceLandmarks[234];
  const cheekL = faceLandmarks[454];

  // Right eye (subject's right): inner=33, outer=133
  const rEyeInner = faceLandmarks[33];
  const rEyeOuter = faceLandmarks[133];
  const rIris = faceLandmarks[468];
  const rUpperLid = faceLandmarks[159];
  const rLowerLid = faceLandmarks[145];

  // Left eye (subject's left): inner=362, outer=263
  const lEyeInner = faceLandmarks[362];
  const lEyeOuter = faceLandmarks[263];
  const lIris = faceLandmarks[473];
  const lUpperLid = faceLandmarks[386];
  const lLowerLid = faceLandmarks[374];

  if (!rEyeInner || !rEyeOuter || !rIris || !lEyeInner || !lEyeOuter || !lIris) return false;

  // Horizontal gaze ratio (0=outer, 1=inner; ideal ~0.5 centered)
  const rEyeWidth = Math.abs(rEyeInner.x - rEyeOuter.x) || 1e-6;
  const lEyeWidth = Math.abs(lEyeInner.x - lEyeOuter.x) || 1e-6;
  const rH = (rIris.x - rEyeOuter.x) / (rEyeInner.x - rEyeOuter.x);
  const lH = (lIris.x - lEyeOuter.x) / (lEyeInner.x - lEyeOuter.x);
  const avgH = (rH + lH) / 2;
  const horizontalOk = avgH >= 0.30 && avgH <= 0.70;

  // Vertical gaze ratio
  const rEyeHeight = Math.abs(rLowerLid.y - rUpperLid.y) || 1e-6;
  const lEyeHeight = Math.abs(lLowerLid.y - lUpperLid.y) || 1e-6;
  const rV = (rIris.y - rUpperLid.y) / rEyeHeight;
  const lV = (lIris.y - lUpperLid.y) / lEyeHeight;
  const avgV = (rV + lV) / 2;
  const verticalOk = avgV >= 0.20 && avgV <= 0.80;

  // Head yaw via nose offset from face center
  let yawOk = true;
  if (noseTip && cheekR && cheekL) {
    const faceCenterX = (cheekR.x + cheekL.x) / 2;
    const noseOffset = Math.abs(noseTip.x - faceCenterX);
    yawOk = noseOffset < 0.04;
  }

  // Suppress unused-var lint warnings; rEyeWidth/lEyeWidth used implicitly
  void rEyeWidth; void lEyeWidth;

  return horizontalOk && verticalOk && yawOk;
}

function getSupportedMimeType() {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4',
  ];
  for (const t of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(t)) return t;
    } catch { /* noop */ }
  }
  return '';
}

function getScoreLabel(score) {
  if (score >= 90) return { label: 'Excellent', color: 'var(--green)' };
  if (score >= 75) return { label: 'Strong', color: 'var(--green)' };
  if (score >= 60) return { label: 'Good', color: 'var(--blue)' };
  if (score >= 45) return { label: 'Developing', color: '#d97706' };
  return { label: 'Needs Work', color: 'var(--clay)' };
}

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderMarkdown(text) {
  if (!text) return '';
  const lines = text.split('\n');
  const out = [];
  let inList = false;

  for (let raw of lines) {
    let line = raw;
    if (/^\s*$/.test(line)) {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push('');
      continue;
    }

    const h3 = line.match(/^### (.+)$/);
    const h2 = line.match(/^## (.+)$/);
    const h1 = line.match(/^# (.+)$/);
    const li = line.match(/^[-*] (.+)$/);
    const numLi = line.match(/^(\d+)\.\s+(.+)$/);

    if (h1) {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push(`<h2 class="vi-md-h1">${formatInline(h1[1])}</h2>`);
    } else if (h2) {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push(`<h3 class="vi-md-h2">${formatInline(h2[1])}</h3>`);
    } else if (h3) {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push(`<h4 class="vi-md-h3">${formatInline(h3[1])}</h4>`);
    } else if (li) {
      if (!inList) { out.push('<ul class="vi-md-list">'); inList = true; }
      out.push(`<li>${formatInline(li[1])}</li>`);
    } else if (numLi) {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push(`<p class="vi-md-num"><strong>${numLi[1]}.</strong> ${formatInline(numLi[2])}</p>`);
    } else {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push(`<p class="vi-md-p">${formatInline(line)}</p>`);
    }
  }
  if (inList) out.push('</ul>');
  return out.join('\n');
}

function formatInline(s) {
  let out = escapeHtml(s);
  // Bold **text**
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Score [X]/N highlight
  out = out.replace(/\b(\d{1,3})\/(10|100)\b/g, '<span class="vi-md-score">$1/$2</span>');
  // Italic *text*
  out = out.replace(/(^|\W)\*([^*\s][^*]*?)\*(\W|$)/g, '$1<em>$2</em>$3');
  return out;
}

/* ============================================================
 * Sub-components
 * ============================================================ */

function ScoreRing({ score, size = 140, label, color }) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - clamp(score, 0, 100) / 100);
  const ringColor = color || getScoreLabel(score).color;
  return (
    <div className="vi-score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--mid-gray)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={ringColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
        />
      </svg>
      <div className="vi-score-ring-text">
        <div className="vi-score-ring-num">{score}</div>
        {label && <div className="vi-score-ring-label">{label}</div>}
      </div>
    </div>
  );
}

function MetricBar({ value, color, max = 100 }) {
  const pct = clamp((value / max) * 100, 0, 100);
  return (
    <div className="vi-bar">
      <div className="vi-bar-fill" style={{ width: `${pct}%`, background: color || 'var(--clay)' }} />
    </div>
  );
}

function CompatibilityBanner({ speechSupported, mediaPipeBlocked, onContinueWithoutMP }) {
  if (!speechSupported && !mediaPipeBlocked) {
    return (
      <div className="vi-speech-banner">
        <div className="vi-banner-title">Speech recognition unavailable</div>
        <p>Your browser doesn’t support real-time transcription. Video, posture, and eye-contact analysis will still work, but the spoken transcript and filler-word count will be unavailable. For full features, use Chrome or Edge.</p>
      </div>
    );
  }
  if (mediaPipeBlocked) {
    return (
      <div className="vi-error-banner">
        <div className="vi-banner-title">Pose & face detection failed to load</div>
        <p>We couldn’t initialize the in-browser detection models. You can continue with video and transcript-only analysis.</p>
        <button type="button" className="btn-secondary" onClick={onContinueWithoutMP}>Continue without pose analysis</button>
      </div>
    );
  }
  return null;
}

function ErrorBanner({ message, onRetry, onDismiss }) {
  if (!message) return null;
  return (
    <div className="vi-error-banner">
      <div className="vi-banner-title">Something went wrong</div>
      <p>{message}</p>
      <div className="vi-banner-actions">
        {onRetry && <button type="button" className="btn-primary" onClick={onRetry}>Retry</button>}
        {onDismiss && <button type="button" className="btn-secondary" onClick={onDismiss}>Dismiss</button>}
      </div>
    </div>
  );
}

function SetupScreen({
  selectedQuestion,
  onSelectQuestion,
  onEnableCamera,
  cameraReady,
  modelsLoaded,
  modelLoadProgress,
  modelLoadFailed,
  onContinueWithoutMP,
  speechSupported,
  videoRef,
  onStartRecording,
  onRetryCamera,
  error,
  dismissError,
}) {
  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    color: CATEGORY_COLORS[cat],
    items: QUESTIONS.filter((q) => q.category === cat),
  }));

  const canStart = !!selectedQuestion && !!cameraReady && (modelsLoaded || modelLoadFailed);

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Video <span>Interview Practice</span></h1>
          <p>Record yourself answering Minerva-style questions. Get real-time feedback on posture, eye contact, speaking pace, and filler words — plus an AI coaching review of your answer.</p>
        </div>
      </section>

      <section>
        <div className="container">
          <div className="section-label">Step 1</div>
          <h2 className="section-title">Choose a question</h2>
          <p className="section-subtitle">Pick a category and a question that resonates with what you want to practice. Each is designed to mirror the kind of prompt you might face in a real Minerva interview.</p>

          {grouped.map(({ category, color, items }) => (
            <div key={category} className="vi-cat-section">
              <div className="vi-cat-header">
                <span className={`vi-cat-pill vi-cat-${color}`}>{category}</span>
              </div>
              <div className="vi-question-grid">
                {items.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    className={`vi-question-card${selectedQuestion?.id === q.id ? ' selected' : ''}`}
                    onClick={() => onSelectQuestion(q)}
                  >
                    <div className={`vi-question-icon vi-cat-${color}-bg`}>{q.icon}</div>
                    <p>{q.text}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="alt-bg">
        <div className="container">
          <div className="section-label">Step 2</div>
          <h2 className="section-title">Enable your camera</h2>
          <p className="section-subtitle">We use your webcam and microphone to analyze posture, eye contact, and speech. Everything runs in your browser — video and audio never leave your device, except for the transcript text we send to Claude for content feedback.</p>

          <CompatibilityBanner
            speechSupported={speechSupported}
            mediaPipeBlocked={modelLoadFailed}
            onContinueWithoutMP={onContinueWithoutMP}
          />

          <ErrorBanner message={error} onRetry={error?.includes('denied') || error?.includes('camera') ? onRetryCamera : null} onDismiss={dismissError} />

          {!cameraReady && (
            <div className="vi-permission-card">
              <div className="vi-permission-text">
                <h3>Grant camera & microphone access</h3>
                <p>Click the button below. Your browser will ask for permission — please allow both camera and microphone for the full experience.</p>
              </div>
              <button type="button" className="btn-primary vi-enable-btn" onClick={onEnableCamera}>Enable Camera</button>
            </div>
          )}

          {cameraReady && (
            <div className="vi-preview-block">
              <div className="vi-video-container vi-video-preview">
                <video ref={videoRef} autoPlay playsInline muted className="vi-video" />
                {!modelsLoaded && !modelLoadFailed && (
                  <div className="vi-loading-overlay">
                    <div className="vi-loading-dots"><span /><span /><span /></div>
                    <div className="vi-loading-text">{modelLoadProgress}</div>
                  </div>
                )}
              </div>
              <div className="vi-preview-meta">
                <div className="vi-meta-row">
                  <span className={`vi-status-dot ${cameraReady ? 'on' : ''}`} />
                  <span>Camera & microphone connected</span>
                </div>
                <div className="vi-meta-row">
                  <span className={`vi-status-dot ${modelsLoaded ? 'on' : modelLoadFailed ? 'fail' : ''}`} />
                  <span>{modelsLoaded ? 'Pose & face detection ready' : modelLoadFailed ? 'Pose & face detection failed' : modelLoadProgress || 'Loading detection models…'}</span>
                </div>
                <div className="vi-meta-row">
                  <span className={`vi-status-dot ${speechSupported ? 'on' : 'warn'}`} />
                  <span>{speechSupported ? 'Speech recognition ready' : 'Speech recognition unavailable (video-only mode)'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="container">
          <div className="section-label">Step 3</div>
          <h2 className="section-title">Start your response</h2>
          <p className="section-subtitle">When you’re ready, click below. The recording can run up to 5 minutes — most strong responses are 90–180 seconds. Speak as if you’re in the actual interview.</p>

          {selectedQuestion && (
            <div className="vi-selected-q">
              <div className="vi-selected-q-label">Your question</div>
              <p>{selectedQuestion.text}</p>
            </div>
          )}

          <div className="vi-start-row">
            <button
              type="button"
              className="btn-primary vi-start-btn"
              disabled={!canStart}
              onClick={onStartRecording}
            >
              Start Recording
            </button>
            {!canStart && (
              <p className="vi-start-hint">
                {!selectedQuestion && 'Select a question above to continue.'}
                {selectedQuestion && !cameraReady && 'Enable your camera to continue.'}
                {selectedQuestion && cameraReady && !modelsLoaded && !modelLoadFailed && 'Waiting for detection models to finish loading…'}
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function RecordingScreen({
  question,
  recordingTime,
  livePosture,
  liveEyeContact,
  liveWpm,
  liveFillerCount,
  speechSupported,
  videoRef,
  canvasRef,
  interimText,
  onStop,
}) {
  const postureLabel = getScoreLabel(livePosture);
  return (
    <section className="vi-recording-section">
      <div className="container">
        <div className="vi-recording-header">
          <div className="vi-rec-question">
            <div className="vi-cat-pill vi-cat-red vi-cat-pill-small">{question.category}</div>
            <p>{question.text}</p>
          </div>
          <div className="vi-rec-status">
            <div className="vi-rec-indicator">
              <span className="vi-rec-dot" />
              <span>REC</span>
            </div>
            <div className="vi-timer">{formatTime(recordingTime)}</div>
          </div>
        </div>

        <div className="vi-recording-layout">
          <div className="vi-video-container vi-video-recording">
            <video ref={videoRef} autoPlay playsInline muted className="vi-video" />
            <canvas ref={canvasRef} className="vi-overlay-canvas" />
          </div>

          <div className="vi-metrics-sidebar">
            <h3 className="vi-sidebar-title">Live feedback</h3>

            <div className="vi-metric-row">
              <div className="vi-metric-label">Posture</div>
              <div className="vi-metric-value" style={{ color: postureLabel.color }}>{livePosture}</div>
              <MetricBar value={livePosture} color={postureLabel.color} />
              <div className="vi-metric-sub">{postureLabel.label}</div>
            </div>

            <div className="vi-metric-row">
              <div className="vi-metric-label">Eye Contact</div>
              <div className="vi-eye-row">
                <span className={`vi-eye-dot ${liveEyeContact ? 'on' : 'off'}`} />
                <span style={{ color: liveEyeContact ? 'var(--green)' : 'var(--clay)' }}>
                  {liveEyeContact ? 'Looking at camera' : 'Look at the lens'}
                </span>
              </div>
            </div>

            <div className="vi-metric-row">
              <div className="vi-metric-label">Pace</div>
              <div className="vi-metric-value">{speechSupported ? (liveWpm || 0) : '—'}</div>
              <div className="vi-metric-sub">{speechSupported ? 'words per minute' : 'speech unavailable'}</div>
            </div>

            <div className="vi-metric-row">
              <div className="vi-metric-label">Filler words</div>
              <div className="vi-metric-value">{speechSupported ? liveFillerCount : '—'}</div>
              <div className="vi-metric-sub">{speechSupported ? 'um, uh, like, etc.' : 'speech unavailable'}</div>
            </div>

            {speechSupported && interimText && (
              <div className="vi-interim">
                <div className="vi-metric-label">You said…</div>
                <p>{interimText}</p>
              </div>
            )}

            <button type="button" className="btn-primary vi-stop-btn" onClick={onStop}>Stop & Analyze</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function AnalysisScreen({
  question,
  metrics,
  recordingUrl,
  downloadFilename,
  transcript,
  analysisText,
  analysisLoading,
  analysisError,
  onRestart,
  onRetryAnalysis,
  endedEarly,
}) {
  const { overall, posture_avg, eye_contact_pct, wpm_avg, filler_count, total_words, duration_sec, fillerScore, paceScore, speechAvailable, poorPostureMoments } = metrics;
  const overallLabel = getScoreLabel(overall);

  // Compute top-3 tips locally based on weakest dimensions
  const dimensions = [
    { key: 'posture', score: posture_avg, label: 'Posture' },
    { key: 'eye', score: eye_contact_pct, label: 'Eye contact' },
    ...(speechAvailable ? [
      { key: 'pace', score: paceScore, label: 'Pace' },
      { key: 'fillers', score: fillerScore, label: 'Filler words' },
    ] : []),
  ].sort((a, b) => a.score - b.score);

  const TIP_LIBRARY = {
    posture: 'Sit up tall with shoulders relaxed and a slight forward lean. Imagine a string lifting the crown of your head. Reset your posture every time you start a new sentence.',
    eye: 'On video, looking at the camera lens reads as eye contact — not looking at your own face on screen. Try a sticky note arrow next to the lens, or move your video preview window directly under the camera.',
    pace: wpm_avg < 130
      ? 'Your pace is slower than the conversational sweet spot of 130–160 WPM. Add a touch more energy and connect ideas more crisply — silence between sentences is fine, but within a sentence, keep momentum.'
      : 'You’re speaking faster than the conversational sweet spot of 130–160 WPM. Slow down at the start and end of each sentence — those are the moments interviewers process your meaning.',
    fillers: 'Replace fillers with silence. When you feel an "um" coming, take a breath instead. Silence reads as thoughtfulness; fillers read as nerves.',
  };
  const SHARED_TIP = 'Practice this exact question 3–5 times. The first take is rarely your best — each repetition lets you tighten your structure and find your strongest example.';
  const tips = [
    ...dimensions.slice(0, 2).map((d) => ({ title: `Improve your ${d.label.toLowerCase()}`, body: TIP_LIBRARY[d.key] })),
    { title: 'Rerun this question', body: SHARED_TIP },
  ];

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Your <span>analysis</span></h1>
          <p>Detailed feedback on what you said and how you said it. Use this to refine your delivery before your real interview.</p>
        </div>
      </section>

      {endedEarly && (
        <section>
          <div className="container">
            <div className="vi-warning-banner">Recording ended early due to an interruption. Analysis is based on partial data — try again for a complete reading.</div>
          </div>
        </section>
      )}

      <section>
        <div className="container">
          <div className="vi-overall-card">
            <ScoreRing score={overall} size={170} label={overallLabel.label} color={overallLabel.color} />
            <div className="vi-overall-text">
              <div className="vi-cat-pill vi-cat-red vi-cat-pill-small">{question.category}</div>
              <p className="vi-overall-q">{question.text}</p>
              <div className="vi-overall-meta">
                <span>{formatTime(duration_sec)}</span>
                <span>·</span>
                <span>{total_words} words</span>
                {speechAvailable && wpm_avg > 0 && (<><span>·</span><span>{wpm_avg} WPM</span></>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="alt-bg">
        <div className="container">
          <div className="section-label">Delivery metrics</div>
          <h2 className="section-title">How you came across</h2>

          <div className="vi-metrics-grid">
            <div className="stat-card vi-metric-card">
              <div className="stat-value" style={{ color: getScoreLabel(posture_avg).color }}>{posture_avg}</div>
              <div className="stat-label">Posture / 100</div>
              <MetricBar value={posture_avg} color={getScoreLabel(posture_avg).color} />
              <p className="vi-metric-card-note">{getScoreLabel(posture_avg).label}</p>
            </div>

            <div className="stat-card vi-metric-card">
              <div className="stat-value" style={{ color: getScoreLabel(eye_contact_pct).color }}>{eye_contact_pct}%</div>
              <div className="stat-label">Eye contact</div>
              <MetricBar value={eye_contact_pct} color={getScoreLabel(eye_contact_pct).color} />
              <p className="vi-metric-card-note">{getScoreLabel(eye_contact_pct).label}</p>
            </div>

            {speechAvailable ? (
              <>
                <div className="stat-card vi-metric-card">
                  <div className="stat-value" style={{ color: getScoreLabel(paceScore).color }}>{wpm_avg}</div>
                  <div className="stat-label">WPM</div>
                  <MetricBar value={paceScore} color={getScoreLabel(paceScore).color} />
                  <p className="vi-metric-card-note">{wpm_avg < 130 ? 'Below 130–160 ideal' : wpm_avg > 160 ? 'Above 130–160 ideal' : 'In the ideal 130–160 range'}</p>
                </div>
                <div className="stat-card vi-metric-card">
                  <div className="stat-value" style={{ color: getScoreLabel(fillerScore).color }}>{filler_count}</div>
                  <div className="stat-label">Filler words</div>
                  <MetricBar value={fillerScore} color={getScoreLabel(fillerScore).color} />
                  <p className="vi-metric-card-note">{total_words > 0 ? `${((filler_count / total_words) * 100).toFixed(1)} per 100 words` : '—'}</p>
                </div>
              </>
            ) : (
              <div className="stat-card vi-metric-card vi-metric-card-na">
                <div className="stat-value">—</div>
                <div className="stat-label">Speech metrics</div>
                <p className="vi-metric-card-note">Speech recognition was unavailable in this browser. Use Chrome or Edge to capture WPM and filler-word data.</p>
              </div>
            )}
          </div>

          {poorPostureMoments && poorPostureMoments.length > 0 && (
            <div className="tip-box">
              <h4>Posture timeline</h4>
              <p>You dipped below a passing posture score at: {poorPostureMoments.map((m) => `${formatTime(Math.round(m.start / 1000))}–${formatTime(Math.round(m.end / 1000))}`).join(', ')}. Watch the playback at those moments to see what your body did.</p>
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="container">
          <div className="section-label">Quick wins</div>
          <h2 className="section-title">Top 3 things to work on</h2>
          <div className="vi-tips-grid">
            {tips.map((t, i) => (
              <div key={i} className="card vi-tip-card">
                <div className="vi-tip-num">{i + 1}</div>
                <h3>{t.title}</h3>
                <p>{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="alt-bg">
        <div className="container">
          <div className="section-label">Coach review</div>
          <h2 className="section-title">Claude’s detailed analysis</h2>
          <p className="section-subtitle">An experienced Minerva interview coach has read your transcript and analyzed your delivery metrics. Here’s their full review.</p>

          {analysisError && !analysisText && (
            <ErrorBanner message={analysisError} onRetry={onRetryAnalysis} />
          )}

          {analysisLoading && !analysisText && (
            <div className="vi-analysis-loading">
              <div className="vi-loading-dots"><span /><span /><span /></div>
              <p>Generating your coaching review…</p>
            </div>
          )}

          {analysisText && (
            <div
              className="vi-analysis-content insights-card"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(analysisText) }}
            />
          )}
        </div>
      </section>

      {recordingUrl && (
        <section>
          <div className="container">
            <div className="section-label">Watch yourself</div>
            <h2 className="section-title">Playback</h2>
            <p className="section-subtitle">Watching the recording is uncomfortable but invaluable. Note when your posture slips, when your eyes drift, and which sentences you’d rephrase.</p>
            <div className="vi-playback-container">
              <video src={recordingUrl} controls playsInline className="vi-playback-video" />
            </div>
            {transcript && (
              <details className="vi-transcript-block">
                <summary>Show transcript</summary>
                <p>{transcript}</p>
              </details>
            )}
          </div>
        </section>
      )}

      <section>
        <div className="container vi-cta-row">
          <button type="button" className="btn-primary vi-cta-btn" onClick={onRestart}>Practice another question</button>
          {recordingUrl && (
            <a href={recordingUrl} download={downloadFilename} className="btn-secondary vi-cta-btn">Download recording</a>
          )}
        </div>
      </section>
    </>
  );
}

/* ============================================================
 * Main Page Component
 * ============================================================ */

export default function VideoInterviewPage() {
  // Screen state
  const [screen, setScreen] = useState('setup');
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  // Setup state
  const [cameraReady, setCameraReady] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelLoadProgress, setModelLoadProgress] = useState('');
  const [modelLoadFailed, setModelLoadFailed] = useState(false);
  const [skipPoseAnalysis, setSkipPoseAnalysis] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  // Live recording state
  const [recordingTime, setRecordingTime] = useState(0);
  const [livePosture, setLivePosture] = useState(0);
  const [liveEyeContact, setLiveEyeContact] = useState(false);
  const [liveWpm, setLiveWpm] = useState(0);
  const [liveFillerCount, setLiveFillerCount] = useState(0);
  const [interimText, setInterimText] = useState('');

  // Analysis state
  const [analysisMetrics, setAnalysisMetrics] = useState(null);
  const [analysisText, setAnalysisText] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [endedEarly, setEndedEarly] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState(null);
  const [recordingMime, setRecordingMime] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [downloadFilename, setDownloadFilename] = useState('');

  // Errors
  const [error, setError] = useState(null);

  // DOM refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Stream / recorder refs
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  // MediaPipe refs
  const poseLandmarkerRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const drawingUtilsRef = useRef(null);
  const PoseLandmarkerClassRef = useRef(null);
  const poseConnectionsRef = useRef(null);

  // Speech refs
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');
  const interimRef = useRef('');
  const fillerCountRef = useRef(0);
  const countedSpeechIndicesRef = useRef(new Set());
  const wordTimestampsRef = useRef([]);

  // Loop refs
  const isRunningRef = useRef(false);
  const rafIdRef = useRef(0);
  const lastDetectTimeRef = useRef(0);
  const targetIntervalRef = useRef(DETECT_INTERVAL_MS_FAST);
  const detectDurationsRef = useRef([]);
  const recordingStartTimeRef = useRef(0);
  const timerIntervalRef = useRef(null);
  const samplerIntervalRef = useRef(null);

  // Live metrics refs (written by rAF, read by sampler)
  const currentPostureRef = useRef(0);
  const currentEyeContactRef = useRef(false);
  const currentWpmRef = useRef(0);
  const timelineRef = useRef([]);

  // Recording finalization
  const stopOnceRef = useRef(false);
  const selectedQuestionRef = useRef(null);
  const stopRecordingRef = useRef(() => {});

  /* ----------- Initial speech-API check ----------- */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) setSpeechSupported(false);
  }, []);

  /* ----------- Persist selectedQuestion to ref ----------- */
  useEffect(() => {
    selectedQuestionRef.current = selectedQuestion;
  }, [selectedQuestion]);

  /* ----------- Page visibility: pause rAF when hidden ----------- */
  useEffect(() => {
    function onVis() {
      if (document.visibilityState === 'hidden') {
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      } else if (isRunningRef.current) {
        rafIdRef.current = requestAnimationFrame(detectionLoopRef.current);
      }
    }
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  /* ----------- Stable detection loop (via ref) ----------- */
  const detectionLoopRef = useRef(() => {});
  useEffect(() => {
    detectionLoopRef.current = function detectionLoop() {
      if (!isRunningRef.current) return;
      const now = performance.now();
      const interval = targetIntervalRef.current;
      if (now - lastDetectTimeRef.current >= interval) {
        lastDetectTimeRef.current = now;
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (video && video.readyState >= 2 && canvas) {
          // Resize canvas to match video display size
          const rect = video.getBoundingClientRect();
          const dpr = window.devicePixelRatio || 1;
          const targetW = Math.round(rect.width * dpr);
          const targetH = Math.round(rect.height * dpr);
          if (canvas.width !== targetW) canvas.width = targetW;
          if (canvas.height !== targetH) canvas.height = targetH;
          canvas.style.width = `${rect.width}px`;
          canvas.style.height = `${rect.height}px`;

          const ctx = canvas.getContext('2d');
          ctx.save();
          ctx.scale(dpr, dpr);
          ctx.clearRect(0, 0, rect.width, rect.height);

          const detectStart = performance.now();
          let drewPose = false;

          // Pose detection
          if (poseLandmarkerRef.current) {
            try {
              const poseResult = poseLandmarkerRef.current.detectForVideo(video, now);
              if (poseResult?.landmarks?.[0]) {
                const lm = poseResult.landmarks[0];
                currentPostureRef.current = computePosture(lm);

                // Draw skeleton: convert normalized coords to canvas display pixels
                const cw = rect.width;
                const ch = rect.height;
                if (drawingUtilsRef.current && poseConnectionsRef.current) {
                  // Use DrawingUtils with coordinate-aware draw
                  // Draw connectors manually for explicit control:
                  ctx.strokeStyle = 'rgba(232, 116, 93, 0.85)';
                  ctx.lineWidth = 2.5;
                  for (const [a, b] of poseConnectionsRef.current) {
                    const A = lm[a.start ?? a];
                    const B = lm[a.end ?? b];
                    if (!A || !B) continue;
                    if ((A.visibility ?? 1) < 0.3 || (B.visibility ?? 1) < 0.3) continue;
                    ctx.beginPath();
                    ctx.moveTo(A.x * cw, A.y * ch);
                    ctx.lineTo(B.x * cw, B.y * ch);
                    ctx.stroke();
                  }
                  ctx.fillStyle = '#c8553d';
                  for (const p of lm) {
                    if ((p.visibility ?? 1) < 0.3) continue;
                    ctx.beginPath();
                    ctx.arc(p.x * cw, p.y * ch, 3, 0, Math.PI * 2);
                    ctx.fill();
                  }
                  drewPose = true;
                }
              }
            } catch { /* per-frame error; ignore */ }
          }

          // Face detection
          if (faceLandmarkerRef.current) {
            try {
              const faceResult = faceLandmarkerRef.current.detectForVideo(video, now);
              if (faceResult?.faceLandmarks?.[0]) {
                currentEyeContactRef.current = computeEyeContact(faceResult.faceLandmarks[0]);
              }
            } catch { /* per-frame error; ignore */ }
          }

          // Adaptive performance tracking
          const dur = performance.now() - detectStart;
          detectDurationsRef.current.push(dur);
          if (detectDurationsRef.current.length > 10) detectDurationsRef.current.shift();
          if (detectDurationsRef.current.length === 10) {
            const avg = detectDurationsRef.current.reduce((s, x) => s + x, 0) / 10;
            if (avg > SLOW_DEVICE_THRESHOLD_MS) {
              targetIntervalRef.current = DETECT_INTERVAL_MS_SLOW;
            }
          }

          if (!drewPose) {
            // No-op: canvas was cleared above
          }

          ctx.restore();

          // Update live WPM ref (cheap)
          updateRollingWpm();
        }
      }
      rafIdRef.current = requestAnimationFrame(detectionLoopRef.current);
    };
  });

  function updateRollingWpm() {
    const now = Date.now();
    const windowMs = 30_000;
    wordTimestampsRef.current = wordTimestampsRef.current.filter((w) => now - w >= 0 && now - w <= windowMs);
    const elapsedMs = Math.max(1, now - recordingStartTimeRef.current);
    const refSpan = Math.min(windowMs, elapsedMs);
    const wpm = wordTimestampsRef.current.length > 0
      ? Math.round((wordTimestampsRef.current.length / refSpan) * 60_000)
      : 0;
    currentWpmRef.current = wpm;
  }

  /* ----------- Camera initialization ----------- */
  const enableCamera = useCallback(async () => {
    setError(null);
    let constraints = {
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 }, facingMode: 'user' },
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    };
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e) {
        if (e?.name === 'OverconstrainedError') {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        } else {
          throw e;
        }
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraReady(true);

      // Detect track-ended (e.g., camera unplugged)
      stream.getVideoTracks().forEach((t) => {
        t.addEventListener('ended', () => {
          if (isRunningRef.current) {
            setEndedEarly(true);
            stopRecordingRef.current();
          }
        });
      });
    } catch (e) {
      const name = e?.name;
      if (name === 'NotAllowedError') {
        setError('Camera and microphone access was denied. Please enable both in your browser settings, then click Retry.');
      } else if (name === 'NotFoundError') {
        setError('No camera or microphone found. Please connect a device and click Retry.');
      } else if (name === 'NotReadableError') {
        setError('Your camera or microphone is in use by another application. Close it and click Retry.');
      } else {
        setError(`Could not access camera: ${e?.message || name || 'unknown error'}`);
      }
    }
  }, []);

  /* ----------- Load MediaPipe models when camera is ready ----------- */
  useEffect(() => {
    if (!cameraReady) return;
    if (modelsLoaded || modelLoadFailed || skipPoseAnalysis) return;
    let cancelled = false;

    async function load() {
      try {
        setModelLoadProgress('Loading vision framework…');
        const mp = await import('@mediapipe/tasks-vision');
        if (cancelled) return;
        const { PoseLandmarker, FaceLandmarker, FilesetResolver, DrawingUtils } = mp;
        const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
        if (cancelled) return;

        setModelLoadProgress('Loading pose detection model…');
        const pose = await PoseLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: POSE_MODEL_URL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numPoses: 1,
        });
        if (cancelled) { pose.close?.(); return; }
        poseLandmarkerRef.current = pose;
        PoseLandmarkerClassRef.current = PoseLandmarker;
        // POSE_CONNECTIONS structure: array of {start, end} or [a,b]
        poseConnectionsRef.current = PoseLandmarker.POSE_CONNECTIONS || [];

        setModelLoadProgress('Loading face detection model…');
        const face = await FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: FACE_MODEL_URL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numFaces: 1,
        });
        if (cancelled) { face.close?.(); return; }
        faceLandmarkerRef.current = face;

        // DrawingUtils kept for later/optional use
        drawingUtilsRef.current = DrawingUtils;

        setModelsLoaded(true);
        setModelLoadProgress('Ready');
      } catch (e) {
        if (cancelled) return;
        console.error('[video-interview] MediaPipe load failed:', e);
        setModelLoadFailed(true);
        setModelLoadProgress('');
      }
    }
    load();
    return () => { cancelled = true; };
  }, [cameraReady, modelsLoaded, modelLoadFailed, skipPoseAnalysis]);

  function handleContinueWithoutMP() {
    setSkipPoseAnalysis(true);
    setModelLoadFailed(false);
  }

  /* ----------- Speech recognition init helper ----------- */
  function initSpeech() {
    if (!speechSupported) return null;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = 'en-US';
    r.maxAlternatives = 1;

    r.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          if (!countedSpeechIndicesRef.current.has(i)) {
            countedSpeechIndicesRef.current.add(i);
            const matches = text.match(FILLER_RE);
            if (matches) {
              fillerCountRef.current += matches.length;
            }
            // Add words with timestamps for rolling WPM
            const now = Date.now();
            const words = text.trim().split(/\s+/).filter(Boolean);
            for (let w = 0; w < words.length; w++) {
              wordTimestampsRef.current.push(now);
            }
            transcriptRef.current += text;
          }
        } else {
          interim += text;
        }
      }
      interimRef.current = interim;
      setInterimText(interim);
    };

    r.onerror = (event) => {
      // 'no-speech' and 'aborted' are recoverable; ignore network/permission noise
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setSpeechSupported(false);
      }
    };

    r.onend = () => {
      // Auto-restart while recording
      if (isRunningRef.current && recognitionRef.current === r) {
        try {
          r.start();
        } catch { /* InvalidStateError if already running; safe to ignore */ }
      }
    };

    return r;
  }

  /* ----------- Start recording ----------- */
  const startRecording = useCallback(() => {
    if (!streamRef.current || !selectedQuestion) return;
    setError(null);
    setEndedEarly(false);
    setAnalysisError(null);
    setAnalysisText('');
    setRecordingUrl((u) => { if (u) URL.revokeObjectURL(u); return null; });
    setRecordingMime('');

    // Reset metric refs
    transcriptRef.current = '';
    interimRef.current = '';
    setInterimText('');
    fillerCountRef.current = 0;
    countedSpeechIndicesRef.current = new Set();
    wordTimestampsRef.current = [];
    timelineRef.current = [];
    currentPostureRef.current = 0;
    currentEyeContactRef.current = false;
    currentWpmRef.current = 0;
    detectDurationsRef.current = [];
    targetIntervalRef.current = DETECT_INTERVAL_MS_FAST;
    chunksRef.current = [];
    stopOnceRef.current = false;

    setLivePosture(0);
    setLiveEyeContact(false);
    setLiveWpm(0);
    setLiveFillerCount(0);
    setRecordingTime(0);

    recordingStartTimeRef.current = Date.now();

    // 1. Set up MediaRecorder
    const mime = getSupportedMimeType();
    setRecordingMime(mime);
    try {
      const recOpts = mime ? { mimeType: mime, videoBitsPerSecond: 2_500_000 } : { videoBitsPerSecond: 2_500_000 };
      const recorder = new MediaRecorder(streamRef.current, recOpts);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        try {
          const blob = new Blob(chunksRef.current, { type: mime || 'video/webm' });
          if (blob.size > 0) {
            const url = URL.createObjectURL(blob);
            setRecordingUrl(url);
          }
        } catch { /* ignore */ }
      };
      recorder.onerror = () => {
        // best-effort
      };
      recorder.start(1000);
      recorderRef.current = recorder;
    } catch (e) {
      setError(`Could not start recording: ${e.message || e}`);
      return;
    }

    // 2. Speech recognition
    if (speechSupported) {
      const r = initSpeech();
      if (r) {
        recognitionRef.current = r;
        try { r.start(); } catch { /* ignore InvalidStateError */ }
      }
    }

    // 3. Start detection loop
    if (!skipPoseAnalysis && (poseLandmarkerRef.current || faceLandmarkerRef.current)) {
      isRunningRef.current = true;
      lastDetectTimeRef.current = 0;
      rafIdRef.current = requestAnimationFrame(detectionLoopRef.current);
    } else {
      isRunningRef.current = true; // still true so onend auto-restart works
    }

    // 4. Timer (1s)
    timerIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
      setRecordingTime(elapsed);
      if (elapsed >= MAX_RECORDING_SECONDS) {
        stopRecordingRef.current();
      }
    }, 1000);

    // 5. Sampler (500ms) -- captures timeline + updates display state
    samplerIntervalRef.current = setInterval(() => {
      const t = Date.now() - recordingStartTimeRef.current;
      timelineRef.current.push({
        t,
        posture: currentPostureRef.current,
        eyeContact: currentEyeContactRef.current,
        wpm: currentWpmRef.current,
      });
      setLivePosture(currentPostureRef.current);
      setLiveEyeContact(currentEyeContactRef.current);
      setLiveWpm(currentWpmRef.current);
      setLiveFillerCount(fillerCountRef.current);
    }, SAMPLE_INTERVAL_MS);

    setScreen('recording');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedQuestion, speechSupported, skipPoseAnalysis]);

  /* ----------- Stop recording & teardown ----------- */
  const stopRecording = useCallback(() => {
    if (stopOnceRef.current) return;
    stopOnceRef.current = true;

    // 1. Stop detection loop
    isRunningRef.current = false;
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);

    // 2. Stop speech recognition (null onend FIRST to prevent restart)
    if (recognitionRef.current) {
      const r = recognitionRef.current;
      r.onend = null;
      try { r.abort(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }

    // 3. Clear intervals
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
    if (samplerIntervalRef.current) { clearInterval(samplerIntervalRef.current); samplerIntervalRef.current = null; }

    // 4. Stop MediaRecorder (final ondataavailable + onstop fire)
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try { recorderRef.current.stop(); } catch { /* ignore */ }
    }

    // 5. Stop stream tracks
    if (streamRef.current) {
      try { streamRef.current.getTracks().forEach((t) => t.stop()); } catch { /* ignore */ }
      streamRef.current = null;
    }

    // 6. Clear video element
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraReady(false);

    // 7. Aggregate metrics
    const aggregated = aggregateMetrics();
    setAnalysisMetrics(aggregated);

    // 8. Snapshot transcript + filename to state
    const snapshotTranscript = transcriptRef.current;
    setFinalTranscript(snapshotTranscript);
    const ext = recordingMime?.includes('mp4') ? 'mp4' : 'webm';
    setDownloadFilename(`minerva-interview-${Date.now()}.${ext}`);

    // 9. Transition to analysis & fire Claude call
    setScreen('analysis');
    if (selectedQuestionRef.current && snapshotTranscript.trim().length >= 10) {
      fetchAnalysis(selectedQuestionRef.current.text, snapshotTranscript, aggregated);
    } else if (snapshotTranscript.trim().length < 10 && speechSupported) {
      setAnalysisError('Your spoken response was too short for AI content review. The delivery metrics above are still based on what we captured.');
    } else if (!speechSupported) {
      setAnalysisError('Content review requires speech recognition, which is not available in this browser. The delivery metrics above are still accurate.');
    }
  }, [speechSupported, recordingMime]);

  // Wire stopRecordingRef so earlier-defined functions can call it
  useEffect(() => {
    stopRecordingRef.current = stopRecording;
  }, [stopRecording]);

  /* ----------- Aggregate metrics ----------- */
  function aggregateMetrics() {
    const tl = timelineRef.current;
    const lastT = tl.length ? tl[tl.length - 1].t : 0;
    const duration_sec = Math.max(0, Math.round(lastT / 1000));
    const total_words = transcriptRef.current.trim() ? transcriptRef.current.trim().split(/\s+/).filter(Boolean).length : 0;

    let posture_avg = 0;
    let eye_contact_pct = 0;
    let wpm_avg = 0;
    let speechAvailable = speechSupported && total_words > 0;

    if (tl.length > 0) {
      // Posture: average over all samples (excluding zeros from before face was detected)
      const validPosture = tl.filter((s) => s.posture > 0);
      posture_avg = validPosture.length > 0
        ? Math.round(validPosture.reduce((s, x) => s + x.posture, 0) / validPosture.length)
        : 0;

      // Eye contact percent
      eye_contact_pct = Math.round((tl.filter((s) => s.eyeContact).length / tl.length) * 100);

      // WPM average (over samples where wpm > 0, after first 3 seconds)
      const wpmSamples = tl.filter((s) => s.wpm > 0 && s.t > 3000);
      wpm_avg = wpmSamples.length > 0
        ? Math.round(wpmSamples.reduce((s, x) => s + x.wpm, 0) / wpmSamples.length)
        : 0;
    }

    const filler_count = fillerCountRef.current;

    // Filler score
    const fillersPer100 = total_words > 0 ? (filler_count / total_words) * 100 : 0;
    const fillerScore = Math.max(0, Math.round(100 - (fillersPer100 / 15) * 100));

    // Pace score
    let paceScore = 100;
    if (wpm_avg > 0) {
      if (wpm_avg < 130) {
        paceScore = Math.max(0, Math.round(100 - ((130 - wpm_avg) / 10) * 15));
      } else if (wpm_avg > 160) {
        paceScore = Math.max(0, Math.round(100 - ((wpm_avg - 160) / 10) * 12));
      }
    } else {
      paceScore = 0;
    }

    // Composite overall
    let overall;
    if (speechAvailable) {
      overall = Math.round(posture_avg * 0.25 + eye_contact_pct * 0.25 + fillerScore * 0.25 + paceScore * 0.25);
    } else {
      overall = Math.round(posture_avg * 0.5 + eye_contact_pct * 0.5);
    }

    // Poor posture moments (runs of 3+ samples below 50)
    const poorPostureMoments = [];
    let runStart = -1;
    for (let i = 0; i <= tl.length; i++) {
      const isPoor = i < tl.length && tl[i].posture > 0 && tl[i].posture < 50;
      if (isPoor && runStart < 0) {
        runStart = i;
      } else if (!isPoor && runStart >= 0) {
        const runLen = i - runStart;
        if (runLen >= 3) {
          poorPostureMoments.push({ start: tl[runStart].t, end: tl[i - 1].t });
        }
        runStart = -1;
      }
    }

    return {
      overall,
      posture_avg,
      eye_contact_pct,
      wpm_avg,
      filler_count,
      total_words,
      duration_sec,
      fillerScore,
      paceScore,
      speechAvailable,
      poorPostureMoments,
    };
  }

  /* ----------- Fetch Claude analysis ----------- */
  const fetchAnalysis = useCallback(async (questionText, transcript, metrics) => {
    setAnalysisLoading(true);
    setAnalysisText('');
    setAnalysisError(null);
    try {
      const payload = {
        question: questionText,
        transcript,
        metrics: {
          duration_sec: metrics.duration_sec,
          total_words: metrics.total_words,
          posture_avg: metrics.posture_avg,
          eye_contact_pct: metrics.eye_contact_pct,
          ...(metrics.speechAvailable ? {
            filler_count: metrics.filler_count,
            wpm_avg: metrics.wpm_avg,
          } : {}),
        },
      };
      const res = await fetch('/api/interview-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Analysis request failed (${res.status})`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setAnalysisText(accumulated);
      }
      const tail = decoder.decode();
      if (tail) {
        accumulated += tail;
        setAnalysisText(accumulated);
      }
      const errMatch = accumulated.match(/\n\n\[ERROR\]:\s*(.*)$/s);
      if (errMatch) {
        setAnalysisText('');
        throw new Error(errMatch[1].trim() || 'Stream interrupted before completion.');
      }
    } catch (e) {
      setAnalysisError(e.message || 'Could not generate analysis.');
    } finally {
      setAnalysisLoading(false);
    }
  }, []);

  const retryAnalysis = useCallback(() => {
    if (selectedQuestionRef.current && transcriptRef.current && analysisMetrics) {
      fetchAnalysis(selectedQuestionRef.current.text, transcriptRef.current, analysisMetrics);
    }
  }, [analysisMetrics, fetchAnalysis]);

  /* ----------- Restart flow ----------- */
  const restart = useCallback(() => {
    // Cleanup existing recording URL
    setRecordingUrl((u) => { if (u) URL.revokeObjectURL(u); return null; });

    // Close MediaPipe to free GPU resources, models will reload on next session
    try { poseLandmarkerRef.current?.close(); } catch { /* ignore */ }
    try { faceLandmarkerRef.current?.close(); } catch { /* ignore */ }
    poseLandmarkerRef.current = null;
    faceLandmarkerRef.current = null;

    // Reset state
    setScreen('setup');
    setSelectedQuestion(null);
    setCameraReady(false);
    setModelsLoaded(false);
    setModelLoadFailed(false);
    setSkipPoseAnalysis(false);
    setModelLoadProgress('');
    setRecordingTime(0);
    setLivePosture(0);
    setLiveEyeContact(false);
    setLiveWpm(0);
    setLiveFillerCount(0);
    setInterimText('');
    setAnalysisMetrics(null);
    setAnalysisText('');
    setAnalysisLoading(false);
    setAnalysisError(null);
    setEndedEarly(false);
    setError(null);
    setRecordingMime('');
    setFinalTranscript('');
    setDownloadFilename('');

    // Reset refs
    transcriptRef.current = '';
    interimRef.current = '';
    fillerCountRef.current = 0;
    countedSpeechIndicesRef.current = new Set();
    wordTimestampsRef.current = [];
    timelineRef.current = [];
    chunksRef.current = [];
    stopOnceRef.current = false;
  }, []);

  /* ----------- Cleanup on unmount ----------- */
  useEffect(() => {
    return () => {
      isRunningRef.current = false;
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (samplerIntervalRef.current) clearInterval(samplerIntervalRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.onend = null; recognitionRef.current.abort(); } catch { /* ignore */ }
      }
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        try { recorderRef.current.stop(); } catch { /* ignore */ }
      }
      if (streamRef.current) {
        try { streamRef.current.getTracks().forEach((t) => t.stop()); } catch { /* ignore */ }
      }
      try { poseLandmarkerRef.current?.close(); } catch { /* ignore */ }
      try { faceLandmarkerRef.current?.close(); } catch { /* ignore */ }
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ============================================================
   * Render
   * ============================================================ */

  return (
    <>
      <style>{styles}</style>

      {screen === 'setup' && (
        <SetupScreen
          selectedQuestion={selectedQuestion}
          onSelectQuestion={setSelectedQuestion}
          onEnableCamera={enableCamera}
          cameraReady={cameraReady}
          modelsLoaded={modelsLoaded}
          modelLoadProgress={modelLoadProgress}
          modelLoadFailed={modelLoadFailed && !skipPoseAnalysis}
          onContinueWithoutMP={handleContinueWithoutMP}
          speechSupported={speechSupported}
          videoRef={videoRef}
          onStartRecording={startRecording}
          onRetryCamera={enableCamera}
          error={error}
          dismissError={() => setError(null)}
        />
      )}

      {screen === 'recording' && selectedQuestion && (
        <RecordingScreen
          question={selectedQuestion}
          recordingTime={recordingTime}
          livePosture={livePosture}
          liveEyeContact={liveEyeContact}
          liveWpm={liveWpm}
          liveFillerCount={liveFillerCount}
          speechSupported={speechSupported}
          videoRef={videoRef}
          canvasRef={canvasRef}
          interimText={interimText}
          onStop={stopRecording}
        />
      )}

      {screen === 'analysis' && selectedQuestion && analysisMetrics && (
        <AnalysisScreen
          question={selectedQuestion}
          metrics={analysisMetrics}
          recordingUrl={recordingUrl}
          downloadFilename={downloadFilename}
          transcript={finalTranscript}
          analysisText={analysisText}
          analysisLoading={analysisLoading}
          analysisError={analysisError}
          onRestart={restart}
          onRetryAnalysis={retryAnalysis}
          endedEarly={endedEarly}
        />
      )}
    </>
  );
}

/* ============================================================
 * Styles (page-scoped)
 * ============================================================ */

const styles = `
.vi-cat-section { margin-top: 2rem; }
.vi-cat-section:first-of-type { margin-top: 1.5rem; }
.vi-cat-header { margin-bottom: 0.85rem; }

.vi-cat-pill {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
}
.vi-cat-pill-small { font-size: 0.65rem; padding: 0.2rem 0.6rem; }
.vi-cat-red    { background: rgba(200,85,61,0.12);  color: var(--clay); }
.vi-cat-blue   { background: rgba(37,99,235,0.12);  color: var(--blue); }
.vi-cat-green  { background: rgba(5,150,105,0.12);  color: var(--green); }
.vi-cat-purple { background: rgba(124,58,237,0.12); color: #7c3aed; }
.vi-cat-red-bg    { background: rgba(200,85,61,0.12); }
.vi-cat-blue-bg   { background: rgba(37,99,235,0.12); }
.vi-cat-green-bg  { background: rgba(5,150,105,0.12); }
.vi-cat-purple-bg { background: rgba(124,58,237,0.12); }

.vi-question-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}
.vi-question-card {
  text-align: left;
  background: var(--white);
  border: 1px solid var(--mid-gray);
  border-radius: 12px;
  padding: 1.25rem;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.9rem;
  line-height: 1.55;
  color: var(--text);
  transition: border-color 0.18s, box-shadow 0.18s, transform 0.18s, background 0.18s;
}
.vi-question-card:hover {
  border-color: var(--clay);
  box-shadow: 0 8px 20px rgba(0,0,0,0.05);
  transform: translateY(-2px);
}
.vi-question-card.selected {
  border-color: var(--clay);
  background: rgba(200,85,61,0.04);
  box-shadow: 0 0 0 3px rgba(200,85,61,0.15);
}
.vi-question-card p { margin: 0; }
.vi-question-icon {
  width: 36px; height: 36px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  margin-bottom: 0.7rem;
}

.vi-permission-card {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  background: var(--white);
  border: 1px solid var(--mid-gray);
  border-radius: 12px;
  padding: 1.5rem 1.75rem;
  margin-top: 0.5rem;
}
.vi-permission-text h3 { font-size: 1.05rem; font-weight: 700; color: var(--obsidian); margin-bottom: 0.35rem; }
.vi-permission-text p { font-size: 0.9rem; color: var(--text2); margin: 0; max-width: 520px; }
.vi-enable-btn { padding: 0.85rem 1.5rem; border: none; cursor: pointer; font-weight: 600; }

.vi-preview-block { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); gap: 1.5rem; align-items: start; margin-top: 0.5rem; }
.vi-preview-meta {
  background: var(--white);
  border: 1px solid var(--mid-gray);
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.vi-meta-row { display: flex; align-items: center; gap: 0.6rem; font-size: 0.9rem; color: var(--text); }
.vi-status-dot {
  width: 10px; height: 10px; border-radius: 999px; background: var(--mid-gray); flex-shrink: 0;
}
.vi-status-dot.on   { background: var(--green); box-shadow: 0 0 0 3px rgba(5,150,105,0.18); }
.vi-status-dot.warn { background: #d97706; box-shadow: 0 0 0 3px rgba(217,119,6,0.18); }
.vi-status-dot.fail { background: var(--clay); box-shadow: 0 0 0 3px rgba(200,85,61,0.18); }

.vi-video-container {
  position: relative;
  background: var(--obsidian);
  border-radius: 14px;
  overflow: hidden;
  aspect-ratio: 16 / 9;
}
.vi-video {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
  transform: scaleX(-1); /* mirror like a mirror app */
}
.vi-overlay-canvas {
  position: absolute; top: 0; left: 0;
  pointer-events: none;
  transform: scaleX(-1);
}

.vi-loading-overlay {
  position: absolute; inset: 0;
  background: rgba(26,26,46,0.75);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--bone);
  gap: 1rem;
}
.vi-loading-text { font-size: 0.95rem; font-weight: 500; }
.vi-loading-dots { display: inline-flex; gap: 0.4rem; }
.vi-loading-dots span {
  width: 9px; height: 9px; border-radius: 999px;
  background: var(--clay-light);
  animation: viDot 1.4s infinite ease-in-out both;
}
.vi-loading-dots span:nth-child(1) { animation-delay: -0.32s; }
.vi-loading-dots span:nth-child(2) { animation-delay: -0.16s; }
@keyframes viDot {
  0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

.vi-selected-q {
  background: var(--white);
  border: 1px solid var(--mid-gray);
  border-left: 4px solid var(--clay);
  border-radius: 0 12px 12px 0;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.5rem;
}
.vi-selected-q-label {
  font-size: 0.7rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--clay); margin-bottom: 0.4rem;
}
.vi-selected-q p { margin: 0; font-size: 1.02rem; line-height: 1.6; color: var(--text); }

.vi-start-row { display: flex; align-items: center; gap: 1.25rem; flex-wrap: wrap; }
.vi-start-btn {
  font-size: 1rem; padding: 1rem 2rem; border: none; cursor: pointer; font-weight: 600;
}
.vi-start-btn:disabled { background: var(--mid-gray); color: var(--text2); cursor: not-allowed; }
.vi-start-hint { font-size: 0.88rem; color: var(--text2); margin: 0; }

.vi-speech-banner, .vi-error-banner, .vi-warning-banner {
  border-radius: 10px;
  padding: 1rem 1.25rem;
  font-size: 0.9rem;
  margin-bottom: 1.25rem;
}
.vi-speech-banner { background: rgba(37,99,235,0.06); border: 1px solid rgba(37,99,235,0.2); color: var(--text); }
.vi-error-banner  { background: rgba(200,85,61,0.06); border: 1px solid rgba(200,85,61,0.25); color: var(--text); }
.vi-warning-banner { background: rgba(217,119,6,0.08); border: 1px solid rgba(217,119,6,0.3); color: var(--text); padding: 0.85rem 1.1rem; }
.vi-banner-title { font-weight: 700; margin-bottom: 0.3rem; color: var(--obsidian); font-size: 0.95rem; }
.vi-speech-banner p, .vi-error-banner p { margin: 0; }
.vi-banner-actions { margin-top: 0.85rem; display: flex; gap: 0.6rem; flex-wrap: wrap; }
.vi-banner-actions button { padding: 0.45rem 0.95rem; border-radius: 8px; font-size: 0.85rem; cursor: pointer; font-family: inherit; }

/* Recording screen */
.vi-recording-section { padding: 2rem 1.5rem 4rem; }
.vi-recording-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 1.5rem; margin-bottom: 1.25rem; flex-wrap: wrap;
}
.vi-rec-question p { margin: 0.5rem 0 0; font-size: 1rem; line-height: 1.55; color: var(--text); max-width: 720px; }
.vi-rec-status { display: flex; align-items: center; gap: 1rem; }
.vi-rec-indicator {
  display: inline-flex; align-items: center; gap: 0.45rem;
  background: rgba(200,85,61,0.12); color: var(--clay);
  border-radius: 999px; padding: 0.35rem 0.85rem;
  font-size: 0.78rem; font-weight: 700; letter-spacing: 0.08em;
}
.vi-rec-dot {
  width: 9px; height: 9px; border-radius: 999px; background: var(--clay);
  animation: viPulse 1.5s ease-in-out infinite;
}
@keyframes viPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
.vi-timer { font-family: 'SF Mono', Menlo, monospace; font-variant-numeric: tabular-nums; font-size: 1.4rem; font-weight: 600; color: var(--obsidian); }

.vi-recording-layout { display: grid; grid-template-columns: minmax(0, 2.2fr) minmax(0, 1fr); gap: 1.5rem; align-items: start; }
.vi-video-recording { aspect-ratio: 16 / 9; }

.vi-metrics-sidebar {
  background: var(--white);
  border: 1px solid var(--mid-gray);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex; flex-direction: column; gap: 1.1rem;
}
.vi-sidebar-title { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--clay); margin: 0; }
.vi-metric-row {
  display: flex; flex-direction: column; gap: 0.35rem;
  border-bottom: 1px solid var(--mid-gray);
  padding-bottom: 1rem;
}
.vi-metric-row:last-of-type { border-bottom: none; padding-bottom: 0; }
.vi-metric-label { font-size: 0.78rem; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: 0.06em; }
.vi-metric-value { font-size: 1.7rem; font-weight: 800; color: var(--obsidian); font-variant-numeric: tabular-nums; line-height: 1.05; }
.vi-metric-sub { font-size: 0.78rem; color: var(--text2); }

.vi-bar { width: 100%; height: 8px; background: var(--mid-gray); border-radius: 999px; overflow: hidden; margin-top: 0.2rem; }
.vi-bar-fill { height: 100%; border-radius: 999px; transition: width 0.5s ease, background 0.3s ease; }

.vi-eye-row { display: flex; align-items: center; gap: 0.55rem; font-size: 0.92rem; font-weight: 500; }
.vi-eye-dot { width: 11px; height: 11px; border-radius: 999px; background: var(--mid-gray); flex-shrink: 0; transition: background 0.2s, box-shadow 0.2s; }
.vi-eye-dot.on  { background: var(--green); box-shadow: 0 0 0 4px rgba(5,150,105,0.16); }
.vi-eye-dot.off { background: var(--clay); box-shadow: 0 0 0 4px rgba(200,85,61,0.12); }

.vi-interim {
  background: var(--light-gray);
  border-radius: 10px;
  padding: 0.85rem 1rem;
  border: 1px solid var(--mid-gray);
}
.vi-interim p { margin: 0.3rem 0 0; font-size: 0.88rem; color: var(--text); font-style: italic; line-height: 1.5; }

.vi-stop-btn { margin-top: 0.5rem; padding: 0.95rem 1.5rem; border: none; cursor: pointer; font-size: 1rem; font-weight: 600; }

/* Analysis */
.vi-overall-card {
  background: var(--white);
  border: 1px solid var(--mid-gray);
  border-radius: 14px;
  padding: 2rem;
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
}
.vi-overall-text { flex: 1; min-width: 240px; }
.vi-overall-q { font-size: 1.05rem; line-height: 1.55; color: var(--text); margin: 0.7rem 0 0.85rem; }
.vi-overall-meta { font-size: 0.85rem; color: var(--text2); display: flex; gap: 0.5rem; }

.vi-score-ring { position: relative; flex-shrink: 0; }
.vi-score-ring-text {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.vi-score-ring-num { font-size: 2.6rem; font-weight: 800; color: var(--obsidian); line-height: 1; }
.vi-score-ring-label { font-size: 0.78rem; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: 0.08em; margin-top: 0.25rem; }

.vi-metrics-grid {
  display: grid; gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  margin-top: 0.5rem;
}
.vi-metric-card { padding: 1.25rem; text-align: left; }
.vi-metric-card .stat-value { font-size: 2rem; font-weight: 800; line-height: 1.05; }
.vi-metric-card .stat-label { font-size: 0.78rem; color: var(--text2); text-transform: uppercase; letter-spacing: 0.08em; margin: 0.2rem 0 0.85rem; font-weight: 600; }
.vi-metric-card-note { font-size: 0.82rem; color: var(--text2); margin: 0.6rem 0 0; }
.vi-metric-card-na .stat-value { color: var(--text2); font-weight: 700; }

.vi-tips-grid {
  display: grid; gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}
.vi-tip-card { position: relative; }
.vi-tip-num {
  position: absolute; top: -10px; left: -10px;
  width: 30px; height: 30px;
  border-radius: 999px;
  background: var(--clay); color: var(--white);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.85rem; font-weight: 700;
}

.vi-analysis-content {
  padding: 2rem 2rem 2.25rem;
  background: var(--white);
  border-radius: 14px;
  border: 1px solid var(--mid-gray);
}
.vi-md-h1 { font-size: 1.5rem; font-weight: 800; color: var(--obsidian); margin: 1.5rem 0 0.85rem; }
.vi-md-h1:first-child { margin-top: 0; }
.vi-md-h2 { font-size: 1.15rem; font-weight: 700; color: var(--obsidian); margin: 1.4rem 0 0.5rem; }
.vi-md-h3 { font-size: 1rem; font-weight: 700; color: var(--clay); margin: 1rem 0 0.35rem; }
.vi-md-p { font-size: 0.94rem; color: var(--text); margin: 0.45rem 0; line-height: 1.65; }
.vi-md-num { font-size: 0.94rem; color: var(--text); margin: 0.65rem 0; line-height: 1.65; }
.vi-md-list { margin: 0.5rem 0 0.5rem 1.25rem; padding: 0; }
.vi-md-list li { font-size: 0.92rem; color: var(--text); line-height: 1.6; margin: 0.25rem 0; }
.vi-md-score { font-weight: 700; color: var(--clay); }

.vi-analysis-loading {
  background: var(--white);
  border: 1px solid var(--mid-gray);
  border-radius: 12px;
  padding: 2.25rem;
  display: flex; flex-direction: column; align-items: center; gap: 0.85rem;
}
.vi-analysis-loading p { margin: 0; font-size: 0.92rem; color: var(--text2); }
.vi-analysis-loading .vi-loading-dots span { background: var(--clay); }

.vi-playback-container { background: var(--obsidian); border-radius: 14px; overflow: hidden; }
.vi-playback-video { width: 100%; display: block; max-height: 70vh; }
.vi-transcript-block {
  margin-top: 1.25rem;
  background: var(--light-gray);
  border: 1px solid var(--mid-gray);
  border-radius: 10px;
  padding: 0.75rem 1rem;
  font-size: 0.92rem;
}
.vi-transcript-block summary { cursor: pointer; font-weight: 600; color: var(--obsidian); }
.vi-transcript-block p { margin: 0.85rem 0 0.25rem; line-height: 1.65; color: var(--text); white-space: pre-wrap; }

.vi-cta-row { display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; padding: 1rem 1.5rem 0; }
.vi-cta-btn { padding: 0.95rem 1.75rem; border: none; cursor: pointer; font-size: 0.98rem; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; }

/* Mobile */
@media (max-width: 880px) {
  .vi-recording-layout { grid-template-columns: 1fr; }
  .vi-preview-block { grid-template-columns: 1fr; }
  .vi-overall-card { padding: 1.5rem; gap: 1.25rem; }
}
@media (max-width: 768px) {
  .vi-question-grid { grid-template-columns: 1fr; }
  .vi-metrics-grid { grid-template-columns: 1fr 1fr; }
  .vi-tips-grid { grid-template-columns: 1fr; }
  .vi-permission-card { flex-direction: column; align-items: flex-start; }
  .vi-recording-section { padding: 1rem 1rem 3rem; }
  .vi-recording-header { gap: 0.85rem; }
  .vi-rec-status { width: 100%; justify-content: space-between; }
  .vi-analysis-content { padding: 1.5rem 1.25rem; }
  .vi-overall-text { width: 100%; }
}
@media (max-width: 480px) {
  .vi-metrics-grid { grid-template-columns: 1fr; }
  .vi-timer { font-size: 1.15rem; }
}
`;
