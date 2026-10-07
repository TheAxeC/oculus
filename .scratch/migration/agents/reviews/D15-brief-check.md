# Step D15 brief check (on main at d5d7f727b)

`git rev-parse HEAD` printed `d5d7f727b6f84f936fa2b4310856a834269fc132`. I changed no file and started no server. Every judgment below comes from reading code. Nothing was run in a browser.

The most serious findings come first.
- (a) Verify 7 is neither workable nor isolated. No browser tool exists. The PDF it names is outside every served root. At start the scratch server launches Claude Code in Axel's own tmux server.
- (b) Items 5 and 6 move Z700's looks "on TEST" onto that builder check, which cannot reach them.
- (c) Item 2's open rule ignores the saved place whenever the key is unchanged and no document is held. That happens on a reload during a build and after a Clean. The place is then lost and overwritten with page 1.
- (d) Item 4's "the tab's record when it names this file" cannot be built, because `PdfPlace` carries no file.
- (e) Case 16's count contradicts items 1 and 4, and no route can run it.
- (f) State may not import views, so the reader cannot use the viewer's types.

## 1. Names

Command: `grep -rn "PdfPlace\|pdf-place" <hub> -l | grep -v node_modules`. Output: only `tools/oculus/.scratch/migration/agents/briefs/D15.md`.

Command: `grep -n "placed" File.svelte viewer.svelte.ts`. Output: nothing (rc=1). Across `src`, `placed` occurs only as unrelated locals and comment words (`ui/controls/editor/Editor.svelte:188`, `DiffEditor.svelte:162`, `ui/tree/tree-keys.ts:139`). None of these is affected.

Callers of `open`: `grep -rn "PdfViewer\|pdf/viewer" src tests` finds `Controls.svelte:20,23` (types only) and `File.svelte:78,220,241,267`. The viewer's own `reload()` at `viewer.svelte.ts:222` calls `open(this.#url, this.#key)`. All are in the write list. No test imports the viewer.

Hits outside the write list that the change makes false or leaves incomplete:
- **`src/lib/state/workbench/ui.svelte.ts:1-4`** (head comment) says "one blob of state per view instance, keyed by the instance id the layout gives it". `:105` says "One entry per view instance, by instance id." The record `pdf-place` is keyed by no instance. `grep -rn "setInstanceState('" src` prints nothing, so it would be the first such record. Both sentences become false, and the file is not in the write list.
- **`DESIGN.md:169`**: "`ui` holds theme and per-view-instance state such as selection and filters". This becomes incomplete, since a per-file record is not per-view-instance state. Not in the write list.
- **`docs/views.md:259`** is the PDF paragraph that says what the viewer keeps ("a pane added or a page switched away and back leaves its page, zoom and scroll as they were"). It is not made false, but it is where a reader looks for the fact. The brief writes `:239` (the long list of opened views) and `DESIGN.md:533` (the "LaTeX builds" bullet) instead.
- **Inside the write list, not named by the brief:**
  - The head comment `viewer.svelte.ts:9-12` says "a call with another key starts at the first page at the zoom the reader chose". Item 2 makes this false.
  - The head comment `file-type.ts:1-2` says "What a file's name says about it". Adding a saved-record reader makes it incomplete.
  - The spec's rule covers both, but neither is listed in "What is on the tree" for a still-true-or-rewritten check. D45's brief asked for that check in its report shape. D15's report shape does not.
- **`src/lib/state/sources/fs.ts:22-34`** re-exports `file-type.ts`'s members, and `File.svelte:83` imports through `$lib/state/sources/fs`. A new export would need either `fs.ts` (not in the write list) or a direct import. Not decided.
- **Types across layers.** `ScrollName` and `SpreadName` (`viewer.svelte.ts:76-80`) and `SidePanelKind` (`side-panel.ts:19`) live in the views layer. `tests/checks/tree/boundaries.test.ts:205-240` lets the state row import only `state/**` and listed `data/**` modules, never `views/**`. So the zod schema in `state/sources/explorer/file-type.ts` cannot import them. It must either redefine the three unions (a DRY finding) or move them into state and have the views import them. Moving them changes `side-panel.ts`, which is not in the write list. The brief says neither.

## 2. The step line

Command: `grep -n "^- D15 " plan.md` gives `:530`. Its sub-lines are `:531` (Z289's widening) and `:532` (the premise recheck).

- **Mapped:**
  - "the place ... (page, offset, zoom, scroll and spread modes, side panel)" maps to items 1 to 3.
  - "kept per tab and per file in the ui store" maps to item 4.
  - "on D45's PDF.js viewer" maps to items 1 and 2.
  - "the PDF beside the source, `pdfjs-dist` and SyncTeX are built in D45" is out of scope; cases 6 and 15 keep it.
  - Z700 (1) to (3) map to items 1 and 4.
  - M4-1 and M4-2 (`owed-looks.md:151-152`, verified with `sed -n 151,153p`) map to item 5.
  - M4-3 (`:153`) maps to item 6.
  - The recheck's "a reload, a new window or a reopen starts at page 1" maps to cases 1 to 3.
- **Part with no requirement.** Z700 (`plan.md:1481`) says the equation card is looked at "on TEST" and that M4-3 "is looked at on TEST first ... closed by that look". The brief's summary at `D15.md:17` drops "on TEST". Items 5 and 6 (`:50-51`) assign both looks to "the worktree's own browser check, item 7 of Verify" instead. No item puts the TEST look before the build, which is what the ruling's mechanism requires.

## 3. Premises

Commands: `wc -l` on the seven files; `grep -n` and `sed -n` on each cited line; `git ls-tree --name-only HEAD <dir> | wc -l`; `grep -c ViewHistory node_modules/pdfjs-dist/web/pdf_viewer.mjs`; `node_modules/pdfjs-dist/package.json:3,14`; `package.json:92,110`.

These hold:
- **`viewer.svelte.ts`:** 625 lines, with the cited lines at `:90-95`, `:109-127`, `:51-71`, `:216`, `:155`, `:156`, `:328`, `:376-390`, `:498-511`, `:519-528` and `:584-594`.
- **`File.svelte`:** 416 lines, with `:113-115`, `:146`, `:240-262`, `:264-268` and `:290-296`. The instance-state grep printed nothing (rc=1).
- **`ui.svelte.ts`:** `:18`, `:34`, `:160`, `:187`, `:192`, `:325` and `:414`.
- **Where ui records are cleared and copied:** clears at `instances.ts:234,292,319` and `opening.ts:168,254`; the copy at `float/store.ts:108-110`.
- **The Present pattern:** `Present.svelte:113`, `:126` and `:190`, and `present.ts:80`.
- **Folder counts:** explorer 8, sources 10.
- **Other files:** `Equation.svelte` is 68 lines with `var(--card)`, `overflow-x: auto` and no text colour. `Document.svelte` is 222 lines with kind `document` at `:170`. `tab-frames.svelte.ts:11-14`, `ui.yml:56,60`, `DESIGN.md:163,169,533` and `docs/views.md:239` all read as quoted.
- **Rules and libraries:** the guarded grep for "pdf" printed nothing (rc=1). `spec.md:57` reads as quoted. pdfjs-dist is 6.4.299 under Apache-2.0, the `ViewHistory` count is 0, and zod is 4.6.5.

Does not hold as worded: "`file-type.ts` builds a file view's state (`markdownPreviewState` :80)". `markdownPreviewState` builds a Markdown preview tab's state. The `file` view's state is `fileTabState` at `state/workbench/navigation/pages.ts:511`. Decision 3 rests on this premise.

Missing from the tree section:
- the layer rule above;
- `fs.ts`'s re-export;
- PDF.js dispatching `scalechanging` synchronously from the `currentScaleValue` setter (`node_modules/pdfjs-dist/web/pdf_viewer.mjs:8933`) and `scrollmodechanged` (`:9376`). Both fire inside `#initialised` before `#scrollTo(keep)` runs.

## 4. Cases and checks

**Verify 7 is not workable, and not safe as written.** Each point was read from source, not run.
- **Port: safe.** `vite.config.ts:111-115` takes `server.port` from `loadLocal(engineDir()).port` with `strictPort: true`, and the CLI's `--port 8796` overrides it. Worktrees carry no `local.yml`: it is ignored by `tools/oculus/.gitignore:6`, and `ls -d .agents/worktrees/*/tools/oculus/config/local.yml` found no match. So `loadLocal` returns defaults: hub is the worktree root and port is 8790 (`local.ts:144,195-196`). The server context holds 8790 (`context.ts:368`) while it listens on 8796. It moves only when `local.yml` changes (`context.ts:845-847`), so it never binds 8790. `PORT=8796` is read by nothing (`config.ts` head: "Nothing here reads the environment").
- **HOME: partly safe.** `os.homedir()` follows `HOME`, so `~/.oculus` and `~/.claude` resolve to the scratch folder.
- **Not isolated: tmux and Claude.**
  - At context start, `watchUsageRefresh` runs `refreshAll()` at once (`usage/refresh.ts:319-320`). It does this for the default account `{tool: 'claude', label: 'claude'}` (`local.ts:199`).
  - The refresh starts Claude Code in tmux session `oculus-usage-claude` (`refresh.ts:69-70,73-96`) on the default tmux server (`pty/tmux.ts:46`, no `-S` unless configured).
  - Because the account dir is the default one, the command is `env -u CLAUDE_CONFIG_DIR claude ...` inside tmux's environment. That is Axel's real HOME and real account. Its stop is `kill-session -t oculus-usage-claude` (`refresh.ts:195-197`).
  - If Axel's running oculus refreshes an account labelled `claude` (not verified, since `local.yml` was not read), the two servers share and kill one session name.
  - The scratch server also lists every `oculus-*` terminal of Axel's tmux server as its own (`sessions.ts:4,36`).
- **The PDF is unreachable.** Served roots are the hub (the worktree root) plus `~/.oculus/workspaces.json` (`server/files/fs.ts:182-184`), which is empty in a scratch HOME. A PDF copied into the scratch HOME is outside every root, and `api/file` refuses it (G2). The brief does not say to add a root.
- **No browser.** `ls tests/tiers` prints `essential.txt landing.mjs quick.mjs run.mjs`. `package.json` and `node_modules` have no playwright, puppeteer or chromium, and `spec.md` says "there is no browser suite". Verify 7 therefore starts a server that nothing opens.
- **PATH.** Verify 1 builds `PATH=$HOME/.nvm/...`. Under a scratch HOME that path does not exist.

**Consequences for the cases.**
- **No case runs on the unchanged tree.** "The builder's first task ... the first run of every case on the unchanged tree" cannot be done for cases 1 to 8, 11 to 18 and 20.
- **Two lists of browser cases disagree.** `D15.md:80` names cases 3 to 5 and 7. Verify 7 (`:137`) names cases 1 to 5, 7 and 12 to 15.
- **Cases with no route at all.** Cases 6, 8, 11, 16, 17, 18 and 20 are on neither list. The builder cannot reach them, and the orchestrator's look list does not include them.
- **The scratch route for cases 9, 10 and 19 does not work as written.** In plain node, `file-type.ts` imports `state/shared/words/text.ts`, which imports `generation.svelte.ts`. That file holds a module-level `$state(...)` at `:23`, which plain node cannot evaluate. Under vitest, the config only collects `tests/**/*.test.ts` (`vite.config.ts`, the project `include`), so a file under `$TMPDIR` is not collected. The "list function" is also given no file in "What to build". If it lives in `File.svelte`, no scratch run can import it.

**Cases inconsistent with the rules or the code.**
- **Case 16.** Item 4 writes two records per report (the tab's record and `pdf-place`), each a separate `setInstanceState` call, and item 1 allows one report per 500 ms. That is up to 4 calls a second, not "at most twice a second". The count also needs a browser run.
- **Case 12.** "Open in New Tab" activates the existing tab. The way 'tab' calls `openView('file', fileTabState(file))` (`File.svelte:311`). `stateId` is `[root, path]` (`instance.ts:137-138`), and `opening.ts:140-146` and `:222` activate the tab already open. Split moves rather than copies (`instances.ts:360-379`). Two tabs of one PDF come from a second rail page or from Copy into New Window.
- **Case 17** asks for G29's layout load, code the step does not change. The step's own input is a `oculus.ui.v1` with no `pdf` key and no `pdf-place` record.
- **Verify 4** uses the `grep '[^ -~]'` form. `spec.md` says the perl gate replaces it wherever a brief names it.
- **Verify 6.** "each named once where it is defined" cannot hold. `placed` will appear in `ViewerHooks`, at each call in the viewer and in `File.svelte`'s hooks.
- **Missing worktree, base copy and baseline.** The brief names no worktree path, no base copy and no `unused-exports.txt` baseline. `spec.md` ("Where you work", and the unused-exports rule) relies on all three, and `D45.md:39,435` names them.
- **Read range.** "Read" item 3 (`D15.md:113`) gives `ui.svelte.ts:150-200,320-340,400-500`. This misses `mergedInstances` and `save` (`:482-531`) and `setInstanceState` and `clearInstanceState` (`:609-640`), which the per-file record depends on.
- **Items 5 and 6.** Both ask for a look the builder cannot take. The looks are of code on main that the step does not change unless the look finds a defect, so the orchestrator could take them on TEST before dispatch, as Z700 says.

## 5. The question

- **Item 1: yes, it could pass without the goal.** Status is set to `ready` in `#load` before `pagesinit`. `#initialised` sets `currentScaleValue`, and PDF.js dispatches `scalechanging` at that moment (`pdf_viewer.mjs:8933`) with page 1, before `#scrollTo(keep)`. A leading throttled report writes page 1 over both records. A reload or close within the next 500 ms keeps page 1. "The box is drawn" is not defined as a check.
- **Item 2: yes.** `open` keeps the in-memory place only when `key === this.#key && this.#doc !== null` (`viewer.svelte.ts:217`). Take a reload during a build: the first load is missing or invalid, so `#doc` stays null, or `#drop` sets it null (`:448-456`). The next open has the same key, so `saved` is ignored, the PDF opens at page 1, and item 1 writes page 1 over the saved place. A Clean followed by a build in one session takes the same path. The rule should prefer the in-memory place only while a document is held, and otherwise use `saved`.
- **Item 3: partly.** The `PdfPlace` schema is specified, but the `pdf-place` list's reader is not. A malformed list may be read as a whole or dropped as a whole.
- **Item 4: yes.** "the tab's record when it names this file" needs the file inside the record, but `PdfPlace` holds none. Read literally, the rule never matches. If root and path are added, a rename breaks it: `ops.svelte.ts:350-365` (`followTabs`) rewrites the tab's layout state, not its `pdf` record.
- **Items 5 and 6: yes.** Each can close with a report line saying the look could not be reached, so M4-1 to M4-3 stay unmet.
- **Item 7: yes.** Both lines can be written while `ui.svelte.ts:1-4` and `DESIGN.md:169` stay false.
- **Case 1: no.** A reload needs the stored record. Its only route is the orchestrator's look.
- **Cases 2, 3, 4, 11, 13, 14, 15 and 20: no.** Each needs the place to be restored from storage. Case 3 can pass only if the place had been flushed before Open in New Window; see section 6 (e).
- **Case 6:** a regression check for D45. It does not test the goal.
- **Cases 9, 10 and 19: yes.** They test the reader in isolation, which can pass while `File.svelte` reads `held.pdf` without it. A reading of `File.svelte` is also needed.
- **Case 12: yes, vacuously.** Its route makes one tab only.
- **Case 16:** contradicts items 1 and 4, as section 4 explains.
- **Cases 17 and 18:** non-goal regressions.
- **The step line:** names no check of its own. Its gate is these cases.

## 6. Implied inputs

Each item below is missing from "Cases"; the expected result follows each.
- **(a) Two oculus pages write `pdf-place` at once.** This happens with the main page and a float window, or two browser tabs, for example both reloading after one build. `mergedInstances` merges by record id (`ui.svelte.ts:489-503`), so one page's whole 50-entry list replaces the other's whenever the `storage` event has not yet reached it. **Expected:** both files' entries are kept.
- **(b) Size and cost of the ui record.** The store has no size cap. A full storage is swallowed (`ui.svelte.ts:528-530`). Every save stringifies the whole envelope and every instance record, drafts included (`:525-526`). It also fires `takeSavedInstances` in every other page (`:510-515`). **Expected:** a failed save leaves the viewer working with no console error. Scrolling with a large draft held elsewhere does not stutter. Other pages do not re-derive every view's record 4 times a second. The recheck's case 16 had this second half; the brief dropped it.
- **(c) A PDF renamed or moved while its tab is open.** The frame key changes (`File.svelte:208`), so a new viewer opens. **Expected:** the tab keeps its place, and the per-file entry follows the move or ages out.
- **(d) Copy into New Window.** Covered by case 4 (`float/store.ts:108-110` copies the record).
- **(e) A float window reads the record at its own load.** A place changed in the last 500 ms before Open in New Window may not be written yet. **Expected:** the window opens at the place shown at the click, which means a pending throttled report is flushed before the tab moves.
- **(f) A reload during a build, or a Clean then a build.** See item 2 in section 5. **Expected:** the saved place once the PDF loads; page 1 is never written.
- **(g) The restore reporting page 1 before it scrolls.** See item 1 in section 5. **Expected:** nothing is written until the restored place is applied.
- **(h) A malformed `pdf-place` record.** For example: not an array, entries with bad fields, duplicate root and path, or more than 50 entries. **Expected:** bad entries are dropped, one entry is kept per root and path, the list is trimmed to 50, and no error is raised.
- **(i) A file read again.** **Expected:** its entry moves to the front and is not duplicated. Case 19 only counts entries.

## 7. ADRs

Command: `ls docs/adr` (in `tools/oculus`), then `ls /Users/axelfaes/workspace/research-hub/docs/adr`. Output: "No such file or directory" twice.

Command: `find . -type d -iname adr -not -path "*/node_modules/*"`. Output: nothing.

Command: `grep -n adr .agents/plan.yaml orchestrator-state.md`. Output: nothing.

Confirmed: there is no ADR folder and no `adr:` key.

## 8. Dictated text

Command: `grep -n "placed?: \|open(url, key, saved\|pdf: place\|pdf-place" D15.md`.

The brief dictates no prose line word for word. Item 7 states the facts the docs must gain, not their wording. It does dictate identifiers:
- `placed?: (place: PdfPlace) => void` and `PdfPlace` at `:42`;
- `open(url, key, saved?: PdfPlace | null)` at `:43`;
- `setInstanceState(instance.id, { ...held, pdf: place })` at `:46`;
- the id `pdf-place` at `:47`.

These hold against the rules: plain ASCII, with no history. `pdf-place` and the `pdf` key are saved shapes in `localStorage`, and the brief raises `pdf-place` as Decision 1, so neither is silent. The paraphrase of Z700 at `:17` omits "on TEST"; section 2 covers that.

## Declined to judge

- Whether Axel's running oculus refreshes an account labelled `claude`, which would mean it shares `oculus-usage-claude` with a scratch server. That is in `tools/oculus/config/local.yml`, which I may not read.
- Whether the equation card or a document frame shows M4-1 to M4-3 on screen today. That needs a look on TEST.
- Whether PDF.js's `updateviewarea` event (`pdf_viewer.mjs:9175`) is the right "end of a scroll" signal. That is the builder's choice.
- The worktree's `node_modules` setup, since the worktree does not exist yet.

Agent usage: a9240828824e6638a, claude-opus-5-5, 255,080 tokens, 78 tool uses, 11.2 min.
