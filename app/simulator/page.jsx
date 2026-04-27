'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'minerva-simulator';

const SLIDER_LABELS = {
  1: '1 - Low',
  2: '2 - Below Average',
  3: '3 - Moderate',
  4: '4 - Strong',
  5: '5 - Very Strong',
};

const CATEGORIES = [
  {
    key: 'academic',
    name: 'Academic Foundation',
    icon: '\u{1F4DA}',
    color: 'var(--clay)',
    bgColor: 'rgba(200,85,61,0.1)',
    questions: ['acad_rigor', 'acad_self_learn', 'acad_challenge', 'acad_difficulty'],
    feedback: {
      high: {
        strengths: [
          'Strong academic work ethic and comfort with challenge',
          'Active self-directed learner who goes beyond requirements',
          'Resilient approach to difficult material',
        ],
        develop: [
          'Continue seeking out the hardest problems in your areas of interest',
          'Start building a portfolio of self-driven projects or research',
        ],
        tips: [
          'In your application, show specific examples of intellectual initiative, not just grades',
          'Minerva does not look at standardized test scores, so focus your energy on demonstrating genuine curiosity',
        ],
      },
      mid: {
        strengths: [
          'Solid academic baseline with room to stretch further',
          'Some experience with self-directed learning',
        ],
        develop: [
          'Push yourself into harder material: take the advanced course, read the difficult book, tackle the proof',
          'Build a daily self-learning habit, even 30 minutes of deliberate practice outside school',
          'When you hit difficulty, practice sitting with discomfort instead of switching to easier tasks',
        ],
        tips: [
          'Start a learning project now that has nothing to do with school. Pick something hard and document your process.',
          'Minerva classes require preparation before every session. Build that habit now.',
        ],
      },
      low: {
        strengths: [
          'Self-awareness about your current academic habits is itself a strength',
          'Recognizing areas for growth is the first step to meaningful change',
        ],
        develop: [
          'Develop a structured self-study routine. Start with 30 minutes daily and increase gradually.',
          'Challenge yourself in at least one subject: take the harder course, join a study group, find a mentor.',
          'Shift your relationship with difficulty. Struggling means you are learning; avoiding struggle means you are not growing.',
        ],
        tips: [
          'Minerva looks for intellectual curiosity over polished transcripts. Start demonstrating that curiosity now.',
          'Read widely outside your comfort zone: philosophy, science, history, economics. Breadth matters at Minerva.',
          'Before applying, have at least one sustained self-learning project you can point to as evidence of initiative.',
        ],
      },
    },
  },
  {
    key: 'thinking',
    name: 'Creative & Critical Thinking',
    icon: '\u{1F4A1}',
    color: 'var(--blue)',
    bgColor: 'rgba(37,99,235,0.1)',
    questions: ['think_problem', 'think_ambiguity', 'think_interdisciplinary', 'think_assumptions'],
    feedback: {
      high: {
        strengths: [
          'Strong comfort with ambiguity and unstructured problems',
          'Natural interdisciplinary thinker who draws connections across fields',
          'Healthy skepticism and willingness to question assumptions, including your own',
        ],
        develop: [
          'Practice articulating your thinking process, not just your conclusions',
          'Seek out problems in domains you know nothing about',
        ],
        tips: [
          "Minerva's admissions challenges test exactly this: creative problem-solving under ambiguity. You are well-positioned.",
          'In essays, show HOW you think, not just WHAT you have accomplished. Walk through your reasoning.',
        ],
      },
      mid: {
        strengths: [
          'Growing comfort with non-obvious problems',
          'Some ability to think across disciplines',
        ],
        develop: [
          'Practice solving problems where there is no single right answer. Debate, case studies, and design challenges all build this muscle.',
          'Actively look for connections between things you are studying. How does a concept from biology relate to economics? How does art relate to engineering?',
          'Start a habit of questioning one thing you believe every week. Write down why you believe it and what evidence might change your mind.',
        ],
        tips: [
          'When preparing for Minerva\'s challenges, resist the urge to find the "right" answer. They want to see your thinking process.',
          'Read about mental models and frameworks from different fields. Charlie Munger\'s "latticework of mental models" is a good starting point.',
        ],
      },
      low: {
        strengths: [
          'Awareness that creative thinking is a skill worth developing',
          'Willingness to assess yourself honestly in this area',
        ],
        develop: [
          'Start small: when you read an article, ask "What assumptions is this making?" and "How could this be wrong?"',
          'Practice brainstorming. Set a timer for 5 minutes and generate as many solutions to a problem as you can. Quantity over quality at first.',
          'Expose yourself to fields outside your comfort zone. If you are a STEM person, read philosophy. If you are in humanities, learn basic statistics.',
          'Join a debate club, mock trial, or case competition. Structured argumentation builds critical thinking rapidly.',
        ],
        tips: [
          'This is a very learnable skill. Minerva teaches it explicitly through their curriculum, but starting now gives you a significant advantage.',
          'For the application challenges, practice working through problems out loud. Record yourself talking through logic puzzles or ethical dilemmas.',
        ],
      },
    },
  },
  {
    key: 'global',
    name: 'Global Readiness',
    icon: '\u{1F30D}',
    color: 'var(--green)',
    bgColor: 'rgba(5,150,105,0.1)',
    questions: ['global_experience', 'global_adapt', 'global_perspectives', 'global_change'],
    feedback: {
      high: {
        strengths: [
          'Significant cross-cultural experience or genuine openness to it',
          'Strong adaptability and comfort with change',
          'Authentic interest in understanding fundamentally different worldviews',
        ],
        develop: [
          'Deepen your engagement: move from observing other cultures to actively participating and building relationships',
          'Reflect on moments where your own cultural assumptions were challenged. Those stories are powerful.',
        ],
        tips: [
          'In your application, share specific moments of cross-cultural insight, not generic statements about valuing diversity.',
          'Minerva wants to see that you will thrive in their rotational model, not just survive it.',
        ],
      },
      mid: {
        strengths: [
          'Genuine curiosity about the world beyond your immediate context',
          'Willingness to step outside your comfort zone',
        ],
        develop: [
          'Actively seek out people with fundamentally different backgrounds in your own community. Have deep conversations.',
          'Practice being uncomfortable. Travel to a neighborhood in your city where you are the minority. Eat food you have never tried. Attend a cultural event where you know no one.',
          'Read international news from non-Western sources. Al Jazeera, The Hindu, The Japan Times. Notice how the same event is framed differently.',
        ],
        tips: [
          'You do not need to have traveled the world. Minerva has many students from small towns who had limited travel but deep curiosity.',
          'In your application, focus on HOW you engage with difference, not WHERE you have been.',
        ],
      },
      low: {
        strengths: [
          'Honestly assessing your starting point is valuable',
          'Interest in Minerva itself suggests you are open to growth in this area',
        ],
        develop: [
          'Start exposing yourself to different perspectives now. Watch films from other countries, read translated literature, follow international news.',
          'Find a language exchange partner or cultural exchange group in your area or online.',
          'Practice being in unfamiliar situations on purpose. The discomfort you feel is the same discomfort of moving to a new city every semester. Learn to manage it now.',
          'Build genuine relationships with people who are different from you, not as a resume line but as a real practice.',
        ],
        tips: [
          'Minerva will push you far outside your comfort zone. Applicants who show awareness of their limitations and a genuine desire to grow are valued over those who claim to already "get it."',
          'Consider whether you truly want this lifestyle. Living in seven cities in four years is exhilarating but demanding. Be honest with yourself.',
        ],
      },
    },
  },
  {
    key: 'communication',
    name: 'Communication & Collaboration',
    icon: '\u{1F5E3}\u{FE0F}',
    color: '#7c3aed',
    bgColor: 'rgba(124,58,237,0.1)',
    questions: ['comm_discussion', 'comm_disagree', 'comm_articulate', 'comm_teams'],
    feedback: {
      high: {
        strengths: [
          'Confident and constructive in group discussions',
          'Able to engage with disagreement productively rather than defensively',
          'Strong articulation of complex ideas',
        ],
        develop: [
          'Work on making others comfortable speaking up, not just contributing yourself',
          'Practice summarizing opposing viewpoints more effectively than their holders can',
        ],
        tips: [
          'Minerva classes are 100% active seminar. Your comfort here is a genuine advantage.',
          'In interviews or essays, demonstrate that you listen as much as you speak. Minerva wants collaborators, not performers.',
        ],
      },
      mid: {
        strengths: [
          'Baseline comfort with group work and discussion',
          'Some ability to handle disagreement constructively',
        ],
        develop: [
          'Practice speaking up in groups. Set a goal to contribute at least once in every discussion, class, or meeting.',
          'When someone disagrees with you, practice saying "Tell me more about why you think that" before defending your position.',
          'Write more. Clear writing is clear thinking. Start a journal, blog, or write explanations of complex topics for a friend.',
          'Seek out team projects with people whose working styles differ from yours.',
        ],
        tips: [
          'Minerva students are expected to speak in every class. If this makes you nervous, start practicing now by volunteering to speak first in smaller settings.',
          'Record yourself explaining a complex idea in 2 minutes. Listen back. Rewrite. Repeat. Clarity comes from practice.',
        ],
      },
      low: {
        strengths: [
          'Awareness that communication skills need development is the foundation for building them',
          'Being thoughtful or introverted is not a weakness; many strong Minerva students are introverts who learned to engage actively',
        ],
        develop: [
          'Start small: contribute one comment in every group setting. Build from there.',
          'Join a club, team, or group where you have to interact with others regularly. Debate, theater, community organizing all work.',
          'Practice articulating your thoughts by writing them down first. Then try saying them to one person. Then to a small group.',
          'Work on separating ideas from identity. Disagreement about an idea is not a personal attack. Practice this reframe.',
        ],
        tips: [
          'This is one of the most critical areas for Minerva success. Every class requires active verbal participation on camera.',
          'If you are introverted, that is fine, but you need a strategy for active engagement. Build that strategy now, before you apply.',
          'Consider taking a public speaking course, joining Toastmasters, or simply practicing explaining things to friends or family regularly.',
        ],
      },
    },
  },
  {
    key: 'motivation',
    name: 'Motivation & Fit',
    icon: '\u{1F3AF}',
    color: '#d97706',
    bgColor: 'rgba(217,119,6,0.1)',
    questions: ['motiv_why', 'motiv_cities', 'motiv_self', 'motiv_goal'],
    feedback: {
      high: {
        strengths: [
          'Clear and specific understanding of why Minerva fits you',
          'Strong self-motivation independent of external pressure',
          "Educational goals aligned with Minerva's mission of developing transferable skills",
        ],
        develop: [
          'Articulate your "why" even more specifically. What will you do at Minerva that you could not do anywhere else?',
          'Connect your goals to specific aspects of the curriculum or city rotation.',
        ],
        tips: [
          'Your application should clearly answer: "Why Minerva and not [excellent traditional university]?" Make it specific.',
          'Admissions readers can tell when someone wants Minerva specifically versus wanting any "good school." Show the former.',
        ],
      },
      mid: {
        strengths: [
          'Interest in what makes Minerva different from traditional universities',
          'Some degree of self-motivation and clarity about educational goals',
        ],
        develop: [
          'Dig deeper into why Minerva specifically. Read student blogs, watch class recordings, talk to current students. Generic interest is not enough.',
          'Build your self-motivation muscle: start a project with no deadline, no grade, and no external accountability. See if you finish it.',
          'Reflect on whether you want Minerva or just the idea of Minerva. The reality involves constant adaptation, small classes where you cannot hide, and no traditional campus life.',
        ],
        tips: [
          'Minerva admissions can tell the difference between "I want a good school" and "I want THIS school." Research deeply enough to demonstrate the latter.',
          'If your interest is mainly the travel, be honest with yourself. The travel is a byproduct of the educational model, not the point.',
        ],
      },
      low: {
        strengths: [
          'Taking this assessment shows some level of genuine interest',
          'Self-awareness about your current motivation level is useful',
        ],
        develop: [
          'Spend significant time researching what Minerva actually is. Start with their website, then find student YouTube channels and blog posts.',
          'Ask yourself hard questions: Do I want an active learning environment? Am I okay with no traditional campus, no sports teams, no Greek life?',
          'If your motivation is primarily external (parents, prestige, travel), pause and consider whether this is the right school for you.',
          'Build self-motivation now. Pick something hard that no one is making you do, and commit to it for 30 days.',
        ],
        tips: [
          'Applying to Minerva without genuine, specific motivation will show in your application. Admissions readers are very good at detecting this.',
          'There is no shame in deciding Minerva is not for you. It is a genuinely unusual university model and it is not optimal for everyone.',
          'If after deep research you are still excited, great. Channel that into the most specific, personal application you can write.',
        ],
      },
    },
  },
];

const ACTION_MAP = {
  academic: {
    high: '<strong>Academic:</strong> You are on track. Keep pushing the boundaries of what you study and how deeply you engage.',
    mid: '<strong>Academic:</strong> Build a daily self-learning habit starting this week. Pick one hard topic outside your school curriculum and spend 30 minutes a day on it for the next month.',
    low: '<strong>Academic:</strong> This is your highest-priority area. Start with one challenging online course (MIT OpenCourseWare, Khan Academy advanced topics, or Coursera). Complete it fully. Then start another.',
  },
  thinking: {
    high: '<strong>Creative & Critical Thinking:</strong> Challenge yourself with increasingly complex problems. Try writing about a topic from a perspective opposite to your own.',
    mid: '<strong>Creative & Critical Thinking:</strong> Join a debate club or start doing weekly "assumption audits" where you write down three things you believe and challenge each one. Practice solving open-ended problems with no clear answer.',
    low: '<strong>Creative & Critical Thinking:</strong> This needs focused effort. Start by reading one article per day and writing three questions about it. Practice solving lateral thinking puzzles. Consider taking a philosophy or logic course.',
  },
  global: {
    high: '<strong>Global Readiness:</strong> Deepen your cross-cultural engagement. Seek out meaningful conversations with people whose worldview is fundamentally different from yours.',
    mid: '<strong>Global Readiness:</strong> Expand your exposure. Start reading international news from three different regions daily. Find a language exchange partner. Attend cultural events in your community you have never been to.',
    low: '<strong>Global Readiness:</strong> Start small but start now. Follow three international news sources. Watch one film from a different country each week. Have one conversation per week with someone from a different background.',
  },
  communication: {
    high: '<strong>Communication:</strong> Focus on elevating others. Practice being the person who draws quieter voices into discussions. Master the art of summarizing complex group conversations.',
    mid: '<strong>Communication:</strong> Set a daily practice: explain one complex idea to someone in under two minutes. Join a group where regular discussion is expected. Practice writing concise summaries of things you read.',
    low: '<strong>Communication:</strong> This is critical for Minerva success. Start with low-stakes practice: explain your day to a family member in a structured way. Then join a small discussion group. Build up to public speaking gradually.',
  },
  motivation: {
    high: '<strong>Motivation & Fit:</strong> Your alignment is strong. Now make your application razor-specific. Connect your goals to exact Minerva courses, cities, and opportunities.',
    mid: '<strong>Motivation & Fit:</strong> Spend a full weekend researching Minerva deeply. Read the entire website. Watch student videos. Read about the Habits of Mind curriculum. Write down specifically what you would do at Minerva that you cannot do elsewhere.',
    low: '<strong>Motivation & Fit:</strong> Before investing time in an application, honestly assess whether Minerva is right for you. Talk to current students. Read critical perspectives too. Applying with vague motivation will not result in admission.',
  },
};

const STEPS = [
  {
    label: 'Step 1 of 5',
    title: 'Academic Foundation',
    subtitle: "Minerva's curriculum is rigorous and demands active engagement. This section assesses your relationship with academic work.",
    questions: [
      {
        qid: 'acad_rigor',
        type: 'slider',
        label: 'How comfortable are you with rigorous, challenging academic work?',
        leftLabel: 'Not comfortable',
        rightLabel: 'Very comfortable',
      },
      {
        qid: 'acad_self_learn',
        type: 'radio',
        label: 'How many hours per week do you currently spend on self-directed learning (outside of required schoolwork)?',
        options: [
          { value: 1, text: 'Less than 1 hour' },
          { value: 2, text: '1-3 hours' },
          { value: 3, text: '3-7 hours' },
          { value: 4, text: '7-15 hours' },
          { value: 5, text: '15+ hours' },
        ],
      },
      {
        qid: 'acad_challenge',
        type: 'radio',
        label: 'Have you taken the most challenging courses available to you (AP, IB, honors, or equivalent)?',
        options: [
          { value: 5, text: 'Yes, in every subject I could' },
          { value: 3, text: 'In some subjects, but not all' },
          { value: 1, text: 'No, I have generally taken standard-level courses' },
        ],
      },
      {
        qid: 'acad_difficulty',
        type: 'radio',
        label: 'When you encounter an academic subject you find genuinely difficult, what do you typically do?',
        options: [
          { value: 5, text: 'Seek out additional resources and keep working until I understand it deeply' },
          { value: 4, text: 'Ask teachers or peers for help and persist through it' },
          { value: 3, text: 'Put in more effort but sometimes settle for surface-level understanding' },
          { value: 2, text: 'Try harder for a while but eventually move on if it does not click' },
          { value: 1, text: 'Accept it is not my strength and focus on what I am good at' },
        ],
      },
    ],
  },
  {
    label: 'Step 2 of 5',
    title: 'Creative & Critical Thinking',
    subtitle: "Minerva's pedagogy centers on applying concepts to novel problems. This section explores how you approach ambiguity and unconventional challenges.",
    questions: [
      {
        qid: 'think_problem',
        type: 'radio',
        label: 'When you encounter a problem with no clear solution, what is your first instinct?',
        options: [
          { value: 5, text: 'Break it into smaller parts and experiment with different approaches' },
          { value: 4, text: 'Research how others have approached similar problems' },
          { value: 3, text: 'Think about it for a while and try one approach I think might work' },
          { value: 2, text: 'Ask someone more experienced for guidance first' },
          { value: 1, text: 'Feel stuck and unsure how to proceed without clear directions' },
        ],
      },
      {
        qid: 'think_ambiguity',
        type: 'slider',
        label: 'How comfortable are you operating in situations with ambiguity and no single right answer?',
        leftLabel: 'Very uncomfortable',
        rightLabel: 'Thrive in ambiguity',
      },
      {
        qid: 'think_interdisciplinary',
        type: 'radio',
        label: 'How would you describe your experience with interdisciplinary thinking (connecting ideas across different fields)?',
        options: [
          { value: 5, text: 'I regularly draw connections between unrelated fields and it shapes how I think' },
          { value: 4, text: 'I enjoy finding connections when they come up but do not actively seek them' },
          { value: 3, text: 'I can see connections when pointed out but do not naturally think this way' },
          { value: 2, text: 'I tend to think within one field at a time' },
          { value: 1, text: 'I prefer to focus deeply on one subject rather than connecting across fields' },
        ],
      },
      {
        qid: 'think_assumptions',
        type: 'radio',
        label: 'How often do you question assumptions, including your own?',
        options: [
          { value: 5, text: 'Constantly. I regularly challenge my own beliefs and seek out opposing views.' },
          { value: 4, text: 'Often. I try to examine my assumptions when making important decisions.' },
          { value: 3, text: 'Sometimes. I question things when something feels off but not habitually.' },
          { value: 2, text: 'Rarely. I generally trust my initial judgment.' },
          { value: 1, text: 'Almost never. I prefer to rely on established ways of thinking.' },
        ],
      },
    ],
  },
  {
    label: 'Step 3 of 5',
    title: 'Global Readiness',
    subtitle: 'You will live in seven different cities across four years and learn alongside people from over 90 countries. This section explores your readiness for that.',
    questions: [
      {
        qid: 'global_experience',
        type: 'radio',
        label: 'Have you lived in or spent significant time in a culture different from your own?',
        options: [
          { value: 5, text: 'Yes, I have lived in a different country or culture for an extended period' },
          { value: 4, text: 'I have traveled internationally and spent meaningful time in other cultures' },
          { value: 3, text: 'I have some exposure through my community or short trips' },
          { value: 2, text: 'Limited exposure, but I am very interested in experiencing other cultures' },
          { value: 1, text: 'No significant exposure to other cultures yet' },
        ],
      },
      {
        qid: 'global_adapt',
        type: 'slider',
        label: 'How comfortable are you with adapting to entirely new environments (new city, new people, new routines)?',
        leftLabel: 'Very uncomfortable',
        rightLabel: 'Highly adaptable',
      },
      {
        qid: 'global_perspectives',
        type: 'slider',
        label: 'Rate your genuine interest in understanding perspectives fundamentally different from your own.',
        leftLabel: 'Not interested',
        rightLabel: 'Deeply interested',
      },
      {
        qid: 'global_change',
        type: 'radio',
        label: 'How would you describe your relationship with change and uncertainty?',
        options: [
          { value: 5, text: 'I actively seek out change and find it energizing' },
          { value: 4, text: 'I handle change well and adapt quickly, even if it is initially uncomfortable' },
          { value: 3, text: 'I can manage change but prefer some stability and predictability' },
          { value: 2, text: 'I find change stressful but can get through it with support' },
          { value: 1, text: 'I strongly prefer stability and routine; change is very difficult for me' },
        ],
      },
    ],
  },
  {
    label: 'Step 4 of 5',
    title: 'Communication & Collaboration',
    subtitle: 'Every Minerva class is a small, active seminar. You cannot hide in the back row. This section assesses how you engage with others and express ideas.',
    questions: [
      {
        qid: 'comm_discussion',
        type: 'slider',
        label: 'How comfortable are you participating actively in small group discussions (not just listening)?',
        leftLabel: 'Very uncomfortable',
        rightLabel: 'Completely at ease',
      },
      {
        qid: 'comm_disagree',
        type: 'radio',
        label: 'When someone strongly disagrees with you in a discussion, what do you typically do?',
        options: [
          { value: 5, text: 'Engage with their reasoning, ask questions, and genuinely consider changing my view' },
          { value: 4, text: 'Listen carefully and try to understand their perspective, even if I ultimately disagree' },
          { value: 3, text: 'Defend my position but try to stay respectful' },
          { value: 2, text: 'Feel uncomfortable and tend to disengage or avoid the conflict' },
          { value: 1, text: 'Take it personally and find it hard to separate the argument from the person' },
        ],
      },
      {
        qid: 'comm_articulate',
        type: 'slider',
        label: 'How would you rate your ability to articulate complex ideas clearly and concisely?',
        leftLabel: 'Struggle to express ideas',
        rightLabel: 'Strong communicator',
      },
      {
        qid: 'comm_teams',
        type: 'radio',
        label: 'Describe your experience working in diverse teams (people with different backgrounds, skills, or perspectives).',
        options: [
          { value: 5, text: 'Extensive experience; I actively seek diverse collaboration and it improves my work' },
          { value: 4, text: 'Good experience; I have worked in diverse settings and value different perspectives' },
          { value: 3, text: 'Some experience; I have worked in teams but they were not very diverse' },
          { value: 2, text: 'Limited experience; most of my collaboration has been with similar peers' },
          { value: 1, text: 'Very little team experience; I mostly work independently' },
        ],
      },
    ],
  },
  {
    label: 'Step 5 of 5',
    title: 'Motivation & Fit',
    subtitle: 'Minerva is not the right fit for everyone, and that is okay. This section helps you reflect on why Minerva specifically, and whether it aligns with what you want.',
    questions: [
      {
        qid: 'motiv_why',
        type: 'checkbox',
        label: 'Why are you interested in Minerva specifically? (Select all that apply)',
        options: [
          { value: 'global', text: 'Living in multiple cities around the world' },
          { value: 'pedagogy', text: 'The active learning pedagogy (no lectures)' },
          { value: 'diversity', text: 'The highly international, diverse student body' },
          { value: 'rigor', text: 'The academic rigor and intellectual challenge' },
          { value: 'career', text: 'Career outcomes and practical skills focus' },
          { value: 'cost', text: 'The financial aid and relative affordability' },
          { value: 'small', text: 'Small class sizes and close-knit community' },
          { value: 'different', text: 'It is fundamentally different from traditional universities' },
        ],
      },
      {
        qid: 'motiv_cities',
        type: 'radio',
        label: 'What excites you most about the rotational city model?',
        options: [
          { value: 5, text: 'The chance to build genuine connections with each place and apply learning in different contexts' },
          { value: 4, text: 'Experiencing different cultures and expanding my worldview' },
          { value: 3, text: 'Traveling and seeing new places, though the constant moving seems challenging' },
          { value: 2, text: 'I am interested but somewhat anxious about the logistics and lack of stability' },
          { value: 1, text: 'I am not very excited about it; I would prefer a traditional campus experience' },
        ],
      },
      {
        qid: 'motiv_self',
        type: 'slider',
        label: 'How self-motivated would you say you are when there is no external pressure (deadlines, grades, expectations)?',
        leftLabel: 'Need external structure',
        rightLabel: 'Deeply self-driven',
      },
      {
        qid: 'motiv_goal',
        type: 'radio',
        label: 'What is your primary goal for your university education?',
        options: [
          { value: 5, text: 'Develop transferable thinking skills and the ability to learn anything independently' },
          { value: 4, text: 'Grow as a person, build a global network, and prepare for meaningful work' },
          { value: 3, text: 'Get a strong education that leads to good career opportunities' },
          { value: 2, text: 'Earn a degree in a specific field I am passionate about' },
          { value: 1, text: 'Get a credential that will help me get a well-paying job' },
        ],
      },
    ],
  },
];

function getScoreColor(pct) {
  if (pct >= 80) return 'var(--green)';
  if (pct >= 60) return 'var(--blue)';
  if (pct >= 40) return '#d97706';
  return 'var(--clay)';
}

function getScoreTierLabel(pct) {
  if (pct >= 85) return 'Strong';
  if (pct >= 70) return 'Good';
  if (pct >= 50) return 'Developing';
  return 'Needs Work';
}

function getFeedbackTier(avg) {
  if (avg >= 4) return 'high';
  if (avg >= 2.5) return 'mid';
  return 'low';
}

function getOverallTierCopy(pct) {
  if (pct >= 85) {
    return {
      tier: 'Strong Readiness',
      desc: 'Your self-assessment suggests you are well-prepared for the Minerva experience. You show strong alignment across academic habits, thinking skills, global readiness, and motivation. Focus on making your application as specific and personal as possible.',
    };
  }
  if (pct >= 70) {
    return {
      tier: 'Good Foundation',
      desc: 'You have a solid foundation with some areas that would benefit from focused development. Review the category breakdown below to identify where targeted effort will make the biggest difference before you apply.',
    };
  }
  if (pct >= 50) {
    return {
      tier: 'Developing Readiness',
      desc: 'You are building the skills and mindset Minerva looks for, but there are meaningful areas to develop. The good news: these are all learnable skills. Use the specific recommendations below to build a focused preparation plan.',
    };
  }
  return {
    tier: 'Early Preparation Stage',
    desc: 'Your self-assessment suggests you have significant room for growth in several areas Minerva values. This is not a disqualification. It means you should invest time in deliberate preparation before applying. Many strong Minerva students started exactly where you are.',
  };
}

function calculateCategoryScore(cat, answers) {
  let total = 0;
  let count = 0;
  cat.questions.forEach((qid) => {
    if (answers[qid] !== undefined) {
      total += answers[qid];
      count += 1;
    }
  });
  if (count === 0) return 3;
  return total / count;
}

export default function SimulatorPage() {
  const [view, setView] = useState('start');
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [checkboxState, setCheckboxState] = useState({});
  const [hasSaved, setHasSaved] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.answers && Object.keys(saved.answers).length > 0) {
          setHasSaved(true);
        }
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (Object.keys(answers).length === 0 && view === 'start') return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ currentStep, answers, timestamp: Date.now() })
      );
    } catch {
      /* ignore */
    }
  }, [currentStep, answers, view, hydrated]);

  const startAssessment = (resume) => {
    if (resume) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          setAnswers(saved.answers || {});
          setCurrentStep(saved.currentStep || 0);
        }
      } catch {
        /* ignore */
      }
    } else {
      setAnswers({});
      setCheckboxState({});
      setCurrentStep(0);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
    setView('wizard');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToStart = () => {
    setView('start');
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        setHasSaved(saved && saved.answers && Object.keys(saved.answers).length > 0);
      } else {
        setHasSaved(false);
      }
    } catch {
      setHasSaved(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep((s) => s + 1);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const resetAll = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setAnswers({});
    setCheckboxState({});
    setCurrentStep(0);
    setHasSaved(false);
    setView('start');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSlider = (qid, val) => {
    setAnswers((prev) => ({ ...prev, [qid]: parseInt(val, 10) }));
  };

  const handleRadio = (qid, value) => {
    setAnswers((prev) => ({ ...prev, [qid]: parseInt(value, 10) }));
  };

  const handleCheckbox = (qid, value) => {
    setCheckboxState((prev) => {
      const current = prev[qid] || {};
      const next = { ...current, [value]: !current[value] };
      const count = Object.values(next).filter(Boolean).length;
      let score;
      if (count >= 4) score = 5;
      else if (count === 3) score = 4;
      else if (count === 2) score = 3;
      else if (count === 1) score = 2;
      else score = 1;
      setAnswers((a) => ({ ...a, [qid]: score }));
      return { ...prev, [qid]: next };
    });
  };

  const showResults = () => {
    setView('results');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      <section className="hero">
        <h1>
          Application <span>Readiness Simulator</span>
        </h1>
        <p>A reflective self-assessment to help you understand where you stand and what to work on before applying to Minerva.</p>
      </section>

      <div className="container">
        {view === 'start' && (
          <StartScreen hasSaved={hasSaved} onBegin={() => startAssessment(false)} onResume={() => startAssessment(true)} onReset={resetAll} />
        )}

        {view === 'wizard' && (
          <>
            <ProgressArea currentStep={currentStep} />
            <div className="wizard-section">
              <StepPanel
                step={STEPS[currentStep]}
                answers={answers}
                checkboxState={checkboxState[STEPS[currentStep].questions[0]?.qid] || {}}
                onSlider={handleSlider}
                onRadio={handleRadio}
                onCheckbox={handleCheckbox}
                onBack={currentStep === 0 ? goToStart : prevStep}
                onNext={currentStep === 4 ? showResults : nextStep}
                isLast={currentStep === 4}
              />
            </div>
          </>
        )}

        {view === 'results' && (
          <div className="wizard-section">
            <ResultsPanel answers={answers} onRetake={resetAll} />
          </div>
        )}
      </div>
    </>
  );
}

function StartScreen({ hasSaved, onBegin, onResume, onReset }) {
  return (
    <div id="start-screen" className="start-screen">
      <h2>How ready are you for Minerva?</h2>
      <p>This is not a quiz with right or wrong answers. It is a reflective tool that helps you honestly assess your strengths and identify areas to develop before you apply.</p>
      <div className="start-features">
        <div className="start-feature">
          <div className="icon">&#128203;</div>
          <h4>5 Categories</h4>
          <p>Academic, creative thinking, global readiness, communication, and motivation.</p>
        </div>
        <div className="start-feature">
          <div className="icon">&#9201;</div>
          <h4>10-15 Minutes</h4>
          <p>Answer honestly. There are no wrong answers, only reflection.</p>
        </div>
        <div className="start-feature">
          <div className="icon">&#128202;</div>
          <h4>Detailed Results</h4>
          <p>Personalized feedback with specific action items for each category.</p>
        </div>
      </div>
      {hasSaved && (
        <div className="resume-notice" style={{ display: 'block' }}>
          You have saved progress. Pick up where you left off or start fresh.
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1rem' }}>
        <button className="btn btn-next" onClick={onBegin}>Begin Assessment</button>
        {hasSaved && (
          <>
            <button className="btn btn-back" onClick={onResume}>Resume Progress</button>
            <button className="btn btn-reset" onClick={onReset}>Start Fresh</button>
          </>
        )}
      </div>
    </div>
  );
}

function ProgressArea({ currentStep }) {
  const labels = ['Academic', 'Thinking', 'Global', 'Communication', 'Motivation'];
  const pct = (currentStep / 5) * 100;
  return (
    <div className="progress-container">
      <div className="progress-steps">
        {labels.map((label, i) => (
          <span key={label} style={{ display: 'contents' }}>
            <div className={`progress-step${i === currentStep ? ' is-active' : ''}${i < currentStep ? ' is-completed' : ''}`} data-step={i}>
              <div className={`progress-dot${i === currentStep ? ' active' : ''}${i < currentStep ? ' completed' : ''}`}>
                {i < currentStep ? '✓' : i + 1}
              </div>
              <div className="progress-label">{label}</div>
            </div>
            {i < labels.length - 1 && (
              <div className={`progress-connector${i < currentStep ? ' filled' : ''}`} />
            )}
          </span>
        ))}
      </div>
      <div className="progress-bar-simple">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="progress-text">Step {currentStep + 1} of 5</div>
    </div>
  );
}

function StepPanel({ step, answers, checkboxState, onSlider, onRadio, onCheckbox, onBack, onNext, isLast }) {
  return (
    <div className="step-panel active">
      <div className="step-header">
        <div className="step-label">{step.label}</div>
        <div className="step-title">{step.title}</div>
        <div className="step-subtitle">{step.subtitle}</div>
      </div>

      {step.questions.map((q) => (
        <Question key={q.qid} q={q} answers={answers} checkboxState={checkboxState} onSlider={onSlider} onRadio={onRadio} onCheckbox={onCheckbox} />
      ))}

      <div className="wizard-nav">
        <button className="btn btn-back" onClick={onBack}>Back</button>
        {isLast ? (
          <button className="btn btn-results" onClick={onNext}>See My Results</button>
        ) : (
          <button className="btn btn-next" onClick={onNext}>Continue</button>
        )}
      </div>
    </div>
  );
}

function Question({ q, answers, checkboxState, onSlider, onRadio, onCheckbox }) {
  const isAnswered = answers[q.qid] !== undefined;

  if (q.type === 'slider') {
    const val = answers[q.qid] !== undefined ? answers[q.qid] : 3;
    return (
      <div className={`question${isAnswered ? ' answered' : ''}`} data-qid={q.qid}>
        <div className="question-label">{q.label}</div>
        <div className="slider-container">
          <div className="slider-labels"><span>{q.leftLabel}</span><span>{q.rightLabel}</span></div>
          <input
            type="range"
            min="1"
            max="5"
            value={val}
            onChange={(e) => onSlider(q.qid, e.target.value)}
          />
          <div className="slider-value">{SLIDER_LABELS[val]}</div>
        </div>
      </div>
    );
  }

  if (q.type === 'radio') {
    return (
      <div className={`question${isAnswered ? ' answered' : ''}`} data-qid={q.qid}>
        <div className="question-label">{q.label}</div>
        <div className="option-group">
          {q.options.map((opt) => (
            <div
              key={opt.value}
              className={`option-item${answers[q.qid] === opt.value ? ' selected' : ''}`}
              onClick={() => onRadio(q.qid, opt.value)}
            >
              <div className="option-radio" />
              {opt.text}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (q.type === 'checkbox') {
    const selected = checkboxState || {};
    return (
      <div className={`question${isAnswered ? ' answered' : ''}`} data-qid={q.qid}>
        <div className="question-label">{q.label}</div>
        <div className="checkbox-group">
          {q.options.map((opt) => {
            const isSel = !!selected[opt.value];
            return (
              <div
                key={opt.value}
                className={`checkbox-item${isSel ? ' selected' : ''}`}
                onClick={() => onCheckbox(q.qid, opt.value)}
              >
                <div className="checkbox-box">{isSel ? '✓' : ''}</div>
                {opt.text}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}

function ResultsPanel({ answers, onRetake }) {
  const categoryScores = CATEGORIES.map((cat) => {
    const avg = calculateCategoryScore(cat, answers);
    const pct = Math.round((avg / 5) * 100);
    return { ...cat, avg, pct };
  });

  const overallAvg = categoryScores.reduce((sum, c) => sum + c.avg, 0) / categoryScores.length;
  const overallPct = Math.round((overallAvg / 5) * 100);
  const tierCopy = getOverallTierCopy(overallPct);
  const overallColor = getScoreColor(overallPct);

  const sortedForActions = [...categoryScores].sort((a, b) => a.avg - b.avg);

  return (
    <div className="results-panel active">
      <div className="score-hero">
        <CircularScore pct={overallPct} color={overallColor} />
        <div className="score-label">{tierCopy.tier}</div>
        <div className="score-description">{tierCopy.desc}</div>
      </div>

      <div className="category-breakdown">
        <h3>Breakdown by Category</h3>
        <div id="category-bars">
          {categoryScores.map((cat) => (
            <CategoryBar key={cat.key} cat={cat} />
          ))}
        </div>
      </div>

      <div className="detail-cards">
        {categoryScores.map((cat) => (
          <DetailCard key={cat.key} cat={cat} />
        ))}
      </div>

      <div className="action-plan">
        <h3>What to Focus on Before Applying</h3>
        <ol id="action-items">
          {sortedForActions.map((cat) => {
            const tier = getFeedbackTier(cat.avg);
            return (
              <li key={cat.key} dangerouslySetInnerHTML={{ __html: ACTION_MAP[cat.key][tier] }} />
            );
          })}
        </ol>
      </div>

      <div className="results-footer">
        <p>This assessment reflects your self-perception today. Your readiness can change significantly with deliberate effort. Minerva values growth and potential as much as where you stand right now.</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-next" onClick={onRetake}>Retake Assessment</button>
          <Link href="/" className="btn btn-back" style={{ textDecoration: 'none' }}>Back to Guide</Link>
        </div>
      </div>
    </div>
  );
}

function CircularScore({ pct, color }) {
  const circumference = 2 * Math.PI * 85;
  const targetOffset = circumference - (pct / 100) * circumference;
  const [offset, setOffset] = useState(circumference);
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setOffset(targetOffset));
    return () => cancelAnimationFrame(raf);
  }, [targetOffset]);

  useEffect(() => {
    let current = 0;
    const increment = Math.max(1, Math.floor(pct / 40));
    const id = setInterval(() => {
      current += increment;
      if (current >= pct) {
        current = pct;
        clearInterval(id);
      }
      setDisplayed(current);
    }, 25);
    return () => clearInterval(id);
  }, [pct]);

  return (
    <div className="circular-score">
      <svg width="100%" height="100%" viewBox="0 0 200 200">
        <circle className="bg" cx="100" cy="100" r="85" />
        <circle
          className="fill"
          cx="100"
          cy="100"
          r="85"
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="score-number">{displayed}<small>%</small></div>
    </div>
  );
}

function CategoryBar({ cat }) {
  const [width, setWidth] = useState(0);
  const color = getScoreColor(cat.pct);

  useEffect(() => {
    const id = setTimeout(() => setWidth(cat.pct), 100);
    return () => clearTimeout(id);
  }, [cat.pct]);

  return (
    <div className="category-bar-item">
      <div className="category-bar-header">
        <span className="category-bar-name">{cat.icon} {cat.name}</span>
        <span className="category-bar-score" style={{ color }}>{cat.pct}%</span>
      </div>
      <div className="category-bar-track">
        <div className="category-bar-fill" style={{ width: `${width}%`, background: color }} />
      </div>
    </div>
  );
}

function DetailCard({ cat }) {
  const tier = getFeedbackTier(cat.avg);
  const fb = cat.feedback[tier];
  const tierLabel = getScoreTierLabel(cat.pct);

  return (
    <div className="detail-card">
      <div className="detail-card-header">
        <div className="detail-card-icon" style={{ background: cat.bgColor }}>{cat.icon}</div>
        <div className="detail-card-title">{cat.name}</div>
        <div className="detail-card-score" style={{ background: cat.bgColor, color: cat.color }}>{tierLabel}</div>
      </div>

      <div className="detail-section strengths">
        <div className="detail-section-title strengths">Strengths Identified</div>
        <ul>
          {fb.strengths.map((s, i) => (<li key={i}>{s}</li>))}
        </ul>
      </div>

      <div className="detail-section develop">
        <div className="detail-section-title develop">Areas to Develop</div>
        <ul>
          {fb.develop.map((d, i) => (<li key={i}>{d}</li>))}
        </ul>
      </div>

      <div className="detail-section tips">
        <div className="detail-section-title tips">Application Tips</div>
        <ul>
          {fb.tips.map((t, i) => (<li key={i}>{t}</li>))}
        </ul>
      </div>
    </div>
  );
}
