# Step O45 refuter report (on .agents/worktrees/migration-O45, base 2dd5c5968)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

The rules file names no output filter by that word; its "Token discipline" asks for the dot reporter for whole runs, so every run below used `--reporter=dot` or `| tail`, and the verbose reporter only where a row's name is quoted.

## Verification (rerun by the reviewer)

```
# Brief "Verify before you report", from tools/oculus in the worktree, PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH
1. npm run test:quick -- --base 2dd5c5968 2>&1 | tail -15   (npm run diagrams not run; the four diagram files' diff read instead)
   ok      prettier (0.9 s): All matched files use Prettier code style!
   ok      ASCII gate (1.0 s)
   ok      svelte-kit sync (2.7 s)
   ok      svelte-check (12.0 s): 1792481753966 COMPLETED 524 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
   ok      eslint (33.5 s)
   ok      vitest (39.4 s): Duration  30.40s (transform 43.00s, setup 0ms, import 71.26s, tests 43.88s, environment 2.22s)
   test:quick: 42.2 s (limit 45.0 s); every command passed
   test:quick: not covered: tests outside the selection, tests/checks, slow tests, build, lint of unchanged files; npm run test:landing runs them
   Diagram diff (git diff 2dd5c5968): layer-server.dot/.svg "folder server/machine to layer data" 173 to 174; layers.dot/.svg "server to data" 484 to 485 (files.ts now imports data/snapshot/normalise-parts/retrieval.ts). tests/checks/diagrams/diagrams.test.ts passes (run below).
2. npx vitest run tests/server/machine/runs/recover/safety.test.ts tests/server/machine/runs/recover/plan.test.ts tests/server/machine/runs/recover/sources.test.ts --reporter=dot | tail
    Test Files  3 passed (3)
         Tests  92 passed (92)
   npx vitest run tests/server/machine/runs/recover/safety.test.ts --reporter=verbose | grep ...: every new row listed as passed, the slow unpack rows included ('unpacks only the folder a source name...', 'moves nothing ...' x6, 'refuses the folder ../up | /abs | A/../../up ...', the three cluster rows, the vector row); Tests 44 passed (44)
3. grep -rn "strip" src/lib/server/machine/runs/recover src/lib/data src/lib/state/system/machine/recover.svelte.ts | grep -v folder
   routes.ts:130 (folder at :131), unpack.ts:40 (folder at :39), :109 (place's depth), :170 (folder at :171), :183 (folder at :184), local.ts:373 (folder at :374), retrieval.ts:67 (folder at :68); model-entities.ts:382, model-deck.ts:14, catalogs.ts:30 are other strips.
4. python3 -c "import yaml; yaml.safe_load(open('../../.oculus/data/research/data.yml'))"; echo $?
   exit 0
5. sh utils/unused-exports.sh > $TMPDIR/o45-review/unused-after.txt; diff ../../../O45-base/unused-exports.txt $TMPDIR/o45-review/unused-after.txt
   348 and 348 lines; diff exit 0 (nothing added)
6. Prose read of HELP.md:289, DESIGN.md:767, docs/templates.md:743-744,760, docs/apps.md:377, the data.yml help texts and every changed comment: findings under Standards.
ASCII: perl gate "ok ASCII gate" (in 1.); LC_ALL=C grep -n '[^ -~]' HELP.md DESIGN.md docs/apps.md docs/templates.md ../../.oculus/data/research/data.yml printed only data.yml:693 (Hjortkj<ae ligature>r, unchanged line); git diff 2dd5c5968 | grep '^+' | LC_ALL=C grep '[^ -~]' printed nothing.
History words: git diff 2dd5c5968 -- tools/oculus/src tools/oculus/tests | grep '^+' | grep -nE "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands|O4[0-9]|2026|Z9[0-9]"
   one hit: unpack.ts head comment "... is refused before 7-Zip runs." (an order of execution, not history)

# Commands the builder's report quotes, rerun in the same form
Program text printed from each tree: node --input-type=module -e "const m = await import('<tree>/src/lib/server/machine/runs/recover/unpack.ts'); process.stdout.write(m.UNPACK_PROGRAM)" > new.cjs / old.cjs (110 and 75 lines)
Fixtures under $TMPDIR/o45-review with mkdir, printf, ln -s, zip -qr / zip -qry, COPYFILE_DISABLE=1 tar czf: abc.zip and abc.tar.gz (A/B/x.txt, A/B/sub/y.txt, C/z.txt), link.zip (A/k.txt, A/L -> /etc, A/L2 -> ../..), slink.zip (A/B/x.txt, C/z.txt, A/L -> B, A/M -> ../C), empty.zip (A/E/ empty, A/F/f.txt), noA.zip (C/w.txt), out2.zip (A/B/x.txt, A/L -> /etc, A/M -> ../..).
node -e "$(cat new.cjs)" <7z-wasm> <target>/<archive> <target>/.w <target> <strip> "<folder>", then find over the target:
   c1  abc.zip 0 A/B       exit 0 | unpacked abc.zip | abc.zip sub sub/y.txt x.txt
   c2  abc.zip 1 A         unpacked abc.zip | abc.zip sub sub/y.txt x.txt
   c3  abc.zip 0 A/Q       exit 1 | unpack failed: the archive holds no folder A/Q | abc.zip
   c4  abc.zip 1 ''        unpacked abc.zip | abc.zip B B/sub B/sub/y.txt B/x.txt z.txt
   c8  ../up, /abs, A/../../up, A/B/   each the one line "unpack failed: the archive holds no folder <folder>" (no 7-Zip banner), exit 1, target abc.zip
   c10 abc.tar.gz 0 A/B    exit 0, 7-Zip printed "Warnings: 1" on the tar pass | unpacked abc.tar.gz | abc.tar.gz sub sub/y.txt x.txt
   c13 abc.zip 0 a/b       unpack failed: the archive holds no folder a/b | abc.zip
   c14 link.zip 0 A/L      ERROR: Dangerous link path was ignored : A/L2 : ../.. ; ERROR: Dangerous link path was ignored : A/L : /etc ; exit 1 | unpack failed: the archive holds no folder A/L | link.zip
       slink.zip 0 A/L     ERROR: Dangerous symbolic link path was ignored : A/M : ../C ; unpack failed: the archive holds no folder A/L | slink.zip
   c15 abc.zip then noA.zip, folder A: exit 0 unpacked abc.zip; exit 1 unpack failed: the archive holds no folder A | abc.zip B B/sub B/sub/y.txt B/x.txt noA.zip
   c16 abc.zip A/B twice:  both exit 0 unpacked abc.zip | x.txt=x abc.zip sub/y.txt=y
   c17 archive in sub/, A/B: sub sub/abc.zip sub/sub sub/sub/y.txt sub/x.txt
   c18 abc.zip 0 A/B/x.txt unpack failed: the archive holds no folder A/B/x.txt | abc.zip
   c19 empty.zip 0 A/E     unpack failed: the folder A/E in the archive is empty | empty.zip
   c21 abc.tar.gz 1 ''     unpacked abc.tar.gz | abc.tar.gz B B/sub B/sub/y.txt B/x.txt z.txt
   slink.zip 0 ''          exit 2 | unpacked slink.zip | A A/B A/B/x.txt A/L C C/z.txt slink.zip; ls -l: L -> B
   slink.zip 1 ''          exit 2 | unpacked slink.zip | B B/x.txt L slink.zip z.txt; L -> B (a link placed as a link)
   link.zip 0 ''           exit 2 | unpacked link.zip
   out2.zip 0 A/L          exit 1, both "Dangerous link path was ignored" lines, unpack failed: the archive holds no folder A/L | out2.zip
   out2.zip 0 ''           exit 2, both ERROR lines, unpacked out2.zip | A A/B A/B/x.txt out2.zip (7-Zip wrote no A/L or A/M)
node -e "$(cat old.cjs)" ... (base, five arguments):
   link.zip 0              exit 2 | ERROR x2 | unpacked link.zip | A A/k.txt link.zip
   abc.tar.gz 1            exit 0 | unpacked abc.tar.gz | abc.tar.gz B B/sub B/sub/y.txt B/x.txt z.txt
Registry read, node --input-type=module -e importing the worktree's retrieval.ts:
   c5  folder 'A/B/'  {"retrieval":[{"unpack":true,"folder":"A/B","kind":"kaggle","dataset":"o/s"}],"recover":true}
   c6  ../up, /abs, A/../../up, A//B, A\B, '', ., ./A (and A/B//, a control character) after a zenodo source: each {"retrieval":[{"kind":"zenodo","record":"1"}],"recover":false}, leftOutSources [{"at":1,"kind":"kaggle"}]
   c7  folder without unpack: {"retrieval":[],"recover":false}, [{"at":0,"kind":"kaggle"}]
   c20 folder 2020: "folder":"2020", "recover":true
   finding (checkDatasetSources with findings.yml's template): entries[0].retrieval[1] | source 2 of the dataset set0, of kind kaggle, has a field that does not fit its kind, so the source is left out and Recover does not run the set; entries[1].retrieval[0] | source 1 of the dataset nounpack, ...; entry with key '' gave none.
   c12 git show 2dd5c5968:.oculus/data/research/data.yml read by the base copy's retrieval.ts, the worktree's data.yml by the worktree's: 64 and 64 lines; diff prints one change, line 15, brats2020 gaining "folder":"BraTS2020_TrainingData/MICCAI_BraTS2020_TrainingData"; 39 entries "recover":true.
   c8  readKept (files.ts) of a kept listing with unpack.folder: "../up" null; "/abs" null; "A/B/" read as "A/B"; "A/B" read; 2020 null
OCULUS_TEST_HUB=<worktree> npx vitest run tests/checks/config/integrity.test.ts --testTimeout 0 --hookTimeout 0 --reporter=verbose
   the demo hub > validates with no findings; the real hub > validates with no findings; Tests 14 passed (14)
npx vitest run tests/checks/source/history.test.ts tests/checks/source/comment-width.test.ts tests/checks/tree/duplication.test.ts tests/checks/tree/size.test.ts tests/checks/tree/boundaries.test.ts tests/checks/imports/order.test.ts tests/checks/imports/cycles.test.ts tests/checks/source/keys.test.ts tests/checks/diagrams/diagrams.test.ts tests/checks/config/templates.test.ts --testTimeout 0 --hookTimeout 0 --reporter=dot
    Test Files  10 passed (10)
         Tests  128 passed (128)
npx vitest run tests/server/machine/runs/recover/ tests/routes/machine/recover.test.ts tests/data --reporter=dot
    Test Files  40 passed (40)
         Tests  538 passed (538)
Line counts, wc -l base copy vs worktree: model-entities 871/875, retrieval 147/201, validate-kinds 25/60, validate 402/403, routes 384/390, files 276/271, unpack 133/195, local 423/424, cluster 460/463, recover.svelte 271/271, findings.yml 357/358, safety.test 592/739, sources.test 613/622 (as the report states). diff -rq of src, tests, config against the base copy lists those 13 files.
7z-wasm 1.2.0 (node_modules/7z-wasm/7zz.umd.js): quit_=(status,toThrow)=>{process.exitCode=status;throw toThrow}; callMain ends "var ret=entryFunction(argc,argv);exitJS(ret,true);return ret"; grep -o '"quit"' printed nothing (the quit option is never read). The report's account of the status defect reproduces.
Linked target folder (target holds B -> an outside folder, abc.zip, strip 1, no folder): base program wrote x.txt and sub into the outside folder through the link; new program replaced the link with a real folder B and left the outside folder holding keep.txt alone.
```

## Verdicts

Items of the brief's "What to build", in its order (the paragraph "What must hold" first, then the bullets numbered 1 to 11, then ruling Z951):

- What must hold: holds; runs c1, c2, c4, c21 and the 64-entry comparison (c12) above.
- 1 (`model-entities.ts`): holds; `SourcePlace` gains `folder?: string`, `RecoverFile.unpack` is `{ strip: number; folder?: string }`, both doc comments rewritten (diff hunks at :514-521 and :605-612).
- 2 (`retrieval.ts` placeShape and the rule): holds; c5, c6, c7, c20 runs; `folder: wordShape.pipe(archiveFolderShape).optional()`, `whole()` refuses a folder without `unpack: true`.
- 3 (a source left out is a finding; head comment rewritten): holds; `leftOutSources` and `checkDatasetSources`, one line `source_left_out` in `config/text/findings.yml`, the head comment at `retrieval.ts:6-11` rewritten; the wording of the line is Behaviour 2.
- 4 (`routes.ts:159` carries `folder`): holds; `unpackOf` at `routes.ts:128-132`, the kaggle row of `sources.test.ts` passes through `handleRecoverState`.
- 5 (`files.ts:53` and `recover.svelte.ts:42`): holds; one shared `archiveFolderShape`, readKept runs above; the page's row takes `folder: z.string().optional()`.
- 6 (`unpack.ts`): holds against the brief: six arguments, exact lookup by `readdirSync`, `lstatSync` per part, `realpathSync` containment, refusal before 7-Zip, the empty-folder line, the `lstat` walk, head comment and argument comment rewritten, `UnpackInput.folder`, `unpackVector` passes it; runs c1 to c4, c8, c10, c13 to c19, c21.
- 7 (`local.ts`): holds; `local.ts:374` `folder: row.unpack?.folder ?? ''`.
- 8 (`cluster.ts`): holds; `cluster.ts:368` passes `"$2" "$3"`, `:374-377` the call line with `shellWord` on the name and the folder; G113 cluster rows pass.
- 9 (`data.yml`, `docs/templates.md`, `docs/apps.md`): holds; the two help texts and the label match the brief word for word, brats2020 gains the folder, the templates rows and the example line, `apps.md:377` lists `folder?`.
- 10 (`HELP.md`, `DESIGN.md`): holds in content; the HELP bullet's length is Standards 2.
- 11 (tests under G113): holds for every row the brief lists; the outward-link row asserts a line that exists only because of the 7-Zip status defect (Standards 1).
- Ruling Z951 (booked after the build): violated in part, Spec 1. `validate.ts`'s one import and one call are present and hold; the status handling is absent.

Cases of the brief's "Cases":

- 1: met, G113 row 'unpacks only the folder a source names, its contents at the top of the folder' and run c1.
- 2: met, G113 row 'unpacks the folder a source names with the strip counted below it' and run c2.
- 3: met, G113 row 'moves nothing from an archive that holds no folder of that name' and run c3.
- 4: met, run c4 (`B/` with `x.txt`, `sub/y.txt`, `z.txt`, the zip), equal to the base; the base row 'unpacks a zip into its folder, its first folder stripped' passes.
- 5: met, run c5 reads `A/B`; the program itself refuses `A/B/` (run c8), and neither caller can hand it one (routes.ts takes the read's value, readKept drops the slash).
- 6: met, runs of all eight values (and two more): left out, `recover: false`, a finding naming the dataset, the source's place (from 1) and its kind.
- 7: met, run c7 and its finding.
- 8: met, three G113 refusal rows and run c8 (no 7-Zip banner, so 7-Zip did not run); readKept gives null for `../up` and `/abs`, and `filesOf` (`routes.ts:186-187`) lists the sources again on null.
- 9: met, G113 rows want `[ODD, '2', ODD_FOLDER]` and `[ODD, '0', '']`; `cluster.ts:368` read: `"$2" "$3"` both quoted.
- 10: met, run c10.
- 11: met, the brats2020 read in c12 carries the folder with `recover: true`; the kaggle row of `sources.test.ts` shows the plan row carrying it (that row is Spec 2); the real-hub integrity run gives no finding.
- 12: met, the per-entry comparison changes only brats2020.
- 13: met, G113 row and run c13; the lookup compares names from `readdirSync` (`unpack.ts:56-58`), so the cluster's disk gives the same answer by reading.
- 14: met for the link inside the archive (G113 row 'moves nothing for a folder that is a link the archive holds', and run slink.zip `A/L -> B`, which 7z-wasm writes as a link); the second link row proves nothing about the link check (Standards 1).
- 15: met, run c15 and `local.ts:394-398` (`code !== 0` logs and ends the run), the cluster line's `|| exit 1`.
- 16: met, run c16.
- 17: met, run c17.
- 18: met, G113 row and run c18.
- 19: met, G113 row and run c19.
- 20: met, run c20.
- 21: met, run c21 equals the base program's output.
- 22: met, the brats2020 recipe changes (c12 diff of `retrieval`, the recipe being `JSON.stringify(entry.retrieval)` at `routes.ts:184`), so `kept.recipe === recipe` fails and the sources are listed again.

## 1. Spec

- `src/lib/server/machine/runs/recover/unpack.ts:77-82`: "try { seven.callMain(['x', '/a/' + path.basename(file), '-o/o', '-y', '-bd']); } catch (error) { code = error && typeof error.status === 'number' ? error.status : 2; } if (code !== 0) throw new Error('7-Zip ended with code ' + code + ' on ' + path.basename(file));"; what is wrong: ruling Z951 asks the program to read 7-Zip's status from `callMain`'s return, fail the archive with a line naming the status and place nothing at status 2 or above, and place the archive and log 7-Zip's warning at status 1. The diff reads no return value (`code` is set only by the `quit` option, which 7z-wasm 1.2.0 never reads, and by a thrown status), has no status-1 branch (once the return is read, `code !== 0` would fail a warning too), the head comment says nothing of the status, and the test row named in Standards 1 expects the folder line where Z951 gives the status line. The build predates Z951, so this is the repair round's work, not a fault of the builder; failure scenario: `link.zip` or `out2.zip` with no folder (7-Zip status 2, "Dangerous link path was ignored") logs `unpacked link.zip`, places the partial contents and exits 2, the log then saying `unpack: ended with code 2`, so the dataset folder holds a partial unpack the line above calls unpacked; verdict: ruling Z951 violated in part.
- `tests/server/machine/runs/recover/sources.test.ts:434-456`: "name: 'kaggle: the file list checked, then the one zip Kaggle sends, with the row and its folder', source: { kind: 'kaggle', dataset: ..., unpack: true, folder: 'BraTS2020_TrainingData/MICCAI_BraTS2020_TrainingData' }"; what is wrong: the brief lets the step write this file "only if a fixture there must name the folder", and its Cases section makes case 11 a run "and no test is kept for it". No fixture had to change (an unpacking source without a folder gives the same row as before, `routes.ts:131`), so the change keeps a test for case 11 inside G111's table, whose entry is the source readers, while the unit it checks (`unpackOf` of `routes.ts`) belongs to G113's Code line. The report's file table cites the condition without showing that it is met; failure scenario: a reader of G111's table finds a reader row whose expected file depends on a placement rule G111 does not describe, and the kaggle reader row no longer covers a kaggle source without `unpack`; verdict: none of the brief's items or cases changes; fixed at landing by putting the row back as it was at the base, or by booking the row under G113 if the orchestrator keeps it.

## 2. Proof

- `tests/server/machine/runs/recover/safety.test.ts:681-690` (the row 'moves nothing for a folder that is a link leading out of the archive', entries `{ 'A/B/x.txt': 'x', 'A/L': '/etc', 'A/M': '../..' }`, links `['A/L', 'A/M']`, folder `A/L`): what is wrong: the report and the test head comment present this row as proof that a folder which is a link leading out is refused, but 7z-wasm ignores both links as dangerous and writes neither (run of out2.zip, the same layout made with `zip -qry`: "ERROR: Dangerous link path was ignored : A/L : /etc", and with no folder the target holds `A A/B A/B/x.txt out2.zip`, no `A/L`). The row's result therefore comes from the folder being absent; neither `lstatSync` nor the `realpathSync` check of `found()` is reached. The row was not run on the test's own bytes by the reviewer (the zip is built by `withLinks` inside the test), so this rests on the equivalent fixture; failure scenario: a later change that followed links in `found()` (`statSync` in place of `lstatSync`) would still pass this row, so it guards nothing beyond the relative-link row; verdict: none (case 14 is met by the relative-link row).

## 3. Standards

- `tests/server/machine/runs/recover/safety.test.ts:681-690`: "said: 'unpack failed: the archive holds no folder A/L'"; what is wrong: the rules file's "What every package obeys" says "A test never asserts a known defect". The builder found the status defect at Step 0 (the report's "Wrong or impossible" section) and this row's expected line exists only because of it: 7-Zip ends that archive with status 2, the program does not read the status, and so it goes on to the folder lookup. Once the status is read (ruling Z951), the program stops at `extract()` with `7-Zip ended with code 2 on set.zip` and the row fails although the code is then right; failure scenario: the repair round that carries Z951 turns this row red and has to rewrite its expectation, which is the "fails the day the defect is fixed" the rule forbids; verdict: item 11 holds otherwise; the row's `said` is set to the status line in the Z951 repair, or the row is given a layout 7-Zip writes (a relative link that leads out through `..` inside the archive is also refused by 7-Zip, so an outward link cannot be written at all and the relative-link row is the one that reaches the check).
- `tools/oculus/HELP.md:289`: "- Verify checks every file against its source's checksum. Unpack opens the archives of a source marked `unpack: true`. A source can name `folder`, the one folder of each archive the unpack takes; its contents land in the archive's folder, and an archive without that folder fails with a log line naming it and places nothing."; what is wrong: the rules file's "What every package obeys" says "A step writes what a user does into HELP.md as short bullets"; the bullet now holds three sentences, the last one 40 words with a semicolon. The report names the departure (Verify 6) instead of fixing it, which the rules file's first working rule calls "a limitation written instead of a fix"; failure scenario: a reader scanning the Recover bullets for what `folder` does finds it at the tail of the Verify bullet; verdict: item 10 holds in content; fixed at landing by a bullet of its own for `folder`.

## 4. Behaviour

- `src/lib/server/machine/runs/recover/unpack.ts:85-104` (`folderAt` in `move()`): "if (folderAt(to) && folderAt(from)) { ... } fs.rmSync(to, { recursive: true, force: true });"; what is wrong: a link already in the dataset folder at a name an archive also writes is now removed and replaced by the archive's folder, where the base merged the archive's files into the link's target outside the folder (run above: base wrote `x.txt` and `sub` into the outside folder; new replaced the link with a folder `B`). This ends a G113 escape that existed at the base and is the right outcome, but the report states it only as judgment call 6 and not in "Host- or user-visible changes, before and after", which is what the landing reads; the same lines also mean that an archive entry which is a link replaces a real folder of that name in the target with the link (`rmSync(to)` then `renameSync`), where the base merged through it; failure scenario: a user whose dataset folder holds a link at a case-folder name (raw-pls's own hint at `hpc/run_all.sh:28` suggests linking the MICCAI folder into place) reruns Unpack and finds the link gone and a real folder in its place, with no line of the report having told the landing to look for it; verdict: none.
- `tools/oculus/config/text/findings.yml:256`: "source_left_out: 'source {1} of the dataset {0}, of kind {2}, has a field that does not fit its kind, so the source is left out and Recover does not run the set'"; what is wrong: the line fires for every source `sourcesOf` drops, and for several of them its middle clause is false: a source with `folder` and no `unpack: true` (every field fits its kind; the fault is the pair), a source missing a required field such as a kaggle source with no `dataset` (no field is there to misfit), and a source whose `kind` is unknown or not a string (run: `{ kind: 5 }` gives "of kind 5"; a row with no kind gives "of kind null"). The brief asks the line to name the dataset, the source's position and kind, and that Recover does not run the set; the clause "has a field that does not fit its kind" is the builder's; failure scenario: a user who wrote `folder:` on a source and forgot `unpack: true` reads that a field does not fit its kind, checks `folder` against the form, finds it valid, and is not told that `unpack: true` is what is missing; verdict: item 3 holds; fixed at landing by a clause that covers every cause, for example "does not read as a source of its kind (a field missing, malformed, or given without the one it needs)".

## Declined to judge

- The report's first run of the new rows on the base ("Test Files 2 failed (2)", "Tests 15 failed | 62 passed (77)", on a scratch copy of the base with the new test files): not rerun, since running the new tests against the code without the change to watch them go red is a form of breakage testing the rules forbid to a reviewer; the count of 15 agrees with the rows the diff adds or changes (2 cluster rows, the vector row, 11 unpack rows, the kaggle row).
- The number of `npm run test:quick` runs and the absence of a whole-suite command: the builder's transcript is not open to the reviewer; not verified.
- Whether the base row 'keeps a name that climbs out, and an absolute one, inside the folder' gets a non-zero 7-Zip status (it bears on the Z951 repair, which could turn it red too): a zip holding `../evil.txt` cannot be made with `zip`, `tar`, `mkdir` and `ln -s`, the tools the review may use; not verified.
- How the Findings view resolves the key `entries[<n>].retrieval[<m>]` for a `retrieval` written as one map with no list around it (`rowsOf` reads it as a list of one, so the key names `[0]` of a list the YAML does not hold): not read; the key follows `checkResources`'s pattern.
- Whether the program's log lines, the two new failure lines among them, fall under the rules file's catalog rule ("An error from the engine or a library is mapped to a catalog line before it is shown"): the brief check left this to the user, and the existing lines of `unpack.ts` are literals.
- The copy across disks with `verbatimSymlinks: true` (`unpack.ts:101`), the cluster's case: this Mac has no second disk for the work folder; not run by the builder or the reviewer.
- The landing items (the cluster's kagglehub validation copy deleted, a Recover Unpack of brats2020 on a scratch oculus, the look at the datasets form): the orchestrator's.

Reviewer usage: a3f117736221f4c68, claude-opus-5-5, 229,928 tokens, 50 tool uses, 11.0 min.
