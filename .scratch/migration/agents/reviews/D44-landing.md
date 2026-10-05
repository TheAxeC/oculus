# D44 landing

Position: roadmap entry oculus/migration (the cockpit-to-oculus migration); D44, Submit on a `.slurm` file, landed. Next: A3 (scheduled Update runs) in its repair round 2; D45 (LaTeX as VS Code's LaTeX Workshop) is no longer waiting on D44.

## Open items (verbatim)

- Ordo's pinned skills: the brief template's three breakage-run lines are removed in Ordo's source (ordo 5c299c0), while `~/.local/share/ordo-stable` is still pinned at `v2.8.0`; (a) tag `v2.8.1` on 5c299c0 and run `utils/pin.sh v2.8.1`, which changes the skills of every session, Ordo's own plan session included (recommended); (b) wait for Ordo's next release, the lazy one.

## Not done

- The look did not take the btfno and ward confirms (the permission check refused the press on btfno's real script; Z551, not retried) nor a refusal's sentence and its alert tone (no `.slurm` file in the hub sits outside a `code/` folder). btfno's warning is covered by `submit.test.ts`'s fixture row and by the reviewer's read of all 177 scripts.
- `bench: []`, so no A/B.

## The check of Steps 1

D44's builder a95c739803eb0fe23 and its reviewers had ended; the agent listing showed none of them running.

## What landed

From base 6044d753c, 52 files (+2102 -220, `git diff --cached --shortstat`), and engram's `code/hpc/oculus_submit_check.slurm` (Z539): Submit Job on a `.slurm` file under a project's `code/`, from the source tab's title-bar control and the palette. The server computes the plan (the files git keeps minus `__pycache__`, `.npy`, `results/` and `logs/`; the cluster folder from `paths.cluster` or `~/projects/<id>`; the rsync vector; the one remote `cd <folder> && sbatch --parsable <script>`; the `/local/$SLURM_JOB_ID` warning read through `sh-syntax`), shows it in a confirm, computes it again at the press and runs it only when equal (G43); `paths.cluster` is held to `clusterFolder` with its finding (G15).

Fixes at landing, 4:
- DESIGN.md:128: the git write forms are held by the head comment of `server/git/git-write.ts` and the paragraph, read at review.
- DESIGN.md:135: `copy-failed` carries one line of rsync's stderr, `submit-failed` sbatch's.
- `submit.ts:36`: the comment on the refusal words.
- The head comment of `data/helpers/files/paths.ts` names its two server readers (`processes/read.ts`, `hpc/submit.ts`).

Rulings: Z564 and Z565 in automode (D44's tests named under G43 and G15, `keptFiles` in G43's Code line); Z566 (a) by Axel: the three tests outside any entry deleted.

## Verification

In `.agents/worktrees/gate` with D44's landing patch applied, `npm run diagrams && npm run test:landing`: ASCII gate, format:check, lint, test:checks, and check then build ok; `test:slow` failed on vite's dependency-cache rename race (`ENOENT ... rename .../deps___vitest__`) and `npm test` on `feeds.test.ts`'s 5 s timeout, each while the others ran. Rerun alone: `test:slow` exit 0 (`Test Files 24 passed | 101 skipped (125)`, `Tests 69 passed | 617 skipped (686)`); `npm test` exit 0 (`Test Files 92 passed | 17 skipped (109)`, `Tests 391 passed | 66 skipped (457)`). Main's 52 staged files are byte-equal to the gate's (`cmp`). `utils/unused-exports.sh`: 254 lines against the base's 255.

## The look (TEST, localhost:8790)

Case 19: the confirm for `projects/ideas/engram/code/hpc/oculus_submit_check.slurm` showed the rsync to `utwente:~/projects/engram/`, 83 files (569 KB), the `sbatch --parsable` command and no scratch warning. Submit gave "Submitted batch job 614140" in the status tone (`role="status"`, class `said`); Live HPC showed 1 pending. `sacct -j 614140`: COMPLETED on main-cpu in 1 s; its log reads `spark-head1` and `2026-10-05T17:14:12Z`.

## Agents

First report did not pass its bar (one repair round). Builder a95c739803eb0fe23 (claude-sonnet-5-5, ordo-high): 177,652 + 254,446 + 186,736 tokens, 39 + 153 + 117 tool uses, 5.6 + 45.0 + 45.0 min. Reviewers aa5a6d5c963790bee (315,905 tokens, 75 tool uses, 19.9 min) and a023b1cea1940a333 over round 1 (321,296 tokens, 75 tool uses, 18.5 min). Brief check ac746360f7500e074 (222,221 tokens, 94 tool uses, 10.7 min), closed by aac4dfaf70ae0e442 (276,977 tokens, 130 tool uses, 15.6 min), rechecked by aa4e77039e687ca49 (281,201 tokens, 130 tool uses, 15.8 min).
