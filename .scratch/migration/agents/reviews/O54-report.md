# O54 report, repair round 1

## Open items and what is not done

- The last run of the verify list (the third, see "Verify lines") ended red on three rows: two timed out (`app-manage.test.ts` at 5000 ms, `hub-portfolio.test.ts` G32 lead row at 20000 ms) and one, `source.test.ts` 'takes the new text into a clean tab, ...', failed an assertion on a file's hash. Each passed when rerun alone right after. The machine's load average was 16 to 20 during every run (`uptime`), with other agents' test runs beside it. None of the three files is one this round changed. Not settled: whether the `source.test.ts` row is a timing flake or a defect; the evidence is only that it passed alone (50 of 50 with `app-manage.test.ts`).
- Ruling 3 handed back in part, with the reason: `src/lib/state/sessions/source/write-files.ts:146` still names the file a create with no `root` will change by the primary (`look.primary()`), for the unsaved-text guard of G28. That guard runs before the write is sent, so the answer's id cannot inform it. It agrees with the server's `homeOf` whenever the workspace has a primary; with no primary it names no file, so such a create is not checked against an unsaved tab. It is not one of the four places ruling 3 names and it was the same before the step. A fix needs the page to know the server's hub order; it is not built.
- Ruling 2 handed back in part, with the reason: `/api/deposit` (`src/lib/server/git/deposit/deposit-routes.ts:240`) refuses a bare project id with 404 `server.deposit.portfolio_no_project`, not 400. It is not the write route and its sentences are its own; it writes nothing for a bare id. Not changed.
- Ruling 6: the mute list cannot be planted in the hub's `.oculus/config.yml`. `audit_ignore` is a workspace-file setting (`config/options/behavior.yml:19`); the hub layer replaces only the keys of `HUB_LIST` (`src/lib/data/sources/config/merge/merge.ts` head comment). The probe parks the signature in a saved workspace file inside the scratch hub (`<hub>/.oculus/workspaces/main.yml`, `settings: audit_ignore:`), which is where the Audit view's mute writes it (`src/lib/server/edit/writes/config/lists/audit-mute.ts:1-3`).

## Rulings

| Ruling | State | Check |
|---|---|---|
| 1 S1 feed ids | DONE | rows below, before red, after green |
| 2 B1 bare id 400 | DONE (deposit route handed back above) | C16 rows below |
| 3 B2 create ids | DONE (write-files guard handed back above) | created-ids and entry-add rows |
| 4 S2 saved fields | DONE | list below |
| 5 P1 | DONE | probe output below |
| 6 P2 | DONE (mute in the workspace file, reason above) | probe output below |
| 7 T1 | DONE | `links.ts:3-6` |
| 8 T2 | DONE | verify list ran 3 times |

### Ruling 1

- `src/lib/data/snapshot/hubs/feeds.ts:23` `FEED_IDENTITY` (`radar` and `leads` by `title`, `linkedin` by `file`); `:33-35` `rooted` gives each merged entry `root` and `id: hubId(hub, key)`.
- Server: `FEED_RULES` takes its identities from `FEED_IDENTITY` (`server/edit/feeds/feeds.ts`). `feed-field`, `feed-delete` and `linkedin-post` (`server/edit/feeds/feed-route.ts:75`, `:101`, `:177`) name the entry by `id` only: `routeRefusal`, then `routed` (`writes/hubs.ts:111`, `splitHubId`, the function every record write uses). `bodies.ts`: `FeedFieldWrite` and `FeedDeleteWrite` have no `root`; `LinkedinPostWrite` is `{ kind, id }`.
- Client: `idents.ts` drops `feedCursorId`; `feedEntryId` reads `entry.id`, and `feedIdentity` returns it. `writeFeedField(feed, id, field, value)`, `deleteFeedEntry(feed, id)`, `markPosted(id)` send no `root` (`client/writes.svelte.ts`, `stores/shapes.ts`); `entry-save.ts`, `page-entry.ts` (`writeId: feedEntryId(entry)`, `Settle.feed` by id), `page-file.ts`, `LeadCard.svelte`, `RadarCard.svelte`, `lead-apply.ts`, `PostCard.svelte` (`markPosted(entry.id)`), `linkedin.ts` (`id` on `LinkedinEntry`), `Linkedin.svelte` (opens the new idea's file in the hub its answer id names), `write-files.ts` (feed file by the id's hub).
- The grep of ruling 1 on the tree before this round lists 18 files; 14 changed. The 4 unchanged ones only name the kinds: `writes/apps/gate.ts:79-84` (kind to body shape, the shapes changed in `bodies.ts`), `data/helpers/files/apps/apps.ts:141-191` (kind names), `state/system/apps/words.ts:44-59` (labels), `writes/undo.ts:274-554` (undo by the record's `file` and `key`). The undo record of a feed write is `{ file, key }`, the absolute file and the title inside it, as every record write's change record holds the key inside its hub's file (`changes.test.ts:161` asserts `key: 'Review the draft'` for a write by `hub:Review the draft`); undo finds the hub by the file (`holding`). Undo rows pass (below).
- `docs/apps.md:420-429`: the three rows without `root`, the ids note, the two refusals, the create answer.

### Ruling 2

- `config/text/server.yml:529` `no_hub_part: '{0} names no hub: a write names a record by its hub and its key'`; `{0}` is the key, never a joined id.
- `writes/hubs.ts:67` `routeRefusal`: empty hub part, 400 `no_hub_part`; a hub no folder carries, 404 `server.workspace.no_hub_named`. Called for `manifest`, `entry`, `subtask`, `subtask-add`, `followup`, `followup-add`, `reorder` (every id of `order`), `delete-entry` (`writes.ts:425`-`643`) and the three feed writes.
- `docs/apps.md:742-747` lists both sentences.

### Ruling 3

- The server answers each create with the internal id of the record it made: `withHubId` (`writes/hubs.ts:87`) at `new-entry` (`writes.ts:612`), `new-idea` (`:694`), an entry rename (`:473`), `lead-add`, `radar-add`, `literature-save`, `linkedin-idea` (`feed-route.ts:121-172`). `addLead`, `addRadarEntry` and `createIdea` return the key they wrote.
- The client settles under `answer.id` only (`client/writes.svelte.ts:418`, `:435`, `:476`, `:497`), and draws nothing before the answer; `look.primary()` appears at none of them.
- The page opened after an Add: `views/shared/forms/entry/entry-add.ts` `leadAsk` and `paperAsk` opened `hubId(primary, title)`; they now open `answer.id`, and nothing when the answer has none. `feedId` is removed.
- With no primary, an app's create is refused 409 `no_primary`; the page's create goes to the first hub (`homeOf`, `noHub` at `writes/hubs.ts:173-191`).

### Ruling 7

`src/lib/data/snapshot/normalise-parts/links.ts:3-6`: a pair is written only when both ends are records known to the workspace's hubs, one hub's own records and the keys the other hubs hold, which `normalise.ts` hands in as `known`.

## Rows of rulings 1 to 3, before and after

Command, same 10 files on both trees: `npx vitest run --testTimeout 0 <files> --reporter=verbose`, run in `o54-r1-before` (a copy of the tree as it stood before this round, with this round's test files copied in) and in the worktree. Before: `Test Files 10 failed (10) | Tests 41 failed | 148 passed (189)`. After: `Test Files 10 passed (10) | Tests 189 passed (189)`.

The 41 rows red before, each green after, with the first error line before:

- `hub-portfolio.test.ts` C15, lead of two hubs, by `lab:Shared lead` (was `id: 'Shared lead', root`): `lab: expected 404 to be 200`.
- `hub-routing.test.ts` 'refuses a bare key, with 400 and the sentence that the write needs its hub, and writes nothing (C16)': `expected 404 to be 400`.
- `hub-routing.test.ts` 'refuses a hub no workspace folder carries, with 404 and the sentence naming the hub, and writes nothing (C16)': `expected { error } to deeply equal { error }`.
- `hub-routing.test.ts` 'names every hub by its prefix when the workspace has no primary, and refuses a bare id' (was '... and a bare id is not found', 404): `expected 404 to be 400`.
- `hub-writes.test.ts` the six ROWS 'a Lit Watch field', 'a lead field', 'a lead field the file schema names beyond its status', 'a Lit Watch deletion', 'a lead deletion' (ids `lab:Paper`, `lab:Lead`, no `root`): `expected 404 to be 200`; 'a LinkedIn idea posted' (`{ kind, id: 'lab:xx-route-idea.md' }`, was `{ kind, file, root }`): `expected 400 to be 200`.
- `hub-writes.test.ts` 'refuses a record of a hub no workspace folder carries, with the sentence naming the hub, and writes nothing' (was the `no_project` sentence with `nolab:alpha`): `expected { error } to deeply equal { error }`.
- `hub-writes.test.ts` 'sends the status of a primary-hub lead titled like a lab id to the primary hub (G8)' (`hub:${title}`): `expected 404 to be 200`; 'answers a LinkedIn idea that no hub holds as missing' (`lab:xx-nowhere.md`): `expected 400 to be 404`; 'sends a LinkedIn idea of the primary hub, which lab also holds, to the primary hub' (`hub:xx-route-idea.md`): `expected 400 to be 200`.
- `hub-writes.test.ts` new, 'refuses %s whose id names no hub with 400 and the route sentence, and writes nothing', four rows: a lead field, a lead field that carries a root beside a bare id (`expected 200 to be 400`), a lead deletion, a LinkedIn idea posted (`text key not in config: server.write_route.no_hub_part`).
- `hub-writes.test.ts` new, 'answers %s with its internal id, the hub it wrote and its key': a lead (`expected undefined to be 'hub:A new lead'`), an entry of the primary (`expected 'A third task' to be 'hub:A third task'`), an entry of the hub its root names (`'lab:A third task'`), a LinkedIn idea (`'hub:xx-a-new-idea.md'`).
- `hub-writes.test.ts` new, 'answers a lead made in a workspace with no primary with the id of the first hub, which it wrote': `expected undefined to be 'one:A new lead'`.
- `hub-writes.test.ts` new, 'makes no record for an app in a workspace with no primary, and writes nothing': `expected 200 to be 409`.
- `changes.test.ts` 'records a career host, a session override and a feed field' (`hub:Paper`, no `root`): `expected 404 to be 200`.
- `feeds.test.ts` 'adds a lead in schema order with date and status defaults' (the outcome now holds `id: 'New role'`): `expected {...(3)} to deeply equal {...(4)}`.
- `created-ids.test.ts` new, four rows (new entry, lead, Lit Watch paper, Literature save shown under the answer's id): e.g. `expected 'hub:lab:review-it' to be 'lab:review-it'`, `[ 'leads', 'hub:Postdoc' ]` for `lab:Postdoc`.
- `entry-save.test.ts` 'posts a feed entry one field at a time by its internal id ...' and 'deletes a feed entry with feed-delete by its internal id': the stubs now record every argument, so a `root` sent beside the id shows; before: the calls carry the extra `'second'`.
- `page-entry.test.ts` 'finds a feed entry by its internal id and writes it by that id' (fixture entries carry `root` and `id` as the merge gives them; rows `hub:Postdoc A`, `hub:A paper`, `hub:Postdoc B`): `writeId` `''` vs `'hub:Postdoc A'`.
- `undo.test.ts` five rows (a collection entry field and a feed field; a deleted Lit Watch entry; a lead deleted; a lead deleted over a hand change; an added lead out and a deleted one back), feed ids `hub:Paper`, `hub:Lead`, `hub:First lead` (were `root: 'hub'` with a bare id): `expected 404 to be 200`.
- `entry-add.test.ts` new, 'opens %s under the id the server answers, not under the primary' (lead, Lit Watch paper) and 'opens no page for a lead the server answers with no id': before, the page of `main:A lead` opened.

Rows of rulings 1 to 3 that pass on both trees, since they assert no hub: `entry-save.test.ts` 'is not ok when a write of a feed field is refused as a whole' and 'answers with the fields written before a write refused as a whole ...'; `created-ids.test.ts` 'shows nothing for a create the server refuses or answers with no id'.

## S2, every saved field whose shape changed

Found by `grep -rn "recordShape\|recordItemsShape\|searchRevealShape\|recordState\|recordField\|stateRecord\|storedState\|withCardCursor" src`, the diff of every `openView`/`openBeside`/`restateInstance` call against the base, and the diff of each shape. A record is written `{ hub, key }` by `recordField` (`state/shared/page/records.ts:15`); the old form held the id, bare for a primary-hub record and `<hub>:<key>` for another hub's.

`~/.oculus/layouts.json`, a tab's `state`:

1. Project tab: `{ id, label }` to `{ hub, key, label }`.
2. Person tab: `{ key, label }` (the person id) to `{ hub, key, label }`.
3. Entry tab: `{ id: '<collection>:<entry id>', collection, key: <entry id>, label }` to `{ collection, hub, key, label }`.
4. Editor tab: `{ id }` to `{ hub, key }`.
5. Deposit tab (card button and the folder page's start state): `{ id }` to `{ hub, key }`.
6. Recover tab: `{ id: <dataset key>, hub, label }` to `{ hub, key, label }`.
7. `reveal` given to a collection or feed tab (`revealState`, Focus band, command centre): `'<id>'` to `{ hub, key }`, `expiredOpen`/`dismissedOpen` unchanged.
8. Card `cursor` of every card view (`withCardCursor`, `layout/instance.ts:27` and `:131`): `'<card id>'` to `{ hub, key }`; a card that is no record's has `hub: ''`. For feed cards the key is the title (leads: the card slug), as before; for a lead of another hub the old id was the title alone.

`~/.oculus/views.json`, a view's state by instance id:

9. Projects board: `expanded`, `more`: lists of ids to lists of `{ hub, key }`.
10. Collection: `more`: list of entry ids to list of `{ hub, key }`.
11. Map: `lines`: list of ids to list of `{ hub, key }`.
12. `reveal` (`searchRevealShape`) of Inbox, Leads, LinkedIn, Lit Watch, Data, Venues, Domains, Pillars, Collection and Projects: `'<id>'` to `{ hub, key }`.
13. Project view: `{ id, doc }` to `{ hub, key, doc }`.
14. Form draft, `draft` key: `{ kind, name, edits }` to `{ kind, hub, name, edits }`; `name` was the project id or the page name `<collection>:<entry id>`, and is now the project key or `<collection>:<key>` inside `hub`.

Not under `~/.oculus`: 15. LaTeX job target: `{ id }` to `{ hub, key }` (`LatexJobTarget`), held in the tmux user option `@oculus_task` of a running LaTeX session (`server/machine/pty/sessions.ts:250-262`), so it lives as long as that tmux session; a job started before landing reads its target as none (`.catch(undefined)`).

Unchanged, checked: `changes.jsonl` (the key inside the hub's file, `changes.ts` and `undo.ts` identical to the base), and the modules of `approvals.json`, `schedule.json`, `triage.json`, `deletes.json`, `entries.json`, `choices.json`, `sessions.json`, `settings.json`, `apps.json`, `workspace.json`, `debug.json`, `layout-writes.json` (`diff -q` against the base: same).

No code reads an older form: `recordShape` (`data/shapes/shapes.ts:79-83`) parses `{ hub, key }` only and a string reads as none; `recordItemsShape` drops any other item; `stateRecord` reads `hub` and `key`; the draft shape requires `hub`; `Recover.svelte:61` reads `key`. `grep -rn "instanceText([^,]*, 'id')" src` finds only `layout/saved/docs.ts:20`, the doc tabs' paths.

## P1, C11 on the final tree

Probe `o54-probe.test.ts` in scratch copies only (`ls tests/data/hubs` in the worktree: no probe). `stateRecord` imported from `src/lib/state/shared/page/records.ts`. Final tree:

```
C11 palette item: {"id":"project:lab:lab-paper","state":{"hub":"lab","key":"lab-paper","label":"Project lab-paper"}}
C11 write answer: {"ok":true}
C11 layouts.json tab state: {"root":{"kind":"pane","tabs":[{"id":"t1","view":"project","state":{"hub":"lab","key":"lab-paper","label":"Project lab-paper"}}],"active":"t1"}}
C11 stateRecord from: "records.ts"
C11 record the tab opens after the reload: "lab:lab-paper"
C11 that record: {"id":"lab:lab-paper","held":true,"root":"lab","title":"Project lab-paper"}
```

## P2, C12 muted

Base tree:

```
C12 muted, no mute list: []
C12 muted, the workspace file parking 7653ae880b67: ["7653ae880b67"]
C12 parked (muted) findings: ["undefined | lab:projects/ideas/lab-empty | venue_id | 7653ae880b67"]
C12 lab-empty among the open findings: 0
```

Final tree:

```
C12 muted, no mute list: []
C12 muted, the workspace file parking 7653ae880b67: ["7653ae880b67"]
C12 parked (muted) findings: ["lab | projects/ideas/lab-empty | venue_id | 7653ae880b67"]
C12 lab-empty among the open findings: 0
```

The signature is the same on both trees, so a mute written before the step parks the same finding after it; the finding now carries `hub: lab` and a scope without the hub.

## Verify lines

The verify list (`npm run format`, `npm run test:quick`, the scoped run of Verify 2) ran 3 times; no whole-suite command ran. Each red line was rerun alone and passed:

- Run 1: `vitest` 1 failed (`workspace-projects.test.ts`, timed out at 5000 ms), `vitest slow` 2 failed (`hub-portfolio.test.ts` G32 and C6, timed out at 20000 ms). Alone: 13 of 13, 16 of 16.
- Run 2: `vitest` 2 failed (`app-manage.test.ts`, `app-store.test.ts`, timed out at 5000 ms); slow green. Alone: 38 of 38.
- Run 3, after the last change (a comment of `shapes.ts:77`):

```
ok      ASCII gate (21.1 s)
ok      prettier (21.2 s): All matched files use Prettier code style!
ok      svelte-kit sync (22.7 s)
ok      svelte-check (236.8 s): ... COMPLETED 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (273.6 s)
ok      vitest checks (335.1 s)
 Test Files  2 failed | 223 passed | 63 skipped (288)      [app-manage timeout, source.test.ts assertion]
 Test Files  1 failed | 76 passed (77)                     [hub-portfolio G32 timeout]
test:quick: 513.9 s; failed: vitest, vitest slow
```

  Alone: `app-manage.test.ts` and `source.test.ts` 50 of 50; `hub-portfolio.test.ts` slow 16 of 16.
- Verify 2 scoped, run 3: `npx vitest run --testTimeout 0 tests/checks/tree/boundaries.test.ts tests/data/hubs tests/routes/hubs tests/data/helpers/hub-names.test.ts tests/state/boards/board/hub-facets.test.ts tests/views/shared/forms/entry-add.test.ts tests/routes/edit/write.test.ts tests/state/client/held-unsaved.test.ts tests/state/forms/form-draft.test.ts tests/state/forms/page-entry.test.ts` plus this round's test files: `Test Files 23 passed (23) | Tests 334 passed (334)`.
- `sh utils/unused-exports.sh` against `migration-O54-base/unused-exports.txt`: identical, `Unused exports (229)`.
- Sizes: no changed file over its limit; `writes.ts` 808, `hub-writes.test.ts` 733, `writes/hubs.ts` 272.
- Comments over 100 columns that the step added: none left.
- Verify 6 grep: the same set of hits as on the tree before this round (`diff` of the sorted hits: identical). The record-id ones are `hub-names.ts:32` and `:56` (`hubId`, `addressOfId`), `page-entry.ts:73`, `:123`, `:303` (page names and settle keys), `palette.ts:206`, `:227` (palette item ids), `audit/rules.ts:289` (the signature); the rest are times, file:line places and keyed each-blocks.
- Verify 7 grep of this round's comments and titles: one hit, `idents.ts:33` 'before the feed is asked whether it is unique', an order of steps, not history.
- `npm run check` once alone: 0 errors.
