# Choices made in automode

Each entry is an open item the orchestrator closed itself with the option it judged Axel would take, booked everywhere a ruling is booked (the state file's closed log, `plan.md`'s Rulings, the step's brief). Axel reads this list when he likes: an entry he agrees with is removed; one he disagrees with is discussed, and when it changed what was built it becomes a new step that changes it on top. Newest first.

## Z151 (2026-10-01 11:43, step Q88b)

The question: building the Files view's file operations takes user-visible choices the plan leaves open: whether they show in History with an undo, their route, the label of a two-file diff, the name rule, Upload's limit, the delete question, where the clipboard lives, what of the Explorer stays X3a's, how local.yml is guarded, where Find in Folder shows, and what a read-only row offers.

- Chosen (a): as Q88b's brief, Decisions 1 to 11: not recorded in History (History is the log of `api/write`'s structured writes, and a source save is not in it either); `POST /api/ops` and `GET /api/ops` for the compare; `{left} vs {right}`; VS Code's macOS name rule; files under the 32 MiB body cap the server has; the delete question always shown, no opt-out key; the clipboard and the compare selection page-wide; multi-select, drag and drop, Duplicate, the title-bar buttons, the Explorer's keys and the menu's key hints X3a's (VS Code's macOS rename key is Enter, which opens a file in oculus; booked on X3a's line for its /spec), the wire shapes taking lists; `config/local.yml` protected from every write and copy through the Files view (it holds this machine's secrets), its compare allowed as the source tab reads it; Find in Folder on every folder row, a root's included, and the root's Find in Workspace gone, as VS Code's source places them; the write items on every row with `denied` said, since a listing has no writable flag.
- Not chosen: (b) each operation a write kind of `api/write`, recorded in History with an undo, which needs a record shape for files and an inverse for a Trash move that `trash` does not report.

Where it is built: Q88b's brief, "Decisions taken in this brief". Booked in the state file's closed log and `plan.md` Rulings.

## Z150 (2026-10-01 11:40, step Q88b)

The question: Q88b's line covers three surfaces, each the size of a step: the Files view's file operations (New File, New Folder, Rename, Delete to the Trash, Cut, Copy, Paste, Upload, Compare Selected, Reveal in Finder, Find in Folder), the Source Control rows' git operations (thirteen, each a new server write or read), and the pane strip (Lock Group, New Text File, the Tab Bar and Editor Actions settings) with the page-wide right-click handler.

- Chosen (a): split by surface into Q88b (Files), Q88c (Source Control, after Q88b, which brings `trash`) and Q88d (the pane strip and the right-click handler), as S3 and X3 were split. X3c waits for Q88d, X3a for Q88b.
- Not chosen: (b) one step for all three, one builder and one review across three surfaces.

Where it is built: `plan.md`'s Q88b and Q88c lines. Booked in the state file's closed log and `plan.md` Rulings.

Axel's review (Z152, 2026-10-01 13:11): Q88c and Q88d merged into one step Q88c, after Q88b and S3c; X3c waits for Q88c. Q88b stays its own step (in flight).

## Z149 (2026-10-01 11:08, step S3c)

The question: S3c's brief check found three things the brief left open about the Settings editor. (1) The rail editor and Reset all pages, drawn as the controls of the `rail` and `arrangements` rows, each carry their own heading; (2) what Modified and Reset mean for a "This browser" row; (3) the ui store keeps a seventh per-browser value, the terminal text size, that the brief did not list.

- (1) chosen (a): drawn as a row's control, each leaves out its own heading, since the row's title and the catalog's description stand in its place; their sentence about what a row is stays. Not chosen: (b) both headings kept under the row's title, a heading twice.
- (2) chosen (a): a "This browser" row is Modified when this browser holds a value of its own, and Reset Setting forgets that value so the config's default applies; the ui store takes null for the wallpaper and the code theme as it does for the text size. Not chosen: (b) no Modified or Reset on those rows, the lazy option.
- (3) chosen (a): the terminal text size is a "This browser" row. Not chosen: (b) left to the terminal's own font tools only, the lazy option.

Where it is built: S3c's brief, "The step's line and its rulings" and What to build 1 and 2. Booked in the state file's closed log and `plan.md` Rulings.

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

## Z153 (2026-10-01 13:39, step S3c)

The question: the Terminal text size box and a config number row read a number by one rule; that rule accepts an exponent, so `1e1` is 10.

- Chosen (a): one rule, `1e1` read as 10 in both; `0x10`, `Infinity`, `1,5` and `1x` refused with the config row's message.
- Not chosen: (b) exponents refused in both, which changes a config row's answer; (c) a second rule only for the box.

Where it is built: S3c's round 1. Booked in the state file's closed log and `plan.md` Rulings.

## Z154 (2026-10-01 14:12, step Q85b)

The question: seven answers of the state layer that Q85b's rulings did not name, N1 to N7 of its final report.

- Chosen (a), as built: a channel payload checked once per frame by the socket; an agents answer with lists of the wrong type a failed read; a deposit state that is not whole read as none; a lookup by `constructor` or `__proto__` answers nothing; a search body that is null or not JSON says `HTTP 200`; a terminal counts as busy only when `busy` is `true`; a start answer with an id of the wrong type started with no id.
- Not chosen: a schema pass on every read of a payload; partial values whose type says they are whole; the old answers.

Where it is built: Q85b. Booked in the state file's closed log and `plan.md` Rulings.

## Z155 (2026-10-01 14:56, step Q85b)

The question: an `/api/agents` answer of 200 whose body lacks the `agents`, `accounts` or `findings` list was handed to the view, which then throws reading `agents.find`.

- Chosen (a): a missing list makes the answer a failed read, as a list of the wrong type already does.
- Not chosen: (b) keep handing such a body on, which keeps the throw.

Where it is built: Q85b's round 1. Booked in the state file's closed log and `plan.md` Rulings.

## Z156 (2026-10-01 14:56, step Q88b)

The question: a search scoped to a folder that is not there showed the route's English text, never the catalog sentence.

- Chosen (a): the 400 body carries the refusal word `refused` beside `error`, and the page says the catalog sentence for a word it knows.
- Not chosen: (b) the page matching the route's English text.

Where it is built: Q88b, as the builder's report states it. Booked in the state file's closed log and `plan.md` Rulings.

## Z157 (2026-10-01 15:03, step U3)

The question: a 22 px header (Z146) cannot hold a 26 px search box or text button, so where do a view's inputs and filters go.

- Chosen (a): the header holds the title and 20 px icon actions, with an overflow opener for what does not fit; a bar under the header holds the search boxes, selects, segments, filter toggles and the text buttons whose words carry state.
- Not chosen: (b) a header that grows to hold inputs; (c) every control behind the overflow opener.

Where it is built: U3. Booked in the state file's closed log and `plan.md` Rulings.

## Z158 (2026-10-01 15:14, step Q88b)

The question: the Delete question of a link to a folder said "and its contents", because the listing could not tell a link from a folder.

- Chosen (a): the listing's entry carries `link: true` for a symbolic link, and a link takes the file message.
- Not chosen: (b) keep the folder message for a link.

Where it is built: Q88b's round 1. Booked in the state file's closed log and `plan.md` Rulings.

## Z159 (2026-10-01 15:14, step Q88b)

The question: whether a Cut paste that never reached the server clears the clipboard.

- Chosen (a): it keeps the Cut, since nothing moved; a paste the server refused clears it.
- Not chosen: (b) clear it on every failure.

Where it is built: Q88b's round 1. Booked in the state file's closed log and `plan.md` Rulings.

## Z160 (2026-10-01 15:22, step U3)

The question: the header keeps icon actions only, and the add actions have no glyph.

- Chosen (a): one new glyph `add` (Lucide `plus`) for the add actions; other actions without a glyph go to the bar as text buttons.
- Not chosen: (b) a glyph for every such action; (c) the add actions in the bar.

Where it is built: U3. Booked in the state file's closed log and `plan.md` Rulings.

## Z161 (2026-10-01 15:36, step U3)

- Chosen (A): U3 changes `TabFace.svelte`'s `.cells` to `--fs-xs` and its focus ring to 1px offset -1px, with that file's type-scale pin; nothing else of the tab strip.
- Not chosen: (B) except `ui/tabs/` from case 8's greps (the lazy option).

Where it is built: U3. Booked in the state file's closed log and `plan.md` Rulings.

## Z162 (2026-10-01 16:00, step Q88b)

- Chosen (a): `protected` refuses by identity only (device and inode); making a file where none is at the path is never refused.
- Not chosen: (b) refuse by name in any letter case even where nothing is at the path.

Where it is built: Q88b's landing. Booked in the state file's closed log and `plan.md` Rulings.

## Z163 (2026-10-01 16:55, step Q85c)

- Chosen (a): the step's paths gain `src/lib/data/sources/yaml-file.ts`, where the `readFile` clone of the five source readers is folded, and the rewrite of allowlist lines 46 and 51-54 to the moved test paths; the changed answers are `flattenText` and `loadConfig`'s merge skipping an own `__proto__` key.
- Not chosen: (b) book the fold and the `loadConfig` defect as later steps, the lazy option.

Where it is built: Q85c. Booked in the state file's closed log and `plan.md` Rulings.

## Z164 (2026-10-01 17:12, step U3)

- Chosen (b): a fresh builder takes over U3's worktree as it stands, starts no agent, finishes every item from the brief and the diff as left, runs the cases and reports.
- Not chosen: (a) resume the interrupted builder, which Axel says cannot be done; (c) discard the worktree, which throws away work with no defect found in it.

Where it is built: U3. Booked in the state file's closed log and `plan.md` Rulings.

## Z165 (2026-10-01 17:12, step D31)

- Chosen (a): DESIGN.md:128, DESIGN.md:344 and the head comment of `src/lib/server/git/git-write.ts` name one exception, the timer of `git.autofetch_minutes`, which runs only `git fetch --prune` through the existing call site, in repositories `git remote` names a remote for, only while the key is above 0.
- Not chosen: (b) keep the rule absolute and reverse Z83, the lazy option.

Where it is built: D31. Booked in the state file's closed log and `plan.md` Rulings.

## Z173 (2026-10-01 18:45, step Q85c)

- Chosen (a): the `meta` loops of `sources/collections.ts` and `sources/registries.ts` and the `fields` loop of `snapshot/normalise.ts` skip an own `__proto__` key, with a case each, in Q85c's repair round 1, so the sentence Q85c adds to `DESIGN.md:148` holds for the data folder.
- Not chosen: (b) a booking for a later step, the lazy option.

Where it is built: Q85c. Booked in the state file's closed log and `plan.md` Rulings.

## Z174 (2026-10-01 18:56, step D35)

- Chosen (a): the readers refuse `slurm.poll_min`, `slurm.quota_min`, `calendar.poll_min` and `mail.poll_min` unless above zero, `slurm.days`, `calendar.days_back` and `calendar.days_ahead` below zero, and `mail.per_signal` unless a whole number above zero; the Settings write refuses the same values through those readers, and `options.yml` states each bound. Built in D35, since a cadence of zero made live is a busy loop against the cluster or a provider.
- Not chosen: (b) the readers left accepting any number, the lazy option, leaving a Settings control that makes a poller misbehave.

Where it is built: D35. Booked in the state file's closed log and `plan.md` Rulings.

## Z175 (2026-10-01 18:59, step Q88c)

- Chosen (a): the two rows D31's corrected table shows differing from VS Code that Z172 did not cover are brought to VS Code's default in Q88c: `git.countBadge`, the count of changed files on the rail item that opens the Repositories view (VS Code's `all`, every repository's changes), and `git.autoRepositoryDetection`, each configured root that is not itself a repository scanned one folder deep for repositories (VS Code's `git.repositoryScanMaxDepth` of 1), each listed on the `git` channel like a root.
- Not chosen: (b) both kept as they are and named in Q88c's list of fixed choices, the lazy option, since a repository inside a configured folder stays unseen and the rail says nothing of pending changes.

Where it is built: Q88c. Booked in the state file's closed log and `plan.md` Rulings.

## Z176 (2026-10-01 19:03, step D27)

- Chosen (a): the one extension-to-language map is a top-level key `languages:` in `config/sources.yml`, oculus's language name to a list of endings, an entry with a leading dot an extension and one without a whole file name compared lowercased, the whole name matched first; shown in the Settings view through a family entry of `options.yml`.
- Not chosen: (b) a map from each ending to its language, which repeats the language name on every line and is not the per-language shape Z78 (2) names; (c) the key in `behavior.yml`, whose keys are thresholds and cadences rather than how a file is read.

Where it is built: D27. Booked in the state file's closed log and `plan.md` Rulings.

## Z174, amended (2026-10-01 19:11, step D35)

- Chosen (a): the bounds have an upper limit as well: `slurm.poll_min`, `slurm.quota_min`, `calendar.poll_min`, `mail.poll_min` and `usage_refresh_min` from 1 to 35791 minutes (the longest a Node timer holds; a larger value fires every millisecond); `slurm.days`, `calendar.days_back` and `calendar.days_ahead` whole numbers from 0 to 3650 (ten years); `mail.per_signal` a whole number from 1 to 500 (Gmail's page ceiling).
- Not chosen: (b) "above zero" alone, the lazy option, which leaves 0.00001 and 40000 minutes spinning.

## Z177 (2026-10-01 19:11, step D35)

- Chosen (a): every `local.yml` key except `calendars`, `calendar_dir`, `mail` and `mail_dir` is read once at start and used from that value everywhere; the per-request re-reads of `hub`, `sessions_overrides`, `bookmarks`, `changes` and the terminal routes' `claude_bin` take the start value, so no key is half live; each such key's description says a change takes effect when the server is started again, and `HELP.md:236` says so. Built in D35.
- Not chosen: (b) the per-request re-reads kept with a sentence describing the split, the lazy option, which leaves a hand-edited `hub` writing to one hub while the page shows another until a restart; (c) every key made live, rebuilding the watchers on a `hub` change, a different concern from Z166, which ruled that these keys take a restart.

Where they are built: D35. Booked in the state file's closed log and `plan.md` Rulings.

## Z178 (2026-10-01 19:44, step D27)

- Chosen (a): the `languages` map sits in a new Settings section named Files, the group VS Code's Settings editor puts `files.associations` under, and the status bar and the language picker show each new language by VS Code's own display name: C, C++, CMake, Lua, Ruby, SCSS, Java, Dart, Fortran, Fortran (Fixed Form), Jinja, Svelte and Rite.
- Not chosen: (b) the map under an existing section (Code theme or Roots), which holds keys of another subject; (c) the raw ids (`cpp`, `fortran-fixed`) as display names, the lazy option, since the status bar then shows ids no other language there shows.

Where they are built: D27. Booked in the state file's closed log and `plan.md` Rulings.

