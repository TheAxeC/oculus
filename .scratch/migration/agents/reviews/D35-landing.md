# D35 landing

Plan oculus/migration, step D35 "every configuration file live". Next: /land D24, then /spec D32 and D18.

## Open items

- **Z241 (2026-10-02 06:50, Q88c): Delete Branch on a branch git calls not fully merged.** VS Code runs `git branch -d`, and when git refuses because the branch is not fully merged it asks "The branch '{0}' is not fully merged. Delete anyway?" and runs `git branch -D`. Oculus's `DESIGN.md:128` says "no form carries `--force`", the `git-write.ts` comment on push says "Nothing is ever forced", and `tests/server/git/git-write.test.ts:571-575` asserts no file of `server/git` contains `--force`. `-D` is `--delete --force`, so VS Code's retry meets that rule. Q88c is built with `-d` only: an unmerged branch is refused with git's reason and kept.
  - (a) Keep `-d` only. Pro: the no-force rule stands as written; nothing that holds commits no other branch holds is deleted from a button. Con: VS Code's "Delete anyway?" path is absent; an unmerged branch is deleted at a terminal.
  - (b) Add VS Code's retry: after git's "not fully merged" refusal, VS Code's question, then `git branch -D <name>`, listed in `CONFIRMED`; `DESIGN.md:128` amended to "no form carries `--force` except `branch -D` after its question", and the gate's test keeps refusing the `--force` spelling. Pro: VS Code parity; the commits stay reachable through the reflog for git's expiry period. Con: a rule written for every write gets one exception.
  - Recommendation: (b), since the parity ruling asks for every capability VS Code has, the question stands between the reader and the loss, and the exception is one named form under its own confirmation. It would be added to Q88c in a repair round or at landing, with no new step.

## The check of Steps 1

The runner's agent listing shows three agents, X3a's builder (acf8c525dec67af39), Q88c's builder (aaefbd170dbbfe70a) and D24's round reviewer (ad56b78a1dc9c9c51, since finished). D35's builder a3a67c98dc6835b4c and its reviewers a1fc727999ec8d0d1 and ac2a30247e591a557 are not in it.

## NOT DONE

- A real port move was not looked at in a browser: it needs `port` changed in `local.yml`, which this session does not open. The move, the announce after the listen, the page's probe and the carry are covered by `tests/server/root/vite-plugin.test.ts`, `tests/server/root/context-reload.test.ts`, `tests/state/client/config-seed.test.ts` and `tests/state/workbench/layout/saved/layout-carry.test.ts`.
- No A/B: the configuration block names no `bench:`.

## What landed

The 16 behaviour keys are read again at every config push, and every `local.yml` key is read again when the file changes; no key takes a restart. A hand edit the server refuses while it runs keeps the values in force and is logged once, and the Settings view's descriptions name each key's bounds. A changed `port` moves the server: it closes the old port, listens on the new one, and only then tells the pages. A page follows when its own port is the old one and the new address answers a probe; it carries its arrangement and "This browser" settings in `window.name`, marked with the origin it goes to and the time, and the arriving page takes them only at that origin within a minute (`src/lib/state/workbench/layout/saved/carry.ts`). The built entry and Vite's development and preview servers share one wiring, `wireServer` in `src/lib/server/root/process/serve.ts`.

Base bca2c6b3, cherry-picked by `land.sh` (wip 5d477987 on D35-land), 57 files staged by the cherry-pick plus the fixes below. A conflict in `docs/diagrams/layers.dot` and `layers.svg` was resolved on D35's side and the diagrams regenerated.

## What was found, and the fixes at landing

The run over repair round 1 found 1 Proof, 2 Standards and 3 Behaviour findings; each is closed on main, as `agents/reviews/D35-refuter.md`'s Closed heading lists:

1. Proof 1: a test of a move that a request starts itself, answered, and the server then serving the new port.
2. Standards 1: `server.closeIdleConnections()` removed from `serverMover`, since `server.close()` ends idle connections, and its test removed.
3. Standards 2: `wireServer` and `attachAtWs` hold the mover, the context, the socket and the `close` rule once.
4. Behaviour 1: the pages are told only once the new port listens; a refused move tells them nothing. Red without it: `expected 60367 to be 60368`, `expected 60372 to be 60373`, `expected 1 to be +0`.
5. Behaviour 2: the page follows only once the new address answers. Red without it: `expected "vi.fn()" to not be called at all`.
6. Behaviour 3: the carry is bound to its origin and time. Red without it: `expected { 'oculus.ui.v1': 'x' } to deeply equal {}`. What remains: a page of another site in the same tab that writes a carry naming oculus's origin and a fresh time, then opens oculus, is taken; the readers admit only a valid arrangement and valid settings, so the effect is a replaced arrangement.

`DESIGN.md`'s `local.yml` paragraph and `HELP.md:237` describe the announce after the listen, the probe and the carry.

## Verification on main

```
diagrams 0
$ npm test
 Test Files  442 passed | 22 skipped (464)
      Tests  11606 passed | 621 skipped (12227)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  444 passed | 9 skipped (453)
$ npm run check
1790919799629 COMPLETED 2990 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

## The look

On TEST at localhost:8790, the Settings view, searched for `poll_min`: the Slurm, Calendar and Mail poll keys read "A value outside 1 to 35791 is refused." with their defaults and `behavior.yml` lines. No console error on the tab. `window.name` is empty and the origin is `http://localhost:8790`. Under the current theme only.

## Agents

- Builder a3a67c98dc6835b4c, claude-sonnet-5-5 at ordo-high: the first run of the cases 257,278 tokens, 46 tool uses, 13.2 min; to the report 158,708 tokens, 111 tool uses, 135.2 min (7 full-list runs); repair round 1 362,735 tokens, 96 tool uses, 94.7 min (4 full-list runs).
- Reviewer a1fc727999ec8d0d1, claude-sonnet-5-5: 310,206 tokens, 90 tool uses, 53.0 min; 0 Spec, 4 Proof, 3 Standards, 5 Behaviour findings.
- Reviewer over round 1 ac2a30247e591a557, claude-sonnet-5-5: 272,871 tokens, 74 tool uses, 29.4 min; 0 Spec, 1 Proof, 2 Standards, 3 Behaviour findings.
- Brief check (the first build's): claude-sonnet-5-5, 279,072 tokens, 70 tool uses, 13.0 min.
- The first report did not pass its bar (12 findings in the first review). Fixes at landing: 6.
- Review branch: under `review: earned` the reviewer ran, since D35 changes server modules and a state layer.

## Next

/land D24 (its run over round 1 is in, 4 findings to close at landing); /spec D32 and D18; /spec M3 after D24; X3a and Q88c building.
