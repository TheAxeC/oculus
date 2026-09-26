# Q76 landing

## Open items

None. Booked, no ruling needed: 3 (Q72, O33, O32).

## NOT DONE

Nothing of Q76's brief. Outside it: the `[TOC]` line in `docs/HPC-UTwente-howto.md:7` still draws as text; it is step Q78 (`plan.md:174`), which waits on Axel's answer about using a library for it.

## What landed

Q76, the document tabs, one commit on main (the commit that carries this file).

- A re-read keeps what is shown: the document store returns what it holds while an answer is in flight and when a request never reaches the server; the loading words are drawn only before a document's first answer. The empty-id invalidation that wiped every hub document and the manual on each write is gone.
- `api/docs` answers an `ETag` of the file's size and modification time and a 304 to a request carrying it; the store keeps the held object on a 304 or an equal answer, so nothing is redrawn.
- A `files` message re-reads only the documents whose file its root holds, through the answer's `file` field (Axel ruled keep); roots are compared with `.`, `..`, doubled and backslash separators resolved.
- A doc tab whose saved path left the `docs:` list follows the entry carrying its label and saves the new path; when another tab already holds that path it closes and that tab becomes the active tab of its page; a tab matching no entry names the path it asked for.

## Fixed at landing

- The round refutation's six findings, each under the Closed heading of `Q76-refuter.md`: the activation proven by two browser cases, the unconsumed mark asserted, backslash and `/` root cases, an answer whose body is not JSON replacing what is held (`readBody`), the comment and Doc text on activation.
- The Doc text into `DESIGN.md:107`, `DESIGN.md:275` and `HELP.md:13`.
- From the look: the nine figure links of `docs/RESEARCH-APPROACH.md`, `docs/AGENT-APPROACH.md` and `docs/HPC-UTwente-howto.md` pointed at `tools/figures/` relative to `docs/`, left so by the move of the documents; now `../tools/figures/`. Every linked file exists (checked by a loop over the links).
- Booked beyond the brief: the tree-walking checks in `tests/checks/imports/order.test.ts`, `tests/checks/tree/scratch.test.ts` and `tests/checks/tree/size.test.ts` time out at 5 s under load (`Test timed out in 5000ms`, seen on main while other steps' checks ran); added to Q77.

## Verification on main, after the fixes

- `npx vitest run --reporter=dot`: `Test Files  330 passed (330)`, `Tests  5161 passed (5161)`
- `npm run check`: `COMPLETED 1458 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
- `npm run format:check`: `All matched files use Prettier code style!`; `npm run lint`: exit 0
- the ASCII gate over `src` and `tests`: 0 lines; `sh bin/size-check.sh` and `sh bin/folder-check.sh`: exit 0
- `npm run diagrams` twice: `309bec94ddb098c47a7aa92bb23a9788` before, after the first and after the second run
- `npm run build`: exit 0; `npm run test:browser`: `412 passed (10.2m)`
- `node bin/revert-check.mjs` over the five node test files: `105 reverts, 0 unproven, 9 unchecked`; over `tests/browser/workbench/system.spec.ts`: `14 reverts, 0 unproven, 5 unchecked`. The unchecked cases name no revert and predate the step.
- `ls -d $TMPDIR/oculus-*`: none.
- Agents: Q76's builder and its two reviewers are not running (`TaskStop` answered that no such task runs; `ListAgents` lists only X3b's builder).

## The look

On the TEST page of the dev server on 8790, light theme (the step changes no theme): HPC how-to opened from the Views catalogue; seven writes under the hub (a file under `.agents/`); a MutationObserver counted the loading words 0 times, the heading element was the same node before and after, and the page's own fetch log read `[304,304,304,304]`. The figure was broken (`naturalWidth` 0) before the link fix and drew at 900 px after it, the open tab redrawing on its own when the file changed. `[TOC]` draws as text (Q78). The tab was closed and the page left on Config, as found.

## Next

X3b's round report and its refutation, then its landing; Q78 once Axel has answered on libraries; then Q77 alone, then X3a, X3c and L4.
