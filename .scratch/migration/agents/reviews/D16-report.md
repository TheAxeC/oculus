Everything in the brief is done. One premise in the brief is wrong: DESIGN.md has no paragraph that names the open action, so the DESIGN.md doc text below adds a sentence to the roots paragraph (line 124) instead of replacing an existing line. The evidence is under "Brief premises found wrong".

## DONE / NOT DONE

All commands were run from `tools/oculus` in the worktree.

| Item | State | Proof |
|---|---|---|
| What to build 1, the server | DONE | `npx vitest run tests/routes/open.test.ts` gives `Tests 27 passed (27)`. `handleOpen` now takes `{ path }` or `{ root, path }`. The `{ root, path }` form goes through `resolveRootPath` from `server/files.ts`, the same function the file route uses, so the containment rule is written once. `fileOrFolder` admits a directory or a regular file. A root key no root carries (an unknown key, `''`, a non-string, `null`, `constructor`, `__proto__`) gets 400 with `refused: [{ field: 'root', reason: 'the root names no served root' }]`. A failed opener gets 500 `the path could not be opened: <reason>`. The route passes `browserRoots(locals.server)`, and both head comments now say file or folder. |
| What to build 2, the client | DONE | `writes.openFile(root, path)` is at `src/lib/state/writes.svelte.ts:170` and typed in `WritesStore` at line 61. It posts `{ root, path }` through `send` to `OPEN_PATH = '/api/open'` (line 42), which `openFolder` now uses too. |
| What to build 3, the File view | DONE | The toolbar control and the control beside Download are both `ToolButton` with `file.open_program`. A failure is shown as `file.open_failed` in a `.failed` span, the same way `BookmarkStar` shows its failure. New catalog lines in `config/text/views/file.yml`: `open_failed`, `open_program`, `open_program_glyph: launch`. |
| What to build 4, the cards | DONE | `drawnInPage` is in `src/lib/state/fs.ts`. In `CardDocs.svelte` a row that is neither READABLE nor drawn calls `openFile('hub', <folder>/<path>)`. In `EntryCard.svelte` a hub-path link that is not a document and not drawn calls `openFile(HUB_ROOT, value)`; the new pure helper `isHubPath` in `state/collection.ts` reuses `ADDRESSED`. Failure path in the entry card: its existing `onsaid` prop, which `Collection.svelte:261,295` shows as `said`. Failure path in the project card: `CardDocs` gains an `onsaid` prop, passed from `CardDetails` (which already had one from `ProjectCard`). Both say `t('file.open_failed', error)`. |
| What to build 5, doc text | DONE | See "Doc text" below. HELP.md and DESIGN.md are not edited. |
| Tests 1, open.test.ts | DONE | `Tests 27 passed (27)`. Covered: the file and folder forms of `{ path }` and `{ root, path }`; a workspace root key; the `engine` reserved key; the saved-workspace fold through `browserRoots`; the route module's own `POST` over a saved workspace (a missing file, so `macOpen` is never reached); a missing file; `..` escape in both forms; a symlink inside the root pointing to a file outside it, in both forms; an absolute path with a root; unknown, empty, non-string and inherited root keys; a non-string path; a missing token; a failing opener. The changed case: "takes a path that is a directory right now" now asserts a regular file is admitted (`openable(report)` is true), and the old refusal of a file is gone. `-n`, `-a/Applications/Calculator.app` and relative paths stay refused. `macOpen` is never called. |
| Tests 2, the client | DONE | "posts a file by its root and path to the open endpoint with the token" asserts the URL `/api/open`, POST, the `x-oculus-token` header and the body `{ root: 'hub', path: ... }`. A second case checks that an unknown-root refusal is not retried. |
| Tests 3, drawnInPage | DONE | `npx vitest run tests/state/fs.test.ts` gives `Tests 53 passed (53)`. Drawn: `.html .htm .png .SVG .pdf .py .tex .yml .md .MD .txt .csv` and `Makefile`. Not drawn: `.docx .xlsx .pptx .zip`, `LICENSE` and `folder/report.docx`. `isHubPath` has its own case in `tests/state/collection.test.ts`. |
| Tests 4, view tests | DONE | `tests/views/file.test.ts` gives 17 passed. The `.docx` case has 2 controls, both `<button type="button" class="tool`. A `.png` or `.pdf` has 1. A `.md` has 0. The new `tests/views/card-docs.test.ts` gives 4 passed: `.docx` and `.xlsx` are ToolButtons with the program words, `.md` is a ToolButton without them, `.png` and `.pdf` stay links, and no raw button is drawn. `tests/views/collection.test.ts` gives 49 passed: `.xlsx` and `.docx` links get the control; `.md`, `.pdf`, `.py`, `.png` and an https address keep their `href`. |
| Tests 5, browser spec | DONE | `npm run build` exits 0, then `npx playwright test tests/browser/open-file.spec.ts` gives `2 passed (7.2s)`: "a .docx opens in its program from the File view by its root and its path" and "a refused open is said in the view, and a later press that opens takes the sentence away". The `.docx` is written under `tmpdir()` (asserted) and copied into the hub copy with `copyIntoHub`, then removed in `afterAll`. `/api/open` is answered by `page.route`, which records `postDataJSON()`. The first tries hit the port held by another step's run, so I waited and ran it again; I signalled nothing. |
| Tests 6, reverts named | DONE | Each revert below was applied, its test file run, and the source restored. The commands and outputs are listed under "Reverts". |

## Verify before you report

1. `npm test -- --reporter=dot` gives `Test Files 229 passed (229)` and `Tests 3817 passed (3817)`.
2. `npm run check` gives `COMPLETED 1155 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
3. `npm run build`: `BUILD-EXIT 0`.
4. `npm run format:check`: `All matched files use Prettier code style!`
5. `npm run lint`: `LINT-EXIT 0`, no problems printed.
6. The ASCII perl gate over `src tests bin config` printed nothing.
7. `find src tests bin -type f | xargs wc -l | sort -n | tail -3` gives `970 tests/state/layout.test.ts`, `979 tests/state/board.test.ts`, `153968 total`.
8. `npx playwright test tests/browser/open-file.spec.ts` gives `2 passed (7.2s)`, run after the last build.

## Reverts

Each row names the revert that turns the tests red. All rows but the last were measured by applying the revert and running the test file. The last row was not measured.

- Route back to `roots(locals.server.engine)`: open.test.ts, 1 failed (the route case).
- `fileOrFolder` back to `isDirectory()` only: open.test.ts, 8 failed.
- Dropping the unknown-root check (`typeof key !== 'string'` only): open.test.ts, 2 failed.
- `openFile` posting `{ path: root/path }`: open.test.ts, 2 failed.
- `DRAWN_TEXT` emptied: fs.test.ts, 1 failed.
- CardDocs `{:else if false && !drawnInPage(...)}`: card-docs.test.ts, 1 failed.
- EntryCard `{:else if false && opensInProgram(...)}`: collection.test.ts, 1 failed.
- File view `{#if holds}` back to `{#if src !== ''}`: file.test.ts, 1 failed (the `.md` case).
- `isHubPath` without `!ADDRESSED.test`: state/collection.test.ts, 1 failed.
- Removing the `failed` span in File.svelte, or changing the posted body, should turn open-file.spec.ts red. Not measured.

## Files changed (lines added / removed, from `git diff --numstat`)

- `config/text/views/file.yml`: +3 / -0
- `src/lib/server/open.ts`: +66 / -27 (164 lines)
- `src/routes/api/open/+server.ts`: +3 / -3
- `src/lib/state/writes.svelte.ts`: +14 / -1
- `src/lib/state/fs.ts`: +15 / -0
- `src/lib/state/collection.ts`: +5 / -0
- `src/lib/views/File.svelte`: +74 / -3 (276 lines)
- `src/lib/views/collection/EntryCard.svelte`: +30 / -2
- `src/lib/views/shared/CardDocs.svelte`: +30 / -12
- `src/lib/views/shared/CardDetails.svelte`: +1 / -1
- `tests/routes/open.test.ts`: +378 / -12
- `tests/state/fs.test.ts`: +34 / -0
- `tests/state/collection.test.ts`: +21 / -0
- `tests/views/file.test.ts`: +60 / -2
- `tests/views/collection.test.ts`: +33 / -0
- `tests/views/type-scale.test.ts`: +1 / -1. The audit entry for `File.svelte` is now `'.download=fs-sm | .failed=fs-sm'`, for the new failure line.
- New: `tests/views/card-docs.test.ts` (162 lines) and `tests/browser/open-file.spec.ts` (117 lines).

## The grep

`grep -rn "open-folder\|openFolder\|api/open" src tests config HELP.md DESIGN.md README.md`

```
src/lib/state/writes.svelte.ts:42:export const OPEN_PATH = '/api/open';
src/lib/state/writes.svelte.ts:60:    openFolder: (path: string) => Promise<WriteAnswer>;
src/lib/state/writes.svelte.ts:165:    async function openFolder(path: string): Promise<WriteAnswer> {
src/lib/state/writes.svelte.ts:416:        openFolder,
src/lib/views/File.svelte:43:    // "Open in its program" hands the file to this machine's own program for it through api/open,
src/lib/views/collection/EntryCard.svelte:14:    // this machine through api/open, since a link to it would only download it, and everything else,
src/lib/views/shared/CardDocs.svelte:7:    // other file, a `.docx` or an `.xlsx`, is handed to its program on this machine through api/open,
src/lib/views/shared/ProjectCard.svelte:29:        writes: { openFolder, writeManifest }
src/lib/views/shared/ProjectCard.svelte:217:        const answer = await openFolder(item.project.folder);
tests/browser/open-file.spec.ts:5:// the spec. `/api/open` is answered by a route handler of this spec that records what the page posted
tests/browser/open-file.spec.ts:55:/** Answer every POST to /api/open with the answers given in turn, recording each body posted. */
tests/browser/open-file.spec.ts:61:    await page.route('**/api/open', async (route: Route) => {
tests/routes/open.test.ts:23:import { POST } from '../../src/routes/api/open/+server.ts';
tests/routes/open.test.ts:27:let openFolder: ClientState['writes']['openFolder'];
tests/routes/open.test.ts:33:    ({ openFolder, openFile, setToken } = client.writes);
tests/routes/open.test.ts:114:    return new Request(`http://${HOST}/api/open`, {
tests/routes/open.test.ts:438:        expect(OPEN_PATH).toBe('/api/open');
tests/routes/open.test.ts:475:        const answer = await openFolder(outside);
tests/routes/open.test.ts:504:        expect((await openFolder(folder)).ok).toBe(true);
tests/routes/open.test.ts:537:        expect((await openFolder(folder)).ok).toBe(true);
```

`openFolder` stays because it still opens a project folder. HELP.md, DESIGN.md, README.md and config have no hits.

## Doc text

**HELP.md, the File view** (`grep -n "" HELP.md | sed -n 114p`), current line:

`114:Five views are opened for something rather than listed in the rail: `project` (one project as its own tab, with a LaTeX panel over its manuscript), `person` (one human, opened from a collaborator tag on a card, from a joint-work entry and from the Map's node, drawing the organisations they are affiliated to, the joint work that names them, the projects whose `collaborators:` name them and, for a student, the files of their supervision folder), `editor` (a project's manifest form), `deposit` (its public code deposit) and `doc` (one Markdown document of the hub, from a group of the rail). Three more open from a file: `source` (one text file, edited and saved, its text coloured by language while the file is under `editor.paint_limit_kb` of `config/behavior.yml`, a Markdown file beside the rendered document its text makes, which a control in the bar takes away), `document` (a local HTML file in a frame) and `file` (a picture, a PDF in a frame, or a name and a link that saves it).`

Replacement:

`Five views are opened for something rather than listed in the rail: `project` (one project as its own tab, with a LaTeX panel over its manuscript), `person` (one human, opened from a collaborator tag on a card, from a joint-work entry and from the Map's node, drawing the organisations they are affiliated to, the joint work that names them, the projects whose `collaborators:` name them and, for a student, the files of their supervision folder), `editor` (a project's manifest form), `deposit` (its public code deposit) and `doc` (one Markdown document of the hub, from a group of the rail). Three more open from a file: `source` (one text file, edited and saved, its text coloured by language while the file is under `editor.paint_limit_kb` of `config/behavior.yml`, a Markdown file beside the rendered document its text makes, which a control in the bar takes away), `document` (a local HTML file in a frame) and `file` (a picture, a PDF in a frame, or a name and a link that saves it, with "Open in its program" in its bar and beside the link). A file the page does not draw, a `.docx` or an `.xlsx`, opens in its program on this machine: from the file view, from a project card's file list, and from a collection card's link to a file of the hub.`

**HELP.md, the project card's file list** (`grep -n "" HELP.md | sed -n 69p`). No HELP.md line describes the card's file list; this is the Projects row it belongs in. Current line:

`69:| `projects` | Projects | The projects board, as cards or as a list, searchable, with the pin, the stale badge and the card's own controls. |`

Replacement:

`| `projects` | Projects | The projects board, as cards or as a list, searchable, with the pin, the stale badge and the card's own controls. An opened card lists the project's files: a readable one opens as a document tab, a picture, a PDF or a page opens in the browser, and any other file, a `.docx` or an `.xlsx`, opens in its program on this machine. |`

**DESIGN.md, the roots paragraph** (`grep -n "" DESIGN.md | sed -n 124p`). No paragraph names the open action, so this is where it goes. Current line:

`124:Paths resolve without environment variables: the command-line argument `--engine <dir>`, then `local.yml`, then a default derived from the file's own location. The hub path is the one value every machine must set and it lives in `config/local.yml`, gitignored and left out of the merge, so the tree carries no machine path. Roots the file browser may serve (step 7) are set in the app and stored in config; nothing outside a root is ever served.`

Replacement:

`Paths resolve without environment variables: the command-line argument `--engine <dir>`, then `local.yml`, then a default derived from the file's own location. The hub path is the one value every machine must set and it lives in `config/local.yml`, gitignored and left out of the merge, so the tree carries no machine path. Roots the file browser may serve (step 7) are set in the app and stored in config; nothing outside a root is ever served. The open action, `POST /api/open`, hands a folder or a file to its program on this machine and takes it from the same roots, `browserRoots`, so what the file browser shows is exactly what can be opened, the saved workspace's own roots included.`

**DESIGN.md, decision line** (for the decisions list, after the other 2026-09-16 lines):

`- 2026-09-16, a file opens in its program: `POST /api/open` takes `{ path }`, absolute or relative to the hub, or `{ root, path }`, the key of a served root and a path under it, resolved through `resolveRootPath` with realpath on both ends, and hands an existing folder or regular file to macOS `open`; the route's roots are `browserRoots`, so a saved workspace's root is opened exactly as the file browser serves it. A key no root carries is refused on `root` with 400, a path leaving its root on `path` with 403, and nothing at a rooted path on `path` with 404; `openable` admits a regular file beside a directory and an `https` address, and refuses a relative path and an argument starting with `-`. The file view carries "Open in its program" in its toolbar for a picture, a PDF or a file whose first bytes say it is no text, and again beside the download; a project card's file row and a collection card's hub-relative link become that control when the name is neither readable nor drawn by the page, which is `drawnInPage(name)` in `state/fs.ts` (an HTML page, a picture, a PDF, a name the highlighter has a language for, or `.md`, `.txt`, `.csv`), and every other row and link keeps its document tab or its link. A refused open is said in the file view's bar and on a card through its `onsaid` line. Package D16.`

## Judgement calls the orchestrator may reverse

1. A missing path in the `{ root, path }` form gets 404 `there is no file or folder at the path` on `path`. The brief named only 403 and 400. The `{ path }` form keeps its 403 "outside" answer for a missing path, because telling missing apart from outside there would reveal whether arbitrary absolute paths exist.
2. A root key that is not a string, or is `null`, is refused on `root` with the same 400 as an unknown key.
3. The File view draws its toolbar control only for a file it holds: a picture, a PDF, or a file whose bytes are known not to be text. A file still being read, or a text file about to be handed to the source tab, gets none. This is how "for every file it holds" and "not for a .md" fit together; while the bytes are being read, the view shows no control and no download.
4. A refusal in the File view is kept against the root and path it was about, and a counter drops an answer that a later press superseded. A new press clears the sentence first.
5. The `CardDocs` readable rows were a raw `<button class="fname">`. They are now `ToolButton`, per the spec's rule that every control is a ui/ primitive. They open the document view as before, but look like bordered tool buttons instead of accent-coloured text. The `.fname` rule keeps only the link colour. No browser spec selects on `fname` (grep of `tests/browser` found none).
6. Words and glyph: `file.open_program` "Open in its program", `file.open_failed` "The file could not be opened: {0}", `file.open_program_glyph: launch`. The card rows reuse these keys as their tooltip, glyph and failure sentence.
7. Added `OPEN_PATH` in `writes.svelte.ts` so `openFolder` and `openFile` share the endpoint constant, and replaced the literal `'hub'` in `open.ts` with `HUB_ROOT`.

## Brief premises found wrong

- DESIGN.md has no paragraph naming `api/open`, `open-folder` or the open action. `grep -n "api/open\|open-folder\|file browser" DESIGN.md` hits lines 23, 124, 270, 299, 302, 308, 309, 313, 314 and 317, and none of them names the open action. `grep -n "Finder\|macOpen\|in its program" DESIGN.md` prints nothing. There was no current line to replace, so the doc text adds a sentence to line 124 and gives the decision line.
- HELP.md has no line about the project card's file list either. The doc text extends the Projects row (line 69).

## Limitations

- `openable`'s `-` check cannot be shown to matter by a revert: a string starting with `-` is neither absolute nor a URL, so the relative and URL rules refuse it too. The test asserts that it is refused, but removing only that line leaves it green (measured: open.test.ts `27 passed`).
- The route test calls the real route module, whose opener is `macOpen`. It sends a path asserted beforehand not to exist, so the request is refused before any opener runs. A route-level success case is not tested, because it would launch a program.
- `ProjectCard.showFolder` still reports a folder-open failure as `editor.failed` ("not saved: ..."), which is the wrong wording for an open. I did not change it because it is outside this brief.
- On a card, only a refused or failed open is reported; a successful open shows nothing, the same as the folder control.
- The opener is macOS `open` only (decision 4 of the brief).
- The browser spec covers only the File view. Pressing the project card and collection card controls is checked only by server rendering, not in a DOM.
- The browser suite as a whole was not run; only `open-file.spec.ts` was.


# Repair round 1

Not done: item 3's R7 half. No browser case can turn R7 red. The rest of the ten items are done. One more change goes beyond the rulings and is yours to confirm: I added `.docx`, `.xlsx` and `.pptx` to `file_index.ext` in `config/behavior.yml`. Details for both are under "Premises found wrong and decisions".

## DONE / NOT DONE

| # | Item | State | Proof |
|---|---|---|---|
| 1 | Run-on-open refusal | DONE | The rule is in `src/lib/data/runs-when-opened.ts`: `runsWhenOpened(name)` covers every extension of the ruling, case-insensitive. `bundleRunsWhenOpened(name)` covers the folder bundles `.app .pkg .mpkg .workflow .action .scptd`. In `server/open.ts`, `target()` calls `runs(real, asked)` in both body forms. It refuses a regular file when either the real name or the asked name is marked, or when `mode & 0o111` is set, and a folder whose name is a bundle. The refusal is 403 on `path` with reason `the file would run rather than open`. `openable` applies the same check as the floor under `macOpen`. Cards: `CardDocs.svelte:114` and `EntryCard.svelte:144` add `!runsWhenOpened(...)`, so a marked name keeps its link. File view: `openable = holds && !runsWhenOpened(path)` gates both controls. Views reach the rule through a re-export in `state/fs.ts`, and `tests/boundaries.test.ts` adds `data/runs-when-opened` to the state row. Proof: `npx vitest run tests/routes/open.test.ts tests/data/runs-when-opened.test.ts` gives 37 passed. The cases are a `.command`, an executable extensionless `reproduce`, a `Tool.app` folder and a symlink `notes.docx -> run.command`, each refused in both forms; a `.docx` asserted to be mode 0644 still opens in both forms. The card case (`setup.pkg` stays a link) and the File view case (`installer.dmg` gets no control but keeps its download) pass too. |
| 2 | Cards' press | DONE | `tests/browser/open-file.spec.ts` cases 5 and 7 press the control, assert the recorded body (`{ root: 'hub', path: 'projects/active/graph-bandits/open-file-spec.docx' }` and `{ root: 'hub', path: 'open-file-spec/budget.xlsx' }`), then assert the refusal line `file.open_failed`. R1 to R4 each turn one of them red (run, see the revert list). |
| 3 | File view async | PARTLY DONE | Case 3 ("a refusal that lands after a later press has opened the file is never shown") holds the first answer until the second has landed. R8 turns it red. Case 4 ("a refusal about one file is not shown once the tab shows another") is written and passes, but R7 does not turn it red (see Premises). |
| 4 | FIFO | DONE | "refuses a FIFO inside the root in either form without calling the opener" uses `execFileSync('mkfifo')` and asserts `isFIFO()`. Rooted form answers 404, plain form 403, opener not called. R5 and R6 each turn it red (run). |
| 5 | Revert per test | DONE | See the per-test revert list. The `-` check in `openable` is an audit: N17 removes it and `Tests 34 passed (34)`. |
| 6 | Glyph | DONE | `config/glyphs.yml` gains `open_program: "⧈"` and the ascii stand-in `"⧈": "[o]"`. `config/icons.yml` gains `open_program: app-window` (`node_modules/lucide-static/icons/app-window.svg` exists). `file.open_program_glyph: open_program`. |
| 7 | Text rows | DONE | `DRAWN_TEXT` is now `['.md', '.txt', '.csv', '.log', '.tsv', '.cfg', '.conf']`. `.xml`, `.toml`, `.ini` and `.ipynb` were left out because `languageOf` already claims them, and `fs.test.ts` asserts all eight are drawn. |
| 8 | False sentences | DONE | The `server/open.ts:1-10` head now says the boundary is the roots, and that a dotfile or a file under a build folder, which the tree leaves out of its listing, is opened like any other path under a root. The `CardDocs.svelte:5-11` head now says: READABLE names (a page, Markdown, a script, a LaTeX source) open the document view; other drawn names (a picture, a PDF, a language file READABLE does not name such as `.toml`) and names that would run are links; anything else goes to its program. The Doc text below says the same. |
| 9 | Folder failure words | DONE | `project.card.folder_failed: 'The folder could not be opened: {0}'` is in `config/text/views/project.yml`, and `ProjectCard.svelte:218` uses it. Browser case 6 answers 500 and asserts the sentence. R12 (back to `editor.failed`) turns it red (run). |
| 10 | Report corrections | DONE | `openFile` is at `writes.svelte.ts:173`. Before and after is below, and the wire shape is under the decision line. |

## Premises found wrong and decisions

1. **R7 cannot be turned red by any browser case.** No UI path changes the file of a mounted File view. `openInto` (`state/layout.svelte.ts:757-770`) opens into the focused pane, and pointing the preview tab at another file from the tree goes through the Files tab, which unmounts the File view. The component mounts again with `refusal` null. Measured: R7 (`refusal.key === held` changed to `true`), then build, then `npx playwright test tests/browser/open-file.spec.ts` gave `7 passed (11.0s)`. The key guard stays as a defence for a retarget of a displayed instance. Case 4's final assertion is an audit of the remount. I'd book this for a ruling: keep the guard, or remove it as unreachable.
2. **Before this change the project card's program control never showed up with the shipped config.** `server/project-files.ts` lists only `file_index.ext`, and that list (`config/behavior.yml:74-75`) named no office format. So no `.docx` row existed to press, and case 5 first failed with `Files (3)`. I added `".docx", ".xlsx", ".pptx"` to `file_index.ext`. This is a config default a reader sees, so treat it as a decision you may reverse. With the brief's own rule, every other listed extension is drawn or readable, so without these three the card control never renders.
3. **New wire shapes of `POST /api/open`:**
   - 400 on `root`, `the root names no served root`.
   - 403 on `path`, `the path is outside the configured roots`.
   - 404 on `path`, `there is no file or folder at the path`. Only for the `{ root, path }` form; in the `{ path }` form a missing path answers the 403 "outside" sentence.
   - 403 on `path`, `the file would run rather than open`, in both forms.
   - 500, `the path could not be opened: <reason>`.
4. **The bundle subset** `.app .pkg .mpkg .workflow .action .scptd` is my reading of "bundle suffix of the list". A folder named `code.py` is not refused.
5. **`openable` checks too.** It also refuses a file that would run (`openable` floor), beyond the ruling's server check in `handleOpen`.
6. **`holds` in `File.svelte` is simplified** to `src !== '' && known !== null && known.kind !== 'text'`. `heldFileKind` already answers image and PDF by name (`state/fs.svelte.ts:471-476`), so the removed image and PDF clauses were redundant. The picture and PDF case turns red under `known.kind === 'other'` (run).

## Before and after (Behaviour)

- **Project card file list, readable rows** (`.md`, `.py`, `.tex` and the rest of READABLE). Before: accent-coloured plain text. After: bordered `ToolButton`s that still open the document view.
- **Project card file list, office rows** (`.docx`, `.xlsx`, `.pptx`, now listed). Before: not listed at all. After: a bordered button with the `open_program` glyph (Lucide `app-window`). "Open in its program" is the tooltip. The card offers no download for these rows; the download stays in the File view.
- **Project card file list, other undrawn rows.** Rows `drawnInPage` rejects that `file_index.ext` does not list never reach the card. A listed name that would run keeps its link.
- **Collection card `link` to a hub file the page does not draw** (for example `.xlsx`). Before: an `<a>` with the path as text, opening a new browser tab. After: a bordered button with the glyph and the path as label. A marked name such as `.dmg` stays a link.
- **Project card folder control failure.** Before: `not saved: ...`. After: `The folder could not be opened: ...`.
- **`.log`, `.tsv`, `.cfg`, `.conf`** now count as drawn, so on a card they stay links, like `.toml`.

## Verification list (from `tools/oculus` in the worktree)

1. `npm test -- --reporter=dot`: `Test Files 230 passed (230)`, `Tests 3829 passed (3829)`.
2. `npm run check`: `COMPLETED 1157 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
3. `npm run build`: exit 0.
4. `npm run format:check`: `All matched files use Prettier code style!`
5. `npm run lint`: exit 0, no problems printed.
6. The ASCII perl gate printed nothing.
7. `find src tests bin -type f | xargs wc -l | sort -n | tail -3`: `970 tests/state/layout.test.ts`, `979 tests/state/board.test.ts`, `154456 total`.
8. After the build, `npx playwright test tests/browser/open-file.spec.ts`: `7 passed (11.1s)`.

## Per-test revert list

Each revert was applied, its test file run, and the source restored. Node reverts used `npx vitest run <file>`; browser reverts used `npm run build` then the spec.

Node revert keys (`server/open.ts` unless named):
- N1: `fileOrFolder` accepts directories only (12 failed).
- N2: `fileOrFolder` accepts files only (6 failed).
- N3: a missing rooted path answers 403 outside (2 failed).
- N4: an outside rooted path answers 404 (3 failed).
- N5: `allowed` skips the root loop (4 failed).
- N6: `allowed` uses `resolve` instead of `realpathSync` (9 failed).
- N7: the unknown-root check is dropped (2 failed).
- N8: the path type check is removed (2 failed).
- N9: the token check is bypassed (4 failed).
- N10: the 500 message says "folder" (1 failed).
- N11: the name rule in `runs` is removed (3 failed).
- N12: the execute-bit check is removed (2 failed).
- N13: folders never count as bundles (2 failed).
- N14: only the asked name is checked (1 failed).
- N15: `runs` returns true for every file (9 failed).
- R5: rooted form returns `found.path` unnarrowed (1 failed).
- R6: plain form drops `fileOrFolder` (1 failed).
- N16: `openable` drops `runs` (1 failed).
- N17: `openable` drops the `-` check (0 failed, so audit).
- N18: the route uses `roots(engine)` (1 failed).
- N19: `openFile` posts `{ path }` (2 failed).
- N20: `.iso` removed from the list (1 failed).
- N21: an extensionless name counts as marked (1 failed).
- N22: bundles use the whole list (1 failed).
- N22b: the extension is not lowercased (2 failed).
- N23: `DRAWN_TEXT` goes back to `.md .txt .csv` (1 failed).
- N24: `DRAWN_TEXT` gains `.docx` and `''` (1 failed).
- N25: `isHubPath` drops the `ADDRESSED` test (1 failed).
- N26: the File view's other-block control removed (1 failed).
- N27': `holds` requires `known.kind === 'other'` (1 failed).
- N28: the toolbar control is always drawn (3 failed).
- N29: `openable = holds`, without the run rule (1 failed).
- N30: the `.failed` font-size rule is removed (1 failed, type-scale).
- N31: the card program branch is disabled (1 failed).
- N32: the card readable branch is disabled (1 failed).
- N33: the card drops `!drawnInPage` (2 failed).
- N34: the card drops `!runsWhenOpened` (1 failed).
- N35: the readable row goes back to a raw `<button>` (2 failed).
- N36: the entry card program branch is disabled (1 failed).
- N37: the entry card drops `!runsWhenOpened` (1 failed).
- N38: `data/runs-when-opened` removed from the boundaries table (1 failed).

`tests/routes/open.test.ts`, new or changed tests:
- opens a file by its root and its path: N1, N15
- opens a file under a workspace root by that root's key: N1, N15
- opens a folder by its root and its path: N2
- opens a file by a hub-relative path and by an absolute one: N1, N6
- opens a file of the engine root: N1
- opens a file under a root the saved workspace adds: N1 (otherwise an audit of the `browserRoots` fold)
- hands the route the file browser's roots: N18, N3
- refuses a missing file in either form: N3
- refuses a path that climbs out by `..`: N4, N5
- refuses a symlink that resolves outside every root: N4, N5
- refuses an absolute path handed with a root: N4
- refuses unknown, empty, non-string and inherited root keys: N7
- refuses a path that is not a string: N8
- refuses a file without the write token: N9
- says a path could not be opened when the opener fails: N10
- refuses a `.command` file in either form: N11
- refuses an executable file with no extension: N12
- refuses an `.app` folder: N13
- refuses a symlink with a document name pointing at a `.command`: N14, N11
- still opens a `.docx` with no execute bit: N15, N1
- refuses a FIFO in either form: R5, R6
- client posts a file by root and path: N19
- client reports an unknown root's refusal without retry: N19, N7
- openable takes a directory or a regular file: N1, N2
- openable refuses a file or a bundle that would run: N16, N11, N12, N13
- openable refuses a relative path, an option, an empty argument and a missing path: audit (N17: 34 passed)

`tests/data/runs-when-opened.test.ts`:
- marks every extension in any case: N20, N22b
- leaves a document, a sheet, a picture and an extensionless name unmarked: N21
- marks a folder as a bundle only by bundle extensions: N22, N22b

Other node test files:
- `tests/state/fs.test.ts`, drawn list: N23; undrawn list: N24.
- `tests/state/collection.test.ts`, `isHubPath`: N25.
- `tests/views/file.test.ts`:
  - docx two controls: N26
  - picture and PDF: N27'
  - `.md` none: N28
  - would run, none: N29, N28
  - no file chosen: N28
- `tests/views/type-scale.test.ts`, File.svelte: N30.
- `tests/views/card-docs.test.ts`:
  - docx/xlsx: N31
  - `.md`: N32, N35
  - picture/PDF link: N33
  - would run and log link: N34, N33
  - no raw button: N35
- `tests/views/collection.test.ts`, hub link: N36, N37.
- `tests/boundaries.test.ts` (changed row): N38.

`tests/browser/open-file.spec.ts`:
- Case 1, docx from the File view: B-body (`openFile` posts `{ path }`) fails cases 1, 5 and 7.
- Case 2, refusal said and cleared: B-span (`{#if false}` for the failure line) fails cases 2 and 4.
- Case 3, superseded refusal never shown: R8 (`mine !== presses ||` removed) fails case 3.
- Case 4, refusal about A not shown on B: B-span fails its setup assertion. R7 gives 7 passed, so the final assertion is an audit.
- Case 5, project card: R1 (no folder in the path) and R2 (no call) each fail case 5.
- Case 6, folder failure words: R12 fails case 6.
- Case 7, collection card: R3 (no call) and R4 (no `onsaid`) each fail case 7.

## Doc text

**HELP.md line 114** (`grep -n "" HELP.md | sed -n 114p`). The current line ends:

`... `document` (a local HTML file in a frame) and `file` (a picture, a PDF in a frame, or a name and a link that saves it).`

Replace that ending with:

`... `document` (a local HTML file in a frame) and `file` (a picture, a PDF in a frame, or a name and a link that saves it, with "Open in its program" in its bar and beside the link). A file the page does not draw, a `.docx` or an `.xlsx`, opens in its program on this machine from the file view, from a project card's file list and from a collection card's link to a file of the hub. A file that would run rather than open (an application, an installer, a `.command` or a script, or any file with an execute bit) is never offered to its program and is refused if asked for.`

**HELP.md line 69**, current:

`| `projects` | Projects | The projects board, as cards or as a list, searchable, with the pin, the stale badge and the card's own controls. |`

Replacement:

`| `projects` | Projects | The projects board, as cards or as a list, searchable, with the pin, the stale badge and the card's own controls. An opened card lists the project's files of the extensions `file_index.ext` in `behavior.yml` names: a page, a Markdown file, a script or a LaTeX source opens as a document tab, a picture, a PDF or another file the page draws is a link, and an office file (`.docx`, `.xlsx`, `.pptx`) opens in its program on this machine. |`

**DESIGN.md line 124**, current:

`Paths resolve without environment variables: the command-line argument `--engine <dir>`, then `local.yml`, then a default derived from the file's own location. The hub path is the one value every machine must set and it lives in `config/local.yml`, gitignored and left out of the merge, so the tree carries no machine path. Roots the file browser may serve (step 7) are set in the app and stored in config; nothing outside a root is ever served.`

Replacement:

`Paths resolve without environment variables: the command-line argument `--engine <dir>`, then `local.yml`, then a default derived from the file's own location. The hub path is the one value every machine must set and it lives in `config/local.yml`, gitignored and left out of the merge, so the tree carries no machine path. Roots the file browser may serve (step 7) are set in the app and stored in config; nothing outside a root is ever served. The open action, `POST /api/open`, hands a folder or a file under those same roots, `browserRoots` with the saved workspace's own, to its program on this machine. The boundary is the roots, so a dotfile the tree leaves out of its listing is opened like any other path under a root, and a path that would run rather than open is refused: a name `runsWhenOpened` in `data/runs-when-opened.ts` marks, a regular file with an execute bit, and an application or installer bundle.`

**DESIGN.md decision line:**

`- 2026-09-16, a file opens in its program: `POST /api/open` takes `{ path }`, absolute or relative to the hub, or `{ root, path }`, the key of a served root and a path under it, resolved through `resolveRootPath` with realpath on both ends over `browserRoots`, and hands an existing folder or regular file to macOS `open`. It answers 400 on `root` for a key no root carries, 403 on `path` for a path outside the roots, 404 on `path` for nothing at a rooted path (the `{ path }` form answers that 403), 403 on `path` with `the file would run rather than open` for a file whose name `runsWhenOpened` marks (asked name or real name), a regular file with an execute bit, or a folder named as an application or installer bundle, and 500 when `open` fails. `openable` under `macOpen` holds the same rules. The file view carries "Open in its program" for a picture, a PDF or a file whose first bytes say it is no text, and again beside the download; a project card's file row and a collection card's hub-relative link become that control when the name is neither readable, nor drawn by the page (`drawnInPage` in `state/fs.ts`: a page, a picture, a PDF, a name the highlighter has a language for, or `.md .txt .csv .log .tsv .cfg .conf`), nor marked by `runsWhenOpened`. `file_index.ext` lists `.docx`, `.xlsx` and `.pptx` so a card shows them. The control's glyph is `open_program`, Lucide `app-window`. A refused open is said in the file view's bar and on a card through its `onsaid` line, and a failed folder open on a project card says `project.card.folder_failed`. Package D16.`

## Files changed (from `git diff --numstat`; new files by `wc -l`)

- `config/behavior.yml` +1/-1
- `config/glyphs.yml` +2/-0
- `config/icons.yml` +1/-0
- `config/text/views/file.yml` +3/-0
- `config/text/views/project.yml` +1/-0
- `src/lib/server/open.ts` +103/-29
- `src/lib/state/collection.ts` +5/-0
- `src/lib/state/fs.ts` +17/-0
- `src/lib/state/writes.svelte.ts` +14/-1
- `src/lib/views/File.svelte` +78/-4
- `src/lib/views/collection/EntryCard.svelte` +31/-2
- `src/lib/views/shared/CardDetails.svelte` +1/-1
- `src/lib/views/shared/CardDocs.svelte` +32/-12
- `src/lib/views/shared/ProjectCard.svelte` +1/-1
- `src/routes/api/open/+server.ts` +3/-3
- `tests/boundaries.test.ts` +5/-2
- `tests/routes/open.test.ts` +480/-12
- `tests/state/collection.test.ts` +21/-0
- `tests/state/fs.test.ts` +42/-0
- `tests/views/collection.test.ts` +35/-0
- `tests/views/file.test.ts` +67/-2
- `tests/views/type-scale.test.ts` +1/-1
- New: `src/lib/data/runs-when-opened.ts` (79), `tests/data/runs-when-opened.test.ts` (74), `tests/views/card-docs.test.ts` (188), `tests/browser/open-file.spec.ts` (261)

## Grep

`grep -rn "open-folder\|openFolder\|api/open" src tests config HELP.md DESIGN.md README.md` hits only:
- `writes.svelte.ts:42,60,165,416`
- the head comments of `File.svelte:43`, `EntryCard.svelte:14` and `CardDocs.svelte:10`
- `ProjectCard.svelte:29,217`
- `tests/browser/open-file.spec.ts:8,75,89,172,177`
- `tests/routes/open.test.ts:26,30,36,117,528,565,594,627`

`runsWhenOpened`, `bundleRunsWhenOpened`, `open_program` and `folder_failed` have no hits in HELP.md, DESIGN.md or README.md; their text reaches those files through the Doc text above.

## Limitations

- The execute bit cannot be seen from the page. A card or the File view can draw the control for such a file (a `.docx` with mode 0755); the server then refuses it and the view says so.
- On a filesystem that reports every file as executable (exFAT, some network mounts), every regular file is refused. Not verified on such a mount.
- What macOS `open` does with each listed extension was not run. The list is the ruling's.
- A race between the path check and `open` (a component swapped for a symlink after resolution) is not covered.
- The browser spec appends an entry to the run's copy of `network/events.yml` and restores the file in `afterAll`. If the run is killed before that, the copy keeps the entry. The copy is under the system temporary directory and the layer removes it on exit.
- The full browser suite was not run. `board.spec.ts` asserts `Files (3)` for graph-bandits; that still holds because the spec removes its `.docx` afterwards, but it was not rerun.


# Repair round 2

Everything in repair round 2 is done.

## Change
- `src/lib/views/File.svelte`: the refusal key guard is removed. `refusal` (`{ key, reason }`), the `held` key and the `refusal.key === held` comparison are gone. `failed` is now plain `$state('')`, cleared at each press and set only when the answer is not ok and no later press has superseded it. The `presses` rule stays: `if (mine !== presses || answer.ok) return;`. Head comment, lines 52-53, now reads: "What a refused or failed open said is shown in the toolbar until the next press, and an answer a later press has superseded is dropped, so a slow refusal never lands over a later open."
- `tests/browser/open-file.spec.ts`: case 4 ("a refusal about one file is not shown once the tab shows another") is dropped, not reduced. What it still proved, that a refusal is shown and then cleared, is already covered by case 2. The helper `openFixture(page, name)` had only `.docx` callers left, so it became `openReport(page)`. The spec head comment is still true, because `budget.xlsx` is still the collection card's link.
- R8 still turns the superseded-press case red on the reduced code. I applied `mine !== presses ||` removed, ran `npm run build` and `npx playwright test tests/browser/open-file.spec.ts`: `1 failed, 5 passed (16.9s)`, the failure at line 187 of "a refusal that lands after a later press has opened the file is never shown". Then I restored the file and rebuilt.

## Commands (from `tools/oculus` in the worktree)
- `npx vitest run --reporter=dot`: `Test Files 230 passed (230)`, `Tests 3829 passed (3829)`
- `npm run check`: `COMPLETED 1157 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
- `npm run build`: exit 0, `✓ built in 15.12s`, `✔ done`. Run again after the R8 restore: exit 0.
- `npm run format:check`: `All matched files use Prettier code style!`
- `npm run lint`: exit 0, no problems printed
- Perl ASCII gate: printed nothing
- `npx playwright test tests/browser/open-file.spec.ts tests/browser/board.spec.ts`: `11 passed (16.8s)`. After the R8 restore and rebuild, run again: `11 passed (14.3s)`. The 11 are board.spec's 5 cases and open-file.spec's 6. Earlier attempts in the retry loop hit "http://127.0.0.1:8792/ is already used", and several hit "You are calling test() from an async test.describe() block. Only sync ones are supported" while the port was held. I did not find the cause of that second message; it did not appear in the runs that passed.

## Files changed this round
- `src/lib/views/File.svelte`: 272 lines. Against base: +71/-4.
- `tests/browser/open-file.spec.ts`: 249 lines (new file; was 261).

## Doc text
Unchanged except the DESIGN.md decision line, which never named the key guard. No line of the HELP.md or DESIGN.md text changes.


# Repair round 3

Everything in repair round 3 is done.

## Items

| # | Item | State | Proof |
|---|---|---|---|
| 1 | Allow list replaces deny list | DONE | See "The allow rule" below. `npx vitest run tests/routes/open.test.ts tests/data/opens-in-program.test.ts tests/server/context.test.ts`: all pass (42, 7 and 4). |
| 2 | `openable` resolves the real path first | DONE | `openable(target, programExt)` calls `mayOpen(realpathSync(target), target, programExt)`, and its doc comment says so. Case "resolves a symlink first: an absolute link.docx to a refused file is refused" (link to `report.docx.command`). Revert A19 turns it red. |
| 3 | Cards drop a superseded answer | DONE | `CardDocs.svelte` and `EntryCard.svelte` `openInProgram` now use a per-component `presses` counter with `if (mine !== presses \|\| answer.ok) return;`, as the File view does. Browser case 7, "a collection card's refusal that lands after a later press has opened the file is never said", fails under revert EC (`1 failed, 6 passed`). The project card's guard has no browser case; the ruling asked for one card. |
| 4 | Test comment naming the ruling | DONE | The file is replaced by `tests/data/opens-in-program.test.ts`. Its head says what the list is: `open.program_ext` of config/behavior.yml, the rule both layers use. |
| 5 | Doc text | DONE | See "Doc text" below. |
| 6 | Before and after, and wire answers | DONE | See those sections below. |

## The allow rule

- **Config.** `config/behavior.yml` has `open: { program_ext: [".docx", ".doc", ".xlsx", ".xls", ".pptx", ".ppt", ".odt", ".ods", ".odp", ".rtf", ".pages", ".numbers", ".key"] }` with a one-line comment. `openSettings(config)` sits beside `searchSettings` in `data/sources/config.ts` and throws naming `open.program_ext` when the list is missing or mistyped. The default lives in the YAML only.
- **Where the list is read.**
  - The server context reads it at start (`context.ts:151`), before anything is built, and builds `opener: macOpener(open.programExt)`.
  - The route passes `openSettings(locals.server.config).programExt` to `handleOpen(request, token, roots, programExt, opener = macOpener(programExt))`.
- **The rule module.** `src/lib/data/runs-when-opened.ts` is replaced by `src/lib/data/opens-in-program.ts`. It holds:
  - `opensInProgram(name, list)`: the lowercased extension is on the list.
  - `isPackageName(name)`: the 16 package suffixes, case-insensitive.
  - `programExtensions(config)`: the lenient reader; null when the list is unusable, entries lowercased.
  - The boundaries table and its comment are renamed. `tests/config-folder.test.ts` lists the new `open` key.
- **Server rule.** `mayOpen(real, asked, programExt)` in `server/open.ts`:
  - A regular file opens only when both the asked name and the real name are on the list, `mode & 0o111` is 0, and it is not an alias. `isAlias` reads at most 16 bytes and matches `book` at bytes 0-3 and `mark` at 8-11; a file it cannot read counts as an alias.
  - A directory opens only when neither name has a package suffix and `Contents/Info.plist` does not exist inside it.
  - Anything else, including a stat failure, is 403 on `path` with `the file would run rather than open`.
- **Page.** A new selector `programExt()` (`state/selectors.svelte.ts`) returns `programExtensions(configMap()) ?? []`, so the page shows no control until the config channel has spoken. `state/fs.ts` re-exports `opensInProgram`.
  - `CardDocs.svelte`: READABLE rows open the document view; a row on the list gets the program control; every other row is a link.
  - `EntryCard.svelte`: `programLink(link) = isHubPath(link) && opensInProgram(link, programExt())`.
  - `File.svelte`: `openable = holds && opensInProgram(path, programExt())`.
- **Removed.** `drawnInPage` and `DRAWN_TEXT` had no reader left, so they and their tests are gone. `tests/state/fs.test.ts` is byte-identical to base (`git diff 76c3b390 --stat` on it prints nothing).
- **Cases.** Everything the ruling lists is covered: every listed extension opens in both forms; mixed case `Report.DocX` opens; `report.docx.command`, `.zip`, `.ics`, `.vcf`, `.vncloc`, `.mobileconfig`, `.shortcut` and `.command` are refused in both forms; an alias `report.docx` (`book` + 4 zero bytes + `mark`) is refused in both forms; `Pane.prefPane`, `Tool.app` and a folder holding `Contents/Info.plist` are refused; a plain folder and a 0644 `.docx` open; a list naming `.txt` opens a `.txt` that the checked-in list refuses. Added beyond the ruling:
  - a listed `.docx` with mode 0755 is refused;
  - a symlink `run.command` pointing at a listed file is refused;
  - an unreadable listed file (mode 000) is refused;
  - the route throws naming `open.program_ext` when the request config has no usable list;
  - the context stops before `createHub` when the key is missing;
  - the File view and card views read the list from the config the page holds (a config naming `.zip` offers a `.zip`; one naming `.log` offers a log);
  - a listed file still being read gets no control.

## Before and after (this round against round 1)

- **Server.** Round 1 opened any regular file with no execute bit whose name was not on the deny list. That included `.zip`, `.ics`, `.vcf`, `.vncloc`, `.afploc`, `.mobileconfig`, `.shortcut`, `.jnlp`, extensionless data files and Finder aliases. It opened any folder without a bundle suffix, including `.prefPane`, `.saver`, `.appex` and `.xpc`. Now it opens only a file whose asked and real extensions are on `open.program_ext`, has no execute bit and is not an alias, and a folder that is not a package by suffix or `Contents/Info.plist`.
- **File view.** Round 1 offered "Open in its program" for pictures, PDFs and every non-text file not on the deny list (for example `.zip`, `.npz`, `.ics`). Now it offers it only for a held file whose extension is on the list, so pictures, PDFs, `.zip` and `.npz` get no control.
- **Project card file list.** Round 1 gave the control to rows that were neither READABLE, drawn nor marked; with `file_index.ext` that was `.docx`, `.xlsx` and `.pptx`. Now a row gets it when its extension is on the list. With the checked-in config that is still `.docx`, `.xlsx` and `.pptx`: `.doc`, `.xls` and the other listed types are not in `file_index.ext`, so they are never listed on a card.
- **Collection card link.** Round 1 gave the control to any hub path neither drawn nor marked (a `.zip`, `.npz` or `.ics` link became a control). Now only a hub path with a listed extension does; everything else stays a link.
- **Cards' async.** A refusal from a press that a later press superseded is now dropped on both cards.
- **Removed.** `.log`, `.tsv`, `.cfg` and `.conf` were "drawn" only through `DRAWN_TEXT`, which is gone. On a card they are links either way.

## Wire answers of `POST /api/open` now

- 403 `the request did not come from this page` (origin)
- 403 `the write token is missing or stale`
- 400 `the body is not JSON`
- 400 `the path is required`
- 400, `refused` on `root`: `the root names no served root`
- 403, `refused` on `path`: `the path is outside the configured roots`. In the `{ path }` form this also covers a missing path, or one that is neither a file nor a folder.
- 404, `refused` on `path`: `there is no file or folder at the path`. `{ root, path }` form only, for a missing path or one that is neither a file nor a folder (a FIFO).
- 403, `refused` on `path`: `the file would run rather than open`, in both forms. It covers a file whose asked or real extension is off the list, one with an execute bit, one that cannot be read, a Finder alias, and a package folder.
- 500 `the path could not be opened: <reason>`
- 200 `{ ok: true, changed: [], refused: [] }`

A request config with no usable `open.program_ext` makes the route throw naming the key. The server also refuses to start without the key.

## Verification (from `tools/oculus` in the worktree)

1. `npm test -- --reporter=dot` (and after the last test edit, `npx vitest run --reporter=dot`): `Test Files 230 passed (230)`, `Tests 3842 passed (3842)`.
2. `npm run check`: `COMPLETED 1157 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
3. `npm run build`: exit 0, `✓ built in 6.94s`.
4. `npm run format:check`: `All matched files use Prettier code style!`
5. `npm run lint`: exit 0. The first run found `open.test.ts:297` "Async arrow function has no 'await' expression"; I fixed it and reran lint.
6. The perl ASCII gate printed nothing.
7. `find src tests bin -type f | xargs wc -l | sort -n | tail -3`: `970 tests/state/layout.test.ts`, `979 tests/state/board.test.ts`, `154767 total`.
8. `npx playwright test tests/browser/open-file.spec.ts tests/browser/board.spec.ts tests/browser/collection.spec.ts`: `17 passed (28.2s)` (7 open-file, 5 board, 5 collection). The run followed the build in step 3. The only change after it was the lint fix in `tests/routes/open.test.ts`, which the served build does not include.

## Reverts per new or changed test

I applied each revert, ran the test file, and restored it. Node reverts used `npx vitest run <file>`; browser reverts used `npm run build` then the open-file spec. Scripts and logs are under `scratchpad/d16-builder`.

**Node revert keys** (`server/open.ts` unless named):
- A1 `fileOrFolder` directories only
- A2 files only
- A3 plain missing answers outside
- A3b rooted missing answers outside
- A4 outside answers 404
- A5 `allowed` skips the root loop
- A6 `allowed` uses `resolve`
- A7 unknown-root check dropped
- A8 path type check dropped
- A9 token bypassed
- A10 500 says "folder"
- A11 execute bit dropped
- A12 real name only
- A13 asked name only
- A14 alias check dropped
- A15 alias read-failure counts as not an alias
- A16 package suffix dropped
- A17 Info.plist dropped
- A18 `target` uses `['.docx']`
- A19 `openable` without realpath
- A20 `openable` without the `-` check
- A21 `mayOpen` catch returns true
- A24 (R5) rooted form unnarrowed
- A25 (R6) plain form unnarrowed
- A26 route passes `browserRoots(...).slice(0, 2)`
- A27 route passes an empty list
- A28 client posts `{ path }`
- X1 `openable` takes any scheme
- X2 folders refused
- X4 name rule always true
- X5 no lowercasing, run against the endpoint tests
- X6 execute check inverted
- D1 `.prefpane` dropped
- D2 extension not lowercased
- D3 list entries not lowercased
- D4 entries only need a leading dot
- D5 `openSettings` never throws
- D6 `.key` dropped from `behavior.yml`
- K1 context skips `openSettings`
- F1 File view uses `['.docx']`
- F2 other-block control removed
- F3 `holds = src !== ''`
- F4 toolbar control always drawn
- F5 `.failed` font-size removed
- C1 card program branch off
- C2 card readable branch off
- C3 card list fixed to `.docx`/`.xlsx`
- C4 card program branch always on
- C5 readable row as a raw `<button>`
- E1 entry program branch off
- E2 entry drops `isHubPath`
- E3 `isHubPath` drops `ADDRESSED`
- B1 boundaries row removed
- G1 config-folder key removed

**Browser revert keys:**
- R1 card posts `path` without the folder
- R2 card makes no call
- R3 entry card makes no call
- R4 entry card drops `onsaid`
- EC entry card supersede guard removed
- R8 File view supersede guard removed
- R12 folder failure back to `editor.failed`
- B-body `openFile` posts `{ path }`
- B-span failure line never drawn

**`tests/routes/open.test.ts`:**
- requires the write token: A9
- requires a path: A8
- refuses a directory outside every configured root: A5
- resolves a hub-relative folder: A2, A6, X2
- opens a file by root and path: A1, X6
- opens a file under a workspace root: A1, A18, X6
- opens a folder by root and path: A2, X2
- opens a file by hub-relative and absolute path: A1, A6, A18
- opens a file of the engine root: A1, X6
- opens a file under a saved workspace root: A1, A18
- hands the route the file browser's roots: A26, A3b
- reads the list out of the request configuration: A27
- refuses a missing file in either form: A3b
- refuses `..` in either form: A4, A5
- refuses a symlink resolving outside every root: A4, A5
- refuses an absolute path with a root: A4
- refuses unknown, empty, non-string and inherited root keys: A7
- refuses a non-string path: A8
- refuses a file without the token: A9
- 500 wording: A10
- opens every listed extension: A18, A1, X6
- opens mixed case: X5
- opens a plain folder and a 0644 docx: A2, X2, X6
- refuses a double extension and off-list types: X4
- refuses an extensionless executable and a 0755 docx: A11
- refuses a Finder alias: A14
- refuses package folders: A16, A17, X5
- refuses an off-list symlink name to a listed file: A12
- refuses a listed file it cannot read: A15, A14
- refuses a listed symlink name to an off-list file: A13
- a `.txt` list opens a `.txt`: A18, X4
- refuses a FIFO in either form: A3, A24, A25
- client posts file by root and path: A28
- client unknown-root refusal without retry: A28, A7
- client outside-root refusal: A5
- stale-token retry (both cases): A9, A2
- `openable` takes a plain folder and a listed file: X2, X6
- `openable` https only: X1
- `openable` refuses off-list, executable and package: X4, A16
- `openable` resolves a symlink first: A19, A13
- `openable` relative path, option, empty, missing: audit. A20 gives `42 passed`, so the `-` check is an audit.

The catch in `mayOpen` returning false is an audit too: A21 gives `42 passed`, because a path already resolved by realpath fails `stat` only in a race.

**`tests/data/opens-in-program.test.ts`:**
- every listed extension in any case: D2, D6
- refuses double extension, off-list, extensionless and dotfile: X4 (run against the endpoint tests)
- empty list and a named list: D2
- every package suffix: D1, D2
- plain folders not packages: audit. No revert was run that turns it red.
- list read lowercased, null when unusable: D3, D4
- required at server start: D5

**`tests/server/context.test.ts`:** stops before building when the key is missing: K1.

**`tests/views/file.test.ts`:**
- `.docx` toolbar and download controls: F2
- none for a picture or PDF: F4
- list read from config (`.zip`): F1, F2, F4
- none while reading, none for `.md`: F3, F4
- none for off-list with download kept: F4
- none when no file chosen: F4

**`tests/views/type-scale.test.ts`**, File.svelte: F5.

**`tests/views/card-docs.test.ts`:**
- `.docx`/`.xlsx` controls: C1
- `.md` ToolButton: C2, C5
- picture and PDF links: C4
- off-list rows (`.pkg`, `.log`) links: C4
- list read from config (`.log`): C1, C3, C4
- no raw button: C5

**Other node tests:**
- `tests/views/collection.test.ts`, hub link on the list: E1, E2
- `tests/state/collection.test.ts`, `isHubPath`: E3
- `tests/boundaries.test.ts`: B1
- `tests/config-folder.test.ts`: G1

**`tests/browser/open-file.spec.ts`:**
- 1 `.docx` from the File view: B-body
- 2 refusal said and cleared: B-span
- 3 superseded refusal in the File view: R8
- 4 project card `.docx`: R1, R2, B-body
- 5 folder failure words: R12
- 6 collection card `.xlsx`: R3, R4, B-body
- 7 collection card superseded refusal: EC, R3

## Doc text

**HELP.md line 69**, current:

`| `projects` | Projects | The projects board, as cards or as a list, searchable, with the pin, the stale badge and the card's own controls. |`

Replacement:

`| `projects` | Projects | The projects board, as cards or as a list, searchable, with the pin, the stale badge and the card's own controls. An opened card lists the project's files of the extensions `file_index.ext` in `behavior.yml` names: a Markdown file, a script or a LaTeX source opens as a document tab, a file whose extension `open.program_ext` lists (a `.docx`, an `.xlsx`, a `.pptx`) opens in its program on this machine, and any other file is a link the browser opens or saves. |`

**HELP.md line 114.** The current line ends:

`... `document` (a local HTML file in a frame) and `file` (a picture, a PDF in a frame, or a name and a link that saves it).`

Replace that ending with:

`... `document` (a local HTML file in a frame) and `file` (a picture, a PDF in a frame, or a name and a link that saves it, with "Open in its program" in its bar and beside the link for a file whose extension `open.program_ext` in `behavior.yml` lists). A file of such an extension, a `.docx` or an `.xlsx` for example, opens in its program on this machine from the file view, from a project card's file list and from a collection card's link to a file of the hub, and no other file is offered. The page cannot see a file's mode, so a listed file that carries an execute bit, a Finder alias with a listed name, or a package folder is refused when the control is pressed, and the view says so.`

**HELP.md line 149**, current:

`| `behavior.yml` | Thresholds, horizons and cadences: read limits, stale days, the context window, the Live HPC settings, the audit's waiting statuses and mute list, the source editor's `editor.paint_limit_kb`, the update tasks' `tasks.skip_permissions`, git and chat. |`

Replacement:

`| `behavior.yml` | Thresholds, horizons and cadences: read limits, stale days, the context window, the Live HPC settings, the audit's waiting statuses and mute list, the source editor's `editor.paint_limit_kb`, the update tasks' `tasks.skip_permissions`, the extensions `open.program_ext` lets open in their program, git and chat. |`

**DESIGN.md line 124**, current:

`Paths resolve without environment variables: the command-line argument `--engine <dir>`, then `local.yml`, then a default derived from the file's own location. The hub path is the one value every machine must set and it lives in `config/local.yml`, gitignored and left out of the merge, so the tree carries no machine path. Roots the file browser may serve (step 7) are set in the app and stored in config; nothing outside a root is ever served.`

Replacement:

`Paths resolve without environment variables: the command-line argument `--engine <dir>`, then `local.yml`, then a default derived from the file's own location. The hub path is the one value every machine must set and it lives in `config/local.yml`, gitignored and left out of the merge, so the tree carries no machine path. Roots the file browser may serve (step 7) are set in the app and stored in config; nothing outside a root is ever served. The open action, `POST /api/open`, hands a folder or a file under those same roots, `browserRoots` with the saved workspace's own, to its program on this machine. The boundary is the roots, so a dotfile the tree leaves out of its listing is resolved like any other path under a root, and what may then be opened is a list of what may: a regular file whose extension `open.program_ext` of `behavior.yml` lists, with no execute bit and not a Finder alias, and a folder that is not a package.`

**DESIGN.md decision line:**

`- 2026-09-16, a file opens in its program: `POST /api/open` takes `{ path }`, absolute or relative to the hub, or `{ root, path }`, the key of a served root and a path under it, resolved through `resolveRootPath` with realpath on both ends over `browserRoots`, and hands the real path to macOS `open` only by an allow list, since `open` launches, installs, connects or runs whatever some program claims and no list of what may not open is ever whole. `open.program_ext` in `behavior.yml` is that list (`.docx .doc .xlsx .xls .pptx .ppt .odt .ods .odp .rtf .pages .numbers .key` checked in), read by `openSettings` beside `searchSettings`, required at server start, the default living in the file alone; `data/opens-in-program.ts` holds `opensInProgram(name, list)`, `isPackageName` and the lenient `programExtensions` the page reads. A regular file opens only when the extension of the asked name and of the real name, lowercased, are both on the list, its mode has no execute bit, and its first bytes are not a Finder alias (`book`, four bytes, `mark`, at most 16 bytes read, an unreadable file counted as one); a folder opens only when neither name ends in `.app .bundle .framework .plugin .kext .prefPane .saver .appex .xpc .pkg .mpkg .workflow .action .scptd .qlgenerator .mdimporter` and it holds no `Contents/Info.plist`. The answers are 400 on `root` for a key no root carries, 403 on `path` for a path outside the roots, 404 on `path` for nothing at a rooted path (the `{ path }` form answers that 403), 403 on `path` with `the file would run rather than open` for everything the allow rule refuses, and 500 when `open` fails. `openable`, the floor under `macOpener(list)` that the context's calendar and mail opener shares, resolves the real path first and applies the same rule to it and to the name it was given. The file view offers "Open in its program" for a file it holds whose extension is on the list, in its toolbar and beside the download; a project card's file row and a collection card's hub-relative link become that control on the same rule, reading the list from the configuration the page was sent; `file_index.ext` lists `.docx`, `.xlsx` and `.pptx` so a card shows them. The control's glyph is `open_program`, Lucide `app-window`. A refused open is said in the file view's bar and on a card through its `onsaid` line, an answer a later press superseded is dropped in all three, and a failed folder open on a project card says `project.card.folder_failed`. Package D16.`

## Files changed (whole step against base 76c3b390, `git diff --numstat`; new files by `wc -l`)

- `config/behavior.yml` +6/-1
- `config/glyphs.yml` +2/-0
- `config/icons.yml` +1/-0
- `config/text/views/file.yml` +3/-0
- `config/text/views/project.yml` +1/-0
- `src/lib/data/sources/config.ts` +18/-0
- `src/lib/server/context.ts` +4/-2
- `src/lib/server/open.ts` +169/-35
- `src/lib/state/collection.ts` +5/-0
- `src/lib/state/fs.ts` +2/-0
- `src/lib/state/selectors.svelte.ts` +11/-0
- `src/lib/state/writes.svelte.ts` +14/-1
- `src/lib/views/File.svelte` +71/-4
- `src/lib/views/collection/EntryCard.svelte` +38/-3
- `src/lib/views/shared/CardDetails.svelte` +1/-1
- `src/lib/views/shared/CardDocs.svelte` +39/-12
- `src/lib/views/shared/ProjectCard.svelte` +1/-1
- `src/routes/api/open/+server.ts` +9/-3
- `tests/boundaries.test.ts` +21/-18
- `tests/config-folder.test.ts` +2/-1
- `tests/routes/open.test.ts` +643/-30
- `tests/server/context.test.ts` +39/-0
- `tests/state/collection.test.ts` +21/-0
- `tests/views/collection.test.ts` +35/-0
- `tests/views/file.test.ts` +92/-2
- `tests/views/type-scale.test.ts` +1/-1
- New: `src/lib/data/opens-in-program.ts` (76), `tests/data/opens-in-program.test.ts` (98), `tests/views/card-docs.test.ts` (209), `tests/browser/open-file.spec.ts` (275)
- Removed in this round: `src/lib/data/runs-when-opened.ts` and `tests/data/runs-when-opened.test.ts`, both new in round 1 and never on base.

## Decisions and limits

- **Removed code.** `drawnInPage` and `DRAWN_TEXT` had no reader once the cards read the allow list, so they are gone (round 1 items 4 and 7 are superseded by this ruling).
- **Context opener list.** The context's opener, used by the calendar and mail routes for `https` links, is built from the list read at start. The route reads `locals.server.config`, which is also the start configuration, so both see the same list.
- **Not run.** What `open` does with each listed extension, or with a refused type, was not run. The alias detection matches the bookmark header the ruling names; a pre-bookmark alias of another format is not recognised, and that was not verified on a real alias.
- **Unverified mount.** On a filesystem that marks every file executable, every file is refused. Not verified.
- **Scratch folder.** Scratch copies for this round are under `scratchpad/d16-builder` only. I deleted my round 1 and 2 backup copies and scripts from the scratchpad root.
- **Unrun suites.** The full browser suite was not run; only the three specs above.


# Repair round 4

Everything in repair round 4 is done. One instruction clashed with a green suite: I could not carry `desc_behavior` in `config/text/views/config.yml` in this round. `tests/views/help.test.ts` ("describes every configuration file in the words the Config view shows") requires that line to be byte-equal to HELP.md:149, and HELP.md stays unedited, so changing only the catalog line turns the suite red. The line is unchanged, and its new text is under Doc text, to be applied together with HELP.md:149 at landing.

## Items

| # | Item | State | Proof |
|---|---|---|---|
| 1 | The program is named | DONE | `config/behavior.yml` `open.program_ext` is now a map (see Doc text). Bundle ids read with `/usr/libexec/PlistBuddy -c 'Print CFBundleIdentifier' <app>/Contents/Info.plist`: Word `com.microsoft.Word`, Excel `com.microsoft.Excel`, PowerPoint `com.microsoft.Powerpoint`, Keynote `com.apple.iWork.Keynote`, TextEdit `com.apple.TextEdit`. `mdls -name kMDItemCFBundleIdentifier` answered "could not find" for every app here. Pages and Numbers are not installed (`ls /Applications`), so their ids are the ruling's and unverified. No LibreOffice or OpenOffice is installed, so I found no bundle id and `.odt .ods .odp` are left out. The file opener runs `execFile('/usr/bin/open', ['-b', id, realPath])`. `man open` documents no `--` separator, so none is passed; the real path is absolute, starts with `/`, and is never read as an option, and the id must match `^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$`. Kept refusals: both the asked and the real extension must have an entry (the real one's app is used), no execute bit, no `book`/`mark` head. Added: `readFinderInfo` runs `execFile('/usr/bin/xattr', ['-px', 'com.apple.FinderInfo', path])` with no shell. Absence (stderr "No such xattr") counts as not flagged. Any other failure, including `[Errno 13] Permission denied` on a mode-000 file (seen by running xattr on such a file), refuses. Bit 0x80 of byte 8 refuses. Proof: `npx vitest run tests/routes/open-program.test.ts` gives 24 passed, `tests/data/opens-in-program.test.ts` 6 passed. |
| 2 | Folders are revealed | DONE | A directory always becomes `{ kind: 'folder' }`, and the opener runs `['-R', realPath]`. The package-suffix rule and the `Contents/Info.plist` check are gone. `Tool.app` holding `Contents/Info.plist`, `Pane.prefPane` and a plain folder are all revealed ("reveals a plain folder, an application bundle and a folder holding Contents/Info.plist"). A symlink `linkdir.docx -> sub` is revealed as the folder `sub` (case "reveals a symlink named like a document that points at a folder, as that folder"). No folder can be refused by the program rule, so the refusal sentence keeps "the file would run rather than open" and applies to files only. The folder control's words were untrue after the change; this is a user-visible change: `project.helper.folder_tip` goes from "open project folder" to "show the project folder in Finder", and `project.card.folder_failed` becomes "The folder could not be shown in Finder: {0}". |
| 3 | Live map on each request | DONE | The route passes `() => openSettings(loadConfig(locals.server.engine).config).programApps` and `locals.server.openPath`, and `handleOpen` calls it once per request. The context keeps `openSettings(config)` at start as a check only, and gains `openPath: macOpenPath` (the https `opener` is now `macOpenAddress`). Case "reads open.program_ext from the configuration on disk at every request" rewrites the engine's `config/behavior.yml` between four POSTs through the real route: `.xlsx` to Excel gives 200 with Excel; `.xlsx` to Numbers gives 200 with Numbers; `.docx` only gives 403; an unusable list gives 500 naming the key. The injected `openPath` records both targets. |
| 4 | Smaller findings | DONE | See "Item 4 in detail" below. |
| 5 | Before and after, wire answers, Doc text | DONE | See those sections below. |

## Item 4 in detail

- **Project card superseded press.** New browser case "a project card's refusal that lands after a later press has opened the file is never said". R8 turns it red. R8 now reverts the one guard in `ProgramButton.svelte`, which all four places use.
- **Pinned `mark`.** Case "opens a file that starts with book but has no mark after it". P1 turns it red.
- **Pinned asked-name half.** Case "refuses a symlink whose asked name has no application, pointing at a listed file". P2 turns it red.
- **Pinned no-control-before-config.** `file.test.ts` "draws none before the configuration has arrived, and keeps the download" and `card-docs.test.ts` "draws no program control before the configuration has arrived". F0 (selector fallback `?? { '.docx': ... }`) turns both red.
- **False sentences fixed.** `open.ts` is rewritten, the old :92-95 claim is gone and its head now states the reveal rule. The `opens-in-program.ts` head says what the page can and cannot see, and that the page's hide happens before the server's refusal. `behavior.yml`'s comment now reads: "A file of any other extension, and a listed file with an execute bit or marked as a Finder alias, is refused; a folder is shown in Finder rather than opened. Read again at every request."
- **`desc_behavior`.** Not carried; see the first paragraph.
- **Listed `.rtf` whose bytes are text.** The source tab now draws the same control in its bar for a listed extension: `Source.svelte`, `{#if !blocked && opensInProgram(path, programApps())}`. Case "carries the program control in its bar for a listed .rtf, and none for a Markdown file"; S1 and S2 turn it red.
- **One shared control.** The four copies of the press are now `views/shared/ProgramButton.svelte`: the per-control supersede counter, and a failure said through `onsaid` on the cards or inline beside the control in the File view and source tab. Consequence: the File view's two controls each keep their own counter and failure line.
- **Card failure line.** The card browser cases now assert the refusal on the view's `p.said` line. Rc and R4 (dropping `{onsaid}`) turn them red.
- **Refusal sentence.** See item 2.
- **Rename grep.** `grep -rn "runsWhenOpened\|runs-when-opened\|bundleRunsWhenOpened\|drawnInPage\|DRAWN_TEXT\|macOpen\b\|macOpener\|programExt\b\|programExtensions\|isPackageName" src tests config HELP.md DESIGN.md README.md` printed nothing (exit 0). A fixture parameter hit was renamed to `map`.
- **Open-names grep.** `grep -rn "open-folder\|openFolder\|api/open" src tests config HELP.md DESIGN.md README.md` hits:
  - `writes.svelte.ts:42,60,165,417`
  - `ProjectCard.svelte:29,217`
  - `ProgramButton.svelte:3` (head comment)
  - `tests/browser/open-file.spec.ts:8,75,89,175,180,228,233,288,293`
  - `tests/routes/open-fixture.ts:104`
  - `tests/routes/open.test.ts:14,29,35,414,451,481,515`

  No hits in HELP.md, DESIGN.md, README.md or config.

## Verification (from `tools/oculus` in the worktree)

1. `npm test -- --reporter=dot`: `Test Files 231 passed (231)`, `Tests 3852 passed (3852)`.
2. `npm run check`: `COMPLETED 1160 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
3. `npm run build`: exit 0, `✓ built in 6.11s`.
4. `npm run format:check`: `All matched files use Prettier code style!`
5. `npm run lint`: exit 0, no problems printed.
6. Perl ASCII gate: printed nothing.
7. `find src tests bin -type f | xargs wc -l | sort -n | tail -3`: `970 tests/state/layout.test.ts`, `979 tests/state/board.test.ts`, `155119 total`.
8. `npx playwright test tests/browser/open-file.spec.ts tests/browser/board.spec.ts tests/browser/collection.spec.ts`, after that build: `18 passed (33.0s)` (8 open-file, 5 board, 5 collection).

No test runs macOS `open`: every route and endpoint case injects the opener, the browser spec answers `/api/open` with a Playwright route, and the floor tests call `openable`/`openArgs` only. One revert was not run for that reason: the route passing no `openPath` would fall back to `macOpenPath` and launch Excel. The route case asserts the injected `openPath` was called, and that stands as the proof that the route uses it.

## Reverts run per new or changed test

Each revert was applied, its test file run, and the source restored. Scripts and logs are under `scratchpad/d16-builder`.

**Node revert keys** (`server/open.ts` unless named):
- P1 no `mark` check
- P2 asked-name check dropped
- P3 app taken from the asked name
- P4 execute bit dropped in `safeFile`
- P4b same, run against the floor tests
- P5 bookmark head dropped
- P6 alias flag dropped
- P7 FinderInfo read failure not refused
- P8 absence of FinderInfo throws
- P9 alias bit 0x04
- P10 folders refused
- P11 `.app` folders refused
- P12 no `-b`
- P13 no `-R`
- P14 floor without realpath
- P15 floor without bundle-id check
- P16 floor accepts any folder
- P17 address takes any scheme
- P18 map read throws instead of 500
- P19 route reads the start config
- P20 unreadable file not counted as a bookmark
- P21 floor absolute and dash check dropped
- P22 `openTarget` catch reveals
- A-dir-only
- A-missing-outside
- A-outside-404
- A-no-root-loop
- A-unknown-root
- A-no-path-type
- A-no-token
- A-500-words
- A-R5 rooted unnarrowed
- A-R6 plain unnarrowed
- A-route-roots
- A-client-body
- D1 entry check dropped
- D2 no lowercase
- D3 keys not lowercased
- D4 no bundle-id check in the reader
- D5 loose bundle-id pattern
- D6 settings never throw
- D7 `.key` dropped from `behavior.yml`
- D8 every name has an app
- K1 context skips `openSettings`
- F0 selector fallback map
- F1 File view fixed map
- F2 other-block control off
- F3 `holds = src !== ''`
- F4 toolbar control always
- F5 `ProgramButton` `.failed` size removed
- S1 source control off
- S2 source control for every file
- C1 card program branch off
- C2 readable branch off
- C3 card fixed map
- C4 card program branch always
- E1 entry program branch off
- E2 entry drops `isHubPath`
- B1 boundaries row removed

**Browser revert keys:**
- R1 card path without the folder
- R2 card `root=""`
- Rc card drops `{onsaid}`
- R3 entry `root=""`
- R4 entry drops `{onsaid}`
- R8 supersede guard removed in `ProgramButton`
- R12 folder words back to `editor.failed`
- B-body `openFile` posts `{ path }`
- B-span `ProgramButton` failure line never drawn

**`tests/routes/open.test.ts`:**
- requires the write token: A-no-token
- requires a path: A-no-path-type
- directory outside every root: A-no-root-loop
- hub-relative folder: P10
- file by root and path: A-dir-only
- workspace root key: A-dir-only
- folder by root and path: P10
- hub-relative and absolute file: A-dir-only
- engine root: A-dir-only
- saved workspace root: A-dir-only
- hands the route the file browser's roots: A-route-roots, A-missing-outside, P19
- reads open.program_ext at every request: P19, P18, A-route-roots
- missing file: A-missing-outside
- `..`: A-outside-404, A-no-root-loop
- symlink outside: A-outside-404, A-no-root-loop
- absolute path with root: A-outside-404
- root keys: A-unknown-root
- path not a string: A-no-path-type
- no token on a file: A-no-token
- 500 wording: A-500-words
- client posts root and path: A-client-body
- client unknown root: A-client-body, A-unknown-root
- client outside root: A-no-root-loop
- both stale-token cases: A-no-token, P10

**`tests/routes/open-program.test.ts`:**
- every listed extension: P8, D8, A-dir-only
- mixed case: D2, P8
- 0644 `.docx`: P8, D8
- double extension and off-map types: D8
- executable, and listed with execute bit: P4, P4b
- bookmark head: P5
- `book` without `mark`: P1
- alias flag: P6, P9
- FinderInfo read failure: P6, P7
- `readFinderInfo`: P8
- asked name off map: P2
- listed name to off-map file: P3
- unreadable listed file: audit for P20 alone (24 passed), because the FinderInfo read of that file also fails (Errno 13, seen above); A-dir-only red
- `.txt` map: P8, D8
- reveals folders including bundles: P10, P11
- document-named symlink to a folder: P10
- 500 when the map cannot be read: P18
- FIFO: A-R5, A-R6
- `openArgs`: P12, P13
- floor takes a folder and a listed file: P8
- floor refusals: P15, P16, P4b
- floor resolves the path first: P14
- floor relative, option, missing: audit (P21 24 passed; the real-path check refuses them too)
- `openableAddress`: P17

`openTarget`'s catch is an audit too: P22 gives 24 passed, since the path was just resolved and a stat fails only in a race.

**`tests/data/opens-in-program.test.ts`:**
- application per extension in any case: D2, D7, D8
- none for double extension and off-map: D8, D1
- inherited key and empty map: D1, D2, D8. Replacing `Object.hasOwn` with an `undefined` check alone stays green, because every key carries a dot.
- reader lowercases and nulls: D3, D4
- bundle-id shape: D5
- required at start: D6

**Other node test files:**
- `tests/server/context.test.ts`, stops before building: K1
- `tests/views/file.test.ts`:
  - `.docx` two controls: F2
  - none for picture/PDF: F4
  - `.zip` map from config: F1, F2, F4
  - none while reading and for `.md`: F3, F4
  - none before config: F0, F1, F4
  - none off the map: F4
  - none with no file: F4
- `tests/views/type-scale.test.ts`, `shared/ProgramButton.svelte`: F5
- `tests/views/source.test.ts`, `.rtf` control: S1, S2
- `tests/views/card-docs.test.ts`:
  - `.docx`/`.xlsx`: C1
  - `.md`: C2
  - picture/PDF links: C4
  - off-map links: C4
  - `.log` map from config: C1, C3, C4
  - none before config: F0, C3, C4
  - no raw button: not rerun this round (C5 in round 3)
- `tests/views/collection.test.ts`: E1, E2
- `tests/boundaries.test.ts`: B1

**`tests/browser/open-file.spec.ts`** (8 cases):
1. `.docx` from the File view: B-body (the run with B-body gave `3 failed, 5 passed`; I did not capture which three)
2. refusal said and cleared: B-span
3. File view superseded: R8
4. project card `.docx`: R1, R2, Rc
5. project card superseded: R2, R8
6. folder words: R12
7. collection card `.xlsx`: R3, R4
8. collection card superseded: R3, R8

## Before (main at 76c3b390) and after, for every user-visible change of the step

- **Project card folder control.**
  - Before: `open <folder>` under the hub, the engine config folder and the configured roots only. Finder opened a window on the folder, and a package folder was launched. Tooltip "open project folder". Failure "not saved: the folder could not be opened: ...".
  - After: `open -R <real folder>`: Finder selects the folder in its parent's window and nothing is launched. Also works under a saved workspace's roots. Tooltip "show the project folder in Finder". Failure "The folder could not be shown in Finder: ...".
- **Project card file list.**
  - Before: readable rows (READABLE) were accent-coloured raw buttons that opened the document view. Every other listed row was a link. No office file was listed.
  - After: readable rows are bordered `ToolButton`s that open the document view. `file_index.ext` also lists `.docx .xlsx .pptx`. A row whose extension `open.program_ext` maps is a bordered control with the `open_program` glyph (Lucide `app-window`) and the tooltip "Open in its program"; it opens the file in the named application, and the card offers no download of it. Every other row is a link.
- **Collection card `link` to a hub file.**
  - Before: an `<a>` to `/api/file/hub/...`.
  - After: for an extension the map names, the same control as the project card row; any other link is unchanged.
- **File view.**
  - Before: Download and "Open in a browser tab".
  - After: "Open in its program" in the toolbar and beside Download, for a held file (its bytes are known not to be text) whose extension is mapped. A refusal is said beside the control.
- **Source tab.**
  - Before: no such control.
  - After: "Open in its program" in its bar for a mapped extension, for example a `.rtf` whose bytes are text.
- **Refusals the reader sees.** Before, there was no file open. After, "The file could not be opened: the file would run rather than open" for a mapped file with an execute bit, a bookmark head, an alias flag or a FinderInfo read failure. The page cannot see these, so the control is drawn and the refusal comes when it is pressed.
- **Config.**
  - Before: no `open` key.
  - After: `open.program_ext` map in `behavior.yml`. The server refuses to start without a usable map. An edit applies to the endpoint at the next request, and to the page when the config channel pushes it.
- **Glyph.** New `open_program` in `glyphs.yml` (ascii `[o]`) and `icons.yml` (`app-window`).
- **Not offered.** `.odt .ods .odp` get no control and are refused. Pages and Numbers files are offered, but if the app is missing `open -b` fails and the answer is the 500 below; that failure was not run.

## Wire answers of `POST /api/open` now

- 403 `the request did not come from this page`
- 403 `the write token is missing or stale`
- 400 `the body is not JSON`
- 400 `the path is required`
- 500 `config/behavior.yml: open.program_ext must map extensions, each with its dot, to bundle ids`, when the map on disk cannot be read. It is checked before the path is resolved.
- 400, `refused` on `root`: `the root names no served root`
- 403, `refused` on `path`: `the path is outside the configured roots`. The `{ path }` form also answers this for a missing path, or one that is neither a file nor a folder.
- 404, `refused` on `path`: `there is no file or folder at the path` (`{ root, path }` form only)
- 403, `refused` on `path`: `the file would run rather than open`, for a regular file whose asked or real extension has no entry, with an execute bit, with a bookmark head, with the FinderInfo alias flag, or whose FinderInfo read fails for any reason but absence, or which cannot be read. A folder is never refused here.
- 500 `the path could not be opened: <reason>`, when the opener fails; for `open` the reason is its stderr.
- 200 `{ ok: true, changed: [], refused: [] }`. The opener was handed `{ kind: 'file', path, app }` (`open -b app path`) or `{ kind: 'folder', path }` (`open -R path`).

## Doc text

**HELP.md line 69**, current:

`| `projects` | Projects | The projects board, as cards or as a list, searchable, with the pin, the stale badge and the card's own controls. |`

Replacement:

`| `projects` | Projects | The projects board, as cards or as a list, searchable, with the pin, the stale badge and the card's own controls. An opened card lists the project's files of the extensions `file_index.ext` in `behavior.yml` names: a Markdown file, a script or a LaTeX source opens as a document tab, a file whose extension `open.program_ext` maps to an application (a `.docx`, an `.xlsx`, a `.pptx`) opens in that application on this machine, and any other file is a link the browser opens or saves. The folder control shows the project folder in Finder. |`

**HELP.md line 114.** The current line ends:

`... `document` (a local HTML file in a frame) and `file` (a picture, a PDF in a frame, or a name and a link that saves it).`

Replace that ending with:

`... `document` (a local HTML file in a frame) and `file` (a picture, a PDF in a frame, or a name and a link that saves it). A file whose extension `open.program_ext` in `behavior.yml` maps to an application opens in that application on this machine, and in no other: the control "Open in its program" is in the file view's bar and beside its link once the view holds the file, in the source tab's bar for such a file whose bytes are text (a `.rtf`), on a project card's file list and on a collection card's link to a file of the hub. No other file is offered. The page cannot see a file's mode or its Finder attributes, so a mapped file with an execute bit or marked as a Finder alias is refused when the control is pressed, and the view says so.`

**HELP.md line 149**, current:

`| `behavior.yml` | Thresholds, horizons and cadences: read limits, stale days, the context window, the Live HPC settings, the audit's waiting statuses and mute list, the source editor's `editor.paint_limit_kb`, the update tasks' `tasks.skip_permissions`, git and chat. |`

Replacement:

`| `behavior.yml` | Thresholds, horizons and cadences: read limits, stale days, the context window, the Live HPC settings, the audit's waiting statuses and mute list, the source editor's `editor.paint_limit_kb`, the update tasks' `tasks.skip_permissions`, the application `open.program_ext` names for each extension that may open, git and chat. |`

**`config/text/views/config.yml` line 5**, to be applied together with HELP.md:149 (`tests/views/help.test.ts` holds them equal). Current:

`        desc_behavior: "Thresholds, horizons and cadences: read limits, stale days, the context window, the Live HPC settings, the audit's waiting statuses and mute list, the source editor's `editor.paint_limit_kb`, the update tasks' `tasks.skip_permissions`, git and chat."`

Replacement:

`        desc_behavior: "Thresholds, horizons and cadences: read limits, stale days, the context window, the Live HPC settings, the audit's waiting statuses and mute list, the source editor's `editor.paint_limit_kb`, the update tasks' `tasks.skip_permissions`, the application `open.program_ext` names for each extension that may open, git and chat."`

**DESIGN.md**, the paragraph starting "Paths resolve without environment variables" (line 124 in the worktree, 125 on main). Current:

`Paths resolve without environment variables: the command-line argument `--engine <dir>`, then `local.yml`, then a default derived from the file's own location. The hub path is the one value every machine must set and it lives in `config/local.yml`, gitignored and left out of the merge, so the tree carries no machine path. Roots the file browser may serve (step 7) are set in the app and stored in config; nothing outside a root is ever served.`

Replacement:

`Paths resolve without environment variables: the command-line argument `--engine <dir>`, then `local.yml`, then a default derived from the file's own location. The hub path is the one value every machine must set and it lives in `config/local.yml`, gitignored and left out of the merge, so the tree carries no machine path. Roots the file browser may serve (step 7) are set in the app and stored in config; nothing outside a root is ever served. The open action, `POST /api/open`, works on those same roots, `browserRoots` with the saved workspace's own: a folder under them is revealed in Finder and a file is opened in the one application `open.program_ext` of `behavior.yml` names for its extension. The boundary is the roots, so a dotfile the tree leaves out of its listing is resolved like any other path under a root.`

**DESIGN.md decision line:**

`- 2026-09-16, a file opens in the program its extension names: `POST /api/open` takes `{ path }`, absolute or relative to the hub, or `{ root, path }`, the key of a served root and a path under it, resolved through `resolveRootPath` with realpath on both ends over `browserRoots`. A folder is revealed, `/usr/bin/open -R <real path>`, so Finder selects it in its parent's window and no application or installer bundle is ever launched; a symlink named like a file that points at a folder is revealed as that folder. A file is opened only by `/usr/bin/open -b <bundle id> <real path>`, the bundle id `open.program_ext` of `behavior.yml` maps its extension to (`.docx .doc` Word, `.xlsx .xls` Excel, `.pptx .ppt` PowerPoint, `.rtf` TextEdit, `.pages .numbers .key` iWork, checked in; no `--`, since `open`'s manual documents none and the real path starts with `/`), so neither a per-file Open With choice nor the machine's default for the type picks the program; the extension of the asked name and of the real name must both be mapped, and the real one's application is used. A mapped file is still refused when its mode has an execute bit, when its first bytes are a Finder bookmark (`book`, four bytes, `mark`, at most 16 bytes read), or when `com.apple.FinderInfo`, read with `/usr/bin/xattr -px` and no shell, carries the alias flag (bit 0x80 of byte 8); an absent attribute is not flagged and any other read failure refuses. The map is read from the configuration on disk at every request, through `openSettings` beside `searchSettings`, and the server also requires it at start; `data/opens-in-program.ts` holds `programApps`, `programFor`, `opensInProgram` and `isBundleId`, which the page reads out of the configuration it was sent. The answers are 400 on `root` for a key no root carries, 403 on `path` outside the roots, 404 on `path` for nothing at a rooted path (the `{ path }` form answers that 403), 403 on `path` with `the file would run rather than open` for every file the rule refuses, 500 naming the key when the map cannot be read, and 500 when `open` fails. `macOpenPath`, the context's `openPath`, holds a floor of its own: `openable` requires the path to be its own real path, a folder for a folder, and for a file no execute bit, no bookmark head, no alias flag and an application named by a bundle id; the calendar and mail links go through `macOpenAddress`, `https` only. `views/shared/ProgramButton.svelte` is the one control, offered for a mapped name in the file view's bar and beside its download once the view holds the file, in the source tab's bar, on a project card's file row and on a collection card's hub-relative link; `file_index.ext` lists `.docx`, `.xlsx` and `.pptx` so a card shows them. Its glyph is `open_program`, Lucide `app-window`. A refused open is said beside the control, or on a card through its `onsaid` line; an answer a later press of the same control superseded is dropped. The project card's folder control says `show the project folder in Finder` and a failure `The folder could not be shown in Finder`. Package D16.`

## Files changed (whole step against base 76c3b390, `git diff --numstat`; new files by `wc -l`)

- `config/behavior.yml` +16/-1
- `config/glyphs.yml` +2/-0
- `config/icons.yml` +1/-0
- `config/text/views/file.yml` +3/-0
- `config/text/views/project.yml` +2/-1
- `src/lib/data/sources/config.ts` +18/-0
- `src/lib/server/context.ts` +12/-6
- `src/lib/server/open.ts` +270/-41 (354 lines)
- `src/lib/state/collection.ts` +5/-0
- `src/lib/state/fs.ts` +2/-0
- `src/lib/state/selectors.svelte.ts` +11/-0
- `src/lib/state/writes.svelte.ts` +16/-2
- `src/lib/views/File.svelte` +36/-4
- `src/lib/views/Source.svelte` +9/-2
- `src/lib/views/collection/EntryCard.svelte` +25/-2
- `src/lib/views/shared/CardDetails.svelte` +1/-1
- `src/lib/views/shared/CardDocs.svelte` +26/-12
- `src/lib/views/shared/ProjectCard.svelte` +1/-1
- `src/routes/api/open/+server.ts` +10/-3
- `tests/boundaries.test.ts` +21/-18
- `tests/config-folder.test.ts` +2/-1
- `tests/routes/open.test.ts` +387/-71 (519 lines)
- `tests/server/context-fixture.ts` +1/-0
- `tests/server/context.test.ts` +39/-0
- `tests/state/collection.test.ts` +21/-0
- `tests/views/collection.test.ts` +35/-0
- `tests/views/file.test.ts` +101/-2
- `tests/views/source.test.ts` +17/-0
- `tests/views/type-scale.test.ts` +1/-0
- New:
  - `src/lib/data/opens-in-program.ts` (70)
  - `src/lib/views/shared/ProgramButton.svelte` (67)
  - `tests/routes/open-fixture.ts` (125)
  - `tests/routes/open-program.test.ts` (350)
  - `tests/data/opens-in-program.test.ts` (99)
  - `tests/views/card-docs.test.ts` (218)
  - `tests/browser/open-file.spec.ts` (301)

## Limits and decisions

- **Not run.** What `open -b` and `open -R` do was not run, and neither was what happens when a mapped app (Pages, Numbers) is not installed.
- **Alias detection.** It covers the bookmark head in the data fork and the FinderInfo alias flag. A legacy alias with neither was not produced and is not covered.
- **Cost.** `xattr` is spawned once per file open request; not measured.
- **Races.** A path swapped between the checks and `open` is not covered.
- **Two File view controls.** Each keeps its own supersede counter and failure line, since they are two `ProgramButton`s.
- **Test fixtures.** The open tests moved into `open-fixture.ts` and a second file, `open-program.test.ts`, to keep `open.test.ts` under the size its concern needs.
- **Not booked.** The unbooked user-visible shapes the third review names still need booking by the orchestrator: the `file_index.ext` default, the refusal sentence, the 404 rooted-missing answer and the `open_program` glyph. This round adds more: the map-shaped `open.program_ext`, the reveal of folders, and the folder control's new words.
- **Not run.** The full browser suite; only the three specs above.
- **Scratchpad.** Scratch files for this round are only under `scratchpad/d16-builder`.
