# Brief check of O186 (oculus, main at fa3ac09df)

Read: `.scratch/migration/agents/briefs/O186.md` (untracked), `plan.md` top, `plan.md:1744` (the step line), `plan.md:3746` (Open item 757), `agents/spec.md` in full, and the tree on main. Nothing was changed. No git command that changes state was run. `config/local.yml` was never opened, and every git grep excluded it.

## Names

Command: `git grep -n "<name>" -- src tests config docs README.md ':!config/local.yml'` for each name.

- `settings_open_unavailable`: `workbench.yml:218` and `List.svelte:173`. Both are in the write list. No other hit under these paths.
  - Outside these paths, `git grep -n settings_open_unavailable` with no pathspec also hits tracked ledger files: `.scratch/migration/agents/briefs/D68-round1.md:10`, `agents/reviews/D68-refuter.md:239`, `agents/reviews/D68-report.md:320` and `agents/reviews/O99-brief-check.md:9,89`. The step does not make them false, since they are records. But they make verify check 2 impossible to pass (see "The question").
- "can be opened once a folder": `workbench.yml:218` only. Under no pathspec there are also `.scratch/migration/agents/reviews/D70-report.md` (1 hit) and `.scratch/migration/plan.md` (2 hits). These are records and stay true.
- `texts_about`: `workbench.yml:90` and `groups.ts:331`. `groups.ts:331` is outside the write list (`groups.ts` lines 1-19). It is a reader and stays true.
- `openTarget`:
  - `config-files.ts:24` (doc of `PRIMARY_ROOT`, "`openTarget` puts the name in") is outside the range 20-47? No: it is inside. It stays true.
  - `src/lib/server/files/open.ts:227,274,372` is an unrelated server function of the same name and is not affected.
  - The only caller of this `openTarget` is `List.svelte:34,93`.
- `showDefaults`, `openFile`, `targetOf`: the only Settings hits are in `List.svelte` (92-104, 132, 162-169). Every other hit is an unrelated namesake (`server/root`, `repositories`, `writes`, `pty/panes/target.ts`, `explorer/tree/drag.ts`, tests of those) and is not affected.
- `folderGroup`: `groups.ts:167,314,321,328` only. These are outside the written range 1-19 and unchanged by the brief.
- `CATALOGS_GROUP` / `SCHEMAS_GROUP` / `TEXTS_GROUP`: `groups.ts:70-72,315,322,329` and `scopes/rows.ts:16,33` (`FOLDER_GROUPS`). They stay true.
- `desc_*` readers: `git grep -n "describedAs\|descriptionKey\|settings\.desc_" -- src tests` finds:
  - `groups.ts:180,241,252`;
  - `tests/checks/config/config-folder.test.ts:70,410-418` (a key exists per file; no text asserted);
  - `tests/checks/source/keys.test.ts:365,374`.
  - The change makes none of them false.
- `views.open_source`: also `src/lib/views/shared/links/SourceButton.svelte:20-22`. Not affected.
- `.unavailable` (CSS): `List.svelte:248-251` is the only rule for the span the step removes. `PaletteRow.svelte` has its own rule. Once the span goes, the rule at `List.svelte:248-251` has no element. svelte-check runs without warnings failing (`tests/tiers/quick.mjs:298`: `['--incremental', '--tsconfig', './tsconfig.json']`), so the verify list passes with the dead rule left in. The brief does not say to remove it.
- Comments outside the write list that name the file rows (`git grep -n -i "show defaults\|Catalogs, Schemas"`):
  - `src/lib/state/system/config/view/folders.ts:28` ("One file listed in a group: the path and the open action, with its description when it has one") becomes inexact: a row now has two opens. This file is not in the write list or in item 5.
  - `folders.ts:1` ("The Catalogs and Texts groups") already leaves out Schemas. The step does not cause that.
  - `draft.ts:379`, `config-files.ts:97,104`, `groups.ts:90,194`, `Settings.svelte:19,44` stay true.
- `docs/HELP.md:489-500`: names neither the groups nor their open. It stays true.

## The step line

The step line (`plan.md:1744`) names no check of its own. Its parts, mapped to the brief:

| Part of the line | Where the brief serves it |
|---|---|
| (a) The rows open only through `openTarget`, so the installed app draws only the unavailable line | Premises at brief lines 12-13; item 3 removes the line |
| (b) Every file row of the three groups opens its file read-only through `:oculus`, as Show Defaults does, in the app and the dev server alike | Item 1 |
| (c) The edit open where a workspace folder holds `config/` | Item 2 |
| (d) The Catalogs and Texts rows say where their values are set (vocab: the hub's config.yml and registry files; the six catalogs and the text words: the workspace file's `settings:`) | Item 4 |
| (e) Built by a builder agent | The brief is a builder brief |

- Item 3 serves (a)/(b), and item 5 serves `spec.md:72`. No part of the line is without a requirement.
- Part (d) says "the Texts rows". Item 4 and decision 3 (brief line 75) put that sentence once on the group (`texts_about`), not on the rows. This is a reading of the line, and it is listed as a reversible decision.
- Ruling 757 (`plan.md:3746`) says "where a hub sets its own values". The corrected premise (workspace file, `plan.md:1744`) changes that wording. The correction is written in the step line only. `orchestrator-state.md:895` says "Open items: none", so no open item was raised for a premise the ruling states.

## Premises

Each was checked with `sed -n`, `grep -n` or `find` on main:

- `groups.ts:312-336` and `folderGroup`:
  - `sed -n '312p;336p'` gives `if (folders !== undefined) {` and `}`.
  - `folderGroup` runs from 167 to 192, not 191 (`sed -n 189,192p` ends with `}` at 192).
  - `described` is false at 333 (`folders.texts,` / `false`).
  - Catalogs and Schemas pass `true` (318-319, 325-326).
  - Holds, apart from the end line.
- `folders.ts:1-4`: holds. `listedFiles` starts at 60, not 61 (`cat -n`: 59 is the doc comment, 60 the function).
- `List.svelte:158-176`: holds (158 `{#if row.kind === 'file'}`, 172-174 the span). `List.svelte:92-93`, `101-104` and `125-133` hold.
- `workbench.yml`: 218, 71-72, 13, 19-22, 29, 28, 30 and 90 hold, read with `cat -n`. `settings_open_unavailable` lies in the `workbench:` group, which opens at 132.
- `app.yml:331-332` (`open_source: Open file`, `open_source_tip`): holds.
- `config-files.ts:35-47`, `29-34` and `109-112`: hold.
- `engineConfigIn` at `server/files/workspace/folders.ts:269-282` and `portfolio.ts:669`: hold.
- The installed app's config folder:
  - `find ~/Applications/oculus.app -type d -name catalogs -path '*config*'` prints two lines: `.../app/config/catalogs` and `.../app/config/options/catalogs`. The brief quotes one.
  - Counts: catalogs 7, schemas 3, text 68. Holds.
  - The installed app is `1.1.0`, the same as the repository's `package.json`. Its `workbench.yml` holds `settings_open_unavailable` (`grep -c` prints 1).
  - The app carries the `:oculus` route (`src/routes/api/(docs)/oculus-config/[...path]` and its build chunk exist in the app).
- `oculus-config.ts:1-36`: holds. The file is 37 lines, the route is `[...path]`, and `draft.ts:385` forces `:oculus` to read-only.
- `hub-keys.ts`:
  - The `catalogs/vocab.yml` rows are lines 77-107. Holds.
  - Domains and theme words: the brief cites 44-45. Line 44 is "its vocabulary (every list of vocab.yml)". The domains sentence is at 48-49 ("Its domains and theme words are its own registry files'").
- `workspace-layer.ts`: the six catalog keys are at 8-10 and `text` at 12-13. Both are within 1-18. Holds.
  - The top keys of the catalog files confirm `agents`, `patterns`, `glyphs`, `icons`, `latex_editing`, `latex_unimath` (`grep -n '^[a-z_]*:' config/catalogs/*.yml`).
  - `text` and the six catalogs are not in `HUB_LIST`: `grep "key: 'te\|key: 'glyphs..."` finds only `teaching_stages`.
- Head comments: `List.svelte:2-11`, `groups.ts:1-19`, `rows.ts:1-6`, `Settings.svelte:44` and `config-files.ts:29-34` hold.
  - The `rows.ts` head paragraph is lines 1-7, not 1-6 (line 7: "workspace's.").
- `HELP.md:489-500`: holds.
- No test reads these names: `git grep -ln "openTarget\|folderGroup\|CATALOGS_GROUP\|SCHEMAS_GROUP\|TEXTS_GROUP\|settings_open_unavailable" -- tests` exits 1. Holds.
- `docs/adr`: absent (see "ADRs").

## Cases and checks

- Case "A Catalogs row's help" (brief line 45) names "the Behavior-style heading line that shows `desc_glyphs`". That heading is wrong: `config/options/catalogs/glyphs.yml:9` says `heading: appearance`.
  - The other catalogs sit under: agents `sessions`, file-nesting, latex and unimath `editor`, icons `appearance`, vocab and manifest-schema `boards` (`grep -n heading config/options/...`).
- That same case covers glyphs only. Item 4 changes six sentences, and three of them use keys that differ from their file names: file-nesting to `patterns`, latex to `latex_editing`, unimath to `latex_unimath`. No case checks those.
- Case "The search over Settings" (line 49) says rows are found and hidden "as today". `search.ts:27` matches `row.help` too, so after item 4 a search for words of the new sentences (such as "workspace" or "settings") keeps the six catalog rows. "As today" is false for those queries.
- Two cases ask the builder to check places the step does not change:
  - "The vocab row's help" (line 46): `desc_vocab` stays unchanged.
  - "A folder listing still loading or failed" (line 48): `listedFiles` (`folders.ts:60-69`) is not in the write list. Only the drawing of `group.said` (`List.svelte:144-146`) is in a changed file.
- Write range `scopes/rows.ts` lines 1-6 cuts the head paragraph (1-7). `spec.md:45` asks for an edited comment to be rewrapped as a whole paragraph, which may move line 7.
- Verify list:
  - It lacks the ASCII gate's perl command, which `spec.md:78,103` require after `test:quick`.
  - It lacks `sh utils/unused-exports.sh` compared with the base, which `spec.md:89` requires and the brief must name.
- The report shape lacks:
  - the history-word grep with each hit judged (`spec.md:44`);
  - the quoted grep of changed names (`spec.md:72`);
  - the one line "adds or changes no test" (`spec.md:69`).
- The brief names no worktree or base copy (`spec.md:32-33`). O184 and O185 do the same; the dispatch may carry them.
- The Read section names `agents/spec.md` twice (brief lines 5-6).
- The other cases are consistent with `spec.md:60,65,67`: no test, and the look at landing as proof.

## The question

The goal: every file row of Catalogs, Schemas and Texts can be opened in the installed app and the dev server, read-only always, editable where the oculus config folder is in the workspace, and the rows say where their values are set.

What to build:
- **Item 1 (read open):** Yes, it can pass for the installed app.
  - The look runs on a scratch server from the checkout. The installed app is the 1.1.0 build and holds the old markup (`grep -c settings_open_unavailable` in the app's `workbench.yml` prints 1). It gets the change only from a new app build, which no item or check names.
  - The code path is the same, so the scratch server without the oculus repository stands for the installed app's logic (a judgment: `:oculus` is served from `configDir(engine)` in both).
  - For the dev server: no, it cannot pass without the goal, since the look presses it.
- **Item 2 (edit open):** No. `openTarget` is unchanged and the case presses Open file in a workspace holding the repository.
- **Item 3 (no dead row):** Its check cannot pass even with the goal reached. `git grep -n settings_open_unavailable` with no pathspec prints the tracked `.scratch` records listed under "Names". It needs `-- src tests config docs README.md`. The dead `.unavailable` CSS rule passes the list unremoved.
- **Item 4 (where values are set):** Yes, it can pass without the goal if "the rows" in the goal covers all three groups.
  - No Schemas row says where its values are set. `schemas/manifest-schema.yml` gets fields from a hub's `.oculus/config.yml` `manifest_fields` (`hub-keys.ts:108`).
  - `schemas/cpp-schema.yml` and `schemas/deck-schema.yml` are set nowhere: `config/options/schemas/` holds only `manifest-schema.yml`.
  - Ruling 757 scopes the sentence to Catalogs and Texts, so within the ruling item 4 is complete. Only the goal as given is wider.
  - Item 4 can also pass with only glyphs right, since the cases check one catalog.
- **Item 5 (comments):** It can pass with `view/folders.ts:28` left inexact, because that file is outside the write list.

Cases:
- **Catalogs row, no engine:** The same installed-app caveat as item 1. Otherwise no.
- **Same row, engine set:** No.
- **Schemas and Texts rows:** They pass while the drawn tip is false on a Schemas row.
  - The tip reads "Open oculus's {0}, the values in force where you set none, to read" (`workbench.yml:72`).
  - For `schemas/deck-schema.yml`, the case's own example, and for `cpp-schema.yml`, nobody sets values, so "where you set none" and the label "Show Defaults" say something false. Opening still works.
- **Glyphs help:** Yes, it can pass with the other five sentences wrong. The heading it names is also the wrong one.
- **Vocab help:** It passes regardless, since nothing changes.
- **Texts sentence:** No.
- **Loading or failed listing:** It passes regardless, since the place is unchanged.
- **Search:** It passes trivially, and "as today" is inexact (see above).

The step line names no check of its own.

## Implied inputs

These are missing from "Cases", each with its expected result:

- **A Schemas row with no setter** (`cpp-schema.yml`, `deck-schema.yml`): the tip and the label drawn on it are true of that file. As dictated today they are not, so the brief must rule a tip for these rows or accept the false wording as a decision.
- **The `manifest-schema.yml` row:** it says, or the brief says why it does not, that a hub adds fields under `manifest_fields` in its `.oculus/config.yml`. The sentence is then true on the Boards heading line too.
- **Each of the six catalogs by its key:**

  | File | Key |
  |---|---|
  | `agents.yml` | `agents` |
  | `file-nesting.yml` | `patterns` |
  | `glyphs.yml` | `glyphs` |
  | `icons.yml` | `icons` |
  | `latex.yml` | `latex_editing` |
  | `unimath.yml` | `latex_unimath` |

  The heading line of each (sessions, editor, appearance) reads the same true sentence.
- **A search for a word of a new sentence** (such as "workspace"): the six catalog rows are kept, counted and drawn. The report names this as a visible change.
- **Before the workspaces answer** (`engine: null` at `fs-transport.ts:206`): each row draws Show Defaults alone. Open file appears once the answer names the engine, and Show Defaults does not move.
- **A file open in both tabs** (dev server, workspace holding the repository): after a save in the Open file tab, the Show Defaults tab of the same file is not refreshed (`source.svelte.ts:395` tracks no `:oculus` tab). The report names this as a sharp edge, or the brief rules on it.
- **Tab order and accessible names:** each row adds one or two tab stops (Show Defaults, then Open file), about 78 rows in all. Every Show Defaults has the accessible name "Show Defaults", and only the tooltip names the path. The report's before-and-after names both.
- **The dead CSS rule:** `List.svelte:248-251` `.unavailable` is removed with the span, and svelte-check shows no unused-selector warning for `List.svelte`.
- **The installed app:** after landing it still draws the unavailable line until the next app build. The report says so.

## ADRs

Confirmed: `ls docs/adr` prints "ls: docs/adr: No such file or directory". `ls docs` lists apps.md, data-map.md, decks.md, diagrams, HELP.md, licenses, palette.md, templates.md and third-party.md.

## Dictated text

No new words are dictated verbatim. `LC_ALL=C grep -n '[^ -~]' O186.md` prints nothing (exit 1). The lines that dictate content or existing words are:

- `grep -n "Every file row opens its file to read"` gives line 26. It dictates the existing label `settings.show_defaults` and tip `settings.show_defaults_tip` for every row. This breaks `spec.md:72` (a sentence the change makes false is a defect) for the Schemas rows `cpp-schema.yml` and `deck-schema.yml`, where "the values in force where you set none" is false.
- `grep -n "said in each one's"` gives line 30 (the six catalogs, in the workspace file's `settings:` under their keys). It holds: the keys match `workspace-layer.ts:8-10` and the catalog files' top keys.
- `grep -n "stays as it is"` gives line 31 (`desc_vocab`). It holds.
- `grep -n "texts_about\` says"` gives line 32 (a workspace lays its own words over these in its workspace file's `settings:` under `text`). It holds (`workspace-layer.ts:12-13`).
- `grep -n "Each sentence is true"` gives line 33. It holds.

## Declined to judge

- Whether the goal's "the rows say where their values are set" is meant to cover the Schemas group. Ruling 757 names Catalogs and Texts only, and that is Axel's to settle.
- Whether the installed app must show the change before the step counts as done, or whether the next app build is a separate release concern.
- Whether the corrected premise (workspace in place of hub, against ruling 757's wording) needs an open item or stands as recorded in the step line.

Usage: acb6e5a864c75ef20, claude-opus-5-5, 181473 tokens, 50 tool uses, 413.5 s.

## Closed

- Names, `settings_open_unavailable` in tracked ledger records: verify check 3 takes the pathspec `-- src tests config docs README.md ':!config/local.yml'`.
- Names, the `.unavailable` CSS rule at `List.svelte:248-251`: item 3 removes it; verify check 4 greps for it.
- Names, `view/folders.ts:28`: added to item 5 and to "Paths this step writes" as lines 26-29.
- Premises, `folderGroup` ends at 192, `hub-keys.ts` domains at 48-49, `rows.ts` head paragraph 1-7, the `find` printing two lines: corrected in "What is on the tree" and the path list.
- Cases, the heading of `desc_glyphs` (appearance, not Behavior): the case now names each catalog's heading.
- Cases, only glyphs checked: the case now checks all six catalogs by their keys.
- Cases, the search "as today": replaced by a case on a search for a word of a new sentence.
- Cases, the vocab and the listing cases checked places the step does not change: removed.
- Cases and checks, the ASCII gate, `unused-exports.sh` and the report's history-word grep, name grep and no-test line: added to "Verify before you report" (checks 2 and 5) and to "Report".
- Cases and checks, `agents/spec.md` named twice: the opening line names it once.
- The question and Dictated text, Show Defaults' words false of `cpp-schema.yml` and `deck-schema.yml`: the file rows get their own read-only button, `Show File`, tip `Open oculus's {0} in a tab that only reads it`, which is true of every file of the three folders (item 1, decision 1), taken in automode and booked in `choices.md`. The dictated tip holds: plain, ASCII, true of every row.
- The question, item 4 and the Schemas rows: ruling 757 names the Catalogs and Texts rows; item 4 says the Schemas rows are not part of it.
- The question, the installed app: the brief says in "What is on the tree" and in "Report" that the installed app shows the change only from the next app build.
- Implied inputs, before the workspaces answer, the keyboard and accessible names, the two tabs of one file: added as cases.
- Declined to judge 3, the corrected premise: Axel was told the correction in the message that reported the brief; it is recorded on the step line.
