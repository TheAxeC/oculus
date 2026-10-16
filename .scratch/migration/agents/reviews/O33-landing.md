# O33 landing, phase A

Position: oculus migration, step O33 (oculus in its own repository, the cockpit retired and Linux, with the update tasks as hub files, the Literature view, the title bar, the Sessions view, a PDF opened at a page and the Focus page), phase A landed; next: O33's phase B (the cockpit and three skills removed, each path on Axel's yes), then phase C (the repository made, the Lima run, Axel's push, the draft Release). No step is queued after O33.

## Open items

- 118 (2026-10-16, O33 phase B). Phase B deletes and edits these paths on main, each only on Axel's yes (Step 0, open item 109; standing demand of 2026-10-15). Recommendation: yes to all, since each follows from the update tasks now being hub files and oculus replacing the cockpit; the lazy option is keeping the files, which leaves three skills that tell an agent to run a cockpit that no longer exists.
  1. Delete `.agents/skills/research-cockpit/` (`SKILL.md`, `litwatch-runbook.md`, `position-leads-readme.md`), `.agents/skills/remove-unicode/SKILL.md` and `.agents/skills/project-new/SKILL.md`, and the six links `.claude/skills/{research-cockpit,remove-unicode,project-new}` and `.codex/skills/{research-cockpit,remove-unicode,project-new}`.
  2. Edit `.agents/skills/project-cleanup/SKILL.md`: line 18 (the layout pointer `tools/cockpit/DESIGN.md`), lines 102 and 263 (the two `remove-unicode` pointers), line 255 (`python3 tools/cockpit/build.py`), line 277 (`/project-new`), each to the hub's own text.
  3. Delete `tools/cockpit/` (189 tracked files) and drop `tools/cockpit` from `.agents/plan.yaml`'s `worktree_paths` (line 12).
     The folder also holds three untracked files, `AUDIT_AUTO.md`, `cockpit.html` and `cockpit.local.yml`, not read here since the last may hold a secret; they go with the folder only on their own yes.
  4. Delete `selection_text` from `tools/present/deck_config.py`, whose only callers are in `tools/cockpit/`.
  5. Write README.md's sentence naming the commit that is the last to hold the cockpit, with that commit's real id once item 3 is committed.

## Not done

- Phases B and C of the brief: B waits on open item 118; C (the repository at `~/workspace/oculus` with its history and ledger, `gh repo create`, the hub text patch `agents/briefs/O33-phase-c-hub-text.patch`, the Lima run, Axel's push, the draft Release, the release archives rebuilt) follows B. O33 is not ticked.
- Not looked at: the Sessions view's text size, since a look never presses the Sessions rail; the desktop app, whose title bar Axel looked at himself and whose archives phase C rebuilds.

## The check of Steps 1

ListAgents showed no agent of O33 running before the worktree's changes were committed (wip commit f4988a525 on branch O33).

## What landed

254 staged paths, 243 files changed, +5,461 -1,999 against main (the ledger left out), from base b80e3a9cd, as the booking in `plan.md` under O33 lists.

## What was found, and the fixes at landing

The review over round 1 raised Spec 2, Proof 2, Standards 3, Behaviour 2; all are closed (`agents/reviews/O33-refuter.md`, "Repair round 1, refuted"). Fixes at landing, 12: 7 from the review (a make tests presence with `lstat`, so a dangling `.oculus` link is never recorded or trashed by an undo, with a new G9 row; HELP's stale make line; `defaultOut` made local; the Finder comments; the line counts walk only outside a repository; the guarded Test lines; the hub text held to what is true until phase C), 4 from the look (the Awaiting box merging repeated names; the window title on a left-out collection tab; modals in the page font; a PDF opened at a page staying there) and 1 red line (a comment over 100 columns in `repo-menu.ts`). Self-rules: Z927, Z928, Z929.

## Verification

In the gate worktree at 968d14994 with the step and every fix at landing: `npm run diagrams` changed no file; `OCULUS_TEST_HUB=<hub> npm run test:landing`: `ok ASCII gate (1.8 s)`, `ok npm run lint (24.1 s)`, `ok npm run format:check (39.9 s): All matched files use Prettier code style!`, `ok npm run test:checks (193.7 s)`, `ok npm test (318.8 s)`, `ok npm run check, then npm run build, then npm run test:slow (405.7 s)`, `test:landing: 405.7 s; every command passed`. Main's staged tree equals the gate's (`git diff --cached --binary HEAD -- . ':!tools/oculus/.scratch' | shasum` 4318713bcf61 on both). An earlier run failed `npm test` only on a 5 s timeout in `tests/server/git/git-scan-depth.test.ts`, a file O33 does not change, which passes alone (3 of 3 runs).

## The look

As the booking in `plan.md` under O33 states it: every view and state the brief names, in the nord, light and dark themes, on a scratch oculus on port 8796; Axel's server and tabs untouched; the Sessions rail not pressed.

## Agents

Builder a20f2cebacd022c8d (claude-opus-5-5): 151,315 tokens, 1713 tool uses, 232.4 min; round 1 375,134 tokens, 500 tool uses, 51.6 min; first report did not pass its bar; full-list runs 2. Brief check adcbfd466be0be62e (claude-opus-5-5): 249,112 tokens, 79 tool uses, 11.8 min. Diagnosis af9bf8786db8217ac (claude-opus-5-5): 121,563 tokens, 135 tool uses, 55.9 min. Reviewer a1b12a5347e0657cb (claude-opus-5-5): 286,616 tokens, 168 tool uses, 29.8 min; Spec 4, Proof 7, Standards 3, Behaviour 1. Reviewer over round 1 af442d914d96690a2 (claude-opus-5-5): 309,541 tokens, 95 tool uses, 14.6 min; Spec 2, Proof 2, Standards 3, Behaviour 2.

## Next

Axel's yes on open item 118, then phase B on main, then phase C.
