# O49 builder report: handed back after the cases' first run

NOT done: nothing of "What to build" is built. The cases' first run found that the brief's rule in item 3 gets case C13 wrong, so the step stops before any code change, as the brief's "Cases" section says, and waits for the orchestrator's ruling. No file under `src`, `tests`, `utils`, `config` or `docs` differs from the base copy (`for d in src tests utils config docs; do diff -rq --exclude=local.yml migration-O49-base/$d migration-O49/$d; done` printed nothing).

## Open items of the state file, verbatim

- Open item 240 (2026-10-22): how the landing's check follows the standing demand "Only related tests at a landing". The `land` skill's `land.sh` runs the plan's verify list, `npm run test:quick`, on main; that list runs the essential list `tests/tiers/essential.txt`, tests related to no changed file, and leaves out the related tests under `tests/checks` and the ones tagged slow (`tests/tiers/quick.mjs:1-28`, `:203-205`, `:272`).
  - (a) `tests/tiers/quick.mjs` gains a related-only selection (no essential list; the related and changed tests under `tests/checks` and tagged slow included; no 45 s limit), and it becomes the verify list for builders, reviewers and the landing alike. Pro: one command, `land.sh` follows the demand unchanged, builders' runs get shorter too. Con: builders and reviewers lose the essential list as a wide net.
  - (b) The same selection, used at the landing only, `verify:` kept as it is for builders and reviewers. Pro: builders keep the essential net. Con: `land.sh` always runs `verify:`, so the landing replays the script's steps by hand with the other command, departing from the skill's script at every landing.
  - Recommendation: (a). The lazy option is to keep `npm run test:quick` at the landing as it is, which breaks the demand and is not offered. The change to `quick.mjs` lands at the first landing after the ruling.
- Open item 241 (2026-10-22): where the landing's tests run. Standing demand Z492 says the landing gate never runs in main's checkout but in `.agents/worktrees/gate`; the `land` skill's `land.sh` runs its check on main, and the landings of O58, O59 and O62 ran on main (plan.md, their bookings: "Verification on main").
  - (a) On main, as `land.sh` does; Z492 retired. Pro: the skill's own script, and related tests take seconds. Con: main's checkout is the one Axel's server on 8790 runs from, and the test run's `svelte-kit sync` rewrites its `.svelte-kit` types.
  - (b) In the gate worktree, as Z492 says, the staged change then copied to main. Pro: Axel's running server never sees a test run. Con: every landing applies the range twice and keeps the gate's `node_modules` current, outside `land.sh`.
  - Recommendation: (b), since it ends the cause Z492 was written for. (a) is the lazy option.

## The case the brief's rules get wrong: C13

The rule (brief item 3): "A view the registry no longer holds at the pick (`viewFor(view)` undefined, an app disabled or removed while the menu was open) opens nothing."

What the tree does: disabling an app does not take its views out of the registry. `registerApps` (`src/routes/views.ts`, from line 221) registers one view per app row and per contributed view, and `dropOthers` drops only the registrations of rows the push no longer holds. A disabled app keeps its row (its badge is the disabled glyph, `views.ts:126`, `row.disabled ? DISABLED_GLYPH`), and its contributed views are registered again with `listed: row !== undefined && appActive(row)` (`views.ts:160`), where `appActive` is `!row.disabled && row.hashApproved` (`src/lib/data/helpers/files/apps/apps.ts:18-19`). The registration's head comment says so: "A view of an app that does not act stays registered, so its tab draws the app's state, and is not listed" (`views.ts:142-145`). So after a disable `viewFor(view)` answers the registration, now with `listed: false`.

The result under the rule: C13 ("An app is disabled while the menu lists its view: the pick opens nothing") fails. The pick finds `viewFor(view)` defined and, the view being no unique view, opens it as a new tab of the pane (`openInPane`), where it draws the disabled app's state. Only a removed app (its row gone, so `dropOthers` drops the registration) gives `viewFor` undefined and opens nothing. The same holds for an app whose approval is withdrawn (`hashApproved` false).

Options for the ruling:

- (a) At the pick, a view opens only while the registry holds it and lists it: `viewFor(view)` undefined or `listed === false` opens nothing. The pick then re-checks the same predicate the menu was drawn with (`listedViews`, `catalogue.ts:381-383`), which matches the brief's own line "decided at the pick, never from the menu as it was drawn", and covers a removed, a disabled and an unapproved app alike. Recommended.
- (b) Keep item 3's rule and rewrite C13 so a disabled app's view opens in the pane showing the app's disabled state. This is the lazy option: it changes the case to fit the rule, and a pick from a list of views opens one the list would no longer show.

## Two further points the first run found (no case fails on them, listed for the same ruling)

1. Item 4's hint for an unnamed page. A page's `label` may be the empty string; the pane menu's page items number such a page `t('ui.page_default', at + 1)` ("Page {0}", `config/text/ui.yml:38`; `pane-view.ts:50-53` and `:75`). Under item 4 ("The hint is that host's `label` when it is a page") a unique view held by an unnamed page gets the hint `''`, which `MenuList.svelte:108` does not draw, so the item reads as held nowhere while its pick goes to that page. C14 meets it when the inner page shown by Show a page here... has no name. Recommendation: name an unnamed page as the move items do, `t('ui.page_default', at + 1)` by its place in `pages()`, no new text. The lazy option is to keep the empty hint.
2. C4's wording. `arrange(listedViews(views()), ...)` lists in the Apps group the Apps view, every app's own entry (`registrationOfApp`, `views.ts:116-133`, group `apps`, no `listed` field, so listed) and the listed contributed views. C4 names the Apps view and the contributed views only. The rule of item 2 ("the fold is the existing arrange") gives the fuller list, as the Views view shows it; I read C4 as incomplete rather than wrong and would build item 2's rule unchanged unless the ruling says otherwise.

A premise note, needing no ruling: `isPage` is not exported from the layout facade `src/lib/state/workbench/layout/index.ts` (`grep -n "isPage" src/lib/state/workbench/layout/index.ts` prints nothing), and that file is not in the write list. The shell module can tell a page from a float by whether the host's id is among `pages()`, which it reads anyway for the page's number, so the write list holds.

## The cases' first run, on the unchanged tree

Every case is read on the base; no browser is driven. The paths shared by all of them: a right-click on the strip's empty area reaches `tabMenu.read` (`PaneView.svelte:432`), which answers `deps.stripItems()` for no tab (`strip/tab-menu-state.svelte.ts:82`); a right-click in an empty pane's body draws `PaneBody`'s `ContextMenu` with `items={stripItems}` (`PaneView.svelte:471`, `PaneBody.svelte:337`). `stripItems` is `stripMenu(...)` (`PaneView.svelte:255-269`), whose first group is `[Open File..., New Text File]` (`pane-view.ts:343-346`); `config/text/ui.yml:75-87` holds no `strip_open_view` key. A pick goes to `stripPick` (`PaneView.svelte:273-298`), then `pick` for a pane item or `stripPicked` (`pane-view.ts:435-461`), which has no branch for an Open View id.

- C1 (strip of a pane with tabs): unmet. The menu holds Open File... and New Text File, then the splits; no Open View item, no submenu (`pane-view.ts:343-346`).
- C2 (empty pane body): unmet. Same `stripItems`, same first group (`PaneView.svelte:471`).
- C3 (Files opens as a new tab of P): unmet. No item to pick; `stripPicked` runs nothing for such an id.
- C4 (Apps submenu with app views and their container titles): unmet. No submenu.
- C5 (Settings, hint "System", pick shows it there): unmet. No item, no hint.
- C6 (Usage in the docked float, hint "Floating pane"): unmet. No item.
- C7 (Live HPC held nowhere opens in P): unmet. No item.
- C8 (a float's strip opens in the float's pane): unmet. A float's pane builds the same `stripMenu` with `float` set (`PaneView.svelte:260`), first group unchanged.
- C9 (a locked pane): unmet. No item; `locked` changes only Lock/Unlock (`pane-view.ts:362-364`).
- C10 (no other item moves): holds on the base, which is the reference: the groups are the openers, the splits and Float or the float items, the pane-only items under `editor_actions: hidden`, Lock or Unlock, the Tab Bar and Editor Actions Position submenus, Close, New Terminal (`pane-view.ts:342-393`).
- C11 (an unlisted view is not in the submenu): unmet as a case, since no submenu exists.
- C12 (the hold changes while the menu is open): unmet. No pick.
- C13 (an app disabled while the menu lists its view): unmet on the base, and wrong under the brief's rule, as above.
- C14 (a strip of an inner page): unmet. No item; `page` of that pane is the inner page (`PaneView.svelte:143-148`), which the build would hand to `openInPane`.
- C15 (a unique view held by the menu's own page): unmet. No item.
- C16 (a unique view in a float in its own window): unmet. No item.
- C17 (config not loaded, `readGroups(undefined)` gives `[]`, `catalogue.ts:284`): unmet. No item.

## Checks

None of the brief's "Verify before you report" list was run: the step stops before any change, and the list is run after the last change. Runs of `npm run test:quick`: 0. Whole-suite commands: none. No test was added or changed.

## Files

None changed (the `diff -rq` above). This report is the only file written.
