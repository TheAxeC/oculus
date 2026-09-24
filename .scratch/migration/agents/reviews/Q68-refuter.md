# Step Q68 refuter report (on .agents/worktrees/Q68, base d0232795)

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
