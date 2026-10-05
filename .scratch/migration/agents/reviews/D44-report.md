NOT DONE: the checks the brief assigns to the look (case 19, the real ward and btfno plans at the confirm) and case 9 against a real unreachable host, none of which a builder may run. All 14 rulings of repair round 1 are built and each has its row. The last run of the verify list in round 1 (run 4) was red on one line in a file this step does not change (`tests/server/edit/feeds.test.ts`, a 5000 ms timeout under load; rerun alone it prints `Tests  6 passed (6)`); eslint, svelte-check, prettier, the ASCII gate and every other vitest file were green in that run, and the list was not rerun, as the round's rule says.

## Open items of the state file

`orchestrator-state.md:157-161`: the section holds no entry (the heading and the sentence "An entry leaves this list for the closed log the moment Axel rules on it...").

## Open for a decision

None. The copy-failed line is decided by ruling 1 of repair round 1 (the first stderr line that begins `ssh:`, else the last non-empty line); see "Repair round 1".

## Case 22, the ruling carried

Ruling (a): the code stays as the brief builds it (a non-zero copy exit is `copy-failed` with the stderr line ruling 1 of repair round 1 picks (the receiver's line here), `sbatch` not run, whatever the depth); no remote `mkdir`. First half (last level missing): the vector run with a local target. Second half: the row "answers copy-failed with the receiver's line when a deeper cluster folder is missing" of the table 'the run of a confirmed plan' in `tests/server/machine/hpc/submit.test.ts`; the injected copy runner exits 23 with stderr `rsync: [Receiver] mkdir "/home/u/projects/q/code" failed: No such file or directory (2)`, the answer is `copy-failed` with that line as `detail`, and the injected `sbatch` runner is called 0 times (`expect(ssh).toHaveBeenCalledTimes(0)`).

- First half, run through the module's own `copy` and `copyVector`, local target `<tmp>/projects/p/` absent: `case 22: local target, last level missing: code=0 copied=true`.
- Second half on the unchanged tree (the base copy's `src` and `tests` with the new test file added, `npx vitest run tests/server/machine/hpc/submit.test.ts`): `Error: Cannot find module '../../../../src/lib/server/machine/hpc/submit.ts' imported from .../submit.test.ts`, `Test Files  1 failed (1)`, `Tests  no tests`.
- Second half on a scratch copy with the check that makes it true removed (`if (copied.code !== 0)` made `if (copied.code !== 0 && false)` in `submit.ts`): `FAIL ... 'answers copy-failed with the receiver's line when a deeper cluster folder is missing'`, `AssertionError: expected { status: 'ok', job: '12345' } to deeply equal { status: 'refused', ...(2) }` (the row for rsync's last line fails the same way, 2 failed | 21 passed).
- On the tree as built: `Test Files  1 passed (1)`, `Tests  23 passed (23)`.

## The cases' first run (unchanged tree) and the run after the change

Output saved in the session scratchpad `d44/` (`first-run.txt`, `cases-after.txt`, `flow.txt`, `case16.txt`, `case6.txt`). The after-runs are `vitest` runs of scratch files that are not kept, over the real planner, runner, route and page flow with recording runners and fixtures under the temporary directory; the file `after-server.test.ts` ran in a copy of the worktree. Git runs only inside those fixtures. No ssh, remote rsync or sbatch ran.

| Case | Unchanged tree | After the change |
|---|---|---|
| 1 | The remote command built by hand to the brief: `cd ~/'projects/ward/code' && sbatch --parsable 'hpc/ward_tcn.slurm'`; the scratch rule named. `submit.ts` did not exist. | `ward_tcn.slurm` copied from the hub into a fixture with `paths.cluster: ~/projects/ward/code`: `{"target":"utwente:~/projects/ward/code/","remote":"cd ~/'projects/ward/code' && sbatch --parsable 'hpc/ward_tcn.slurm'","scratch":{"named":true,"unread":[]},"files":28}`. |
| 2 | `btfno` `job.slurm` through the prototype rule: `{"named":false,"unread":["env/bin/activate"]}`; no confirm existed. | Plan of a copy of `btfno/code/hpc/job.slurm`: `{"named":false,"unread":["env/bin/activate"]}`. The confirm from the page flow: message `This job script never names /local/$SLURM_JOB_ID, the per-job scratch folder of the cluster. Not read: env/bin/activate. Copy the code of p to utwente and submit p/code/a.slurm?`, yes `Submit Anyway`. |
| 3 | No confirm and no `submit` request; the route answered 400. | `case 3: cancelled -> asking=null planSubmit calls=1 submitJob calls=0 openView calls=0`. |
| 4 | `plan` was no action (400). | `{"status":"refused","reason":"no-project"}` for a root that is no project, and with no snapshot rows. Nothing ran. |
| 5 | Same. | `{"status":"refused","reason":"outside-code"}` for `projects/p/outside.slurm`. |
| 6 | `hpcRouteHost` over the merged config: the four sentences as the brief states. | `plan` through the route's host resolver: `absent names no resource`, `laptop is not a cluster`, `the cluster nohost has no host`, each as `{"status":"refused","reason":"no-host","detail":...}`. The fourth (a host that is no ssh alias) is the resolver's, run in the first run (`the host of the cluster bad is not a usable ssh alias`) and not changed by this step. |
| 7 | Not runnable before the code. The vector against a fake ssh: exit 255, `rsync(36638): error: unexpected end of file`; openrsync split `-e` on spaces as the brief says. | Injected copy exits 255 with ssh's line first and `rsync: connection unexpectedly closed` last: `{"status":"refused","reason":"copy-failed","detail":"rsync: connection unexpectedly closed"} ssh calls=0 keys held=0`. Exit 23 is the table row 'answers copy-failed with rsync's last line when rsync exits 23, and runs no sbatch'. The program missing, `PATH=/nonexistent`: `case 7b: rsync program missing: code=1 stderr=spawn rsync ENOENT`, which `execute` reads as `copy-failed`. The line shown is rsync's last, see "Open for a decision". |
| 8 | Not runnable. | `{"status":"refused","reason":"submit-failed","detail":"sbatch: error: Batch job submission failed: Invalid partition name specified"} refresh calls=0`. |
| 9 | Not runnable; no real ssh. | Not verified against a real unreachable host. The options passed are `ConnectTimeout=8` and rsync's `--timeout=60` (`copyVector`); the fake-ssh run above shows rsync returning at once when ssh fails with 255. |
| 10 | Not in the tree. | The page: `case 10: busy while planning=true planSubmit calls after second press=1` and `busy after=false`; the control draws `disabled=""` while `submitting` (`<button type="button" class="tool svelte-dvnwrf compact bare" aria-label="Submit Job" disabled="">`). The server: table row 'refuses a second run of the same host and folder as busy and calls nothing for it'. Another project's key is a different `<host>:<folder>` and is not held. |
| 11 | The command and the vector over a folder named `my hub`: exit 0, files copied. | Plan under `my hub/p/code`: `"remote":"cd ~/'projects/p' && sbatch --parsable 'hpc/a b.slurm'"`, `source` `.../my hub/p/code/`, vector with `./` and `utwente:~/projects/p/`. `paths.cluster: ~/a b`: `{"status":"refused","reason":"bad-cluster","detail":"~/a b"}`; the snapshot finding is the `findings.validate.bad_cluster` sentence (`tests/data` suites in the verify list pass). |
| 12 | `changed` did not exist. | `{"status":"refused","reason":"changed"} copies=0`; the next plan after: `files=2`. The page: `said=["","Copying the code and submitting the job...","The files or the commands changed since the question was asked; press Submit Job again."] openView calls=0`. Table rows: host, target, remote and files differing. |
| 13 | The git list as the brief states. | Gitignored script: `{"status":"refused","reason":"not-sent"}`. A tracked file deleted on disk: `files=2` (the script and `main.py`), the copy plans. |
| 14 | The list as the brief states. | `files=3 (.gitignore, hpc/a.slurm, keep.py)` for a code folder holding `results/r.csv`, `logs/l.out`, `pkg/__pycache__/m.pyc`, `a.npy`, ignored `venv/` and `w.pt`. |
| 15 | Wrong token 403 (existing gate). | `token=wrong -> 403 {"error":"forbidden"}`; a `submit` without `confirm`: `200 {"status":"refused","reason":"unconfirmed"}`; the table rows 'refuses a press with no confirm' and 'refuses a confirm that is the string "true"'. |
| 16 | No control, no palette entry. | `BarActions submittable=true: Submit Job label drawn=true`, `submittable=false: ... drawn=false`; `isJobScript: a.slurm=true JOB.SLURM=true a.sh=false (empty)=false b.slurm.txt=false`; palette `["oculus.save","oculus.revert","oculus.toggleWordWrap","oculus.submit"]` with `submittable=true` and without `oculus.submit` with `false`. A tab at HEAD or in the index has `onDisk` false (`status/tab-file.svelte.ts`), so `submittable` is false there; an untitled tab has an empty path. |
| 17 | Not in the tree. | `case 17: unsaved -> save calls=1 planSubmit calls=1 asking=true`; `save refused (still unsaved) -> save calls=1 planSubmit calls=0 asking=null`. The save's own refusal line is the one `Source.svelte` already draws under the editor. |
| 18 | `jobOf` by hand: `12345`, empty to `""`. | `job: {"status":"ok","job":"12345"}`; `empty: {"status":"refused","reason":"no-job-id","detail":""}`. |
| 19 | The look. | The page half: `confirm="Submit"`, `said=["","Copying the code and submitting the job...","Submitted batch job 12345"] submitJob calls=1 openView=[["hpc"]]`. The copy reaching the cluster, the poll listing the job and its log are the orchestrator's look (ruled Z539 (a)); not verified here. |
| 20 | The eight values as the brief states. | `~/projects/ward/code=holds /home/u/p=holds ~/projects/../x=refused projects/x=refused ~/a//b=refused ~/a/=refused ~/a b=refused ~/a;rm=refused`. |
| 21 | 400 for `{}`, an unknown action and `plan` without root. | The same three bodies on the route as built: `400 {"error":"bad action or id"}` each. |
| 22 | See above. | See above. |
| 23 | Real paths by hand, as the brief states. | A link to a file outside the served root: `{"status":"refused","reason":"outside"}` (the root-path resolver refuses it first), and the page says "This script is outside the folders oculus serves."; `code/` linked to another project's `code/` (P1b) or to a hub folder in no project (P1c): `outside-code`, with no copy and no ssh; a link inside `code/` to a file inside it plans as `cd ~/'projects/p' && sbatch --parsable 'hpc/a.slurm'`. Rows in `tests/server/machine/hpc/submit.test.ts`; see "Repair round 1", rulings 3 and 5. |
| 24 | 5 MiB `data.csv` listed, 5242936 bytes. | `files=2 bytes=5242919` (the script and `data.csv`), the confirm line `Sends {0} files ({1} in all).`. |
| 25 | `close()` and the abort did not exist. | Recording runners holding until aborted: close during the copy `{"status":"refused","reason":"copy-failed","detail":"rsync error: received SIGTERM"} ssh calls=0 keys=0`; close during `sbatch` `{"status":"refused","reason":"submit-failed","detail":"aborted"} keys=0`; a copy that ends ok after the close `{"status":"refused","reason":"submit-failed","detail":"aborted"} ssh calls=0`. Real children (a fake `rsync` and `ssh` on `PATH` that sleep 30): `real rsync child aborted: code=1 after 204 ms`, `real ssh child aborted: aborted after 201 ms`, already-aborted signal `aborted`. In flight the child gets SIGTERM and SIGKILL after `KILL_GRACE_MS`; after the close no `sbatch` starts; the key is released in `finally`. |
| 26 | Refused as the brief states. | `{"status":"refused","reason":"bad-cluster","detail":"~/projects/my p"}`, `copies` not called. |

## DONE / NOT DONE

| Check | Result | Output |
|---|---|---|
| Verify 1, the list | Run 2 green; run 3 red on one unchanged file | Run 2 (after `npm run diagrams`): `ok prettier`, `ok ASCII gate`, `ok svelte-kit sync`, `ok vitest (84.2 s)`, `ok svelte-check (82.5 s): ... 373 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok eslint (89.9 s)`, `test:quick: 92.7 s (limit 45.0 s); every command passed`, `checks: 1 commands passed`. Run 3, after the last catalog sentence (`submit_detail_remote`) changed: `ok prettier`, `ok ASCII gate`, `ok svelte-kit sync`, `ok eslint (5.5 s)`, `ok svelte-check (22.9 s): ... 373 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `FAILED vitest (37.8 s)`: `FAIL |unit| tests/server/edit/feeds.test.ts > Lit Watch writes > adds a Lit Watch entry ...`, `Error: Test timed out in 5000ms`, `Tests  1 failed \| 312 passed \| 22 skipped (335)`, `checks: 1 of 1 commands failed`. The file is identical to the base copy's (`diff -q` prints nothing); rerun alone: `Test Files  1 passed (1)`, `Tests  6 passed (6)`. The list was not run a fourth time, as the rule says. Both runs were over the 45 s limit with other worktrees running (`test:quick: over the time limit`). |
| Verify 2 | Done | `npx vitest run tests/server/machine/hpc tests/routes/machine/hpc.test.ts tests/server/core/auth.test.ts tests/ui/tabs/tab-actions.client.test.ts tests/views/sources/bar-actions.test.ts`: `Test Files  6 passed (6)`, `Tests  45 passed (45)` (run again after the last change; `submit.test.ts` alone: `Tests  23 passed (23)`). |
| Verify 3 | Done | `"echo /local/$SLURM_JOB_ID\n"`; `npm run build` exit 0; `grep -rlE "(from \|import\()'sh-syntax'" build/server --include='*.js'` prints `build/server/chunks/chunks/submit.js-Cedmvz8v.js`. |
| Verify 4 | Done | The real `scratch.ts` over the 177 paths of `find projects side-projects -name '*.slurm'` with the eight cluster folders: `names it 99 warned 78`; per project `{"linfoot-estimator":[32,0],"glassbox-decision-pipelines":[13,0],"hccnet-fl":[0,8],"engram":[3,1],"btfno":[0,14],"bttn-incident-af":[0,3],"covert-applied":[0,6],"ecg-readable-substrate":[5,1],"hccnet-revision":[21,13],"raw-pls":[1,31],"ward-bttr-crosssubject":[24,1]}`; the eight rows of section 2 as the brief states them (`glassbox .../run_cpu.slurm {"named":true,"unread":[]}`, `engram .../train.slurm {"named":true,"unread":["\"$CODE/slurm/env_guard.sh\""]}`, `btfno .../job.slurm {"named":false,"unread":["env/bin/activate"]}`, `bttn-incident-af .../job.slurm {"named":false,"unread":[]}`, `ecg-readable-substrate .../run_cpu.slurm {"named":true,"unread":[]}`, `hccnet-revision .../patient_figures.slurm {"named":true,"unread":[]}`, `raw-pls .../sweep_struct.slurm {"named":false,"unread":[]}`, `ward-bttr-crosssubject .../ward_tcn.slurm {"named":true,"unread":[]}`). |
| Verify 5 | Done | The ASCII gate of `agents/spec.md:97` over `src tests config` prints nothing, exit 0 (`bin` does not exist in the worktree); `HELP.md` and `DESIGN.md` hold no byte outside ASCII (`LC_ALL=C grep -nP '[^\x20-\x7E]'` prints nothing). `sh utils/folder-check.sh` exit 0. `wc -l`: `Source.svelte` 514, `BarActions.svelte` 140, `LockedCode.svelte` 43, every other changed source file at most 863 (`validate.ts`), `model-sessions.ts` 876, `context.ts` 743. |
| Verify 6 | Done | `sh utils/unused-exports.sh` against `D44-base/unused-exports.txt`: `1c1 < Unused exports (255) --- > Unused exports (254)` and `92d91 < src/lib/server/machine/hpc/ssh.ts: KILL_GRACE_MS`. No line is added; `KILL_GRACE_MS` is now used by `transfer.ts`. The four new exports that appeared (`COPY_IDLE_S`, `CopyInput`, `SubmitReason`, `SubmitRefused`) are no longer exported. |
| Verify 7 | Done | Section "Mutations" below. |
| Verify 8 | Done | Reread against `agents/spec.md`'s prose rules: no em dash, no history word (`grep -nEi "previously\|used to\|no longer\|reverted\|formerly\|originally\|earlier\|D44\|step "` over the new files prints nothing). |
| Tree checks | Done | `npx vitest run tests/checks --testTimeout 0 --hookTimeout 0 --tagsFilter '!slow'`: `Test Files  15 passed \| 1 skipped (16)`, `Tests  226 passed \| 3 skipped (229)`. These are not in the list; they found a comment line over 100 columns, a `sentence(` local name read as a catalog call, and a view importing `data/model`, all fixed. |
| Type check, lint, format | Done | In the list: `svelte-check ... 0 ERRORS 0 WARNINGS`, `ok eslint`, `ok prettier`. |

Mutations (verify 7), each on a scratch copy of the worktree, `npx vitest run tests/server/machine/hpc/submit.test.ts`:

| Table | Change to the code | Failing line |
|---|---|---|
| run | the `isDeepStrictEqual` return in `attempt` removed | 4 failed \| 19 passed; `AssertionError: expected { status: 'ok', job: '12345' } to deeply equal { Object (status, reason) }` for the host, target, remote and files rows |
| run | the `request.confirm !== true` return removed | 2 failed \| 21 passed; `AssertionError: expected { status: 'ok', job: '12345' } to deeply equal { status: 'refused', ...(1) }` |
| run | the `submits.running.has(key)` return removed | 1 failed \| 22 passed; `'refuses a second run of the same host and folder as busy ...'`: `expected { status: 'ok', job: '12345' } to deeply equal { status: 'refused', reason: 'busy' }` |
| run | `copied.code !== 0` made `copied.code !== 0 && false` | 2 failed \| 21 passed, both copy-failed rows, including case 22's |
| scratch | `print(readFileSync(file, 'utf8'), { minify: true })` made `readFileSync(file, 'utf8')` | 2 failed \| 21 passed; `'does not count a comment that names it'`: `expected { named: true, unread: [] } to deeply equal { named: false, unread: [] }`, and the unparsed-script row |
| scratch | the push of a followed source removed | 3 failed \| 20 passed; `expected { named: false, unread: [] } to deeply equal { named: true, unread: [] }` |

On the unchanged tree the file fails as a whole: `Cannot find module '../../../../src/lib/server/machine/hpc/submit.ts'`.

## Number of full-list runs

3. Run 1 and run 2 printed `checks: 1 commands passed`. Run 3 printed `checks: 1 of 1 commands failed` on `tests/server/edit/feeds.test.ts`, which this step does not change and which passes alone.

## Files, from `diff -rq` against the base copy (`D44-base`: `src tests config utils`; the docs against main's checkout)

| Path | Lines | Note |
|---|---|---|
| `src/lib/server/machine/hpc/submit.ts` | 306 | new |
| `src/lib/server/machine/hpc/scratch.ts` | 145 | new |
| `src/lib/server/machine/hpc/transfer.ts` | 82 | new |
| `src/lib/server/machine/hpc/routes.ts` | 66 | |
| `src/lib/server/machine/hpc/ssh.ts` | 86 | |
| `src/lib/server/machine/pty/shell-word.ts` | 13 | |
| `src/routes/api/(machine)/hpc/+server.ts` | 43 | |
| `src/lib/server/core/git/files.ts`, `run.ts` | 135, 247 | |
| `src/lib/server/machine/processes/read.ts` | 124 | finds a project through `deepestHolding` of `src/lib/data/helpers/files/paths.ts` |
| `src/lib/server/root/context.ts` | 743 | |
| `src/lib/data/shapes/shapes.ts`, `src/lib/data/snapshot/validate.ts` | 300, 863 | |
| `src/lib/data/model/model-sessions.ts`, `src/lib/data/model/index.ts` | 876, 547 | outside the write list: the `SubmitPlan` type, the wire shape server and page share, belongs to `data/model` by the layer rules (a view may not import `data/model`, and the server may not import the page's module); `model-sessions.ts` was 859 lines on the base and is 876 now, under 880 |
| `src/lib/state/system/machine/hpc.svelte.ts` | 90 | |
| `src/lib/state/system/machine/submit.ts` | 83 | new, beside `hpc.svelte.ts` as the brief allows; re-exports `SubmitPlan` for the view |
| `src/lib/views/sources/source/Source.svelte` | 514 | split by concern, under 520 |
| `src/lib/views/sources/source/actions/BarActions.svelte`, `actions/submit-job.svelte.ts` | 140, 130 | the second new |
| `src/lib/views/sources/source/status/ask-perform.ts` | 114 | |
| `src/lib/views/sources/source/status/tab-file.svelte.ts` | 78 | new, named by the split: where the tab's file is and what that allows (`wholeFile`, `inRepo`, `onDisk`, `previewable`, `blameable`, `repoState`), taken out of `Source.svelte` |
| `src/lib/views/sources/source/save/LockedCode.svelte` | 43 | new, named by the split: the line saying why a file is read-only over the read-only code window |
| `src/lib/views/sources/source/save/locked-words.ts` | 17 | new, named by the split: the words of that line |
| `src/lib/views/sources/source/save/tab-save.svelte.ts` | 35 | new, named by the split: the tab's Save and the question an untitled text's first Save asks |
| `config/text/findings.yml`, `config/text/views/sources/source.yml`, `config/catalogs/manifest-schema.yml`, `glyphs.yml`, `icons.yml` | | |
| `tests/server/machine/hpc/submit.test.ts` | 317 | new |
| `tests/routes/machine/hpc.test.ts`, `tests/server/root/context-fixture.ts` | 47, 126 | inert stubs and the state, no assertion or title changed |
| `HELP.md` (lines 49 and 146), `DESIGN.md` (lines 128 and 135) | 352, 438 | |
| `package.json`, `package-lock.json` | | `"sh-syntax": "0.7.0"` and its lock entry only |
| `docs/diagrams/layers.{dot,svg}`, `layer-server`, `layer-state`, `layer-views` (each `.dot` and `.svg`) | | what `npm run diagrams` regenerates |
| `.scratch/migration/agents/reviews/D44-report.md` | | this file |

The split of `Source.svelte` keeps `src/lib/views/sources/source/` at ten items (`actions`, `Editor.svelte`, `Gutter.svelte`, `latex-editor.ts`, `read-again.ts`, `save`, `source-gutter.svelte.ts`, `Source.svelte`, `status`, `symbols.ts`); `sh utils/folder-check.sh` exits 0.

## Judgment calls the brief left open

- The confirm's remote line reads `Then runs on {0}: {1}` (`source.submit_detail_remote`), the host then the command as it is run (`cd ~/'projects/p' && sbatch --parsable 'a.slurm'`). The first wording wrapped the command in single quotes inside single quotes, which read as a different command than the one run.
- `copy` answers code 1 with `aborted` at once when its signal fires, as the ssh runner rejects at once, without waiting for the child's pipes to close. A fake `rsync` that spawned a grandchild held `close` for 30 s otherwise (`real rsync child aborted: code=1 after 30140 ms`; after: `after 204 ms`).
- `SubmitPlan` lives in `data/model` and is re-exported by `state/system/machine/submit.ts` for the view.
- The reason words `SubmitReason` and `SubmitRefused` are module-private types; the route answers strings.
- Splitting `Source.svelte`: the four concerns taken out are the file facts, the locked code window, its words and the tab's Save. Comments were not shortened and no code was compacted.
- The `Source.svelte` head comment names Submit Job beside the other actions and in the palette list.

## Host- or user-visible changes

- A `.slurm` source tab on disk under a served root: before, the breadcrumb bar's right end carried Save, Revert File, the star, Open in Program and Toggle Blame; now it also carries Submit Job (glyph `[>]`, icon `play`) before Toggle Blame. The palette lists `Slurm: Submit Job` while the tab applies. A tab at HEAD or in the index, an untitled tab and a `.sh` tab show neither; `JOB.SLURM` shows the control.
- The press saves unsaved text first, then asks one question: `Copy the code of {project} to {host} and submit {path}?`, with four detail lines (`Copies <source> to <target> with rsync <vector>`; `Sends N files (S in all).` or `Sends 1 file (S).`; `Then runs on <host>: <command>`; `The job then shows in Live HPC.`). A script that never names `/local/$SLURM_JOB_ID` gets `This job script never names /local/$SLURM_JOB_ID, the per-job scratch folder of the cluster.` first, then `Not read: <sources>.` when sources could not be followed, and the yes reads `Submit Anyway` in place of `Submit`.
- Under the editor the note reads, in turn, `Copying the code and submitting the job...` and `Submitted batch job <id>`, after which the Live HPC view is shown; a refusal reads its sentence (`source.submit_*`). While a flow is planning or running the control is disabled.
- State to put it in on TEST: a ward script (`hpc/ward_tcn.slurm`, no warning, target `~/projects/ward/code/`), the btfno `hpc/job.slurm` (warning, `Not read: env/bin/activate`, `Submit Anyway`), a `.slurm` in no project (`This file is in no project folder, so there is no code to send with it.`), a project whose `slurm.resource` resolves to no host (the resolver's sentence).
- A manifest `paths.cluster` that does not hold to the rule (a space, a `;`, a `..` segment, a trailing slash) is a finding on the Findings view (`findings.validate.bad_cluster`) and `bad-cluster` on a plan. The manifest-schema help of `paths` now says it also holds `cluster` (default `~/projects/<id>`).
- `GET`/`POST /api/hpc`: `plan` (`root`, `path`) and `submit` (`plan`, `confirm: true`) join `refresh`, `cancel` and `log`; refusals are 200 `{status:'refused', reason, detail?}`; a bad body is 400 `{error:'bad action or id'}`.

## Brief wrong or impossible

- Case 22, second half, as run on this machine: openrsync creates every missing level of a destination, so the check the brief prescribes did not produce `copy-failed`; ruled (a) and carried above.
- Case 23 and case 5: the brief expected `outside-code` for a link that leaves the code folder. A `.slurm` that links to a file outside the served root is refused as `outside` (the served-root resolver refuses it first), with its own sentence; a `code/` folder that links out of its project is `outside-code` (rows P1b and P1c), because the project is chosen from the path as asked and the real `code/` must lie inside that project's real folder. Both refuse and run nothing.
- Case 9 cannot be checked against a real unreachable host by a builder (no ssh); the row that stands for it is the table-1 row with exit 255, an `ssh:` line and rsync's `unexpected end of file` line, which answers `copy-failed` with the ssh line.
- `test:quick` finishes in 38 to 93 s here against the 45 s limit of `agents/spec.md:25` while other worktrees run.

## Manifest values

Each manifest gains these two lines, for the orchestrator to write at landing (none of the eight has a `paths:` key; `btfno`, `engram` and `hccnet-fl` keep the default `~/projects/<id>` and get nothing).

```
projects/manuscripts/ward-bttr-crosssubject/project.yml
paths:
  cluster: ~/projects/ward/code

projects/manuscripts/bttn-incident-af/project.yml
paths:
  cluster: ~/projects/afnet/code

projects/active/linfoot-estimator/project.yml
paths:
  cluster: ~/projects/linfoot-estimator/code

projects/manuscripts/ecg-readable-substrate/project.yml
paths:
  cluster: ~/projects/ecg-readable-substrate/code

projects/manuscripts/hccnet-revision/project.yml
paths:
  cluster: ~/projects/hccnet

projects/manuscripts/covert-applied/project.yml
paths:
  cluster: ~/projects/covert

projects/manuscripts/raw-pls/project.yml
paths:
  cluster: ~/projects/regfree-tensor-pls

projects/archive/published/2026/glassbox-decision-pipelines/project.yml
paths:
  cluster: ~/projects/glassbox-decision-pipelines/code
```

(`grep -c '^paths:'` over each of the eight files prints 0.)

## Doc text

`DESIGN.md:128`, the sentences that replace the false ones on what holds the read vectors (the file's whole line is `DESIGN.md:128`; these are its changed parts):

"Submit asks it for the files a project's code folder keeps (`ls-files -z --cached --others --exclude-standard`, `keptFiles`), tracked files and untracked files that are not ignored, which `server/machine/hpc/submit.ts` filters and sends. No writing subcommand appears in the module; `symbolic-ref`, `worktree`, `remote` and `config`, which have writing forms, and `rev-parse`, `check-ignore`, `ls-files`, `for-each-ref` and `check-attr` are held to their exact vectors in the source."

and, in the git-write part of the same line: "no form carries `--force`, `branch -D` after Delete Anyway's question is the one form that discards commits no other branch holds, and the list and the absence of `--force` are held in the source." No test pins either (`grep -rn "ls-files\|--force" tests` finds only fixtures that run git).

`DESIGN.md:135` gains a paragraph on Submit Job after the host sentence. `HELP.md:49` names Submit Job in the file tab's actions and in the palette's list, and `HELP.md:146` says the Live HPC view is where a submitted job shows.

G43's Test line (`agents/guarded.md:82`): "`tests/server/machine/hpc/submit.test.ts`, its two tables 'the run of a confirmed plan' and 'the scratch rule', written by D44." The file holds those two `describe` blocks and nothing else; the busy case is a row of the first table.

## Repair round 1

All 14 rulings of `briefs/D44-round1.md` are built in `.agents/worktrees/D44/tools/oculus` and each behaviour change has a row that was seen failing before the change. The failing output is in the scratchpad files `r1-submit-red.txt` and `r1-others-red.txt`; the lines are quoted below.

### Rulings

1. **Copy-failed line.** `copyFailureLine(stderr, fallback)` in `src/lib/server/machine/hpc/submit.ts` returns the first stderr line that begins `ssh:`, else the last non-empty line, one line only; `sbatch` failures keep the last line. New table-1 row 'answers copy-failed with the line ssh...' (exit 255, stderr `ssh: connect to host utwente port 22: Operation timed out` then `rsync(55985): error: unexpected end of file`): expects `copy-failed` with the ssh line and 0 ssh-runner calls. Before the change: `AssertionError: expected { status: 'refused', ...(2) } to deeply equal { status: 'refused', ...(2) }` with `+ "detail": "rsync(55985): error: unexpected end of file"`. With the ssh-line rule removed in a scratch copy: `Tests  1 failed | 28 passed (29)`. Case 22's row (receiver line only, exit 23) keeps its result.
2. **Confirm remote line.** No change: `config/text/views/sources/source.yml` keeps `submit_detail_remote: 'Then runs on {0}: {1}'`.
3. **A `code/` that links out of its project.** `asked(roots, input)` resolves the root's folder and joins the asked path, with no link followed in the path; `projectOf` picks the project with `deepestHolding` (see ruling 14) on that path; `compute` then requires the real `code/` to lie inside that project's real folder, else `outside-code`. Rows P1b (`projects/p/code` linked to `projects/q/code`) and P1c (linked to `loose/code`, a hub folder in no project) expect `outside-code`, `copies: 0`, `sshes: 0`; P1a keeps `outside-code`. Before: P1b answered `{ status: 'ok', job: '12345' }`, P1c answered `no-project`. With the choice made from the real path in a scratch copy: `Tests  2 failed | 27 passed (29)`, both `outside-code` rows.
4. **Close stops every run.** `submitState()` carries `closed` (set by `close()`); `attempt` refuses `closed` before it computes the plan (a request after close spawns no git) and again after the plan is computed and before the key is taken (`closedOf` in `submit.ts`). `src/lib/state/system/machine/submit.ts` maps `closed` to `source.submit_failed` explicitly. Rows: 'refuses closed when the state closes while the press computes its plan' and 'refuses closed for a press that comes after the state closed', each with `copies: 0`, `sshes: 0`; the second also asserts the file lister was called 0 times. Before: both answered `{ status: 'ok', job: '12345' }`. With the check after the plan removed: `Tests  1 failed | 28 passed (29)`, the 'while the press computes' row. With the check before the plan removed: `Tests  1 failed | 28 passed (29)`, `expected "vi.fn()" to not be called at all, but actually been called 1 times`. The state test row for `closed` fails with `expected 'failed' to be 'closed'` when the entry is removed.
5. **`outside` has its own sentence.** `source.submit_outside` is "This script is outside the folders oculus serves."; `SENTENCES.outside` in `state/system/machine/submit.ts` maps it. Rows: the submit table's 'refuses outside when the script links ...' (case 23's link that leaves the root) and the state test's `outside` row. Before: `AssertionError: expected 'Submit failed.' to be 'This script is outside the folders oc...'`; with the entry removed in a scratch copy: `Tests  1 failed | 4 passed (5)`.
6. **Tone.** `SourceNote.svelte` takes `tone: SaidTone` (`save/said-tone.ts`, `'refusal' | 'status'`) from the caller, never from the words. A refusal is `<span class="refused" role="alert">`; a progress or success line is `<span class="said" role="status">` in ordinary text colour. `save/tab-said.svelte.ts` (`createSaid`) holds the words and the tone; `actions/submit-job.svelte.ts` says the clear, progress and done lines as `'status'` and each refusal as `'refusal'`. Rows: `tests/views/sources/source-note.test.ts` (role and class per tone) and `tests/views/sources/submit-job.client.test.ts` (the told lines with their tones for success, plan refusal and run refusal). Before: three flow rows got tone `none` (`expected [ [ '', 'none' ], [ ...(2) ], [ ...(2) ] ] to deeply equal [ Array(3) ]`) and the note row failed with `expected '<!--[--><div class="note svelte-186y9...' to match /<span class="[^"]*\bsaid\b[^"]*"...`; `Tests  5 failed | 5 passed (10)`. With the progress tone changed to `'refusal'` in a scratch copy, 2 flow rows fail; with the note ignoring the tone, the status row fails.
7. **`said` comments.** The head comment of `SourceNote.svelte`, the prop comment, the head comment of `Source.svelte` (lines 41 to 52) and its CSS comment at line 512 now say the row carries what the tab said: an alert for a refused first Save, LaTeX action or Submit, a status for Submit's progress and success lines.
8. **Unsaved test.** `Source.svelte:260` reads `unsaved: () => sourceDirty(instance.id)` with `sourceDirty` from the store (`state/sessions/source.svelte.ts:270`). `wc -l src/lib/views/sources/source/Source.svelte` prints 520; the `save` alias is gone (`save: () => tabSave.save()`).
9. **`DESIGN.md:128`.** The two sentences now say the vectors are held by the list in the head comment of `run.ts` and the list in that paragraph, read at review, and that no test pins them.
10. **`DESIGN.md:135`.** The paragraph names both writes the cluster receives: Live HPC's cancel (`scancel <id>`, `server/machine/hpc/actions.ts`) and Submit Job (`server/machine/hpc/submit.ts`); it also states the `closed` refusal and the one-line copy failure.
11. **`ssh.ts:16`.** The `SSH_OPTIONS` comment paragraph is rewrapped whole at 100 columns (`sed -n 13,21p src/lib/server/machine/hpc/ssh.ts`); the comment-width check passes.
12. **Slow table.** The tables of `submit.test.ts` get an injected `kept` that lists the fixture folder from disk (`listed` in `tests/server/machine/hpc/submit-world.ts`); no row starts git. The rows about which files are kept (ignored files left out, results, logs, caches and `.npy` files, a tracked file deleted on disk, case 24's 5 MB untracked `data.csv` count, a gitignored script giving `not-sent`) are in `tests/server/machine/hpc/submit-files.test.ts` on real git with `isolateGit()`, tagged `@module-tag slow`. Times, from `npx vitest run <file>`: `submit.test.ts` 29 tests, `tests 917ms`, `Duration 4.32s`; `submit-files.test.ts` 4 tests, `tests 507ms`, `Duration 2.51s` (per test in the first verbose run: 254, 190, 144 and 355 ms). `tests/tiers/quick.mjs` lists the slow file as `changed, run by npm run test:checks or test:slow`.
13. **Case 11 evidence.** `tests/data/snapshot/cluster-folder.test.ts` (7 rows, projects built with `buildPortfolio`): `paths: { cluster: "~/a b" }` gives a finding with key `paths.cluster` and `findings.validate.bad_cluster` naming the manifest file, and the project stays listed; the other rows are a semicolon, a folder that climbs out, no `~/` or `/`, a value that is no text, the code folder written from the home folder, and an absolute folder (no finding). With the call of `checkClusterFolder` removed from `validate.ts` in a scratch copy: `Failed Tests 5` (the space, semicolon, climbing, no-prefix and no-text rows).
14. **Report additions.** The sections below.

### Paragraphs and head comments of the brief's list

| Place | State |
|---|---|
| `DESIGN.md:128` (Git) | rewritten (ruling 9; the `ls-files` form with `--cached --others --exclude-standard` is in the list) |
| `DESIGN.md:135` (Live HPC) | rewritten (ruling 10) |
| `HELP.md:49` (a file tab's actions) | rewritten for Submit Job; still true after round 1 (`sed -n 49p HELP.md` names the confirm, the warning and the Live HPC opening) |
| `HELP.md:146` (the `hpc` row) | rewritten: "it is where a job queued by Submit Job shows" |
| `server/machine/hpc/routes.ts` | rewritten (plan and submit, 200 refusals, 400 for a bad body) |
| `routes/api/(machine)/hpc/+server.ts` | rewritten (Submit named) |
| `server/machine/hpc/ssh.ts` | rewritten (the options every ssh of the folder is given, the copy's included) |
| `server/core/git/run.ts` | rewritten (the `ls-files --cached --others --exclude-standard` vector and Submit's file list) |
| `server/core/git/files.ts` | rewritten (`keptFiles`) |
| `state/system/machine/hpc.svelte.ts` | rewritten (the two requests of Submit) |
| `views/sources/source/Source.svelte` | rewritten (Submit Job, and the row under the editor for refusals and status lines) |
| `actions/BarActions.svelte` | rewritten (Submit Job row) |
| `status/ask-perform.ts` | rewritten (Slurm: Submit Job) |
| `server/machine/processes/read.ts` | still true: only the import and the project lookup changed, and the head comment lines are the same as the base's |
| `server/machine/pty/shell-word.ts` | rewritten (the ssh remote line goes through `shellWord`) |
| `data/snapshot/normalise.ts` | still true: its head comment lists what reaches the wire and names no `paths` key, and `diff` against the base is empty |
| `data/snapshot/validate.ts` | rewritten (`paths.cluster` and `checkClusterFolder`) |
| `config/catalogs/manifest-schema.yml:73` | rewritten (the `paths` help names `cluster`) |
| `README.md` | still true: `cmp` against main's checkout prints nothing; it names no HPC or slurm |

### Grep of each changed name

`grep -rnE '\bOPTIONS\b' src tests config HELP.md DESIGN.md README.md docs --exclude=local.yml` prints nothing; `SSH_OPTIONS` is declared at `ssh.ts:23` and used at `ssh.ts:56`, `transfer.ts:8` (comment), `transfer.ts:15` and `transfer.ts:39`, and `SSH_PROGRAM` at `ssh.ts:35`, `ssh.ts:56`, `transfer.ts:15` and `transfer.ts:39`.

`projectOf`: the server's former `projectOf` of `read.ts` is gone. The remaining `projectOf` names are `submit.ts:145` (the project of an asked path, declared there and called at `submit.ts:203`) and the unrelated page selectors (`state/life/present.svelte.ts`, `state/client/selectors.svelte.ts`, `state/forms/manifest-draft.ts`, their views and tests), which are not this name's old meaning.

`deepestHolding`: one definition, `src/lib/data/helpers/files/paths.ts:56`, taking `(items, dirOf, target)`. Its callers in the server are `read.ts` (after `realPath(folderOf(pid), true)`) and `submit.ts:156` (on the asked path); in the page `state/workbench/navigation/status.ts`, `state/sessions/terminal/commands.svelte.ts`, `state/sources/explorer/view/tab-roots.ts` and `state/sources/repositories/file-git.ts`. No helper of this name exists under `src/lib/server/`; `grep -rn deepestHeld src tests` prints nothing.

`HpcTarget`: declared at `routes.ts:11` as `SubmitDeps & {...}`, used at `routes.ts:26` and in `tests/routes/machine/hpc.test.ts:5` and `:8`. Nothing else names it.

### Reuse grep before each new helper (run over the base copy, `D44-base/tools/oculus`)

- `copyFailureLine`, `lastLine`: `grep -rnE 'copyFailureLine|function lastLine|const lastLine' src tests` finds `src/lib/server/edit/entry-edit/lines.ts:342: export function lastLineOf(source: string, node: YAMLMap)` (a YAML node's line number) and `tests/tiers/run.mjs:78: export function lastLine(output)` (a test runner script); neither reads a stderr line, so the helper is new and lives beside `lastLine` of `submit.ts`.
- `closedOf`, `closed`: the hits are a pty sink comment, config group lists and `CommandOutcome` of the palette; none is a state closed by `close()`.
- `createSaid`, `SaidTone`, tone: no hit in the base.
- the disk lister `listed` for tests: `grep -rnE 'function listed|function walk|recursive: true' src tests` finds `src/lib/server/transcripts/stores.ts:82: function walk(folder, found, cutoff)` (transcript files with a cutoff), `listedWithComment` of the editor gutter, and `mkdirSync(..., { recursive: true })` calls; none lists a fixture folder's files relative to it.
- `asked`: the hits are unrelated local variables.
- the project choice: `grep -rnE 'function deepestHolding|function deepestHeld' src tests` finds `data/helpers/files/paths.ts:56`, which is reused (no copy in `server/core/paths.ts`).

### Empty, duplicated or colliding

- `paths.cluster`: a value that is empty (`cluster:` reads as `null`), no text, `~/`, `/`, or has a segment that climbs out fails `clusterFolder` (`null` for `""`, `"~/"`, `"/"`, `undefined`, `null`, `7` and `["a"]`, measured with `node -e` over `src/lib/data/shapes/shapes.ts`): `validate.ts` gives the finding `paths.cluster` and Submit refuses `bad-cluster` with the written value as detail. A key given twice in one manifest makes the YAML not parse (`readYamlMap` returns null with `does not parse: Map keys must be unique`, measured on a scratch manifest), so the project has that finding and Submit refuses `bad-cluster` with that message. Two projects that write the same `paths.cluster` have the same run key `<host>:<folder>`: the second run is refused `busy` while the first is held (row 'refuses a second run of the same host and folder as busy').
- `oculus.submit`: one definition (`ask-perform.ts:70`, `grep -rn "oculus.submit" src tests config --exclude=local.yml` prints that line only), listed only while the tab applies, so it cannot be listed twice.
- `submit_job`: one entry in `config/catalogs/glyphs.yml:21` and one in `config/catalogs/icons.yml:20`.
- The `plan` and `submit` actions: `routes.ts:34` and `:39`, distinct from `refresh`, `cancel` and `log`. A `plan` without a string `root` and `path` is the 400 `bad action or id` (`routes.ts:36`); a `submit` whose `plan` is no map or lacks a string `root` and `path` is the same 400 (`routes.ts:40-42`); an empty `confirm` is `unconfirmed`. A second press while a run holds the key is `busy`; a press after `close()` is `closed`; a plan that differs from the recomputed plan is `changed`. These routes are read in the code and exercised by the table rows above except the 400 bodies, which have no test row.

### History-word grep

Run over the lines this step added or changed (`added.py` diff of `src`, `tests`, `config` against the base, comment lines and test titles, `tests/checks` excluded) for `before`, `used to`, `no longer`, `still`, `always has been`, `always had`, `as before`, `previously`, `the step adds`, `after this package lands`, `the rest of the list in agents/spec.md:42`. Hits, each judged:

- `core/paths.ts`, `routes.ts`, `transfer.ts` (two), `scratch.ts` (one), `submit.ts` ("The checks before the copy"), tests ("before Submit", "asked for before the change", "closed before the press"): `before` names an order inside one run, not an earlier state of the code. Kept.
- `scratch.ts` ("A word that still holds a `$`") is reworded to "A word left holding a `$`"; `state/system/machine/submit.ts` and its test ("a server that gains a word ... still says something") are reworded to "a word only the server has says that Submit failed". No `still` remains.
- No hit for the other words.

### Full-list runs in this round

4. Run 1: red on `eslint` (`Source.svelte`, `unbound-method`) and `svelte-check` (two type errors in test files this round added), both fixed. Run 2: `checks: 1 commands passed`. Run 3: red on `eslint` (`submit.ts`, `no-unnecessary-condition`), fixed and rerun alone with eslint and the table (`Tests  29 passed (29)`). Run 4, the last:

```
ok      prettier (2.3 s): All matched files use Prettier code style!
ok      ASCII gate (2.5 s)
ok      svelte-kit sync (4.2 s)
ok      eslint (30.0 s)
ok      svelte-check (38.8 s): 1791217936631 COMPLETED 373 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
FAILED  vitest (101.2 s)
 FAIL  |unit| tests/server/edit/feeds.test.ts > Lit Watch writes > adds a Lit Watch entry in the order given and refuses one whose title or address is in the file
Error: Test timed out in 5000ms.
 Test Files  1 failed | 77 passed | 4 skipped (82)
      Tests  1 failed | 333 passed | 22 skipped (356)
test:quick: 104.3 s (limit 45.0 s); failed: vitest
checks: failed with exit 1: npm run test:quick
checks: 1 of 1 commands failed
```

The file is not changed by this step (`cmp` of the test and of `src/lib/server/edit/feeds.ts` against the base prints nothing); run alone, `npx vitest run tests/server/edit/feeds.test.ts` prints `Test Files  1 passed (1)`, `Tests  6 passed (6)`. Per the round's rule the list was not rerun for it. `test:quick` took 104 to 123 s against the 45 s limit of `agents/spec.md:25` while three other builders ran on this machine; run 2 took 48.2 s.

### Other checks of the round (not in the list)

- Tree checks after the last source edit: `npx vitest run tests/checks --testTimeout 0 --hookTimeout 0 --tagsFilter '!slow'` prints `Test Files  15 passed | 1 skipped (16)` and `Tests  226 passed | 3 skipped (229)`.
- `sh utils/unused-exports.sh` against `D44-base/unused-exports.txt`: `Unused exports (255)` becomes `(254)`, the one line gone is `src/lib/server/machine/hpc/ssh.ts: KILL_GRACE_MS`; no line is added.
- `sh utils/folder-check.sh` exits 0; the ASCII gate and prettier are in the list and passed.
- Not verified: the page in a browser (the look is the coordinator's), the real `rsync` against an unreachable host, and the 400 bodies of `plan` and `submit` (no test row).
