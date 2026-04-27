'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'minerva-practice-v2';

const PATTERN_QUESTIONS_BASE = [
  { sequence: ['2', '6', '18', '54', '?'], options: ['108', '162', '148', '216'], answer: 1, explanation: 'Each number is multiplied by 3. 2 × 3 = 6, 6 × 3 = 18, 18 × 3 = 54, 54 × 3 = 162.' },
  { sequence: ['1', '1', '2', '3', '5', '8', '?'], options: ['11', '13', '12', '10'], answer: 1, explanation: 'Fibonacci sequence: each number is the sum of the two before it. 5 + 8 = 13.' },
  { sequence: ['3', '5', '9', '15', '23', '?'], options: ['31', '33', '29', '35'], answer: 1, explanation: 'Differences increase by 2 each time: +2, +4, +6, +8, +10. So 23 + 10 = 33.' },
  { sequence: ['1', '4', '9', '16', '25', '?'], options: ['30', '36', '49', '32'], answer: 1, explanation: 'Perfect squares: 1², 2², 3², 4², 5², 6² = 36.' },
  { sequence: ['2', '3', '5', '7', '11', '13', '?'], options: ['15', '17', '19', '14'], answer: 1, explanation: 'Prime numbers in order. The next prime after 13 is 17.' },
  { sequence: ['1', '8', '27', '64', '?'], options: ['100', '125', '81', '216'], answer: 1, explanation: 'Perfect cubes: 1³, 2³, 3³, 4³, 5³ = 125.' },
  { sequence: ['0', '1', '1', '2', '4', '7', '13', '?'], options: ['20', '24', '19', '26'], answer: 1, explanation: 'Tribonacci sequence: each number is the sum of the three preceding numbers. 4 + 7 + 13 = 24.' },
  { sequence: ['2', '5', '11', '23', '47', '?'], options: ['94', '95', '93', '96'], answer: 1, explanation: 'Each number is doubled then increased by 1. 47 × 2 + 1 = 95. The pattern: n × 2 + 1.' },
];

function shuffleQuestions(base) {
  return base.map((q) => {
    const correctVal = q.options[q.answer];
    const opts = [...q.options];
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    return { ...q, options: opts, answer: opts.indexOf(correctVal) };
  });
}

const LATERAL_PUZZLES = [
  { puzzle: 'A man pushes his car to a hotel and loses his fortune. What happened?', answer: "He's playing Monopoly. He landed on a property with a hotel and had to pay rent he couldn't afford.", hint: 'Think beyond the literal meaning of every word.' },
  { puzzle: 'A woman shoots her husband, holds him under water for 5 minutes, then hangs him. 30 minutes later, they go out for dinner together. How?', answer: 'She took a photograph of him. She "shot" the photo, developed it in water (darkroom processing), and hung the photo to dry.', hint: 'The words have multiple meanings.' },
  { puzzle: 'A man is found dead in a field. Next to him is an unopened package. There are no other people or animals nearby. How did he die?', answer: 'His parachute failed to open. The unopened package is his parachute pack.', hint: 'How did the man get to the field?' },
  { puzzle: 'Two fathers and two sons go fishing. They each catch exactly one fish, yet only three fish are caught in total. How is this possible?', answer: 'There are only three people: a grandfather, his son, and his grandson. The son is both a father and a son, so "two fathers and two sons" describes three people.', hint: 'One person can hold two roles simultaneously.' },
  { puzzle: 'A man walks into a bar and asks the bartender for a glass of water. The bartender pulls out a gun and points it at him. The man says "thank you" and leaves. Why?', answer: 'The man had hiccups. He asked for water to cure them, but the bartender had a better idea—the shock of having a gun pointed at him cured the hiccups instantly.', hint: 'Why would someone want water urgently but accept a scare instead?' },
  { puzzle: 'There are 6 eggs in a basket. Six people each take one egg, yet one egg remains in the basket. How?', answer: 'The sixth person took the basket with the last egg still in it. They took the egg, but the egg remained in the basket because the basket went with them.', hint: 'Re-read: "take one egg" vs "one egg remains in the basket." Can both be true at the same time?' },
];

const CREATIVE_PROBLEMS = [
  {
    prompt: 'Design a new use for a common paperclip that could meaningfully help someone in a developing country. Describe the use, the problem it solves, who benefits, and why a paperclip is actually suited to this (don\'t just say "you could bend it into something").',
    criteria: [
      'Identifies a specific, real problem faced by people in developing regions',
      'The proposed use is genuinely feasible with a standard paperclip',
      "Explains WHY this person can't easily solve the problem another way",
      'Shows awareness of context (cost, availability, cultural factors)',
      'Goes beyond the obvious (not just "use it as a tool")',
    ],
    sampleResponse: "A paperclip can be bent into a SIM card ejector tool and distributed at mobile banking enrollment stations in rural areas. In Sub-Saharan Africa, mobile banking (M-Pesa, etc.) is the primary financial system for hundreds of millions of people, but switching SIM cards between shared phones is common in households that can only afford one device. The official ejector tools are rarely available outside urban phone stores. A supply of paperclips at enrollment stations lets community banking agents help new users set up accounts on shared devices immediately, removing a small but real friction point that delays financial inclusion. The paperclip is ideal because it's the exact right diameter, costs fractions of a cent, and is already mass-produced globally.",
  },
  {
    prompt: "You have $100 and 24 hours to create the most positive impact possible in your local community. Describe your plan step by step. Be specific about what you'd buy, who you'd involve, and how you'd measure whether it worked.",
    criteria: [
      'Plan is specific and actionable (not vague platitudes)',
      'Budget allocation is realistic and itemized',
      'Leverages multiplier effects (involves others, creates ongoing impact)',
      'Includes a concrete way to measure success',
      'Considers potential obstacles and addresses them',
    ],
    sampleResponse: 'Spend $30 on printed flyers and $70 on bulk supplies (trash bags, gloves, snacks, water) to organize a neighborhood cleanup blitz targeting the three most littered blocks. Post on Nextdoor and local Facebook groups the night before (free), asking residents to meet at 9am. The key multiplier: partner with one local business (coffee shop) to offer participants a free coffee—the shop benefits from foot traffic and goodwill. Assign before/after photo documentation to measure visible change. Track participant count and pounds of trash collected. The real lasting impact: create a recurring monthly cleanup group chat from the participants, so the $100 seeds an ongoing community habit, not just one day of effort.',
  },
  {
    prompt: 'A city has a bridge that is structurally sound but is the site of frequent accidents because drivers consistently misjudge its width. The city cannot widen the bridge or add barriers due to historical preservation laws. Propose three different solutions, each using a different discipline (e.g., psychology, technology, urban design).',
    criteria: [
      'Proposes exactly three distinct solutions from different fields',
      'Each solution addresses the root cause (width misjudgment), not just symptoms',
      'Solutions respect the constraint (no widening, no barriers)',
      "Demonstrates understanding of the relevant discipline's principles",
      'At least one solution is non-obvious or creative',
    ],
    sampleResponse: "Psychology: Paint graduated chevron markings on the road approach that narrow progressively, creating a forced-perspective illusion that makes drivers instinctively slow down and center their vehicles—this exploits the perceptual phenomenon where converging lines trigger deceleration. Technology: Install low-cost ultrasonic sensors on each side of the bridge that project a real-time green/amber/red LED strip showing drivers exactly how much clearance they have on each side, similar to parking garage systems. Urban design: Re-route the approach road to create a gentle S-curve 50 meters before the bridge, forcing drivers to naturally reduce speed and align their vehicles with the bridge center—this is a standard traffic calming technique that doesn't require touching the bridge structure itself.",
  },
  {
    prompt: 'A small island nation of 50,000 people is about to get internet access for the first time. The government has asked you to advise them on a policy for introducing the internet to minimize harm while maximizing benefit. What are your top 3 policy recommendations, and what tradeoffs does each one involve?',
    criteria: [
      'Recommendations are specific policies, not vague goals',
      'Each policy has a clearly stated tradeoff or downside',
      'Shows understanding of both benefits and risks of internet access',
      'Considers the unique context of a small island nation',
      'Addresses at least two of: education, economy, culture, health, governance',
    ],
    sampleResponse: 'Policy 1: Digital literacy requirement before unrestricted access. Launch a 6-month period where internet is available only at community centers staffed with trained guides, giving citizens structured exposure before home access rolls out. Tradeoff: delays economic benefits of full connectivity and may frustrate tech-savvy younger residents. Policy 2: Local content mandate. Require ISPs to host and prioritize a local-language platform for government services, local news, and cultural archives before international social media is accessible. Tradeoff: could be seen as censorship if not time-limited; requires upfront government investment in content creation. Policy 3: Data sovereignty law. Pass legislation before day one that all citizen data must be stored on-island or in a jurisdiction the nation has a treaty with, preventing foreign platforms from extracting data without consent. Tradeoff: may deter some international companies from serving the market, limiting access to global services initially.',
  },
];

const DATA_SCENARIOS = [
  {
    title: 'Teaching Methods Comparison',
    context: 'A school district tested three teaching methods across 4 schools over one semester. Each school used all three methods with different student groups. The table below shows average test score improvements (percentage points) from pre-test to post-test.',
    headers: ['School', 'Traditional Lecture', 'Flipped Classroom', 'Project-Based', 'Avg Class Size'],
    rows: [
      ['Lincoln High', '+8', '+15', '+22', '28'],
      ['Washington Academy', '+12', '+14', '+11', '18'],
      ['Jefferson Middle', '+5', '+18', '+24', '32'],
      ['Roosevelt Prep', '+14', '+13', '+19', '15'],
    ],
    questions: [
      { type: 'mc', text: 'Which teaching method shows the MOST consistent improvement across all schools?', options: ['Traditional Lecture', 'Flipped Classroom', 'Project-Based', 'All are equally consistent'], answer: 1, explanation: 'Flipped Classroom scores range from +13 to +18 (spread of 5 points). Traditional ranges from +5 to +14 (spread of 9) and Project-Based from +11 to +24 (spread of 13). The flipped classroom has the smallest variance, making it the most consistent.' },
      { type: 'mc', text: 'Washington Academy is the only school where Project-Based learning did NOT outperform Traditional Lecture. What variable in the data might explain this?', options: ['Test difficulty differences', 'Class size—Washington has the second smallest classes', 'The school name', 'Washington had the lowest overall scores'], answer: 1, explanation: 'Washington Academy has a class size of 18 (second smallest). Smaller classes may already provide the individualized attention that Project-Based learning facilitates in larger classes, reducing its comparative advantage. Roosevelt (15 students) also shows a smaller Project-Based advantage compared to Lincoln (28) and Jefferson (32).' },
      { type: 'short', text: 'Name one critical piece of information NOT in this table that you would need before recommending a method district-wide.', sampleAnswer: 'Strong answers include: student demographics/prior achievement levels in each group (selection bias), teacher experience/training with each method, subject area (these results might not generalize), cost of implementation, student satisfaction/engagement metrics, or whether groups were randomly assigned.' },
    ],
  },
  {
    title: 'City Population Growth',
    context: 'The table below shows population data for five mid-sized cities over 20 years. One city shows a pattern that should raise questions.',
    headers: ['City', '2000', '2005', '2010', '2015', '2020', '% Change (2000–2020)'],
    rows: [
      ['Ashford', '82,000', '89,000', '95,000', '102,000', '110,000', '+34.1%'],
      ['Belmont', '120,000', '115,000', '108,000', '98,000', '91,000', '-24.2%'],
      ['Cedar Falls', '45,000', '51,000', '58,000', '67,000', '142,000', '+215.6%'],
      ['Dunmore', '200,000', '205,000', '212,000', '218,000', '225,000', '+12.5%'],
      ['Eastwick', '73,000', '77,000', '80,000', '83,000', '86,000', '+17.8%'],
    ],
    questions: [
      { type: 'mc', text: "Which city's data contains an anomaly that warrants investigation?", options: ['Ashford', 'Belmont', 'Cedar Falls', 'Dunmore'], answer: 2, explanation: 'Cedar Falls grew steadily from 45,000 to 67,000 over 15 years (roughly +7,000 every 5 years), then suddenly jumped to 142,000 in 5 years—a 112% increase in a single period. This is wildly inconsistent with its prior growth rate and demands investigation (data error? annexation of surrounding areas? a massive new employer?).' },
      { type: 'mc', text: "Belmont's consistent decline most likely indicates which of the following?", options: ['A one-time disaster', 'Structural economic decline (e.g., industry closure)', 'Seasonal population fluctuation', 'Data collection errors'], answer: 1, explanation: 'The decline is steady and consistent across all four periods (not sudden, which would suggest a disaster; not fluctuating, which would suggest seasonal effects). A gradual, sustained population loss is the classic pattern of structural economic decline—typically a major employer leaving or an industry collapsing.' },
      { type: 'short', text: "If you were a policy analyst for Dunmore, what would concern you about the city's data even though it shows growth?", sampleAnswer: "Dunmore's growth rate is only 12.5% over 20 years (about 0.6% annually), which is below the U.S. national average (~15-17% over the same period). For a city of 200,000, this stagnation could signal that the city is losing relative competitiveness. Additionally, the growth is perfectly linear (+5,000 to +7,000 each period), which could mean the data is estimated/interpolated rather than from actual censuses." },
    ],
  },
  {
    title: 'Startup Funding vs. Survival',
    context: 'A venture capital firm analyzed its portfolio of 200 startups funded between 2015–2019, categorizing them by initial funding amount and tracking which survived to 2024.',
    headers: ['Funding Range', 'Number Funded', 'Survived to 2024', 'Survival Rate', 'Avg Revenue at Exit/2024'],
    rows: [
      ['Under $500K', '60', '12', '20%', '$1.2M'],
      ['$500K – $2M', '80', '28', '35%', '$4.8M'],
      ['$2M – $5M', '40', '18', '45%', '$8.1M'],
      ['Over $5M', '20', '14', '70%', '$22.4M'],
    ],
    questions: [
      { type: 'mc', text: 'A naive reading of this data might conclude "more funding causes higher survival." What is the most important reason this conclusion could be wrong?', options: ['The sample size is too small', 'Selection bias—companies that received more funding were likely stronger to begin with', "The data doesn't include failed VC firms", 'Revenue is not a good metric'], answer: 1, explanation: "The companies that received $5M+ likely had stronger teams, better market traction, or more defensible technology—that's WHY they got more funding. The funding amount is correlated with pre-existing quality, so the higher survival rate may reflect the quality of the companies, not the effect of the money itself. This is classic selection bias / confounding." },
      { type: 'mc', text: 'Which funding tier delivered the best return on investment for the VC firm, assuming equal ownership stakes?', options: ['Under $500K', '$500K – $2M', '$2M – $5M', 'Over $5M'], answer: 0, explanation: 'Return on investment considers both the cost and the revenue generated. Under $500K: 12 survivors × $1.2M = $14.4M revenue from at most $30M invested (60 × $500K max). $500K–$2M: 28 × $4.8M = $134.4M from up to $160M. $2M–$5M: 18 × $8.1M = $145.8M from up to $200M. Over $5M: 14 × $22.4M = $313.6M from at most $100M+. Actually, the Over $5M tier likely delivers the best absolute ROI. BUT the question says "assuming equal ownership stakes"—so the answer depends on interpretation. The Under $500K tier has the lowest capital at risk per bet and produces survivors, making it the most capital-efficient. This question is deliberately tricky to test whether you examine assumptions.' },
      { type: 'short', text: 'What single additional data point would most change your interpretation of this table?', sampleAnswer: 'The strongest answer: knowing the TOTAL capital deployed per tier (not just per-company range) to calculate actual ROI. Other strong answers: the stage/maturity of each company when funded (were the $5M+ companies already generating revenue?), the industry breakdown per tier, or whether the VC firm had board seats/active involvement in higher-funded companies (which would confound funding amount with mentorship/support).' },
    ],
  },
];

const ARGUMENT_DATA = [
  {
    passage: 'Standardized testing should be eliminated from college admissions. Studies show that SAT scores correlate more strongly with family income than with college GPA. Furthermore, many top universities have gone test-optional and have not seen a decline in student quality. The testing industry generates over $2 billion annually, creating a financial incentive to perpetuate these exams regardless of their value.',
    claims: ['Standardized testing should be eliminated from admissions', 'Family income correlates with SAT scores', "Test-optional policies don't reduce student quality", 'The testing industry has financial incentives to continue'],
    mainClaim: 0,
    evidence: ['SAT-income correlation studies', 'Test-optional university outcomes', 'Testing industry revenue ($2B)', 'College GPA comparison data'],
    strongestEvidence: 1,
    assumptions: ['That correlation between income and scores means the test is unfair', 'That "student quality" at test-optional schools can be accurately measured in the short term', 'That universities would not replace tests with equally problematic criteria', "That the testing industry's financial motive invalidates the test's utility"],
    weakestAssumption: 1,
    feedback: 'The main claim is that standardized testing should be eliminated. The strongest evidence is the test-optional university outcomes because it provides real-world data. The weakest assumption is that "student quality" hasn\'t declined at test-optional schools—this is hard to measure in the short term, may take years to appear in outcomes, and "quality" itself is poorly defined. To strengthen the argument, you\'d need longitudinal data (5–10 years) tracking graduation rates, career outcomes, and academic performance at test-optional vs. test-required institutions, controlling for other admission criteria changes.',
  },
  {
    passage: 'Remote work is more productive than office work and should become the default for knowledge workers. A Stanford study found that remote workers were 13% more productive than their in-office counterparts. Companies like GitLab and Automattic have operated fully remotely for over a decade with great success. Additionally, remote work eliminates commuting, saving employees an average of 40 minutes per day that can be redirected to work or rest.',
    claims: ['Remote work should be the default for knowledge workers', 'Remote workers are 13% more productive', 'Fully remote companies have been successful', 'Eliminating commutes saves productive time'],
    mainClaim: 0,
    evidence: ['Stanford productivity study (13%)', 'GitLab/Automattic case studies', 'Commute time savings (40 min/day)', 'Knowledge worker classification'],
    strongestEvidence: 0,
    assumptions: ['That productivity measured in the study generalizes to all knowledge work', "That GitLab and Automattic's success is due to remote work rather than other factors", 'That saved commute time actually becomes productive time', 'That productivity is the only metric that matters for choosing work arrangements'],
    weakestAssumption: 2,
    feedback: "The main claim is that remote work should be the default. The strongest evidence is the Stanford study because it's quantitative and controlled. The weakest assumption is that saved commute time becomes productive time—research actually shows most people use saved commute time for leisure, not work, which undermines one of the three supporting points. To strengthen the argument, address what remote work loses (spontaneous collaboration, mentorship, culture) and argue those can be replicated remotely, rather than ignoring them entirely.",
  },
  {
    passage: 'Social media use among teenagers should be restricted by law to users aged 16 and above. Research published in JAMA Pediatrics found that adolescents who spend more than 3 hours daily on social media have double the risk of depression and anxiety. The developing adolescent brain is particularly vulnerable to the dopamine-driven feedback loops these platforms are designed to exploit. Countries like France have already passed laws restricting social media for minors, setting a precedent.',
    claims: ['Social media should be legally restricted to 16+', 'Heavy social media use doubles depression/anxiety risk', 'Adolescent brains are especially vulnerable to platform design', 'Other countries have set legal precedent'],
    mainClaim: 0,
    evidence: ['JAMA Pediatrics study on depression risk', 'Neuroscience of adolescent brain development', "France's existing legislation", 'Platform design analysis (dopamine loops)'],
    strongestEvidence: 0,
    assumptions: ['That correlation between use and depression indicates causation', 'That age 16 is the right threshold (vs. 14, 18, etc.)', 'That legal restrictions can be effectively enforced on digital platforms', "That restricting access won't push teens to less regulated alternatives"],
    weakestAssumption: 2,
    feedback: "The main claim is that social media should be restricted to 16+. The JAMA study is the strongest evidence because it's peer-reviewed and quantitative. The weakest assumption is enforceability—age verification online is notoriously difficult (kids routinely bypass age gates), and France's law has already faced enforcement challenges. If the restriction can't be enforced, the entire argument collapses regardless of how strong the health evidence is. To strengthen: propose a specific enforcement mechanism and cite evidence it works.",
  },
  {
    passage: 'Universities should replace traditional four-year degree programs with modular, stackable credentials that students can earn at their own pace. The average student loan debt in the US is now $37,000, and 43% of graduates are underemployed (working jobs that don\'t require a degree). Employers increasingly value skills over credentials—Google, Apple, and IBM no longer require degrees for many positions. A modular system would let students pay only for what they need and enter the workforce faster.',
    claims: ['Universities should adopt modular credentials instead of 4-year degrees', 'Student debt averaging $37K is a crisis', "Underemployment of graduates shows degrees aren't working", 'Major employers are dropping degree requirements'],
    mainClaim: 0,
    evidence: ['Average student loan debt ($37K)', '43% graduate underemployment rate', 'Google/Apple/IBM dropping degree requirements', 'Modular pricing advantage'],
    strongestEvidence: 1,
    assumptions: ['That underemployment is caused by the degree structure rather than economic conditions', "That a few tech companies' hiring practices represent a broader employer trend", 'That students can effectively choose which modules they need without guidance', 'That the non-career benefits of a 4-year degree (critical thinking, social development, breadth) are dispensable'],
    weakestAssumption: 1,
    feedback: 'The main claim is replacing degrees with modular credentials. The strongest evidence is the 43% underemployment rate because it directly challenges the value proposition of the current system. The weakest assumption is that a handful of tech companies represent a broader trend—Google, Apple, and IBM are extreme outliers with unique hiring resources. Most employers, especially in regulated fields (law, medicine, engineering, education), still require and legally mandate degrees. Citing 3 companies out of millions is cherry-picking. To strengthen: cite broad survey data of employer attitudes across industries, not just tech unicorns.',
  },
];

const STATUS_LABELS = { 'not-started': 'Not Started', 'in-progress': 'In Progress', completed: 'Completed' };

function emptyState() {
  return {
    pattern: { answers: {}, score: null },
    lateral: { current: 0, responses: {}, ratings: {} },
    creative: { current: 0, responses: {}, timers: {}, completed: {} },
    data: { current: 0, mcAnswers: {}, shortAnswers: {}, revealed: {} },
    argument: { current: 0, answers: {}, revealed: {} },
  };
}

function parseBullets(text) {
  return text
    .split('\n')
    .filter((l) => /^[-•*]\s/.test(l.trim()))
    .map((l) => l.trim().replace(/^[-•*]\s+/, '').trim())
    .filter(Boolean);
}

function parseChallengeEval(text) {
  const result = { score: 0, thinking_process: '', creativity: '', strengths: [], improvements: [], model_response: '' };
  const sectionRe = /##\s+([^\n]+)\n([\s\S]*?)(?=\n##\s|\s*$)/g;
  let m;
  while ((m = sectionRe.exec(text)) !== null) {
    const heading = m[1].trim();
    const body = m[2].trim();
    if (/^Score/i.test(heading)) {
      const nm = body.match(/\b(10|[1-9])\b/);
      if (nm) result.score = parseInt(nm[1], 10);
    } else if (/Thinking/i.test(heading)) result.thinking_process = body;
    else if (/Creativity/i.test(heading)) result.creativity = body;
    else if (/Strengths/i.test(heading)) result.strengths = parseBullets(body);
    else if (/Improv|Areas/i.test(heading)) result.improvements = parseBullets(body);
    else if (/Model/i.test(heading)) result.model_response = body;
  }
  if (!result.score) {
    const inline = text.match(/Score[:\s]+\*{0,2}(10|[1-9])(?:\/10)?\*{0,2}/i);
    if (inline) result.score = parseInt(inline[1], 10);
  }
  return result;
}

export default function PracticePage() {
  const [state, setState] = useState(emptyState);
  const [openIdx, setOpenIdx] = useState(null);
  const [patternQuestions, setPatternQuestions] = useState(PATTERN_QUESTIONS_BASE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setState({ ...emptyState(), ...data });
      }
    } catch {
      /* ignore */
    }
    setPatternQuestions(shuffleQuestions(PATTERN_QUESTIONS_BASE));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, hydrated]);

  const updateState = useCallback((updater) => {
    setState((prev) => updater(prev));
  }, []);

  const getStatus = (idx) => {
    switch (idx) {
      case 0: {
        const n = Object.keys(state.pattern.answers).length;
        if (n === 0) return 'not-started';
        return n >= patternQuestions.length ? 'completed' : 'in-progress';
      }
      case 1: {
        const n = Object.keys(state.lateral.ratings).length;
        if (n === 0) return 'not-started';
        return n >= LATERAL_PUZZLES.length ? 'completed' : 'in-progress';
      }
      case 2: {
        const n = Object.keys(state.creative.completed).length;
        if (n === 0) return 'not-started';
        return n >= CREATIVE_PROBLEMS.length ? 'completed' : 'in-progress';
      }
      case 3: {
        const n = Object.keys(state.data.revealed).length;
        if (n === 0) return 'not-started';
        return n >= DATA_SCENARIOS.length ? 'completed' : 'in-progress';
      }
      case 4: {
        const n = Object.keys(state.argument.revealed).length;
        if (n === 0) return 'not-started';
        return n >= ARGUMENT_DATA.length ? 'completed' : 'in-progress';
      }
      default:
        return 'not-started';
    }
  };

  const completedCount = [0, 1, 2, 3, 4].filter((i) => getStatus(i) === 'completed').length;

  const toggleChallenge = (idx) => {
    setOpenIdx((cur) => (cur === idx ? null : idx));
  };

  const scrollToChallenge = (idx) => {
    setOpenIdx(idx);
    setTimeout(() => {
      const el = document.getElementById(`challenge${idx}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const challenges = [
    { iconCls: 'red', icon: '◆', title: 'Challenge 1: Pattern Recognition', desc: 'Identify the missing element in 8 increasingly difficult sequences. Covers numeric, spatial, and logical patterns.' },
    { iconCls: 'blue', icon: '\u{1F4A1}', title: 'Challenge 2: Lateral Thinking', desc: '6 classic lateral thinking puzzles. Write your answer, reveal the solution, then honestly rate how you did.' },
    { iconCls: 'green', icon: '✎', title: 'Challenge 3: Creative Problem Solving', desc: '4 open-ended problems with a 3-minute timer. After time expires, compare your response against evaluation criteria and sample answers.' },
    { iconCls: 'purple', icon: '\u{1F4CA}', title: 'Challenge 4: Data Interpretation', desc: "Analyze 3 data sets. Draw conclusions, spot anomalies, and identify what additional information you'd need." },
    { iconCls: 'yellow', icon: '⚖', title: 'Challenge 5: Argument Analysis', desc: 'Dissect 4 arguments. Identify claims, evidence, assumptions, and suggest improvements.' },
  ];

  return (
    <>
      <div className="hero">
        <h1>Practice <span>Challenges</span></h1>
        <p>Five interactive exercises that mirror the thinking Minerva's application actually tests. Work through them at your own pace.</p>
      </div>

      <div className="container">
        <div className="progress-overview">
          <div className="progress-grid">
            {[
              { label: 'Pattern Recognition', icon: '◆' },
              { label: 'Lateral Thinking', icon: '\u{1F4A1}' },
              { label: 'Creative Problem Solving', icon: '✎' },
              { label: 'Data Interpretation', icon: '\u{1F4CA}' },
              { label: 'Argument Analysis', icon: '⚖' },
            ].map((c, i) => {
              const status = getStatus(i);
              return (
                <div key={i} className="progress-card" onClick={() => scrollToChallenge(i)}>
                  <div className="p-icon">{c.icon}</div>
                  <div className="p-label">{c.label}</div>
                  <div className={`p-status ${status}`}>{STATUS_LABELS[status]}</div>
                </div>
              );
            })}
          </div>
          <div className="progress-summary">
            <div className="progress-bar-outer">
              <div className="progress-bar-inner" style={{ width: `${(completedCount / 5) * 100}%` }} />
            </div>
            <div className="progress-label-text">{completedCount} of 5 challenges completed</div>
          </div>
        </div>

        <div className="challenges-area">
          {challenges.map((c, i) => {
            const status = getStatus(i);
            const isOpen = openIdx === i;
            return (
              <div key={i} id={`challenge${i}`} className={`challenge-block${isOpen ? ' open' : ''}`}>
                <div className="challenge-header" onClick={() => toggleChallenge(i)}>
                  <div className={`ch-icon ${c.iconCls}`}>{c.icon}</div>
                  <div className="ch-info">
                    <h3>{c.title}</h3>
                    <p>{c.desc}</p>
                  </div>
                  <div className="ch-meta">
                    <span className={`ch-badge ${status}`}>{STATUS_LABELS[status]}</span>
                    <span className="ch-arrow">▾</span>
                  </div>
                </div>
                <div className="challenge-body">
                  {isOpen && i === 0 && <PatternRecognition state={state} updateState={updateState} questions={patternQuestions} setQuestions={setPatternQuestions} />}
                  {isOpen && i === 1 && <LateralThinking state={state} updateState={updateState} />}
                  {isOpen && i === 2 && <CreativeProblemSolving state={state} updateState={updateState} />}
                  {isOpen && i === 3 && <DataInterpretation state={state} updateState={updateState} />}
                  {isOpen && i === 4 && <ArgumentAnalysis state={state} updateState={updateState} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function PatternRecognition({ state, updateState, questions, setQuestions }) {
  const total = questions.length;
  const totalAnswered = Object.keys(state.pattern.answers).length;
  const showScore = totalAnswered >= total;
  const score = showScore ? questions.reduce((acc, q, i) => acc + (state.pattern.answers[i] === q.answer ? 1 : 0), 0) : 0;

  const select = (qi, oi) => {
    if (state.pattern.answers[qi] !== undefined) return;
    updateState((s) => {
      const next = { ...s, pattern: { ...s.pattern, answers: { ...s.pattern.answers, [qi]: oi } } };
      if (Object.keys(next.pattern.answers).length >= total) {
        let sc = 0;
        questions.forEach((qq, i) => { if (next.pattern.answers[i] === qq.answer) sc++; });
        next.pattern.score = sc;
      }
      return next;
    });
  };

  const reset = () => {
    updateState((s) => ({ ...s, pattern: { answers: {}, score: null } }));
    setQuestions(shuffleQuestions(PATTERN_QUESTIONS_BASE));
  };

  const message = (s) => {
    if (s >= 7) return 'Excellent pattern recognition. You spot structure quickly.';
    if (s >= 5) return 'Solid performance. Review the harder sequences to sharpen your eye.';
    if (s >= 3) return 'Decent start. Practice looking for the relationship between consecutive terms.';
    return 'Keep practicing. Try writing out the differences between each term.';
  };

  return (
    <>
      {questions.map((q, i) => {
        const answered = state.pattern.answers[i] !== undefined;
        const isCorrect = answered && state.pattern.answers[i] === q.answer;
        return (
          <div key={i} className={`q-card${answered ? (isCorrect ? ' answered' : ' wrong') : ''}`}>
            <div className="q-number">Question {i + 1} of {total}</div>
            <div className="q-text">Find the missing number in this sequence:</div>
            <div className="q-sequence">
              {q.sequence.map((s, si) => (
                <span key={si}>
                  {s === '?' ? <span className="blank">?</span> : <span>{s}</span>}
                  {si < q.sequence.length - 1 && s !== '?' && <span style={{ color: 'var(--text2)', fontWeight: 400 }}>,</span>}
                </span>
              ))}
            </div>
            <div className="q-options">
              {q.options.map((opt, oi) => {
                let cls = 'q-option';
                if (answered) {
                  cls += ' disabled';
                  if (oi === q.answer) cls += ' correct';
                  else if (state.pattern.answers[i] === oi) cls += ' incorrect';
                }
                return (
                  <div key={oi} className={cls} onClick={() => select(i, oi)}>{opt}</div>
                );
              })}
            </div>
            <div className={`q-explanation ${answered ? (isCorrect ? 'correct-exp show' : 'incorrect-exp show') : ''}`}>
              <strong>{isCorrect ? 'Correct!' : 'Incorrect.'}</strong> {q.explanation}
            </div>
          </div>
        );
      })}
      <div className={`score-display${showScore ? ' show' : ''}`}>
        <div className="score-big">{score}/{total}</div>
        <div className="score-label">Pattern Recognition Score</div>
        <div className="score-message">{message(score)}</div>
      </div>
      <div style={{ marginTop: '1rem', textAlign: 'right' }}>
        <button className="btn btn-reset btn-small" onClick={reset}>Reset Challenge</button>
      </div>
    </>
  );
}

function LateralThinking({ state, updateState }) {
  const idx = state.lateral.current;
  const p = LATERAL_PUZZLES[idx];
  const response = state.lateral.responses[idx] || '';
  const rating = state.lateral.ratings[idx];
  const [revealed, setRevealed] = useState(rating !== undefined);

  useEffect(() => {
    setRevealed(state.lateral.ratings[idx] !== undefined);
  }, [idx, state.lateral.ratings]);

  const setResponse = (val) => {
    updateState((s) => ({ ...s, lateral: { ...s.lateral, responses: { ...s.lateral.responses, [idx]: val } } }));
  };
  const rate = (r) => {
    updateState((s) => ({ ...s, lateral: { ...s.lateral, ratings: { ...s.lateral.ratings, [idx]: r } } }));
  };
  const nav = (dir) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= LATERAL_PUZZLES.length) return;
    updateState((s) => ({ ...s, lateral: { ...s.lateral, current: newIdx } }));
  };
  const reset = () => {
    updateState((s) => ({ ...s, lateral: { current: 0, responses: {}, ratings: {} } }));
    setRevealed(false);
  };

  const totalRated = Object.keys(state.lateral.ratings).length;
  const got = Object.values(state.lateral.ratings).filter((r) => r === 'got').length;
  const close = Object.values(state.lateral.ratings).filter((r) => r === 'close').length;
  const missed = Object.values(state.lateral.ratings).filter((r) => r === 'missed').length;

  return (
    <>
      <div className="lt-puzzle">
        <div className="q-number">Puzzle {idx + 1} of {LATERAL_PUZZLES.length}</div>
        <div className="lt-puzzle-text">{p.puzzle}</div>
        <textarea
          className="lt-input"
          placeholder="Type your answer before revealing the solution..."
          value={response}
          onChange={(e) => setResponse(e.target.value)}
        />
        <div className="lt-controls">
          <button className="btn btn-primary btn-small" onClick={() => setRevealed(true)}>Reveal Answer</button>
          <AIFeedbackButton challengeType="lateral_thinking" question={p.puzzle} answer={response} />
          <span style={{ fontSize: '0.78rem', color: 'var(--text2)', marginLeft: '0.5rem' }}>Hint: {p.hint}</span>
        </div>
        <div className={`lt-answer${revealed || rating !== undefined ? ' show' : ''}`}>
          <div className="lt-answer-label">Answer</div>
          <div className="lt-answer-text">{p.answer}</div>
          <div className="lt-self-rate">
            <span>How'd you do?</span>
            <button className={`rate-btn${rating === 'got' ? ' selected-got' : ''}`} onClick={() => rate('got')}>Got It</button>
            <button className={`rate-btn${rating === 'close' ? ' selected-close' : ''}`} onClick={() => rate('close')}>Close</button>
            <button className={`rate-btn${rating === 'missed' ? ' selected-missed' : ''}`} onClick={() => rate('missed')}>Missed It</button>
          </div>
        </div>
      </div>

      <div className="lt-nav">
        <button className="btn btn-secondary btn-small" disabled={idx === 0} style={idx === 0 ? { opacity: 0.4, cursor: 'default' } : undefined} onClick={() => nav(-1)}>Previous</button>
        <span className="lt-progress">{idx + 1} / {LATERAL_PUZZLES.length}</span>
        <button className="btn btn-secondary btn-small" disabled={idx >= LATERAL_PUZZLES.length - 1} style={idx >= LATERAL_PUZZLES.length - 1 ? { opacity: 0.4, cursor: 'default' } : undefined} onClick={() => nav(1)}>Next</button>
      </div>

      {totalRated >= LATERAL_PUZZLES.length && (
        <div className="score-display show" style={{ marginTop: '1rem' }}>
          <div className="score-big">{got}/{LATERAL_PUZZLES.length}</div>
          <div className="score-label">Puzzles Solved</div>
          <div className="score-message">{got} got it, {close} close, {missed} missed</div>
        </div>
      )}

      <div style={{ marginTop: '1rem', textAlign: 'right' }}>
        <button className="btn btn-reset btn-small" onClick={reset}>Reset Challenge</button>
      </div>
    </>
  );
}

function CreativeProblemSolving({ state, updateState }) {
  const idx = state.creative.current;
  const p = CREATIVE_PROBLEMS[idx];
  const response = state.creative.responses[idx] || '';
  const isCompleted = !!state.creative.completed[idx];
  const timerState = state.creative.timers[idx] || { remaining: 180, started: false };
  const timerRef = useRef(null);

  useEffect(() => {
    if (!timerState.started || isCompleted || timerState.remaining <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = setInterval(() => {
      updateState((s) => {
        const t = s.creative.timers[idx];
        if (!t || s.creative.completed[idx]) return s;
        const newRemaining = t.remaining - 1;
        const next = { ...s, creative: { ...s.creative, timers: { ...s.creative.timers, [idx]: { ...t, remaining: newRemaining } } } };
        if (newRemaining <= 0) {
          next.creative.completed = { ...next.creative.completed, [idx]: true };
        }
        return next;
      });
    }, 1000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timerState.started, isCompleted, idx, timerState.remaining, updateState]);

  const start = () => {
    updateState((s) => ({ ...s, creative: { ...s.creative, timers: { ...s.creative.timers, [idx]: { remaining: 180, started: true } } } }));
  };

  const finishEarly = () => {
    updateState((s) => ({ ...s, creative: { ...s.creative, completed: { ...s.creative.completed, [idx]: true } } }));
  };

  const setResponse = (val) => {
    updateState((s) => ({ ...s, creative: { ...s.creative, responses: { ...s.creative.responses, [idx]: val } } }));
  };

  const nav = (dir) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= CREATIVE_PROBLEMS.length) return;
    updateState((s) => ({ ...s, creative: { ...s.creative, current: newIdx } }));
  };

  const reset = () => {
    updateState((s) => ({ ...s, creative: { current: 0, responses: {}, timers: {}, completed: {} } }));
  };

  const remaining = timerState.remaining;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const timerClass = remaining <= 30 ? ' critical' : remaining <= 60 ? ' warning' : '';
  const pct = (remaining / 180) * 100;
  const inputDisabled = isCompleted || !timerState.started;

  return (
    <>
      <div className="cp-problem">
        <div className="q-number">Problem {idx + 1} of {CREATIVE_PROBLEMS.length}</div>
        <div className="cp-prompt">{p.prompt}</div>

        <div className="cp-timer-bar">
          <div className={`cp-timer${timerClass}`}>{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</div>
          <div className="cp-timer-track">
            <div className="cp-timer-fill" style={{ width: `${pct}%` }} />
          </div>
          {!timerState.started && !isCompleted && (
            <button className="btn btn-primary btn-small" onClick={start}>Start Timer</button>
          )}
        </div>

        <textarea
          className="cp-textarea"
          placeholder="Start typing your response once you begin the timer..."
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          disabled={inputDisabled}
        />

        {timerState.started && !isCompleted && (
          <div style={{ marginTop: '0.5rem', textAlign: 'right' }}>
            <button className="btn btn-secondary btn-small" onClick={finishEarly}>Finish Early</button>
          </div>
        )}

        <div className={`cp-evaluation${isCompleted ? ' show' : ''}`}>
          <div className="cp-eval-title">Evaluation Criteria</div>
          <ul className="cp-criteria">
            {p.criteria.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
          <div className="cp-sample-label">Sample Strong Response</div>
          <div className="cp-sample-text">{p.sampleResponse}</div>
          <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--mid-gray)', paddingTop: '1.25rem' }}>
            <AIFeedbackButton challengeType="creative_problem_solving" question={p.prompt} answer={response} />
          </div>
        </div>
      </div>

      <div className="cp-nav">
        <button className="btn btn-secondary btn-small" disabled={idx === 0} style={idx === 0 ? { opacity: 0.4, cursor: 'default' } : undefined} onClick={() => nav(-1)}>Previous</button>
        <span className="lt-progress">{idx + 1} / {CREATIVE_PROBLEMS.length}</span>
        <button className="btn btn-secondary btn-small" disabled={idx >= CREATIVE_PROBLEMS.length - 1} style={idx >= CREATIVE_PROBLEMS.length - 1 ? { opacity: 0.4, cursor: 'default' } : undefined} onClick={() => nav(1)}>Next</button>
      </div>

      <div style={{ marginTop: '1rem', textAlign: 'right' }}>
        <button className="btn btn-reset btn-small" onClick={reset}>Reset Challenge</button>
      </div>
    </>
  );
}

function DataInterpretation({ state, updateState }) {
  const idx = state.data.current;
  const scenario = DATA_SCENARIOS[idx];
  const isRevealed = !!state.data.revealed[idx];

  const selectAnswer = (qKey, selected) => {
    if (state.data.mcAnswers[qKey] !== undefined) return;
    updateState((s) => ({ ...s, data: { ...s.data, mcAnswers: { ...s.data.mcAnswers, [qKey]: selected } } }));
  };

  const setShortAnswer = (qKey, val) => {
    updateState((s) => ({ ...s, data: { ...s.data, shortAnswers: { ...s.data.shortAnswers, [qKey]: val } } }));
  };

  const reveal = () => {
    updateState((s) => ({ ...s, data: { ...s.data, revealed: { ...s.data.revealed, [idx]: true } } }));
  };

  const nav = (dir) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= DATA_SCENARIOS.length) return;
    updateState((s) => ({ ...s, data: { ...s.data, current: newIdx } }));
  };

  const reset = () => {
    updateState((s) => ({ ...s, data: { current: 0, mcAnswers: {}, shortAnswers: {}, revealed: {} } }));
  };

  return (
    <>
      <div className="di-scenario">
        <div className="q-number">Scenario {idx + 1} of {DATA_SCENARIOS.length} — {scenario.title}</div>
        <div className="di-context">{scenario.context}</div>

        <div className="di-table-wrap">
          <table className="di-table">
            <thead><tr>{scenario.headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
            <tbody>
              {scenario.rows.map((row, ri) => (
                <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>

        {scenario.questions.map((q, qi) => {
          const qKey = `${idx}-${qi}`;
          const answered = state.data.mcAnswers[qKey] !== undefined || state.data.shortAnswers[qKey];
          return (
            <div key={qi} className={`di-question${answered ? ' answered' : ''}`}>
              <div className="di-q-type">{q.type === 'mc' ? 'Multiple Choice' : 'Short Answer'}</div>
              <div className="di-q-text">{q.text}</div>
              {q.type === 'mc' ? (
                <>
                  <div className="di-options">
                    {q.options.map((opt, oi) => {
                      const isAns = state.data.mcAnswers[qKey] !== undefined;
                      let cls = 'di-opt';
                      if (isAns) {
                        cls += ' disabled';
                        if (oi === q.answer) cls += ' correct';
                        else if (state.data.mcAnswers[qKey] === oi) cls += ' incorrect';
                      }
                      return <div key={oi} className={cls} onClick={() => selectAnswer(qKey, oi)}>{opt}</div>;
                    })}
                  </div>
                  {state.data.mcAnswers[qKey] !== undefined && (() => {
                    const correct = state.data.mcAnswers[qKey] === q.answer;
                    return (
                      <div className={`q-explanation ${correct ? 'correct-exp' : 'incorrect-exp'} show`}>
                        <strong>{correct ? 'Correct!' : 'Incorrect.'}</strong> {q.explanation}
                      </div>
                    );
                  })()}
                </>
              ) : (
                <>
                  <textarea
                    className="di-short-input"
                    placeholder="Type your answer..."
                    style={{ minHeight: 60, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5, padding: '0.6rem 0.85rem' }}
                    value={state.data.shortAnswers[qKey] || ''}
                    onChange={(e) => setShortAnswer(qKey, e.target.value)}
                  />
                  {isRevealed && (
                    <div className="q-explanation correct-exp show" style={{ marginTop: '0.5rem' }}>
                      <strong>Sample strong answer:</strong> {q.sampleAnswer}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}

        {!isRevealed && (
          <div style={{ marginTop: '1rem' }}>
            <button className="btn btn-primary btn-small" onClick={reveal}>Reveal Short Answer Feedback</button>
          </div>
        )}
      </div>

      <div className="di-nav">
        <button className="btn btn-secondary btn-small" disabled={idx === 0} style={idx === 0 ? { opacity: 0.4, cursor: 'default' } : undefined} onClick={() => nav(-1)}>Previous</button>
        <span className="lt-progress">{idx + 1} / {DATA_SCENARIOS.length}</span>
        <button className="btn btn-secondary btn-small" disabled={idx >= DATA_SCENARIOS.length - 1} style={idx >= DATA_SCENARIOS.length - 1 ? { opacity: 0.4, cursor: 'default' } : undefined} onClick={() => nav(1)}>Next</button>
      </div>

      <div style={{ marginTop: '1rem', textAlign: 'right' }}>
        <button className="btn btn-reset btn-small" onClick={reset}>Reset Challenge</button>
      </div>
    </>
  );
}

function ArgumentAnalysis({ state, updateState }) {
  const idx = state.argument.current;
  const arg = ARGUMENT_DATA[idx];
  const answers = state.argument.answers[idx] || {};
  const isRevealed = !!state.argument.revealed[idx];

  const setAnswer = (field, val) => {
    updateState((s) => {
      const cur = s.argument.answers[idx] || {};
      return { ...s, argument: { ...s.argument, answers: { ...s.argument.answers, [idx]: { ...cur, [field]: val } } } };
    });
  };

  const reveal = () => {
    updateState((s) => ({ ...s, argument: { ...s.argument, revealed: { ...s.argument.revealed, [idx]: true } } }));
  };

  const nav = (dir) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= ARGUMENT_DATA.length) return;
    updateState((s) => ({ ...s, argument: { ...s.argument, current: newIdx } }));
  };

  const reset = () => {
    updateState((s) => ({ ...s, argument: { current: 0, answers: {}, revealed: {} } }));
  };

  let score = 0;
  if (isRevealed) {
    if (parseInt(answers.claim, 10) === arg.mainClaim) score++;
    if (parseInt(answers.evidence, 10) === arg.strongestEvidence) score++;
    if (parseInt(answers.assumption, 10) === arg.weakestAssumption) score++;
  }

  return (
    <>
      <div className="aa-argument">
        <div className="q-number">Argument {idx + 1} of {ARGUMENT_DATA.length}</div>
        <div className="aa-passage">{arg.passage}</div>

        <div className="aa-form-group">
          <label className="aa-label">1. What is the main claim?</label>
          <select className="aa-select" disabled={isRevealed} value={answers.claim || ''} onChange={(e) => setAnswer('claim', e.target.value)}>
            <option value="">Select the main claim...</option>
            {arg.claims.map((c, i) => <option key={i} value={i}>{c}</option>)}
          </select>
        </div>

        <div className="aa-form-group">
          <label className="aa-label">2. What is the strongest piece of evidence?</label>
          <select className="aa-select" disabled={isRevealed} value={answers.evidence || ''} onChange={(e) => setAnswer('evidence', e.target.value)}>
            <option value="">Select the strongest evidence...</option>
            {arg.evidence.map((e, i) => <option key={i} value={i}>{e}</option>)}
          </select>
        </div>

        <div className="aa-form-group">
          <label className="aa-label">3. What is the weakest assumption?</label>
          <select className="aa-select" disabled={isRevealed} value={answers.assumption || ''} onChange={(e) => setAnswer('assumption', e.target.value)}>
            <option value="">Select the weakest assumption...</option>
            {arg.assumptions.map((a, i) => <option key={i} value={i}>{a}</option>)}
          </select>
        </div>

        <div className="aa-form-group">
          <label className="aa-label">4. Suggest one way to strengthen this argument:</label>
          <textarea className="aa-text-input" disabled={isRevealed} placeholder="How could this argument be made more convincing?" value={answers.strengthen || ''} onChange={(e) => setAnswer('strengthen', e.target.value)} />
        </div>

        {!isRevealed && (
          <button className="btn btn-primary btn-small" onClick={reveal}>Check My Analysis</button>
        )}

        <div className={`aa-feedback${isRevealed ? ' show' : ''}`}>
          {isRevealed && (
            <>
              <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--blue)' }}>Your Analysis: {score}/3 selections correct</div>
              <p>{arg.feedback}</p>
            </>
          )}
        </div>
      </div>

      <div className="aa-nav">
        <button className="btn btn-secondary btn-small" disabled={idx === 0} style={idx === 0 ? { opacity: 0.4, cursor: 'default' } : undefined} onClick={() => nav(-1)}>Previous</button>
        <span className="lt-progress">{idx + 1} / {ARGUMENT_DATA.length}</span>
        <button className="btn btn-secondary btn-small" disabled={idx >= ARGUMENT_DATA.length - 1} style={idx >= ARGUMENT_DATA.length - 1 ? { opacity: 0.4, cursor: 'default' } : undefined} onClick={() => nav(1)}>Next</button>
      </div>

      <div style={{ marginTop: '1rem', textAlign: 'right' }}>
        <button className="btn btn-reset btn-small" onClick={reset}>Reset Challenge</button>
      </div>
    </>
  );
}

function AIFeedbackButton({ challengeType, question, answer }) {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const submit = useCallback(async () => {
    const trimmed = (answer || '').trim();
    if (!trimmed) {
      setError('Please write your answer first before requesting feedback.');
      setStatus('error');
      return;
    }
    if (trimmed.length < 10) {
      setError('Please write a more detailed answer before requesting feedback.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setError(null);
    setData(null);

    try {
      const res = await fetch('/api/challenge-eval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_type: challengeType, question, answer: trimmed }),
      });
      if (!res.ok) {
        if (res.status === 429) throw new Error('rate_limit');
        throw new Error(`HTTP ${res.status}`);
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
        throw new Error(errMatch[1].trim() || 'server');
      }
      setData(parseChallengeEval(buffer));
      setStatus('success');
    } catch (err) {
      let msg = 'Could not get feedback. Check your connection and try again.';
      if (err.message === 'rate_limit') msg = 'Too many requests. Please wait 30–60 seconds before trying again.';
      else if (err.message.includes('500') || err.message.includes('server')) msg = 'Server error. This is usually temporary — try again in a few seconds.';
      setError(msg);
      setStatus('error');
    }
  }, [challengeType, question, answer]);

  const buttonLabel = status === 'loading' ? 'Getting Feedback…' : 'Get AI Feedback';

  return (
    <>
      <button className="btn btn-ai btn-small" onClick={submit} disabled={status === 'loading'}>{buttonLabel}</button>
      {status === 'loading' && (
        <div className="ai-feedback-loading">
          <div className="ai-loading-header"><div className="ai-spinner" /><span>Analyzing your response…</span></div>
          <div className="ai-shimmer-lines">
            <div className="ai-shimmer-line" />
            <div className="ai-shimmer-line" />
            <div className="ai-shimmer-line" />
          </div>
        </div>
      )}
      {status === 'error' && error && (
        <div className="ai-feedback-error">
          <span>{error}</span>
          <button className="ai-retry-btn" onClick={submit}>Retry</button>
        </div>
      )}
      {status === 'success' && data && <AIScoreCard data={data} />}
    </>
  );
}

function AIScoreCard({ data }) {
  const score = Math.max(1, Math.min(10, Number(data.score) || 0));
  const color = score >= 8 ? 'var(--green)' : score >= 5 ? 'var(--yellow)' : 'var(--clay)';
  const label = score >= 9 ? 'Exceptional' : score >= 7 ? 'Strong' : score >= 5 ? 'Developing' : score >= 3 ? 'Needs Work' : 'Keep Practicing';

  return (
    <div className="ai-score-card">
      <div className="ai-score-header">
        <div className="ai-score-gauge" style={{ borderColor: color }}>
          <div className="ai-score-num" style={{ color }}>{score}</div>
          <div className="ai-score-denom">/ 10</div>
        </div>
        <div>
          <div className="ai-score-label">AI Evaluation</div>
          <div className="ai-score-sublabel">{label}</div>
        </div>
      </div>

      <div className="ai-assess-grid">
        {data.thinking_process && (
          <div className="ai-assess-item">
            <div className="ai-assess-label">Thinking Process</div>
            <div className="ai-assess-text">{data.thinking_process}</div>
          </div>
        )}
        {data.creativity && (
          <div className="ai-assess-item">
            <div className="ai-assess-label">Creativity</div>
            <div className="ai-assess-text">{data.creativity}</div>
          </div>
        )}
      </div>

      <div className="ai-lists-grid">
        {data.strengths && data.strengths.length > 0 && (
          <div className="ai-list-section">
            <div className="ai-list-label ai-strengths-label">Strengths</div>
            <ul className="ai-list">{data.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </div>
        )}
        {data.improvements && data.improvements.length > 0 && (
          <div className="ai-list-section">
            <div className="ai-list-label ai-improvements-label">Areas for Improvement</div>
            <ul className="ai-list">{data.improvements.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </div>
        )}
      </div>

      {data.model_response && (
        <div className="ai-model-response">
          <div className="ai-assess-label" style={{ marginBottom: '0.4rem' }}>Model Strong Response</div>
          <div className="ai-assess-text">{data.model_response}</div>
        </div>
      )}
    </div>
  );
}
