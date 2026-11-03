# Repair round 1 of O132

Read `agents/reviews/O132-refuter.md` (in the main ledger, copied beside this file in the worktree's ledger as `agents/reviews/O132-refuter.md`) for each finding's evidence. Each item below is a ruling: make the change it names, nothing else. The brief's path list holds every path these items write.

1. Standards 1. The sentence of `tests/data/shapes/catalog-files/vocab.test.ts:5-6`, "Each finding names the file the value was read from, the hub's when the hub's value gives it, and the one-word readers give no word for a flag two words carry.", is stated of every finding of the file, and the describe of a hub that is not the primary files every finding under the hub's file. Qualify that sentence to the describes of the primary, so the head comment states one rule for each describe and the sentence after it keeps the other. The comment stays true of every row of the file.
2. Standards, the doc comment of `VOCAB_FILE` (`src/lib/data/index.ts:632`). It reads "The config file of the engine whose keys the vocabulary check reads the words of", and the constant selects the keys that, set in a hub's file, switch the vocabulary check on, most of which `vocabFindings` does not read. Rewrite it to say that, in one line.
3. Proof 1. In your report, rewrite the first line and the row of verify 2 to what the runs show, with no row marked DONE whose last run was red:
   - your run of `npm run test:quick` red on three 20000 ms timeouts in `tests/data/hubs/hub-portfolio.test.ts`, a file the step does not change;
   - the reviewer's lone runs of that file red as well: `Tests  9 failed | 7 passed (16)`, then `Tests  1 failed | 15 passed (16)` on a 5000 ms timeout, at load averages 11 to 17; its run of `npm run test:quick` printed `test:quick: 236.3 s; every command passed`;
   - the last `npm run test:quick` of this round, as it prints; when `vitest slow` is red, name each red test, its run alone and the load average (`uptime`) beside it.
   Drop the claim that your lone run gave `Tests  16 passed (16)` unless that run's output is quoted in the report.

Verify, from the worktree's root, after the last change: the brief's checks, `npm run test:quick` once, the ASCII gate over the changed files and the unused-exports compare against `../O132-base/unused-exports.txt`. A red line in a file the step does not change is rerun alone and named with that run. Append a section "Repair round 1" to your report with each item's change, the runs quoted, and the files with line counts.
