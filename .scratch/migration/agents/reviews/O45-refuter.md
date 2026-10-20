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

## Repair round 1, refuted

The rules file names no output filter. Its "Token discipline" asks for the dot reporter on whole runs, so whole runs below used `--reporter=dot` or `| tail` / `| grep`. The verbose reporter was used only to list row names. `npm run diagrams` was not run because the reviewer changes no file. `tests/checks/diagrams/diagrams.test.ts` was run in its place.

```
# Brief "Verify before you report", from tools/oculus in the worktree, PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH
1. npm run test:quick -- --base 2dd5c5968 2>&1 | tail -15
   ok      prettier (0.9 s): All matched files use Prettier code style!
   ok      ASCII gate (0.9 s)
   ok      svelte-kit sync (2.7 s)
   ok      svelte-check (29.2 s): 1792483473175 COMPLETED 524 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
   ok      eslint (58.0 s)
   ok      vitest (74.8 s): Duration  66.40s (transform 159.21s, setup 0ms, import 184.31s, tests 33.00s, environment 34.13s)
   test:quick: 77.7 s (limit 45.0 s); every command passed
   test:quick: over the time limit
   test:quick: not covered: tests outside the selection, tests/checks, slow tests,
               build, lint of unchanged files; npm run test:landing runs them
   npx vitest run tests/checks/source/history.test.ts tests/checks/source/comment-width.test.ts tests/checks/tree/duplication.test.ts tests/checks/tree/size.test.ts tests/checks/tree/boundaries.test.ts tests/checks/imports/order.test.ts tests/checks/imports/cycles.test.ts tests/checks/source/keys.test.ts tests/checks/diagrams/diagrams.test.ts tests/checks/config/templates.test.ts --testTimeout 0 --hookTimeout 0 --reporter=dot
    Test Files  10 passed (10)
         Tests  128 passed (128)
2. npx vitest run tests/server/machine/runs/recover/safety.test.ts tests/server/machine/runs/recover/plan.test.ts --reporter=verbose | grep ...
   every unpack row listed as passed, the slow ones included: 'unpacks a zip into its fi...', 'keeps a name that climbs out, and an ...', 'unpacks only the folder a source name...', 'unpacks the folder a source names wit...', 'moves nothing from an archive that ho...', 'moves nothing for a folder that diffe...', 'moves nothing for a folder that is a ...' (x2), 'moves nothing for a folder that is em...', 'with the folder A/B, places nothing w...', 'with no folder, places nothing when 7...', 'refuses the folder ../up | /abs | A/../../up ...', the three cluster rows, the vector row
    Test Files  2 passed (2)
         Tests  60 passed (60)
3. grep -rn "strip" src/lib/server/machine/runs/recover src/lib/data src/lib/state/system/machine/recover.svelte.ts
   placement hits, each carrying the folder: unpack.ts:4,11,39,45-46,118,172,179,192; routes.ts:128,130-131; cluster.ts:316,375; files.ts:60; local.ts:334,374 (folder at :375); retrieval.ts:67 (folder at :68); model-entities.ts:519,521,612; recover.svelte.ts:42. Other strips: model-entities.ts:382, model-deck.ts:14, catalogs.ts:30.
4. python3 -c "import yaml; yaml.safe_load(open('../../.oculus/data/research/data.yml'))"; echo $?
   data.yml exit 0   (config/text/findings.yml also parses, exit 0)
5. sh utils/unused-exports.sh > <scratch>/unused-after.txt; diff ../../../O45-base/unused-exports.txt <scratch>/unused-after.txt
   348 and 348 lines; diff exit 0
6. Prose read of HELP.md:289-291, DESIGN.md:767, docs/templates.md:743-744,760, docs/apps.md:377, the data.yml help texts, findings.yml:256 and every changed comment: findings under Standards.
ASCII: perl gate "ok ASCII gate" (in 1.); LC_ALL=C grep -n '[^ -~]' HELP.md DESIGN.md docs/apps.md docs/templates.md ../../.oculus/data/research/data.yml config/text/findings.yml printed only data.yml:693 (a name with <ae ligature>, unchanged line); git diff 2dd5c5968 | grep '^+' | LC_ALL=C grep -c '[^ -~]' printed 0.
History words: git diff 2dd5c5968 -- tools/oculus/src tools/oculus/tests tools/oculus/HELP.md tools/oculus/DESIGN.md tools/oculus/config | grep '^+' | grep -noE "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands|O4[0-9]|2026|Z9[0-9]"
   one hit: "+// is absolute or holds a backslash or an empty, `.` or `..` part is refused before 7-Zip runs." (an order of execution)

# The round's delta: diff -u <snapshot>/<path> <worktree>/<path> for the 22 paths of files.txt
   changed in the round: config/text/findings.yml, DESIGN.md, HELP.md, local.ts, unpack.ts, safety.test.ts, sources.test.ts; the other 15 equal to the snapshot. git status --short lists no path outside files.txt but the untracked report.
   diff -q O45-base/.../sources.test.ts worktree/.../sources.test.ts: equal ("sources equal base"); git diff 2dd5c5968 -- .../sources.test.ts: 0 lines
   diff <(git show 2dd5c5968:tools/oculus/HELP.md | sed -n 289p) <(sed -n 289p tools/oculus/HELP.md): equal

# Commands the round report quotes, rerun in the same form
npx vitest run tests/server/machine/runs/recover/safety.test.ts tests/server/machine/runs/recover/plan.test.ts tests/server/machine/runs/recover/sources.test.ts --reporter=dot
    Test Files  3 passed (3)
         Tests  93 passed (93)
npx vitest run tests/server/machine/runs/recover/ tests/routes/machine/recover.test.ts tests/data --reporter=dot
    Test Files  40 passed (40)
         Tests  539 passed (539)
OCULUS_TEST_HUB=<worktree root> npx vitest run tests/checks/config/integrity.test.ts --testTimeout 0 --hookTimeout 0 --reporter=verbose
   the demo hub > validates with no findings; the real hub > validates with no findings; Tests 14 passed (14)
7z-wasm 1.2.0 (node_modules/7z-wasm/7zz.umd.js): callMain = "try{var ret=entryFunction(argc,argv);exitJS(ret,true);return ret}catch(e){return handleException(e)}"; exitJS calls _proc_exit, which calls quit_(code,new ExitStatus(code)); quit_=(status,toThrow)=>{process.exitCode=status;throw toThrow}; handleException returns EXITSTATUS for an ExitStatus. So callMain returns 7-Zip's status and leaves process.exitCode set, as the round's head comment says.
Program printed from the worktree (node --input-type=module -e "... process.stdout.write(m.UNPACK_PROGRAM)", 113 lines), run as node -e "$PROG" <7z-wasm> <target>/<archive> <target>/.w <target> <strip> "<folder>"; fixtures under the scratchpad made with mkdir, printf, ln -s, zip -qr, zip -qry, COPYFILE_DISABLE=1 tar czf, gzip:
   c1  abc.zip 0 'A/B'        exit 0 | unpacked abc.zip | abc.zip sub sub/y.txt x.txt
   c2  abc.zip 1 'A'          exit 0 | unpacked abc.zip | abc.zip sub sub/y.txt x.txt
   c3  abc.zip 0 'A/Q'        exit 1 | unpack failed: the archive holds no folder A/Q | abc.zip
   c4  abc.zip 1 ''           exit 0 | unpacked abc.zip | abc.zip B B/sub B/sub/y.txt B/x.txt z.txt
   c8  ../up, /abs, A/../../up  each exit 1 | unpack failed: the archive holds no folder <folder> | abc.zip
   c10 abc.tar.gz 0 'A/B'     exit 0 | WARNINGS:;WARNINGS:;Warnings: 1;unpacked abc.tar.gz | abc.tar.gz sub sub/y.txt x.txt   (7-Zip's text: "Archives with Warnings: 1", status 0, no "7-Zip warned" line)
   c13 abc.zip 0 'a/b'        exit 1 | unpack failed: the archive holds no folder a/b | abc.zip
   c14 safe.zip (A/L -> B) 0 'A/L'  exit 1 | unpack failed: the archive holds no folder A/L | safe.zip
       etc.zip (A/L -> /etc) 0 'A/L' and ''   exit 1 | ERROR: Dangerous link path was ignored : A/L : /etc;unpack failed: 7-Zip ended with code 2 on etc.zip | etc.zip
   c15 abc.zip then noA.zip, folder A: unpacked abc.zip; unpack failed: the archive holds no folder A | abc.zip B B/sub B/sub/y.txt B/x.txt noA.zip
   c16 abc.zip A/B twice: both unpacked abc.zip; both leave sub/y.txt=y x.txt=x and the zip
   c17 archive in sub/, A/B: sub sub/abc.zip sub/sub sub/sub/y.txt sub/x.txt
   c18 abc.zip 0 'A/B/x.txt'  exit 1 | unpack failed: the archive holds no folder A/B/x.txt | abc.zip
   c19 empty.zip 0 'A/E'      unpack failed: the folder A/E in the archive is empty | empty.zip
   c21 abc.tar.gz 1 ''        exit 0 | WARNINGS:;WARNINGS:;Warnings: 1;unpacked abc.tar.gz | abc.tar.gz B B/sub B/sub/y.txt B/x.txt z.txt
   two.zip (A/B/x.txt, A/M -> ../..) 0 'A/B' and ''   exit 1 | ERROR: Dangerous link path was ignored : A/M : ../..;unpack failed: 7-Zip ended with code 2 on two.zip | two.zip
   slink.zip (A/L -> B, A/M -> ../C) 0 '' and 'A/B'   exit 1 | ERROR: Dangerous symbolic link path was ignored : A/M : ../C;unpack failed: 7-Zip ended with code 2 on slink.zip | slink.zip
   safe.zip 0 ''              exit 0 | unpacked safe.zip | A A/B A/B/x.txt A/L safe.zip
   cut.tar.gz (a tar cut at 1700 bytes, then gzip) 0 ''   ERRORS: Unexpected end of archive ... unpack failed: 7-Zip ended with code 2 on cut.tar | cut.tar.gz
Item 6 runs, new program, strip 1, folder '':
   target with B -> <outside> (outside holds keep.txt), abc.zip: unpacked abc.zip | abc.zip B B/sub B/sub/y.txt B/x.txt z.txt | B link? no | outside: keep.txt
   target with a real folder L holding keep.txt, safe.zip: unpacked safe.zip | B B/x.txt L safe.zip | L: B (the folder and keep.txt removed)
Registry read, node --input-type=module -e importing the worktree's retrieval.ts, each value after a zenodo source:
   c5  "A/B/"   {"retrieval":[{"kind":"zenodo","record":"1"},{"unpack":true,"folder":"A/B","kind":"kaggle","dataset":"o/s"}],"recover":true} []
   c6  "../up" "/abs" "A/../../up" "A//B" "A\\B" "" "." "./A"   each {"retrieval":[{"kind":"zenodo","record":"1"}],"recover":false} [{"at":1,"kind":"kaggle"}]
   c7  no unpack {"retrieval":[],"recover":false} [{"at":0,"kind":"kaggle"}]
   c20 2020     {... "folder":"2020" ...,"recover":true} []
checkDatasetSources with findings.yml's source_left_out (Item 5):
   entries[0].retrieval[0] | source 1 of the dataset nounpack, of kind kaggle, does not read as a source of its kind (a field missing or malformed, or given without the one it needs), so it is left out and Recover does not run the set
   entries[1].retrieval[1] | source 2 of the dataset nodataset, of kind kaggle, ... (same text)
   entries[2].retrieval[0] | source 1 of the dataset badfolder, of kind kaggle, ... (same text)
c12 base copy's retrieval.ts over git show 2dd5c5968:.oculus/data/research/data.yml vs the worktree's over the worktree's: 64 and 64 lines; diff prints one change, line 15, brats2020 gaining "folder":"BraTS2020_TrainingData/MICCAI_BraTS2020_TrainingData"; 39 entries "recover":true
c8 readKept of a kept listing with unpack.folder: "../up" null; "/abs" null; "A/B/" {"strip":0,"folder":"A/B"}; "A/B" {"strip":0,"folder":"A/B"}; 2020 null
Line counts, wc -l base copy vs worktree: unpack.ts 133/204, local.ts 423/429, safety.test.ts 592/741, sources.test.ts 613/613, findings.yml 357/358, HELP.md 536 now. diff -rq of src, tests, config against the base copy lists 12 files (sources.test.ts no longer among them).
```

### Verdicts

Items of the brief's "What to build", numbered as the first refuter numbered them ("What must hold" first, then the bullets 1 to 11, then ruling Z951):

- What must hold: holds. Evidence: runs c1, c2, c4 and c21, and the 64-entry comparison c12.
- 1 (`model-entities.ts`): holds. `SourcePlace` gains `folder?: string`, `RecoverFile.unpack` is `{ strip: number; folder?: string }`, and both doc comments are rewritten.
- 2 (`retrieval.ts` placeShape and the rule): holds. Evidence: runs c5, c6, c7 and c20.
- 3 (a source left out is a finding; the head comment rewritten): holds. `leftOutSources` and `checkDatasetSources` are in place, and the reworded `source_left_out` (findings.yml:256) is rendered above for three causes. `validate.ts`'s import and call are in O45's paths by Z951.
- 4 (`routes.ts` carries `folder`): holds by reading `unpackOf` (routes.ts:128-131) and its use at routes.ts:165. No test or run now shows a plan row carrying the folder, since the `sources.test.ts` row is back to the base; the report's stale proof row for this item is Proof 1.
- 5 (`files.ts` and `recover.svelte.ts`): holds. `files.ts:59-61` reads through `archiveFolderShape`, and the readKept runs above give null for `../up`, `/abs` and `2020`. `recover.svelte.ts:42` takes `folder: z.string().optional()`.
- 6 (`unpack.ts`): holds. Evidence: runs c1 to c4, c8, c10, c13 to c19 and c21, plus the G113 rows.
- 7 (`local.ts`): holds. `local.ts:375` reads `folder: row.unpack?.folder ?? ''`.
- 8 (`cluster.ts`): holds. `cluster.ts:368` passes `"$2" "$3"`, and `:373-376` passes the name and the folder through `shellWord`. Both G113 cluster rows pass.
- 9 (`data.yml`, `docs/templates.md`, `docs/apps.md`): holds. Both YAML files parse, the integrity run gives no finding, and c12 changes only brats2020.
- 10 (`HELP.md`, `DESIGN.md`): holds. `folder` now has a bullet of its own (HELP.md:290), and HELP.md:289 is equal to the base. HELP.md:291 and the status sentence in DESIGN.md:767 are asked for: the rules file's "What every package obeys" says "A step writes what a user does into HELP.md as short bullets ... and a decision with its reason into DESIGN.md", and Z951 changes what Unpack does. HELP.md is not among O44's paths, so the inserted lines merge simply. The wording is Standards 2 and Spec 1.
- 11 (tests under G113): holds.
  - The two status-2 rows exercise the status read. In each, 7-Zip writes `A/B/x.txt` and returns 2 for `A/M -> ../..`. Without the status read, the folder `A/B` (or the whole archive) would be found and placed and `unpacked set.zip` logged. Each row expects `after: ['set.zip']` and the status line.
  - The brief's outward-link row (`folder: A/L`, `A/L -> /etc`) is no longer a row as the brief named it. Its result is the same by reading, since `extract()` throws before `found()` runs: the etc.zip run with folder `A/L` gives `unpack failed: 7-Zip ended with code 2 on etc.zip` with nothing placed.
  - The relative-link row (`A/L -> B`, 7-Zip status 0) reaches the `lstatSync` check (safe.zip run).
- Ruling Z951: violated in part, Spec 1.
  - Status 2 or above holds: the two rows and the runs of two.zip, slink.zip, etc.zip and cut.tar.gz fail the archive with a status line and place nothing.
  - Both passes of a tar are read (cut.tar.gz fails on the tar pass).
  - The status-1 branch (`unpack.ts:88-90`, `local.ts:383-387`) holds by reading only. Neither the builder nor this review found an archive that 7-Zip extracts with status 1: the tar pass prints "Warnings: 1" and returns 0 (c10, c21).
  - The warning's own text does not reach the log on this Mac (Spec 1).

Cases of the brief's "Cases":

- 1: met, by the G113 row 'unpacks only the folder a source names...' and run c1.
- 2: met, by the G113 row 'unpacks the folder a source names with the strip counted below it' and run c2.
- 3: met, by the G113 row 'moves nothing from an archive that holds no folder of that name' and run c3.
- 4: met, by run c4, whose result equals the base. The base row 'unpacks a zip into its folder, its first folder stripped' passes.
- 5: met, by run c5 (read as `A/B`). Neither caller hands the program a trailing `/`: routes.ts takes the read's value, and readKept drops it.
- 6: met. All eight values are left out with `recover: false`, `leftOutSources` names `{at:1, kind:kaggle}`, and the finding renders with the dataset, the place and the kind.
- 7: met, by run c7 and the `nounpack` finding.
- 8: met. The three G113 refusal rows pass. Run c8 exits 1 with one line and the zip alone. readKept gives null for `../up` and `/abs`, and `filesOf` lists the sources again on null (routes.ts:186-187).
- 9: met. The G113 cluster rows pass, and reading `cluster.ts:368` shows `"$2" "$3"` both quoted.
- 10: met, by run c10.
- 11: met. The brats2020 read (c12) carries the folder with `recover: true`, and the plan row carries it by reading `unpackOf` (routes.ts:128-131). The real-hub integrity run gives no finding.
- 12: met, by run c12.
- 13: met, by the G113 row and run c13. The lookup compares names from `readdirSync` (unpack.ts:61), so the cluster's disk gives the same answer by reading.
- 14: met. The G113 row (`A/L -> B`) and the safe.zip run give the folder line. The `/etc` and `../..` links give the status line, with nothing written outside the work folder (etc.zip, two.zip runs).
- 15: met, by run c15. `local.ts:399-402` ends the run on a code other than 0, and each cluster call line ends `|| exit 1`.
- 16: met, by run c16.
- 17: met, by run c17.
- 18: met, by the G113 row and run c18.
- 19: met, by the G113 row and run c19.
- 20: met, by run c20.
- 21: met, by run c21, whose result equals the base program's (the first refuter's run).
- 22: met. The brats2020 recipe changes (c12), so `kept.recipe === recipe` fails and the sources are listed again.

### Findings

#### 1. Spec

- `src/lib/server/machine/runs/recover/local.ts:383-387`: "if ( line.startsWith('unpack') || line.startsWith('skipped') || line.startsWith('7-Zip warned') ) { logLine(files.log, `unpack: ${line}`); }", with `unpack.ts:90` "if (code === 1) say('7-Zip warned (code 1) on ' + name);".
  - What is wrong: ruling Z951 (plan.md Rulings) says status 1 "places the archive and logs 7-Zip's warning"; choices.md says "logs the warning". On this Mac the log gets only the program's own line `7-Zip warned (code 1) on <archive>`. The filter drops 7-Zip's warning text (its "WARNINGS:" block and the message under it, printed through `print: say`), because those lines start with none of the three words. On the cluster the job output is tailed whole (`cluster.ts:155-159`), so the same archive's log does carry the text. The report's citation for this, `cluster.ts:105`, is the tmux session list. HELP.md:291 ("a 7-Zip warning is logged") tells the reader the warning itself is logged.
  - Failure scenario: an archive that 7-Zip extracts with status 1 is unpacked on this Mac. The log reads `unpack: 7-Zip warned (code 1) on x.zip` and `unpack: unpacked x.zip`, and the user cannot learn what the warning was without running 7-Zip by hand. The same archive unpacked on the cluster shows the text.
  - Verdict: ruling Z951 violated in part.
  - Fix at landing: inside the brief and small. One way is for `extract()` to keep the lines 7-Zip prints during `callMain` and, on code 1, say them under the `7-Zip warned` prefix.
  - Weight: low in practice. No archive found so far returns 1 on extraction; archive-level warnings come back as 0 (c10, c21).

#### 2. Proof

- `tools/oculus/.scratch/migration/agents/reviews/O45-report.md:54`, `:186-187`, `:192-193`, `:219`, `:225`: "| `routes.ts` plan row carries `folder` | DONE | `sources.test.ts` kaggle row passes (case 11) |", "| `src/lib/server/machine/runs/recover/unpack.ts` | 133 to 195 |", "| `local.ts` | 423 to 424 |", "| `tests/server/machine/runs/recover/sources.test.ts` | 613 to 622 | the kaggle row ...", "| `HELP.md` | 534 to 534 | line 289 |", "has a field that does not fit its kind", "Defect found in `unpack.ts`, older than the step and left unfixed".
  - What is wrong: the round appended its section but left these earlier sections as they were before the round. The rules file's "Where you work" and "Report" sections say every count, line count and `file:line` is taken after the last change.
  - The rerun gives other values:
    - unpack.ts is 204 lines, local.ts 429, safety.test.ts 741 and HELP.md 536.
    - `sources.test.ts` equals the base (`diff -q`, and `git diff` 0 lines), so it is no longer a changed file, and no test now proves item 4.
    - The finding text and the status defect are both changed.
  - Decisions resting on it: the landing's booking (the file list and the line counts) and the proof of item 4, which now holds by reading routes.ts:128-131 alone.
  - Failure scenario: the landing copies the Files table and books `sources.test.ts` as changed with stale counts, or reads item 4 as covered by a test that no longer checks the folder.
  - Verdict: none (item 4 holds by reading). Fixed at landing by booking from the rerun counts above.
- `O45-report.md:414`: "An archive entry that is a link now replaces a real folder of that name and its contents in the dataset folder (item 6). The ruling keeps this code."
  - What is wrong: no ruling covers this behaviour. `grep -n "replaces a real folder\|link in the target\|verbatimSymlinks\|folderAt"` over plan.md, choices.md, orchestrator-state.md and orchestrator-history.md prints nothing. Z951 is about 7-Zip's status, and ruling 178 is about the `folder` key.
  - The behaviour is real. The second item-6 run left `L -> B` in place of a real folder `L` and its `keep.txt`.
  - Decision resting on it: whether the landing raises this destructive replacement as a decision. The rules file's "No silent design decisions" names "a destructive action without confirmation" as a shape to report as a decision the orchestrator may reverse. The report names it, but presents it as already ruled.
  - Failure scenario: the landing reads "the ruling keeps this code", books nothing, and a user whose dataset folder holds a real folder at a name an archive gives as a link loses that folder's files on the next Unpack with no line in the log.
  - Verdict: none.

#### 3. Standards

- `src/lib/server/machine/runs/recover/unpack.ts:20-21` (head comment) and `:89-91`: "a status of 1, a warning, is said as the line `7-Zip warned (code 1) on <archive>`" and "const name = path.basename(file); if (code === 1) say('7-Zip warned (code 1) on ' + name); else if (code !== 0) throw new Error('7-Zip ended with code ' + code + ' on ' + name);".
  - What is wrong: `extract()` names the file of the pass it runs. On the tar pass of a two-pass archive that is the inner tar in the work folder, not the archive in the dataset folder. The cut.tar.gz run printed `unpack failed: 7-Zip ended with code 2 on cut.tar`. The head comment's `<archive>` is therefore false for every `.tar.gz`, `.tgz`, `.tar.bz2` and `.tar.xz`. This breaks the rules file's "What every package obeys": "A sentence in a document or a head comment that the change makes false is a defect of the change".
  - Failure scenario: a user reads `unpack: unpack failed: 7-Zip ended with code 2 on cut.tar` (or a warning line naming `abc.tar`) and looks in the dataset folder for a file that is not there. On this Mac the next line, `ended with code 1 on cut.tar.gz`, names the real file. On the cluster the job log has no such line.
  - Verdict: none.
  - Fix at landing: name `path.basename(archive)` in both lines, or the archive with its pass.
- `tools/oculus/HELP.md:290`: "A source can name a `folder` inside its archives: Unpack takes only that folder, and an archive without it is not unpacked."
  - What is wrong: the bullet no longer says where the folder's contents land. The first build's bullet said so ("its contents land in the archive's folder"). The rules file says HELP.md states what a user does, and "takes only that folder" reads as the folder being recreated with its path.
  - Failure scenario: a reader sets `folder: BraTS2020_TrainingData/MICCAI_BraTS2020_TrainingData` and expects `~/data/BraTS2020_train/BraTS2020_TrainingData/MICCAI_.../name_mapping.csv`. Raw-pls's places are pointed accordingly, and the reader finds `name_mapping.csv` at the top. The datasets form's help (data.yml:65) says it right.
  - Verdict: none.
  - Fix at landing: "Unpack takes only that folder's contents, placed in the archive's folder".

#### 4. Behaviour

- none. The round's visible changes are stated with their before and after under the report's "Item 6": status 2 or above places nothing, the `7-Zip warned` line reaches the log on this Mac, a link in the target is replaced, an archive link replaces a real folder, and an archive with any link 7-Zip calls dangerous now fails whole. The reruns above reproduce each one. The inner-tar name is under Standards 1.

### Declined to judge

- The two new rows' first run on the base (`expected [ 'A', 'set.zip' ] to deeply equal [ 'set.zip' ]`) was not rerun. Rerunning new tests against code without the change is a form the rules forbid to a reviewer ("No breakage testing"). By reading, the base passes five arguments and reads no status, so it places `A`, which agrees with the quoted line. Whether the rows would fail at the round-1 snapshot was judged by reading, not by a run.
- Whether 7-Zip 24 ever returns status 1 on extraction: this needs a read of 7-Zip's console exit-code paths, which is not in the tree. The runs here (a tar with PAX headers; a zip with data after its end, per the report) return 0 for archive-level warnings and 2 for data faults. The status-1 branch is judged by reading only.
- The number of `npm run test:quick` runs in the round and the absence of a whole-suite command were not verified: the builder's transcript is not open to the reviewer.
- `test:quick` ran over its 45 s limit here (77.7 s), as it did for the builder (63.0 s), with O44's suite on the same machine. Whether the step itself costs the time was not separated.
- Whether the new literal log line `7-Zip warned (code 1) on` falls under the rules file's catalog rule ("An error from the engine or a library is mapped to a catalog line before it is shown") is the user's call. The existing lines of `unpack.ts` and `local.ts` are literals, and the first review declined the same point.
- The copy across disks with `verbatimSymlinks: true` (the cluster's case) was not run, because this Mac has no second disk for the work folder.
- The landing items are the orchestrator's: the cluster's kagglehub validation copy deleted, a Recover Unpack of brats2020 on a scratch oculus, and the look at the datasets form.

Reviewer usage: aedda0027141497cb, claude-opus-5-5, 256,967 tokens, 69 tool uses, 14.9 min.

## Closed

First run (a3f117736221f4c68), each sent to the builder as repair round 1 and checked closed by the review over round 1:

- Spec 1 (ruling Z951 not built): closed in round 1; status 2 or above fails the archive and places nothing (the two G113 status rows, and the two.zip, slink.zip, etc.zip and cut.tar.gz runs). The part left open is round 1's Spec 1 below.
- Spec 2 (`sources.test.ts` changed without need): closed in round 1; the file equals the base (`diff -q`, `git diff` 0 lines).
- Proof 1 and Standards 1 (the outward-link row): closed in round 1; the row is gone, and the outward link fails on 7-Zip's status 2 with nothing placed (etc.zip run).
- Standards 2 (the HELP bullet's length): closed in round 1; `folder` has a bullet of its own (HELP.md:290). Its wording is round 1's Standards 2 below.
- Behaviour 1 and 2 (`source_left_out` wording; the link replacement's before and after): closed in round 1; findings.yml:256 reworded, and the before and after stated under the report's "Item 6".

Over round 1 (aedda0027141497cb), never sent to the builder; each fixed at landing on main, inside the brief:

- Spec 1 (the status-1 warning's own text dropped from this Mac's log): fixed at landing; `extract()` keeps the lines 7-Zip prints during `callMain` and, on status 1, says each under the `7-Zip warned` prefix, so `local.ts`'s filter passes them.
- Proof 1 (stale counts and rows in the report's earlier sections): fixed at landing; the booking takes the file list and line counts from the landing's own diff stat, and item 4 is booked as holding by reading `routes.ts:128-131`.
- Proof 2 (the report says a ruling keeps the link replacement; none does): closed with no open item. The base's `move()` already replaced whatever the target held at a name by the archive's entry at that name (`fs.rmSync(to, { recursive: true, force: true })`, `git show 2dd5c5968:tools/oculus/src/lib/server/machine/runs/recover/unpack.ts`, the `move` function), a real folder by a file included; the base followed an archive's link with `statSync` and merged into where it pointed, which is what G113 forbids. The step keeps the base's rule that the archive's entry wins at its name and applies it to a link as to a file. The booking states this, with no ruling claimed.
- Standards 1 (the inner tar named in place of the archive): fixed at landing; both lines of `extract()` name `path.basename(archive)`.
- Standards 2 (HELP.md:290 does not say where the folder's contents land): fixed at landing; the bullet says the folder's contents are placed in the archive's folder.
