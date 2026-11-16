import type { ChatMessage, JsonRequest } from './provider';

// PLAN_V2 5.5. One shared system prompt and three task prompts, each with one short worked
// example built from the sample profile.

export const SYSTEM_PROMPT = `You help a person read their own journal notes.
Use only the notes you are given. Keep numbers, dates and names exactly as written.
Do not guess motives, feelings or personality. Do not give advice or a verdict.
Write short, plain sentences addressed to "you". If the notes do not say, say so.`;

export const SUMMARISE_PROMPT = `Shorten these notes into at most 3 lines of at most 25 words each.
Restate what is written. Add nothing. Each line lists the ids it came from.`;

export const TENSION_PROMPT = `These two notes may pull in different directions. Write one sentence of at most 30 words that
states both, starting "You said". Do not say which is right or that they conflict for certain.`;

export const READING_PROMPT = `Answer the question using only these notes. Give at most 3 readings of at most 30 words each.
Each reading cites the ids it rests on. If the notes do not answer the question, set not_in_notes to true
and give no readings.`;

export const LIMITS = { summaryLines: 3, summaryWords: 25, tensionWords: 30, readings: 3, readingWords: 30 };

const linesSchema = (max: number) => ({
  type: 'array',
  maxItems: max,
  items: {
    type: 'object',
    properties: { text: { type: 'string' }, cites: { type: 'array', items: { type: 'string' } } },
    required: ['text', 'cites'],
  },
});

export const SCHEMAS = {
  summarise: { type: 'object', properties: { lines: linesSchema(LIMITS.summaryLines) }, required: ['lines'] },
  tension: { type: 'object', properties: { sentence: { type: 'string' } }, required: ['sentence'] },
  reading: {
    type: 'object',
    properties: { readings: linesSchema(LIMITS.readings), not_in_notes: { type: 'boolean' } },
    required: ['readings', 'not_in_notes'],
  },
};

export interface PromptLine {
  /** Short id sent to the model ("n1"); mapped back to the stored line by the caller. */
  id: string;
  text: string;
}

export const formatLines = (lines: PromptLine[]) => lines.map((l) => `[${l.id}] ${l.text.replace(/\s+/g, ' ').trim()}`).join('\n');

// ── Worked examples (from the sample profile) ─────────────────

const SUMMARISE_EXAMPLE: ChatMessage[] = [
  {
    role: 'user',
    content: `${SUMMARISE_PROMPT}\n\nNotes:\n[n1] On major life decisions, I think children can go against their parents’ wishes.\n[n2] Where what I owe my family stops: “It doesn’t require giving up my career, but it does require being reachable and back for the big moments.”`,
  },
  {
    role: 'assistant',
    content: JSON.stringify({
      lines: [
        { text: 'You think children can go against their parents’ wishes on major life decisions.', cites: ['n1'] },
        { text: 'Your duty stops short of giving up your career, but includes being back for the big moments.', cites: ['n2'] },
      ],
    }),
  },
];

const TENSION_EXAMPLE: ChatMessage[] = [
  {
    role: 'user',
    content: `${TENSION_PROMPT}\n\nNote A: I feel I owe my parents or elders a lot in time, money or big decisions (8/10).\nNote B: My current work or study takes a lot of time away from the people close to me (7/10).`,
  },
  {
    role: 'assistant',
    content: JSON.stringify({
      sentence: 'You said you owe your parents a lot (8/10), and that your work takes a lot of time away from people close to you (7/10).',
    }),
  },
];

const READING_EXAMPLE: ChatMessage[] = [
  {
    role: 'user',
    content: `${READING_PROMPT}\n\nQuestion: What do my check-ins show?\n\nNotes:\n[n1] 14 Sept 2026 — Most of my time went to work or studies.\n[n2] 14 Oct 2026 — Most of my time went to work or studies.\n[n3] 14 Oct 2026 — My time partly matched my priorities (4/10).`,
  },
  {
    role: 'assistant',
    content: JSON.stringify({
      readings: [
        { text: 'In both September and October most of your time went to work or studies.', cites: ['n1', 'n2'] },
        { text: 'In October you said your time partly matched your priorities (4/10).', cites: ['n3'] },
      ],
      not_in_notes: false,
    }),
  },
];

// ── Requests ─────────────────────────────────────────────────

export function summariseRequest(lines: PromptLine[]): JsonRequest {
  return {
    task: 'summarise',
    system: SYSTEM_PROMPT,
    schema: SCHEMAS.summarise,
    messages: [...SUMMARISE_EXAMPLE, { role: 'user', content: `${SUMMARISE_PROMPT}\n\nNotes:\n${formatLines(lines)}` }],
  };
}

export function tensionRequest(a: string, b: string): JsonRequest {
  return {
    task: 'tension',
    system: SYSTEM_PROMPT,
    schema: SCHEMAS.tension,
    messages: [...TENSION_EXAMPLE, { role: 'user', content: `${TENSION_PROMPT}\n\nNote A: ${a}\nNote B: ${b}` }],
  };
}

export function readingRequest(question: string, lines: PromptLine[]): JsonRequest {
  return {
    task: 'reading',
    system: SYSTEM_PROMPT,
    schema: SCHEMAS.reading,
    messages: [
      ...READING_EXAMPLE,
      { role: 'user', content: `${READING_PROMPT}\n\nQuestion: ${question}\n\nNotes:\n${lines.length ? formatLines(lines) : '(none)'}` },
    ],
  };
}
