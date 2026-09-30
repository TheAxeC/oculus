# Choices made in automode

Each entry is an open item the orchestrator closed itself with the option it judged Axel would take, booked everywhere a ruling is booked (the state file's closed log, `plan.md`'s Rulings, the step's brief). Axel reads this list when he likes: an entry he agrees with is removed; one he disagrees with is discussed, and when it changed what was built it becomes a new step that changes it on top. Newest first.

## Z117 (2026-09-30 22:58, step Q106)

The question: after the dialog fix, where is the keyboard once a tab of another pane is chosen in the palette (Cmd+K)?

- (a) chosen: the chosen tab becomes the active tab and the keyboard goes to it, as VS Code's Quick Open does.
- (b) not chosen: the keyboard goes back to where it was before Cmd+K, so the chosen tab is shown but the other pane stays active. This was the lazy option (no code).

Where it is built: Q106's brief, item 6 (`Palette.svelte`'s `choose`) and case 19; `HELP.md:90` and `DESIGN.md:218` say it. Booked in the state file's closed log and `plan.md` Rulings.
