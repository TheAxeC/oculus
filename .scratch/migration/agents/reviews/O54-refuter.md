# O54 refuter report

Unresolved: one Spec finding (S1) about how feed writes name their entry, the incomplete item-3 writer list that the ruling-238 landing change needs (S2), and one Behaviour defect (B2) that the builder deferred although it is inside item 10. Every verification command I ran is green.

## 1. Verification lines

All commands were run from /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O54 with PATH set to node v24.21.0, unless another directory is named.

- Verify 1: `npm run test:quick -- --base 18fa0365` gave EXIT 0.
  - "test:quick: 217 changed file(s), from git since 18fa0365"
  - "test:quick: 297 test file(s)"
  - "ok      ASCII gate (5.7 s)"
  - "ok      svelte-kit sync (5.7 s)"
  - "ok      prettier (5.7 s): All matched files use Prettier code style!"
  - "ok      eslint (86.4 s)"
  - "ok      svelte-check (108.4 s): 1792701211645 COMPLETED 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS"
  - "ok      vitest checks (156.5 s)", "ok      vitest (208.1 s)", "ok      vitest slow (278.8 s)"
  - "test:quick: 284.7 s; every command passed"
  - "test:quick: not covered: tests that reach no changed file within the import depth, the build, the lint of unchanged files"
  - `npm run format` was not run because it writes files (see section 4).
- Verify 2: `npx vitest run --testTimeout 0 tests/checks/tree/boundaries.test.ts tests/data/hubs tests/routes/hubs tests/data/helpers/hub-names.test.ts tests/state/boards/board/hub-facets.test.ts tests/views/shared/forms/entry-add.test.ts tests/routes/edit/write.test.ts tests/state/client/held-unsaved.test.ts tests/state/forms/page-entry.test.ts tests/state/forms/form-draft.test.ts --reporter=dot` gave "Test Files  18 passed (18)" and "Tests  223 passed (223)".
- Each case file run alone with the verbose reporter:
  - hub-portfolio.test.ts: "Tests  16 passed (16)"
  - hub-routing.test.ts: "Tests  7 passed (7)"
  - hub-undo.test.ts: "Tests  2 passed (2)"
- Verify 3: a perl scan for non-ASCII over the 208 files of `git diff 18fa0365`, the untracked code files of `git status --short`, and docs/HELP.md, docs/apps.md and docs/data-map.md printed nothing.
- Verify 4 (`wc -l` of every changed file):
  - No .ts file is over 880 lines and no .svelte file is over 520.
  - The only files over 880 lines are the generated docs/diagrams/channels.svg (1688), writes.dot (1138) and writes.svg (3835). The size rule does not apply to generated diagrams.
  - Palette.svelte 513, Deposit.svelte 438, data/index.ts 666, settings/scan.ts 133.
  - Folder items (`ls -A | wc -l`): src/lib/data 10, src/lib/server/root/watch 10, tests/fixtures 10, src/lib/shell/keys/lists 9.
- Verify 5: `sh utils/unused-exports.sh` exited 0. Its output diffed against migration-O54-base/unused-exports.txt gave "diff exit 0", and the first line is "Unused exports (229)".
- Verify 6: the grep `grep -rnE "indexOf\(':'\)|\\$\{[a-zA-Z_.?()]+\}:\\$\{" src` gives 209 hits in the worktree and 215 on the base copy, as the report says.
  - New hits: hub-names.ts addressOfId and hubId (the helpers); rules.ts `const signed = primary ? finding.scope : \`${root}:${finding.scope}\`` (the signature input); page-entry.ts `hubId(hub, \`${collection}:${key}\`)` and `rest.indexOf(':')`; Collection.svelte, an each-block key.
  - Removed hits: hooks.ts, writes.svelte.ts x2, write-files.ts x2, tones.ts, recover/+server.ts, page-entry.ts x2 and merge.ts.
  - Every remaining hit is a helper or something other than a record id.
- Verify 7: the history-word grep over the added lines of `git diff 18fa0365 -- src tests config docs/...` and over the untracked files found only order words ("before any check", "before the merge", "before and after the write", "still renders", variables named primaryBefore/labBefore). None is history.
- `ls docs/adr` printed "No such file or directory".
- Stale names: `grep -rnE "id_prefix|ambiguousIds|hubPrefix|hub_key|buildPortfolioWithSchemas|own-schemas|ownSchemas|inHubOf|joinHubs" --exclude=local.yml src tests config docs README.md utils` finds only the unrelated keys hub_key_unknown, hub_key_not_map and settings_hub_key. spec.md and guarded.md have no hits.
- C9 to C12: I read the probe outputs o54-probe-base.txt and o54-probe-final.txt in the session scratchpad, and the probe source o54-probe.test.ts.

## 2. Verdicts

### Items of "What to build"

1. **Violated, for feed entries only (S1).** Projects, registry entries and collection entries get `<hub>:<key>` in merge.ts, folder projects get `<folder>:<key>` (C3 row), and hub-names.ts has no primary branch. Feed entries carry `root` (feeds.ts) but no id. The id is made on the client by `feedCursorId` (idents.ts:29), not by feeds.ts as the item asks.
2. **Holds.**
   - normalise.ts:611 keeps the references that other hubs hold.
   - merge.ts resolverOf resolves in the own hub first, then the others, and raises `findings.hubs.ambiguous`.
   - The rows for C1, C2+C4, C5 and C13 pass, and on the base they fail by the quoted first run.
3. **Violated (S2).** The code writes `{hub,key}` (records.ts, shapes.ts:79-83, :256-261). The report's item-3 writer list leaves out the saved-state fields whose shape changed, which the ruling-238 landing change needs.
4. **Holds** (verify 6 above).
5. **Violated (S1, B1).** Feed writes still name their entry by its title plus a `root` field, not by the internal id. A missing root gets a wrong refusal.
6. **Holds.** run.ts uses joinedLists. The probe's C9 gives `[]` after and `["venue_id is science, which is not a key of venues"]` on the base.
7. **Holds.** The probe's C10 lists lab's venues, `nature` once (lab's), then `science` with `"hub":"hub"`. recordChoices puts the own hub first.
8. **Holds.** The C8 it.each rows of hub-routing pass.
9. **Holds.**
   - The scope is bare and `hub` is set (probe C12 after: scope "projects/ideas/lab-empty", hub "lab").
   - The signature input is unchanged by reading rules.ts. The signature 7653ae880b67 is the same on both trees.
   - Audit.svelte draws a RootChip.
   - The mute half of the case is proven only by reading (P2).
10. **Violated (B2).** After Add or Save to Literature with no `root`, the page opened or the optimistic entry uses an id the client guessed.
11. **Violated (T1).**
    - id_prefix and ambiguousIds are removed.
    - The apps.md:749 refusal is removed together with its code (hubPrefix) and its catalog line.
    - apps.md:389, HELP.md and data-map.md are rewritten.
    - The new head comment of links.ts is false for one hub's build.
12. **Holds.**
    - The rows are in hub-portfolio (G32) and hub-routing/hub-undo (G8), and the slow files were run alone (section 1).
    - Rows that ruling 203(b) makes false were changed, and the report names each one.
    - hub-writes "sends a LinkedIn idea that names no root to the primary hub" became a row that sends `root: 'hub'`. This follows from item 5, which removes the case where a missing root falls to the primary.

### Cases (as amended by the cases ruling)

- **C1:** met (row passes; hub-portfolio 16/16).
- **C2:** met.
- **C3:** met. The row asserts `a:alpha`, `b:alpha`, `c:c`.
- **C4:** met.
- **C5:** met.
- **C6:** met.
- **C7:** met (hub-undo 2/2).
- **C8:** met (hub-routing 7/7).
- **C9:** met (probe base and final outputs).
- **C10:** met (probe).
- **C11:** partial (P1). By reading, `stateRecord` (records.ts:27-31) turns `{hub:"lab",key:"lab-paper"}` into `lab:lab-paper`. The quoted run cannot be reproduced from the kept probe.
- **C12:** partial (P2). The finding is gone and the signature is unchanged, but no muted finding was planted.
- **C13:** met.
- **C14:** met.
- **C15:** met.
- **C16:** met. A bare key and `nowhere:alpha` both give 404 and write nothing.

## 3. Findings

### Spec

**S1. Feed entries have no internal id, and feed writes name the entry by title plus root.**

src/lib/state/client/writes.svelte.ts:457-468:
```ts
async function writeFeedField(feed, id, field, value, root: string) {
    const answer = await send({ kind: 'feed-field', feed, id, root, field, value });
```
The callers pass the title (LeadCard.svelte:110, `writeFeedField('leads', title, 'status', next, feedRoot(entry))`). The server routes by `root` (feed-route.ts:68 `routedRoot(into, field.root, app)`), not by the hub part of an id.

- What is wrong: item 1 says feeds.ts gives a feed entry its id by the merge's function. Item 5 says a write names its record by the internal id and is routed by its hub part. Feed entries (leads, Lit Watch, LinkedIn) are records under item 1. They still have no id in the payload (feeds.ts:23-25 adds only `root`), and feed writes keep the shape `{id: <title>, root}`.
- Failure scenario: an app or a view that holds a lead's id (`lab:Postdoc` from `feedCursorId`) cannot send it as the write's id. Sent as written, it is looked up as the title "lab:Postdoc" in the primary hub and refused. Two id shapes for records remain on the wire.
- Fix: either feeds.ts gives each entry `id: hubId(key, title)` and the feed writes take that id and route through `splitHubId`, or the orchestrator rules that `{title, root}` meets item 5 for feeds.

**S2. The item-3 list omits saved-state fields whose stored shape changed, so ruling 238's one-time change of ~/.oculus will miss them.**

src/lib/data/shapes/shapes.ts:79-83 and :256-261:
```ts
export const recordShape = z.object({ hub: z.string(), key: z.string().min(1) })
    .transform((held) => hubId(held.hub, held.key)).optional().catch(undefined);
...
export const recordItemsShape = z.array(z.unknown())
    .transform((items) => items.map((one) => recordShape.parse(one)).filter(...)).catch([]);
```
These shapes are used by:

- `reveal` (searchRevealShape, shapes.ts:92-95)
- board state `expanded` and `more` (boards/board/state.ts:81-82)
- collection `more` (boards/collection.ts:138)
- structure `lines` (boards/structure/graph.ts:455)
- the card `cursor` (layout/instance.ts:27)

The form-draft state is now `{kind,hub,name,edits}`, and the LaTeX job target is `{hub,key}`.

- What is wrong: the report's list ("page-state/files.ts, layouts.json and views.json: {hub,key,label} ..., storedState, withCardCursor") names only the tab `{hub,key,label}`. Ruling 238 covers "adding the hub to every record tab". Every old value of these fields (a string id, or `{id}`) parses to undefined or to [] through `.catch`, with no finding.
- Failure scenario: after landing, the orchestrator rewrites each tab's `{id,label}` as ruling 238 says. A board's expanded cards, its "more" lists, the map's lines, a pending reveal, the card cursor and an unsaved form draft in layouts.json/views.json are all silently dropped on the first load. An unsaved form draft is lost work.
- Fix: the report lists every saved field whose shape changed, with its old and new form, and the ruling-238 change covers all of them.

### Proof

**P1. The quoted C11 run cannot be reproduced from the kept probe.**

o54-probe.test.ts (scratchpad):
```ts
const instance = (await import('../../../src/lib/state/workbench/layout/instance.ts')) as { stateRecord?: ... };
const id = instance.stateRecord === undefined ? String((read as { id?: string } | null)?.id ?? '') : instance.stateRecord(read);
```
- What is wrong: `grep -rn "stateRecord" src` shows that `stateRecord` is exported from shared/page/records.ts:27 and re-exported from layout/index.ts:147, not from instance.ts. On the final tree the kept probe would take the fallback, read `.id` of `{hub,key,label}` and print "". Yet o54-probe-final.txt prints `"lab:lab-paper"`.
- Failure scenario: the C11 line in the report rests on a probe version that was not kept, so a reader cannot rerun it. Reading records.ts confirms the behaviour, so the case holds by reading.
- Fix: rerun the probe against the final tree with the export it actually uses, and quote that output.

**P2. C12's "a muted finding of lab stays muted" was not run.**

Both probe outputs say `C12 muted: []`. The probe plants no `audit_ignore` entry.

- What is wrong: the case's second half is supported only by the equal signature 7653ae880b67 and by reading rules.ts (`primary ? finding.scope : \`${root}:${finding.scope}\``). No run shows a muted lab finding staying muted.
- Failure scenario: if muting matches on anything besides the signature (the finding's new `hub` field or its now bare scope), a mute stored before the step would stop matching and nothing would show it.
- Fix: one probe line that mutes 7653ae880b67 in the hub's config and shows the finding under `muted` on both trees.

### Standards

**T1. The new head comment of links.ts is false for one hub's build.**

src/lib/data/snapshot/normalise-parts/links.ts:3-4:
```
// person's organisations, and the other side of each. A pair is written only when both ends are
// records the snapshot holds, so a reference that names nothing reaches no table and no list.
```
normalise.ts:610-626 hands `linked` a `known` set that includes `others[source]`, the keys the other hubs hold.

- Failure scenario: in one hub's build, a pair such as `[lab-project, science]` is written where `science` is a key only the primary holds, a record that snapshot does not hold. A reader who trusts the comment would treat the per-hub relations as closed.
- Fix: the comment says that a pair needs both ends known to the workspace's hubs.

**T2. The verify list ran three times, and the builder's last list run was red.**

The report says "Three full-list runs" (run 1 red, run 2 red on a forks-worker start failure in an unchanged file, run 3 red on timeouts).

- What is wrong: spec.md allows the list once, plus once more after fixing a red line in a changed file. Run 2's red line was in a file the step does not change, so run 3 went beyond the allowance, and the builder never had a green list run after its last change.
- Failure scenario: none to the code. My own run of verify 1 is green (section 1).

### Behaviour

**B1. A feed write with no `root` is refused with words that say the entry does not exist.**

src/lib/server/edit/writes/hubs.ts:126-132:
```ts
export function routedRoot(into, root, app) {
    return root === undefined ? null : hubTarget(into, root, app);
}
```
feed-route.ts:68-75 then refuses with `words(text, 'server.write_route.no_entry', field.id, field.feed)`, which is "no entry {0} in {1}" (server.yml:527). linkedin-post gets "The LinkedIn idea file is not on this hub." (server.yml:529).

- What is wrong: on the base, a missing root routed to the primary. Now it is refused, which apps.md documents, but the refusal names the wrong cause.
- Failure scenario: an app that sends `{kind:'feed-field', feed:'leads', id:'Postdoc', field:'status', value:'applied'}` with no root, which the base accepted, now gets 404 "no entry Postdoc in leads" for a lead that is on screen. Nothing tells the app that `root` is now required.
- Fix: refuse a missing `root` with 400 and a catalog sentence that says the write needs its hub.

**B2. The client guesses the hub of a record the server created, and the guess can be wrong.**

src/lib/state/client/writes.svelte.ts:418 and :502:
```ts
const id = hubId(root ?? look.primary() ?? '', answer.id);
```
and :440 and :480:
```ts
const ident = hubId(look.primary() ?? '', titleOf(fields));
```
Without a root, the server picks `homeOf` (the primary, else the first hub) or `homeNaming` (feed-route.ts:113-117: the primary when it holds Literature, else the first hub holding it, including a hub that holds only the engine's literature file).

- What is wrong: item 10 says the page Add opens names the record by its hub and key. The client derives the hub instead of receiving it. The report defers this as "existed before the step ... needs a ruling", but the step rewrote these lines, and the fix is inside item 10.
- Failure scenarios:
  - Workspace with no primary: Add Lead and Add to Lit Watch write to the first hub, while the optimistic entry is keyed by the bare title. That bare key matches no `<hub>:<key>` id, so a ghost or doubled entry shows until the next snapshot.
  - Save to Literature where no hub lists the Literature collection: SaveToLiterature.svelte:44 gets `home` undefined and sends no root. If the primary lacks the engine's literature file but hub `lab` has it, the server writes `lab`'s file, and the client opens and settles `hub:<key>`, a record that does not exist.
- Fix: the server's answer carries the record's internal id, or its hub (it knows `home.key`), and the client uses it rather than guessing.

## 4. Declined to judge

- `npm run format` (verify 1's first half) and `npm run diagrams` were not run because both write files in the worktree. Prettier's check within test:quick is green.
- I did not rerun the probe for C9 to C12. Running it needs the probe file placed under tests/data/hubs/ in the worktree, which would write a file there.
- The untracked file .scratch/migration/agents/briefs/O54-cases.md in the worktree is byte-identical to main's copy (`cmp` exit 0). It is not the builder's work product, and the landing's wip commit should leave it out. Who wrote it cannot be seen from the tree.
- The report's "scan.ts ... now 669 lines" does not match `wc -l` (scan.ts 133, data/index.ts 666). No decision rests on this.

Usage: aa1dd67ae57731a87, claude-opus-5-5, 149205 tokens, 78 tool uses, 17 min 26 s

## Repair round 1, refuted

Not closed by this round: the S2 list of saved fields in the report leaves out two places in `~/.oculus/layouts.json` that hold a record in the old shape. They are a page's `item` and the kept layouts of closed folder pages (Spec R1). Item 3 is therefore violated. A doc comment rewritten in this round is 104 columns wide (Standards R1), so item 11 is violated. Every other item and every case holds or is met. The verify list (`test:quick`) was red on my run too. Every red row was a timeout or a worker that did not start, and each passed when run alone. None of them is a defect of this step (evidence under Proof).

```
Verify 1, from the worktree root, PATH node v24.21.0:
$ npm run test:quick -- --base 18fa0365            EXIT 1
test:quick: 229 changed file(s), from git since 18fa0365
test:quick: 299 test file(s)
ok      ASCII gate (6.1 s)
ok      prettier (6.1 s): All matched files use Prettier code style!
ok      svelte-kit sync (7.8 s)
ok      eslint (190.3 s)
ok      svelte-check (246.4 s): 1792707637720 COMPLETED 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (310.8 s)
FAILED  vitest (382.8 s)
 FAIL  |unit| tests/routes/apps/app-manage.test.ts > ... > app-manage answers 403 and leaves the record alone   (Test timed out in 5000ms)
 FAIL  |unit| tests/server/edit/app-store.test.ts > ... (2 rows)                                                  (Test timed out in 5000ms)
 FAIL  |unit| tests/state/sources/clone-after.test.ts > ... (2 rows)                                              (Test timed out in 5000ms)
 FAIL  |unit| tests/data/sources/manifests/manifests.test.ts > ... > reads 'a scan of the folder above the stages<horizontal ellipsis>'  (Test timed out in 5000ms)
 Error: [vitest-pool]: Failed to start forks worker for test files .../tests/ui/html.dom.test.ts.
 Test Files  4 failed | 221 passed | 63 skipped (288)
      Tests  6 failed | 2429 passed | 656 skipped (3091)
FAILED  vitest slow (433.7 s)
 FAIL  |unit| tests/server/machine/lsp/svelte-trust.test.ts > ... > imports the Svelte config of the repository once the configuration is approved
 AssertionError: expected false to be true (svelte-trust.test.ts:84, the 20_000 ms ready wait)
 Test Files  1 failed | 76 passed (77)
test:quick: 441.9 s; failed: vitest, vitest slow
(uptime right after: load averages: 18.88 17.71 16.26)
npm run format: not run (it writes files).

Each red file rerun alone, `npx vitest run <file> --reporter=dot`:
app-manage.test.ts 23 passed (23); app-store.test.ts 15 passed (15); clone-after.test.ts 11 passed (11);
manifests.test.ts 34 passed (34); svelte-trust.test.ts 2 passed (2); tests/state/sessions/source/source.test.ts 27 passed (27)
manifests row timed alone: base copy 287ms, worktree 72ms.

Verify 2 plus G28's files and this round's test files:
$ npx vitest run --testTimeout 0 tests/checks/tree/boundaries.test.ts tests/data/hubs tests/routes/hubs tests/data/helpers/hub-names.test.ts tests/state/boards/board/hub-facets.test.ts tests/views/shared/forms/entry-add.test.ts tests/routes/edit/write.test.ts tests/state/client/held-unsaved.test.ts tests/state/forms/page-entry.test.ts tests/state/forms/form-draft.test.ts tests/state/sessions/source/source.test.ts tests/state/client/created-ids.test.ts tests/state/forms/entry-save.test.ts tests/server/edit/feeds.test.ts tests/server/core/changes.test.ts tests/routes/edit/undo/undo.test.ts --reporter=dot
 Test Files  24 passed (24)
      Tests  361 passed (361)

Case files alone, verbose:
hub-routing.test.ts  Tests 7 passed (7)  (C16 rows: 'refuses a bare key, with 400 and the sentence that the write needs its hub, and writes nothing (C16)', 'refuses a hub no workspace folder carries, with 404 and the sentence naming the hub, and writes nothing (C16)'; C8 x2, C14)
hub-undo.test.ts     Tests 2 passed (2)  (C7)
hub-portfolio.test.ts, first run alone: Tests 3 failed | 13 passed (16); the three were the first G32 rows, 6476ms, 6526ms, 7440ms
hub-portfolio.test.ts, next three runs alone: Tests 16 passed (16) each
hub-portfolio.test.ts on the base copy migration-O54-base, alone: Tests 3 failed | 6 passed (9), the first three rows 8742ms, 8394ms, 6884ms

Rows of the round, before and after (the builder's o54-r1-before copy; its 149 snapshot src/config files equal the round snapshot byte for byte; the 7 files outside files.txt equal `git show 18fa0365:`; the 10 test files equal the worktree's):
$ npx vitest run --testTimeout 0 <the 10 files the report names> --reporter=dot
 before: Test Files  10 failed (10)   Tests  41 failed | 148 passed (189)
 after:  Test Files  10 passed (10)   Tests  189 passed (189)

Verify 3: the spec.md ASCII perl gate over the 228 existing paths of `git status --short`: printed nothing (perl exit 0). The report file: no line outside the set.
Verify 4: no changed .ts over 880, no .svelte over 520. writes.ts 808, writes/hubs.ts 276, hub-writes.test.ts 770, writes.svelte.ts 874, feed-route.ts 187, Palette.svelte 513. (The report gives 272 and 733 for the second and third; no decision rests on them.)
Verify 5: sh utils/unused-exports.sh exit 0; diff against migration-O54-base/unused-exports.txt: exit 0; "Unused exports (229)".
Verify 6: 209 hits in the worktree, 215 on the base copy; in the files this round changed the hits equal the snapshot's (page-entry.ts x3, edit/feeds/feeds.ts `line.indexOf(':')`, which is also at the base's line 166).
Verify 7 over this round's added lines: "before the feed is asked whether it is unique" (idents.ts, an order of steps), variables named `before`, feed-route.ts "before the writes after them" (unchanged line). No history.

Commands the report quotes, rerun:
C9 to C12 probe (the builder's o54-probe.test.ts, run in its o54-final-run copy, whose src and config equal the worktree's, diff -rq exit 0, and in o54-base-run, whose src equals migration-O54-base):
final: C9 findings on lab-paper: []
final: C10 venue choices for a lab project: [iclr, jmlr, kdd, nature ("Nature of lab"), neurips, tmlr, {"id":"science","label":"Science of hub","hub":"hub"}]
final: C11 layouts.json tab state: {"root":{"kind":"pane","tabs":[{"id":"t1","view":"project","state":{"hub":"lab","key":"lab-paper","label":"Project lab-paper"}}],"active":"t1"}}
final: C11 stateRecord from: "records.ts" / C11 record the tab opens after the reload: "lab:lab-paper" / held true
final: C12 muted, the workspace file parking 7653ae880b67: ["7653ae880b67"]
final: C12 parked (muted) findings: ["lab | projects/ideas/lab-empty | venue_id | 7653ae880b67"]; lab-empty among the open findings: 0
base:  C9 findings on lab-paper: ["venue_id is science, which is not a key of venues"]
base:  C12 parked (muted) findings: ["undefined | lab:projects/ideas/lab-empty | venue_id | 7653ae880b67"]; lab-empty among the open findings: 0
```

### Verdicts

Items of the brief's "What to build", for the whole diff since 18fa0365:

- 1: holds. `hubs/feeds.ts` `rooted` gives each feed entry `root` and `id: hubId(hub, key)` by `FEED_IDENTITY`, so S1 is closed. The C15 row reads `['hub:Shared lead', 'lab:Shared lead']`. The rest is as the first review found.
- 2: holds. Rows C1, C2+C4, C5 and C13 pass (hub-portfolio 16/16 on three runs alone).
- 3: violated, Spec R1. The code writes `{hub, key}` in every saved field I read. The report's item-3 list (the S2 list) leaves out a page's `item` and the kept folder layouts in layouts.json.
- 4: holds. The verify 6 hits are unchanged in the round's files.
- 5: holds. `feed-field`, `feed-delete` and `linkedin-post` route by `routed` (`splitHubId`) after `routeRefusal`. `bodies.ts` has no `root` on them. A bare id gets 400 with `server.write_route.no_hub_part` (C16 row and hub-writes rows), so B1 is closed. C14 passes.
- 6: holds. The probe shows C9 `[]` after the round and the `no key` finding on the base.
- 7: holds. The probe's C10 lists lab's venues, `nature` once (lab's), then `science` with `"hub":"hub"`.
- 8: holds. Both C8 rows pass.
- 9: holds. The probe's C12 shows the signature 7653ae880b67 parked on both trees, the scope bare and `hub: lab` after the round. P2 is closed.
- 10: holds. `entry-add.ts` `leadAsk` and `paperAsk` open `answer.id`. `withHubId` answers each create with its internal id (rows of 'a write that makes a record'), so B2 is closed at the four places its ruling names.
- 11: violated, Standards R1. The `links.ts:1-6` head comment is now true, so T1 is closed. The `waiting.ts` doc comment rewritten for item 1 has a 104-column line.
- 12: holds. The C rows are in hub-portfolio (G32) and hub-routing/hub-undo (G8), and the slow files were run alone (above). The new file `created-ids.test.ts` is Standards R2.

Cases, as amended by the cases ruling:

- C1: met (hub-portfolio row passes).
- C2: met.
- C3: met (row asserts `a:alpha`, `b:alpha`, `c:c`).
- C4: met.
- C5: met.
- C6: met.
- C7: met (hub-undo 2/2).
- C8: met (both rows pass).
- C9: met (probe rerun, both trees).
- C10: met (probe rerun).
- C11: met. The probe rerun on the final tree imports `stateRecord` from records.ts and gives `{"hub":"lab","key":"lab-paper","label":...}` in layouts.json and `lab:lab-paper` after the reload, so P1 is closed.
- C12: met, both halves (probe rerun).
- C13: met.
- C14: met.
- C15: met.
- C16: met. A bare key gets 400 with `no_hub_part` and `nowhere:alpha` gets 404 with `no_hub_named`. Both rows assert that nothing is written and that the change log is empty.

### 1. Spec

- **R1.** Report section "S2, every saved field whose shape changed" (items 1 to 15). The code that writes the missing field is `src/lib/views/shared/card/card.ts:131-133`:

  ```ts
  const first = { view: 'project', state: recordState(item.id, tab) };
  client.folders.open({ root, path }, { label: item.project.title, item: first });
  ```

  The field is kept on the page as `item?: FolderItem` (`state/workbench/layout/model.ts:138`) and read back by `itemOf` (`saved/kept.ts:49-52`, called at `saved.ts:546`). `folder-opener.ts:73-75` reads it on Reset layout with `stateRecord(item.state)`. Kept layouts of closed folder pages are `KeptWorkbench { folder, workbench, states }` (`model.ts:197-201`), stored in layouts.json, whose `states` hold the ui-store view states by instance id.
  - What is wrong: the list gives a page's tabs (1 to 8) and the view states in views.json (9 to 14). It leaves out two places in layouts.json that hold a record in the old shape:
    - (a) each folder page's `item`, which changes from `{ view: 'project', state: { id, label } }` to `{ view: 'project', state: { hub, key, label } }`;
    - (b) each `kept[]` entry, both the tab states in its `workbench` and the view states in its `states` map. The list places the view states under views.json only.
  - The round's ruling 4 says "the list is the whole of it".
  - Failure scenario (a): at landing the orchestrator rewrites tabs and view states from the list, and a workbench page Axel opened from a project card keeps `item.state = { id: 'eeg-saad-challenge', label }`. On Reset layout, `projectIdOf` gives `''`. The arrangement then drops the Deposit tab, and `openView('project', { id, label })` opens a project tab that names no record.
  - Failure scenario (b): reopening a folder page Axel closed before landing restores its board `expanded` and `more` lists and its card cursor from `kept[].states`. Those lists hold old string ids, which `recordItemsShape` and `recordShape` read as `[]` and undefined, so they are lost silently. Its project tab opens as not found when only `pages[].workbench` is rewritten.
  - Verdict: item 3 violated, and ruling 4 (S2) is not closed.
  - Disposition: small and inside the brief, so the list can be completed at landing, before the ruling-238 change.
- **R2.** `src/lib/server/edit/writes.ts:553-554`:

  ```ts
  const home = homeOf(into, app);
  if (home === null) return noHub(into, app);
  ```

  This is in the `host` branch, with `homeOf` at `writes/hubs.ts:173-177` (`if (own !== null || app !== null) return own;`).
  - What is wrong: cases ruling 4 refuses an app's *record* writes when there is no primary. The round extended that refusal to `host`, a career-file write, which is no record, and no item or ruling asks for this. Base `writes.ts:535` (`homeOf(into)`) wrote it to the first hub. The creates (`new-entry`, `lead-add`, `radar-add`, `linkedin-idea`, `new-idea`) do fall under ruling 4's "every app record write is refused", so for them the change is inside the cases ruling (point 4).
  - Failure scenario: an app holding `writes: [host]` in a workspace with no primary got 200 on the base, with the host written to the first hub's career file. It now gets 409 "The workspace has no primary hub, so there is nowhere to keep this; ...".
  - Verdict: none. Whether the career file follows the record rule is the orchestrator's call. `docs/apps.md:427` already states it.

### 2. Proof

- No finding on point 1, the three red rows of the builder's last run. Evidence that the `source.test.ts` row is not a defect of this step:
  - The row 'takes the new text into a clean tab, with its edits, and keeps no unsaved mark' builds the store with `createSource` over `tests/state/sessions/source/source-server.ts`.
  - `git diff 18fa0365 --stat` is empty for these files: `source.svelte.ts`, `disk.svelte.ts`, `draft.ts`, `data/helpers/files/address.ts`, `save-text.ts`, `text-edits.ts`, `editor/editor.ts`, `shared/words/text.ts` and `tests/state/sessions/source/`.
  - The two changed modules it imports change only in parts it does not use. `shared/stores/shapes.ts` changes only the `WritesStore` method types. `diskRelation` in hub-names.ts and `readAs` in shapes.ts are untouched by the diff.
  - The helper's `settled()` (source-server.ts:198-207) waits one `setTimeout(0)` turn after the open requests. That is a wait on time rather than a signal, and it already existed. My judgment is that load can make it miss.
  - The row passed in my list run, alone (27/27) and in the scoped run.
  - `app-manage.test.ts` timed out in my list run as well and passed alone (23/23).
  - The hub-portfolio G32 rows passed in my list run (vitest slow). Run alone with the default 5000 ms limit, the first three rows failed once at 6.5 to 7.4 s, then passed three times. The same three rows fail at 6.9 to 8.7 s on the unchanged base copy.
  - My list run also timed out `manifests.test.ts`, a file this step changed. Alone, its row takes 72 ms here and 287 ms on the base.
- No finding on point 5. The P2 mute in the workspace file is right. `audit_ignore` is a workspace-file option (`config/options/behavior.yml:19`), not a key of `HUB_LIST` (`hub-names.ts:365`), and the Audit view's mute writes it into the open workspace file's `settings:` (`writes/config/lists/audit-mute.ts:1-3`). The ruling's "hub's config" was the wrong place, and the builder said why. The probe rerun on both trees shows the muted finding parked.
- The report says, under "Open items", that a fix of the `write-files.ts:146` guard "needs the page to know the server's hub order". For leads and Lit Watch this does not hold: the page already has that order. `mergedFeeds` builds `hubFiles` "in the workspace's folder order" (`hubs/feeds.ts:1-3`, `Object.fromEntries(hubs.map(...))`), and `homeOf`'s fallback is `into.hubs.at(0)`. The decision that rests on this claim is whether that guard can be fixed in this step (see Behaviour R3). For `literature-save`, `homeNaming` also depends on whether a hub's engine-path file exists, which the page does not read.

### 3. Standards

- **R1.** `src/lib/state/boards/waiting.ts:11-12`:

  ```
   * else its title, else its key, and a value that resolves against neither as its key, which
   * validate reports as a finding. The names are handed in rather than read from the snapshot here, since
  ```

  - What is wrong: line 12 is 104 columns. This round moved the snapshot's 101-column line onto the next line instead of rewrapping the paragraph. spec.md, "What every package obeys": "A comment edited by the step is rewrapped as a whole paragraph at 100 columns". The report says "Comments over 100 columns that the step added: none left", which is false.
  - Failure scenario: a reader gets a comment that is wrapped wrongly, and the claim in the report about it is false.
  - Verdict: item 11 violated. Small, fixable at landing.
- **R2.** `tests/state/client/created-ids.test.ts` (new, untracked, 104 lines). `grep -n "created-ids" .scratch/migration/agents/guarded.md` prints nothing, and the report names no entry for this file or for the new rows of hub-writes and entry-add.
  - What is wrong: spec.md's test rule says "A test exists only as the test of one entry of `agents/guarded.md`, and `agents/guarded.md` names it there by file and title".
  - Failure scenario: at landing nobody knows which entry the four rows guard, so they are either kept with no entry or deleted.
  - Verdict: none. The orchestrator names them under G8 ("the hub an Add or a save writes to") at landing, or drops the file.
- **R3.** The report's "Verify lines" section says "The verify list ... ran 3 times". Runs 1 and 2 came before a later change (the `shapes.ts:77` comment), which forced run 3.
  - What is wrong: spec.md, "Token discipline", allows the list once after the last change, plus one more run after fixing a red line in a changed file. A run beyond that is a finding. The round's ruling 8 says "runs once".
  - Failure scenario: none to the code. It costs about 8 to 9 minutes of machine time per extra run.
  - Verdict: none.

### 4. Behaviour

- **R1 (point 4).** `src/lib/server/edit/writes/hubs.ts:173-191` (`homeOf(into, app)`, `noHub(into, app)` answering `server.workspace.no_primary` with 409), used by `writes.ts:553`, `:565`, `:578-584`, `:691` and `feed-route.ts:116`, `:125`, `:135-143`, `:166`.
  - What is wrong: an app's create in a workspace with no primary (`new-entry` with no root, `lead-add`, `radar-add`, `linkedin-idea`, `new-idea`) and an app's `host` write were written to the first hub on the base (`homeOf(into)`, base `writes.ts:535/547/560/669` and `feed-route.ts:95/104/144`). They now answer 409 `no_primary`.
  - The report states only the after, for creates ("With no primary, an app's create is refused 409 `no_primary`"). It gives no before and does not mention `host`. `docs/apps.md:427` states the after for both.
  - The creates are inside cases ruling 4. `host` is Spec R2.
  - Failure scenario: an app builder whose app made leads in a workspace with no primary reads the report and is not told that the app's writes now fail where they used to succeed.
  - Verdict: none.
- **R2.** `src/lib/server/edit/writes/hubs.ts:67-80`:

  ```ts
  const { hub, key } = addressOfId(id);
  if (hub === '') { ... 400 }
  if (!keys.includes(hub)) { ... 404 no_hub_named }
  ```

  - What is wrong: ruling B1 refuses "a bare key, a bare title" with 400. A bare title that holds a colon reads as a hub part and gets 404 with a sentence naming a hub that does not exist. Example: a lead titled `Re: meeting` sent as `{kind:'feed-field', feed:'leads', id:'Re: meeting', ...}` gets "The workspace has no hub named Re".
  - Nothing is written, and the page always sends internal ids, so only an app or a stale page meets this.
  - Failure scenario: such an app is told a hub is missing instead of being told that the write needs the record's hub.
  - Verdict: none. C16 is met.
- **R3 (point 2).** `src/lib/state/sessions/source/write-files.ts:145-146`:

  ```ts
  // The hub a write that adds a record names, the primary's when it names none.
  const home = (root: unknown): string => text(root) || (look.primary() ?? '');
  ```

  together with `:176-179`, `viewSourceFile('leads'|'radar', merged, look.primary())`.
  - Outside ruling B2 and the brief, by their text. B2 names the page opened and the entry settled at four places in `writes.svelte.ts`. Items 3 to 5 cover ids and routing. This guard runs before the write is sent and reads no id. The base had the same prediction (base `writtenFile` `new-entry`/`literature-save`/`lead-add`/`radar-add`).
  - Cost, case 1: in a workspace with no primary, a create that names no hub (Add Lead, Add to Lit Watch, a `new-entry` with no `root`, a Save to Literature with no `root`) is not checked against a source tab holding unsaved text of the first hub's file, which the server writes (`homeOf`). G28's "refused before it is sent" does not hold there.
  - Cost, case 2: with a primary that does not hold Literature, a Save to Literature with no `root` checks the primary's configured path while the server writes another hub's file (`homeNaming`).
  - No text is lost. The dirty tab keeps its text and is marked changed, and its later save is refused as a conflict (source.test.ts rows 'keeps the typed text of a dirty tab and marks it changed' and 'refuses the save of a changed file on the base the tab read').
  - Verdict: none for this step. Disposition: the orchestrator raises or books it as a G28 gap. See the Proof note on hub order.
- No finding on point 3. `/api/deposit` (`deposit-routes.ts:240`, `if (!(options.idsFor ?? knownIds)().includes(id)) return noProject(text);`) is outside ruling B1 by its text. B1 sets a sentence under `server.write_route` and the C16 row of hub-routing. The deposit route has its own catalog group (`server.deposit.portfolio_no_project`, server.yml:237), writes nothing for a bare id (C16's "nothing is written" holds), and the page sends it `stateRecord(instance.state)`, an internal id (`Deposit.svelte:72`).

### Declined to judge

- `npm run format` (verify 1) and `npm run diagrams`: not run, because both write files in the worktree. Prettier's check inside `test:quick` is green.
- What Axel's own `~/.oculus/layouts.json` holds under `pages[].item` and `kept[]`: not opened, by the brief's rule. Spec R1 rests on the code that writes and reads those fields.
- Whether the step's changes are complete for the untracked ledger copies `.scratch/migration/agents/briefs/O54-cases.md` and `O54-round1.md` in the worktree: both equal main's copies (`cmp`). They are not the builder's work and should stay out of the landing's wip commit. Who placed them there would take a git command other than the three allowed.
- The look at landing (the Leads, Lit Watch and LinkedIn cards' writes, the page Add opens, the Audit chip): no page was run.

Usage: a16b86dd29919143f, claude-opus-5-5, 347113 tokens, 113 tool uses, 33 min 36 s
