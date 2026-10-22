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
