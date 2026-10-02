# M4 landing report

Position: oculus/migration, step M4 (the Present view's equations out of `tools/present`) landed. In flight: D35 (repair round 1), D24 (review running), X3a (building). Next: /spec Q88c, now that L4 has landed; D24's findings when its review is in.

## Open items

None. The "Open items" section of `orchestrator-state.md` holds no entry.

## Agents stopped

M4's builder (a27bea3380d71a12d) and its reviewers (a75e5398f951f4f92, a3c2d2206f5e1482f) had finished before the landing. `ListAgents`, run before `land.sh`, listed acf8c525dec67af39 (X3a), a3a67c98dc6835b4c (D35) and a2488867fcf7ea624 (D24's reviewer), none of them M4's.

## NOT DONE

- The cockpit deck `tools/present/present.html` was not looked at in a browser: the look runs only on TEST. Its rule `.eqcard mjx-container{max-width:100%;overflow-x:auto}` lets a formula wider than its column scroll, as the oculus card did before the fix below; whether a formula is cut there is not verified. The deck's 13 cards were checked in jsdom by the round's reviewer (13 typeset, no error).

## What landed

- The 13 `equation:` values of the hub's `PRESENT.md` files rewritten from an image name to the LaTeX of their `make_equations.py` entry.
- The image branch of the Present view removed: `Equation.svelte` draws the slide's LaTeX through KaTeX; an `equation:` that still names an image file is a finding (`findings.present.equation_image`) and draws no card.
- The cockpit deck (`tools/present/build.py`) typesets the same LaTeX with MathJax, the `\small` groups rewritten, the `boldsymbol` extension vendored, `make_equations.py` and the READMEs updated.
- `integrity.test.ts` counts the written equations from the parsed front matter.

On main: 42 files from the step's range, 341 insertions and 259 deletions (`git diff --cached --shortstat` after the cherry-pick), plus the fixes below.

## Fixes at landing

- `land.sh` stopped on conflicts in `Equation.svelte`, `type-scale.test.ts` and two diagram files. `Equation.svelte` and the `type-scale.test.ts` row took M4's side (Z238: M4's removal of the image and `.gap` rules wins; the markup holds neither); the diagrams were regenerated.
- Standards 1 of the run over round 1: the head comment of `tools/present/make_equations.py` now says what the script renders and that a slide's equation is changed in its `PRESENT.md`.
- Standards 2 of the run over round 1: the head comment of `tests/checks/config/integrity.test.ts` now says its last `describe` plants a `PRESENT.md` in a temporary directory and reads no hub data.
- Found in the look: every one of the 13 formulas was wider than its card in the 1280 by 720 slide frame (the HCCNet card 497 px, its formula 774 px), so the card scrolled and the end of the formula was cut off; the image it replaced was scaled to fit. `Equation.svelte` now draws the formula at the scale that fits the card (`equationScale` in `state/life/present.ts`, beside the frame's own `fit`, at least 0.5 of its size), measured again when the formula or the card's width changes. Its cases in `tests/state/life/present.test.ts` were red with the shrink taken out (`expected 1 to be 0.64`, `expected 1 to be 0.5`, 2 failed) and pass with it (3 passed).
- Behaviour 1 of the run over round 1: the sharp edges round 1 added are stated here. `mathjax_small` in `build.py` rewrites only `\text{\small ...}`, so a `\text{\footnotesize ...}`, a `\mbox{\small ...}` or a nested `\text{\small ...}` is drawn with the command as text in the cockpit deck; an `equation:` naming an image file that is not there is drawn in the deck as LaTeX of its name.

## Verification on main

The commands ran from `tools/oculus`. This was the fourth run of the list.

```
$ npm test
 Test Files  435 passed | 22 skipped (457)
      Tests  11444 passed | 621 skipped (12065)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  444 passed | 9 skipped (453)
$ npm run check
COMPLETED 2978 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

The earlier runs:
- Run 1 was stopped: it had started before the fit fix, so it did not cover the final tree.
- Run 2: `npm test` passed; `test:checks` red in `tests/checks/tree/audits.test.ts`, since the fit's first cases sat under `tests/views` and drew nothing. The arithmetic moved to `state/life/present.ts` and its cases to `tests/state/life/present.test.ts`.
- Run 3: one 5000 ms timeout in `tests/server/edit/config-key.test.ts`, which M4 does not change; alone it passed, `Tests 38 passed (38)`.

There was no A/B: the configuration has no `bench:` line.

## The look

On TEST (localhost:8790), main's tree with M4 staged, the Present view opened on TEST and stepped through its 23 slides by a script over the page:

| What | Seen |
|---|---|
| Slides with an equation card | 13 (slides 3 to 10 and 13 to 17), one card each |
| Each card | one KaTeX formula, no `.katex-error`, no image |
| Before the fit | every card scrolled sideways, the HCCNet formula cut after `PE(\Delta t_i,` |
| After the fit | every formula inside its card, at 0.50 to 0.85 em; slide 17 (the cirrhosis formula, the widest) whole at 0.5 |
| Console | no errors |

The Present tab was closed again, leaving TEST as it was.

The 13 equations were compared again on main: each `PRESENT.md`'s `present.equation`, parsed with `yaml.safe_load`, equals an entry of `make_equations.py`'s `EQS` (13 files, 0 without a match).

## Findings and their dispositions

The first run's findings (4 Spec, 2 Proof, 2 Standards, 4 Behaviour) were sent in repair round 1. The run over round 1 found 0 Spec, 0 Proof, 2 Standards and 1 Behaviour, each closed at landing as `agents/reviews/M4-refuter.md`'s Closed heading says and as listed above.

## Agents' usage

- Brief check: claude-sonnet-5-5, 207,699 tokens, 64 tool uses, 13.5 min.
- Builder (claude-sonnet-5-5, a27bea3380d71a12d): to the first-run hand-back 204,365 tokens, 72 tool uses, 17.5 min; from the round-0 ruling to the report 292,781 tokens, 57 tool uses, 58.8 min (3 full-list runs, the third passed); repair round 1 325,872 tokens, 27 tool uses, 39.4 min (2 full-list runs, the last passed).
- Reviewer, first run: claude-sonnet-5-5, 227,976 tokens, 69 tool uses, 37.9 min.
- Reviewer over round 1: claude-sonnet-5-5, 218,424 tokens, 60 tool uses, 37.7 min.

The builder's first report did not pass its bar: the review found 12 findings and a repair round was sent. Three fixes were made at landing (two head comments and the formula fit), besides the conflict resolution.
