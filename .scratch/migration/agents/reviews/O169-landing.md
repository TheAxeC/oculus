# O169 landing

Position: the oculus migration, step O169 (connections and their failures said in full) landed. Next: /spec O168 with the four flaws of this look folded in, then /refute O167.

Open items: none.

## Check of Steps 1

The builder a7454e5b279e2a62f and the reviewers ae4637ee51aa87981 and a577595af5f86cb89 had ended before the landing (their completion notices are in the dispatch entry's records); none is running.

## Not done

Nothing. Every state the brief and the review owe to the look was looked at.

## What landed

The whole range from base 32585f1f1 (one wip commit 71d29ca45 of the builder's first run and repair round 1), with two fixes at landing, 31 paths, 363 insertions and 135 deletions:

- Start Agent from a task card finds the task whose reference names its hub.
- A fetch failure that matches no row gives ssh's last `ssh: ` line before git's.
- The Submit Job box draws its clusters as one select in `Confirm.svelte`'s new `pick` snippet, the keyboard on the select while no cluster is picked.
- The delete ask and the "Named by" tag name a setting by its label ("Slurm: Resource").
- The compile database rows send the root's real folder, and a missing folder says "The folder of {0} does not exist.".
- A new terminal whose tmux call fails says "The terminal did not start: {0}." with tmux's first line.
- Live HPC's host lines open with a capital and end with a full stop; a failed resolution is not drawn beside the error box.
- The Settings view offers the Repository scope; the explorer's make menu on a workspace folder's own row follows the server's offer.

Fixes at landing, the review over round 1's two findings: the head comment of `src/lib/server/machine/pty/refusal.ts` rewrapped at 100 columns with its words unchanged; the `TERMINAL_REFUSALS` comment of `src/lib/data/model/machine/model-machine.ts` made true of the one sentence per word and the name `terminal-not-started` carries.

## Verification

In the gate worktree at 3cec2039d with the range and the two fixes, `npm run diagrams && npm run docs:palette && npm run test:quick` (`.agents/worktrees/gate-O169.log`): "31 changed file(s)", "186 test file(s)"; ok prettier, ok ASCII gate, ok svelte-kit sync, ok eslint, "ok svelte-check (73.9 s): ... 589 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS", ok vitest checks. vitest failed one row of `tests/state/sessions/source/source.test.ts` ("reads a cut file again ...", expected length 2, got 3) and vitest slow five rows of `tests/data/hubs/hub-portfolio.test.ts` at 20000 ms, under a load of about 12 to 16. Neither file is in the step; both pass alone on main with the step staged: `npx vitest run tests/state/sessions/source/source.test.ts` 27 passed; `npx vitest run tests/data/hubs/hub-portfolio.test.ts --tagsFilter slow --testTimeout 20000` 16 passed.

On main: `git cherry-pick -n 32585f1f1..migration-O169`, the two fixed files and the regenerated diagrams copied from the gate; `cmp` of main's and the gate's `git diff --cached --binary --no-renames 3cec2039d` printed SAME. The verify list equals the page's commands. No A/B: the configuration names no `bench:`.

## The look

On the scratch server on 8797 from the gate, scratch HOME and a fake ssh:

- Live HPC, cluster unreachable: the ssh cause once, in the error box, no grey line. With `ssh -G` answering: the grey line "ssh connects to hpc-head1.ewi.utwente.nl as faesayl on port 22, offering ~/.ssh/id_ed25519_utwente" above the box. With `slurm.resource: []`: "The settings of this hub name no cluster (slurm.resource in .oculus/config.yml)."
- Settings: the scope select offers Workspace, Primary hub, Hub, This machine, Repository.
- Submit Job on btfno's `code/hpc/job.slurm` (compute utwente): UTwente HPC chosen, the plan text, Cancel focused, "Submit Anyway" for a script that names no `/local/$SLURM_JOB_ID`. With a second cluster added to the copy, engram's `code/slurm/e2e.slurm` (no compute): the select empty and focused, Submit off; Second HPC chosen: its plan, Submit on.
- The Second HPC page: "Named by: The setting Slurm: Resource"; its delete ask: "Referred to by Slurm: Resource."
- Start Agent from a Tasks card opens the composer seeded with the task; so does the Focus ticker's agent button on the same task, and the card's press after the ticker's keeps one task block (`sameTask`).
- With the case24 hub added to the copy's workspace and given the demo fixture's `tasks.yml`, Start Agent on its task "Renew compute allocation" opens the composer seeded with it, in case24.
- With the copy's one cluster, Submit Job on engram's script (no compute) opens with UTwente HPC chosen and Submit on.
- game-engine's compile database list: seven rows and Add Configuration, whose form opens; with the folder moved aside: "The folder of game-engine does not exist."
- A new terminal with a socket folder over the system's limit: "The terminal did not start: error connecting to .../tmux-502/default (File name too long)."
- A fetch through an ssh remote that fails: "The last fetch failed: ssh: connect to host ... Operation timed out. Could not read from remote repository." in Changes and in the push tip.
- The explorer's menu on research-hub (a repository and a hub) offers neither Make Folder a Git Repository nor Make Folder a Hub; on the plain `claude` folder it offers both.

Every Submit, Delete and form was cancelled; nothing was submitted, deleted or saved. The copy's `resources.yml`, `config.yml`, `.git/config` and workspace file equal their backups under `cmp`, case24's added `tasks.yml` is removed, and game-engine is back in place. The failed fetch emptied the copy's `.git/FETCH_HEAD`, git's record of the last fetch, in the scratch copy only. The server is stopped.

## Found outside the brief

Folded into O168 (its "Widened 2026-11-08" line in `plan.md`, Z468):

- A card's Markdown field drops text in angle brackets: the UTwente HPC card reads "job I/O on /local/" (`inlineMarkdown`, `src/lib/ui/html.ts:546`).
- A failed fetch's toast and status line give git's line without ssh's cause.
- The compile database form says "split by ,." for its list separator.
- The source.test.ts row above fails under load and passes alone.

## Agents

- Builder a7454e5b279e2a62f, claude-opus-5-5: first run 350498 tokens, 229 tool uses, 45.2 min; round 1 248761 tokens, 149 tool uses, 37.9 min.
- Brief check a606a2ddc903c57e5, claude-opus-5-5: 219750 tokens, 87 tool uses, 10.5 min.
- Reviewer ae4637ee51aa87981, claude-opus-5-5: 247221 tokens, 84 tool uses, 14.9 min.
- Reviewer over round 1 a577595af5f86cb89, claude-opus-5-5: 219573 tokens, 65 tool uses, 24.2 min.

The builder's first report did not pass its bar (repair round 1); two fixes at landing.
