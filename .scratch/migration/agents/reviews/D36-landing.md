# D36 landing

Roadmap entry: oculus/migration (the cockpit-to-oculus migration). Plan step D36, linters as VS Code's. Next: D39 (hub keys as links), reviewed, goes to its repair round; D40 (the writing rules as editor marks) can now be prepared.

## Open items

None.

## The check of Steps 1

The builder a6524e67c2c932dc1, the brief check ab66036bc6fe3c58d, its closing a95ffc1009df88e4a, the premise recheck a171b94b2f14b66e9 and both reviewers (ae0da9f815922756d, a7050c3c2cddf1d91) had completed; the agent listing showed no agent of this session running.

## Not done

Nothing of the brief. Not looked at on the page: Run Again on a tab of an unserved root (R1-2); the tests the review reran cover it.

## What landed

Booked 2026-10-09: linters as VS Code's landed on main from base 669ae7f08 (99 files, +4730 -435 with the fixes at landing): ChkTeX for LaTeX, Ruff for Python, ESLint for TypeScript, JavaScript and Svelte and ShellCheck for shell, each run on the file on disk by `POST /api/lint` (`server/machine/runs/lint/`: the route, the linter table `linters.ts`, the readers `readers.ts`, the held ESLint child `eslint.ts` and `eslint-child.mjs`) when a source tab of the file is held, saved or read again; their rows as editor marks and Problems rows (owners `lint-chktex`, `lint-ruff`, `lint-eslint`, `lint-shellcheck`), with quick fixes, Fix All on the linted text only, suppression comments, Show documentation for an `http:` or `https:` address only (`webAddress` in `data/hub-address.ts`), a status item per linter only after its answer with Run Again; the ESLint configuration run only after its approval per configuration folder (`eslint-config:`, Z740), the `:eslint-config` list and the palette entries; the `lint.*` switches and program paths in `behavior.yml`. One repair round (`agents/briefs/D36-round1.md`), refuted again (`agents/reviews/D36-refuter.md`, "Repair round 1, refuted"); its findings closed at landing ("Closed"). Open item 17 ruled (b) by Axel: G70 written, its two rows (`agents/reviews/D36-item17-tests.patch`) applied. Guarded entries written into `agents/guarded.md`: G1, G2 and G7 widened to the lint route, G55 to a linter, G36 to the held ESLint with the revoke row, and G70. Fixes at landing (9): R1-1, `Source.svelte` publishes the linters' place whenever the lint store names the file, so `:eslint-config` lists before the first answer; R1-3, `eslint-switch.test.ts` tagged slow; R1-4, the head comment of `hub-address.ts` and the `boundaries.test.ts` comment; R1-6, G36's revoke row; the code span in `eslint-child.mjs`'s head comment; the `boundaries.test.ts` comment rewrapped to the hundredth column (G23, red in the gate's first run); `layout.yml`'s `nav_groups` put in the rail order of commit 02a09980e (Sessions after Incoming), red in the gate's first run on G13's catalogue-order row, which reads `layout.yml` alone, a file D36's range does not change; and the look's defect, the lint store forgetting a file's answers when a preview tab is pinned by its first edit (the release now forgets after the current task, so a remount of the editor keeps the marks); and, by Z64, `tests/routes/machine/debug.test.ts` and `tests/server/machine/runs/schedules/watch.test.ts` tagged slow after one row of each timed out at 5 s in the gate's second run while D39's reviewer ran its checks, each file passing alone (`npx vitest run` of the two: 2 passed, 3 tests, 4.68 s). Closed without code: R1-2 (no Run Again for a tab of an unserved root, stated here), R1-5 (the builder's `pkill -f nothing`, reported to Axel), R1-7 (the worktree's round-0 report, left out by the landing's ledger exclusion). The builder's first report did not pass its bar (the first review's findings went in round 1). Usage: builder a6524e67c2c932dc1 (claude-sonnet-5-5) 87,036 tokens, 378 tool uses, 87.3 min, round 1 253,015 tokens, 265 tool uses, 63.7 min; brief check ab66036bc6fe3c58d 275,056 tokens, 102 tool uses, 15.1 min, closed by a95ffc1009df88e4a (usage not recorded); premise recheck a171b94b2f14b66e9 322,213 tokens, 95 tool uses, 15.0 min; reviewer ae0da9f815922756d 79,242 tokens, 95 tool uses, 23.2 min; reviewer over round 1 a7050c3c2cddf1d91 307,613 tokens, 93 tool uses, 21.0 min (claude-opus-5-5). Gate in `.agents/worktrees/gate` at 492e929e0 with D36's range and the fixes, `npm run diagrams && npm run test:landing`: first run red on `test:checks` (2 of 248, the comment width and the rail order), every other command ok; second run, after the look's fix: ok ASCII gate (2.0 s); ok npm run lint (25.6 s); ok npm run format:check (28.1 s); FAILED npm test (149.9 s), the two timeouts above; ok npm run test:checks (261.0 s), 248 of 248; ok npm run check, then npm run build, then npm run test:slow (321.7 s); then, with the two files tagged, `npm test` 134 files passed, 21 skipped (1013 tests passed) and the two files under `--tagsFilter slow` 2 passed. Main's staged diff `cmp`-equal to the gate's (99 files); main moved to 5e56b30df meanwhile, a commit outside `tools/oculus`. Look on the 8796 scratch oculus served from the gate (`agents/reviews/D36-landing.md`). The A/B: no `bench:` line, none run.

## The look

On the 8796 scratch oculus served from the gate, with a scratch home, three planted files (`look-d36/a.py`, `b.sh`, `c.tex`) and `src/look-d36.ts`, all removed after:
- `a.py`: Ruff's rows as marks and in the Problems view, and the status item.
- `c.tex`: ChkTeX's marks and status item.
- `src/look-d36.ts` before the approval: the status item says ESLint is not approved, and pressing it lists the `:eslint-config` entry before the first answer arrives (R1-1); the approval dialog names the configuration file. After the approval on the scratch home, four marks, the same four errors as `npx eslint --no-cache src/look-d36.ts` prints.
- The quick-fix menu on an ESLint mark in a clean tab: the fix applied, and one undo took it back. In a tab with unsaved text, the Source Action menu lists no ESLint Fix All.
- `b.sh`: ShellCheck's marks and status item; a preview tab pinned by one typed character and then undone keeps them (the defect the look found, fixed at landing in `lint.svelte.ts`).
- No console error.

## What was found

The defect the look found and its fix, the gate's red lines and their fixes, and the review's dispositions are in the booking above and under "Closed" in `agents/reviews/D36-refuter.md`. The builder's conduct the review found: one `pkill -f nothing`, a pattern kill that the rules forbid; nothing shows whether it signalled a process. One `ls -la ~/.oculus`, which the session's rules forbid and `agents/spec.md` does not name.

## Next

D39's repair round from `agents/reviews/D39-refuter.md`, its review over the round and its landing; `/spec D40`; M7 after D39, D41 after M7.
