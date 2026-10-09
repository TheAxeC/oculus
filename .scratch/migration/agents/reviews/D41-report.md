Everything in the brief and in repair round 1 (its ten items) is done. One check is not clean: `npm run test:quick` passes every command, but its wall time is over its 45 s limit (90.7 s and 91.0 s in two runs) while the machine load average was about 14 with other builders running; the lines are quoted under "DONE / NOT DONE". Cases 5, 6, 17 to 24, 29, 33 and 34 need the page and are checked by the unit that reaches them; each is marked "looked at by the orchestrator on landing" below with what should be seen.

## Open items

Verbatim from main's `orchestrator-state.md` (`grep -n '^## Open items' -A6`):

> ## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)
>
> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
>
> None.

## Repair round 1

Scratch work (probes, harness copies, a copy of the round 0 source for the "before" runs) is under `$TMPDIR/d41r1`; the temporary probe tests placed in `tests/` were deleted after their runs (`ls tests` prints `checks data fixtures routes server shell state tiers ui views`). "Before" runs use the round 0 source copied to `$TMPDIR/d41r1/before` with the relay harness pointed at the worktree's packages (`NMHOME`).

### 1. Every root's edits to one file

`data/prose/text-edits.ts` gains `MergedEdits` (line 299): `add(entries)` takes the entries of one root's answer, `result()` gives the merged entries and the files left out. Edits of all roots are kept; an edit with the same range and the same new text as one already kept is kept once; when two roots' edits to one file overlap with different text, the file is left out of the preview. `held/requests/links.ts` uses it (lines 237, 265, 273) in place of the first-root-wins merge, and the page uses the same class (`link-rewrite.ts:57`) over the answers of several roots, so the page no longer keeps one answer's entry per file either. The answer carries `overlaps: string[]` (page addresses of the left-out files); the page says each with the new key `source.md_links_overlap` in `config/text/views/sources/source.yml`: "Two served folders rewrite the same text of {0} differently; it is left as it is." ({0} the file's path under its root).

Probe of the reviewer's scenario (`$TMPDIR/d41r1/probe1.ts`: outer root `ws`, inner root `inner` = `ws/tools/oculus`, `docs/a.md` holding `[x](../guide/b.md)` and `` `tools/oculus/guide/b.md` ``, `guide/` moved to `library/`), run on the round 0 source and on the finished tree, output as printed:

```
before: {"changes":[["inner/docs/a.md",["3:4-17 -> ../library/b.md"]]]}
after:  {"changes":[["inner/docs/a.md",["3:4-17 -> ../library/b.md","3:24-47 -> tools/oculus/library/b.md"]]],"overlaps":[]}
```

Probe of the merge rule (`probe1b.ts`, finished tree: for `a.md` two roots' answers with one edit in common and one more; for `c.md` different text over an overlapping range), output as printed:

```
{"changes":[{"textDocument":{"uri":"oculus-file:///inner/a.md","version":null},"edits":[{"range":{"start":{"line":2,"character":4},"end":{"line":2,"character":17}},"newText":"../library/b.md"},{"range":{"start":{"line":2,"character":24},"end":{"line":2,"character":47}},"newText":"tools/oculus/library/b.md"}]}],"overlaps":["oculus-file:///inner/c.md"]}
```

### 2. The warning's words

`links.ts` answers a code (`LinksFailure` = `'unsent' | 'no_answer' | 'no_place'`, `data/model/model-machine.ts`, exported through `data/model/index.ts`); `lsp.svelte.ts` resolves `unsent` for a request it could not write or that timed out; `link-rewrite.ts` `failure()` has one literal `t()` key for each code, and `source.md_links_unanswered` is gone. The three sentences, word for word as the brief gives them, are in `source.yml` as `md_links_unsent`, `md_links_no_answer` and `md_links_no_place`. Probe (`probe2.test.ts`, a fake ask answering each code for roots `a`, `b`, `c` and an overlap for `d`), output as printed:

```
SAID ["Links in Markdown files under a were not checked: the Markdown server could not be asked.","Links in Markdown files under b were not checked: the Markdown server did not answer.","Links in Markdown files under c were not checked: the move names no place under a served folder.","Two served folders rewrite the same text of docs/a b.md differently; it is left as it is."]
```

### 3. One table of notice sentences

`views/sources/source/language/notice-words.ts` moved to `state/system/machine/refactor/notice-words.ts`. `views/sources/source/language/lsp.ts` and `link-rewrite.ts` import it; `REFUSALS` and `refusal()` are gone from `link-rewrite.ts`. Existing test lines changed because of the move (paths only, same key list, same start text): `tests/checks/source/keys.test.ts:260` `file: 'lib/views/sources/source/language/notice-words.ts'` is now `file: 'lib/state/system/machine/refactor/notice-words.ts'`; `tests/ui/controls/editor/lsp-transport.test.ts` import `.../src/lib/views/sources/source/language/notice-words.ts` is now `.../src/lib/state/system/machine/refactor/notice-words.ts`, and its comment on line 7 names the new path. `grep -rn notice-words src tests docs DESIGN.md` prints only those places and `lsp.ts:58`.

### 4. The server told of Markdown files changed on disk

`ServerEntry.fileEvents?: () => string[]` (`servers.ts:211`) names the globs of files whose disk changes the server is told of; the Markdown entry gives `**/*.<extension>` for its extensions (`servers.ts:787`). When the process is ready, `Held.#watchEntryFiles` (`held.ts:510`, called at `:599`) registers them as a watch of the root's `RootWatch`, which sends `workspace/didChangeWatchedFiles` with the created, changed or deleted type; a file open on that server is not sent (the `open` filter of `RootWatch`). Probes through the relay with the real Markdown server, `probe4.ts` (README.md edited and a deleted `other.md` between two asks) and `probe4b.ts` (the first ask is an unrelated move), run on the round 0 source and on the finished tree, output as printed:

```
probe4 before:
FIRST  rewrite (docs -> guide): {"changes":[["ws/README.md",["3:4-16 -> guide/DATA.md"]],["ws/other.md",["3:4-16 -> guide/DATA.md"]]]}
SECOND rewrite (guide -> documentation), README.md edited and other.md deleted on disk: {"changes":[]}
README.md link is on line 7
probe4 after:
FIRST  rewrite (docs -> guide): {"changes":[["ws/other.md",["3:4-16 -> guide/DATA.md"]],["ws/README.md",["3:4-16 -> guide/DATA.md"]]]}
SECOND rewrite (guide -> documentation), README.md edited and other.md deleted on disk: {"changes":[["ws/README.md",["7:4-17 -> documentation/DATA.md"]]]}
README.md link is on line 7

probe4b before:
SECOND rewrite (guide -> documentation), other.md deleted on disk: {"changes":[["ws/other.md",["3:4-17 -> documentation/DATA.md"]],["ws/README.md",["3:4-17 -> documentation/DATA.md"]]]}
probe4b after:
SECOND rewrite (guide -> documentation), other.md deleted on disk: {"changes":[["ws/README.md",["3:4-17 -> documentation/DATA.md"]]]}
```

Before, the second rewrite of probe4 is empty because the server still held README.md's old text; after, the edit sits on line 7, where the link is in the new text. Before, probe4b gives an entry for the deleted `other.md`, which the page's plan refuses whole; after, there is none.

### 5. Save of an unserved tab

`performSave` (`source.svelte.ts:658`) refuses a tab whose `disk` is `unserved` before any request and puts `source.disk_unserved` (the unserved note's sentence) on the tab's line. Cmd+S (`views/sources/source/save/tab-save.svelte.ts:36`) and the palette's Save (`state/client/context.ts:423`) both call `saveSourceDraft`, which runs `performSave`. Probe (`probe56.client.test.ts`, temporary, deleted: a clean tab typed into, its root removed from the served roots, then `saveSourceDraft`), run on the round 0 source and on the finished tree, output as printed:

```
before:
ITEM 5 tab: {"disk":"unserved","error":"","message":"saved","failed":false}
ITEM 5 save returned true
ITEM 5 save requests sent 1
after:
ITEM 5 tab: {"disk":"unserved","error":"","message":"This file is no longer in a served folder; Save is not offered until its folder is served again.","failed":false}
ITEM 5 save returned false
ITEM 5 save requests sent 0
```

### 6. A restored tab answered while the workspaces load

A 404 for a loaded (restored) tab while `deps.served()` is `null` is held in `unsettled` (`source.svelte.ts:215, 347`). The served effect (`:246`) reads it when the served roots are known: a tab whose root is served gets the `cannot_open` error then; a tab whose root is not served is set to `unserved` (`:261`), which now also clears `error`. A successful read drops the held answer (`:358`). Probe (`probe56.client.test.ts`: a tab restored from another page's draft, its read answered 404 while the served list is `null`, then the list arrives as `[]` and as `["fixture"]`), output as printed:

```
before:
ITEM 6 served list later []: after the 404, before the list {"disk":"same","error":"Cannot open: The server refused the request (HTTP 404).","message":"","failed":false}
ITEM 6 served list later []: after the list {"disk":"unserved","error":"Cannot open: The server refused the request (HTTP 404).","message":"","failed":false}
ITEM 6 served list later ["fixture"]: after the 404, before the list {"disk":"same","error":"Cannot open: The server refused the request (HTTP 404).","message":"","failed":false}
ITEM 6 served list later ["fixture"]: after the list {"disk":"same","error":"Cannot open: The server refused the request (HTTP 404).","message":"","failed":false}
after:
ITEM 6 served list later []: after the 404, before the list {"disk":"same","error":"","message":"","failed":false}
ITEM 6 served list later []: after the list {"disk":"unserved","error":"","message":"","failed":false}
ITEM 6 served list later ["fixture"]: after the 404, before the list {"disk":"same","error":"","message":"","failed":false}
ITEM 6 served list later ["fixture"]: after the list {"disk":"same","error":"Cannot open: The server refused the request (HTTP 404).","message":"","failed":false}
```

### 7. A large Markdown file

`adapters/markdown/requests.ts:33` stats the file and refuses it over `TEXT_LIMIT` before `readFile`; the check on the bytes read stays for a file that grew in between. `relay run10` after: `CASE 14 readFile big.md refused: Error: the file is too large to read` and `CASE 14 readFile small.md bytes: 4`; `run9` after: `CASE 14 symbols answered: ["# L"]`.

### 8. Pulled diagnostics only for a server that pulls

`held.ts:417`: `workspace/diagnostic/refresh` asks again only when `this.entry.pulls === true`. Probe (`probe8.ts`: a `Held` over the Markdown entry copied with `pulls` unset and set, one open document, `call` recorded, then the refresh answered), output as printed:

```
before: entry.pulls=undefined: requests made after refresh -> ["textDocument/diagnostic"]
        entry.pulls=true: requests made after refresh -> ["textDocument/diagnostic"]
after:  entry.pulls=undefined: requests made after refresh -> []
        entry.pulls=true: requests made after refresh -> ["textDocument/diagnostic"]
```

### 9. A test waits on a signal

`tests/server/machine/lsp/lifetime.test.ts:394-402` waits on `spawned.childOf(1)` (a promise `stubSpawn` resolves when the second child is made), `second.sentOf('markdown/getEditForFileRenames')` (resolved by the stub when the request reaches it) and `page.arrival(...)` (resolved by `recordingSink` when a `links_answer` frame arrives); the two `settle()` loops are gone. The helpers are in `tests/server/machine/lsp/lsp-fixture.ts` (`Stub.sentOf`, `stubSpawn().childOf`, `recordingSink().arrival`). The file runs in the three-file command of the verify list, which prints `Test Files  3 passed (3)` and `Tests  84 passed (84)`.

### 10. The report

This report is rewritten whole. Case 10 is stated as it holds (line 17 resolves to an existing folder and is unmarked; line 16 is the marked one), and the counts are the ones the rerun prints.

## First run of the 34 cases

Method (round 0, with the relay cases re-run on the finished tree at the end of round 1): the unchanged tree is the base copy `.agents/worktrees/D41-base/tools/oculus` copied to a scratch folder with its `node_modules` (`$S/b41/unchanged`). Relay cases ran a real Markdown server through the relay with a scratch harness, run from the worktree app dir as `OC=$PWD node --experimental-strip-types $S/b41/relay/runN.ts`. The numbers in "Unchanged" are from the base copy; "Now" are from the finished tree, re-run at the end.

Cases 1 to 4, 7 to 11, 14 and 34 need the Markdown language server, which the unchanged tree does not have. Command (`$S/b41/unbuilt.ts`), unchanged tree, output as printed:

```
SERVED_LANGUAGES includes markdown: false
factsForLanguage(markdown): undefined
servers.forLanguage(markdown): undefined
server entries: pyright clangd typescript svelte yaml texlab
```

Same command on the finished tree:

```
SERVED_LANGUAGES includes markdown: true
factsForLanguage(markdown): [object Object]
servers.forLanguage(markdown): [object Object]
server entries: pyright clangd typescript svelte yaml texlab markdown
```

The unchanged-tree grep for the new names (`grep -rIl -e links_answer -e 'Update links in Markdown' -e typeWritten -e rename-label -e md_no_such_path -e oculus.no-such-path src config docs DESIGN.md README.md` in the base copy) finds 0 files for each, and `grep -n "type DiskState" draft.ts` prints `type DiskState = 'same' | 'changed' | 'gone';` (draft.ts:90).

| Case | Check | Unchanged | Now (output as printed) |
|---|---|---|---|
| 1 | relay run1: diagnostics of the scratch README | no server, no mark | `"code": "link.no-such-file"`, `"message": "File does not exist at path: docs/missing.md"`, severity 2, line 4 chars 28 to 43. The link `../outside.md` carries no mark. |
| 2 | relay run13, `c2.md` | no server | `c2.md: []` |
| 3 | relay run13, `c3.md` | no server | `c3.md: []` |
| 4 | relay run13, `c4.md` | no server | `c4.md: [[5,"oculus.no-such-path","File does not exist at path: docs/also-gone.md"]]` (the file holds `[g](docs/missing.md)` and a backticked path inside a fenced block, and `[g](docs/missing2.md)` in a code span; none of these is marked, and the one backticked path outside code is) |
| 5 | relay run1 and run2, `documentLink/resolve` | page only; no server | `RESOLVED ["oculus-file:///ws/docs/DATA.md#L5,1","intro",false]` for the heading link; `RES "oculus-file:///ws/docs/DATA.md" null` for a file link (no fragment). The `lineOfFragment` mapping is unit-checked by the same run. Page side (Cmd+click opening at that line): looked at by the orchestrator on landing: Cmd+click `[sec](docs/DATA.md#intro)` in a Markdown tab; the file opens with its cursor on the `## intro` line. |
| 6 | relay run2 | page only | `RES null null` for `[gone](docs/missing.md)`: the resolve gives nothing, so nothing opens. Looked at by the orchestrator on landing: Cmd+click a link to a missing file; no tab opens and no message appears. |
| 7 | relay run11 over the real hub, read only | no server | `CASE 7 projects/manuscripts/btfno/CLAUDE.md: [[3,"link.no-such-file","File does not exist at path: projects/manuscripts/CLAUDE.md"]]` |
| 8 | relay run11 | no server | `CASE 8 docs/RESEARCH-APPROACH.md: []` and `CASE 8 definition on the backticked schema.py:61: [{"uri":"oculus-file:///ws/tools/cockpit/src/cockpit/schema.py","range":{"start":{"line":60,"character":0},...` (line 61, 0-based 60) |
| 9 | relay run11 | no server | `CASE 9 docs/AGENT-APPROACH.md: [[78,"oculus.no-such-path","File does not exist at path: docs/adr/"],[80,"oculus.no-such-path","File does not exist at path: docs/roadmap/"],[80,"oculus.no-such-path","File does not exist at path: docs/agents/work-tracking.md"]]` |
| 10 | relay run11 | no server | `CASE 10 .agents/skills/project-cleanup/SKILL.md: [[16,"oculus.no-such-path","File does not exist at path: projects/active/ward-bttr-crosssubject/"]]` and `CASE 10 definition on the backticked folder: undefined`. The span on line 17 (`projects/manuscripts/hccnet-revision/code/`, an existing folder) has no mark and opens nothing; the file's one mark is on line 16. The case holds as the brief states it. |
| 11 | relay run13 with root key `hub` | no server | `c11.md: []`, `c11 definition on foo/bar.md: null`, `c11 definition on secrets/key.md: null`. `https://x.org/a` and `see the/path` are not counted by the rule (`backticks.ts`), `tools/oculus/config/local.yml` is removed as a private file. |
| 12 | `markdown-requests.test.ts` rows | test absent | 26 tests pass, see "Tests" |
| 13 | `markdown-requests.test.ts` rows | test absent | pass, see "Tests" |
| 14 | relay run9 and run10 | no server | `CASE 14 readFile big.md refused: Error: the file is too large to read`; `CASE 14 readFile small.md bytes: 4`; `CASE 14 links answered: 3 error: null`; `CASE 14 symbols answered: ["# L"]`; `CASE 14 diagnostics while docs/big.md is 3 MiB: ["File does not exist at path: docs/nothere.md"]` |
| 15 | `lifetime.test.ts` row | row absent | passes, fails unchanged, see "Tests" |
| 16 | `lifetime.test.ts` row | row absent | passes, fails unchanged, see "Tests" |
| 17 | relay run12 (README with two links and one backtick) and run6 | no `links` message exists (`links_answer` 0 files) | `CASE 17 exact: [["oculus-file:///ws/README.md",[[3,"guide/DATA.md"],[3,"guide/DATA.md"],[5,"guide/DATA.md"]]]]`: three edits, the backticked one on row 5. Unit (`$S/b41/zz-d41-page.test.ts`, deleted after the run): `CASE 17 submitted [[{"documentChanges":[...]},"Update links in Markdown files",true]]`: one preview with that title and `preview: true`, so nothing is written before Apply. Apply goes through the preview's existing apply path (`preview.svelte.ts`, whose only change is the title); that it forms one History record is for the orchestrator's look. Looked at by the orchestrator on landing: rename `docs/` to `guide/` in the Files view; the folder moves, then the Refactor Preview titled "Update links in Markdown files" lists `README.md` with its edits; Apply writes them; History shows the move and the rewrite as two records. |
| 18 | relay run6 | as 17 | `CASE 18 (README.md into sub/): [["sub/README.md",["../docs/DATA.md","../docs/DATA.md","../docs/DATA.md#intro","../docs/missing.md","../../outside.md"]]]`. Looked at by the orchestrator on landing: drop `README.md` into `sub/`; the preview lists the edits inside the moved file and in files that link to it. |
| 19 | relay run8; unit run (`page.out`); reading | as 17 | `CASE 19 (a file nothing links to): undefined` (no edit, so no preview). Unit: `CASE 19 copy tells []`, `CASE 19 move refused for an existing target (replace declined) tells []`, `CASE 19 move not answered tells []`, `CASE 19/20 link rewrite asked (cross-root pair not asked) [["hub",[{"from":"a.md","to":"b.md"}]],["quiet",[{"from":"p","to":"q"}]]]`. A History undo: the fake undo write failed (`undoFile threw "TypeError: writes.undoWrite is not a function"`), so the undo is read: `grep -n "moved(\|landed(" ops.svelte.ts` prints `moved(` only at 447 and 555 (rename/drop/paste moves) and `await landed(undoneMoves(record, roots), [], [])` at 614 in `undoFile`, so an undo never calls `moved`. |
| 20 | relay run8 | no `links` | `CASE 20 (inner root key inner, outer ws links inner/lib/b.md): [["inner/a.md",["library/b.md"]],["ws/top.md",["inner/library/b.md"]]]` |
| 21 | reading of `edits.ts:16-21` and `links.ts` | page only | A moved clean tab follows through `followTabs` (unchanged); `followDocuments` (`links.ts:86`) closes the moved document under its old address and opens it under the new one with the same text before asking, so `edits.ts` edits the tab when its draft equals that text and a typed tab keeps its typing and gains the edits. Looked at by the orchestrator on landing: move a `.md` file with a tab open, clean and then with unsaved text; Apply writes nothing to the typed file. |
| 22 | reading of `preview.svelte.ts:8` | page only | `submit` holds a second preview as `incoming` (unchanged code); `createLinkRewrite` calls the same `submit`. Looked at by the orchestrator on landing: a second move while a preview is open shows the incoming bar. |
| 23 | relay run6 and run7 | no `links` | `CASE 23 first move applied: [["docs/sub/guide.md",["../DATA.md","../../README.md","docs/sub/guide.md"]]]`; `CASE 23 second move: [["README.md",[...]],["documentation/sub/guide.md",["documentation/DATA.md","documentation/sub/guide.md"]]]`: the second edit names the files at their places after the first move. `CASE 23 marks after both applied: README ["File does not exist at path: documentation/missing.md"] guide []`. |
| 24 | unit run (`page.out`) | page only | `CASE 24 drag of b.md, a.md (exists), c.md with replace declined tells [[{"from":{"root":"hub","path":"b.md"},"to":{"root":"hub","path":"sub/b.md"}}]]`: one preview for the item that moved. |
| 25 | `$S/b41/audit-run.ts` | Findings row `type "active" is not the tier's idea`, `scratch audit rows (conform): []` | one Audit row `["projects/ideas/x","project.yml","type active is not the folder's idea"]`, and the scratch findings list holds no `type` row for it |
| 26 | same | none | `["projects/archive/nogo/y","project.yml","type dropped is not the folder's nogo"]` and `["projects/coauthor/abandoned/v","project.yml","type in-prep is not the folder's abandoned"]`; `published/2017/z` and `coauthor/published/2017/w` give none |
| 27 | same | `tw typeWritten field of the project: undefined type: idea` | the same line now; the YAML key `typeWritten` still gets the existing schema finding `key typeWritten is not declared by the schema of this file`, no Audit row; `manifests.ts:140` deletes the built field and `:142` sets it only from the written type |
| 28 | same, with `HUB` the real hub, read only | `real hub findings (type_not_tier): 0 audit rows with type disagreement: 0 audit rows total: 1` | `real hub findings (type_not_tier): 0 audit rows with type disagreement: 0 audit rows total: 1` |
| 29 | client test `$S/b41/zz-d41-page.test.ts`, deleted after the run (`case29.out`) | `DiskState` has no `unserved` | `UNSERVED [["clean","unserved","disk\n"],["typed","unserved","typed\n"]]`, `NOTE This file is no longer in a served folder; Save is not offered until its folder is served again.`, `SERVED AGAIN [["clean","same","disk changed meanwhile\n"],["typed","same","typed\n"]]`. Autosave needs `disk === 'same'` (`autosave.svelte.ts:84`) and `BarActions.svelte` `savable` excludes `unserved`. Looked at by the orchestrator on landing: remove a root from the served list with a tab open; the note shows, no Save in the bar; serve it again; the note goes. |
| 30 | `c30-out.txt` run | as today | a deleted file under a served root gives `gone` with "The file was deleted on disk; Save writes it again." |
| 31 | `uris.test.ts` row | row absent | passes, fails unchanged, see "Tests" |
| 32 | `$S/b41/watch-run.ts` over the real hub, read only | `lines: ["portfolio watch: cannot watch /Users/axelfaes/workspace/research-hub/projects/software: ENOENT: no such file or directory, watch '/Users/axelfaes/workspace/research-hub/projects/software'"]` | `lines: []`; creating the folder later rebuilds (start, folder and manifest, manifest change: three rebuilds in `watch-late.ts`); a chmod 000 existing folder prints one EACCES line |
| 33 | reading | no `rename-label` rule in the base (grep: 0 files) | Monaco's `renameWidget.css:50-57` hides `.monaco-editor .rename-box .rename-label` unless `.preview`; `rename.css` now shows it with `.monaco-editor .rename-box .rename-label.rename-label { display: block; color: var(--muted-txt, var(--muted)); }`. The label text is drawn by Monaco from the keys bound to accept and preview (`renameWidget.js:175`, "{0} to Rename, {1} to Preview"); I did not run a page, so that it reads "Cmd+Enter" on this machine is for the orchestrator's look. Looked at by the orchestrator on landing: F2 on a symbol in a Python and in a YAML tab, light and dark theme; the line "Enter to Rename, Cmd+Enter to Preview" shows under the input. |
| 34 | relay run1 and run5 | no server | completion on `](` lists `README.md`, `docs/`; definition on a heading link `{"uri":"oculus-file:///ws/docs/DATA.md","range":{"start":{"line":4,...}`; `REFS` lists `README.md`; `PREP` gives placeholder `intro`; `REN` gives edits in `docs/DATA.md` and `README.md`; `SYM` gives the heading tree. The Outline reads the server's symbols with its own reading as the fallback (`Outline.svelte`). Looked at by the orchestrator on landing: the Outline of a `.md` tab with the server running and with it failed. |

Backticked counts, as the rerun of `count.ts` over the hub prints them: `{"files":878,"counted":886,"resolves":801,"marked":85,"markedFiles":39,"inAgentSkills":68}`. The brief's counts for item 4 differ (below). No case needed a ruling.

### Tests

Tests are the rows of cases 12, 13, 31, 15 and 16 only. The new and changed rows, run on the unchanged tree with the three final test files copied into the base copy (`npx vitest run --no-isolate` of the three files), output as printed:

```
FAIL |unit| tests/server/machine/lsp/adapters/markdown-requests.test.ts [ tests/server/machine/lsp/adapters/markdown-requests.test.ts ]
Error: Cannot find module '../../../../../src/lib/server/machine/lsp/adapters/markdown/diagnostics.ts' imported from .../tests/server/machine/lsp/adapters/markdown-requests.test.ts
FAIL |unit| tests/server/machine/lsp/lifetime.test.ts > the life of a language server > 'is one Markdown server for two md tab...'
AssertionError: expected [] to have a length of 1 but got +0
FAIL |unit| tests/server/machine/lsp/lifetime.test.ts > the life of a language server > 'is started for a link rewrite with no...'
TypeError: Cannot read properties of undefined (reading 'ended')
FAIL |unit| tests/server/machine/lsp/uris.test.ts > a document address > 'gives a document link to the page wit...'
AssertionError: expected [ true, ...(3) ] to deeply equal [ false, ...(3) ]
Test Files  3 failed (3)
     Tests  3 failed | 55 passed (58)
```

On the finished tree: `npx vitest run --no-isolate tests/server/machine/lsp/adapters/markdown-requests.test.ts tests/server/machine/lsp/uris.test.ts tests/server/machine/lsp/lifetime.test.ts` prints `Test Files  3 passed (3)` and `Tests  84 passed (84)`.

The 55 rows that pass on the unchanged tree are the existing rows of uris and lifetime, which only gain rows (below). The same command on the finished tree: see the DONE / NOT DONE table. The rows of `markdown-requests.test.ts` (26 tests, every one in a file the unchanged tree cannot load): describe 'the Markdown server may not be given the machine or the outside', its readFile rows 'is refused for a file under secrets', '... under SECRETS', '... under ~/.oculus', '... the engine root local.yml', '... a file beside the root', '... a link out of the root'; 'is refused for an address that is not a file address'; 'answers the bytes of a file of the root'; stat rows 'answers nothing for a file under secrets', '... the secrets folder', '... a file beside the root', '... a link out of the root', '... the folder above the root'; 'answers the kind of a file of the root'; readDirectory rows 'is refused for the folder above the root and for secrets', 'lists neither secrets nor the link out of the root', 'lists no ~/.oculus in the home folder'; findMarkdownFilesInWorkspace rows 'lists the files of the root and none under secrets or beside it', 'lists no local.yml of the engine root when yml is an extension, and no ~/.oculus file'; watchers 'are not made for a file under secrets' and '... a file beside the root'; the entry rows 'refuses a Markdown file under secrets', '... under SECRETS', '... under ~/.oculus', 'does not refuse a Markdown file of the hub'; the diagnostics hook 'drops a mark whose path lies outside the root or under secrets, and words the others from the root'. The `~/.oculus` rows set `process.env.HOME` (saved in `realHome`, restored in `afterAll`) because `os.homedir()` honours `$HOME` and `vi.mock('node:os')` is ineffective under `--no-isolate`.

None of these rows is an audit; each of the three files fails on the unchanged tree as quoted. Read by me: the entry rows assert `refuses` is true for the three private paths and false for a hub file, so a refuse-everything or refuse-nothing entry fails one of them. The `diagnostics` hook row asserts both the dropped and the kept marks.

Existing test lines edited, with before and after (`diff` of the base against the tree, `grep -c '^<'` counts the removed lines):
- `tests/server/machine/lsp/uris.test.ts` and `lifetime.test.ts`: 0 removed lines, 61 and 65 added.
- `tests/state/sessions/source-server.ts` (2 removed): the `server()` options type `Partial<Pick<SourceDeps, 'rules' | 'kept' | 'roots'>>` gains `'served'`, and `roots: options.roots ?? (() => [])` gains `served: options.served ?? (() => null)`.
- `tests/checks/source/keys.test.ts:260` (1 removed): `file: 'lib/views/sources/source/language/notice-words.ts'` is now `file: 'lib/state/system/machine/refactor/notice-words.ts'`; `start` and the key list are unchanged.
- `tests/ui/controls/editor/lsp-transport.test.ts` (2 removed): the import path and the comment path of `notice-words` follow the module to `state/system/machine/refactor/`.
- `tests/server/machine/lsp/lsp-fixture.ts` (3 removed, 38 added): `Stub.sentOf(method)`, `stubSpawn().childOf(index)` and `recordingSink().arrival(accepts)` are new promises resolved by the stub when the message, the child or the frame comes; the removed lines are the `stubSpawn` return (now with `childOf`), the `frames` declaration (now typed through `Frame`) and the `frames.push` (now also wakes the waiters). No assertion exists in this file.
- No allow list, threshold or predicate was changed: `diff -rq` of `tests/checks` in the base against the tree prints only `keys.test.ts` (the path above); `boundaries.test.ts` and `size.test.ts` are identical.

## DONE / NOT DONE

Nothing in the brief or in round 1 is left undone. The one check that is not clean is the wall time of `npm run test:quick` (row 3).

| Row | Check | Result |
|---|---|---|
| Items 1 to 9 of the brief | cases above | DONE |
| Item 10, doc text | "Doc text" below | DONE (reported; `guarded.md` untouched) |
| Round 1, items 1 to 10 | sections above | DONE |
| Verify 1: `npm run test:quick` | run twice (see the count below) | every command passed: `svelte-check` completed 441 files with 0 errors, 0 warnings; the wall time was 90.7 s and 91.0 s against the 45 s limit, so the time check reports over the limit. `uptime` printed `load averages: 12.24 11.99 12.26` when this report was written, with other builders running. NOT clean on time only |
| Verify 2: the three files | `npx vitest run --no-isolate` of the three files | DONE: `Test Files  3 passed (3)`, `Tests  84 passed (84)` (re-run while writing this report) |
| Other guarded entries' tests and `tests/checks` | `npx vitest run --no-isolate --testTimeout 0 --hookTimeout 0 tests/server/machine/lsp tests/state tests/checks tests/ui/controls tests/views/sources` | DONE: `Test Files  49 passed (49)`, `Tests  608 passed (608)` |
| Data, server, routes, shell, fixtures tests | `npx vitest run --no-isolate --testTimeout 0 --hookTimeout 0 tests/data tests/server tests/routes tests/shell tests/fixtures` | DONE: `Test Files  137 passed (137)`, `Tests  1028 passed (1028)` |
| Verify 3: sizes | `wc -l relay.ts servers.ts ops.svelte.ts Editor.svelte` | DONE: 880, 864, 696, 518 |
| Verify 6: folders | `sh utils/folder-check.sh; echo folder=$?` | DONE: `folder=0` |
| Unused exports | `sh utils/unused-exports.sh` against the base file | DONE: identical, 364 lines |
| ASCII gate | the gate of `test:quick` over the changed list, `echo ascii=$?` | DONE: prints nothing, `ascii=0` |
| Diagrams | `npm run diagrams` | DONE: regenerated `layers`, `layer-server`, `layer-state`, `layer-views`, `channels` |
| Verify 4: each test run on the unchanged tree | quoted above | DONE |
| Verify 5: standards pages | `.agents/plan.yaml:8` reads `standards: []` | nothing to read against |
| `tests/` holds no temporary file | `ls tests` | `checks data fixtures routes server shell state tiers ui views` |
| Cases that need the page | named above | NOT looked at by me; marked for the orchestrator on landing (cases 5, 6, 17 to 24, 29, 33, 34) |

Full-list runs after the last change: the verify list ran in full once (`format`, `diagrams`, `test:quick`, the three files, the guarded set, the data/server/routes/shell/fixtures set, sizes, folders, unused exports, ASCII gate). `npm run test:quick` ran a second time alone to see whether the time breach was load; it printed 91.0 s again. Scoped runs during the work are not counted.

History-word grep (the words of `spec.md` plus `earlier`, `formerly`, `originally`, `reverted`, `legacy`, `D41`) over the comment lines and test titles added in round 1 (`$TMPDIR/d41r1/added.txt`): the hits are ordering words only ("comes before", "before they are read", "before the served roots were known", "sent before or later"), each naming the order of a position or of a runtime step, none naming a package, date, session or earlier code. For round 0, over 525 comment lines, 9 hits were judged the same way (`asks.ts:25`, `rewrite.ts:9`, `links.ts` "old folder", "old place", "old root key", `link-rewrite.ts` "old and new places", `context.ts` "what moved": the place before a move is the data).

Grep of the changed names across docs and code: `links_answer` in `DESIGN.md`, `lifetime.test.ts`, `held/requests/links.ts`, `lsp.svelte.ts`, `model-machine.ts`; `no-such-path` in `DESIGN.md`, `adapters/markdown/diagnostics.ts`; `getEditForFileRenames` in `DESIGN.md`, `lifetime.test.ts`, `adapters/markdown/rewrite.ts`, `held/requests/links.ts`; `Update links in Markdown` in `DESIGN.md`, `config/text/views/sources/search.yml`, `docs/views.md`, `docs/files-and-search.md`; `type_not_folder` in `config/text/views/system/audit.yml`, `audit/projects.ts`. The catalog key for the preview title is `refactor_preview.title_md_links` in `search.yml`, not the `refactor.title_md_links` the brief names, because the `refactor_preview` group is the one that file holds.

### Ids, keys and asynchronous paths (read from the source; no mutation test)

- Server id `markdown` and channel `lsp:markdown`: one entry (`server entries: ... texlab markdown`), the keys test passes.
- `unserved`: the saved shape is `disk: z.enum(['same','changed','gone','unserved']).catch('same')` (`draft.ts`), so a saved `unserved` reads back and an unknown value falls back to `same`.
- `typeWritten`: deleted from the built record (`manifests.ts:140`) and set only when the written type is non-empty and differs (`:142`); a manifest key of that name cannot win (case 27 output).
- Diagnostic code `oculus.no-such-path` and each catalog key (`statusbar.server_markdown`, `source.cmd_markdown_output`, `source.cmd_markdown_restart`, `source.disk_unserved`, `source.md_links_unsent`, `source.md_links_no_answer`, `source.md_links_no_place`, `source.md_links_overlap`, `source.md_no_such_path`, `audit.msg_type_not_folder`, `refactor_preview.title_md_links`): read once in code through literal `t()` keys (`tests/checks/source/keys.test.ts` passes).
- Watcher ids (`held/requests/followed.ts`): a create under an id already followed replaces the first (`follow` sets the map entry and re-registers the match); a delete of an unknown id does nothing (`unfollow` returns when the id is absent); a change to a path no id follows tells nothing.
- `links` messages: `id` is an integer from a per-page counter in `lsp.svelte.ts`; two in flight have their own ids and their own pending entries. Empty `moves` is refused by the wire schema (`wire.ts`, `.min(1)`); a part of `''`, `.`, `..` or an unknown root key answers `no_place` (`links.ts:230`). A repeated id from the page would replace the pending entry there; the counter does not repeat.
- A rewrite in flight when the page closes: the server finishes the ask and `Relay.#send` returns without sending when the page is no longer in `#pages` (`relay.ts:353`); `links.ts:269-270` lowers `held.asking` and arms the 60 s end when no document and no ask remain. A server that ends mid-request: `Calls.end()` answers every waiting call with null (`calls.ts:47-48`) and the ask times out at 30 s (`ASK_MS`, `links.ts:56`) to the answer `{ error: 'no_answer' }` (`links.ts:274`), which the page says through `source.md_links_no_answer`. The page's own wait is 60 s (`LINKS_MS`, `lsp.svelte.ts:125`) and resolves `{ ok: false, error: 'unsent' }` (`lsp.svelte.ts:369`).
- A pull in flight when its document closes or changes: the answer is dropped when `held.docs.get(key) !== doc || doc.version !== version` (`pulls.ts:70`); the timer per document is replaced on each schedule and cleared on close and on server end.

## Terms

no glossary (`ls tools/oculus/docs` has no `glossary.md`).

## Files with line counts

Changed list from `diff -rq` of the base copy against the tree (`wc -l` per file; the list is in `$TMPDIR/d41r1/fw.txt`). `A` is new, `M` is changed. `src/lib/views/sources/source/language/notice-words.ts` is not in the tree: it moved to the `refactor` folder.

```
A 46 src/lib/server/machine/lsp/adapters/asks.ts
A 15 src/lib/server/machine/lsp/adapters/markdown/adapter.ts
A 79 src/lib/server/machine/lsp/adapters/markdown/answers.ts
A 182 src/lib/server/machine/lsp/adapters/markdown/backticks.ts
A 35 src/lib/server/machine/lsp/adapters/markdown/capabilities.ts
A 68 src/lib/server/machine/lsp/adapters/markdown/diagnostics.ts
A 137 src/lib/server/machine/lsp/adapters/markdown/places.ts
A 77 src/lib/server/machine/lsp/adapters/markdown/requests.ts
A 102 src/lib/server/machine/lsp/adapters/markdown/rewrite.ts
A 31 src/lib/server/machine/lsp/adapters/markdown/scrub.ts
A 35 src/lib/server/machine/lsp/adapters/markdown/settings.ts
A 60 src/lib/server/machine/lsp/held/diagnostics/published.ts
A 81 src/lib/server/machine/lsp/held/diagnostics/pulls.ts
A 16 src/lib/server/machine/lsp/held/doc-key.ts
A 51 src/lib/server/machine/lsp/held/requests/calls.ts
A 89 src/lib/server/machine/lsp/held/requests/followed.ts
A 291 src/lib/server/machine/lsp/held/requests/links.ts
A 86 src/lib/state/system/machine/refactor/link-rewrite.ts
A 20 src/lib/state/system/machine/refactor/notice-words.ts
A 8 src/lib/ui/controls/editor/kit/theme/rename.css
A 307 tests/server/machine/lsp/adapters/markdown-requests.test.ts
M 299 config/catalogs/vocab.yml
M 237 config/text/findings.yml
M 220 config/text/statusbar.yml
M 176 config/text/views/sources/search.yml
M 225 config/text/views/sources/source.yml
M 71 config/text/views/system/audit.yml
M 586 DESIGN.md
M 373 docs/diagrams/channels.dot
M 2066 docs/diagrams/channels.svg
M 156 docs/diagrams/layer-server.dot
M 764 docs/diagrams/layer-server.svg
M 164 docs/diagrams/layer-state.dot
M 804 docs/diagrams/layer-state.svg
M 179 docs/diagrams/layer-views.dot
M 809 docs/diagrams/layer-views.svg
M 90 docs/diagrams/layers.dot
M 493 docs/diagrams/layers.svg
M 152 docs/files-and-search.md
M 283 docs/views.md
M 9309 package-lock.json
M 119 package.json
M 48 README.md
M 662 src/lib/data/model/index.ts
M 819 src/lib/data/model/model-entities.ts
M 813 src/lib/data/model/model-machine.ts
M 281 src/lib/data/prose/lsp-servers.ts
M 343 src/lib/data/prose/text-edits.ts
M 807 src/lib/data/snapshot/normalise.ts
M 363 src/lib/data/sources/manifests.ts
M 567 src/lib/server/content/audit/projects.ts
M 234 src/lib/server/content/audit/rules.ts
M 63 src/lib/server/content/audit/scan.ts
M 122 src/lib/server/machine/lsp/held/documents.ts
M 775 src/lib/server/machine/lsp/held/held.ts
M 125 src/lib/server/machine/lsp/held/oculus.ts
M 253 src/lib/server/machine/lsp/held/process.ts
M 191 src/lib/server/machine/lsp/held/watch.ts
M 62 src/lib/server/machine/lsp/relay-options.ts
M 880 src/lib/server/machine/lsp/relay.ts
M 864 src/lib/server/machine/lsp/servers.ts
M 383 src/lib/server/machine/lsp/uris.ts
M 184 src/lib/server/machine/lsp/wire.ts
M 846 src/lib/server/root/context.ts
M 689 src/lib/server/root/watch/portfolio.ts
M 871 src/lib/state/client/context.ts
M 203 src/lib/state/sessions/source/disk.svelte.ts
M 107 src/lib/state/sessions/source/draft-entry.ts
M 404 src/lib/state/sessions/source/draft.ts
M 816 src/lib/state/sessions/source/source.svelte.ts
M 696 src/lib/state/sources/explorer/ops.svelte.ts
M 564 src/lib/state/system/machine/lsp/lsp.svelte.ts
M 226 src/lib/state/system/machine/refactor/preview.svelte.ts
M 518 src/lib/ui/controls/editor/Editor.svelte
M 242 src/lib/ui/controls/editor/kit/lsp/hosts.ts
M 66 src/lib/ui/controls/editor/kit/lsp/uris.ts
M 284 src/lib/views/sources/files/sections/Outline.svelte
M 267 src/lib/views/sources/search/RefactorPreview.svelte
M 154 src/lib/views/sources/source/actions/BarActions.svelte
M 589 src/lib/views/sources/source/language/lsp.ts
M 80 src/lib/views/sources/source/save/DiskNote.svelte
M 81 src/lib/views/sources/source/status/tab-shown.ts
M 576 tests/checks/source/keys.test.ts
M 639 tests/server/machine/lsp/lifetime.test.ts
M 334 tests/server/machine/lsp/lsp-fixture.ts
M 340 tests/server/machine/lsp/uris.test.ts
M 201 tests/state/sessions/source-server.ts
M 163 tests/ui/controls/editor/lsp-transport.test.ts
```

`package.json` gains only `"markdown-it": "15.0.2"` and `"vscode-markdown-languageserver": "0.5.0"`. `tests/checks/config/config.test.ts` is unchanged and passes.

Files changed beyond the brief's "Paths this step writes" list, with why:

- `src/lib/data/snapshot/normalise.ts`: carries `typeWritten` from the manifest record to the `Project` the Audit reads.
- `src/lib/state/system/machine/lsp/lsp.svelte.ts`: the page's side of the `links` / `links_answer` pair (counter, pending map, 60 s wait).
- `src/lib/data/prose/text-edits.ts`: `MergedEdits`, shared by the relay and the page (placed where both `server/` and `state/` may import it).
- `src/lib/state/system/machine/refactor/notice-words.ts`: the one table of notice sentences, read by `views/sources/source/language/lsp.ts` and by `link-rewrite.ts`.
- `src/lib/state/system/machine/refactor/link-rewrite.ts` (new): `createLinkRewrite`, which asks each root and submits one preview; `ops.svelte.ts` stays under 880 lines by holding only the hook.
- `src/lib/views/sources/search/RefactorPreview.svelte`: shows `preview?.title` in place of the rename's or plain title.
- `src/lib/server/machine/lsp/wire.ts`: the `links` message schema (the brief names `model-machine.ts` but the wire schema lives here).
- `src/lib/server/machine/lsp/relay-options.ts`, `src/lib/server/root/context.ts`: the `markdown` extensions and the `served` dependency passed into the relay and the source store.
- `src/lib/server/machine/lsp/adapters/asks.ts` and `adapters/markdown/capabilities.ts`: split out of `servers.ts` so it stays at or under 880 lines.
- `src/lib/server/machine/lsp/held/documents.ts`, `held/oculus.ts`, `held/process.ts`, `held/watch.ts`, `held/held.ts` and the new `held/` files: inside the brief's `held/` path.
- `docs/diagrams/*`: generated by `npm run diagrams`, required by the diagrams check.
- `tests/state/sessions/source-server.ts`: the fixture option `served`.
- `tests/server/machine/lsp/lsp-fixture.ts`, `tests/checks/source/keys.test.ts`, `tests/ui/controls/editor/lsp-transport.test.ts`: signal helpers for the lifetime test and the moved path of `notice-words`.
- `src/lib/data/model/model-machine.ts`, `src/lib/data/model/index.ts`: the `links_answer` shape with `overlaps` and the exported `LinksFailure`.
- `package-lock.json`: inside the brief's list.
- `src/lib/ui/controls/editor/kit/lsp/uris.ts`, `hosts.ts`: the link opener (inside the brief's `kit/lsp/` path).

## Paragraphs and head comments of "What is on the tree"

| Place | State |
|---|---|
| `DESIGN.md` line 23 (served languages) | rewritten: names Markdown among the served languages |
| `DESIGN.md` line 166 (language servers) | rewritten: the Markdown server, its permissions and its link requests |
| `DESIGN.md` line 503 (Audit) | still true: the Audit section it points to is in `docs/views.md` |
| `DESIGN.md` lines 575 and 576 (Refactor Preview) | rewritten: the preview also takes the Markdown link rewrite after a move; line 576 says the roots' edits are merged per file and that a running Markdown server is told of Markdown files changed on disk |
| `docs/files-and-search.md` line 69 (tab whose file is gone) | still true; a paragraph for `unserved` is added after it (lines 71 and 72); it also says Cmd+S and the palette's Save show the line and that a restored tab waits for the served folders |
| `docs/files-and-search.md` line 85 (language servers; now line 87) | rewritten; it also names the notices for a left-out file and for a folder that could not be asked |
| `docs/views.md` line 73 (previewed edits) and its Audit section (now 213) | rewritten |
| `README.md` line 15 | rewritten |
| `docs/DATA-MAP.md` line 69 | rewritten: "listed by the Audit as a conform row on `project.yml`" |
| head comment `uris.ts` 1-30 | rewritten |
| head comment `servers.ts` 1-40 | rewritten |
| head comment `manifests.ts` 1-20 | still true; the comment of the record near line 100 is rewritten for `typeWritten` |
| head comment `audit/scan.ts` 1-10 | rewritten |
| `model-entities.ts` 78-82 | rewritten |

`config/catalogs/vocab.yml` line 228 (the archive folder "a convention here, not a rule the engine reads") is rewritten to say the Audit reads it for the type of a project.

## Judgment calls

- Settings of the Markdown server are fixed in `settings.ts`: file links warn; reference links, fragment links, unused and duplicate definitions are ignored (decision 2).
- Marks on a path outside the root or under a private folder are dropped in the `diagnostics` hook; the requests answer those paths as absent (decision 3).
- `MergedEdits` lives in `data/prose/text-edits.ts` so that `server/` and `state/` may both import it without a new boundary rule or an eleventh item in `data/helpers`. The relay merges the answers of the roots it asks and the page merges the answers of the several roots it asks; both use the class.
- Overlap means: edits of a later root whose range crosses an edit of an earlier root with different text. Edits of one root are never compared with each other.
- `overlaps` carries page addresses of the left-out files; the page takes the path under the root from the address for the notice.
- `LinksFailure` is the `error` field of the answer; the page's own timeout and a failed write resolve to `unsent`.
- `fileEvents` is a generic entry property that only the Markdown entry sets. It registers through the existing `#registered` list of `Held` and the root's `RootWatch`, whose `open` filter keeps a document open on the server from being sent twice.
- `goneFiles` in `links.ts` stays as it was: before asking for the edit, the relay sends `workspace/didChangeWatchedFiles` Deleted notices for the Markdown files under a moved folder's new place, with the old paths (case 23).
- A 404 held while the served roots load shows `cannot_open` when the list arrives and the root is served; a successful read in between drops it. When the effect sets `unserved` it clears `error`.
- `adapters/markdown/requests.ts` stats before it reads and keeps the check on the bytes read for a file that grew in between.
- `typeWritten` is the record field (decision 12); it is deleted from the built record and set only from a differing written type.
- The ask has a 30 s wait on the server (`ASK_MS`) and a 60 s wait on the page (`LINKS_MS`), so the server answers an error before the page gives up.
- The page's side lives in `lsp.svelte.ts` (the brief named `kit/lsp/`), because the other `lsp:` request and answer pairs of the page live there.
- `served` is a dependency of the source store returning the served root keys or null; null means "not known", which keeps the disk state `same` (the fixture default).
- Propose G36's Code line gains `src/lib/server/machine/lsp/held/requests/links.ts` (it starts the server for a rewrite and arms its end); the "Doc text" section below leaves it out, since the brief names the exact lines, and reports it here for the orchestrator.
- Backticked-path counts in the brief (911, 825, 86) are replaced by the ones I measured (above); no code depends on them.

## Host- or user-visible changes

| Change | Before | After |
|---|---|---|
| `.md` tabs | no language server, no marks | missing file links get a warning "File does not exist at path: <path>"; completion on `](`, go to heading, references, rename of a heading, outline from the server; status bar and commands "Markdown" |
| Cmd+click on a link or backticked hub path in a `.md` tab | nothing | opens the file at `#L<line>` for a heading link, else line 1; a missing file opens nothing |
| Backticked hub paths in `.md` files | not checked | a path whose first segment is a top-level entry of the root and that resolves to nothing is marked `oculus.no-such-path`, and opens through the entry `answers` hook when it exists |
| Move or rename in the Files view | tabs and bookmarks follow | after the move lands, a Refactor Preview titled "Update links in Markdown files" lists the links and backticked paths to rewrite; nothing is written before Apply; Apply is one History record |
| Warning when the links could not be checked | none | "Links in Markdown files under {0} were not checked: the Markdown server could not be asked." / "...: the Markdown server did not answer." / "...: the move names no place under a served folder." ({0} the folder's key) |
| Two served folders rewrite one file differently | none | "Two served folders rewrite the same text of {0} differently; it is left as it is." and the file is not in the preview; edits of all folders that agree or do not overlap are merged per file |
| Markdown files changed on disk while a Markdown server runs | the server kept the text it first read | the server is told of each created, changed or deleted `.md` file not open in a tab |
| Disk note for a tab whose root is no longer served | "deleted" state | new state `unserved`: "This file is no longer in a served folder; Save is not offered until its folder is served again."; Save, Cmd+S and the palette's Save say that line and send nothing |
| Restored tab whose file answers 404 while the folders load | "Cannot open" error shown at once | waits for the served list; `unserved` or the error, by whether its folder is served |
| Large `.md` read by the server | read whole, then refused | refused after a stat, before the read |
| Server that pushes diagnostics and sends a refresh | pulled anyway | nothing is pulled |
| Audit | flat-tier type disagreement appeared as a Findings row `type "active" is not the tier's idea` | an Audit conform row on `project.yml` "type active is not the folder's idea"; a nested tier (archive, coauthor) also gets rows when the type is not the folder's |
| Startup over a hub with no `projects/software` | printed `portfolio watch: cannot watch .../projects/software: ENOENT` | silent; the watch starts when the folder appears |
| Rename box | no hint line | hint line naming Enter and Cmd+Enter under the input |
| Dependencies | none | `vscode-markdown-languageserver` 0.5.0 and `markdown-it` 15.0.2 |

## Anything wrong in the brief

- Item 4's counts. The brief says 911 counted, 825 resolving, 86 marked in 39 files. My implementation over a `find`-based walk of the hub (excluding `.claude`, `.codex`, `worktrees`, `secrets` and oculus's `.scratch`) gives 886 counted, 801 resolving, 85 marked in 39 files, 68 in `.agents/skills` (output quoted under the case table). The file sets differ, so the counts are not comparable; the 39 and the 68 agree.
- "What is on the tree" says the server's view of the disk is kept by its watchers. It watches only the files its links lead to, so the relay's `goneFiles` notices and, since round 1, the file-event watch tell it of the rest.
- The paths list lacked the files named under "Files changed beyond the brief's list".
- The brief gives `Editor.svelte` at 517 lines; it is 518 (limit 520).
- The brief's key `refactor.title_md_links` is `refactor_preview.title_md_links` in `search.yml`.
- Brief item 5 reads the standards pages: `.agents/plan.yaml:8` has `standards: []`, so there was none to read against.

## Doc text

### G2

As they are (`grep -n` of `agents/guarded.md`):

```
10:- G2. A path outside the configured roots is refused, except a file a language server named in an answer to the page, which that page alone reads, through the `lsp` channel.
11:  Code: `src/routes/api/` fs, ops, open, source, search, history, project-files, file/[root]; the `lsp:` channel: `src/lib/server/machine/lsp/uris.ts`, `src/lib/server/machine/lsp/library/read.ts` (the relay's read), `src/lib/server/machine/lsp/library/tokens.ts` and `src/lib/server/machine/lsp/library/rules.ts` (what may be named); the deck route `(docs)/deck` and the write route's `deck-slides` and `deck-edit` (`src/lib/server/edit/writes/config/deck/`); the page's edit a language server asks for: `src/lib/server/files/fs/lsp-edit.ts`, `src/lib/state/system/machine/lsp/edits.ts`; a `source:` channel, which is never polled for a path outside the roots: `src/lib/server/files/fs/open-files.ts`; the lint route: `src/lib/server/machine/runs/lint/routes.ts` (the file's path is resolved inside its root before any program starts); `src/lib/data/helpers/files/private-folders.ts` and `src/lib/state/system/config/config-files.ts` (`isPrivateFile`).; the folder Fix All: `src/lib/server/machine/runs/lint/writing/folder.ts` (the plan), `src/lib/server/files/fs/lsp-edit.ts` (the `writing-fix` write)
12:  Test: fs: `tests/server/files/fs.test.ts`, 'refuses a path that leaves the root, a root nothing names, and a file'; ops: `tests/server/files/ops.test.ts`, 'refuses a path that climbs out, a root not served and an empty root key (case 5)'; search: `tests/server/files/search.test.ts`, 'refuses a root outside the served list before any process starts'.; fs route: `tests/server/files/fs.test.ts`, 'refuses a path that leaves the root, a root nothing names, and a file'; ops replace: `tests/server/files/ops.test.ts`, 'refuses a path that climbs out, a root not served and an empty root key (case 5)'; open: `tests/routes/files/open.test.ts`, 'refuses a directory outside every configured root'; source: `tests/routes/files/source.test.ts`, 'refuses a path outside the named root' (its body with `create: true` included); source channel: `tests/server/files/open-files.test.ts`, the table 'the open files', its rows 'never polls or publishes a name out of the roots, a root nothing names or an empty path', 'takes no name that does not start with source:', 'publishes null for a file replaced by a link out of every root, and reads no file once the link is there', 'publishes null at the tick its root stops being served, and follows the file when it is served again', 'publishes a stat signature for a file over the read limit that nobody may read, and a new one when it grows', 'polls 200 names for one socket and 1,000 over the server, and no more', 'publishes the hash of the file at the first tick, and again only when the file changes' and 'closes the poll when the last socket drops the name, and hands the next one a fresh hash'; search plan: `tests/server/files/search.test.ts`, 'refuses a root outside the served list before any process starts'; history: `tests/routes/files/history.test.ts`, 'refuses a path outside the root and a request without its two parameters'; project-files: `tests/routes/files/project-files.test.ts`, 'answers 404 for an id the hub does not hold'; file/[root]: `tests/routes/files/file.test.ts`, 'has nothing for %s'; lsp: `tests/server/machine/lsp/uris.test.ts`, describe 'a document address', the rows 'is refused for <page address>'; deck read: `tests/routes/docs/deck.test.ts`, 'refuses a root nothing serves, a path that climbs out of the root, a link and an absolute path'; deck read over drafts: `tests/routes/docs/deck.test.ts`, 'refuses a draft read without the token and one over a root nothing serves or a path that climbs out'; deck-slides: `tests/routes/edit/deck-slides.test.ts`, 'refuses what the file or the roots do not allow, and writes nothing'; deck-edit: `tests/server/edit/deck-acts.test.ts`, 'refuses a path outside the roots in every act, and writes nothing'.; library: `tests/server/machine/lsp/library.test.ts`, describe 'a library file' (one table, one row per refusal code of the read, per path rule and per message refusal), and `tests/server/machine/lsp/uris.test.ts`, its four library rows; language server edits: `tests/server/machine/lsp/uris.test.ts`, 'drops a workspace edit whose documentChanges name a file the mapper has no address for, and turns the entries of one it can'; `tests/routes/replace/lsp-edit.test.ts`, 'refuses a path that climbs out, a root not served, and a path under a dot or node_modules folder, and writes nothing (case 7)'; `tests/state/system/lsp/edits.test.ts`, 'refuses a library file, a file under node_modules or a dot folder, and a path outside', 'refuses an entry that creates, renames or deletes a file' and 'refuses an edit that names a file open in a tab of another page, whether or not a tab of this page holds it'; lint: `tests/server/machine/runs/lint/lint-route.test.ts`, 'refuses %s before any program starts (G2)' for a path that climbs out of the root, a root no list names, a folder and a file that is gone, and 'lints a link inside the root as its target and refuses a link that leads out (G2)'; `tests/routes/replace/lsp-edit.test.ts`, 'refuses a file under the hub's secrets folder and one under the home folder's .oculus as outside, and writes and keeps nothing (case 30a)'; `tests/state/system/lsp/edits.test.ts`, 'refuses a file under the hub's secrets folder and one under the home folder's .oculus before any post (case 30a)'; the folder Fix All: `tests/routes/replace/writing-fix.test.ts`, 'refuses a path that climbs out of the root, a root not served, a file, and a link out of the root (G2)' (the plan), 'refuses a path out of the root, a link out of it and a root not served, naming the file (G2)' (the write).
```

As they become (only the named parts change; every other character is as printed above):

```
10:- G2. A path outside the configured roots is refused, except a file a language server named in an answer to the page, which that page alone reads, through the `lsp` channel.
11:  Code: `src/routes/api/` fs, ops, open, source, search, history, project-files, file/[root]; the `lsp:` channel: `src/lib/server/machine/lsp/uris.ts`, `src/lib/server/machine/lsp/library/read.ts` (the relay's read), `src/lib/server/machine/lsp/library/tokens.ts` and `src/lib/server/machine/lsp/library/rules.ts` (what may be named), `src/lib/server/machine/lsp/adapters/markdown/` (the answers to the Markdown server's file requests); the deck route `(docs)/deck` and the write route's `deck-slides` and `deck-edit` (`src/lib/server/edit/writes/config/deck/`); the page's edit a language server asks for: `src/lib/server/files/fs/lsp-edit.ts`, `src/lib/state/system/machine/lsp/edits.ts`; a `source:` channel, which is never polled for a path outside the roots: `src/lib/server/files/fs/open-files.ts`; the lint route: `src/lib/server/machine/runs/lint/routes.ts` (the file's path is resolved inside its root before any program starts); `src/lib/data/helpers/files/private-folders.ts` and `src/lib/state/system/config/config-files.ts` (`isPrivateFile`).; the folder Fix All: `src/lib/server/machine/runs/lint/writing/folder.ts` (the plan), `src/lib/server/files/fs/lsp-edit.ts` (the `writing-fix` write)
12:  Test: fs: `tests/server/files/fs.test.ts`, 'refuses a path that leaves the root, a root nothing names, and a file'; ops: `tests/server/files/ops.test.ts`, 'refuses a path that climbs out, a root not served and an empty root key (case 5)'; search: `tests/server/files/search.test.ts`, 'refuses a root outside the served list before any process starts'.; fs route: `tests/server/files/fs.test.ts`, 'refuses a path that leaves the root, a root nothing names, and a file'; ops replace: `tests/server/files/ops.test.ts`, 'refuses a path that climbs out, a root not served and an empty root key (case 5)'; open: `tests/routes/files/open.test.ts`, 'refuses a directory outside every configured root'; source: `tests/routes/files/source.test.ts`, 'refuses a path outside the named root' (its body with `create: true` included); source channel: `tests/server/files/open-files.test.ts`, the table 'the open files', its rows 'never polls or publishes a name out of the roots, a root nothing names or an empty path', 'takes no name that does not start with source:', 'publishes null for a file replaced by a link out of every root, and reads no file once the link is there', 'publishes null at the tick its root stops being served, and follows the file when it is served again', 'publishes a stat signature for a file over the read limit that nobody may read, and a new one when it grows', 'polls 200 names for one socket and 1,000 over the server, and no more', 'publishes the hash of the file at the first tick, and again only when the file changes' and 'closes the poll when the last socket drops the name, and hands the next one a fresh hash'; search plan: `tests/server/files/search.test.ts`, 'refuses a root outside the served list before any process starts'; history: `tests/routes/files/history.test.ts`, 'refuses a path outside the root and a request without its two parameters'; project-files: `tests/routes/files/project-files.test.ts`, 'answers 404 for an id the hub does not hold'; file/[root]: `tests/routes/files/file.test.ts`, 'has nothing for %s'; lsp: `tests/server/machine/lsp/uris.test.ts`, describe 'a document address', the rows 'is refused for <page address>'; deck read: `tests/routes/docs/deck.test.ts`, 'refuses a root nothing serves, a path that climbs out of the root, a link and an absolute path'; deck read over drafts: `tests/routes/docs/deck.test.ts`, 'refuses a draft read without the token and one over a root nothing serves or a path that climbs out'; deck-slides: `tests/routes/edit/deck-slides.test.ts`, 'refuses what the file or the roots do not allow, and writes nothing'; deck-edit: `tests/server/edit/deck-acts.test.ts`, 'refuses a path outside the roots in every act, and writes nothing'.; library: `tests/server/machine/lsp/library.test.ts`, describe 'a library file' (one table, one row per refusal code of the read, per path rule and per message refusal), and `tests/server/machine/lsp/uris.test.ts`, its four library rows; language server edits: `tests/server/machine/lsp/uris.test.ts`, 'drops a workspace edit whose documentChanges name a file the mapper has no address for, and turns the entries of one it can'; `tests/routes/replace/lsp-edit.test.ts`, 'refuses a path that climbs out, a root not served, and a path under a dot or node_modules folder, and writes nothing (case 7)'; `tests/state/system/lsp/edits.test.ts`, 'refuses a library file, a file under node_modules or a dot folder, and a path outside', 'refuses an entry that creates, renames or deletes a file' and 'refuses an edit that names a file open in a tab of another page, whether or not a tab of this page holds it'; lint: `tests/server/machine/runs/lint/lint-route.test.ts`, 'refuses %s before any program starts (G2)' for a path that climbs out of the root, a root no list names, a folder and a file that is gone, and 'lints a link inside the root as its target and refuses a link that leads out (G2)'; `tests/routes/replace/lsp-edit.test.ts`, 'refuses a file under the hub's secrets folder and one under the home folder's .oculus as outside, and writes and keeps nothing (case 30a)'; `tests/state/system/lsp/edits.test.ts`, 'refuses a file under the hub's secrets folder and one under the home folder's .oculus before any post (case 30a)'; the folder Fix All: `tests/routes/replace/writing-fix.test.ts`, 'refuses a path that climbs out of the root, a root not served, a file, and a link out of the root (G2)' (the plan), 'refuses a path out of the root, a link out of it and a root not served, naming the file (G2)' (the write); Markdown requests: `tests/server/machine/lsp/adapters/markdown-requests.test.ts`, describe 'the Markdown server may not be given the machine or the outside', its readFile rows 'is refused for a file beside the root' and 'is refused for a link out of the root', its stat rows 'answers nothing for a file beside the root', 'answers nothing for a link out of the root' and 'answers nothing for the folder above the root', its readDirectory rows 'is refused for the folder above the root and for secrets' and 'lists neither secrets nor the link out of the root', its findMarkdownFilesInWorkspace row 'lists the files of the root and none under secrets or beside it', its watcher row 'are not made for a file beside the root', and the diagnostics hook row 'drops a mark whose path lies outside the root or under secrets, and words the others from the root'; document link: `tests/server/machine/lsp/uris.test.ts`, 'gives a document link to the page with no machine path in any field, takes its note back as the file address, and gives the target of its resolve with its #L fragment'.
```

### G3

As they are (`grep -n` of `agents/guarded.md`):

```
13:- G3. The content of `config/local.yml` is never served, read into a page or written, and no file under the hub's `secrets` folder or `~/.oculus` is given to the YAML language server, read by the writing rules' folder Fix All or written by the writing rules, whatever letter case names it.
14:  Code: the server modules that name it (`grep -rl local.yml src/lib/server`), `src/lib/server/machine/lsp/library/rules.ts` among them, which refuses the engine's `config/` folder as a library file; `src/lib/server/files/fs/lsp-edit.ts`; `src/lib/server/machine/lsp/adapters/yaml/machine-file.ts`, `src/lib/data/helpers/files/private-folders.ts`.; the folder Fix All: `src/lib/server/machine/runs/lint/writing/folder.ts` (the plan), `src/lib/server/files/fs/lsp-edit.ts` (the `writing-fix` write)
15:  Test: paste and upload: `tests/server/files/ops-paste.test.ts`, 'refuses every change to the file and to the folders holding it (case 24)'; untracked trash: `tests/server/git/untracked/trash.test.ts`, 'refuses a local.yml beside an engine root, which the Files view never touches'; config-value writer: `tests/server/edit/config-value.test.ts`, 'refuses local.yml before any file is read'; config-key writer: `tests/server/edit/config-key.test.ts`, 'refuses the machine's own file without reading it'.; file undo: `tests/routes/files/file-undo.test.ts`, 'never trashes the machine own config/local.yml, even when a record names it'; history: `tests/routes/files/history.test.ts`, 'never copies the machine own config/local.yml'; ops replace: `tests/routes/replace/ops-replace.test.ts`, 'refuses `protected` for the machine's local file of the engine root, which it never opens'; the literature route and its source adapters: `tests/routes/docs/literature.test.ts`, 'never answers a key, in a hit, a failure line or the source list'.; library: `tests/server/machine/lsp/library.test.ts`, 'drops a file under the engine config folder'; lsp-edit: `tests/routes/replace/lsp-edit.test.ts`, "refuses `protected` for the machine's local file of the engine root, which it never opens"; the folder Fix All: `tests/routes/replace/writing-fix.test.ts`, 'lists the files with an automatic fix, each with its hash and count, and no other file', "never lists the machine's local.yml, which the plan never reads", "refuses a start folder that is, or lies under, the hub's secrets folder (G3)", 'refuses the secrets folder named in another letter case, to the plan and the write (G3)', "refuses `protected` for the machine's local.yml and writes nothing to it (G3)", "refuses `outside` for a file under the hub's secrets folder and writes nothing (G3)".
```

As they become (only the named parts change; every other character is as printed above):

```
13:- G3. The content of `config/local.yml` is never served, read into a page or written, and no file under the hub's `secrets` folder or `~/.oculus` is given to the YAML or Markdown language server, read by the writing rules' folder Fix All or written by the writing rules, whatever letter case names it.
14:  Code: the server modules that name it (`grep -rl local.yml src/lib/server`), `src/lib/server/machine/lsp/library/rules.ts` among them, which refuses the engine's `config/` folder as a library file; `src/lib/server/files/fs/lsp-edit.ts`; `src/lib/server/machine/lsp/adapters/yaml/machine-file.ts`, `src/lib/server/machine/lsp/adapters/markdown/`, `src/lib/data/helpers/files/private-folders.ts`.; the folder Fix All: `src/lib/server/machine/runs/lint/writing/folder.ts` (the plan), `src/lib/server/files/fs/lsp-edit.ts` (the `writing-fix` write)
15:  Test: paste and upload: `tests/server/files/ops-paste.test.ts`, 'refuses every change to the file and to the folders holding it (case 24)'; untracked trash: `tests/server/git/untracked/trash.test.ts`, 'refuses a local.yml beside an engine root, which the Files view never touches'; config-value writer: `tests/server/edit/config-value.test.ts`, 'refuses local.yml before any file is read'; config-key writer: `tests/server/edit/config-key.test.ts`, 'refuses the machine's own file without reading it'.; file undo: `tests/routes/files/file-undo.test.ts`, 'never trashes the machine own config/local.yml, even when a record names it'; history: `tests/routes/files/history.test.ts`, 'never copies the machine own config/local.yml'; ops replace: `tests/routes/replace/ops-replace.test.ts`, 'refuses `protected` for the machine's local file of the engine root, which it never opens'; the literature route and its source adapters: `tests/routes/docs/literature.test.ts`, 'never answers a key, in a hit, a failure line or the source list'.; library: `tests/server/machine/lsp/library.test.ts`, 'drops a file under the engine config folder'; lsp-edit: `tests/routes/replace/lsp-edit.test.ts`, "refuses `protected` for the machine's local file of the engine root, which it never opens"; the folder Fix All: `tests/routes/replace/writing-fix.test.ts`, 'lists the files with an automatic fix, each with its hash and count, and no other file', "never lists the machine's local.yml, which the plan never reads", "refuses a start folder that is, or lies under, the hub's secrets folder (G3)", 'refuses the secrets folder named in another letter case, to the plan and the write (G3)', "refuses `protected` for the machine's local.yml and writes nothing to it (G3)", "refuses `outside` for a file under the hub's secrets folder and writes nothing (G3)"; Markdown server: `tests/server/machine/lsp/adapters/markdown-requests.test.ts`, describe 'the Markdown server may not be given the machine or the outside', its readFile rows 'is refused for a file under secrets', 'is refused for a file under SECRETS', 'is refused for a file under ~/.oculus' and 'is refused for the engine root local.yml', its stat rows 'answers nothing for a file under secrets' and 'answers nothing for the secrets folder', its readDirectory rows 'is refused for the folder above the root and for secrets', 'lists neither secrets nor the link out of the root' and 'lists no ~/.oculus in the home folder', its findMarkdownFilesInWorkspace rows 'lists the files of the root and none under secrets or beside it' and 'lists no local.yml of the engine root when yml is an extension, and no ~/.oculus file', its watcher row 'are not made for a file under secrets', and its entry rows 'refuses a Markdown file under secrets', 'refuses a Markdown file under SECRETS', 'refuses a Markdown file under ~/.oculus' and 'does not refuse a Markdown file of the hub'.
```

### G36

As they are (`grep -n` of `agents/guarded.md`):

```
71:- G36. A language server oculus started ends: 60 s after the last tab of its root and language closed on a page, or the page closed, when no tab or page took it over; at once when its root is no longer served; and with the oculus server. None is started twice for one page and root: one pyright serves a page's Python tabs of a root, one clangd its C and C++ tabs, one TypeScript server its TypeScript and JavaScript tabs, one Svelte server its Svelte tabs, one yaml-language-server its YAML tabs (a `.yml` and a `.yaml` tab of one root share it) and one texlab its LaTeX and BibTeX tabs (a `.tex` and a `.bib` tab of one root share it). The ESLint oculus holds for a repository's configuration folder ends too: after 15 minutes without a lint, when no served root holds its folder, when the approval it started under changes or is taken back, when `lint.eslint` is switched off, and with the oculus server; a child that exits while a lint is in flight fails that lint, a child that does not answer within the time of a lint is ended and that lint answers `timeout`, and the next lint starts a new child.
72:  Code: `src/lib/server/machine/lsp/held/process.ts`, `src/lib/server/machine/lsp/relay.ts`, `src/lib/server/machine/runs/lint/eslint.ts` (the held ESLint), `src/lib/server/machine/runs/lint/eslint-child.mjs`, `src/lib/server/root/context.ts` (the `built` hook that ends them).
73:  Test: `tests/server/machine/lsp/lifetime.test.ts`, describe 'the life of a language server', one `it` per row: 'ends 60 s after the last tab of its root and language closed, and not at 59.999 s'; 'is kept by a tab reopened at 30 s, and ends 60 s after the next close'; 'is started again by a tab reopened at 70 s, the first having ended at 60 s'; 'is not ended while another tab of its root and language stays open'; 'ends 60 s after the page closed, and not at 59.999 s'; 'is taken over by another page that opens its root and language at 30 s, with one spawn'; 'ends at once when its root stops being served'; 'ends with the oculus server'; 'is one clangd for a c tab and a cpp tab of one root on one page'; 'is one pyright for two Python tabs of one root on one page'; 'is sent SIGTERM at 2 s and SIGKILL at 5 s when it answers no shutdown'; 'is ended at 30 s when it answers no initialize, and the page is told no_answer'; 'answers a request that waited on an initialize never answered with an error when it ends'; 'is started again on the next request after it exits by itself, and stays failed after a second exit within 3 minutes'; 'is started again after an exit that comes 3 minutes or more after the one before'; 'ends a server that was being started when its page closed'; 'is one TypeScript server for a ts tab and a js tab of one root on one page, and one Svelte server for two svelte tabs'; 'is one texlab for a tex tab and a bib tab of one root on one page, which ends 60 s after the last closed'. `tests/server/machine/runs/lint/eslint-life.test.ts`, describe 'the life of a held ESLint', one `it` per row: 'ends after 15 minutes without a lint and not a moment before'; 'keeps one child for the lints of a folder and restarts the idle wait at each'; 'ends when no served root holds its folder'; 'ends when the approval it started under is not the one in force'; 'ends with the server and starts no child afterwards'; 'answers failed for a lint in flight when the child exits, and starts a new child for the next'; 'ends a child that does not answer within the time of a lint, answers timeout and starts a new child for the next'. `tests/server/machine/runs/lint/eslint-trust.test.ts`, 'ends the child when the approval is taken back'. `tests/server/root/eslint-switch.test.ts`, 'ends every held ESLint child from the hook the portfolio watcher runs'.
```

As they become (only the named parts change; every other character is as printed above):

```
71:- G36. A language server oculus started ends: 60 s after the last tab of its root and language closed on a page, or the page closed, when no tab or page took it over, or 60 s after the answer of a link rewrite it was started for with no tab open; at once when its root is no longer served; and with the oculus server. None is started twice for one page and root: one pyright serves a page's Python tabs of a root, one clangd its C and C++ tabs, one TypeScript server its TypeScript and JavaScript tabs, one Svelte server its Svelte tabs, one yaml-language-server its YAML tabs (a `.yml` and a `.yaml` tab of one root share it), one texlab its LaTeX and BibTeX tabs (a `.tex` and a `.bib` tab of one root share it) and one Markdown server its Markdown tabs (every `.md` tab of one root shares it). The ESLint oculus holds for a repository's configuration folder ends too: after 15 minutes without a lint, when no served root holds its folder, when the approval it started under changes or is taken back, when `lint.eslint` is switched off, and with the oculus server; a child that exits while a lint is in flight fails that lint, a child that does not answer within the time of a lint is ended and that lint answers `timeout`, and the next lint starts a new child.
72:  Code: `src/lib/server/machine/lsp/held/process.ts`, `src/lib/server/machine/lsp/relay.ts`, `src/lib/server/machine/runs/lint/eslint.ts` (the held ESLint), `src/lib/server/machine/runs/lint/eslint-child.mjs`, `src/lib/server/root/context.ts` (the `built` hook that ends them).
73:  Test: `tests/server/machine/lsp/lifetime.test.ts`, describe 'the life of a language server', one `it` per row: 'ends 60 s after the last tab of its root and language closed, and not at 59.999 s'; 'is kept by a tab reopened at 30 s, and ends 60 s after the next close'; 'is started again by a tab reopened at 70 s, the first having ended at 60 s'; 'is not ended while another tab of its root and language stays open'; 'ends 60 s after the page closed, and not at 59.999 s'; 'is taken over by another page that opens its root and language at 30 s, with one spawn'; 'ends at once when its root stops being served'; 'ends with the oculus server'; 'is one clangd for a c tab and a cpp tab of one root on one page'; 'is one pyright for two Python tabs of one root on one page'; 'is sent SIGTERM at 2 s and SIGKILL at 5 s when it answers no shutdown'; 'is ended at 30 s when it answers no initialize, and the page is told no_answer'; 'answers a request that waited on an initialize never answered with an error when it ends'; 'is started again on the next request after it exits by itself, and stays failed after a second exit within 3 minutes'; 'is started again after an exit that comes 3 minutes or more after the one before'; 'ends a server that was being started when its page closed'; 'is one TypeScript server for a ts tab and a js tab of one root on one page, and one Svelte server for two svelte tabs'; 'is one texlab for a tex tab and a bib tab of one root on one page, which ends 60 s after the last closed'; 'is one Markdown server for two md tabs of one root on one page, which ends 60 s after the last closed'; 'is started for a link rewrite with no Markdown tab open and ends 60 s after its answer, not at 59.999 s'. `tests/server/machine/runs/lint/eslint-life.test.ts`, describe 'the life of a held ESLint', one `it` per row: 'ends after 15 minutes without a lint and not a moment before'; 'keeps one child for the lints of a folder and restarts the idle wait at each'; 'ends when no served root holds its folder'; 'ends when the approval it started under is not the one in force'; 'ends with the server and starts no child afterwards'; 'answers failed for a lint in flight when the child exits, and starts a new child for the next'; 'ends a child that does not answer within the time of a lint, answers timeout and starts a new child for the next'. `tests/server/machine/runs/lint/eslint-trust.test.ts`, 'ends the child when the approval is taken back'. `tests/server/root/eslint-switch.test.ts`, 'ends every held ESLint child from the hook the portfolio watcher runs'.
```

G36's Code line (72) is left as printed; the judgment call above proposes adding `src/lib/server/machine/lsp/held/requests/links.ts` to it.

