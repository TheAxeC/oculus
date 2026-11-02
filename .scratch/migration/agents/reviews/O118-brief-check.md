# Brief check of O118, on main at 23cfa11c9

## 1. Names

Commands: `git grep -n '<name>' -- . ':!config/local.yml' ':!.scratch'` for each of `foldPieces`, `foldYielding`, `YieldingRead`, `readTurns`, `TurnsAnswer`, `TurnsState`, `TranscriptsStore`, `groupTurns`, `runKey`, `api/transcript`. No `config/` hit in any of them.

Hits outside "Paths this step writes":
- `foldPieces`, `foldYielding`, `YieldingRead`, `readTurns`, `TurnsAnswer`, `TurnsState`: none. Every hit is in `stores/transcripts.ts`, `stores/turns.ts`, `transcript-routes.ts`, `transcript.svelte.ts`, or a test on the write list.
- `TranscriptsStore`: `src/lib/state/client/shapes/client-state.ts:68,128`. It is a type import, so it picks up `readOlder` and stays true.
- `runKey`: `src/lib/views/sessions/terminal/transcript/TurnRun.svelte:6` says a choice "must clear with the target (turn-rows.ts, `runKey`)". It stays true. The hits in `settings-save.ts`, `hpc/clusters/keys.ts`, `hpc/clusters/setup.ts` and `runs/lint/routes.ts` are other functions of the same name.
- `apply`'s signature: every caller of `foldFrom` passes `(record) => ...` (`transcripts.ts:254`, `tests/server/sessions/transcripts.test.ts:75,84,87,97,125`). A lambda with fewer parameters stays valid.
- `/api/transcript`: `src/lib/state/sessions/agents.svelte.ts:85`, the export URL, unchanged. No hit in `docs/`.
- `groupTurns`: no test hit at all (see finding 3.1).

False after the change, and outside the write list:
- `.scratch/migration/agents/guarded.md:117-118`, G40's Code and Test lines. See finding 4.1.

## 2. The step line

Command: `grep -n 'O118' .scratch/migration/plan.md`, line 1610; Ruling 630 at line 3426.

`plan.md` has no Goal section (`grep -n '^## ' .scratch/migration/plan.md` prints Steps, Could run in parallel, Rulings, Agents, Blocked). I read the step line and ruling 630 as the goal. Ruling 631 is O119 and puts nothing on O118.

- "older turns load as the reader scrolls to the top": item 6.
- "reads backward from a first read's start": items 2 and 3.
- "through the yielding loop": items 1 and 3.
- "the view keeping its place as turns are added above": items 5 and 6.
- "to the head of the file": items 2 and 3 (`head` 0) and item 6 (the trigger stops at `head` 0).

Every part maps to an item. One line contradicts the ruling: item 6 says "in this tab's press". Ruling 630 chose scrolling, and "a press at the top of the list" was option (b), not chosen. It should read "this tab's read". `grep -n "in this tab.s press" .scratch/migration/agents/briefs/O118.md` gives line 33.

## 3. Premises

Commands rerun, all at 23cfa11c9: `grep -n 'FIRST_READ' src/lib/server/sessions/transcript-routes.ts`; `grep -rn 'foldFrom(\|foldYielding(' src tests`; `git grep -n 'api/transcript' -- src`; `git grep -ln 'groupTurns\|runKey' tests`.

Each of these holds:
- FIRST_READ lines 30, 38, 96-103, 148-150.
- The `foldFrom` and `foldYielding` callers.
- `turns.ts:201-204` and `208-213`.
- `foldPieces` at line 101, `foldLine` at 224.
- `tail` at 169-192. `merged` is at 147, with its comment at 146.
- `TranscriptBody.svelte:220`, `turn-rows.ts:118`, the zoom box inside the scroller, `transcript.svelte.ts:175`, `agents.svelte.ts:85`.
- `docs/HELP.md:454-459`.
- G84 and G148.

What does not hold, or is short:

3.1 `tests/views/sessions/**` "for `groupTurns`": `git grep -ln 'groupTurns\|runKey' tests` prints nothing. `git ls-files tests/views/sessions` lists one file, `tests/views/sessions/terminal/kill-arm.client.test.ts`. So "the test file that holds `groupTurns`'s cases" does not exist and has no named path.

3.2 `queries.hold` "writes an answer at once" holds, but the brief misses what it does to the turn objects. The query client is built without `structuralSharing: false` (`grep -n structuralSharing -r src/lib` prints nothing), and query-core 5.104.0 `setData` runs `replaceData`, which compares arrays by index. I ran a probe in the scratchpad (a `QueryClient` with the same options, then a prepend through `setQueryData`):

```
append keeps objects true true
prepend keeps objects false false true
```

- A prepend gives every old turn whose new index is below the old length a new object. Only the last N keep theirs.
- `turnDocs` (`turn-rows.ts:137-144`) keys its documents on the turn object, and `turn-rows.ts:12-16` says "the store keeps an unchanged turn's object across a read". That sentence goes false, and item 5's "a row is not drawn anew" fails for every answer.
- Each read then gives every held answer a new `DocState`. `{@html sanitise(doc.html, slots)}` runs DOMPurify again. The string is equal, so Svelte's `html` block leaves the DOM alone (`node_modules/svelte/src/internal/client/dom/blocks/html.js`, `value === (value = get_value())`). The `$effect` at `Markdown.svelte` that reads `doc.html` runs again, which unmounts and remounts every Copy control.
- The cost per read grows with all turns held, and a "Copied" state is lost.
- Fix inside the write list: `turnDocs` keys on `turn.html`, and `turn-rows.ts:12-16` is rewritten.

3.3 `forget` "drops a key": it drops more than that. `queries.forget` matches by partial key (`queries.svelte.ts:293-304`), so `forget(id)` also removes `['transcript', id, agent]` of a subagent tab still showing. See finding 6.2.

3.4 The line-to-turn relation holds. An assistant line gives its said turn plus one turn per call. A user line gives at most one said turn plus results. A result on a user line can point at a call in a dropped turn, which item 2 covers.

3.5 Codex does not behave as Claude for results. `codexRecord` (`turns.ts:270-288`) never writes `answer.results` and never touches `calls`. A Codex tool turn has id `''` and carries its `ok` on the turn itself. So:
- Item 2's "An outcome of a call in a dropped turn goes in the answer's `results`" must skip id `''`, or it writes `results['']` onto the wire. `merged` skips `''` (`transcript.svelte.ts:157`) but the route would not. spec.md:73 asks for a key checked empty.
- The brief needs one line: for Codex nothing goes in `results`, since a re-read turn carries its own outcome.

3.6 The paragraph list of the "What is on the tree" section is short. These also change or need a judgment:
- `turns.ts:10-13` ("the client patches the turn it holds"), `turns.ts:42-45`, `turns.ts:296-303`.
- `transcript.svelte.ts:43-44`, `76-79`, `242-250`.
- spec.md:72 catches these anyway, but listing them stops a miss.

3.7 G40's widened text is uncommitted (`git diff .scratch/migration/agents/guarded.md`), and the O118 brief is untracked. A worktree at main's head holds neither until they are committed.

3.8 The base copy `.agents/worktrees/O118-base/` is not there yet (`ls .agents/worktrees` prints no O118). `/spec` creates it after this check, so this is not a defect. The brief also names no worktree, which spec.md:32 expects. O117's brief names none either.

## 4. Cases and checks

4.1 The tests have no entry that names them (spec.md:60, `guarded.md:3`).
- G40's Code line names only `stores/transcripts.ts` and `stores/turns.ts`, and its Test line names only `tests/server/sessions/transcripts.test.ts`.
- The route cases in `transcript-routes.test.ts` and the store cases in `transcript-follow.client.test.ts` are the tests of G40's widened sentence, and neither file is named there.
- G86's text and Code line cover `follow` only. G84 and G148 cover the agent-refusal and macrotask rows.
- Fix: the orchestrator widens G40's Code line with `transcript-routes.ts` and `transcript.svelte.ts`, and its Test line with the two files and titles, before dispatch.

4.2 The case "`groupTurns` with `above` 3" breaks `guarded.md:3`: "A new entry needs Axel's yes. Views have no entry: the look on TEST covers them." `turn-rows.ts` is under `src/lib/views`. The case cannot be a test without Axel's yes. Move it to the look, where "A pressed run keeps its choice" already stands, and drop the unnamed test file from the write list. Alternatively raise it as an open item. The first keeps the rule, and neither is lazier since the look proves the same thing on the real view.

4.3 The brief's line 65, "each fails there, except that the store's and `groupTurns`' tests cannot compile", is false twice.
- Vitest strips types and nothing in `vite.config.ts` sets `typecheck` (grep prints no such line). So a store test runs and fails on `readOlder is not a function`, and `groupTurns(turns, 3)` runs and fails on its assertion. spec.md:69 wants that failing line quoted, so the exception must go.
- These rows pass on the unchanged tree, because `before` is ignored there:
  - "`before` past the size: the same answer as a first read".
  - "an unknown agent is refused", a 404 at base.
  - In my judgment, "a file of several pieces read with `before`", if it asserts only the macrotask count. The fixture is 40 MiB, the first read takes the last 32 MiB, and the bar is 4.
- With "each fails there" and the stop rule on line 68, a builder may stop on these. Name them as the rows that pass at base, or give the several-pieces row a turn assertion.

4.4 Line 63, "the first run of every case above", includes the look cases. spec.md:65 says a builder runs no page. O117's text said "a first read of every case". It should be: each test case is run, and each look case is read at `file:line`.

4.5 Wording that a builder will read two ways:
- "equal the turns of a read from 0": on the route, `from=0` is a first read. It should say `readTurns` from 0, compared by text and role, since `html` and an `ok` held apart in `results` differ.
- "`before` past the size: the same answer as a first read": item 3's answer has no `offset`, so the case should say the same `turns`, `head` and `results`.
- "rows keep the keys they had with the same turns at `above` 0": literally the same list at `above` 0 gives other keys. It should say the turns that were there before the read.

4.6 The look case "A run at the very top that older calls extend ... reads as never pressed" writes a reader-visible loss in as an expected result. See finding 6.8.

No case asks to check a place the step does not change.

## 5. The question

No. As written the brief can pass without the reader reaching every older turn with the words still.

Route cases: the 500-turn chain cannot pass with a turn lost at the seam, so it answers reach for a file with one-piece lines. It can pass with `head` wrong for a line that starts in an earlier piece. Every line in its fixture is short, so `position + start` without `carried` passes. A case is needed (6.6).

Store cases: they prove merges and one seam. No case chains reads to `head` 0 through the store, and the one forget case passes with the defect of 6.2.

`groupTurns` case: proves keys only, and it cannot stay a test (4.2).

Look cases:
- "A session of more than 200 turns, scrolled to the top: older turns come in, and the words on screen do not move" passes after one read, by eye. A broken second read passes it, and so does a shift of one line height. It must read to the file's head on a session of more than 600 turns, compare the count with the file's turns, and measure a row's `getBoundingClientRect().top` before and after with the read held out, so that the appearance of the muted line is measured as well.
- "Two tabs": passes side by side and says nothing of a hidden tab (6.3).
- "A list shorter than the pane": passes.
- "A turn appended while far up": passes unless a landing of both falls in one draw (below).

Item by item:
- Item 1 can pass with `carried` left out (6.6).
- Items 2 and 3 can pass as above.
- Item 4 can pass while a forgotten read writes onto a new first read (6.2).
- Item 5 can pass with rows redrawn (3.2).
- Item 6 cannot meet its own sentence as written, for these reasons:
  - The muted line stands at the top of the list and takes room, and the brief's compensation covers only "turns come in above". When the line appears the words move down by its height. Landing then compensates the net growth, so that shift never comes back. One line per read.
  - If the line is a child of `.turns`, the old first row also loses `.user:first-child`, which adds 27 px (10 + 16 + 1, `TranscriptBody.svelte:305-315`).
  - Measuring by `scrollHeight` growth counts anything else in the same draw: a tail landing in one flush, or a result that opens a failed run. Those words then move by that height.
  - `overflow-anchor: none` turns off whatever the browser does today for height changes above the reader: a result opening a run above, the text size buttons, a pane width change, a late image (`ui/html.ts:91` allows `img`). What the browser does today is not verified in a browser.
- Fix: correct by a row, for every draw. Before the draw take the first row on screen and its top, and after the draw set `scrollTop` by that row's change. That is one rule for the prepend, the muted line, an append and a patched result. It leaves the browser's anchoring on, because the correction is absolute, not additive. Otherwise the muted line must take no room in the flow. The first ends the cause. The second is the lazy option, since it leaves the append and patch cases open.

## 6. Implied inputs

6.1 First draw of a session. At the first draw `scrollTop` is 0, and the effect at `TranscriptBody.svelte:160-174` sends it to the foot. If the after-draw test runs before that effect, every open with `head` above 0 makes an older read at once. Expected: the test runs after `toFoot`, and no older read on an open of a list taller than two columns. The same holds for a change of session in one component (`shown` differs). The growth tracking resets with `shown`, since `above` of another session means nothing.

6.2 Older read out, then `forget`, then a new first read lands before the old answer. This happens on A to B to A, and through `forget` of the session while an agent tab shows (3.3). "After `forget` holds nothing" read as `peek` being undefined fails here. The answer is prepended to a new first read whose `head` can be later, so turns between are lost with no sign. Expected: `readOlder` applies its answer only when the held `head` still equals the `before` it asked with. Add a store case. spec.md:73 asks for the superseded path.

6.3 A hidden tab. `TabView.svelte:69` is `display: none`, so the scroller reads `clientHeight` 0 and `scrollTop` 0.
- With `<=` the test is true at every draw. Scoped stores do not stop it: `peek` and `hold` ignore the scope (`queries.svelte.ts:24`), and `readOlder`'s own fetch is not a query. A hidden tab then reads to the head of the file on each other tab's read, against `TabView.svelte:6`.
- Expected: no older read while the scroller has no height.
- A hidden tab also cannot move `scrollTop` while another tab adds turns above. Expected: when shown, its words are where the reader left them. Only an anchor kept per row can do that.
- Add a look case with two tabs in one pane.

6.4 A failed older read. `olderError` changes the state, so a draw runs and the after-draw test fires again at once, a tight loop of failed requests, since the store refuses nothing on `olderError` (the case wants the next `readOlder` to ask). Expected: the after-draw test does not ask while `olderError` is set, and only a scroll does.

6.5 File shrunk or rewritten between reads. `before` past the size reads to the size, so the answer repeats turns held, and a `from` past the size answers nothing (`transcripts.ts:118`). `before` inside a line drops the partial last line, which is safe. Expected: no throw, turns may repeat until the tab reopens. State it as a limit in the report. Whether any writer rewrites a transcript is not verified (G87 names copied and synced files).

6.6 A line longer than a piece at the seam. The byte is `position + start - carried`, and `foldPieces` needs an end in three places: the buffer size at line 119, `Math.min` at 131, and the loop and yield at 126 and 161. Add a route case: the oldest kept line is 9 MiB and spans `PIECE_BYTES`, `head` is its first byte, and the next read holds none of its turns. `foldYielding` has no `piece` parameter, so it must be a real 8 MiB-plus line.

6.7 A `head` read after a compaction. Claude: `saidByHuman` refuses `isCompactSummary` (`fold.ts:251`), and the older lines stay in the file. Expected: pre-compaction turns read as ordinary turns and no summary turn. Codex: `compacted` records are ignored by `codexRecord`. I saw 6 in the last 20 rollouts over 100 KB, out of 142 such files.

6.8 A subagent transcript. Same path through `agent`; `tail` and `readOlder` share `keyOf`. A run at the seam is common, since most turns are calls, so the "reads as never pressed" of 4.6 is reachable. Fix: move the choice to the run's new key when a read extends it. It is a few lines in `TranscriptBody.svelte`.

6.9 A session whose id changes. Expected: a new key, a first read, `above` 0, `chosen` cleared by `target`, and the old key's older answer dropped under 6.2.

6.10 Codex records with no line turns. Expected: the first read doubles to the head, answers no turn and `head` 0, and "no turns yet" is drawn. Real rollouts do hold them: all 20 sampled have `item_completed` (2930 records).

6.11 The first read that doubled past 32 MiB. Expected: `head` is the turn's line byte, above 0, and the next `before=<head>` goes on. The table row at `transcript-routes.test.ts:351` does not read `head`, so add it there.

6.12 `from` 0 reads replacing state. `held.offset` is 0 only with no turns held (a failed or empty first read), so nothing older is at risk. Expected: such an answer sets `head` from the body, `above` 0, `older` false, and `results` to its own. A `from` above 0 keeps the held `head`. The failure paths of `tail` (`transcript.svelte.ts:178-191`) must also stop writing the start copy. Item 4 says this in general terms only.

6.13 The wire. `{ ...read, turns }` at `transcript-routes.ts:143,150` spreads every field of `TurnsAnswer`, so a line note kept there reaches the wire, and the `from` answer could gain `head`. The `read` helper of the tests picks fields, so no test would see it. Add a row: the keys of a `from` answer and of a first answer.

6.14 A tail's landing and a hold. A probe with query-core ran a hold k microtasks after the fetcher returned its merge. At k 0 and 1 the hold is lost (`a,tail`); from k 2 it is kept. If that happens with `older: true` in the merged state, `older` stays set and no further read is asked. Real responses land in separate tasks, in my judgment, so this is rare. But a store test with both stubs resolved together can hit it, so the test must resolve one and settle before the other.

6.15 No cost, one line each: `from` and `before` together, and `before=` empty. Expected: `before` wins, and empty is treated as absent, as `from` treats it.

## 7. ADRs

None. `find . -path ./node_modules -prune -o -path ./.agents -prune -o -type d \( -iname '*adr*' -o -iname '*decision*' \) -print` prints nothing, and `ls -a docs` shows no such folder.

## 8. Dictated text

`LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/briefs/O118.md` prints nothing, and `grep -n 'not .* but '` prints nothing.

- `turns_older` (Reading earlier turns), `turns_older_failed` (Earlier turns could not be read: {0}): `grep -n 'turns_older'` gives line 96. Holds under spec.md. The hub's no-synonym rule is broken against item 7's "older turns" in `docs/HELP.md`. Use one word; I recommend "older", the plan's word.
- HELP line "older turns load as you scroll up": `grep -n 'scroll up'` gives line 34. Holds (spec.md:72).
- `GET /api/transcript?id=...&before=<byte>`: `grep -n 'before=<byte>'` gives line 30. Holds. Decision 7 surfaces it (spec.md:18). `before` is on spec.md:44's word list, so each hit in a comment or test title is judged in the report, not banned.
- "the comment on `FIRST_READ_TURNS` stops saying older turns stay out of the view": `grep -n 'stops saying'` gives line 34. Holds. The new comment takes no compared-to-earlier word.
- `.chat` takes `overflow-anchor: none`: `grep -n 'overflow-anchor'` gives line 33. Holds as to the rules. Its behaviour is finding 5.
- "in this tab's press": line 33. Breaks ruling 630 (section 2).
- Report line "Everything in the brief is done" and the path `reviews/O118-report.md`: `grep -n 'Everything in the brief is done'` gives line 124. Holds with spec.md:84. spec.md:36 forbids writing under `.scratch/`, and O117's brief carries the same line (`grep -n 'reviews/O117'` gives lines 67 and 103), so it is the standing practice.
- Decision 5, "the report states the measure of one such read": names no measure, no file and no command. spec.md:14 forbids a figure not taken. Say what is measured and how: for instance bytes and milliseconds of one `before` read on a sparse fixture, by a case-run program.
- Line 65 "cannot compile": false (4.3).

## Declined to judge

- What Chrome's scroll anchoring does today on the Transcript. No browser was run, and ports 8787 and 8790 were left alone.
- Whether a late image in an answer loads in practice. I read only that the sanitiser allows `img`.
- Whether a `$effect` remount of Copy controls is visible to a reader. I read it from the code and did not see it.
- Whether a transcript is ever rewritten in place.
- Whether 200 kept turns per read is the right page size, and whether a full DOM at a 4.4 GB session is acceptable (decision 5). These are design choices the brief states openly.

Usage: a9b41423d719cfb85, claude-opus-5-5, 223649 tokens, 27 tool uses, 10 min 58 s.

## Closed

All findings closed by changes to the brief, none changing the part the step builds or making a choice for Axel:

- Section 2 and dictated "in this tab's press": reads "this tab's read".
- 3.1, 4.2: the `groupTurns` case moved to the look, no new test file, since views have no guarded entry.
- 3.2: `turnDocs` keys on `turn.html`; the premise and `turn-rows.ts:6-16` named.
- 3.3, 6.2: an older answer applies only while the held `head` equals its `before`.
- 3.5, 6.13: `results` skip id empty, Codex named; the route names its fields; key rows added.
- 3.6: the paragraph list widened.
- 3.7: the preparation commit carries the brief and `guarded.md`.
- 4.1: G40's Code and Test lines widened.
- 4.3, 4.4, 4.5: the first-run text rewritten, rows passing at base named, comparisons stated.
- 4.6, 6.8: a run extended at the top keeps its choice.
- 5, 6.1, 6.3, 6.4: item 6 rewritten: anchor by row for every draw, browser anchoring left on, limits on the after-draw test, hidden tab; look cases made measurable.
- 6.5: decision 8. 6.6, 6.11, 6.15: route cases added. 6.7, 6.10: look cases added. 6.12: item 4. 6.14: the store test settles one answer before the other.
- Dictated: "older" used in both catalog sentences; decision 5 names what is measured.
