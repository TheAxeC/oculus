# Landing: Q124, the tree checks with no limit and the vitest races

Position: oculus/migration, step Q124 landed; 305 steps ticked (`grep -c "^- ✅" plan.md`). Next: D23, Q125 and PR2, building.

## Open items

None of Q124's.

## Check of the agents

ListAgents shows Q124's builder (a39e65a9fa382453f) absent and its reviewer over round 1 (a8c2b6c8333c87868) completed; the running agents are D23's, Q125's and PR2's builders.

## NOT DONE

Nothing of the brief. Stated, not fixed: two `npx svelte-kit sync` runs, or two lone `npx vitest run` started by hand at once on a checkout with no generated types, both write the types; every command of the tree that starts vitest runs together now syncs first.

## What landed

- `package.json`: `test:checks` runs every file under `tests/checks` with `--testTimeout 0 --hookTimeout 0`; `test:slow` excludes `tests/checks/**`.
- The per-case limits under `tests/checks/` removed (`diagrams.test.ts`, `comment-width.test.ts`, `history.test.ts`, `claude-usage.test.ts`).
- `vite.config.ts`: `noVitestDepsCache` and `syncTypesOnce`, inside O30b's mode function.
- `tests/tiers/landing.mjs` and `quick.mjs`: head comments, and the sync before vitest on a checkout with no types.
- `HELP.md`, `README.md`: the test commands.
- Lines as landed (`wc -l`): `vite.config.ts` 167, `tests/tiers/landing.mjs` 72, `tests/tiers/quick.mjs` 294.

## Fixes at landing

1. The merge with O30b: `sveltekit(...)` passed as its promise to an async `syncTypesOnce(kit, folders.kit)`, the config a plain function of the mode; an `async` config was the first run's red line in `npm run check` (`vite.config.ts` 82:29, no overload of `defineConfig` takes it).
2. R1-1: the `syncTypesOnce` comment names every writer of the types.
3. R1-2: `landing.mjs`'s head comment.
4. R1-4: the sync before vitest in `quick.mjs` and `landing.mjs` on a checkout with no types.
5. R1-3 and R1-5: `agents/reviews/Q124-report.md`, "Corrections at landing (the orchestrator)".

## Verification

On the gate at main's head with the step and the fixes: `npm run diagrams && npm run test:landing` printed `ok` for the ASCII gate, `npm run format:check`, `npm run lint`, `npm run test:checks` (96.8 s), `npm test` (121.7 s) and `npm run check, then npm run build, then npm run test:slow` (285.8 s), `exit=0`. The first run was red on the type error above and on `tests/server/desktop/start.test.ts` 'starts no server when another program holds the port, and names the port' (one server found where none was expected); with only `vite.config.ts` changed between them, the second run passed it. A vitest run left `.svelte-kit/non-ambient.d.ts` and `tsconfig.json`'s mtimes unchanged (`stat` before and after). Main's staged diff equals the gate's (`cmp`).

## The look

None: the step changes test commands and the build configuration, no view.

## Agents

- Builder a39e65a9fa382453f (claude-sonnet-5-5): 242,256 tokens, 97 tool uses, 97.4 min; round 1 300,812 tokens, 142 tool uses, 62.1 min.
- Brief check a637e9ef56264db07 (claude-opus-5-5): 202,225 tokens, 63 tool uses, 9.0 min; closed by ad1758291d4f08a72 (claude-opus-5-5): 123,025 tokens, 19 tool uses, 4.4 min.
- Reviewer a8ffa34a027b813e6 (claude-opus-5-5): 178,043 tokens, 52 tool uses, 62.6 min; a68c2590b5c60eb18 stopped.
- Reviewer over round 1 a8c2b6c8333c87868 (claude-opus-5-5): 208,204 tokens, 58 tool uses, 30.1 min.
- The first report passed its bar but for B1, sent as repair round 1; five fixes at landing and one red line fixed.

## Next

D23, Q125 and PR2 land as their builders report.
