# O120 report, a card takes no height for its controls, and Career has colour

Everything in the brief is done, with the two cases ruled in `briefs/O120-cases.md` built as ruled. What only a page shows is proved at the look on landing, as the spec says for a builder.

## Open items of the state file, verbatim

`sed -n 165,170p .scratch/migration/orchestrator-state.md` in the worktree prints the heading and one paragraph, and no entry:

> ## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)
>
> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

## The cases' first run

The first run was taken on the unchanged tree, by reading, before any change. "Then" is the unchanged tree. "Now" is the built code, also by reading; a builder opens no page, so each row's on-screen proof is the look on landing.

| # | Case | Reading | Then | Now |
|---|---|---|---|---|
| 1 | Career card with no Tag, under the pointer | `CareerCard.svelte` `meta`, `RecordCard.svelte` meta snippet, `Card.svelte` `--card-at-rest` | The row is empty at rest and one control high on hover, so the card jumps | The row holds only `data-card-control` children and lies over the corner; height unchanged |
| 2 | Career card off the CV, with its Tag | The Tag is a child of `.meta`; `.actions` margin-block | In the flow, no jump | The same |
| 3 | Narrow card, title reaches the corner | `measure` in `CardActions.svelte`, `actionPlace` and `fitActions` in `card-layout.ts` | Row in the flow | The row's box is the face's content box, `others` is the opener, `lineGap` reads 0 from the page, and the strip gives way to More; title height unaffected, control solid on `--card` |
| 4 | `ontitle`, no chip | `Card.svelte` title button | Row in the flow | Row has `pointer-events: none`, a control `auto`, so the words stay pressable under the empty part |
| 5 | No action, no chip | `Card.svelte` `{#if meta}` | Blank 6px | Nothing drawn and no blank row on every screen: `.meta:not(:has(> *))` has `margin-top: 0` outside the media query (ruling 1) |
| 6 | Screen that does not hover | `Card.svelte` `@media (hover: none)` | Controls at rest, in the flow | The same: the row rule stands under `@media (hover: hover)` only |
| 7 | Clipped card | `measure` lines reading `seen` and `start`, `.actions.start` | Strip at the line's start | `start` is true, strip then opener at the line's start on `--card`; card height unchanged |
| 8 | Right-click on the empty part of the row | `ContextMenu.svelte` `pointed` on its wrapper | The card's menu | The event lands on what is under the row and reaches the same wrapper |
| 9 | Empty title, no lines | `career-view.ts` `cardOf`, `Card.svelte` `.body` | The row grows the card | `.card.fill` draws past its edge, the control stays reachable, nothing moves. `.body` is always drawn with its 8px margin, so the card is about 26px high and the control reaches about its foot (not measured) |
| 10 | Menu from "..." | `Menu.svelte` head comment, Portal on the body, `Card.svelte` `.card:has(...)` | Stays by the opener | The same: the list is on the body and the opener stays drawn while it is open |
| 11 | Keyboard cursor, and Tab into the card | `Card.svelte` `.card[data-cursor]` and `:focus-within`, `workbench-keys.svelte.ts` `cards` | Height changes; a Career card never held `data-cursor` | Controls draw and nothing moves, on a Career card too (ruling 2) |
| 12 | Kind that draws a chip | The 19 `{#snippet meta()}` | Row in the flow | The same: a child other than a control keeps the row in the flow |
| 13 | A `Card` inside a `Card` | `.card` sets `--card-at-rest`, the rule's child combinator, `.face` relative per card | Each answers for itself | The same |
| 14 | Usage card | `Usage.svelte:193-194`: the Tag is always drawn | In the flow | The same |
| 15 | Wallpaper theme and rice theme | `grep -- "--card:"` over `tokens.css` and `rice/*.css` gives 29 lines, all opaque 6-digit hex | Controls paint nothing | `background: var(--card)` on the control's box only, solid in all 29 blocks |
| 16 | Career view hues | Brief's count command in `src/lib/themes` prints 29 for blue, violet, gold, teal, indigo and pink | No bars | Strategy card and each list carry their bar, each list one hue |
| 17 | Career file with no `positions` | `career-view.ts` `groupOf`, `Career.svelte` `group.cards.length === 0` | Empty line, no card | The same; the group's `tone` is carried and unused |

### The ruling carried

The first run handed back two cases. `briefs/O120-cases.md` ruled both, and both are built:

1. Case 5 and decision 6 hold on every screen. `Card.svelte` has `.meta:not(:has(> *)) { margin-top: 0; }` outside the media query, and its comment says a bare-text row would lose its margin and that no snippet draws one. Leaving the blank 6px was the lazy option.
2. `Career.svelte` reads `cardCursor(instance.state)` as Inbox does (`Inbox.svelte:64,82`). `CareerCard.svelte` takes a `cursor` prop in place of `cursor={false}`, and the strategy card and each row pass `cursor === id`. Taking the read on the dataset card alone was the lazy option. Person, Entry and Post keep `cursor={false}`, outside this step by the ruling.

Brief check 3 runs as `grep -rn`, and `npm run build` is not run, both by the ruling.

## DONE / NOT DONE

| Deliverable | State | Proof |
|---|---|---|
| Item 1, the meta row takes no height | DONE | `npm run test:quick`: `test:quick: 39.7 s; every command passed`; `svelte-check (8.3 s): ... 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`. On screen: the look |
| Item 2, a row with something drawn stays | DONE | Same run; read in `Card.svelte:283` (a child other than a control fails the rule). On screen: the look |
| Item 3, hovering moves nothing | DONE | Same run. The read of the height is the look, named below |
| Item 4, Career's colours | DONE | Same run; `grep -rn "STRATEGY_TONE"` shows `career-view.ts:32` and `Career.svelte:171`. On screen: the look |
| Item 5, comments and pages | DONE | Same run; the list of re-read comments and pages below |
| Ruling 1 | DONE | `Card.svelte` `.meta:not(:has(> *))`. On screen: the look with hover emulated off |
| Ruling 2 | DONE | `Career.svelte:68,169,196`, `CareerCard.svelte`. On screen: the look |
| Check 1, `npm run test:quick` | DONE | The lines it printed: `ok prettier (0.6 s)`, `ok ASCII gate (0.8 s)`, `ok svelte-kit sync (2.0 s)`, `ok svelte-check (8.3 s)`, `ok eslint (8.7 s)`, `ok vitest (12.6 s)`, `ok vitest checks (37.6 s)`, `test:quick: 39.7 s; every command passed` |
| Check 2, ASCII over the changed files | DONE | `LC_ALL=C grep -n '[^ -~]'` over the six source files and `docs/HELP.md` printed nothing, exit 1 |
| Check 3, the old attribute is gone | DONE | `grep -rn "data-card-actions" src tests` printed nothing, exit 1 |
| Check 4, config unchanged | DONE | `git diff --stat -- config` printed nothing |
| Check 5, no test added or changed | DONE | `git status --short` lists nothing under `tests`; `diff -rq ../O120-base/tests tests` printed nothing |
| Check 6, sentences read against the standard | DONE | Each added comment and HELP sentence read against `agents/spec.md`; no departure |

The run does not cover what it prints as not covered: tests that reach no changed file within the import depth, other than the checks under `tests/checks/source` and `tests/checks/tree`; the build; the lint of unchanged files.

The compiled form of the rule is not seen in this step. `svelte-check` reports no warning, and I read `node_modules/svelte/src/compiler/phases/2-analyze/css/css-prune.js:543` and `3-transform/css/index.js`, which leave the contents of `:not` unscoped. The look confirms the rule matches a row of controls and leaves a row with a chip in the flow.

## Terms

None. `ls docs` shows no `docs/glossary.md`, so the diff adds, changes and uses no term of it.

## Files with line counts

Made from `diff -rq` against the base copy, plus `git status --short` for `docs`, which the base copy does not hold. Lines are `wc -l` after the last change; added and removed are `git diff --numstat`.

| File | Lines | Added | Removed | In the write list |
|---|---|---|---|---|
| `src/lib/ui/frame/Card.svelte` | 331 | 45 | 2 | yes |
| `src/lib/views/shared/card/record/CardActions.svelte` | 221 | 11 | 8 | yes |
| `src/lib/views/shared/card/record/RecordCard.svelte` | 364 | 4 | 2 | yes |
| `src/lib/views/academic/career/Career.svelte` | 219 | 17 | 4 | yes |
| `src/lib/views/academic/career/CareerCard.svelte` | 94 | 10 | 3 | yes |
| `src/lib/state/forms/career-view.ts` | 121 | 23 | 12 | yes |
| `docs/HELP.md` | 615 | 2 | 2 | yes |
| `docs/diagrams/layer-views.dot`, `.svg` | n/a | 1 each | 1 each | no |
| `docs/diagrams/layers.dot`, `.svg` | n/a | 1 each | 1 each | no |
| `.scratch/migration/agents/reviews/O120-report.md` | this file | new | | yes |

The four diagram files are outside the write list. `npm run diagrams`, which the spec requires before the list, rewrote them because `Career.svelte` gained an import: the count from `views/academic` to `state` goes from 73 to 74, and from `views` to `state` from 1534 to 1535. They are needed so the committed diagrams match the source.

`.scratch/migration/agents/briefs/O120-cases.md` is untracked and is the orchestrator's; I did not write it.

## Judgment calls the brief left open

Each may be reversed.

1. `CareerCard`'s `cursor` and `tone` are required props, since each of its two callers passes both.
2. Item 1 says "one rule"; the build has two blocks with one selector head, one for the row and one for a control in it, because `pointer-events` and the paint belong to different elements.
3. `pointer-events: none` is in the row's block under the media query, so a row in the flow is untouched.
4. The hue names in `career-view.ts` are typed `string`, as `Card`'s and `RecordCard`'s `tone` are.
5. Beyond the brief's sentence on each list's colour, `docs/HELP.md`'s Career paragraph gains one sentence on the keyboard cursor, for ruling 2.
6. `docs/HELP.md` says the strategy card and each list have their own colour, and names it as the bar down the card's left edge.

## Before and after, for the look

Internal details chosen freely: the comment on `.face`, the order of the rules in the style block.

- **Any record card with no chip (a dataset with no access, a Career card with no Tag).** Before: the card grows under the pointer and every card below moves. After: strip and "..." stand at the top right, the height does not change. Read `article.card`'s `getBoundingClientRect().height` at rest, under the pointer, with focus inside, with the menu open and under the keyboard cursor, on a dataset card with no access and on a Career card; all five must match on each card. Compared with the base, the card is 6px shorter at rest, the one height change expected.
- **Same cards, long title in a narrow pane.** After: the controls stand on the card's colour over the title's end, the words do not run through them, and the strip gives way to More as `measure` decides.
- **Clipped card.** After: the controls go to the start of the visible line, over the title's first words.
- **Strip and opener.** Before: 6px apart. After, on a row laid over the card: touching, gap 0, as item 1 says.
- **A title under the empty part of the row.** After: it underlines and presses. A right-click there opens the card's menu.
- **A card with an empty title and no lines.** After: the control is reachable and nothing moves.
- **Wallpaper theme and a rice theme.** After: the control's box is solid `--card`, nothing else painted.
- **A card with a chip, the Usage card, a Career card with the off-CV Tag.** Unchanged.
- **Hover emulated off (a screen that does not hover).** A card with controls keeps its row in the flow. A card with no action and no chip has no blank 6px. Gallery's plain `Card` with no chips shows the same on any screen.
- **Career view.** Before: no bars. After: strategy indigo, positions blue, degrees violet, awards gold, references teal, profiles pink, each list one hue, in a light, a dark and a rice theme.
- **Career view, keyboard.** Before: j and k moved a cursor that drew nothing. After: the card under the cursor draws its accent outline and its controls. Enter on a Career card still does nothing, since `activateCursor` in `key-dom.ts` finds no title button there; the step does not change that.

## Anything in the brief that was wrong or impossible

- Case 5 against the media query rule, and case 11 on a Career card: handed back at the first run and ruled, above.
- Case 9 says the control draws past the foot. By reading, `.body` is always drawn, so the card is about 26px high and the control reaches about its foot. The case's result holds (not measured).
- `docs/glossary.md`, which the report shape names, does not exist.
- Brief check 3 was written as `git grep`, which spec line 33 does not allow a builder; it ran as `grep -rn`, by the ruling.
- The premise that Svelte compiles the selector with no warning holds as `svelte-check`'s 0 warnings. The compiled text itself goes to the look.

## Limitations

- Decision 2 stands as the brief took it: a kind whose `meta` drew an empty wrapper would keep the jump. No snippet of the 19 does.
- An empty-title card that is last in a scrolled pane could add a few pixels of scrollable overflow under the pointer (not measured; the control reaches about the card's foot).
- Person, Entry and Post cards keep `cursor={false}`, outside this step by the ruling.

## Spec's lists

**Grep of added comment lines and titles.** `git diff -U0 -- src | grep -E '^\+' | grep -nEi "before|used to|no longer|still|always ha|as before|previously|the step adds|after this package|O[0-9]+|20[0-9][0-9]-"` printed nothing, exit 1, so no hit to judge. No test title was added.

**Name carried across the tree.** `grep -rn "data-card-actions" src tests` prints nothing; `grep -rn "data-card-control" src tests docs` prints `Card.svelte:16,283,293`, `RecordCard.svelte:14,289`, `CardActions.svelte:19,152`.

**Helpers reused.** `cardCursor` from `state/workbench/layout/instance`; `grep -rn "STRATEGY_TONE\|cardCursor" src/lib/views/academic src/lib/state/forms` shows the new use beside `Present.svelte:81,186`. No helper, type or schema was written.

**Unused exports.** `sh utils/unused-exports.sh` compared with `.agents/worktrees/O120-base/unused-exports.txt` by `diff`: no line added, exit 0.

**Ids and keys.** The step adds one attribute with no value and no id. `cursor === id`: a null cursor equals no id; `CAREER` is `'career'` and a row's id is `<list>:<at>` or `profiles:<name>`, so they cannot collide. No asynchronous path was added.

**Tests.** The step adds and changes no test, so there is no failing line to quote and no edit to an assertion, allow list or predicate. `tests/data/sources/career.test.ts` ran alone: 28 passed.

**Re-read after the change.**

| Text | State |
|---|---|
| `Card.svelte` head comment and the `--card-at-rest` comment | rewritten |
| `RecordCard.svelte` head comment | rewritten |
| `CardActions.svelte` head comment | rewritten |
| `Career.svelte` head comment | rewritten |
| `CareerCard.svelte` head comment | rewritten |
| `career-view.ts` head comment, `CareerGroup`, `GROUPS` doc comments | rewritten |
| `RecordCard.svelte` comment on `.menu` | still true |
| `CardActions.svelte` comment on `.actions` | still true |
| `Usage.svelte` comment on the refresh control | still true |
| `docs/HELP.md:301` and `:347` | rewritten |
| `docs/data-map.md` on the career file | still true: no colour key |
| `docs/palette.md`, `docs/apps.md` | still true: neither describes the card's row |

**Scripts and libraries.** No script was written, no case-run program, no dependency added, and no library found that covers the work.

## Full-list runs

Two runs of `npm run test:quick`, each right after `npm run diagrams`. The first was red on prettier (`Career.svelte`) and `tests/checks/source/comment-width.test.ts` (three comment lines of `Card.svelte` at 101 columns), both in a file the step changes. Both were fixed, the width check rerun alone (2 passed), and the list run once more, green. No whole-suite command was run.
