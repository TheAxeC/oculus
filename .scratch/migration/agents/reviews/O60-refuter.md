# O60 refuter report

Worktree `.agents/worktrees/migration-O60`, base 6912641f.

Usage: a30e6ce7d373ab517, claude-opus-5-5, 161839 tokens, 96 tool uses, 14 min 27 s.

## Verification lines

`npm run diagrams && npm run test:quick` (run once, from the worktree root, exit 0, output kept at `<scratch>/o60-review/quick.txt`):
```
test:quick: 173 changed file(s), from git since HEAD
test:quick: 303 test file(s)
ok      prettier (0.6 s): All matched files use Prettier code style!
ok      ASCII gate (0.7 s)
ok      svelte-kit sync (2.5 s)
ok      eslint (2.4 s)
ok      svelte-check (9.0 s): 1792884626725 COMPLETED 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (134.5 s): Duration  126.15s (transform 68.87s, setup 0ms, import 244.16s, tests 228.39s, environment 2ms)
ok      vitest (138.2 s): Duration  130.27s (transform 110.30s, setup 0ms, import 231.77s, tests 237.63s, environment 7.72s)
ok      vitest slow (187.3 s): Duration  179.55s (transform 12.67s, setup 0ms, import 163.98s, tests 543.25s, environment 16ms)
test:quick: 189.9 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            the build, the lint of unchanged files
```
Character-set check (perl over the 173 changed files through `xargs -0`): exit 0, nothing printed. The same over `find src tests config -type f ! -name local.yml`: exit 0, nothing printed.

`sh utils/unused-exports.sh` against `.agents/worktrees/O60-base/unused-exports.txt`: the step adds no line; two lines go (`noFunding`, `CrossMember`, base lines 128 and 286).

`sh utils/folder-check.sh`: exit 0, nothing printed. `wc -l`: no changed source file over 880, no changed component over 520; `portfolio.ts` 792 (base 855).

The four reader greps of the brief, rerun inline on the worktree: 85 files; 68 are the report's "The 68 reader files" lines; the other 21 (`comm -23`) are each named at report lines 610-613.

`git status --short`: 162 entries, unchanged after every program the reviewer ran.

Builder programs rerun from the worktree root: `ruled.mjs`, `schema3.mjs`, `rows17.mjs` exit 0 with the output the report quotes (case 10: `mbfalpha at: 814`, `newsym at: 2415`; case 11: `start values: ["manual:manual","bypassPermissions:bypassPermissions:confirm","yolo:bypassPermissions:confirm","plan:dontAsk:confirm"]`, `parse findings: [{"line":12,"why":"value","what":"other"}]`; schema: `stages exploring colour x => [...must NOT have additional properties...]`, `case 1 value => valid`, `stages nascent null => valid`, `categories idea removed => valid`; rows: `ordered=false` for stages, categories, glyphs; `findings 0`). `cases.mjs` is the base-copy program; on the worktree it prints cases 1 to 10 and stops at case 11 with `TypeError: readAgentsFile is not a function` (the function the step removed), as expected for a base program.

## Items

1. Hub vocabulary merged in oculus's place: holds. Cases 1 to 5 reproduce (cases.mjs on the worktree, hub-vocab.test.ts rows). The removal of a word that oculus's own values name (defect A) is outside the item's text; what the reviewer finds is under B1, without a ruling.
2. Each hub's records under its own values: holds. 68 reader lines in the report, 21 further grep hits named at 610-613; server readers read the routed hub's config (`writes/hubs.ts:96-114` `hubTarget`/`routed`, `writes.ts:424-436` passes `at.into.config` to `writeManifest`); the remaining unhubbed lookups read (`rail-badges.svelte.ts:188`, `Band.svelte:63-65`, `LineCard.svelte:81`) are aggregate lookups that read the union, as the item allows.
3. `manifest_fields`: holds (manifest-fields.test.ts:35-95, writes.test.ts new describe, relation-shapes.test.ts new row; duplicates keep the first row and word the later one, consistent with "that row is left out").
4. Workspace catalogs: holds (catalogs.test.ts, agents.test.ts:63-125, compose.test.ts new describe; ruled.mjs output above).
5. Display languages: holds (language.test.ts, manifest-contributes.test.ts LOCALIZATION_ROWS; `context.ts:177-190,412-416` wires `languageSource`/`languageStamp` and the apps watcher's `languageChanged`; `+page.server.ts:60-62` and `hooks.server.ts:188-194` read `locals.config()`, which is `configCache.read()`).
6. Workspace words: holds (language.test.ts:124).
7. Options descriptions and Settings edits: holds (config-folder.test.ts OPTION_SUBFILES rows; rows17.mjs output; workspace schema built from the catalog including the subfolder options, `engine.ts:233-251`, read, not run).
8. Documents: holds.
9. Tests: holds as to files and placement; two rows carry findings P1 and P2 (cases 19 and 2).

## Cases

1. met. The reviewer's program `o60-review/stage.mjs` over a scratch hub with `stages: { trialling: { label: Trialling, live: true } }` and a manifest at `trialling` prints no finding on the manifest; category `in-flight` by hub-vocab.test.ts:51-58. The test itself checks the category, not the manifest read.
2. partial (B2, P2): removal and the `nope` finding hold; the unknown-stage finding names no closest word.
3. met (cases.mjs on worktree: `focus_lanes: ["run"]`, `roles: ["lead"]`, no finding).
4. met (cases.mjs: `["in-review","in-flight","idea","publications","other-outputs","released","grants"]`; `categories takes nope out` finding; duplicate row at hub-vocab.test.ts:130).
5. met (cases.mjs: `palette #123456: "c-teal"`, `research_audit: {"skip_tiers":[]}`, `stages must be a map; oculus's value stands`).
6. met (hub-words.test.ts:55).
7. met (hub-words.test.ts:77).
8. met as ruled (board-rules.test.ts new scratchIt row).
9. met.
10. met as ruled.
11. met as ruled (the label-only row is `dontAsk` relabelled "Never ask", 200, since `plan` holds the ruled `pass: dontAsk` row; the `other` finding naming `settings.agents.claude` at agents.test.ts:97-105).
12. met.
13. met.
14. met.
15. met (hub-vocab.test.ts:166).
16. met. The reviewer's program `o60-review/case16.mjs`: `findings 0`, every one of the 18 top keys of `vocab.yml` `equal` to `loadConfig(engineDir()).config[key]`. The test row (hub-vocab.test.ts:181-189) checks `from` of two keys only.
17. met at the unit level the brief gives the builder (schema3.mjs, rows17.mjs reproduced); the page part is the look on landing.
18. not verifiable (see Declined).
19. partial (B3, P1): the edit that removes `nascent` as the case writes it is refused; the `trialling` removal and the no-primary refusal hold.
20. met (hub-words.test.ts:102).
21. met (language.test.ts:145 through the config cache; first load and hook read the same cache, see item 5).
22. met (catalogs.test.ts:97).

## Spec

S1. Scripts written for the step that the brief does not build and no plan.md ruling approves: `<scratch>/o60/wrap.py`, `wrap2.py` (rewrap comment paragraphs) and `greps.sh` (the four reader greps). The report admits it ("A breach of the rules file to record: three helper scripts not built by the brief"). spec.md:65: "Any other script needs the approval the brief names." Failure scenario: a comment rewrap made by a script lands unread; the report says each rewrapped paragraph was read afterwards, which the reviewer did not check paragraph by paragraph.

S2. Case-run programs not quoted in the report: `<scratch>/o60/after.mjs` ("Case-run program of O60 on the changed tree, cases 10, 11 (as ruled) and 22, with the config readers' findings"), `schema.mjs`, `schema2.mjs` (`grep -c` of each name in the report: 0). spec.md:65 asks that a case-run program have "its source and its output quoted in the report". The same line says a file it needs "is gone before the report"; the base copy `<scratch>/o60/base` and the hub copy `<scratch>/o60/hubcopy` are still there. Failure scenario: the worktree-side runs of cases 10, 11 and 22 cannot be checked against what the builder saw.

## Proof

P1. `tests/server/edit/config-value.test.ts:221-232`:
```
it("refuses taking out a stage oculus's categories name, with the reader's reason, and writes nothing", () => {
    ...
    const outcome = write(one, STAGES, 'stages', edited(shipped, 'nascent'));
    expect(outcome.changed).toEqual([]);
    expect(refusalOf(outcome, 'catalogs/vocab.yml:stages')).toBe(
        'categories[2].stages.words must be one of the items of the list project_stages; it is not read'
```
The builder's own item A/C calls this refusal a consequence of open defect A and recommends option (a), under which this edit is accepted. The row asserts the behaviour named as the defect, so it fails the day (a) is built; the rules file says a test never asserts a known defect. The case 19 row (the line above) removes `failed` instead of `nascent`, so case 19 as written has no passing row. Verdict: case 19 partial.

P2. `tests/data/sources/config/layers/hub-vocab.test.ts:74`: `expect(on[0].message).toContain('nascent');` checks neither the closest word case 2 asks for nor anything else of the sentence. The report's item B says "the stage finding lists the allowed words"; the reviewer's `o60-review/stage.mjs` run prints `stage | stage is nascent, which is not a key of vocab.stages`, which lists no words. Failure scenario: the report misstates what the reader of a removed stage sees. Verdict: case 2 partial.

## Standards

none

## Behaviour

B1 (defect A, described without a ruling). `o60-review/defectA.mjs` (merge findings plus `READER_FINDINGS`, hub `/scratch/lab` via `instead`):
```
value: "stages: { nascent: null }\n"
   <wt>/config/catalogs/vocab.yml | categories[2].stages.words | categories[2].stages.words must be one of the items of the list project_stages; it is not read
   idea row: {"key":"idea","label":"idea","stages":{"words":["nascent","scoping"]}}
value: "stages: { nascent: null }\ncategories: [ { key: idea, label: idea, stages: { words: [scoping] } } ]\n"
   idea row: {"key":"idea","label":"idea","stages":{"words":["scoping"]}}
value: "stages: { exploring: null }\n"
   idea row: {"key":"idea","label":"idea","stages":{"words":["nascent","scoping"]}}
value: "chips: { blocked: null }\n"
   idea row: {"key":"idea","label":"idea","stages":{"words":["nascent","scoping"]}}
```
The merge gives no finding for the removal; the readers give one finding that names oculus's file `config/catalogs/vocab.yml`, which the hub's owner does not edit; replacing the `idea` row in the same hub file clears it. The Settings edit of the same removal is refused with that sentence (P1), so a hand-written removal reads while the Settings removal is refused. The gap is wider than `categories`: `stages: { exploring: null }` gives no finding at all, although oculus's `focus_lanes` row `run` names `stages: [exploring]` (`config/catalogs/vocab.yml:173`), so that lane points at a stage the hub no longer has with nothing said; `chips: { blocked: null }` also gives no finding. The builder's options (a), (b), (c) cover only `categories`.

B2. A manifest at a removed stage gets `stage is nascent, which is not a key of vocab.stages` (stage.mjs); case 2 asks for the closest word. `closestWord` is applied to statuses only (`src/lib/data/snapshot/validate.ts:234`). Verdict: case 2 partial.

B3. The case 19 Settings edit (remove `nascent`, relabel `exploring`) is refused and writes nothing, instead of storing `stages: { nascent: null, exploring: {...} }`. Follows from B1. Verdict: case 19 partial.

## Declined to judge

- Case 18: not run, because the hub copy at `<scratch>/o60/hubcopy/research-hub` may hold the hub's `.oculus/local.yml`, which the reviewer may not read. Settled by `TREE=<worktree> HUB=<scratch>/o60/hubcopy/research-hub node <scratch>/o60/hubrun.mjs` diffed against `<scratch>/o60/hub-base-again.txt`, run by someone allowed to read that copy.
- Case 17 page part and the views' drawing of each hub's words: the look on landing.
- What the views draw for the `idea` category when the reader says "it is not read" under B1: `o60-review/catsA.mjs` showed `portfolioConfigFrom` holds no top-level `categories`; settled by a run of `categoriesOf` over that config and the look.
- `<scratch>/o60/items.py` (dated Oct 24 10:59, text of open item 309 of O60's /spec): who wrote it is not in git; settled by the session transcript of the orchestrator.
- The output filter the brief says the rules file names: none found named in spec.md; `test:quick` was run into a file.
- Whether every paragraph `wrap.py`/`wrap2.py` rewrapped reads correctly: not read one by one; settled by reading each comment hunk of the diff.

## Closed

- S1: raised to Axel as open item 337; nothing the scripts printed is used as evidence until he rules.
- S2: sent in repair round 1, item R4.
- P1, B1, B3: open item 336, closed in automode with Z991 (a), widened to every word list of oculus's own values the reviewer's run shows (the `focus_lanes` stages and chips among them); sent in repair round 1, items R1 and R2.
- P2, B2: sent in repair round 1, item R3.
- Declined, case 18: the orchestrator's `find <scratch>/o60/hubcopy -name local.yml` prints nothing, so the copy holds no `local.yml`; the reviewer over round 1 runs it.
- Declined, `items.py`: written by the orchestrator during O60's /spec to place the text of open item 309 in the ledger (the session transcript holds its heredoc); a ledger edit, not part of the step's build.
- Declined, the rewrapped paragraphs: the orchestrator read every comment hunk of the diff before the round; no paragraph reads wrong.

## Repair round 1, refuted

Usage: af9e8df3d3d7d269d, claude-opus-5-5, 303983 tokens, 101 tool uses, 20 min 23 s.

### Verification lines

```
$ npm run diagrams && npm run test:quick   (worktree root; exit 0)
test:quick: 176 changed file(s), from git since HEAD
test:quick: 303 test file(s)
ok      prettier (1.8 s): All matched files use Prettier code style!
ok      ASCII gate (2.0 s)
ok      svelte-kit sync (13.7 s)
ok      eslint (51.4 s)
ok      svelte-check (64.1 s): 1792887810172 COMPLETED 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (110.7 s): Duration  102.09s
ok      vitest (149.5 s): Duration  141.89s
ok      vitest slow (174.3 s): Duration  166.80s
test:quick: 188.5 s; every command passed
```
Character-set check over the 176 changed files and the untracked files: exit 0, nothing printed; over `find src tests config -type f ! -name local.yml`: exit 0. `unused-exports.sh`: no line added (`noFunding`, `CrossMember` go). `folder-check.sh`: exit 0. `wc -l`: no file over its limit; `hub-layer.ts` 438, `validate.ts` 529, `in-place.ts` 287.

Reruns of the report's commands: `npx vitest run tests/data/sources/config/layers/hub-vocab.test.ts tests/server/edit/config-value.test.ts`: 26 passed. `r1-case.mjs` from the report's source: output line for line as quoted (nascent 0 findings, idea `["scoping"]`; exploring 0 findings, run `stages: []`; blocked 0 findings, blocked `chips: []`; the hub's own idea row 1 finding; the manifest at nascent: `stage "nascent" is not a word of the stages list; the closest word is failed`). The sweep: `removals 124 findings 0`; `tiers.research` leaves the boards `projects`, `supervision`, `coauthor` and `archive` with `tier: []`. The engine-copy run: `not_words [nascent, scoping]` becomes `[scoping]`, 0 findings. Scratch removed (`ls`). Case 18 over the reviewer's own copy (no `local.yml`, files over 512 KB left out): the base and the worktree give the same finding lines; only the `hubs.lists` line differs, by `words`.

### Verdicts

Items: 1 violated (S1); 2 to 7 hold; 8 violated (T1); 9 holds.

Cases: 1 to 17 met (8, 10, 11 as ruled; 17 at the unit level, the page part at the look); 18 met on the reviewer's copy; 19 to 22 met.

### Spec

- S1. `src/lib/data/sources/config/merge/hub-layer.ts:205-208,216` (`if (written !== undefined && shape.kind === 'whole') continue;`, `if (!isMap(row) || hubWrote(shape, written, name, row)) return row;`): Z991 says a word the hub removed in a list the hub wrote itself stays a finding naming the hub's file; only `categories` has a reader that gives one. A hub's own `focus_lanes` row naming `stages: [exploring]` or `chips: [blocked]`, its own `fund_stages` row naming `statuses: [applied]`, and its own `audit.stage_folders` and `audit.website.kinds` rows naming `nascent` give 0 findings once the hub removes that word. Failure scenario: a hub writes `chips: { blocked: null }` and its own lane `{ key: b, chips: [blocked] }`; lane `b` stays empty with nothing said. Item 1 violated.
- S2. `config/options/catalogs/vocab.yml:198-207`: `research_audit`'s value names tiers and declares no `from: tiers`, so `tiers: { personal: null }` leaves `skip_tiers: ["personal"]` with 0 findings.
- S3. The builder's report records two read-only git commands outside the three its prompt allows (`git cat-file -e HEAD:<file>`, `git rev-parse --short HEAD`); the ledger does not.
- S4. G126's text, dictated before Z991, does not state the removal from oculus's own lists, while the new test row sits under its describe.

### Proof

- P1. The report's item 1 claims a gone word in a hub-written list "stays the reader's finding naming the hub's file and the hub's key"; the reviewer's runs reproduce it for `categories` only. Item 1 violated, with S1.

### Standards

- T1. `docs/HELP.md:517`, `docs/data-map.md:80`, `docs/templates.md:184-185`, `config/options/catalogs/vocab.yml:4`, `hub-layer.ts:8-9` and `:191-192` state the hub-written-list finding as general; it holds for `categories` only (S1). Item 8 violated.

### Behaviour

- B1. `hub-layer.ts:205` and `:437`: `top` is the hub's raw file, so a key the file holds but the hub layer did not apply (a key outside the hub list, a listed key of the wrong kind) blocks the removal from oculus's value at that path. With `statuses: { applied: null }` and a stray `focus: { applications_sent: [x] }`, `focus.applications_sent` keeps `["applied"]`, and the only finding is the stray key's.
- B2. `hub-vocab.test.ts:121-123`: the finding on a hub-written category names the hub's file and `categories[2]`, the merged list's index; the hub's file holds that row as `categories[0]`.
- B3. `src/lib/state/system/config/rows.ts:300` with `options-folder.ts:10`: an option's `default` is oculus's value before the hub layer, so Settings draws the modified bar on Boards, Categories, Focus lanes, Funding stages and the focus status rows of a hub that removed a word, and their default line shows the removed word; the report does not state it.
- B4. A hub replacing `roles` whole with `[ { key: lead, ... } ]` gives two findings on oculus's `config/defaults/layout.yml` (`boards.supervision.role`, `boards.coauthor.role`), the class Z991 rejected as option (c), outside Z991's text, which rules `<word>: null`.
- Judgment call 16, a board's one-word `tier` left `[]`: follows from Z991 (`config/options/layout.yml:129-132` declares it `control: multi`, `from: tiers`), and the report states it with its before and after. No finding.

### Declined to judge

- The rows' runs on the base replica and before the round's code change: not rerun, since the copies were removed as round item 4 asked; the rows were judged by reading.
- Case 18's fidelity: the reviewer's copy leaves out files over 512 KB, `.git/` and the like, and gives 1 config finding against the builder's 43; a full copy settles it.
- Case 17's `schema3.mjs` and `rows17.mjs`: not rerun, since the round changes neither `rows.ts` nor `engine.ts`.
- Whether a board left with `tier: []` should be hidden or say why it is empty.
- `<scratch>/o60diff/merge.diff`: not used.

### Closed

- S1, P1, T1, B2, B4: open item 338, closed in automode with Z992 (a); fixed at O60's landing in `hub-layer.ts`, its tests and the documents that state the merge, since `repair_rounds: 1` allows no second round.
- S2: fixed at landing, `research_audit`'s value declared as drawn from `tiers` in `config/options/catalogs/vocab.yml`.
- S3: the builder's two read-only git commands outside the allowed three are recorded in O60's booking; nothing rests on them.
- S4: fixed at landing, G126 in `agents/guarded.md` states the removal from oculus's own lists (Z991, Z992).
- B1: fixed at landing, the removal reads the keys the hub layer applied, not the raw file.
- B3: fixed at landing with Z992, the option defaults take the same removal; the look opens Settings on such a hub.
- Declined, `<scratch>/o60diff/merge.diff`: the orchestrator's own dump of the diff for its read; not a script and not used as evidence.
