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

`sh ~/.claude-work/skills/land/templates/verify.sh <state file>` from `tools/oculus`: Test Files 339 passed, Tests 5301 passed, `COMPLETED 1427 FILES 0 ERRORS 0 WARNINGS`, both builds, `All matched files use Prettier code style!`, `verify: 6 commands passed`. The ASCII gate of `land.sh` printed nothing. The look was owed, since the Help view draws HELP.md and the demo hub's graph-bandits README and leads feed changed; it is under "The look owed" below.

## Next

`/land L7` on this head: the 20 files both steps change merged by hand, L7's round-1 review findings fixed at landing, the checks on main, and the look on the TEST page.

## The look owed, done 2026-09-28

- Help view on the TEST page of Axel's Chrome on 8790: "The checks" lists `npm test`, `npm run check`, `npm run lint` and `npm run format:check`, with no browser-suite line.
- The demo hub, served by a second server over `demo/` on 8791 from an engine copy, on a page named TEST in Axel's Chrome, light theme:
  - graph-bandits, Project tab: the Rendering sentence reads as the step wrote it. The markup block draws "click me" with no handler, "go" with no address, paper, readme and jump with their addresses, the task checkbox, no password field, the code block, and "boxed" with no style. Read from the page: no element under Rendering carries an `on` or `style` attribute.
  - Position Leads: the card "Attention ... is all you need" draws the words and an image with `src="x"` and no handler, and no script element.
- Found: the comment above that lead in `demo/feeds/position-leads.yml`, rewritten by this step, said the card draws the title "as words", but it draws the image too. Fixed: the comment now says the card draws the words and the image, with the script gone and the handler off the image.
- `git status --short -- demo` after the server stopped shows only that comment fix.
