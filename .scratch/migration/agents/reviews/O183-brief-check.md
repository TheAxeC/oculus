# Brief check of O183 (`.scratch/migration/agents/briefs/O183.md`, oculus main at f9e1061f0)

Nothing was changed. The brief's premises and build items hold, and its ruling quote matches the plan's Rulings. Seven findings: three missing cases (6), one case a reading of the markup can pass without the goal (5), two procedures outside the verify list (9), line numbers off by one (3).

## 1. Names

`git grep -n -i -E 'SteerBox|steer box|prompt box|data-steer|steer-box' -- src tests docs config/text README.md .scratch/migration/agents/guarded.md ':!config/local.yml'`: no hit in tests or docs. In the write list: `TerminalGrid.svelte:3,52,199,479`. Outside it, none made false: `TranscriptBody.svelte:46,48,54,81,419` (the Transcript box, which stays); `SteerBox.svelte:2` and its `data-steer` hits; `config/text/views/sessions/composer.yml:1`; hits about the composer's box or Claude's own input line (`composer.ts:428`, `place.ts:283`, `review-comment.ts:43`, `Composer.svelte:20`, `TaskBlock.svelte:4`, `dragging.svelte.ts:6`). "steer box" occurs only at `TerminalGrid.svelte:3,199`.

Sentences that describe the box without naming it, each still true: `docs/HELP.md:257` and `config/text/views/sessions/terminal.yml:106` ("boxes and grids", in the plural, written for one box per grid); `SessionTools.svelte:3-4`; `model-machine.ts:491-492`; `session-link.ts:2`. `agents/guarded.md:436` G146 ("a terminal's kind, its box and a steer follow it") is ambiguous after the change: true if "its box" is the Transcript box. The brief names neither HELP.md:257, terminal.yml:106 nor G146's text.

## 2. The step line

Every part of plan.md:1735 has a requirement: "takes the whole height in the Live view" and "the prompt box goes from under the live grid" item 1; "stays under the Transcript view" item 3; the ruling the preamble. Item 2 (the comments) serves spec.md's rule on a comment the change makes false.

## 3. Premises

All hold (`cat -n`, `grep -n -w agent`, `grep -n -w locked`, `sed -n 430,440p .scratch/migration/agents/guarded.md`, `git grep -n -E "SteerBox|data-steer" -- tests`, `ls -d docs/adr`), with these corrections: `.half` starts at `:494` (brief `:495`) and runs to `:502`; `.grid` is `:504-509`; the head comment has a second sentence about the box at `:9-10` ("While the tab is locked the grid takes no typing, paste or drop, and its box is read-only.") the brief does not quote; `TranscriptBody.svelte`'s head comment runs `:46-49` (brief `:46-48`).

## 4. Cases and checks

Every case agrees with spec.md. The two Transcript cases and the locked case check places the step does not change; they guard the ruling's "stays under the Transcript view" and the `locked` readers. Spec.md asks that a case only a page shows names the look at landing as its proof.

## 5. The question

Item 1 cannot pass without the goal: after the removal `.grid` is the only child in the flow of `.half` (`ContextMenu` is `display: contents`, `ContextMenu.svelte:233-236`; the find bar is absolutely placed, `FloatingBar.svelte:26-28`; the paste Confirm is outside `.half`). The parent's `.terminal` padding `4px 6px 6px` (`Terminal.svelte:463-469`) is the inset a shell grid has today. "fills the tab's body to its bottom edge" is true only of `.terminal`'s content box. The first three cases could pass on a reading while the agent's tmux window keeps its old row count; the resize goes by the ResizeObserver at `:373-382` through `resized()` at `:205-209`. The cases should say what the look shows: the agent's own input line on the grid's last rows, no empty band under it.

## 6. Implied inputs

1. A by-hand pane (`fits` false): stays at its `byHand` size (`:283`), scrolls in the taller `.grid`, sends no resize (`:207`), draws no box.
2. A foreign terminal: on Live no "cannot be typed into from here" line; the Transcript box still says it.
3. An agent typed into a shell, or one that exits: the grid's height does not change and no resize follows from the kind's flip.
4. The resize after the height changes: on a Live mount of an agent terminal the tmux window's rows equal the grid's rows.
5. An agent whose session the page cannot link yet (`session.target` null, `Terminal.svelte:316`): no box anywhere in that tab; typing goes into the grid.
6. A locked tab: the box's locked line is gone from Live.

## 7. ADRs

`ls -d docs/adr`: no such folder. None.

## 8. Dictated text

None.

## 9. Overreach

The ruling is neither stretched nor narrowed. Outside the verify list: verify item 2's grep over one file is narrower than spec.md's grep of a changed name across `src`, `tests`, `config`, `docs` and `README.md`; "the first run of every case ... on the unchanged tree" is not in spec.md. Spec.md requires `sh utils/unused-exports.sh` against the base's output, which the brief does not name. No text attributed to Axel; no workaround or invented rule. User-visible consequences no case states: the locked, elsewhere and ended lines leave Live; an agent with no linked session has no box anywhere.

## Declined to judge

- Whether the spec skill's template requires the first run of every case: not read.
- Whether `npm run test:quick` passes: not run in a read-only check.
- How G146's "its box" should read: the orchestrator's file and a reading of intent.
- How the pane looks on screen: needs a page.

Usage: ac94e9d0644cf48ec, claude-opus-5-5, 133797 tokens, 32 tool uses, 278 s

## Closed

- 3: the line numbers corrected (`.half` `:494-502`, `.grid` `:504-509`, `TranscriptBody.svelte:46-49`), and the head comment's second sentence at `:9-10` named for item 2.
- 5: the Live cases say "to the bottom of `.terminal`'s inset, as a shell grid does" and that the agent's own input line sits on the grid's last rows, with no empty band, which the look at landing shows.
- 6: cases added for a by-hand pane, a foreign terminal, a kind that flips, the resize to full height, an agent with no linked session, and the locked line leaving Live.
- 9, the grep: widened to the changed names across `src`, `tests`, `config`, `docs` and `README.md`, as spec.md says. 9, unused exports: added against `../O183-base/unused-exports.txt`. 9, the first run of every case: kept, since the spec skill's brief template requires it.
- 1: `docs/HELP.md:257`, `config/text/views/sessions/terminal.yml:106` and G146 stay true (the lock still covers the Transcript box, and the kind still decides the Transcript box); the brief names them as read and unchanged.
- 4: each case names the look at landing as its proof.
