# Step Q68 refuter report (on .agents/worktrees/Q68, base f7c93a6b)

## Verification (rerun by the reviewer)
```
1. npx vitest run --reporter=dot
   run A (load avg ~13, fseventsd at 100% CPU):  Test Files 3 failed | 289 passed (292); Tests 4 failed | 4648 passed (4652)
   run B (same load):  Tests 3 failed | 4649 passed (4652), all 3 in tests/server/watch/git.test.ts:
     re-reads only the root that changed, once for a burst inside the window  (expected [ 'arming.txt' ] to deeply equal [ 'arming.txt', 'loose.txt', ...(2) ])
     publishes one files message naming the root a write landed under, and reads that root alone  (expected 8 to be +0)
     drops a root the sessions payload no longer names  (expected 1 to be +0)
   run C (load avg 12):  Test Files 292 passed (292); Tests 4652 passed (4652)
2. npm run check:  COMPLETED 1339 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
3. npm run build:  build exit 0
4. npm run format:check:  All matched files use Prettier code style!
5. npm run lint:  lint exit 0
6. LC_ALL=C grep -rna '[^ -~]' src tests | wc -l:  0
7. sh bin/size-check.sh: exit 0;  sh bin/folder-check.sh: exit 0
8. node bin/revert-check.mjs tests/server/watch/git.test.ts:  5 reverts, 0 unproven, 21 unchecked (all 5 red: git.ts:403 x3, :293, :413)
9. Load runs, 8 x churn.mjs beside each run:
   whole node run x3:  Tests 4652 passed (4652) each; target case passed in 3427, 1989, 3310 ms
   git.test.ts alone, Q68 and base run alternately, x4 each:  Q68 26/26 x4; base 22/22 x4
   git.test.ts alone at natural load, no churn: Q68 5 runs -> 1 failure each in 4 of them (the three cases above, never a workspaces case); base 5 runs -> target case failed 3 of 5 (6211, 6660, 6398 ms), nothing else failed
   Alternating at natural load, x4 each:  Q68 26/26 x4; base failed the target case once (6211 ms)
10. ls -d $TMPDIR/oculus-* | wc -l:  7015 before, 7015 after

Quoted in the report as evidence:
- Cause reproduction. The reviewer's own test, in scratch copies of base and Q68: start watchGit with workspacesFile, write the file right away, wait 15 s for a second roots read, 10 cases:
    base, no load: Tests 10 passed (10)
    base, churn:   REPRO 0/6/8 asked 1 after ~15020 -> Tests 3 failed | 7 passed (10); second run REPRO 4/6/9 -> 3 failed | 7 passed
    Q68, churn:    Tests 10 passed (10), twice
  This matches the report's claim: base loses the write while the stream registers, and the fix removes the loss.
- Builder's run files scratchpad/runs/run1..10.txt: summary.txt exits 1,1,0,1,0,0,0,0,1,0. Runs 1 and 2 failed only scratch.test.ts (5008 ms, 6467 ms), runs 4 and 9 failed only the two mail/poll.test.ts cases, the target case is present and passing in all 10. Matches the report.
- mail/poll.test.ts + scratch.test.ts under churn, alone, x5: Tests 19 passed (19) each; "is swept by every file under tests that takes one" took 2809-3347 ms (2431 ms unloaded) against the 5000 ms default timeout.
- grep -rn "watchWorkspaces\|workspacesWatch" src tests config HELP.md DESIGN.md README.md: prints nothing.
- wc -l: git.ts 419, git.test.ts 836. Matches the report.
- 192 revert directives in src/tests are over 100 columns. Matches the report.
```

## 1. Spec
- tests/server/watch/git.test.ts:683-718, "reads a root written to the workspaces file the moment it starts": brief item 3 asks for "a test that reproduces the cause". This case does not reproduce the FSEvents drop. It asserts `asked === 2` synchronously after `clock.fire()`, so it goes red under any event-driven watcher, including an fs.watch that delivers every event, and it would stay red if the drop were fixed some other way. It proves that the poll runs, not that a lost event is recovered. The report says so under "Limitations" but marks the row DONE. The only reproduction of the cause is a deleted temporary test and the builder's scratchpad scripts; nothing in the tree reproduces it.
- src/lib/server/watch/git.ts:137-150: the change hand-rolls a stat poll (`signature`, `pollWorkspaces`). `src/lib/server/watch/bookmarks.ts:16-18,80` already polls a file in the same `~/.oculus` folder through node's `watchFile`. The report gives bookmarks.ts as the precedent for polling but does not say why that mechanism was not reused. The injectable clock that makes the cases deterministic is the likely reason, and the report does not state it.

## 2. Proof
- Brief item 1, "every file and case passes": at the machine's natural load (fseventsd at 100%, load average 12 to 14) two of the reviewer's three whole runs failed: 4 cases, then 3 cases in git.test.ts. The report quotes one unloaded green run only. The three failing git.test.ts cases do not pass `workspacesFile`: `workspacesFile` appears only at git.test.ts:667,704,734,772,802, so the diff does not reach them. They are the same class of fs.watch-arming or late-event flake as the booked case. In five runs each at that load they failed 4 of 5 on Q68 and 0 of 5 on base, and the alternating runs that followed were all green on both, so the reviewer could not tie them to the change or rule it out. The report does not name them.
- src/lib/server/watch/git.ts:137-150: `signature` documents "the file appearing, going and coming back" and an `unreadable:` branch. Deleting the file after start and a stat that throws (ENOTDIR, EACCES) are not exercised by any case. The spec requires every asynchronous path to be exercised in flight, after close and superseded; in-flight and superseded ticks have no case either.
- The report cites `src/lib/server/accounts/mail/poll.ts:304`. The `watch(options.dir, ...)` call is at :303; :304 is `if (stopped()) return;`.

## 3. Standards
- tests/server/watch/git.test.ts:756: a 157-column revert directive. The brief's Conventions say comments end by the hundredth column. The report discloses it, citing the tool's one-line requirement and 192 existing long directives (reproduced). It is still a break of the brief's rule.
- src/lib/server/watch/git.ts:142: `signature` is exported and nothing imports it (`grep -rn "watch/git.ts'" src tests` finds only context.ts, which imports watchGit and types). This breaks the spec's YAGNI principle ("nothing is built for a need the plan does not name").
- src/lib/server/watch/git.ts:19: "The same watch answers a second question" now directly follows the new poll paragraph (:12-17), so "the same watch" reads as the poll. The head comment has become unclear about which mechanism publishes on `files`. Spec rule: "A sentence in a document or a head comment that the change makes false is a defect of the change".
- DESIGN.md:106 ("Watchers": each channel "owns its `fs.watch` handles"; git "watches each workspace's `.git/index` and worktree") no longer describes all of the git watcher, which now polls a file. The report lists it under "Doc text", as the brief asks.

## 4. Behaviour
- A root added through the page's workspaces save used to be picked up on the fs.watch event (7 to 88 ms per the report's own measurement). It is now picked up on the next 500 ms tick: `POLL`, git.ts:53, a fixed constant with no config key. The report states the new figure ("within half a second") under judgment calls, but not the before and after that the spec's look needs (the view, the state to put it in, what differs).
- The server now runs a `statSync` of `~/.oculus/workspaces.json` every 500 ms on the main thread for as long as it runs. The report states this under Limitations.
- A machine whose `~/.oculus` folder does not exist at start now sees the first workspaces save. Before, it was never seen until a restart. The report states this.

## Not checked
- The browser suite beside the node runs (the brief's preferred load). Ports 8790 and 8792 were not touched; file-churn load was used instead, as the builder did.
- Ten whole node runs under load: the reviewer ran three loaded whole runs, not ten.
- Whether the three other git.test.ts failures at natural load happen at the same rate on base in whole runs. They were seen on Q68 only. The paired file-alone runs did not settle it.
- The mail/poll.test.ts failures were not reproduced: 0 of 5 alone under churn. The defect shape at poll.ts:303 (a folder fs.watch armed right before the first write, with no fallback) was confirmed by reading the code.

Reviewer usage: about 125k tokens, 27 tool uses, about 30 minutes.

## Repair round 1, refuted

```
Run from .agents/worktrees/Q68/tools/oculus over the repaired tree:
ls -d $TMPDIR/oculus-* | wc -l (before):  7016
1. npx vitest run --reporter=dot (natural load, load avg ~10-15):  Test Files 293 passed (293); Tests 4657 passed (4657)
2. npm run check:  COMPLETED 1341 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
3. npm run build:  build exit 0
4. npm run format:check:  All matched files use Prettier code style!
5. npm run lint:  lint exit 0
6. LC_ALL=C grep -rna '[^ -~]' src tests | wc -l:  0
7. sh bin/size-check.sh: exit 0;  sh bin/folder-check.sh: exit 0
8. node bin/revert-check.mjs tests/server/watch/git-workspaces.test.ts tests/server/watch/git.test.ts:
   10 reverts, 0 unproven, 21 unchecked; all 10 red (git.ts:410 x3, :294 x2, :370, :149, :420, :369, :366)
9. Load runs (own churn.mjs: write, rename, remove in a loop, 8 processes; stopped after, pgrep -f churn.mjs | wc -l = 0):
   whole verbose runs beside 8 churn, x3:
     run 1: Test Files 293 passed (293); Tests 4657 passed (4657)
     run 2: Tests 1 failed | 4656 passed, the one: mail/poll.test.ts "makes the mail folder when it is not there, so the first write from outside is seen" 2275ms
     run 3: Tests 1 failed | 4656 passed, same mail case 2318ms
     no git watcher case failed in any of the three.
10. ls -d $TMPDIR/oculus-* | wc -l (after):  7015 (one fewer; not grown)

Commands the round's report quotes, rerun or replaced:
- Ruling 1, paired alternating runs of git.test.ts alone, base (scratch copy of the worktree with git diff f7c93a6b reversed; 22 cases) against Q68 (21 cases):
    natural load (load avg 10-12, fseventsd at 0.1% CPU), 8 per side: base 22/22 x8; Q68 21/21 x8.
    beside 8 churn (load avg 13-29), 6 per side: base 22/22 x5, 1 failed x1 ("reads a root added to the workspaces file while it is running", 7509ms); Q68 21/21 x6.
  The three cases ("re-reads only the root that changed...", "publishes one files message...", "drops a root the sessions payload no longer names") failed 0 times on either side in 28 file runs and 4 whole runs.
- Added: round-0 tree (scratch copy with git diff 3506ea9a reversed, the file the first reviewer saw fail) against round 1 (git.test.ts + git-workspaces.test.ts), alternating at natural load, 6 each: round 0 26/26 x6; round 1 31/31 x6.
- grep -rn "export function signature\|watchWorkspaces\|workspacesWatch" src tests config HELP.md DESIGN.md README.md: prints nothing.
- grep -n "watch(options.dir" src/lib/server/accounts/mail/poll.ts (worktree and main): 304:            notesWatch = watch(options.dir, (_event, name) => {
  sed -n 303p: mkdirSync(options.dir, { recursive: true, mode: DIR_MODE });
- wc -l: git.ts 426, git.test.ts 575, git-workspaces.test.ts 319, repos.ts 118. Matches the report's table.
- ls tests/server/watch: 7 entries (5 tracked + 2 untracked), under ten.
- The throw-on-entry probe, the stale.mjs probe and the builder's paired.sh / loadruns2.sh outputs were not rerun (their paths are the builder's scratchpad, not named); replaced by the paired runs above.
```

### Spec
- Ruling 1 (git.test.ts, the three cases): not closed by a cause. Neither the builder nor this rerun has a failing run: 0 failures in 28 paired file runs, 4 whole runs, and 6 runs of the round-0 file itself. The first reviewer's 4-of-5 failures came with fseventsd at 100% CPU; today it sits at 0.1%, and that condition could not be recreated. The builder's own probe (`signature` and `pollWorkspaces` throwing, the three cases still green) proves only that these cases pass no `workspacesFile`, which the diff already shows. The watcher code these cases run is unchanged from base, so the round has no fix for them. They stay an unexplained finding and have to be booked, not counted as closed.
- Ruling 7, the report's "Repair round 1" item 7 and its open-items line: the report says the mail poller's `watch(options.dir, ...)` call is at `poll.ts:303`. It is at :304 in the worktree and on main (grep above); :303 is `mkdirSync`. The ruling carried a wrong correction, and round 0's :304 was right.
- src/lib/server/watch/git.ts:366, `if (closed) return;`: a real fix. Without it, a tick whose roots read closes the watcher schedules one more timer after `close` has already cleared `polling`. The case "schedules no next tick when the watcher is closed during one" (git-workspaces.test.ts:298) goes red under the revert of :366 (revert-check). No caller in `src` closes from inside `roots`, which the report says.
- The test split and the allow-list edit are sound. The helpers moved unchanged into repos.ts. The allow-duplication.txt entry keeps its mark `c81eea90e56f` and only renames the pair to the file the `git()` clone moved to. The entry count is the same. The whole suite, which includes duplication.test.ts and fails on a stale entry, is green. No check was loosened.

### Proof
- git-workspaces.test.ts:224, the EACCES case: under its revert (`git.ts:149 => throw error;`) it goes red because `watchGit` throws at construction. The later "keeps polling through the refusal" part (`pending() === 1`, then a read after repair) has no revert of its own. It is red for the construction throw, not for the polling claim.
- git-workspaces.test.ts:102, "reads a write no file event announced, at the next tick": revert `git.ts:410` delete, red. The watcher no longer listens for any file event on the workspaces file, so "no file event announced" holds by construction. The case proves the same as :126 and :175: a changed signature is read at a fired tick. The comment says so, which satisfies ruling 2.

### Standards
- tests/server/watch/git-workspaces.test.ts:201: a new revert directive is 101 columns (`awk 'length>100'`), over the brief's hundredth-column rule. :174 (157 columns) is carried from round 0 and is disclosed.
- tests/server/watch/git-workspaces.test.ts:1: the new file's head comment names no layer. The spec says every added module opens with "its layer ... A file without one is a defect". repos.ts:1 does it ("Layer 4, test helper."). git.test.ts, which the new file copies, lacks it as well: 27 of the 38 files under tests/server/*/ lack it.
- DESIGN.md:106 still does not say the git watcher polls the workspaces file. It is reported under "Doc text", as the brief asks.

### Behaviour
- A root added through the page's workspaces save is now read at the next 500 ms tick (`POLL`, git.ts:54, no config key), where before it was read on the fs.watch event. The server stats `~/.oculus/workspaces.json` every 500 ms on the main thread. Both are stated in the report's before and after.
- Not caused by this step, and seen in 2 of 3 whole runs under churn: mail/poll.test.ts "makes the mail folder when it is not there, so the first write from outside is seen" fails. This is the same folder fs.watch arming defect, at poll.ts:304. The report lists it as outside the step. It needs its own booked step.

### Not checked
- The browser suite beside the node runs (ports 8790 and 8792 were not touched); file churn was used instead.
- Ten whole runs under load: three were run.
- The natural-load condition the first reviewer saw (fseventsd at 100%) was not present and could not be recreated, so the three git.test.ts cases were not tested under it.
- The builder's stale.mjs probe and its throw-on-entry probe were not rerun.

Reviewer usage: about 120k tokens, 26 tool uses, about 40 minutes (not measured).

## Closed

The first run's findings, closed in repair round 1 (`agents/reviews/Q68-report.md`, "# Repair round 1"):

- Spec 1, the test of the cause: the case is named and commented for what it proves, a write no file event announced read at the next tick; the churn reproduction is the report's evidence of the cause, since no case can make FSEvents drop an event.
- Spec 2, the own poll beside `watchFile`: kept for the injected clock, and said beside it (`git.ts:356-363`).
- Proof 1, the three other git.test.ts cases failing at natural load: not closed by a cause. Booked as Q70 (below).
- Proof 2, the signature's branches and the ticks in flight, after close and superseded: six cases, each red under its revert; the in-flight case found a real defect, a tick that closed the watcher scheduling one more timer, fixed at `git.ts:366`.
- Proof 3, the mail poller's line: the watch call is at `poll.ts:304`, as the first report said; the orchestrator's ruling that it was :303 was wrong (`grep -n "watch(options.dir"` prints 304).
- Standards 1, the 157-column directive: no change; `tests/checks/source/comment-width.test.ts` exempts revert directives.
- Standards 2, `signature` exported: unexported.
- Standards 3, the head comment's "the same watch": rewritten to name the recursive watch over each root.
- Standards 4 and Behaviour: DESIGN.md:106 applied at landing; the before and after stated in the round's report.

The run over repair round 1, closed at landing on 2026-09-24:

- Spec, ruling 1 not closed by a cause: booked as Q70 with the mail poller, the same folder `fs.watch` shape.
- Spec, ruling 7's wrong correction: a record; the right line is `poll.ts:304`.
- Proof, the EACCES case's polling claim with no revert of its own: a directive added at landing, `git.ts:374 => delete` (the tick's rescheduling), red under revert-check.
- Proof, the no-event case proving the same as two others: stated in its comment, as ruled; no change.
- Standards, the 101-column directive: no change; directives are exempt.
- Standards, the new test file's head comment without its layer: added at landing.
- Behaviour, the mail poller case failing in 2 of 3 whole runs under churn: booked as Q70.
