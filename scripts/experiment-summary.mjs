// Summarises exported experiment logs (PLAN_V2 section 6): per item, how often it was shown,
// answered and skipped, the median seconds to answer, the share that used "Add a note", and the
// share changed on a retake. This is the table that decides which items to cut.
//
//   node scripts/experiment-summary.mjs pom-experiment-*.json
//   node scripts/experiment-summary.mjs --json logs/*.json     # machine-readable
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const paths = args.filter((a) => a !== '--json');
if (!paths.length) {
  console.error('Usage: node scripts/experiment-summary.mjs [--json] <exported log.json> [...]');
  process.exit(2);
}

export function summarise(logs) {
  const items = new Map();
  const item = (qid) => {
    if (!items.has(qid)) items.set(qid, { qid, node: '', shown: 0, answered: 0, skipped: 0, ms: [], answeredBy: new Set(), notedBy: new Set(), retakes: 0, changedOnRetake: 0 });
    return items.get(qid);
  };
  const participants = new Set();
  for (const log of logs) {
    participants.add(log.participantId);
    for (const e of log.events ?? []) {
      if (!e.qid) continue;
      const it = item(e.qid);
      if (e.node) it.node = e.node;
      const who = `${e.pid}|${e.qid}`;
      switch (e.type) {
        case 'question_shown':
          it.shown++;
          break;
        case 'answered':
          it.answered++;
          it.answeredBy.add(who);
          if (typeof e.ms === 'number') it.ms.push(e.ms);
          if (e.retake) {
            it.retakes++;
            if (e.changedFromLast) it.changedOnRetake++;
          }
          break;
        case 'still_true':
          it.retakes++;
          break;
        case 'skipped':
          it.skipped++;
          break;
        case 'note_added':
          if (e.text) it.notedBy.add(who);
          break;
      }
    }
  }
  const median = (xs) => {
    if (!xs.length) return null;
    const s = [...xs].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  const rows = [...items.values()]
    .sort((a, b) => a.qid.localeCompare(b.qid, 'en', { numeric: true }))
    .map((it) => ({
      item: it.qid,
      node: it.node,
      shown: it.shown,
      answered: it.answered,
      skipped: it.skipped,
      medianSeconds: median(it.ms) === null ? null : Math.round(median(it.ms) / 100) / 10,
      addedNote: it.answeredBy.size ? it.notedBy.size / it.answeredBy.size : null,
      changedOnRetake: it.retakes ? it.changedOnRetake / it.retakes : null,
    }));
  return { participants: participants.size, rows };
}

const logs = paths.map((p) => {
  const data = JSON.parse(readFileSync(p, 'utf8'));
  if (data.format !== 'pom-experiment-log') throw new Error(`${p} is not an exported experiment log`);
  return data;
});
const { participants, rows } = summarise(logs);

if (asJson) {
  console.log(JSON.stringify({ participants, rows }, null, 2));
} else {
  const pct = (x) => (x === null ? '–' : `${Math.round(x * 100)}%`);
  const head = ['item', 'node', 'shown', 'answered', 'skipped', 'median s', 'add a note', 'changed on retake'];
  const body = rows.map((r) => [r.item, r.node, r.shown, r.answered, r.skipped, r.medianSeconds ?? '–', pct(r.addedNote), pct(r.changedOnRetake)]);
  const w = head.map((h, i) => Math.max(h.length, ...body.map((r) => String(r[i]).length)));
  const line = (r) => '| ' + r.map((c, i) => String(c).padEnd(w[i])).join(' | ') + ' |';
  console.log(`${logs.length} log(s), ${participants} participant(s)\n`);
  console.log(line(head));
  console.log('| ' + w.map((n) => '-'.repeat(n)).join(' | ') + ' |');
  body.forEach((r) => console.log(line(r)));
}
