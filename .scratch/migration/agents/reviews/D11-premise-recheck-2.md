D11 premise recheck on main at 8bd2070c

Main moved to d5d7f727b while this ran. `git diff --name-only 8bd2070c7 d5d7f727b` lists the three ledger files and `src/lib/views/sources/file/pdf/viewer.svelte.ts`. None of those is a file D11 reads or writes, and `grep -n "^- D11 "` gives plan.md:491 at both heads. So every code fact below holds at 8bd2070c.

Summary of what moved. The brief's facts were read at f9f6059d2. Its last commit, ef4fb22b3, only rewrote hashes. Since f9f6059d2, 24 code landings reached main (section 2). All five steps the brief waited on have landed: X3f e6d00fb0f, D20 722a287a7, D44 d7ff5fd3d, D45 0753a5e76 and D23 797e1e5dc. The changes that matter most:
- (a) D23 moved `server/machine/commands/` to `server/machine/runs/commands/`.
- (b) Q125 and Q126 rewrote HELP.md (now 174 lines) and DESIGN.md (574 lines) and moved the detail into `tools/oculus/docs/*.md`. Every HELP.md and DESIGN.md line the brief names is gone or has moved.
- (c) `server/root/context.ts` is 879 lines, one under the 880 cap, and `server/root/` already holds 10 items.
- (d) `ui/controls/editor/Editor.svelte` is 516 of 520 lines and `Source.svelte` is 517 of 520.
- (e) The Explorer group's order 3 is now References (D23b), so the brief's `debug` at order 3 collides with it.
- (f) `vscode-jsonrpc` 9.0.3 is now a dependency, and `lsp/held/process.ts` already frames Content-Length messages with its `StreamMessageReader` and `StreamMessageWriter`.
- (g) `tests/server/root/context-fixture.ts` builds a complete `ServerContext`, so adding `debug` to it needs that file too, and the write list omits it.
- (h) The floating toolbar Z547 rules has no shell path in the write list.

## 1. Premises

Each entry gives the premise, what the tree shows now with the command, and a verdict (holds, false or moved). The corrections are listed by line of `agents/briefs/D11.md` (594 lines, `wc -l`).

**Brief line 9.** "read on main at f9f6059d2". Moved. Corrected text: "read on main at 8bd2070c7, the code as D45 left it at 0753a5e76".

**Brief line 11.** The landings to wait for: moved. `git log --oneline f9f6059d2..HEAD -- tools/oculus ':!tools/oculus/.scratch' ':!tools/oculus/config/local.yml'` lists all five steps as landed (X3f, D20, D44, D45, D23), plus D23b, D23c, Q125, Q126, A3, E4, O30, D38, PR1, PR3, PR4 and others. The sentence "D11 is prepared once X3f, D20, D44, D45 and D23 have landed" is now satisfied.

**Brief lines 13 to 25, the plan.md line numbers.** Moved. Command: `grep -n "^- D11 \|Z191, automode\|...\|^- Z547 " plan.md`.

| Brief cites | Now |
|---|---|
| step line 481 | 491 |
| widening 482 | 492 |
| Step 0 483 | 493 |
| D17 515 | 533 |
| D11 debugs rite programs only, 663 | 718 |
| Settings ruling 751 | 806 |
| Z85 766 | 821 |
| Z87 768 | 823 |
| Z92 771 | 826 |
| Z191 918 | 973 |
| Z447 to Z450, 1172 to 1175 | 1227 to 1230 |
| Z454 1180 | 1235 |
| Z455 1181 | 1236 |
| Z456 1182 | 1237 |
| Z457 1183 | 1238 |
| Z462 1188 | 1243 |
| Z468 1194 | 1249 |
| Z488 1214 | 1269 |
| Z532 1248 | 1303 |
| Z536 1252 | 1307 |
| Z547 | 1314 |
| S5 booking "with Q119 and Q122 folded in by Z468", 223 | 227 |

**Brief line 19.** Moved. `grep -n "export function readLocalText\|'claude_bin', 'claudeBin'" src/lib/data/sources/config/local.ts` prints `:428` and `:465`. Corrected text: "`readLocalText` (`local.ts:428`), the program keys in the loop at `:463-473`".

**Brief line 23 (Z462).** The lines it names no longer exist. "HELP.md:282, DESIGN.md 358-432" is false: `wc -l HELP.md DESIGN.md` prints 174 and 574, and `grep -n "^## " DESIGN.md` puts "Decisions taken" at :450.

**Brief line 27.** False. `git grep -n "rite_dap\|launch.yml\|'debug'\|debug-console" -- src tests config ':!config/local.yml'` now prints:
- `src/lib/server/machine/lsp/clangd/databases.ts:75-76`, a clangd database named 'debug';
- `tests/routes/docs/literature.test.ts:82`, a console method.

Neither is a view or channel id. The `find ~/workspace -maxdepth 4 ...` for launch.yml and commands.yml still prints nothing, so that half holds. cathedra now has `.oculus/project.yml` (`ls -a ~/workspace/cathedra/.oculus`).

**Brief line 28.** Holds. `ls -la` prints 10426376 bytes, Sep 20 23:18, and the release binary is 4839832 bytes. `which rite_dap` exits 1. `git -C ~/workspace/cathedra log -1 -- <the five files>` prints `2ec1b38c 2026-09-23`.

**Brief lines 30 to 42.** Hold, checked against source only:
- `grep -n supports debug_dap.cpp` gives :182-191;
- `cmdLaunch` is at :198, the pause refusal at :373, and the request table at :392-410;
- the event grep shows only initialized, output, stopped, continued and terminated;
- `grep -n "curia::World world" main.cpp` gives :51.

The probes were not run again.

**Brief line 57.** Holds for `.vscode/launch.json` and `extension.js:50-63` (`sed -n 48,64p`). The four found cmake commands from `listCommands` are not verified: I did not run it.

**Brief line 59.** Path moved: `src/lib/server/machine/runs/commands/files.ts`, still 241 lines (`wc -l`). Line numbers hold: `typeProblems` :60, `nameProblem` :70, `folderOf` :84, `collect` :130 (now `export function collect`), `readCommandsFile` :198, `fileFinding` exported at :189.

**Brief line 60.** Path moved: `runs/commands/placeholders.ts`, 102 lines; `NAMES` :21, `valueOf` :36, `fillPlaceholders` :71. False: `TERMINAL_REFUSALS` is at `data/model/model-processes.ts:210` (`git grep -n "TERMINAL_REFUSALS ="`), not `model-sessions.ts:288-306`.

**Brief line 61.** Moved:
- `refusedAnswer` is at `answers.ts:143`;
- `refused_no_file` is at `config/text/views/sessions/terminal.yml:52` and `refused_no_selection` at :53;
- `server.commands` at server.yml:16-18 holds.

**Brief line 62.** Path moved: `runs/commands/resolve.ts:5-7`. The text holds.

**Brief line 63.** Moved: `runs/commands/run.ts`; `startCommand` is at :146 and `{ approve: lines }` at :123 (grep). `refusal` is at `pty/refusal.ts:47-50`.

**Brief line 64.** Moved and widened. `approvals.ts` is 304 lines; `defaultApprovalsPath` :36, `chainText` :72, `isApproved` :98, `approveTexts` :140. The head comment (:6-12) now names four key kinds: `command`, `app`, `interpreter` and `svelte-config`.

**Brief line 65.** Moved. `commands.svelte.ts` is 727 lines.
- `settle` is at :472-485 and `press` at :487-494.
- `answer` is at :508-522, the approval failure at :517-520, and `!yes` returns at :511.
- `runDefault` is at :674 and its notice at :678.
- A task terminal's `exit` is at `model-processes.ts:305`, not `model-sessions.ts`.
- `afterReceive` is at `terminals.svelte.ts:308`.
- The question now also has a `restart` kind (`pressRestart`, :496-502).

**Brief line 66.** Moved: `CommandAsk` is imported at `Workbench.svelte:35` and mounted at :404; the file is 486 lines.

**Brief line 68.** Moved. `Editor.svelte` is 516 lines.
- `breakpoints?` :101, `onglyph?` :114, `extension?` :122, `highlights?` :124, the decorations collection :185 and :214.
- There is no `pressed()` any more. The glyph press is `pressInGutter` in the new `ui/controls/editor/gutter/editor-gutter.ts:48-65` (`onglyph` at :65), and the drawing is `drawGutter` at :89-97 (`breakpointDecorations` at :97).
- `git grep -n breakpoint -- src` also lists `editor-gutter.ts`.

**Brief line 69.** Holds: `gutter.ts:170-171`; `marks.css:38-50`, red at :49.

**Brief line 70.** Moved: `EditorExtension` is at `types.ts:134-138`.

**Brief line 71.** Moved:
- `Source.svelte` is 517 lines; `language` is at :193 and `<Editor` at :446.
- The extension is `tabLanguage.extension` at :465, chosen by `languageExtension` (`views/sources/source/language/extension.ts:37-45`).
- Sources `Editor.svelte` is 297 lines and `source-gutter.svelte.ts` 151.
- `config/sources.yml:134` maps `rite: [.rite]`.
- The X3f estimate sentence is obsolete.

**Brief line 72.** Moved: `saveSourceDraft` at :533, `saved: content` at :556, `failed: true` at :577.

**Brief line 73.** Moved: `op: 'create'` at `file-ops.ts:140`; `createItem` at `ops.ts:425`, `newFile` at :419, `exists` at :437; `ops.svelte.ts` `create` at :404; `source.ts` answers 404 at :137 and :160. The body at :29 holds.

**Brief line 74.** Moved: `openFile` is at `repositories.svelte.ts:305`. `file-git.ts:85` and `editor-status.svelte.ts:45` hold.

**Brief line 75.** Moved:
- `channels.ts` is 217 lines; the head at :12-17 holds.
- `hasToken` is at `auth.ts:78` and `tokenedBody` at :97.
- The channel list is `+page.svelte:224-240`.
- `model-processes.ts` is 481 lines and is imported at `index.ts:588` and :622.
- `shapes.ts` :39 and :70; `payloads.ts` :63 and :139. `entities.svelte.ts:94` holds.

**Brief line 76.** Moved:
- `context.ts` is 879 lines (`wc -l`); `ServerContext` is at :131, `close()` at :599-622, `reloadLocal` at :791 and `apply` at :811.
- `FIELDS` (`watch/local.ts:78`) holds; `BUILT_FROM` is at :123.
- `repositoryOf` is at `runs/commands/repo.ts:11-28`, and `refuse` at `runs/commands/routes.ts:57`.

**Brief line 77.** Moved:
- `local.ts` is 565 lines; `claudeBin` :108, default :197, `openBin` :114, the loop :463-473, `LOCAL_KEYS` :151-175.
- In `options.yml`, `local.yml:` is at :1199, `approvals` at :1230-1232, `claude_bin` at :1242-1244 and `open_bin` at :1245-1247 (`grep -n`).
- The `checkLocal` describe is at `local.test.ts:43-92`; the `hpc_host` row at :68 holds.

**Brief line 78.** Moved:
- `LEFT_ITEMS` is `status-items.ts:32-41`: host, branch, sync, findings, hpc, usage, server, latex. LaTeX is now last.
- `itemName` is at :67 and `StatusBar.svelte` is 237 lines.
- The `--on-` minting is at `derive.ts:214`.
- `shell/status` holds 10 items (`git ls-tree`).

**Brief line 79.** Moved:
- `keys.ts` is 315 lines; `KeyAction` is at :42-63 and `defaultCommand` at :108-117; `openView` is at `workbench-keys.svelte.ts:186`.
- `config/text/app.yml:12` is 2109 characters (`awk 'NR==12{print length}'`) and already holds `s1-s5`.
- In HELP.md, the Alt+F5 row is at :83 and Shift-F10 at :76.
- Existing F-key bindings: `git grep "'F[0-9]"` finds F2, F4, Shift+F4, F12, Alt+F5 and Shift+F10, and no F5, F9, F10 or F11 alone.

**Brief line 80, folder counts.** Moved. `git ls-tree --name-only HEAD <d>/ | wc -l` gives:

| Folder | Brief | Now |
|---|---|---|
| `views/system/machine` | 3 | 4 (hpc, output, processes, usage) |
| `views/sources/source` | 10 | 9 |
| `server/machine` | 7 | 9 |
| `state/system/machine` | 6 | 5, all folders |
| `config/text/views/system/machine` | 3 | 4 |
| `src/routes/api/(machine)` | 3 | 4 |
| `tests/routes/machine` | 2 | 3 |
| `tests/server/machine` | 6 | 8 |
| `ui/controls/editor/gutter` | 2 | 3 |
| `server/root` | not named | 10 |
| `shell/status` | not named | 10 |

Unchanged at 10: `views/sources`, `state/sessions`, `state/sources`, `data/model`, `ui/controls/editor`, `state/client` and `shell`. The Explorer group now holds files 0, repositories 1, search 2, references 3 (D23b) and latex 5 (D45) (`grep -n "order:"` on each `group: 'explorer'` view).

**Brief line 81.** Moved: `registerAll` is at `views.ts:48-50`, `registerCollections` at :70-82, and `registerView` at `registry.ts:182-184`. `normalise.ts:82-89` holds.

**Brief line 82.** G1 :7-9 and G7 :25-27 hold; G13 is at `guarded.md:125-127`. G38 (seeded agent approval) and G55 (language server approval) now exist; see section 5.

**Brief line 83.** Holds: `vscode-parity.md:43`, :136-146; `Z74-inventory.md:144-180`, :1149-1188, :1687-1688.

**Brief line 85, DESIGN.md.** Moved or gone:
- :23 now reads "...LaTeX builds, PDF reading, project commands and the rite debugger. It has no lint panel and no other debugger." It is still true.
- The channel list is :121.
- The Processes rule is :165.
- The view folders paragraph is :177.
- The :245 clause ("`claude_bin` the usage refresh...") is gone; the local.yml key list is now `docs/configuration.md:33`.
- The :279 citation "`routes/views.ts:68-80`" is gone; :313 cites `routes/views.ts` with no lines.
- The `<kind>` approval paragraph is :410. It already says "`command` for a repository command, debug launch or seeded agent" but gives no debug text shape.
- "Decisions taken" is :450-574, and the status bar entry is :568, which now names the LaTeX item last.

**Brief line 86, HELP.md.** Moved:
- The `s1-s5` row is :46 and the keys table runs :27-86.
- The views table is :92-145: search :108, references :109, latex :110.
- "## Project commands" is :152, followed by "## Apps" at :156, not Source Control.
- The status bar paragraph is now `docs/window.md:82`.
- The `sources.yml` and `local.yml` detail is now in `docs/configuration.md`.
- `docs/views.md` has one section per view (Search :63, References :67, TeX view :71).
- `docs/terminals.md:47-69` holds project commands.

**Brief line 87.** Moved: README.md is 48 lines, and `grep -n -i "debug\|command" README.md` prints 9, 11, 13 and 48. It is still true.

**Brief line 88, head comments.** The commands paths are under `runs/commands/`. The `model-processes.ts` head (:1-5) now names schedules, terminals and the LSP relay messages.

**Brief lines 109 to 121, section 2.**
- The loop is at `local.ts:463-473`, and `localDefaults` at :193.
- The `options.yml` entry goes after `open_bin` at :1245-1247, and the `approvals` entry is :1230-1232.
- The DESIGN.md:245 target is gone. Corrected text: "`docs/configuration.md:33`'s key list gains `rite_dap_bin`, the rite debug adapter, and its approvals clause names debug launches".
- The dictated `approvals` sentence names project commands and debug launches only. The file now also holds apps, interpreters and Svelte configs (`approvals.ts:6-12`).

**Brief line 129.** The premise that framing must be hand-written: see section 4. `lsp/held/process.ts:6-7,17,125-128` frames with `vscode-jsonrpc`.

**Brief line 143.** Moved: the commands store's refusal is `write()` at `commands.svelte.ts:386-393` (`error ?? t('commands.refused')`).

**Brief lines 159 and 163.** Moved: the notice is at `:678`, the approval failure at `:517-520`, and `answer(false)` returns at `:511`.

**Brief line 173.** False: `order: 3` is References (`src/lib/views/sources/search/References.svelte:10`). Order 4 is free.

**Brief line 174.** Moved: `ops.svelte.ts:404`, `file-ops.ts:140`.

**Brief line 187.** Moved and partly false. `grep -n "^        [a-z_]*:$" config/text/server.yml` prints chat 8, commands 16, config_key 19, deck_edit 50, deck_slides 69, config_value 80, export 102, fork 113, git 115, latex 127, start 129 and task 133. The groups are not alphabetical. Corrected text: "a `debug:` group after `config_value:` (:80-101) and before `export:` (:102)".

**Brief line 191.** Moved: the Monaco gutter wiring lives in `gutter/editor-gutter.ts` (103 lines), and `gutter.ts` is 397 lines.

**Brief line 193.** Moved: the source tab's extensions are chosen in `views/sources/source/language/extension.ts`, so `riteHover` joins `languageExtension` there.

**Brief line 194.** Moved: `Source.svelte` is 517 of 520 lines, and `views/sources/source` holds 9 items.

**Brief line 199.** Holds: "after `findings`". LaTeX stays last.

**Brief line 200.** Moved: "`s1-s3` becomes `s1-s5`" is now "`s1-s5` becomes `s1-s7`", in `HELP.md:46` and `app.yml:12`.

**Brief line 204.** False: "only `index.ts:509` imports it". `git grep -n "model-processes" -- src tests` prints `index.ts:588`, `:622`, `model-sessions.ts:8`, and comments at `data/helpers/run/tasks.ts:2`, `state/shared/answers/terminal-words.ts:2` and `state/system/machine/schedules/schedule-words.ts:2`.

**Brief line 205.** The target is gone (DESIGN.md:279). Drop that clause.

**Brief line 210.** Moved. Corrected text: "HELP.md: a short section '## Debugging' after '## Project commands' (:152) and before '## Apps' (:156), linking to the guide that holds the fixed choices".

**Brief line 234.** Moved:
- The views rows go after `latex` (:110).
- The key rows go after the Alt+F5 row (:83), and there is no separate X3f Cmd+S row.
- The status bar text is `docs/window.md:82`.
- The `local.yml` text is `docs/configuration.md:33`.

**Brief line 235.** Moved: DESIGN.md :430 is now :568, :114 is :121, :153 is :165 and :328 is :410. The :245 and :279 targets are gone.

**Case 2, brief line 244.** Moved: `commands.svelte.ts:678`.

**Case 31, brief line 282.** Moved: `local.test.ts:43-92`, `readLocalText` at `local.ts:428`.

**Case 63, brief line 323.** The grep now prints the two non-id hits above. Corrected text: "...prints only `lsp/clangd/databases.ts:75-76` and `tests/routes/docs/literature.test.ts:82`, neither a view or channel id".

**Case 64.** Moved: `grep -n "Channels:" DESIGN.md` gives :121.

**Brief lines 369 to 416, the write list.** Moved; see section 3.

**Brief lines 421 to 467, Shared paths.** Obsolete: all five named steps have landed. Rewrite them for X3e, D28, M6 and D33 (section 3).

**Decision 9 (brief line 479).** Order 3 collides; see section 5, C1.

**Decision 15 (brief line 485).** False, as for line 204.

**Read list (brief lines 515 to 538).**
- Item 3: DESIGN.md is now :117-177 for the server and the processes rule, :408-410 for approval, and :450-574.
- Item 4: HELP.md is :23-86, :88-145 and :152-154, plus `docs/terminals.md`, `docs/views.md`, `docs/window.md:80-82` and `docs/configuration.md:31-33`.
- Item 5: `src/lib/server/machine/runs/commands/`.
- Item 8: `context.ts:125-230`, :330-360, :540-625 and :785-830.
- Item 10: `commands.svelte.ts:380-530` and :670-700.
- Item 11: `terminals.svelte.ts:300-330` and :530-545.
- Item 14: add `gutter/editor-gutter.ts`; `latexExtension` is at `kit/latex/latex-widget.ts:279`.
- Item 15: add `language/extension.ts`.
- Item 18: `local.ts:100-200` and :420-565; `options.yml:1199-1260`.
- Item 19: `ops.svelte.ts:395-415`, `ops.ts:415-440`, `source.svelte.ts:525-580`.

**Checked against cathedra (read only).**
- `extension.js:48-64` still fills `program` only with no configuration (`!config.type && !config.request && !config.name`) and refuses a configuration with none.
- `main.cpp` (97 lines) runs the file after `configurationDone` and sends `terminated`; the script writes nothing to stdout except DAP.
- `debug_dap.cpp` (531 lines) is unchanged in the cited places.
- cathedra is a served root of oculus (`python3` read of `config/sources.yml` roots: cathedra, game-engine, ordo, scotoma, officium, youtube-downloader). Case 57's scratch setup is therefore the only way to get a frame outside a root while debugging cathedra.

## 2. What landed since the brief was last committed

`git log -1 -- agents/briefs/D11.md` prints ef4fb22b3 ("Point the plan files at the rewritten commit hashes"). It changed only hashes in the brief (`git show ef4fb22b3 -- .../D11.md`).
- `git log --oneline ef4fb22b3..HEAD -- tools/oculus ':!...scratch'` prints: d5d7f727b (PDF viewer, after 8bd2070c), 0753a5e76 D45, 639820b91 D23b, eede45985 PR4, c0a4af9c1 D23c, a29014904 PR3, 6561f82ae Q126, 797e1e5dc D23, e7952e163 Q125, 548004bcc.
- The brief's numbers were read at f9f6059d2. `git log --oneline f9f6059d2..ef4fb22b3` adds: abf4356cf Q124, 4ce24363b O30b, c86f10f2f E4g, 687cd1d5c PR1, 02ac124ec Q123, 10ac00c69 E4, 09509b5b6 A3, 3cb170eae O30, 61f253977, 57c6ba7e6, d7ff5fd3d D44, 8aa491caa, 722a287a7 D20, 5b4e737a8 D38 and e6d00fb0f X3f.

Per path, `git log --format=%h f9f6059d2..HEAD -- <path>`. Each relevant change is named by its commit.

| Path | Commits | What changed |
|---|---|---|
| `runs/commands/files.ts`, `placeholders.ts` | 797e1e5dc (D23) | Moved from `machine/commands/` (rename hunks of 6 and 4 lines) |
| `server/root/context.ts` | 0753a5e76, c0a4af9c1, 797e1e5dc, 10ac00c69, 09509b5b6, d7ff5fd3d, 722a287a7, 5b4e737a8 | The relay field :135 and its construction :341-353; `close()` gains `followed` and `relay` at :620-621; the file reaches 879 lines |
| `watch/local.ts` | 797e1e5dc, 10ac00c69, 09509b5b6, 5b4e737a8 | `FIELDS` gains `lsp`, `schedules`, `scheduleRecord`, `appsDir`; `BUILT_FROM` moved to :123 |
| `core/channels.ts` | 0753a5e76 | 217 lines; head :12-17 unchanged in text |
| `+page.svelte` | 0753a5e76, 10ac00c69, 09509b5b6, 3cb170eae | Channels `schedule`, `apps`, `jump` added (:224-240) |
| `routes/views.ts` | 10ac00c69 | `registerApps` :113-125; `registerCollections` :70-82 |
| `data/model/model-processes.ts` | 0753a5e76, 639820b91, c0a4af9c1, 797e1e5dc, 09509b5b6 | Schedules, terminals, `TERMINAL_REFUSALS` and LSP relay types moved in; 481 lines |
| `data/model/index.ts` | 13 commits | Imports at :588 and :622 |
| `local.ts` | 797e1e5dc, 10ac00c69, 09509b5b6, 5b4e737a8 | `lsp`, `schedules`, `apps_dir`, `literature` keys; loop at :463-473 |
| `shapes.ts`, `payloads.ts`, `entities.svelte.ts`, `state/client/context.ts` | A3, E4, D45, D23, D23b and others | Line shifts; `processes` still at shapes :39/:70, payloads :63/:139, entities :94 |
| `commands.svelte.ts` | 0753a5e76, 09509b5b6, 3cb170eae | `settle`, `press`, `answer` and `runDefault` shifted by 2 to 6 lines; `restart` question kind |
| `Source.svelte` | 0753a5e76, 639820b91, c0a4af9c1, 797e1e5dc, 3cb170eae, d7ff5fd3d, e6d00fb0f | 517 lines; extension via `language/extension.ts` |
| Sources `Editor.svelte` | 639820b91, c0a4af9c1, 797e1e5dc, 3cb170eae, e6d00fb0f | 297 lines |
| `source-gutter.svelte.ts` | e6d00fb0f | 151 lines |
| `ui/controls/editor/Editor.svelte` | 0753a5e76, 639820b91, 797e1e5dc, 3cb170eae, e6d00fb0f | 516 lines; gutter wiring moved to `gutter/editor-gutter.ts` |
| `gutter/gutter.ts` | e6d00fb0f | 397 lines |
| `marks.css` | none | Unchanged |
| `Workbench.svelte` | 0753a5e76, 639820b91, 10ac00c69, 3cb170eae, e6d00fb0f | `CommandAsk` at :35/:404 |
| `keys.ts`, `workbench-keys.svelte.ts` | D45, D23b, O30, X3f, E4 | `save`, `tex-view`, `close-tab`, `new-text-file`, `find`, `workspace-symbol`, `clear-cursor` kinds; `showsTexView` |
| `status-items.ts` | 0753a5e76, 639820b91, 797e1e5dc, e7952e163, e6d00fb0f | `latex` last of `LEFT_ITEMS`; LSP and interpreter items on the right |
| `StatusBar.svelte` | 0753a5e76, e6d00fb0f | 237 lines |
| `options.yml` | D45, D23, 548004bcc, PR1, E4, A3, D38 | Local block at :1199 |
| `glyphs.yml`, `icons.yml` | 6 commits | 264 and 263 lines |
| `server.yml` | PR3, 548004bcc, O30b, O30, D20 | `deck_edit` and `deck_slides` inserted before `config_value` |
| `statusbar.yml` | D45, D23b, D23 | `item_latex` :13 and LSP items |
| `app.yml` | 8 commits | Line 12 is 2109 characters with `s1-s5` |
| `package.json`, lock | 8 to 9 commits | `vscode-jsonrpc` 9.0.3, `pdfjs-dist`, `sh-syntax`, `pyright`, the TS and Svelte servers |
| `local.test.ts` | 797e1e5dc, 10ac00c69, 09509b5b6, 57c6ba7e6, 5b4e737a8 | Rows for `lsp`, `schedules`, `apps_dir`, `literature`; describe at :43-92 |
| `HELP.md`, `DESIGN.md` | 19 and 20 commits | Q125 (e7952e163) and Q126 (6561f82ae) restructured both and created `docs/*.md` |
| `approvals.ts` | 639820b91, 797e1e5dc, 10ac00c69 | `interpreter`, `svelte-config` and `app` kinds |
| `state/sessions/source.svelte.ts` | 5 commits | 607 lines |

## 3. Paths this step writes

Each path at 8bd2070c is given with whether it is new, then the other queued steps known to write it, read from `agents/briefs/X3e.md`, `D28.md` and `M6.md`, the plan lines of M8, D43, D33, D36, D40, D39, D41, M7 and D15, and `agents/reviews/D33-premise-recheck.md`. Where nothing is named, "none known".

**New files and folders:**
- `src/lib/server/machine/debug/`: `wire.ts`, `session.ts`, `launch.ts`, `console.ts` and `routes.ts`. `server/machine` goes from 9 to 10 items. None known.
- `src/routes/api/(machine)/debug/+server.ts`. None known.
- `src/lib/state/system/machine/debug/` (internal choice I3), or `debug.svelte.ts` and `debug.ts` beside the five folders. None known.
- `src/lib/views/system/machine/debug/`. None known.
- `src/lib/ui/controls/editor/kit/rite/rite-hover.ts`. None known.
- `src/lib/shell/commands/DebugAsk.svelte`. None known.
- The floating debug toolbar, which the brief's list lacks. A view cannot draw over the workbench (DESIGN.md:177), so it is a shell file, for example `src/lib/shell/commands/DebugToolbar.svelte`, using the interactjs gesture pattern of `shell/panes/floats/float-gesture.ts`. None known.
- `config/text/views/system/machine/debug.yml`. None known.
- `tests/routes/machine/debug.test.ts`. None known.
- `tests/server/machine/debug/session.test.ts`. None known.
- A Debugging guide, if C3 (a) is taken: `tools/oculus/docs/debugging.md`. None known.
- The split file of `server/root/context.ts`, which must sit in an existing subfolder (`process/` or `watch/`), since `server/root` holds 10. None known.
- The split file of `Source.svelte`, in `views/sources/source/` (9 items) or a subfolder. D28 and M6 also split or rewrite `Source.svelte`.
- The split or helper for `ui/controls/editor/Editor.svelte` (516 lines), most likely `gutter/editor-gutter.ts` (existing). D28 writes `Editor.svelte`.

**Existing files:**
- `src/lib/server/machine/runs/commands/files.ts`. None known.
- `src/lib/server/machine/runs/commands/placeholders.ts`. None known.
- `src/lib/server/root/context.ts` (879 lines). X3e and D28.
- `tests/server/root/context-fixture.ts`, missing from the brief: it builds a complete `ServerContext` (`:36-68`). X3e writes it (`git.refresh` :58).
- `src/lib/server/root/watch/local.ts` (`FIELDS` :78-101). None known.
- `src/lib/server/core/channels.ts` (head :12-17). None known.
- `src/routes/+page.svelte` (:224-240). None known.
- `src/routes/views.ts` (`registerCollections` :70-82). None known.
- `src/lib/data/model/model-processes.ts`, kept or renamed (I1). If renamed, also `model-sessions.ts:8` and the comments at `data/helpers/run/tasks.ts:2`, `state/shared/answers/terminal-words.ts:2` and `state/system/machine/schedules/schedule-words.ts:2`. None known.
- `src/lib/data/model/index.ts` (:588, :622). None known in the briefs.
- `src/lib/data/sources/config/local.ts`. None known.
- `src/lib/state/shared/stores/shapes.ts`. M6.
- `src/lib/state/client/payloads.ts`. X3e (`filesShape` only).
- `src/lib/state/client/entities.svelte.ts`. None known.
- `src/lib/state/client/context.ts`. D28 and M6.
- `src/lib/state/sessions/terminal/commands.svelte.ts`. X3e (the `files` follower) and D33 (command diagnostics, per its recheck citing `commands.svelte.ts:74-75`).
- `src/lib/views/sources/source/Source.svelte` (517). X3e (load effect), D28, M6 and D33.
- `src/lib/views/sources/source/Editor.svelte`. D28 and M6.
- `src/lib/views/sources/source/source-gutter.svelte.ts`. None known.
- `src/lib/views/sources/source/language/extension.ts`, where the rite hover joins, missing from the brief. D43 (plan.md:519 names `extension.ts`).
- `src/lib/ui/controls/editor/Editor.svelte` (516). D28.
- `src/lib/ui/controls/editor/gutter/editor-gutter.ts`, missing from the brief. None known.
- `src/lib/ui/controls/editor/gutter/gutter.ts`. None known.
- `src/lib/ui/controls/editor/gutter/marks.css`. None known.
- `src/lib/shell/Workbench.svelte`. None known.
- `src/lib/shell/keys/keys.ts`. None known.
- `src/lib/shell/keys/workbench-keys.svelte.ts`. D33 (the `reconcilePane` and `rememberPane` fix of `D33-diagnosis.md`).
- `src/lib/shell/status/status-items.ts`. D33 (the Problems item).
- `src/lib/shell/status/StatusBar.svelte`. D33.
- `config/catalogs/options.yml` (:1230-1232 and after :1247). X3e (an entry before `local.yml:`), D28 (editor entries) and M8 (options.yml as the schema of oculus's config).
- `config/catalogs/glyphs.yml` and `icons.yml`. X3e (`head`).
- `config/text/server.yml` (before `export:` :102). X3e: its write list's shared-paths line 117 puts a `deposit` group "between `config_value`'s last line and `export:`", the same place, so the merge is not simple.
- `config/text/statusbar.yml` (:9). D33.
- `config/text/app.yml` line 12. D33 (plan.md:598 names `app.yml:12`). X3e writes `app.palette`, not line 12.
- `config/layout.yml`, if C3 (a): `docs:` :171-179 and the Help arrangement :93. D33 (the Explorer pane line :82).
- `package.json` and `package-lock.json`, only if `@vscode/debugprotocol` is added. M8 (a YAML language server) and D43 (texlab, possibly no npm package).
- `tests/data/sources/config/local.test.ts`. None known.
- `HELP.md` (:46, keys rows after :83, views rows after :110, a section after :152-154). D28, M6, X3e (Doc text) and D33. Those briefs' HELP.md line numbers predate Q125.
- `docs/views.md` (Debug and Debug Console sections), `docs/window.md:82`, `docs/configuration.md:33`, and `docs/terminals.md` if C3 (b). Unknown: Q125 created these after the queued briefs were written. D33 likely writes `docs/views.md` and `docs/window.md`.
- `DESIGN.md` :121, :165, :410, :450-574 (one entry, :568). D28, M6, X3e (Doc text), D33 (:568) and D36 (:23).
- `tools/oculus/docs/diagrams/`. Every step.
- `.scratch/migration/agents/reviews/D11-report.md`.

## 4. Libraries

| Capability | Candidate | Facts | Verdict |
|---|---|---|---|
| DAP request, response and event types | `@vscode/debugprotocol` 1.68.0 | MIT, Microsoft (`microsoft1es`, `vscode-bot` and five more); released 2024-10-03 (`npm view ... time`); 135006 bytes unpacked; no dependencies | Ruled by LA17 (a). Not in `package.json` now. Works with `typescript` 6.0.3 as `import type` only: the desktop server runs the TS tree unbuilt, which DESIGN.md:570 states. Replaces hand-written types; the client stays hand-written. |
| DAP framing over stdio | `vscode-jsonrpc` 9.0.3, `StreamMessageReader` and `StreamMessageWriter` | MIT, Microsoft; released 2026-09-25; engines node >= 14; already a dependency (`package.json:105`) and used for exactly this framing in `src/lib/server/machine/lsp/held/process.ts:17,125-128` | Changes ruling Z448 (C4). See below. |
| Request pairing (`seq`, `request_seq`) | `@vscode/debugadapter-testsupport` 1.68.0 (MIT, Microsoft); `node-debugprotocol-client` 0.5.1 (MIT, last 2022-11-13, deprecated type package) | | Z448 rejected the first, and the brief rejected the second. None found that fits; pairing stays hand-written. |
| launch.yml reading | `yaml` ^2.9.0 and `zod` 4.6.5 | In the tree; `readCommandsFile` uses them, and `fileFinding` and `collect` are already exported | Use them. |
| Gutter dot, hint, execution line, hover | `monaco-editor` 0.57.0 | In the tree | LA17 (a). |
| Debug Console, 10,000 lines | `@tanstack/virtual-core` 3.17.11 | In the tree via `ui/tree/list/VirtualRows.svelte` | The brief names no virtualization for 10,000 DOM rows. VirtualRows replaces a hand-made windowing; the line drawing and the collapse of identical lines stay hand-written. |
| Console history suggestions | `bits-ui` 2.19.3 Combobox | In the tree as the ui primitive `ui/forms/choice/SuggestInput.svelte` | It is the ui primitive section 7 asks for; the filtering by prefix stays hand-written. |
| Draggable floating toolbar | `interactjs` 1.10.28 | In the tree (`shell/panes/floats/float-gesture.ts`) | Replaces pointer handling for the drag along the top edge; the clamp to the top edge and the saved position stay hand-written. |
| 100 ms append coalescing | `lodash-es` throttle, or a timer | In the tree | Either; a 5-line timer is as small. |

More on the DAP framing row. The reader parses `Content-Length`. A header with no length, or a length that `parseInt` makes NaN, is reported through `onError` and never thrown (`node_modules/vscode-jsonrpc/lib/common/messageReader.js:186-196`). A body that is not JSON is caught and reported through `fireError` (:211-219). Messages are delivered in order (`readSemaphore`). The writer writes only `Content-Length: n\r\n\r\n` (`messageWriter.js:128-131`).

It replaces the header reader, the byte counting and the writer of `wire.ts`. What stays hand-written: the `seq` pairing, the zod shape check, the rejection of pending requests, and ending the session on `onError` or close.

Its gaps against the brief's text:
- `parseInt("12abc")` is 12, so a length like that is taken, not refused.
- Headers other than Content-Length are ignored, not refused.
- A short body only starts the partial-message timer (10 s, `onPartialMessage`) and raises no error.

Z448's three reasons against testsupport (an unguarded `JSON.parse`, an endless wait on a bad length, no settling on exit) do not apply to this reader, except the endless wait, which the partial timer turns into a notice. Z448 did not weigh this reader: the brief dismissed `vscode-jsonrpc` for its connection layer's JSON-RPC pairing (brief line 510).

## 5. Choices

### User-visible, or changing an established decision

**C1. The Explorer group's places of `debug` and `debug-console`.** References holds order 3; LaTeX holds 5. Chord digits follow the sorted place in the group (`config/layout.yml:24`), so today s1 to s5 are files, repositories, search, references and latex.
- (a) Orders 6 and 7 after LaTeX: s6 and s7. Pro: no existing chord moves. Con: the debug views come last.
- (b) Orders 4 and 4.5: Debug becomes s5 and LaTeX moves to s7. Pro: debug sits beside the source views. Con: it moves LaTeX's chord, which D45 shipped a day ago.
- (c) Order 3 as the brief has it: it ties with References, and the sort between them is undefined.
- Recommendation: (a). It is the only option that keeps every shipped chord. D33's Problems then goes after them at its own /spec. The lazy option is (c), leaving the brief's number in place.

**C2. The approval key kind of a debug launch.**
- (a) `command:<sha256>` over `{ repo, debug: [cwd, program] }`, as the brief has it. DESIGN.md:410 already files a debug launch under `command`, and `isApproved` and `approveTexts` are reused unchanged.
- (b) A new kind `debug:<sha256>`, as D23 and D23b added `interpreter:` and `svelte-config:` (`approvals.ts:6-12`). Pro: kinds stay separable. Con: it contradicts DESIGN.md:410 and needs new functions.
- Recommendation: (a), since DESIGN.md:410 rules it and the `debug` JSON key already keeps the texts distinct. Neither is the lazy option by cost.

**C3. Where the debugging documentation goes**, now that Q125 made HELP.md a short guide with detail in `docs/`.
- (a) A short "## Debugging" in HELP.md after Project commands, plus a new guide `docs/debugging.md` holding section 11's fixed choices, listed in `config/layout.yml`'s `docs:` and the Help arrangement (:93, :171-179).
- (b) A section of `docs/terminals.md` (the "Terminals and commands guide").
- (c) Everything in HELP.md, against Q125's ruling (Z636).
- Pros of (a): the list of about 25 fixed choices is a guide's size, like Source Control's. Cons of (a): a new guide is a new entry in the Help group, which readers see.
- Recommendation: (a). The lazy option is (c).

**C4. The DAP transport (re-opens Z448).**
- (a) Hand-written framing, as ruled.
- (b) `vscode-jsonrpc`'s reader and writer, with pairing hand-written.
- Pros of (b): one Content-Length framing in the tree, which is what G21 asks ("a rule, a parser or a fold is written once"); proven in `lsp/held/process.ts`; no new dependency.
- Cons of (b): `parseInt` leniency, and other headers are ignored rather than refused (section 4), so the brief's dictated "refuses any other header value" changes to "reads Content-Length and ignores other headers, as the LSP relay does".
- Recommendation: (b). The lazy option by cost is (a): a second framing parser that duplicates one already in the tree.

**C5. `rite_dap_bin` holding `~/...`.** Axel's only working value is under `~/workspace/cathedra/bin/debug/`, and `spawn` without a shell does not expand `~`.
- (a) A value that is `~` or starts with `~/` is read under the home folder, as the path keys are (Z255, `docs/configuration.md:33`).
- (b) Read exactly as `claude_bin` (no expansion), so `~/...` ends in ENOENT.
- Recommendation: (a), with the options.yml description saying so, since (b) fails the landing look on the value Axel will type. The lazy option is (b).

**C6. A guarded test for the launch approval.** No entry covers "a debug launch runs only after its exact text is approved". G38 covers seeded agents and G55 language servers (`guarded.md:80`, `:37`). spec.md says a step needing a new entry stops and asks Axel.
- (a) Widen G38 to "A seeded agent or a debug launch runs only after its exact text is approved", with one test in `tests/routes/machine/debug.test.ts`.
- (b) Keep only G1, G7 and G13, as the brief has it.
- Recommendation: (a). A repository's file run without approval is the failure G55 already guards for language servers. The lazy option is (b).

**C7. A stack frame in a file under no served root (case 57).**
- (a) Listed and not opened, with a notice, as the brief has it. This matches G2 as worded: the only exception is a file a language server named.
- (b) Widen G2 so a file the debug adapter named in a frame of the current session opens read-only, as D23c's library files do (`views/shared/links/source-file.ts:35-67`), and as VS Code shows such sources.
- Recommendation: (a) for this step. cathedra is itself a served root, so the case arises only for scratch or outside repositories, and (b) changes a guarded rule, which is Axel's.

**C8. The debug keys while a Terminal tab has the keyboard and a session runs.**
- (a) F5, F9, F10, F11 and Shift+F11 go to the debugger, as VS Code's default `terminal.integrated.commandsToSkipShell` sends the debug commands past the shell.
- (b) The terminal program gets them.
- Recommendation: (a), as VS Code does. The brief's section 9 says "swallowed whenever a session is starting, running or paused" but answers only "while a field or the editor has the keyboard", which leaves the terminal unstated.

**C9. Breakpoints and watches across two tabs of the page.** Z449 keeps them per browser in `oculus.debug.v1`, and the ui store already follows other tabs through `storage` events (`state/workbench/ui.svelte.ts:18-24`, `followKey`).
- (a) The debug store follows `storage` events the same way, and a session's tab posts the merged state.
- (b) Each tab keeps what it loaded.
- Recommendation: (a). With (b), two tabs send different breakpoint lists to one session.

### Internal and reversible (the brief may take these)

- **I1.** `model-processes.ts`: keep its name and add the debug types (481 lines, room to 880), or rename it to `model-machine.ts`, which now touches 4 more files. Recommend the rename, since the file already holds schedules, terminals and LSP types and the name is wrong for them, with all six sites carried.
- **I2.** The `context.ts` split. It is at 879 of 880, so the session holder's construction and close cannot be added in place. Recommend moving one existing concern (for example the watcher-building block at :624 onward, "How each watcher is built") into `server/root/watch/`, and adding `debug` beside `relay`.
- **I3.** The store's folder: recommend `state/system/machine/debug/` with `debug.svelte.ts` and `debug.ts`, matching the five sibling folders.
- **I4.** The gutter: put the hint, tracking and paused decorations in `gutter/editor-gutter.ts` (`drawGutter`, `pressInGutter`) and `gutter.ts`, keeping `Editor.svelte` under 520 (4 lines of room).
- **I5.** The rite hover is joined to `languageExtension` in `language/extension.ts` with `together(...)`, not wired in `Source.svelte` (3 lines of room).
- **I6.** The Debug Console's rows through `ui/tree/list/VirtualRows.svelte`; the history list through `ui/forms/choice/SuggestInput.svelte`; the toolbar drag through interactjs as in `float-gesture.ts`.
- **I7.** The approvals texts: rewrite the `approvals` description (`options.yml:1232`) and `docs/configuration.md:33` to name every kind the file holds (project commands, debug launches, apps, interpreters, Svelte configurations). Both are already incomplete for apps and Svelte configs.
- **I8.** Open a frame through `repositories.openFile(root, path, line)` (state layer, drops a column), as the brief says. rite_dap's frames carry a line, and the probes show no column.

## 6. Cases

### The step's own cases

The launch file:
1. No `launch.yml`, `a.rite` open, F5: the question "Debug the open file?" with detail `rite_dap ${file}`; Approve and Debug runs the file in the repository folder and opens the Console. A second F5 after the session ends asks nothing.
2. No `launch.yml` and a `.md` tab or no tab: nothing starts; the warning "Open a .rite file to debug" (`commands.svelte.ts:678` is the precedent).
3. cathedra's configuration with `before` `true`: the command's approval, then its terminal, then the launch's approval; one task terminal.
4. `program: utils/benchmark/fib.rite`, `cwd: utils`: argv `[adapter, <repo>/utils/benchmark/fib.rite]`, cwd `<repo>/utils`.
5. `../other/x.rite`: refused, "leads above the repository; name a .rite file inside it".
6. `/tmp/x.rite`: refused, "must be a path relative to the repository".
7. `README.md`: refused, "must name a .rite file".
8. A missing file: refused, "must name a file of the repository that exists".
9. A link leading out of the repository: refused, "is a link that leads out of the repository".
10. Four bad `cwd` values: `folderOf`'s findings.
11. Bad names: `nameProblem`'s findings.
12. A repeated name: the second left out.
13. `programm` or `type`: the finding naming the key.
14. `${lineNumber}`: the placeholder finding.
15. File-level findings, as `commands.yml` has them.
16. An empty file or an empty list: no configuration; F5 says "launch.yml lists no configuration that reads; its findings are in the Debug view".
17. `${file}` with no tab: 400 `{ error: 'no-file', names: ['${file}'] }` and "No value for ${file}: open a file in a source tab first." (`terminal.yml:52`).
18. A missing `${fileDirname}/main.rite`: refused, naming the path.
19. A file under no root: refused before any spawn.
20. A hostile file name: one argument, no `pwned` (G7).

The approval:
21. Approved and run again: no question.
22. A changed program or another repository: asks again.
23. Chain text and debug text differ, and so do their hashes.
24. Cancel: the approvals file's bytes are unchanged.

`before`:
25. An unknown command: refused with "before names nothing-such, ...".
26. Exit 3: the question; Debug Anyway, Show Errors and Abort each do what they name.
27. A found command: resolved by the `depends_on` rule.
28. F5 while waiting: "A launch is waiting on <name>"; Shift+F5 drops the waiting launch.
29. Cancel at the command's approval: dropped with "...was not approved"; the next F5 is not refused as waiting.

The adapter:
30. ENOENT: the sentence; state `ended`; no child.
31. `rite_dap_bin: ""` or `5`: `local.yml: rite_dap_bin must be a non-empty string` (two G13 rows at `local.test.ts:43-92`); `readLocalText` keeps the default.
32. EACCES: as case 30.
33. Malformed frames: the session ends, the fake is killed, pending requests are rejected, and the server keeps serving.
34. Exit with a request pending: rejected.
35. SIGKILL from outside: "rite_dap ended with signal SIGKILL".

The session:
36 and 37. Pauses and scopes as the adapter answers (Z457).
38. A comment or blank line: hollow and pending.
39. Function breakpoint `add`: pauses at line 3.
40. The steps behave as named.
41. Finish Frame on `frame.rite`: one pause.
42. Continue: the output, then `ended`, exit 0.
43. Console input: `3`, the eval error, and the input disabled while running.
44. Hover on `x`: `1`; none while running.
45. Watch `nope`: error, and `nope = <undefined>` listed.
46 and 47. Stop behind the question naming the pid; the pid is gone.
48. Restart: the console starts empty.
49. A second launch: "A debug session is running: stop it first".
50. bad and err files: a stderr line, then `ended`.
51. Toggled while paused or running: as stated in the brief.
52. A symlinked root: the execution line in the symlinked tab.
53. 12,000 lines: `first` 2000.
54. A second page: the replay and a GET.
55. A reload: localStorage restores; a storage that throws gives empty lists.
56. Context close: no child.
57. A frame outside the roots: listed, notice.

The editor and keys:
58. F9 on `.rite` toggles; on `.md` nothing.
59. A breakpoint follows inserted lines: sent as line 10.
60. Disabled: a grey ring, not sent.
61. Saved before F5; a refused save stops the launch.
62. Keys under a Confirm: swallowed; the browser default only with no session and no `.rite` focus.

Ids and keys:
63. View ids: the grep now shows two non-id hits (section 1); a `debug` collection never replaces the view.
64 and 65. No channel or key collision.
66. A configuration and a command of the same name: both listed.

Routes:
67. No token: 403, no spawn (G1).
68. A bad `repo`: 400 before any read.
69. `continue` with no session: "No debug session is paused".

Implied inputs already in the brief:
70 to 72. `program` missing, a `.md` file as `${file}`, `cwd: ${workspaceFolder}`: each refused as stated.
73 and 74. Wrong types and bad `before` values: their findings.
75. A served root with no `.git`: the launch runs from the root, and a sub-folder `repo` gets 400.
76. Bad POST bodies: 400 `{ error }`, nothing sent to the adapter.
77 and 78. A refused `before` press, or a closed terminal: dropped with the sentence.
79. Add Configuration creates `.oculus/launch.yml`; pressed again, the bytes are unchanged.
80. Read-only or truncated drafts: no launch, the draft's message.
81. A subscribed page across the cap: equals the GET.
82. A hover over `println` or a comment word: no evaluate.
83. The default text equals the configured `${file}` text.
84. Collapsed identical lines: drawn once with a count.
85. History suggestions: listed; Tab takes one; Enter sends what is typed.
86. The slow `before` notice: Debug Anyway, Abort, or removed when the command ends.

### Inputs the step implies but never states

Each is given with its expected result:
- **N1.** A repository whose `.oculus/` already holds `project.yml` (cathedra now: `ls -a ~/workspace/cathedra/.oculus`), with Add Configuration pressed. Expected: only `launch.yml` is created, and the `project.yml` bytes are unchanged (`shasum`).
- **N2.** `rite_dap_bin: ~/workspace/cathedra/bin/debug/rite_dap`. Expected under C5 (a): spawned at the home-expanded path. Under (b): ENOENT and the case 30 sentence.
- **N3.** A `.rite` file shown at a commit (a version tab, `version: true` in `language/extension.ts`), as a diff side, or as a read-only library tab. Expected: no breakpoints, F9 and a glyph press do nothing, no hover; the file on disk is what runs.
- **N4.** Two tabs of the page with a session paused, a breakpoint toggled in the second. Expected under C9 (a): the first follows, and the session gets one list.
- **N5.** Paused, with a Terminal tab focused, F10. Expected under C8 (a): a step over, and the terminal program gets nothing.
- **N6.** An approvals file that does not read (not JSON), at Approve and Debug. Expected: `approveTexts`' reason is said, nothing is spawned, and the file's bytes are unchanged, as for commands.
- **N7.** F5 pressed twice before the first POST answers. Expected: one adapter; the second is refused with "A debug session is running: stop it first", since `starting` counts.
- **N8.** A `local.yml` `port` change, which moves the server (`server/root/mover.ts`), or a restart while paused. Expected: no `rite_dap` outlives the old server (`pgrep -fl rite_dap` prints nothing of oculus's).
- **N9.** Adapter output that splits one message across chunks, puts two messages in one chunk, or cuts a multibyte UTF-8 character at a chunk edge (Content-Length counts bytes). Expected: every message is parsed whole and in order.
- **N10.** `.oculus/launch.yml` as a link leading out of the repository. Expected: read as `commands.yml` is (`readCommandsFile` follows links, `files.ts:198-205`), with each `program` still held inside the repository.
- **N11.** A console line holding HTML or ANSI escapes (`<img src=x onerror=...>`). Expected: drawn as literal text, never as HTML (DESIGN's untrusted-value rule, G5).
- **N12.** `${file}` naming a `.rite` file of repository B while A's configuration is picked. Expected: it runs B's file with A's `cwd`, as VS Code fills `${file}`, and the approval text is A's.
- **N13.** In the desktop app (O30), F5 and a break's `window.focus()`. Expected: no menu accelerator takes F5 (`src/desktop/windows/menu.ts` binds Reload to Cmd+R only). The look records the focus call through a recorder and never by stealing focus (the standing demand).

## Declined to judge

- Whether VS Code draws a Run or Debug title action on a `.rite` tab (brief line 25). It needs `workbench.desktop.main.js`, which I did not read.
- Whether F9, F10 and F11 reach the page on macOS. Only the look settles it.
- `listCommands` on cathedra's four found commands, and the rite_dap probe outputs: not re-run, since the recheck runs nothing of cathedra's. Its source files are unchanged since 2ec1b38c (`git -C ~/workspace/cathedra log -1`).
- Q125's booking (plan.md:669) says `spec.md:66` gained the rule "a step writes HELP.md only where what a user does changes". `grep -n "guide\|short form" agents/spec.md` prints nothing, and spec.md:66's grep list names HELP.md, DESIGN.md and README.md but not `docs/`. This is outside D11 and affects how its doc paths are judged; whether the rule was meant to land in spec.md is the orchestrator's to read.
- Which queued steps without a brief (M8, D43, D33, D36, D40, D39, D41, M7, D15) write which of D11's paths. Section 3 names only what their plan lines and premise reviews state.
