# X3e premise recheck against main e7dce01e

**Base.** I changed nothing. Main moved twice during the recheck: fb7f076f, then 7f300a60, then e7dce01e. Only plan files moved after fb7f076f. `git diff --quiet fb7f076f HEAD -- tools/oculus/src tools/oculus/tests tools/oculus/config tools/oculus/HELP.md tools/oculus/DESIGN.md tools/oculus/docs` printed "source unchanged fb7f076f..e7dce01e". Every source number below holds at e7dce01e.

**Plan files.**
- e0d93e78 rewrote `agents/guarded.md`, so G31 is now :71-73.
- `plan.md` gained lines, so the Z lines moved again: `grep -nE "^- Z(440|468|524|527|635) " plan.md` printed 1204, 1232, 1281, 1282 and 1399.
- The plan moves at every write. The brief should cite rulings by id and drop their plan.md line numbers.

**Source commits since 10ac00c69.** Q123 02ac124e, PR1 687cd1d5, E4g c86f10f2, O30b 4ce24363, Q124 abf4356c, PR2 548004bc, Q125 e7952e16, D23 797e1e5d, Q126 6561f82a. `git diff --stat 10ac00c69 HEAD -- src tests config HELP.md DESIGN.md ':!local.yml'` printed "354 files changed, 18296 insertions(+), 4394 deletions(-)".

## 1. Claims that no longer hold, with corrections

"(old N)" is the item of `agents/reviews/X3e-premise-recheck.md` that a correction replaces. Old items not listed here are in the last part of this section.

### Base, plan lines and rulings (brief :7-45)

1. **Brief :45, :43, :49, :97, :108 (old 1-3).** The claim is "read on main at 8411697e8" and the dispatch check `git diff --quiet 8411697e8 <head>`. Both fail.
   - Correct to: read on main at e7dce01e, and the dispatch checks `git diff --quiet e7dce01e <head> -- tools/oculus/src tools/oculus/config tools/oculus/tests tools/oculus/HELP.md tools/oculus/DESIGN.md tools/oculus/docs`. `docs` is added because Q125 and Q126 moved the guides there.
   - The landed-commit sentence names the nine commits above, plus D44, O30, A3 and E4 from the old recheck.
   - The "unchanged since 863cdc7d0" list at :49 is dropped. Too many of its files have since changed (`git diff --stat 10ac00c69 HEAD` above).

2. **Brief :22, :25 (old 4, 5).** Z440 is at plan.md 1204.
   - `grep -n "PROBLEM_READERS\|export function settingProblems" settings.ts` printed :505 and :531, so write `sed -n 497,541p`.
   - The settingReader grep printed :18 (the import) and :98. Unchanged since the old recheck.

3. **Brief :39, :41, :239, :240, :516 (old 6, 7).** Z524 is at plan.md 1281 and Z527 at 1282 (grep above). Cite them by id.

4. **Brief :24 and :159, :163 (old 16).** Z442 cites `auth.ts:97`. `grep -n "missing or stale\|not JSON\|RefusalShape\|export async function tokenedBody" auth.ts` printed:
   - the type `RefusalShape` at :86 (block :86-90);
   - `tokenedBody` at :97 (body :97-112);
   - the two sentences at :105 and :109.

   Correct the brief to :105 and :109, :97-112 and :86-90. D23 added `carriesToken` at :73.

5. **Brief :38 (Z519).**
   - `server.git` is `config/text/server.yml:93-104`, not :85-96. `grep -n "^        [a-z_]*:$" config/text/server.yml` printed git :93 and latex :105.
   - `running.ts` is 144 lines, not 139 (`wc -l`).

6. **Missing ruling (section 4).** The rulings list has no Z635. Add it from plan.md:1399: "Z635 (a): G42 gains a sentence for the desktop app's folder sheet, which no code can close; X3e builds it".

### Files view, reorder and collapse (brief :52-65)

7. **Brief :54.** `config/sources.yml` has `roots:` at :92 and its entries at :93-98, not :88 and :89-94 (`sed -n 92,98p` printed the six entries, cathedra to youtube-downloader). The same correction applies at :94 (":88-94" and "the `languages:` block's comment follows at :97", now :101), :186 (":88-94") and Read 19.

8. **Brief :55.** `grep -n` over bodies.ts and config-write.ts printed:
   - `RootsWrite` at `bodies.ts:120-122` (was :113-115);
   - `rootsShape` at :298-301 (was :288-291);
   - `rootsWrite` at :445;
   - `config-write.ts` `rootsWrite(body)` at :89, the dispatch :89-97 (was :93-102).

   Correct these, and the same numbers at :130 (A2).

9. **Brief :57.** `grep -n "export function setItems\|function listText" list-edit.ts` printed :125 and :78, so `setItems` is :125 (was :113) and `listText` is :78-90 (was :73-84). PR2 changed the file. The comment-line drop the brief describes still holds; `roots.ts` is unchanged.

10. **Brief :58 (old 9).** G31 is now `agents/guarded.md:71`: Code :72, Test :73. `grep -n "^- G3[01]\." guarded.md` printed G30 :68 and G31 :71. Correct ":63" and ":64" to ":72" and ":73", here and at :526 and :672.

11. **Brief :60.**
    - `reorderEntries` is `writes.svelte.ts:342` (old 10).
    - `reorderCollection` is `entries.ts:299`, not :294. `grep -n "export function reorderCollection"` printed 299; Q125 added comment lines.

12. **Brief :61, Files.svelte.** `wc -l` printed 324, not 323. The `grep -n` over its markup printed:

    | Part | Was | Now |
    |---|---|---|
    | OpenEditors | :231-234 | :232-235 |
    | note line | :235-237 | :236-238 |
    | Outside | :238-244 | :239-245 |
    | BookmarkForm | :245-262 | :246-263 |
    | said line | :263-265 | :264-266 |
    | ShowPath | :266-273 | :267-274 |
    | Follow | :274 | :275 |
    | RootedTree | :288-294 | :289-295 |
    | Sections | :296-306 | :297-307, `onpatch` :302 |

13. **Brief :61, Sections.svelte (D23).** It is 153 lines, not 127, and draws six sections. The `grep -n "<Outline\|<Ast\|<MemoryUsage\|<Timeline\|<Bookmarks\|<Notes"` printed:
    - Outline :117;
    - Ast :118;
    - MemoryUsage :119-123;
    - Timeline :124-130;
    - Bookmarks :131-142;
    - Notes :143-153.

    The two new section ids are `ast` and `memory`. Both draw their head through `sections/clangd/ClangdSection.svelte:45` (`<Section ...>`, its `TreeView` at :39), and only once an answer is held (`{#if answer !== null}`, Ast.svelte:52, MemoryUsage.svelte:76).

14. **Brief :61, Outline.svelte.** It is 242 lines, not 188. Its `<Section>` is :206 and its `TreeView` :204, not :160 and :158 (`grep -n "<Section\|<TreeView"`).

15. **Brief :61, other heads.** These hold: OpenEditors :148, Timeline :274, Bookmarks :72, Notes :61. Section.svelte (68), TreeSection.svelte (94) and section-state.ts (30) also hold (`wc -l`).

16. **Brief :62.** `views/sources/files/sections` holds 9 items, not 8 (`git ls-files | cut | sort -u | wc -l`); D23 added `clangd/`.

### Following the disk (brief :67-71)

17. **Brief :67, fs.svelte.ts.** The numbers hold: 840 lines, afterReceive :396-401, relistFolder :445, readListing :467, invalidate :698, refresh :713-717.
    - The Files view's Refresh is `Files.svelte:220`, not :219 (`grep -n onrefresh`).
    - The head comment :17-19 says a folder is re-read by closing and opening it. That is false: `readListing` answers a held listing, and collapse and expand call neither `relistFolder` nor `relist`. C2 already rewrites that comment.

18. **Brief :68, the files channel.** The `grep -n` over watch/git.ts, docs.svelte.ts and commands.svelte.ts printed:
    - the git watcher's `files` publish at `watch/git.ts:243`, inside `reread` :239-255 (was :233-237);
    - `filesShape` at `payloads.ts:112-114` (old 11);
    - `filesMoved` at `docs.svelte.ts:246-254` (was :233-243) and `holds` at :152-158 (was :141-148);
    - the commands follower at `commands.svelte.ts:322-332` (old 12);
    - `fs-history.ts` with `afterReceive` at :65-80 (was :62-80), the `pathUnder` match at :76 (was :74-79), and still 162 lines.

19. **Brief :68, "Three followers" (old 13).** There are seven. `grep -rn "'files'" src/lib` and reading each one gives:
    - the three the brief names;
    - the LaTeX follower, `state/sessions/latex.svelte.ts:355-358`, with `filesMoved` :389-400 calling `holds` at :382;
    - the project files store, `state/sources/files.svelte.ts:85-89`, which marks every query on any `files` message;
    - the app frames: `state/system/apps/rules.ts:102-105`, where a root app keeps a notice only when `notice.root === dir`, and `apps.svelte.ts:296`, :356;
    - new from PR2, the Present store, `state/life/present.svelte.ts:84-89`, which marks every deck on any `files`, `portfolio` or `config` message.

    `holds` has three callers (`grep -rn "holds(" src/lib`): docs :242, commands :330, latex :382. Correct to "Seven followers...", naming them; section 5 item 3 covers what each does with `folders`.

20. **Brief :69, watch/git.ts.** It is 511 lines, not 505 (`wc -l`). O30b added six lines after :80. The new line numbers, from `grep -n` and `sed -n` over the file:

    | Part | Was | Now |
    |---|---|---|
    | `IGNORED` | :80 | :81-86 |
    | `relevant` | :119 | :125 |
    | `heard` | :300 | :306 |
    | `subrepositories` | :144-155 | :150-161 |
    | `scan` | :385 | :391 |
    | `wanted` | :395 | :401 |
    | `follow` | :419 | :425-453 |
    | the workspaces poll | :478-483 | :485-488 |
    | watch callback | :338-340 | :344-346 |

    `IGNORED` now has six names: node_modules, .svelte-kit, build, .svelte-kit-app, build-app, __pycache__. The middle four come from `server/root/process/build-folders.ts:15,18`.

    The head comment :27-31 holds.

21. **Brief :70 (old 14), and :161, :188.** The watcher is built in `startGit` at `context.ts:415-420`, `make.watchGit` at :416 (`grep -n "make.watchGit"` printed 416).

22. **Brief :71.** `fs.ts:482` and `listingAnswer` hold (fs.ts and fs-transport.ts unchanged since 10ac00c69).

### Repositories and Changes (brief :75-84)

23. **Brief :75 (old 15).** `source.svelte.ts` is unchanged since the old recheck: `loadSourceDraft` :300, `LIFETIME` :308, `reloadSource` :370. `openHead` :483 holds.

24. **Brief :76.** `switchBranch` :390 and `switchDetached` :410 hold, and so does the list of test files.

25. **Brief :78, refusal grep.** `grep -rn "failed(\`[a-z]\|failed('[a-z]" src/lib/server | wc -l` printed 64, not 62.
    - The 62 under `server/git` hold per file.
    - The two new hits are `server/machine/lsp/process.ts:137,168` (`events.failed('no_answer'`), which are codes.
    - Correct to: "64, of which 62 under server/git as listed; the two in `server/machine/lsp/process.ts` are refusal codes".
    - Every other number on :78 holds; git-index, git-write, git-refs, git-routes and parse.ts are unchanged. One exception: `deposit-git.ts` imports `GIT` from run.ts at :34, not :33 (:33 is `endWith`).

26. **Brief :78, server.yml.** `grep -n "^        [a-z_]*:$" config/text/server.yml` printed :8, :16, :19, :50, :58, :80, :91, :93, :105, :107, :111.
    - `server.config_key` is :19-49.
    - PR2's new group `deck_slides` is :50-57.
    - `server.config_value` is :58-79 (was :50-71).
    - `local` is at :20 and :59 (was :20, :51).
    - The claim "start with a capital and end with no full stop" no longer holds for the file. `deck_slides.changed` (:51) is two sentences ending in full stops: "...while you were working. Read the deck again and make the change again."
    - Correct ":19-71" (here, :159, :599) to ":19-49 and :58-79", and see section 5 item 5.

27. **Brief :79, the token sentence (old 16, 17, 50).**
    - The call sites. `grep -rn "tokenedBody(" src/lib`, with the definition left out, prints 15 lines: 14 route handlers, plus `gatedBody`'s own call at `auth.ts:122`. At 8411697e8 the same grep printed 13 (`git grep` at 8411697e8), that is 12 direct handlers.
    - The route count. Routes in all = 14 direct + 5 through `gatedBody` = 19. The brief's "18" was already one too many at its base. The old recheck's "20" is wrong; correct to 19 (`grep -rn "gatedBody(" src/lib` printed 5).
    - Handlers answering the default sentences: eleven, as the old recheck said.
    - The lines:
      - `gatedBody` is defined at :118 and its call is :122;
      - `fs/picker.ts:109`, `fs/ops.ts:682` (was :674) and `fs.ts:646`;
      - `writes.ts:308` (was :274);
      - `handleTerminal` `pty/routes.ts:547`;
      - `handleCommandsPost` at `server/machine/runs/commands/routes.ts:90`. D23 moved the folder `machine/commands/` to `machine/runs/commands/`;
      - `handleSchedules` `server/machine/runs/schedules/routes.ts:249`;
      - `handleApprovePost` `server/machine/apps/routes.ts:104`.
    - `CommandsOptions.configFor` is `runs/commands/routes.ts:34`.
    - `ChatOptions.configFor` is `pty/start/chat.ts:29` (Q123 moved `pty/chat.ts`).
    - `configFor` reads in `pty/routes.ts` are :258, :328, :432, :628, and `terminal/+server.ts:29`.
    - `target()` is `writes.ts:242`.
    - The assertions are auth.test.ts:27, write.test.ts:27 and git.test.ts:60 (`grep -rn "missing or stale" tests` printed those three).

28. **Brief :80 and :171.** `change-tree`, `Changes.svelte:213-216`, `ChangeGroups.svelte:136` and `changes.yml:72-73` hold.

29. **Brief :81, :173.** `CommitRow`, `Graph`, `RepoList`, `graph-menu` and `state.ts:205` hold (all unchanged).

30. **Brief :82, repositories.ts.** It is 875 lines, not 870, so 5 under 880 (`wc -l`). `grep -n` printed:
    - `worktreeLabel` :490;
    - `pickerRoots` :575;
    - `WorktreeOpening` :852-857;
    - `openWorktree` :865-875.

    The layout's `showInFiles` is `state/workbench/layout.svelte.ts:206` (old 18 said :204). `Worktrees.svelte:222` holds. Correct :178 to "875".

31. **Brief :83.** `ChangeGroups.svelte` (330 lines, :146, :300) and `ChangesTouched.svelte:51` hold.

### Other (brief :87-95)

32. **Brief :87 and F3 (:195), Decision 24.** `palette.ts` `commands()` is :283-308 (was :276-292), the theme hint :290 (was :280).
    - D23 added `language` `<language>`, `interpreter` `<path>` and `compile-database` `<name>`.
    - `shell/keys/Palette.svelte` is 505 lines, not 523, so under 520.
    - `shell/keys` holds 10 items (`git ls-files | ... | wc -l` printed 10).
    - The premise "over the 520 rule" and the new file `shell/keys/PaletteCommands.svelte` both fail; see section 5 item 4.

33. **Brief :88.** Ticker `button.name` holds (`class="name"` :306, plain :322).

34. **Brief :89, :194.** `TabFace.svelte` `dirty_glyph` is :170, block :168-172 (was :165-169; `grep -n dirty_glyph` printed 170). `OpenEditors.svelte:250-256` holds.

35. **Brief :90, :182.**
    - `files.yml` `picker_busy` is :161 and `picker_failed` :162 (was :150, :151; `grep -n` printed both). `picker_unsupported` is :165.
    - `pickerLine` is `folders.ts:77`.
    - `newItem` is `tab-actions.ts:106-111`.

36. **Brief :91.** The breadcrumb removal holds; `tab-crumbs.ts` exists.

37. **Brief :92 (old 23, 24).** `stripTab` is `shell/panes/strip/strip-tab.ts:30-60`, with `file` at :42 and `StripTabFacts` at :22.
    - `PaneView.svelte` calls it at :185.
    - `pages.ts` has `fileOfTab` :370 and `shownFileOfTab` :390.
    - `tabHint` is `pane-view.ts:472`.
    - C3 sets `gone` in `strip-tab.ts`, so add that file to the paths.

38. **Brief :94 (old 25, 26).** The numbers, from `wc -l`, `grep -n` and `grep -c`:
    - `settings.ts`: 541 lines, `settingEntry` :90, `settingReader` :98, the no-rule throw :111, `PROBLEM_READERS` :505-525, `settingProblems` :531.
    - `catalogs.ts` `settingFindings` :234.
    - `context.ts`: `openSettings` :331, `latexFormatting` :332 (was :321-322); the findings :361-371; `settingFindings` :364 (was :345).
    - `options.yml`: 1200 lines (was 1354); `sources.yml:` :979 (with PR2's `portfolio_deck` at :980); `roots` :1104-1112; `local.yml:` :1113.
    - Counts: `heading:` 127 (was 143), `min:` 32, `whole:` 19.
    - `config-checks.ts:98` READERS holds.
    - `portfolio.ts` `settingFindings` is :532 (was :521).

    Correct :94, :186-187 and Read 19.

39. **Brief :95.**
    - `app.palette` is `config/text/app.yml:17-39` (was :17-29); `cmd_unknown` :21.
    - The commands with no hint are crt, help, update, folder (:291, :302, :303, :306).

### H1 and H2 premises (brief :97-106)

40. **Brief :97.** The "read on main at ed52c232f" sentence needs the new base.
    - These files are unchanged since 10ac00c69 (`git diff --quiet`): run.ts, state.ts, reads.ts, compare.ts, files.ts, git-reads.ts, git-routes.ts, autofetch.ts, lines.ts, fs.ts, picker.ts, its route, serve.ts, app.d.ts, picker.test.ts, cherry-pick.test.ts.
    - `vite-plugin.ts` changed: its platform emulator is :54-60 (was :49-57). `grep -n "platform"` printed :54; Read 27 becomes `:45-80`.

41. **Brief :99-104 (old 27-31).** The run.ts and files.ts numbers of the old recheck hold. These moved:
    - the `refresh` pass is `context.ts:424` (was :405);
    - `context-fixture.ts` `git: { refresh: noop, close: noop }` is :71 (was :60);
    - `folderPicker` in the fixture is :126 (was :115);
    - `git.test.ts:41` holds.

    The keptFiles callers hold: hpc `+server.ts:9`, :38; `submit.ts:100`, :215; `submit-world.ts:21-39`; `submit-files.test.ts:12`, :72; `submit.test.ts:228`.

42. **Brief :105 (old 32).**
    - DESIGN.md "Watchers" is :125 and "Git" :137 (`sed -n 125p`, `137p`).
    - `search.ts:7` and `tmux.ts:3` hold.

43. **Brief :106 (old 19-22, 40).**
    - The picker numbers of the old recheck hold: `PickerState` `{ open: boolean; ask?: PickAsk }` :63, `handlePick` :103-132, busy :117, the ask path :120-123, `done.code !== 0` :125.
    - In `context.ts`: the `folderPicker` doc is :172 and the field :173; it is built at :574; `close()` is :590-612, and now also calls `followed.close(); void relay.close();` (D23).
    - `serve.ts` `close` is :45-49.
    - `src/server.ts:72` sets `ask` (was :58).
    - `parent.ts` `askParentToPick` is :96-116.

44. **Brief :108 (old 34), folder counts now (`git ls-files <d> | ... | wc -l`).**
    - Full at 10: state/sources, server/files, server/git, ui/tree, ui/display, state/workbench, shell/panes, state/sessions, state/sessions/terminal, data/sources/config, and now also shell/keys, server/root, data/model, state/life and tests/routes/edit.
    - views/sources/source is 8.
    - With room:
      - state/sources/explorer/acts 8;
      - state/sources/repositories 9;
      - state/sources/explorer/sections 8;
      - state/system 8;
      - views/shared/explorer/tree 9;
      - server/core 8;
      - views/sources/files/sections 9;
      - server/files/fs 8;
      - views/shared/changes 6;
      - tests/server/files 8;
      - server/core/git 7;
      - server/root/watch 8;
      - tests/server/root 2;
      - shell/panes/strip 7.

### Built on D42 and Z488 (brief :110-123)

45. **Brief :114.** Timeline is 387 lines; `<Section>` :274, wrapper :271, `TreeView` :272 hold. The `more` snippet is :275-306, not :275-300 (`grep -n "{#snippet more\|{/snippet}"`). The same correction applies to A5 (:133) and Read 7.

46. **Brief :115.** PR2 renamed `state/workbench/layout/open/show-in-files.ts` to `show.ts` (`git log --name-status` printed R068). `showTimeline` is now :22 (type) and :81, `revealAsked` :58. `reveal.ts:31-49`, :114-115 and `ShowPath.svelte:104-108` hold.

47. **Brief :116.**
    - `files-view.ts` :97-102, :179-181 and :222-224 hold.
    - Sections hands the Timeline `view` and `onpatch` at :124-130 (was :98-104).
    - Files.svelte's `onpatch` is :302 (was :301).

48. **Brief :117.** The fs-history follower is :65-80.

49. **Brief :123 (old 35).** `ROW_OPEN_SIDE` is `row-menu.ts:65` and :558 (and :304), not :64 and :521 (`grep -rn ROW_OPEN_SIDE` printed 65, 304, 558).

### What to build (brief :127-242)

50. **:129 and :48 of paths.** The Tree.svelte numbers hold (createDragging :203, `<ul>` :271, `<li>` :281, style :356-384).

51. **:130.**
    - The config-write dispatch is :89-97.
    - The unknown-body answer is `writes.ts:573` (old 36). The same applies to case 91 (:363, which says :510).

52. **:133 (A5).**
    - `Files.svelte:137` (`headed`) is now :138.
    - `Files.svelte:15-18` is now the head comment :15-19, which since D23 names "the outline, clangd's AST and Memory Usage" (:15-19, :39).
    - `Sections.svelte:2-5` is now :2-6.
    - The section list must add `ast` and `memory` (section 5 item 2).
    - "`Outline.svelte:160`" becomes :206.
    - "`Timeline.svelte:275-300`" becomes :275-306.

53. **:144 (C1).**
    - "The workspaces poll (`git.ts:479`)" is now `pollFile` at :485-488.
    - The config subscription is :468 and `hub.subscribe(sink, ['sessions', 'config'])` is :496. This also corrects :161's "git.ts:462, :490".

54. **:145 (C2).** The fs-history match is `fs-history.ts:76`. The other C2 numbers hold.

55. **:147 (C2).**
    - Replace "The three followers" with the seven of item 19.
    - `docs.svelte.ts:233-243` becomes :246-254, and `holds` :141-148 becomes :152-158.
    - The commands files are `server/machine/runs/commands/files.ts:24-25` and `runs/commands/found.ts:1-9` (D23 moved the folder).

56. **:148 (C3, old 23).** "`PaneView.svelte:186-217` sets it" becomes "`stripTab` (`shell/panes/strip/strip-tab.ts:30-60`) sets it through a new member of `StripTabFacts` (:22), passed by `PaneView.svelte:185`".

57. **:149 (C4).** `dismiss` is `glyphs.yml:35` (old 39).

58. **:159, :161, :163 (D5).**
    - `auth.ts` :105, :109; `RefusalShape` :86-90.
    - `context.ts` :415-420 (`make.watchGit`) and :525 (`processesText`, through `liveSettings` at :513).
    - `git.ts` :468, :496.
    - `writes.ts` `target()` :242, `WriteTarget` :104, `config` :106, `config:` :256.
    - The handlers: eleven, adding `handleSchedules` and `handleApprovePost` (old 17e).
    - `git.test.ts:60`.

59. **:178 (D13).** `repositories.ts` is 875 lines.

60. **:186-188 (E1, E2).** Use item 38's numbers.
    - "`context.ts:311`" becomes :364.
    - "`portfolio.ts:521`" becomes :532.
    - "`context.ts:362-367`" becomes :415-420.

61. **:194 (F2).** `TabFace.svelte:168-172`.

62. **:195 (F3).** `app.yml:17-39` and `palette.ts:290`. The `PaletteCommands.svelte` premise fails (item 32).

63. **:207, :211, :215, :219 (H1).** `run.ts:167` holds.
    - `context.ts:371` becomes :424.
    - `context-fixture.ts:58` becomes :71.
    - The others (`autofetch` :54-55, :113, :206; `lines.ts:251`; `git-routes.ts:198`, :468; git `+server.ts:23`) hold.

64. **:227-231 (H2).**
    - `close()` is `context.ts:590-612`, and the field's doc is :172.
    - The `PickerState` text is replaced as section 4 says.
    - `picker.ts`'s head comment is :1-19, not :9-16, and it already describes `ask`.

65. **:233-240 (H3).** The plan lines are those of item 3. "G42 at :29-30" holds (`sed -n 28,30p guarded.md`); the five titles are unchanged. Section 4 adds the sixth.

### Paths, shared steps, read list, tests, verify, report (brief :420-767)

66. **Paths (:442).** `tools/oculus/src/lib/server/machine/commands/routes.ts` does not exist. Correct it to `.../machine/runs/commands/routes.ts`. A loop of `[ -e ]` over every path printed MISSING only for it and for the three new files (reorder.ts, notes.test.ts, X3e-report.md).

67. **Paths, Source.svelte (:479, old 42, 43; Z553 at :773).** It is 520 lines, exactly the limit (`wc -l`). The load effect is :364-372, with `loadSourceDraft` at :371. The folder holds 8. Correct to "the load effect at :364-372 only; the file is at the 520 limit, so any line D2 adds there is moved out by concern".

68. **Paths: additions the landings require.**
    - `src/lib/shell/panes/strip/strip-tab.ts` (C3).
    - `src/lib/server/machine/hpc/submit.ts` and `tests/server/machine/hpc/submit-world.ts`; `submit.test.ts` and `submit-files.test.ts` if the types reach them (Z554, old 44).
    - `src/lib/server/machine/runs/schedules/routes.ts`, `src/routes/api/(machine)/schedules/+server.ts` and `src/lib/server/machine/apps/routes.ts` (D5's two new routes, old B2).
    - Their tests: `tests/routes/machine/schedules.test.ts`, `tests/routes/apps/approve.test.ts`, `tests/server/machine/runs/schedules/file.test.ts` and `record.test.ts`. The last two moved with D23; `grep -rln "handleSchedules\|handleApprovePost" tests src/routes` printed all four.
    - `src/lib/views/sources/files/sections/clangd/ClangdSection.svelte` (A5's drag on the two clangd heads; section 5 item 2).
    - Each follower that section 5 item 3 decides to change: `state/sessions/latex.svelte.ts` (it must change if `holds` takes `folders`), `state/sources/files.svelte.ts`, `state/life/present.svelte.ts`, `state/system/apps/rules.ts`.
    - `src/lib/data/model/` for the model-sessions.ts split (section 2, item 1).
    - The docs pages of item 72.

69. **Paths "Tests, the calls alone" (:509-514).**
    - "`context-fixture.ts` `git.refresh` at :58" becomes :71.
    - "`printing` helper at :42-45" holds.

70. **"Shared with the steps in flight" (:530-561) and "Steps not in flight" (:563-568) (old 45-48).** All obsolete.
    - A3, D44, O30, E4, D23, O30b, E4g, Q123, Q124, PR1, PR2, Q125 and Q126 have landed.
    - In flight now (`queue.md:1-3`): PR3 (base 272f60b4) and D23c (base 951b61e3). Replace the section with section 6 of this report.
    - Not in flight (`queue.md`):
      - D45 is "stopped at /spec on Z671";
      - D28 waits "once X3e has landed";
      - M6 waits "once X3e and D28 have landed".
    - D28's brief still cites the old base. `D28.md:253` says `context.ts` "after `make.watchGit` at :355 ... `close()` at :471-480"; it is now :416 and :590-612. `D28.md:268` targets "`PaneView.svelte` (`deleted` beside `dirty`, X3f :212)", but the tab is now built in `strip-tab.ts` and `dirty` is passed at `PaneView.svelte:185`. These are D28's corrections, named here because X3e lands first.

71. **Read list (:629-655, old 51).** The ranges that moved:
    - Read 4: `config-write.ts:80-100`; `bodies.ts:110-125`, `:293-305`, `:440-450`.
    - Read 6: `writes.svelte.ts:335-350`.
    - Read 7: `Outline.svelte:195-215`; `Timeline.svelte:255-310`; add `sections/clangd/ClangdSection.svelte` whole.
    - Read 9: `docs.svelte.ts:145-160` and `:240-260`; `commands.svelte.ts:315-340`; `context.ts:325-375` and `:410-430`; add `latex.svelte.ts:350-400`, `files.svelte.ts:80-90`, `present.svelte.ts:80-90`, `apps/rules.ts:95-110`.
    - Read 11: `PaneView.svelte:175-190`; `pane-view.ts:460-480`; `pages.ts:365-395`; add `shell/panes/strip/strip-tab.ts` whole.
    - Read 12: `source.svelte.ts:181-221` and `:293-385`; `Source.svelte:355-375`.
    - Read 14: `repositories.ts:480-495`, `:570-595`, `:625-637` (`preparedMessage` is :630; the old :620-630 region moved by 5), `:845-875`.
    - Read 18: `palette.ts:270-310`.
    - Read 19: `catalogs.ts:220-252`; `options.yml:1095-1115`; `config/sources.yml:85-105`.
    - Read 21: becomes item 72's targets.
    - Read 22: the eleven handlers.
    - Read 27: `context.ts:165-180` and `:565-612`; `vite-plugin.ts:45-80`; `context-fixture.ts:60-130`.

72. **Doc text (:733, Read 21, old 32, 33).** Q125 and Q126 moved the guides.
    - The HELP.md view rows are now one-line rows linking to `docs/`: files :93, repositories :94, changes :114.
    - There is no `sources.yml` row in HELP.md. It is `docs/configuration.md:22`.
    - DESIGN.md: Watchers :125, Git :137.
    - The behaviour X3e changes is described in:
      - `docs/views.md` "## Files" :55, "## Repositories" :59, "## Changes" :143;
      - `docs/files-and-search.md`: "The tree and its header" :9, "Open Editors and Outline" :15, "Timeline" :19, "Bookmarks and Notes" :23, "Keys and selection in the tree" :29, "Workspaces, roots and Add Folder to Workspace" :33-35 (the folder panel sentence :35);
      - `docs/source-control.md`: "The Repositories view" :5, "Committing" :13, "The graph" :37, "Repositories, closing and opening worktrees" :49;
      - `docs/configuration.md:22`;
      - `docs/apps.md:214` and :325-327 (the `files` notice), with `DESIGN.md:372` (section 5 item 1).
    - The Doc text section names these files and lines.
    - `spec.md:66`'s grep list names src, tests, config, HELP.md, DESIGN.md and README.md, not docs/. The brief should add `docs` to the grep it asks for after a change of name or shape.

73. **Conventions (:684-685).**
    - `shell/keys` is full.
    - `Palette.svelte` is 505, not 523.
    - `repositories.ts` is 875.
    - Remove `views/sources/source` from the full list (8 items) and add `server/root`, `data/model`, `shell/keys` and `state/life`.

74. **Tests (:663-676) and verify 4 (:699, old 41, 49).**
    - `git.test.ts` sentence assertions are at :60, :72 and :151; the one capitalised D20 assertion is at :88.
    - G31's lines are `agents/guarded.md:72-73`.
    - Verify 4 adds the entries whose Code line names a path of the write list:
      - G1 (`tests/routes/apps/approve.test.ts`, if `apps/routes.ts` is added);
      - G28 (`src/lib/state/sessions/source.svelte.ts` is in X3e's paths and is G28's Code file, guarded.md:51, so G28's tests, with `tests/state/sessions/source.test.ts` among them);
      - G41 (`tests/server/core/git-failure.test.ts`);
      - G43 (`tests/server/machine/hpc/submit.test.ts`, `submit-files.test.ts`);
      - G44, G49 (`tests/routes/edit/app-gate.test.ts`).
    - Those Code-line matches come from a loop of `grep -n "Code:.*<basename>" guarded.md` over the write list: git.ts G41, context.ts G28, fs.ts G33/G31, picker G42, writes.ts G8, git files G33/G41/G44, deposit G30, files.ts G43, pty/routes G34/G35, source.svelte.ts G28.

75. **Changes from the brief check (:743, :750, :764, old 52).**
    - The Tree numbers hold.
    - `Repo.svelte` "merging" is :133 (`grep -n "repositories.merging"`).
    - Finding 26's "`server.yml:24-54`" becomes ":19-49 and :58-79".

76. **Rulings after the recheck (:772-774).**
    - Z553's "528 lines ... folder at 10" becomes "Source.svelte 520 lines (the limit), folder 8; the effect at :364-372".
    - Z554 holds, with its paths added (item 68).

### Old recheck items rechecked

- **Holding as the old recheck wrote them:** 5, 10, 11, 12, 15, 19, 24, 27, 28, 29, 30, 36, 38 (except `git.test.ts:60` holding), 39, 41, 44, 49.
- **Superseded by new values above:** 1, 2, 3, 4, 6, 7, 8, 9, 13, 14, 16, 17 (the "15 sites" is right only counting `gatedBody`'s own call; routes are 19, not 20), 18, 20, 21, 22, 23, 25, 26, 31, 32, 33, 34, 35, 37, 40, 42, 43, 45, 46, 47, 48, 50, 51, 52.
- **B1** holds with `src/server.ts:72`. The paths ruling is Z635 (section 4).
- **B2** holds with the moved paths of item 68.
- **B3:**
  - DESIGN.md's app channels paragraph is :372 (was :323);
  - `docs/apps.md:214` and :325-327 now also document `{ root: text, bookmarks?: boolean }`;
  - `apps.yml` :34 and :41 hold;
  - `rules.ts:102-105` and `apps.svelte.ts:296`, :356.
- **B4** holds (strip-tab.ts).
- **B5** holds.
- **B6:** there are now seven followers (item 19). D45 is stopped, so `latex.svelte.ts` is not moving now.
- **B7:** O30b landed. `IGNORED` already holds the two names, so C1 inherits them, and X3e's merge against O30b is moot.
- **B8:** `close()` :590-612 now also closes `followed` and `relay` (D23).
- **B9** holds.
- **B10** holds.

## 2. Changes beyond a line number since 10ac00c69

1. **`data/model/model-sessions.ts` is 876 lines, 4 under 880, and `data/model` holds 10 items.** The old recheck did not name this. The file is unchanged since 10ac00c69 (`git diff --stat` printed nothing; `wc -l` 876; folder count 10).
   - C1 widens `FilesPayload` (:672, doc :664-671) to four members with their doc lines, which takes the file over 880.
   - The step must split the file by concern, for example moving a whole section such as `hpc` into an existing model file. No new file can go in `data/model`. `index.ts` re-exports follow the split.
   - Add `src/lib/data/model/` (the files the split touches) to the paths, and say so in the brief.

2. **`server/root/context.ts` is 870 lines, 10 under 880 (D23 added `relay`, `followRoots` and their close).** `server/root` holds 10 items.
   - H2 (`closePicker` in `close()`, the doc) and E1 and E2 (the watcher's `depth` and catalog) add lines, so the file will likely pass 880.
   - The brief must say the split is by concern into an existing file or a new subfolder, since the folder is full.

3. **`repositories.ts` is 875 lines (5 under).** Any of D11 to D13 passes 880. `worktrees.ts` (new) goes into `state/sources/repositories`, which holds 9, so that is its last slot.

4. **`Source.svelte` is at 520, the limit,** and D23c is changing the same folder now (section 6). D2 may add no line to it without moving code out by concern.

5. **`shell/keys` is full (10) and `Palette.svelte` is 505.** F3's new file cannot go there; section 5 item 4.

6. **D23 moved and added files.**
   - It moved `server/machine/commands/` to `server/machine/runs/commands/` and the schedules to `runs/schedules/`. Q123 moved `pty/chat.ts` to `pty/start/chat.ts`.
   - It added the Files view sections `ast` and `memory` (`sections/clangd/`), so A5's order has eight ids, not six.
   - It added `server/machine/lsp/watch.ts` (`RootWatch`, `followRoots` in `context.ts`), a second recursive `fs.watch` on each root's real path, which serves language servers only. C1 keeps the git watcher as the `files` channel's source.

7. **PR2 changes.**
   - It renamed `show-in-files.ts` to `show.ts`.
   - It added the Present store's `files` follower (`present.svelte.ts:84-89`).
   - It added `server.deck_slides` (server.yml :50-57) with sentences ending in a full stop.
   - It added `sources.yml` `portfolio_deck` (options.yml :980).
   - It changed `list-edit.ts` (`setItems` :125; comment kept on the key line).

8. **O30b landed `IGNORED`'s two names through `build-folders.ts`.** C1's list of `IGNORED` names is six.

9. **Q125 and Q126 moved the user's guide from HELP.md into `docs/*.md`** (item 72). The Doc text section now targets docs pages more than HELP.md. Since spec.md:66 does not name `docs/`, the brief names it.

10. **The token count.** `tokenedBody` has 14 handler sites plus `gatedBody`'s (item 27), so 19 routes.

11. **Files near their limit in the write list.** `wc -l` over the write list gives:
    - `deposit.ts` 835;
    - `latex.svelte.ts` 813 (if taken);
    - `git-write.ts` 797;
    - `commands.svelte.ts` 727;
    - `fs.svelte.ts` 840;
    - `writes.ts` 620;
    - `fs.ts` 659;
    - components: `PaneView.svelte` 499, `Ticker.svelte` 497, `Repositories.svelte` 489, `Graph.svelte` 477.

    D5's `text` parameter and H1's awaits add lines to `deposit.ts` and `git-write.ts`. Each is under the limit with room for those changes, but `fs.svelte.ts` (40 under) takes C2, C3 and C5 together, and the brief should say the split rule applies there (the folder `state/sources` is full).

## 3. Z468 widening: a root outside the hub (under /private/tmp)

I read the code; I ran no server, as the brief forbids. What a live root at `/private/tmp/play` does at run time is therefore not verified by a run.

**Which module watches roots.** `server/root/watch/git.ts`, `watchGit`:
- `open` (:317-353) calls `watch(root, { recursive: true }, ...)` at :344 for every root it is handed, repository or not. The `.git` watch is skipped when there is no `.git` (:340).
- Events go `heard` :306, then `touch` :271-283 (2 s trailing throttle), then `reread` :239-255.
- `reread` publishes `files` `{ root }` at :243 before the git read, whatever that read answers.

**Which roots it is handed.** `repositoryRoots` (`server/files/roots.ts:45-49`) gives:
- the configured roots of `sources.yml`, each through `expandHome` (`files.ts:181`);
- the hub (`always`);
- the roots of the current saved workspace (`addedRoots`, `fs.ts:299`, over `saved.current`);
- not the engine root.

`startGit` is `context.ts:415-420`. The watcher reads the roots again on a `config` push (git.ts :468) and on the workspaces-file poll (:485-488), and `follow` (:425-453) opens new roots and drops old ones. So a root added with Add Folder, in the default workspace or in the current saved workspace, is watched from the next push or poll, wherever it lies on disk.

**A non-repository root.** It is read, and nothing filters its events:
- its `statusFor` answer carries `error` (the doc of `answered`, :257-260), so `readFrom` is never set and `seenBy` (:290) never drops an event;
- `relevant` (:125) drops only `.git/objects`, locks and `IGNORED` names;
- every new file under `/private/tmp/play` therefore publishes `files {root:'/private/tmp/play'}` within about 2 s.

**Why the tree did not show it.** The page ignores that message.
- `fs.svelte.ts` `afterReceive` (:396-401) hears only `bookmarks`.
- `readListing` (:467) answers a held listing without asking.
- Collapsing and expanding a folder calls neither `relistFolder` nor `relist`: `relistFolder` is called only from `ops.svelte.ts:385-386` and `relist` only from `tab-actions.ts:86`.
- A reload empties the held listings, which is why the reload showed the files.
- The head comment `fs.svelte.ts:17-19` ("re-read by closing it and opening it") is false.

This is the X3a-1 cause the brief already names. C1 and C2 end it only if C2's match applies to every served root, inside or outside the hub, repository or not.

**Two edge cases the code shows.**
- A root whose folder does not exist when `open` runs gets an empty handle list (:325-328). It is not opened again when the folder appears later, because `follow` only opens roots it does not hold. It is watched only after the next config push or poll changes the root list, or never.
- A root given as `/tmp/x` (a link to `/private/tmp/x`): the watcher publishes the configured, expanded string, and the page's served root `dir` comes from the same configuration. The C2 match is then string against string. Whether macOS's recursive `fs.watch` on a path through a link reports events is not verified.

**Requirement to add to the brief (C, after C6).**

"C7. **Roots outside the hub (Z468 widening).** C1 and C2 hold for every served root, whether it lies inside the hub or outside it (a folder under `/private/tmp`, `~/workspace/<x>`) and whether or not it is a git repository:
- a file created, removed or renamed in a shown folder of such a root shows in the tree within the watcher's throttle window and without a reload;
- a collapsed folder written to shows its new entries when it is expanded, since C2 marks the held listing.

The served root and the `files` message are matched on the expanded absolute folder both sides hold, so a root written with `~` or through a link matches. A root whose folder does not exist when it is first watched is watched once the folder appears: `follow` retries a root that has no handle at each poll or config push, so a root added before its folder exists does not stay unwatched. The fs store's head comment states that the tree follows the `files` channel for every root."

**Cases with expected results.** These join the Cases section as look cases; the poll and retry behaviour is a unit of the watcher.

1. Add `/private/tmp/play` (not a repository) as a root, expand it, and write three files at its top from a shell. All three rows appear within about 2 s (one throttle window) without a reload.
2. With `play/sub` expanded, write `play/sub/a.txt`. The row appears in `sub` within about 2 s.
3. Collapse `play/sub`, write `play/sub/b.txt`, then expand `play/sub`. `b.txt` is listed at once on expand.
4. Delete `play/sub/a.txt` from the shell. The row leaves within about 2 s, and an open tab of it is marked deleted (C3).
5. Add a root `/private/tmp/late` before the folder exists (the tree shows it missing), then `mkdir` it and write a file. Within one poll or config push the root lists and the file shows without a reload.
6. Add a root as `/tmp/play2` (through the `/tmp` link) and write a file. The file shows without a reload. If macOS gives no event through the link, the brief's stop rule applies and the finding is reported.
7. Run `git init` in `/private/tmp/play` while it is shown. The Repositories view lists it within about 2 s, and new files keep showing in Files.
8. Remove the root from the workspace. Its rows leave the tree (C6), and further writes under `/private/tmp/play` publish nothing (`drop`, :355-366).

## 4. Z635 (a) against the brief's G42 sentence and picker test

**The ruling.** Plan.md:1399 records "G42 gains a sentence for the desktop app's folder sheet, which no code can close; X3e builds it". The X3e sub-bullet records the desktop half: "a request whose connection closes stops waiting at once, the next press opens a new sheet, and the old sheet's answer adds no folder; X3e builds it with a case in `tests/server/files/picker.test.ts`".

**G42.** `guarded.md:28` has the ruled sentence word for word (`sed -n 28,30p`). Its Test line (:30) still names only the five osascript titles "written by X3e". There is no sixth title for the sheet. Under spec.md:57 (tests only as guarded rows), the orchestrator writes the sixth title into :30 before dispatch. A proposed title: 'stops waiting for the app's sheet when the connection closes, asks for a new sheet at the next press, and adds nothing from the old sheet's answer'.

**The brief does not match the ruling.**
- H2 (:227) sets `PickerState` to `{ panel: AbortController | null }`, which drops O30's `ask`.
- H2 ties the connection's close only to `execFile`'s signal.
- H3 and the Tests section (:675) list five rows.
- Nothing builds the `ask` path's half. `handlePick` (:120-123) awaits `state.ask()` with nothing that ends the wait, and `state.open` stays true until the sheet answers. A second press is answered `busy` while the old sheet waits.

**Corrected H2 text.**
- "`PickerState` is `{ panel: AbortController | null; ask?: PickAsk }`: `ask` is O30's, set by `src/server.ts:72` when the server has a parent. The busy check reads `state.panel !== null`."
- "On the `ask` path, `handlePick` races `state.ask()` against the panel controller's abort. A connection that closes, or is already destroyed, aborts the controller. The handler then answers at once (`failed`, which no page reads) and its `finally` sets `state.panel` to `null`, so the next press calls `state.ask()` again with a new id. The old ask's later answer settles a promise nobody awaits, so it adds no folder. `closePicker(state)` ends a waiting ask the same way."
- "`askParentToPick` (`parent.ts:96-116`) and `src/desktop/windows/pick.ts` are not changed. The host already answers `cancelled` when the page reloads, navigates, crashes or its window closes. The abandoned id's entry in `askParentToPick`'s `waiting` map is removed when the old sheet answers, which settles a promise nobody awaits."

**Corrected H3 text.** "the five rows, plus a sixth for the sheet (Z635 (a)). With `ask` a stand-in whose first call never settles until the test settles it:
- a press with a connection that then closes is answered at once and leaves `state.panel` null;
- a second press calls `ask` a second time;
- settling the first call with paths after that changes neither the second answer nor the state."

The report quotes its failure on the unchanged tree, where the second press is answered 409 `busy`.

**Not verified.** Whether macOS lets a second `showOpenDialog` sheet open on a window whose first sheet is still on screen, or queues it until the first is dismissed. The server half above holds either way. What the reader sees for "the next press opens a new sheet" while the old sheet is still up is checked only by the look in the app. The brief should name that look in the report's before and after.

## 5. User-visible choices no ruling settles

1. **Do apps receive `folders` and `workspaces` in the `files` notice?** The notice `{ root, bookmarks? }` is a documented app contract (`docs/apps.md:214`, :325-327; `DESIGN.md:372`). `rules.ts:102-105` passes a root app only notices whose `root` equals its folder; a machine app gets every notice whole.
   - (a) Pass both fields to apps, and document them in `docs/apps.md:327` and `DESIGN.md:372` (and `apps.yml:34` if the wording changes). Pro: apps learn which folders changed. Con: the contract grows.
   - (b) Strip `folders` and `workspaces` in `rules.ts` before an app sees the notice, and drop the `{ root: '', workspaces: true }` notice for apps. Pro: the app contract does not change. Con: one more path (`rules.ts`) and a filter.
   - Lazy option: pass them and leave the docs as they are, which makes `docs/apps.md` false.
   - Recommendation: (a). Any field the page sends is visible to a machine app either way, so documenting it is the only consistent end state.

2. **Where do `ast` and `memory` go in A5's section order, and do their heads drag?**
   - (a) Both are ordinary ids in the order, default after `outline` (outline, ast, memory, timeline, bookmarks, notes), and their head drags through `ClangdSection.svelte:45`. Pro: VS Code's Explorer views all drag. Con: two more files in the paths (`ClangdSection.svelte`, and `Ast.svelte`/`MemoryUsage.svelte` if the drag props pass through).
   - (b) Fixed below Outline, outside the order. Pro: fewer paths. Con: two heads among the sections that do not drag.
   - Lazy option: (b).
   - Recommendation: (a). Also say what a held order does when a section is absent, since the two draw only with an answer: absent ids are skipped and keep their place.

3. **What each extra `files` follower does with C1's folder messages.** An `npm install` under a root would publish once per throttle window.
   - (a) Each follower takes the folder test: latex through `holds`; the project files store at `files.svelte.ts:85-89`; the Present store at `present.svelte.ts:84-89`, re-read only when a deck's folder is named. Pro: decision 32's reason applies to all seven. Con: `present.svelte.ts` is PR3's path (section 6).
   - (b) Only the three the brief names change. Pro: fewer paths. Con: the other four re-read every deck, every project's file list and LaTeX state once per window under an `IGNORED` folder.
   - Lazy option: (b).
   - Recommendation: (a). The Present store's change is taken after PR3 lands, on PR3's text.

4. **Where F3's command descriptions go.** `Palette.svelte` is 505, `shell/keys` is full, and PR3 also changes the palette.
   - (a) Describe the commands in `PaletteRow.svelte` and `palette.ts` with no new file. Pro: no folder change. Con: it fits only if `Palette.svelte` stays under 520.
   - (b) A subfolder `shell/keys/palette/` taking `Palette.svelte`, `PaletteRow.svelte` and the new `PaletteCommands.svelte`. Pro: room to grow. Con: the move collides with PR3's `Palette.svelte` edit.
   - Lazy option: neither is lazier by work left undone. Choosing (a) and then compacting `Palette.svelte` to fit would be the lazy form.
   - Recommendation: (a), with F3 rewritten to drop `PaletteCommands.svelte`; if the rows push `Palette.svelte` past 520, (b) after PR3 lands.

5. **The full stop of server sentences (D5, decision 28).** PR2's `server.deck_slides.changed` ends with two full stops, so "the file's own form" is now mixed.
   - (a) Keep D5's no-full-stop form for `server.git`, `server.deposit` and `server.auth`, and rewrite decision 28's reason to "the form of `server.config_key` and `server.config_value`". `deck_slides.changed` stays as PR2 wrote it.
   - (b) Rule one form for the whole file and change `deck_slides.changed` too, a PR3 path.
   - Lazy option: (a) with the old reason left in place.
   - Recommendation: (a) with the reason corrected. A form for the whole catalog is a different concern from X3e's, and it goes to the orchestrator if wanted.

6. **The Doc text targets.** Since HELP.md rows are now one line, where does X3e's reader-facing text go? This decides which file the reader finds the behaviour in.
   - Recommendation: the docs pages of item 72, with HELP.md rows changed only where a row's one line becomes false.
   - Lazy option: HELP.md only, which leaves `docs/files-and-search.md` and `docs/source-control.md` false.

7. **What a root whose folder is missing at its first watch does (section 3).**
   - (a) The watcher retries at each poll or config push until the folder exists.
   - (b) It stays unwatched until the root list changes.
   - Lazy option: (b).
   - Recommendation: (a). The retry is internal to the watcher, and the visible part is that the tree follows the folder once it exists.

## 6. Paths shared with PR3 and D23c

Sources:
- PR3: `PR3.md` "Paths this step writes" :214-232; regions from PR3.md :17-30, :137, :152.
- D23c: `D23c.md` at HEAD 7f300a60 and later, "Paths this step writes" :125-144; regions from :15-80.

**With PR3.**

| File | PR3 | X3e | Merge |
|---|---|---|---|
| `server/edit/writes/bodies.ts` | `deck-slides` (:96-101, :267-275, :404-410) and a new `deck-edit` | `RootsWrite` :120-122, `rootsShape` :298-301, `rootsWrite` :443-446 | Simple (item-level) if PR3 does not place `deck-edit` beside the roots regions |
| `config/config-write.ts` | `./deck.ts` import :24 (moves to `deck/`), its dispatch :58-59, the head comment :1 | `roots.ts` import :26, dispatch :89-97, maybe the head comment | Simple except the head comment, which both may reword; the orchestrator takes both texts |
| `server/edit/writes.ts` | the body-reader export | `WriteTarget` :104-106, `target()` :242-256, the token refusal :308 | Simple if PR3's export is elsewhere; judged on PR3's diff |
| `state/workbench/palette.ts`, `shell/keys/Palette.svelte` | a view's commands in the palette (`Palette.svelte:15-26`, `editorItems` :163) | colon command descriptions (`commands()` :283-308) and their drawing | `palette.ts`: simple at item level. `Palette.svelte`: not simple, since both change how rows are composed and drawn. X3e's F3 is built on PR3's text (section 5 item 4) |
| `config/text/server.yml` | `server.deck_slides.*` (:50-57) and `server.deck_edit.*` | groups `auth`, `deposit` and keys in `git` (:93-104) | Simple: separate groups |
| `config/text/views/sources/files.yml` | row-menu items | many keys | Simple when each key goes to its own place |
| `state/life/present.svelte.ts` (only if section 5 item 3 is (a)) | its store | the follower :84-89 | Not simple without PR3's diff; take it after PR3 lands |
| tests | rows of G8, G9, G2, G32 and G49 (G9's titles at `changes.test.ts:241`, `undo.test.ts:175`) | D5's call edits in `undo/undo.test.ts`, `changes.test.ts`, `write-fixture.ts`, `audit-mute.test.ts` | Simple if X3e edits only call arguments and PR3 adds rows; a shared fixture helper edited by both is not, judged at landing |
| `HELP.md` | Present row :103 | rows :93, :94, :114 | Simple |
| `DESIGN.md` | Present items :390 | :125, :137, :372 | Simple |
| `docs/views.md` | "Present" | :55, :59, :143 | Simple |
| `docs/files-and-search.md` | the row-menu list, "The right-click menus" :41 | :9-35 | Simple |
| `docs/apps.md` | :435 | :214, :325-327 | Simple |
| `docs/configuration.md` | :64 | :22 | Simple |

`HELP.md`, `DESIGN.md` and `docs/` are applied by the orchestrator at X3e's landing, since X3e's builder does not write them.

**With D23c.**

| File | D23c | X3e | Merge |
|---|---|---|---|
| `views/sources/source/Source.svelte` (the folder) | adds the library tab and the column, at 520 lines, moving code out | D2's load effect :364-372 | Not simple: both must move code out of the same file at its limit. X3e is based after D23c lands, or D2 is confined to `source.svelte.ts` with no line added to `Source.svelte` |
| `state/sessions/source.svelte.ts` (G28) | `SourceTabState` :31-36, `sourceTabState` :155-162 | `loadSourceDraft` :300-309, `reloadSource` :370 | Simple; G28's tests run after both |
| `views/sources/files/sections/Outline.svelte` | `goTo` :196-200 (`select` in place of `goto`), maybe the rows | `<Section>` :206 drag props | Simple: five unchanged lines between; judged on D23c's diff |
| `config/text/views/sources/source.yml` | its own keys | its own keys | Simple when each key goes to its own place |
| `DESIGN.md` | :123, :510, :522, :571-572 | :125, :137, :372 | Simple: :124 lies between :123 and :125 |
| `docs/files-and-search.md` | :69-72 | :9-35 | Simple |
| `docs/views.md` | :69 | :55, :59, :143 | Simple |

D23c and X3e share no other file.

## Next steps

These are for the orchestrator before dispatch:
1. Write the sixth G42 title into `guarded.md:30` (section 4).
2. Bring the section 5 choices to Axel.
3. Rewrite the brief's base, premises, paths, read list and shared-steps sections from sections 1, 2 and 6.
4. Decide whether X3e's base waits for D23c to land, since `Source.svelte` is a non-simple overlap.

Agent usage: a50c90211e587451f, claude-opus-5-5, 264,170 tokens, 194 tool uses, 24.9 min.
