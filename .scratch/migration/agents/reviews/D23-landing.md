# D23 landing

Position: oculus/migration, step D23 (a language server client in the source editor: pyright and clangd) landed. Next: Q126 lands; D23c, D45, X3e, M8, D43, D23b and D33 are ready to prepare.

## Open items

None.

## Not done

- Look item 4, F12 into the standard library, does nothing: waived for D23 by Axel's ruling (b) "D23 lands before Z669"; built in D23c (Z669 (a)).
- Look item 5 holds except the column: go to definition into another file and an Outline press put the cursor at column 1; built in D23c (Z670 (a)).

## Agents stopped

`ListAgents` before the commit lists one subagent, PR3's builder a348cc74b67ed634e; none of D23's agents.

## What landed

pyright for Python and clangd for C and C++ in the source editor, one server per page, root and language, every feature that edits only the open file, the References view, clangd's AST, memory-usage and output views, `.oculus/cpp.yml` with the compile database picker, the interpreter picker, and the Files Outline's code symbols. 197 files, +12577 -1517, from base 465efcdfb merged onto main's head 82971f8e.

## Fixes at landing (15)

- The merge carried onto main's head.
- B-a: a lost server's documents leave the page at once, so a re-sent `didOpen` starts the new server (`relay.ts`).
- B-b: `followRoots` is built again on a `workspaces` key change (`root/context.ts:817-818`).
- B-c: `Held.reload` sets the state through `#set` (`held.ts:216`).
- St-1: `Open` made local (`held.ts:560`). `utils/unused-exports.sh` prints 374 lines against the base's 381; its line `auth.ts: TOKEN_HEADER, carriesToken` is a wrong hit, since `root/socket.ts:29` imports `carriesToken` and `:141` calls it.
- Z663: `refused` awaits the forked server's exit before the dialog.
- The channel test's call.
- pyright is found from oculus's own folder by module location (`servers.ts`).
- A missing pyright no longer crashes the relay.
- Every `initialize` of a channel is answered (`relay.ts`, `held.ts`).
- `textDocument/switchSourceHeader` is sent as `{ uri }`, which clangd reads, and the relay routes it (`transport.ts`, `wire.ts`). Alt+O went from `mirrors.cpp` to `mirrors.h` and back, and from cathedra's `env.h` to `env.cpp` and back.
- A request the relay could not pass on, as while its server restarts, is answered with no result instead of an uncaught error in the page (`transport.ts`).
- A tab's language extension is made again only when its language, root, path or version changes (`tab-language.svelte.ts`); before, every Files tree click closed and reopened every served document. A socket tap recorded no `didClose` or `didOpen` on expanding and collapsing cathedra after the fix.
- The compile-database choices are asked for again when a server starts and each time the picker opens (`lsp.svelte.ts`, `ChoiceRows.svelte`); after a `.oculus/cpp.yml` was added the picker listed `snes`, and after it was removed and clangd restarted the item read "No compile database" without a reload.
- Next Problem into another file no longer loops and freezes the page: the opener in `hosts.ts` returns false, since the file opens in its own tab (Monaco's `gotoError.js:134-141` navigated again in the same editor on true).

St-2 needs no change: the round's builder ran one read-only `git diff --stat` against the brief's git ban.

## The look (scratch oculus on port 8793, Z662)

- 1, 2, 6, 7: hover, completion (`os.` members), the Outline (186 and 187 symbols), the interpreter item 3.13.4, a 439 KB Python file served.
- 3: cathedra `utils/build.py`, Shift+F12 on `run`: References (19), which is the file's 25 `run(` calls less its 6 `subprocess.run`; pyright answered both `textDocument/codeAction` requests at line 976 with `[]`, so it offers no quick fix there.
- 8: clangd indexing progress, F12 on an include, peek, inlay hints, semantic colours under dark-plus, Show AST, Memory Usage, Language Server Output, Format Document, on-type formatting, inactive regions.
- 9, 10, 11: game-engine's own clangd and its 7 compile databases in the picker; hover in 163 ms on a large file; no long task while typing.
- 12: scotoma with no database: "No compile database" and `dlg.c` marked "In included file: 'snes.h' file not found"; with `.oculus/cpp.yml` naming `snes`: the item reads "Compile database: snes. Select another." and `dlg.c`, `spr.c` and `scotoma.h` carry no marker; the file removed afterwards.
- 13: the Outline nested by indent on `metrics.py` (187), `mirrors.cpp` (34), `boot_profile.cpp` (5), a Markdown file (7 headings), a `.tex` file (42, the file's 42 sectioning commands), and a YAML file ("No symbols for this file yet.").
- 14: two pages, one closed: its pyright 71650 still running at 50 s and gone at 65 s, the others running; on one page the hub's Python tabs closed and `build.py` reopened at 32 s: pyright 32217 kept, no new one; closed again: running at 50 s, gone at 66 s.
- Repositories: cathedra, game-engine, scotoma and youtube-downloader have the status hash they had before the look (`da39a3ee5e6b`), and nothing under a `.cache` is newer than the look's start.
- Found outside the brief and folded into X3e (Z468): files added to the `play` root were listed in the Files tree only after a page reload.

## Verification

`npm run diagrams && npm run test:landing` in the gate: ASCII gate, format:check, lint, `npm test`, `test:checks`, and check, build and test:slow, "test:landing: 263.8 s; every command passed". Main's staged diff equals the gate's by `cmp`.

## Usage

- Builder a4832e8f1d3fc04a3 (claude-sonnet-5-5): 127,533 tokens, 1135 tool uses, 309.7 min; round 1 156,448 tokens, 282 tool uses, 84.4 min.
- Brief check a3954c49b6f0bf078 (claude-opus-5-5): usage not recorded.
- Reviewer a0a498ede0a9659bb (claude-opus-5-5): 238,723 tokens, 126 tool uses, 22.5 min; over round 1 a024bbd7dac672561 (claude-opus-5-5): 206,427 tokens, 108 tool uses, 17.2 min.
- The first report did not pass its bar (one repair round); 15 fixes at landing.
