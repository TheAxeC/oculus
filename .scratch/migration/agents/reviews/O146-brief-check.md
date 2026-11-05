# Step O146 brief check (on main at 678bf5527)

`git log -1 --format=%h` printed `678bf5527`. The brief (`.scratch/migration/agents/briefs/O146.md`, 160 lines) is untracked; `LC_ALL=C grep -n '[^ -~]'` over it printed nothing. The plan has no section headed Goal; I read lines 1-4 (down to `## Steps`), the step line at `plan.md:1682` and the rulings at `:3556` (681) and `:3558` (683).

The six findings with the most weight are F1, F2, F7, F10, F11 and F12. Each of them names a path the builder must write that the write list leaves out, or a case the tree contradicts.

## 1. Names

- `FRAME_WIDTH`, `FRAME_HEIGHT`: `grep -rn "FRAME_WIDTH\|FRAME_HEIGHT" src tests docs config utils README.md --exclude=local.yml` finds only `present.ts:177,178,186` and `Stage.svelte:14,34,35,43,44`. Both files are in the paths. No hits elsewhere.
- `fit` (from `present.ts`): `grep -rn "from '\$lib/state/life/present'" src` and `grep -rn "fit(" src` show `Stage.svelte:14,28` as its only importer. The other `fit` hits are different functions that stay true: `ui/frame/toolbar/fit.ts:21`, `ui/controls/editor/bars/zones.ts:58`, `server/machine/apps/host/output.ts:40` and a local arrow at `state/boards/structure/forces.ts:629`. No test imports `state/life/present`.
- `AUDIENCE_FEATURES`: found only at `present.svelte.ts:102,371`, which is in the paths. The size of the audience window is also set somewhere else, see F1.
- `printPdf`, `oculus:print-pdf`, `PrintAnswer`: `grep -rn "printPdf\|print-pdf\|PrintAnswer" src tests docs config utils README.md --exclude=local.yml` gives these hits outside the paths:
  - `src/desktop/windows/bridge.ts:37,43,46,224` (`PRINT_REFUSED`, `export type Printer = (address: string) => ...`, and `ipcMain.handle(PRINT_PDF, (event, address: unknown) ...)`). The change makes these false, see F2.
  - `src/desktop/decide/channels.ts:38` (the channel name) stays true.
  - `src/desktop/decide/sender.ts:54` `printTarget` and `tests/server/desktop/window-guard.test.ts:100` stay true.
- `defaults.frame`, `deck.frame`: `git grep -n "defaults\.frame\|deck\.frame"` finds them only in the plan and the state file. `git grep -n "\bframe\b" -- config` shows no colliding key (`behavior.yml` apps comments, `catalogs/latex.yml:136` `name: 'frame'`).
- `DeckContext` and `tagTones` (the route the frame takes into the reader): `grep -rln "createReader\|tagTones" tests` finds `tests/checks/config/integrity.test.ts:102-109` and `:329-335`, and `tests/data/sources/present.test.ts:166-175`. See F4.
- Comments about the frame: see F5 and F6.

Findings:

- F1. The desktop app's audience window ignores `AUDIENCE_FEATURES`. `src/desktop/windows/show.ts:90` places it with `audiencePlace` (`src/desktop/decide/place.ts:103-122`), and with one display that opens it at `AUDIENCE_SIZE = { w: 960, h: 540 }` (`place.ts:72`, a 16:9 size). Neither file is in the paths, and the brief's grep for `1280\|\b720\b\|16 / 9` does not find it. With item 3 built as written, a 4:3 deck still gets a 16:9 audience window beside the presenter in the app. So C2's "the audience window opens 1024 by 768" is false there, and the step line's "the audience window ... draw at the deck's frame" is only half built. Also, the host learns only the address (`decide/links.ts:20`, `{ kind: 'audience'; root; path }`), so the brief has to say how the host gets the frame.
- F2. `src/desktop/windows/bridge.ts` holds the IPC handler and the `Printer` type. A frame passed with the address has to go through `:46` and `:224`, and so does the whole-number check of item 3. The file is not in "Paths this step writes", and it is not in "What is on the tree" (`:14`) or the Read list (item 6).
- F4. If `frame` becomes a required field of `DeckContext`, three `createReader` literals fail the type check: `integrity.test.ts:102-109` and `:329-335`, and `present.test.ts:166-175`. The tests are type checked through `tsconfig.json`, which extends `.svelte-kit/tsconfig.json`. `integrity.test.ts` is not in the paths. `present.test.ts` is allowed "only as the Cases section allows", which permits table rows only, not a context literal.
- F5. `Presenter.svelte:185` says "The next slide is a 16 by 9 room". `grep -rn "aspect-ratio\|16 by 9" src` finds it. It is not in item 6's list of comments to make true (item 6 lists only those that name 1280 by 720). The file is in the paths.
- F6 (low). `Slide.svelte:5` says `--slide-reading` is "the frame's width less its padding, set by Present.svelte". It is a fixed `1040px` at `slide.css:11`, and the paths include `slide.css` lines 1-4 only. The comment is already inexact (1280 - 128 = 1152, and the value is set in slide.css). With a variable frame it reads as frame-derived when it is not. This is outside the paths, and the brief says nothing about it.

## 2. The step line

Each part of the line at `plan.md:1682`, with the item that serves it:

- The setting in `defaults/present.yml` with its options entry, 1280 by 720: item 1.
- `deck.frame` overriding it: item 2.
- `FRAME_WIDTH` and `FRAME_HEIGHT` replaced: item 3.
- The Stage, Overview tiles, presenter screen, audience window and PDF export at the deck's frame: item 3.
- The measure and the "Slide too tall" finding in Findings and on the tile: item 4.
- The untitled finding: item 5.
- The schema gains `frame`: item 2.

The show route (item 3) and the docs (item 6) go beyond the line, and both are justified by the goal and by `spec.md:72`.

Findings:

- F1 (again). The "audience window" part is served only for a browser. No requirement covers the desktop app's audience window.

## 3. Premises

Matching: every line count in the "Sizes" bullet, checked with `wc -l`. Present.svelte 520, data/index.ts 861, read.ts 625, kinds.ts 352, present.ts 582, present.svelte.ts 454, Presenter 235, Tile 163, Stage 97, Findings 294, rail-badges 410, status.ts 667, print page 142, show page 289, export.ts 104, app.ts 393, print.ts 79. The folder counts match too (`git ls-files` per folder): `state/life` 10, `views/academic/present` 10, `screen` 3.

The following also match the brief:
- `present.svelte.ts:102`, `:367-371`.
- `print/+page.svelte:116-123`.
- `print.ts:31`, `:72`.
- `Presenter.svelte:187` and `Tile.svelte:154`.
- The six comments.
- `preload.cjs:33`, `app.ts:151`, `desktop.ts:87`, `export.ts:90`.
- `defaults/present.yml` and `options/present.yml` as described.
- `data/index.ts:164-171`, `:245`, `:343`, and `server/content/deck/read.ts:96`.
- `deck-schema.yml` (`deck` holds `title` only).
- `FIELD_TYPES` at `record.ts:91-102`.
- `createReader` at `:90`, `raiseFor` at `:102-110`, the deck at `:590-604`.
- `spec.ts` 223 lines.
- The `Deck` type at `:255-276`, `deckShape` at `:459-472`.
- `titled` at `:223-226`.
- `kinds.ts:336`.
- `Findings.svelte:86-92`, `rail-badges.svelte.ts:219-224`, `status.ts:465-481`.
- `test -d docs/adr || echo "no docs/adr"` printed `no docs/adr`.

Findings:

- F8 (low). `fit` is at `present.ts:184-187`, not `:185-188`: `grep -n` shows `184:export function fit(` and `186: return Math.min(...)`. The brief's own grep `grep -rn "FRAME_WIDTH\|FRAME_HEIGHT\|fit(" src` prints about 20 lines, most of them other `fit` functions. `grep -rn "<Stage" src` also prints `audit/setting.ts:146` (`part<StageFolders>`) and `deposit-tree.ts:29` (`Promise<Staged>`). The brief's sentence about each grep is true, but each grep prints more than the brief lists.
- F9 (low). The `findings.deck` group of `config/text/findings.yml` runs from line 108 (`deck:`) to 135 (`folder_missing`). Line 136 is `config:`. The brief gives `:120-136` both in the premise and in the write list. A string appended at the group's end still falls inside 120-136, but the range is not the group.
- F10 (high). The premise "a hand-written value outside its rule is a finding naming the file and the key while the reader uses the defaults file's value" does not hold for a new key by itself. That finding comes only from `settingFindings` (`src/lib/data/sources/config/catalogs.ts:326-342`), which words the problems of `settingProblems` (`src/lib/data/sources/config/settings/problems.ts:73-83`). That function runs only the readers listed in `PROBLEM_READERS` (`problems.ts:36-66`), and each of them reads through `settings/reader.ts`, which takes the catalog entry's `default`. A frame reader in `data/index.ts` "beside `tagTones`" (item 1) gives no finding for `defaults.frame.width: 10`. So C4's second half cannot pass within the paths.
  - What it takes: a setting reader in an existing file of `src/lib/data/sources/config/settings/` (the folder is at 10 items, `ls ... | wc -l` printed 10; `files.ts` is 298 lines), registered in `problems.ts`.
  - The test rule: G13 lists "`settings.ts`: `tests/data/sources/config/settings.test.ts`, one case per setting reader", and the table 'answers the default for a wrong %s and names the key' is at `settings.test.ts:519`. So G13 calls for a row there.
  - None of these paths is in the write list, and "C3 and C4 are runs" contradicts G13's one case per setting reader.
  - Reading the key twice (in `data/index.ts` and by the catalog rule) is the duplication `spec.md:89` forbids.
- F11 (high). "A slide with no `source` (a summary or a grid)" (item 4) and C7 contradict the tree. A summary and a grid carry a `source`: `read.ts:382-388` builds `{ root, path: <deck>/present.yml, index, entry, line }`, and `:405` and `:428` attach it. `model-deck.ts:105-112` documents this: "For a summary or a grid the file is the deck's `present.yml` ... `line` is ... the entry's line in `present.yml`". A file slide without a source never reaches a deck either: `fileOf` returns null on an `outside` or missing path (`read.ts:249-258`), so `fileSlides` yields no slide. As written, item 4 and C7 exempt from the Findings view a too-tall summary or grid that has a file and a line. The goal ("a slide taller than its frame is a ... finding") covers them.
- F12 (medium). The brief does not say how the reader raises a slide-level finding today. `fileSlides` binds `raise = raiseFor(doc.file)` (`read.ts:305`), which is the deck's `present.yml`, and passes it to `buildSlide` as `kind.raise` (`:337`). The `Raise` type is `(key, id, ...args)` with no line (`spec.ts:12`), and `raiseFor` builds `{ file, key, message }` only (`read.ts:104`). Item 5 requires "its file and line are those of the slide", so the builder has to add a raise on the slide's file that carries a line. The brief should state this premise.
- F13 (low). "22 project decks" counts `projects/*/*/present`: `ls -d projects/*/*/present | wc -l` printed 22. The portfolio deck's group `more` also finds `projects/archive/published/*/*/present` (`deck/present.yml`), and `ls -d` shows two such decks: `projects/archive/published/2026/dongho-ecg-clustering/present` and `.../hccnet-fl/present`. Both are `kind=project title=1` (my grep loop over every slide file). C9's result holds, but the count does not.
- F14 (low). Decision 7 quotes the heading of `deck/title.md` as "Structured models, everywhere they hide". The file holds `# Structured models,<br>everywhere they hide` (`grep -n "^# " deck/title.md`).
- F7 (high; size and path). The store of measured slides has to be read by `Findings.svelte` (`views/system/findings`) and by `createRailBadges` (`state/workbench/rail-badges`). Three rules decide where it can live:
  - The layer rows forbid a view importing another view's folder, and `state/` importing `views/` (`tests/checks/tree/boundaries.test.ts:28-36`, `spec.md:56`).
  - Module-level `$state` is forbidden (`boundaries.test.ts`, the global-state check; `spec.md:88`).
  - So the store must sit under `state/` and be built per client in `src/lib/state/client/context.ts`, which builds `railBadges` at `:640-650` from the stores it is handed.

  `context.ts` is not in the paths and is 877 lines (`wc -l`), 3 under the module limit. The candidate folders are full: `state/client` 10, `state/workbench` 10, `state` 10 (`git ls-files` counts). The brief's "a folder under the folder limit" does not say any of this. Also unstated: `model/index.ts` (in the paths) is 835 lines, and `src/lib/data/sources/deck` is at 10 items.

## 4. Cases and checks

- `tests/data/sources/present.test.ts` holds no table: `grep -n "it(\|it.each\|describe(" ` shows only `it(` at 37, 180, 227 and 246. So C2 and C8 are runs under the brief's own condition, which is consistent.

Findings:

- F1 (C2). "the audience window opens 1024 by 768" is false in the desktop app (`place.ts:72`).
- F10 (C4). The finding cannot arise within the paths, and G13 calls for a table row, so "C4 is a run" is wrong.
- F11 (C7). It contradicts the tree.
- F16 (C8). "A `kind: project` slide in a project's deck with no `title:`: no finding" misses a project with no short name. The title is `slide.title !== undefined ? plain(slide.title) : (project?.short ?? title)` (`kinds.ts:336`), and `short` is `str(manifest.short) ?? ''` (`data/index.ts:310`, `server/content/deck/read.ts:47`). So the title is `''` while the brief's rule raises nothing. Item 5's rule ("no `title:` ... and no project") lets through a slide with an empty title.
- F17 (C9). "a run of the reader over the hub": `spec.md:38` allows only four things to read the real hub. The case should name `tests/data/real-hub.probe.ts` (which prints `snapshot findings`, `:106`) or `tests/checks/config/integrity.test.ts`. The integrity test builds the hub's deck (`readDeck`, `:100-109`) and is in verify item 2.
- F3 (C10). The case is "Checked by reading `desktop/app.ts`", but the bridge's argument check is in `bridge.ts:224-230`. `app.ts:151` only passes a closure. The brief also has the bridge answer `failed`, while the bridge's existing answer for a request it will not take is `refused` (`PRINT_REFUSED`, `bridge.ts:43`; `desktop.ts:36-41` gives `refused` as "the address is not the print route"). Using `failed` mixes the two meanings of `PrintAnswer`.
- F19. The step changes G47's code (G47's Code line is `src/desktop/`, and its test 'prints only the print route of its own server...' is at `window-guard.test.ts:100`). `spec.md:60` says the step runs that entry's test, but verify item 2 does not name `tests/server/desktop/window-guard.test.ts`.
- F18. The verify list and the report shape omit items the rules file asks the brief to name:
  - the base copy and the `diff -rq` file table (`spec.md:33,35`);
  - the base's `sh utils/unused-exports.sh` lines to compare with (`spec.md:89`; O145's brief named `.agents/worktrees/O145-base/unused-exports.txt` at `briefs/O145.md:165`);
  - the history-word grep (`spec.md:44`);
  - the ASCII gate (`spec.md:78,103`);
  - the rename grep quoted (`spec.md:72`);
  - the table of edits to assertions (`spec.md:62`);
  - the count of list runs (`spec.md:26`);
  - the ids and the asynchronous paths (`spec.md:73`).

  `grep -n -i "worktree\|base copy\|unused-exports" briefs/O146.md` finds only line 139.
- No case asks the builder to check, quote or explain a place the step does not change. C10's reading of `app.ts` is a place inside the paths, but the check is not there (F3).

## 5. The question

For each case or check: could it pass without the goal being reached?

- C1: No. A reader run shows the deck's `frame`, and the look draws it.
- C2: Yes (F1). Reading the components passes while the app's audience window stays 960 by 540.
- C3: No for the reader. The print route of such a deck is not covered (I10 below).
- C4: Yes (F10). A run of the config reader that shows 1280 by 720 for `width: 10` passes with no finding.
- C5: Partly. The look on a scratch deck shows the finding, but it would not catch the hidden-tab case (I6) or a summary or grid (F11).
- C6, C7, C11: by reading. C7 asks for the wrong result (F11).
- C8: Yes (F16). It passes while a project slide with an empty title gives no finding.
- C9: No.
- C10: Yes (F3). Reading `app.ts` can pass while the bridge passes no frame.
- C12: Yes (I4). Reading the key passes while the same slide drawn in two different decks gives two findings.
- F20. Verify item 3 (`grep -rn "FRAME_WIDTH\|FRAME_HEIGHT\|1280\|\b720\b\|16 / 9" src ...`) can print only `place.ts:18` while frame-sized literals remain:
  - `\b720\b` does not match `720px` (the grep run on main does not print `print/+page.svelte:117`'s `720px` or `:123`'s `height: 720px`);
  - it does not match `16/9`, `4 / 3` or `place.ts:72`'s `w: 960, h: 540`.

  Its words "the default's single source, wherever the step puts it" also allow a hardcoded default in `src`, which `spec.md:55` forbids (see F24).
- Verify item 4 (sizes): No, but `context.ts` (877) is not in its scope (F7).
- Verify item 2: passes only if `integrity.test.ts` type-checks, which needs F4.
- Item 6's dictated HELP sentence: Yes (F23).
- The step line's check (the plan's verify list, unchanged): the same answer as the cases above.

## 6. Implied inputs

Inputs the step implies but the brief never states. Each line says whether "Cases" lists it and gives the expected result.

- I1. Frame values reaching a `<style>` element (the print route's `@page`), the `window.open` features string, and the IPC call. Not listed. Expected: `deckShape` (`present.ts:459-472`) holds `frame` to two whole numbers in range, so a deck answer whose frame is anything else is refused as a malformed answer and no text reaches the style or the features string.
- I2. A deck read while a draft of its `present.yml` that changes `deck.frame` is open. Not listed. The pane reads over drafts (`acts/live.svelte.ts`), but the show and print routes read the saved file (`readDeck`, `present.svelte.ts:171-176`, no drafts). Expected: the audience window and the print window are sized from the frame the route draws, the saved one, or the brief rules which frame wins.
- I3. A member deck with its own `deck.frame`, valid or invalid. Item 2 covers the valid case; Cases do not. Expected: it is drawn at the holding deck's frame. Whether an invalid member frame is still a finding has to be stated, since the reader parses every member's `present.yml`. The same project deck opened alone draws at its own frame.
- I4. One slide drawn in two different decks: the portfolio deck as a member, and its own project deck in another pane, possibly at two frames. Not listed (C12 covers the same deck only). Expected under the brief's key (deck plus slide key): two findings for one file line. The brief should rule whether that is one finding or two.
- I5. A too-tall summary or grid. Listed as C7 with the wrong result. Expected under the goal: a finding at `present.yml`, at the line of its `order:` entry (`read.ts:387`).
- I6. A measure in a hidden tab (an ancestor with `display: none`). Not listed. There, `scrollHeight` and `clientHeight` are both 0, which reads as "fits" and drops the finding. Expected: no measure while the frame has no height, so the store is unchanged.
- I7. A Stage in the show route, a page with no workbench client. Not listed. Expected: no measure and no error.
- I8. A Stage that goes away (pane closed, deck switched, Overview left). Not listed. Expected: stated by the brief. Decision 5 suggests the finding is kept until reload, until a measure finds it fitting, or until a re-read drops the slide.
- I9. A frame that changes while the slide is drawn (a draft or saved edit of `deck.frame` or `defaults.frame`). Not listed. Expected: measured again at the new frame.
- I10. The print route of a deck with an invalid frame. Not listed (C3 covers drawing only). Expected: printed at the setting's frame, and the bridge given that same frame.
- I11. A `project` slide with no `title:` whose project has `short: ''`. Not listed (F16). Expected: an untitled finding.
- I12. `deck.frame: null`, a frame with an extra key, `{ width: '1024', height: 768 }`, `{ width: -1024, ... }`. Not listed (C3 has four other shapes). Expected: each a finding on `deck.frame`, and the setting's frame used. The brief should say whether an extra key is wrong.
- I13. A deck of a hub other than the primary. Not listed. Expected: the frame from that hub's config (`server/content/deck/read.ts:86-87` takes `owner?.config`).
- I14. A too-tall slide whose `source.root` is not among the served roots the page has, or roots not yet loaded. Not listed. Expected: stated, either no finding until the root is known or the path form used.
- I15. An untitled slide in a deck that is neither the portfolio deck nor a project deck (one opened from Files). Not listed. Expected: the reader raises it into `deck.findings`, but the Findings view does not list it, since only the snapshot's decks reach it (`data/index.ts:337-353`). This bears on F23.
- I16. A desktop print request with no frame, or a side of 3841. Not listed (C10 has `0` and `'1280'`). Expected: refused, and no window opened.
- I17. The desktop audience window for a 4:3 deck with one display. Not listed (F1). Expected: a 4:3 window.

## 7. ADRs

`test -d docs/adr || echo "no docs/adr"` printed `no docs/adr`, and `git ls-files | grep -i adr` printed nothing. There are no records, so none touches the step.

## 8. Dictated text

- `grep -n "frame: { width: 1280, height: 720 }"` finds line 30. The value `frame: { width: 1280, height: 720 }` holds. So do `heading` `presentation` (one of the headings the head of `options/appearance.yml` lists), section `Slides`, and `min`/`max` 320 to 3840 and 240 to 2160 with `whole: true`. The comment and the help are described, not dictated.
- `grep -n "type \`raw\`"` finds line 31. `field: frame`, `type: raw` under `deck` holds; `raw` is in `FIELD_TYPES`. The help is described, not dictated.
- `grep -n "gains one sentence: a slide is laid out in its deck's frame"` finds line 35. F23: the sentence breaks `spec.md:72` ("a sentence in a document ... that the change makes false is a defect"). "a slide taller than its frame or with no title is listed under Findings" is not true for an untitled slide of a deck outside the snapshot (I15). A too-tall slide is listed only once it is drawn in this page, and not after a reload (decision 5). The sentence is ASCII, with no dash and no "not X but Y".
- F24. The ranges of decision 2 are used by the setting, the deck reader and the desktop check. The brief does not say where the reader and the desktop app read them from. `spec.md:55` (the default lives in the config file) and `:89` (a rule exists once) point to the options entry's `min` and `max` as the one source.

## Declined to judge

- I did not run the deck reader over the hub (C9). I checked it by grep of every slide file's `kind:`, `title:` and level-1 heading lines, and of the idea projects' `tier:` and `short:`. A run of `tests/data/real-hub.probe.ts` would settle it.
- Whether `deck.frame`, rather than `defaults.frame` in a deck's `present.yml` (the path a deck's `tag_tones` override takes), is the better key: ruling 683 names `deck.frame`, so it is not mine to judge.
- Whether passing the frame over the bridge is needed at all, given that the print window prints with `preferCSSPageSize: true` (`print.ts:72`) from a page of fixed px size: this is a design judgment for the orchestrator. I did not measure Electron's behaviour.

Agent usage: ab81b2ba12033c208, claude-opus-5-5, 236854 tokens, 102 tool uses, 13 min 29 s.

## Closed

Each finding was checked against the tree at 678bf5527 by the orchestrator and closed by a change to the brief.

- F1: confirmed (`place.ts:72` `AUDIENCE_SIZE = { w: 960, h: 540 }`, `show.ts:90` `audiencePlace`, `windows.ts:233` the open handler). Item 3 gains the desktop audience window: the frame reaches the host in the `window.open` features, the address staying a root and a path (G47); with one display `audiencePlace` opens it 960 px wide at the frame's aspect. Decision 9; C2 rewritten (the app's window 960 by 720 for 4:3); `windows.ts`, `show.ts` and `place.ts` added to the paths and the Read list (7).
- F2: confirmed (`bridge.ts:37,43,46,224`). `bridge.ts` named in "What is on the tree", item 3, the paths and the Read list (6).
- F3: C10 now reads `bridge.ts`'s handler and expects `refused`, as the bridge answers an address it will not take; item 3 says the same.
- F4: item 2 names the three `createReader` context literals, and the paths hold those line ranges.
- F5, F6: item 3 makes `--slide-reading` the frame's width less its padding, and item 6 names `Presenter.svelte:185` and `Slide.svelte:5`; `slide.css` whole and `Slide.svelte`'s head comment in the paths.
- F7: confirmed (`context.ts` 877 lines; `state/client`, `state/workbench`, `state` at 10). The measured slides live in the Present store (`present.svelte.ts`, per client, built at `context.ts:429-432`), which `createRailBadges` is handed; decision 8; `context.ts` in the paths with its limit stated; the sizes bullet carries `context.ts`, `model/index.ts` and the full folders.
- F8: the premise cites `:184-187`, and the grep shown names only the constants; the other `fit` functions are named as different.
- F9: `findings.yml` lines 108-135.
- F10: confirmed (`problems.ts:36-83`, `settingReader(config, problems, file)` at `reader.ts:168`). Item 1 now builds a setting reader `settings/present.ts`, listed in `PROBLEM_READERS`, with the full folder split by concern; C4 is a G13 test in `settings.test.ts`, run first on the unchanged tree; the paths hold the reader, `problems.ts`, the moved files and their importers, and the test file.
- F11: confirmed (`read.ts:382-388,405,428`). Item 4 gives a summary or a grid a finding at the deck's `present.yml`, at its `order:` entry's line; C7 rewritten.
- F12: item 5 says the reader gains a raise on the slide's file that carries the line; the premise names `raiseFor`, `:305`, `:337` and `spec.ts:12`.
- F13: the premise and C9 count 24 project decks, the two archive decks named.
- F14: decision 7 quotes the heading as the file holds it.
- F16: item 5 and C8 make a `project` slide whose project's short name is empty untitled.
- F17: C9 is the run of `tests/data/real-hub.probe.ts` and `integrity.test.ts`.
- F18: verify gains the ASCII gate (4), the `unused-exports.sh` compare against `.agents/worktrees/O146-base/unused-exports.txt` (6), the rename grep (7), the history-word grep (8) and the list run count (1); the report gains the `diff -rq` file table, the assertion-edit table, and the ids and asynchronous paths.
- F19: `tests/server/desktop/window-guard.test.ts` in verify 2.
- F20: verify 3 greps the files that draw or print a slide for every frame literal, `720px`, `16/9`, `4 / 3`, 960 and 540 included, and a second grep holds the default out of code.
- F23: item 6 states the facts each as built: the untitled finding listed for the portfolio deck and the projects' decks, the too-tall finding for a slide the view has drawn, until it fits, leaves the deck or the page is reloaded.
- F24: decision 2 and item 1 give the ranges one source, the options entries, read by the setting reader and handed to the deck reader; the wire check and the bridge check only the shape.
- I1: item 2's `deckShape` holds the frame to two whole numbers above zero. I2: decision 10, the saved deck's frame for the audience window and the print bridge. I3: item 2 and decision 6. I4: item 4 and C12, one finding per deck. I5: F11. I6: item 4 and C13. I7: item 4 and C13. I8: item 4 and decision 5. I9: item 4 and C6. I10: item 2 (the deck always carries a resolved frame). I11: F16. I12: C3 and decision 3. I13: item 1. I14: item 4. I15: F23. I16: C10. I17: F1.
