# O141, repair round 1

The review is `agents/reviews/O141-refuter.md`. Each item below is a ruling, and each says what to change. The brief and the round-0 ruling `agents/briefs/O141-cases.md` hold unchanged except where an item widens them. Keep every colour value you chose. Bars 1 and 2, C11 and C12 must still hold after this round, and your report reruns them.

1. Standards 1, the head comments. In `src/lib/themes/rice/catppuccin.css`, `everforest.css`, `gruvbox.css`, `kanagawa.css`, `rosepine.css`, `singles.css`, and in the Tomorrow Night Blue comment (item 5 moves it), rewrite the sentence that names the added hues. It must say what the run shows:
   - each hue brings the Focus headers it is drawn in that touch with every cluster open to a CIEDE2000 of 10 or more;
   - it stays 10 or more from every other status hue of the theme, on the hue and on its `-txt`;
   - it was picked as the nearest to the palette's colour among the theme's own-block hexes and an OKLCH grid around that colour, with every measure at 10.5 or more.
   Keep it one plain sentence per file, or two where one would not read. Name the grid's steps (lightness 0.01, chroma x0.6 to x1.4 in steps of 0.2, hue -20 to +20 in steps of 10), or name the case-run program's `--hue` rule in words a reader can redo.
2. Standards 2, the wrapping. Rewrap every comment paragraph you edited, as a whole paragraph at 100 columns (spec.md, "What every package obeys"), so no line inside a sentence ends short. This includes `singles.css:10-13` and the Tomorrow Night Blue comment.
3. Proof 1, the report. Correct the C3 count under "The cases after the change": `grep -c '^  moved '` prints 250, and the 433 includes the summary line. Give the command and its output.
4. Behaviour 1, the report.
   - Under each changed hue (blue, green, gold, grey-d, mauve), list every reader that draws it, with `file:line`, so the look at landing can open each one. Include the readers that build the token name from a word: `src/lib/ui/display/hues.ts:10` (`HUES`), read by `views/sources/repositories/graph/Lanes.svelte:37` (the git graph's lanes) and `views/personal/calendar/Calendar.svelte:172` (the calendar's account colours).
   - Include the other readers the review lists: `state/forms/career-view.ts:40,42`, `views/shared/sessions/sections/TimelineTurns.svelte:40,43`, `state/shared/words/tones.ts:299-302`, `state/sources/registries/venues.ts:77,84`, `state/system/machine/hpc/hpc.ts:149,152`, `shell/rail/rail.ts:82` and `views/shared/changes/repo-shape.ts:30`.
   - Include any further reader you find with `grep -rnE "['\"](blue|green|gold|grey-d|mauve)['\"]" src` beyond these. For each reader, name the view and the themes where its colour changes.
5. The Settings class-word list order (your point 4). The Tomorrow Night Blue block in `themes.css` makes `themeClasses()` (`src/lib/ui/theme/theme.ts:161`) list `vscode-tomorrow-night-blue` second instead of 47th. Every class keeps its base place.
   - The token goes where the VS Code themes are written. In `utils/migrations/convert-vscode-themes.ts`, add a table of the tokens oculus adds to a converted theme, keyed by class: one row, `vscode-tomorrow-night-blue` with `--c-blue: #003abc`. Append its entries to that theme's block. Have the block's comment name them in the converter's comment style, with the sentence of item 1.
   - Remove the block and its head-comment sentence from `themes.css`. The head comment goes back to the base's text about the VS Code themes.
   - Run the converter from the worktree root (`node utils/migrations/convert-vscode-themes.ts`, the command `vscode.css`'s head names). If its output changes `vscode.css` anywhere but the Tomorrow Night Blue block's comment and its added line, copy the base's `vscode.css` back (`cp`) and write only those lines exactly as the run wrote them. Quote the run's diff in the report either way.
   - After the change, `--classes` prints `vscode-tomorrow-night-blue at 47`, and C11 and C12 still hold.
   - Paths widened: `utils/migrations/convert-vscode-themes.ts` and `src/lib/themes/vscode.css`.
   - Update any sentence of `docs/` or a head comment that describes what the converter writes, if this makes it false.

6. The headers against the panel (your point 5). These are folded into this step under the rule that a finding no brief covers goes into the step that changes its files.
   - Every lane and band header's `-lane` surface must be 10 or more from `--panel` in every theme. Your `--panel` run shows the ones that are not: `grey-d-lane` (Jobs) in nord 8.2, onedark 8.9 and solarized 9.3; `slate-lane` (Review) in 8 themes, nord the lowest at 3.2; `grey-lane` (Backburner) in onedark, solarized and vscode-quiet-light.
   - Fix them by theme hues, under the same rules as the round-0 ruling: bars 1 and 2 hold, each changed hue stays 10 or more from every status token on the hue and on `-txt`, C12 holds, `contrast.test.ts` passes, the fewest hues are changed, and each touched head comment names its added hues with the sentence of item 1.
   - Add a case C13: the program's `--panel` run over every header tone prints none under 10. Quote its first run, which is your existing `--panel` output, and its run after the change.
   - A VS Code theme's hue goes through the converter's table of item 5.
   - If a header cannot reach 10 against the panel without breaking another bar, hand that header back with the run before writing it.

Then run the brief's "Verify before you report" once after the last change, the full list once, as before. Write the report over `.scratch/migration/agents/reviews/O141-report.md` in your worktree. It opens with a "Repair round 1" section: each item with its change, the before and after, and the runs. The rest of the report is brought up to date.
