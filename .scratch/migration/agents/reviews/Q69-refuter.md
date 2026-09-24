# Step Q69 refuter report (on .agents/worktrees/Q69, base 695861af)

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
   git show 695861af:.../vite.config.ts                         -> componentBeforeStyle() at :15; style-first.ts on the base (item 9 already on the tree: reproduced)
   git show 695861af:.../Help.svelte | grep '<Pane'             -> 52:<Pane title={t('views.help')}> (premise 5 wrong: reproduced)
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
