Everything in the brief and in the ruling is built and every command of the verify list passes, except one behaviour that needs a browser and is not verified: the name of the project tab a lane card opens is still the short handle by reading the code (`Focus.svelte:96-99` and `QuickAdd.svelte:40` call `labelOf` and this step does not touch either file), but no test presses a card, since the suite renders to a string. It is left for the look.

# S3a, the options catalog and its check

## Open items

The state file's list, verbatim (the copy in this worktree, `.scratch/migration/orchestrator-state.md`):

- Z129 (raised 2026-10-01 00:30, from X3d's diagnosis). The Graph's commit press hangs the page on main, not only with X3d: a commit row pressed in the Repositories view sends the renderer to 100% of a core, and a commit kept open in the saved state hangs the page again on reload (the TEST tab crashed at 00:14 and hung again on reload; a new tab loaded at 00:22 with no commit open). The cause and a proven fix are in X3d's Step 0 (`ui/tree/virtual.ts`, `VirtualRows.svelte`, one test). (a) The fix is the first item of X3d's rebuild, as the no-tiny-steps demand says, since X3d touches the Repositories view. For: no new step. Against: the hang stays on main, on Axel's page as well as TEST, until the whole X3d rebuild lands, hours away with its parity inventory. (b) A step of its own for the fix and its test, prepared now and landing within the hour; X3d's brief then leaves it out. For: the page stops hanging today. Against: one small step, which the no-tiny-steps demand rules out when a step covers the files. Recommendation: (b), since a hang on every commit press is a defect on main that no rebuild should wait for; it is Axel's, since it departs from his standing demand. The lazy option is (a).

Raised by this step, for the orchestrator to book (each needs a ruling because it changes a config vocabulary or a tracked file the ruling Z130 did not name):

- S3a-1. `map_label_mode` accepts `title` for the full title (`src/lib/state/boards/structure/graph.ts:83`), while `focus_label_mode`, `project_label_mode` and `archive_label_mode` accept `full` (`presets.ts:305-309`, `focus.ts:323`) and the tracked comment above the four keys (`config/layout.yml:165-167`) says `full` for all of them. A viewer who sets `map_label_mode: full` gets the short handle. The catalog describes the key as the code reads it (`values: [short, title]`) and the comment at `config/layout.yml:174` now says so. (a) Make the map accept `full` (and keep `title`), then the catalog says `[short, full]`: one word for the four keys. For: the comment is true without a footnote. Against: one more edit of `graph.ts` and its test. (b) Leave the word `title`. For: no code change. Against: the vocabulary differs between two keys of one file. Recommendation: (a). The lazy option is (b).
- S3a-2. Three fields of tracked rows have no reader in `src`, the same shape as Z130: `tier:` on each `scan:` row (`config/sources.yml:14-19`; `ScanRule` at `src/lib/data/model/model-entities.ts:57-65` has `dir`, `type`, `nested`, `optional`, and `manifests.ts:210` derives the tier from the last segment of `dir`), and `title:` and `icon:` on each `collections:` row (`config/sources.yml:55-62`; `CollectionFile` at `model-entities.ts:37-40` has `key` and `file`). The catalog's `fields` for `scan` and `collections` therefore list only the fields a reader takes. (a) Remove the three fields from the tracked rows, as Z130 (a) did for the three keys. For: the file and the catalog agree, and S3c never draws a field that changes nothing. Against: one edit of `config/sources.yml`, and the cockpit's own copy is a separate file. (b) Keep them as documentation. For: no edit. Against: a row carries words nothing reads. Recommendation: (a). The lazy option is (b).

## The cases, first run on the unchanged tree

Cases 2 to 14 ran on the prototype of the check (the module and the test file, with the catalog absent), 73 tests of which 72 passed and the tree run failed; the tests are now in the tree as `options-catalog.test.ts` (63) and `options-walk.test.ts` (10). Case 16 and the new case ran again on the unchanged tree in their final form, as the paragraph after the table says.

| Case | Result on the unchanged tree |
|---|---|
| 1 | The check over the tree fails: `options: missing or not a map of config file names`. A fixture holding one key of each kind passes with no finding. |
| 2 | Holds: `behavior.yml: extra: has no catalog entry`. |
| 3 | Holds: `behavior.yml: ghost: names no option of the file`. |
| 4 | Holds for a missing, an empty and a numeric description: `behavior.yml: slurm.host: description is missing, empty or not a string`. |
| 5 | Holds for every row (no default, no control, `slider`, a choice with no values, with `[]`, with `[a, a]`, with a non-string value, `values` on a number, a choice default outside its values, a toggle `"yes"`, a number `"2"`, a text `3`, a list `[{ a: 1 }]`, an infinite number), each with its own finding. |
| 6 | Holds: `text` on `slurm.poll_min: 20` and `list` on a string give `the value the file holds does not fit control ...`. |
| 7 | Holds: default, control and values on a family; `fields: {}`; a field line that is not text; `fields` on `crt.default` and on `waiting_status`; a `local.yml` entry with default, section or fields. |
| 8 | Holds: `behavior.yml: usage_tiers.prolite: sits under the family usage_tiers, which is described by its fields`. |
| 9 | Holds: a removed `rail` entry gives `layout.yml: rail: has no catalog entry`; a `slurm` map with every entry removed gives one finding, `behavior.yml: slurm: has no catalog entry`. |
| 10 | Holds and nothing throws: `defualt`, `glyphs.yml`, `section: ''`, an entry `20`, `options:` a list, `behavior.yml:` mapped to `null`. |
| 11 | Holds: `''`, `.slurm`, `slurm.`, `slurm..poll_min` each give `key path is empty or has a leading, trailing or doubled dot`; `a.b: 1` beside `a: { b: 2 }` gives `behavior.yml: a.b: two keys of the file give this path`. |
| 12 | Holds: `local.yml: colour: is not a key the machine-local file reads` and `local.yml: mail_dir: has no catalog entry`; a planted `local.yml` with an unlisted key is not read. |
| 14 | Holds for every row of `optionPaths` and `catalogOf`, and for a file `42` and for the reserved names `constructor` and `toString` as a key and as an entry. |
| 13 | A family's file value that is a scalar or a non-empty list of scalars fails (`waiting_status` and `crt.default` given `fields`, a key holding null); `[]` passes as a `list` (`audit_ignore`) and passes as a family. |
| 15 | Not runnable on the unchanged tree; run once on the finished catalog, see below. |
| 16a | `focusLabel is not a function`, 3 tests (`tests/state/boards/focus-lanes.test.ts`, `focusLabel`). |
| 16b | Base: `AssertionError: expected 'Alpha' to be 'Alpha, the whole title'` (`tests/views/boards/focus.test.ts`, `names a card by its whole title under focus_label_mode full and by its handle under short`). |
| 16c | Base: `expected [ 'HCC', 'HCC - chase', 'HCC: redraw' ] to deeply equal [ ...(3) ]` (`focus-lanes.test.ts`, `the project labels of the ticker`, full). |
| 16d | Base: `expected 7 to be Infinity` (a config naming no `scout` still gives 7 from `STALE_DAYS`) and `expected 14 to be Infinity` (`litwatch` with only `inbox` named, and with a `stale_days` key), `tests/state/feeds/feeds.test.ts`. |
| 16e | Base: `expected [ 'litwatch', 'inbox', 'scout' ] to deeply equal [ 'scout' ]`. |
| 16 (the new case 3 of the ruling) | Base: `expected [ { feed: 'litwatch', days: null } ] to deeply equal []` (a radar that has never run, a key naming only `scout`). |
| 16 (LOCAL_KEYS) | Base: `TypeError: LOCAL_KEYS is not iterable` (`tests/views/system/help.test.ts`, `names every key the machine-local file may carry`). |
| config-folder | Base: three failures, the expected key list and the `desc_options` list differ by the new file. |
| 17 | By reading, see the table of entries. |

The run that produced the failures above: the nine changed source and config files were replaced by the copies in `/Users/axelfaes/workspace/research-hub/tools/oculus`, `config/catalogs/options.yml` was taken away, and `npx vitest run tests/state/boards/focus-lanes.test.ts tests/state/boards/focus.test.ts tests/state/feeds/feeds.test.ts tests/views/boards/focus.test.ts tests/checks/config tests/views/system/help.test.ts --testTimeout 0` printed `Test Files  6 failed | 4 passed (10)` and `Tests  14 failed | 276 passed (290)`. The files were then put back; `cmp` of each against the saved copy printed `same` for all ten.

Case 15, run once over the finished catalog and the five tracked files with a `node` one-liner over `yaml` (`JSON.stringify` of each file's value at the entry's path against the entry's `default`):

```
checked 87 differences 0
```

87 is the 108 options less the 21 families. The same comparison in Python over `yaml.safe_load` prints the same.

## DONE / NOT DONE

| Deliverable | State | Proof |
|---|---|---|
| Catalog `config/catalogs/options.yml` (108 options and families of the five tracked files, 16 `local.yml` keys) | DONE | `npx vitest run tests/checks/config/options-catalog.test.ts`, first test; counts per file: appearance 14, behavior 44, layout 17, present 19, sources 14, local 16 (`yaml.safe_load`) |
| `options.ts` (`CatalogEntry`, `Catalog`, `catalogOf`, `optionPaths`) | DONE | `src/lib/data/sources/config/options.ts`; `options-walk.test.ts` 10 tests |
| The check (Z77, Z121) | DONE | `tests/checks/config/options-catalog.test.ts` (63 tests) over `tests/checks/config/options-findings.ts`; `options-walk.test.ts` |
| `LOCAL_KEYS` exported, `help.test.ts` imports it | DONE | `local.ts:92`; `help.test.ts:18, 337` |
| `config-folder.test.ts` `EXPECTED` | DONE | `catalogs/options.yml` added at `:162`; `stale_days` and `indexes` removed |
| `desc_options`, HELP.md, DESIGN.md | DONE | `config/text/views/system/config.yml:13`; `HELP.md:216, 220, 228`; `DESIGN.md:44, 85` |
| `focus_label_mode` read by the cards and the ticker | DONE | `focus.ts:323`; `ticker.ts:187, 207, 329, 374`; `Lanes.svelte:218`; `LaneCard.svelte` prop `label` |
| `stale_days` folded into `refresh_stale_days`, `STALE_DAYS` removed | DONE | `feeds.ts:58-62`; `grep -n "stale_days" config/behavior.yml` prints only the `refresh_stale_days:` line |
| Ruling 1: `board.no_funding`, `indexes` removed, comments corrected | DONE | `git diff config/layout.yml config/sources.yml`; `grep -rnE "board\.no_funding\|indexes: *\[\]"` over `tests src DESIGN.md HELP.md README.md config` prints nothing outside the text catalog's own `no_funding` words |
| Ruling 3: the never-run radar follows the rule | DONE | `feeds.ts:117-121`; test `leaves a radar that has never run alone when the key does not name litwatch` |
| Ruling 4: `deck.selection`, `deck.slide_order` out of the catalog | DONE | not in `options.yml`; named below |
| Focus project tab name after a card press | NOT VERIFIED | needs a browser; see the first line |
| `npm run diagrams` then `checks.sh` | DONE | quoted below |

`npm run diagrams` exited 0 and rewrote `docs/diagrams/layer-data.dot`, `layer-data.svg`, `layer-views.dot`, `layer-views.svg`, `layers.dot` and `layers.svg`, which the change set includes.

`sh ~/.claude/skills/land/templates/checks.sh .../S3a/tools/oculus/.scratch/migration/orchestrator-state.md`, exit 0, its lines:

```
$ npm test
 Test Files  352 passed | 20 skipped (372)
      Tests  5417 passed | 572 skipped (5989)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  438 passed | 9 skipped (447)
$ npm run check
COMPLETED 2484 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

`npx vitest run tests/checks/config tests/views/system/help.test.ts tests/views/system/config.test.ts tests/state/boards tests/views/boards/focus.test.ts tests/state/feeds --testTimeout 0`: `Test Files  35 passed (35)`, `Tests  619 passed (619)`.

The ASCII gate of spec.md (`perl` over `src tests config`, without `local.yml`) prints nothing. A first `npm test` run inside `checks.sh` once ended on an unhandled `setTypeOfService EINVAL` raised from `tests/server/root/dev-server.test.ts` (an undici socket option), with all 352 files passing; it did not recur in the next two runs and no file of this step is involved.

## What the step changed in the tree (files)

Config: `config/catalogs/options.yml` (new), `config/behavior.yml`, `config/layout.yml`, `config/sources.yml`, `config/text/views/system/config.yml`. Source: `src/lib/data/sources/config/options.ts` (new), `local.ts`, `src/lib/state/boards/focus.ts`, `ticker.ts`, `board/presets.ts` (a comment), `src/lib/state/feeds/feeds.ts`, `src/lib/views/boards/focus/lanes/Lanes.svelte`, `LaneCard.svelte`. Tests: `tests/checks/config/options-catalog.test.ts`, `options-findings.ts` and `options-walk.test.ts` (new), `config-folder.test.ts`, `tests/state/boards/focus-lanes.test.ts`, `tests/state/boards/focus.test.ts` (the threshold test now says one key), `tests/state/feeds/feeds.test.ts`, `tests/views/boards/focus.test.ts`, `tests/views/system/help.test.ts`. Docs: `HELP.md`, `DESIGN.md`, and the six diagram files above.

The brief's path list names `tests/state/boards/focus.test.ts` and `focus-lanes.test.ts` for the new tests. `tests/state/boards` and `tests/checks/config` are at or near the ten-item folder rule and `focus.test.ts` would have passed the 900-line line, so the tests sit where the rule allows: the label tests in `focus-lanes.test.ts` (which already tests `ticker`), the threshold and refresh tests in `tests/state/feeds/feeds.test.ts` (the tests of `feeds.ts`), and the check split into `options-catalog.test.ts` (the cases), `options-findings.ts` (the findings function) and `options-walk.test.ts` (`optionPaths`, `catalogOf`). `tests/checks/config` now holds 6 items, `src/lib/data/sources/config` 9.

## User-visible changes, before and after

1. `focus_label_mode`. Before: nothing read the key; the Focus lane cards and the week's ticker lines always drew `labelOf(project)`, the short handle. After: `full` draws the whole title on the lane cards (`LaneCard.svelte`, through `Lanes.svelte:218`) and in the paper, follow-up and subtask lines of the ticker (`ticker.ts:207, 329, 374`); `short` and any other word draw the handle. The project tab a card opens and the quick-add picker keep the handle. The tracked value stays `short`, so the tracked hub shows no change.
2. `stale_days` removed. Before: `staleAfter` started from a fallback in code (`STALE_DAYS`: litwatch 14, inbox 10, scout 7), then `stale_days`, then `refresh_stale_days`; the tracked `stale_days` never took effect (`refresh_stale_days` won, and `stale_days.audit` had no reader). After: `refresh_stale_days` is the only source; a feed it does not name, or names with something that is not a finite number, is never prompted for, and that includes a radar that has never run. The tracked values (litwatch 14, inbox 2, scout 7) are unchanged, so the tracked hub prompts exactly as before.
3. `board.no_funding` and `indexes` removed from `config/layout.yml` and `config/sources.yml`. Before: two keys nothing in `src` read, and a comment naming the cockpit's `page.py`. After: neither key exists, the comments name neither. The "No funding" words the views draw are the text catalog's own and are unchanged.
4. The merged config gains one top-level key, `options`, from `config/catalogs/options.yml`; the Config view lists the file with the `desc_options` sentence (`config.test.ts` and `config-folder.test.ts` hold the list).
5. `config/layout.yml:174` comment: `map_label_mode: short        # Map tab nodes; its word for the full title is `title``. Before: the comment said nothing about the map's word.
6. `HELP.md`: the configuration paragraph names the options catalog and the table gains rows for `catalogs/agents.yml` and `catalogs/options.yml`. `DESIGN.md:44` and `:85` name the catalogs as they are.

## What the catalog does not cover

- `deck.selection` and `deck.slide_order`: the Present view's saved choice, read at `present.ts:260-261` and written by `server/edit/writes/deck.ts`, absent from the tracked `present.yml`. The catalog describes the options of the tracked files (ruling 4).
- Fields of family rows that no reader takes: the open item S3a-2.
- Whether a description is true: the check reads its shape, a person reads its meaning. Whether a default equals the value the file held at the base is case 15 above, run once and not a standing test, since a write through the Settings editor changes the file and not the default.
- The clamps and fallbacks that readers hold in code are stated in a description only where the reader has one of its own. Several readers keep a literal fallback in code for a missing key (`setting(config, 'deadline_horizon_days', 90)` at `ticker.ts:184`, `conf_horizon_months` at `:185`, `leads_horizon_days` at `:287`, `venue_conc_warn` at `ticker.ts:186`, `feeds.ts:87`, `stats.ts:76`, `linkedin_cadence_days` at `feeds.ts:83`, `AUTOSAVE_MS` at `notes.ts:59`, `STALE_LAG` for `stale_lag_days` at `selectors.svelte.ts:170`, `DEFAULT_CAP` and `DEFAULT_EXT` at `project-files.ts:71, 91`, the `0.86`, `6` and `0.97` fallbacks at `appearance.ts:98-109`, `DEFAULT_NOTIFY` at `hooks.ts:107-111`). spec.md's rule is that readers take defaults from the config file; this step describes what leaving each key out does only for `terminal.font_px` and `wallpaper.popover_opacity` (Z121 (2)) and for `file_index.max_per_project` and `file_index.ext`, where the description says what the fallback is. The other fallbacks are a defect of those readers against the spec, outside the catalog's paths, and are named here so they can be booked.

## Table of entries and readers

Reader column: the code that reads the option; a description was written from it. `f:l` is `file:line` under `tools/oculus`.

### appearance.yml

| Key path | Reader |
|---|---|
| `themes` (family) | `src/lib/state/shared/words/appearance.ts:128-139` |
| `terminal.font_px` | `appearance.ts:80-82`, `:127` |
| `wallpaper.dir` | `src/lib/server/content/wallpaper.ts:88-90`, `src/lib/server/content/images.ts:316-326` |
| `wallpaper.file` | `wallpaper.ts:105`, `:48-55` |
| `wallpaper.pick` | `wallpaper.ts:91-99`, `:106`, `:57` |
| `wallpaper.dim` | `appearance.ts:104` |
| `wallpaper.blur` | `appearance.ts:105` |
| `wallpaper.themes` | `appearance.ts:106` |
| `wallpaper.panel_opacity` | `appearance.ts:98` |
| `wallpaper.popover_opacity` | `appearance.ts:99-102` |
| `wallpaper.panel_blur` | `appearance.ts:109` |
| `memories.dir` | `src/lib/server/content/memories.ts:97`, `images.ts:316-326`, `:42`, `:56` |
| `crt.default` | `appearance.ts:125` |
| `code_theme` | `appearance.ts:126`, `src/lib/data/helpers/code-themes.ts:31-33` |

### behavior.yml

| Key path | Reader |
|---|---|
| `read_limits` (family) | `src/lib/server/content/audit/rules.ts:54-59`, `audit/projects.ts:378-396` |
| `data_domains` | `rules.ts:65`, `projects.ts:199-200` |
| `waiting_status` | `rules.ts:66`, `projects.ts:448-449` |
| `audit_ignore` | `rules.ts:101-103`, `src/lib/server/edit/writes/audit-mute.ts:23` |
| `stale_lag_days` | `rules.ts:64`, `projects.ts:231`, `src/lib/state/boards/focus-lanes.ts:51`, `src/lib/state/client/selectors.svelte.ts:168` |
| `context_window` | `selectors.svelte.ts:311-314`, `src/lib/views/sessions/session-detail/SessionDetail.svelte:88` |
| `usage_tiers` (family) | `src/lib/data/sources/config/settings.ts:155-166`, `src/lib/server/root/context.ts:209` |
| `usage_refresh_min` | `context.ts:267`, `src/lib/server/machine/usage/refresh.ts:139`, `:303`, `src/lib/views/system/usage/Usage.svelte:54` |
| `usage_refresh_model` | `context.ts:266`, `refresh.ts:85`, `:142` |
| `refresh_stale_days.litwatch` | `src/lib/state/feeds/feeds.ts:58-62`, `:117-121` |
| `refresh_stale_days.inbox` | `feeds.ts:58-62`, `:122-125` |
| `refresh_stale_days.scout` | `feeds.ts:58-62`, `:126-129` |
| `deadline_horizon_days` | `src/lib/state/boards/ticker.ts:184`, `:206`, `:242`, `:265`, `:305` |
| `leads_horizon_days` | `ticker.ts:287-291` |
| `conf_horizon_months` | `ticker.ts:185`, `:312-313` |
| `leads_badge_days` | `src/lib/state/workbench/rail-badges.svelte.ts:134`, `rail-badges.ts:55-66` |
| `venue_conc_warn` | `ticker.ts:186`, `feeds.ts:87`, `src/lib/state/boards/board/stats.ts:76`, `src/lib/views/boards/focus/CommandCenter.svelte:63` |
| `linkedin_cadence_days` | `feeds.ts:83`, `rail-badges.svelte.ts:150`, `rail-badges.ts:69-77` |
| `file_index.enabled` | `src/lib/server/files/project-files.ts:104-113` |
| `file_index.max_per_project` | `project-files.ts:104-113`, `:91` |
| `file_index.ext` | `project-files.ts:104-113`, `:71` |
| `slurm.host` | `settings.ts:17-43`, `context.ts:295` |
| `slurm.days` | `settings.ts:17-43`, `context.ts:296`, `src/lib/server/machine/hpc/parse.ts:12-14` |
| `slurm.poll_min` | `settings.ts:17-43`, `context.ts:297`, `src/lib/server/machine/hpc/poll.ts:173` |
| `slurm.quota_min` | `settings.ts:17-43`, `context.ts:298`, `poll.ts:248` |
| `slurm.prewarm` | `settings.ts:17-43`, `context.ts:299`, `poll.ts:150` |
| `chat.model` | `src/lib/data/accounts/chat.ts:11-14`, `src/lib/server/machine/pty/chat.ts:121` |
| `tasks.skip_permissions` | `src/lib/data/helpers/tasks.ts:21`, `src/routes/api/(sessions)/terminal/+server.ts:19` |
| `calendar.poll_min` | `settings.ts:55-73`, `src/lib/server/accounts/calendar/poll.ts:163` |
| `calendar.days_back` | `settings.ts:55-73`, `calendar/poll.ts:165`, `:210` |
| `calendar.days_ahead` | `settings.ts:55-73`, `calendar/poll.ts:166`, `:210` |
| `mail.poll_min` | `settings.ts:125-139`, `src/lib/server/accounts/mail/poll.ts:184` |
| `mail.per_signal` | `settings.ts:125-139`, `mail/poll.ts:222` |
| `notify.enabled` | `src/lib/server/root/hooks.ts:119-135`, `:264` |
| `notify.events` | `hooks.ts:119-135`, `:137-140`, `:264` |
| `notify.quiet_seconds` | `hooks.ts:119-135`, `:265` |
| `editor.paint_limit_kb` | `src/lib/data/helpers/editor.ts:15-29`, `selectors.svelte.ts:128` |
| `writes.timeout_seconds` | `src/lib/state/client/writes.svelte.ts:52-62` |
| `notes.autosave_ms` | `src/lib/state/life/notes.ts:62-66` |
| `changes.keep` | `settings.ts:142-152`, `src/lib/server/edit/writes.ts:221` |
| `git.message_model` | `src/lib/server/git/git-message.ts:39-47` |
| `search.max_hits` | `settings.ts:84-98`, `src/routes/api/(files)/search/+server.ts:17-20` |
| `search.timeout_s` | `settings.ts:84-98`, `search/+server.ts:21` |
| `open.program_ext` (family) | `settings.ts:107-115`, `src/lib/data/helpers/files/opens-in-program.ts:56`, `src/lib/server/files/open.ts:322` |

### layout.yml

| Key path | Reader |
|---|---|
| `rail` (family) | `src/lib/data/sources/config/rail.ts:82`, `:127`, `src/lib/state/workbench/navigation/rail.ts:32-42` |
| `nav_groups` (family) | `src/lib/state/workbench/navigation/catalogue.ts:186`, `src/lib/server/content/docs.ts:428` |
| `direct_chord` | `catalogue.ts:208-210`, `src/routes/+page.svelte:100` |
| `arrangements` (family) | `navigation/rail.ts:32`, `src/lib/state/workbench/navigation/arrangement.ts:25-54` |
| `board.cols_project` | `src/lib/state/boards/board/presets.ts:179`, `:292-296` |
| `board.cols_archive` | `presets.ts:180-181`, `:292-296` |
| `board.search.projects` | `presets.ts:299-302` |
| `board.search.archive` | `presets.ts:299-302` |
| `board.search.coauthor` | `presets.ts:299-302` |
| `tab_split` (family) | `src/lib/state/workbench/rail-badges.svelte.ts:193-196`, `:36-38` |
| `tab_rollup` (family) | `presets.ts:275-289`, `src/lib/state/boards/board/filter-menu.ts:86-88`, `rail-badges.svelte.ts:199` |
| `nav_live` (family) | `src/lib/state/workbench/rail-badges.ts:30-41` |
| `focus_label_mode` | `ticker.ts:187`, `Lanes.svelte:218`, `focus.ts:323` |
| `project_label_mode` | `presets.ts:190-195`, `:305-309` |
| `archive_label_mode` | `presets.ts:190-195`, `:305-309` |
| `map_label_mode` | `src/lib/views/structure/map/Map.svelte:66-70`, `src/lib/state/boards/structure/graph.ts:83` |
| `docs` (family) | `catalogue.ts:217`, `docs.ts:430` |

### present.yml

| Key path | Reader |
|---|---|
| `deck.equations_dir` | `src/lib/data/index.ts:195-197`, `src/lib/state/life/present.ts:262` |
| `deck.tag_tones` (family) | `present.ts:116-123`, `:263` |
| `deck.meta.kicker` | `present.ts:142`, `src/lib/views/academic/present/parts/Title.svelte:15-17` |
| `deck.meta.title_html` | `present.ts:143`, `Title.svelte:18-20` |
| `deck.meta.lede` | `present.ts:144`, `Title.svelte:21-23` |
| `deck.meta.legend` (family) | `present.ts:125-133`, `:137` |
| `deck.meta.hint` | `present.ts:145`, `Title.svelte:25-27` |
| `deck.meta.closing_kicker` | `present.ts:146`, `parts/Closing.svelte:14-16` |
| `deck.meta.closing_title_html` | `present.ts:147`, `Closing.svelte:17-19` |
| `deck.meta.closing_lede` | `present.ts:148`, `Closing.svelte:20-22` |
| `deck.meta.contact` | `present.ts:149`, `Closing.svelte:23-25` |
| `deck.themes` (family) | `present.ts:153-160`, `:283-289` |
| `deck.order` (family) | `src/lib/data/helpers/deck.ts:17-71` |
| `deck.framing` (family) | `present.ts:162-193`, `parts/Framing.svelte:15-21` |
| `deck.summaries` (family) | `present.ts:195-224`, `parts/Summary.svelte:30`, `:65-72` |
| `deck.ideas.title` | `present.ts:226-248`, `parts/Ideas.svelte:15-17` |
| `deck.ideas.lede` | `present.ts:226-248`, `Ideas.svelte:18-20` |
| `deck.ideas.hint` | `present.ts:226-248`, `Ideas.svelte:35-37` |
| `deck.ideas.items` (family) | `present.ts:229-239`, `Ideas.svelte:27-28` |

### sources.yml

| Key path | Reader |
|---|---|
| `scan` (family) | `src/lib/data/index.ts:47-58`, `src/lib/data/sources/manifests.ts:205-235` |
| `venues_file` | `data/index.ts:113`, `src/lib/state/sessions/view-source.ts:27-36` |
| `datasets_file` | `data/index.ts:114`, `view-source.ts:27-36` |
| `pillars_file` | `data/index.ts:115`, `view-source.ts:27-36` |
| `domains_file` | `data/index.ts:116`, `view-source.ts:27-36` |
| `people_file` | `data/index.ts:118`, `view-source.ts:27-36` |
| `organisations_file` | `data/index.ts:119` |
| `collections` (family) | `data/index.ts:61-70`, `:109`, `src/lib/data/sources/collections.ts:119`, `src/lib/data/snapshot/normalise.ts:60-69`, `view-source.ts:45-53` |
| `leads_file` | `data/index.ts:143`, `view-source.ts:27-36` |
| `radar_file` | `data/index.ts:144`, `view-source.ts:27-36` |
| `publications_file` | `rules.ts:67-68` |
| `linkedin_dir` | `data/index.ts:145`, `view-source.ts:27-36` |
| `career_file` | `data/index.ts:154`, `src/lib/server/edit/writes/subtasks.ts:167` |
| `roots` (family) | `src/lib/server/files/files.ts:135-175` |

### local.yml (description only)

| Key | Reader |
|---|---|
| `hub` | `src/lib/data/sources/config/local.ts:241-246`, `:117` |
| `port` | `local.ts:247-250`, `:84`, `:118` |
| `hpc_host` | `local.ts:251-256`, `context.ts:295` |
| `sessions_cache` | `local.ts:284-293`, `context.ts:255` |
| `sessions_overrides` | `local.ts:284-293`, `context.ts:256`, `writes.ts:210` |
| `workspaces` | `local.ts:284-293`, `context.ts:280` |
| `bookmarks` | `local.ts:284-293`, `context.ts:289` |
| `notes` | `local.ts:284-293`, `:45-49` |
| `changes` | `local.ts:284-293`, `writes.ts:220` |
| `claude_bin` | `local.ts:257-262`, `context.ts:265` |
| `open_bin` | `local.ts:263-268`, `context.ts:360` |
| `accounts` | `local.ts:140-168`, `:269` |
| `calendars` | `local.ts:178-208`, `:270-275` |
| `calendar_dir` | `local.ts:284-293`, `context.ts:307` |
| `mail` | `local.ts:178-208`, `:276-281` |
| `mail_dir` | `local.ts:284-293`, `context.ts:325` |

## Anything in the brief that was wrong or impossible

- The brief's size figure "under 1000 lines" is the spec's hard line; the check that binds is `tests/checks/tree/size.test.ts` at 900 lines for a source file (`LINES = 900` at `:28`). `options.yml` is 595 lines, `options-catalog.test.ts` 585, `options-findings.ts` 290, `options-walk.test.ts` 82, `focus-lanes.test.ts` 293 and `focus.test.ts` 880 (unchanged in length).
- The brief counts 115 options with `stale_days`, `board.no_funding` and `indexes`; after the ruling the tree gives 108 (`python3` walk of the five files: appearance 14, behavior 44, layout 17, present 19, sources 14) and 21 families.
- Two comments were corrected where they named a removed key or a wrong file: the `board:` comment in `config/layout.yml` and the `presets.ts:190` comment that named `config/behavior.yml` for the label modes.
