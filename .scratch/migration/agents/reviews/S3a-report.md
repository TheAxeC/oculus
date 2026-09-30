NOT DONE: everything. The step is stopped before any change, because the first run of the cases on the unchanged tree found a case the brief's own rules get wrong (case 17: three options of the tracked files have no reader, so the brief's requirement that every description is written from the code that reads it and that the report gives each entry's reader `file:line` cannot be met). No file under the worktree was written (`find` over the worktree for files newer than the start of the work prints nothing; `npx svelte-kit sync` wrote the ignored `.svelte-kit/` folder, which `.gitignore` lists). This file is the hand-back.

# S3a, first run of the cases on the unchanged tree

## Open items (the state file's list, verbatim)

- Z129 (raised 2026-10-01 00:30, from X3d's diagnosis). The Graph's commit press hangs the page on main, not only with X3d: a commit row pressed in the Repositories view sends the renderer to 100% of a core, and a commit kept open in the saved state hangs the page again on reload (the TEST tab crashed at 00:14 and hung again on reload; a new tab loaded at 00:22 with no commit open). The cause and a proven fix are in X3d's Step 0 (`ui/tree/virtual.ts`, `VirtualRows.svelte`, one test). (a) The fix is the first item of X3d's rebuild, as the no-tiny-steps demand says, since X3d touches the Repositories view. For: no new step. Against: the hang stays on main, on Axel's page as well as TEST, until the whole X3d rebuild lands, hours away with its parity inventory. (b) A step of its own for the fix and its test, prepared now and landing within the hour; X3d's brief then leaves it out. For: the page stops hanging today. Against: one small step, which the no-tiny-steps demand rules out when a step covers the files. Recommendation: (b), since a hang on every commit press is a defect on main that no rebuild should wait for; it is Axel's, since it departs from his standing demand. The lazy option is (a).

## The case the brief's rules get wrong

**Case 17, "by reading: every description names what the option does, and the report's table gives the reader's `file:line` for each entry".** Three of the 115 options the brief counts have no reader in `src`:

| Option | Tracked value | Evidence |
|---|---|---|
| `board.no_funding.label` (`config/layout.yml:133`) | `"No funding"` | `grep -rnE "config\.board|isMap\(config\.board\)" src` prints only `src/lib/state/boards/board/presets.ts:292` (`columnsOf`, reads `board[cols_project]` and `board[cols_archive]`) and `:299` (`searchOf`, reads `board.search`). Nothing reads `board.no_funding`. |
| `board.no_funding.sub` (`config/layout.yml:134`) | `"Projects with no grant attached - auto-aggregated."` | Same grep. The Collection view draws the text-catalog keys `collection.no_funding` and `collection.no_funding_sub` (`src/lib/views/boards/collection/Collection.svelte:274`, `:337`, `:342`, words at `config/text/views/boards/collection.yml:34-35`, which say "Active and manuscript projects with no scheme attached.", a different sentence from the config's), and the facet menu draws `board.no_funding` of the text catalog (`src/lib/state/boards/board/filter-menu.ts:75`, words at `config/text/views/boards/projects.yml:39`). Those are text-catalog keys; the `board.no_funding` map of `layout.yml` is read by none of them. |
| `indexes` (`config/sources.yml:69`, `indexes: []`, a family) | `[]` | `grep -rnE "config\.indexes|merged\.indexes|\.indexes\b|'indexes'" src` (minus `fuzzy.ts`'s match result and a local `indexes` map in `Tree.svelte`) prints nothing. The file's own comment (`config/sources.yml:67`) says `page.py` iterates it, and `page.py` is the cockpit's. |

The other 112 options each have a reader (list below). This is the same shape as `focus_label_mode` (Z120) and `stale_days.audit` (Z123): a key in a tracked file that nothing in oculus reads. The brief's rules give no entry that can be true for these three: an entry needs a `description` of "what the option does and what changing it changes, read from the code that reads it", and the check (What to build 3) fails an option with no entry and an entry with no key, so the three keys can neither be left out of the catalog nor described truthfully as options.

The choice is Axel's or the orchestrator's in automode (what the Settings editor S3c will draw, and two tracked config files change):

- (a) Remove the three keys from the tracked files (`config/layout.yml:132-134` with the `board:` comment lines that name them, and `config/sources.yml:64-69` with its comment block). The catalog and the files then agree, and S3c never draws an inert option. Both paths are outside the brief's "Paths this step writes" (`config/layout.yml` is listed for line 171 only, `config/sources.yml` not at all), so the brief needs the two paths widened. For: ends the cause. Against: `indexes` is a documented key of the cockpit's `page.py`; oculus has no reader for it today.
- (b) Build a reader. `board.no_funding.*` would then duplicate the text catalog's `collection.no_funding*` words (spec.md: every user-facing string is a catalog string), and `indexes` would be a new feature (auto-index tabs), which no plan line names.
- (c) Keep the keys and write entries that say nothing reads them. For: no path widened. Against: the Settings editor would offer options that change nothing. This is the lazy option.
- Recommendation: (a).

## A second point the brief's words leave open (I would resolve it as below unless told otherwise)

What to build 3 fails a family whose file value is "a scalar or a list of scalars", and case 13 says `indexes: []` (a family) passes. `[]` is a list of scalars by the definition every `control: list` check uses (`[].every(isScalar)` is true; `node -e "console.log([].every((x)=>typeof x==='string'))"` prints `true`), so the literal rule fails case 13. I read the rule as "a non-empty list whose items are all scalars", which passes `indexes: []` and fails `waiting_status`. If (a) above removes `indexes`, no tracked family is an empty list and the wording only matters to the fixture case.

## The first run, one row per case

The check and its cases were run as a prototype kept in the session's scratch folder (`scratchpad/s3a/src/options.ts`, `scratchpad/s3a/tests/options-catalog.test.ts`, `scratchpad/s3a/tests/focus-cases.test.ts`, run by `npx vitest run --config scratchpad/s3a/vitest.scratch.mjs`, which loads the repository's own vite config with the test include pointed at the scratch tests), over the unchanged tree. The prototype is what the step would put in the tree; nothing of it is in the worktree. `options-catalog.test.ts`: 73 tests, 72 pass, 1 fails (the tree run, case 1). `focus-cases.test.ts`: 12 tests, 10 fail, 2 pass.

| Case | Result on the unchanged tree |
|---|---|
| 1 | The check over the tree fails: `["options: missing or not a map of config file names"]` (no catalog). A fixture holding one key of each kind and its entries passes with no finding. The check over the tree with `options.yml` written is not runnable before the catalog exists. |
| 2 | Holds: `behavior.yml: extra: has no catalog entry`. |
| 3 | Holds: `behavior.yml: ghost: names no option of the file`. |
| 4 | Holds for all three (missing, empty, `3`): `behavior.yml: slurm.host: description is missing, empty or not a string`. |
| 5 | Holds for all fourteen rows (no default, no control, `slider`, choice with no values, `[]`, `[a, a]`, a non-string value, `values` on a number, choice default outside, toggle `"yes"`, number `"2"`, text `3`, list `[{ a: 1 }]`, number infinity), each with its own finding. |
| 6 | Holds: `text` on `slurm.poll_min: 20` and `list` on a string give `the value the file holds does not fit control ...`; a choice whose file value is outside its values gives the same. |
| 7 | Holds: default, control and values on a family; `fields: {}`; a field line that is not text; `fields` on `crt.default`, on `waiting_status` and on a null key; a `local.yml` entry with default, section or fields. |
| 8 | Holds: `behavior.yml: usage_tiers.prolite: sits under the family usage_tiers, which is described by its fields`. |
| 9 | Holds: a removed `rail` entry gives `layout.yml: rail: has no catalog entry`; a `slurm` map with all its entries removed gives exactly one finding, `behavior.yml: slurm: has no catalog entry`. |
| 10 | Holds and nothing throws: `defualt`, `glyphs.yml`, `section: ''`, an entry `20`, `options:` a list (`options: missing or not a map of config file names`), `behavior.yml: null` (`not a map of key paths to entries`); also a catalog with one key path twice (the `yaml` parser refuses it, `loadConfig` merges nothing, the check reports `options` missing). |
| 11 | Holds: `''`, `.slurm`, `slurm.`, `slurm..poll_min` each give `key path is empty or has a leading, trailing or doubled dot`; `a.b: 1` beside `a: { b: 2 }` gives `behavior.yml: a.b: two keys of the file give this path`. |
| 12 | Holds: `local.yml: colour: is not a key the machine-local file reads` and `local.yml: mail_dir: has no catalog entry`; a fixture folder holding a `local.yml` with an unlisted key is planted and that key is not reported, because the check takes its keys from the list it is given. |
| 13 | Holds for `audit_ignore: []` as a `list`. Holds for `indexes: []` as a family only under the non-empty reading named above. |
| 14 | Holds for every row of `optionPaths` and `catalogOf`, plus a file `42`, a reserved name (`constructor`, `toString`) as a key and as an entry, and a key path given twice. |
| 15 | Not runnable before the catalog exists. The 115 option paths and their tracked values are listed by the prototype walk (`python3 scratchpad/s3a/walk.py`: appearance 14, behavior 48, layout 19, present 19, sources 15, total 115), so the comparison is ready to run over the finished catalog. |
| 16a | `focusLabel` is not a function on the base: 4 of 4 tests fail (`TypeError: fl is not a function`). |
| 16b | Base: `focus_label_mode: full` draws `Alpha` on the lane card (expected `Alpha, the whole title`), fails; `short` draws `Alpha`, passes. The card's `div` carries the full title as its `title` attribute already, so the test reads the label of the card's name button. The press that opens the project tab needs a DOM; it runs `Lanes.openMissing` (`Lanes.svelte:147-159`) into `Focus.openProject` (`Focus.svelte:96-99`), which calls `labelOf` and is not changed, so the tab name is seen at the look. |
| 16c | Base: under `full` the paper, follow-up and subtask lines read `HCC`, `HCC - chase`, `HCC: redraw` (expected the title), fails; under `short` passes. |
| 16d | Base: `staleAfter({ refresh_stale_days: { inbox: 2 } }, 'litwatch')` gives 14 (from `STALE_DAYS`, `feeds.ts:21`), expected `Infinity`; with `stale_days: { inbox: 30 }` the same; a config naming no `scout` gives 7, expected `Infinity`. 3 of 3 fail. |
| 16e | Base: `refresh` over old feeds with a config naming only `scout` nudges `['litwatch', 'inbox', 'scout']` (expected `['scout']`); fails. |
| 16 | `help.test.ts` with `LOCAL_KEYS` imported: not run on the base, since `LOCAL_KEYS` is not exported (`local.ts:91`). |
| 17 | Fails for the three options above; every other option has a reader. |

Readers found for the other 112 options (first-run survey, `grep -rn` over `src`; the full table by `file:line` goes in the final report): appearance `appearance.ts:81, 98, 100, 104-106, 109, 125-128`, `wallpaper.ts:90-106`, `images.ts:324`, `memories.ts:97`; behavior `audit/rules.ts:54-68, 101`, `selectors.svelte.ts:312`, `settings.ts` (usage_tiers, slurm, calendar, mail, search, open, changes), `context.ts:266-267`, `feeds.ts:59`, `ticker.ts:184-186, 286`, `rail-badges.svelte.ts:134, 150`, `project-files.ts:104`, `accounts/chat.ts:12`, `helpers/tasks.ts:21`, `hooks.ts:138`, `helpers/editor.ts:16`, `writes.svelte.ts:57`, `notes.ts:64`, `git-message.ts:45`; layout `navigation/rail.ts:32`, `catalogue.ts:185, 204`, `presets.ts:275, 292, 299`, `rail-badges.svelte.ts:193`, `rail-badges.ts:31`, `docs.ts:430`, `Map.svelte:66`; present `present.ts:115-263`, `data/index.ts:196`; sources `data/index.ts:61-154`, `files.ts:141`, `audit/rules.ts:68`, `subtasks.ts:167`.

## Other findings from the survey

- `deck.selection` and `deck.slide_order` are read by `deckFrom` (`present.ts:260-261`) and written by the Present view, but the tracked `present.yml` holds neither, so the catalog (whose check fails an entry with no key) cannot describe them. The same holds for any option a reader takes that the tracked files leave out. The Settings editor built on this catalog will not offer them.
- `refresh` nudges a radar that has never run whatever the threshold (`feeds.ts:121-125`, the `days === null` branch). The brief's rule 6 says a feed the key does not name is not nudged. I would apply the rule to that branch too, so a `refresh_stale_days` without `litwatch` silences the radar nudge completely; the existing case at `focus.test.ts:~800` (a never-run radar, tracked config naming `litwatch`) is unchanged by it.
- Prettier leaves a long plain `description:` string on one line (checked with `npx prettier --stdin-filepath config/catalogs/options.yml`), so `options.yml` can follow the one-line-per-paragraph rule.

## DONE / NOT DONE

| Deliverable | State | Proof |
|---|---|---|
| First run of every case on the unchanged tree | DONE | The table above; `npx vitest run --config scratchpad/s3a/vitest.scratch.mjs` over the two scratch test files. |
| Catalog, module, check, LOCAL_KEYS export, config and doc edits, `focus_label_mode` read, `stale_days` fold | NOT DONE | Stopped at the first run by the instruction; nothing in the worktree is written. |
| `npm run diagrams` and `checks.sh` | NOT DONE | Not run; nothing changed. |
