# U2, repair round 2

This is the round cap's exception: brief item 3 (the theme switch measure) is still unbuilt, and the rest of the fixes are browser work that is too large to do at landing. The run over round 1 is appended to `agents/reviews/U2-refuter.md` under "Repair round 1, refuted" in the main checkout's ledger. Each finding below has its ruling. Change nothing else.

Run no git command of any kind (spec.md, "Where you work"). Work in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/U2`, and write only the brief's four paths (`U2-vscode.css`, `U2-audit.md`, `U2-report.md`, `U2-shots/`). Every rule of the brief's "How the looks are taken" and of round 1 still holds:
- Never select the Config tab, and never open `local.yml`.
- Before every look, confirm with `javascript_tool` that the TEST tab's `document.visibilityState` is `visible`.
- Before typing a key, confirm with `javascript_tool` that `document.activeElement` is the intended field.

Rewrite the report for the whole step after this round. Add a "Repair round 2" section that names each ruling below and what changed. Give the report's open items as main's state file has them now: none.

## Spec

1. **Spec 1, `customization-narrow.png`.** It shows the first lines of the body of `~/.codex/AGENTS.md`. Crop it to the header and the tab strip, or remove it. Make `U2-audit.md:853` and the report's lines on this shot (56 and 84) say the same thing as the file on disk.
2. **Spec 2, `code-wide.png`.** It shows four repository cards with names, addresses and visibility. Crop it to the header, the intro and the chips, as `U2-audit.md:183` says, or remove it and say so there.
3. **Spec 3, the search error state.** Turn on the regex toggle and type an invalid pattern, for example `(`. Measure and shoot the state that shows; it is read-only. Write the attempt and its result in the search section. If no error state appears, say what the view showed.
4. **Spec 4, `doc-wide.png` and `file-wide.png`.** Crop each to its pane alone, without the rail.

## Proof

5. **Proof 1, the theme switch.** At the reviewer's reads the TEST tab was visible and focused, with 98 to 103 animation frames per second, so round 1's third branch does not apply.
   - Take the measure through the Settings view's theme list. The pick is saved in the ui store in the browser's storage for the 8790 origin (`state/workbench/ui.svelte.ts:459`, `save` at :442). No file is written.
   - Before switching, note the theme in force. Switch to a theme of the other brightness, measure, then switch back to the noted theme and confirm the switch-back with a read.
   - Measure Monaco's colours before and after the switch on the source tab, the populated `doc` view and the populated `customization` view. Keep the shots to the regions ruling 10 below allows.
   - Then apply round 1's ruling 10: the first branch if Monaco repaints at once, the second if it keeps the old colours.
6. **Proof 2, the tmux sessions.** Run `tmux list-sessions` when the round ends, and quote its output with the time.
   - Case 7 states that list.
   - It also states that `oculus-d0935c-shell` (created 2026-10-01 00:04, before the audit) was listed at the report's writing and was gone by 09:40:54, the reviewer's read, cause not known.
   - Whether the audit ended it is not claimed either way.

## Standards

7. **Standards 1.** Cite the first agent-sessions list rule of `U2-vscode.css` for the session rows (`U2-audit.md:424` and `:462`), in place of css:1055, which is a chat-request timestamp rule. The reviewer names css:1066 or css:1067; check which line holds the row value.
8. **Standards 2.** Add VS Code's generic row hover, `.monaco-list .monaco-list-row:hover{background-color:var(--vscode-list-hoverBackground)!important}`, to `U2-vscode.css`. Copy it from VS Code 1.137.0's `workbench.desktop.main.css` at the end of the extract, so every existing line number stays. Cite it for the focus and timeline row hovers (`U2-audit.md:22` and `:530`).
9. **Standards 3.** At `U2-audit.md:790`, keep only what css:14 holds: the centring, the 40px top padding and the 70% opacity. "Names the filter" stays only if you find a line in VS Code 1.137.0's sources that shows it, cited. Otherwise remove it, and write the difference as oculus's message not naming the filter that hides the rows, with no claim about VS Code.
10. **Standards 4 and ruling Z144, what a shot may show.** The shots are committed, and oculus moves to its own repository. On top of round 1's ruling 12, no shot may show any of the following:
    - session or agent titles, or agent task names;
    - account labels;
    - unpublished research: project plans, manuscript or equation content, submission and venue cards, dataset details, lead counts.

    Crop or remove each such shot, and write in its section that the measure is by computed styles only, with that reason. Each shot below has its own line in the report's list of every shot's fate.
    - `events-narrow.png`: the AAAI 2027 card.
    - The session titles in `agents-narrow.png`, `changes-narrow.png`, `timeline-wide.png`, `agents-wide.png` and `doc-wide.png`.
    - The agent task in `agents-wide.png`.
    - The account labels in `usage-wide.png`.
    - The research content in:
      - `project-wide.png`, `project-narrow.png`;
      - the `editor-*` shots;
      - `map-wide.png`;
      - the `slides-*` shots;
      - the `file-*` shots (the equation);
      - `leads-wide.png`'s intro.
    - Then look at every one of the 100 shots again with the Read tool against the whole list.
11. **Standards 5.** Remove `U2-report.md:109`, which restates the first pass's reasons. Line 55 says only what was done.

## Behaviour

12. **The Archive tab.** Pane 2 of TEST no longer holds the Archive tab it held before the audit. Its cause is not established, and you are not asked to find one.
    - Open the Archive view in pane 2 of TEST from the Views catalogue.
    - Then select Settings again as pane 2's current tab, without selecting Config.
    - List each pane's tabs before and after, read from the DOM.
