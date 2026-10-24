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
