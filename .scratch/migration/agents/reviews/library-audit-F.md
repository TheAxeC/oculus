Library audit, auditor F: server git, machine, root, sessions and transcripts

Nothing in this part is left unaudited. All 59 files are in the coverage table at the end. No file was edited and no git command was run.

## Enumeration

- Main, from `/Users/axelfaes/workspace/research-hub/tools/oculus`: `find src/lib/server/git src/lib/server/machine src/lib/server/root src/lib/server/sessions src/lib/server/transcripts -type f | sort` gives 55 files.
- The same command in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/X3b/tools/oculus` gives 56 files. `diff` of the two lists shows X3b adds `git/git-index.ts`, `git/git-reads.ts`, `git/git-refs.ts` and `git/git-remote.ts`.
- X3b's worktree is at an older head for files outside the X3b list, so every other file was read from main.
- The audit set is 55 main files plus those 4 X3b files, 59 in all. Six are read from X3b: git-index, git-reads, git-refs, git-remote, git-routes, git-write.
- Line counts come from `wc -l` on each file.
- Library facts come from:
  - `npm view <pkg> version license "time[<version>]" engines peerDependencies maintainers repository.url`
  - weekly downloads from `https://api.npmjs.org/downloads/point/last-week/<pkg>`
  - READMEs and docs read with `npm view <pkg> readme` or `curl` of the repository file
- Oculus runs Node v24.21.0 (`node --version`).
- Every server-side candidate would be imported only under `lib/server/`, so the layer rules and the theme tokens are not affected by any option below. I did not check whether adapter-node leaves a native addon external.

---

## 1. Git command running and git output parsing (the writes, the reads endpoint, the deposit)

**What oculus has**
- X3b files: `git-write.ts` 712, `git-index.ts` 257, `git-refs.ts` 136, `git-remote.ts` 96, `git-reads.ts` 154, `git-routes.ts` 300. Main files: `git-message.ts` 105, `deposit-git.ts` 329, `deposit.ts` 803, `deposit-routes.ts` 204. Total 3,096.
- `git-write.ts` holds one `execFile` call site, `run()` at lines 96-126. It uses list arguments, a 10 s or 60 s timeout, an 8 MB `maxBuffer`, an optional stdin and env, and git's first error line as the reason.
- About 25 thin wrappers sit around it (`addTo`, `restore`, `applyPatch`, `stashIn`, `tagIn`, `pullIn` and so on). There are refusals by root and path, and an enumerated subcommand list in the head comment.
- `tests/server/git/git-write.test.ts` mocks `node:child_process` `execFile` and `spawnSync` and records every argv whose stack passes through `src/lib/server/`. That record is the "one call site per subcommand" gate.
- `deposit-git.ts` has a second `execute()` (lines 133-155) for git and `gh`. `git-message.ts` has a third (`run`, lines 83-104) for `claude -p`.
- Porcelain v1 `-z` output is scanned by hand in four places in this part:
  - `git-write.ts` `tracked()` (line 681)
  - `git-write.ts` `untrackedIn()` (line 693)
  - `git-index.ts` `pairOf()`
  - `git-refs.ts` `holds()` (line 41)
  
  Separately, `server/core/git.ts` (outside this part) already parses the same output into `Row` tuples.

**Candidates**
- **simple-git 4.0.2**
  - MIT, released 2026-09-26, maintainer steveukx, no engines field, no peer dependencies. 13.8M downloads a week.
  - Covers: add, commit, push, pull, fetch, stash, tag, branch, merge, rebase, `applyPatch`, `raw`, and a parsed `status()` (it runs `status --porcelain -b -u --null`).
  - Missing:
    - Its timeout plugin is an inactivity timeout ("milliseconds to wait after last received content", PLUGIN-TIMEOUT.md), not the absolute timeout oculus sets.
    - It blocks `GIT_EDITOR` unless `unsafe.allowUnsafeEditor` is set. `rebaseIn` passes `GIT_EDITOR: 'true'` (git-write.ts:602).
    - It spawns through its own code, so the argv recorder in git-write.test.ts, which mocks `execFile` and filters on a `/src/lib/server/` stack, would stop seeing the calls. The gate would have to be rebuilt on its spawn plugin hooks.
    - It is async only; `core/git.ts` reads through `spawnSync` (line 412).
  - Would remove (estimate): 150-250 lines of `run`/`short`, the wrappers and the four porcelain scans.
  - Would stay: every refusal (`permitted`, `insideRepo`, `checkPaths`), confirm logic, conflict handling (`inProgress`, `abortMerge`, `continueRebase`), the routes, the deposit mirror gate and the `gh` calls.
- **isomorphic-git 1.42.2**
  - MIT, released 2026-09-11, maintainers wmhilton, mojavelinux, jcubic. Needs node >= 14.17. 2.0M downloads a week.
  - Pure JavaScript. It does not use the user's git installation, so it does not honour hooks, credential helpers or `pull.rebase` config.
  - Its transport is HTTP. SSH remotes were not checked.
  - Does not cover the pull, rebase and conflict flows that X3b builds.
- **nodegit 0.27.0**
  - MIT, last release 2020-07-28, native libgit2. Not usable: no release in six years, and a Node 24 build was not checked.

**Options**
- Keep the code.
  - For: the enumerated-subcommand gate and the argv recorder keep working as they are; timeouts stay absolute; reads stay sync.
  - Against: three execFile wrappers and four porcelain scans stay.
- Adopt simple-git for the writes.
  - For: removes wrappers and hand-written porcelain parsing.
  - Against: the gate test must be rebuilt, the timeout semantics change, `GIT_EDITOR` must be allowed as unsafe, and two git runners would coexist (sync core plus async simple-git).
- Adopt isomorphic-git.
  - Against: it drops the user's git config, hooks and the pull, rebase and conflict features VS Code's Source Control has.

**Recommendation.** Keep the code. simple-git's timeout model and spawn path would break the one-call-site gate DESIGN.md relies on. isomorphic-git and nodegit do not cover what oculus needs.

**Findings in this capability, separate from the library question**
1. `deposit-git.ts` `parseBranches` (lines 253-267) is identical to `core/git-parse.ts` `parseBranches` (lines 37-51). `git-write.ts` already re-exports the core one.
2. The four porcelain scans duplicate the parse in `core/git.ts`. One exported parser in `core/git-parse.ts` would replace roughly 50 lines (estimate).
3. The three wrappers `git-write.ts run`, `deposit-git.ts execute` and `git-message.ts run` repeat the same timeout, maxBuffer and first-line-error body. One helper in `server/core`, called once per module, keeps each module's single call site.

## 2. Unified diff head parsing (X3b `git-index.ts` `patchPaths` and `unquote`, about 30 lines)

**What oculus has.** `patchPaths` takes the `---`, `+++`, `rename` and `copy` heads of a patch the page cut, so their paths can be checked before `git apply`.

**Defect.** `unquote` uses `JSON.parse`, which rejects git's octal C-quoting. I made a scratch repository with a file `café.txt`, and `git diff` printed `--- "a/caf\303\251.txt"`. Given that line, the fallback produces `caf\303\251.txt`, which is not the real path. The path-inside-repository check therefore runs on the wrong string. That check only guards; git applies the patch it receives.

**Candidates**
- parse-git-diff 0.0.20: MIT, released 2026-02-14, one maintainer (yeonjuan-joah), 34k downloads a week, pre-1.0.
- gitdiff-parser 0.3.1: MIT, released 2023-03-14.

Whether either decodes octal-quoted paths was not checked.

**Options**
- Keep, and fix `unquote` to decode `\ooo` escapes to UTF-8 bytes. `server/machine/pty/tmux.ts` `decodeOutput` already does octal decoding.
- Adopt parse-git-diff. Against: a pre-1.0 dependency for about 30 lines, and its quoting behaviour is unverified.

**Recommendation.** Keep, and fix `unquote`. Neither library is established enough, and the need is heads only.

## 3. Subprocess running outside git (`ssh.ts` 58, `tmux.ts` `run`, `hooks.ts` osascript, `registry.ts` and `codex.ts` `ps`)

**What oculus has**
- `hpc/ssh.ts` `run()` spawns `ssh` with fixed `-o` options. It has a timeout, then SIGTERM, then SIGKILL after `KILL_GRACE_MS`, which is about 35 lines.
- `tmux.ts` `run()` is an `execFile` wrapper of about 22 lines.

**Candidates**
- **execa 10.0.1**: MIT, released 2026-07-31, maintainers sindresorhus and ehmicky, node >= 22, so it fits Node 24. 196M downloads a week.
  - `timeout` and `forceKillAfterDelay` cover ssh.ts's escalation: "If the subprocess is still alive after 5 seconds, it is forcefully terminated with SIGKILL" (docs/termination.md).
  - It also has line iteration.
- **tinyexec 1.3.1**: MIT, released 2026-09-03, node >= 18. Already in the tree only as vitest's dependency.
- **nano-spawn 2.1.0**: MIT, released 2026-04-01, node >= 20.17.

All three use `spawn`. The git gate mocks `execFile`, so none of them may be used by the git modules without rebuilding that test.

**Would remove (estimate):** about 25 lines in ssh.ts and about 10 in tmux.ts.

**Options**
- Keep.
- execa for ssh.ts only. For: the kill escalation comes from the library. Against: a new dependency for about 25 lines, and a second process API beside `node:child_process`.

**Recommendation.** Keep. The saving is about 35 lines, and a second subprocess API next to the gated one adds more to maintain than it removes.

## 4. File watching (`root/watch/git.ts` 453, `portfolio.ts` 403, `sessions.ts` 325, `bookmarks.ts` 99, `local.ts` 58, `machine/usage/watch.ts` 148)

**What oculus has**
- `fs.watch` with `recursive: true` (FSEvents on darwin) per root and per store, plus `fs.watchFile` for the bookmarks file.
- Hand-written ignore filters: path segments and `.lock` in `git.ts` `relevant()`; `.yml`, `PRESENT.md`, `code/` and `attic/` in `portfolio.ts`.
- A per-root trailing throttle on an injected clock (`git.ts` `touch()`).
- A filter that drops FSEvents events whose path's ctime is before the newest answered read began (`git.ts` `seenBy()`), for fseventsd's late delivery.
- `server/core/file-poll.ts` (outside this part) polls small files because FSEvents registration can lose a write.

**Candidates**
- **@parcel/watcher 2.6.0**
  - MIT, released 2026-07-20, maintainer devongovett, node >= 10, prebuilt `@parcel/watcher-darwin-arm64` in its optionalDependencies. 42.6M downloads a week.
  - Native FSEvents, `ignore` as globs (picomatch), and events "throttled and coalesced" (README).
  - Covers the ignore filters and part of the debounce.
  - Does not cover the ctime stale-event filter, the per-root 2 s window, or the file polling. Whether it avoids the late-event problem was not verified.
  - Would remove (estimate): 40-80 lines.
- **chokidar 5.0.0**
  - MIT, released 2025-11-25, maintainer paulmillr, node >= 20.19. 247M downloads a week.
  - Has `ignored`, `atomic` and `awaitWriteFinish`. Its README says v4 removed fsevents, so on darwin it builds on `fs.watch` like oculus does.
  - Covers the ignore filters. It does not cover the stale-event filter or the throttle.
- **watchpack 2.5.2**: MIT, webpack's watcher, built for bundler dependency tracking. Not a fit.

**Options**
- Keep.
  - For: the darwin behaviours oculus works around are measured and tested.
  - Against: the ignore filters stay hand-written.
- @parcel/watcher.
  - For: native ignore and coalescing.
  - Against: a native addon; the stale-event and polling code stays; the injected-clock tests change.
- chokidar.
  - For: established.
  - Against: it is `fs.watch` underneath, so the same workarounds stay.

**Recommendation.** Keep. Neither candidate removes the code that is hard to maintain here (the stale-event filter, the file polling, the per-root throttle). The part they would remove is the simple path filtering.

**Finding.** `bookmarks.ts` polls through `fs.watchFile`, while `core/file-poll.ts` exists for exactly that job (its head comment says so). There are two small-file polling mechanisms.

## 5. Debounce and throttle (the five watchers above)

**What oculus has.** Five copies of the same pattern (`if (timer) clearTimeout(timer); timer = setTimeout(...)`, plus clearing on `close`):
- `local.ts` lines 36-42
- `bookmarks.ts` lines 69-76
- `usage/watch.ts` lines 90-97
- `watch/sessions.ts` lines 227-234
- `portfolio.ts` about lines 376-390

There is also a trailing throttle in `git.ts` `touch()`. Together about 50 lines (estimate).

**Candidates**
- **es-toolkit 1.52.0**: MIT, released 2026-08-28, maintained by toss. 57M downloads a week. It has `debounce` and `throttle` with cancel. Engines and peer dependencies were not checked.
- **perfect-debounce 2.1.0**: MIT, released 2026-01-21, maintainer pi0. `cancel()`, `flush()`, leading and trailing (README lines 20 and 51).
- **p-debounce 5.1.1**: MIT, released 2026-09-12. Promise-based, with `AbortSignal` cancel.
- **lodash.debounce 4.0.8**: last release 2016-08-13. Not a fit.

**Options**
- Keep five copies.
- One helper in `server/core`.
- es-toolkit or perfect-debounce.
  - For: covers debounce with cancel.
  - Against: the git throttle runs on an injected `Clock` its tests drive, which a library timer does not take; vitest fake timers would be needed instead.

**Recommendation.** perfect-debounce for the five debounce copies, since it covers debounce with cancel and flush. Keep `git.ts`'s throttle, whose injected clock the library cannot take. Estimated removal: about 35 lines.

## 6. Terminal sessions (`machine/pty/`)

**What oculus has**
- Files: `tmux.ts` 363, `channel.ts` 494, `sessions.ts` 456, `routes.ts` 490, `compose.ts` 237, `chat.ts` 127, `context.ts` 50.
- There is no native pty. DESIGN.md "PTY" puts every session in tmux so it outlives the server.
- `tmux.ts`:
  - a control-mode client (`tmux -C attach-session`) with a line parser (`createParser`, lines 149-200)
  - an `%output` octal decoder (`decodeOutput`)
  - a command quoter
  - a key splitter (`splitKeys`, a table of 17 xterm sequences to tmux key names, plus Ctrl-letters)
- `channel.ts` bridges this onto the `pty:<id>` socket channel.

**Candidates**
- **node-pty 1.1.0**
  - MIT, released 2025-12-22, maintainers tyriar, alexr00 and microsoft1es. 4.8M downloads a week.
  - Install script `node scripts/prebuild.js || node-gyp rebuild`. Whether a prebuilt binary exists for Node 24 on darwin-arm64 was not checked.
  - node-pty running a plain `tmux attach` would remove the control parser, the decoder and `splitKeys` (estimate 150-200 lines), and bytes would pass through raw.
  - Against:
    - xterm would then show tmux's redrawn screen, so scrollback lives in tmux copy mode rather than in xterm's own buffer.
    - It is a native addon.
    - It runs one attached client per terminal instead of one control client.
- **@promptctl/tmux-control-mode-js 0.1.0**: MIT, created 2026-06-24, one maintainer, 2 downloads a week (api.npmjs.org). Not established.

**Options**
- Keep control mode.
- node-pty with plain tmux attach.
  - For: less protocol code; no key table.
  - Against: xterm scrollback changes, and a native build is added.

**Recommendation.** Keep. node-pty changes what the reader sees (xterm scrollback) to remove about 200 lines, and the one control-mode library is not established.

**Side note, no library involved.** `tmux send-keys -H` sends keys as hex. `man tmux` on tmux 3.7c says `-H` "expects each key to be a hexadecimal number for an ASCII character". It could replace `splitKeys` for ASCII input. Whether it carries UTF-8 bytes was not verified.

## 7. SSH and SLURM (`machine/hpc/`)

**What oculus has**
- Files: `ssh.ts` 58, `poll.ts` 258, `parse.ts` 195, `prewarm.ts` 226, `actions.ts` 78, `routes.ts` 32.
- It spawns the system `ssh` with `ConnectTimeout`, `BatchMode`, `ControlMaster=no` and `ControlPath=none`, and relies on `~/.ssh/config` for the `utwente` host.
- `squeue`, `sacct` and `sinfo` use pipe-delimited `-o` formats and are parsed by `parse.ts`.
- `poll.ts` runs a setTimeout chain with a two-minute backoff while the cluster does not answer, plus a quota `setInterval`.

**Candidates**
- **ssh2 1.17.0**: MIT (licenses field), released 2025-08-20, maintainer mscdex. 13.8M downloads a week.
- **node-ssh 13.2.1**: MIT, released 2025-03-20.

Both are JavaScript SSH clients, and neither reads `~/.ssh/config` (not checked in their docs; ssh2 takes a host, port and key as options). The HPC route depends on that config.

No npm library for SLURM text output was found. Slurm's `--json` output would remove most of `parse.ts`, but whether the UTwente cluster's Slurm build supports it was not checked, since the brief forbids running anything there.

**Scheduling.** croner 10.0.1 and toad-scheduler 4.2.0 are cron and interval schedulers. They do not model "the next attempt at a cadence the last outcome earned".

**Recommendation.** Keep. The system ssh with the user's config is what makes the connection work, and no SLURM parser library exists.

## 8. Process liveness and start times (`sessions/registry.ts` 234, `sessions/stores/codex.ts` probe, `sessions/stores/dispatches.ts` 261)

**What oculus has**
- `spawnSync('ps', ['-o','pid=,lstart=', -p ...])` under `LC_ALL=C`, with `parseStamp`, `formatStamp` and a months table, about 60 lines.
- `spawnSync('ps', ['-axo','comm='])` in `codex.ts`.
- Signal 0 through `process.kill(pid, 0)`.
- `bin/dispatch-note.mjs` (outside this part) records `pidStart` in the same `ps lstart` text, and `dispatches.ts` compares against it with `parseStamp`.

**Candidates**
- **ps-list 9.0.0**
  - MIT, released 2025-09-26, maintainer sindresorhus, node >= 20. 2.0M downloads a week.
  - Returns `startTime` as a Date (README line 37), read from `lstart` under `LC_ALL: 'C'` (its index.js), plus `name` and `cmd`.
  - Covers both `ps` reads.
  - Against: it is async, while the scan is synchronous on the server's one thread. It lists every process rather than the requested pids. `parseStamp` must stay for the dispatch note's stored text.
  - Would remove (estimate): about 40 lines.
- **pidusage 4.0.1**: MIT, released 2025-04-26. Gives `elapsed`, from which a start time can be derived, but only to within the moment of the call.
- **systeminformation 5.33.13**: MIT, released 2026-09-20. `processes()` derives `started` from elapsed time (lib/processes.js lines 765-782). Not an exact start time.

**Options**
- Keep.
- ps-list. Against: the scan becomes async, and `parseStamp` stays for the note.

**Recommendation.** Keep. The saving is about 40 lines, and it would turn a synchronous scan async and leave the stamp parser in place.

## 9. JSONL transcript reading (`sessions/stores/transcripts.ts` 344, `machine/usage/transcripts.ts` 205, `sessions/cache.ts` 102, `sessions/stores/turns.ts` 211, `transcripts/stores.ts` 109)

**What oculus has**
- `foldFrom()` (transcripts.ts lines 100-142): a synchronous read from a byte offset up to the last newline, then `JSON.parse` per line. The cache stores that byte offset.
- `usage/transcripts.ts` streams whole files through `node:readline` with no offset.
- `transcripts/stores.ts` walks the directories by hand (`collectClaude`, `walk`), about 40 lines.

**Candidates**
- stream-json 3.7.0: BSD-3-Clause, released 2026-09-19.
- split2 4.2.0: ISC, released 2023-03-26.
- ndjson 2.0.0: BSD-3-Clause, last modified 2022.

All are async streams with no byte-offset resume. Would remove (estimate): under 15 lines, since `JSON.parse` per line is already all there is.

**Built-in for the walk.** Node 24's `fs.globSync` ran here without a warning: `fs.globSync('g/**/*.jsonl')` returned both nested files. `readdirSync(dir, { recursive: true })` did the same. Either could replace the two walkers (estimate 25 lines removed). The libraries fdir 6.5.0 (2025-08-14), tinyglobby 0.2.17 (2026-05-30) and fast-glob 3.3.3 (2025-01-05) are all MIT, but a built-in needs no dependency.

**Recommendation.** Keep the JSONL readers; no library does the byte-offset resume. Replace the walkers with `fs.globSync`.

**Finding.** `usage/transcripts.ts` re-reads the last seven days of the same transcripts that `sessions/cache.ts` already folds by offset. There are two readers of one store.

## 10. TOML reading (`sessions/stores/customizations.ts` 455, of which `tomlServers` and `tomlTools` are about 45 lines)

**What oculus has.** A line scan of Codex's `config.toml` for `[mcp_servers.<name>]` headers and `[tools]` keys set to `true`. Malformed means an unclosed `[`.

What it misses:
- dotted keys (`tools.web_search = true` at top level)
- inline tables (`mcp_servers = { ... }`)
- single-quoted header names
- a `[` inside a multi-line string

**Candidates**
- **smol-toml 1.9.0**: BSD-3-Clause, released 2026-09-22, maintainer cyyynthia, node >= 18. 39M downloads a week. Peer dependencies not checked.
- toml 5.0.0: MIT, released 2026-07-14, node >= 20.
- @iarna/toml 2.2.5: last release 2020. Not a fit.

**Would remove (estimate):** about 30 lines. A parse error becomes the real malformed finding.

**Recommendation.** smol-toml. It reads the whole TOML syntax, which the line scan does not.

## 11. JSON HTTP responses: a dependency oculus already has, not used

`@sveltejs/kit` (2.70.3 installed, MIT) exports `json(data, init)`, which sets `content-type` and `content-length` (node_modules/@sveltejs/kit/src/exports/index.js lines 138-159). The global `Response.json` is the platform's own.

`grep` finds no import from `@sveltejs/kit` under `src/lib` or `src/routes`. This part instead has ten hand-written `json(status, body)` helpers, 5-7 lines each (lines are where `new Response(JSON.stringify` appears):
- `machine/pty/routes.ts:92`
- `machine/pty/compose.ts:209`
- `machine/usage/routes.ts:13`
- `machine/hpc/routes.ts:15`
- `root/hooks.ts:38`
- `sessions/transcript-routes.ts:33`
- `sessions/stores/customizations.ts:400`
- `git/deposit-routes.ts:77`
- X3b `git/git-reads.ts:67`
- X3b `git/git-routes.ts:143`

Eight of them add `cache-control: no-store`.

**Recommendation.** Use `json(body, { status, headers: { 'cache-control': 'no-store' } })` from `@sveltejs/kit`, or one shared helper built on it. Estimated removal: about 50 lines.

## 12. Command-line parsing (`root/args.ts` 67)

**Candidate.** The built-in `node:util` `parseArgs`. I probed it with `options: { engine: { type: 'string' } }` and `strict: true`:

| Input | Result |
|---|---|
| `--engine x` | `x` |
| `--engine=x` | `x` |
| repeated `--engine` | last value wins |
| `--engine --port` | `ERR_PARSE_ARGS_INVALID_OPTION_VALUE` |
| `--port` | `ERR_PARSE_ARGS_UNKNOWN_OPTION` |
| `stray` | `ERR_PARSE_ARGS_UNEXPECTED_POSITIONAL` |

`--engine=` with an empty value is not refused, and the error sentences are Node's rather than oculus's.

**Recommendation.** Use `parseArgs` for the scan, and keep the empty-value refusal, the `config/` check and oculus's own error sentences. Estimated removal: about 20 lines.

## 13. macOS notification (`root/hooks.ts` `notify`, about 20 lines)

**Candidate.** node-notifier 10.0.1: MIT, last release 2022-02-01, one maintainer. It wraps a vendored terminal-notifier binary.

**Recommendation.** Keep `osascript`: one `execFile` against a stale package.

## Small built-ins and duplicates, one line each

- `machine/usage/refresh.ts` `plain()` strips ANSI with a hand-written regex; `util.stripVTControlCharacters` is the built-in.
- `machine/usage/refresh.ts` `wait()` duplicates `setTimeout` from `node:timers/promises`.
- `machine/usage/accounts.ts` `json()`, `text()` and `number()` (lines 34-49) duplicate `core/json.ts` `readJson`, `text` and `isMap`.
- `sessions/stores/customizations.ts` `mapOf()` duplicates `isMap`.
- `root/hooks.ts` `RateLimiter` is 15 lines; a limiter library is not warranted.
- `root/socket.ts` already uses `ws` (in `package.json`) for the WebSocket server.
- `sessions/stores/turns.ts` already uses `marked` (in `package.json`) for Markdown.

## Domain logic no library covers

- `git-message.ts`: the commit-message request to `claude -p`, with the prompt from the catalog.
- `deposit.ts`, `deposit-routes.ts`, `deposit-git.ts` (apart from the duplicate parser above): the hub's deposit-mirror workflow and its `gh` calls.
- `git-reads.ts`, `git-routes.ts`, `git-refs.ts`, `git-remote.ts`, `git-index.ts` (apart from 1 and 2): the /api/git endpoint, its token, origin and confirm gates, and VS Code Source Control semantics.
- `hpc/actions.ts`, `prewarm.ts`, `parse.ts`, `poll.ts`, `routes.ts`: the log-path search ladder, the SLURM field meanings, the backoff cadence, the routes.
- `pty/channel.ts`, `sessions.ts`, `routes.ts`, `compose.ts`, `chat.ts`, `context.ts`: terminal records, agent argv from `agents.yml`, portfolio chat context.
- `usage/accounts.ts`, `refresh.ts`, `watch.ts`, `routes.ts`: Claude and Codex usage windows read from account files and a scraped `/usage` screen.
- `root/context.ts`, `config-seed.ts`, `shutdown.ts`, `style-first.ts`, `vite-plugin.ts`: the composition root, config versioning, signal handling, a Vite and Svelte style workaround, the dev-server glue.
- `sessions/fold.ts`, `record.ts`, `group.ts`, `overrides.ts`, `folders.ts`, `index.ts`, `background.ts`, `codex.ts`, `hooks.ts` (store), `dispatches.ts`, `transcript-routes.ts`: the transcript and rollout folds, workspace and area scoring, overrides, background subagents, the launch note, hook merging.
- `transcripts/usage.ts`: normalising usage records.

## Coverage table

| File | Capability |
|---|---|
| src/lib/server/git/deposit-git.ts | 1 git running (duplicate parseBranches) + deposit domain |
| src/lib/server/git/deposit-routes.ts | deposit domain; 11 json helper |
| src/lib/server/git/deposit.ts | deposit domain |
| src/lib/server/git/git-index.ts (X3b) | 1 git running; 2 diff head parsing |
| src/lib/server/git/git-message.ts | 1 subprocess wrapper; domain |
| src/lib/server/git/git-reads.ts (X3b) | git endpoint domain; 11 json helper |
| src/lib/server/git/git-refs.ts (X3b) | 1 git running (porcelain scan) |
| src/lib/server/git/git-remote.ts (X3b) | 1 git running |
| src/lib/server/git/git-routes.ts (X3b) | git endpoint domain; 11 json helper |
| src/lib/server/git/git-write.ts (X3b) | 1 git running and porcelain parsing |
| src/lib/server/machine/hpc/actions.ts | 7 SLURM domain |
| src/lib/server/machine/hpc/parse.ts | 7 SLURM text parsing |
| src/lib/server/machine/hpc/poll.ts | 7 polling clock |
| src/lib/server/machine/hpc/prewarm.ts | 7 SLURM domain |
| src/lib/server/machine/hpc/routes.ts | 7 domain; 11 json helper |
| src/lib/server/machine/hpc/ssh.ts | 3 subprocess, 7 ssh |
| src/lib/server/machine/pty/channel.ts | 6 terminal bridge |
| src/lib/server/machine/pty/chat.ts | 6 domain |
| src/lib/server/machine/pty/compose.ts | 6 domain; 11 json helper |
| src/lib/server/machine/pty/context.ts | 6 domain |
| src/lib/server/machine/pty/routes.ts | 6 domain; 11 json helper |
| src/lib/server/machine/pty/sessions.ts | 6 terminal records |
| src/lib/server/machine/pty/tmux.ts | 6 tmux control mode; 3 subprocess |
| src/lib/server/machine/usage/accounts.ts | usage domain (duplicate json helpers) |
| src/lib/server/machine/usage/refresh.ts | usage domain (ANSI strip, wait built-ins) |
| src/lib/server/machine/usage/routes.ts | usage domain; 11 json helper |
| src/lib/server/machine/usage/transcripts.ts | 9 JSONL reading |
| src/lib/server/machine/usage/watch.ts | 4 watching; 5 debounce |
| src/lib/server/root/args.ts | 12 CLI parsing |
| src/lib/server/root/config-seed.ts | domain |
| src/lib/server/root/context.ts | composition root, domain |
| src/lib/server/root/hooks.ts | hook endpoint; 13 notification; 11 json helper |
| src/lib/server/root/shutdown.ts | domain |
| src/lib/server/root/socket.ts | WebSocket (uses ws) |
| src/lib/server/root/style-first.ts | Vite plugin, domain |
| src/lib/server/root/vite-plugin.ts | Vite glue, domain |
| src/lib/server/root/watch/bookmarks.ts | 4 watching (polling); 5 debounce |
| src/lib/server/root/watch/git.ts | 4 watching; 5 throttle |
| src/lib/server/root/watch/local.ts | 4 watching; 5 debounce |
| src/lib/server/root/watch/portfolio.ts | 4 watching; 5 debounce |
| src/lib/server/root/watch/sessions.ts | 4 watching; 5 debounce; liveness clock |
| src/lib/server/sessions/cache.ts | 9 JSONL offset cache |
| src/lib/server/sessions/fold.ts | transcript fold domain |
| src/lib/server/sessions/folders.ts | domain |
| src/lib/server/sessions/group.ts | domain |
| src/lib/server/sessions/index.ts | domain |
| src/lib/server/sessions/overrides.ts | domain |
| src/lib/server/sessions/record.ts | domain |
| src/lib/server/sessions/registry.ts | 8 process liveness |
| src/lib/server/sessions/stores/background.ts | domain |
| src/lib/server/sessions/stores/codex.ts | rollout fold domain; 8 process probe |
| src/lib/server/sessions/stores/customizations.ts | 10 TOML reading; 11 json helper |
| src/lib/server/sessions/stores/dispatches.ts | 8 process liveness; domain |
| src/lib/server/sessions/stores/hooks.ts | domain |
| src/lib/server/sessions/stores/transcripts.ts | 9 JSONL reading |
| src/lib/server/sessions/stores/turns.ts | 9 JSONL reading (uses marked) |
| src/lib/server/sessions/transcript-routes.ts | domain; 11 json helper |
| src/lib/server/transcripts/stores.ts | 9 directory walk (fs.globSync) |
| src/lib/server/transcripts/usage.ts | domain |
