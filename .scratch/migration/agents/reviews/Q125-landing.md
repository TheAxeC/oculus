# Q125 landing

Plan oculus/migration (cockpit to oculus), step Q125, the user's guide and the design document rewritten. Next: Q126 (DESIGN.md reduced where Q125 left it short) and PR3 (Present decks edited and generated, being prepared).

## Open items

None.

## Not done

- About 60 DESIGN.md items outside Apps still repeat a guide, a head comment or another item (the review over round 2, Spec 1). That is Q126 (Z654), queued next.
- `tests/server/desktop/start.test.ts` 'asks the default port ... starts no second server' is red, on main's head without Q125 as well (Z663, its fix at D23's landing).

## Agents stopped

ListAgents before the landing listed one subagent running, D23's builder (a4832e8f1d3fc04a3); no builder or reviewer of Q125.

## What landed

HELP.md is the user's guide alone (159 lines). DESIGN.md holds the decisions with their reasons (576 lines). The behaviour each control has lives in six new guides under `tools/oculus/docs/`: configuration, source-control, window, views, files-and-search and terminals. Each guide opens on the Help page and in the Help group of the Views catalogue. README.md holds how to run and check oculus. G54's test of every page arrangement landed with it. Axel read and accepted the files before the landing.

## Fixes at landing

1. The merge (Z642, Q125 the second to land): the doc changes of PR1, PR2, O30b, Q124 and E4g carried into Q125's files. Present's decisions are in DESIGN.md's two Present items and its behaviour in the views guide's Present section; the app's `build-app/` folders and `--handler` argument in README.md and DESIGN.md; the window state under full screen in DESIGN.md's native window item; the tree checks tagged slow in README.md; the apps guide in DESIGN.md's file table; Open Presentation in the files-and-search guide; `deck-slides` in the closed writes.
2. Standards 1: DESIGN.md cites `ops.ts` for a move onto a taken name, the configuration guide's sections by the names they have ("The files of `config/`", "`local.yml`"), and README.md's opening section for the server's arguments.
3. Standards 2: the Keychain sentence with no holder dropped.
4. Standards 3: `src/lib/server/git/deposit-git.ts` cites DESIGN.md "Fixed git choices", rewrapped.
5. Standards 4: the double period, the space before a semicolon, and the doubled cites of `editor.ts`, `kit/theme.ts` and `oauth.ts`.
6. The audit item names the slide files of a project's `present/` deck in place of PRESENT.md.

## Verification

On the gate (`.agents/worktrees/gate`, main 3b02930a plus Q125 and the fixes):

```
npm run diagrams && npm run test:landing
ok      ASCII gate (2.2 s)
ok      npm run format:check (12.9 s): All matched files use Prettier code style!
ok      npm run lint (50.9 s)
ok      npm test (90.1 s)
ok      npm run test:checks (98.1 s)
FAILED  npm run check, then npm run build, then npm run test:slow (238.9 s): check "COMPLETED 3054 FILES 0 ERRORS", build green, test:slow 1 failed (start.test.ts, the default-port case, Z663)
cmp of the gate's and main's staged diffs over tools/oculus -> equal
```

## The look

On TEST at localhost:8790: the Help group of the Views catalogue lists Configuration, Source Control, Window, Views, Files and search and Terminals guides and Design after the hub's documents; the Views guide opened beside and drew its heading and first section, and was closed again.

## Agents

- Builder a53eac68600a643ef (claude-sonnet-5-5): hand-back 286,831 tokens, 65 tool uses, 16.5 min; final run 268,409 tokens, 689 tool uses, 122.6 min; round 1 222,683 tokens, 431 tool uses, 70.4 min; round 2 138,205 tokens, 417 tool uses, 72.0 min.
- Brief check a401d3fdf1183fba1 (claude-opus-5-5): 223,091 tokens, 83 tool uses, 12.3 min.
- Reviewer a592538c261dc0fa4 (claude-opus-5-5): 282,071 tokens, 92 tool uses, 14.4 min; over round 1 a87f63d952b088f27: 335,705 tokens, 104 tool uses, 18.4 min; over round 2 a1e3ba3e91c587de9: 141,356 tokens, 84 tool uses, 14.7 min.

The builder's first report did not pass its bar: two repair rounds, the second under the round cap's exception. Six fixes at landing, listed above.
