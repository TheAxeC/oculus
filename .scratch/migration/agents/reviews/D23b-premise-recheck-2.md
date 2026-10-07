D23b brief recheck against main at c0a4af9c

`git log --oneline -1` prints `c0a4af9c Land D23c, library definitions read-only and the symbol selected on open`. I changed no file and ran only read-only git commands (log, show). Paths are relative to `tools/oculus/` unless they start with `plan.md`, `agents/` or `orchestrator-*`, which are relative to `tools/oculus/.scratch/migration/`.

## Premises with verdicts

The brief (`cat agents/briefs/D23b.md`, 8 lines) has no "What is on the tree" section, so there are no commands of its own to rerun. It holds a heading, one sentence, and the two plan lines as they were booked. Below are its stated premises, then the premises the plan line takes for granted (that these features are missing, and that "D23's relay", "pyright's npm route" and "oculus's write chain" exist).

**P1. "This file holds the step's plan lines whole, so nothing is lost by the one sentence `plan.md` keeps."**
- Command: `grep -n "^- D23b " plan.md`
- Output: `553:- D23b the language features that edit files no tab holds (rename, code actions, ...) ... and the TypeScript and Svelte servers from npm as pyright's is (D34); after D23; in full in agents/briefs/D23b.md (ruling Z72) (ruling Z88)`.
- Verdict: holds. The line number has moved: the earlier recheck said 545, and today it is 553.

**P2. The two plan lines "as booked before Z126 folded D34 into D23b (kept whole)".**
- Command: `git show c30a504f^:tools/oculus/.scratch/migration/plan.md | grep -n "^- D23b \|^- D34 "`. c30a504f is the Z126 fold commit, found by `git log -S`.
- Output: line 380 is the D23b line and line 391 is the D34 line. Both match the brief byte for byte.
- Verdict: holds.

**P3. "Z126 folded D34 into D23b".**
- Command: `grep -n "D23b\|D34" plan.md`
- Output: `592: Removed by Z126 ... D34 (TypeScript and Svelte servers) folded into D23b`, and `882: Open item Z126 ... D34 into D23b`.
- Verdict: holds.

**P4. "split from D23 by Z72 (4) (b1)".**
- Command: `sed -n 1367p orchestrator-history.md | grep -o "(4) (b1)..."`
- Output: "(4) (b1), every feature both servers offer, D23 the servers and the features that edit only the open file, D23b the features that edit files no tab holds through oculus's write chain plus workspace symbols and call and type hierarchy (the user)". The short form is at `plan.md:794`.
- Verdict: holds. The earlier recheck's citation `orchestrator-history.md:1358` is now false; the text is at line 1367.

**P5. "(Z88 (b))".**
- Command: `grep -n "Z88" plan.md`
- Output: `815: Open item Z88 (2026-09-30): (b), TypeScript and Svelte language features as one step on D23's relay (D34)`.
- Verdict: holds.

**P6. "after D23".**
- Command: `sed -n 542,553p plan.md`
- Output: `542: ✅ D23 ...` booked 2026-10-06, and `547: ✅ D23c ...` booked 2026-10-07.
- Verdict: holds, and is now satisfied. D23c has also landed, so the earlier recheck's "should also wait on D23c" no longer applies.

**P7. "D23's relay" exists, and the TypeScript and Svelte servers can sit on it.**
- Commands: `find src/lib/server/machine/lsp ... | xargs wc -l` and `wc -l`.
- Output, server side: `relay.ts` 845, `servers.ts` 324, `uris.ts` 329, `wire.ts` 115, `process.ts` 233, `choices.ts` 164, plus the folders `held/` (held.ts 599, documents.ts 121, watch.ts 184), `library/` (5 files), `pyright/` and `clangd/`.
- Output, page side: `kit/lsp/transport.ts` 819 and `transport/{connection,messages}.ts`.
- Verdict: holds.

**P8. "their servers from npm as pyright's is".**
- Command: `grep -n '"dependencies"\|"devDependencies"\|"pyright"\|"typescript' package.json`
- Output: devDependencies start at :25, `"typescript": "^6.0.3"` is at :47 (a devDependency, caret range, not exact), dependencies start at :52, and `"pyright": "1.1.414"` is at :94 (a dependency, exact).
- Command: `ls node_modules/typescript-language-server node_modules/svelte-language-server`
- Output: no such file or directory, for both.
- Verdict: holds as the precedent. Neither server package is installed or listed today.
- Command: `npm view <pkg> version license dist-tags.latest time.modified`
- Output: typescript-language-server 6.0.1, Apache-2.0, modified 2026-09-24. svelte-language-server 0.18.4, MIT, 2026-08-13. typescript latest 7.0.2, Apache-2.0, modified 2026-10-06.

**P9. Rename is missing.**
- Command: `grep -rn "renameProvider\|workspaceSymbolProvider\|callHierarchyProvider\|typeHierarchyProvider" src`
- Output: nothing.
- `servers.ts:145-156` (`common()`), `pyright()` at :177-213 and `clangd()` at :217-260 declare no `renameProvider`. Monaco's client registers F2 only from that capability: `monaco-lsp-client/out/index.js:1948` registers, and `:2859` maps `renameProvider`.
- D23c's look, `plan.md:548`, records "F2 offers no rename".
- Verdict: holds. Rename is absent everywhere, inside the open file too.
- The servers would offer it:
  - `grep -rho "renameProvider:{[^}]*}" node_modules/pyright/dist/*.js` prints `renameProvider:{prepareProvider:!0,workDoneProgress:!0}`.
  - `strings /usr/bin/clangd | grep` finds `renameProvider` (Apple clangd 17.0.0).

**P10. Code actions and `workspace/applyEdit` that edit a file no tab holds are refused today.**
- Code actions, read at `transport.ts:543-575` (`#codeActions`):
  - An action whose edit names only the asking document is kept.
  - An action whose edit names another file is dropped, unless it carries a command. Then it is kept with `edit: undefined` (:556), so the command runs without the edit.
  - pyright's Organize Imports is added at :559.
- `workspace/applyEdit` on the page, `transport.ts:581-637` (`#serverRequest`, `#applyEdit` at :609):
  - It is applied only when every named document is registered, each document as one undo stop through `host.apply`. `host.apply` is implemented in `client.ts:461` with `editor.executeEdits`.
  - Otherwise it shows the notice `lsp_other_files` and answers `applied: false`. The same happens for a `documentChanges` entry without `textDocument`, which is a create, rename or delete.
  - `config/text/views/sources/source.yml:51` reads "This change edits other files too; open them to apply it there."
- On the relay, `relay.ts:710-746` (`#serverRequest`): `applyEdit` is mapped with `toPage` and forwarded by `#toPage` (:752-768). The channel is chosen from the first key of `edit.changes` only; `documentChanges` is not read there. It answers `{ applied: false, failureReason: 'the page holds no such document' }` when there is no page or channel.
- Verdict: holds.

**P11. Workspace symbols are missing.**
- `relay.ts:461-476` (`#route`) answers METHOD_NOT_FOUND "`${method} names no document`" when `addressOf` (`wire.ts:90-115`) finds no document. `workspace/symbol` names none.
- Monaco has no workspace-symbol provider API: the client defines the request (`index.js:1173`) but no register call.
- The palette has only the `:` prefix: `palette.ts:278`, `if (!query.startsWith(':')) return null;`.
- Verdict: holds.

**P12. Call and type hierarchy are missing.**
- No provider is declared.
- `addressOf` does not read `params.item.uri`, so `callHierarchy/incomingCalls|outgoingCalls` and `typeHierarchy/supertypes|subtypes` would be refused at `relay.ts:466-476`.
- `#route` also requires `page.docs.get(address)` (:465), meaning the document must be open on the page.
- Verdict: holds.
- What the servers offer:
  - pyright: `callHierarchyProvider:!0` and no type hierarchy.
  - clangd: `strings /usr/bin/clangd` finds `typeHierarchyProvider`, `callHierarchyProvider` and `textDocument/prepareTypeHierarchy`. This is strong evidence, not a live `initialize` answer.

**P13. "oculus's write chain" exists for a multi-file write.**
- `ops.ts:33` says "Each operation runs behind the write chain `opsWrites`".
- `handleOps` runs `chained(into.writes, ...)` at `ops.ts:692`, and `opsShape` is at :156-209.
- `opsWrites: fsWrites()` is at `root/context.ts:578`; `chained` and `fsWrites` are at `server/core/json.ts:129,137`.
- `replace.ts` (483 lines): keeps a history copy of kind `replace`, splices from the end, rechecks the result, writes atomically, and makes one `files` record.
- The undo is `file-undo.ts:150-170` and :234-245. `FILE_FIELDS` is at `data/file-ops.ts:321-331`. The History label is at `history.yml:79`: `file_replace: Replaced in {0} files`.
- Verdict: holds. The chain is `/api/ops` plus `opsWrites`, not anything under `src/lib/server/edit/writes*`. `server/edit/writes/` holds only the undo of a `files` record (`file-undo.ts`), on the change log's `fsWrites`.

## What D23 and D23c built that D23b builds on (none of D23b's features exist)

**Rename, code actions, `applyEdit`, workspace symbols, hierarchies today:**

| Feature | Today |
|---|---|
| Rename | Not declared, so not offered (no F2), in any file. |
| Code actions | Offered when the edit names only the open document. An other-file edit is stripped when there is a command, and the action dropped otherwise. |
| `workspace/applyEdit` | Applied only to documents registered on the page (open tabs). Anything else is refused with `lsp_other_files`. Resource operations are refused. |
| Workspace symbols | Refused by the relay (METHOD_NOT_FOUND). No interface. |
| Call/type hierarchy | Not declared. The follow-up requests would be refused by `addressOf`/`#route`. |

**Read-only library files (D23c):**
- A workspace edit naming a library file reaches the page under its `oculus-lib:` address. `tests/server/machine/lsp/library.test.ts:646-665` tests this: "passes an edit ... that names a file the page holds an address for, under that address".
- The page cannot apply it, because Monaco's `executeEdits` returns false on a read-only editor (`codeEditorWidget.js:941`).
- A rename answer goes through `#response` with `asked` set (`relay.ts:692`, `#mapper` at :307-315). That can mint new library tokens for files outside the roots.
- So D23b's write must refuse any `oculus-lib:` address, by DESIGN.md:572's "a library file's tab is read-only, so no edit reaches it" and G2.

**A defect read in `uris.ts:281-329` (`toPage`), which D23b's write would expose:**
- An edit's `changes` key naming an unmappable file drops the whole edit, as the comment at :273-279 says.
- But a `documentChanges` entry whose `textDocument.uri` does not map returns DROP for that entry alone. The array walk at :288-290 filters it out and keeps the rest.
- So a server's `documentChanges` edit across files would arrive partial, and the page would apply part of it.
- `grep -n documentChanges src/lib/server tests/server` finds only `wire.ts:108-109`, so no test covers it.
- This was found by reading and has not been run. D23b must make this entry-level drop drop the whole edit before it writes edits to disk.

**The client never declares `workspace.applyEdit` or `workspace.workspaceEdit`:**
- `grep -n "workspaceEdit\|applyEdit:\|resourceOperations" monaco-lsp-client/out/index.js` prints nothing, and `initializeParams` (`servers.ts:282-324`) adds none.
- pyright sends `applyEdit` regardless: its executeCommand handler calls `connection.workspace.applyEdit(...)`.
- D23b should declare `workspace.applyEdit`, `workspaceEdit.documentChanges` and `failureHandling` once it can write.

**Where the write chain lives and how an edit to a file no tab holds would reach it:**
- No route exists today. `grep -rln "api/ops" src/lib` lists only `state/sources/explorer/ops.svelte.ts` and `state/sources/search/search.svelte.ts` on the page side.
- Route through the page:
  - Add a member to `LspServices` (`kit/lsp/services.ts:42-75`, implemented in `views/sources/source/language/lsp.ts`, around :165 for `readFile`).
  - Add a member to `TransportHost` (`transport.ts:73-97`, implemented in `client.ts:389-423` `#hosting()`; the earlier recheck wrongly placed it in `lsp.ts`).
  - Add a new op in `opsShape` and in `OpsRequest` (`data/file-ops.ts:135-170`), with a module beside `replace.ts` run inside `chained(into.writes, ...)`.
- Route through the relay: `RelayOptions` (`relay.ts:91-118`) has no ops chain, history folder or write path. `context.ts:340-351` passes `changes` and `library` only, and `context.ts` is 877 lines.
- A file open in another page's tab is known to the relay through `page.opened`/`#pages`.
- D28 (detecting a change on disk under an open tab) has not landed: `plan.md:569` carries no ✅.

**How servers are declared, for adding TypeScript and Svelte:**
- `servers.ts:6` still says "a new server is one entry here and nothing else". That is false.
- Places that name a server or a language, from `grep -rn "'pyright'\|'clangd'\|'python'\|SERVED_LANGUAGES\|SEMANTIC_LANGUAGES" src/lib`:
  1. `servers.ts:41`: the `ServerId` union.
  2. `servers.ts:266`: the `entries` list, plus a new entry function.
  3. `servers.ts:292`: the clangd-only branch of `initializeParams`.
  4. `relay.ts:85`: `ADAPTERS: Record<ServerId, Adapter>`. Each server needs an `Adapter` (`servers.ts:73-93`), and the `choices` body holds interpreter and database fields only (`model-processes.ts:235-240`).
  5. `kit/lsp/hosts.ts:21`: `SERVED_LANGUAGES = ['python', 'c', 'cpp']`.
  6. `views/sources/source/language/lsp.ts:110-114` (labels) and :371/:385 (`python ? 'pyright' : 'clangd'`).
  7. `shell/status/LanguageItems.svelte:40-41`.
  8. `kit/lsp/client.ts:40` (`SEMANTIC_LANGUAGES`) and :219 (format on type except Python).
  9. `transport.ts:559` (Python Organize Imports).
  10. `library/rules.ts:84` (`naming.server !== 'pyright'`).
  11. `palette-modes.ts:38` and `palette.ts:319` (the Python-only interpreter mode).
  12. The catalog keys `statusbar.server_*` and `source.cmd_*_restart`/`_output`.
  13. `README.md:15`'s licence list, which names only `` `pyright` (MIT) ``.
- The channel itself is generic (`wire.ts:20`, `lsp:<language>`).
- The language ids exist in `config/sources.yml`: `javascript` :107, `typescript` :118, `svelte` :133.
- M8 (yaml-language-server, `plan.md:238`) and D43 (texlab, `plan.md:516`) also add server entries and are queued beside D23b (`queue.md:14-16`). Whichever of the three goes first should make a new server one entry.

**Packages:** `typescript-language-server` and `svelte-language-server` are not in `package.json`. `typescript` is a devDependency with a caret range.

## Corrections for the brief

These are what the brief proper must state in place of what the earlier recheck (`agents/reviews/D23b-premise-recheck.md`, at fb7f076f) said.

1. **Plan line.** It is `plan.md:553`, not 545. Other places that moved:

   | Item | Now | Was |
   |---|---|---|
   | D39 | :511 | :509 |
   | Z72 | :794 | :784 |
   | Z84 | :811 | :801 |
   | Z126 | :882 | :872 |
   | Z483 | :1255 | :1245 |
   | "D23 lands before Z669" | :1452 | :1433 |
   | D32 | :581 | :573 |
   | D28 | :569 | :561 |
   | Z72 (4) (b1) | `orchestrator-history.md:1367` | :1358 |

2. **G36.** The earlier "G36 missing from `agents/guarded.md`" is false now. G36 is at `agents/guarded.md:62-64`, with Code `process.ts`, `relay.ts` and Test `tests/server/machine/lsp/lifetime.test.ts:486`. G7's Code line names `servers.ts` and `pyright/interpreter.ts` (:26).
   - G36's text names "one pyright ... one clangd". Adding the TypeScript and Svelte servers changes that entry's text, and its test gains rows.
3. **Size of `transport.ts`.** The earlier "transport.ts 897, over the line" is false now. D23c split it: `transport.ts` is 819, with `transport/connection.ts` 36 and `transport/messages.ts` 135. Current line numbers: `#codeActions` :543, `#serverRequest` :581, `#applyEdit` :609, `#in` :707.
4. **`toPage` changes keys.** The earlier "`toPage` ... a key that does not map keeps the server's `file://` address" is false now. `uris.ts:273-329`: an unmapped `changes` key drops the whole edit, and an unmapped `documentChanges` entry drops only that entry (the defect above).
5. **Line numbers in `relay.ts` and `transport.ts`:**
   - `relay.ts`: `#route` :461-476, `#response` :680-698, `#serverRequest` :710-746, `#toPage` :752-768, `RelayOptions` :91-118.
   - `transport.ts`: `TransportHost` :73-97, implemented in `client.ts:389-423`, not in `lsp.ts`.
6. **Line numbers in `servers.ts`:** `ServerId` :41, `Adapter` :73-93, `common()` :145-156, `ownFolder()` :168-175, `pyright()` :177-213, `clangd()` :217-260, `CLANGD_COMMANDS` :262, `entries` :266, the clangd branch :292.
7. **Line numbers elsewhere:**
   - `ops.ts`: `chained` at :692, `opsShape` at :156-209.
   - `context.ts`: relay built at :340-351, `opsWrites` at :578, 877 lines.
   - `FILE_FIELDS`: `data/file-ops.ts:321`.
   - `history.yml:79`; `source.yml:51`.
   - `palette.ts:278` (371 lines); `Palette.svelte` 508.
   - `References.svelte` 368; `references.ts` 186 (`RefKind` :19).
   - `hosts.ts:21`; `client.ts:40`, :219.
   - Monaco's rename conversion is `index.js:1990-2023`.
8. **Folder counts** (`git ls-files | cut | sort -u | wc -l`):
   - Full at 10: `server/machine/lsp`, `ui/controls/editor/kit`, `kit/lsp` (newly full), `views/sources`, `server/files`, `server/edit/writes`, `data`, `data/model`, `shell/keys`, `state/workbench`, `config/text/views/sources`, `tests/routes/edit`.
   - With room: `tests/server/machine/lsp` 8, `state/system/machine/lsp` 7, `views/sources/search` 6, `shell/status` 9, `server/files/fs` 8, `config/text/views/system` 8.
   - Over or near the size line: `relay.ts` 845 and `context.ts` 877 (line 880).
9. **"oculus's write chain"** is named as POST `/api/ops` behind `opsWrites` (Z84 (a), D32), not `server/edit/writes*`.
10. **Library addresses.** The brief must say that an edit naming an `oculus-lib:` address is refused whole, by D23c's read-only rule. A rename answer through `#response` can mint library tokens.
11. **The clangd question is mostly settled.** The earlier recheck said whether clangd answers type hierarchy is not verified. The `strings` check now finds `typeHierarchyProvider` and `prepareTypeHierarchy` in `/usr/bin/clangd`; reading clangd's live `initialize` answer at /spec confirms it.

## Stops

None of these choices has a ruling: `grep -n -i "workspace symbol\|call hierarchy\|type hierarchy\|typescript-language-server\|svelte-language-server\|refactor" choices.md plan.md orchestrator-state.md` finds no D23b ruling. Under automode (`orchestrator-state.md:38`) each user-visible choice goes through as an open item and is closed by the orchestrator, except S3 and S4, which may be Axel's.

- **S1. Where an edit to a file no tab holds is written, and how.**
  - Options: on the page, posting to a new `/api/ops` op; or in the relay, with the ops chain passed in. The relay has none today.
  - The new op's body shape and its `files` record field (`replace` or a new `refactor` with its History label) are a wire format and a History string.
  - This changes what is built, and it decides whether D39 (`plan.md:511`, "the list of edits shown before anything is written, through D23b's write chain") can put a preview in front of it.
- **S2. Open tabs touched by a cross-file edit.**
  - Options: edit the model and save it, or leave it unsaved. Also needed: what to do for a document open on another page.
  - D28 has not landed, so another tab's next save would overwrite a disk write.
- **S3. The TypeScript and `svelte.config.js` that run.**
  - Options: oculus's own pinned TypeScript, or a repository's TypeScript or `svelte.config.js`.
  - Running a repository's code falls under DESIGN.md:165's processes rule. DESIGN.md:571 grants language servers the exception only as "oculus's own command with oculus's own arguments".
  - Running repository code without an approval would clash with a written rule, and that clash is Axel's.
  - The package pins matter here too: `typescript` 7.0.2 is npm's latest and the native port, while oculus has ^6.0.3 as a devDependency.
- **S4. A new guarded entry**, if the cross-file write is not covered by G8 and G9's Code lines. Today G8 names `server/edit/writes.ts` and `writes/`; G9 names `file-undo.ts`, the source route and `history.ts`. Neither names `server/files/fs/ops.ts` or `replace.ts`. Under spec.md:57 a new entry is asked of Axel.
- **S5. User-visible shapes that need choosing:**
  - The workspace-symbol interface: a palette prefix and Cmd+T (desktop app only, `keys.ts:131`), or a view.
  - The hierarchy interface: inside the References view (`RefKind` :19 is `'references' | 'implementations'`, and the state is flat), or a new view.
  - Formatting from the TypeScript server.
- **S6. The `documentChanges` partial-drop defect.** If D23b writes to disk, a partial edit becomes a partial multi-file write. This is a defect inside D23b's scope, to fix rather than rule on, but the brief must name it.

## Already built

None of D23b's deliverables is built. These are the pieces D23b extends:
- The relay forwards `applyEdit` with addresses mapped, including library addresses (`relay.ts:722-735`).
- The page applies `applyEdit` to registered models as one undo stop each (`transport.ts:609-637`, `client.ts:461`).
- Code actions are filtered to the open file (`transport.ts:543-575`).
- Read-only peek models are made for files no tab holds (`transport.ts:760-800`, `#modelFor`).
- D23c's read-only library tabs and token minting (`lsp/library/`).
- The `/api/ops` `replace` write with its history copy, atomic write, `files` record and undo (`replace.ts`, `file-undo.ts`), which a new op can reuse.
- `pyright`'s npm launch pattern (`servers.ts:177-213`, `ownFolder()` :168).
- G36 in `agents/guarded.md:62-64`.

Usage: about 175,000 tokens, read from this session's token counter (15,000,000 at start, about 14,825,000 now). 53 tool calls. Time not measured.

Agent: a1ac93646e18b7cd2, claude-opus-5-5, 184,659 tokens, 81 tool uses, 6.5 min.
