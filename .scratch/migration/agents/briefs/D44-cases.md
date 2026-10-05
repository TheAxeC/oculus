# D44: the cases ruling, round 0

The builder's first run (`agents/reviews/D44-report.md`) handed back one case the brief's rules get wrong. The ruling below stays inside the step's scope; nothing else in the brief changes.

## Case 22, second half

What the first run showed: this machine's rsync is openrsync (`/usr/bin/rsync`, protocol 29, "rsync version 2.6.9 compatible"). With the brief's vector and a local target it creates every missing level of the target, so a deeper missing folder gives exit 0 and the files arrive. The check the brief prescribed cannot give `copy-failed` here. The receiving rsync on the cluster decides whether a deeper missing folder fails, and the code does not depend on which it does.

Ruling (a): the code stays as the brief builds it. A non-zero exit of the copy is `copy-failed` with rsync's last stderr line, and `sbatch` is not run, whatever the depth of the missing folder. The case is checked in two parts:

- The first half (the last level missing, rsync creates it, the copy and the submit run) is checked as the brief says, by the rsync vector run with a local target folder in the builder's scratchpad.
- The second half is checked by a test in `tests/server/machine/hpc/submit.test.ts`: the injected copy runner exits 23 with the line `rsync: [Receiver] mkdir "/home/u/projects/q/code" failed: No such file or directory (2)` on stderr, the outcome is `copy-failed` carrying that line, and the injected `sbatch` runner was never called. Quote its failure on the unchanged tree (the module does not exist yet) and its pass after.

Not chosen: (b), a remote `mkdir -p` before the copy, which adds a remote process the brief's "only remote processes" sentence excludes. The lazy option was dropping the second half of the case without a check.

## The base copy

`.agents/worktrees/D44-base/tools/oculus/` now exists, unpacked from `git archive 6044d753c` as `D44.md:13` says, and `.agents/worktrees/D44-base/unused-exports.txt` holds 379 lines (`sh utils/unused-exports.sh` on main, whose `src`, `tests`, `utils` and `config` equal the base: `git diff --quiet 6044d753c HEAD -- ...` exits 0). Verify 6 compares with that file, never with the copy in your scratchpad (382 lines).
