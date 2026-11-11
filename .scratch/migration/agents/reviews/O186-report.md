# O186 report: every file row of Settings opens its file

Everything in the brief is done.

## Open items of the state file, verbatim

The "Open items" section of `.scratch/migration/orchestrator-state.md` (lines 175-188, read with `sed -n 175,188p`) holds no item; its text is the heading and the closing line:

> ## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)
>
> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

## The cases' first run, on the unchanged tree (by reading)

Every premise of "What is on the tree" reproduced at base 448c2b636: `List.svelte:158-176` (file row), `:248-251` (`.unavailable`), `:101-104` (`showDefaults`), `config-files.ts:35-47` (`openTarget`), `groups.ts:167-192,312-336`, `workbench.yml:13,19-22,29,30,72,90,218`, `fs-transport.ts:206` (`engine: null` in `noWorkspaces`), `source.svelte.ts:395` (`root !== OCULUS_CONFIG_ROOT` before `disk.track`), the headings (`grep -n heading config/options/catalogs/*.yml config/options/schemas/*.yml`), and the six keys (`agents`, `patterns`, `glyphs`, `icons`, `latex_editing`, `latex_unimath`, the first key under `options:` of each `config/options/catalogs/*.yml`, and `workspace-layer.ts:8-13`). No case was found that the brief's rules get wrong.

- **Catalogs row `catalogs/glyphs.yml`, workspace holds no folder with oculus's `config/`.** `openTarget` returns null at `config-files.ts:45` (`saved.engine === null`), so `List.svelte:162` takes the `{:else}` branch and draws only the span `workbench.settings_open_unavailable`. Unchanged tree: the unavailable line only, no control.
- **Same row, workspace holds the oculus repository.** `engine` is set (`engineConfigIn`, `folders.ts:269-282`), `openTarget` returns `{ root: engine.root, path: joinPath(engine.path, file) }`, and the row draws "Open file" alone (`views.open_source`, glyph `edit`), which opens the file through that workspace folder, where it can be saved. No read-only open on the row.
- **Before the workspaces answer has come (`engine: null`).** `noWorkspaces()` (`fs-transport.ts:198-211`) gives `engine: null`, so every row draws the unavailable line, which is replaced by Open file once the answer names the folder.
- **Schemas row `schemas/deck-schema.yml` and Texts row `text/views/system/workbench.yml`.** Same as the first two cases; the schema row carries `desc_deck_schema` as help (`groups.ts:327`, `described` true), the texts row none (`groups.ts:333`). No Show File exists, so no tip to judge.
- **The six catalogs' help.** `desc_agents`, `desc_file_nesting`, `desc_glyphs`, `desc_icons`, `desc_latex`, `desc_unimath` (`workbench.yml:13,19-22,29`) name no workspace file and no key; the same sentences show on the heading lines (Sessions and usage; Editor; Appearance), since `fileLine` and `folderGroup` both read `describedAs` (`groups.ts:241,180`).
- **The Texts group's sentence.** `texts_about` (`workbench.yml:90`): "The words the views draw, one file per view, in config/text/ and the folders under it." It does not name `settings:` or `text`.
- **A search for `workspace`.** `answers` (`search.ts:22-31`) reads a row's title, path, section, help and group heading; no catalog row's path or help holds "workspace", so no Catalogs row is kept. (No file under `config/text` has "workspace" in its name: `find config/text -type f | grep -i workspace` prints nothing.)
- **Keyboard.** Where the folder is held, a file row has one tab stop (Open file, accessible name "Open file"); where it is not, none (the span is no control).
- **A file open in a Show File tab and an Open file tab.** No row has Show File yet; the Show Defaults tab of a heading line is a `:oculus` source tab, which `source.svelte.ts:395` does not track, so it is not refreshed after a save elsewhere.

## DONE / NOT DONE

| Item | State | Proof |
| --- | --- | --- |
| 1. Show File on every file row, read-only open through `:oculus` | DONE | `List.svelte:169-175` draws a `compact` `ToolButton` (`settings.show_file`, glyph `open_preview`, tip `settings.show_file_tip` with the row's path) outside any condition, calling `showOculusFile(row.file)`, which opens `sourceTabState(OCULUS_CONFIG_ROOT, path)`; `loadSourceReadonly` answers true for that root (`draft.ts:385`). The look at landing is the proof of what is drawn and opened. |
| 2. Open file after Show File where `openTarget` gives a target | DONE | `List.svelte:176-185`, the `{#if targetOf(...) !== null}` block after the Show File button. Look at landing. |
| 3. No dead row: span, key and CSS rule removed | DONE | `git grep -n settings_open_unavailable -- src tests config docs README.md ':!config/local.yml'` and `git grep -n "can be opened once a folder" -- ...` print nothing; `git grep -n "\.unavailable" -- src/lib/views/system/workbench/settings` prints nothing. |
| 4. Where the values are set, six catalogs and Texts | DONE | `git diff config/text/views/system/workbench.yml`: each of the six `desc_*` adds "The open workspace lays its own ... over these in its workspace file's `settings:`, under `<key>`." with keys `agents`, `patterns`, `glyphs`, `icons`, `latex_editing`, `latex_unimath`; `texts_about` adds the same sentence under `text`. `desc_vocab` unchanged. |
| 5. Comments | DONE | Head comments of `List.svelte:9-15`, `groups.ts:18-21`, `openTarget` doc `config-files.ts:28-35`, `scopes/rows.ts:1-9`, `FileRow` doc `view/folders.ts:27-31` rewritten (see below). |
| Verify 1: `npm run test:quick` | DONE | Last line: `test:quick: 85.4 s; every command passed` (quoted in full below). |
| Verify 2: ASCII gate over the six files | DONE | The perl command of the brief printed nothing, `rc=0`. |
| Verify 3, 4: greps | DONE | All three greps printed nothing (row 3). |
| Verify 5: `sh utils/unused-exports.sh` against the base | DONE | `diff O186-unused-base.txt <new output>` printed nothing, `rc=0`; both 334 lines (`wc -l`). The step adds no line. |
| Verify 6: new sentences read against `agents/spec.md` | DONE | Read; no departure found (ASCII, no history, plain, names the file and the key; no "not X but Y"). |

`npm run test:quick` (after `npm run diagrams`, with `TMPDIR` unset), the lines it prints at the end:

```
ok      prettier (1.0 s): All matched files use Prettier code style!
ok      ASCII gate (1.0 s)
ok      svelte-kit sync (2.9 s)
ok      eslint (19.3 s)
ok      svelte-check (50.5 s): 1794409963570 COMPLETED 592 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest slow (54.7 s): Duration  31.54s (transform 20.02s, setup 0ms, import 29.34s, tests 8.52s, environment 1ms)
ok      vitest (62.0 s): Duration  39.13s (transform 99.54s, setup 0ms, import 141.87s, tests 8.62s, environment 1.68s)
ok      vitest checks (82.5 s): Duration  59.19s (transform 55.28s, setup 0ms, import 91.98s, tests 115.08s, environment 3ms)
test:quick: 85.4 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source, tests/checks/tree and
            tests/checks/imports, which run for any change under src, tests or
            utils; the build, the lint of unchanged files
```

## Files (from `git diff --stat` and `wc -l`)

| File | Diff | Lines now | In write list |
| --- | --- | --- | --- |
| `config/text/views/system/workbench.yml` | +8 -9 | 322 | yes |
| `src/lib/state/system/config/config-files.ts` | +2 -1 | 130 | yes (lines 28-35) |
| `src/lib/state/system/config/groups.ts` | +2 | 371 | yes (head comment, lines 20-21 added after line 19) |
| `src/lib/state/system/config/scopes/rows.ts` | +4 -3 | 134 | yes (head comment) |
| `src/lib/state/system/config/view/folders.ts` | +3 -1 | 71 | yes (`FileRow` doc) |
| `src/lib/views/system/workbench/settings/List.svelte` | +20 -15 | 263 | yes |
| `.scratch/migration/agents/reviews/O186-report.md` | new | | yes |

No file outside the write list changed (`git status --short` lists the six files above).

## Judgment calls the brief left open (each reversible)

1. `showDefaults` in `List.svelte` is renamed `showOculusFile`, since it now serves Show File as well as Show Defaults and a Show File button calling `showDefaults` would misname what it does. It is the same function with the same body; both buttons call it.
2. The six new catalog sentences share one form, "The open workspace lays its own <entries> over these in its workspace file's `settings:`, under `<key>`.", the entry word chosen per catalog from its options file's head: agents, patterns, stand-ins, icons, sections (LaTeX), commands (unimath). `texts_about` uses the same form with "words" and `text`, so the three places read alike and parallel `desc_vocab`'s "A hub lays its own words over these in its .oculus/config.yml".
3. `desc_vocab` is left as it is: "A hub lays its own words over these in its .oculus/config.yml" is loose for the lists a hub replaces whole (focus lanes, venue tiers, radar buckets), but the hub's value does stand over oculus's for every one of them, so no word of it is false.
4. The new keys are `settings.show_file` and `settings.show_file_tip`, beside `show_defaults` in the `settings` group, which lives only in `workbench.yml` (`grep -rn "^    settings:" config/text` finds that one file). `grep -rn show_file src tests config docs README.md --exclude=local.yml` found no earlier key of that name, so neither collides; both have a reader at `List.svelte:170,172`.

## Host- or user-visible changes, before and after (for the look at landing)

View: Settings, any scope, the Catalogs, Schemas and Texts groups at the end.

- **Workspace without a folder holding oculus's `config/` (stands for the installed app).** Before: each row shows its path and the muted line "catalogs/glyphs.yml can be opened once a folder of this workspace holds it." After: each row shows its path and an icon-only Show File button (glyph `open_preview`, tooltip "Open oculus's catalogs/glyphs.yml in a tab that only reads it"); pressing it opens the file in a source tab that cannot save. No muted line.
- **Workspace holding the oculus repository.** Before: path, then Open file (glyph `edit`). After: path, Show File, then Open file; Open file opens through the workspace folder and can save.
- **While the workspaces answer is pending.** Before: the muted line on every row, replaced by Open file. After: Show File alone, Open file appearing to its right; Show File keeps its place.
- **Tab stops and names.** Folder held: two stops per row (Show File, accessible name "Show File"; Open file, accessible name "Open file"), one more than before. Folder not held: one stop (Show File), one more than before (none).
- **Help sentences.** The Catalogs rows `catalogs/agents.yml`, `file-nesting.yml`, `glyphs.yml`, `icons.yml`, `latex.yml`, `unimath.yml`, and the heading lines of the same files (Agent composer under Sessions and usage; File nesting, LaTeX editing, Unicode math under Editor; Glyphs, Icons under Appearance), end with the new sentence naming the workspace file's `settings:` and the key. The Texts group's sentence under its heading gains "The open workspace lays its own words over these in its workspace file's `settings:`, under `text`."
- **Search.** A search for `workspace` (or `lays`, `settings`, a key such as `latex_editing`) now keeps and counts the six catalog rows, since `answers` reads a row's help (`search.ts:27`). The Texts rows are not kept by it: `texts_about` is the group's `about`, which the search does not read.
- **Two tabs on one file.** With the repository held, a file open by Show File and by Open file: a save in the Open file tab does not refresh the Show File tab (`source.svelte.ts:395` tracks no `:oculus` tab). This is a behaviour of the change; the step does not change it.

## Anything in the brief that was wrong or impossible

Nothing. One wording point: item 2 says Open file comes "after Show Defaults"; on a file row the control before it is Show File (decision 2 and item 1), and that is what is built.

## Comments and documents that name the file rows

- `List.svelte:2-15` head comment: rewritten (the file-row sentence).
- `List.svelte` doc of `openFile` and of `showOculusFile`: rewritten.
- `groups.ts:1-21` head comment: rewritten (one sentence added on what the view draws per row); lines 8-12 on Show Defaults still true.
- `config-files.ts:28-35` (`openTarget`): rewritten (the Null sentence).
- `scopes/rows.ts:1-9`: rewritten.
- `view/folders.ts:27-31` (`FileRow`): rewritten. Its head comment (`folders.ts:1`) says "The Catalogs and Texts groups" and omits Schemas; that is not made false by this change and lies outside the write list (lines 26-29), so it is named here and not changed.
- `Settings.svelte:44` ("The Catalogs, Schemas and Texts groups are made from the listings of their folders"): still true. `Settings.svelte:19` (Show Defaults on heading lines): still true.
- `draft.ts:377-382` (`loadSourceReadonly`): "read through the read-only route over it (Settings' Show Defaults)" is still true; its parenthesis names Show Defaults as the example and not Show File. Outside the write list; not changed.
- `oculus-config.ts:1-6` ("the Settings view reads its defaults from"): still true, now incomplete in the same way (Show File reads any file there). Outside the write list; not changed.
- `docs/HELP.md:489-500` (Settings section): names neither the folder groups nor their open; no line is made false.

## History-word grep over added lines

`git diff -U0 | grep '^+' | grep -v '^+++' | grep -n -i -E "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|O[0-9]+|20[0-9][0-9]-"` printed nothing (`rc=1`).

## Grep of each changed name across `src`, `tests`, `config`, `docs`, `README.md`

`grep -rn "<name>" src tests config docs README.md --exclude=local.yml`:

```
== showDefaults
== showOculusFile
src/lib/views/system/workbench/settings/List.svelte:109:    function showOculusFile(path: string): void {
src/lib/views/system/workbench/settings/List.svelte:139:                                onclick={() => showOculusFile(defaults)}
src/lib/views/system/workbench/settings/List.svelte:174:                                            onclick={() => showOculusFile(row.file)}
== show_file
src/lib/views/system/workbench/settings/List.svelte:170:                                            label={t('settings.show_file')}
src/lib/views/system/workbench/settings/List.svelte:172:                                            title={t('settings.show_file_tip', row.file)}
config/text/views/system/workbench.yml:73:        show_file: Show File
config/text/views/system/workbench.yml:74:        show_file_tip: "Open oculus's {0} in a tab that only reads it"
== show_file_tip
src/lib/views/system/workbench/settings/List.svelte:172:                                            title={t('settings.show_file_tip', row.file)}
config/text/views/system/workbench.yml:74:        show_file_tip: "Open oculus's {0} in a tab that only reads it"
== settings_open_unavailable
```

`grep -rn -i "Show File" ...` finds only the comments of this step (`folders.ts:28`, `config-files.ts:33`, `groups.ts:20`, `List.svelte:11,13,106`) and the catalog line.

## Tests

The step adds or changes no test.

## Installed app

The installed app in `~/Applications` is the 1.1.0 build and carries the old markup; it shows this change only from the next app build.

## Runs

One full run of the verify list (`npm run test:quick`, preceded by `npm run diagrams`), green. No whole-suite command was run. No test file was run alone. `npx prettier --write` was run on the six changed files (all "unchanged").

## Limitations and sharp edges

- Show File tabs on a file the reader edits through Open file in the same session are not refreshed after a save (named above; the step does not change it).
- The six new sentences lengthen the heading lines' descriptions under Appearance, Editor and Sessions and usage, since those lines share the `desc_*` keys.
