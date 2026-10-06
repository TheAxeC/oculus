# Step D23c brief check (on main at 62fab790)

The brief says it was read at 6561f82a. `git diff --stat 6561f82a HEAD -- tools/oculus` lists only `.scratch/migration/orchestrator-state.md`, `plan.md` and `queue.md`, so no source file the brief cites has changed since then. `plan.md` has no section headed "Goal" (`grep -n -i goal plan.md` finds only lines 300 and 682). I used the goal given in my instructions: F12 and peek into a library file work in a read-only tab, served only for paths a server named to that page, and a tab opened from go to definition or the Outline selects the symbol.

The findings that need a change to the brief before dispatch, in order of weight:

- **The read is not guarded against secrets.** A server can name any file, so a token can be minted for `config/local.yml`, `~/.oculus` or a dot path (see section 6). That would break G3.
- **Today's rewrite already sends machine paths to the page.** In two fields (`arguments` and `changes`) the relay passes a raw `file://` URI through, so the brief's "drops it otherwise, as today" is false.
- **Case 2 cannot run as written.** `mirrors.cpp` contains no `std::vector`.
- **Verify item 4 cannot reach the files of cases 1 and 2.** With HOME moved to a temp folder, their roots do not exist.
- **The brief asks the builder to edit `guarded.md`, which the rules file forbids.** The file is under `.scratch/`.
- **`transport.ts` is already over 880 lines.** It is 897, and the brief lists it among the files to change without saying it must be split.
- **A library file cannot be opened on a server today.** The relay's `#didOpen` only takes addresses under a served root, and the brief never says how a library address is opened there. Hover inside the tab and the diagnostics half of case 10 both depend on it.
- **The extensionless header `vector` opens as plain text.** So hover in a clangd library tab (case 4) would not work.
- **A socket reconnect loses every token.** Only a page reload is covered.
- **The brief adds a second way to select text.** It adds `select?: boolean` to `goto` although a `select` request that selects a range already exists.

## 1. Names

Command: `grep -rn <name> src tests config HELP.md DESIGN.md README.md docs utils`, with the write list's paths filtered out.

- **`SourceTabState`:** no hit outside the write list.
- **`sourceTabState`:** 21 hits outside it, all positional calls `(root, path[, line])`: `shell/rail/RailFoot.svelte:54`, `shell/rail/rail.ts:55`, `state/workbench/navigation/rail.ts:23`, `state/client/context.ts:105,496`, `views/shared/explorer/opening.ts:64,67`, `views/feeds/linkedin/post-card.ts:13`, `views/system/workbench/settings/EditLink.svelte:23`, `Item.svelte:144`, `List.svelte:41`, `views/system/workbench/editors/Origins.svelte:31`, `views/sessions/session-list/Customizations.svelte:92`, `views/sources/file/File.svelte:152`. A trailing optional column makes none of them false.
- **`openSourceFile`:** hits outside the write list in `views/shared/latex/Main.svelte:103`, `latex/Outline.svelte:47`, `latex/Problems.svelte:32`, `links/SourceButton.svelte:23`, `boards/personal/Personal.svelte:92`, `boards/person/Person.svelte:126`, `sources/file/File.svelte:152`, `sources/search/Search.svelte:149` and `sources/doc/MarkdownPreview.svelte:75`. None is made false: the new field is optional.
- **`LspToServer` and `LspToPage`:** re-exported at `src/lib/data/model/index.ts:586-587`, which is outside the write list. If the builder adds a refusal-code type for the read, it will need exporting from `index.ts` the way `LspCode` and `LspRefusal` are (`index.ts:580,583`). `index.ts` is not in "Paths this step writes".
- **`LspServices.open` and `readFile`:** no user outside `kit/lsp/` and `views/sources/source/`. Their `(root, path)` signature cannot name a library tab. The change is inside the write list, but the brief does not say what replaces root and path for a library file.
- **The `goto` command** (`grep -rn "kind: 'goto'" src`): the hits outside the write list are `shell/panes/PaneView.svelte:427` and `shell/keys/Palette.svelte:268`. An optional `select` leaves both true.
  - The request passes through `views/sources/source/status/ask-perform.ts`, which the brief does not mention but which is inside the write list's `views/sources/source/` folder.
  - An existing `select` request already selects a range (`editor-status.svelte.ts:70`, `ask-perform.ts:118`, `language/lsp.ts:431-442`; `views/sources/files/sections/clangd/Ast.svelte:48` uses it). See section 4.
- **`toPage`:** used only in `relay.ts`. Its test row `tests/server/machine/lsp/uris.test.ts:148`, "drops a location outside every served root from an answer", becomes false for answers. It is inside the write list and must be rewritten.
- **G2:** `guarded.md:10-12` only. The edit is in the write list, but see section 4 on who may write it. Also:
  - No entry names the relay's tests: `grep -n "uris.test\|relay.test\|lifetime.test" agents/guarded.md` prints nothing.
  - G36, which Axel approved for D23 (`plan.md:1248`, Z485), is not in `guarded.md`.
- **DESIGN.md** (write list: lines 123, 510, 571-572):
  - `DESIGN.md:522`, the References view bullet, says a saved References result is "kept with the layout". Library rows saved there will hold dead tokens after a reload. The line is outside the write list and nothing in the brief covers it.
  - `DESIGN.md:571` says "the page never sees a path of the machine". `uris.ts:277` and `:283` already break that sentence today (section 3).
  - Line 510 is in the write list, but no item of "What to build" says what changes there.
- **Guides:** `docs/files-and-search.md` "Language servers" (69-72) is in the write list. Two other sentences are not:
  - `docs/views.md:69`, "A press opens the location at its line": Decision 3 makes it incomplete, since a press will now select the word. Not in the write list.
  - `docs/files-and-search.md:17`, "a press moves the editor to the symbol": stays true.

## 2. The step line

`plan.md:543`: "a definition a language server names outside every root opens in a read-only tab, served only for that page's answered paths through the `lsp` channel (Z669 (a)); a source tab opened from go to definition or the Outline selects the symbol, the tab's state taking an optional column (Z670 (a)); after D23".

How each part maps to "What to build":
- **"names outside every root opens in a read-only tab":** Part 1 items 1, 6 and 7.
- **"served only for that page's answered paths":** Part 1 items 1 to 4.
- **"through the `lsp` channel":** Part 1 item 4.
- **"opened from go to definition ... selects the symbol":** Part 2 items 2 and 3.
- **"or the Outline":** Part 2 item 5.
- **"the tab's state taking an optional column":** Part 2 item 1.
- **"after D23":** met. D23 landed as 797e1e5d (`git log`).

Every part of the line has a requirement. Some requirements go beyond the line: the References view column (Decision 3), the G2 rewrite and the documentation.

## 3. Premises

Rerun with `sed -n`, `grep -n` and `wc -l` from `tools/oculus`.

**Wrong:**
- **Drop sentence location.** The sentence is at `uris.ts:20-21`, not `:19-20`.
- **`DROP` and `toPage` line numbers.** `DROP` is at `uris.ts:196`, not `:116-117`, and `toPage` is at `:253`, not `:174` (`grep -n "const DROP\|export function toPage"`).
- **"Drops it otherwise, as today" (item 3) is false for two fields.** `toPage` keeps a raw machine path when a location is outside every root:
  - `uris.ts:277`: `? (toPageUri(one, mapper) ?? one)` for `arguments`
  - `uris.ts:283`: `changes[toPageUri(uri, mapper) ?? uri]` for a workspace edit's `changes` keys

  So a `workspace/applyEdit` naming a file outside every root reaches the page today with its `file://` path. Only `uri`, `targetUri`, `file` and `target` are dropped.
- **Opener line numbers.** `hosts.ts`: `registerEditorOpener` is at `:110-130` (brief `:113-133`), `registerLinkOpener` at `:131-138` (brief `:134-141`), and the column is at `:119-124` (brief `:125-130`).
- **`source-file.ts:16-29`.** The file has 28 lines; the function is 16-28.
- **`LspToServer`.** It is at `model-processes.ts:196-202`, not 195-201.
- **Case 2's file.** `grep -n vector ~/workspace/cathedra/src/monastery/src/mirrors.cpp` finds only comments and `ObjType::Vector`. `grep -o "std::[a-z_]*" | sort | uniq -c` gives `std::move` 9, `std::pair` 2, `std::string` 18 and `std::string_view` 8. There is no `std::vector`.

**Hold:** `toPageUri` at 169-180, `Mapper` at 160-167, `relay.ts:716`, `:805`, `:746-757`, `services.ts:47`, `language/lsp.ts:148-152` and `:153-155`, `peeks.ts:55`, `source.svelte.ts:31-36` and `:155-162`, the 26 `openSourceFile` lines, `Source.svelte:7`, `:168` and `:456`, `Editor.svelte:134` and `:170-180`, `types.ts:57`, `editor-status.svelte.ts:64`, `commands.ts:19-24`, `PaneView.svelte:427`, `Palette.svelte:268`, `Outline.svelte:199`, `symbols.ts:104-105`, `References.svelte:126`, `file-ops.ts:27`, `LspToPage` at 205-239, `lsp.svelte.ts:147` and `:279`, `guarded.md:10-12` (the grep prints nothing, exit 1), the relay test files, the sizes 520, 869 and 445, the folder counts 10 and 9, `DESIGN.md:123`, `:510`, `:571` and `:572`, `docs/files-and-search.md:69`, and `reviews/D23-landing.md:11`.

**Missing from "What is on the tree", and each one bears on the work:**
- **`transport.ts` size.** It is 897 lines (`wc -l`), already past the 880 rule.
- **The existing `select` request** (sites listed in section 1).
- **`#didOpen`** resolves only through `resolvePageUri` (`relay.ts:496`), so a library address opens nothing on a server.
- **Diagnostics** are forwarded only for a document open on that server (`relay.ts:806`).
- **`languageOf`** gives plain text for an extensionless name such as `vector` (`state/sources/explorer/file-type.ts:44-48`).
- **`#oculus` answers nothing** when the root is not served (`if (root === undefined) return;`), so a read for a gone root would never be answered.
- **The client reconnect.** `client.ts:265-275` registers every model again on a new socket, which is a new relay `Page` with no tokens.
- **The References state** already carries a column (`state/system/machine/lsp/references.svelte.ts:30,134`).

## 4. Cases and checks

**Conflicts with the rules file:**
- **Part 1 item 9 and the write line `.scratch/migration/agents/guarded.md lines 10-12`** conflict with `spec.md:35`: "You never edit anything under `tools/oculus/.scratch/`". In A3, D23 and M6 the builder handed the lines over and the orchestrator wrote them; only PR3 put `guarded.md` in a write list. The report path under `.scratch/.../reviews/` follows the D20 precedent.
- **Verify item 5** asks for "the rules file's rules on list items and sentence length". `spec.md` has no such rules: `grep -n -i "sentence length\|list item" spec.md` prints nothing (exit 1). Its only prose rule is at `spec.md:20`.
- **Verify item 4 cannot run cases 1 and 2.** It sets HOME to a folder under `$TMPDIR`, but the roots holding those files are `~/workspace/cathedra` and `~/workspace/game-engine` (`config/sources.yml:93-94`), expanded through `homedir()` (`files.ts:206-208`). Under the temp HOME those roots do not exist. Case 2's file also lacks the name it targets (section 3).
- **One write-list line is not a path.** "`tools/oculus/tests/` files of the tests this step's changes touch, by the guarded entries that name them" breaks the brief's own rule "One path per line". Concretely the step touches G28's Code file `src/lib/state/sessions/source.svelte.ts`, so G28's `tests/state/sessions/source.test.ts` must be run; the brief should name it.
- **Reuse rule.** Part 2 item 4 and Decision 6 add `select?: boolean` to `goto` without naming the existing `select` request. `spec.md` says "before writing a helper, type or schema, grep `src` and `tests` ... and reuse what exists".
  - For the Outline, the row is built from `selectionRange` (`symbols.ts:104-105`), so the exact symbol range is at hand. That range is what Z670 (a) says ("selects the symbol's range"), while Decision 6 uses the word under the column.
  - The brief should either use the existing request with the range for the Outline, or give the reason it does not.
- **The landing look checks "the library tab's read-only note" under two themes, but nothing in "What to build" makes such a note.** Item 7 has only the sentence for a restored tab.

**Cases that ask to check a place the step does not change:** case 19 (`PaneView.svelte`, `Palette.svelte`). It is justified, because the `goto` command they call changes. Case 14 reads the hub's `tools/present/` read-only, which is acceptable. No other case.

## 5. The question

Could each pass without the goal being reached?

- **Cases 1, 2 and 3:** no, though case 2 cannot run as written. Each alone would also pass with a read that is not limited to the page's tokens, so cases 5 and 6 carry that half.
- **Case 4:** yes for "typing changes nothing", which holds for any read-only tab. "Hover answers" cannot pass for clangd's extensionless header unless the tab takes the server's language, which the brief never requires.
- **Cases 5, 6, 8 and 9:** yes, a relay that refuses every read passes them. They guard safety, not the goal.
- **Case 7:** yes, for the same reason.
- **Case 10, first half:** yes, it passes today, because `relay.ts:806` drops diagnostics for any file not open on the server.
- **Case 10, second half:** depends on an unstated condition. It needs the library document opened on the server through didOpen, which the brief does not require.
- **Cases 11, 12, 17, 19, 20 and 21:** yes. They guard against regressions by design.
- **Case 13:** yes, it passes if library tabs never work.
- **Cases 14, 15, 16 and 18:** no, each needs the selection on open.
- **The step line's own check:** there is none. Line 543 carries only ordering and rulings; the plan's verify list runs at landing.
- **Part 1 items 1 to 7:** no, except item 3, which passes with no token code at all.
- **Item 8 (documentation):** yes, being text only.
- **Item 9:** the table's success row is no; its refusal rows are yes.
- **Part 2 items 1 to 3 and 5:** no.
- **Items 4 and 7:** yes alone (one is an option, the other the existing clamp).
- **Item 6:** no.

## 6. Implied inputs missing from "Cases", each with its expected result

- **The security of the read.** A token can be minted for any file a server names. clangd names the target of `#include "<absolute path>"`, and pyright can name any file through a repository's `extraPaths`. Missing cases:
  - The engine's `config/local.yml`, `~/.oculus/*`, a dot path such as `~/.ssh/...`, or a `closed_paths` folder named by a server. Expected: the read refuses with a code. For `local.yml` this falls under G3, whose Code line ("the server modules that name it") would then include the new module, and G3's test lines are not in the write list.
  - A binary file named by a server. Expected: refused as not text.
- **Tokens across pages:** covered by case 6.
- **A socket reconnect without a reload,** a normal event under hot reload (`state/client/socket.svelte.ts:2-3`). The new socket is a new relay `Page` with no tokens, and `client.ts:272-275` sends didOpen again for the library model under its dead address. Expected: the open library tab shows the item 7 sentence, or the tokens survive the reconnect. One of the two must be decided.
- **A server restart or crash while a library tab is open.** Expected: the library document is opened again on the new server, and hover answers.
- **The root of the naming server stops being served (`root_gone`).** Expected: a read of its tokens is answered with a code. Today `#oculus` returns with no answer.
- **A root is added that now contains a token's real path.** Expected: unspecified. The same file could then be open as a library tab and as a writable root tab on one server.
- **Symlinked paths and two spellings** (`/var` and `/private/var`, which `uris.ts:12-13` says clangd answers). Expected: one token, because the token is keyed by real path.
  - Also: a symlink retargeted after the token was minted. Expected: refused, since "resolves the real path again" never says to compare against the stored path.
- **Windows-style paths:** not judged (see "Declined to judge").
- **A definition answered as a LocationLink.** Expected: a token is minted for `targetUri`, and the tab selects at `targetSelectionRange`'s start. The opener uses the range start at `hosts.ts:117-123`.
- **A library file in a language the file name does not give,** such as clangd's extensionless `vector`. Expected: the tab opens in the naming server's language (item 2 stores it), with highlighting and hover.
- **A library file no server serves,** such as a `.inc` header. Expected: it opens read-only in plain text, with no hover.
- **Two servers naming the same file** (two roots' pyright both name `os.py`). Item 2 keeps one root per token and case 12 gives one token. Expected: unspecified, so which server answers hover in the tab is undecided.
- **Find All References with a library location, and a saved References result after a reload** (`DESIGN.md:522`). Expected: the row opens a library tab; after a reload it shows the item 7 sentence.
- **A file name holding `%`.** Monaco decodes the address path once, which is why the root key is encoded twice (`kit/lsp/uris.ts:5-7`). Expected: the file name is encoded the same way, or a test row covers it.
- **A read whose `root` differs from its token's root, or arrives on the other language's channel.** Expected: refused.

## 7. ADRs

`ls docs/adr tools/oculus/docs/adr` prints "No such file or directory" for both. There is no ADR folder.

## 8. Dictated text

- **The G2 sentence.** `grep -n "A path outside the configured roots is refused, except" briefs/D23c.md` gives line 139: "A path outside the configured roots is refused, except a file a language server named in an answer to the page, which that page alone reads, through the `lsp` channel." Holds against `spec.md:20`: plain, ASCII, no dash, no negation contrast. The comma before "through" is stray but breaks no rule.
- **The address form.** `grep -n "oculus-lib" briefs/D23c.md` gives lines 39 and 135: `oculus-lib:///<token>/<file name>`. Holds.
- **The message shapes.** `grep -n "oculus: 'read'" briefs/D23c.md` gives line 42: `{ oculus: 'read', root, uri }` and `{ oculus: 'file', root, uri, text }` or `{ ..., code }`. Holds.
- **The restored-tab sentence.** `grep -n "no longer open" briefs/D23c.md` gives line 45. It gives content, not wording; the words come from the catalog. Holds. When the builder writes the catalog line, "no longer" is a word `spec.md` bans in comments and test titles only, not in catalog text.

## Other checks

**User-visible choices beyond Z669 (a) and Z670 (a):**
- **Raised in the brief as reversible decisions:** the address scheme and token (Decision 1), the token's lifetime (Decision 2), the References column (Decision 3), refusal above `TEXT_LIMIT` (Decision 4) and the G2 wording (Decision 5).
- **Taken without a decision line:**
  - The wire format of `read` and `file`, including the meaning of their `root` field (item 4 dictates it, but no Decision names it).
  - The refusal-code vocabulary, left to the builder.
- **Not decided at all:** the saved shape of a library tab. `SourceTabState` requires `root` and `path`, and a library tab has neither. Whatever key the builder adds becomes a saved-layout shape.

**Size and folder limits:**
- **Handled:** `server/machine/lsp/` at 10 items (a subfolder), `relay.ts` at 869 (split) and `Source.svelte` at 520 (extracted).
- **Not handled:**
  - `kit/lsp/transport.ts` at 897 lines must be split if the step changes it (the `spec.md` size rule).
  - `kit/lsp/` holds 9 items, so it takes one new file before reaching the limit, and the brief does not say so.
  - `views/sources/source/` holds 8 items and `tests/server/machine/lsp/` holds 7, so each has room for two and three new files respectively.

**Write-list coverage:**
- **Covered:** `client.ts`, `transport.ts`, `peeks.ts` and `services.ts` (the `kit/lsp/` folder), `ask-perform.ts` (the `views/sources/source/` folder) and `uris.test.ts` (the tests folder).
- **Missing:**
  - `src/lib/data/model/index.ts`, if a new type is exported.
  - `docs/views.md` "References" (line 69).
  - `DESIGN.md:522`.
  - `guarded.md` G3, if the read must refuse `local.yml`.
  - `tests/state/sessions/source.test.ts` (G28), named only through the generic line.
  - `state/system/machine/lsp/symbols.ts`, if the Outline row is to carry the symbol's end.
- **Not needed:** G29's tests under `tests/state/workbench/layout/saved/`. The saved-layout code there does not read a source tab's state (`grep -rn "source\|line" src/lib/state/workbench/layout/saved/*.ts` shows no such read), and the column is read in `Source.svelte`.

## Declined to judge

- **Case 15.** Whether `openView` points an open source tab at a new line. I did not read `state/workbench/layout/open/opening.ts` to its end. D23's landing look item 5 (`reviews/D23-landing.md:12`) says go to definition into another file holds except for the column.
- **Monaco's `readOnly` and rename.** Whether it disables rename and code actions in the library tab (item 7: "no write route is reachable"). That is library behaviour; checking it needs a run.
- **Windows-style paths.** I found no statement of whether oculus supports Windows (the folder picker uses osascript), so I cannot say whether they apply.

Agent usage: a81066bbccca96733, claude-opus-5-5, 188,115 tokens, 51 tool uses, 7.8 min.


## Closed

Each finding closed by a change to `agents/briefs/D23c.md`, before the preparation commit.

- Secrets: Part 1 item 3b (no token for a dot path, a `closed_paths` folder, the engine's `config/`, `~/.oculus`, the hub's `secrets`), item 4 (`binary` refused), case 12a; the G3 Code line handed over in the report (item 9).
- `file://` paths in `arguments` and `changes` (`uris.ts:277`, `:283`): "What is on the tree" states it; item 3 makes every field follow the token rule; case 12b.
- Case 2: `string` of `std::string` at `mirrors.cpp:47` (`grep -n "std::string" mirrors.cpp`).
- Verify 4 and the home folder: the temporary `HOME` holds `workspace/cathedra` and `workspace/game-engine` as symbolic links to the real folders.
- `guarded.md`: removed from the write list; item 9 has the report hand over the G2 and G3 lines, which the orchestrator writes at landing (`spec.md:35`).
- `transport.ts` at 897: "What is on the tree" states it; "Files and constraints" splits it below 880 first if the step changes it.
- `#didOpen` for a library address: item 5 opens the document on the naming server under its `file://` URI, and again after a server restart; case 12g.
- The extensionless header's language: item 6 takes the naming server's language from the token; case 2 checks C++ highlighting.
- Socket reconnect: item 7 and Decision 8; case 12g.
- The second selection path: `select?: boolean` removed (Part 2 item 4); the existing `select` request is used (Decision 6), the Outline selecting the symbol's `selectionRange` (item 5, `symbols.ts` in the write list).
- Premise line numbers: `uris.ts:20-21`, `:196`, `:253`; `hosts.ts:110-130`, `:131-138`, `:119-124`; `source-file.ts:16-28`; `model-processes.ts:196-202`; the base read at fb7f076f.
- Missing premises: the `select` request, `#reconnect`, `#didOpen`, the diagnostics forwarding, `languageOf`, `#oculus` with no answer, `isBinaryFile`, `closedPaths`, the References saved result, `index.ts`, the folder counts.
- Verify 5: the prose rule of `spec.md:20`, not rules the file does not have.
- The write list's line that was no path: replaced by `tests/state/sessions/source.test.ts` (G28); `index.ts`, `symbols.ts`, `docs/views.md:69` and `DESIGN.md:522` added; `commands.ts`, `types.ts` and `editor-status.svelte.ts` removed with the `goto` option.
- The read-only note of the landing look: item 7 now makes the note, from the catalog.
- Implied inputs: cases 12 to 12g (two servers, secrets and binary, the raw fields, wrong root or channel and an unserved root, a retargeted symlink and two spellings, a LocationLink, `%` in a name, reconnect and restart); item 3a keys a token by real path, root and language; item 4 refuses a retargeted symlink, a wrong root or channel, and answers an unserved root with a code.
- The saved shape of a library tab and the read's wire shape and refusal codes: Decisions 7 and 9.
- F8 into another file, not checked since D23's fix: case 19a and the landing look.
- Dictated lines added after the check, held: the message shapes and the refusal codes of Decision 9 (`grep -n "not_served" briefs/D23c.md`): code lines, ASCII, holds against `spec.md:20`.
- Declined to judge, case 15: left to the builder's first run, which reports it.
