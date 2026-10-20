# Step O45 brief check (on main at 7673eb2de)

The brief is `/Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/agents/briefs/O45.md`. Every command below was run from `/Users/axelfaes/workspace/research-hub` or its `tools/oculus`. Nothing was written. `git log --oneline -1` printed `7673eb2de Record the code layout ruling and book it as Next item 14 in the Linfoot README`. `git status --short` printed only the ledger files and the untracked briefs O44.md and O45.md.

## 1. Names

The command for each name:

`grep -rn --exclude-dir=node_modules --exclude-dir=.scratch -w "<name>" tools/oculus/src tools/oculus/tests tools/oculus/config tools/oculus/docs tools/oculus/DESIGN.md tools/oculus/HELP.md tools/oculus/README.md .oculus`

For `strip` I also ran `grep -rnE "strip[?]?:|\.strip\b|stripText|strip \?\?|..." src` and a `-w strip` grep over tests, config, docs, the three root pages and `.oculus`.

- `SourcePlace`: hits only at `model-entities.ts:520` and `:533` (`export type RecoverSource = SourcePlace &`). Both are inside the write list.
- `RecoverFile`: hits outside the write list:
  - `src/lib/data/model/index.ts:491` (the re-export) stays true.
  - `tests/server/machine/runs/recover/sources.test.ts:28,107,603` use `Partial<RecoverFile>` and `RecoverFile[]`. These stay true, because `folder` is optional.
  - `sources.test.ts:223` `{ name: 'images/picai_public_images_fold0.zip', unpack: { strip: 0 } }` stays true, since `routes.ts` adds `folder` only when the source names one.
  - `model-entities.ts:616` (`RecoverRow = RecoverFile & ...`) is in a file the step writes.
- `RecoverFile.unpack` readers: only `cluster.ts:373` and `local.ts:373`, both in the write list. No hit under `src/lib/views/`.
- `placeShape`: four other same-named local constants, all unrelated and unaffected:
  - `src/lib/server/content/latex/synctex.ts:36`
  - `src/lib/server/machine/lsp/wire.ts:29`
  - `src/lib/state/workbench/layout/saved/saved.ts:153`
  - `src/lib/state/sources/explorer/pdf-place.ts:74`
- `UNPACK_PROGRAM`, `UnpackInput`, `unpackVector`: hits only in `unpack.ts`, `cluster.ts:43,423`, `local.ts:37,368` and `safety.test.ts:39,40,525,527`. All are in the write list.
- `place()` of the program and the cluster job's `unpack()` line: only inside `unpack.ts:62-85` and `cluster.ts:366-373`. The test that reads the job line is `safety.test.ts:483` `{ action: 'unpack', line: /^unpack '/, want: [ODD, '2'] }`, in the write list.
- The key `folder`:
  - `.oculus/data/people/people.yml:15` and `docs/templates.md:821` (`{ field: folder, ... }`) belong to the people schema. They do not collide with the retrieval records.
  - `.oculus/data/research/data.yml:22` and `docs/templates.md:701` (`{ field: path, type: text, label: "Folder", ... }`) do collide: the same datasets form gets a second field that reads as "folder".
- The `strip` field and its descriptions:
  - `data.yml:64` and `templates.md:743`, help "How many leading folders of every path an archive holds the unpack drops." This becomes false for a source with `folder`, where strip counts below the folder. Both lines are inside the write ranges, but "What to build" does not ask for them to change.
  - `unpack.ts:3` head comment "every path the archive holds moved into the archive's folder with the source's `strip` leading folders dropped" becomes false with a folder. "What to build" asks only that the head comment "name the sixth argument".
  - `config/text/views/sources/data.yml:126` "Unpack the archives of every source marked unpack" stays true.
  - `docs/data-map.md` has no hit.

Findings:
1. `data.yml:64` and `docs/templates.md:743`, the `strip` help, become false for a source that names `folder`. The brief should say both are rewritten (for example "...of every path an archive holds, or of every path below `folder`, ...").
2. `unpack.ts:3`, the head comment's description of the move, becomes false. The brief should ask for it to be rewritten, not only extended with the sixth argument.
3. `data.yml:22` and `templates.md:701` label `path` "Folder". A retrieval field `folder` with no label puts two "Folder" fields in one datasets form. That is a collision with a configured key's label under the rules file's rule in "What every package obeys" ("Every id or key a step introduces is checked ... colliding with a configured or reserved key"). The brief should dictate a label for the new row (for example `label: "Folder in the archive"`) or say why none is needed.

## 2. The step line

The step line is `plan.md:627`.

- "a source's unpack can name a folder inside the archive whose contents become the dataset's `path` (the key `folder`), beside the strip count": served by "What must hold", the `model-entities.ts` item and the `unpack.ts` item. The brief widens "the dataset's `path`" to "the source's folder (`into`, else the dataset's folder)", which is consistent with `into`.
- "`SourcePlace` in `model-entities.ts`": the `model-entities.ts` item.
- "its schema and check": the `retrieval.ts` item, the `data.yml` field row and the `routes.ts` refusal item.
- "the plan's unpack line": the `routes.ts:159`, `files.ts:53`, `recover.svelte.ts:42`, `local.ts` and `cluster.ts` items.
- "`place()` in `unpack.ts`": the `unpack.ts` item.
- "tests": the G113 test item.
- "DESIGN and HELP": the `HELP.md` / `DESIGN.md:767` item.
- "brats2020's entry gets `folder: ...`": the `data.yml` item.
- "so a Recover unpack puts `name_mapping.csv` at the top of `~/data/BraTS2020_train` ..., with no change to raw-pls": no requirement or check. Case 11 stops at the plan rows, and cases 1 to 3 use a synthetic zip. Nothing checks the archive's real layout against the folder string.
- "the validation copy in the cluster's `~/.cache/kagglehub` deleted": the landing item, done by the orchestrator.
- "runs beside O44 (ruling 178) (ruling O44 and O45 in parallel)": the "What is on the tree" bullet about the Recover view and the shared paths `DESIGN.md` and `docs/diagrams/`.

Findings:
1. The step line's outcome (`name_mapping.csv` at the top of `~/data/BraTS2020_train`, nothing of the validation set) has no check. The layout `BraTS2020_TrainingData/MICCAI_BraTS2020_TrainingData/` holding `name_mapping.csv` is carried from closed item 178 and raw-pls comments (`build_cache.slurm:18` "has name_mapping.csv + case folders"), with no listing quoted. The brief should name a check that the folder string matches the archive. Two options:
   - The orchestrator quotes a listing of the cluster's kagglehub copy before dispatch (a plain `ls` on the login node, or an sbatch job if it lists the zip).
   - The landing runs Recover Unpack of brats2020 and reads the folder.

## 3. Premises

- Base copy at `.agents/worktrees/O45-base`: `ls .agents/worktrees/` printed `gate`, `O38-base`. It does not exist yet. That is the spec skill's order (the worktree and base are made after the brief check), so it is not a finding, but it must exist before dispatch.
- Ruling, `plan.md`: `grep -n "178" plan.md` printed `2276:- Open item 178 (2026-10-20): (a), a step of its own after O44, O45: ... (b), strip: 1 with raw-pls pointed one folder down, was the lazy option (the user).` Matches.
- `run_reg.sh:46`: `sed -n 40,50p projects/manuscripts/raw-pls/code/hpc/run_reg.sh` shows line 46 `tmpl=$(find -L "$raw" -maxdepth 2 -name "*_t1.nii*" 2>/dev/null | head -1)`. Matches. Its comment says `$raw` (`BraTS2020_train`) is a symlink on the cluster (see section 6).
- `model-entities.ts:515-520` and `:608`: the grep printed `:517` doc comment, `:520 type SourcePlace = { into?: string; unpack?: true; strip?: number };` and `:608 unpack?: { strip: number };`. Matches.
- `retrieval.ts:26-40`, head comment 6-8: `cat -n` shows countShape 26-33, placeShape 35-40, head comment 6-8. Matches.
- `routes.ts:159`: printed `...(source.unpack === true ? { unpack: { strip: source.strip ?? 0 } } : {}),`. Matches.
- `files.ts:53`: printed `unpack: z.object({ strip: z.number().int().min(0) }).optional(),`. Matches. The shape is `keptFileShape` of "the listing kept on disk (`<key>.list.json`)" (`files.ts:43`), not a plan (see Findings).
- `recover.svelte.ts:42`: printed `unpack: z.object({ strip: z.number() }).optional(),`. Matches.
- `unpack.ts`: `wc -l` printed 133.
  - `:22` is `const [pkg, archive, work, target, stripText] = process.argv.slice(-5);`.
  - `place` is at 62-72 and `UnpackInput` at 111.
  - `unpackVector` is 114-124 (113 is its doc comment). This matches within one line.
- `local.ts:368-374`: printed `:373 strip: row.unpack?.strip ?? 0`. Matches. The target is `dirname(archive)` (`local.ts:372`), the archive's own folder.
- `cluster.ts:366-373`: printed `:373 ...rows.map((row) => \`unpack ${shellWord(row.name)} ${row.unpack?.strip ?? 0} || exit 1\`)`. Partly matches: the strip is interpolated as a number, not through `shellWord`.
- `data.yml:62-64`, `templates.md:741-743`, `:758`, `apps.md:377`: `grep -n` printed `templates.md:741 ... field: into`, `:743 ... field: strip`, `:758 #        unpack: true ...` and `apps.md:377 ... into?, unpack?, strip? ...`. Matches.
- brats2020 at `data.yml:366-382`: `sed -n 360,385p` shows `key: brats2020` at 366, `path: "~/data/BraTS2020_train"`, `kind: kaggle`, `dataset: awsaf49/brats20-dataset-training-validation`, `unpack: true` at 382, no `strip`. Matches.
- Two `strip: 1` entries: `grep -n "strip:" data.yml` printed `172: strip: 1` and `545: strip: 1`. Matches.
- Tests: `grep -n "it(\|it.each\|describe(" safety.test.ts` printed describe at 481, vector test at 518, the unpack `it.each` at 536 with `{ tags: ['slow'], timeout: 90000 }` at 560. The file ends at 592. `plan.test.ts:248` printed `listed({ name: 'archive.zip', checksum: null, unpack: { strip: 1 } })`. Matches.
- G113, `guarded.md:317-319`: `sed -n 305,330p` shows G113's text, its Code line `local.ts, cluster.ts, unpack.ts, routes.ts` and its Test line `safety.test.ts, one table, a row per refusal and per argument vector`. Matches.
- Recover view: `grep -rn "strip" src/lib/views/sources/data/recover/` printed nothing (exit 1). Matches.
  - The claim "O44 ... may change that folder's Pane" has no support in O44's brief: `grep -n -i recover agents/briefs/O44.md` finds no Recover view file in its paths.
  - O44's brief says the reverse at its line 96: "O45 ... writes nothing under ... `src/lib/views/` but `src/lib/views/sources/data/recover/`". That contradicts the ruling (`plan.md:2277`) that O45 does not touch that folder.
- Verify list: `orchestrator-state.md` block `verify: - npm run test:quick`. Matches.
- No ADR folder: `ls docs/adr` printed `ls: docs/adr: No such file or directory`. Matches.

Findings:
1. `cluster.ts:373` passes the strip unquoted (a number); it does not go "through `shellWord`" as the premise at brief line 24 states. Brief line 42's "each value through `shellWord`" therefore asks for a change to the strip as well, which the brief should state as such.
2. Brief line 43 says a bad folder in the kept file is "refused as a name that climbs out is refused today". The premise is false.
   - Today a kept listing's name is not checked: `keptFileShape` has `name: z.string().min(1)` (`files.ts:45`).
   - `filesOf` returns `kept.files` directly when the recipe matches (`routes.ts:180-181`).
   - `safeName` runs only in `listFiles` on a fresh read (`routes.ts:144,151`) and in `dataPart` (`plan.ts:49`).
3. "Kept plan" (brief lines 20, 43, 46; case 8) names a file that is a listing: `<key>.list.json`, called "the listing kept on disk" at `files.ts:43,62`. The plan is computed per request by `planOf`. The brief should use the code's name.
4. O44's brief line 96 contradicts this brief's line 29 and the ruling at `plan.md:2277` about who touches `src/lib/views/sources/data/recover/`. This brief is right by the ruling, and O44's sentence needs correcting.

## 4. Cases and checks

- Case 1: consistent. A G113 placement row, like the existing row 'unpacks a zip into its folder, its first folder stripped'.
- Case 2: consistent. The expected result is right by `place()`: A has B, strip 1 drops B, giving `x.txt` and `sub/y.txt`.
- Case 3: consistent with G113 ("writes only inside").
- Case 4: the expected result is wrong. With `strip: 1` and no folder, `place()` (`unpack.ts:62-72`) handles the zip as follows:
  - It descends A and moves its child `B` to `target/B`.
  - It descends C and moves `z.txt` to `target/z.txt`.
  - The target therefore holds `B/` (with `x.txt`, `sub/y.txt`) and `z.txt`, not "`x.txt`, `sub/`, `z.txt`".
- Case 5: inconsistent with the test rule. The rules file's "What every package obeys" says "A test exists only as the test of one entry of `agents/guarded.md`".
  - The brief's line 67 makes case 5 a G113 row.
  - The trailing slash is dropped in `retrieval.ts`, which no guarded entry names (`grep -n "retrieval\|normalise-parts" agents/guarded.md` printed nothing).
  - `safety.test.ts` builds datasets with `datasetOf` (already-parsed sources), so a row there never runs `retrieval.ts`.
  - The test list at brief line 46 has no trailing-slash row.
- Case 6: the expected "the schema check names the field" cannot hold.
  - The schema check builds a JSON schema from the field rows: `valueSchema`'s default case at `src/lib/data/snapshot/schema/record.ts:187-190` gives a `text` field `{ type: TEXT_TYPES }`, with no pattern.
  - So `../up`, `/abs`, `A/../../up`, `A//B`, `A\B` and `''` all pass it once the dictated `type: text` row exists.
  - No other check reports a source that does not fit: `grep -rn "recover\|retrieval" src/lib/data/snapshot/validate*.ts src/lib/data/snapshot/schema/*.ts` printed nothing.
  - On the unchanged tree the case would pass for the wrong reason: `additionalProperties: false` (`record.ts:250`) names `folder` as undeclared. After the change it would fail.
- Case 7: the same. The `when` rows condition only on `kind`, and a `when` value is a word (`field.ts` `whenMapShape`, `record.ts:211` `enum`), so `when: { unpack: true }` cannot express "only with `unpack: true`". The schema check cannot name it.
- Case 8: inconsistent with "What to build".
  - If `files.ts`'s kept row applies the folder rule ("same rule as `retrieval.ts`", brief line 39), a kept listing with `../up` fails `keptShape`.
  - `readKept` then returns null (`files.ts:63-69`), and `filesOf` lists the sources again (`routes.ts:180-186`).
  - The result is a fresh listing, not "refused before any process starts". The `routes.ts` refusal of brief line 43 becomes unreachable code.
  - If instead `files.ts` takes any string, the refusal is reachable, but brief line 39 says otherwise.
- Case 9: consistent with G113. Its second half ("the unpack program receives it whole") is not exercised by the existing cluster-line row, which replaces the `unpack` function with a recorder (`safety.test.ts:508-510`). The function body's `"$NODE" ... "$2"` is never run.
- Case 10: a run the report quotes. Consistent, and needs no script (a `tar czf` in the scratchpad and a `node -e` of the program).
- Case 11: a run. Consistent.
- Case 12: a run. Consistent.
- The verify list:
  - Item 6 reads docs "against the standards pages' rules on list items and sentence length". The configured standards page is the rules file alone (`orchestrator-state.md`: `standards: [tools/oculus/.scratch/migration/agents/spec.md]`). It has no rule on sentence length; the only list rule is "A step writes what a user does into HELP.md as short bullets".
  - The report part "The terms: each term of `docs/glossary.md`" (brief line 144) names a missing file: `ls tools/oculus/docs/glossary.md` printed `No such file or directory`.
- Conventions, brief line 115: it names `LC_ALL=C grep -n '[^ -~]'`. The rules file's ASCII gate paragraph says the perl form "replaces the `grep '[^ -~]'` form wherever a brief or a check names it". The perl form covers `src tests bin config` only, so the grep is still needed for `HELP.md`, `DESIGN.md`, `docs/` and `data.yml`.
- Hub data, rules file last paragraph ("A brief may also name lines of hub text a builder rewords by hand, where a ruling of Axel's asks for the rewording; the report lists each line before and after"). The brief has the builder hand-edit `.oculus/data/research/data.yml`, but its Report section does not ask for the before-and-after list of those lines.

Findings:
1. Case 4's expected result is wrong. It should be `B/` (holding `x.txt`, `sub/y.txt`), `z.txt` and the zip.
2. Case 5 is assigned to G113's table, but its behaviour lives in `retrieval.ts`, which no guarded entry names, and no test item lists it. It should be a run the report quotes. Alternatively, the brief states which G113 unit drops the slash for a kept row.
3. Cases 6 and 7 expect the schema check to name the field, which it cannot do with a `type: text` row and kind-only `when`. Either the expected result is changed (left out, the card shows no Recover control, and nothing names the field, a silent result the user should rule on), or the schema check gains a way to state the rule. That second option is a schema-vocabulary shape for the user.
4. Case 8 contradicts the `files.ts` item. One of the two must change: the kept row applies the rule and case 8 expects a fresh listing; or the kept row takes any string and `routes.ts` refuses.
5. Case 9's "the unpack program receives it whole" has no check that reaches the `unpack()` function body.
6. Verify item 6 names rules the standards page does not hold, and the report part "The terms" names a missing `docs/glossary.md`.
7. Brief line 115 names the grep ASCII form that the rules file replaces with the perl gate. The brief should name the perl gate for `src tests config` and the grep for the docs and `data.yml`.
8. The Report section lacks the before-and-after list of the hand-edited `data.yml` lines that the rules file requires.

## 5. The question

The goal: a Recover unpack of brats2020 puts the training folder's contents at the top of `~/data/BraTS2020_train` and nothing of the validation folder, every other source is unchanged, and no value escapes the dataset's folder.

- Case 1: yes, it could pass without the goal. A `place()` that checks containment with `path.resolve` passes, while an archive whose folder entry is a symlink leads out of `<work>/out` and `move()` renames files from outside into the target.
- Case 2: no. It is not part of the goal and proves only the combination.
- Case 3: yes. On this Mac's case-insensitive disk, an `existsSync` test for the folder finds `a/b` in an archive holding `A/B`, while the cluster's disk does not. The row passes with a check that answers differently on the two targets.
- Case 4: yes, and it is wrong as written (section 4). It also covers a zip only; a no-folder `.tar.gz` (the two-pass path with the sixth argument empty) is not covered, so "every other source unchanged" is not shown for tar sources.
- Case 5: no, once it is a run.
- Cases 6 and 7: yes, as written. They pass on the unchanged tree (undeclared key) for a reason unrelated to the rule.
- Case 8: yes. With `files.ts` applying the rule, the outcome is a fresh listing, so a refusal row could be written only by making `files.ts` take any string.
- Case 9: yes. The recorder replaces the function, so a body that passes `$3` unquoted passes the row.
- Case 10: no.
- Case 11: yes. It checks the read and the plan rows. A folder string that does not match the real archive (a layout other than the one in item 178, or a typo) passes it.
- Case 12: yes. An equal count of Recover-run sets does not show that every other source reads the same (a changed `strip` or `into` value keeps the count). Comparing each other entry's `retrieval` array before and after would show it.
- The step line's outcome: yes, no check reaches it (section 2, finding 1).
- Verify item 1 (`test:quick`): yes. The unpack rows are tagged slow and are left out of it.
- Verify item 2: yes, for the symlink, letter-case and real-layout points above.
- Verify item 3 (the strip grep): yes. It is a coverage aid, not a behaviour check.
- Verify item 4 (YAML parses): yes, trivially.
- Verify item 5 (unused exports): yes. It is not about the goal.
- Verify item 6: cannot be applied as written (section 4).
- "What to build", item by item:
  - `model-entities.ts`, `routes.ts:159`, `local.ts`, `cluster.ts`: yes. They are types and plumbing proved only by the rows above.
  - `retrieval.ts`: no, given case 11 as a run.
  - `files.ts` and `recover.svelte.ts`: yes. See case 8.
  - `unpack.ts`: yes. "Resolve the joined path and check it is inside" read as `path.resolve` does not follow links, so a symlinked folder entry escapes. The check needs `fs.realpathSync` of the folder against `fs.realpathSync(<work>/out)`, or `lstat` of each segment.
  - `routes.ts` refusal: yes. It is unreachable if `files.ts` applies the rule.
  - `data.yml` and docs: yes. They are text.
  - Tests: see the cases.

Findings:
1. `unpack.ts` item: "resolve the joined path" should say real path (`fs.realpathSync`) or a per-segment `lstat`, so a folder entry that is a link cannot lead out.
2. Case 3: the folder lookup must compare exact names (for example `readdirSync` per segment), so this Mac and the cluster give one answer.
3. Case 11 and the step line: add the archive-layout check (section 2).
4. Case 12: compare each other entry's `retrieval` before and after, not only the count.
5. Cases 4, 6, 7, 8 and 9 as above.

## 6. Implied inputs

This is a code step.

- An archive whose folder entry, or a segment above it, is a symbolic link: missing.
  - Expected: the program says a failure line naming the folder, moves nothing, and reads nothing outside `realpath(<work>/out)`.
  - The existing `place()` also follows links with `statSync` below the folder (`unpack.ts:66`). The new walk inherits that hazard unless the brief says the walk below the folder uses `lstat`.
- A folder name differing only in letter case (`a/b` against `A/B`): missing.
  - Expected: the same failure on both targets ("the archive holds no folder a/b"), from an exact name comparison.
- Two archives of one source: missing.
  - Expected: each archive is placed from its own folder. An archive lacking the folder fails with the line, and the run stops there: `local.ts` calls `finished` on a non-zero code, and the cluster job has `|| exit 1`. Archives after it are not unpacked, and the log names the archive (`unpack: ended with code 1 on <name>`).
- A rerun of Unpack over a folder that already holds the files: missing.
  - Expected: `move()` merges folders and replaces files (`unpack.ts:46-59`), the archive stays, and the result equals the first run's.
- A source with `into` and `folder`: missing.
  - Expected: the folder's contents land at `<path>/<into>/`, next to the archive.
  - Note: the program's target is the archive's own folder (`local.ts:372` `target: dirname(archive)`; `cluster.ts:368` `$(cd "$(dirname -- "$1")" && pwd)`). For a source whose listed names hold subfolders (`sources.test.ts:223` `images/picai_public_images_fold0.zip`), that is not "the source's folder". "What must hold" and the dictated help text should say "the archive's folder".
- A folder path that is a file in the archive (`folder: A/B/x.txt`): named in "What to build" ("missing or is not a folder") but not a case.
  - Expected: the failure line, nothing moved, the archive kept.
- A folder present in the archive but empty: missing.
  - Expected: by decision 2's reason (a dataset folder that looks unpacked), the brief should say whether this fails or succeeds with nothing moved.
- `folder: .` and `folder: ./A`: missing from case 6 although the rule names `.`.
  - Expected: left out like case 6.
- A numeric `folder` value in YAML (`folder: 2020`): missing.
  - Expected: read as text, as `into` is (`wordShape`, `retrieval.ts:15`), or not fit. The brief should say which.
- A kept listing of brats2020 written before the change: missing.
  - Expected: the recipe key is `JSON.stringify(entry.retrieval)` (`routes.ts:178`), so adding `folder` makes the kept listing stale and the sources are listed again. Nothing to build, but it is worth a run.
- A `.tar.gz` source without `folder` (the sixth argument empty on the two-pass path): missing.
  - Expected: as today.
- The cluster's dataset folder being a symbolic link: missing, and it bears on the landing item.
  - `run_reg.sh:46`'s comment says "-L follows the $raw symlink (BraTS2020_train)".
  - `run_all.sh:28`'s hint says "symlink its MICCAI_BraTS2020_TrainingData there".
  - So `~/data/BraTS2020_train` on the cluster is likely a link into `~/.cache/kagglehub`.
  - Expected: the landing deletion of the validation copy reads where the link points first, so it removes `BraTS2020_ValidationData` only, and a later Recover Fetch and Unpack write through the link into the cache folder. This was not verified (no ssh).

Findings:
1. Missing from "Cases": the symlinked folder entry; the letter-case pair; two archives of one source; the rerun; `into` with `folder`; a folder that is a file; an empty folder; `.` and `./A`; a numeric folder; a no-folder `.tar.gz`; the cluster's linked dataset folder (for the landing item).

## 7. ADRs

`ls tools/oculus/docs/adr` printed `ls: docs/adr: No such file or directory`, and `.agents/plan.yaml` holds no `adr` key (`grep -n "adr" .agents/plan.yaml` printed nothing). There is no record.

Findings: none.

## 8. Dictated text

- "A folder inside each archive whose contents become the source's folder; the unpack takes nothing else of the archive, and strip counts below it." Found by `grep -n "whose contents become the source" agents/briefs/O45.md`, which printed line 44. It is ASCII, has no dash and no "not X but Y". Two problems:
  - "the source's folder" is a phrase no other help row defines: `into`'s help says "A folder below the dataset's folder that the source's files land in", and the program's target is the archive's folder (section 6).
  - "whose contents become the source's folder" says contents become a folder, where they land in it.
  - This breaks the rules file's "Prose" line under "The working rules that bind every package" ("name the actual ... file").
  - Suggested wording: "A folder inside each archive; the unpack takes only its contents, which land in the archive's folder, and strip counts below it."
  - The same text is dictated for `docs/templates.md`.
- "unpack failed: the archive holds no folder <folder>" (and its log form "unpack: unpack failed: the archive holds no folder A/Q"). Found by `grep -n "holds no folder" agents/briefs/O45.md`, which printed lines 40, 46 and 54. It holds against the prose rules and matches the program's existing literal log lines (`unpack.ts:86,91`). See "Declined to judge" for the catalog rule.
- Brief line 45 dictates content, not words: the HELP bullet "says a source can name `folder`, the one folder of each archive the unpack takes" (`grep -n "the one folder of each archive"` printed 45), and the DESIGN reason. Holds.

Findings:
1. The `folder` help text uses "the source's folder" (undefined, and not where the code puts the files) and "contents become ... folder". It should be reworded as above, in `data.yml` and `templates.md` alike.

## Declined to judge

- Whether the program's log lines, the dictated failure line included, fall under the rules file's catalog rule ("An error from the engine or a library is mapped to a catalog line before it is shown"). The existing `unpack.ts` lines are literals shown in the Recover view's log, and DESIGN.md:767 calls the log "the record". The choice between keeping log lines literal and putting them in a catalog is the user's.
- The Kaggle archive's real layout and the cluster's `~/data/BraTS2020_train` link target. Both need a read of the cluster, which this check may not make.
- Whether 7z-wasm 1.2.0 creates symbolic links from zip or tar entries under NODEFS. This decides how likely the symlink input is, not whether the check is needed. Settling it needs a run with a crafted archive.

Agent usage: a92a012d7cdd1da10, claude-opus-5-5, 219,601 tokens, 56 tool uses, 9.6 min.

## Closed

Each finding is closed in `agents/briefs/O45.md` as follows.

- 1.1 The strip help: the `strip` row's help in `data.yml` and `templates.md` is rewritten to count below `folder` when one is given.
- 1.2 The head comment: `unpack.ts:1-12` is rewritten to the folder, the strip below it and the six arguments.
- 1.3 Two "Folder" fields: the new row has `label: "Folder in the archive"`.
- 2.1 The archive's layout: read on the cluster's login node with `ls` and recorded under "What is on the tree" (369 training cases, `name_mapping.csv`, `survival_info.csv` in `~/data/BraTS2020_train`, a real folder; the kagglehub copy holds only the validation folder); the landing also runs a Recover Unpack of brats2020 on a scratch copy and reads the folder.
- 3.1 The cluster strip: the strip stays an unquoted number, the name and the folder go through `shellWord`.
- 3.2 and 3.3 The kept listing: the brief names it the kept listing (`<key>.list.json`), states that its `name` is not checked today, and drops the `routes.ts` refusal; the kept row applies the folder rule, so a bad kept folder gives a fresh listing.
- 3.4 O44's sentence: O44's brief now says O45 writes nothing under `src/lib/ui/` or `src/lib/views/`.
- 4.1 Case 4: `B/` (with `x.txt` and `sub/y.txt`), `z.txt` and the zip.
- 4.2 Case 5: a run of the read.
- 4.3 Cases 6 and 7: a source left out is a finding through `validate-kinds.ts`, as `resourceFaults` is, with one line of `config/text/findings.yml` naming the dataset and the source; the schema vocabulary is not changed (decision 4).
- 4.4 Case 8: the program refuses `../up`, `/abs` and `A/../../up` itself (a G113 row); a kept listing with such a folder reads as none and is listed again.
- 4.5 Case 9: the job line is a G113 row, and the function's quoted `"$3"` is checked by reading `cluster.ts`.
- 4.6 Verify item 6 and the glossary: the prose check refers to the rules file's prose rules, and the report part on `docs/glossary.md` is replaced by the before-and-after list of `data.yml` lines.
- 4.7 The ASCII check: the perl gate for `src tests config`, the grep for `HELP.md`, `DESIGN.md`, `docs/` and `data.yml`.
- 4.8 The hand-edited `data.yml` lines: listed before and after in the report.
- 5.1 Links: the folder is found segment by segment with `lstatSync`, a link refused, and its real path checked inside `realpath(<work>/out)`; the walk below it uses `lstatSync`.
- 5.2 Letter case: exact names through `readdirSync`, case 13.
- 5.3 Case 11 and the step line: as 2.1.
- 5.4 Case 12: each entry's `retrieval` and `recover` compared before and after.
- 6.1 Implied inputs: cases 13 to 22 (letter case, a link entry, two archives, a rerun, `into` with `folder`, a folder that is a file, an empty folder, a numeric folder, a no-folder tar.gz, a stale kept listing), and `.` and `./A` in case 6. The cluster's dataset folder is a real folder, not a link (`ls -ld`, `readlink` empty), so the landing deletion touches only the kagglehub validation copy.
- 8.1 The help text: "A folder inside each archive; the unpack takes only its contents, which land in the archive's folder, and strip counts below it." "What must hold" says the archive's folder.
