# Step O39 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/migration-O39, base e9fd29162)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

Scope: part A only (items 1 to 5 and the part A cases). Every command ran from `tools/oculus` in the worktree with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`, in the foreground. Nothing was written in the tree: `git status --short | md5` and `md5 -q docs/diagrams/* | md5` give the same values before and after the run (`ec37e2d2...`, `0d132ae5...`). Verify item 1's `npm run format` was not run, since it rewrites files. Its read-only form, prettier inside `test:quick` plus `npx prettier --check` on the two new YAML files, ran instead.

## Verification (rerun by the reviewer)

```
npm run diagrams && npm run test:quick -- --base e9fd29162
  docs/diagrams/*.dot and *.svg rewritten byte-identical (fingerprint unchanged)
  test:quick: 50 changed file(s), from git since e9fd29162
  test:quick: 112 test file(s), 9 essential
  ok      prettier (0.6 s): All matched files use Prettier code style!
  ok      ASCII gate (0.8 s)
  ok      svelte-kit sync (2.1 s)
  ok      eslint (1.6 s)
  ok      svelte-check (6.3 s): 1792540619531 COMPLETED 531 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
  ok      vitest (36.7 s): Duration  30.81s (...)
  test:quick: 39.0 s (limit 45.0 s); every command passed
  test:quick: not covered: tests outside the selection, tests/checks, slow tests, build, lint of unchanged files; npm run test:landing runs them

npm run check
  1792540696295 COMPLETED 4248 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

npx vitest run tests/state/system/settings/theme-groups.test.ts tests/shell/keys/theme-rows.test.ts tests/data/helpers/code-theme-pairs.test.ts tests/checks/config/config.test.ts tests/checks/config/config-folder.test.ts tests/server/desktop/window-guard.test.ts
  Test Files  6 passed (6)
  Tests  98 passed | 2 skipped (100)

python3 -c "import yaml; [yaml.safe_load(open(f)) for f in ('.agents/plan.yaml', '.oculus/project.yml', 'config/defaults/appearance.yml', 'config/options/appearance.yml')]"
  exit 0

the perl character gate of spec.md over the 49 changed or new paths of `git status --short --untracked-files=all -- .` (the ledger left out)
  no output, exit 0

npx vitest run tests/checks/diagrams --testTimeout 0 --hookTimeout 0
  Test Files  2 passed (2)
  Tests  48 passed (48)

Part A cases and the commands the builder's report quotes:
python3 ~/.local/share/ordo-stable/skills/ordo-init/templates/check_config.py .
  note: worktree_paths not set, default [] applies  (and eight more notes, as the report quotes)
  ok: .agents/plan.yaml carries every required key, no unknown key, and every page it names exists
  exit 0
test -e .scratch/ROADMAP.md / .scratch/migration/orchestrator-state.md / .scratch/migration/agents/spec.md
  0 / 0 / 0
python3 -c "...list(yaml.safe_load(open('.oculus/project.yml')))"
  ['title', 'type', 'tier', 'status', 'eli5', 'next', 'links']
npx prettier --check .agents/plan.yaml .oculus/project.yml
  All matched files use Prettier code style!  exit 0
readlink AGENTS.md
  CLAUDE.md
npx vitest run tests/checks/tree/boundaries.test.ts
  Test Files  1 passed (1)   Tests  11 passed (11)
node utils/migrations/convert-vscode-themes.ts --check
  19 themes up to date   exit 0
grep -n "vscode-dark-modern\|#181818\|#cccccc\|-high-contrast\|includes('light')" src/lib/data/helpers/editor/code-themes.ts src/lib/state/shared/words/appearance.ts src/desktop/decide/window-options.ts
  no output, exit 1
grep -n "theme picker\|toggle of the" config/options/appearance.yml DESIGN.md
  no output, exit 1
python3 yaml.safe_load over config/defaults/appearance.yml themes:
  49 rows; 0 without label; 0 bad []
  groups: Terminal, dark 21 | VS Code, dark 11 | Terminal, light 7 | VS Code, light 6 | Oculus 2 | VS Code, high contrast 2
  code: None 30 | vscode 19
npx vitest run tests/data/helpers/code-theme-pairs.test.ts --reporter=verbose
  the six "<vscode> and <shiki> over 16434 scopes: N differ, first ..." lines, identical to the report's block (5345, 4234, 6157, 4780, 9708, 9708)
  Test Files  1 passed (1)   Tests  1 passed (1)
npx vitest run tests/checks/config tests/checks/look --testTimeout 0 --hookTimeout 0
  Test Files  6 passed (6)   Tests  173 passed | 9 skipped (182)
sh utils/unused-exports.sh, diffed with .agents/worktrees/O39-base/unused-exports.txt
  no difference, exit 0
sh utils/folder-check.sh
  exit 0
npx vitest run tests/server/edit/config-key.test.ts tests/state/system/settings/row-writer.test.ts   (existing write tests of a VS Code code_theme, run because codeThemeIds now takes the config)
  Test Files  2 passed (2)   Tests  18 passed (18)
```

Not rerun: the report's `npx vitest run --tagsFilter '!slow'` over "the 103 files the second quick run selected", because the report does not give the list and no decision rests on it. The reviewer's own quick run covers the same selection.

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `check_config.py` reports ok. Every key of the hub's `oculus` block is carried, with paths from the new root and `worktree_paths` left out. `standards` is `[.scratch/migration/agents/spec.md]`, as item 1 dictates, where the hub file has `[]`. The head comments are rewritten for one project and prettier passes.
- 2: holds. The `.gitignore` diff adds `.agents/*` and `!.agents/plan.yaml`. The ignore behaviour is under "Declined to judge".
- 3: holds. The manifest has exactly the seven keys, `title: 'Oculus'`, `type: active`, `tier: personal`, `chips: [building]`, a two-sentence `eli5`, `links: []` and no `focus`. `next` points at `.scratch/ROADMAP.md`, which is still the old cockpit roadmap, so a pointer is the reasonable reading.
- 4: holds. `CLAUDE.md` holds every rule group item 4 lists and the pointer to README, DESIGN and HELP. It holds no research rule, hub path, date or incident (read whole), and `AGENTS.md -> CLAUDE.md`. Standards 5 and Spec 2 are found in it, but neither makes the item violated.
- 5: violated, on the sub-bullets "The desktop start theme" and "The window colours before paint" (Behaviour 1). The other sub-bullets hold:
  - groups on all 49 rows;
  - the `group` and `code` fields, with help;
  - the false help corrected (grep prints nothing);
  - `themes.ts` reads `group` and reports it;
  - `Theme.group`, with app themes under `offer.appTitle`;
  - `listsOf(...).groups('themes')`;
  - `VSCODE_THEMES` and the name rule removed, the VS Code code themes read from the shipped `code: vscode` rows, and every listed reader of `codeThemeIds()`, `codeThemeInfo()` and `isCodeTheme()` passing the config;
  - the convert `--check` comparing the rows with the rules entries and `uiTheme`;
  - labels capitalised;
  - the high contrast groups;
  - the duplicates compared, with `hidden: []` because every pair differs;
  - `APP_THEME`, `WINDOW_BACKGROUND`, `SYMBOLS` and `WINDOW_FILL` removed;
  - the new words in `config/text/`;
  - DESIGN.md and HELP.md updated.
- 6 to 16: not applicable, part B/C, not yet run.

Cases of the brief's "Cases":

- The new plan configuration: met, through the `check_config.py`, `test -e` and `yaml.safe_load` runs above.
- The `.gitignore` lines: not verifiable here. `git check-ignore -v .agents/worktrees/x` and `git check-ignore --no-index .agents/plan.yaml` in the new repository after part B settle it. `git status --short` in the hub lists `?? tools/oculus/.agents/`, so `plan.yaml` is not ignored there.
- The manifest: met, by the key list above.
- The layer rule: met, since `boundaries.test.ts` passes. Its desktop half cannot fail: the test reads only modules under `src/lib` (`tests/checks/tree/boundaries.test.ts:2,17`), so no row governs `src/desktop/windows/start-colours.ts`. Existing desktop files already import `lib/server` and `lib/data`.
- Prettier: met.
- The rules file: met, by `readlink`, the gate and the reading. Standards 5 and Spec 2 are noted.
- A grouped row and a loose row in the Settings choice: met, by `theme-groups.test.ts` 'draws a row with a group under its heading and a row with none before the groups', read and run.
- A `group` that is a number or empty: met, by `config.test.ts` 'names a theme row whose group is a number or empty, and draws it before the groups'.
- Rice Pack under its title in both lists: met, by `theme-groups.test.ts` "draws an app's theme under the app's title, in the list and in the choice" and `theme-rows.test.ts` "draws an app's theme under the app's title".
- A workspace file that removes `vscode-dark-modern`: met, by `theme-groups.test.ts` 'keeps a VS Code code theme whose UI row a workspace file took out', which checks the group, the label and `isCodeTheme`.
- The convert script's check: met. The run prints "19 themes up to date". `rowProblems`, read at `convert-vscode-themes.ts:315-344`, names a row without a rules entry, an entry without a row and a group that differs from `UI_GROUPS[uiTheme]`.
- The code theme list with oculus's own config, 11/6/2: met, by `theme-groups.test.ts` "draws each VS Code theme in its row's group, with its row's words".
- Cmd-K's `:theme`: partial.
  - Met: the row order, the heading split, the start row and the monokai filter, by `theme-rows.test.ts`.
  - Missing: "the arrow keys skip the headings". It is not checkable here and is the look's. ArgumentRows draws the headings as bits-ui `Command.GroupHeading` with `shouldFilter={false}` on the root (`Palette.svelte:372`).
- The theme words: met, by the yaml read above and `theme-groups.test.ts` 'draws the high contrast themes of both kinds under their own headings'.
- The duplicates: met. The comparison is quoted and reproduced, and the test asserts that each Shiki id is present and that `hidden` equals the identical pairs. The test is tagged slow (`code-theme-pairs.test.ts:95`), so `npm test` leaves it out (Proof 1).
- The start theme and the window: met, as far as a test reaches, by `window-guard.test.ts` describe 'the colours of the theme a window starts on' over `vscode-dark-modern`, `mocha`, `light` and an app theme. The window on screen is the look's.
- The data rule: met, since the grep prints nothing.
- The false help: met, since the grep prints nothing.

## 1. Spec

- `tools/oculus/utils/diagrams/drawing/labels.mjs:9-11`: "the other arrows by the router's own rule, or in the layers overview and the channel and write diagrams by the rule of apart.mjs".
  - What is wrong: the file is outside the brief's "Paths this step writes". The brief names only "the head comment of `utils/diagrams/drawing/apart.mjs`" under ruling Overview drawing and does not list `labels.mjs`. The change is comment-only and keeps that head comment true. The report names the path and says the orchestrator accepted it, but the main ledger's brief does not list it.
  - Failure scenario: an outside-paths check at landing (`node utils/outside-paths.mjs <brief> <base>`) names it, and the landing either stalls or accepts a path the brief never held.
  - Verdict: none. The change is needed; the brief's path list is what is short.
- `tools/oculus/CLAUDE.md`, section "Git" through "Writing".
  - What is wrong: the file carries no rule on credentials. The hub's `CLAUDE.md` "Repo conventions" says "Treat credentials/tokens as the user's, never echo them or sync them into project folders". That is a non-research rule that binds oculus work, since oculus reads keyrings, mail and calendar tokens. Item 4's opening clause asks for "the hub rules that bind work on oculus", while its enumerated list does not name this one.
  - Failure scenario: a session started in `~/workspace/oculus` loads this file and not the hub's. It quotes a token from `~/.oculus` or a keyring read into a report or a commit, with no rule in its instructions against it.
  - Verdict: none (item 4 holds as enumerated). This is for the orchestrator or Axel to settle.
- Tests with no `agents/guarded.md` entry: `tests/state/system/settings/theme-groups.test.ts`, `tests/shell/keys/theme-rows.test.ts`, `tests/data/helpers/code-theme-pairs.test.ts`, and the new describe of `tests/server/desktop/window-guard.test.ts`.
  - What is wrong: `guarded.md`'s head says "A test exists only as the test of one entry ... A new entry needs Axel's yes", and spec.md "What every package obeys" says a step needing a new entry "stops and asks Axel for it". The brief asked for these tests and leaves the entries to the orchestrator. The report proposes entries, and no line of `plan.md` approves them.
  - Failure scenario: the step lands with four test files no entry names, and the next step's builder deletes them as tests without an entry.
  - Verdict: none. This is the orchestrator's booking at landing, as Z947 and Z966 did.

## 2. Proof

- The report's "DONE / NOT DONE" table and "The part A cases after the change": "Changed tests ... `npx vitest run ... tests/data/helpers/code-theme-pairs.test.ts ...`".
  - What is wrong: the pairs test is tagged slow (`code-theme-pairs.test.ts:95`, `{ tags: ['slow'] }`), and the report never says so. spec.md "What every package obeys" requires a slow-only case to be run alone, quoted and named in the report. `npm test` and `test:quick` leave it out: the reviewer's quick run says "not covered: ... slow tests".
  - Failure scenario: the orchestrator reads the case as guarded by `npm test`. A Shiki update makes a pair identical, `npm test` stays green, and only `test:landing` or `test:slow` catches it.
  - Verdict: none.
- `tools/oculus/tests/checks/config/config-folder.test.ts:130-136`: "+            'app_theme', ... +            'code_themes',".
  - What is wrong: a changed test with no failing line quoted from the unchanged tree. The report's first-run section quotes four test files, and this one is not among them. spec.md "What every package obeys" requires the failing line for each test the step adds or changes.
  - Failure scenario: a reader cannot tell whether the changed key list ever failed against the base, or would pass with the two keys missing.
  - Verdict: none.
- The report as a whole leaves out several things spec.md requires:
  - the grep of the added comment lines and test titles for the history words, with each hit judged ("No history in code or comments"; the reviewer's grep finds only "before its page paints" and "drawn before the groups", none of them history);
  - the greps of each changed name (`WINDOW_BACKGROUND`, `APP_THEME`, `VSCODE_THEMES`, `code_themes_vscode_*`, "picker") across `src`, `tests`, `config`, `docs`, `HELP.md`, `DESIGN.md` and `README.md`;
  - the list of the DESIGN, HELP, README, `docs/` and catalog paragraphs marked 'still true' or 'rewritten';
  - the table of every edited assertion with its before and after. For example, `window-guard.test.ts:227-243` moves from the literal `color: WINDOW_BACKGROUND, symbolColor: '#cccccc'` to a pass-through of `COLOURS`, and `config.test.ts:719` rewords the `CODE` sentence;
  - the empty, duplicate and colliding cases of each new key (`group`, `code`, `app_theme`, `code_themes.high_contrast`, `code_themes.hidden`).
  - Failure scenario: the name grep the report skipped is the one that would have found `docs/apps.md:283` and the stale `boundaries.test.ts:75-77` (Standards 2 and 3). The missing key cases hide Behaviour 1, where `app_theme` names an app theme.
  - Verdict: none.

## 3. Standards

- `tools/oculus/src/lib/data/helpers/editor/code-themes.ts:1-3,151,168`: "The rules over the theme rows of the config that the page, the server and the desktop host share: the code themes ... and the UI theme a window of the desktop app starts on"; `export function startTheme(` and `export function windowThemeClass(config`.
  - What is wrong: the file named `code-themes.ts` now also holds the start-theme rule and the class of the window's start theme. spec.md "The principles every package is judged on" says a module has one reason to change and is split into files named for what they hold.
  - What is also wrong: a second exported `windowThemeClass` with another signature stands at `src/lib/state/shared/words/appearance.ts:512`. Both run the same name-to-class lookup by `startTheme`, one over the config's rows and one over the store's list, so the rule's last step exists twice.
  - Failure scenario: a reader looking for where the window's start theme is decided does not look in `code-themes.ts`. A change to the lookup made in one `windowThemeClass` and not the other makes the host's fill and the page's strip computation disagree.
  - Verdict: none.
- `tools/oculus/tests/checks/tree/boundaries.test.ts:75-77`: "`data/helpers/editor/code-themes`, the list of Shiki's bundled themes (ids, display names, dark or light), which the server words the finding for a bad `code_theme:` from, the appearance store checks a saved pick against and the Settings view offers on its Code theme row".
  - What is wrong: the diff makes this head comment false. The module no longer carries "dark or light" (`CodeThemeInfo` has `group`), it reads the VS Code themes from the config's rows, and the desktop host and the page's strip now read its start-theme rule. spec.md "What every package obeys" says a sentence in a head comment that the change makes false is a defect.
  - Failure scenario: a reviewer of the layer table judges the module's place in the state row by this sentence and misses that the desktop host depends on it.
  - Verdict: none.
- `tools/oculus/docs/apps.md:283`: "`themes` name a VS Code colour theme file; it shows in the theme picker as `<label> (<app title>)`."
  - What is wrong: the Apps guide is not updated for a behaviour the step changes. An app's theme is now drawn under a heading of the app's title in the Settings choice and in `:theme`, and "the theme picker" names a surface the brief's premise calls nonexistent. spec.md "What every package obeys" says what an app builder meets goes into `docs/apps.md`.
  - Failure scenario: an app builder reads the guide, looks for a theme picker, and does not learn that their themes are grouped under their app's title.
  - Verdict: none.
- `tools/oculus/src/lib/state/shared/words/appearance.ts:352,435,443,450`: "since the picker keys its entries by the name"; "A theme's words in the picker"; "as the picker lists them"; "a name the picker lists".
  - What is wrong: the step renamed "the picker" to "the theme list" in the same file's head comment, in the `Theme` doc and in the `themes()` doc, and left these four. The file now names one thing two ways. This breaks the hub's "Writing docs" rule against synonym cycling and spec.md's rule to carry a renamed name to every hit or say why not. `state/system/apps/shell/shell.svelte.ts:405` and `state/shared/words/tones.ts:196` say "the picker" too.
  - Failure scenario: a reader of `appearance.ts` takes "the picker" and "the theme list" for two different things.
  - Verdict: none.
- `tools/oculus/CLAUDE.md:48`: "Accented letters in names stay. The check is `LC_ALL=C grep -n '[^ -~]' <file>`."
  - What is wrong: the check it names flags the accented letters the same bullet says stay. Run over `config/`, it prints `config/catalogs/unimath.yml:1`, which the repository's own gate passes (`ASCII_GATE`, `tests/tiers/run.mjs:25`, the perl form). spec.md's ASCII gate paragraph says the perl form replaces the grep form wherever a check names it.
  - Failure scenario: a session in the new repository runs the named grep over `config/`, gets a hit on an allowed accented letter, and "fixes" a name.
  - Verdict: none (item 4 holds).
- `tools/oculus/utils/migrations/convert-vscode-themes.ts:308-313`: "const UI_GROUPS: Record<UiTheme, string> = { vs: 'VS Code, light', 'vs-dark': 'VS Code, dark', 'hc-black': 'VS Code, high contrast', 'hc-light': 'VS Code, high contrast' };".
  - What is wrong: the group words, which ruling Theme groups and decision 8 make data in `config/defaults/appearance.yml`, are restated in code. DESIGN.md "Theming" holds themes as data under `config/`. The check could compare each row's group with its `uiTheme` without the words: every row of one `uiTheme` carries one group, distinct from the other kinds' groups.
  - Failure scenario: Axel renames the heading "VS Code, dark" to "VS Code (dark)" in `appearance.yml`. `--check` then exits 1 and names all 11 rows until the code is edited too.
  - Verdict: none.

## 4. Behaviour

- `tools/oculus/config/options/appearance.yml:43-48` with `src/lib/state/system/config/editors/sources.ts:169-170`, `src/lib/data/helpers/editor/code-themes.ts:168-180` and `src/lib/state/shared/words/appearance.ts:489`.
  - The places:
    - `app_theme` is `control: choice`, `from: themes`, help "a name of themes";
    - `case 'themes': return READY(ui.map((one) => one.name));`, where `ui = themes(inputs.offers)` includes the apps' themes;
    - the host's `windowThemeClass(config)` names only the config's rows;
    - the page's `themeFor` passes `[...list.map((theme) => theme.name), ...(offers.themes ?? []).map((offer) => offer.choice)]`.
  - What a user sees: the Settings view's `app_theme` choice offers the apps' themes, drawn under the app's title, and the server's write check accepts one (`config-sources.ts` returns null for the `themes` source).
  - With `app_theme: app:rice-pack/paper` and `theme` empty, the two sides disagree:
    - the page in the desktop window starts on the app's theme, because `startTheme` finds it in the page's list;
    - the host fills the window with the first row's colours, Light `#f1f5f9` / `#0f172a`, because `startTheme` does not find it among the rows;
    - the page's strip computation (`strip-colours.ts:41`) takes Light too.
  - What the help says: the option's help says the window "is filled with this theme's background". The report's "Host- and user-visible changes" does not state this case.
  - Failure scenario: Axel picks a dark app theme for `app_theme` in Settings. Every new desktop window flashes Light before the page paints the dark app theme, and no finding names the value.
  - Verdict: item 5 violated (start theme and window colours).
- `tools/oculus/config/defaults/appearance.yml:17,23,25,26`: "label: "Monokai"", "label: "Red"", "label: "Solarized Dark"", "label: "Solarized Light"".
  - What a user sees: with "vscode " dropped and `code_themes.hidden: []`, the code theme choice holds four pairs of rows with the same words. "Monokai", "Red", "Solarized Dark" and "Solarized Light" each appear under "VS Code, ..." and under "Shiki, ...", since Shiki's display names are the same (`node -e` over `bundledThemesInfo`: `monokai => "Monokai"`, `red => "Red"`, `solarized-dark => "Solarized Dark"`, `solarized-light => "Solarized Light"`). The choice is a native `<select>` with `<optgroup>` (`ui/forms/choice/Select.svelte:61-66`), so the closed field shows the label alone.
  - Where the report should have stated it: "Host- and user-visible changes" says the labels drop "vscode " and that every Shiki id stays. It does not say the code theme choice now offers indistinguishable pairs.
  - Failure scenario: Settings shows Code theme "Monokai". Axel cannot tell whether it is oculus's converted VS Code theme or Shiki's, which paint comments `#b1aea0` and `#88846f` (the pairs test output).
  - Verdict: none.
- `tools/oculus/src/lib/shell/window/strip-colours.ts:41` with `src/desktop/windows/windows.ts:366`: "const fill = windowColoursOf(windowThemeClass())?.background;" and "const colours = deps.colours();".
  - What a user sees: the host fills a window once, when it makes it, with the start theme of that moment. The page computes the window buttons' colours over the start theme of the config in force now.
  - Before the change, the host and the page agreed on the constant `#181818`. After a `theme` change in a running window they read two different themes' backgrounds. That matters only where the page's background or the strip is translucent.
  - Where the report should have stated it: the report lists the "fills once" judgment but not this before and after.
  - Failure scenario: Axel switches from Mocha to Light in an open window off macOS, under a theme whose strip is translucent. The overlay buttons are painted over Light's fill while the window still holds Mocha's.
  - Verdict: none.
- `tools/oculus/.oculus/project.yml`.
  - What a user sees: the brief ("What is on the tree", the manifest premise) says this file shows an Oculus card on Axel's running server at landing, through the `oculus` workspace folder. The report's "Host- and user-visible changes" lists the file only as "New repository files" and gives no before and after for the card: where it appears, with the `building` chip.
  - Failure scenario: the look at landing has no line to read the new card against, and a wrong board or chip goes unnoticed.
  - Verdict: none.

## Declined to judge

- The `.gitignore` case, which needs `git check-ignore -v .agents/worktrees/x` and `git check-ignore --no-index .agents/plan.yaml` in the new repository after part B. The reviewer runs no `check-ignore`.
- What only the page shows, which is the look at landing on TEST:
  - the `:theme` headings drawn, and the arrow keys passing over them;
  - the right-aligned heading style against VS Code's Color Theme list;
  - the Settings choices' optgroups;
  - the desktop window's fill and overlay colours on screen;
  - the Oculus card.
- What the pairs comparison measures. Oculus's converted rules carry contrast-nudged foregrounds (`vscode-map.ts:13-15`: "as are the foreground of each rule on `--panel`"). For example, Dark+ `comment` is `#84b070` in `vscode-rules.json` against Shiki's `#6a9955`, so no pair can come out identical while any rule was nudged. The test compares what the editor paints, which is one reading of the ruling "colours code identically"; whether that reading is the one meant is Axel's call.
- A workspace file that overrides a VS Code row's `group` makes the UI list draw it under the new group while the code list keeps the shipped row's group. The brief asks both that the two lists "cannot disagree" and that the code themes are read "never [from] the list a workspace file's `settings:` makes"; which governs is Axel's call.
- The cost of `startColours` at each window made (a `loadConfig` and a read of every theme sheet) and of `windowColoursOf` at each theme draw (a parse of all sheets). Neither is measured, by the builder or here.
- The first runs on the unchanged tree. They were not rerun, as the refute skill says; the tests were judged by reading.
- Whether Axel has approved the new `guarded.md` entries the report proposes. That is the orchestrator's booking (Spec 3).

Reviewer usage: a32b6d70ea5cdc87a, claude-opus-5-5, 365,215 tokens, 99 tool uses, 18.4 min.

## Repair round 1, refuted

All runs were made from the worktree `/Users/axelfaes/workspace/research-hub/.agents/worktrees/D49` (base 9337c3ad4), with `HOME=$TMPDIR/d49rr1/home` and Node v24.21.0 first on PATH. The builder's scripts were copied from `$TMPDIR/d49r1/cases` (the folder the report names, under the builder's scratchpad) into my own `$TMPDIR/d49rr1/d49r1/cases`, and run there with `python3 -I`. `git status --short` gave the same 21 step paths plus the untracked report before my runs and after them. No snapshot of the tree was taken when the round was sent, so the delta was read as the whole diff since the base, with the builder's `HELP.before-r1.md` used only to find which HELP.md lines this round changed.

```
# Verify 1 (npm run diagrams writes into docs/diagrams/, so the in-memory diagram check stands in for it, as the round brief allows)
npm run test:quick
test:quick: 20 changed file(s), from git since HEAD
test:quick: 14 test file(s), 10 essential
ok      prettier (0.6 s): All matched files use Prettier code style!
ok      ASCII gate (0.7 s)
ok      svelte-kit sync (2.3 s)
ok      eslint (2.0 s)
ok      svelte-check (10.3 s): 1791608046278 COMPLETED 454 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (18.1 s): Duration  12.69s (transform 15.52s, setup 0ms, import 27.29s, tests 9.88s, environment 4ms)
test:quick: 18.8 s (limit 45.0 s); every command passed
npx vitest run tests/checks/diagrams --testTimeout 300000 --reporter=dot
 Test Files  1 passed (1)
      Tests  46 passed (46)
# Verify 2, after the change (the base copy is read-only, see Declined)
npx vitest run tests/checks/config tests/checks/source tests/data/sources/docs.test.ts --testTimeout 300000 --reporter=dot
 Test Files  9 passed (9)
      Tests  115 passed | 1 skipped (116)
npx vitest run tests/checks/source/history.test.ts --reporter=verbose
 <check mark> ... names no package id, date or session in any comment
 <check mark> ... names no package id, date or session in any document
 <check mark> ... reads every line of a text file, every document and every comment of code
      Tests  3 passed (3)
# Verify 4
LC_ALL=C grep -n '[^ -~]' HELP.md docs/apps.md ../../docs/DATA-MAP.md DESIGN.md README.md   -> nothing, grep exit 1
perl ASCII gate of agents/spec.md over $(find src tests config -type f ! -name local.yml)   -> nothing, perl exit 0
LC_ALL=C grep -n '[^ -~]' ../../.oculus/config/layout.yml   -> nothing, exit 1
# Verify 6, 7
sh utils/folder-check.sh   -> exit 0
python3 -c "import yaml,sys; ..." config/layout.yml config/text/app.yml ../../.oculus/config/layout.yml   -> exit 0
wc -l: HELP.md 450, docs/apps.md 349, DESIGN.md 591, README.md 48, config/layout.yml 182, config/text/app.yml 258, doc-link.ts 56, docs.ts 624, Doc.svelte 209, Help.svelte 96, config-folder.test.ts 649, history.test.ts 186, ../../.oculus/config/layout.yml 13, ../../docs/DATA-MAP.md 579
# Cases (the builder's scripts, rerun)
1, 2, 7  sh c01_c02_c07.sh $W   -> "apps.md diagrams"; case 2 grep exit 1; case 7 grep exit 1. On $B: 269 output lines.
3   c03_keys.py $B $W/HELP.md   -> chords and function keys in the seven guides: 78 / missing ... : 0   (base HELP.md: 23 missing)
3b  c03b_plain.py $B $W/HELP.md   -> guide-line/key pairs: 122, NONE rows 0   (base HELP.md: 30 NONE)
4   c04_bullets.py HELP.md   -> 254 bullet/paragraph lines checked, 0 over the rule; docs/apps.md 61 checked, 0 over; awk 'length > 600' HELP.md | grep -v '^|' | wc -l -> 0
5   c05_anchors.py   -> every target "ok"; base: targets: 0 unmatched: 0
6   c06_docpaths.py   -> help arrangement doc tabs: 1 existing: 1 / hub docs entries: 5 existing: 5   (base 8/8, 13/13)
8   c08_fields.py   -> project.yml table at line 385: 46 names, [] / []; side-project table at line 464: 17 names, [] / []; project.yml field tables in the page: 1, side-project field tables: 1
    c08_deck.py   -> deck-schema leaf fields: 7; table at line 489: 7 names; missing [] ; extra []
9   c09_vocab.py   -> 15 vocab rows, every "vocab not on page: [] | page not in vocab: []"; venue_tiers assignable false: ['unrated'] | page says unrated with `assignable: false`: True
10  c10_apps.py   -> methods, channels, open write kinds, refusal words: "code not in guide: []" and "guide not in code: []" for each; closed channels 3 of 3; closed write kinds 23 of 23
12  SCRATCH_FILES=c12.test.ts npx vitest run -c vitest.scratch.config.ts (copied to the session scratchpad, since the config cannot resolve @sveltejs/kit from /var/folders)
    CASE12 tab {"id":"doc-views","view":"doc","state":{"id":"tools/oculus/docs/views.md","path":"tools/oculus/docs/views.md","label":"Views guide"}}
    CASE12 tab {"id":"doc-design","view":"doc","state":{"id":"tools/oculus/DESIGN.md","path":"tools/oculus/DESIGN.md","label":"Design"}}
    Tests  1 passed (1)
13  c13_views.py   -> view table rows: 52 | not exactly one sentence: 0 / link in a name cell: 0 / HELP.md and app.yml h1-h9 rows equal: True
extra  keys_exist.py   -> 183 key-like tokens; not found: 9 (commit.gpgsign, desktop.yml, launch.json, microsoft.json, pull.rebase, pyproject.toml, pyrightconfig.json, statusbar.yml, ui.yml), the same as the report
extra  claims.py   -> output byte-equal to the report's section 9.14 (see the note below)
```

A note on `claims.py`, the report's section 9.14 ("Numbers HELP.md states against the code"). My run prints what the report quotes. That output proves no number. Five claims print `MISSING`, and many lines match unrelated constants: "lsp edit file 5 MB" matches `ANSWER_MAX` of `literature/ask.ts`, "poll files twice a second" matches `STOP_WAIT_MS` of `desktop/app.ts`, and "fix writing 2 MB left out" matches git's 32 MB `MAX_OUTPUT`. The report quotes this without reading it. I checked the five `MISSING` numbers in the code by grep, and each holds:
- `SNAP_PX = 24` (`float-geometry.ts:18`)
- `RETURN_WAIT_MS = 3000` (`present.svelte.ts:108`)
- the console's 10,000 lines (`Console.svelte:21`)
- `PDF_PLACES_LIMIT = 50` (`pdf-place.ts:22`)
- `--dangerously-skip-permissions` (`schedules/run.ts:76`)

No decision rests on section 9.14, so I do not raise it as a finding.

### Closure of the first review's findings

- **Spec 1 (plain keys): closed.** Cases 3 and 3b give 0 missing and 0 `NONE`. My grep of the base guides for Escape, Esc, Space, Backspace, PageUp and PageDown finds each clause in HELP.md, for example `terminals.md:37` at HELP.md:148 and `files-and-search.md:31` at HELP.md:282. The seven named keys are at HELP.md:154/382, 109/331, 106/328, 46/129, 38/130, 110 and 153.
- **Spec 2 (facts no view shows): partly closed.** The seven named facts are at HELP.md:445, 446, 429, 378/436, 248 and 398, and at DATA-MAP.md:267, each found by grep. The full read misses facts, listed under Spec 2 below.
- **Spec 3 (deck fields): closed.** DATA-MAP.md:485-499 has the table and case 8 for the deck schema prints no difference. I read the table against `deck/spec.ts` and `groups.ts`: `sort` defaults to `folder` (`spec.ts:126`); a group with no `find` names project decks (`groups.ts:8`). An empty `order` is a finding (`read.ts:179`, `findings.deck.no_order`). Section 11.3 is correct that the schema has no `notes` field (`grep -c notes` prints 0).
- **Spec 4 (the Help page's tabs): closed.** HELP.md:25 matches `config/layout.yml:93` and `followDoc` (`catalogue.ts:38-48`). The tab closing into the one already showing the entry is `Doc.svelte:116-128`.
- **Proof 1 (case scripts not in the report): closed.** Every case script is given whole in section 9. My copies reproduce every output I reran. A gap remains: the locator `local_all.py`, on which section 2.3's completeness rests, is not given (Proof 1 below).
- **Proof 2 (prose pass, history grep, renamed test title): closed.** These are sections 7 and 6.1 and the history test rows of sections 8 and 10. My run of `history.test.ts` passes 3 of 3.
- **Proof 3 (the brief's premise about the "Design" tab): closed.** It is section 11.1, and `catalogue.ts:44-48` and `Doc.svelte:169-170` bear it out.
- **Standards 1 (the five pointers): closed.** `DESIGN.md:91` points to HELP.md:422-425, `:150` to 437 and 446-447, `:156` to 444, `:539` to 223 and `:566` to 229. Another pointer is now false: Standards 1 below.
- **Standards 2 (the comments): closed.** `config-folder.test.ts:1-5` now matches the check at `:364-379`. `Help.svelte:23-25` is rewritten, with one inaccuracy (Standards 2 below).
- **Standards 3 (the "not X" construction at HELP.md:270): closed.** HELP.md:294 reads "a file counts as text by its own first bytes, whatever its extension".
- **Behaviour 1 (visible changes): closed.** Section 14 names the DESIGN.md diagrams that no view draws any more, and the Apps guide and Data map tabs.

### Verdicts

Items of the brief's "What to build", over the whole diff since the base:

- **1: holds.** `ls docs` gives `apps.md diagrams`.
- **2: violated.**
  - HELP.md keeps what the selection rule says not to keep (Spec 1).
  - HELP.md drops facts of the kinds the rule keeps, without a row in the ledger (Spec 2).
  - The rest holds: the sections and Contents, the debugging keys and the `launch.yml` fence with its four bullets, the h1-h9 row in both files, the 450-line cap, 3 sentences or fewer per bullet, and every key of the guides.
- **3: holds.** Case 10 reruns clean, and the worked example is 49 lines by the report's count, which I did not recount.
- **4: holds.** Cases 7, 8 (with the deck table) and 9 rerun clean. The schema rows point to their places, line 20's sentence is gone, and the domains rule stays.
- **5: violated in part.** `DESIGN.md:146` claims HELP.md holds every Live HPC refusal word (Standards 1). The other 57 pointers I read hold, and so do `DESIGN.md:82` and `:491`. The "Design" entry is gone from `.oculus/config/layout.yml`.
- **6: holds.** Case 6 gives 1 of 1 and 5 of 5, and the hub's `docs:` order is Research approach, Agent approach, HPC how-to, Data map, Apps guide.
- **7: violated in part.** The `Help.svelte:23-25` and `Doc.svelte:24-26` comments are inaccurate (Standards 2). README.md:9, `doc-link.ts`, `docs.ts`, `config-folder.test.ts` and `history.test.ts` hold.
- **8: violated in part.** The dropped-sentence ledger lists as dropped sentences that HELP.md states. It also misses partial drops and does not give its locator (Proof 1).

Cases:

- **1: met.**
- **2: met.**
- **3: met.** There are 78 chords and function keys, 0 missing, and 122 plain-key pairs, 0 `NONE`. The fence, the five debug rows, the `local.yml` keys at HELP.md:435-439, the hub's layer at :427-433, `.oculus/` at :434 and `~/.oculus` at :441 are each read in place.
- **4: met.** 450 lines, 349 lines, and 0 lines over 600 characters.
- **5: met.**
- **6: met.**
- **7: met.**
- **8: met.**
- **9: met.**
- **10: met.**
- **11: met after the change** (inside my verify 2 run, 9 files passed). The base run is not verifiable by me (see Declined).
- **12: met.** The tab keeps its `path`. How it is drawn is for the landing look.
- **13: met.**

### Findings

#### Spec

**Spec 1. HELP.md keeps what item 2's selection rule says not to keep.**

- **Place:** `tools/oculus/HELP.md`, the lines listed below.
- **What is wrong:** item 2 says not to keep "descriptions of what a control looks like or where it sits, lists of every item of a menu, ... and repetition of what the key table or another bullet already says". The report says HELP.md has no room for more facts ("costs HELP.md lines it does not have"). At the same time, HELP.md spends text, and whole lines, on the following.

**(a) Lists of every item of a menu, toolbar or dialog:**
- :15 "(Move into New Window in the pane's and the tab's menus, Copy into New Window in the tab's, Restore into Main Window and Switch to Main Window in the popped-out one)"
- :38 "A float's menu offers Dock Left, Dock Right and Dock Bottom, Float on a docked float, Return to Page (...), Move into New Window (in the app) and Close". The effect of Return to Page is the only part to keep.
- :44, both sentences ("offers Open File..., New Text File (...), the splits, Float, Lock Group, Tab Bar, ..." and "A right-click on a tab offers VS Code's groups: Close, Close Others, ..."). The New Text File save rule is the only part to keep.
- :45 "Every text box offers Undo, Redo, Cut, Copy, Paste and Select All"
- :47 "The bar's right end carries the tab's own actions (Save, Revert File, the bookmark star, ...)"
- :73 "takes a name, what it runs, when (Off, Every hour, ...) and Run unattended"
- :252 "the Code theme menu offers From the theme, the 19 VS Code themes and Shiki's bundled themes"
- :257 "a row's menu has Copy, Copy Message and Show Documentation"
- :259 "the pane's actions refresh, clear, clear the last ten searches, collapse all"
- :269 "Open in New Tab, Open in New Window, Open in Browser and Open in Program are in the viewer's, the tab's and the Files row menu"
- :279 "The `...` menu of the view holds Add Folder to Workspace, Switch Workspace, Save Workspace As and Open Folder"
- :354 "a right-click on a button offers Edit, Schedule... and Delete ..."
- :381 "the floating toolbar over the top of the workbench offers Continue, Step Over, ..., Restart and Stop". The ledger drops this same sentence, `debugging.md:47.3`, as `A`.
- :404 "offers per conflict Accept Incoming, Accept Current, Accept Both in either order and Ignore"
- :408 "the commit's menu holds Open Changes, Copy Commit ID, Copy Commit Message, ... and the compares"
- :415 "carries four controls on hover or focus (...); its menu holds Start Claude Here and Start Codex Here"

**(b) What a control looks like or where it sits:**
- :13 "the window is a rail down the left, a status bar along the bottom and, between them, the pane tree"
- :20 "As shipped there are twelve, top to bottom: Focus, Projects, ..."
- :21 "Hovering it shows the page's name and the digit that reaches it"
- :23 "which sit in a float docked at the right edge"
- :26 "At the foot of the rail are ..." and "A fade at the top or bottom edge of the rail's list says more entries are past it, and the rail's list and the tab strips draw no scrollbar"
- :31 "the page on screen is the bold row with a check ... carries the unsaved dot"
- :37 "A floating pane has an orange border"
- :47 "under the strip as a breadcrumb"
- :51, the whole bullet: tooltip behaviour, the accent line and the dimmer strip. The ledger drops the same tooltip class (`window.md:11.2`, `:84.2`) as `A`.
- :58 "with a button at the end of each row that closes that workbench"
- :84 "as a spinner, a check ..., a cross ..., and a hammer ..." and "the whole bar is painted in the theme's orange"
- :229, the second sentence. The hue names of its first sentence are dictated by the round brief's item 5.
- :230, the first sentence.
- :232 "a label that would cover another label ... is hidden ..., a pillar's label is placed before its projects' and an archived project's label is dimmed"
- :235 "a card draws one tag per resource, a card with no subtasks offers adding the first among its controls and draws no subtasks block until it has one, and the cards of a grid are stretched to one height". Report section 2.2 lists this as added in this round.
- :251 "Under 700 px of width the table of contents hides behind a header button"
- :254 "One row per file (name, folder, number of edits) with a row per edit under it (line, the text taken out struck through, ...)"
- :257 "mark a file with its error or warning count and a folder with a dot"
- :278 "is drawn with it as one row (`a / b / c`)"
- :281 "is one line over the foot with a close control"
- :399 "grows with what is typed up to ten lines"
- :404 "shows Incoming and Current above the Result"
- :408 "drawn with dashed circles"
- :412 "a bar beside added and modified lines, a wedge where lines were deleted"

**(c) Descriptions of what a view draws:**
- :72, the tray's contents
- :82 and :83, the status bar items
- :219, what `person` and `entry` draw
- :220, the last sentence
- :234 "an opened card draws the project's fields (Status, Latest, ...)"
- :239, the Slides catalog
- :249, the Usage status words
- :250, the Audit sections, which also repeat the view table at :208
- :258, the TeX view's three sections
- :269 "with zoom, fit, find, an outline, thumbnails, ..."
- :287 "Open Editors and Timeline are closed at first; Open Editors lists the tabs ..."
- :394 "Pressing a repository shows its commit box, Changes, Graph, ..."

**(d) Repetition of the key table or of another bullet** (each pair says the same thing):
- :46 repeats :129, the whole bullet.
- :50 repeats :98 (Tab indents) and :94 (a bracket in a field).
- :64 repeats :132.
- :68, its second sentence, repeats :134.
- :328 repeats :106 (`/`).
- :331 repeats :109 and :152.
- :281 repeats :111.
- :280 repeats :112.
- :296 repeats :115.
- :257 repeats :117 (F8).
- :359, the whole bullet but its last clause, repeats :118.
- :272 repeats :124.
- :38 repeats :130.
- :315, :317 and :259 repeat :136-138.
- :401 and :412 repeat :143.
- :346 repeats :148.
- :399 repeats :150.
- :396 repeats :151.
- :382 repeats :154, in the same words.
- :344 repeats :155.
- :237 repeats :156-157.
- :283 repeats :105.
- :282 repeats :100.

Four DESIGN.md pointers lean on (b): `:554` and `:568` point to HELP.md:51, `:556` to :26, and `:565` to :235 and :232. Item 5's third option ("names the code that holds it") is the fix for those pointers. Keeping appearance text in HELP.md to serve them is not.

- **Failure scenario:** a reader looking for what HELP.md alone can tell them (a key, a file, a refusal, a limit) reads through menu lists and colour descriptions that the screen already shows. The step's decision 1 says the 450-line bound is met "only as the selection rule of item 2 cuts it". The cap was reached with text the rule excludes, and the builder then cites the cap as the reason not to keep facts (section 13.1).
- **Verdict:** item 2 violated.

**Spec 2. Facts the rule keeps are dropped with no ledger row, and one `OBS` drop makes a kept sentence false.**

- **Place:** HELP.md:356, :67, :24 and :425-426.
- **What is wrong:** the round brief's item 2 asks for every sentence of the guides to be read and each dropped one named. Section 2.3 claims "A sentence not listed here is stated in HELP.md". `sentences.py`, run on the base guides, gives these partial drops:
  - **`terminals.md:57.7`**, not in the ledger: "a line that evaluates text itself (`eval`, `sh -c`, and `$((...))` arithmetic in bash) runs the value as code". HELP.md:356 keeps only "`eval` or `sh -c` runs the value as code". `grep -n '\$((' HELP.md` prints nothing. This is a safety fact: a `${selectedText}` inside bash arithmetic runs as code.
  - **`files-and-search.md:146.6`**, not in the ledger: "a served root that is a private folder or lies inside one lists no name at all, where a search runs over it". HELP.md:67 keeps only "the machine's private folders are left out". This is the sentence D46's landing added as its fix of finding 2 (`plan.md:708`).
  - **`files-and-search.md:146.12`**, not in the ledger: each root's name listing gets `search.timeout_s` seconds, and a root that fails or runs out of time is answered with the paths read so far. This is a limit and its setting. HELP.md:67 names only `search.max_names`.
  - **`window.md:21.2`**, an `OBS` row: "A catalogue the reader has moved onto a page of their own opens the view on that page". Without it, HELP.md:24's "A click on a Views catalogue entry opens the view on the page you were on before the System page" is false for a moved catalogue. This is taken from the base guide, which I did not run.
  - **`configuration.md:52.3`**, an `R` row: the `{0}` and `{1}` placeholders of `config/text/findings.yml`, a file a reader edits by hand. `grep -n '{0}' HELP.md` prints nothing.
- Each fits as a clause of an existing bullet at no line cost.
- **Failure scenario:** a reader writes `run: echo $(( ${selectedText} + 1 ))` in `.oculus/commands.yml` believing the manual's "never read as shell text", and a selection runs as code. Another reader serving a root under a private folder finds Cmd+P empty and no sentence in the manual explains why.
- **Verdict:** item 2 violated (the round's item 2 is partly closed).

#### Proof

**Proof 1. The dropped-sentence ledger lists as dropped sentences HELP.md states, and its completeness claim does not reproduce.**

- **Place:** report section 2.3 and section 13.1.
- **What is wrong:** these rows say dropped, but HELP.md states them:
  - `window.md:21.6`, `:21.7` (with the key Shift+F10), `:21.9` and `:21.10`, at HELP.md:24 ("An entry's right-click menu (or Shift+F10) offers Open on this page and Open beside on this page, a drag onto a pane of that page opens it there, and the catalogue's own pane is never covered").
  - `window.md:39.2` at HELP.md:42 ("closing the shown tab shows the one shown before it").
  - `views.md:125.7` at HELP.md:237 ("both draw the deck as saved"), its first half.
  - `files-and-search.md:91.4` at HELP.md:317 ("also in a tab's unsaved text").
  - `debugging.md:47.3` (`A`) at HELP.md:381.
- The claim that every unlisted sentence is stated does not hold either (Spec 2). The locator `local_all.py`, whose threshold ("not mostly on one HELP.md or DATA-MAP line") chose which sentences were read, is named but not given in the report.
- **Decision that rests on it:** the ruling the builder asks for in section 13.1, to accept `OBS`, which lists these rows as drops to accept.
- **Failure scenario:** the orchestrator rules on 20 "dropped" `OBS` rows, 6 of which are kept, and accepts the claim that nothing else was dropped, while three facts are gone.
- **Verdict:** item 8 violated in part.

#### Standards

**Standards 1. `tools/oculus/DESIGN.md:146` claims more than the HELP.md section holds.**

- **Quoted hunk:** "how a failing poll looks, what Submit Job runs and each refusal word are in `HELP.md#the-views`"
- **What is wrong:** HELP.md:246-248 names `unreachable`, `changed`, `copy-failed` and `submit-failed`. `SubmitReason` (`src/lib/server/machine/hpc/submit.ts:37-52`) holds 16 words (`outside`, `not-slurm`, `no-project`, `outside-code`, `bad-cluster`, `no-host`, `no-files`, `not-sent`, `unconfirmed`, `changed`, `busy`, `closed`, `copy-failed`, `submit-failed`, `no-job-id`). Item 5 and the round brief's item 5 ask that the named section holds what the sentence says. Report section 5 marks it holding.
- **Failure scenario:** a maintainer looks in HELP.md for the meaning of `no-host` or `busy` and finds nothing.
- **Verdict:** item 5 violated in part.

**Standards 2. The two view comments are inaccurate.**

- **`tools/oculus/src/lib/views/system/help/Help.svelte:24`:** "only over a document listed in `docs:` of config/layout.yml". `config/layout.yml:182` is `docs: []`. The list is the hub's layer, `.oculus/config/layout.yml`, as the view's own `doc.unlisted` sentence says.
- **`tools/oculus/src/lib/views/sources/doc/Doc.svelte:24-26`:** "A listed document of oculus's own (the Apps guide) comes back with its diagrams cut out". `grep -c "diagrams/" docs/apps.md` prints 0, and Help.svelte says the Apps guide holds none.
- **Failure scenario:** a maintainer adds a document to the engine's `docs:` to get its diagrams drawn on this hub, and nothing changes, because the hub's layer replaces the key.
- **Verdict:** item 7 violated in part.

**Standards 3. A line the step edited keeps history wording.**

- **Place:** `docs/DATA-MAP.md:243`.
- **Quoted hunk:** "the `tools/present` build used; the build is no longer run"
- **What is wrong:** the brief's Conventions ban history wording in a document. The diff edits this line (it removes the source path), and report section 13.8 says it is "not a sentence of this step".
- **Failure scenario:** none at run time. The page carries a phrase the brief bars.
- **Verdict:** none (prose).

#### Behaviour

None.

### Judgement of the `OBS`, `R` and `HIST` rows

The standard is item 2's selection rule. Keep a key, a hand-written file with its keys and place, what is kept where, what asks first or is refused, and a limit with its setting. Also keep a fact whose absence costs work or data.

**`OBS` (20 rows):**

| Row | Judgement |
|---|---|
| `window.md:21.2` | Should be kept (Spec 2). |
| `window.md:21.6` | Kept in HELP.md (HELP.md:24); the ledger row is wrong. |
| `window.md:21.7` | Kept in HELP.md (HELP.md:24); the ledger row is wrong. |
| `window.md:21.9` | Kept in HELP.md (HELP.md:24); the ledger row is wrong. |
| `window.md:21.10` | Kept in HELP.md (HELP.md:24); the ledger row is wrong. |
| `window.md:39.2` | Kept in HELP.md (HELP.md:42); the ledger row is wrong. |
| `files-and-search.md:91.4` | Kept in HELP.md (HELP.md:317); the ledger row is wrong. |
| `views.md:125.7` | Kept in part (HELP.md:237, "as saved", which covers what unsaved text reaches). The rest, slide 1 fallback and an empty deck ending, is correctly dropped. |
| `window.md:21.8` | Correctly dropped: none of the kinds the rule keeps, and no loss. |
| `window.md:35.5` | Correctly dropped: none of the kinds the rule keeps, and no loss. |
| `window.md:88.7` | Correctly dropped: none of the kinds the rule keeps, and no loss. |
| `views.md:7.10` | Correctly dropped: none of the kinds the rule keeps, and no loss. |
| `views.md:123.3` | Correctly dropped: none of the kinds the rule keeps, and no loss. |
| `views.md:125.8` | Correctly dropped: none of the kinds the rule keeps, and no loss. |
| `views.md:125.11` | Correctly dropped: none of the kinds the rule keeps, and no loss. |
| `views.md:129.2` | Correctly dropped: none of the kinds the rule keeps, and no loss. |
| `views.md:133.8` | Correctly dropped: none of the kinds the rule keeps, and no loss. |
| `views.md:145.3` | Correctly dropped; HELP.md:48 already says text Add puts in a tab is unsaved. |
| `source-control.md:7.12` | Correctly dropped: none of the kinds the rule keeps, and no loss. |
| `files-and-search.md:144.1` | Correctly dropped: none of the kinds the rule keeps, and no loss. |

**`R` (14 rows):**

| Row | Judgement |
|---|---|
| `configuration.md:52.3` | Should be kept in part: the `{0}`/`{1}` rule of a hand-edited file. The code `R` does not fit this sentence. |
| `window.md:90.6` | Correctly dropped: a route or worker. HELP.md:67 keeps the reader's fact. |
| `configuration.md:52.1` | Correctly dropped; HELP.md:425 keeps the folder rule. |
| `configuration.md:52.5` | Correctly dropped; HELP.md:426 keeps the findings. |
| `terminals.md:37.5` | Correctly dropped: internal byte transport, nothing a reader sets or acts on. The label `R` misnames it. |
| `terminals.md:57.6` | Correctly dropped; HELP.md:356 keeps the rule. |
| `terminals.md:57.9` | Correctly dropped: the terminal prints the line. |
| `terminals.md:65.6` | Correctly dropped; HELP.md:358 keeps the diagnostics. |
| `files-and-search.md:35.1` | Correctly dropped (routes). |
| `files-and-search.md:51.6` | Correctly dropped (routes). |
| `files-and-search.md:146.1`, `:146.2` | Correctly dropped (routes). |
| `files-and-search.md:146.3`, `:146.9` | Correctly dropped (framing sentences). The ledger misses `146.6` and `146.12` (Spec 2). |

**`HIST` (1 row):** `terminals.md:61.5` is correctly dropped. It describes approvals from an earlier format, which the brief's Conventions bar from a document.

**On the ruling the builder asks for:** `R`, `HIST` and `OBS` are acceptable as reasons. None of them covers a kind the rule keeps, except for the rows named above. The builder's reason against keeping them ("costs HELP.md lines it does not have") is the lazy argument. Each row that should be kept fits as a clause of an existing bullet, and HELP.md's lines are spent on the content Spec 1 lists.

### Brief errors in report section 11

All four are correct:
- **The saved "Design" tab:** `catalogue.ts:44-48` and `Doc.svelte:169-170` bear it out.
- **`views.md:85`:** it is the Problems section (heading `## Problems` at :83).
- **No `notes` field:** `grep -c notes config/schemas/deck-schema.yml` prints 0.
- **The rail order:** `window.md:15` gives Focus, Sessions, Projects, while `config/layout.yml:10-13` gives Focus, Projects, Incoming, Sessions.

### Declined to judge

- **The base run of verify 2 and case 11.** The base copy is read-only, and vitest writes beside its config. The report's base output is a saved file from the first round (`d49b/c11-first.txt`, 02:33). I did not rerun it.
- **`npm run diagrams` itself,** which writes into `docs/diagrams/`. The in-memory diagram test stood in for it and passed (46 of 46).
- **Whether HELP.md:24 is false for a moved catalogue.** I took this from the base guide's `window.md:21.2` and did not run the catalogue.
- **The rule "a section's bullets are in the order a reader meets the things they describe."** This is a reading judgement I did not test bullet by bullet.
- **The S, L, A, T, X and G rows of the ledger (176 rows).** I read only the `configuration.md` and `debugging.md` rows besides the `OBS`, `R` and `HIST` rows.
- **The screen** (the Help page, the Views catalogue, the key sheet, the saved tabs, and the Apps guide and Data map tabs). These are for the landing look.

Reviewer usage: agent id not visible to me, claude-opus-5-5, tokens not visible to me, about 57 tool uses, about 30 minutes (my scratch folder was made at 06:53 and the report finished at 07:10, with reading before that).
