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
