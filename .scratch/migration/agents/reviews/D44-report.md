NOT DONE: everything. D44 is stopped at the first run of the cases, before any change to the tree, because case 22 gives a different result from the one the brief states. Nothing is built; the worktree holds no change (the only file written is this one).

## Open items of the state file

`orchestrator-state.md:129-131`: the section holds no entry (it reads only the heading and the sentence "An entry leaves this list for the closed log the moment Axel rules on it...").

## The case the brief's rule gets wrong: 22 (second half)

Rule (brief, Cases 22): "a deeper missing path (`~/projects/q/code` with no `~/projects/q`): `copy-failed` with rsync's line, `sbatch` not run. Checked by the rsync vector run with a local target folder in the builder's scratchpad."

Result on this machine's rsync (`/usr/bin/rsync`, openrsync, "protocol version 29, rsync version 2.6.9 compatible"), the brief's vector with a local target in place of `<host>:<folder>/`, the file list on standard input, `projects/p` present and `projects/q` absent:

```
printf 'a.txt\0' | rsync -a -0 --files-from=- --timeout=60 -e ssh ./ ../dst/x/y/z/   -> exit=0, ../dst/x/y/z/a.txt exists (x, y, z all missing before)
case 22 deeper path missing (projects/q absent): exit=0 stderr=            (cluster/projects/q/code holds data.csv hpc main.py pkg)
case 22 last level (projects/p/code) missing, projects/p there: exit=0 stderr=
```

openrsync creates every missing level of a destination (`man rsync`: the destination "must be a directory and is created if not found"; it has no `--mkpath`, `rsync --help` lists none). So the check the brief prescribes cannot produce `copy-failed` for a deeper missing path here. The receiving end of the real copy is the cluster's rsync, which the builder cannot run; what it does for a deeper missing folder is not verified. The second half of case 22 therefore has no check that fails the way the brief says. Ruling needed: (a) keep the code as the brief builds it (a non-zero rsync exit is `copy-failed`, no assumption about depth) and case 22's second half is reported as "not verified, the receiving rsync decides" and read at the look on the cluster; (b) change the rule so Submit never depends on the receiver: that needs a remote `mkdir -p` the brief's "only remote processes" sentence excludes, so it is the orchestrator's decision. Recommendation: (a); the lazy option is dropping the second half of the case unmentioned.

## The cases' first run (unchanged tree)

Scripts: `proto/rule.mjs`, `proto/first.mjs`, `proto/case6.mjs` in the session scratchpad `d44/`; fixtures under `d44/fx`; output saved in `d44/first-run.txt` and `d44/case6.txt`. Git runs only inside the fixtures in that folder (the brief's `git init` fixture), and no ssh, remote rsync or sbatch ran: the one ssh program used is a recording script (`d44/fx2/fakessh`) that exits 255.

| Case | Check and output on the unchanged tree |
|---|---|
| 1 | Remote command built to the brief's section 3: `cd ~/'projects/ward/code' && sbatch --parsable 'hpc/ward_tcn.slurm'` (as the brief states). The scratch rule on `ward_tcn.slurm`: `{"named":true,"unread":[]}`. The plan itself: `submit.ts` does not exist (`ls src/lib/server/machine/hpc/submit.ts` prints "No such file or directory"). |
| 2 | `node rule.mjs` on `btfno/code/hpc/job.slurm`: `{"named":false,"unread":["env/bin/activate"]}`. The confirm does not exist (`grep -ci slurm` over `BarActions.svelte`, `ask-perform.ts`, `Source.svelte` prints 0, 0, 0). |
| 3 | No confirm and no `submit` request exist on the unchanged tree; `POST {"action":"submit","plan":{},"confirm":true}` with the token answers `400 {"error":"bad action or id"}`. |
| 4 | `plan` is not an action: `POST {"action":"plan","root":"r","path":"a.slurm"}` answers `400 {"error":"bad action or id"}`; `no-project` does not exist. |
| 5 | Same: `outside-code` does not exist. The rule's real-path test on the fixtures is case 23. |
| 6 | `hpcRouteHost` over the merged config of the tree (`loadConfig`, `local.yml` not read) and a hub with five resources: `absent` -> `{"host":"","missing":"absent names no resource"}`; `laptop` -> `laptop is not a cluster`; `nohost` -> `the cluster nohost has no host`; `bad` -> `the host of the cluster bad is not a usable ssh alias`; `utwente` -> `{"host":"utwente"}`; `""` -> `{"host":"utwente"}`; no snapshot -> `the resources registry is not read yet`; the `slurm` key absent -> `{"host":"utwente"}`. As the brief states. |
| 7 | Not runnable before the code: `transfer.ts` does not exist. The vector against a recording fake ssh: `rsync(36638): error: unexpected end of file`, exit 255, the fake received `-o ConnectTimeout=8 -o BatchMode=yes -o ControlMaster=no -o ControlPath=none fakehost rsync --server -g -l -o -p -D -t --relative --dirs . ~/projects/p/`, so `-e "<program> <options>"` is split on spaces by openrsync as the brief says. |
| 8 | Not runnable before the code (no `runSubmit`). |
| 9 | Not runnable before the code; no real ssh is run by the builder. |
| 10 | Disabled control and `busy` do not exist; `submitState` is not in the tree (`grep -rniE "submitState\|hpcSubmits" src tests` prints nothing). |
| 11 | Remote command for a script with a space: `cd ~/'projects/p' && sbatch --parsable 'hpc/a b.slurm'`. The vector run from a code folder under `my hub/` copied `hpc/a b.slurm`, `main.py`, `data.csv`, `pkg/results/keep.py`; exit 0. `~/projects/p` and `~/a b` against the cluster-folder rule: `~/projects/p` holds, `~/a b` refused. |
| 12 | `changed` does not exist (the `submit` action answers 400 as in case 3). |
| 13 | Fixture with `git init`: `git ls-files -z --cached --others --exclude-standard` listed `.gitignore data.csv gone.py hpc/a b.slurm hpc/ignored.slurm logs/l.out main.py pkg/__pycache__/m.pyc pkg/results/keep.py results/r.csv tracked.npy`; after the brief's drops the kept list is `.gitignore data.csv hpc/a b.slurm hpc/ignored.slurm main.py pkg/results/keep.py`: `gone.py` (tracked, deleted on disk) is left out. The fixture did not gitignore `hpc/ignored.slurm`, so it is listed; a gitignored script is absent from the git list by `--exclude-standard`, which is the `not-sent` test. `keptFiles` does not exist yet. |
| 14 | Same list: `results/r.csv`, `logs/l.out`, `pkg/__pycache__/m.pyc`, `a.npy`, `sub/b.npy`, `tracked.npy` are not kept; `venv/bin/python`, `weights.pt`, `untracked-ignored.pt` (git-ignored) are not listed. `pkg/results/keep.py` (a nested `results`) is kept, since only the first segment is tested. |
| 15 | Existing gate: a wrong token answers `403 {"error":"forbidden"}`. `unconfirmed` does not exist. |
| 16 | No Submit control, no palette entry on any tab (case 2's grep: 0 hits of "slurm" in the three source-tab files). The extension rule is lowercase `.slurm`; not runnable before the code. |
| 17 | The press and the save-first flow do not exist (`submit-job.svelte.ts` is not in the tree). |
| 18 | `jobOf` as the brief states it: `12345;utwente` -> `12345`; empty stdout -> `""` (`no-job-id`). |
| 19 | The look is the orchestrator's (Z539 (a)). Not run by the builder. |
| 20 | The rule as the brief words it (`~/` or `/`, then segments of `[A-Za-z0-9._-]`, no `.` or `..` segment, no trailing slash): `~/projects/ward/code` holds; `/home/u/p` holds; `~/projects/../x` refused; `projects/x` refused; `~/a//b` refused; `~/a/` refused; `~/a b` refused; `~/a;rm` refused. As the brief states. |
| 21 | `{}`, `{"action":"bogus"}` and `{"action":"plan"}` with the token each answer `400 {"error":"bad action or id"}`. |
| 22 | First half (last level missing): exit 0, the folder is created, files arrive. Second half (deeper path missing): exit 0, the folder is created. The brief's expectation (`copy-failed`) does not reproduce: see the section above. |
| 23 | Fixture `hpc/link.slurm` linking to a file outside `code/`: real path outside `code/` (under-code test false). A `code/` linking to a folder outside the project folder: real path outside the project (false). As the brief states; a link inside `code/` to a file inside it resolves to a real path under `code/`. |
| 24 | A 5 MiB untracked, not ignored `data.csv`: listed and kept; the sum of the kept files' `lstat` sizes is 5242936 bytes (5.00 MiB), which the confirm's size line states. |
| 25 | The state's `close()` and the abort do not exist; `ssh.ts`'s `run` takes no `AbortSignal` (`sed -n 1,60p ssh.ts`, signature `run(host, remote, timeoutMs)`). |
| 26 | `~/projects/my p` against the rule: refused (`bad-cluster`). As the brief states. |

Section 2's scratch rule, run over the 177 scripts with the brief's eight cluster folders (`node rule.mjs <worktree> slurm-list.txt`, `slurm-list.txt` of `find projects side-projects -name '*.slurm'`, 177 lines): `names it 99 warned 78`, per project `{"linfoot-estimator":[32,0],"glassbox-decision-pipelines":[13,0],"hccnet-fl":[0,8],"engram":[3,1],"btfno":[0,14],"bttn-incident-af":[0,3],"covert-applied":[0,6],"ecg-readable-substrate":[5,1],"hccnet-revision":[21,13],"raw-pls":[1,31],"ward-bttr-crosssubject":[24,1]}`, the brief's numbers. The eight rows: `ward_tcn.slurm` named, unread `[]`; `ecg-readable-substrate .../run_cpu.slurm` named, `[]`; `patient_figures.slurm` named, `[]`; `glassbox .../run_cpu.slurm` named, `[]`; `engram/code/slurm/train.slurm` named, `["\"$CODE/slurm/env_guard.sh\""]`; `btfno/code/hpc/job.slurm` warned, `["env/bin/activate"]`; `sweep_struct.slurm` warned, `[]`; `bttn-incident-af/code/hpc/job.slurm` warned, `[]`. Identical to the brief's table.

## Base copy

`.agents/worktrees/D44-base` does not exist (`ls /Users/axelfaes/workspace/research-hub/.agents/worktrees` lists `A3 D37-base D42-base D44 gate H3-base S5-base X3f-base`). The builder copied the unchanged worktree's `src tests utils config docs`, `HELP.md DESIGN.md README.md package.json package-lock.json` (without `local.yml`) to the session scratchpad `d44/base/tools/oculus` and `diff -rq` of its `src` and `tests` against the worktree prints nothing; `sh utils/unused-exports.sh` on the unchanged tree is saved as `d44/unused-base.txt` (382 lines). The final report's file table and unused-exports comparison use these.

## Full-list runs

0.
