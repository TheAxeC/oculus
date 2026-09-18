# Landing report: Q49

## Open items at this landing (verbatim from the state file)

- A write that never answers (raised 2026-09-18 02:03 by Q48's second round): `state/writes.svelte.ts`'s `send` has no timeout and no abort, so a request that never comes back leaves that form's Save control disabled until Cancel or a reload. Closing it means choosing how long a write may take before the page gives up, which is a user-visible duration nothing in `config/` names, so it is Axel's to rule. Recommended: a write gives up after 30 seconds and says so in the form's own refusal line, the duration living beside the other timeouts in `config/behavior.yml` so it can be changed without a build. The lazy option here would be leaving it stated as a limitation, which is what the round did.
- The project tab and the card disagree about a document the project has not got (raised 2026-09-18 05:15 by R14's repair round, first seen 2026-09-17 by Q34's review and never booked): `src/lib/views/shared/CardDocs.svelte:79` draws a known document a project does not hold as a plain `Tag`, so a card reads `TEX` in muted text for a project with no `manuscript/main.tex`, while the project tab draws nothing for it, and `tests/views/project.test.ts:219` pins that difference as the expected result. Which of the two is right is a user-visible shape nobody has ruled. Recommended: the tab draws the absent tags the card draws, one rule for one fact, since the tab is the fuller view of a project and a reader who opens it should not learn less than the card told them.
- A third, raised by this landing and recommended below: a tap on a device that also has a pointer now reaches no ticker button at all.

## NOT DONE

Nothing of the step itself. What this landing did not close is the third open item above: the touch rule.

## What landed

Q49 landed 2026-09-18 05:31 from worktree `q49` at base `2ac73578` by `land.sh --no-browser`, after one review (seven rulings), one repair round, and a second review whose eighteen findings were closed here or recorded below.

A button a ticker row is not drawing is out of the page: it holds no width, answers no press and is no Tab stop, and the row is the same box to the board whether it is open or not. An open row draws its buttons on the line at the row's end and the name is cut where they begin; a row too narrow draws the ones it measured room for, keeping the one it exists for and the one holding the keyboard.

Measured in the served build at 1600, 900, 760 and 480 in light and mocha: the name covered by 0 px, nothing past the row's edge, no button unpointable, the row's height equal open and closed. Against the base at the same widths the name at rest goes from 264.67 to 301.1 px at 1600, **from 0.00 to 301.1 at 900**, from 158.30 to 301.1 at 760 and **from 0.00 to 294.5 at 480**.

Fixes at landing:

- A stylus opens a row as a mouse does: `over()` refuses `touch` rather than admitting only `mouse`, which is what the head comment promised.
- `li { position: relative; }`, left over from the round that used an overlay, removed; nothing in the file is absolutely positioned.
- `tests/ui/primitives.test.ts` gained the revert it lacked (`class:kept={false}`), run: 1 failed of 76.
- A browser case added for where a kept button sits, which no case covered: at rest it is at the row's end, open the group is at the row's end and the button sits inside it where the caller lists it. Run at four widths; red with `margin-left: 0`.
- `tests/browser/cards.spec.ts` now reads the room the waiting buttons hold rather than their opacity, which `display: none` answers 0 for either way.
- The two head comments made true: a row that draws nothing focusable of its own is a pointer's to open, and a stylus hovers.
- The lint error my own new case introduced (two non-null assertions) fixed on main before the commit.

## Two decisions, both reversible, both superseding a sentence of the brief

1. **The button group sits at the row's end**, so the button a row keeps moves there too: on a wide pane it is about 300 px right of where it was. The brief said "the `kept` button keeps its place as it does today"; that cannot hold with a group pinned at the row's end, and the group at the end is what makes the name's room the same whatever the name's length.
2. **Opening a row cuts its name** where the buttons begin (light 900: 301.1 to 124.3; 480: 294.5 to 87.3). The brief said "the name under them is not reflowed". The trade is a name at rest where there was none.

## Verification on main

- `npx vitest run --reporter=dot`: 251 files, 4,266 tests, all passed.
- `npm run check`: 1,222 files, 0 errors, 0 warnings. `npm run lint`: clean after the fix above. `npm run format:check`: clean. The ASCII gate: nothing. `npm run build`: exit 0.
- `npx playwright test tests/browser/focus-buttons.spec.ts tests/browser/cards.spec.ts tests/browser/focus-look.spec.ts`: 27 passed.

## The look

Taken 2026-09-18 05:25 on the TEST page of Axel's Chrome, on his running server, over his own board. Before, measured in the page: the busiest row ("FLTA 2026 event in 39d", seven buttons, a 310 px row) drew a name of **0.0 px**, and the Subtasks rows read "Submission: Reada...", "Investigation: ECG ...", "Sub...", "Inves...", "A sec...". After: the same row draws its name at **119.9 px** and the rows read "Submission: Readable-ECG (ASAP)", "Investigation: ECG FAIR", "Submission", "Investigation", "A second person in the hub". With the pointer on the seven-button row the name is cut to "FLTA 2026 even..." and three buttons (PLANNED, COMPLETED, CANCELLED) are drawn on the line at the row's end, none of them past it.

## What the landing recorded rather than closed

- **The touch rule is a regression as well as a limit.** Before this step the waiting buttons were in the page at `opacity: 0` and hit-testable, so a tap on a hybrid raised hover and pressed the button under the finger; now they are out of the page and only a mouse or a stylus puts them back, so a hybrid's touchscreen reaches no ticker button. Axel's machine has no touchscreen. The alternative, a first tap that opens the row and a second that presses, is a reader-visible interaction shape nothing in the brief names, so it is his to rule; booked above.
- The one-frame clamp the round's report named as a sharp edge was not reproducible: sampled through `requestAnimationFrame` from the `pointerover` that opens a row, frames 0 to 7 all read the clamped set.
- `agents/reviews/Q49-report.md` carries the first round's tables, which the repair round reversed.

## Where the proof is

- The brief: `agents/briefs/Q49.md`.
- The builder's report and its repair round: `agents/reviews/Q49-report.md`.
- Both reviews, with what each found: `agents/reviews/Q49-refuter.md`.
