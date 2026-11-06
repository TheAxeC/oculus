# O160 landing

Position: roadmap entry "migration" (the cockpit-to-oculus migration); step O160, Live HPC shows its refresh running, landed; next: the review over O162's repair round 1, then O162's landing with its look, then O158's look.

## Open items

- Open item 712 (2026-11-06), O161: a clash between two of Axel's words on the stand-in. Ruling 705: "The placeholder holds both sets of words", the words the view's search reads and the text the card's face draws. His later message: "CMD-F must essentially, work exactly like it works today with no change in behaviour". They differ on one kind of word only: a word the view's search reads that the card's face does not draw. On Lit Watch that is a project's key (`radar.ts:103` reads `project`, the card draws the project's title). Today Cmd+F finds no match for such a word. A stand-in that holds it gives a match, and the match goes away once the card is drawn, which is a change of behaviour. (a) the stand-in holds exactly the text the card's face draws, recommended; (b) both sets.

## The check of Steps 1

`ListAgents` listed only O162's builder and the builders of O163 and O164; O160's builder ab8a69fbb7ac9a0c1 and reviewer a954d5be2d7b092c9 were not running.

## NOT DONE

Nothing of the brief. The error box's Refresh now (C2) was not shown at the look, since the cluster was live; it reads the same `refreshing` as the head's control.

## What landed

13 paths, 166 insertions and 45 deletions: the pressed count per cluster in `hpc.svelte.ts`, the shared count fold `state/shared/stores/waiting.svelte.ts` used by `usage-refresh.svelte.ts` and `session-marks.svelte.ts`, the turning refresh glyph on the head's Refresh now, the error box's Refresh now and the log's tail, and the diagrams.

## Found and fixed at landing

- S2: the comment paragraphs of `hpc.svelte.ts:5-10` and `Cluster.svelte:101-103` rewrapped at 100 columns.
- The builder's added sentence of `docs/HELP.md:363` removed under the ruling "Help redesigned".
- Recorded: S1, a second run of the quick list after a comment edit.

## Verification

Gate at main's head 0249485b2: `npm run diagrams && npm run docs:palette && npm run test:quick`, exit 0, "svelte-check (38.9 s): ... 584 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS", "test:quick: 113.5 s; every command passed". Main's staged diff equal to the gate's under `cmp`, 13 paths.

## The look

Scratch server on 8797 from the gate: Refresh now turns from the press until its answer (1.26 s) and two presses send one request; the log's tail turns while a log is read and stops when it shows.

## Agents

Builder ab8a69fbb7ac9a0c1 (claude-opus-5-5, 239648 tokens, 79 tool uses, 18.4 min); stopped builder a09725d8f3259d142 (claude-opus-5-5, usage not recorded); brief check ab29e1d416fa5d19e (claude-opus-5-5, 138617 tokens, 40 tool uses, 5.7 min); reviewer a954d5be2d7b092c9 (claude-opus-5-5, 179166 tokens, 61 tool uses, 12.6 min; Spec 0, Proof 1, Standards 2, Behaviour 0). The first report passed its bar apart from S1 and S2; two fixes at landing.
