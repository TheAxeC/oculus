# D41 landing: links in Markdown checked

Position: the oculus migration (cockpit to oculus), D41 links in Markdown checked; landed, with 333 of the 364 packages of `plan.md` ticked. Next: D50 lands after its review over repair round 1 (saved); D56 is prepared on the new head; D49 waits for D50.

## Open items

- Open item 31: a pulled change to a kept machine app runs with every channel and no question while oculus runs, since the hub's `.oculus/apps` is tracked in git; options (a) ask again for an app whose files change by anything other than oculus's own editor (recommended), (b) keep `.oculus/apps` out of git, (c) leave it and describe it (the lazy option).
- Open item 32: R2's start check needs a new guarded entry for its test; options (a) a new entry G73 with one table test (recommended), (b) no entry and no test (the lazy option).

## The check of Steps 1

The builder a6f74cd8e4f21015b and the reviewers a3548ef46cc305fbd and ac925e245cbc13ce9 had ended; TaskStop found no task for them, and ListAgents listed only a30b6993857882108 (D50's builder, completed).

## NOT DONE

Nothing of the step's code is left undone. Not looked at on screen: cases 6, 17, 21 and 29 and the page side of the round's Behaviour 1 (a move or rename in the Files view, a root removed), since adding a scratch root on the 8796 server writes the shipped `config/sources.yml` and the hub's own folders are not moved for a look; their relay side is met by the reviewers' probes and by `fresh.ts`. Case 33 was looked at in the light theme only. `npm ci` was run in main's `tools/oculus` to install `vscode-markdown-languageserver` 0.5.0 and `markdown-it` 15.0.2, which reinstalled main's `node_modules`, the folder Axel's running server reads from.

## What landed

94 paths, +4163 -352, from base d13535993: Microsoft's Markdown language server served through the relay as one more language; a missing link or backticked hub path marked; Cmd+click opening a link's target; the Files view's move and rename offering the link rewrite in the Refactor Preview; the rename box's hint line; the Audit row for a project whose `project.yml` `type` disagrees with its tier; a root that left the served roots no longer read as deleted; G72 (a Markdown file created, moved or renamed on disk is in the server's answers) written into `agents/guarded.md`, with G2, G3 and G36 widened to the Markdown server.

## Fixes at landing

The five findings of the review over round 1 (`agents/reviews/D41-refuter.md`, "Closed (at landing, over round 1)"):

1. The two `servers.ts` comments the build cut to stay under 880 lines restored; `YAML_SETTINGS` moved to the new `adapters/yaml/settings.ts`, `servers.ts` at 871 lines.
2. `Asked` and `NoticeHost` in `held/requests/notices.ts` made local.
3. A Created file is marked unread after its asks resolve, so a link rewrite waits for the server's read after the notice: `fresh.ts` at GAP 0 gives both new files' links 5 of 5 and the deep folder move's edit 10 of 10.
4. Folder events in `held/watch.ts` get a quiet of their own: `quiet.ts` hands `a.md` over at 517 ms (2554 ms before).
5. A link to a folder raises no folder event: `linkwatch.ts` prints `folder events: ["real=true"]`.

Two fixes the gate asked for: the folder limit of `lsp/` (10 items), kept by putting `YAML_SETTINGS` under `adapters/yaml/` rather than a new file in `lsp/`; and the comment width of the new file's head comment. The generated diagrams were taken from main and redrawn with `npm run diagrams`.

## Verification

In `.agents/worktrees/gate` at main d29631c18 with the range and the fixes (`scratchpad/D41-gate.log`, `scratchpad/D41-checks.log`):

- `ok ASCII gate (1.5 s)`
- `ok npm run format:check (21.7 s)`
- `ok npm run lint (32.2 s)`
- `ok npm test (154.6 s)`
- `ok npm run check, then npm run build, then npm run test:slow (340.8 s)`
- `npm run test:checks` after the last comment change: `Test Files 17 passed (17)`, `Tests 265 passed (265)`.

Main's staged tree equals the gate's, path list and every blob compared. No A/B (`bench:` names none).

## The look

On the scratch oculus at 8796 (main's tree, scratch HOME): Cmd+click on `[Window guide](docs/window.md#the-rail)` in `HELP.md` opened `docs/window.md` at `## The rail` (case 5); Go to References on `## The window and the app` opened a References peek with 3 references (case 34); the Outline listed the server's headings (case 34); F2 on `sha256` in `tools/manuscript/anchorize_tex.py` showed the rename box with its hint line (case 33, light theme).

## Agents

- Builder a6f74cd8e4f21015b (claude-sonnet-5-5): 350,099 tokens, 284 tool uses, 87.5 min; round 1: 385,073 tokens, 137 tool uses, 81.1 min.
- The first build's builder af88be61741f59b6d (claude-sonnet-5-5): 190,097 tokens, 596 tool uses, 147.6 min; round 1: 163,380 tokens, 175 tool uses, 49.6 min.
- Brief check ac604810d19c5e3dc (claude-opus-5-5): 322,042 tokens, 110 tool uses, 15.3 min.
- Reviewers of the first build: a0542130f88439869, 78,020 tokens, 114 tool uses, 28.4 min; a33f9e7d18db3918b over round 1, 272,363 tokens, 95 tool uses, 39.0 min.
- Reviewers of this build: a3548ef46cc305fbd, 297,647 tokens, 79 tool uses, 35.2 min; ac925e245cbc13ce9 over round 1, 314,411 tokens, 73 tool uses, 28.3 min.
- Diagnosis aa704af05fb1f06d9 (claude-opus-5-5): 328,374 tokens, 139 tool uses, 42.6 min; record `agents/reviews/D41-diagnosis.md`, cause found: the Markdown server 0.5.0 takes a Created notice only for a file already in its document cache; the fix (the `introduce` asks before the notice) is in this build.

The builder's first report did not pass its bar: the first build was taken back out of main at its landing (the look's case 34), and this build's review sent one repair round. Fixes at landing: five, listed above, plus the two the gate asked for.
