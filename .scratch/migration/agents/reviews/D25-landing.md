# D25 landing

Position: plan oculus/migration, step D25 (the editor's options, with the editor and Settings defects of the looks) landed; the loop is paused at Axel's word (Z360). Built and waiting for its review: Q116 (the Status view's count of everything under `src/`). In flight: X3c (the tab strip), its round 1 run's findings to dispose. T1 held (Z356).

## Open items

- Z251 (fewer repair rounds): ten landings counted since X3a, so it is Axel's to rule. D25 also had a round, and its run over that round found ten findings, two of them real defects fixed here.
- Z314 (the owed look Q81): unchanged, waiting on Axel setting `tasks.skip_permissions` himself.

## NOT DONE

- Not looked at on TEST, each with its test: a diff widened past 900 px turning side by side again (TEST's panes are narrower, and widening them changes Axel's layout); Compare Selected's header (the Files view sits behind a rail button); the Settings save of `read_limits` ending its draft (it writes config).
- The hunk header was seen with two buttons planted in the page, since the staged diff on TEST draws none.

## Check of the agents

D25's builder `a5d2ad20a1f12524e` and its reviewers `ae98977243dfc074f` and `af77d20984e61e372` are not running: `ListAgents` lists no subagent of this session, only the peer session `ordo-01`.

## What landed

D25, one commit on main (the commit that carries this file), from base 5f492a9b, as `agents/briefs/D25.md` and its round `agents/briefs/D25-round1.md` say: the `editor:` keys with their Settings controls and a repository's `.oculus/settings.yml`; the Settings rows saying where a value comes from; Alt+Z word wrap kept with the tab; sticky scroll's Markdown and LaTeX structure; brace and label folding; the paint limit at 20480 KB; the Settings draft ending after a save; the byte-for-byte undo of a config-value write; bold italic; the modified gutter mark in VS Code's colour; the language picker as VS Code's; one clear button in the Settings search; the narrow diff turning inline; the hunk header cut before its buttons; the Text size row's value; the inline diff's comment `+` beside the line number (A1-1, `agents/reviews/D25-diagnosis.md`).

## Fixes at landing

Ten, each with its proof under "Closed" in `agents/reviews/D25-refuter.md`:
1. Gutter.svelte's head comment merged with Q91's (Spec 1); the DESIGN.md merge points with X3c are in X3c's dispatch entry.
2. `diff-pane.test.ts` back in `tests/views/sources/repositories/` (Spec 2).
3. The language association's outcome as `associationOutcome` in `state/workbench/navigation/status.ts`, tested as a table over the open and closed palette (Proof 1).
4. The colour rule reads `.css` files under `ui/`, `shell/`, `views/` and `routes/` (Standards 1).
5. `marks.css` held to the editor primitive by `[data-editor-host]`; both new stylesheets open with their layer (Standards 2).
6. The Editor.svelte comment names its three inputs, its blank line back (Standards 4).
7. A1-1: the comment mark drawn in the line-decorations lane, on a wrapped line's first row only (the second part found at the look); the gutter test red first both times.
8. Round 1's ruling 16 was wrong: the rail's `{ reveal: 'rail' }` made the Settings view clear the picker's `@id:editor.languages` search (found at the look). `openLanguageSettings` now opens the view with no state; test red first ("expected 'rail' to be undefined").
9. Z349: the moved tests under `tests/state/sessions/source/` with real titles.
10. The test rule (Z354, Z355): `settings-origins.test.ts` and `compare-header.client.test.ts` deleted, cases of fourteen other files deleted or folded into tables; `tests/` 699 lines shorter than the step's tree (`git diff --stat D25-land -- tests`).

Standards 3 closed with no change: `DiffSection.svelte` at 515 lines is more than 20 under its 540 cap.

## What was found

- The slow colour rule is red on main for `views/sources/files/sections/OpenEditors.svelte`'s `.dirty` background (`currentColor`), there since X3a's landing; booked into X3e (Z359).
- Breaches: the builder ran the full verify list 4 times against one (Z348 (b)) and one read-only git command; the reviewer over round 1 ran a count-only grep that reached `config/local.yml` because ugrep read its exclude as a file name (counts only, every count 0, by its report).

## Verification on main

`sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md` from `tools/oculus`, after every fix: `checks: 7 commands passed` (npm test 579 files, 14138 passed, 661 skipped; test:checks 31 files, 471 passed; check 3336 files 0 errors 0 warnings; build; format:check; lint; the ASCII gate), 15:17 to 15:24 at load average 4.4 to 7.6. No A/B: the block names no `bench:`.

## The look on TEST

- The inline diff of HELP.md: on hover one `+` at x 243, the right edge of line 92's number, on the line's first row only.
- HELP.md as Markdown opens wrapped; Alt+Z unwraps it with nothing typed (checksum unchanged), the choice survives a reload, Alt+Z again wraps it.
- The language picker: Auto Detect, Configure File Association for '.md'..., Configure 'Markdown' language based settings... first; Markdown's row `(markdown) - Configured Language`. Its settings entry opens Settings with `@id:editor.languages` in the search, after fix 8.
- The `editor.languages` row says "Also set in youtube-downloader: cpp, python" for a `.oculus/settings.yml` written there for the look and removed after (`git status` of that repository clean).
- The Settings search: its WebKit clear hidden by the header's rule, the Clear search button kept.
- The Text size row: 100%, 110% after Larger, 100% after Reset.
- `***bold italic***` draws at weight 700 and italic, in a line added to HELP.md for the look and taken out after (checksum as before).
- The hunk header at 300 px cuts its text with an ellipsis and keeps two buttons whole.
- No write left behind: `~/.oculus/changes.jsonl` and `workspaces.json` checksums and the history count as before the look; `git diff --exit-code` on `config/` clean.

## Usage

Builder `a5d2ad20a1f12524e`, claude-sonnet-5-5 at ordo-high: 262,512 tokens, 638 tool uses, 170.1 min; round 1 288,412 tokens, 188 tool uses, 63.3 min. Reviewer `ae98977243dfc074f`, claude-opus-5-5: 350,621 tokens, 94 tool uses, 26.4 min; over round 1 `af77d20984e61e372`, claude-opus-5-5: 305,716 tokens, 109 tool uses, 30.1 min. Brief check, claude-opus-5-5: 274,600 tokens, 112 tool uses, 14.5 min. The first report did not pass its bar; ten fixes at landing. Review branch: `review: earned` ran the reviewer, since D25 touches the state layer.

## Next

Paused (Z360). On Axel's go: `/refute` Q116, then X3c's dispositions, diagnosis and landing.
