# O116, repair round 1

Each item says what to change. The findings are in `agents/reviews/O116-refuter.md`. The rules of the brief and of your first prompt hold, and no test run on unchanged `src` is owed for an edit of a test; a new test row is run on the code before its fix is made, where that is the natural order, and its failure quoted.

1. B1, P2, T4: the export's head goes out before the read. In `exported` the first `pull` enqueues the heading piece, which needs only the record and the catalog, and the read starts in the next `pull`. The bytes stay equal (digest 67cafa25 on the case program). A test row, or the review's kind of run over `node:http` through Kit's `setResponse`, shows the first byte arriving before the read ends; a test if it costs under a second, else a quoted run. The comment and the report then say what is true.
2. B2: a first read renders only the turns it keeps. The Markdown render of a said turn (`saidTurn` in `stores/turns.ts`) moves out of the per-record fold to after the cap for a first read, with a macrotask at least every few turns, so a tail dense in assistant text does not hold the thread for seconds per piece. A read from an offset renders what it answers, with the same yields. The export needs no render and does none. The answer for any input stays byte-equal to today's (digest 147d008f on the under-32 MiB case). Quote `mostMs` from a run on a 42 MiB dense file like the review's run C.
3. P1: add a row with a line whose end alone parses, of the form `xxx{record}` with the start inside `xxx`: its turn is absent. This separates `insideLine` from the broken-line skip.
4. P3: remove `let STORE` at `tests/server/sessions/transcript-routes.test.ts:132`; derive the folder from `held(SESSION).path`.
5. T1: the comment at `transcript-routes.ts:105-106` says the end of the last whole line, not the end of the file.
6. T2: the comment at `transcript-routes.ts:34` says what bounds a read: the tail, widened only while it holds no turn.
7. T3: the head comment of the test file says which rows break the zeros into lines.
8. S1: the report's limitations state that a line longer than a piece is parsed in one stretch, with the review's figures (78 ms for 64 MiB, 310 ms for 256 MiB).
9. T5: `foldFrom` stays exported, for the stated reason; add the file's unused-exports line to the report as it stands.

Paths: the brief's list, plus nothing else. Rewrite `.scratch/migration/agents/reviews/O116-report.md` in the worktree with a section "Repair round 1" giving each item's closure and `npm run test:quick`'s line.
