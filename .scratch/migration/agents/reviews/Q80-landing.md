# Q80 landing

Oculus migration (tools/oculus/.scratch/migration). Plan step Q80: line counts on the Status view, with cloc. Next: `/spec` Q79a, with Q89 and Q92 in their reviews.

## Open items

None.

## The check before the landing

The runner's agent listing (ListAgents) showed two subagents of this session running, the reviewers of Q89's round 2 (aefceffa630f486a8) and of Q92 (ae7ef61fd1dab9cc6). Q80's builder (adfd1cde92313bcfc) and both its reviewers (a59a84cb98d926c8b, aa0e2181b19c92109) were not listed.

## Not done

Nothing inside the brief.

## What landed

- `src/lib/server/machine/lines.ts`: the counter. git lists the tracked files (`trackedFiles` in `server/core/git.ts`); `.scratch`, `docs/diagrams` and `package-lock.json` are left out; cloc (npm `cloc`, LA20 (a)) runs by perl with the paths on standard input, a timeout and the request's signal; each file is read for its TODO lines. Every failure answers one sentence.
- `src/routes/api/(machine)/lines/+server.ts`: `POST /api/lines` behind the write token, passing `request.signal`.
- `src/lib/state/system/lines.svelte.ts`: the page store, which asks once per page and keeps the last table when a later count fails.
- `src/lib/views/system/status/LineCounts.svelte` on the Status view, between the git line and the hooks block; `grouped()` in `state/shared/words/format.ts`; the catalog lines in `config/text/views/system/status.yml` and `app.thousands_separator`.
- HELP.md, DESIGN.md and README.md sentences for the section; the diagrams rerun.
- Five fixes at landing, the round review's findings: S1 (a case for a request closed during the file reads), St1 and P2 (`status.lines_unreachable` for a failed fetch, asserted), B1 (`status.lines_bad_body` for an answer that is not JSON, with a 200 case), P1 (`location` unstubbed in a `finally`); and the abort case's fake cloc sleeps 30 s under a 3 s timeout.
- A correction: the builder's round-1 report opened with everything done while the S1 case was missing.

## Checks on main

```
$ sh /Users/axelfaes/.claude/skills/land/templates/verify.sh .../orchestrator-state.md   (from tools/oculus), exit 0
 Test Files  342 passed (342)
      Tests  5370 passed (5370)
verify: 6 commands passed
$ npx vitest run tests/server/machine/lines.test.ts -t 'reads no further'   with the loop's closed check removed
AssertionError: expected { Object (rows, total, ...) } to deeply equal { error: 'The request was closed.' }
$ npm install   (cloc on main), then npm run diagrams, exit 0
```

## The look (the page named TEST on 8790, Axel's Chrome, vscode dark modern)

- Status: "Lines of code" sits after "Workspaces with git state: 5" and before "Claude Code hooks"; "Counted at 18:41" with Count again; folder rows with indented language rows; Total 1,155 files, 171,864 code lines, 220,778 lines.
- Count again: "Counting lines..." above the table, which stays on screen.
- TODO reads 0 in every row; a grep over the tracked files finds no line with a TODO tag.

## Next

`/spec` Q79a in the free slot; Q89's review over round 2 and Q92's first review are running.
