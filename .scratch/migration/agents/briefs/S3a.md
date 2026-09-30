# Brief: S3a, the options catalog and its check

Read `.scratch/migration/agents/spec.md` first; its rules govern this step unchanged. The configuration lists no further standards pages. No ADR touches the step: the repository has no `docs/adr` folder (`ls docs/adr` prints "No such file or directory"). The DESIGN.md sections this step is measured against are "Repository layout" (`DESIGN.md:36`) and "Configuration" (`DESIGN.md:83`).

A design ruling decides what is built. It never exempts the code: every line is written to the standards, so that people can read, use and maintain it.

## The plan line

S3a the options catalog `config/catalogs/options.yml` under `options:`, every option and `local.yml` key described from its reader, with default, control and `fields:`; the Z77 check; `LOCAL_KEYS` exported; `focus_label_mode` read by the Focus cards and ticker; `stale_days` folded into `refresh_stale_days` (ruling Z75) (ruling Z77) (ruling Z94) (ruling Z120)

## The rulings it carries (plan.md, Rulings; the state file's closed log in full)

- Z75 (a): every option of every config file is described once in a catalog under `config/catalogs/`, which the Settings editor (S3c) draws; `local.yml`'s keys are listed with their description and never their value.
- Z77 (a): a check in `npm run test:checks` fails and names each key of the five tracked config files with no entry in the catalog and each catalog entry with no key; `local.yml` is never read, its keys come from the server's own list.
- Z94: (1) (c) one option is a key path, except that a family of records is one option whose entry describes the record's fields once; (2) (a) one file `config/catalogs/options.yml`, a map of config file name to a map of dotted key path to `{ description, default, section?, control?, values? }`, `control` one of `toggle`, `number`, `text`, `choice`, `list`, `values` the choices of a `choice`; (3) (a) the catalog holds the default, Modified is a value that differs from it, and the check fails on an entry with no `default`.
- Z118 (a) (the orchestrator, automode): a family's entry holds `fields:`; a family and a `local.yml` entry carry no `default`.
- Z119 (a) (the orchestrator, automode): S3 is split; this step is the catalog and its check. S3b builds the `config-key` write and S3c the editor.
- Z121 (a) (the orchestrator, automode), with its correction of 2026-09-30 23:58 in `choices.md`: (1) the file's one top-level key is `options:`, holding Z94's map, so the merged config gains one key and not six keys named after files; (2) an option's `default` is the value the tracked file holds at the base, `terminal.font_px` (12.5) and `wallpaper.popover_opacity` (0.97) included, whose descriptions say what leaving the key out does; (3) no `min` or `max` fields, since S3b refuses a value the config readers refuse; (4) the check fails on a missing or empty `description`.
- Z120 (a) (Axel), with Z122 (a) (the orchestrator, automode): the Focus board's cards and the week's ticker lines take `focus_label_mode`, `short` or `full`, as the Projects and Archive boards take `project_label_mode` and `archive_label_mode` (`src/lib/state/boards/board/presets.ts:190-195`), and the comment at `config/layout.yml:171` keeps the ticker. Built here (What to build 5).
- Z123 (a) (the orchestrator, automode): `refresh_stale_days` is the one key for a feed's staleness; `stale_days` and the fallback in code are removed. Built here (What to build 6).
- Z125 (a) (the orchestrator, automode): both are built in this step, since the catalog describes those keys; no separate step.

## What is on the tree (read on main at b5c84982; the tree outside `.scratch` is as at e9484791)

- The five tracked config files, top-level keys (`python3` over `yaml.safe_load`): `appearance.yml` 6, `behavior.yml` 31, `layout.yml` 13, `present.yml` 1 (`deck`), `sources.yml` 15.
- The family rule, applied by walking each file (a script in the session's scratch folder, and again by the brief check): 115 options on the base tree, 22 of them families, and 111 once `stale_days`' four leaves are removed (What to build 6). appearance 14 (family `themes`); behavior 48 (44 after) (families `read_limits`, `usage_tiers`, `open.program_ext`); layout 19 (families `rail`, `nav_groups`, `arrangements`, `tab_split`, `tab_rollup`, `nav_live`, `docs`); present 19 (families `deck.tag_tones`, `deck.meta.legend`, `deck.themes`, `deck.order`, `deck.framing`, `deck.summaries`, `deck.ideas.items`); sources 15 (families `scan`, `collections`, `indexes`, `roots`). No list of records sits outside these families. Two keys hold a dot inside a family (`read_limits` has `status.line`; `open.program_ext` has `.docx` and the like), so every dotted key path outside a family is unique. No tracked value is `null`.
- `local.yml`'s keys are `LOCAL_KEYS` at `src/lib/data/sources/config/local.ts:91-108` (16 names), not exported. An unknown key is warned about and ignored by `loadLocal` (`local.ts:237-238`, `:313-315`); `checkLocal` (`local.ts:349-357`) passes no `onUnknown`. `tests/views/system/help.test.ts:335-341` reads the names out of `local.ts`'s source text with the regex `/const LOCAL_KEYS = \[([^\]]*)\]/`.
- The catalogs are merged into the one config map: `src/lib/data/sources/config/merge.ts:94` collects `config/catalogs/`, `:153-168` merges every top-level key of every file, and the whole merged config goes to the page on the `config` channel (`catalogs.ts:37-38`). `agents.yml`, `glyphs.yml`, `icons.yml`, `manifest-schema.yml` and `meta.yml` each hold one top-level key; `vocab.yml` holds 24 (`config-folder.test.ts:180`).
- `grep -rn "config.options\|\['options'\]" src` finds no reader of an `options` key; `grep -rn "optionPaths\|CatalogEntry\|desc_options\|options\.yml" .` outside the ledger finds nothing.
- `tests/checks/config/config-folder.test.ts`: `EXPECTED` at `:107` lists every top-level key by file; `:359` compares the merged config's keys with it; `:659-670` compares the tracked files with `Object.keys(EXPECTED)`; `:430` checks that each file has a `config.desc_<name>`.
- `config/text/views/system/config.yml:4-15` holds `desc_<name>` per file; `tests/views/system/config.test.ts` holds them to the files.
- `HELP.md:214-230` is the configuration section: its paragraph calls `catalogs/` "the vocabularies", and its table has a row for `glyphs`, `icons`, `manifest-schema`, `meta` and `vocab` and none for `catalogs/agents.yml`. `DESIGN.md:44` lists the catalogs as "the vocabularies: glyphs, icons, vocab, meta, manifest-schema", leaving out `agents`. `DESIGN.md:85` names each tracked config and catalog file's role one by one, and names neither `catalogs/agents.yml` nor, after this step, `catalogs/options.yml`.
- Readers take their defaults from the config file: `src/lib/data/sources/config/settings.ts:1-3`, and spec.md bans hardcoded fallbacks. `appearance.yml:30-32` holds `terminal.font_px: 12.5` with the comment "leave the key out to follow the theme's `--fs-md` token"; `appearance.yml:45-47` holds `wallpaper.popover_opacity: 0.97` with "Unset = three quarters of the way from `panel_opacity` to solid".
- `focus_label_mode: short` at `config/layout.yml:171` (comment "Focus board cards and the \"This week\" ticker") has no reader (`grep -rn focus_label_mode src` prints nothing). The Focus board's cards draw their name as `labelOf(project)` (`src/lib/views/boards/focus/lanes/LaneCard.svelte:105`), and the week's ticker names a project with `labelOf(project)` at `src/lib/state/boards/ticker.ts:206`, `:325` and `:367`; `labelOf` (`src/lib/state/boards/focus.ts:314-317`) gives the manifest's `short:` when set and the title otherwise. `LaneCard.svelte` reads no store and draws what `Lanes.svelte:215-225` hands it; `Lanes.svelte:58` holds `config = $derived(configMap())`; `ticker(snapshot, config, now)` (`ticker.ts:183`) has the config. `labelOf` is also the project tab's name (`Focus.svelte:98`) and the quick-add picker's (`QuickAdd.svelte:40`), which stay the short handle, as the Projects board's tab names do. `presets.ts:190` says the label modes are in `config/behavior.yml`; they are in `config/layout.yml`.
- `stale_days: { litwatch: 14, inbox: 10, scout: 7, audit: 7 }` (`config/behavior.yml:11-12`) and `refresh_stale_days: { litwatch: 14, inbox: 2, scout: 7 }` (`behavior.yml:45-49`) are both read by `staleAfter` (`src/lib/state/feeds/feeds.ts:56-65`), which starts from `STALE_DAYS` (`feeds.ts:20-21`, a fallback in code), then `stale_days`, then `refresh_stale_days`, the later winning; `FEEDS` (`feeds.ts:18`) is litwatch, inbox and scout, so `stale_days.audit` has no reader and the tracked `stale_days` values never take effect. `tests/state/boards/focus.test.ts:813-817` asserts `refresh_stale_days` over `stale_days`. `config-folder.test.ts:112` lists `stale_days` in `EXPECTED`. The `stale_days` in `tests/checks/config/config.test.ts:374-505` is a key of fixture files and stays.
- `tests/checks/config` holds 3 files; `src/lib/data/sources/config` holds 8 tracked items, so one new module fits under the ten-item rule.

## What to build

1. **The catalog.** `config/catalogs/options.yml`, its one top-level key `options:`, holding a map of config file name (`appearance.yml`, `behavior.yml`, `layout.yml`, `present.yml`, `sources.yml`, `local.yml`) to a map of dotted key path to an entry. The fields of an entry:
   - `description`: one to three plain sentences saying what the option does and what changing it changes, read from the code that reads it (and the file's own comment). The report lists, for every entry, the `file:line` of the reader it was written from.
   - `default`: the value the tracked file holds at the base. Required on every entry of a tracked file that is not a family; absent on a family and on a `local.yml` entry. For `terminal.font_px` and `wallpaper.popover_opacity` the description also says what leaving the key out does, from the file's comment.
   - `section`: optional, a non-empty string, the heading the option is shown under; absent means the first segment of the key path.
   - `control`: required on every entry of a tracked file that is not a family. `toggle` for a boolean, `number` for a number, `text` for a string, `choice` (with `values`) for a string from a closed set the code switches on, `list` for a list of scalars. Absent on a family and on a `local.yml` entry.
   - `values`: the closed set a `choice` accepts, read from the code that switches on the value, a non-empty list of distinct strings; only on a `choice`.
   - `fields`: on a family only, a non-empty map of name to a one-line string. For a list of records, each record field. For a map family, `key` says what the map's keys are, then either `value` (what a value is, when the values are scalars) or each field of the record a value holds (when the values are records, as in `nav_groups`, `arrangements`, `nav_live`, `deck.themes`, `deck.framing`, `deck.summaries`).
   The family rule, stated in the file's head comment: a family is a list of records, or a map whose keys are names the data or the reader chooses (page names, tier names, field names, project types, tag names, file extensions, theme names) rather than names oculus reads; every other leaf is an option. The 22 families are those under "What is on the tree". A `local.yml` entry holds `description` alone. Five real cases under the rule:
   - `behavior.yml` `slurm.poll_min: 20` (`behavior.yml:81`) gives `slurm.poll_min: { description: ..., default: 20, control: number }`.
   - `appearance.yml` `crt.default: false` gives `crt.default: { description: ..., default: false, control: toggle }`.
   - `behavior.yml` `usage_tiers` (a map of tier name to a string) gives `usage_tiers: { description: ..., fields: { key: ..., value: ... } }`.
   - `layout.yml` `map_label_mode: short` (read at `src/lib/views/structure/map/Map.svelte:66`) gives `control: choice` with `values` the modes the code accepts.
   - `behavior.yml` `waiting_status` (four strings) gives `control: list`.
2. **One module.** `src/lib/data/sources/config/options.ts`, its head comment saying what it does and why the walk stops at a family:
   - The types `CatalogEntry` and `Catalog` (file name to key path to entry).
   - `catalogOf(config: Record<string, unknown>): Catalog`, which reads the merged config's `options` key and returns it, an empty catalog when the key is missing or not a map. It is the reader of the `options` catalog key that spec.md's rule "every catalog key has a reader in the tree" asks for; the check reads the catalog through it, and S3b and S3c will.
   - `optionPaths(file: unknown, entries: Record<string, CatalogEntry>): string[]`, which walks a parsed config file and returns every key path to a leaf. A scalar, a `null` and a list (of scalars or of records, empty or not) are leaves: the walk never descends into a list. A map is descended into, except at a path whose entry has `fields`, where the path itself is returned and the walk stops. An empty map outside a family returns its own path. A file that is not a map returns no paths.
3. **The check (Z77, Z121 (4)).** `tests/checks/config/options-catalog.test.ts` in `npm run test:checks`, reading the catalog with `catalogOf` over the merged config and each tracked file with `yaml`. It fails, naming the file and the path, on each of these, and never throws on a malformed catalog:
   - `options` missing or not a map; a file name outside the six; a file mapped to something that is not a map; an entry that is not a map.
   - A key path that is empty or has a leading, trailing or doubled dot.
   - Each key path `optionPaths` returns with no entry; each entry with no key in the file; each entry at a path under a path whose entry has `fields`. A map with no entry at its own path and none at any path below it is named once, at its own path.
   - A key path that two different keys of the file give (a key `a.b` beside a map `a` holding `b`).
   - A missing, empty or non-string `description`.
   - On an entry of a tracked file that is not a family: no `default`; no `control`; a `control` outside the five words; `values` on a control other than `choice`; a `choice` without `values`, with an empty `values`, or with duplicate or non-string `values`; a default that does not fit the control (`toggle` a boolean, `number` a finite number, `text` a string, `choice` one of `values`, `list` a list of scalars); and the file's value at that path not fitting the control in the same way.
   - On a family entry: `default`, `control` or `values`; `fields` missing, empty, or holding a line that is not a string; the file's value at the path being a scalar or a list of scalars.
   - A `section` that is not a non-empty string; a field outside `description`, `default`, `section`, `control`, `values`, `fields`.
   - On a `local.yml` entry, any field but `description`; the catalog's `local.yml` entries compared with `LOCAL_KEYS` both ways. The test opens no file named `local.yml`.
   The test head says what it does not cover: whether a description is true and whether a default is the value the file held at the base, which the review reads (the second through case 15's run).
4. **What the catalog touches.**
   - `local.ts` exports `LOCAL_KEYS`. `tests/views/system/help.test.ts:335-341` imports it instead of reading `local.ts`'s source text, the rest of that case unchanged.
   - `config-folder.test.ts` gains `catalogs/options.yml` with its key `options` in `EXPECTED`.
   - `config/text/views/system/config.yml` gains `desc_options`: "Every option of every config file: what it does, its default, and the control it is set with." (No sentence says the Settings view draws it; S3c adds that when it does.)
   - `HELP.md`'s configuration section: the paragraph at `:216` says `catalogs/` holds the vocabularies and the options catalog; the table gains a row `catalogs/options.yml` with the `desc_options` sentence, and a row `catalogs/agents.yml` with the `desc_agents` sentence (`config/text/views/system/config.yml:4`), since the table lists every file.
   - `DESIGN.md:44` reads `catalogs/  the vocabularies and the options: agents, glyphs, icons, vocab, meta, manifest-schema, options`. `DESIGN.md:85` gains, beside the other catalogs, the agent composer's models, efforts and permission modes in `catalogs/agents.yml` and every option of every config file with its description, default and control in `catalogs/options.yml`, read through `catalogOf` of `data/sources/config/options.ts`.
5. **`focus_label_mode` read.** `focus.ts` gains `focusLabel(project, mode)`: the whole title when `mode` is `full`, `labelOf(project)` otherwise. `Lanes.svelte` hands each `LaneCard` its label from `focusLabel(project, config.focus_label_mode)`, and `LaneCard.svelte:105` draws that label (a new prop, the card still reading no store). `ticker.ts` names a project in its lines at `:206`, `:325` and `:367` with `focusLabel(project, config.focus_label_mode)`. The project tab's name and the quick-add picker keep `labelOf`. `config/layout.yml:171`'s comment reads "Focus board cards and the week's ticker lines"; `presets.ts:190`'s comment names `config/layout.yml`. The catalog's entry for the key is `control: choice`, `values: [short, full]`, `default: short`, its description naming the cards and the ticker lines.
6. **One key for a feed's staleness.** `stale_days` is removed from `config/behavior.yml` (lines 11-12, the comment with it), from `config-folder.test.ts`'s `EXPECTED`, and gets no catalog entry. `staleAfter` reads `refresh_stale_days` alone, and `STALE_DAYS` is removed: a feed the key does not name, or names with a value that is not a finite number, is not nudged (`staleAfter` answers `Infinity`), and its head comment says so. `feeds.ts:56`'s doc comment and `focus.test.ts:813-817` say one key; the `refresh_stale_days` comment at `behavior.yml:45` is kept.

## Cases

The builder's first task, before any change: run every case below on the unchanged tree and write down its result (the check's cases as tests on fixture catalogs and fixture files in a temporary folder, the others by reading or by the named command); a case the brief's rules get wrong is handed back before any code changes.

1. The check over the tree with `options.yml` written: passes. Base: fails (no catalog).
2. A key added to a fixture `behavior.yml` with no entry: fails naming the file and the key path.
3. An entry whose key is in no file: fails naming it.
4. An entry with no `description`, one with `description: ''`, and one with `description: 3`: fails naming each.
5. A non-family entry with no `default`; one with no `control`; a `choice` with no `values`, with `values: []`, with `values: [a, a]`; `control: slider`; `values` on a `number`; a `choice` whose default is outside its `values`; a `toggle` defaulting to `"yes"`; a `number` defaulting to `"2"`; a `text` defaulting to `3`; a `list` defaulting to `[{ a: 1 }]`: fails naming each.
6. `control: text` on a fixture file's `slurm.poll_min: 20`, and `control: list` on a string value: fails naming each (the file's value does not fit the control).
7. A family entry carrying `default` or `control`; a family entry with `fields: {}`; `fields` on `crt.default` (a scalar) and on `waiting_status` (a list of scalars); a `local.yml` entry carrying `default`, `section` or `fields`: fails naming each.
8. An entry at `usage_tiers.prolite` beside the family `usage_tiers`: fails naming it.
9. A fixture `rail:` list of records with its entry removed: fails naming `rail`. A fixture map `slurm` whose entries are all removed: fails naming `slurm` once.
10. An entry with a misspelt field `defualt`; a top-level file name `glyphs.yml`; `section: ''`; an entry whose value is `20` rather than a map; `options:` holding a list; `behavior.yml:` mapped to `null`: fails naming each, and the test does not throw.
11. Key paths `''`, `.slurm`, `slurm.` and `slurm..poll_min` in the catalog: fails naming each. A fixture file holding `a.b: 1` beside `a: { b: 2 }`: fails naming `a.b`.
12. A `local.yml` entry not in `LOCAL_KEYS`, and a `LOCAL_KEYS` name with no entry: fails naming each; the test opens no file named `local.yml` (by reading the test).
13. An empty list with its entry (`indexes: []` a family, `audit_ignore: []` a `list`): passes.
14. `optionPaths` over a fixture: a flow map (`stale_days: { litwatch: 14 }`) gives `stale_days.litwatch`; a family stops the walk and gives its own path; a three-segment path (`deck.meta.kicker`) is returned whole; a list of scalars and a list of records each give their own path; `stale_days: {}` gives `stale_days`; a bare `indexes:` gives `indexes`; an empty file and a file holding a list give no paths. `catalogOf` of a config with no `options`, or with `options: 3`, gives an empty catalog.
15. Every `default` equals the value the tracked file holds at the base: a command the builder runs once over the finished catalog and the five files (a vitest run of a throwaway test in the temporary folder, or a `node` one-liner over `yaml`), its output quoted in the report with zero differences. This is a fact of the base, which S3b's writes change by design, so it is not a standing test.
16a. `focusLabel` of a project with `short: HCC` and title "Hepatocellular carcinoma network": `short` gives `HCC`, `full` gives the title, a missing or unknown mode gives `HCC`; a project with no `short:` gives the title under both.
16b. A lane card rendered under `focus_label_mode: full` draws the title; under `short`, the short handle (a render of `Lanes` or `LaneCard` in the existing Focus view test's harness). The project tab opened from that card is still named by the short handle.
16c. `ticker` over a fixture with a project deadline and a follow-up, under `full` and under `short`: the paper line and the follow-up line carry the title and the short handle in turn.
16d. `staleAfter` over a config holding only `refresh_stale_days: { inbox: 2 }`: `inbox` gives 2, `litwatch` gives `Infinity` (not nudged); a config also holding `stale_days: { inbox: 30 }` still gives 2 for `inbox` and `Infinity` for `litwatch`. Base: `litwatch` gives 14 from `STALE_DAYS`.
16e. `refresh` (`feeds.ts:115-135`) over a snapshot whose feeds are all old and a config naming only `scout`: only `scout` is nudged.
16. `help.test.ts` passes with `LOCAL_KEYS` imported; `config-folder.test.ts` and `config.test.ts` pass with the new file.
17. By reading: every description names what the option does, and the report's table gives the reader's `file:line` for each entry; `focus_label_mode` is described as Z120 (a) and Z122 (a) say; `stale_days` has no entry and `refresh_stale_days` is described as the one threshold per feed.

## Paths this step writes

- `config/catalogs/options.yml`
- `config/text/views/system/config.yml`
- `src/lib/data/sources/config/options.ts`
- `src/lib/data/sources/config/local.ts`
- `tests/checks/config/options-catalog.test.ts`
- `tests/checks/config/config-folder.test.ts`
- `tests/views/system/help.test.ts`
- `config/layout.yml` line 171
- `config/behavior.yml` lines 11-12
- `src/lib/state/boards/focus.ts`
- `src/lib/state/boards/ticker.ts`
- `src/lib/state/boards/board/presets.ts` line 190
- `src/lib/state/feeds/feeds.ts`
- `src/lib/views/boards/focus/lanes/Lanes.svelte`
- `src/lib/views/boards/focus/lanes/LaneCard.svelte`
- `tests/state/boards/focus.test.ts`
- `tests/state/boards/focus-lanes.test.ts`
- `tests/views/boards/focus.test.ts`
- `HELP.md` lines 214-230
- `DESIGN.md` lines 44 and 85
- `.scratch/migration/agents/reviews/S3a-report.md`

## Decisions taken in this brief (each reversible)

1. The walk and the catalog reader live in `src/lib/data/sources/config/options.ts`, so the check, S3b's writer and S3c's rows share them.
2. A map family's `fields` names its keys `key` and its values `value`, or the record's fields when a value is a record.
3. `tab_split` is a family (its keys are project types), and `nav_groups` is one (its keys are page names the reader chooses); `refresh_stale_days` and `board.search` are options (their keys are names oculus reads: `FEEDS` at `feeds.ts:18`, `searchOf` at `presets.ts:298-302`).
4. `section` is left out wherever the first segment of the key path is the right heading.
5. The walk treats every list as one leaf, so a list is set as a whole (`list`) or is a family, and never addressed by index.
6. A feed `refresh_stale_days` does not name is not nudged, since no fallback in code gives it a threshold.
7. `focusLabel` sits beside `labelOf` in `focus.ts`, and the lane card takes its label as a prop, so the card keeps reading no store.

## Libraries checked

Under `libraries: check`: the step reads YAML with `yaml` ^2.9.0, already a dependency; no library checks a catalog of this shape. The step adds no dependency.

## Conventions

spec.md's rules: ASCII only; comments say what and why, never when or which step; one name per thing; every code citation `file:line`; tests assert behaviour, never source text; a test of a changed behaviour is seen failing on the unchanged tree in the form it has after the change. Never open, print or grep `config/local.yml`; every grep over `config/` uses `--exclude=local.yml`. `options.yml` stays under the 1000-line limit spec.md sets for a file; if it would not, the report says so before splitting anything.

## Verify before you report

Run from `tools/oculus` in the worktree:

1. `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams`, then `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md`: prints `checks: 7 commands passed`, exit 0. The lines it prints are what the report quotes.
2. `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npx vitest run tests/checks/config tests/views/system/help.test.ts tests/views/system/config.test.ts tests/state/boards tests/views/boards/focus.test.ts --testTimeout 0`: all passing.
3. Each new test of a behaviour the step adds fails on the unchanged tree in the form it has after the change, and the report quotes that failure.

## Report

Write it to `.scratch/migration/agents/reviews/S3a-report.md` in the worktree. First line: anything NOT done, or "Everything in the brief is done". Then the state file's open items, verbatim. Then the cases' first run on the unchanged tree, one row per case. Then the DONE / NOT DONE table with the checks above and their output verbatim. Then the table of every catalog entry with the reader's `file:line`. Then "User-visible changes", each with the before and after. Then anything in the brief that was wrong or impossible, with the evidence.
