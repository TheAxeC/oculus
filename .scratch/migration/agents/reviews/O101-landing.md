# O101 landing

Position: roadmap entry "migration (cockpit to oculus)"; step O101, the Zenodo deposit, landed; next step O104, one page frame and one editor.

## Open items

None. Axel ruled 594 (a), 595 (d) and 596 (a) on 2026-10-30.

## The check of Steps 1

`ListAgents` listed no subagent: the builder aeaae4397fb040109 and the reviewers ac5abbf263b3dd3e6 and a4ea25bfa861c816a had ended.

## Not done

- No press reached Zenodo: oculus has no `downloads` row `zenodo`, so both buttons are off. Publish, a new version, the draft read `is_published`, the `PUT .../draft` of a new version and `award.title` are checked against the fake alone.
- Cancel under the Zenodo section and a press's History record were not seen in the look, since each needs a press.
- `isReviewCopy` reads a creator by `name`, since Zenodo's record read gives no type, so "organizational" of ruling 595 (d) is not checked: a person named Anonymous with restricted files passes.
- A publish past 30 s whose draft still reads unpublished deletes the draft, and when neither the draft nor the record reads an unpublished draft stays on Zenodo; the sentence names the page.

## What landed

- oculus: the whole range ce8d41683..migration-O101, with the Doc text and the fixes at landing.
- The research hub: commit 6abb17c8b, the hub patch with `family: "Kerga"`, three paths.

## Verification on main

- `npm run diagrams`, `npm run docs:palette`: exit 0.
- The verify list, its last run: prettier, ASCII gate, svelte-kit sync, svelte-check (0 errors, 0 warnings), eslint, vitest checks, vitest and vitest slow ok; "test:quick: 299.1 s; every command passed"; "checks: 1 commands passed".
- Earlier runs on main were red on the missing package `fflate` (`npm install`), on two comment lines of the landing's fixes over the width, and on a stale eslint cache from before that install (`node_modules/.cache/eslint` removed).

## The look on 8790

- Deposit tab of `hccnet-revision`: the Zenodo section under the commit box, For review and Publish off, Status not deposited, DOI no DOI yet, Share link no share link yet, and the off sentence naming the downloads row.
- The manifest form, Deposit & compute: Anonymize with Add to Anonymize, a row of Term, As and Remove; the Review link read-only; Zenodo status a select. The added row was reverted and the manifest is unchanged (`git status`).
- Settings, Primary hub, filter zenodo: 4 settings; Address with its default `https://zenodo.org/api`, Timeout s, the `auth` rows editor with row, required, help and Add.

## Found at landing

- `versions/latest` on real Zenodo answers 301, which every new version would have failed on; found by a read of a public record, fixed with `client.latest`.
- The findings of the review over round 1, under Closed in `agents/reviews/O101-refuter.md`.

## Agents

- Brief check ac906874df316b771 (claude-opus-5-5): 246818 tokens, 102 tool uses, 13 min.
- Builder aeaae4397fb040109 (claude-opus-5-5): 292695 tokens, 720 tool uses, 84 min 55 s; round 1 325489 tokens, 192 tool uses, 44 min 30 s.
- Reviewer ac5abbf263b3dd3e6 (claude-opus-5-5): 330342 tokens, 77 tool uses, 14 min 19 s.
- Reviewer over round 1 a4ea25bfa861c816a (claude-opus-5-5): 356966 tokens, 50 tool uses, 15 min 34 s.

The builder's first report did not pass its bar: its findings went back in repair round 1 (13 items).

## Next

`/spec migration O104`, with the section names of ruling 594 (a).
