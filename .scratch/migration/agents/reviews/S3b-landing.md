# S3b landing

Position: roadmap entry oculus/migration (the cockpit-to-oculus migration); S3b, the `config-key` write, landed; 248 of the 299 package lines of `plan.md` are ticked (`sed -n 5,454p plan.md | grep -c '^- '` and `grep -c '^- ✅'`). Next: /land Q109; /spec Q85a2 and Q85a4 into the free slots; U2's builder after Q109's landing look.

## Open items (verbatim)

- Z138 (raised 2026-10-01 03:36, step X3d, its builder's open item A). Your ruling of 2026-09-25 says Seti's own table and colours, and X3d's round-0 ruling 4 draws them as `--seti-*` tokens set to `seti-ui`'s `ui-variables.less` values in every theme. Its premise that one set serves every theme is wrong: VS Code's Seti theme carries a `light` set (238 extension, 98 filename and 82 language entries; the default file icon `#d4d7d6` dark, `#bfc2c1` light), and on oculus's light panel Seti's own colours measure a contrast of 1.45 for white, 1.73 for yellow (every `.json`) and 2.13 for green (the builder's report, `agents/reviews/X3d-report.md`). (1) Keep Seti's colours in every theme. For: your ruling's words exactly. Against: icons on the light themes are hard to see, `.json` worst. (2) Copy VS Code's light values. For: what VS Code shows. Against: breaks the brief's rule that no VS Code hex is copied. (3) Keep Seti's values on the dark themes and set each `--seti-*` token on the light themes to a darker value derived from the same colour in `themes/derive.ts`, as other light tokens are derived. For: Seti's colours where they were made for, readable icons everywhere, no copied hex. Against: the light theme's icon colours are oculus's, not Seti's. Recommendation: (3). The lazy option is (1). What waits: only the light-theme colours of X3d's icons. X3d landed at 06:19 with Seti's colours in every theme, as (1) reads; a ruling of (3) or (2) is a change on top of it, folded into U2's fixes or the next step that touches `themes/`.

## Not done

Nothing inside the brief. No look: no view sends a `config-key` write until S3c's Settings editor, and the one reader-visible string the step changes (History's sentence for an undo whose file cannot be written) is checked by `tests/views/system/history.test.ts`; forcing it on TEST would mean making a configuration file of the hub unreadable. `bench: []`, so no A/B.

## The check of Steps 1

The runner's agent listing (ListAgents, 06:19) showed one subagent running, Q109's reviewer a656c8c3d8e744fab, which has since finished. S3b's builder a0416efd8565aca13 and its reviewers ab5621edb5c166992 and ac4fce0c8fc2f70c7 were not listed.

## What landed

From base 41177dcf, 30 paths staged by the cherry-pick (2201 insertions, 570 deletions; `git diff --cached --shortstat`), plus the fixes at landing below. `DESIGN.md`, `HELP.md` and two diagram files auto-merged; `npm run diagrams` on main changed nothing.

- `src/lib/server/edit/writes/config-key.ts`: one key of a tracked config file set in place with its comments kept, refused for `local.yml`, a key with no catalog entry, a family, a list or a map, a value of the wrong type, and a value a reader of the configuration refuses.
- The write route's `config-key` body (`bodies.ts`), the write answers and the undo (`undo.ts`), the client's `writeConfigKey` and the History view's word "setting".
- The undo of a rail or deck change whose file cannot be written answers `500 unwritable`, as the write does.
- The write diagram's tool parts arrows that run along each other and draws no arrow for a local named like an import.

## Verification on main

```
$ npm run diagrams          exit 0
$ sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md
$ npm test
 Test Files  371 passed | 20 skipped (391)
      Tests  5825 passed | 579 skipped (6404)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  442 passed | 9 skipped (451)
$ npm run check
COMPLETED 2520 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

## Fixes at landing

The six findings of the run over repair round 1, each small and inside the brief:

1. Standards 1: three line citations in `DESIGN.md` the step made false now read `server/edit/writes.ts:89-90`, `writes/undo.ts:188` and `writes.svelte.ts:430-431`, recomputed after X3d's landing.
2. Spec 1: `tests/routes/edit/write.test.ts`'s malformed `config-key` body runs against `configTarget()`, never the checkout's engine.
3. Proof 1: the report's `HELP.md:256` row now gives the base's state as the Before column.
4. Behaviour 1: the History view words the undo answer `unwritable` with a sentence of its own, "The file cannot be written, so the earlier value was not put back." (`history.yml`, `sentenceFor` in `views/system/history/rows.ts`); the history test's word list holds it, and failed first (`expected { undone: false, ... } to deeply equal { undone: false, said: undefined }`).
5. Behaviour 2: an undo whose file can no longer be read (mode 000) answered `404 gone`. `configKeyNow`, `deckNow` and `railNow` throw on a permission error, and `undoChange` reads the current value inside its catch, so the undo answers `500 unwritable`. Two route tests in `tests/routes/edit/undo.test.ts` (a setting; a deck and a rail list) failed first with `expected 404 to be 500`.
6. Behaviour 3: the write diagram's locals are read from the body's syntax tree (`localsOf` in `utils/diagrams/writes.mjs`), so a destructured local and a parameter named like an import draw no arrow; four cases in `tests/checks/diagrams/diagrams.test.ts` failed first.

## Agents' usage

- Brief check: claude-opus-5-5, 216,498 tokens, 75 tool uses, 11.0 min.
- Builder a0416efd8565aca13 (claude-sonnet-5-5):

  | Run | Tokens | Tool uses | Time |
  |---|---|---|---|
  | First run, handed back at case 4 | 317,363 | 67 | 11.3 min |
  | After the round-0 ruling | 183,610 | 147 | 47.9 min |
  | Repair round 1 | 350,291 | 76 | 34.4 min |

- Reviewers (claude-opus-5-5):

  | Run | Reviewer | Tokens | Tool uses | Time |
  |---|---|---|---|---|
  | First review | ab5621edb5c166992 | 250,936 | 69 | 19.5 min |
  | Over round 1 | ac4fce0c8fc2f70c7 | 265,107 | 61 | 16.7 min |

- The bar: the builder's first report did not pass it. A round-0 ruling on case 4, one repair round of ten rulings, six fixes at landing.
