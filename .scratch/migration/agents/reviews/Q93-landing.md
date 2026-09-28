# Q93 landing (2026-09-28)

Plan oculus/migration. Step Q93, revert-check and the browser tests removed. Next: L7, the rail and pages, on Q93's head.

## Open items

- Z11, Microsoft accounts: the university's IT has not answered on forwarding Axel's mail; the published UTwente calendar link waits for Q92's reader.

## Agents of the step

The builder and both reviewers had finished before the landing; `ListAgents` listed none of them (only the separate Ordo session).

## NOT DONE

Nothing of Q93.

## What landed

- `bin/revert-check/`, `bin/migrations/revert-anchors.mjs` and their tests deleted; every `// revert:` directive line stripped from the tests; the comment-width exemption for directives removed.
- `tests/browser/`, `playwright.config.ts`, the `test:browser` script and the Playwright packages deleted, with `demo/hpc` and `demo/sessions`, which only the browser run read.
- Head comments and "checked in a browser" phrases rewritten to say what needs a DOM and is not run here.
- The duplication check no longer opens a block comment at a `/*` inside a `//` comment or a string, with a case over each.
- Fixes at landing: the new duplication case holds the line-comment branch; the 67 stale reasons of `allow-duplication.txt` corrected, 0 left.
- Outside the step: the step note removed from the calendar comment of the gitignored `config/local.yml`; the stale `test-results/` Playwright output deleted.

## Checks on main

`sh ~/.claude-work/skills/land/templates/verify.sh <state file>` from `tools/oculus`: Test Files 339 passed, Tests 5301 passed, `COMPLETED 1427 FILES 0 ERRORS 0 WARNINGS`, both builds, `All matched files use Prettier code style!`, `verify: 6 commands passed`. The ASCII gate of `land.sh` printed nothing. No look: the step changes no view.

## Next

`/land L7` on this head: the 20 files both steps change merged by hand, L7's round-1 review findings fixed at landing, the checks on main, and the look on the TEST page.
