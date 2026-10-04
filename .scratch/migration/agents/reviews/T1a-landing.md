# T1a landing: the test tiers

Position: oculus migration, step T1a (fast tests). Next: X3f, then the queue in `queue.md` order, at Axel's go.

Open items: none.

Not done: nothing inside the step.

Landed on main as one commit (Z422): `tests/tiers/quick.mjs`, `landing.mjs`, `run.mjs` and `essential.txt`; `package.json` with `test:quick`, `test:landing`, `test:warm` and `test:slow` at a 20 s test timeout (Z420); the three `test:slow` fixes; the `isYamlMap` renames (Z364). The builder ran no test (Z419); the orchestrator measured the lists under Z370's load and made the changes Axel ruled inline (the cut-off removed, shared modules, the module cache, the sync beside the other parts, 10 essential tests, related tests two imports away, the cache warm, the landing parts at the same time with a lint cache).

Checks on main, from `tools/oculus`, no load:

- `npm run test:landing`: ASCII gate 2.3 s, format check 10.5 s, `npm test` 105.9 s, `test:checks` 106.1 s, lint 150.4 s, type check then build 151.4 s, `test:slow` 151.9 s; 151.9 s, every command passed.
- `npm run test:quick`: 14 test files, 10 essential; 24.3 s (limit 45.0 s), every command passed.

Under the load (four full `npm test` loops, load 12 to 21): five `test:quick` runs 57.8 s (empty cache), 29.6, 10.1, 6.7 and 25.0 s; `test:landing` 206.4 s, every command passed.

Usage: builder claude-sonnet-5-5, 289,972 tokens, 69 tool uses, 16.1 min. No brief check, no reviewer (Axel). The builder's first report did not pass its bar: its 24 s cut-off left most chosen tests unrun while reporting a pass; fixed at landing with the other inline changes.
