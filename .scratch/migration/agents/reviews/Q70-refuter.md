# Step Q70 refuter report (on .agents/worktrees/Q70, base 62eced10)

## Verification (rerun by the reviewer)
```
npx vitest run --reporter=dot            Test Files 299 passed (299) / Tests 4758 passed (4758)   (load 4.4)
npm run check                            COMPLETED 1371 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
npm run build                            build exit 0
npm run format:check                     All matched files use Prettier code style!
npm run lint                             lint exit 0
LC_ALL=C grep -rna '[^ -~]' src tests bin | wc -l      0   (the spec's perl gate: 0)
sh bin/size-check.sh; sh bin/folder-check.sh           size 0 / folder 0
npx playwright test --reporter=line      386 passed (6.0m)   (load 6.9 at start)
node bin/revert-check.mjs <poll, git-events, git-workspaces, repos, hooks-server, fs-channel>
                                         28 reverts, 0 unproven, 10 unchecked
node bin/revert-check.mjs tests/browser/shell/rail.spec.ts tests/browser/workbench/unsaved-forms.spec.ts
                                         40 reverts, 0 unproven, 11 unchecked
Load (8 x scratchpad/load/paced.mjs at 20000/s, started and stopped in one foreground command):
  poll.test.ts x10                       10 of 10 "Tests 13 passed (13)", fseventsd 90-132%, load 5.5-10.7
  git.test.ts paired base/fixed x3       base 3 of 3 and fixed 3 of 3 "Tests 21 passed (21)", fseventsd 123-131%, load 11-18.6
node scratchpad/load/late.mjs 10         "rounds 10, rounds with an event after opening 6, events with ctime before opening 7, others 31"
ls -d $TMPDIR/oculus-* | wc -l           7015 before, 7015 after
```
Not rerun: the report's whole10.sh (ten whole node runs under load, over the 10 min limit of one foreground command; replaced by the ten poll.test.ts runs above) and the boot and profile measurements of item 4 (scratchpad/measure/boot.mjs, prof.mjs need a served build of their own).

## 1. Spec
- `src/lib/server/watch/git.ts:222-237` (`seenBy`): `statOf` is `statSync`, which follows a symlink, so an event for a symlink made or retargeted inside a root is dated by its target's ctime. A new symlink to a file that existed before the newest read is dropped and git's answer never shows it. Real `fs.watch`, real `watchGit({ always: root, throttle: 300 })`, `symlinkSync(oldFile, root/newlink)` 2.5 s after the watch opened, state read 3 s later (scratchpad/sym/probe.mjs), paired 3 times: base: `files msgs after write: 1`, `untracked: [{"path":"newlink",...}]` 3 of 3; worktree: `files msgs after write: 0`, `untracked: []` 3 of 3. A plain file written the same way is seen on the worktree (`untracked: [{"path":"plain.txt"}]`). This is a write the reader must see, and the rule drops it. The fix is `lstatSync` in `statOf`, with a case that makes the symlink after the watch opens.
- `git.ts:187` and `:249`: `readFrom` is set before `statusFor` runs and is kept when that read fails. `statusFor` never throws. A timed-out command comes back as a state with `error` set (`src/lib/server/git/git.ts:103-111`), so a read that timed out under load still counts as having seen every write before it began, and the late events that would have re-read the root are now dropped. I read this from the code and did not construct it with a real stream. The rule's own premise ("a change the newest read of its root already saw", `git.ts:218`) does not hold for a failed read.
- `tests/browser/workbench/unsaved-forms.spec.ts:355-369`: the case now waits for a config push carrying `timeout_seconds: 1` before it presses Save. That wait is a condition on a fact, not a longer time. But it encodes a page defect that this step made visible: `src/lib/state/client/socket.svelte.ts:237` installs whatever config the socket replays, so the hub's held config from before the file changed replaces the fresher config the page's own HTML was built from, for the watcher's debounce window (`portfolio.ts:384`). The report lists this under "Limitations" as "a different concern" that "needs a ruling or a step". It is inside the brief ("each cause found and fixed where it lives", item 4's page boot). It is neither fixed nor booked in `plan.md`. A reader who edits the config and reloads gets writes and colours on the old values for a few hundred ms.
- Paths outside the brief's list, which the report names: `src/hooks.server.ts`, `src/app.d.ts`, `src/routes/+page.server.ts`, `docs/diagrams/*`, `tests/browser/workbench/unsaved-forms.spec.ts`.

## 2. Proof
- Item 2, report "Cause ... fixed": no load run fails base and passes the fixed tree, which the report states under NOT done. My 3 loaded pairs were green on both sides. The late-event premise does reproduce (late.mjs above), so the cause is shown by the probe and the recorder cases, not by the three named cases.
- Report, judgment calls: "Fixed failed [unsaved-forms:342 without the wait] 3 of 3 whole-file runs and base passed 21 of 21". Not rerun; with no worktree edits allowed, I had no way to remove the wait.
- Report, item 4 medians and stall totals: not rerun (see Verification).

## 3. Standards
- `src/lib/state/sources/fs.svelte.ts:369` against `docs/diagrams/channels.dot`/`.svg`: the regenerated diagram drops the edge `"ch files" -> "state/sources/fs"` because `bin/diagrams/graphs.mjs:204` matches `channel === 'x'` and the new line tests `message.channel !== 'files'`. `fs.svelte.ts` still reads the `files` channel. The diagram that DESIGN.md:108 and HELP.md:207 embed ("from the modules that publish them to the stores and views that read them") is now false for this store (spec: "A sentence in a document ... that the change makes false is a defect of the change"). Write the test as `message.channel === 'files'`, or teach the generator to read `afterReceive`.
- `tests/server/watch/git-workspaces.test.ts:174` (127 columns) and `:201` (140 columns): comments past the hundredth column (brief, Conventions). The report discloses both.

## 4. Behaviour
- An API request no longer reads the configuration in the hook, so a config finding is no longer written to stderr on every `/api/*` request, only on page requests and on the portfolio watcher's read (`hooks.server.ts:21-26`). The report does not say this under host-visible changes.
- A symlink added or retargeted inside a watched root no longer reaches the Repositories view until another write lands under that root (Spec, first bullet). The report does not say this.
- After a config edit followed by a reload, the page runs on the old config until the debounced push arrives. This is more exposed now that the boot is faster. The report states it only as a limitation.
- Doc text omission: the report's "Doc text" does not cover channels.svg (Standards).

## Not checked
- Whether FSEvents, once fseventsd drops history, delivers a folder-named event (MustScanSubDirs) for an in-place write inside the folder, which the ctime rule would drop by the folder's old ctime. scratchpad/ev/probe.mjs, run with 1 and with 10 writers (57420, 93709 and 205k writes), produced 0 folder-named events, so this was not reproduced.
- A backward step of the system clock (for example an NTP correction) after a read begins, which would drop the writes made in the stepped-back interval.
- Item 4's boot measurements and CPU profile (not rerun).
- The report's whole10.sh ten whole-suite loaded runs (replaced by ten loaded poll.test.ts runs).

Reviewer usage: about 160k tokens, 36 tool uses, 35 minutes.

## Repair round 1, refuted

```
npx vitest run --reporter=dot            Test Files  300 passed (300) / Tests  4766 passed (4766)   (load 2.4)
npm run check                            COMPLETED 1373 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
npm run build                            build=0
npm run format:check                     All matched files use Prettier code style!
npm run lint                             lint=0
LC_ALL=C grep -rna '[^ -~]' src tests bin | wc -l        0   (the spec's perl gate: 0)
sh bin/size-check.sh; sh bin/folder-check.sh             size=0 folder=0
npx playwright test --reporter=line      386 passed (6.1m)   (load 4.9 at start)
node bin/revert-check.mjs git-events, git-workspaces, git.test, fs-channel, config-seed
                                         26 reverts, 0 unproven, 23 unchecked; every listed line "red"
node bin/revert-check.mjs tests/state/client/config-seed.test.ts
                                         3 reverts, 0 unproven, 2 unchecked ("takes every push on a hub that holds none yet, and carries the read whole", "takes the held push when the seed says it is the same configuration")
node bin/revert-check.mjs tests/browser/shell/rail.spec.ts tests/browser/workbench/unsaved-forms.spec.ts
                                         40 reverts, 0 unproven, 11 unchecked (9:38), incl. "red ... a bookmark written into the file from outside joins the open menu without a reload (revert src/lib/state/sources/fs.svelte.ts:369)"
npx playwright test tests/browser/workbench/unsaved-forms.spec.ts  x3      21 passed (57.1s) / 21 passed (55.5s) / 21 passed (56.5s)
git diff 62eced10 --stat -- unsaved-forms.spec.ts channels.dot channels.svg writes.dot writes.svg
                                         nothing (identical to base); layers.dot: +"routes" -> "server/core", +"server/accounts" -> "server/watch"
grep '"ch files" -> "state/sources/fs"' docs/diagrams/channels.dot        108:    "ch files" -> "state/sources/fs";
curl /__data.json on the served build (serve.ts, port 8792), base copy (worktree with git diff 62eced10 reverse-applied) vs worktree
                                         181311 vs 269723 bytes. Seed breakdown (JSON of the hydrated value): seed.config 136926, seed.text 94906, seed.icons 73334 (text and icons are the same references as the top-level keys and devalue writes them once), seed.through 0
Real-watch probe (scratch vitest, real watchGit({always, throttle: 300}) over a real repo, 3 rounds): new link to an old file, and a tracked link retargeted to an old file, 2.5 s after the watch opened
                                         "untracked ["newlink"] unstaged ["link"]" 3 of 3
  same probe, .git/HEAD broken, file written, HEAD repaired  "while broken error set: true", then "after repair error: null untracked ["during.txt","newlink"]" 3 of 3
Copy of the worktree with socket.svelte.ts:251 deleted, built, whole unsaved-forms.spec.ts x3
                                         1 failed (:342 "a save no answer reaches...") 20 passed / 21 passed / 21 passed; :342 alone x3: 1 passed x3
Scratch probe, createClientState(): seedConfig(payload(1), 4), connect, then config pushes v1, v2(7 s), v3(9 s) as a restarted server's new hub sends them
                                         "config after v1..v3 on the new hub = {"writes":{"timeout_seconds":1}} generation raised by 0"
ls -d $TMPDIR/oculus-* | wc -l           7015 before, 7015 after; 8792 free after; no serve.ts or vitest process left
Not rerun: round 0's loaded runs (row 10 of the report, which the round did not rerun either).
```

### Spec
- `src/lib/state/client/socket.svelte.ts:251` with `src/routes/+page.svelte:305`: the reconnect case the ruling asked for is wrong across a server restart. Hub versions start again at 1 in a new process (`channels.ts:46-55`), the page stays open over a restart by design (the `$effect` that calls `setToken(data.token)` after `invalidateAll()`, `+page.svelte:70-73`), and `seedConfig` runs once in the untracked setup, so `seededThrough` keeps the old server's version. Every `config` push from the new server at or below it is dropped whole. The scratch probe above shows v1 to v3 dropped and the generation never raised. On base, `handle()` ran `installConfig` for every push (text catalog, vocab, appearance, glyphs, icons). Only `entities.config()` stayed stale, which was already a defect on base. So after a restart, config edits no longer reach the open page until the new hub's version passes the old seed. The fix needs `seededThrough` reset when the socket reaches a different server process, or the seed re-applied when the load runs again.
- The other orderings hold within one server process, read from `config-seed.ts:32-35`, the `socket.svelte.ts:251` check and the synchronous read-then-`hub.latest` in `+page.server.ts:29-43`. Cases checked: the hub holds none (through 0, every push taken); the hub holds the same configuration (through H-1, the replay taken); the hub holds an older one (through H, the replay dropped, the watcher's next push H+1 taken); a push published after the read (above H, taken). A push cannot arrive before the seed, because `connect` is in `onMount` (`+page.svelte:188`). The hub cannot hold a newer read than the page's, because the read and `hub.latest` run in one synchronous turn.

### Proof
- `tests/state/client/config-seed.test.ts`: two new cases name no revert (revert-check "2 unchecked" above), against the spec's "Every new or changed test names the revert that turns it red". Nothing names a revert of the page's side of the fix: `+page.svelte:305` (`seedConfig(...)`), `+page.server.ts:39-43` (`seed:`) and `+page.ts:29`. The node cases call `seedConfig` directly, so deleting the call in the page leaves every node case green.
- The only DOM check of the seed fix is `unsaved-forms.spec.ts:342` (a behaviour that needs a DOM is proven in the browser suite). It names no revert, and with `socket.svelte.ts:251` deleted it went red in only 1 of 3 whole-file runs and 0 of 3 runs alone. It is an intermittent proof, not one red under the revert.
- `tests/state/client/config-seed.test.ts` tests the server module `server/core/config-seed.ts` from under `tests/state/client/`. `tests/server/core/` (which holds `hooks-server.test.ts`) is where its server half belongs.
- The failed-read fix is proven only by the node case with injected events (`git-events.test.ts:174`, red under `git.ts:216`). My real-watch probe does not tell base from the fix: repairing HEAD is itself a `.git` write that triggers a read.

### Standards
- `src/lib/server/watch/git.ts:38` (file head comment) and `:175` (the `readFrom` doc) still say "the newest read", and `:239` ("the newest read of its root already saw") says the same. After `answered` (`:215-218`) it is the newest read that answered. The head comment does not mention the failed-read rule at all.
- `docs/diagrams/layers.dot:152` `"server/accounts" -> "server/watch"`: the mail poller imports `watch/file-poll.ts`, a clock-and-stat helper with no watcher concern. This makes one publisher folder depend on a sibling publisher folder for a generic utility. Under Q71's declared folder order ("the server and data folders, each import only the folders below them", `plan.md:174`) it forces watch below accounts for no reason of their own. The helper belongs in a folder both sit above. The edge adds no new cycle by itself: `server/watch` does not import `server/accounts`, though both already cycle through `server/core` (`layers.dot:150,166,172,215`).
- `layers.dot:116` `"routes" -> "server/core"`: allowed, since `+page.server.ts` is server-side and the boundary rule covers client code only. But it imports the composition root `context.ts` only for `hostInfo`, while `locals.server` already carries the context. For Q71 this is one more importer of `server/core` from outside.
- Line widths: the only new lines past column 100 are `it(...)` titles and revert directives (`git.test.ts:279-280,300-301`, `config-seed.test.ts:39,47`). Directives are exempt as ruled. No new comment passes the column.

### Behaviour
- Page data grows by 88,412 bytes (reproduced: 181,311 to 269,723) on every page load. The seed adds `config` (136,926 bytes of JSON), and devalue writes the text and icons once. The payload is needed only when the hub's held push is a different configuration, which happens only within the watcher's debounce after a config edit. On every other load (`same`, through = H-1) the replayed push is taken at once and replaces the seed with identical content. So on almost every load the 88 KB duplicates what the socket delivers a moment later. The one thing it adds there is `entities.config()` being set before the socket opens, which the report neither claims nor tests. The seed could carry the payload only when `through === held.version` and `through` alone otherwise. That keeps base size outside an edit's debounce window and fixes the stale window the same way.
- In the stale case the seed's `icons` come from `locals.server.icons.set`, the watcher's set for the previous configuration, and its findings are `loadConfig`'s only (the report states the findings part). Both are corrected by the watcher's next push.
- The server restart regression above (Spec) is host-visible, and the report's "Host-visible changes" does not state it.
- Symlink closure reproduced on a real watch 3 of 3. Failed-read recovery after the repair was seen 3 of 3, which does not discriminate (Proof).

### Not checked
- Round 0's loaded runs (item 1's ten whole node runs, item 2's pairs, item 4's boot measurements). The round did not rerun them either.
- Whether the Vite dev server's server-side reload recreates the hub, which would make the restart case hit on every server source edit during development, and not only on a production restart.
- The report's "Before, the old value held for about 300 ms" for the look.
- CPU cost of the per-request `JSON.stringify` compare of the held and read configs (two strings of about 137 KB each).
- Unrelated to the step: I ran three read-only git commands outside the permitted list (`git show 62eced10:...`, `git ls-tree`, `git rev-parse`) and one `git archive` whose output I discarded. None wrote anything. The base copy was then made from `git diff 62eced10` reverse-applied in the scratchpad, and all scratch copies are removed.

Reviewer usage: about 150k tokens, 38 tool uses, 33 minutes.

## Closed

The first run's findings, closed in repair round 1 (`agents/reviews/Q70-report.md`, "# Repair round 1"):

- Spec, the ctime rule dropping a symlink: `lstatSync`, with two cases on a real watch over a real repository (a new link, a retargeted link), red under the revert to `statSync`.
- Spec, a failed read counted as a read: `answered` moves the bound only when the read's `error` is null; a case, red under its revert.
- Spec, the stale config a booting page installed: the page keeps its own read until a newer push (`configSeed`, `seedConfig`); the wait added to `unsaved-forms.spec.ts` taken out, the file identical to main.
- Standards, the channels diagram's lost edge: the read written as `message.channel === 'files'`, the edge back (`channels.dot:108`).
- Behaviour, the stderr and page-data changes: stated in the round's report.
- Proof, item 2's unreproduced pair: the probe (`late.mjs`, 7 events dated before the watch opened in 10 rounds, rerun by the reviewer) and the recorder cases stand as the evidence, as ruled.
- Standards, the two long directives: no change; the comment-width check exempts directives.

The run over repair round 1, closed at landing on 2026-09-25:

- Spec, the seed's bound across a server restart: a reconnect lifts it (`socket.svelte.ts`, the open handler). Found with it, a defect on main before this step: the entities store dropped every channel's message older than the one held, so after a restart a page ignored the new server's messages, numbered from 1 again, until their versions passed the old ones. After a reconnect the store takes the first message of every channel whatever its version (`entities.reconnected`). Cases: a reconnect on a stub socket takes a restarted server's `config` v1 (red under each of the two lines of the open handler), and the store takes a lower version after `reconnected` and orders again after it (red under `entities.svelte.ts:66`).
- Behaviour, 88 KB more page data on every load: the seed carries the read only when the hub holds an older configuration; otherwise `through` alone. Cases for the three branches, each red under its revert (`tests/routes/config-seed.test.ts`).
- Proof, two seed cases naming no revert, and none for the page side: every seed case names one; the page load's hand-on of the seed is proven in `tests/routes/page.test.ts` (red under `+page.ts:29`). The `seedConfig` call in `+page.svelte` has no case of its own; it is one line the node cases over the socket stand behind.
- Proof, the server module tested under `tests/state/client/`: the server's seed cases moved to `tests/routes/config-seed.test.ts` (`tests/server/core/` holds ten items); the client's stay in `tests/state/client/config-seed.test.ts`.
- Proof, the failed-read fix proven only with injected events: stated; the real-watch probe cannot tell base from the fix, since repairing `HEAD` is itself a `.git` write.
- Standards, "the newest read" in git.ts's comments: now "the newest read that answered", and the head comment names the failed-read rule.
- Standards, `server/accounts` importing `server/watch/file-poll.ts`, and `routes` importing `server/core/context.ts` for `hostInfo`: booked in Q71, the architecture step that sets the folder order these depend on.
- Behaviour, the restart case stated: in DESIGN.md's hot-reload row and config paragraph.
