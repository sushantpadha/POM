// End-to-end journey check (headless Chromium via Playwright).
// Usage: npm run dev, then: node scripts/e2e-journey.cjs  (requires the 'playwright' package)
// Set SHOTS=<dir> to save screenshots.
const BASE = process.env.BASE_URL || 'http://localhost:5173';
const { chromium } = require('playwright');
const assert = (c, m) => { if (!c) throw new Error('ASSERT: ' + m); console.log('ok -', m); };
const shot = (page, name) => process.env.SHOTS && page.screenshot({ path: `${process.env.SHOTS}/${name}.png`, fullPage: true });
const nav = (page, label) => page.click(`.nav button:has-text("${label}")`);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && !/fonts\.g/.test(m.text()) && errors.push(m.text()));
  page.on('dialog', (d) => d.accept());
  await page.goto(BASE);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await shot(page, '01-welcome');

  // ── Onboarding: one page per step, nothing behind it ──
  await page.click('text=Start your own');
  assert(!(await page.isVisible('.nav')), 'no navigation before consent');
  assert(await page.isDisabled('.onb-nav .btn.primary'), 'a name is needed to continue');
  await page.fill('#name', 'Sam');
  await page.click('.onb-nav .btn.primary');
  assert(await page.isDisabled('.onb-nav .btn.primary'), 'AI must be chosen on or off');
  await page.click('.choice-cards button:has-text("AI on")');
  await shot(page, '02-data-and-ai');
  await page.click('.onb-nav .btn.primary');
  await page.click('.onb-nav .btn.primary');
  assert(await page.isDisabled('button:has-text("Agree")'), 'agree needs the checkbox');
  await page.click('text=I agree, and I understand');
  await page.click('button:has-text("Agree")');
  assert(await page.isVisible('.nav'), 'journal opens after consent');
  assert(await page.isVisible('.area-head:has-text("Ethics")') && await page.isVisible('.area-head:has-text("Long-term Goals")'), 'three starting points');
  assert((await page.$$('.next-step')).length === 1, 'one next step');
  await shot(page, '03-journal-empty');

  // ── Reflection: one question at a time ──
  await page.click('.next-step .btn');
  assert(await page.isVisible('.prompt:has-text("harm an innocent other")'), 'E1 shown first');
  assert(await page.isDisabled('.reflect-actions .btn.primary'), 'Continue waits for an answer; Skip is always there');
  await page.click('.likert button:has-text("Agree") >> nth=1'); // "Agree" (not "Strongly agree")
  await page.click('.why .link');
  assert(await page.isVisible('.why:has-text("Ethics Position Questionnaire")'), 'why-we-ask line shows the source');
  await shot(page, '04-question');
  await page.click('.reflect-actions .btn.primary');
  await page.click('.reflect-actions .btn:has-text("Skip")'); // E2
  await page.click('.reflect-actions .btn:has-text("Skip")'); // E3
  await page.locator('.answer input[type=range]').fill('8'); // E4
  assert(await page.isVisible('.confidence'), 'confidence asked after the answer');
  await page.click('.seg button:has-text("Low")');
  await page.click('.reflect-actions .btn.primary');
  await page.click('.reflect-actions .btn:has-text("Skip")'); // E5
  const drafts = await page.$$eval('.draft h3', (n) => n.map((x) => x.textContent));
  assert(drafts.includes('Moral principles') && drafts.includes('Family obligations'), `ends with the notes that changed (${drafts.join(', ')})`);
  assert(await page.isVisible('.opened:has-text("Moral Principles")') && await page.isVisible('.opened:has-text("Family Relationships")'), 'says which topics opened');
  await shot(page, '05-end');
  await page.click('button:has-text("Save to journal")');
  assert(await page.isVisible('h1:has-text("Saved to your journal")'), 'saved');
  await page.click('button:has-text("Back to journal")');
  assert(await page.isVisible('.note-link:has-text("Moral principles")'), 'note listed in the journal');

  // ── Note: clean text, edit behind a toolbar ──
  await page.click('.note-link:has-text("Moral principles")');
  assert(!(await page.isVisible('.prov')), 'read mode shows no metadata');
  await shot(page, '06-note');
  await page.click('.toolbar button:has-text("Edit")');
  await page.click('.line[data-entry] >> nth=0');
  await page.fill('.line-edit', '- If something could hurt an innocent person, I hold back.');
  await page.keyboard.press('Enter');
  assert(await page.isVisible('.line >> nth=0 >> .prov.human'), 'edited line becomes written by you');
  await page.click('.line[data-entry] >> nth=0');
  await page.click('.line-tools button:has-text("Lock")');
  assert(await page.isVisible('.line.locked'), 'line locked from the toolbar');
  await page.click('.line-tools button:has-text("Details")');
  assert(await page.isVisible('.details:has-text("E1")'), 'question ID only under details');
  await page.fill('.add-line', 'I want to know where my limits are.');
  await page.keyboard.press('Enter');
  await shot(page, '07-edit');
  await page.click('.toolbar button:has-text("Done")');
  await page.click('.toolbar button:has-text("History")');
  assert((await page.$$('.tl-item')).length >= 2, 'history timeline');
  await shot(page, '08-history');

  // Revisit Ethics with a different E4: the locked line is untouched, and a draft shows the change.
  await page.click('.toolbar button:has-text("History")');
  await page.click('.note-small a:has-text("Ethics")');
  await page.click('.reflect-actions .btn:has-text("Skip")');
  await page.click('.reflect-actions .btn:has-text("Skip")');
  await page.click('.reflect-actions .btn:has-text("Skip")');
  await page.locator('.answer input[type=range]').fill('2');
  await page.click('.reflect-actions .btn.primary');
  await page.click('.reflect-actions .btn:has-text("Skip")');
  assert(await page.isVisible('.draft:has-text("Family obligations")'), 'changed answer drafts a change');
  await page.click('button:has-text("Discard")');
  assert(await page.isVisible('.page-title:has-text("journal")'), 'discard returns to the journal');

  // ── Map ──
  await nav(page, 'Map');
  const topics = await page.$$eval('.topic-row .t', (n) => n.map((x) => x.childNodes[0].textContent));
  assert(topics.join() === 'Ethics,Moral Principles,Family Relationships', `area list (${topics.join(', ')})`);
  assert(await page.isVisible('.topic-row:has-text("Family Relationships") .route:has-text("Ethics or Long-term Goals")'), 'shared topic shows both routes');
  await page.click('.topic-row:has-text("Family Relationships")');
  assert(await page.isVisible('.card .btn:has-text("Start reflecting")'), 'topic card has one main action');
  await shot(page, '09-map-list');
  await page.click('.map-switch button:has-text("Full map")');
  assert(!(await page.$('[data-node="tradeoffs"]')), 'hidden topics are not drawn');
  await shot(page, '10-map-full');

  // ── Sample ──
  await nav(page, 'Sam');
  await page.click('button:has-text("Load the sample")');
  await nav(page, 'Revisit');
  assert((await page.$$('[data-tension]')).length === 3, '3 possible tensions in one list');
  assert((await page.$$('.item')).length === 4, 'Revisit shows four items at a time');
  await page.click('button:has-text("more")');
  assert((await page.$$('[data-retake]')).length >= 2, 'retakes in the same list');
  await page.click('[data-tension="family-vs-project"] button:has-text("Look")');
  assert(await page.isVisible('[data-tension="family-vs-project"] .evidence'), 'look shows both notes');
  await shot(page, '11-revisit');
  await page.click('[data-tension="family-vs-project"] button:has-text("Dismiss")');
  assert((await page.$$('[data-tension]')).length === 2, 'dismiss sets it aside');

  await nav(page, 'Ask');
  await page.click('.examples .link >> nth=0');
  assert(await page.isVisible('.answer-part h4:has-text("Reading")'), 'reading shown, labelled AI');
  await shot(page, '12-ask');
  await page.click('.answer-part li .cite >> nth=0');
  assert(await page.isVisible('.line.highlight'), 'citation opens the note at the line');

  // AI summary lines can be kept or removed
  await nav(page, 'Journal');
  await page.click('.area:has-text("Ethics") .note-link:has-text("Overview")');
  const aiLines = (await page.$$('.line.ai')).length;
  await page.click('.line.ai .ai-actions button:has-text("Remove") >> nth=0');
  assert((await page.$$('.line.ai')).length === aiLines - 1, 'AI line can be removed');
  await page.click('.toolbar button:has-text("Summarise")');
  assert(await page.isVisible('.draft:has-text("Draft summary")'), 'summary is a draft first');
  await page.click('.draft button:has-text("Discard")');

  // AI off hides AI features
  await nav(page, 'Priya');
  await page.click('.toggle:has-text("Show AI features") input');
  await nav(page, 'Ask');
  assert(await page.isVisible('text=AI is turned off'), 'Ask is off when AI is off');
  await nav(page, 'Priya');
  await page.click('.toggle:has-text("Show AI features") input');
  await shot(page, '13-data');

  // Reset and erase
  await page.click('button:has-text("Choose a topic")');
  await page.click('.topic-line:has-text("Career") button:has-text("Reset")');
  await page.click('.dialog button.primary:has-text("Reset")');
  await nav(page, 'Journal');
  await page.click('.note-link:has-text("Career")');
  assert(await page.isVisible('.line:has-text("Offer deadline")'), 'reset keeps your own lines');
  await page.click('.toolbar button:has-text("Erase")');
  assert(await page.isDisabled('.dialog button:has-text("Erase")'), 'erase needs confirmation');
  await page.fill('.dialog input', 'erase');
  await page.click('.dialog button:has-text("Erase")');
  assert(await page.isVisible('.empty'), 'erase removes the notes');

  // Export / import
  await nav(page, 'Priya');
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('.section button:has-text("Export")')]);
  const file = await download.path();
  await page.click('button:has-text("Start fresh")');
  assert(await page.isVisible('text=Start your own') || await page.isVisible('#name'), 'fresh start goes back to onboarding');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.click('text=Import an export file');
  await page.setInputFiles('.dialog input[type=file]', file);
  await page.waitForSelector('.callout:has-text("Ready to import")');
  await page.click('button:has-text("Replace and import")');
  assert(await page.isVisible('.nav button:has-text("Priya")'), 'import restores the journal');

  console.log('errors:', errors);
  if (errors.length) process.exitCode = 1;
  await browser.close();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
