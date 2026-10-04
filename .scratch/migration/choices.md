# Choices made in automode

Each entry is an open item the orchestrator closed itself with the option it judged Axel would take, booked everywhere a ruling is booked (the state file's closed log, `plan.md`'s Rulings, the step's brief). Axel reads this list when he likes: an entry he agrees with is removed; one he disagrees with is discussed, and when it changed what was built it becomes a new step that changes it on top. Newest first.

## Z429 (2026-10-05, step X3f)

The question: X3f's builder found that case 33 (a removed file pressed opens the cannot-open line) has no rule in the brief; today a removed file of a name outside the named formats opens a download tab with a dead link.

- Chosen (1): a 404 is read as a `missing` kind and opens the source tab's cannot-open line with Retry, as VS Code opens an editor saying the file was not found; three paths join the step.
- Not chosen: (2) open nothing and say it in the Files view, a new place to say it that nothing names; (3) reword the case to the download tab, which keeps a dead link (the lazy one).

Where it is built: `agents/briefs/X3f-cases.md`. Booked in `plan.md` Rulings.

## Z428 (2026-10-05, step S5)

The question: S5 needs a heading for every option and a control for every text, list and family field, and the catalog keys that say them.

- Chosen: the table and the decisions of `agents/briefs/S5.md`; each field takes the control its value needs (a choice of a short list or of another list's keys, a glyph, a hue or palette colour picker, a multi-pick, a folder or file box, a nested sub-editor), text only for free words and for names the reader makes up.
- Not chosen: keeping text boxes for the fields whose values come from a list (the lazy one), and per-option control code in the view in place of catalog keys, which would put the vocabulary outside `options.yml`.

Where it is built: S5's brief. Booked in `plan.md` Rulings.

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

## Z236 (2026-10-02 02:47, step M4)

The question: how the deck draws `\bm{\beta}`, which the vendored MathJax does not define.

- Chosen (a): vendor MathJax 3.2.2's `boldsymbol` extension beside `tex-svg.js`, load it offline, and define `bm` as `\boldsymbol`, so the deck draws a bold beta as the image does.
- Not chosen: (b) `bm` as `\mathbf`, which draws a plain beta; the lazy option. (c) Change the slide's LaTeX, which breaks Z234.

Where it is built: M4 (`agents/briefs/M4-cases.md`). Booked in the state file's closed log and `plan.md` Rulings.

## Z237 (2026-10-02 02:47, step M4)

The question: how the deck draws `\text{\small X}`, which MathJax shows as literal text.

- Chosen (a): `build.py` rewrites it to `{\small\text{X}}` in the value it emits for MathJax; the slide values stay as written; the typeset check counts `merror` and red nodes.
- Not chosen: (b) accept the literal `\small` in the deck; the lazy option. (c) Change the slides' LaTeX, which breaks Z234 and the PNG source.

Where it is built: M4. Booked in the state file's closed log and `plan.md` Rulings.

## Z238 (2026-10-02 02:47, step M4)

The question: the paths the builder found it needs outside the brief's list, and a blank equation.

- Chosen (a): add the `Equation.svelte` row of `type-scale.test.ts`, one `deck.css` rule for the MathJax card, and the vendored extension file; `slide()` drops a blank equation.
- Not chosen: (b) leave `type-scale.test.ts` failing or the card unbounded, which leaves the step red or a slide overflowing.

Where it is built: M4. Booked in the state file's closed log and `plan.md` Rulings.

## Z239 (2026-10-02 05:20, step D35)

The question: a page that follows the server to its new port lands on a new origin, whose `localStorage` holds none of the workbench layout and none of the "This browser" settings (D35's review, Behaviour 1).

- Chosen (b): the page carries them across. Before it follows, the page writes the layout and the UI settings it holds into `window.name`; the page loaded at the new address reads them from `window.name` before `loadUi` and `loadLayout`, writes them into its own `localStorage`, and clears `window.name`. Nothing goes to the server, and no new shape is seen by the reader: the workbench comes back as it was.
- Not chosen: (a) follow and state the loss, which is the lazy option and drops the reader's open tabs and pages on every port change; (c) tell the page the new address and leave the reader to go, which loses the same state when the reader goes.

Where it is built: D35, repair round 1. Booked in the state file's closed log and `plan.md` Rulings.

## Z240 (2026-10-02 06:50, step Q88c)

The question: the user-visible choices and blocking findings Q88c's brief check left open (`agents/reviews/Q88c-brief-check.md`, sections 5 and 6).

- Chosen (a): each closed in the brief with VS Code's own behaviour, read from VS Code 1.137.0's git extension: the Trash question's strings, singular and plural; Add to .gitignore written as `ignore` writes it; Open File (HEAD) opening the change's left side (HEAD for a staged change, the index for a working-tree change, not offered on an untracked file); the "Reopen Closed Repositories" quick pick with "All Repositories"; Close Other Repositories only with more than one open; Cherry Pick on every commit, an empty pick aborted; Compare with Remote and Compare with... with the ref on the left; Compare with Merge Base against the base `getBranchBase` reads, without writing the setting back; Open Worktree and Open Worktree in New Window; the badge as `countBadge: all`; the status-limit warning with oculus's 200. Oculus's own: `user.useConfigOnly` passed through git's environment variables so the write gate's reading of the argument vector is unchanged; the read module moved into `server/core/git/` to stay under the size and folder limits; the git route given the Files route's Trash guard. Delete Branch runs `-d` only until Axel rules on Z241.
- Not chosen: (b) a smaller brief leaving these to the builder, which is the lazy option and leaves the builder to take user-visible choices.

Where it is built: Q88c. Booked in the state file's closed log and `plan.md` Rulings.

## Z242 (2026-10-02 08:24, step X3a)

The question: how many copies of deleted files the local history keeps (X3a's review, Behaviour 2: a delete keeps a copy of up to 5 MB with no count or total cap, so `~/.oculus/history` grows without bound unless each delete is undone).

- Chosen (a): the newest 50 delete copies are kept over all files, the oldest removed first when a delete adds the 51st, the bound VS Code's local history keeps per file (`workbench.localHistory.maxFileEntries`, 50); an undo of a delete whose copy was pruned refuses with a sentence saying the copy is gone; said in HELP.md beside the 5 MB limit.
- Not chosen: (b) a total size cap in bytes, which needs a size walk of the folder at every delete;
- Not chosen: (c) no cap, the lazy option, which leaves the folder growing without bound.

Where it is built: X3a. Booked in the state file's closed log and `plan.md` Rulings.

## Z243 (2026-10-02 08:24, step X3a)

The question: what a drag of a file from one root onto another does (X3a's review, Spec 3: the brief's case 8 said a copy and a trash of the source; the tree's `moveItem` renames, with copy and remove only across devices, and nothing goes to the Trash).

- Chosen (a): one move, as built and as VS Code does between workspace folders; one `move` record in History, undone by one move back; case 8 is met by `tests/state/sources/explorer/acts/store.test.ts` "moves between two roots in one paste".
- Not chosen: (b) a copy and a trash of the source as the brief said, which puts a file the reader moved into the Trash and makes two History records of one drop.

Where it is built: X3a. Booked in the state file's closed log and `plan.md` Rulings.

## Z244 (2026-10-02 08:24, step D18)

The question: when the Processes view's server read runs (D18's brief check 5.1: the socket has no unsubscribe message, so a read gated on a mounted Processes tab cannot stop when the tab closes).

- Chosen (b): the HPC poller's pattern, as the plan line books it: the page subscribes to `processes` with every channel, the watcher reads every ten seconds while the hub has any subscriber and stops when the last page closes; no new wire message.
- Not chosen: (a) an unsubscribe message on the wire and a hub `unsubscribe`, so reads stop when the last Processes tab closes: a protocol change for every channel, outside the step's subject;
- Not chosen: (c) gate on the first subscribe and say in the docs that reads go on until the page reloads, the lazy option, which leaves the docs' sentence half true.

Where it is built: D18. Booked in the state file's closed log and `plan.md` Rulings.

## Z245 (2026-10-02 08:24, step D18)

The question: which tmux sessions count as oculus's own (D18's brief check 3.4, 6.9, 6.17, 6.18: `listTerminals()` never returns the usage sessions, which live seconds and have no id to stop; a foreign `oculus-` session has no terminal; `#{pane_pid}` of `list-sessions` is the active pane only).

- Chosen (a): every pane of every terminal session (`tmux list-panes -a`), its pane process and every descendant; the usage sessions and foreign sessions are left out of own and of the agent count, and appear only when a pattern matches their command, with no Stop.
- Not chosen: (b) the usage sessions as own with no Stop, which adds an agent to the head line for a few seconds every refresh;
- Not chosen: (c) the active pane only, the lazy option, which leaves a split terminal's other panes out.

Where it is built: D18. Booked in the state file's closed log and `plan.md` Rulings.

## Z246 (2026-10-02 08:24, step D18)

The question: what the head line counts as agents (D18's brief check 6.15, 6.16: a wrapper and its native child would count twice, and counting only listed rows makes the count depend on the patterns).

- Chosen (a): over the whole table by Decision 2's rule, whatever `processes.patterns` holds, a matched agent whose parent is an agent of the same program not counted again; a project is in flight when an oculus terminal or such an agent works in its folder.
- Not chosen: (b) every matched process counted, which doubles a wrapped agent;
- Not chosen: (c) only listed rows, which drops an agent from the head line when the patterns leave its program out.

Where it is built: D18. Booked in the state file's closed log and `plan.md` Rulings.

## Z247 (2026-10-02 08:24, step D18)

The question: how much of each command line the `processes` payload carries every ten seconds (D18's brief check 6.7: the default `node` pattern matches every language server and test worker, and a command line can run to tens of kilobytes).

- Chosen (a): the payload's `command` is cut at 1,000 characters with `...`, which keeps every program and its first arguments; every matching row is listed.
- Not chosen: (b) the whole line, which sends tens of kilobytes per row to every page every ten seconds;
- Not chosen: (c) a row cap, which hides processes the reader is looking for.

Where it is built: D18. Booked in the state file's closed log and `plan.md` Rulings.

## Z248 (2026-10-02 08:37, step M3)

The question: which entries `registries/resources.yml` starts with, and what the 17 manifests' `compute: hpc` and `compute: local` become.

- Chosen (a): three entries, `utwente` (cluster, host `utwente`, the access rules of the UTwente cluster), `this-mac` (machine) and `data` (storage, `~/data`); `hpc` becomes `[utwente]` and `local` becomes `[this-mac]`, each trailing comment kept.
- Not chosen: (b) only the cluster entry, which leaves the eight `local` manifests with no key to name;
- Not chosen: (c) leaving the manifests as they are, which the validator then reports in 17 places and the board stops reading.

Where it is built: M3. Booked in the state file's closed log and `plan.md` Rulings.

## Z249 (2026-10-02 08:37, step M3)

The question: how the board, the card and the form show a list of resource keys.

- Chosen (a): the Compute facet's values are the keys, labelled by the entry's name; the card draws one tag per entry, the HPC glyph on a cluster; the form field is `type: chips, from: resources`, as the datasets field is.
- Not chosen: (b) collapsing the list back to "HPC" or "Local" by kind, which hides which cluster or machine a project uses, the reason the registry exists.

Where it is built: M3. Booked in the state file's closed log and `plan.md` Rulings.

## Z250 (2026-10-02 08:37, step M3)

The question: how the Live HPC poller finds its host once `slurm.resource` names a registry entry, and what happens when the key names no cluster with a host.

- Chosen (a): `hpc_host` of local.yml when set, else the `host` of the cluster entry `slurm.resource` names, resolved at start, at each config push, at each local.yml change and after each portfolio rebuild; a key that resolves to no host gives the existing `unreachable` status with a sentence naming why, and no ssh runs; the server still starts.
- Not chosen: (b) refusing to start, which takes the whole server down over a registry edit;
- Not chosen: (c) resolving at start only, which leaves the poller on a stale host after the registry changes.

Where it is built: M3. Booked in the state file's closed log and `plan.md` Rulings.

## Z254 (2026-10-02, X3a at landing): how a delete finds the delete copies to prune

- Chosen (a): an index `deletes.json` beside the file folders, `{ deletes: [{ folder, id, at }] }`, oldest first; a delete reads it and the folders of the copies it removes; a missing or unreadable index is built again from the folders once; a folder left with no copy is removed.
- Not chosen: (b) every folder read on every delete, the review's B1, whose cost grows with the history.
- Not chosen: (c) an index held in the server's memory, which the module's no-state rule forbids and a restart loses.

Where it is built: X3a's landing. Booked in the state file's closed log and `plan.md` Rulings.

## Z255 (2026-10-02, found at X3a's landing): `~/` in a `local.yml` path key

- Chosen (a): `~/` is the home folder for every path key, as for an account's `dir`; folded into M3's repair round.
- Not chosen: (b) the path keys left as they are, where `history: ~/h` writes under `config/~/h`, the lazy option.

Where it is built: M3's repair round. Booked in the state file's closed log and `plan.md` Rulings.

## Z256 (2026-10-02, A1's first review): the id of a session's diff pane

- Chosen (a): `${side}@${session}:${root}:${path}`; a diff with no session keeps `${side}:${root}:${path}`; the side tokens hold no `@`, so a path cannot produce a session id.
- Not chosen: (b) the brief's `${place}:${session}`, where a file named `a.ts:s-1` takes the id of `a.ts` opened for session `s-1`.
- Not chosen: (c) leaving it, since session ids are long, which keeps a collision the review showed, the lazy option.

Where it is built: A1's repair round 1. Booked in the state file's closed log and `plan.md` Rulings.

## Z258 (2026-10-02, D32's /spec): how the unused-exports script finds its exports

- Chosen (a): `knip` 6.39.0 (ISC, Lars Kappert, released 2026-09-30, supports SvelteKit and Svelte files) in production mode with `--include exports,types`, which leaves every test file out of the reading; an export imported only by test files is reported. A module's tests are read as the test files that import it, so this computes the approved rule. Run on main at 3a308a8f it reported 241 unused exports and 110 unused types; five checked by grep: `FILE_FIELDS` (`data/file-ops.ts`, imported nowhere else), `searchArgs` (own file and `tests/data/helpers/search.test.ts`), `codeThemeIds` (own file and `appearance.test.ts`), `languageNamed` (re-exported by `state/shared/words/languages.ts`, imported by one test), `hostZone` (own file and one test).
- Not chosen: (b) a hand-written import resolver over `$lib`, relative paths, re-exports and Svelte module scripts, which repeats what knip does and is the larger job to keep right.
- Not chosen: (c) reading a module's tests as only the test file that mirrors its path, which this repository does not name tests by.

Where it is built: D32. Booked in the state file's closed log and `plan.md` Rulings.

## Z259 (2026-10-02, D32's /spec): the bare-status errors beyond the search

- Chosen (a): every error the page builds from a bare HTTP status becomes a sentence of the catalog: an answer whose body cannot be read says that the server's answer could not be read, and a refused request with no text of its own says the status in a sentence. `grep -rn 'String(response.status)\|HTTP \${' src/lib/state src/lib/views src/lib/ui` lists 29 places in 14 files, the search's two among them.
- Not chosen: (b) the search's two places only, as Z197 worded it, which leaves the same words in the agents, terminal, deposit, writes and twelve other readers, the lazy option.

Where it is built: D32. Booked in the state file's closed log and `plan.md` Rulings.

## Z257 (2026-10-02, D18's first review): the process table and LA18

- Chosen by Axel (b): `systeminformation` dropped; one `ps -axo pid=,ppid=,pcpu=,rss=,lstart=,command=` run oculus starts itself, with a timeout and a kill on `close()`, read by a hand-written parser. The three defects the review found in the library (a command line with a `:` losing its arguments, `started` an hour off after a clock change, an unbounded `ps` child not ended on close) end at their cause.
- Not chosen: (a) the library for the rows and a second `ps` read for the command lines, two reads that can disagree and a child still not ended; (c) the library as it is, the lazy option.

Where it is built: D18's repair round 1. Booked in the state file's closed log and `plan.md` Rulings.

## Z260 (2026-10-02, Axel's report): sticky scroll's structure

- Chosen by Axel (a): D25 gives Monaco the Markdown and LaTeX headings as document symbols, from the parser the Files Outline uses, and bracket-based folding to the brace languages that have no Monaco language service; D23's clangd symbols then replace the folding for C and C++. TypeScript, JavaScript, JSON and CSS already have Monaco's own services (`kit/workers.ts:17-21`), and Python's indented blocks give the indentation model the right scopes.
- Not chosen: waiting for D23 alone, which leaves Markdown and LaTeX with no sticky lines.

Where it is built: D25. Booked in the state file's closed log and `plan.md` Rulings.

## Z261 (2026-10-02, Axel's report): large files uncoloured

- Chosen (a): `editor.paint_limit_kb` defaults to 20480; `config/behavior.yml:113` holds 64, so `orchestrator-state.md` (1,107,333 bytes) opens as plaintext (`views/sources/source/Editor.svelte:8-9,110-111`). Monaco tokenizes a line at a time in the background, viewport first, so the size of the file does not set the cost of a keystroke; the typing delay on that file is measured at D25's landing.
- Not chosen: (b) keeping 64 KB and saying so, the lazy option; (c) removing the key, which drops the setting a slow machine would want.

Where it is built: D25. Booked in the state file's closed log and `plan.md` Rulings.

## Z262 (2026-10-02, Axel's report): the tab's path, Open Editors order, the Files breadcrumb

- Chosen (a): X3c gives a tab the full path of its file as its tooltip, as VS Code's tab hover does (no tab has a `title` today, read on TEST with `[...document.querySelectorAll('[role=tab]')].map(t => t.title)`); a drag along Open Editors reorders the tabs; the breadcrumb above the Files tree (`Files.svelte:198`, `crumbsOf`) goes once X3c's breadcrumbs over a file tab (Z47 4 (a)) are in, since VS Code's Explorer has none.
- Not chosen: a path shown at the bottom of the screen as Finder's path bar, which VS Code does not do and which the status bar's space would carry for one tab only.

Where it is built: X3c. Booked in the state file's closed log and `plan.md` Rulings.

## Z264 (2026-10-02, D32's brief check): how the replace text is read

- Chosen (a): the replace text means what it means in VS Code. VS Code's source (`src/vs/workbench/services/search/common/replace.ts` and `src/vs/base/common/search.ts` on main, read for this ruling) reads `\n`, `\t` and `\\` and `$0` in regex mode. It runs JavaScript's `replace` on the match alone only when the text holds `$0`-`$99`, `` $` `` or `$'`, and otherwise writes the text as typed, so `$&` alone stays `$&`. It applies `\u \U \l \L` only directly before `$N`, and Preserve Case to the pattern before the substitution. The search run asks ripgrep for every group's text of each match, and one function of `data/` evaluates VS Code's rules over them, on the page for the live preview and on the server for the write.
- Not chosen: (b) the brief's first reading (JavaScript's `$&` and `$$` always, Preserve Case after the substitution), which differs from VS Code on `$&` alone, `$$` alone and `$1` patterns under Preserve Case; (c) ripgrep's own syntax shown to the reader, the lazy option, which makes the reader learn a second syntax.
- Differences kept, each with its reason, in D32's brief: a file a tab holds with unsaved text is left out (oculus searches the disk, VS Code the open buffer); no Replace All on a folder row (the Search view has no folder rows; a file names its root).

Where it is built: D32. Booked in the state file's closed log and `plan.md` Rulings.

## Z265 (2026-10-02, D32's brief check): a refusal's own text

- Chosen (a): the page shows a refusal's `error` only when it is a refusal word of the catalog, worded from the catalog; the search route's English refusal texts (`search-routes.ts:29-35`, `:51`) become words; any other body text gives the `answer_refused` sentence with the status. The rules file maps an engine's error to a catalog line before it is shown.
- Not chosen: (b) Z259's "a body's own `error` text is kept", which shows English from the server unmapped.

Where it is built: D32. Booked in the state file's closed log and `plan.md` Rulings.


## Z277 (2026-10-02, M3's round review): the worktrees' folder list

- Chosen: `tools/present` added to `worktree_paths` in `.agents/plan.yaml` and the state file. `tools/cockpit/tests/run.sh` runs `test_presentation.py`, which imports `deck_config` from `tools/present`, so in a worktree without that folder the script exits 1 on a file no step changed.
- Not chosen: running the script without `test_presentation.py` in a worktree, the lazy option, which leaves one part of the cockpit's check unrun on every step.

Where it applies: every worktree made from now on. Booked in the state file's closed log and `plan.md` Rulings.

## Z192 (2026-10-02, D14's brief check): the LaTeX view's shape

- Chosen: a view `latex` ("LaTeX") opened from the Files row menu on a `.tex` file or a folder holding one, state `{ root, path }`; `/api/latex` folder forms beside the project form, both with `outline` and `count`; `latex.auto_build` (`on_save`, `never`) in `behavior.yml`; latexmk with the magic comment's program; the save's build not shown; Count Words on a press. This is how LaTeX Workshop is reached and behaves.
- Not chosen: the panel kept on project tabs only, the lazy option, which leaves the funding and application folders without a build.

Where it applies: D14. Booked in the state file's closed log and `plan.md` Rulings.

## Z278 (2026-10-02, D14's brief check): LaTeX formatting

- Chosen: Format Document in a `.tex` source tab through `tex-fmt --stdin` (LaTeX Workshop's other formatter; `latexindent` stops on this machine with `Can't locate File/HomeDir.pm`), an undoable edit of the tab's text, in D14; ChkTeX stays D36's.
- Not chosen: the parity row's formatting left unbuilt, the lazy option.

Where it applies: D14. Booked in the state file's closed log and `plan.md` Rulings.

## Z279 (2026-10-02, D14's brief check): one LaTeX reader on latex-utensils

- Chosen: magic comments, the root and the sections read with `latex-utensils` (LA18), and the Files Outline's hand reader replaced by the same shared reader.
- Not chosen: the hand readers kept beside the library, the lazy option, which leaves two LaTeX section readers.

Where it applies: D14, and the Files Outline and D25's sticky scroll through the shared reader. Booked in the state file's closed log and `plan.md` Rulings.

## Z194 (2026-10-02, D17's brief check): the command files and approvals

- Chosen: the form's `~/.oculus/commands.json` through the write chain; `depends_on` in order; approvals in the one `approvals.json` `DESIGN.md` describes (`command:<sha256>` over the exact text and folders, 0600, rename and read back), shared with the apps; a chain in one task terminal; `remain-on-exit` in the same tmux call; Restart behind a confirmation naming the process.
- Not chosen: a separate approvals file of D17's own shape, which contradicts `DESIGN.md`; Restart with no confirmation, which contradicts the Processes rule.

Where it applies: D17, and the apps and D20 through the shared approvals module. Booked in the state file's closed log and `plan.md` Rulings.

## Z389 (2026-10-04, T1d's first run): which view tests the audits check reads

The check as Z376 (b) set it flags 393 cases in 47 files that test plain `.ts` modules of `src/lib/views/`, whose own folder is `tests/views/`. Options: (a) the check reads only files that import a `.svelte` component, and a file that imports none tests a view-layer module and stays; (b) a new folder for those tests, about 47 files moved and `tests/` mirroring `src/lib/` no longer; (c) the allow list and "audits" titles kept, the lazy option. Chosen (a): every view test that imports a view must draw it, and nothing moves away from the code it tests.

## Z388 (2026-10-04, T1b's round review): a bound cleared on success

`arrival.ts` arms a real 1000 ms timer while a test waits for a signal and clears it when the signal comes. Options: (a) a bound with no timer on success, through `onTestFailed` or the test's `signal`, not verified to carry the message; (b) no Decision 1 cause, since the test awaits the signal; (c) the tests tagged slow, the lazy option. Chosen (b).

## Z387 (2026-10-04, T1b's round): same-branch rows in the failed-read table

Six rows of `shared/answers.test.ts`'s failed-read table turn red only together with a kept row under every control. Options: (a) kept, the lazy option; (b) deleted at landing. Chosen (b): one test per behaviour.

## Z386 (2026-10-04, T1b's round): the refusal words' mapping

After the catalog-text test was deleted, nothing checks that `refusalSentence` maps each of 19 file-operation words to its own key. Options: (a) left, the lazy option; (b) a test of distinct keys over `answers.ts` with the catalog stubbed, added at landing. Chosen (b): it asserts code, not catalog text.

## Z385 (2026-10-04, T1e's review): the route-shape check

`tests/routes/shape.test.ts` reads the source of every API route for structure; no written rule asks for it. Options: (a) deleted, the source-text kind the test rule removes; (b) a rule written into `DESIGN.md` and the check moved to `tests/checks`; (c) kept with no rule, the lazy option. Chosen (a).

## Z384 (2026-10-04, T1e's review): slow tags under 100 ms

Seven file and describe tags and three per-test tags covered tests whose minimum was under 100 ms in both the builder's runs and the reviewer's. Options: (a) a tag stands on a cause or a minimum of 100 ms or more, a file or describe tag only where every test under it meets one, the rest moved to single tests; (b) left as near-the-line tags under Z379, the lazy option, which takes passing tests out of every gate. Chosen (a).

## Z383 (2026-10-04, T1b's review): a process started at module load in a slow-tagged file

The file tag keeps a file's tests out of `npm test` but not its imports, so `commands-pane.test.ts` still runs `tmux -V` and spends about 6 s on import in every quick run. Options: (a) a file-tagged file imports such a module with `await import` inside its slow `beforeAll`, T1b's file in its round and T1c's tmux files in T1a; (b) the brief's premise left as written, the lazy option. Chosen (a).

## Z382 (2026-10-04, T1b's review): work at collection

T1b moved a cold config read (about 118 ms) from a `beforeEach` into a describe body, where it runs at collection and leaves the measured test time. Options: (a) collection work counts with the tests it serves, as a hook does; (b) it does not, the lazy option. Chosen (a): the read goes into that describe's `beforeAll`, and the describe is tagged slow.

## Z381 (2026-10-04, T1b's review): assertion cuts in kept tests and a new fold file

About 94 hunks cut or rewrite assertions of kept tests (shipped constants, catalog text, cases on the same branch as a kept one), and the refusal tables of eight stores moved into a new `shared/answers.test.ts`. Options: (a) accepted as deletions under the test rule and as a fold to the lowest level, each cut listed with its holder, the new file's catalog-text test deleted and its tests given failing lines; (b) every cut put back, the lazy option; (c) accepted with no listing. Chosen (a).

## Z380 (2026-10-04, Axel): the look of Q81

Axel: leave the look of Q81 for later. It waits until he takes it up, is not asked of him in reports, and other landings go on.

## Z377 (2026-10-04, the recurring-findings pass): the size check's line

In 9 of the last 14 steps a builder left a file within 20 lines of the size check's line. Options: (a) `tests/checks/tree/size.test.ts` and `utils/size-check.sh` refuse a file over 880 lines and a component over 520, built in T1a, which splits the 13 files on main over those numbers; (b) the rule stays a sentence in `agents/spec.md`, the lazy option. Chosen (a): a builder then sees the line in its own run.

## Z376 (2026-10-04, /spec T1d): the audits check against Z354

`tests/checks/tree/audits.test.ts` fails a non-rendering case under `tests/views/` unless its title starts with "audits" or it is on `allow-audits.txt`; Z354 says no audits. Options: (a) delete the check and its list; (b) rewrite the check to compute one fact, each case under `tests/views/` whose body reaches no `render()`, no `mount()` and no name the file binds to one, failed with no title escape and no allow list, a kept case of that kind moved to the folder of the code it calls, T1d dispatched after T1b lands; (c) keep "audits" in the titles, the lazy option. Chosen (b): it holds Z354 by a fact a machine computes. What the check computes is the sentence of (b), for Axel's review.

## Z379 (2026-10-04, T1c's landing): the tests near the 100 ms line

Two five-run samples, the builder's and the round reviewer's, taken at different loads, put 8 tagged tests under 100 ms and one untagged test over it, and no test sat on the wrong side in both. Options: (a) the builder's measured tags stand, and T1a chooses the quick list from measured file times within its 30 s limit; (b) retag every test by the minimum over both samples; (c) tag every test near the line, the lazy option. Chosen (a): the line moves with the load, and T1a decides what runs quick.

## Z378 (2026-10-04, the recurring-findings pass): the rule sentences

Nine causes recur in three or more of the 14 steps reviewed since 2026-10-02: builder git commands (8 steps), paths outside the write list unmarked (11), exports with no importer (9), files brought near the size line (9), documents made false (11), assertion edits unlisted (6), first runs not per test (5), history wording (4), reviewer git commands (7). Options: (a) the sentences adopted under Z251 (the user: each such cause ends in a rule sentence or a sentence every brief carries); (b) each raised to Axel; (c) nothing changed, the lazy option. Chosen (a): `agents/spec.md` and the standing demands now carry them, the record in `agents/reviews/recurring-2026-10-04.md`.

## Z375 (2026-10-03, D25's owed look of the hunk bar at 300 px): where the cut Revert Block is fixed

The look found Revert Block drawn under the diff's overview ruler in a pane about 300 px wide, its label cut to "Revert Bl". Options: (a) built in D42, the next open step on the diff view; (b) a step of its own, which enters the plan only by Axel's ruling; (c) left, the lazy option. Taken: (a).

## Z364 (2026-10-03, the slow tier's run): the bare `isMap` imports

- Chosen (a): T1 fixes the three imports and lands with the slow tier green but for X3e's colour finding.
- Not chosen: (b) a fix outside any step; (c) a new step, which only Axel adds.

Where it applies: T1. Booked in the state file's closed log and `plan.md` Rulings.

## Z362 (2026-10-03, D25's landing): the looks not taken

- Chosen (a): the four looks are owed in `queue.md` and taken at the next look session.
- Not chosen: (b) leaving them to their tests, the lazy option.

Where it applies: the owed looks. Booked in the state file's closed log and `plan.md` Rulings.

## Z359 (2026-10-03, D25's landing): the open-editors dirty dot and the colour rule

- Chosen (a): X3e, the Files view step, is widened: the open-editors list's dirty dot takes a colour token the slow colour rule accepts.
- Not chosen: (b) a fix at D25's landing, outside D25's brief (the Files view is X3a's and X3e's); (c) widening the rule to accept `currentColor`, a check loosened, the lazy option.

Where it applies: X3e. Booked in the state file's closed log and `plan.md` Rulings.

## Z358 (2026-10-03, Q91's look): the Focus ticker's cut rows

- Chosen (a): X3e is widened: a ticker row cut by its ellipsis gives its whole text as its tooltip.
- Not chosen: (b) a new step for one tooltip, which only Axel's ruling can add; (c) leaving the cut end unreadable, the lazy option.

Where it applies: X3e. Booked in the state file's closed log and `plan.md` Rulings.

## Z355 (2026-10-03, Axel's test ruling): the tests of the steps in flight

- Chosen (a): the landing of X3c, Q91 and D25 reads each test the step added and deletes those that break `agents/spec.md`'s test rule, as a fix at landing.
- Not chosen: (b) leaving them to T1, which reads the tree at its own base and misses the tests of a step that lands after it; the lazy option.

Where it applies: the landings of X3c, Q91 and D25. Booked in the state file's closed log and `plan.md` Rulings.

## Z352 (2026-10-03, Axel's question): T1 runs alone

- Chosen (a): T1 is prepared once X3c, Q91 and D25 have landed, its timings and its landing's 30 s check are taken with nothing else running, and nothing else is dispatched until it lands.
- Not chosen: (b) T1 beside other steps with timings in quiet moments, which cannot be arranged.

Where it applies: T1 and the queue. Booked in the state file's closed log and `plan.md` Rulings.

## Z349 (2026-10-03, D25's repair round 1): where three test files of D25 live

- Chosen (b): `symbols.test.ts`, `source-options.test.ts` and `compare-header.client.test.ts` go back under `tests/state/` with titles that say what they assert, since `tests/checks/tree/audits.test.ts` lets a case under `tests/views/` that renders nothing stand only as an audit.
- Not chosen: (a) 32 cases titled "audits that ..." while they assert values, the cheaper option; (c) entries in the closed `allow-audits.txt`.

Where it applies: D25, fixed at its landing. Booked in the state file's closed log and `plan.md` Rulings.

## Z330 (2026-10-03, D25's brief check): the language picker's entries and the repository file read again

- Chosen (a): the language picker takes VS Code 1.137's entries: Auto Detect (oculus's detection by name and extension), Configure File Association for '<ending>'... (a second list; its choice writes `sources.yml`'s `languages:` through the undoable `config-value` write), Configure '<language>' language based settings... (the Settings view at `@id:editor.languages`), each language's description `(<name>)` and the one in force `(<name>) - Configured Language`; the Marketplace entry left out. A source-tab save marks the saved file's text, so `.oculus/settings.yml` saved in oculus is read again at once; an edit outside oculus at the Files view's refresh or a reload.
- Not chosen: (b) the brief's earlier picker ("(current)", Configure File Association opening Settings) and a reload to see a changed repository file, the lazy option; (c) a server poll of every root's `.oculus/settings.yml`, while no other Files text is watched.

Where it is built: D25's brief, items 2 and 13, decisions 10 and 11. Booked in the state file's closed log and `plan.md` Rulings.

## Z329 (2026-10-03, /spec D25): the editor options' keys

- Chosen: `editor.tab_size` 4, `editor.insert_spaces` true, `editor.word_wrap` off (off, on, wordWrapColumn, bounded), `editor.minimap` true, `editor.render_whitespace` selection (none, boundary, selection, trailing, all), `editor.sticky_scroll` true, and the family `editor.languages` keyed by language with `tab_size`, `insert_spaces`, `word_wrap` and `rulers`, all in `config/behavior.yml`'s `editor:` block; a repository's `.oculus/settings.yml` with `languages:`, read from the Files root holding the file; a value taken from the tab's choice, the detected indentation, the root's file, `editor.languages`, then the global key; the Settings view naming each root whose file sets a language, with a link.
- Not chosen: a separate `editor.yml`; VS Code's quoted `"[python]"` keys; a global `editor.rulers`, which the list editor cannot hold as numbers.

Where it applies: D25. Booked in the state file's closed log and `plan.md` Rulings.

## Z324 (2026-10-03, /spec X3c): the brief check's findings closed

- Chosen: a pinned tab keeps its pin across a float, a page move and a split; Delete on a pinned tab follows VS Code's `preventPinnedEditorClose` default; Pin Editor and Unpin Editor are palette items of kind `editor` with Cmd+K Shift+Enter as a hint; the tab menu is VS Code 1.137's with Reveal in Finder, Compare, Keep Open disabled off a preview, the Split & Move submenu and the name Show in Files; `wrap_tabs` repaired to `false` with no finding, its actions at the end of the last row; the breadcrumb in the strip's title area; the tooltip's `~` from a home folder the roots answer gains; a `doc` tab read under the hub root; a new tab opens right of the active one; the strip measured against VS Code's stylesheet; the Open Editors Close All keeps pinned tabs.
- Not chosen: a live Cmd+K Shift+Enter chord, which changes what Cmd+K does everywhere; a pin lost on a float; the narrower menu of the first brief, the lazy option; the breadcrumb inside `PaneBody`, which enlarges its drop box.

Where it applies: X3c. Booked in the state file's closed log and `plan.md` Rulings.

## Z323 (2026-10-03, D17's look): a task terminal's row title

- Chosen: a task terminal's row in the Terminal tab's list is titled by the project command it ran, as its tab is, a title the reader gave still winning.
- Not chosen: the process tmux reports, which reads `cd` for every task line.

Where it applies: D17. Booked in the state file's closed log and `plan.md` Rulings.

## Z322 (2026-10-03, D17's look): a run's source tab

- Chosen: a command run from a button in another view (the bar, the card, the Files menu) reads its placeholders from the source tab on screen, or else from the source tab whose editor had the focus last, as VS Code's `${file}` reads the last active editor; the default keys keep the active source tab.
- Not chosen: the active tab alone, under which a press on the bar always made the Repositories view active and refused every placeholder but `${workspaceFolder}`, the lazy option; the last-published tab, which a tab merely mounting would take.

Where it applies: D17. Booked in the state file's closed log and `plan.md` Rulings.

## Z321 (2026-10-03, D17's landing, the merge with D32): command refusals in the server's words

- Chosen: the refusals of the terminal route's `command`, `rerun`, `restart` and `capture` actions reach the reader as the server's own sentence (the missing selection, the missing file, a cycle, an unknown command), narrowing Z265 as Z287 did.
- Not chosen: Z265 as it stands, which says "The server refused the request (HTTP 400)" for a missing selection; a catalog word per refusal on the page, which repeats the server's catalog.

Where it applies: D17. Booked in the state file's closed log and `plan.md` Rulings.

## Z320 (2026-10-03, D17's placeholders at landing): the placeholder form

- Chosen: each placeholder becomes `${OCULUS_ARG_<n>+"$OCULUS_ARG_<n>"}` in the run line, its value set in the task's environment, in place of Z305's literal `"$OCULUS_ARG_<n>"`, which closes a run line's own double quotes and splits and globs the value there; a line that evaluates text itself (`eval`, `sh -c`, `$((...))` in bash) still evaluates the value.
- Not chosen: the literal `"$OCULUS_ARG_<n>"`, which splits a value written inside double quotes; refusing a placeholder inside double quotes, which brings back the check Z305 removed.

Where it applies: D17. Booked in the state file's closed log and `plan.md` Rulings.

## Z319 (2026-10-03, S4's look): the two defects of the Settings editors

- Chosen: D25 widened, the step that adds its controls to the Settings editors: Save of an emptied key/value family of single values ends its draft once the file holds what was sent, its cause found at /spec; Undo of a `config-value` write gives back the lines the write replaced, the file's alignment included.
- Not chosen: a new step of its own, against the rule that a defect goes into the step that changes its files; fixing them at landing, since the first has no known cause; an open item, the lazy option.

Where it applies: D25. Booked in the state file's closed log and `plan.md` Rulings.

## Z318 (2026-10-03, D14's look): the seven defects of the LaTeX build and view

- Chosen: a new step D14b after D14, queued after D32b and built by a builder: a build's terminal kept readable when latexmk exits at once, with every terminal refusal a word; the folder read once a build has ended and whenever the view opens or a `.tex` file or PDF in it changes; Format Document undoable; "1 problem" in the singular; Open LaTeX on a folder holding a `.tex` file whether or not it was expanded; the picture hover drawn at the image's size.
- Not chosen: fixing them at landing, too large for a landing fix and three with causes not yet found; an open item, or folding them into D15, the lazy option.

Where it applies: D14b. Booked in the state file's closed log and `plan.md` Rulings.

## Z317 (2026-10-03, D14's landing): the LaTeX refusals as words

- Chosen: every refusal of the LaTeX routes is a word (`LATEX_REFUSALS` in `data/prose/latex.ts`) whose whole sentence is a `refused_*` key of `latex.yml`, said by the page through `refusedAnswer` as the ops refusals are; a root without a path is refused `not-an-action`.
- Not chosen: a catalog key for each engine word filled into a sentence (Standards 2's reading), which keeps a sentence built from the server's parts.

Where it applies: D14, and every later LaTeX route. Booked in the state file's closed log and `plan.md` Rulings.

## Z316 (2026-10-03, D32's look): the three defects of the Search view's replace

- Chosen: a new step D32b after D32, queued after Q91 and built by a builder: the hits of a written file read again after a replace; the cap note and the Replace All question's cap sentence only when the cap cut, a root that ran out of time said to have done so; the Replace Preview opened beside the Search view.
- Not chosen: fixing them at landing, too large for a landing fix; an open item, or a later step on another surface, the lazy option.

Where it applies: D32b. Booked in the state file's closed log and `plan.md` Rulings.

## Z313 (2026-10-03, the Q99 and Q79c looks): the Sessions New button into D20, the Memories exception into X3c

Chosen: the New button's press opening the composer is built in D20, which changes the Sessions and Terminal views, its cause found at D20's /spec; the Memories view's exception joins Z310 in X3c, whose paths already hold `Memories.svelte`.

Not chosen:
- /diagnose by the orchestrator now: investigation outside a step.
- A new step: it needs Axel's ruling.

Where it applies: D20 and X3c. Booked in the state file's closed log and `plan.md` Rulings.

## Z312 (2026-10-03, the Q88 look): the Graph's pill menus and the commit time limit into D20

Chosen: built in D20, which changes the Repositories view and runs git there; a pill's right-click opens the name's own menu, and the commit's while a write is in flight; a commit with long hooks completes, and a failed git command says why. The commit Confirm's missing focus and its ground under the right pane join Z310 in X3c.

Not chosen:
- /diagnose by the orchestrator now: investigation outside a step.
- A new step: it needs Axel's ruling.

Where it applies: D20 and X3c. Booked in the state file's closed log and `plan.md` Rulings.

## Z311 (2026-10-03, the Q82 look): two tree keys into X3e

Chosen: built in X3e, which rebuilds the Files trees' keys and drag; Cmd+A selects a tree's rows (VS Code's `list.selectAll`) and Cmd+Enter opens a row to the side (`list.openToSide`).

Not chosen:
- X3c: its paths hold no tree.
- A new step: it needs Axel's ruling.

Where it applies: X3e. Booked in the state file's closed log and `plan.md` Rulings.

## Z310 (2026-10-03, the Q81 look): four focus and overlay defects into X3c

Chosen: built in X3c, which already writes the tab strip, the palette and the key sheet's text; its paths widened to the modal ground, the quiet focus helpers and the Memories view. X3c's /spec finds each cause read-only and writes it into the brief, and a cause not found goes to Axel as an open item.

Not chosen:
- /diagnose by the orchestrator now: the investigation would run in the orchestrating session, outside a step.
- A new step: it needs Axel's ruling.

Where it applies: X3c. Booked in the state file's closed log and `plan.md` Rulings.

## Z309 (2026-10-03, Z280 (c)): the LaTeX formatter's keys

Chosen: four keys in `behavior.yml`'s `latex:` section beside `auto_build`: `formatter`, one of `none`, `latexindent`, `tex-fmt` and `badness`, default `none`; and `latexindent_path`, `tex_fmt_path` and `badness_path`, each empty by default, meaning the program is found on PATH. They mirror LaTeX Workshop's `latex-workshop.formatting.latex` and its three `.path` settings. Built at D14's landing.

Not chosen:
- One key holding a map of paths: no Settings editor of a scalar draws it, and VS Code keeps a key per path.
- A section of its own: it splits the LaTeX settings across two sections.

Where it applies: D14's landing. Booked in the state file's closed log and `plan.md` Rulings.

## Z308 (2026-10-03, D32's run over round 1): its findings fixed at landing

Chosen: every finding fixed at landing on main, as `agents/reviews/D32-refuter.md` "Closed" lists; the "Replaced ..." sentence only after a Replace All with any later change writing the count back, and a toggle during a run cancelling it and running again, both as VS Code does.

Not chosen:
- A second repair round: the cap allows one only for an unbuilt acceptance item whose fix is too large for landing.
- Leaving findings 8 and 9 as partial: both are defects of item 5 and item 2.

Where it applies: D32's landing. Booked in the state file's closed log and `plan.md` Rulings.

## Z307 (2026-10-03, the Q99 look): two terminal defects into D20

Chosen: built in D20, which already carries the terminal look's other defects (Z297) and works in the terminal views; D20's /spec finds each cause read-only and writes it into the brief, and a cause not found goes to Axel as an open item.

Not chosen:
- /diagnose by the orchestrator now: the investigation would run in the orchestrating session, outside a step.
- A new step: it needs Axel's ruling, and D20 already holds the terminal work.

Where it applies: D20. Booked in the state file's closed log and `plan.md` Rulings.

## Z305 and Z280 (2026-10-03, Axel's rulings)

Z305: (a), placeholder values as environment variables, at D17's landing. Z280: (c), VS Code's formatter setting with none, latexindent, tex-fmt and badness, default none, a path per program, at D14's landing, tex-fmt installed. Ruled by Axel; booked in `plan.md` Rulings and the state file's closed log.

## Z306 (2026-10-03, S4's round 2 review, R2-b): list values in key/value families

Chosen: the options catalog decides. `holds: lists`, which Z302 put on a family whose keys hold lists of records, also marks a key/value family whose keys hold lists of values; `sources.yml` `languages` carries it. The write reads the catalog entry, so an emptied `read_limits`, `deck.tag_tones` or `tab_split` refuses a list, and Undo of the write that emptied `languages` still takes lists, since the catalog says so. Fixed at landing on main, since S4's rounds are spent.

Not chosen:
- The empty-table clause as built: a table with no entries takes a list, a wrong configuration accepted.
- Refusing every list in an empty table: Undo of emptying `languages` would be refused.
- A second catalog word for lists of values: `holds: lists` already says each key holds a list.

Where it applies: S4's landing. Booked in the state file's closed log and `plan.md` Rulings.

## Z304 (2026-10-02, D17's round 2 report, D17-B): the marker a chain prints before each command

Chosen: (b), the printed line carries a per-run token with the command's name, and the store advances only on that exact line. A command's own output can hold a line equal to the next command's name (a make target echoing `test`, say); with the bare name, its errors would then resolve from the next command's folder. Fixed at landing on main, since D17's rounds are spent.

Not chosen:
- (a), the bare name as built: the lazy option, a known wrong folder kept.

Where it applies: D17's landing. Booked in the state file's closed log and `plan.md` Rulings.

## Z303 (2026-10-02, D14's round 1 report, D14-glyph): the LaTeX tab's glyph, again

Chosen: (a), `journals` (`[n]`, `newspaper`), a typeset page that no view uses; the tree has it now. Z300 chose `paper` on a wrong premise: `paper` is the Document view's glyph, and `tests/state/workbench/navigation/registry.test.ts` refuses two views sharing one.

Not chosen:
- (b), `paper` for LaTeX and another glyph for Document: it changes a view D14 does not own.
- (c), `paper` for both with an exemption in the registry test: the lazy option, a check loosened.
- (d), `publish`: Source Control's Publish action, replaced by Z300.

Where it applies: D14. Booked in the state file's closed log and `plan.md` Rulings.

## Z302 (2026-10-02, S4's refuter report, B5): an emptied `tab_rollup`

Chosen: (a), a family entry of the options catalog may carry `holds: lists`, meaning each key of the map holds a list of records; `tab_rollup` carries it. The editor draws the rollup form for `tab_rollup: {}`, and the write refuses a key holding a single record under such a family, so a shape the boards' roll-up does not take is never saved.

Not chosen:
- (b), the records form for an empty map: the lazy option; the reviewer's probe saved `{ projects: { label: x, keys: [a], color: red } }`, a shape the roll-up does not take, and no reader refused it.
- Guessing from the family's name or fields: no rule in the catalog says it.

Where it applies: S4, repair round 1. Booked in the state file's closed log and `plan.md` Rulings.

## Z301 (2026-10-02, D17's refuter report): the form's place, preset names, the approvals folder, the approval key and quoted placeholders

Chosen:
- The command form and the approval dialog stay drawn by the shell (a default key asks with no bar mounted; a wall surface under a tinted view is refused), moved from `shell/keys/` to `shell/commands/`.
- Found presets keep three names, `cmake: <n>`, `cmake build: <n>` and `ctest: <n>`, so a configure and a build preset of one name stay apart; HELP.md says so.
- Each approvals write makes the approvals folder 0700 when it is looser; `~/.oculus` is 0755 on this machine.
- A command's approval key includes the repository's real absolute path, as an app's folder is in its hash in DESIGN.md's Approval paragraph, so approving a text in one repository does not approve it in another; within the processes rule's "that exact text on this machine".
- A placeholder inside single or double quotes in a run line is refused at save and at run, since a value inside double quotes can run `$(...)` unapproved.
- A chain is approved as one text, every line with its folder, as DESIGN.md already says.

Not chosen:
- The form in `shell/keys/`: that folder holds keys.
- One `cmake:` name for all presets: a configure and a build preset named `default` collide and one is dropped.
- A folder of its own for the approvals file: it moves a path `local.yml` names by default.
- The key without the repository, as built: one approval covers every repository holding the same text.
- Leaving quoted placeholders: the lazy option; a selection can run code no one approved.

Where it applies: D17, repair round 1. Booked in the state file's closed log and `plan.md` Rulings.

## Z300 (2026-10-02, D14's refuter report, Spec 2 and Spec 3): where the LaTeX reader lives, and the LaTeX tab's glyph

Chosen: the reader at `data/prose/latex.ts`, beside `markdown.ts`, whose head comment says it is one rule imported by both sides, the same concern; the LaTeX tab draws the existing `paper` glyph (`[d]`, `file-text`), a page of text.

Not chosen:
- `data/helpers/files/latex.ts`, as built: that folder holds helpers about file names, paths and kinds.
- `publish` (`cloud-upload`), as built: it is Source Control's Publish action and reads as "upload".
- A new glyph key: it adds a vocabulary entry where `paper` already reads as a document.

Where it applies: D14, repair round 1. Booked in the state file's closed log and `plan.md` Rulings.

## Z299 (2026-10-02, D14's refuter report, Behaviour 4): the Outline of a file the LaTeX parser refuses

Chosen: on a refusal by `latex-utensils`, the shared reader reads the sectioning commands with a line scan that skips `%` comments and returns them with `refused: true`; the Files Outline and the LaTeX view draw them, and the LaTeX view keeps its line that the file was not parsed. One reader module stays, as Z279 wanted.

Not chosen:
- Z279 as built, a refused file listed as skipped: the Outline of three real hub files went from 20, 18 and 21 headings to 0, and any file mid-edit with an unclosed brace or a lone `$` shows an empty Outline.
- A tolerant parser library in place of `latex-utensils`: it reverses the library Axel named in LA18.
- Keeping the last good outline while a file is unreadable: it leaves a file never parsed (the three real files) empty.

Where it applies: D14, repair round 1. Booked in the state file's closed log and `plan.md` Rulings.

## Z298 (2026-10-02, D17's report, D17-A): the errors of a task terminal no pane shows

Chosen: (a), one capture when the task terminal ends: the commands store asks the server for the terminal's captured output (tmux `capture-pane`, a new `capture` action of the terminal route) and reads its diagnostics from it. VS Code's problem matchers read a task's output whether or not its terminal is on screen, so the errors reach the Problems view (D33) for every task. Sent to D17's builder in its repair round.

Not chosen:
- (b), a page subscription per running task terminal: one tmux control client per task and a grid size for a grid that does not exist.
- Leaving it: the lazy option; D33's Problems view would show nothing for a task not on screen.

Where it applies: D17. Booked in the state file's closed log and `plan.md` Rulings.

## Z297 (2026-10-02, the terminal look): two terminal defects

Chosen: built in D20, which starts agents in Terminal tabs from a task or a worktree and so works in the terminal views and their start: an armed Kill draws armed, and a Terminal tab whose shell is starting draws the terminal starting, never the composer. `TerminalList.svelte` and `terminals.svelte.ts` join D20's paths at its /spec.

Not chosen:
- A new step: it needs Axel's ruling.
- Leaving them: both are defects of delivered work.

Where it applies: D20. Booked in the state file's closed log and `plan.md` Rulings.

## Z296 (2026-10-02, the U4 look): a long word crossing its box in a narrow Focus pane

Chosen: built in Q91, which already works in the Focus view (its follow-up rows): a Focus lane card's note (`Band.svelte`) and the career panel's summary (`CareerPanel.svelte`) wrap a long word inside their box, so nothing crosses a border and the view never scrolls sideways. Both files join Q91's paths at its /spec.

Not chosen:
- A new step: it needs Axel's ruling, for two style rules.
- Leaving it: text drawn across a card's border is a defect of delivered work.

Where it applies: Q91. Booked in the state file's closed log and `plan.md` Rulings.

## Z295 (2026-10-02, the A1 light look): the branch item gone over a diff tab

Chosen: built in X3c, the tab strip step, which reads the file of the tab on screen for its breadcrumbs and tooltip: `repoStatus` also takes a tab whose state names its repository by folder, as a diff tab does, so the status bar keeps its branch and sync items, as VS Code's does for a diff editor. `src/lib/state/workbench/navigation/status.ts` joins X3c's paths at its /spec.

Not chosen:
- A new step: it needs Axel's ruling, and the fix is a few lines in the function X3c's tab reads sit beside.
- Leaving it: the branch item vanishing under a diff is a defect of delivered work.

Where it applies: X3c. Booked in the state file's closed log and `plan.md` Rulings.

## Z294 (2026-10-02, the Q78 look): an active tab out of sight

Chosen: built in X3c, the tab strip step: the strip scrolls the active tab into view whenever a tab becomes active, as VS Code's does.

Not chosen:
- A new step: it needs Axel's ruling and would change the strip X3c changes.

Where it applies: X3c. Booked in the state file's closed log and `plan.md` Rulings.

## Z293 (2026-10-02, the U3 look): its two defects

Chosen: U3-look-1 (a tab's title shrinking to one letter at 150% text in a narrow pane) in X3c, the tab strip step; U3-look-2 (the Text size row showing no current size) in D25, which adds Settings controls, with `BrowserControl.svelte` added to its paths.

Not chosen:
- New steps: they need Axel's ruling and would change the files X3c and D25 change.

Where it applies: X3c and D25. Booked in the state file's closed log and `plan.md` Rulings.

## Z292 (2026-10-02, the R18 look): the palette's row overlap

Chosen: built in X3c, which already changes the palette's commands; `src/lib/shell/keys/Palette.svelte` joins its paths at its brief closure, and a long row keeps to one line cut with an ellipsis, as VS Code's quick pick.

Not chosen:
- A new step: it needs Axel's ruling and would change the file X3c changes.

Where it applies: X3c. Booked in the state file's closed log and `plan.md` Rulings.

## Z291b (2026-10-02, after Axel lowered `workers_at_once` to three): the steps in flight beyond three

Chosen: none is stopped. D14, D17 and S4 finish their builds; D18 and D32, whose builders are done, land; that leaves three in flight, and no builder is dispatched while three or more steps are in flight.

Not chosen:
- Stopping a running builder: it throws away about 2.5 h of work that a continuation builder would redo, and the load it saves lasts only until that continuation runs.

Where it applies: the next /spec dispatches. Booked in the state file's closed log and `plan.md` Rulings.

## Z289 (2026-10-02, the owed looks): the looks' defects folded into the queued steps

Chosen: every defect of `agents/reviews/owed-looks.md` is built in a queued step whose files it touches, each named in that step's brief or, for a step not yet prepared, on its plan line for its /spec:
- X3c (the tab strip): M3-4 (a Markdown preview table's first column squeezed to letters), D13a-4 (the Markdown preview on by default and over half a narrow pane), Q88c-15 (Editor Actions Position's "Title Bar", no check mark, a float's More under Hidden), Q88c-16 (New Text File opens a note form), Q88c-17 (closing a tab activates its left neighbour), L4-1 (Float and Return to Page lose the terminal's scroll position), L4-2 (a Terminal tab titled by an internal id).
- Q91 (the project view and its manifest editor): M3-1 (no glyph on machine and storage resource tags), M3-2 (the chips field's keyboard-active choice drawn as chosen), M3-3 (the card's More menu in mixed casing), Q88c-18 (the manifest editor says "saving" during a git write).
- X3e (the Files view's lists, with Z269's repository scan): X3a-1 to X3a-7, Q88c-1 to Q88c-14 and Q88c-19 to Q88c-22, D27-3, D13a-5, A1-4, and the hub's Graph reading for about 10 s at a count of 0.
- D25 (the editor's options): D13a-1, D13a-2, D27-1, D27-2, D27-4, D27-5, A1-1, A1-2, A1-3.
- D28 (saving a source file): D13a-3 (a small file waits 4 to 6 s for its first snapshot).
- D15 (PDF reading and the document frame): M4-1 (formulas near-white on the equation card), M4-2 (an equation card cut in a narrow pane), M4-3 (Restore panes reloads the document frame).
- D20 (an agent from a task or a worktree, the sessions step): Q66-1 (a transcript above Node's string limit reads as no turns and is read whole again on every activity).

Not chosen:
- New steps for them, which need Axel's ruling and would change the same files as the steps named.
- Leaving them in the owed-looks record only, the lazy option.

Where it applies: the briefs of X3c, Q91 and X3e, and the plan lines of D25, D28, D15 and D20.

## Z288 (2026-10-02, Axel's look): five defects folded into X3c

Chosen: the five defects of Axel's look on 2026-10-02 are built in X3c: (1) a file tab draws a path breadcrumb (root, folders, file) in place of its file-name header row, at VS Code's measured size; (2) the tab's own buttons (Save, Revert, the star, Open in Program, Preview, Blame) move to the right end of the tab strip and the second row goes; (3) the breadcrumb's size is VS Code's, measured from its stylesheet; (4) a long palette result stays on one line with an ellipsis; (5) a click on a rail button never writes a rail reorder, its cause found read-only while X3c's brief is closed (the orchestrator, automode).

Not chosen:
- A new step, which needs Axel's ruling and would change the same strip, header and palette files as X3c.

Where it applies: `agents/briefs/X3c.md`.

## Z287 (2026-10-02, D32's review): the pattern refusal's reason

Chosen: a pattern ripgrep cannot read is refused with the catalog sentence and ripgrep's own reason in it, as VS Code's Search view shows ripgrep's regex parse error (the orchestrator, automode).

Not chosen:
- The catalog sentence alone, as Z265 reads. It hides which part of the regular expression is wrong.

Where it applies: `agents/briefs/D32-round1.md` ruling 4.

## Z286 (2026-10-02, Q91's brief check): the card's tree, revising Z283

Chosen: the explorer tree moves under `views/shared/explorer/`, and the Files view and every card (the board's open card and the project tab's) draw it; each card's tree has its own state record `<tab id>#files:<project id>`, cleared when the tab closes and followed on a rename; the card's finder box stays above the tree and lists flat matches while text is typed; the tree's row menu gains Open in Program; a `followup:` list of one note is written as that note, and emptying the note's text removes the note (the orchestrator, automode).

Not chosen:
- An allow row in the boundaries test so the card imports from `views/sources/`. Cheaper, and it widens the layer rule instead of meeting it: the lazy option.
- The tree replacing the finder. The tree's filter reads only listed folders, so project-wide search, opening in a program, sizes and recency would be lost.
- The tree in the project view only (Z283 as first booked). The board card would keep a second, different file list for the same project.

Where it applies: `agents/briefs/Q91.md` items 1 and 4, decisions 1-4.

## Z285 (2026-10-02, D32's report): the Replace Preview request

- Chosen: the preview read is a POST carrying the hits in its body, the same shape as the replace, so no address length limits it.
- Not chosen: (a) leaving the HTTP 431 past about 1400 hits in one file with its failure sentence; (c) refusing such a replace, the lazy option.

Where it applies: D32, its repair round. Booked in the state file's closed log and `plan.md` Rulings.

## Z284 (2026-10-02, X3e's /spec): where each reordered list is written, and the scan depth key

- Chosen: roots reorder within their group (default workspace: `sources.yml` through the `roots` write's `order` action; named workspace: `workspaces.json` through `POST /api/fs` `order-roots`); the hub and config folder fixed; the notes' order in `~/.oculus/notes/order.json`, a new note on top; the sections' order in the Files tab's instance state; Alt+Up and Alt+Down move a focused row; `repository_scan_depth` in `config/sources.yml`, default 1, range 0 to 3.
- Not chosen: notes left newest first with no stored order, the lazy option; moving the fixed roots, which no file holds.

Where it applies: X3e. Booked in the state file's closed log and `plan.md` Rulings.

## Z283 (2026-10-02, Q91's /spec): the project's file list as the Files view's tree

- Chosen: the project view draws the Files view's tree rooted at the project's folder, through one component moved out of `Files.svelte` and drawn by both; the card in the project view drops its flat list, the board's open card keeps it; several follow-up notes are read-only in the editor.
- Not chosen: restyling the card's flat list to look like the tree, the lazy option; the tree in every board card, which has no height to live in.

Where it applies: Q91. Booked in the state file's closed log and `plan.md` Rulings.

## Z282 (2026-10-02, S4's brief check): Processes in the merged System page

- Chosen: `processes` registers last in the merged group (order 9, after Gallery, lower right pane) with no chord; the second of D18 and S4 to land makes the merge; the group keeps the `settings` glyph and the rail button `sliders`.
- Not chosen: taking a chord from another view for Processes, which moves a chord a reader already uses; leaving the placement to whoever lands, the lazy option.

Where it applies: S4, D18. Booked in the state file's closed log and `plan.md` Rulings.

## Z281 (2026-10-02, D17's brief check): default build and test, clickable errors

- Chosen: `default: build` / `default: test` on a command; Cmd+Shift+B and Cmd+Alt+T run them for the repository of the active source tab's file; one error pattern `path:line[:column]` then `error` or `warning`, clickable in the task terminal and published for D33 in D14's diagnostics shape.
- Not chosen: the three widened parts left out of D17, the lazy option.

Where it applies: D17. Booked in the state file's closed log and `plan.md` Rulings.

## Z418 (2026-10-04, Axel's report of X3c): a new step for the file tab's actions and opening

- Chosen: a new step X3f, first in the queue after T1a's landing, for the double click, the file actions on every file tab and Open Preview; its /spec reproduces each on TEST and finds the causes.
- Not chosen: folding them into X3e, eleventh in the queue, which leaves them broken for ten landings; a note in X3c's landing report and no step, the lazy option.

Where it applies: X3f. Booked in `plan.md` Rulings and the queue.
