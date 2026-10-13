# Brief check: D76

All reads are of the base tree `69b944eca` (`git show 69b944eca:tools/oculus/<path>`, `git grep -n <pattern> 69b944eca -- tools/oculus/...`), except where a line says it read the main checkout or `node_modules`. Nothing was written.

## Names

1. `noteId`: `git grep -n -P '\bnoteId\b' 69b944eca -- tools/oculus` gives `src/lib/state/life/notes.ts:24`, `src/lib/views/sources/files/sections/Sections.svelte:42,123`. Both files are in the write list. Holds.
2. `splitNote`, `noteText`: the hits are `src/lib/server/files/fs/notes.ts:99,106,115,177`. A second, unrelated local `noteText` exists in `src/lib/server/machine/apps/read/across/key-notes.ts:43,59` and is not affected by the change.
3. `titleOf`: removed from `state/life/notes.ts:37` (used at `Note.svelte:43,103`). About 14 other local `titleOf` functions (for example `latex.ts:468`, `rows.ts:172`, `FileRow.svelte:100`) are unrelated and stay true.
4. `writesNow`: `state/life/notes.ts:76` and `Note.svelte:44,189`, both in the write list. Holds.
5. `note-save`, `note-delete`, `order-notes`: `fs.ts:30` (the head comment names the `order-notes` route), `fs.ts:410-412,488-490` and `state/sources/fs.svelte.ts:753,773,829`. All are in the write list.
6. The `stamp`, `debounce`, `autosaveMs`, `browserTimer`, `Timer` and `Scheduler` exports of `state/life/notes.ts`. Their only importers are `Notes.svelte:31,117` and `Note.svelte:39-45,153,156-158,214`. The brief removes the stamp column and `Note.svelte` but does not say whether these exports go, stay or move into the source tab's note autosave. Once `Note.svelte` is gone, `unused-exports.sh` will flag `debounce`, `autosaveMs` and `stamp`.
7. The `note` view id (`git grep -n "'note'"`): `Sections.svelte:123,160,220`, `Note.svelte:7`, the whole of `config/text/views/sources/note.yml` (which says it is "owned by the note view"), and `config/text/views/sources/files.yml:5,149-154`. Outside the write list's test scope, `tests/checks/config/config-folder.test.ts:275` lists `'views/sources/note.yml'` in `CATALOG_FILES`, which is compared word for word at `:340`. Removing that file makes the test false, and so does adding any new catalog file (for example one for the Notes Graph). The `:351` test, "writes one description for every config file", also needs a description key added or removed. `HELP.md:238` names `note` among the views that "open for one thing". HELP.md is in the write list, but the brief's read ranges (300-330, 470-485) leave line 238 out.
8. `perOculus().notes`: the hits are `paths.ts:16,24,40` and `machine-defaults.ts:50`, both in the list. Outside the list, `src/routes/api/(files)/fs/+server.ts:23,32` builds `FsTarget` with `notes: own.notes`. Its head comment (`:3-5`, `:9-11`) says the POST "writes the notes" and that the notes are in the primary hub's folder "unless its `local.yml` names another place". Both the code and the comment become false.
9. `FsTarget` is also built in two tests with a `notes` field: `tests/routes/files/fs.test.ts:54` (G2's fs test) and `tests/routes/hubs/machine-answer.test.ts:42`. `grep -n machine-answer agents/guarded.md` prints nothing, so the second test is not under any entry the brief lets the builder edit.
10. The `notes` machine value appears at `local.ts:61-65,156,419`, `machine-defaults.ts:50`, `src/lib/server/root/watch/local.ts:102` (the `FIELDS` list, covered by `root/watch/` in the write list), `HELP.md:475,480`, the `fs/notes.ts` head comment `:7-8`, and the `FsTarget` doc at `fs.ts:198`. All are in the list except item 8's route.
11. `searchArgs` appears only at `query.ts:168,194`. Including the notes means changing `searchQuery(query, rootKeys)` (called from `search.ts:471`), and that call needs the hub folders and the private folders. Those are computed in `src/lib/server/files/search/search-routes.ts:68` (`privateFolders(hubDirs(...))`), which is not in the write list.
12. `markdownFiles`: `places.ts:69` and `requests.ts:21,66` are in the list. `held/requests/links.ts:26,174` and `servers.ts:52,565` are outside it, and the change reaches them as intended. The rule "a folder whose name starts with a dot is out" is written in three more places the brief does not name:
    - `src/lib/server/machine/lsp/held/watch.ts:118-120` (`#event`) and `:243-251` (`entryFiles`) drop every file under a dot folder from the server's file events. The file is outside the write list, and G72 cannot hold for notes without changing it.
    - `src/lib/server/files/fs/lsp-edit.ts:58-66` (`inLibraryFolder`) refuses any path with a dot-folder part as `outside`, and its head comment `:11-13` says so.
    - `src/lib/state/system/machine/lsp/edits.ts`, head comment lines 22-26: the plan refuses "a file ... under a `node_modules` or dot folder" and "an entry [that] creates, renames or deletes a file".
    
    `lsp-edit.ts` and `edits.ts` are in the list, but the brief states neither refusal. As written, part 2's link rewrite and Rename, and the move rewrite of part 2 bullet 4, would be refused.
13. The Files view's section ids: `state/sources/explorer/view/files-view.ts:108-117` (`SECTION_ORDER`) is in the list. `sectionsOf` (`:124-127`) appends the ids a saved record lacks at its end. A saved Files tab therefore gets `backlinks` last, after Notes, where part 3 says "after the Outline".

## The step line

The step line is `plan.md:793`, found with `grep -n '^- D76' plan.md`.

1. Part (1) of the line (Markdown file named by title in the hub's `.oculus/notes/`, source tab with preview and Outline, subfolders as a tree, the note view and timestamp names gone) is served by What to build Part 1, bullets 1, 3 and 5. Met.
2. Part (2) (`[[name]]`, `[[name#heading]]`, completion, definition, references, rename, drawn in the preview, rewritten on rename or move, a press on a missing link makes the note) is served by Part 2, bullets 1, 2, 3 and 5. Met.
3. Part (3) (Backlinks beside the Outline) is served by Part 3. Met for a fresh Files tab; a saved tab is different (Names 13).
4. Part (4) (Notes Graph) is served by Part 4. Met.
5. Part (5) (every hub's notes, one New Note per hub, the head's New Note to the primary) is served by Part 5. Met.
6. Part (6) (Search and Go to File) is served by Part 6. Go to File is left unchanged on the premise that it already lists the notes.
7. Parts (7), (8) and (9) are served by Parts 7, 8 and 9. Met.
8. "Not built, by Axel's word: live preview, a properties panel, Canvas, Bases, Sync, Publish, plugins" has no line in the brief. Nothing tells the builder that these are out of scope. Part 8's `tags:` front matter could be taken as a start on a properties panel.
9. "From a commit of D74's built work by open item 93 (a)" is stated at brief line 11, but its content about the base does not hold (Premises 1).
10. The line's parenthesis says D74 writes `paths.ts`, `Files.svelte`, HELP.md and DESIGN.md, "which D76 writes too". This list is incomplete (Other checks 6).
11. "Beside D73" is an orchestration matter and needs no requirement.

## Premises

1. Brief line 11 says: "In the base, the hub's `.oculus/config.yml` is written ... and the hub's `.oculus/config/` folder is gone." This is false for tree 69b944eca. `git ls-tree 69b944eca .oculus/` prints `bookmarks.yml`, `config` (a tree), `memories`, `wallpaper` and `workspaces`, and no `config.yml`. `git ls-tree -r --name-only 69b944eca .oculus/` lists `.oculus/config/appearance.yml`, `behavior.yml`, `catalogs/vocab.yml`, `layout.yml` and `sources.yml`. `git log --all --format='%h %T'` has no commit whose tree is 69b944eca. Under D74's rule (`folders.ts` head comment: "A folder that holds `.oculus/config.yml` is a hub"), research-hub is not a hub in this base. Every hub-dependent case on the real tree (23, 24, the notes folder of `perOculus`) changes meaning.
2. Brief line 11 says "the worktree is sparse ... no hub `.oculus/`". Not checked (Declined).
3. Line 14: `noteId` is at `state/life/notes.ts:24-28`, `splitNote` and `noteText` at `fs/notes.ts:98-108`, `noteFile` at `:53-61` with the regex `^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$` at `:54`. All hold. The brief keeps `noteFile`'s link checks (case 39) but never says that its id regex, which refuses a space or `/`, must go. `writeNoteOrder` drops each id `readNote` refuses (`:162`), so with that regex in place every order naming `Meeting 2026-10-13` or `sub/My note` would be refused `no-such-note`.
4. Line 15: `readNoteOrder` and `writeNoteOrder` are at `:84-96` and `:150-168`. The cited range `:79-171` covers them. The G31 title is at `tests/server/files/notes.test.ts:53`. Holds.
5. Line 16: `fs.ts:382-394`, `:458-490` and `:186-199` hold. `deleteNote` is cited as `notes.ts:177-183`, but it is at `:181-188`; lines 177-179 belong to `saveNote`.
6. Line 17: `paths.ts:36-44` holds (`perOculus` is at 35-44). `local.ts:62-65,156,419` and `machine-defaults.ts:50` hold. `HELP.md:475,480` name the key. Holds.
7. Line 18: `Notes.svelte` is 156 lines and `Sections.svelte` 230 (`git show ... | wc -l`). `createListDrag` and `listKeys` are at `Notes.svelte:24-25,44,73`. `Sections.svelte:123,160,220` hold.
8. Line 19: `Note.svelte` is 278 lines and registered as `note` (`:7`). `behavior.yml:240-241` holds (`notes: autosave_ms: 800`). `DESIGN.md:595` and `:657` describe the note. `HELP.md:311` describes it. `HELP.md:309` is about bookmarks, not the note view, so that citation is wrong.
9. Line 20: `ls -la .oculus/notes` in the main checkout shows only `.` and `..`. Holds. "No note exists to carry over" can only be checked for that folder: a `notes:` key in the hub's `local.yml` could point elsewhere, and reading that file is forbidden (Declined).
10. Line 23: `openSourceFile` is at `views/shared/links/source-file.ts:15-21`, `MarkdownPreview.svelte:49-50` imports `RenderedMarkdown` and `shareHeadings`. Holds.
11. Line 24: `markdown.ts:23` and `html.ts:28` hold. `html.ts:180` is `purifier.sanitize(html, PROFILE)`. G5's test title is at `tests/ui/html.test.ts:14`. `package.json:98` says `"marked": "^18.0.12"` and the installed version is 18.0.12 (`node_modules/marked/package.json`). Holds.
12. Line 25: `package.json:93` says `"katex": "^0.18.7"` and the installed version is 0.18.7. `git grep -l -i katex 69b944eca -- tools/oculus/src` lists 9 files, none under `data/prose/` or `shared/prose/`. Holds. The brief does not say that the existing KaTeX users load the stylesheet lazily (`views/shared/latex/math.ts:22-25`: "KaTeX and its stylesheet load on the first formula, as a chunk of their own"), or that `math.ts:10` sets `trust: false`, `maxSize: 50`, `maxExpand: 1000` and draws an error in `var(--c-red-txt)`.
13. Line 26: `DESIGN.md:660` and `behavior.yml:122` (`autosave: 'off'`) hold.
14. Line 29: `package.json:121` holds. `/usr/bin/grep -c -i wiki node_modules/vscode-markdown-languageserver/dist/node/workerMain.js` prints 0, and the same grep over `node_modules/vscode-markdown-languageservice` finds nothing. Holds. `servers.ts:49-55` are imports. The Markdown entry itself, with its `answers`, `results` and `filesUnder` hooks, is at `servers.ts:542-573`, and read item 5's range (`servers.ts:1-120`) leaves it out.
15. Line 30: `answers.ts` answers before the server. Holds. Not stated in the brief: the hook `answers?(request, view): PageAnswer | undefined` (`adapters/entry.ts:209`) is synchronous and either answers alone or hands the request on, and `results?(method, result, root)` (`:203`) receives neither the request's position nor the document. Neither hook can merge an own completion, reference or rename answer with the server's for the same request. Part 2 bullet 2's "merged with the Markdown server's own answers" therefore needs `adapters/entry.ts`, `servers.ts` or the held request code, and none of these is in the write list.
16. Line 31: `places.ts:87` holds. The other dot-folder rules are listed in Names 12.
17. Line 34: `query.ts:43` and `:164-176` (`searchArgs` at 168) hold, and G2's search title is at `tests/server/files/search.test.ts:32`. Holds.
18. Line 35: `namesArgs` at `query.ts:284-293` holds (`--files --hidden`, private folders withheld). That Go to File actually lists `.oculus/notes/*.md` was not run (Declined). The hub `.gitignore` ignores only `/.oculus/local.yml` (`git show 69b944eca:.gitignore | grep -n oculus` gives line 166).
19. Line 38: `row-ops.ts:38` (`ROW_NEW_FILE`) and `:235` (`deps.startName('file', row)`) hold. `file-ops.ts:45-46` (`MAX_UPLOAD_BYTES` 32 MB) holds. Not stated: `uploadItem` (`fs/ops.ts:489-530`) refuses a taken name with `exists` (`:504`), and `resolveFolder` (`:493`) needs the folder to exist. The ` 1`, ` 2` naming and the first upload into a missing `attachments/` both need code the brief does not mention.
20. Line 39: `Graph.svelte`, `layout.ts` and `forces.ts` exist. `package.json:69,84` hold. `html.ts:321` is `sanitize(svg, GRAPH_PROFILE)`. Holds.
21. Line 40: the `folders.ts` head comment holds, as does `hubDirs` in `private-folders.ts:22-24`.
22. Line 41: `Files.svelte:9` and `Search.svelte:8` hold (`group: 'explorer'`). `config/layout.yml:31` gives `explorer` the chord `s`. Holds.
23. Line 43: `git ls-tree 69b944eca docs/adr tools/oculus/docs/adr` prints nothing. Holds.
24. A premise the brief does not state: an existing route already serves any file of a served root, `src/routes/api/(files)/file/[root]/[...path]/+server.ts` (`serveFile`, `src/lib/server/files/files.ts:139-160`, sent with `typeOf(full)`, so an SVG goes out as an image). Part 7 asks for a new route without weighing this one.
25. A premise the brief does not state: the sanitiser profile allows no `style` (`html.ts:8`, `:93`) and allows `title` (`html.ts:104`). `node -e "require('katex').renderToString('\\frac{1}{',{throwOnError:false})"` in `tools/oculus` prints `<span class="katex-error" title="ParseError: KaTeX parse error: ..." style="color:#cc0000">`, and a good formula carries `style=` and `<math` (both checks `true`).

## Cases and checks

1. Case 8 and Part 1 bullet 4 say "G31's row keeps passing unchanged". That is impossible. `tests/server/files/notes.test.ts:12` imports `saveNote`, and `:19-20` build the fixture with `saveNote(dir, 'one', 'One', 'first')`. Part 1 bullet 3 removes `note-save` "with their code", so the file must change. Under spec.md:58 and :60 that edit is to be listed. The brief should say that the setup changes and the assertions stay.
2. Case 8 says the reorder "writes `{"version":1,"order":["b","a","c"]}`". `writeJsonAtomic` (`server/core/json.ts:69-70`) writes `JSON.stringify(payload, null, 2)` plus a newline, so the bytes will never match. The case should say the parsed value.
3. Cases 36 and 37, and Part 9 ("its source text with KaTeX's error colour"), clash with spec.md:49. KaTeX's error colour is the raw hex `#cc0000`, written in an inline `style`, and the span carries KaTeX's English parse error as `title` (Premises 25). spec.md:49 requires colours from `themes/tokens.css` and an error from a library to be mapped to a catalog line before it is shown. The existing `math.ts:34-35` uses `var(--c-red-txt)`.
4. Line 152 ("the first run of every case above on the unchanged tree") and verify item 5 ("Each case's run is quoted") ask for runs of cases that only a page shows: 1, 5, 6, 9, 10, 15, 19, 20, 21, 25, 28, 29, 30 and 31. spec.md:63-64 says a builder runs no page, and such a case is checked by reading and by unit-level runs, with the look on landing named as its proof. The brief's "Every other case is checked by a run the report quotes" does not say this.
5. Case 29 ("Dropping `photo.jpg` from Finder") cannot be run by the builder (spec.md:63), and a look on TEST cannot drop a Finder file either. No case says how it is proven.
6. Case 35 ("`README.md` of a project") does not say that it is a scratch fixture. spec.md:37 forbids writing under `projects/`.
7. Case 38 attributes the arguments of `/api/ops` and ripgrep to G7. G7's Code line names `src/routes/api/` commands, hpc and open, the language servers and the linters, and not search or ops. `/api/ops` also starts no command. G7 is not in the brief's list of testable entries, so the attribution only misleads.
8. Case 40 checks the existing rule of `folders.ts` (a folder whose real path an earlier entry holds is left out, `folders.ts` head comment). That file is not changed. The case asks the builder to verify a place the step does not change. Its use for the Notes groups is legitimate only if it is phrased as "the Notes section shows one group".
9. Case 7 ("the key shows as unknown") can only be seen in the Settings view's `local.yml` node, which the standing demands forbid a look to open (`orchestrator-state.md`, "Looks and the machine"). Its proof must be the unit run of `checkLocal`, which belongs to G13 and is not named.
10. The test bullet lists G2, G3, G5, G9, G10, G31, G60 and G72. The step also touches G8, G12, G13 and G28 (Other checks 1). spec.md:58 says "A step whose change touches an entry's code runs that entry's test". The verify list runs no `tests/checks/config/` file. `test:quick` leaves `tests/checks` to `test:checks` (`tests/tiers/essential.txt` head comment), so `config-folder.test.ts` (G12, G13) would first go red at landing.
11. Brief line 7 says "every line is written to the standards pages" while line 5 says "The configuration lists no standards pages". The reference points at nothing.

## The question

The goal is ruling 92: notes that work like Obsidian's in each hub. For each item: could it pass without the goal being reached?

1. Case 1: no. It needs the file, its source tab and the Outline.
2. Case 2: no.
3. Case 3: yes, partly. It never names a name that differs from an existing note only by letter case or by Unicode normalisation (Implied inputs 1, 2).
4. Case 4: yes. A fake-clock test of the scheduler can pass while the note's source tab never wires it. Its proof has to be the look (Cases 4).
5. Case 5: no.
6. Case 6: no.
7. Case 7: no.
8. Case 8: yes. It says nothing about the `[[...]]` links of a note moved into `sub` (Implied inputs 9).
9. Case 9: no.
10. Case 10: no.
11. Case 11: no.
12. Case 12: yes. It never checks that a same-named note in another hub keeps `[[Meeting 2026-10-13]]` untouched, and never puts the renamed note itself open in a tab with a save pending (Implied inputs 4).
13. Case 13: no.
14. Case 14: yes, partly. It does not cover a tie at the same depth, or two paths that differ only in letter case.
15. Case 15: no.
16. Case 16: no.
17. Case 17: yes. It can pass with `markdownFiles` changed while `held/watch.ts` still drops the notes' file events, so a note created on disk stays unknown to the server (Names 12). Only G72's slow test with a note folder row would catch that, and the case names none.
18. Case 18: no.
19. Case 19: no.
20. Case 20: yes, partly. It covers a save made on this page, and not a note made, renamed, removed or changed by another program.
21. Case 21: yes. Nothing checks that the graph redraws when a note is made or renamed, which Part 4 requires.
22. Case 22: no.
23. Case 23: no.
24. Case 24: no.
25. Case 25: no.
26. Case 26: no.
27. Case 27: no.
28. Case 28: no.
29. Case 29: no.
30. Case 30: no.
31. Case 31: no.
32. Case 32: no.
33. Case 33: yes. A press on `idea` searches `#idea` as a whole word over the notes. `B.md` carries `idea` only in front matter, without `#`, so the search shows one note while the Tags section counts two. The case passes as written, but the tag search does not find what Obsidian's finds. With two hubs, "over the notes" also has no defined scope: `SearchQuery.under` names a path under one root (`query.ts:177`).
34. Case 34: yes. `[[note#heading]]` is not among the inputs (Implied inputs 12).
35. Case 35: no.
36. Case 36: no.
37. Case 37: no.
38. Case 38: no.
39. Case 39: no.
40. Case 40: no.
41. The step line, part (3): a saved Files tab places Backlinks last (Names 13). The line can pass for a fresh tab and not for Axel's existing one.
42. What to build, Part 1 bullet 1 ("opens in the Markdown source tab ... as any Markdown file"): yes. The tab opens, but the Markdown server, the link rewrite and the edit path all refuse dot folders (Names 12). Only Part 2's cases reveal it.
43. Part 2 bullet 2 ("merged with the Markdown server's own answers"): yes. The entry's hooks cannot merge (Premises 15). An answer that replaces the server's can pass cases 9 to 11 while path completion and the server's own references are lost in notes.
44. Part 2 bullet 3 (rewrite on rename or move): yes. Case 12 does not cover a refusal half way through, where the file is renamed and the rewrite is refused because a linking note is open on another page (Implied inputs 5).
45. Part 6: no.
46. Part 7: yes. The ` 1` suffix can pass on one page while two pages pasting in the same second get `exists` (Implied inputs 15).
47. Part 9: yes. Allowing `style` in the shared `PROFILE` passes case 37 (no script, no `onerror`) while every hub text gains inline styles (Other checks 7).

## Implied inputs

Each of these is missing from Cases, has happened or would cost something if answered wrongly, and has an expected result.

1. A new note or rename whose name differs from an existing note only by letter case (`kickoff` beside `Kickoff.md`). APFS on this machine cannot hold both files, and links compare without letter case. Expected: refused as taken, nothing written.
2. A case-only rename (`kickoff` to `Kickoff`). `ops.ts:328` already handles case-only renames of the same file. Expected: the file is renamed and every link is rewritten to the new spelling.
3. `[[Uber notes]]` typed in NFC while the file name is stored in NFD, or the reverse. Expected: it resolves.
4. A note renamed or moved, or moved to the Trash, while its own tab holds unsaved text with the 800 ms save pending. The pending save must not recreate the old path. Expected: the tab follows the new path and the save writes there, or the pending save is refused with the changed-file conflict, and no file appears at the old name.
5. A rename whose link rewrite is refused (a linking note open in a tab of another page, which `edits.ts`'s plan refuses per its head comment, or a linking note over the size limit). Expected: nothing is renamed and the refusal names the file, so no link is left broken.
6. Two pages open on one note. Both type, and the second save gets the base conflict. Expected: the second page marks the tab changed (G60's row) and overwrites nothing.
7. A hub removed from the workspace while one of its notes is open in a tab, the Notes Graph's saved filter names it, or Backlinks shows its notes. Expected: the tab is drawn as a file outside the roots, and the filter falls back to all hubs.
8. A workspace with no hub at all. Part 5 covers "no primary" but not "no hub". Expected: the Notes section says so in one muted row and offers no New Note.
9. A note moved into a subfolder (case 8's drag) when bare `[[a]]` links point at it. Expected, stated either way: they stay unchanged while the name is unique, or they are rewritten to `[[sub/a]]`.
10. A drag of a note onto a folder that already holds a note of the same name. Expected: refused as taken, nothing moved or rewritten.
11. `.oculus/notes` that is a symbolic link to a folder outside the hub, for example an existing Obsidian vault. Case 39 covers only a note file that is a link. Expected: stated either way, listed and served, or refused with a sentence.
12. `[[note#heading]]` and `![[note#heading]]` in a note. Expected: `#heading` inside the brackets is not a tag. An embed of a heading either draws that section or is drawn as a link; the brief has to say which.
13. A wiki link with `|` inside a GFM table row (`| [[Kickoff\|kick]] |`). Expected: the table keeps its cells and the link shows "kick".
14. A note name holding `%`, `?`, `&` or `'` that reaches a URL (the image route, the page address of a source tab, the `file:` URI given to the server, an `href` in the preview). Expected: encoded once, and the note opens. Case 38 covers only `/api/ops` and ripgrep.
15. Two pages pasting an image in the same second, with an upload refused `exists` (`ops.ts:504`). Expected: the second page takes the next free ` N` name.
16. The first paste into a hub whose `attachments/` folder, or whose notes folder, does not exist yet. `uploadItem` needs the folder (`ops.ts:493`). Expected: the folder is made and the image written.
17. An SVG in `attachments/` that carries a script, opened through the image route (the existing file route serves it as `image/svg+xml`, Premises 24). Expected: drawn only as `<img>`, and the route sends it so that opening its URL runs nothing in oculus's origin.
18. A saved Files tab whose section order was saved before the step (Names 13). Expected: stated. `sectionsOf` puts Backlinks last, and no code moves it (spec.md:42).
19. Two hubs whose folders share a base name (`~/a/hub` and `~/b/hub`). Part 5 names each group "by the hub's folder name". Expected: the workspace entry's unique `name` is used.
20. A press on a missing `[[sub/Nowhere]]` or `[[a:b]]`. Expected: stated. Either the note is made in `sub/` or refused, since decision 3 refuses `/` in a name. `a:b` is refused with its sentence.
21. A tag press with notes in two hubs (Search's `under` names one root). Expected: the scope covers every hub's notes folder.
22. Closing a note tab inside the 800 ms wait under `editor.autosave: off` (G28: "Under `on_focus_change`, or `after_delay` of 1000 ms or less, closing ... saves it in place of the question"). Expected: stated, either saves or asks.
23. A note name with leading or trailing spaces. Expected: stated, either trimmed before the write or refused.
24. The Notes tree's treatment of `order.json` and of non-Markdown files in `attachments/`. Expected: stated. `order.json` is not listed, and `attachments/` is either shown with its files or hidden.

## ADRs

1. `git ls-tree 69b944eca docs/adr tools/oculus/docs/adr` prints nothing. Neither folder exists. `git ls-tree --name-only 69b944eca docs/ tools/oculus/docs/` lists no `glossary.md` either.

## Dictated text

`LC_ALL=C /usr/bin/grep -n '[^ -~]' D76.md` prints no line, so the brief is ASCII. It dictates no sentence for any file. The word-for-word strings are names and formats:

1. `Pasted image <yyyymmddhhmmss>.<ext>` (`grep -n -F 'Pasted image' D76.md` gives lines 79, 132 and 205): a file-name format. Holds.
2. `![[<file name>]]` inserted at the caret (`grep -n -F '![[<file name>]]' D76.md` gives line 79): text written into the reader's note. Holds.
3. The suffixes `` ` 1`, ` 2` `` (`grep -n -F '` 1`, ` 2`' D76.md` gives line 79). Holds.
4. `{"version":1,"order":["b","a","c"]}` (`grep -n -F '{"version":1,"order":["b","a","c"]}' D76.md` gives line 100): file content dictated byte for byte, which does not match what the writer writes (Cases 2).

## Other checks

1. Guarded entries named. Each was read with `awk` over `agents/guarded.md`:
    - G2's search row, G3's Markdown rows, G5's test, G9's log and undo, G10's Trash, G31's notes-order row, G60's wording and G72's text and slow file all say what the brief says of them.
    - G7's Code line does not cover search or ops (Cases 7).
    - At brief line 26, the "base, history copy and atomic write (... G9, G58, G59)" fits G9 only. G58 is the NUL and UTF-8 refusal and the BOM; G59 is trimming and the final newline.
    - G58 and G59 are cited correctly in Part 1 bullet 4 only as rules that stay unchanged.
2. Guarded entries touched but not named. Found by matching each written path against the `Code:` lines:
    - G8: `lsp-edit.ts` and `edits.ts`, which the link rewrite changes.
    - G12 and G13: the `config/text/` catalog files and `config-folder.test.ts`; `local.ts`, a config reader under `src/lib/data/sources/config/`.
    - G25: `docs/palette.md` and the diagrams, which the verify list does check.
    - G28: `autosave.svelte.ts`.
    - G67: `edits.ts`, for its closed-file sentences.
    - Possibly G37 (`openRow` in `shared/explorer/opening.ts`), G57 (`tree/control/dragging.svelte.ts`) and G69 (`fs-transport.ts`, `fs.ts`), if the Notes tree reuses those parts.
    - Possibly G82 (`payloads.ts`), named because `payloads.ts` is in the write list.
    - G21 and G24 are named only in passing (Parts 4 and 1).
3. "Paths this step writes" is missing files that What to build requires:
    - `src/routes/api/(files)/fs/+server.ts` (Names 8).
    - `src/lib/server/machine/lsp/held/watch.ts` (Names 12, for G72).
    - `src/lib/server/machine/lsp/adapters/entry.ts` and `servers.ts` (Premises 15, the merge).
    - `src/lib/server/files/search/search-routes.ts` (Names 11).
    - `src/lib/server/root/context.ts`, where the watchers are built (`:437-440` builds `startBookmarks`) and a notes watcher per hub would be wired.
    - `tests/checks/config/config-folder.test.ts` and `tests/routes/hubs/machine-answer.test.ts` (outside the brief's test scope).
    - `src/app.css` does not exist (`git ls-tree --name-only 69b944eca tools/oculus/src/`), so "the page's style entry" is unnamed.
    - Part 2 bullet 3 sends the rewrite through the page's `edits.ts`, while the write list's `ops.ts` line says "the move and rename that rewrite links". The brief does not say on which side the rewrite runs.
4. Folder counts (`git ls-tree --name-only 69b944eca tools/oculus/<dir>/ | wc -l`). Several folders the brief adds new files to already hold 10 items, the limit of spec.md:47: `src/lib/data/prose`, `src/routes/api/(files)`, `src/lib/server/machine/lsp/adapters/markdown`, `src/lib/views/shared/prose`, `src/lib/views/shared` (where the shared graph would go), `src/lib/server/root/watch`, `src/lib/server/files/fs` and `src/lib/views/sources/source`. Each new file forces a split, which moves existing files and changes their importers outside the write list. The brief does not say so.
5. Libraries, checked with `npm view marked-katex-extension version license maintainers peerDependencies time.modified`:
    - It prints `5.1.13`, `MIT`, `tonybrix <tony@brix.ninja>`, `{ katex: '>=0.16 <0.19', marked: '>=4 <19' }` and `2026-09-16T05:59:37.481Z`, and `npm view marked maintainers` includes tonybrix. Holds. `npm view marked-katex-extension repository.url` is `github.com/UziTech/...`, a personal repository and not the markedjs organisation.
    - Marksman: `curl` of the GitHub API gives `tag_name 2026-02-08`, `spdx_id MIT`. Holds.
    - `npm search marked wikilink` does not print "none". It prints `marked-terminal`, `marked` and `marked-highlight`, and the JSON search's results named `wiki` are only `@moritzrs/mdast-util-ofm-wikilink`, `@moritzrs/micromark-extension-ofm-wikilink` (0.0.1, 2024-11-02) and `mdast-util-wiki-link`. The conclusion (no marked extension for `[[...]]`) holds; the quoted output does not.
    - `@viz-js/viz` 3.30.0 and `d3-force` 3.0.0 are installed. Holds.
6. The overlap with D74. `git diff --name-only HEAD 69b944eca -- tools/oculus`, crossed with D76's write list, shows D74 changing far more than the four paths the plan line names. Shared files include `src/lib/state/sources/fs.svelte.ts`, `config/behavior.yml`, `config/text/views/sources/files.yml`, `src/routes/views.ts`, `src/lib/views/shared/explorer/rooted-tree.svelte.ts`, `src/lib/views/sources/source/Source.svelte`, `src/lib/state/client/shapes/payloads.ts`, `src/lib/data/model/index.ts`, `src/lib/server/root/watch/{apps,git,portfolio}.ts`, `docs/apps.md`, `docs/palette.md`, `docs/diagrams/*`, `tests/checks/config/config-folder.test.ts` and `tests/checks/source/keys.test.ts`. D74's repair round is changing that worktree now, so every one of these needs merging at landing. The plan line's "corrected at D76's /spec" list is incomplete.
7. Part 9 says KaTeX needs are allowed "in its profile and nothing more" without saying which profile. `PROFILE` serves every hub and feed text (`html.ts` head). Widening it with `style` reaches every card. A profile of its own (as `DIAGRAM_PROFILE`, `html.ts:147-149`, does for diagrams) is the reading consistent with G5, and the brief should name it.
8. Brief decisions 7 (link resolution), 10 (attachment folder and paste name) and 11 (where a missing note is made) are user-visible shapes with no Z ruling. `grep -n -E 'Z87[0-9]|Pasted image|shortest path|attachments' choices.md plan.md` finds only Z870 to Z877. Part 5's "the first hub's when there is no primary" is not booked either.
9. The brief names no worktree path, no base copy folder and no base output of `unused-exports.sh`. spec.md:31-32 and :86 say the brief names them, and verify item 2 depends on "the base's run". `grep -n -i -E 'base copy|worktrees/' D76.md` prints nothing.
10. `plan.md` has no Goal section. `grep -n '^## ' plan.md` lists Packages, Could run in parallel, Rulings, Agents and Blocked. The goal was taken from Open item 92 (`plan.md:1935`).
11. Brief line 45 ("The plan's verify list equals the verification page's commands") was not compared (Declined).

## Declined to judge

1. The worktree `.agents/worktrees/D74`, which brief line 11 calls sparse with no hub `.oculus/`: I was told not to read it, since D74's repair round is changing it.
2. Whether this machine's `local.yml` sets `notes:` to a folder holding notes, which bears on "No note exists to carry over": reading `local.yml` is forbidden.
3. Whether Go to File really lists `.oculus/notes/*.md`: not run. A `rg --files --hidden` over the hub would print the name `.oculus/local.yml`, and it is judged here by reading `namesArgs` only.
4. Whether `marked-katex-extension`'s output passes the current DOMPurify profile: not run. Only `katex.renderToString` was run, in Premises 25.
5. Brief line 45, the verify list against the state file's verification commands: not compared.
6. The D74 changes to `paths.ts` beyond `git diff --stat HEAD 69b944eca` (4 lines) were not read line by line.

Usage: a258af2188e2127e1, claude-opus-5-5, 304,957 tokens, 108 tool uses, 15.5 min (930,752 ms).

## Closed

Each finding above is closed by a change to `agents/briefs/D76.md` or to `plan.md`, or, where it needs none, by the reason given.

- Names 1, 2, 4, 5, 10: hold; no change.
- Names 3 and 6: "What to build" Part 1 removes `titleOf`, `writesNow`, `stamp` and every export of `state/life/notes.ts` left with no importer, and keeps `autosaveMs` and `debounce` only where the note's save uses them; the unused-exports check against the base copy's output is verify item 2.
- Names 7: Part 1 removes `note.yml` and the `note` registration, and `config-folder.test.ts`'s `CATALOG_FILES` and description rows follow the catalog files removed and added (G12, G13); HELP.md:238 is in "The documents" and in read item 13 (lines 230-240).
- Names 8 and 9: the route `src/routes/api/(files)/fs/+server.ts` (code and head comment) is in Part 1 and the paths; `fs.test.ts:54` and `machine-answer.test.ts:42` drop the `notes` field from their fixtures with their assertions unchanged, both in the paths.
- Names 11: Part 6 has `search-routes.ts` hand the hubs' notes folders to the query; `search-routes.ts` and `search.ts` are in the paths.
- Names 12 and Premises 16: "What is on the tree" names the four dot-folder rules (`places.ts:87`, `held/watch.ts:118-120` and `:243-251`, `lsp-edit.ts:58-66`, `edits.ts` head 22-26); Part 2 relaxes each for a hub's `.oculus/notes/` only and keeps every other refusal; `held/` is in the paths; case 20 carries G72's row for a note.
- Names 13 and Implied inputs 18: Part 3's second bullet changes `sectionsOf` to place a missing id after its nearest predecessor in `SECTION_ORDER`; case 24 (a change of the merge rule, no migration of stored data).
- The step line 8: the brief's Part 1 ends with the "Not built, by Axel's word" list.
- The step line 9 and Premises 1: the base is a commit of tree 69b944eca with `.oculus/config.yml` written from D74's report and `.oculus/config/` removed ("Where you work, and the base").
- The step line 10 and Other checks 6: `plan.md`'s D76 line now names the wider overlap; the orchestrator merges at landing, the brief says so.
- Premises 2: the worktree is made sparse by `/spec` after this check; the brief states it.
- Premises 3: Part 1 replaces `noteFile`'s id rule with decision 3's name rule and a path inside the folder, keeping its two link checks.
- Premises 5 and 8: `deleteNote` cited at `:181-188`; HELP.md:311 replaces :309.
- Premises 12: Part 9 shares `math.ts`'s options and its lazy load of KaTeX and the stylesheet, and draws an error in `var(--c-red-txt)`.
- Premises 14: read item 5 names `servers.ts:540-575`.
- Premises 15 and The question 43: "What is on the tree" states the two hooks' limits; Part 2 extends the hooks so an entry's result merges with the server's, written once; `adapters/entry.ts`, `servers.ts` and `held/` are in the paths.
- Premises 18 and Declined 3: the brief states the content search alone lacks `--hidden` and leaves Go to File as it is; `plan.md`'s part (6) parenthesis was corrected before this check.
- Premises 19, Implied inputs 15 and 16: Part 7 makes the folders first, names by decision 10 with ` 1`, ` 2`, and takes the next free name when the upload answers `exists`; case 33.
- Premises 24 and Implied inputs 17: Part 7 uses the existing file route (decision 13); `serveFile` sends every SVG with `nosniff` and the diagrams route's `content-security-policy`, the header pair shared with `diagrams.ts`; `files.ts` and `diagrams.ts` are in the paths; case 37.
- Premises 25, Cases 3 and The question 47: Part 9 uses a sanitiser profile of its own, leaves `PROFILE` unchanged, and draws a refused formula in `var(--c-red-txt)` with a catalog sentence as title; cases 41 and 42.
- Cases 1: Part 1 and case 9 say G31's fixture changes and its assertions stay.
- Cases 2 and Dictated text 4: case 9 gives the parsed value `{ version: 1, order: ["b", "a", "c"] }`.
- Cases 4: the cases a page alone shows carry (look), with spec.md's no-page rule stated at the head of "Cases".
- Cases 5: case 34 hands the drop handler a `File` and quotes the run; the Finder drop is named as not reproducible on TEST.
- Cases 6: case 23 uses the hub's own `README.md` on a look, which writes nothing.
- Cases 7: G7 is no longer named.
- Cases 8: case 30 reads "the Notes section shows one group".
- Cases 9: case 8 is a unit run of `checkLocal` and `perOculus` (G13), never the real file.
- Cases 10 and Other checks 2: the guarded entries are G2 G3 G5 G8 G9 G10 G12 G13 G25 G28 G31 G60 G67 G72, and G37 G57 G69 if reached; verify item 1 runs `tests/checks/config` with the other checks, and item 4 runs G72's slow file.
- Cases 11: the head now points at the rules file's standards only.
- The question 3, Implied inputs 1, 2, 3, 23: decision 3 refuses a name equal but for letter case or normalisation, writes NFC and trims; cases 3 and 4.
- The question 4 and Implied inputs 22: case 5 is a fake-clock run plus a look; Part 1 and case 10 make a close inside the wait save first.
- The question 8, Implied inputs 9: Part 2 and case 17 keep bare links while the name is unique and rewrite them when a move makes it shared.
- The question 12, Implied inputs 4 and 5: case 15 holds another hub's same-named note and an open tab with unsaved text; case 10 holds the renamed note's own pending save; case 16 holds the refused rewrite that renames nothing.
- The question 14: decision 7 orders by shortest path, then path order; names that differ only by case cannot both exist (decision 3).
- The question 17: case 20 is G72's slow file with a note row.
- The question 20: case 23 adds a note written by another program.
- The question 21: case 25 adds a node and an edge when `D.md` is made.
- The question 33 and Implied inputs 21: Part 8 makes a tag press search every hub's notes folders and find exactly the notes the section counts, front matter included; case 38.
- The question 34 and Implied inputs 12: Part 8 excludes `[[note#heading]]`; Part 7 draws `![[note#heading]]` as that section; cases 36 and 39.
- The question 42: Part 2 relaxes the dot-folder rules for the notes folders.
- The question 44: case 16.
- The question 46: case 33's `exists` row.
- Implied inputs 6: case 5's G60 row (a note changed on disk is marked changed and not overwritten) covers a second page's save.
- Implied inputs 7: case 26 (the filter, a tab of a removed hub, Backlinks' muted row).
- Implied inputs 8: Part 5 and case 27 (no hub: one muted row, no New Note).
- Implied inputs 10: case 9 (a drag onto a folder holding the name is refused).
- Implied inputs 11: Part 1 refuses a notes folder that links outside its hub; case 11.
- Implied inputs 13: Part 2 and case 19.
- Implied inputs 14: Part 2 encodes every name once; case 21.
- Implied inputs 19: Part 5 names a group by the workspace entry's `name`; case 27.
- Implied inputs 20: decision 11 and case 18 (`[[sub/Nowhere]]` made in `sub/`, `[[a:b]]` refused).
- Implied inputs 24: Part 1 does not list `order.json` and lists `attachments/` with its files.
- Other checks 1: the citation of G58 and G59 beside the save is gone; the save cites G9.
- Other checks 3: every path named is in the paths list; `src/app.css` is not used (KaTeX's stylesheet loads through `math.ts`); Part 2 says the rewrite is planned through `edits.ts` and written through `lsp-edit.ts` before the `/api/ops` rename.
- Other checks 4: "What is on the tree" lists the folders at the limit, and the paths allow a split with its importers, each named in the report.
- Other checks 5: "Libraries checked" quotes the npm search output and names the UziTech repository.
- Other checks 7: Part 9 names the profile of its own.
- Other checks 8: decisions 7, 10 and 11 are booked as self-rules (the link resolution, and the paste name, the missing note's folder and the head's New Note), in `plan.md`'s Rulings, the closed log and `choices.md`.
- Other checks 9: "Where you work, and the base" names the worktree, the base copy and its `unused-exports.txt`.
- Other checks 10: no change; the goal is ruling 92.
- Other checks 11 and Declined 5: the verify list is the state file's own `verify:` list, the verification page; they are equal.
- Declined 2: a `notes:` value in `local.yml` is read as an unknown key after the step; nothing reads it as a folder, so no note is carried from it (no migration code).
- Declined 4: case 42 checks the sanitised output of a formula.
