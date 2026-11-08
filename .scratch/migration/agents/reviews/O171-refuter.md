# Step O171 refuter report (on .agents/worktrees/migration-O171, base 00adcfa54)

## Verification (rerun by the reviewer)

The rules bound me to `git diff`, `git status --short` and `git show`, so each `git grep` of the brief and the report was run as `grep -rn` over the same paths, with `--exclude=local.yml` over `config/`. See "Declined to judge" for what that leaves open. All commands ran from the worktree root.

```
Verify 1: `npm run diagrams` not run, it writes tracked files (see Declined to judge).
npm run test:quick -- --base 00adcfa54   (TMPDIR unset, piped through an ASCII filter and tail -30)
 FAIL  |unit| tests/data/sources/config/layers/manifest-fields.test.ts > the fields a hub adds to the project form > reads the added key of that hub's manifest with no finding, and another hub's as unknown
Error: Test timed out in 5000ms.
 Test Files  2 failed | 265 passed | 80 skipped (347)
      Tests  2 failed | 3784 passed | 938 skipped (4724)
ok      vitest slow (474.9 s): Duration  459.58s (transform 27.03s, setup 0ms, import 206.52s, tests 1616.96s, environment 22ms)
test:quick: 477.5 s; failed: vitest

The other failure's title fell above the tail -30. Its printed source line, `const fault = await post({` at line 153, is tests/routes/machine/cpp.test.ts:153 (grep). The summary names vitest as the only failed command.
Neither file is in the step's diff (`git diff 00adcfa54 --name-only` over them printed 0 lines).
npx vitest run tests/data/sources/config/layers/manifest-fields.test.ts --reporter=dot
 Test Files  1 passed (1)
      Tests  6 passed (6)
npx vitest run tests/routes/machine/cpp.test.ts --reporter=dot
 Test Files  1 passed (1)
      Tests  5 passed (5)

Verify 2: git status --short | awk '$1=="M"{print $2}' | LC_ALL=C xargs perl -ne '<the gate>'
(prints nothing) exit 0
LC_ALL=C grep -n '[^ -~]' over O171-report.md and O171-cases.md: prints nothing, exit 1

Verify 3: grep -rnE 'deck\.frame|defaults\.frame|frameSetting|deckFrame|DeckFrame|FrameSetting|wholeFrame|featuresFrame' src docs tests config --exclude=local.yml
(prints nothing) exit 1

Verify 4: grep -rnE "frame's own px|1150 px|1040 px|1280 by 720|in px" <Present files, slide.css, print and show routes, docs/decks.md>
src/routes/present/show/+page.svelte:68:    /** How far the window may fall short of the screen and still fill it, in px. */
(ruling 2 of O171-cases.md)

Verify 5: sh utils/unused-exports.sh, diff against ../O171-base/unused-exports.txt
334 lines each; diff exit 0

Verify 6 (C7): grep -rnE '[0-9]px|px`|px'"'"'|}px' <slide.css, Slide.svelte, Panel.svelte, parts, screen, print route>
21 lines. `sort | diff` against the report's block: exit 0. Eighteen are `1px solid` or `1px dashed` borders. The other three:
src/lib/views/academic/present/parts/project/Facts.svelte:196:        width: 1px;
src/lib/views/academic/present/parts/project/Facts.svelte:197:        height: 1px;
src/routes/present/print/+page.svelte:234:        padding: 16px;

Verify 7: judged by reading the diff; see the verdict on C2.
Verify 8: grep -n -i 'list item\|sentence\|words' .scratch/migration/agents/spec.md
lines 13 44 45 61 72 107, as the report says.

Commands the report quotes:
npx vitest run <the ten related files> --reporter=dot
 Test Files  10 passed (10)
      Tests  144 passed | 7 skipped (151)
npx vitest run tests/routes/files/file-undo.test.ts tests/routes/machine/commands.test.ts tests/server/edit/app-store.test.ts --tagsFilter '!slow'
 Test Files  3 passed (3)
      Tests  38 passed (38)
npx vitest run tests/routes/apps/app-manage.test.ts tests/routes/git/zenodo.test.ts tests/views/shared/forms/entry-add.test.ts --tagsFilter '!slow'
      Tests  92 passed (92)
npx vitest run tests/data/hubs/hub-portfolio.test.ts --tagsFilter slow --testTimeout 20000
      Tests  16 passed (16)
tail of .agents/scratch/test-quick-final2.log: test:quick: 504.7 s; failed: vitest (as quoted)
grep -rnwE 'TOO_TALL_PX|savedFrame|PAGE_PADDING|pageRule|wholeFrame|featuresFrame|frame_not_a_map|frame_key_unknown|frame_side_missing|frame_side' src tests config docs README.md --exclude=local.yml --exclude-dir=diagrams
(prints nothing) exit 1
grep -rnE 'printPdf\(|audienceFeatures\(|createPresenting\(' src tests: the seven lines the report names
literal grep of item 2: the lines the report names, and no others
grep -rn 'section: Slides' config --exclude=local.yml: (prints nothing) exit 1
history-word grep over `git diff -U0 -- src tests config docs`: only the hits the report judges, plus generated lines of docs/diagrams
wc -l over the report's 59 files: diff against the report's table exit 0
diff -rq over config, src, tests, utils against the base: 52 lines, one "Only in" (settings/present.ts)
sed -n 257p agents/guarded.md | grep -c <the span of "Doc text">: 1

Reviewer's computations:
px to cqw, the diff's removed px against its added cqw at N/1280: 79 pairs, 0 mismatches.
slide.css, recomputed by hand: 56, 36, 28, 24, 18, 11, 12, 13, 1040, 10, 6, 11, 16, 4, 3, 5, 1, 4, 1, 3, 8, 2 and rice 10, 11, 12, 3, 2, 3 of 1280 all equal the written values.
SLACK 1/2560 of the width = (0.5/720) * (9/16). TEXT_LEAST 0.28125 = 360/1280. TEXT_GAP 0.0203125 = 26/1280.
Elements that set container-type in src: Stage.svelte:117 (.room), Stage.svelte:125 (.stage), print/+page.svelte:210 (.page). None is under a slide; katex.min.css holds 0.
data-frame: Stage.svelte:94 (pane, presenter current and next, Overview tile, audience window, through Framed or Stage directly), print/+page.svelte:193. The only `.slide-frame` elements are those two.
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds, verify 3 prints nothing, `settings/present.ts` is deleted, `section: Slides` is gone, the field left `deck-schema.yml`, the reader reads no `frame`.
- 2: holds, `SLIDE_SHAPE`, `slideHeight` and `SLIDE_PAGE_PT` in `model-deck.ts`, read by Stage, Tile, Presenter, the print route, `present.ts`, `place.ts` and `print.ts`. The literal grep shows only the two named tolerances and the main window's default.
- 3: holds, no `transform: scale` in Stage, `.stage` is the size container, 79 conversions recomputed. The Chip, Tag and Table fallbacks keep today's px outside a slide. `PAGE_PADDING` is gone.
- 4: holds, every length handed to `layOut` is divided by `across`, no px constant or rounding remains in `slide-layout.ts`, the three `drawn-slide.ts` reads divide by `across`.
- 5: violated in one clause, Behaviour 1 ("One slide gives one verdict on every surface"). The rest holds: Stage reports `(content - inner) / box.height`, `TOO_TALL = 1 / 720`, `SLACK = 1 / 2560`, and each threshold means what its comment says.
- 6: holds, the line parses to the dictated string, `{1}` is `Math.max(1, Math.round(over * 100))`, no frame size is passed.
- 7: holds, `@page` is written from `SLIDE_PAGE_PT`, `printPdf(address)` through all layers, the hidden window is `Math.round(SLIDE_PAGE_PT.width * PX_PER_PT)` wide, `wholeFrame` is gone.
- 8: holds, `audienceFeatures(availWidth)`, `AUDIENCE_SIZE` height from `slideHeight`, `savedFrame` gone.
- 9: holds for `docs/decks.md`, `docs/templates.md` and the comments of the changed files. Two comments in unchanged files are Standards 1.
- 10: holds, the describe left `settings.test.ts`, and the "Doc text" span occurs once in G13's line.

Cases of the brief's "Cases":

- C1: met, the grep prints nothing and the Settings sections come from the catalog entries removed.
- C2: not verifiable as a whole. The drawing and the editor's mark need the look with such a deck. The reader half is met by `tests/data/sources/present.test.ts:195` (passes; the failure on the unchanged tree is quoted in the report).
- C3: met by reading, `workspace-layer.ts:312-339` gives `settings_unknown`, since no option key starts with `defaults.frame.`.
- C4: not verifiable, settled by reading `--slide-fit`, the boxes and the verdict at the two pane widths and the tile at the look. Behaviour 1 predicts a difference.
- C5: not verifiable, settled by the before and after verdicts at the look.
- C6: met by reading `measured` in `present.svelte.ts` and `findings.yml`.
- C7: met, the grep prints only what ruling 1 allows, and the fractions give 4, 3/5, 1, 4, 1 and 3/8/2 px at a 1280 px frame.
- C8: not verifiable, settled by `pdfinfo` on the exported PDF at the look. The constants give 960 by 540.
- C9: met by reading `present.ts:287-291` and the call at `present.svelte.ts:649`.
- C10: met by reading, title 4.375cqw * 12/13 is 51.69 px at 1280, chip text 0.78125cqw is 10 px.
- C11: met by reading, Stage's `min(100cqw, 100cqh * 16 / 9)` by `min(100cqh, 100cqw * 9 / 16)` in both rooms, and `.preview` takes the shape.
- C12: not verifiable as a whole. The multiplication is read in `slide.css`; that the factor brings a slide back inside needs the look at text size 1.5.
- C13: met by reading the same `min()` box inside the centring `.room`.
- C14: met by reading, Stage returns at `box.height === 0 || inner <= 0`, and the frame is hidden while the room has no size.
- C15: not verifiable. The boxes are in container units (read). "No new layout run" is settled by counting `layOutSlide` runs during a split drag at the look (see Declined to judge).

## 1. Spec

none

## 2. Proof

none

## 3. Standards

1. `src/lib/views/system/findings/Findings.svelte:26`: "its deck's frame (the Present store's `findings`)", and `src/lib/state/workbench/navigation/status.ts:470`: "the slides the Present view drew taller than their deck's frame". What is wrong: a deck has no frame after this step, and both files are outside the write list and unchanged. `.scratch/migration/agents/spec.md`, "What every package obeys": "A sentence in a document or a head comment that the change makes false is a defect of the change". The report's changed-name grep did not search this phrase. Failure scenario: a reader of either comment looks for a per-deck frame that no longer exists. Verdict: none of the items, whose comment clause covers changed files only.

2. `src/lib/views/academic/present/Slide.svelte:26`: "included, inside the room. An image in a slide's Markdown is drawn no taller". What is wrong: the step edited this paragraph and left a line of 83 columns inside a sentence, where the next word "than" fits. `spec.md`, "What every package obeys": "A comment edited by the step is rewrapped as a whole paragraph at 100 columns". Failure scenario: the head comment keeps a short line in mid-sentence, the form the rule exists to remove. Verdict: none.

3. Report section "Verify 1": "The run before it on the same tree (`.agents/scratch/test-quick-final.log`) failed". What is wrong: `npm run test:quick` ran a third time on the same tree, after red lines only in files the step does not change, and the report gives no count of its runs. `spec.md`, "Token discipline": for such a red line "the list is not run again for it", "The report states how many times you ran the list", and a run beyond that "is a finding of the review". Failure scenario: a run of about 500 s on a loaded machine repeats with nothing changed, and the reader must count the runs from three log names. Verdict: none.

4. Report section "The cases' first run", C2: "The program was deleted afterwards". What is wrong: the case-run program is described in prose, and its source is not quoted. `spec.md`, "What every package obeys": a case-run program "has its source and its output quoted in the report, so the reviewer can run it again". Failure scenario: the printed `C2 deck.frame: {"width":1000,"height":1000}` cannot be reproduced from the report. Verdict: none; the kept test covers the reader half of C2.

## 4. Behaviour

1. `src/lib/themes/slide.css:45`: "border: 1px solid var(--line);", with the same 1px borders at `Project.svelte:246, :312, :326`, `Panel.svelte:112-187`, `Words.svelte:70` and `Grid.svelte:86`, as summed by `Stage.svelte` `measure` and `Slide.svelte` `fits`.

   What is wrong: every other length is a fraction of the frame, but a hairline stays 1 px at every drawn size and still takes layout height. Base drew one 1280-wide layout under a transform, so hairlines scaled with it. Brief decision 2 says a hairline "sizes nothing"; in layout it does. Item 5 says a verdict that differs by drawn size "is a defect of this step, named in the report with its slide". The report's Risks section names only text rendering, and its before and after list does not state this change. Decision 2 and item 5 collide, so which one stands is the orchestrator's to rule.

   Failure scenario, computed from the code: a project slide with ten hairlines stacked vertically (frame 2, `.spec` 2, `.eli5` 2 and its dashed row, figure 2, `.explain` 2). At a 720 px high pane they take 10/720 = 1.4% of the frame's height. In an Overview tile at the grid's minimum width of 220 px (`Overview.svelte:246`, 124 px high) they take 10/124 = 8.1%. The search then settles on a smaller `--slide-fit` in the tile. A slide that fits only near factor 0.75 in the pane runs past its tile by far more than `TOO_TALL`, 1/720 of the height. Tile and pane both call `measured(deck, row, over)` under one key (`present.svelte.ts:495`), so the finding and the tile's mark follow whichever surface measured last. A Markdown table adds one hairline per row (`Words.svelte:70`), so a ten-row table is worse.

   Verdict: item 5 violated; C4 and C5 not verifiable until the look, and this finding predicts a difference at C4.

## Declined to judge

- Every quoted `git grep`, which my rules exclude. I ran `grep -rn` over the same paths instead, and it also reads untracked files. Settled by `git grep -n "deck\.frame\|defaults\.frame\|frameSetting\|deckFrame\|DeckFrame\|FrameSetting\|wholeFrame\|featuresFrame" -- src config docs tests ':!config/local.yml'` and the report's other `git grep` lines, at landing.
- `npm run diagrams` of verify 1: it writes tracked files and I may change nothing. Settled by the landing list. I read a sample of the regenerated diagrams: `docs/diagrams/layers.dot`, `layer-data.dot` and the head of `writes.dot`.
- Verify 1's other lines. My `tail -30` cut the ok lines of the ASCII gate, prettier, eslint, svelte-check and vitest checks. The summary `failed: vitest` names only vitest. The harness moved my foreground run to the background after 180 s; I waited on its exit.
- The red test's first run on the unchanged tree: rerunning it needs an edit to a copy, so it is taken from the report's quoted failure line, whose line number agrees with the diff's offsets.
- Whether a resize starts layouts (C15). `.probe` has no `line-height`, and no global stylesheet sets one (`grep -rn line-height src/lib/themes/*.css` prints nothing). If Chromium rounds a `line-height: normal` box to whole px, the probe's height fraction drifts past `PROBE_DRIFT` about every 1% of width, and a drag runs `layOutSlide` repeatedly. No page may be run here. Settled at the look by reading the probe's rect height while dragging a split, and by counting layouts.
- Non-linear text at small sizes (C4, C5), the report's own named risk, for the same reason. Markdown prose also has `line-height: normal`.
- Whether `.agents/scratch/` should be gone at hand-back. It still holds three logs, `unused-after.txt`, `diagrams.log` and a compile cache. The report cites the logs, and `spec.md` "Where you work" says "You remove that folder before your report" with an unclear antecedent.
- The report's `ps` and `uptime` lines describe a past moment and cannot be compared.
- `docs/adr`: `ls docs/adr` prints "No such file or directory", so no ADR governs the diff.

Reviewer usage: aba64b2bce2589a15, claude-opus-5-5, 305201 tokens, 39 tool uses, 20.6 min.
