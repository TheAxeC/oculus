# O54, landing

Position: roadmap entry O54, the registries and the projects of every hub resolve own hub first, every internal id `<hub>:<key>` and never shown. Next in the plan: /land O65; then /spec O61, O53 and O56 on Axel's word; on O39, the first paint under the dev server, then C8 and the tick.

## Open items

- Open item 259 (2026-10-22, O65): Pin Editor and Unpin Editor show the chord Cmd+K Shift+Enter in the palette, but no key runs it, on main or in O65; with Cmd+K now the editor's chord key (ruling 258 (b)), the hint names a key that does nothing. Options: (a) bind Cmd+K Shift+Enter in the editor to pin and unpin the tab, as VS Code does, in O65's repair round; (b) keep the hint as it is, naming a key that does nothing; (c) drop the hint, the lazy option. Recommendation: (a), since the palette then tells the truth and the key behaves as in VS Code.

## Agents stopped

The builder a37648dff2f33b214 and the reviewers aa1dd67ae57731a87 and a16b86dd29919143f had all ended before the landing; the agent listing named no subagent.

## NOT DONE

- The LinkedIn write was not taken at the look: the demo hubs name no LinkedIn folder. Its routing is covered by the `hub-writes.test.ts` row 'sends a LinkedIn idea of the primary hub, which lab also holds, to the primary hub'.
- With no primary, a lead's fit shows `-`, since the merged config reads no hub's settings file. Found at the look, outside O54's brief, folded into O60 (Z468) and booked under O60 in `plan.md`.

## What landed

O54 on main from base 18fa0365, the whole range (wip commit b3f6630c: the build after the cases ruling and repair round 1), 229 files, +6797 -4872 with the fixes at landing. Every record of every hub, the primary's included, has the internal id `<hub>:<key>` and carries `root`; a reference resolves in its own hub, then in the others; pages, forms, findings and addresses show the key or the label with the hub chip; writes route by the hub part of the internal id, and a write that names no hub is refused; a saved tab names a record by `hub` and `key`. Ruling 238's one-time change of `~/.oculus/layouts.json` and `views.json` is applied: six places changed, a second run finds nothing, both files parse.

## Fixes at landing

- Spec R2: an app's `host` write follows the page's rule, the career file of the primary, else of the first hub (`src/lib/server/edit/writes.ts`, `docs/apps.md`); new row in `tests/routes/hubs/hub-writes.test.ts`, red on O54's tree ("expected 409 to be 200").
- Behaviour R3: the G28 guard checks the file the server writes for a create that names no hub (`src/lib/state/sessions/source/write-files.ts`, `src/lib/state/client/context.ts`); five new rows in `tests/state/client/held-unsaved.test.ts`, red on O54's tree (5 failed).
- Standards R1: `src/lib/state/boards/waiting.ts`'s doc comment rewrapped under 100 columns.
- Standards R2: `agents/guarded.md` G8 and G28 name the new rows.
- A card tree key held the joined id: `cardTreeKey` (`src/lib/state/sources/explorer/view/card-tree.ts`) encodes the hub and the key as two parts.
- `tests/checks/tree/boundaries.test.ts`: the comment on bare primary ids made true.
- Found at the look: with no primary every lead and Lit Watch page said its file holds no such entry, since the merged feed carried only the primary's file schema. `mergedFeeds` adds `hubSchemas` and `feedPage` takes the schema of the entry's own hub (`src/lib/data/snapshot/hubs/feeds.ts`, `src/lib/state/forms/page-entry.ts`, the `FeedsPayload` type, `docs/apps.md`); new row in `tests/state/forms/page-entry.test.ts`, red on O54's tree ("expected null to match object").
- Part E's hook row failed in `test:quick`'s shared-module run ("expected 3 to be 4"): an earlier test file had loaded `theme.ts` and `hooks.server.ts` over empty stylesheets. `tests/server/root/hooks-server.test.ts` resets the module registry before its modules load; three reruns of the same file set passed.
- Spec R1: the one-time change treats every saved view and state, a folder page's item included.

Left as they are: Behaviour R2 (a bare title with a colon is answered 404 naming a hub; C16 rules the refusal and nothing is written); Behaviour R1, stated here: an app's create with no primary was written to the first hub, and is now refused 409 `no_primary` (cases ruling 4); Standards R3 and the Proof notes.

## Verification

Only the tests related to the changed files, by Axel's standing demand, in the gate worktree: `npm run diagrams && npm run test:quick`, exit 0.

```
ok      ASCII gate (1.7 s)
ok      svelte-kit sync (3.5 s)
ok      prettier (3.9 s): All matched files use Prettier code style!
ok      eslint (124.1 s)
ok      svelte-check (149.1 s): 1792713973496 COMPLETED 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (181.2 s)
ok      vitest (215.8 s)
ok      vitest slow (236.4 s)
test:quick: 240.0 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            the build, the lint of unchanged files
```

Main: `git cherry-pick -n 18fa0365..b3f6630c`, the diagram conflicts resolved to main's head, the gate's 229 files copied; `cmp` of `git diff --cached --binary` on main and in the gate printed SAME. A/B: none, `bench: []`.

## The look

A scratch dev server on 8797 with a scratch HOME and two hubs, `research` and `lab`, copied from `tests/fixtures/hubs/demo`, by headless Chromium screenshots.

- With `research` the primary: Focus, Position Leads, Lit Watch and Funding list both hubs' records, the lab's with the chip `lab` and the primary's bare; a card shows `KEY ecf`. The Audit shows nothing open. Funding's Add asks for the key and the hub, the primary first; an Add into `lab` wrote only lab's `funding.yml`, opened the entry's page with the chip and the bare key, and saved its tab as `{collection: funding, hub: lab, key: look-o54}`.
- With no primary: every card carries its hub's chip; Add Lead wrote the first hub's `leads.yml` (lab); the lead's page opens with lab's fields and a saved field wrote lab's file; Save to Literature on a lab card wrote lab's `literature.yml`.
- LinkedIn shows its note: the demo hubs name no LinkedIn folder.

## Agents

- Builder a37648dff2f33b214, claude-opus-5-5: hand-back of C3 306,087 tokens, 83 tool uses, 14 min 1 s; build after the cases ruling 141,726 tokens, 1,083 tool uses, 3 h 10 min 19 s; round 1 343,126 tokens, 333 tool uses, 74 min 33 s.
- Brief check ad3e2648214fa3664, claude-opus-5-5: 247,636 tokens, 97 tool uses, 14 min 51 s.
- Reviewer aa1dd67ae57731a87, claude-opus-5-5: 149,205 tokens, 78 tool uses, 17 min 26 s.
- Reviewer over round 1 a16b86dd29919143f, claude-opus-5-5: 347,113 tokens, 113 tool uses, 33 min 36 s.

The first report did not pass its bar: a cases ruling, one repair round and nine fixes at landing.

## Next

/land O65; then /spec O61, O53 and O56 on Axel's word; on O39, the first paint under the dev server, then C8 and the tick.
