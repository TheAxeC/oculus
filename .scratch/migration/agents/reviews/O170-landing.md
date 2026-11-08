# O170 landing

Position: the oculus migration, step O170 (Literature and Present said and drawn plainly) landed. Next: O151's repair round 2.

Open items: none.

## Check of Steps 1

The builder a8f1be288ebe70b91 and the reviewers ace225e279285d09b and ac6693d7331455730 had ended before the landing; the runner's agent listing showed no subagent of this session.

## Not done

Nothing inside the brief.

## What landed

The whole range from base 2385c99b6 (the builder's work under the round-0 ruling and repair round 1, one wip commit d23700a25) with the fixes at landing, 93 paths counted without renames, 2606 insertions and 1966 deletions.

Fixes at landing: a saved form with no `listed` key is read as no listing (`form.ts`, `.optional()` in the shape), which left every new Literature search tab undrawn, found by the look, with `tests/state/feeds/literature/form.test.ts` seen failing first; a listing that names a source twice reads as no list (`answers.ts`, Proof 1 of the run over round 1); `export.ts`'s sentence on when the browser path returns (Standards 1); the reason in `hub-files-fixture.ts`'s head comment (Standards 2); the report's bullet on a built app; the check `tests/checks/imports/order.test.ts`, red on main since O172's commit 014cc1c0d because `ui/html.ts` imported `ui/display/text/html-memo.ts` and the quick list of that landing did not select the check: `html.ts` and `html-memo.ts` now stand in their own folder `src/lib/ui/html/`, listed in `tests/checks/imports/order.ts` below `ui/theme`, every import and comment naming them updated, the two lines of `agents/guarded.md` naming the old path corrected.

G152 of `agents/guarded.md` carries the report's replacement text. Findings of the run over round 1 are closed under the Closed heading of `agents/reviews/O170-refuter.md`.

A correction to O172's landing report: its quick list passed, and the check of the folder order was not in it, so main held that red check from 014cc1c0d to this commit.

## The look

On a scratch server from the gate (8797), on a scratch copy of the hub, dark theme over a wallpaper.

- C1: "BibTeX copied, built from the paper's fields because no source served one", with the `?bibtex` route answering none; `grep -rn citation-js config --exclude=local.yml` prints nothing.
- C2: reload with a query held: the network log holds `/api/literature?sources` and no `?source=`; the form shows the query, the list the idle line.
- C3: reload of a tab that has listed: eight buttons at the same offsets from their first drawn frame to the end of 14 s, Web of Science and Scopus disabled. The page draws once, empties for about 1.1 s and draws the same buttons again. A new tab with the route held: the buttons of the config's rows.
- C4: Web of Science and Scopus pressable until the listing answers, then disabled, the tooltip naming the `downloads` row; a search asks the six others and neither of them.
- C5: Search pressed with the route held sends nothing and shows no "none on" line; a listing that fails keeps the rows, and Search asks all eight drawn.
- C6: "Opening the print tab..." from 64 ms, gone at 401 ms once the print page was answered, the page printed; an export press during the hold says "An export of this deck is already in progress." and it stays.
- C26: a blocked tab's line stays; a print page that never asks loses its line at 10.0 s; a second deck's press during the first's hold keeps its line past the first's end and loses it at 12.5 s, its own end.
- C7: the line stands whole on its own row under the controls.
- C8: current frame at least as large as the next and notes above zero at 2400, 1400, 900, 620, 596, 590 and 400 px, heights 800 and 300 px (for example 590 by 800: 566x318 and 277x156; 400 by 300: 201x113 and 95x53, notes 75 px). Past the last slide: "End of the deck." and no next slide.
- C14: a scratch deck's two captions with a word wider than the box: the figures stacked, no caption over the next figure.
- C15: Present, Presenter and Export at left 515, 582 and 661 on a non-project slide, a project slide, the Overview and while presenting.
- C16: a sync to an unreachable remote: "The sync failed: Could not read from remote repository."
- C16, each action to an unreachable remote, on screen: "The fetch failed: Could not read from remote repository.", "The pull failed: ...", "The push was refused: ...", "The publish was refused: ...", each with the same remote's words; above Changes the line "The last fetch failed: Could not read from remote repository."
- Light theme: Literature's form, the eight source buttons with Web of Science and Scopus disabled and the tooltip naming the `downloads` row, the result cards with their counts per source; Present's toolbar, the line under it ("The browser blocked the print tab; allow pop-ups for this page and press Export again."), the presenter screen with current slide, next slide and notes; the fetch toast. All legible, nothing clipped.
- The export on the desktop path, on a scratch desktop app from the gate: "Making the PDF..." at 52 ms, "Wrote deck.pdf beside the deck." at 2168 ms and it stays; `deck/deck.pdf` of 27 pages, `/MediaBox [0 0 960 540]`, read from the file and removed from the scratch hub.

## Verification

In the gate worktree at main's head, `npm run diagrams && npm run docs:palette && npm run test:quick`: "test:quick: 271.1 s; every command passed", 91 changed files, 233 test files, in the gate worktree at main's head, the sixth run of the landing list and the first after the last fix. The staged diffs of the gate and of main compared equal with `cmp`. The landing list ran 6 times in the gate.

## What is next

O151's repair round 2, then its review, the measurement of every deck, its landing and the hub commit on Axel's word.

## Usage

Builder a8f1be288ebe70b91, claude-opus-5-5: first run (hand-back on item 6's candidates) 288889 tokens, 75 tool uses, 10.1 min; build under the round-0 ruling 248284 tokens, 261 tool uses, 36.3 min; repair round 1 104133 tokens, 44 tool uses, 17.2 min. Brief check a0e91311c5e402ce3, claude-opus-5-5, 288712 tokens, 28 tool uses, 13.6 min. Reviewer ace225e279285d09b, claude-opus-5-5, 300603 tokens, 38 tool uses, 20.0 min. Reviewer over round 1 ac6693d7331455730, claude-opus-5-5, 284054 tokens, 43 tool uses, 19.4 min.

First report's bar: not met; the first review found defects the round closed.
