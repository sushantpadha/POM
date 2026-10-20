import type { AnswerValue, GoalAnswer, Option, Question } from '../types';

export const LIKERT_LABELS = [
  'Strongly disagree',
  'Disagree',
  'Neither',
  'Agree',
  'Strongly agree',
];

/** Pick one of three phrasings depending on a 1–5 agreement value. */
function agree(v: AnswerValue, high: string, mid: string, low: string): string {
  const n = Number(v);
  if (n >= 4) return high;
  if (n === 3) return mid;
  return low;
}

function optionLabel(options: Option[], v: AnswerValue): string {
  return options.find((o) => o.value === v)?.label ?? String(v);
}

function ranked(options: Option[], v: AnswerValue, take = 2): string {
  const order = Array.isArray(v) ? v : [];
  return order
    .slice(0, take)
    .map((x) => optionLabel(options, x).toLowerCase())
    .join(', then ');
}

function quoted(v: AnswerValue): string {
  return `In my words: “${String(v).trim()}”`;
}

const HRM_01_OPTS: Option[] = [
  { value: 'consequences', label: 'Its consequences for the people affected' },
  { value: 'rules', label: 'Whether it follows a principle or rule' },
  { value: 'intentions', label: 'The intentions behind it' },
  { value: 'fairness', label: 'Whether it is fair to everyone involved' },
];

const WV_02_OPTS: Option[] = [
  { value: 'experience', label: 'Personal experience' },
  { value: 'science', label: 'Scientific evidence' },
  { value: 'people', label: 'Trusted people (family, mentors)' },
  { value: 'tradition', label: 'Tradition or faith' },
  { value: 'intuition', label: 'Intuition' },
];

const OTH_02_OPTS: Option[] = [
  { value: 'family', label: 'Family' },
  { value: 'close', label: 'Close friends & partner' },
  { value: 'community', label: 'Your community' },
  { value: 'strangers', label: 'Strangers in need' },
  { value: 'self', label: 'Myself' },
];

const GOL_04_OPTS: Option[] = [
  { value: 'career', label: 'Career & work' },
  { value: 'family', label: 'Family & relationships' },
  { value: 'health', label: 'Health' },
  { value: 'learning', label: 'Learning & creativity' },
  { value: 'community', label: 'Community & contribution' },
];

const GVL_01_OPTS: Option[] = [
  { value: 'curiosity', label: 'Curiosity' },
  { value: 'helping', label: 'Helping others' },
  { value: 'independence', label: 'Independence' },
  { value: 'family', label: 'Family' },
  { value: 'security', label: 'Security' },
  { value: 'achievement', label: 'Achievement' },
];

const EPQ_NOTE =
  'Construct: ethical idealism / relativism (Forsyth, 1980, Ethics Position Questionnaire). Paraphrased for this prototype — not the original item wording.';

export const QUESTIONS: Question[] = [
  // ── Ethics ─────────────────────────────────────────────────
  {
    id: 'ETH-01',
    nodeId: 'ethics',
    text: 'People should take care that their actions never intentionally harm another person, even in small ways.',
    type: 'likert',
    selfTags: ['idealism'],
    stability: 'stable',
    source: 'adapted',
    sourceNote: EPQ_NOTE + ' Idealism subscale.',
    askConfidence: true,
    note: (v) =>
      agree(
        v,
        'Avoiding harm to others is close to an absolute principle for me.',
        'I care about avoiding harm, but do not treat it as absolute.',
        'Some harm is an acceptable part of acting in the world.',
      ),
  },
  {
    id: 'ETH-02',
    nodeId: 'ethics',
    text: 'If an action could harm an innocent person, it should not be done — even if it would benefit many others.',
    type: 'likert',
    selfTags: ['idealism', 'harm-concern'],
    stability: 'stable',
    source: 'adapted',
    sourceNote: EPQ_NOTE + ' Idealism subscale.',
    note: (v) =>
      agree(
        v,
        'I would rather forgo a benefit to many than risk harming one innocent person.',
        'Whether a benefit to many justifies risk to one depends on the case.',
        'Benefits to many can justify a risk of harm to an innocent person.',
      ),
  },
  {
    id: 'ETH-03',
    nodeId: 'ethics',
    text: 'What counts as ethical varies from one situation and culture to another.',
    type: 'likert',
    selfTags: ['relativism'],
    stability: 'stable',
    source: 'adapted',
    sourceNote: EPQ_NOTE + ' Relativism subscale.',
    askConfidence: true,
    note: (v) =>
      agree(
        v,
        'I think what is ethical genuinely varies across situations and cultures.',
        'I am undecided on how much ethics varies across situations and cultures.',
        'I think core ethical standards hold across situations and cultures.',
      ),
  },
  {
    id: 'ETH-04',
    nodeId: 'ethics',
    text: 'Moral rules are best treated as guidelines; strict, universal codes rarely fit real situations.',
    type: 'likert',
    selfTags: ['relativism'],
    stability: 'stable',
    source: 'adapted',
    sourceNote: EPQ_NOTE + ' Relativism subscale.',
    note: (v) =>
      agree(
        v,
        'I treat moral rules as guidelines rather than strict codes.',
        'I see moral rules as somewhere between firm codes and guidelines.',
        'I prefer firm moral rules over case-by-case guidelines.',
      ),
  },
  {
    id: 'ETH-05',
    nodeId: 'ethics',
    text: 'When a family obligation and a personal goal conflict, which usually guides you?',
    type: 'choice',
    options: [
      { value: 'family', label: 'The family obligation' },
      { value: 'depends', label: 'It depends on the situation' },
      { value: 'goal', label: 'The personal goal' },
      { value: 'unsure', label: 'I am not sure' },
    ],
    selfTags: ['family-duty'],
    stability: 'flexible',
    source: 'exploratory',
    sourceNote: 'Newly designed exploratory item for this project.',
    askConfidence: true,
    note: (v) =>
      ({
        family: 'When family obligations and personal goals conflict, family usually guides me.',
        depends: 'When family obligations and personal goals conflict, it depends on the situation.',
        goal: 'When family obligations and personal goals conflict, my own goal usually guides me.',
        unsure: 'I am unsure what guides me when family obligations and personal goals conflict.',
      })[String(v)] ?? '',
  },
  {
    id: 'ETH-06',
    nodeId: 'ethics',
    text: 'Describe a recent situation where you were not sure what the right thing to do was.',
    type: 'text',
    selfTags: ['moral-reflection'],
    stability: 'flexible',
    source: 'exploratory',
    sourceNote: 'Open reflection prompt, newly designed.',
    note: quoted,
  },
  // ── Harm & Consequences ────────────────────────────────────
  {
    id: 'HRM-01',
    nodeId: 'eth-harm',
    text: 'Rank what matters most when you judge whether an action was right.',
    type: 'rank',
    options: HRM_01_OPTS,
    selfTags: ['outcomes'],
    stability: 'stable',
    source: 'research-informed',
    sourceNote:
      'Informed by the consequentialist / deontological distinction in moral psychology; item newly worded.',
    note: (v) => `When judging actions I weigh ${ranked(HRM_01_OPTS, v)} most.`,
  },
  {
    id: 'HRM-02',
    nodeId: 'eth-harm',
    text: 'I feel responsible for harms that result from things I failed to do, not only from things I did.',
    type: 'likert',
    selfTags: ['harm-sensitivity'],
    stability: 'flexible',
    source: 'exploratory',
    sourceNote: 'Exploratory item on omission vs. commission; newly designed.',
    askConfidence: true,
    note: (v) =>
      agree(
        v,
        'I hold myself responsible for harms I fail to prevent, not only harms I cause.',
        'I am unsure how responsible I am for harms I fail to prevent.',
        'I mainly feel responsible for harms I directly cause.',
      ),
  },
  {
    id: 'HRM-03',
    nodeId: 'eth-harm',
    text: 'Small harms can be acceptable when they prevent a larger harm.',
    type: 'likert',
    selfTags: ['outcomes'],
    stability: 'stable',
    source: 'research-informed',
    sourceNote: 'Informed by outcome-based moral reasoning research; item newly worded.',
    note: (v) =>
      agree(
        v,
        'I accept small harms when they prevent a larger one.',
        'Whether a small harm is worth preventing a larger one depends on the case.',
        'I am reluctant to accept even small harms to prevent larger ones.',
      ),
  },
  // ── Universal vs Contextual ────────────────────────────────
  {
    id: 'UNI-01',
    nodeId: 'eth-universal',
    text: 'The same moral principles should apply to everyone, regardless of culture or circumstance.',
    type: 'likert',
    selfTags: ['universalism'],
    stability: 'stable',
    source: 'research-informed',
    sourceNote: 'Informed by the relativism construct (Forsyth, 1980); item newly worded.',
    askConfidence: true,
    note: (v) =>
      agree(
        v,
        'I think the same moral principles should apply to everyone.',
        'I am torn on whether moral principles should be universal.',
        'I think moral principles should adapt to culture and circumstance.',
      ),
  },
  {
    id: 'UNI-02',
    nodeId: 'eth-universal',
    text: 'A friend lies to protect someone from serious harm. The lie is…',
    type: 'choice',
    options: [
      { value: 'wrong', label: 'Always wrong' },
      { value: 'understandable', label: 'Wrong, but understandable' },
      { value: 'justified', label: 'Justified in that context' },
      { value: 'right', label: 'The right thing to do' },
    ],
    selfTags: ['contextualism'],
    stability: 'flexible',
    source: 'exploratory',
    sourceNote: 'Short vignette, newly designed.',
    note: (v) =>
      `A protective lie seems ${({ wrong: 'always wrong', understandable: 'wrong but understandable', justified: 'justified in context', right: 'like the right thing to do' } as Record<string, string>)[String(v)] ?? String(v)} to me.`,
  },
  // ── Obligations to Elders & Family ─────────────────────────
  {
    id: 'FAM-01',
    nodeId: 'eth-family',
    text: 'Adult children have a moral obligation to personally care for their parents as they age.',
    type: 'likert',
    selfTags: ['eldercare', 'family-duty'],
    stability: 'stable',
    source: 'research-informed',
    sourceNote: 'Informed by research on filial obligation / filial responsibility; item newly worded.',
    askConfidence: true,
    note: (v) =>
      agree(
        v,
        'I believe adult children owe their parents personal care as they age.',
        'I am unsure whether adult children owe their parents personal care.',
        'I do not think adult children are obliged to provide personal care.',
      ),
  },
  {
    id: 'FAM-02',
    nodeId: 'eth-family',
    text: 'Which best describes what you owe your elders?',
    type: 'choice',
    options: [
      { value: 'daily', label: 'Hands-on, daily care' },
      { value: 'nearby', label: 'Being nearby and available' },
      { value: 'support', label: 'Financial and practical support' },
      { value: 'contact', label: 'Regular contact and emotional support' },
      { value: 'relationship', label: 'It depends on the relationship' },
    ],
    selfTags: ['eldercare'],
    stability: 'flexible',
    source: 'exploratory',
    sourceNote: 'Newly designed exploratory item.',
    note: (v) =>
      `What I owe my elders, at minimum: ${({ daily: 'hands-on, daily care', nearby: 'being nearby and available', support: 'financial and practical support', contact: 'regular contact and emotional support', relationship: 'it depends on the relationship' } as Record<string, string>)[String(v)] ?? String(v)}.`,
  },
  {
    id: 'FAM-03',
    nodeId: 'eth-family',
    text: 'Is there a limit to what this obligation can ask of you? Where would you draw it?',
    type: 'text',
    selfTags: ['eldercare-limits'],
    stability: 'flexible',
    source: 'exploratory',
    sourceNote: 'Deeper open question, newly designed.',
    askConfidence: true,
    note: (v) => `Limit of the obligation — “${String(v).trim()}”`,
  },
  {
    id: 'FAM-04',
    nodeId: 'eth-family',
    text: 'Meeting family obligations is part of what makes a life good, not just a constraint on it.',
    type: 'likert',
    selfTags: ['care'],
    stability: 'stable',
    source: 'exploratory',
    sourceNote: 'Newly designed exploratory item.',
    note: (v) =>
      agree(
        v,
        'Meeting family obligations is part of a good life for me, not only a constraint.',
        'Family obligations feel partly meaningful, partly constraining.',
        'Family obligations feel mostly like constraints.',
      ),
  },
  // ── Care vs Ambition ───────────────────────────────────────
  {
    id: 'TRD-01',
    nodeId: 'eth-tradeoffs',
    text: 'If a 3-year opportunity abroad meant seeing your family twice a year, you would most likely…',
    type: 'choice',
    options: [
      { value: 'take-plan', label: 'Take it, with a concrete care plan' },
      { value: 'negotiate', label: 'Negotiate a shorter or partly remote version' },
      { value: 'decline', label: 'Decline it' },
      { value: 'unsure', label: 'I genuinely do not know' },
    ],
    selfTags: ['tradeoff'],
    stability: 'flexible',
    source: 'exploratory',
    sourceNote: 'Hypothetical trade-off vignette, newly designed.',
    askConfidence: true,
    note: (v) =>
      `Facing a 3-year opportunity abroad, I would most likely: ${({ 'take-plan': 'take it, with a concrete care plan', negotiate: 'negotiate a shorter or partly remote version', decline: 'decline it', unsure: 'I genuinely do not know' } as Record<string, string>)[String(v)] ?? String(v)}.`,
  },
  {
    id: 'TRD-02',
    nodeId: 'eth-tradeoffs',
    text: 'What would need to be true for you to feel at peace with that choice?',
    type: 'text',
    selfTags: ['tradeoff'],
    stability: 'flexible',
    source: 'exploratory',
    sourceNote: 'Open reflection prompt, newly designed.',
    note: (v) => `To be at peace with it: “${String(v).trim()}”`,
  },
  // ── Worldview ──────────────────────────────────────────────
  {
    id: 'WV-01',
    nodeId: 'worldview',
    text: 'What happens in my life is mostly determined by my own choices and effort.',
    type: 'likert',
    selfTags: ['agency'],
    stability: 'flexible',
    source: 'research-informed',
    sourceNote:
      'Informed by the locus-of-control construct (Rotter, 1966). Single exploratory item — not the original scale.',
    askConfidence: true,
    note: (v) =>
      agree(
        v,
        'I see my life as mostly shaped by my own choices and effort.',
        'I see my life as shaped about equally by my choices and by circumstance.',
        'I see my life as largely shaped by circumstance and other people.',
      ),
  },
  {
    id: 'WV-02',
    nodeId: 'worldview',
    text: 'Which sources do you trust most when forming beliefs about important questions?',
    type: 'rank',
    options: WV_02_OPTS,
    selfTags: ['epistemic'],
    stability: 'flexible',
    source: 'exploratory',
    sourceNote: 'Newly designed exploratory ranking.',
    note: (v) => `For important beliefs I trust ${ranked(WV_02_OPTS, v)} most.`,
  },
  {
    id: 'WV-03',
    nodeId: 'worldview',
    text: 'People have obligations to strangers, not only to those close to them.',
    type: 'likert',
    selfTags: ['others-obligation'],
    stability: 'stable',
    source: 'exploratory',
    sourceNote: 'Newly designed exploratory item.',
    askConfidence: true,
    note: (v) =>
      agree(
        v,
        'I believe we have real obligations to strangers, not only to people close to us.',
        'I am unsure how much we owe strangers compared with people close to us.',
        'I think our obligations are mainly to people close to us.',
      ),
  },
  {
    id: 'WV-04',
    nodeId: 'worldview',
    text: 'What is one belief you have changed your mind about in the past few years?',
    type: 'text',
    selfTags: ['belief-change'],
    stability: 'flexible',
    source: 'exploratory',
    sourceNote: 'Open reflection prompt, newly designed.',
    note: (v) => `A belief I changed: “${String(v).trim()}”`,
  },
  // ── Personal Agency ────────────────────────────────────────
  {
    id: 'AGY-01',
    nodeId: 'wv-agency',
    text: 'When plans fail, I usually look first at what I could have done differently.',
    type: 'likert',
    selfTags: ['agency'],
    stability: 'flexible',
    source: 'research-informed',
    sourceNote: 'Informed by attribution-style research; item newly worded.',
    note: (v) =>
      agree(
        v,
        'When plans fail, I look first at my own part in it.',
        'When plans fail, I look at both my part and the circumstances.',
        'When plans fail, I look first at circumstances outside my control.',
      ),
  },
  {
    id: 'AGY-02',
    nodeId: 'wv-agency',
    text: 'Luck, circumstance and support from others have shaped where I am…',
    type: 'choice',
    options: [
      { value: 'little', label: 'Very little' },
      { value: 'somewhat', label: 'Somewhat' },
      { value: 'alot', label: 'A lot' },
      { value: 'most', label: 'More than my own effort' },
    ],
    selfTags: ['meaning'],
    stability: 'flexible',
    source: 'exploratory',
    sourceNote: 'Newly designed exploratory item.',
    note: (v) =>
      `Luck, circumstance and support have shaped where I am: ${({ little: 'very little', somewhat: 'somewhat', alot: 'a lot', most: 'more than my own effort' } as Record<string, string>)[String(v)] ?? String(v)}.`,
  },
  {
    id: 'AGY-03',
    nodeId: 'wv-agency',
    text: 'What would you like to have more control over in the next five years?',
    type: 'text',
    selfTags: ['meaning'],
    stability: 'flexible',
    source: 'exploratory',
    sourceNote: 'Open reflection prompt, newly designed.',
    note: (v) => `I want more control over: “${String(v).trim()}”`,
  },
  // ── Sources of Knowledge ───────────────────────────────────
  {
    id: 'KNW-01',
    nodeId: 'wv-knowledge',
    text: 'I am comfortable acting on a decision while still feeling uncertain about it.',
    type: 'likert',
    selfTags: ['uncertainty'],
    stability: 'flexible',
    source: 'exploratory',
    sourceNote: 'Newly designed exploratory item.',
    askConfidence: true,
    note: (v) =>
      agree(
        v,
        'I am comfortable acting while still uncertain.',
        'Acting under uncertainty is sometimes fine for me, sometimes not.',
        'I prefer to resolve uncertainty before acting.',
      ),
  },
  {
    id: 'KNW-02',
    nodeId: 'wv-knowledge',
    text: 'When evidence contradicts something you believe strongly, you most often…',
    type: 'choice',
    options: [
      { value: 'flaws', label: 'Look for flaws in the evidence' },
      { value: 'update', label: 'Update gradually' },
      { value: 'ask', label: 'Ask someone you trust' },
      { value: 'hold', label: 'Hold both views for a while' },
    ],
    selfTags: ['belief-updating'],
    stability: 'flexible',
    source: 'exploratory',
    sourceNote: 'Newly designed exploratory item.',
    note: (v) =>
      `When evidence contradicts a strong belief, I usually ${({ flaws: 'look for flaws in the evidence', update: 'update gradually', ask: 'ask someone I trust', hold: 'hold both views for a while' } as Record<string, string>)[String(v)] ?? String(v)}.`,
  },
  // ── Obligations to Others ──────────────────────────────────
  {
    id: 'OTH-01',
    nodeId: 'wv-others',
    text: 'If I can prevent serious harm to a stranger at modest cost to myself, I am obliged to.',
    type: 'likert',
    selfTags: ['others-obligation'],
    stability: 'stable',
    source: 'research-informed',
    sourceNote: 'Informed by the "duty of easy rescue" argument (Singer, 1972); item newly worded.',
    askConfidence: true,
    note: (v) =>
      agree(
        v,
        'If I can prevent serious harm to a stranger at modest cost, I am obliged to.',
        'I am unsure whether preventing harm to strangers is an obligation or a kindness.',
        'Helping strangers is good but not an obligation for me.',
      ),
  },
  {
    id: 'OTH-02',
    nodeId: 'wv-others',
    text: 'Rank whose wellbeing should weigh most in your major decisions.',
    type: 'rank',
    options: OTH_02_OPTS,
    selfTags: ['circle-of-concern'],
    stability: 'flexible',
    source: 'exploratory',
    sourceNote: 'Newly designed exploratory ranking.',
    note: (v) => {
      const order = Array.isArray(v) ? v : [];
      const last = order[order.length - 1];
      return `In major decisions I weigh ${ranked(OTH_02_OPTS, v)} most${last ? `, and ${optionLabel(OTH_02_OPTS, last).toLowerCase()} least` : ''}.`;
    },
  },
  // ── Meaning & Purpose ──────────────────────────────────────
  {
    id: 'MNG-01',
    nodeId: 'wv-meaning',
    text: 'In a sentence: what would make your life feel well-used?',
    type: 'text',
    selfTags: ['purpose'],
    stability: 'flexible',
    source: 'exploratory',
    sourceNote: 'Open reflection prompt, newly designed.',
    note: (v) => `A well-used life: “${String(v).trim()}”`,
  },
  {
    id: 'MNG-02',
    nodeId: 'wv-meaning',
    text: 'My day-to-day work connects to something I find meaningful.',
    type: 'likert',
    selfTags: ['purpose'],
    stability: 'flexible',
    source: 'exploratory',
    sourceNote: 'Newly designed exploratory item.',
    askConfidence: true,
    note: (v) =>
      agree(
        v,
        'My day-to-day work feels connected to what I find meaningful.',
        'My day-to-day work is only partly connected to what I find meaningful.',
        'My day-to-day work feels disconnected from what I find meaningful.',
      ),
  },
  // ── Long-term Goals ────────────────────────────────────────
  {
    id: 'GOL-01',
    nodeId: 'goals',
    text: 'In your own words, describe one long-term goal (5+ years) and rate how important it is to you.',
    type: 'goal',
    selfTags: ['goal-stated'],
    stability: 'flexible',
    source: 'exploratory',
    sourceNote: 'Free-text goal elicitation with an importance rating; newly designed.',
    note: (v) => {
      const g = v as GoalAnswer;
      return `Goal: ${g.text.trim()} (importance ${g.importance}/10)`;
    },
  },
  {
    id: 'GOL-02',
    nodeId: 'goals',
    text: 'Why does this goal matter to you?',
    type: 'text',
    selfTags: ['goal-why'],
    stability: 'flexible',
    source: 'exploratory',
    sourceNote: 'Open prompt, newly designed.',
    askConfidence: true,
    note: (v) => `Why it matters: “${String(v).trim()}”`,
  },
  {
    id: 'GOL-03',
    nodeId: 'goals',
    text: 'Pursuing this goal will likely require relocating or long periods away from home.',
    type: 'likert',
    scale: ['Very unlikely', 'Very likely'],
    selfTags: ['relocation-consideration'],
    stability: 'flexible',
    source: 'exploratory',
    sourceNote: 'Newly designed exploratory item.',
    note: (v) =>
      agree(
        v,
        'Pursuing this goal will likely mean relocating or long periods away from home.',
        'Pursuing this goal may or may not mean time away from home.',
        'Pursuing this goal probably will not require leaving home.',
      ),
  },
  {
    id: 'GOL-04',
    nodeId: 'goals',
    text: 'Rank these areas by how much attention you want to give them over the next ten years.',
    type: 'rank',
    options: GOL_04_OPTS,
    selfTags: ['career-goal', 'relational-goal'],
    stability: 'flexible',
    source: 'exploratory',
    sourceNote: 'Newly designed exploratory ranking.',
    note: (v) => `Priorities for the next ten years: ${ranked(GOL_04_OPTS, v, 3)}.`,
  },
  // ── Career Direction ───────────────────────────────────────
  {
    id: 'CAR-01',
    nodeId: 'goal-career',
    text: 'Describe the work you would like to be doing in ten years.',
    type: 'text',
    selfTags: ['career-vision'],
    stability: 'flexible',
    source: 'exploratory',
    sourceNote: 'Open prompt, newly designed.',
    note: (v) => `Work in ten years: “${String(v).trim()}”`,
  },
  {
    id: 'CAR-02',
    nodeId: 'goal-career',
    text: 'I would accept a significant move to pursue the right opportunity.',
    type: 'likert',
    selfTags: ['relocation'],
    stability: 'flexible',
    source: 'exploratory',
    sourceNote: 'Newly designed exploratory item.',
    askConfidence: true,
    note: (v) =>
      agree(
        v,
        'I would accept a significant move for the right opportunity.',
        'I might accept a significant move, depending on the opportunity.',
        'I would not want to make a significant move for work.',
      ),
  },
  {
    id: 'CAR-03',
    nodeId: 'goal-career',
    text: 'What matters most in your next role?',
    type: 'choice',
    options: [
      { value: 'mastery', label: 'Mastery — getting very good at something' },
      { value: 'impact', label: 'Impact — the work clearly helps people' },
      { value: 'security', label: 'Security — stability and income' },
      { value: 'recognition', label: 'Recognition' },
      { value: 'flexibility', label: 'Flexibility — time and location' },
    ],
    selfTags: ['work-values'],
    stability: 'flexible',
    source: 'exploratory',
    sourceNote: 'Newly designed exploratory item.',
    note: (v) =>
      `What matters most in my next role: ${({ mastery: 'mastery', impact: 'impact', security: 'security', recognition: 'recognition', flexibility: 'flexibility' } as Record<string, string>)[String(v)] ?? String(v)}.`,
  },
  // ── Relationships & Home ───────────────────────────────────
  {
    id: 'REL-01',
    nodeId: 'goal-rel',
    text: 'Describe what you would want your relationships with family to look like in ten years.',
    type: 'text',
    selfTags: ['relational-vision'],
    stability: 'flexible',
    source: 'exploratory',
    sourceNote: 'Open prompt, newly designed.',
    note: (v) => `Family relationships in ten years: “${String(v).trim()}”`,
  },
  {
    id: 'REL-02',
    nodeId: 'goal-rel',
    text: 'Living near my parents as they age is important to me.',
    type: 'likert',
    selfTags: ['proximity'],
    stability: 'flexible',
    source: 'exploratory',
    sourceNote: 'Newly designed exploratory item.',
    askConfidence: true,
    note: (v) =>
      agree(
        v,
        'Living near my parents as they age matters to me.',
        'Living near my parents as they age matters somewhat.',
        'Living near my parents as they age is not a priority.',
      ),
  },
  // ── Goals ↔ Values ─────────────────────────────────────────
  {
    id: 'GVL-01',
    nodeId: 'goal-values',
    text: 'Rank the values your long-term goal expresses most.',
    type: 'rank',
    options: GVL_01_OPTS,
    selfTags: ['meaning'],
    stability: 'flexible',
    source: 'exploratory',
    sourceNote: 'Newly designed; value list loosely informed by Schwartz’s basic values, not a validated measure.',
    note: (v) => `My goal mainly expresses ${ranked(GVL_01_OPTS, v)}.`,
  },
  {
    id: 'GVL-02',
    nodeId: 'goal-values',
    text: 'If I achieved this goal but neglected my other values, it would still feel worth it.',
    type: 'likert',
    selfTags: ['value-alignment'],
    stability: 'flexible',
    source: 'exploratory',
    sourceNote: 'Newly designed exploratory item.',
    askConfidence: true,
    note: (v) =>
      agree(
        v,
        'The goal would feel worth it even at the cost of other values.',
        'Whether the goal is worth neglecting other values is unclear to me.',
        'The goal would not feel worth it if I neglected my other values.',
      ),
  },
  {
    id: 'GVL-03',
    nodeId: 'goal-values',
    text: 'Where does this goal pull against something else you value?',
    type: 'text',
    selfTags: ['value-conflict'],
    stability: 'flexible',
    source: 'exploratory',
    sourceNote: 'Deeper open question, newly designed.',
    note: (v) => `Where the goal pulls against my values: “${String(v).trim()}”`,
  },
];

export const QUESTION_BY_ID: Record<string, Question> = Object.fromEntries(
  QUESTIONS.map((q) => [q.id, q]),
);

export function questionsForNode(nodeId: string): Question[] {
  return QUESTIONS.filter((q) => q.nodeId === nodeId);
}

export function formatAnswer(q: Question, v: AnswerValue): string {
  switch (q.type) {
    case 'likert': {
      const n = Number(v);
      if (q.scale) return `${n}/5 (${n <= 2 ? q.scale[0] : n >= 4 ? q.scale[1] : 'neither'})`;
      return `${n}/5 — ${LIKERT_LABELS[n - 1] ?? ''}`;
    }
    case 'choice':
      return optionLabel(q.options ?? [], v);
    case 'rank':
      return (Array.isArray(v) ? v : [])
        .map((x, i) => `${i + 1}. ${optionLabel(q.options ?? [], x)}`)
        .join('  ');
    case 'goal': {
      const g = v as GoalAnswer;
      return `${g.text} — importance ${g.importance}/10`;
    }
    default:
      return String(v);
  }
}
