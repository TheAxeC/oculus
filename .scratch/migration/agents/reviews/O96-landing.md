# O96 landing

Position: the cockpit-to-oculus migration, step O96 (the cards' project strip: its filters and its groups by category) landed. Next: O95's landing; O98 is building; O99 waits for O98, then O97.

## Open items

None.

## Check of Steps 1

The runner's agent listing shows no agent of O96 left: only O98's builder a8cc0514e57924553 runs.

## NOT DONE

- The look did not open an "other" group: the research hub holds no project without a stage. The drawn case 17 of the round report covers the absent stage tag.
- The look did not open the People view's role strips or the Funding view's List mode.

## What landed

The whole range from base 909f79d53 (one wip commit 4d8577029 of the builder's work and its repair round 1), 23 paths, 601 insertions and 172 deletions:

- The project strip at a card's foot grouped by the rows of `categories:` in their order, then "other", each group's count, label and marker in its row's colour with no glyph; the warning mark on any group holding a blocked project; a stageless project under "other" with no stage tag.
- The Projects section in More of a collection bar whose cards draw a strip: Category, Stage, Form, Tier, Role (with a self marked) and Pillar; a pick narrows each card's strip, hides a card left empty, and the No funding card and slice count only the projects it leaves.
- `docs/HELP.md` lines 277, 296 and 301.

## Checks

In the gate worktree at main's head 50c52d13d, `git cherry-pick -n 909f79d53..migration-O96` applied with no conflict, and `npm run diagrams && npm run docs:palette && npm run test:quick` printed:

```
test:quick: 23 changed file(s), from git since HEAD
test:quick: 53 test file(s)
ok      prettier (2.2 s): All matched files use Prettier code style!
ok      ASCII gate (3.0 s)
ok      svelte-kit sync (6.9 s)
ok      eslint (111.5 s)
ok      svelte-check (126.9 s): 1793132985406 COMPLETED 551 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (155.2 s)
ok      vitest slow (156.8 s)
ok      vitest (165.2 s)
test:quick: 172.4 s; every command passed
```

The diagrams and the palette page were unchanged. On main the same range was cherry-picked, and `git diff --cached --binary` of main and the gate compared under `cmp`: same.

## The look, on 8790

- The Funding view, the FAIR card: the strip reads "3 in review", "1 in flight", "4 publications", each in its category's colour, no glyph.
- More: the PROJECTS heading, Category (in review 14, in flight 24, publications 11, other outputs 2, coloured dots), Stage and Form.
- Category "in flight": "1 of 11 shown", the FAIR card with "1 in flight", the No funding card with "23 in flight", the status slices counting 0 or 1. Clear all brings back 11 entries.

## Found

- First review: S1, T1, T2, B1 and B2, closed in repair round 1.
- Review over round 1: Spec 1, Proof 1, Proof 2 and Behaviour 1, closed as `agents/reviews/O96-refuter.md` "Closed" says; no fix at landing in code.
- Recorded under the ruling "Unapproved builder scripts": the builder rewrapped the two comment paragraphs of round 1 item 1 with a program its brief does not build; the paragraphs were read against the brief and kept.

## Agents

- Builder aa748bdc618193c9a (claude-opus-5-5): 155519 tokens, 229 tool uses, 46 min 1 s; round 1 194965 tokens, 35 tool uses, 10 min 40 s. The first report did not pass its bar (five findings sent back). Fixes at landing: none.
- Brief check ad36c99e52ba380ff (claude-opus-5-5): 234840 tokens, 61 tool uses, 8 min 47 s.
- Reviewer aba0d8dc3c0d0853c (claude-opus-5-5): 239441 tokens, 74 tool uses, 16 min 44 s.
- Reviewer over round 1 ab9cad60199933c85 (claude-opus-5-5): 206265 tokens, 39 tool uses, 5 min 51 s.

## Next

O95's landing, with its review's small findings fixed at landing and its look on 8790.
