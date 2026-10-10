# D49 landing

Position: oculus migration plan, step D49 (the help pages cut) landed; next: D55 (roots as hubs), whose review over round 1 is saved and whose findings are ruled next, then D58 (the engine's guides on every hub, added by Z766) and Q72 (the architecture re-read).

## Open items

None.

## Check before landing

`ListAgents` before the wip commit listed no D49 agent (only D55's reviewer over round 1, running); TaskStop found D49's builder adab6acbc7bcccf65 and its reviewer over round 1 a7ac7ddb45eb85813 already ended.

## Not done

Nothing inside D49's brief and the rulings on it. The look could not show the Apps guide tab or the Data map tab drawn: the scratch hub (a copy of `demo/`) lists no documents, and the Apps guide tab is refused there, as it is on the base (Z766, step D58). Neither tab was looked at on this hub, since the look never uses Axel's server.

## What landed

The help pages cut, from base 9337c3ad4 (21 paths, +871 -1942). The seven guides under `tools/oculus/docs/` are removed, and what a reader cannot learn from the screen is in HELP.md (447 lines): every key and chord of the guides, the debugging keys and the `launch.yml` example, the hand-written files and their keys, what asks first or is refused, and the limits with their settings. The Apps guide is rewritten short (349 lines). The hub's `docs/DATA-MAP.md` gives each file's fields, the `present.yml` field table included. The `help` arrangement holds the manual, the Apps guide and the Memories wall, and the hub's `docs:` list holds Research approach, Agent approach, HPC how-to, Data map and the Apps guide. The DESIGN.md pointers name the HELP.md section or the code that holds what they say. DESIGN.md's `docs/diagrams/` drawings are drawn by no view any more (DESIGN.md is a file only, ruling (8) of the Additions of 2026-10-09).

## What was found

The review over repair round 1 found: the manual still kept menu lists, placement, what views draw and keys the key table already gives; five facts were dropped with no ledger row (the `$((...))` arithmetic that runs a placeholder as code, a private-folder root that lists no name, the name listing's `search.timeout_s`, a moved Views catalogue opening on its own page, the `{0}` and `{1}` of `text/findings.yml`); the ledger listed as dropped eight sentences HELP.md states; `DESIGN.md:146` claimed HELP.md holds every Live HPC refusal word; two view comments were inaccurate; one DATA-MAP line kept a history phrase. Each is closed in `agents/reviews/D49-refuter.md`, Closed (at landing).

Fixes at landing: 6, one per finding above, the ledger one closed by the record.

The look found the Help page's Apps guide tab refused on a hub that does not list `tools/oculus/docs/apps.md`, as on the base: the tab names the guide by a path relative to the hub. Booked as Z766 in automode, step D58.

## Verification

On main, `npm run test:landing` from `tools/oculus`:

```
ok      ASCII gate (12.2 s)
ok      npm run format:check (14.3 s): All matched files use Prettier code style!
ok      npm test (189.5 s)
ok      npm run lint (223.5 s)
ok      npm run test:checks (375.1 s)
ok      npm run check, then npm run build, then npm run test:slow (406.2 s)
test:landing: 406.2 s; every command passed
```

After the last edit (the tree row of the key table), `npx vitest run tests/checks/config tests/checks/source tests/data/sources/docs.test.ts`: 9 files, 116 tests passed. `npm run diagrams` changed no tracked file. The builder's cases rerun on main: case 3, 78 chords, 0 missing; case 3b, no key of the guides missing; case 5, 55 targets, 0 unmatched. No A/B (the configuration names no `bench:`).

Look, on a scratch oculus from the gate (port 8796, HOME and a copy of `demo/` as the hub under the scratchpad): the Help page shows the manual with its contents list and sections, the Debugging section with the `launch.yml` fence drawn as code; the Apps guide tab shows the refusal above.

## Agents

- Builder adab6acbc7bcccf65 (claude-sonnet-5-5): 253,431 tokens, 320 tool uses, 71.6 min; round 1 295,368 tokens, 577 tool uses, 161.6 min.
- Brief check a2bb671665419901b (claude-opus-5-5): 233,680 tokens, 62 tool uses, 10.6 min.
- Reviewer add1d084012545bb6 (claude-opus-5-5): 352,420 tokens, 138 tool uses, 26.2 min.
- Reviewer over round 1 a7ac7ddb45eb85813 (claude-opus-5-5): 373,779 tokens, 80 tool uses, 21.4 min.

The first report did not pass its bar (one repair round). Fixes at landing: 6.

## Next

Rule D55's findings of the review over round 1, /land D55, then /spec D58 and Q72.
