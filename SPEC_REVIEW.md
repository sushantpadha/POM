# Spec review: prototype vs. the two writeups

Sources:
- **Doc 1:** *HS459 Project Idea, Group 5*, the original concept.
- **Doc 2:** *Prototype and Flow Development, Group 5*, the flow and item tables the prototype should match.

The prototype now follows **Doc 2**. Where Doc 2 is unclear or contradicts itself, the build makes the smallest reasonable choice and the choice is listed here. Gaps against Doc 1 are listed, not built.

## 1. What now matches Doc 2

| Doc 2 says | Prototype |
| --- | --- |
| Root "Who am I?" covers consent; nothing opens until it passes | Yes. The four steps are About, Your data, Question types and Consent. |
| Completing the root opens Ethics, Worldview / Beliefs and Long-term Goals | Yes |
| Items E1–E5, W1–W5 and G1–G5, with the stated format, self-tag, Stable/Flexible type and Adapted/New source | Yes. The wording is verbatim. The formats are 5-point agreement, 0–10 slider (with a confidence rating on E4), ranking, short text, text + 2 sliders (G1) and 5 sliders (G3). |
| E1, E2, E3 and E5 update `ethics/moral-principles`; E4 updates `ethics/family-obligations` | Yes. Each question now names the file(s) it writes to. |
| W1, W2 and W3 update `personal-agency`, `sources-of-knowledge` and `obligations-to-others` | Yes |
| G1 and G2 update `career`; G2 and G4 update `relationships`; G3 updates `long-term-goals/main` | Yes. G2 writes the same line to both files. |
| Family Relationships is opened by both E4 and G4, so one node has two parents | Yes. The node is named **Family Relationships**, as in Doc 2; the old build called it "Obligations to Elders & Family". |
| Each line records provenance, source question ID, a unique ID, timestamps and a lock | Yes |
| Locked lines are never changed automatically, including by summaries | Yes. Summaries now also leave the user's own lines untouched (see 3.4). |
| Each file keeps the current version plus 5 prior; nothing changes until you commit | Yes |
| Potential tensions, Changes over time, Retake panel and Ask your model | Yes. The retake panel and Ask were simplified to match Doc 2's description. |
| An AI statement disappears if the note it cites is deleted | **Now strict.** Before, a statement was kept while at least half of its sources remained. |
| "Questions marked Adapted are paraphrased, not administered in full" | Yes. Each question shows its source, and nothing is scored. |
| Main file = summary of the branch | Yes. *Summarise* on a `main` file builds a summary from the topic files in that folder. |

Deeper nodes below the 15 Doc 2 items use paraphrased items from instruments the writeups cite:
- **Moral Principles:** EPQ-5 idealism and relativism.
- **Personal Agency:** Rotter's forced-choice format.
- **Personal Projects:** Personal Projects Analysis rating dimensions.
- **Aspirations:** Aspiration Index likelihood ratings.

Two more deeper nodes cover Doc 1 topics:
- **Meaning in Life:** MLQ presence and search items, for Doc 1's "Meaning and purpose".
- **Family Relationships:** filial-obligation items informed by the dual filial piety model, a construct the writeups don't cite.

**Care vs Ambition** is our own node. It is reached from Family Relationships and from Personal Projects.

## 2. Issues in Doc 2 to fix in the writeup

Items marked **(changed in build)** were changed in the prototype. All others are left exactly as Doc 2 has them.

1. **W5 tag (changed in build).** W5 asks "what would make your life feel well used?", which is about purpose, but Doc 2 tags it `#epistemic`. The build tags it `#purpose`, so it opens Meaning in Life. Doc 2 also doesn't say which file W5 updates; the build uses `worldview/main`.
2. **E1 may not measure idealism.** "A moral action is one that produces the least harm for everyone involved" reads as a minimise-total-harm (consequentialist) statement. EPQ idealism items are about not harming anyone, whatever the benefit. Suggest rewording E1 as an idealism item (e.g. "It is never right to harm another person, even for a good result"), or changing its tag.
3. **E5 is tagged `#idealism`, but it measures consequences vs. rules vs. intentions.** That is a preference between ethical theories, not EPQ idealism. Give it its own tag (e.g. `#moral-reasoning`).
4. **Double- and triple-barrelled items.** E2 asks about situation *and* culture *and* "no rule applies everywhere". E4 covers time *and* money *and* career decisions. G1 asks three questions in one. They work as reflective prompts, but a single answer can't be read cleanly. Split them if the answers are ever compared.
5. **With OR unlocking, Family Relationships is not opened only by E4 and G4.** G2 and G5 also carry `#relationships`, so they open it too. If Doc 2 means "only G4", give G4 a distinct tag (e.g. `#family-life`).
6. **G5 target file not stated.** The build uses `long-term-goals/main`.
7. **No question writes to `ethics/main`.** Doc 2 treats `main` as "a summary", which is how the build now works: it is filled by *Summarise* or by hand. Say so explicitly in Doc 2.
8. **"Worldview Analysis Scale" is listed as a source, but no item is adapted from it.** W1 is adapted from locus of control only. Either adapt an item from it or remove it from the source table.
9. **Add full references** for EPQ-5 (Forsyth), Personal Projects Analysis (Little), Aspiration Index (Kasser & Ryan), Best Possible Self (King, 2001), locus of control (Rotter, 1966) and, if kept, MLQ (Steger et al., 2006). Check each instrument's terms of use before using wording closer to the original items.
10. **Figures are from the previous build.**
    - Fig. 1 shows old node names ("Obligations to Elders & Family", "Harm & Consequences").
    - Fig. 3 shows "0 / 6 answered" for Ethics, but Doc 2 lists five items.
    - Fig. 4 quotes old items.
    Re-take the screenshots.
11. **Gendered wording.** "...describe his inner feelings ... asking him" in the W5 notes. Use "their" / "them".
12. **"What is real and what is simulated" understates what runs.**
    - Tension detection and retake suggestions are fixed rules that run on the user's real answers. They are not sample data.
    - Summarisation is pre-written for the sample profile and rule-based otherwise.
    - Ask is pre-written for the sample profile and otherwise quotes the user's notes.
    Suggested statuses: *Working (rule-based)* for tensions and retakes, and *Simulated (pre-written for the sample; rule-based otherwise)* for summaries and Ask.
13. **The AI table conflates two things.** Doc 2's "Summarise: after a set of questions, a short draft note is shown as a proposal" describes the note drafted from answers. In the prototype that draft comes from fixed templates (pencil icon, no AI). The AI-style summary is a separate *Summarise* action (robot icon). The writeup should keep these apart, as Doc 1's "AI transparency" point requires.
14. **Privacy claim is too strong.** "Though the AI model runs on public APIs, they can be secured and privacy-protected ... (anonymization etc.)" promises more than can be delivered. Free-text personal notes are hard to anonymise. Suggest: "A full version would send notes to an AI service only after separate opt-in consent, and would minimise what is sent. Free text cannot be fully anonymised." The prototype's onboarding now says this.

## 3. Behaviour changes made to match the writeups or to be more honest

1. **The question bank was replaced** with Doc 2's items plus the deeper items described above. The old items (ETH-01…, HRM-…, CAR-…) are gone.
2. **Saved browser data from the earlier build is discarded** on first load (storage version 2). The old question IDs can't be mapped onto the new items. Old export files are rejected with an explanation.
3. **Submitting a questionnaire can draft changes to several files at once**, because each question names its own file.
4. **Summaries only shorten generated lines.** Lines the user wrote, and locked lines, stay word for word.
5. **Wording:** "Ask the model" became "Ask your model", as in Doc 2. All AI-labelled features say plainly that no AI is used in this prototype. Status labels changed from "Locked / Undiscovered / Available" to "Not opened yet / Open".
6. **Retake suggestions** now use three reasons: flexible answers older than 120 days, answers marked unsure, and the user's own note saying something changed. The reason "feeds a potential tension" was dropped as clutter.
7. **Topic files appear in the explorer only once their questions are open**, matching Doc 2's "topic files created as the user goes deeper".

## 4. Gaps against Doc 1 (not built; decide whether Doc 2 should mention them)

1. **Branches changed.** Doc 1 has Values, Ethics, Purpose and Worldview. Doc 2 has Ethics, Worldview and Long-term Goals.
    - Values (Schwartz PVQ), VIA, the Moral Foundations Questionnaire, IPIP and Self-Concept Clarity are not used.
    - Purpose is only partly covered, by W5 and the added Meaning in Life node.
    - Doc 2 should say the scope was narrowed and why.
2. **No monthly check-ins.** Doc 1's core loop has short monthly check-ins on time use, behaviour, concerns and whether actions match priorities. The prototype has retakes instead.
    - Doc 1's example tension ("relationships are important but time spent with them has decreased") needs time-use data that nothing collects.
    - PP2 (family time the project costs) is the nearest item.
3. **No "stable" observations.** Doc 1 shows "STABLE: Autonomy has remained highly important across the last five assessments". Changes over time shows differences between versions of a file, but nothing reports what has *stayed* the same across assessments.
4. **No direct "change the importance of an aspect".** Users can edit, delete or lock lines, cancel drafts, or retake a question, but there is no importance control on a note.
5. **Decision support is only an example question** ("…before deciding on the Zurich offer?"). There is no structured way to bring in a decision and compare options against the model.
6. **No separate control over sharing with an external AI.** None is needed while no AI is used. The consent step says the user would be asked again before any data is sent to one.
