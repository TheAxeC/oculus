# D66 landing

Position: oculus migration, step D66 (two view fixes and the float's tab strip) landed; next step D63 (apps in the shell).

## Open items

None.

## The check of Steps 1

The builder a34b743a90b70fe6a and the reviewer a727888db11c74f53 had both finished before the landing; the runner's agent listing showed neither running.

## Not done

Nothing inside the step. The look did not cover the Usage view's live-session rows, since the scratch HOME has no live session, and did not cover the dark theme.

## What landed

From base 8c3c52cb6, 17 paths, +158 -134 against main, the ledger left out:

- `arch_color` removed from `config/catalogs/vocab.yml` and `data/shapes/catalog-files.ts`; the Map colours every node, and every archived status dot, by `type_color` (`nodeTone` in `views/structure/map/node-view.ts`, `archiveStatuses` in `state/boards/structure/graph.ts`); the node layer moved from `Graph.svelte` into the new `views/structure/map/Nodes.svelte`; the comment above `type_color` at `vocab.yml:54` says it is keyed by type; `tests/checks/config/config-folder.test.ts` drops `arch_color`.
- `.live-row` in `views/system/machine/usage/Usage.svelte` drawn at `--fs-sm`.
- The reveal `$effect` in `ui/tabs/Tabs.svelte` runs only when the showing tab's id changes, reading `tabs` with `untrack` (the cause in `agents/reviews/D66-diagnosis.md`).
- The six `docs/diagrams/layer*.dot` and `.svg` files regenerated for `Nodes.svelte`.

## What was found

The review's five findings (`agents/reviews/D66-refuter.md`, Closed), all closed at landing with no repair round: the brief's case 5 named `catalogs/vocab` (met under `catalogs/vocab.yml`); the six diagram paths missing from the report (they land with the step); the report's `vocab.yml` line cites (corrected to line 54); the comment above the reveal effect (rewritten, the one fix at landing); a strip of any pane, not only the float's, is covered by the fix (looked at).

## Verification on main

From `tools/oculus`, `npm run test:landing`: ASCII gate, lint, format:check, npm test, check then build then test:slow, test:checks: `test:landing: 477.0 s; every command passed`. No A/B (no `bench:`).

## The look

On a scratch oculus at main's head with the staged step applied (port 8796, HOME under the scratchpad, pages reset): the right-docked float `[hpc, usage, workbenches]` at size 0.2 with Workbenches showing; the scroll-left control reaches Live HPC; a press on the half-hidden Usage tab shows Usage; the strip stays where it was scrolled. The Status pane's strip scrolled by the wheel so the Map tab is half out of sight, then a press in the Views pane: the strip stays where the wheel left it. The Map draws every node in its type's colour (active orange, idea indigo, the pillar square) and the archived status dots in their types' colours, `phd` indigo.

## Agents

- Builder a34b743a90b70fe6a (claude-sonnet-5-5): 194,934 tokens, 59 tool uses, 11.8 min; the full verify list run once.
- Brief check a040ddeba649f939d (claude-opus-5-5): 167,802 tokens, 65 tool uses, 7.3 min.
- Reviewer a727888db11c74f53 (claude-opus-5-5): 192,688 tokens, 63 tool uses, 14.3 min.
- Diagnosis of part (3): `agents/reviews/D66-diagnosis.md`, run by a person in the session, no diagnosis agent; cause: the reveal effect read `tabs`, so every layout write scrolled the strip back to the showing tab.

The first report passed its bar. Fixes at landing: 1.

## Next

/spec D63 (apps in the shell): its brief check's findings are closed in the brief, the guarded-entry rule clash goes to Axel as an open item; then /spec D67, D64, Q72 and O33.
