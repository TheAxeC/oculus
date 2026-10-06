# Step S3a brief check (on main at cd71d5e0)

This is the report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/S3a.md`. The brief says it was read at 205e137f. `git show --stat cd71d5e0` lists only ledger files (Q106 brief, review and round, choices.md, the state file), so the tree under `tools/oculus` outside `.scratch` is the same as the one the brief read.

## 1. Names

- `LOCAL_KEYS` (to be exported). Command: `git grep -n "LOCAL_KEYS" -- src tests utils ':!*local.yml'`. Output: `local.ts:91: const LOCAL_KEYS = [`, `local.ts:237: const unknown = ... !LOCAL_KEYS.includes(key)`, `tests/views/system/help.test.ts:340: const block = /const LOCAL_KEYS = \[([^\]]*)\]/.exec(source)`. The export makes none of these false, as long as the form stays `export const LOCAL_KEYS = [`. The source-text read at help.test.ts:340 is taken up under check 4.
- `optionPaths`, `CatalogEntry`, `desc_options`, `options.yml`, `options-catalog`. Command: `git grep -n "optionPaths\|CatalogEntry\|desc_options\|options\.yml\|options-catalog" -- . ':!*local.yml' ':!.scratch'`. It printed nothing, so there are no collisions.
- The new top-level key `options` of the merged config. Command: `git grep -n -E "^options:" -- config ':!*local.yml'` printed nothing. `git grep -nE "config(Map\(\))?\.options\b|\['options'\]" -- src tests` printed only `tests/views/sessions/sessions.test.ts:395`, which is an unrelated call-order array. Nothing reads or collides with the key.
- The set of catalog files. `sed -n 44p DESIGN.md` prints `catalogs/  the vocabularies: glyphs, icons, vocab, meta, manifest-schema`. DESIGN.md:85 (the "Configuration" section) names the role of each tracked config and catalog file one by one: "the edit form in `catalogs/manifest-schema.yml`; the tool's own identity in `catalogs/meta.yml`", and so on. It is not in "Paths this step writes", and after the step it does not name `catalogs/options.yml`. HELP.md:216 calls `catalogs/` "the vocabularies", and adding `options` to DESIGN.md:44 under the heading "the vocabularies" labels an option catalog as a vocabulary.
- `desc_options`, and the HELP.md row that uses the same sentence: "Every option of every config file: what it does, its default and how it is set; the Settings view draws it." `git grep -n "options" -- src/lib/views/system/workbench` finds no reader, and S3c is the step that builds that drawing (plan.md line 183, "after S3a and S3b"). From S3a's landing until S3c lands, the sentence is false in two user-visible places: the Config view card and the HELP.md table.

Findings:
1. The `desc_options` sentence ("the Settings view draws it", "how it is set"), shown in the Config view and in HELP.md's table, is false from S3a's landing until S3c and S3b land. spec.md "What every package obeys" counts a sentence the change makes false as a defect of the change.
2. DESIGN.md:85 lists each tracked config file's role and will not name `catalogs/options.yml`. It is outside the paths. DESIGN.md:44's heading "the vocabularies" does not describe `options`.

## 2. The step line

- "the options catalog `config/catalogs/options.yml` under `options:`": What to build 1.
- "every option of the five tracked config files and every `local.yml` key": What to build 1 (six file maps).
- "each described from the code that reads it": What to build 1, `description`, plus the report's reader `file:line` table.
- "with its default and control": What to build 1, `default` and `control`.
- "families with `fields:`": What to build 1, `fields`.
- "the Z77 check": What to build 3.
- "`LOCAL_KEYS` exported": What to build 4.
- Ruling Z121 (2) as the state file's closed log and plan.md:634 hold it. Command: `grep -n "Z121" orchestrator-state.md plan.md`. The closed log reads: "(2) The default: (a) the value the tracked file holds at the base ...; an option whose absence means something (`terminal.font_px`, `wallpaper.popover_opacity`) has `default: null`". plan.md:634 reads: "a default the tracked file's value (`null` where absence means something)". The brief renders it as "the value the tracked file holds at the base, `null` included" and drops the clause for those two keys. The tracked file holds `terminal.font_px: 12.5` (appearance.yml:32) and `popover_opacity: 0.97` (:45). My walk (the command under check 3) shows that no tracked value is null, so "`null` included" describes no key.

Findings:
1. Z121 (2)'s clause that `terminal.font_px` and `wallpaper.popover_opacity` get `default: null` has no item. As written, the brief gives them 12.5 and 0.97, which is the opposite of the ruling's text. The ruling's text is itself in tension, because it also says "the value the tracked file holds". The brief has to name these two keys and their default one way or the other.

## 3. Premises

- Top-level key counts. My command: `python3 .../scratchpad/count.py`, a walk over `yaml.safe_load` of each file that applies the brief's family list and flags any list of records or empty map outside it. Output: `appearance.yml top 6 options 14 families 1`, `behavior.yml top 31 options 48 families 3`, `layout.yml top 13 options 19 families 7`, `present.yml top 1 options 19 families 7`, `sources.yml top 15 options 15 families 4`, `TOTAL 115 families 22`, with `fam-not-found []` for every file and no `LIST-OF-RECORDS-NOT-FAMILY` line. This matches the brief: 6/31/13/1/15 top-level keys, 115 options, 22 families, and the family names per file. The family list is complete: no list of records sits outside it. The only data-keyed maps treated as options are `stale_days`, `refresh_stale_days` and `board.search`, which match Decision 3. Their keys are read by name: `FEEDS` at feeds.ts:18 and `searchOf(config, id)` at presets.ts:298-302.
- Keys with a dot. My command: a python walk printing every key containing `.`. Output: `read_limits.status.line` and `open.program_ext.<ext>` (ten extensions), nothing else. This matches.
- `LOCAL_KEYS` at local.ts:91-108 with 16 names. `sed -n 85,110p local.ts` shows `const LOCAL_KEYS = [` at 91, 16 names, and `];` at 108. This matches. It is not exported, which also matches.
- `local.ts:237-238` and `:313-315`: 237 `const unknown = ...`, 238 `if (unknown.length > 0) onUnknown?.(unknown);`, and 313-315 hold the `console.warn(... ignoring unknown key(s) ...)` callback of `loadLocal`. This matches.
- `checkLocal` at local.ts:341-356. `grep -n "export function checkLocal\|^}" local.ts` gives `349:export function checkLocal(`, `357:}`, and `341:}`, which closes `loadLocalOrDefaults`. The doc comment runs from 343 to 348. It does not match: `checkLocal` is at 349-357. The claim that it passes no `onUnknown` holds (line 351).
- `help.test.ts:340`. `sed -n 335,345p` shows `const block = /const LOCAL_KEYS = \[([^\]]*)\]/.exec(source)?.[1] ?? '';` at 340. This matches. The regex matches inside `export const LOCAL_KEYS = [` and not inside `const LOCAL_KEYS: readonly string[] = [`.
- `merge.ts:94` and `:153-168`. `sed -n 88,100p` and `148,170p` show `collect(join(dir, CATALOGS_DIR));` at 94, and the loop over `Object.entries(parsed)` that merges every top-level key and reports `defined_twice`. This matches.
- `catalogs.ts:37-38`. `sed -n 30,42p` shows the doc comment "The whole merged config goes over the `config` channel afterwards". This matches, but it is a comment, not the code that sends the config.
- "Each existing catalog holds one top-level key named for itself (`agents:`, `glyphs:`, `icons:`, `manifest_schema:`, `meta:`, `vocab:`)". Command: `for f in config/catalogs/*.yml; do python3 -c "import yaml; d=yaml.safe_load(open('$f')); print('$f', len(d), list(d))"; done`. Output: agents 1 `['agents']`, glyphs 1, icons 1, manifest-schema 1 `['manifest_schema']`, meta 1, and `config/catalogs/vocab.yml 24 ['palette', 'domains', 'type_color', ... 'radar_buckets']`. `config-folder.test.ts:180` lists the same 24 keys for vocab.yml. It does not match: vocab.yml has no `vocab:` key and holds 24. The earlier S3 brief check stated this premise correctly (five catalogs, vocab left out, section 1 finding 1). Z121 (1)'s stated reason, "as every other catalog holds one key named for itself", is carried into the brief's Rulings block and rests on the same false premise.
- `config-folder.test.ts` lines. `grep -n "" ... | sed -n '...'` shows `const EXPECTED` at 107, `it('holds exactly the expected top-level keys` at 359, `it('writes one description for every config file` at 430, and `it('reads each file on its own ...` at 659 with `expect(tracked(dir)).toEqual(Object.keys(EXPECTED).sort())` at 670. This matches.
- `config/text/views/system/config.yml:4-15`. `sed -n 1,20p` shows `desc_agents` at 4 through `desc_vocab` at 15. This matches.
- `HELP.md:216-230` is "the table of config files with a row per catalog". `grep -n "" HELP.md | sed -n 210,236p` shows rows for glyphs, icons, manifest-schema, meta and vocab, and none for `catalogs/agents.yml`. It does not match: agents.yml has no row. DESIGN.md:44 also leaves out `agents`.
- DESIGN.md:44 and :85. Their text is as the brief quotes. This matches.
- `settings.ts:1-3`. The head comment reads "Each reads its block and falls back to the default the config file carries". This matches. Beside it, `feeds.ts:21` holds a code fallback `STALE_DAYS = { litwatch: 14, inbox: 10, scout: 7 }`.
- Folder counts. `git ls-files src/lib/data/sources/config | cut -d/ -f6 | sort -u` gives 8 files. `tests/checks/config` holds 3 (config-folder, config, integrity). This matches.
- `behavior.yml:81` is `poll_min: 20`, and `Map.svelte:66` is `const mode = configMap().map_label_mode;`. This matches.

Findings:
1. vocab.yml holds 24 top-level keys and no `vocab:` key, so the premise "each existing catalog holds one top-level key named for itself" is false for vocab. That premise is also the stated reason of ruling Z121 (1).
2. `checkLocal` is at `local.ts:349-357` (doc comment 343-348), not 341-356.
3. HELP.md's table does not have "a row per catalog": `catalogs/agents.yml` has none, and DESIGN.md:44 also leaves agents out.

## 4. Cases and checks

- Cases 1 to 13: consistent with spec.md, except as noted below.
- What to build 4 and case 13 keep `help.test.ts:340` passing by fixing how local.ts is written (no type annotation), so that a regex over local.ts's source text still matches. spec.md "What every package obeys" says an assertion over source text proves nothing, and the brief's own Conventions say "tests assert behaviour, never source text". Once `LOCAL_KEYS` is exported, the test can import it. `help.test.ts` is not in "Paths this step writes". Shaping the code to suit a source-text test is the lazy option under spec.md "The working rules" (the first bullet).
- The catalog key `options` against spec.md "The principles every package is judged on": "every catalog key has a reader in the tree (a test fails on an orphan key)". At S3a no module under `src` reads `config.options` (the grep under check 1 found none). Its only reader is the new test, and the whole catalog rides on every `config` push to the page (catalogs.ts:37-38) with nothing on the page reading it until S3c. The brief does not say how the step meets this rule in that interval.
- spec.md "Read first, before changing anything" item 1 says the brief names the DESIGN.md sections the package is measured against. This brief cites DESIGN.md:44 and :85 only as facts on the tree. It names no section: "Configuration" and "Repository layout" are the relevant ones.
- spec.md "What every package obeys": "Every id or key a package introduces is exercised empty, duplicated, and colliding with a configured or reserved key". The cases exercise no empty key path, no duplicate entry, and no colliding path (see check 6).

Findings:
1. Item 4 and case 13 preserve a source-text test (help.test.ts:340) instead of making it import the now-exported `LOCAL_KEYS`. This is against spec.md "What every package obeys" and the brief's Conventions. `help.test.ts` belongs in the paths.
2. The `options` catalog key has no reader in `src` at S3a, which is against spec.md "The principles every package is judged on" (every catalog key has a reader). The brief is silent on it.
3. The brief names no DESIGN.md section to measure against (spec.md "Read first", item 1).
4. No case exercises an empty, duplicated or colliding key path (spec.md "What every package obeys"). The inputs are listed under check 6.

## 5. The question

"The goal" here is the part of plan.md's Goal that S3a delivers: every option of every config file described once, with its default and its control, and a check that fails on a key with no entry and on an entry with no key.

- Case 1 and the check of item 3: yes, it could pass without the goal. Nothing fails a non-family tracked entry with no `control`, so a catalog with no control anywhere passes. Nothing fails a control that does not fit the value: `control: text` on `slurm.poll_min: 20` passes, `control: list` on a string passes, and `text` or `list` defaults are never type-checked. Yet the goal names the control, and S3b refuses writes "for a value its control does not allow" (plan.md:182; Z94 (4) (b) in the state file).
- Item 3's family escape: yes. The check exempts anything under an entry that has `fields`, and it does not check what `fields` sits on. `slurm: { description: x, fields: { key: a, value: b } }` passes and hides five options that then carry no default and no control. So does `crt.default: { description: x, fields: {} }`, a scalar made into a "family". The family rule's machine-computable part (a family's value is a list or a map, never a scalar or a list of scalars) is not enforced, and nothing compares the families found with the brief's 22.
- The `default` values: yes. The check never compares a `default` with the tracked file's value at the base, so a wrong default (such as `slurm.poll_min` default 1) passes. A standing test cannot hold that equality, because S3b's writes change the tracked file by design. A one-time comparison on the base tree, run by the builder as a case and quoted in the report, would close it, since it is a fact a machine computes.
- Case 14 and the descriptions: these rest on reading, which is proper. But the brief names only `focus_label_mode` as a key nothing reads, and there is a second one. `git grep -n "staleAfter\|FEEDS\b" -- src` prints `feeds.ts:18 FEEDS = ['litwatch', 'inbox', 'scout']`, and the callers at feeds.ts:122, :128 and :132 pass only those three. `stale_days.audit` (behavior.yml:12) therefore has no reader. Also, `staleAfter` (feeds.ts:57-65) reads `stale_days` and then `refresh_stale_days`, the later one winning. The tracked `refresh_stale_days` holds all three feeds, so the tracked `stale_days.litwatch`, `.inbox` and `.scout` never take effect (`tests/state/boards/focus.test.ts:813`, "reads the threshold of each feed out of refresh_stale_days over stale_days"). A description written "from the code that reads it" cannot exist for `stale_days.audit`. This is the same shape as Z120, and the brief neither raises it nor tells the builder what to write.
- Item 3's rule "a list of records or a map with no entry at its own path whose children have none either": it can pass or fail without an exact meaning. "Children" is not defined as direct children or all descendants. Under the direct-children reading, a valid option `a.b.c` under a map `a` whose only child `a.b` is a map would fail. The brief also does not say how `optionPaths` treats a list: as one leaf path, or by descending into indices. Case 12 does not cover a list. The rule's outcome on a list of records depends on that choice, so it cannot be computed exactly as written. Apart from naming the map's own path, it duplicates the first rule, since every leaf under such a map already has no entry.
- Cases 2 to 11 and 13: each fails without the behaviour it names, so no.
- What to build 4 (docs rows, `desc_options`, `EXPECTED`): these pass without the goal only as far as check 1 finding 1 says, since the sentence is false until S3c.

Findings:
1. The check passes with no `control` on any entry, or with a control that does not fit its value.
2. Any option or map given `fields` escapes every per-option rule. The check does not require `fields` to sit on a list of records or a map.
3. No case compares the catalog's defaults with the tracked values at the base.
4. `stale_days.audit` has no reader, and `stale_days.litwatch`, `.inbox` and `.scout` are always overridden by `refresh_stale_days` (feeds.ts:57-65). This is a second Z120-shaped key, not raised.
5. The "list of records or a map ... whose children have none" rule and `optionPaths`'s treatment of lists are not defined exactly enough to compute.

## 6. Implied inputs

This is a code step (a module and a check). Inputs the step implies that "Cases" does not list, each with the result it should have:

- An entry value that is not a map (`slurm.poll_min: 20` or `null` in the catalog): fails, naming the entry.
- `options:` missing, null or not a map, or a file name mapped to null or a list: fails, naming it, and no crash.
- A non-family tracked entry with no `control`: fails, naming it.
- A `text` whose default is not a string (or `null`), and a `list` whose default is not a list of scalars: fails, naming each.
- `fields` on a path whose file value is a scalar or a list of scalars, and `fields: {}` or a field whose line is not a string: fails, naming each.
- A `local.yml` entry carrying `section` or `fields`. The brief says such an entry "holds `description` alone", but the check fails only `default`, `control` and `values` there: it should fail, naming it.
- `values: []`, `values` holding duplicates, `section: ''` or a non-string `section`, and a `description` that is not a string: fails, naming each.
- An empty key path (`''`), and one with a leading, trailing or doubled dot (`slurm..poll_min`): fails, naming it.
- A duplicate entry path in `options.yml`. The `yaml` parser rejects duplicate keys, so the expected result is that the check fails with the file and the key, not a crash with no name.
- A key holding a dot outside a family in a fixture file (`a.b: 1` beside `a: { b: 2 }`), which makes the dotted path ambiguous: fails, naming it. S3b locates a key by this path.
- `optionPaths` over a list of scalars (returns the list's own path), over a list of records with no family entry (returns the list's own path, the stated treatment), over an empty map outside a family (`stale_days: {}`: the map's own path, or nothing, stated), over a key whose value is null (`indexes:` bare: its path), and over a file that is empty or not a map (no paths).
- A map family whose values are records (`nav_groups`, `arrangements`, `deck.framing`, `deck.summaries`, `deck.themes`, `nav_live`). The brief's `fields` text gives `key`/`value` for a map family and record fields for a list, but not both for a map of records. Its expected `fields` shape should be stated, since S3c draws it.
- `terminal.font_px` and `wallpaper.popover_opacity`: their expected `default` under Z121 (2) (check 2).

Findings: every input above is missing from "Cases".

## 7. ADRs

- The configuration has no `adr` key. `grep -n "adr" .agents/plan.yaml` printed nothing, and the state file's configuration block holds no `adr` line (`sed -n 1,40p orchestrator-state.md`). So the default `docs/adr` applies. `ls docs/adr` (hub root) and `ls tools/oculus/docs/adr` both print "No such file or directory". `git ls-files | grep -iE "(^|/)[0-9]{4}-[^/]*\.md$"` printed nothing. There is no record.

Findings: none.

## Declined to judge

- Whether the S3a and S3b briefs fix the same catalog shape: `agents/briefs/S3b.md` does not exist on the tree yet (`git status` at the start lists only S3a.md as a new brief).
- Whether Decision 3's family choices (`tab_split` and `nav_groups` as families; `stale_days`, `refresh_stale_days` and `board.search` as options) are right. The readers confirm the key names each reads; the rest is a design judgment.
- Whether `stale_days.audit` and the shadowed `stale_days` values are closed in the brief or raised as a stop like Z120. That is the orchestrator's and Axel's call.
- Whether the false premise under Z121 (1) reopens that ruling. The ruling's other reason (one merged key against six file-named keys) still stands; whether that is enough is the orchestrator's call.
- Whether `options.yml` stays under spec.md's 1000-line rule. At 131 entries plus 22 `fields` maps it plausibly lands near 700 to 900 lines. Not measurable before it is written.
- Whether each description will be true: this is left to the review, as the brief says.

Agent usage: claude-opus-5-5, about 175k tokens (from the context counter, 15,000,000 at the start to about 14,826,000 at the end), 44 tool uses, time not measured by me.

Usage: brief-check agent a372d0c9df7b81e87, served claude-opus-5-5 (97 of 97 messages); 183,760 tokens, 53 tool uses, 8.5 min (from its completion notice)

## Closed (the session's change to the brief for every finding above, made before the preparation commit)

- 1.1 (`desc_options` false until S3c): the sentence is now "Every option of every config file: what it does, its default, and the control it is set with.", which is true at S3a; S3c adds that the Settings view draws it (What to build 4).
- 1.2 (DESIGN.md:85 and :44): `DESIGN.md` lines 44 and 85 are in the paths; :44 reads "the vocabularies and the options: agents, ..., options" and :85 gains `catalogs/agents.yml` and `catalogs/options.yml` (What to build 4).
- 2.1 (Z121 (2)'s null clause): Z121 corrected in automode at 23:58 (closed log, `choices.md`, `plan.md`): the two keys default to their tracked values 12.5 and 0.97, their descriptions saying what leaving the key out does (What to build 1, `default`).
- 3.1 (vocab holds 24 keys): the premise corrected in "What is on the tree"; Z121 (1)'s reason corrected in automode, the choice standing on one merged key against six named after files.
- 3.2 (`checkLocal` lines): corrected to `local.ts:349-357`.
- 3.3 (no `agents` row): the HELP.md table gains a `catalogs/agents.yml` row, and `HELP.md` lines 214-230 are in the paths; DESIGN.md:44 names `agents`.
- 4.1 (source-text test): `help.test.ts:335-341` imports `LOCAL_KEYS`; `tests/views/system/help.test.ts` is in the paths (What to build 4, case 16).
- 4.2 (no reader of `options`): `catalogOf(config)` in `options.ts` reads the merged config's `options` key, and the check reads the catalog through it (What to build 2).
- 4.3 (no DESIGN.md sections named): the brief's first paragraph names "Repository layout" (`DESIGN.md:36`) and "Configuration" (`DESIGN.md:83`).
- 4.4 (empty, duplicated, colliding key paths): cases 10 and 11; a duplicate path in `options.yml` makes the `yaml` parser throw ("Map keys must be unique", run with `node -e`), `loadConfig` then reports the file as a finding and merges nothing of it (`merge.ts:101-103`), and the check fails naming `options` missing (What to build 3, first bullet).
- 5.1 (no control, control not fitting): the check requires `control` on every non-family tracked entry and fails a default or a file value that does not fit it (What to build 3; cases 5 and 6).
- 5.2 (the family escape): the check fails a family whose `fields` is missing, empty or not strings, or whose file value is a scalar or a list of scalars (What to build 3; case 7).
- 5.3 (defaults against the base): case 15, a command run once over the finished catalog with its output quoted, since S3b's writes change the files by design.
- 5.4 (`stale_days`): raised to Axel as Z123 (a step Q113 would make one key); the brief describes the four entries as the code reads them today, so S3a is not blocked.
- 5.5 (the walk undefined): `optionPaths` is defined exactly (a list is one leaf, a map is descended into except at a family, an empty map gives its own path); a map with no entry at or below it is named once (What to build 2 and 3; cases 9 and 14).
- 6 (implied inputs): each input is in cases 4 to 14; the map family of records has its `fields` shape stated (What to build 1).
