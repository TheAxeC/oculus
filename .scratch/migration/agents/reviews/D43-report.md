D43 round 1: all fourteen rulings are built and verified in the worktree (`/Users/axelfaes/workspace/research-hub/.agents/worktrees/D43/tools/oculus`). NOT verified: anything that needs a page or a real texlab (listed under "Not verified" below); texlab is not installed on this machine and I started no app, server or browser. The full verify list ran 2 times; both are green and the second ran after my last edit.

**Open items of the state file** (`/Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md` lines 154-158 of the main checkout, read at write time with `sed -n 154,159p`)
```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

None.
```

**Defaults as shipped** (`config/behavior.yml:152-153`): `unimath_symbols: false`, `includegraphics_preview: true`.

## DONE / NOT DONE

| Ruling | State | Where (file:line after the last change) | Check that proves it |
|---|---|---|---|
| 1 Rerun and Restart ask again | done | server `pty/latex/latex.ts:288` (`approvalAsk`), `:307` (`latexAgain`); `runs/commands/run.ts:191` (rerun), `:213` (restart); mark carries `latex.recipe` and `latex.target` (`pty/sessions.ts:234-235`), written before `respawn-pane` (`pty/sessions.ts:691`); page `terminal/commands.svelte.ts:185,479,515,526,541`, `state/client/context.ts:635` (`askLatex: latex.holdAgain`), `latex.svelte.ts:598` (`holdAgain`), `builds.ts:642` (`holdRerun`) | route row 'asks again on Rerun and on Restart of a kept build whose latexmkrc changed since the approval, and respawns nothing' (`latex-approvals.test.ts:485`) fails on the tree before the change (`expected true to be undefined` at the `waiting.body.ok` assertion) and passes now; scratch page runs below |
| 2 `latex-changed` message kept | done | `latex.svelte.ts:573` (`sameAsk`), `:586` | scratch store run below |
| 3 `approvals-unwritable` names the file path | done | `latex.ts:355` | route row 'refuses to write over an approvals file that is not JSON, naming the file, and starts nothing (case 32)' (`latex-approvals.test.ts:469`) failed before (names held `"latex-approvals.json is not JSON: .../latex-approvals.json"`, expected `[".../latex-approvals.json"]`) and passes now |
| 4 Cancel drops a pressed approval | done | `builds.ts:221` (type), `:654` (`cancel`); `latex.svelte.ts:593-594` (`dismissApproval` calls `builds.cancel`) | scratch builds and store runs below |
| 5 clean before a retry holds the retry | done | `builds.ts:166` (`retry` field), `:457` (`cleanBeforeRetry`), `:678` (Approve runs the clean, then the build) | scratch builds run below |
| 6 warning tone for any entry of the followed root; press opens the longest-waiting main | done | `LatexItem.svelte:60` (`latex.waiting(...)` with the root's folder), `:79`, `:109`, `:133-137` | scratch builds run below; the drawn item is a look item |
| 7 smallest `waitingSince` | done | `builds.ts:160`, `:369` (set), `:683-695` (`waiting`) | scratch builds run below |
| 8 `completed` hook on `completionItem/resolve` | done | `transport.ts:154` (`#listed`), `:653`, `:657` | scratch transport run below |
| 9 head of `unimath.yml` | done | `config/catalogs/unimath.yml:1` names `readLatexUnimath` in `src/lib/data/sources/config/catalog/latex-tables.ts` and the findings in `.../catalog/latex-editing.ts` | `sed -n 1p config/catalogs/unimath.yml`; `config-folder.test.ts` in `npm run test:checks` passes |
| 10 pictures without `pdf` | done | `latex-pictures.ts:17` (imports `PICTURE_EXTENSIONS`), `:38-42` (`drawnAsImage`) | scratch pictures run below |
| 11 `latexmkrcSet` takes only files | done | `pty/latex/approval.ts:82-90` (`isFile`), `:100`, `:111` | scratch run below |
| 12 docs | done | `docs/views.md:275` (`includegraphics_preview` default true; `.png`, `.jpg` or `.jpeg`; texlab hover and extras paragraph); `docs/files-and-search.md:85` (texlab serves `.tex`, `.latex`, `.sty`, `.cls`, `.bib`) | `grep -n` of both lines; non-ASCII scan of docs printed nothing |
| 13 case 24 | done | quoted run below | scratch run below |
| 14 report | this message | | |

## Verification, with the commands

Full verify list runs: **2**.
- Run 1: `npm run diagrams` exit 0, then `sh /Users/axelfaes/.claude/skills/land/templates/checks.sh .../orchestrator-state.md` exit 0.
- Run 2 (after the last edit), `npm run diagrams` exit 0 (`docs/diagrams` unchanged against the round-0 tree), then `checks.sh` exit 0. Its lines:
```
test:quick: 106 changed file(s), from git since HEAD
ok      ASCII gate (0.6 s)
ok      prettier (1.5 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.2 s)
ok      svelte-check (25.4 s): 1791478120233 COMPLETED 435 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (27.1 s)
ok      vitest (38.1 s): Duration  34.21s (transform 41.23s, setup 0ms, import 81.78s, tests 48.92s, environment 304ms)
test:quick: 39.0 s (limit 45.0 s); every command passed
checks: 1 commands passed
```
- `npm run test:checks`: exit 0, `Test Files  17 passed (17)`, `Tests  240 passed | 8 skipped (248)`.
- `npx vitest run tests/routes/sessions/latex-approvals.test.ts tests/server/machine/approvals/approvals.test.ts`: `Test Files  2 passed (2)`, `Tests  23 passed (23)`.
- Per-file runs while working: servers 6, lifetime 26, relay 5, versions 2, choices 3, approvals 7, terminal-actions 20, latex-approvals 16, settings 60, config-cache 3, served-roots.client 6, config 31, config-folder 24 passed and 1 skipped.
- `sh utils/folder-check.sh`: exit 0.
- `sh utils/unused-exports.sh` against the base `unused-exports.txt`: header `Unused exports (247)` against base `(248)`; the only difference is that `src/lib/ui/controls/editor/kit/latex/latex.ts: PICTURE_EXTENSIONS` left the list because `latex-pictures.ts:17` now imports it.
- ASCII gate (the spec's perl over `src tests config`, `bin` does not exist in this tree): printed nothing. `LC_ALL=C grep -n '[^ -~]' DESIGN.md docs/*.md HELP.md README.md`: printed nothing.
- YAML: `yaml.safe_load` over the 9 changed `.yml` files: ok.
- Size: `wc -l` over every changed `.ts`/`.svelte` against 880 (source) and 520 (component): none over. Largest changed this round: `commands.svelte.ts` 873, `context.ts` 863, `transport.ts` 863, `builds.ts` 848; components `LatexItem.svelte` 140, `LatexAsk.svelte` 91.
- History words (`before`, `used to`, `no longer`, `still`, `always has been`, `always had`, `as before`, `previously`, `the step adds`, `after this package lands`) over the added comment lines and test titles: the remaining hits are ordering or current state ("before the page sees them", "before it starts", "a line still running", "the clean before a retry", "made before its first case"). The two that read as comparisons with an earlier state were reworded: `LatexItem.svelte:21` ("While no such tab has been active") and `latex.svelte.ts:585` ("which is the same question").

**Not covered by the green results:** `test:quick` does not run `tests/checks` (run separately above) or slow tests; nothing here ran with texlab installed or in a browser.

**Not verified** (page-only, left for the look on TEST with texlab installed): the drawn warning-tone status item and its tooltip, the ask dialog after Rerun and Restart, Monaco's own fuzzy matching for `\alph` (my filter below is a contiguous-substring approximation of it), and cases 1 (console read), 5, 12 (marker absence), 14 (Outline), 18 to 23, 25, 26 and 36 as in round 0.

## Quoted runs (scratch tests in a copy of the tree under the scratchpad, outside the worktree, not kept)

Before the change, two tests fail (`.../scratchpad/d43r1/pre-fail.txt`):
- case 32 route row: expected names `[".../latex-approvals.json"]`, received `"latex-approvals.json is not JSON: .../latex-approvals.json"`.
- Rerun row: `expected true to be undefined` at `waiting.body.ok` (the Rerun respawned instead of asking).
After the change both pass; `latex-approvals.test.ts` 16/16.

- Item 4 (builds): a pressed approval for `a` is true, false after Cancel; the automatic `b` stays true. Item 4 (store): open true and approval true, then both false after Cancel.
- Item 7: `waiting()` returns `first.tex`.
- Item 6: `waiting(folder m)` returns `first.tex`; `waiting(elsewhere)` returns `other.tex`; `waiting(none)` returns null. I read "root" as the served-root key plus the folder path.
- Item 5: after the failed build the calls are `["build:a.tex","clean:a.tex"]`, status failed, approval step `clean`; a later build that needs none leaves the clean approval; Approve calls `["clean:a.tex"]`; after the clean ends the calls are `["clean:a.tex","build:a.tex:force"]` and the approval is null.
- Item 1 (builds): `again` is called with `["ab12cd-shell", false]` and `["ab12cd-shell", true]`; `approveLatex` receives `{recipe:"latexmk"}`. Item 1 (store): `holdAgain` asks main `a.tex`, target `{"root":"hub","path":"m"}`, and `again` is called with `["ab12cd-shell",true]`. Item 1 (commands): `pressRerun` returns false; `askLatex` called with `false` then `true`; no notices.
- Item 2: for both a build and a clean, the message after Approve is refused with `latex-changed` is "The files changed since they were listed; they are listed again." and the list shows `v2`.
- Item 8: the hook is called twice with the same completion params (list, then resolve); the resolved item carries `documentation: "PICTURE"`.
- Item 10: `a.png`, `b.jpg`, `c.jpeg`, `f.PNG` documented; `d.pdf`, `e.eps` not. A single resolved png item gets markdown documentation; a pdf gets none.
- Item 11: `{"folder":[],"file":["/file/.latexmkrc"],"link":["/link/.latexmkrc"],"dirlink":[],"broken":{"unread":"/broken/.latexmkrc"}}` (a folder is not in the set, a file and a link to a file are, a broken link is unread).
- Item 13 (case 24): with `unimath_symbols: true`, the commands containing "alph" number 6, including `{"label":"mitalpha","insert":"\\mitalpha","detail":"𝛼"}` and `{"label":"upalpha","insert":"\\upalpha","detail":"α"}`; there is no `alpha` row. With the option false: 0 items.

## Before and after of each changed assertion and allow list (base `D43-base` against now, by `diff`)

| File | Before | After |
|---|---|---|
| `tests/checks/config/config.test.ts:446,457,463` | key list without the three | adds `'latex.includegraphics_preview'`, `'latex.texlab_path'`, `'latex.unimath_symbols'` |
| `tests/checks/config/config-folder.test.ts:163` | catalogs map without the file | adds `'catalogs/unimath.yml': ['latex_unimath']` |
| `tests/checks/source/keys.test.ts:229-234` (`COMPUTED_PREFIXES`, declared at `:161`) | no reader for the install word | adds the entry `file: 'lib/shell/status/LanguageItems.svelte'`, `start: 't(facts.words.install'`, `keys: LSP_SERVER_LIST.flatMap((server) => server.words.install ?? [])` |
| `tests/data/sources/config/settings.test.ts:85-87, 344-347, 405-408` | no texlab or option fields | adds `latex.texlab_path: '/a/texlab'`, `latex.unimath_symbols: true`, `latex.includegraphics_preview: false`; result fields `texlabPath: '/a/texlab'`, `unimathSymbols: true`, `includegraphicsPreview: false`; wrong-type rows `['texlab_path', 3, 'text', ...]`, `['unimath_symbols', 'yes', 'boolean', ...]`, `['includegraphics_preview', 'yes', 'boolean', ...]` |
| `tests/data/sources/config/wrong-settings.ts:29-31` | no three | adds `texlab_path: 3`, `unimath_symbols: 'yes'`, `includegraphics_preview: 'yes'` |
| `tests/server/machine/lsp/choices.test.ts:31` | options `{ root, lsp, approvals }` | adds `env: {}` |
| `tests/routes/sessions/terminal-actions.test.ts` (this round) | expected mark `latex: { step: 'build', main: 'main.tex' }` | `latex: { step: 'build', main: 'main.tex', recipe: 'latexmk', target: { id: 'alpha' } }`, the contract change of ruling 1 |
| `tests/routes/sessions/latex-approvals.test.ts` (this round) | 14 rows | 16 rows: adds lines 469 and 485 |

## Renames and moves (grep over `src tests utils DESIGN.md docs README.md HELP.md config`, `--exclude=local.yml`)

Command: `grep -rn "isMachineFile\|isRefusedFile\|RelayOptions\|relay-options\|LATEX_LANGUAGE" ...`. Output:
```
src/lib/server/machine/lsp/servers.ts:41:import { isMachineFile, isPrivateFile } from './adapters/yaml/machine-file.ts';
src/lib/server/machine/lsp/servers.ts:596:        refuses: (real, roots) => isMachineFile(real, roots) || isPrivateFile(real, roots),
src/lib/server/machine/lsp/relay-options.ts:17:export type RelayOptions = {
src/lib/server/machine/lsp/relay.ts:59:import type { RelayOptions } from './relay-options.ts';
src/lib/server/machine/lsp/relay.ts:99:    #options: RelayOptions;
src/lib/server/machine/lsp/relay.ts:117:    constructor(options: RelayOptions) {
src/lib/server/machine/lsp/relay.ts:850:export function createRelay(options: RelayOptions): Relay {
src/lib/server/machine/lsp/adapters/yaml/machine-file.ts:28:export function isMachineFile(real: string, roots: readonly ServedRoot[]): boolean {
src/lib/server/root/context.ts:77:import type { RelayOptions } from '../machine/lsp/relay-options.ts';
src/lib/server/root/context.ts:150:    createRelay: (options: RelayOptions) => Relay;
src/lib/data/prose/latex.ts:33:const LATEX_LANGUAGES: readonly string[] = ['latex', 'bibtex'];
src/lib/data/prose/latex.ts:37:    return LATEX_LANGUAGES.includes(language);
src/lib/views/sources/source/language/lsp.ts:135:function isRefusedFile(
src/lib/views/sources/source/language/lsp.ts:389:        if (isRefusedFile(input.client, language, file)) return undefined;
src/lib/views/sources/source/language/lsp.ts:432:            !isRefusedFile(input.client, language, file)
```
Reading it: the page function is `isRefusedFile` (`lsp.ts:135`); the base's page function `isMachineFile` (`lsp.ts:128` in the base) is gone. `isMachineFile` in `adapters/yaml/machine-file.ts:28` is the server function that was already there in the base and is a different function (it answers for the machine's own `local.yml`); I left it. `RelayOptions` lives in `relay-options.ts:17` and is imported from there. `LATEX_LANGUAGE` (singular, `latex-tab.svelte.ts:77` in the base) has no hit; `LATEX_LANGUAGES` in `prose/latex.ts` is a different identifier.

## Head comments and guide paragraphs the brief names

| Text | State |
|---|---|
| `src/lib/server/machine/lsp/servers.ts:1-27` | still true (six entries counted from `LspServerId`, `lsp-servers.ts:16`; texlab PATH sentence read against the code) |
| `src/lib/server/machine/approvals/approvals.ts:1-25` (five kinds of key, `latexmkrc:` and the `command:` weave key) | still true |
| `src/lib/data/prose/languages.ts:1-34` ("thirty-three names") | still true: `REGISTERED` (`languages.ts:79-113`) holds 33 names, counted |
| `src/lib/views/sources/files/sections/Outline.svelte:2-26` | still true |
| `src/lib/views/sources/source/language/latex-editor.ts:1-11` | still true |
| `src/lib/shell/status/LatexItem.svelte:2-22` | rewritten (warning tone for any entry of the followed root's folder, longest-waiting main) |
| `src/lib/shell/commands/LatexAsk.svelte` head | rewritten (pressed, Rerun, automatic steps; Cancel semantics; message kept until the reader acts) |
| `src/lib/state/sessions/latex/builds.ts:1-44` | extended (Cancel, rerun hold, retry hold) |
| `src/lib/ui/controls/editor/kit/lsp/transport.ts:1-55` and `TransportHost.completed` doc (`:128`) | extended (resolve answers run the hook) |
| `src/lib/server/machine/pty/latex/latex.ts:1-32` | extended (Rerun and Restart) |
| `src/lib/server/machine/pty/latex/approval.ts:1-20` (ruling 11: "head comment stays true") | still true |
| `src/lib/ui/controls/editor/kit/latex/latex-pictures.ts:1-` | rewritten (`PICTURE_EXTENSIONS` other than `pdf`, a single resolved item) |
| `config/catalogs/unimath.yml:1` | rewritten (ruling 9) |
| `DESIGN.md:23, 166, 411, 575` | still true |
| `DESIGN.md:537` (`latexAgain`), `:539` (`.png`, `.jpg` or `.jpeg`), `:572` (status item) | rewritten |
| `docs/views.md:265-275` | rewritten (defaults, picture types, Rerun/Restart asking again, Cancel, clean-before-retry hold, texlab hover and extras) |
| `docs/files-and-search.md:17, 85` | `:85` rewritten (texlab file types); `:17` still true |
| `docs/window.md` status item, `docs/terminals.md` Rerun and Restart sentence | rewritten |
| `README.md:15`, `HELP.md:68-75, 117` | still true |

## Files changed this round (lines now; against the round-0 tree by `diff -rq`)
- Server: `pty/latex/latex.ts` 439, `pty/latex/approval.ts` 225, `pty/sessions.ts` 812, `runs/commands/run.ts` 230.
- Shared types: `data/model/model-machine.ts` 635, `data/model/index.ts` 644.
- State and shell: `state/sessions/latex/builds.ts` 848, `latex.svelte.ts` 687, `state/sessions/terminal/commands.svelte.ts` 873, `terminal-payloads.ts` 81, `state/client/context.ts` 863, `shell/commands/LatexAsk.svelte` 91, `shell/status/LatexItem.svelte` 140.
- Editor: `kit/lsp/transport.ts` 863, `kit/latex/latex-pictures.ts` 132.
- Config and docs: `config/catalogs/unimath.yml` 2417, `DESIGN.md` 579, `docs/views.md` 277, `docs/files-and-search.md` 109, `docs/window.md` 82, `docs/terminals.md` 69.
- Tests: `tests/routes/sessions/latex-approvals.test.ts` 531, `terminal-actions.test.ts` 528.
- Files from round 0 are unchanged this round and keep the counts of the round-0 report.

## First run of every case on the unchanged tree (scratch, round 0, still the record)

| Case | First run on the unchanged tree |
|---|---|
| 1 | Relay answers a hover after the root left with `error -32602 "the document is not open"`; the transport delivers that error, not null; a request after `root_gone` is forwarded (1 sent) |
| 2 | `REQUEST_CANCELLED` delivered as `result:null` |
| 3 | After the root is served again the relay sends `starting`, a hover reaches the new child (counts `[0,1,1]`, 3 spawns) |
| 4 | Two roots, one removed: the other root's child gets the hover (counts `[0,1]`) |
| 5 | Entries `pyright,clangd,typescript,svelte,yaml`; `forLanguage('latex')` undefined |
| 6-8a, 10-14, 16, 16a | no texlab entry: `forId('texlab')` throws "no language server entry texlab" |
| 9 | `latexBuild` keys end `...,texcountAutorun,contextMenu`; no `texlab_path`, no problem |
| 15 | by reading: `held/documents.ts:31-33` `openingTarget` returns null when `resolvePageUri(uri, roots)` is null, and `relay.ts:591` returns before any server is made; D43 touches neither |
| 17 | a python server delivers `["texlab","latex","ChkTeX"]` unfiltered |
| 18-23, 25-26, 36 | page only; no code exists on the unchanged tree |
| 24a | `unimathsymbols.json` has 2415 entries; `config/catalogs/unimath.yml` does not exist |
| 27, 28 | Build and clean both answer 200 and start 1 terminal, with or without a `.latexmkrc` |
| 29-31 | `approve-latex` answers 400 `not-an-action` |
| 32, 40 | `approveLatex` and `latexmkrcKey` undefined |
| 33-35, 38, 39 | the code does not exist |
| 37 | a `.Rnw` build answers 200 and starts 1 terminal |

## Doc text for `agents/guarded.md`
**G55** (replaces the current text):
```
- G55. A language server, a LaTeX build's latexmk step and a weave tool run no code of a repository (its config files, its packages, its interpreter, its latexmkrc, its woven chunks) before the processes approval of that code, and a Rerun or Restart of a LaTeX build or clean asks again when its approval no longer holds.
  Code: `src/lib/server/machine/lsp/adapters/web/svelte-adapter.ts`, `src/lib/server/machine/lsp/adapters/web/typescript-adapter.ts`, `src/lib/server/machine/lsp/adapters/web/approval.ts`, `src/lib/server/machine/lsp/adapters/web/config-files.ts`, `src/lib/server/machine/lsp/adapters/texlab/links.ts`, `src/lib/server/machine/pty/latex/approval.ts`, `src/lib/server/machine/pty/latex/latex.ts` (`latexAgain`), `src/lib/server/machine/runs/commands/run.ts`, `src/lib/server/machine/pty/routes.ts` (the `approve-latex` action) and `src/lib/server/machine/approvals/approvals.ts`.
  Test: the current Svelte lines unchanged (`tests/server/machine/lsp/svelte-trust.test.ts`, tagged slow); `tests/server/machine/lsp/servers.test.ts`, 'links latex and kpsewhich to the programs its PATH finds, tectonic only when found, never latexmk, and drops a link whose program is gone'; `tests/routes/sessions/latex-approvals.test.ts`, describe 'POST /api/terminal, the approvals of a latex step', one `it` per row: 'starts a build and a clean at once when no latexmkrc is read (case 27)', 'answers what a .latexmkrc beside the main asks for, for a build and for a clean (case 28)', 'writes the approval under latexmkrc:<hex>, and the next build starts (case 29)', 'asks again when the file changed after the approval (case 30)', 'refuses an approval of texts whose files changed meanwhile and writes nothing (case 31)', 'refuses an approval for a file that is not a main of the folder', 'reads ~/.config/latexmk/latexmkrc without XDG_CONFIG_HOME and $XDG_CONFIG_HOME/latexmk/latexmkrc with it (case 33)', 'hashes a latexmkrc that is a link by the bytes it leads to and lists it by its own path (case 34)', 'refuses a step whose latexmkrc cannot be read, naming the file (case 34)', 'asks no latexmkrc approval for a recipe with no latexmk step, a checkcites or a stop (case 35)', 'asks once for a weave recipe per repository, folder and tools, and again for a changed tool (case 37)', 'asks for a recipe tool that runs a program of its own, and for none of the TeX recipes (case 37)', 'lists a weave recipe and an unapproved latexmkrc in one ask, and one approval writes both (case 38)', 'asks both of two pages that press Build at once, and two approvals of one text write one entry (case 39)', 'refuses to write over an approvals file that is not JSON, naming the file, and starts nothing (case 32)', 'asks again on Rerun and on Restart of a kept build whose latexmkrc changed since the approval, and respawns nothing'; `tests/server/machine/approvals/approvals.test.ts`, describe 'the latexmkrc and weave approvals of a LaTeX step': 'keys a latexmkrc set under latexmkrc: and the SHA-256 of its text', 'keeps the weave text apart from a chain and a debug launch under command:', 'writes both entries once, however many times the same texts are approved'.
```
**G36** (replaces the current text; Code and Test lines kept, one Test title added):
```
- G36. A language server oculus started ends: 60 s after the last tab of its root and language closed on a page, or the page closed, when no tab or page took it over; at once when its root is no longer served; and with the oculus server. None is started twice for one page and root: one pyright serves a page's Python tabs of a root, one clangd its C and C++ tabs, one TypeScript server its TypeScript and JavaScript tabs, one Svelte server its Svelte tabs, one yaml-language-server its YAML tabs (a `.yml` and a `.yaml` tab of one root share it) and one texlab its LaTeX and BibTeX tabs (a `.tex` and a `.bib` tab of one root share it).
  Code: `src/lib/server/machine/lsp/held/process.ts`, `src/lib/server/machine/lsp/relay.ts`.
  Test: `tests/server/machine/lsp/lifetime.test.ts`, describe 'the life of a language server', the current rows and 'is one texlab for a tex tab and a bib tab of one root on one page, which ends 60 s after the last closed'.
```
Titles added under other entries: G7 `servers.test.ts` 'starts texlab by its absolute path with no arguments, the root one working folder whatever it holds, and the links folder as its whole PATH'; G13 `settings.test.ts`, the `texlab_path`, `unimath_symbols` and `includegraphics_preview` rows of 'latexBuild'; G31 `approvals.test.ts:111` 'refuses to write over an approvals file that is not JSON and leaves it (case 32)' and `:121` 'writes neither entry when the file cannot be written, and names the reason (case 40)'.

## Judgment calls
- **Case 32 name check as a route row.** The approvals unit row cannot see the name, because the route chooses it; the check is the route row at `latex-approvals.test.ts:469`.
- **Terminals started by an earlier shipped version.** They carry `source: 'latex'` but no `latex.target`, so `latexAgain` returns null for them and their Rerun is not gated. Terminals started by this build always carry the target. This is a gap for old marks only.
- **Ruling 6 "root".** Read as the same served-root key and folder path, so every main of the followed root's folder counts.
- **`respawnTerminal` writes the mark** (`sessions.ts:691`, a `set-option` before `respawn-pane` when a task is passed), so the mark names the recipe the pane now runs; a Rerun then recomputes the ask from the mark, not from a stored decision.
- **`terminal-actions.test.ts` mark expectation** changed to the new mark shape (table above); it is a contract change, not a loosened check.
- **`LatexStore.approve()`** accepts a reopened ask for the same target and main, so the `latex-changed` message survives (`latex.svelte.ts:573-586`).
- **Round-0 judgment calls stand** (approve-latex body with `step`, `recipe`, `last`; the approval rows in `latex-approvals.test.ts`; the others in the round-0 report). Not sent, accepted as built.

## Reader-visible before and after
- Rerun or Restart of a LaTeX build or clean whose approval no longer holds: before, it respawned and ran; now it opens the ask and starts nothing, and Approve runs that terminal again.
- Cancel on a pressed ask drops the approval; on an automatic step the approval stays.
- After a changed file the ask shows "The files changed since they were listed; they are listed again." and keeps it until the reader acts.
- A failed build whose retry needs a clean approval holds the retry; Approve runs the clean, then the build.
- The status item is in the warning tone for any waiting main of the followed root's folder; a press opens the longest-waiting main.
- A non-JSON approvals file answers 409 `approvals-unwritable` naming the file path.
- Picture preview covers `.png`, `.jpg` and `.jpeg`, never `.pdf`; it also applies to a single resolved item.
- Defaults: `latex.unimath_symbols` false, `latex.includegraphics_preview` true.

## Constraint slips (all disclosed, no residue)
- Round 0: a whole-suite run that started the Electron harness created `build-app/` and `.svelte-kit-app/`; the processes were killed and both folders removed.
- Round 0: two read-only git commands, `git -C . status | head -0` and `git diff --stat -- DESIGN.md docs README.md HELP.md`.
- Round 0: a scratch link under `tests/` (`tests/zz-scratch`), removed.
- Round 1: I killed and restarted my own verify chain once to apply doc edits.
- Round 1: one stray `git -C /nonexistent` appended to a shell line; it failed on the missing directory and read nothing.
- `checks.sh` reads git itself ("106 changed file(s), from git since HEAD"); that is the script.
- Residue check: `ls -a` of the worktree root shows `.git .gitignore AGENTS.md CLAUDE.md CONTEXT.md README.md skills-lock.json tools`; `find . -name 'zz*'` under `tools/oculus` prints nothing; `ps aux | grep -E "worktrees/D43|d43r1"` prints nothing.

## Wrong or impossible in the brief
- Ruling 14 lists `choices.test.ts` under `tests/server/machine/approvals/`; the file is `tests/server/machine/lsp/choices.test.ts`.
- Ruling 14 names `COMPUTED_PREFIXES` in `keys.test.ts` as changed with a new row; the row is the `t(facts.words.install` entry (`keys.test.ts:229-234`) inside that array.
- The `isMachineFile` to `isRefusedFile` rename concerns the page function in `lsp.ts`; the server's `isMachineFile` is a different function and remains.
- Case 24 as written in round 0 (`\alph` offering `\alpha`) is impossible: the data has no `alpha` row, only `upalpha` and `mitalpha` and their kin.

## Next
The orchestrator installs texlab (`brew install texlab`); the look on TEST then covers the page-only cases above, the ask dialog after Rerun and Restart, and the warning-tone status item.
