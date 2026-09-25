NOT done, or done only in part: (a) item 2: I found and fixed the cause of the three git watcher cases, but I have no paired load run in which base fails and the fix passes. At the loads I could make, the two sides either both pass or both fail, because fseventsd delivers nothing at all. The counts are below. (b) item 3: I did not run a second dev server of my own, and I did not connect to 8790. The dev server's context was not exercised separately; the reason is under item 3. (c) item 4: no boot over the 5 s assertion time happened in 60 loaded boots, so the >5 s failure itself was not reproduced. The server-side cause I found under load is fixed. Everything else in the brief is done.

Open items of the state file, verbatim (`orchestrator-state.md`, "## Open items"): the list holds no entries. Its text is: "An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him."

## Item 1: the mail poller's notes file
**Cause** (the brief's premise, unchanged): `fs.watch(options.dir)` at base `poll.ts:304` is an FSEvents stream that registers asynchronously, so a write made while it registers is lost.

**Fix:**
- A new module, `src/lib/server/watch/file-poll.ts`, holds the one poll of a small file on an injected clock: `pollFile(file, {clock, every}, changed)` returns `{ reading(), close() }`. It also holds `Clock`, `Timer`, `systemClock`, `POLL = 500` and `signature`, all moved out of `git.ts`.
- The git watcher's workspaces poll now uses it: `git.ts:391-396` and `:301` (`workspaces?.reading()`).
- The mail poller now uses it too:
  - It polls `triage.json` (`poll.ts:308-319`). The folder is still made (`:311`).
  - The signature at start is taken as read (`:318`), so a tick before the first round cannot publish every account as not connected.
  - Every publish calls `notesPoll?.reading()` (`:138`), so a page write that is published at once is not published again by the next tick.
  - New options: `clock`, `notesEvery`. `watchNotes` is renamed to `pollNotes`.

**New cases in `tests/server/accounts/mail/poll.test.ts`,** all on the manual clock:
- "reads a notes file written the moment the poller starts, at the next tick" (revert `poll.ts:309 => return;`)
- "does not publish a page write a second time when the tick after it comes" (`:138 => delete`)
- "publishes nothing for a notes write after it closed, and leaves no tick behind" (`:332 => delete`)

The case the brief names ("makes the mail folder...") and "republishes when the triage skill writes..." now carry directives too (`:311 => delete`, `:309 => return;`).

**Load run:** ten whole node runs under eight paced churn workers writing and renaming files across a tree in the scratchpad (fseventsd 60 to 119% CPU, load 13.9 to 21.4), in `whole10.sh`. Every run printed `Tests 4758 passed (4758)`:
```
run1 fseventsd=60.4 load=13.89  Tests 4758 passed (4758)
run2 fseventsd=112.8 load=16.98 ... run10 fseventsd=81.0 load=17.70  Tests 4758 passed (4758)
```

## Item 2: the three git watcher cases
**Cause.** Events for writes made before a root's watch opened reach the new stream after it opened, and the watcher treats them as news. Each one schedules a read, so the throttle fires for a root nobody wrote to. That matches all three failure values: a files message naming the second root; `expected 8 to be +0`; a pending timer in "drops a root".

What shows it:
- Probe `scratchpad/load/late.mjs`: it makes a repository, opens the watcher's two watches and writes nothing. Unloaded, 11 of 15 rounds still got events after opening; under 16 churn workers, 8 of 15. Every event for a path that still existed had a ctime before the watch opened, for example `.git/index ctime-readFrom=-83.9`, `.git/refs/heads/work ctime-readFrom=-79.7`.
- An instrumented copy of `git.ts` (`DIAG` lines, run at natural fseventsd ~100%) showed three kinds of surplus event that a check on present paths alone does not catch:
  - the `.git` watch naming the folder itself as `.git`: a probe with `chmod`/`utimes` on a watched folder printed `event change .git`;
  - git init's probe files `.git/tXXXXXX` and `.git/ä`, gone by the time the event arrives;
  - the recursive watch naming the root itself by its basename (`one one`).

**Fix** (`git.ts:180-249`):
- Every read records when it began (`readFrom`: set at open, `:249`, and in `reread`, `:187`).
- An event is dropped when the change time of its path, or of the nearest folder above it that still exists, is before that moment (`seenBy`, `:222-237`). Taking an entry out of a folder moves that folder's ctime. That was checked for an unlink, an rmdir and a rename away: all `true`.
- On darwin, 0 of 50000 writes had a ctime earlier than the `Date.now()` taken before the write (`scratchpad/load/gran.mjs`, run under the churn).

**New cases in `tests/server/watch/git-events.test.ts`.** `fs.watch` is replaced by a recorder, so each case hands the watcher its event itself:
- "drops a late event for a write made before the watch opened" (`:242`, `:249 => delete`)
- "drops an event for a write the newest read saw, not only the first read" (`:187 => delete`)
- "drops a late event for a path made and taken away before the watch opened" (`:235 => return false;`)
- "keeps an event for a path taken away after the watch opened, by its folder" (`:233 => const up = root;`)
- "dates an event the .git watch gives about the folder itself by that folder" (`:235 => return false;`)

**Load runs** (`scratchpad/gitpair.sh`, alternating base copy and worktree):
- Paced load, 4 to 8 workers (fseventsd 22 to 116%, load 12.7 to 17.9): base 6 of 6 green, fixed 6 of 6 green (`Tests 21 passed (21)` on every line).
- 1 unpaced worker (fseventsd 121 to 202%, load 6.6 to 11.9), 6 pairs: base failed 3 to 6 cases in every run, fixed 3 to 5 in every run. At that load `scratchpad/load/delay.mjs` printed `w500=lost w2000=lost w5000=lost`, so nothing is delivered and neither side can pass. The fixed side fails "watches the always root" more often. Base passes it by picking up ARM (the case's own test file, `arming.txt`) on a read triggered by a surplus event. The fixed side waits for ARM's own event, which that load loses.
- 16 unpaced workers, first set: base failed 1 of 4 runs with the files message naming the second root (`expected [ Array(1) ] to deeply equal [ Array(1) ]`).
- Instrumented fixed build at natural fseventsd ~100%: `Tests 21 passed (21)` in 6 of 6 runs.

## Item 3: the hand-added bookmark
**Cause:** the page's read. The server watcher and the publish both work. The page kept one message per channel and read the bookmarks round off `entities.message('files')` only when something asked for the bookmarks, which for the rail's menu is when it opens. A `files` message for a write under a root replaced the bookmarks message before the menu opened. On a busy hub that happens within seconds.

**Reproduced on the served build** (base copy, new case): `Received array: ["cathedra/docs/user/manual.html", "game-engine/docs/user/manual.html"]`. The same case on base without the root write passed (`1 passed`), which isolates the link. The wire recording in the case sees the server's `{bookmarks: true}` frame, so the watcher and the publish work.

**Dev server's context:** not run as its own server. It is the same `createServerContext` (`vite-plugin.ts:32`, `src/server.ts:41`), and the defect is in page code both servers ship.

**Fix** (`fs.svelte.ts:360-376`): `onDisk` is now `$state`, set by `entities.afterReceive` for every `files` message with `bookmarks: true`.

**Cases:**
- Browser case in `rail.spec.ts`, "a bookmark written into the file from outside joins the open menu without a reload" (revert `fs.svelte.ts:370 => delete`, red). It writes `bookmarks.yml` from outside, waits for the bookmarks frame, then writes a file under the hub root, waits for the root frame, and opens the menu.
- State case in `fs-channel.test.ts` (revert `:369`, `:370`).

## Item 4: the page boot under load
**Measured** with `scratchpad/measure/boot.mjs`: ten boots in fresh contexts. Times are ms from navigation to the socket made, open, first config, and "up". A `--import` probe logged server event-loop stalls over 50 ms and spawnSyncs over 50 ms.
- Unloaded (load ~9): open median 295 / max 519, up median 367 / max 973.
- 16 churn workers, base: open median 615 / max 1433, up median 1029 / max 1641. Server stalled 8448 ms in a 17 s window (35 stalls). Idle under the same load: 0 stalls. No spawnSync over 50 ms.

**Cause:** a CPU profile of the loaded boots (`--cpu-prof`) put 6551 of 10551 busy ms in `loadConfig`, 5568 of it under `hooks.server.ts` `handle`. Every request, including every `/api/*` fetch a booting page makes, re-read and re-parsed all config YAML synchronously, and the socket's upgrade waited behind those reads on the one event loop.

**Fix:**
- `hooks.server.ts` puts a memoised `locals.config()` on each request. The title and `+page.server.ts` share one read, and an API request that never asks reads nothing.
- After the fix, `loadConfig` appears once per page request in the profile.

**Paired, 16 churn workers, three rounds each side,** wait = socket open minus socket made:
- base: medians 14 / 312 / 15, max 325 / 400 / 342; stalled ms 5643 / 7522 / 6161.
- fixed: medians 15 / 13 / 26, max 137 / 159 / 103; stalled ms 3316 / 2963 / 9216. The last fixed round ran at load 28, driven by other activity on the machine.

"Up" stayed under 2.4 s on both sides in every loaded boot. What remains before "up" is mostly the browser's own parse and hydrate time ("made" 300 to 1300 ms), which is the machine's load. For the orchestrator to rule on.

## DONE / NOT DONE
| # | Check | Result |
|---|---|---|
| 1 | `npx vitest run --reporter=dot` | `Test Files 299 passed (299)` `Tests 4758 passed (4758)` |
| 2 | `npm run check` | `COMPLETED 1371 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| 3 | `npm run build` | exit 0 (last source change was before it) |
| 4 | `npm run format:check` | `All matched files use Prettier code style!` |
| 5 | `npm run lint` | exit 0 |
| 6 | `LC_ALL=C grep -rna '[^ -~]' src tests bin` | prints nothing (0 lines); the spec's perl gate also prints nothing |
| 7 | `sh bin/size-check.sh`, `sh bin/folder-check.sh` | both exit 0 |
| 8 | `npx playwright test` | `386 passed (6.2m)` |
| 9 | revert-check, node files (poll, git-events, git-workspaces, repos, hooks-server, fs-channel) | `28 reverts, 0 unproven, 10 unchecked` (the unchecked are cases I did not change the behaviour of) |
| 9 | revert-check, `rail.spec.ts` and `unsaved-forms.spec.ts` | `40 reverts, 0 unproven, 11 unchecked` |
| 10 | Load runs of items 1, 2, 4 | above. `pgrep -f "churn.mjs\|paced.mjs\|helpers/serve.ts"` prints nothing; 8792 is free |
| 11 | `ls -d $TMPDIR/oculus-* \| wc -l` | 7015 before, 7015 after. 18 `oculus-watch-git-*` directories left by a run I stopped were removed |

## Files (lines now; +added / -removed against main)
- `src/lib/server/watch/file-poll.ts`: new, 102
- `src/lib/server/watch/git.ts`: 418 (+67/-75)
- `src/lib/server/accounts/mail/poll.ts`: 340 (+31/-24)
- `src/lib/state/sources/fs.svelte.ts`: 883 (+12/-14)
- `src/hooks.server.ts`: 41 (+14/-4)
- `src/app.d.ts`: 32 (+6)
- `src/routes/+page.server.ts`: 32 (+5/-11)
- Tests:
  - `tests/server/watch/git-events.test.ts`: new, 173
  - `git-workspaces.test.ts`: +11/-11 (directives moved to the new lines)
  - `repos.ts`: +3/-2
  - `mail/poll.test.ts`: +85/-10
  - `core/hooks-server.test.ts`: +51/-1
  - `state/sources/fs-channel.test.ts`: +41/-5
  - `browser/shell/rail.spec.ts`: +55/-3
  - `browser/workbench/unsaved-forms.spec.ts`: +15
- `docs/diagrams/*`: regenerated by `npm run diagrams`, which `diagrams.test.ts` requires.

Paths beyond the brief's list:
- `src/hooks.server.ts`, `src/app.d.ts` and `src/routes/+page.server.ts`: that is where the per-request config read lives.
- `docs/diagrams`: the diagram check requires it after a new module.
- `unsaved-forms.spec.ts`: see the next list.

## Judgment calls (reversible)
- One file-poll module shared by the git and mail watchers, instead of a second tick loop in `poll.ts`.
- The `unsaved-forms.spec.ts:342` case now waits for the config push carrying `timeout_seconds: 1` before pressing Save; it waits on the fact, not on a time. Fixed failed it 3 of 3 whole-file runs and base passed 21 of 21. A trace showed the page receives the watcher's stale config (v1, 30 s) at 175 ms and the fresh one (v2, 1 s) at 367 ms. With the faster boot, Save went out before v2 arrived. Base's slower boot hid the race.
- The mail poll does not publish at its first tick when the file has not changed since start.
- Option names `pollNotes`, `clock`, `notesEvery` are internal.

## Limitations and problems found
- The page's first config over the socket can be older than the config its own HTML was built from: the watcher's debounce, shown above. For a few hundred ms after a reload that follows a config edit, writes and colours run on the old values. Not fixed. It is a different concern (config channel freshness) and needs a ruling or a step.
- The ctime rule assumes file ctimes are not earlier than wall time. Measured on darwin/APFS: 0 of 50000. On a filesystem with coarse timestamps (Linux jiffies) a write right after a read begins could be dropped. Not verified off darwin.
- A path whose nearest remaining ancestor is the root, and the root's own event, are dated by the root's ctime. That can keep a surplus event, which costs one harmless read.
- Two revert directives are over 100 columns (`git-workspaces.test.ts:174`, `:201`, at 127 and 140). The tool reads one line, and 174 was 157 columns before.

## Before and after for the look
- Rail, Bookmarks menu, on any page: add an entry to `~/.oculus/bookmarks.yml` by hand while a page is open on a busy hub. Before, it appears only after a reload. After, it appears on the next opening of the menu.
- Inbox: a note written into `<mail_dir>/triage.json` appears within about 0.5 s. No visual change otherwise.
- Boot: no visual change.

## Doc text
- DESIGN.md:106, git watcher: add "It drops an event whose path, or the nearest folder above it that is still there, last changed before the newest read of that root began, since fseventsd can deliver the writes that made a root after its watch opened."
- DESIGN.md:127, mail: "and watched so a write from outside republishes" becomes "and polled every 500 ms so a write from outside republishes".
- DESIGN.md:274: "watched so a write from outside republishes (the folder is made at start when the machine has none, so the first write is seen)" becomes "polled every 500 ms so a write from outside republishes (the folder is made at start when the machine has none)".
- HELP.md:193: "the server watches the file" becomes "the server polls the file".
- DESIGN.md, the socket or request section: add "A request reads the configuration at most once, and only if it asks: the page's title and its load share one read, and an API route reads none."

# Repair round 1

Everything in the brief and in the five rulings is done. Two things from the first round still stand, as ruled: item 2 has no load run that fails base and passes the fix (the probe and the recorder cases are the evidence), and item 4's >5 s boot was not reproduced in 60 loaded boots.

1. Symlinks: `statOf` in `git.ts` now uses `lstatSync` (git.ts:45 import, :136), so a link is dated by its own change time. Two new cases in `tests/server/watch/git.test.ts` run on a real `fs.watch` over a real repository:
   - "reads a symbolic link made after the watch opened to a file older than the read" (new untracked link);
   - "reads a tracked symbolic link pointed at another old file after the watch opened" (retargeted link shows in `unstaged`).
   Both are red under `revert: src/lib/server/watch/git.ts:45 => import { existsSync, statSync as lstatSync, watch } from 'node:fs';`. revert-check prints `red ... reads a symbolic link made after ... (revert src/lib/server/watch/git.ts:45)` and `red ... reads a tracked symbolic link pointed at another old file ... (revert src/lib/server/watch/git.ts:45)`.
2. A failed read is not a read: `answered(root, began, read)` (git.ts:215-218) moves `readFrom` on only when the read's `error` is null. It is called after the read in `reread` (:200) and in `follow` for a new root (:372, from the open time held in `opening`). New case in `git-events.test.ts`, "keeps a late event after a read that failed, since that read saw nothing": the read fails because `.git/HEAD` is overwritten with junk. It is red under `git.ts:216 => delete`: `red ... keeps a late event after a read that failed ... (revert src/lib/server/watch/git.ts:216)`.
3. Stale config on boot. What orders the two is the hub's `config` version.
   - New `src/lib/server/core/config-seed.ts`, `configSeed(hub, read, parts)`. It gives the page its own read as a `ConfigPayload`, plus `through`, the newest hub version that read is at least as new as. `through` is the held version when the held push is another configuration, one below it when it is the same one (so the push is still taken for its findings and host), and 0 when the hub holds none.
   - `+page.server.ts` returns `seed`, `+page.ts` hands it on, and `+page.svelte` calls `socket.seedConfig(payload, through)` in its untracked setup.
   - `socket.svelte.ts:251` drops a `config` push with `version <= seededThrough`.
   - Cases in `tests/state/client/config-seed.test.ts`: red under `config-seed.ts:34` (both directions) and `socket.svelte.ts:251 => delete`.
   - `tests/browser/workbench/unsaved-forms.spec.ts` is byte-identical to main again: `diff -q` against main prints "same-as-main". It passed `21 passed` in 3 of 3 file runs and in the whole suite.
4. Channels diagram: the read in `fs.svelte.ts:368` is now `const named = message.channel === 'files' && (...).bookmarks;`, which the generator matches. After `npm run diagrams`, `diff -q` of `channels.dot` against main prints nothing, and `grep '"ch files" -> "state/sources/fs"' docs/diagrams/channels.dot` gives `108: "ch files" -> "state/sources/fs";`. `layers.dot` gains two edges: `"routes" -> "server/core"` and `"server/accounts" -> "server/watch"`.
5. Report: see "Host-visible changes" and "Doc text" below.

Open items of the state file, verbatim: the list holds no entries. Its text is: "An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him."

## Causes (unchanged from round 0 except where noted)
- **Item 1:** the notes file was watched with a darwin `fs.watch`, which loses a write made while the stream registers. It is now polled every 500 ms on an injected clock through `watch/file-poll.ts`.
- **Item 2:** fseventsd, when behind, delivers events for writes made before a root's watch opened. Probe `late.mjs` (reviewer's rerun): "rounds 10, rounds with an event after opening 6, events with ctime before opening 7". Each such event scheduled a read nobody asked for. The fix drops events whose path, or the nearest folder still there, changed before the newest successful read began. That path is now lstat'd, and a failed read does not count. No load run fails base and passes the fix: at loads where fseventsd delivers, both sides pass 6 of 6; where it delivers nothing ("w500=lost w2000=lost w5000=lost"), both fail every run.
- **Item 3:** the page read the bookmarks round off the one message the `files` channel holds, and a later root message replaced it. Fixed by hearing every message (`afterReceive`).
- **Item 4:**
  - Every request re-read all the config YAML synchronously. The loaded profile showed 6551 of 10551 busy ms in `loadConfig`, and the socket upgrade waited behind it. The read is now once per request that asks, and none for API routes.
  - This round: after a config edit, the booting page installed the hub's older replayed config. It now keeps its own until a newer push.

## DONE / NOT DONE
| # | Check | Output |
|---|---|---|
| 1 | `npx vitest run --reporter=dot` | `Test Files 300 passed (300)` `Tests 4766 passed (4766)` |
| 2 | `npm run check` | `COMPLETED 1373 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| 3 | `npm run build` | `build=0` |
| 4 | `npm run format:check` | `All matched files use Prettier code style!` |
| 5 | `npm run lint` | `lint=0` |
| 6 | `LC_ALL=C grep -rna '[^ -~]' src tests bin \| wc -l` | `0` |
| 7 | `sh bin/size-check.sh`; `sh bin/folder-check.sh` | `size=0` `folder=0` |
| 8 | `npx playwright test` (8792 free first) | `386 passed (6.2m)` |
| 9 | `node bin/revert-check.mjs` over poll, git-events, git-workspaces, git.test, repos, hooks-server, fs-channel, config-seed | `34 reverts, 0 unproven, 33 unchecked`; no line other than `red` |
| 9 | `node bin/revert-check.mjs tests/browser/shell/rail.spec.ts` | `27 reverts, 0 unproven, 3 unchecked`, including `red ... a bookmark written into the file from outside joins the open menu without a reload (revert src/lib/state/sources/fs.svelte.ts:369)` |
| 10 | Load runs | Round 0's, quoted in its report and not rerun this round: ten whole node runs under 8 paced churn workers, all `Tests 4758 passed (4758)`; git pairs and boot pairs as above. `pgrep -f "churn.mjs\|paced.mjs\|helpers/serve.ts"` prints nothing |
| 11 | `ls -d $TMPDIR/oculus-* \| wc -l` | 7015 at the start of the step, 7015 now |

## Files (lines now, +added/-removed against main)
- `src/app.d.ts`: 32 (+6/-0)
- `src/hooks.server.ts`: 41 (+14/-4)
- `src/routes/+page.server.ts`: 46 (+21/-13)
- `src/routes/+page.ts`: 30 (+3/-2)
- `src/routes/+page.svelte`: 219 (+6/-4)
- `src/lib/server/core/config-seed.ts`: new, 35
- `src/lib/server/watch/file-poll.ts`: new, 102
- `src/lib/server/watch/git.ts`: 442 (+93/-77)
- `src/lib/server/accounts/mail/poll.ts`: 340 (+31/-24)
- `src/lib/state/client/socket.svelte.ts`: 272 (+32/-1)
- `src/lib/state/sources/fs.svelte.ts`: 882 (+11/-14)
- `tests/server/watch/git-events.test.ts`: new, 190
- `tests/server/watch/git.test.ts`: 622 (+49/-2)
- `tests/server/watch/git-workspaces.test.ts`: 320 (+11/-11)
- `tests/server/watch/repos.ts`: 125 (+9/-2)
- `tests/server/accounts/mail/poll.test.ts`: 468 (+85/-10)
- `tests/server/core/hooks-server.test.ts`: 94 (+51/-1)
- `tests/state/sources/fs-channel.test.ts`: 115 (+41/-5)
- `tests/state/client/config-seed.test.ts`: new, 114
- `tests/browser/shell/rail.spec.ts`: 706 (+55/-3)
- `tests/browser/workbench/unsaved-forms.spec.ts`: unchanged from main
- `docs/diagrams/layers.dot`/`.svg`: +2 edges
- `channels.*`, `writes.*`: identical to main

Paths beyond the brief's list: `src/hooks.server.ts`, `src/app.d.ts`, `src/routes/+page.server.ts`, `src/routes/+page.ts`, `src/routes/+page.svelte` (the per-request read and the page seed live there), and `docs/diagrams` (regenerated).

## Judgment calls (reversible)
- The server computes the seed bound by comparing `JSON.stringify` of the held config with the page's read, once per page request.
- The seed carries the read's own `loadConfig` findings only. The watcher's machine findings (icons, roots, rail, docs) reach the page with the next push when the hub was stale, and with the held push otherwise.
- `seedConfig` is a new method on the socket store.
- The page-data key `seed` is new. It is internal wire between the server load and the page.
- `answered` uses `Math.max`, so a slower earlier read never moves `readFrom` backwards.

## Host-visible changes, before and after
- **Config findings on stderr.** Before: `config: <file> [<key>] <message>` was written on every request, API routes included. After: once per page request, and on the portfolio watcher's read at start and on each config change. An API request no longer reads the configuration at all.
- **Page data grows.** `__data.json` (the page data the served build returns) goes from 181311 bytes to 269723 bytes, measured by `curl` on the served build of base and worktree. The page now ships its whole merged config as the seed.
- **After a config edit and a reload:** the page draws and writes with the edited values from its first frame. Before, the older values came back for the watcher's debounce.
- **Symlinks.** A symlink made or retargeted inside a watched root reaches the Repositories view on its own event, as on base.

## Before and after for the look
- Settings or behavior.yml: change `writes.timeout_seconds`, reload at once. Status bar and forms use the new value from the first frame. Before, the old value held for about 300 ms.
- Rail Bookmarks menu: an entry added to `~/.oculus/bookmarks.yml` by hand appears on the next opening of the menu, without a reload.
- Repositories view: `ln -s kept.txt newlink` inside a watched repository shows `newlink` untracked.

## Limitations
- The ctime rule assumes file times are not earlier than wall time. On darwin, 0 of 50000 writes broke that. Not verified off darwin. A backward step of the system clock after a read began would drop the writes of the stepped interval (not verified, from the reviewer's "Not checked").
- A root that is not a repository always reads with `error` set, so no event is ever dropped for it. That is base's behaviour for such roots.
- Two revert directives exceed 100 columns (`git-workspaces.test.ts:174`, `:201`); the width check exempts directives, as ruled.

## Doc text
- DESIGN.md:106 (git watcher): add "It drops an event whose path (the path itself, not a link's target), or the nearest folder above it that is still there, last changed before the newest successful read of that root began, since fseventsd can deliver the writes that made a root after its watch opened; a read that failed hides nothing."
- DESIGN.md:127 and :274 (mail): "watched so a write from outside republishes" becomes "polled every 500 ms so a write from outside republishes". At :274, drop ", so the first write is seen" after the folder clause.
- HELP.md:193: "the server watches the file" becomes "the server polls the file every half second".
- DESIGN.md, the socket or config section: add "A request reads the configuration at most once and only if it asks: the page's title and its load share one read, and an API route reads none. The page starts from the configuration its own read gave, with the newest `config` version that read is at least as new as, and takes only a push above it, so the push the hub replays from before a config change does not replace it."
- `channels.svg` needs no text change: it is identical to main. `layers.svg` gains the edges routes to server/core and server/accounts to server/watch.
