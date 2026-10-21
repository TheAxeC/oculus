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

Scope: part A only. I ran every command from `tools/oculus` in the worktree with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`, in the foreground, and wrote nothing in the tree. `git status --short | md5` gave `90fb8149...` and `md5 -q docs/diagrams/* | md5` gave `aa492bc2...`, and the diagrams fingerprint was the same after `npm run diagrams`.

The round's delta is the `diff -u` of each of the 49 paths in `files.txt` against the snapshot (24 of them differ), plus `git diff e9fd29162` for the 23 changed paths that `files.txt` does not list: `docs/apps.md`, `docs/diagrams/layer-state.*`, `src/desktop/preload.cjs`, `src/desktop/windows/bridge.ts`, `src/lib/shell/window/appearance.svelte.ts`, `src/lib/state/client/socket.svelte.ts`, `src/lib/state/shared/stores/desktop.ts`, `src/lib/state/shared/words/tones.ts`, `src/lib/state/system/apps/shell/shell.svelte.ts`, `src/lib/state/workbench/ui.svelte.ts`, the 9 sheets of `src/lib/themes/rice/`, `src/lib/ui/theme/app-theme.ts`, `tests/checks/look/themes.ts`, `tests/checks/tree/boundaries.test.ts`, `tests/state/workbench/options-pages.test.ts`, and the new `src/lib/data/helpers/editor/start-theme.ts`. `src/lib/ui/theme/theme.ts` is in `files.txt` and now equals the base (`git diff e9fd29162 -- .../theme.ts | wc -l`: 0).

`npm run format` was replaced by its read-only form, `npx prettier --check .`. `utils/folder-check.sh`, which I ran, calls `git rev-parse` and `git ls-files` itself (read-only). That is a departure from the refute Rules' three git commands, and I state it here.

```
npx prettier --check .
  All matched files use Prettier code style!
npm run diagrams && npm run test:quick -- --base e9fd29162
  docs/diagrams rewritten byte-identical (fingerprint aa492bc2... before and after)
  ok      ASCII gate (0.8 s)
  ok      prettier (0.8 s): All matched files use Prettier code style!
  ok      svelte-kit sync (2.0 s)
  ok      svelte-check (6.9 s): 1792544599518 COMPLETED 531 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
  ok      eslint (7.0 s)
  ok      vitest (38.2 s): Duration  31.85s (...)
  test:quick: 40.4 s (limit 45.0 s); every command passed
  test:quick: not covered: tests outside the selection, tests/checks, slow tests, build, lint of unchanged files; npm run test:landing runs them
npm run check
  1792544663698 COMPLETED 4249 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
npx vitest run tests/checks/config/config-folder.test.ts tests/checks/config/config.test.ts tests/checks/look tests/checks/tree/boundaries.test.ts tests/server/desktop/window-guard.test.ts tests/state/workbench/options-pages.test.ts tests/data/helpers/code-theme-pairs.test.ts tests/shell/keys/theme-rows.test.ts tests/state/system/settings/theme-groups.test.ts tests/checks/diagrams tests/checks/config --testTimeout 0 --hookTimeout 0
  Test Files  14 passed (14)
  Tests  279 passed | 9 skipped (288)
node utils/migrations/convert-vscode-themes.ts --check
  19 themes up to date   exit 0
sh utils/unused-exports.sh, diffed with .agents/worktrees/O39-base/unused-exports.txt
  342 lines; no difference, exit 0
the perl character gate of spec.md over the 73 changed or new paths of `git status --short --untracked-files=all -- tools/oculus` (the ledger left out)
  no output, exit 0
python3 yaml.safe_load over .agents/plan.yaml, .oculus/project.yml, config/defaults/appearance.yml, config/options/appearance.yml, config/text/findings.yml
  exit 0

Commands the round's report quotes:
npx vitest run tests/data/helpers/code-theme-pairs.test.ts --tagsFilter '!slow'
  Test Files  1 skipped (1)   Tests  1 skipped (1)
npx vitest run tests/data/helpers/code-theme-pairs.test.ts --tagsFilter slow --reporter=verbose
  the six "<vscode> and <shiki> over 16434 scopes: N differ, first ..." lines, identical to the report (5345, 4234, 6157, 4780, 9708, 9708)
  Test Files  1 passed (1)   Tests  1 passed (1)
npx vitest run tests/state/workbench/options-pages.test.ts --tagsFilter slow
  Test Files  1 passed (1)   Tests  3 passed (3)
grep -rn --exclude=local.yml -w <name> src tests config docs utils HELP.md DESIGN.md README.md (svg left out), for WINDOW_BACKGROUND, WINDOW_FILL, APP_THEME, VSCODE_THEMES, code_themes_vscode_dark, code_themes_vscode_light, UI_GROUPS, windowColoursOf
  no output for each
  SYMBOLS: one hit, src/lib/ui/controls/editor/kit/rite/rite.ts:146, the rite grammar's word (another name)
  windowThemeClass: start-theme.ts:8,34, start-colours.ts:12,17,49, window-guard.test.ts:29,329,330,364
  startTheme: appearance.ts:39,116,127,440,447, start-theme.ts:3,17,30,42
grep -rn --exclude=local.yml -i picker ... | grep -i theme
  only colours.ts:177,210,337 (Monaco colour keys), config/defaults/appearance.yml:86 (the wallpaper picker), DESIGN.md:250 (Monaco's colour picker), DESIGN.md:739 (the repository picker)
history words over the added comment lines and test titles of `git diff -U0 e9fd29162` and the new files
  7 hits after the drawing-order and run-time senses of "before" are left out: "is still offered", "still renders a page", "is still wanted", "before each command", "before the hub's settings file", "before the words", "before the page paints"; none is history
ls src/lib/data/helpers | wc -l
  10
sh utils/folder-check.sh
  exit 0
python3 ~/.local/share/ordo-stable/skills/ordo-init/templates/check_config.py .
  ok: .agents/plan.yaml carries every required key, no unknown key, and every page it names exists
readlink AGENTS.md
  CLAUDE.md
python3 -c "...list(yaml.safe_load(open('.oculus/project.yml')))"
  ['title', 'type', 'tier', 'status', 'eli5', 'next', 'links']
npx prettier --check .agents/plan.yaml .oculus/project.yml
  All matched files use Prettier code style!
grep -n "vscode-dark-modern\|#181818\|#cccccc\|-high-contrast\|includes('light')" code-themes.ts appearance.ts window-options.ts start-theme.ts
  no output, exit 1
grep -n "theme picker\|toggle of the" config/options/appearance.yml DESIGN.md
  no output, exit 1
```

The quick tier's "56.5 s (limit 45.0 s)" and "over the time limit" are not a failure. `tests/tiers/quick.mjs:303-304` prints the time against `LIMIT_MS = 45000` (`:40`) and prints "over the time limit" when the total passes 46 s. The exit code depends only on red commands: `process.exitCode = red.length === 0 ? 0 : 1` (`:307`). My run on the same final tree took 40.4 s, within the limit. The builder's times were eslint 9.2 s and vitest 54.3 s against my 7.0 s and 38.2 s, so its run went over on machine load. The builder's quick run came before its last three comment edits, and my run covers the final tree.

### Verdicts

Items of the brief's "What to build":

- 1: holds. `check_config.py` reports ok, and the keys and paths are as item 1 gives them.
- 2: holds. The diff adds `.agents/*` and `!.agents/plan.yaml`. The ignore behaviour is part B's case.
- 3: holds as written: seven keys, no `focus`, prettier passes. The brief's premise that the manifest shows a card at landing does not reproduce (Spec, Finding 1).
- 4: holds. `CLAUDE.md:30` carries the credentials rule, and `CLAUDE.md:49` names the `ASCII_GATE` perl form. The file holds every rule group of item 4 and no research rule, and `AGENTS.md -> CLAUDE.md`.
- 5: holds.
  - The window now takes the drawn theme's background (round item 1). What is left of the first review's Behaviour 1 is open item 186, Axel's.
  - Behaviour 2 is open item 185, Axel's.
  - Every other sub-bullet holds as the first review found, and the round leaves it intact: groups on all 49 rows, `code_themes.hidden: []` unchanged (`diff` of `config/defaults/appearance.yml` with the snapshot: no output), the convert check green, the greps empty.
  - Finding 4 (Standards) is on this item's start theme, with verdict none.
- 6 to 16: not applicable, parts B and C, not yet run.

Cases of the brief's "Cases" (part A):

- The new plan configuration: met, by `check_config.py`, `test -e` (through `check_config.py`'s page check) and `yaml.safe_load`.
- The `.gitignore` lines: not verifiable here. Settled by `git check-ignore` in the new repository after part B.
- The manifest: met, by the key list.
- The layer rule: met. `boundaries.test.ts` passes with the row `'data/helpers/editor/start-theme'`, and the test reads only `src/lib` modules, as the first review noted.
- Prettier: met.
- The rules file: met, by `readlink`, the gate and reading.
- A grouped row and a loose row in the Settings choice: met, by `theme-groups.test.ts` (run green).
- A `group` that is a number or empty: met, by `config.test.ts` (run green).
- Rice Pack under its title in both lists: met, by `theme-groups.test.ts` and `theme-rows.test.ts`.
- A workspace file that removes `vscode-dark-modern`: met, by `theme-groups.test.ts:202`.
- The convert script's check: met. The run prints "19 themes up to date". `groupProblems` (`convert-vscode-themes.ts:327`), read, compares the groups by kind and holds no group words.
- The code theme list with oculus's own config, 11/6/2: met, by `theme-groups.test.ts:166`.
- Cmd-K's `:theme`: met.
  - The rows, the order, the start row and the monokai filter are met by `theme-rows.test.ts`.
  - The arrow keys skip the headings, by reading. The headings are `Command.GroupHeading` (`ArgumentRows.svelte:110`), and bits-ui moves the selection only over `getValidItems()`, which selects `[data-command-item]` (`node_modules/bits-ui/dist/bits/command/command.svelte.js:32,275-279`). A heading carries `data-command-group-heading` (`:1048`).
  - The look at landing confirms it.
- The theme words: met, by the yaml read the first review quoted (labels unchanged this round) and `theme-groups.test.ts:184`.
- The duplicates: met. The comparison is reproduced above, and `hidden: []` because every pair differs (open item 185 is Axel's).
- The start theme and the window: met, as far as a test reaches.
  - `window-guard.test.ts:289-334`.
  - `window-guard.test.ts:196`, `drawnFill`.
  - The it.each at `:344` holds the page's class equal to the host's.
  - The window on screen is the look's.
- The data rule: met, since the grep prints nothing.
- The false help: met, since the grep prints nothing.

Items of the round (`agents/briefs/O39-round1.md`):

- 1: holds.
  - `stripColours` returns `background` (`strip-colours.ts:426-464`), and the bridge carries it (`preload.cjs:35`, `stores/desktop.ts:99`, `appearance.svelte.ts:112`).
  - The host calls `setBackgroundColor(drawnFill(background))` on every system (`bridge.ts:255-263`).
  - A value that is not hex sets nothing (`window-options.ts:61`; test `window-guard.test.ts:196`).
  - The page side is checked by reading only.
- 2: violated (Finding 3).
- 3: holds.
  - `boundaries.test.ts:75-81` holds the code-themes sentence and the start-theme sentence.
  - `docs/apps.md:283` is rewritten.
  - The picker grep leaves no theme hit.
- 4: holds (`CLAUDE.md:30`, `:49`).
- 5: holds.
  - `UI_GROUPS` is gone (the grep prints nothing).
  - `groupProblems` checks one group per kind, `hc-black` with `hc-light`, and distinct groups across kinds.
  - `--check` passes on the shipped rows.
  - The red paths are checked by reading only.
- 6: violated on its last bullet, the Oculus card (Finding 2). Also its proof lacks the first runs of the round's new tests (Finding 6). The other bullets hold:
  - the slow tag, quoted and run alone;
  - the `config-folder` failing lines on a scratch base copy;
  - the history grep, reproduced;
  - the name greps, reproduced;
  - the paragraph list;
  - the assertion table, checked against the removed lines of `git diff e9fd29162` over the six existing test files;
  - the edge-value table.

### Findings

1. **Spec.** `agents/briefs/O39.md`, "What is on the tree": "so part A's manifest shows an Oculus card on Axel's server at landing". This premise does not reproduce.
   - What is there: the hub's workspace file has `research-hub` (a hub) and `oculus` at `~/workspace/research-hub/tools/oculus`, which lies inside it. `src/lib/server/files/workspace/folders.ts:194-201` marks such a folder `noProject` once it holds a `.oculus/project.yml`, and raises `findings.workspace.project_in_hub`: "the folder is, lies inside or holds the folder of a hub, so its project.yml or .oculus/project.yml is not read as a project" (`config/text/findings.yml:29`). `repositoriesOf` (`src/lib/server/files/roots.ts:93-96`) then leaves the folder out, and the hub's `scan:` (`.oculus/config.yml:7-19`) names no `tools/` folder.
   - So at landing Axel's server shows no Oculus card and gains a workspace finding on the `oculus` folder. The card appears only after part C repoints the folder outside the hub.
   - A second premise does not reproduce either: the `oculus` folder's line in `.oculus/workspaces/research-hub.yml` is 7 at the base (`git show e9fd29162:.oculus/workspaces/research-hub.yml | grep -n tools/oculus`: `7:`). The brief's "What is on the tree", part C item 15 and "Paths this step writes" say line 12.
   - Failure scenario: the look on TEST at landing looks for a card on the Personal board under "building" and finds none, plus a new finding. The orchestrator then either reads the finding as a landing defect or misses that it is expected until part C. Part C edits line 12 of the workspace file, which is no longer the `oculus` line.
   - Verdict: none on the items. This is a premise found wrong, the orchestrator's to correct or raise.

2. **Proof and Behaviour.** The round's report, item 6, "The Oculus card": "So the card is on the Personal board under "building". ... it shows only once the hub scans the repository's folder, which is part B's."
   - What is wrong: the claim of closure does not reproduce, by the reading in Finding 1.
   - Under the workspace file as it stands, the server shows no card at landing. It reports `project_in_hub` for the `oculus` folder from landing until part C changes the folder's path to `~/workspace/oculus`. Part B's clone does not change what Axel's server reads.
   - The report does not state the new finding as a host-visible change with a before (no finding) and an after (the finding on the `oculus` folder).
   - The decision that rests on it is the look at landing, which item 6 says this section is read against.
   - Failure scenario: as in Finding 1.
   - Verdict: round item 6 violated.

3. **Standards** (spec.md "The principles every package is judged on", DRY: a rule exists once). `src/lib/state/shared/words/appearance.ts:444-449`, `export function startClass(inApp: boolean)`, computes `startTheme(undefined, names, inApp ? look.appTheme : undefined, defaultTheme())` and then `byKey(byName, start)?.class`.
   - This is the start theme's name-to-class lookup a second time. `windowThemeClass(config)` in `src/lib/data/helpers/editor/start-theme.ts:34-44` is the first: `startTheme(...)` then `named.find(...)?.cls`, with the first row of a name winning in both.
   - Round item 2 asked that "the last step of the name-to-class lookup is written once". The page's old `windowThemeClass()` is gone, but `startClass`, added for the change of Finding 5, brings the same lookup back.
   - The two are held equal by the it.each test at `window-guard.test.ts:344-366`, not by one function.
   - Failure scenario: a change to how a name picks its row, for example a row with an empty name or class, made in `windowThemeClass` and not in `setAppearance`/`byKey`. The page then draws a pending app theme in one start theme while the host fills the new window with another, until the page's first send.
   - Verdict: round item 2 violated.

4. **Standards** (spec.md "What every package obeys": a sentence in a document that the change makes false). `HELP.md:508`: "A wrong value is a finding, and that option takes oculus's value."
   - What is there: for `app_theme` naming no theme, the desktop window starts on the first theme of `themes:` (Light with the shipped config), not on oculus's `app_theme` (`vscode-dark-modern`).
   - The places: `start-theme.ts:42` (fallback `names[0]`), `appearance.ts:447` (`defaultTheme()`), the test `window-guard.test.ts:319` (`startWith('settings:\n  app_theme: gone\n')).toEqual(LIGHT)`), the new finding text `findings.yml:59` ("a window of the desktop app starts on the first theme") and the round's option help in `config/options/appearance.yml` (`app_theme`).
   - An empty value or a number is refused and oculus's value stands (`window-guard.test.ts:323-324`). A name that is no theme is not refused, so the new key breaks HELP's rule. `theme` and `code_theme` do not break it: their wrong names fall to what their own shipped values draw.
   - Failure scenario: Axel writes `app_theme: vscode-dark-modrn` in his workspace file. HELP says oculus's Dark Modern stands, but every desktop window starts Light (with the finding).
   - Verdict: none on the items (item 5's start-theme sub-bullet does not say what a wrong name does). The fix is either the fallback taking the shipped `app_theme`, or a HELP sentence that states the exception: fixed at landing if small, else raised.

5. **Spec** (a change no item asks for; the nearest is round item 1). `src/lib/state/shared/words/appearance.ts:431-436` `themeClass(name, offers, inApp)` and `src/lib/shell/window/appearance.svelte.ts:95` `const classes = state === 'ready' ? startClass(inApp) : themeClass(choice, offers, inApp);`.
   - What is there: in the desktop window, an app's theme that is pending or offered by no acting app is now drawn in the `app_theme` start (Dark Modern) where the base drew the first theme (Light). An offered app theme whose file does not load is now drawn in the start theme where the base drew the class `app-theme` with no sheet. A browser is unchanged.
   - It adds an `inApp` parameter to `themeClass`, `terminalTheme` and `wallpaperOnTheme`, and with it two paths outside the round's items, `src/lib/state/workbench/ui.svelte.ts:308` and `src/lib/ui/theme/app-theme.ts:177`.
   - Item 1 is already met by the page sending its drawn background, which makes the host's fill follow the page whatever it draws. The report states this change with its before and after, so it is not silent.
   - Against open item 186: the round does not decide it. The `app_theme` choice still reads `from: themes`, `config-sources.ts` is untouched, and `appThemeFinding` exempts an app's saved name (`themes.ts:79`, `splitAppChoice(value) !== null`), which the report names as left to 186.
   - The change does add places a ruling on 186 must reach. Under 186 (a), the exemption at `themes.ts:79`, the finding words "nor an app's theme" (`findings.yml:59`) and the option help's "nor the saved name of an app's theme" must change. Under 186 (b), the host fills with an app theme's colours while `startClass` draws the start theme during the pending phase, so the two disagree again.
   - Failure scenario: Axel rules 186 (b), and the landing changes the host only. Every window with an app theme opens filled in the app theme and flashes Dark Modern while the offers load.
   - Verdict: none. Keeping it is the orchestrator's call.

6. **Proof** (a new test of a behaviour the change adds or changes, with no failure quoted from its run on the tree before the change). The round added these tests, and its report quotes no run of any of them on the pre-round tree (the snapshot):
   - `tests/checks/config/config.test.ts:715` 'names a code_themes list that is not a list of words, ...', `:730` 'names a theme row whose code is empty, not words or not vscode, ...' and `:744` "names an app_theme that is not words or names no theme, ...";
   - `tests/server/desktop/window-guard.test.ts:196` 'fills the window with the background of the theme its page drew, ...', `:322` "keeps oculus's app_theme for an empty or a wrong one ...", the describe at `:337` (the it.each at `:344` and the test at `:367`);
   - `tests/state/system/settings/theme-groups.test.ts:147`, `:227`, `:256` and `:274`.

   The only first-run line the round quotes is `config-folder.test.ts`'s. Failure scenario: a reader cannot tell whether, for example, the `:344` it.each held only after the change, or passed on the snapshot (where `themeClass` took two arguments and the page's own `windowThemeClass` stood). Read now, each test asserts the behaviour its title names. Verdict: round item 6 violated (with Finding 2).

7. **Spec** (paths outside the brief's "Paths this step writes"). Each of these is needed by a round item and is named in the round's report, but none is in the main ledger's `agents/briefs/O39.md` path list:
   - `src/desktop/windows/bridge.ts`, `src/desktop/preload.cjs`, `src/lib/state/shared/stores/desktop.ts` and `src/lib/shell/window/appearance.svelte.ts` (item 1);
   - `src/lib/state/workbench/ui.svelte.ts` and `src/lib/ui/theme/app-theme.ts` (Finding 5);
   - `src/lib/data/helpers/editor/start-theme.ts` (item 2);
   - `src/lib/state/client/socket.svelte.ts`, `src/lib/state/shared/words/tones.ts`, `src/lib/state/system/apps/shell/shell.svelte.ts`, the 9 sheets of `src/lib/themes/rice/`, `tests/state/workbench/options-pages.test.ts` and `docs/apps.md` (item 3);
   - `utils/diagrams/drawing/labels.mjs`, the first review's Spec 1, still not in the list.

   Failure scenario: the outside-paths check at landing names about 20 paths, and the landing stalls or accepts paths the brief never held. Verdict: none. The orchestrator widens the list at landing.

These first-review findings are closed in the round, each reproduced:

- Spec 2: `CLAUDE.md:30`.
- Proof 1: the slow tag, quoted and run.
- Proof 2: the `config-folder` lines.
- Proof 3: the greps, the paragraph list, the table and the edge values, except the card (Finding 2).
- Standards 2 to 6.
- Behaviour 3: `bridge.ts:255-263`.
- Behaviour 4: stated, but wrong (Finding 2).
- Standards 1: the module split holds, and the double lookup remains (Finding 3).

None was closed by removing a check: the convert check still names each breaking row, and no test or threshold was loosened. The removed lines of the six existing test files are only the ones the report's table lists.

### Declined to judge

- The `.gitignore` case: it needs `git check-ignore` in the new repository after part B.
- What only the page shows, which is the look at landing on TEST:
  - the window's fill following the drawn theme;
  - the canvas paint of `--bg` in `strip-colours.ts`;
  - the `:theme` headings;
  - the start theme for a pending app theme;
  - the Personal board without the card and with the `project_in_hub` finding.
- The three red paths of `groupProblems`. I judged them by reading. A run would need a row changed, which is breakage testing.
- Whether every edit of the round was made with the editing tool and not a script, as the round brief requires: nothing in the tree shows how an edit was made. The report says `npm run format` ran twice, where the round brief allowed one run at the end. The second run changed no file.
- Whether to keep the change of Finding 5, and the reading of open item 186's options against it: the orchestrator's call, and on 186 Axel's.
- The `agents/guarded.md` entries for the tests of the round and of the first build: the orchestrator's at landing.
- The first runs on the unchanged tree: not rerun, as the refute skill says. The tests were judged by reading.

Reviewer usage: a9bd27380cac16947, claude-opus-5-5, 286,977 tokens, 68 tool uses, 13.1 min.

## Repair round 2, refuted

Reviewer usage: ad8fb318e8e3d6926, claude-opus-5-5, 110,615 tokens, 86 tool uses, 15.1 min.

Worktree `/Users/axelfaes/workspace/research-hub/.agents/worktrees/migration-O39/tools/oculus`, base e9fd29162, round snapshot `.agents/worktrees/migration-O39-round-2`. I read the whole diff since the base and the round delta (`diff -u` of each `files.txt` path against the snapshot, plus the change since the base of each changed path not in `files.txt`). I changed no file. The tree is the same after my runs as before them. `git status --short | md5` gives `0d31a07460548e85c87862de4389824a` before and after, `md5 -q docs/diagrams/* | md5` gives `2f4b20d8158768ec0658cacce439047d` before and after, and `git status --short | wc -l` gives 126.

### Reruns

```
$ npm run test:quick -- --base e9fd29162
prettier ok | ASCII gate ok | svelte-kit sync ok | eslint ok
svelte-check: COMPLETED 531 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
vitest ok (82.7 s)
test:quick: 86.6 s (limit 45.0 s); every command passed
test:quick: over the time limit
(config-folder.test.ts, config.test.ts, boundaries.test.ts listed as "changed, run by npm run test:checks")

$ npm run check
COMPLETED 4252 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

$ npx vitest run <every test file the round adds or changes> tests/checks/tree/boundaries.test.ts tests/checks/diagrams tests/checks/config tests/checks/look tests/data/helpers/code-theme-pairs.test.ts --testTimeout 0 --hookTimeout 0
Test Files 21 passed (21)
Tests 413 passed | 9 skipped (422)
(pairs: 5345 / 4234 / 6157 / 4780 / 9708 / 9708 scopes differing)

$ npx vitest run tests/data/hubs tests/routes/edit/undo/undo.test.ts tests/data/sources/manifests/manifests.test.ts tests/server/desktop/app-theme-start.test.ts
Test Files 7 passed (7) | Tests 134 passed (134)

$ node utils/migrations/convert-vscode-themes.ts --check
19 themes up to date        (exit 0)

$ sh utils/unused-exports.sh   (diffed with /Users/axelfaes/workspace/research-hub/.agents/worktrees/O39-base/unused-exports.txt)
1c1
< Unused exports (229)
---
> Unused exports (230)
3a4
> src/lib/data/helpers/editor/code-themes.ts: vscodeRows

$ perl character gate of spec.md over the 125 changed paths
(no output, exit 0)

python3 over config/defaults/appearance.yml at the base and now: code_themes.vscode holds 19 rows equal (class, label, group, order) to the 19 rows that carried `code: vscode` at the base; no themes: row carries `code`; the 19 classes equal the 19 keys of src/lib/themes/vscode-rules.json.

grep over src tests config docs utils DESIGN.md HELP.md README.md (--exclude=local.yml):
code: vscode, VSCODE_CODE, shippedRows, shippedThemeOptions, project_in_hub, themeClassLabel, windowThemeClass, UI_GROUPS: no hit
noProject: only src/lib/server/.../deposit-routes.ts:130,208,220,240 (an unrelated function of the same word)
"theme picker" / "toggle of the": no hit
```

The quick tier was run twice by me. The second run was `--help` with its output discarded, in the same command as `npm run check`. It changed nothing tracked (the md5s above).

### Verdicts

O39.md part A, What to build:
- Item 1 (`.agents/plan.yaml`): holds.
- Item 2 (`.gitignore`): holds as read. The `git check-ignore` case is the orchestrator's (Declined).
- Item 3 (`.oculus/project.yml`): holds.
- Item 4 (`CLAUDE.md`, `AGENTS.md -> CLAUDE.md`): holds.
- Item 5 (the theme groups), by its sub-bullets:
  - Sub-bullets for the group field, its check, `Theme.group`, `groups`, Cmd-K `:theme`, the VS Code list (now `code_themes.vscode` under ruling 188), the theme words, high contrast, the duplicates, the words from `config/text/` and the DESIGN/HELP sections: these hold.
  - The start theme: holds. `APP_THEME` is gone; `app_theme` is in config with its help.
  - The window colours before paint: holds for oculus's rows and for an app theme on a window the app's own server serves. It is violated in part for the cases of Spec 1 and Behaviour 1. The first review's Behaviour 1 (the window and the page starting on different themes for `app_theme`) is resolved by ruling 186, apart from those two cases.
- Items 6 to 16: not applicable (parts B and C).

Round 1 brief (`O39-round1.md`):
- Item 1 (the window fill follows the drawn theme): holds (`bridge.ts:259-260`, `drawnFill`).
- Item 2 (one start-theme rule in its own module): violated, see Standards 2. `start-theme.ts` exists and `code-themes.ts` holds only code themes. The last step of the name-to-class lookup is still written twice.
- Item 3 (head comments, `docs/apps.md:283`, "picker"): holds.
- Item 4 (`CLAUDE.md` credentials rule, `ASCII_GATE`): holds.
- Item 5 (`UI_GROUPS` removed, the consistency check): holds. `--check` runs the consistency rule over `code_themes.vscode`.
- Item 6 (the report's proof): holds as far as read. `O39-report.md` lines 202 to 461 carry every required part. The round 1 refuter's own verdict on it is not on disk (Declined).

Round 2 brief (`O39-round2.md`):
- Item 1 (ruling 188, Theme and Code theme separate): holds.
- Item 2 (ruling 186, an app theme from the first paint): violated in part, see Spec 1 and Behaviour 1.
- Item 3 (ruling 187, the refusal removed, every manifest read once by real path): holds.

O39.md part A cases:
- New plan configuration: met.
- `.gitignore` lines: not verifiable here (`git check-ignore` is outside my git allowance; the case is the orchestrator's).
- Manifest keys: met.
- Layer rule (`boundaries.test.ts`): met.
- Prettier: met (quick tier prettier ok).
- Rules file (symlink, groups, gate): met.
- Group heading ("VS Code, dark", ungrouped first): met (test).
- Bad group (number, empty string): met (test).
- "Rice Pack": met (test).
- Workspace removing `vscode-dark-modern`: met. The test now goes through `loadConfig` with a saved settings file, which is the merge path ruling 188 asks for.
- Convert script check: met ("19 themes up to date").
- 11 / 6 / 2: met (test).
- Cmd-K `:theme`: partial. The rows `argumentRows` gives are tested; whether the arrow keys skip the headings is for the look at landing.
- Theme words: met.
- Duplicates: met (the pairs test passes; all six pairs differ, so both ids of each are kept).
- Start theme and the window: met by test (`app-theme-start.test.ts`, start-colours tests). The screen is the look's at landing.
- Data rule: met.
- False help: met (grep empty).

Round 2 cases, item 1 (ruling 188):
- Workspace renames a `code_themes.vscode` row (new label in Code theme, Theme unchanged): met (theme-groups test through `loadConfig`).
- Workspace removes a `themes:` row (Code theme unchanged): met.
- Workspace removes a `code_themes.vscode` row (gone from Code theme, Theme unchanged): met.
- A row whose class has no rules entry: met (`config.test.ts` finding, theme-groups test).
- The shipped config gives the same 19 themes, labels and groups: met (the python comparison above, and the test).

Round 2 cases, item 2 (ruling 186):
- `theme` naming an approved app's theme (first load carries the block, host start colours are that theme's): met (`app-theme-start.test.ts`, first-load tests).
- `app_theme` naming an app's theme with `theme` empty: met.
- An app not approved or not enabled (the `app_theme` start or the first row, no app file read): met. `heldChoice` returns 'closed' before `resolveTheme` (`choice.ts`, `theme.ts` `firstAppThemes`), and a test holds it.
- A theme file that does not resolve: partial, see Behaviour 1.

Round 2 cases, item 3 (ruling 187):
- Workspace folder inside a hub outside every scan folder with `.oculus/project.yml`: met (`workspace-projects.test.ts`).
- Workspace folder inside a scan folder whose manifest the scan reads (one project, no finding): met.
- Workspace folder holding a hub with a manifest at its top (each project read once): met.
- A write to the oculus case's manifest and its undo: met (`undo.test.ts`, 12 `INSIDE_ROWS` x 2 hubs).
- The link case (a symbolic link to a scanned manifest is the same file): met (`workspace-projects.test.ts`).

### Findings

#### Spec

1. **The host does not read the app theme's file itself; a window onto an oculus the app did not start fills with the rows' start.** Verdict: round 2 item 2 (violated in part), part A item 5 window sub-bullet.
   - Place: `src/desktop/app.ts:128-131`, with `src/server.ts:109-124` and `src/desktop/server/process.ts`.
     ```
     // A window onto an oculus this app did not start has no server here to tell it the app themes,
     // so it takes the start of the rows.
     const colours = () => startColours(args.engine, server?.appThemes() ?? {});
     ```
   - What is wrong: the brief says "the host reads that theme's file through the same resolution and converts it through the same mapping". The builder has the server resolve the file and send it to the host over the parent port (`{ kind: 'app-themes', files }`). The host converts what it is sent. When the desktop app attaches a window to a server it did not start, `server` is null and the host gets `{}`.
   - Failure scenario: Axel runs the server from a terminal (as he does with `npm run dev`) and opens it in the desktop app, with `theme` naming an approved app's theme. The window is filled with the first row's background (or `app_theme`'s row) and the page then paints the app theme: the flash ruling 186 exists to remove.
   - The message is a reported decision, so it is not silent. The narrowed reach is a deviation from the brief's text: the report lists the message, and the comment above states the gap, but the report does not raise it as a gap.
   - Fix within the step: the host resolves the file itself through `resolveTheme` on the attach path, or the attach path asks the server for the files before the window opens.

#### Proof

1. **The first runs of the item 1 and item 2 tests failed only at import, with no assertion reached.** Verdict: round 2 Report ("each case with its run on the tree before the round").
   - Place: `O39-report.md`, round 2 section, first runs of `theme-groups.test.ts`, `config.test.ts` and `app-theme-start.test.ts`: "Cannot find module ... code-rules.ts".
   - What is wrong: an import failure shows the module is new. It does not show that any assertion fails on the old tree. Several of these cases keep behaviour unchanged, for example "one that removes a `themes:` row changes nothing in the Code theme choice", and would pass on the old tree once the import resolved. The report presents them as failing first.
   - Failure scenario: a case that never tested the round's change reads as proof of it. The report should say, per case, whether it is new behaviour or kept behaviour.
   - The ruling 187 tests do show assertion lines (undo: 12 rows "expected 404 to be 200").

2. **The builder's runs broke the launch and the round's verify rule.** Verdict: round 2 "Verify before you report" ("`test:quick` once (one rerun only after a red line in a file this round changed)") and the launch limits ("no app, Electron ... started").
   - Place: `O39-report.md` round 2, the builder's own account.
   - What is wrong:
     - The quick tier ran 4 times.
     - A vitest run of the folder `tests/server/desktop` started the slow `start.test.ts`. That test launched Electron on port 8817, timed out at 600 s and rebuilt the gitignored `build-app/`.
     - `ls -la` of the worktree's `build-app/` shows its files written Oct 21 10:52 to 10:53, against Oct 20 10:36 for main's `tools/oculus/build-app`.
     - `lsof -nP -iTCP:8817 -sTCP:LISTEN` prints nothing now, so no Electron is left listening.
   - Failure scenario: no run shows `start.test.ts` passing on this tree, and the window start path it covers is the one this round changed. The worktree's `build-app/` is a build of this round's code, not of the base.
   - The landing's slow tier is the place `start.test.ts` runs.

3. **The parent-port path is untested.** Verdict: round 2 item 2.
   - Place: `src/server.ts:109-124` (`tellThemes`), `src/lib/server/root/process/parent.ts` (`readThemeFiles`, the `app-themes` kind) and `src/desktop/server/process.ts`.
   - What is wrong: no test sends an `app-themes` message through `readServerMessage`, and none checks that a malformed one is refused. `app-theme-start.test.ts` calls `startColours` with files built in the test.
   - Failure scenario: a change to the message shape on one side leaves the host with `{}`, and the window starts on the rows with every test green.
   - The builder's report states this in "what the tests do not cover".

#### Standards

1. **A new unused export, `vscodeRows`.** Verdict: spec.md's rule on exports (an export with no importer outside its file is removed or made local).
   - Place: `src/lib/data/helpers/editor/code-themes.ts:104`, `export function vscodeRows(config: Record<string, unknown>): {`.
   - What is wrong: `sh utils/unused-exports.sh` goes from 229 to 230 with this line. Its only importer outside the file is `utils/migrations/convert-vscode-themes.ts:40`, which knip's production run does not count.
   - Failure scenario: the landing's unused-export comparison shows one more line than the base.
   - Whether a `utils/` importer counts as an importer is the orchestrator's ruling. Either the script reads the rows through an exported reader the app also uses, or the export is listed as kept for the script.

2. **The last step of the name-to-class lookup is written twice.** Verdict: round 1 item 2 (violated).
   - Place: `src/lib/state/shared/words/appearance.ts:474` and `src/lib/data/helpers/editor/start-theme.ts:56-58`.
     ```
     return byKey(byName, start)?.class ?? '';            // startClass, appearance.ts:474
     const row = named.find((one) => one.name === name);  // windowStart, start-theme.ts:56
     return { cls: row?.cls ?? '' };                      // start-theme.ts:58
     ```
   - What is wrong: the page and the host each map the start name to a class. The brief asks for one rule.
   - Failure scenario: a change to how a name maps to a row (the first row with the name, for example) made in one place leaves the window fill and the page on different themes.
   - The state file books this as round 1 Finding 3, to be fixed at landing.

3. **Dead branch in the convert script.** Verdict: Standards (no dead code), minor.
   - Place: `utils/migrations/convert-vscode-themes.ts`, `listProblem`'s `default` case (the `rules` kind).
   - What is wrong: `rowProblems` passes only the problems of `vscodeRows`, which never carry the `rules` kind, so that branch is never reached.
   - Failure scenario: none at run time; a reader takes it for a live path. Fix at landing.

4. **`DESIGN.md:549` ("Colour and icon themes") is not brought up to date.** Verdict: round 2 item 2 ("its comments and pages say so"), minor.
   - What is wrong: it still says an app theme is served at `/api/app-theme` and that a theme of an app that does not act "falls back to the default". It does not name the first load's file or the host's colours from it. It is incomplete rather than false; lines 248 and 755 are consistent.
   - Fix at landing.

#### Behaviour

1. **`theme` names an approved app's theme whose file does not resolve, and `app_theme` names a resolvable app theme: the workbench, the window fill and the find and present pages start on different themes.** Verdict: round 2 item 2 case "a theme file that does not resolve gives the same" (partial).
   - Place: `src/lib/shell/window/appearance.svelte.ts:110-124`.
     ```
     const shown = state === 'missing' ? startChoice(inApp, offers) : choice;
     const shownState = appThemeState(shown, offers);
     const app = shownState === 'ready' || shownState === 'pending';
     const classes = app ? startClass(inApp) : themeClass(shown, offers, inApp);
     ...
     file: app ? firstFile(shown) : undefined
     ```
     `firstDrawFile` (`src/lib/ui/theme/app-theme.ts:158-169`) returns `undefined` for a carried `null`.
   - What happens in each place:
     - The workbench: the app is approved and enabled, so the state is `ready`, not `missing`. The page draws `startClass(inApp)`, which looks at rows only, so with `app_theme` naming an app theme it draws the first row (Light). The fetch then fails.
     - The host: `start-colours.ts:88` drops the null file from `drawable`, so `windowStart` passes over `theme` and returns `{ app: <app_theme> }`. The window is filled with the `app_theme` app theme's background.
     - The find and present pages: `drawConfiguredTheme` (`app-theme.ts:224-241`) uses `fileOffers(files)`, which drops null files, so the theme there is `missing`. `configuredTheme` falls to the `app_theme` app theme, which is `ready`, and those pages draw it.
   - Contradiction: the help of `app_theme` says a theme whose file does not resolve "is passed over".
   - Failure scenario: an app ships a broken theme path. The window fills dark, the workbench paints Light, and the find page paints the app theme. Round 1 item 1 then sets the window's fill to Light.
   - Fix at landing: treat a carried `null` as `missing` in the workbench's effect, so the page takes `startChoice`, as the host and the other pages do.

2. **A visible change not in the brief: an app theme now reads as `app-theme` while its file is pending.** Verdict: round 2 item 2, minor.
   - Place: `src/lib/state/shared/words/appearance.ts:442-445`:
     ```
     if (state === 'ready' || state === 'pending') return APP_THEME_CLASS;
     ```
   - What is wrong: `terminalTheme` (`appearance.ts:612`) and the wallpaper's theme check read `themeClass`. While the apps channel has sent nothing, they now take the app-theme reading rather than the rows' start.
   - Failure scenario: rare, since `+page.server.ts` seeds the apps list at the first load. A terminal opened in that window of time takes the app theme's terminal colours before the theme is drawn.
   - The report states the before and after, so this is not silent. It is listed because the brief did not ask for it.

### Declined to judge

- `tests/server/desktop/start.test.ts` and every slow-tier test that starts Electron: not run, as the launch forbids. No run of either session shows it passing on this tree (Proof 2).
- What a screen shows: the first paint with an app theme, the window fill, Cmd-K's arrow keys over the headings, the Settings view editing `code_themes.vscode` as a list, and the Oculus card on its board. These are for the look at landing.
- The `.gitignore` case (`git check-ignore`): outside my git allowance.
- The rebuilt `build-app/` in the worktree: `ls` shows its mtimes. Whether its content differs from a build of the base is not verified: the folder is gitignored and needs a read I did not make.
- The builder's first runs on the tree before the round: read from the report, not rerun.
- `agents/reviews/O39-refuter.md`, the section "## Repair round 1, refuted" (line 241 on), held a review of D49 (worktree D49, base 9337c3ad4), not O39's round 1, when this review read it. The state file (line 367) records O39's round 1 verdicts. This ledger defect is the orchestrator's to fix.
- Costs, not measured:
  - `holding` (`src/lib/server/edit/writes/hubs.ts`) now runs `hubManifests` over the primary on each undo of a record in another hub's file.
  - `vscodeRuleIds` (`src/lib/data/places/code-rules.ts`) parses the 170 KB `vscode-rules.json` on each config push (`portfolio.ts:650`), page load, findings run and write check.
- The `guarded.md` entries the new and changed tests need (a first-paint entry and the theme-groups entry, beside G77, G32, G9, G13 and G12 that the builder names): the orchestrator's or Axel's.
- Whether `vscodeRows`, whose only importer is under `utils/`, counts as unused (Standards 1): the orchestrator's ruling.
- Whether `codeThemeClasses` belongs in the load data: the builder's reported decision is to carry it in each load and config payload. The page bundle already imports `vscode-rules.json` (`src/lib/ui/controls/editor/kit/theme/theme.ts:29`), so the keys could be taken on the page. This is a judgment on design, so I leave it to the orchestrator; it is not a finding.

## Closed

First run (a32b6d70ea5cdc87a): the findings inside part A went to the builder as repair round 1 (`agents/briefs/O39-round1.md`); Behaviour 1 (`app_theme` and the apps' themes) and Behaviour 2 (the six VS Code and Shiki pairs) were raised as open items 186 and 185, and Axel ruled them (186 (a), 185 (a), carried out by round 2 and at landing).

Run over round 1 (a9bd27380cac16947), findings by their numbers there:
- 1 (the Oculus card premise): raised as open item 187; Axel ruled (a), the refusal removed, built in round 2.
- 2 (the round report's card claim): corrected in the landing report.
- 3 (the name-to-class lookup written twice): fixed at landing (also round 2's Standards 2).
- 4 (`HELP.md:508` and a misspelled `app_theme`): closed by ruling 186 as built in round 2, the help rewritten; read again at landing.
- 5 (the start theme while an app theme loads): kept by Z970; round 2 narrows it to an app not approved and enabled or a file that does not resolve.
- 6 (no runs of the round's new tests on the tree before the round): closed by reading at landing; the landing report says which cases are new behaviour and which kept.
- 7 (the brief's path list): widened in the booking with the paths of the three rounds.
- Z969 (a point declined, the workspace group of a code theme): withdrawn and raised as open item 188; Axel ruled Theme and Code theme separate, built in round 2.

Run over round 2 (ad8fb318e8e3d6926):
- Spec 1 (a window onto an oculus the app did not start fills with the rows' start): fixed at landing; the host asks that oculus for the app theme files before it opens the window.
- Proof 1 (first runs that fail only at import): closed in the landing report, which names each case as new or kept behaviour.
- Proof 2 (the builder's four quick runs and the slow `start.test.ts` it started): booked as builder departures; `start.test.ts` runs in the slow tier of the gate at landing.
- Proof 3 (the parent-port message untested): no test added, since a failure leaves a window on the start colours and costs nothing the rules file names; named as not covered in the landing report.
- Standards 1 (`vscodeRows` exported for the script alone): fixed at landing.
- Standards 2 (the lookup written twice): fixed at landing.
- Standards 3 (the dead `rules` branch of the convert script): fixed at landing.
- Standards 4 (`DESIGN.md:549`): fixed at landing.
- Behaviour 1 (an app theme whose file does not resolve): fixed at landing; the workbench takes a carried null as missing.
- Behaviour 2 (the terminal reading `app-theme` while a file is pending): fixed at landing; a pending theme reads the start's class as before the round.
- Declined, the ledger defect (the round 1 section held another step's text): fixed by the orchestrator before landing.
