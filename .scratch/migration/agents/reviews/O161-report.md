# O161 report: cheaper cards (cases ruling, with the clash ruling's option 2)

Everything in the brief is done. The boundaries case "holds no process-wide state under src" passes on the final tree.

## Open items of the state file (`orchestrator-state.md:216-220`, verbatim)

## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

None.

## The cases' first run (unchanged tree)

- C1: the `pageOf` describe of `tests/state/forms/page-entry.test.ts` passed on the unchanged code: `Tests  31 passed (31)` (saved at `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/c1c2-before.txt`). This count includes C2, which was written before any source change.
- C2: the new case "finds the fields and the entries of a feed whose entries are replaced by a new list" passed on the unchanged code in that same run (the passing mark, then `... finds the fields and the entries of a feed whose entries are replaced by a new list 0ms`). Nothing is kept between calls there.
- C3, read in the code: every card is built. `radar/Bucket.svelte:66-70` draws `<CardGrid>{#each ordered as entry, at (...)}<Reveal ...><RadarCard` for each entry, with no windowing.
- C4, read: find works over the built cards, since every card's text is in the DOM (as for C3).
- C5, read: `RecordCard.svelte:328` wraps each card in `<ContextMenu {label} groups={runs} own ...>`. On the unchanged tree, `ContextMenu.svelte` builds bits-ui's Root, Trigger and Portal at mount.
- C6 to C9, read: the cursor, Enter, the reveal, a write the server took, a socket message and the other card views all draw through the same `RecordCard`/`ContextMenu`/`CardActions` path. Their behaviour on the unchanged tree is what the look records.

## Profile mapping (item 1)

These are inclusive times of the app's state code, from `node anal/apptotal.mjs O161prof/litwatch.cpuprofile`, run in the scratchpad. The component self times come from `node anal/owner.mjs ... file` and `fn`. The bits-ui time is split by the app file that calls it, from `node anal/libcaller.mjs ... 'bits-ui|svelte-toolbelt'`. All outputs are saved beside the scripts as `O161-apptotal-final.txt`, `O161-owner-final.txt`, `O161-ownerfn-final.txt` and `O161-bitscaller-final.txt`.

| Profile entry | Time | Source | Done |
|---|---|---|---|
| `pageOf` / `feedPage` | 1697 / 1689 ms | `page-entry.ts` `feedPage`, called per card by RadarCard's `held` (`RadarCard.svelte:106`) and through `editorRows` (869 ms, `entry-actions.ts`, from the `openers` derived `:166`) | `feedEntryOf` looks the entry up in the client's index of that entries array. `peers` is a getter that is listed on first read |
| `feedIdents` / `uniqueIdents` / `feedEntryId` / `feedIdentity` / `readAs` | 1458 / 1426 / 1071 / 904 / 775 ms | `idents.ts`. Each card rebuilt every entry's identity, through zod `readAs` | One `feedIndex` per entries array and kind, held in `client.entities.reads`. `uniqueIdents` reads `base` once per entry |
| `sanitiseSvg` | 584 ms | `Glyph.svelte:51` `{@html sanitiseSvg(drawn.svg)}`, for every icon of every card | The page's `HtmlMemo.icons`, bounded by `MEMO_HELD` |
| `pageFault` | 246 ms | `page-file.ts` feed branch, which counted the entries with the page's id per card | `feedIdCount` from the same index |
| `groupProjects` / `categoriesOf` | 140 / 118 ms | `cross-links.ts`. RadarCard grouped twice per card (`grouped`, then RecordCard on `projects`), and each call re-read the category rows | RadarCard groups once and passes `groups`. `rowsOf` holds the rows per words record in the client's memo |
| `crossLinksOf` / `holdersOf` | 131 / 70 ms | `radar.ts`. The holders map was rebuilt per card | `projectHolders` per projects map, in the client's memo |
| `unsavedFile` / `dirtyTabAt` / `openDrafts` / `draftOf` | 116 / 116 / 106 / 93 ms | `source.svelte.ts`. Every card walked every draft | `dirtyFiles` derived, recomputed only when a tab changes |
| `pageFile` / `viewSourceFile` / `collectionPath` / `collectionFiles` | 110 / 101 / 101 / 99 ms | `page-file.ts` and `view-source.ts`. The collections list was re-read per card | `listedFiles` per config value, in the client's memo |
| `inlineMarkdown` | 54 ms | `html.ts`, the note, threat and title of each card | The page's `HtmlMemo.plain` and `HtmlMemo.math` |
| CardActions `(anon) :184` | 286 ms self | `CardActions.svelte` placement effect, which set up a ResizeObserver over the line, its children and every clipping ancestor, plus `getComputedStyle` per ancestor, at mount | Deferred to the strip's first draw (item 5 below) |
| Tooltip | bits-ui 223 ms + own 167 ms | `ui/menu/Tooltip.svelte`, bits-ui Root/Trigger per control | Built on first pointer event, focus-open or rest |
| ContextMenu | bits-ui 168 ms + own 108 ms | `ui/menu/ContextMenu.svelte` from `RecordCard.svelte:328` | Built on first right-click, menu key, Shift+F10 or long press |
| Menu.svelte | bits-ui 78 ms | the card's "..." menu | Under 100 ms; not changed |
| RadarCard `get actions` / `:586` / `why :530` | 197 / 112 / 36 ms self | the `actions` derived (`RadarCard.svelte:200`) and the runtime reads of it. Its cost was the `pageOf` chain it calls | Made cheaper through `pageOf`. The derived itself is what the card draws |
| RecordCard / Card | 121 / 76 ms file self | spread over their templates (Card's top function `Card :16` is 35 ms) | No single per-card piece over 100 ms; not changed |
| `getClientRects` | 170 ms | `ui/frame/toolbar/Toolbar.svelte:106-109` `measure`, one forced layout of the new DOM per toolbar, not per card | Stays: it is the toolbar's fold, and the layout cost belongs to the new cards' first layout |
| `getBoundingClientRect` | 97 ms | `ui/tabs` tab-scroll (`:94-107`), one block, not per card | Stays, for the same reason |
| GC / Svelte runtime | 384 ms / about 1.2 s | follow from the work above | Not cut directly |

## DONE / NOT DONE

| Item | State | Evidence |
|---|---|---|
| 1 profile mapping | DONE | table above; scripts and outputs named |
| 2 page found in time independent of the card count | DONE | `idents.ts` `feedIndex` over `ReadMemo.held`; `page-entry.ts` `feedPage` uses `feedEntryOf` with `sources.reads`; C1 and C2 pass (run 8 below) |
| 3 menu built when first opened | DONE | `ContextMenu.svelte` `{#if menu.built \|\| open}`; the harness below matches the unchanged tree |
| 4 markdown once per text and per math | DONE | `html.ts` `inlineMarkdown(text, math, memo)` reads `memo.plain` without math and `mathMemo(memo, math)` with it; every component caller passes the page's memo (list below); `tests/ui/html.dom.test.ts` passes |
| 5 CardActions and layout reads | DONE | `CardActions.svelte` effect; the two layout reads stay, with the reason in the table |
| 6 nothing a reader sees changes | DONE by tests and harness; the look is C3 to C9 | harness below |
| 7 comments | DONE | head comments section below |
| 8 estimate | DONE | below |
| Clash ruling, option 2: memos per client, no module state, no `FROZEN` name | DONE | `boundaries.test.ts` verbose run on the final tree: the passing mark, then `... layer boundaries > holds no process-wide state under src 478ms`, `Tests  11 passed (11)`; `git diff --stat -- tests/checks` and `git status --short tests/checks` print nothing |
| Clash ruling: every `Glyph` and `inlineMarkdown` caller named with its memo | DONE | section "Where each memo comes from" |
| Redo ruling: the twelve script-edited files restored to the base and edited again with Edit and Write | DONE | `diff` of each against its copy in `O161-before-redo/` prints nothing (judgment calls, rule breach line); harness, scoped runs and run 8 after it pass |

Checks as printed:

- `npm run test:quick`, eighth full run, after the last change (the redo of the twelve files below), as printed:
  ```
  test:quick: 56 changed file(s), from git since HEAD
  test:quick: 84 test file(s)
          tests/checks/tree/boundaries.test.ts: imports at depth 1
  ok      prettier (1.0 s): All matched files use Prettier code style!
  ok      ASCII gate (1.1 s)
  ok      svelte-kit sync (2.4 s)
  ok      eslint (3.0 s)
  ok      svelte-check (13.3 s): 1794009412538 COMPLETED 585 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
  ok      vitest (100.8 s): Duration  84.49s ...
  ok      vitest checks (112.4 s): Duration  95.98s ...
  ok      vitest slow (134.0 s): Duration  117.82s ...
  test:quick: 136.5 s; every command passed
  ```
  The 56 changed files are the 55 of the earlier runs and the untracked brief `O161-redo.md` (`git status --short --untracked-files=all | grep -c .` prints 56). The boundaries file's verbose run after it printed the passing mark, then `... layer boundaries > holds no process-wide state under src 478ms`, `Tests  11 passed (11)`. The quick tier says of itself: `test:quick: not covered: tests that reach no changed file within the import depth`.
- The full list ran eight times in total. `npm run diagrams` ran right before each run and printed `diagrams exit 0` (`npm run diagrams > /dev/null 2>&1; echo "diagrams exit $?"` before run 8).
  - Run 7, the first after the redo, ran with a `grep` filter on its output that failed (`grep: repetition-operator operand invalid`), so none of its result lines were printed. Run 8 is the run quoted above.
  - Run 6 (`O161-quick6.txt`) printed `every command passed`, before the redo.
  - Runs 1 to 3 came before the clash ruling.
  - Run 4 (`O161-quick4.txt`) passed every command but `vitest slow`, where `hub-portfolio.test.ts > the portfolio of several hubs > holds every record of both hubs, each under the name of its hub's folder` timed out at 20000 ms. Rerun alone as the slow tier runs it (`npx vitest run tests/data/hubs/hub-portfolio.test.ts --tagsFilter slow --testTimeout 20000`): `Tests  16 passed (16)`, `Duration  43.13s`. The load during run 4 was `load averages: 18.73 15.84 15.57` (`uptime`).
  - Run 5 (`O161-quick5.txt`) printed `every command passed`. After it, two comment paragraphs were rewrapped (the head of `shapes.ts` and of `Glyph.svelte`), and run 6 followed.
- The diagrams: `npm run diagrams` rewrites eight files under `docs/diagrams/` (`git diff --stat docs`: `channels`, `layer-state`, `layer-views`, `layers`, each `.dot` and `.svg`, 15 lines each way). The changes are counts and one line number: `entities.svelte.ts:56` to `:59` in `channels.dot`, `state/client to state/shared` 10 to 11, `views/academic to ui` 67 to 68, `routes to ui` 13 to 17, `views to ui` 1102 to 1103.
- Verify 2, scoped tests: the 32 test files that imported a changed file when the six record and entry components were not yet changed, plus `size.test.ts`, run by `npx vitest run tests/checks/tree/size.test.ts <the list> --reporter=dot --testTimeout 30000` (list in `O161-scoped-files2.txt`). Run again after the redo of the twelve files: `Test Files  33 passed (33)`, `Tests  541 passed (541)`. The tests that name one of the twelve files directly (`git grep -l -E "structure/cross-links|feeds/radar|source/source\.svelte|sessions/view-source|ui/html|menu/ContextMenu|menu/Menu\.svelte|MenuOpener|menu/Tooltip|RadarCard|CardActions|PickMenu" -- 'tests/**/*.test.ts' ':!tests/checks'`: `front-matter.test.ts`, `server/edit/feeds.test.ts`, `source-unserved.client.test.ts`, `source.test.ts`, `ui/html.dom.test.ts`) are all in that list. After the last code changes, `npx vitest run tests/checks/source tests/checks/tree tests/checks/imports --testTimeout 60000`: `Test Files  12 passed (12)`, `Tests  107 passed (107)`.
- Verify 3, the ASCII gate (`perl -ne 'print ... if /[^\x00-\x7F]/'`) over the 42 changed and new files under `src` and `tests`, `read-memo.ts` and `ui/menu/trigger/*` among them: printed nothing.
- Verify 4, `wc -l`: in the files table below. The largest are `context.ts` 879, `source.svelte.ts` 866 and `html.ts` 804 (each at most 880), and the largest components are `LeadCard.svelte` 455 and `Tooltip.svelte` 444 (each at most 520).
- Verify 5, `sh utils/unused-exports.sh` compared with `.agents/worktrees/O161-base/unused-exports.txt`: `diff` printed nothing, so the step adds no unused export.
- Verify 6, the history-word grep over the 257 added or changed comment lines and test titles (`O161-added-comments.txt`). It hit 14 lines:
  - 11 are "before" in the running sense ("before the part is built", "the same element before and after", "the icon filter of ui/html.ts before it is put into the page");
  - 2 are "no longer holds" of a running client ("a list the client no longer holds is let go with its index", `idents.ts`; "an object the client no longer holds is let go with what", `read-memo.ts`);
  - 1 is "session" in "a long session that draws many distinct texts" (`html.ts` `MEMO_HELD`), a reader's session.

  None of them compares with an earlier state of the code. `tests/checks/source/history.test.ts` passes.
- Comment width: `tests/checks/source/comment-width.test.ts` passes. A scan of every changed comment line for a line inside a sentence whose next word would still fit in 100 columns found two short lines, in the heads of `shapes.ts` and `Glyph.svelte`, and both paragraphs are rewrapped. The other hits are lines of 90 to 97 columns whose next word fits within a column or two, and they are left as wrapped.
- Folder counts (`ls -A | wc -l`): `state/shared/stores` 8, `state/client` 10, `ui` 10, `ui/menu` 10, `ui/menu/trigger` 3, `ui/display` 10.
- `npx eslint` and `npx prettier --check` over the 42 files: exit 0 and `All matched files use Prettier code style!`. `npx svelte-check --threshold error`: `4620 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
- Helper greps (spec line 89) over the base's `src` and `tests`:
  - `grep -rn -E "lazyTrigger|lazy-trigger|TriggerProps"` printed nothing.
  - `grep -rn -i -E "\blru\b|evict|bounded (map|cache)"` printed nothing.
  - The existing `remembered` (`lsp/references.ts:155`) and `rowsOf` (`semantic.ts:106`, `cv.ts:183`, `setting.ts:70`, `primary-key.ts:60`) are local functions with other jobs. The new ones are local too.
- The renamed and reshaped names, grepped over `src`, `tests`, `config`, `docs` and `README.md` (`git grep -n -E "inlineMarkdown|sanitiseSvg|feedIdents|groupProjects|viewSourceFile|crossLinksOf|createEntities|EntitiesStore|tip-ids|provideTipIds" -- docs README.md ':!docs/diagrams'`): no hit in a document. Every caller in `src` is listed below.

## Where each memo comes from (the clash ruling)

Two per-client objects hold the seven memos. Neither is module state.

- **`client.entities.reads`**, a `ReadMemo` (`state/shared/stores/read-memo.ts`). `createEntities()` (`entities.svelte.ts:79`) makes one per client, and `context.ts:180-181` hands it to the pages store: `const paged = { snapshot: entities.portfolio, feeds: entities.feeds, reads: entities.reads }; const pages = createPages(paged, settled);`. It holds the four state memos: the feed index (`idents.ts`), the project holders (`radar.ts`), the collection files (`view-source.ts`) and the category rows (`cross-links.ts`). Each is a WeakMap entry keyed by the payload object it reads.
- **The page's `HtmlMemo`** (`ui/html.ts`). Each of the four route roots makes one and provides it through Svelte's context, as `provideTipIds` does: `src/routes/+page.svelte:81`, `src/routes/find/+page.svelte:26`, `src/routes/present/print/+page.svelte:49` and `src/routes/present/show/+page.svelte:63` (`git grep -n provideHtmlMemo` lists these four). `useHtmlMemo()` reads it while a component initialises. It holds the icon filter memo and the two markdown memos, each bounded by `MEMO_HELD = 2000`.

`src/routes/+layout.svelte` draws only `{@render children()}`, and no `mount`, `hydrate` or `createRawSnippet` appears in `src` (`git grep -n -E "createRawSnippet|\bmount\b|..."` prints nothing). So every component sits under one of the four route roots.

`inlineMarkdown` callers (`git grep -n "inlineMarkdown(" -- src`):

| Caller | Memo |
|---|---|
| `views/feeds/inbox/InboxCard.svelte:246` | `useHtmlMemo()` |
| `views/feeds/leads/Leads.svelte:263` | `useHtmlMemo()` |
| `views/shared/card/feed/LeadCard.svelte:332, 345, 363` | `useHtmlMemo()` |
| `views/shared/card/feed/RadarCard.svelte` note, threat, title | `useHtmlMemo()` |
| `views/shared/card/record/registry/DatasetCard.svelte:141, 193, 213` | `useHtmlMemo()` |
| `views/shared/card/record/registry/DomainCard.svelte` blurb, title | `useHtmlMemo()` |
| `views/shared/card/record/registry/LineCard.svelte` goal, funding, blurb, title | `useHtmlMemo()` |
| `views/shared/card/record/registry/VenueCard.svelte` wants, name | `useHtmlMemo()` |
| `views/shared/card/record/sets/ArchivalCard.svelte` blurb | `useHtmlMemo()` |
| `views/shared/card/record/sets/OrphansCard.svelte` blurb | `useHtmlMemo()` |
| `views/shared/forms/entry/card/EntryFields.svelte` the two long-field sites | `useHtmlMemo()` |
| `views/academic/present/markup.ts:99` `words(text, memo)`, outside a component | handed in by its one caller, `present/parts/Words.svelte` (`useHtmlMemo()`). `body()` calls `blockMarkdown`, not `inlineMarkdown` |

`sanitiseSvg` has one caller, `ui/display/Glyph.svelte:54`, which reads `useHtmlMemo()` itself. So every `Glyph` gets the memo of the route root above it, and no Glyph caller hands one in. The 71 components that import Glyph (`git grep -l "import Glyph from" -- src | wc -l` prints 71) are, under `src/lib/`:

- `shell/`: `commands/debug/DebugToolbar`, `panes/DropLayer`, `rail/RailPages`, `rail/UpdateTray`, `status/AppItems`, `status/RepoItems`, `status/StatusBar`, `status/notices/NoticeEntry`.
- `ui/`: `controls/Chip`, `controls/Tag`, `controls/ToolButton`, `controls/heads/FoldHead`, `controls/heads/GroupHead`, `display/ticker/Ticker`, `display/ticker/TickerGroup`, `forms/choice/GlyphList`, `forms/choice/GlyphSelect`, `forms/choice/MultiSelect`, `forms/choice/Select`, `forms/choice/select/FieldSelect`, `frame/Empty`, `frame/toolbar/Toolbar`, `menu/MenuList`, `tabs/Breadcrumb`, `tabs/TabFace`, `tree/Disclosure`, `tree/TreeItem`, `tree/row/FoldLine`, `tree/row/RowIcon`.
- `views/`: `apps/Apps`, `boards/focus/CommandCenterView`, `boards/focus/FocusFilter`, `boards/focus/Tasks`, `boards/focus/lanes/LaneCard`, `boards/focus/lanes/LaneHead`, `feeds/linkedin/Linkedin`, `feeds/literature/Literature`, `feeds/literature/LiteratureCard`, `personal/account-setup/GitSteps`, `personal/account-setup/GoogleSteps`, `personal/account-setup/MicrosoftSteps`, `sessions/session-list/SessionWorkspace`, `sessions/terminal/TerminalTitle`, `sessions/terminal/list/RowFace`, `sessions/terminal/start/worktree/WorktreeToggle`, `sessions/terminal/transcript/TurnRun`, `shared/card/feed/LeadCard`, `shared/card/feed/RadarCard`, `shared/card/project/CardAddresses`, `shared/card/record/registry/DatasetCard`, `shared/card/record/registry/LineCard`, `shared/card/record/registry/VenueCard`, `shared/card/record/sets/ArchivalCard`, `shared/card/record/sets/OrphansCard`, `shared/changes/CommitBox`, `shared/forms/bar/PickMenu`, `shared/forms/dated/Followups`, `shared/forms/dated/Subtasks`, `shared/forms/entry/card/EntryLink`, `shared/links/CrossLinks`, `sources/doc/MarkdownPreview`, `sources/files/sections/OpenEditors`, `sources/repositories/RepoList`, `sources/repositories/graph/CommitRow`, `sources/source/save/DiskNote`, `sources/source/save/LockedCode`, `sources/source/save/SourceNote`, `sources/venues/Ribbon`, `system/machine/debug/Console`, `system/workbench/Pages`, `system/workbench/Workbenches`.

A component mounted by a test with no provider above it gets `undefined` from `useHtmlMemo()`. It then filters and parses as on the unchanged tree.

The state memos' callers (`git grep -n -E "(feedIdents|feedEntryOf|feedIdCount|feedIndex|crossLinksOf|projectHolders|groupProjects|viewSourceFile|collectionPath|listedFiles)\(" -- src`):

- These pass `client.entities.reads`:
  - `feedIdents`: `Leads.svelte:99`, `Linkedin.svelte:84`, `Radar.svelte:92`, and `page-entry.ts:405` (`settle.feed`, through `sources.reads`);
  - `feedEntryOf`: `page-entry.ts:222` (`feedPage`, from `pageOf` with `sources.reads`);
  - `feedIdCount`: `page-file.ts:77`;
  - `crossLinksOf`: `RadarCard.svelte:130`. It hands the memo on to `projectHolders` (`radar.ts:143`);
  - `groupProjects`: `RadarCard.svelte:132` and `RecordCard.svelte:170` (`entities: { reads }` from `useState()`);
  - `viewSourceFile`: `page-file.ts:18` and `:58`. It hands the memo on to `collectionPath` and `listedFiles` (`view-source.ts:67, 88, 90`).
- These pass no memo and do the work as on the unchanged tree:
  - `palette.ts:232` `feedIdents`, once per list when the palette builds its index.
  - `ProjectCard.svelte:122` `groupProjects`. It is in O164's path list, which this step does not write.
  - `cross-links.ts:141, 184, 220`, `groupProjects` called inside the module by functions that get no memo.
  - `viewSourceFile` once per view or per action: `write-files.ts:162, 192`, `Collection.svelte:150, 168`, `boards/focus/rows.ts:129` (O164's path list), `Person.svelte:121`, `Leads.svelte:120`, `Radar.svelte:95`, `lead-apply.ts:63` (on the Apply action), `page-file.ts:52` (the career page) and `registry-file.svelte.ts:60` (once per registry view).
- `Settings.svelte:277-279` call a different `listedFiles`, the one in `state/system/config/view/folders`.

## Files (`diff -rq -x local.yml` against the base copy over src, tests, config, utils)

`diff -rq` lists 41 entries: 37 changed files, the new `read-memo.ts`, the new folder `ui/menu/trigger`, and `MenuOpener.svelte`, which is only in the base. Line counts are `wc -l`, base then now.

| File | Lines | Why it is in the step |
|---|---|---|
| `src/lib/state/shared/stores/read-memo.ts` | new, 26 | the per-client `ReadMemo` (clash ruling) |
| `src/lib/state/shared/stores/shapes.ts` | 550 -> 565 | the `ReadMemo` type and `EntitiesStore.reads` (clash ruling) |
| `src/lib/state/client/entities.svelte.ts` | 124 -> 128 | makes the memo per client (clash ruling) |
| `src/lib/state/client/context.ts` | 878 -> 879 | hands `reads` to `createPages` (clash ruling) |
| `src/lib/state/shared/page/idents.ts` | 80 -> 146 | item 2, the index per entries array |
| `src/lib/state/forms/page-entry.ts` | 421 -> 435 | item 2: `feedPage`, `pageOf`, `PageSources.reads` and `settle.feed`'s call (clash ruling) |
| `src/lib/state/boards/structure/cross-links.ts` | 356 -> 376 | item 1, `groupProjects` / `categoriesOf` |
| `src/lib/state/feeds/radar.ts` | 161 -> 176 | item 1, `crossLinksOf` / `holdersOf` |
| `src/lib/state/sessions/view-source.ts` | 78 -> 93 | item 1, `viewSourceFile` / `collectionFiles` |
| `src/lib/state/sessions/source/source.svelte.ts` | 862 -> 866 | item 1, `unsavedFile` / `dirtyTabAt` |
| `src/lib/ui/html.ts` | 712 -> 804 | items 1 and 4: `HtmlMemo`, `provideHtmlMemo`, `useHtmlMemo`, `sanitiseSvg`, `inlineMarkdown` |
| `src/lib/ui/display/Glyph.svelte` | 101 -> 104 | hands the page's memo to `sanitiseSvg` (clash ruling) |
| `src/lib/ui/menu/ContextMenu.svelte` | 189 -> 237 | item 3 |
| `src/lib/ui/menu/Tooltip.svelte` | 394 -> 444 | item 1, the Tooltip entry |
| `src/lib/ui/menu/Menu.svelte` | 213 -> 213 | import path and one comment path, after the move of MenuOpener |
| `src/lib/ui/menu/MenuOpener.svelte` -> `src/lib/ui/menu/trigger/MenuOpener.svelte` | 299 -> 299 | at its new path (folder rule), copied there from the base with `cp` under the redo ruling and old path absent; only its two import paths change |
| `src/lib/ui/menu/trigger/TriggerProps.svelte` | new, 20 | items 1 and 3, the shared lazy build |
| `src/lib/ui/menu/trigger/lazy-trigger.svelte.ts` | new, 63 | items 1 and 3, the shared lazy build |
| `src/lib/views/shared/forms/bar/PickMenu.svelte` | 321 -> 321 | import path, head comment rewrapped |
| `src/lib/views/shared/card/record/CardActions.svelte` | 306 -> 344 | item 5 |
| `src/lib/views/shared/card/record/RecordCard.svelte` | 356 -> 361 | passes the client's memo to `groupProjects` (clash ruling) |
| `src/lib/views/shared/card/feed/RadarCard.svelte` | 398 -> 403 | items 1 and 4, its memos (clash ruling) |
| `src/lib/views/shared/card/feed/LeadCard.svelte` | 454 -> 455 | item 4, the page's memo (clash ruling) |
| `src/lib/views/feeds/inbox/InboxCard.svelte` | 374 -> 375 | item 4, the page's memo (clash ruling) |
| `src/lib/views/feeds/leads/Leads.svelte` | 318 -> 319 | items 2 and 4, both memos (clash ruling) |
| `src/lib/views/feeds/linkedin/Linkedin.svelte` | 359 -> 359 | item 2, the client's memo (clash ruling) |
| `src/lib/views/feeds/radar/Radar.svelte` | 230 -> 230 | item 2, the client's memo (clash ruling) |
| `src/lib/views/shared/card/record/registry/DatasetCard.svelte` | 275 -> 276 | item 4, the page's memo (clash ruling) |
| `src/lib/views/shared/card/record/registry/DomainCard.svelte` | 122 -> 123 | item 4, the page's memo (clash ruling) |
| `src/lib/views/shared/card/record/registry/LineCard.svelte` | 206 -> 207 | item 4, the page's memo (clash ruling) |
| `src/lib/views/shared/card/record/registry/VenueCard.svelte` | 374 -> 375 | item 4, the page's memo (clash ruling) |
| `src/lib/views/shared/card/record/sets/ArchivalCard.svelte` | 97 -> 98 | item 4, the page's memo (clash ruling) |
| `src/lib/views/shared/card/record/sets/OrphansCard.svelte` | 72 -> 73 | item 4, the page's memo (clash ruling) |
| `src/lib/views/shared/forms/entry/card/EntryFields.svelte` | 348 -> 349 | item 4, the page's memo (clash ruling) |
| `src/lib/views/academic/present/markup.ts` | 101 -> 105 | `words(text, memo)`, given the memo by its component (clash ruling) |
| `src/lib/views/academic/present/parts/Words.svelte` | 68 -> 72 | hands the page's memo to `words` (clash ruling) |
| `src/lib/views/shared/forms/entry/edit/page-file.ts` | 82 -> 90 | items 1 and 2, the client's memo (clash ruling) |
| `src/routes/+page.svelte` | 355 -> 357 | provides the page's `HtmlMemo` (clash ruling) |
| `src/routes/find/+page.svelte` | 136 -> 138 | provides the page's `HtmlMemo` (clash ruling) |
| `src/routes/present/print/+page.svelte` | 221 -> 223 | provides the page's `HtmlMemo` (clash ruling) |
| `src/routes/present/show/+page.svelte` | 325 -> 327 | provides the page's `HtmlMemo` (clash ruling) |
| `tests/state/forms/page-entry.test.ts` | 385 -> 410 | C2 |

The generated `docs/diagrams/{channels,layer-state,layer-views,layers}.{dot,svg}` change as `npm run diagrams` writes them. `ui/menu` holds 10 items, as in the base, and `ui/menu/trigger` holds 3. `Card.svelte` is unchanged. `git grep "ui/menu/MenuOpener"` finds the old path only in old briefs under `.scratch/`, which are ledger records.

## User-visible changes and what the look compares

There is no intended user-visible change. The DOM at rest differs only in bits-ui's own attributes. Before a card's menu or a control's tooltip is first used, the wrapper carries no `id="bits-*"`, `data-state`, `data-context-menu-trigger`, `data-tooltip-trigger` or `data-delay-duration`. The `style="pointer-events: auto;"` and the text are as today. Once the menu or tooltip is built, the attributes are bits-ui's own.

The markdown and icon memos give the HTML that the same call gives with no memo, since each result is a pure function of its key. RadarCard's threat line keeps its template: the compiled template of the paragraph is `<p class="threat ..."><!> <span></span></p>` for the base and for the final file (read from `svelte/compiler`'s `compile` output of both). Its lint comment is now the `eslint-disable` / `eslint-enable` pair around the span, as `views/shared/prose/Code.svelte:51,59` uses, because prettier breaks the longer `{@html}` call over lines.

A case-run harness mounted `TooltipGroup > ContextMenu > <p>before <Tooltip><button></Tooltip> after</p>` in jsdom against the base copies and against the final menu code. Its source is in `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/lazy-scratch/` (base) and `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/lazy-scratch-final/` (final). After the redo of the twelve files, its three final files were placed in `tests/ui/menu/` again with Write, run with `npx vitest run --config tests/ui/menu/scratch.config.ts --silent=false --reporter=verbose`, and removed with `rm` (`git status --short tests` then shows only `page-entry.test.ts`). That run printed `Tests  5 passed (5)` and these lines on the redone code, the same as the run before the redo (`O161-harness-final.txt`):

```
lazy REST TEXT "before Press Words after "
lazy OPEN TEXT "before Press Words after "
lazy RIGHT [false,true] true
lazy PICK ["two"] [false,true,false] press
lazy KEY [false,true] 2
lazy MOVE Words delayed-open
lazy DRAG true none
lazy TOUCH [false,true] 2
```

The base gave the same RIGHT, PICK, KEY, MOVE, DRAG and TOUCH lines, and the rest text `"before Press Words after "` (`lazy-compare.txt`, `rest-compare.txt`).

What the look should compare:

- C3: the 678 cards' count and the joined `textContent` hash.
- C4: the Cmd+F count and order, and Enter and Shift+Enter, in the tab and in the find bar.
- C5:
  - Right-click, the menu key and Shift+F10 on a card that has never opened its menu: same items, same order, same place.
  - Escape returns the focus to the control.
  - A second card's menu opened while one is open.
  - A long press on touch.
  - The menu over the other surfaces (z-order).
- Tooltips:
  - The first hover over a never-used control opens after the rest delay.
  - A drag passing over opens none.
  - Keyboard focus opens it.
  - A tree row's `over` rest opens it.
- CardActions:
  - On a hover screen, the strip's place (`over`) at rest and on the first hover of a card.
  - A narrowed pane after the first hover.
  - A card with chips and one without.
- Icons and markdown: the cards of Lit Watch, Position Leads, Inbox, Data, Domains, Pillars and Venues, and a slide in the Present view, in the print route and in the audience window, draw their icons and their Markdown fields (with a formula once KaTeX is in) as on the unchanged tree.
- C6 to C9 as written.
- Item 8's timing for Lit Watch and the Projects board.

## Head comments

- `read-memo.ts`: new head comment ("Layer 2, client state. One client's memo of what is read out of an object it is given whole and never changes in place ..."), and a doc comment on `createReadMemo`.
- `shapes.ts` head: rewritten (it names the memo of reads over the payloads), rewrapped as one paragraph. `ReadMemo` and `EntitiesStore.reads` have doc comments.
- `entities.svelte.ts` head: rewritten (lines 1-3 name `reads`; a paragraph says it is per client and let go with the payloads).
- `context.ts`: no comment changed; the head comment is still true.
- `idents.ts` head: rewritten (`feedIndex` read through the client's memo). `feedIndex`, `feedEntryOf` and `feedIdCount` have doc comments, and `feedIdents`'s is rewritten for its `reads` argument.
- `page-entry.ts`: the `feedPage` doc is rewritten (index lookup, `peers` on first read, the memo), and `PageSources.reads` has a doc comment. `pageOf` and `settle.feed` docs are still true.
- `page-file.ts` head and `pageFault` doc: still true.
- `html.ts`: the head has a new paragraph on the page's `HtmlMemo`. `MEMO_HELD`, `HtmlMemo`, `createHtmlMemo`, `HTML_MEMO`, `provideHtmlMemo`, `useHtmlMemo`, `remembered`, `mathMemo` and `inlineDrawing` have new doc comments. The docs of `sanitiseSvg` and `inlineMarkdown` are rewritten.
- `Glyph.svelte` head: rewritten (the page's memo), its paragraph rewrapped.
- `markup.ts`: `words`' doc rewritten for `memo`. Its head is still true. `Words.svelte` head: still true.
- The four route roots: no comment changed. Their heads are still true.
- `radar.ts` `crossLinksOf`, `view-source.ts` `collectionPath` and `viewSourceFile`, `cross-links.ts` `groupProjects` and `rowOrder`: rewritten where they now read a memo. The new readers (`projectHolders`, `listedFiles`, `rowsOf`) have doc comments.
- `source.svelte.ts` `dirtyFiles`: new. `dirtyTabAt` is still true.
- `ContextMenu.svelte` head: rewritten (a paragraph on the build on first use). `Tooltip.svelte` head: rewritten likewise.
- `TriggerProps.svelte` and `lazy-trigger.svelte.ts`: new head comments.
- `MenuOpener.svelte` head: still true. `Menu.svelte`'s comment naming its path is rewritten. `PickMenu.svelte` head: still true, rewrapped.
- `CardActions.svelte` head: the paragraph on measuring is rewritten.
- `RadarCard.svelte` `linkGroups`: new doc. `RecordCard.svelte` the strip groups' doc: rewritten (the memo). The heads of RadarCard, RecordCard, InboxCard, Leads, Linkedin, Radar, LeadCard, DatasetCard, DomainCard, LineCard, VenueCard, ArchivalCard, OrphansCard and EntryFields are still true.
- `views/shared/latex/card-math.svelte.ts:4` (not changed) shows the call as `inlineMarkdown(text, cardMath(text))`: still true, since a call with or without the memo is drawn again in the same way when KaTeX loads.
- Docs:
  - `docs/HELP.md`, `docs/data-map.md` and `docs/decks.md` are not changed.
  - No sentence in them is made false. The grep over them for menu, tooltip, identity, sanitise and markdown found nothing the change contradicts, and the grep of the changed names over `docs` and `README.md` (above) has no hit.
  - `HELP.md:302` ("The "...", a right-click on the card, and the context menu key or Shift+F10 on one of its controls open the menu") is still true.

## Judgment calls

- The state memos live on the entities store (`client.entities.reads`) rather than as a new store on `ClientState`.
  - They are reads over the payload objects that store holds, and they are let go with them.
  - `context.ts` stands at 879 of 880 lines, and `state/client` holds 10 items, so a new store module there is not possible without a split.
- The ui memo lives in `ui/html.ts`, beside the functions it serves. `ui/` and `ui/display` hold 10 items each, so a separate module there would break the folder rule. It is provided at the four route roots, beside `provideTipIds`.
- The `HtmlMemo` is passed to every component caller of `inlineMarkdown`, not only to the cards the profile names. Ruling item 4 asks for one result per distinct text, shared, and before the clash ruling every caller shared the module memo.
  - So the record cards (`DomainCard`, `LineCard`, `VenueCard`, `ArchivalCard`, `OrphansCard`) and `EntryFields` read it too.
  - `VenueCard.svelte` is also being changed by step O166, so the two may touch nearby lines of that file at landing.
- The `ReadMemo.held` keys are the payload object and a read name: `feed index <kind>`, `project holders`, `collection files`, `category rows`.
  - They rely on these objects never being changed in place. `git grep` for `entries.(push|splice|unshift|pop|shift|sort|reverse)(` and indexed writes over `src/lib/state`, `views` and `shell` finds none on a feed's entries.
  - Feed payloads reach the client as whole messages (`entities.svelte.ts` `receive` replaces `messages[channel]`), so a new message brings new arrays and a fresh index.
- `cross-links.ts` `groupProjects` called with no memo keeps its rows in a map local to that call, so its internal callers still read the rows once per call.
- `sanitiseSvg` is memoised although the cases ruling's path list names only `inlineMarkdown` in `html.ts`. Item 1 brings in any per-card work over 100 ms, and the profile gives it 584 ms from `Glyph.svelte:51`. The memo shares the bound `MEMO_HELD = 2000` with the markdown memos, evicting the oldest key first.
- A memo with math is keyed by the `MathModules` object, then the options object (both WeakMaps), then `JSON.stringify([math.refused, text])`. So a result made with one drawing is served only to the same modules, options and sentence. A call without math reads `plain`, so a result made with math is never served without it, or the reverse.
- The menu and the tooltip are built on the first event their bits-ui trigger answers. That event is then handed to the trigger's own handler after `flushSync`, so it is answered as on a menu built at mount. The tooltip is also built on the first keyboard focus that opens it and on a rest over `over`. The shared part lives in `ui/menu/trigger/lazy-trigger.svelte.ts` (`lazyTrigger`), with `TriggerProps.svelte` handing bits-ui's trigger props to the stable wrapper. Once built, it is kept (decision 2).
- `MenuOpener.svelte` moved into `ui/menu/trigger/`, because `ui/menu` held 10 items (the folder rule).
- CardActions:
  - Until the strip is first drawn, `over` is `line.children.length > 1`. That is what `measure` sets while no width is remembered (`CardActions.svelte` `measure`: `if (unknown || openerWidth === 0) { over = chips; return; }`, and widths are remembered only when drawn).
  - The full observers start on the frame after the first draw.
  - On a device without hover, the strip is drawn at once, so it is measured at mount as before.
- `feedPage`'s `peers` is a getter computed on first read. That is the one non-structural change to the `PageEntry` object. Every reader goes through `page.peers`.
- Rule breach, spec line 66: twelve files were first edited by inline `python3` programs without approval: `cross-links.ts`, `radar.ts`, `source.svelte.ts`, `view-source.ts`, `html.ts`, `ContextMenu.svelte`, `Menu.svelte`, `MenuOpener.svelte`, `Tooltip.svelte`, `PickMenu.svelte`, `RadarCard.svelte` and `CardActions.svelte`. Under `O161-redo.md` the twelve were restored to the base and edited again with Edit and Write:
  - Each was first copied as it stood to `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/O161-before-redo/` at its path (`find ... -type f | wc -l` printed 12).
  - Each was put back with `cp` from `/Users/axelfaes/workspace/oculus/.agents/worktrees/O161-base/`, `MenuOpener.svelte` to `src/lib/ui/menu/trigger/MenuOpener.svelte`; `test -e src/lib/ui/menu/MenuOpener.svelte` prints that the old path is absent.
  - Every change of the step to them was made again with Edit, hunk by hunk over the base copy.
  - `diff` of each against its saved copy, run after the redo, is empty for all twelve: `same` printed for `cross-links.ts`, `radar.ts`, `source.svelte.ts`, `view-source.ts`, `html.ts`, `ContextMenu.svelte`, `Menu.svelte`, `trigger/MenuOpener.svelte`, `Tooltip.svelte`, `PickMenu.svelte`, `RadarCard.svelte` and `CardActions.svelte`.

  Every other edit of the step, all of the clash ruling's work included, is made with Edit or Write. `npx prettier --write` was run on the changed files before the redo; after it, `prettier` in run 8 prints `All matched files use Prettier code style!`, so no formatting write was needed.
- Shell commands that created or deleted files in the worktree:
  - Scratch harness files under `tests/ui/menu/` were made by heredoc, redirect and `sed -i`, and later by Write; the run after the redo placed them with Write. All were removed with `rm`, and `git status --short tests` shows only `page-entry.test.ts`.
  - `rm -r node_modules/.cache/eslint` deleted the worktree's own untracked eslint cache. It held a stale result for `ContextMenu.svelte` and `Tooltip.svelte`: a typed rule result that did not see the change in `lazy-trigger.svelte.ts`. Before the deletion, `npx eslint` on the two files without the cache exited 0.
- `.scratch/migration/agents/briefs/O161.md` shows as modified in `git status`. This builder did not make that change: its diff carries ruling 712's text, and its mtime (`stat` printed `Nov  6 20:58:36 2026`) is earlier than the cases ruling file (`Nov  6 21:55:03 2026`). This step does not touch the file.

## Errors in the brief, with evidence

- The cases ruling says `why` (`RadarCard.svelte`) is "its note" and that DOMPurify's time comes from `inlineMarkdown`. In the code, `why` (`RadarCard.svelte:154-156`) is the action-title function `blocked === '' ? own : blocked`. Its 1.41 s inclusive is the `blocked` and `pageOf` chain it reads, while its self time is 36 ms. DOMPurify's per-card time is `sanitiseSvg` from `Glyph.svelte:51` (584 ms inclusive), and `inlineMarkdown` is 54 ms in all.
- The bits-ui inclusive figures (`Floating_layer` 1.84 s, `Context_menu_trigger` 1.14 s and so on) include the card's own content, which the trigger renders as its child. bits-ui's own time, split by caller, is 168 ms under `ContextMenu.svelte` and 223 ms under `Tooltip.svelte`.
- Decisions 1 and 3 of the cases ruling asked for module-level memos, which `tests/checks/tree/boundaries.test.ts:106-114` refuses. The clash ruling replaces them, and the step follows the clash ruling.

## The estimate (item 8), marked as an estimate

Estimate: about 3.7 s of the 7.02 s (about 53%) of per-card work is removed. It is made of:

- the `pageOf` chain, about 1.69 s (one index per list in place of one per card);
- `pageFault`, 0.24 s;
- `sanitiseSvg`, 0.57 s (one filter per distinct icon);
- unsaved-file, 0.11 s;
- `pageFile`, 0.10 s;
- holders, 0.07 s;
- categories and the double grouping, 0.11 s;
- CardActions, 0.28 s;
- Tooltip, about 0.35 s;
- ContextMenu, about 0.25 s.

The figures come from the profile times above, less the one build per list or per distinct key that stays. Holding the memos per client in place of per module changes none of them, since a page has one client and one `HtmlMemo`. The runtime and GC time that follows this work is not counted. The orchestrator's measure at landing settles it.

Usage: (filled by the session)
