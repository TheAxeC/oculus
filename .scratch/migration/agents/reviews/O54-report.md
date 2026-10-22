# O54 report

Saved by the orchestrator from the builder's final message (a37648dff2f33b214): the builder's Write of this file was refused by the runner ("Subagents should return findings as text, not write report files").

## OPEN ITEMS
- Not done in items 1-12: none.
- Finding against this build: the verify list ran 3 times, one more than spec.md allows. The third run came after the deck fix (judgment call 9), made outside a red line.
- Load timeouts: in the list runs (load averages 16 in run 3), the slow hub cases and some unchanged files time out. Every such file passes alone (quoted below).

## LEDGER
- Items 1-12 built: DONE. Scoped Verify 2: Test Files 18 passed (18), Tests 223 passed (223).
- C1-C8, C13-C16: DONE. Per case file alone: hub-portfolio 16/16, hub-routing 7/7, hub-undo 2/2.
- C9-C12: DONE. Probe tests/data/hubs/o54-probe.test.ts run on the base copy and the final tree, then deleted (ls tests/data/hubs no longer lists it).
- Verify 1: DONE, 3 runs (npm run diagrams; npm run format; npm run test:quick).
- Verify 3: 0 non-ASCII lines (perl scan of the changed files and the three docs).
- Verify 4: no file over 880 lines, no component over 520 (wc -l).
- Verify 5: sh utils/unused-exports.sh diffed against migration-O54-base/unused-exports.txt: exit 0, "Unused exports (229)".
- Verify 6 and 7: judged below.
- Docs: git diff --stat: HELP.md 6, apps.md 14, data-map.md 2 lines.
- Whole-suite commands: 0.

## ROUND-0 RULING (briefs/O54-cases.md)
- C3: ids a:alpha, b:alpha and c:c, the folder project shown as c. The C3 row asserts this.
- Fixture: tests/data/hubs/hubs-fixture.ts.
- Rows made false now name <hub>:<key> and are listed under ROWS CHANGED. None removed, skipped or loosened.
- Apps write only the primary's records; with no primary, every app record write is refused (docs/apps.md:389).
- C13 plants lab as the primary.
- C16 is folded into the bare-key it.each of hub-routing.test.ts: a bare key, and a hub no workspace folder carries.

## FILE TABLE (diff -rq against .agents/worktrees/migration-O54-base/, over src, tests, utils and config without local.yml)
- 195 lines: 187 M, 7 A, 1 D. utils/ has no differences.
- A fresh diff -rq run now is identical to the stored table (sort | diff: SAME).
- Saved at /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/ft-now.txt.
- A: src/lib/data/snapshot/normalise-parts/links.ts; src/lib/data/sources/config/settings/scan.ts; src/lib/server/root/watch/build.ts; src/lib/shell/keys/lists/mode-lists.svelte.ts; src/lib/state/shared/page/records.ts; src/lib/views/boards/deposit/DepositPlan.svelte; tests/fixtures/hubs/hub-build.ts.
- D: src/lib/server/root/watch/own-schemas.ts.
- M: config/text/findings.yml, config/text/server.yml, and 147 src and 38 tests files (full list in ft-now.txt).
- Outside the base copy: docs/HELP.md, docs/apps.md, docs/data-map.md and the regenerated docs/diagrams/*.

## FIRST RUN ON THE UNCHANGED TREE
- hub-portfolio: Tests 7 failed | 9 passed (16).
  - C1: "expected undefined to match object { id: 'hub:nature', root: 'hub' }"
  - C2, C4: "Cannot read properties of undefined (reading 'collaborators')"
  - C3: "expected [ 'a:alpha', ... ] to deeply equal ArrayContaining"
  - C5: "expected 'venue_id is cell, which is not a key ...' to match /cell.*lab.*team/"
  - C6: "expected [ 'applications', 'data', ...] ..."
  - C13: "expected undefined to match object { root: 'lab' }"
  - C15: "expected [ 'Shared lead', 'lab:Shared lead' ] ..."
- hub-routing: Tests 3 failed | 3 passed (6).
  - C16 bare key: "expected 200 to be 404"
  - C14: "expected [ 'alpha', 'lab:beta' ] to deeply equal [ 'hub:alpha', 'lab:beta' ]"
  - C8: "expected [ Array(1) ] to include 'lab/projects/ideas/lab-paper/project...'"
- hub-undo: Tests 1 failed | 1 passed (2).
  - C7: "hub: expected 404 to be 200"

## PER ITEM
1. One id shape.
   - hub-names.ts helpers, none taking primary where the id names the hub: rootOf :23, hubId :31, splitHubId :41, addressOfId :55, keyOf :61, bareId :66, addressOf :75, ofHub :83, holdersOf :109, resolvedId :137.
   - merge.ts (mergeHubs :264, rooted :203): every record, the primary's included, gets <hub>:<key> and root.
   - feeds.ts:21-26 gives every feed entry its root; idents.ts:29 builds the feed cursor id with hubId.
   - With no primary, folder projects are keyed by their folder (folderParts in server/root/watch/build.ts).
2. Own hub first.
   - normalise.ts:580-611 keeps a value another hub holds.
   - merge.ts resolverOf :93: own hub first, then the one other hub that holds the key.
   - Two other holders: the reference resolves to none, with one finding, findings.hubs.ambiguous (merge.ts:115, findings.yml:38), naming the key and the hubs in folder order.
   - Relation tables are built from resolved ids (normalise-parts/links.ts).
3. No joined id written or shown.
   - Written: see the writer list.
   - Shown: RootChip draws the hub chip; forms, Audit and palette show the key; the deck finding shows the key (deck/read.ts:41 bareId).
4. Helpers.
   - 40 of the brief's 44 user files changed.
   - The other 4 hold no id-shape code:
     - feed-route.ts routes by root through routedRoot.
     - CommandRows.svelte passes primary() to addTask.
     - focus.ts uses joinedEntries.
     - datasets.ts already uses bareId.
5. Routing.
   - writes/hubs.ts:78 routed: no bare-id case, no primary case.
   - routedRoot :126 refuses a feed write with no root.
   - deposit.ts:275 projectIds and :289 mirrorOf take <hub>:<key>.
   - hubOwnValues (entries.ts:274, applied :305) and hubOwnFields (manifest.ts:126, applied :395) take the hub name off every value written, for every hub.
6. YAML editor.
   - schema/lists.ts:99-104 and schema/run.ts:214-232 add the other hubs' keys to a field's lists.
   - record.ts and set.ts unchanged: they read those lists.
7. Forms.
   - forms/schema.ts recordChoices :206 and choicesFor :258: own hub first, then others with their hub. A key the own hub holds is offered once; the bare key is written.
   - MultiSelect.svelte:30 draws the chip.
8. Rename.
   - lookup.ts:141 resolvedTargets uses item 2's rule; graphOf(index) :101 takes no primary.
   - rename.ts rewrites references in every hub; yaml/hub-keys.ts:10-13 uses the same rule.
9. Audit.
   - rules.ts:277 marks each finding's hub and keeps the scope bare.
   - The signature input stays <hub>:<scope> for a hub other than the primary (:289), the base form, so existing mutes still match.
   - Audit.svelte:141 draws the chip.
10. Add.
   - entry-add.ts:55 hubChoices asks which hub when more than one names the collection.
   - openPage :41 opens the page by <hub>:<key>.
   - addTask writes to the hub taskFields names.
11. Text.
   - id_prefix and ambiguousIds are gone.
   - The apps.md:749 refusal is removed with its code (hubPrefix) and its catalog line (server.yml hub_key).
   - Rewritten: apps.md:389 and its rows for entry, audit, feed-field, feed-delete and linkedin-post; HELP.md:529-533; data-map.md:203; the head comments of hub-names, merge, feeds, references, referrers, model-entities, model/index, linkedin and Audit.
12. Tests.
   - hub-portfolio: C1-C6, C13, C15. hub-undo: C7. hub-routing: C8, C14, C16.
   - C9-C12 checked by the probe only.

Moves required by the size, folder and unused-export rules:
- scan.ts: the scan rules from data/index.ts, now 669 lines.
- build.ts (was own-schemas.ts) also holds buildHubs. This gives readHub, builtHub, readFolders and buildFolderProjects a product importer. src/lib/data was full at 10 items.
- hub-build.ts: buildOneHub, used by 14 test files.
- records.ts: recordField, recordState, stateRecord.
- mode-lists.svelte.ts: Palette.svelte goes from 540 to 513 lines.
- DepositPlan.svelte: Deposit.svelte goes from 522 to 438 lines.

## ROWS CHANGED (only the id each names changes)
- new-entry: the task id becomes research:review-it, and the stub gets root.
- theme-groups: person ids become lab:<key>; new row for the primary's people.
- held-unsaved: entry ids gain hub:; the collectionFile stub is (hub,name).
- folder-opener: hub:alpha, and the state becomes {hub,key}.
- form-draft: ids and page names gain hub:; new row for hub-and-name state.
- page-entry: ids and page names gain hub:; states become {hub,key,label}; pageNamed reads <hub>:<collection>:<key>.
- hub-portfolio: the one-hub row and both-hubs root; only-first; G32 rivera-lab, joint-work, ghost; the "lab: Postdoc" lead; lab:x as hub:lab:x; C3 c to c:c. No ambiguity findings remain.
- hub-routing: first row hub:alpha; C8 as an it.each of 2 rows; graphOf with no primary.
- reference-hub: graphOf(laid).
- manifests: ids gain hub:, and alpha.root is hub.
- workspace-projects: ids gain hub:, and the lab:kit list is re-sorted.
- compose: hub:Submission.
- entry-add: the stub gives each collection's root.
- write-fixture (deck and GOOD), undo, write, deposit, deposit-compare, app-gate, changes, hub-writes: ids gain hub:, and feed bodies gain root: 'hub'.
- keys.test: the computed-key list names scan.ts.
- 14 files: buildPortfolioWithSchemas becomes buildOneHub.
- buildHubs and withOwnSchemas are imported from build.ts.
- Full list: /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/rows.md.

## ITEM 3 WRITER LIST
- logChanges, changes.jsonl: {file, key}, bare key (changes.ts:95-102).
- entries.ts and manifest.ts: bare keys (hubOwnValues :274, hubOwnFields :126).
- feeds.ts (LinkedIn ideas): title and date, no record id.
- deck*.ts: folder names, no record id.
- apps/store.ts: app data, no record id.
- config-checks and folders: settings, no record id.
- page-state/files.ts, layouts.json and views.json: {hub,key,label} (recordState in records.ts), storedState (instance.ts:112-124), withCardCursor (:131-132).
- workspace state.ts and actions.ts: folder names.
- sessions/cache.ts: transcript paths.
- sessions/overrides.ts: area, a folder key.
- Recover: hooks.ts gives {hub,key,path} through addressOf; the recover route uses hubId(hub,key).

## CASES AFTER (each file alone)
- C1-C8, C13-C15: fail before, pass after.
- C16: the bare key gave 200 before; after, both rows give 404 and write nothing.
- C9: base finding "venue_id is science, which is not a key of venues"; after, [].
- C10: base lab:iclr...lab:tmlr, no science; after, iclr, jmlr, kdd, nature (once), neurips, tmlr, then science with hub "hub".
- C11: base {"id":"lab:lab-paper"}; after {"hub":"lab","key":"lab-paper",...}, which reopens lab:lab-paper (root lab).
- C12: base lab-paper msg_no_venue, signature 390bc5f876e1; after, that finding is gone. lab-empty has scope projects/ideas/lab-empty, hub lab, signature 7653ae880b67 on both trees.
- Final reruns alone: hub-portfolio 16/16, hub-routing 7/7, hub-undo 2/2.

## VERIFY LINES
- Three full-list runs; whole-suite runs 0.
- Run 1, exit 1:
  - keys.test failed: scan.ts missing from the computed list. Fixed.
  - Timeouts in workspace-projects, rename, hub-portfolio x2 and config-key; each passes alone.
  - Size check: Palette 540 and Deposit 522; both split.
- Run 2, exit 1: one "Failed to start forks worker" for tests/ui/html.dom.test.ts, a file the step does not change; alone 8/8.
- Run 3, exit 1:
  - "ok ASCII gate", "ok prettier: All matched files use Prettier code style!", "ok eslint", "ok svelte-check: ... 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS", "ok vitest checks".
  - "FAILED vitest: Tests 4 failed | 2430 passed | 646 skipped (3080)".
  - "FAILED vitest slow: Tests 11 failed | 635 passed | 172 skipped (818)".
  - Every error line is "Test timed out" (9 at 20000 ms, 4 at 5000 ms).
- Each failing file alone afterwards (load averages 4.78 9.03 12.81), all passed: workspace-projects 5, manifests 34, app-manage 23, app-open 44, rail 5, placeholders 3, hub-portfolio 16, hub-routing 7, hub-undo 2, html.dom 8.
- Verify 2 after the last change: "Test Files 18 passed (18)", "Tests 223 passed (223)".
- Verify 3: 0 lines.
- Verify 4:
  - portfolio.ts 879, model-entities 878, model/index 876, writes.svelte 876, apps.svelte 876.
  - Palette 513, Collection 513, ProjectCard 492, Deposit 438.
  - Folder items: src/lib/data 10, server/root/watch 10, tests/fixtures 10, shell/keys/lists 9.
- Verify 5: diff exit 0, "Unused exports (229)".
- Verify 6: 209 hits against 215 in the base.
  - Added: hub-names :32 and :56 (the helpers); rules.ts:289 (the signature input, as in the base); page-entry :73 and :309 (the page name, through the helpers); Collection.svelte:393 (an each-block key).
  - The 12 removed hits were id joins and splits, now done by the helpers.
  - The 203 unchanged hits were read: time strings, file:line, git refs, each keys, UI ids, and the opaque palette row ids at palette.ts:206 and :227. None builds or reads a record id.
- Verify 7: 11 hits, all order or position words ("before any check", "before the merge", "still renders", "before and after the write"). None is history.

## JUDGMENT CALLS
1. Entry fields keep the key their file holds; project reference fields hold the resolved id.
2. Feed writes require root and are refused with 404 without it, since item 5 leaves no hub. The client always sends root.
3. hubOwnValues and hubOwnFields get the routed hub for every hub.
4. The new modules are as listed. buildHubs sits in the server layer because the data root is full.
5. The palette hint and RootChip show no chip for the primary hub.
6. Rename is refused on a collision in any hub that holds a reference to the record.
7. The slurm resource and collectionOf read from the primary.
8. fileUnder keeps its primary argument: it places a relative path, not an id.
9. DeckProject.id is the bare key (deck/read.ts:41, documented in deck/kinds.ts), so the domain_unknown finding shows no joined id. Checked by reading only; no test row covers it.

## FINDINGS
- The Literature save with no root has the client guess the primary, while the server may pick another hub. This existed before the step and was not changed; it needs a ruling.
- The slow hub cases take about 1.6 s alone here, against 1.5 to 2.3 s on the base copy, so the step does not slow them. Their timeouts come from load.
- The brief's fixture path is wrong: the file is tests/data/hubs/hubs-fixture.ts, as the round-0 ruling says.
- schema/record.ts and schema/set.ts, named under item 6, needed no change.

Worktree: /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O54. Run outputs: /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/ (ft-now.txt, v3-quick.txt, v3-scoped.txt, after-cases.txt, o54-probe-base.txt, o54-probe-final.txt, rows.md).
