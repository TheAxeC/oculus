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
