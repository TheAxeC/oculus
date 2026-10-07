# D11 round 1: the review's findings

Rules: `agents/spec.md`, `agents/guarded.md` and the step's brief `agents/briefs/D11.md`, which stay in force except where this file says otherwise. This round is built on the worktree `.agents/worktrees/D11` as round 0 left it. The review is `agents/reviews/D11-refuter.md`; read it whole before you change anything. Run no git command, not even a read.

## What to change

1. **`session.ts` under its brief limit (Spec 1, Proof 1).** `src/lib/server/machine/debug/session.ts` is 726 lines and the brief's section 3 sets it at 700. Move a part of it that has one job into its own file of `server/machine/debug/` (the folder stays at 10 items or fewer), so `session.ts` is at most 700 lines. Squeezing lines to pass the count does not close the finding. The report's size row checks each limit the brief names per file as well as spec.md's general limits.

2. **The status item names the last session's configuration (Spec 2).** `src/lib/shell/status/StatusBar.svelte:103` prefers the configuration picked in the Debug view or the first entry of the repository on screen. The brief (section 3, "the descriptor of the last session since the server started, which the status bar item reads", and section 9) asks for the configuration that last ran: the item reads `debug.payload().session?.name`, and the default name only when that descriptor is a launch of the open file. The item's menu still lists the configurations of its repository.

3. **The approval write failure (Spec 3).** It keeps 409, as the approve answer of `/api/commands` does, since a failed write of the approvals file is no refusal of the request. The brief's sentence "Every refusal is `{ error }` with status 400" stands for every refusal of the request. The report states the one 409 with the line.

4. **The response shape carries `command` (Spec 5).** The DAP response shape in `src/lib/server/machine/debug/wire.ts:48-54` lists `command`, as the brief's section 3 does.

5. **Case 76 paused (Proof 2).** Quote a run, with the adapter as in S3, of `frame` with an id the pause does not list while paused: "No frame 99 in this pause", and nothing sent to the adapter.

6. **The console prompt from the glyph catalog (Standards 2).** `src/lib/views/system/machine/debug/Console.svelte:248` draws `content: '> '`. The prompt glyph comes from `config/catalogs/glyphs.yml` as every other glyph does; when no entry fits, add one, keep the `dummy/` twin identical, and say so in the report.

7. **The status bar readable while debugging (Behaviour 1).** On the orange bar, a hovered or open status item paints `--chip` behind `--on-c-orange` ink (ratios 1.26 to 2.43 in 13 of 17 themes), and a warning-tone item draws `--c-amber-txt` on the orange (1.00 to 1.95 in every theme). While `.bar.debugging` holds, a hovered or open item's background and a warning item's ink are derived from `--c-orange` and `--on-c-orange` (in `themes/derive.ts` beside `--on-c-orange` when a new derived value is needed), so that every text on the bar, hovered, open and warning included, is at least 4.5 against what is behind it in every theme. The report quotes the run that computes each ratio per theme with `ratio` of `themes/derive.ts`, as verify item 7 does.

8. **Only a left press toggles a breakpoint (Behaviour 2).** `pressInGutter` (`src/lib/ui/controls/editor/gutter/editor-gutter.ts:91-92`) runs `onglyph` for any button. A breakpoint is toggled by a left press only; a middle or right press in the glyph margin does nothing, as the brief's section 9 and `docs/debugging.md:41` say. The other gutter actions keep what they do now.

9. **A `.rite` file under no served root is refused before anything is posted (Behaviour 3, case 75).** `src/lib/state/system/machine/debug/debug.svelte.ts:278-282` falls back to `held.lastRepo`. F5 on a `.rite` file under neither a served root nor a repository says the warning "<path> is under no root the file browser serves, so it cannot be debugged" and posts nothing, whatever repository was watched before. Quote the run of case 75's third part.

10. **Case 40 (Spec 4).** Nothing changes in oculus: the request oculus sends for Step Into stays the plain DAP `stepIn`. The adapter's fault goes to Axel as an open item. The report states case 40 as partial, with the adapter's output quoted.

## Cases (first run on the round-0 tree in the worktree, then after)

1. `wc -l src/lib/server/machine/debug/session.ts`: at most 700 (726 on round 0).
2. Run "a", then pick "b" in the Debug view without starting it: the status item names "a" (the store's derived name, by a quoted run; round 0 names "b").
3. A middle press and a right press in the glyph margin of a `.rite` tab: no breakpoint change (by a quoted run of `pressInGutter` with each button, or by reading where no run reaches it; round 0 toggles).
4. After watching repository A, F5 on a `.rite` file outside every served root: the warning sentence, no POST (round 0 posts A's launch).
5. The contrast run of item 7: each ratio at least 4.5 in every theme (round 0: the numbers the review quotes).
6. Case 76 paused, item 5.

The browser parts (hover and open colours on the orange bar, the middle press) are looked at by the orchestrator on TEST at landing. A test is added only where the rules file's test rule calls for one.

## Paths this round writes

- every path item 1 to 9 names, and the new file of item 1
- `tools/oculus/config/catalogs/glyphs.yml` and its `dummy/` twin, only for item 6
- the `derive.ts` that defines `--on-c-orange` and the theme tokens, only for item 7
- `tools/oculus/docs/debugging.md`, `tools/oculus/DESIGN.md` and `tools/oculus/docs/views.md`, only where this round makes a sentence false
- `tools/oculus/docs/diagrams/*`, as `npm run diagrams` rewrites them
- `tools/oculus/.scratch/migration/agents/reviews/D11-report.md`

## Verify before you report

The brief's "Verify before you report", every check, from `tools/oculus` in the worktree. The base `unused-exports.txt` is `.agents/worktrees/D11-base/unused-exports.txt`, and the ASCII gate runs over `src tests config` (`bin` does not exist). While working, run only the test files that cover what you change. After the round's last change, run the full verify list and quote its final lines; a red line in a file you touched is fixed before hand-back. `pgrep -fl rite_dap` prints nothing after your last run.

Rewrite the report whole for the state after this round. Copy the open items from the state file at the moment you write it. Every finding of the review gets a line saying what changed for it, with the file and line.
