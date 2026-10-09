# Step D41 brief check (on main at fde67f62d)

Read-only throughout. Nothing was edited and no git command that changes state was run. The only writes were the scratchpad probes' own renames inside `mdprobe/ws` and `mdhub`, which they put back. Probe commands ran from `mdprobe/` with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH` (node v24.21.0). `plan.md` has no section called Goal; its header line says it is the execution ledger for `tools/oculus/DESIGN.md`, so I read the step line, its Step 0 lines and rulings 21 to 23 as the goal.

## 1. Names

- **`LspServerId` / `SERVED_LANGUAGES`.** `grep -rln "LspServerId\|SERVED_LANGUAGES" src tests` returns `ui/controls/editor/kit/lsp/hosts.ts`, `server/machine/lsp/servers.ts`, `data/prose/lsp-servers.ts`, `views/sources/source/language/lsp.ts` and `tests/checks/source/keys.test.ts`. All are on the write list. `grep -rn "Record<LspServerId" src tests` returns nothing.
- **Docs that list the servers.** `grep -rn texlab docs HELP.md DESIGN.md README.md config --exclude=local.yml` finds three places that enumerate the language servers:
  - `DESIGN.md:23`, outside the write list: "a language server client (pyright ... texlab for LaTeX and BibTeX)". Incomplete once Markdown is served.
  - `DESIGN.md:166`, outside the write list: "A language server (pyright, clangd, ... `yaml-language-server` or `texlab` ...)". Incomplete once Markdown is served.
  - `DESIGN.md:575` and `docs/files-and-search.md:85` are on the list.
- **`DiskState` / `'gone'`.** `grep -rn "'gone'" src tests` (outside `src/lib/server`) finds readers outside the write list, each made wrong or partial by `unserved`:
  - `views/sources/source/status/tab-shown.ts:68`: `disked` is true only for `conflict`, `gone` or `changed`, and it gates whether `DiskNote` is drawn at all (`Source.svelte:159`, `SourceBody.svelte:179`). Unless this file changes, item 7's note is never shown.
  - `views/sources/source/actions/BarActions.svelte:80`: `savable = dirty || draft.disk === 'gone'`. Save stays offered for an unserved tab that holds unsaved text.
  - `state/sessions/source/draft-entry.ts:64`: `unfit` has no sentence for `unserved`.
- **The draft's saved shape.** `state/sessions/source/draft.ts:181` holds `disk: z.enum(['same', 'changed', 'gone']).catch('same')`. The file is on the write list, but the brief does not say that this saved shape changes.
- **`findings.manifests.type_not_tier`.** `grep -rn "type_not_tier" src tests config docs DESIGN.md HELP.md README.md` returns only `manifests.ts:138` and `findings.yml:36`, both listed. Sentences that describe the rule and become false:
  - `docs/DATA-MAP.md:69` (hub doc, not listed): "a written `type` that differs from the rule's is a finding".
  - `src/lib/data/model/model-entities.ts:78-82` (not listed): "A disagreement between either pair is a finding". The new record field for the manifest's own type belongs beside `manifestId?` at `model-entities.ts:107`, which is also not listed.
- **`lifecycle.archive_outcomes`.**
  - `grep -rn "lifecycle\|archive_outcomes" src tests` shows the Audit reads `lifecycle` in `server/content/audit/rules.ts:74-108` (live, terminal, author and contradictory chips) and never `archive_outcomes`. Item 6 needs that reader added to `rules.ts`, which is not on the write list.
  - `config/catalogs/vocab.yml:228` (not listed) says the archive folder is "a convention here, not a rule the engine reads". Item 6 makes that false.
- **Refactor Preview.** Two sentences outside the write list become false once a Files view move opens the preview:
  - `docs/views.md:73` says it opens "when a rename of a hub key is made ... or any rename is accepted with Cmd+Enter". Only the Audit section of `views.md` is listed.
  - `DESIGN.md:576` says the hub-key rename and the Cmd+Enter rename are held as a preview and "every other edit is made at once".
- **The folder-size line.** `git ls-files src/lib/ui/controls/editor | ... | sort -u | wc -l` prints `10`. A new `.css` at the top of `ui/controls/editor/` would be its eleventh item, which `utils/folder-check.sh` refuses. The brief's "a `.css` file under `ui/controls/editor/`" does not say which subfolder.
- **`portfolio watch: cannot watch`.** The message appears in `portfolio.ts` only, at 378, 412, 439 and 468. No doc names it.
- **G2, G3 and G36.** These live in `.scratch/migration/agents/guarded.md`, which the brief puts on the builder's write list. That clashes with `spec.md:35` ("You never edit anything under `tools/oculus/.scratch/`") and with the precedent: `D43.md:266` says "`agents/guarded.md` is the orchestrator's", and D39 and D40 have the builder hand back "Doc text" that the orchestrator writes in at landing.

Findings:
- **F1.** `tab-shown.ts`, `BarActions.svelte` and `draft-entry.ts` are outside the write list. Without `tab-shown.ts`, item 7's note is never drawn.
- **F2.** `audit/rules.ts`, `model-entities.ts`, `config/catalogs/vocab.yml:228` and hub `docs/DATA-MAP.md:69` are outside the write list. Item 6 makes each false or needs it.
- **F3.** `DESIGN.md:23`, `:166` and `:576` and `docs/views.md:73` are made false and are not on the write list.
- **F4.** `ui/controls/editor/` is already at ten items. The stylesheet's folder must be named.
- **F5.** `guarded.md` is on the builder's write list, against `spec.md:35` and the D39, D40 and D43 precedent.

## 2. The step line

- **"a relative link ... to a file that does not exist is marked"**: items 1 and 2.
- **"or a backticked hub path ... is marked"**: item 4.
- **"a press with Cmd on a link or such a path opens its file"**: item 3 for links, item 4 for paths.
- **"a move or rename in the Files view, of a file or of a folder, offers to rewrite the links in `.md` files ..., listing them first"**: item 5. Item 5 rewrites only what the Markdown server rewrites, which is Markdown links. Backticked hub paths, the step line's other kind of reference, are neither rewritten nor ruled out. There is no requirement and no decision either way.
- **"the Audit view lists a project whose `project.yml` `type` disagrees with the folder the project is in"**: item 6. Decision 9 leaves out the `coauthor` tier. Ruling 21 has no such limit; this is a narrowing taken in the brief.
- **"the rename box shows its hint line"**: item 9.
- **Step 0, defect 1**: item 7. Step 0 says "Save does not offer to write it". Item 7 and case 26 say Save "does nothing", which still allows Save to be offered (`BarActions.svelte:80`).
- **Step 0, defect 2**: item 8.
- **Step 0, the two /spec lines (ruling 23)**: items 1 and 5. Option (a), which Axel ruled, listed as its pros "heading links, link completion, document symbols, Find All References to a heading or a file, and rename of a heading". Decision 2 declares none of these.

Findings:
- **F6.** Rewriting backticked hub paths after a move has no requirement and no decision.
- **F7.** Decision 9 narrows ruling 21 without a ruling. Some coauthor folders do have a convention that can be read: `abandoned` holds only `abandoned`.
- **F8.** Item 7 and case 26 are weaker than Step 0's "Save does not offer to write it".
- **F9.** Decision 2 drops the features listed as option (a)'s pros in ruling 23. That is a choice with a trade-off, and it was neither booked nor raised.

## 3. Premises

- **Holds**, each re-checked:
  - `git log -1`: `fde67f62d4ba4b93893fe80af4a54b5a591456bf`.
  - `.agents/plan.yaml:8`: `standards: []`.
  - `wc -l`: `lsp-servers.ts` 262, `servers.ts` 793, `held.ts` 691, `relay.ts` 880, `ops.svelte.ts` 680, `preview.svelte.ts` 222, `manifests.ts` 373, `audit/projects.ts` 539, `portfolio.ts` 684, `Editor.svelte` 517, `DiskNote.svelte` 78.
  - Line references: `LspServerId` at :16, `LSP_SERVERS` at :87, `SERVED_LANGUAGES` at :226; `ServerEntry` 159-207 with `requests?` at 186; `packaged` at 374; YAML entry flags at 637, `refuses` at 645, `answers` at 646; held.ts `answer` at 351 with `workspace/diagnostic/refresh` replied null at 378 and `#entryAnswer` at 393; `process.ts:188-193`; `hosts.ts:193-200` (`services.open(target, 1)`); `model-machine.ts` read/file at 448 and 497-498; `preview.svelte.ts:21`, `:70`, `:142`, its caller at `lsp.ts:226`; `manifests.ts:132-142`; `findings.yml:36`; `sources.yml:14-20`; `vocab.yml:228-232`; `source.svelte.ts:414`; `disk.svelte.ts:93-96`; `context.ts:392-397` and `631-638`; `files.ts:218-225`; `source.yml:107` and `:113`; `statusbar.yml:102`; `renameWidget.css:50-57`; `client.ts:314`; `Editor.svelte:68` imports `./gutter/marks.css`.
  - `ls docs/adr tools/oculus/docs/adr`: both "No such file or directory".
  - `registerLinkProvider` is present in `monaco-lsp-client/out/index.js`.
- **Probes.**
  - `node probe.mjs <S>` printed capabilities `diagnosticProvider codeActionProvider definitionProvider documentLinkProvider documentSymbolProvider foldingRangeProvider hoverProvider referencesProvider renameProvider selectionRangeProvider workspaceSymbolProvider workspace textDocumentSync`, and `DIAG 10 ms` with one item of code `link.no-such-file`, severity 2. The brief says 7 ms; this is timing variance.
  - `DEF link null`, `DEF backtick null`, and `TARGET docs/DATA.md#intro .../docs/DATA.md#L1,1`.
  - The folder rename and the file rename edits are as the brief says, including `../docs/DATA.md` inside the moved file.
  - The file-rename answer also edited `documents/DATA.md`, a place that no longer exists, because the probe never tells a watcher. This reproduces the stale-view point.
  - `node timing.mjs <S> tools/oculus/docs tools/oculus/guide`: `round 1: 978 ms, 949 client requests, 3 files, 81 edits`, `round 2: 3 ms`.
  - `btfno` move: `880 ms ... 2 files, 2 edits` (`../../manuscripts/CLAUDE.md`).
  - `node diagall.mjs <S>`: `473 files, 29 marks in 29 files`, 2331 ms on the first run and 695 ms on a rerun. The brief says 743 ms.
  - A rerun with per-method counts showed no `workspace/configuration` request, which confirms the settings premise. It also showed 145 `watcher/create` and 145 `watcher/delete` over open and close of every file.
- **Backticked paths.** An inline read-only python run of item 4's rule over `git ls-files '*.md'`, with `.scratch` left out, printed `911 825 86 39`, which reproduces the brief. 68 of the 86 marks are in `.agents/skills/*` and name the upstream repository's `docs/design/...` files, for example `.agents/skills/academic-paper/SKILL.md:153`.
- **Manifests.**
  - Flat tiers: `ideas` 33 `idea`, `active` 5, `manuscripts` 15, no `projects/software`.
  - `side-projects/*/project.yml`: 3 manifests, none with `type`. The brief leaves this tier out of its count; its conclusion still holds.
  - Every archive type equals its outcome folder.
- **Does not hold.**
  - The brief lists `tests/server/machine/lsp/servers.test.ts` as naming the id list or `SERVED_LANGUAGES`. The grep above does not return it.
  - `createServers` is at 728, not 735. `initializeParams` is at 752 (its `delete` at 762), not 757.
  - Coauthor `published/<year>` holds 11 `published` and 1 `tech-report` (`grep -h -E '^type:' projects/coauthor/published/*/*/project.yml | sort | uniq -c`), not "published 13".
  - `portfolio.ts:497-506` (`openRootFolder`) checks `existsSync` before `open` and prints nothing for a missing folder, so it does not "do the same" as the scan-dir loop at 589-601.

Findings:
- **F10.** Four premises are wrong in counts and lines: `servers.test.ts`, the `createServers` and `initializeParams` lines, coauthor 13 instead of 11, and `portfolio.ts:497-506`. None changes what is built.

## 4. Cases and checks

- **F11.** Brief line 186 tells the builder to serve a scratch oculus "on a port of its choosing above 8800" for cases 5, 6, 16 to 21, 26 and 30. This contradicts `spec.md:62`: "A builder runs no page: it starts no scratch oculus for a browser and drives no headless browser, whatever a brief says". It also contradicts `spec.md:63`. Those cases are read, run at unit level where a unit reaches them, and looked at on landing.
- **F12.** G2, G3 and G36 are widened with no ruling.
  - By the letter, `guarded.md:3` and `spec.md:57` require Axel's yes only for a new entry.
  - Every earlier widening went to Axel: open items 12, 13 and 14 (`orchestrator-state.md:171`) and D39's open item 15. D36's brief (O6) calls it "an entry's change needs Axel's yes".
  - The automode rule (`orchestrator-state.md:40`) lists "a guarded entry's wording" among the choices that must be booked.
  - G3 is about the secrets folder, and automode does not close "anything touching a secret".
  - `grep -n D41 choices.md` returns nothing, and the last booked choice in `plan.md` Rulings is Z742, which is D40's.
- **F13.** The brief's list of guarded entries leaves out entries whose Code line names a file the step changes. A mapping of the write list against `guarded.md` gives:
  - G1: `relay.ts` (a new page message on `lsp:markdown`).
  - G7: `servers.ts`, whose test `servers.test.ts` is on the write list with no named row.
  - G28 and G60: `draft.ts`, `disk.svelte.ts`, `source.svelte.ts` and `client/context.ts`.
  - G63: `held.ts` and `relay.ts`, which the split moves.
  - G67: `kit/lsp`.
  - G69: `watchServedRoots`, which item 7 hooks.
  - `keys.test.ts` (G24) and `config.test.ts` (G12) are also on the write list with no row or reason. `spec.md:57` says "A builder writes no other test".
- **F14.** Two parts of the case-12 and case-13 test belong to other units, and the case has a gap.
  - Case 13's second half (an outside link's mark is dropped) is a unit of the entry's `diagnostics` hook, not of the requests.
  - Case 12's "a `.md` tab under `secrets` is never put on the server" is the `refuses` unit.
  - Both are assigned to `markdown-requests.test.ts`, and the brief does not say whether that test spawns the server, which would make it slow under `spec.md:56-57`.
  - Case 12 leaves out `config/local.yml`, although item 1 refuses it.
- **F15.** The case-15 row adds a Markdown version of an outcome G36 already tests. The input that gives a different outcome has no row: a server that item 5 starts for a rewrite with no Markdown tab open. G36's sentence ("60 s after the last tab of its root and language closed") does not say when such a server ends.
- **F16.** Case 19 and item 5's fourth bullet ("refused by the plan as today") misstate the plan.
  - `state/system/machine/lsp/edits.ts:16-21` and `:312-326` edit a tab whose text the server holds; there is no refusal for unsaved text. A refusal comes only when the server holds no document and the draft differs from the disk.
  - The outcome therefore depends on the `held` map that the Files view passes to `refactor.submit`, and the brief never names that map.
- **F17.** None of the brief's 12 "Decisions taken in this brief" is booked as an automode choice (`grep -n D41 choices.md` returns nothing). Several of them are user-visible: decisions 1, 2, 9 and 10, the last of which removes a Findings-view row.

Findings: F11, F12, F13, F14, F15, F16, F17.

## 5. The question

The check on the step line is "each item holds when its cases hold". Could it pass without the goal being reached? Yes:
- Backticked paths are never rewritten (F6).
- A coauthor project in the wrong folder is not listed (F7).
- 68 of the 86 backticked marks are false (F28).
- No case covers nested roots (F23) or moving an open `.md` tab (F21).

Items:
1. **Yes.** Every case can pass while machine paths reach the page in the document links' `data` (F18).
2. **Yes.** No case checks that a mark clears when the missing file is created (F24).
3. **No.** Cases 5 and 6 reach the goal, provided case 5 is held to the heading line (F20).
4. **Yes.** Two gaps:
   - False marks on vendored skill text (F28).
   - No case covers `secrets/` or `tools/oculus/config/local.yml` spans. Hub docs do backtick them: `docs/DATA-MAP.md`, `tools/oculus/DESIGN.md` and `tools/oculus/README.md` hold `` `tools/oculus/config/local.yml` `` (F19).
5. **Yes**, because of F6, F21, F22 and F23.
6. **Yes**, because of F7.
7. **Yes**, because of F8 and F1.
8. **No.**
9. **No**, provided the look checks it, given F27.

Cases. "Yes" means the case could pass without the goal being reached.
- **No:** cases 1 to 4, 5 to 11, 12, 13, 14, 16, 17, 18, 20, 21, 22, 24, 25, 27, 28, 29 and 30.
- **Case 15: yes.** See F15.
- **Case 19: yes.** Its premise is wrong (F16).
- **Case 23: yes.** It writes the coauthor narrowing in as the expected result.
- **Case 26: yes.** Save may still be offered.

Two of the "no" answers carry gaps:
- Case 5 passes only if the `#L` fragment survives the mapper.
- Case 21 gives the watchers time to report the first move, so the first move right after a change is not tested.

## 6. Implied inputs

I read `ops.svelte.ts` (rename, place, paste, drop, undoFile, followTabs), `uris.ts`, `held/held.ts`, `held/process.ts`, `held/watch.ts`, `relay.ts` (the head and 795-815), `kit/lsp/hosts.ts`, `kit/lsp/client.ts`, `refactor/preview.svelte.ts`, `lsp/edits.ts`, `sessions/source/*`, `manifests.ts` and the Audit.

- **F18 (missing, G2).** `documentLink` answers carry the machine's paths in `data`. Probe output: `"data":{"href":{"path":{"external":"file:///private/tmp/...","path":"/private/tmp/..."}}}`.
  - `toPage` (`uris.ts:281-320`) rewrites only `uri`, `targetUri`, `oldUri`, `newUri`, `file` and `target`. `external` and `path` reach the page as they are.
  - `toServer` lets them back through on `documentLink/resolve`.
  - This breaks `uris.ts:27-28` ("no `file://` path of the machine reaches the page in any field") and `DESIGN.md:575`.
  - Expected: no machine path in any field of a link, with resolve still working.
- **F19 (missing, G3).** No case covers backticked spans naming `tools/oculus/config/local.yml` or `secrets/...`, though hub docs carry them (`grep -l` over the hub's `.md`).
  - Item 4 would stat under `secrets` and answer a definition location for `local.yml`.
  - Expected: not counted, not marked, not opened, consistent with item 2's rule for dropping marks.
- **F20 (found in case 5 only).** `toPageUri` drops the `#L1,1` fragment. `node -e "...fileURLToPath('file:///a/b.md#L1,1')"` prints `/a/b.md`. Item 3 names the opener and not the mapper.
- **F21 (missing).** Moving an open `.md` tab, clean or with unsaved text.
  - `followTabs` restates the tab, while the server may still hold the document under the old URI.
  - The `held` map passed to `submit` decides between editing the tab and refusing the whole rewrite.
  - Expected: stated per case.
- **F22 (missing).**
  - The order of watcher notices against the rewrite request: `held/watch.ts` debounces 200 ms, and the probe shows a stale answer when the server was not told. Expected: the move is told to the server before it is asked for the edit.
  - A partial multi-item move: `place()` loops on `exists` with a replace confirm and calls `landed` per round. Expected: one rewrite of the finished pairs.
  - A drag that mixes items from two roots.
  - A History undo of a move: no rewrite offered (decision 1).
- **F23 (missing).** Nested served roots.
  - A document belongs to the innermost root (`uris.ts:9-11`), and the outer root's workspace includes the inner root's files. A move under the inner root therefore does not rewrite links from the outer root's files.
  - Decision 8's reason ("a root's server sees no file of another root") is not exact on the tree's own terms.
- **F24 (missing).**
  - A missing target created on disk clears the mark, through the watchers and a refresh.
  - An unserved tab with unsaved text when its root is served again: `reloadSource` returns early at `source.svelte.ts:408`.
  - A saved draft with `disk: 'unserved'` after a reload: the `draft.ts:181` enum falls back to `'same'`.
  - `spec.md:69` and `orchestrator-state.md:115` require the brief to name and list as acceptance items:
    - The empty, duplicated and colliding cases of each new key: the server id `markdown`, the disk state, the record field for the manifest's own type (`RawManifest` spreads the manifest, so a manifest key of the same name collides), the diagnostic code, the catalog key of item 4 (left unnamed) and the watcher ids (a create given twice, a delete or onChange for an unknown id).
    - The asynchronous cases: two rewrites in flight, a page closing mid-request, a server ending mid-request, and a pull in flight when its document closes.
- **F25 (missing).** Serving Markdown tabs changes the Outline, against decision 2's own reason.
  - `client.ts:358` and `:680-699` ask `textDocument/documentSymbol` for every registered model, whatever was declared, and set `'loading'` or `'none'`.
  - `Outline.svelte:121` and `:147-150` then take the server's rows in place of `outlineOf('markdown')` (`sections/outline.ts:162-165`).
  - When the server is `not_found` or `failed`, `client.ts:471-476` gives `'none'`, so a Markdown tab whose server fails loses its heading outline.
  - Expected: decided and cased.
- **Partially found, in case 12:** the page-side `isRefusedFile` (`language/lsp.ts:125-133`) checks the private-folder rule only for `yaml`.
- **Found:** cross-root moves (case 18), the second preview (case 20) and the outside-root mark (case 13).

Findings: F18, F19, F20, F21, F22, F23, F24, F25.

## 7. ADRs

- `ls /Users/axelfaes/workspace/research-hub/docs/adr tools/oculus/docs/adr`: both "No such file or directory".
- `find . -name adr -type d` (node_modules left out): no output.
- `.agents/plan.yaml` names no `adr` folder.
- The brief's statement holds.

Findings: none.

## 8. Dictated text

Each was found with `grep -n` in the brief: lines 104, 118, 124, 133, 137, 139 and 154.

- **G3 sentence (137).** Holds: ASCII, no dash, no history, and the change from the current text is only "YAML or Markdown". It does not mention the refusal of `local.yml` to the Markdown server that item 1 builds, so case 12 and the entry both leave it out (F14).
- **"No file or folder at <path>." (104, 154).** It breaks the hub `CLAUDE.md` "Writing docs" rule on synonym cycling. The same kind of mark in one Problems list then reads "File does not exist at path: X" (the server's words, kept by decision 5) or "No file or folder at X.". `<path>` also has to be `{0}` in the catalog. "docs/adr/." reads as part of the path. **F26.**
- **"type {0} is not the folder's {1}" (118).** Holds. It mirrors `id_not_folder`.
- **"This file's folder is no longer served; Save is off until it is served again." (124).** Holds the prose rules; the `spec.md:42` word list covers comments and test titles, not catalog lines. It is inexact on the tree's own terms:
  - The thing that stops being served is the root, which is often an ancestor of the file's folder.
  - "Save is off" promises more than item 7 builds (F8).
  - **F27.**
- **CSS rule (133): `.monaco-editor .rename-box .rename-label { display: inherit; }`.** Holds the ASCII rule. Its specificity, (0,3,0), equals Monaco's `display: none` rule at `renameWidget.css:50-53`, so which one wins depends only on the order the stylesheets load. **F28.** Note that F28 is this CSS finding; the false backticked marks are F29 below.
- **G36 phrase (139): "one Markdown server its Markdown tabs".** Holds the grammar of the list. It does not cover a server started without a tab (F15).

User-visible choices the brief takes, and decisions that are wrong on the tree's terms:
- **Decision 2** (F9, F25): its reason is false, since serving the tab changes the Outline anyway.
- **Decision 6**: **F29.** 68 of the 86 measured marks are false, because they name the upstream repository's files in vendored skills. The decision calls the rule "measured" without judging those marks.
- **Decision 8** (F23).
- **Decision 9** (F7).
- **Decision 10** removes a Findings-view row (F17).
- **F30.** The preview's title for a link rewrite is left unnamed. It would fall back to "Refactoring" (`docs/views.md:73`).

Findings: F26, F27, F28, F29, F30.

## Declined to judge

- Whether markdown-it's `parse` tokens fit what the server expects beyond the probe's runs. The probes show it works on 473 files; I read no more of the server source than its watcher, diagnostics and rename handlers.
- Whether a watcher per id costs too much. The probe shows 145 creates over open and close of 473 files; I did not measure fs.watch handles.
- Whether moving the flat-tier type check from Findings to the Audit is the right split. `scan.ts:6-10` supports either reading.

Agent usage: ac604810d19c5e3dc, claude-opus-5-5, 322,042 tokens, 110 tool uses, 15.3 min.

## Closed (the session's change to the brief for every finding above, made before the preparation commit)

The step stopped on open item 24 (F12, G3's wording), so the brief was removed from the ledger as the stop requires and is written again at the next `/spec` with each change below; the changes that are choices are booked as Z743 (`plan.md` Rulings, `choices.md`).

- F1: `views/sources/source/status/tab-shown.ts`, `views/sources/source/actions/BarActions.svelte` and `state/sessions/source/draft-entry.ts` join the paths; item 7 requires the note drawn (`disked` true for `unserved`), Save not offered (`savable` false), and a sentence in `unfit`.
- F2: `server/content/audit/rules.ts` (the `archive_outcomes` reader), `data/model/model-entities.ts` (the new field beside `manifestId`, the comment at 78-82), `config/catalogs/vocab.yml` line 228 and the hub's `docs/DATA-MAP.md` line 69 join the paths, each sentence made true.
- F3: `DESIGN.md` lines 23, 166 and 576 and `docs/views.md` line 73 join the paths.
- F4: the stylesheet is `ui/controls/editor/kit/rename.css` if `kit/` has room, else a rule added to `gutter/marks.css`'s sibling folder the size check allows; the brief names the folder after counting it.
- F5: `agents/guarded.md` leaves the builder's paths; the builder hands back the G2, G3 and G36 lines under "Doc text", which the orchestrator writes in at landing.
- F6: Z743 (a): the rewrite also covers backticked hub paths that item 4's rule resolves to the moved file or into the moved folder, in the same preview, each kept in its form (from the root or from the file's folder, the `:line` suffix kept).
- F7: Z743 (b): the coauthor `abandoned` folder is checked (`type: abandoned`); its `active` and `published/<year>` folders hold several types and are not.
- F8: closed with F1.
- F9, F25: Z743 (c): the entry declares every provider the server offers that VS Code's Markdown support uses (completion of paths, hover, definition, references, rename of a heading, document and workspace symbols, folding, selection ranges, code actions, document links); the Outline takes the server's symbols and falls back to its own reading of the headings while the server is not running or failed; cases for each.
- F10: the four premises corrected: `servers.test.ts` not in the grep; `createServers` at 728 and `initializeParams` at 752; coauthor `published/<year>` 11 published and 1 tech-report; `portfolio.ts:497-506` already tests the folder, so item 8 names only 589-601 and the other `open` calls at 412, 439 and 468.
- F11: the scratch-oculus sentence is removed; the page cases are checked at unit level where a unit reaches them and are looked at on landing (`spec.md:62-63`).
- F12: G2's and G36's additions are Z743 (d); G3's wording is open item 24, Axel's, since automode leaves anything touching a secret open.
- F13: the brief lists G1, G7, G12, G24, G28, G60, G63, G67 and G69 with the tests the builder runs for them, and says `keys.test.ts` and `config.test.ts` change only for the keys the step adds or removes.
- F14: the requests test runs the handlers with no server process (a fast unit test); the `refuses` unit and the `diagnostics` hook unit get their own rows; `config/local.yml` joins case 12.
- F15: Z743 (d): a Markdown server started for a rewrite with no Markdown tab ends 60 s after its answer, as after the last tab; a G36 row for it.
- F16: case 19 and item 5 restated from `lsp/edits.ts:16-21` and `:312-326`: the Files view passes the texts of the page's tabs as `held`, so a tab with unsaved text is edited in the tab as a server's edit is today, and nothing is written to that file.
- F17: the user-visible decisions are booked as Z743.
- F18: `toPage` and `toServer` map the `data` of a document link (its `external` and `path`), so no machine path reaches the page and resolve still works; a G2 row in `uris.test.ts`.
- F19: a backticked span under `secrets`, `~/.oculus` or naming `config/local.yml` is not counted: not marked, not opened; a case.
- F20: the mapper keeps the `#L<line>,<column>` fragment; item 3 names `uris.ts`.
- F21: cases for moving an open `.md` tab, clean and with unsaved text.
- F22: the moved paths are told to the server as watcher changes before the rewrite is asked; one rewrite for the pairs a multi-item move finished; a drag that mixes roots asks per root; a History undo of a move offers no rewrite.
- F23: Z743 (e): the rewrite asks each served root whose folder holds both places (an outer and an inner root), the edits merged.
- F24: cases for a mark cleared when its file is created, an unserved tab with unsaved text served again (the note goes, the text stays, the disk state is read again), a saved draft with `disk: 'unserved'` kept on reload; the empty, duplicate and colliding cases of each new key (the server id, the disk state, the record field, named `typeWritten` so no manifest key collides, the diagnostic code, the catalog key, the watcher ids) and the asynchronous cases (two rewrites in flight, a page closing or a server ending mid-request, a pull for a closed document) are listed as acceptance items.
- F26: Z743 (f): a backticked mark uses the server's words with the path inside the root, "File does not exist at path: {0}", one sentence for both kinds of mark.
- F27: Z743 (f): the note reads "This file is no longer in a served folder; Save is not offered until its folder is served again."
- F28: the rule's selector is made more specific than Monaco's (`.monaco-editor .rename-box .rename-label.rename-label`), so the load order does not decide it.
- F29: Z743 (g): the 68 marks in `.agents/skills/*` stay; each names a path that does not exist in this hub, a fact.
- F30: Z743 (f): the preview's title for a link rewrite is "Update links in Markdown files".
