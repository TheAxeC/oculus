# O131 landing

Roadmap entry: the cockpit-to-oculus migration. Step O131, the editor holds a one-text `multi` value to its words (ruling 646). Next: O133 prepared again (rulings 648 and 652), O132 (ruling 647) and O136 (ruling 651), each now unblocked; O135 after O133.

## Open items

- None.

## Steps 1

The runner's agent listing showed no subagent running: the builder afbffb4d7fdb1701c, the brief check abd6789ecd2085c43, the reviewer a6d4eb65a0299f2eb and the reviewer over round 1 aca92485dd8b68b63 had each sent their completion notice.

## Not done

Nothing.

## What landed

O131 landed on main from base c0f69529b, the whole range (the builder's work, repair round 1 and the wip commit b142873b8) with the fix at landing, 6 paths, 125 insertions and 28 deletions:

- `src/lib/data/sources/config/catalog/schemas/options.ts`: `multiSchema` gives a multi that is not `joined` its words as one text or a list (`anyOf`, the text first, each with `enum`), one text or a list of texts while its words are not held or are none, and a `joined` multi the form the value rule reads. The head comment names each kind of value where the schema and the rule part, with no count.
- `src/lib/data/sources/config/catalog/value-rule.ts`: `JOINED_FORM`, the form of a `joined` multi's text, beside `FORM_PATTERNS`; `multiProblem` tests a `joined` text by it.
- `tests/data/sources/config/catalog/options-schema.test.ts`: describe 'the schema of a multi', eight rows.
- `docs/HELP.md:570`: "A value of a choice or a multi whose words oculus holds is completed from them, and a word outside them is marked."
- `docs/diagrams/writes.dot` and `writes.svg`: regenerated, one line number of `value-rule.ts`.

## Verification

In the gate worktree, `npm run diagrams && npm run docs:palette && npm run test:quick`, then the step's related tests:

```
ok      prettier (1.6 s): All matched files use Prettier code style!
ok      ASCII gate (1.8 s)
ok      svelte-kit sync (3.8 s)
ok      eslint (15.3 s)
ok      svelte-check (52.4 s): 1793722158589 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (68.1 s): Duration  49.94s (transform 91.41s, setup 0ms, import 137.35s, tests 31.66s, environment 6ms)
ok      vitest slow (76.2 s): Duration  57.96s (transform 24.90s, setup 0ms, import 35.66s, tests 28.88s, environment 1ms)
ok      vitest checks (87.5 s): Duration  69.09s (transform 23.85s, setup 0ms, import 54.00s, tests 150.89s, environment 4ms)
test:quick: 91.7 s; every command passed
 Test Files  5 passed (5)
      Tests  161 passed | 2 skipped (163)
```

The related tests were `options-schema.test.ts`, `config-folder.test.ts`, `options.test.ts`, `workspace-layer.test.ts` and `settings.test.ts`; the two skipped need `OCULUS_TEST_HUB`. The palette page was unchanged. The staged diffs of main and the gate are equal under `cmp` (exit 0). The verify list equals the page's commands. No A/B: the configuration names no bench.

## Fixes at landing

The builder's first report did not pass its bar: the review found two sentences of the head comment of `options.ts` false of the file, the HELP sentence unwritten and the hover bullet wrong, and the builder's divergence on a `joined` multi's spacing; repair round 1 closed them, with decision 4 reversed. The review over round 1 found no defect in a round item; its five findings are fixed at landing:

- Standards 1: the joined form was coded twice, as a split in `multiProblem` and as a pattern in `options.ts`. It is now one regular expression, `JOINED_FORM` in `value-rule.ts`, which `multiProblem` tests and `multiSchema` gives as its pattern. The old check and the form agree on ten texts (`''`, `dark`, `dark contrast`, ` dark`, `dark `, `dark  contrast`, a tab between two words, a newline between two words, one space, three words), run with `node --input-type=module` over `valueProblem`.
- Standards 2, Standards 3, Behaviour 1 and Behaviour 2: sentences of `agents/reviews/O131-report.md` rewritten to the end state; the joined class's mark and the order of the hover's values stated.

`agents/guarded.md` G13: the Code line names `multiSchema` and `JOINED_FORM`, the Test line describe 'the schema of a multi'.

Open item 651, found by the first review outside the step's part (a keyed family written in the wrong one of its two forms), was ruled (a) as step O136.

## The look

A scratch server on 8797 from the gate:

- lab's `.oculus/config.yml` with a category row `sort: nonsense`: the Problems tab shows one problem, "Value is not accepted. Valid values: "stage", "year", "title".".
- A workspace file `.oculus/workspaces/look.yml` whose theme row has `class: 'dark  contrast'`: one problem on line 7, "String does not match the pattern of "^$|^[^ ]+( [^ ]+)*$".".

No console error. The server is stopped and 8797 is free.

## Usage

- Builder afbffb4d7fdb1701c: first run 258918 tokens, 123 tool uses, 19 min 46 s; round 1 319416 tokens, 49 tool uses, 11 min 28 s.
- Brief check abd6789ecd2085c43: 232859 tokens, 68 tool uses, 10 min 42 s.
- Reviewer a6d4eb65a0299f2eb: 181562 tokens, 40 tool uses, 9 min 30 s.
- Reviewer over round 1 aca92485dd8b68b63: 175543 tokens, 37 tool uses, 8 min 3 s.

All served claude-opus-5-5.

## Next

/spec O133 again; /spec O132 and O136; O135 after O133.
