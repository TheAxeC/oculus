# O130 landing

Roadmap entry: the cockpit-to-oculus migration. Step O130, every hub's category rows held to the config check. Next: O134, a Notes section in the templates page (ruling 649), then O131 once its review over round 1 is in, and O133 prepared again (rulings 648 and 652).

## Open items

- None.

## Steps 1

The runner's agent listing showed none of O130's agents running: the builder abbd7df1d818a8d10, the brief check a0194efcc505ed3c8 and the reviewer a982d30fcbb0915af had each sent their completion notice. The one subagent running is O131's reviewer over round 1.

## Not done

Nothing.

## What landed

O130 landed on main from base 1c312c834, the whole range (the builder's work and the wip commit e1257f9a0), 8 paths, 136 insertions and 31 deletions:

- `src/lib/data/index.ts`: `readOtherHub` runs `categoriesFindings` over a hub's merged config when that hub's `.oculus/config.yml` sets `categories`, each finding naming that file. A hub that sets no `categories` reads oculus's own rows, so the check is not run for it.
- `src/lib/data/sources/config/sections/boards.ts`: the head comment names the settings file of the hub that sets the rows.
- `tests/data/sources/config/boards.test.ts`: describe 'the category rows of a hub that is not the primary'.
- `docs/HELP.md`: one bullet, "The `categories` rows a hub writes are checked against that hub's own words, its stages and its forms, and each finding names the hub's `.oculus/config.yml`."
- `docs/diagrams/layer-data.dot`, `layer-data.svg`, `writes.dot`, `writes.svg`: regenerated.

## Verification

In the gate worktree, `npm run diagrams && npm run docs:palette && npm run test:quick`:

```
ok      prettier (1.0 s): All matched files use Prettier code style!
ok      ASCII gate (1.1 s)
ok      svelte-kit sync (2.6 s)
ok      eslint (13.9 s)
ok      svelte-check (42.7 s): 1793720783389 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (155.3 s): Duration  136.42s (transform 82.09s, setup 0ms, import 172.08s, tests 267.89s, environment 5ms)
ok      vitest (172.2 s): Duration  154.74s (transform 127.90s, setup 0ms, import 227.84s, tests 372.67s, environment 3.13s)
ok      vitest slow (319.7 s): Duration  302.02s (transform 43.70s, setup 0ms, import 167.12s, tests 1028.60s, environment 11ms)
test:quick: 322.6 s; every command passed
```

The diagrams and the palette page were unchanged by the gate's regeneration. The staged diffs of main and the gate are equal under `cmp` (exit 0); main's one commit after the gate's base, c31833fff, changes ledger files only. The verify list equals the page's commands. No A/B: the configuration names no bench.

## Fixes at landing

The review found no defect in the code or the documents, so no repair round was sent. Its four findings were in the builder's report and the look's expectation:

- Spec 1: the report's open items rewritten to the state file's list as it stands on main ("- None.").
- Proof 2: the report's clean-up count names the count over `$TMPDIR`, which prints 0.
- Standards 3 (a third start of `npm run test:quick`): no change; the builder states it, and the landing ran the whole list once on the gate.
- Behaviour 4: the report's before-and-after sentence says the Findings view names the file relative to its root with the whole path in the tooltip and draws no hub chip.

`agents/guarded.md` G124: the text holds the rows of `categories:` a hub writes to that hub's own words, stages and forms; the Code line names the run by `readOtherHub`; the Test line names the new describe.

The builder's first report passed its bar for the code and documents; three sentences of the report were fixed at landing.

## The look

A scratch server on 8797 from the gate, its HOME a scratch copy holding a second hub `lab` whose `.oculus/config.yml` writes `categories: [ { key: drafts, label: Drafts, stages: { words: [building] } } ]`. The Findings view, searched for "categories", shows one finding in the Files section: `.oculus/config.yml categories[7]` with "categories[7] names no color, so it is drawn in no colour". Its file name is relative to its root, its tooltip is the whole path of lab's `.oculus/config.yml`, and it draws no hub chip. No console error. The server is stopped and 8797 is free.

## Usage

- Builder abbd7df1d818a8d10: 179415 tokens, 77 tool uses, 21 min 16 s.
- Brief check a0194efcc505ed3c8: 190092 tokens, 54 tool uses, 7 min 42 s.
- Reviewer a982d30fcbb0915af: 190139 tokens, 69 tool uses, 15 min 32 s.

All served claude-opus-5-5.

## Next

O134's landing with its two review findings fixed at landing; O131's review over round 1, then its landing; /spec O133 again; /spec O132, now unblocked.
