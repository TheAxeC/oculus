# Step Q69 refuter report (on .agents/worktrees/Q69, base 12f542f5)

## Verification (rerun by the reviewer)
```
ls -d $TMPDIR/oculus-* | wc -l                      -> 7015 before, 7015 after every run below
1. npx vitest run --reporter=dot                    -> Test Files 298 passed (298) / Tests 4738 passed (4738)
2. npm run check                                    -> COMPLETED 1368 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
3. npm run build                                    -> exit 0
4. npm run format:check                             -> All matched files use Prettier code style!
5. npm run lint                                     -> exit 0
6. LC_ALL=C grep -rna '[^ -~]' src tests | wc -l    -> 0 (also 0 over bin config/text package.json)
7. sh bin/size-check.sh; sh bin/folder-check.sh     -> exit 0, exit 0 (bin/ holds 10 items)
8. npm run build; npx playwright test               -> 380 passed (8.4m); port 8792 was free (lsof rc=1)
9. node bin/revert-check.mjs (node files)
   background, agents.test, help.test, type-scale   -> 20 reverts, 0 unproven, 11 unchecked
   diagrams.test, dispatches.test                   -> 56 reverts, 0 unproven, 2 unchecked
   dispatch-note.test, watch/sessions.test          -> 26 reverts, 0 unproven, 10 unchecked
   (browser files)
   session-tabs.spec, tinted.spec                   -> 11 reverts, 0 unproven, 1 unchecked
   system.spec, agents.spec                         -> 11 reverts, 0 unproven, 5 unchecked
   views.spec                                       -> 18 reverts, 0 unproven, 6 unchecked
10. npm run diagrams                                -> wrote the six files; git status --short docs prints nothing; diagrams.test.ts 32 passed
11. tmp count                                       -> 7015 = 7015
Report's evidence:
   npx vitest run tests/server/core/dev-server.test.ts          -> 2 passed
   node bin/revert-check.mjs tests/server/core/dev-server.test.ts -> 2 reverts, 0 unproven, 0 unchecked (both red under vite.config.ts:15)
   git show 12f542f5:.../vite.config.ts                         -> componentBeforeStyle() at :15; style-first.ts on the base (item 9 already on the tree: reproduced)
   git show 12f542f5:.../Help.svelte | grep '<Pane'             -> 52:<Pane title={t('views.help')}> (premise 5 wrong: reproduced)
   wc -l on Agents.svelte, dispatches.ts, background.ts, PickSession.svelte, views.spec, dispatches.test, SessionDetail, cache.ts -> 247, 235, 112, 42, 548, 564, 507, 114, as reported
```

## 1. Spec
- src/lib/server/sessions/stores/background.ts:30,74: `ENDED_WELL = /^(?:completed|done|success)$/` and every other status reads `error`, so a completion notice with `<status>killed</status>` marks the row as an error. The checked shapes (Q69-checks.md, last paragraph) say `killed` is one of the real values and means the agent was stopped. It is not a failure, and item 7 asks for the state to be read from what the agent does. `done` and `success` do not appear in the recorded shapes. No case covers `killed`.
- src/lib/server/sessions/stores/background.ts:68-78: a notice is matched only by `<task-id>` against the agent id that `takeLaunch` kept. The real notice also carries `<tool-use-id>`, which is the key of `acc.background` directly. When the launch answer names no agent id (`acc.background[id] === ''`), the notice cannot end the row, and it falls back to the 30-minute idle rule. Read from a real log (`~/.claude-work/projects/.../03a4d5a8-...jsonl`): task-id `aa7be0b0699d15833` equals the launch's `agentId`, and `<tool-use-id>toolu_01UBoJNfufv5K8kVTY1gDLXj</tool-use-id>` is present, so the current rule does work on that sample.
- bin/diagrams/writes.mjs:16-18 and tests/checks/diagrams/diagrams.test.ts:476: brief item 3 says the head comment names only what cannot be followed without running the code. Decision 2 says a function passed across modules is not followed. The builder kept decision 2 and named the cross-module case in the head comment with a scope reason (report judgment call 2). This is a clash between two parts of the brief, and it was resolved by the builder rather than stopped. The ruling is still open.
- src/lib/server/sessions/cache.ts:67,85 with stores/dispatches.ts:196-208: item 4 asks that a reused launch read done "for good". The list lives in the transcript cache. That cache is still thrown away whole when it is corrupt or at the next `CACHE_VERSION` bump (cache.ts head comment), and a failed write is still called "not an error: the next scan simply pays for a full read" (:67, :85). Either way the reused list is lost, and a later scan whose `ps` fails flips the row back to running. Those two sentences are now false for the `reused` field.
- Widened paths judged: the `bin/diagrams/` split (bin/ is at 10 items; the diagrams check is green; `npm run diagrams` regenerates byte-identical output), the `help.diagram_failed` text, `PickSession.svelte`, the tinted Help and Doc boxes (needed once premise 5 proved wrong; DESIGN.md:193 already requires the tint), and `CACHE_VERSION` 2 to 3 all follow from the items. `Project.svelte:335` and the `restore_tip` text are outside the items' wording. The report names both (judgment calls 6 and 7).

## 2. Proof
- tests/server/sessions/stores/background.test.ts:99: the only launch fixture sets `run_in_background: true`. `fold.ts:171` therefore marks the launch, and `isLaunch` returns at `background.ts:45` before it reads `toolUseResult`. The checked real shape is a launch whose call leaves `run_in_background` unset and whose answer carries `isAsync`/`async_launched`. Only the branch at `background.ts:47` handles that shape, and no case runs it. Replacing `:47` with `return false` would leave all three cases green (found by reading; I did not run that revert).
- tests/browser/workbench/session-tabs.spec.ts:126-154: the pick control is proven only in Agents and Terminal. The swaps from `Empty` to `PickSession` in Transcript.svelte:168, Changes.svelte:207, Timeline.svelte:145 and SessionDetail.svelte:275 have no case. Reverting any one of them to `Empty` stays green.
- src/lib/views/boards/project/Project.svelte:335-337: the project board's inline code losing its fill over a wallpaper has no case. Reverting it stays green.
- tests/browser/workbench/system.spec.ts:197: a new fixed `page.waitForTimeout(300)` before asserting `finished` is empty. The report names only the 1 s watcher wait. The red under the revert comes from the `failed` poll, not from this wait.
- tests/server/watch/sessions.test.ts:555: the new fixed `sleep(1000)` guards a "nothing published" assertion, in the same form as the file's existing 600 ms waits (:397, :445, :593, :603). It widens no existing wait, and the case is red under `dispatches.ts:202 => const state = false` (revert-check). The `quiet()` added to the existing "exits unstamped" case is a precondition wait, not a loosening; that case is red under its revert.

## 3. Standards
- src/lib/server/sessions/cache.ts:67,85: two comments the diff makes false (see Spec). This breaks spec.md "A sentence in a document or a head comment that the change makes false is a defect of the change".
- tests/checks/diagrams/diagrams.test.ts:476: "audits that a function passed to a function of another module is not followed" asserts a limitation and fails the day that limitation is lifted. Decision 2 calls it scope, not a defect, so this stands only if the ruling on the clash above keeps decision 2 (spec.md: "A test never asserts a known defect").
- No file is over 900 lines and no component over 540 (size-check exit 0). No folder is over ten items. The ASCII gate is clean. Every comment line over 100 columns in a touched file is a `revert:` directive or an `eslint-disable` line.

## 4. Behaviour
- Code blocks (`pre`) in Help, Doc and the source preview lose their own fill and blur over a wallpaper (Markdown.svelte:114-116). This appears only as judgment call 5. "Changes a reader sees" has no before and after for it.
- `CACHE_VERSION` 2 to 3 makes the first scan after landing fold every transcript again from zero on the user's machine (DESIGN.md:112 records 490 files and 1.2 GB). The report states this only as judgment call 4, with no time measured and no line in "Changes a reader sees".
- A launch row that reads done because its process exited, with no stamp, used to show a count up to its builder session's last activity and now shows no count (dispatches.ts:120-124, Agents.svelte:92-97). It is in judgment call 9, not in "Changes a reader sees".
- The `restore_tip` tooltip text changed from "...back to the rail" to "...back to the list". It is in judgment call 7 only.
- A background subagent whose notice says `killed` now reads error in the Agents view (see Spec). The report does not state it.

## Not checked
- The look on the TEST page (the orchestrator's).
- The time the re-fold after the version bump takes on the real transcript store (not measured).
- Item 7 beyond one real session log. I did not check a subagent that is resumed after its notice, whose notice fires again (the real note says "fires each time this agent stops").

Reviewer usage: about 190k tokens, 45 tool uses, 37 minutes.

## Repair round 1, refuted

```
ls -d $TMPDIR/oculus-* | wc -l                -> 7015 before, 7015 after every run below
1. npx vitest run --reporter=dot              -> run 1: Test Files 1 failed | 297 passed (298), Tests 1 failed | 4742 passed (4743), the failing case not captured
                                                 run 2: FAIL tests/server/edit/entry-edit.test.ts > every collection entry of the real hub, read only > ... Error: Test timed out in 5000ms.
                                                 run 3: Test Files 298 passed (298) / Tests 4743 passed (4743)
   npx vitest run tests/server/edit/entry-edit.test.ts -> Tests 52 passed (52)
2. npm run check                              -> COMPLETED 1369 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
3. npm run build                              -> build=0
4. npm run format:check                       -> All matched files use Prettier code style!
5. npm run lint                               -> lint=0
6. LC_ALL=C grep -rna '[^ -~]' src tests | wc -l -> 0; the spec's perl gate over src tests bin config -> 0 lines
7. sh bin/size-check.sh; sh bin/folder-check.sh -> size=0, folder=0
8. npm run build; npx playwright test         -> 385 passed (11.9m); lsof -iTCP:8792 rc=1 before the run
9. node bin/revert-check.mjs over the 12 test files the round changed:
   diagrams, dispatch-note, dispatch-note-race, dev-server, background, dispatches, watch/sessions, views/agents
                                              -> 102 reverts, 0 unproven, 11 unchecked (10 existing cases in watch/sessions.test.ts, 1 existing audit in dispatches.test.ts)
   tinted.spec, session-tabs.spec             -> 16 reverts, 0 unproven, 1 unchecked (existing case)
   system.spec, agents.spec                   -> 11 reverts, 0 unproven, 5 unchecked (existing system.spec cases)
10. npm run diagrams; git status --short docs -> the files written; git status prints nothing
    npx vitest run tests/checks/diagrams/diagrams.test.ts tests/server/core/dev-server.test.ts -> Test Files 2 passed, Tests 34 passed
11. tmp count                                 -> 7015 = 7015
```

```
Report's evidence:
  Verification lines 1-8, 10, 11          -> reproduced as above (the node suite green on 1 of 3 full runs; the two failures were a real-hub read timeout and one case whose name the dot reporter did not print, neither in a file the round touched)
  revert-check, the round's new cases     -> each red as the report names: writes.mjs:326 and :237; background.ts:52, :79, :35, :86; transcripts.ts:301 (dispatches.test and watch/sessions.test); dispatches.ts:199; Agents.svelte:87; session-tabs Transcript:168, Changes:207, Timeline:145, SessionDetail:275; tinted Project.svelte:336; system.spec Diagram.svelte:58
  Refold time, scan() over ~/.claude-work/projects and ~/.claude/projects, cache and note in the scratchpad, probe stubbed (node --experimental-strip-types), load average 13-19:
                                          -> empty cache 1599, 1618, 1186, 782, 914, 1131 ms; warm 47, 43, 28, 138, 127, 19 ms; 11 sessions. The report gave 735-821 ms and 7-8 ms. My runs were under load, so the order of magnitude is reproduced but the "about 0.8 s" figure is not.
  Stale-lock wait: update() from bin/dispatch-note.mjs against a fresh lock naming a live `sleep` pid, scratch dir
                                          -> "wrote 2029 ms": a synchronous 2 s block before the lock is broken
  Build output: grep -rl "dispatch-note: " build -> build/server/chunks/chunks/transcripts.js-*.js (the writer is bundled into a chunk, not the entry, so its isMain() guard stays false in the built server)
```

### Spec
- src/lib/server/sessions/stores/background.ts:14-16, 100-120: ruling 3 asked for a resumed subagent to be handled. A resumed subagent now takes its status from the latest notice, but between the resume and its next notice the row keeps the earlier notice's `done` or `stopped` while the agent is running. The report says so only inside ruling 3, not under Limitations. Item 7 asks that a background agent's state be read from what it still does, including its transcript's growth. `settleBackground` skips every row that is not `running` (:114), so a transcript `subagents/agent-<id>.jsonl` that grows after the notice's stamp never sets the row back to running. That growth can be read from the file's mtime, which the module already reads, with no need to know the resume shape. Item 7's defect ("reads done while it runs") is therefore still there for a resumed agent.
- src/lib/server/sessions/stores/dispatches.ts:633-647 and transcripts.ts:300-302: item 4 asks for a launch that "reads done for good, whatever a later scan's `ps` answers". If the stamp cannot take the lock, it is only logged, and the next try happens only on a scan that sees the reuse again. A later scan whose `ps` fails does not see the reuse, so it reads the running pid as the builder and flips the row back. The window is narrow (lock held for 2 s or more), but it is the flip the item forbids. It appears in the report as judgment call 3, not as a limitation.

### Proof
- src/lib/server/sessions/stores/dispatches.ts:638 (`&& !record.endedAt`) and transcripts.ts:302 (`note.endedAt ||= stamp`): the report says the stamp "keeps any stamp already there" and that "the same scan's row carries the stamp at once". I found no case red under either revert. The dispatches.test case at :466 checks the row only after a second scan. The watcher case waits for a rescan that the note's own watch triggers. Found by reading; I did not run these reverts, since that needs a directive added to a file.
- tests/browser/workbench/system.spec.ts:203: `expect.poll(() => finished.length).toBe(1)` passes on the first reading of 1. A held answer that finished after that reading would still pass, so this assertion does not prove what its comment (:196-197) says. The case's red under the revert comes from the `failed` poll at :192. The fixed wait is gone, which closes the ruling as written.
- The stamp that fails on the lock (dispatches.ts:643-646) has no case.

### Standards
- bin/dispatch-note.mjs:311-318, :293-295, :325-327: `update`, `readNote` and `readFlags` each now carry two JSDoc blocks in a row, the old description and a new block with only the types. Editors and TypeScript attach only the last block, so the description of each function is detached from it. Each should be one block.
- src/lib/server/sessions/stores/dispatches.ts:24: the import of `../../../../../bin/dispatch-note.mjs`, judged:
  - It breaks none of the boundary rules the spec names, and `boundaries.test.ts` passes.
  - The file now falls under `npm run check` (tsconfig `allowJs`/`checkJs`), which reports 0 errors.
  - `bin/size-check.sh` and the ASCII gate already covered `bin/`.
  - The file keeps main's `LOCK_WAIT_MS = 2000` and mode 755 (`git diff 007c637b` shows `old mode 100644 new mode 100755`). Apart from the JSDoc annotations, it differs from main at 505be196 only in the head comment's new sentence.
  - The dev-server test's copy of `bin/dispatch-note.mjs` (dev-server.test.ts:35-47) is needed because `src` now imports it. It hides nothing: the built server bundles the file, as the build grep above shows.
- The `stopped` status is carried to every place that reads an agent status:
  - the payload comment (model-sessions.ts:29-31);
  - the only view that reads it (Agents.svelte:47-52 for the tone, :87 for the words);
  - the catalog key `sessions.ag_stopped`, which Agents.svelte reads;
  - `--c-amber`, which is defined in tokens.css and themes.css;
  - the watcher's signature (watch/sessions.ts:131), which takes the status as a string.
  No other client file reads `agent.status` (`grep -rn` over src).

### Behaviour
- src/lib/server/sessions/stores/transcripts.ts:301 with bin/dispatch-note.mjs `takeLock`: the stamp runs inside `scan()`, which is synchronous on the server's main thread (watch/sessions.ts:184-231). The lock wait uses `Atomics.wait`, so a lock held by a live process blocks the whole server, sockets and terminals included, for 2029 ms (measured above) on any scan that sees a reused pid. The report names "up to about 4 s" as a limitation and leaves it unfixed.
- The server now writes the real `~/.oculus/dispatches.json`, which before this round only launchers wrote. It also runs `sweepLitter` there on every stamp, removing left-behind lock and temporary files of dead pids. The Doc text for DESIGN.md:115 covers the stamp but not the sweep.
- The resumed subagent that reads done or stopped while it runs (see Spec) is a behaviour a reader sees. It is not listed under "Changes a reader sees".

### Not checked
- The look on the TEST page (the orchestrator's).
- The real transcript shape of a resumed subagent (how a resume is recorded), beyond reading the code.
- Whether the first full node run's failing case was in a file the round touched: the dot reporter did not name it, and the next two full runs did not reproduce it.

Reviewer usage: about 120k tokens, 42 tool uses, 50 minutes.

## Closed

The first run's findings, closed in repair round 1 (`agents/reviews/Q69-report.md`, "# Repair round 1"):

- Spec 1, `killed` read as error: read as stopped, with its words and an amber dot; `done` and `success` dropped.
- Spec 2, a notice matched by the agent id alone: matched by its `<tool-use-id>` first.
- Spec 3, the brief's item 3 against its decision 2: decision 2 revised by the orchestrator; a function passed across modules is followed, and the audit asserting the limit replaced by a case proving it.
- Spec 4, the reused mark lost with the cache: kept in the launch note itself by a stamp; the cache comments true again.
- Proof 1 to 4: the real launch shape proven; the four other pick controls and the project board's code each with a case; the fixed 300 ms wait replaced by a condition.
- Standards and Behaviour: the report's before and after completed, the refold time measured (0.8 s once, 7 to 8 ms warm, 11 sessions).

The run over repair round 1, closed at landing on 2026-09-25:

- Behaviour, the stamp blocking the server: `update()` of `bin/dispatch-note.mjs` takes a `once` option and `takeLock` a matching argument that throws at the first try instead of waiting; `stampEnded` uses it and answers whether it wrote; the sessions watcher holds the launches whose stamp the lock put off (`reused` in `ScanOptions`, one map across scans), reads them ended meanwhile and tries the stamp again each scan. A case holds the lock with a live pid: the scan returns in under a second, the row reads done, a scan with no start time still reads done, and the stamp is written at the first-seen moment once the lock goes; red under `bin/dispatch-note.mjs:243` and under `transcripts.ts:317`.
- Spec, the flip when a stamp cannot take the lock: closed by the same memory.
- Spec, a resumed subagent read done while it ran: a row a notice ended whose own transcript is written more than 5 s after that notice reads running again, until its next notice; a case, red under `background.ts:128`.
- Found in the landing's look, not by the review: a notice that reaches a busy session is recorded as the attachment of a queued command (`type: 'attachment'`, `attachment.commandMode: 'task-notification'`, the notice in `attachment.prompt`), which the fold did not read, so a stopped builder read done and the round's own reviewer read running after its second notice. The fold reads those attachments now, and the cache version is 4 so every transcript is folded again once; a case, red under its revert. Run over the real store (`scan()` read-only, cache in the scratchpad), the rows read right: "Refute Q69 repair round" done at 20:57:45, "Build L6 status bar" stopped.
- Proof, no case for `!record.endedAt`: "keeps a stamp another writer put in the note before this one", red under `dispatches.ts:224`. "The same scan's row carries the stamp": the stamp case's first scan asserts done with the note still unstamped behind a held lock.
- Proof, the weak poll in `system.spec.ts`: the case keeps the held request and asserts it is the one that failed and not among the finished.
- Proof, a failed stamp with no case: the held-lock case above.
- Standards, the doubled JSDoc blocks in `bin/dispatch-note.mjs`: one block each for `update`, `readNote` and `readFlags`.
- Behaviour, the server writing the note and sweeping stale lock litter: stated in the landing report and DESIGN.md's launched-builders line.
- Behaviour, the report's missing lines: carried into the landing report.
- Not a finding kept: the reviewer ran background shells, which its brief forbade; recorded in the dispatch block.
