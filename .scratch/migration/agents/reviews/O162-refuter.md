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

## Repair round 1, refuted

O162 review over repair round 1. Worktree /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O162, base 8a423feb3, snapshot /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O162-round-1. I changed no file in any worktree. My scratch files are /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o162r1-unused.txt, /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o162r1-status-before.txt and /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o162r1-oi.txt.

Verdict: every item holds and every case is met by reading. There is one low-severity Proof finding, P1: the report's file table leaves out docs/HELP.md. It can be fixed at landing. Spec, Standards and Behaviour have no findings.

## The round's delta

- I ran `diff -u` between the snapshot and the worktree for each of the 15 paths in `files.txt`. Every one exits 0, so none changed in the round.
- `git status --short` lists one tracked path that `files.txt` does not: ` M docs/HELP.md`. It also lists two untracked files, `.scratch/migration/agents/briefs/O162-round-1.md` and `.scratch/migration/agents/reviews/O162-report.md`.
- The round brief in the worktree is byte-identical to main's copy (`diff` exit 0). The builder's report does not name it as a path it wrote.
- The whole of the round's change in code and docs is this hunk of `git diff 8a423feb3 -- docs/HELP.md`:
```
@@ -197,7 +197,8 @@ Oculus shows the research hub's YAML and Markdown files as boards, lists and doc
 | Enter, Tab, Up / Down | in the Debug Console: send, complete, history |
 | arrows, Enter, Shift+Enter, Delete | on a terminal row: show / split / kill (twice) |
 | F / P / O | in Present: full screen / presenter screen / overview |
-| Space / Shift+Space | next / previous slide |
+| Right / Left, Page Down / Page Up, Space / Shift+Space | in Present: next / previous slide |
+| Home / End | in Present: first / last slide |
```

## The two Help rows against moveOf

The two rows say what `moveOf` does. `keys.ts` is unchanged from the base: `diff` against `git show 8a423feb3:src/lib/views/academic/present/screen/keys.ts` exits 0. In `src/lib/views/academic/present/screen/keys.ts:74-91`:
- `ArrowRight` and `PageDown` return `{ by: 1 }`.
- `ArrowLeft` and `PageUp` return `{ by: -1 }`.
- `Home` returns `{ to: 'first' }` and `End` returns `{ to: 'last' }`.
- `' '` returns `{ by: event.shiftKey ? -1 : 1 }`.
- Every other key returns null. ArrowUp and ArrowDown are the overview grid's card-cursor keys (`keys.ts:17`) and move no slide, so "Right / Left" is the correct reading of "the arrows" in plan.md:1702.

`moveOf` is called from `screen/box.ts:56` (the pane and the presenter screen) and from `src/routes/present/show/+page.svelte:198` (the audience window). Those are all Present's surfaces, so "in Present:" is true.

The rows replace exactly the base row 200, after the `F / P / O` row, word for word as the round brief gives them. No other line of docs/HELP.md changes. `agents/spec.md:72` allows this ruled line.

## Verification lines, verbatim

Round check 1, `git diff 8a423feb3 -- docs/HELP.md`: one hunk, quoted above, from `index a07efd845..61901a958`. The step has no other hunk in that file.

Round check 2 and brief verify 3, the ASCII gate in the rules file's perl form. I ran it under bash over the 16 modified paths and the report. It printed nothing: `exit 0`.

Round check 3 and brief verify 1, `npm run test:quick`, run once. `git status --short` is the same before and after the run (`diff` exit 0).
```
test:quick: 18 changed file(s), from git since HEAD
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
ok      prettier (1.5 s): All matched files use Prettier code style!
ok      ASCII gate (1.8 s)
ok      svelte-kit sync (3.7 s)
ok      eslint (4.4 s)
ok      svelte-check (18.5 s): 1793995080703 COMPLETED 584 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (28.5 s): Duration  7.37s (transform 6.18s, setup 0ms, import 11.91s, tests 2.34s, environment 1ms)
ok      vitest slow (37.0 s): Duration  15.54s (transform 4.57s, setup 0ms, import 7.68s, tests 7.63s, environment 0ms)
ok      vitest checks (70.3 s): Duration  48.60s (transform 20.56s, setup 0ms, import 43.39s, tests 70.24s, environment 3ms)
test:quick: 74.1 s; every command passed
```
`tests/checks/source/history.test.ts` reads every line of docs/HELP.md (its head comment, lines 3-5), and it is in this run and passed.

Brief verify 2, the named tests.
- The builder's file list, with `-e "HELP.md"` added, was made with `grep -rl -e "present/Slide" ... -e "decks.md" -e "HELP.md" tests | sort`. It printed:
  - `tests/checks/config/config-folder.test.ts`
  - `tests/checks/source/history.test.ts`
  - `tests/routes/docs/docs.test.ts`
  - `tests/server/desktop/window-guard.test.ts`
  - `tests/server/git/clone-exclude.test.ts`
  - `tests/server/git/git-scan-depth.test.ts`
  - `tests/server/root/hooks-server.test.ts`
  - `tests/views/shared/prose/doc-link.test.ts`
- The builder's own command, `npx vitest run tests/checks/config/config-folder.test.ts tests/checks/tree/size.test.ts tests/server/desktop/window-guard.test.ts tests/server/root/hooks-server.test.ts tests/checks/source/keys.test.ts tests/checks/source/comment-width.test.ts --reporter=dot`:
```
 Test Files  6 passed (6)
      Tests  100 passed | 2 skipped (102)
```
- The four files that name HELP.md, run alone (`clone-exclude`, `git-scan-depth`, `docs.test.ts`, `doc-link.test.ts`):
```
 Test Files  4 passed (4)
      Tests  43 passed (43)
```
- In one combined run of all 11 files under the default 5000 ms limit, two checks timed out: `comment-width.test.ts > ... ends by the hundredth column everywhere under src, tests and utils 8672ms` and `history.test.ts > ... names no package id, date or session in any comment 14626ms`, each `Error: Test timed out in 5000ms.`
- These are time-outs while the machine is loaded, with no failed assertion. `tests/tiers/quick.mjs:285` runs the checks with `--testTimeout 0`. Run that way, `npx vitest run tests/checks/source/comment-width.test.ts tests/checks/source/history.test.ts --testTimeout 0 --reporter=dot` prints:
```
 Test Files  2 passed (2)
      Tests  8 passed (8)
```
- Both passed in test:quick above. Under spec.md:80 this is not a finding.

Brief verify 4, `wc -l` of the changed files:
```
     151 config/text/views/academic/present.yml
     644 docs/HELP.md
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

Brief verify 5. `sh utils/unused-exports.sh` exited 0 and wrote 334 lines. `diff ../O162-base/unused-exports.txt <that output>` printed nothing (`diff exit 0`), so the step adds no line.

Brief verify 6, the history-word grep.
- Input: the `+` lines of `git diff 8a423feb3`, 47 lines. These are the 45 of the first review plus the two Help rows.
- Command: `grep -n -i -E "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands|O1[0-9][0-9]|20[0-9][0-9]-"`.
- Result: `grep exit 1`, no hit.

Brief verify 7, C5 and C6. I ran them with `grep -rn` over the brief's paths; `git grep` is outside my three git commands.
```
== C5a   grep -rn -e "key_hint" -e "keys-past" -e 'class="keys"' -e "Arrow keys or Space" src tests docs config/text
exit 1
== C5b   grep -rn -i -e "key hint" -e "names the keys" src/lib/views/academic/present src/routes/present src/lib/themes/slide.css docs/decks.md docs/HELP.md
exit 1
== C6a   grep -rn "first={\|{first}" src/lib/views/academic/present src/routes/present
src/lib/views/academic/present/arrange/Overview.svelte:170:                first={run.at === 0}
== C6b   grep -n -w first src/lib/views/academic/present/Slide.svelte src/lib/views/academic/present/screen/Framed.svelte
src/lib/views/academic/present/Slide.svelte:146:    /** The gap between two figures of a block: the bottom margin of the first figure's box. */
```

The paths of the diff since the base, from `git diff 8a423feb3 | grep '^diff --git'`:
- the brief's 11 write-list paths;
- `docs/HELP.md`, on the round's write list;
- the four `docs/diagrams` files, generated.

`diff -rq` against `O162-base` over `src`, `config` (with `--exclude=local.yml`), `tests` and `utils` lists only the 10 src and config files. tests and utils are unchanged.

## Item verdicts, the whole diff since the base

I re-read the whole diff of `src`, `config` and `docs/decks.md` since the base.

1. No slide draws the hint: **holds**. `{#if first}<p class="keys" ...>{t('present.key_hint')}</p>{/if}` and the `.keys` rule with its comment are removed. C5a prints nothing.

2. No room is kept for it: **holds**.
   - `past`, `keys`, the measure, the `flushSync()` that followed it, `- past`, `style:--keys-past` and `padding-bottom: var(--keys-past, 0px)` are gone.
   - `Slide.svelte` now reads `const above = inner - kept;`.
   - The `flushSync` import is still used at `Slide.svelte:208,224,251,256,266,296,332`.
   - The new `.reading` comment describes the rule as it stands.

3. The probe still measures: **holds**. `Slide.svelte` reads `<span class="probe" aria-hidden="true" bind:this={probe}>Mg</span>`. The `.probe` rule and the effect are unchanged except the effect's comment.

4. The `first` prop is gone: **holds**. It is removed from both Props types and both destructurings, and from all six callers. C6 prints only the two lines the brief allows.

5. The words: **holds**.
   - `key_hint` is gone from `present.yml`.
   - The head comments of `Slide.svelte`, `Stage.svelte` and `show/+page.svelte`, and the `slide.css` paragraph, no longer name the hint. Each paragraph is rewrapped whole, and `comment-width` passed.
   - The hint sentence of `docs/decks.md:166` is removed and nothing else on that line changes.

6. Nothing else changes: **holds**.
   - Apart from the generated diagrams, the diff touches only the brief's write list plus docs/HELP.md.
   - docs/HELP.md was added by the round under ruling 706 and is on the round's write list (`briefs/O162-round-1.md`, "Paths this round writes").
   - The round reaches nothing beyond the round: the 15 snapshot paths are unchanged.

Round item 1, the deck keys in Help: **holds**. The hunk is the round brief's two rows word for word, in place of base line 200, and they match `moveOf` as set out above.

## Case verdicts

- C1: **met** by reading. `Present.svelte:419` passes no `first`, and Slide draws no paragraph under the content. On screen it is the look at landing.
- C2: **met** by reading. `above = inner - kept` is the same on every surface. The factor on screen is the look.
- C3: **met** by reading. The probe's triggers are unchanged: the ResizeObserver on the probe, `loadingdone`, and the effect on `[row, deck.frame, held]`. The probe follows `--slide-fs-body`. On screen it is the look.
- C4: **met** by reading. These surfaces passed `first={false}`, so their path is the same apart from the probe's text.
- C5: **met**. Both greps print nothing (quoted above).
- C6: **met**. They print exactly `Overview.svelte:170` and the figure-box comment `Slide.svelte:146`.
- C7: **met** by reading. `padding-bottom: var(--keys-past, 0px)` is gone, and `.foot { margin-top: auto }` puts the strip at the column's foot on every surface. On screen it is the look.

## Spec

None. The round wrote only docs/HELP.md, plus the report section, as its brief asks.

## Proof

P1 (low): the report's file table leaves out docs/HELP.md.
- Place: `.agents/worktrees/migration-O162/.scratch/migration/agents/reviews/O162-report.md:114-133`, the section "Files changed".
- Hunk: the table's rows run from `| src/lib/views/academic/present/Slide.svelte | 12 / 56 | 495 | yes |` to `| .scratch/migration/agents/reviews/O162-report.md | new | this file | yes |`. None of them names docs/HELP.md.
  - `sed -n 114,135p ... | grep -c HELP` prints `0`.
  - `git diff 8a423feb3` changes `docs/HELP.md` (2 added, 1 removed, 644 lines now).
  - The section says it is made "plus `git diff --numstat` for `docs/`", and that would list HELP.md.
- What is wrong: `spec.md:35` says the file table holds every changed path and marks each path outside the step brief's write list with its reason. docs/HELP.md is outside the step brief's write list, being on the round's, and is neither listed nor marked. The round section's sentence "Paths this round wrote: `docs/HELP.md` and this report" (`:228`) names it, but the table stays incomplete.
- Failure scenario:
  - The landing booking or the shared-path check is taken from the file table.
  - It then shows O162 writing no line of docs/HELP.md.
  - O158 and the plan's other Help writers are judged free of a shared file at landing, though O162 now changes `docs/HELP.md:200-201`. O158's worktree still holds the base rows at `:199-200` (`grep -n "Shift+Space\|F / P / O"` over its HELP.md).
  - The `shared_paths:` entry of O162 in `orchestrator-state.md:55` also names only Slide.svelte, present.yml and decks.md.
- Fix at landing: add one row, `| docs/HELP.md | 2 / 1 | 644 | no: the round's write list (ruling 706) |`.

I reran the round section's other claims and they reproduce:
- 18 changed files in test:quick, with the same 11 test files as the first run.
- The diagram files are unchanged since the snapshot (`diff -u` exit 0 on all four).
- The `git diff 8a423feb3 -- docs/HELP.md` quote is byte for byte, `index a07efd845..61901a958` included.
- The ASCII gate over HELP.md prints nothing.
- The three earlier report sentences on Help (`:9`, `:144`, `:158`) now describe the state after the round. No sentence of the report still says Help is unchanged (`grep -n -i "unchanged\|as it was\|left as"` hits only the unchanged tree and the not-covered line).

## Standards

None.
- The ASCII gate is clean.
- The history grep has no hit.
- One line per table row.
- The sizes are within the limits.
- prettier, eslint and svelte-check are clean.
- The `history.test.ts` audit of docs/HELP.md passed.

## Behaviour

None.
- The Help page's keys table now shows the two rows. The report's before-and-after bullet (`:144`) gives the old row and the two new rows, so the look can be taken from it.
- One fact for the look, not a finding: the Help rows leave unsaid that Space on a button or link inside a slide presses the control (`box.ts`, `heldBack` and `show/+page.svelte:199`). The round asked for what `moveOf` does, and the rows say exactly that.

## Declined to judge

- Git commands quoted in the report that are outside my three: `git diff src/lib/views/academic/present/Slide.svelte` (item 1), `git diff --numstat` (item 6 and the file table), and `git diff -U0 -- src config docs/decks.md` (verify 6). In their place I used `git diff 8a423feb3`, piped to the same greps. I used two piped forms of the allowed commands: `git diff 8a423feb3 | grep '^diff --git'` and `git status --short | grep '^ M'`.
- The claim that `npm run diagrams` ran right before the round's test:quick. I cannot check it without running the generator, which writes into the worktree. The four diagram files are byte-identical to the snapshot.
- The report's section "Open items of the state file, verbatim" (`:7`). It matches the worktree's copy of the state file at base, `orchestrator-state.md:204` (`diff` exit 0). Main's state file now lists 706 as closed (`:237`) and 712 as the open item (`:225`). The builder reads the ledger copy of its own worktree, and the round asked it to refresh nothing there, so this is not a builder finding. The landing report takes the open items from main.
- The untracked round brief `.scratch/migration/agents/briefs/O162-round-1.md` in the worktree. It is identical to main's copy, and whether it goes into the wip commit at landing is the orchestrator's call.
- The on-screen look: C1 to C4, C7 and the Help page's two rows are the orchestrator's look at landing. I started no server and opened no page.
- The builder's timings and its count of two test:quick runs. My run is the one quoted above.

Usage: a743f1e2010fe22e9, claude-opus-5-5, 149170 tokens, 33 tool uses, 9.7 min

## Closed

- Round 1 P1: fixed at landing, the report's file table gains the row `docs/HELP.md | 2 / 1 | 644 | no: the round's write list (ruling 706)`; O162's `shared_paths` names `docs/HELP.md` lines 200-201 against O158's 341-347, which do not touch.
- The first review found nothing.
