# O62 landing

Position: plan migration (cockpit to oculus), step O62 (`archive_order` removed from `config/catalogs/vocab.yml`, the orphan test over every catalog file's top-level keys), landed 2026-10-22. Next: /spec O49 on from its preparation commit, /land O52, /land O50, /spec O57 and O61.

## Open items

- Open item 240: how the landing's check follows the standing demand "Only related tests at a landing". (a) `tests/tiers/quick.mjs` gains a related-only selection (no essential list; the related and changed tests under `tests/checks` and tagged slow included; no 45 s limit) and it becomes the verify list for builders, reviewers and the landing alike; (b) the same selection at the landing only, the landing then replaying `land.sh`'s steps by hand. Recommendation (a).
- Open item 241: where the landing's tests run. (a) On main, as `land.sh` does, Z492 retired (the lazy option); (b) in the gate worktree as Z492 says. Recommendation (b).

## Not done

- The build beside a running vitest, the case the `vite.config.ts` fix is for, was not run. The build alone passed.

## The look

On TEST: `config/catalogs/vocab.yml` opened from the Files view (oculus > config > catalogs). Completion at a new top-level key offers `career_host_status`, `career_score_dims`, `career_score_tones` and `leads_fit`, and no `archive_order`. The edit was undone and the file not saved. The second completion request hid the details pane, and oculus wrote `suggest_details: false` into the hub's `.oculus/workspaces/research-hub.yml`; the line was removed, and `git status --short -- .oculus` and `git status --short -- config ':!config/local.yml'` show no write of the look. Defects: none.

## The check of Steps 1

The O62 builder (a2be218df230a06d7), its brief check (a05874f9b03fbf13d) and its reviewer (acc2eb3d4addcfcb2) had all finished before the cherry-pick; none was running.

## What landed

From base a2288789, replayed on `migration-O62-land` and staged with `git cherry-pick -n main..migration-O62-land`: `archive_order` removed from `config/catalogs/vocab.yml`, its shape from `src/lib/data/shapes/catalog-files/vocab.ts` and its row from `tests/checks/config/config-folder.test.ts`; `tests/checks/source/keys.test.ts`'s orphan test covers the top-level keys of every file under `config/catalogs/`.

## Fixes at landing

- The replay's conflicts in the diagrams: `layer-views`, `layers` and `writes` took main's copies, `layer-state` the step's, then `npm run diagrams` regenerated them; only `writes.dot` and `writes.svg` changed (`vocab.ts:300` to `:296`).
- `tests/routes/edit/write.test.ts` tagged `@module-tag slow`: it timed out in the quick list on main and passes alone (4 passed); O62 does not change it.
- `vite.config.ts`: a build sets `OCULUS_TYPES_WRITER` to its process id once its types are written, and the client build SvelteKit starts in the same process takes no types lock and waits for no vitest run. The landing gate's build had failed after 15 minutes with "the types are still read by 75908, 75965", the gate's own `test:slow` and `test:checks`.

## What was found

The review (`agents/reviews/O62-refuter.md`, no repair round): S1 fixed by the regeneration; T1 no change; B1 closed in the booking (a hub schema field `from: vocab.archive_order` offered eleven words before and nothing after, with a schema finding; no hub sets it). The builder's first report passed its bar.

## Verification on main

Before the standing demand: `checks.sh` red only on the `write.test.ts` timeout; `npm run test:landing` 1350.0 s, every command `ok` but `FAILED npm run build (980.1 s)`.

After the fixes, under the demand:

```
test:quick: 19.7 s (limit 45.0 s); every command passed
 Test Files  3 passed (3)
      Tests  43 passed | 2 skipped (45)
<check mark> built in 17.03s
real 39.14
```

The second and third lines are `npx vitest run tests/checks/config/config-folder.test.ts tests/checks/source/keys.test.ts tests/routes/edit/write.test.ts --testTimeout 0`, the changed test files the quick list leaves out; the last two are `npm run build` alone. A/B: none, `bench: []`.

## Agents

- Builder a2be218df230a06d7, claude-opus-5-5: 171924 tokens, 52 tool uses, 12 min 57 s.
- Brief check a05874f9b03fbf13d, claude-opus-5-5: 158684 tokens, 43 tool uses, 5 min 57 s.
- Reviewer acc2eb3d4addcfcb2, claude-opus-5-5: 157328 tokens, 34 tool uses, 15 min 12 s.
