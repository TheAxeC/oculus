# O38 landing

Position: the cockpit-to-oculus migration, step O38 (the cockpit retired and the hub's tools cleaned, Recover built into oculus, the hub data files moved into `.oculus/data`) landed; next O44 (every text over a wallpaper on a surface), then O39 (oculus in its own repository).

Open items: none.

## Check of Steps 1
The builder abb312c8613a724c7, the brief check ab45d7f72335b6554 and the reviewers ac403e5a86a3d6757 and a75fec14c07a3891c had all completed; none was running when the worktree's range was taken.

## NOT DONE
Two pieces of O38, its own work after this commit in Axel's order, each booked under O38 when done:
- The cluster moves of rulings 154, 156 and 157: `~/data/mitdb/` to `mit-bih/`, the PTB-XL zip under PhysioNet's name into `ptb-xl/`, the MIMIC-IV-ECG zip into `mimic-ecg/`, `PED_unzip/` and `BraTS-PED/` into `BraTS-METS/` with `archive/` removed, the kagglehub BraTS2020 download into `BraTS2020_train/`, `BraTS2020_raw/`, `brats21_examples2/` and `mimic-iv-hosp/` deleted, and the code copies rsynced; on Axel's HPC access after this commit.
- Then the four deposit pushes through the Deposit view (rulings 155 and 156): bttn-incident-af, glassbox, covert-applied, ecg-readable-substrate.

## What landed
- O38's range from base db086e36d (`.agents/worktrees/migration-O38`), cherry-picked onto main, with main's changes since the base carried into the moved yml files.
- The fixes at landing, each under the Closed heading of `agents/reviews/O38-refuter.md`:
  - Open item 176 (a): while a cluster Recover run is followed, Recover reads its section over ssh once a minute (`hpc/poll.ts` `recover()`, `live/watch.ts` `CLUSTER_MS`, `context.ts` `readCluster`).
  - Behaviour R-2: the Login node section shows Live HPC's reason when Live HPC has no answer. Behaviour R-3: each `du -sb` runs under `timeout 5`.
  - Standards R-1 rewraps, R-2 five `workbench.yml` strings removed, R-3 `agents/guarded.md`, R-4 `hostStatusOf` removed with its callers reading `host.status`.
  - `Lanes.svelte:103` decided by the chip word `blocked`; it reads `isBlocked(project, config)` of `focus.ts`.
  - The lint of `EntryCard.svelte:222-223`: the card takes `CardAction` from `card.ts`.
  - The Recover view's words for one file and for files of unstated size.
  - An unreachable cluster: `clusterDisk` gives null when its command did not reach the shell, the route answers `refused: unreachable` with no plan, the view shows an error with Retry; a row of `tests/routes/machine/recover.test.ts`, red on the unchanged code.
  - mist-weights' `access: public` to `open`.
  - Live HPC's unreachable sentence: "The cluster did not answer over ssh. Is this Mac on the UT network or on EduVPN?" (Axel's ruling).
  - Seven Recover rows that start real processes tagged slow (`agents/spec.md:59`).
- The session's Part 7 work: `.agents/plan.yaml:12` and the state file's `worktree_paths`; the hub `CLAUDE.md` lines 56, 60 and 72 (saved by Axel); `~/.claude/rules/no-unicode-in-python.md:10`; the memory files (`research-cockpit-infra.md` rewritten as the record of a retired tool, every pointer to a moved or deleted path changed, dated records kept); `~/Applications/Cockpit.app` and the three `.py` files of `~/data` in the Trash; the grant form `form-fields.md` lines 238, 635, 637 and 641 through `academic-paper` revision mode (2 of 265 blocks touched, the result equal to the four path swaps).
- Ledger: the booking under O38 in `plan.md`, its three agents in the Agents section, the rulings on Live HPC's sentence, academic-researcher and the README line.

## Verification
- In the gate worktree `.agents/worktrees/gate` at main's head with the range and the fixes, `npm run diagrams && npm run test:landing` (gate run 5):
  - `ok ASCII gate`, `ok npm run format:check`, `ok npm run check ... 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok npm run lint`, `ok npm run test:checks`, `ok npm test`, `ok npm run build`.
  - `npm run test:slow`: `Tests 1 failed | 545 passed`. The failed row, `tests/server/machine/pty/sessions.test.ts`, waits 10 s for tmux's echo and ran at load average 13 to 14; O38 changes none of the files it drives (`git diff --cached` over them prints nothing), and it passed 3 of 3 alone on the same tree.
- Main's staged oculus diff equals the gate's: `cmp`, 40,741 lines; 833 paths outside the ledger (+20,502 -33,113), 482 under `tools/oculus` (+19,669 -6,344).
- The landing list was never run in main's checkout (Z492).

## The look
On TEST (localhost:8790), every one holds:
- Recover on This Mac (a row's Fetch on hover; Fetch not pressed) and on Cluster (the unreachable error with Retry).
- Live HPC and its Login node section with the ssh reason.
- The rice toggles: Brackets off draws boxed buttons, Monospace off draws the UI in sans, vscode dark+ unchanged by either.
- The palette: `:theme nosuch` refused, `:file-icons`, `:tab` and `:goto` listing.
- Keyboard Shortcuts: `comment` finds Cmd+/. Suggest details on by default. `vocab.yml` hover and Show Suggestions.
- The hub's `.oculus/config.yml`: 0 errors, 0 warnings. The 3MI Labs Host row. The archival band (nogo 3, dropped 2, disproved 1, abandoned 1). Focus (Run 5, Push 8, Revise 4). The chip picker's 33 words equal to the base legend.
- A host with no status and a project with the `blocked` chip are on no hub entry, so those two were read in the code, not seen.
- No A/B: the configuration block names no bench.

## Agents
- Builder abb312c8613a724c7 (claude-opus-5-5): round-0 hand-back 298,198 tokens, 54 tool uses, 8.7 min; build 280,827 tokens, 4,814 tool uses, 536.5 min; round 1 219,171 tokens, 230 tool uses, 32.3 min. Its first report did not pass its bar (one repair round).
- Brief check ab45d7f72335b6554 (claude-opus-5-5): 307,354 tokens, 105 tool uses, 18.0 min.
- Reviewer ac403e5a86a3d6757 (claude-opus-5-5): 190,477 tokens, 165 tool uses, 28.8 min.
- Reviewer over round 1 a75fec14c07a3891c (claude-opus-5-5): 94,722 tokens, 89 tool uses, 15.8 min.

## Next
The cluster moves on Axel's HPC access, then the four deposit pushes, both booked under O38; the academic-researcher deletion commit; then O44, then O39.
