# Step Q100 refuter report (reviewer a4d8e215a755b412b, on .agents/worktrees/Q100, base 4f22e78e)

Nothing in the worktree was changed (`git status --short` at the end showed the same four M lines and one ?? line). Every revert and probe ran on a scratch copy made with rsync of tools/oculus and a symlink to node_modules.

## Verification

```
uptime before: 22:06 load averages: 8.76 9.13 8.01
$ sh ~/.claude/skills/land/templates/verify.sh .../orchestrator-state.md </dev/null   (from tools/oculus in the worktree)
 Test Files  346 passed (346)
      Tests  5510 passed (5510)
1790626175849 COMPLETED 1481 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
built in 1.87s
built in 6.85s
All matched files use Prettier code style!
> eslint .
verify: 6 commands passed
exit 0
uptime after: 22:11 load averages: 10.46 10.65 9.19
```

The `Rebasing ... could not apply` lines in the test output come from a deposit test's scratch repositories under /var/folders. No test timed out.

- Brief verify 2, `npx vitest run tests/views/whole/tinted.test.ts tests/ui/colours.test.ts tests/views/personal/calendar.test.ts`: 3 files, 44 tests passed, in the worktree and in the scratch copy.
- ASCII gate (the spec's perl form over src tests bin config): nothing, rc 0. `git diff 4f22e78e -U0 | grep '^+' | LC_ALL=C grep '[^ -~]'`: nothing.

## 1. Spec

- `tests/views/whole/tinted.test.ts:45-65` (`selectors()`) with `:66-69` (`namesStrip`).
  - Brief item 1 says "A rule that names a strip and anything else still counts."
  - The splitter keeps a comma inside `:global(...)` as part of one selector, and `namesStrip` tests only the end of the unwrapped text. So `:global(body.wall) .grid :global(.rows, .ec-header)` is taken for a strip and is not counted.
  - A probe case asserting `extra: [one]` for that selector failed: the audit returned `{ missing: [], extra: [] }`.
  - With the order reversed, `:global(.ec-header, .rows)` is counted, since the text then ends with `.rows`.
- Every other premise of "What is on the tree" reproduced:
  - `Calendar.svelte:189` is `<Pane title={t('views.calendar')} tinted>`.
  - The library is version 5.15.0, with the sticky blocks at `index.css:166-173` and `:749-755`.
- All four items are in the diff, and DESIGN.md changes on line 216 only.
- Every case has a test, and the report gives the first run of each.

## 2. Proof

- The first-run claim reproduces: `Tests 3 failed | 41 passed (44)`, with the failures the report quotes.
- Each revert the report quotes reproduces:
  - drop `beyondStrips`;
  - `.some` changed to `.every`;
  - the chip rule moved before the shorthand (`expected 2357 to be greater than 2516`);
  - chip and mix in one shorthand (colours.test gives a raw colour);
  - the mix put back to `transparent`.
- Removing only the chip rule gives `expected [] to have a length of 1 but got +0`.
- A test that stays green under a revert: with `selectors()` replaced by `list.split(',').map((one) => one.trim())`, all 10 tests of tinted.test.ts pass. No test exercises the parenthesis-depth tracking, and that is the code path behind the Spec finding.
- No loosened threshold, no file-scope mutable value, and no test asserting a known defect.
- The Calendar case in calendar.test.ts reads source text. It is named "audits ...", as the spec requires for such a case.

## 3. Standards

- None.
  - The files are 411, 309 and 442 lines.
  - The comments carry no history.
  - Grepping `never two|one translucent|second layer|translucent layer` over src and tests hits `Pane.svelte:54,67`, `PaneView.svelte:436`, `Memories.svelte:335`, `EntryForm.svelte:74` and `Markdown.svelte:30`. None becomes false.
- Minor: `ui/display/Table.svelte:112-116` already gives the sticky `th` the same mix under `body.wall`, and tinted views may render it. The new DESIGN.md:216 sentence names only the Calendar, so it is incomplete as a record of where the exception applies.

## 4. Behaviour

- Visible changes the report does not state with a before and after. `.ec-header` also carries two things beyond the week, day and list headings the report names:
  - the time grid's all-day row, rendered inside `<header class="{theme.header}">`, which now also gets the second layer;
  - the month view's weekday row, which does not scroll (`.ec-uniform`, `overflow: hidden`) and still gets the second layer, one step darker than the pane, with no rows passing under it.
- No other sticky strip is left showing rows through it.
  - In src, `ui/display/Table.svelte:97` `th` already carries the mix.
  - In the library css:
    - `.ec-sidebar` (:288) is sticky on the inline axis only, with no horizontal scroll found (not verified on screen);
    - `.ec-event-title` (:553, :563) sits inside an event;
    - the now-indicator dot (:650) is not a strip;
    - `.ec-col-group > *` (:811) belongs to the timeline, which the Calendar does not offer (`Calendar.svelte:122-125`).
- The STRIPS rule admits rules that are not strips that stay in place. Each case below was confirmed by a probe returning `{ missing: [], extra: [] }` where `extra: [One.svelte]` was asserted:
  - `:global(body.wall) .grid :global(.ec-time-grid .ec-day-head)`: in the time and month grids, `.ec-day-head` sits inside the sticky header and is not sticky itself, so a mix on it would be a third layer.
  - `:global(body.wall) .cards .ec-header`: any `ec-header` class in any view is admitted.
  - `:global(.rows, .ec-header)`: the Spec finding.

  The first two follow from the brief's decision 1 (strips named by class, "ends with"); the third comes from the implementation.
- Git in the worktree:
  - `.git/worktrees/Q100/logs/HEAD` holds only the creation entry and `reset: moving to HEAD` (21:55).
  - No commit, checkout, stash or reset appears.
  - The index was written at 22:05:27, by a status or refresh that cannot be attributed.

## Not checked

- The on-screen look under a wallpaper theme.
- Whether `.ec-sidebar` scrolls horizontally in a narrow pane.
- Any git command by the builder beyond the file evidence.
- Who wrote the report copy in the main checkout. The orchestrator did, at Steps 6 of plan-orchestration.

Reviewer usage: about 34 tool uses, 135k tokens, 11 minutes.
