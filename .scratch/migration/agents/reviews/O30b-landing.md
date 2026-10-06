# Landing: O30b, the app's own build folders

Position: oculus/migration, step O30b (the app's own build folders) landed after E4g; 304 steps ticked (`grep -c "^- ✅" plan.md`). Next: PR2 (Present decks from any folder), its brief check running.

## Open items

None of O30b's.

## Check of the agents

The builder (a790ab45acb7513c3) and the reviewer (a1d5134e2f2e837cf) are not in the runner's agent list (ListAgents shows Q124's, D23's and Q125's builders only).

## NOT DONE

Nothing of the brief. Case 15 (the packaged app's not-built dialog) was not looked at: TEST is a browser page, and the case rests on the catalog sentence in `config/text/desktop.yml:9`.

## What landed

- `vite.config.ts` a function of the Vite mode; under `app` it writes `.svelte-kit-app/` and `build-app/` and points Vite's `tsconfig` at `.svelte-kit-app/tsconfig.json`; `process.env.MODE` set for SvelteKit's analyse worker.
- `src/desktop/server/build.ts` builds with `--mode app`; `src/desktop/server/process.ts` forks the server with `--handler`; `src/server.ts` and `server/root/process/args.ts` read `--handler`, refusing a missing value, a missing file and a folder, and name a handler that throws.
- `src/desktop/decide/args.ts` refuses `--handler` in the app's own arguments; `src/desktop/app.ts` checks `build-app/handler.js` before a start.
- `.gitignore`, `.prettierignore`, `eslint.config.js`, `watch/git.ts` and `data/helpers/search/query.ts` skip the two new folders.
- `utils/diagrams/imports.mjs` follows a conditional import; `docs/diagrams/layers` redrawn; `tests/checks/diagrams/diagrams.test.ts` a table of import forms; `tests/server/desktop/start.test.ts` builds `build-app/` and passes `--handler`; `tests/tiers/landing.mjs` comment.
- README.md, HELP.md and DESIGN.md (the tree, :135, :188, :398, :436, and the native-window line).
- Paths outside the write list: `src/lib/server/root/process/build-folders.ts` (new, one home for the app's mode and folder names); DESIGN.md :135, :188 and :398 (sentences the change made false).

## Fixes at landing

1. St1: `build-folders.ts` holds `PLAIN_FOLDERS` and `appHandler(checkout)` beside `APP_FOLDERS`; `vite.config.ts` reads `PLAIN_FOLDERS`; `watch/git.ts` builds `IGNORED` from both maps; the head comment says the search query, layer 1, writes the names again.
2. St2: `handler_failed` placed before `port_in_use` in `config/text/server.yml`.
3. St3: `src/desktop/app.ts` computes the handler path through `appHandler` at both places.
4. The DESIGN.md native-window line: the one cherry-pick conflict, PR1's full-screen sentence and O30b's build folders both kept.

## Verification

From the gate at main's head (7e6c14d8c) with the step and the fixes: `npm run diagrams && npm run test:landing` printed `ok` for the ASCII gate, `npm run format:check`, `npm run lint`, `npm run test:checks`, `npm test`, and `npm run check, then npm run build, then npm run test:slow` (458.8 s), `exit=0`. Main's staged diff equals the gate's (`cmp` printed nothing).

## The look

None: the step changes the desktop app's build and start, which TEST, a browser page, does not show.

## Findings

S1, S2, P1, P2, St1 to St3 and B1 of the refutation, each closed under its Closed heading in `agents/reviews/O30b-refuter.md`.

## Agents

- Builder a790ab45acb7513c3 (claude-sonnet-5-5): hand-back 279,639 tokens, 76 tool uses, 35.7 min; final run 218,857 tokens, 129 tool uses, 138.8 min.
- Brief check a4fbb5ab96ae037e3 (claude-opus-5-5): 225,807 tokens, 65 tool uses, 9.4 min; closed by a85fbf1484fff6900 (claude-opus-5-5): 179,741 tokens, 41 tool uses, 8.9 min.
- Reviewer a1d5134e2f2e837cf (claude-opus-5-5): 238,618 tokens, 85 tool uses, 38.7 min.
- The first report handed back two cases (rulings A1 and B1), then passed its bar with no repair round; three fixes at landing and one conflict resolved.

## Next

PR2's brief check, then its preparation commit and builder.
