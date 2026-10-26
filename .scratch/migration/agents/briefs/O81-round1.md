# O81, repair round 1

The refutation of your build is `agents/reviews/O81-refuter.md`. Every item of the brief holds but item 9, and every case is met or left to the look; the items below are its findings, each with the ruling to carry out. Work in `.agents/worktrees/migration-O81` only, under `agents/briefs/O81.md`, `agents/briefs/O81-cases.md`, this file and `agents/spec.md`. Every rule of your first prompt still holds.

A shortcut is a finding: a narrower reading of an item, or work inside the round called outside it, is done or handed back with the reason before the report.

## Items

1. **The Doc text says where each line goes and quotes it whole (refutation Spec 1).** Rewrite the report's "Doc text" section so that each item gives the current line as `grep -n` prints it, then its replacement. The Venues line of `docs/HELP.md` goes after the last sub-bullet of the **Data.** bullet, the line that starts "  - The log under the plan lists every request", and before the line that starts "- **Present.**", as a top-level bullet; quote both neighbours as `grep -n` prints them.
2. **One type for the words reader (refutation Standards 1).** In `src/lib/state/boards/board/presets.ts`, drop the local `type VocabOf` and use `WordsOf` from `src/lib/data/shapes/vocab-keys.ts` for `wordsReader`, `presetFor` and `recordPreset`, as `src/lib/state/boards/career.ts` does.
3. **The edits to existing assertions and allow lists, listed (refutation Standards 2).** Add to the report the table `agents/spec.md` asks for under "What every package obeys": one row per changed line of an existing assertion, allow list or predicate, with its file and line, the line before and the line after. The rows are `tests/checks/source/keys.test.ts` (the `COMPUTED_FINDING_KEYS` entry) and `tests/data/sources/config/layers/hub-vocab.test.ts` (the input row and the expected value), and any other such line of the diff.
4. **The `list` field on the `config` channel is named (refutation Behaviour 1, choice Z1032).** Each hub's vocabulary keeps `list`. Add to the report's "Doc text" the row `docs/apps.md` gives the `config` channel (the line that starts "| `config` | `{ config, hubs: { primary, lists }"), quoted as `grep -n` prints it, and its replacement, which says that `lists` holds each hub's `{ domains, venue_themes, data_themes, collections, list, words }`: `collections` the entries the hub lists, `list` its `collections:` list as written with the file it was read from, and `words` its merged vocabulary. Each word is checked against `HubVocab` in `src/lib/data/model/model-collections.ts` before it is written. Add the field to the report's host- or user-visible changes, with the payload before and after.

## Not sent

- Spec 2, the files O79 also changes (`hub-names.ts`, `model-collections.ts`, `data/index.ts`, `sources/collections.ts`) and the size of `hub-names.ts` when both steps are on main: O81 lands first, and the split of `hub-names.ts` falls to O79's landing, whose own lines take the file past the size limit; booked in O79's dispatch entry. Nothing to change here.
- Standards 3 (the verify list run three times) and Standards 4 (the history-word grep pattern): no change to the step; the verify list runs once in this round, after its last change.

## Verify before you report

From the worktree's root, after the last change, with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`: `npm run diagrams && npm run test:quick -- --base 335db1c9`, once, every command passes, a red line in a file the step does not change rerun alone by name and named, the list not run again for it; `npx vitest run tests/state/boards/board/board-rules.test.ts`; the brief's checks 4, 9, 10 and 11. Quote each check's summary lines.

## Report

Append a section "# Repair round 1" to `.scratch/migration/agents/reviews/O81-report.md` in the worktree's copy of the ledger: the first line, anything NOT done or "Everything in the round is done"; one row per item above with what changed, its file and line, and the check that shows it; the rewritten Doc text section whole; the table of item 3; the checks with their output as printed. In ASCII.
