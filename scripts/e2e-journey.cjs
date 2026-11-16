// End-to-end journey check (headless Chromium via Playwright).
// Usage: npm run dev, then: node scripts/e2e-journey.cjs  (requires the 'playwright' package)
// Optional: SHOTS=<dir> saves screenshots at 1440×900.
const BASE = process.env.BASE_URL || 'http://localhost:5173';
const { chromium } = require('playwright');
const assert = (c, m) => { if (!c) throw new Error('ASSERT: ' + m); console.log('ok -', m); };
const clickNode = async (page, id) => {
  await page.click('button[title="Fit to screen"]');
  await page.waitForTimeout(150);
  await page.click(`[data-node="${id}"] circle >> nth=-1`, { force: true });
};
const nodeClass = (page, id) => page.getAttribute(`[data-node="${id}"]`, 'class');
const shot = (page, name) => process.env.SHOTS && page.screenshot({ path: `${process.env.SHOTS}/${name}.png` });
const steps = (page) => page.$$eval('.qn-steps button', (n) => n.length - 1); // minus the Done step
const step = (page, i) => page.click(`.qn-steps button >> nth=${i}`);
const toDone = (page) => page.click('.qn-steps button[aria-label="Done"]');
const exitFocus = (page) => page.click('.qn-top button:has-text("Exit")');
const details = (page, label) => page.click(`[data-pane="details"] button:has-text("${label}")`);
const dock = (page, tab) => page.click(`.dock-tab[data-tab="${tab}"]`);
const fileMenu = async (page, item) => {
  await page.click('.file-toolbar button[aria-label="More file actions"]');
  await page.click(`.menu-item:has-text("${item}")`);
};
const lineTexts = (page) => page.$$eval('.entries .entry-text', (n) => n.map((x) => x.textContent));

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && !/fonts\.g/.test(m.text()) && errors.push(m.text()));
  page.on('dialog', (d) => d.accept());
  await page.goto(BASE);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await shot(page, '01-chooser');

  // ── Fresh journey ──
  await page.click('text=Start fresh');
  assert(await page.$$eval('[data-node]', (n) => n.length) === 6, 'only the root and five closed branches before consent');
  assert((await page.$$eval('.dock-tab', (n) => n.map((x) => x.dataset.tab))).join() === 'details,ask,tensions,revisit', 'one dock with four tabs: Details, Ask, Tensions, Revisit');
  assert((await page.$$('.fab, .float-panel')).length === 0, 'no floating buttons or panels');
  await details(page, 'Start');
  await page.fill('.name-field input', 'Sam');
  await shot(page, '02-onboarding');
  for (let i = 0; i < 3; i++) await page.click('.onb-nav button.primary');
  assert(await page.isDisabled('text=Agree and continue'), 'cannot continue without consent');
  await page.click('text=I agree to my answers');
  await page.click('text=I understand this is not a clinical tool');
  await page.click('text=Agree and continue');
  await page.waitForTimeout(900);
  assert((await page.textContent('.profile-pill')).includes('Sam'), 'name shown in the top bar');
  for (const id of ['worldview', 'moral', 'priorities', 'identity', 'goals']) assert((await nodeClass(page, id)).includes('available'), `${id} opened`);
  for (const id of ['family', 'checkin', 'clashes']) assert((await nodeClass(page, id)).includes('locked'), `${id} not open yet`);
  assert(await page.isVisible('[data-node="priorities"] .start-here'), 'the map marks Personal Priorities “Start here”');
  const angles = await page.$$eval('[data-node]', (gs) => {
    const pos = Object.fromEntries(gs.map((g) => { const m = g.getAttribute('transform').match(/translate\(([-\d.e]+),([-\d.e]+)\)/); return [g.dataset.node, [+m[1], +m[2]]]; }));
    const [rx, ry] = pos.root;
    return ['worldview', 'moral', 'priorities', 'identity', 'goals'].map((id) => (Math.atan2(pos[id][1] - ry, pos[id][0] - rx) * 180) / Math.PI);
  });
  const gaps = angles.flatMap((a, i) => angles.slice(i + 1).map((b) => { const d = Math.abs(a - b) % 360; return Math.min(d, 360 - d); }));
  assert(Math.min(...gaps) > 45, `branches sit in their own wedges (closest pair ${Math.round(Math.min(...gaps))}°)`);
  assert((await page.textContent('[data-dir="moral"] .tree-row.dir')).includes('Moral Principles'), 'tree shows folder titles, not slugs');
  await shot(page, '03-graph-fresh');

  // Personal Priorities
  await clickNode(page, 'priorities');
  assert(await page.isVisible('[data-pane="details"] .new-tag:has-text("start here")'), 'details say start here');
  await details(page, 'Answer questions');
  assert(!(await page.isVisible('.sidebar')) && !(await page.isVisible('.context-panel')), 'focus mode: tree and dock hidden while answering');
  assert(await page.isVisible('.qn-top button:has-text("Exit")'), 'focus mode has a visible Exit');
  assert(await steps(page) === 5, 'Personal Priorities shows five questions');
  assert((await page.textContent('.qn-count')) === '1 of 5', '“1 of 5” beside the step dots');
  await page.click('.why-link');
  assert(await page.isVisible('.q-help:has-text("trade-offs")'), '“Why we ask this” explains the item');
  await page.keyboard.press('2'); // P1: key 2 = Family
  assert(await page.isVisible('.unlock-callout:has-text("When Priorities Clash")'), 'P1 (#priority) opens When Priorities Clash');
  await page.waitForTimeout(700);
  assert((await page.textContent('.qn-count')) === '2 of 5', 'a pick-one answer advances by itself');
  await shot(page, '04-question');
  await step(page, 0);
  await page.click('.add-note');
  await page.fill('.note-box input', 'Unless it is my own health.');
  await page.keyboard.press('Enter');
  assert(await page.isVisible('.answer-note:has-text("Unless it is my own health.")'), '“Add a note” saves one line in my own words');
  await step(page, 1); // P2 rank: keep the order
  await page.click('button:has-text("Keep this order")');
  assert(await page.isVisible('.unlock-callout:has-text("Monthly Check-in")'), 'P2 (#life-areas) opens the Monthly Check-in');
  await step(page, 2); // P3 multi, max 3
  for (const o of ['Choosing my own way', 'Security', 'Close relationships']) await page.click(`.chip-opt:has-text("${o}")`);
  assert(await page.isDisabled('.chip-opt:has-text("Adventure")'), 'P3 allows at most three picks');
  assert(await page.isVisible('.unlock-callout:has-text("What I’d Trade")'), 'P3 (#values) opens What I’d Trade');
  await shot(page, '05-multi');
  await toDone(page);
  assert(await page.isVisible('[data-changed-file="priorities/main"]'), 'Done screen lists the notes that changed');
  await shot(page, '06-done');
  await page.click('[data-changed-file="priorities/main"]');
  assert(!(await page.isVisible('.proposal-bar')), 'answers are in the notes at once, with no draft step');
  const pm = await lineTexts(page);
  assert(pm.includes('When two things I want clash, family usually wins.'), 'P1 note reads as a sentence');
  assert(pm.includes('In my words: Unless it is my own health.'), 'the added note sits under the answer');
  assert(pm.includes('What matters most to me: choosing my own way, security and close relationships.'), 'P3 note lists the picks');

  await page.click('.entries .entry >> nth=0 >> .entry-text');
  await page.fill('.entry-edit textarea', '- Family wins, unless it is my health.');
  await page.keyboard.press('Enter');
  assert(await page.isVisible('.entries .entry >> nth=0 >> .prov.human'), 'edited line becomes written-by-you');
  await page.fill('.add-line input', 'I want to understand where my limits are.');
  await page.keyboard.press('Enter');
  assert(await page.isVisible('.entry-text:has-text("where my limits are")'), 'own note added');
  const p3line = page.locator('.entries .entry', { hasText: 'What matters most to me' });
  await page.mouse.move(5, 5);
  assert((await p3line.locator('.entry-side .chip').evaluate((n) => getComputedStyle(n).opacity)) === '0', 'line controls stay hidden until hover');
  await p3line.hover();
  await page.waitForTimeout(250);
  assert((await p3line.locator('.entry-side .chip').evaluate((n) => getComputedStyle(n).opacity)) === '1', 'line controls show on hover');
  await shot(page, '07-notes');

  // Retake: "Still true", then-and-now, and a locked line that must hold.
  const p2line = page.locator('.entries .entry', { hasText: 'Over the next few years' });
  await p2line.hover();
  await p2line.locator('.lock-btn').click();
  assert(await p2line.evaluate((n) => n.classList.contains('locked')), 'line locked');
  await page.click('.tab:has-text("Personal Priorities")');
  assert(await page.isVisible('.last-time:has-text("Family")'), 'a retake shows the last answer');
  await page.click('.last-time button:has-text("Still true")');
  await page.click('.rank-item >> nth=0 >> button[aria-label="Move down"]'); // P2 changed
  assert(await page.isVisible('.toast:has-text("Kept your locked line")'), 'changing a locked answer says the locked line was kept');
  await toDone(page);
  assert((await page.textContent('[data-then-now] [data-same]')) === '1', 'Done screen: same as last time 1 (P1 still true)');
  assert(await page.isVisible('.then-now li:has-text("Work or studies")'), 'Done screen lists the changed answer old → new');
  await shot(page, '08-then-now');
  await page.click('[data-changed-file="priorities/main"]');
  const p2lines = (await lineTexts(page)).filter((t) => t.startsWith('Over the next few years'));
  assert(p2lines.length === 2 && p2lines[0].includes('work or studies, then family') && p2lines[1].includes('family, then work'), 'locked line kept, new answer on the line after it');

  // Worldview with the keyboard: 4 = Agree, auto-advance.
  await page.click('.tab:has-text("Graph")');
  await clickNode(page, 'worldview');
  await details(page, 'Answer questions');
  await page.keyboard.press('4');
  await page.waitForTimeout(700);
  assert((await page.getAttribute('.qn-steps button >> nth=0', 'class')).includes('done') && (await page.textContent('.qn-count')) === '2 of 5', 'key 4 answers a scale and moves on');
  assert(await page.isVisible('.unlock-callout:has-text("Control & Change")'), 'W1 (#agency) opens Control & Change');
  await exitFocus(page);
  assert(await page.isVisible('.sidebar') && await page.isVisible('.dock'), 'Exit leaves focus mode');

  // Moral Principles: M5 opens Family Duty
  await clickNode(page, 'moral');
  await details(page, 'Answer questions');
  await step(page, 4);
  await page.locator('.q-input input[type=range]').fill('8');
  assert(await page.isVisible('.unlock-callout:has-text("Family Duty")'), 'M5 (#family-duty) opens Family Duty');
  assert(await page.isVisible('.confidence'), 'M5 asks how sure you are');
  await exitFocus(page);

  // Goals: G6 "None of these" opens nothing; a real pick opens Other Areas; G3 opens Work & Study
  await clickNode(page, 'goals');
  await details(page, 'Answer questions');
  await step(page, 5);
  await page.click('.chip-opt:has-text("None of these")');
  assert(!(await page.isVisible('.unlock-callout')), 'G6 “None of these” opens nothing');
  await page.click('.chip-opt:has-text("Health")');
  assert((await page.getAttribute('.chip-opt:has-text("None of these")', 'aria-pressed')) === 'false', 'picking an area clears “None of these”');
  assert(await page.isVisible('.unlock-callout:has-text("Other Areas")'), 'G6 pick opens Other Areas');
  await step(page, 2);
  await page.click('.choice:has-text("Narrowing down a few")');
  assert(await page.isVisible('.unlock-callout:has-text("Work & Study Path")'), 'G3 (#career) opens Work & Study Path');
  await toDone(page);

  // Depth gate in Work & Study Path
  await page.click('.done-section .link-row:has-text("Work & Study Path")');
  await details(page, 'Answer questions');
  assert(await steps(page) === 2, 'Work & Study shows the gate and GC5 only');
  await page.click('.choice:has-text("Settled")');
  assert(await steps(page) === 2, '“Settled” keeps the follow-ups hidden');
  await step(page, 0);
  await page.click('.choice:has-text("Worth exploring")');
  assert(await steps(page) === 5, '“Worth exploring” shows the three follow-ups');
  await shot(page, '09-gate');
  await exitFocus(page);

  await page.click('[data-file="goals/main"]');
  await page.click('.file-toolbar button:has-text("Summarise")');
  assert(await page.isVisible('.proposal-bar:has-text("Draft summary")'), 'a summary is still a draft to accept or cancel');
  await page.click('.proposal-bar button:has-text("Accept")');
  assert(await page.isVisible('.entry.ai .ai-label'), 'summary lines carry the AI rule and label');
  await page.click('.seg button:has-text("History")');
  assert(await page.isVisible('.history button:has-text("Restore")'), 'one History view: versions, diff against current, Restore');
  assert(!(await page.isVisible('.seg button:has-text("Changes over time")')), '“Changes over time” is merged into History');
  await shot(page, '10-history');
  await page.click('.file-toolbar button[aria-label="More file actions"]');
  assert(await page.isVisible('.menu-item:has-text("Reset topic…")') && await page.isVisible('.menu-item:has-text("Erase topic data…")'), 'Reset and Erase live in the note’s “…” menu');
  await page.keyboard.press('Escape');
  assert(!(await page.isVisible('[data-pane="details"] button:has-text("Summarise")')), 'no duplicate Summarise in the details');
  assert((await page.getAttribute('[data-file="moral/family-duty"]', 'class')).includes('is-empty'), 'empty notes are dimmed in the tree');

  await page.click('.tab:has-text("Graph")');
  await page.waitForTimeout(900);
  for (const id of ['family', 'checkin', 'clashes', 'trades', 'more', 'career']) assert(!(await nodeClass(page, id)).includes('locked'), `${id} open on the graph`);
  assert((await nodeClass(page, 'priorities')).includes('answered'), 'Personal Priorities answered');
  assert(!(await page.isVisible('[data-node="priorities"] .start-here')), '“Start here” goes once Priorities has an answer');
  await shot(page, '11-graph');

  // ── Sample profile ──
  await page.click('.profile-pill');
  await page.click('text=Load sample profile');
  await page.waitForTimeout(1200);
  await shot(page, '12-sample-graph');
  await page.hover('[data-node="moral"] circle >> nth=-1', { force: true });
  await page.waitForTimeout(250);
  assert((await nodeClass(page, 'identity')).includes('g-dim') && !(await nodeClass(page, 'family')).includes('g-dim'), 'hover dims unrelated nodes');
  await shot(page, '12b-hover');
  await page.mouse.move(5, 5);
  assert((await page.textContent('.dock-tab[data-tab="tensions"] .dock-badge')) === '3', 'tension count badge on the dock tab');
  await dock(page, 'tensions');
  assert((await page.$$eval('[data-tension]', (n) => n.length)) === 3, '3 potential tensions in the sample');
  await shot(page, '13-tensions');
  await page.click('[data-tension="family-duty-vs-work-time"] button:has-text("Dismiss")');
  assert((await page.$$eval('[data-tension]', (n) => n.length)) === 2, 'dismiss hides a tension');
  await dock(page, 'revisit');
  assert(await page.isVisible('[data-retake="checkin"]'), 'the monthly check-in is due');
  assert(await page.isVisible('[data-retake="goals"]:has-text("Zurich")'), 'the G5 event is listed');
  await shot(page, '14-revisit');
  await dock(page, 'ask');
  await page.click('[data-pane="ask"] .example >> nth=0');
  await page.waitForTimeout(3500);
  assert(await page.isVisible('.answer-block.interp'), 'ask shows an interpretation');
  await shot(page, '15-ask');
  await page.click('.answer-block.reported .cite >> nth=0');
  await page.waitForTimeout(300);
  assert(await page.isVisible('.entry.flash'), 'citation opens and highlights the note');
  await dock(page, 'ask');
  assert(await page.isVisible('.answer-block.interp'), 'Ask keeps its conversation when switching dock tabs');
  await dock(page, 'details');

  // ── AI with the fake provider (dev builds only; a live Ollama is exercised by scripts/ai-eval.mjs) ──
  await page.evaluate(() => localStorage.setItem('pom-ai-fake', '1'));
  await page.click('button[title="Your data"]');
  assert(await page.isVisible('.ai-settings button[aria-checked="true"]:has-text("Off")'), 'AI is off by default');
  await page.click('.ai-settings button:has-text("Ollama")');
  assert(await page.isVisible('[data-ai-consent]:has-text("Your notes are sent to the model running on this computer. Nothing leaves it.")'), 'turning AI on asks a second consent');
  await page.click('[data-ai-consent] button:has-text("I agree")');
  await page.click('.ai-settings button:has-text("Test connection")');
  assert(await page.waitForSelector('[data-ai-test="ok"]'), 'Test connection reports the model is installed');
  await shot(page, '15b-ai-settings');
  await page.click('.dialog button:has-text("Close")');
  assert(await page.isVisible('.topbar-stat.ai-on'), 'the top bar shows that AI is on');
  await dock(page, 'tensions');
  assert(await page.waitForSelector('[data-tension="work-first-vs-family-duty"] .ai-text:has-text("You said")'), 'with AI on, the model words a tension from the two lines (labelled AI)');
  await dock(page, 'ask');
  await page.fill('[data-pane="ask"] textarea', 'What do I owe my parents?');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(3500);
  assert(!(await page.isVisible('[data-ai-reading]')), 'no reading until the user asks for one');
  await page.click('[data-pane="ask"] button:has-text("Show a reading") >> nth=-1');
  assert(await page.waitForSelector('[data-ai-reading] .cite'), 'a reading appears on request, with citations');
  await shot(page, '15c-ai-reading');
  await dock(page, 'details');
  await page.click('[data-file="goals/work-and-study"]');
  await page.click('.file-toolbar button:has-text("Summarise")');
  assert(await page.waitForSelector('.proposal-bar:has-text("Draft summary")'), 'an AI summary is still a draft');
  assert(await page.isVisible('.diff-row .entry-text:has-text("You wrote:")'), 'the draft holds the model’s lines');
  await page.click('.proposal-bar button:has-text("Cancel")');
  await page.click('button[title="Your data"]');
  await page.click('.ai-settings button:has-text("Off")');
  await page.click('.dialog button:has-text("Close")');
  await page.evaluate(() => localStorage.removeItem('pom-ai-fake'));
  assert(!(await page.isVisible('.topbar-stat.ai-on')), 'AI can be turned off again');

  // A check-in: "Still true" appends a new dated line to the log.
  await page.click('.tab:has-text("Graph")');
  await clickNode(page, 'checkin');
  await details(page, 'Retake');
  await page.click('.last-time button:has-text("Still true")');
  await toDone(page);
  assert((await page.textContent('[data-then-now] [data-same]')) === '1', 'check-in Done screen: same as last time 1');
  await page.click('[data-changed-file="check-ins/log"]');
  const workLines = (await lineTexts(page)).filter((t) => t.includes('Most of my time went to work or studies')).length;
  assert(workLines === 4, `check-in log keeps one dated line per month (${workLines})`);
  await shot(page, '16-checkin-log');

  // When Priorities Clash: PC1 = take surfaces tension 4.
  await page.click('.tab:has-text("Graph")');
  await clickNode(page, 'clashes');
  await details(page, 'Answer questions');
  await page.click('.choice:has-text("Take it") >> nth=0');
  await exitFocus(page);
  await dock(page, 'tensions');
  assert(await page.isVisible('[data-tension="take-opportunity-vs-people-first"]'), 'answering PC1 surfaces a new tension at once');
  await dock(page, 'details');

  await page.click('[data-file="goals/work-and-study"]');
  await fileMenu(page, 'Reset topic…');
  await shot(page, '17-reset');
  await page.click('.dialog button:has-text("Preview reset")');
  assert(await page.isVisible('.proposal-bar:has-text("Reset preview")'), 'reset is previewed first');
  await page.click('.proposal-bar button:has-text("Accept")');
  assert(await page.isVisible('.entry-text:has-text("Offer deadline")'), 'reset keeps your own lines');
  await fileMenu(page, 'Erase topic data…');
  assert(await page.isDisabled('.dialog button:has-text("Erase topic data")'), 'erase needs confirmation');
  await page.fill('.dialog input', 'work-and-study');
  await page.click('.dialog button:has-text("Erase topic data")');
  assert(await page.isVisible('.empty:has-text("No notes yet")'), 'erase removes the notes');

  // ── Export / import ──
  const answersBefore = await page.textContent('.topbar-stat b');
  await page.click('.profile-pill');
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('text=Export (.json)')]);
  const exportPath = await download.path();
  assert(/personal-operating-model-.*\.json/.test(download.suggestedFilename()), 'export downloads a JSON file');
  await page.click('.profile-pill');
  await page.click('.menu >> text=Start fresh');
  assert((await page.textContent('.topbar-stat b')) === '0', 'fresh start is empty');
  await page.click('.profile-pill');
  await page.click('text=Import…');
  await page.setInputFiles('.dialog input[type=file]', exportPath);
  assert(await page.waitForSelector('.callout:has-text("Ready to import")'), 'import previews the file');
  await page.click('button:has-text("Replace and import")');
  assert((await page.textContent('.topbar-stat b')) === answersBefore, `import restores answers (${answersBefore})`);
  assert((await page.textContent('.profile-pill')).includes('Priya'), 'import restores the name');

  // Old saved data (an earlier storage version) is discarded on load.
  await page.evaluate(() => localStorage.setItem('pom-prototype-v1', JSON.stringify({ state: { profile: 'fresh', responses: { E1: { value: 4 } } }, version: 4 })));
  await page.reload();
  assert(await page.isVisible('text=Start fresh'), 'data from an older storage version is discarded');

  console.log('errors:', errors);
  if (errors.length) process.exitCode = 1;
  await browser.close();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
