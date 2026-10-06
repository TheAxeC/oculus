Brief check of D31 (brief `tools/oculus/.scratch/migration/agents/briefs/D31.md`, tree on main at 0bd4c1d5). I changed nothing. I never opened or grepped `config/local.yml`.

## Names

Command: `grep -rn -i autofetch src config tests DESIGN.md HELP.md --exclude=local.yml` from `tools/oculus` prints nothing (exit 1). `grep -rIl -i autofetch <hub root> --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=worktrees --exclude=local.yml` lists only `.scratch/migration/{choices.md,plan.md,orchestrator-state.md,agents/briefs/D31.md,agents/reviews/Z74-inventory.md}`. `grep -rnw TICK src tests config` prints nothing. `requireAutofetch`, `watchAutofetch`, `autofetchMinutes` and `autofetch.ts` do not exist on the tree. The new names collide with nothing.

Hits outside "Paths this step writes" that the change makes false, or that the brief leaves unaddressed:

1. **`HELP.md:172` is not in the paths and becomes false.** The text is "Every write runs only from a press on the page, and one that throws work away or reaches a remote asks first." After D31 a fetch (a write) runs from a timer. The brief edits HELP.md only at :186 and :222. Fix: add `HELP.md` line 172 to the paths and add a "What to build" item that rewrites the sentence. The sentence also says a write that reaches a remote asks first, which already does not hold for Fetch (`git-routes.ts:117`, `CONFIRMED` omits `fetch`).
2. **`git-write.ts:40-41` has a second sentence that item 5 does not cover.** The comment reads "Nothing here is reachable from a watcher, a timer or the socket. The one caller is server/git-routes.ts, which answers POST /api/git only for ...". After D31, `server/root/watch/autofetch.ts` is a second caller of `fetchIn` and `remoteNames`, so "The one caller is" is false. Item 5 names only the first sentence. Item 5 must also rewrite "The one caller", at lines 40-43 of the file.
3. **`git-write.ts` has two more sentences about who calls it, which item 5 does not mention.**
   - Lines 50-51: "A root is refused unless the last published `git` payload names it ...". This still holds for `fetchAll`. The new caller bypasses `permitted` by calling `fetchIn` directly (decision 8). The comment should say the timer relies on the payload instead of `permitted`.
   - `git-write.ts:589` (the `fetchIn` doc comment, "The one `fetch` call site") stays true.
4. **`DESIGN.md:128` has other false-after-change content beyond the "no watcher, timer or socket reaches it" clause.** It says "A write runs only from POST /api/git carrying the write token ... and one that ... reaches a remote also carries the confirm" and "Every write is `server/git/git-write.ts`'s ... `git-remote.ts`, `git-index.ts` and `git-refs.ts` beside it reach git only through those call sites". Item 6 rewrites only the final clause. The "A write runs only from POST /api/git carrying the write token" sentence is false for the timer's fetch (no token, no POST), so the rewritten text must carve that out too. The same applies to the first clause of `DESIGN.md:344` ("when the reader presses the control for it, behind the write token").
5. **`DESIGN.md:351` says "Live data: one WebSocket with channels, the server watches and pushes; no polling."** This is about page data, so it is not false, but the new timer is a server-side poll of a remote. Judge in DESIGN whether the sentence needs a clause. Flagged, not claimed false.
6. **`DESIGN.md:116` (Watchers) and the `server/root/watch/` folder.** `autofetch.ts` is the sixth module in `watch/` but owns no channel and no `fs.watch` handle. DESIGN.md:116 describes "each channel has one watcher module". The brief does not say where the new module is described in DESIGN.md besides the exception sentence. Say whether :116 is left alone.
7. **`HELP.md:186` ("Everything except Fetch asks first")** stays true.
8. **`HELP.md:112` and `DESIGN.md:390`** list Fetch only as a press, and both stay true.
9. **Not affected (verified by grep):** the head comments of `deposit.ts:19` and `deposit-git.ts:22` ("Nothing here is reachable from a watcher, a timer or the socket") are about the deposit modules, which the timer does not touch. `git-routes.ts` and `git-remote.ts` head comments stay true. `git-message.ts` is only a pattern reference.
10. **The `git:` block comment of `behavior.yml:135`** ("The Changes view asks this model for a suggested commit message...") describes `message_model` alone. Item 3 says the "comment line" should say what the new key does. The result must be one line per paragraph, so the builder needs to be told to extend or add a second comment line.
11. **No other hit** in the other documents. Outside `.scratch`, nothing else names these identifiers.

## The step line

Plan line D31 (`plan.md:418`) and its widening and step-0 sub-bullets (`plan.md:419-420`):

- The key `git.autofetch_minutes` with default 0 maps to items 1, 3, 4. The clause "0 meaning off and the default" has cases 1 and 5.
- "`git fetch --prune` runs in each repository with a remote at that period" maps to item 1 (the round). Cases 2, 3, 12 cover it.
- "nothing else touches the network" has no item that builds or tests it. Item 1 does not forbid anything and the only check is case 13 (an audit, per the brief's own verify item 4). Case 13 would pass unchanged with a second network call added, because it greps `git-write.ts` for `run(root, [...` only. Part with no item that could fail: **"nothing else touches the network"**.
- "other git options stay at VS Code's defaults as X3d built them" maps to item 7's DESIGN.md sentence and item 8's HELP.md sentence. The brief never states which options those are, and does not check the claim against the tree. The Z74 inventory table (`agents/reviews/Z74-inventory.md` lines 1004-1044ff) lists many `git.*` rows as "missing" or "fixed", not as "VS Code's default". A sentence saying "every other git option is VS Code's default" is a claim about state the brief does not back with a command. Name the checked options, or say "not verified".
- "nothing pushes after a commit, said in DESIGN.md and HELP.md" maps to items 7 and 8. A grep for `postCommit|push after|after a commit` in src, DESIGN.md and HELP.md finds nothing, so the statement is true on the tree today. The brief does not add a check for it.
- Z165 (a) maps to items 5, 6, 7. Z165 says the exception covers only `git fetch --prune`. The timer also runs `git remote` first (item 1), which is read-only. Item 6 names it; item 7 and item 5 should too, or Z165's "runs only `git fetch --prune`" is misquoted.
- Z83 (a) = the key and default: items 3, 4.
- "Settings (2026-09-30)" (`plan.md:601`): an option becomes a config key only where the right answer differs between files, repositories or languages, or is a taste Axel wants to change. D31's key is a Z83 ruling, so it is outside that test. No clash.

## Premises

I reran every reference in "What is on the tree".

- Confirmed by command: `grep -rn -i autofetch ...` prints nothing. `git-write.ts:86` (`PUSH_TIMEOUT_MS = 60000`), `:155-160` (`allowedRoots`), `:591-593` (`fetchIn`, doc at :590), `:596-598` (`remoteNames`, doc at :595), `:40-45` and `:50-51` comments, `git-remote.ts:39-43` (`fetchAll`), `DESIGN.md:128` and `:344` quoted text, `model-sessions.ts:546` (`GitPayload`) and `:538` (`repository: boolean`), `core/git.ts:602` (`remotes` filled only where no upstream and not detached), `watch/git.ts:441-452` (`refresh`, `close`), `channels.ts:59` (`latest`), `index.ts:224` (`ConfigPayload`), `portfolio.ts:330-345`, `file-poll.ts:28-37` (`Clock`, `systemClock`), `context.ts:165-185`, `:222`, `:294`, `:389`, `context.test.ts:72,108`, `git-message.ts:38-48`, `settings.ts:141-151`, `behavior.yml:134-137`, `options.yml:294-297`, `HELP.md:184-186`, `:222`.
- Folder sizes: `ls src/lib/server/git | wc -l` = 10, `tests/server/git` = 7, `tests/server/root` = 10, `tests/server/root/watch` = 10, `src/lib/server/root/watch` = 5. They match the brief.
- ADRs: `ls docs/adr` fails, `grep -n '^adr' orchestrator-state.md` exits 1.
- Wrong or unsound:
  1. **`git-routes.ts:111-115` is the doc comment of `CONFIRMED`; the array is at :117.** The statement (fetch asks no confirm) is true. Cosmetic.
  2. **`context.ts:205-399` end line:** `sed -n 399p` prints a blank line. `createServerContext` ends earlier. Cosmetic.
  3. **Premise bullet 18 says the zod-read key pattern is `git-message.ts` and the start-stop pattern is `settings.ts`.** True. But `src/lib/server/edit/writes/config-key.ts` also holds `READERS` (see Cases, item 1 below). The brief does not mention this file anywhere.
  4. **Premise "`GitState.remotes` ... cannot say whether a repository has a remote" is correct** (`core/git.ts:602`).
  5. **`utils/folder-check.sh` counts tracked or untracked-not-ignored files.** `tests/server/git` goes from 7 to 8, fine.

## Cases and checks

I read every case against `agents/spec.md`.

1. **Wrong-value start check and the Settings write path (missing item, not an inconsistency with a case).** The spec says a settings key is read from config and its reader must hold. `config-key.ts:81-93` (`READERS`) is "the checks the server makes when it starts"; `requirePaintLimit` and `changesKeep` are in it so that a Settings write of a bad value is refused (`config-key.ts:7-20`). Brief item 2 adds `requireAutofetch` to the server start only. A Settings write of `git.autofetch_minutes: -1` (control `number`) will land and the next server start throws. Item 4's description says "a value that is not a whole number of 0 or more stops the server at start", so the Settings view will let a reader brick the server. Also, `config-key.ts` is in `server/edit`, which sits below `server/root` in `tests/checks/imports/order.ts:46-57`, so it cannot import `server/root/watch/autofetch.ts`. The reader therefore cannot live in the module the brief names; it must live in `server/edit`, `server/machine`, `server/content`, `server/files`, `server/core`, or in `data/` (Q85c's, in flight). `server/git` is above `server/edit` too, so `git-message.ts` is not importable by `config-key.ts`. The brief must move `autofetchMinutes` and `requireAutofetch` to an importable folder, add the `READERS` entry, put `config-key.ts` and `tests/server/edit/config-key.test.ts` in the paths, and add a case "a Settings write of -1 to `git.autofetch_minutes` is refused". Verify command: `sed -n 81,93p src/lib/server/edit/writes/config-key.ts`.
2. **Case 6 and 7 versus the existing context test config.** `tests/server/root/context.test.ts` builds its `loadConfig` stub (`:46-62`) with no `git` key. Case 6 says a missing `git.autofetch_minutes` is null, and item 2 makes `requireAutofetch` throw on null. Every existing case of `createServerContext` in that file will throw once item 2 lands unless the stub gains `git: { autofetch_minutes: 0 }`. Item 10 says only "gains the start and close of the new member and the start refusal". Name the stub change in item 10. Two further files import `createServerContext`: `tests/server/root/server-args.test.ts` (verified by `grep -rln createServerContext src tests`, it only imports `parseEngineArgs`, no call) and `src/server.ts`, `vite-plugin.ts` (real config, which carries the key after item 3).
3. **Case 7, `createServerContext` over -1.** The `loadConfig` stub is the way to test it. Fine, with the stub change in finding 2.
4. **Case 13** is an audit as the brief says. It also depends on `git-write.test.ts`, which is tagged `// @module-tag slow` (`git-write.test.ts:11`; `package.json:12-14`). `npm test` and `test:checks` exclude it, and `checks.sh` (7 commands) does not run it. Verify item 2 runs it directly with `npx vitest run <path>`, which bypasses the tag filter. The spec (line 53 and line 67) says the file's timeouts on a loaded machine are not the step's. The brief says "Case 13 ... still passes unchanged" without saying a timeout there is a named non-finding rather than a failure. State it.
5. **Case 14, "with the entry taken out it fails naming `git.autofetch_minutes`"** is a manual run on a changed copy. The builder is told never to run git, so the revert has to be an edit to the tracked file, rerun, and restored. Say that the removal is done by editing the file and restoring it, with both runs quoted. Not inconsistent with the rules, but unstated.
6. **Case 12 and the rules file:** a real fetch in a temp folder is allowed (spec line 35 allows synthetic fixtures in the temporary directory). `repos.ts` has `repositoryIn`, `gitText`, `tryGit` but no helper to make a bare repository or a clone; the case must run `init --bare` and `clone` through `gitText`, whose `-C root` is confined to the temp dir. Fine. Real `fetchIn` uses `process.env` (`git-write.ts:122`), so the test inherits the machine's git config; consider `GIT_CONFIG_GLOBAL` unset. Not a blocker.
7. **Case 15, first clause (root with a space):** with injected `fetch`/`remotes` the argument-list claim is not exercised. It needs the real `fetchIn` (case 12 form) on a root path with a space. The brief does not say which. Say it is a second real-fetch case.
8. **Case 4 versus "period":** a round that outlasts the period. Fine.
9. **Spec line 60, "every asynchronous path is exercised in flight, after close, and superseded by a later one":** in flight is case 4; after close is case 10; superseded is case 15 (two config messages). Not covered: the key changing to 0 or to a bad value while a round is in flight (item 1 says only `close()` stops a round). See Implied inputs.
10. **Spec line 49 and "TICK = 60000 exported":** a cadence hardcoded beside no config key. `watch/git.ts` has `THROTTLE = 2000` and `POLL = 500` as precedent. The rule "a value that has a config key (a host, a port, a cadence ...) is never hardcoded" does not apply because TICK has no key, but decision 2 is silent that TICK is a fixed constant. List it among the decisions.
11. **Spec line 40, no history in comments** and "comments say what and why": item 1's head comment instructions are fine. Item 5's required text should avoid naming "D31" or "Z165"; the brief's text for item 5 does not.
12. **Spec line 45 (user-facing strings through `t()`)**: the log lines `autofetch: ...` go to stderr, not the page (decision 6). Fine.

## The question

For each case and each build item: could it pass without the goal (auto fetch at a period, only `fetch --prune`, only with a remote, off by default) being reached?

- **Case 1 (key 0, no calls):** passes also when the module does nothing at all. It does not need the module to ever fetch. It pairs with case 2.
- **Case 2:** needs real periodicity only if `now` and `clock` are injected correctly. It can pass with a `fetch` stub that is never wired to `fetchIn`/`remoteNames`. Case 12 is the only case that reaches the real call sites, and it calls "one round" directly, not through `createServerContext`. No case runs `createServerContext` (with the real `watchAutofetch`) over a real repository, so the wiring `refresh: (root) => git.refresh(root)` and the start in `context.ts` could be wrong and every case would still pass except the context test, which replaces `watchAutofetch` with a recorder. Add one case: the real `watchAutofetch` built by `createServerContext` with the default dependency, no `watchAutofetch` replacement, over a stub `git` message and `config` message, one tick fires one `remotes` call.
- **Case 3:** passes if the module fetches nothing at all.
- **Case 4:** passes with a module that never starts a second round for any reason (for example a stuck flag). It does not prove rounds resume after settling. The second half ("until it settles") needs an assertion that a round starts after the settle.
- **Case 5:** passes if the module reads the config only once at start for the "0 to 2" half? No: it asserts a round at the next tick, so it needs live reads. For "2 to 0: no round after", a module that stops after any config message passes.
- **Case 6:** the once-only log line can pass when the module logs nothing and the case only asserts "log once"; the case needs `toHaveBeenCalledTimes(1)`, and the "resumes with 3" half needs a round to happen. OK as written.
- **Case 7:** passes without the goal; it tests the reader.
- **Case 8, 9, 10, 11:** each can pass with a no-op module except 9 (`refresh` called after each fetch) and 8 (second root fetched after a failure), which need a working round.
- **Case 12:** the only real-git case. It would still pass if the timer never fires, because it calls "one round" (how the builder runs a round is unspecified: via `watchAutofetch` with a manual clock or via an exported function). Item 1 exports no `round` function, so the case must go through `watchAutofetch` with an injected clock, `now`, hub messages, and the default `remotes`/`fetch`. Say so.
- **Case 13:** audit, as the brief says. It cannot fail if the new module runs a different network command through its own `execFile` (the gate only greps `git-write.ts`). The `ran nothing but` gate records spawns only inside `git-write.test.ts`'s own process mock. The goal "nothing else touches the network" has no test that fails if the module adds a call. A cheap one: a test that greps `autofetch.ts` for `node:child_process` and for `run(` (as `git-write.test.ts:578-584` does for the siblings), or a vector assertion in case 12.
- **Case 14:** passes without the goal; it tests the catalog.
- **Item 1 (module):** can pass the cases and still not work at run time: `watchAutofetch` could be correct and never be started (item 2 tests start via replacement only).
- **Item 2 (context):** the start refusal and member replacement can pass while the default dependency is wrong (typo, wrong `refresh` closure), since the test replaces it.
- **Items 3, 4:** `options-catalog.test.ts` checks key and entry parity only. It does not check that a default of `0` equals what the reader treats as off, nor the description's words (the test's own head comment says so). Item 3 and 4 can pass with a description that states a wrong period unit.
- **Items 5 to 9 (text):** nothing checks them except a `grep` list in verify item 3. A text step can pass with a sentence that is false (finding 1 of Names).
- **Verify item 4** ("each new or changed test of a behaviour the change adds fails on the unchanged tree") is the right guard; it needs the module to exist, so on the unchanged tree the new test file fails on a missing import, not on the behaviour. For the cases to fail "on the behaviour" the builder must write the first-run harness against the exported names; the brief's "first run on the unchanged tree" will always be a missing-module error. Say what "the first run" means for a new module (a missing-import failure per case), or the builder will invent a stub.

## Implied inputs

Missing from "Cases", each with its expected result:

1. **Settings write of an invalid value** to `git.autofetch_minutes` (-1, 1.5, "5"): refused by `writeConfigKey` with the reader's sentence; nothing written. Requires the `READERS` entry (Cases finding 1).
2. **`createServerContext` with the stub config lacking `git`:** the shared stub of `context.test.ts` must carry the key; expected: the existing cases pass again (Cases finding 2).
3. **`fetch` or `remotes` that rejects (throws) instead of answering `{ok:false}`:** expected: logged as `autofetch: <root>: <error>`, the next root still fetched, the "round running" flag cleared, the next period tries again. Item 1 defines "failed" only as a non-ok outcome; a rejection leaving the flag set would stop all rounds forever.
4. **A repository whose fetch hangs to its 60 s timeout** (`PUSH_TIMEOUT_MS`, `git-write.ts:86`): with a tick of 60 s and a period of 1 minute, a round is still running at the next tick, so no second starts; expected: after the timeout `fetch` answers `{ok:false, error:'git timed out'}`, one log line, the round continues to the next root. This is case 4 with a real timeout; test it with an injected never-settling then rejecting fetch, and say the real 60 s is not waited for.
5. **Credential or passphrase prompts:** `fetchIn` runs with `process.env` and no `GIT_TERMINAL_PROMPT=0`/`BatchMode` (`git-write.ts:122`; `grep -n GIT_TERMINAL_PROMPT src/lib/server/git/git-write.ts src/lib/server/core/git.ts` finds nothing). The hub's `origin` is `https://github.com/TheAxeC/research-hub.git` (`git remote -v`). With a timer, git may prompt on the server's terminal every period for a repository whose credential is missing. Expected: the timer's fetch never prompts. The brief does not say how: `fetchIn` has no `extra` env parameter for it, and changing `fetchIn` also changes the manual Fetch press. Decide and write the change into the brief (a `GIT_TERMINAL_PROMPT=0` env on the timer's call, or on `fetchIn`) and add a case with an HTTPS remote that would ask for a password.
6. **Worktrees and nested roots listed as separate roots:** the `git` payload has one key per root; session workspaces include worktrees under `.agents/worktrees/<name>` (e.g. the Q85c worktree exists now, `git worktree list`) and a workspace may be a subfolder of a repository. Each is `repository: true`, so a round fetches the same repository N times per period. Expected result to specify: a repository is fetched once per round, keyed by its common git directory, or the redundancy is stated as accepted. The brief neither dedupes nor says so. Also `GitState.worktrees` exists (`model-sessions.ts:515`). I did not verify how `rootsOf` treats a worktree whose workspace key is the worktree path; that is `watch/git.ts:120-130`, which shows keys are the session workspace paths. Not verified for the real payload.
7. **The hub root itself** (`always: local.hub`) is on the `git` channel and has a remote: it is fetched. Expected: fetched like any other; no case. Add the hub root as one of case 2's two roots.
8. **The dev server and the built server both running** (`createServerContext` is used by `src/server.ts:41` and `vite-plugin.ts:32`): two processes fetch the same repository at the same time; git can fail with a ref-lock error, logged once per period per root. Expected: logged, not fatal. Not covered, not a defect in the code; state it as accepted.
9. **Key changes to 0, or to an invalid value, while a round is in flight:** item 1 stops further fetches only on `close()`. Expected: stated either way, and a case. Spec line 60 requires "superseded by a later one".
10. **First tick timing:** item 1 says `tick` is the interval between two looks and decision 3 says the first round is "at the first tick after the server starts". It is unstated whether the first look is at start (when the `git` message likely does not exist yet, case 11) or after one `TICK`. With `TICK` 60000 the first fetch is 60 s after start. Expected result unspecified; case 2 says "the first tick fetches both", so the clock in the test decides. State it.
11. **Re-arm point:** one `setTimeout` "re-armed" (decision 2): before or after the round? If after, a round that runs longer than `TICK` delays the next look by the round's length, and case 4 ("the next tick comes while a round runs") cannot happen. Say which.
12. **Close during a hung fetch:** `close()` while `fetch` never settles. Expected: no further fetch, no timer, no `refresh` after close. After close the in-flight fetch's `.then` still calls `refresh(root)` unless guarded; `git.close()` follows `autofetch.close()` in item 2, and `watch/git.ts` guards `closed` in `reread` (`:205`). Specify "no `refresh` call after close" as a case (case 10 asserts only fetches).
13. **A `git` payload whose value is not an object, or a state without `repository`:** malformed `hub.latest('git')` payload. Expected: no round, no throw (`sessions/stores/hooks.ts:133-139`, `gitRoots`, is the precedent). The same file already has `gitRoots(hub)` listing the payload's roots; the new module needs `repository: true` roots, so it either reuses or duplicates that read. DRY (spec line 76): say which.
14. **A `config` payload whose `config` is missing or not a map** (`payload.config` read from `unknown`): the brief's item 1 reads "payload.config" but `Message.payload` is `unknown` (`index.ts:197`), so reading it without an `as` cast (spec: no cast of an outside value) needs a narrowing the brief does not describe. Expected: null minutes, once-log, no throw.
15. **A root that `remotes` lists with two remotes (`origin`, `upstream`):** `git fetch --prune` fetches the default remote only, as VS Code's auto fetch does for the upstream/default remote. Expected: one `fetch` call per root regardless of remote count. Add to case 2 or 3.
16. **`close()` called twice, and `close()` before the first tick:** expected: second is a no-op, no timer left (case 10 has "no timer after close" only).

## ADRs

None touch the step. Commands: `ls docs/adr` (No such file or directory), `grep -n '^adr' .scratch/migration/orchestrator-state.md` (exit 1), `find . -path ./node_modules -prune -o -regex '.*/[0-9][0-9][0-9][0-9]-.*\.md' -print` from `tools/oculus` (no output), `find . ... -name '*.md' -path '*adr*'` (no output), `ls /Users/axelfaes/workspace/research-hub/docs/adr` (does not exist).

## Declined to judge

- Whether the sentences the brief asks for in `HELP.md`, `DESIGN.md` and the YAML description are good prose: judged by reading when written, not here.
- Whether "every other git option is VS Code's default" is true for each option: the brief lists none, and the Z74 inventory table rows were not each walked. Marked not verified.
- Whether Q85c (in flight, worktree `.agents/worktrees/Q85c`) conflicts with D31: its brief's paths list (`DESIGN.md` line 148, `src/lib/data`, `tests/data`, `docs/diagrams/`) overlaps D31 only in `docs/diagrams/` (regenerated, merge-simple) and `DESIGN.md` at different lines. I did not diff its worktree. Its brief says no file under `config/` and no file under `src/lib/server`.
- How `rootsOf` and the `git` payload treat a worktree in the live payload (needs a running server; not run).
- Whether `npm run diagrams` changes `docs/diagrams/` for a new file in `server/root/watch` (not run; I was told to change nothing).

Usage: claude-sonnet-5-5 (the transcript's message.model), 159,546 tokens, 52 tool uses, 5.5 min (the completion notice).

## Closed

Each finding closed by a change to `agents/briefs/D31.md`, made by the orchestrator before the preparation commit.

- Names 1 (HELP.md:172): added to the paths and as item 11, the sentence made true for the timer and for Fetch.
- Names 2 and 3 (git-write.ts "The one caller", lines 50-53): item 3 rewrites lines 40-53, naming both callers and that the timer reads the payload rather than `permitted`; `git-write.ts:589-590` named as staying true.
- Names 4 (the rest of DESIGN.md:128 and the first clause of :344): items 8 and 9 carve the exception out of the whole sentence, no token and no confirm named.
- Names 5 (DESIGN.md:351): judged about the page's data and left, named under "What is on the tree" as staying true.
- Names 6 (DESIGN.md:116): item 10 adds one sentence there, and line 116 is in the paths.
- Names 7 to 9, 11: named as staying true or not affected, no change.
- Names 10 (the behaviour file's comment): item 6 says a second comment line.
- The step line, "nothing else touches the network": item 2's source rule and case 15, which fails with an `execFile` import added.
- The step line, "other git options at VS Code's defaults": item 14 has the builder list every `has, fixed` row of 4b, 4h and 4i against the tree, and items 9 and 12 claim only that list.
- The step line, `git remote` before the fetch: named in the Z165 premise and in items 3 and 8.
- Premises 1 and 2 (`git-routes.ts:117`, the context's line range): corrected.
- Premises 3 and Cases 1 (the Settings write's `READERS`): the reader moves to `server/core/fetch-period.ts` (item 1), `config-key.ts` gains it (item 5), case 18, both files in the paths.
- Cases 2 (the context test's stub): item 15 names the stub's `git` key.
- Cases 4 (the slow-tagged write gate): case 16 runs it by path and says a loaded-machine timeout is not the step's.
- Cases 5 (case 14's revert by edit): case 17 says the entry is taken out and put back by edits, both runs quoted.
- Cases 7 (a root with a space): case 13 holds a second real clone whose path has a space.
- Cases 9 and Implied 9 (the key changed during a round): item 2 reads the key before each repository; case 5.
- Cases 10 (TICK): decision 2 names it fixed with no key.
- Cases 11 (no step or ruling names in comments): item 2 and Conventions say so.
- The question, cases 2 and 12 (wiring and the real call sites): case 13 runs through `watchAutofetch` with the default `remotes` and `fetch`; case 19 checks the context's wiring and default member.
- The question, case 4: the case now asserts a round after the settle.
- The question, verify item 4 (a new module's first run): the brief says the first run is the failing import per test file, with no stub.
- Implied 1: case 18. Implied 2: item 15. Implied 3: item 2 and case 8 (a rejection). Implied 4: case 4 with a fetch that never settles; the 60 s timeout is not waited for. Implied 5: item 3 and decision 9 (unattended env), case 14. Implied 6: item 2 groups by the first worktree path, case 12. Implied 7: case 2 uses the hub. Implied 8: decision 6. Implied 10: decision 3. Implied 11: decision 2 and item 2 (armed at the start of each look). Implied 12: cases 9 and 10. Implied 13: item 2 (schema) and case 11; `gitRoots` not reused (decision 5). Implied 14: item 2 and case 6. Implied 15: case 3. Implied 16: case 10.
