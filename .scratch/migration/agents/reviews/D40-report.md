Everything in the brief is done. The page halves the brief assigns to the orchestrator's look at landing (the squiggles and lightbulb in the editor, the dialog as drawn, the greyed menu item) were not looked at by me, since the builder starts no browser and no app; their route and store halves are quoted below. Landing after D39 needs a hand merge of `lsp-edit.ts` and `ops.ts`, written out in "Landing after D39".

## Open items of the state file (orchestrator-state.md, "Open items", verbatim)

The worktree's copy of the state file reads `None.` under this heading. The text below is main's copy of `tools/oculus/.scratch/migration/orchestrator-state.md`, read with `awk '/^## Open items/{p=1} /^## Booked/{p=0} p'`.

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

- 22 (2026-10-09, D39's landing). The rename box has no hint line. In VS Code, pressing F2 opens a small box with the name in it, and under the box a grey line names the two keys; Monaco's own label for that line reads "Enter to Rename, Cmd+Enter to Preview" (`monaco-editor/esm/vs/editor/contrib/rename/browser/renameWidget.js:174-175`). In oculus after D39 the box opens and Cmd+Enter does open the Refactor Preview, but that grey line is not drawn, so nothing on screen tells you Cmd+Enter exists (it is named only in `HELP.md` and the guide). D39's brief left it out, because Monaco draws the line only when its edit service says it can preview, and making it say so means replacing one of Monaco's internal services (`IBulkEditService`) with oculus's own, imported from Monaco's internal files, which oculus does not do anywhere today. That replacement would also take over every rename of every language (it decides whether an edit goes straight in or to the preview), and Monaco's own Cmd+Enter binding would then duplicate oculus's, so one of the two is removed. No remaining step of the plan touches the editor, so there is no step to fold it into, and a new step needs your yes.
  - (a) Recommended: a new step, D39b, that builds the hint line through that service replacement, with oculus's Cmd+Enter binding removed in favour of Monaco's own, and a test that a rename with and without Cmd+Enter goes where it should. It gives VS Code's rename box as it is. Cost: one internal Monaco import, which a Monaco upgrade can break; the step's test would catch that.
  - (b) Leave it: the box works and Cmd+Enter previews, with no line naming the key. This is the lazy option.
- 23 (2026-10-09, /spec D41, a library check). D41 asks for three things that Microsoft's Markdown language server already does, the same server that gives VS Code its Markdown features: a mark on a link to a file that does not exist, Cmd+click on a link to open its file, and, when a file or folder is moved, the edits that rewrite every Markdown link pointing into it (its request `markdown/getEditForFileRenames`). The package is `vscode-markdown-languageserver` 0.5.0 (MIT, Microsoft, released 2026-07-16, Node 22 or later; oculus runs Node 24), built on `vscode-markdown-languageservice` 0.5.0. To run it, oculus answers its custom requests the way the relay already answers the YAML server's schema requests: `markdown/parse` (the tokens of a file, which the server expects from markdown-it, `markdown-it` 15.0.2, MIT, a new dependency, since oculus renders with `marked`), the file reads `markdown/fs/readFile`, `readDirectory` and `stat`, the watchers, and `markdown/findMarkdownFilesInWorkspace`, each kept inside the served roots. The backticked hub paths (`` `docs/DATA-MAP.md` `` in prose) are not Markdown links, so no library marks or opens them; that part, the Audit item for a wrong `type` and the two defects from M7 are hand-written whatever the choice. The library is a choice the rules leave to you, so the brief is not written until you rule.
  - (a) Recommended: the Markdown language server as one more served language in the relay (`.md` tabs), with the custom requests answered by the relay, markdown-it added for `markdown/parse`, the Files view's move and rename asking the server for `markdown/getEditForFileRenames` and showing the edit in the Refactor Preview D39 built, and the backticked paths answered by an entry hook as D39's hub keys are. Pros: VS Code's own behaviour and wording for link checks, Cmd+click and link updates, and with it heading links, link completion, document symbols, Find All References to a heading or a file, and rename of a heading; maintained by the VS Code team. Cons: one more child process per served root while a Markdown tab is open; two new dependencies; the README calls the server "still in development" for clients other than VS Code, so the relay's answers to its custom requests need their own tests.
  - (b) `vscode-markdown-languageservice` used as a library inside the oculus server, with no separate process. Pros: no child process; the same link features. Cons: oculus then hosts by hand what the server package already wires (the document store, the diagnostics schedule, the workspace), against how every other language is served in oculus (`server/machine/lsp/`), and still needs markdown-it.
  - (c) Write it by hand: a link scanner over `marked`'s tokens, a definition answer and a rewrite of links on a move. Pros: no new dependency. Cons: every rule of Markdown link resolution (reference links, angle-bracket and percent-encoded paths, `#` fragments, links in HTML) is written and tested again, and it covers less than (a); this is the lazy option.

## Landing after D39

D39 is on main and not in this worktree (the worktree's base is the tree D40 was dispatched at). `diff3 -m` of the worktree, the base and main over the 15 files both changed gives these conflicts: `src/lib/server/files/fs/lsp-edit.ts`, `src/lib/server/files/fs/ops.ts` (two import lines) and the Linters section of `docs/files-and-search.md` (main added "Hub keys in YAML files" directly above it). `src/lib/server/core/paths.ts`, `src/lib/server/machine/lsp/library/rules.ts` and `src/lib/server/machine/lsp/adapters/yaml/machine-file.ts` are byte-identical to main's (`cmp` prints nothing), so they merge as no change. The other files both changed (`data/file-ops.ts`, `data/model/index.ts`, `history.ts`, `server/root/context.ts`, `config/text/views/sources/source.yml`, `tests/checks/source/keys.test.ts`, `DESIGN.md`, `HELP.md`, `docs/views.md`) merged without markers under `diff3 -m`. This is a prediction from `diff3` and not a run of the cherry-pick.

What each overlapping file should hold after the merge:

- `lsp-edit.ts`, `plan`: keep D39's `withheld` check (`const found = resolveRootPath(...); if ('path' in found && under(found.path, scope.withheld)) return fail('outside');`) and drop this step's `scope.isPrivate` block and the `isPrivate` field of `LspEditScope`, since D39's check runs for both operations and refuses the same two folders (`privateFolders`: the hub's `secrets` folder and `~/.oculus`).
- `lsp-edit.ts`, `plan` and the size limit: D39 reads and checks every file against `WRITE_MAX_BYTES` (5 MB) and its `limitOf` in `history.ts` gives a copy of kind `writing-fix` the 256 KB `SAVE_MAX_BYTES` (only `delete` and `lsp-edit` get 5 MB). A `writing-fix` of a file between 256 KB and 5 MB would then pass `plan` and `keepCopy` would return `{ ok: true, kept: null }`, so the file would be written with no copy and its undo could not restore it. After the merge `plan` takes the operation and checks `operation === 'writing-fix' ? SAVE_MAX_BYTES : WRITE_MAX_BYTES` in both places D39 uses `WRITE_MAX_BYTES` (`readChecked` and `after.length`), with `SAVE_MAX_BYTES` still imported from `./history.ts`. The folder plan already lists a file over 256 KB with a reason and no edits (`folder.ts`, `SAVE_MAX_BYTES`), so the page never asks for it; the server check is for a request that does not come from the page. This is not verified here, because D39's `WRITE_MAX_BYTES` is not in this tree.
- `lsp-edit.ts`, `write` and `lspEditFiles`: keep this step's `operation` parameter (`write(scope, one, operation)` calls `keepCopy(scope.history, one.real, operation)`; `lspEditFiles(scope, files, operation)` passes it to `plan` and `write`) and D39's body otherwise. The head comment keeps D39's wording of the checks plus "for `writing-fix` the limit is 256 KB".
- `ops.ts`: keep D39's `withheld: privateFolders(into.hub ?? null, into.home ?? homedir())` in the scope and its `withheld: scope.withheld` in the `lsp-edit` call, drop this step's `Scope.isPrivate`, its `homedir`, `privateFolders` and `under as inFolders` imports, and let `case 'lsp-edit': case 'writing-fix':` pass `request.op` as the third argument of `lspEditFiles`. The G3 row 'refuses `outside` for a file under the hub's secrets folder' in `writing-fix.test.ts` builds its world with `{ ...w.ops, hub: w.hub }`, which is the `into.hub` D39's `withheld` reads.
- `history.ts`: this step adds `'writing-fix'` to `HistoryKind`, `EDIT_KINDS` and the zod enum; D39's `limitOf` is left as it is.

## The ruling of round 0 and what the tree does

- Python docstrings: `comment-worker.mjs:77` counts a character as docstring text when a scope of its token starts with `string.quoted.docstring.`. The table below is the output of `node probe/prefixes.mjs` run for this report; every scope that does not start with `string.quoted.docstring.` is a string the writing rules do not mark.

```
prefix "" quote """: string.quoted.docstring.multi.python
prefix "" quote ''': string.quoted.docstring.multi.python
prefix "r" quote """: string.quoted.docstring.raw.multi.python
prefix "r" quote ''': string.quoted.docstring.raw.multi.python
prefix "R" quote """: string.quoted.docstring.raw.multi.python
prefix "R" quote ''': string.quoted.docstring.raw.multi.python
prefix "u" quote """: string.quoted.multi.python
prefix "u" quote ''': string.quoted.multi.python
prefix "U" quote """: string.quoted.multi.python
prefix "U" quote ''': string.quoted.multi.python
prefix "b" quote """: string.quoted.binary.multi.python
prefix "b" quote ''': string.quoted.binary.multi.python
prefix "B" quote """: string.quoted.binary.multi.python
prefix "B" quote ''': string.quoted.binary.multi.python
prefix "f" quote """: meta.fstring.python > string.interpolated.python > string.quoted.multi.python
prefix "f" quote ''': meta.fstring.python > string.interpolated.python > string.quoted.multi.python
prefix "F" quote """: meta.fstring.python > string.interpolated.python > string.quoted.multi.python
prefix "F" quote ''': meta.fstring.python > string.interpolated.python > string.quoted.multi.python
prefix "rb" quote """: string.regexp.quoted.multi.python
prefix "rb" quote ''': string.regexp.quoted.multi.python
prefix "Rb" quote """: string.quoted.raw.binary.multi.python
prefix "Rb" quote ''': string.quoted.raw.binary.multi.python
prefix "br" quote """: string.regexp.quoted.multi.python
prefix "br" quote ''': string.regexp.quoted.multi.python
prefix "fr" quote """: meta.fstring.python > string.interpolated.python > string.quoted.raw.multi.python
prefix "fr" quote ''': meta.fstring.python > string.interpolated.python > string.quoted.raw.multi.python
prefix "rf" quote """: meta.fstring.python > string.interpolated.python > string.quoted.raw.multi.python
prefix "rf" quote ''': meta.fstring.python > string.interpolated.python > string.quoted.raw.multi.python
```

| Prefix | Scope | Marked as a docstring |
|---|---|---|
| none | `string.quoted.docstring.multi.python` | yes |
| `r`, `R` | `string.quoted.docstring.raw.multi.python` | yes |
| `u`, `U` | `string.quoted.multi.python` | no (reported) |
| `b`, `B` | `string.quoted.binary.multi.python` | no (reported) |
| `f`, `F` | `meta.fstring.python > string.interpolated.python > string.quoted.multi.python` | no (reported) |
| `rb`, `br` | `string.regexp.quoted.multi.python` | no (reported) |
| `Rb` | `string.quoted.raw.binary.multi.python` | no (reported) |
| `fr`, `rf` | `meta.fstring.python > string.interpolated.python > string.quoted.raw.multi.python` | no (reported) |

- Case 20 has no row while the file is skipped, and with `lint.writing_skip: []` two `en-dash` rows on line 95, each with 3 suggestions and no fix (output under "Cases on the finished tree").
- Case 12 gives three `arrow` rows on line 45 of `Q73-report.md`, each with the `->` fix and the ` to ` suggestion (same output).
- Case 22b (a raw docstring) is the test 'marks the arrow of a raw docstring (case 22b)' in G71's file.
- `server-context.ts` is edited at `src/lib/server/root/process/server-context.ts` (`comments: HeldComments` at line 54).
- Functions changed in `src/lib/server/files/fs/lsp-edit.ts`: `plan` (the private-folder refusal for `writing-fix`), `write` (the copy is kept under the operation's kind) and `lspEditFiles` (it takes `operation`, with no default). The exported type `LspEditOperation` and the field `LspEditScope.isPrivate` are new; the head comment lists the extra refusal.

## The cases' first run on the unchanged tree

Command: `node /private/tmp/claude-502/d40-builder/probe/first-run.mjs` (Node 24.21.0), run before any change. It imports `routes.ts`, `runs.ts`, `eslint.ts`, `json.ts` and `ops.ts` of the worktree as dispatched and posts to `handleLint` and `handleOps` with the write token; cases 1 to 20 run over the worktree as root `hub`, the synthetic cases over a temporary folder. Its output as printed (`probe/first-run.out`):

```
case 1: lint writing tools/oculus/.scratch/migration/agents/guarded.md -> 400 {"ok":false,"error":"bad_body"}
case 2: lint writing funding/2026-fwo-senior-transplant/proposal/long-proposal/reviews/round6/R2-domain-pathology.md -> 400 {"ok":false,"error":"bad_body"}
case 3: lint writing tools/oculus/.scratch/migration/orchestrator-state.md -> 400 {"ok":false,"error":"bad_body"}
case 4: lint writing tools/oculus/.scratch/migration/agents/reviews/U2-audit.md -> 400 {"ok":false,"error":"bad_body"}
case 5: lint writing projects/manuscripts/bttd-source-eeg/admin/SUBMISSION_CHECKLIST.md -> 400 {"ok":false,"error":"bad_body"}
case 6: lint writing projects/coauthor/active/clinical-hccnet/admin/coauthor-request.md -> 400 {"ok":false,"error":"bad_body"}
case 7: lint writing tools/oculus/.scratch/migration/agents/reviews/A3-report.md -> 400 {"ok":false,"error":"bad_body"}
case 8: lint writing deck/title.md -> 400 {"ok":false,"error":"bad_body"}
case 9: lint writing docs/HPC-UTwente-howto.md -> 400 {"ok":false,"error":"bad_body"}
case 10: lint writing projects/manuscripts/bt-operator-theory/notes/derivations/07-depth-amplification.md -> 400 {"ok":false,"error":"bad_body"}
case 11: lint writing tools/oculus/.scratch/migration/agents/reviews/R17.md -> 400 {"ok":false,"error":"bad_body"}
case 12: lint writing tools/oculus/.scratch/migration/agents/reviews/Q73-report.md -> 400 {"ok":false,"error":"bad_body"}
case 13: lint writing funding/2026-nwo-enw-xs/assessment/mail.md -> 400 {"ok":false,"error":"bad_body"}
case 14: lint writing projects/manuscripts/dongho-ecg-clustering/admin/submission/response-letter.md -> 400 {"ok":false,"error":"bad_body"}
case 15: lint writing funding/2026-nwo-enw-xs/assessment/mail.md -> 400 {"ok":false,"error":"bad_body"}
case 16: lint writing tools/oculus/.scratch/migration/agents/reviews/D14-refuter.md -> 400 {"ok":false,"error":"bad_body"}
case 17: lint writing tools/cockpit/data/config/glyphs.yml -> 400 {"ok":false,"error":"bad_body"}
case 18: lint writing tools/cockpit/data/config/text.yml -> 400 {"ok":false,"error":"bad_body"}
case 19: lint writing tools/cockpit/assets/css/07-collections.css -> 400 {"ok":false,"error":"bad_body"}
case 20: lint writing projects/manuscripts/dries-bttr-ecg/code/bttrlib/bttr.py -> 400 {"ok":false,"error":"bad_body"}
case 21: lint writing c21.ts -> 400 {"ok":false,"error":"bad_body"}
case 22: lint writing c22.py -> 400 {"ok":false,"error":"bad_body"}
case 23: lint writing c23.sh -> 400 {"ok":false,"error":"bad_body"}
case 24: lint writing c24.svelte -> 400 {"ok":false,"error":"bad_body"}
case 25: lint writing c25.ts -> 400 {"ok":false,"error":"bad_body"}
case 26: lint writing c26.md -> 400 {"ok":false,"error":"bad_body"}
case 27: lint writing c27.yml -> 400 {"ok":false,"error":"bad_body"}
case 28: lint writing c28.md -> 400 {"ok":false,"error":"bad_body"}
case 29: lint writing c29.md -> 400 {"ok":false,"error":"bad_body"}
case 30: lint writing c30.md -> 400 {"ok":false,"error":"bad_body"}
case 31: lint writing c31.md -> 400 {"ok":false,"error":"bad_body"}
case 32: lint writing c32.md -> 400 {"ok":false,"error":"bad_body"}
case 33: lint writing c33.md -> 400 {"ok":false,"error":"bad_body"}
case 34: lint writing c34.md -> 400 {"ok":false,"error":"bad_body"}
case 35: lint writing c35.md -> 400 {"ok":false,"error":"bad_body"}
case 37: lint writing c37.md -> 400 {"ok":false,"error":"bad_body"}
case 38: lint writing c38.json -> 400 {"ok":false,"error":"bad_body"}
case 40: lint writing c40.md -> 400 {"ok":false,"error":"bad_body"}
case 43: lint writing c43.tsx -> 400 {"ok":false,"error":"bad_body"}
case 46: lint writing c46.md -> 400 {"ok":false,"error":"bad_body"}
case 47: lint writing c47.md -> 400 {"ok":false,"error":"bad_body"}
case 48: lint writing c48.yml -> 400 {"ok":false,"error":"bad_body"}
case 49: lint writing c49.md -> 400 {"ok":false,"error":"bad_body"}
case 36: lint writing with lint.writing off: the route has no such setting; linter writing -> 400 {"ok":false,"error":"bad_body"}
case 39: tab with unsaved text, Fix All: no writing fixer to register; see grep below
case 41/42: reader absent: src/lib/server/machine/runs/lint/writing: ENOENT
case 44/45: worker absent (same folder);
case 50: folder plan -> 400 {"ok":false,"error":"bad_body"}
case 51: folder plan -> 400 {"ok":false,"error":"bad_body"}
case 52: folder plan -> 400 {"ok":false,"error":"bad_body"}
case 54: writing-fix two files -> 400 {"error":"not-an-action"}
case 55: writing-fix refusals -> 400 {"error":"not-an-action"}
```

On the unchanged tree every route case answers 400 `bad_body` (`z.enum(LINT_IDS)` does not hold `writing` and the body shape has no `folder` action), cases 54 and 55 answer 400 `not-an-action` (the op `writing-fix` is unknown), case 38 answers `bad_body` where the finished tree answers `not_taken`, and the page halves (cases 13, 15, 21, 30, 36, 39, 53 and the dialog) find no such action, menu item, fixer or dialog: `grep -rn "lint-writing\|writing-fix\|lint.writing" src config tests` printed no line and `lintersOf('a.md')` was `[]`.

The cases the brief's rules got wrong were case 20 (the raw docstring scope, two characters on the line) and case 12 (three arrows on the line). Both are ruled in "The ruling of round 0" above and both rows are in the output below.

## Cases on the finished tree

Cases 1 to 20 (the hub's own files, as the default settings read them), 21 to 35, 37, 38, 43, 46 to 49 (fixtures) and 36 (the reader on a skipped path) are run by `node probe/cases.mjs` (`/private/tmp/claude-502/d40-builder/final/cases.mjs`), which calls `runWriting` of `writing/writing.ts` with the real settings defaults from `config/behavior.yml` and the real catalog, and prints each row (line:column to line:column, code, `href`), each fix or suggestion with its edits, and what Fix All (the first `kind: 'fix'` of every row) does to the text. "Fix All changes N lines" counts lines that differ by index, so a join that moves later lines shows a large N. The route half of the same cases is G71's test and `writing-fix.test.ts`.

```
case 1 tools/oculus/.scratch/migration/agents/guarded.md: off
case 1 with writing_skip [] tools/oculus/.scratch/migration/agents/guarded.md: 1 row(s) in lines 7-9 (58 in the file)
  7:3-9:2997 warning wrapped-paragraph href=none | A paragraph broken over 3 lines; write it as one line
    fix "Join the lines into one" -> [7:95-8:3] " " [8:318-9:3] " "
  Fix All changes 196 line(s); first changed line after: "- G1. A route that writes, runs or opens something refuses a request without the page's token. Code: `src/routes/api/` write, ops, open, git, deposit, terminal, commands, hpc, mail, calendar, literatu...(3405 chars)"
case 2 funding/2026-fwo-senior-transplant/proposal/long-proposal/reviews/round6/R2-domain-pathology.md: 1 row(s) in lines 5-8 (58 in the file)
  5:1-8:86 warning wrapped-paragraph href=none | A paragraph broken over 4 lines; write it as one line
    fix "Join the lines into one" -> [5:99-6:1] " " [6:108-7:1] " " [7:100-8:1] " "
  Fix All changes 394 line(s); first changed line after: "**Persona.** Consultant renal and transplant pathologist, professor grade, large European academic transplant centre. Twenty-plus years signing out allograft biopsies. Active member of a Banff working...(392 chars)"
case 4 tools/oculus/.scratch/migration/agents/reviews/U2-audit.md: 1 row(s) in lines 13-28 (56 in the file)
  13:1-28:198 warning wrapped-paragraph href=none | A paragraph broken over 16 lines; write it as one line
    fix "Join the lines into one" -> [13:328-14:1] " " [14:692-15:1] " " [15:180-16:1] " " [16:134-17:1] " " [17:207-18:1] " " [18:212-19:1] " " [19:83-20:1] " " [20:169-21:1] " " [21:138-22:1] " " [22:234-23:1] " " [23:172-24:1] " " [24:143-25:1] " " [25:19-26:1] " " [26:144-27:1] " " [27:239-28:1] " "
  Fix All changes 1127 line(s); first changed line after: "State: narrow 309 px and wide 1454 px, shots `focus-narrow.png`, `focus-wide.png`; the view held its populated lanes (papers, funding, other sections). Both shots are cropped to the header and the top...(3291 chars)"
case 5 projects/manuscripts/bttd-source-eeg/admin/SUBMISSION_CHECKLIST.md: 1 row(s) in lines 11-13 (10 in the file)
  11:7-13:29 warning wrapped-paragraph href=none | A paragraph broken over 3 lines; write it as one line
    fix "Join the lines into one" -> [11:77-12:7] " " [12:93-13:7] " "
  Fix All changes 78 line(s); first changed line after: "- [ ] **Confirm the affiliation.** `main.tex` carries a placeholder footnote ("Affiliation to be confirmed"). Set the correct department/institution and remove the `\fntext` placeholder."
case 6 projects/coauthor/active/clinical-hccnet/admin/coauthor-request.md: 1 row(s) in lines 7-14 (1 in the file)
  7:3-14:35 warning wrapped-paragraph href=none | A paragraph broken over 8 lines; write it as one line
    fix "Join the lines into one" -> [7:13-8:3] " " [8:73-9:3] " " [9:102-10:3] " " [10:93-11:3] " " [11:44-12:3] " " [12:49-13:3] " " [13:53-14:3] " "
  Fix All changes 20 line(s); first changed line after: "> Resultaten Paragraaf 1) Cohort, surveillance and HCC characteristics (info there) Paragraaf 2) MRI models: predicting HCC per MRI sequence (AUC 1, 2,3,4,5 years before HCC diagnosis Hieruit 1 of 2 b...(447 chars)"
case 7 tools/oculus/.scratch/migration/agents/reviews/A3-report.md: 1 row(s) in lines 1388-1392 (89 in the file)
  1388:1-1392:8 warning wrapped-paragraph href=none | A paragraph broken over 5 lines; write it as one line
    fix "Join the lines into one" -> [1388:6-1389:1] " " [1389:8-1390:1] " " [1390:8-1391:1] " " [1391:8-1392:1] " "
  Fix All changes 1878 line(s); first changed line after: "25c25 191c191 269c269 284c284 294c294"
case 8 deck/title.md: 0 row(s)
  Fix All changes nothing
case 9 docs/HPC-UTwente-howto.md: 0 row(s) in lines 133-133 (0 in the file)
  Fix All changes nothing
case 10 projects/manuscripts/bt-operator-theory/notes/derivations/07-depth-amplification.md: 0 row(s) in lines 17-19 (0 in the file)
  Fix All changes nothing
case 11 tools/oculus/.scratch/migration/agents/reviews/R17.md: 1 row(s) in lines 11-11 (6 in the file)
  11:36-11:37 warning em-dash href=none | An em dash; reword with a comma, colon, semicolon, parentheses or a new sentence
    suggestion "Replace the dash with a comma" -> [11:35-11:38] ", "
    suggestion "Replace the dash with a colon" -> [11:35-11:38] ": "
    suggestion "Replace the dash with a semicolon" -> [11:35-11:38] "; "
  Fix All changes nothing
case 12 tools/oculus/.scratch/migration/agents/reviews/Q73-report.md: 3 row(s) in lines 45-45 (9 in the file)
  45:29-45:30 warning arrow href=none | An arrow character; write ->
    fix "Replace the arrow with ->" -> [45:29-45:30] "->"
    suggestion "Replace the arrow with the word to" -> [45:28-45:31] " to "
  45:59-45:60 warning arrow href=none | An arrow character; write ->
    fix "Replace the arrow with ->" -> [45:59-45:60] "->"
    suggestion "Replace the arrow with the word to" -> [45:58-45:61] " to "
  45:98-45:99 warning arrow href=none | An arrow character; write ->
    fix "Replace the arrow with ->" -> [45:98-45:99] "->"
    suggestion "Replace the arrow with the word to" -> [45:97-45:100] " to "
  Fix All changes 1 line(s); first changed line after: "- Moves: `state/feeds/life` -> `state/life`; `state/words` -> `state/shared/words`; `state/stores` -> `state/shared/stores`. The tests moved the same way: `tests/state/life`, `tests/state/shared/words...(202 chars)"
case 13 funding/2026-nwo-enw-xs/assessment/mail.md: 2 row(s) in lines 7-7 (3 in the file)
  7:362-7:363 warning curly-quote href=none | A curly quote; write a straight quote
    fix "Replace the curly quote with a straight single quote" -> [7:362-7:363] "'"
  7:398-7:399 warning curly-quote href=none | A curly quote; write a straight quote
    fix "Replace the curly quote with a straight single quote" -> [7:398-7:399] "'"
  Fix All changes 1 line(s); first changed line after: "Please return your assessment no later than Tuesday 20 October 2026, 14:00:00 CEST to enw-xs@nwo.nl, using your XS file number in the subject of your email. If an assessor fails to meet the deadline, ...(399 chars)"
case 14 projects/manuscripts/dongho-ecg-clustering/admin/submission/response-letter.md: 1 row(s) in lines 181-181 (2 in the file)
  181:40-181:41 warning en-dash href=none | An en dash in a range; write a hyphen
    fix "Replace the en dash with a hyphen" -> [181:40-181:41] "-"
  Fix All changes 1 line(s); first changed line after: "> "Improve the readability of Figures 2-4 by increasing font sizes and enhancing contrast.""
case 15 funding/2026-nwo-enw-xs/assessment/mail.md: 1 row(s) in lines 3-3 (3 in the file)
  3:60-3:61 warning en-dash href=none | An en dash; reword it, or write a hyphen in a compound word
    suggestion "Replace the dash with a comma" -> [3:59-3:62] ", "
    suggestion "Replace the dash with a colon" -> [3:59-3:62] ": "
    suggestion "Replace the dash with a semicolon" -> [3:59-3:62] "; "
  Fix All changes nothing
case 16 tools/oculus/.scratch/migration/agents/reviews/D14-refuter.md: 0 row(s) in lines 234-234 (1 in the file)
  Fix All changes nothing
case 17 tools/cockpit/data/config/glyphs.yml: off
case 17 with writing_skip [] tools/cockpit/data/config/glyphs.yml: off
case 18 tools/cockpit/data/config/text.yml: 0 row(s) in lines 48-48 (0 in the file)
  Fix All changes nothing
case 19 tools/cockpit/assets/css/07-collections.css: 0 row(s) in lines 124-124 (0 in the file)
  Fix All changes nothing
case 19 with writing_glyphs [] tools/cockpit/assets/css/07-collections.css: 1 row(s) in lines 124-124 (1 in the file)
  124:4-124:5 warning arrow href=none | An arrow character; write a word
  Fix All changes nothing
case 20 projects/manuscripts/dries-bttr-ecg/code/bttrlib/bttr.py: off
case 20 with writing_skip [] projects/manuscripts/dries-bttr-ecg/code/bttrlib/bttr.py: 2 row(s) in lines 95-95 (2 in the file)
  95:35-95:36 warning en-dash href=none | An en dash; reword it, or write a hyphen in a compound word
    suggestion "Replace the dash with a comma" -> [95:34-95:37] ", "
    suggestion "Replace the dash with a colon" -> [95:34-95:37] ": "
    suggestion "Replace the dash with a semicolon" -> [95:34-95:37] "; "
  95:141-95:142 warning en-dash href=none | An en dash; reword it, or write a hyphen in a compound word
    suggestion "Replace the dash with a comma" -> [95:140-95:143] ", "
    suggestion "Replace the dash with a colon" -> [95:140-95:143] ": "
    suggestion "Replace the dash with a semicolon" -> [95:140-95:143] "; "
  Fix All changes nothing
case 3 tools/oculus/.scratch/migration/orchestrator-state.md (entry at line 311): 1 row(s) in lines 311-312 (14 in the file)
  311:3-312:41 warning wrapped-paragraph href=none | A paragraph broken over 2 lines; write it as one line
    fix "Join the lines into one" -> [311:638-312:3] " "
  Fix All changes 37 line(s); first changed line after: "- 2026-10-05 13:21. X3f landed in this commit (third landing): a file tab's actions in its breadcrumb bar, file icons on file tabs, blame on HEAD and index tabs and the double click's kept tab; gate g...(676 chars)"
case 21 c21.ts: 2 row(s)
  1:22-1:23 warning em-dash href=none | An em dash; reword with a comma, colon, semicolon, parentheses or a new sentence
    suggestion "Replace the dash with a comma" -> [1:22-1:23] ", "
    suggestion "Replace the dash with a colon" -> [1:22-1:23] ": "
    suggestion "Replace the dash with a semicolon" -> [1:22-1:23] "; "
  4:5-4:6 warning ellipsis href=none | An ellipsis character; write three periods
    fix "Replace the ellipsis character with three periods" -> [4:5-4:6] "..."
  Fix All changes 1 line(s); first changed line after: "/* e... */"
case 22 c22.py: 2 row(s)
  1:38-1:39 warning em-dash href=none | An em dash; reword with a comma, colon, semicolon, parentheses or a new sentence
    suggestion "Replace the dash with a comma" -> [1:37-1:40] ", "
    suggestion "Replace the dash with a colon" -> [1:37-1:40] ": "
    suggestion "Replace the dash with a semicolon" -> [1:37-1:40] "; "
  3:12-3:13 warning arrow href=none | An arrow character; write ->
    fix "Replace the arrow with ->" -> [3:12-3:13] "->"
    suggestion "Replace the arrow with the word to" -> [3:11-3:14] " to "
  Fix All changes 1 line(s); first changed line after: "    """Doc -> string.""""
case 23 c23.sh: 1 row(s)
  1:22-1:23 warning em-dash href=none | An em dash; reword with a comma, colon, semicolon, parentheses or a new sentence
    suggestion "Replace the dash with a comma" -> [1:21-1:23] ","
    suggestion "Replace the dash with a colon" -> [1:21-1:23] ":"
    suggestion "Replace the dash with a semicolon" -> [1:21-1:23] ";"
  Fix All changes nothing
case 24 c24.svelte: 4 row(s)
  2:6-2:7 warning em-dash href=none | An em dash; reword with a comma, colon, semicolon, parentheses or a new sentence
    suggestion "Replace the dash with a comma" -> [2:5-2:8] ", "
    suggestion "Replace the dash with a colon" -> [2:5-2:8] ": "
    suggestion "Replace the dash with a semicolon" -> [2:5-2:8] "; "
  4:8-4:9 warning em-dash href=none | An em dash; reword with a comma, colon, semicolon, parentheses or a new sentence
    suggestion "Replace the dash with a comma" -> [4:7-4:10] ", "
    suggestion "Replace the dash with a colon" -> [4:7-4:10] ": "
    suggestion "Replace the dash with a semicolon" -> [4:7-4:10] "; "
  5:9-5:10 warning em-dash href=none | An em dash; reword with a comma, colon, semicolon, parentheses or a new sentence
    suggestion "Replace the dash with a comma" -> [5:8-5:11] ", "
    suggestion "Replace the dash with a colon" -> [5:8-5:11] ": "
    suggestion "Replace the dash with a semicolon" -> [5:8-5:11] "; "
  8:6-8:7 warning em-dash href=none | An em dash; reword with a comma, colon, semicolon, parentheses or a new sentence
    suggestion "Replace the dash with a comma" -> [8:5-8:8] ", "
    suggestion "Replace the dash with a colon" -> [8:5-8:8] ": "
    suggestion "Replace the dash with a semicolon" -> [8:5-8:8] "; "
  Fix All changes nothing
case 25 c25.ts: 0 row(s)
  Fix All changes nothing
case 26 c26.md: 1 row(s)
  1:3-1:4 warning en-dash href=none | An en dash in a range; write a hyphen
    fix "Replace the en dash with a hyphen" -> [1:3-1:4] "-"
  Fix All changes 1 line(s); first changed line after: "[a-b](https://en.wikipedia.org/wiki/Kaplan\u2013Meier_estimator)"
case 27 c27.yml: 2 row(s)
  1:30-1:31 warning ellipsis href=none | An ellipsis character; write three periods
    fix "Replace the ellipsis character with three periods" -> [1:30-1:31] "..."
  2:10-2:11 warning em-dash href=none | An em dash; reword with a comma, colon, semicolon, parentheses or a new sentence
    suggestion "Replace the dash with a comma" -> [2:9-2:12] ", "
    suggestion "Replace the dash with a colon" -> [2:9-2:12] ": "
    suggestion "Replace the dash with a semicolon" -> [2:9-2:12] "; "
  Fix All changes 1 line(s); first changed line after: "url: https://x.org/a\u2013b # see ..."
case 28 c28.md: 1 row(s)
  1:1-2:12 warning wrapped-paragraph href=none | A paragraph broken over 2 lines; write it as one line
    fix "Join the lines into one" -> [1:11-2:1] " "
  Fix All changes 3 line(s); first changed line after: "first line second line\r"
case 29 c29.md: 1 row(s)
  1:1-3:2 warning wrapped-paragraph href=none | A paragraph broken over 3 lines; write it as one line
    fix "Join the lines into one" -> [2:2-3:1] " "
  Fix All changes 3 line(s); first changed line after: "b c"
case 30 c30.md: 2 row(s)
  1:1-2:4 warning wrapped-paragraph href=none | A paragraph broken over 2 lines; write it as one line
    fix "Join the lines into one" -> [1:5-2:1] " "
  1:4-1:5 warning nbsp href=none | A no-break space; write a space
    fix "Replace the no-break space with a space" -> [1:4-1:5] " "
  Fix All changes 3 line(s); first changed line after: "abc  def"
case 31 c31.md: 1 row(s)
  1:5-2:6 warning wrapped-paragraph href=none | A paragraph broken over 2 lines; write it as one line
    fix "Join the lines into one" -> [1:6-2:5] " "
  Fix All changes 3 line(s); first changed line after: "> - a b"
case 32 c32.md: 0 row(s)
  Fix All changes nothing
case 33 c33.md: 0 row(s)
  Fix All changes nothing
case 34 c34.md: 1 row(s)
  1:6-1:7 warning ellipsis href=none | An ellipsis character; write three periods
    fix "Replace the ellipsis character with three periods" -> [1:6-1:7] "..."
  Fix All changes 1 line(s); first changed line after: "\ud83d\ude00 x ..."
case 35 c35.md: 0 row(s)
  Fix All changes nothing
case 38 c38.json: 0 row(s)
  Fix All changes nothing
case 43 c43.tsx: 2 row(s)
  2:22-2:23 warning em-dash href=none | An em dash; reword with a comma, colon, semicolon, parentheses or a new sentence
    suggestion "Replace the dash with a comma" -> [2:21-2:24] ", "
    suggestion "Replace the dash with a colon" -> [2:21-2:24] ": "
    suggestion "Replace the dash with a semicolon" -> [2:21-2:24] "; "
  3:6-3:7 warning em-dash href=none | An em dash; reword with a comma, colon, semicolon, parentheses or a new sentence
    suggestion "Replace the dash with a comma" -> [3:5-3:8] ", "
    suggestion "Replace the dash with a colon" -> [3:5-3:8] ": "
    suggestion "Replace the dash with a semicolon" -> [3:5-3:8] "; "
  Fix All changes nothing
case 46 c46.md: 1 row(s)
  1:5-2:2 warning wrapped-paragraph href=none | A paragraph broken over 2 lines; write it as one line
    suggestion "Join the lines into one" -> [1:6-2:1] " "
  Fix All changes nothing
case 47 c47.md: 1 row(s)
  3:30-3:31 warning em-dash href=none | An em dash; reword with a comma, colon, semicolon, parentheses or a new sentence
    suggestion "Replace the dash with a comma" -> [3:30-3:31] ", "
    suggestion "Replace the dash with a colon" -> [3:30-3:31] ": "
    suggestion "Replace the dash with a semicolon" -> [3:30-3:31] "; "
  Fix All changes nothing
case 35b c35b.md: 0 row(s)
  Fix All changes nothing
case 35c c35c.md: 0 row(s)
  Fix All changes nothing
case 43j c43.jsx: 2 row(s)
  2:22-2:23 warning em-dash href=none | An em dash; reword with a comma, colon, semicolon, parentheses or a new sentence
    suggestion "Replace the dash with a comma" -> [2:21-2:24] ", "
    suggestion "Replace the dash with a colon" -> [2:21-2:24] ": "
    suggestion "Replace the dash with a semicolon" -> [2:21-2:24] "; "
  3:6-3:7 warning em-dash href=none | An em dash; reword with a comma, colon, semicolon, parentheses or a new sentence
    suggestion "Replace the dash with a comma" -> [3:5-3:8] ", "
    suggestion "Replace the dash with a colon" -> [3:5-3:8] ": "
    suggestion "Replace the dash with a semicolon" -> [3:5-3:8] "; "
  Fix All changes nothing
case 48a c48a.yml: 1 row(s)
  1:7-1:8 warning curly-quote href=none | A curly quote; write a straight quote
    fix "Replace the curly quote with a straight single quote" -> [1:7-1:8] "''"
  Fix All changes 1 line(s); first changed line after: "k: 'it''s'"
case 48b c48b.yml: 2 row(s)
  1:9-1:10 warning curly-quote href=none | A curly quote; write a straight quote
    fix "Replace the curly quote with a straight double quote" -> [1:9-1:10] "\""
  1:12-1:13 warning curly-quote href=none | A curly quote; write a straight quote
    fix "Replace the curly quote with a straight double quote" -> [1:12-1:13] "\""
  Fix All changes 1 line(s); first changed line after: "k: "say \"hi\"""
case 48c c48c.yml: 1 row(s)
  2:3-2:4 warning ellipsis href=none | An ellipsis character; write three periods
    fix "Replace the ellipsis character with three periods" -> [2:3-2:4] "..."
  Fix All changes 1 line(s); first changed line after: "  ...continued"
case 49a c49a.md: 1 row(s)
  1:2-1:3 warning em-dash href=none | An em dash; reword with a comma, colon, semicolon, parentheses or a new sentence
    suggestion "Replace the dash with a comma" -> [1:2-1:3] ", "
    suggestion "Replace the dash with a colon" -> [1:2-1:3] ": "
    suggestion "Replace the dash with a semicolon" -> [1:2-1:3] "; "
  Fix All changes nothing
case 49b c49b.md: 1 row(s)
  1:3-1:4 warning em-dash href=none | An em dash; reword with a comma, colon, semicolon, parentheses or a new sentence
    suggestion "Replace the dash with a comma" -> [1:2-1:5] ", "
    suggestion "Replace the dash with a colon" -> [1:2-1:5] ": "
    suggestion "Replace the dash with a semicolon" -> [1:2-1:5] "; "
  Fix All changes nothing
case 49c c49c.md: 1 row(s)
  1:3-1:4 warning em-dash href=none | An em dash; reword with a comma, colon, semicolon, parentheses or a new sentence
    suggestion "Replace the dash with a comma" -> [1:2-1:4] ", "
    suggestion "Replace the dash with a colon" -> [1:2-1:4] ": "
    suggestion "Replace the dash with a semicolon" -> [1:2-1:4] "; "
  Fix All changes nothing
case 37a writing_skip ['']: 1 row(s)
  1:2-1:3 warning em-dash href=none | An em dash; reword with a comma, colon, semicolon, parentheses or a new sentence
    suggestion "Replace the dash with a comma" -> [1:2-1:3] ", "
    suggestion "Replace the dash with a colon" -> [1:2-1:3] ": "
    suggestion "Replace the dash with a semicolon" -> [1:2-1:3] "; "
  Fix All changes nothing
case 37b writing_skip ['docs/**','docs/**'] on docs/x.md: off
case 37c writing_skip ['[unclosed'] on [unclosed: off
case 36 lint.writing off (route answers off before the reader; the reader on a skipped path): off
```

Case 25 (the worker is not asked when the file holds no banned character), `node final/case25.mjs`:

```
case 25 no banned character: {"ok":true,"rows":[]} worker stats {"started":0,"loaded":[]}
same file with a dash: rows 1 worker stats {"started":1,"loaded":["typescript"]}
```

Case 36: the route answers `off` for `lint.writing: false` (the `off` state is the one every linter's switch gives, `routes.ts`); the Files menu item is disabled by `disabled: facts.writing !== true` in `row-menu.ts` and `writingFixOffered` in `acts/writing-fix.ts`. The look is the orchestrator's.

Case 39: the tab's Fix All refuses a tab with unsaved text through `fresh()` in `lint-fixes.ts` (existing, used at lines 342, 377 and 421), and the folder dialog lists a file whose tab holds unsaved text unticked and locked (`rowOf` in `fixing.svelte.ts`; run below under case 53). The editor half is the orchestrator's look.

Case 53 (store half), run as a scratch test file placed under `tests/views/shared/explorer/` for the run and removed after it (`ls tests/views/shared/explorer` lists `opening-apps.test.ts`, `opening.client.test.ts`, `root-drag.test.ts` only). It builds `createFixing` over a fake client whose plan holds `docs/a.md`, `docs/b.md` (a tab holds unsaved text), `docs/c.md` and `docs/d.md` (the plan's reason "Too large"):

```
PHASE ready [["docs/a.md",true,false,""],["docs/b.md",false,true,"A tab holds unsaved text of this file"],["docs/c.md",true,false,""],["docs/d.md",false,true,"Too large"]]
TICKED before 2
TICKED after unticking c and trying to tick locked b and d ["docs/a.md"]
POSTED [["docs/a.md"]]
NOTICES ["Fixed writing problems in 1 file."] view null
REFUSED [["docs/a.md",true,false,""],["docs/b.md",false,true,"The file changed since it was searched."]] reason ""
FOLDER {"root":"hub","path":"docs","label":"docs","phase":"refused","reason":"A folder with 2001 files","rows":[],"writing":false}
```

The button's wording ("Fix N Files", "Fix 1 File") is `files.writing_fix_button` and `_one` in `WritingFixDialog.svelte`; the drawing is the orchestrator's look.

Cases 40, 50, 51, 52, 54 and 55: case 40 is under "Case 40" below; 50, 52, 54 and 55 are rows of `tests/routes/replace/writing-fix.test.ts` (run below); case 51 is under "Case 51".

Cases 41 and 42:

```
$ node probe/case41-final.mjs   (the worktree, with this report in place)
{"found":2037,"checked":2028,"skipped":9,"marks":297,"markFiles":18,"wrapped":1074,"wrapFiles":208,"unplaced":0,"failed":0}
MARKS 1 funding/2026-fwo-senior-transplant/proposal/long-proposal/reviews/round6/R3-perspective-clinical-epidemiology.md
MARKS 3 funding/2026-fwo-senior-transplant/proposal/long-proposal/reviews/round7/EIC-panel-chair.md
MARKS 3 funding/2026-fwo-senior-transplant/proposal/long-proposal/reviews/round7/R3-perspective-clinical-epidemiology.md
MARKS 3 funding/2026-nwo-enw-xs/assessment/mail.md
MARKS 1 projects/manuscripts/dongho-ecg-clustering/admin/reviews/reviewer-comments.md
MARKS 1 projects/manuscripts/dongho-ecg-clustering/admin/submission/response-letter.md
MARKS 1 tools/oculus/.scratch/migration/agents/reviews/D35-brief-check.md
MARKS 5 tools/oculus/.scratch/migration/agents/reviews/PR4-premise-survey.md
MARKS 1 tools/oculus/.scratch/migration/agents/reviews/Q123-refuter.md
MARKS 33 tools/oculus/.scratch/migration/agents/reviews/Q33-report.md
MARKS 19 tools/oculus/.scratch/migration/agents/reviews/Q65-report.md
MARKS 9 tools/oculus/.scratch/migration/agents/reviews/Q73-report.md
MARKS 6 tools/oculus/.scratch/migration/agents/reviews/R17.md
MARKS 1 tools/oculus/.scratch/migration/agents/reviews/T1e-refuter.md
MARKS 2 tools/oculus/.scratch/migration/agents/reviews/X3c-refuter.md
MARKS 94 tools/oculus/.scratch/migration/agents/reviews/X3d-shots/first-run-table.md
MARKS 44 tools/oculus/.scratch/migration/agents/reviews/X3d-shots/mutations.md
MARKS 70 tools/oculus/.scratch/migration/agents/reviews/X3e-premise-recheck.md
wrapped paragraphs in the 3 largest files: [["tools/oculus/.scratch/migration/agents/reviews/A3-report.md",89],["tools/oculus/.scratch/migration/agents/reviews/T1e-report.md",82],["funding/2026-fwo-senior-transplant/proposal/long-proposal/reviews/round6/R2-domain-pathology.md",58]]

$ node probe/case41-tracked.mjs   (the tracked paths of main's index, read from the worktree's files that exist)
{"found":2220,"checked":2035,"skipped":185,"marks":297,"markFiles":18,"wrapped":1079,"wrapFiles":210,"unplaced":0,"failed":0}
```

The numbers equal the brief's: 297 marks in 18 files, 1074 paragraphs in 208 files and 0 unplaced, over the worktree's tracked Markdown and YAML files with this report in place (it adds no mark and no wrapped paragraph). Over main's index, which also holds the D39 report and refuter files, the same probe gives 1079 paragraphs in 210 files, the other numbers unchanged (second command above).

```
orchestrator-history.md call 1 143.1 ms bytes 1200016 rows 1
orchestrator-history.md call 2 121.1 ms bytes 1200016 rows 1
page.py bytes 70970
page.py call 1 209.6 ms rows 995:em-dash timer ticks 18 worst lateness ms 2
page.py call 2 88.1 ms rows 995:em-dash timer ticks 7 worst lateness ms 2
{"started":1,"loaded":["python"]}
```

The timer ticks every 10 ms while the worker tokenises `page.py`; its worst lateness is 2 ms, so the route's event loop stayed free. The worker started once and loaded `python` once.

Cases 44 and 45 (`node probe/case44.mjs`):

```
44a ranges [[{"from":7,"to":10,"docstring":false}],[{"from":13,"to":17,"docstring":false}]]
44a stats {"started":1,"loaded":["python","typescript"]}
44b bad {"ok":false,"failure":{"kind":"grammar","detail":"Language `no-such-language` is not included in this bundle. You may want to load it from external source."}}
44b next true
44c superseded {"ok":false,"failure":{"kind":"stopped"}}
44c already aborted {"ok":false,"failure":{"kind":"stopped"}}
44d after close {"ok":false,"failure":{"kind":"closed"}}
45a cut {"ok":true,"ranges":[],"cut":1}
45b hung {"ok":false,"failure":{"kind":"timeout"}}
45b next {"ok":true,"ranges":[{"from":0,"to":1,"docstring":false}],"cut":0}
45b stats {"started":2,"loaded":[]}
```

44a: two requests for two languages sent together started one worker (`started: 1`) and loaded `python` and `typescript` once each. 44b: a grammar that fails to load answers `failed` with its reason and the next request of another language is answered. 44c: a request whose signal fired answers `stopped`, and the route writes nothing for it (`lint()` returns `{ ok: false, state: 'failed', reason: 'stopped' }`). 44d: a request after `close` answers `closed`. 45a: a line of 3000 characters answers `cut: 1`, no ranges. 45b: a stub worker that never answers (`probe/stub-worker.mjs`, a fake clock) answers `timeout`, and the next request is answered by a second worker (`started: 2`).

Case 51: the plan checks the result of its fixes again, a YAML file by `sameValue` and a Markdown file by `shapeOfText` (`folder.ts:106` and `:110`), and answers no edits with `lint.writing_unparsed` or `lint.writing_blocks`. The reader of `yaml.ts` and `markdown.ts` offers as a fix only a set of fixes it has already shown to hold together by the same two checks (decision 12), so the plan's set equals the verified set and its check cannot fail for a file the reader accepted. A fixture "a `.yml` whose automatic fixes would not parse" therefore cannot exist, and there is no test for it; `writing-fix.test.ts` says so in its head comment. The check stays as the guard of the plan's own invariant.

## DONE / NOT DONE

Every row ran from `tools/oculus` of the worktree with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`. Full-list runs: 2; every figure below is from the second, which ran after the last source change (it ran `checks.sh`, the scoped files, the build and `npm run test:checks` once each).

| Row | State | Proof |
|---|---|---|
| Items 1 to 14 of "What to build" | DONE | the files below; the cases above |
| Verify 1: `npm run diagrams`, then `checks.sh` | DONE | `diagrams exit 0`; `checks: 1 commands passed`, `checks.sh exit 0` |
| Verify 2: the scoped test files, each alone | DONE | the counts below |
| Verify 3: `grep -rln problem-rows tests`; `npm run build` | DONE | grep printed nothing (exit 1); `build exit 0` |
| Verify 4: the ASCII gate | DONE | the perl command printed nothing, `ascii exit 0`; the `grep -n '[^ -~]'` over `DESIGN.md`, `HELP.md` and the three docs pages printed nothing |
| Verify 5: `folder-check`, `wc -l`, `unused-exports` | DONE | `folder-check exit 0`; line counts below; `unused-exports.sh` output equals the base's list (`diff` of the sorted lists printed nothing, 364 lines) |
| Verify 6: YAML parse | DONE | `yaml exit 0` over the four files and `files.yml` |
| Verify 7: the greps | DONE | below; `grep -rn "Exclude<LintId, 'eslint'>" src` printed nothing |
| Verify 8: cases 41 and 42 | DONE | above |
| Verify 9: the history-words grep | DONE | below |
| Verify 10: each case | DONE | above; page halves are the orchestrator's look |
| Verify 11: the documents | DONE | below |
| `npm run test:checks` (all of `tests/checks`) | DONE | `Test Files 17 passed (17)`, `Tests 248 passed (248)`, `exit 0` |
| `npx eslint .`, `npx svelte-check`, `npx prettier --check .` | DONE | `eslint exit 0`; `COMPLETED 440 FILES 0 ERRORS 0 WARNINGS` (inside `checks.sh`); `All matched files use Prettier code style!` |

Outputs of the rows above, as printed:

```
$ npm run diagrams   (last lines)
docs/diagrams/writes.dot
docs/diagrams/writes.svg
diagrams exit 0

$ sh ~/.claude/skills/land/templates/checks.sh .../orchestrator-state.md   (last lines)
ok      prettier (0.3 s): All matched files use Prettier code style!
ok      ASCII gate (0.4 s)
ok      svelte-kit sync (1.7 s)
ok      eslint (5.5 s)
ok      svelte-check (13.9 s): 1791509163153 COMPLETED 440 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (39.0 s): Duration  35.47s (transform 44.31s, setup 0ms, import 82.05s, tests 53.99s, environment 390ms)
test:quick: 39.4 s (limit 45.0 s); every command passed
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
checks: 1 commands passed
checks.sh exit 0
```

```
$ python3 -c "import yaml,sys; [yaml.safe_load(open(f)) for f in sys.argv[1:]]" config/behavior.yml config/catalogs/options.yml config/text/views/sources/source.yml config/text/views/system/history.yml config/text/views/sources/files.yml
exit 0
$ LC_ALL=C grep -n "[^ -~]" DESIGN.md HELP.md docs/views.md docs/configuration.md docs/files-and-search.md
exit 1 (1 means no line)
$ grep -rln problem-rows tests
exit 1 (1 means no line)
$ grep -rn "Exclude<LintId, 'eslint'>" src
exit 1 (1 means no line)
$ sh utils/unused-exports.sh | sort | diff - <(sort ../../../D40-base/tools/oculus/unused-exports.txt)
exit 0 (0 means identical)
$ sh utils/unused-exports.sh | wc -l
     364
```

```
$ npx vitest run <file>   (each alone; Test Files and Tests lines)
=== tests/server/machine/runs/lint/lint-route.test.ts
 Test Files  1 passed (1)
      Tests  10 passed (10)
=== tests/server/machine/runs/lint/eslint-trust.test.ts
 Test Files  1 passed (1)
      Tests  5 passed (5)
=== tests/routes/replace/lsp-edit.test.ts
 Test Files  1 passed (1)
      Tests  8 passed (8)
=== tests/checks/config/config.test.ts
 Test Files  1 passed (1)
      Tests  31 passed (31)
=== tests/checks/config/config-folder.test.ts
 Test Files  1 passed (1)
      Tests  25 passed (25)
=== tests/data/sources/config/settings.test.ts
 Test Files  1 passed (1)
      Tests  73 passed (73)
=== tests/checks/source/keys.test.ts
 Test Files  1 passed (1)
      Tests  8 passed (8)
=== tests/server/machine/runs/lint/writing.test.ts
 Test Files  1 passed (1)
      Tests  12 passed (12)
=== tests/routes/replace/writing-fix.test.ts
 Test Files  1 passed (1)
      Tests  12 passed (12)
```

```
$ npm run build   (last lines)
  ... and 1 more
See https://rolldown.rs/reference/InputOptions.checks#plugintimings for more details.
build exit 0

$ grep -rl "comment-worker\|eslint-child" .svelte-kit/output
(no line)
$ ls .svelte-kit/output/server/chunks | grep -i comments
comments.js
```

The server output holds `chunks/comments.js` (the `languageOf` map of `comments.ts`) and not `comment-worker.mjs`: the worker file is found at run time by `ownFolder()` beside the source, as `eslint-child.mjs` is (it is not in the output either), and the built Node entry `src/server.ts` composes the server context from `src/lib/server/root/context.ts` as source. The worker was started and read by cases 42, 44 and 45 above, which run from the source tree.

```
$ npm run test:checks
 Test Files  17 passed (17)
      Tests  248 passed (248)
   Start at  03:28:18
   Duration  163.48s (transform 11.38s, setup 0ms, import 41.87s, tests 207.64s, environment 4ms)
exit 0

$ LC_ALL=C perl -ne '...' $(find src tests config -type f ! -name local.yml)
ascii exit 0

$ sh utils/folder-check.sh
folder-check exit 0

$ npx eslint .
eslint exit 0
```

The history-words grep (the words of `agents/spec.md:42` and package ids and dates) over the comment lines and test titles this step added or changed, by `diff` against the base, printed 23 lines. Every `before` hit is a position or an order ("the text before any edit", "the blanks before it", "before the thread is ended", "how many were written before it", "Each stamp of `before`" naming the `before` field), none compares with an earlier state of the code. The `G1`, `G2`, `G3`, `G9` and `G71` hits are guarded ids in test titles, which the guarded-entry convention requires. No hit is `used to`, `no longer`, `still`, `previously`, `the step adds` or `after this package lands`.

The greps of verify item 7: `grep -rn "lint-writing\|'writing'\|writing-fix" src` lists the operation named in `file-undo.ts`, `history.ts` (three places), `ops.ts` (shape, dispatch and the `isPrivate` condition), `lsp-edit.ts`, `ops.svelte.ts`, `timeline.ts`, `timeline-reads.ts`, `acts/undo.ts`, `file-ops.ts` (union member, field list), `row-menu.ts` (`ROW_WRITING_FIX`), `fixing.svelte.ts`, `History.svelte`, `rows.ts`, `Timeline.svelte`, and the linter id in `model-machine.ts:634` (`LINT_IDS`), `settings.ts:553` (`Exclude<LintId, 'eslint' | 'writing'>`, the linters that name a program), `problem-sources.ts:35` (`LINT_SOURCES`), `routes.ts:416` (the branch), `lint-fixes.ts:237` (`disableLine` returns null for the writing rules). Each hit is a place the id or operation has to be named; none is a second definition. `lint-writing` as an owner id appears only in `DESIGN.md:476`; the code builds it as `lint-${linter}` (`problem-sources.ts:26`), so it collides with no other source.

## Files changed (line counts after the change)

A is a new file and M a changed one. `docs/diagrams/channels`, `layers`, `layer-server`, `layer-state` and `layer-views` (`.dot` and `.svg`) are regenerated by `npm run diagrams`.

- A `src/lib/data/helpers/search/glob.ts` 19
- A `src/lib/server/machine/runs/lint/writing/characters.ts` 330
- A `src/lib/server/machine/runs/lint/writing/comment-worker.mjs` 113
- A `src/lib/server/machine/runs/lint/writing/comments.ts` 209
- A `src/lib/server/machine/runs/lint/writing/folder.ts` 209
- A `src/lib/server/machine/runs/lint/writing/markdown-blocks.ts` 108
- A `src/lib/server/machine/runs/lint/writing/markdown.ts` 457
- A `src/lib/server/machine/runs/lint/writing/rows.ts` 116
- A `src/lib/server/machine/runs/lint/writing/writing.ts` 124
- A `src/lib/server/machine/runs/lint/writing/yaml.ts` 141
- A `src/lib/state/sources/explorer/acts/writing-fix.ts` 14
- A `src/lib/state/sources/search/glob.ts` 5
- A `src/lib/views/shared/explorer/tree/control/fixing.svelte.ts` 180
- A `src/lib/views/shared/explorer/WritingFixDialog.svelte` 151
- A `tests/routes/replace/writing-fix.test.ts` 295
- A `tests/server/machine/runs/lint/writing.test.ts` 236
- M `config/behavior.yml` 314
- M `config/catalogs/options.yml` 1454
- M `config/text/views/sources/files.yml` 289
- M `config/text/views/sources/source.yml` 199
- M `config/text/views/system/history.yml` 84
- M `docs/configuration.md` 69
- M `docs/files-and-search.md` 138
- M `docs/views.md` 279
- M `src/lib/data/file-ops.ts` 365
- M `src/lib/data/model/index.ts` 656
- M `src/lib/data/model/model-machine.ts` 786
- M `src/lib/data/sources/config/settings.ts` 858
- M `src/lib/server/core/paths.ts` 58
- M `src/lib/server/core/program.ts` 127
- M `src/lib/server/edit/writes/file-undo.ts` 294
- M `src/lib/server/files/fs/history.ts` 372
- M `src/lib/server/files/fs/lsp-edit.ts` 159
- M `src/lib/server/files/fs/ops.ts` 858
- M `src/lib/server/machine/lsp/adapters/yaml/machine-file.ts` 39
- M `src/lib/server/machine/lsp/library/rules.ts` 81
- M `src/lib/server/machine/runs/lint/linters.ts` 128
- M `src/lib/server/machine/runs/lint/routes.ts` 436
- M `src/lib/server/root/context.ts` 843
- M `src/lib/server/root/process/server-context.ts` 156
- M `src/lib/state/sources/explorer/acts/undo.ts` 99
- M `src/lib/state/sources/explorer/ops.svelte.ts` 680
- M `src/lib/state/sources/explorer/sections/timeline-reads.ts` 73
- M `src/lib/state/sources/explorer/sections/timeline.ts` 74
- M `src/lib/state/system/machine/lint/lint-answer.ts` 76
- M `src/lib/state/system/machine/lint/lint-model.ts` 15
- M `src/lib/state/system/machine/lint/lint-words.ts` 16
- M `src/lib/state/system/machine/lint/lint.svelte.ts` 337
- M `src/lib/state/system/problem-sources.ts` 163
- M `src/lib/ui/forms/Checkbox.svelte` 96
- M `src/lib/views/shared/explorer/tree/control/picks.svelte.ts` 254
- M `src/lib/views/shared/explorer/tree/menu/row-menu.ts` 594
- M `src/lib/views/shared/explorer/tree/Tree.svelte` 442
- M `src/lib/views/sources/files/sections/Timeline.svelte` 406
- M `src/lib/views/sources/search/problem-rows.ts` 190
- M `src/lib/views/sources/source/language/lint-fixes.ts` 430
- M `src/lib/views/system/history/History.svelte` 396
- M `src/lib/views/system/history/rows.ts` 108
- M `src/routes/api/(machine)/lint/+server.ts` 35
- M `tests/checks/config/config.test.ts` 668
- M `tests/checks/source/keys.test.ts` 576
- M `tests/data/sources/config/settings.test.ts` 754
- M `tests/data/sources/config/wrong-settings.ts` 84
- M `tests/routes/replace/replace-fixture.ts` 181
- M `tests/server/machine/runs/lint/lint-fixture.ts` 278
- M `tests/server/root/context-fixture.ts` 188
- M `DESIGN.md` 579
- M `HELP.md` 188

The largest source files are `src/lib/server/files/fs/ops.ts` and `src/lib/data/sources/config/settings.ts` at 858 lines (limit 880); the largest component is `src/lib/views/shared/explorer/tree/Tree.svelte` at 442 (limit 520). The size check is part of `tests/checks` (passed above).

Paths written that the brief's path list does not name, each with why:

- `src/lib/server/core/paths.ts`: `under` lives here so `server/files` can use it (server folder order), identical to main's; `src/lib/server/machine/lsp/library/rules.ts` and `src/lib/server/machine/lsp/adapters/yaml/machine-file.ts` import it from there, identical to main's.
- The History kind `writing-fix`, which the write needs so that its copies are listed and undone: `src/lib/server/files/fs/history.ts`, `src/lib/server/edit/writes/file-undo.ts`, `src/lib/state/sources/explorer/acts/undo.ts`, `src/lib/state/sources/explorer/sections/timeline.ts`, `timeline-reads.ts`, `src/lib/views/sources/files/sections/Timeline.svelte`, `src/lib/views/system/history/rows.ts`, `History.svelte`, and the catalogs `config/text/views/sources/files.yml` and `config/text/views/system/history.yml`.
- `src/lib/server/root/process/server-context.ts` (the brief names `src/lib/server/root/server-context.ts`, which is not at that path).
- `src/lib/state/system/machine/lint/lint-answer.ts` (the answer shape of the `folder` action), `lint-model.ts` (re-export of `LintFolderFile`), `src/lib/state/sources/explorer/acts/writing-fix.ts` (`writingFixOffered`), `src/lib/state/sources/search/glob.ts` (re-export of `globTest`, since `views/` may import `state/` and not `data/helpers`), `src/lib/ui/forms/Checkbox.svelte` (a `disabled` prop for a locked file's box), `src/lib/views/shared/explorer/tree/control/fixing.svelte.ts` and `src/lib/views/shared/explorer/WritingFixDialog.svelte` (the dialog).
- Tests: `tests/data/sources/config/wrong-settings.ts` (the wrong values of the three keys), `tests/routes/replace/replace-fixture.ts` (`writingFixPost`), `tests/server/root/context-fixture.ts` (the new `comments` member of the context).

## Tests

Two new files, each with its failing run on the unchanged scratch copy (`/private/tmp/claude-502/d40-builder/unchanged/`, the base plus the two new test files and their fixture, run with `npx vitest run <file>`):

- `tests/server/machine/runs/lint/writing.test.ts`, 12 tests, G71 (cases 21, 22, 22b, 23, 24, 43, 26, 27, 33, 46, 47, and 13 with 48). On the unchanged copy `Tests 12 failed (12)`; the first failing line is `AssertionError: expected { status: 400, ok: false } to deeply equal { status: 200, ok: true }` at `tests/server/machine/runs/lint/writing.test.ts:112:22`, and the `afterEach` adds `TypeError: Cannot read properties of undefined (reading 'close')` at `:37:52`. On the finished tree `Tests 12 passed (12)`.
- `tests/routes/replace/writing-fix.test.ts`, 12 tests, G1, G2, G3 and G9 (cases 50, 52, 54, 55). On the unchanged copy `Tests 12 failed (12)`; the first failing line is `AssertionError: expected 400 to be 200 // Object.is equality` at `tests/routes/replace/writing-fix.test.ts:82:31` (the plan answers 400 `bad_body`), and the write rows fail on `not-an-action`. On the finished tree `Tests 12 passed (12)`.

Existing assertions changed, with before and after (the only ones; the other test edits add lines):

- `tests/data/sources/config/settings.test.ts`: the expected settings gain the three keys: `on: { chktex: false, ruff: false, eslint: false, shellcheck: false }` becomes `on: { ..., shellcheck: false, writing: false }`, `chktexArgs: ['-q']` gains `writingSkip: ['skip/**'], writingGlyphs: ['icons/**']`, and the second case's `on` and lists gain `writing: true`, `writingSkip: ['a/**', 'b/*.md']` and `writingGlyphs: ['c/**']` (the input `writing_skip: [' a/** ', '', 'b/*.md']` tests the trim and the dropped empty entry); the wrong-value table gains `['writing', 'maybe', 'boolean']`, `['writing_skip', 'no', 'strings']` and `['writing_glyphs', 'no', 'strings']`.
- `tests/checks/source/keys.test.ts`: `LINT_IDS.filter((id) => id !== 'eslint')` becomes `LINT_IDS.filter((id) => id !== 'eslint' && id !== 'writing')`, since the writing rules run no program and have no `lint_tip_not_found_writing` key.
- `tests/checks/config/config.test.ts`: the list of `lint` keys gains `lint.writing`, `lint.writing_glyphs`, `lint.writing_skip`.

Fixtures: `lint-fixture.ts` (`settingsOf` has `writing: true`, `writingSkip: []`, `writingGlyphs: []`; `route()` makes and returns a `HeldComments`, the catalog and `isProtected`), `context-fixture.ts`, `replace-fixture.ts`, `wrong-settings.ts`.

What the new tests do not cover: the squiggles, the lightbulb, the dialog drawing and the menu item (the look); the plan's own reparse check, which no accepted file can reach (case 51); the files under `~/.oculus`, which the plan and the write withhold in the same code as the hub's `secrets` folder (the test uses `secrets`).

## Doc text for agents/guarded.md

G71, to add after G70 (line 40 of the worktree's file), in the file's form:

```
- G71. A writing-rule mark and its fix fall only in a Markdown or YAML file's text outside front matter, code, code spans and URLs, or in a code file's comment or Python docstring, so Fix All never changes code.
  Code: `src/lib/server/machine/runs/lint/writing/` (`characters.ts`, `markdown.ts`, `markdown-blocks.ts`, `yaml.ts`, `comments.ts`, `comment-worker.mjs`, `writing.ts`, `rows.ts`, `folder.ts`); the lint route `src/lib/server/machine/runs/lint/routes.ts`.
  Test: `tests/server/machine/runs/lint/writing.test.ts`: 'marks the comments of a TypeScript file and none of its strings, templates or expressions (case 21)'; 'marks a Python comment and a docstring, and not a string or a string assigned to a name (case 22)'; 'marks the arrow of a raw docstring (case 22b)'; 'marks the comment of a shell file and not the string or the parameter expansion (case 23)'; 'marks the four comment forms of a Svelte file and not its text node (case 24)'; 'marks the comments of a TSX and a JSX file and not the text of an element (case 43)'; 'marks the text of a link and not its address, an autolink or a bare address (case 26)'; 'marks a YAML comment and a quoted value and not an address (case 27)'; 'marks nothing in a tilde fence or an indented code block (case 33)'; 'offers the join of a paragraph that would merge two lists as a suggestion, never a fix (case 46)'; 'marks the text of an HTML element and not an address, a reference definition or its title (case 47)'; 'marks the curly quotes of a Markdown file and a YAML fix keeps the value (case 13, 48)'.
```

G3, the title widened (the line `grep -n '^- G3\.' agents/guarded.md` prints now ends at "...is given to the YAML language server."):

```
- G3. The content of `config/local.yml` is never served, read into a page or written, and no file under the hub's `secrets` folder or `~/.oculus` is given to the YAML language server or written by the writing rules.
```

G1, G2, G3 and G9: the titles stand. Append to each Code line `; the folder Fix All: `src/lib/server/machine/runs/lint/writing/folder.ts` (the plan), `src/lib/server/files/fs/lsp-edit.ts` (the `writing-fix` write)`, and to each Test line the rows of `tests/routes/replace/writing-fix.test.ts`:

- G1: 'refuses a request without the write token (G1)' (the plan); 'refuses a request without the token and writes nothing, then writes under the token (G1)' (the write).
- G2: 'refuses a path that climbs out of the root, a root not served, a file, and a link out of the root (G2)' (the plan); 'refuses a path out of the root, a link out of it and a root not served, naming the file (G2)' (the write).
- G3: "never lists the machine's local.yml, which the plan never reads"; "refuses `protected` for the machine's local.yml and writes nothing to it (G3)"; "refuses `outside` for a file under the hub's secrets folder and writes nothing (G3)".
- G9: 'writes the edits of the plan, keeps a copy of each file as writing-fix and records one files record (G9)'; 'writes only the files the request names, and undoing the record puts both files back (G9)'.

G12, G13 and G24: the titles stand; the rows `tests/checks/config/config.test.ts`, `tests/data/sources/config/settings.test.ts` and `tests/checks/source/keys.test.ts` run the new keys (counts above). G7 and G70 are unchanged: `lint-route.test.ts` (10 tests) and `eslint-trust.test.ts` (5 tests) pass.

## Case 40: the ids and keys

```
LINT_IDS:
634:export const LINT_IDS = ['chktex', 'ruff', 'eslint', 'shellcheck', 'writing'] as const;
writing in LINT_IDS count:
["chktex","ruff","eslint","shellcheck","writing"] 1 true
lint.writing: behavior.yml:
lint.writing_skip: behavior.yml:
lint.writing_glyphs: behavior.yml:
behavior.yml lint keys: ['writing', 'writing_skip', 'writing_glyphs']
options.yml lint.writing 1
options.yml lint.writing_skip 1
options.yml lint.writing_glyphs 1
config.test.ts lint.writing 1
config.test.ts lint.writing_skip 1
config.test.ts lint.writing_glyphs 1
source.yml lint keys with writing: 32 True
files.yml writing keys 18 18
history.yml ['text.history.file_writing_fix', 'text.history.file_writing_fix_one']
ops.ts writing-fix literal:
238:    z.object({ op: z.literal('writing-fix'), files: editFiles })
FILE_FIELDS:
183:    | { op: 'writing-fix'; files: LspEditFile[] };
347:    'writing-fix'

$ python3 (a safe_load that raises on a duplicate key) over the five files
no duplicate key: config/behavior.yml
no duplicate key: config/catalogs/options.yml
no duplicate key: config/text/views/sources/source.yml
no duplicate key: config/text/views/sources/files.yml
no duplicate key: config/text/views/system/history.yml
```

The keys `lint.name_writing` and every new `lint.*` key of `source.yml` (32 with `writing` in the name), the 18 `files.yml` keys (`menu_writing_fix`, `timeline_writing_fixed`, `writing_fix_*`) and the two `history.yml` keys are each reached by a literal `t()` or `words()` call: `tests/checks/source/keys.test.ts` passes (8 tests). Duplicates and collisions: a loader that raises on a duplicate key read each of the five files without raising (above); the three setting keys are each once in `behavior.yml`, `options.yml` and `config.test.ts`; `writing` is once in `LINT_IDS`; the op `writing-fix` is once in the body shape of `ops.ts` (line 238) and once in `FILE_FIELDS` (`file-ops.ts:347`).

## Judgment calls the brief left open

- A Markdown fix is a fix only when the re-lex of its top-level block gives the same shape of blocks (`shapeOfText`, `markdown-blocks.ts`); when a block's fixes do not hold together, `holding` (`characters.ts:320`) keeps the largest halves that hold, found by bisection, and the rest become suggestions. This is decision 12 applied to every Markdown fix, and it is why case 46's join is a suggestion.
- A YAML fix is kept only when the file parses to the same value after it (`sameValue`, `yaml.ts:61`); the same bisection runs over the file's fixes, and at most `PARSES = 128` parses are made per file, after which the remaining fixes are suggestions. A plain scalar continued on a line that starts with an ellipsis, and an ellipsis at the start of a line outside quotes, get no fix (case 48).
- A curly quote inside an HTML tag in Markdown has no fix, since a straight quote would end the attribute (`markdown.ts:22`); in a Python docstring a curly quote whose straight form is the docstring's own delimiter has no fix (`writing.ts:68`).
- Code is read by a worker thread that is sent the text only up to the end of the line holding the last banned character (`lastBanned`, `writing.ts:59`), so a file with no banned character never asks the worker (case 25) and a large file costs the tokenising of its head. A line over 2000 characters ends the reading there and reports `cut` (case 45); the reason shown is the catalog line `lint.writing_reason_*`.
- `lint.writing_skip` defaults to the brief's lists: `.agents/**`, `.claude/**`, `**/vendor/**`, `**/third_party/**` (decision 14), `**/bttrlib/**`, `**/notes/thesis/**`, `**/manuscript/**/*.tex`, `**/manuscript/**/*.bib`, `**/*_AUTO.md`, `**/STATUS.md`, `feeds/literature-radar.yml`, `feeds/position-leads.yml`, `tools/oculus/.scratch/migration/plan.md` and `tools/oculus/.scratch/migration/agents/guarded.md`; `lint.writing_glyphs` defaults to the `tools/cockpit` data, templates and assets, `registries/*.yml` and the other listed files (`config/behavior.yml:198-229`).
- The folder Fix All dialog is `WritingFixDialog.svelte` built on the `Modal`, `Checkbox` and `ToolButton` primitives of `ui/`. `Checkbox` gained a `disabled` prop (a locked file's box); nothing else of `ui/` changed.
- A write refused as `changed` is told in the dialog as "The file changed after the writing rules read it." (`files.writing_fix_changed`), because the shared sentence `files.refused_changed` says "since it was searched".
- The page reaches `globTest` and `LintFolderFile` through `state/` re-exports (`state/sources/search/glob.ts`, `state/system/machine/lint/lint-model.ts`) because the boundary test allows `views/` to import `ui/`, `state/` and a few named `data/` modules only.
- `Scope.isPrivate` in `ops.ts` and `LspEditScope.isPrivate` carry the private-folder refusal for `writing-fix` only; the refusal is superseded by D39's `withheld` at landing ("Landing after D39").

## Visible changes, before and after

- Linters: four (ChkTeX, Ruff, ESLint, ShellCheck) become five; the writing rules add a status-bar item named "Writing rules", rows with source `writing` and a code (`em-dash`, `en-dash`, `curly-quote`, `ellipsis`, `arrow`, `nbsp`, `wrapped-paragraph`) in the Problems view and warning squiggles in the editor, no documentation link and no Disable action.
- Editor: Quick Fix offers the fix first and the suggestions after for a writing mark; the palette has 'Writing rules: Fix All Auto-fixable Problems'.
- Settings: three keys in the Linting section: `lint.writing` (on), `lint.writing_skip` and `lint.writing_glyphs`.
- Files view: the row menu of a folder or a root gains 'Fix All Writing Problems in Folder...' after 'Find in Folder...', greyed while `lint.writing` is off; it opens a dialog that lists the files with a box each, a count of fixes, the total and the button 'Fix N Files'.
- History and Timeline: a new record 'Fixed by the writing rules in N files' (one file: 'in 1 file') and the Timeline row 'File Fixed by the Writing Rules'; its undo puts the files back.
- API: `POST /api/lint` accepts `linter: 'writing'` and the action `folder`; `POST /api/ops` accepts the op `writing-fix`; the server holds one worker thread for the comments of code files, started at the first code file with a banned character and ended with the server context.
- Shared `Checkbox`: a `disabled` prop; no existing caller passes it.

## Anything in the brief that was wrong or impossible

- Case 20 and case 12 (ruled in round 0, above).
- Case 51 cannot be built as a fixture (above).
- Case 41 holds as the brief states it (above).
- Verify item 3 expects the worker's file in the server output. It is not there, and `eslint-child.mjs` is not either; both are found beside the source at run time ("Outputs" above).
- The path list names `src/lib/server/root/server-context.ts`; the file is at `src/lib/server/root/process/server-context.ts`.
- `agents/spec.md:42` asks for a history-words grep of the comments and test titles; the grep is over the lines this step added or changed by `diff` against the base, and the whole-file `before` hits are positional.

## Documents read against the change

Each new or changed sentence was read against the rules on list items and sentence length (`diff` of each file against the base, then read).

- `DESIGN.md:23` (the linters list): rewritten, adds "the hub's writing rules".
- `DESIGN.md:166` (Processes): rewritten, the new sentences on the writing rules, the worker thread, the folder Fix All and the `outside` refusal; the paragraph is one line as the file's others are, and the new sentences are under 60 words each.
- `DESIGN.md:476` (Problems): rewritten, `lint-writing` in the owner list.
- `HELP.md:118`: rewritten, the linters list names the writing rules.
- `docs/views.md:81`: rewritten, the writing rules' rows (source `writing`, a warning each, no documentation link).
- `docs/configuration.md:13`: rewritten, the three keys.
- `docs/files-and-search.md`: the Files menu sentence (~line 43) rewritten for the new item; the Linters section gains three paragraphs (the rules, the Fix All and the folder dialog), the status-item sentence, the fixes sentence and the settings sentence are rewritten; the other paragraphs are still true. The longest new sentence is the file-extension list of the first paragraph, which is a list.
- Head comments read and kept true: `routes.ts`, `linters.ts`, `program.ts`, `lsp-edit.ts`, `ops.ts`, `file-ops.ts`, `row-menu.ts`, `Tree.svelte`, `picks.svelte.ts`, `lint.svelte.ts`, `lint-words.ts`, `lint-model.ts`, `problem-sources.ts`, `timeline.ts`, `history.ts`, `file-undo.ts`, `server-context.ts`, `context.ts`, `lint-fixes.ts`, `Checkbox.svelte`.
- No DESIGN line enumerates the History record kinds, so none was edited for the new kind.

## Next

The orchestrator reads the diff, lands D39 and then this step with the hand merge written under "Landing after D39", re-runs the verify list on the merged tree, and takes the look at the scratch oculus for the page halves (the squiggles and lightbulb of cases 13, 15, 21 and 30, the greyed item of case 36, the unsaved tab of case 39, and the dialog of case 53).

