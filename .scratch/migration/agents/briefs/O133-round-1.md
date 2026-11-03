# Repair round 1 of O133

Read `agents/reviews/O133-refuter.md` (in the main ledger, copied beside this file in the worktree's ledger as `agents/reviews/O133-refuter.md`) for each finding's evidence. Each item below is a ruling: make the change it names, nothing else. The brief's path list holds every path these items write.

1. Standards 1. Decisions 3 and 4 of the brief stand: a text that opens with a byte-order mark, and one with lone CR line ends, are inputs no Markdown file of a hub has, so no reader changes for them. The sentences that say every reader takes the same lines are made true by naming the two exceptions:
   - the head comment of `src/lib/data/prose/markdown/front-matter.ts` (its lines 7-8 and wherever else it says so);
   - `tests/checks/tree/layer-rows.ts:228-231`;
   - `docs/HELP.md:406`, which also says that either line may end in spaces or tabs.
   Each says the exceptions in one clause: one byte-order mark before the opening line is skipped by the note scan (its tags and headings) and the Outline alone; a text with lone CR line ends has a header in the note scan and the Markdown server alone. The HELP bullet stays one line with no hard wrap and names only what a reader of a note sees: the tags and the Outline skip a byte-order mark before the first line, and the preview and an embed do not.
2. Standards 2. The rule of the header's lines exists once. `front-matter.ts` exports, beside `FRONT_MATTER`:
   - the byte-order mark pattern that `note-links.ts:275` and `outline.ts:57` each write today, which both then import, so neither writes its own;
   - one function that gives the number of lines a match of `FRONT_MATTER` spans, its closing line included, which `outline.ts:67` and `requests.ts:36` both call in place of their copies of `found[0].replace(/\r?\n$/, '').split(/\r?\n/).length`.
   The module still holds no reader and no I/O: a line count of a matched text is neither, and its head comment says what it holds after the change. The rows of `tests/data/prose/markdown/front-matter.test.ts` are not changed; run them after this item and quote the run.
3. Standards 4. `src/lib/data/sources/documents/docs.ts:59` gets a comment giving the reason for `text.match(FRONT_MATTER)` where the other readers call `FRONT_MATTER.exec`: `utils/diagrams/writes.mjs` draws a call of a method of an imported value in its group of what is not placed (`writes.mjs:12-13`), and `text.match` keeps the write diagram as it is.
4. Behaviour 1. In your report's "Host- and user-visible changes, before and after", add, each with its before and after as the review gives them:
   - the preview of a header whose opening line ends in a tab (C3): before, a rule and the heading `tags: [alpha, beta]` above `Title`; after, `Title` alone;
   - the note scan's headings, which the Markdown server offers after `[[note#` (`src/lib/server/machine/lsp/adapters/markdown/own/wiki.ts:137`) and which an embed `![[note#heading]]` reads a section by: C2 and C3 lose the heading `tags: [...]` on line 1; C12 gains the heading `tags: [alpha]` on line 4;
   - the Outline of a text whose opening line is `---` followed by a no-break space: before, a header; after, none.
5. Proof 1 and 2. In your report, rewrite the first line and the DONE / NOT DONE rows of checks 1 and 3 to what the runs show, with no row marked DONE whose last run was red:
   - check 1: the combined command red on `boundaries.test.ts` 'holds across src/lib' (5000 ms timeout); the reviewer's runs of that file alone also timed out twice at load averages 18.24 and 16.84, and passed with `--testTimeout=60000`; `vitest checks` of `npm run test:quick` passes it;
   - check 3: the last `npm run test:quick` of this round, as it prints; when `vitest slow` is red, name each red test and its run alone.

Standards 3 (three runs of the verify list) needs no change; its cost is noted at landing.

Verify, from the worktree's root, after the last change: the brief's checks 1 to 6, `npm run test:quick` once, the ASCII gate over the changed files and the unused-exports compare. A red line in a file the step does not change is rerun alone and named with that run. Append a section "Repair round 1" to your report with each item's change, the runs quoted, and the files with line counts.
