# PR3, repair round 1

The refuter's report is `agents/reviews/PR3-refuter.md`. Each finding below has its ruling; change nothing else. Run no git command, not even `git status`: spec.md:32 forbids it. Work in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/PR3`. Your paths are the brief's, widened by this round where an item names a file. Do no breakage testing: never remove or revert code to watch a test fail. Take no focus, start no desktop app, run no Electron window, start no agent, and never run `npm run test:landing`, `tests/tiers/landing.mjs` or `npm run test:slow`. Rewrite the report `tools/oculus/.scratch/migration/agents/reviews/PR3-report.md` whole for the state after this round. Copy the open items from the state file at the moment you write it. Add a "Repair round 1" section that names each item below, what changed, and for a changed behaviour the test row that covers it, with its failing run on the code before this round's change, taken in a scratch copy of the worktree as it stood before the round (made under `$TMPDIR` before your first edit and named in the report), never by removing code from the worktree.

The rulings this round applies are Z674 (1) to (7) in `plan.md`.

## Spec

1. F1, tests no guarded entry names (spec.md:57; Z674 (1)). Keep the G47 rows of `tests/server/desktop/window-guard.test.ts` ('prints only the print route...') and hand them over under "Lines for agents/guarded.md" as G47 rows. Delete `tests/views/academic/export.test.ts`, `tests/state/workbench/palette-source.client.test.ts` and the describe 'the read of a file the route serves' added to `tests/state/sessions/source.test.ts` (with the imports only it used). The code they tested stays.
2. Case 19. Quote a run of the two-file drop refusal: two files dropped on a slide at once answer `present.drop_one` and write nothing. A run through the act's code with two files, its output quoted; no new test.
3. F3, the wire fields (Z674 (7)). No code change. The report names the three fields `DeckSlideSource.entry`, `DeckSlideSource.line` and `Deck.order` under the wire shapes, each with one clause of what reads it.

## Behaviour

4. B1, a deck-edit undo is all-or-none. In `deck-undo.ts`, when the Trash of a file the act made fails after the files with a before text were written back, every file already written back is written again with its after text, as `deck-files.ts` `remove` rolls `present.yml` back on a Trash failure, and the undo answers `unwritable` with no record written. A row in G9's deck undo table (`deck-acts.test.ts`, with its injected trash made to throw): the undo of New Slide with a failing Trash leaves `present.yml` and `slide-1.md` as they were after the act, and a later undo still works once the Trash works.
5. B2, the image link (Z674 (3)). In `deck-files.ts:369-372`, a name holding `#`, `%` or `?` is linked with those characters percent-encoded (`%23`, `%25`, `%3F`), the angle brackets kept for a name with a space or parentheses; the name check is unchanged. Where G8's table of the dropped image's write exists, add the row `fig#1.png` gives `![fig#1](fig%231.png)`; otherwise no test.
6. B3, the History row of an order record (Z674 (5)). An order record is named by its key alone, so the row reads "order" beside the kind "deck order", never "order / order".
7. Open question 6, log pruning cuts an act (Z674 (4)). In `changes.ts:332-334`, the prune keeps whole acts: the cut moves back to the first record of the act it falls inside, so `writtenWith` always finds every record of a kept act. A row in G9's table in `changes.test.ts`: a log at the prune bound whose cut falls inside a two-record act keeps both records.

## Standards

8. S1, the catalog limits. `config/text/server.yml:55` `image_large`, `config/text/views/academic/present.yml:15` `drop_large` and `config/text/desktop.yml:63` `timeout` take the limit as a parameter (`{1} MB`, `{0} seconds` or as each sentence's numbering needs), passed from `MAX_UPLOAD_BYTES` and `READY_WAIT_MS` (`print.ts:18`) at each call.
9. S2. In `config/text/views/academic/slides.yml`, `already_in` and `entry_moved` move to their alphabetical places.
10. S3. `deck.ts:48`'s comment names the shape itself, as "a record keyed by the bare group name", with no "first-form".
11. S4. `row-menu.ts` drops the `outline` fact; `ROW_DECK_OUTLINE` at :299 reads `facts.markdown`.

## Verify before you report

Run the unit test files your change touches while you work (`npx vitest run <file>` from `tools/oculus`), and `npm run test:quick` from `tools/oculus` once, after the round's last change; a failed command is rerun alone, then the full list once more. Quote each output and give the number of full-list runs. Also quote `grep -rn "32 MB\|60 seconds" config/text --exclude=local.yml` (nothing printed) and the ASCII check over the changed files.
