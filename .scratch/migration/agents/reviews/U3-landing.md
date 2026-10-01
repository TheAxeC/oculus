# U3 landing report

Position: oculus/migration, step U3 (every view on VS Code's scale, from U2's audit), step 153 of 292 in `plan.md`'s package list; 257 ticked. In flight: D27 and D35, each stopped after its first run with cases to rule. Next: those rulings and the builders resumed; /spec Q85d on the new main.

## Open items

None. The "Open items" section of `orchestrator-state.md` holds no entry.

## Agents stopped

`ListAgents` before the landing listed U3's round reviewer a0ab098f7b4f23aae as completed and no U3 builder (a2609b2bc8bd7786d is not listed); the two running agents were D27's and D35's builders.

## NOT DONE

- Text scale 1.5 and the rice palettes were not looked at on TEST; the look covered the states below.

## What landed

The views on VS Code's scale: one pane header frame with a one-line toolbar whose clipped controls open in a popover, single-line fields and buttons on `--button-line` scaled with the text, seven type tokens (11 to 26 px), icons at 16 px, row and card actions revealed on hover or focus, cards fit to the pane with one chip shape, `Empty` with an error box and an action, and DESIGN.md and HELP.md updated. 296 files staged on main (`git diff --cached --stat`: 6693 insertions, 3389 deletions).

`land.sh`'s cherry-pick in the worktree met 12 conflicts with main (Q88b's Files and Search changes, Q85c and D31). Resolved in the worktree on `U3-land`:
- `search/Search.svelte` and `Query.svelte`: U3's header action and bar kept, with Q88b's folder scope (`under`, the "In root/folder" line and its clear control) carried into the bar as a full-width line.
- `config/text/views/sources/search.yml`: the union of both sides' keys, in U3's sorted order.
- `DESIGN.md` 374-377: U3's two rewritten sentences and main's `api/ops` sentence.
- `HELP.md`: main's Files row (Q88b's menus) with U3's header and bar wording, and U3's Repositories row.
- `tests/views/whole/type-scale.test.ts`: U3's Disclosure size, main's NameField row and FileChooser path, U3's GlyphDialog size.
- `tests/checks/tree/allow-duplication.txt`: four lines the duplication check reported stale after the merge removed.
- `docs/diagrams/`: regenerated.

## Fixes at landing

1. F1: `Ticker.svelte` `.act` line-height scales with the text.
2. F2: `note.test.ts:139` comment without history.
3. F3a: `change-rows.test.ts:142` title states 1px of padding in a 20px box.
4. F3b: `RailPages.svelte` badge `min-width` reads `--rail-badge-height`.
5. F5: `HELP.md:122` clause order.
6. The look: a pick in a menu opened from the toolbar popover now closes the popover (`fit.ts` `picksMenuItem`, `Toolbar.svelte`); three cases in `tests/ui/frame/toolbar-fit.test.ts`, two failing with `picksMenuItem` answering false (`Tests 2 failed | 14 passed (16)`), 16 passing with it.
7. The merge resolutions above.

F4 needed no code change. Its before and after: `Files.svelte:465,468` were plain `.note` paragraphs with no live region, and are error boxes with `role="alert"`; across `src`, 35 `<Empty ... error` sites announce assertively.

## Verification on main, from `tools/oculus`, after `npm run diagrams` (rc 0)

```
$ npm test
 Test Files  418 passed | 22 skipped (440)
      Tests  10974 passed | 618 skipped (11592)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  442 passed | 9 skipped (451)
$ npm run check
COMPLETED 2947 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

Full verify-list runs at landing: three. The first passed before the look's fix; the second failed at `npm run lint` on the new test's stand-in (`no-unnecessary-condition`), which was fixed, lint then passing alone; the third, after the last change, passed.

## The look on TEST (localhost:8790)

- Panes at 309 px: the Files header with its icon actions and the filter with both toggles in the bar; Archive's header actions and its bar of search, filter chips and layout segments. Nothing clipped.
- Panes at 142 to 189 px: Source Control, a diff tab and Search. Search draws the query box, root picker and the three chips in the bar, Search in the header, and its error box with Search again. The diff tab's header clips three controls into the popover; the "more" button opens it; the clipped More Actions menu opener opens its menu with the mouse while the popover stays open; a pick (Refresh) closed both after the fix; Escape closes the popover and returns the focus to the "more" button.
- Source Control at 189 px: file names are cut to one or two letters, because the row actions take their width while hidden at opacity 0, as the brief's item 5 rules. Nothing was changed for it.

## Agents' usage

- Brief check: claude-sonnet-5-5, 327,546 tokens, 88 tool uses, 14.4 min.
- First builder (died, no report): first run of the cases 302,766 tokens, 52 tool uses, 11.1 min. Its six helper agents' usage is not recorded in the ledger, so it is not verified here.
- Second builder (claude-sonnet-5-5): 154,209 tokens, 414 tool uses, 84.5 min (1 full-list run); round 1 258,462 tokens, 53 tool uses, 17.9 min (1 full-list run).
- Reviewer, first run: claude-sonnet-5-5, 340,175 tokens, 160 tool uses, 36.1 min; 4 Spec, 6 Proof, 3 Standards, 4 Behaviour findings.
- Reviewer over round 1: claude-sonnet-5-5, 185,397 tokens, 63 tool uses, 14.1 min; 0 Spec, 0 Proof, 4 Standards, 2 Behaviour findings.
- The builder's first report did not pass its bar (17 findings, one repair round). Seven fixes at landing, counting the merge.

## Next

Rule D27's three cases and D35's test-path case, resume both builders, then /spec Q85d on the new main.
