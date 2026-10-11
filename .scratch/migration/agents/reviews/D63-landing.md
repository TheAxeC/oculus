# D63 landing

Position: oculus/migration, step D63 (apps in the shell). Next: D68 (workspaces as files) and D69 (two clipping defects) prepared side by side; then D64, Q72, O33.

## Open items

None.

## Check of Steps 1

The builder ad834ceece00db11d, the brief check a9f32751f0ea11e48 and both reviewers (a3efd9c3f0ad5126e, ae76194b51d73c87d) had completed before the cherry-pick; the runner's agent listing at the commit shows no subagent running.

## NOT DONE

Nothing of the step. The status item's full strength through the new `inert` flag of the button primitive is checked by reading and by `npm run check` and the tree checks; the look saw the same rule drawn through a style in the status bar before the rule moved into the primitive.

## What landed

D63's whole range from base e38d174ef, merged with D67's landing, and the fixes at landing: 322 paths, +18,242 -4,124 against main, the ledger left out, in the commit "Land D63, apps in the shell".

- An app's `app.yml` declares commands, keybindings, menu entries, status bar items, view containers and views in the side bar and the panel, tree views, webview panels, custom editors, settings, colour themes and file icon themes; its host or frame drives quick pick, input box, notifications, progress and its tree and status items through the `vscode`-shaped API (`docs/apps.md`).
- The private folders (`~/.oculus`, each hub's `secrets`, the folder of the state `local.yml`) are closed to every app (G77 in `agents/guarded.md`).
- An app's key that oculus takes is refused with a finding, the taken keys read from the code that binds them (`src/lib/data/helpers/keys/`).
- `oculus.file-icons` answers `closed` to apps, since it writes configuration.

## What was found

- Corrections of the builder's report, made in the booking: on macOS `ctrl+shift+m` is taken by the editor, before and after the step; the ui row's ALLOWED entry for `state/shared/words/appearance` came with the first build.
- Behaviour the report did not state, now in the booking: the keys the step adds as taken (`shift+escape`, `shift+enter`, `shift+` with an arrow, `ctrl+alt+1` to `9`; `ctrl+shift+k`, `cmd+shift+k`, `ctrl+alt+k`, `cmd+alt+k`, `ctrl+cmd+k`).
- Seven defects the look found, fixed at landing: an unknown `$(name)` drawn as written; a status item with no command and a window progress that cannot be cancelled drawn at full strength; a tree row's inline entry drawn with its icon; a tree row's command called with the row's element, elements among its arguments passed as elements (three new rows in `runner-shell.test.ts`, failing without the fix); a command of a stopped program answered with a notice and Restart (one new row in `shell.test.ts`, failing without the fix); an `editor/context` entry of group `navigation` at the top of the editor's menu; the quick pick's count and ticks redrawn, and its input spanning the box.
- Two defects in code D63 does not change, booked as step D69 (Z819, automode, `choices.md`): the source editor's right-click menu is cut off at the pane's right and bottom edges, and the status bar's left group cuts an item mid-word when crowded.
- On the scratch server only, the Seti icons drew as squares because vite refused the font files of the linked `node_modules`; not a defect of the step.

## The look

On a scratch oculus on port 8796 over a copy of the gate tree with two scratch apps, Axel's server and the TEST page untouched. Cases 12, 13, 14, 15, 22, 23, 25 and 27 met, each with what was seen in the booking under D63 in `plan.md`. Main's `config/appearance.yml` was unchanged after the look (`shasum` 7e80739e0ea1342047b4d4e4ce3a65dacaa62904).

## Verification

In the gate worktree at main's head with the step and the fixes, `npm run diagrams && npm run test:landing`:

```
ok      ASCII gate (1.0 s)
ok      npm run lint (13.7 s): > eslint . --cache --cache-location node_modules/.cache/eslint/
ok      npm run format:check (32.3 s): All matched files use Prettier code style!
ok      npm test (139.2 s): Duration  133.99s (transform 46.76s, setup 0ms, import 358.55s, tests 136.50s, environment 181ms)
ok      npm run check, then npm run build, then npm run test:slow (282.4 s): Duration  177.87s (transform 28.48s, setup 0ms, import 234.83s, tests 380.75s, environment 132ms)
ok      npm run test:checks (378.0 s): Duration  373.37s (transform 56.59s, setup 0ms, import 106.82s, tests 501.37s, environment 5ms)
exit 0
```

Main's staged change equals the gate's: `git diff --cached --binary` on main and `git diff HEAD --binary` in the gate, the ledger left out, both `shasum` cbda5a91739c2fd645bbf9782f4512857acec670. No A/B: the configuration names no bench.

## Agents

| Agent | Role | Model | Tokens | Tool uses | Minutes | Findings (Spec, Proof, Standards, Behaviour) |
|---|---|---|---|---|---|---|
| ad834ceece00db11d | builder | claude-sonnet-5-5 | 211,578 + round 1 97,985 | 330 + 219 | 114.1 + 72.0 | |
| a9f32751f0ea11e48 | brief check | claude-opus-5-5 | 333,908 | 108 | 15.8 | |
| a3efd9c3f0ad5126e | reviewer | claude-opus-5-5 | 255,070 | 155 | 30.1 | 5, 5, 4, 4 |
| ae76194b51d73c87d | reviewer over round 1 | claude-opus-5-5 | 72,718 | 116 | 24.2 | 3, 5, 7, 2 |

The builder's first report did not pass its bar: one repair round. Full runs of the quick verify list, from the builder's report: three in the first build and three in the round, as the brief asked (`agents/reviews/D63-report.md`). Fixes at landing: 19, listed in the booking.
