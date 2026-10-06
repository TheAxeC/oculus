# Step D16 refuter report, second review (on .agents/worktrees/d16, base 76c3b390)

## First review's findings
- Executable files reach `open`: closed for the cases named. `src/lib/data/runs-when-opened.ts` holds the name rule. `server/open.ts:154-163` `runs()` checks both the asked name and the real name, the execute bit, and bundle folder names. The cards (`CardDocs.svelte:114`, `EntryCard.svelte:144`) and the File view (`File.svelte` `openable = holds && !runsWhenOpened(path)`) draw no control for a marked name. Gaps are new findings under Proof.
- The cards' press was unproven: closed. `open-file.spec.ts` cases at :203 and :232 press both controls and assert the posted body and the refusal line. I reran R2 (CardDocs posts nothing) and R3 (EntryCard posts nothing) on a copy: both cases turn red (below).
- The File view's async handling was unproven: closed where the ruling reached. The superseded case at :166 turns red under R8 (rerun). The R7 guard was removed by ruling. Still open: the cards' `openInProgram` has no supersede guard and no case (see Proof).
- The regular-file narrowing was untested: closed. There is a FIFO case in `open.test.ts`. R5 gives 1 failed and R6 gives 1 failed (rerun).
- R9, the `-` check: stays an audit, and the report says so (N17).
- Tests with no named revert: closed. The report's per-test list names one for each. I reran twelve (below).
- Wrong report line (170 vs 173): closed. `openFile` is cited at :173.
- False head comment in `open.ts:1-3`: closed. :1-9 now say the boundary is the roots and that dotfiles are opened.
- False head comment in `CardDocs.svelte:5-6`: closed. :4-11 now match the branches.
- The proposed DESIGN text "exactly what the file browser shows": closed. Round 1's replacement drops it.
- 404 wire shape: reported (round 1, item 3). It is not in the state file's open items. `grep -n "file_index\|open_program\|would run rather" orchestrator-state.md plan.md` hits only the usage line :702.
- Behaviour items (readable rows restyled, undrawn rows, glyph contradiction, `.log`/`.toml` inconsistency, folder failure words, two File view controls): all closed. The before and after is stated in round 1; the glyph is now `open_program`/`app-window`; `DRAWN_TEXT` is extended; `project.card.folder_failed` is in use.

## Verification (rerun by the reviewer)
All from `tools/oculus` in the worktree, with node v24.21.0.
- `npm test`: `Test Files 230 passed (230)`, `Tests 3829 passed (3829)`. Matches round 2. `ssh.test.ts` did not time out.
- `npm run check`: `COMPLETED 1157 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`. Matches.
- `npm run build`: exit 0.
- `npm run format:check`: `All matched files use Prettier code style!`
- `npm run lint`: exit 0.
- ASCII perl gate: printed nothing.
- `find src tests bin -type f | xargs wc -l | sort -n | tail -3`: 970 layout.test.ts, 979 board.test.ts, 154437 total.
- `npx playwright test tests/browser/open-file.spec.ts tests/browser/board.spec.ts tests/browser/collection.spec.ts`: the first try got "127.0.0.1:8792 is already used". The retry gave `16 passed (20.6s)`: 6 open-file, 5 board, 5 collection.
- `git diff 76c3b390 --numstat`: matches round 1's file list. File.svelte is +71/-4 (272 lines) and open-file.spec.ts is 249 lines, as round 2 says.
- Cited lines checked: CardDocs.svelte:114, EntryCard.svelte:144, File.svelte:52, ProjectCard.svelte:218. All match.
- Node reverts on a copy (`scratchpad/d16-review2/oculus`), each run with `npx vitest run <file>`:

| Revert | Result | Report |
|---|---|---|
| N11 | 3 failed | matches |
| N12 | 2 failed | matches |
| N13 | 2 failed | matches |
| N14 | 1 failed | matches |
| R5 | 1 failed | matches |
| R6 | 1 failed | matches |
| N7 (unknown-root check) | 2 failed | matches |
| N34 | 1 failed | matches |
| N37 | 1 failed | matches |
| N29 | 1 failed | matches |
| `target()` skips `runs` | 4 failed | not in report |
| `runs()` catch returns false | 34 passed | not in report |

- The last row: the fail-closed catch in `runs()` is pinned by no test, and the report names no revert for it.
- Browser reverts on the copy (R2 + R3 + R8 in one build, then `npm run build` and the open-file spec): `3 failed, 3 passed`. The superseded case (:166), the project card case (:203) and the collection card case (:232) failed; the other three passed.

## 1. Spec
- `config/behavior.yml:75`: adding `.docx`, `.xlsx` and `.pptx` to `file_index.ext` changes a config default, and every project card now lists more files. The orchestrator kept it. It is not in the state file's open items for Axel, and neither are the 403 `the file would run rather than open` answer, the 404 rooted-missing answer, or the new glyph. Axel's 14:31 agreement (state :157) covers only the shapes in the brief.
- No change was found outside the brief and the two rulings.

## 2. Proof
Security. I probed on the copy with a vitest file that calls `handleOpen` with a `vi.fn()` opener. I asked Launch Services which app claims each name through `osascript -l JavaScript` (`NSWorkspace URLForApplicationToOpenURL`, `typeOfFile`). Nothing was opened.
- **Finder alias files get past every check.** I wrote an alias `root/report.docx` pointing at `outside/run.command` (mode 644), and an alias `root/budget.xlsx` pointing at `/System/Applications/Calculator.app`, with `NSURL writeBookmarkData`.
  - Node sees each as a regular file, mode 644, whose realpath is itself inside the root.
  - `handleOpen` answers 200 in both body forms and calls the opener with the alias path (`server/open.ts:169-184` and `:154-163`).
  - Launch Services types both as `com.apple.alias-file`. It returns Terminal.app as the app for `report.docx` and Calculator.app for `budget.xlsx`.
  - So `open` would follow the alias outside every root and run the `.command` or launch the app. This comes from Launch Services' answer; `open` was not run.
  - The card and the File view offer the control for both names.
  - This makes `open.ts:5` ("refused however it is addressed") false.
- **The list misses types this machine hands to a program that connects, installs or runs.** Each of these answers 200 in both forms (probe):
  - Location files: `.vncloc` (Screen Sharing), `.afploc` and `.ftploc` (Finder), `.mailloc` (Mail).
  - Installers and imports: `.mobileconfig` (ProfileHelper), `.shortcut` (Shortcuts), `.jnlp` (JavaLauncher).
  - Bundle folders: `.prefPane` and `.saver` (System Settings), `.appex` and `.xpc` (Quick Look Simulator).
  - `runs-when-opened.ts:6-8` says the list covers location files and installers ("The list is those names"). That sentence is false for these types.
- Checked and refused, or harmless:
  - `report.docx.command`, `x.Command`, `Y.APP`, `Y.APP/`: 403.
  - A symlink `link.docx` pointing at `report.docx.command`, asked as `link.docx`, `./link.docx` or `link.docx/`: 403.
  - `run.command.`, `run.command ` and `Y.app.` answer 200, but Launch Services types the files as `public.data` (TextEdit) and the folder as `public.folder` (Finder), so they do not run.
- **`openable` is weaker than its comment and the Doc text say.** For an absolute symlink `link.docx` pointing at `report.docx.command`, `openable` returns true (probe). It calls `runs(target, target)` without a realpath, so both names are `link.docx` (`open.ts:207`). Two statements are therefore false: its doc comment at `open.ts:186-196` ("a regular file right now and would not run"), and the round 1 DESIGN decision line ("`openable` under `macOpen` holds the same rules"). No open is reachable through this: the endpoint passes real paths, and the calendar and mail routes pass `httpsLink` output only (`calendar/routes.ts:130`).
- The cards' async path: `CardDocs.svelte:57-60` and `EntryCard.svelte:148-151` have no supersede guard. If a slow refusal from an earlier press lands after a later press has opened the file, it is still said through `onsaid`. The spec asks for superseded paths to be exercised, and there is no case for this. The File view's close-in-flight path is not exercised either (it sets `failed` on an unmounted component, which is harmless).
- No test asserts a defect. No predicate was widened: `type-scale.test.ts:43` adds a class. No module-level mutable state: `presses` and `failed` are per instance, and `RUNS`/`BUNDLES` are never mutated.

## 3. Standards
- `tests/data/runs-when-opened.test.ts:7`: "as the ruling lists them" points at a plan artifact. The spec allows no process reference in a comment.
- Doc text, round 1 HELP.md line 114 replacement: "any file with an execute bit ... is never offered to its program". This is false. The page cannot see the mode, and the report's own round 1 Limitations say a `.docx` with mode 0755 is offered and then refused.
- Doc text, round 1 HELP.md line 69 replacement: "a page ... opens as a document tab". `file_index.ext` (`behavior.yml:74-75`) has no `.html` or `.htm`, so a card never lists a page.
- Doc text, round 1 DESIGN decision line: "`openable` under `macOpen` holds the same rules". False, see Proof.
- `open.ts:5` and `runs-when-opened.ts:6-8`: false, see Proof.
- `tests/boundaries.test.ts`: the only changes are the `data/runs-when-opened` row and its comment. The comment is now wrapped unevenly (:752-753, :763), but only the whitespace is off.
- No non-ASCII (gate above). No missing catalog key: `file.open_failed`, `file.open_program`, `file.open_program_glyph` and `project.card.folder_failed` are all read. `open_program` has an ascii stand-in `[o]` and an icon. No raw control. Every file is under the limit (open.ts 199, File.svelte 272, open.test.ts 671).

## 4. Behaviour
- **File view, "Open in its program" on a `.zip`.** Before: no control. After: a press hands the file to Archive Utility, which Launch Services returns for `.zip` and `.xip`. With Archive Utility's default setting that expands the archive into a new folder beside it, inside the hub. Not verified by opening. The report does not state it.
- **File view on `.ics` and `.vcf`.** A press hands the file to CalendarFileHandler or Contacts (Launch Services probe), which offer to import it into the calendar or the address book. Not stated in the report.
- Every other before and after I found is stated in round 1's "Before and after".

## Not checked
- What `open` actually does with an alias file, a location file, `.mobileconfig`, `.prefPane` or `.zip`. The evidence is Launch Services' answer; nothing was opened.
- The whole browser suite. Only the three specs above were run, plus one revert build on the copy.
- Races between the checks in `handleOpen` and `open`.
- A filesystem that marks every file executable.
- Whether a Finder alias exists anywhere in the real hub.

Reviewer usage: about 40 tool uses, about 15 minutes by the clock (15:47 to about 16:00).
