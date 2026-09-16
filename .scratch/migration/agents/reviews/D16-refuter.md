# Step D16 refuter report (on .agents/worktrees/d16, base 8601f148)

## Verification (rerun by the reviewer)
All from `tools/oculus` in the worktree, PATH with node v24.21.0.
- `npx vitest run --reporter=dot`: `Test Files 229 passed (229)`, `Tests 3817 passed (3817)`. Matches the report.
- `npm run check`: `COMPLETED 1155 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`. Matches.
- `npm run build`: exit 0. Matches.
- `npm run format:check`: `All matched files use Prettier code style!`. Matches.
- `npm run lint`: exit 0. Matches.
- ASCII perl gate over `src tests bin config`: printed nothing. Matches.
- `find src tests bin -type f | xargs wc -l | sort -n | tail -3`: 970 layout.test.ts, 979 board.test.ts, 153968 total. Matches. `find ... -print0 | xargs -0 wc -l | grep -v total | sort -n | tail -3` also gives 979 as the largest file.
- `npx playwright test tests/browser/open-file.spec.ts`: the first try was refused because pid 90323 held the lock. The retry gave `2 passed (7.1s)`. The report says 7.2s.
- Per-file counts the report quotes: open.test.ts 27, fs.test.ts 53, file.test.ts 17, card-docs.test.ts 4, views/collection.test.ts 49. All match. state/collection.test.ts gives 55; the report quotes no count for it.
- `git status --short` lists the 16 modified files and the 2 new files the report names.

## 1. Spec
- Brief premise about DESIGN.md: I reproduced the report's claim. `grep -n "api/open\|open-folder\|file browser" DESIGN.md` hits lines 23, 124, 270, 299, 302, 308, 309, 313, 314 and 317, and none of them names the open action. `grep -n -i "open.*folder\|folder.*open\|macOS" DESIGN.md HELP.md README.md` also finds no line about the folder-open action. HELP.md has no line about the project card's file list either.
- `src/lib/views/shared/CardDocs.svelte:108-111`: the readable row changed from a raw `<button class="fname">` to `ToolButton`, and the `.fname` rules for border, background, font, padding, cursor and text-align are gone (`:180-183`). No brief item asks for this. The spec's "every control a reader presses is a ui/ primitive" rule justifies it. The report states it as judgement call 5.
- `src/lib/state/writes.svelte.ts:42`: the new export `OPEN_PATH` and the new pure helper `isHubPath` in `state/collection.ts:254` are not named in the brief. Both are internal and are listed in the report (judgement call 7 and row 4).
- `src/lib/server/open.ts:124` and `:113`: a missing path in the `{ root, path }` form gets a 404 on `path`, which the brief does not name. The same missing path in the `{ path }` form gets a 403 "outside". This is a status and sentence shape of the wire answer. The report lists it as judgement call 1, so it is not silent, but it is a wire-format decision to book.
- No other change outside the brief's items was found. No substitute mechanism: the rooted form reuses `resolveRootPath` from `server/files.ts:103`.

## 2. Proof
Security of `server/open.ts`. I probed it with a test file written only in a scratch copy (`scratchpad/rev/oculus/tests/routes/probe-open.test.ts`) and ran it there with `npx vitest run`. No branch handed the opener a path outside every served root:
- A root whose dir is a symlink: `{root:'hub', path:'sub/a.docx'}` and the absolute path through the symlink both give 200, and the opener gets the real path inside the real root.
- A symlinked directory inside the root pointing outside, as a folder and as a file inside it, in both forms: 403, opener not called.
- `..` gives 403. `.` gives 200 on the root folder itself.
- An absolute path outside, given with a root: 403.
- An absolute path inside another root, given with `root:'hub'`: 403, which is stricter than the plain form.
- A `-`-leading file reached through a symlink out of the root: 403. Every path reaching the opener is an absolute real path, so it never starts with `-`.
- A JSON own `__proto__` key holding `root`: `'root' in body` is false, so it is the plain form, resolved inside the hub.
- `root:'toString'`: 400. A NUL byte in the path: 404. A FIFO inside the root: 404 rooted, 403 plain.

Findings:
- **Executable files reach `open`, and the report does not name this risk.** `open.ts:45-52` admits any regular file, and `CardDocs.svelte:112-118` and `EntryCard.svelte:141-150` turn every name that `drawnInPage` rejects into a one-press control. `drawnInPage` returns false for `run.command`, `reproduce` (no extension), `x.terminal`, `x.fileloc`, `x.webloc`, `x.workflow`, `x.pkg`, `x.jar` and `Foo.app`. I checked this with `node -e "import('./src/lib/state/fs.ts')..."`. On macOS, `open` on a `.command` file, a `.terminal` file or an executable binary runs it in Terminal. I did not verify this by running it. A project card row for an extensionless script, or a collection entry whose `link` value (hub data, untrusted under the spec's rule) names such a file, is one press from running it. The report's Limitations have no line on this, and no test or booked decision covers it.
- **The cards' press is unproven. The brief's "What it must do" says the cards "call openFile", and no test fails when the call is removed.** I ran these reverts on the scratch copy:
  - R1: `CardDocs.svelte:56` posts `openFile("hub", path)` without the folder. card-docs.test.ts and open.test.ts: `31 passed`.
  - R2: `CardDocs.svelte:56` makes no call. card-docs.test.ts: `4 passed`.
  - R3: `EntryCard.svelte:148` makes no call. views/collection.test.ts: `49 passed`.
  - R4: `EntryCard.svelte:149` drops `onsaid`. views/collection.test.ts: `49 passed`.

  The report says in Limitations that the cards are checked only by server rendering. Under the spec ("a behaviour that needs a DOM (a press...) is proven in the browser suite") this is a gap, not coverage.
- **The File view's asynchronous handling is unproven.**
  - R7: `File.svelte:154`, `refusal.key === held` changed to `true`. file.test.ts: `17 passed`, and the browser spec never changes the file.
  - R8: `File.svelte:164`, `mine !== presses ||` removed. file.test.ts: `17 passed`.

  Report judgement call 4 claims both behaviours. The spec requires every asynchronous path to be exercised in flight, after close and when a later press supersedes it; neither the File view nor the cards' `openInProgram` has such a case.
- **The regular-file narrowing is untested.**
  - R5: `open.ts:124` changed to `return found.path;`. open.test.ts: `27 passed`.
  - R6: `open.ts:67` removed. open.test.ts: `27 passed`.

  Both let a FIFO or socket inside a root reach the opener. `macOpen`'s `openable` still refuses it, but no test holds the endpoint's own rule.
- R9: the `-` check removed from `openable` (`open.ts:87`). open.test.ts: `27 passed`. The report states this.
- Reverts that do turn tests red:
  - R10: `allowed` uses `resolve` instead of `realpathSync`. 4 failed.
  - R11: the unknown-root check dropped. 2 failed, which reproduces the report's row.
  - The report's unmeasured browser-spec revert: I measured it. With the `{#if failed !== ''}` span removed from `File.svelte:186-188` in the copy, `npm run build` then `npx playwright test tests/browser/open-file.spec.ts` gave `1 failed, 1 passed`, the refusal case failing at line 110.
- Tests with no named revert (spec: every new or changed test names the revert that turns it red):
  - card-docs.test.ts: "draws a .md as the ui/ToolButton...", "keeps a picture and a PDF a link..." and "draws no raw button".
  - file.test.ts: "draws it in the toolbar of a picture and a PDF" and "draws none while no file is chosen".
  - open.test.ts, per case: the `..` climb, the symlink escape, the absolute path with a root, the missing token, the 500 wording, the engine key, and the client's unknown-root no-retry case.

  The report's Reverts section names reverts by file and count, not by test.
- Report line reference: "`writes.openFile(root, path)` is at `src/lib/state/writes.svelte.ts:170`". The function is at line 173; line 170 is inside its doc comment. The other cited lines (42, 61, `Collection.svelte:261,295`) match.
- No module-level mutable state was added. `presses` and `refusal` in `File.svelte:145-148` are per component instance, and `DRAWN_TEXT` (`fs.ts:140`) is a constant that is never mutated. No test asserts a defect. No predicate was widened; `type-scale.test.ts:43` adds the new `.failed` class rather than loosening anything.

## 3. Standards
- `src/lib/server/open.ts:1-3`, the head comment: "so what can be opened in its program is exactly what the file browser shows". This is false. The tree leaves out dotfiles and `node_modules`, `__pycache__` and `.git` (`server/fs.ts:64,200`), but the endpoint opens them (for example `{root:'hub', path:'.git/hooks/pre-commit'}` resolves inside the root). The same claim is in the route head comment (`src/routes/api/open/+server.ts:1`, "a path under the roots the file browser serves", which is accurate) and in the report's proposed DESIGN.md text for line 124 ("what the file browser shows is exactly what can be opened"), which is false for the same reason.
- `src/lib/views/shared/CardDocs.svelte:5-6`, the head comment: "a file the page draws (a picture, a PDF, a page) is a link the browser opens". A page (`.html`) matches `READABLE` and never reaches that branch. What does reach it is pictures, PDFs and language files outside `READABLE` (`.toml`, `.ipynb`, `.jl`, `.xml`, `.cls`, `.sty`, `.svelte`). The report's proposed HELP.md Projects-row text repeats "a picture, a PDF or a page opens in the browser".
- Grep of the changed names across `src tests config HELP.md DESIGN.md README.md`: `drawnInPage`, `isHubPath`, `OPEN_PATH` and `openFile` have no hits in HELP.md, DESIGN.md, README.md or config. `openFile` also exists as unrelated local functions in `views/Person.svelte:112` and `server/watch/portfolio.ts:247`; this is not a collision, since the scopes differ. `fname` survives only in `CardDocs.svelte`. No browser spec selects on `fname`, `frow`, a `.docx` or a card file link.
- No history in comments. No non-ASCII (gate above). Catalog lines `file.open_failed`, `file.open_program` and `file.open_program_glyph` are present, and `launch` exists in `config/glyphs.yml:17`. No raw control was added. Every file is under the limit: `File.svelte` 276, `EntryCard.svelte` 400, `CardDocs.svelte` 208, `open.test.ts` 569.
- The DESIGN decision line ending "Package D16." follows the list's existing convention (lines 293-315 carry package ids).

## 4. Behaviour
- **Project card file list, readable rows** (`.md`, `.py`, `.tex` and so on). Before: accent-coloured plain text. After: bordered `ToolButton`s. Stated in report judgement call 5.
- **Project card file list, rows `drawnInPage` rejects** (`.docx`, `.xlsx`, also `.log`, `.tsv`, `.sql`, `.go`, `.rs`, `.java`). Before: an accent link that downloaded or showed the file in a new browser tab. After: a bordered button with the `launch` glyph that opens the file in a desktop program. The words "Open in its program" appear only as the tooltip. The card no longer offers a download of these files. The report does not state this before and after.
- **Collection card `link` to a hub file the page does not draw.** Before: an `<a>` with the path as text, opening in a new tab. After: a bordered button with the glyph and a tooltip. The report does not state the visual change.
- **The glyph contradicts what the rows do.** `launch` maps to `external-link` (`config/icons.yml:19`) and means "opens a site in a browser tab" on `VenueCard.svelte:49`. On the card file list that icon now marks the rows that do NOT open in the browser, while the rows that do (a `.png`, a `.pdf`) carry no icon.
- **The rule draws an odd line for text files.** A `.log` or `.tsv` row opens in a desktop program, while a `.toml`, `.ipynb` or `.xml` row stays a browser-tab link that downloads or shows raw text. Both kinds are text the source tab could show. This follows the brief's `drawnInPage` rule exactly (the brief's decision 1, booked for Axel), but the result is inconsistent for a reader.
- **Two open controls on one card use different failure words.** A folder-open failure still says `editor.failed` ("not saved: ...") (`ProjectCard.svelte:218`). A file-open failure on the same card says `file.open_failed`. Since the server's 500 sentence is now "the path could not be opened: ...", the folder control shows "not saved: the path could not be opened: ...". The report names this in Limitations as outside the brief; it is not booked.
- **The File view has two program controls.** For an undrawn file it shows "Open in its program" twice (toolbar and beside Download). Both post the same body, as the brief asks. A picture or a PDF gets the toolbar control only. Stated in the report.

## Not checked
- The full browser suite. Only `open-file.spec.ts` was run, plus one revert of it on the copy.
- What macOS `open` does with an executable file, a `.command` or a `.terminal` file. This is stated from platform knowledge, not run.
- Races between the path check and `open` (a path component swapped for a symlink after resolution).
- A saved workspace root written with `~`. Neither `resolveRootPath` nor `allowed` expands it, the same as on base.
- Whether `Person.svelte`'s supervision-folder list should also offer undrawn files to their program. It is outside the brief and not assessed.

Reviewer usage: about 45 tool uses, about 20 minutes.
