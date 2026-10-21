# O39 part D landing

Position: roadmap entry O39, oculus in its own repository; part D of four (the README rewrite, the manual moved into `docs/`, `DESIGN.md` deleted). Next: O48, the editor and terminal transparency settings; then O39's part C rows i and j, the owed desktop look and O39's closing.

## Open items

- Open item 201: the hub's `CLAUDE.md:33` names oculus's deleted `DESIGN.md`; (a) reword to "justified on oculus's own terms, its code and its documents", recommended; (b) delete the sentence; (c) leave it, the lazy option.

## Check of the agents

The runner's agent listing showed no subagent running before the worktree's wip commit.

## Not done

- No command of the verify list was run, by Axel's standing order that no test is run.

## What landed

Part D from base a2e367d6 (wip commit e769c6e1) onto main after O47: the README rewritten, `docs/HELP.md` (O47's three bullets carried in by the cherry-pick; it differs from O47's `HELP.md` in its 17 relative links alone), `DESIGN.md` deleted with every citation of it, the user in place of Axel in the text, John Smith in example and test data. Fixes at landing: the template key `smith2024blockterm`, `history.test.ts` reading the manual once, `git.ts:3`, the README's macOS step, the ledger's `spec.md` and `guarded.md`; by ruling "O39 part D names": the window title host `Oculus`, `utils/migrations/convert-decks.mjs` deleted, the Recover test users `john` and `johnsmith`.

## The look on TEST

The document title reads "Oculus: ~/Help"; the Help view draws `docs/HELP.md` with O47's Follow-ups, `live_subtasks` and `<hub name>/<file path>` lines; the Apps guide link opens the Apps guide and its `HELP.md` link opens the Help view.

## Agents

Builder ada0f9352fe29d6b7 (claude-opus-5-5; 296,484 tokens, 164 tool uses, 14.5 min; round 1 303,347 tokens, 12 tool uses, 0.7 min; round 2 350,911 tokens, 45 tool uses, 3.8 min); reviewer ad9adbd388b50b8f9 (claude-opus-5-5, 236,517 tokens, 73 tool uses, 7.7 min); no brief check. The first report did not pass its bar: two rounds and six fixes at landing.
