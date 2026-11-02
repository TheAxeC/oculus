# Refuter report of O115

O115 review, base a1517558b, worktree /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O115. Nothing changed in the worktree; `git status --short` shows 19 lines before and after.

VERIFICATION LINES

`npx vitest run tests/server/sessions/transcripts.test.ts`:
 Test Files  1 passed (1)
      Tests  15 passed (15)

`npm run test:quick`:
ok      prettier (1.2 s): All matched files use Prettier code style!
ok      ASCII gate (1.3 s)
ok      svelte-kit sync (2.8 s)
ok      eslint (3.0 s)
ok      svelte-check (11.9 s): 1793614768283 COMPLETED 579 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (36.4 s): Duration  22.94s (transform 42.58s, setup 0ms, import 70.62s, tests 3.05s, environment 406ms)
ok      vitest slow (39.4 s): Duration  25.85s (transform 14.95s, setup 0ms, import 20.23s, tests 7.13s, environment 1ms)
ok      vitest checks (55.2 s): Duration  41.65s (transform 15.60s, setup 0ms, import 32.20s, tests 90.01s, environment 3ms)
test:quick: 58.2 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth, other than the checks under tests/checks/source and tests/checks/tree, which run for any change under src, tests or utils; the build, the lint of unchanged files

Commands the report quotes, run in the same form:
- `npx vitest run tests/checks/source/html-sites.test.ts`: `Test Files  1 passed (1)`, `Tests  19 passed (19)`. Same as the report.
- `grep -rn "turn_ok" src tests config docs --exclude=local.yml`: prints nothing, rc 1. Same.
- `grep -rn "turn_ok\|summaryShape\|codexOk" src tests config docs README.md --exclude=local.yml`: hits only in `turns.ts` (lines 62, 109, 282, 329). Same.
- The reuse grep: the only hit outside the step is `RecoverProgress.svelte:38`, a local `runWords`. Same.
- `sh utils/unused-exports.sh | grep -c "turn-rows\|gridFontZoom\|docOfHtml"`: 0. Same. Lines naming changed files: `turns.ts: TURN_CHARS`, and `terminal-list.ts: BELL_MS, pasteLines, MENU_UNSPLIT, killItem, colorLabel, joinedOf`. No name of the step is among them.
- `LC_ALL=C grep -n '[^ -~]'` over the touched files: only the accented theme names in `config/defaults/appearance.yml`, lines the step does not touch. Same.
- Line counts: `wc -l` gives 513, 136, 746, 40, 411, 195, 64, 416, 336. All equal the report's table.
- Reported locations read: `TranscriptBody.svelte:220, 323, 334, 343, 406, 436`, `Terminal.svelte:463`, `Pane.svelte:238`, `transcript-routes.ts:155-156`. All as reported.
- Comment-word grep over the added lines: four hits, the same four the report lists, each an order at run time.
- Case-run programs rebuilt from the report's source in the session scratchpad, run on the changed tree, and deleted afterwards. Every row of the report's results table reproduces. Printed lines include:
  case 1 {"query":"x"} => "x"
  case 1 {"url":"http://a"} => "http://a"
  case 1 {"skill":"spec","args":"y"} => "spec"
  case 1 {"file_path":"a","query":"b"} => "a"
  case 1 {} => ""
  case 8 {"type":"FileChange","status":"completed","changes":{"a.ts":{}}} => {"id":"","name":"FileChange","summary":"a.ts","ok":true}
  case 8 {"type":"McpToolCall","status":"failed","server":"s","tool":"t"} => {"id":"","name":"McpToolCall","summary":"s.t","ok":false}
  case 8 {"type":"Extension","query":"q"} => {"id":"","name":"Extension","summary":"q","ok":true}
  case 2 mixed  [ 'user@0', 'run@1x2', 'assistant@3', 'run@4x1' ]
  case 3 words  3 tools: WebSearch 2, Write
  case 4 first  1 1 calls 2 3
  case 5 not chosen, failed       true
  case 5 closed by press, failed  false says failed true
  case 6 "mcp__a__" => "mcp__a__" "mcp__a__"
  case 7 10:00, tool, 10:00       1
  case 7 same minute, two days    2
  doc held per turn object true between components false

Extra checks of mine:
- `npx vitest run tests/checks/source/html-sites.test.ts tests/checks/look/contrast.test.ts`: `Tests  75 passed (75)`.
- `grep -rn '{@html' src/lib --include='*.svelte' | wc -l`: 32.
- Status count over 146 local Codex rollouts, lines with `item_completed`: `8385 "status":"completed"`, `827 "status":"failed"`, no other value.
- A case-run style program over the themes with `derive.ts` `ratio`: `themes 49 below 3:1 on any surface 9`. Lowest line, columns --bg --panel --chip: `vscode-monokai-dimmed 2.22 2.48 1.16`.

VERDICTS, WHAT TO BUILD

1. One document rule set: holds; `docOf` built as `turnDocs()`, see S1.
2. Who said what: holds; the `--accent` bar is built as the brief says and is weak in some themes, see B2.
3. A run of tool calls is one line: holds; see B3, B4 and B5 for edges.
4. Every call says what it was about: holds.
5. Readable: holds; see B6 (a) for the steer box.
6. The font buttons work here: violated in one state only (a theme drawn from a fetched app-theme file), see B1. Holds for the buttons, the reset and a class theme.
7. Words and docs: holds. The brief's expectation of no diagram change was wrong, see S2.

VERDICTS, CASES

1. Summary: met.
2. Grouping: met.
3. Run words: met.
4. Appended turn keeps first index: met; the printed first index is 1 and 1.
5. Failure: met. The state-map half is by reading `pressRun` and `runOpen`.
6. Names: met.
7. Heads: met.
8. Codex: met.
9. Change of target: met by reading (`TranscriptBody.svelte:101-105`). Not run; it needs a component and a flush.
10 to 18: not verifiable here. The look settles each: 10 table, 11 code block with Copy, 12 17 calls, 13 long summary with `error`, 14 kinds told apart in dark, light and wallpaper at 548px and wide, 15 A and reset, 16 foot, 17 200 turns and the marker, 18 subagent tab and Codex session.

FINDINGS

Spec

S1, low. Substitute mechanism for `docOf`.
Place: `turn-rows.ts:129-136`, `TranscriptBody.svelte:91`.
  export function turnDocs(): (turn: Turn) => DocState {
      const held = new WeakMap<Turn, DocState>();
Wrong: item 1 says `docOf(turn)` in `turn-rows.ts`; a per-component factory was built. `spec.md:88` forbids the module-level map, so the outcome is right, but `spec.md:7` says stop and report rather than pick a side. It is reported as decision 1.
Failure scenario: none in output. Two tabs on one session hold two `DocState`s for one turn (`between components false`), and each reads only its own.

S2, low. Paths outside the write list: `tests/checks/source/html-sites.test.ts` (see P1) and `docs/diagrams/layers.dot`, `layers.svg`, `layer-views.dot`, `layer-views.svg`.
  -    "views to state" [label="1527", ...
  +    "views to state" [label="1530", ...
Wrong: the brief expected no diagram change. Both `.dot` diffs are edge counts only; the `.svg` hunks were not read. Both are named in the report and needed; `spec.md:26` has `npm run diagrams` run before each list.
Failure scenario: none.

S3, low. Case-run programs (`lib-hook.mjs`, `server-cases.ts`, `row-cases.ts`).
Judgment: allowed. Brief line 110 says no script, but `spec.md:66` admits a program that only prints each case's result, keeps its files in the scratchpad, and has its source and output quoted, and `spec.md:3` says a brief does not override spec.md. They print only, their two fixture files were scratchpad files, and their source is quoted. The "Unapproved builder scripts" handling does not apply.
Short of `spec.md:66` in one point: the run on the changed tree is given as a paraphrased table, with only the first run's output verbatim.
  | 5 | not chosen and failed: open; not chosen, none failed: closed; ...
Failure scenario: a reader cannot compare lines without running again. My rerun matched every row.

S4, low. A change no item asks for.
Place: `TranscriptBody.svelte:472-474`.
  .run:hover .words {
      color: var(--ink-txt, var(--ink));
  }
Disclosed as decision 6. Failure scenario: none.

No dependency added: `package.json` is not in the status.

Premises: the report's two findings reproduce. Four diagram files changed. `Terminal.svelte:463` plus the old `.frame` padding gave 10px and 12px, equal to `Pane.svelte:238`.

Proof

P1, judged acceptable. Threshold lowered.
Place: `tests/checks/source/html-sites.test.ts:242`.
  -        expect(counted.length).toBeGreaterThanOrEqual(33);
  +        expect(counted.length).toBeGreaterThanOrEqual(32);
Judgment: this is a floor against a vacuous count, not the safety predicate. `unfilteredSites(LIB)` equal to `[]` is untouched. The floor now equals the count (grep prints 32), lowered by exactly the one `{@html}` that item 1 deletes. Under `spec.md:62` it is a loosened threshold, and the report lists it with before and after as required. Item 1 cannot land with 33. The brief should have listed the file.
Failure scenario: none. A counter that lost one site still fails at 31.

P2, low. A named risk left "not read", which one read settles.
Report: "whether it measures this pair was not read".
Result: it does measure it. `contrast.test.ts:49` lists `--chip`, the `-txt` loop measures every `-txt` token on those surfaces, `derive.ts:267` mints `--accent-txt`, and my run passed. `spec.md:17` asks a named risk to be closed.
Likewise "Real rollouts were not read": my count shows only `completed` and `failed`, so the exact compare in `codexOk` is safe on 146 local rollouts.
Failure scenario: none left.

File-scope mutable: none; `turn-rows.ts` holds consts, and `chosen` and `chosenFor` are per instance. No test added, no threshold other than P1 changed, nothing exempted.

Standards

T1, low. Two lines over 100 columns.
Place: `TranscriptBody.svelte:269` (171 columns) and `:295` (163 columns).
  <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
Disclosed as decision 13, and `Terminal.svelte:393` carries the same comment. The file is at 513 of 520, so a split is not free.
Failure scenario: none.

T2, low. Code larger than its job.
Place: `TranscriptBody.svelte:96-105`.
  const target = JSON.stringify([session, agent]);
  if (target !== chosenFor) chosen.clear();
  chosenFor = target;
By reading, the effect depends only on `session` and `agent`, so it re-runs only when one changed and the compare is always true after mount. Reads of the two props and `chosen.clear()` do the job.
Failure scenario: none.

T3, low. `spec.md:73` report statement missing.
The report does not state what the code does for the key it introduces or for its asynchronous paths.
By reading: `row.first` is a unique integer; the frame is cancelled in the effect's cleanup; a read out for an old target lands under its own query key.
Failure scenario: none.

No false sentence found. Greps of each changed name across src, tests, config, docs and README.md found no stale sentence, apart from the one in B3 (`turn-rows.ts:6-7`). No non-ASCII in `turn-rows.ts`. No file over the size limit. `transcript/` holds three items. No history in comments; all four word hits are run-time order. No test of costless behaviour added.

Behaviour

B1, medium (item 6, violated in this state). Zoom stale after a theme drawn from a fetch.
Place: `TranscriptBody.svelte:117-126`.
  const frame = requestAnimationFrame(() => {
      zoom = fontZoom();
  });
Wrong: `drawTheme` awaits `loadAppTheme` (`app-theme.ts`) for an app theme with no carried file, so `body.rice` can change later than one frame, and nothing reads `--fs-md` afterwards.
Failure scenario: at default `font_px` 12.5, going from a rice theme (`--fs-md` 12) to such an app theme (13) keeps zoom 12.5/12, so prose draws at about 13.5px and the grid at 12.5. The reverse draws about 11.5px. Both last until the next theme, font or text-scale change.
The report lists this under limitations as not measured, and `spec.md:17` asks a named risk to be fixed or stated prominently. The race length was not measured. Fixing it needs a read after the draw lands.

B2, medium. The person's bar is weak.
Place: `TranscriptBody.svelte:365`.
  border-left: 3px solid var(--accent);
Built as item 2 says. No test measures `--accent`.
Computed: 9 of 49 themes fall below 3:1 on `--bg`, `--panel` or `--chip`; `vscode-monokai-dimmed` is 1.16 on `--chip`, `vscode-solarized-light` 2.31 on `--bg` and `--chip`, `rosepinedawn` 2.37 on `--chip`.
Failure scenario: under `vscode-monokai-dimmed` the bar nearly vanishes against the person's own chip, so the mark that tells a person's turn from the rest is lost. Over a wallpaper the ratio depends on the picture and nothing guards it.
`Markdown.svelte:391` draws the same kind of bar with `--accent-txt`, which `contrast.test.ts` holds at 4.5:1. The look settles it in those themes and under a wallpaper.

B3, low. `chosen` by index is not cleared when a first read's window moves.
Place: `TranscriptBody.svelte:94` and `:250`, `turn-rows.ts:6-7`.
  // A run is keyed by the index of its first turn. The turns of a tab only grow at the foot and are
  // patched in place, so that index holds while a run grows and a choice made on it holds with it.
For appends the each key `row.first` is stable: no earlier row's first changes and no key repeats.
A window moves only on a read from 0. On a kept target that needs `forget`, which runs when `sessionId` goes empty and the `showing` cleanup drops the last viewer.
Failure scenario: the session's record leaves the sessions list and returns while the `session` prop stays. The new first read is the last 200 of a longer file, the indexes now mean other turns, and `chosen` is kept, so a press on one run lands on another: a failed run sits closed, or a clean one open.
The keyed items are reused with the new `row` and `docOf` hands a new document, so nothing else breaks. Removing `key()` costs no stability for appends. Base's key changed with the stamp and rebuilt the row on such a move.
Whether a record vanishes and returns in practice was not verified.

B4, low. `stuck` is not re-read after a press or a zoom.
Place: `TranscriptBody.svelte:173-175`, `:188-191`.
  function scrolled(): void {
      if (column !== undefined) stuck = atFoot(column);
  }
Failure scenario: in a live session the reader at the foot presses the last run. 17 rows open below the fold, no scroll event fires, `stuck` stays true, and the next append calls `toFoot`, carrying the reader past the rows just opened. "A press moves nothing" holds at the press only. Likewise A at the foot grows the column and the foot is lost until the next append. The report's before and after does not say this.

B5, low. Outcome placement.
Place: `TranscriptBody.svelte:503-507`.
  .outcome {
      display: inline-flex;
      flex: none;
      margin-left: auto;
  }
Failure scenario 1: a closed run holding a failed and a running call, on a wide pane. Both tags take an auto margin, so the free space splits and `error` stands mid-row while the comment says at the row's right.
Failure scenario 2: a call's row on a 1400px pane. Rows are not capped at 80ch, so `error` stands the width of the pane away from its name. The report does not state this.

B6, low. User-visible changes the report does not state.
(a) The steer box narrows by 8px, since it sits inside `.frame` and that padding went from 6px to 10px each side.
(b) A Codex tool line in the Markdown export with no exit code changes from the running word to the ok word, since `transcript-routes.ts:146-151` reads `ok`. The report's item 4 row names summaries only.
(c) A right-click on an answer with no selection and no image opens nothing and the browser menu is gone (`ContextMenu.svelte` `pointed`). The report's row says only "prose menu".
(d) A `#fragment` link in an answer now goes through `jump.ts`, which picks the first element with that id in the whole view, so two answers with one heading id jump to the older one.

The points you listed, by reading:
- Zoom and 80ch: font and `ch` scale together, so a line holds the same characters at any zoom. The pixel width is the look's.
- `.head` min-height: `--tree-row` is a plain 22px (`tokens.css:212`), so text scale cancels against the zoom and the height follows the chosen size with no double scaling.
- Run row in RowButton: column flex, `min-width: 0` down the chain, `font: inherit` carries size and line height, `.line` overrides the ink, so `.words` cuts.
- Failing run closed: a press on an auto-open run writes `closed` and the row draws `error`; case 5.
- `$effect` and `zoom`: no loop. The effect reads `theme`, `terminalFont` and `textScale`, never `zoom`, and the frame's write is untracked.
- `theme()` exists in the `ui` store and is read only as a dependency.
- Default sizes (prose 12.5, tool rows about 11.5) and text scale no longer moving the transcript are stated in the report.

DECLINED TO JUDGE

- Cases 10 to 18: a page is needed; the look settles them, including the timing and marker of 17.
- `git diff -U0 docs/diagrams/layers.dot`, `git diff --stat` and the report's other git commands: not in my allowed set, so not run. `git diff a1517558b` shows the same edges.
- First run on the unchanged tree: no base copy, so not rerun. The base `summaryShape` and `codexOk` were read via the diff and agree with it.
- `npm run diagrams`: it writes files, so whether the committed diagrams match the source was not run, and the `.svg` hunks were not read.
- `.scratch/migration/agents/reviews/O115-report.md` exists in both the worktree and the main checkout and `cmp` says same; how that goes through landing was not judged.
- Whether every edit went through Edit and Write, and the count of 2 full-list runs: no transcript available.
- Time from `theme` change to `applyTheme` in B1, and whether B3's record loss happens in practice.
- Chromium's exact resolution of `ch` under `zoom`.
- `npm run test:quick` was run in the form your prompt names; the state file's `-- --base <base>` for reviewers was not used.
- The status count covers local rollouts only.

Usage: agent af9f74e71204fd6e5, claude-opus-5-5; 244101 tokens, 32 tool uses, 13 min 5 s.
