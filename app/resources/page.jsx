'use client';

import { useMemo, useState } from 'react';

const OFFICIAL_CARDS = [
  {
    id: 'off-1',
    href: 'https://www.minerva.edu',
    icon: '\u{1F393}',
    iconColor: 'green',
    title: 'Minerva University Website',
    body: "The primary source for everything about Minerva's mission, curriculum, faculty, and student outcomes. Start here to understand the institution before you apply.",
    indicator: 'Visit minerva.edu ↗',
    keywords: 'official website homepage minerva university about',
  },
  {
    id: 'off-2',
    href: 'https://apply.minerva.edu',
    icon: '\u{1F4DD}',
    iconColor: 'red',
    title: 'Application Portal',
    body: 'Create your applicant account, complete your application, and track its status. The application is free and can be saved and resumed at any time.',
    indicator: 'Go to apply.minerva.edu ↗',
    keywords: 'apply application portal account create submit',
  },
  {
    id: 'off-3',
    href: 'https://www.minerva.edu/undergraduate/financial-aid',
    icon: '\u{1F4B0}',
    iconColor: 'green',
    title: 'Financial Aid & Tuition',
    body: 'Details on tuition costs, need-based financial aid, the aid application process, and how Minerva structures its financial support. Over 80% of students receive aid.',
    indicator: 'View financial aid info ↗',
    keywords: 'financial aid tuition cost scholarship money fees need-based',
  },
  {
    id: 'off-4',
    href: 'https://www.youtube.com/channel/UCkGm9YCIb79GeXgxCfMJBSA',
    icon: '▶',
    iconColor: 'red',
    title: 'Minerva YouTube Channel',
    body: 'Official videos including info sessions, student testimonials, event recordings, and explanations of the Active Learning Forum and curriculum.',
    indicator: 'Watch on YouTube ↗',
    keywords: 'youtube video channel watch official media content',
  },
  {
    id: 'off-5',
    href: 'https://www.minerva.edu/blog/',
    icon: '\u{1F4F0}',
    iconColor: 'blue',
    title: 'Minerva Blog',
    body: "Articles about student achievements, faculty research, curriculum developments, and institutional news. Useful for understanding Minerva's evolving direction.",
    indicator: 'Read the blog ↗',
    keywords: 'blog news articles updates stories official publications',
  },
];

const STUDENT_LIFE_CARDS = [
  {
    id: 'sl-1',
    icon: '⏲',
    iconColor: 'blue',
    title: 'A Typical Day at Minerva',
    body: 'Mornings often start with independent study or readings. Classes run on the Active Learning Forum in focused 90-minute sessions. Afternoons are for location-based assignments, group projects, or civic engagements in the city. Evenings involve studying, clubs, and exploring with your cohort. There is no "campus" to retreat to — the city itself is your learning environment.',
    keywords: 'daily routine schedule typical day class forum study life',
  },
  {
    id: 'sl-2',
    icon: '\u{1F308}',
    iconColor: 'purple',
    title: 'Student Clubs & Activities',
    body: 'Students organize clubs around everything from debate and entrepreneurship to film, hiking, and cultural exchange. Because the cohort travels together, clubs adapt to each city. Some of the most rewarding experiences come from student-initiated projects that engage with local communities.',
    keywords: 'clubs activities extracurricular organizations student groups sports',
  },
  {
    id: 'sl-3',
    href: 'https://www.minerva.edu/impact-outcomes',
    icon: '\u{1F331}',
    iconColor: 'green',
    title: 'Career Outcomes & Alumni Network',
    body: 'Minerva graduates work at leading organizations worldwide and attend top graduate programs. The alumni network, though young, is tightly connected across industries and continents. Career services support begins early, with real-world projects serving as portfolio material.',
    indicator: 'View outcomes ↗',
    keywords: 'career outcomes alumni jobs graduate school employment network',
  },
];

const CITIES = [
  { id: 'city-sf', emoji: '\u{1F1E7}\u{1F1F7}', name: 'San Francisco', desc: 'First year. Tech, innovation, and the founding city of Minerva. Your introduction to the model.' },
  { id: 'city-seoul', emoji: '\u{1F1F0}\u{1F1F7}', name: 'Seoul', desc: "East Asian culture, rapid development, K-innovation, and one of the world's most connected cities." },
  { id: 'city-hyd', emoji: '\u{1F1EE}\u{1F1F3}', name: 'Hyderabad', desc: "Emerging tech hub with deep historical roots. Complexity, scale, and entrepreneurship in India's heartland." },
  { id: 'city-berlin', emoji: '\u{1F1E9}\u{1F1EA}', name: 'Berlin', desc: 'European politics, history, arts, and social enterprise. A city constantly reinventing itself.' },
  { id: 'city-ba', emoji: '\u{1F1E6}\u{1F1F7}', name: 'Buenos Aires', desc: 'Latin American perspectives on economics, culture, and community. Vibrant, expressive, and resilient.' },
  { id: 'city-london', emoji: '\u{1F1EC}\u{1F1E7}', name: 'London', desc: 'Global finance, governance, media, and centuries of institutional history in a multicultural capital.' },
  { id: 'city-taipei', emoji: '\u{1F1F9}\u{1F1FC}', name: 'Taipei', desc: 'Technology, democracy, sustainability, and a bridge between East Asian traditions and modern innovation.' },
];
const CITIES_KEYWORDS = 'cities rotation travel global international location semester';

const ACADEMIC_PREP_CARDS = [
  {
    id: 'ap-1',
    icon: '\u{1F4DA}',
    iconColor: 'red',
    title: 'Recommended Books',
    body: 'Books that develop the kind of thinking Minerva values:',
    sublines: [
      ['Thinking, Fast and Slow', 'by Daniel Kahneman — understand cognitive biases and how your mind works.'],
      ['The Art of Thinking Clearly', 'by Rolf Dobelli — common reasoning errors and how to avoid them.'],
      ['A Short History of Nearly Everything', 'by Bill Bryson — interdisciplinary curiosity in action.'],
      ['Factfulness', 'by Hans Rosling — evidence-based thinking about the world.'],
      ['Range', 'by David Epstein — why generalists thrive in a specialized world.'],
    ],
    keywords: 'books reading critical thinking recommended list intellectual',
  },
  {
    id: 'ap-2',
    icon: '\u{1F4BB}',
    iconColor: 'blue',
    title: 'Online Courses',
    body: 'Free and affordable courses that build relevant skills:',
    sublines: [
      ['Coursera:', '"Learning How to Learn" by Barbara Oakley — the science of effective learning.'],
      ['Coursera:', '"Model Thinking" by Scott Page — multiple frameworks for problem-solving.'],
      ['edX:', '"Critical Thinking & Problem Solving" — structured analytical reasoning.'],
      ['Khan Academy:', 'Logic and statistics courses — foundational quantitative reasoning.'],
      ['Coursera:', '"Creative Problem Solving" by University of Minnesota — structured approaches to novel challenges.'],
    ],
    keywords: 'online courses mooc coursera edx khan academy learning skills free',
  },
  {
    id: 'ap-3',
    href: 'https://www.ted.com/topics/creativity',
    icon: '\u{1F4A1}',
    iconColor: 'purple',
    title: 'Creative Thinking Practice',
    body: 'Build your creative muscles before the challenges:',
    sublines: [
      ['TED Talks on Creativity', '— diverse perspectives on what creativity actually means.'],
      ['Lateral thinking puzzles', '— practice approaching problems from unusual angles.'],
      ['Edward de Bono\'s "Six Thinking Hats"', '— a framework for examining problems from multiple perspectives.'],
      ['Daily brainstorming exercises', '— pick any object and find 20 unconventional uses for it in 5 minutes.'],
    ],
    indicator: 'Browse TED Talks ↗',
    keywords: 'creative thinking practice brainstorm lateral divergent innovation puzzles',
  },
  {
    id: 'ap-4',
    icon: '✍',
    iconColor: 'green',
    title: 'Writing Improvement',
    body: 'Strengthen your writing for the application responses:',
    sublines: [
      ['Purdue OWL', '(owl.purdue.edu) — comprehensive writing guidance and grammar reference.'],
      ['"On Writing Well"', 'by William Zinsser — the classic guide to clear, concise nonfiction writing.'],
      ['Hemingway Editor', '(hemingwayapp.com) — tool that highlights overly complex sentences.'],
      ['Daily journaling practice', '— write 500 words daily on anything. The habit of clear expression translates directly to better application responses.'],
    ],
    keywords: 'writing improve essay skill grammar style communication',
  },
];

const COMMUNITY_CARDS = [
  {
    id: 'co-1',
    href: 'https://www.instagram.com/minervauniversity/',
    icon: '\u{1F4F7}',
    iconColor: 'red',
    title: 'Social Media Accounts',
    body: 'Follow Minerva on Instagram, LinkedIn, Facebook, and Twitter for student stories, event announcements, and glimpses of daily life across rotation cities. Student takeovers are particularly insightful.',
    indicator: 'Follow on Instagram ↗',
    tag: 'community',
    keywords: 'social media instagram facebook twitter linkedin follow accounts',
  },
  {
    id: 'co-2',
    href: 'https://www.minerva.edu/admissions/',
    icon: '\u{1F91D}',
    iconColor: 'blue',
    title: 'Student Ambassador Program',
    body: "Minerva's admissions team can connect you with student ambassadors who answer questions about their experience. These are current students who volunteered to help applicants — they give honest, unfiltered perspectives.",
    indicator: 'Connect through admissions ↗',
    tag: 'community',
    keywords: 'ambassador student connect talk ask questions current mentor',
  },
  {
    id: 'co-3',
    icon: '\u{1F4AC}',
    iconColor: 'green',
    title: 'Admitted Student Groups',
    body: "After admission, you'll be invited to class-specific groups (typically on WhatsApp or similar platforms) where you can meet your future classmates, ask questions, and coordinate before arrival. These groups form the first bonds of your cohort.",
    tag: 'community',
    keywords: 'admitted student group forum chat discussion admitted class',
  },
  {
    id: 'co-4',
    icon: '\u{1F310}',
    iconColor: 'purple',
    title: 'Connecting with Current Students',
    body: 'Beyond official channels, you can reach current Minerva students through LinkedIn, university events, and information sessions. Most students are happy to chat with prospective applicants. Be specific in your questions — "What surprised you most?" gets better answers than "What\'s it like?"',
    keywords: 'connect current students reach out email network talk real',
  },
];

const PARENTS = [
  {
    id: 'pa-1',
    icon: '\u{1F393}',
    title: 'Accreditation & Legitimacy',
    body: "Minerva University is accredited by WSCUC (the same body that accredits Stanford, Caltech, and USC). The bachelor's degree is recognized globally. Graduates are accepted into top graduate programs and hired by leading employers worldwide.",
    keywords: 'accreditation legitimate real degree recognized valid university parent',
  },
  {
    id: 'pa-2',
    icon: '\u{1F6E1}',
    title: 'Safety & Support in Rotation Cities',
    body: 'Each rotation city has dedicated Minerva staff, residential support, and emergency resources. Students live in managed housing with 24/7 access to university support. Minerva conducts thorough safety assessments of all locations and provides orientation for each new city.',
    keywords: 'safety security support cities travel international living abroad parent guardian',
  },
  {
    id: 'pa-3',
    icon: '⚖',
    title: 'How Minerva Compares',
    body: 'Unlike traditional universities, Minerva has no lectures, no campus, and no standardized tests for admission. What it offers instead: smaller class sizes, proven active learning pedagogy, global immersion, lower cost, and career outcomes that match or exceed those of top-20 U.S. schools.',
    keywords: 'compare comparison traditional university college vs difference better parent',
  },
  {
    id: 'pa-4',
    icon: '\u{1F4C8}',
    title: 'Financial Planning',
    body: "Minerva's total cost of attendance is significantly lower than comparable institutions. Need-based aid is generous and applying for aid does not affect admissions decisions. The financial aid team works individually with admitted families to create feasible plans. External scholarships can also be applied.",
    keywords: 'financial planning cost afford tuition budget payment plan parent money',
  },
];

const VIDEO_GROUPS = [
  {
    id: 'vg-info',
    heading: 'Information Sessions',
    cards: [
      {
        id: 'vc-1',
        href: 'https://www.youtube.com/results?search_query=minerva+university+info+session',
        type: 'Info Session',
        title: 'Admissions Information Sessions',
        body: 'Official presentations covering the application process, curriculum, financial aid, and Q&A with admissions staff. The best starting point for understanding Minerva.',
        keywords: 'video info session admissions overview presentation official watch',
      },
      {
        id: 'vc-2',
        href: 'https://www.youtube.com/results?search_query=minerva+university+active+learning+forum+demo',
        type: 'Demo',
        title: 'Active Learning Forum Demo',
        body: 'See what the classroom experience actually looks like. Live demos of the Forum show how professors facilitate real-time engagement with every student.',
        keywords: 'video forum active learning classroom platform demo technology watch',
      },
    ],
  },
  {
    id: 'vg-test',
    heading: 'Student Testimonials',
    cards: [
      {
        id: 'vc-3',
        href: 'https://www.youtube.com/results?search_query=minerva+university+student+experience+testimonial',
        type: 'Testimonial',
        title: 'Student Experience Stories',
        body: 'Current and former students share their genuine experiences — what they love, what challenged them, and how Minerva shaped their thinking and careers.',
        keywords: 'video student testimonial experience story personal perspective watch',
      },
      {
        id: 'vc-4',
        href: 'https://www.youtube.com/results?search_query=minerva+university+day+in+the+life',
        type: 'Day in the Life',
        title: 'Day in the Life at Minerva',
        body: 'Follow students through a typical day in different rotation cities. See the balance between classes, city exploration, and community life.',
        keywords: 'video day life vlog daily routine student watch',
      },
    ],
  },
  {
    id: 'vg-tour',
    heading: 'City & Campus Tours',
    cards: [
      {
        id: 'vc-5',
        href: 'https://www.youtube.com/results?search_query=minerva+university+city+rotation+tour',
        type: 'Tour',
        title: 'Rotation City Tours',
        body: "Virtual tours of housing, neighborhoods, and key locations in each rotation city. Get a feel for where you'd be living and studying.",
        keywords: 'video tour campus city rotation housing residence life location watch',
      },
      {
        id: 'vc-6',
        href: 'https://www.youtube.com/results?search_query=minerva+university+graduation+commencement',
        type: 'Ceremony',
        title: 'Graduation & Outcomes',
        body: 'Commencement ceremonies and alumni outcomes. See the culmination of the Minerva journey and where graduates end up.',
        keywords: 'video graduation commencement ceremony outcomes alumni watch',
      },
    ],
  },
];

function buildSearchText(card) {
  const parts = [card.title, card.body, card.indicator || '', card.keywords || ''];
  if (card.sublines) {
    for (const [a, b] of card.sublines) parts.push(a, b);
  }
  return parts.join(' ').toLowerCase();
}

function ResourceCard({ card }) {
  const inner = (
    <>
      {card.tag && (
        <span className={`card-tag ${card.tag}`}>
          {card.tag === 'community' ? 'Community' : 'Official'}
        </span>
      )}
      <div className={`card-icon ${card.iconColor}`} aria-hidden="true">{card.icon}</div>
      <h3>{card.title}</h3>
      <p>{card.body}</p>
      {card.sublines && card.sublines.map((s, i) => (
        <p key={i} style={i === 0 ? { marginTop: '0.5rem' } : undefined}>
          <strong>{s[0]}</strong> {s[1]}
        </p>
      ))}
      {card.indicator && <span className="card-link-indicator">{card.indicator}</span>}
    </>
  );

  if (card.href) {
    return (
      <a
        href={card.href}
        target="_blank"
        rel="noopener noreferrer"
        className="resource-card"
        data-keywords={card.keywords}
      >
        {inner}
      </a>
    );
  }
  return (
    <div className="resource-card" data-keywords={card.keywords}>
      {inner}
    </div>
  );
}

function OfficialCard({ card }) {
  return (
    <a
      href={card.href}
      target="_blank"
      rel="noopener noreferrer"
      className="resource-card"
      data-keywords={card.keywords}
    >
      <span className="card-tag official">Official</span>
      <div className={`card-icon ${card.iconColor}`} aria-hidden="true">{card.icon}</div>
      <h3>{card.title}</h3>
      <p>{card.body}</p>
      <span className="card-link-indicator">{card.indicator}</span>
    </a>
  );
}

function VideoCard({ card }) {
  return (
    <a
      href={card.href}
      target="_blank"
      rel="noopener noreferrer"
      className="video-card"
      data-keywords={card.keywords}
    >
      <div className="video-thumb">
        <span className="video-type">{card.type}</span>
        <div className="play-icon" aria-hidden="true">{'▶'}</div>
      </div>
      <div className="video-card-body">
        <h4>{card.title}</h4>
        <p>{card.body}</p>
      </div>
    </a>
  );
}

export default function ResourcesPage() {
  const [query, setQuery] = useState('');

  const norm = query.trim().toLowerCase();
  const terms = norm ? norm.split(/\s+/) : [];
  const matches = (text) => terms.length === 0 || terms.every((t) => text.includes(t));

  const decorate = useMemo(() => {
    const cache = new WeakMap();
    return (card) => {
      let v = cache.get(card);
      if (!v) {
        v = buildSearchText(card);
        cache.set(card, v);
      }
      return v;
    };
  }, []);

  const visibility = useMemo(() => {
    const officialVisible = OFFICIAL_CARDS.filter((c) => matches(decorate(c)));
    const studentLifeVisible = STUDENT_LIFE_CARDS.filter((c) => matches(decorate(c)));
    const cityText = (CITIES_KEYWORDS + ' city rotation travel').toLowerCase();
    const citiesVisible = CITIES.filter((c) =>
      matches(((c.name + ' ' + c.desc + ' ' + cityText)).toLowerCase()),
    );
    const academicVisible = ACADEMIC_PREP_CARDS.filter((c) => matches(decorate(c)));
    const communityVisible = COMMUNITY_CARDS.filter((c) => matches(decorate(c)));
    const parentsVisible = PARENTS.filter((c) => matches(decorate(c)));
    const videoGroupsVisible = VIDEO_GROUPS.map((g) => ({
      ...g,
      cards: g.cards.filter((c) => matches(decorate(c))),
    })).filter((g) => g.cards.length > 0);

    const totalVisible =
      officialVisible.length +
      studentLifeVisible.length +
      citiesVisible.length +
      academicVisible.length +
      communityVisible.length +
      parentsVisible.length +
      videoGroupsVisible.reduce((acc, g) => acc + g.cards.length, 0);

    return {
      officialVisible,
      studentLifeVisible,
      citiesVisible,
      academicVisible,
      communityVisible,
      parentsVisible,
      videoGroupsVisible,
      totalVisible,
    };
  }, [norm]); // eslint-disable-line react-hooks/exhaustive-deps

  const {
    officialVisible,
    studentLifeVisible,
    citiesVisible,
    academicVisible,
    communityVisible,
    parentsVisible,
    videoGroupsVisible,
    totalVisible,
  } = visibility;

  const showStudentLife = studentLifeVisible.length > 0 || citiesVisible.length > 0;
  const isSearching = norm.length > 0;

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>
            Resources &amp; Links for<br />
            <span>Minerva Applicants</span>
          </h1>
          <p>
            A curated collection of official resources, preparation materials, community links, and insider knowledge to support your Minerva application journey.
          </p>
        </div>
      </section>

      <div className="search-bar-wrapper">
        <span className="search-icon" aria-hidden="true">{'\u{1F50D}'}</span>
        <label htmlFor="search-input" className="sr-only">Search resources</label>
        <input
          type="text"
          className="search-bar"
          id="search-input"
          placeholder="Search resources by keyword..."
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <p className="search-meta" id="search-meta" aria-live="polite">
          {isSearching ? `${totalVisible} ${totalVisible === 1 ? 'resource' : 'resources'} found` : ''}
        </p>
      </div>

      {isSearching && totalVisible === 0 && (
        <div className="no-results" id="no-results" style={{ display: 'block' }}>
          <p>No resources match your search. Try a different keyword.</p>
        </div>
      )}

      {officialVisible.length > 0 && (
        <section id="official" className="resource-section">
          <div className="container">
            <span className="section-label">Official Resources</span>
            <h2 className="section-title">Official Minerva Resources</h2>
            <p className="section-subtitle">
              Primary sources directly from Minerva University. Start here for the most accurate and up-to-date information.
            </p>
            <div className="card-grid">
              {officialVisible.map((c) => <OfficialCard key={c.id} card={c} />)}
            </div>
          </div>
        </section>
      )}

      {showStudentLife && (
        <section id="student-life" className="alt-bg resource-section">
          <div className="container">
            <span className="section-label">Student Life</span>
            <h2 className="section-title">Student Life Insights</h2>
            <p className="section-subtitle">
              What it&apos;s actually like to be a Minerva student, from daily routines to the city rotation experience.
            </p>

            {studentLifeVisible.length > 0 && (
              <div className="card-grid" style={{ marginBottom: '2rem' }}>
                {studentLifeVisible.map((c) => <ResourceCard key={c.id} card={c} />)}
              </div>
            )}

            {citiesVisible.length > 0 && (
              <>
                <h3
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: 'var(--obsidian)',
                    marginBottom: '0.5rem',
                  }}
                >
                  The City Rotation Experience
                </h3>
                <p
                  style={{
                    fontSize: '0.92rem',
                    color: 'var(--text2)',
                    marginBottom: '1rem',
                  }}
                >
                  Over four years, you live and study in seven cities. Each location shapes your coursework, projects, and perspective.
                </p>
                <div className="city-grid" data-keywords={CITIES_KEYWORDS}>
                  {citiesVisible.map((c) => (
                    <div className="city-item" key={c.id}>
                      <div className="city-emoji" aria-hidden="true">{c.emoji}</div>
                      <h4>{c.name}</h4>
                      <p>{c.desc}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {!isSearching && (
              <div className="insight-box">
                <h4>Current Student Perspective</h4>
                <p>
                  The city rotations are genuinely transformative. You don&apos;t just visit a city for tourism — you live there, navigate daily life, work on projects with local organizations, and develop a real understanding of how place shapes everything from policy to culture. By graduation, you have a global network of experiences and relationships that no traditional study abroad program can replicate.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {academicVisible.length > 0 && (
        <section id="academic-prep" className="resource-section">
          <div className="container">
            <span className="section-label">Preparation</span>
            <h2 className="section-title">Academic Preparation</h2>
            <p className="section-subtitle">
              You can&apos;t study for Minerva&apos;s challenges in the traditional sense, but you can build the thinking skills that matter. These resources will sharpen the right muscles.
            </p>
            <div className="card-grid">
              {academicVisible.map((c) => <ResourceCard key={c.id} card={c} />)}
            </div>
            {!isSearching && (
              <div className="tip-box">
                <h4>Preparation Strategy</h4>
                <p>
                  Don&apos;t try to cram all of these at once. Pick one book and one course, and engage with them deeply over several weeks. The goal isn&apos;t to accumulate credentials — it&apos;s to genuinely develop how you think. Minerva&apos;s challenges are designed to detect surface-level preparation, so the only real prep is authentic intellectual development.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {communityVisible.length > 0 && (
        <section id="community" className="alt-bg resource-section">
          <div className="container">
            <span className="section-label">Community</span>
            <h2 className="section-title">Community &amp; Support</h2>
            <p className="section-subtitle">
              Connect with current students, admitted students, and the broader Minerva community. Real conversations with real people are the best way to understand what Minerva is like.
            </p>
            <div className="card-grid">
              {communityVisible.map((c) => <ResourceCard key={c.id} card={c} />)}
            </div>
            {!isSearching && (
              <div className="insight-box">
                <h4>Current Student Perspective</h4>
                <p>
                  I&apos;ve had dozens of conversations with prospective applicants, and the students who stand out are the ones who ask specific, thoughtful questions. Don&apos;t ask &ldquo;Is Minerva good?&rdquo; Ask things like &ldquo;How do you handle group projects across time zones?&rdquo; or &ldquo;What was your biggest adjustment moving to Seoul?&rdquo; That specificity shows you&apos;ve done your research and are genuinely interested in understanding the reality of the experience.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {parentsVisible.length > 0 && (
        <section id="parents" className="resource-section">
          <div className="container">
            <span className="section-label">For Families</span>
            <h2 className="section-title">For Parents &amp; Guardians</h2>
            <p className="section-subtitle">
              Minerva is a different kind of university, and that naturally raises questions from families. Here are the key things parents need to understand.
            </p>
            <div className="parents-section">
              <h3>Understanding Minerva for Your Family</h3>
              <p>These are the most common concerns parents have, addressed directly.</p>
              <div className="parents-grid">
                {parentsVisible.map((p) => (
                  <div className="parent-item" data-keywords={p.keywords} key={p.id}>
                    <div className="parent-icon" aria-hidden="true">{p.icon}</div>
                    <div>
                      <h4>{p.title}</h4>
                      <p>{p.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {!isSearching && (
              <div className="tip-box">
                <h4>For Parents</h4>
                <p>
                  The most helpful thing you can do is attend a Minerva information session with your child. Hearing directly from admissions staff and current students addresses concerns much more effectively than reading about it. Minerva regularly hosts online events for families.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {videoGroupsVisible.length > 0 && (
        <section id="videos" className="alt-bg resource-section">
          <div className="container">
            <span className="section-label">Watch &amp; Learn</span>
            <h2 className="section-title">Video Resources</h2>
            <p className="section-subtitle">
              Key videos that give you an inside look at Minerva. Organized by what you&apos;re most curious about.
            </p>
            {videoGroupsVisible.map((g, idx) => (
              <div key={g.id}>
                <h3
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: 'var(--obsidian)',
                    marginBottom: '1rem',
                  }}
                >
                  {g.heading}
                </h3>
                <div
                  className="video-grid"
                  style={idx < videoGroupsVisible.length - 1 ? { marginBottom: '2rem' } : undefined}
                >
                  {g.cards.map((c) => <VideoCard key={c.id} card={c} />)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

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
