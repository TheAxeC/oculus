# O94 round 1: the review's findings

Rules: `agents/spec.md`, `agents/guarded.md`, the step's brief `agents/briefs/O94.md` and its cases ruling `agents/briefs/O94-cases.md`, which stay in force except where this file says otherwise. The review is `agents/reviews/O94-refuter.md`. Each item below is a ruling: build it as written.

## What to build

1. **The front matter is found by the tree's rule (Standards 2).** `postedText` and `readsPosted` in `src/lib/server/edit/feeds/feeds.ts` find the front matter as `splitFrontmatter` in `src/lib/data/sources/documents/docs.ts:58-68` does, so Mark posted accepts exactly the files the LinkedIn view and the preview read a front matter from: the first line is `---` followed by spaces or tabs only, the closing line is `---` or `...` followed by spaces or tabs only, and lines may end in CRLF. In a CRLF file each replaced line and each added line ends in `\r` like the lines around it, and every other byte stays as it was. Reuse the tree's pattern rather than writing a second one where that can be done without losing the line-by-line replacement; the report quotes the grep for the existing helper and says what was reused. A byte order mark stays refused, as `splitFrontmatter` gives no block for it. The head comments of the two functions say the new rule.
2. **An idea is never another idea's sidecar (Declined 4).** The step's name rule accepts dots, so `xx-a.b.md` is an idea of its own and, today, also a sidecar of `xx-a.md`. A file whose name is itself an idea by the name rule is never moved as a sidecar of another idea. The head comment of `markLinkedinPosted` says so.
3. **An idea has a name after `xx-` (the hand-back's sharp edge `xx-.md`).** A base name is an idea only when at least one character stands between `xx-` and `.md`, so `xx-.md` is refused with `post_needs_idea` and never becomes `NN-.md`. The LinkedIn view offers Mark posted by the same rule: `src/lib/state/feeds/linkedin.ts:106` reads one rule with the server, a shared function or the same test, so the button and the write never disagree.
4. **A failed write after the rename leaves nothing moved (the hand-back's sharp edge).** When `writeTextAtomic` throws after the idea was renamed, the post is renamed back to the idea's name and the error is passed on as now, so the folder is as it was before the press. The head comment of `markLinkedinPosted` says this in place of the sentence about a numbered post with its old text.
5. **The case-run program's files (Standards 1).** The three folders `/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/o94-case-4ZtdN6`, `o94-case-IhBBau` and `o94-case-RRIA0Z` are removed. A case-run program of this round makes its files in the scratchpad or the base copy `.agents/worktrees/O94-base` and removes them before the report, and its output is quoted whole.
6. **The report (Behaviour 1, Standards 3, Declined 1).** The report's "Host- and user-visible changes" gains every change the review lists under Behaviour 1, each with its before and after, and the changes of this round. It gives spec.md:72's statements on the new keys and on the asynchronous paths. The first run on the unchanged tree is run again from the base copy (the new rows against the base source) and its count line is quoted whole, with each row's result.

## Cases (each a row of `tests/server/edit/feeds.test.ts`, its first run on the round's starting tree quoted before the result)

1. An idea whose closing line is `--- ` (a trailing space): renamed, its `date` and `publish` lines set, the closing line kept as written. Red on the starting tree.
2. An idea whose front matter closes with `...`: renamed and dated, the `...` line kept. Red on the starting tree.
3. An idea written with CRLF line ends: renamed, `date: <day>\r` and `publish: True\r` in place of the old lines, every other byte unchanged, checked with `toBe` on the whole text. Red on the starting tree.
4. A folder holding `xx-a.md`, `xx-a.png` and `xx-a.b.md`: Mark posted on `xx-a.md` moves `xx-a.md` and `xx-a.png`, and `xx-a.b.md` keeps its name. Red on the starting tree.
5. `xx-.md`: refused with `post_needs_idea`, nothing moves; the LinkedIn view does not offer Mark posted on it. Red on the starting tree.
6. A write that throws after the rename (the test makes `writeTextAtomic` throw for this row): the idea is back at its own name with its old text, no numbered post exists, and the error is passed on. Red on the starting tree.
7. Every row the step's brief and its cases ruling list still passes.

## Paths this round writes

The step's paths, and:
- `src/lib/state/feeds/linkedin.ts`
- `src/lib/data/sources/documents/docs.ts` (only if item 1 reuses its pattern by exporting it)
- the test file of `src/lib/state/feeds/linkedin.ts`, if item 3's rule is tested there

## Verify before you report

The step's brief's list, run once after the last change, from the worktree's root:
1. `npm run diagrams && npm run test:quick`: every command passed.
2. `npx vitest run tests/server/edit/feeds.test.ts tests/routes/hubs/hub-writes.test.ts`: passes.
3. The ASCII gate over every file this round changes and the report: nothing printed.

The plan's whole verify list runs once, at landing on main.

## Report

Append a section "Round 1" to `.scratch/migration/agents/reviews/O94-report.md` in the worktree's copy of the ledger: each item with DONE or NOT DONE and the evidence, the cases' first run, then the result table, the verification lines, and anything handed back with its reason.
