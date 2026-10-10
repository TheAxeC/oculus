# D58 landing

Position: the cockpit-to-oculus migration, step 325 of 338 in the step list, D58 the engine's guides on every hub. Landed. Next: D59 the hub fixes and personal projects, then Q72; O33 paused.

## Open items

None.

## Agents stopped

`ListAgents` before the landing listed none of D58's agents (builder aae7ed72c018ec649, reviewers a5069412810f7d98c and ad3272f8c36ade777, brief check a7c19a6a67f61ce16).

## Not done

- The look of case 7 and of the "Document" name was taken on a scratch oculus run from the gate with the gate as the hub (main's staged diff and the gate's hash the same, 7c5c7a166d3f), not on the TEST page of Axel's server.
- A hub document's link to `tools/oculus/HELP.md` (the second half of case 7) was not seen on screen: no hub document of this hub holds such a link (`grep` of `docs/*.md` finds the path only in code spans). The row 'a hub link to the manual opens the Help view' of `tests/views/shared/prose/doc-link.test.ts` checks it.

## What landed

Main from base 6511e8ce1, 44 paths, +1009 -208:

- A document of the engine is a doc tab whose state is `{ id: engine:<path>, path, engine: true, label? }`. It is served by `api/docs?engine=<path>` from the engine folder, the same way as the manual. The route refuses with a 404 naming its reason:
  - a path out of the engine;
  - a dot or `node_modules` segment, by name and by real path;
  - a folder;
  - a missing file;
  - a link out of the engine.
- The docs answers carry `engine` and `engineAt`.
- A link opens by the rules of the space its document is read in (`openingOf`, `doc-link.ts`). A hub link that climbs out of the hub opens nothing.
- An engine tab names and acts on the file at `<engineAt>/<path>` under the hub root, in all of these: the breadcrumb, the tab menu, the file icon, the hover path, Open Editors and the Timeline. With the engine outside the hub, it acts on no file.
- A saved tab that names the guide by its hub path is restated as the engine document, keeping its label.
- The view is named Document.
- The hub's `docs:` list no longer names the guide.
- HELP.md, DESIGN.md and `docs/DATA-MAP.md` follow.

## Verification

From `tools/oculus` in the gate, at main's head plus the step and the landing fixes:

- `npm run test:landing`:
  - `ok      ASCII gate (4.4 s)`
  - `ok      npm run format:check (22.9 s): All matched files use Prettier code style!`
  - `ok      npm test (127.6 s)`
  - `ok      npm run check, then npm run build, then npm run test:slow (399.8 s)`
- `npm run lint`: exit 0.
- `npm run test:checks`, with the gate as the hub: `Test Files  17 passed (17)`, `Tests  271 passed (271)`.
- `npx vitest run tests/state/workbench/navigation/pages.test.ts tests/views/shared/prose/doc-link.test.ts`: `Test Files  2 passed (2)`, `Tests  20 passed (20)`. On a copy of the base, doc-link fails 11 of 11 and pages fails 2 rows.

## The look

Taken on a scratch oculus from the gate (port 8796, HOME under the scratchpad).

On a copy of `demo/` as the hub, with the engine outside the hub:
- Case 1, met: the Help page's Apps guide tab drew "Building an oculus app".
- Case 6, met: the guide's `HELP.md` link opened the Help view. With the guide tab closed, the manual's Apps guide link opened an engine doc tab named apps.md.

On the gate as the hub:
- Case 7, met: with the guide tab open, the manual's link made it active and opened no second tab. Tabs read Help, Memories, Apps guide.
- Case 8, met: a saved tab `{ id: tools/oculus/docs/apps.md, path: tools/oculus/docs/apps.md, label: Apps guide }` drew the guide. The breadcrumb read hub > tools > oculus > docs > apps.md, and the saved state read `{ id: engine:docs/apps.md, path: docs/apps.md, label: Apps guide, engine: true }`.
- Case 11, met: a temporary `docs:` entry for `tools/oculus/docs/apps.md` in the gate's hub layer gave the catalogue row Apps guide h7. Its click activated the Help page's one guide tab. The entry was removed afterwards.
- Unlabelled hub tab, as expected: a hub doc tab `{ id: README.md, path: README.md }` read Document in the strip, with the breadcrumb hub > README.md and the "not in the documents list" line.

## Agents

| Agent | Role | Model | Tokens | Tool uses | Time |
|---|---|---|---|---|---|
| aae7ed72c018ec649 | builder | claude-sonnet-5-5 | 353,563 + round 1 241,155 | 116 + 101 | 31.6 + 26.4 min |
| a7c19a6a67f61ce16 | brief check | claude-opus-5-5 | 235,846 | 62 | 9.9 min |
| a5069412810f7d98c | reviewer | claude-opus-5-5 | 243,734 | 67 | 12.5 min |
| ad3272f8c36ade777 | reviewer over round 1 | claude-opus-5-5 | 260,604 | 70 | 13.5 min |

The first report did not pass its bar. The first review's findings went back in repair round 1. Axel ruled no second round (Open item 34).

## Fixes at landing, 5

- G74 written into `agents/guarded.md` with its two tests.
- G2's Doc text applied.
- The `strip-tab.ts` head comment rewrapped.
- "Hub document" changed to "Document" in `docs/DATA-MAP.md` lines 46, 220 and 301.
- `tabNameOf` falls back to `engineDocName`.

Each is listed in `agents/reviews/D58-refuter.md`, Closed (at landing).

## Next

/spec D59. It now also carries item (7), rice-theme text that reads larger than under a VS Code theme, most visible in the Files view, and item (8), the per-hub config paths in `docs/DATA-MAP.md`. Then Q72.
