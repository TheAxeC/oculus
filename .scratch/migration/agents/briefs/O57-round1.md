# O57 round 1: the head files named by their absolute path, the dead filter and the extra test removed

Rules: `agents/spec.md` and the step's brief `agents/briefs/O57.md`, which stay in force except where this file says otherwise. The refuter report is `agents/reviews/O57-refuter.md`; the findings below are its Spec S1, Proof P1, Standards St1 and St2, and Behaviour B1, each with the ruling to carry out.

## What to build

1. **S1, `chatContext` reads the entry's `from: collections` source.** No change. The brief's premise that `files.ts` may import `collectionFiles` was wrong (`collections.ts` is server-only and `files.ts` is imported by the page); the report keeps the departure as stated.
2. **P1, the C16 row's own finding assertion.** Remove the `unread` field of the row type (`tests/routes/sessions/terminal-actions.test.ts:646`), its value on the C16 row (`:749`) and the `if (row.unread !== undefined)` block (`:805-809`). The row keeps its index assertion; the build's report of the unreadable settings is checked by reading `readOtherHub` (`src/lib/data/index.ts:601-622`), which the report states.
3. **St1, the dead de-duplication.** In `orderedHubs` (`src/lib/server/machine/pty/start/context.ts:64-69`) return `ordered` in place of the `seen` filter; the doc comment's "each once" stays, since `allHubs` gives each hub once and the two filters are disjoint.
4. **St2, one test for `chatContext`.** The case 'reads a hub whose collections list leaves out tasks, and finds a number written there' (`tests/data/sources/config/settings.test.ts:832-851`) is folded into the `it.each` table above it as rows on a map that `loadConfig` reads from a planted hub (the list of five keys with no `chat_context`, and the same list with `chat_context: 3`), each row giving the value, the problems and whether `settingProblems` holds `chat_context`. One test remains for the reader, and every input the removed case checked is a row.
5. **B1, the head files named by their absolute path (the orchestrator's choice Z972).** The venue catalogue and the pillars registry that open the index are headed by their absolute path, the primary's folder joined to the registry path (`# <primary folder>/.oculus/data/research/venues.yml (venue catalogue)`), so a project chat of a project in another hub, whose instruction names that other hub's folder as `{0}`, finds the primary's file. The section files keep their relative headings. The head comment of `context.ts` (lines 4-6) says the head files are headed by their absolute path. The rows of the G120 table (`tests/routes/sessions/terminal-actions.test.ts`) that hold the head lines expect the absolute heading, and C19's row checks it.

## Cases (first read on the round-0 tree in the worktree, then after)

1. P1: `sed -n 640,650p;745,752p;800,812p` of the test file before and after.
2. St1: `sed -n 50,70p` of `context.ts` before and after.
3. St2: the test names of the `chatContext` describe before and after (`npx vitest run tests/data/sources/config/settings.test.ts -t chatContext --reporter=verbose`), one test with its rows after, every input of the removed case among them.
4. B1: the G120 rows run before (failing on the new expected heading, quoted) and after (passing); C7's row (a project chat of beta in `other`) shows `# <hub folder>/.oculus/data/research/venues.yml (venue catalogue)` with the primary's folder.

## Paths this round writes

- `src/lib/server/machine/pty/start/context.ts`
- `tests/routes/sessions/terminal-actions.test.ts`
- `tests/data/sources/config/settings.test.ts`
- `.scratch/migration/agents/reviews/O57-report.md` (the report, a section "Repair round 1" appended)

## Verify before you report

From the worktree root, after the last change, once: `npm run test:quick`. The ASCII gate of `spec.md` over the changed files. The plan's whole verify list runs once, at landing on main.

## Report

Append "Repair round 1" to the report: per finding, what changed with the file and line, the case reads before and after, the verify lines quoted from the run after the last change, and the number of full-list runs.
