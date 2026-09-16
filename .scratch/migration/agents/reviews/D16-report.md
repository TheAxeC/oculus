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
