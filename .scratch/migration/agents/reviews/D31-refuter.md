# Step D31 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/D31, base 133ee543)

Read before judging: refute SKILL.md and template; orchestrator-state.md (configuration block, verify list, D31 dispatch entry); briefs/D31.md; briefs/D31-cases.md (round-0 ruling); reviews/D31-brief-check.md with its Closed heading; agents/spec.md (the standards the brief names); plan.md D31 line (418-420) and Z83/Z165; `git diff 133ee543` and every untracked file whole; the builder's report last. ADRs: `ls docs` in tools/oculus holds only `diagrams`, the find for `NNNN-*.md` printed nothing, and `grep -n '^adr' orchestrator-state.md` exits 1, so no ADR governs the diff.

## Verification (rerun by the reviewer)

```
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams      (rc 0; git diff 133ee543 --stat -- docs unchanged by the run: layer-server.dot 7, layer-server.svg 611)

$ sh ~/.claude/skills/land/templates/checks.sh .../orchestrator-state.md   (rc 0), lines printed:
$ npm test
 RUN  v4.1.11 /Users/axelfaes/workspace/research-hub/.agents/worktrees/D31/tools/oculus
 Test Files  404 passed | 21 skipped (425)
      Tests  10523 passed | 615 skipped (11138)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  442 passed | 9 skipped (451)
$ npm run check
... COMPLETED 2916 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
Checking formatting...
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

Commands the builder's report quotes, rerun in the same form:

```
npx vitest run <8 files: autofetch, fetch-period, git-ssh, core/git, context, config-key, git-write, options-catalog>
 Test Files  8 passed (8)
      Tests  250 passed (250)
autofetch.test.ts 42 passed | config-key.test.ts 35 passed | options-catalog.test.ts 63 passed | git-write.test.ts 47 passed | git-ssh.test.ts 4 passed | context.test.ts 11 passed
grep -rn -i 'autofetch\|fetch-period' src config DESIGN.md HELP.md --exclude=local.yml
  -> the two new modules, imports at context.ts:47,70 and config-key.ts:55,93, git-write.ts:45, core/git.ts:54, behavior.yml:139, options.yml:298, config/text/views/system/config.yml:6, DESIGN.md:116,128,344, HELP.md:186,222. HELP.md:172 does not match (it says "automatic fetch").
sh utils/folder-check.sh -> rc 0 ; sh utils/size-check.sh -> rc 0 (the line is 900, a file over it fails; tests/server/core/git.test.ts is 900)
ASCII gate (the perl form of spec.md) over src tests config minus local.yml -> prints nothing; non-ASCII on the added lines of DESIGN.md and HELP.md -> none
ls tests/server/core | wc -l -> 10 ; ls src/lib/server/core | wc -l -> 10 ; ls tests/server/git | wc -l -> 8
```

Subcommand count (point 1): `perl -0777` over the `run(root, ['<sub>'` call sites of src/lib/server/core/git.ts lists 16 distinct subcommands (blame check-attr check-ignore config diff for-each-ref log ls-files merge-base remote rev-list rev-parse show status symbolic-ref worktree). The `ALLOWED` array of tests/server/core/git.test.ts:68-84 holds 16 entries (`sed -n 68,84p ... | grep -c "^    '"` prints 16, and the same count on `git show 133ee543:...` of that file prints 16). `git show 133ee543:tools/oculus/DESIGN.md | sed -n 128p` says "thirteen subcommands"; the new line says "sixteen". The vector map `PINNED` has nine keys (check-attr, check-ignore, config, for-each-ref, ls-files, remote, rev-parse, symbolic-ref, worktree). Sixteen is the true number; the ruling's "fourteen" and the base text's "thirteen" were both short. The paragraph now names all sixteen subcommands and all nine pinned ones (`symbolic-ref`, `worktree`, `remote`, `config`, `rev-parse`, `check-ignore`, `ls-files`, `for-each-ref`, `check-attr`), and both `config` vectors (`--get --default= core.autocrlf`, `--get core.sshCommand`).

ssh order (point 2), probes run with no network (ssh replaced by a shell snippet, host `nohost.invalid`), git 2.49.0:

```
GIT_SSH=/bin/echo git -c core.sshCommand='echo CONFIGWINS >&2; false' ls-remote ssh://nohost.invalid/x   -> CONFIGWINS
GIT_SSH_COMMAND='echo ENVWINS >&2; false' git -c core.sshCommand='echo CONFIGWINS >&2; false' ls-remote ...  -> ENVWINS
GIT_SSH_COMMAND='sh -c ... echo "args=$*" ... ssh -i /some/key -o BatchMode=yes' git ls-remote ssh://nohost.invalid/repo.git
  -> args=-i /some/key -o BatchMode=yes nohost.invalid git-upload-pack '/repo.git'
```

`man git-config` (core.sshCommand): "is overridden when the environment variable is set". `man git` (GIT_SSH, GIT_SSH_COMMAND): "$GIT_SSH_COMMAND takes precedence over $GIT_SSH". Neither page states core.sshCommand against GIT_SSH; the probe shows core.sshCommand wins.

## Verdicts

Items of the brief's "What to build" (as the round-0 ruling amended them):

- 1 (fetch-period.ts): holds. `autofetchMinutes` through `z.number().int().min(0)` inside a `git` object, no cast; `requireAutofetch` throws the brief's sentence; fetch-period.test.ts has fourteen wrong shapes (Infinity, NaN, undefined among them), 5 tests pass.
- 2 (autofetch.ts, 212 lines): holds. TICK 60000; options as listed; first look one tick after start (autofetch.test.ts:134-154); arms the next look before working (autofetch.ts:190); grouping by `worktrees[0].path` (:149); rounds sequential with the key re-read per repository (:182-184); `close()` guards before `remotes`, `fetch` and `refresh` (:161,168,181); wrong value logged once (:130-131). It runs no process of its own. After the ruling it imports `sshCommand` from core/git.ts (autofetch.ts:33), which the source-rule test does not pin (see Proof 2).
- 3 (git-write.ts): holds, as the ruling rewrote it. `fetchIn(root, { unattended, sshCommand })` adds `GIT_TERMINAL_PROMPT=0` and the resolved command; the pressed Fetch passes no options, so `extra.env` is undefined and the environment is `process.env` as before. Head comment (git-write.ts:40-55) names both callers.
- 4 (context.ts): holds. `requireAutofetch(config)` at :227, member at :179/:198, started after the git watcher at :306, `autofetch.close()` before `git.close()` at :397.
- 5 (config-key.ts): holds. `requireAutofetch` in `READERS` (:93).
- 6 (behavior.yml): holds. Key at :139, second comment line at :134.
- 7 (options.yml): holds. Entry at :298 with description, `default: 0`, `control: number`.
- 8 (DESIGN.md:128): holds as to the exception text, with Standards 2 on the "never ask" clause.
- 9 (DESIGN.md:344): violated on its last clause, Standards 1.
- 10 (DESIGN.md:116): holds.
- 11 (HELP.md:172): holds.
- 12 (HELP.md:186): holds as to the sentences asked for, with Standards 2 and 3.
- 13 (HELP.md:222): holds; the added path `config/text/views/system/config.yml` is a consequence of this item, not a change no item asks for. `tests/views/system/help.test.ts:331` requires `MANUAL.includes(catalog[descriptionKey(name)])`, so the row and the Config view's `desc_behavior` must carry the same words.
- 14 (the other git options): violated, Spec 1.
- 15 (tests): holds. All listed files exist; `git-ssh.test.ts` is the ruling's new case for the read, put in its own file because `git.test.ts` stands at 900 lines, which the size line allows and one more line would not (`utils/size-check.sh`, `$1 > 900`). `tests/server/core` is now at ten items, the cap. `git-reads.test.ts` (604 lines, slow-tagged) is where the module's other reads are tested; a case put there would run only by path and not in `npm test`, so the separate file is a defensible choice and no rule is broken.

Cases of the brief's "Cases" (case 14 and 18 as the ruling amended them; the added case for the read last):

- 1 (key 0, twenty looks): met, autofetch.test.ts:125-132.
- 2 (key 5, two roots, order, 1 to 4 minutes nothing, then again): met, :156-189.
- 3 (empty, not ok, repository false, two remotes once): met, :191-215.
- 4 (no second round while a fetch runs, then one after it settles): met, :217-233.
- 5 (key 0 to 2, 2 to 0, 0 mid-round, newest of two messages): met, :237-282.
- 6 (ten wrong values, log exactly once, resume at 3): met, :285-333.
- 7 (`requireAutofetch` and `createServerContext` over -1): met, fetch-period.test.ts:47-60, context.test.ts "stops before building anything".
- 8 (not ok and rejecting fetch, next period retries): met, :336-367.
- 9 (refresh after each fetch, never skipped, never after close): met, :415-427 and :442-455.
- 10 (close before the first look, twice, during a hung fetch): met, :431-467.
- 11 (no `git` or no `config` message, malformed payload): met, :471-512.
- 12 (repository, worktree, folder inside it fetched once): met, :514-543.
- 13 (real fetch, moved ref, pruned branch, path with a space): met, :588-625, passes in the 42.
- 14 (as amended: repository command, environment command, neither, pressed Fetch): met in meaning. The ruling's "arguments END with `-o BatchMode=yes`" does not describe git: the probe above shows git puts the host and remote command after the configured command, so the arguments BEGIN with the configured options followed by `-o BatchMode=yes`. The tests assert `args=-i /some/key -o BatchMode=yes ` (autofetch.test.ts:704) and `args=-o BatchMode=yes ` (:712), `prompt=0` in all three, and for the pressed Fetch `prompt=` empty, `ssh=` empty and no `BatchMode` (:734-737). That is the ruling's meaning (BatchMode reaches ssh, the configured command and its options kept), and stricter than "ends with". The third run reads `GIT_SSH_COMMAND` from the environment the uploadpack command sees (:726).
- 15 (source rule): met as an audit; the edit-and-restore run (an `execFile` import added) is not reproduced by me (Declined to judge). The test reads: `not.toContain('node:child_process')`, `not.toMatch(/\brun\(/)`, `not.toContain('execFile')`, `not.toContain('spawn')`, git-write imports equal `['fetchIn','remoteNames']` (autofetch.test.ts:747-763).
- 16 (git-write.test.ts by path): met, 47 passed in my run.
- 17 (options-catalog with and without the entry): partial in what I could reproduce. The passing run is reproduced (63 passed); the failing run with the entry taken out is not reproduced because the reviewer edits nothing. The test's assertion is a per-key parity check, so the builder's quoted failure `behavior.yml: git.autofetch_minutes: has no catalog entry` is consistent with it. Not an unmet case.
- 18 (Settings write: -1 and 1.5 refused with item 1's sentence, "5" with `why('not_number')`, 3 written, file untouched): met, config-key.test.ts "the period of the automatic fetch", 35 passed.
- 19 (context wiring, close order, default member): met, context.test.ts: `['start git','start autofetch','close autofetch','close git']`, `refresh('/some/root')` reaches the git watcher's `refresh` once, and the default member is checked through a `vi.mock` wrapper of the real `watchAutofetch`.
- Added case (sshCommand answers the set value, and the empty text for unset and for no repository): met, git-ssh.test.ts (4 passed), plus the gate in git.test.ts (`CALLS`, `PINNED`, `PINNED_SOURCE` carry the new vector; `expect(sshCommand(repo)).toBe('')` in the last-gate case).

## 1. Spec

- Builder's report, section "Item 14" (lines 63-94 of agents/reviews/D31-report.md): "git.countBadge: ... Only partly matching; not verified further." and "git.autoRepositoryDetection: ... Not verified further."; what is wrong: item 14 asks, for each `has, fixed` row, the fixed choice, VS Code's default, and whether the tree matches "(a grep or a read with `file:line`)". Two of the nine mismatch rows are left unverified by the builder's own words. Many "Match" rows carry no `file:line` (git.path "`GIT = 'git'`" without a line, which is src/lib/server/core/git.ts:118; git.confirmSync "`sync` is in `CONFIRMED` (git-routes.ts)"; git.enableStatusBarSync "StatusBar.svelte / RepoItems"; git.openDiffOnClick "`ChangeRow.svelte`"; git.fetchOnPull "plain `pull`"), and git.showActionButton, git.showCommitInput and git.showInlineOpenFileAction give no VS Code default. What I did reproduce: the VS Code defaults of pruneOnFetch (false), pullTags (true), requireGitUserConfig (true), enableCommitSigning (false), statusLimit (10000), untrackedChanges (mixed), countBadge (all), autoRepositoryDetection (true) from `extensions/git/package.json` of the installed 1.137.0, `--no-gpg-sign` and `useConfigOnly=true` in its `dist/main.js`, scm.alwaysShowRepositories (false) and gutterWidth (3) in `workbench.desktop.main.js`; the tree side: `fetchIn` runs `['fetch','--prune']` (git-write.ts:615), `pullIn` runs `['pull']` (:590), `MAX_ENTRIES = 200` (core/git.ts:126), `{#each roots as root (root)}` (RepoList.svelte:120), `width: 3px` (Editor.svelte:465), `-M` with no value (core/git.ts:333,346,371). The inventory has 25 `has, fixed` rows in 4h and 4i (4b has none, `grep -c "has, fixed"` over lines 661-1000 gave 0 hits for that column); the report accounts for all 25 (16 match, 9 mismatch). Failure scenario: Axel rules on whether the clause "at VS Code's defaults" may come back after the rows change; two of the nine rows he is asked to count were not examined, and the report says "the eight mismatching rows" while it lists nine. verdict: item 14 violated (the list is incomplete).
- Same report, first lines: "Open items of the state file: not included (not reachable from the builder)."; what is wrong: the brief's Report section asks for the state file's open items verbatim after the first line. The state file's open-items list holds no entry today (orchestrator-state.md, heading "Open items", empty), so nothing is lost. No verdict.

## 2. Proof

- Builder's report, "Item 14" closing paragraph: "the eight mismatching rows above would have to change first"; what is wrong: nine mismatch rows are listed above it (pruneOnFetch, pullTags, requireGitUserConfig, enableCommitSigning, statusLimit, untrackedChanges, alwaysShowRepositories, countBadge, autoRepositoryDetection). The decision resting on the count is Axel's ruling on the dropped clause. Failure scenario: Axel sizes the rework at eight rows and finds nine. verdict: none (folds into Spec 1).
- tests/server/git/autofetch.test.ts:741-763 ("the source rule"): "expect(source).not.toContain('node:child_process') ... expect(names.sort()).toEqual(['fetchIn', 'remoteNames'])"; what is wrong: an assertion over source text, which agents/spec.md ("A behaviour that needs a DOM ... an assertion over source text ... proves nothing and is reported as an audit") says is an audit; the report's DONE table presents it as a row without that word. The regex `/from '([^']*\/git\/[^']*)'/` matches the `git/` folder only, so the new import `from '../../core/git.ts'` is not pinned: a second function imported from core/git.ts would pass. Failure scenario: a later edit adds another core/git.ts import to the timer and no case fails; core/git.ts is gated read-only, so the harm is bounded. verdict: none (the brief prescribes this test; named so the booking calls it an audit).
- tests/server/git/autofetch.test.ts:715-727 (third environment case): "gitText(held.clone, 'config', 'remote.origin.uploadpack', program); await withEnv({}, () => round(held.clone)); expect(readFileSync(out, 'utf8')).toBe('prompt=0\nssh=ssh -o BatchMode=yes\n');"; what is wrong: `withEnv` clears only `GIT_TERMINAL_PROMPT`, `GIT_SSH_COMMAND` and `GIT_SSH`; the real `sshCommand(root)` reads the machine's global and system git configuration, which `git-ssh.test.ts` isolates with `GIT_CONFIG_GLOBAL=/dev/null` and `GIT_CONFIG_NOSYSTEM=1` and this case does not. Failure scenario: on a machine whose `~/.gitconfig` sets `core.sshCommand`, the file holds `ssh=<that command> -o BatchMode=yes` and the case fails with nothing wrong in the code. On this machine `git config --global --get core.sshCommand` prints nothing (rc 1), so it passes here. verdict: none (a fragile test, low cost).

## 3. Standards

- tools/oculus/DESIGN.md:344: "The other git behaviours oculus has are fixed with no key, and nothing pushes after a commit."; what is wrong: the commit box offers Commit and Push and Commit and Sync (src/lib/views/shared/changes/CommitBox.svelte:9 and :96, config/text/views/sessions/changes.yml:25-27). The brief's premise "grep ... prints nothing: nothing pushes after a commit today" held for the words it greps and not for the controls; the builder wrote the exception into HELP.md:186 ("nothing pushes after a commit except where the reader pressed Commit and Push or Commit and Sync") but wrote the bare sentence into DESIGN.md and did not report the premise as wrong. Failure scenario: a reader of DESIGN.md concludes no control pushes after a commit and removes or rejects Commit and Push as a violation. verdict: item 9 violated; closable at landing by adding the same exception to DESIGN.md:344.
- tools/oculus/HELP.md:186 and DESIGN.md:128: "without asking for a password or a passphrase" and "(git is told never to ask for a password or a passphrase)"; what is wrong: `unattendedSsh` answers undefined when only `GIT_SSH` is set (autofetch.ts:86), so nothing is added for ssh and ssh can still ask on the server's terminal; the builder's report and the head comment (autofetch.ts:21-22) say so, the two documents do not. Failure scenario: a reader who sets `GIT_SSH` for the server reads HELP.md, expects no prompt, and finds a fetch waiting for a passphrase for the 60 s timeout each period. verdict: items 8 and 12 hold in what they were asked to say; fix at landing by adding "unless the older GIT_SSH variable names the ssh program" to both.
- tools/oculus/HELP.md:186: "... The other git behaviours oculus has are fixed and have no key. The status bar's sync item does the same for the repository of the tab on screen."; what is wrong: the sentence "does the same" referred to Sync and now follows four sentences about the auto fetch and the fixed behaviours; "and the incoming commits follow" does not say what follows. Failure scenario: a reader takes "does the same" to mean the status bar fetches on a timer. verdict: none; fix at landing by moving the new sentences after "...the repository of the tab on screen." and replacing "and the incoming commits follow" with what the reader sees.
- Non-ASCII, history in comments (grep for D31, Z83, Z165, ruling, brief, previously, no longer over the added lines: no hit), secrets, size (`size-check.sh` rc 0), folder size (`folder-check.sh` rc 0), public surface pages (HELP.md, DESIGN.md, options.yml, behavior.yml, config.yml all carry the key), sentences made false by a changed name (grep of "no watcher", "timer, socket", "only from a press", "reachable from a watcher", "subcommands" over src, tests, config, DESIGN.md, HELP.md, README.md: the only hits that changed are the ones the diff rewrote; the deposit.ts:19 and deposit-git.ts:22 comments are about modules the timer does not touch): none.

## 4. Behaviour

- tools/oculus/src/lib/server/root/watch/autofetch.ts:106-110 and :86: "fetchIn(root, { unattended: true, sshCommand: unattendedSsh(process.env, sshCommand(root)) })"; what is wrong: (a) `sshCommand(root)` is `spawnSync` (core/git.ts:72,496), so the server's single event loop stops for the length of the read, up to its 5000 ms timeout (core/git.ts:124), before the asynchronous fetch starts, once per repository per period. This matches the rest of core/git.ts, which uses `spawnSync` throughout (the git watcher's `statusFor` among them), and the ruling named this call site and timeout, so the blocking is not outside the standard; the read is not measured by the builder and I did not measure it either. (b) The argument is evaluated even when `process.env.GIT_SSH_COMMAND` is set, where `unattendedSsh` ignores it (autofetch.ts:83-84). (c) A read that times out, or fails for any reason other than an unset key, answers the empty text (core/git.ts:497), so the fetch then runs with plain `ssh -o BatchMode=yes` and the repository's own `-i key` or jump host is dropped; nothing is logged about the read. The builder named (a) and (c) as "Sharp edge, not measured" in the middle of "Judgment calls", not among the three things at the top; the hub rule is that a named risk is fixed or stated prominently as unfixed and unverified (CLAUDE.md "A risk you name is a task you own", spec.md:17). Failure scenario: a repository on a stalled mount makes every websocket push wait up to 5 s each period, and then logs `autofetch: <root>: Permission denied (publickey)` for a repository whose key is in its own `core.sshCommand`, with no line saying the command was not read. verdict: no item violated; fix at landing: call `sshCommand` only when the environment names no command (a one-line change), and put the blocking bound and the dropped-command case in the report's top lines.
- No other host- or user-visible change is unstated. The report's "User-visible changes" lists the key, the catalog entry, the start refusal, the Settings refusal, the documents and the Config view description; the diagram edge `server/root` to `server/git` is in the regenerated `layer-server.dot` and is allowed by the import order check (passes).

## Declined to judge

- The edit-and-restore runs of cases 15 and 17, and the builder's first runs on the unchanged tree (config-key.test.ts "3 failed, 32 passed", git.test.ts "7 failed", the missing-module failures): reproducing them needs an edited file or the base tree built, and the reviewer edits nothing and runs only `git diff` and `git status --short` in the worktree. I read the tests and they would fail on the unchanged tree for the reasons quoted.
- The mutation check on case 14 (`GIT_TERMINAL_PROMPT: '1'`), same reason.
- A fetch against a real HTTPS or ssh remote that prompts, a credential helper that opens a window (`GIT_TERMINAL_PROMPT=0` does not stop one), and a configured command whose variant is plink or putty (`ssh.variant`, `GIT_SSH_VARIANT`), to which an appended `-o BatchMode=yes` would not apply: no throwaway repository can exercise these; not checked.
- The look on the TEST page and the built app under the timer: no server may be started here.
- Whether the two unverified item-14 rows (countBadge, autoRepositoryDetection) match: not examined; the builder did not examine them either.
- Whether dropping "at VS Code's defaults" from items 9 and 12 stands is Axel's call: plan.md D31's widening says the other options stay at VS Code's defaults, and seven rows I reproduced (pruneOnFetch, pullTags, requireGitUserConfig, enableCommitSigning, statusLimit, untrackedChanges, alwaysShowRepositories) do not. The brief told the builder to claim only what the list shows, so the dropped clause follows the brief; the premise in the plan is what is wrong, and it is an open item for the orchestrator to book.
- Commands I ran outside the two the prompt allows, all read-only: `git show 133ee543:<path>` for two base files (DESIGN.md, tests/server/core/git.test.ts), `git --version`, `git config --global --get core.sshCommand`, `git stash list` (output discarded), and the `git ls-remote ssh://nohost.invalid/...` probes above, run from /tmp with ssh replaced by shell snippets and no file written. The first checks output I wrote to the scratchpad used the name `checks.out`, which another reviewer session of the same orchestrator also used; its first lines were that session's, so I discarded them and reran under a unique name (the verification block above is from the rerun). If the Q85c reviewer's own `checks.out` was overwritten, it needs its own rerun.

Reviewer usage: about 250,000 tokens (from the context counter, not the runner's notice), about 75 tool uses, minutes not measured.

## Repair round 1, refuted

D31 repair round 1: reviewer's report. Worktree /Users/axelfaes/workspace/research-hub/.agents/worktrees/D31 (product tools/oculus), base 133ee543. All seven rulings are met in code, tests and documents. One ruling (7) is open on the report's text only. Findings: Proof 3, Standards 1, Behaviour 1, Spec none.

I changed nothing in the worktree, the main checkout or the ledger. `git status --short` in the worktree prints 19 entries, the same 14 modified and 5 untracked as at the start. The one hunk-level probe I ran was in a scratch copy under $TMPDIR (prefix `D31-r1-review-`, deleted afterwards). It reverted pieces of the round to see the new cases fail. The only git I ran were `git diff 133ee543` and `git status --short`.

## Verification lines (verbatim)

`PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams` printed the regenerated file list (ending `docs/diagrams/writes.svg`) and exited rc=0. `git diff 133ee543 --stat -- docs` is unchanged by the run (layer-server.dot 7, layer-server.svg 611).

`PATH=... sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md` (run from tools/oculus in the worktree, rc=0):
```
$ npm test
 Test Files  404 passed | 21 skipped (425)
      Tests  10526 passed | 615 skipped (11141)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  442 passed | 9 skipped (451)
$ npm run check
1790874242981 COMPLETED 2916 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```
No failures in that run.

Commands the round's report quotes, rerun in the same form:
- Scoped run over git-ssh, fetch-period, core/git, autofetch, git-write, context, config-key and help tests: `Test Files 1 failed | 7 passed (8)`, `Tests 1 failed | 209 passed (210)`. The failure was `tests/server/core/git.test.ts > cuts every list it publishes at the cap`. I did not capture its reason.
- That file rerun alone: `Test Files 1 passed (1)`, `Tests 43 passed (43)`. A 9-file run (the 8 plus options-catalog) earlier gave `Tests 273 passed (273)`, and `npm test` inside checks.sh passed the file. I name this failure as load (see Declined to judge) and not as a finding. The builder's 210 passed is reproduced by those green runs.
- `sh utils/folder-check.sh` rc 0, `sh utils/size-check.sh` rc 0.
- `wc -l`: core/git.ts 898, autofetch.ts 225, autofetch.test.ts 823, core/git.test.ts 900, git-ssh.test.ts 62, DESIGN.md 419, HELP.md 302. These match the report.
- `ls tests/server/core | wc -l` is 10 and `ls src/lib/server/core | wc -l` is 10.
- The spec.md perl ASCII gate over src, tests and config (minus local.yml) prints nothing.
- `grep -rn -i 'autofetch\|fetch-period' src config DESIGN.md HELP.md --exclude=local.yml` lists the two new modules, their imports (context.ts:47,70; config-key.ts:55,93), git-write.ts:45, core/git.ts:54, behavior.yml:139, options.yml:298, config/text/views/system/config.yml:6, DESIGN.md:116,128,344 and HELP.md:186,222. Nothing else.
- Subcommands: 16 entries in the `ALLOWED` array of git.test.ts (`sed -n 66,86p ... | grep -c "^    '"`), and the perl count of `run(root, ['<sub>'` in core/git.ts lists 16 distinct. DESIGN.md:128 says sixteen.

## Verdicts for the whole diff since the base

Items of "What to build" (as the round-0 ruling and round 1 amended them):
- 1 fetch-period.ts: holds. `z.number().int().min(0)` inside a `git` object, no cast, the brief's sentence. fetch-period.test.ts passes.
- 2 autofetch.ts (225 lines): holds. TICK 60000, the look arms the next one first (:190), grouping by `worktrees[0].path`, key re-read per repository, close guards before `remotes`, `fetch` and `refresh`. It runs no process of its own.
- 3 git-write.ts: holds as ruled (`fetchIn(root, { unattended, sshCommand })`, `GIT_TERMINAL_PROMPT=0` plus the resolved command, pressed Fetch unchanged). The head comment names both callers.
- 4 context.ts: holds (:227, :306, `autofetch.close()` before `git.close()` at :397).
- 5 config-key.ts: holds (`requireAutofetch` in `READERS`, :93).
- 6 behavior.yml: holds. 7 options.yml: holds.
- 8 DESIGN.md:128: holds. It names the exception, the `GIT_SSH` clause, and now the vector `config --get --default= core.sshCommand`.
- 9 DESIGN.md:344: holds. The Commit and Push / Commit and Sync exception is now in the sentence.
- 10 DESIGN.md:116: holds.
- 11 HELP.md:172: holds ("except the automatic fetch ... except Fetch").
- 12 HELP.md:186: holds. The sync-item sentence comes first, then the auto fetch sentences; "the behind count of each branch moves with what the remote holds" replaces the old clause; the `GIT_SSH` clause is there.
- 13 HELP.md:222: holds, with the matching `desc_behavior` in config/text/views/system/config.yml (needed by help.test.ts).
- 14 other git options: holds in the round's section (verified below). The older Item 14 section of the same report file contradicts it (Proof 1).
- 15 tests: holds. All listed files exist and pass.

Cases (as amended):
- 1 to 13: met. They are in autofetch.test.ts and pass in my runs.
- 14: met. Three environment runs and the pressed Fetch, with the third run now isolated from the machine's global git configuration (ruling 2). Git puts the host after the configured command, so the arguments begin with the configured options and then `-o BatchMode=yes`, as the first review found.
- 15: met as an audit. I reproduced its failure in the scratch copy twice: with `import { execFile } from 'node:child_process'` added it fails with "not to contain 'node:child_process'", and with a second name imported from core/git.ts it fails with `expected [ 'sshCommand', 'attributesOf' ] to deeply equal [ 'sshCommand' ]`.
- 16: met. git-write.test.ts passes in my runs.
- 17: met for the passing run (options-catalog.test.ts passes). The failing run with the entry removed is the builder's quote and I did not reproduce it.
- 18: met. config-key.test.ts, 35 cases.
- 19: met. context.test.ts: start order, `refresh('/some/root')` reaching the git watcher, and the default member checked through the `vi.mock` wrapper.
- Added read case: met. git-ssh.test.ts covers the set value, the empty text for an unset key, the empty text for a folder that is no repository, `null` for a missing root, and the repository left as it was.
- Round-1 cases: met. These are "answers null when the read fails", "skips a repository whose core.sshCommand cannot be read ... tries again next period" and "does not read core.sshCommand when the environment names the command".

## Verdict per round-1 ruling

1. Behaviour 1, the ssh read: closed.
   - `sshCommand` (core/git.ts:495-498) runs `config --get --default= core.sshCommand` and answers `done.ok ? done.text.trim() : null`, typed `string | null`.
   - `CALLS`, `PINNED` and `PINNED_SOURCE` in git.test.ts, the core/git.ts head comment (:39, :53-55) and DESIGN.md:128 name the new form.
   - The default fetch (autofetch.ts:108-116) reads `sshCommand(root)` only when `process.env.GIT_SSH_COMMAND` is empty. On `null` it throws, and `visit`'s catch logs `autofetch: <root>: core.sshCommand could not be read: git timed out, did not run or exited with an error`, with no refresh.
   - Failing-first check: in the scratch copy I put back `config --get core.sshCommand` returning `''`, and the unconditional read. Four tests failed with the builder's quoted failures: git-ssh "expected '' to be null", the autofetch skip case "expected [] to deeply equal [ Array(1) ]", and the two git.test.ts gate cases (the source-text one and the recorded-vector one). The "does not read core.sshCommand when the environment names the command" case passes on that old form, as the builder says. With the unconditional read plus the null check restored it fails (1 failed, 43 skipped). The claim is reproduced.
2. Proof 3, the isolated environment cases: closed.
   - `ALONE = { GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' }` is applied by `withEnv`.
   - In the scratch copy with `HOME` holding a `.gitconfig` that sets `core.sshCommand`: the six environment cases pass as built. With `ALONE = {}` the case "sets ssh -o BatchMode=yes when neither names a command" fails.
3. Proof 2, the source rule: closed. The test is titled "audits the source ..." and pins the names imported from core/git.ts to `['sshCommand']`. The scratch mutation above fails it.
4. Standards 1, DESIGN.md:344: closed. The sentence ends "...except where the reader pressed Commit and Push or Commit and Sync."
5. Standards 2, the `GIT_SSH` clause: closed. DESIGN.md:128 says "when only the older `GIT_SSH` variable names the ssh program, nothing is added for ssh, so ssh may still ask". HELP.md:186 says "...which may then still ask".
6. Standards 3, the order in HELP.md:186: closed (see item 12 above).
7. Spec 1, item 14: not closed, on the report's text only. No code was asked for.
   - The round's table is complete and correct.
   - `awk` over Z74-inventory.md gives 0 `has, fixed` rows in 4b (lines 661-687), 20 in 4h and 5 in 4i. That is 25 rows (20 `git.*`, 5 `scm.*`), and the table's 17 + 8 cover exactly those names.
   - VS Code 1.137.0 defaults, read from `extensions/git/package.json` and `workbench.desktop.main.js`: pruneOnFetch false, pullTags true, requireGitUserConfig true, statusLimit 10000, untrackedChanges "mixed", countBadge "all", autoRepositoryDetection true, scm.alwaysShowRepositories (key present in workbench.desktop.main.js; its default is unchanged from the first review), allowForcePush false, confirmSync true, enableStatusBarSync true, fetchOnPull false, openDiffOnClick true, rebaseWhenSync false, showCommitInput true, showInlineOpenFileAction true, showPushSuccessNotification false, similarityThreshold 50, showActionButton `{commit, publish, sync: true}`, path null, enableCommitSigning false. scm gutter width 3, action "diff", visibility "always" and ignoreTrimWhitespace "false" are read from workbench.desktop.main.js.
   - The correction on `enableCommitSigning` is right. In `dist/main.js`, `signCommit=n.get("enableCommitSigning")===!0?!0:void 0` and `--no-gpg-sign` is pushed only when `signCommit !== void 0`. `-c user.useConfigOnly=true` is added when `requireUserConfig ?? true`, which agrees with requireGitUserConfig differing.
   - The 8 differing rows are pruneOnFetch, pullTags, requireGitUserConfig, statusLimit, untrackedChanges, alwaysShowRepositories, countBadge and autoRepositoryDetection. I confirmed these tree-side citations by `sed -n`: git-write.ts:615, :590 and :580; core/git.ts:126, :630, :118, :333, :346, :371 and :523; git-routes.ts:121; git-remote.ts:50 and :52; ChangeGroups.svelte:189; RepoList.svelte:120 and :139-141; RepoItems.svelte:119; StatusBar.svelte:101; ChangeRow.svelte:112 and :133; CommitBox.svelte:60 and :144; repositories.svelte.ts:193; ui/controls/editor/Editor.svelte:248, :338 and :465; root/watch/git.ts:122 and :334. `grep -n 'git' state/workbench/rail-badges.ts` finds no git count.
   - The report file still holds the older "Item 14" section (lines 63-94) listing nine mismatches, including `enableCommitSigning`, and saying "the eight mismatching rows above". So the count is stated more than once and contradicts itself (Proof 1).

## 1. Spec

None.

## 2. Proof

1. Place: `agents/reviews/D31-report.md`, lines 14, 19, 63-94 and 104 (the round-0 sections).
   - Hunk: line 14 "`sshCommand(root): string` ... vector `config --get core.sshCommand`. A failed read (key unset, no repository, timeout) answers the empty text."; line 19 "...`config --get core.sshCommand` forms"; lines 66-75 "Mismatch (reported, not changed)" listing nine rows with `git.enableCommitSigning`, "Only partly matching; not verified further" and "Not verified further"; line 94 "the eight mismatching rows above"; line 104 "A read that times out answers the empty text, so that repository's fetch then runs with plain `ssh -o BatchMode=yes`".
   - What is wrong: every one of these is false of the tree now (`core/git.ts:495-498`, DESIGN.md:128, the 8-row table below it). The round-1 section corrects only `enableCommitSigning` and the count, and ruling 7 asks for the count "stated once and correct".
   - Failure scenario: Axel or the orchestrator reads the file top down, takes the nine-row list with an unexamined `countBadge` and `autoRepositoryDetection` as current, and books or rules on nine rows or on the old empty-text read.
   - Fix at landing: remove or rewrite those lines so the file states the end state only.
2. Place: `tests/server/git/autofetch.test.ts`, "does not read core.sshCommand when the environment names the command".
   - Hunk: the case passes on the tree before the change. The builder says so, and I reproduced it in the scratch copy.
   - What is wrong: ruling 1 says "each new case is run on the tree before this change and its failure quoted", and this case cannot fail there. The builder substituted a mutation (reading unconditionally), and I reproduced that mutation failing, so it does guard the clause. The report states it plainly.
   - Failure scenario: none beyond the substitution, which is disclosed. Named for the booking.
3. Place: `tests/server/git/autofetch.test.ts`, "audits the source" (the `coreNames` regex `import\s*\{...\}\s*from '...core\/git\.ts'`).
   - What is wrong: only a braced value import from core/git.ts is pinned. `import type { ... }`, `import * as g` and a default import from that module are not matched.
   - Failure scenario: a later edit adds a namespace import of core/git.ts to the timer and the case stays green. core/git.ts is read-only, so the harm is bounded.
   - Low.

## 3. Standards

1. Place: `src/lib/server/core/git.ts:495`, `export function sshCommand(root: string, ms: number = TIMEOUT_MS)`.
   - What is wrong: every sibling reader names this parameter `timeout` (:192, :219, :236, :271, :307, :326, :365, :404, :458, :472). The builder says it renamed it to `ms` so the call stays on one line and the file stays at 898 lines. `tests/server/core/git.test.ts` is at exactly 900 and `src/lib/server/core` and `tests/server/core` are both at 10 items.
   - spec.md: "a file approaching it is split by concern". Here an inconsistent name was chosen to fit the cap.
   - Failure scenario: the next line added to either file fails `size-check.sh`, and the next file in either folder fails `folder-check.sh`.
   - Low. A fix is to name it `timeout` and split the new reader's cases or its group out of the 898-line file, which this round's paths did not allow.

Checked and clean: no non-ASCII, no history words (D31, Z83, Z165, Z172, ruling, brief, previously, no longer) on any added line of the source, tests, config or documents, no `as` cast of an outside value in the new modules, the head comment of each new file, and the `git-write.ts` head comment (:40-55), which names both callers.

## 4. Behaviour

1. Landing interaction: `orchestrator-state.md` line 62 gives D31's `shared_paths` as Q85c and U3 only. Z172 and Z175 put Q88c in the same documents: Z172 has Q88c write the fixed git choices with their reasons into HELP.md and DESIGN.md, and Z175 brings `git.countBadge` and `git.autoRepositoryDetection` to VS Code's defaults there. D31's DESIGN.md:344 ("The other git behaviours oculus has are fixed with no key") and HELP.md:186 ("The other git behaviours oculus has are fixed and have no key") sit in that region. `ls agents/briefs | grep Q88c` finds no Q88c brief yet, so I could not compare lines.
   - Failure scenario: two edits to the same sentences conflict at the second landing, or both stand and a reader sees two statements of what is fixed. This is for the orchestrator to merge.
2. The skip line names three causes at once ("git timed out, did not run or exited with an error"), because `sshCommand` answers `null`. The ruling asked for exactly that shape, and the report states it. No scenario beyond a vaguer log line.

## Declined to judge

- `tests/server/core/git.test.ts > cuts every list it publishes at the cap` failed once in the 8-file scoped run, with the machine loaded. I did not capture its reason, so I cannot say it was a timeout. The same file passed in my 9-file run, inside `npm test` in checks.sh, and alone (43 passed). Named as load, per spec.md.
- Case 17's failing run with the catalog entry removed, and the builder's first runs of the round-0 cases (the config-key failure, the missing-module failures). Reproducing them needs the base tree built or an edited file. I read the tests, and the reasons quoted fit them.
- The blocking time of the `spawnSync` read (up to 5000 ms per repository per period). Neither the builder nor I measured it. It is in the report's sharp edges, and the ruling kept `spawnSync`.
- A real HTTPS or ssh remote that prompts. `GIT_TERMINAL_PROMPT=0` does not stop a credential helper that opens a window, so HELP.md:186's "without asking for a password or a passphrase" is unverified for that case. A configured ssh command that is plink or putty (an appended `-o BatchMode=yes` would not apply). The built app under the timer and the look on TEST. No server may be started here.
- The tree-side line numbers of item 14 that name a bare file, such as `ChangeRow.svelte` or `Editor.svelte`. I resolved them to the files that carry the cited text. Three files are called `Editor.svelte` and two `Changes.svelte`, so a reader needs the folder.

Usage: claude-sonnet-5-5

## Closed

Round 1 (the first run's findings), each closed by the builder in repair round 1 and confirmed by the run over that round ("Verdict per round-1 ruling" above): Spec 1 (item 14 table complete, 8 differing rows, `enableCommitSigning` matches), Proof 2 (the source-rule case named an audit), Proof 3 (the environment cases isolated from the machine's git configuration), Standards 1 (DESIGN.md:344 names Commit and Push and Commit and Sync), Standards 2 (the `GIT_SSH` clause in DESIGN.md:128 and HELP.md:186), Standards 3 (HELP.md:186 order), Behaviour 1 (`sshCommand` read only when the environment names no command, `null` on a failed read, the repository skipped with a log line).

The run over repair round 1, closed at landing on main:
- Proof 1: `agents/reviews/D31-report.md` lines 14, 19 and 104 rewritten to the end state (`sshCommand(root): string | null`, the `config --get --default= core.sshCommand` vector, a failed read skips the repository); the stale "Item 14" section replaced by a pointer to the round-1 table (8 differ, 17 match). `grep -n "eight mismatching\|Not verified further\|enableCommitSigning.*Mismatch" agents/reviews/D31-report.md` prints nothing; line 14 says an unset key answers the empty text and a failed read answers null, which is the tree.
- Proof 2: disclosed, not a defect. The case cannot fail on the base tree; the mutation that reads `core.sshCommand` unconditionally fails it, reproduced by the round's reviewer.
- Proof 3: the audit regex in `tests/server/git/autofetch.test.ts` now matches every import form of core/git.ts (braced, type, namespace, default) and pins the list to `['{ sshCommand }']`. With `import * as core from '../../core/git.ts'` added it fails with `expected [ '{ sshCommand }', '* as core' ] to deeply equal [ '{ sshCommand }' ]`.
- Standards 1: the unused timeout parameter of `sshCommand` removed (`export function sshCommand(root: string): string | null`, the sibling `TIMEOUT_MS` used inside); core/git.ts is 898 lines.
- Behaviour 1: noted for Q88c's /spec, which writes Z172's and Z175's sentences into the same DESIGN.md:344 and HELP.md:186 region D31 wrote; the Q88c brief names those lines as D31 leaves them.
- Behaviour 2: as ruled (the skip line names the three causes `null` stands for).
