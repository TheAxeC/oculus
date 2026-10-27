# O84 landing

Roadmap entry: the oculus migration plan (`.scratch/migration/`). Step O84, who the user is: `self` read from the primary hub's `.oculus/local.yml`. Landed 2026-10-27. Next: the preparation of O88 on main with O84; the reviews of O87 and O94, then their landings.

## Open items

None.

## Check of the agents

`ListAgents` at the landing listed two subagents running, the reviewers of O94 (a3d20902e374d2dd1) and O87 (a362e1e25ae8483be); none of O84's brief check (a16be0c5fb7576829), builder (a6b9bb9efcca75eff) or reviewers (aa3b772655f6267cf, a5ac8523126cb8c96).

## NOT DONE

Nothing of the step.

## What landed

The whole range `65f5c83c2..migration-O84` (one wip commit 7e7779d2a), 116 paths with the fixes at landing, 2408 insertions and 770 deletions.

- Conflicts in the gate at main 74e179bad: the generated `docs/diagrams/writes.dot` and `writes.svg`, taken from main and regenerated; four comments resolved by reading both sides (`normalise.ts`, `career.ts`, `focus.ts`, `ProjectCard.svelte`).
- Fixes at landing: the `machineHubs` comment in `config-place.ts` ("no settings-file or workspace-file write reaches"); `tests/state/boards/board/items.test.ts` passes `self: ''` in its `WorkspaceRead`.
- Doc text: `docs/HELP.md` (nine sentences) and `docs/data-map.md` (the `people` line, staged alone; the uncommitted section's `local.yml` key list gains `self` in the working tree).
- `agents/guarded.md`: G8, G66, G67 and G119 sentences and test rows.
- Ruling 462: `writeSelf` run once on the hub's `.oculus/local.yml`, printing `written` and nothing of the file; `self:` taken out of `.oculus/workspaces/research-hub.yml` in hub commit 5a7e8e025.

## What was found

- The review over round 1: Spec 1 and Spec 2 recorded as breaches (the builder's inline programs given as a count; two read-only `git log` commands); Spec 3 closed by keeping the `local_check` refusal as a guard; Standards 1 fixed at landing; the Proof finding and Standards 2 are report-only. Each disposition is under "Closed" in `agents/reviews/O84-refuter.md`.
- svelte-check: one error in a test main gained after the base, fixed at landing.

## Verification

- In the gate, `npm run diagrams && npm run docs:palette && npm run test:quick`: svelte-kit sync, prettier, ASCII gate, eslint (241.2 s) and vitest checks ok; svelte-check failed on the one error above, and after the fix printed "0 ERRORS 0 WARNINGS" over 4331 files; vitest and vitest slow failed only on time-outs in 21 files and one worker start for `tests/ui/html.dom.test.ts`, at a load average near 19 with two builders running tests. Alone the 21 files passed ("155 passed | 84 skipped" default, "84 passed | 155 skipped" slow) and `html.dom.test.ts` 8 of 8.
- On main: `git apply --index` of the gate's staged diff, then `cmp` of each of the 116 staged paths against the gate: 0 differ.

## The look

Scratch server on port 8797 from the gate, over a copy of the hub with a scratch `local.yml` (`self: axel-faes`) and a workspace file without `self`:

- Focus: the track record drawn (Lead 9 in review, 17 in flight, 10 publications, 9 other outputs; Supervisor 4 in review; Collaborator; Funding obtained 1).
- Axel Faes's page: "this is me" pressed.
- Maryam Amir Haeri's page: unpressed; pressed, after which the scratch file held `self: amir-haeri` at mode 600 and the page drew it pressed.
- Settings, `@id:self`: This machine, You, Self showing Maryam Amir Haeri, `.oculus/local.yml`.
- Axel Faes's page pressed again: the file back to `self: axel-faes`.
- Seen and not traced: the console's `state_proxy_equality_mismatch` warning at page load (O88 ends it) and three 404 responses it does not name.

## Agents

- Brief check a16be0c5fb7576829 (claude-opus-5-5): 291709 tokens, 129 tool uses, 16 min 43 s.
- Builder a6b9bb9efcca75eff (claude-opus-5-5): 360226 tokens, 327 tool uses, 114 min 30 s; round 1 346893 tokens, 129 tool uses, 36 min 30 s.
- Reviewer aa3b772655f6267cf (claude-opus-5-5): 111375 tokens, 116 tool uses, 23 min 38 s.
- Reviewer over round 1 a5ac8523126cb8c96 (claude-opus-5-5): 225057 tokens, 58 tool uses, 11 min 57 s.

The builder's first report did not pass its bar (one repair round). Fixes at landing: two (the `machineHubs` comment, the `items.test.ts` read).
