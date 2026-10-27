# O100 refuter report

## Verification lines (run from /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O100, PATH with node v24.21.0)

1. `npm run test:quick -- src/lib/views/boards/focus/Focus.svelte`
```
test:quick: 1 changed file(s), from the given paths
test:quick: 8 test file(s)
ok      prettier (0.7 s): All matched files use Prettier code style!
ok      ASCII gate (0.8 s)
ok      svelte-kit sync (3.3 s)
ok      svelte-check (18.7 s): 1793137235123 COMPLETED 551 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (23.3 s)
ok      vitest checks (56.0 s): Duration  48.52s (transform 15.22s, setup 0ms, import 46.49s, tests 35.21s, environment 2ms)
test:quick: 59.3 s; every command passed
```
The 8 files were tests/checks/source/{catalog-file-keys,comment-width,history,html-sites,keys}.test.ts and tests/checks/tree/{boundaries,duplication,size}.test.ts.

2. `LC_ALL=C grep -n '[^ -~]' src/lib/views/boards/focus/Focus.svelte` printed nothing, exit 1.

3. `git diff 249bd5b57 --numstat -- src/lib/views/boards/focus/Focus.svelte`
```
24<tab>6<tab>src/lib/views/boards/focus/Focus.svelte
```
30 changed lines; the brief's bound "fewer than 20" is not met (see Spec).

4. `wc -l src/lib/views/boards/focus/Focus.svelte`
```
     486 src/lib/views/boards/focus/Focus.svelte
```
At or under 520. Base: `git show 249bd5b57:src/lib/views/boards/focus/Focus.svelte | wc -l` printed 468.

5. The comment, Focus.svelte:468-470:
```
    /* A name of the box is a plain button: its words, with the focus ring the button draws, and an
       underline and the accent colour under the pointer and with keyboard focus. Its box is
       inline-flex so the underline reaches the button inside it; Blocked's count keeps its red. */
```
Read against spec.md:44-45 and :21: it says what the rules do and why the box is inline-flex; no package id, date, session or earlier state. The history-word grep over the added lines printed nothing, exit 1. Line widths: 99, 92, 99; the next word after line 469, `inline-flex`, would take it to 104, so the wrap at 100 columns holds. "Blocked's count" is accurate: the Blocked row's one name is `String(strip.blocked.length)` with a press (Focus.svelte:254-266). Holds.

Other reruns of what the report quotes as evidence:
- `npx prettier --check src/lib/views/boards/focus/Focus.svelte`: "All matched files use Prettier code style!"
- `grep -rn "wait-name" -r src tests docs | grep -v "wait-names"`: Focus.svelte:373, :471, :476, :477 only. Matches the report.
- State file open items: the header and the Z468 paragraph, no entry. Matches the report's verbatim quote.
- `git status --short`: ` M src/lib/views/boards/focus/Focus.svelte`, `?? .scratch/migration/agents/briefs/O100-cases.md`, `?? .scratch/migration/agents/reviews/O100-report.md`. Matches the write list plus the orchestrator's ruling file.
- ADR: `ls docs/adr` printed "No such file or directory". No ADR touches the step, confirmed.

## Item verdicts (What to build, judged under the round-0 ruling O100-cases.md)

1. Holds. Focus.svelte:372-379: a pressable name is `<span class="wait-name"><ToolButton plain .../></span>`; `{#if name.press === null}{name.text}` keeps a pressless name as its words with no span. The markup adds no whitespace text node.
2. Holds under ruling 2. Focus.svelte:476-480 `.wait-name:hover, .wait-name:has(:global(:focus-visible)) { color: var(--accent-txt, var(--accent)); text-decoration: underline; }`, the band's declarations with LaneCard.svelte:263-266's focus selector. `.wait-name` (:471-474) sets no colour or decoration at rest, so the name keeps the box's colour.
3. Holds. Focus.svelte:482-485 adds `.wait-names.blocked .wait-name` to the red rule. Svelte 5.57.1 gives the first scoped compound the class and every later one `:where(...)` (node_modules/svelte/src/compiler/phases/3-transform/css/index.js:336-340), so the Blocked selector is (0,4,0) and both hover selectors (0,3,0); red wins under hover and focus, and the underline from the hover rule still applies since the Blocked rule sets only colour.
4. Holds under ruling 1. `.wait-name { display: inline-flex; min-width: 0; }` is an inline-level atomic box in the run, as `span.tip` (Tooltip.svelte:301-304) already was; the join (", ", config/text/views/boards/focus.yml:160) is a text node of `.wait-names` outside the span, so line breaks fall at the join's space as on the base, each name whole, and the join is never underlined.
5. Holds. See verification 5.

## Case verdicts

1. Not verifiable by a read. Colour and the state at rest are settled by reading (ToolButton.svelte:339-355). The underline reaching the words follows CSS text-decoration propagation through the flex container `.wait-name` to its blockified flex items; LaneCard.svelte:173-175 and :253-266 use the same structure. Settled by the look on 8790, hovering "Maryam Amir Haeri" under Waiting on.
2. Not verifiable by a read, for the same reason; the markup and rules are identical for Under review, Applications and Grants. Settled by the look on 8790.
3. Not verifiable by a read for the underline; red under hover is settled by the specificity read in item 3. Settled by the look on 8790 on Blocked's count.
4. Not verifiable by a read. `:has(:focus-visible)` matches while the button matches `:focus-visible`, which Chromium sets on keyboard focus and not on a mouse click on a button; the ring of `.tool.plain:focus-visible` (ToolButton.svelte:451-460) is untouched. Settled by Tab onto a name on 8790, and a click on a name to see it is not left underlined.
5. Met. Focus.svelte:372 draws `{name.text}` with no element; no rule can reach it.
6. Met by reading. The pressable name was an atomic inline-flex box on the base (`span.tip`) and is one now (`.wait-name`), with the same shrink-to-fit sizing; the joins and their break opportunities are unchanged.

## Spec

- S1. The brief's size line is wrong. O100.md: "Size: a small text step: no brief check, one review, no repair round", and "Verify before you report" 3: "added plus removed lines fewer than 20." The diff is 24 added and 6 removed (30 lines). Every line carries a ruled item; no shorter diff meets the ruling without compacting code, which spec.md:47 forbids. Under the size rule the step is a full step: it was owed a brief check by a fresh agent and is reviewed here as a full step, with the repair round plan.yaml allows. Failure scenario: a step booked as small text skips the brief check that would have caught item 4's "inline" before dispatch, which here cost a hand-back and a round-0 ruling. The builder's NOT-done line for check 3 is the honest consequence of the brief's bound, and is no defect of the build.

## Proof

- P1. O100-report.md, "After the round-0 ruling", item 3: "Scoped by Svelte, `.wait-names.blocked .wait-name` carries five classes and outranks the hover rule's `.wait-name:hover` and `.wait-name:has(:focus-visible)`, three each". The count does not reproduce: Svelte 5.57.1 adds the scoping class with full specificity only to the first scoped compound and wraps later ones in `:where(...)`, so the Blocked selector carries (0,4,0) against (0,3,0). The conclusion (red wins) holds. Failure scenario: a later change that adds one class to the hover selector, ranked on the report's count of five, would expect red to still win and get the accent instead.

## Standards

none

## Behaviour

none

## Declined to judge

- The look of the hover and the focus on screen (cases 1 to 4): only the look on localhost:8790 at landing settles them; a reviewer runs no page.
- The report's "`npm run diagrams` ran right before it and changed no file": not rerun, since the command writes files; `git status --short` shows no other changed file, which is consistent with it.
- Whether a brief check by a fresh agent ran for this step once it became a full step: a process fact outside the worktree's diff.
- Whether the hover rule repeated in Band, LaneCard, Person, Referrers, FolderFiles, MergeSide and now Focus should become one shared primitive: outside the step's write list and ruling 524.
- Any git command other than the three allowed: none was needed.

Usage: a05b13d9ea49f0a2b, claude-opus-5-5, 132016 tokens, 22 tool uses, 4 min 43 s.

## Closed

- S1 (the size line): closed in the booking. O100 is handled as a full step from its diff (30 lines), recorded in its dispatch entry as `size:`; this review is its full review. Its brief check is not run after the build, since the round-0 hand-back and its ruling already settled the one fault of the brief that such a check would have caught (item 4's "inline"), and this review checked the brief's premises and the whole diff against it. No repair round: the review found no defect in the code.
- P1 (the specificity count in the report): closed in the booking, which states the count as (0,4,0) against (0,3,0); the conclusion the report draws holds.
