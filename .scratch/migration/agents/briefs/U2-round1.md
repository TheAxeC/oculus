# U2, repair round 1

The refuter's report is `agents/reviews/U2-refuter.md` in the main checkout's ledger. Each finding below has its ruling. Change nothing else. Run no git command of any kind (spec.md, "Where you work"). Work in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/U2`, and write only the brief's four paths (`U2-vscode.css`, `U2-audit.md`, `U2-report.md`, `U2-shots/`). Every rule of the brief's "How the looks are taken" still holds, the Config and `local.yml` rules first. Before every look, confirm with `javascript_tool` that the TEST tab's `document.visibilityState` is `visible`. Rewrite your report for the whole step after the round, with a "Repair round 1" section that names each finding below and what changed.

## Spec

1. **B1, `doc`.** Open a hub document from the Views catalogue's HELP section (the buttons `Catalogue.svelte:227-246` draws, for example "Research approach"). Measure the populated `doc` view at narrow and wide, take its shots, and rewrite its section. Replace the report's reason ("plain `h3`, not links") with what was done.
2. **B2, `customization`.** Reach the view without a write: pick Codex in the Customizations agent menu (instance state only, no file written), then open a `~/.codex` item, which falls outside every workspace root and so opens the customization view (`Customizations.svelte:85-100`). Measure it at narrow and wide and rewrite its section. If it cannot be reached this way, name the attempt and what the page showed.
3. **B3, `agents` narrow.** Measure the populated agents list at about 309 px, the same way as the other narrow looks.
4. **B4, `hpc`.** The empty states exist: `Hpc.svelte:68-69` (`hpc.fetching` while starting), `Jobs.svelte:46` (`hpc.no_jobs`) and `Head.svelte:58` (`hpc.queue_empty`). The section and the report say they exist and are unreachable here, with the reason: the cluster is unreachable, and the starting state needs a fresh server, which the rules forbid. Remove "does not exist".
5. **B5, History.** Clear the filter, then measure the populated rows: row height, hover actions and focus. Add "No writes are recorded yet." shown while a filter hides rows as a difference of History's empty state; VS Code's filtered-empty message names the filter.
6. **B6** is not yours. The orchestrator books the Customizations symlink 404 at landing. In the `source` section, call the error state you measured what it is: a source tab refused because the symlink resolves outside every root.

## Proof

7. **P1, icon sizes.** Re-measure the svg sizes as computed (11.5 x 11.5 px at 1em of 11.5px, 13.5 in places, as the refuter found). Write the measured figures everywhere the audit says 12, 13, 14 or 15, Common differences item 19 and the report included.
8. **P2, `file`.** Measure the picture's natural size (`naturalWidth` and `naturalHeight`) and its drawn size. Write both.
9. **P3, `usage`.** Add usage to Common differences item 14. Its "Last seven days" table scrolls at 309 px (scrollWidth 609 against clientWidth 285); give your own measure.
10. **P4 and P5, the theme switch.** Measure again with the tab visible and requestAnimationFrame running. Confirm `document.visibilityState === 'visible'`, and count rAF callbacks over one second before each read. Measure on the source tab and on the populated `doc` and `customization` views. Then:
    - If Monaco repaints at once in a visible tab, Common differences item 2 says there is no difference, and Group 8 is removed from Proposed grouping.
    - If Monaco keeps the old colours, item 2 states it with the reads, and Group 8 stays.
    - If a visible tab cannot be had, item 2 says the measure is not verifiable, with the visibility and rAF reads, and Group 8 is marked as waiting on that measure.

## Standards

11. **S1, citations.** Correct each cite to the line that holds the value for the element compared:
    - `U2-vscode.css:1091`: label the constant by the component its grep matched, or replace it with the explorer's own;
    - `css:1073`: a generic row hover;
    - `css:946`, `css:1006` and `css:1054`: these cite comment lines; cite a value line instead.
12. **S2 and S3, private content in shots.** The shots are committed to git, and oculus moves to its own repository later. So no shot may show transcript content, third parties' names or personal data, applications, leads, funding outcomes, students, account emails or a home path. For each shot the refuter names, retake it from a region or a state that shows none of these, or remove it and write in the section that its measure is by computed styles only, with that reason. The shots named are:
    - `usage-narrow`, `usage-wide`;
    - `search-results`, `timeline-narrow`;
    - `applications-narrow`, `applications-wide`, `leads-narrow`, `leads-wide`, `focus-narrow`, `focus-wide`, `funding-narrow`, `funding-wide`, `education-narrow`, `education-wide`;
    - `events-wide`, `project-wide`, `joint-work-narrow`, `changes-wide`;
    - the tab strips naming a person in `editor-wide`, `note-wide`, `file-wide`, `slides-wide` and `source-wide`.
    
    Look at every shot you keep or take, with the Read tool, for this content. The report lists each shot's fate.
13. **S4, the report's rows.** The row "Config measured by computed styles only" splits in two: no Config shot (DONE, with its command), and the per-shot `local.yml` check (not re-provable for the first run; for this round's shots, done before each, as stated). The header-wrap row names the views with no header tools.

## Behaviour

14. **The tabs on TEST.** Pane 2 of TEST holds 49 tabs, and seven views are duplicated between panes 0 and 2. Close the tabs your audit opened in pane 2, keeping these:
    - the Settings tab;
    - the Config tab, which you never click; close its neighbours with their own close controls, and never select Config;
    - any tab not opened by your audit, where you can tell.
    
    Keep Settings the current tab of pane 2 throughout, and close only tabs that are not current, so that the selection never moves (and never to Config). A tab whose close asks first is not closed. List the tabs each pane holds before and after, read from the DOM.
