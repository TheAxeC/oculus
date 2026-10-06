Everything in the brief is done.

# D23 report

Characters outside ASCII occur only inside quoted program output (the test runner's markers, a hover text clangd answers, the file name of case 23).

## Open items of the state file, verbatim

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
```

## Rulings and findings

Rulings needed, none of them undone work: case 7 (file order or name order), case 45 (restart at once with open documents or on the next document), case 46 (the address form for a root key holding a slash), case 47 (a 551 MB peak against 320.0 MB in the brief). The landing look (items 1-14) is the orchestrator's own; every feature it exercises is in 'Host- and user-visible changes'. One finding is reported in part 7, item 13 (test:quick is intermittent in this tree: its svelte-check step fails on some runs and passes on others; cause not established).

## The cases' first run

Every case checks a feature this step adds or changes, so on the unchanged tree each case has nothing to run against: the folders the cases run through do not exist there. The command below is that first run, on the base copy of the tree (`/Users/axelfaes/workspace/research-hub/.agents/worktrees/D23-base/tools/oculus`):

```
$ ls src/lib/server/machine/lsp src/lib/ui/controls/editor/kit/lsp src/lib/state/system/machine/lsp   (in the base copy)
ls: /Users/axelfaes/workspace/research-hub/.agents/worktrees/D23-base/tools/oculus/src/lib/server/machine/lsp: No such file or directory
ls: /Users/axelfaes/workspace/research-hub/.agents/worktrees/D23-base/tools/oculus/src/lib/state/system/machine/lsp: No such file or directory
ls: /Users/axelfaes/workspace/research-hub/.agents/worktrees/D23-base/tools/oculus/src/lib/ui/controls/editor/kit/lsp: No such file or directory
```

The unchanged-tree run of the added tests is in part 5, under the gates. Every output below is the output of a run on the final tree, the command printed with it; a case script is a file under `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases`, and each is quoted whole in the attachment list at the end of this part.

A case marked "Ruling" is one where the brief's rule is wrong or ambiguous: the rule, the result and a slot for the orchestrator's ruling are given in it. They are cases 7, 45, 46 and 47.

#### Case 1

Rule (brief): A Python tab in the hub: hover on `catalog` at `tools/present/build.py:24:25` shows its signature; F12 opens `tools/present/deck_config.py` at line 42 in a tab.

Run A: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/a-python.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/a-python.out 2>&1`

```
=== CASE 1: hover and F12 on `catalog` at tools/present/build.py:24:25
hover -> {"contents":{"kind":"plaintext","value":"(function) def catalog(root: Unknown) -> dict[str, Unknown]"},"range":{"start":{"line":23,"character":24},"end":{"line":23,"character":31}}} (569 ms)
definition -> [{"uri":"oculus-file:///hub/tools/present/deck_config.py","range":{"start":{"line":41,"character":4},"end":{"line":41,"character":11}}}]
```

Page half, by reading: F12 opens the target in a tab through `openSourceFile` (`src/lib/views/sources/source/language/lsp.ts:154`, `src/lib/views/sources/source/language/lsp.ts:273`, `src/lib/views/sources/source/language/lsp.ts:420`); the look is item 5 of the landing look.

Result: the hover answers `(function) def catalog(root: Unknown) -> dict[str, Unknown]` in 569 ms and the definition is `oculus-file:///hub/tools/present/deck_config.py` at line 41 zero-based, which is line 42. The tab half is for the landing look.

#### Case 2

Rule (brief): Shift+F12 on that name lists every use across the root's files in the references widget, each entry opening its file; Shift+Alt+F12 opens the References view with the same locations grouped by file and "<n> results in <m> files".

Run A: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/a-python.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/a-python.out 2>&1`

```
=== CASE 2: references of `catalog` across the root
references -> 3 locations in 2 files
    oculus-file:///hub/tools/present/build.py 2
    oculus-file:///hub/tools/present/deck_config.py 1
```

Page half, by reading: Shift+Alt+F12 is the action `oculus.lsp.references` (`src/lib/views/sources/source/language/lsp.ts:370`), which stores the answer in `references` (`src/lib/state/system/machine/lsp/references.svelte.ts:33`); the view draws the count line from `views.sources.search.count` ('{0} results in {1} files', `config/text/views/sources/search.yml:11`) and a row per file and per location (`src/lib/views/sources/search/References.svelte`).

Result: the server answers 3 locations in 2 files (`build.py` 2, `deck_config.py` 1). The widget and the view are for the landing look (items 5 and 8).

#### Case 3

Rule (brief): A type error in an open Python file is marked within 2 s of typing it, and the marker goes when the error is fixed.

Run A: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/a-python.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/a-python.out 2>&1`

```
=== CASE 3: a type error marked within 2 s of typing it, gone when fixed
error marked after 351 ms -> ["Type \"Literal['x']\" is not assignable to return type \"int\"\n  \"Literal['x']\" is not assignable to \"int\""]
marker gone after 256 ms -> []
```

Page half, by reading: the diagnostics become Monaco markers by `setModelMarkers` (`src/lib/ui/controls/editor/kit/lsp/client.ts:409`).

Result: the error is published 351 ms after the text is sent and the marker list is empty 256 ms after the fix, both under 2 s.

#### Case 4

Rule (brief): `lib.py` changed in another tab and saved, and in a terminal outside oculus: `main.py`'s diagnostics follow both (premise 5).

Run A: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/a-python.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/a-python.out 2>&1`

```
=== CASE 4: lib.py changed in another tab and on disk: main.py follows both
main.py at first -> ["Type \"str\" is not assignable to declared type \"int\"\n  \"str\" is not assignable to \"int\""]
another tab edit: main.py diagnostics cleared after 255 ms -> []
disk change outside oculus: main.py marked again after 310 ms -> ["Type \"str\" is not assignable to declared type \"int\"\n  \"str\" is not assignable to \"int\""]
disk change outside oculus: main.py cleared after 263 ms -> []
```

Result: `main.py`'s diagnostics clear 255 ms after the other tab's edit of `lib.py`, return 310 ms after a change on disk outside oculus and clear 263 ms after the fix on disk.

#### Case 5

Rule (brief): A C++ tab of `cathedra/src/monastery/src/mirrors.cpp` with `build/debug` in force: F12 on a function declared in `mirrors.h` and defined in another `.cpp` goes to the definition after the index ends; references across the repository's files.

Run C: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/c-cathedra.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/c-cathedra.out 2>&1`

```
=== CASE 5: F12 on spawnInstance in mirrors.cpp (declared in data/spawn.h, defined in curia/src/data/spawn.cpp)
definition (34 s after the first request) -> [{"range":{"end":{"character":25,"line":404},"start":{"character":12,"line":404}},"uri":"oculus-file:///cathedra/src/curia/src/data/spawn.cpp"}]
index ended: state frames seen 662 | last ready
references -> 10 locations in 7 files: ["oculus-file:///cathedra/src/monastery/src/mirrors.cpp","oculus-file:///cathedra/src/curia/internal/data/spawn.h","oculus-file:///cathedra/src/curia/src/data/natives_entity.cpp","oculus-file:///cathedra/src/curia/src/data/spawn.cpp","oculus-file:///cathedra/src/curia/src/net/wire_codec.cpp","oculus-file:///cathedra/src/curia/src/scene/scene_tree.cpp"]
```

Result: F12 on `spawnInstance` answers `curia/src/data/spawn.cpp` at line 404 zero-based, 34 s after the first request; references after the index ended are 10 locations in 7 files.

#### Case 6

Rule (brief): The status bar of that tab: `compile_database` reads `build/debug`; the picker lists cathedra's 13 found databases, `debug` first; choosing `build/release` restarts clangd and the item follows.

Run C: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/c-cathedra.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/c-cathedra.out 2>&1`

```
=== CASE 6: compile_database item and picker for cathedra
database in force -> build/debug | found: 13 | first five: ["build/debug","build/dist","build/asan","build/tsan","build/allocaudit"]
all databases -> ["build/debug","build/dist","build/asan","build/tsan","build/allocaudit","build/nodocs","build/nodebugger","build/noprofile","build/cycleaudit","build/switch","build/release","build/pgo","build/tsancycle"]
findings -> []

=== CASE 6: choosing build/release restarts clangd and the item follows
database in force after choose -> build/release | pid before 7434 after [14099]
states seen -> ["starting","ready","indexing","indexing","indexing","indexing","indexing","indexing","indexing","indexing","indexing","indexing","indexing","indexing","indexing","indexing","indexing","indexing","indexing","indexing","indexing","indexing","indexing","indexing","indexing","indexing","indexing","inde...
```

Page half, by reading: the item reads the database in force (`src/lib/shell/status/LanguageItems.svelte:114`) and the picker is `ChoiceRows.svelte`; landing look item 8.

Result: database in force `build/debug`, 13 found, `build/debug` first; after the choice of `build/release` the item's value is `build/release` and the clangd pid changed from 7434 to 14099.

#### Case 7

Rule (brief): A repository with `.oculus/cpp.yml` naming two configurations: the picker lists both first, by name, then the found databases; with no remembered choice the first configuration is in force.

Run F1: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/f1-config.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/f1-config.out 2>&1`

```
=== CASE 7: a repository with .oculus/cpp.yml naming two configurations beside two found databases
picker -> ["[cfg] second-flags","[cfg] first-db","build/debug","build/release"] | in force (no remembered choice) -> second-flags | findings -> []
```

Result: the picker lists `[cfg] second-flags`, `[cfg] first-db`, `build/debug`, `build/release`, and `second-flags` is in force; the file written by the script names `second-flags` first and `first-db` second, so the order is the file's order. The brief's "by name" reads either as "each shown by its name" (what is built) or as "sorted by name" (then `first-db` would come first and the in-force configuration would be `first-db`). Ruling needed: file order (as built) or name order.

Ruling: ______

#### Case 8

Rule (brief): scotoma with no `.oculus/cpp.yml`: `src/dlg.c` gets 21 diagnostics, the first "In included file: 'snes.h' file not found" from `scotoma.h:18`. With `.oculus/cpp.yml` holding `configurations: [{ name: snes, fallback_flags: [-xc, -Itools/pvsneslib/pvsneslib/include] }]` (a path relative to the repository root): `src/dlg.c` and `src/spr.c` get 0 diagnostics, and hover on `u8` shows its typedef from `snestypes.h`.

Run D: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/d-scotoma.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/d-scotoma.out 2>&1`

```
=== CASE 8: scotoma with no .oculus/cpp.yml (also case 19: no database, no cpp.yml)
no cpp.yml
   compile database in force: null | configurations in list: [] | findings: []
   src/dlg.c: 21 diagnostics, first: "In included file: 'snes.h' file not found\n\n/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/scot-pXevot/src/scotoma.h:18:10:\nnote: error occurred he...
   src/spr.c: 21 diagnostics, first: "In included file: 'snes.h' file not found\n\n/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/scot-pXevot/src/scotoma.h:18:10:\nnote: error occurred he...
   choices.database -> null | databases -> []

=== CASE 8: with .oculus/cpp.yml holding configurations: [{ name: snes, fallback_flags: [-xc, -Itools/pvsneslib/pvsneslib/include] }]
snes configuration
   compile database in force: "snes" | configurations in list: ["snes"] | findings: []
   src/dlg.c: 0 diagnostics
   src/spr.c: 0 diagnostics
   hover on u8 (dlg.c:25:2) -> {"contents":{"kind":"plaintext","value":"type-alias u8\nprovided by \"snes/snestypes.h\"\n\nType: unsigned char\n\ntypedef unsigned char u8"},"range":{"end":{"character":2,"line":24},"start":{"character":0,"line":24}}}
```

Result: 21 diagnostics on `src/dlg.c` and on `src/spr.c` with no `.oculus/cpp.yml`, the first "In included file: 'snes.h' file not found" from `scotoma.h:18:10`; with the `snes` configuration both files get 0 and hover on `u8` answers `type-alias u8 provided by "snes/snestypes.h"`. The run reads a copy of scotoma's `src` and `tools/pvsneslib/pvsneslib/include` under the scratch folder.

#### Case 9

Rule (brief): `format_on_save: true` for `cpp`: saving a badly indented `.cpp` saves it formatted; `false` saves it as typed; `true` for `python` saves as typed.

Run G1: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/g1-misc.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/g1-misc.out 2>&1`

```
=== CASE 9: format on save: what the servers answer to a formatting request (the save logic is the page, views/sources/source/language/lsp.ts)
clangd formatting ->  6 edit(s), first: {"newText":" ","range":{"end":{"character":10,"line":0},"start":{"character":10,"line":0}}}
pyright formatting -> {"code":-32601,"message":"Unhandled method textDocument/formatting"} (no provider: the page saves as typed)
```

Page half, by reading: a save calls `prepare` (`src/lib/views/sources/source/Source.svelte:247`), which formats only when the language's `format_on_save` is true; the client sends the request only when the server declared `documentFormattingProvider` (`src/lib/ui/controls/editor/kit/lsp/client.ts:495`); the key's default is false (`src/lib/data/helpers/editor.ts:26`). Landing look item 8 (Format Document).

Result: clangd answers the formatting request with 6 edits and pyright answers -32601, so the save paths for `cpp` and `python` are the page's: formatted for clangd with `true`, as typed for pyright.

#### Case 10

Rule (brief): The Outline on a Python file lists its classes, functions and module variables with their kinds' icons; on a C++ file its namespaces, classes, methods and functions; a press goes to the line; a Markdown file keeps its headings; a YAML file says "No symbols for this file yet.".

Run G1: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/g1-misc.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/g1-misc.out 2>&1`

```
=== CASE 10: document symbols: kinds on a Python and a C++ file
python -> ["CONST kind=14","A kind=5","m kind=6","f kind=12"]
cpp -> ["ns kind=3","C kind=5","method kind=6","func kind=12"]
```

Page half, by reading: the Outline draws the server's symbols with each kind's icon (`src/lib/views/sources/files/sections/Outline.svelte`), keeps the heading path of Markdown and LaTeX, and says `files.outline_none` ('No symbols for this file yet.', `config/text/views/sources/files.yml:152`) for a language no server serves. Landing look item 13.

Result: Python symbols arrive as kinds 14 (constant), 5 (class), 6 (method), 12 (function) and C++ symbols as 3 (namespace), 5, 6, 12.

#### Case 11

Rule (brief): The breadcrumb of a Python tab with the caret inside a method: root, folders, file, class, method; a press on the class moves the caret to the class's line.

Page half, by reading: `tabCrumbs` appends the symbols that contain the caret after the path segments (`src/lib/shell/panes/strip/tab-crumbs.ts:29`); a press on a symbol crumb calls `goTo(line, column)` (`src/lib/shell/panes/strip/tab-crumbs.ts:59`). Landing look item 5.

Result: checked by reading; the look is the orchestrator's.

#### Case 12

Rule (brief): The interpreter item on a Python tab of a root with no `.venv` or `venv` reads `3.13.4` (the PATH `python3`, its tooltip `~/.pyenv/versions/3.13.4/bin/python3`, the shim's answer); with `<root>/.venv` made it reads `3.13.4 (.venv) not approved` after a restart and pyright keeps the PATH interpreter; Approve makes it `3.13.4 (.venv)` and pyright is answered `<root>/.venv/bin/python`; Select Interpreter lists both and the choice survives a reload of the page and of the server.

Run B: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/b-interp.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/b-interp.out 2>&1`

```
=== CASE 12: the interpreter of a root with no .venv or venv
choices (no venv) -> {"interpreter":"/Users/axelfaes/.pyenv/versions/3.13.4/bin/python3","list":["3.13.4 found=path approved=true path=/Users/axelfaes/.pyenv/versions/3.13.4/bin/python3"]}
pyright was answered pythonPath -> ["/Users/axelfaes/.pyenv/versions/3.13.4/bin/python3"]
```

```
=== CASE 48: the PATH python3 is the pyenv shim, pyright is answered the shim sys.executable
which python3 -> /Users/axelfaes/.pyenv/shims/python3
python3 -c sys.executable -> /Users/axelfaes/.pyenv/versions/3.13.4/bin/python3
choices (.venv made, restarted) -> {"interpreter":"/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/interp-pxL2L8/.venv/bin/python","list":["3.13.4 found=venv approved=false path=/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/interp-pxL2L8/.venv/bin/python","3.13.4 found=path approved=true path=/Users/axelfaes/.pyenv/versions/3.13.4/bin/python3"]}
pyright answered after the restart -> ["/Users/axelfaes/.pyenv/versions/3.13.4/bin/python3"] (must be the PATH interpreter while .venv is not approved)
choices (approved) -> {"interpreter":"/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/interp-pxL2L8/.venv/bin/python","list":["3.13.4 found=venv approved=true path=/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/interp-pxL2L8/.venv/bin/python","3.13.4 found=path approved=true path=/Users/axelfaes/.pyenv/versions/3.13.4/bin/python3"]}
pyright answered after Approve -> ["/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/interp-pxL2L8/.venv/bin/python"]
.venv/bin/python is a symlink to /Users/axelfaes/.pyenv/versions/3.13.4/bin/python3.13
ps of pyright -> 69457 /Users/axelfaes/.nvm/versions/node/v24.21.0/bin/node /Users/axelfaes/workspace/research-hub/.agents/worktrees/D23/tools/oculus/node_modules/pyri
process.execPath -> /Users/axelfaes/.nvm/versions/node/v24.21.0/bin/node
choose /Users/axelfaes/.pyenv/versions/3.13.4/bin/python3 -> in force /Users/axelfaes/.pyenv/versions/3.13.4/bin/python3
a reloaded page -> /Users/axelfaes/.pyenv/versions/3.13.4/bin/python3
a restarted server (new relay over the same lsp folder) -> /Users/axelfaes/.pyenv/versions/3.13.4/bin/python3
```

Page half, by reading: the item's words are `statusbar.interpreter_unapproved` ('{0} not approved', `config/text/statusbar.yml:99`) for an interpreter that is listed with `approved=false`, and its tooltip carries the path (`config/text/statusbar.yml:96`); the Approve press in the picker asks one `Confirm` naming the interpreter's path first (`src/lib/shell/keys/ChoiceRows.svelte:76`); landing look item 1.

Result: with no venv the one interpreter is the PATH `python3` as `/Users/axelfaes/.pyenv/versions/3.13.4/bin/python3` and pyright is answered it; with `.venv` made and the server restarted the venv is listed with `approved=false` and pyright is still answered the PATH interpreter; after Approve pyright is answered the venv's `bin/python`; a chosen path survives a reloaded page and a restarted server relay.

#### Case 13a

Rule (brief): Two pages over the hub, each with a Python tab of the hub open: two pyright processes (`ps`); one page closed: its pyright still running 50 s later and ended at 65 s, the other page's pyright running.

Run: `bash /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/run-counts3.sh > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/rep/counts.out 2>&1`, scenario `two-pages` (two `ws` stand-in pages on the dev server on port 8795, `ps` counts of `langserver.index.js|clangd`):

```
== scenario two-pages
t+  0s  before any page: 0 process(es)
            (lsof 8790 and 8795 are noted by the caller)
t+  1s  both pages open: 2 process(es)
            commands: /Users/axelfaes/.nvm/versions/node/v24.21.0/bin/node /Users/axelfaes/workspace/research-hub/.agents/worktrees/ | /Users/axelfaes/.nvm/versions/node/v24.21.0/bin/node /Users/axelfaes/workspace/research-hub/.agents/worktrees/
            page A hover answered: true
t+  6s  page A closed
t+ 56s  50 s after page A closed: 2 process(es)
t+ 71s  65 s after page A closed: 1 process(es)
t+ 71s  page B closed
t+141s  70 s after both closed: 0 process(es)
```

Unit test: `tests/server/machine/lsp/lifetime.test.ts`, 'ends 60 s after the page closed, and not at 59.999 s'.

Result: 2 processes with both pages open, 2 at 50 s after page A closed, 1 at 65 s, 0 at 70 s after both closed.

#### Case 13b

Rule (brief): One page over the hub with a Python tab, the page closed, a new page over the hub opened at 30 s with a Python tab: the closed page's pyright is taken over (one pyright process at 65 s and later, the same pid, `ps`), and the server got `didClose` for the old page's documents and `didOpen` for the new one's.

Run: scenario `takeover` of the same script:

```
== scenario takeover
t+  0s  before any page: 0 process(es)
            (lsof 8790 and 8795 are noted by the caller)
t+  2s  page A open: 1 process(es)
t+  2s  page A closed
t+ 35s  page B opened at 30 s: 1 process(es)
t+ 70s  65 s after page A closed: 1 process(es)
            same pid kept: true
            page B hover answered by the taken-over server: true
t+145s  70 s after page B closed: 0 process(es)
```

Run G3: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/g3-relay.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/g3-relay.out 2>&1`

```
=== CASE 29: a page reload: the new page takes the old page servers over within 60 s; no didOpen twice
old page closed 3 s ago: processes 1 pid 96768
reloaded page: state {"oculus":"state","root":"p","state":"ready"} | processes 1 pid 96768 (same pid: taken over, one spawn)
methods the server received, in order: ["initialize","initialized","textDocument/didOpen","textDocument/didClose","textDocument/didOpen"]
didOpen count: 2 | didClose count: 1 (open, close on takeover, open again: never two opens in a row; a repeated didOpen of the open doc is dropped)
```

Unit test: `tests/server/machine/lsp/lifetime.test.ts`, 'is taken over by another page that opens its root and language at 30 s, with one spawn' (it asserts the stub received `textDocument/didClose`).

Result: 1 process at 65 s with the same pid, page B's hover answered by it; the server received `didOpen`, `didClose`, `didOpen`.

#### Case 14

Rule (brief): pyright missing from `node_modules` (renamed away in a scratch copy) or clangd not on PATH: the status item says not found with the program it looked for; no spawn loop; the editor works without the features.

Run G1: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/g1-misc.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/g1-misc.out 2>&1`

```
=== CASE 14: pyright missing from node_modules, clangd not on PATH
pyright missing -> {"oculus":"state","root":"p","state":"not_found","code":"not_found","program":"pyright"} | processes 0
no spawn loop: state frames after 4 s -> 2 | processes 0
clangd not on PATH -> {"oculus":"state","root":"p","state":"not_found","code":"not_found","program":"clangd"} | processes 0
no spawn loop: state frames after 4 s -> 2
```

Page half, by reading: the item's words are `statusbar.ls_not_found` ('{0}: not found', `config/text/statusbar.yml:82`) and its tooltip names the program (`ls_tip_not_found`); a model whose server is not found is still registered and no request is answered, so the editor itself is unaffected.

Result: state `not_found` with `program` named (`pyright`, `clangd`), 0 processes, and 2 state frames at 4 s, so no loop. pyright's absence was made in a scratch copy of the engine folder.

#### Case 15

Rule (brief): A server that crashes at start, and one that crashes after an hour: restarted once on the next request; a second crash in 3 minutes leaves it failed, its output under Show Language Server Output; Restart starts it again.

Run G1: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/g1-misc.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/g1-misc.out 2>&1`

```
=== CASE 15: a server that crashes: restarted once on the next request; a second crash in 3 minutes leaves it failed
killed pid 91450 -> states ["starting","ready","failed:exited"] processes 0
next request -> {"contents":{"kind":"plaintext","value":"(variable) x: int"},"range":{"start":{"line":0,"character":0},"end":{"line":0,"character":1}}} | new pids [91599] | states ["starting","ready","failed","starting","ready"]
second crash -> {"code":-32800,"message":"the server is not running"} | states ["starting","ready","failed:exited","starting","ready","failed:exited"] | processes 0
Show Language Server Output -> {"lines":16,"tail":["Assuming Python version 3.13.4.final.0","Found 1 source file","the server exited again, so it stays stopped until Restart"]}
Restart -> {"oculus":"state","root":"p","state":"ready"} | processes 1
```

Unit tests: `tests/server/machine/lsp/lifetime.test.ts`, 'is started again on the next request after it exits by itself, and stays failed after a second exit within 3 minutes'; `tests/server/machine/lsp/lifetime.test.ts`, 'is started again after an exit that comes 3 minutes or more after the one before'.

Result: after a kill: states `starting, ready, failed:exited`; the next request starts a new pid and is answered; a second kill leaves `failed:exited` and the request is answered `-32800 the server is not running`; the output holds "the server exited again, so it stays stopped until Restart"; Restart gives `ready` and 1 process. A server that crashes at start takes the same exit path.

#### Case 16

Rule (brief): A server that never answers `initialize` (a stub that reads and says nothing): after 30 s the state is failed with `no_answer`, the process is ended, the page's queued requests are answered with an error and the editor stays responsive.

Run G6: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/g6-16.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/g6-16.out 2>&1`

```
=== CASE 16: a server that never answers initialize: failed no_answer at 30 s, the process ended, queued requests answered with an error, the page stays usable
hover queued during the handshake answered after 29826 ms with {"code":-32800,"message":"the server ended"}
state {"oculus":"state","root":"p","state":"failed","code":"no_answer","program":"pyright"}
stub process alive after the failure: [ false ] | relay pids 0
another channel still answers on the same socket: true
```

Unit tests: `tests/server/machine/lsp/lifetime.test.ts`, 'is ended at 30 s when it answers no initialize, and the page is told no_answer'; `tests/server/machine/lsp/lifetime.test.ts`, 'answers a request that waited on an initialize never answered with an error when it ends'.

Result: the queued hover is answered at 29826 ms with `-32800 the server ended`, state `failed` with `no_answer`, the stub is not alive, 0 relay pids, and a request on another channel of the same sink is answered.

#### Case 17

Rule (brief): A server slow on one request (a stub delaying 10 s): other requests to it and to other servers are answered meanwhile; a request the page cancels gets no late answer applied.

Run G3: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/g3-relay.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/g3-relay.out 2>&1`

```
=== CASE 17: a slow server request: other requests answered meanwhile; a cancelled request gets no late answer
clangd answered while the stub held its hover: 1 ms, result
cancelled request 900 answered at once with {"code":-32800,"message":"cancelled"}
slow request answered after 10005 ms with {"contents":"hover after 10000 ms"}
frames for id 900 in all: 1 (the stub answers it at 10 s: that late answer is not applied)
frames for id 900 after the stub answered it late: 1
```

Result: clangd answered in 1 ms while the stub held its hover; the cancelled request 900 got one frame, the stub's `-32800 cancelled`, and no further frame after the stub's late answer at 10 s; the uncancelled slow request was answered after 10005 ms.

#### Case 18

Rule (brief): A file outside every served root (a file opened from a path that is no root, if the tab allows it) and a file whose root is removed from the workspace while open: no server is started for the first, and the root's server is ended at once for the second.

Run G1: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/g1-misc.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/g1-misc.out 2>&1`

```
=== CASE 18: a file outside every served root; a root removed from the workspace while open
open from an unserved root key -> processes 0 | states 0
a request on it -> {"code":-32602,"message":"the document is not open"}
served root: processes 1
root removed from the workspace -> processes 0 (ended at once)
```

Page half, by reading: a tab with no root or no path is not served (`src/lib/views/sources/source/language/lsp.ts:284`, `src/lib/views/sources/source/language/lsp.ts:324`).

Result: an unserved root key starts 0 processes and sends 0 state frames, the request on it is answered `-32602 the document is not open`, and removing the served root from the workspace leaves 0 processes at once.

#### Case 19

Rule (brief): A root with no compile database and no `.oculus/cpp.yml` (scotoma): clangd runs on its defaults, `compile_database` reads `No compile database`, single-file features work, cross-file references are limited to open files.

Run D: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/d-scotoma.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/d-scotoma.out 2>&1`

```
=== CASE 8: scotoma with no .oculus/cpp.yml (also case 19: no database, no cpp.yml)
no cpp.yml
   compile database in force: null | configurations in list: [] | findings: []
   src/dlg.c: 21 diagnostics, first: "In included file: 'snes.h' file not found\n\n/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/scot-pXevot/src/scotoma.h:18:10:\nnote: error occurred he...
   src/spr.c: 21 diagnostics, first: "In included file: 'snes.h' file not found\n\n/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/scot-pXevot/src/scotoma.h:18:10:\nnote: error occurred he...
   choices.database -> null | databases -> []
```

Run G7: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/g7-nodb.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/g7-nodb.out 2>&1`

```
=== CASE 19: scotoma with no compile database and no .oculus/cpp.yml: references of cellSolid are limited to the open files
compile database in force -> null | databases listed -> []
files that use cellSolid on disk: scotoma.h:40, spr.c:154, main.c:127, region.c:265 (the last two are not open)
references with scotoma.h and spr.c open -> ["scotoma.h:40"]
single-file hover on the declaration -> {"contents":{"kind":"plaintext","value":"function cellSolid\n\n→ int\nParameters:\n- int x\n- int y\n\npublic: int cellSolid(int x, int y)"},"range":{"end":{"character":12,"line":39},"start":{"charact...
```

Page half, by reading: the item reads `statusbar.database_none` ('No compile database', `config/text/statusbar.yml:100`) when no database is in force.

Result: no database in force and none listed; clangd answers diagnostics and hover for the open files; references of `cellSolid` with `scotoma.h` and `spr.c` open give `scotoma.h:40` only, while the function is also used at `main.c:127` and defined at `region.c:265`, which are not open.

#### Case 20

Rule (brief): Two roots, each with Python and C++ files open (the hub and cathedra, ordo and game-engine): four servers, each answering for its own root only; a definition in one root never resolves into another.

Run G1: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/g1-misc.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/g1-misc.out 2>&1`

```
=== CASE 20: two roots with Python and C++ open: four servers, each for its own root only
processes -> 4 (pyright: 2 clangd: 2 )
rb/b.py imports a symbol of ra -> ["Import \"a\" could not be resolved"] (an unresolved import: a definition in one root never resolves into another)
```

Result: 4 processes (2 pyright, 2 clangd) and the import of a file of the other root is unresolved.

#### Case 21

Rule (brief): A huge file: `game-engine/src/engine/tests/src/main.cpp` (158810 bytes) and a Python file of 439320 bytes inside the linfoot venv: served, typing stays responsive (no request is sent per keystroke beyond the debounced ones); a Python file over 2 MiB opens truncated and locked, and no server sees it.

Run G3: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/g3-relay.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/g3-relay.out 2>&1`

```
=== CASE 21: large files served by real servers
158810 byte cpp file: ready and 113 symbols after 444 ms
```

Run G4: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/g4-big.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/g4-big.out 2>&1`

```
=== CASE 21: the 439320 byte Python file of the linfoot venv, and one over 2 MiB
439320 byte Python file: ready and 20 top-level symbols after 516 ms; pyright rss 139 MB
```

Page half, by reading: the only request a keystroke can start is the tab's symbols, after `src/lib/ui/controls/editor/kit/lsp/client.ts:30` of quiet; `didChange` is Monaco's own notification. A file too long to read whole is drawn by the code window with no editor (`src/lib/views/sources/source/save/locked-words.ts:24`, `src/lib/views/sources/source/Source.svelte:187`), so no model is registered and no server sees it.

Result: the 158810-byte C++ file is ready with 113 symbols after 444 ms, the 439320-byte Python file is ready with 20 top-level symbols after 516 ms with pyright at 139 MB. The over-2-MiB file is by reading only.

#### Case 22

Rule (brief): A file renamed while open, inside oculus (Files view rename): `didClose` of the old path and `didOpen` of the new; markers and symbols follow. Renamed outside oculus: the server gets the watched-file events, the tab is marked deleted as now, and its document is closed on the server.

Run G1: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/g1-misc.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/g1-misc.out 2>&1`

```
=== CASE 22: a file renamed while open, inside oculus (Files view rename) and outside
inside oculus: didClose(old) + didOpen(new) -> diagnostics for the new path ["Type \"Literal['s']\" is not assignable to declared type \"int\""] | publishes for the old path (diagnostic count of each): [1]
```

Run G5: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/g5-watch.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/g5-watch.out 2>&1`

```
=== CASE 22: a file renamed outside oculus while open: the server gets watched-file events
what the server received: ["initialize","initialized","textDocument/didOpen","response","workspace/didChangeWatchedFiles [[3,\"other.py\"],[1,\"renamed.py\"],[1,\"fresh.py\"]]"]
```

Page half, by reading: a rename inside oculus changes the tab's path, which makes a new extension function (`src/lib/views/sources/source/language/lsp.ts:279`): the old registration ends (`didClose`, markers removed) and the new one begins (`didOpen`).

Result: inside oculus the new path gets its diagnostics and the old path's publishes are one with 1 diagnostic and no later clearing publish in the run; outside oculus the server received `workspace/didChangeWatchedFiles` with the changes `[[3,"other.py"],[1,"renamed.py"],[1,"fresh.py"]]`. That the tab is marked deleted and the document closed is the watcher's and the tab's, for the landing look.

#### Case 23

Rule (brief): A model whose path or instance id holds upper-case letters, a file `fig(1).py`, a root folder with a space or parentheses, and a file name that is NFD on disk: hover and locations map back to the tab's own model.

Run G2: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/g2-misc.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/g2-misc.out 2>&1`

```
=== CASE 23: names with upper-case letters, parentheses, a space, NFD on disk
Fig(1).py: published under oculus-file:///My%2520Root(1)/Fig(1).py | hover -> "(constant) X: int"
café.py: published under oculus-file:///My%2520Root(1)/cafe%CC%81.py | hover -> "(constant) Y: int"
```

Unit tests: `tests/server/machine/lsp/uris.test.ts`, 'is written with every part percent-encoded and resolves back to the file'; `tests/server/machine/lsp/uris.test.ts`, 'resolves a name written decomposed to the file written composed on disk'.

Page half, by reading: the address is `pageUri(root, path)` of the tab's root and path (`src/lib/ui/controls/editor/kit/lsp/uris.ts:16`); the instance id is not part of it.

Result: `Fig(1).py` under the root `My Root(1)` is published as `oculus-file:///My%2520Root(1)/Fig(1).py` and the file named cafe with an accented e, written decomposed (NFD) on disk, as `.../cafe%CC%81.py`, each hover answered with its own file's hover.

#### Case 24

Rule (brief): A model's language changed from the status bar (python to plaintext, plaintext to python, c to cpp): unregistered and registered again; plaintext gets no server; c to cpp keeps the one clangd of the root.

Unit test: `tests/server/machine/lsp/lifetime.test.ts`, 'is one clangd for a c tab and a cpp tab of one root on one page'.

Page half, by reading: a language change makes a new extension function (`src/lib/views/sources/source/language/lsp.ts:279`); a language no server serves has no extension and the client registers a model only under a served language (`src/lib/ui/controls/editor/kit/lsp/hosts.ts:140`); `c` and `cpp` are two hosts of the one `clangd` entry. Landing look item 12.

Result: the one-clangd half is a test; the status-bar change itself is for the landing look.

#### Case 25

Rule (brief): An empty file and an untitled tab: the empty file is served; the untitled tab, having no root and path, gets no server.

Run G2: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/g2-misc.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/g2-misc.out 2>&1`

```
=== CASE 25: an empty file served; an untitled tab (no root, no path) gets no server
empty file -> {"oculus":"state","root":"p","state":"ready"} | processes 1
```

Page half, by reading: an untitled tab has an empty root or path, for which `lsp.extension` returns no extension (`src/lib/views/sources/source/language/lsp.ts:279`).

Result: the empty file is served (`ready`, 1 process); the untitled tab by reading.

#### Case 26

Rule (brief): A diff side, a merge pane and a peek model of a Python file while pyright runs: nothing reaches the socket for them and no console error.

Page half, by reading: a model reaches the client only through `kit.lsp.register`, whose one caller is the source tab's extension (`src/lib/views/sources/source/language/lsp.ts:288`); the diff and merge editors get no such extension, and a peek model is made by the transport for a read and never registered (`src/lib/ui/controls/editor/kit/lsp/peeks.ts:21`). Case 60's client run shows the peek model dropped when a tab holds the file. Landing look item 4.

Result: checked by reading; the look is the orchestrator's.

#### Case 27

Rule (brief): Two tabs of one Python file: one document on the server; hover from either; a definition in the same file opens in the asking tab.

Client-runtime run (the scratch file `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/cases.client.test.ts.txt` placed under `tests/server/machine/lsp/`, run with `npx vitest run`, and removed):

```
27 didOpen frames: 1
27 definition from the second tab sent as: {"jsonrpc":"2.0","id":20,"method":"textDocument/definition","params":{"textDocument":{"uri":"oculus-file:///proj/app.py"},"position":{"line":0,"character":0}}}
27 the answer names: {"jsonrpc":"2.0","id":20,"result":[{"uri":"inmemory://model/2","range":{"start":{"line":1,"character":0},"end":{"line":1,"character":3}}}]}
```


Result: one `didOpen` for two models, the definition from the second model sent once under the page address, and the answer names `inmemory://model/2`, the asking model.

#### Case 28

Rule (brief): The oculus server restarts with tabs open: the page's clients reconnect with the main socket, register their models again, and the servers start again; no two pyrights for one page and root remain after 65 s. The restarted server mints a new token: the reconnected socket subscribes with the token the page held, which no longer matches, and the page's load, run again on the reconnect (`writes.renewToken`, `state/client/socket.svelte.ts:243-245`), installs the new one, which goes out in a subscribe of no channels (`:167-175`): after that message, the socket's `lsp:` frames are accepted (a hover answered, a `didChange` reaching the server) without a reload of the page and without its channels being subscribed again, and before it they are refused (Decision 30).

Run: `bash /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/run-case28.sh > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/rep/case28.out 2>&1` (a dev server of my own on 8795 with `HOME` under the scratch folder, `h-token.mjs` phases 1 and 2):

```
8795 before:
8790 before:
node    6344 axelfaes   23u  IPv4 0x96b66ab1a9cd4ec      0t0  TCP localhost:8790 (LISTEN)
8795 after start names pid 14360:
node    14360 axelfaes   39u  IPv4 0x34debeea85a042de      0t0  TCP localhost:8795 (LISTEN)
node    6344 axelfaes   23u  IPv4 0x96b66ab1a9cd4ec      0t0  TCP localhost:8790 (LISTEN)
== case 28
phase 1: token held by the page 1940ac..., states starting,ready | pyright pids 16428
phase 1: hover answered true
after the server was stopped, pyright/clangd processes:        0
phase 2: new token b7b43f... differs from the page's 1940ac...: true
phase 2: pyright pids after the restart none
phase 2: socket reconnected with the old token: frames received 0 (lsp frames refused)
phase 2: after a subscribe of no channels carrying the new token: initialize answered true | states starting,ready | hover answered true
phase 2: pyright pids 18338
phase 2: 65 s later, pyright processes: 1 pids 18338
== stopped
node    6344 axelfaes   23u  IPv4 0x96b66ab1a9cd4ec      0t0  TCP localhost:8790 (LISTEN)
pyright/clangd left:        0
DONE
```

Page half, by reading: on reconnect the client registers its models again (`src/lib/ui/controls/editor/kit/lsp/client.ts:266`) and the page's load renews the token, which goes out in a subscribe of no channels.

Result: after the restart the new token differs from the page's, a socket that subscribed with the old token received 0 frames, after the subscribe of no channels carrying the new token the initialize and the hover were answered, and 65 s later 1 pyright ran.

#### Case 29

Rule (brief): A page reload: the old page's servers are taken over by the reloaded page within 60 s; no `didOpen` of an already open document is sent twice.

Run G3: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/g3-relay.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/g3-relay.out 2>&1`

```
=== CASE 29: a page reload: the new page takes the old page servers over within 60 s; no didOpen twice
old page closed 3 s ago: processes 1 pid 96768
reloaded page: state {"oculus":"state","root":"p","state":"ready"} | processes 1 pid 96768 (same pid: taken over, one spawn)
methods the server received, in order: ["initialize","initialized","textDocument/didOpen","textDocument/didClose","textDocument/didOpen"]
didOpen count: 2 | didClose count: 1 (open, close on takeover, open again: never two opens in a row; a repeated didOpen of the open doc is dropped)
```

Result: the same pid after the reload with one spawn; the server received `initialize, initialized, didOpen, didClose, didOpen`, never two opens in a row.

#### Case 30

Rule (brief): The socket and the relay refuse: a `lsp:` message from a socket without the token; a page URI with root `''`, an unknown root key, an absolute path, `..`, `%2F..%2F`, or a symlink out of the root; a `workspace/didChangeWorkspaceFolders` and a second `initialize` from the page. Each is refused or dropped and nothing reaches a server.

Run G3B: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/g3b-30.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/g3b-30.out 2>&1`

```
=== CASE 30: the relay refuses: no token, bad page URIs, didChangeWorkspaceFolders, a second initialize
no token: frames back 0 | processes 0
refused page URIs: ["root empty","unknown root","absolute path","dot dot","encoded slash dot dot","symlink to a file out","symlink to a folder out"] | processes 0 | log exists false
server received before: 3 after didChangeWorkspaceFolders and a second initialize: 3 | answer frames to the second initialize: 0 | processes 1
methods: ["initialize","initialized","textDocument/didOpen"]
```

Unit tests: `tests/server/machine/lsp/uris.test.ts`, 'is refused for %s'; `tests/server/machine/lsp/relay.test.ts`, 'refuses an lsp message from a socket that carried no token, and sends nothing to a server'; `tests/server/machine/lsp/relay.test.ts`, 'reads a frame that is not JSON-RPC and sends nothing of it to a server'.

Result: no token: 0 frames back and 0 processes; the seven refused addresses start 0 processes and write no log; the server received `initialize, initialized, didOpen` before and after the workspace-folders message and the second initialize, and the second initialize was answered by no frame.

#### Case 31

Rule (brief): In flight, after close, superseded: the socket closes while a spawn is in flight (the process is ended once it exists); a peek read resolves after its widget closed (no model made); an answer arrives for a disposed model (dropped); a model registers while its client's socket is closing (a new client takes it).

Client-runtime run:

```
31 (hover) answer after the model was disposed delivered as: {"jsonrpc":"2.0","id":60,"result":null} | frames sent after the unregister: didClose x 1
31 (definition) answer after the model was disposed delivered as: {"jsonrpc":"2.0","id":70,"result":null} | peek reads: 0
31 peek read resolved after the transport ended: model dropped, answers delivered: 2
```

Unit test: `tests/server/machine/lsp/lifetime.test.ts`, 'ends a server that was being started when its page closed'.

Page half, by reading: a model registered while its client's socket is closing is held as an entry and attached by the next connection (`src/lib/ui/controls/editor/kit/lsp/client.ts:205`).

Result: an answer for a disposed model is delivered as `result: null` with no peek read; a peek read that resolves after the transport ended drops its model and the answers are delivered; the in-flight spawn is ended with its page.

#### Case 32

Rule (brief): A server that fails (not found, exits twice, refused, no answer to `initialize`): the relay sends `{ oculus: 'state', root, state: 'failed' or 'not_found', code }` on that language's `lsp:` channel with the code `not_found`, `exited`, `refused` or `no_answer`; the status item's words come from `statusbar.yml`; the page's socket stays open and the page's other channels, `pty:` included, go on receiving.

Run G3: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/g3-relay.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/g3-relay.out 2>&1`

```
=== CASE 32: a failing server: refused, no_answer; the socket and the page other channels go on
server answers initialize with an error -> {"oculus":"state","root":"p","state":"failed","code":"refused","program":"pyright"}
server never answers initialize -> {"oculus":"state","root":"p","state":"failed","code":"no_answer","program":"pyright"} after 30201 ms
the sink stays usable: a frame on another channel is still delivered -> sent
answer to the cpp initialize: true
```

not_found and exited are in the runs of cases 14 and 15 above.

Page half, by reading: the words are `statusbar.ls_failed`, `ls_not_found` and `ls_tip_exited`, `ls_tip_refused`, `ls_tip_no_answer` (`config/text/statusbar.yml:89`).

Result: `refused` and `no_answer` arrive as state `failed` with the program named, `no_answer` after 30201 ms; a frame on another channel of the same sink is still delivered and the cpp initialize is answered.

#### Case 33

Rule (brief): `.oculus/cpp.yml` keys: an empty `name`, two configurations with one name, a `name` equal to a found database's folder (`build/debug`), a `compile_commands` outside the repository or holding no `compile_commands.json`, `fallback_flags` not a list of strings, an unknown key, a file that is not YAML: each is a finding naming the key, and the entry is skipped (G13); the rest of the file is read; the findings are rows at the head of the Select Compile Database list and the item is in its warning tone.

Run F1: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/f1-config.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/f1-config.out 2>&1`

```
=== CASE 33: .oculus/cpp.yml keys that are wrong: each a finding naming the key, the entry skipped, the rest read
picker -> ["[cfg] dup","[cfg] good","build/debug"]
   finding -> {"file":"/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/f1c-5ZfaoF/.oculus/cpp.yml","field":"configurations[0].name","message":"must be text that is not empty"}
   finding -> {"file":"/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/f1c-5ZfaoF/.oculus/cpp.yml","field":"configurations[2].name","message":"repeats a name of this list"}
   finding -> {"file":"/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/f1c-5ZfaoF/.oculus/cpp.yml","field":"configurations[3].name","message":"is the folder of a compile database oculus found"}
   finding -> {"file":"/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/f1c-5ZfaoF/.oculus/cpp.yml","field":"configurations[4].compile_commands","message":"must be a folder of the repository, written relative to it"}
   finding -> {"file":"/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/f1c-5ZfaoF/.oculus/cpp.yml","field":"configurations[5].compile_commands","message":"must hold a compile_commands.json"}
   finding -> {"file":"/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/f1c-5ZfaoF/.oculus/cpp.yml","field":"configurations[6].fallback_flags","message":"must be a list of text"}
   finding -> {"file":"/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/f1c-5ZfaoF/.oculus/cpp.yml","field":"configurations[7].colour","message":"is not a key of a configuration"}
a file that is not YAML -> picker [] findings [{"file":"/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/f1d-miIPhR/.oculus/cpp.yml","field":"","message":"is not YAML, at line 1"}]
```

Unit test: `tests/server/machine/lsp/cpp-file.test.ts`, 'skips an entry with %s and reads the entries after it'.

Page half, by reading: the findings arrive in the `choices` frame; `choiceRows` puts one disabled row per finding, worded by `findingLine`, ahead of the databases (`src/lib/shell/keys/palette-modes.ts:84`), and `ChoiceRows.svelte` draws it with the kind `app.palette.kind_finding` (`src/lib/shell/keys/ChoiceRows.svelte:94`); `LanguageItems.svelte` lists each finding in the item's tooltip (`src/lib/shell/status/LanguageItems.svelte:117`) and draws the item in the amber warning tone while there is one, through `ToolButton`'s `warning` prop (`src/lib/shell/status/LanguageItems.svelte:162`, `src/lib/ui/controls/ToolButton.svelte:236`). Landing look item 12.

Result: seven findings for the seven wrong entries, each naming `configurations[i].<key>`, the entries skipped and `good` and `dup` read; a file that is not YAML gives one finding "is not YAML, at line 1".

#### Case 34

Rule (brief): The choices file unreadable (not JSON): read as no choices, a choice made is refused with the reason (`source.lsp_choices_unread`), the file is left as it was (G31).

Run F1: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/f1-config.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/f1-config.out 2>&1`

```
=== CASE 34: the choices file unreadable (not JSON)
read as no choices -> in force build/debug
a choice made -> {"oculus":"refused","root":"r","code":"choices_unread"}
the file after -> "this is not json {"
```

Unit test: `tests/server/machine/lsp/choices.test.ts`, 'reads a choices file that is not JSON as empty and refuses a write over it, leaving it'.

Result: the database in force is `build/debug`, the choice is answered `refused` with `choices_unread`, and the file still reads `this is not json {`.

#### Case 35

Rule (brief): A code action whose edit names another file, and a clangd tweak whose command answers a `workspace/applyEdit` naming a header: refused with the notice `source.lsp_other_files`; the open file is unchanged.

Client-runtime run:

```
35 reply to the server: {"jsonrpc":"2.0","id":"srv-1","result":{"applied":false}} | notice calls: [["lsp_other_files"]] | apply calls: 0
35 an edit naming the open file and another: {"jsonrpc":"2.0","id":"srv-2","result":{"applied":false}} | apply calls: 0
35 code actions answered to the client: [{"title":"Tweak","command":{"title":"Tweak","command":"clangd.applyTweak","arguments":[]}}]
```

Run E: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/e-extra.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/e-extra.out 2>&1`

```
=== CASE 35: a clangd tweak/code action whose edit names another file: what the relay sends the page
code actions at `add` -> []
```

Result: the tweak's `workspace/applyEdit` is answered `applied: false` with the notice `lsp_other_files` and 0 apply calls, also for an edit naming the open file and another; the code actions the client is given list the tweak; in run E clangd offered no action at the probed position.

#### Case 36

Rule (brief): pyright's `workspace/configuration` before any interpreter is chosen, and after the chosen interpreter is deleted from disk: the found interpreter is answered; the remembered choice is dropped from the list.

Run B: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/b-interp.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/b-interp.out 2>&1`

```
=== CASE 36: a chosen interpreter deleted from the disk is dropped; before a choice the found one is answered
before any choice, pyright was answered -> ["/Users/axelfaes/.pyenv/versions/3.13.4/bin/python3"]
choices -> {"interpreter":"/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/interp2-gROYtB/venv/bin/python","list":["3.13.4 found=venv approved=false path=/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/interp2-gROYtB/venv/bin/python","3.13.4 found=path approved=true path=/Users/axelfaes/.pyenv/versions/3.13.4/bin/python3"]}
after choosing the venv -> {"interpreter":"/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/interp2-gROYtB/venv/bin/python"}
after the venv was deleted -> {"interpreter":"/Users/axelfaes/.pyenv/versions/3.13.4/bin/python3","list":["3.13.4 found=path approved=true path=/Users/axelfaes/.pyenv/versions/3.13.4/bin/python3"]}
pyright answered after the delete + restart -> ["/Users/axelfaes/.pyenv/versions/3.13.4/bin/python3"]
```

Result: before any choice pyright is answered the PATH interpreter; after the chosen venv is deleted the list holds only the PATH interpreter and the answer after a restart is the PATH interpreter.

#### Case 37

Rule (brief): A database link folder whose target was deleted (a `build/debug` removed): the choice falls back to the next found one and the status item says which.

Run F1: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/f1-config.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/f1-config.out 2>&1`

```
=== CASE 37: a database link folder whose target was deleted (build/debug removed)
chosen -> build/debug
after build/debug was removed -> ["build/release"] in force build/release
states -> ["starting","ready","starting","ready","indexing","indexing","ready","starting","ready","indexing","indexing","indexing","indexing","indexing","ready"] processes 1
```

Page half, by reading: the item reads the database in force (`src/lib/shell/status/LanguageItems.svelte:114`).

Result: after `build/debug` was removed the list is `build/release`, in force, with 1 process.

#### Case 38

Rule (brief): clangd's index writes: after the cathedra and game-engine looks, `git status --porcelain` of both repositories is unchanged and nothing new is under `<root>/.cache` (`find <root>/.cache -newer <a stamp file>` prints nothing).

Run C: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/c-cathedra.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/c-cathedra.out 2>&1`

```
=== CASE 38: index writes: git status of both repositories and .cache
git status cathedra unchanged -> true | game-engine unchanged -> true
find /Users/axelfaes/workspace/cathedra/.cache -newer stamp -> (prints nothing)
find /Users/axelfaes/workspace/game-engine/.cache -newer stamp -> (no .cache folder)
lsp folder holds -> 48eeb9ccfe27b386 choices.json
```

Result: `git status --porcelain` of cathedra and game-engine is unchanged, nothing newer sits under cathedra's `.cache`, game-engine has no `.cache` folder, and the lsp folder holds `48eeb9ccfe27b386` and `choices.json`.

#### Case 39

Rule (brief): The base of a relative path in `fallback_flags` (UV-1): `[-xc, -I../tools/pvsneslib/pvsneslib/include]` on scotoma's `src/dlg.c` resolves against the repository root to a folder outside it, and `snes.h` is not found (21 diagnostics); `[-xc, -I/<absolute>/scotoma/tools/pvsneslib/pvsneslib/include]` is passed unchanged, 0 diagnostics; `-I tools/pvsneslib/pvsneslib/include` (the path as its own argument) resolves as the joined form does.

Run D: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/d-scotoma.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/d-scotoma.out 2>&1`

```
=== CASE 39: the base of a relative path in fallback_flags
-I../tools/pvsneslib/pvsneslib/include (resolves against the repository root, to a folder outside it)
   fallback_flags: [-xc, -I../tools/pvsneslib/pvsneslib/include]
   dlg.c: 21 diagnostics, first: "In included file: 'snes.h' file not found\n\n/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/scot-SEZVqX/src/scotoma.h:18:10:\nnote: error occurred he...
absolute -I<root>/tools/pvsneslib/pvsneslib/include
   fallback_flags: [-xc, -I<root>/tools/pvsneslib/pvsneslib/include]
   dlg.c: 0 diagnostics
-I tools/pvsneslib/pvsneslib/include (the path as its own argument)
   fallback_flags: [-xc, -I, tools/pvsneslib/pvsneslib/include]
   dlg.c: 0 diagnostics
```

Unit tests: `tests/server/machine/lsp/cpp-file.test.ts`, 'resolve a relative include path against the repository, joined or as its own argument'; `tests/server/machine/lsp/cpp-file.test.ts`, 'keep an absolute path and every other flag as written'.

Result: 21 diagnostics with `-I../tools/...`, 0 with the absolute path and 0 with `-I tools/...` as two arguments.

#### Case 40

Rule (brief): A C repository's header (I2): scotoma's `src/scotoma.h` (a `cpp` tab) and `src/dlg.c` (a `c` tab) open on one page: one clangd for scotoma (`ps`), serving both; with `fallback_flags: [-Itools/pvsneslib/pvsneslib/include]` the header gets "redeclaration of C++ built-in type 'bool'", with `-std=c99` added "Invalid argument '-std=c99' not allowed with 'Objective-C++'", and with `-xc` added 0 diagnostics; the header's markers are under `lsp-cpp` and `dlg.c`'s under `lsp-c`, and closing `dlg.c` leaves the header's markers.

Run D: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/d-scotoma.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/d-scotoma.out 2>&1`

```
=== CASE 40: a C repository header: scotoma.h as a cpp tab and dlg.c as a c tab on one page
-Itools/... only: fallback_flags [-Itools/pvsneslib/pvsneslib/include]
   processes: 1 (clangd for scotoma)
   scotoma.h: 1 diagnostics, first: "In included file: redeclaration of C++ built-in type 'bool'\n\n/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/scot-fILuBM/tools/pvsneslib/pvsneslib/i...
   dlg.c: 0 diagnostics
with -std=c99 added: fallback_flags [-std=c99, -Itools/pvsneslib/pvsneslib/include]
   processes: 1 (clangd for scotoma)
   scotoma.h: 1 diagnostics, first: "Invalid argument '-std=c99' not allowed with 'Objective-C++'"
   dlg.c: 0 diagnostics
with -xc added: fallback_flags [-xc, -std=c99, -Itools/pvsneslib/pvsneslib/include]
   processes: 1 (clangd for scotoma)
   scotoma.h: 0 diagnostics
   dlg.c: 0 diagnostics
```

Page half, by reading: each language has its own host and marker owner (`src/lib/ui/controls/editor/kit/lsp/markers.ts:11`, `src/lib/ui/controls/editor/kit/lsp/hosts.ts:156`), and `#unmark` clears the markers of the one model that went (`src/lib/ui/controls/editor/kit/lsp/client.ts:220`). Landing look item 12.

Result: 1 clangd process for both tabs; the header gets the `bool` redeclaration with `-I`, the `-std=c99` message with `-std=c99` added and 0 diagnostics with `-xc` added; `dlg.c` gets 0 in each; the marker owners are the page's.

#### Case 41

Rule (brief): The last tab of a root and language closed while the page stays open (Z482): the hub's last Python tab closed: its pyright still running 50 s later and ended at 65 s (`ps`); the page's other servers running.

Run: scenario `last-tab` of `run-counts3.sh`:

```
== scenario last-tab
t+  0s  before any page: 0 process(es)
            (lsof 8790 and 8795 are noted by the caller)
t+  1s  page A open with a Python tab: 1 process(es)
t+  1s  last Python tab closed, page stays open
t+ 51s  50 s after the tab closed: 1 process(es)
t+ 66s  65 s after the tab closed: 0 process(es)
```

Unit test: `tests/server/machine/lsp/lifetime.test.ts`, 'ends 60 s after the last tab of its root and language closed, and not at 59.999 s'.

Result: 1 process 50 s after the tab closed and 0 at 65 s.

#### Case 42

Rule (brief): The same, with a Python tab of the hub opened again at 30 s: the same pyright pid at 65 s and at 120 s, no second `initialize` reaches it, and the reopened document gets one `didOpen`.

Run: scenario `reopen-30`:

```
== scenario reopen-30
t+  0s  before any page: 0 process(es)
            (lsof 8790 and 8795 are noted by the caller)
t+  1s  page A open with a Python tab: 1 process(es)
t+  1s  tab closed
t+ 31s  tab opened again at 30 s
t+ 66s  65 s after the first close: 1 process(es)
t+121s  120 s after the first close: 1 process(es)
            same pid at 65 s: true, at 120 s: true
t+186s  65 s after the second close: 0 process(es)
```

Unit test: `tests/server/machine/lsp/lifetime.test.ts`, 'is kept by a tab reopened at 30 s, and ends 60 s after the next close'.

Result: the same pid at 65 s and at 120 s, and 0 processes 65 s after the second close.

#### Case 43

Rule (brief): The same, with the tab opened again at 70 s: a new pyright pid and a new `initialize`.

Run: scenario `reopen-70`:

```
== scenario reopen-70
t+  0s  before any page: 0 process(es)
            (lsof 8790 and 8795 are noted by the caller)
t+  1s  page A open with a Python tab: 1 process(es)
t+  1s  tab closed
t+ 71s  70 s after the close: 0 process(es)
t+ 71s  tab opened again at 70 s
t+ 86s  15 s after the reopen: 1 process(es)
            a new pid: true; initialize states seen by the page: starting,ready,starting,ready
```

Unit test: `tests/server/machine/lsp/lifetime.test.ts`, 'is started again by a tab reopened at 70 s, the first having ended at 60 s'.

Result: 0 processes at 70 s, a new pid after the reopen, and the page saw `starting,ready,starting,ready`.

#### Case 44

Rule (brief): A file over a lowered `editor.paint_limit_kb` (I4): `editor.paint_limit_kb: 1` and a 5 KB Python file: it opens as plaintext, no server sees it, and the three language items are not drawn.

Page half, by reading: the editor opens the text under `options.shown`, plaintext past the paint limit; the tab hands the status items, the actions and the extension that shown language (`src/lib/views/sources/source/Source.svelte:335`, `src/lib/views/sources/source/Source.svelte:306`, `src/lib/views/sources/source/language/tab-language.svelte.ts:47`); the client registers a model only under a served language (`src/lib/ui/controls/editor/kit/lsp/hosts.ts:140`) and `served` is null for plaintext, so `LanguageItems.svelte` draws nothing (`src/lib/shell/status/LanguageItems.svelte:129`). Landing look item 7 with `editor.paint_limit_kb: 1`.

Result: checked by reading; the look is the orchestrator's.

#### Case 45

Rule (brief): The `lsp` key (I5): changed while servers run: every server is ended and started again on its next document under the new folder, and the old folder is left as it was; a value naming a file, or a folder that cannot be written: clangd of each root fails with `lsp_folder` and nothing is written into a repository, pyright serves on, and a choice made is refused with `source.lsp_choices_write`; a value that is not a non-empty string: a finding naming `lsp`, and the default is used (G13).

Run F4: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/f4-keys.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/f4-keys.out 2>&1`

```
=== CASE 45: the lsp key: changed while servers run; a file; a folder that cannot be written
lsp = <base>/one: processes [85750] | one/ holds ["32165e23886c081c"]
lsp changed to <base>/two and reload(): processes [85771] | two/ holds ["32165e23886c081c"] | one/ left as it was ["32165e23886c081c"]
lsp names a file -> {"oculus":"state","root":"r","state":"failed","code":"lsp_folder","program":"clangd"} | repo holds ["a.py","build","main.cpp"]
pyright serves on -> ["Type \"Literal['s']\" is not assignable to declared type \"int\""]
a choice made -> {"oculus":"refused","root":"r","code":"choices_write"}
```

Run F6: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/f6-readonly.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/f6-readonly.out 2>&1`

```
=== CASE 45: the lsp key naming a folder that cannot be written
lsp = <base>/one: processes [89106] | one/ holds ["9e386a71162a54d2"]
lsp changed to <base>/two and reload(): processes [89124] | two/ holds ["9e386a71162a54d2"] | one/ left as it was ["9e386a71162a54d2"]
lsp names a folder that cannot be written -> {"oculus":"state","root":"r","state":"failed","code":"lsp_folder","program":"clangd"} | repo holds ["a.py","build","main.cpp"]
pyright serves on -> ["Type \"Literal['s']\" is not assignable to declared type \"int\""]
a choice made -> {"oculus":"refused","root":"r","code":"choices_write"}
```

Unit test: `tests/data/sources/config/local.test.ts`, 'answers %j with the sentence it would throw' (row `['lsp: 3', 'local.yml: lsp must be a path']`).

Result: with an open document the server's pid changes within 5 s of the key change (`reload()`) and the new folder is filled while the old is left as it was; a file or an unwritable folder gives state `failed` with `lsp_folder` for clangd, the repository holds `a.py, build, main.cpp` as before, pyright serves on, and a choice is answered `refused` with `choices_write`. The brief says the servers are "started again on their next document": with a document open the new process is up at once, as built. Ruling needed: at once with the open documents (as built) or on the next document opened.

Ruling: ______

#### Case 46

Rule (brief): Root keys and the lsp folder (I6): a root key `a/../b` and one holding `/` in a hand-edited `~/.oculus/workspaces.json`: the lsp folder of each root is `<lsp>/<16 hex digits>/` from its real path, never a path made from the key; a key reassigned to another folder gets another folder; one folder served under two keys shares one folder and one index.

Run F4: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/f4-keys.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/f4-keys.out 2>&1`

```
=== CASE 46: root keys and the lsp folder: the folder is <lsp>/<16 hex> from the real path
keys a/../b and x/y: lsp folder holds ["04dae5b2b0452420","ac2ea7fd281aecc7"] | expected ["04dae5b2b0452420","ac2ea7fd281aecc7"]
one folder served under two keys: processes 1 | lsp folder holds ["04dae5b2b0452420"]
```

Run F5: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/f5-reassign.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/f5-reassign.out 2>&1`

```
=== CASE 46: a key reassigned to another folder gets another lsp folder, and the first is left
key k -> folder A: lsp holds ["19ef2ec0fe13090c"] | hex(A) 19ef2ec0fe13090c
key k -> folder B: lsp holds ["19ef2ec0fe13090c","5d50ecb63c91966a"] | hex(A), hex(B) ["19ef2ec0fe13090c","5d50ecb63c91966a"]
```

Unit tests: `tests/server/machine/lsp/uris.test.ts`, 'is written with the key percent-encoded twice and resolves to the root of that key'; `tests/server/machine/lsp/uris.test.ts`, 'does not name the root through the key written once, as a part of the path'.

Result: the folders under the lsp folder are the 16-hex prefixes of the SHA-256 of the real paths and equal the expected ones; one folder under two keys is 1 process and 1 folder; a key reassigned to folder B adds a second folder and leaves the first. A root key holding `/` cannot be written as one path segment of `oculus-file:///<root key>/<path>` (one encoding gives `x%2Fy`, which the editor's URI type decodes to two segments), so the root key is percent-encoded twice. Ruling needed on that address form.

Ruling: ______

#### Case 47

Rule (brief): Overlapping roots and a large root (I7): `~/workspace` added as a root beside `cathedra`, a cathedra file opened from each root key: one document, one clangd (cathedra's, the innermost root), and no server over `~/workspace` for it; a Python tab of the served root `claude` (`~/.claude`): one pyright over 186 source files (the probe above: peak 320.0 MB, 41.3 MB at 60 s).

Run G4: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/g4-big.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/g4-big.out 2>&1`

```
=== CASE 47: overlapping roots: ~/workspace beside cathedra, one cathedra file from each key
relay processes 1 | clangd processes of this run: 1
   99882 /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/clangd --header-insertion=never --background-index --compile-commands-dir=<lsp folder>
symbols under each key: 1 1
after the tab under the workspace key closes, the other key still answers: 1 symbols

=== CASE 47: a Python tab of the served root claude (~/.claude): one pyright, its memory
pyright processes 1 | log lines naming source files: ["Found 186 source files"]
peak rss 551 MB, rss at 60 s 50 MB
```

Run G4B: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/g4b-47.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/g4b-47.out 2>&1`

```
=== CASE 47: overlapping roots: ~/workspace beside cathedra, one cathedra file from each key
relay processes 1 | clangd processes of this run: 1
   5328 /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/clangd --header-insertion=never --background-index --compile-commands-dir=<lsp folder>
symbols under each key: 1 1
after the tab under the workspace key closes, the other key still answers: 1 symbols
```

Unit tests: `tests/server/machine/lsp/overlap.test.ts`, 'is one process with one document, and a request under either key reaches the server'; `tests/server/machine/lsp/overlap.test.ts`, 'sends a published diagnostic under both addresses'; `tests/server/machine/lsp/overlap.test.ts`, 'is edited by the address it was opened under only, and closes with the last address'.

Result: 1 clangd for a cathedra file opened under both keys, 1 symbol under each key, and the other key answers after one key's tab closed. The claude root has 1 pyright and "Found 186 source files"; its peak resident size was 551 MB and its size at 60 s was 50 MB, where the brief states 320.0 MB and 41.3 MB. The size at 60 s is near the brief's; the peak is not, and I have no measurement that explains the difference (the brief's probe, its run conditions and which size it read are not stated). Ruling needed: whether a 551 MB peak is acceptable.

Ruling: ______

#### Case 48

Rule (brief): The interpreter and node pyright runs (I8, I9): the PATH `python3` is the pyenv shim, and pyright is answered the shim's `sys.executable`; a `.venv/bin/python` symlink is answered by its own path; with a PATH whose first `node` is another version, pyright still runs under `process.execPath` (`ps -o command=` of the pyright process names it).

Run B: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/b-interp.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/b-interp.out 2>&1`

```
=== CASE 48: the PATH python3 is the pyenv shim, pyright is answered the shim sys.executable
which python3 -> /Users/axelfaes/.pyenv/shims/python3
python3 -c sys.executable -> /Users/axelfaes/.pyenv/versions/3.13.4/bin/python3
choices (.venv made, restarted) -> {"interpreter":"/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/interp-pxL2L8/.venv/bin/python","list":["3.13.4 found=venv approved=false path=/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/interp-pxL2L8/.venv/bin/python","3.13.4 found=path approved=true path=/Users/axelfaes/.pyenv/versions/3.13.4/bin/python3"]}
pyright answered after the restart -> ["/Users/axelfaes/.pyenv/versions/3.13.4/bin/python3"] (must be the PATH interpreter while .venv is not approved)
choices (approved) -> {"interpreter":"/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/interp-pxL2L8/.venv/bin/python","list":["3.13.4 found=venv approved=true path=/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/interp-pxL2L8/.venv/bin/python","3.13.4 found=path approved=true path=/Users/axelfaes/.pyenv/versions/3.13.4/bin/python3"]}
pyright answered after Approve -> ["/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/interp-pxL2L8/.venv/bin/python"]
.venv/bin/python is a symlink to /Users/axelfaes/.pyenv/versions/3.13.4/bin/python3.13
ps of pyright -> 69457 /Users/axelfaes/.nvm/versions/node/v24.21.0/bin/node /Users/axelfaes/workspace/research-hub/.agents/worktrees/D23/tools/oculus/node_modules/pyri
process.execPath -> /Users/axelfaes/.nvm/versions/node/v24.21.0/bin/node
choose /Users/axelfaes/.pyenv/versions/3.13.4/bin/python3 -> in force /Users/axelfaes/.pyenv/versions/3.13.4/bin/python3
a reloaded page -> /Users/axelfaes/.pyenv/versions/3.13.4/bin/python3
a restarted server (new relay over the same lsp folder) -> /Users/axelfaes/.pyenv/versions/3.13.4/bin/python3
```

Run B2: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/b2-node.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/b2-node.out 2>&1`

```
=== CASE 48: with a PATH whose first node is another version, pyright runs under process.execPath
PATH first node -> /tmp/othernode/node v23.11.0
process.execPath -> /Users/axelfaes/.nvm/versions/node/v24.21.0/bin/node v24.21.0
ps -o command= of the pyright process -> /Users/axelfaes/.nvm/versions/node/v24.21.0/bin/node /Users/axelfaes/workspace/research-hub/.agents/worktrees/D23/tools/oculus/node_modules/pyright/langserver.index.js --
```

Unit test: `tests/server/machine/lsp/servers.test.ts`, 'starts each server and the interpreter probe with an argument array, the root path one argument whatever it holds'.

Result: the shim answers `/Users/axelfaes/.pyenv/versions/3.13.4/bin/python3` and pyright is answered it; the venv's `bin/python` (a symlink to `python3.13`) is answered by its own path after Approve; with node v23.11.0 first on PATH pyright ran under `process.execPath`, v24.21.0.

#### Case 49

Rule (brief): A Python-language file that is not `.py` or `.pyi` (I10): a `.gyp`, an `.ipython` and a `.python` file are served (the probe above: each answered its type error).

Run G2: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/g2-misc.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/g2-misc.out 2>&1`

```
=== CASE 49: Python-language files that are not .py or .pyi
x.gyp -> ["Type \"Literal['s']\" is not assignable to declared type \"int\""]
x.ipython -> ["Type \"Literal['s']\" is not assignable to declared type \"int\""]
x.python -> ["Type \"Literal['s']\" is not assignable to declared type \"int\""]
```

Result: `x.gyp`, `x.ipython` and `x.python` each answered the type error.

#### Case 50

Rule (brief): A file whose mode changes while open (I11): `chmod a-w` on a file open in a writable tab: the tab shows the read-only Monaco editor with `source.readonly` above it, the model stays registered (one `didOpen` in all), hover and the Outline keep working; `chmod u+w`: editable again, still one `didOpen`.

Page half, by reading: a file this machine's mode locks is drawn by the editor, read-only (`src/lib/views/sources/source/save/locked-words.ts:19`, `src/lib/views/sources/source/Source.svelte:187`); only a file read in part is drawn by the code window (`window: true`, no editor). The editor's `readOnly` option follows `writable` (`src/lib/ui/controls/editor/Editor.svelte:196`), and the language extension depends on language, root, path and version only, so the registration is not made again. `source.readonly` is `config/text/views/sources/source.yml:48`. Landing look item 1 with a `chmod`.

Result: checked by reading; the look is the orchestrator's.

#### Case 51

Rule (brief): Diagnostics hand-off (premise 4): with pyright and clangd tabs open, `monaco.editor.getModelMarkers({ owner: 'lsp' })` is empty, each model's markers are under its language's owner, and their count equals the diagnostics the server sent for that file.

Page half, by reading: markers are set only under `markerOwner(language)` (`lsp-python`, `lsp-c`, `lsp-cpp`, `src/lib/ui/controls/editor/kit/lsp/markers.ts:11`) by `#mark` (`src/lib/ui/controls/editor/kit/lsp/client.ts:248`); `MARKERS` below is the output of `grep -rn setModelMarkers src`:

```
$ grep -rn setModelMarkers src
src/lib/ui/controls/editor/kit/latex/latex-widget.ts:208:        monaco.editor.setModelMarkers(
src/lib/ui/controls/editor/kit/latex/latex-widget.ts:231:            monaco.editor.setModelMarkers(model, OWNER, []);
src/lib/ui/controls/editor/kit/lsp/client.ts:409:        monaco.editor.setModelMarkers(
src/lib/ui/controls/editor/kit/lsp/client.ts:420:            monaco.editor.setModelMarkers(entry.model, markerOwner(this.language), []);
```


Result: checked by reading; the look is the orchestrator's.

#### Case 52

Rule (brief): Semantic colours (OI-6): in `cathedra/src/monastery/src/mirrors.cpp`, Developer: Inspect Tokens on a parameter shows the semantic type `parameter` and the foreground the theme gives `variable.parameter`, a macro the colour of `entity.name.function.preprocessor`, and a `concept` or bracket token keeps Shiki's colour; with `code_theme` set to a Shiki theme id the same tokens take that theme's colours of those scopes. After the index ends, the open tab's semantic colours update without an edit (the refresh reaches the provider).

Run E: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/e-extra.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/e-extra.out 2>&1`

```
=== CASE 52: the legend the relay sends the page
legend frame -> {"oculus":"legend","root":"p","types":25,"modifiers":18,"firstTypes":["variable","variable","parameter","function","method","function","property","variable"]}
```

Run C: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/c-cathedra.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/c-cathedra.out 2>&1`

```
=== CASE 52: semantic tokens legend and tokens from clangd
semanticTokensProvider -> undefined
semantic tokens -> {"n":17600,"first":[23,10,9,15,131073,2,0,5,15,131072]} 
```

Page half, by reading: the relay's own `initialize` answer carries no `semanticTokensProvider` (`src/lib/server/machine/lsp/relay.ts:395`), so the line `semanticTokensProvider -> undefined` of run C reads that answer; the server's legend reaches the page as the `legend` frame (`legendOf` of `held.ts`). The macro scope is `entity.name.function.preprocessor`, the concept and bracket types keep Shiki's colour, and the page turns the legend into the theme's rules (`src/lib/ui/controls/editor/kit/theme/semantic.ts:53`), and `workspace/semanticTokens/refresh` reaches the provider (`src/lib/ui/controls/editor/kit/lsp/client.ts:344`). Landing look item 8.

Result: the relay sends a legend of 25 types and 18 modifiers, and clangd answers 17600 integers of semantic tokens for `mirrors.cpp`. The colours (a parameter's foreground, a macro's, a concept's, the change with `code_theme`, the update after the index) are for the landing look.

#### Case 53

Rule (brief): The References view: Shift+Alt+F12 on a function of `mirrors.cpp` lists its uses grouped by file; F4 and Shift+F4 walk them; Clear shows "No results. Try running a previous search again:" with the search; a press on the history row runs it again; Dismiss takes one row out; Copy All copies every location; a reload of the page draws the same result.

Page half, by reading: the view is the fourth Explorer view, `order: 3`, reached by `s4` (`src/lib/views/sources/search/References.svelte:10`); the cleared words are `references.empty_history` (`config/text/views/sources/search.yml:17`); F4 and Shift+F4 are `oculus.lsp.next` and `oculus.lsp.previous` (`src/lib/views/sources/source/language/lsp.ts:400`); a row's menu offers Copy, Copy Path and Dismiss and the count line Copy All (head comment of `References.svelte`); the result is the instance's state saved with the layout (`references.svelte.ts`). Landing look items 5 and 8.

Result: checked by reading; the look is the orchestrator's.

#### Case 54

Rule (brief): The AST view: Show AST on a call expression in `mirrors.cpp` opens the Files view's AST section with the node tree; a press on a node selects its range in the tab; Show AST on a blank line says "No AST node at selection"; Close hides the section.

Run E: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/e-extra.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/e-extra.out 2>&1`

```
=== CASE 54: Show AST on a blank line and on a call
blank line 7 -> undefined (null result: the page words it "No AST node at selection")
call `add` -> {"role":"expression","kind":"DeclRef","detail":"add","range":{"end":{"character":15,"line":3},"start":{"character":12,"line":3}}}
```

Run C: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/c-cathedra.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/c-cathedra.out 2>&1`

```
=== CASE 54: Show AST on a call expression / blank line
textDocument/ast (call) -> {"arcana":"CallExpr 0x150f2b948 </Users/axelfaes/workspace/cathedra/src/monastery/src/mirrors.cpp:448:34, col:142> 'rite::Value' adl","children":[{"arcana":"ImplicitCastExpr 0x150f2b930 </Users/axelfaes/workspace/cathedra/src/monastery/src/mirrors.cpp:448:34> 'rite::Value (*)(WorldImpl &, rite::RuntimeHost &, rite::Value, const rite::Value *, rite::u32, const char *, const rite::ObjVector *, const...
textDocument/ast (blank line 7) -> undefined
```

Page half, by reading: the answer goes to the Files view's AST section (`src/lib/views/sources/files/sections/clangd/Ast.svelte`); a press calls the tab's `select(range)` (`src/lib/views/sources/source/language/lsp.ts:75`); a null answer sets `files.ast_none`. Landing look item 8.

Result: a call expression answers a node (`CallExpr` with children in `mirrors.cpp`, `DeclRef add` in the stand-in file) and a blank line answers no node, which the page words as the empty-AST sentence.

#### Case 55

Rule (brief): The memory-usage view: Show Memory Usage on a C++ tab draws the tree with MB totals, files collapsed; Refresh asks again; Close hides the section; on a Python tab the action is not offered.

Run E: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/e-extra.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/e-extra.out 2>&1`

```
=== CASE 55: memory usage through the page document
$/memoryUsage with the document -> {"keys":["_self","_total","clangd_server"],"_total":17730360,"children":1}
```

Run C: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/c-cathedra.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/c-cathedra.out 2>&1`

```
=== CASE 55: memory usage
$/memoryUsage -> {"keys":[]} {"code":-32601,"message":"$/memoryUsage names no document"}
```

Page half, by reading: the action is offered only for clangd languages (`src/lib/views/sources/source/language/lsp.ts:391`); the section is `MemoryUsage.svelte`. Landing look item 8.

Result: with a document the relay answers the memory tree (`_self`, `_total` 17730360, `clangd_server`); the run of C without a document is answered `-32601 $/memoryUsage names no document`, as the relay words it.

#### Case 56

Rule (brief): Show Language Server Output on a failed clangd (PATH without clangd) and on a running pyright: a tab `Output: clangd (scotoma)` says the program was not found; pyright's tab lists its log and grows as lines arrive; closing the tab sends `output_off`.

Run G2: `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/g2-misc.mjs > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/out/g2-misc.out 2>&1`

```
=== CASE 56: Show Language Server Output: a missing clangd and a running pyright
clangd (not found) output -> ["clangd: not_found"]
pyright output -> {"append":false,"lines":["Pyright language server 1.1.414 starting","Server root directory: file:///Users/axelfaes/workspace/research-hub/.agents/worktrees/D23/tools/oculus/node_modules/pyright/dist","Starting service instance \"g56-UgLuxy\""]}
output frames after a change -> 9 | last append: true lines 1
after output_off, output frames sent -> 0
```

Page half, by reading: the tab's label is `output.tab` ('Output: {0} ({1})', `config/text/views/system/machine/output.yml:5`); closing the tab sends `output_off` (`src/lib/state/system/machine/lsp/lsp.svelte.ts:264`).

Result: clangd's output holds `clangd: not_found`; pyright's holds its log lines, a change appends one line (`append: true`), and after `output_off` no output frame was sent.

#### Case 57

Rule (brief): The token gate moved into the socket (W5): a terminal's input from a socket that carried no token is refused as now, and an `lsp:` message from the same socket is refused; both from a socket that carried the token are accepted. A socket that subscribed with no token and then sent a subscribe of no channels carrying the token has both accepted from then on; one whose such message carries a wrong token keeps both refused.

Unit tests: `tests/server/machine/lsp/relay.test.ts`, 'refuses an lsp message from a socket that carried no token, and sends nothing to a server'; `tests/server/machine/lsp/relay.test.ts`, 'admits a socket whose subscribe of no channels carries the token'; `tests/server/machine/lsp/relay.test.ts`, 'keeps refusing a socket whose subscribe of no channels carries a wrong token'; `tests/server/machine/pty/channel.test.ts`, 'refuses input from a socket that carried no token'. Their run is in part 5.

Run, case 28's output above: after the restart a socket with the old token received 0 frames, and after the subscribe of no channels with the new token the initialize and the hover were answered.

Page half, by reading: the gate is `carriesToken(subscription.token, ...)` then `writable.add(sink)` (`src/lib/server/root/socket.ts:137`).

Result: refused without the token, accepted with it, re-admitted by a subscribe of no channels carrying it, and a wrong token stays refused.

#### Case 58

Rule (brief): Two peek models whose paths differ only by case (F3): `translateBack` looks a URI up lower-cased (`index.js:2950-2962`), so `src/A.py` and `src/a.py` on a case-sensitive volume each keep their own model, and a definition answer for one never lands in the other's model; a lookup that finds no model is answered as no location, never a throw into the page.

Client-runtime run:

```
58 the answer names: ["oculus-file:///proj/src/A.py","oculus-file:///proj/src/a.py?spelling=1"] | peek calls (page, spelling): [["oculus-file:///proj/src/A.py",0],["oculus-file:///proj/src/a.py",0],["oculus-file:///proj/src/a.py",1]]
58 no model for the location, the answer is: {"jsonrpc":"2.0","id":41,"result":[]}
```


Result: two answers each with its own address (`src/A.py` and `src/a.py?spelling=1`), peek reads made for both spellings, and `result: []` when no model exists.

#### Case 59

Rule (brief): A model unregistered, or its client or server ended (F12): every `lsp-<language>` marker of that model is removed in the same turn, and the transport drops what it would send after its port closed, with no error in the page.

Client-runtime run:

```
59 after the transport closed: frames sent 0 | closed true
```

Page half, by reading: `#unregister` unmarks the model before anything else (`src/lib/ui/controls/editor/kit/lsp/client.ts:214`) and a disconnect unmarks every entry.

Result: after the transport closed no frame was sent and the transport reported closed.

#### Case 60

Rule (brief): A peek model of a file, then a tab opening that file (first check, case 19): the tab's model is the one the client answers for from then on, the peek model is disposed, and no request is answered twice.

Client-runtime run:

```
60 first answer names: "oculus-file:///proj/lib.py" | drops so far: 0
60 after the tab registered: drops 1 dropped the peek model: true
60 second answer names: "inmemory://model/2" | peek reads in all: 1
```


Result: the first answer names the peek address `oculus-file:///proj/lib.py`, the tab's registration then dropped the peek model (`drops 1`), and the second answer names `inmemory://model/2` with 1 peek read in all.

### The case scripts, whole

Each script is run as `cd /tmp && node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases/<name>.mjs`; `case-lib.mjs` and `stub-server.mjs` are the helpers the others import.

#### `a-python.mjs`

```js
import { readFileSync, writeFileSync, mkdirSync, symlinkSync, existsSync, statSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { makeRelay, Page, pageUri, heading, show, sleep, scratch, writeTree } from './case-lib.mjs';

const HUB = '/Users/axelfaes/workspace/research-hub';
const CH = 'lsp:python';

// ---- cases 1 and 2: the hub's tools/present/build.py
{
    const { relay } = makeRelay({ roots: [{ key: 'hub', dir: HUB }] });
    const page = new Page(relay);
    const file = 'tools/present/build.py';
    const text = readFileSync(join(HUB, file), 'utf8');
    const uri = pageUri('hub', file);
    await page.initialize(CH);
    page.open(CH, uri, 'python', text);
    await page.ready(CH);
    console.log('states', show(page.states(CH).map((f) => f.payload.state)));
    const pos = { textDocument: { uri }, position: { line: 23, character: 24 } };
    heading(1, 'hover and F12 on `catalog` at tools/present/build.py:24:25');
    let t0 = Date.now();
    let hover;
    for (let i = 0; i < 30; i += 1) {
        hover = await page.request(CH, 'textDocument/hover', pos);
        if (hover.result) break;
        await sleep(1000);
    }
    console.log('hover ->', show(hover.result ?? hover.error, 400), `(${Date.now() - t0} ms)`);
    const def = await page.request(CH, 'textDocument/definition', pos);
    console.log('definition ->', show(def.result ?? def.error));
    heading(2, 'references of `catalog` across the root');
    const refs = await page.request(CH, 'textDocument/references', { ...pos, context: { includeDeclaration: true } });
    const list = refs.result ?? [];
    const files = [...new Set(list.map((l) => l.uri))];
    console.log(`references -> ${list.length} locations in ${files.length} files`);
    for (const f of files) console.log('   ', f, list.filter((l) => l.uri === f).length);
    page.close();
    await relay.close();
}

// ---- cases 3, 4: diagnostics
{
    const dir = scratch('pyc-');
    writeTree(dir, {
        'lib.py': 'def f() -> str:\n    return "a"\n',
        'main.py': 'from lib import f\n\nx: int = f()\n',
        'solo.py': 'def g() -> int:\n    return 1\n'
    });
    const { relay } = makeRelay({ roots: [{ key: 'proj', dir }] });
    const page = new Page(relay);
    await page.initialize(CH);
    const solo = pageUri('proj', 'solo.py');
    const main = pageUri('proj', 'main.py');
    const lib = pageUri('proj', 'lib.py');
    page.open(CH, solo, 'python', readFileSync(join(dir, 'solo.py'), 'utf8'));
    await page.ready(CH);
    heading(3, 'a type error marked within 2 s of typing it, gone when fixed');
    let t0 = Date.now();
    page.notify(CH, 'textDocument/didChange', { textDocument: { uri: solo, version: 2 }, contentChanges: [{ text: 'def g() -> int:\n    return "x"\n' }] });
    const bad = await page.diagnostics(CH, solo, (d) => d.length > 0, 10000);
    console.log(`error marked after ${Date.now() - t0} ms ->`, show(bad.payload.params.diagnostics.map((d) => d.message)));
    t0 = Date.now();
    page.notify(CH, 'textDocument/didChange', { textDocument: { uri: solo, version: 3 }, contentChanges: [{ text: 'def g() -> int:\n    return 2\n' }] });
    const cleared = await page.until((f) => f.payload.method === 'textDocument/publishDiagnostics' && f.payload.params.uri === solo && f.payload.params.diagnostics.length === 0 && f.payload.params.version === 3 || (f.payload.params?.uri === solo && f.payload.params.diagnostics.length === 0 && page.frames.indexOf(f) > page.frames.indexOf(bad)), 'cleared', 10000);
    console.log(`marker gone after ${Date.now() - t0} ms ->`, show(cleared.payload.params.diagnostics));

    heading(4, 'lib.py changed in another tab and on disk: main.py follows both');
    page.open(CH, main, 'python', readFileSync(join(dir, 'main.py'), 'utf8'));
    const first = await page.diagnostics(CH, main, (d) => d.length > 0, 30000);
    console.log('main.py at first ->', show(first.payload.params.diagnostics.map((d) => d.message)));
    // another tab: lib.py opened and edited (not saved)
    page.open(CH, lib, 'python', readFileSync(join(dir, 'lib.py'), 'utf8'));
    t0 = Date.now();
    page.notify(CH, 'textDocument/didChange', { textDocument: { uri: lib, version: 2 }, contentChanges: [{ text: 'def f() -> int:\n    return 1\n' }] });
    const after = await page.until((f) => f.payload.method === 'textDocument/publishDiagnostics' && f.payload.params.uri === main && f.payload.params.diagnostics.length === 0 && page.frames.indexOf(f) > page.frames.indexOf(first), 'main cleared by the other tab', 15000);
    console.log(`another tab edit: main.py diagnostics cleared after ${Date.now() - t0} ms ->`, show(after.payload.params.diagnostics));
    page.notify(CH, 'textDocument/didClose', { textDocument: { uri: lib } });
    page.notify(CH, 'textDocument/didChange', { textDocument: { uri: main }, contentChanges: [] });
    // outside oculus: the file on disk is changed, lib.py not open
    writeFileSync(join(dir, 'lib.py'), 'def f() -> str:\n    return "a"\n');
    t0 = Date.now();
    const back = await page.until((f) => f.payload.method === 'textDocument/publishDiagnostics' && f.payload.params.uri === main && f.payload.params.diagnostics.length > 0 && page.frames.indexOf(f) > page.frames.indexOf(after), 'main marked again by a disk change', 20000);
    console.log(`disk change outside oculus: main.py marked again after ${Date.now() - t0} ms ->`, show(back.payload.params.diagnostics.map((d) => d.message)));
    writeFileSync(join(dir, 'lib.py'), 'def f() -> int:\n    return 3\n');
    t0 = Date.now();
    const fixed = await page.until((f) => f.payload.method === 'textDocument/publishDiagnostics' && f.payload.params.uri === main && f.payload.params.diagnostics.length === 0 && page.frames.indexOf(f) > page.frames.indexOf(back), 'main cleared by a disk change', 20000);
    console.log(`disk change outside oculus: main.py cleared after ${Date.now() - t0} ms ->`, show(fixed.payload.params.diagnostics));
    page.close();
    await relay.close();
}
process.exit(0);
```

#### `b-interp.mjs`

```js
import { readFileSync, writeFileSync, mkdirSync, rmSync, realpathSync } from 'node:fs';
import { spawn as nodeSpawn, execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { makeRelay, Page, pageUri, heading, show, sleep, scratch, writeTree } from './case-lib.mjs';

const CH = 'lsp:python';
const sent = []; // what the relay wrote to each pyright's stdin
function spyingSpawn(command, args, options) {
    const child = nodeSpawn(command, [...args], { cwd: options.cwd, stdio: ['pipe', 'pipe', 'pipe'], env: options.env ?? process.env });
    child.__command = [command, ...args];
    let buffer = Buffer.alloc(0);
    const write = child.stdin.write.bind(child.stdin);
    child.stdin.write = (chunk, ...rest) => {
        buffer = Buffer.concat([buffer, Buffer.from(chunk)]);
        for (;;) {
            const head = buffer.indexOf('\r\n\r\n');
            if (head < 0) break;
            const length = Number(/Content-Length: (\d+)/i.exec(buffer.slice(0, head).toString())[1]);
            if (buffer.length < head + 4 + length) break;
            try { sent.push(JSON.parse(buffer.slice(head + 4, head + 4 + length).toString())); } catch {}
            buffer = buffer.slice(head + 4 + length);
        }
        return write(chunk, ...rest);
    };
    return child;
}
const configAnswers = () => sent.filter((m) => m.result !== undefined && Array.isArray(m.result) && m.result.some((x) => x && x.pythonPath !== undefined)).map((m) => m.result[0].pythonPath);

async function choices(page, root) {
    page.send(CH, { oculus: 'choices', root });
    const before = page.frames.filter((f) => f.payload.oculus === 'choices').length;
    const got = await page.until((f) => f.payload.oculus === 'choices' && page.frames.filter((x) => x.payload.oculus === 'choices').indexOf(f) >= before, 'choices', 30000);
    return got.payload;
}
const summary = (c) => c.interpreters?.map((i) => `${i.version}${i.label ? ' ' + i.label : ''} found=${i.found} approved=${i.approved} path=${i.path}`);

const dir = scratch('interp-');
writeTree(dir, { 'a.py': 'import os\nx: int = os.getcwd()\n' });
const base = scratch('interp-base-');
{
    const { relay } = makeRelay({ roots: [{ key: 'proj', dir }], base, options: { spawn: spyingSpawn } });
    const page = new Page(relay);
    await page.initialize(CH);
    page.open(CH, pageUri('proj', 'a.py'), 'python', readFileSync(join(dir, 'a.py'), 'utf8'));
    await page.ready(CH);
    await page.diagnostics(CH, pageUri('proj', 'a.py'), (d) => d.length > 0, 30000);
    heading(12, 'the interpreter of a root with no .venv or venv');
    let c = await choices(page, 'proj');
    console.log('choices (no venv) ->', show({ interpreter: c.interpreter, list: summary(c) }, 900));
    await sleep(500);
    console.log('pyright was answered pythonPath ->', show(configAnswers()));
    heading(48, 'the PATH python3 is the pyenv shim, pyright is answered the shim sys.executable');
    console.log('which python3 ->', execFileSync('sh', ['-c', 'command -v python3']).toString().trim());
    console.log('python3 -c sys.executable ->', execFileSync('python3', ['-c', 'import sys;print(sys.executable)']).toString().trim());
    // make a venv
    execFileSync('python3', ['-m', 'venv', '--without-pip', join(dir, '.venv')]);
    page.send(CH, { oculus: 'restart', root: 'proj' });
    await sleep(8000);
    c = await choices(page, 'proj');
    console.log('choices (.venv made, restarted) ->', show({ interpreter: c.interpreter, list: summary(c) }, 1200));
    const n1 = configAnswers();
    console.log('pyright answered after the restart ->', show(n1.slice(-1)), '(must be the PATH interpreter while .venv is not approved)');
    page.send(CH, { oculus: 'approve', root: 'proj', interpreter: join(dir, '.venv/bin/python') });
    await sleep(1500);
    c = await choices(page, 'proj');
    console.log('choices (approved) ->', show({ interpreter: c.interpreter, list: summary(c) }, 1200));
    await sleep(8000);
    console.log('pyright answered after Approve ->', show(configAnswers().slice(-1)));
    console.log('.venv/bin/python is a symlink to', realpathSync(join(dir, '.venv/bin/python')));
    // pyright's process command: node path
    const ps = execFileSync('ps', ['-axo', 'pid,command']).toString().split('\n').filter((l) => l.includes('langserver.index.js'));
    console.log('ps of pyright ->', ps.map((l) => l.trim().slice(0, 150)).join(' | '));
    console.log('process.execPath ->', process.execPath);
    // choose from the list (the other interpreter), survive a reload of the page and of the server
    const path3 = c.interpreters.find((i) => !i.path.includes('.venv'))?.path;
    page.send(CH, { oculus: 'choose', root: 'proj', interpreter: path3 });
    await sleep(2000);
    c = await choices(page, 'proj');
    console.log(`choose ${path3} -> in force`, c.interpreter);
    page.close();
    const page2 = new Page(relay);
    await page2.initialize(CH);
    page2.open(CH, pageUri('proj', 'a.py'), 'python', readFileSync(join(dir, 'a.py'), 'utf8'));
    await page2.ready(CH);
    c = await choices(page2, 'proj');
    console.log('a reloaded page ->', c.interpreter);
    page2.close();
    await relay.close();
    const second = makeRelay({ roots: [{ key: 'proj', dir }], base });
    const page3 = new Page(second.relay);
    await page3.initialize(CH);
    page3.open(CH, pageUri('proj', 'a.py'), 'python', readFileSync(join(dir, 'a.py'), 'utf8'));
    await page3.ready(CH);
    c = await choices(page3, 'proj');
    console.log('a restarted server (new relay over the same lsp folder) ->', c.interpreter);
    page3.close();
    await second.relay.close();
}
// ---- 36, a chosen interpreter deleted from disk
{
    heading(36, 'a chosen interpreter deleted from the disk is dropped; before a choice the found one is answered');
    const dir2 = scratch('interp2-');
    writeTree(dir2, { 'a.py': 'x = 1\n' });
    execFileSync('python3', ['-m', 'venv', '--without-pip', join(dir2, 'venv')]);
    const base2 = scratch('interp2-base-');
    sent.length = 0;
    const { relay } = makeRelay({ roots: [{ key: 'proj', dir: dir2 }], base: base2, options: { spawn: spyingSpawn } });
    const page = new Page(relay);
    await page.initialize(CH);
    page.open(CH, pageUri('proj', 'a.py'), 'python', 'x = 1\n');
    await page.ready(CH);
    await sleep(1500);
    console.log('before any choice, pyright was answered ->', show(configAnswers()));
    let c = await choices(page, 'proj');
    console.log('choices ->', show({ interpreter: c.interpreter, list: summary(c) }, 900));
    page.send(CH, { oculus: 'approve', root: 'proj', interpreter: join(dir2, 'venv/bin/python') });
    await sleep(1000);
    page.send(CH, { oculus: 'choose', root: 'proj', interpreter: join(dir2, 'venv/bin/python') });
    await sleep(1500);
    c = await choices(page, 'proj');
    console.log('after choosing the venv ->', show({ interpreter: c.interpreter }));
    rmSync(join(dir2, 'venv'), { recursive: true });
    c = await choices(page, 'proj');
    console.log('after the venv was deleted ->', show({ interpreter: c.interpreter, list: summary(c) }, 900));
    page.send(CH, { oculus: 'restart', root: 'proj' });
    await sleep(8000);
    console.log('pyright answered after the delete + restart ->', show(configAnswers().slice(-1)));
    page.close();
    await relay.close();
}
process.exit(0);
```

#### `b2-node.mjs`

```js
import { execFileSync } from 'node:child_process';
import { makeRelay, Page, pageUri, heading, show, scratch, writeTree } from './case-lib.mjs';
heading(48, 'with a PATH whose first node is another version, pyright runs under process.execPath');
console.log('PATH first node ->', execFileSync('sh', ['-c', 'command -v node && node --version']).toString().trim().replace('\n', ' '));
console.log('process.execPath ->', process.execPath, process.version);
const dir = scratch('node-');
writeTree(dir, { 'a.py': 'x: int = 1\n' });
const { relay } = makeRelay({ roots: [{ key: 'proj', dir }] });
const page = new Page(relay);
await page.initialize('lsp:python');
page.open('lsp:python', pageUri('proj', 'a.py'), 'python', 'x: int = "s"\n');
await page.ready('lsp:python');
const pid = relay.pids()[0];
console.log('ps -o command= of the pyright process ->', execFileSync('ps', ['-o', 'command=', '-p', String(pid)]).toString().trim().slice(0, 170));
page.close();
await relay.close();
process.exit(0);
```

#### `c-cathedra.mjs`

```js
import { readFileSync, existsSync, statSync, writeFileSync, mkdirSync, utimesSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { makeRelay, Page, pageUri, heading, show, sleep, scratch } from './case-lib.mjs';

const CH = 'lsp:cpp';
const CATH = '/Users/axelfaes/workspace/cathedra';
const GE = '/Users/axelfaes/workspace/game-engine';
const status = (dir) => execFileSync('git', ['status', '--porcelain'], { cwd: dir }).toString();
const before = { cath: status(CATH), ge: status(GE) };
const stamp = join(scratch('stamp-'), 'stamp');
writeFileSync(stamp, 'x');
await sleep(1100);

const { relay, base } = makeRelay({ roots: [{ key: 'cathedra', dir: CATH }, { key: 'ge', dir: GE }] });
const page = new Page(relay);
await page.initialize(CH);
const file = 'src/monastery/src/mirrors.cpp';
const text = readFileSync(join(CATH, file), 'utf8');
const uri = pageUri('cathedra', file);
const t0 = Date.now();
page.open(CH, uri, 'cpp', text);
await page.ready(CH);
console.log('state frames ->', show(page.states(CH).map((f) => ({ s: f.payload.state, root: f.payload.root, done: f.payload.done, total: f.payload.total }))), `${Date.now() - t0} ms`);
function choicesOf(root) {
    const n = page.frames.filter((f) => f.payload.oculus === 'choices').length;
    page.send(CH, { oculus: 'choices', root });
    return page.until((f) => f.payload.oculus === 'choices' && page.frames.filter((x) => x.payload.oculus === 'choices').indexOf(f) >= n, 'choices', 30000).then((f) => f.payload);
}
heading(6, 'compile_database item and picker for cathedra');
let c = await choicesOf('cathedra');
console.log('database in force ->', c.database, '| found:', c.databases.length, '| first five:', show(c.databases.slice(0, 5).map((d) => d.label ?? d.folder ?? d.key), 400));
console.log('all databases ->', show(c.databases.map((d) => d.folder ?? d.key)));
console.log('findings ->', show(c.findings));
// wait for the index
const ready = await page.until((f) => f.payload.oculus === 'state' && f.payload.state === 'ready' && f.payload.root === 'cathedra', 'ready', 600000);
heading(5, 'F12 on spawnInstance in mirrors.cpp (declared in data/spawn.h, defined in curia/src/data/spawn.cpp)');
const lineIdx = text.split('\n').findIndex((l) => l.includes('= spawnInstance('));
const ch = text.split('\n')[lineIdx].indexOf('spawnInstance') + 2;
const pos = { textDocument: { uri }, position: { line: lineIdx, character: ch } };
let def;
const t1 = Date.now();
for (let i = 0; i < 120; i += 1) {
    def = await page.request(CH, 'textDocument/definition', pos);
    const uris = (def.result ?? []).map((l) => l.uri ?? l.targetUri);
    if (uris.some((u) => u.endsWith('spawn.cpp'))) break;
    await sleep(5000);
}
console.log(`definition (${Math.round((Date.now() - t1) / 1000)} s after the first request) ->`, show(def.result ?? def.error, 500));
// the index has ended when the last state frame is 'ready' and none came for 20 s
for (let quiet = 0; quiet < 20;) {
    const before = page.states(CH).length;
    await sleep(1000);
    const frames = page.states(CH);
    quiet = frames.length === before && frames.at(-1).payload.state === 'ready' ? quiet + 1 : 0;
}
console.log('index ended: state frames seen', page.states(CH).length, '| last', page.states(CH).at(-1).payload.state);
const refs = await page.request(CH, 'textDocument/references', { ...pos, context: { includeDeclaration: true } });
const rl = refs.result ?? [];
console.log(`references -> ${rl.length} locations in ${new Set(rl.map((l) => l.uri)).size} files:`, show([...new Set(rl.map((l) => l.uri))].slice(0, 6), 600));
heading(6, 'choosing build/release restarts clangd and the item follows');
const pid1 = relay.pids()[0];
page.send(CH, { oculus: 'choose', root: 'cathedra', database: c.databases.find((d) => (d.folder ?? d.key) === 'build/release')?.folder ?? 'build/release' });
await sleep(3000);
c = await choicesOf('cathedra');
console.log('database in force after choose ->', c.database, '| pid before', pid1, 'after', show(relay.pids()));
const states = page.states(CH).map((f) => f.payload.state);
console.log('states seen ->', show(states));
heading(52, 'semantic tokens legend and tokens from clangd');
const caps = page.frames.find((f) => f.payload.id === 101)?.payload.result?.capabilities;
console.log('semanticTokensProvider ->', show(caps?.semanticTokensProvider?.legend, 500));
const toks = await page.request(CH, 'textDocument/semanticTokens/full', { textDocument: { uri } }, 120000);
console.log('semantic tokens ->', show({ n: toks.result?.data?.length, first: toks.result?.data?.slice(0, 10) }, 200), toks.error ? show(toks.error) : '');
heading(54, 'Show AST on a call expression / blank line');
const astPos = { line: lineIdx, character: ch };
const ast = await page.request(CH, 'textDocument/ast', { textDocument: { uri }, range: { start: astPos, end: { line: lineIdx, character: ch + 13 } } }, 60000);
console.log('textDocument/ast (call) ->', show(ast.result ?? ast.error, 400));
const blank = text.split('\n').findIndex((l) => l.trim() === '');
const astBlank = await page.request(CH, 'textDocument/ast', { textDocument: { uri }, range: { start: { line: blank, character: 0 }, end: { line: blank, character: 0 } } }, 60000);
console.log(`textDocument/ast (blank line ${blank + 1}) ->`, show(astBlank.result ?? astBlank.error, 300));
heading(55, 'memory usage');
const mem = await page.request(CH, '$/memoryUsage', {}, 60000);
console.log('$/memoryUsage ->', show({ keys: Object.keys(mem.result ?? {}), total: mem.result?._total, self: mem.result?._self }, 300), mem.error ? show(mem.error) : '');
page.close();
await relay.close();
heading(38, 'index writes: git status of both repositories and .cache');
console.log('git status cathedra unchanged ->', status(CATH) === before.cath, '| game-engine unchanged ->', status(GE) === before.ge);
for (const dir of [CATH, GE]) {
    const out = existsSync(join(dir, '.cache')) ? execFileSync('find', [join(dir, '.cache'), '-newer', stamp]).toString().trim() : '(no .cache folder)';
    console.log(`find ${dir}/.cache -newer stamp ->`, out === '' ? '(prints nothing)' : out);
}
console.log('lsp folder holds ->', execFileSync('ls', [join(base, 'lsp')]).toString().trim().split('\n').join(' '));
process.exit(0);
```

#### `case-lib.mjs`

```js
// Shared helpers of the case runs: a stand-in page over the relay (the built server modules, run by
// Node as the tests run them), a real pyright and a real clangd.
import { mkdtempSync, mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const OCULUS = '/Users/axelfaes/workspace/research-hub/.agents/worktrees/D23/tools/oculus';
const { Relay } = await import(pathToFileURL(join(OCULUS, 'src/lib/server/machine/lsp/relay.ts')).href);

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export const show = (value, max = 300) => {
    const text = JSON.stringify(value);
    return text === undefined ? 'undefined' : text.length > max ? `${text.slice(0, max)}...` : text;
};

export function scratch(prefix = 'case-') {
    return realpathSync(mkdtempSync(join(tmpdir(), prefix)));
}

/** One relay over some roots, as the socket holds it. */
export function makeRelay({ roots, base = scratch(), options = {} }) {
    let served = roots;
    const relay = new Relay({
        engine: OCULUS,
        node: process.execPath,
        roots: () => served,
        lspFolder: () => join(base, 'lsp'),
        approvals: () => join(base, 'approvals.json'),
        ...options
    });
    return { relay, base, setRoots: (next) => { served = next; relay.reconcile(); } };
}

/** A stand-in page: a sink the relay sends frames to, and helpers to send and wait. */
export class Page {
    frames = [];
    #waiting = [];
    #next = 100;
    closed = false;
    constructor(relay, { token = true } = {}) {
        this.relay = relay;
        this.token = token;
        this.sink = {
            send: (text) => {
                const frame = JSON.parse(text);
                this.frames.push(frame);
                for (const wait of [...this.#waiting]) wait(frame);
                return Promise.resolve();
            },
            close: () => undefined
        };
    }
    send(channel, payload, canWrite = this.token) {
        return this.relay.inbound(this.sink, JSON.stringify({ channel, payload }), canWrite);
    }
    notify(channel, method, params) {
        this.send(channel, { jsonrpc: '2.0', method, params });
    }
    until(test, label, ms = 90000) {
        const found = this.frames.find(test);
        if (found !== undefined) return Promise.resolve(found);
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error(`timed out waiting for ${label}`)), ms);
            const wait = (frame) => {
                if (!test(frame)) return;
                clearTimeout(timer);
                this.#waiting.splice(this.#waiting.indexOf(wait), 1);
                resolve(frame);
            };
            this.#waiting.push(wait);
        });
    }
    async request(channel, method, params, ms = 90000) {
        this.#next += 1;
        const id = this.#next;
        this.send(channel, { jsonrpc: '2.0', id, method, params });
        const frame = await this.until((one) => one.channel === channel && one.payload.id === id, `${method} answer`, ms);
        return frame.payload;
    }
    async initialize(channel) {
        const answer = await this.request(channel, 'initialize', {
            capabilities: {
                textDocument: { publishDiagnostics: {}, hover: {}, definition: {}, references: {} },
                workspace: { workspaceFolders: false }
            }
        });
        this.notify(channel, 'initialized', {});
        return answer;
    }
    open(channel, uri, languageId, text, version = 1) {
        this.notify(channel, 'textDocument/didOpen', { textDocument: { uri, languageId, version, text } });
    }
    states(channel) {
        return this.frames.filter((one) => one.channel === channel && one.payload.oculus === 'state');
    }
    ready(channel, ms = 120000) {
        return this.until(
            (one) => one.channel === channel && one.payload.oculus === 'state' && ['ready', 'failed', 'not_found'].includes(one.payload.state),
            `${channel} ready`,
            ms
        );
    }
    diagnostics(channel, uri, test = () => true, ms = 90000) {
        return this.until(
            (one) => one.channel === channel && one.payload.method === 'textDocument/publishDiagnostics' && one.payload.params.uri === uri && test(one.payload.params.diagnostics),
            `diagnostics of ${uri}`,
            ms
        );
    }
    close() {
        this.relay.remove(this.sink);
        this.closed = true;
    }
}

export const pageUri = (root, path) => `oculus-file:///${encodeURIComponent(encodeURIComponent(root))}/${path.split('/').map(encodeURIComponent).join('/')}`;
export function heading(n, text) {
    console.log(`\n=== CASE ${n}: ${text}`);
}
export function writeTree(dir, files) {
    for (const [name, text] of Object.entries(files)) {
        const target = join(dir, name);
        mkdirSync(join(target, '..'), { recursive: true });
        writeFileSync(target, text);
    }
}
```

#### `d-scotoma.mjs`

```js
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { makeRelay, Page, pageUri, heading, show, sleep, scratch } from './case-lib.mjs';

const CH = 'lsp:cpp';
const SCOT = '/Users/axelfaes/workspace/scotoma';
function copyRepo(prefix = 'scot-') {
    const dir = scratch(prefix);
    cpSync(join(SCOT, 'src'), join(dir, 'src'), { recursive: true });
    cpSync(join(SCOT, 'tools/pvsneslib/pvsneslib/include'), join(dir, 'tools/pvsneslib/pvsneslib/include'), { recursive: true });
    return dir;
}
function cppYml(dir, text) {
    mkdirSync(join(dir, '.oculus'), { recursive: true });
    writeFileSync(join(dir, '.oculus/cpp.yml'), text);
}
async function open(dir, files) {
    const { relay, base } = makeRelay({ roots: [{ key: 'scot', dir }] });
    const page = new Page(relay);
    await page.initialize(CH);
    for (const [file, lang] of files) page.open(CH, pageUri('scot', file), lang, readFileSync(join(dir, file), 'utf8'));
    await page.ready(CH);
    return { relay, page, base };
}
async function diagFor(page, file, settleMs = 6000) {
    const uri = pageUri('scot', file);
    await sleep(settleMs);
    const last = [...page.frames].reverse().find((f) => f.payload.method === 'textDocument/publishDiagnostics' && f.payload.params.uri === uri);
    return last?.payload.params.diagnostics ?? null;
}
const msgs = (d) => (d === null ? 'no publish' : `${d.length} diagnostics` + (d.length ? `, first: ${show(d[0].message, 160)}` + (d[0].relatedInformation ? ` related ${show(d[0].relatedInformation.map((r) => r.location.uri.split('/').pop() + ':' + (r.location.range.start.line + 1)), 120)}` : '') : ''));
function choices(page, root) {
    const n = page.frames.filter((f) => f.payload.oculus === 'choices').length;
    page.send(CH, { oculus: 'choices', root });
    return page.until((f) => f.payload.oculus === 'choices' && page.frames.filter((x) => x.payload.oculus === 'choices').indexOf(f) >= n, 'choices', 30000).then((f) => f.payload);
}
async function variant(label, yml, files = [['src/dlg.c', 'c'], ['src/spr.c', 'c']]) {
    const dir = copyRepo();
    if (yml !== null) cppYml(dir, yml);
    const { relay, page } = await open(dir, files);
    const out = {};
    for (const [file] of files) out[file] = msgs(await diagFor(page, file, 7000));
    const c = await choices(page, 'scot');
    console.log(`${label}\n   compile database in force: ${show(c.database)} | configurations in list: ${show((c.databases ?? []).map((d) => d.label ?? d.key ?? d.folder))} | findings: ${show(c.findings)}`);
    for (const [file, text] of Object.entries(out)) console.log(`   ${file}: ${text}`);
    return { dir, relay, page };
}

heading(8, 'scotoma with no .oculus/cpp.yml (also case 19: no database, no cpp.yml)');
{
    const { relay, page } = await variant('no cpp.yml', null);
    const c = await choices(page, 'scot');
    console.log('   choices.database ->', show(c.database), '| databases ->', show(c.databases));
    page.close(); await relay.close();
}
heading(8, 'with .oculus/cpp.yml holding configurations: [{ name: snes, fallback_flags: [-xc, -Itools/pvsneslib/pvsneslib/include] }]');
{
    const { relay, page, dir } = await variant('snes configuration', 'configurations:\n  - name: snes\n    fallback_flags: [-xc, -Itools/pvsneslib/pvsneslib/include]\n');
    const uri = pageUri('scot', 'src/dlg.c');
    const text = readFileSync(join(dir, 'src/dlg.c'), 'utf8').split('\n');
    const at = text.findIndex((l) => /\bu8 gameState/.test(l));
    const hover = await page.request(CH, 'textDocument/hover', { textDocument: { uri }, position: { line: at, character: 1 } });
    console.log(`   hover on u8 (dlg.c:${at + 1}:2) ->`, show(hover.result ?? hover.error, 400));
    page.close(); await relay.close();
}
heading(39, 'the base of a relative path in fallback_flags');
{
    for (const [label, flags] of [
        ['-I../tools/pvsneslib/pvsneslib/include (resolves against the repository root, to a folder outside it)', '[-xc, -I../tools/pvsneslib/pvsneslib/include]'],
        ['absolute -I<root>/tools/pvsneslib/pvsneslib/include', null],
        ['-I tools/pvsneslib/pvsneslib/include (the path as its own argument)', '[-xc, -I, tools/pvsneslib/pvsneslib/include]']
    ]) {
        const dir = copyRepo();
        const f = flags ?? `[-xc, -I${dir}/tools/pvsneslib/pvsneslib/include]`;
        cppYml(dir, `configurations:\n  - name: snes\n    fallback_flags: ${f}\n`);
        const { relay, page } = await open(dir, [['src/dlg.c', 'c']]);
        console.log(`${label}\n   fallback_flags: ${f.replace(dir, '<root>')}\n   dlg.c: ${msgs(await diagFor(page, 'src/dlg.c', 7000))}`);
        page.close(); await relay.close();
    }
}
heading(40, 'a C repository header: scotoma.h as a cpp tab and dlg.c as a c tab on one page');
{
    for (const [label, flags] of [
        ['-Itools/... only', '[-Itools/pvsneslib/pvsneslib/include]'],
        ['with -std=c99 added', '[-std=c99, -Itools/pvsneslib/pvsneslib/include]'],
        ['with -xc added', '[-xc, -std=c99, -Itools/pvsneslib/pvsneslib/include]']
    ]) {
        const dir = copyRepo();
        cppYml(dir, `configurations:\n  - name: snes\n    fallback_flags: ${flags}\n`);
        const { relay, page } = await open(dir, [['src/scotoma.h', 'cpp'], ['src/dlg.c', 'c']]);
        const hd = await diagFor(page, 'src/scotoma.h', 7000);
        const dd = await diagFor(page, 'src/dlg.c', 1000);
        console.log(`${label}: fallback_flags ${flags}\n   processes: ${relay.pids().length} (clangd for scotoma)\n   scotoma.h: ${msgs(hd)}\n   dlg.c: ${msgs(dd)}`);
        page.close(); await relay.close();
    }
}
process.exit(0);
```

#### `e-extra.mjs`

```js
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { makeRelay, Page, pageUri, heading, show, sleep, scratch, writeTree } from './case-lib.mjs';
const CH = 'lsp:cpp';
const dir = scratch('extra-');
const src = '#include <vector>\nint add(int a, int b) { return a + b; }\nint main() {\n    int v = add(1, 2);\n    return v;\n}\n\n';
writeTree(dir, { 'main.cpp': src, 'other.py': 'x = 1\n' });
const { relay } = makeRelay({ roots: [{ key: 'p', dir }] });
const page = new Page(relay);
await page.initialize(CH);
const uri = pageUri('p', 'main.cpp');
page.open(CH, uri, 'cpp', src);
await page.ready(CH);
await sleep(3000);
heading(55, 'memory usage through the page document');
const mem = await page.request(CH, '$/memoryUsage', { textDocument: { uri } }, 60000);
const keys = Object.keys(mem.result ?? {});
console.log('$/memoryUsage with the document ->', mem.error ? show(mem.error) : show({ keys: keys.slice(0, 8), _total: mem.result?._total, children: keys.filter((k) => !k.startsWith('_')).length }, 300));
heading(52, 'the legend the relay sends the page');
const legend = page.frames.find((f) => f.payload.oculus === 'legend');
console.log('legend frame ->', show({ ...legend?.payload, types: legend?.payload.types?.length, modifiers: legend?.payload.modifiers?.length, firstTypes: legend?.payload.types?.slice(0, 8) }, 300));
heading(54, 'Show AST on a blank line and on a call');
const blank = await page.request(CH, 'textDocument/ast', { textDocument: { uri }, range: { start: { line: 6, character: 0 }, end: { line: 6, character: 0 } } });
console.log('blank line 7 ->', show(blank.result ?? blank.error), '(null result: the page words it "No AST node at selection")');
const call = await page.request(CH, 'textDocument/ast', { textDocument: { uri }, range: { start: { line: 3, character: 12 }, end: { line: 3, character: 15 } } });
console.log('call `add` ->', show({ role: call.result?.role, kind: call.result?.kind, detail: call.result?.detail, children: call.result?.children?.length, range: call.result?.range }, 300));
heading(35, 'a clangd tweak/code action whose edit names another file: what the relay sends the page');
const actions = await page.request(CH, 'textDocument/codeAction', { textDocument: { uri }, range: { start: { line: 1, character: 4 }, end: { line: 1, character: 7 } }, context: { diagnostics: [] } });
console.log('code actions at `add` ->', show((actions.result ?? []).map((a) => ({ title: a.title, kind: a.kind, command: a.command?.command, edit: a.edit ? Object.keys(a.edit.changes ?? {}) : undefined })), 600));
page.close();
await relay.close();
process.exit(0);
```

#### `f1-config.mjs`

```js
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync, existsSync, symlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { makeRelay, Page, pageUri, heading, show, sleep, scratch, writeTree } from './case-lib.mjs';

const CH = 'lsp:cpp';
const db = (dir, name) => {
    mkdirSync(join(dir, name), { recursive: true });
    writeFileSync(join(dir, name, 'compile_commands.json'), JSON.stringify([{ directory: dir, file: join(dir, 'main.cpp'), command: `c++ -c ${join(dir, 'main.cpp')}` }]));
};
function choicesOf(page, root) {
    const n = page.frames.filter((f) => f.payload.oculus === 'choices').length;
    page.send(CH, { oculus: 'choices', root });
    return page.until((f) => f.payload.oculus === 'choices' && page.frames.filter((x) => x.payload.oculus === 'choices').indexOf(f) >= n, 'choices', 30000).then((f) => f.payload);
}
const names = (c) => c.databases.map((d) => `${d.configuration ? '[cfg] ' : ''}${d.key}`);
async function session(dir, base = scratch('f1b-'), opts = {}) {
    const m = makeRelay({ roots: [{ key: 'r', dir }], base, options: opts });
    const page = new Page(m.relay);
    await page.initialize(CH);
    page.open(CH, pageUri('r', 'main.cpp'), 'cpp', 'int main() { return 0; }\n');
    await page.ready(CH);
    return { ...m, page, base };
}

heading(7, 'a repository with .oculus/cpp.yml naming two configurations beside two found databases');
{
    const dir = scratch('f1-');
    writeFileSync(join(dir, 'main.cpp'), 'int main() { return 0; }\n');
    db(dir, 'build/debug'); db(dir, 'build/release');
    mkdirSync(join(dir, '.oculus'));
    writeFileSync(join(dir, '.oculus/cpp.yml'), 'configurations:\n  - name: second-flags\n    fallback_flags: [-std=c++20]\n  - name: first-db\n    compile_commands: build/release\n');
    const s = await session(dir);
    const c = await choicesOf(s.page, 'r');
    console.log('picker ->', show(names(c)), '| in force (no remembered choice) ->', c.database, '| findings ->', show(c.findings));
    s.page.close(); await s.relay.close();
}
heading(33, '.oculus/cpp.yml keys that are wrong: each a finding naming the key, the entry skipped, the rest read');
{
    const dir = scratch('f1c-');
    writeFileSync(join(dir, 'main.cpp'), 'int main() { return 0; }\n');
    db(dir, 'build/debug');
    mkdirSync(join(dir, '.oculus'));
    mkdirSync(join(dir, 'empty-folder'));
    const outside = scratch('f1out-'); db(outside, '.');
    writeFileSync(join(dir, '.oculus/cpp.yml'), [
        'configurations:',
        '  - name: ""',
        '    fallback_flags: [-xc]',
        '  - name: dup',
        '    fallback_flags: [-xc]',
        '  - name: dup',
        '    fallback_flags: [-xc]',
        '  - name: build/debug',
        '    fallback_flags: [-xc]',
        `  - name: outside`,
        `    compile_commands: ${outside}`,
        '  - name: nodb',
        '    compile_commands: empty-folder',
        '  - name: flagsbad',
        '    fallback_flags: [1, 2]',
        '  - name: extra',
        '    colour: blue',
        '  - name: good',
        '    fallback_flags: [-std=c++17]',
        ''
    ].join('\n'));
    const s = await session(dir);
    const c = await choicesOf(s.page, 'r');
    console.log('picker ->', show(names(c)));
    for (const f of c.findings) console.log('   finding ->', show(f, 260));
    s.page.close(); await s.relay.close();
    const dir2 = scratch('f1d-');
    writeFileSync(join(dir2, 'main.cpp'), 'int main() { return 0; }\n');
    mkdirSync(join(dir2, '.oculus'));
    writeFileSync(join(dir2, '.oculus/cpp.yml'), 'configurations: [unclosed\n  - : :\n');
    const s2 = await session(dir2);
    const c2 = await choicesOf(s2.page, 'r');
    console.log('a file that is not YAML -> picker', show(names(c2)), 'findings', show(c2.findings, 300));
    s2.page.close(); await s2.relay.close();
}
heading(34, 'the choices file unreadable (not JSON)');
{
    const dir = scratch('f1e-');
    writeFileSync(join(dir, 'main.cpp'), 'int main() { return 0; }\n');
    db(dir, 'build/debug'); db(dir, 'build/release');
    const base = scratch('f1e-base-');
    mkdirSync(join(base, 'lsp'), { recursive: true });
    writeFileSync(join(base, 'lsp/choices.json'), 'this is not json {');
    const s = await session(dir, base);
    const c = await choicesOf(s.page, 'r');
    console.log('read as no choices -> in force', c.database);
    const n = s.page.frames.length;
    s.page.send(CH, { oculus: 'choose', root: 'r', database: 'build/release' });
    const refused = await s.page.until((f) => s.page.frames.indexOf(f) >= n && f.payload.oculus === 'refused', 'refused', 20000);
    console.log('a choice made ->', show(refused.payload));
    console.log('the file after ->', JSON.stringify(readFileSync(join(base, 'lsp/choices.json'), 'utf8')));
    s.page.close(); await s.relay.close();
}
heading(37, 'a database link folder whose target was deleted (build/debug removed)');
{
    const dir = scratch('f1f-');
    writeFileSync(join(dir, 'main.cpp'), 'int main() { return 0; }\n');
    db(dir, 'build/debug'); db(dir, 'build/release');
    const s = await session(dir);
    s.page.send(CH, { oculus: 'choose', root: 'r', database: 'build/debug' });
    await sleep(2500);
    let c = await choicesOf(s.page, 'r');
    console.log('chosen ->', c.database);
    rmSync(join(dir, 'build/debug'), { recursive: true });
    c = await choicesOf(s.page, 'r');
    console.log('after build/debug was removed ->', show(names(c)), 'in force', c.database);
    s.page.send(CH, { oculus: 'restart', root: 'r' });
    await sleep(4000);
    console.log('states ->', show(s.page.states(CH).map((f) => f.payload.state)), 'processes', s.relay.pids().length);
    s.page.close(); await s.relay.close();
}
heading(45, 'the lsp key: changed while servers run; a file; a folder that cannot be written');
{
    const dir = scratch('f1g-');
    writeFileSync(join(dir, 'main.cpp'), 'int main() { return 0; }\n');
    writeFileSync(join(dir, 'a.py'), 'x = 1\n');
    db(dir, 'build/debug');
    const base = scratch('f1g-base-');
    let current = join(base, 'one');
    const m = makeRelay({ roots: [{ key: 'r', dir }], base, options: { lspFolder: () => current } });
    const page = new Page(m.relay);
    await page.initialize(CH); await page.initialize('lsp:python');
    page.open(CH, pageUri('r', 'main.cpp'), 'cpp', 'int main() { return 0; }\n');
    await page.ready(CH);
    const pid1 = m.relay.pids();
    console.log('lsp = <base>/one: processes', show(pid1), '| one/ holds', show(existsSync(join(base, 'one')) ? readdirSync(join(base, 'one')) : []));
    current = join(base, 'two');
    m.relay.reload();
    await sleep(5000);
    console.log('lsp changed to <base>/two and reload(): processes', show(m.relay.pids()), '| two/ holds', show(existsSync(join(base, 'two')) ? readdirSync(join(base, 'two')) : []), '| one/ left as it was', show(readdirSync(join(base, 'one'))));
    writeFileSync(join(base, 'afile'), 'x');
    current = join(base, 'afile');
    m.relay.reload();
    await sleep(5000);
    const failed = page.states(CH).at(-1);
    console.log('lsp names a file ->', show(failed.payload), '| repo holds', show(readdirSync(dir)));
    page.open('lsp:python', pageUri('r', 'a.py'), 'python', 'x: int = "s"\n');
    const d = await page.diagnostics('lsp:python', pageUri('r', 'a.py'), (x) => x.length > 0, 60000);
    console.log('pyright serves on ->', show(d.payload.params.diagnostics.map((x) => x.message.split('\n')[0])));
    const n = page.frames.length;
    page.send('lsp:python', { oculus: 'choose', root: 'r', interpreter: process.execPath });
    const refused = await page.until((f) => page.frames.indexOf(f) >= n && f.payload.oculus === 'refused', 'refused', 20000).catch((e) => e.message);
    console.log('a choice made ->', show(refused.payload ?? refused));
    page.close(); await m.relay.close();
}
heading(46, 'root keys and the lsp folder: the folder is <lsp>/<16 hex> from the real path');
{
    const dir = scratch('f1h-');
    writeFileSync(join(dir, 'main.cpp'), 'int main() { return 0; }\n');
    db(dir, 'build/debug');
    const dir2 = scratch('f1h2-');
    writeFileSync(join(dir2, 'main.cpp'), 'int main() { return 0; }\n');
    db(dir2, 'build/debug');
    const base = scratch('f1h-base-');
    const hex = (p) => createHash('sha256').update(p, 'utf8').digest('hex').slice(0, 16);
    const m = makeRelay({ roots: [{ key: 'a/../b', dir }, { key: 'x/y', dir: dir2 }], base });
    const page = new Page(m.relay);
    await page.initialize(CH);
    page.open(CH, pageUri('a/../b', 'main.cpp'), 'cpp', 'int main() { return 0; }\n');
    page.open(CH, pageUri('x/y', 'main.cpp'), 'cpp', 'int main() { return 0; }\n');
    await sleep(6000);
    console.log('keys a/../b and x/y: lsp folder holds', show(readdirSync(join(base, 'lsp')).sort()), '| expected', show([hex(dir), hex(dir2)].sort()));
    page.close(); await m.relay.close();
    // the same folder under two keys, then a key reassigned
    const base2 = scratch('f1h-base2-');
    const m2 = makeRelay({ roots: [{ key: 'one', dir }, { key: 'two', dir }], base: base2 });
    const p2 = new Page(m2.relay);
    await p2.initialize(CH);
    p2.open(CH, pageUri('one', 'main.cpp'), 'cpp', 'int main() { return 0; }\n');
    p2.open(CH, pageUri('two', 'main.cpp'), 'cpp', 'int main() { return 0; }\n');
    await sleep(6000);
    console.log('one folder served under two keys: processes', m2.relay.pids().length, '| lsp folder holds', show(readdirSync(join(base2, 'lsp'))));
    p2.close(); await m2.relay.close();
}
process.exit(0);
```

#### `f4-keys.mjs`

```js
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync, existsSync, symlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { makeRelay, Page, pageUri, heading, show, sleep, scratch, writeTree } from './case-lib.mjs';

const CH = 'lsp:cpp';
const db = (dir, name) => {
    mkdirSync(join(dir, name), { recursive: true });
    writeFileSync(join(dir, name, 'compile_commands.json'), JSON.stringify([{ directory: dir, file: join(dir, 'main.cpp'), command: `c++ -c ${join(dir, 'main.cpp')}` }]));
};
function choicesOf(page, root) {
    const n = page.frames.filter((f) => f.payload.oculus === 'choices').length;
    page.send(CH, { oculus: 'choices', root });
    return page.until((f) => f.payload.oculus === 'choices' && page.frames.filter((x) => x.payload.oculus === 'choices').indexOf(f) >= n, 'choices', 30000).then((f) => f.payload);
}
const names = (c) => c.databases.map((d) => `${d.configuration ? '[cfg] ' : ''}${d.key}`);
async function session(dir, base = scratch('f1b-'), opts = {}) {
    const m = makeRelay({ roots: [{ key: 'r', dir }], base, options: opts });
    const page = new Page(m.relay);
    await page.initialize(CH);
    page.open(CH, pageUri('r', 'main.cpp'), 'cpp', 'int main() { return 0; }\n');
    await page.ready(CH);
    return { ...m, page, base };
}

heading(45, 'the lsp key: changed while servers run; a file; a folder that cannot be written');
{
    const dir = scratch('f1g-');
    writeFileSync(join(dir, 'main.cpp'), 'int main() { return 0; }\n');
    writeFileSync(join(dir, 'a.py'), 'x = 1\n');
    db(dir, 'build/debug');
    const base = scratch('f1g-base-');
    let current = join(base, 'one');
    const m = makeRelay({ roots: [{ key: 'r', dir }], base, options: { lspFolder: () => current } });
    const page = new Page(m.relay);
    await page.initialize(CH); await page.initialize('lsp:python');
    page.open(CH, pageUri('r', 'main.cpp'), 'cpp', 'int main() { return 0; }\n');
    await page.ready(CH);
    const pid1 = m.relay.pids();
    console.log('lsp = <base>/one: processes', show(pid1), '| one/ holds', show(existsSync(join(base, 'one')) ? readdirSync(join(base, 'one')) : []));
    current = join(base, 'two');
    m.relay.reload();
    await sleep(5000);
    console.log('lsp changed to <base>/two and reload(): processes', show(m.relay.pids()), '| two/ holds', show(existsSync(join(base, 'two')) ? readdirSync(join(base, 'two')) : []), '| one/ left as it was', show(readdirSync(join(base, 'one'))));
    writeFileSync(join(base, 'afile'), 'x');
    current = join(base, 'afile');
    m.relay.reload();
    await sleep(5000);
    const failed = page.states(CH).at(-1);
    console.log('lsp names a file ->', show(failed.payload), '| repo holds', show(readdirSync(dir)));
    page.open('lsp:python', pageUri('r', 'a.py'), 'python', 'x: int = "s"\n');
    const d = await page.diagnostics('lsp:python', pageUri('r', 'a.py'), (x) => x.length > 0, 60000);
    console.log('pyright serves on ->', show(d.payload.params.diagnostics.map((x) => x.message.split('\n')[0])));
    const n = page.frames.length;
    page.send('lsp:python', { oculus: 'choose', root: 'r', interpreter: `${process.env.HOME}/.pyenv/versions/3.13.4/bin/python3` });
    const refused = await page.until((f) => page.frames.indexOf(f) >= n && f.payload.oculus === 'refused', 'refused', 20000).catch((e) => e.message);
    console.log('a choice made ->', show(refused.payload ?? refused));
    page.close(); await m.relay.close();
}
heading(46, 'root keys and the lsp folder: the folder is <lsp>/<16 hex> from the real path');
{
    const dir = scratch('f1h-');
    writeFileSync(join(dir, 'main.cpp'), 'int main() { return 0; }\n');
    db(dir, 'build/debug');
    const dir2 = scratch('f1h2-');
    writeFileSync(join(dir2, 'main.cpp'), 'int main() { return 0; }\n');
    db(dir2, 'build/debug');
    const base = scratch('f1h-base-');
    const hex = (p) => createHash('sha256').update(p, 'utf8').digest('hex').slice(0, 16);
    const m = makeRelay({ roots: [{ key: 'a/../b', dir }, { key: 'x/y', dir: dir2 }], base });
    const page = new Page(m.relay);
    await page.initialize(CH);
    page.open(CH, pageUri('a/../b', 'main.cpp'), 'cpp', 'int main() { return 0; }\n');
    page.open(CH, pageUri('x/y', 'main.cpp'), 'cpp', 'int main() { return 0; }\n');
    await sleep(6000);
    console.log('keys a/../b and x/y: lsp folder holds', show(readdirSync(join(base, 'lsp')).sort()), '| expected', show([hex(dir), hex(dir2)].sort()));
    page.close(); await m.relay.close();
    // the same folder under two keys, then a key reassigned
    const base2 = scratch('f1h-base2-');
    const m2 = makeRelay({ roots: [{ key: 'one', dir }, { key: 'two', dir }], base: base2 });
    const p2 = new Page(m2.relay);
    await p2.initialize(CH);
    p2.open(CH, pageUri('one', 'main.cpp'), 'cpp', 'int main() { return 0; }\n');
    p2.open(CH, pageUri('two', 'main.cpp'), 'cpp', 'int main() { return 0; }\n');
    await sleep(6000);
    console.log('one folder served under two keys: processes', m2.relay.pids().length, '| lsp folder holds', show(readdirSync(join(base2, 'lsp'))));
    p2.close(); await m2.relay.close();
}
process.exit(0);
```

#### `f5-reassign.mjs`

```js
import { writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { makeRelay, Page, pageUri, heading, show, sleep, scratch } from './case-lib.mjs';
heading(46, 'a key reassigned to another folder gets another lsp folder, and the first is left');
const mk = () => { const d = scratch('f5-'); writeFileSync(join(d, 'main.cpp'), 'int main() { return 0; }\n'); mkdirSync(join(d, 'build/debug'), { recursive: true }); writeFileSync(join(d, 'build/debug/compile_commands.json'), JSON.stringify([{ directory: d, file: join(d, 'main.cpp'), command: `c++ -c ${join(d, 'main.cpp')}` }])); return d; };
const a = mk(), b = mk();
const hex = (p) => createHash('sha256').update(p, 'utf8').digest('hex').slice(0, 16);
let served = [{ key: 'k', dir: a }];
const base = scratch('f5-base-');
const m = makeRelay({ roots: [], base });
const relay = m.relay;
const live = makeRelay({ roots: served, base });
const page = new Page(live.relay);
await page.initialize('lsp:cpp');
page.open('lsp:cpp', pageUri('k', 'main.cpp'), 'cpp', 'int main() { return 0; }\n');
await sleep(5000);
console.log('key k -> folder A: lsp holds', show(readdirSync(join(base, 'lsp'))), '| hex(A)', hex(a));
page.send('lsp:cpp', { jsonrpc: '2.0', method: 'textDocument/didClose', params: { textDocument: { uri: pageUri('k', 'main.cpp') } } });
live.setRoots([{ key: 'k', dir: b }]);
await sleep(1500);
page.open('lsp:cpp', pageUri('k', 'main.cpp'), 'cpp', 'int main() { return 0; }\n');
await sleep(5000);
console.log('key k -> folder B: lsp holds', show(readdirSync(join(base, 'lsp')).sort()), '| hex(A), hex(B)', show([hex(a), hex(b)].sort()));
page.close(); await live.relay.close(); await relay.close(); process.exit(0);
```

#### `f6-readonly.mjs`

```js
import { chmodSync, readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync, existsSync, symlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { makeRelay, Page, pageUri, heading, show, sleep, scratch, writeTree } from './case-lib.mjs';

const CH = 'lsp:cpp';
const db = (dir, name) => {
    mkdirSync(join(dir, name), { recursive: true });
    writeFileSync(join(dir, name, 'compile_commands.json'), JSON.stringify([{ directory: dir, file: join(dir, 'main.cpp'), command: `c++ -c ${join(dir, 'main.cpp')}` }]));
};
function choicesOf(page, root) {
    const n = page.frames.filter((f) => f.payload.oculus === 'choices').length;
    page.send(CH, { oculus: 'choices', root });
    return page.until((f) => f.payload.oculus === 'choices' && page.frames.filter((x) => x.payload.oculus === 'choices').indexOf(f) >= n, 'choices', 30000).then((f) => f.payload);
}
const names = (c) => c.databases.map((d) => `${d.configuration ? '[cfg] ' : ''}${d.key}`);
async function session(dir, base = scratch('f1b-'), opts = {}) {
    const m = makeRelay({ roots: [{ key: 'r', dir }], base, options: opts });
    const page = new Page(m.relay);
    await page.initialize(CH);
    page.open(CH, pageUri('r', 'main.cpp'), 'cpp', 'int main() { return 0; }\n');
    await page.ready(CH);
    return { ...m, page, base };
}

heading(45, 'the lsp key naming a folder that cannot be written');
{
    const dir = scratch('f1g-');
    writeFileSync(join(dir, 'main.cpp'), 'int main() { return 0; }\n');
    writeFileSync(join(dir, 'a.py'), 'x = 1\n');
    db(dir, 'build/debug');
    const base = scratch('f1g-base-');
    let current = join(base, 'one');
    const m = makeRelay({ roots: [{ key: 'r', dir }], base, options: { lspFolder: () => current } });
    const page = new Page(m.relay);
    await page.initialize(CH); await page.initialize('lsp:python');
    page.open(CH, pageUri('r', 'main.cpp'), 'cpp', 'int main() { return 0; }\n');
    await page.ready(CH);
    const pid1 = m.relay.pids();
    console.log('lsp = <base>/one: processes', show(pid1), '| one/ holds', show(existsSync(join(base, 'one')) ? readdirSync(join(base, 'one')) : []));
    current = join(base, 'two');
    m.relay.reload();
    await sleep(5000);
    console.log('lsp changed to <base>/two and reload(): processes', show(m.relay.pids()), '| two/ holds', show(existsSync(join(base, 'two')) ? readdirSync(join(base, 'two')) : []), '| one/ left as it was', show(readdirSync(join(base, 'one'))));
    const ro = join(base, 'readonly'); mkdirSync(ro); chmodSync(ro, 0o555);
    current = join(ro, 'lsp');
    m.relay.reload();
    await sleep(5000);
    const failed = page.states(CH).at(-1);
    console.log('lsp names a folder that cannot be written ->', show(failed.payload), '| repo holds', show(readdirSync(dir)));
    page.open('lsp:python', pageUri('r', 'a.py'), 'python', 'x: int = "s"\n');
    const d = await page.diagnostics('lsp:python', pageUri('r', 'a.py'), (x) => x.length > 0, 60000);
    console.log('pyright serves on ->', show(d.payload.params.diagnostics.map((x) => x.message.split('\n')[0])));
    const n = page.frames.length;
    page.send('lsp:python', { oculus: 'choose', root: 'r', interpreter: `${process.env.HOME}/.pyenv/versions/3.13.4/bin/python3` });
    const refused = await page.until((f) => page.frames.indexOf(f) >= n && f.payload.oculus === 'refused', 'refused', 20000).catch((e) => e.message);
    console.log('a choice made ->', show(refused.payload ?? refused));
    page.close(); await m.relay.close();
}
process.exit(0);
```

#### `g1-misc.mjs`

```js
import { readFileSync, writeFileSync, mkdirSync, rmSync, renameSync, cpSync, symlinkSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { makeRelay, Page, pageUri, heading, show, sleep, scratch, writeTree } from './case-lib.mjs';

const PY = 'lsp:python';
const CPP = 'lsp:cpp';
const pids = (re) => execFileSync('ps', ['-axo', 'pid,command']).toString().split('\n').filter((l) => re.test(l) && !/grep|g1-misc/.test(l)).map((l) => l.trim().split(/\s+/)[0]);

heading(9, 'format on save: what the servers answer to a formatting request (the save logic is the page, views/sources/source/language/lsp.ts)');
{
    const dir = scratch('g9-');
    const bad = 'int main(){\nint x=1;\n      return   x;\n}\n';
    writeTree(dir, { 'a.cpp': bad, 'b.py': 'def f( a,b ):\n  return a+ b\n' });
    const { relay } = makeRelay({ roots: [{ key: 'p', dir }] });
    const page = new Page(relay);
    await page.initialize(CPP); await page.initialize(PY);
    page.open(CPP, pageUri('p', 'a.cpp'), 'cpp', bad);
    page.open(PY, pageUri('p', 'b.py'), 'python', 'def f( a,b ):\n  return a+ b\n');
    await page.ready(CPP);
    const cpp = await page.request(CPP, 'textDocument/formatting', { textDocument: { uri: pageUri('p', 'a.cpp') }, options: { tabSize: 4, insertSpaces: true } });
    console.log('clangd formatting -> ', cpp.error ? show(cpp.error) : `${cpp.result.length} edit(s), first: ${show(cpp.result[0], 200)}`);
    await page.ready(PY);
    const py = await page.request(PY, 'textDocument/formatting', { textDocument: { uri: pageUri('p', 'b.py') }, options: { tabSize: 4, insertSpaces: true } });
    console.log('pyright formatting ->', show(py.error ?? py.result), '(no provider: the page saves as typed)');
    page.close(); await relay.close();
}
heading(10, 'document symbols: kinds on a Python and a C++ file');
{
    const dir = scratch('g10-');
    const py = 'import os\n\nCONST = 1\n\nclass A:\n    def m(self):\n        return 1\n\ndef f():\n    return 2\n';
    const cpp = 'namespace ns {\nclass C {\npublic:\n  int method();\n};\nint func(int a) { return a; }\n}\n';
    writeTree(dir, { 'a.py': py, 'a.cpp': cpp, 'a.yml': 'a: 1\n' });
    const { relay } = makeRelay({ roots: [{ key: 'p', dir }] });
    const page = new Page(relay);
    await page.initialize(PY); await page.initialize(CPP);
    page.open(PY, pageUri('p', 'a.py'), 'python', py);
    page.open(CPP, pageUri('p', 'a.cpp'), 'cpp', cpp);
    await page.ready(PY); await page.ready(CPP);
    const walk = (list, d = 0) => list.flatMap((s) => [`${'  '.repeat(d)}${s.name} kind=${s.kind}`, ...walk(s.children ?? [], d + 1)]);
    const a = await page.request(PY, 'textDocument/documentSymbol', { textDocument: { uri: pageUri('p', 'a.py') } });
    console.log('python ->', show(walk(a.result), 400));
    const b = await page.request(CPP, 'textDocument/documentSymbol', { textDocument: { uri: pageUri('p', 'a.cpp') } });
    console.log('cpp ->', show(walk(b.result), 400));
    page.close(); await relay.close();
}
heading(14, 'pyright missing from node_modules, clangd not on PATH');
{
    const dir = scratch('g14-');
    writeTree(dir, { 'a.py': 'x = 1\n', 'a.cpp': 'int x;\n' });
    const fakeEngine = scratch('g14-engine-');
    const { relay } = makeRelay({ roots: [{ key: 'p', dir }], options: { engine: fakeEngine } });
    const page = new Page(relay);
    await page.initialize(PY);
    page.open(PY, pageUri('p', 'a.py'), 'python', 'x = 1\n');
    const s = await page.ready(PY);
    console.log('pyright missing ->', show(s.payload), '| processes', relay.pids().length);
    await sleep(4000);
    console.log('no spawn loop: state frames after 4 s ->', page.states(PY).length, '| processes', relay.pids().length);
    page.close(); await relay.close();
    const saved = process.env.PATH;
    process.env.PATH = '/usr/bin/nonexistent';
    const m2 = makeRelay({ roots: [{ key: 'p', dir }] });
    const p2 = new Page(m2.relay);
    await p2.initialize(CPP);
    p2.open(CPP, pageUri('p', 'a.cpp'), 'cpp', 'int x;\n');
    const s2 = await p2.ready(CPP);
    process.env.PATH = saved;
    console.log('clangd not on PATH ->', show(s2.payload), '| processes', m2.relay.pids().length);
    await sleep(4000);
    console.log('no spawn loop: state frames after 4 s ->', p2.states(CPP).length);
    p2.close(); await m2.relay.close();
}
heading(15, 'a server that crashes: restarted once on the next request; a second crash in 3 minutes leaves it failed');
{
    const dir = scratch('g15-');
    writeTree(dir, { 'a.py': 'x: int = "s"\n' });
    const { relay } = makeRelay({ roots: [{ key: 'p', dir }] });
    const page = new Page(relay);
    await page.initialize(PY);
    const uri = pageUri('p', 'a.py');
    page.open(PY, uri, 'python', 'x: int = "s"\n');
    await page.ready(PY);
    const first = relay.pids()[0];
    process.kill(first, 'SIGKILL');
    await sleep(1500);
    console.log('killed pid', first, '-> states', show(page.states(PY).map((f) => f.payload.state + (f.payload.code ? ':' + f.payload.code : ''))), 'processes', relay.pids().length);
    const h = await page.request(PY, 'textDocument/hover', { textDocument: { uri }, position: { line: 0, character: 0 } });
    await sleep(3000);
    console.log('next request ->', show(h.result ?? h.error), '| new pids', show(relay.pids()), '| states', show(page.states(PY).map((f) => f.payload.state)));
    process.kill(relay.pids()[0], 'SIGKILL');
    await sleep(1500);
    const h2 = await page.request(PY, 'textDocument/hover', { textDocument: { uri }, position: { line: 0, character: 0 } });
    await sleep(2000);
    console.log('second crash ->', show(h2.error ?? h2.result), '| states', show(page.states(PY).map((f) => f.payload.state + (f.payload.code ? ':' + f.payload.code : ''))), '| processes', relay.pids().length);
    page.send(PY, { oculus: 'output', root: 'p' });
    const out = await page.until((f) => f.payload.oculus === 'output', 'output', 10000);
    console.log('Show Language Server Output ->', show({ lines: out.payload.lines.length, tail: out.payload.lines.slice(-3) }, 400));
    page.send(PY, { oculus: 'restart', root: 'p' });
    await sleep(6000);
    console.log('Restart ->', show(page.states(PY).at(-1).payload), '| processes', relay.pids().length);
    page.close(); await relay.close();
}
heading(18, 'a file outside every served root; a root removed from the workspace while open');
{
    const dir = scratch('g18-');
    const other = scratch('g18o-');
    writeTree(dir, { 'a.py': 'x = 1\n' }); writeTree(other, { 'b.py': 'y = 2\n' });
    const m = makeRelay({ roots: [{ key: 'p', dir }] });
    const page = new Page(m.relay);
    await page.initialize(PY);
    page.open(PY, pageUri('q', 'b.py'), 'python', 'y = 2\n');
    await sleep(1500);
    console.log('open from an unserved root key -> processes', m.relay.pids().length, '| states', page.states(PY).length);
    const n = page.frames.length;
    const r = await page.request(PY, 'textDocument/hover', { textDocument: { uri: pageUri('q', 'b.py') }, position: { line: 0, character: 0 } });
    console.log('a request on it ->', show(r.error ?? r.result));
    page.open(PY, pageUri('p', 'a.py'), 'python', 'x = 1\n');
    await page.ready(PY);
    console.log('served root: processes', m.relay.pids().length);
    m.setRoots([]);
    await sleep(2500);
    console.log('root removed from the workspace -> processes', m.relay.pids().length, '(ended at once)');
    page.close(); await m.relay.close();
}
heading(20, 'two roots with Python and C++ open: four servers, each for its own root only');
{
    const a = scratch('g20a-'); const b = scratch('g20b-');
    writeTree(a, { 'a.py': 'def only_in_a() -> int:\n    return 1\n', 'a.cpp': 'int only_in_a() { return 1; }\n' });
    writeTree(b, { 'b.py': 'from a import only_in_a\nonly_in_a()\n', 'b.cpp': 'int use() { return only_in_a(); }\n' });
    const m = makeRelay({ roots: [{ key: 'ra', dir: a }, { key: 'rb', dir: b }] });
    const page = new Page(m.relay);
    await page.initialize(PY); await page.initialize(CPP);
    for (const [k, f, ch, lang] of [['ra', 'a.py', PY, 'python'], ['ra', 'a.cpp', CPP, 'cpp'], ['rb', 'b.py', PY, 'python'], ['rb', 'b.cpp', CPP, 'cpp']]) {
        page.open(ch, pageUri(k, f), lang, readFileSync(join(k === 'ra' ? a : b, f), 'utf8'));
    }
    await sleep(8000);
    console.log('processes ->', m.relay.pids().length, '(pyright:', pids(/langserver\.index\.js/).length, 'clangd:', pids(/clangd/).length, ')');
    const d = await page.diagnostics(PY, pageUri('rb', 'b.py'), (x) => x.length > 0, 20000).catch(() => null);
    console.log('rb/b.py imports a symbol of ra ->', d ? show(d.payload.params.diagnostics.map((x) => x.message.split('\n')[0])) : 'no diagnostic', '(an unresolved import: a definition in one root never resolves into another)');
    page.close(); await m.relay.close();
}
heading(22, 'a file renamed while open, inside oculus (Files view rename) and outside');
{
    const dir = scratch('g22-');
    writeTree(dir, { 'old.py': 'x: int = "s"\n' });
    const m = makeRelay({ roots: [{ key: 'p', dir }] });
    const page = new Page(m.relay);
    await page.initialize(PY);
    page.open(PY, pageUri('p', 'old.py'), 'python', 'x: int = "s"\n');
    await page.diagnostics(PY, pageUri('p', 'old.py'), (x) => x.length > 0, 60000);
    page.notify(PY, 'textDocument/didClose', { textDocument: { uri: pageUri('p', 'old.py') } });
    renameSync(join(dir, 'old.py'), join(dir, 'new.py'));
    page.open(PY, pageUri('p', 'new.py'), 'python', 'x: int = "s"\n');
    const d = await page.diagnostics(PY, pageUri('p', 'new.py'), (x) => x.length > 0, 20000);
    console.log('inside oculus: didClose(old) + didOpen(new) -> diagnostics for the new path', show(d.payload.params.diagnostics.map((x) => x.message.split('\n')[0])), '| publishes for the old path (diagnostic count of each):', show(page.frames.filter((f) => f.payload.params?.uri === pageUri('p', 'old.py')).map((f) => f.payload.params.diagnostics.length)));
    page.close(); await m.relay.close();
}
heading(23, 'names with upper-case letters, parentheses, a space, NFD on disk');
{
    const dir = scratch('g23 (x)-');
    const nfd = 'cafe\u0301.py';
    writeTree(dir, { 'Fig(1).py': 'X: int = "s"\n', [nfd]: 'Y: int = "s"\n' });
    const m = makeRelay({ roots: [{ key: 'My Root(1)', dir }] });
    const page = new Page(m.relay);
    await page.initialize(PY);
    for (const f of ['Fig(1).py', nfd]) page.open(PY, pageUri('My Root(1)', f), 'python', readFileSync(join(dir, f), 'utf8'));
    for (const f of ['Fig(1).py', nfd]) {
        const d = await page.diagnostics(PY, pageUri('My Root(1)', f), (x) => x.length > 0, 60000);
        const h = await page.request(PY, 'textDocument/hover', { textDocument: { uri: pageUri('My Root(1)', f) }, position: { line: 0, character: 0 } });
        console.log(`${f.normalize('NFC')}: published under`, d.payload.params.uri, '| hover ->', show(h.result?.contents?.value ?? h.error));
    }
    page.close(); await m.relay.close();
}
heading(25, 'an empty file served; an untitled tab (no root, no path) gets no server');
{
    const dir = scratch('g25-');
    writeTree(dir, { 'empty.py': '' });
    const m = makeRelay({ roots: [{ key: 'p', dir }] });
    const page = new Page(m.relay);
    await page.initialize(PY);
    page.open(PY, pageUri('p', 'empty.py'), 'python', '');
    const s = await page.ready(PY);
    console.log('empty file ->', show(s.payload), '| processes', m.relay.pids().length);
    page.close(); await m.relay.close();
}
heading(49, 'Python-language files that are not .py or .pyi');
{
    const dir = scratch('g49-');
    writeTree(dir, { 'x.gyp': 'v: int = "s"\n', 'x.ipython': 'v: int = "s"\n', 'x.python': 'v: int = "s"\n' });
    const m = makeRelay({ roots: [{ key: 'p', dir }] });
    const page = new Page(m.relay);
    await page.initialize(PY);
    for (const f of ['x.gyp', 'x.ipython', 'x.python']) page.open(PY, pageUri('p', f), 'python', 'v: int = "s"\n');
    for (const f of ['x.gyp', 'x.ipython', 'x.python']) {
        const d = await page.diagnostics(PY, pageUri('p', f), (x) => x.length > 0, 60000).catch(() => null);
        console.log(f, '->', d ? show(d.payload.params.diagnostics.map((x) => x.message.split('\n')[0])) : 'no diagnostic');
    }
    page.close(); await m.relay.close();
}
heading(56, 'Show Language Server Output: a missing clangd and a running pyright');
{
    const dir = scratch('g56-');
    writeTree(dir, { 'a.py': 'x = 1\n', 'a.cpp': 'int x;\n' });
    const saved = process.env.PATH; process.env.PATH = '/usr/bin/nonexistent';
    const m = makeRelay({ roots: [{ key: 'p', dir }] });
    const page = new Page(m.relay);
    await page.initialize(CPP); await page.initialize(PY);
    page.open(CPP, pageUri('p', 'a.cpp'), 'cpp', 'int x;\n');
    await page.ready(CPP);
    process.env.PATH = saved;
    page.send(CPP, { oculus: 'output', root: 'p' });
    const o = await page.until((f) => f.channel === CPP && f.payload.oculus === 'output', 'output', 10000);
    console.log('clangd (not found) output ->', show(o.payload.lines));
    page.open(PY, pageUri('p', 'a.py'), 'python', 'x = 1\n');
    await page.ready(PY);
    page.send(PY, { oculus: 'output', root: 'p' });
    const o2 = await page.until((f) => f.channel === PY && f.payload.oculus === 'output', 'output', 10000);
    console.log('pyright output ->', show({ append: o2.payload.append, lines: o2.payload.lines.slice(0, 3) }, 400));
    page.notify(PY, 'textDocument/didChange', { textDocument: { uri: pageUri('p', 'a.py'), version: 2 }, contentChanges: [{ text: 'x: int = "s"\n' }] });
    await sleep(2500);
    const grown = page.frames.filter((f) => f.channel === PY && f.payload.oculus === 'output');
    console.log('output frames after a change ->', grown.length, '| last append:', show(grown.at(-1).payload.append), 'lines', grown.at(-1).payload.lines.length);
    page.send(PY, { oculus: 'output_off', root: 'p' });
    const before = page.frames.length;
    page.notify(PY, 'textDocument/didChange', { textDocument: { uri: pageUri('p', 'a.py'), version: 3 }, contentChanges: [{ text: 'x: int = 1\n' }] });
    await sleep(2500);
    console.log('after output_off, output frames sent ->', page.frames.slice(before).filter((f) => f.payload.oculus === 'output').length);
    page.close(); await m.relay.close();
}
process.exit(0);
```

#### `g2-misc.mjs`

```js
import { readFileSync, writeFileSync, mkdirSync, rmSync, renameSync, cpSync, symlinkSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { makeRelay, Page, pageUri, heading, show, sleep, scratch, writeTree } from './case-lib.mjs';

const PY = 'lsp:python';
const CPP = 'lsp:cpp';
const pids = (re) => execFileSync('ps', ['-axo', 'pid,command']).toString().split('\n').filter((l) => re.test(l) && !/grep|g1-misc/.test(l)).map((l) => l.trim().split(/\s+/)[0]);

heading(23, 'names with upper-case letters, parentheses, a space, NFD on disk');
{
    const dir = scratch('g23 (x)-');
    const nfd = 'cafe\u0301.py';
    writeTree(dir, { 'Fig(1).py': 'X: int = "s"\n', [nfd]: 'Y: int = "s"\n' });
    const m = makeRelay({ roots: [{ key: 'My Root(1)', dir }] });
    const page = new Page(m.relay);
    await page.initialize(PY);
    for (const f of ['Fig(1).py', nfd]) page.open(PY, pageUri('My Root(1)', f), 'python', readFileSync(join(dir, f), 'utf8'));
    for (const f of ['Fig(1).py', nfd]) {
        const d = await page.diagnostics(PY, pageUri('My Root(1)', f), (x) => x.length > 0, 60000);
        const h = await page.request(PY, 'textDocument/hover', { textDocument: { uri: pageUri('My Root(1)', f) }, position: { line: 0, character: 0 } });
        console.log(`${f.normalize('NFC')}: published under`, d.payload.params.uri, '| hover ->', show(h.result?.contents?.value ?? h.error));
    }
    page.close(); await m.relay.close();
}
heading(25, 'an empty file served; an untitled tab (no root, no path) gets no server');
{
    const dir = scratch('g25-');
    writeTree(dir, { 'empty.py': '' });
    const m = makeRelay({ roots: [{ key: 'p', dir }] });
    const page = new Page(m.relay);
    await page.initialize(PY);
    page.open(PY, pageUri('p', 'empty.py'), 'python', '');
    const s = await page.ready(PY);
    console.log('empty file ->', show(s.payload), '| processes', m.relay.pids().length);
    page.close(); await m.relay.close();
}
heading(49, 'Python-language files that are not .py or .pyi');
{
    const dir = scratch('g49-');
    writeTree(dir, { 'x.gyp': 'v: int = "s"\n', 'x.ipython': 'v: int = "s"\n', 'x.python': 'v: int = "s"\n' });
    const m = makeRelay({ roots: [{ key: 'p', dir }] });
    const page = new Page(m.relay);
    await page.initialize(PY);
    for (const f of ['x.gyp', 'x.ipython', 'x.python']) page.open(PY, pageUri('p', f), 'python', 'v: int = "s"\n');
    for (const f of ['x.gyp', 'x.ipython', 'x.python']) {
        const d = await page.diagnostics(PY, pageUri('p', f), (x) => x.length > 0, 60000).catch(() => null);
        console.log(f, '->', d ? show(d.payload.params.diagnostics.map((x) => x.message.split('\n')[0])) : 'no diagnostic');
    }
    page.close(); await m.relay.close();
}
heading(56, 'Show Language Server Output: a missing clangd and a running pyright');
{
    const dir = scratch('g56-');
    writeTree(dir, { 'a.py': 'x = 1\n', 'a.cpp': 'int x;\n' });
    const saved = process.env.PATH; process.env.PATH = '/usr/bin/nonexistent';
    const m = makeRelay({ roots: [{ key: 'p', dir }] });
    const page = new Page(m.relay);
    await page.initialize(CPP); await page.initialize(PY);
    page.open(CPP, pageUri('p', 'a.cpp'), 'cpp', 'int x;\n');
    await page.ready(CPP);
    process.env.PATH = saved;
    page.send(CPP, { oculus: 'output', root: 'p' });
    const o = await page.until((f) => f.channel === CPP && f.payload.oculus === 'output', 'output', 10000);
    console.log('clangd (not found) output ->', show(o.payload.lines));
    page.open(PY, pageUri('p', 'a.py'), 'python', 'x = 1\n');
    await page.ready(PY);
    page.send(PY, { oculus: 'output', root: 'p' });
    const o2 = await page.until((f) => f.channel === PY && f.payload.oculus === 'output', 'output', 10000);
    console.log('pyright output ->', show({ append: o2.payload.append, lines: o2.payload.lines.slice(0, 3) }, 400));
    page.notify(PY, 'textDocument/didChange', { textDocument: { uri: pageUri('p', 'a.py'), version: 2 }, contentChanges: [{ text: 'x: int = "s"\n' }] });
    await sleep(2500);
    const grown = page.frames.filter((f) => f.channel === PY && f.payload.oculus === 'output');
    console.log('output frames after a change ->', grown.length, '| last append:', show(grown.at(-1).payload.append), 'lines', grown.at(-1).payload.lines.length);
    page.send(PY, { oculus: 'output_off', root: 'p' });
    const before = page.frames.length;
    page.notify(PY, 'textDocument/didChange', { textDocument: { uri: pageUri('p', 'a.py'), version: 3 }, contentChanges: [{ text: 'x: int = 1\n' }] });
    await sleep(2500);
    console.log('after output_off, output frames sent ->', page.frames.slice(before).filter((f) => f.payload.oculus === 'output').length);
    page.close(); await m.relay.close();
}
process.exit(0);
```

#### `g3-relay.mjs`

```js
import { readFileSync, writeFileSync, mkdirSync, symlinkSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { makeRelay, Page, pageUri, heading, show, sleep, scratch, writeTree, OCULUS } from './case-lib.mjs';
const PY = 'lsp:python';
const CPP = 'lsp:cpp';
const HERE = '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases';
const stubSpawn = (mode, log) => (_command, _args, options) =>
    spawn(process.execPath, [join(HERE, 'stub-server.mjs'), mode, log ?? ''], { ...options, stdio: ['pipe', 'pipe', 'pipe'] });

heading(17, 'a slow server request: other requests answered meanwhile; a cancelled request gets no late answer');
{
    const dir = scratch('g17-');
    writeTree(dir, { 'a.py': 'x = 1\n', 'a.cpp': 'int main() { return 0; }\n' });
    const slow = stubSpawn('slow-hover');
    const m = makeRelay({ roots: [{ key: 'p', dir }], options: { spawn: (c, a, o) => (String(c).includes('clangd') || a.some((x) => String(x).includes('clangd')) ? spawn(c, a, o) : slow(c, a, o)) } });
    const page = new Page(m.relay);
    await page.initialize(PY); await page.initialize(CPP);
    page.open(PY, pageUri('p', 'a.py'), 'python', 'x = 1\n');
    page.open(CPP, pageUri('p', 'a.cpp'), 'cpp', 'int main() { return 0; }\n');
    await page.ready(PY); await page.ready(CPP);
    const t0 = Date.now();
    const slowAsk = page.request(PY, 'textDocument/hover', { textDocument: { uri: pageUri('p', 'a.py') }, position: { line: 0, character: 0 } }, 20000);
    const cancelled = (async () => {
        page.send(PY, { jsonrpc: '2.0', id: 900, method: 'textDocument/hover', params: { textDocument: { uri: pageUri('p', 'a.py') }, position: { line: 0, character: 0 } } });
        await sleep(300);
        page.send(PY, { jsonrpc: '2.0', method: '$/cancelRequest', params: { id: 900 } });
    })();
    const other = await page.request(CPP, 'textDocument/documentSymbol', { textDocument: { uri: pageUri('p', 'a.cpp') } }, 20000);
    console.log(`clangd answered while the stub held its hover: ${Date.now() - t0} ms, ${other.result ? 'result' : show(other.error)}`);
    await cancelled;
    const c900 = await page.until((f) => f.channel === PY && f.payload.id === 900, 'cancelled answer', 5000);
    console.log('cancelled request 900 answered at once with', show(c900.payload.error ?? c900.payload.result));
    const first = await slowAsk;
    console.log(`slow request answered after ${Date.now() - t0} ms with`, show(first.result ?? first.error));
    await sleep(500);
    console.log('frames for id 900 in all:', page.frames.filter((f) => f.payload.id === 900).length, '(the stub answers it at 10 s: that late answer is not applied)');
    await sleep(10500);
    console.log('frames for id 900 after the stub answered it late:', page.frames.filter((f) => f.payload.id === 900).length);
    page.close(); await m.relay.close();
}

heading(29, 'a page reload: the new page takes the old page servers over within 60 s; no didOpen twice');
{
    const dir = scratch('g29-');
    writeTree(dir, { 'a.py': 'x = 1\n' });
    const log = join(scratch('g29log-'), 'received.txt');
    const m = makeRelay({ roots: [{ key: 'p', dir }], options: { spawn: stubSpawn('log', log) } });
    const one = new Page(m.relay);
    await one.initialize(PY);
    one.open(PY, pageUri('p', 'a.py'), 'python', 'x = 1\n');
    await one.ready(PY);
    const pid = m.relay.pids()[0];
    one.close();
    await sleep(3000);
    console.log('old page closed 3 s ago: processes', m.relay.pids().length, 'pid', pid);
    const two = new Page(m.relay);
    await two.initialize(PY);
    two.open(PY, pageUri('p', 'a.py'), 'python', 'x = 1\n');
    const s = await two.ready(PY);
    await sleep(500);
    console.log('reloaded page: state', show(s.payload), '| processes', m.relay.pids().length, 'pid', m.relay.pids()[0], '(same pid: taken over, one spawn)');
    two.open(PY, pageUri('p', 'a.py'), 'python', 'x = 1\n');
    await sleep(500);
    const seen = readFileSync(log, 'utf8').trim().split('\n');
    console.log('methods the server received, in order:', show(seen, 600));
    console.log('didOpen count:', seen.filter((x) => x === 'textDocument/didOpen').length, '| didClose count:', seen.filter((x) => x === 'textDocument/didClose').length, '(open, close on takeover, open again: never two opens in a row; a repeated didOpen of the open doc is dropped)');
    two.close(); await m.relay.close();
}

heading(30, 'the relay refuses: no token, bad page URIs, didChangeWorkspaceFolders, a second initialize');
{
    const dir = scratch('g30-');
    const outside = scratch('g30o-');
    writeTree(dir, { 'a.py': 'x = 1\n' }); writeTree(outside, { 'secret.py': 's = 1\n' });
    symlinkSync(join(outside, 'secret.py'), join(dir, 'leak.py'));
    symlinkSync(outside, join(dir, 'up'));
    const log = join(scratch('g30log-'), 'received.txt');
    const m = makeRelay({ roots: [{ key: 'p', dir }], options: { spawn: stubSpawn('log', log) } });
    const nope = new Page(m.relay, { token: false });
    nope.send(PY, { jsonrpc: '2.0', id: 1, method: 'initialize', params: {} });
    nope.open(PY, pageUri('p', 'a.py'), 'python', 'x = 1\n');
    await sleep(1500);
    console.log('no token: frames back', nope.frames.length, '| processes', m.relay.pids().length);
    const page = new Page(m.relay);
    await page.initialize(PY);
    const bad = {
        'root empty': 'oculus-file:////a.py',
        'unknown root': 'oculus-file:///other/a.py',
        'absolute path': 'file:///etc/passwd',
        'dot dot': 'oculus-file:///p/../a.py',
        'encoded slash dot dot': 'oculus-file:///p/x%2F..%2F..%2Fa.py',
        'symlink to a file out': 'oculus-file:///p/leak.py',
        'symlink to a folder out': 'oculus-file:///p/up/secret.py'
    };
    for (const [name, uri] of Object.entries(bad)) page.open(PY, uri, 'python', 's = 1\n');
    await sleep(2000);
    console.log('refused page URIs:', show(Object.keys(bad)), '| processes', m.relay.pids().length, '| log exists', existsSync(log));
    page.open(PY, pageUri('p', 'a.py'), 'python', 'x = 1\n');
    await page.ready(PY);
    const before = readFileSync(log, 'utf8').trim().split('\n').length;
    page.notify(PY, 'workspace/didChangeWorkspaceFolders', { event: { added: [{ uri: 'file:///etc', name: 'etc' }], removed: [] } });
    page.send(PY, { jsonrpc: '2.0', id: 77, method: 'initialize', params: {} });
    await sleep(1500);
    const after = readFileSync(log, 'utf8').trim().split('\n');
    console.log('server received before:', before, 'after didChangeWorkspaceFolders and a second initialize:', after.length, '| answer frames to the second initialize:', page.frames.filter((f) => f.payload.id === 77).length, '| processes', m.relay.pids().length);
    console.log('methods:', show(after));
    page.close(); await m.relay.close();
}

heading(32, 'a failing server: refused, no_answer; the socket and the page other channels go on');
{
    const dir = scratch('g32-');
    writeTree(dir, { 'a.py': 'x = 1\n' });
    const m = makeRelay({ roots: [{ key: 'p', dir }], options: { spawn: stubSpawn('error-init') } });
    const page = new Page(m.relay);
    await page.initialize(PY);
    page.open(PY, pageUri('p', 'a.py'), 'python', 'x = 1\n');
    const s = await page.ready(PY);
    console.log('server answers initialize with an error ->', show(s.payload));
    page.close(); await m.relay.close();
    const m2 = makeRelay({ roots: [{ key: 'p', dir }], options: { spawn: stubSpawn('silent-init') } });
    const page2 = new Page(m2.relay);
    await page2.initialize(PY);
    const t0 = Date.now();
    page2.open(PY, pageUri('p', 'a.py'), 'python', 'x = 1\n');
    const s2 = await page2.ready(PY, 45000);
    console.log(`server never answers initialize -> ${show(s2.payload)} after ${Date.now() - t0} ms`);
    console.log('the sink stays usable: a frame on another channel is still delivered ->', (() => { m2.relay.inbound(page2.sink, JSON.stringify({ channel: 'lsp:cpp', payload: { jsonrpc: '2.0', id: 5, method: 'initialize', params: {} } }), true); return 'sent'; })());
    await sleep(500);
    console.log('answer to the cpp initialize:', page2.frames.some((f) => f.channel === CPP && f.payload.id === 5));
    page2.close(); await m2.relay.close();
}

heading(21, 'large files served by real servers');
{
    const big = '/Users/axelfaes/workspace/game-engine/src/engine/tests/src/main.cpp';
    const text = readFileSync(big, 'utf8');
    const dir = scratch('g21-');
    writeTree(dir, { 'main.cpp': text });
    const m = makeRelay({ roots: [{ key: 'p', dir }] });
    const page = new Page(m.relay);
    await page.initialize(CPP);
    const t0 = Date.now();
    page.open(CPP, pageUri('p', 'main.cpp'), 'cpp', text);
    await page.ready(CPP);
    const sym = await page.request(CPP, 'textDocument/documentSymbol', { textDocument: { uri: pageUri('p', 'main.cpp') } }, 120000);
    console.log(`${text.length} byte cpp file: ready and ${Array.isArray(sym.result) ? sym.result.length + ' symbols' : show(sym.error)} after ${Date.now() - t0} ms`);
    page.close(); await m.relay.close();
}
process.exit(0);
```

#### `g3b-30.mjs`

```js
import { readFileSync, writeFileSync, mkdirSync, symlinkSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { makeRelay, Page, pageUri, heading, show, sleep, scratch, writeTree, OCULUS } from './case-lib.mjs';
const PY = 'lsp:python';
const CPP = 'lsp:cpp';
const HERE = '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases';
const stubSpawn = (mode, log) => (_command, _args, options) =>
    spawn(process.execPath, [join(HERE, 'stub-server.mjs'), mode, log ?? ''], { ...options, stdio: ['pipe', 'pipe', 'pipe'] });

heading(30, 'the relay refuses: no token, bad page URIs, didChangeWorkspaceFolders, a second initialize');
{
    const dir = scratch('g30-');
    const outside = scratch('g30o-');
    writeTree(dir, { 'a.py': 'x = 1\n' }); writeTree(outside, { 'secret.py': 's = 1\n' });
    symlinkSync(join(outside, 'secret.py'), join(dir, 'leak.py'));
    symlinkSync(outside, join(dir, 'up'));
    const log = join(scratch('g30log-'), 'received.txt');
    const m = makeRelay({ roots: [{ key: 'p', dir }], options: { spawn: stubSpawn('log', log) } });
    const nope = new Page(m.relay, { token: false });
    nope.send(PY, { jsonrpc: '2.0', id: 1, method: 'initialize', params: {} });
    nope.open(PY, pageUri('p', 'a.py'), 'python', 'x = 1\n');
    await sleep(1500);
    console.log('no token: frames back', nope.frames.length, '| processes', m.relay.pids().length);
    const page = new Page(m.relay);
    await page.initialize(PY);
    const bad = {
        'root empty': 'oculus-file:////a.py',
        'unknown root': 'oculus-file:///other/a.py',
        'absolute path': 'file:///etc/passwd',
        'dot dot': 'oculus-file:///p/../a.py',
        'encoded slash dot dot': 'oculus-file:///p/x%2F..%2F..%2Fa.py',
        'symlink to a file out': 'oculus-file:///p/leak.py',
        'symlink to a folder out': 'oculus-file:///p/up/secret.py'
    };
    for (const [name, uri] of Object.entries(bad)) page.open(PY, uri, 'python', 's = 1\n');
    await sleep(2000);
    console.log('refused page URIs:', show(Object.keys(bad)), '| processes', m.relay.pids().length, '| log exists', existsSync(log));
    page.open(PY, pageUri('p', 'a.py'), 'python', 'x = 1\n');
    await page.ready(PY);
    await sleep(1500);
    const before = readFileSync(log, 'utf8').trim().split('\n').length;
    page.notify(PY, 'workspace/didChangeWorkspaceFolders', { event: { added: [{ uri: 'file:///etc', name: 'etc' }], removed: [] } });
    page.send(PY, { jsonrpc: '2.0', id: 77, method: 'initialize', params: {} });
    await sleep(1500);
    const after = readFileSync(log, 'utf8').trim().split('\n');
    console.log('server received before:', before, 'after didChangeWorkspaceFolders and a second initialize:', after.length, '| answer frames to the second initialize:', page.frames.filter((f) => f.payload.id === 77).length, '| processes', m.relay.pids().length);
    console.log('methods:', show(after));
    page.close(); await m.relay.close();
}

process.exit(0);
```

#### `g4-big.mjs`

```js
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { makeRelay, Page, pageUri, heading, show, sleep, scratch, writeTree } from './case-lib.mjs';
const PY = 'lsp:python';
const CPP = 'lsp:cpp';
const rss = (pids) => pids.map((p) => Number(execFileSync('ps', ['-o', 'rss=', '-p', String(p)]).toString().trim() || 0)).reduce((a, b) => a + b, 0);
const procs = (re) => execFileSync('ps', ['-axo', 'pid,command']).toString().split('\n').filter((l) => re.test(l) && !/g4-big/.test(l)).length;

heading(21, 'the 439320 byte Python file of the linfoot venv, and one over 2 MiB');
{
    const file = '/Users/axelfaes/workspace/research-hub/projects/active/linfoot-estimator/code/vendor/venv/lib/python3.13/site-packages/torch/_torch_docs.py';
    const text = readFileSync(file, 'utf8');
    const root = '/Users/axelfaes/workspace/research-hub/projects/active/linfoot-estimator/code/vendor/venv/lib/python3.13/site-packages/torch';
    const m = makeRelay({ roots: [{ key: 'torch', dir: root }] });
    const page = new Page(m.relay);
    await page.initialize(PY);
    const t0 = Date.now();
    page.open(PY, pageUri('torch', '_torch_docs.py'), 'python', text);
    await page.ready(PY);
    const sym = await page.request(PY, 'textDocument/documentSymbol', { textDocument: { uri: pageUri('torch', '_torch_docs.py') } }, 120000);
    console.log(`${text.length} byte Python file: ready and ${Array.isArray(sym.result) ? sym.result.length + ' top-level symbols' : show(sym.error)} after ${Date.now() - t0} ms; pyright rss ${Math.round(rss(m.relay.pids()) / 1024)} MB`);
    page.close(); await m.relay.close();
}

heading(47, 'overlapping roots: ~/workspace beside cathedra, one cathedra file from each key');
{
    const home = process.env.HOME;
    const file = 'src/rite-dap/src/main.cpp';
    const text = readFileSync(`${home}/workspace/cathedra/${file}`, 'utf8');
    const m = makeRelay({ roots: [{ key: 'workspace', dir: `${home}/workspace` }, { key: 'cathedra', dir: `${home}/workspace/cathedra` }] });
    const page = new Page(m.relay);
    await page.initialize(CPP);
    page.open(CPP, pageUri('workspace', `cathedra/${file}`), 'cpp', text);
    page.open(CPP, pageUri('cathedra', file), 'cpp', text);
    await page.ready(CPP);
    await sleep(3000);
    const clangds = execFileSync('ps', ['-axo', 'pid,command']).toString().split('\n').filter((l) => /clangd/.test(l) && /compile-commands-dir/.test(l));
    console.log('relay processes', m.relay.pids().length, '| clangd processes of this run:', clangds.length);
    for (const l of clangds) console.log('  ', l.trim().replace(/--compile-commands-dir=\S+/, '--compile-commands-dir=<lsp folder>').slice(0, 220));
    const a = await page.request(CPP, 'textDocument/documentSymbol', { textDocument: { uri: pageUri('workspace', `cathedra/${file}`) } }, 60000);
    const b = await page.request(CPP, 'textDocument/documentSymbol', { textDocument: { uri: pageUri('cathedra', file) } }, 60000);
    console.log('symbols under each key:', Array.isArray(a.result) ? a.result.length : show(a.error), Array.isArray(b.result) ? b.result.length : show(b.error));
    const n = page.frames.length;
    page.notify(CPP, 'textDocument/didClose', { textDocument: { uri: pageUri('workspace', `cathedra/${file}`) } });
    await sleep(500);
    const again = await page.request(CPP, 'textDocument/documentSymbol', { textDocument: { uri: pageUri('cathedra', file) } }, 60000);
    console.log('after the tab under the workspace key closes, the other key still answers:', Array.isArray(again.result) ? again.result.length + ' symbols' : show(again.error));
    page.close(); await m.relay.close();
}

heading(47, 'a Python tab of the served root claude (~/.claude): one pyright, its memory');
{
    const home = process.env.HOME;
    const file = 'jobs/f3c61416/tmp/interleave_query.py';
    const text = readFileSync(`${home}/.claude/${file}`, 'utf8');
    const m = makeRelay({ roots: [{ key: 'claude', dir: `${home}/.claude` }] });
    const page = new Page(m.relay);
    await page.initialize(PY);
    const t0 = Date.now();
    page.open(PY, pageUri('claude', file), 'python', text);
    await page.ready(PY);
    let peak = 0;
    const sample = setInterval(() => { peak = Math.max(peak, rss(m.relay.pids())); }, 500);
    const out = await (async () => { page.send(PY, { oculus: 'output', root: 'claude' }); return page.until((f) => f.payload.oculus === 'output', 'output', 15000); })();
    await sleep(60000 - (Date.now() - t0));
    clearInterval(sample);
    const lines = (page.frames.filter((f) => f.payload.oculus === 'output').flatMap((f) => f.payload.lines));
    console.log('pyright processes', m.relay.pids().length, '| log lines naming source files:', show(lines.filter((l) => /source file/i.test(l))));
    console.log(`peak rss ${Math.round(peak / 1024)} MB, rss at 60 s ${Math.round(rss(m.relay.pids()) / 1024)} MB`);
    page.close(); await m.relay.close();
}
process.exit(0);
```

#### `g4b-47.mjs`

```js
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { makeRelay, Page, pageUri, heading, show, sleep, scratch, writeTree } from './case-lib.mjs';
const PY = 'lsp:python';
const CPP = 'lsp:cpp';
const rss = (pids) => pids.map((p) => Number(execFileSync('ps', ['-o', 'rss=', '-p', String(p)]).toString().trim() || 0)).reduce((a, b) => a + b, 0);
const procs = (re) => execFileSync('ps', ['-axo', 'pid,command']).toString().split('\n').filter((l) => re.test(l) && !/g4-big/.test(l)).length;

heading(47, 'overlapping roots: ~/workspace beside cathedra, one cathedra file from each key');
{
    const home = process.env.HOME;
    const file = 'src/rite-dap/src/main.cpp';
    const text = readFileSync(`${home}/workspace/cathedra/${file}`, 'utf8');
    const m = makeRelay({ roots: [{ key: 'workspace', dir: `${home}/workspace` }, { key: 'cathedra', dir: `${home}/workspace/cathedra` }] });
    const page = new Page(m.relay);
    await page.initialize(CPP);
    page.open(CPP, pageUri('workspace', `cathedra/${file}`), 'cpp', text);
    page.open(CPP, pageUri('cathedra', file), 'cpp', text);
    await page.ready(CPP);
    await sleep(3000);
    const clangds = execFileSync('ps', ['-axo', 'pid,command']).toString().split('\n').filter((l) => /clangd/.test(l) && /compile-commands-dir/.test(l));
    console.log('relay processes', m.relay.pids().length, '| clangd processes of this run:', clangds.length);
    for (const l of clangds) console.log('  ', l.trim().replace(/--compile-commands-dir=\S+/, '--compile-commands-dir=<lsp folder>').slice(0, 220));
    const a = await page.request(CPP, 'textDocument/documentSymbol', { textDocument: { uri: pageUri('workspace', `cathedra/${file}`) } }, 60000);
    const b = await page.request(CPP, 'textDocument/documentSymbol', { textDocument: { uri: pageUri('cathedra', file) } }, 60000);
    console.log('symbols under each key:', Array.isArray(a.result) ? a.result.length : show(a.error), Array.isArray(b.result) ? b.result.length : show(b.error));
    const n = page.frames.length;
    page.notify(CPP, 'textDocument/didClose', { textDocument: { uri: pageUri('workspace', `cathedra/${file}`) } });
    await sleep(500);
    const again = await page.request(CPP, 'textDocument/documentSymbol', { textDocument: { uri: pageUri('cathedra', file) } }, 60000);
    console.log('after the tab under the workspace key closes, the other key still answers:', Array.isArray(again.result) ? again.result.length + ' symbols' : show(again.error));
    page.close(); await m.relay.close();
}

process.exit(0);
```

#### `g5-watch.mjs`

```js
import { readFileSync, writeFileSync, renameSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { makeRelay, Page, pageUri, heading, show, sleep, scratch, writeTree } from './case-lib.mjs';
const HERE = '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases';
heading(22, 'a file renamed outside oculus while open: the server gets watched-file events');
const dir = scratch('g5-');
writeTree(dir, { 'old.py': 'x = 1\n', 'other.py': 'y = 1\n' });
const log = join(scratch('g5log-'), 'received.txt');
const m = makeRelay({ roots: [{ key: 'p', dir }], options: { spawn: (_c, _a, o) => spawn(process.execPath, [join(HERE, 'stub-server.mjs'), 'watch', log], { ...o, stdio: ['pipe', 'pipe', 'pipe'] }) } });
const page = new Page(m.relay);
await page.initialize('lsp:python');
page.open('lsp:python', pageUri('p', 'old.py'), 'python', 'x = 1\n');
await page.ready('lsp:python');
await sleep(1500);
renameSync(join(dir, 'other.py'), join(dir, 'renamed.py'));
writeFileSync(join(dir, 'fresh.py'), 'z = 1\n');
await sleep(3000);
console.log('what the server received:', show(readFileSync(log, 'utf8').trim().split('\n'), 800));
page.close(); await m.relay.close(); process.exit(0);
```

#### `g6-16.mjs`

```js
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { makeRelay, Page, pageUri, heading, show, sleep, scratch, writeTree } from './case-lib.mjs';
const HERE = '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/kept/cases';
heading(16, 'a server that never answers initialize: failed no_answer at 30 s, the process ended, queued requests answered with an error, the page stays usable');
const dir = scratch('g16-');
writeTree(dir, { 'a.py': 'x = 1\n' });
const children = [];
const m = makeRelay({ roots: [{ key: 'p', dir }], options: { spawn: (_c, _a, o) => { const c = spawn(process.execPath, [join(HERE, 'stub-server.mjs'), 'silent-init', ''], { ...o, stdio: ['pipe', 'pipe', 'pipe'] }); children.push(c); return c; } } });
const page = new Page(m.relay);
await page.initialize('lsp:python');
page.open('lsp:python', pageUri('p', 'a.py'), 'python', 'x = 1\n');
await sleep(500);
const t0 = Date.now();
page.send('lsp:python', { jsonrpc: '2.0', id: 200, method: 'textDocument/hover', params: { textDocument: { uri: pageUri('p', 'a.py') }, position: { line: 0, character: 0 } } });
const answer = await page.until((f) => f.payload.id === 200, 'hover answer', 45000);
console.log(`hover queued during the handshake answered after ${Date.now() - t0} ms with`, show(answer.payload.error ?? answer.payload.result));
const s = await page.ready('lsp:python');
console.log('state', show(s.payload));
await sleep(1500);
console.log('stub process alive after the failure:', children.map((c) => c.exitCode === null && c.signalCode === null), '| relay pids', m.relay.pids().length);
await page.request('lsp:cpp', 'initialize', { capabilities: {} }, 5000).then((a) => console.log('another channel still answers on the same socket:', Object.keys(a.result.capabilities).length > 0));
page.close(); await m.relay.close(); process.exit(0);
```

#### `g7-nodb.mjs`

```js
import { readFileSync, cpSync } from 'node:fs';
import { join } from 'node:path';
import { makeRelay, Page, pageUri, heading, show, sleep, scratch } from './case-lib.mjs';

const CH = 'lsp:cpp';
const SCOT = '/Users/axelfaes/workspace/scotoma';
heading(19, 'scotoma with no compile database and no .oculus/cpp.yml: references of cellSolid are limited to the open files');
const dir = scratch('g7-');
cpSync(join(SCOT, 'src'), join(dir, 'src'), { recursive: true });
cpSync(join(SCOT, 'tools/pvsneslib/pvsneslib/include'), join(dir, 'tools/pvsneslib/pvsneslib/include'), { recursive: true });
const { relay } = makeRelay({ roots: [{ key: 'scot', dir }] });
const page = new Page(relay);
await page.initialize(CH);
for (const [file, lang] of [['src/scotoma.h', 'cpp'], ['src/spr.c', 'c']]) page.open(CH, pageUri('scot', file), lang, readFileSync(join(dir, file), 'utf8'));
await page.ready(CH);
await sleep(6000);
const choices = await (async () => {
    page.send(CH, { oculus: 'choices', root: 'scot' });
    return (await page.until((f) => f.payload.oculus === 'choices', 'choices', 30000)).payload;
})();
console.log('compile database in force ->', show(choices.database), '| databases listed ->', show(choices.databases));
const header = readFileSync(join(dir, 'src/scotoma.h'), 'utf8').split('\n');
const line = header.findIndex((l) => l.startsWith('u8 cellSolid('));
const refs = await page.request(CH, 'textDocument/references', {
    textDocument: { uri: pageUri('scot', 'src/scotoma.h') },
    position: { line, character: 4 },
    context: { includeDeclaration: true }
});
const places = (refs.result ?? []).map((l) => `${l.uri.split('/').slice(-1)[0]}:${l.range.start.line + 1}`);
console.log('files that use cellSolid on disk: scotoma.h:40, spr.c:154, main.c:127, region.c:265 (the last two are not open)');
console.log('references with scotoma.h and spr.c open ->', show(places));
const hover = await page.request(CH, 'textDocument/hover', { textDocument: { uri: pageUri('scot', 'src/scotoma.h') }, position: { line, character: 4 } });
console.log('single-file hover on the declaration ->', show(hover.result ?? hover.error, 200));
page.close(); await relay.close(); process.exit(0);
```

#### `h-token.mjs`

```js
// Case 28: a restarted server mints a new token. Usage: node h-token.mjs <oculus dir> <port> <phase1|phase2> <token file>
import { execFile } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
const [oculus, port, phase, tokenFile] = process.argv.slice(2);
const { default: WebSocket } = await import(pathToFileURL(join(oculus, 'node_modules/ws/wrapper.mjs')).href);
const run = promisify(execFile);
const origin = `http://127.0.0.1:${port}`;
const FILE = 'tools/present/build.py';
const text = readFileSync(join(oculus, '..', '..', FILE), 'utf8');
const sleep = (s) => new Promise((resolve) => setTimeout(resolve, s * 1000));
const servers = async () => (await run('ps', ['-axo', 'pid,command'])).stdout.split('\n').filter((l) => /langserver\.index\.js|clangd/.test(l) && !/h-token|grep/.test(l)).map((l) => l.trim().split(/\s+/)[0]);
async function tokenNow() {
    const body = await (await fetch(`${origin}/__data.json`, { headers: { origin, 'sec-fetch-site': 'same-origin' } })).json();
    const flat = body.nodes.find((node) => node?.type === 'data').data;
    return flat[flat[0].token];
}
function page(subscribe) {
    const socket = new WebSocket(`ws://127.0.0.1:${port}/ws`, { headers: { origin } });
    const frames = [];
    socket.on('message', (raw) => frames.push(JSON.parse(String(raw))));
    const send = (payload) => socket.send(JSON.stringify({ channel: 'lsp:python', payload }));
    const uri = `oculus-file:///hub/${FILE}`;
    return {
        frames,
        socket,
        opened: new Promise((resolve) => socket.once('open', resolve)),
        subscribe: (channels, token) => socket.send(JSON.stringify({ type: 'subscribe', channels, token })),
        initialize: (id) => send({ jsonrpc: '2.0', id, method: 'initialize', params: { capabilities: {} } }),
        open: () => send({ jsonrpc: '2.0', method: 'textDocument/didOpen', params: { textDocument: { uri, languageId: 'python', version: 1, text } } }),
        change: (version, newText) => send({ jsonrpc: '2.0', method: 'textDocument/didChange', params: { textDocument: { uri, version }, contentChanges: [{ text: newText }] } }),
        hover: (id) => send({ jsonrpc: '2.0', id, method: 'textDocument/hover', params: { textDocument: { uri }, position: { line: 23, character: 24 } } }),
        answered: (id) => frames.some((one) => one.payload?.id === id),
        states: () => frames.filter((one) => one.payload?.oculus === 'state').map((one) => one.payload.state).join(','),
        close: () => socket.close()
    };
}
if (phase === 'phase1') {
    const token = await tokenNow();
    writeFileSync(tokenFile, token);
    const a = page();
    await a.opened;
    a.subscribe(['lsp:python'], token);
    a.initialize(1);
    a.open();
    for (let i = 0; i < 90 && !a.states().includes('ready'); i += 1) await sleep(1);
    console.log('phase 1: token held by the page', token.slice(0, 6) + '..., states', a.states(), '| pyright pids', (await servers()).join(','));
    a.hover(2);
    await sleep(4);
    console.log('phase 1: hover answered', a.answered(2));
    process.exit(0);
}
const old = readFileSync(tokenFile, 'utf8');
const fresh = await tokenNow();
console.log(`phase 2: new token ${fresh.slice(0, 6)}... differs from the page's ${old.slice(0, 6)}...: ${fresh !== old}`);
console.log('phase 2: pyright pids after the restart', (await servers()).join(',') || 'none');
const b = page();
await b.opened;
b.subscribe(['lsp:python'], old);
b.initialize(11);
b.open();
await sleep(4);
console.log('phase 2: socket reconnected with the old token: frames received', b.frames.length, '(lsp frames refused)');
b.subscribe([], fresh);
await sleep(0.5);
b.initialize(12);
b.open();
for (let i = 0; i < 90 && !b.states().includes('ready'); i += 1) await sleep(1);
b.hover(13);
await sleep(4);
console.log('phase 2: after a subscribe of no channels carrying the new token: initialize answered', b.answered(12), '| states', b.states(), '| hover answered', b.answered(13));
const pid = (await servers());
console.log('phase 2: pyright pids', pid.join(','));
b.close();
await sleep(1);
process.exit(0);
```

#### `stub-server.mjs`

```js
// A stand-in language server for the case runs. argv[2] is the mode: error-init, silent-init, slow-hover, log.
import { appendFileSync } from 'node:fs';
const mode = process.argv[2];
const logFile = process.argv[3];
let buffer = Buffer.alloc(0);
const timers = new Map();
const write = (message) => {
    const body = Buffer.from(JSON.stringify({ jsonrpc: '2.0', ...message }));
    process.stdout.write(Buffer.concat([Buffer.from(`Content-Length: ${body.length}\r\n\r\n`), body]));
};
const handle = (message) => {
    if (logFile) appendFileSync(logFile, `${message.method ?? 'response'}${message.method === 'workspace/didChangeWatchedFiles' ? ' ' + JSON.stringify(message.params.changes.map((c) => [c.type, c.uri.split('/').pop()])) : ''}\n`);
    if (message.method === 'initialize') {
        if (mode === 'silent-init') return;
        if (mode === 'error-init') return write({ id: message.id, error: { code: -32603, message: 'refused' } });
        if (mode === 'watch') setTimeout(() => write({ id: 'reg1', method: 'client/registerCapability', params: { registrations: [{ id: 'w1', method: 'workspace/didChangeWatchedFiles', registerOptions: { watchers: [{ globPattern: '**/*.py' }] } }] } }), 300);
        return write({ id: message.id, result: { capabilities: { textDocumentSync: 2, hoverProvider: true } } });
    }
    if (message.method === 'shutdown') return write({ id: message.id, result: null });
    if (message.method === 'exit') process.exit(0);
    if (message.method === 'textDocument/hover') {
        const delay = mode === 'slow-hover' ? 10000 : 0;
        timers.set(message.id, setTimeout(() => { timers.delete(message.id); write({ id: message.id, result: { contents: `hover after ${delay} ms` } }); }, delay));
        return;
    }
    if (message.method === '$/cancelRequest') {
        const timer = timers.get(message.params.id);
        if (timer) { clearTimeout(timer); timers.delete(message.params.id); write({ id: message.params.id, error: { code: -32800, message: 'cancelled' } }); }
        return;
    }
    if (message.id !== undefined && message.method) write({ id: message.id, result: null });
};
process.stdin.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    for (;;) {
        const end = buffer.indexOf('\r\n\r\n');
        if (end < 0) return;
        const length = Number(/Content-Length: (\d+)/i.exec(buffer.slice(0, end).toString())[1]);
        if (buffer.length < end + 4 + length) return;
        const body = buffer.slice(end + 4, end + 4 + length).toString();
        buffer = buffer.slice(end + 4 + length);
        handle(JSON.parse(body));
    }
});
```

## The first proof

### Run 1: the relay over a real pyright and a real clangd

Script `first-proof-1.mjs` (quoted whole), run as `cd /tmp && node first-proof-1.mjs /Users/axelfaes/workspace/research-hub/.agents/worktrees/D23/tools/oculus`:

```js
// First proof, run 1: the relay over a real pyright and a real clangd.
// Usage: node first-proof-1.mjs <oculus dir>
import { mkdtempSync, mkdirSync, writeFileSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const oculus = process.argv[2];
if (oculus === undefined) throw new Error('usage: node first-proof-1.mjs <oculus dir>');
const { Relay } = await import(pathToFileURL(join(oculus, 'src/lib/server/machine/lsp/relay.ts')).href);

const base = realpathSync(mkdtempSync(join(tmpdir(), 'first-proof-')));
const root = join(base, 'proj');
mkdirSync(root);
writeFileSync(join(root, 'util.py'), 'def greet(name: str) -> str:\n    return "hi " + name\n');
const appPy = 'from util import greet\n\ndef main() -> int:\n    message: str = greet("x")\n    return "not an int"\n';
writeFileSync(join(root, 'app.py'), appPy);
writeFileSync(join(root, 'lib.h'), 'int add(int a, int b);\n');
const mainCpp = '#include "lib.h"\nint main() {\n    int x = add(1, 2);\n    return y;\n}\n';
writeFileSync(join(root, 'main.cpp'), mainCpp);

const frames = [];
const waiting = [];
const sink = {
    send: (text) => {
        const frame = JSON.parse(text);
        frames.push(frame);
        for (const wait of [...waiting]) wait(frame);
        return Promise.resolve();
    },
    close: () => undefined
};
const relay = new Relay({
    engine: oculus,
    node: process.execPath,
    roots: () => [{ key: 'proj', dir: root }],
    lspFolder: () => join(base, 'lsp'),
    approvals: () => join(base, 'approvals.json')
});

function until(test, label, ms = 90000) {
    const found = frames.find(test);
    if (found !== undefined) return Promise.resolve(found);
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`timed out waiting for ${label}`)), ms);
        const wait = (frame) => {
            if (!test(frame)) return;
            clearTimeout(timer);
            waiting.splice(waiting.indexOf(wait), 1);
            resolve(frame);
        };
        waiting.push(wait);
    });
}

let next = 100;
function send(channel, payload) {
    relay.inbound(sink, JSON.stringify({ channel, payload }), true);
}
async function request(channel, method, params) {
    next += 1;
    const id = next;
    send(channel, { jsonrpc: '2.0', id, method, params });
    const frame = await until((one) => one.channel === channel && one.payload.id === id, `${method} answer`);
    return frame.payload;
}
const shown = (value) => JSON.stringify(value);

async function prove(language, channel, file, text, hover, diagnosticsMatch) {
    const uri = `oculus-file:///proj/${file}`;
    console.log(`\n== ${channel}: ${file}`);
    const init = await request(channel, 'initialize', { capabilities: { textDocument: {} } });
    console.log('initialize ->', Object.keys(init.result.capabilities).join(','));
    send(channel, { jsonrpc: '2.0', method: 'initialized', params: {} });
    send(channel, {
        jsonrpc: '2.0',
        method: 'textDocument/didOpen',
        params: { textDocument: { uri, languageId: language, version: 1, text } }
    });
    await until((one) => one.channel === channel && one.payload.oculus === 'state' && one.payload.state === 'ready', 'state ready');
    console.log('state ->', shown(frames.filter((one) => one.channel === channel && one.payload.oculus === 'state').map((one) => one.payload.state)));
    const diag = await until(
        (one) => one.channel === channel && one.payload.method === 'textDocument/publishDiagnostics' && one.payload.params.uri === uri && one.payload.params.diagnostics.length > 0 && diagnosticsMatch(one.payload.params),
        'a published diagnostic'
    );
    console.log('publishDiagnostics ->', shown({ uri: diag.payload.params.uri, first: diag.payload.params.diagnostics[0].message, line: diag.payload.params.diagnostics[0].range.start.line }));
    const position = { textDocument: { uri }, position: hover };
    const hovered = await request(channel, 'textDocument/hover', position);
    console.log('hover ->', shown(hovered.result ?? hovered.error).slice(0, 220));
    const defined = await request(channel, 'textDocument/definition', position);
    console.log('definition ->', shown(defined.result ?? defined.error));
    const bad = await request(channel, 'textDocument/hover', { textDocument: { uri: 'oculus-file:///proj/../../etc/passwd' }, position: hover });
    console.log('hover on a refused address ->', shown(bad.error ?? bad.result));
}

try {
    await prove('python', 'lsp:python', 'app.py', appPy, { line: 3, character: 20 }, () => true);
    await prove('cpp', 'lsp:cpp', 'main.cpp', mainCpp, { line: 2, character: 13 }, () => true);
    console.log('\nprocesses while open:', relay.pids().length);
} finally {
    await relay.close();
    console.log('processes after close:', relay.pids().length);
}
const stray = JSON.stringify(frames).includes(`"file://`) || JSON.stringify(frames).includes(base);
console.log('a file:// address or the scratch path in any frame to the page:', stray);
process.exit(0);
```

Command and output:

```
$ cd /tmp && node first-proof-1.mjs /Users/axelfaes/workspace/research-hub/.agents/worktrees/D23/tools/oculus

== lsp:python: app.py
initialize -> textDocumentSync,hoverProvider,definitionProvider,declarationProvider,typeDefinitionProvider,referencesProvider,documentHighlightProvider,documentSymbolProvider,completionProvider,signatureHelpProvider,codeActionProvider,executeCommandProvider
state -> ["starting","ready"]
publishDiagnostics -> {"uri":"oculus-file:///proj/app.py","first":"Type \"Literal['not an int']\" is not assignable to return type \"int\"\n  \"Literal['not an int']\" is not assignable to \"int\"","line":4}
hover -> {"contents":{"kind":"plaintext","value":"(function) def greet(name: str) -> str"},"range":{"start":{"line":3,"character":19},"end":{"line":3,"character":24}}}
definition -> [{"uri":"oculus-file:///proj/util.py","range":{"start":{"line":0,"character":4},"end":{"line":0,"character":9}}}]
hover on a refused address -> {"code":-32602,"message":"the document is not open"}

== lsp:cpp: main.cpp
initialize -> textDocumentSync,hoverProvider,definitionProvider,declarationProvider,typeDefinitionProvider,referencesProvider,documentHighlightProvider,documentSymbolProvider,implementationProvider,completionProvider,signatureHelpProvider,codeActionProvider,documentFormattingProvider,documentRangeFormattingProvider,documentOnTypeFormattingProvider,foldingRangeProvider,selectionRangeProvider,inlayHintProvider,documentLinkProvider,executeCommandProvider
state -> ["starting","ready"]
publishDiagnostics -> {"uri":"oculus-file:///proj/main.cpp","first":"Use of undeclared identifier 'y'","line":3}
hover -> {"contents":{"kind":"plaintext","value":"function add\n\n→ int\nParameters:\n- int a\n- int b\n\nint add(int a, int b)"},"range":{"end":{"character":15,"line":2},"start":{"character":12,"line":2}}}
definition -> [{"range":{"end":{"character":7,"line":0},"start":{"character":4,"line":0}},"uri":"oculus-file:///proj/lib.h"}]
hover on a refused address -> {"code":-32602,"message":"the document is not open"}

processes while open: 2
processes after close: 0
a file:// address or the scratch path in any frame to the page: false
exit 0
```

### Run 2: the transport over a fake port in the client runtime

Scratch file `tests/server/machine/lsp/first-proof.client.test.ts` (quoted whole), run alone and deleted afterwards:

```ts
// First proof, run 2: the transport of one language's client over a fake port, in Svelte's client
// runtime. Two stand-in models of one file and one of another language.

import { describe, expect, it, vi } from 'vitest';
import {
    LspTransport,
    type LspModel,
    type ModelChange,
    type TransportHost
} from '../../../../src/lib/ui/controls/editor/kit/lsp/transport.ts';
import type { LspFrame, LspPort } from '../../../../src/lib/ui/controls/editor/kit/lsp/services.ts';

function model(address: string, language: string, text: string) {
    let listener: ((event: { changes: readonly ModelChange[] }) => void) | undefined;
    const stand: LspModel & { edit(change: ModelChange): void } = {
        uri: { toString: () => address },
        getValue: () => text,
        getVersionId: () => 1,
        getLanguageId: () => language,
        onDidChangeContent: (fn) => {
            listener = fn;
            return { dispose: () => (listener = undefined) };
        },
        edit: (change) => listener?.({ changes: [change] })
    };
    return stand;
}

function port() {
    const sent: LspFrame[] = [];
    let hear: (frame: LspFrame) => void = () => undefined;
    const fake: LspPort = {
        state: { value: 'open', onChange: () => () => undefined },
        send: (payload) => {
            sent.push(payload);
            return true;
        },
        listen: (fn) => {
            hear = fn;
            return () => undefined;
        }
    };
    return { fake, sent, deliver: (frame: LspFrame) => hear(frame) };
}

const say = (...parts: unknown[]): void => {
    process.stderr.write(`${parts.join(' ')}\n`);
};

const change = (text: string): ModelChange => ({
    range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 },
    rangeLength: 0,
    text
});

describe('the transport over a fake port', () => {
    it('opens a file once, numbers its changes, keeps diagnostics and answers a stray request', async () => {
        const wire = port();
        const host: TransportHost = {
            peek: () => Promise.resolve(null),
            drop: vi.fn(),
            apply: () => false,
            diagnostics: vi.fn(),
            inactive: vi.fn(),
            refreshTokens: vi.fn(),
            declared: vi.fn(),
            notice: vi.fn()
        };
        const transport = new LspTransport(wire.fake, 'python', host, () => 0);
        const toClient: unknown[] = [];
        transport.setListener((message) => toClient.push(message));
        const first = model('inmemory://model/1', 'python', 'x = 1\n');
        const second = model('inmemory://model/2', 'python', 'x = 1\n');
        const other = model('inmemory://model/3', 'cpp', 'int x;\n');
        const place = { root: 'proj', path: 'app.py' };

        transport.register(first, place);
        transport.register(second, place);
        const opens = wire.sent.filter((one) => one.method === 'textDocument/didOpen');
        say('didOpen sent for two models of one file:', JSON.stringify(opens));
        expect(opens).toHaveLength(1);

        for (const one of [first, second, other]) {
            await transport.send({
                jsonrpc: '2.0',
                method: 'textDocument/didOpen',
                params: {
                    textDocument: {
                        uri: one.uri.toString(),
                        languageId: one.getLanguageId(),
                        version: 1,
                        text: 'x'
                    }
                }
            });
        }
        say('port frames after the synchroniser opened all three:', wire.sent.length);
        expect(wire.sent).toHaveLength(1);

        first.edit(change('a'));
        first.edit(change('b'));
        second.edit(change('ignored'));
        const versions = wire.sent
            .filter((one) => one.method === 'textDocument/didChange')
            .map(
                (one) =>
                    (one.params as { textDocument: { uri: string; version: number } }).textDocument
            );
        say('didChange versions sent:', JSON.stringify(versions));
        expect(versions).toEqual([
            { uri: 'oculus-file:///proj/app.py', version: 2 },
            { uri: 'oculus-file:///proj/app.py', version: 3 }
        ]);

        wire.deliver({
            jsonrpc: '2.0',
            method: 'textDocument/publishDiagnostics',
            params: {
                uri: 'oculus-file:///proj/app.py',
                diagnostics: [
                    {
                        message: 'm',
                        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } }
                    }
                ]
            }
        });
        await vi.waitFor(() => expect(host.diagnostics).toHaveBeenCalledTimes(1));
        say(
            'diagnostics handed to the host for:',
            JSON.stringify(vi.mocked(host.diagnostics).mock.calls[0][0])
        );
        expect(toClient).toEqual([]);

        const before = wire.sent.length;
        await transport.send({
            jsonrpc: '2.0',
            id: 7,
            method: 'textDocument/hover',
            params: {
                textDocument: { uri: other.uri.toString() },
                position: { line: 0, character: 0 }
            }
        });
        await vi.waitFor(() => expect(toClient).toHaveLength(1));
        say(
            'request from the model of another language answered locally with:',
            JSON.stringify(toClient[0]),
            '| frames sent to the port:',
            wire.sent.length - before
        );
        expect(toClient[0]).toEqual({ jsonrpc: '2.0', id: 7, result: null });
        expect(wire.sent).toHaveLength(before);

        await transport.send({
            jsonrpc: '2.0',
            id: 8,
            method: 'textDocument/hover',
            params: {
                textDocument: { uri: second.uri.toString() },
                position: { line: 0, character: 0 }
            }
        });
        const hover = wire.sent[wire.sent.length - 1];
        say('request from a model of the file sent to the port as:', JSON.stringify(hover));
        expect(hover.params).toEqual({
            textDocument: { uri: 'oculus-file:///proj/app.py' },
            position: { line: 0, character: 0 }
        });

        transport.unregister(first);
        transport.unregister(second);
        const closes = wire.sent.filter((one) => one.method === 'textDocument/didClose');
        say('didClose sent after both models went:', JSON.stringify(closes));
        expect(closes).toHaveLength(1);
    });
});
```

Command and output:

```
$ npx vitest run tests/server/machine/lsp/first-proof.client.test.ts

 RUN  v4.1.11 /Users/axelfaes/workspace/research-hub/.agents/worktrees/D23/tools/oculus

didOpen sent for two models of one file: [{"jsonrpc":"2.0","method":"textDocument/didOpen","params":{"textDocument":{"uri":"oculus-file:///proj/app.py","languageId":"python","version":1,"text":"x = 1\n"}}}]
port frames after the synchroniser opened all three: 1
didChange versions sent: [{"uri":"oculus-file:///proj/app.py","version":2},{"uri":"oculus-file:///proj/app.py","version":3}]
diagnostics handed to the host for: {"root":"proj","path":"app.py"}
request from the model of another language answered locally with: {"jsonrpc":"2.0","id":7,"result":null} | frames sent to the port: 0
request from a model of the file sent to the port as: {"jsonrpc":"2.0","id":8,"method":"textDocument/hover","params":{"textDocument":{"uri":"oculus-file:///proj/app.py"},"position":{"line":0,"character":0}}}
didClose sent after both models went: [{"jsonrpc":"2.0","method":"textDocument/didClose","params":{"textDocument":{"uri":"oculus-file:///proj/app.py"}}}]

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  18:05:13
   Duration  222ms (transform 50ms, setup 0ms, import 62ms, tests 56ms, environment 16ms)

exit 0
```

## DONE / NOT DONE

NOT DONE: nothing in the brief. The landing look (items 1-14) is the orchestrator's and has not been run by me. Four cases carry a ruling slot (7, 45, 46, 47).

| item | proof | result |
|---|---|---|
| Relay, servers, processes, choices, watch under `server/machine/lsp/` | `ls src/lib/server/machine/lsp` below and the first proof run 1 | present; run 1 passes |
| G36 lifetimes, 16 tests in one describe | `npx vitest run tests/server/machine/lsp` below; `tests/server/machine/lsp/lifetime.test.ts` | passes |
| G1 token gate, one set of writable sinks | `src/lib/server/root/socket.ts:137`, `src/lib/server/core/auth.ts:73`; cases 28 and 57 | passes |
| G2 page URIs, G7 argument arrays, G13 `.oculus/cpp.yml`, `lsp` key and `format_on_save`, G31 choices file | the tests named in "Lines for agents/guarded.md", run below | pass |
| Page client (transport, services, hosts, markers, semantic provider, peeks) | first proof run 2 and the client-runtime runs of cases 27, 31, 35, 58, 59, 60 | pass |
| Status items `language_server`, `interpreter`, `compile_database`, palette modes `:interpreter` and `:compile-database`, findings rows, Approve confirm | `src/lib/shell/status/status-items.ts:28`, `src/lib/shell/keys/palette-modes.ts:84`, `src/lib/shell/keys/ChoiceRows.svelte:76` | present |
| References view, clangd AST and Memory Usage sections, `lsp-output` view | `ls` below | present |
| Outline and breadcrumb symbols; 26 `symbol_<kind>` glyphs and icons | the glyph check below | 26 rows, 0 problems |
| Read-only Monaco for a mode-locked file; `Source.svelte` and `Editor.svelte` splits | `wc -l` below | under 520 |
| `format_on_save` | `config/catalogs/options.yml:524`, `src/lib/data/helpers/editor.ts:26` | present |
| Folders moved (`runs/`, `state/system/machine/*`, `kit/theme/`, `language/`) | the stale-path grep below | no stale path |
| Three dependencies only | the package.json comparison below | only the three |
| HELP.md and DESIGN.md | the paragraph list in part 11 | written |
| Process cleanup at the end | the `lsof` and `ps` lines below | port 8795 free, 0 language servers |

The gates, each command with the last lines it printed (full outputs in `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/final`):

```
$ npm run diagrams
docs/diagrams/layer-views.svg
docs/diagrams/channels.dot
docs/diagrams/channels.svg
docs/diagrams/writes.dot
docs/diagrams/writes.svg
exit 0

$ npx prettier --check .
Checking formatting...
All matched files use Prettier code style!
exit 0

$ npx eslint .
exit 0

$ npm run check
> oculus@0.0.1 check
> svelte-kit sync && svelte-check --tsconfig ./tsconfig.json

1791304722328 START "/Users/axelfaes/workspace/research-hub/.agents/worktrees/D23/tools/oculus"
1791304722338 COMPLETED 3130 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
exit 0

$ npm test
 Test Files  110 passed | 17 skipped (127)
      Tests  687 passed | 72 skipped (759)
   Start at  18:38:46
   Duration  51.91s (transform 27.09s, setup 0ms, import 150.08s, tests 40.55s, environment 109ms)

exit 0

$ npm run test:checks
 Test Files  15 passed | 1 skipped (16)
      Tests  227 passed | 3 skipped (230)
   Start at  18:39:42
   Duration  58.30s (transform 26.32s, setup 0ms, import 87.50s, tests 117.74s, environment 4ms)

exit 0

$ npm run test:quick
ok      svelte-check (4.7 s): 1791305031469 COMPLETED 398 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (15.1 s): Duration  11.41s (transform 12.69s, setup 0ms, import 22.51s, tests 21.10s, environment 122ms)
test:quick: 15.5 s (limit 45.0 s); every command passed
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
exit 0

$ sh utils/unused-exports.sh
src/lib/ui/tree/list/virtual.ts: DrawnRow
src/lib/views/boards/focus/rows.ts: RowIndex
src/lib/views/sources/repositories/menus/repo-menu.ts: WorktreePick
src/lib/views/sources/source/language/symbols.ts: HeadingNode
src/lib/views/system/history/rows.ts: UndoAnswer
exit 0

$ sh utils/folder-check.sh
exit 0

$ sh utils/size-check.sh
exit 0
```

`npm run test:quick` is intermittent (part 7, item 13). The gate lines above are a passing run; a failing run of the same command on the same files printed:

```
ok      ASCII gate (0.5 s)
ok      svelte-kit sync (1.9 s)
ok      prettier (2.4 s): All matched files use Prettier code style!
ok      eslint (2.2 s)
FAILED  svelte-check (11.8 s)
1791304855141 ERROR "src/routes/api/(apps)/approve/+server.ts" 7:37 "File '/Users/axelfaes/workspace/research-hub/.agents/worktrees/D23/tools/oculus/.svelte-kit/types/src/routes/api/(apps)/approve/$types.d.ts' is not a module."
1791304855141 ERROR "src/routes/api/(apps)/approve/+server.ts" 9:40 "Binding element 'request' implicitly has an 'any' type."
1791304855142 ERROR "src/routes/api/(apps)/approve/+server.ts" 9:49 "Binding element 'locals' implicitly has an 'any' type."
1791304855142 COMPLETED 398 FILES 3 ERRORS 0 WARNINGS 1 FILES_WITH_PROBLEMS
ok      vitest (26.1 s): Duration  21.85s (transform 49.74s, setup 0ms, import 59.65s, tests 19.85s, environment 344ms)
test:quick: 26.7 s (limit 45.0 s); failed: svelte-check
```

The character-set gate of the rules file over `src`, `tests` and `config`, and over `HELP.md` and `DESIGN.md`, as the brief prints it (the command, its output and its exit status):

```
$ LC_ALL=C perl -ne 'my $l = $_; $l =~ s/\xC3[\x80-\xBF]//g if $ARGV =~ m{^config/}; print "$ARGV:$.:$_" if $l =~ /[^\x20-\x7E\n]/; close ARGV if eof' $(find src tests config -type f ! -name local.yml)
(no output)
(exit 0)
```

```
$ LC_ALL=C perl -ne 'my $l = $_; $l =~ s/\xC3[\x80-\xBF]//g if $ARGV =~ m{^config/}; print "$ARGV:$.:$_" if $l =~ /[^\x20-\x7E\n]/; close ARGV if eof' HELP.md DESIGN.md
(no output)
(exit 0)
```

The checks of the plan's verify list through the `land` skill's `checks.sh`, run from `tools/oculus` in the worktree:

```
$ npm run test:quick

> oculus@0.0.1 test:quick
> node tests/tiers/quick.mjs

test:quick: 234 changed file(s), from git since HEAD
test:quick: 104 test file(s), 10 essential
        tests/data/sources/config/local.test.ts: changed
        tests/routes/machine/commands.test.ts: changed
        tests/routes/machine/schedules.test.ts: changed
        tests/routes/sessions/terminal-actions.test.ts: changed
        tests/server/machine/approvals/approvals.test.ts: changed
        tests/server/machine/lsp/choices.test.ts: changed
        tests/server/machine/lsp/cpp-file.test.ts: changed
        tests/server/machine/lsp/lifetime.test.ts: changed
        tests/server/machine/lsp/overlap.test.ts: changed
        tests/server/machine/lsp/relay.test.ts: changed
        tests/server/machine/lsp/servers.test.ts: changed
        tests/server/machine/lsp/uris.test.ts: changed
        tests/server/machine/pty/channel.test.ts: changed
        tests/server/machine/runs/commands/placeholders.test.ts: changed
        tests/server/machine/runs/commands/run.test.ts: changed
        tests/server/machine/runs/schedules/file.test.ts: changed
        tests/server/machine/runs/schedules/record.test.ts: changed
        tests/server/machine/runs/schedules/run.test.ts: changed
        tests/server/machine/runs/schedules/watch.test.ts: changed
        tests/data/snapshot/normalise.test.ts: imports at depth 1
        tests/data/snapshot/resources.test.ts: imports at depth 1
        tests/data/sources/docs.test.ts: imports at depth 1
        tests/data/sources/feeds.test.ts: imports at depth 1
        tests/data/sources/manifests.test.ts: imports at depth 1
        tests/data/sources/personal.test.ts: imports at depth 1
        tests/routes/apps/approve.test.ts: imports at depth 1
        tests/routes/docs/literature.test.ts: imports at depth 1
        tests/routes/docs/memories.test.ts: imports at depth 1
        tests/routes/edit/audit-mute.test.ts: imports at depth 1
        tests/routes/files/history.test.ts: imports at depth 1
        tests/routes/files/search.test.ts: imports at depth 1
        tests/routes/files/source.test.ts: imports at depth 1
        tests/routes/git/deposit.test.ts: imports at depth 1
        tests/routes/machine/hpc.test.ts: imports at depth 1
        tests/routes/sessions/compose.test.ts: imports at depth 1
        tests/routes/sessions/terminal-edit.test.ts: imports at depth 1
        tests/routes/sessions/terminal.test.ts: imports at depth 1
        tests/server/accounts/connect/oauth.test.ts: imports at depth 1
        tests/server/accounts/mail/routes.test.ts: imports at depth 1
        tests/server/core/auth.test.ts: imports at depth 1
        tests/server/core/changes.test.ts: imports at depth 1
        tests/server/edit/feeds.test.ts: imports at depth 1
        tests/server/files/picker.test.ts: imports at depth 1
        tests/server/machine/hpc/submit.test.ts: imports at depth 1
        tests/server/machine/usage/refresh.test.ts: imports at depth 1
        tests/server/root/hooks-server.test.ts: imports at depth 1
        tests/state/client/terminal/terminal-close.test.ts: imports at depth 1
        tests/state/feeds/literature-merge.test.ts: imports at depth 1
        tests/state/forms/form-drafts.test.ts: imports at depth 1
        tests/state/forms/manifest-draft.test.ts: imports at depth 1
        tests/state/system/apps/methods.test.ts: imports at depth 1
        tests/state/system/apps/store-cache.test.ts: imports at depth 1
        tests/views/sources/bar-actions.test.ts: imports at depth 1
        tests/data/helpers/files/nesting.test.ts: imports at depth 2
        tests/data/snapshot/cluster-folder.test.ts: imports at depth 2
        tests/data/sources/agents-catalog.test.ts: imports at depth 2
        tests/data/sources/career.test.ts: imports at depth 2
        tests/data/sources/collections.test.ts: imports at depth 2
        tests/data/sources/config/catalog/options.test.ts: imports at depth 2
        tests/data/sources/config/languages.test.ts: imports at depth 2
        tests/data/sources/config/rail.test.ts: imports at depth 2
        tests/data/sources/config/settings.test.ts: imports at depth 2
        tests/data/sources/present.test.ts: imports at depth 2
        tests/data/sources/registries.test.ts: imports at depth 2
        tests/routes/apps/app-files.test.ts: imports at depth 2
        tests/routes/apps/app-open.test.ts: imports at depth 2
        tests/routes/apps/app-store.test.ts: imports at depth 2
        tests/routes/edit/app-gate.test.ts: imports at depth 2
        tests/routes/edit/rail.test.ts: imports at depth 2
        tests/routes/edit/roots.test.ts: imports at depth 2
        tests/routes/edit/undo/undo.test.ts: imports at depth 2
        tests/routes/files/file-undo.test.ts: imports at depth 2
        tests/routes/files/file.test.ts: imports at depth 2
        tests/routes/files/fs.test.ts: imports at depth 2
        tests/routes/files/open.test.ts: imports at depth 2
        tests/routes/files/project-files.test.ts: imports at depth 2
        tests/routes/replace/ops-replace.test.ts: imports at depth 2
        tests/routes/sessions/latex.test.ts: imports at depth 2
        tests/server/accounts/connect/accounts.test.ts: imports at depth 2
        tests/server/core/git-failure.test.ts: imports at depth 2
        tests/server/edit/app-store.test.ts: imports at depth 2
        tests/server/edit/config-key.test.ts: imports at depth 2
        tests/server/edit/writes-collection.test.ts: imports at depth 2
        tests/server/files/search.test.ts: imports at depth 2
        tests/server/files/workspaces.test.ts: imports at depth 2
        tests/server/machine/apps/manifest.test.ts: imports at depth 2
        tests/server/machine/pty/sessions.test.ts: imports at depth 2
        tests/server/sessions/transcripts.test.ts: imports at depth 2
        tests/state/sessions/source.test.ts: imports at depth 2
        tests/state/sources/repositories/diff/comment-draft.client.test.ts: imports at depth 2
        tests/state/workbench/layout/saved/layout-unread.test.ts: imports at depth 2
        tests/state/workbench/navigation/pages.test.ts: imports at depth 2
        tests/views/shared/explorer/opening-apps.test.ts: imports at depth 2
        tests/views/shared/explorer/opening.client.test.ts: imports at depth 2
        tests/checks/config/config-folder.test.ts: changed, run by npm run test:checks or test:slow
        tests/checks/config/config.test.ts: changed, run by npm run test:checks or test:slow
        tests/checks/tree/boundaries.test.ts: changed, run by npm run test:checks or test:slow
ok      prettier (0.4 s): All matched files use Prettier code style!
ok      ASCII gate (0.4 s)
ok      eslint (1.0 s)
ok      svelte-kit sync (1.5 s)
ok      svelte-check (5.2 s): 1791305056019 COMPLETED 398 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (22.4 s): Duration  19.00s (transform 39.90s, setup 0ms, import 52.85s, tests 18.41s, environment 149ms)
test:quick: 22.8 s (limit 45.0 s); every command passed
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
checks: 1 commands passed
exit 0
```

Run from the root of the checkout, as the brief words it, the script exits with a brief error (no `package.json` there):

```
$ npm run test:quick
npm error code ENOENT
npm error syscall open
npm error path /Users/axelfaes/workspace/research-hub/.agents/worktrees/D23/package.json
npm error errno -2
npm error enoent Could not read package.json: Error: ENOENT: no such file or directory, open '/Users/axelfaes/workspace/research-hub/.agents/worktrees/D23/package.json'
npm error enoent This is related to npm not being able to find a file.
npm error enoent
npm error A complete log of this run can be found in: /Users/axelfaes/.npm/_logs/2026-10-06T16_34_08_866Z-debug-0.log
checks: failed with exit 254: npm run test:quick
checks: 1 of 1 commands failed
exit 1
```

Added and changed tests, run on the unchanged tree (the base copy with these test files placed in it) and on the worktree. The unchanged-tree run fails (the code the tests call is not there, or the changed expectation is not met); the worktree run passes:

```
$ (base copy) npx vitest run <the 12 files of the added group>

 RUN  v4.1.11 /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/baserun/tools/oculus

 ❯ |unit| tests/server/machine/lsp/cpp-file.test.ts (0 test)
 ❯ |unit| tests/server/machine/lsp/relay.test.ts (0 test)
 ❯ |unit| tests/server/machine/pty/channel.test.ts (3 tests | 1 failed) 1071ms
     × refuses input from a socket that carried no token 1069ms
 ❯ |unit| tests/server/machine/lsp/lifetime.test.ts (0 test)
 ❯ |unit| tests/server/machine/lsp/choices.test.ts (0 test)
 ❯ |unit| tests/checks/config/config.test.ts (31 tests | 1 failed) 868ms
     × words each wrong setting against behavior.yml from the catalog, and nothing for the shipped files 14ms
 ❯ |unit| tests/server/machine/lsp/uris.test.ts (0 test)
 ❯ |unit| tests/server/machine/lsp/servers.test.ts (0 test)
 ❯ |unit| tests/server/machine/lsp/overlap.test.ts (0 test)
 ❯ |unit| tests/data/sources/config/local.test.ts (23 tests | 1 failed) 25ms
     × answers "lsp: 3" with the sentence it would throw 3ms
 ❯ |unit| tests/checks/config/config-folder.test.ts (20 tests | 1 failed) 1495ms
     × reads one catalog file per owner and no legacy catalog file 6ms

⎯⎯⎯⎯⎯⎯ Failed Suites 7 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  |unit| tests/server/machine/lsp/choices.test.ts [ tests/server/machine/lsp/choices.test.ts ]
Error: Cannot find module '../../../../src/lib/server/machine/lsp/choices.ts' imported from /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/baserun/tools/oculus/tests/server/machine/lsp/choices.test.ts
 ❯ tests/server/machine/lsp/choices.test.ts:12:1
     10| import { it, scratchDir } from '../../../fixtures/scratch.ts';
     11| import type { LspToPage } from '../../../../src/lib/data/model/index.t…
     12| import { applyChoose, chosenFor } from '../../../../src/lib/server/mac…
       | ^
     13| import type { Adapter, Choice } from '../../../../src/lib/server/machi…
     14|

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/11]⎯

 FAIL  |unit| tests/server/machine/lsp/cpp-file.test.ts [ tests/server/machine/lsp/cpp-file.test.ts ]
Error: Cannot find module '../../../../src/lib/server/machine/lsp/clangd/cpp-file.ts' imported from /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/baserun/tools/oculus/tests/server/machine/lsp/cpp-file.test.ts
 ❯ tests/server/machine/lsp/cpp-file.test.ts:9:1
      7| import { describe, expect } from 'vitest';
      8| import { it, scratchDir } from '../../../fixtures/scratch.ts';
      9| import { readCppFile } from '../../../../src/lib/server/machine/lsp/cl…
       | ^
     10|
     11| /** A repository holding the given `.oculus/cpp.yml` text, a database …

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/11]⎯

 FAIL  |unit| tests/server/machine/lsp/lifetime.test.ts [ tests/server/machine/lsp/lifetime.test.ts ]
Error: Cannot find module '../../../../src/lib/server/machine/lsp/relay.ts' imported from /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/baserun/tools/oculus/tests/server/machine/lsp/lsp-fixture.ts
 ❯ tests/server/machine/lsp/lsp-fixture.ts:18:1
     16| import type { Sink } from '../../../../src/lib/server/core/channels.ts…
     17| import type { LspRpc } from '../../../../src/lib/data/model/index.ts';
     18| import { Relay } from '../../../../src/lib/server/machine/lsp/relay.ts…
       | ^
     19| import type { Spawn } from '../../../../src/lib/server/machine/lsp/pro…
     20| import { createServers } from '../../../../src/lib/server/machine/lsp/…
 ❯ tests/server/machine/lsp/lifetime.test.ts:13:1

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[3/11]⎯

 FAIL  |unit| tests/server/machine/lsp/overlap.test.ts [ tests/server/machine/lsp/overlap.test.ts ]
Error: Cannot find module '../../../../src/lib/server/machine/lsp/relay.ts' imported from /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/baserun/tools/oculus/tests/server/machine/lsp/lsp-fixture.ts
 ❯ tests/server/machine/lsp/lsp-fixture.ts:18:1
     16| import type { Sink } from '../../../../src/lib/server/core/channels.ts…
     17| import type { LspRpc } from '../../../../src/lib/data/model/index.ts';
     18| import { Relay } from '../../../../src/lib/server/machine/lsp/relay.ts…
       | ^
     19| import type { Spawn } from '../../../../src/lib/server/machine/lsp/pro…
     20| import { createServers } from '../../../../src/lib/server/machine/lsp/…
 ❯ tests/server/machine/lsp/overlap.test.ts:11:1

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[4/11]⎯

 FAIL  |unit| tests/server/machine/lsp/relay.test.ts [ tests/server/machine/lsp/relay.test.ts ]
Error: Cannot find module '../../../../src/lib/server/machine/lsp/relay.ts' imported from /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/baserun/tools/oculus/tests/server/machine/lsp/lsp-fixture.ts
 ❯ tests/server/machine/lsp/lsp-fixture.ts:18:1
     16| import type { Sink } from '../../../../src/lib/server/core/channels.ts…
     17| import type { LspRpc } from '../../../../src/lib/data/model/index.ts';
     18| import { Relay } from '../../../../src/lib/server/machine/lsp/relay.ts…
       | ^
     19| import type { Spawn } from '../../../../src/lib/server/machine/lsp/pro…
     20| import { createServers } from '../../../../src/lib/server/machine/lsp/…
 ❯ tests/server/machine/lsp/relay.test.ts:15:1

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[5/11]⎯

 FAIL  |unit| tests/server/machine/lsp/servers.test.ts [ tests/server/machine/lsp/servers.test.ts ]
Error: Cannot find module '../../../../src/lib/server/machine/lsp/pyright/interpreter.ts' imported from /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/baserun/tools/oculus/tests/server/machine/lsp/servers.test.ts
 ❯ tests/server/machine/lsp/servers.test.ts:9:1
      7| import { describe, expect } from 'vitest';
      8| import { it, scratchDir } from '../../../fixtures/scratch.ts';
      9| import { interpretersFor } from '../../../../src/lib/server/machine/ls…
       | ^
     10| import { createServers } from '../../../../src/lib/server/machine/lsp/…
     11| import { makeRelay, open, pageFile, settle, stubSpawn } from './lsp-fi…

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[6/11]⎯

 FAIL  |unit| tests/server/machine/lsp/uris.test.ts [ tests/server/machine/lsp/uris.test.ts ]
Error: Cannot find module '../../../../src/lib/server/machine/lsp/held.ts' imported from /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/baserun/tools/oculus/tests/server/machine/lsp/uris.test.ts
 ❯ tests/server/machine/lsp/uris.test.ts:10:1
      8| import { describe, expect } from 'vitest';
      9| import { it, scratchDir } from '../../../fixtures/scratch.ts';
     10| import { docKey } from '../../../../src/lib/server/machine/lsp/held.ts…
       | ^
     11| import {
     12|     resolvePageUri,

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[7/11]⎯


⎯⎯⎯⎯⎯⎯⎯ Failed Tests 4 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  |unit| tests/checks/config/config-folder.test.ts > oculus's own config directory > reads one catalog file per owner and no legacy catalog file
AssertionError: expected [ 'app.yml', 'desktop.yml', …(57) ] to deeply equal [ 'app.yml', 'desktop.yml', …(58) ]

- Expected
+ Received

@@ -52,11 +52,10 @@
    "views/system/findings.yml",
    "views/system/gallery.yml",
    "views/system/help.yml",
    "views/system/history.yml",
    "views/system/machine/hpc.yml",
-   "views/system/machine/output.yml",
    "views/system/machine/processes.yml",
    "views/system/machine/usage.yml",
    "views/system/status.yml",
    "views/system/workbench.yml",
  ]

 ❯ tests/checks/config/config-folder.test.ts:303:23
    301|             .filter((name) => name.endsWith('.yml'))
    302|             .sort();
    303|         expect(names).toEqual(CATALOG_FILES);
       |                       ^
    304|         expect(existsSync(join(engineDir(), 'config', 'text.yml'))).to…
    305|         expect(existsSync(join(engineDir(), 'config', 'text-oculus.yml…

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[8/11]⎯

 FAIL  |unit| tests/checks/config/config.test.ts > settingFindings > words each wrong setting against behavior.yml from the catalog, and nothing for the shipped files
AssertionError: expected [ …(37) ] to include 'editor.languages.cpp.format_on_save: …'
 ❯ tests/checks/config/config.test.ts:469:23
    467|             'editor.languages.cobolx: editor.languages.cobolx is not a…
    468|         );
    469|         expect(lines).toContain(
       |                       ^
    470|             'editor.languages.cpp.format_on_save: editor.languages.cpp…
    471|         );

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[9/11]⎯

 FAIL  |unit| tests/data/sources/config/local.test.ts > checkLocal > answers "lsp: 3" with the sentence it would throw
AssertionError: expected null to be 'local.yml: lsp must be a path' // Object.is equality

- Expected:
"local.yml: lsp must be a path"

+ Received:
null

 ❯ tests/data/sources/config/local.test.ts:90:32
     88|         ["literature: { mailto: '' }", 'local.yml: literature.mailto m…
     89|     ])('answers %j with the sentence it would throw', (text, expected)…
     90|         expect(sentence(text)).toBe(expected);
       |                                ^
     91|     });
     92| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[10/11]⎯

 FAIL  |unit| tests/server/machine/pty/channel.test.ts > what the page may send back > refuses input from a socket that carried no token
AssertionError: expected [ undefined ] to deeply equal [ false ]

- Expected
+ Received

  [
-   false,
+   undefined,
  ]

 ❯ tests/server/machine/pty/channel.test.ts:167:49
    165|             JSON.stringify({ type: 'input', channel: CHANNEL, bytes: e…
    166|         );
    167|         await vi.waitFor(() => expect(writable).toEqual([false]));
       |                                                 ^
    168|         await settle();
    169|         expect(record.calls).toEqual([]);

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[11/11]⎯


 Test Files  11 failed | 1 passed (12)
      Tests  4 failed | 84 passed (88)
   Start at  18:04:13
   Duration  17.69s (transform 8.39s, setup 0ms, import 21.33s, tests 11.69s, environment 2ms)

exit 1
```

```
$ (worktree) npx vitest run <the same 12 files>

 RUN  v4.1.11 /Users/axelfaes/workspace/research-hub/.agents/worktrees/D23/tools/oculus


 Test Files  12 passed (12)
      Tests  166 passed (166)
   Start at  18:04:34
   Duration  16.65s (transform 7.97s, setup 0ms, import 22.42s, tests 5.37s, environment 2ms)

exit 0
```

Tests of behaviour the step preserves (10 files: the commands, schedules, seeds and approvals tests, the base copy running them at their old paths and the worktree at `runs/`), passing on both:

```
$ (base copy)

 RUN  v4.1.11 /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/baserun/tools/oculus


 Test Files  10 passed (10)
      Tests  32 passed (32)
   Start at  18:04:53
   Duration  3.55s (transform 1.87s, setup 0ms, import 8.82s, tests 4.28s, environment 2ms)

exit 0
```

```
$ (worktree)

 RUN  v4.1.11 /Users/axelfaes/workspace/research-hub/.agents/worktrees/D23/tools/oculus


 Test Files  10 passed (10)
      Tests  32 passed (32)
   Start at  18:04:59
   Duration  5.70s (transform 2.71s, setup 0ms, import 11.33s, tests 3.36s, environment 2ms)

exit 0
RUNTESTS-DONE
```

Each added test was judged by reading it; the table of the tests is in "Lines for agents/guarded.md".

Dependencies, against main's `package.json` (`dependencies` and `devDependencies` compared):

```
$ diff <main package.json dependencies> <worktree package.json dependencies>
43a44
>   "pyright": "1.1.414",
49a51,52
>   "vscode-jsonrpc": "9.0.3",
>   "vscode-languageserver-protocol": "3.18.4",
(exit 1)
```

The new files of each concern:

```
$ ls src/lib/server/machine/lsp src/lib/server/machine/lsp/clangd src/lib/server/machine/lsp/pyright src/lib/state/system/machine/lsp src/lib/ui/controls/editor/kit/lsp src/lib/views/sources/search src/lib/views/sources/files/sections/clangd src/lib/views/system/machine/output src/lib/views/sources/source/language
src/lib/server/machine/lsp:
choices.ts
clangd
held.ts
process.ts
pyright
relay.ts
servers.ts
uris.ts
watch.ts
wire.ts

src/lib/server/machine/lsp/clangd:
adapter.ts
cpp-file.ts
databases.ts

src/lib/server/machine/lsp/pyright:
adapter.ts
interpreter.ts

src/lib/state/system/machine/lsp:
clangd.svelte.ts
clangd.ts
documents.svelte.ts
lsp.svelte.ts
references.svelte.ts
references.ts
symbols.ts

src/lib/ui/controls/editor/kit/lsp:
client.ts
hosts.ts
markers.ts
peeks.ts
semantic.ts
services.ts
signal.ts
transport.ts
uris.ts

src/lib/views/sources/files/sections/clangd:
Ast.svelte
ClangdSection.svelte
MemoryUsage.svelte
props.ts

src/lib/views/sources/search:
box-keys.ts
Query.svelte
References.svelte
ReplaceRow.svelte
Results.svelte
Search.svelte

src/lib/views/sources/source/language:
extension.ts
latex-editor.ts
lsp.ts
symbols.ts
tab-language.svelte.ts

src/lib/views/system/machine/output:
Output.svelte
(exit 0)
```

Sizes against the caps (a component 520, a source file 880):

```
$ wc -l src/lib/views/sources/source/Source.svelte src/lib/ui/controls/editor/Editor.svelte src/lib/server/machine/lsp/relay.ts src/lib/ui/controls/editor/gutter/editor-gutter.ts
     520 src/lib/views/sources/source/Source.svelte
     496 src/lib/ui/controls/editor/Editor.svelte
     867 src/lib/server/machine/lsp/relay.ts
     103 src/lib/ui/controls/editor/gutter/editor-gutter.ts
    1986 total
(exit 0)
```

Files over a cap anywhere in the tree (a component over 520, a module over 880):

```
$ find src tests utils -type f -name '*.svelte' | xargs wc -l | awk '$1>520 && $2!="total"'; find src tests utils -type f \( -name '*.ts' -o -name '*.mjs' -o -name '*.js' \) | xargs wc -l | awk '$1>880 && $2!="total"'
     524 src/lib/views/structure/map/Graph.svelte
(exit 0)
```

The glyph and icon rows of the symbol kinds, each Lucide name checked against `node_modules/lucide-static/icons/<name>.svg`:

```
$ (a python3 here-document over the brief's 26 rows, config/catalogs/glyphs.yml, icons.yml and lucide-static)
26 rows, 0 problems
(exit 0)
```

The stale-path grep after the regroupings of section 1:

```
$ grep -rnE "machine/(commands|schedules|seeds)/" src tests utils DESIGN.md HELP.md README.md | grep -v "machine/runs/"
src/lib/state/client/context.ts:69:import { createSchedule, type ScheduleStore } from '../system/machine/schedules/schedule.svelte.ts';
```
Judgment: the one hit is `state/system/machine/schedules/schedule.svelte.ts`, the state side's own `schedules/` folder (the page's state of schedules), which stays; the server side moved to `server/machine/runs/schedules/`.

The history-word grep:

The history-word grep of the spec (item "No history in code or comments") over the comment lines and test titles this step added or changed, written to the files it names (a line counts as added when the base file at the same path, or the moved file of the same name, does not hold it):

```
$ python3 rep/hist.py words   (words: before, used to, no longer, still, always has been, always had, as before, previously, the step adds, after this package lands)
src/lib/server/machine/lsp/clangd/cpp-file.ts:10: // before it is passed, and an absolute one stays as it is. The options that take a path are `-I`,
src/lib/server/machine/lsp/held.ts:164: /** The setup the server was started with, null before it was prepared. */
src/lib/server/machine/lsp/process.ts:95: /** The child's pid, undefined before it exists. */
src/lib/server/machine/lsp/uris.ts:6: // A page URI is read before anything reaches a server: its scheme must be `oculus-file`, its
src/lib/server/machine/lsp/uris.ts:74: * an address's path once before the page reads a root key back from it, so a key holding a `/`
src/lib/server/machine/runs/commands/routes.ts:9: // root the file browser serves is refused with 400 before any file under it is read. The POST
src/lib/server/machine/runs/commands/run.ts:16: // same for a line still running once the reader confirmed the process that would be stopped.
src/lib/server/machine/runs/commands/run.ts:175: /** Run an ended task terminal's line again; a line still running is refused. */
src/lib/server/machine/runs/commands/run.ts:189: * Run a task terminal's line again. A line still running is stopped first, which asks for a
src/lib/server/machine/runs/schedules/routes.ts:11: // write while the run record does not read is refused before the schedules file is touched, and a
src/lib/server/machine/runs/schedules/routes.ts:18: // lock that stays taken or a record that does not read refuses before anything is written, and a
src/lib/server/machine/runs/schedules/routes.ts:184: * The file is committed only when it still holds the text the change was planned from, and a
src/lib/shell/keys/ChoiceRows.svelte:10: // reader's yes before it is chosen.
src/lib/state/system/machine/lsp/lsp.svelte.ts:14: // holds (`socket.admitted`): a frame written before is refused, and a client that sent its
src/lib/state/system/machine/lsp/lsp.svelte.ts:73: /** What the page knows of a root's server for a language, or null before it said anything. */
src/lib/state/system/machine/lsp/lsp.svelte.ts:75: /** The choices a root last offered for a language, or null before it did. */
src/lib/state/system/machine/lsp/lsp.svelte.ts:87: /** The lines of a server's log the page last heard, empty before any. */
src/lib/state/system/machine/lsp/references.svelte.ts:52: /** The location after or before the one last visited in the latest result, or null. */
src/lib/state/system/machine/lsp/references.ts:112: /** The place after or before `at` in a result, wrapping round; -1 when there is none. */
src/lib/ui/controls/editor/kit/lsp/client.ts:17: // constructor, before a subclass's fields would be, so the one field the subclass reads is
src/lib/ui/controls/editor/kit/lsp/client.ts:29: /** The milliseconds a change waits for its end before the tab's symbols are asked again. */
src/lib/ui/controls/editor/kit/lsp/client.ts:32: /** The seconds a peek model is left to be shown by an editor before it may be swept. */
src/lib/ui/controls/editor/kit/lsp/semantic.ts:39: * and character it moves from the one before, its length, its type and its modifier bits.
src/lib/ui/controls/editor/kit/lsp/semantic.ts:84: /** The legend the server of a model answers in, null before it is ready. */
src/lib/ui/controls/editor/kit/lsp/transport.ts:119: /** How many variants of an address are tried before a peek is given up. */
src/lib/ui/controls/editor/kit/lsp/transport.ts:274: /** The client's listener for what comes from the relay; messages that came before it wait. */
src/lib/ui/controls/editor/kit/lsp/transport.ts:580: // The model the request was made for went before the answer came: nothing is made for it.
src/lib/ui/controls/editor/kit/lsp/uris.ts:6: // percent-encoded twice, since the editor's URI type decodes an address's path once before a peek
src/lib/views/sources/files/sections/clangd/ClangdSection.svelte:5: // where the section can ask the server again, a Refresh before it. The caller draws the rows.
src/lib/views/sources/source/language/lsp.ts:72: /** Format the document with the server before a save; says why when it did not. */
tests/server/machine/lsp/lifetime.test.ts:7: // moves the clock to a deadline and asks whether the stub has ended, one millisecond before it and
tests/server/machine/lsp/lifetime.test.ts:265: it('is started again after an exit that comes 3 minutes or more after the one before', async () => {
tests/server/machine/lsp/relay.test.ts:98: // two before it were read: the socket handles its frames in order.
tests/server/machine/lsp/uris.test.ts:2: // page URIs resolve to a file of a served root and which are refused before anything reaches a
src/lib/shell/status/SourceItems.svelte:14: // language list. A file a language server serves also draws its three items before the language
src/lib/shell/status/status-items.ts:10: // interpreter and the compile database, each drawn only for the language it belongs to, before
src/lib/state/client/socket.svelte.ts:31: // a frame written before that is refused. A holder of a channel that must not lose its first
src/lib/state/shared/stores/shapes.ts:91: * it is false until the page has renewed its token, since a frame written before is refused.
src/lib/ui/controls/editor/kit/load.ts:27: // before it. Monaco's `defineTheme` replaces the theme of that name and redraws it where it is in
src/lib/ui/controls/editor/kit/load.ts:31: // and leaves the theme before it in force.
src/lib/ui/tabs/Breadcrumb.svelte:9: // symbol of the file draws the glyph of its kind before its name.
src/lib/views/sources/source/Source.svelte:88: // registration and actions, and the format before a save when the language's `format_on_save`
(42 hits)
```

Judgment of every hit: each one states an order of events at run time or of values (what happens before a save, a value that is null before the server is ready, the line before the next heading, the previous element of a list, a frame written before the token is renewed) and compares with no earlier state of the code, so none is history and none is changed. The hits in `tests/server/machine/lsp/lifetime.test.ts:7` and `:265` are the clock set one millisecond before a deadline and the exit before another exit.

```
$ python3 rep/hist.py ids   (a package or ledger id: a capital letter or two and digits, or Z and digits)
src/lib/views/sources/search/References.svelte:24: // instance, each as "<title>: <word>", a press running it again. F4 and Shift+F4 walk the
(1 hits)
```

Judgment: the one hit is the key name `F4` in a sentence about the F4 chord, not a package id.

Processes at the end of the work (`lsof` of the dev server's port and of the other server, and the count of language servers):

```
$ lsof -iTCP:8795 -sTCP:LISTEN; lsof -iTCP:8790 -sTCP:LISTEN | tail -1; echo "language servers: $(ps -axo pid,command | grep -E 'langserver\.index\.js|clangd' | grep -v grep | wc -l)"
node    6344 axelfaes   23u  IPv4 0x96b66ab1a9cd4ec      0t0  TCP localhost:8790 (LISTEN)
language servers:        0
(exit 0)
```

### Edits to existing assertions, allow lists and predicates

Each changed test file and allow list that exists in the base copy, as `diff <base> <worktree>` prints it; a moved file is compared with its file at the old path. Judgment under each.

`tests/checks/config/config-folder.test.ts`:

```
$ diff <base>/tests/checks/config/config-folder.test.ts <worktree>/tests/checks/config/config-folder.test.ts
280a281
>         'views/system/machine/output.yml',
```

The catalog test that lists every text file of the config folder gains `views/system/machine/output.yml`, the new words file of the `lsp-output` view (brief, "Show Language Server Output"). A list of what exists, extended by the file this step adds.

`tests/checks/config/config.test.ts`:

```
$ diff <base>/tests/checks/config/config.test.ts <worktree>/tests/checks/config/config.test.ts
424a425
>                 'editor.languages.cpp.format_on_save',
466a468,470
>         );
>         expect(lines).toContain(
>             'editor.languages.cpp.format_on_save: editor.languages.cpp.format_on_save must be true or false; the field is not read'
```

The sorted list of keys the catalog test expects a finding for gains `editor.languages.cpp.format_on_save`, and one line asserts its sentence (brief, Tests, G13). It is a new expected finding for the new field; no existing line is loosened.

`tests/checks/tree/allow-duplication.txt`:

```
$ diff <base>/tests/checks/tree/allow-duplication.txt <worktree>/tests/checks/tree/allow-duplication.txt
16c16
< src/lib/server/machine/hpc/parse.ts src/lib/state/system/machine/hpc.ts 8ead1c0cdafe the same 7 lines at 25 and 20, to fold into one place
---
> src/lib/server/machine/hpc/parse.ts src/lib/state/system/machine/hpc/hpc.ts 8ead1c0cdafe the same 7 lines at 25 and 20, to fold into one place
```

The entry names `src/lib/state/system/machine/hpc/hpc.ts` in place of `src/lib/state/system/machine/hpc.ts`, since the file moved (brief, "the paths named in text"). Its mark and reason are as they were.

`tests/checks/tree/boundaries.test.ts`:

```
$ diff <base>/tests/checks/tree/boundaries.test.ts <worktree>/tests/checks/tree/boundaries.test.ts
133a134,138
> // `state/system/machine/lsp/lsp.svelte` and `state/system/machine/lsp/symbols` are in the shell's
> // row because the status bar's language server items and the palette's choice rows draw the
> // server states and the choices the relay sends, and the pane strip's breadcrumb draws the symbols
> // around the caret that the symbols module orders.
> //
153a159,160
>         'state/system/machine/lsp/lsp.svelte',
>         'state/system/machine/lsp/symbols',
354c361,363
<  * list and dialog read and write the schedules through `schedule`.
---
>  * list and dialog read and write the schedules through `schedule`, and the status bar's language
>  * server items and the palette's choice rows read the servers' states and choices through `lsp`,
>  * while the pane strip's breadcrumb reads the symbols of the file in view through `documents`.
373c382,384
<     'schedule'
---
>     'schedule',
>     'lsp',
>     'documents'
```

An allow list is extended, so the spec asks for it to be named: the shell's row of the state modules the shell may read gains `state/system/machine/lsp/lsp.svelte` and `state/system/machine/lsp/symbols`, and the list of stores a shell file may take out of the client object gains `lsp` and `documents`, with their reasons in the comments above each list. The row names the state modules the shell is made of one at a time, and the status bar items and the palette modes the brief puts in `shell/` read the servers' states and choices, as the breadcrumb in `shell/panes/strip/` reads the symbols around the caret. The brief's path list does not name this file. The alternative, handing the state to the shell through props from a view, would give the shell items nothing to draw from, since the status bar and the palette are not views. No existing entry is removed or changed.

`tests/data/sources/config/local.test.ts`:

```
$ diff <base>/tests/data/sources/config/local.test.ts <worktree>/tests/data/sources/config/local.test.ts
64a65
>         ['lsp: 3', 'local.yml: lsp must be a path'],
```

One row, `['lsp: 3', 'local.yml: lsp must be a path']`, before `schedules: 3` (brief, Tests, G13).

`tests/data/sources/config/wrong-settings.ts`:

```
$ diff <base>/tests/data/sources/config/wrong-settings.ts <worktree>/tests/data/sources/config/wrong-settings.ts
34c34,39
<     languages: { cobolx: { tab_size: 2 }, python: { tab_size: 99 }, markdown: 5 }
---
>     languages: {
>         cobolx: { tab_size: 2 },
>         python: { tab_size: 99 },
>         cpp: { format_on_save: 'yes' },
>         markdown: 5
>     }
```

The wrong `editor.languages` record gains `cpp: { format_on_save: 'yes' }` (brief, Tests, G13). The existing records are unchanged.

`tests/server/machine/pty/channel.test.ts`:

```
$ diff <base>/tests/server/machine/pty/channel.test.ts <worktree>/tests/server/machine/pty/channel.test.ts
5c5,8
< import { afterEach, describe, expect } from 'vitest';
---
> import { createServer, type Server } from 'node:http';
> import type { AddressInfo } from 'node:net';
> import { afterEach, describe, expect, vi } from 'vitest';
> import { WebSocket } from 'ws';
6a10
> import { attachSocket } from '../../../../src/lib/server/root/socket.ts';
105a110,155
> /** A real socket server over `held`, which records whether each message was let write. */
> async function socketOver(
>     held: Terminals,
>     hub: Hub
> ): Promise<{ port: number; writable: boolean[] }> {
>     const server: Server = createServer();
>     await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
>     const writable: boolean[] = [];
>     const attached = attachSocket(server, hub, {
>         path: '/ws',
>         token: TOKEN,
>         terminals: {
>             subscribed: (sink, channels) => held.subscribed(sink, channels),
>             inbound: (sink, data, canWrite) => {
>                 if (data.includes('"input"')) writable.push(canWrite);
>                 return held.inbound(sink, data, canWrite);
>             },
>             remove: (sink) => held.remove(sink)
>         }
>     });
>     closers.push(() => {
>         attached.close();
>         server.close();
>     });
>     return { port: (server.address() as AddressInfo).port, writable };
> }
> 
> const closers: (() => void)[] = [];
> const clients: WebSocket[] = [];
> 
> afterEach(() => {
>     while (clients.length > 0) clients.pop()?.close();
>     while (closers.length > 0) closers.pop()?.();
> });
> 
> /** A page's socket: its subscribe message, sent once the socket is open. */
> async function pageOn(port: number, subscribe: object): Promise<WebSocket> {
>     const client = new WebSocket(`ws://127.0.0.1:${port}/ws`, {
>         headers: { origin: `http://127.0.0.1:${port}` }
>     });
>     clients.push(client);
>     await new Promise((resolve) => client.once('open', resolve));
>     client.send(JSON.stringify(subscribe));
>     return client;
> }
> 
108,110c158,161
<         const { held, driver: record } = terminals();
<         const page = recorder();
<         held.subscribed(page.sink, [CHANNEL], undefined, TOKEN);
---
>         const { held, hub, driver: record } = terminals();
>         const { port, writable } = await socketOver(held, hub);
>         const client = await pageOn(port, { type: 'subscribe', channels: [CHANNEL] });
>         await vi.waitFor(() => expect(record.attached()).toEqual([ID]));
113,114c164
<         held.inbound(
<             page.sink,
---
>         client.send(
116a167
>         await vi.waitFor(() => expect(writable).toEqual([false]));
126c177
<         held.subscribed(page.sink, [CHANNEL], TOKEN, TOKEN);
---
>         held.subscribed(page.sink, [CHANNEL]);
```

The terminal input test keeps its title and drives the gate the socket now holds: it opens a real socket over `attachSocket`, subscribes with no token, sends input and asserts the sink was told it may not write; the second half subscribes with the token. The assertion it makes (input without the token is refused, input with it goes through) is the one it made over `held.subscribed(sink, channels, token, expectedToken)`; the call form changed because the gate moved to `server/root/socket.ts` (brief, Tests, G1).

`tests/server/root/context-fixture.ts`:

```
$ diff <base>/tests/server/root/context-fixture.ts <worktree>/tests/server/root/context-fixture.ts
9a10
> import { createRelay } from '../../../src/lib/server/machine/lsp/relay.ts';
46a48,56
>     const relay =
>         overrides.relay ??
>         createRelay({
>             engine: '/fixture/engine',
>             node: process.execPath,
>             roots: () => [],
>             lspFolder: () => '/fixture/lsp',
>             approvals: () => '/fixture/approvals.json'
>         });
58a69
>         relay,
137a149
>             void relay.close();
```

The fixture context gains a relay (`createRelay` over fixture paths) and closes it, since `ServerContext` now holds one.

Files whose only change is the folder they moved into and the imports that follow (`tests/routes/machine/commands.test.ts`, `schedules.test.ts`, `tests/routes/sessions/terminal-actions.test.ts`, `tests/server/machine/approvals/approvals.test.ts` and the moved files of `commands/` and `schedules/`): the lines of each diff that are not an `import`/`from` line, which are none when nothing but an import path changed:

```
tests/routes/machine/commands.test.ts -> tests/routes/machine/commands.test.ts: 5 changed lines, 0 that are not an import path
tests/routes/machine/schedules.test.ts -> tests/routes/machine/schedules.test.ts: 7 changed lines, 0 that are not an import path
tests/routes/sessions/terminal-actions.test.ts -> tests/routes/sessions/terminal-actions.test.ts: 3 changed lines, 0 that are not an import path
tests/server/machine/approvals/approvals.test.ts -> tests/server/machine/approvals/approvals.test.ts: 3 changed lines, 0 that are not an import path
tests/server/machine/commands/commands-fixture.ts -> tests/server/machine/runs/commands/commands-fixture.ts: 3 changed lines, 0 that are not an import path
tests/server/machine/commands/placeholders.test.ts -> tests/server/machine/runs/commands/placeholders.test.ts: 7 changed lines, 0 that are not an import path
tests/server/machine/commands/run.test.ts -> tests/server/machine/runs/commands/run.test.ts: 15 changed lines, 0 that are not an import path
tests/server/machine/schedules/file.test.ts -> tests/server/machine/runs/schedules/file.test.ts: 15 changed lines, 0 that are not an import path
tests/server/machine/schedules/record.test.ts -> tests/server/machine/runs/schedules/record.test.ts: 15 changed lines, 0 that are not an import path
tests/server/machine/schedules/run.test.ts -> tests/server/machine/runs/schedules/run.test.ts: 9 changed lines, 0 that are not an import path
tests/server/machine/schedules/schedules-fixture.ts -> tests/server/machine/runs/schedules/schedules-fixture.ts: 15 changed lines, 0 that are not an import path
tests/server/machine/schedules/watch.test.ts -> tests/server/machine/runs/schedules/watch.test.ts: 11 changed lines, 0 that are not an import path
```

## Files with line counts

A moved file appears under "gone" at its old path and under "new" at its new one. The counts are `wc -l`-style newline counts of the files as they stand (`rep/inventory.py`: the worktree against `/Users/axelfaes/workspace/research-hub/.agents/worktrees/D23-base/tools/oculus`, over `config`, `src`, `tests` and `utils`, `local.yml` left out).

### New files (93)

| lines | file |
|---|---|
| 8 | `config/text/views/system/machine/output.yml` |
| 164 | `src/lib/server/machine/lsp/choices.ts` |
| 75 | `src/lib/server/machine/lsp/clangd/adapter.ts` |
| 178 | `src/lib/server/machine/lsp/clangd/cpp-file.ts` |
| 163 | `src/lib/server/machine/lsp/clangd/databases.ts` |
| 524 | `src/lib/server/machine/lsp/held.ts` |
| 233 | `src/lib/server/machine/lsp/process.ts` |
| 92 | `src/lib/server/machine/lsp/pyright/adapter.ts` |
| 193 | `src/lib/server/machine/lsp/pyright/interpreter.ts` |
| 867 | `src/lib/server/machine/lsp/relay.ts` |
| 306 | `src/lib/server/machine/lsp/servers.ts` |
| 296 | `src/lib/server/machine/lsp/uris.ts` |
| 150 | `src/lib/server/machine/lsp/watch.ts` |
| 110 | `src/lib/server/machine/lsp/wire.ts` |
| 40 | `src/lib/server/machine/runs/commands/chain.ts` |
| 241 | `src/lib/server/machine/runs/commands/files.ts` |
| 188 | `src/lib/server/machine/runs/commands/found.ts` |
| 28 | `src/lib/server/machine/runs/commands/list.ts` |
| 102 | `src/lib/server/machine/runs/commands/placeholders.ts` |
| 28 | `src/lib/server/machine/runs/commands/repo.ts` |
| 55 | `src/lib/server/machine/runs/commands/resolve.ts` |
| 144 | `src/lib/server/machine/runs/commands/routes.ts` |
| 217 | `src/lib/server/machine/runs/commands/run.ts` |
| 170 | `src/lib/server/machine/runs/commands/saved.ts` |
| 706 | `src/lib/server/machine/runs/schedules/file.ts` |
| 339 | `src/lib/server/machine/runs/schedules/record.ts` |
| 284 | `src/lib/server/machine/runs/schedules/routes.ts` |
| 86 | `src/lib/server/machine/runs/schedules/run.ts` |
| 71 | `src/lib/server/machine/runs/schedules/task.ts` |
| 734 | `src/lib/server/machine/runs/schedules/watch.ts` |
| 204 | `src/lib/server/machine/runs/seeds/task-seed.ts` |
| 94 | `src/lib/server/machine/runs/seeds/task-start.ts` |
| 123 | `src/lib/shell/keys/ChoiceRows.svelte` |
| 64 | `src/lib/shell/keys/WorkspaceRows.svelte` |
| 123 | `src/lib/shell/keys/palette-modes.ts` |
| 167 | `src/lib/shell/status/LanguageItems.svelte` |
| 90 | `src/lib/state/system/machine/hpc/hpc.svelte.ts` |
| 105 | `src/lib/state/system/machine/hpc/hpc.ts` |
| 87 | `src/lib/state/system/machine/hpc/submit.ts` |
| 54 | `src/lib/state/system/machine/lsp/clangd.svelte.ts` |
| 110 | `src/lib/state/system/machine/lsp/clangd.ts` |
| 101 | `src/lib/state/system/machine/lsp/documents.svelte.ts` |
| 313 | `src/lib/state/system/machine/lsp/lsp.svelte.ts` |
| 138 | `src/lib/state/system/machine/lsp/references.svelte.ts` |
| 162 | `src/lib/state/system/machine/lsp/references.ts` |
| 152 | `src/lib/state/system/machine/lsp/symbols.ts` |
| 67 | `src/lib/state/system/machine/processes/processes.svelte.ts` |
| 145 | `src/lib/state/system/machine/processes/processes.ts` |
| 80 | `src/lib/state/system/machine/schedules/schedule-when.ts` |
| 90 | `src/lib/state/system/machine/schedules/schedule-words.ts` |
| 566 | `src/lib/state/system/machine/schedules/schedule.svelte.ts` |
| 73 | `src/lib/state/system/machine/usage/usage-refresh.svelte.ts` |
| 84 | `src/lib/state/system/machine/usage/usage.ts` |
| 103 | `src/lib/ui/controls/editor/gutter/editor-gutter.ts` |
| 523 | `src/lib/ui/controls/editor/kit/lsp/client.ts` |
| 165 | `src/lib/ui/controls/editor/kit/lsp/hosts.ts` |
| 90 | `src/lib/ui/controls/editor/kit/lsp/markers.ts` |
| 86 | `src/lib/ui/controls/editor/kit/lsp/peeks.ts` |
| 110 | `src/lib/ui/controls/editor/kit/lsp/semantic.ts` |
| 61 | `src/lib/ui/controls/editor/kit/lsp/services.ts` |
| 19 | `src/lib/ui/controls/editor/kit/lsp/signal.ts` |
| 848 | `src/lib/ui/controls/editor/kit/lsp/transport.ts` |
| 44 | `src/lib/ui/controls/editor/kit/lsp/uris.ts` |
| 531 | `src/lib/ui/controls/editor/kit/theme/colours.ts` |
| 116 | `src/lib/ui/controls/editor/kit/theme/semantic.ts` |
| 181 | `src/lib/ui/controls/editor/kit/theme/theme.ts` |
| 91 | `src/lib/views/sources/files/sections/clangd/Ast.svelte` |
| 69 | `src/lib/views/sources/files/sections/clangd/ClangdSection.svelte` |
| 117 | `src/lib/views/sources/files/sections/clangd/MemoryUsage.svelte` |
| 11 | `src/lib/views/sources/files/sections/clangd/props.ts` |
| 364 | `src/lib/views/sources/search/References.svelte` |
| 30 | `src/lib/views/sources/source/language/extension.ts` |
| 65 | `src/lib/views/sources/source/language/latex-editor.ts` |
| 445 | `src/lib/views/sources/source/language/lsp.ts` |
| 105 | `src/lib/views/sources/source/language/symbols.ts` |
| 59 | `src/lib/views/sources/source/language/tab-language.svelte.ts` |
| 86 | `src/lib/views/system/machine/output/Output.svelte` |
| 83 | `tests/server/machine/lsp/choices.test.ts` |
| 215 | `tests/server/machine/lsp/cpp-file.test.ts` |
| 291 | `tests/server/machine/lsp/lifetime.test.ts` |
| 237 | `tests/server/machine/lsp/lsp-fixture.ts` |
| 117 | `tests/server/machine/lsp/overlap.test.ts` |
| 142 | `tests/server/machine/lsp/relay.test.ts` |
| 101 | `tests/server/machine/lsp/servers.test.ts` |
| 200 | `tests/server/machine/lsp/uris.test.ts` |
| 163 | `tests/server/machine/runs/commands/commands-fixture.ts` |
| 102 | `tests/server/machine/runs/commands/placeholders.test.ts` |
| 167 | `tests/server/machine/runs/commands/run.test.ts` |
| 89 | `tests/server/machine/runs/schedules/file.test.ts` |
| 119 | `tests/server/machine/runs/schedules/record.test.ts` |
| 164 | `tests/server/machine/runs/schedules/run.test.ts` |
| 114 | `tests/server/machine/runs/schedules/schedules-fixture.ts` |
| 386 | `tests/server/machine/runs/schedules/watch.test.ts` |
| 16993 | total, 93 files |

### Changed files (83)

| lines | file |
|---|---|
| 237 | `config/catalogs/glyphs.yml` |
| 236 | `config/catalogs/icons.yml` |
| 1360 | `config/catalogs/options.yml` |
| 180 | `config/text/app.yml` |
| 168 | `config/text/statusbar.yml` |
| 255 | `config/text/views/sources/files.yml` |
| 117 | `config/text/views/sources/search.yml` |
| 92 | `config/text/views/sources/source.yml` |
| 129 | `src/lib/data/helpers/editor.ts` |
| 232 | `src/lib/data/helpers/run/schedules.ts` |
| 603 | `src/lib/data/model/index.ts` |
| 249 | `src/lib/data/model/model-processes.ts` |
| 208 | `src/lib/data/sources/config/editor-options.ts` |
| 565 | `src/lib/data/sources/config/local.ts` |
| 127 | `src/lib/server/core/auth.ts` |
| 169 | `src/lib/server/files/fs/collections.ts` |
| 248 | `src/lib/server/machine/approvals/approvals.ts` |
| 677 | `src/lib/server/machine/pty/channel.ts` |
| 656 | `src/lib/server/machine/pty/routes.ts` |
| 864 | `src/lib/server/root/context.ts` |
| 66 | `src/lib/server/root/process/serve.ts` |
| 164 | `src/lib/server/root/socket.ts` |
| 157 | `src/lib/server/root/watch/local.ts` |
| 505 | `src/lib/shell/keys/Palette.svelte` |
| 499 | `src/lib/shell/panes/PaneView.svelte` |
| 271 | `src/lib/shell/panes/strip/PaneStrip.svelte` |
| 70 | `src/lib/shell/panes/strip/tab-crumbs.ts` |
| 187 | `src/lib/shell/status/SourceItems.svelte` |
| 106 | `src/lib/shell/status/status-items.ts` |
| 565 | `src/lib/state/client/context.ts` |
| 445 | `src/lib/state/client/socket.svelte.ts` |
| 359 | `src/lib/state/shared/stores/shapes.ts` |
| 178 | `src/lib/state/workbench/navigation/editor-status.svelte.ts` |
| 223 | `src/lib/state/workbench/navigation/registry.ts` |
| 348 | `src/lib/state/workbench/palette.ts` |
| 294 | `src/lib/state/workbench/rail-badges.svelte.ts` |
| 440 | `src/lib/ui/controls/ToolButton.svelte` |
| 496 | `src/lib/ui/controls/editor/Editor.svelte` |
| 114 | `src/lib/ui/controls/editor/commands.ts` |
| 142 | `src/lib/ui/controls/editor/kit/folding.ts` |
| 448 | `src/lib/ui/controls/editor/kit/load.ts` |
| 114 | `src/lib/ui/controls/editor/types.ts` |
| 124 | `src/lib/ui/controls/tool-button.ts` |
| 136 | `src/lib/ui/tabs/Breadcrumb.svelte` |
| 494 | `src/lib/ui/tree/TreeItem.svelte` |
| 83 | `src/lib/ui/tree/item-props.ts` |
| 261 | `src/lib/views/boards/focus/CommandCenter.svelte` |
| 146 | `src/lib/views/shared/prose/source-options.ts` |
| 324 | `src/lib/views/sources/files/Files.svelte` |
| 242 | `src/lib/views/sources/files/sections/Outline.svelte` |
| 153 | `src/lib/views/sources/files/sections/Sections.svelte` |
| 499 | `src/lib/views/sources/repositories/diff/Diff.svelte` |
| 317 | `src/lib/views/sources/search/Search.svelte` |
| 281 | `src/lib/views/sources/source/Editor.svelte` |
| 520 | `src/lib/views/sources/source/Source.svelte` |
| 130 | `src/lib/views/sources/source/actions/submit-job.svelte.ts` |
| 47 | `src/lib/views/sources/source/save/LockedCode.svelte` |
| 34 | `src/lib/views/sources/source/save/locked-words.ts` |
| 38 | `src/lib/views/sources/source/save/tab-save.svelte.ts` |
| 128 | `src/lib/views/sources/source/status/ask-perform.ts` |
| 159 | `src/lib/views/system/machine/hpc/Capacity.svelte` |
| 119 | `src/lib/views/system/machine/hpc/Head.svelte` |
| 129 | `src/lib/views/system/machine/hpc/Hpc.svelte` |
| 155 | `src/lib/views/system/machine/hpc/Jobs.svelte` |
| 43 | `src/lib/views/system/machine/hpc/Quota.svelte` |
| 139 | `src/lib/views/system/machine/hpc/Recent.svelte` |
| 190 | `src/lib/views/system/machine/processes/ProcessTable.svelte` |
| 105 | `src/lib/views/system/machine/processes/Processes.svelte` |
| 364 | `src/lib/views/system/machine/usage/Usage.svelte` |
| 33 | `src/routes/api/(machine)/schedules/+server.ts` |
| 35 | `src/routes/api/commands/+server.ts` |
| 556 | `tests/checks/config/config-folder.test.ts` |
| 603 | `tests/checks/config/config.test.ts` |
| 36 | `tests/checks/tree/allow-duplication.txt` |
| 682 | `tests/checks/tree/boundaries.test.ts` |
| 178 | `tests/data/sources/config/local.test.ts` |
| 40 | `tests/data/sources/config/wrong-settings.ts` |
| 90 | `tests/routes/machine/commands.test.ts` |
| 63 | `tests/routes/machine/schedules.test.ts` |
| 339 | `tests/routes/sessions/terminal-actions.test.ts` |
| 59 | `tests/server/machine/approvals/approvals.test.ts` |
| 234 | `tests/server/machine/pty/channel.test.ts` |
| 154 | `tests/server/root/context-fixture.ts` |
| 22025 | total, 83 files |

### Files gone from their old path (40)

| lines | file |
|---|---|
| 40 | `src/lib/server/machine/commands/chain.ts` |
| 241 | `src/lib/server/machine/commands/files.ts` |
| 188 | `src/lib/server/machine/commands/found.ts` |
| 28 | `src/lib/server/machine/commands/list.ts` |
| 102 | `src/lib/server/machine/commands/placeholders.ts` |
| 28 | `src/lib/server/machine/commands/repo.ts` |
| 51 | `src/lib/server/machine/commands/resolve.ts` |
| 144 | `src/lib/server/machine/commands/routes.ts` |
| 212 | `src/lib/server/machine/commands/run.ts` |
| 170 | `src/lib/server/machine/commands/saved.ts` |
| 701 | `src/lib/server/machine/schedules/file.ts` |
| 339 | `src/lib/server/machine/schedules/record.ts` |
| 284 | `src/lib/server/machine/schedules/routes.ts` |
| 86 | `src/lib/server/machine/schedules/run.ts` |
| 71 | `src/lib/server/machine/schedules/task.ts` |
| 734 | `src/lib/server/machine/schedules/watch.ts` |
| 204 | `src/lib/server/machine/seeds/task-seed.ts` |
| 94 | `src/lib/server/machine/seeds/task-start.ts` |
| 90 | `src/lib/state/system/machine/hpc.svelte.ts` |
| 105 | `src/lib/state/system/machine/hpc.ts` |
| 67 | `src/lib/state/system/machine/processes.svelte.ts` |
| 145 | `src/lib/state/system/machine/processes.ts` |
| 80 | `src/lib/state/system/machine/schedule-when.ts` |
| 90 | `src/lib/state/system/machine/schedule-words.ts` |
| 562 | `src/lib/state/system/machine/schedule.svelte.ts` |
| 87 | `src/lib/state/system/machine/submit.ts` |
| 73 | `src/lib/state/system/machine/usage-refresh.svelte.ts` |
| 84 | `src/lib/state/system/machine/usage.ts` |
| 521 | `src/lib/ui/controls/editor/kit/colours.ts` |
| 181 | `src/lib/ui/controls/editor/kit/theme.ts` |
| 65 | `src/lib/views/sources/source/latex-editor.ts` |
| 105 | `src/lib/views/sources/source/symbols.ts` |
| 163 | `tests/server/machine/commands/commands-fixture.ts` |
| 102 | `tests/server/machine/commands/placeholders.test.ts` |
| 167 | `tests/server/machine/commands/run.test.ts` |
| 89 | `tests/server/machine/schedules/file.test.ts` |
| 119 | `tests/server/machine/schedules/record.test.ts` |
| 164 | `tests/server/machine/schedules/run.test.ts` |
| 114 | `tests/server/machine/schedules/schedules-fixture.ts` |
| 386 | `tests/server/machine/schedules/watch.test.ts` |
| 7276 | total, 40 files |

### Outside those four folders

```
$ wc -l HELP.md DESIGN.md package.json package-lock.json README.md
     378 HELP.md
     438 DESIGN.md
     108 package.json
    8186 package-lock.json
      38 README.md
    9148 total
(exit 0)
```

`docs/diagrams/` is regenerated by `npm run diagrams` (run in the gates above); `package-lock.json` is changed by the three dependencies.

## Judgment calls the brief left open


1. **Two wire messages the brief's list does not name.** The page sends `approve` (an interpreter path to approve, `src/lib/server/machine/lsp/wire.ts:40`) so that the interpreter probe runs only after an explicit approval, and the relay sends `legend` (`src/lib/data/model/model-processes.ts:231`) with the server's semantic token legend, since the relay answers the page's `initialize` itself and that answer holds no `semanticTokensProvider` (`src/lib/server/machine/lsp/relay.ts:395`). Reversible by dropping the two messages; the Approve and the semantic colours would then have no carrier.

2. **The types of the frames** are the unions `LspToServer`, `LspToPage`, `LspRpc` and `LspCode` of `data/model/model-processes.ts`; a code `lsp_folder` (the lsp folder cannot be written) is added to the brief's four codes (`not_found`, `exited`, `refused`, `no_answer`), because case 45 needs a state the page can word. `grep -rn LspPayload src tests` prints: `       0 lines`.

3. **Documents are keyed by real path, with one address per root key.** A file opened under two root keys that serve one folder is one document with one `didOpen`; the relay keeps the address each page tab used and publishes diagnostics under both (case 47, `tests/server/machine/lsp/overlap.test.ts`). The brief says "a document belongs to its innermost served root" (Decision 7) and does not say how two keys for one folder behave; the alias form is mine.

4. **The transport answers a disposed model's request with `result: null`** (case 31) rather than an error, and drops a peek model whose read resolves after the transport ended. Reversible.

5. **`relay.ts` is 867 lines**, under the 880 cap and not split further: it is one class whose methods share the held servers, the page sinks and the document table.

6. **A typed interpreter path that is not a Python that answers its version is not chosen**, and the only sentence about it is a note in the server's output (`src/lib/server/machine/lsp/pyright/adapter.ts:75`), which Show Language Server Output shows. The palette row for a typed path says nothing of it. This is a sharp edge: a reader who types a wrong path sees the list stay as it was.

7. **The relay forwards `$/cancelRequest`** with the id of the request mapped to the one its server was given (case 17), so a slow request the page cancelled does not hold the server.

8. **Findings of `.oculus/cpp.yml` are disabled rows of the `:compile-database` list**, of the kind "Finding", ahead of the databases, each worded by `findingLine` (file name, field, message). The "warning tone" of the compile database item is the amber `--c-amber-txt` the notices use for a warning, drawn through a new `warning` prop of `ToolButton` (`src/lib/ui/controls/tool-button.ts`, `ToolButton.svelte`, a shared primitive, so every other use is unchanged by default), with the findings in the item's tooltip. The brief does not define the tone.

9. **The Approve press in the picker asks one `Confirm`** (`level="sheet"`) whose message is `app.palette.approve_ask` and whose detail is the interpreter's path, and its yes is `app.palette.approve_yes`. The brief says the interpreter runs "only after the reader approved its path"; the form of the question is mine.

10. **`LockedCode.svelte` takes the lock as one record** (`{ words, window }`, `save/locked-words.ts`) in place of two props, so `Source.svelte` stays at 520 lines.

11. **The palette commands `interpreter` and `compile-database` are rows of `commands()` with their hints alone**, the form the base holds: `grep -c cmd_theme_hint config/text/app.yml` prints 0 in the base copy and in the worktree.

12. **An allow list is extended**: `tests/checks/tree/boundaries.test.ts` (reported with its diff in "Edits to existing assertions" in part 3).

13. **`npm run test:quick` is intermittent in this tree.** Its svelte-check step fails with "`.svelte-kit/types/src/routes/api/<route>/$types.d.ts` is not a module" on some runs and passes on the same files on others: in three runs back to back it printed pass, fail, pass; in the gate sequence it failed once (route `api/(apps)/approve`) and passed on the rerun. The failing route is a file this step does not touch. The script runs vitest at the same time as `svelte-kit sync` and svelte-check (`tests/tiers/quick.mjs:4`, :231-276); I did not establish whether vitest's own load of `vite.config.ts` rewrites the generated types under svelte-check. Not verified: the cause, and whether main's tree flakes the same way. The row in part 5 quotes a passing run and the failing run's lines.

14. **Sentence length and list items in HELP.md and DESIGN.md** (Verify item 6). The rules in force are the hub's: short plain sentences, one line per paragraph or bullet, a list with as many items as there are. Each place a new or changed sentence is over 45 words, with why it keeps its form, is in part 11, "Sentences over 45 words". Every bullet and paragraph is one line; the new row in the Views table of HELP.md is one row.

## Host- and user-visible changes

Each entry: the view, the state to put it in, what it was, what it is. The orchestrator's landing look reads against these. "TEST" is the workbench page the look runs on.

| view and state | before | after |
|---|---|---|
| Status bar, right group, a Python tab on screen (open `~/workspace/ordo/utils/check_coverage.py`) | No language item. | A `Language Server` item with words "pyright: starting", then "ready" (`statusbar.ls_*`); a press opens a menu of "Restart Language Server" and "Show Language Server Output". A `Python Interpreter` item ("3.13.4 (.venv)", "Select Interpreter", or "<path> not approved") whose press opens the palette on `:interpreter `. |
| Status bar, a C or C++ tab on screen (`~/workspace/cathedra/src/monastery/src/mirrors.cpp`) | No language item. | The `Language Server` item reads "clangd: indexing N of M", then "ready"; a `Compile Database` item reads "build/debug" or "No compile database" and opens `:compile-database `. With a finding in the repository's `.oculus/cpp.yml` the item is amber and its tooltip lists the findings. |
| Status bar, a plaintext tab (a file past `editor.paint_limit_kb`, or a `.txt`) | The language mode item only. | The same: none of the three new items is drawn, since no server serves plaintext. |
| Palette, `:interpreter ` (Python tab) and `:compile-database ` (C or C++ tab) | Not modes. | Each lists the choices of the tab's repository with the one in force marked; a typed path joins the interpreter list; a repository's own interpreter shows "not approved" and its press asks "Run this Python interpreter for this repository?" with the path as detail and "Approve and Select" as its yes. The compile database list has the `.oculus/cpp.yml` findings as disabled "Finding" rows at its head. |
| Source tab (Python, C, C++), editor | Monaco's own features only. | Hover, F12 and Cmd+click, Alt+F12 peek, Shift+F12, completion, signature help, markers for the server's diagnostics (Problems for these arrive in D33), code actions that edit the open file, Format Document (clangd), Format Selection, inlay hints, folding, selection ranges, document highlights, links on `#include`, dimmed inactive regions, semantic colours (clangd), `formatOnType` after Enter (C and C++). |
| Source tab, palette (Cmd+K) with a served tab on screen | Save, Revert File, word wrap, rendered half, Open Preview to the Side, Submit Job, Toggle Blame. | Those first, then "References: Find All References", "References: Find All Implementations", "Go to Next Reference", "Go to Previous Reference", "Python: Select Interpreter", "Python: Restart Language Server", "Python: Show Language Server Output", and for C and C++ "clangd: Select Compile Database", "clangd: Switch Between Source/Header" (Alt+O), "clangd: Show AST", "clangd: Show memory usage", "clangd: Restart language server", "clangd: Show Language Server Output". Labels in `config/text/views/sources/source.yml` (`cmd_*`). |
| Explorer group, key sheet and keys | Files, Search, Repositories; `s1-s3`. | A fourth listed view, `References` (order 3), reached by `s4`; the key sheet and the key table of HELP.md say `s1-s4`. |
| References view (open it with Shift+Alt+F12 on a symbol in `tools/present/build.py`) | Does not exist. | A count line "N results in M files", a row per file and per location with the match marked; Refresh, Clear, Clear History, Collapse All; a row's menu Copy, Copy Path, Dismiss and the count line's Copy All; F4 and Shift+F4 move through the locations; cleared it says "No results." and lists the last ten searches. |
| Files view, sections (a C++ tab on screen) | Outline from the headings of Markdown and LaTeX only. | Outline lists the server's symbols with each kind's icon (26 `symbol_<kind>` glyphs) for Python, C and C++, "No symbols for this file yet." for a language no server serves, "Loading document symbols..." while it asks. Below Outline, an `AST` section after "clangd: Show AST" and a `Memory Usage` section after "clangd: Show memory usage", each with a Close action and each drawn only while it holds an answer. |
| Pane strip, the breadcrumb under the tab strip (a Python, C, C++, Markdown or LaTeX tab) | The path segments. | After the file segment, the symbols that contain the caret, outermost first, each with its kind's icon; a press moves the caret to the symbol's start. Cut from the left when the bar is too narrow, the actions kept. |
| A tab of the `lsp-output` view (Show Language Server Output) | Does not exist. | A tab "Output: pyright (<root key>)" with the server's stderr, read-only plain text, following the end until the reader scrolls up; closing it stops the output. |
| Source tab over a file this machine locks by its mode (set `chmod -w` on a Python file, or switch the mode) | The code window (a plain read-only text) under the line "This file is read-only on this machine...". | The same line, over the editor in its read-only form, which has hover, definition, references and the other features that change no text; a mode change while the tab is open toggles `readOnly` on the same editor. A file too long to have been read whole, and a version at HEAD or in the index, stay in the code window. |
| Settings, `editor.languages` and `local.yml` | Fields `tab_size`, `insert_spaces`, `word_wrap`, `rulers`. | A `format_on_save` toggle per language (a save of a C or C++ file with it `true` formats first; Python has no formatter in pyright, so it does nothing there and the line says so); a `lsp` key of `local.yml` (default `~/.oculus/lsp`) among the keys the Settings view lists. |
| Save in a tab whose language has `format_on_save: true` | Saves as typed. | Formats through the server, applies one undo stop, saves; an answer later than 60 s or an error saves as typed and says why under the editor ("Saved without formatting: ..."). |
| Processes (any page) | No language server processes. | One pyright or clangd per page, root and registry entry, ending 60 s after the last tab of the root and language closes, 60 s after the page closes (unless another page takes it over), at once when the root stops being served, and with the server. |
| Folders (no visible change) | `server/machine/{commands,schedules,seeds}/`, `state/system/machine/*.ts`, `kit/colours.ts`, `kit/theme.ts`. | `server/machine/runs/{commands,schedules,seeds}/`, `state/system/machine/{hpc,processes,schedules,usage}/`, `kit/theme/`, and `views/sources/source/language/`. |

## Anything in the brief that was wrong or impossible

1. **Verify item 1 as worded cannot run.** It says to run `checks.sh` "from the root of the checkout" with `tools/oculus/.scratch/migration/orchestrator-state.md`; the script runs `npm run test:quick`, which needs `tools/oculus/package.json`. Run from the checkout root it prints:

```
$ npm run test:quick
npm error code ENOENT
npm error syscall open
npm error path /Users/axelfaes/workspace/research-hub/.agents/worktrees/D23/package.json
npm error errno -2
npm error enoent Could not read package.json: Error: ENOENT: no such file or directory, open '/Users/axelfaes/workspace/research-hub/.agents/worktrees/D23/package.json'
npm error enoent This is related to npm not being able to find a file.
npm error enoent
npm error A complete log of this run can be found in: /Users/axelfaes/.npm/_logs/2026-10-06T16_34_08_866Z-debug-0.log
checks: failed with exit 254: npm run test:quick
checks: 1 of 1 commands failed
exit 1
```

Run from `tools/oculus` with the state file path relative to it, it passes (part 5).

2. **Case 7, "by name"** reads either as "each shown by its name" or "sorted by name"; the two give different results (the cases section holds the ruling slot).
3. **Case 45, "started again on their next document"** against the page's open documents: with a document open, `reload()` starts the server again at once so the page does not lose its features (ruling slot in case 45).
4. **Case 46: a root key holding `/`** cannot be one path segment of the page address after one percent-encoding (the editor's URI type decodes the path once), so the root key is encoded twice in the address (ruling slot in case 46).
5. **Case 47's memory figures** (320.0 MB peak, 41.3 MB at 60 s) against what the same run measures here (551 MB peak, 50 MB at 60 s): the size at 60 s is near the brief's, the peak is not, and the cause is not established (ruling slot in case 47).
6. **G36 "one table"**: the lifetime test is one `describe` holding one `it` per row, since each row advances its own fake clock past its own deadline; a `test.each` over a row type would hide the per-row clock steps.
7. **Case 52's probe line** `semanticTokensProvider -> undefined` is the relay's own `initialize` answer, which carries no semantic provider by design (Decision 3 and the `legend` frame); the line reads like a failure and is not one.
8. **Unnamed edit of an allow list**: the brief's path list names no `tests/checks/tree/boundaries.test.ts`, and the shell's reading of the server state needs entries there (part 3, "Edits to existing assertions, allow lists and predicates").

## Lines for agents/guarded.md

For the orchestrator to apply at landing, written as `agents/guarded.md` writes its lines. G36 goes after G35, which is the last entry of "Never happens" on main.

```
- G36. A language server oculus started ends: 60 s after the last tab of its root and language closed on a page, or the page closed, when no tab or page took it over; at once when its root is no longer served; and with the oculus server. None is started twice for one page and root: one pyright serves a page's Python tabs of a root, and one clangd its C and C++ tabs.
  Code: `src/lib/server/machine/lsp/process.ts`, `src/lib/server/machine/lsp/relay.ts`.
  Test: `tests/server/machine/lsp/lifetime.test.ts`, describe 'the life of a language server', one `it` per row: 'ends 60 s after the last tab of its root and language closed, and not at 59.999 s'; 'is kept by a tab reopened at 30 s, and ends 60 s after the next close'; 'is started again by a tab reopened at 70 s, the first having ended at 60 s'; 'is not ended while another tab of its root and language stays open'; 'ends 60 s after the page closed, and not at 59.999 s'; 'is taken over by another page that opens its root and language at 30 s, with one spawn'; 'ends at once when its root stops being served'; 'ends with the oculus server'; 'is one clangd for a c tab and a cpp tab of one root on one page'; 'is one pyright for two Python tabs of one root on one page'; 'is sent SIGTERM at 2 s and SIGKILL at 5 s when it answers no shutdown'; 'is ended at 30 s when it answers no initialize, and the page is told no_answer'; 'answers a request that waited on an initialize never answered with an error when it ends'; 'is started again on the next request after it exits by itself, and stays failed after a second exit within 3 minutes'; 'is started again after an exit that comes 3 minutes or more after the one before'; 'ends a server that was being started when its page closed'.
```

New Test lines and widened Code lines, each entry named with the line to add:

- G1. Code: add `src/lib/server/machine/lsp/relay.ts` and `src/lib/server/root/socket.ts`. Test: add the lsp channel: `tests/server/machine/lsp/relay.test.ts`, 'refuses an lsp message from a socket that carried no token, and sends nothing to a server'; `tests/server/machine/lsp/relay.test.ts`, 'admits a socket whose subscribe of no channels carries the token'; `tests/server/machine/lsp/relay.test.ts`, 'keeps refusing a socket whose subscribe of no channels carries a wrong token'. The terminal input test is `tests/server/machine/pty/channel.test.ts`, 'refuses input from a socket that carried no token': file and title unchanged, the test now drives the gate through `attachSocket`.

- G2. Code: add `src/lib/server/machine/lsp/uris.ts` and the `lsp:` channel. Test: add `tests/server/machine/lsp/uris.test.ts`, 'is refused for %s' (one table over the page URIs of case 30).

- G7. Code: add `src/lib/server/machine/lsp/servers.ts` and `src/lib/server/machine/lsp/pyright/interpreter.ts`. Test: add `tests/server/machine/lsp/servers.test.ts`, 'starts each server and the interpreter probe with an argument array, the root path one argument whatever it holds'.

- G13. Code: add `src/lib/server/machine/lsp/clangd/cpp-file.ts`. Test: add `tests/server/machine/lsp/cpp-file.test.ts`, 'skips an entry with %s and reads the entries after it' (one table over case 33's inputs); `tests/data/sources/config/local.test.ts`, 'answers %j with the sentence it would throw' (the `lsp: 3` row of the `checkLocal` describe); and `tests/checks/config/config.test.ts` among the other readers, 'words each wrong setting against behavior.yml from the catalog, and nothing for the shipped files' (it holds the `format_on_save` key).

- G31. Code: add `src/lib/server/machine/lsp/choices.ts`. Test: add `tests/server/machine/lsp/choices.test.ts`, 'reads a choices file that is not JSON as empty and refuses a write over it, leaving it'.

The test titles above are each checked against the test files by `rep/lib.py`'s `T()`, which stops the report generator when a title is not in its file.

Lines of `agents/guarded.md` that name a moved file (on main, `grep -n "machine/commands/\|machine/schedules/\|machine/seeds/\|tests/server/machine/commands\|tests/server/machine/schedules" agents/guarded.md`), each with its new path:

```
guarded.md:27:
  was      `tests/server/machine/commands/placeholders.test.ts`
  becomes  `tests/server/machine/runs/commands/placeholders.test.ts`
  was      `tests/server/machine/commands/placeholders.test.ts`
  becomes  `tests/server/machine/runs/commands/placeholders.test.ts`
guarded.md:61:
  was      `tests/server/machine/commands/run.test.ts`
  becomes  `tests/server/machine/runs/commands/run.test.ts`
  was      `tests/server/machine/commands/run.test.ts`
  becomes  `tests/server/machine/runs/commands/run.test.ts`
guarded.md:69:
  was      `src/lib/server/machine/commands/saved.ts`
  becomes  `src/lib/server/machine/runs/commands/saved.ts`
guarded.md:70:
  was      `tests/server/machine/schedules/record.test.ts`
  becomes  `tests/server/machine/runs/schedules/record.test.ts`
  was      `tests/server/machine/schedules/record.test.ts`
  becomes  `tests/server/machine/runs/schedules/record.test.ts`
guarded.md:75:
  was      `src/lib/server/machine/seeds/task-start.ts`
  becomes  `src/lib/server/machine/runs/seeds/task-start.ts`
```

Line 75 also names `pty/compose.ts`, which Q123 moves; the orchestrator writes that part at its landing.


## Doc text

No shared document was kept out of this step's paths: `HELP.md`, `DESIGN.md` and `config/text/app.yml` are written in the worktree, each line as the base holds it with the brief's change made. Q125 rewrites HELP.md and DESIGN.md beside this step; whichever lands second carries the other's text, which the orchestrator does (brief, "Shared paths").

### Paragraphs that describe changed behaviour, each read

Rewritten (the line number is the worktree's):

- DESIGN.md:23 (what oculus is): the language server client named. DESIGN.md:87 (config files): `format_on_save` in the language record. DESIGN.md:116 (the socket) and :154 (auth): the `lsp:<language>` channel and the one set of sockets that carried the token. DESIGN.md:158 (processes) and :421: the two processes that end without a confirmation, the interpreter's approval entry, the `runs/` paths. DESIGN.md:177 (the layers table): the two state modules the shell reads. DESIGN.md:250 (what a changed `local.yml` rebuilds): `lsp`. DESIGN.md:140, :375, :383 and :416: the `server/machine/runs/` paths, nothing else of each line. DESIGN.md:394 (the code window): what it draws now. DESIGN.md:398 (files open as an editor opens them): a mode-locked file opens in the editor, read-only. DESIGN.md:399 (the editor's options): sticky scroll's sources, the three options set for a served model, `format_on_save`. DESIGN.md:402 (the editor primitive's theme): `kit/theme/theme.ts` and the semantic rules. DESIGN.md:406 (search): Find All References through the server. DESIGN.md:407 (new item): the References view. DESIGN.md:432 (tabs and the breadcrumb): the symbol segments. DESIGN.md:435 (the status bar): the three language items. DESIGN.md:438 (new item): the language servers.
- HELP.md:50 (the path over a file tab): symbols. HELP.md:77 (key table): `s1-s4`. HELP.md:108 (the palette): `:interpreter` and `:compile-database`. HELP.md:112 (the status bar): the three items. HELP.md:130 (the Files view): Outline symbols, the AST and Memory Usage sections. HELP.md:133 (new row): the References view. HELP.md:177 (what opens in `source`): a locked file in the editor. HELP.md:181 (the editor's options): `format_on_save`, semantic colours, `formatOnType`, sticky scroll. HELP.md:183 (new paragraph): the language servers. HELP.md:191 (find in files): Find All References. HELP.md:308 (`local.yml`): `lsp`, the approvals of interpreters.
- `config/text/app.yml:12` (the key sheet): `s1-s4`.
- README.md:15 (the runtime dependencies with their licences): `pyright`, `vscode-jsonrpc` and `vscode-languageserver-protocol`, each MIT (`grep '"license"' node_modules/<name>/package.json`).

Still true (read against the change, left as they are):

- DESIGN.md:89 (paths resolve through `local.yml`), :331 (an app's approval in `approvals.json`; the file's one shape is the interpreter entry's too) and :376 and :405 (what `local.yml` carries and where it sits; the `lsp` key is read through the same `readLocal`).
- HELP.md:273 (a source tab over a repository file marks its changes in the gutter): the gutter code moved to `ui/controls/editor/gutter/editor-gutter.ts` and its behaviour is the one described.


### Sentences over 45 words (Verify item 6)

The new or changed sentences of HELP.md, DESIGN.md that name this step's subjects and run 45 words or more (a sentence is a run to a full stop before a capital or a backtick; `rep/make.py` `sentences_over`, compared with main's file), each with its word count:

```
HELP.md:21: 95 words: As shipped there are twelve, top to bottom: Focus, Sessions, Projects, Incoming (the Inbox, Lit Watc...
HELP.md:50: 45 words: In a source tab whose file has symbols (a Python, C or C++ file a language server serves, a Markdown...
HELP.md:108: 54 words: While a Python tab is on screen, `:interpreter` lists the interpreters of its repository and takes a...
HELP.md:112: 200 words: On the right, for a source tab over a file of a repository: the caret line's blame, whether or not G...
HELP.md:130: 171 words: Outline follows the file tab the reader looked at last on the page, so pressing the Files tab does n...
HELP.md:177: 71 words: Whether it can be saved is the file's mode on this machine: a file this machine locks opens in the e...
HELP.md:181: 93 words: `editor.languages` holds a record per language name with `tab_size`, `insert_spaces`, `word_wrap`, `...
HELP.md:181: 58 words: Sticky scroll pins the headings of a Markdown or LaTeX file, the blocks TypeScript, JavaScript, JSON...
HELP.md:183: 48 words: A Python, C or C++ file in a source tab is served by a language server oculus starts in the backgrou...
HELP.md:308: 291 words: Its keys are `hub`, the absolute path of the research hub; `port`, the port the server listens on; `...
DESIGN.md:87: 351 words: What the portfolio reads in `sources.yml` (the tier scan paths, the registry and collection files, t...
DESIGN.md:154: 72 words: The socket checks `allowedOrigin` on its upgrade, which does not pass through `handle`, and accepts ...
DESIGN.md:158: 101 words: Two processes end without one: the terminal of a schedule's earlier run, which the due time or the R...
DESIGN.md:158: 66 words: A Python interpreter a repository holds (`.venv`, `venv`), which oculus runs once to read its versio...
DESIGN.md:158: 85 words: A placeholder's value (`${file}`, `${selectedText}` and the others) is never written into the line: ...
DESIGN.md:250: 131 words: `local.yml` is read again whenever it changes, by the one watch on it (`server/root/watch/local.ts`)...
DESIGN.md:375: 174 words: A terminal that ends leaves the list, except a task terminal, which tmux keeps with `remain-on-exit`...
DESIGN.md:383: 71 words: `composeAt` opens the composer in the page's Terminal tab with the agent and the folder it is given,...
DESIGN.md:394: 82 words: The highlight.js highlighter, which sits in `data/prose/languages.ts` so the server paints with it t...
DESIGN.md:399: 79 words: They come from Monaco's language services for TypeScript, JavaScript, JSON, CSS, SCSS, Less and HTML...
DESIGN.md:416: 58 words: `taskCommand` in `server/machine/runs/schedules/task.ts` builds `<claude> '/research-cockpit <kind>'...
DESIGN.md:416: 61 words: The only way a run starts with `--dangerously-skip-permissions` is a schedule's Run unattended choic...
DESIGN.md:432: 59 words: After the file segment, a source tab whose file has document symbols (a file a language server serve...
DESIGN.md:435: 45 words: The right group is the source tab's caret, indentation, encoding and line ending, then, for a file a...
DESIGN.md:438: 51 words: A Python, C or C++ file in a source tab is served by pyright or clangd, which the oculus server star...
DESIGN.md:438: 51 words: A repository's `.oculus/cpp.yml` names configurations (a database folder and fallback flags) that th...
DESIGN.md:438: 45 words: A file locked by its mode opens in the same editor read-only so its features work, while a file too ...
```

Why they keep their form. Each is one enumeration whose head and members belong together: a list of the features a server gives (HELP.md:183, DESIGN.md:399 and :402), a list of what a rebuild or a config key covers (DESIGN.md:87 and :250, which the brief words), the one sentence the brief prescribes for the processes paragraph (DESIGN.md:158) and the list of what the Files view and the status bar draw (HELP.md:112 and :130, DESIGN.md:432 and :435). Splitting an enumeration puts its head in one sentence and its members in the next with nothing to say what they are members of. Where a sentence of my own text ran on past one thought, it is two sentences (HELP.md:183 and DESIGN.md:438 each split at the colon or semicolon that joined two statements). The three-item lists are not padded or trimmed: each list has as many items as there are. Every paragraph and bullet is one line.
