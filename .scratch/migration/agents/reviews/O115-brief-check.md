# Brief check of O115

Brief check of O115, on main at 4014172a0 in ~/workspace/oculus. Nothing was changed. `git status --short` shows only `.scratch/migration/orchestrator-state.md`, `plan.md` and `agents/briefs/O115.md`, which were already there.

The brief is not ready to dispatch. Five findings stop or defeat a builder:
- N1: item 6's zoom formula always gives 1.
- C1: Cases 2 to 7 have no guarded entry.
- C2: the closed row has no ui/ primitive and no path to change one.
- I1: Codex rows stay wrong: `running` forever, a failure read as `running`, no summary.
- I2: run state keyed by index leaks across sessions, because the component outlives its target.

The two count programs are read-only and print counts and key names only:
- `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o115_count.py`
- `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o115_count2.py`

## Names

- `turn_ok`. Command: `grep -rn "turn_ok" src config tests docs README.md .agents --exclude=local.yml`.
  - Hits on main are `TranscriptBody.svelte:120` and `config/text/views/sessions/transcript.yml:12`, both on the path list.
  - The only other hits are the same two lines under `.agents/worktrees/gate/`, a gate worktree. The change makes them neither false nor stale on main.
- `turn_tool`. The same grep over `turn_(user|assistant|tool|running|error|cut|ok)` shows its one reader is `roleLabel` at `TranscriptBody.svelte:114`.
  - Item 2 and item 3 draw no tool head, so the key loses its reader. `tests/checks/source/keys.test.ts:705` 'has a reader for every catalog key' then fails unless it goes.
  - Item 7's "any key the step stops using" covers this; it should be named.
  - `server.export.ok` (`config/text/server.yml:361`) is a separate key and is unaffected.
- `summaryShape`. `grep -rn "summaryShape" src tests config docs README.md --exclude=local.yml` hits `turns.ts:59` and `turns.ts:86` only. Nothing outside the paths.
- The `.doc` rules. `grep -rlE '\.doc\b' src tests --include='*.svelte' --include='*.css'` hits `CardDocs.svelte`, `Markdown.svelte`, `Help.svelte`, `Doc.svelte`, `TranscriptBody.svelte`. Svelte scopes them, so removing TranscriptBody's rules reaches none of the others. Nothing made false.
- Words made false or incomplete outside "Paths this step writes":
  - `src/lib/views/sessions/terminal/bar/TerminalFontTools.svelte:2-3` says "The three buttons ... that set the grids' font size". This is false after item 6. It is a defect under spec.md:72 and the file is not on the path list.
  - `config/options/appearance.yml` `terminal.font_px` help says "Text size of the terminal grid in CSS pixels", shown in Settings, and `config/defaults/appearance.yml:79` says the same. Both are incomplete after item 6 and not on the path list.
  - `Markdown.svelte:4-6` lists its callers as "The doc, help and project views ... and RenderedMarkdown.svelte". Incomplete after item 1, not false, not on the path list.
  - `turns.ts:14-18` says sanitise "runs over the HTML before ... TranscriptBody.svelte draws it". This is on the path list and item 7 covers it; `turns.ts:58` "the four fields" likewise.
  - `tests/state/sessions/transcript-tab.svelte.ts:2` stays true.

## The step line

Every part, from `plan.md:1603`:

| Part | Requirement | State |
|---|---|---|
| Turns told apart at a glance | item 2 | mapped |
| Answer through the one rule set; tables with borders and whole words; code reads as code | item 1 | mapped |
| A run is one quiet line that opens | item 3 | mapped |
| Failed or running stands out; a returned call draws no tag | item 3 | mapped |
| Every tool row says what the call was about, WebSearch and WebFetch included | item 4 | partial: item 4 changes `summaryShape` alone, and Codex goes through `codexSummary` (`turns.ts:286`). See I1. |
| Readable over a picture at the pane's width | items 2 and 5 | partial: item 2 has the wall surface rule and item 5 the measure. No requirement names legibility over a picture for muted tool lines or the clocks. |
| Follows the tab's font buttons | item 6 | mapped, but the formula fails (N1) |

## Premises

Rerun and matching:
- `ls docs/adr` fails.
- `wc -l` on TranscriptBody gives 310.
- `.chat` gap is 10px.
- `.doc` copy is at lines 261-304.
- Table rules are at `Markdown.svelte:354-370`.
- `.sum` has `min-width: 0`; `.tag` has `min-width: 0` and no `flex: none`.
- `summaryShape` is at 59-72.
- `gridFontSize` is at `terminal-list.ts:136`.
- `DocState` is at `docs.svelte.ts:42`.
- Wall rules are at 316-334.
- `tokens.css:167` is `--fs-sm`.
- `turn_ok` is only in TranscriptBody.
- TranscriptBody reads no font setting (grep for font shows CSS lines only).
- TranscriptBody's only importer is `Terminal.svelte:81`.

Do not reproduce:

- N1 (blocks item 6). The formula "ratio of `gridFontSize` with the setting to `gridFontSize` without it" gives 1 once the write lands, so the font buttons do nothing in Transcript.
  - `ui.svelte.ts:338-340` is `return held('terminal.font_px', terminalFontPx())`.
  - `terminal-list.ts:137` is `const configured = chosen ?? terminalFontPx();`.
  - `setTerminalFont` writes `terminal.font_px` (`ui.svelte.ts:422-428`), and `terminalFontPx()` reads that key back (`appearance.ts:220,607-610`). So `gridFontSize(null, scale)` is the setting itself, not a base.
  - At rest both sides are 12.5 (`config/defaults/appearance.yml:81`). Only the `held` window differs.
  - This is by reading, not run. "A ratio that cannot be computed draws at 1" hides it, and only case 13 at the look would show it.
  - The brief must name a real denominator. `--fs-md` times the scale makes default prose 12.5/13 of `--fs-md` and contradicts item 5. The configured default alone has no client reader today. This is a premise found wrong.
- Line 23 "`.chat` holds up to the whole conversation". The first read holds at most 200 turns.
  - `transcript-routes.ts:27` is `FIRST_READ_TURNS = 200`.
  - `transcript-routes.ts:105` is `read.turns.slice(-FIRST_READ_TURNS)`.
  - The brief's "200 turns of a real session" is this cap.
  - Case 15 "Several hundred turns open" cannot occur on an open; only a kept tab that followed appends reaches it.
- Line 19 "`Disclosure.svelte` is the existing disclosure mark". It exists, but it is a bordered pill on `--chip` with a required `count: number`, `inline-flex`, `white-space: nowrap` and no ellipsis (`ui/tree/Disclosure.svelte`). It cannot be item 3's row, cannot be a run of one, and paints a surface. See C2.
- Line 17 cites `themes.css:53` as resolving at the root. That line is under `body.rice` (line 51). The conclusion holds, since a descendant's `--text-scale` still does not reach it.

## Cases and checks

- C1 (blocks). Cases 1 to 7 stand under "Tests:" and Paths names `tests/server/sessions/transcripts.test.ts` plus one new test.
  - spec.md:60 says "A test exists only as the test of one entry" and "A step that needs a new entry stops and asks Axel for it, and writes no test until he has ruled."
  - `grep -c TranscriptBody agents/guarded.md` gives 0. `guarded.md:3` says "Views have no entry".
  - Cases 2 to 6 (grouping, words, state key, failure flags, the short name) have no entry.
  - Case 1 would sit in describe 'readTurns' under G40, whose guarantee is reading in pieces; a summary is not in it.
  - Brief line 79 then says a case becomes a test only where the rule calls for one, so the "Tests:" heading and line 98 contradict the brief's own hedge.
  - Either ask Axel for an entry now, or remove the test path and name the look or reading as proof.
- C2 (blocks). Item 3 says "the closed row is a real button with `aria-expanded`". spec.md:53 says never a raw `<button>`. No primitive fits:
  - `RowButton` is a whole-row button with no `expanded` prop.
  - `FoldLine` has `aria-expanded` but needs `controls`, is `inline-flex` with `align-self: flex-start`, and has no ellipsis.
  - `ToolButton` has `expanded` but is no row.
  - `Disclosure`: see Premises.
  - Fix: name a change to `ui/controls/RowButton.svelte` (an `expanded` prop) and add it to the path list.
- Case 7 asserts a constant shape. spec.md:67 says an assertion over a constant proves nothing and is not written. It also has no entry.
- Case 6 against item 4. "`mcp__x` draws whole" conflicts with the rule text "the part after the last `__` of an `mcp__` name", which gives `x`. Item 4 should say "of a name with a second `__`".
- Case 3 against item 7. "a count word for one and for many": a run of one has "no count", so the `_one` key has no reader and fails `keys.test.ts:705`.
- The new test "beside the state tests". The grouping file is under `views/`, and `tests/views/sessions/terminal/` exists.
- The `DocState` function of item 1 and the name function of item 4 have no place on the path list: "one new file for the grouping".
  - A function in the `.svelte` cannot be imported by a test.
  - `DocState` is already written out in three places (`docs.svelte.ts` `PENDING`, `NOTHING`, `RenderedMarkdown.svelte:136`). A fourth literal breaks spec.md:89. `NOTHING` is not exported.
- Item 3 against the decisions.
  - "stays closed unless pressed, except ... at first draw" limits opening to first draw. The decision says "a failure is never hidden behind a press". See I4.
  - The `flex: none` must sit on a wrapper in the view: `.row :global(.tag)` fails `findPrimitiveStyling` (`tests/checks/tree/boundaries.test.ts`).
- Item 2 says "its words in `--ink`". The tree uses `var(--ink-txt, var(--ink))`, and `tests/checks/look/contrast.test.ts:4` measures `-txt` pairs on the chip, so `--ink` on `--chip` is unmeasured. It should read `--ink-txt`.
- Item 5 says "Clocks are `--fs-xs`". The tokens.css type-scale comment (around line 161) says "secondary words (a detail, a date, a caption ...) `--fs-sm`, a label, a badge ... `--fs-xs`". It departs from the stated scale, and the brief does not say why.
- Report line 89 says "in `agents/spec.md`'s shape: first the cases' first run". spec.md:84 says "First line: anything NOT done". The two orders differ; O114's brief uses the spec's order.
- Item 7 and spec.md:26. `npm run diagrams` runs before each list run, and `docs/diagrams/layer-views.dot` holds no TranscriptBody or Markdown line (grep printed nothing). Any change there is outside the path list; the brief's "at landing" should say so.
- `.scratch/.../O115-report.md` on the path list against spec.md:36 "never edit under `.scratch/`" is the standing form (`O114.md:127`). Not raised.

## The question

Could each pass without the goal, a transcript that is easy to read?

| Item or case | Answer | Reason |
|---|---|---|
| Item 1 | No | A table with borders and code with Copy are the reported defect, and it is cured only by drawing through Markdown. |
| Item 2 | Yes, in part | The head rule is open across a tool run (I6), and it has no case. |
| Item 3 | No | It takes 490px to one row. A wrong default state is caught by case 10. |
| Item 4 | Yes for Codex | Rows stay empty (I1). No for Claude. |
| Item 5 | Yes | No case covers it. Measure, line height and padding can all be absent with cases 1 to 15 passing. Add a case at 548px and at a wide pane. |
| Item 6 | Caught only at case 13 | See N1. |
| Item 7 | No | The keys check and HELP cover it, but HELP is judged by reading. |
| Case 1 | Yes | Claude only. |
| Cases 2 to 7 | Yes | Each is a unit of a function, and none shows a reader anything. They are parts of the goal. |
| Case 8 | No | |
| Case 9 | No | |
| Case 10 | No, except in one way | A failed call in a later read is not covered (I4). |
| Case 11 | No | |
| Case 12 | Yes, in part | "Told apart" is covered; prose readable over a picture is not asked. |
| Case 13 | No | It fails today's formula. |
| Case 14 | Yes | A result that patches a turn with no new turn is not exercised (I5). |
| Case 15 | Yes | It measures at most 200 turns on an open, and no live append (I7). |

## Implied inputs

Counts below come from the two programs, over the 40 newest local Codex and Claude transcripts and 30 subagent files.

- I1. Codex transcripts (146 files exist). These are real and common.
  - `codexOk` reads only `exit_code` (`turns.ts:297`).
  - Of 4,601 tool items, 1,035 have no exit code: FileChange 469, McpToolCall 246, Extension 100, ImageView 99, SubAgentActivity 52, CollabAgentToolCall 36, ContextCompaction 33.
  - All 1,035 are `ok: null`, so a closed Codex run says `running` for good.
  - Their `status` says completed (468, 208, 36) or failed (FileChange 1, McpToolCall 38). So a failed MCP call reads `running` and opens nothing, which breaks the brief's "a failure is never hidden".
  - Summaries: Extension `web.search` carries `query` (92), McpToolCall carries `server`, `tool`, `arguments`. `codexSummary` reads none of them, so a Codex web search draws an empty summary, against the step line.
  - Expected: `ok` follows `status` where there is no exit code; a summary from `query` and from server plus tool. Code ids are empty, so `merged` never patches them. `turns.ts` is on the path list, and no case states this.
- I2. Target change, against item 3's "goes with the component, like the scroll stick". The component outlives its target: `Terminal.svelte:375-381` has no `{#key}`, and `tab-session.svelte.ts` derives `target` from the shown terminal. An open run at index 5 of session A would open index 5 of session B. `shown` compares `id` only, so an agent change is missed as well. Expected: run state is dropped when session or agent changes.
- I3. A tool turn before the first user turn is routine, not an edge. 14 of 40 Claude transcripts exceed 200 turns, so the first read starts wherever `slice(-200)` cuts, usually in a run. Expected: the list opens with a run or an answer, with no error and no line above the first turn.
- I3b. Subagent tab. 0 of 30 subagent files hold a human-origin user record (origins None 828, entrypoint `cli` 835), so `saidByHuman` (`fold.ts:250`) gives no person's turn. The whole tab is one exchange with no opener and no prompt box. Expected: heads, runs and head merging all work with no user turn.
- I4. Result in a later read. `merged` (`transcript.svelte.ts`) copies the turn, keeping others by identity. A call going `null` to `false` after first draw is not "at first draw", so by item 3's text it stays closed, which contradicts Decision 1. Expected: open unless the reader pressed that run. The state therefore needs three values (default, opened, closed). A reader who closes a failed run keeps it closed, and its row says failed.
- I5. The same patch and the foot. The stick effect reads `turns.length` only (`TranscriptBody.svelte:86`), so a run that opens from a patch with no new turn pushes the foot out of view. Expected: a reader at the foot stays at it.
- I6. Head repeat. "Consecutive turns of the same speaker" is undefined across a tool run. In Claude transcripts an agent turn follows a tool run 18,338 times and directly follows an agent turn 456 times, so the rule's reading changes it by a factor of 40. Expected result to state: whether `assistant, tool, assistant` in one minute repeats the head.
  - Also unstated: `clock` returns the empty text for a null stamp, so two unstamped turns compare equal, and two turns in the same HH:MM on different days compare equal.
- I7. Live append over a long list. `Markdown.svelte:207-213` reads `doc`, and its `{@html}` calls `sanitise(doc.html, slots)`. If the grouped rows or `DocState` are built anew per read, every assistant turn may re-sanitise and remount its Copy controls per sessions message. This is by reading, and I ran nothing. `merged` keeps turn identity, so the brief can require that an older turn's `DocState` stays the same object. Expected: an append touches only the last row.
- I8. Empty-summary tool. Expected: name alone, no empty title, the run's words unchanged. A tool with an empty name (`name` catches to the empty text) has no stated row.
- I9. MCP names. Two servers sharing a tool name, and `mcp__a__` with a trailing `__`, are unstated. Expected: names counted by whole name, a trailing `__` draws whole.
- I10. Press on a run of one. Item 3 gives it no count, but what the disclosure opens is unstated, and an open row adds only a clock.
- I11. Person's words. Item 5 sizes prose "through `Markdown.svelte`", and `.said` does not pass through it. Left as it is, `.said` is `--fs-sm` beside `--fs-md` answers. Expected size to state.
- I12. Headings. Markdown draws `#` and `##` at `--fs-3xl` and `--fs-2xl` where the copy held `--fs-md`. 787 of 22,570 assistant texts have one. This is a visible change the brief does not name.
- I13. Markdown under no STATE_KEY. No finding. `Markdown.svelte:81` tolerates it, TranscriptBody's own `useState` needs the context anyway, and no test renders TranscriptBody.
- I14. Links (`jump`). `data-instance` is on `.terminal`, so a fragment press finds a box. Headings carry no ids (`turns.ts` uses `new Marked(codeColour)`, no `heads`), so a fragment press does nothing and keeps the address, which is correct; 0 fragment links in 22,570 texts. A link with a scheme gets `target=_blank` (`ui/html.ts`). A relative link goes to the browser with `follow` off, as it does today: 11 of 22,570 texts. The brief should state whether that press leaves the page or is held by `onlink`.
- I15. Right-click.
  - No enclosing menu exists: `PaneBody.svelte:337` is only for an empty pane.
  - New: with no selection and no image, `ContextMenu.pointed` calls `preventDefault`, so the native menu goes on answers and stays on `.said` and tool rows.
  - A selection anchored in another turn gives no Copy on a right-click here, since `Markdown.svelte:92` requires the anchor inside this box.
  - The list renders through a Portal on the body, so `zoom` does not shift it.
  - Expected result to state, and to name in HELP.
- I16. Guarded entries.
  - G86 (`transcript.svelte.ts`) and G147 (`terminal-tabs.ts`, `terminal-lists.ts`): the step changes neither file, provided `followTab` and `showing` stay in the component.
  - G84 (`transcript-routes.ts`) is unchanged; its fixture uses `description` only, so no row changes.
  - G40 names `turns.ts`, so its test file runs (spec.md:60); it is on the path list.
  - G5 still holds: `html-sites.test.ts` accepts `sanitise(`, and no list names TranscriptBody.

## ADRs

`ls docs/adr` prints "No such file or directory". None apply.

## Dictated text

- `17 tools: WebSearch 15, Write, Bash` and `3 tools: WebSearch 2, Write`: hold, provided the word and the separators are catalog text with placeholders (spec.md:51). A `: ` or `, ` literal in code would break it.
- Words `error`, `running`, and `You`, `Agent` via the catalog: hold.
- No other displayed text is dictated. HELP's wording is left to the builder.
- `LC_ALL=C grep -n '[^ -~]'` over the brief prints nothing.

## Timeline, export and summaryShape's new fields

- Timeline does not read `turns.ts`. `grep -rn "stores/turns" src tests` gives only `transcript-routes.ts:17`, `tests/server/sessions/transcripts.test.ts:23`, and a string in `cache.ts`. `TimelineTurns.svelte` reads `timelineTurns` from `state/sessions/folds`.
- The export does read it. `transcript-routes.ts:155-156` passes `turn.tool.name` and `turn.tool.summary` to `server.export.tool: '{0}: {1} ({2})'`.
  - The new fields change its output: a WebSearch line gains its query where the summary was empty. This is an improvement, but the brief states only that the full name stays. It should state this change.
- The only other consumer is the route's JSON to `TranscriptBody`.
- `cache.ts:33` lists `stores/turns.ts` in `READER_FILES`, so `readerDigest` changes and the first scan after landing folds every session again once. No output changes. The landing report should expect it.

## Declined to judge

- The 8790 measurements of lines 12, 13, 14 and 15 (computed styles, the 112, 50, 38 mix, drawn cells, the 14px tag, 29px rows, 490 of 548px).
- The tool counts of line 16 (205, 419, 1175, 2033, 1017, 455, 22).
- What zoom does to `scrollTop` and `clientHeight` on `.chat` in Chromium, since no page was run.
- How Svelte updates a keyed each item in I7, since it was read and not run.
- Whether the look at the end reads well, which is the look's.
## Closed

- N1: item 6 now draws the turns at the grid's size: `zoom` on an inner box at grid size over `--fs-md`, so the buttons work and the scroller is not zoomed.
- C1: no new test and no new guarded entry; the cases are read or looked at, since a transcript's look costs no lost work. `tests/server/sessions/transcripts.test.ts` runs under G40 unchanged.
- C2: `RowButton.svelte` gains `expanded`, on the path list.
- Case 6 and item 4: the rule names a name with a second `__`, a trailing `__` drawing whole.
- Case 3 and item 7: one catalog line for a run, no `_one` key; `turn_tool` keeps a reader as the word for an unnamed tool.
- Function places: `turn-rows.ts` holds grouping, names and heads; `docOfHtml` in `docs.svelte.ts`, used by `RenderedMarkdown.svelte` too.
- Item 2 `--ink-txt`; `flex: none` on a wrapper of the view; clocks at `--fs-sm`.
- Report order follows `spec.md:84`.
- Words made false: `TerminalFontTools.svelte`, `config/options/appearance.yml`, `config/defaults/appearance.yml`, `Markdown.svelte` head comments added to the path list.
- Line 23 corrected to the 200-turn first read; `themes.css:53` citation corrected; `Disclosure` premise dropped; case 15 rewritten.
- I1: a completed Codex item is ok unless a status or exit code says failed; summaries read `query` and server plus tool.
- I2: the run state clears when session or agent changes. I3, I3b: stated. I4: three states, a failed run opens unless the reader chose. I5: the foot effect reads `turns`. I6: head rule by the minute of the stamp, tool runs not counted. I7: `docOf` memo over the turn object. I8 to I10: stated. I11: person's words at `--fs-md`. I12: answer headings at `--fs-lg`. I14: `onlink` holds a relative link. I15: the prose menu on answers, stated in the brief's decisions.
- The export's change and the one re-fold after landing are stated in the brief.

## Usage

Agent a1e4264a211c12492, claude-opus-5-5, 241923 tokens, 22 tool uses, 10 min 27 s.
