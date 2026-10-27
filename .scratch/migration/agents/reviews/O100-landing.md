# O100 landing

Position: the cockpit-to-oculus migration, step O100 (the Awaiting box's names underlined under the pointer) landed. Next: O98 is building; O99 waits for O98, then O97.

## Open items

None.

## Check of Steps 1

The runner's agent listing shows no agent of O100 left: only O98's builder a8cc0514e57924553 runs.

## NOT DONE

- The look did not see Blocked's count (the research hub draws no Blocked row) or a name after a mouse click alone; the review read both from the rules (red wins at (0,4,0) against (0,3,0); `:focus-visible` holds for keyboard focus only).

## What landed

The whole range from base 249bd5b57 (one wip commit 2f82490b1), 1 path, 24 insertions and 6 deletions, in `src/lib/views/boards/focus/Focus.svelte`:

- Each name of the Awaiting box that opens something sits in `<span class="wait-name">`, `display: inline-flex; min-width: 0`, the comma outside it.
- Under the pointer and with keyboard focus the name is underlined and drawn in the accent colour; at rest it keeps the box's colour.
- Blocked's count stays red and is underlined.
- A name with no press stays its words alone.

## Checks

In the gate worktree, `git cherry-pick -n 249bd5b57..migration-O100` applied with no conflict, and `npm run diagrams && npm run docs:palette && npm run test:quick` printed:

```
test:quick: 1 changed file(s), from git since HEAD
test:quick: 8 test file(s)
ok      prettier (1.9 s): All matched files use Prettier code style!
ok      ASCII gate (2.5 s)
ok      svelte-kit sync (2.5 s)
ok      svelte-check (23.7 s): 1793137558975 COMPLETED 551 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (29.3 s)
ok      vitest checks (43.3 s): Duration  35.08s (transform 16.62s, setup 0ms, import 44.33s, tests 43.06s, environment 2ms)
test:quick: 46.1 s; every command passed
```

On main the same range was cherry-picked, and `git diff --cached --binary` of main and the gate compared under `cmp`: same.

## The look, on 8790

- Focus, the Awaiting box: "Maryam Amir Haeri" (Waiting on) and "NWO Veni - The Self-Explaining Hospital" (Grants) under the pointer: underlined, in the accent colour, the comma before each plain.
- The pointer moved away: the box's colour, no underline.
- "BT-FNO" reached by Tab: the focus ring, the underline and the accent colour.
- The tab opened was closed after.

## Found

- The builder handed back item 4 of the brief before any change: `display: inline` does not carry an underline into the button's `inline-flex` tooltip box. Ruled in `agents/briefs/O100-cases.md`: the span is `inline-flex`, and the focus selector `:focus-visible` for ruling 524's "with keyboard focus".
- Review: S1 (the brief's size line said a small text step; the diff is 30 lines, so O100 was handled as a full step) and P1 (the report counted five classes where Svelte gives four; the conclusion holds), closed in the booking. Standards and Behaviour: none.

## Agents

- Builder a40dc274a49422bab (claude-opus-5-5): round 0 hand-back 113087 tokens, 18 tool uses, 3 min 12 s; build after the round-0 ruling 133033 tokens, 33 tool uses, 8 min 7 s. The first report was a round-0 hand-back, ruled. Fixes at landing: none.
- Brief check: none, booked as a small text step.
- Reviewer a05b13d9ea49f0a2b (claude-opus-5-5): 132016 tokens, 22 tool uses, 4 min 43 s.

## Next

O98's report, its review, its rounds and its landing with its look on 8790; then `/spec migration O99`, then O97.
