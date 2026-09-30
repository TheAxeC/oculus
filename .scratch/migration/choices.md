# Choices made in automode

Each entry is an open item the orchestrator closed itself with the option it judged Axel would take, booked everywhere a ruling is booked (the state file's closed log, `plan.md`'s Rulings, the step's brief). Axel reads this list when he likes: an entry he agrees with is removed; one he disagrees with is discussed, and when it changed what was built it becomes a new step that changes it on top. Newest first.

## Z121 (2026-09-30 23:41, steps S3a and S3b)

The question: four details of the options catalog.

- (1) chosen (a): the file holds one top-level key `options:`, so the merged config gains one key and not six keys named after files. Corrected 23:58 from S3a's brief check: the reason given first, that every other catalog holds one key named for itself, is wrong for `vocab.yml`, which holds 24; the choice stands on the reason above. Not chosen: (b) the six config file names as top-level keys.
- (2) chosen (a): an option's default is the value the tracked file holds. Corrected 23:58 from S3a's brief check: the clause "`null` where leaving the key out means something" is dropped, since the two keys it named hold values in the tracked file (`terminal.font_px: 12.5`, `wallpaper.popover_opacity: 0.97`); their defaults are those values, and their descriptions say what leaving the key out does. Not chosen: (b) the code's fallback, which most readers do not have (lazy).
- (3) chosen (a): a number is refused when oculus's own config readers refuse it, so no min or max fields. Not chosen: (b) `min`, `max` and `integer` in each entry.
- (4) chosen (a): the catalog check fails on a missing or empty description. Not chosen: (b) no such check (lazy).

## Z119 (2026-09-30 23:41, step S3)

The question: whether the Settings editor is one step. Its brief check judged it too large for one builder.

- (a) chosen: three steps, S3a the catalog and its check, S3b the `config-key` write, S3c the editor after both, as Z96 split Q85a.
- (b) not chosen: one step (lazy).

## Z118 (2026-09-30 23:24, step S3)

The question: four shapes of the Settings editor and its catalog that Z94 left open.

- (1) chosen (a): a family of records (the themes, the rail, the arrangements, the collections and the like) is one catalog entry with a `fields:` map explaining each field once. Not chosen: (b) the family explained in one description (lazy).
- (2) chosen (a): every option carries its default except a family and a `local.yml` key. Not chosen: (b) families carry their shipped records as a default.
- (3) chosen (a): the Modified filter is `@modified` typed in the search box, with a filter button that types it, as VS Code does. Not chosen: (b) a checkbox beside the search.
- (4) chosen (a): the per-browser appearance values stay in the Settings view as a group "This browser", and the rail editor and Reset all pages are the controls of their rows. Not chosen: (b) moved out of the Settings view (lazy).

Where it is built: S3's brief, "Decisions taken in this brief" 1 to 4. Booked in the state file's closed log and `plan.md` Rulings.

## Z117 (2026-09-30 22:58, step Q106)

The question: after the dialog fix, where is the keyboard once a tab of another pane is chosen in the palette (Cmd+K)?

- (a) chosen: the chosen tab becomes the active tab and the keyboard goes to it, as VS Code's Quick Open does.
- (b) not chosen: the keyboard goes back to where it was before Cmd+K, so the chosen tab is shown but the other pane stays active. This was the lazy option (no code).

An editor action from the palette (Add Line Comment, Fold All) moves no tab, so the keyboard stays in the editor; the palette's `:tab` and `:goto` commands land on their tab as a picked tab does.

Where it is built: Q106's brief, item 6 (`Palette.svelte`'s `choose` and `run`) and case 19; `HELP.md:90` and `DESIGN.md:218` say it. Booked in the state file's closed log and `plan.md` Rulings.
