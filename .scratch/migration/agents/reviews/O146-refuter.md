# O146 refuter report

Review of O146 (a deck's frame size and the slide findings), worktree /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O146, base 8c3da2a2f.

## Verification lines

1. `npm run test:quick -- --base 8c3da2a2f`, one run, 7 min 17 s. The quick list is red only on two timeouts in files that pass when run alone.
```
test:quick: 84 changed file(s), from git since 8c3da2a2f
test:quick: 360 test file(s)
ok      prettier (0.8 s): All matched files use Prettier code style!
ok      ASCII gate (0.9 s)
ok      svelte-kit sync (2.6 s)
ok      eslint (2.7 s)
ok      svelte-check (9.5 s): 1793900621247 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (186.5 s): Duration  173.74s (transform 67.70s, setup 0ms, import 185.72s, tests 458.39s, environment 7ms)
FAILED  vitest (264.5 s)
FAILED  vitest slow (434.1 s)
test:quick: 436.8 s; failed: vitest, vitest slow
```
   - `vitest`: `FAIL |unit| tests/server/edit/app-store.test.ts > writes the store of an app as the app-store kind > a target that holds no apps, answered unwritable` / `Error: Test timed out in 5000ms.` Run alone with `npx vitest run tests/server/edit/app-store.test.ts` it prints `Test Files  1 passed (1)` and `Tests  15 passed (15)`. It is a timeout under load and is not counted.
   - `vitest slow`: `FAIL |unit| tests/data/hubs/hub-portfolio.test.ts > the portfolio of several hubs > keeps a primary-hub id that begins with the name of a hub folder and a colon as a record of the primary, with no finding` / `Error: Test timed out in 20000ms.` Run alone with `npx vitest run tests/data/hubs/hub-portfolio.test.ts` it prints `Test Files  1 passed (1)` and `Tests  16 passed (16)`, and that test took 2888 ms and 2952 ms with `--reporter verbose`. It is a timeout under load and is not counted.
2. Item 2 as the brief writes it, with the path `tests/data/sources/config/settings.test.ts` that no longer exists, prints `Test Files  4 passed (4)` and `Tests  66 passed | 9 skipped (75)`. With `tests/data/sources/config/settings` in its place it prints `Test Files  6 passed (6)` and `Tests  163 passed | 9 skipped (172)`.
3. The first grep prints only `src/desktop/decide/place.ts:75:const AUDIENCE_SIZE = { w: 960, h: 540 } as const;`. `grep -rn "1280\|\b720\b" src --include='*.ts' --include='*.svelte'` prints only `src/desktop/decide/place.ts:18:const DEFAULT_SIZE = { w: 1280, h: 800 } as const;`.
4. The perl ASCII gate over `src tests bin config` prints nothing except `find: bin: No such file or directory`. `LC_ALL=C grep -n '[^ -~]'` over the 81 touched files (from `git status --short`, untracked folders expanded, `.svg` counted separately) prints nothing. `grep -c` over `docs/diagrams/*.svg` gives 0 for each file.
5. `wc -l` of the largest changed files: `context.ts` 878, `data/index.ts` 862, `builds.ts` 850, `model/index.ts` 836, `read.ts` 675, `status.ts` 669, `settings/settings.test.ts` 615, `present.ts` 592, `present.svelte.ts` 547, `windows.ts` 544. The largest component is `Present.svelte` at 519. Folders: `settings` 10, `settings/writing` 2, `present/screen` 4, `tests/data/sources/config` 10, `tests/data/sources/config/settings` 3.
6. `sh utils/unused-exports.sh` gives 335 lines, the same as the 335 lines of `O146-base/unused-exports.txt`, and `diff` between them prints nothing.
7. Old import paths (`settings/latex.ts`, `settings/lint.ts`, `config/settings.test`, with the `settings/writing/` lines left out) over `src tests config docs README.md`: no hits. `FRAME_WIDTH|FRAME_HEIGHT|AUDIENCE_FEATURES`: no hits. `AUDIENCE_SIZE`: only `place.ts:75,118,119,149,150`. `Printer` and `printPdf`: `preload.cjs:33`, `app.ts:37,151`, `print.ts:46`, `bridge.ts:50,124`, `stores/desktop.ts:91`, `export.ts:94`, each carrying the frame argument. In the ledger, `.scratch/migration/agents/guarded.md:254` names `config/settings.test.ts` 4 times (see Standards St1).
8. History-word grep over the 1987 added lines (the `+` lines of `git diff 8c3da2a2f` over `src tests config docs/HELP.md docs/templates.md`, plus every untracked file under `src` and `tests`): 0 hits.
9. By reading:
   - The three sentences the step adds to the Present bullet at `docs/HELP.md:331` run from 30 to 50 words, and they make a bullet that was already a paragraph longer still.
   - That bullet departs from spec.md:72 ("short bullets"). The brief restricted the edit to line 331, and the builder named the departure.
   - No other new list item departs from the rules.

Other commands the report quotes, run again:
- The deck-reader case run (C1, C2, C3, C4, C8) was run inline over a temporary folder in the scratchpad, which was then removed. Every line matches the report, and so does one extra C3 row: `{ width: null, height: 768 }` gives `deck.frame.width must be a number; ...`.
- `audiencePlace` and `wholeFrame` (C2, C10) were run with node, and every line matches the report: 960x720 for a 1024x768 frame, 960x540 for features with no frame, and null for each refused frame.
- `present.ts` (`audienceFeatures`, `deckShape`, `fit`) does not load under plain node, because `$state` needs the svelte transform. It was judged by reading: `z.strictObject` with `int().positive()` at `present.ts:476-479`.
- C9: `OCULUS_TEST_HUB=$HOME/workspace/research-hub node tests/data/real-hub.probe.ts` prints `manifest findings: 0`, `registry findings: 0`, `collection findings: 0`, `config findings: 0` and `snapshot findings: 0`. The integrity test with `OCULUS_TEST_HUB` set prints `Test Files  1 passed (1)` and `Tests  14 passed (14)`.
- C4: `npx vitest run tests/data/sources/present.test.ts tests/data/sources/config/settings` prints `Tests  101 passed (101)`. That is 4 tests in present.test.ts and 97 in the settings folder, which matches 92 + 5. The 5 frameSetting rows pass under `-t frameSetting`.
- Split check: comparing the base `settings.test.ts` with the three new files line by line (`comm`) shows only imports, head comments and the `export` keywords as differences. No assertion line was lost or changed.

## Verdicts, What to build

1. Holds.
   - `settings/present.ts` reads both sides through `settingReader(config, problems, 'present.yml')`, and `frameSetting` is listed in `PROBLEM_READERS` (`problems.ts:69`).
   - The options entries give the ranges 320-3840 and 240-2160 with `whole: true`, and there is a `groups:` line for `defaults.frame`.
   - The `writing/` folder takes `latex.ts` and `lint.ts`, the rename grep is empty, and `settings/` holds 10 items.
   - The ranges have one source. `deckFrame` uses `valueProblem(rule[side], ...)` on the catalog entries that `FrameSetting.rule` carries, and the finding words come from `mustBe(catalog, rule[side], problem)` (`read.ts:145`).
   - `data/index.ts` is at 862 lines.
   - J1: the frame comes from `frameSetting(config.merged)` at `data/index.ts:344` and `server/content/deck/read.ts:98`, and the second call uses the owning hub's config (`owner?.config ?? source.config`, `:88`). That meets every requirement the brief attaches to "the way tagTones does". The builder's reasons are a layer rule and throws on partial maps, and the first run of the order test reproduces them by reading. I find no defect.
2. Holds.
   - The C3 rows are reproduced above.
   - `deck-schema.yml:18` holds the new field.
   - `Deck.frame` is at `model-deck.ts:277`, and `deckShape` uses a strict object.
   - A member deck's frame is read in `docAt` (`read.ts:230`) for its findings, and only the outer deck's `frames.get(doc.dir)` is drawn (`:652`).
   - The test context literals gained `frame`.
3. Holds.
   - `fit(width, height, frame)` is used. Stage takes `frame`, and every caller passes `deck.frame`.
   - The aspect ratios are set in `Tile.svelte` (`.shot`) and in `Presenter.svelte` (`.preview`).
   - `--slide-width` is set at `Stage.svelte:73` and `print/+page.svelte:129`.
   - The browser audience window uses `audienceFeatures(frameOf(held.ref))` with the saved deck's frame (`savedFrame` peeks `[KIND, ref.root, ref.path]`, the same key `deck()` reads).
   - On the desktop, `setWindowOpenHandler(({ url, features }))` passes the features to `route`, then to `audience.open`, then to `audiencePlace`, so the address stays a root and a path.
   - The print route writes `@page` from the deck in `<svelte:head>`.
   - The print bridge refuses with `wholeFrame(frame) === null` before `print` is called. The hidden window opens at the frame, and export uses `saved.frame`.
   - `Present.svelte` is at 519 lines.
   - J2 follows the item's text. See Spec S1.
4. Violated, in part: Behaviour B1, B2 and B3, and Proof P1.
   - Built as asked: the store map is per client (`SvelteMap` inside `createPresent`), with the key `JSON.stringify([root, path, key])`. `kept()` runs on each answer, `findings()` derives from `roots()`, Findings and `findingsCount` read the same sources, and the tile chip carries the tooltip. The show route passes no `onmeasure`, and a hidden tab is skipped by `clientHeight === 0`.
   - B1: the Stage in the pane and in the presenter does not measure a newly shown slide unless a size changes.
   - B2: an answer to a superseded draft deletes measures.
   - B3: the first slide is measured differently in the pane and on its tile.
5. Holds. The C8 rows are reproduced. The untitled finding carries the slide's file, line and `key: title` (`read.ts:397`), and the deck-level `raiseFor` keeps its shape.
6. Holds.
   - The comments named in the brief were rewritten.
   - `HELP.md:331` and `:570` were edited and their facts are true as built.
   - The template line was added at `templates.md:1917`.
   - The ledger line that names moved tests is Standards St1, the orchestrator's file.

## Verdicts, cases

- C1: met. Shown by the reader run (`frame {"width":1280,"height":720}`) and by reading every Stage caller and the print route.
- C2: met. Shown by the reader run, the `audiencePlace` run (`w 960, h 720`) and reading.
- C3: met. All eight inputs give one finding on `deck.frame` and the setting's frame, by run.
- C4: met. The G13 tests are in `tests/data/sources/config/settings/settings.test.ts`, describe 'frameSetting', and they pass. The reader under a 1920x1080 setting gives 1920x1080, by run.
- C5: met by reading, for a slide shortened while it is drawn: `.reading` shrinks and the observer fires. The look at landing settles it on screen. A slide shortened while it is not drawn keeps its finding (B1).
- C6: met by reading. A late image grows `.reading`, which is observed. A frame change resizes the observed frame.
- C7: met by reading. A summary or grid slide's `source` is the deck's `present.yml` and the line of its `order:` entry.
- C8: met, by run.
- C9: met, by run.
- C10: met, by run of `wholeFrame` and by reading the handler at `bridge.ts:228-237`.
- C11: met by reading (`kept()` in `answered()`). The opposite fault exists: B2 removes a slide that is still held.
- C12: met by reading the key, for the pairs the case names (two panes, and the pane with the presenter).
- C13: met by reading.

## Spec

- S1. J2 is a user-visible change to every existing deck, and neither ruling 681 nor ruling 683 names it. The orchestrator rules on it before landing.
  - Place: `src/lib/themes/slide.css:11-12`, `+    --slide-pad: 64px;` / `+    --slide-reading: calc(var(--slide-width) - 2 * var(--slide-pad));`.
  - At 1280 the reading column is 1152 px, where the base gives 1040 px. Every 16:9 deck's text column widens by 112 px.
  - The change comes from the brief's item 3 wording. It is not listed under the brief's "Decisions taken in this brief".
  - The brief's stated reason, that a 1024-wide frame's text column should fit, already held on the base. `Slide.svelte` `.reading` has `width: 100%; max-width: var(--slide-reading)`, so inside a 1024 frame it was already 896 px wide.
  - Failure scenario: open the portfolio deck, and a text slide's lines run 112 px wider than before. A slide that fitted in height can now reflow onto fewer lines. A slide written to break at a given width breaks elsewhere.
  - Options: (a) keep it as built; the lazy option, since it costs nothing now. (b) `min(1040px, var(--slide-width) - 2 * var(--slide-pad))`, which leaves every 16:9 deck as on the base, fits narrow frames and keeps the comment at `Slide.svelte:5` true. (c) Keep 1040 px fixed and reword only the comment.
  - My judgment is that (b) is better, since font sizes stay in px whatever the frame. The builder followed the brief and flagged the change, so this is not a defect of the builder.
- Brief premises that do not reproduce, both named by the builder:
  - `screen/Slide.svelte` is `present/Slide.svelte`.
  - Verify item 2's path no longer exists after the split, which line 2 above shows.
- Paths outside the write list, each needed:
  - `acts.svelte.ts`: export gets its deps only through `Reads`.
  - The `config.ts` re-export: `config.ts` imports the moved files, so it counts as a file importing a moved file.
  - `layer-rows.ts:344-345`: it names the moved modules for the boundary table.
  - The two test import lines: the context literals need `frameSetting`.
  - `screen/Framed.svelte`: `Present.svelte` would pass 520 lines without it, and the screen folder holds 4 items.
  - The settings test split: 879 lines plus C4 would pass 880, and `tests/data/sources/config` holds 10 items.
  None of these is a finding.
- Otherwise none.

## Proof

- P1. The report's asynchronous-paths section claims something the compiled code does not do.
  - The claim: "a changed title or row changes the `onmeasure` prop, which re-runs Stage's effect".
  - Compiling `screen/Framed.svelte` with `svelte/compiler` (client, runes) gives `onmeasure: (over) => measured($$props.deck, $$props.row, over),`, a plain property and not a getter.
  - Stage's effect compiles to `$.user_effect(() => { const element = $.get(drawn); const report = $$props.onmeasure; ... })`. Its only reactive read is `drawn`, so it runs once per mount and never again for a new row or deck.
  - The C6 and C11 readings in the report rest on this claim for the cases where no size changes. Behaviour B1 and B2 are the consequences.
- Otherwise none. The C4 failing-first lines are quoted. No assertion was edited, and the split is lossless by `comm`. The frameSetting tests would fail with the reading removed, since the synthetic defaults of 1600x900 differ from the shipped ones. No module-level mutable was added.

## Standards

- St1. The test rule now names a test file that moved.
  - Place: `.scratch/migration/agents/guarded.md:254`, the G13 Test line, which names `tests/data/sources/config/settings.test.ts` 4 times. `ls tests/data/sources/config/settings/` lists `settings.test.ts`, `synthetic.ts` and `writing.test.ts`.
  - The latex rows of 'answers the default for a wrong %s and names the key' are at `writing.test.ts:150-154`. The rows "one case per setting reader", `literature.*`, 'appsSettings' and 'slurmSettings' are in `settings/settings.test.ts`. C4's tests also need recording.
  - Failure scenario: a later step whose change touches a setting reader looks up G13's test and finds no such file.
  - The file is the orchestrator's (spec.md bars the builder from it), so this is a fix at landing.
- St2. The page's own findings are put together in two places.
  - Place: `src/lib/views/system/findings/Findings.svelte:93` `{ findings: [...registry.refused(), ...present.findings()] }` and `rail-badges.svelte.ts:224` `findings: [...registry.refused(), ...present.findings()]`.
  - Item 4's "so the count and the list agree" depends on these two staying equal. The spec.md principle is that a fold exists once.
  - Failure scenario: a third own-findings source added to one of them makes the rail count and the list disagree. Low.
- St3. The head of the defaults file now misleads, though it is not strictly false.
  - Place: `config/defaults/present.yml:1`, "its own present.yml can change anything set here", and the options `groups:` line `defaults: ... which a deck's own present.yml can change.`
  - A deck's `present.yml` has a `defaults:` block that mirrors this file: the deck reader reads `defaults.tag_tones` (`spec.ts:221`), and the template shows `# defaults:` at `templates.md:1919`. The frame is the one key of this file that a deck changes elsewhere, under `deck.frame`.
  - Failure scenario: a reader writes `defaults: { frame: { width: 1024, height: 768 } }` in a deck's `present.yml`. The deck stays 1280x720, and the only sign is the editor's mark for an unread key. Low.
- St4. A branch that cannot be reached.
  - Place: `settings/present.ts:83-88`: `if (typeof held === 'number') sides[side] = held;` and then `width === undefined || height === undefined ? { fault: { kind: 'not-a-map' } }`.
  - `valueProblem` has already refused a value that is not a finite number (`value-rule.ts:315-316`), so the fallback cannot be reached, and if it were, it would name the wrong fault. Low.
- Otherwise none:
  - Every file is within the size limits and every folder within 10 items.
  - Every new file has its layer head comment.
  - No added comment line exceeds 100 columns (awk over the added lines).
  - The glyph `warn` exists (`glyphs.yml:76`), and the `*_glyph` catalog key follows `ui.yml`'s pattern.

## Behaviour

- B1. The Stage in the pane and in the presenter does not measure a newly shown slide unless a size changes.
  - Place: `screen/Stage.svelte:43-55`, the effect, together with `Present.svelte:476` `<Framed row={shown} {deck} first={at === 0} bare={full} />`, which is not keyed and so keeps one Stage across slide changes. `Presenter.svelte:95,107` are the same.
  - The observer fires only when the border box of the frame or of `.reading` changes. Two slides that both fit have the same `.reading` height (`min-height: 100%`).
  - Failure scenario:
    - A deck holds A, which fits, and B, which is too tall by 200 px. Open the Overview, and tile B records B too tall. Close the Overview, and the pane shows A.
    - In an editor on the same page, cut B's list so that B fits. B is drawn nowhere, so no Stage measures it, and the live answer keeps B, so `kept()` leaves its entry.
    - Press the right arrow to show B. Nothing fires. Findings still lists "slide too tall: B runs 200 px past its frame of 1280 by 720 px", the rail counts it, and B's tile chip reappears with the Overview, until a remount re-measures it.
    - In the same way, a renamed title that leaves the height unchanged keeps the old title in the finding's message.
  - The report says nothing of this.
- B2. An answer to a superseded draft deletes the measure of a slide that is still too tall.
  - Place: `present.svelte.ts:292-294`. `answered()` calls `kept(held)` for every answer, `drawn()`'s included, and `acts/live.svelte.ts:41-43` drops a superseded answer only after that (`if (current) live = answer.deck`).
  - Failure scenario:
    - Slide `two.md` is too tall and drawn on its tile. In the deck's `present.yml` the reader retypes `order: [one.md, two.md]`.
    - The request for the text in between, `[one.md, tw]`, is answered after the next keystroke. `kept()` deletes `two.md`'s entry, and the live deck drops that answer.
    - The drawn deck never loses `two.md`, so its tile never remounts and, with its size unchanged, never measures again. The finding and the chip vanish while the slide is still too tall.
  - The report's asynchronous section does not address a superseded answer, which spec.md requires ("superseded by a later one").
- B3. The deck's first slide is measured differently in the pane and on its Overview tile, and the store keeps whichever was measured last.
  - Place: `Slide.svelte:74-76` `{#if first}<p class="keys" data-key-hint>...</p>{/if}`, inside the measured `.reading`. The pane passes `first={at === 0}`. The tile (`Tile.svelte:115`), the presenter, the show route and the print route pass `first={false}`.
  - Failure scenario:
    - Slide 1 fits with 20 px to spare without the key hint. The hint adds `padding-top: 1.2em` and one line at `--slide-fs-small`.
    - Open the deck: the pane reports slide 1 too tall, although it fits in the audience window and in the PDF, neither of which draws the hint.
    - Open the Overview: the tile measures 0 and the finding goes. Leave the Overview: the pane remounts and the finding returns.
    - Findings and the rail count flip with the view, which contradicts C12's one finding per slide and deck.
  - The report does not mention it.
- B4. Two user-visible changes are missing from the report's section for the look ("Host- and user-visible changes").
  - The Settings view gains a section `Slides` under the heading `presentation`, with two number controls, `defaults.frame.width` and `defaults.frame.height` (`config/options/present.yml:7-22`). Before, the heading held only `Status chips`.
  - The YAML editor on a deck's `present.yml` completes `frame` under `deck` with its help line (`deck-schema.yml:18`). Before, it offered `title` only.
  - Failure scenario: the look at landing has no state or expected result for either, so neither is looked at before booking.

## Declined to judge

- How a slide is drawn on screen: C1, C2, C5 and C7 in the pane, the tiles, the presenter, the audience window and the PDF; the chip's look and tooltip; the Findings row opening at its line. Starting a server or driving a browser is not allowed here. The look at landing settles these.
- The desktop app's handling at run time: that Electron hands `features` to `setWindowOpenHandler`, and the hidden print window's real size. The app was not started. A run of the app with one display and a 1024x768 deck would settle it.
- Whether `scrollHeight - clientHeight` counts a horizontal scrollbar for content wider than the frame on systems with classic scrollbars, since `overflow-y: auto` makes `overflow-x` compute to auto. Not run. The look on a display with "always show scrollbars" and a slide with a wide block would settle it.
- Whether `npm run diagrams` reproduces the committed `docs/diagrams` byte for byte. It writes files, so it was not run. `tests/checks/diagrams/diagrams.test.ts` lies within `ok vitest checks` above.
- The base count of 92 tests and the C4 failing lines on the unchanged tree. Rerunning them needs the new tests written into the base copy, which this review may not change. The 97 = 92 + 5 arithmetic is consistent.
- That `t('findings.deck.too_tall')` resolves on the client. By reading, the page gets `textCatalog(...)` (`server/root/context.ts:423`), which holds the `findings` group, but nothing was drawn.

Agent usage: afd5d153ef1fe296b, claude-opus-5-5, 282804 tokens, 84 tool uses, 24 min 25 s.

## Repair round 1, refuted

Worktree /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O146, base 8c3da2a2f, snapshot /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O146-round-1. I changed no file in the worktree: `git status --short` after every run is identical to the list I took before the first run (`diff` printed nothing, then "worktree unchanged"). The two scratch folders I used (compile, c3run) are removed.

## Verification lines

1. I did not run `npm run diagrams && npm run docs:palette`, because both write files (`writeFileSync` at `utils/diagrams/diagrams.mjs:204-205` and `palette.mjs:172`). The diagrams test `tests/checks/diagrams/diagrams.test.ts` runs `staleFiles()` in memory, and it is part of `ok vitest checks` below. `npm run test:quick -- --base 8c3da2a2f`, one run:
```
test:quick: 86 changed file(s), from git since 8c3da2a2f
test:quick: 360 test file(s)
ok      ASCII gate (1.3 s)
ok      prettier (1.3 s): All matched files use Prettier code style!
ok      svelte-kit sync (3.2 s)
ok      eslint (3.1 s)
ok      svelte-check (12.2 s): 1793903592733 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (213.9 s): Duration  197.60s (transform 80.60s, setup 0ms, import 221.22s, tests 529.85s, environment 7ms)
FAILED  vitest (319.2 s)
 FAIL  |unit| tests/routes/git/zenodo.test.ts > what Publish and a new version send, and what a press that stops leaves > refuses a DOI with no Zenodo status of a record with Anonymous among two creators, with no call after the read
Error: Test timed out in 5000ms.
 FAIL  |unit| tests/data/sources/config/layers/hub-vocab.test.ts > the vocabulary a hub lays over oculus's > words a removal of a category oculus lacks and a category named twice, and keeps oculus's rows
Error: Test timed out in 5000ms.
FAILED  vitest slow (521.1 s)
 FAIL  |unit| tests/data/hubs/hub-portfolio.test.ts > the portfolio of several hubs > keeps a primary-hub id that begins with the name of a hub folder and a colon as a record of the primary, with no finding
Error: Test timed out in 20000ms.
 FAIL  |unit| tests/data/hubs/hub-portfolio.test.ts > a workspace of several hubs, every record under its hub and its key > gives a key two hubs hold two records, each project naming its own hub record, each shown by the key (C1)
Error: Test timed out in 20000ms.
test:quick: 524.5 s; failed: vitest, vitest slow
```
   - I ran each red file of my run, and each of the four files red in the builder's run, alone with `npx vitest run <file>`. Each passes:
     - `tests/routes/git/zenodo.test.ts`: `Test Files  1 passed (1)`, `Tests  51 passed (51)`
     - `tests/data/sources/config/layers/hub-vocab.test.ts`: `Tests  31 passed (31)`
     - `tests/data/hubs/hub-portfolio.test.ts`: `Tests  16 passed (16)`
     - `tests/data/hubs/website-files.test.ts`: `Tests  41 passed (41)`
     - `tests/server/edit/config-key.test.ts`: `Tests  36 passed (36)`
     - `tests/state/sessions/terminal/latex-fast-failure.test.ts`: `Tests  1 passed (1)`
   - Whether the round can influence each of them through its imports:
     - zenodo, hub-vocab, hub-portfolio, website-files and config-key all import `loadConfig` from `src/lib/data/sources/config.ts`. That module re-exports `frameSetting` from `settings/present.ts` (`config.ts:108`), which the round changed (item 7), and `loadConfig` reads `config/defaults/present.yml` and `config/options/present.yml`, whose comment lines the round changed (item 6). So the round reaches these five files by import. Each failure is a timeout under load, and each file passes alone. I do not count them.
     - `latex-fast-failure.test.ts` is a file the step changed: a type-only import path, `settings/latex.ts` to `settings/writing/latex.ts`. It imports `builds.ts`, whose only change is the same type import. The round changes neither file and nothing either imports. Its red in the builder's run (`expected ... to have a length of 2 but got 14`) cannot come from the round. It passes alone and passed in my run.
2. `npx vitest run tests/data/sources/present.test.ts tests/data/sources/config/settings tests/checks/config/config-folder.test.ts tests/checks/config/integrity.test.ts tests/server/desktop/window-guard.test.ts` prints `Test Files  6 passed (6)` and `Tests  163 passed | 9 skipped (172)`. The same as the builder's.
3. The first grep prints only `src/desktop/decide/place.ts:75:const AUDIENCE_SIZE = { w: 960, h: 540 } as const;`. The second grep, `grep -rn "1280\|\b720\b" src --include='*.ts' --include='*.svelte'`, prints only `src/desktop/decide/place.ts:18:const DEFAULT_SIZE = { w: 1280, h: 800 } as const;`.
4. The perl ASCII gate over `src tests bin config` prints nothing (rc 0). `LC_ALL=C grep -n '[^ -~]'` over the 77 touched files prints nothing (rc 1). The 77 files come from `git status --short`, with untracked folders expanded and `.svg` files left out. `grep -c '[^ -~]'` gives 0 for each `docs/diagrams/*.svg`.
5. `wc -l`, the largest files:
   - `context.ts` 878, `data/index.ts` 862, `builds.ts` 850, `model/index.ts` 836, `status.ts` 684, `read.ts` 675, `present.svelte.ts` 556.
   - The largest component is `Present.svelte` at 518. `Findings.svelte` is 296, `Stage.svelte` 134, `Framed.svelte` 37.
   - `live.svelte.ts` is 59 and `settings/present.ts` 87.
   - Items per folder (`ls | wc -l`): `config/settings` 10, `settings/writing` 2, `present/screen` 4, `present/acts` 5, `tests/data/sources/config` 10, `tests/data/sources/config/settings` 3, `state/workbench/navigation` 10.
6. `sh utils/unused-exports.sh` prints 335 lines, and the base's `unused-exports.txt` has 335. `diff` prints nothing (rc 0).
7. Rename greps over `src tests config docs README.md`:
   - The old import paths (`settings/latex`, `settings/lint`, `config/settings.test`, with the `settings/writing/` lines left out): no hits (rc 1).
   - `FRAME_WIDTH|FRAME_HEIGHT|AUDIENCE_FEATURES`: no hits (rc 1).
   - `AUDIENCE_SIZE`: `place.ts:75,118,119,149,150`.
   - `Printer` and `printPdf`: `preload.cjs:33`, `app.ts:37,151`, `print.ts:46`, `bridge.ts:50,124`, `stores/desktop.ts:91`, `export.ts:94`. Each carries the frame.
   - The round removes `drawn` from `createLive`'s `Reads`, and the round's one caller, `Present.svelte`, is carried. The new names `kept` and `pageFindings` are used only at the sites listed under item 3 and item 5 below.
8. History-word grep (the words of spec.md:44):
   - Over the 91 lines the round adds (the `+` lines of the delta and of the `live.svelte.ts` diff): no hits (rc 1).
   - Over the 2049 lines the whole step adds (the `+` lines of `git diff 8c3da2a2f` over `src tests config docs/HELP.md docs/templates.md`, and every untracked file under `src` and `tests`): no hits.
9. By reading:
   - The round adds no Markdown list item.
   - The YAML comment at `config/defaults/present.yml:1` and the `groups:` line at `config/options/present.yml:36` are one line each.
   - One comment the round changed is not rewrapped as a paragraph: `slide.css:5-8`, Standards St1.
   - Of the sentences the round adds, one is long: `Stage.svelte:15-18`, about 55 words, joined by "so" and "and". The standards pages set no word limit for a comment, so I raise no finding on it.

Commands the round's section quotes, run again in the same form:
- `grep -n "1040" src/lib/themes/slide.css src/lib/views/academic/present/Slide.svelte` prints `slide.css:4`, `slide.css:16` and `Slide.svelte:5`. Matches.
- The `svelte/compiler` program (client, runes), in a scratch folder outside the worktree:
  - `Framed.svelte`:
    - `25: const drawing = $.derived(() => JSON.stringify([` over `$$props.deck.root`, `$$props.deck.path`, `$$props.row.key`, `$$props.row.title` (lines 26-29)
    - `41: get drawing() {` and `42: return $.get(drawing);`
    - `44: onmeasure: (over) => measured($$props.deck, $$props.row, over),`
  - `Stage.svelte`:
    - `36: drawing = $.prop($$props, 'drawing', 3, '');`
    - `45: $.user_effect(() => {`, `46: const element = $.get(drawn);`, `47: const report = $$props.onmeasure;`
    - `50: $.snapshot(drawing());`
    - `52: if (element === null || report === undefined) return;`
    - `57: const hint = element.querySelector('[data-key-hint]')?.offsetHeight ?? 0;`
    - `59: report(Math.max(0, element.scrollHeight - element.clientHeight - hint));`
    - `62: const observer = new ResizeObserver(measure);`, `64: observer.observe(element);`, `66: for (const child of element.children) observer.observe(child);`, `68: return () => observer.disconnect();`
  - Matches the builder's lines.
- `grep -n "kept" src/lib/state/life/present.svelte.ts src/lib/views/academic/present/acts/live.svelte.ts` prints `present.svelte.ts:147,155,171,284,317,318,398` and `live.svelte.ts:5,32,49`. Matches.
- `grep -rn "pageFindings" src` prints `rail-badges.svelte.ts:22,224`, `status.ts:493` and `Findings.svelte:59,93`. Matches.
- `grep -rn "registry.refused(), ...present" src` prints `src/lib/state/workbench/navigation/status.ts:497:    return [...registry.refused(), ...present.findings()];`. The report says it "prints nothing": Proof P2.
- `python3 -c "import yaml;..."` prints `yaml ok`. Matches.
- `tests/checks/imports/order.test.ts` alone prints `Test Files  1 passed (1)`, `Tests  13 passed (13)`. Matches.
- `awk 'length > 100'` over the round's files prints `Slide.svelte:74: 134` and `Present.svelte:438: 105`. The base has `Slide.svelte:71: 134` and `Present.svelte:438: 105`. Matches.
- The line counts the report quotes match `wc -l`.
- I also ran:
  - `deckFrame` over the C3 inputs, as a case run outside the worktree, since the round changed `deckFrame`. `{1024,768}` gives the frame. Each other input gives one fault: `{width:1024}` missing height; `100` range; `1024.5` whole; `'1024'` number; `-1024` range; `depth` key; `null` not-a-map; `'wide'` not-a-map; `{width:null}` number.
  - C9: `OCULUS_TEST_HUB=$HOME/workspace/research-hub node tests/data/real-hub.probe.ts` prints `manifest findings: 0`, `registry findings: 0`, `collection findings: 0`, `config findings: 0` and `snapshot findings: 0`. `tests/checks/config/integrity.test.ts` with `OCULUS_TEST_HUB` set prints `Tests  14 passed (14)`.

## Verdicts, the round's eight items

1. Holds. `slide.css:16` reads `--slide-reading: min(1040px, calc(var(--slide-width) - 2 * var(--slide-pad)));`. The head of `slide.css` and `Slide.svelte:4-8` say it. The report's look list names 1040 px and 896 px (`O146-report.md:538`). The comment's wrap is Standards St1.
2. Holds.
   - `Stage.svelte` takes `drawing`, and the effect reads it through `$.snapshot(drawing())` (compiled line 50).
   - `Framed.svelte` passes it as a getter over a derived value made of the deck's root and path and the slide's key and title (compiled lines 25-29 and 41-42).
   - A change of slide or of title reruns the effect: the old observer is disconnected and a new one observes the frame and its children again. The `onmeasure` closure reads the current `$$props.row`, so the finding carries the new title.
   - Nothing is remounted.
   - A change to a slide's `source` alone is not measured again: Behaviour B1.
3. Holds as ruled.
   - `answered()` holds no `kept` (`present.svelte.ts:296-300`). `load()` calls `kept(answer.deck)` (`:284`).
   - `live.svelte.ts:46-50` returns on `!current` before `live = answer.deck` and `kept(answer.deck)`. A dropped answer reaches the store not at all.
   - The deck query is marked only with `'wait'` (`present.svelte.ts:249,254,258-262`). `query-core` runs one fetch per key at a time, and the query is never cancelled, so `load()` answers arrive in order.
   - The case the builder names is real. It follows from the ruling's choice of the saved deck's answer as kept: Spec S1.
4. Holds by reading. Stage subtracts the `[data-key-hint]` element's `offsetHeight`. The hint's CSS is `margin: auto 0 0; padding-top: 1.2em` (`Slide.svelte:91-96`), so when the column overflows, its top margin is 0 and the hint adds exactly its `offsetHeight`. The result is clamped at 0. That makes the measure equal to the overflow without the hint, wherever the slide is drawn. The on-screen check is the look.
5. Holds. `pageFindings(registry, present)` is at `status.ts:488-498`. `Findings.svelte:93` and `rail-badges.svelte.ts:224` both read it. The only spread left is inside `pageFindings`.
6. Holds. `config/defaults/present.yml:1` and the `groups:` line at `config/options/present.yml:36` say that a deck changes `defaults.tag_tones` under its own `defaults:` and the frame under `deck.frame`. YAML parses.
7. Holds.
   - The fallback to `not-a-map` after the loop is gone.
   - `sides` is a `Record<Side, number>` filled by `held as number` after `valueProblem` passed. For a `number` control, `valueProblem` returns `{ kind: 'number' }` for anything not finite (`value-rule.ts` `case 'number'`).
   - The C3 case run reproduces every fault.
8. Holds. The Settings section `Slides` and the editor completion of `frame` are in the report at `:543-544`.

## Verdicts, What to build (the whole diff since the base)

1. Holds. The round changes only comments and `deckFrame`'s narrowing here, and the settings folder and the C3 run pass.
2. Holds.
3. Holds. The reading column is 1040 px at 1280 and 896 px at 1024, from the `min()` at `slide.css:16`.
4. Violated, in part: Behaviour B1. Spec S1 is the ruled design itself and goes to the orchestrator. The first review's B1, B2 and B3 and its P1 are closed by reading and by the compiled lines above.
5. Holds. The round does not touch the reader. The C8 rows of the first review were not repeated.
6. Holds. The comments say the deck's frame and the new reading column. `HELP.md:331` names no column width or key hint. The comment's wrap is Standards St1.

## Verdicts, cases

- C1: met. The reading column is 1040 px at 1280 by `slide.css:16`, read. The first review ran the reader for the deck's frame, and the round does not touch the reader.
- C2: met. 896 px at 1024 by the same line, read. The `audiencePlace` run is unchanged by the round.
- C3: met, by my `deckFrame` case run.
- C4: met. The settings folder passes in item 2.
- C5: met by reading. A slide shortened while it is not drawn is measured when it is next shown, through `drawing`.
- C6: met by reading.
- C7: met by reading.
- C8: met. The first review ran it, and the round does not touch the reader.
- C9: met, by the probe and the integrity run.
- C10: met. The first review ran it, and the round does not touch the bridge.
- C11: partial: Spec S1. For a deck drawn from its files, the saved deck's answer prunes as asked. While a pane draws drafts, the saved deck's answer prunes a slide the pane still draws.
- C12: met by reading. The key is the deck's root and path and the slide's key, and B3 of the first review is closed.
- C13: met by reading.

## Spec

- S1. The ruled rule for which answer is kept removes the measure of a slide a pane is still drawing.
  - Place: `src/lib/state/life/present.svelte.ts:283-284`
    ```
    +        if (answer.deck !== null) kept(answer.deck);
    ```
    and `src/lib/views/academic/present/acts/live.svelte.ts:47-49`
    ```
    +                if (!current) return;
    +                live = answer.deck;
    +                if (answer.deck !== null) kept(answer.deck);
    ```
  - What is wrong: the store keeps one measure per deck and slide. Two versions of one deck can be drawn on one page at once: the saved one and the one read over the drafts. A kept answer of either version prunes the measures of the other, and no Stage measures again, because neither the `drawing` text nor any size changes.
  - Failure scenarios, by reading:
    - The builder's case, confirmed. The pane draws the deck read over the drafts, in which slide X is added and is not on disk, and X is measured too tall. The reader then saves another file of the deck. The `files` push marks the deck query, and `load()` calls `kept` with the saved deck, which lacks X. X's finding and its tile mark go while X is still drawn too tall.
    - The mirror case. One pane presents the deck, so it draws the saved deck (`drafts: () => (presented ? [] : drafts)`, `Present.svelte`). A second pane on the page draws the drafted deck, from which the reader has cut slide Y. The live answer's `kept` removes Y's measure while the presenting pane still draws Y too tall.
    - A drafted slide that is not on disk keeps its finding after it stops being drawn. X measured too tall in the drafted deck stays in Findings after the draft is closed unsaved. `live` becomes null with no `kept`, and the saved answer the pane draws next was held before X was measured, so nothing prunes X until the next push.
  - Who it falls to: the brief's item 4 ("when a deck's answer arrives again, its slides no longer in it leave the map") and ruling 3 of the round both make the saved deck's answer prune. The builder built the ruling and named the first case. This is for the orchestrator.
  - Options:
    - (a) The pane hands `kept` the deck it draws, saved or drafted, from an effect over its `deck`, and `load()` calls nothing. This closes the first and third scenarios. It leaves the mirror case.
    - (b) As (a), with a measure pruned only when no pane draws a deck that holds its slide. This closes all three, at the cost of a count of drawn decks in the store.
    - (c) Keep the ruling. This is the lazy option, since it leaves a drawn slide too tall out of Findings.
  - My judgment: (a) is the smaller change that ends the common case. Only (b) ends the mirror case.

## Proof

- P1. The first part of the report states what the round made false, and the look is taken from the report.
  - Place: `.scratch/migration/agents/reviews/O146-report.md:322`
    ```
    - A deck answer arriving after a measure: `kept()` removes the measures of slides the answer does not hold. A slide still held keeps its entry until its Stage measures again. A changed `deck.frame` changes the frame's size, and a changed title or row changes the `onmeasure` prop, which re-runs Stage's effect. Either way the slide is measured again.
    ```
    `:328`
    ```
    - C1: open the portfolio deck in Present. ... except that the reading column of text slides is 1152 px wide instead of 1040 (J2).
    ```
    and `:3`, Decision J2, "widens the reading column of a 1280 deck".
  - What is wrong:
    - The compiled `onmeasure` is a plain property, so the claim at `:322` is still false. The rerun now comes from `drawing`, which the Repair round section says.
    - `kept()` no longer runs on every answer.
    - The column at 1280 is now 1040 px, not 1152.
    - The Repair round section, which states the true facts, does not withdraw these lines.
  - Failure scenario: the look at landing is taken from "Host- and user-visible changes". Its C1 line expects 1152 px, so the 1040 px column, which is what item 1 asks for, reads as a defect. Or one of the two expectations is skipped.
- P2. One quoted check does not reproduce.
  - Place: `O146-report.md:427`, "`grep -rn "registry.refused(), ...present" src` prints nothing".
  - My run of that exact command prints `src/lib/state/workbench/navigation/status.ts:497:    return [...registry.refused(), ...present.findings()];`.
  - The conclusion holds: the two call sites are gone, and the one spread left is inside `pageFindings`. The printed output stated is false.
  - Failure scenario: a reader who reruns the check to confirm item 5 gets a hit and cannot tell from the report whether it is expected. Low.

## Standards

- St1. The comment the round edited in `slide.css` is not rewrapped as one paragraph (spec.md:45).
  - Place: `src/lib/themes/slide.css:5-8`
    ```
    +   and in a frame too narrow for that it is the frame's width less the padding on both sides (896
    +   px in a 1024 frame). The
    +   Present pane scales the frame to its box and the print route prints it at scale 1, both through
    +   this one class. */
    ```
  - Line 6 is 27 columns and ends inside the paragraph ("The"). The wrap also splits "896" from "px".
  - Prettier does not rewrap CSS comments, so the check passes over it.
  - Failure scenario: none at run time. It breaks the rule that every edited comment is rewrapped, and the landing has to fix it.

## Behaviour

- B1. The text that makes the Stage measure again leaves out the slide's source, so a slide that moves inside its file keeps the old line in its finding.
  - Place: `src/lib/views/academic/present/screen/Framed.svelte:32`
    ```
    +    const drawing = $derived(JSON.stringify([deck.root, deck.path, row.key, row.title]));
    ```
  - What is wrong:
    - The finding's `line` is the `source.line` stored at the last `measured` call (`present.svelte.ts` `measured`, `next.source`).
    - A slide's key is `${entry.file}#${number}` (`read.ts:364`), so it does not change when the slide's line does.
    - `kept()` does not refresh the stored source.
  - Failure scenario:
    - A file holds two slides. Slide 2 is too tall and drawn on its Overview tile, or in the pane.
    - The reader adds two lines to slide 1, which still fits. The drafted deck answers with slide 2 at a line 2 later, with the same key, title and size.
    - `drawing` is unchanged and no size changes, so `measured` is not called. Findings opens slide 2's finding two lines above the slide until something else makes the Stage measure again.
  - Item 4 of the brief requires the finding's `line` to be the slide's `source.line`, and the round's item 2 has the finding name "the slide as drawn".
  - Adding `row.source?.path` and `row.source?.line` to the text would end it. Low.

## Declined to judge

- `npm run diagrams` and `npm run docs:palette`, as commands. Both write into the worktree, which this review may not change. That the committed diagrams match the source is covered by `tests/checks/diagrams/diagrams.test.ts` inside `ok vitest checks`. No check of `docs/palette.md` was run.
- Whether the Stage's new measure is right on screen:
  - the key hint subtracted on the pane's first slide;
  - a newly shown slide measured when the right arrow is pressed;
  - the first slide's finding not flipping when the Overview is opened and closed;
  - the 1040 px and 896 px columns;
  - the Settings section `Slides` and the editor's `frame` completion.
  
  Starting a server and driving a browser are not allowed here. The look at landing settles these, with the states at `O146-report.md:536-544`.
- Whether `ResizeObserver` delivers its first observation after Svelte has put the new slide's DOM in place, so the new slide is what is measured. By reading, the effect runs after the render effects of the same flush, and the observer's callback runs after layout. Not run. The look settles it.
- The C1, C2, C8 and C10 runs of the first review (the deck reader over a scratch deck, `audiencePlace`, `wholeFrame`), which I did not repeat. The round changes none of `read.ts`, `kinds.ts`, `place.ts` or `bridge.ts`, which `git diff 8c3da2a2f` against the snapshot shows: none of them is in the delta.
- Whether `latex-fast-failure.test.ts:65` (14 reads where 2 are expected) also fails on the base under the same load. Settling it needs a run of the base copy's test while the full list runs.

Agent usage: a2d2a3b6eaecb28b4, claude-opus-5-5, 227871 tokens, 67 tool uses, 18 min 28 s.

## Closed

- Repair round 1, Spec S1: closed at landing by option (b). The Present store keeps the deck each pane draws, `drawing(pane, deck)` in `src/lib/state/life/present.svelte.ts`, and a slide's measure leaves the store only when neither the saved deck's answer nor any deck a pane draws holds the slide (`prune` and `holds` in the same file); `load()` calls `prune` with the saved deck. `src/lib/views/academic/present/acts/live.svelte.ts` is `createDrawn`, which hands the store the deck its pane draws and takes it back when the pane goes, and `Present.svelte` draws `createDrawn`'s deck. This closes the builder's case, the mirror case and the drafted slide left in Findings. Option (a) left the mirror case; option (c), keeping the ruling, was the lazy option.
- Repair round 1, Behaviour B1: closed at landing. The `drawing` text of `src/lib/views/academic/present/screen/Framed.svelte` holds `row.source?.path` and `row.source?.line`, so a slide that moves inside its file is measured again and its finding carries the new line.
- Repair round 1, Standards St1: closed at landing. The head comment of `src/lib/themes/slide.css` is one rewrapped paragraph.
- Repair round 1, Proof P1 and P2: lines of the builder's report (`O146-report.md:3`, `:322`, `:328`, `:427`), which stays the builder's record. The booking and the landing report state the facts in their place: the measure reruns through `drawing`, the column is 1040 px at 1280, and the grep of `:427` prints the one spread inside `pageFindings` (`status.ts:497`).
- Found at the look, from round 1's item 1: the column measured 894 px in a 1024 frame, not the 896 px the comments, the report and this review's lines 285, 310 and 318 state. `.reading` is `width: 100%` inside the frame's content box (`Slide.svelte:81-88`), and the frame is `border-box` with a 1 px border, so the column is the frame's width less 128 px of padding and 2 px of border; the `calc` term of the `min()` never binds. Closed at landing: `--slide-reading` is `1040px` as on the base, `--slide-width` (set in `screen/Stage.svelte` and `routes/present/print/+page.svelte`) and `--slide-pad`, which nothing else read, are removed, and the head comments of `slide.css` and `Slide.svelte` state the column as drawn.
- First review, the G13 line of `agents/guarded.md`: fixed at landing, naming `tests/data/sources/config/settings/settings.test.ts` and `writing.test.ts`.
- Found at the look, from round 1's item 4: with the forty-item slide first in a 1024 by 768 deck, the pane, which draws the key hint, measured 911 px over and the Overview tile 912 px, so the slide's one finding changed with where it was drawn. The Stage took the rounded `scrollHeight` (1753 of 1753.375) less the hint's rounded `offsetHeight` (76 of 75.59). Closed at landing: `screen/Stage.svelte` takes the content's height and the hint's unrounded, in the frame's own px, and rounds the difference once; the pane and the tile then both give 912 px, and the finding read 912 px before and after the Overview was closed and opened again. The Stage's head comment no longer says it sets the width the reading column is made from.
