# Report: Q51, state/layout.svelte.ts split by concern

Builder af5dd7aa1e040a660, claude:opus through the Agent tool, launched 05:40, reported 06:11.

Everything in the brief is done.

## DONE / NOT DONE

| Deliverable | State | Command and output |
| --- | --- | --- |
| `layout.svelte.ts` under the limit, split by concern | DONE | `wc -l src/lib/state/layout.svelte.ts` -> `440` (was 942) |
| The store's public shape unchanged | DONE | `npm run check` -> `COMPLETED 1229 FILES 0 ERRORS 0 WARNINGS`; `grep -rn "from '.*state/layout.svelte" src tests \| wc -l` -> 12, the same set of files as before |
| No behaviour change | DONE | `npx vitest run --reporter=dot` -> 252 files, 4282 tests, all passed; no existing test edited except comment targets |
| New tests over the moved parts | DONE | `npx vitest run tests/state/layout-parts.test.ts` -> 16 passed |
| Every new test names a revert, run | DONE | 16 reverts, each quoted below |
| `npm run build`, `format:check`, `lint`, the ASCII gate | DONE | exit 0; Prettier clean; eslint silent; the gate printed nothing |
| Largest files | DONE | `968 tests/routes/terminal.test.ts`, `970 tests/state/layout.test.ts`, `980 tests/state/board.test.ts` |
| Browser suite | DONE | `npx playwright test layout pages shell-defects show-in-files tabs unsaved-forms` -> 73 passed (2.1m), after waiting for port 8792 |

One full-suite run in between printed `Tests 1 failed | 4281 passed`; its output was tailed to four lines, so the failing case's name was not captured. The two runs after it were green.

## Line counts

| File | Before | After |
| --- | --- | --- |
| `src/lib/state/layout.svelte.ts` | 942 | 440 |
| `src/lib/state/layout/index.ts` | 89 | 100 |
| `src/lib/state/layout/access.ts` | new | 40 |
| `src/lib/state/layout/storage.ts` | new | 78 |
| `src/lib/state/layout/attention.ts` | new | 149 |
| `src/lib/state/layout/instances.ts` | new | 333 |
| `src/lib/state/layout/opening.ts` | new | 162 |
| `src/lib/state/layout/show-in-files.ts` | new | 50 |
| `tests/state/layout-parts.test.ts` | new | 252 |

`model.ts` 157, `nested.ts` 234, `preview.ts` 60, `saved.ts` 400, `tree.ts` 434 and `workbench.ts` 73 are untouched.

`grep -rn "state/layout.svelte" src tests | wc -l` was 21 and is 14; the seven that went are prose, the revert comments naming that file as the home of `closePane` and `showInFiles`, repointed at the file each function now lives in.

## What each new module owns

- `access.ts` (40): the type `LayoutAccess`, the store's own core handed to every part: `held`, `save`, `currentPage`, `pageOf`, `at`, `holding`, `workbench`, `layout`, `apply`, `change`, `restorePanes`, `ui`.
- `storage.ts` (78): where an arrangement is written and read back. `LAYOUT_KEY`, `PREVIOUS_KEY`, `Storable`, `createStorage()` with `attach`, `read`, `remember`, `write`.
- `attention.ts` (149): what the reader last acted in. `active`, `remembered`, `touched`, `touchPane`, `forgetTouched`, `forgetTouchedOutside`, `forgetPage`, `clear`, `beside`, `rememberBeside`, `besidePath`.
- `instances.ts` (333): the instances on a page, from `activeInstance` to `forgetTabs`, with `closeInstanceAnywhere`, `carryToPage` and `reveal` internal.
- `opening.ts` (162): `OpenOptions`, `openView`, `openBeside`, with `openInto` and `findIn` internal.
- `show-in-files.ts` (50): the file browser's ask.

Each is a factory taking `LayoutAccess`, so none holds module-level state and none declares a rune; `tests/boundaries.test.ts` passes, its `findGlobalState` check included.

## What stayed in the factory

One comment at `src/lib/state/layout.svelte.ts:131` covers the group: each reads or writes `store.current`, or sits on the path that does, and the rune is declared in that module. `currentPage`, `pages`, `pageOf`, `at`, `holding`, `workbench`, `layout`; `savePages`, `apply`, `change`; `loadLayout`, `openArrangement`, `openPage`, `addPage`, `switchPage`, `renamePage`, `movePage`, `closePage`, `pageShortcut`, `embedPage`; `unembedPage`, `maximisePane`, `restorePanes`, `foldPane`, `expandChild`, `focused`.

## The reverts

Sixteen over `tests/state/layout-parts.test.ts`, each applied alone and the module restored after: the storage `write` guard and its try/catch (`TypeError: Cannot read properties of null`), `write` under the wrong key, `read` without its try/catch, `remember` without its try/catch, `touched()`'s three branches, `touchPane`'s page guard, `forgetTouched` as a no-op, `forgetPage`'s two deletions, `clear`'s loop, and `besidePath`'s four branches. Each printed the assertion its case names.

Three more at the files the repointed comments name: `closePane` without `forgetTabs(pane.tabs)` (`layout-close.test.ts` 2 failed of 5), `showInFiles` without its `restorePanes` call (`show-in-files.test.ts` 1 failed of 32), and `showInFiles` opening with `openBeside` (1 failed of 32).

Two reverts first named did not turn their case red, so each case and its comment now name one that does: the `backing === null` guard is not observable alone because the try/catch under it swallows the null dereference, and `touchPane`'s guard is not observable through a single touch because `touched()` already answers the current page for an id the list does not hold.

## Doc text

No line of `HELP.md` or `DESIGN.md` is made false. `grep -rn "layout.svelte\|createLayout\|state/layout" HELP.md DESIGN.md README.md` returns `DESIGN.md:93` and `DESIGN.md:201`, both still true.

## Decisions the brief did not cover, each reversible

1. One `LayoutAccess` value is handed to every part rather than a narrower argument list per module.
2. Six modules rather than fewer; `show-in-files.ts` is its own file at 50 lines and could sit inside `opening.ts`.
3. `LAYOUT_KEY`, `PREVIOUS_KEY`, `Storable` and `OpenOptions` moved under `state/layout/` and are re-exported, so every importer keeps its path.
4. `loadLayout`'s parameter is named `held`; the type is unchanged.
5. The path list was widened by three files whose revert comments named the old home of `closePane` and `showInFiles`; comment text only.

## Found and not fixed

- `storage.ts`'s `write` keeps the `backing === null` guard, which is dead as a behavioural rule since the try/catch swallows the null dereference; left as it was, since this step moves code.
- `src/lib/state/drag.svelte.ts:8` names `state/layout.svelte.ts` as where the operation is carried out; the member is still the store's and only the body moved, so the sentence holds at the level it speaks at. Outside the brief's paths.
- `openInto` keeps the shadowed `held` the original had.

## Before and after on screen

Nothing differs: no markup, no `data-` attribute, no control name and no string is touched.
