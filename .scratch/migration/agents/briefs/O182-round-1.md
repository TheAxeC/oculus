# O182 repair round 1

Rules: `.scratch/migration/agents/spec.md`, as for the step. The brief `agents/briefs/O182.md` stays in force. The review is `.scratch/migration/agents/reviews/O182-refuter.md`, also in the worktree's ledger at the same path. You write only in the oculus worktree. Besides the brief's write list, this round writes the files it names.

## 1. The tokens comment (Standards St1, Spec Sp2)

`src/lib/themes/tokens.css:216-220`: the clause "the one tree measure that stays a fixed number of pixels" is false, since `--tree-end-inset` is also read unmultiplied (`TreeItem.svelte:463`, `:487`). Remove it, so the comment says the row multiplies the shift by the text scale and not the gap. Under "Anything in the brief that was wrong", name that item 1 of the brief dictated the false clause.

## 2. Comments rewrapped as whole paragraphs (Standards St2)

Rewrap each comment paragraph the step edited as a whole at 100 columns, as `spec.md` says: `Tree.svelte:28-38`, `SessionWorkspace.svelte:242-244`, `CommitRow.svelte:228-235`, and check `TreeItem.svelte:2-6`, `tokens.css:216-220`, `Guides.svelte:22-28` and `CommitRow.svelte:233` the same way. Quote each paragraph's line widths after the change, and for each short line the width with its next word added.

## 3. The amber bar's comment (Standards St3)

`SessionWorkspace.svelte:242-244`: say what the bar is without setting it against anything removed: drop "rather than beside it".

## 4. A commit's pending and error lines (Behaviour B3)

`CommitFiles.svelte:190-197` draws a commit's pending line and its error line as depth-2 TreeItems with no padding, so with lanes passing they no longer stand where the file rows they stand in for start. Draw them in the same `.file` frame as a file row, the passing lanes included, so each starts where a file row of the commit starts. Under "each case after the change" give the positions at scale 1 with and without lanes passing.

## 5. The report (Behaviour B1, B2; Proof P1)

- B1: the amber bar's before and after: before, a 2px square border outside the row's rounded tint and its focus outline, both starting 2px to its right; after, the bar over the tint's left corners and the outline's left edge.
- B2: the hover and selection tint of every session and terminal row starts 2px further left, level with the group rows' tint.
- P1: the docs grep's four hits (`docs/decks.md:91`, `docs/HELP.md:31`, `:302`, `:573`), each judged.

## Verify

As the brief's "Verify before you report", over the files this round changes as well: `npm run diagrams`, then `env -u TMPDIR npm run test:quick` once after your last change; gates 2 to 6 of the brief. Append the round's section to `.scratch/migration/agents/reviews/O182-report.md` under "Repair round 1", each item with its diff and its check, and the before and after of every visible change.
