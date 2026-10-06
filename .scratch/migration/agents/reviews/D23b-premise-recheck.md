# D23b brief recheck against main at fb7f076f

`git rev-parse --short HEAD` prints `fb7f076f`. D23 is at 797e1e5d. The only change in the working tree is the untracked `agents/briefs/D23c.md`, which I read from disk.

Paths below are relative to `tools/oculus/` unless they start with `agents/`, `plan.md` or `orchestrator-*`, which are relative to `tools/oculus/.scratch/migration/`.

## Found while checking, outside the brief (they decide how the brief must be written)

- **G36 is missing from `agents/guarded.md`, and so are every other guarded line D23 handed over.**
  - `grep -c G36 agents/guarded.md` prints `0`. `grep -n 'G36\|lsp\|language server' agents/guarded.md` prints nothing.
  - `git show --stat 797e1e5d -- .scratch/migration/agents/guarded.md` lists no change.
  - Z485 (plan.md Rulings) says the entry "is written into `agents/guarded.md` at D23's landing with its test named". The text to apply is in `agents/reviews/D23-report.md:4687-4730` ("Lines for agents/guarded.md"): G36 whole, plus the new Code and Test lines for G2, G7, G13 and G31.
  - The test exists: `tests/server/machine/lsp/lifetime.test.ts:486` has `describe('the life of a language server'`.
  - Consequence: D23b changes `relay.ts` and `process.ts`, which are G36's code. Under spec.md ("A step whose change touches an entry's code runs that entry's test"), no entry tells D23b's builder to run that test. Those lines need applying before D23b's brief is written.
- **`transport.ts` is already over the size line.**
  - `wc -l src/lib/ui/controls/editor/kit/lsp/transport.ts` prints 897, against spec.md's 880. `utils/size-allow.txt` lists no file.
  - The check refuses only at 900 (`tests/checks/tree/size.test.ts:29`), so it passes today.
  - D23b's work on `workspace/applyEdit` and code actions is in this file (`transport.ts:648-746`), so D23b must split it by concern.
- **The registry's head comment is false.** `servers.ts:6` says "a new server is one entry here and nothing else". D23's brief (`agents/briefs/D23.md:141`, `:625`) planned the same. What D23 built needs changes in nine places for a new server (section 2c).

## 1. Claims of the brief, against the tree

The brief (`cat agents/briefs/D23b.md`, 8 lines) holds the two plan lines as they were booked before Z126. The claims, in order:

**1.1 "booked before Z126 folded D34 into D23b"** holds.
- `plan.md:872`: "Z126 ... (a), the small steps folded: ... D34 into D23b".
- `plan.md:583`: "Removed by Z126 ... D34 ... folded into D23b".

**1.2 The current plan line is `plan.md:545`.**
- `grep -n -- '- D23b ' plan.md` prints 545. D23's brief cited `plan.md:541` (`agents/briefs/D23.md:59`), which is now stale.
- The brief should quote it as "`plan.md:545`: D23b the language features that edit files no tab holds (rename, code actions, `workspace/applyEdit`) through oculus's write chain, workspace symbols, call and type hierarchy, and the TypeScript and Svelte servers from npm as pyright's is (D34); after D23; in full in `agents/briefs/D23b.md` (ruling Z72) (ruling Z88)".

**1.3 "split from D23 by Z72 (4) (b1)" holds.**
- `plan.md:784` and `orchestrator-history.md:1358`: "(4) (b1), ... D23b the features that edit files no tab holds through oculus's write chain plus workspace symbols and call and type hierarchy".
- Other rulings that name D23b, found by `grep -n 'D23b\|D34' plan.md` (each should be cited):
  - Z483 (`plan.md:1245`): the References view and clangd's AST and memory-usage views stay in D23; the widening of D23b's line that would have moved them is withdrawn.
  - Z126 (`plan.md:872`).
  - "D23 lands before Z669" (`plan.md:1433`): D23b waits on D23.
  - D39 (`plan.md:509`, ruling Z347): "Rename on a key changes every file that names it, the list of edits shown before anything is written, through D23b's write chain". D23b therefore has to leave a write path that D39 can put a preview in front of.
  - Z84 (`plan.md:801`) and D32 (`plan.md:573`) define what "oculus's write chain" means for a write across several files (1.5).

**1.4 "rename ... edit files no tab holds" is narrower than what is missing. It differs from D23's plan.**
- D23 offers no rename at all, not even inside the open file. `servers.ts:140-151` (`common()`) and the two entries (`:195-206`, `:231-252`) declare no `renameProvider`, so Monaco's client never registers F2.
- D23's brief said this: "Rename stays wholly in D23b" (`agents/briefs/D23.md:616`).
- Corrected text: "rename, all of it (F2 with prepareRename, inside the open file and across files); pyright declares `renameProvider:{prepareProvider:!0` (`grep -rho ... node_modules/pyright/dist/*.js`)".

**1.5 "through oculus's write chain" must name the actual chain.**
- In this plan's vocabulary the phrase is Z84 (a) and D32: POST `/api/ops` op `replace`, run behind the `opsWrites` chain (`ops.ts:33`, `chained(into.writes, ...)` at `ops.ts:690`, `opsWrites: fsWrites()` at `root/context.ts:571`).
- What that chain does for each file: keeps a copy in the local history with kind `replace` (`replace.ts:19-22`, `file-undo.ts:165`), writes atomically, and records the whole request as one `files` change-log record with field `replace`. The History view undoes it (`file-undo.ts:234-245`) and labels it `file_replace: Replaced in {0} files` (`config/text/views/system/history.yml:69`).
- The whole-file save route (`src/routes/api/(files)/source/+server.ts`, `server/files/source.ts:144-180`) is a different path. It takes no base, makes no change-log record and writes one file.

**1.6 "code actions" (D23 built the half that touches only the open file):**
- `transport.ts:648-665` (`#codeActions`) keeps an action whose edit names only the asking document. An action whose edit names another file is dropped, unless it has a command; then it is kept with its edit removed (`kept.push({ ...action, edit: undefined })`, `:665`), so the command runs without the edit.
- A `workspace/applyEdit` naming any unregistered document is refused with the notice `lsp_other_files` (`transport.ts:719-746`; `config/text/views/sources/source.yml:43`: "This change edits other files too; open them to apply it there.").
- On the relay, `relay.ts:746-760` forwards `applyEdit` to the page, choosing the channel by the first key of `edit.changes` only (`documentChanges` is not read there). It answers `{ applied: false, failureReason: 'the page holds no such document' }` when no page or channel is found.
- DESIGN.md:572 states the D23 rule that D23b must rewrite: "Every feature edits only the open file: a code action or `workspace/applyEdit` that touches another file is refused with a notice, so no server writes a file oculus does not know of". `docs/files-and-search.md:71` says the same to the reader.

**1.7 "workspace symbols" (absent, and the relay refuses the request).**
- `relay.ts:446-460` (`#route`) answers any request whose `addressOf` (`wire.ts:89-114`) names no document with METHOD_NOT_FOUND "`${method} names no document`". `workspace/symbol` names none.
- Monaco's client registers no workspace-symbol interface; the `register*Provider` calls in `node_modules/monaco-editor/esm/external/monaco-lsp-client/out/index.js` include none.
- The palette has only the `:` prefix (`state/workbench/palette.ts:255`, `if (!query.startsWith(':')) return null;`).
- pyright declares `workspaceSymbolProvider:{workDoneProgress:!0}`.

**1.8 "call and type hierarchy" (absent).**
- No `callHierarchyProvider` or `typeHierarchyProvider` in `servers.ts`. `addressOf` does not read `params.item.uri`, so `callHierarchy/incomingCalls|outgoingCalls` and `typeHierarchy/supertypes|subtypes` would be refused at `relay.ts:451-460`.
- Even with `addressOf` widened, `#route` requires the document to be open on the page (`page.docs.get(address)`, `relay.ts:451`), and a hierarchy item usually lies in a file no tab holds.
- pyright declares `callHierarchyProvider:!0` and no type hierarchy. clangd on this machine is "Apple clangd version 17.0.0". Whether it answers `prepareTypeHierarchy` is not verified; reading clangd's `initialize` answer at /spec settles it.

**1.9 "TypeScript and Svelte ... on D23's relay, their servers from npm as pyright's is".**
- How pyright is run, which is the precedent:
  - `package.json` has `"pyright": "1.1.414"` under `dependencies`, pinned exact.
  - `servers.ts:171-187` launches `process.execPath` with `<ownFolder()>/node_modules/pyright/langserver.index.js --stdio`.
  - `ownFolder()` (`servers.ts:163-169`) walks up to the folder holding `package.json`.
- Registering a server takes more than "an entry" (section 2c). This is a claim that rested on D23's plan and differs from what D23 built.

**1.10 "after D23" holds, but D23b should also wait on D23c.**
- D23 landed at 797e1e5d (`agents/reviews/D23-landing.md`).
- D23c (`plan.md:544`) writes the same folders and files (section 6), so D23b's line should read "after D23 and D23c".

## 2. What D23 built that D23b extends

**a. A server's `workspace/applyEdit` and other-file code actions today:**
- On the server, `relay.ts:734-767` (`#serverRequest`): an `applyEdit` is mapped with `toPage` (`uris.ts:270-295`; `changes` keys at `:280-285`, where a key that does not map keeps the server's `file://` address) and sent to the owning page by `#toPage` (`relay.ts:776-791`) under an `oculus:<n>` id. The page's answer goes back to the server through `#answered` (`relay.ts:419-430`).
- On the page, `transport.ts:690-746`: `#serverRequest` calls `#applyEdit`, which gathers `changes` and `documentChanges` per page address. Any address with no registered model, or a resource operation (create, rename, delete), gives the notice and `applied: false`. Otherwise each document's edits are applied as one undo stop through `host.apply` (`TransportHost`, `transport.ts:73-ish`).
- Monaco's own rename converts every edit via `client.bridge.translateBackRange` (`monaco-lsp-client/out/index.js:1985-2016`). The transport's `#in` gives a file no tab holds a read-only peek model (`transport.ts:775-790`, the `changes` key included), so a cross-file rename left to Monaco would edit peek models in memory and save nothing. D23b has to take rename answers itself.

**b. How a write would be reached.**
- From the page:
  - `TransportHost` gains a call that writes edits to files no model holds. It is implemented in `views/sources/source/language/lsp.ts` (which already supplies `readFile` and `open`, `:148-155`), because `ui/` imports no state.
  - That call posts to `/api/ops` (the client modules that post today are `state/sources/explorer/ops.svelte.ts` and `state/sources/search/search.svelte.ts`).
  - The post needs a new op in `opsShape` (`ops.ts:160-210`) and `OpsRequest` (`data/file-ops.ts`), and a module beside `replace.ts` that keeps a copy, applies the ranges from the end, rereads, refuses on a mismatch (spec.md's write rule) and writes with `writeTextAtomic`, all inside `chained(into.writes, ...)` (`ops.ts:690`).
  - The undo works with no new code when the record's field is `replace`. A new field needs `FILE_FIELDS` (`data/file-ops.ts:310`), `file-undo.ts` and a label in `history.yml`.
- From the relay:
  - `RelayOptions` (`relay.ts:90-112`) gains the ops chain, the history folder and the roots. `root/context.ts:337-344` already passes `changes`.
  - `#serverRequest` then writes the edits for documents no page holds and forwards the rest.
  - Rename answers are responses, not `applyEdit` requests. They pass through `#response` (`relay.ts:704-724`), so the relay would have to intercept them there too.
  - `context.ts` is at 870 lines.

**c. Registering a TypeScript or Svelte server takes these places**, from `grep -rn -e "'python'" -e "'cpp'" -e "'clangd'" -e "'pyright'" src/lib` and reading `relay.ts`:
1. `servers.ts:36`: the `ServerId` union.
2. A new entry function and the `entries` list (`servers.ts:260-261`).
3. `initializeParams`'s clangd-only branch (`servers.ts:287-289`).
4. `relay.ts:85`: `ADAPTERS: Record<ServerId, Adapter>`. Each server needs an `Adapter` (`servers.ts:69-89`: `prepare`, `choices`, `choose`, `approve`, `settings`). The `choices` message body lists interpreter and database fields only (`model-processes.ts:205-239`).
5. `kit/lsp/hosts.ts:20`: `SERVED_LANGUAGES = ['python', 'c', 'cpp']`.
6. `views/sources/source/language/lsp.ts:99-101` (labels: python, otherwise clangd) and `:329-343` (output tab name `python ? 'pyright' : 'clangd'`).
7. `shell/status/LanguageItems.svelte:40-41` (name: pyright otherwise clangd).
8. `kit/lsp/client.ts:39` (`SEMANTIC_LANGUAGES = ['c', 'cpp']`) and `:204` (format on type except Python).
9. The catalog keys `statusbar.server_*` and `source.cmd_*_restart` / `cmd_*_output`, plus the README.md:15 licence list, which names `pyright` (MIT).
- The language ids already exist in `config/sources.yml`: `javascript` at :107, `typescript` at :118 (`.ts, .tsx, .mts, .cts`), `svelte` at :133.
- A `.tsx` file is the Monaco language `typescript`, and the transport's `didOpen` sends the model's language id. Whether typescript-language-server then reads JSX in `.tsx` as TypeScript is not verified; check at /spec.

**d. Where workspace symbols and the hierarchies hook in:**
- Workspace symbols:
  - A new branch before `#route` (`relay.ts:381-415`) that sends `workspace/symbol` to every server the page holds for the channel's entry (`page.helds`, keyed by `heldKey`) and merges the answers through `toPage`.
  - The page asks through the transport's `ask` (named in `transport.ts:27-29`).
  - An interface for it: a palette mode (`palette.ts:255`, `Palette.svelte` 505 lines) or a view.
  - Cmd+T reaches the page only in the desktop app, like Cmd+W and Cmd+N (`shell/keys/keys.ts:19`, `:131`).
- Hierarchy:
  - `addressOf` (`wire.ts:89-114`) reads `params.item.uri`, and `#route` routes an item by its root's server rather than by an open document (`relay.ts:451`).
  - The interface is the References view: `RefKind` (`state/system/machine/lsp/references.ts:16`, `'references' | 'implementations'`) and `views/sources/search/References.svelte` (364 lines), as VS Code's references-view hosts Call and Type Hierarchy.
  - The state is a tree expanded on demand, which `references.ts`'s flat files-to-lines shape does not hold.
  - The capabilities are added per entry in `servers.ts`.

## 3. Sizes and folder item counts (limit 10 items; 880 lines for .ts, 520 for .svelte)

Item counts come from `git ls-files <dir> | sed | cut -d/ -f1 | sort -u | wc -l`; line counts from `wc -l`.

Folders that are full, with the files in them D23b would touch:

| Folder (items) | Files and lines |
|---|---|
| `server/machine/lsp` (10) | relay.ts 869, held.ts 587, servers.ts 319, uris.ts 296, process.ts 233, watch.ts 184, choices.ts 164, wire.ts 114; clangd/ 3 items, pyright/ 2 items |
| `ui/controls/editor/kit` (10) | holds `lsp/` (9 items): transport.ts 897 (over the line), client.ts 529, hosts.ts 168, semantic.ts 110, markers.ts 90, peeks.ts 86, services.ts 61, uris.ts 44, signal.ts 19 |
| `views/sources` (10) | `source/` (8 items): Source.svelte 520 (at the limit); `source/language/` (5 items): lsp.ts 445 |
| `server/files` (10) | `fs/` (8 items): ops.ts 814, replace.ts 483, history.ts 346 |
| `server/edit/writes` (10) | file-undo.ts 292, undo.ts 413 |
| `data` (10) | file-ops.ts 336 |
| `data/model` (10) | model-processes.ts 249 |
| `shell/keys` (10) | Palette.svelte 505, palette-modes.ts 123 |
| `state/workbench` (10) | palette.ts 348 |
| `config/text/views/sources` (10) | source.yml 92 |
| `tests/routes/edit` (10) | |

Folders with room:

| Folder (items) | Files and lines |
|---|---|
| `server/machine` (9) | |
| `state/system/machine/lsp` (7) | lsp.svelte.ts 317, references.ts 162, symbols.ts 152, references.svelte.ts 138 |
| `views/sources/search` (6) | References.svelte 364 |
| `shell/status` (9) | LanguageItems.svelte 171 |
| `config/text/views/system` (8) | history.yml 70; `config/text/statusbar.yml` 170 |
| `tests/server/machine/lsp` (7) | |
| `tests/server/files` (8) | |

`server/root/context.ts` is 870 lines.

What follows for the brief:
- New server folders (typescript, svelte) and an edits module cannot go into `server/machine/lsp` without a restructure, for example a `servers/` subfolder holding `servers.ts`, `pyright/`, `clangd/`, `typescript/` and `svelte/`.
- `transport.ts` must be split, and `relay.ts` will pass 880.
- Anything Source.svelte gains goes into a new file.
- `kit/` cannot take a new folder.

## 4. Libraries

`npm view <pkg> version license maintainers time.modified` and `npm view <pkg> time` were run on 2026-10-06.

**`typescript-language-server` 6.0.1**
- Apache-2.0. Maintainers prabir, donniewest, rchl. 6.0.1 released 2026-09-24, 6.0.0 on 2026-08-20.
- Bin `lib/cli.mjs`; engines node >=22.22.2; no dependencies; devDependency `typescript ^6.0.3`.
- It needs a TypeScript (tsserver) to run on. Oculus has `typescript` 6.0.3 only as a devDependency, and `node_modules/typescript/lib/tsserver.js` exists.
- npm's `latest` for `typescript` is 7.0.2 (the native port, released 2026-07-08), whose `bin` lists only `tsc`. Whether it ships `tsserver.js` is not verified. Exact pins on both packages are needed.
- Whether it prefers a repository's own `node_modules/typescript` is not verified; reading `lib/cli.mjs` at /spec settles it.

**`svelte-language-server` 0.18.4**
- MIT. Maintainers svelte-language-tools-deploy, dummdidumm, orta. Released 2026-08-13.
- Bin `bin/server.js`.
- Dependencies include `svelte ^4.2.19` (a fallback when the workspace has none; oculus uses Svelte 5), `prettier ~3.3.3` and `prettier-plugin-svelte ^3.5.0` (oculus pins prettier ^3.9.6 and prettier-plugin-svelte ^4.1.1, so these would be nested copies), `vscode-languageserver-protocol 3.17.5` (oculus has 3.18.4), and `svelte2tsx`.
- peerDependency `typescript ^5.9.2 || ^6.0.2`.

**Alternatives:**
- `@vtsls/language-server` 0.3.0: MIT, one maintainer (yioneko), released 2025-12-24. It wraps VS Code's own TypeScript extension.
- `@typescript/native-preview` 7.0.0-dev.20260707.2: Apache-2.0. Whether it serves LSP is not verified.

**Rulings.**
- Z88 (b) and Z72 (1) (a) settle the capability: servers from npm, run as oculus's own commands. Neither names a package.
- Z478 settled only `vscode-jsonrpc` and `vscode-languageserver-protocol`.
- So under `libraries: check` each package above is unruled. Under automode (orchestrator-state.md:51) the orchestrator closes it with its recommendation and books it in `choices.md`.
- Recommendation: `typescript-language-server` 6.0.1 and `svelte-language-server` 0.18.4, pinned exact, with `typescript` 6.0.3 moved to `dependencies` and pinned exact. vtsls has one maintainer and no release in ten months.
- README.md:15's licence list gains both packages.
- The write needs no library: D32's `replace.ts` and `file-undo.ts` already do the history copy, the atomic write, the record and the undo.

## 5. User-visible choices no ruling settles

**A. Where a cross-file edit is applied.**
- (a) On the page: it shows or decides, applies edits to open models, and posts the rest to a new `/api/ops` op on the `opsWrites` chain.
  - For: one path for rename, code actions and `applyEdit`; D39's "list of edits shown before anything is written" can sit in front of it.
  - Against: a round trip.
- (b) In the relay, through the ops chain passed in.
  - For: no round trip.
  - Against: it must intercept rename responses as well as requests, and it leaves no place for D39's preview.
- (c) Leave edits to unopened files refused. This is the lazy option.
- Recommendation: (a).

**B. The wire shape and record of that write.**
- (a) A new op `edit` (items: root, path, LSP ranges and new text), recorded as `files` field `replace`. The undo works as it stands; History reads "Replaced in N files".
- (b) The same with a new field `refactor` and its own History label.
- Recommendation: (b), so History says what was done. (a) is the lazy option.

**C. Open tabs touched by an edit.**
- (a) As VS Code with its default `files.refactoring.autoSave`: edit the model and save it.
- (b) Edit the model and leave it unsaved.
- A file open in another page's tab (the relay knows every page's open documents through its `#pages`) is the harder case. D28's on-disk change detection has not landed (`plan.md:561` carries no check mark), so a write under another page's tab would be overwritten by that tab's next save.
- Recommendation: (a), and route each document open on another page to that page's model or refuse it with a notice. Writing it on disk regardless is the lazy option.

**D. A preview before a multi-file write.**
- (a) Rename and code actions apply at once, as VS Code does, with a preview for an `applyEdit` that asks for confirmation.
- (b) Always show the list first, which D39 asks for keys.
- (c) None, which leaves D39 to build it. This is the lazy option.
- Recommendation: (a) with the preview component built here, so D39 reuses it.

**E. The TypeScript that runs, and `svelte.config.js`.** A repository's own TypeScript, and the `svelte.config.js` the Svelte server loads, are code the reader did not write into oculus. That falls under DESIGN.md:165's processes rule, which Z498 applied to a repository's Python interpreter.
- (a) Oculus's own pinned TypeScript only, as VS Code's default.
- (b) The repository's after an approval kept as Z498's interpreter approval is.
- (c) The repository's silently. This is the lazy option and conflicts with DESIGN.md:165.
- Recommendation: (a) for TypeScript, and (b) for `svelte.config.js`, or the Svelte server is not asked to load it. This may be a clash with DESIGN.md:165, which is Axel's under the automode exclusions.

**F. Formatting from the TypeScript server.** tsserver's formatter ignores `.prettierrc`.
- (a) No formatting from it.
- (b) Offered, as in VS Code.
- Recommendation: (a) for TypeScript, and Svelte's prettier-based formatting kept.

**G. Workspace symbols.**
- (a) A palette `#` prefix, plus Cmd+T in the desktop app only (keys.ts:19).
- (b) A view.
- Recommendation: (a).

**H. The hierarchy views.**
- (a) Inside the References view, as VS Code's references-view does.
- (b) A new view (`config/layout.yml` and the Explorer group's chords; DESIGN.md:522 fixes `references` as the fourth listed view, `s1-s4`).
- Recommendation: (a).

**I. Guarded entries.**
- The new write sits under G8 ("changes only the file ... it names") and G9 (logged and undone), and needs Code and Test lines there.
- A new server's argument arrays need G7 rows (`tests/server/machine/lsp/servers.test.ts`, describe 'starting a server').
- No new entry seems needed. If one is, it is Axel's under Z392.

## 6. Paths shared with D23c and PR3

**With D23c** (`agents/briefs/D23c.md` "Paths this step writes"):
- `server/machine/lsp/` (the whole folder and a new subfolder; both steps must free a slot in a folder holding 10 items).
- `relay.ts` (both edit `toPage`, `applyEdit` and routing, and each may split it).
- `uris.ts`.
- `kit/lsp/` (`transport.ts`, 897 lines, must be split by whichever step goes first).
- `hosts.ts`, `model-processes.ts` (union members), `lsp.svelte.ts`, `views/sources/source/` (Source.svelte at 520), `References.svelte`.
- `config/text/views/sources/source.yml` (item-level).
- `tests/server/machine/lsp/`.
- DESIGN.md :123, :571 and :572 (the same sentences).
- `docs/files-and-search.md` :69-72.
- `agents/guarded.md` G2 (D23c rewrites the sentence).

Verdict: not simple. The folder restructures and the transport and relay splits collide. D23b's brief should be written on main after D23c lands.

**With PR3** (`agents/briefs/PR3.md` "Paths this step writes"):
- `state/workbench/palette.ts`, `palette-source.svelte.ts` and `shell/keys/Palette.svelte` (505 lines), if workspace symbols go in the palette (5G (a)). Not simple if both add to Palette.svelte.
- `server/edit/writes/undo.ts` only if 5B (b) needs a dispatch there; `file-undo.ts` is not on PR3's list.
- `config/text/views/system/history.yml` (item-level).
- `agents/guarded.md` G2, G8, G9 (line-level).
- `HELP.md`, `DESIGN.md`, `docs/files-and-search.md`, `docs/views.md` (paragraph-level).

PR3 is in flight now (orchestrator-state.md dispatch block) and will very likely land before D23c does, so this only matters if it has not.

Agent usage: a3954ec1368da62a6, claude-opus-5-5, 231,914 tokens, 95 tool uses, 10.2 min.
