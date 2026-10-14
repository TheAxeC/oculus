# D76 landing

Position: oculus/migration, step D76 (notes like Obsidian); 355 of the 358 step lines of plan.md's "Packages, in execution order" are ticked (counted by their `- <tick> <id>` prefix). Next: /spec D73 (the Literature view) from main's head, its brief and brief check checked again on this commit; then Q72 and O33.

## Open items

None.

## Check of Steps 1

ListAgents before the commit listed no agent of this session; D76's builder (a167a0af4861f0040), its brief check (a258af2188e2127e1) and its reviewers (a92c8631fdab55e6c, ae5d265da61e0b75e) had all finished.

## NOT DONE

The look did not paste a picture into a note (the browser tool has no clipboard picture), and did not open the Present view on a slide with a handler or a script; the slide sanitising is covered by the two rows of G5 in `tests/ui/html.dom.test.ts`, which run DOMPurify under jsdom.

## What landed

The booking in plan.md under D76, 157 paths, +6,592 -1,949 against main, the ledger left out: the ten parts of the brief (the Notes section per hub, `[[links]]` with completion, definition, references and rename, embeds and attachments, autosave, tags and the tag search, Backlinks, the Notes Graph, KaTeX math, the search over every hub's notes, the `note` view removed), and the `dom` test project with jsdom of open item 102 (a).

## What was found

- The review over round 1: nine findings, all fixed at landing (`agents/reviews/D76-refuter.md`, Closed).
- HELP.md and `docs/apps.md` conflicted with main's short rewrite; D76's notes text was written into the new HELP.md, apps.md kept main's text, and `docs/templates.md`'s local.yml template dropped `notes`.
- The first gate run found three tree checks red (the state folder order, a comment past column 100, "C1" read as a step id); each was fixed at landing, the notes code moved to the folders the order allows.
- The look, on a scratch oculus on port 8796 with a scratch home and two scratch hubs, found three defects, each fixed at landing: a link to a missing note drew its dashed underline only on hover; a note made by a press opened in a tab drawn as gone for about two seconds; the Markdown server read a note's front matter as a heading, so Outline listed it. After the fixes the look saw every state the booking names.

## Verification

In the gate worktree at main's head with the step and every fix at landing, `npm run diagrams && npm run test:landing`: every command passed (`test:landing: 412.7 s; every command passed`, `scratchpad/d76-gate-3.log`), and `git diff --cached` on main is identical to the gate's (157 files).

## Agents

The builder's first report did not pass its bar (the first review's 16 findings); one repair round, refuted again, nine findings fixed at landing, 16 fixes at landing in all (the booking lists them). Usage: builder a167a0af4861f0040 (claude-opus-5-5) up to the pause 160,847 tokens, 787 tool uses, 143.2 min, after the resume 273,461 tokens, 176 tool uses, 50.9 min, round 1 229,913 tokens, 244 tool uses, 53.8 min; brief check a258af2188e2127e1 (claude-opus-5-5) 304,957 tokens, 108 tool uses, 15.5 min; reviewer a92c8631fdab55e6c (claude-opus-5-5) 76,065 tokens, 90 tool uses, 17.5 min; reviewer over round 1 ae5d265da61e0b75e (claude-opus-5-5) 305,967 tokens, 76 tool uses, 15.9 min. The builder ran one read-only `git status` in round 0, against spec.md's no-git rule.
