# Q72 landing

Position: oculus migration, step Q72 (the architecture re-read before the release, with its four carried fixes: the readable channel and write drawings, the diff pane on git's hunks, one stylesheet for the form fields, the negative checks on a signal), landed; next: O33 (oculus in its own repository, the cockpit retired and Linux), the last step, built inline by the orchestrator.

## Open items

- 116 (2026-10-15, Q72's review, Spec 1). Q72's builder wrote throwaway scripts outside the tree, in its scratch folder, with no approval from Axel: measuring scripts (a Python re-run of Q71's import count, a shell measure of the drawings, a Node trace of each arrow's ends, a multi-line Node runner for cases 9 to 20) and three Perl one-offs that edited `graphs.mjs`, `DESIGN.md` and its report. None is in the tree. Nothing they produced is used: case 8 (each arrow traced) rests on the look at landing, the Q71 comparison bears no decision, and the Perl edits are ordinary lines of the diff, read hunk by hunk by the orchestrator and the reviewer. Options: (a) leave the scripts unapproved and unused, and the round brief forbids any script of the builder's again (recommended); (b) approve one of them as a tool of the tree, which would need its own step and his yes on what it computes. The lazy option is none here: (a) loses nothing the step needs. Q72's landing goes on under (a) unless Axel rules otherwise.

## Not done

- The look did not take DateInput, MultiSelect's filter or the FieldSelect trigger (GlyphSelect, HueSelect) one by one; they carry the same class `oculus-field` from `ui/theme/field.css` as the five fields that were looked at.
- `writes.svg` at 4225 pt reads only zoomed in: no two arrows share a lane, but an arrow is followed across the drawing by eye. This meets the brief (no pair along each other, no label across an arrow) and is reported, not changed.

## The check of Steps 1

ListAgents showed no agent of Q72 running before the worktree's changes were committed (wip commit b9f31b7c5 on branch Q72).

## What landed

54 paths, 51 files changed, +4,298 -3,408 against main (the ledger left out), from base e36bcd0b4, as the booking in `plan.md` under Q72 lists: the re-read (no major architectural problem; 1762 modules, 7044 edges, no cycle, no folder ring); `channels.svg` and `writes.svg` with no two arrows along each other, held by a row of G25; the diff pane drawing git's `-U0` hunks through `git-provider.ts`, the character changes found in `inner-changes.worker.ts`; `ui/theme/field.css` for the eight fields; the three negative checks waiting on a signal.

## What was found, and the fixes at landing

The review over round 1 raised findings under each heading; all are closed (`agents/reviews/Q72-refuter.md`, Closed). Fixes at landing, 5: a computation whose held changes or lines moved while the worker computed answers Monaco's cancellation, so it never draws over the newer answer; the worker started inside the guarded block, so a constructor that throws answers Monaco's own diff; the head comments of `git-provider.ts`, `inner-changes.worker.ts` and `kit/load.ts` made exact. Probe after the fix: `asks 2 | run1 rejected Canceled/Canceled | run2 git` and `throwing start: own diff`. G33's Test line in `agents/guarded.md` names the row "reads a file's changes as git's hunks, and stages one block as exactly git's hunk" (Z901).

## Verification

In the gate worktree at main's head with the step and the fixes: `npm run diagrams` changed no file; `npm run test:landing`: ASCII gate, format, test:checks, lint, `npm test`, `check, build, test:slow` all ok, "test:landing: 557.2 s; every command passed". Main's staged tree equals the gate's (`git diff --cached HEAD --binary -- . ':!tools/oculus/.scratch' | shasum` 0b7bf85f117f on both).

## The look

On a scratch oculus on port 8796 over the gate (scratch home, two scratch hubs, a scratch repository); Axel's server and tabs untouched. The diff pane marks lines 14 to 25 as one block; a whole-line selection of line 13 leaves Stage Block, of line 25 gives "Stage 1 Selected Lines"; Next Change reaches the block; Compare with Selected draws Monaco's own lines 13 to 24. Both drawings keep each arrow on a lane of its own, labels readable at native size. The fields in dark, light and nord (rice): one shape per theme at rest, focused and disabled.

## Agents

Builder af9a2233fb1dc8792 (claude-opus-5-5): 372,954 tokens, 862 tool uses, 223.3 min; round 1 268,567 tokens, 112 tool uses, 23.3 min. Its first report did not pass its bar (one repair round). Brief check a82475b292d05b5f0: 270,707 tokens, 93 tool uses, 16.6 min. Reviewer a036aa66bc03d3ab8: 138,952 tokens, 124 tool uses, 29.3 min. Reviewer over round 1 acde5bd1c306120e1: 235,844 tokens, 70 tool uses, 16.9 min. Fixes at landing: 5.

## Next

O33, inline: its deletions of the research-cockpit, remove-unicode and project-new skills and the repointing of `.agents/skills/project-cleanup/SKILL.md:18` are listed path by path for Axel's yes before they are made.
