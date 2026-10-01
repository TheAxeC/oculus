Everything in items 1 to 15 is built, under the brief and the round-0 ruling (D31-cases.md). Three things you need to see first:
- Item 14 found rows where the tree does not match VS Code's default. I reported them and changed none (list below).
- The ruling's "fourteen subcommands" is wrong; the tree has sixteen. I wrote sixteen in DESIGN.md:128 (details under "Ruling points").
- Full verify list: `checks.sh` was invoked 5 times. The first was started from the worktree root and failed at once on a missing package.json. The other four ran from tools/oculus: red at `npm test`, red at `npm run test:checks`, red at `npm run lint`, then green. Details under "Verify".

Open items of the state file: not included (not reachable from the builder).

## Ruling points, as built
1. Case 18: -1 and 1.5 are refused with item 1's sentence, "5" with why('not_number'), no file written in any of the three, 3 written. Test: tests/server/edit/config-key.test.ts, describe 'the period of the automatic fetch'.
2. Decision 9 replaced:
   - `GIT_TERMINAL_PROMPT=0` is set on the timer's fetch.
   - `GIT_SSH_COMMAND` is the ssh command git would have used plus ` -o BatchMode=yes`. `unattendedSsh(env, configured)` in autofetch.ts resolves it in git's own order: environment `GIT_SSH_COMMAND`, else `core.sshCommand`, else `ssh`.
   - With only `GIT_SSH` set and neither of the first two, nothing is added for ssh (`unattendedSsh` answers undefined). If `core.sshCommand` is set and `GIT_SSH` too, BatchMode is still appended, because git reads `core.sshCommand` before `GIT_SSH`. This is my reading of the ruling's order.
   - `sshCommand(root): string` in src/lib/server/core/git.ts, vector `config --get core.sshCommand`, through the one call site. A failed read (key unset, no repository, timeout) answers the empty text.
   - `fetchIn(root, { unattended, sshCommand })` in git-write.ts takes the resolved command and runs no read. The pressed Fetch is unchanged.
   - Case 14 is four runs in tests/server/git/autofetch.test.ts, 'the environment of an unattended fetch', through `watchAutofetch` with the real remotes, fetch and ssh resolution: the repository command (`core.sshCommand`), the environment command, neither, and a pressed Fetch.
   - Discrepancy in the ruling: the script's arguments do not END with `-o BatchMode=yes`. git appends its own options and the host after the configured command, so they BEGIN with the configured command's arguments followed by `-o BatchMode=yes`. The test asserts `args=-i /some/key -o BatchMode=yes ` and `args=-o BatchMode=yes `.
   - New case for the read: tests/server/core/git-ssh.test.ts (set value, unset, no repository, repository left as it was).
3. DESIGN.md:128 now says sixteen subcommands. The tree already had sixteen (`ALLOWED` in tests/server/core/git.test.ts; `merge-base`, `check-attr` and `config` were already pinned but missing from the paragraph), so "fourteen" would have been false. I also added to the paragraph the `merge-base`, `check-attr`, `config --get --default= core.autocrlf` and `config --get core.sshCommand` forms, and `config` and `check-attr` to the pinned list.

## First run on the unchanged tree (new and changed cases after the ruling)
- autofetch.test.ts (cases 1-6, 8-15 and the four case 14 runs): "Cannot find module '../../../src/lib/server/root/watch/autofetch.ts'". fetch-period.test.ts: "Cannot find module '.../core/fetch-period.ts'". context.test.ts (case 19, wiring and default member): fails to load on the same missing import. Case 7's context case, run as a temporary copy without that import: "expected function to throw an error, but it didn't".
- config-key.test.ts, case 18: 3 failed, 32 passed. -1/1.5 got "The options catalog has no option of that name in a tracked config file", "5" got the same, and the write of 3 was refused with that reason.
- core/git.test.ts: 7 failed. The four sshCommand cases and two gate cases failed with "TypeError: sshCommand is not a function", and the call-site gate failed on the count (CALLS now lists `config` twice). The sshCommand cases are now in git-ssh.test.ts.
- Cases 16 and 17 passed on the unchanged tree: git-write.test.ts 47 passed, options-catalog.test.ts 63 passed.

## DONE / NOT DONE
| Row | Command and output |
|---|---|
| 1 fetch-period.ts | `npx vitest run tests/server/core/fetch-period.test.ts`: passes (full 8-file run below: 250 passed) |
| 2 autofetch.ts | `npx vitest run tests/server/git/autofetch.test.ts`: 42 passed |
| 3 git-write.ts | `fetchIn(root, options)`; `tests/server/git/git-write.test.ts` passes |
| 4 context.ts | `context.test.ts` passes (wiring, order, default member, refusal) |
| 5 config-key.ts | `config-key.test.ts` passes (35 cases) |
| 6-7 behavior.yml, options.yml | `options-catalog.test.ts`: 63 passed |
| 8-13 DESIGN.md:116, 128, 344; HELP.md:172, 186, 222 | edited; `help.test.ts` and `config.test.ts` pass |
| 14 other git options | list below |
| 15 tests | 8-file run: `Test Files 8 passed (8)`, `Tests 250 passed (250)` |

Checks: `npm run diagrams` (rc 0), then `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md` from tools/oculus. The commands in the verify list are `npm test`, `npm run test:checks`, `npm run check`, `npm run build`, `npm run format:check`, `npm run lint` and the ASCII command. The last (green) invocation printed `$ npm test`, `$ npm run test:checks`, `$ npm run check`, `$ npm run build`, `$ npm run format:check`, `$ npm run lint`, `$ ! LC_ALL=C grep -rna '[^ -~]' src tests`, `checks: 7 commands passed`, exit 0.

Verify item 2: `npx vitest run` over autofetch, fetch-period, git-ssh, core/git, context, config-key, git-write and options-catalog printed `Test Files 8 passed (8)`, `Tests 250 passed (250)`.

Case 15: with `import { execFile } from 'node:child_process'` added to autofetch.ts, the case failed with "expected ... not to contain 'node:child_process'"; restored by hand, it passed (1 passed).

Case 17: with the `git.autofetch_minutes` entry taken out of options.yml, options-catalog.test.ts failed with `behavior.yml: git.autofetch_minutes: has no catalog entry` (1 failed, 62 passed); put back by hand, 63 passed.

Mutation check on case 14: with `GIT_TERMINAL_PROMPT: '1'` in git-write.ts, 3 of the 4 environment cases failed; restored.

## Verify
- Verify item 3, `grep -rn -i 'autofetch\|fetch-period' src config DESIGN.md HELP.md --exclude=local.yml`: the two new modules, their imports in context.ts and config-key.ts, git-write.ts:45, core/git.ts:54, behavior.yml:139, options.yml:298, and DESIGN.md:116, 128 and 344. HELP.md:186 and 222 are the two hits that carry `git.autofetch_minutes`. HELP.md:172 does not match the grep ("automatic fetch").
- ASCII gate (the perl form of spec.md): prints nothing. It prints `bfs: error: bin: No such file or directory` because the folder `bin` does not exist in this tree. `utils/folder-check.sh` rc 0 and `utils/size-check.sh` rc 0.
- Number of `checks.sh` invocations: 5, as under "Three things" at the top. The three red runs: `tests/views/system/help.test.ts` (fixed by the config.yml edit under "Paths widened"), `tests/checks/source/comment-width.test.ts` (five comment lines over 100 columns, fixed), and eslint on autofetch.ts:166 and two dynamic deletes in the test (fixed).

## Files and line counts
New: src/lib/server/core/fetch-period.ts (33), src/lib/server/root/watch/autofetch.ts (212), tests/server/git/autofetch.test.ts (764), tests/server/core/fetch-period.test.ts (61), tests/server/core/git-ssh.test.ts (58).
Changed (`git diff --stat`): DESIGN.md, HELP.md, config/behavior.yml (+2), config/catalogs/options.yml (+4), config/text/views/system/config.yml (1 line), docs/diagrams/layer-server.dot and .svg, src/lib/server/core/git.ts (+15/-?), config-key.ts (+2), git-write.ts (+41), context.ts (+9), tests/server/core/git.test.ts (now 900 lines, exactly the size line), config-key.test.ts (+33), context.test.ts (+131).

Paths widened beyond the brief and the ruling:
- config/text/views/system/config.yml: the Config view's `desc_behavior` must equal HELP.md's `behavior.yml` row (help.test.ts), so the row's new wording is in both.
- tests/server/core/git-ssh.test.ts (new): git.test.ts was at 894 lines and the new cases took it past 900; tests/server/core now holds ten items.

## Item 14
The rows whose oculus column reads `has, fixed` in sections 4b, 4h and 4i of Z74-inventory.md. 4b has none; its rows read "sets" or "leaves Monaco's default". VS Code's defaults are those of the installed app, version 1.137.0 (`extensions/git/package.json` and `workbench.desktop.main.js`).

Mismatch (reported, not changed):
- git.pruneOnFetch: the tree fixes on (`fetchIn` runs `fetch --prune`, git-write.ts); VS Code's default is false. This is the same `--prune` that item 2's auto fetch runs, per Z83.
- git.pullTags: the tree runs plain `git pull` with no `--tags` (`pullIn`, git-write.ts:589); VS Code's default is true. The inventory row says "VS Code's `false`", which is wrong.
- git.requireGitUserConfig: the tree runs plain `git commit`; VS Code's default is true and passes `-c user.useConfigOnly=true` (read in the app's git dist/main.js).
- git.enableCommitSigning: the tree runs plain `git commit`, so `commit.gpgsign` decides. VS Code's default false passes `--no-gpg-sign` explicitly (same dist/main.js).
- git.statusLimit: the tree caps each change list at 200 (`MAX_ENTRIES`, core/git.ts:126); VS Code's default is 10000.
- git.untrackedChanges: the tree draws Untracked as its own group (HELP.md:112; `ChangeRow.svelte` group 'untracked'); VS Code's default is "mixed".
- scm.alwaysShowRepositories: the tree lists every root with no count condition (RepoList.svelte `{#each roots ...}`); VS Code's default is false.
- git.countBadge: the tree has a per-row badge (HELP.md:112) and rail badges; VS Code's default is "all" on the activity-bar icon. Only partly matching; not verified further.
- git.autoRepositoryDetection: VS Code's default is true (scans); the tree lists configured roots and session workspaces and scans nothing. Not verified further.

Match:
- git.allowForcePush (false): no `--force` in src/lib/server/git/git-write.ts or its siblings. `deposit-git.ts:257` force-pushes a deposit mirror, a separate path.
- git.confirmSync (true): `sync` is in `CONFIRMED` (git-routes.ts).
- git.enableStatusBarSync (true): the sync item in StatusBar.svelte / RepoItems.
- git.fetchOnPull (false): plain `pull`.
- git.openDiffOnClick (true): `ChangeRow.svelte`.
- git.path (null): `GIT = 'git'`.
- git.rebaseWhenSync (false): no strategy imposed.
- git.showActionButton: the commit button.
- git.showCommitInput, git.showInlineOpenFileAction: present.
- git.showPushSuccessNotification (false): no notification.
- git.similarityThreshold (50): `-M` without a value (core/git.ts:333, 346, 371).
- scm.diffDecorationsGutterAction ("diff"): `markAction('open')` in Editor.svelte.
- scm.diffDecorationsGutterVisibility ("always"): marks are always drawn.
- scm.diffDecorationsGutterWidth (3): `width: 3px` in Editor.svelte:465.
- scm.diffDecorationsIgnoreTrimWhitespace ("false"): no whitespace flag.

Because of the mismatches, the sentences of items 9 and 12 say the other git behaviours "are fixed with no key" (DESIGN.md:344) and "are fixed and have no key" (HELP.md:186). They do not say "at VS Code's defaults". If you want that clause, the eight mismatching rows above would have to change first; that is yours to rule.

## Judgment calls (reversible)
- `refresh(root)` follows any fetch that answered, ok or not, and not a fetch that rejected.
- No config message yet: no round, no log line.
- A `git` state that is malformed is skipped and the others are fetched.
- A round over zero repositories does not use up the period.
- A `refresh` that throws is logged as `autofetch: <root>: <reason>`.
- The unattended-fetch hazard I named earlier (the env var overriding `core.sshCommand`) is closed by the ruling.
- Sharp edge, not measured: a `setTimeout` that fires a millisecond early waits one more tick (accepted in the ruling).
- Sharp edge: `sshCommand` runs `spawnSync` before each timer fetch, which blocks the event loop for as long as the read takes (its 5-second timeout at most). A read that times out answers the empty text, so that repository's fetch then runs with plain `ssh -o BatchMode=yes` and ignores its `core.sshCommand`. Not measured.

## User-visible changes
- behavior.yml `git.autofetch_minutes: 0` (new key, default off); catalog entry and Settings control (number).
- A running server fetches every repository with a remote at that period, unattended; a failure is one stderr line `autofetch: <root>: <reason>` and is tried again the next period.
- A wrong value stops the server at start with `config/behavior.yml: git.autofetch_minutes must be a whole number of minutes, 0 or more`, and the Settings write refuses it. For a string, the Settings write refuses it with the number option's own sentence.
- HELP.md:172, 186 and 222, and the Config view's `behavior.yml` description, name the auto fetch; DESIGN.md:116, 128 and 344 name the one exception to "no watcher, timer or socket runs a writing git command".
- Look on TEST: nothing on screen changes unless the key is above 0; the visible effect is a repository's behind/ahead counts moving within a minute after a remote gets a commit. Not verified in the browser (no server started).

## Not verified
- A fetch against a real HTTPS or ssh remote that prompts; the cases read what the child process saw, through local-path and `ssh://nohost.invalid` remotes whose ssh program is a recorder script.
- The built app's behaviour under the timer.

Files, absolute: /Users/axelfaes/workspace/research-hub/.agents/worktrees/D31/tools/oculus/ (all paths above are relative to it).
