# O45 report: a source's unpack names one folder of its archive (`folder`)

Everything in the brief is done. One file outside the write list was changed because the finding needs it: `src/lib/data/snapshot/validate.ts` (an import and one call, see "Files"). One defect that predates the step and sits in `unpack.ts` is reported unfixed under "Wrong or impossible": the program never sees 7-Zip's exit status, so it can say `unpacked` for an archive 7-Zip ended with errors.

## Open items of the state file (verbatim)

Read with `sed -n '/^## Open items/,/^## Booked/p' tools/oculus/.scratch/migration/orchestrator-state.md` (main checkout and worktree copy print the same):

> ## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)
>
> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

The list holds no item.

## The cases' first run (unchanged tree)

Fixtures under `$TMPDIR/o45-first/`, made with `mkdir`, `printf`, `ln -s`, `zip -qr` / `zip -qry` and `COPYFILE_DISABLE=1 tar czf`: `abc.zip` (`A/B/x.txt`, `A/B/sub/y.txt`, `C/z.txt`), the same as `abc.tar.gz`, `link.zip` (`A/k.txt`, links `A/L -> /etc`, `A/L2 -> ../..`), `slink.zip` (`A/B/x.txt`, `C/z.txt`, links `A/L -> B`, `A/M -> ../C`), `empty.zip` (`A/E/` empty, `A/F/f.txt`), `noA.zip` (`C/w.txt`). The base program ran as `node -e "$PROG" <7z-wasm> <archive> <work> <target> <strip>`, `$PROG` printed from the base copy's `unpack.ts` by `node --input-type=module -e "const m = await import('<base>/src/lib/server/machine/runs/recover/unpack.ts'); process.stdout.write(m.UNPACK_PROGRAM)"`. The base program takes five arguments (`process.argv.slice(-5)`, base `unpack.ts:22`), so no folder can be given to it; given six, it fails (`unpack failed: Cannot find module '.../abc.zip/7zz.umd.js'`). The registry reads ran `retrievalOf` of the base copy's `retrieval.ts` with `node --input-type=module -e`.

1. Base program, `abc.zip`, strip 0 (no folder argument exists): target `A A/B A/B/sub A/B/sub/y.txt A/B/x.txt abc.zip C C/z.txt`. G113 row run on a scratch copy of the base (below): `expected [ 'A', 'C', 'set.zip' ] to deeply equal [ 'set.zip', 'sub', 'x.txt' ]`.
2. G113 row on the base: `expected [ 'B', 'set.zip', 'z.txt' ] to deeply equal [ 'set.zip', 'sub', 'x.txt' ]`.
3. G113 row on the base: `expected [ 'A', 'C', 'set.zip' ] to deeply equal [ 'set.zip' ]`.
4. Base program, `abc.zip`, strip 1: `abc.zip B B/sub B/sub/y.txt B/x.txt z.txt`, `unpacked abc.zip`, exit 0 (the brief's expected result).
5. Base read of `folder: 'A/B/'`: `{"retrieval":[{"unpack":true,"kind":"kaggle","dataset":"o/s"}],"recover":true}` (the folder dropped silently).
6. Base read of `../up`, `/abs`, `A/../../up`, `A//B`, `A\B`, `''`, `.`, `./A`: each `{"retrieval":[{"unpack":true,"kind":"kaggle","dataset":"o/s"}],"recover":true}`; no finding (no check reads `retrieval`).
7. Base read of `folder: A/B` without `unpack`: `{"retrieval":[{"kind":"kaggle","dataset":"o/s"}],"recover":true}`.
8. Program half: G113 rows on the base, `../up` and `/abs` and `A/../../up` each `expected [ 'A', 'C', 'set.zip' ] to deeply equal [ 'set.zip' ]`. Kept listing half, base `readKept` of a row with `unpack: { strip: 0, folder: '../up' }`: `{"recipe":"r","files":[{...,"unpack":{"strip":0}}]}` (read, the folder dropped).
9. G113 cluster row on the base: recorder got `[ "it's a $(touch pwned) file.dat", "2" ]`, expected a third word `"Training data/it's $(touch pwned)"`; the no-folder row got two words where three (the last `""`) are expected. Reading base `cluster.ts:368`: the function passes `"$2"` only.
10. Base program, `abc.tar.gz`, strip 0: `A A/B A/B/sub A/B/sub/y.txt A/B/x.txt abc.tar.gz C C/z.txt` (no folder possible).
11. Base read of brats2020 from `.oculus/data/research/data.yml`: `{"retrieval":[{"unpack":true,"kind":"kaggle","dataset":"awsaf49/brats20-dataset-training-validation"}],"recover":true}`. Plan row, `sources.test.ts` kaggle row with the folder, on the base: `expected [ { ...(9) } ] to match object [ { ...(6) } ]`, `- "folder": "BraTS2020_TrainingData/MICCAI_BraTS2020_TrainingData"` missing from `unpack`.
12. Base read of all 64 dataset entries saved to `$TMPDIR/o45-first/read/before.txt`; 39 read `"recover":true`; no entry has a source left out (`node -e` comparing each entry's row count with its `retrieval` length printed `entries with a source left out: 0`).
13. Base: no folder argument. `test -d <target>/a/b` in a folder holding `A/B` printed `found` (this Mac's disk ignores case). G113 row on the base: `expected [ 'A', 'C', 'set.zip' ] to deeply equal [ 'set.zip' ]`.
14. Base program, `link.zip`, strip 0: 7-Zip printed `ERROR: Dangerous link path was ignored : A/L2 : ../..` and `ERROR: Dangerous link path was ignored : A/L : /etc`, then the program said `unpacked link.zip`, process exit 2; target `A A/k.txt link.zip`. Base program, `slink.zip`: `ERROR: Dangerous symbolic link path was ignored : A/M : ../C`, `A/L -> B` written as a link (`ls -la`: `L -> B`). G113 rows on the base: `expected [ 'A', 'set.zip' ] to deeply equal [ 'set.zip' ]`.
15. Base program, `abc.zip` then `noA.zip`, strip 0: both `unpacked`, exit 0, target holds `A`, `C/w.txt`, `C/z.txt`.
16. Base program, `abc.zip` strip 1 twice: both runs give `abc.zip B B/sub B/sub/y.txt B/x.txt z.txt`.
17. Base program, archive in `sub/`, target `sub`: `sub/A/B/...`, `sub/C/z.txt`, `sub/abc.zip`.
18. Base: no folder argument; G113 row on the base: `expected [ 'A', 'C', 'set.zip' ] to deeply equal [ 'set.zip' ]`.
19. Base program, `empty.zip`, strip 0: `A A/E A/F A/F/f.txt empty.zip`. G113 row on the base: `expected [ 'A', 'set.zip' ] to deeply equal [ 'set.zip' ]`.
20. Base read of `folder: 2020`: `{"retrieval":[{"unpack":true,"kind":"kaggle","dataset":"o/s"}],"recover":true}`.
21. Base program, `abc.tar.gz`, strip 1: `abc.tar.gz B B/sub B/sub/y.txt B/x.txt z.txt`.
22. Base recipe of brats2020 with and without `folder` in the registry: both `[{"unpack":true,"kind":"kaggle","dataset":"awsaf49/brats20-dataset-training-validation"}]`, so a kept listing would be reused and the folder lost.

No case's expected result was wrong by the brief's rules; the build went on.

The G113 rows' first run: the worktree's new `safety.test.ts` and `sources.test.ts` copied into `$TMPDIR/o45-baserun` (the base copy's `src tests utils config package.json tsconfig.json`, `vite.config.ts` and `.svelte-kit` from the worktree, which the step does not change, `node_modules` a link), `npx vitest run tests/server/machine/runs/recover/safety.test.ts tests/server/machine/runs/recover/sources.test.ts`: `Test Files 2 failed (2)`, `Tests 15 failed | 62 passed (77)`. Every new row failed; the two rows kept unchanged (`unpacks a zip into its folder, its first folder stripped`, `keeps a name that climbs out, ...`) and the verify cluster row passed.

## DONE / NOT DONE

| Item | State | Proof (command, last line) |
| --- | --- | --- |
| `SourcePlace.folder`, `RecoverFile.unpack.folder` with doc comments | DONE | `npm run test:quick`: `ok svelte-check ... 0 ERRORS 0 WARNINGS` |
| `retrieval.ts` reads `folder` by the rule; a bad folder or a folder without `unpack` leaves the source out | DONE | cases 5, 6, 7, 20 after (below) |
| Finding for every source left out (`checkDatasetSources`, `source_left_out`) | DONE | case 6 and 7 after: nine findings printed |
| `retrieval.ts:6-8` head comment rewritten | DONE | read: `retrieval.ts:6-11` |
| `routes.ts` plan row carries `folder` | DONE | `sources.test.ts` kaggle row passes (case 11) |
| `files.ts` kept row through the shared shape; `recover.svelte.ts` row accepts a string | DONE | case 8 after: `c8 folder ../up: null` |
| `unpack.ts` six arguments, exact lookup, `lstat`, `realpath`, refusals, empty folder, `lstat` walk, head comment | DONE | G113 rows pass; cases 1-4, 10, 13-19, 21 after |
| `local.ts` passes the folder | DONE | `local.ts:374` `folder: row.unpack?.folder ?? ''`; G113 rows run through `startLocalUnpack` |
| `cluster.ts` `"$3"` and the job line | DONE | G113 row `the 'unpack' job reads 'the file name, the strip and the folder' ...` passes; `cluster.ts:368` ends `"$2" "$3"'` |
| `data.yml` field row, strip help, brats2020 folder | DONE | `python3 -c "import yaml; yaml.safe_load(...)"` exit 0; integrity over the worktree hub `validates with no findings` |
| `docs/templates.md` rows and example, `docs/apps.md:377`, `HELP.md:289`, `DESIGN.md:767` | DONE | read; `tests/checks/config/templates.test.ts` passed |
| G113 rows in `safety.test.ts` | DONE | `Test Files 3 passed (3)`, `Tests 92 passed (92)` |
| Verify 1: `npm run diagrams && npm run test:quick` | DONE | `test:quick: 77.6 s (limit 45.0 s); every command passed` |
| Verify 2: safety and plan with slow rows | DONE | `npx vitest run tests/server/machine/runs/recover/safety.test.ts tests/server/machine/runs/recover/plan.test.ts tests/server/machine/runs/recover/sources.test.ts`: `Tests 92 passed (92)` |
| Verify 3: strip grep | DONE | below |
| Verify 4: YAML parses | DONE | exit 0 |
| Verify 5: unused exports | DONE | `diff <base>/unused-exports.txt <after>` printed nothing |
| Verify 6: prose read | DONE | below |
| ASCII | DONE | perl gate printed nothing; `LC_ALL=C grep -n '[^ -~]' HELP.md DESIGN.md docs/apps.md docs/templates.md ../../.oculus/data/research/data.yml` printed only `data.yml:693` (`Hjortkj<ae>r`, a line the step did not change) |

### The cases after the change

Program `$PROG` printed from the worktree's `unpack.ts` the same way, run with six arguments.

1. `abc.zip`, folder `A/B`, strip 0: `unpacked abc.zip`, exit 0, target `abc.zip sub sub/y.txt x.txt`. G113 row passes.
2. folder `A`, strip 1: `abc.zip sub sub/y.txt x.txt`. G113 row passes.
3. folder `A/Q`: `unpack failed: the archive holds no folder A/Q`, exit 1, target `abc.zip`. G113 row (log `unpack: unpack failed: the archive holds no folder A/Q`) passes.
4. no folder (`''`), strip 1: `abc.zip B B/sub B/sub/y.txt B/x.txt z.txt`, as on the base.
5. `folder: 'A/B/'`: `{"retrieval":[{"unpack":true,"folder":"A/B","kind":"kaggle","dataset":"o/s"}],"recover":true}`; then case 1.
6. Each of the eight values: `{"retrieval":[],"recover":false}`; with a zenodo source before it: `{"retrieval":[{"kind":"zenodo","record":"1"}],"recover":false}`. `checkDatasetSources` over eight such entries printed `finding entries[0].retrieval[1] | source 2 of the dataset set0, of kind kaggle, has a field that does not fit its kind, so the source is left out and Recover does not run the set` and the same for `set1` to `set7`.
7. `{"retrieval":[],"recover":false}` and `finding entries[8].retrieval[0] | source 1 of the dataset nounpack, of kind kaggle, has a field that does not fit its kind, ...`. The entry with `folder: 'A/B/'` gave no finding.
8. Program: `../up`, `/abs`, `A/../../up` each `unpack failed: the archive holds no folder <folder>`, exit 1, target the zip alone, and the full output of the `../up` run is that one line (no 7-Zip banner, so 7-Zip did not run). Three G113 rows pass. Kept listing: `c8 folder ../up: null`, `c8 folder /abs: null`, `c8 folder A/B: {...,"unpack":{"strip":0,"folder":"A/B"}}`; `routes.ts:186-187` lists the sources again when `readKept` gives null.
9. G113 rows pass: the job line gives `[ODD, '2', "Training data/it's $(touch pwned)"]` and, with no folder, `[ODD, '0', '']`. Reading `cluster.ts:368`: the function passes `"$2" "$3"`, both quoted.
10. `abc.tar.gz`, folder `A/B`: `unpacked abc.tar.gz`, target `abc.tar.gz sub sub/y.txt x.txt`.
11. brats2020 read: `{"retrieval":[{"unpack":true,"folder":"BraTS2020_TrainingData/MICCAI_BraTS2020_TrainingData","kind":"kaggle","dataset":"awsaf49/brats20-dataset-training-validation"}],"recover":true}`; plan row: `sources.test.ts` kaggle row passes with `unpack: { strip: 0, folder: 'BraTS2020_TrainingData/MICCAI_BraTS2020_TrainingData' }`; `OCULUS_TEST_HUB=<worktree> npx vitest run tests/checks/config/integrity.test.ts`: `the real hub > validates with no findings`, `Tests 14 passed (14)`.
12. `diff before.txt after.txt` over the 64 entries: the one changed line is brats2020 (the folder added); every other entry's `retrieval` and `recover` are equal.
13. folder `a/b`: `unpack failed: the archive holds no folder a/b`, exit 1. G113 row passes. The lookup compares names from `readdirSync` (`unpack.ts:57`), so the cluster's case-sensitive disk gives the same answer (read, not run there).
14. `link.zip`, folder `A/L`: 7-Zip ignored both dangerous links, then `unpack failed: the archive holds no folder A/L`, exit 1, target `link.zip`. `slink.zip` (`A/L -> B` written as a link), folder `A/L`: `unpack failed: the archive holds no folder A/L`, target `slink.zip`. Two G113 rows pass (zips from `zipOf` with the entries marked as Unix links by `withLinks`).
15. `abc.zip` then `noA.zip`, folder `A`: `unpacked abc.zip` exit 0, then `unpack failed: the archive holds no folder A` exit 1; target `abc.zip B B/sub B/sub/y.txt B/x.txt noA.zip`. The run stops there: `local.ts:395-398` ends the run on a code other than 0, and each cluster call line ends `|| exit 1` (`cluster.ts:375`).
16. folder `A/B` twice: both runs leave `x.txt=x`, `sub/y.txt=y`, `abc.zip`.
17. archive in `sub/`, folder `A/B`: `sub/abc.zip sub/sub sub/sub/y.txt sub/x.txt`.
18. folder `A/B/x.txt`: `unpack failed: the archive holds no folder A/B/x.txt`. G113 row passes.
19. `empty.zip`, folder `A/E`: `unpack failed: the folder A/E in the archive is empty`, target `empty.zip`. G113 row passes.
20. `folder: 2020`: `"folder":"2020"`, `"recover":true`.
21. `abc.tar.gz`, no folder, strip 1: `abc.tar.gz B B/sub B/sub/y.txt B/x.txt z.txt`, as on the base.
22. Recipe kept `[{"unpack":true,"kind":"kaggle",...}]`, recipe now `[{"unpack":true,"folder":"BraTS2020_TrainingData/MICCAI_BraTS2020_TrainingData",...}]`, `kept.recipe === recipe: false`, so `routes.ts:187` lists the sources again.

A link below the start: `slink.zip`, no folder, strip 1: `L -> B` placed as a link (`ls -l`), not descended.

The landing items (the cluster's kagglehub validation copy deleted, a Recover Unpack of brats2020 on a scratch copy) are the orchestrator's.

### Verify 3: `grep -rn "strip" src/lib/server/machine/runs/recover src/lib/data src/lib/state/system/machine/recover.svelte.ts`

Every hit that carries a placement carries the folder: `routes.ts:128-131` (`unpackOf`), `unpack.ts:4,11,33,39-40,109,163,170,183` (the folder is the sixth argument beside the strip), `cluster.ts:316,375`, `local.ts:334,373` (folder at `:374`), `files.ts:60`, `retrieval.ts:67` (folder at `:68`), `model-entities.ts:519,521,612`, `recover.svelte.ts:42`. Three hits are other strips: `model-entities.ts:382` (the Focus strip), `model-deck.ts:14` (a slide's spec strip), `catalogs.ts:30` (the pane strip).

### The tests

Runs while working: `npx vitest run` over `safety`, `sources`, `plan`, `routes/machine/recover`, `access`, `runs`, `checks/config/templates`, `checks/config/integrity`, `checks/source/keys` (`Test Files 9 passed (9)`); the tree checks `history`, `comment-width`, `duplication`, `size`, `boundaries`, `order`, `cycles`, `keys`, `diagrams`, `templates` (five timed out at the default 5 s; rerun of `history`, `boundaries`, `order`, `diagrams` with `--testTimeout 0 --hookTimeout 0`, the flags of `npm run test:checks`: `Test Files 4 passed (4)`); integrity over the worktree hub (`Tests 14 passed (14)`). `npm run test:quick` ran once. No whole-suite command ran.

`test:quick` last lines:

```
ok      prettier (1.1 s): All matched files use Prettier code style!
ok      ASCII gate (1.2 s)
ok      svelte-kit sync (2.8 s)
ok      svelte-check (56.0 s): 1792481091851 COMPLETED 524 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (57.6 s)
ok      vitest (74.5 s): Duration  64.43s (transform 75.03s, setup 0ms, import 151.83s, tests 59.08s, environment 41.67s)
test:quick: 77.6 s (limit 45.0 s); every command passed
test:quick: over the time limit
```

Each new or changed test row, its failing line on the unchanged tree and its pass after (final run `Tests 92 passed (92)`):

| Row | Unchanged tree | After |
| --- | --- | --- |
| `the 'unpack' job reads 'the file name, the strip and the folder' each as one word` | `expected [ ...(2) ] to deeply equal [ ...(3) ]`, folder missing | pass |
| `the 'unpack' job reads 'the file name, the strip and no folder' each as one word` | `expected [ ...(2) ] to deeply equal [ ...(3) ]`, `""` missing | pass |
| `the 'verify' job reads 'the checksum and the file name' ...` (title and table changed, assertion unchanged) | pass | pass |
| `passes the program, each path and the folder of an unpack as one argument each` | `expected [ '-e', ...(6) ] to deeply equal [ '-e', ...(7) ]` | pass |
| `unpacks only the folder a source names, its contents at the top of the folder` | `expected [ 'A', 'C', 'set.zip' ] to deeply equal [ 'set.zip', 'sub', 'x.txt' ]` | pass |
| `unpacks the folder a source names with the strip counted below it` | `expected [ 'B', 'set.zip', 'z.txt' ] to deeply equal [ 'set.zip', 'sub', 'x.txt' ]` | pass |
| `moves nothing from an archive that holds no folder of that name` | `expected [ 'A', 'C', 'set.zip' ] to deeply equal [ 'set.zip' ]` | pass |
| `moves nothing for a folder that differs from the archive's in letter case` | same line | pass |
| `moves nothing for a folder that is a file in the archive` | same line | pass |
| `moves nothing for a folder that is empty in the archive` | `expected [ 'A', 'set.zip' ] to deeply equal [ 'set.zip' ]` | pass |
| `moves nothing for a folder that is a link the archive holds` | `expected [ 'A', 'set.zip' ] to deeply equal [ 'set.zip' ]` | pass |
| `moves nothing for a folder that is a link leading out of the archive` | `expected [ 'A', 'set.zip' ] to deeply equal [ 'set.zip' ]` | pass |
| `refuses the folder ../up and moves nothing` (and `/abs`, `A/../../up`) | `expected [ 'A', 'C', 'set.zip' ] to deeply equal [ 'set.zip' ]` | pass |
| `sources.test.ts` `kaggle: the file list checked, then the one zip Kaggle sends, with the row and its folder` | `- "folder": "BraTS2020_TrainingData/MICCAI_BraTS2020_TrainingData"` missing | pass |

Edits to existing assertions and predicates (from `diff <base copy> <worktree>` of each test file):

- `safety.test.ts:483-484` (base) `{ action: 'verify' ..., want: ['sha256', 'a'.repeat(64), ODD] }` and `{ action: 'unpack' ..., want: [ODD, '2'] }` became three rows, each with an `unpack` column; the unpack row wants `[ODD, '2', ODD_FOLDER]`, a new row wants `[ODD, '0', '']`, the verify row's `want` is unchanged.
- `safety.test.ts:486` the title `'the $action job reads each file name as one word, and sbatch its script'` became `'the $action job reads $words each as one word, and sbatch its script'`.
- `safety.test.ts:493` `unpack: { strip: 2 }` became `unpack: one.unpack`.
- `safety.test.ts:518` the vector row's title became `'passes the program, each path and the folder of an unpack as one argument each'`; `:523` and `:532` gained `folder: ODD_FOLDER` and the expected `ODD_FOLDER`.
- `safety.test.ts:568` `zipOf(one.entries)` became `withLinks(zipOf(one.entries), one.links ?? [])`; `:575` `unpack: { strip: one.strip }` gained the folder when the row names one.
- `safety.test.ts:590` `expect(log).toContain(\`unpack: unpacked ${one.archive}\`)` became `` expect(log).toContain(`unpack: ${one.said ?? `unpacked ${one.archive}`}`) ``: the two rows kept from the base give no `said`, so their assertion is the same.
- `sources.test.ts:434-435,447` the kaggle row's name, source (`unpack: true`, `folder`) and expected file (`unpack: { strip: 0, folder }`).

### Verify 6: the prose read

`HELP.md:289` (one bullet with two added sentences), `DESIGN.md:767` (sentences added to the Recover decision), `docs/templates.md:743-744,760`, `docs/apps.md:377`, the `data.yml` help texts, and the comments of every changed file were read against the rules file's prose rules. Departures: the `DESIGN.md:767` addition is one long sentence joined by semicolons and "so", in the paragraph's existing style, and long for a reader; the `HELP.md:289` bullet now holds three sentences where the rules file asks for short bullets. No em dash, no "not X but Y", no history word: the grep of added lines for `before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands` printed one hit, `unpack.ts:22` "refused before 7-Zip runs", an order of execution, not history.

## `.oculus/data/research/data.yml`, before and after

Line 64 before:

```
      - { field: strip,      type: text,   when: { kind: [physionet, zenodo, figshare, dandi, huggingface, stanford, geo, kaggle, tcia, synapse, url] }, help: "How many leading folders of every path an archive holds the unpack drops." }
```

Lines 64-65 after:

```
      - { field: strip,      type: text,   when: { kind: [physionet, zenodo, figshare, dandi, huggingface, stanford, geo, kaggle, tcia, synapse, url] }, help: "How many leading folders the unpack drops of every path an archive holds, counted below folder when the source names one." }
      - { field: folder,     type: text,   label: "Folder in the archive", when: { kind: [physionet, zenodo, figshare, dandi, huggingface, stanford, geo, kaggle, tcia, synapse, url] }, help: "A folder inside each archive; the unpack takes only its contents, which land in the archive's folder, and strip counts below it." }
```

brats2020, line 384 added after `        unpack: true`:

```
        folder: BraTS2020_TrainingData/MICCAI_BraTS2020_TrainingData
```

## Files (line counts base to after)

| File | Lines | Note |
| --- | --- | --- |
| `src/lib/data/model/model-entities.ts` | 871 to 875 | |
| `src/lib/data/snapshot/normalise-parts/retrieval.ts` | 147 to 201 | `safeName` moved here, `archiveFolderShape`, `leftOutSources` |
| `src/lib/data/snapshot/validate-kinds.ts` | 25 to 60 | `checkDatasetSources` |
| `src/lib/data/snapshot/validate.ts` | 402 to 403 | outside the write list: the import and the call of `checkDatasetSources`; `checkResources` is called from `validate.ts:395`, and no other caller exists, so the finding cannot run without it |
| `src/lib/server/machine/runs/recover/routes.ts` | 384 to 390 | `unpackOf` |
| `src/lib/server/machine/runs/recover/files.ts` | 276 to 271 | re-exports `safeName` |
| `src/lib/server/machine/runs/recover/unpack.ts` | 133 to 195 | |
| `src/lib/server/machine/runs/recover/local.ts` | 423 to 424 | |
| `src/lib/server/machine/runs/recover/cluster.ts` | 460 to 463 | |
| `src/lib/state/system/machine/recover.svelte.ts` | 271 to 271 | |
| `config/text/findings.yml` | 357 to 358 | `source_left_out` |
| `tests/server/machine/runs/recover/safety.test.ts` | 592 to 739 | |
| `tests/server/machine/runs/recover/sources.test.ts` | 613 to 622 | the kaggle row (write list: "only if a fixture there must name the folder") |
| `HELP.md` | 534 to 534 | line 289 |
| `DESIGN.md` | 767 to 767 | line 767 |
| `docs/apps.md` | 816 to 816 | line 377 |
| `docs/templates.md` | 1279 to 1281 | lines 743-744, 760 |
| `.oculus/data/research/data.yml` | 1245 to 1247 | lines 64-65, 384 |
| `docs/diagrams/layers.dot`, `layers.svg`, `layer-server.dot`, `layer-server.svg` | unchanged counts | `npm run diagrams`: the server-to-data import count 484 to 485 and 173 to 174 (`files.ts` imports `retrieval.ts`), compared with the main checkout's files by `diff -rq` |
| `.scratch/migration/agents/reviews/O45-report.md` | new | this report |

Not changed: `plan.test.ts` (`plan.ts` is unchanged and `planOf` spreads every field of a listed file, `plan.ts:80-86`, so no row there must carry the folder; the route-level kaggle row shows the folder through `planOf`), and `guarded.md` (G113's Code line names `local.ts`, `cluster.ts`, `unpack.ts`, `routes.ts`, none of which moved). `diff -rq` of `src`, `tests`, `config` against the base copy lists exactly the thirteen code and config files above.

## Judgment calls the brief left open (each reversible)

1. One rule for a name and a folder: `safeName` moved from `files.ts` into `retrieval.ts` (the data layer, which the server may import and the reverse may not), and `files.ts` re-exports it so `plan.ts` and `routes.ts` import it unchanged. `archiveFolderShape` (drop one trailing `/`, then `safeName`) is the shared function `retrieval.ts` and `files.ts` both use. So a folder also refuses a control character, which the brief's rule does not name.
2. `folder` is read through `wordShape`, so surrounding whitespace is trimmed, as for `into`.
3. The finding counts sources from 1 (`source 2 of the dataset set0`) while its key is 0-based (`entries[0].retrieval[1]`), and prints the kind as written, or as JSON (`null`) when the row names no string kind. It fires for every source the read leaves out, an unknown kind or a missing field included; the real hub has none (integrity run above).
4. The program refuses a folder argument with a trailing `/`; the registry and the kept listing never give one.
5. "Empty" is a folder with no entry at all; a folder that holds only empty folders is placed.
6. `move()` reads both sides with `lstat` (`folderAt`), so a link in the target is replaced and never merged through, and the copy across disks passes `verbatimSymlinks: true`, so a relative link keeps its target. The copy across disks is the cluster's case (work under `/local`, target under `~/data`); it was not run here (no second disk).
7. The refusal line for a folder given as `../up`, `/abs` or `A/../../up` is the same `the archive holds no folder <folder>` line, as the brief's "refused the same way" reads.
8. The cluster rows were made a table of three with a `words` column for the title.
9. The 7z-wasm path filter was not used (brief's default).

## Host- or user-visible changes, before and after

- The datasets form (Data view, a dataset's entry form, a source of a download kind such as brats2020's kaggle source): before, `strip` was the last field of a source; after, a text field labelled "Folder in the archive" follows it, with brats2020's showing `BraTS2020_TrainingData/MICCAI_BraTS2020_TrainingData`, and the `strip` help reads "How many leading folders the unpack drops of every path an archive holds, counted below folder when the source names one." This is the look's to see.
- Recover Unpack (both targets): a source with `folder` places only that folder's contents; an archive lacking it logs `unpack: unpack failed: the archive holds no folder <folder>` then `unpack: ended with code 1 on <name>`, and the run stops. Without `folder`, the same result as the base (cases 4, 21).
- A new finding line, `source N of the dataset K, of kind X, has a field that does not fit its kind, so the source is left out and Recover does not run the set`, wherever findings are listed.
- brats2020's kept listing is stale by its recipe and is listed again at the next Recover read.
- The Recover view is unchanged; it names neither strip nor folder.

## Wrong or impossible, and limitations

- Defect found in `unpack.ts`, older than the step and left unfixed: 7z-wasm 1.2.0 sets `process.exitCode` and returns the status from `callMain` (its `quit_` is `(status,toThrow)=>{process.exitCode=status;throw toThrow}`, and the `quit` option the program passes is never read), while `extract()` checks only the `code` its `quit` callback sets. So the check at `unpack.ts:82` never sees a 7-Zip failure: on the base, `link.zip` printed `unpacked link.zip` and exited 2 (case 14's first run), and after the change `slink.zip` with no folder and strip 0 printed `ERROR: Dangerous symbolic link path was ignored : A/M : ../C`, `unpacked slink.zip` and exited 2, the files 7-Zip did write placed in both. `local.ts:395-398` and the cluster's `|| exit 1` still stop the run on exit 2. The fix is `code = seven.callMain([...])`; it would make a 7-Zip warning (status 1) fail the archive with nothing placed, a visible change, so it is left for the orchestrator.
- The link rows' zips come from `zipOf` with entries marked as Unix links by `withLinks`; that 7-Zip wrote `A/L -> B` as a link inside that test is not observed (the work folder is removed). The same archive shape made by `zip -qry` (`slink.zip`) shows 7z-wasm writes a relative link as a link under NODEFS and skips links to `/etc`, `../..` and `../C` as dangerous.
- `npm run test:quick` took 77.6 s against its 45 s limit, with every command passing.
- A strip larger than the depth below the folder places nothing and still says `unpacked`, as a large strip does without a folder (read from `place()`, `unpack.ts:105-115`; not run).
- The DESIGN.md and HELP.md additions are long (Verify 6).
- `validate.ts` is outside the write list (Files).
