# O162 report: the arrow-keys hint removed

Everything in the brief is done.

## Open items of the state file, verbatim

- Open item 706 (2026-11-06), from O162's brief check (C-16): once the key hint goes, nothing a reader sees names the keys that move a deck besides Space. Help's keys table (`docs/HELP.md:199-200`) lists `F / P / O` and `Space / Shift+Space`; the arrows, Page Up / Page Down and Home / End that `screen/keys.ts:74-90` also handles are named nowhere. Options: (a) O162 widens to `docs/HELP.md` line 200, whose row becomes `Arrows, Page Up / Page Down, Space / Shift+Space | next / previous slide` with a row `Home / End | first / last slide`; pro: every deck key is named in the one place Help names keys, in the step that removes the only other place; con: one more path, shared with O158 and O160 at other lines of HELP.md, merged by hand at landing. (b) Help stays as it is; pro: no wider step; con: the arrow keys, Page Up / Page Down and Home / End stay undocumented. Recommendation: (a). (b) is the lazy option.

`docs/HELP.md` is unchanged by this step, as the brief and the dispatch say, pending that ruling.

## The cases' first run, on the unchanged tree (base 8a423feb3), before any change

No case's rule was found wrong; nothing was handed back.

- C1 (the first slide in the pane and in full screen from the pane): the hint is drawn in both. `Present.svelte:419` was `<Framed row={shown} {deck} facts={held.facts} first={at === 0} bare={full} />`, one Framed for the framed and the full-screen pane, and `Framed.svelte:52` passed `{first}` to Slide, whose `:464-466` drew `{#if first}<p class="keys" bind:this={keys}>{t('present.key_hint')}</p>{/if}`. Holds as the brief states.
- C2 (frame 800 by 600, text size 1.6): the pane's first slide has less room than its tile. The column is min(1040, 800 - 128 - 2) = 670 px wide (`slide.css:25-28`, padding 64 px, border 1 px); the hint, `font-size: var(--fs-md)` = 13 px x 1.6 at line-height 1.25 (`Slide.svelte:514-525`, `tokens.css:168`), wraps over several lines there, so `past = Math.max(0, Math.ceil(tall(keys) - parseFloat(frame.paddingBottom)))` (`:208-211`) is above 0 and `above = inner - kept - past` (`:214`) is smaller in the pane than in the tile, where `first={false}` (`Tile.svelte:115`) leaves `keys` null and `past` 0. Holds as the brief states (the exact line count of the wrap is a page fact, not measured here).
- C3 (text size, theme, hidden pane brought to the front): the effect `:373-394` observes the probe `:467` with a ResizeObserver and `document.fonts` `loadingdone` and calls `layOutSlide()` on a change of `offsetWidth offsetHeight`. The probe is `font-size: var(--slide-fs-body)` (`:535`), which follows `--text-scale` and the theme's design sizes (`slide.css:36-41`, `body.rice .slide-frame` at `slide.css:63-69`), and a hidden pane's probe has size 0 until shown. Holds.
- C4 (presenter screen, audience window, Overview tiles, PDF): each passed `first={false}` (`Presenter.svelte:110,122`, `show/+page.svelte:276`, `Tile.svelte:115`, `print/+page.svelte:190`), so `keys` was null, `past` 0 and `--keys-past` unset (`:400` gives `undefined` at 0, `padding-bottom: var(--keys-past, 0px)`). None drew the hint. Holds.
- C5: `grep -rn -e "key_hint" -e "keys-past" -e 'class="keys"' -e "Arrow keys or Space" src tests docs config/text` printed 7 lines (`Slide.svelte:400,465,467,472,482,516`, `present.yml:82`); `grep -rn -i -e "key hint" -e "names the keys" src/lib/views/academic/present src/routes/present src/lib/themes/slide.css docs/decks.md docs/HELP.md` printed 11 lines (`Stage.svelte:17`, `Framed.svelte:25`, `Slide.svelte:35,66,103,207,471,507`, `show/+page.svelte:6`, `slide.css:14`, `docs/decks.md:166`), the eleven the brief names.
- C6: `grep -rn "first={\|{first}" src/lib/views/academic/present src/routes/present` printed 8 lines: `Present.svelte:419`, `Presenter.svelte:110,122`, `Framed.svelte:52`, `Overview.svelte:170`, `Tile.svelte:115`, `show/+page.svelte:276`, `print/+page.svelte:190`; `grep -n -w first` over Slide.svelte and Framed.svelte printed `Slide.svelte:35,66,67,74,156,464` and `Framed.svelte:25,26,33,52`.
- C7 (the C2 deck, first slide a project slide with a facts strip): `.reading` had `padding-bottom: var(--keys-past, 0px)` (`:482`) and `.foot { margin-top: auto }` (`:499-501`), so the strip sat `past` px above the column's foot in the pane and at the foot in the tile. Holds as the brief states.

C5 and C6 are run with `grep -rn` in place of `git grep`: `spec.md:33` allows a builder `git status`, `git diff` and `git show` only. `git status --short` shows no untracked file under the grepped paths, so the two forms read the same files.

## DONE / NOT DONE

| Item | State | Proof (command, output as printed) |
| --- | --- | --- |
| 1. No slide draws the hint: `{#if first}<p class="keys">` and the `.keys` rule with its comment gone | DONE | C5 first grep after the change prints nothing; `git diff src/lib/views/academic/present/Slide.svelte` shows the block and the `.keys` rule removed |
| 2. No room kept: `past`, `keys`, the measure, the `flushSync()` after it, `- past`, `style:--keys-past`, `padding-bottom: var(--keys-past, 0px)` gone, `.reading`'s comment rewritten | DONE | `grep -rn -w -e past -e keys src/lib/views/academic/present/Slide.svelte` prints only `:27` ("runs past its frame") and `:259` ("runs past the foot"), both prose of other comments; the measure is now `const kept = foot === null ? 0 : tall(foot);` and `const above = inner - kept;` (`Slide.svelte:197-198`) |
| 3. The probe still measures, holding a fixed run of ASCII letters | DONE | `Slide.svelte:443`: `<span class="probe" aria-hidden="true" bind:this={probe}>Mg</span>`; the effect `Slide.svelte:357-378` and the `.probe` rule are unchanged apart from the effect's comment; the re-layout itself is the look at landing (C3) |
| 4. The `first` prop gone from Slide and Framed and from the six places that passed it | DONE | C6 greps after the change, below |
| 5. The words: `present.key_hint` gone; head comments of Slide `:35-39`, Stage `:14-26`, show/+page `:2-10`, slide.css `:10-15` and the prop comments rewritten and rewrapped; decks.md:166's sentence gone | DONE | C5 greps after the change print nothing; `npm run test:quick` line `ok      vitest checks (66.9 s)` includes `tests/checks/source/comment-width.test.ts` and `keys.test.ts` |
| 6. Nothing else changes | DONE | `git diff --numstat` lists only the paths in the file table below; the layout search, the foot, the strip and the Too tall measure are untouched in the diff |
| Verify 1: `npm run test:quick` once after the last change | DONE | `test:quick: 70.1 s; every command passed` (full lines below) |
| Verify 2: the brief's named test run | DONE | `Test Files  6 passed (6)` / `Tests  100 passed | 2 skipped (102)` |
| Verify 3: ASCII gate (perl form) over the changed files | DONE | prints nothing |
| Verify 4: `wc -l` within the size limit | DONE | Slide.svelte 495 (limit 520), every other file below its limit, table below |
| Verify 5: `sh utils/unused-exports.sh` against the base | DONE | `diff O162-base/unused-exports.txt <new list>` prints nothing, exit 0; 334 lines both |
| Verify 6: history-word grep over added comment lines | DONE | prints nothing |
| Verify 7: C5 and C6 greps | DONE | below |

### Verify 1, `npm run test:quick` (run once), its lines

```
test:quick: 15 changed file(s), from git since HEAD
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
ok      prettier (1.1 s): All matched files use Prettier code style!
ok      ASCII gate (1.2 s)
ok      svelte-kit sync (3.2 s)
ok      eslint (22.7 s)
ok      vitest (34.4 s): Duration  11.55s (transform 11.28s, setup 0ms, import 17.22s, tests 2.76s, environment 1ms)
ok      vitest slow (40.4 s): Duration  17.33s (transform 4.72s, setup 0ms, import 7.10s, tests 9.99s, environment 0ms)
ok      svelte-check (51.1 s): 1793992604440 COMPLETED 584 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (66.9 s): Duration  43.51s (transform 29.82s, setup 0ms, import 54.27s, tests 75.08s, environment 2ms)
test:quick: 70.1 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
```

`npm run diagrams` ran once, right before that run. No whole-suite command was run.

### Verify 2, the named tests

The files were listed with `grep -rl -e "present/Slide" -e "Slide.svelte" -e "Framed" -e "screen/Stage" -e "Stage.svelte" -e "Present.svelte" -e "arrange/Tile" -e "Tile.svelte" -e "Presenter.svelte" -e "present/print" -e "present/show" -e "slide.css" -e "academic/present.yml" -e "decks.md" tests | sort`, which printed `tests/checks/config/config-folder.test.ts`, `tests/server/desktop/window-guard.test.ts` and `tests/server/root/hooks-server.test.ts` (the last two name the `/present/print` and `/present/show` URLs). `tests/checks/source/keys.test.ts` (every catalog key has a reader) and `tests/checks/source/comment-width.test.ts` were added to the run.

`npx vitest run tests/checks/config/config-folder.test.ts tests/checks/tree/size.test.ts tests/server/desktop/window-guard.test.ts tests/server/root/hooks-server.test.ts tests/checks/source/keys.test.ts tests/checks/source/comment-width.test.ts --reporter=dot`:

```
 Test Files  6 passed (6)
      Tests  100 passed | 2 skipped (102)
```

### Verify 3, ASCII gate

`LC_ALL=C perl -ne 'my $l = $_; $l =~ s/\xC3[\x80-\xBF]//g if $ARGV =~ m{^config/}; print "$ARGV:$.:$_" if $l =~ /[^\x20-\x7E\n]/; close ARGV if eof'` over the eleven changed source and doc files and the two changed `.dot` files printed nothing; the same over the two changed `.svg` files printed nothing.

### Verify 5, unused exports

`sh utils/unused-exports.sh > <scratchpad>/unused.txt` (exit 0), then `diff .agents/worktrees/O162-base/unused-exports.txt <scratchpad>/unused.txt` printed nothing (exit 0). The step adds no line.

### Verify 6, history words

`git diff -U0 -- src config docs/decks.md | grep '^+' | grep -v '^+++' | grep -E '//|/\*|^\+\s+\*|^\+   [A-Za-z(]|^\+[^ ]' | grep -n -i -E "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands|O1[0-9][0-9]|20[0-9][0-9]-"` printed nothing. The added lines it read are the 41 `+` lines of that diff: the rewrapped paragraphs of slide.css, Slide.svelte (head, probe effect, `.reading`), Stage.svelte and show/+page.svelte, and the changed markup lines.

### Verify 7, C5 and C6 after the change

```
$ grep -rn -e "key_hint" -e "keys-past" -e 'class="keys"' -e "Arrow keys or Space" src tests docs config/text
(nothing)
$ grep -rn -i -e "key hint" -e "names the keys" src/lib/views/academic/present src/routes/present src/lib/themes/slide.css docs/decks.md docs/HELP.md
(nothing)
$ grep -rn "first={\|{first}" src/lib/views/academic/present src/routes/present
src/lib/views/academic/present/arrange/Overview.svelte:170:                first={run.at === 0}
$ grep -n -w first src/lib/views/academic/present/Slide.svelte src/lib/views/academic/present/screen/Framed.svelte
src/lib/views/academic/present/Slide.svelte:146:    /** The gap between two figures of a block: the bottom margin of the first figure's box. */
```

A wider grep, `grep -rln "present.key_hint\|key_hint" src tests docs config README.md --exclude=local.yml`, prints nothing.

## Files changed

From `diff -rq` of `.agents/worktrees/O162-base/{src,tests,utils,config}` against the worktree (`--exclude=local.yml` for config), plus `git diff --numstat` for `docs/`, which the base copy does not hold. Line counts from `wc -l` after the last change.

| File | Added / removed | Lines now | In the write list |
| --- | --- | --- | --- |
| `src/lib/views/academic/present/Slide.svelte` | 12 / 56 | 495 | yes |
| `src/lib/views/academic/present/screen/Framed.svelte` | 2 / 4 | 51 | yes |
| `src/lib/views/academic/present/screen/Stage.svelte` | 8 / 11 | 147 | yes (lines 14-26) |
| `src/lib/views/academic/present/Present.svelte` | 1 / 1 | 462 | yes (line 419) |
| `src/lib/views/academic/present/arrange/Tile.svelte` | 1 / 1 | 184 | yes (line 115) |
| `src/lib/views/academic/present/presenter/Presenter.svelte` | 2 / 2 | 246 | yes (lines 110, 122) |
| `src/routes/present/print/+page.svelte` | 1 / 1 | 221 | yes (line 190) |
| `src/routes/present/show/+page.svelte` | 7 / 7 | 325 | yes (lines 2-10, 276) |
| `src/lib/themes/slide.css` | 6 / 6 | 69 | yes (lines 10-15) |
| `config/text/views/academic/present.yml` | 0 / 1 | 151 | yes (line 82) |
| `docs/decks.md` | 1 / 1 | 432 | yes (line 166) |
| `docs/diagrams/layer-views.dot`, `.svg` | 1 / 1 each | 179 (.dot) | no: generated by `npm run diagrams`, which `spec.md:26` runs before the verify list; the count of `views/academic` to `state` imports goes from 93 to 92 |
| `docs/diagrams/layers.dot`, `.svg` | 1 / 1 each | 101 (.dot) | no: same reason; `views to state` goes from 1566 to 1565 |
| `.scratch/migration/agents/reviews/O162-report.md` | new | this file | yes |

The diagram counts drop by one because Slide.svelte drops its import of `t` from `$lib/state/shared/words/text`, whose only call was the hint and the probe.

## User-visible changes, before and after, for the look

- The Present pane, a deck's first slide, framed and in full screen (`F`): before, a muted, centred line "Arrow keys or Space move through the deck | O opens the overview | F shows it full screen | P opens the presenter screen" under the slide in the frame's bottom margin. After, nothing under the slide; the frame's bottom margin is empty, as on every other slide.
- A deck with `deck.frame: { width: 800, height: 600 }` at text size 1.6, first slide whose content fills its room: before, the pane's first slide had less room than its Overview tile by the hint's lines past the margin, so its text could be drawn at a smaller factor, or marked Too tall, where the tile was not. After, the pane's first slide is drawn at the same factor as its tile and is Too tall only where the tile is.
- The same deck with a project slide first, carrying a facts strip: before, the strip sat higher in the pane than on the tile by the hint's overflow. After, the strip sits at the foot at the same height as on the tile.
- The presenter screen (both slides), the audience window, the Overview tiles and the PDF: no change (none drew the hint).
- A change of text size or theme while a slide is shown, and a Present pane opened behind another tab then brought to the front: the slide is laid out again as before the change, through the probe, which now holds `Mg`.
- Help's keys table is unchanged; with the hint gone, the arrow keys, Page Up / Page Down and Home / End are named nowhere a reader sees (open item 706).

## Head comments and docs that describe the changed behaviour

- `Slide.svelte` head comment, third paragraph (the foot and the content's room): rewritten. First and second paragraphs: still true.
- `Slide.svelte`, the doc comment of `layOutSlide`: still true.
- `Slide.svelte`, the probe effect's comment: rewritten (names the two fixed letters, hidden and never read).
- `Slide.svelte`, the `.reading` rule's comment: rewritten to what the rule does. The `.content`, `.foot` and `.probe` comments: still true.
- `screen/Framed.svelte` head comment: still true; its `first` prop comment removed with the prop.
- `screen/Stage.svelte` head comment, second paragraph: rewritten (the hint sentence dropped, the paragraph rewrapped whole). First and third paragraphs: still true.
- `src/routes/present/show/+page.svelte` head comment, first paragraph: rewritten ("with no toolbar, rail or counter"). Later paragraphs: still true.
- `src/routes/present/print/+page.svelte`, `Present.svelte`, `arrange/Tile.svelte`, `presenter/Presenter.svelte` head comments: still true (none named the hint or the prop).
- `src/lib/themes/slide.css`, paragraph `:10-15`: rewritten ("The frame itself and the slide's foot under the content (the strip of a project's facts) keep the factor 1"). Paragraph `:1-8` and the rice paragraph: still true.
- `docs/decks.md:166`: rewritten (the hint sentence removed).
- `docs/HELP.md`: not changed (outside the step's paths); it never named the hint.

## Judgment calls the brief left open

- The probe holds `Mg`, the brief's example. The probe keeps `max-width: 100%`, `overflow: hidden` and `white-space: nowrap`; with the long hint words its width was clamped at the column width, with `Mg` it is the two letters' width. The column width in the frame's own px depends only on the deck's frame (watched by the first effect through `deck.frame`) and on `--slide-reading` and the frame padding, which are fixed in `slide.css:25-27` for every theme (`grep -rn -e "--slide-reading" -e "slide-frame" src config` finds no other declaration), so no trigger is lost.
- The `flushSync()` after the measure goes with it, as the brief asks. Read: no state is written in `layOutSlide` before that point once `past` is gone, and `kept` reads the foot, whose drawing follows `held` and `facts`, already flushed when the effect's microtask, an image event, the ResizeObserver or `loadingdone` calls `layOutSlide`.
- The import of `t` in Slide.svelte is removed, since the hint and the probe were its only calls (eslint and svelte-check would otherwise report it).
- Stage.svelte's hint sentence is dropped, with no sentence in its place: the paragraph already says a tile measures what the pane does.
- Slide.svelte's head now ends its third paragraph with "The content's room is the frame's inner height less the foot's, the strip counted, on every slide alike."
- Prettier put the `.reading` div on one line (`<div class="reading" data-slide-key={row.key} bind:this={reading}>`) once its fourth attribute went.
- The docs/diagrams files are in the diff, generated, outside the write list, for the reason in the file table.

## Wrong or impossible in the brief

Nothing wrong. Every premise checked reproduced: `key_hint` at `present.yml:82` and `Slide.svelte:465,467` only; the eleven lines of C5's second grep; the eight `first=` lines of C6; Slide.svelte at 539 lines on the base. The one departure in method: the C5 and C6 greps are run with `grep -rn`, since `spec.md:33` bars `git grep` for a builder.

## Limitations

- C1, C2, C3, C4 and C7 are checked by reading only; the drawing, the factor in the narrow deck and the re-layout on a text-size, theme or tab change are the look at landing.
- The step adds and changes no test.
- O158 (in flight) keeps the hint wording and `past` in its own version of Slide.svelte; as the brief says, those are removed at O158's landing on the new head.
