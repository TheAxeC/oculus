# O106 landing

Position: roadmap entry "migration (cockpit to oculus)"; step O106, cards and the entry page show what a reader needs, landed; no step is left unticked in `plan.md`. Next: the release `1.0.0`.

## Open items

None.

## The check of Steps 1

The builder adf8935850262b509 and the reviewers a9ef6e624f674e5a8 and abbb6b69650985cf8 had ended before the worktree was committed.

## Not done

- Not looked at: an Events entry page, and a long value wrapping in the new `.values` column.
- After the fix at landing, a Website `open` list with no declared sub-fields and a `type: raw` Website row holding a list still draw on neither card nor page. No hub row is of either kind.

## What landed

- oculus: the whole range c18dc9126..migration-O106, 11 paths, with one fix at landing.
- The research hub, commit aa8f2d669: 27 labels in three files, `min` removed from `funding.yml` and four manifests.
- The website, commit a885f2d: `min` out of three templates, `is_minimal` out of the generator, `_data/data.yml` and `cv.pdf` written by the press.

## Fix at landing

B2 and B3 of the review over round 1: `groupRow` in `src/lib/state/boards/collection/index.ts` now tests `personSubField` and falls through to the row `drawnRow` gives when no item has words.

## Verification

In the gate worktree on top of O105: `npm run diagrams && npm run docs:palette && npm run test:quick`: "test:quick: 143.0 s; every command passed". The diff staged on main equals the gate's (0 lines). It covers no test that reaches no changed file within the import depth, other than the source and tree checks, no build, and no lint of unchanged files.

## The look, on 8790

- Audit before the second press: one finding, `_data/data.yml` differs first at `projects.content.0.min`. After it `_data/data.yml` holds 0 lines with `min:`.
- Funding cards and Education and Events cards: no Website field. FL4PHM's page: a Website group with CV section, CV place, CV title, CV role, CV period, CV text and Hidden on the CV, Yes; no short-CV row.
- A supervision entry: students as person controls on the card; on the page each with topic and degree; the Website group after them.
- Brecht Heeren's person page opens from the control. The file opened once shows the labels.

## Agents

- Brief check aff22675846d114fb, claude-opus-5-5: 200429 tokens, 18 tool uses, 462 s.
- Builder adf8935850262b509, claude-opus-5-5: 253817 tokens, 130 tool uses, 2546 s; round 1: 326828 tokens, 64 tool uses, 560 s.
- Reviewer a9ef6e624f674e5a8, claude-opus-5-5: 198813 tokens, 23 tool uses, 749 s.
- Reviewer over round 1 abbb6b69650985cf8, claude-opus-5-5: 192099 tokens, 23 tool uses, 488 s.

The first report did not pass its bar (repair round 1). One fix at landing, named above.
