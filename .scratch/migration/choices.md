# Choices made in automode

Each entry is an open item the orchestrator closed itself with the option it judged Axel would take, booked everywhere a ruling is booked (the state file's closed log, `plan.md`'s Rulings, the step's brief). Axel reads this list when he likes: an entry he agrees with is removed; one he disagrees with is discussed, and when it changed what was built it becomes a new step that changes it on top. Newest first.

## Z142 (2026-10-01 06:19, step X3d)

The question: X3d's landing look on TEST showed two differences that are on main before the step: a pane's header actions wrap onto a second line when the pane is narrow and its title long (`Pane.svelte`'s `.tools`, about 480 px), and an open editor or diff keeps the old theme's colours after a live theme switch. (1) Fold both into U2, the step that audits every view's look against VS Code's; (2) a step of their own.

- Chosen (1): U2's What to build 3 and its case 11 carry both. Not chosen: (2) a new step, which would split work U2 exists to do.

## Z141 (2026-10-01 05:31, step X3d)

The question: Round-1 ruling 20 said the change row's status letter keeps its mono font; it is drawn in the interface font (`ChangeRow.svelte:212`), which the first build's audit requires, so the ruling's premise was wrong. (1) Keep the interface font, as built. (2) Mono and the audit changed. Neither is the lazy one.

- Chosen (1): the interface font, as built. Not chosen: (2) mono with the audit changed.

## Z140 (2026-10-01 05:31, step X3d)

The question: Round-1 ruling 4 asked for one shared declaration of the diff pane's and its file header's wall surface; `tests/ui/theme/colours.test.ts` and `wall.test.ts` accept under `body.wall` only a surface token or the literal `color-mix(in srgb, var(--chip) var(--wall-panel), transparent)`, which 13 components repeat.

- Chosen (2): one surface token, the checks taught it, all 13 components on it, at X3d's landing. Not chosen: (1) two literals and an audit (lazy); (3) one component for header and pane.

## Z139 (2026-10-01 03:36, step X3d)

The question: a renamed file in a group diff is drawn as a new file, since `GitEntry` (`model-sessions.ts:323`) holds no old path.

- Chosen (1): `GitEntry` gains `from`, read with rename detection, and the group diff draws "R" and the old path, in X3d's repair round. Not chosen: (2) leave it (lazy).

## Z137 (2026-10-01 03:20, step Q109)

The question: the names of D30's four keys under `terminal:` in `config/appearance.yml`, which Z82 (a) named only by meaning.

- Chosen (a): VS Code's names for the same settings in the file's snake case: `mac_option_is_meta` (false), `copy_on_selection` (false), `cursor_style` (`block`, `line` or `underline`, VS Code's words; `line` is xterm's `bar`) and `cursor_blinking` (false), each default today's behaviour. Not chosen: (b) names of our own (Option as Meta as `option_meta`), which a reader who knows VS Code would have to learn again.

## Z136 (2026-10-01 03:20, step Q109)

The question: the capped debounce Z135 asks for is a debounce with a maximum wait, which `perfect-debounce` (the five server watchers' only debounce, `grep -rln perfect-debounce src tests`) lacks; `libraries: check` names the candidates: `es-toolkit` 1.52.0 (MIT, Toss, released 2026-08-28, own types) whose `es-toolkit/compat` `debounce` takes `maxWait`, `lodash-es` 4.18.1 (MIT, needs `@types/lodash-es`), or a cap written by hand around `perfect-debounce`.

- Chosen (a): `es-toolkit`'s `debounce` from `es-toolkit/compat` with `maxWait` in all five watchers, and `perfect-debounce` removed from `package.json`, so the server has one debounce. Not chosen: (b) `lodash-es` (two packages for the same function); (c) a cap written by hand (lazy, code a library already has).
- Corrected by the orchestrator, automode, at Q109's brief check (`agents/reviews/Q109-brief-check.md`): to (b) `lodash-es` 4.18.1 (MIT, released 2026-04-01) with `@types/lodash-es` 4.17.12, `perfect-debounce` removed. es-toolkit's `maxWait` is checked only when the debounced function is called, so writes every 450 ms publish a change 1150 ms late against a 1000 ms bound; lodash fires on a timer at `maxWait` (1450, 2450 under the same writes) and raises `maxWait` to at least the wait. Not chosen: (a) es-toolkit kept with the bound widened to `maxWait` plus the quiet (lazy, a check loosened); (c) a cap written by hand (code a library already has).

## Z131 (2026-10-01 03:08, step S3a)

The question: whether the week's ticker lines follow `focus_label_mode` with the lane cards, reversing a clause of Axel's Z120 (a). Axel: "you decide 131".

- Chosen (a): cards and ticker lines both follow the key, as S3a built it; one setting governs every project name on the Focus board, and the default `short` changes nothing on screen. Not chosen: (b) the ticker keeps the short handle (lazy, the narrower reading).

## Z135 (2026-10-01 03:10, step Q109)

The question: the same restarting perfect-debounce with no maximum wait holds four more watchers back under steady writes: `machine/usage/watch.ts:94` (500 ms, which also watches Claude's session store and so is held while a session works, its 60 s clock the only update), `root/watch/portfolio.ts:396` (200 ms), `root/watch/bookmarks.ts:69` (500 ms) and `root/watch/local.ts:32` (200 ms); found by Q109's diagnosis 3 by reading, confirmed by `grep -rn perfect-debounce src/lib/server`.

- Chosen (a): Q109 makes the cap one shared helper and puts every one of the five watchers on it, each with a test under steady writes, since its subject is the same defect. Not chosen: (b) a step of its own (a tiny step); (c) only the sessions watcher capped (lazy).

## Z134 (2026-10-01 02:47, step Q109)

The question: the `sessions` channel publishes nothing while a session store is written more often than every 500 ms (one debounce with no maximum wait, `src/lib/server/root/watch/sessions.ts:209-216`).

- Chosen (a): diagnosed and fixed in Q109, whose subject is the terminal list reaching the page. Not chosen: (b) a step of its own; (c) nothing built (lazy).

## Z133 (2026-10-01 02:23, step S3a)

The question: `title:` and `icon:` on the `collections` rows of `config/sources.yml` have no reader (`src/lib/data/index.ts:60-69` keeps `key` and `file`).

- Chosen (a): remove them, as Z130 (a) removed keys no code reads; in S3a's repair round 1. Not chosen: (b) keep them (lazy). `tier:` on the `scan` rows is read by the Projects tab's count split and stays.

## Z132 (2026-10-01 02:23, step S3a)

The question: `map_label_mode` says `title` for the full title where the other label modes say `full`.

- Chosen (a): the map takes `short|full`; in S3a's repair round 1. Not chosen: (b) leave the map's word (lazy).

## Z122, taken off this list (2026-10-01 02:23)

Z122 reverses a clause of Axel's Z120 (a), which automode leaves to him; it is open item Z131.

## Z130 (2026-10-01 01:08, step S3a)

S3a's first run: `board.no_funding.label`, `board.no_funding.sub` (`config/layout.yml:132-134`) and `indexes` (`config/sources.yml:64-69`) have no reader in `src`, so the options catalog can neither leave them out nor describe them truthfully. (a) Remove the three keys and their comments; for: the catalog and the files agree, and the Settings editor offers no option that does nothing; against: two more paths for S3a. (b) Build readers; for: nothing removed; against: the no_funding words would duplicate the text catalog, and `indexes` would be a feature no plan line names. (c) Keep them with entries saying nothing reads them; for: no change to the files; against: inert options in the editor. Closed (a): nothing reads them (the cockpit reads its own copy, `tools/cockpit/data/config/layout.yml:128`). The lazy option was (c).

## Z128 (2026-10-01 00:10, step Q107)

The question: two browser tabs each write the ui store whole, so one drops the other's instance records.

- Chosen (a): `save` merges into the saved records and the store follows another tab's saves, the appearance staying each tab's own; in Q107's repair round. Not chosen: (b) only the docs corrected (lazy).

## Z126 (2026-10-01 00:08, on Axel's question whether other steps are too tiny)

The question: which queued steps are small enough to fold into a step they belong with.

- Chosen (a): D26 into D27 (one extension-to-language map, one grammar loader), D29 into D25 (the editor's per-language options), D30 into Q109 (the terminal), D34 into D23b (two more servers on D23's relay), A2 into D20 (starting an agent session). Kept: D15 (widened to `pdfjs-dist` and SyncTeX both ways, not small), D31 (a git poller no queued step covers), the Q85a steps (Z96, Axel's split; Z127). Not chosen: (b) leave them as steps (lazy).

## Z125 (2026-10-01 00:03, on Axel's word against tiny steps)

The question: where the `focus_label_mode` reader (Z120, Z122) and the `stale_days` fold (Z123) are built.

- Chosen (a): inside S3a, whose catalog describes both keys. Not chosen: (b) one small step holding both (lazy, and a tiny step).

## Z123 (2026-10-01 00:00, step S3a's brief check; adds Q113)

The question: `stale_days` and `refresh_stale_days` both set a feed's staleness (`feeds.ts:56-65`), the later always winning, and `stale_days.audit` has no reader.

- Chosen (a): `refresh_stale_days` is the one key, `stale_days` and the fallback `STALE_DAYS` in code removed; built in S3a (Z125). Not chosen: (b) keep both, the catalog describing the dead values (lazy).

## Z122 (2026-10-01 00:00, step Q112)

The question: Z120 (a) had the comment drop the "This week" ticker on the wrong fact that oculus has none; the Focus board draws it and names projects through the same `labelOf` as the cards.

- Chosen (a): the cards and the ticker lines both take `focus_label_mode`, and the comment keeps the ticker. Not chosen: (b) cards only, the comment dropping the ticker (lazy).

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

