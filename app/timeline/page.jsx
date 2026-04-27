'use client';

import { useEffect, useMemo, useState } from 'react';

const ROUNDS = [
  { id: 'ea1', name: 'Early Action I',     month: 10, day: 1,  label: 'November 1' },
  { id: 'ea2', name: 'Early Action II',    month: 0,  day: 15, label: 'January 15' },
  { id: 'rd1', name: 'Regular Decision I', month: 2,  day: 1,  label: 'March 1' },
  { id: 'rd2', name: 'Regular Decision II',month: 3,  day: 15, label: 'April 15' },
];

function getNextDeadline(month, day, now) {
  let target = new Date(now.getFullYear(), month, day, 23, 59, 59);
  if (target < now) {
    target = new Date(now.getFullYear() + 1, month, day, 23, 59, 59);
  }
  return target;
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function CountdownDisplay({ selectedRound, now }) {
  const round = ROUNDS.find((r) => r.id === selectedRound);
  const deadline = useMemo(
    () => getNextDeadline(round.month, round.day, now),
    [round, now],
  );

  const diff = deadline - now;

  if (diff <= 0) {
    return <div className="countdown-passed">Deadline Passed</div>;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return (
    <>
      <div className="countdown-unit">
        <span className="countdown-num">{days}</span>
        <span className="countdown-label">{days === 1 ? 'Day' : 'Days'}</span>
      </div>
      <div className="countdown-unit">
        <span className="countdown-num">{pad(hours)}</span>
        <span className="countdown-label">{hours === 1 ? 'Hour' : 'Hours'}</span>
      </div>
      <div className="countdown-unit">
        <span className="countdown-num">{pad(minutes)}</span>
        <span className="countdown-label">{minutes === 1 ? 'Min' : 'Mins'}</span>
      </div>
      <div className="countdown-unit">
        <span className="countdown-num">{pad(seconds)}</span>
        <span className="countdown-label">{seconds === 1 ? 'Sec' : 'Secs'}</span>
      </div>
    </>
  );
}

function getCountdownMessage(selectedRound, now) {
  const round = ROUNDS.find((r) => r.id === selectedRound);
  const deadline = getNextDeadline(round.month, round.day, now);
  const diff = deadline - now;
  if (diff <= 0) return '';
  const daysRemaining = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (daysRemaining > 90) {
    return `You have plenty of time to prepare a thoughtful ${round.name} application. Use this window to research, brainstorm, and draft.`;
  }
  if (daysRemaining > 30) {
    return `Time to be actively working on your ${round.name} application. Drafts should be in progress and challenges should be on your radar.`;
  }
  if (daysRemaining > 7) {
    return `The ${round.name} deadline is approaching. Finalize your essays, complete any remaining challenges, and review everything carefully.`;
  }
  return `Final stretch for ${round.name}. Submit a few days before the deadline to avoid last-minute technical issues.`;
}

export default function TimelinePage() {
  const [selectedRound, setSelectedRound] = useState('ea1');
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const message = getCountdownMessage(selectedRound, now);

  const handleCtaOver = (e) => {
    e.currentTarget.style.background = 'var(--clay-light)';
    e.currentTarget.style.transform = 'translateY(-1px)';
  };
  const handleCtaOut = (e) => {
    e.currentTarget.style.background = 'var(--clay)';
    e.currentTarget.style.transform = 'none';
  };

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>
            Application <span>Timeline</span>
            <br />&amp; Deadlines
          </h1>
          <p>
            Know exactly when to apply and what to prepare. Minerva offers multiple application rounds, each with its own advantages. Plan your approach and stay ahead of deadlines.
          </p>
        </div>
      </section>

      <section>
        <div className="container">
          <span className="section-label">Countdown</span>
          <h2 className="section-title">Time Until Your Deadline</h2>
          <p className="section-subtitle">
            Select the application round you&apos;re targeting to see how much time you have left to prepare.
          </p>

          <div className="countdown-section">
            <h3>Choose your target round</h3>
            <p className="subtitle">
              Deadlines shown are approximate and based on typical Minerva admissions cycles. Always verify current dates at apply.minerva.edu.
            </p>
            <div className="round-picker" id="round-picker" role="radiogroup" aria-label="Target application round">
              {ROUNDS.map((r) => {
                const isSelected = selectedRound === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    className={`round-btn${isSelected ? ' selected' : ''}`}
                    data-round={r.id}
                    onClick={() => setSelectedRound(r.id)}
                    role="radio"
                    aria-checked={isSelected}
                  >
                    {r.name}
                    <span className="round-btn-label">{r.label}</span>
                  </button>
                );
              })}
            </div>
            <div
              id="countdown-display"
              className="countdown-display"
              aria-live="polite"
              aria-atomic="true"
            >
              <CountdownDisplay selectedRound={selectedRound} now={now} />
            </div>
            <div id="countdown-message" className="countdown-message">{message}</div>
          </div>
        </div>
      </section>

      <section className="alt-bg" id="rounds">
        <div className="container">
          <span className="section-label">Application Rounds</span>
          <h2 className="section-title">Four Rounds, Four Chances</h2>
          <p className="section-subtitle">
            Minerva accepts applications in multiple rounds throughout the admissions cycle. Earlier rounds tend to have strategic advantages, but strong applicants are admitted in every round.
          </p>

          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-dot" style={{ background: 'var(--clay)' }}>1</div>
              <div className="timeline-card">
                <div className="timeline-card-header">
                  <div>
                    <h3>Early Action I</h3>
                    <div className="deadline-date">Deadline: November 1</div>
                  </div>
                  <span
                    className="timeline-badge"
                    style={{ background: 'rgba(200,85,61,0.1)', color: 'var(--clay)' }}
                  >
                    Recommended
                  </span>
                </div>
                <div className="timeline-card-body">
                  <div className="timeline-meta">
                    <div className="timeline-meta-item">
                      <div className="timeline-meta-label">Decision by</div>
                      <div className="timeline-meta-value">Mid-December</div>
                    </div>
                    <div className="timeline-meta-item">
                      <div className="timeline-meta-label">Binding?</div>
                      <div className="timeline-meta-value">No — non-binding</div>
                    </div>
                  </div>
                  <div className="timeline-pros">
                    <h4>Advantages</h4>
                    <ul>
                      <li>Smallest applicant pool — less competition relative to later rounds</li>
                      <li>Earliest decision notification, reducing months of uncertainty</li>
                      <li>Demonstrates strong interest and initiative to the admissions team</li>
                      <li>Maximum time to plan finances, visa applications, and logistics if admitted</li>
                    </ul>
                  </div>
                  <div className="timeline-tips">
                    <h4>Tips for this round</h4>
                    <ul>
                      <li>Start your application in the summer to give yourself ample time</li>
                      <li>Have your essays reviewed by at least two people you trust before submitting</li>
                      <li>Complete the creative challenges in a quiet, distraction-free environment</li>
                      <li>Non-binding means you can still consider other options — there&apos;s no downside to applying early</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-dot" style={{ background: 'var(--clay-light)' }}>2</div>
              <div className="timeline-card">
                <div className="timeline-card-header">
                  <div>
                    <h3>Early Action II</h3>
                    <div className="deadline-date">Deadline: January 15</div>
                  </div>
                  <span
                    className="timeline-badge"
                    style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--blue)' }}
                  >
                    Popular
                  </span>
                </div>
                <div className="timeline-card-body">
                  <div className="timeline-meta">
                    <div className="timeline-meta-item">
                      <div className="timeline-meta-label">Decision by</div>
                      <div className="timeline-meta-value">Late February</div>
                    </div>
                    <div className="timeline-meta-item">
                      <div className="timeline-meta-label">Binding?</div>
                      <div className="timeline-meta-value">No — non-binding</div>
                    </div>
                  </div>
                  <div className="timeline-pros">
                    <h4>Advantages</h4>
                    <ul>
                      <li>More time to prepare your application than EA I while still applying early</li>
                      <li>Still benefits from a relatively smaller pool compared to Regular Decision</li>
                      <li>Decision arrives before most other universities&apos; regular deadlines</li>
                      <li>Good option if you discovered Minerva later in the fall</li>
                    </ul>
                  </div>
                  <div className="timeline-tips">
                    <h4>Tips for this round</h4>
                    <ul>
                      <li>Use the November – January window to refine your essays through multiple drafts</li>
                      <li>Research Minerva&apos;s Habits of Mind — understanding the curriculum makes your &ldquo;why Minerva&rdquo; response more compelling</li>
                      <li>Talk to current students on the forum or social media for authentic perspective</li>
                      <li>Don&apos;t rush just because the deadline is soon — a thoughtful late-January submission beats a sloppy November one</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-dot" style={{ background: 'var(--blue)' }}>3</div>
              <div className="timeline-card">
                <div className="timeline-card-header">
                  <div>
                    <h3>Regular Decision I</h3>
                    <div className="deadline-date">Deadline: March 1</div>
                  </div>
                  <span
                    className="timeline-badge"
                    style={{ background: 'rgba(5,150,105,0.1)', color: 'var(--green)' }}
                  >
                    Available
                  </span>
                </div>
                <div className="timeline-card-body">
                  <div className="timeline-meta">
                    <div className="timeline-meta-item">
                      <div className="timeline-meta-label">Decision by</div>
                      <div className="timeline-meta-value">Late April</div>
                    </div>
                    <div className="timeline-meta-item">
                      <div className="timeline-meta-label">Binding?</div>
                      <div className="timeline-meta-value">No — non-binding</div>
                    </div>
                  </div>
                  <div className="timeline-pros">
                    <h4>Advantages</h4>
                    <ul>
                      <li>Extended preparation time for the most polished application possible</li>
                      <li>You may have more life experiences and achievements to include from the academic year</li>
                      <li>Can incorporate feedback from other application processes to strengthen your Minerva essays</li>
                      <li>Decision still arrives in time to compare with other university offers</li>
                    </ul>
                  </div>
                  <div className="timeline-tips">
                    <h4>Tips for this round</h4>
                    <ul>
                      <li>The larger applicant pool means your application needs to be especially strong and distinctive</li>
                      <li>Use the extra time to create multiple drafts — don&apos;t just start later</li>
                      <li>The interview becomes more valuable in later rounds for differentiating yourself</li>
                      <li>Start your financial aid research now so you&apos;re ready to apply immediately after an offer</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-dot" style={{ background: 'var(--green)' }}>4</div>
              <div className="timeline-card">
                <div className="timeline-card-header">
                  <div>
                    <h3>Regular Decision II</h3>
                    <div className="deadline-date">Deadline: April 15</div>
                  </div>
                  <span
                    className="timeline-badge"
                    style={{ background: 'rgba(107,114,128,0.1)', color: 'var(--text2)' }}
                  >
                    Final Round
                  </span>
                </div>
                <div className="timeline-card-body">
                  <div className="timeline-meta">
                    <div className="timeline-meta-item">
                      <div className="timeline-meta-label">Decision by</div>
                      <div className="timeline-meta-value">Late May / Early June</div>
                    </div>
                    <div className="timeline-meta-item">
                      <div className="timeline-meta-label">Binding?</div>
                      <div className="timeline-meta-value">No — non-binding</div>
                    </div>
                  </div>
                  <div className="timeline-pros">
                    <h4>Advantages</h4>
                    <ul>
                      <li>Last chance to apply if you only recently discovered Minerva</li>
                      <li>Maximum time to prepare the strongest application you can</li>
                      <li>Strong candidates are still admitted — Minerva evaluates quality, not timing</li>
                      <li>Can include late-year achievements, awards, or projects in your application</li>
                    </ul>
                  </div>
                  <div className="timeline-tips">
                    <h4>Tips for this round</h4>
                    <ul>
                      <li>Spaces are more limited since some have been filled by earlier rounds</li>
                      <li>Make your application as distinctive as possible — generic responses won&apos;t stand out</li>
                      <li>Prepare for a faster turnaround on financial aid and enrollment decisions</li>
                      <li>If you&apos;re applying this late, be ready to act quickly once you receive a decision</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="insight-box" style={{ marginTop: '2.5rem' }}>
            <h4>Student Insight</h4>
            <p>
              There is no penalty for applying in later rounds — Minerva genuinely evaluates every application on its own merit. That said, applying early gives you practical advantages: less stress, more time to plan, and the peace of mind of knowing sooner. If your application is ready, there&apos;s no reason to wait.
            </p>
          </div>
        </div>
      </section>

      <section id="prep">
        <div className="container">
          <span className="section-label">Preparation Calendar</span>
          <h2 className="section-title">Month-by-Month Preparation Guide</h2>
          <p className="section-subtitle">
            A structured timeline to help you prepare a strong application. Adjust the months based on your target deadline.
          </p>

          <div className="prep-calendar-wrapper">
            <div className="prep-calendar">
              <div className="prep-month">
                <div className="prep-month-label" style={{ background: 'rgba(37,99,235,0.04)' }}>
                  <span className="prep-month-num">6</span>
                  <span className="prep-month-text">months before</span>
                </div>
                <div className="prep-month-content">
                  <div style={{ marginBottom: '0.4rem' }}>
                    <span className="prep-tag research">Research</span>
                  </div>
                  <h4>Explore and Connect</h4>
                  <p>
                    Research Minerva&apos;s curriculum, Habits of Mind, and city rotation model. Browse the student forum at forum.minerva.edu. Reach out to current students on social media or LinkedIn. Watch Minerva webinars and info sessions. Understand what makes Minerva different and start articulating why it&apos;s the right fit for you.
                  </p>
                </div>
              </div>

              <div className="prep-month">
                <div className="prep-month-label" style={{ background: 'rgba(37,99,235,0.04)' }}>
                  <span className="prep-month-num">4</span>
                  <span className="prep-month-text">months before</span>
                </div>
                <div className="prep-month-content">
                  <div style={{ marginBottom: '0.4rem' }}>
                    <span className="prep-tag writing">Writing</span>
                    <span className="prep-tag research">Research</span>
                  </div>
                  <h4>Start Your Application</h4>
                  <p>
                    Create your account at apply.minerva.edu. Begin filling in personal information and academic history. Start brainstorming your short-answer essay responses. Don&apos;t try to write final versions yet — focus on generating ideas, stories, and angles. Use the brainstorming prompts on the main site.
                  </p>
                </div>
              </div>

              <div className="prep-month">
                <div className="prep-month-label" style={{ background: 'rgba(200,85,61,0.04)' }}>
                  <span className="prep-month-num">3</span>
                  <span className="prep-month-text">months before</span>
                </div>
                <div className="prep-month-content">
                  <div style={{ marginBottom: '0.4rem' }}>
                    <span className="prep-tag writing">Writing</span>
                  </div>
                  <h4>Draft and Get Feedback</h4>
                  <p>
                    Write complete first drafts of all your essay responses. Share them with 2–3 trusted people — a teacher, mentor, friend, or family member who will be honest. Focus on authenticity and specificity. Revise based on feedback but keep your voice. Start your second and third drafts.
                  </p>
                </div>
              </div>

              <div className="prep-month">
                <div className="prep-month-label" style={{ background: 'rgba(200,85,61,0.04)' }}>
                  <span className="prep-month-num">2</span>
                  <span className="prep-month-text">months before</span>
                </div>
                <div className="prep-month-content">
                  <div style={{ marginBottom: '0.4rem' }}>
                    <span className="prep-tag prep">Challenges</span>
                    <span className="prep-tag writing">Writing</span>
                  </div>
                  <h4>Complete Challenges</h4>
                  <p>
                    Practice creative thinking exercises — puzzles, brain teasers, lateral thinking problems. When you feel ready, complete Minerva&apos;s creative challenges in a quiet, distraction-free environment. These are timed, so practice managing your time under pressure. Continue refining your essay drafts in parallel.
                  </p>
                </div>
              </div>

              <div className="prep-month">
                <div className="prep-month-label" style={{ background: 'rgba(5,150,105,0.04)' }}>
                  <span className="prep-month-num">1</span>
                  <span className="prep-month-text">month before</span>
                </div>
                <div className="prep-month-content">
                  <div style={{ marginBottom: '0.4rem' }}>
                    <span className="prep-tag submit">Final Review</span>
                  </div>
                  <h4>Polish and Submit</h4>
                  <p>
                    Do a final review of your entire application for errors, typos, or gaps. Read your essays aloud to catch awkward phrasing. Verify all personal information and academic details are accurate. Submit your application at least a few days before the deadline — don&apos;t wait until the last hour. Technical issues happen.
                  </p>
                </div>
              </div>

              <div className="prep-month">
                <div className="prep-month-label" style={{ background: 'rgba(5,150,105,0.04)' }}>
                  <span className="prep-month-num">+</span>
                  <span className="prep-month-text">after submit</span>
                </div>
                <div className="prep-month-content">
                  <div style={{ marginBottom: '0.4rem' }}>
                    <span className="prep-tag prep">Interview</span>
                    <span className="prep-tag research">Financial Aid</span>
                  </div>
                  <h4>Interview Prep &amp; Financial Aid</h4>
                  <p>
                    Sign up for an admissions interview (optional but strongly recommended). Prepare by thinking about what questions you want to ask them — this is a two-way conversation, not an interrogation. Research financial aid options and start preparing your financial aid application, which is separate from admissions. Look into external scholarships relevant to your country or background.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="tip-box" style={{ marginTop: '2rem' }}>
            <h4>Important Timing Note</h4>
            <p>
              This calendar is flexible. If you discovered Minerva two months before a deadline, you can still prepare a strong application — you&apos;ll just need to compress the timeline. Quality matters more than how long you spent. Focus on authenticity in your essays and genuine engagement with the creative challenges.
            </p>
          </div>
        </div>
      </section>

      <div
        className="cta-section"
        style={{
          background: 'var(--obsidian)',
          color: 'var(--bone)',
          textAlign: 'center',
          padding: '4rem 1.5rem',
        }}
      >
        <div className="container">
          <h2
            style={{
              fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)',
              fontWeight: 800,
              marginBottom: '1rem',
            }}
          >
            Ready to Start Your Application?
          </h2>
          <p
            style={{
              color: 'rgba(245,240,235,0.65)',
              maxWidth: '550px',
              margin: '0 auto 2rem',
              fontSize: '1.05rem',
            }}
          >
            The application is free, no standardized tests are required, and you can work on it at your own pace. The hardest part is clicking &ldquo;start.&rdquo;
          </p>
          <a
            href="https://apply.minerva.edu"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              background: 'var(--clay)',
              color: 'white',
              textDecoration: 'none',
              padding: '0.85rem 2rem',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '1rem',
              transition: 'background 0.2s, transform 0.1s',
            }}
            onMouseOver={handleCtaOver}
            onMouseOut={handleCtaOut}
          >
            Apply to Minerva
          </a>
        </div>
      </div>
    </>
  );
}
