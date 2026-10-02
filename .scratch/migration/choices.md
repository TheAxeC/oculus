# Choices made in automode

Each entry is an open item the orchestrator closed itself with the option it judged Axel would take, booked everywhere a ruling is booked (the state file's closed log, `plan.md`'s Rulings, the step's brief). Axel reads this list when he likes: an entry he agrees with is removed; one he disagrees with is discussed, and when it changed what was built it becomes a new step that changes it on top. Newest first.

## Z151 (2026-10-01 11:43, step Q88b)

The question: building the Files view's file operations takes user-visible choices the plan leaves open: whether they show in History with an undo, their route, the label of a two-file diff, the name rule, Upload's limit, the delete question, where the clipboard lives, what of the Explorer stays X3a's, how local.yml is guarded, where Find in Folder shows, and what a read-only row offers.

- Chosen (a): as Q88b's brief, Decisions 1 to 11: not recorded in History (History is the log of `api/write`'s structured writes, and a source save is not in it either); `POST /api/ops` and `GET /api/ops` for the compare; `{left} vs {right}`; VS Code's macOS name rule; files under the 32 MiB body cap the server has; the delete question always shown, no opt-out key; the clipboard and the compare selection page-wide; multi-select, drag and drop, Duplicate, the title-bar buttons, the Explorer's keys and the menu's key hints X3a's (VS Code's macOS rename key is Enter, which opens a file in oculus; booked on X3a's line for its /spec), the wire shapes taking lists; `config/local.yml` protected from every write and copy through the Files view (it holds this machine's secrets), its compare allowed as the source tab reads it; Find in Folder on every folder row, a root's included, and the root's Find in Workspace gone, as VS Code's source places them; the write items on every row with `denied` said, since a listing has no writable flag.
- Not chosen: (b) each operation a write kind of `api/write`, recorded in History with an undo, which needs a record shape for files and an inverse for a Trash move that `trash` does not report.

Where it is built: Q88b's brief, "Decisions taken in this brief". Booked in the state file's closed log and `plan.md` Rulings.

Reviewed 2026-10-02 (Axel's review of every choice): built wrong. VS Code's Explorer undoes its file operations (`explorer.enableUndo`, default true) and puts the delete question behind `explorer.confirmDelete`. Ruled by Axel: file operations go into History with undo and the delete question gets a setting; built in X3a (Z197).

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

Reviewed 2026-10-02 (Axel's review of every choice): the outcome is right and the reason given was not one; the reason is VS Code's. VS Code draws the letter as `.monaco-icon-label:after{opacity:.75;font-size:90%;font-weight:600;...}` (its `workbench.desktop.main.css`), with no font family of its own, so the letter is in the label's interface font, as built.

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

Reviewed 2026-10-02 (Axel's review of every choice): the first choice, es-toolkit, was wrong and is corrected above to lodash-es. `package.json:26` holds `@types/lodash-es` and `:69` `lodash-es`, and neither `es-toolkit` nor `perfect-debounce` is in it; `maxWait` is passed in `usage/watch.ts:141`, `watch/local.ts:49` and `watch/bookmarks.ts:84`.

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

Reviewed 2026-10-02 (Axel's review of every choice): Z120 (a) first reversed Axel's ruling on the ticker; this entry and Z131 put it back. The ticker reads `focus_label_mode` (`src/lib/state/boards/ticker.ts:195`) and names projects through `focusLabel(project, labelMode)` at lines 215, 337 and 382.

## Z121 (2026-09-30 23:41, steps S3a and S3b)

The question: four details of the options catalog.

- (1) chosen (a): the file holds one top-level key `options:`, so the merged config gains one key and not six keys named after files. Corrected 23:58 from S3a's brief check: the reason given first, that every other catalog holds one key named for itself, is wrong for `vocab.yml`, which holds 24; the choice stands on the reason above. Not chosen: (b) the six config file names as top-level keys.
- (2) chosen (a): an option's default is the value the tracked file holds. Corrected 23:58 from S3a's brief check: the clause "`null` where leaving the key out means something" is dropped, since the two keys it named hold values in the tracked file (`terminal.font_px: 12.5`, `wallpaper.popover_opacity: 0.97`); their defaults are those values, and their descriptions say what leaving the key out does. Not chosen: (b) the code's fallback, which most readers do not have (lazy).
- (3) chosen (a): a number is refused when oculus's own config readers refuse it, so no min or max fields. Not chosen: (b) `min`, `max` and `integer` in each entry.
- (4) chosen (a): the catalog check fails on a missing or empty description. Not chosen: (b) no such check (lazy).

Reviewed 2026-10-02 (Axel's review of every choice): two reasons were wrong when first given and are corrected above; the built file is right. `grep -c "^options:" config/catalogs/options.yml` prints 1 and the file has 1 top-level key; `config/appearance.yml:32` holds `font_px: 12.5` and `:49` holds `popover_opacity: 0.97`, the defaults the catalog takes.

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

Reviewed 2026-10-02 (Axel's review of every choice): the outcome is right and the reason given was not one; the reason is VS Code's. VS Code reads a number setting with `parseFloat` (`static float(o,e){return typeof o=="string"&&(o=parseFloat(o)),...}` in its `workbench.desktop.main.js`), which reads `1e1` as 10. VS Code would read `0x10` as 0; oculus refuses it with the config row's message instead of reading a wrong number.

## Z154 (2026-10-01 14:12, step Q85b)

The question: seven answers of the state layer that Q85b's rulings did not name, N1 to N7 of its final report.

- Chosen (a), as built: a channel payload checked once per frame by the socket; an agents answer with lists of the wrong type a failed read; a deposit state that is not whole read as none; a lookup by `constructor` or `__proto__` answers nothing; a search body that is null or not JSON says `HTTP 200`; a terminal counts as busy only when `busy` is `true`; a start answer with an id of the wrong type started with no id.
- Not chosen: a schema pass on every read of a payload; partial values whose type says they are whole; the old answers.

Where it is built: Q85b. Booked in the state file's closed log and `plan.md` Rulings.

Reviewed 2026-10-02 (Axel's review of every choice): built wrong. The seven answers were accepted as built without judging each, and a search can fail with the words "HTTP 200" (`src/lib/state/sources/search.svelte.ts:127`). Ruled by Axel: each answer judged on its own and the search error made a sentence; built in D32 (Z197, Z198).

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

Reviewed 2026-10-02 (Axel's review of every choice): built wrong. Axel's question behind Z166 asked whether every YAML file reloads, and the restart exception for `local.yml` was written into Z166's option (a) and chosen again here; D35 then removed the per-request re-reads of `local.yml`. Withdrawn by Z198 and Axel's D35 redo ruling: D35 is taken back out of main and prepared again with every `local.yml` key live and every line of this choice removed.

## Z178 (2026-10-01 19:44, step D27)

- Chosen (a): the `languages` map sits in a new Settings section named Files, the group VS Code's Settings editor puts `files.associations` under, and the status bar and the language picker show each new language by VS Code's own display name: C, C++, CMake, Lua, Ruby, SCSS, Java, Dart, Fortran, Fortran (Fixed Form), Jinja, Svelte and Rite.
- Not chosen: (b) the map under an existing section (Code theme or Roots), which holds keys of another subject; (c) the raw ids (`cpp`, `fortran-fixed`) as display names, the lazy option, since the status bar then shows ids no other language there shows.

Where they are built: D27. Booked in the state file's closed log and `plan.md` Rulings.


## Z179 (2026-10-01 20:58, step Q85d)

- Chosen (b): the bodies the views fetch (Changes, CommitFiles, Diff, Graph, Merge and Source's gutter) are read by the rule the state layer reads the server's answers by, in a new `state/sources/repositories/answers.ts`: a list read item by item, the passing items kept, and an `error` that is not text answered by the view's own failure sentence. The answers that change are each a case that fails on the unchanged tree.
- Not chosen: (a) today's answers kept, a cast list of unchecked items handed on whole and `DESIGN.md:148` naming the views as an exception, the lazy option, since it leaves the untyped input the step exists to end.

Where they are built: Q85d. Booked in the state file's closed log and `plan.md` Rulings.

## Z182 (2026-10-01 21:53, step X3a)

- Chosen (a): the Explorer's problem decorations move to D33, the Problems view, which brings the diagnostics they read, and the Outline section's symbols for code languages move to D23, the language server client, which brings the symbol provider; X3a builds the Outline section with the headings of Markdown and LaTeX files and every other row of the parity inventory.
- Not chosen: (b) X3a builds a diagnostics source and a symbol provider of its own, which D23 and D33 then replace, two builds of one thing; (c) the two rows dropped, the lazy option, since VS Code's Explorer shows both.

Where they are built: X3a, D23 and D33. Booked in the state file's closed log and `plan.md` Rulings.

## Z183 (2026-10-01 21:53, step D35)

- Chosen (a): Z177 amended so `apps_dir` is read again on a change, as Axel's apps ruling C1 (`agents/reviews/E1-rulings.md:7`) puts it beside `calendar_dir` and `mail_dir` and `DESIGN.md:266` has the watcher follow a new `apps_dir`; `DESIGN.md:236` names it among the keys read again. No code, since apps are not built.
- Not chosen: (b) `apps_dir` read at start only, with `DESIGN.md:244` and `:266` rewritten, which reverses Axel's ruling; (c) the two sentences left contradicting each other, the lazy option.

Where they are built: D35 (repair round 1). Booked in the state file's closed log and `plan.md` Rulings.

## Z184 (2026-10-01 22:03, step L4)

- Chosen (a): (1) a browser with a saved layout from before L4 gets the shipped floats, and the Live HPC and Usage tabs move from its Focus page into the docked float with their state; (2) a view opened while its tab sits in a float activates that tab; (3) a kept empty pane stays empty whatever removes its last tab; (4) a press in a float never makes the float the place a view opens; (5) a float has no maximise and stays drawn while a page pane is maximised; (6) a build older than L4 reads the new saved layout as none, since each port keeps its own browser storage.
- Not chosen: (b) saved Focus pages left as they are, so existing browsers never see the float the plan line asks for "on every page", the lazy option; (c) a second instance opened beside the float's; (d) the kept rule on a close and a drag only, so an edge drop or a cross-page move removes a pane a close would keep.

Where they are built: L4. Booked in the state file's closed log and `plan.md` Rulings.

## Z188 (2026-10-01 22:15, step X3a)

- Chosen (a): X3a's brief-check findings other than the picker (Z187) closed in its brief: the default workspace's roots written to `sources.yml` through a new list-edit write; a `history` key in `local.yml`; no catalog entry for `file-nesting.yml`; an `ignored` flag on listed entries; git decorations on the existing `--c-scm-*` tokens with VS Code's letters; the file log as a git read; `local.yml` never copied into the history; Paste into the same folder as Duplicate; folder drags under their own type; Seti colours derived on light themes only.
- Not chosen: (b) each finding left for a later step, the lazy option.

Where they are built: X3a. Booked in the state file's closed log and `plan.md` Rulings.

Reviewed 2026-10-02 (Axel's review of every choice): wrong. It closed about twelve findings in one entry and took user-visible decisions in it (the `roots:` of `sources.yml` written by the default workspace, a `history` key in `local.yml`, the route names, the `file-nesting.yml` shape, the `~/.oculus/history` layout). Redone at X3a's /spec, one entry per decision.

## Z189 (2026-10-01 23:05, step Q35)

- Chosen (a): the Present deck fills its pane as a 16:9 frame at a 1280 by 720 design size, the slide scaled uniformly to the frame and letterboxed on the long side; the slide parts keep their sizes inside the frame; the Overview grid is not scaled.
- Not chosen: (b) the slide's words sized in container units so the slide reflows to any pane shape (a slide then looks different in every pane and on the projector); (c) the slide left at the UI's type size, the lazy option.

Where it is built: Q35. Booked in the state file's closed log and `plan.md` Rulings.

Reviewed 2026-10-02 (Axel's review of every choice): the first version was wrong (the slide parts kept the interface's sizes inside the frame); Z193 corrected it in Q35's brief (`agents/briefs/Q35.md` items 5 and 6) and the round-0 ruling `agents/briefs/Q35-cases.md` fixed case 8. Built by Q35's builder.

## Z191 (2026-10-01 23:04, step D11)

- Chosen (a): D11 waits for D17. Z92 (1) (a) gives each launch configuration a `before`, the name of a command of `.oculus/commands.yml`, and that file is D17's; the tree reads no such file (`grep -rn "commands.yml" src` prints nothing). D17 has no wait of its own, so it is prepared now and D11 after it lands.
- Not chosen: (b) D11 built now with `before` left out and added by D17, which moves part of D11's ruled scope into another step, the lazy option; (c) D11 building its own reader of `commands.yml`, which D17 then rebuilds.

Where it is built: D11, after D17. Booked in the state file's closed log and `plan.md` Rulings.

## Z193 (2026-10-01 23:13, step Q35)

- Chosen (a): Z189 amended. The slide parts are laid out for the 1280 by 720 frame: a slide type scale on the frame in px at the design size (56, 36, 28, 24, 18, times the text size), 64 px padding, Title and Closing centred, reading widths at most 1040 px and centred in place of the `ch` caps, a slide taller than the frame scrolling inside it with `jump.ts` correcting for the scale. Q35's brief check showed that the frame with the parts at the UI's tokens fills about a third of the frame's width and draws words at 6 to 7 px in a 700 px pane.
- Not chosen: (b) the frame with the parts unchanged, which leaves the slide in the frame's left third, the lazy option; (c) no scaling, the deck box stretched and the parts centred, which keeps the UI's sizes but is no slide shape a projector shows.

Where it is built: Q35. Booked in the state file's closed log and `plan.md` Rulings.

## Z195 (2026-10-01 23:18, step D20)

- Chosen (a): D20 waits for D17. `DESIGN.md:150` runs "an agent seeded with a task" only after the reader approved that exact text, the approval kept under `~/.oculus/`; no approval store exists (`grep -rn "approval" src/lib` finds none for a command), and D17's brief builds it (`approvals.json`). D20 then seeds its agents through that store.
- Not chosen: (b) D20 building its own approval store, which D17 then duplicates; (c) D20 seeding agents without approval, against the Processes rule, the lazy option.

Where it is built: D20, after D17. Booked in the state file's closed log and `plan.md` Rulings.


## Z197 (2026-10-02 00:45, steps X3a, D32, Q115)

The question: whether Q114 and Q115 stay steps of their own.

- Chosen (a): Q114 folded into X3a, which already builds the Files view's History (`~/.oculus/history`, item 14 of its brief) and whose brief is written again at /spec; the search's "HTTP 200" error (`search.svelte.ts:127`) folded into D32, which changes the Search view's state; Q115 keeps the six other answers, in `socket.svelte.ts`, `agents.svelte.ts`, `deposit.svelte.ts`, `selectors.svelte.ts` and `pty-io.ts`, which no queued step touches.
- Not chosen: (b) both kept as steps, which builds History twice and touches `search.svelte.ts` in two steps; (c) Q115 folded whole into D32, which puts five files outside the Search view into a Search step.

Where it is built: X3a, D32 and Q115; Q115 folded into D32 by Z198. Booked in the state file's closed log and `plan.md` Rulings.

## Z198 (2026-10-02 00:58, steps D35, D32)

The question: Axel's review that D35 was to end the exception that `local.yml` does not reload, and that a small step of its own wastes tokens.

- Chosen (a): D35 taken back out of its landing and prepared again from its patch, with every `local.yml` key made live (`hub` rebuilding the watchers, `port` rebinding, the session files, `claude_bin` and the stores read again when the file changes) and no key taking a restart. The restart exception written into Z166's option (a) and chosen again at Z177, under which D35 removed the per-request re-reads of `local.yml` (`loadLocalOrDefaults`), is withdrawn. Q115 folded whole into D32.
- Not chosen: (b) D35 landed as built and `local.yml` made live later in S4, which lands a change that makes `local.yml` less live than before; (c) a step of its own for `local.yml`, and Q115 kept as a step, the small steps Axel rejected.

Where it is built: D35 and D32. Booked in the state file's closed log and `plan.md` Rulings.

## Z199 (2026-10-02 01:45, step X3a)

The question: where Add Folder to Workspace and Remove Folder from Workspace write when the workspace in force is the default one (Z188 redone, its first decision).

- Chosen (a): the default workspace's folders are the `roots:` of `config/sources.yml`, written through a new list-edit write of `sources.yml:roots` (each entry `{ key, dir }`, the file's comments kept), as Z76 (a) rules "the default workspace's folders edited from the page". A configured root shown inside a named workspace offers no Remove there, and `refused_root_fixed` says why; the hub and the engine's `config/` folder have no Remove anywhere.
- Not chosen: (b) the default workspace kept in `~/.oculus/workspaces.json` like a named one, `sources.yml` never written, which leaves the configured roots uneditable from the page, against Z76 (a); (c) the Settings view's `config-key` write, which refuses a list of records (`not_single`, `config-key.ts:155-159`).

Where it is built: X3a. Booked in the state file's closed log and `plan.md` Rulings.

## Z200 (2026-10-02 01:45, step X3a)

The question: where the local history folder is set (brief check 6.2).

- Chosen (a): a `history` key of `local.yml`, default `~/.oculus/history`, beside `workspaces`, `bookmarks`, `notes` and `changes`, in `LOCAL_KEYS`, the options catalog's `local.yml` block and HELP.md's list of the keys; read at every request, so a change of it is live as D35 rules every key; tests point it at a scratch folder.
- Not chosen: (b) a fixed `~/.oculus/history` with no key, which no test can redirect and which breaks the rule that no test writes `~/.oculus`.

Where it is built: X3a. Booked in the state file's closed log and `plan.md` Rulings.

## Z201 (2026-10-02 01:45, step X3a)

The question: the layout of the local history folder (brief check 6.3).

- Chosen (a): one folder per file, named by the first 16 hex digits of the SHA-256 of the file's real path, holding `entries.json` (`{ path, saves: [{ id, at, size, kind }] }`, `kind` `save` or `delete`) and one copy per save named by its id (the time as `YYYYMMDDTHHMMSSmmm`, a `-n` suffix for a second save in the same millisecond); 50 copies of kind `save` kept per file, none over 256 KB (the 2026-09-25 ruling); a copy of kind `delete` up to 5 MB (Z212).
- Not chosen: (b) the file's path as a folder tree under the history folder, which spreads the hub's tree into `~/.oculus` and breaks on a renamed root; (c) VS Code's own layout (`<hash>/entries.json` with random names), whose names say nothing to a reader of the folder.

Where it is built: X3a. Booked in the state file's closed log and `plan.md` Rulings.

## Z202 (2026-10-02 01:45, step X3a)

The question: the names and answers of the step's three new reads and one new write (brief check 4.5, 4.7, 6.3).

- Chosen (a): `POST /api/folders/pick` runs the JavaScript for Automation helper of Z187 and answers `{ ok: true, paths: [...] }` (empty when the panel is cancelled) or `{ error: 'unsupported' | 'failed' }`; `GET /api/history?root=<key>&path=<rel>` answers `{ ok: true, saves: [...] }` newest first, and with `&id=<id>` that copy's text, the id taken only from the file's own `entries.json`; the file's commits through the git reads' own form, `GET /api/git?log=<repository>&path=<rel>` beside `blame`, answering `{ ok: true, commits: [...] }`, 50 at most, `git log --follow` with the path after `--` as a literal pathspec. Each takes the token and answers with the `NO_STORE` headers of the other reads.
- Not chosen: (b) `GET /api/folders?dir=` listing any folder's names, which Z187 replaced; (c) `GET /api/git/file-log`, a second convention beside the git reads'.

Where it is built: X3a. Booked in the state file's closed log and `plan.md` Rulings.

## Z203 (2026-10-02 01:45, step X3a)

The question: the shape of `config/catalogs/file-nesting.yml` and whether the options catalog describes it (brief check 4.2, 6.3).

- Chosen (a): one top-level key `patterns:`, a map from a parent pattern to the list of its children's patterns, seeded with VS Code 1.137.0's default `explorer.fileNesting.patterns`, `${capture}` and `${basename}` kept as VS Code writes them, with a head comment; no options-catalog entry, since no catalog file has one, and `DESIGN.md:44` and `tests/checks/config/config-folder.test.ts` name the file and pin its key.
- Not chosen: (b) VS Code's own form, one comma-separated string per parent, which is harder to read and edit in YAML; (c) an options-catalog entry, a shape no catalog file has.

Where it is built: X3a. Booked in the state file's closed log and `plan.md` Rulings.

## Z204 (2026-10-02 01:45, step X3a)

The question: how the Files view knows a listed entry is ignored by git, to draw it muted (brief check 4.3).

- Chosen (a): a listed entry carries `ignored: true` when the ignored toggle shows ignored entries and git ignores it, from the same `ignoredIn` read and cache the listing uses to leave them out; the listing's other entries are unchanged.
- Not chosen: (b) a second request per folder for its ignored names, which doubles the reads of every expanded folder; (c) no muted state, which leaves a row of VS Code's Explorer out.

Where it is built: X3a. Booked in the state file's closed log and `plan.md` Rulings.

## Z205 (2026-10-02 01:45, step X3a)

The question: the letters and colours of the Explorer's git decorations (brief check 4.4).

- Chosen (a): VS Code's git extension's letters: `M` modified, `U` untracked, `A` added, `D` deleted, `R` renamed, `!` conflict; drawn in the existing `--c-scm-added`, `--c-scm-modified`, `--c-scm-deleted`, `--c-scm-conflict` tokens and their `-txt` pairs, untracked in the added hue as VS Code's default themes draw both green, renamed in the modified hue; a folder holding a changed file takes the colour of the strongest change below it (conflict, then deleted, modified, added) with no letter; an ignored entry in the muted text colour.
- Not chosen: (b) a new `--git-*` token family for the same hues, the duplication the rules file bans; (c) `C` for a conflict, which is VS Code's letter for a copy.

Where it is built: X3a. Booked in the state file's closed log and `plan.md` Rulings.

## Z206 (2026-10-02 01:45, step X3a)

The question: what Duplicate is, which Z151 decision 8 gives X3a (brief check 2.1).

- Chosen (a): Duplicate is Copy and then Paste into the same folder, which names the copy by VS Code's rule (`a copy.md`, `a copy 2.md`), as VS Code's Explorer does; no menu item, since VS Code 1.137.0 has none (`grep -o 'duplicate[A-Za-z]*File' workbench.desktop.main.js` prints nothing); a case proves it.
- Not chosen: (b) a Duplicate menu item VS Code does not have.

Where it is built: X3a. Booked in the state file's closed log and `plan.md` Rulings.

## Z207 (2026-10-02 01:45, step X3a)

The question: what a dragged folder row carries (brief check 6.8).

- Chosen (a): a folder row drags under a drag type of its own, which only the Files tree takes as a drop; a file row keeps `FILE_DRAG`, so the composer and the terminal grid take files as today and never a folder.
- Not chosen: (b) folders under `FILE_DRAG`, which hands the composer and the terminal grid a folder path they were never built for.

Where it is built: X3a. Booked in the state file's closed log and `plan.md` Rulings.

## Z208 (2026-10-02 01:45, step X3a)

The question: which themes Z138's darker Seti colours apply to (brief check 5.3).

- Chosen (a): a theme is light when its `--panel` has a higher WCAG luminance than its `--text`; on a light theme each `--seti-*` is darkened in its own hue until it clears 3:1 on `--panel`, the contrast WCAG asks of a graphic; on a dark theme the values stay seti-ui's.
- Not chosen: (b) `readable` run on every theme, which would lighten `--seti-ignore` and `--seti-grey` on dark grounds, against Z138; (c) a light flag written into each theme, which adds a field every theme must carry.

Where it is built: X3a. Booked in the state file's closed log and `plan.md` Rulings.

## Z209 (2026-10-02 01:45, step X3a)

The question: the palette commands for Switch Workspace, Save Workspace As and Open Folder (brief check 6.3, 6.4).

- Chosen (a): three palette commands, `:workspace` (its results the saved workspaces and the default one, the one in force marked; a pick switches in place), `:workspace-save <name>` (saves the folders in force under the name, refusing an empty or taken name with the Workspaces section's words) and `:folder` (Open Folder: the folder panel, then a Files tab rooted at the chosen folder); the header's menu items open the palette with the command typed. The palette stays the shell's; the commands reach the fs store and the layout store, as the other commands do.
- Not chosen: (b) a quick-pick mode of its own in the palette, a second input form the palette does not have; (c) a dialog of the Files view, which the shell cannot open when the page has no Files tab.

Where it is built: X3a. Booked in the state file's closed log and `plan.md` Rulings.

## Z210 (2026-10-02 01:45, step X3a)

The question: what Show in Files opens for each of its five callers (brief check 6.7).

- Chosen (a): Show in Files of a folder (a project card, a person's supervision folder) opens a Files tab rooted at that folder, or activates one already rooted there, with a `..` row that moves the top one folder up as far as the root that serves it; Show in Files of a file (an entry card's path, a venue card's path, the Repositories view's reveal) reveals it in the page's Files tab as today; the rooted top is the instance state's `top`, which `follow` already uses; a rooted tab draws its folder as its one top row and no workspace header.
- Not chosen: (b) every caller rooting a new tab, which opens a tab per file shown; (c) every caller revealing in the page's tab, against Z1.

Where it is built: X3a. Booked in the state file's closed log and `plan.md` Rulings.

## Z211 (2026-10-02 01:45, step X3a)

The question: how the page knows a bookmark names a folder, with the bookmark still `{ root, path }` (brief check 6.6).

- Chosen (a): the bookmarks read answers each entry with a `kind` of `file`, `folder` or `missing`, from a stat of the path under its root at the read; `bookmarkRows` gives a folder the view `files`, which reveals it expanded and selected, and the rail draws a folder icon for it; a `missing` one is drawn as the Bookmarks section draws a gone file today.
- Not chosen: (b) a guess from the name (no extension), wrong for `Makefile` and for `a.d`; (c) a `kind` written into the bookmarks file, against Z167's unchanged shape.

Where it is built: X3a. Booked in the state file's closed log and `plan.md` Rulings.

## Z212 (2026-10-02 01:45, step X3a)

The question: how the Files view's operations go into History with undo (Q114, folded into X3a by Z197).

- Chosen (a): each operation of `POST /api/ops` that changed something (create, rename, move, copy, paste, upload, trash, delete) is one change-log record (`key: files`, the field the operation, before and after the paths, a new undo kind `file`), drawn in History with its undo control, and Cmd+Z in the Files view undoes the newest one not yet undone, Shift+Cmd+Z takes that undo back, as VS Code's Explorer. The undo is checked as every undo is: a create or copy is moved to the Trash only while the file is as the operation left it (size and modification time), a rename or move goes back only while the target is there and the old name free, and a delete is undone by writing back each file whose content was kept before the delete, up to 5 MB a file as VS Code keeps it (`maxSize` 5e6 in VS Code 1.137.0), a folder coming back empty as in VS Code, the rest in the Trash; the content is kept in the local history (Z201, kind `delete`). The undo of a delete asks first, as VS Code's.
- Not chosen: (b) the operations in History with no undo, which is not what Axel ruled; (c) a folder's files kept whole on delete, which copies a large folder's bytes before every delete for an undo VS Code does not offer.

Where it is built: X3a. Booked in the state file's closed log and `plan.md` Rulings.

## Z213 (2026-10-02 01:45, step X3a)

The question: the setting behind the delete question (Q114, Z151 review).

- Chosen (a): `files.confirm_delete` in `config/behavior.yml`, default `true`, as VS Code's `explorer.confirmDelete`; the delete question gains VS Code's "Do not ask me again" box, which writes `false` through the Settings view's `config-key` write; with it `false` a delete to the Trash goes without the question and a permanent delete still asks, as VS Code's; read again at every config push (D35); described in the options catalog and HELP.md. The drag-and-drop question stays fixed at VS Code's default, as the Settings ruling fixes the Explorer's other confirms.
- Not chosen: (b) a key in `local.yml`, which holds this machine's paths and secrets and no behaviour; (c) the drag-and-drop confirm made a setting too, which the Settings ruling fixed.

Where it is built: X3a. Booked in the state file's closed log and `plan.md` Rulings.

## Z214 (2026-10-02 01:45, step X3a)

The question: the place of the listing toggles and the starting state of the new sections (the brief's decisions 1 and 4).

- Chosen (a): the hidden-files and ignored-files toggles and the File Nesting toggle sit in the workspace header's `...` menu as checked items, kept per tab, as VS Code puts a view's options in its `...` menu; Open Editors, Outline and Timeline start collapsed, as VS Code 1.137.0 registers its Outline (`collapsed:!0`), so the tree keeps its room until a reader opens one; each section's open state kept per tab.
- Not chosen: (b) the toggles kept in the bar beside the filter, which VS Code's Explorer has no place for; (c) the sections open at first, which takes the tree's room before a reader asks for them.

Where it is built: X3a. Booked in the state file's closed log and `plan.md` Rulings.

## Z216 (2026-10-02 01:57, step D24)

The question: how the Personal board finds the six repositories that carry a `.oculus/project.yml` (the ruling of 2026-09-25 left it to /spec, a new config key being Axel's).

- Chosen (a): the board reads every Files root; ordo, scotoma, officium and youtube-downloader join cathedra and game-engine under `roots:` in `config/sources.yml`, so the six are roots of the default workspace and no key is added.
- Not chosen: (b) a new list key the board reads, which the ruling makes a stop and which repeats what `roots:` holds; (c) the saved workspace of `~/.oculus/workspaces.json`, which holds only `~/.claude` and is this machine's file.

Where it is built: D24. Booked in the state file's closed log and `plan.md` Rulings.

## Z218 (2026-10-02 02:03, step D24)

The question: the hub tier of side projects.

- Chosen (a): a flat scan rule `{ dir: side-projects, type: side-project, tier: personal, optional: true }` after `projects/ideas` in `config/sources.yml`, tier id `side-projects`, its manifests kept in a new snapshot entity kind `personal` and never in `projects`.
- Not chosen: (b) side projects as `projects` with their tier filtered out by each research reader, which needs a filter in every reader of the snapshot's projects and lets any reader added later show them.

Where it is built: D24. Booked in the state file's closed log and `plan.md` Rulings.

## Z219 (2026-10-02 02:03, step D24)

The question: where the Personal board sits.

- Chosen (a): a view `personal`, "Personal", glyph `spark`, the fourth tab of the Projects page after Archive (`config/layout.yml` arrangement `projects`).
- Not chosen: (b) a rail page of its own, a twelfth button for a handful of cards.

Where it is built: D24. Booked in the state file's closed log and `plan.md` Rulings.

## Z220 (2026-10-02 02:03, step D24)

The question: the status vocabulary.

- Chosen (a): `side_project_status:` in `config/catalogs/vocab.yml` in the shape of `career_host_status:`: running (`live`, #16a34a), building (`active`, #d4a017), idea (`idea`, #0891b2), parked (`snooze`, #9ca3af), the order the board sorts in.
- Not chosen: (b) the words and colours in code, against the catalog rule; (c) the research status chips, which carry none of the four words.

Where it is built: D24. Booked in the state file's closed log and `plan.md` Rulings.

## Z221 (2026-10-02 02:03, step D24)

The question: what the board and a card do.

- Chosen (a): a search and a toggle per status kept per tab, cards sorted by status then title; a card draws title, status chip, eli5, next, links and where it lives; the title opens the manifest in the editor, Show in Files opens its folder; no facets, list mode or form.
- Not chosen: (b) the research board's facets and list mode, which read research fields a side project has none of; (c) an edit form, which is Q91's manifest editor.

Where it is built: D24. Booked in the state file's closed log and `plan.md` Rulings.

## Z222 (2026-10-02 02:03, step D24)

The question: what a wrong manifest gives.

- Chosen (a): an unknown status, a missing title and a key outside the five are findings and the card is still drawn (status `unknown`, the folder name as title); a file that does not parse is a finding and no card; a root without the file gives nothing.
- Not chosen: (b) no card for any wrong field, which hides a side project over a typo.

Where it is built: D24. Booked in the state file's closed log and `plan.md` Rulings.

## Z223 (2026-10-02 02:03, step D24)

The question: how the repositories' manifests reach the page.

- Chosen (a): the portfolio build reads `<root>/.oculus/project.yml` for each Files root the watcher passes, id `root:<key>`, one card per real directory, each root's `.oculus/` watched so a change reaches an open page.
- Not chosen: (b) a route of its own read on demand, which leaves an open page stale until reloaded.

Where it is built: D24. Booked in the state file's closed log and `plan.md` Rulings.

## Z224 (2026-10-02 02:08, step M4)

The question: how each equation is written in its PRESENT.md.

- Chosen (a): the LaTeX of `make_equations.py` byte for byte as a single-quoted YAML scalar on the `equation:` line, a `'` doubled; all 13 round-trip through `yaml.safe_load` unchanged.
- Not chosen: (b) a double-quoted scalar, every backslash doubled; (c) a block scalar, which changes the front matter's one-line shape.

Where it is built: M4. Booked in the state file's closed log and `plan.md` Rulings.

## Z225 (2026-10-02 02:08, step M4)

The question: what is left of the image branch.

- Chosen (a): `deck.equations_dir`, the image lookup, `equationImage`, `equationMissing`, the `<img>` and gap branches and their catalog keys removed; an `equation:` naming an image file becomes the finding `findings.present.equation_image` and draws nothing.
- Not chosen: (b) a file name typeset as LaTeX without a word; (c) the branch kept, which the plan line removes once unused.

Where it is built: M4. Booked in the state file's closed log and `plan.md` Rulings.

## Z226 (2026-10-02 02:08, step M4)

The question: the dashboard subtitle that names `tools/present`.

- Chosen (a): `config/catalogs/meta.yml`'s subtitle names the Present view as the showcase.
- Not chosen: (b) the subtitle kept, which points at a deck oculus no longer reads.

Where it is built: M4. Booked in the state file's closed log and `plan.md` Rulings.

## Z227 (2026-10-02 02:26, step D24)

The question: whether research readers see a side project.

- Chosen (a): `readManifests` skips the `side-projects` tier and a new `readPersonal` reads it, so the deposit route, subtask and manifest writes, the chat context and project files never find a side project by id.
- Not chosen: (b) refusals added to each write route, which leaves the next caller of `readManifests` open; (c) the exposure documented, the lazy option.

Where it is built: D24. Booked in the state file's closed log and `plan.md` Rulings.

## Z228 (2026-10-02 02:26, step D24)

The question: which roots the board reads and how it hears a change.

- Chosen (a): `browserRoots` without the hub and engine roots, deduplicated by real path; each root's `.oculus/` watched, through its parent while it does not exist; the saved workspaces file polled as the git watcher polls it.
- Not chosen: (b) the configured roots only, which leaves a folder added in a named workspace off the board.

Where it is built: D24. Booked in the state file's closed log and `plan.md` Rulings.

## Z229 (2026-10-02 02:26, step D24)

The question: the `*.yml` ignore rule of youtube-downloader.

- Chosen (a): at the landing `~/workspace/youtube-downloader/.gitignore` gains `!.oculus/project.yml` after line 4, committed with the manifest.
- Not chosen: (b) `git add -f`, which leaves the next change of the file ignored; (c) the file left untracked, the lazy option.

Where it is built: D24. Booked in the state file's closed log and `plan.md` Rulings.

## Z230 (2026-10-02 02:26, step D24)

The question: what a `links` entry is.

- Chosen (a): text; an entry `posting()` accepts (`http` or `https`) is a link opened in a new tab, every other entry plain text; a non-list or non-text entry a finding.
- Not chosen: (b) any entry a link, which makes a `javascript:` entry from a repository clickable.

Where it is built: D24. Booked in the state file's closed log and `plan.md` Rulings.

## Z231 (2026-10-02 02:26, step D24)

The question: card ids and what file is read.

- Chosen (a): ids `side:<slug>` and `root:<key>`; only a regular file of at most 64 KiB is read, anything else a finding.
- Not chosen: (b) bare slugs and keys, which collide and can be reserved object keys.

Where it is built: D24. Booked in the state file's closed log and `plan.md` Rulings.

## Z232 (2026-10-02 02:26, step D24)

The question: a drafted manifest's title.

- Chosen (a): the project's name from its README's first heading (Missal for game-engine).
- Not chosen: (b) the folder name, which is not what the project is called.

Where it is built: D24. Booked in the state file's closed log and `plan.md` Rulings.

## Z233 (2026-10-02 02:26, step M4)

The question: the cockpit deck, which reads the same `equation:` field.

- Chosen (a): `tools/present/build.py` draws a LaTeX value through the deck's MathJax, with an `argmin` macro in `mathconfig.js`, and the sentences of `tools/present` that name the image form are rewritten; the research-cockpit skill's step 6 waits for O29, since skills are edited only by Axel.
- Not chosen: (b) the deck left without its 13 equations until O29, a regression of the public deck.

Where it is built: M4. Booked in the state file's closed log and `plan.md` Rulings.

## Z234 (2026-10-02 02:26, step M4)

The question: how the 13 lines are written.

- Chosen (a): by the script the brief names, the plan line's "by script": each `equation: eq_<id>.png` replaced by its `make_equations.py` entry, one line per file, checked by a dry run (13 files, one line each).
- Not chosen: (b) 13 hand edits, against spec.md's rule that a builder writes under `projects/` only through a named script.

Where it is built: M4. Booked in the state file's closed log and `plan.md` Rulings.

## Z235 (2026-10-02 02:26, step M4)

The question: how the 13 are tested.

- Chosen (a): no test reads `tools/present`; `integrity.test.ts` asserts the real hub's 13 slides carry an equation, give no finding and render with no `katex-error`; the comparison with `make_equations.py` is the landing's command.
- Not chosen: (b) the 13 strings as constants in a test, which compares a file with a copy of itself.

Where it is built: M4. Booked in the state file's closed log and `plan.md` Rulings.
