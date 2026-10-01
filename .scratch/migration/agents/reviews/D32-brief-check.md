# D32 brief check

BRIEF CHECK OF D32 (replace in the Search view). Tree read at main e160921b; `git status --short` shows only the untracked briefs D32.md and U4.md. Nothing was changed. `config/local.yml` was never opened or grepped, no URL fetched, no port touched, `.vscode` not read, no browser. ripgrep 15.0.0 (the bundled binary, `node -e "console.log(require('@vscode/ripgrep').rgPath)"`) was run only on files I made under $TMPDIR/d32check. I also grepped VS Code's own bundle `/Applications/Visual Studio Code.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js` (not `~/.vscode`) to read `buildReplaceStringWithCasePreserved` (minified as `Cst`) and the replace-pattern constructor.

Overall: the brief is not ready to dispatch. Section "Cases and checks" (C1 to C3), "Premises" (P1 to P12) and "Names" (N1 to N8) hold defects that would send the builder to a wrong result or to paths outside its list.

=====================================================================
## 1. Names
=====================================================================
Commands: `grep -rn --exclude=local.yml --exclude-dir=node_modules --exclude-dir=.svelte-kit --exclude-dir=.scratch --exclude-dir=build -E "<name>" src tests config HELP.md DESIGN.md README.md` for SearchHit, hitOf, SearchFile, SearchAnswer, SearchQuery, queryFrom, handleSearch, searchUrl, searchParams, searchArgs, perFileCount, trimAround, countHits, hitParts, firstLine, runSearch, searchState, parseSearchState, createFold, foldStream, `api/search`, `search.count`, `max_hits`, UndoKind, EditorAsk, asked(, valueNow; plus `git ls-tree --name-only HEAD <dir>/ | wc -l` for folder counts.

Hits inside the brief's paths: `search.ts:242,246,320` (hitOf), `state/sources/search.ts`, `search.svelte.ts`, `Results.svelte`, `Search.svelte`, `Query.svelte`, `model-search.ts`, `helpers/search.ts`, `changes.ts:39,79` (UndoKind, the only two hits in src and tests), `editor-status.svelte.ts:44` (EditorAsk, the only src hit; one comment at `tests/state/workbench/navigation/editor-status.test.ts:58`).

Hits OUTSIDE "Paths this step writes", each with whether the change makes it false or breaks it:

N1. Catalog word for the History view. `History.svelte:88` draws `t(\`history.kind_${row.kind...}\`)`; `t()` throws on a missing key (`src/lib/state/shared/words/text.ts:53`, "text key not in the text catalog"). A record with `kind: 'replace'` therefore throws in the History view unless `config/text/views/system/history.yml` (kind_ keys at lines 33 to 51) gains `kind_replace`. That file is not in the paths. Adding it is also not enough: `tests/fixtures/kinds.ts` builds the list of recorded kinds only from `src/lib/server/edit/writes/bodies.ts` (`kind: z.literal(...)`), and the gate at `tests/checks/source/keys.test.ts:172-174` derives the required `history.kind_*` keys from that list. A `replace` kind produced by the search route is not in bodies.ts, so the gate would not require the word (a missing word is not caught) and the word, once added, has no reader in the gate (an orphan key fails the keys test). `tests/fixtures/kinds.ts`, `tests/checks/source/keys.test.ts` and `tests/views/system/history.test.ts:180-190` are in none of the brief's paths. The brief's item 8 lists only `search.yml` for words.

N2. The create-search wiring is not in the paths. `createSearch(entities, writes, ui)` (`src/lib/state/client/context.ts:279`) holds no layout, no source store and no editor-status store, and `editorStatus` is created later at `context.ts:313`. Item 6 ("the page finds every source tab whose state names the file") needs the layout's tab list (the existing reader is passed to the explorer at `context.ts:280-285`: `tabs: () => layout.pages().flatMap((page) => tabsOf(page.workbench.root))`, used at `state/sources/explorer/ops.svelte.ts:180,212`). `context.ts` is not in the paths, and the brief's note "`source.svelte.ts` (only if a reader of tabs by file is needed there)" points at a store that holds drafts by instance id and no tab list (`source.svelte.ts` whole).

N3. The editor ask type. `EditorCommand` is declared in `src/lib/ui/controls/editor/types.ts:27` and performed in `src/lib/ui/controls/editor/commands.ts:13 runCommand`, whose last branch treats any kind it does not know as an action (`made.getAction(command.id)`). A new `{ kind: 'text' }` ask needs both files; the brief names only `Editor.svelte`. `views/sources/repositories/diff/Diff.svelte:93,370` also reads asks (`askedOf`) and must ignore the new kind. `commands.ts:33` is also written by D27. See P2: the new ask is not needed at all.

N4. `src/lib/server/files/source.ts:89 localRefusal` is not exported, and `source.ts` is not in the paths; see I9 (the replace must apply it).

N5. Tests that pin the changed shapes and are in directories the brief does not name (the brief names tests/server/files, core, edit, tests/state/sources, tests/views/sources):
- `tests/routes/files/search.test.ts:118` (`hits: [{ line: 12, column: 5, length: 6, text: 'the needle here' }]` expected in the answer) and `:34`.
- `tests/data/helpers/search.test.ts:36` (the full `searchArgs` list), `:103` (`perFileCount`), `:171-188` (`queryFrom`/`searchParams` round trip), if a `replace` parameter is added to the GET.
- `tests/routes/edit/undo.test.ts` (the undo tests live here, not in `tests/server/edit`, which holds no undo test) and `tests/routes/edit/write-fixture.ts`.
- Inside the named directories: `tests/server/files/search.test.ts:415` (`toEqual({ line: 1, column: 3, length: 6, text })` fails with extra `match`/`index`), `:190`, `:545-552` (a match record whose first submatch is unreadable gives a hit at column 1 length 0; item 1 does not say what it becomes, see I12), `tests/state/sources/search.test.ts:72` (`searchState` `toEqual`), `:91` (the exact URL `/api/search?root=hub&q=needle&word=1&case=0&regex=0&max=500`), `:368 toStrictEqual(empty)`, `tests/views/sources/search.test.ts:33` (`ANSWER: SearchAnswer`, a type error once `SearchHit` gains required fields).
- Brief case 14 limits "existing cases that change" to "hit count changes by item 1"; the shape change alone breaks the cases above.

N6. Documents the change makes false or incomplete that are not in the brief (it names only `DESIGN.md:389` and HELP's Search row):
- `DESIGN.md:130`: "answered by `GET /api/search`", "One subprocess call site" (replace.ts adds a second `spawn`, see P9).
- `DESIGN.md:140` and `:376`: the change log's description, the list of kinds that offer undo, "every write through `api/write`"; the log now also receives records from `api/search`.
- `HELP.md:256` lists what the change log records ("That is the manifest fields, ... "); a replace is missing there.
- `HELP.md:160-168` ("Searching the files") is where Search behaviour is described: line 164 (what is skipped) and 168 ("The answer stops at the configured number of hits", "a result row opens it at its own line") change meaning with one row per match; the brief's pointer is only the one-line table row at `HELP.md:113`.
- `DESIGN.md:389` itself says "It is a `GET` and not a channel".

N7. Folder limit (rules file). `git ls-tree --name-only HEAD <dir>/ | wc -l` prints 10 for `tests/server/core`, `tests/server/edit`, `tests/state/sources`, `tests/views/sources`, `tests/fixtures`, `src/lib/data/helpers`, `src/lib/state/sources`, `src/lib/server/files`, `config/text/views/sources`. Any new file in them fails `utils/folder-check.sh`. The brief says "new and changed cases under tests/server/core/, tests/server/edit/, tests/state/sources/, tests/views/sources/ (each file named in the report)". `tests/server/files` has 8, `src/lib/server/files/fs` has 3 (replace.ts fits). Where the shared preserve-case function (needed by the server splice and by the page preview, P7) and any new state module go is unresolved: `data/helpers` and `state/sources` are full.

N8. Shared paths with steps in flight (brief says "U4 writes none of this step's files; D35 none"):
- D35 writes `src/lib/server/edit/writes/undo.ts` (D35.md line 87, the `writeConfigKey` call at `undo.ts:280`), `src/lib/server/edit/writes.ts` and the call lines of `routes/api/write/+server.ts`, and changes `target()`'s signature (D35.md lines 16 and 33). D32 writes `undo.ts` (`valueNow`, `apply`) and will need a `ChangeLog` for the search route; today a `ChangeLog` exists only as `target(engine, merged, server).changes` (`edit/writes.ts:206-232`), whose signature D35 changes.
- D27 writes `Source.svelte`, `Editor.svelte`, `commands.ts:33`, `DESIGN.md` 85/171/379 and `HELP.md:230`, and `tests/views/sources/source.test.ts` lines 494-516 (D32 writes tests under `tests/views/sources/`).
- Q85d: `Source.svelte` is as the brief says. The brief's description "`:223-231`" as instance-state readers is `readOne` (an HTTP body cast) at `Source.svelte:223`; the state readers are `read` (`:296`) and `number` (`:302`).
- U4 writes `DESIGN.md:408` and `HELP.md:100`; no overlap with D32's lines. All four steps regenerate `docs/diagrams/`.

Other existing readers of the changed names, checked and not made false: `Results.svelte` keyed each (see P5 for the breakage), `state/sources/search.ts:136 hitParts`, `firstLine`, `countHits` (no other reader), `config/behavior.yml:143` ("`max_hits` is how many hits one answer carries": stays true if hit means match). History's drawing of before and after: `views/system/history/rows.ts:shown()` already draws a list as indented JSON with its size under a disclosure (`rows.ts:25-31` read), so span lists draw with no History change apart from N1. No test asserts the `UndoKind` list (`grep -rn UndoKind tests` prints nothing).

=====================================================================
## 2. The step line
=====================================================================
Command: `grep -n '^- D32 ' plan.md` (line 432) and the sub-line at 433; `sed -n 620,632p plan.md` (Z84 at 627); `git show 528b3d11:.../orchestrator-state.md | sed -n 177,180p` for Z84's wording.

Step line parts and the items that serve them:
- "a replace field": item 2.
- "replace one hit": items 2 (hover Replace), 3 (`only`), 4 (single splice), 1 (match addressable).
- "one file": items 2 (Replace All in File), 3 (`files` of one).
- "or all": items 2 (Replace All, confirm), 3.
- "each write through oculus's write chain and its change log (Z84 (a))": item 5.
- "as VS Code's" (Z84 (a)): items 1, 2, 4 (preserve case), 6.
- Sub-line "Widened 2026-10-01 by the Settings ruling" (plan.md:433): "Search keeps ripgrep's order with no smart-case key, and leaves out what git ignores, hidden folders and the fixed skip list (`data/helpers/search.ts`); a file is read-only by its own mode; said in HELP.md." This has no item. Item 8 asks only that HELP's Search row "names the replace". `grep -n -i "smart" HELP.md` prints nothing; HELP.md:164 says what is skipped; nothing in HELP.md says Search has no smart-case key or sort option, and nothing ties "read-only by its own mode" to Search. Part with no item: the HELP.md sentences for ripgrep's order, no smart-case key, and the read-only rule (the `readonly` refusal in item 3 builds the behaviour but nothing writes the sentence).

=====================================================================
## 3. Premises
=====================================================================
Reruns of "What is on the tree":
- `wc -l` Search.svelte 135, Query.svelte 112, Results.svelte 193, state/search.ts 149, search.svelte.ts 134, search-routes.ts 66, server search.ts 417, changes.ts 294, undo.ts 355, model-search.ts 48: all match the brief.
- `hitOf` at `search.ts:242`, `submatches?.[0]` at `:246`: match. Route file `src/routes/api/(files)/search/+server.ts` exports only GET: match. `ls src/lib/server/files | wc -l` 10, `fs/` 3 (bookmarks, notes, ops): match.
- `ChangeRecord`, `UndoKind` at `changes.ts:39`, `valueNow` at `undo.ts:119`, `undoChange` at `:209`, `EditorAsk` at `editor-status.svelte.ts:44` with the seven kinds, `Source.svelte:46`, `Editor.svelte:259` (model effect, ends about 290), `MAX_QUERY` 1000, `HIT_WIDTH` 240, `MAX_FILESIZE` '2M', `SKIP_GLOBS`, behavior.yml `search: max_hits: 500`: match.
- ripgrep (`rg --json -r 'X$0' 'fo(o)' a.txt` on `foo bar foo\nbaz fooo\n`): per matching line `absolute_offset` 0 and 12; submatches with `start`/`end` (0-3, 8-11; 4-7), `match.text`, `replacement.text` `Xfoo`. `rg --passthru -r 'Y$1'`: `Yo bar Yo` / `baz Yoo`. `$$` gives a literal dollar (`rg --passthru -r 'a$$b'` prints `a$b bar a$b`). Match.
- WRONG: "`SearchQuery { pattern, word, case, regex, under }`" (brief, premise 14). `src/lib/data/helpers/search.ts:35-50` declares `{ q, root, word, case, regex, max, under }`. This matters because item 3's body `query: SearchQuery` and the page's `queryOf`/`parseSearchState` use those names.
- WRONG: "The write chain the file browser's writes use" (`ChangeLog.writes`). `src/lib/server/root/context.ts:101-109` has two chains: `fsWrites` ("the write chain of the workspaces file"), which `ChangeLog.writes` is (`edit/writes.ts:229`), and `opsWrites` ("the write chain of the file operations under the served roots", used by `api/ops`; `DESIGN.md:384`). Rename, move, trash and delete of files under the roots run behind `opsWrites`. A replace writing files under served roots behind `fsWrites` does not wait for them (a concurrent trash or rename of the same file can be followed by `writeTextAtomic` re-creating the old path). Which chain the file writes use is a choice the brief states as fact.
- Q85d's "`:223-231`": see N8.

Build items that contradict the tree or VS Code (each reproduced):

P1. Deadlock hazard in item 5. `chained(writes, work)` (`core/json.ts:113`) is not re-entrant: `writes.chain` is replaced by a promise that waits for the running `work`. `logChanges` (`changes.ts:279`) itself calls `chained(log.writes, ...)`. If the replace does its read, ripgrep and write inside `chained(ChangeLog.writes, ...)` and calls `logChanges` inside that, the append waits for the closure that waits for the append. Existing writers write outside the chain and only the append is chained (`edit/writes.ts:541-558 answer`). The brief says "Every file written is written behind the workspace write chain" and does not say the record is appended after the closure returns.

P2. Item 6's new ask duplicates an existing path and breaks on two tabs. (a) `Source.svelte:421` passes `text={draft.text}` to the editor, and `ui/controls/editor/Editor.svelte` (effect with the comment "A text the parent hands in that the model does not hold already replaces the model's as one edit", right after the model effect) applies a changed text with `pushEditOperations` over `getFullModelRange()` and does not call `onchange`. `editSourceDraft(id, text)` therefore already reaches a mounted tab's model as one undoable edit; the new `{kind: 'text'}` ask, its `perform` and its `Source.svelte` branch repeat that. (b) The ask mailbox holds one slot: `ask()` (`editor-status.svelte.ts:127-131`) sets `held.last`, and `asked(instance)` returns null when `last.instance !== instance` (`:133-135`). Two asks to two tabs of one file in the same tick lose the first. Brief case 13 "two tabs on one file both take the text" fails on this; (c) `Source.svelte:277` drops any ask while the tab is not `editing` (`error === '' && draft.loaded && locked === ''`, `:136`), while `ask()` returned true; a mounted read-only or not-yet-loaded tab reports success and gets nothing.

P3. Literal mode and `$`. Brief decision 1 says the replacement syntax is ripgrep's and "differs from VS Code's JavaScript form only where a pattern uses a feature one engine lacks". In literal mode (`--fixed-strings`, the default) ripgrep still expands the replacement: `rg --passthru -F -r 'a$b' foo a.txt` prints `a bar a` / `baz ao` (the text `$b` is deleted); `-F -r '[$0]'` prints `[foo] bar [foo]`. VS Code does not parse the replacement unless the search is a regex: in the bundle, `constructor(o,e,t){...n=!!i.isRegExp...,n&&this.parseReplaceString(o)`. So a literal replace of text containing `$name` or `$0` silently loses or alters text. In regex mode ripgrep also differs: `Y$1x` reads `$1x` as the group `1x` and gives `Y` (`rg -r 'Y$1x' 'fo(o)'`), `\n` stays a backslash and an n (`rg -r 'a\nb'` prints `a\nb`), and VS Code's case operators `\u \U \l \L` (`_caseOpsRegExp` in the bundle) do not exist in ripgrep. Z84 says "as VS Code's".

P4. `MAX_FILESIZE`, hidden and ignore rules do not apply to a file named on ripgrep's command line. With `--json --max-filesize 2M --glob '!node_modules' --glob '!.git' --glob '!.svelte-kit' --ignore-case --fixed-strings -r X --regexp foo <file>`: `./node_modules/x/n.txt`, `./.hid/h.txt`, `./.dot`, a file named in `.gitignore` (`z.ign`) and a 3,000,000-byte `big.txt` are all matched. Item 4 says the replace runs "with the query's flags exactly as the search runs them" and case 13 says "a file over MAX_FILESIZE is not matched by ripgrep and is reported with replaced: 0". For an explicit path that is false; the replace would rewrite files the Search view never lists (any path under `.git/`, `node_modules/`, ignored or hidden) and files over 2M, and Z84's widened line says Search leaves those out. The brief needs its own rule in `replace.ts` (size, and which files may be replaced).

P5. Item 1 breaks `Results.svelte`. The keyed each at `Results.svelte:94` is `(\`${hit.line}:${hit.column}\`)`. `column` is the column inside the cut window (`trimAround`, `helpers/search.ts:166`). I ran the function on a line `a*300 + foo + b*300 + foo + c*300`: matches at columns 301 and 604 both come out at window column 119. Two matches on one long line give a duplicate key. The brief gives hits an `index` and does not say the key changes.

P6. `characters()` (`search.ts:256-265`) miscounts after an astral character. `characters('\u{1F600} foo\n', 5)` returns 2, the correct count of UTF-16 units is 3 (the lone surrogate halves are encoded as 3 bytes each, so 6 bytes are seen where the character has 4). `hitOf` builds each hit's column from it, and item 5's spans need an exact byte-to-UTF-16 conversion. The brief names no shared, correct converter and "a parser or a rule exists once" would send `replace.ts` to reuse or copy this one.

P7. Preserve Case: the brief's rule is not the function it cites. VS Code's `Cst` (bundle) is: empty match gives the pattern; if both match and pattern contain `-` (and not `_`) with equal part counts, recurse per part (same for `_`); else all-upper match gives `pattern.toUpperCase()`; all-lower gives `pattern.toLowerCase()`; else a match whose first character is upper gives `pattern[0].toUpperCase() + pattern.substr(1)` (the rest AS TYPED); else a match whose first character is not upper gives `pattern[0].toLowerCase() + pattern.substr(1)`. Item 4's text: "first letter upper and the rest lower gives the replacement capitalised", and "otherwise the replacement as typed". Differences: a match `FoO` or `FOo` (item 4 has no rule; VS Code capitalises the first letter, rest as typed); a match `fOO` (VS Code lowercases the first letter, item 4 says as typed); "capitalised" is ambiguous on whether the rest of the pattern is lowercased (VS Code does not); `-` and `_` both present is not covered. The step must cite one behaviour.

P8. Preview. Item 4 says the GET answer carries `replacement` "so the preview is ripgrep's own", and item 2 says the row shows the replacement "as VS Code previews". (a) ripgrep knows nothing of Preserve Case, so the preview with Preserve Case on needs the same case function on the page; the brief does not say where it lives (server `replace.ts` per item 4; the page cannot import `lib/server`). (b) "Typing runs nothing" (HELP.md:168, `Query.svelte` head comment): the answer is fetched at Enter, so after the replace text or Preserve Case changes, every row shows the previous replacement until the next run, while Replace writes the current text. The brief gives no rule for that.

P9. Item 4 adds a second ripgrep call site and a second parser of ripgrep's JSON. `search.ts:7` ("This module has one subprocess call site") and `DESIGN.md:130` ("One subprocess call site") say one; `ripgrepLineShape` (`search.ts:202`) and `runRipgrep` already read the stream; `replace.ts` per the brief reads `absolute_offset`, `start`, `end`, `replacement.text` itself and runs ripgrep with a text on stdin (`-`). The brief does not say to reuse `runRipgrep`/the record shapes or to update those two statements. (Verified: `printf 'éé foo\n' | rg --json -r X foo -` reports path `<stdin>`, `absolute_offset` 0, `start` 5, `end` 8.)

P10. Undo of a `text` record writes to a path read from the log. `undoChange(into, change)` receives `WriteTarget`, which carries no roots (`edit/writes.ts:206-232`); `fileOf` (`undo.ts:76`) resolves `change.file` absolute or hub-relative. A `text` undo that writes `fileOf(...)` writes wherever the log line says, with no check that it is inside a served root, not read-only, not the machine's `local.yml`, and not binary. The log is a file a hand may edit (undo.ts head comment says so). The rules file: "A value from the hub or a feed that reaches HTML or a shell is untrusted", and "A write that edits a file's text re-parses its own result and refuses when the reparse is not what was asked". The brief states neither the root check for the undo nor a read-back check of the written text.

P11. The machine's `local.yml`. `source.ts:89 localRefusal` refuses a save of the machine's `config/local.yml` whose content does not read, "a malformed value in it throws: saved, it would take the source route down with it". `api/ops` refuses it as `protected`. The engine root is a served root (`roots.ts`), so a search over it lists hits in whatever files ripgrep reads there, and a Replace All can rewrite that file through `POST /api/search` without either guard, and record its matched text in `~/.oculus/changes.jsonl`. Brief item 3 refuses only `outside`, `missing`, `readonly`, `binary`. (I did not read the file; this is from the code.)

P12. Roots overlap. `browserRoots` (`roots.ts:29-42`) serves the hub and the engine's config folder as two roots, and the engine folder `tools/oculus/config` lies inside the hub (DESIGN.md:362: `hub` defaults to two directories above `tools/oculus`; whether this machine's `hub` is that repository was not verified because it is in `local.yml`). A search over `all` then lists a tracked config file twice, once per root; item 3's Replace All sends "the answer's listed files", so one real file is processed twice (replacing `foo` by `foofoo` doubles twice) and recorded twice; the confirm's count includes both. The page's tab matching by `root` and `path` (item 6) also misses a tab that holds the same file under the other root key. Nothing in the brief resolves files to real paths or removes duplicates.

P13. Item 2's confirm. `views/shared/AskConfirm.svelte` draws its buttons from `ui.confirm_ok` (text "Confirm") and `ui.confirm_cancel` (`config/text/ui.yml:11-12`); `Ask` is `{ message, detail, act }` (`ask.ts`). The brief's "with Replace and Cancel" cannot be had without changing the shared component (not in the paths, used by other views).

P14. Item 2 shortcut. "Cmd+Shift+H focuses it": shortcuts are bound in `src/lib/shell/keys/keys.ts` / `key-dom.ts` (the `/` key is the shell's own, `Search.svelte` head comment), not in `Query.svelte`; neither file is in the paths. Whether the browser lets a page take Cmd+Shift+H was not tested (no browser).

P15. Confirm count with a cut answer (decision 4). The replace writes every match of each listed file, while the answer's `total` counts only the hits it kept (`createFold` stops at `room`, and `--max-count` is lines per file). When `truncated`, "Replace <n> occurrences across <m> files" understates what is written, and the last file may be listed with only some of its matches. "The confirm says the count is of the files shown" does not state a number a reader can rely on.

P16. Stale hit. Item 3's `only: { line, index }` names a match by position only; the hit's `match` is in the answer but not in the body. If the file changed since the search (or if a tab's draft is sent, whose lines are not the disk's), line and index point at a different text and the replace writes it. The brief does not say to compare the text at that position with the hit's `match`.

P17. Item 7 against item 6. After a replace "the search runs again, so the results show what is left"; for a file held by a tab nothing is written, so the rerun lists the same hits, and "The results row of such a file says it was replaced in the open editor" has no state to survive the rerun's new answer.

P18. The brief's Report section does not ask for the "before and after" section for the look that `spec.md` requires ("Your report's 'before and after' section ... names the view, the state to put it in and what should differ"); the spec still binds. A look at Replace on the orchestrator's running server writes files: the brief names no scratch root to look at.

=====================================================================
## 4. Cases and checks
=====================================================================
Method: ripgrep on `a.txt` = `foo bar foo\nbaz fooo\n` (flags `--json --ignore-case --fixed-strings`), file reads of the rules file and the sources.

Case 1: correct. Submatch starts 0, 8 on line 1 and 4 on line 2 give columns 1, 9 and 5; three hits; the unchanged tree keeps the first submatch only (two). Case 2: correct (`X bar X\nbaz Xo\n`; before offsets 0, 8, 16; after offsets 0, 6, 12). Case 3: correct (`foo bar X\nbaz fooo\n`). Case 4: correct (`Yo bar Yo\nbaz Yoo\n`; `$$` gives `$`).

C1. Case 5 gives the right file but for the wrong reason, and does not test the rule. With query `foo` ignore-case, the file `foo Foo FOO foo-Bar` has four matches: `foo`, `Foo`, `FOO`, `foo` (the last match is the three letters `foo`; `-Bar` is not part of it). Expected file: `bar Bar BAR bar-Bar`. The brief says "the last per item 4's part rule with a one-part replacement (`bar`, as typed)"; the part rule is never reached because the match is `foo`, which is all lower case. The case therefore passes with any implementation of the upper/lower/capitalise rules and never exercises the hyphen/underscore rule, and says nothing about P7's differences. A case for that rule needs a regex such as `foo-bar` matching `Foo-Bar` with replacement `baz-qux`.

C2. Case 13, "a file over MAX_FILESIZE is not matched by ripgrep and is reported with replaced: 0": wrong expected result. Reproduced in P4: ripgrep matches a 3,000,000-byte explicit file with `--max-filesize 2M` set, so the replace would write it and report `replaced > 0`.

C3. Case 13, "a file with CRLF endings keeps CRLF around the replaced text; a match spanning the whole line": the second clause contradicts the first on CRLF files. `rg --json -r X --regexp '^.*$' crlf.txt` reports the submatch `foo bar\r` (start 0, end 8); the match includes the `\r`, so the replacement drops it and the line ends in a bare LF. `rg --regexp 'bar$' crlf.txt` finds nothing on a CRLF file. The brief states only that CRLF is kept.

C4. Case 6 writes `éé` (brief line 41 holds two precomposed characters, bytes c3 a9 c3 a9; `LC_ALL=C grep -n '[^ -~]' D32.md` prints that line). The expected result is right (UTF-16 offset 3; ripgrep `start` 5), but the rules file requires ASCII in every authored file, so the test needs `é` escapes; the brief should say so. The brief file itself carries the glyphs.

C5. Case 7. "a second undo of the same record is refused": no word given; the word the existing table gives is `moved` (`undo.ts:215`), since the after spans no longer stand. "after the file is edited at a span, undo is refused `moved`": correct; not stated is the converse: an edit elsewhere in the file that shifts a span's offset (an insert before the first span) also gives `moved` under item 5's "every after span still stands at its offset", while an edit after the last span lets the undo go through. The case does not say which is intended. The undo is exercised by which entry: `undoChange` directly or `handleWrite` with `{ kind: 'undo', at }` (as `tests/routes/edit/undo.test.ts` does); the brief says neither, and the History answer `{ ok, changed, refused }` needs a non-empty `changed` for `undoSaid` to report success (`rows.ts:66`), unspecified for a text undo.

C6. Case 8: "refused with their word": `source.ts` has words only for `readonly` and `binary` (`SourceRefusal`); `outside` and `missing` are `resolveRootFileResult`'s (`files.ts:81-93`) and `source.ts` turns them into sentences. The set of four words is fine but "source.ts's words" is inexact. A mode 0444 test passes only for a non-root user (`isReadonly` is `accessSync(W_OK)`, `source.ts:36`). A NUL file is binary by `isBinaryFile` (`text-kind.ts:34 window.includes(0)`), which looks only at the first 8193 bytes; ripgrep, given an explicit file, reports `binary_offset` and converts NULs to newlines, so a NUL after byte 8192 passes the refusal and is matched (checked with `printf 'foo\0bar foo\n'`: two matches at lines 1 and 2 with `absolute_offset` 0 and 4).

C7. Case 10: "a query refused by `queryFrom` (empty pattern) is refused 400": `queryFrom` (`helpers/search.ts:205`) refuses nothing; the refusal is `refusalOf`/`searchQuery` through `runSearch` (`search.ts:376-380`), which the POST must call on the body's query. Expected result right (400, nothing written).

C8. Case 13, other clauses with no stated result: "a query whose `under` scopes a folder replaces only there" (the files come from the page; what `under` does on the server is not stated: refuse files outside it, or ignore it); "a replace while another write holds the chain waits behind it (two concurrent requests on one file give both replacements, in order)" (no files, no replacements, no final text); "the word toggle (`\bfoo\b` semantics as the search's)" (no input and output; ripgrep's `-w` is described by ripgrep as roughly `\b` before and after, not exactly).

C9. Case 11 second half ("Replace All opens the confirm with the counts and writes nothing on Cancel") is a press; the rules file says a press is seen at the look and the unit suite renders to a string; `*.client.test.ts` covers effect timing only. The case can only be checked at the look. Case 12 is "store-level tests" and cannot show that the Search view finds the tabs and calls them (P2, N2).

C10. Case 14 limits the existing suites to five directories (N5).

C11. Verify item 2 (`grep -n "submatches?.\[0\]" src/lib/server/files/search.ts` prints nothing): today it prints `246: const first = submatchShape.safeParse(data.submatches?.[0]);` so it fails without the fix, but it passes for `submatches?.at(0)` as well. Verify item 3 (`grep -rn "'text'" src/lib/server/core/changes.ts`): today it prints nothing (exit 1), so it fails without the fix, and shows only that the union lists the word, not that an undo works.

=====================================================================
## 5. The question
=====================================================================
Goal: replace in the Search view as VS Code's, through the write chain and the change log (plan.md:432; Z84 (a)).

- Case 1: passes with item 1 alone and no replace at all. It is a precondition, not the goal.
- Case 2: passes with a write outside the chain (the case asserts file text, `replaced`, one record, `undo`, `kind`, not the chain). The chain is reached only by case 13's last clause, which has no stated content (C8).
- Case 3: passes if `only` is honoured on disk text; says nothing about staleness (P16) or the page.
- Case 4: passes with ripgrep's syntax; does not touch literal-mode `$` (P3).
- Case 5: passes with a casing function that ignores VS Code's rules (C1).
- Case 6: passes without a correct converter if the line has no astral character (P6).
- Case 7: passes by calling `undoChange` alone; the History control (`POST /api/write` `undo`) and the missing `history.kind_replace` word (N1) are not reached by it.
- Case 8: passes with per-file refusals that skip `local.yml` (P11), `.git`/ignored files (P4) and the undo's root check (P10).
- Case 9: passes while page and tabs do nothing.
- Case 10: passes for any token and query check.
- Case 11: first half (strike and replacement drawn) passes with a replace field wired to nothing; second half is a press, only the look reaches it (C9).
- Case 12: passes with a store function nothing calls; the Search view's use of it, `context.ts` wiring and the one-slot ask (P2) are not reached.
- Case 13: passes without the goal for each clause as written; two clauses have wrong or missing expected results (C2, C3, C8).
- Case 14: passes without the goal (existing behaviour kept).
- Step-line check ("each write through the write chain and its change log"): no case holds the chain and watches the replace wait except the unspecified case 13 clause; passes with the write outside `fsWrites`, and with a record whose History row throws (N1).
- Item 1: reached by case 1. Item 2: only the draw half is tested. Item 3: cases 2, 3, 8, 9, 10. Item 4: cases 2 to 6 (preserve-case rule only partly). Item 5: cases 2 and 7; chain not asserted. Item 6: case 12 at store level only. Item 7 (search runs again after a replace): no case at all. Item 8 (words and docs): no case; the keys check covers `search.yml` words but not `history.kind_replace` (N1); nothing checks DESIGN.md/HELP.md text, whose other false lines (N6) the spec's grep rule asks the builder to carry.

=====================================================================
## 6. Implied inputs (each with the result I propose)
=====================================================================
I1. Literal-mode replacement `a$b` and `$0`: file gets `a$b` and `$0` unchanged (VS Code literal). Today's engine gives `a` and `foo`. Needs a rule in `replace.ts` (escape `$` as `$$` when the query is not a regex).
I2. Regex-mode `Y$1x`: ripgrep gives `Y`; stated decision 1 says ripgrep's syntax; `${1}x` gives `Yox`. Add as a case so the divergence is on record. `\n` in a regex-mode replacement stays backslash-n (`rg -r 'a\nb'`).
I3. Zero-width regex (`x*`, `^`): ripgrep returns a submatch at every position (`rg --json -r X --regexp 'x*'` on `ab`: starts 0, 1, 2; `--passthru` prints `XaXbX`). Expected: one hit and one replacement per position, spans with `text: ''` in `before`, undo removes them; `replaced` counts them.
I4. Replacement equal to the match (`foo` to `foo`): no byte changes, no record, `replaced` equal to the count or 0 (pick one); undo not offered.
I5. A listed file with no match now (changed since): `replaced: 0`, file not rewritten (mtime unchanged), no record.
I6. The same real file twice in `files` (duplicate entry, or hub plus engine root, P12): replaced once; expected one record.
I7. Stale `only`: line or index past the file's matches, or text at that place differs from the hit's `match`: `replaced: 0` with a refusal, nothing written.
I8. Machine `local.yml` as a target: refused as a source save is (`localRefusal`), or a replace that leaves it unreadable refused; nothing written.
I9. A file ripgrep's search would not list (under `.git`, `node_modules`, hidden, ignored, over 2M): refused, or replaced; the brief must choose (P4); my proposal is refused with `outside`-class word.
I10. Invalid UTF-8 beyond the first 8192 bytes: ripgrep emits `bytes` instead of `text` (the zod shapes read it as absent, `search.ts:189`); expected: refuse the file (`binary`) rather than write spans that cannot hold bytes.
I11. Astral character before the match (`\u{1F600} foo` to `X`): spans offset 3 (UTF-16), file `\u{1F600} X`.
I12. A match record with no readable submatch (existing case `search.test.ts:545-552`): one hit at column 1, length 0, or none; if none, the `end` record's `matched_lines` exceeds the hits and `truncated` goes true falsely (`search.ts:309`).
I13. File mode kept after a replace (`writeTextAtomic` keeps an existing file's mode, `json.ts:73-83`): an executable script stays executable.
I14. Symlinked file inside the root: the real target is written (resolver realpaths, `files.ts:102-125`); record names the real path.
I15. Very many or very long matches: size of one record (`changes.jsonl`) with 10,000 spans or a `.*` match of a megabyte; a cap or a refusal is needed; also the `files` array length and `replacement` length in the POST body.
I16. Malformed body (query missing, `files` not a list, `only.index` negative or fractional, `replacement` not a string): 400, nothing written. The brief gives only the token and query cases.
I17. Tab states for item 6: draft not loaded (`loaded: false`, text empty), draft truncated (`truncated`, saves refused), readonly tab, mounted tab not `editing`, tab whose draft lines differ from disk (P16). Expected: not sent with `text` (use disk) or refused with a word, never an empty text sent as the file.
I18. Two mounted tabs on one file: both take the text (needs P2's fix).
I19. Page states: Replace while a run is in flight, Replace All pressed twice, the Search tab closed while the POST is out, a run superseded by a later one; the rules file asks for each asynchronous path in flight, after close and superseded.
I20. Truncated answer then Replace All: the confirm's number against what is written (P15).
I21. Replace text or Preserve Case changed after the run (P8): preview stale until Enter; Replace uses the current text.
I22. Undo variants: edit before a span (shifts offsets), edit after the last span, file now read-only or deleted, root removed (words `moved`, `moved`, `unwritable`, `gone` respectively under the existing table).
I23. Empty replacement with Preserve Case on: VS Code returns the pattern unchanged (`Cst` with `o=""` still hits `o.toUpperCase()`, giving ""); expected file with the matches deleted.
I24. The orchestrator's look (spec: look on TEST in Axel's Chrome on his running server): needs a throwaway root for Replace, not the hub.

=====================================================================
## 7. ADRs
=====================================================================
`ls tools/oculus/docs/adr` prints "ls: docs/adr: No such file or directory" (run from tools/oculus); `ls ../../docs/adr` from tools/oculus (the hub's docs) prints "No such file or directory"; `ls /Users/axelfaes/workspace/research-hub/docs` lists AGENT-APPROACH.md, HPC-UTwente-howto.md, RESEARCH-APPROACH.md (no adr folder); `grep -n -i adr /Users/axelfaes/workspace/research-hub/.agents/plan.yaml` prints nothing. The brief's statement holds: no ADR folder, no `adr:` key.

=====================================================================
## Declined to judge
=====================================================================
- Whether the browser leaves Cmd+Shift+H to the page (no browser).
- The look: the replace row, the struck-through preview and the hover controls against VS Code's stylesheet and layout (spec: judged on TEST at landing).
- VS Code's behaviour for backslash escapes (`\n`, `\t`) in a regex-mode replacement: the bundle contains `parseReplaceString`, I did not read its escape handling; I state only what ripgrep does.
- Whether this machine's `hub` is the repository holding `tools/oculus` (it is in `local.yml`, not read), so the hub/engine overlap in P12 is from code and DESIGN.md:362, not observed.
- Which option to take on literal-mode `$` (P3), the file-skip rule for replace (P4/I9), the chain for the file writes (P1, `fsWrites` or `opsWrites`) and the shortcut's home (P14): decisions the brief should state; I propose none as final.
- Whether a replace in a tab-held file being absent from the change log meets Z84's "each write through ... its change log": decision 3 surfaces it; I take it as consistent with source saves (HELP.md:256 says a source-tab save is not recorded) and leave the ruling to the orchestrator.

=====================================================================
## Usage
=====================================================================
(left for the orchestrator)

Usage: claude-sonnet-5-5, 302,238 tokens, 86 tool uses, 16.0 min.
