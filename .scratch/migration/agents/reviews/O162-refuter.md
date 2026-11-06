O162 review: the arrow-keys hint removed. Worktree /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O162, base 8a423feb3. I changed nothing and wrote no file in the worktree. Two scratch files are in my session scratchpad: /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o162-unused.txt and /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o162-added.txt.

Verdict: every item holds and every case is met. There are no findings under Spec, Proof, Standards or Behaviour. On-screen confirmation of C1 to C4 and C7 is still the orchestrator's look at landing.

## Verification lines, verbatim

1. `npm run test:quick`, run once from the worktree root:
```
test:quick: 16 changed file(s), from git since HEAD
test:quick: 11 test file(s)
        tests/data/hubs/decks.test.ts: named for a changed file
        tests/data/sources/present.test.ts: named for a changed file
        tests/checks/source/catalog-file-keys.test.ts: scans the source text of a changed file
        tests/checks/source/comment-width.test.ts: scans the source text of a changed file
        tests/checks/source/history.test.ts: scans the source text of a changed file
        tests/checks/source/html-sites.test.ts: scans the source text of a changed file
        tests/checks/source/keys.test.ts: scans the source text of a changed file
        tests/checks/source/strip-types.test.ts: scans the source text of a changed file
        tests/checks/tree/boundaries.test.ts: scans the source text of a changed file
        tests/checks/tree/duplication.test.ts: scans the source text of a changed file
        tests/checks/tree/size.test.ts: scans the source text of a changed file
ok      prettier (1.0 s): All matched files use Prettier code style!
ok      ASCII gate (1.1 s)
ok      svelte-kit sync (2.5 s)
ok      eslint (2.8 s)
ok      svelte-check (11.8 s): 1793993118277 COMPLETED 584 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (18.4 s): Duration  4.66s (transform 3.64s, setup 0ms, import 7.57s, tests 722ms, environment 1ms)
ok      vitest slow (23.1 s): Duration  9.29s (transform 2.50s, setup 0ms, import 4.11s, tests 5.01s, environment 0ms)
ok      vitest checks (47.6 s): Duration  33.65s (transform 14.12s, setup 0ms, import 29.18s, tests 47.58s, environment 2ms)
test:quick: 50.3 s; every command passed
```
- My run counts 16 changed files and the builder's counted 15. The extra file is the untracked report `.scratch/migration/agents/reviews/O162-report.md`, which `git status --short` lists.
- `git status --short` after the run lists the same 16 paths as before it, so the run wrote nothing.

2. The named test files. They were listed with the builder's command, `grep -rl -e "present/Slide" -e "Slide.svelte" -e "Framed" -e "screen/Stage" -e "Stage.svelte" -e "Present.svelte" -e "arrange/Tile" -e "Tile.svelte" -e "Presenter.svelte" -e "present/print" -e "present/show" -e "slide.css" -e "academic/present.yml" -e "decks.md" tests | sort`, which printed `tests/checks/config/config-folder.test.ts`, `tests/server/desktop/window-guard.test.ts` and `tests/server/root/hooks-server.test.ts`. Then `npx vitest run tests/checks/config/config-folder.test.ts tests/checks/tree/size.test.ts tests/server/desktop/window-guard.test.ts tests/server/root/hooks-server.test.ts tests/checks/source/keys.test.ts tests/checks/source/comment-width.test.ts --reporter=dot`:
```
 Test Files  6 passed (6)
      Tests  100 passed | 2 skipped (102)
```

3. The ASCII gate, in the rules file's perl form, over the 15 changed files (the diagrams included), run under bash. It printed nothing: `exit 0`.

4. `wc -l` of the changed files:
```
     151 config/text/views/academic/present.yml
     432 docs/decks.md
     179 docs/diagrams/layer-views.dot
     809 docs/diagrams/layer-views.svg
     101 docs/diagrams/layers.dot
     556 docs/diagrams/layers.svg
      69 src/lib/themes/slide.css
     462 src/lib/views/academic/present/Present.svelte
     495 src/lib/views/academic/present/Slide.svelte
     184 src/lib/views/academic/present/arrange/Tile.svelte
     246 src/lib/views/academic/present/presenter/Presenter.svelte
      51 src/lib/views/academic/present/screen/Framed.svelte
     147 src/lib/views/academic/present/screen/Stage.svelte
     221 src/routes/present/print/+page.svelte
     325 src/routes/present/show/+page.svelte
```
Every component is at or under 520 lines and every other file at or under 880.

5. `sh utils/unused-exports.sh` (exit 0) wrote 334 lines. `diff ../O162-base/unused-exports.txt <that output>` printed nothing (`diff exit 0`), so the step adds no line.

6. The history-word grep:
- Input: every `+` line of `git diff 8a423feb3`, 45 lines (41 under src, config and docs/decks.md, plus 4 diagram lines).
- Command: `grep -n -i -E "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands|O1[0-9][0-9]|20[0-9][0-9]-"`.
- Result: no hit (`grep exit 1`).

7. C5 and C6. These are `grep -rn` runs over the same paths as the brief's `git grep`, as the builder ran them. `git status --short` shows no untracked file under the grepped paths.
```
== C5a   grep -rn -e "key_hint" -e "keys-past" -e 'class="keys"' -e "Arrow keys or Space" src tests docs config/text
(nothing)
== C5b   grep -rn -i -e "key hint" -e "names the keys" src/lib/views/academic/present src/routes/present src/lib/themes/slide.css docs/decks.md docs/HELP.md
(nothing)
== C6a   grep -rn "first={\|{first}" src/lib/views/academic/present src/routes/present
src/lib/views/academic/present/arrange/Overview.svelte:170:                first={run.at === 0}
== C6b   grep -n -w first src/lib/views/academic/present/Slide.svelte src/lib/views/academic/present/screen/Framed.svelte
src/lib/views/academic/present/Slide.svelte:146:    /** The gap between two figures of a block: the bottom margin of the first figure's box. */
```

The brief's premises reproduce on the base copy `O162-base`, with `git show 8a423feb3:docs/decks.md` and `git show 8a423feb3:docs/HELP.md` for the docs:
- C5a prints 7 lines (`Slide.svelte:400,465,467,472,482,516`, `present.yml:82`).
- C5b prints 11 lines (`Stage.svelte:17`, `Framed.svelte:25`, `Slide.svelte:35,66,103,207,471,507`, `show/+page.svelte:6`, `slide.css:14`, `docs/decks.md:166`).
- C6a prints 8 lines (`Present.svelte:419`, `Presenter.svelte:110,122`, `Framed.svelte:52`, `Overview.svelte:170`, `Tile.svelte:115`, `show/+page.svelte:276`, `print/+page.svelte:190`).
- `-w first` prints `Slide.svelte:35,66,67,74,156,464` and `Framed.svelte:25,26,33,52`.
- `wc -l` of the base `Slide.svelte` is 539.
- `docs/HELP.md:199-200` reads `| F / P / O | ...` and `| Space / Shift+Space | ... |`.
- `screen/keys.ts:74-90` handles ArrowRight/ArrowLeft, PageDown/PageUp, Home/End and Space.

## Item verdicts

1. No slide draws the hint: **holds**. The diff removes `{#if first}<p class="keys" bind:this={keys}>{t('present.key_hint')}</p>{/if}`, the `.keys` rule and its comment. C5a prints nothing, and `grep -rn -E '\.keys([^a-zA-Z(]|$)' src --include='*.css' --include='*.svelte'` finds no other selector for it.

2. No room is kept for the hint: **holds**.
- `past`, `keys`, the measure, the `flushSync()` after it, `style:--keys-past` and `padding-bottom: var(--keys-past, 0px)` are gone.
- `Slide.svelte:197-198` now reads `const kept = foot === null ? 0 : tall(foot);` and `const above = inner - kept;`.
- `grep -rn -w -e past -e keys Slide.svelte` prints only `:27` and `:259`, both prose of other comments.
- The new `.reading` comment (`:447-449`) matches the rule: `position: relative` (the probe at top-left), flex column, `max-width: var(--slide-reading)`, `min-height: 100%`, `margin-inline: auto`.

3. The probe still measures: **holds**.
- `Slide.svelte:443` reads `<span class="probe" aria-hidden="true" bind:this={probe}>Mg</span>`.
- The `.probe` rule (`:484-494`, `font-size: var(--slide-fs-body)`) is unchanged. The effect (`:357-378`) is unchanged except its comment.
- The reasoning that re-layout timing is kept is under Proof.

4. The `first` prop is gone: **holds**. It is removed from both Props types and both destructurings, and from all six callers (diff hunks in `Present.svelte:419`, `Tile.svelte:115`, `Presenter.svelte:110,122`, `print/+page.svelte:190`, `show/+page.svelte:276`). C6 prints only `Overview.svelte:170` and the figure-box comment. In `Present.svelte`, `at` is still read at `:175,333,409`, so nothing is left unused.

5. The words: **holds**.
- `key_hint` is gone from `present.yml`. `grep -rln "present.key_hint\|key_hint" src tests docs config README.md --exclude=local.yml` prints nothing.
- The head comments and `slide.css` no longer name the hint: Slide `:30-35`, Stage `:14-23`, show `:2-10`, slide.css `:10-15`.
- The `decks.md:166` diff removes exactly the hint sentence and nothing else.
- I re-read each new sentence against the code and each is true.
- Rewrapping: every line of those paragraphs is between 85 and 100 columns except each paragraph's last line (measured with `awk length`). `comment-width.test.ts` passed.

6. Nothing else changes: **holds**.
- `git diff 8a423feb3 --stat` lists only the 11 write-list paths plus the four diagram files.
- The search, foot, strip, Facts and Stage measure code is untouched apart from the comment.
- `docs/HELP.md` is unchanged: `git status --short docs/HELP.md` prints nothing, and the diff has no HELP.md line, so open item 706 is left to Axel.

## Case verdicts

- **C1, met by reading.** `Present.svelte:419` passes no `first`, and `Slide.svelte` draws no paragraph under the content (`:436-443`: only the foot and the probe). This applies to both the framed and the `bare={full}` pane, since they are one `Framed`. On-screen confirmation is the look.
- **C2, met by reading.** `above = inner - kept` on every surface. The pane and the tile both go through `Framed` and `Stage`, and a bare frame keeps its border transparent (`Stage.svelte:118-121`), so the inner box and the room are the same. The factor search then gets the same input. The look confirms the factor on screen.
- **C3, met by reading.** The triggers are unchanged:
  - the effect on `[row, deck.frame, held]`;
  - the image load and error captures;
  - the probe's ResizeObserver;
  - `document.fonts` `loadingdone`.
  The probe still changes size with `--text-scale` and the theme's design sizes (`slide.css:34-41`, `63-69`). A pane shown from `display: none` takes the probe from 0 to a size. Detail is under Proof.
- **C4, met by reading.** These surfaces passed `first={false}`, so `keys` was null and `past` stayed 0. Their old path was the new one plus a `flushSync()` with no write of its own before it (a no-op, see Proof) and a different probe text. Nothing they draw changes.
- **C5, met.** Both greps print nothing (quoted above, `grep -rn` form).
- **C6, met.** It prints exactly the two lines the brief allows (quoted above).
- **C7, met by reading.** `padding-bottom: var(--keys-past, 0px)` is gone from `.reading`, and `.foot { margin-top: auto }` (`:475-477`) puts the strip at the column's foot on every surface alike. The look confirms the height on screen.

## Spec

None.
- The diagram changes (`layer-views.dot/.svg` 93 to 92, `layers.dot/.svg` 1566 to 1565) are generated by `npm run diagrams`, which `spec.md:26` runs before the verify list, and the report marks them outside the write list with that reason. The change matches the code: counting `from '$lib/state...'` imports with `grep -rhoE` gives 135 to 134 under `views/academic` and 2074 to 2073 under `views` (base copy against worktree), a drop of one, the same delta as the diagrams.
- The removed `import { t }` follows from items 1 and 3. Its only two calls in the base were `Slide.svelte:465,467` (`grep -n "\bt("` on the base copy), so an unused import would otherwise remain.
- The report gives the first run of every case (C1 to C7) on the unchanged tree.
- No dependency is added. `docs/HELP.md` is unchanged.

## Proof

None. Two points were read in the code:

**Removing the `flushSync()` after the measure.**
- The old `Slide.svelte:207-212` wrote `past`, then called `flushSync()`, then read `kept = tall(foot)`. The flush existed to apply `--keys-past` (the padding on `.reading`) before the foot and the content were measured.
- On every surface but the pane's first slide, `past` was 0 and assigning 0 again marks nothing dirty. There the flush only applied updates already pending from elsewhere.
- Every entry to `layOutSlide` comes after Svelte's flush:
  - the microtask the first effect queues from inside its flush (`:349`);
  - an image load or error event;
  - a ResizeObserver callback, which runs in the rendering step after microtasks;
  - `loadingdone`, an event.
- The only state read before the next `flushSync()` at `:208` is the foot. Its DOM follows `held`, which is in the first effect's snapshot (`:344`), and `facts`, whose toggle keeps the strip's room.
- A `flushSync()` only applies pending DOM updates and schedules no layout. Removing it cannot add or drop a re-layout, nor change `kept` or `inner`.

**The probe holding `Mg`.**
- Old: the probe was `white-space: nowrap; max-width: 100%; overflow: hidden` holding the hint, about 120 characters at 24 px times text size. That is wider than the reading column, so the probe's width was the column's width and its height one line of body type.
- New: the width is the two letters' width and the height is the same single line. The height signal, which follows `--slide-fs-body` and therefore the text size and rice's design sizes, is identical. The width now also follows the font size and the font's metrics, so the probe is at least as sensitive as before.
- The one signal the old clamped width carried that `Mg` does not is a change of the column's width. That width depends only on `deck.frame.width`, the fixed 64 px padding and 1 px border of `.slide-frame`, and `--slide-reading: 1040px`, declared once in `slide.css:25`. `grep -rn -e "--slide-reading" -e "slide-frame" src config` finds no other declaration, and the print route's `.page` (`:200-205`) changes no padding. `deck.frame` is already in the first effect's snapshot.
- Scaling is by `transform: scale()` (`Stage.svelte:91`), which changes no `offsetWidth`, so neither probe ever saw the pane's own size.
- Theme change: a change of font family changes `Mg`'s width or its line height, and a colour-only theme needs no re-layout, before and after alike.
- Hidden pane brought to the front: the size goes from 0 to a size in both versions.
- Font that loads late: `loadingdone` is independent of the probe, and `M` and `g` are in the same basic Latin range as the hint's letters, so a subset font is fetched for both alike.

## Standards

None.
- The ASCII gate is clean.
- No history words in the added lines (verify 6).
- Comments are rewrapped at 100 columns.
- Sizes are within the limits.
- prettier, eslint and svelte-check are clean.
- The orphan-key check (`keys.test.ts`) passed with `key_hint` removed.
- I grepped each removed name across src, docs and config (`--exclude=local.yml`): `key_hint`, `keys-past`, `keyHint`, "key hint", "names the keys", "keys under", "first slide", "deck's first" and "arrow keys". None leaves a false sentence. The remaining hits are about other things:
  - `Present.svelte:15` says the arrow keys move through the deck, which is still true per `keys.ts:76-81`;
  - `present.ts:100,330,336` and `filter.svelte.ts:24,57` are about the slide index;
  - the `.hint` classes of Title, Section, Summary and Grid are slide parts;
  - the rest are other maps.
- The probe's literal `Mg` is hidden and `aria-hidden`, taken by the brief's Decision 1. `html-sites` and `catalog-file-keys` passed.

## Behaviour

None. The report's before-and-after section covers every user-visible change:
- the line under the first slide in the pane, framed and full screen;
- the room in the narrow frame at text size 1.6, and the Too tall agreement with the tile;
- the facts strip's height on a first project slide;
- no change on the presenter screen, the audience window, the tiles and the PDF;
- Help unchanged, with the arrow keys, Page Up / Page Down and Home / End named nowhere (open item 706).

The paragraph removed was visible text, and a screen reader read it too. Its removal is the same change as the first bullet.

## Declined to judge

- **Git commands quoted in the report that I did not run.** These are git forms other than my three: `git diff -U0 -- src config docs/decks.md` (Verify 6), `git diff --numstat` (item 6 and the file table), and `git diff src/lib/views/academic/present/Slide.svelte` (item 1). In their place I used `git diff 8a423feb3` piped to the same grep: 45 added lines, 41 outside the diagrams, matching the report's 41. For the file list I used `diff -rq` against the base copy, which lists the same 10 src and config files as the report.
- **Git forms I ran with extra arguments.** I ran two variants of the permitted read commands: `git diff 8a423feb3 --stat` and `git status --short docs/HELP.md`.
- **The claim that `npm run diagrams` ran right before the verify list.** I cannot verify it without running the generator, which writes into the worktree. The diagram counts agree with the import-count delta above.
- **A hub workspace's `settings.text.present.key_hint` override.** Whether one exists, and would now read as an unknown text key, needs a read of a research hub, which this review may not touch. The test fixtures hold none: the C5a grep over `tests` prints nothing.
- **The on-screen look.** C1 to C4 and C7 on screen are the orchestrator's look at landing. I started no server and opened no page.
- **The builder's timings.** I did not compare them; my `test:quick` run is the one quoted above.

Usage: ae429b8f2a3648ec4, claude-opus-5-5, 184967 tokens, 35 tool uses, 8.2 min
