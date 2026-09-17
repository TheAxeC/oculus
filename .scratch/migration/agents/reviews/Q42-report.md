# Step Q42 builder report

Everything in the brief is done. One problem is outside my paths and is not fixed. A source save still in flight when its tab closes writes a record back under the closed instance's id after the tab is gone. A pane close and a page close do the same, because all three closes clear state the same way. The fix belongs in `src/lib/state/source.svelte.ts` (`saveSourceDraft`), which is not one of this step's paths. Measured with a throwaway probe test in `tests/state/layout-close.test.ts`, deleted after the run. It closed the pane with the save still pending, then let the save answer:
`PROBE after close undefined`
`PROBE after save lands {"text":"","saved":"new","loaded":false,...,"message":"saved",...,"file":""} [ 'a' ]`
Running the same probe with `closeInstance('a')` gave the same output. The record is left in storage with no tab to read it, so a reader sees nothing. It is still a leak: storage keeps a record for an instance that no longer exists.

## DONE / NOT DONE

| Item | State | Proof |
|---|---|---|
| 1. `closePane` clears every tab of the pane it removes | DONE | `src/lib/state/layout.svelte.ts:605` `forgetTabs(pane.tabs)`; `npx vitest run tests/state/layout-close.test.ts`: 5 passed |
| 2. `closePage` clears its own tree's tabs at any depth, none of a page its leaf shows, and the only-page case too | DONE | `layout.svelte.ts:431` `forgetTabs(tabsOf(closing.workbench.root))`, runs after both branches; `tabsOf` (`:612`) uses `panes`, which does not walk into page leaves (`src/lib/state/instance.ts:132-134`) |
| 3. Other operations that drop instances | DONE, none left | see "Item 3" below |
| Node tests | DONE | `tests/state/layout-close.test.ts`, 5 cases, all pass |
| Browser test | DONE | `unsaved-forms.spec.ts:188` passes |
| Reverts run | DONE | see "Reverts" below |
| `npx vitest run --reporter=dot` | pass | `Test Files 240 passed (240)`, `Tests 4034 passed (4034)`; no reruns needed |
| `npm run check` | pass | `1192 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `npm run build` | pass | built |
| `npm run format:check` | pass | `All matched files use Prettier code style!` |
| `npm run lint` | pass | eslint printed nothing |
| ASCII gate (perl form) | pass | printed nothing, exit 0 |
| `find src tests bin -type f \| xargs wc -l \| sort -n \| tail -3` | pass | largest files 979 (`tests/state/board.test.ts`) and 970 (`tests/state/layout.test.ts`) |
| `npx playwright test` over unsaved-forms, pages and tabs specs | pass | `19 passed (31.0s)`, after `npm run build` |

**Item 3.** No other operation drops an instance without clearing it:
- `closeInstancesOfView` and `closeRecord` both go through `closeInstanceAnywhere`, which already clears (`layout.svelte.ts:529`).
- `clearPage` and `unembedPage` remove only page leaves. A page leaf holds no tabs, and the page it names stays in the strip.
- `carryToPage`, `transferInstance`, `splitInstance` and `moveInstanceToPage` keep the instance id.
- The preview retarget already clears (`:797`).
- `shell/closing.ts` only decides which question a close asks and removes nothing.
- The pane menu's close calls `closePane` (`PaneView.svelte:250`). The page strip's close calls `closePage` (`PageStrip.svelte:113,130`).
- Outside `state/layout`, `apply` and `change` are only called to resize.

## Tests
Node, `tests/state/layout-close.test.ts` (new file, since `layout.test.ts` is at 970 lines). Each case sets real drafts: `source.editSourceDraft` or `manifestDraft.editManifest`, plus `formDrafts.setFormField`. Each checks both records, in memory and in the storage the ui store writes to.
1. A pane of two tabs closes: none of its records are left, and the pane beside it keeps its records.
2. A source read is in flight when the pane closes. The record is gone, and the read writes nothing back when it lands.
3. Closing a page whose tree has panes three splits deep and a leaf showing a second page: its own tabs a, b, c, d are forgotten; the shown page's tabs x, y keep their records.
4. Closing the page that another page shows forgets x and y and keeps a to d.
5. Closing the only page forgets its tabs and leaves one fresh default page.

Browser, `tests/browser/unsaved-forms.spec.ts`: type into the Tasks add form and into the collection search box, which writes the instance's own record. Both records are in storage before the close. Close the pane from the pane menu and answer Close pane. Then `#forms` keys are `[]`, and the instance keys do not contain the Tasks tab's id.

## Reverts
Each was applied to `layout.svelte.ts`, run, and the file restored; `cmp` with the saved copy printed `restored`.
- **R1:** drop `forgetTabs(pane.tabs)` from `closePane`. Node cases 1 and 2 fail (`2 failed | 3 passed`). After a rebuild, the browser case fails (`Expected - 1 / Received + 3`, `1 failed`). After restoring and rebuilding: `1 passed`.
- **R2:** drop `forgetTabs(tabsOf(...))` from `closePage`. Cases 3, 4 and 5 fail (`3 failed | 2 passed`).
- **R3:** make `tabsOf` walk into the page a leaf names. Case 3 fails with `expected undefined to be defined`, on the tabs that should have been kept (`1 failed | 4 passed`).
- **R4:** return straight after the fresh default page is saved. Case 5 fails (`1 failed | 4 passed`).

## Doc text
DESIGN.md, the unsaved-form-input decision line. Replace "A tab's close forgets its instance's form drafts with its state; a pane close and a page close forget neither." with:
"A tab's close, a pane's close and a page's close forget the state and the form drafts of every instance they take away; a page one of the closed page's leaves shows is not closed with it, and its instances keep theirs."

HELP.md, the paragraph on unsaved text (line 64). After "and an add form closes once its entry is added." add:
"Closing a pane or a page, once its question is answered, lets go of what every tab in it held, as closing each tab would."

## Visible change
- **Before:** after a pane or page close, the browser's storage kept each closed tab's `oculus.ui.v1` records (`<id>`, `<id>#forms`) for good.
- **After:** they are removed. Nothing on screen changes, because a closed tab's id is never reopened.

## Files changed
- `src/lib/state/layout.svelte.ts`: 901 to 922 lines, +31/-12.
- `tests/browser/unsaved-forms.spec.ts`: 368 to 422 lines; the new case and two helpers (`instanceKeys`, `tabIdOf`), plus a head comment sentence.
- `tests/state/layout-close.test.ts`: new, 190 lines.

## Decisions you may reverse
- The records are cleared after the arrangement is saved, the order `closeInstance` already uses.
- `closePage` now finds the page with `item(held, at)` instead of checking `at < 0`. The early return for the only page became an if/else, so both branches reach the clear.
- `tabsOf` repeats the walk in `pageInstanceIds` (`shell/page-strip.ts:29`). State may not import from shell, so it could not be shared.
- In the browser case I read the tab id from `oculus.layout.v1`, and I find the search box by its role inside the pane.

## Other limitations
- I corrected the comment in `closePage`: `clearPage` removes a leaf naming the closed page (`nested.ts:196-206`). The old comment said it becomes an empty pane.
- The comment at `src/lib/state/context.ts:104` still speaks only of a tab's close. It is incomplete now but not false, and the file is outside my paths.
- As decision 1 of the brief says, records already left behind by earlier pane and page closes are not removed.
- The browser case covers only the pane close. The page close is covered by the node tests and was not driven in the browser.
