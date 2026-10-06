# Q98 refuter report

Reviewer aeed9e709ec6a8e7f, a fresh agent, over `git diff 531ca29c` in `.agents/worktrees/Q98`.

Verify lines (`sh /Users/axelfaes/.claude-work/skills/land/templates/verify.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md` from `.agents/worktrees/Q98/tools/oculus`, exit 0; summary lines grepped from the full log):

```
 Test Files  339 passed (339)
      Tests  5325 passed (5325)
1790606873719 COMPLETED 1431 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
built in 1.79s
built in 6.30s
> prettier --check .
All matched files use Prettier code style!
verify: 6 commands passed
```

The log also holds three `Rebasing (1/1)error: could not apply ... Main` blocks, printed by the suite's own temporary git fixtures under `RUN v4.1.11`; they are not a red line.

## Spec

1. `src/lib/views/feeds/radar/RadarCard.svelte:142-151,212-219` and `src/lib/ui/controls/ToolButton.svelte:71-76,157,312-324`: a substitute mechanism for the brief's shape. The builder built a `cut` prop on ToolButton and `.link { display: flex; min-width: 0; max-width: 100% }`, not the brief's `.link :global(.tip)`, `:global(.tool)`, `:global(.label)` rules. The reason reproduces: `tests/checks/tree/boundaries.test.ts:531` flags any view `:global(.tool|.tip|.label)` rule not allowed, and `tests/checks/tree/allow-styling.ts:4-8` calls a HELD entry "a coupling to undo by giving the primitive the prop", so the brief's form would have widened an allow list by three entries. The prop is necessary and inside the step's scope. What still differs: `.link` gains `display: flex`; no rule caps `.tip` with `max-width`, the cap resting on `Tooltip.svelte:258-271` and flex shrink inside `.link`; the ellipsis is verified by no command, only by the landing look. Smallest fix: none to the code; the orchestrator rules on the substitution and the look checks a long and a short title on Lit Watch.
2. The six paths beyond the brief's list, judged: `ToolButton.svelte` necessary (finding 1); `tests/views/whole/type-scale.test.ts:273` necessary, since `:323-330` requires every `src/lib/ui` file listed and `:338-343` checks the entry `code=fs-sm`, not an exemption; `tests/server/sessions/stores/transcript-fixture.ts` (new) necessary, since the size gate is `LINES = 900` (`tests/checks/tree/size.test.ts:30`) and the moved builders are unchanged apart from `export`; `tests/server/root/watch/sessions.test.ts` and `tests/checks/tree/allow-duplication.txt` necessary, folding the two clones as their entries ask and removing two allow lines; `docs/diagrams/*.dot|svg` allowed by the brief. None is a defect.

Premises: every premise checked holds (the backticked catalog lines, 39 files importing `Empty.svelte`, `card_one`/`card_n` at `session-list.yml:11-12` read at `CardSessions.svelte:69-70`, `fold.ts:100` `acc.firstPrompt ??= content`, `finish()` calling `title(acc)`, `markdown.ts:17,117` using a per-call `Marked`). Every case has a test, and the report gives each case's first run.

## Proof

1. The report's revert claim for `codeSpans` is wrong: "not merging neighbouring plain tokens (the `datasets` case)". The lexer gives that line `[text, codespan, text, codespan, text]`, with no two plain tokens adjacent, so the case stays green without the merge. The case that goes red is the Markdown one, `public (`a<b & c`) but *no* entry [x](y)` (`tests/ui/html.test.ts:469-476`). Fix: correct that line of the report.

Reran: the 13 affected test files, 411 passed; the ASCII gate, nothing printed; the report's 19 line-count rows and its document grep, reproduced. Red on revert, reasoned from the code: the radar, transcript, CodeText, Config, Audit, Person and Calendar cases each go red when their change is undone. No threshold widened, no file-scope mutable, no test asserting a known defect.

## Standards

1. The builder ran `git log -1` in the main checkout, against the brief ("Run no git command, not even a read") and spec.md ("You never run a git command"). Disclosed in its report.
2. `src/lib/server/sessions/record.ts:31`, `/** The prefix of the first prompt that becomes the fallback title. */`, is made false for a slash-command prompt, where the cut applies to the command text (`record.ts:230`). Fix: "The length the fallback title is cut to."
3. `src/lib/ui/html.ts:3-4`, "the catalog's own text under config/text/ is oculus writing to itself and is drawn as it is", now reads false beside `:14-16`, since backticked lines are no longer drawn as they are. Fix: "and is drawn without the sanitiser".
4. `src/lib/server/sessions/record.ts:213`, `export function slashCommand(...)`, has no reader outside `record.ts` (`grep -rn "slashCommand" src tests` finds `:213` and `:230` only), against YAGNI in spec.md. Fix: drop the `export`.

## Behaviour

None unstated. `HELP.md:117` (the Lit Watch row) says nothing about project links, and the brief asked for no new page text.

## Not checked

The first run on the unchanged tree (no base checkout; reasoned instead); the CSS ellipsis in a browser; the brief's scan of 22 real slash-command transcripts.

## Usage

About 24 tool calls (31 by the runner's count), about 10 to 15 minutes, the verify run about 3 of them.

## Repair round 1, refuted

Reviewer ab3d474312821ace6, a fresh agent, over `git diff be867d83` read against `git diff 531ca29c`.

Verify from `.agents/worktrees/Q98/tools/oculus` exited 1 at `npm test`: `Test Files 3 failed | 336 passed (339)`, `Tests 9 failed | 5316 passed (5325)`, all nine timeouts (`Hook timed out in 10000ms` or `Test timed out in 5000ms`) in `tests/server/core/git-reads.test.ts`, `tests/server/core/git.test.ts` and `tests/server/git/git-ops.test.ts`, none touched by the step (`git diff 531ca29c --name-only | grep -i git` prints nothing), load averages 6.61, 10.32, 10.42. The other five commands, run one by one: `npm run check` `COMPLETED 1431 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`; `npm run build` exit 0; `npm run format:check` "All matched files use Prettier code style!"; `npm run lint` exit 0; the ASCII grep exit 0.

- Spec: none. The delta is round items 1 to 3 exactly (`record.ts:31`, `record.ts:213`, `html.ts:4-5`), nothing beyond, no check removed.
- Proof 1: the report's open-items section quotes Z36 alone as read from `orchestrator-state.md:105-114`; at the round's send commit ec33fc77 the section held Z36 and Z37, and the report was rewritten (16:59:21) before the rulings were booked (fdec001f, 17:00:18). Fix at landing: the section replaced with the current open-items list, verbatim. The `codeSpans` Markdown case is at `tests/ui/html.test.ts:177-185` (the file is 193 lines), so the report's corrected line is right and the first review's `:469-476` was wrong.
- Standards: none. Behaviour: none.

## Closed

- First review, Spec 1 (the `cut` prop in place of the brief's RadarCard rules): ruled in round 1, the prop stays; the ellipsis is checked at the landing's look.
- First review, Spec 2 (six paths beyond the list): ruled in round 1, all stay as necessary.
- First review, Proof 1 (the wrong revert line): corrected in round 1, confirmed by the round's review.
- First review, Standards 1 (the builder's `git log -1` in the main checkout): recorded; no code to change, and no git command was run in round 1.
- First review, Standards 2 to 4: fixed in round 1, confirmed by the round's review.
- Round review, Proof 1 (stale open items in the report): fixed at landing.
