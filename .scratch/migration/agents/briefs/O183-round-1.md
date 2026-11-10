# O183 repair round 1

Rules: `.scratch/migration/agents/spec.md`, as for the step. The brief `agents/briefs/O183.md` stays in force. The review is `.scratch/migration/agents/reviews/O183-refuter.md`, also in the worktree's ledger at the same path. You write only in the oculus worktree. Besides the brief's write list, this round writes the files it names.

## 1. The head comment's clause on steering (Spec S1)

`src/lib/views/sessions/terminal/grid/TerminalGrid.svelte:4-6`: remove the clause "a session is steered from under the Transcript view's turns (transcript/TranscriptBody.svelte)", so the head comment says what the grid does and names no other component's behaviour. Rewrap the paragraph as `spec.md` says.

## 2. SteerBox has one size (Standards St1)

The one caller left, `src/lib/views/sessions/terminal/transcript/TranscriptBody.svelte:419`, passes `small`, so the `--fs-md` size has no caller. In `src/lib/views/shared/sessions/SteerBox.svelte`: the `small` prop, its default, `class:small` and the `.small` rule go; the text box and the line under it are at `--fs-sm` always (the `.elsewhere` rule and the field's size), so the Transcript box looks exactly as it does now. The head comment's sentence on the two sizes says the one size and why (the box sits in a Terminal tab's transcript body, whose text is `--fs-sm`). `TranscriptBody.svelte:419` drops `small`. Check how the base draws the field's size under `.small` (`.small :global(.oculus-field)`) and give the same size to the field without the class.

## 3. The lock's sentences (Standards St2)

A tab draws at most one box after the step. `config/text/views/sessions/terminal.yml:106` (`terminal_lock_tip`) says "its box and its grids", and the head comment of `SessionTools.svelte:3-4` says "the box and every grid of the tab". `docs/HELP.md:257` is not edited: name it in the report with its line and the words that would match, for the orchestrator.

## 4. The report (Behaviour B1, B2; Spec S2, S4)

- B1: the before and after of Live under an agent's grid states the three tab stops that go (the text box, Stop and Send): after the grid, focus moves to the next element past the terminal body.
- B2: the before of an agent terminal the page cannot link yet is a usable box with Send and Stop on Live, and the after is none in the tab; the report says this case loses its Send and Stop, with Escape typed at the grid still interrupting the turn.
- S2: the two diagram files stay in the diff, named with the reason.
- S4: no git command other than `git status`, `git diff` and `git show` is run in this round.

G146 in `agents/guarded.md` (S3) is the orchestrator's text and is not yours.

## Verify

As the brief's "Verify before you report", over the files this round changes as well: `npm run diagrams`, then `env -u TMPDIR npm run test:quick` once after your last change; the brief's grep, with `small` added (`grep -rn -E "\bsmall\b" src/lib/views/shared/sessions/SteerBox.svelte src/lib/views/sessions/terminal/transcript/TranscriptBody.svelte` prints no prop or class of SteerBox); unused exports against `../O183-base/unused-exports.txt`; the ASCII check. Append the round's section to `.scratch/migration/agents/reviews/O183-report.md` under "Repair round 1", each item with its diff and its check, and the before and after of every visible change.
