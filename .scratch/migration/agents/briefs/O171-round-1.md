# O171 repair round 1

Rules: `.scratch/migration/agents/spec.md`, as for the step. The brief `agents/briefs/O171.md` and the rulings of `agents/briefs/O171-cases.md` stay in force. The review is `.scratch/migration/agents/reviews/O171-refuter.md`, also in the worktree's ledger at the same path. You run no page: the orchestrator measures this round at the look.

## 1. A hairline inside a slide takes no room in the layout (Behaviour 1)

Every length inside a slide is a fraction of the frame except the 1px hairlines, and a `border` takes layout height, so ten stacked hairlines are 1.4% of a 720 px frame and 8.1% of a 124 px tile. That breaks item 5's "one slide gives one verdict on every surface" on any slide near the edge of fitting. What must hold when this is done: inside a slide a hairline is still drawn one pixel wide (decision 2 of the brief) and adds nothing to any box's size.

The shapes, one per kind of line:

- A solid line on all four sides: `border: 1px solid C` becomes `box-shadow: inset 0 0 0 1px C`.
- A dashed line on all four sides: `border: 1px dashed C` becomes `outline: 1px dashed C; outline-offset: -1px`.
- A solid line on one edge: `border-top: 1px solid C` becomes `box-shadow: inset 0 1px 0 0 C`, and the same for the bottom edge with `-1px`.
- A dashed line on one edge (`Project.svelte` `.e5 + .e5`): a `::before` of the element, `position: absolute` on the element's top edge, `border-top: 1px dashed C`, the element `position: relative`.

The places:

- `src/lib/themes/slide.css:45`, the frame's own line. `screen/Stage.svelte` `.frame.bare` and the print route's `.frame` then draw no line (`box-shadow: none`) in place of `border-color: transparent`.
- `Panel.svelte:112, :120, :129, :145, :187`; `parts/Equation.svelte:48`; `parts/Grid.svelte:86, :113`; `parts/Plain.svelte:105, :118`; `parts/Section.svelte:76`; `parts/Words.svelte:56`; `parts/project/Facts.svelte:164`; `parts/project/Project.svelte:246, :312, :326`.
- `parts/Words.svelte:70`, the cells of a Markdown table, which collapse their borders: each cell `box-shadow: inset -1px -1px 0 0 var(--line)` and the table `box-shadow: inset 1px 1px 0 0 var(--line)`, so two cells share one line.
- `src/lib/ui/controls/Chip.svelte` and `src/lib/ui/display/table/Table.svelte`, whose lines stay as they are outside a slide. Inside a slide, one rule in each file, scoped with `:global(.slide-frame)`: a chip takes `border-width: 0` and `box-shadow: inset 0 0 0 1px` in the colour its state draws its border in (the states' `border-color` rules set a custom property the two read, so one colour rule per state stays); a table's `th` and `td` take `border-bottom-width: 0` and `box-shadow: inset 0 -1px 0 0 var(--line)`. A chip under the rice brackets rule draws no line, as it does now.
- Any other element under `.slide-frame` a read of `grep -rn "border" ` over those folders shows with a line that takes room is held to the same shapes. The `border-left` bars in `cqw` of `Project.svelte` are fractions and stay.

With no border left on the frame or a figure, the code that counts one goes: the border reads of `measure` in `screen/Stage.svelte` (the inner height is the box's height), the two border widths of `sides` in `Slide.svelte`, the border widths of `frameOf` in `screen/drawn-slide.ts`. A comment that names a border those no longer have is rewritten: the head comments of `slide.css` (its last sentence says a hairline "sizes nothing", which is now true and says why), `Stage.svelte`, the print route, and the "hairline border stays one pixel" sentences of `Panel.svelte`, `Plain.svelte` and `Project.svelte`.

The frame's inner box grows by 2 px at a 1280 px frame and each line gives its pixel back, so a slide gets a little more room. Say so in the report's before and after list.

## 2. Two comments the step made false (Standards 1)

`src/lib/views/system/findings/Findings.svelte:26` "its deck's frame" and `src/lib/state/workbench/navigation/status.ts:470` "their deck's frame": both say "its frame" / "their frame". Rewrap each comment paragraph at 100 columns. Both paths join this step's path list.

## 3. A short line left in a head comment (Standards 2)

`src/lib/views/academic/present/Slide.svelte:26`: rewrap the whole paragraph at 100 columns.

## 4. The report (Standards 3 and 4)

- State how many times you ran `npm run test:quick` before this round.
- C2's case-run program: write it again under `.agents/scratch`, as the report describes it, run it on the base copy `.agents/worktrees/O171-base`, quote its source and its output in the report, and delete it.
- Before your report remove `.agents/scratch`, as `agents/spec.md` "Where you work" says; the report quotes what it needs.

## New case

- C16. `grep -rnE "border(-top|-bottom)?: *1px" src/lib/themes/slide.css src/lib/views/academic/present/Slide.svelte src/lib/views/academic/present/Panel.svelte src/lib/views/academic/present/parts src/lib/views/academic/present/screen src/routes/present/print` prints only the `border-top` of the one `::before` of item 1. Its first run, before any change of this round, goes in the report; it prints 18 lines when run over the slide parts today.

## Verify

The brief's "Verify before you report" 2 to 8 again, and C16. `npm run diagrams` if an import changed. `npm run test:quick` once, at the end. A red line in a file this step does not change is not a reason to run the list again: run that test's file on its own, quote it and report it, as `agents/spec.md` "Token discipline" says.

## Report

Append a section "Repair round 1" to `.scratch/migration/agents/reviews/O171-report.md` in the worktree: per item what changed and where, C16's first and last run, the verify lines, and the before and after.

## Paths added to the step's list

- `src/lib/views/system/findings/Findings.svelte`
- `src/lib/state/workbench/navigation/status.ts`
