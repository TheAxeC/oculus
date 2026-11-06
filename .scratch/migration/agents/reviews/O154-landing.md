# O154 landing

Position: roadmap entry "migration" (the oculus migration plan), step O154 of the queued O154 to O158 with O150 and O151, the project board's filter on the Present view. Next: /land O156 (one deck reader), then /spec O155.

Open items: none.

## The check of Steps 1

The builder acf1b0553e05d698a and both reviewers (a40ee61bf8428979b, a94ce92d3cbedacf9) had reported and finished before the landing; the runner's agent listing shows none of them running.

## NOT DONE

- Not looked at: Mine only narrowing a deck one of whose members is not the user's (every member of the portfolio deck is the user's in this hub), the reload wait (C11) and the audience window with the tab hidden (C17). They rest on reading and both reviews.

## What landed

O154 on main from base a6e95bf72, the whole range (wip commit df35dbb7b), 23 paths without renames:

- `boardFilter`, `BoardFilter` and `searchWords` in `src/lib/state/boards/board/filter-menu.ts`: the Projects board's filter chain as one pure function.
- `src/lib/views/shared/forms/bar/BoardBar.svelte`: the board's two bar lines as one component, drawn by `Projects.svelte` and by the Present view.
- `src/lib/state/life/present.ts` (`PresentBar`, `barFields`, `memberItems`, `shownKeys`) and `src/lib/views/academic/present/acts/filter.svelte.ts`: the Present bar runs over the member projects of the deck's groups of project decks, matched by key in the deck's own hub; the pane saves the bar fields at the top of its state and clears them on another deck.
- Removed: O147's `FILTER_FACETS`, `FILTER_GROUPS`, `FILTER_LAYOUT`, the "Filtered" line and its Clear, and 5 `present.yml` keys.
- `docs/decks.md`, `docs/HELP.md` and `docs/templates.md` say so.

## What was found

- The builder's first report did not pass its bar: the first review found the print-only programs `wrap.py` and `short.py`, and the review over round 1 six inline `python3` programs, all recorded under the standing ruling "Unapproved builder scripts" in the booking.
- Fixes at landing, three:
  - The report's quoted `base.test.ts` gains the `setCatalog` import and call.
  - The `filter-menu.ts:15-17` comment names the real cause of the import cycle.
  - From the look, `FilterBar.svelte`. In the Present pane at 357 px, the controls that never fold need 481 px, so the line clipped Mine only and More out of reach. The line now wraps in that case, with every group in More, and stays one line wherever they fit.

## Verification

In the gate worktree at a06f2cb35 with the range and the three fixes: `npm run diagrams && npm run docs:palette && npm run test:quick` printed "test:quick: 23 changed file(s)", "31 test file(s)", ok prettier, ASCII gate, svelte-kit sync, eslint, "svelte-check (13.2 s): ... 584 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS", vitest slow, vitest, vitest checks, "test:quick: 69.7 s; every command passed". `npm run build` exited 0. Main's staged diff equals the gate's under `cmp` (SAME, 23 files). Not covered: tests that reach no changed file within the import depth. No A/B (no `bench:`).

## The look (scratch server on 8797)

- C1: the portfolio deck's bar draws the board's two lines.
- C3: "hcc" gives "13 of 24 shown" and 15 of 22 slides.
- C22: o, f, p and a space typed into the search go into the field and move nothing on the deck.
- C20: a search no member matches gives "0 of 24 shown".
- C6: a slice pick gives "11 of 24 shown" with Clear all, and Clear all gives "24 projects".
- C8: a project deck draws no bar.
- C5:
  - With no person marked `self: true`, neither the board nor the Present bar draws Mine only or Role.
  - With a scratch `self`, the board draws Mine only pressed, and the Present bar draws it pressed and disabled, with Role in More.
- C14: after the wrap fix the Present line wraps, and the Projects board's line stays one line, 26 px high.
- The scratch files equal their backups and the server is stopped.

## Agents

- Builder acf1b0553e05d698a, claude-opus-5-5:
  - first run, which handed C13 back: 238149 tokens, 64 tool uses, 9.0 min;
  - build after the C13 ruling: 202544 tokens, 170 tool uses, 32.1 min;
  - round 1: 284901 tokens, 34 tool uses, 6.6 min.
- Brief check ab1987cb1fbaa184b, claude-opus-5-5: 220919 tokens, 68 tool uses, 12.6 min.
- Reviewer a40ee61bf8428979b, claude-opus-5-5: 269077 tokens, 74 tool uses, 16.5 min.
- Reviewer over round 1 a94ce92d3cbedacf9, claude-opus-5-5: 247816 tokens, 70 tool uses, 20.0 min.
