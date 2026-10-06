# O30 landing

Position: roadmap entry oculus/migration (the cockpit-to-oculus migration), step O30 "native window (I)", landed. Next: A3's landing, then E4's landing, then O30b, Q123 and Q124.

## Open items

- Z605 (2026-10-06, step E4): ruled (a) by Axel; the block `describe('the shipped files')` is removed at E4's landing.

## The check of Steps 1

`ListAgents` listed no agent of O30 running: only the reviewer over round 1, completed.

## Not done

- The look photographed the main window only. The floating window, find in the page, the application menu, the spelling menu, the folder picker, the dialogs and the packaged app need a press or a key, and the app is not driven through its remote debugging port, which the runner refused (Z629).

## What landed

Oculus in its own window: Electron runs the oculus server in a utility process and draws the page in its own Chromium (125 files, 6371 insertions, 1048 deletions). With it, the fixes of the first landing (S2-1, St2-1, St2-2, B2-1 to B2-4, Z612, Z619) and the red line's fix: the slow tests run after the type check and the build in one lane of `npm run test:landing`; a slow row fails at once on a dialog that comes before the text it waits for; a failure's dialog names the last line that names an error.

## Verification

In `.agents/worktrees/gate-O30` at main 9bb1eef23 with the range:

- `npm run diagrams`: exit 0.
- `npm run test:landing`: ok ASCII gate; ok `npm run format:check`; ok `npm run test:checks` (76.3 s); ok `npm run lint`; ok `npm run check, then npm run build, then npm run test:slow` (258.6 s); FAILED `npm test` (15.6 s) on `ENOTEMPTY: directory not empty, rename .../node_modules/.vite/vitest/.../deps___vitest___temp_...`, two vitest runs racing on the shared deps cache at startup, folded into Q124.
- `npm test` alone: `Test Files 87 passed | 18 skipped (105)`, `Tests 336 passed | 72 skipped (408)`.
- Main's staged change and the gate's: `cmp` of both `git diff --cached --binary` outputs equal.

## The look

The unpackaged app from the gate on a scratch hub, a scratch HOME and a scratch tmux socket, on port 8817: one window, "axel@research: ~/Focus", photographed with `screencapture -l`, showing the Focus view, a Live HPC pane and the status bar from the scratch server with the server item up. The app quit with no process and no listener on 8817 left; `~/Library/Application Support/oculus` does not exist, the profile having gone to the scratch HOME.

## Agents and fixes at landing

- Builder after the back-out a5e1b0c7f9cadbc75 (claude-sonnet-5-5): 250,481 tokens, 70 tool uses, 10.8 min; round 1 279,323 tokens, 16 tool uses, 2.7 min. Its first report did not pass its bar: item 18 read whether the two lines were present, not their order.
- Reviewers: a5caaef6badbe2dfe stopped and not used (it imported `tests/tiers/landing.mjs`, which started the app); a1f7cd3cd58643a76 (260,959 tokens, 61 tool uses, 9.6 min); a5128dba9664ee455 over round 1 (214,865 tokens, 52 tool uses, 6.7 min).
- Diagnosis of the red line adb7a3d3f5225357b: 270,792 tokens, 87 tool uses, 64.1 min.
- Fixes at landing in this landing: none in code; the run over round 1's two report findings closed by its own reruns.
