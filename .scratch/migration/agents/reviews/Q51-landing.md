# Landing report: Q51

## Open items at this landing (verbatim from the state file)

- A write that never answers (raised 2026-09-18 02:03 by Q48's second round): `state/writes.svelte.ts`'s `send` has no timeout and no abort, so a request that never comes back leaves that form's Save control disabled until Cancel or a reload. Recommended: a write gives up after 30 seconds and says so in the form's own refusal line, the duration in `config/behavior.yml`.
- The project tab and the card disagree about a document the project has not got (raised 2026-09-18 05:15 by R14's repair round): the card draws a known document a project does not hold as a plain `Tag`, the tab draws nothing, and `tests/views/project.test.ts:219` pins the difference. Recommended: the tab draws the absent tags the card draws.
- A tap reaches no ticker button on a device that also has a pointer (raised 2026-09-18 05:31 at Q49's landing). Recommended: leave it as it stands.

## NOT DONE

Nothing of the step, and nothing the review left open.

## What landed

Q51 landed 2026-09-18 06:48 from worktree `q51` at base `aa6a918b` by `land.sh --no-browser`, after one review and no repair round: the review found no behaviour change and one comment to correct, which is this landing's single fix.

`src/lib/state/layout.svelte.ts` is 440 lines, from 942. What moved, each a factory taking one `LayoutAccess` value so that no module declares a rune or holds state of its own: `access.ts` 40 (the store's own core), `storage.ts` 78 (where an arrangement is written and read back), `attention.ts` 149 (what the reader last acted in), `instances.ts` 333 (the instances on a page), `opening.ts` 162 (showing a view), `show-in-files.ts` 50 (the file browser's ask).

## Why this is a move and not a change

The review's own measurement, which is the reason to believe it: all 57 indent-4 function bodies were extracted from the base and from the new modules, the access prefixes normalised, and diffed. **48 identical, 0 missing, 9 different.** The nine are `loadLayout` (renamed locals, four calls now through `storage` and `attention`, each of which is exactly the statements it replaced), `read` (a null guard the base did not need, since the base took the storage as an argument; unreachable from the store, which attaches first), `switchPage`, `closePage` and `savePages` (an inline pair replaced by the helper that is that pair), `closeInstanceAnywhere` and `carryToPage` (`store.current` read once into a local at the same program point, nothing mutating the store between the two reads), `closeInstance` (Prettier rewrapping) and `closePane` (braces added).

The public shape: the `LayoutStore` type block diffs empty against the base, the 41 returned member names diff empty, and the same five names are exported with the same values and types. Every importer keeps its path (12 real specifiers before and after, the same file set).

No rune and no module-level state in any new module, and the check that would catch one does: a plain `let` planted in `attention.ts` and a `$state({})` planted in `instances.ts` each turn `tests/boundaries.test.ts` red by name.

## The fix at landing

The comment at `src/lib/state/layout.svelte.ts:130` said what stays in the factory "reads or writes `store.current`, or is on the path that does", which is true of the moved modules as well: 11 of the 26 functions left there hold no literal `store.current`, and six are pane-tree operations reaching the store exactly as `instances.ts` does. It now names the real criterion: the factory owns the arrangement as a whole, the page list and what is on screen, the write path every change goes through, and the operations that rearrange a page's panes; what moved out is per-instance work that asks the same write path through the access object.

## Verification on main

- `npx vitest run --reporter=dot`: 252 files, 4,292 tests, all passed.
- `npm run check`: 1,229 files, 0 errors, 0 warnings. `npm run lint`, `npm run format:check` and the ASCII gate: clean. `npm run build`: exit 0.
- In the worktree the reviewer ran the same list plus `npx playwright test` over the six specs the brief names: 73 passed (1.9m).

## The look

None owed and none taken: the diff touches no markup, no `data-` attribute, no control name and no string. The only changes outside `src/lib/state/` are four comment lines in test files, which `git diff --stat` shows.

## What the landing recorded

- One line of the builder's report is false: it says `openInto` keeps the shadowed `held` the original had; the inner binding was renamed to `made` (`opening.ts:133`) and the shadowing is gone. The rename changes nothing.
- The builder saw one full-suite run at `Tests 1 failed | 4281 passed` whose failing case it did not capture; neither the reviewer's run nor mine reproduces it. A flake in the suite that nobody has named.
- Six pane-tree operations could become a `panes.ts` of their own. The file is at 440 and under the limit, so nothing is owed; recorded because the review asked why they stayed.

## Where the proof is

- The brief: `agents/briefs/Q51.md`.
- The builder's report: `agents/reviews/Q51-report.md`.
- The review, with its function-by-function comparison: `agents/reviews/Q51-refuter.md`.
