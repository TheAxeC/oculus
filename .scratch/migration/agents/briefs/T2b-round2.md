# T2b, repair round 2 (ruling Z414)

1. `tmux.ts` is a file on G35's Code line, so under the per-unit rule it is a unit and keeps one test. The orchestrator has put `tests/server/machine/pty/tmux.test.ts` back in your worktree as it was at the base. Keep only the case "keeps two panes apart while their output interleaves" inside `describe('the control stream')`, with the `recorder` and `feed` helpers and the imports it uses. Delete every other case and describe, and the head comment's sentences about the deleted cases ("the decoding, the reply pairing and the cutting of typed input", "The last cases ask whether a process is a running tmux ... tagged slow"), by deleting words only.
2. Name the kept case under G35 in your report as the test of `tmux.ts`, and give the counts of `tests/server` again with the same commands.
3. Deletion only; run nothing and no git command, as in the brief.
