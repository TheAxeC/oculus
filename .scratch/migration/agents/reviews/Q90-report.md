# Q90 report

Everything in the brief is done. To get there I wrote three test files that are not on the brief's path list. Details are in "Brief was wrong" below. Separately, one run of check 1 showed 1 failed case that I did not capture and could not make happen again in 7 more runs (row 1).

## DONE / NOT DONE

| Row | Status | Command and output (verbatim) |
| --- | --- | --- |
| Item 1: the address rule moved to data/hub-address.ts | DONE | `grep -n "isHubPath\|hub-address" ...` printed `src/lib/state/boards/collection.ts:11:import { ADDRESSED, HOSTED, isHubPath } from '../../data/hub-address.ts';` and `src/lib/state/boards/collection.ts:23:export { isHubPath };` |
| Item 2: the Audit checks only a hub path | DONE | the same grep printed `src/lib/server/content/audit/projects.ts:468:            if (isHubPath(link) && !existsSync(join(input.hub, link))) {` |
| Item 3: tests, with a revert directive that goes red | DONE | see check 7 |
| 1. vitest over the five targets | DONE | Runs 1 to 7 of the final set each printed `Tests  226 passed (226)` with exit 0. One earlier run printed `Test Files  1 failed \| 9 passed (10)` / `Tests  1 failed \| 225 passed (226)`. I did not capture which case failed and could not make it happen again. |
| 2. `npm run check` | DONE | `COMPLETED 1510 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| 3. `npm run format:check` | DONE | `All matched files use Prettier code style!` |
| 4. `npm run lint` | DONE | `lint exit 0` |
| 5. ASCII gate | DONE | no output, `ascii exit 0` |
| 6. `sh bin/size-check.sh` and `sh bin/folder-check.sh` | DONE | `size exit 0`, `folder exit 0` |
| 7. `node bin/revert-check.mjs tests/server/content/audit.test.ts` | DONE, but the command exits 1 | `red       tests/server/content/audit.test.ts :: looks for a hub path on disk and leaves a web address alone (revert src/lib/server/content/audit/projects.ts:468)` and `1 reverts, 0 unproven, 47 unchecked`. The exit is 1 because the 47 other cases in this file carry no revert directive; the brief did not ask for them. |

A test of my own over the file whose comment I changed, `npx vitest run tests/state/workbench/layout/open/show-in-files.test.ts`, printed `Tests  33 passed (33)`.

## What changed, per item

- **Item 1.** New file `src/lib/data/hub-address.ts` (34 lines).
  - Lines 1-8: the Layer 1 head comment. It says the rule is one rule imported by both layers: the card decides what a click opens, and the Audit decides which links to look for on disk.
  - Lines 10-25: `ADDRESSED` and `HOSTED`, with their doc comments unchanged, now exported. They are exported because `hrefOf()` and `hubPathsOf()` in collection.ts still use them.
  - Lines 27-34: `isHubPath()`. Its doc comment now names both readers.
  - `src/lib/state/boards/collection.ts`: line 11 imports the three names; lines 20-23 re-export `isHubPath` with a comment saying why (views cannot import `data/`). `HOSTED_SCHEME`, `hrefOf()` (now at :264) and `hubPathsOf()` stay in the file. File length went from 815 to 795 lines.
- **Item 2.** `src/lib/server/content/audit/projects.ts`:
  - :11 imports `isHubPath`.
  - :466-468: a comment, then `if (isHubPath(link) && !existsSync(join(input.hub, link)))`. The message and the catalog key `audit.msg_entry_link` are unchanged.
- **Item 3.** `tests/server/content/audit.test.ts:360-390` is a new case beside the one at :312, "looks for a hub path on disk and leaves a web address alone".
  - It has three entries: `https://www.embs.org/jbhi/` (no finding), `network/flta-2025` created as a folder on the scratch hub (no finding), and `nothing/here.md` (`Missing: link path missing: nothing/here.md`).
  - Its directive at :362 is `// revert: src/lib/server/content/audit/projects.ts "if (isHubPath(link) && !existsSync(join(input.hub, link))) {" => if (link !== '' && !existsSync(join(input.hub, link))) {`. check 7 shows it red.
  - The existing case at :312 is unchanged and still expects `nothing/here.md`. `tests/state/boards/collection.test.ts` passes with no change to any assertion.

## Brief was wrong: writes outside the path list

1. **`tests/checks/tree/boundaries.test.ts` was not listed but had to change.** With item 1 as the brief specifies, the boundary check failed with:
   ```
   - []
   + [
   +   "state/boards/collection.ts imports data/hub-address",
   + ]
   ❯ tests/checks/tree/boundaries.test.ts:396:37
   ```
   The state row allows only the Layer 1 modules it names. I added `'data/hub-address'` to that row (:124) and added a clause for it to the row's justification comment (:62-66), in the same form as its neighbours `data/helpers/text-kind` and `data/sources/config/rail`. The file is now 604 lines. This is the tree's own way of registering a shared pure helper; the check itself was not loosened. You may reverse it, but only together with moving the module somewhere the state row already allows, and `data/helpers/` is full at ten items.
2. **Three revert comments named the rule's old file**, so the move made them false. I changed only the comments, and no assertion:
   - `tests/state/boards/collection.test.ts:335-336` now names `isHubPath of data/hub-address.ts` and `hrefOf of state/boards/collection.ts`. The old wording said "hrefOf beside it", which is no longer true.
   - `tests/state/boards/collection.test.ts:376` now says `HOSTED in data/hub-address.ts`.
   - `tests/state/workbench/layout/open/show-in-files.test.ts:457` now names `data/hub-address.ts`.

   A grep over `src tests HELP.md DESIGN.md README.md` for `hub-address|isHubPath of state|HOSTED in state|HOSTED.test(value)` now finds no reference to the old home. DESIGN.md:311 still cites `state/boards/collection.ts` for `normalisePath` and `hubPathsOf`, which is correct because both stayed there.

## Decisions you may reverse

- `ADDRESSED` and `HOSTED` are exported from `hub-address.ts`, not only `isHubPath`, because `hrefOf()` and the `folder` branch of `hubPathsOf()` use them directly.
- The test entries are built by a small local helper, `entry(index, title, link)`, inside the new case.

## Limitations

- The single failed run of check 1 is unexplained. It happened once in 8 runs and was not captured. Another step running beside this one in its own worktree may have loaded the machine at the time; that is not verified.
- The Audit still does not check that a web address is reachable. That is deliberate, per decision 3 of the brief.

Files changed:
- `src/lib/data/hub-address.ts` (new, 34 lines)
- `src/lib/state/boards/collection.ts` (795 lines)
- `src/lib/server/content/audit/projects.ts` (478 lines)
- `tests/server/content/audit.test.ts` (743 lines)
- `tests/checks/tree/boundaries.test.ts` (604 lines)
- `tests/state/boards/collection.test.ts` (comments only)
- `tests/state/workbench/layout/open/show-in-files.test.ts` (comment only)
