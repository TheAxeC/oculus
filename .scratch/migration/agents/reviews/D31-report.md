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
    - `sshCommand(root): string | null` in src/lib/server/core/git.ts, vector `config --get --default= core.sshCommand`, through the one call site. An unset key answers the empty text, a failed read (a timeout, git not run, git exiting non-zero) answers null (repair round 1).
   - `fetchIn(root, { unattended, sshCommand })` in git-write.ts takes the resolved command and runs no read. The pressed Fetch is unchanged.
   - Case 14 is four runs in tests/server/git/autofetch.test.ts, 'the environment of an unattended fetch', through `watchAutofetch` with the real remotes, fetch and ssh resolution: the repository command (`core.sshCommand`), the environment command, neither, and a pressed Fetch.
   - Discrepancy in the ruling: the script's arguments do not END with `-o BatchMode=yes`. git appends its own options and the host after the configured command, so they BEGIN with the configured command's arguments followed by `-o BatchMode=yes`. The test asserts `args=-i /some/key -o BatchMode=yes ` and `args=-o BatchMode=yes `.
   - New case for the read: tests/server/core/git-ssh.test.ts (set value, unset, no repository, repository left as it was).
3. DESIGN.md:128 now says sixteen subcommands. The tree already had sixteen (`ALLOWED` in tests/server/core/git.test.ts; `merge-base`, `check-attr` and `config` were already pinned but missing from the paragraph), so "fourteen" would have been false. I also added to the paragraph the `merge-base`, `check-attr`, `config --get --default= core.autocrlf` and `config --get --default= core.sshCommand` forms, and `config` and `check-attr` to the pinned list.

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
The 25-row table, with 8 rows that differ from VS Code 1.137.0 and 17 that match, is under "Repair round 1, the builder's report" below; `git.enableCommitSigning` matches.

## Judgment calls (reversible)
- `refresh(root)` follows any fetch that answered, ok or not, and not a fetch that rejected.
- No config message yet: no round, no log line.
- A `git` state that is malformed is skipped and the others are fetched.
- A round over zero repositories does not use up the period.
- A `refresh` that throws is logged as `autofetch: <root>: <reason>`.
- The unattended-fetch hazard I named earlier (the env var overriding `core.sshCommand`) is closed by the ruling.
- Sharp edge, not measured: a `setTimeout` that fires a millisecond early waits one more tick (accepted in the ruling).
- Sharp edge: `sshCommand` runs `spawnSync` before each timer fetch, which blocks the event loop for as long as the read takes (its 5-second timeout at most). A read that fails answers null, and that repository is skipped for the period with one log line (repair round 1).

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

## Repair round 1, the builder's report

Everything in the seven rulings is done. One correction to my earlier report comes first, because it changes what you have: git.enableCommitSigning is NOT a mismatch. VS Code's git extension sets `signCommit = enableCommitSigning === true ? true : void 0` and passes `--no-gpg-sign` only when `signCommit` is not undefined (dist/main.js of 1.137.0, read with grep), so at the default false it passes nothing and git's own `commit.gpgsign` decides, as in the tree. My earlier report said the default passes `--no-gpg-sign`; that was wrong. The number of rows that differ from VS Code's default is 8, not the 9 I listed (the earlier text said "eight" over a list of nine).

Open items of the state file: not read from the builder side (no change). Nothing is left undone in the seven rulings. Sharp edges after the change:
- The skipped-repository log line carries a fixed reason ("git timed out, did not run or exited with an error"), because a `null` answer cannot carry git's own message.
- `sshCommand` is still a `spawnSync` read, once per repository per period, up to 5000 ms each, and blocks the server's event loop for that long. Not measured.

## Rulings and the command that proves each
1. `sshCommand(root)` (src/lib/server/core/git.ts:495-498) is `run(root, ['config', '--get', '--default=', 'core.sshCommand'], milliseconds(ms))` and answers `done.ok ? done.text.trim() : null`, typed `string | null`. I renamed its second parameter from `timeout` to `ms` so the call stays on one line and the file stays at 898 lines (900 is the size line; `sh utils/size-check.sh` rc 0). The head comment (core/git.ts:39, 53-55), `CALLS`/`PINNED`/`PINNED_SOURCE` in tests/server/core/git.test.ts (still 900 lines) and DESIGN.md:128 name the `--default=` form.
   - autofetch.ts now has a default `unattendedFetch(root)`: it calls `sshCommand(root)` only when `process.env.GIT_SSH_COMMAND` is empty; on `null` it throws `core.sshCommand could not be read: git timed out, did not run or exited with an error`, which the existing catch in `visit` logs as `autofetch: <root>: core.sshCommand could not be read: <reason>` with no refresh.
   - New cases, run on the tree before the change:
     - tests/server/core/git-ssh.test.ts, "answers null when the read fails, for a root that does not exist": `AssertionError: expected '' to be null`.
     - tests/server/git/autofetch.test.ts, "skips a repository whose core.sshCommand cannot be read, says so, and tries again next period" (the clone is moved away, one look, the clone is moved back, a second look): `AssertionError: expected [] to deeply equal [ 'autofetch: .../clone: core.sshCommand could not be read: git timed out, did not run or exited with an error' ]`. After the change it asserts one line after the first look, `calls` equal to `['remotes <clone>']`, then `refresh <clone>` after the second look and still one line.
     - tests/server/core/git.test.ts: the gate cases "holds only the allowed subcommands at its call site, the pinned nine as their exact vectors" and "ran nothing but those commands over this file, the pinned nine as their vectors" failed with the new vector lists before the source change.
     - "does not read core.sshCommand when the environment names the command" passes on the old tree, which never skips. With `const configured = sshCommand(root);` in place of `named ? '' : sshCommand(root)` it failed (1 failed, 43 skipped); restored, it passed (1 passed).
2. The environment cases of autofetch.test.ts set `GIT_CONFIG_GLOBAL=/dev/null` and `GIT_CONFIG_NOSYSTEM=1` through the `ALONE` constant that `withEnv` applies (both names are in `NAMES`, so they are restored afterwards).
3. The source test in autofetch.test.ts is titled "audits the source: ..." and now also asserts the names imported from core/git.ts equal `['sshCommand']`.
4. DESIGN.md:344 ends "...nothing pushes after a commit except where the reader pressed Commit and Push or Commit and Sync."
5. DESIGN.md:128 says "when only the older `GIT_SSH` variable names the ssh program, nothing is added for ssh, so ssh may still ask"; HELP.md:186 says "when only the older `GIT_SSH` variable names the ssh program, nothing is added for ssh, which may then still ask".
6. HELP.md:186: the sentence "The status bar's sync item does the same for the repository of the tab on screen." now comes right after "none of them ever forces", followed by the auto fetch sentences; "and the incoming commits follow" is now "and the behind count of each branch moves with what the remote holds".
7. Item 14 is below. No code change.

## Verification
- Scoped run: `npx vitest run` over git-ssh, fetch-period, core/git, autofetch, git-write, context, config-key and help tests printed `Test Files 8 passed (8)`, `Tests 210 passed (210)`.
- Full list: `npm run diagrams` rc 0, then `sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md` from tools/oculus, rc 0. It printed `$ npm test`, `$ npm run test:checks`, `$ npm run check`, `$ npm run build`, `$ npm run format:check`, `$ npm run lint`, `$ ! LC_ALL=C grep -rna '[^ -~]' src tests`, `checks: 7 commands passed`.
- Number of full-list runs this round: 1, green. The file count of tests/server/core is 10 (the cap, unchanged).
- Line counts now (`wc -l`): core/git.ts 898, autofetch.ts 225, autofetch.test.ts 823, core/git.test.ts 900, git-ssh.test.ts 62, DESIGN.md 419, HELP.md 302.

## Item 14: the 25 `has, fixed` rows (20 git.*, 5 scm.*)
VS Code defaults come from the installed 1.137.0: `extensions/git/package.json` for git.*, `out/vs/workbench/workbench.desktop.main.js` for scm.*, and `extensions/git/dist/main.js` for behaviour. Tree side is in tools/oculus.

Differ (8):
| Key | VS Code default | Tree |
|---|---|---|
| git.pruneOnFetch | false (prune only if set) | `['fetch', '--prune']` always, src/lib/server/git/git-write.ts:615 |
| git.pullTags | true (main.js passes `tags: pullTags`) | `['pull']`, no `--tags`, git-write.ts:590 |
| git.requireGitUserConfig | true (main.js adds `-c user.useConfigOnly=true`) | `['commit', ...args]` with no `-c`, git-write.ts:580 (`grep -rn "useConfigOnly" src/lib/server` finds nothing) |
| git.statusLimit | 10000 | `MAX_ENTRIES = 200`, core/git.ts:126, used at :630 |
| git.untrackedChanges | "mixed" | Untracked is its own group, ChangeGroups.svelte:189 |
| scm.alwaysShowRepositories | false | every root listed, no count condition, RepoList.svelte:120 |
| git.countBadge | "all" (count on the activity-bar icon) | per-row badge RepoList.svelte:139-141, total in Changes.svelte:76; no git count on the rail (rail-badges.ts has no git function, RailPages.svelte names none) |
| git.autoRepositoryDetection | true (scans) | roots from sessions (`rootsOf`, root/watch/git.ts:122) and config (`readRoots`, :334); no directory scan in that file |

Match (17):
| Key | VS Code default | Tree |
|---|---|---|
| git.allowForcePush | false | no `--force` under src/lib/server/git except deposit-git.ts:257, a deposit mirror push |
| git.confirmSync | true | `'sync'` in `CONFIRMED`, git-routes.ts:121 |
| git.enableCommitSigning | false (passes nothing) | plain commit, git-write.ts:580 |
| git.enableStatusBarSync | true | sync item, RepoItems.svelte:119 (StatusBar.svelte:101) |
| git.fetchOnPull | false | plain `pull`, git-write.ts:590 |
| git.openDiffOnClick | true | row opens its diff, ChangeRow.svelte:112 |
| git.path | null (git on PATH) | `GIT = 'git'`, core/git.ts:118 |
| git.rebaseWhenSync | false | sync is pull then push, git-remote.ts:50-52 |
| git.showActionButton | commit, publish, sync all true | `actionButton(git)`, CommitBox.svelte:60 |
| git.showCommitInput | true | commit box with message field, CommitBox.svelte:144 |
| git.showInlineOpenFileAction | true | Open File on the row, ChangeRow.svelte:133-138 |
| git.showPushSuccessNotification | false | a line `git.done` on the repository, repositories.svelte.ts:193 |
| git.similarityThreshold | 50 | `-M` with no value, core/git.ts:333, 346, 371 |
| scm.diffDecorationsGutterAction | "diff" | a press opens the diff, Editor.svelte:246-248 |
| scm.diffDecorationsGutterVisibility | "always" | marks always drawn, Editor.svelte:338 (`markDecorations`) |
| scm.diffDecorationsGutterWidth | 3 | `width: 3px`, Editor.svelte:465 |
| scm.diffDecorationsIgnoreTrimWhitespace | "false" | `-U0` with no whitespace flag, core/git.ts:523 |

17 + 8 = 25. Because of the 8 mismatches the sentences in DESIGN.md:344 and HELP.md:186 say the other git behaviours "are fixed with no key" and do not say "at VS Code's defaults". Whether that clause may return after the rows change is yours to rule.

Not verified: the real prompting fetch against an https or ssh remote; the blocking time of `sshCommand`; the built app under the timer (no server was started).

All paths above are relative to /Users/axelfaes/workspace/research-hub/.agents/worktrees/D31/tools/oculus.
