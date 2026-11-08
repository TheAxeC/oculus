# O171 report: the slide frame is the shape 16:9 alone

NOT done: verify 1 is not green. The last two runs of `npm run test:quick` on the finished tree printed "failed": three tests each time, every one a per-test timeout (5000 ms or 20000 ms), a different three on each run, none in a file this step changed, and each of the six passes when its file is run alone. The run before the last two edits (two desktop import lines and one facade re-export, listed under "Verify 1") printed "every command passed". Everything else in the brief is done.

## Open items of the state file, verbatim

`.scratch/migration/orchestrator-state.md:188-192`:

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

None.
```

## Rulings of round 0 (from the orchestrator, `briefs/O171-cases.md`)

1. C7: the print route's `.failed { margin: 0; padding: 16px; }` (now `src/routes/present/print/+page.svelte:234`) is outside every slide and stays 16px. C7 holds when the grep prints only 1px hairlines, the 1px screen-reader copy at `Facts.svelte:196-197`, and lines outside every slide, each named with why. Applied: see C7 below.
2. Verify 4: the SCREEN_SLACK doc comment at `src/routes/present/show/+page.svelte:68` is a screen-pixel tolerance, not a slide size; it stays and is named. Applied: it is the one line verify 4 prints.
3. Every item listed under "Planned" in the stop report stands as written. Applied as listed, with the desktop host importing `src/lib/data/model/model-deck.ts` directly, as that plan said.

## The cases' first run, unchanged tree

C1. `git grep -n "section: Slides" -- config ':!config/local.yml'` printed:
```
config/options/present.yml:9:        section: Slides
config/options/present.yml:17:        section: Slides
```

C2. A case program on the base copy, run with `node --experimental-strip-types` and TMPDIR and GIT_CEILING_DIRECTORIES set to `.agents/scratch`. It planted `deck/present.yml` = `deck: { title: Square, frame: { width: 1000, height: 1000 } }` and `order: [one.md]`, then called `createReader({hub, projects: [], tagTones: {}, catalog: textCatalog(VOCAB), order: deckOrderOf(VOCAB), globs: folderGlobs(), frame: frameSetting(VOCAB)}).read(...)`. It printed:
```
C2 deck.frame: {"width":1000,"height":1000} | has frame key: true
C2 findings: []
```
The program was deleted afterwards. The kept test (a row of an existing test, below) was run on the unchanged tree first: `npx vitest run tests/data/sources/present.test.ts -t "places the member decks"` printed 1 failed, 16 skipped, with `AssertionError: expected true to be false // Object.is equality` at `tests/data/sources/present.test.ts:201:46`.

C3. Read `src/lib/data/sources/config/merge/workspace-layer.ts:312-339`: a path with an options entry is applied; a path some option key extends (`startsWith(path + '.')`) is walked into; any other path gets `findings.config.settings_unknown` naming it. On the base `defaults.frame.width` has an entry and is applied. With the two entries gone, nested `defaults: { frame: { width: 1600 } }` gets the finding on `defaults.frame` (no option key starts with `defaults.frame.`), and a dotted `defaults.frame.width:` gets it on `defaults.frame.width`; nothing is applied in either case.

C4, C5. Look cases. Base: the frame is laid out at 1280 by 720 and drawn through `transform: scale(fit(...))` (`Stage.svelte:83-96`); the layout and the measure run in the frame's own px, so the verdict does not depend on the drawn size.

C6. Read `present.svelte.ts:496-501`: `t('findings.deck.too_tall', row.title, String(over), String(deck.frame.width), String(deck.frame.height))`; `findings.yml:142` was `'slide too tall: {0} runs {1} px past its frame of {2} by {3} px'`.

C7. The grep printed 112 lines on the unchanged tree across slide.css, Panel, Slide:327, Dot, Equation, Grid, Legend, Plain, Section, Summary, Words, Facts, Project, Stage:83-94 and the print route. The print route lines:
```
src/routes/present/print/+page.svelte:74:            : `<style>@page { size: ${deck.frame.width}px ${deck.frame.height}px; margin: 0; }</style>`
src/routes/present/print/+page.svelte:188:                style:width="{deck.frame.width}px"
src/routes/present/print/+page.svelte:189:                style:height="{deck.frame.height}px"
src/routes/present/print/+page.svelte:221:        padding: 16px;
```
This is the case the brief's rules got wrong: line 221 pads the failure sentence, outside every slide (rule: C7 "prints only 1px hairlines" against item 3 "every size inside a slide" and decision 7). Ruling 1 above.

C8. Read: the base `@page` is `size: 1280px 720px` (`print/+page.svelte:74`), 960 by 540 pt at 0.75 pt to the CSS px. Look case.

C9. Read `present.ts:295-296`: `frame === null ? 'popup' : \`popup,width=${frame.width},height=${frame.height}\``, which gives `popup,width=1280,height=720` with the shipped frame. A run under plain node fails because the module graph reaches `$state` (`generation.svelte.ts:23`), so the case rests on reading.

C10. Read: `body.rice .slide-frame` sets 52/33/26/22/17 px (`slide.css:63-69`); rice `--fs-xs` is 10px (`themes.css:59`); 56 x 12/13 = 51.69, within 0.5 of 52; 18 x 12/13 = 16.62, within 0.5 of 17.

C11. Read: the current slide fills `.current` through Stage; the next-slide room `.preview` takes `aspect-ratio` from `deck.frame` (`Presenter.svelte:121`). Look.

C12. Read: `--text-scale` multiplies the five design sizes (`slide.css:36-40`) and the `--fs-*` steps (`tokens.css:166-168`). Look.

C13. Read: Stage's `.room` is a centring flex box and `.stage` the scaled box (`Stage.svelte:105-120`). Look.

C14. Read: the measure returns at `element.clientHeight === 0` (`Stage.svelte:59`), and the frame is `visibility: hidden` while `scale === 0` (`:96`).

C15. Read: the layout is in frame px under a scale transform, so a resize changes the scale alone; the probe (`Slide.svelte:298-319`) keeps its size, so no layout runs. Look.

Verify 4 on the unchanged tree also printed `src/routes/present/show/+page.svelte:68:    /** How far the window may fall short of the screen and still fill it, in px. */`; ruling 2 above.

## The cases after the change

| Case | Proof | Result |
|---|---|---|
| C1 | `git grep -n "section: Slides" -- config ':!config/local.yml'` | prints nothing, exit 1. Look: Settings view, no section "Slides". |
| C2 | the row in `tests/data/sources/present.test.ts:193-195`, in the related-tests run under Verify 1 | passes; the planted `frame:` raises no finding and the deck has no `frame` key. Look for the 16:9 drawing and the editor's mark on `frame`. |
| C3 | reading, as above; the two entries are gone from `config/options/present.yml` | `defaults.frame.width: 1600` in `settings:` gets `findings.config.settings_unknown` and nothing is applied. Look on a scratch hub. |
| C4, C5 | look | the layout, the boxes, the factor and the verdict are fractions of the frame's drawn width and height (Slide.svelte, Stage.svelte); the orchestrator reads them at each size. |
| C6 | reading `src/lib/state/life/present.svelte.ts` `measured`: `const percent = Math.max(1, Math.round(over * 100)); const message = t('findings.deck.too_tall', row.title, String(percent));` | the finding names no px; `{1}` is a whole number of at least 1. |
| C7 | the grep, quoted under Verify 6 | only 1px hairlines, the 1px copy at Facts.svelte:196-197, and print:234 outside every slide. |
| C8 | reading `src/routes/present/print/+page.svelte`: `PAGE_RULE` is `@page { size: ${SLIDE_PAGE_PT.width}pt ${SLIDE_PAGE_PT.height}pt; margin: 0; }`, `SLIDE_PAGE_PT` = 960 by `slideHeight(960)` = 540 | look: `pdfinfo` prints `Page size: 960 x 540 pts` per page. |
| C9 | reading `src/lib/state/life/present.ts:287-291` | `audienceFeatures(availWidth)` answers `popup,width=<round(availWidth/2)>,height=<round(slideHeight(w))>`, `popup` for a width that is not a finite number above 0; the call passes `window.screen.availWidth`, no frame. |
| C10 | reading `src/lib/themes/slide.css` `body.rice .slide-frame` | design sizes `calc(Ncqw * 12 / 13)` of the default fractions (title 4.375cqw x 12/13 = 51.69 px at a 1280 px frame); ui steps 0.78125, 0.859375, 0.9375 cqw = 10, 11, 12 px at 1280. Look. |
| C11 | reading `Presenter.svelte`: the preview's `aspect-ratio` is `SLIDE_SHAPE.width / SLIDE_SHAPE.height`; both slides go through Stage | look at a narrow and a wide presenter window. |
| C12 | reading: the design sizes and the `--slide-ui-*` steps are multiplied by `var(--text-scale, 1)`, the content's by `--slide-fit` | look at text size 1.5. |
| C13 | reading `Stage.svelte`: `.stage` is `min(100cqw, 100cqh * 16 / 9)` by `min(100cqh, 100cqw * 9 / 16)` inside the centring `.room` | look: a tall pane letterboxes above and below. |
| C14 | reading `Stage.svelte:73, :98` | the measure returns at `box.height === 0 || inner <= 0`; the frame is `visibility: hidden` while the room's width or height is 0. |
| C15 | reading: Panel, Plain and Project write every box with `cqw(...)` and Slide writes `--slide-room-height` with `cqw(room)`; the probe compares its size as a fraction of the frame's width with a 1% drift, so a resize starts no layout | look: drag a split, the boxes keep their place. |

## DONE / NOT DONE

| Item | State | Proof |
|---|---|---|
| 1. No frame size anywhere | DONE | Verify 3 prints nothing; `src/lib/data/sources/config/settings/present.ts` removed (`diff -rq` prints `Only in src/lib/data/sources/config/settings: present.ts` on the base side). |
| 2. One shape | DONE | `SLIDE_SHAPE`, `slideHeight`, `SLIDE_PAGE_PT`, `PX_PER_PT` in `src/lib/data/model/model-deck.ts`; the literal grep below. |
| 3. Sizes as fractions | DONE | the C7 grep; the conversions listed under "Files". |
| 4. Layout in fractions | DONE | `slide-layout.ts`: `TEXT_LEAST = 0.28125`, `TEXT_GAP = 0.0203125`, head comment rewritten. |
| 5. Measure in fractions | DONE | Stage reports `(content - inner) / box.height`; `TOO_TALL = 1 / 720`; `SLACK = 1 / 2560`. |
| 6. Finding names no px | DONE | `config/text/findings.yml`: `too_tall: "slide too tall: {0} runs past its frame by {1}% of the frame's height"` (quoting under "Judgment calls"). |
| 7. The PDF | DONE | `printPdf(address)` through desktop.ts, bridge.ts, preload.cjs, app.ts, export.ts; print.ts opens at `Math.round(SLIDE_PAGE_PT.width * PX_PER_PT)` by `Math.round(SLIDE_PAGE_PT.height * PX_PER_PT)`. |
| 8. Audience window | DONE | C9; `place.ts` `AUDIENCE_SIZE = { w: 960, h: Math.round(slideHeight(960)) }`. |
| 9. The docs | DONE | `docs/decks.md` base lines 13, 74, 92 and 105 rewritten (now line 13 and line 103; the example's `frame:` line and the `deck.frame` table row removed); `docs/templates.md:1929` line removed. |
| 10. Guarded entry | DONE for the builder's part | the describe left `settings.test.ts`; G13's replacement under "Doc text" for the orchestrator. |
| Verify 1 | NOT DONE | see below. |
| Verify 2 to 8 | DONE | below. |

Verify 1. `npm run diagrams` printed its file list and exit 0. The last `npm run diagrams` ran after the last code edit and printed exit 0 (`.agents/scratch/diagrams.log`). `npm run test:quick` (TMPDIR unset), last run, `.agents/scratch/test-quick-final2.log`:
```
test:quick: 61 changed file(s), from git since HEAD
test:quick: 364 test file(s)
ok      ASCII gate (1.0 s)
ok      prettier (1.0 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.5 s)
ok      eslint (3.0 s)
ok      svelte-check (12.3 s): 1794155843790 COMPLETED 590 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (253.2 s): Duration  233.11s (transform 155.10s, setup 0ms, import 298.29s, tests 468.25s, environment 7ms)
FAILED  vitest (318.0 s)
ok      vitest slow (502.1 s): Duration  487.23s (transform 34.40s, setup 0ms, import 211.38s, tests 1720.56s, environment 22ms)
test:quick: 504.7 s; failed: vitest
```
The three failures of that run:
```
 FAIL  |unit| tests/routes/files/file-undo.test.ts > what an operation records > appends one files record for a create, with the path stamped after
Error: Test timed out in 5000ms.
 FAIL  |unit| tests/routes/machine/commands.test.ts > Add Command... over the repository commands file > asks for approval on the next press once the entry run is changed by hand
Error: Test timed out in 5000ms.
 FAIL  |unit| tests/server/edit/app-store.test.ts > writes the store of an app as the app-store kind > a target that holds no apps, answered unwritable
Error: Test timed out in 5000ms.
```
The run before it on the same tree (`.agents/scratch/test-quick-final.log`) failed `vitest` and `vitest slow` on six other timeouts: `tests/routes/apps/app-manage.test.ts` 'answers a header that names no app with 404, and an app that is disabled with closed', `tests/routes/git/zenodo.test.ts` 'deletes nothing and writes nothing when the publish answers 502 and neither the draft nor the record reads', `tests/views/shared/forms/entry-add.test.ts` 'asks the key with the name typed from the hit, ... (G134)' (5000 ms each), and three rows of `tests/data/hubs/hub-portfolio.test.ts` (20000 ms each). `uptime` during these runs printed load averages of 14.49 15.92 13.93 and 9.95 13.85 13.97. Each file run alone passes:
- `npx vitest run tests/routes/apps/app-manage.test.ts tests/routes/git/zenodo.test.ts tests/views/shared/forms/entry-add.test.ts --tagsFilter '!slow'`: `Test Files  3 passed (3)`, `Tests  92 passed (92)`.
- `npx vitest run tests/data/hubs/hub-portfolio.test.ts --tagsFilter slow --testTimeout 20000`: `Test Files  1 passed (1)`, `Tests  16 passed (16)`.
- `npx vitest run tests/routes/files/file-undo.test.ts tests/routes/machine/commands.test.ts tests/server/edit/app-store.test.ts --tagsFilter '!slow'`: `Test Files  3 passed (3)`, `Tests  38 passed (38)`.
The full run before the last edits (`.agents/scratch/test-quick.log`) printed `test:quick: 539.6 s; every command passed`. The edits after it: `src/desktop/decide/place.ts` and `src/desktop/windows/print.ts` import from `../../lib/data/model/model-deck.ts` in place of `index.ts`, and `src/lib/data/model/index.ts` no longer re-exports `PX_PER_PT`. Those runs do not cover the build or the lint of unchanged files (the tier's own "not covered" line).

The related tests run once after the change, before test:quick: `npx vitest run tests/checks/config/integrity.test.ts tests/checks/source/keys.test.ts tests/data/hubs/deck-globs.test.ts tests/data/hubs/decks.test.ts tests/data/sources/config/settings/settings.test.ts tests/data/sources/present.test.ts tests/routes/docs/deck.test.ts tests/server/desktop/window-guard.test.ts tests/server/edit/deck/deck-globs.test.ts tests/server/root/watch/deck-folders.test.ts` printed `Test Files  10 passed (10)`, `Tests  144 passed | 7 skipped (151)`.

Verify 2. `git status --short | awk '$1=="M"{print $2}' | LC_ALL=C xargs perl -ne 'my $l = $_; $l =~ s/\xC3[\x80-\xBF]//g if $ARGV =~ m{^config/}; print "$ARGV:$.:$_" if $l =~ /[^\x20-\x7E\n]/; close ARGV if eof'` printed nothing, exit 0. The removed file has no text to scan.

Verify 3. `git grep -n "deck\.frame\|defaults\.frame\|frameSetting\|deckFrame\|DeckFrame\|FrameSetting\|wholeFrame\|featuresFrame" -- src config docs tests ':!config/local.yml'` printed nothing, exit 1 (after `npm run diagrams` dropped the two edges of `docs/diagrams/writes.dot` and `writes.svg` that named `frameSetting` and `deckFrame`).

Verify 4. `git grep -nE "frame's own px|1150 px|1040 px|1280 by 720|in px" -- src/lib/views/academic/present src/lib/state/life/present.ts src/lib/state/life/present.svelte.ts src/lib/themes/slide.css src/routes/present/print src/routes/present/show docs/decks.md` printed:
```
src/routes/present/show/+page.svelte:68:    /** How far the window may fall short of the screen and still fill it, in px. */
```
That line stays under ruling 2: the doc comment of `SCREEN_SLACK = 1`, a tolerance in screen pixels for whether the window fills the screen.

Verify 5. `sh utils/unused-exports.sh` into `.agents/scratch/unused-after.txt`, then `diff ../O171-base/unused-exports.txt .agents/scratch/unused-after.txt` printed nothing, exit 0 (334 lines each). The step adds no line.

Verify 6, the C7 grep: `git grep -nE "[0-9]px|px\`|px'|}px" -- src/lib/themes/slide.css src/lib/views/academic/present/Slide.svelte src/lib/views/academic/present/Panel.svelte src/lib/views/academic/present/parts src/lib/views/academic/present/screen src/routes/present/print` printed:
```
src/lib/themes/slide.css:45:    border: 1px solid var(--line);
src/lib/views/academic/present/Panel.svelte:112:        border: 1px solid var(--line);
src/lib/views/academic/present/Panel.svelte:120:        border: 1px dashed var(--line);
src/lib/views/academic/present/Panel.svelte:129:        border: 1px solid var(--line);
src/lib/views/academic/present/Panel.svelte:145:        border: 1px solid var(--line);
src/lib/views/academic/present/Panel.svelte:187:        border: 1px dashed var(--line);
src/lib/views/academic/present/parts/Equation.svelte:48:        border: 1px solid var(--line);
src/lib/views/academic/present/parts/Grid.svelte:86:        border: 1px solid var(--line);
src/lib/views/academic/present/parts/Grid.svelte:113:        border: 1px solid var(--line);
src/lib/views/academic/present/parts/Plain.svelte:105:        border: 1px solid var(--line);
src/lib/views/academic/present/parts/Plain.svelte:118:        border: 1px dashed var(--line);
src/lib/views/academic/present/parts/Section.svelte:76:        border: 1px solid var(--line);
src/lib/views/academic/present/parts/Words.svelte:56:        border: 1px dashed var(--line);
src/lib/views/academic/present/parts/Words.svelte:70:        border: 1px solid var(--line);
src/lib/views/academic/present/parts/project/Facts.svelte:164:        border-top: 1px solid color-mix(in srgb, var(--muted-txt, var(--muted)) 50%, var(--line));
src/lib/views/academic/present/parts/project/Facts.svelte:196:        width: 1px;
src/lib/views/academic/present/parts/project/Facts.svelte:197:        height: 1px;
src/lib/views/academic/present/parts/project/Project.svelte:246:        border: 1px solid var(--line);
src/lib/views/academic/present/parts/project/Project.svelte:312:        border: 1px solid var(--tone, var(--line));
src/lib/views/academic/present/parts/project/Project.svelte:326:        border-top: 1px dashed var(--line);
src/routes/present/print/+page.svelte:234:        padding: 16px;
```
Every line but the last three named is a 1px hairline border (decision 2). `Facts.svelte:196-197` is the 1px box of `.read`, the screen-reader copy drawn nowhere. `print/+page.svelte:234` is `.failed`'s padding, outside every slide (ruling 1). The chip, tag and table measures inside a slide follow the slide through `--chip-gap`, `--chip-pad`, `--chip-rice-pad`, `--tag-gap`, `--tag-pad` and `--table-cell-pad` set on `.slide-frame` (0.3125, 0.234375/0.390625, 0.078125, 0.3125, 0.078125 and 0.234375/0.625/0.15625 cqw, which are 4, 3/5, 1, 4, 1 and 3/8/2 px at a 1280 px frame); outside a slide each falls back to its px.

Verify 7. The one changed test, the C2 row, was run on the unchanged tree first (result under C2) and passes after. Removed tests: describe 'frameSetting' of `tests/data/sources/config/settings/settings.test.ts`, with 'reads the frame a workspace sets' and the four rows of 'answers the default for a wrong defaults.frame.%s and names the key', of entry G13. The other test edits drop the `frame: frameSetting(VOCAB)` context field the reader no longer takes (present.test.ts four times, deck-globs.test.ts once) and the `frameSetting` and `type Entries` imports; no existing assertion is edited. The fixture `hub()` of describe 'the deck reader' changes `'deck: { title: Portfolio }'` to `'deck: { title: Portfolio, frame: { width: 1000, height: 1000 } }'`; on the unchanged tree that frame is inside its ranges, so the fixture's other tests saw no finding from it.

Verify 8. The rules page `.scratch/migration/agents/spec.md`, the only standards page `.agents/plan.yaml` names, holds no rule on list items or sentence length (`grep -n -i "list item\|sentence\|words" .scratch/migration/agents/spec.md` prints lines 13, 44, 45, 61, 72 and 107, none a length rule). The new `docs/decks.md:103` paragraph has three sentences, the longest 50 words, a list of what a fraction covers kept in one sentence because it names one property.

The literal grep for item 2: `git grep -nE "16 ?/ ?9|9 ?/ ?16|1280|720|960 ?pt|540 ?pt|16:9" -- src/lib/views/academic/present src/lib/state/life src/routes/present src/desktop src/lib/data/model/model-deck.ts src/lib/themes/slide.css` printed `place.ts:21` `DEFAULT_SIZE = { w: 1280, h: 800 }` (the main window's default size, not the slide), `present.svelte.ts:103` `TOO_TALL = 1 / 720` and its two doc lines (the brief's 1/720), `Slide.svelte:98, :104, :106` (`SLACK` and `LEAST_ROOM = 1 / 1280`, tolerances in fractions), and comment lines naming 16:9 or 540 pt in slide.css:1, Present.svelte:20, Stage.svelte:3 and print:8. No literal stands for the shape or the page.

History-word grep: `git diff -U0 -- src tests config docs | grep -E "^\+" | grep -v "^+++" | grep -niwE "before|used to|no longer|still|previously|formerly|anymore|now|old|new|was|were|legacy|today|removed|replaced|instead of"` printed hits in: "a new window is sized to" (present.ts doc, a window opened), "before that answer" (export.ts head, an order of events), "with no new layout" (Slide.svelte and Stage.svelte heads, no further layout run), "before the slide is laid out again" (PROBE_DRIFT doc, an order of events), the `moved(now, then)` code, "opens in a new tab" (export.ts head), "The dot before a hued value" (Facts style comment, a place on the line), "instead of read from the entry" (settings.test.ts head, unchanged words rewrapped). None compares with an earlier state.

Changed-name grep: `git grep -nwE "TOO_TALL_PX|savedFrame|PAGE_PADDING|pageRule|wholeFrame|featuresFrame|frame_not_a_map|frame_key_unknown|frame_side_missing|frame_side" -- src tests config docs README.md ':!config/local.yml' ':!docs/diagrams'` printed nothing; `git grep -nE "printPdf\(|audienceFeatures\(|createPresenting\(" -- src tests` printed only the new signatures and their calls (app.ts:151, print.ts:47, present.svelte.ts:566, 574, 649, present.ts:287, export.ts:228).

Nothing of mine is running: `ps -ax -o pid,ppid,etime,command | grep -E "[v]itest|[q]uick.mjs"` printed nothing.

## Files, with line counts (`wc -l`)

Removed: `src/lib/data/sources/config/settings/present.ts` (87 lines on the base).

```
       8 config/defaults/present.yml
      20 config/options/present.yml
      31 config/schemas/deck-schema.yml
     504 config/text/findings.yml
     392 docs/decks.md
    1940 docs/templates.md
      97 docs/diagrams/layer-data.dot
     482 docs/diagrams/layer-data.svg
     101 docs/diagrams/layers.dot
     556 docs/diagrams/layers.svg
    1763 docs/diagrams/writes.dot
    5859 docs/diagrams/writes.svg
     393 src/desktop/app.ts
     159 src/desktop/decide/place.ts
      53 src/desktop/preload.cjs
     298 src/desktop/windows/bridge.ts
      83 src/desktop/windows/print.ts
     152 src/desktop/windows/show.ts
     544 src/desktop/windows/windows.ts
     837 src/lib/data/model/index.ts
     357 src/lib/data/model/model-deck.ts
     115 src/lib/data/sources/config.ts
      83 src/lib/data/sources/config/settings/problems.ts
     803 src/lib/data/sources/deck/read.ts
     210 src/lib/data/sources/deck/spec.ts
     134 src/lib/data/sources/documents/decks.ts
     742 src/lib/state/life/present.svelte.ts
     739 src/lib/state/life/present.ts
     144 src/lib/state/shared/stores/desktop.ts
      93 src/lib/themes/slide.css
     289 src/lib/ui/controls/Chip.svelte
     138 src/lib/ui/controls/Tag.svelte
     210 src/lib/ui/display/table/Table.svelte
     233 src/lib/views/academic/present/Panel.svelte
     472 src/lib/views/academic/present/Present.svelte
     492 src/lib/views/academic/present/Slide.svelte
     143 src/lib/views/academic/present/acts/acts.svelte.ts
     242 src/lib/views/academic/present/acts/export.ts
     179 src/lib/views/academic/present/arrange/Tile.svelte
      37 src/lib/views/academic/present/parts/Dot.svelte
      66 src/lib/views/academic/present/parts/Equation.svelte
     133 src/lib/views/academic/present/parts/Grid.svelte
      43 src/lib/views/academic/present/parts/Legend.svelte
     131 src/lib/views/academic/present/parts/Plain.svelte
     111 src/lib/views/academic/present/parts/Section.svelte
     103 src/lib/views/academic/present/parts/Summary.svelte
      72 src/lib/views/academic/present/parts/Words.svelte
     249 src/lib/views/academic/present/parts/project/Facts.svelte
     359 src/lib/views/academic/present/parts/project/Project.svelte
     251 src/lib/views/academic/present/presenter/Presenter.svelte
      51 src/lib/views/academic/present/screen/Framed.svelte
     153 src/lib/views/academic/present/screen/Stage.svelte
      88 src/lib/views/academic/present/screen/drawn-slide.ts
     265 src/lib/views/academic/present/screen/slide-layout.ts
     236 src/routes/present/print/+page.svelte
     327 src/routes/present/show/+page.svelte
     205 tests/data/hubs/deck-globs.test.ts
     563 tests/data/sources/config/settings/settings.test.ts
     865 tests/data/sources/present.test.ts
```
Every source file is under 880 lines and every component under 520. No file was added; `src/lib/data/sources/config/settings/` lost one item. Every path is on the brief's list; `screen/shape.ts` was not made (the constants are in `model-deck.ts`, the approved plan). `diff -rq` against the base copy over config, src, tests and utils lists exactly the src, config and tests files above.

Head comments and docs touched by behaviour, each re-read: rewritten: the head comments of `config/defaults/present.yml`, `deck/read.ts`, `deck/spec.ts`, `state/life/present.ts`, `state/life/present.svelte.ts`, `desktop/windows/print.ts`, `desktop/decide/place.ts`, `desktop/windows/show.ts`, `acts/export.ts`, `themes/slide.css`, `screen/Stage.svelte`, `screen/Framed.svelte`, `screen/slide-layout.ts`, `screen/drawn-slide.ts`, `Slide.svelte`, `Panel.svelte`, `Present.svelte` (lines 20-24), `Presenter.svelte`, `arrange/Tile.svelte`, `parts/Plain.svelte`, `parts/project/Project.svelte`, `parts/Dot.svelte`, the Facts style comment, `routes/present/print/+page.svelte`, `routes/present/show/+page.svelte`, `Chip.svelte`, `Tag.svelte`, `settings.test.ts`, `docs/decks.md`; still true: the head comments of `bridge.ts`, `preload.cjs`, `app.ts`, `windows.ts`, `stores/desktop.ts` (its PrintAnswer doc rewritten), `model/index.ts`, `config.ts`, `problems.ts`, `documents/decks.ts`, `acts.svelte.ts`, `parts/Grid.svelte`, `Section.svelte`, `Words.svelte`, `Equation.svelte`, `Summary.svelte`, `Legend.svelte`, `Table.svelte`. `git grep -n -i "printPdf\|audience\|slide frame\|16:9\|too tall" -- README.md docs/*.md` outside decks.md prints nothing, so no other page describes this behaviour.

## Judgment calls

- The shape and page constants live in `src/lib/data/model/model-deck.ts` (the facade's ten-item folders and the layer rules leave no new file), exported through `data/model/index.ts` and re-exported by `state/life/present.ts`. The desktop host imports `model-deck.ts` directly, so the Electron main process does not load the whole facade; the facade does not re-export `PX_PER_PT`, which only the host reads.
- `config/text/findings.yml` holds the dictated line in prettier's quoting, `too_tall: "slide too tall: {0} runs past its frame by {1}% of the frame's height"`. The brief wrote it single-quoted with `''`; both parse to the same string, and `npm run test:quick`'s prettier step rewrites the single-quoted form.
- `SLACK = 1 / 2560` of the width (0.5/720 of the height), `LEAST_ROOM = 1 / 1280` of the width (the 1 px floor a Markdown image's cap had), `PROBE_DRIFT = 0.01` (the probe's relative drift before the slide is laid out again).
- The print route's `@page` rule is static, so the failure page also carries the 960 by 540 pt page.
- `audienceFeatures` answers `popup` for a screen width that is not a finite number above 0.
- `--radius-pill` (11 px; rice 3 px), `--button-line` (16 px) and Dot's 9 px fallback are set as fractions inside a slide. Dot is drawn only inside slides (`git grep -n "Dot.svelte'" -- src` names Grid, Summary and Facts alone).
- Left in px inside a slide: `ui/menu/Tooltip.svelte` (the hover tip of a fact, a floating tip over the slide, not a size of the slide), the frame's `--wall-blur` backdrop blur, and Table's sticky `top` offsets.

## Host- and user-visible changes, before and after (what the look reads against)

1. Settings view, Present: before, a section "Slides" with Width and Height controls; after, no such section.
2. Present pane on the portfolio deck: before, a 1280 by 720 frame scaled by a transform; after, the frame drawn at the room's largest 16:9 box at its own size. At a 1280 px wide frame the computed title is 56 px, the body 24 px and the padding 64 px, as before; at other widths in proportion.
3. A deck whose `present.yml` holds `deck: { frame: { width: 1000, height: 1000 } }`: before, square slides; after, 16:9 slides, no frame finding, and the editor marks `frame` as undeclared.
4. A too-tall slide's finding in the pane: before `slide too tall: <title> runs <n> px past its frame of 1280 by 720 px`; after `slide too tall: <title> runs past its frame by <n>% of the frame's height`.
5. Overview tiles and the presenter screen's next-slide room: 16:9 from `SLIDE_SHAPE`; the tile's too-tall mark agrees with the pane.
6. Audience window opened from a browser tab: before `popup,width=1280,height=720`; after half the screen's available width, 16:9.
7. PDF export: 960 by 540 pt per page, as before; each slide whole on its page.
8. Rice theme at a 1280 px frame: title 51.69 px, chip text 10 px.
9. Chips, tags and tables outside a slide: unchanged px.

## Anything wrong in the brief

- Its rules on C7 and verify 4 printed lines outside every slide; ruled above.
- `screen/shape.ts` on the path list was not made: the approved plan put the constants in `model-deck.ts`.

## Risks, unverified (the look checks them)

- Text rendering is not exactly linear in size, so a slide on the edge of fitting may get a different factor or verdict in a small tile than in the pane (C4, C5).
- The probe's 1% drift: a font or text-size change smaller than 1% of the probe's size starts no new layout.
- A slide mounted while its frame has no width does not lay out until the probe sees a size, so one extra layout runs once the frame is drawn.

## Doc text

G32 (`agents/guarded.md:279-281`) names the test 'places the member decks of a group with every slide of their files, counts them and reads their summary rows' by title; the C2 row is inside that test and its title is unchanged, so G32's line is still true.

G13's line, as `grep -n "Test:" .scratch/migration/agents/guarded.md | awk -F: '$1==257'` prints it:

```
257:  Test: `catalog/agents.ts`: `tests/data/sources/agents-catalog.test.ts`, 'refuses a value that would read as an option, or holds whitespace or a control character, or a confirm that is neither true nor false'; `catalog/nesting.ts`: `tests/data/helpers/files/nesting.test.ts`, 'says each dropped pattern in the sentence of its kind, on its own key'; `catalog/options.ts`: `tests/data/sources/config/catalog/options.test.ts`, 'answers an empty catalog for %j', 'names the key of each entry it cannot read and reads its control as text' and 'refuses holds: lists on a family of record fields and keeps it on a key/value family'; `languages.ts`: `tests/data/sources/config/languages.test.ts`, 'reports a language whose value is not a list, and keeps reading the others'; `local.ts`: `tests/data/sources/config/local/local.test.ts`, describe of `checkLocal`; the `literature:` block of `local.yml`: `tests/data/sources/config/local/local.test.ts`, 'keeps the good keys when one is wrong', 'warns of an unknown key only when asked, and loadMachine asks every call' and 'words each problem against local.yml with no value of the file in it'; `rail.ts`: `tests/data/sources/config/rail.test.ts`, 'words each problem of the list against the arrangements and glyphs it holds'; `settings.ts`: `tests/data/sources/config/settings/settings.test.ts` and `tests/data/sources/config/settings/writing.test.ts`, one case per setting reader, the `latex.texlab_path`, `latex.unimath_symbols` and `latex.includegraphics_preview` rows of 'answers the default for a wrong %s and names the key' in `writing.test.ts` among them, and describe 'frameSetting', 'reads the frame a workspace sets' and 'answers the default for a wrong defaults.frame.%s and names the key' in `settings.test.ts`; the other readers: `tests/checks/config/config.test.ts` and `config-folder.test.ts`; `literature.*` settings: `tests/data/sources/config/settings/settings.test.ts`, 'answers the written values, and the default with the key named for each wrong value or a block that is no map'; `.oculus/cpp.yml`: `tests/server/machine/lsp/adapters/cpp-file.test.ts`, describe '.oculus/cpp.yml', the rows 'skips an entry with <input> and reads the entries after it'; `lsp` of `local.yml`: `tests/data/sources/config/local/local.test.ts`, 'answers %j with the sentence it would throw', the row `lsp: 3`; `format_on_save` of `behavior.yml`: `tests/checks/config/config.test.ts`, 'words each wrong setting against behavior.yml from the catalog, and nothing for the shipped files'; the whole-file shapes: `tests/checks/config/config-folder.test.ts`, 'words a part of %s its shape refuses', and `tests/data/sources/config/catalog/options.test.ts`, 'names a key an entry does not take, and leaves a control to optionFindings'; the workspace file's `settings:`: `tests/data/sources/config/workspace-layer.test.ts`, describe 'the workspace layer of loadConfig', every row; the per-oculus paths the primary hub names: `tests/server/files/workspace/per-oculus.test.ts`, every row; the workspace file's entries: `tests/data/hubs/hub-folders.test.ts`, every row, and `tests/data/hubs/workspace-findings.test.ts`, every row; `scan:` and `new_project_dir:`: `tests/data/sources/scan.test.ts`, describe 'a wrong scan or new_project_dir value', table 'refuses $name with a finding naming the key'; `tests/data/sources/config/settings/settings.test.ts`, describe 'appsSettings', every row; the folder depth: `tests/data/hubs/hub-folders.test.ts`, the rows of 'reads a repository_scan_depth of' (-1, 0, 2) and 'gives a finding naming the entry for a repository_scan_depth of %s and leaves the folder with none' (abc, -2, 2.5, true, [1]); the files a hub names: `tests/data/sources/manifests/manifests.test.ts`, describe 'a hub reports only the files its own configuration names': 'raises no finding for a registry, collection or deck it inherits and does not hold', 'raises the finding for a registry its own collections list names and does not hold', 'reads a registry from the collections entry that names it and leaves the others unnamed', 'reads the first of two collections entries for one key and names the key in a finding'; a feed named by the collections list: `tests/data/sources/manifests/manifests.test.ts`, 'reads a feed from the collections entry that names it, as no collection, and finds a named file that is not there'; the commit message's account: `tests/data/sources/config/local/machine.test.ts`, describe 'commit_message_account', every row of 'takes $name as the run account or as a finding'; the machine's port read at start: `tests/data/sources/config/local/wrong-port-default.test.ts`, describe 'a port that is not a number', 'is the default the server was started with, and its problem is kept' and 'leaves a port that reads in force'; the code theme lists: `tests/checks/config/config.test.ts`, 'names a code_themes.vscode that is no list, and each row with no class, a repeated class, tokens or a class with no rules' and 'names a code_themes.shiki that is no list, and each row with no id, a repeated id or an id Shiki does not bundle'; a collections entry's `ticker:` and `dissemination_skip:`: `tests/data/sources/config/catalog/options-schema.test.ts`, describe 'the schema of a collections entry', every row; `tests/data/sources/config/catalog/options.test.ts`, 'keeps holds: record only on a family field with no key field'; `tests/server/edit/config-value.test.ts`, describe "an entry's ticker and skip written into the hub's list", every row; the rail's `unplaced_collections`: `tests/data/sources/config/rail.test.ts`, 'words a rail with no entry flagged unplaced_collections, and reads no group from it', 'words a rail with two entries flagged, and reads the first', 'words a flag that is not true or false, and keeps the button without it', "reads oculus's rail as one flagged entry, Registries, with no finding"; the rail's `project_boards`: `tests/data/sources/config/rail.test.ts`, "case 4: reads oculus's rail as one entry carrying project_boards, Projects", 'case 4: words a rail with no entry carrying project_boards, and reads no group from it', 'case 4: words a rail with two entries carrying project_boards, and reads the first', 'words a project_boards that is not true or false, and keeps the button without it'; the words of `catalogs/vocab.yml` past its shape (`vocabFindings` in `src/lib/data/sources/config/sections/vocab.ts`): `tests/data/shapes/catalog-files/vocab.test.ts`, every row of describe "the vocabulary's words past its shape", and for a hub that is not the primary, run by `readOtherHub` in `src/lib/data/index.ts` when its settings file sets a key of `catalogs/vocab.yml`, every row of describe 'the vocabulary words of a hub that is not the primary'; `slurm.resource`: `tests/data/sources/config/settings/settings.test.ts`, describe 'slurmSettings', 'reads a resource of %s to its clusters and its findings' (one text, a number, a key named twice, the key of this Mac, two keys), 'answers an empty resource as no cluster, with no problem'; `tests/checks/config/config.test.ts`, describe 'settingFindings', 'words each wrong setting against behavior.yml from the catalog, and nothing for the shipped files' (the line 'slurm.resource: slurm.resource must be a list of words; the default is used'), 'reads an empty slurm.resource as no cluster, with no finding'; `clusters:`: `tests/data/sources/config/local/local.test.ts`, describe 'clusters', 'reads the user name and the key file of each row, ~/ resolved, a field left out absent (G13)', 'leaves out a row with %s, with a problem naming the row and the field (G13)', 'uses the first of two rows of one cluster, naming the second, and names a value that is no list (G13)'; `tests/data/sources/config/local/machine.test.ts`, describe 'the cluster accounts', "are joined over every hub, the primary hub's row of a cluster used and the other hub's named (G13)"; `clusters.key_type` and `clusters.key_file`: `tests/data/hubs/connection-keys.test.ts`, describe 'clusterKeySettings', 'reads %s, the default with the key named for a wrong value (G13)'; `connections.failures`: same file, describe 'failureRows', 'reads %s in order, naming the key of each row it leaves out (G13)'; `sign_in`: same file, describe 'signInRows', 'reads %s, naming the row and the field it does not read (G13)'; a connection key in a hub other than the primary: same file, describe 'the connection keys of a hub that is not the primary', 'are each a finding naming the key and the hub, and a key each hub reads from its own file is none (G13)'; a `clusters:` row of the resource `mac`: `tests/data/sources/config/local/local.test.ts`, the row 'the resource mac, which names this Mac' of 'leaves out a row with %s, with a problem naming the row and the field (G13)', and 'says that the resource mac names this Mac (G13)'; the connection a `connections.failures` row reads: `tests/data/hubs/connection-keys.test.ts`, the rows 'a row for the cluster alone', 'a row for git alone', 'a row for a connection that is none' and 'a row for no connection' of 'reads %s in order, naming the key of each row it leaves out (G13)'; the user check: `tests/data/sources/config/local/local.test.ts`, describe 'a downloads row a reader row signs in to with a user', every row; `catalog/options.ts` descriptions: `tests/data/sources/config/catalog/options.test.ts`, 'reads a described_by field as the record it names, and one record of it with holds: record'; the control word `scalar`: `tests/data/sources/config/catalog/options-schema.test.ts`, describe "the schema of a reader row's constant value, a scalar", every row; a `multi` value in the editor held to the words and the form the value rule takes: same file, describe 'the schema of a multi', every row; a keyed family in the editor held to the form its reader takes (`familySchema` and `heldToForm` of `catalog/schemas/options.ts`): same file, describe 'the schema of a keyed family', every row; the cluster pick: `tests/state/system/settings/cluster-rows.test.ts`, describes "the cluster a row of This machine's clusters: is for" and 'the clusters that have a row, as the choice reads them from the setup and the draft', every row. The table of `tests/data/hubs/connection-keys.test.ts`, describe 'clusterKeySettings', 'reads %s, the default with the key named for a wrong value (G13)', expects oculus's shipped `ed25519` and `~/.ssh/id_{type}_{resource}`.
```

Its replacement is the same line with one span changed and every other byte kept. The span, as `sed -n 257p .scratch/migration/agents/guarded.md | grep -o "..."` finds it once:

```
in `writing.test.ts` among them, and describe 'frameSetting', 'reads the frame a workspace sets' and 'answers the default for a wrong defaults.frame.%s and names the key' in `settings.test.ts`; the other readers:
```

becomes:

```
in `writing.test.ts` among them; the other readers:
```

## Repair round 1

NOT done: nothing of items 1 to 4 is left undone. One place is handed back unchanged in behaviour for the orchestrator to rule on, and no page was run, so every drawn result below is by reading and belongs to the look.

Handed back, by the rule of the round's launch message that a place where a named shape does not hold is changed no further and named:

- The solid lines inside a slide when the print route is printed from a browser tab. Place: `src/routes/present/print/+page.svelte:167` calls `window.print()` when there is no host. Reason: the lines inside a slide are now `box-shadow: inset ...`, and a browser's print dialog can drop a box shadow when its "Background graphics" option is off, which a `border` was not subject to. `git grep -nE "print-color-adjust|printBackground" -- src` prints only `src/desktop/windows/print.ts:76`, `printToPDF({ preferCSSPageSize: true, printBackground: true })`, so the app's own PDF export asks for backgrounds and is not at this risk. The browser-tab print sets no `print-color-adjust`. Not verified: no page was run. The dashed lines are outlines and are not affected. Recommendation (a judgment): one declaration, `print-color-adjust: exact`, on the print route's `.frame`, which also prints the slide's fills in that dialog, the reason it is the orchestrator's to rule and not added here.

### Item 1, a hairline inside a slide takes no room

C16's first run, before any change of this round, `grep -rnE "border(-top|-bottom)?: *1px" src/lib/themes/slide.css src/lib/views/academic/present/Slide.svelte src/lib/views/academic/present/Panel.svelte src/lib/views/academic/present/parts src/lib/views/academic/present/screen src/routes/present/print`, 18 lines, exit 0:

```
src/lib/views/academic/present/Panel.svelte:112:        border: 1px solid var(--line);
src/lib/views/academic/present/Panel.svelte:120:        border: 1px dashed var(--line);
src/lib/views/academic/present/Panel.svelte:129:        border: 1px solid var(--line);
src/lib/views/academic/present/Panel.svelte:145:        border: 1px solid var(--line);
src/lib/views/academic/present/Panel.svelte:187:        border: 1px dashed var(--line);
src/lib/views/academic/present/parts/Equation.svelte:48:        border: 1px solid var(--line);
src/lib/themes/slide.css:45:    border: 1px solid var(--line);
src/lib/views/academic/present/parts/Words.svelte:56:        border: 1px dashed var(--line);
src/lib/views/academic/present/parts/Words.svelte:70:        border: 1px solid var(--line);
src/lib/views/academic/present/parts/Section.svelte:76:        border: 1px solid var(--line);
src/lib/views/academic/present/parts/Grid.svelte:86:        border: 1px solid var(--line);
src/lib/views/academic/present/parts/Grid.svelte:113:        border: 1px solid var(--line);
src/lib/views/academic/present/parts/Plain.svelte:105:        border: 1px solid var(--line);
src/lib/views/academic/present/parts/Plain.svelte:118:        border: 1px dashed var(--line);
src/lib/views/academic/present/parts/project/Facts.svelte:164:        border-top: 1px solid color-mix(in srgb, var(--muted-txt, var(--muted)) 50%, var(--line));
src/lib/views/academic/present/parts/project/Project.svelte:246:        border: 1px solid var(--line);
src/lib/views/academic/present/parts/project/Project.svelte:312:        border: 1px solid var(--tone, var(--line));
src/lib/views/academic/present/parts/project/Project.svelte:326:        border-top: 1px dashed var(--line);
```

C16's last run, the same command, one line, the `border-top` of the one `::before` of item 1:

```
src/lib/views/academic/present/parts/project/Project.svelte:337:        border-top: 1px dashed var(--line);
```

What changed, by kind of line:

- A solid line on all four sides is `box-shadow: inset 0 0 0 1px C`: `themes/slide.css:45`, `Panel.svelte` `.fig`, `.diagram`, `.explain`, `parts/Equation.svelte`, `parts/Grid.svelte` (two), `parts/Plain.svelte` `.figure`, `parts/Section.svelte`, `parts/project/Project.svelte` `.spec` and `.eli5` (the latter in `var(--tone, var(--line))`).
- A dashed line on all four sides is `outline: 1px dashed C; outline-offset: -1px`: `Panel.svelte` `.gap` and `.dbar`, `parts/Plain.svelte`, `parts/Words.svelte`.
- A solid line on one edge is `box-shadow: inset 0 1px 0 0 C`: `parts/project/Facts.svelte:164`.
- A dashed line on one edge is the `::before` of `.e5 + .e5` in `parts/project/Project.svelte`, the element `position: relative`.
- The cells of a Markdown table, `parts/Words.svelte`: each cell `inset -1px -1px 0 0 var(--line)`, the table `inset 1px 1px 0 0 var(--line)`.
- `screen/Stage.svelte` `.frame.bare` and the print route's `.frame` draw no line (`box-shadow: none`).
- `src/lib/ui/controls/Chip.svelte`: the states set `--chip-line`, the base rule reads it in `border: 1px solid var(--chip-line)`, and one rule `:global(.slide-frame) .chip` takes `border-width: 0` and `box-shadow: inset 0 0 0 1px var(--chip-line)`. The rice brackets rule adds `box-shadow: none`, since it has the higher specificity and a chip there draws no line.
- `src/lib/ui/display/table/Table.svelte`: one rule `:global(.slide-frame) th, td` with `border-bottom-width: 0` and `box-shadow: inset 0 -1px 0 0 var(--line)`.
- The `border-left` bars in `cqw` of `Project.svelte` and the `.dnode` border in `cqw` of `Panel.svelte` are fractions and stay.
- The read over the slide folders, `grep -rnE "(border[a-z-]*|outline[a-z-]*|box-shadow): *.*[0-9]px"` on the C16 paths, prints only the lines above.

The code that counted a border is gone: `measure` in `screen/Stage.svelte` (the inner height is the box's height), `sides` in `Slide.svelte` (paddings only), `frameOf` in `screen/drawn-slide.ts` (paddings only). The comments that named a border those no longer have are rewritten and rewrapped: the heads of `slide.css`, `Stage.svelte`, the print route, `Panel.svelte`, `parts/Plain.svelte` and `parts/project/Project.svelte`, the head and the doc of `frameOf` in `drawn-slide.ts`, the `frame` doc in `screen/slide-layout.ts`, and the "no border and no corner" comments of `Stage.svelte`, `screen/Framed.svelte` and `Present.svelte`, which say "no line and no corner".

### Item 2

`src/lib/views/system/findings/Findings.svelte:26` says "its frame" and `src/lib/state/workbench/navigation/status.ts` says "their frame"; each comment paragraph is rewrapped at 100 columns.

### Item 3

The head paragraph and the foot paragraph of `Slide.svelte` are rewrapped at 100 columns.

### Item 4, the report

`npm run test:quick` ran four times before this round, read off the Bash calls of this agent's transcript: one run printed "every command passed"; one had a file edited during it and failed `vitest checks` and `vitest slow`; one failed `vitest` and `vitest slow` on six per-test timeouts; one failed `vitest` on three per-test timeouts. It ran once in this round.

C2's case-run program, `.agents/scratch/c2-first.ts`, run as `node --experimental-strip-types .agents/scratch/c2-first.ts $PWD/../O171-base $PWD/.agents/scratch` with the same arguments for the worktree (`$PWD`), the ExperimentalWarning lines filtered out:

```ts
// Case-run program of C2: prints the deck reader's answer for a deck that holds a `frame:`, on the
// tree named by the first argument, planting the deck under the folder named by the second.
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2];
const scratch = process.argv[3];
const config = await import(join(root, 'src/lib/data/sources/config.ts'));
const { createReader } = await import(join(root, 'src/lib/data/sources/deck/read.ts'));
const { deckOrderOf } = await import(join(root, 'src/lib/data/shapes/boards/order.ts'));
const { folderGlobs } = await import(join(root, 'src/lib/data/sources/documents/folder-globs.ts'));
const VOCAB = config.loadConfig(config.engineDir()).config;
const dir = mkdtempSync(join(scratch, 'c2-'));
mkdirSync(join(dir, 'deck'));
writeFileSync(
    join(dir, 'deck/present.yml'),
    'deck: { title: Square, frame: { width: 1000, height: 1000 } }\norder: [one.md]\n'
);
writeFileSync(join(dir, 'deck/one.md'), '# One\n\nText.\n');
const context: Record<string, unknown> = {
    hub: { key: 'hub', dir },
    projects: [],
    tagTones: {},
    catalog: config.textCatalog(VOCAB),
    order: deckOrderOf(VOCAB),
    globs: folderGlobs()
};
if ('frameSetting' in config) context.frame = config.frameSetting(VOCAB);
const deck = createReader(context).read({ key: 'hub', dir }, 'deck');
console.log(
    'C2 deck.frame:',
    JSON.stringify(deck.frame),
    '| has frame key:',
    Object.hasOwn(deck, 'frame')
);
console.log(
    'C2 findings:',
    JSON.stringify(deck.findings.map((one: { key: string; message: string }) => [one.key, one.message]))
);
```

Output on the base copy `.agents/worktrees/O171-base`:

```
C2 deck.frame: {"width":1000,"height":1000} | has frame key: true
C2 findings: []
```

Output on the worktree:

```
C2 deck.frame: undefined | has frame key: false
C2 findings: []
```

The program and the whole of `.agents/scratch` are deleted (`rm -rf` of its absolute path; `ls -a .agents` shows no `scratch`).

### Verify

| Check | Command | Result |
| --- | --- | --- |
| 1 | `npm run test:quick`, TMPDIR unset, once, nothing edited during it | exit 0, `test:quick: 448.4 s; every command passed`: prettier, ASCII gate, svelte-kit sync, eslint, svelte-check (0 errors, 0 warnings), vitest checks, vitest, vitest slow. Not covered, as it prints: tests that reach no changed file within the import depth, the build, the lint of unchanged files. |
| diagrams | `npm run diagrams` | not run this round: no import changed. |
| 2 | ASCII perl gate over the modified files with the two added paths | prints nothing. |
| 3 | `git grep -n "deck\.frame\|defaults\.frame\|frameSetting\|deckFrame\|DeckFrame\|FrameSetting\|wholeFrame\|featuresFrame" -- src config docs tests ':!config/local.yml'` | prints nothing, exit 1. |
| 4 | `git grep -nE "frame's own px\|1150 px\|1040 px\|1280 by 720\|in px" -- <the brief's paths>` | one line, `src/routes/present/show/+page.svelte:68`, the screen tolerance of the round 0 ruling. |
| 5 | `sh utils/unused-exports.sh`, `diff` with `O171-base/unused-exports.txt` | no difference, exit 0. |
| 6 | the C7 grep | below. |
| 7 | changed tests | `find src tests config docs -type f -newer` the last log of round 0 names no test file: this round changes no test. |
| 8 | `grep -n -iE "sentence\|list item" .scratch/migration/agents/spec.md` | no list-item or sentence-length rule; line 45 is the rewrap rule, followed. |
| C16 | above | one line. |

The C7 grep, `git grep -nE "[0-9]px|px\`|px'|}px"` over the C16 paths, prints these kinds of line and no other:

- One-pixel shadows, `box-shadow: inset ... 1px ...`: `slide.css:45`, `Panel.svelte:112, :130, :146`, `parts/Equation.svelte:48`, `parts/Grid.svelte:86, :113`, `parts/Plain.svelte:106`, `parts/Section.svelte:76`, `parts/Words.svelte:68, :74`, `parts/project/Facts.svelte:164`, `parts/project/Project.svelte:247, :313`.
- One-pixel outlines with their offset: `Panel.svelte:120-121, :188-189`, `parts/Plain.svelte:119-120`, `parts/Words.svelte:56-57`.
- The one `::before` rule: `parts/project/Project.svelte:337`.
- The 1px screen-reader copy: `parts/project/Facts.svelte:197-198`, ruled in round 0.
- `src/routes/present/print/+page.svelte:234`, `.failed`, outside every slide, ruled in round 0.

Other checks:

- Names: `git grep -nE "padding and border|deck's frame|borderTop|borderBottom|borderLeftWidth|borderRightWidth|hairline border|border transparent|no border and no corner|keeps its border" -- src docs tests` prints eight lines, none in the step's slide code: `PaneView.svelte:506`, `themes.css:51`, `latex-widget.ts:60, :67`, `Card.svelte:199`, `Band.svelte:265`, `CardActions.svelte:112-113`, each about its own box outside a slide.
- History words over the comments this step adds: the grep prints six lines, each a run-time sense and none a history word: "a new window", "before that answer", "with no new layout", "before the slide is laid out again", "in a new tab", "was laid out ... its new size".
- Sizes (`wc -l`, the round's files): `Slide.svelte` 487 and `Present.svelte` 472 against 520 per component, `status.ts` 684 against 880. This round adds no file, so no folder count changes.

The round's source files, from `find src tests config docs -type f -newer` the last log of round 0: `status.ts`, `themes/slide.css`, `ui/controls/Chip.svelte`, `ui/display/table/Table.svelte`, `Panel.svelte`, `Present.svelte`, `Slide.svelte`, `parts/Equation.svelte`, `parts/Grid.svelte`, `parts/Plain.svelte`, `parts/Section.svelte`, `parts/Words.svelte`, `parts/project/Facts.svelte`, `parts/project/Project.svelte`, `screen/drawn-slide.ts`, `screen/Framed.svelte`, `screen/slide-layout.ts`, `screen/Stage.svelte`, `Findings.svelte`, `routes/present/print/+page.svelte`.

### Judgment call

`Table.svelte` holds three rules inside a slide where the round names one. Under the rice theme a table's `td` draws a dotted bottom line (`:global(body.rice) td`), which a solid inset shadow cannot draw, and the brief's decision that the conversion keeps today's look applies. The extra rules are the round's shape for a broken line on one edge: `:global(body.rice .slide-frame) td` takes `position: relative; box-shadow: none` and its `::before` lies over the cell's bottom edge with `border-top: 1px dotted var(--line)`. This is the one 1px border under a slide besides `Project.svelte`'s, and C16 does not list it because it is in `Table.svelte`, outside C16's paths.

### Before and after (what the look reads against)

- The frame's inner box grows by 2 px at a 1280 px frame, and each line inside a slide gives its pixel back, so a slide gets a little more room and a slide near the edge of fitting can move a factor.
- Lines look the same: one pixel wide in the same colour and the same dash.
- A chip inside a slide is one pixel lower: at a 1280 px frame with its words at 11 px it was 19 px tall (11 line, 6 padding, 2 border) and is 18 px, its `min-height`. That is arithmetic from the rule in `Chip.svelte`, not a measurement. Outside a slide a chip and a table are unchanged.

### Risks, not verified (no page was run; the look checks them)

- The print-from-a-browser-tab case at the head of this section.
- Content scrolled in `Panel.svelte` `.diagram` and `parts/Equation.svelte` (both `overflow-x: auto`) can paint over the inset line, which a border would have stayed outside of.
- A figure's line on an `<img>` is an inset shadow, which lies under the image's content and shows only in the image's padding. The padding is 0.46875cqw, one pixel or more from a frame 213 px wide; on a narrower tile the image covers part of the line.
- A Markdown table's top and left lines are an inset shadow on the `table` element: a cell with a background of its own would cover it. `parts/Words.svelte` gives its cells none.
