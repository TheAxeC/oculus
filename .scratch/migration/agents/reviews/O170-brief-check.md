# Step O170 brief check (on main at 4a8e29067)

## 1. Names

`git rev-parse HEAD` prints 4a8e29067bbb7ac65cc9305b34821e78bf71932d. Nothing was changed. `git status --short` shows only the ledger files and the briefs.

Hits outside "Paths this step writes":

- **`copied_citation_js`, `citation-js`, `citation_js`** (`git grep -n "citation-js\|copied_citation_js\|citation_js" -- . ':!.scratch' ':!config/local.yml'`):
  - `words.ts:104, :107` (key stays, comment still true).
  - `bibtex.ts:6,10,15,25,33,75,78,79,96,156` (the library and the internal word; not false).
  - `package.json`, `package-lock.json` (not false).
- **`export_opened`** (`git grep -n "export_opened" -- config src tests docs`): only `present.yml:52` and `export.ts:205`, both on the list.
- **`settled.remove`, `settle.removed`, `.removed(`**:
  - `Collection.svelte:145` `client.pages.removed(key, entry.id)`: outside the list, signature unchanged, not false.
  - `tests/state/client/created-ids.test.ts:51` `writesOf(settle: Settle)`: outside the list, not false; a fake with fewer parameters still assigns.
- **`settled.heard`**: `context.ts:180`, `settled.svelte.ts:77`, `page-entry.test.ts:456`, all on the list.
- **`onUnwritten`**: `tests/state/client/held-unsaved.test.ts:97` is outside the list; a one-argument listener, not false.
- **`unwritten`, `tell`**: all hits are on the list.
- **`writeGit`**: `repositories.svelte.ts:316,:450`, `Deposit.svelte:64,:174`, outside the list, unchanged, not false.
- **New required method `SchedulesWatcher.nextRead()`** (`git grep -n "SchedulesWatcher\|runNow:" -- src tests`). These object literals lack the method and are not on the list, so each is false or a type error once it is added:
  - `src/lib/server/root/context.ts:558-562`, the wrapper object that is `locals.server.schedules`, the object the route calls. Without `nextRead` forwarded the route cannot read the number.
  - `tests/server/root/context-fixture.ts:151-155`.
  - `tests/server/machine/runs/schedules/file.test.ts:45`.
  - `tests/server/machine/runs/schedules/record.test.ts:90`.
- **`hub.nextVersion` on the write target**: `HubLike` (`src/lib/server/sessions/stores/hooks.ts:226-229`) has `latest` and `publish` only. `writes.ts:312` types `server.hub` as `HubLike`. `hooks.ts` is not on the list. Widening the type inside `writes.ts` is possible, and the brief does not say.
- **`src/lib/views/feeds/literature/Head.svelte`** is not on the list. Its head comment (`:2-3`, "one toggle per source the server lists") and prop comment (`:32`, "The sources the server lists, in its order.") become false before the listing answers (item 3). Rule: `spec.md:72`.
- **`Slide.svelte`** is written only at "lines 170-290". Item 6's new measure lives in `drawn-slide.ts`, so its import belongs in the import block at `Slide.svelte:56-62` (`grep -n "drawn-slide" Slide.svelte` prints `:62`), outside the range. The head comment enumerates what the layout measures (`:17-21`) and what it reads off the drawn slide (`:32-33`). `least` makes each list incomplete. The brief forbids `:30-40` and writes nowhere above `:170`, against `spec.md:72`.
- **`docs/apps.md:459`** names the delete-entry request only. `build` reaches an app's answer through the same `answer` (`writes.ts:750-764`). `grep -n` for an answer-key description in `docs/apps.md` prints nothing, so no sentence there becomes false.
- **`docs/HELP.md:470`** ("In a browser, Export to PDF opens the print dialog.") stays true.

## 2. The step line

`grep -n '^- O170 ' plan.md`, part by part:

| Part of the line | Requirement |
|---|---|
| BibTeX line names no library | item 1 |
| reload sends no search | item 2 |
| source buttons from the first paint | item 3 |
| export line fits and goes | item 4 |
| presenter current at least as large as next | item 5 |
| figures side by side never narrower, block going stacked or under the text | item 6 |
| toolbar one order whether or not presenting | item 7 (the tree already holds one order across `presenting`; item 7 ends a different movement, the Facts chip) |
| refused git action's toast | item 8 |
| server numbers each build and read | item 9, first two sub-bullets |
| a write's answer carries the number | item 9, narrowed by Decision 6 to `delete-entry` and the schedules `delete`; ruling 722 says "a write's answer" |
| held removal of a collection entry or schedule ends | item 9 |
| **"a bookmark"** | **no requirement.** Item 9 and What is on the tree :27 exclude it. The line was corrected for `frame` and still names a bookmark. |
| G152 states that end | item 10 |

## 3. Premises

Line ranges were printed with `sed -n` and the commands of the brief were rerun. Rerun and equal: `git grep -n "deck\.frame" -- src config` (nothing, rc=1); `git grep -n "copied_citation_js\|citation-js" -- tests docs/HELP.md docs/decks.md` (nothing, rc=1); `git grep -ln "slide-layout\|layOut" -- tests` (nothing, rc=1); `wc -l` (877, 873, 818, 794, Slide 487); and every other cited range except those listed below. `verify:` is `npm run test:quick`.

Mismatches:

- **:17 (first paint).** "The rows are in the merged config the page holds from its first load (`seed: configSeed(...)`)" is false for the usual load.
  - `src/lib/server/root/config-seed.ts:44-62`: `if (same) return { through: held.version - 1 };` carries no payload, and `held === undefined` carries none.
  - `socket.svelte.ts:402`: `if (payload === undefined) return;`.
  - `+page.svelte:5`: "the merged config the socket delivers".
  - `Workbench`'s `configured` gates only two effects (`Workbench.svelte:271, :282`), so panes draw before the `config` message. On a reload `config()` is null at first paint, `literatureRows({})` gives no rows, and the buttons cannot stand in the first frame (by reading; no page was run). A payload on every seed would need `config-seed.ts`, which is not on the list.
- **:25.** "The write target has `server` beside it at :333-336" is inexact. Those lines are in `target()` where `server` is a parameter. `WriteTarget` (`writes.ts:116`) has no `server` field.
- **:21.**
  - `{#if facts !== null}` is at `Bar.svelte:89` (`grep -n`), and `:93` is `pressed={facts}`.
  - The Toolbar is `:79-:123`, and `:127` is inside `BoardBar`.
  - The `git log -p | grep presenting` output also prints `presenting: boolean;` and `presenting,` (its lines 201, 209, 385, 397), so "shows only the pressed and active" is not what prints.
- **:22.** `tell` is at `writes.svelte.ts:124-143` (`grep -n "function tell"` prints `:124`); the brief says `:121-140`.
- **:23.** `createSettled` is at `context.ts:172-179`, and `afterReceive` at `:180`.
- **:15.** `words.ts:107` reads `citation_js`, so `git grep -n citation-js -- config src` does not print it.
- **:29.** File sizes omit `src/lib/state/client/context.ts`, which is 880 lines (`wc -l`), at the limit, and on the write list for a comment rewrite.
- **Line 138, "a new file beside `writes.svelte.ts`".** `git ls-files src/lib/state/client | sed ... | sort -u | wc -l` prints 10, the folder limit (`spec.md:49`), so a new file there makes 11. The folder of `watch.ts` holds 6.
- **:17 `merge.ts:32`** is correct as `src/lib/state/feeds/literature/merge.ts:32`; the brief gives no folder.

## 4. Cases and checks

- **C1, Verify 3, Verify 4** ask the builder to run `git grep`. `spec.md:33` allows `git status`, `git diff`, `git show` only. The O169 brief holds none (`grep -c "git grep"` prints 0).
- **Line 9 names no base copy.** `spec.md:33` says the brief names one, and Verify 5 says "compared with main at the base". O169.md:9 names one.
- **C14** asks the builder to list by reading each deck of the research hub that holds two or more figures. That is a place the step does not change, and it is against `spec.md:8` and `:38`.
- **C24** (bookmark) asks the builder to check a place the step does not change. Item 9 says a bookmark is unchanged.
- **C17** names `tests/routes/hubs/hub-writes.test.ts`, which is not on the write list. `tests/routes/edit/write.test.ts` holds no `delete-entry` row (`grep -n "delete-entry"` prints only `hub-writes.test.ts:190`).
- **C16** "if one exists": none exists (`grep -n "notice-sources\|onUnwritten\|writeGit\|A write was refused" agents/guarded.md` prints nothing), so its proof is a quoted run.
- **Verify 7** names the standards page's rules on list items and sentence length. `grep -n "sentence length\|list items" spec.md` prints nothing (rc=1).
- **Other entries whose code the step changes** (`spec.md:60`): `grep -n` names G8 (`writes.ts`), G28 (`writes.svelte.ts`), G46 and G91 (`watch.ts`), G117 (`schedule.svelte.ts`, routes `write`). The brief does not name their tests.
- C17 to C23 and C25 as rows of G152 agree with the test rule. C2, C3, C6, C7, C8, C15 as looks agree with `spec.md:65`.

## 5. The question

Each case: "could this pass without the goal being reached?"

- **C1**: no. **C2**: no. **C4**: no. **C7**: no. **C10**: no. **C11**: no. **C15**: no. **C16**: no. **C17**: no. **C18**: no. **C19**: no. **C20**: no. **C22**: no. **C23**: no. **C25**: no.
- **C3**: on the usual load it cannot pass (Premises :17).
- **C5**: no for "before the answer". For a failed listing, "what it says today" is `none_on`, "No source is on. Turn one on to search." (`literature.yml:37`), while every drawn row is pressed; the words contradict the drawn state.
- **C6**: no. Blocked tab and hold-ended are not exercised (section 6).
- **C8**: no. It does not detect a wrong threshold, but the goal holds at every width in both layouts.
- **C9**: yes. On its own inputs C9 is C13 (`least` .5 > stacked in-room .08). A Node run of the unchanged module prints `{"arr":"side","shape":"alone",...,"boxes":[0.16,0.16]}`.
- **C12**: yes. The Node run with room .8 by .4, text .3, ratios .4 prints tall boxes of .16. `under` at the same inputs is .1 tall, so a wide block has boxes of .04. With `least` .2, "shape is wide" passes while the box is narrower than the tall column it replaced and `least` is unmet.
- **C13**: yes. `placeOf`'s alone branch is `y = (room.height - block.height) / 2`, negative for a block past the room, and `height = max(room.height, block.y + block.height)` is still past the room. The case passes with the first figure's top above the room, over the title.
- **C14**: no, by the look.
- **C21**: yes unless the row calls `entities.reconnected()`. Without it `receive` drops a lower version (`entities.svelte.ts:43`) and no listener is told.
- **C24**: not a goal of this step.

**Item 5, the arithmetic.** With W pane width, content width W-24, gap 12, R the row height:

- `>=596`: the current room is `.75(W-36)` wide and R tall. The next room is `.25(W-36)` wide and at most R tall. The largest 16:9 box of a room no wider and no taller is no larger, so the rule holds at every size.
- `<596`: rows `.6` and `.4` of the height, the next cell half the width, so it holds.
- At W=2400, H=300 the next frame can equal the current, which meets "at least". At H=300, W=1400 the arithmetic leaves the notes 0 px (caption about 24 + 192 + gap 12 = R=228); "The notes keep their scrolling" is not checked by C8.
- A CSS switch on pane width needs a container query. `.presenter` has padding 12 and cannot style itself by its own query, and a query on `.presenter` measures W-24, so a literal 596 there breaks at W=620. C8 still passes at 600 and 590.

**Item 6.**

- Side, tall, wide, alone: `least` is compared on box width, but the brief does not say in what order arrangement and shape are decided, so `side` tested before or after `tall -> wide` gives different results. By reading `placeOf`, the wide scale can be smaller than the tall scale (C12).
- Stacked in-room never lies over the next figure, because figures stack vertically and a wide word runs sideways. Bullet 3's scale-up is not asked by the step line; its only effect is a slide measured too tall.
- `least` greater than `room.width`: bullet 3 makes the block wider than the room, and `x` is negative in the wide and alone branches. No case covers it.
- `min-content`: `.fig { width: 100% }` is a percentage on a replaced element, so on `.panel` it contributes only its padding (`Panel.svelte:106-114`, `0.46875cqw` each side, `.009375`). Measured on `.cap` and `.explain` directly, the rect includes `.explain`'s padding. Either form measures what the brief says, and the panel's box width is what the layout gives.
- Hazard: `.waiting { display: none }` applies while `box === undefined`, and `draw` runs after `show(null)` set `boxes = {}`. A `least` read before the first `show(layOut)` of the first draw reads 0 on every panel. "Measured at the factor being tried" does not say when, and the `under` loop's `break` can skip a re-layout. A unit run cannot see this.

**Item 9.**

- Number before any build: yes. `rebuild` is synchronous (`portfolio.ts:626`), `removeEntry` is synchronous, no await lies in `writes.ts:628-645`, `nextVersion` is read and published in one tick (`:715`, `:745`), and `grep -n "mtime\|cache"` over `build.ts` and `collections.ts` prints nothing, so the build reads the file written.
- Held forever: a removal ends only at a later build. A file write the watcher never hears is the same dependence as today. New: after a restart a first version in `[seen, build)` holds until the new server reaches the number.
- Schedules: the count changes only in `reload`, so non-read `publish` callers keep the same `read` and dedupe as today. Every `reload` publishes if the count is taken before the `!read.ok` branch's `publish` (`:674`). `Hub.publish` (`channels.ts:157`) has no dedupe of its own. `options.schedules.reload()` runs right after the write (`routes.ts:326`), so the number is reached.
- "The version seen at the answer" is ambiguous for schedules: the channel version and `read` are different counters (non-read publishes advance the channel). Mixing them would make `read < version` true at once and end every removal.
- Reconnect to a restarted server: `reconnected()` takes the first message whatever its version. A number below `seen` ends the removal, and a number at or above `build` ends it. Equal to or above `seen` and below `build` holds.

## 6. Implied inputs

Missing from "Cases", each with its expected result:

- A tab the browser blocks: `export_blocked` replaces the opening line and stays.
- A print page that never asks: the line goes at the end of the 10 s hold.
- A second deck's press while the first deck's hold runs: the first's end clears an equal line.
- A reader's Cancel of a fetch or push: the server answers `'{0} was stopped by Cancel'` (`server.yml:398`), so the toast reads "The fetch failed: ..." or "The push was refused: ..."; the brief states no result.
- A `refused` field list on a git answer: `tell` joins the fields, and the toast is the action's line with them.
- A failed listing: the rows stay; Search says `none_on` (section 5).
- A listing answered after the tab closed: no state change. The comment at `Literature.svelte:153` ("starts no search") goes with the `go()`.
- An entry deleted in a hub other than the primary: the same portfolio number and the same end. `hub-writes.test.ts:190` is the fixture and it is off the list.
- Two removals with different numbers: each ends at its own number.
- A schedule held over a restart: a `read` below the `read` seen ends it (C21 covers collections only).
- A restart whose first version lies in `[seen, build)`: held until that number.
- `least` wider than the room: a stated `x` and `y`.
- The presenter after the last slide: the side's row with the end-of-deck line and no preview.
- A hidden tab: `Slide` returns on `offsetWidth === 0` and lays out on show; no missing input.

## 7. ADRs

`ls docs/adr` prints `ls: docs/adr: No such file or directory`. Oculus has none.

## 8. Dictated text

`grep -n` over `.scratch/migration/agents/briefs/O170.md`, each read whole against `spec.md`'s prose rule (`:21`), the ASCII rule (`:51`) and the catalog rule (`:90`):

- `:57` `copied_citation_js: BibTeX copied, built from the paper's fields because no source served one`: holds.
- `:58` `export_opening: Opening the print tab...`: holds.
- `:60` `notice_fetch_refused: 'The fetch failed: {0}'`: holds.
- `:61` `notice_push_refused: 'The push was refused: {0}'`: holds.
- `:62` `notice_pull_refused: 'The pull failed: {0}'`: holds.
- `:63` `notice_sync_refused: 'The sync failed: {0}'`: holds.
- `:64` `notice_publish_refused: 'The publish was refused: {0}'`: holds.
- `:75` "Opening the print tab...": holds.
- `:85` the toast forms: holds.

## Declined to judge

- Whether the brief's exclusion of the bookmark is acceptable against the step line.
- Whether bullet 3's scale-up is what the user wants over an in-room stacked block.
- The original words of the look behind the toolbar item: no review file names them (`grep -rn` over `agents/reviews`).

Usage: a0e91311c5e402ce3, claude-opus-5-5, 288712 tokens, 28 tool uses, 13.6 min

## Closed (the session's change to the brief for every finding above, made before the preparation commit)

- Names, `nextRead` on the wrapper and the fakes: `src/lib/server/root/context.ts`, `tests/server/root/context-fixture.ts`, `file.test.ts` and `record.test.ts` added to the paths; item 9 names the wrapper. Internal, booked in `choices.md`.
- Names, `hub.nextVersion` on `HubLike`: item 9 types `server.hub` as `HubLike & Pick<Hub, 'nextVersion'>` inside `writes.ts` and adds a function to `WriteTarget`.
- Names, `Head.svelte` comments: added to the paths; item 3 asks for them. Internal, booked in `choices.md`.
- Names, `Slide.svelte`: the range is lines 15-34, 56-62 and 170-290, and Conventions names the paragraph O151 rewrites.
- The step line, "a bookmark": `plan.md`'s line is corrected, since ruling 722 names no bookmark and a bookmark's removal already ends at the first read after its answer; the brief records it; C24 is removed.
- The step line, "a write's answer": Decision 6 stands, since only the two removals read a number.
- Premises :15, :21, :22, :23, :25, :29: corrected in "What is on the tree".
- Premise :17, first paint: item 3 now keeps the last listing in the tab's instance state (`listed`), read at first paint; a new tab uses the config, which a running page holds; Decision 11; C3 rewritten.
- Line 138, folder limit: the new-file line names `shapes/` for `writes.svelte.ts`.
- Cases and checks, `git grep`: C1 and Verify 3 and 4 use `grep`. Base copy named at line 9. C14's reading of the hub's decks removed. C24 removed. C17 names `hub-writes.test.ts`, added to the paths in place of `write.test.ts`. C16 is a quoted run. Verify 8 reads against the rules file's prose rule. Verify 7 runs the tests of G8, G28, G46, G91 and G117.
- The question, C5: a failed listing lets Search ask the drawn sources, so no sentence contradicts the drawn state (item 3).
- The question, C9, C12, C13 and item 6: the third bullet (a stacked block past the room) is removed, since a stacked figure has no neighbour for a word to run over and the step line's outcome is stacked or under the text; item 6 now states the candidates and their order; C9, C12 and C13 have inputs whose results were computed; Decision 12.
- The question, C21: the row calls `entities.reconnected()`.
- The question, item 5: the switch is written at the content width of 572 px on an inner grid; the side's rows are 3fr and 2fr so the notes keep height at every size; C8 checks the notes and adds widths 2400, 620 and 596.
- The question, item 6, measuring: `least` is read after the first layout of a factor, once the panels are drawn.
- The question, item 9: `reload` counts as its first statement, before every `publish`; an entry compares channel versions and a schedule compares `read` values, never the two; the restart window is stated.
- Implied inputs: added to C5, C8, C16, C21 and the new C26. `least` wider than the room falls away with the third bullet.
- Dictated text: no finding; no dictated line was rewritten or added.
- Declined to judge: the bookmark is corrected in the plan as above; the toolbar's original words are not in any file, and item 7 stands on the step line.
