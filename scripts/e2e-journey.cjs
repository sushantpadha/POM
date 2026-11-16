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
const steps = (page) => page.$$eval('.qn-steps button', (n) => n.length - 1); // minus the review step
const step = (page, i) => page.click(`.qn-steps button >> nth=${i}`);
const toReview = (page) => page.click('.qn-steps button[aria-label="Review and save"]');
const saveAndOpen = async (page, fileId) => {
  await toReview(page);
  await page.click('.qn-foot button.primary');
  await page.click(`.done-section .link-row:has-text("${fileId}")`);
};

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
  await page.click('.context-panel button:has-text("Start")');
  await page.fill('.name-field input', 'Sam');
  await shot(page, '02-onboarding');
  for (let i = 0; i < 3; i++) await page.click('.onb-nav button.primary');
  assert(await page.isDisabled('text=Agree and continue'), 'cannot continue without consent');
  await page.click('text=I agree to my answers');
  await page.click('text=I understand this is not a clinical tool');
  await page.click('text=Agree and continue');
  await page.waitForTimeout(800);
  assert((await page.textContent('.profile-pill')).includes('Sam'), 'name shown in the top bar');
  for (const id of ['worldview', 'moral', 'priorities', 'identity', 'goals']) assert((await nodeClass(page, id)).includes('available'), `${id} opened`);
  for (const id of ['family', 'checkin', 'clashes']) assert((await nodeClass(page, id)).includes('locked'), `${id} not open yet`);

  // Personal Priorities
  await clickNode(page, 'priorities');
  await page.click('.context-panel button:has-text("Answer questions")');
  assert(!(await page.isVisible('.qn-title')) && !(await page.isVisible('.context-panel')), 'only the question is shown, no parent-node text');
  assert(await steps(page) === 5, 'Personal Priorities shows five questions');
  await page.click('.choice:has-text("Family")'); // P1
  assert(await page.isVisible('.unlock-callout:has-text("When Priorities Clash")'), 'P1 (#priority) opens When Priorities Clash');
  await page.click('.why-link');
  assert(await page.isVisible('.q-help:has-text("settles")') || await page.isVisible('.q-help:has-text("trade-offs")'), '"Why we ask this" explains the item');
  await shot(page, '03-question');
  await step(page, 1); // P2 rank: keep the order
  await page.click('button:has-text("Keep this order")');
  assert(await page.isVisible('.unlock-callout:has-text("Monthly Check-in")'), 'P2 (#life-areas) opens the Monthly Check-in');
  await step(page, 2); // P3 multi, max 3
  for (const o of ['Choosing my own way', 'Security', 'Close relationships']) await page.click(`.chip-opt:has-text("${o}")`);
  assert(await page.isDisabled('.chip-opt:has-text("Adventure")'), 'P3 allows at most three picks');
  assert(await page.isVisible('.unlock-callout:has-text("What I’d Trade")'), 'P3 (#values) opens What I’d Trade');
  await shot(page, '04-multi');
  await saveAndOpen(page, 'priorities/main');
  assert(await page.isVisible('.proposal-bar'), 'note changes shown as a draft first');
  await page.click('.proposal-bar button:has-text("Commit")');
  assert(await page.isVisible('.entry-text:has-text("When two things I want clash, family usually wins.")'), 'P1 note reads as a sentence');
  assert(await page.isVisible('.entry-text:has-text("What matters most to me: choosing my own way, security and close relationships.")'), 'P3 note lists the picks');

  await page.click('.entries .entry >> nth=0 >> .entry-text');
  await page.fill('.entry-edit textarea', '- Family wins, unless it is my health.');
  await page.keyboard.press('Enter');
  assert(await page.isVisible('.entries .entry >> nth=0 >> .prov.human'), 'edited line becomes written-by-you');
  await page.fill('.add-line input', 'I want to understand where my limits are.');
  await page.keyboard.press('Enter');
  assert(await page.isVisible('.entry-text:has-text("where my limits are")'), 'own note added');
  await shot(page, '05-notes');

  // Retake: "Still true", then-and-now, and a locked line that must hold.
  const p2line = page.locator('.entries .entry', { hasText: 'Over the next few years' });
  await p2line.hover();
  await p2line.locator('.lock-btn').click();
  assert(await p2line.evaluate((n) => n.classList.contains('locked')), 'line locked');
  await page.click('.tab:has-text("Personal Priorities")');
  assert(await page.isVisible('.last-time:has-text("Family")'), 'a retake shows the last answer');
  await page.click('.last-time button:has-text("Still true")');
  await page.click('.rank-item >> nth=0 >> button[aria-label="Move down"]'); // P2 changed
  await toReview(page);
  await page.click('.qn-foot button.primary');
  assert((await page.textContent('[data-then-now] [data-same]')) === '1', 'Done screen: same as last time 1 (P1 still true)');
  assert(await page.isVisible('.then-now li:has-text("Work or studies")'), 'Done screen lists the changed answer old → new');
  await shot(page, '06-then-now');
  await page.click('.done-section .link-row:has-text("priorities/main")');
  assert(await page.isVisible('.diff-tag:has-text("locked")'), 'locked line kept in the new draft');
  await page.click('.proposal-bar button:has-text("Cancel")');
  assert(!(await page.isVisible('.proposal-bar')), 'cancel discards the draft');

  // Moral Principles: M5 opens Family Duty
  await page.click('.tab:has-text("Graph")');
  await clickNode(page, 'moral');
  await page.click('.context-panel button:has-text("Answer questions")');
  await step(page, 4);
  await page.locator('.q-input input[type=range]').fill('8');
  assert(await page.isVisible('.unlock-callout:has-text("Family Duty")'), 'M5 (#family-duty) opens Family Duty');
  assert(await page.isVisible('.confidence'), 'M5 asks how sure you are');

  // Goals: G6 "None of these" opens nothing; a real pick opens Other Areas; G3 opens Work & Study
  await page.click('.tab:has-text("Graph")');
  await clickNode(page, 'goals');
  await page.click('.context-panel button:has-text("Answer questions")');
  await step(page, 5);
  await page.click('.chip-opt:has-text("None of these")');
  assert(!(await page.isVisible('.unlock-callout')), 'G6 “None of these” opens nothing');
  await page.click('.chip-opt:has-text("Health")');
  assert(!(await page.isChecked?.('x').catch(() => false)), 'picking an area clears “None of these”');
  assert(await page.isVisible('.unlock-callout:has-text("Other Areas")'), 'G6 pick opens Other Areas');
  await step(page, 2);
  await page.click('.choice:has-text("Narrowing down a few")');
  assert(await page.isVisible('.unlock-callout:has-text("Work & Study Path")'), 'G3 (#career) opens Work & Study Path');
  await toReview(page);
  await page.click('.qn-foot button.primary');

  // Depth gate in Work & Study Path
  await page.click('.done-section .link-row:has-text("Work & Study Path")');
  await page.click('.context-panel button:has-text("Answer questions")');
  assert(await steps(page) === 2, 'Work & Study shows the gate and GC5 only');
  await page.click('.choice:has-text("Settled")');
  assert(await steps(page) === 2, '“Settled” keeps the follow-ups hidden');
  await page.click('.choice:has-text("Worth exploring")');
  assert(await steps(page) === 5, '“Worth exploring” shows the three follow-ups');
  await shot(page, '07-gate');

  await page.click('[data-file="goals/main"]');
  await page.click('.proposal-bar button:has-text("Commit")');
  await page.click('.file-toolbar button:has-text("Summarise")');
  assert(await page.isVisible('.proposal-bar:has-text("Draft summary")'), 'main file summary drafted');
  await page.click('.proposal-bar button:has-text("Commit")');
  await page.click('.seg button:has-text("History")');
  await shot(page, '08-history');

  await page.click('.tab:has-text("Graph")');
  await page.waitForTimeout(900);
  for (const id of ['family', 'checkin', 'clashes', 'trades', 'more', 'career']) assert(!(await nodeClass(page, id)).includes('locked'), `${id} open on the graph`);
  assert((await nodeClass(page, 'priorities')).includes('answered'), 'Personal Priorities answered');
  await shot(page, '09-graph');

  // ── Sample profile ──
  await page.click('.profile-pill');
  await page.click('text=Load sample profile');
  await page.waitForTimeout(900);
  await shot(page, '10-sample-graph');
  await page.click('.fab[aria-label="Potential tensions"]');
  assert((await page.$$eval('[data-tension]', (n) => n.length)) === 3, '3 potential tensions in the sample');
  await shot(page, '11-tensions');
  await page.click('[data-tension="family-duty-vs-work-time"] button:has-text("Dismiss")');
  assert((await page.$$eval('[data-tension]', (n) => n.length)) === 2, 'dismiss hides a tension');
  await page.click('.fab[aria-label="Suggested retakes"]');
  assert(await page.isVisible('[data-retake="checkin"]'), 'the monthly check-in is due');
  assert(await page.isVisible('[data-retake="goals"]:has-text("Zurich")'), 'the G5 event is listed');
  await shot(page, '12-retakes');
  await page.click('.fab[aria-label="Ask your model"]');
  await page.click('.example >> nth=0');
  await page.waitForTimeout(3500);
  assert(await page.isVisible('.answer-block.interp'), 'ask shows an interpretation');
  await shot(page, '13-ask');
  await page.click('.answer-block.reported .cite >> nth=0');
  await page.waitForTimeout(300);
  assert(await page.isVisible('.entry.flash'), 'citation opens and highlights the note');
  await page.click('.fab[aria-label="Ask your model"]');

  // A check-in: "Still true" appends a new dated line to the log.
  await page.click('.tab:has-text("Graph")');
  await clickNode(page, 'checkin');
  await page.click('.context-panel button:has-text("Retake")');
  await page.click('.last-time button:has-text("Still true")');
  await toReview(page);
  await page.click('.qn-foot button.primary');
  assert((await page.textContent('[data-then-now] [data-same]')) === '1', 'check-in Done screen: same as last time 1');
  await page.click('.done-section .link-row:has-text("check-ins/log")');
  await page.click('.proposal-bar button:has-text("Commit")');
  const workLines = await page.$$eval('.entry-text', (n) => n.filter((x) => x.textContent.includes('Most of my time went to work or studies')).length);
  assert(workLines === 4, `check-in log keeps one dated line per month (${workLines})`);

  // When Priorities Clash: PC1 = take surfaces tension 4.
  await page.click('.tab:has-text("Graph")');
  await clickNode(page, 'clashes');
  await page.click('.context-panel button:has-text("Answer questions")');
  await page.click('.choice:has-text("Take it") >> nth=0');
  await saveAndOpen(page, 'priorities/trade-offs');
  await page.click('.proposal-bar button:has-text("Commit")');
  await page.click('.fab[aria-label="Potential tensions"]');
  assert(await page.isVisible('[data-tension="take-opportunity-vs-people-first"]'), 'committing the PC1 note surfaces a new tension');
  await page.click('.fab[aria-label="Potential tensions"]');

  await page.click('[data-file="goals/work-and-study"]');
  await page.click('button:has-text("Reset topic…")');
  await shot(page, '14-reset');
  await page.click('.dialog button:has-text("Reset topic")');
  assert(await page.isVisible('.entry-text:has-text("Offer deadline")'), 'reset keeps your own lines');
  await page.click('button:has-text("Erase topic data…")');
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
