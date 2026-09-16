# Step D16 refuter report, third review (on .agents/worktrees/d16, base 8601f148)

## Second review's findings
- **The shapes Axel has not seen are still not booked: OPEN.** These are the `file_index.ext` default change (`config/behavior.yml:75`), the 403 `the file would run rather than open`, the 404 rooted-missing answer and the `open_program` glyph. `grep -n "file_index\|would run rather\|404\|open_program" orchestrator-state.md plan.md` hits only the usage line :703. Open item :175 still describes the `drawnInPage` rule as the agreed rule, and round 3 removed that rule.
- **Finder alias (bookmark format): CLOSED.** I wrote `alias.docx` pointing at `outside/run.command`, `calc.xlsx` pointing at Calculator.app and `fold.docx` pointing at a folder, each with `bookmarkDataWithOptions` (1<<10) and `writeBookmarkData:toURL:options:error:`. `handleOpen` answers 403 in both forms, the opener is never called, and `openable` returns false. Launch Services still answers Terminal, Calculator and Finder.
- **Types the refusal list missed: CLOSED by the allow list.** `.vncloc`, `.mobileconfig`, `.shortcut`, `.zip`, `.ics` and `.vcf` are refused (open.test.ts:519-535). `X.appex` and `X.plugin` folders get 403 (probe), and `.prefPane` is covered by a test (:559). The allow list does not cover folders; see Proof.
- **`openable` through a symlink: CLOSED.** The case is at :798. My revert A19 gives `1 failed | 41 passed`.
- **The cards' superseded press: PARTLY OPEN.** Both cards now have the guard (`CardDocs.svelte:65`, `EntryCard.svelte:155`). I removed both guards on a copy, then ran build and `open-file.spec.ts`: `1 failed, 6 passed`, the failure being the collection card case at :251. No case covers the project card's guard.
- **File view close while an open is in flight: OPEN.** It is still not exercised. The effect is harmless.
- **`runs()` fail-closed catch unpinned: OPEN, stated.** The equivalent catch in `mayOpen` (`open.ts:109-110`) is reported as an audit (A21, `42 passed`).
- **Process reference in a test comment: CLOSED.** That file is gone, and `git diff 8601f148 | grep '^+' | grep -i "ruling\|round\|D16\|2026"` prints nothing.
- **Doc text, HELP 114 execute-bit claim: CLOSED.** The text now says the page cannot see the mode.
- **Doc text, HELP 69 "a page": CLOSED.**
- **Doc text, DESIGN `openable` claim: CLOSED.** The claim is now true.
- **False sentences at `open.ts:5` and `runs-when-opened.ts:6-8`: CLOSED.** Both are gone. There is a new false sentence under Standards.
- **Uneven wrap in `boundaries.test.ts`: CLOSED.** The comment is rewrapped.
- **Behaviour, `.zip` into Archive Utility and `.ics`/`.vcf` imports: CLOSED.** They are refused and have no control.

## Verification (rerun by the reviewer)
All runs were from `tools/oculus` in the worktree with node v24.21.0, between 16:35 and 16:45.
- `npx vitest run --reporter=dot`: `Test Files 230 passed (230)`, `Tests 3842 passed (3842)`. No timing flake.
- `npm run check`: `COMPLETED 1157 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
- `npm run build`: exit 0.
- `npm run format:check`: `All matched files use Prettier code style!`
- `npm run lint`: exit 0.
- Perl ASCII gate: printed nothing.
- `find src tests bin -type f | xargs wc -l | sort -n | tail -3`: 970 layout.test.ts, 979 board.test.ts, total **154768**. The report says 154767.
- `npx playwright test tests/browser/open-file.spec.ts tests/browser/board.spec.ts tests/browser/collection.spec.ts`: `17 passed (25.8s)`, first try, no lock held.
- Per-file test counts all match the report: open.test.ts 42, opens-in-program.test.ts 7, context.test.ts 4. I also counted card-docs.test.ts 6 and file.test.ts 19.
- `git diff 8601f148 --numstat` and `wc -l` of the four new files (76, 98, 209, 275) match the report's file list.
- Node reverts on a copy (`scratchpad/d16-review3/oculus`):

| Revert | Result |
|---|---|
| A12 (real name only) | 1 failed |
| Asked name only | 2 failed |
| A14 (alias check dropped) | 2 failed |
| A15 (unreadable file not counted as an alias) | 1 failed |
| A17 (Info.plist check dropped) | 1 failed |
| A19 (`openable` without realpath) | 1 failed |
| Execute bit dropped | 1 failed |
| `isAlias` checks `book` only | 42 passed, not in the report |
| Package-suffix check on the real name only (asked name dropped) | 42 passed, not in the report |
| Selector fallback `?? ['.docx', '.xlsx']` | 123 passed over the five related files, not in the report |

## 1. Spec
- **The ruling's "a folder only when it is not a package" is not what `open.ts:98-105` does.** The code takes "package" to mean the 16 suffixes in `data/opens-in-program.ts:21-38` or a `Contents/Info.plist`. macOS's own test (`NSWorkspace isFilePackageAtPath`) says every name in the table below is a package. All of them answer 200 in both body forms with the opener called (probe). What Launch Services would hand each one to:

| Suffix | Launch Services answer |
|---|---|
| `.xcodeproj`, `.xcworkspace`, `.playground`, `.swiftpm` | Xcode |
| `.photoslibrary` | Photos |
| `.musiclibrary` | Music |
| `.band` | QuickTime Player |
| `.osax` | Script Editor |
| `.menu` | SystemUIServer |
| `.service` | the bundle itself, as an application |
| `.fs` | Visual Studio Code |
| `.rtfd` | TextEdit |
| `.key` | Keynote |
| `.pages`, `.numbers`, `.dext`, `.systemextension`, `.docset`, `.wdgt`, `.webplugin`, `.ideplugin`, `.xcplugin`, `.imovielibrary` | no application |

  Three of these may do more than show the folder, and none of this was run:
  - Xcode evaluates a `.swiftpm` manifest on open.
  - A playground can run automatically.
  - A `.service` with `Contents/Info.plist` is refused, but only by the plist check.

  Only the API reaches a folder (the project card's folder control and a `{ path }` POST). No view offers one.
- **Removal of `drawnInPage`:** justified. The ruling moves the cards to the list, so the helper would have had no reader. The ledger item :175 needs to say it was superseded.
- **The server refusing to start without the key:** consistent with `editor.paint_limit_kb` (DESIGN.md:309) and the spec rule that the default lives in the config file. Not a finding.
- **No control until the config arrives:** consistent with the editor's paint cap (DESIGN.md:309). Not a finding. No test pins it; see Proof.
- **User-visible decisions taken silently:**
  - One refusal sentence, `the file would run rather than open` (`open.ts:34`), now answers for off-list files, unreadable files, package folders and live-config mismatches, so the page shows "The file could not be opened: the file would run rather than open" for a `.pdf` or a folder. Not booked.
  - Folders are not held to `open.program_ext` at all. Not booked.

## 2. Proof
Security probes: `handleOpen` with a recorder opener in both forms, plus `openable`, over fixtures in `scratchpad/d16-review3/probe`. Launch Services was asked through `osascript -l JavaScript` (`typeOfFile`, `URLForApplicationToOpenURL`, `NSURLIsAliasFileKey`, `isFilePackageAtPath`, `URLByResolvingAliasFileAtURL`). Nothing was opened.

- **Per-file Open With override: the opener is called, and Launch Services hands the file to a program that runs it.**
  - `openwith-py.docx` is mode 644, contains `import os\nprint(1)`, and carries a `com.apple.LaunchServices.OpenWith` xattr naming `org.python.PythonLauncher`. Result: 200 in both forms, opener called, `openable` true. Launch Services returns **Python Launcher.app**, which runs the file as a Python script.
  - The same xattr naming Terminal on `openwith-term.docx` makes Launch Services return **Terminal.app**.
  - The server reads no extended attribute (`open.ts:98-111`). The card, the collection link and the File view all offer the control, because the name is listed.
  - Such an xattr survives ditto, Archive Utility's AppleDouble restore and xattr-syncing clients. What Python Launcher and Terminal then do was not run.
- **Alias flag without bookmark bytes in the data fork: the opener is called.**
  - `emptyalias.docx` has an empty data fork and the alias FinderInfo copied from a real alias.
  - `rsrcalias.docx` has an empty data fork and the bookmark in `com.apple.ResourceFork`.
  - `prefalias.docx` has 4 junk bytes before the bookmark.
  - All three get 200 in both forms, opener called. Launch Services types all three `com.apple.alias-file` (it reads the FinderInfo flag), but resolves none of them, so it names no application.
  - The server's alias check reads only bytes 0-11 of the data fork. I could not produce a genuine pre-10.6 AliasRecord (`FSNewAliasFromPath` returned -50; `FSNewAliasMinimal` gave no output), so what `open` does with a real resource-fork alias is not verified. The flag Launch Services uses is not read.
- **Bookmark header:** confirmed at bytes 0-11 (`626f6f6b 00000000 6d61726b`) in all three files written with `writeBookmarkData`. `GetFileInfo` shows attribute `A` set.
- **Symlink loop** (`loopa.docx` <-> `loopb.docx`): 404 rooted, 403 plain, opener not called, `openable` false.
- **Hard links:**
  - `hard-exe.docx` is a hard link to an outside 0755 script, mode 755. 403, opener not called.
  - `hard-cmd.docx` is a hard link to a 644 `.command`. 200, opener called; Launch Services says Microsoft Word.
- **Listed extension on a directory:**
  - `Report.docx/Contents/Info.plist`: 403.
  - `Empty.docx/` (no plist): 200, opener called; Launch Services says `public.folder`, Finder.
- **Document bundles** `Doc.pages/`, `Notes.key/`, `Sheet.numbers/`, `Doc.rtfd/` and folder `Old.rtf/`: all 200.
  - Launch Services: Pages none (not installed), Keynote, Numbers none, TextEdit, Finder.
  - The package rule does not refuse a legitimate document bundle.
  - No view offers one either: the tree lists it as a folder, and the card lists only `file_index.ext` files.
- **Quarantined** `quar.docx` (`com.apple.quarantine` set): 200, opener called, Microsoft Word.
- **Case and Unicode:**
  - `upper.DOCX`: 200, Word.
  - `trail.docx.`, `trailsp.docx `, the full-width dot and the combining mark after `x` or on `o`: all 403, opener not called. Launch Services would give TextEdit or nothing.
  - `cmd.command<U+200B>.docx`: 200, Word.
- **`open.ts:92-95` says a `report.docx` symlink to a folder is refused.** It is not: `linkdir.docx -> sub` gets 200 in both forms, the opener is called with `root/sub`, and `openable` is true (probe `c2.mjs`). The directory branch checks the names only against `isPackageName`.
- **The project card's supersede guard has no case** (browser revert above). The spec asks for every superseded path to be exercised.
- **Unpinned rules, with no revert named in the report:**
  - `mark` at bytes 8-11 (42 passed without it).
  - The asked-name half of the package check (42 passed).
  - "no control before the config arrives" (123 passed with a hardcoded fallback).
- **Figure not reproduced:** the `wc` total, 154767 in the report against 154768 measured.
- No test asserts a defect. No predicate was widened. No module-level mutable state: `presses` is per component instance and `PACKAGES` is never mutated.

## 3. Standards
- `src/lib/server/open.ts:92-95`: "and so is a `report.docx` symlink to a folder." False (see Proof).
- `src/lib/data/opens-in-program.ts:5-6`: "so the page never draws a control the server would refuse." False: an execute bit, an alias or an unreadable file (conceded at :9), and any live edit of `open.program_ext` (see Behaviour).
- `src/lib/data/opens-in-program.ts:18-19`: "The folder suffixes macOS treats as a package". The list is a subset of what macOS treats as a package (Spec table). The same goes for `config/behavior.yml:150` ("a package folder ... is refused").
- Doc text, HELP.md 114 replacement:
  - "with 'Open in its program' in its bar ... for a file whose extension `open.program_ext` lists" is false for `.rtf`, a listed default whose `{\rtf1` bytes type as text, so the File view hands it to the source tab.
  - "or a package folder is refused when the control is pressed" is false, because no control is ever drawn for a folder.
- Doc text, DESIGN.md: the anchor "line 124" is line 125 on main now; the quoted text still matches. The decision line does not say that the server holds the start list while the page follows config pushes, against DESIGN.md's Hot reload table ("no restart").
- `config/text/views/config.yml:5` `desc_behavior` carries the same sentence as HELP.md:149. The Doc text updates HELP.md:149, but the catalog line, which the builder may edit, is unchanged.
- The round 3 report quotes no grep for the renames (`runsWhenOpened` to `opensInProgram`, `macOpen` to `macOpener`, `drawnInPage` removed), which the spec requires. My grep across `src tests config HELP.md DESIGN.md README.md` finds no stale hit.
- `open.ts:34`: the refusal sentence says "file" for a folder refusal.
- No history in comments. ASCII gate clean. No missing catalog key. No raw control. Every file is under the limit (open.test.ts 816, open.ts 259).

## 4. Behaviour
- **Editing `open.program_ext` while the server runs.** Before (main): the key did not exist. After: the page's list follows the config push at once (`selectors.svelte.ts:132-133`). The server keeps the list it read at start: the route reads `locals.server.config`, which is the start object (`context.ts:147,262`), and the context opener is built at start (`context.ts:270`).
  - Adding `.pdf` draws a control that answers "The file could not be opened: the file would run rather than open".
  - Removing `.docx` hides the control, but the endpoint still opens a `.docx`.
  - The report does not state this.
- **A listed `.rtf`** (or any listed file whose first bytes are text) opens in the source tab, which has no program control. From the File view it is never offered. It is offered only through a collection card link. Not stated.
- **Project card folder control.** Before (main): any directory under the roots opened. After: a folder with one of the 16 suffixes or a `Contents/Info.plist` is refused, and the card says "The folder could not be opened: the file would run rather than open". Round 3's before and after compares against round 1 only.
- **API: a macOS package folder not on the suffix list, and a file with an Open With xattr, are handed to `open`** (Proof). Before (main): folders only, so a package folder opened too. The file case is new with this step.
- Every other before and after I found is stated in the report: round 1 against main, and round 3 against round 1.

## Not checked
- What `open` does with any fixture: the Open With files, the alias-flag files, `.swiftpm`, `.playground`, `.service`, the document bundles. The evidence is Launch Services' answer; nothing was opened.
- A genuine legacy AliasRecord in a resource fork (it could not be made here).
- Races between the checks in `handleOpen` and `open`.
- The full browser suite (three specs run, plus one revert build of `open-file.spec.ts` on the copy).
- A filesystem that marks every file executable.

Reviewer usage: about 45 tool uses, about 12 minutes (16:34 to 16:46).

## Closed (the orchestrator's read of round 4, 2026-09-16 23:21; no fourth review, by Axel's word of the same time: "skip the fourth review, read the round 4 delta, fix what is small at landing")

- The Launch Services choice (Open With attribute, alias flag, symlink to a folder, package folders, the live list): closed by Axel's ruling (a) as built in round 4: `open -b <bundle id> <real path>` for a file, `open -R <real path>` for a folder, `com.apple.FinderInfo` alias flag refused through `xattr -px`, the map read from the configuration on disk at every request (`server/open.ts`, `routes/api/open/+server.ts`).
- The project card's superseded press: closed; the guard is one, in `views/shared/ProgramButton.svelte`, and the browser case "a project card's refusal that lands after a later press..." was run red under R8 by the builder.
- The unpinned `mark` bytes, asked-name half and no-control-before-config: closed with P1, P2 and F0 as the builder ran them.
- The false sentences in `open.ts`, `opens-in-program.ts`, `behavior.yml`: closed; the head comments read true against the code read at 23:21.
- `desc_behavior`: applied at landing together with HELP.md:149 (a fix at landing).
- A listed `.rtf` whose bytes read as text: closed; `Source.svelte` draws the control.
- Unshown shapes: closed by Axel's rulings (office files on cards, one refusal sentence, the 404) and the ruling of the named program (folders revealed, the folder control's words).
