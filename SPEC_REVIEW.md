# Spec review: prototype vs. the two writeups

Sources:
- **Doc 1:** *HS459 Project Idea, Group 5*, the original concept.
- **Doc 2:** *Prototype and Flow Development, Group 5*, the flow and item tables of the first prototype.
- **PLAN_V2.md:** the owner's plan for v2, which this build follows.

v1 followed Doc 2 item by item. v2 replaces Doc 2's three branches and 15 items with five branches and a new item set
(PLAN_V2.md section 2), after three simulated user walk-throughs found items nobody disagrees with, abstract wording and
the same question asked three ways. Where v2 departs from Doc 2, the reason is in PLAN_V2.md section 1.

## 1. What v2 changes against Doc 2

| Doc 2 | v2 |
| --- | --- |
| Three branches: Ethics, Worldview / Beliefs, Long-term Goals | Five: Worldview & Beliefs, Moral Principles, Personal Priorities, Identity & Self-concept, Goals & Aspirations |
| Items E1–E5, W1–W5, G1–G5 | 63 branch items, 4 opt-in one-liners and a 4-item monthly check-in. Carried over in new wording: W1, W4 (as W5), G1, G2, E2 (as M4), E3 (as MR2), E4 (as M5), E5 (as M3), W2 (as WS4), W3 (as MF3), G5 (as P2). Dropped: E1, the old W5, and G3 and G4 in their v1 forms (importance sliders, text). |
| Answers become a draft; nothing changes until you commit | Every answer is written to the notes at once (owner decision). Locked lines are never changed; the new answer goes on the line after them. Summaries and Reset topic are still previews. |
| Answer once | A one-minute monthly check-in, "Last time: … [Still true]" on every retake, and a Done screen that counts what stayed the same and lists what changed. |
| No AI in the prototype | Optional AI through the user's own Ollama, off by default, behind a second consent. Code chooses what goes in and checks what comes out; rules are the fallback. |

Still as in Doc 2: the root "Who am I?" covers consent; nodes open with OR on parent tags; one node with two parents
(now Family Duty, from Moral Principles and Goals); provenance, unique ids, timestamps and locks on every line; the
current version plus five prior per file; potential tensions, retakes and Ask with citations; a reading disappears when a
note it cites is gone.

## 2. Gaps against Doc 1

Closed in v2:

1. **Values.** Personal Priorities asks what wins when wants clash (P1), a short values pick informed by Schwartz (P3),
   and three plain trade-offs.
2. **Self-concept.** Identity & Self-concept: three words, strengths, roles, self-concept clarity (I4), five one-item
   tendencies informed by IPIP, and who you want to be.
3. **Monthly check-ins.** Four items (where the time went, how well it matched priorities, how close you feel to the
   person you want to be, what changed), logged with the date and suggested again after 30 days. Doc 1's example tension
   ("relationships matter, but time with them has decreased") now has data: tension 3 compares P2's first area with the
   latest check-in.
4. **What stayed the same.** "Still true" on retakes, "Same as last time: N" on the Done screen, and Ask can read the
   check-in log ("in all three check-ins most of your time went to work or studies").
5. **Decision support,** partly: the depth gates (settled / simple / worth exploring), the paths list and cheapest test
   (GC2–GC4), scenarios when someone else decides (GH3), conditions under which a lower priority wins (PC2), and an
   upcoming event (G5) that is listed under Revisit.
6. **Separate control over sharing with AI.** AI is off by default, runs only on the user's own computer, and turning it
   on asks a second consent.

Still open:

1. **Reminders outside the app.** The check-in is suggested inside the app only; there are no notifications or emails,
   because there is no server.
2. **"Change the importance of an aspect"** directly on a note. Users edit, delete, lock or retake.
3. **Purpose / meaning** is no longer its own node (Doc 1's "Meaning and purpose"); it is touched by G2, IB1 and C3.
4. **Validation.** Items are our own wording; nothing is scored. Real-user think-aloud tests (PLAN_V2 1.4) and a
   psychologist's review are still needed. Experiment mode records what testers do so weak items can be cut.
5. **AI quality.** On the eval, phi4-mini (the default) passed 14 of 15 fixtures and the other models 11–12; every model
   mishandled a question the notes cannot answer. The guards catch these, but readings should be checked with testers
   too. See [`AI_EVAL.md`](AI_EVAL.md).

## 3. Items flagged while building v2

Used as written in PLAN_V2 2.4; flagged against its rules in 1.3, not rewritten:

1. **Rule 6:** the Goals entry node has three text items outside a gate (G1, G2, G5).
2. **Rule 1:** GC2 and GH3 ask for lists (several lines), not one line. Both are behind a gate.
3. **"No why about motives":** GC3 ("What is the honest reason your first choice is first?") is a why-probe; MD1 asks
   where duty comes from, as a pick-one.
4. **Overlap (finding 4 in 1.2):** W1, W4, WC1 and WC3 all ask about choices or effort versus luck; W4 and WC1 are close.

## 4. Still worth fixing in the writeups

1. **References** for every construct cited: Schwartz values, self-concept clarity (Campbell et al., 1996), IPIP
   (Goldberg et al., 2006), generalised trust, primal world beliefs (Clifton et al., 2019), implicit theories (Dweck),
   locus of control (Rotter, 1966), EPQ-5 (Forsyth), moral foundations (Haidt & Graham), dual filial piety (Yeh &
   Bedford, 2003), Personal Projects Analysis (Little, 1983), Best Possible Self (King, 2001). Check each one's terms
   of use before wording closer to the original items.
2. **Privacy wording.** "Public APIs can be secured and anonymised" promises too much. v2's stance: nothing leaves the
   computer; free text cannot be fully anonymised.
3. **Figures** show the v1 map and items. Re-take the screenshots.
