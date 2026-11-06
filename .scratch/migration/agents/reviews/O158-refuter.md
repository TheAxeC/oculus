# Step O158 refuter report (on /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O158, base a199495e4)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
$ npm run diagrams && npm run docs:palette
  (exit 0; `find docs -type f -exec shasum` before and after compared equal: DOCS-UNCHANGED)

$ npm run test:quick -- --base a199495e4
test:quick: 11 test file(s)
ok      prettier (1.3 s): All matched files use Prettier code style!
ok      ASCII gate (1.5 s)
ok      svelte-kit sync (3.3 s)
ok      eslint (3.2 s)
ok      svelte-check (12.4 s): 1793985083425 COMPLETED 584 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (20.1 s): Duration  6.11s (transform 4.66s, setup 0ms, import 9.44s, tests 1.66s, environment 1ms)
ok      vitest slow (27.6 s): Duration  13.46s (transform 3.84s, setup 0ms, import 6.02s, tests 7.26s, environment 0ms)
ok      vitest checks (59.1 s): Duration  44.82s (transform 16.63s, setup 0ms, import 37.06s, tests 68.69s, environment 2ms)
test:quick: 62.6 s; every command passed

$ grep -rln "Facts.svelte\|Slide.svelte\|Dot.svelte\|views/academic/present.yml\|present\.fact\|drawn-slide" tests
tests/checks/config/config-folder.test.ts
$ npx vitest run tests/checks/config/config-folder.test.ts tests/checks/source/keys.test.ts tests/checks/config/config-folder.test.ts tests/checks/tree/size.test.ts --reporter=dot
 Test Files  3 passed (3)
      Tests  48 passed | 2 skipped (50)

$ LC_ALL=C perl -ne '<the rules file's gate>' $(find src tests utils config -type f ! -name local.yml)
  (prints nothing, exit 0); the same check over every touched file and the report: prints nothing

$ wc -l Slide.svelte parts/Dot.svelte parts/project/Facts.svelte screen/drawn-slide.ts config/text/views/academic/present.yml
     484 / 36 / 246 / 81 / 154

$ sh utils/folder-check.sh            (prints nothing, exit 0)
$ ls src/lib/views/academic/present/screen | wc -l     8
$ diff /Users/axelfaes/workspace/oculus/.agents/worktrees/O158-base/unused-exports.txt <(sh utils/unused-exports.sh)
  (prints nothing, exit 0)

History-word grep over every added src line and the whole of drawn-slide.ts:
68:+    // the stage, the status chips and the domain carry their hue as a dot before the value
96:+        /** The hue of the dot before the value; none for a field that draws no dot. */
151:+       label's size and the widest a value is drawn. The dot before a hued value is as wide as
  (three hits, each "before" of place; matches the report)

Report-quoted commands:
$ grep -n "Chip\|Tag\|Glyph" .../parts/project/Facts.svelte     (nothing, exit 1)
$ grep -n "clamp" .../parts/project/Facts.svelte                 (nothing, exit 1)
$ npx vitest run tests/checks/tree/boundaries.test.ts --reporter=dot
      Tests  11 passed (11)
$ grep -rn -i "two lines" src tests config docs README.md --exclude=local.yml
  hits about the strip only Facts.svelte:22, Facts.svelte:157, docs/decks.md:389, none a line limit; the rest about other things (board bars, folding, git parsing, routes)

Moved helpers: base Slide.svelte from "One figure of the drawn slide" to the line before "Lay the slide out", de-indented, against drawn-slide.ts:10-81 with "export " stripped: `diff` differs only by one trailing blank line of the extract. The bodies and doc comments are byte-equal.

Case-run program, rerun from the scratchpad from the report's source, then removed:
FACE=1.0 LINES=99 node strip-fit.mjs <worktree>: output equal to the report's, line for line, "decks 25, facts hidden in all 0"
FS=27: 7 lines 2, 5 lines 3, 12 lines 4, 1 lines 5 (matches)
WIDTH=270: dongho-ecg-clustering: facts 14, lines 13 (matches)
TODAY=1 WIDTH=1040 GAP=0.35 (as the report quotes it): hccnet-revision hidden 7 [collaborators, year, venue, funding, compute, code, tier]; 17 decks hide; venue hidden on 11, tier on 17
FACE=1.0 TODAY=1 WIDTH=1040 GAP=0.35: hccnet-revision hidden 5 [venue, funding, compute, code, tier]; 17 of 25 hide; venue 9, tier 17 (this form matches the report's base claims)
LINES=99 (default FACE 1.05, new strip): 5 decks 1 line, 7 decks 2, 13 decks 3; fed-faithful-ecg goes to 2 lines (1022 + 121 px)
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. Facts.svelte:128-152 draws no Chip, Tag, background, border or fill; label `.label` in `--muted-txt, var(--muted)`, `text-transform: uppercase`, `letter-spacing: 0.04em`, `--fact-label: 0.72em`; values as text nodes, no `{@html}`; the colon not drawn, the accessible phrase a visually hidden copy from `present.fact` (`.read`). The accessible text's content is Behaviour 1.
- 2: holds. `toneOf` (Facts.svelte:89-104) gives the base's tones field for field (`statusMarkTone` for form and chips, `isBlocked` red over every chip, `stageTone`, `domainTone`); Dot.svelte `width/height: var(--dot-size, 9px)`, `.facts` sets `--dot-size: 0.5em` (9 px at 18 px); Summary and Grid unchanged; head comment names the strip (wording in Standards 3).
- 3: violated, Spec 1 (in a frame narrower than a fact's capped width the value is not cut at its room). In the 1280 frame: gap 1em, label to value 0.4em, `white-space: nowrap` on `.drawn`.
- 4: holds. `.facts` `border-top: 1px solid var(--line)`, `padding-top: 0.6em`, inside Facts.svelte's box, hidden by `visibility: hidden`; `.strip` `padding-top: 1.2em` kept.
- 5: holds at the 14em cap. `fact_more`/`fact_count` keys; `.value` `max-width: var(--fact-value)` with `.entry` `min-width: 0; overflow: hidden; text-overflow: ellipsis` and `.count` `flex: none`; tooltip `t('present.fact', label, fact.words.join(', '))`.
- 6: holds as ruled by 699 (a). No clamp, strip in `.foot` across the root `.slide`, which now has no max width; the sizes are the brief's.
- 7: holds. `project-facts.ts` and `FACT_FIELDS` untouched (`git status --short`); toggle `visibility: hidden` plus `aria-hidden`; `font-size: var(--slide-fs-small)` on `.facts`, outside `.slide-fit`; all surfaces draw Slide.svelte.
- 8: holds by reading. Facts.svelte names only `--line`, `--muted-txt`/`--muted`, and Dot's `--c-<tone>`; the rice brackets' loss is stated in the report.
- 9: holds. docs/decks.md 386-389 and 395, docs/HELP.md 342-345 and 349 rewritten to the strip after the step, under ruling 699 (a); the Facts, Slide (foot paragraph, `.slide`, `.content`, `.foot`, `.keys`) and Dot comments rewritten. Minor wording findings are Standards 1 to 3.
- 10: holds. No test added or changed (`git diff a199495e4 --stat -- tests utils` prints nothing); keys, config-folder and size tests pass.
- 11: holds. Slide.svelte 484 lines; one new file `screen/drawn-slide.ts` (81) holding the six helpers and `Drawn` byte-equal to the base bodies; `screen/` at 8 entries; no `.reading` selector or DOM query anywhere else in `src` or `tests` (grep for `\.reading`, `querySelector(...slide`, `closest(...slide` finds none), so renaming the root's class and variable from `reading` to `slide` changes no reader.

Cases of the brief's "Cases" (as ruled by O158-cases.md):

- C1: met by reading. 12 facts, no box, muted capital labels, dots on stage and domain, collaborators drawn as first entry and `+2`, every fact drawn (no clamp), 1 px rule. The line count (3, estimated) is for the look.
- C2: met by reading: no clamp and no line limit, so 0 hidden; 3 lines by the estimate.
- C3: met by reading, same reason; 3 lines each by the estimate.
- C4: met by reading: 0 hidden on 25 decks by construction; the report gives a per-deck line count, and the reviewer's rerun reproduces it at FACE=1.0. At the program's default FACE 1.05 the counts shift (fed-faithful-ecg 1 to 2 lines), so the counts depend on the face; the look settles them.
- C5: met by reading: `.list` is `flex-wrap: wrap` with no `justify-content`, so facts start at the left edge with fixed gaps. Whether `ssm-longitudinal` is one line is an estimate of 1087 px (FACE 1.0) to 1121 px (FACE 1.05) out of 1150; the look settles it.
- C6: met by reading: the stage words are the server's vocab label; dot from `stageTone`.
- C7: met: `others > 0 ? t('present.fact_count', others) : ''` (Facts.svelte:110) gives no `+0` for one entry and `+1` for two.
- C8: met: the tooltip is `whole`, `present.fact` over every entry.
- C9: met by reading: `.hidden { visibility: hidden }` on `.facts` hides the words and the border, the room is kept, and `kept = tall(foot)` (Slide.svelte:154) is the same either way.
- C10: partial. At text size 1.5 every fact is drawn (no clamp; 5 lines on the tallest deck by the estimate). In the 400 px frame (270 px inner) the value is not cut at its room: see Spec 1.
- C11: met by reading for tokens; the colours drawn under each theme are for the look.
- C12: met by reading: every surface draws Slide.svelte. The thin rule in a small tile is stated in the report.
- C13: met: the `chips` case returns `'red'` when `isBlocked({ chips: fact.keys ?? [] }, words)`, which reads every chip.
- C14: met: `statusMarkTone`/`stageTone` give `'grey'`, so Dot draws `var(--c-grey)` (tokens.css:56).
- C15: met at the 14em cap (`.entry` shrinks with an ellipsis, `.count` `flex: none`). Below the cap, Spec 1 applies.
- C16: met: `wc -l` gives 484 and 81, and the helpers are byte-equal; the same slide on every surface is for the look.

## 1. Spec

- src/lib/views/academic/present/parts/project/Facts.svelte:183-187: "`.fact { position: relative; min-width: 0; max-width: 100%; }`", together with the removal of the base's "`.fact > :global(*) { min-width: 0; max-width: 100%; }`" (base Facts.svelte:189-192). What is wrong: item 3 asks that "a value longer than its room ends in an ellipsis", and C10 asks that no fact runs out of the strip in a 400 px frame. The Tooltip wrapper `.tip` (`display: inline-flex`, Tooltip.svelte) is now sized as wide as its content needs. Its least width is label + gap + dot + `min(value text, 14em)`, since `white-space: nowrap` and `overflow: hidden` do not lower an element's least width; only `max-width: 100%` on the wrapper capped it, and the diff removes that rule. `.fact` is held to 100% of the strip, but `.tip` inside it is not, so it runs past `.fact`. The ellipsis then falls at the 14em cap and never at the strip's edge. Failure scenario: a deck with `frame: 400x...` (270 px inner) shows PILLARS "Interpretable Structured-Tensor Methods +1" (label about 65 px, gap 7 px, value capped at 252 px, about 324 px in all). It is drawn about 54 px past the strip's right edge into the frame's padding, where the report says "a value wider than the room cut with an ellipsis". This is from reading the CSS, not from a page; the look's C10 400 px state confirms it. Restoring `max-width: 100%` (and `min-width: 0`) on the wrapper, or on `.fact > :global(.tip)`, ends it. Verdict: item 3 violated, C10 partial, C15 partial below the cap.

## 2. Proof

- .scratch/migration/agents/reviews/O158-report.md, section "The case-run program": "`TODAY=1 WIDTH=1040 GAP=0.35` for the base", and the first-run claim "whose base mode reproduces the brief's own measurement of the base: ... hccnet-revision 5 hidden ... the venue hidden on 8 of the 24". What is wrong: run as quoted (default `FACE` 1.05), the base mode gives hccnet-revision 7 hidden (collaborators and year added), venue hidden on 11 decks and tier on 17. Only `FACE=1.0 TODAY=1 WIDTH=1040 GAP=0.35` gives the claimed 5 and 9. The decision that rests on it: the report's calibration of the estimator, which is what the per-deck line counts and the "which decks lose room" list (going to Axel with the screenshots) are trusted on. The new-strip counts are quoted at `FACE=1.0`, and at 1.05 they move (fed-faithful-ecg from 1 line to 2). Failure scenario: the orchestrator reruns the quoted base command to check the calibration, gets a mismatch, and cannot tell which face factor the line counts assume. A reader of the room list takes counts that sit within 2 to 5 percent of the width (ssm-longitudinal 1087 of 1150, fed-faithful-ecg 1125) as firm. The fix is one line in the report: the base command with `FACE=1.0`, and the sensitivity named.

## 3. Standards

- src/lib/views/academic/present/Slide.svelte:24-31: "`// slide's Markdown takes of that room. A figure whose image has not`" followed by "`// loaded is not drawn until it has, ...`", in the paragraph whose last sentence the step extends ("What the layout reads off the drawn slide ... is screen/drawn-slide.ts's; the search and the state it sets are here."). What is wrong: rules file, "What every package obeys": "A comment edited by the step is rewrapped as a whole paragraph at 100 columns, so no line inside a sentence ends short." The step edits this paragraph and leaves line 25 at 72 columns in the middle of a sentence. The short line was already there at the base, but the step's edit to the paragraph brings it under the rule. Failure scenario: a reader meets a broken line mid-sentence, and the next step that touches the paragraph inherits it. Fix at landing by rewrapping the paragraph.
- src/lib/views/academic/present/parts/project/Facts.svelte:23-25: "`strip is set in the slide's small type (...) at the frame's factor 1, so it scales with the text size and the theme and not with the slide's content.`" What is wrong: rules file, "The working rules", Prose: "no 'not X but Y' construction (state the thing directly)". "and not with the slide's content" is that contrast. Failure scenario: the prose gate the plan applies to comments flags it at a later review. "so it scales with the text size and the theme, outside the content's factor" says the same thing directly.
- src/lib/views/academic/present/parts/Dot.svelte:5-6: "`The dot is 9 px across unless its parent sets --dot-size, which the strip sets to follow its own type.`" What is wrong: rules file, "What every package obeys" ("A sentence in a document or a head comment that the change makes false is a defect"). The strip sets `--dot-size` on `.facts` (Facts.svelte:165), three elements above the dot (`.facts > ul > li > .tip > .drawn > .mark > .dot`), not on its parent, and the property is inherited from any ancestor. Failure scenario: a reader adding a third user believes the property must sit on the dot's direct parent, or reads the strip's `.mark` span as the place it is set. "unless an element around it sets" is exact.

## 4. Behaviour

- src/lib/views/academic/present/parts/project/Facts.svelte:111 and :118: "`const short = others > 0 ? t('present.fact_more', first, others) : first;`" ... "`read: t('present.fact', label, short)`", with the drawn words `aria-hidden="true"` (:134). What is wrong: the accessible text of a list fact changes. Before (base Facts.svelte:88 and :138), the Tag's label was the whole fact, "Collaborators: Maryam Amir Haeri, Maureen Guichelaar, St<e acute>phanie M. van den Berg". After, a screen reader reads "Collaborators: Maryam Amir Haeri +2", and the other entries reach it by no route. The Tooltip wrapper is not `focusable`, the fact holds no focusable control, so `describedControl` returns null and no `aria-describedby` is set (tooltip-rules.ts), and the tooltip's `hidden` copy is not read. The report names the choice under "Judgment calls" but does not state the before and after, which the rules file's look rule counts as visible ("the accessible name"), or the loss. Failure scenario: a screen-reader user on a project slide hears "Lead: Axel Faes +1" and has no way to learn the second lead, where the base read both names. Setting `read` to `whole` keeps the drawn strip as it is and gives the reader the whole fact. If the shortened form is kept, it is the orchestrator's decision to record, with the before and after.

## Declined to judge

- Every drawn result (line counts, the room lost on the 13 three-line decks and any new Too tall, the theme colours, the thin rule in a tile, the dot's vertical centring, the label and value baseline): a reviewer runs no page; the look on landing measures them.
- Whether the visually hidden copy `.read` doubles the strip's words in a text selection, a Cmd+F search or the PDF's text layer: this needs a page or the printed PDF.
- The report's "Open items of the state file, verbatim: None.": the worktree's copy of `orchestrator-state.md` says "None.", but the main checkout's state file now holds open item 700 (dated 2026-11-06), and its mtime (18:08:25) is later than the report's (18:07:47). Whether 700 was open when the report was written is not something a read can settle.
- The ruling "Open item 699" is in the main checkout's `plan.md:3599` and not in the worktree's copy. The diff was judged against the cases ruling `briefs/O158-cases.md` and that line.
- Which fact `hccnet-revision` lists first among its collaborators (the report hedges "<first entry> +2"): this rests on the manifest's order and the server's words, and the look shows it.

Reviewer usage: a7c36a3b237a4d3c2, claude-opus-5-5, 230538 tokens, 56 tool uses, 11.9 min.
