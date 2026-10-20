# O46 brief check

Usage: ace0f9728a3a95951, claude-opus-5-5, 252,351 tokens, 87 tool uses, 11.6 min.

# Step O46 brief check (on main at 965303dea)

The brief has 11 findings. The four that most affect the build:

- The probe recipe loads an empty config.
- The `manifest` schema and the `repo-settings` schema have keys with no description, and no item of "What to build" covers them.
- Two G12 tests in `tests/checks/config/config-folder.test.ts` will fail when `option_groups` is added, and that file is not in the paths.
- The brief has the builder hand-edit the hub data file `.oculus/bookmarks.yml` and the ledger file `agents/guarded.md`, which the rules file does not allow a builder to do.

No file was changed. The probes ran from `$TMPDIR/o46probe/`. No `local.yml` was read: `merge.ts:99` filters it out with `name !== LOCAL_NAME`.

## 1. Names

- `option_groups`: `grep -rn "option_groups" src config tests docs HELP.md DESIGN.md README.md` printed nothing.
- The top-level keys of `catalogs/options.yml`: `grep -rn "options.yml" tests` gives `tests/checks/config/config-folder.test.ts:189: 'catalogs/options.yml': ['options'],`. This line is outside the paths, and adding `option_groups` makes it false.
  - The `EXPECTED` map at line 189 feeds 'holds exactly the expected top-level keys, and no more' (line 331). That test compares `Object.keys(loadConfig(engineDir()).config)` with `EXPECTED`.
  - It also feeds 'reads each file on its own and finds its own keys there and nowhere else' (line 764). That test compares `Object.keys(parsed)` of `options.yml` with `['options']`.
  - Both are G12 tests: `guarded.md:347` holds `config-folder.test.ts` "under G12, G13".
- `optionsSchema`, `appSettingsSchema`, `blockFileSchema`, `METALIST_ROW`, `SCHEMA_BLOCK`: `grep -rn "optionsSchema\|appSettingsSchema\|blockFileSchema\|METALIST_ROW\|SCHEMA_BLOCK\b" src tests`. Every hit is in `engine.ts`, `hub.ts` or `record.ts`, all inside the paths.
- The phrase "one top-level key": `grep -rn "one top-level key" src config docs HELP.md DESIGN.md`. The hits for the options catalog are `options.ts:4` and `options.yml:3`, both inside the paths. The other hits (`yaml-edit.ts:337`, `vocab-keys.ts:1`, `merge.ts:29`, `schemas/settings.ts:2`) are about other files and stay true.
- The bookmarks schema rows: `grep -rn "field: label, type: text\|field: root, type: select" tests src` gives:
  - `tests/data/snapshot/schema-rules.test.ts:233` (a fixture of its own, unaffected);
  - `bookmarks.ts:47-48` (inside the paths).
- Other text that describes the options catalog: `HELP.md:498` and `:502`, and `DESIGN.md:92` (found with `grep -rn "options.yml" HELP.md DESIGN.md README.md docs/*.md`). All three stay true.

Findings:
- `tests/checks/config/config-folder.test.ts:189` (the `EXPECTED` entry for `catalogs/options.yml`) becomes false, so two G12 tests go red. Verify 2 runs exactly this file. The file is not in "Paths this step writes".

## 2. The step line

The step line is `plan.md:631`. Each part maps to a requirement:
- "a catalog file's keys by `.describe()` in their shape (... the text file and schema file shapes alike)": What to build 2.
- "the parent of a dotted option ... each group ... by a `help` of its own in `config/catalogs/options.yml`, read by the options reader and put on the group's object schema" and "under `option_groups:` (ruling Z953)": What to build 1.
- "every schema `engineSchemas` and the hub's `schema:` blocks produce is read for a key without a description": What to build 5, together with items 3 and 4 for the keys made in code.
- "runs after O45, before O39": an ordering, with no requirement needed.

Note: Z953, and the step line with "(ruling Z953)", exist only in the uncommitted `plan.md` (`git diff tools/oculus/.scratch/migration/plan.md` shows both lines as added). The preparation commit carries them.

Findings: none.

## 3. Premises

The probe is `$TMPDIR/o46probe/probe.ts`:
- `buildPortfolioWithSchemas(hub, portfolioConfigFrom(config), 1, [], createChecker(), { dir: root + '/config', held: [{ root: 'config', path: '' }] }, 'hub')`, then a walk of `schemas.texts`.
- `probe2.ts` uses the brief's walk exactly: properties, additionalProperties, items, anyOf.
- `probe.ts` also walks definitions and allOf.

Premises that differ from what the brief says:

**The recipe "config loaded with `loadConfig(root + '/config', { hub })`"**
- With `root` = `tools/oculus`, it printed `findings 1 top keys 0`: an empty config.
- `configDir(engine)` returns `join(engine, 'config')` (`src/lib/data/sources/config/folder.ts`), so this call reads `tools/oculus/config/config`.
- `loadConfig(root, { hub })` printed `findings 0 top keys 89`. The brief's counts reproduce only with that call.
- The wrong call appears three times: the brief's counts section, Verify 3 ("as the 'What is on the tree' counts were taken"), and the security paragraph.

**"hub-config ... 15 of 35 at all levels in the real hub"**
- `probe2.ts` prints `hub-config: top 9/20, all 18/76`. The top-level figure matches; the all-levels figure does not.
- The 18 keys are: `wallpaper slurm lint statuses statuses.*.label statuses.*.icon statuses.*.color career_host_status career_host_status.*.icon .label .color career_score_dims career_score_dims[].field .badge .label career_score_tones leads_fit app_settings`.

**"Real hub data files: only the keys made in code lack one"**
- This is false for the `manifest` schema, which governs `project.yml`. `probe.ts -v` prints:
  ```
  manifest: top 5/38, all 5/59
     status followup code_availability repository reproduced
  ```
- These five keys are the prefix objects that `manifestOf` builds at `src/lib/data/snapshot/schema/manifest.ts:91-96`, as `{ type: CONTAINER_TYPES, properties: held, additionalProperties: false }`, with no description.
- No item of "What to build" covers them, and no path does.

**The counts leave out `repo-settings`, which `engineSchemas` returns** (`engine.ts:165-171`)
- `probe2.ts` prints `repo-settings: top 0/1, all 33/34`. The 33 keys are `languages.bash` through `languages.yaml`.
- Each is `{ $ref: '#/definitions/language' }` (`schemas/settings.ts:27`), and the `language` definition has no description either.
- `schemas/settings.ts` is not in the paths.

**"glyphs, icons, file-nesting, options and text: their one key each"**
- This holds for the top level only. `catalogs/options` is `all 21/21` with the brief's walk, and `all 37/37` with definitions (the `#__schema0` that `z.lazy` makes).
- What to build 2 asks for every level, so no harm follows, but the count understates the work.

**"G83: the template shows the same block" (What to build 4)**
- `guarded.md:61` limits G83 to the config.yml, local.yml and project.yml blocks.
- `tests/checks/config/templates.test.ts:63,74,86` checks only those three.
- The bookmarks block is under no guarded entry.

**"`optionsSchema` makes the object of each dotted group ... (lines ~228-236)"**
- `cat -n schemas/options.ts` shows the object at lines 236-242 (the loop runs 232-246).

Premises that hold, each rerun:
- `wc -l`: `engine.ts` 174, `schemas/options.ts` 269, `catalog/options.ts` 519.
- `grep -c "\.describe(" catalog-files.ts` = 6.
- `vocabFileShape` 224-245, `optionsFileShape` 408-410, `CATALOG_FILES` 457-502.
- `hub.ts` `frame()` at 22; `METALIST_ROW` at `record.ts:106`; `SCHEMA_FIELD` at 281-343, with `from.field`, `from.sources` and `required.when` undescribed; the bookmarks code at `run.ts:295-299`.
- The bookmarks blocks: `bookmarks.ts:41-51`, `.oculus/bookmarks.yml:6-9`, `templates.md:248-251`. `git status --short .oculus/bookmarks.yml` prints nothing; the file is tracked.
- `funding.yml:7-20` gives a `help:` on every field.
- `readCatalog` at 321, `OptionProblem` at 145, and the head comment of `options.ts` (1-26) says "one top-level key".
- G12 at `guarded.md:183`, G13 at 186-188, `DESIGN.md:92`.
- The counts: config/behavior `top 20/26`, appearance `3/9` (`terminal wallpaper crt`), present `defaults`, local `literature`, vocab `top 20/20, all 72/113`, agents 12/12, latex 19/19, meta 3, unimath 4, manifest-schema 10/10, deck-schema and cpp-schema the top key plus the three `#field` definitions.
- The group walk (`python3`) gives `total 25`, with the groups as listed.
- Decision 1's child counts: wallpaper has 7 children, focus 14, `focus.refresh_stale_days` 3, slurm 5, defaults 1, local literature 7.
- The metalist rows: `events`, `education`, `applications` and `joint-work` show the same `entries[].meta[].label/.value` gap as funding. The generic `METALIST_ROW` fix covers them.
- The base copy `.agents/worktrees/O46-base` does not exist yet (`ls` prints "No such file or directory"). That is expected: the copy is made after this check (spec Steps 7).

Findings:
- The `loadConfig(root + '/config', { hub })` recipe loads an empty config: `findings 1 top keys 0`, against `findings 0 top keys 89` for `loadConfig(root, { hub })`.
- hub-config at all levels is 18 of 76, not 15 of 35.
- `manifest` has 5 keys with no description (`status followup code_availability repository reproduced`), made in `manifest.ts:91-96`. They are absent from the brief and its paths.
- `repo-settings` has 33 of 34 keys with no description, all `$ref` properties at `schemas/settings.ts:27`. They are absent from the brief and its paths.
- The options catalog has 21 keys at all levels with no description (37 with definitions), not one.
- The bookmarks block is not under G83.
- The group object of `optionsSchema` sits at lines 236-242, not ~228-236.

## 4. Cases and checks

**Cases 1-5 and case 11:** consistent with the rules file. Each is a run the report quotes, and no test is kept.

**Case 6 and What to build 4:**
- The builder edits the hub data file `.oculus/bookmarks.yml` by hand. Two places in `agents/spec.md` conflict with this:
  - "What every package obeys" says "A change of shape is made once on the data itself by the orchestrator".
  - The closing paragraph allows writes to a hub data path only "through the script the brief names and by nothing else", and hand rewording only "where a ruling of Axel's asks for the rewording".
- Z952 and Z953 are self-rule rulings of the orchestrator, and neither names bookmarks.

**Cases 7 to 9:**
- They are rows of G13's tests. That fits the test rule.
- But the brief also has the builder edit `agents/guarded.md` lines 186-188, and lists that path.
- `spec.md`, "Where you work", says "You never edit anything under `tools/oculus/.scratch/`".
- O45's brief has the same pattern (`O45.md:102`), so this is an existing practice, but it still contradicts the rules file.

**Case 9:**
- It accepts "a finding naming the key, from the whole-file shape or the reader".
- It does not say that there is exactly one finding.
- `CATALOG_FILES`' `owned` mechanism (`catalog-files.ts:449-454`) exists precisely so the shape and the reader do not both word one key. The case should demand one finding.

**Case 10:**
- "G12's existing tests, run" cannot pass unchanged: two of them go red (see Names).

**The size rule** (`spec.md`, "What every package obeys", 880 lines):
- `catalog-files.ts` is 545 lines.
- `grep -cE "^\s+[a-z_]+: (text|colour|textMap|z\.|keyed|lifecycle|latexChords|standInShape)"` counts 99 property lines. Five of them already carry `.describe`, and more keys sit inline on one line, so about 100 to 118 keys get a description.
- The existing described keys take about 2.9 lines each after prettier: 17 `flag(...)` keys use `catalog-files.ts:52-100`.
- That puts the file at about 845 to 890 lines, likely past 880. A split by concern would write new files, which the paths do not list.

Findings:
- Case 6 and What to build 4: the builder hand-edits the hub data file `.oculus/bookmarks.yml` with no script and no ruling of Axel's (`spec.md`, "What every package obeys", and its closing paragraph).
- Cases 7 to 9: the builder edits `agents/guarded.md` under `.scratch/` (`spec.md`, "Where you work").
- Case 10: two G12 tests fail unless `config-folder.test.ts:189` changes, and that path is missing.
- Case 9: it does not demand exactly one finding.
- Size: `catalog-files.ts` will likely pass 880 lines, and no split path is listed.

## 5. The question

**Cases 1 to 5:** each could pass only if the goal is reached.
- yaml-language-server 1.24.0 shows `propertySchema.markdownDescription || propertySchema.description` (`node_modules/yaml-language-server/lib/umd/languageservice/services/yamlCompletion.js:722,731`).
- Where two proposals for one key meet, it fills a missing documentation from the other (`:265`).
- So a description in the generated schema is what the menu shows.
- zod 4.6.5 keeps `.describe()` on optional, record, union, lazy, enum, unknown and array shapes. `zod.ts` printed, for example, `"e":{"description":"E lazy","allOf":[{"$ref":"#/definitions/__schema0"}]}`.
- `grep -rn description src/lib/server/machine/lsp ... | grep -i "delete\|strip\|omit"` prints nothing, so nothing strips a description before the editor.

**Case 6:** it could pass without the goal being reached.
- Every hub data file it names can carry descriptions while `project.yml` still completes `status`, `followup`, `code_availability`, `repository` and `reproduced` with none (`manifest` schema).
- `.oculus/settings.yml` likewise completes its 33 language keys with none.

**What to build 5 (the read over every schema):**
- It would catch both gaps above, but items 1 to 4 give no fix for them, so item 5 cannot print nothing as briefed.
- Its probe tests the `description` on the property object itself. A `$ref` property such as `languages.<name>` is flagged even when the `language` definition is described. The brief does not say whether the probe follows `$ref`.

**What to build 1 to 4, Cases 7 to 11:** no; each is checked by a run of the schema text or of the reader's findings.

Findings:
- Case 6 and What to build 5 can pass, or stall, without the goal: the `manifest` group keys and the `repo-settings` language keys have no item.
- The probe's handling of `$ref` is unstated.

## 6. Implied inputs

This is a code step. Missing from "Cases":
- **No `option_groups` key at all** (the shipped file today): 25 group findings, one per group, and no group description. It happens on the unchanged tree.
- **An empty help line** (`behavior.yml: { slurm: '' }`): a no-help finding for `slurm`. `described()` at `schemas/options.ts:128-131` already drops an empty string, so without a case the empty line passes silently with no description.
- **A help line on a path that is an option, not a group** (`behavior.yml: { slurm.poll_min: x }`): the "no group" finding. Case 8 covers only a path with no option under it.
- **A file value or the whole key that is no map** (`option_groups: { behavior.yml: 3 }`, `option_groups: 3`): one shape finding naming the key, with the other files' groups still read.
- **An `option_groups` path holding a segment the `owned` predicate claims**, such as `option_groups: { behavior.yml: { help: 3 } }`:
  - `readSpecWords` (`catalog-files.ts:437-438`, `/(^|\.)(control|from|form|heading|whole|slots|help)(\.|$)/`) matches the issue key `option_groups.behavior.yml.help`. It would drop the shape's finding as one the reader words.
  - If the options reader does not word it, there is no finding at all.
  - Expected: exactly one finding naming the key.

Findings: the five inputs above are missing from "Cases".

## 7. ADRs

There is no ADR record:
- `ls docs/adr tools/oculus/docs/adr` prints "No such file or directory" for both.
- `grep -n "adr:" .agents/plan.yaml tools/oculus/.scratch/migration/orchestrator-state.md` exits 1.
- `find . -type d -name adr` outside `node_modules` prints nothing.

Findings: none.

## 8. Dictated text

All found with `grep -n "option_groups: {\|focus: <help>\|present.yml: { defaults\|local.yml: { literature\|nothing_here\|slurm: 3\|python3 -c" agents/briefs/O46.md`:
- `:107` `option_groups: { appearance.yml: { wallpaper: <help> } }`: holds. It is a code line with a placeholder, in ASCII.
- `:108` `focus: <help>` and `focus.refresh_stale_days: <help>`: holds.
- `:110` `present.yml: { defaults: <help> }`: holds.
- `:111` `local.yml: { literature: <help> }`: holds.
- `:63` `behavior.yml: { nothing_here: ... }`: holds (a test input).
- `:64` `behavior.yml: { slurm: 3 }`: holds (a test input).
- `:145` `python3 -c "import yaml; [yaml.safe_load(open(f)) for f in [...]]"`: holds.
- `LC_ALL=C grep -n '[^ -~]' agents/briefs/O46.md` prints nothing.

Findings: none.

## Declined to judge

- Where the description text of the `manifest` group keys should live (a new key in `manifest-schema.yml`, or code). This is a user-visible shape, so it is the orchestrator's or Axel's decision.
- Whether the existing G12 test 'describes every flag of statuses, types and tiers and every key of publication_kinds in the schema of vocab.yml' (`config-folder.test.ts:630`) should be widened, given What to build 5's rule against a new committed check of descriptions. That is Axel's call.
- The line count `catalog-files.ts` reaches after the change is an estimate from the existing per-key cost. It was not measured by building the file.
- Whether `HELP.md` needs a bullet about descriptions in the completion menu. No current bullet covers the menu: `grep -n -i "description\|Ctrl+Space\|complet" HELP.md` has no such hit.

Agent usage: <agent id>, <served model>, <tokens>, <tool uses>, <minutes>.
## Closed

The brief was rewritten around Open item 180 (Axel's ruling of 2026-10-20) and the self-rules Z954 to Z957; each finding is closed in it as follows.

- Names, `config-folder.test.ts:189` becomes false: the file is under the brief's path `tools/oculus/tests/`, and case 14 asks for its expected keys to name the new files.
- Premises, the probe recipe `loadConfig(root + '/config', { hub })`: every mention now reads `loadConfig(root, { hub })` with `root` the worktree's `tools/oculus` (the security paragraph, the counts, Verify 4).
- Premises, hub-config at all levels: the brief says 18 of 76.
- Premises, the `manifest` schema's five prefix objects: What to build 9 describes them by a `groups:` of `manifest-schema.yml` (decision 6, Z955), case 6 checks them, and `src/lib/data/snapshot/schema/` is in the paths.
- Premises, `repo-settings`' 33 `$ref` keys: What to build 9 describes the `language` definition and the `languages` map, `schemas/settings.ts` is under the path `src/lib/data/sources/config/`, and case 6 checks them.
- Premises, the options catalog's count: the brief says 21 of 21, 37 with the definitions.
- Premises, G83 and the bookmarks block: the brief no longer claims G83 for it; G83 is cited only for the `config.yml` and `local.yml` blocks (case 28).
- Premises, the group object's lines: the brief says 236-242, the loop 232-246.
- Cases, the builder's edit of `.oculus/bookmarks.yml`: the orchestrator writes the three `help:` lines at the landing; the builder reports them (What to build 10, the report's parts).
- Cases, the builder's edit of `agents/guarded.md`: the builder lists each test title under its guarded entry and the orchestrator writes the Test lines at the landing.
- Cases, case 9 and exactly one finding: case 12 demands exactly one finding, from the shape or the reader and never both.
- Cases, case 10 and the G12 tests: case 14 changes `config-folder.test.ts` with the moved files.
- Size, `catalog-files.ts` past 880 lines: What to build 8 splits it into `src/lib/data/shapes/catalog-files/`, which is in the paths.
- The question, case 6 passing without the goal: the manifest and repository-settings keys have items (What to build 9) and cases (case 6).
- The question, the probe and `$ref`: What to build 11 and Verify 4 follow each `$ref`, a `$ref` property counting as described when its definition is.
- Implied inputs, the five missing cases: no `groups:` at all (case 13), an empty help line (case 11), a help line on an option path (case 10), a non-map value and a segment the `owned` predicate claims (case 12).
- Declined to judge, HELP and the completion menu: What to build 12 asks for a HELP bullet that the completion menu shows each key's description.
- Declined to judge, widening the vocab flag test at `config-folder.test.ts:630`: not widened; no committed check of descriptions is added (decision 8), since a new check needs Axel's approval.
