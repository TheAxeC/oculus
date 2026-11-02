# Step O120 refuter report (on /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O120, base 1374be572)

Two findings, both false comments, both small enough to fix at landing. No behaviour defect, red check or unbuilt item was found. Item 5 is violated by Standards 1. Everything that needs a rendered page is under "Declined to judge" and goes to the look.

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

## Verification (rerun by the reviewer)

```
$ PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH npm run test:quick -- --base 1374be572
test:quick: 13 changed file(s), from git since 1374be572
test:quick: 10 test file(s)
ok      prettier (0.9 s): All matched files use Prettier code style!
ok      ASCII gate (1.0 s)
ok      svelte-kit sync (2.6 s)
ok      eslint (2.7 s)
ok      svelte-check (10.3 s): 1793643444645 COMPLETED 581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (14.2 s): Duration  2.91s (transform 1.24s, setup 0ms, import 2.66s, tests 103ms, environment 0ms)
ok      vitest checks (41.2 s): Duration  29.57s (transform 14.62s, setup 0ms, import 29.56s, tests 39.72s, environment 2ms)
test:quick: 44.0 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth, other than the checks under tests/checks/source and tests/checks/tree, which run for any change under src, tests or utils; the build, the lint of unchanged files

$ LC_ALL=C grep -n '[^ -~]' docs/HELP.md src/lib/state/forms/career-view.ts src/lib/ui/frame/Card.svelte src/lib/views/academic/career/Career.svelte src/lib/views/academic/career/CareerCard.svelte src/lib/views/shared/card/record/CardActions.svelte src/lib/views/shared/card/record/RecordCard.svelte
(nothing, exit 1)

$ grep -rn "data-card-actions" src tests
(nothing, exit 1; the same over docs and README.md)

$ git diff 1374be572 --stat -- config
(nothing)

$ diff -rq ../O120-base/tests tests
(nothing, exit 0)

$ git status --short
 M docs/HELP.md
 M docs/diagrams/layer-views.dot
 M docs/diagrams/layer-views.svg
 M docs/diagrams/layers.dot
 M docs/diagrams/layers.svg
 M src/lib/state/forms/career-view.ts
 M src/lib/ui/frame/Card.svelte
 M src/lib/views/academic/career/Career.svelte
 M src/lib/views/academic/career/CareerCard.svelte
 M src/lib/views/shared/card/record/CardActions.svelte
 M src/lib/views/shared/card/record/RecordCard.svelte
?? .scratch/migration/agents/briefs/O120-cases.md
?? .scratch/migration/agents/reviews/O120-report.md

Commands the report quotes:

$ sh utils/unused-exports.sh, diffed with ../O120-base/unused-exports.txt
(no line differs, exit 0)

$ git diff 1374be572 -U0 -- src | grep -E '^\+' | grep -nEi "before|used to|no longer|still|always ha|as before|previously|the step adds|after this package|O[0-9]+|20[0-9][0-9]-"
(nothing, exit 1)

$ npx vitest run tests/data/sources/career.test.ts --reporter=dot
Test Files  1 passed (1)
     Tests  28 passed (28)

$ grep -rn "data-card-control" src tests docs
Card.svelte:16,283,293; RecordCard.svelte:14,289; CardActions.svelte:19,152 (as the report says)

$ cat tokens.css rice/*.css | grep -oE -- "^\s+--c-[a-z]+:" | sort | uniq -c   (in src/lib/themes)
29 for blue, violet, gold, teal, indigo, pink; 26 for rose

$ cat tokens.css rice/*.css | grep -E -- "^\s+--card:", values reduced
29 hex6 (every value a 6-digit hex)

$ wc -l, the seven changed files
331 Card, 221 CardActions, 364 RecordCard, 219 Career, 94 CareerCard, 121 career-view, 615 HELP (as the report says)

$ sed -n 165,170p .scratch/migration/orchestrator-state.md   (worktree copy)
the heading and one paragraph, no entry (as the report says; the main checkout's section, now at line 175, also holds no entry)

Reviewer's own case-run: a program in the scratchpad that calls svelte/compiler's compile on the three components and prints their CSS. It writes nothing in the worktree. Source: /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/compile-card.mjs

svelte 5.57.1
== src/lib/ui/frame/Card.svelte
warnings []
.meta.svelte-1ec7fl6:not(:has(> *)) {
.meta.svelte-1ec7fl6:not(:has(> :not([data-card-control]))) {
.meta.svelte-1ec7fl6:not(:has(> :not([data-card-control]))) > [data-card-control] {
== CardActions.svelte: warnings []
.actions.svelte-11yfc6 { display: var(--card-at-rest, flex); ... margin-left: auto; }
.actions.start.svelte-11yfc6 { margin-left: 0; }
== RecordCard.svelte: warnings []
.menu.svelte-1liwmaq { display: var(--card-at-rest, flex); ... }
```

The report says the compiled text is left to the look. The compile above settles it: the contents of `:not` and `:has` stay unscoped, so children from other components count and neither rule is pruned.

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `data-card-control` is on `.actions` (`CardActions.svelte:152`) and `.menu` (`RecordCard.svelte:289`), both direct children of `.meta`. `.face` is `position: relative` (`Card.svelte:222`). The rule at `Card.svelte:282-297` has the brief's exact declarations under `@media (hover: hover)`, plus `pointer-events: none`, and a control paints `background: var(--card)` with `pointer-events: auto`. `data-card-actions` is gone. There are two blocks where the brief says one rule, because the row and the control are different elements; the report states this.
- 2: holds. Any child without the attribute makes the `:has` true, so the row stays in the flow. All 19 `{#snippet meta()}` were read.
- 3: holds by reading. The covered row is out of flow, so drawing the controls changes no box in the flow, and at rest the card is 6px shorter. The measured heights are for the look.
- 4: holds. `STRATEGY_TONE` is indigo, and `GROUPS` gives blue, violet, gold, teal, pink. `CareerGroup` carries `tone`, and `CareerCard` hands it to `RecordCard`. `git diff --stat -- config` prints nothing, and the career file's schema and reader are untouched.
- 5: violated, Standards 1. The other five head comments, `docs/HELP.md:301` and `docs/HELP.md:347` are true.

Rulings of `briefs/O120-cases.md`:

- Ruling 1: holds. `Card.svelte:268-270` is outside the media query, and its comment says what the ruling asks.
- Ruling 2: holds. `Career.svelte:68,169,196`, and `CareerCard` takes `cursor`.
- Check 3 as `grep -rn`, and no `npm run build`: holds.

Cases of the brief's "Cases":

- Career card with no Tag, under the pointer: met, by reading. `record` is undefined, so no `RootChip`, and the row holds only the two controls.
- Career card kept off the CV, with its Tag: met. The Tag has no attribute, so the row is in the flow.
- Narrow card whose title reaches the corner: met, by reading `measure` and `actionPlace`. `lineGap` reads 0, `others` is the opener's width, `seen` is the face's content width, and `fitActions` moves the rest to More. The row's width equals the in-flow width of the base.
- Card with `ontitle` and no chip: met. The row has `pointer-events: none`, and `.open` lies under it.
- Card with no action and no chip: met on both screens. Hover makes it an empty absolute row, no hover gives margin 0.
- Card on a screen that does not hover: met. The rule is under `(hover: hover)` only.
- Clipped card: met. `seen < content.width - 0.5` sets `start`, `.actions.start` keeps margin-left 0 (the new rules set no margin on a control), and the opener follows.
- Right-click on the empty part of the row: met. The event lands on what is under the row, inside `ContextMenu`'s wrapper.
- Card with an empty title and no lines: met by reading. `.card.fill` is `overflow: visible`, and the height does not depend on the row. By reading the control reaches about the foot rather than well past it, as the report says.
- Menu opened from "...": met. `Menu.svelte:197` draws through a Portal on the body; `.card:has([aria-haspopup][aria-expanded='true'])` keeps the controls. `menu-items.ts:148` sets `preventScroll: false`, so bits-ui does not set `pointer-events: none` on the body, and the control's `auto` lets no press through under an open menu.
- Keyboard cursor and Tab: met. See the cursor reading below.
- Card of a kind that draws a chip: met.
- `Card` inside a `Card`: met. The child combinator and each card's own positioned `.face` keep them apart.
- Usage card: met. `<Tag label={account.tool} />` is unconditional.
- Wallpaper and rice themes: met by reading, 29 of 29 `--card` values opaque, and no rule sets a background on `.actions` or `.menu`.
- Career view hues: met.
- Career file with no `positions`: met. `groupOf` gives `cards: []` and `Career.svelte:187` draws the Empty line.

The points the task named:

- `:has` and specificity: `.meta.svelte-x:not(:has(> *))` is (0,2,0), later in source than `.meta`, so it wins. The row rule is (0,3,0) and the control rule (0,4,0). The control rule sets only `background` and `pointer-events`, which no `.actions`, `.menu` or `.actions.start` rule sets, so nothing collides.
- `gap: 0` against `measure`: `columnGap` reads `0px`, `others` loses the 6px that is no longer there, and the strip's own 6px gap is read from the strip. Strip and opener touch only on a covered row; a chip row keeps its 6px. The brief asks for this and the report states it.
- `position: relative` on `.face`: no regression. A wider grep than the brief's, over `src/lib/ui` and every folder of `src/lib/views`, finds no absolute child that sits in a card body and is placed against the card. The eight view files holding such a style use no `RecordCard`, `EntryCard` or `Card`. `Select`'s `.caret` and `FieldSelect`'s `.unseen` have nearer boxes of their own or no offsets. `.face` makes no stacking context, and `GroupHead`'s sticky strip has `z-index: 2`.
- `pointer-events`: the property inherits, so `.act`, the Tooltip's `.tip`, the button and the Menu trigger all get `auto` from the control. A `.tool.waiting` keeps its own `none` with its wrapper hit-testable, as designed. The Tooltip bubble is on the body. `.slot title={tip}` sits above the row and is reached as at the base.
- Solid `var(--card)`: the row is 12px inside the card's edge and 8px below the top, so it covers no ring, pinned inset, cursor outline or rounded corner. The compact `ToolButton` has `background: none`, so `.actions` is what paints, and the rectangle behind a rounded control is the card's own colour. On a wallpaper the box is visibly solid, as decision 5 says.
- Keyboard cursor: it reaches the Career cards. `workbench-keys.svelte.ts:394` collects every visible `[data-card]`, and `Card.svelte:95` sets it. The ids are `career`, `<list>:<index>` and `profiles:<name>`, with no duplicates: indices and map keys are unique within a list, the list prefixes differ, and `career` has no colon. A cursor write goes through `recordField` to `{hub, key}` and back through `hubId`; `hub-names.ts` `addressOfId` says that gives any text back. Example: `positions:0` becomes `{hub: 'positions', key: '0'}` and reads back as `positions:0`. The outline at `Card.svelte:209` lies on the 1px border, inside which the bar sits, so it does not clash, and `.card.fill` is `overflow: visible`, so it is not clipped. Enter does nothing, as the report says: `activateCursor` finds no `.title button` or `[data-card-toggle]`, and `editorAction` sets no `toggle`.
- Diagrams off the write list: no finding. The spec's "Token discipline" runs `npm run diagrams` before the list, `Career.svelte` gained one import from state, and the diff is one label each (73 to 74, 1534 to 1535). The report marks them outside the write list with the reason. Landing must take these four paths.
- `.meta:not(:has(> *))`: no misfire. No `meta` snippet draws bare text at the row's top level. Every text sits in an element (`.date`, `.age`, `.at`, `.deadline`, `<a class="pdf">`). `Gallery`'s `{#each}` with no chips gives a truly empty row.

## 1. Spec

none

## 2. Proof

none

## 3. Standards

1. `src/lib/ui/frame/Card.svelte:138-139`: "beside chips the controls share their line, and with no chip they lie over the card (`.meta` below), so drawing them moves nothing either way."
   - What is wrong: the diff added this sentence, and its first half is false. `CardActions.svelte:26` says the row otherwise takes a line of its own, `actionPlace` returns `alone: true` when the strip does not fit beside the chips, and `.meta` is `flex-wrap: wrap`. So a chip row can grow under the pointer. Item 5 asks that this comment say what is true after the change; the spec's "What every package obeys" and the refute Standards heading call a false sentence a defect.
   - Failure scenario: a project card with a stage chip, a domain tag and a deadline tag fills a narrow column. Under the pointer the strip takes a second line, the card grows and every card below moves. A maintainer who gets that report reads this comment, concludes the jump cannot happen, and looks in the wrong place.
   - Fix at landing: say the controls share the line when they fit, and take a line of their own when they do not.
   - Verdict: item 5 violated.

2. `src/lib/state/forms/career-view.ts:36`: "a hue every theme defines and none oculus's lists read as a state."
   - What is wrong: brief decision 1 says none of red, amber or green. The comment widens that to a claim about all six hues, and the tree contradicts it: `recover-words.ts:139` gives `recover.state_present` teal, `inbox.ts:67` gives the info kind teal, `venues.ts:76-77` gives Q1 violet and Q2 blue, and `RadarCard.svelte:269` gives New violet.
   - Failure scenario: someone choosing a hue for a new list trusts the comment and assumes these six carry no state meaning, while teal already marks "present" and "info" elsewhere.
   - Fix at landing: name the hues left out (red, amber and green).
   - Verdict: none. The hues themselves are the brief's, and item 4 holds.

## 4. Behaviour

none. The report states every visible change I found, with before and after: the overlay on any chipless record card, the 6px at rest, strip and opener touching on a covered row, the title's corner covered under the pointer, the Career bars, and the Career cursor outline with Enter doing nothing.

## Declined to judge

- All geometry on a rendered page, including `article.card`'s `getBoundingClientRect().height` in the five states on a dataset card and a Career card. The review opens no page, so the look settles it.
- How the strip sits against the title's first line. It depends on the real `1lh` against the title's line height: `.actions` has negative `margin-block`, so by reading the control's top is above the row's box. That is arithmetic only; the look settles it.
- Whether strip and opener touching on a covered row, against 6px inside the strip and on a chip row, reads well. The brief ruled the `gap: 0`; the look is Axel's to judge.
- `npm run build` and `npm run diagrams` were not run. The first by the ruling; the second writes to the tree. The diagram claim rests on the one-label diffs read above.
- The builder's count of two list runs, and that the first was red. It cannot be reproduced from the tree.
- `git diff -U0 -- src` and `git diff --numstat` as the report quotes them, with no base. I ran the first with the base and read the second's totals from `git diff 1374be572 --stat`, which agree.
- `grep -rn "STRATEGY_TONE"` prints two more lines than the report names (`Career.svelte:23,48`). No decision rests on it, so it is not a finding.
- The rule's effect in real browsers other than the app's engine, and any card on a real touch screen. A read cannot settle it.

Reviewer usage: ade0f7e22d6432f88, claude-opus-5-5, 242039 tokens, 30 tool uses, 11 min 1 s.

## Closed

- Standards 1: fixed at landing, the comment on `--card-at-rest` in `Card.svelte` says the controls share the chips' line when they fit and take a line of their own when they do not.
- Standards 2: fixed at landing, the comment on `GROUPS` names red, amber and green as the hues left out.
