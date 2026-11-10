# O181 repair round 1

Rules: `.scratch/migration/agents/spec.md`, as for the step. The brief `agents/briefs/O181.md` stays in force. The review is `.scratch/migration/agents/reviews/O181-refuter.md`, also in the worktree's ledger at the same path. You write only in the oculus worktree: not the main checkout, not its `.agents/` folder, not any session scratchpad; a case program lives under the worktree's own `.agents/scratch/`. No file is changed by a shell redirect or a here-document. Besides the brief's write list, this round writes the files it names. Token discipline as `spec.md` says: the test files of what you change while building, the verify list once after your last change, a rerun only after a red in a file you changed, never a whole-suite command.

## 1. The read of every file of `src` (Spec 1; the brief's "Read every file")

Read every file `find src -type f | sort` lists, whole, as the brief says. For every value the read finds that is a fact of the user's setup or data or a choice a person makes (ruling O181 keys; Axel: "Folder or file names, Any other important settings"), apply item 3: a key by Decision 1's naming rule, its options entry, its default, its findings and its help. Among them the review names `MANUSCRIPT` (`src/lib/data/prose/latex.ts:41`) and the places that join it (`pty/latex/latex.ts:201`, `latex-state.ts:403`), `CODE_FOLDER` (`src/lib/data/sources/manifests.ts:31`), `AUDIT_PATHS` (`src/lib/server/content/audit/projects.ts:59`), the HPC submit's `results` and `logs` (`src/lib/server/machine/hpc/submit.ts:215-216`), the deposit's `README.md` (`src/lib/server/git/deposit/deposit-scan.ts:25`), and the LinkedIn `xx-` prefix, the `SCOUT_RUN` marker and `SKIP_DIRS`. A value that stays in code (oculus's own format, a constant of the program) is listed with the reason under the ruling's words. A key that would duplicate an existing one (`project_docs` already names the manuscript's TEX file) reads that key instead of adding another. Report "Read so far" as every folder of `src`, each read whole.

## 2. Fallbacks and invented values left (Spec 2)

`src/lib/views/sources/file/File.svelte:318` holds `?? 'ctrl_click'`, a fallback repeating `latex.reverse_synctex`; `src/lib/state/shared/words/appearance.ts:166,169` start `codeTheme` at `CODE_TOKENS` and `wrapping` at `false`, the values of `code_theme` and `wrap_tabs`. Remove each, as item 1 says: no fallback repeats a config key's value, and a store holds no invented value before its config is installed (null until then, the reader of each handling null as the step's other readers do).

## 3. A list key whose value is no list (Spec 3)

`project_docs: 5` (and `update_tasks: 5`, `feed_registries: 5`) is a finding and the shipped default stands, as item 1 and G13 say; it is never an empty list. Change `hub-rows.ts` and the `'a number'` rows of `hub-rows.test.ts` to expect the default.

## 4. `feed_registries` (Spec 4)

- Oculus's default in `config/defaults/sources.yml` is `[]`, as item 2 says. `[leads, radar]` is the hub's line, in the report's hub lines, written into the hub at landing.
- A word that is no YAML feed oculus reads is a finding, and that word alone is ignored: `[leads, foo]` reads `[leads]` with one finding naming `foo`. A repeated word is read once with a finding.
- The `feedRegistries` rows of `hub-rows.test.ts` follow, `[leads, foo]` among them.

## 5. An `update_tasks` row whose `view` names no view (Spec 5, and the test it needs)

The brief's premise that the row is dropped everywhere is corrected: the server cannot know the page's views, since an app registers its views on the page. The row is dropped from what the page offers (the tray, the Focus board's refresh lines and the notices, all of which read the schedule store's `offered`), with the finding `unviewed` gives; a schedule or a press still runs the task, whose file and row are valid. The report states this before and after. G13 names the test: in `tests/state/system/schedule-lines.test.ts`, describe 'the update tasks the page offers', one row per outcome: a row whose view the page holds is offered and has no finding; a row whose view it does not hold is left out and its finding names `<at>.view` and the view; before `viewsAre` is called nothing is offered and there is no finding. Quote its failing line on the unchanged tree.

## 6. The cases' first run, and the case program (Spec 8, Proof 1)

Run on the base copy `../O181-base` the cases the report gives no first run for: `update_tasks` with an empty task and with a repeated row, the rows with `view: nowhere`, `last_run: foo` and no `label`, `last_run: linkedin`, `feed_registries: [leads, leads]`, and the live edit of `update_tasks`. The case program stays under the worktree's `.agents/scratch/` until the step lands, and the report quotes its source and its output, so the reviewer can run it again.

## 7. Proof of the tests (Proof 2, 3, 4)

- For each test the step adds or changes (`hub-rows.test.ts`, the 'fileIndexSettings' describe, the `run.test.ts` row 'an update task its hub holds a file of and does not list is refused with update-task-unlisted', the new schedule-lines rows, and every changed expected string), quote its failing line on the unchanged tree, or for a row whose behaviour the step preserves its passing run there.
- A table of every edit to an existing assertion, one row per changed line, with its before and after: `config.test.ts:568-615`, `boards.test.ts:330,349-396`, `catalogs.test.ts:92`, `hub-vocab.test.ts:367,429`, `connection-keys.test.ts:105-106`, `writing.test.ts:187,198-201`, `docs.test.ts:47`, `run.test.ts:98`, `app-theme-start.test.ts:415-420`.
- `app-theme-start.test.ts:417-420`: state that the row's input moved to a merged workspace file because `requestStart` given an unmerged config holding a wrong rice value now returns the theme alone (`theme.ts:97`), with before and after.

## 8. Rulings on the judgment calls (Spec 6, Spec 7)

Kept, and the report names each with its before and after: findings that name the refused value (the brief's `show_tabs: 5` case asks it); `last_run` optional, a row with none drawing no last-run cell; the problem kinds `family` to `list` and `records` to `record` with their sentences; the removal of the unused `mains()`.

## 9. Comments and quotes (Standards 1, 2, 5)

- Rewrap as whole paragraphs at 100 columns the head comments of `src/lib/state/shared/words/appearance.ts:1-12` and `tests/checks/tree/layer-rows.ts:37-50`, and every other comment paragraph the step edited; quote each paragraph's line widths after the change.
- Quote the greps `spec.md` asks for: every name the step changed or removed across `src`, `tests`, `config` (with `--exclude=local.yml`), `docs` and `README.md`; the history-word grep of added comments and test titles, each hit judged; the head and doc comments of touched functions, each marked "still true" or "rewritten".

## 10. Host- and user-visible changes (Behaviour 1 to 5)

Add to the report's table, each with its before and after: the Focus board's refresh lines (made per offered row by `last_run`, named by the row's label, none while a hub lists no `update_tasks`); the run notices (one per offered row reading that place, opening the row's view); what is drawn before the page's settings arrive (New in a folder-limited Sessions list, the Terminal tab's composer, the Customizations section, a float's Terminal view, Do Not Disturb, a notice posted then); a `themes` list with no theme drawing no theme class where the base drew `light`; the docs route reading its served names from the owning hub's `project_docs`; and every schedule of `schedules.yml` that runs `litwatch`, `scout`, `linkedin` or `inbox` reading as `update-task-unknown` in a hub whose `update_tasks` does not list it, which the hub's lines written at landing end.

## Verify

As the brief's "Verify before you report", over the files this round changes as well: `npm run diagrams`, then `env -u TMPDIR npm run test:quick` once after your last change; gates 2 to 4 of the brief. A red line in a file you did not change is named, never fixed, as `spec.md` says. Append the round's section to `.scratch/migration/agents/reviews/O181-report.md` under "Repair round 1", each item with its diff and its check, and state how many times you ran the verify list and any whole-suite command.
