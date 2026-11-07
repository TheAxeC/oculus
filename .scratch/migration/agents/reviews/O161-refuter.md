# Step O161 refuter report (on .agents/worktrees/migration-O161, base 75bf4dd10)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
# Verify 1, npm run test:quick: not run (it runs at landing).

# Verify 2, the scoped tests: the builder's list (O161-scoped-files2.txt, 32 files) plus size.test.ts.
# My own list, from grep over tests/ for test files that name a changed or new src file
# (tests/checks and fixtures left out), gave 29 test files. All 29 are in the builder's 32.
$ npx vitest run tests/checks/tree/size.test.ts $(cat .../O161-scoped-files2.txt) --reporter=dot --testTimeout 30000
 Test Files  33 passed (33)
      Tests  541 passed (541)

$ npx vitest run tests/state/forms/page-entry.test.ts --reporter=verbose   (lines kept)
 <check mark> |unit| tests/state/forms/page-entry.test.ts > pageOf > finds no page for a feed entry with no key, whatever identity the feed gives it 0ms
 <check mark> |unit| tests/state/forms/page-entry.test.ts > pageOf > finds the fields and the entries of a feed whose entries are replaced by a new list 0ms
 Test Files  1 passed (1)
      Tests  31 passed (31)

# Verify 3, the ASCII gate (the rules file's perl form) over the 42 changed and new files under src and tests:
ascii exit 0   (nothing printed)

# Verify 4, wc -l, the largest:
     879 src/lib/state/client/context.ts
     866 src/lib/state/sessions/source/source.svelte.ts
     804 src/lib/ui/html.ts
     455 src/lib/views/shared/card/feed/LeadCard.svelte
     444 src/lib/ui/menu/Tooltip.svelte

# Verify 5, sh utils/unused-exports.sh compared with .agents/worktrees/O161-base/unused-exports.txt:
exit 0
diff exit 0   (no line added)

# Verify 6, the history-word grep over added comment lines and test titles: 13 hits. All are
# "before" in the running sense ("before the part is built", "the same element before and after",
# "before it is put into the page") or "no longer holds" of a running client (idents.ts, read-memo.ts).
# None compares with an earlier state of the code.

# Commands the report quotes as evidence:
$ npx vitest run tests/checks/tree/boundaries.test.ts --reporter=verbose
 <check mark> |unit| tests/checks/tree/boundaries.test.ts > layer boundaries > holds no process-wide state under src 642ms
 Test Files  1 passed (1)
      Tests  11 passed (11)
$ npx vitest run tests/checks/source tests/checks/tree tests/checks/imports --testTimeout 60000
 Test Files  12 passed (12)
      Tests  107 passed (107)
$ diff of each of the twelve redone files against .../scratchpad/O161-before-redo/<path>
same, for all twelve (cross-links.ts, radar.ts, source.svelte.ts, view-source.ts, html.ts, ContextMenu.svelte,
Menu.svelte, trigger/MenuOpener.svelte, Tooltip.svelte, PickMenu.svelte, RadarCard.svelte, CardActions.svelte)
$ find .../O161-before-redo -type f   -> 12 files
$ test -e src/lib/ui/menu/MenuOpener.svelte   -> old path absent
$ node anal/apptotal.mjs O161prof/litwatch.cpuprofile, compared with O161-apptotal-final.txt -> apptotal-same
  (first rows: 1697 ms pageOf, 1689 ms feedPage, 1458 ms feedIdents, 1426 ms uniqueIdents, 584 ms sanitiseSvg, 246 ms pageFault)
$ node anal/libcaller.mjs O161prof/litwatch.cpuprofile 'bits-ui|svelte-toolbelt'
   223 ms  /src/lib/ui/menu/Tooltip.svelte
   168 ms  /src/lib/ui/menu/ContextMenu.svelte
   165 ms  (none)
    78 ms  /src/lib/ui/menu/Menu.svelte
$ node anal/libcaller.mjs O161prof/litwatch.cpuprofile 'dompurify'
   612 ms  /src/lib/ui/html.ts
# My own read of the profile (node -e, read only), the nearest src frame above each layout read:
getClientRects          170 ms  measure /src/lib/ui/frame/toolbar/Toolbar.svelte:117
getBoundingClientRect    96 ms  spans /src/lib/ui/tabs/tab-scroll.svelte.ts:55
# The compiled threat paragraph of RadarCard (svelte/compiler, base against now): templates same: true
# The compiled templates of ContextMenu and Tooltip (base, then now):
ContextMenu  base: `<div><!></div>` and `<!> <!>`          now: `<div><!></div> <!>` and `<!><!>`
Tooltip      base: `<span><!> <span class="words" hidden=""> </span></span>` then `<!><!>`
             now:  `<span><!> <span class="words" hidden=""> </span></span><!>`
# provideHtmlMemo( is called in four places: routes/+page.svelte:81, find/+page.svelte:26,
# present/print/+page.svelte:49, present/show/+page.svelte:63.
# grep -rln "import Glyph from" src | wc -l  -> 72 (the report says 71)
```

Not rerun: the jsdom harness, the `git grep` and `git status --untracked-files=all` forms, and `npm run diagrams`. "Declined to judge" gives the reasons.

## Verdicts

Items of "What to build" in `O161-cases.md`. `O161-clash.md` replaces its decisions 1 and 3, and `O161-redo.md` governs the twelve files.

- 1 (profile first): holds. The mapping table reproduces: `apptotal.mjs` gives the same output, and `libcaller.mjs` gives the same bits-ui and DOMPurify split. My own attribution of `getClientRects` to `Toolbar.svelte:117` and of `getBoundingClientRect` to `tab-scroll.svelte.ts:55` matches the report's reason for keeping both. The split figures come from scripts that no ruling approves (Spec 2).
- 2 (a card's page found without the whole feed): holds by reading.
  - `idents.ts` `feedIndex` holds one index per entries array and kind, through `reads.held`.
  - `page-entry.ts:222` `feedEntryOf(kind, feed.entries, ident, reads)`.
  - `context.ts:180` hands `entities.reads` to `createPages`.
  - `peers` is listed on first read.
  - The `pageOf` cases pass, 31 of 31. No test reaches the memo path (Proof 1).
- 3 (the menu built when it is opened): holds by reading.
  - `ContextMenu.svelte` draws the Root only under `{#if menu.built || open}`.
  - The early handlers hand the first right-click, the menu key or Shift+F10, and a non-mouse press to bits-ui's merged handler after `flushSync`.
  - `early` skips an event whose default is already prevented. bits-ui's handlers do the same (`svelte-toolbelt` `composeHandlers` returns on `defaultPrevented`).
  - The trigger's `pointer-events: auto;` style is kept before the build.
  - The compiled template keeps one space after the wrapper, as the base does.
  - The only run of this item is the harness (Spec 1).
- 4 (markdown once per text): holds by reading.
  - The results with formulas and without them are kept in separate maps: `plain`, and `math` keyed by the modules, then the options, then `[refused, text]`.
  - The purifier's hooks are pure (`markLinks`, `dropOtherInputs`).
  - The slot marks are replaced before the result is returned, so a result is a function of its key.
  - `MEMO_HELD` bounds each map, the oldest inserted key going first.
  - `tests/ui/html.dom.test.ts` passed in the scoped run.
- 5 (the other per-card work): holds by reading.
  - Until the strip is first drawn, `CardActions.svelte` sets `over = line.children.length > 1`. That is the value `measure` set at rest while no width was known (`if (unknown || openerWidth === 0) { over = chips; return; }`).
  - The full watch starts on the frame after the first draw.
  - The layout reads that stay are attributed as above.
- 6 (nothing a reader sees or does changes): holds by reading for the text and the DOM structure (the compiled templates above). The rest is the look at landing.
- 7 (the words): holds. The head comments are read and rewritten where the behaviour changed. `git diff 75bf4dd10 --stat -- docs/HELP.md docs/data-map.md docs/decks.md` prints nothing.
- 8 (the time to show): holds for the builder's part: the estimate is given and marked as one. The measurement is the orchestrator's at landing.
- Clash ruling (memos per client): holds.
  - The added lines hold no module-level `let`, `Map`, `WeakMap` or `Set` (grep of the `+` lines of `git diff 75bf4dd10 -U0 -- src`).
  - `git diff 75bf4dd10 --stat -- tests/checks` prints nothing.
  - The boundaries case passes.
  - The report's list of Glyph callers misses one (Spec 3).
- Redo ruling: holds for the state of the files: the twelve equal their saved copies, and the old path is absent. The way they were remade is under "Declined to judge".

Cases:

- C1: met. The `pageOf` cases pass (31 passed), the no-key case among them. They reach `indexOf`, which builds the index that the memo path holds.
- C2: partial. The case exists and passes, before and after (`c1c2-before.txt`, my rerun). It never hands `pageOf` a memo, so it does not check the shared identities it is written to guard (Proof 1).
- C3: not verifiable here. By reading, neither the ContextMenu's nor the Tooltip's compiled template adds a text node. The look's count and `textContent` hash settles it.
- C4: not verifiable here. The look settles it.
- C5: not verifiable here. The harness is not rerun (Spec 1), and no run of it covers Shift+F10 or Escape. The look settles it.
- C6: not verifiable here. The look settles it.
- C7: not verifiable here. By reading, a write's new array gives a new index, and `feedEntryOf` returns an element of that array. The look settles it.
- C8: not verifiable here. By reading, a new message from the socket is a fresh `JSON.parse` (`socket.svelte.ts` `handle`), so its arrays are new and are indexed afresh. The look settles it.
- C9: not verifiable here. The look settles it.

## 1. Spec

1. The jsdom harness ran in the worktree and is not a case-run program under the rules.
   - Place: the report, "User-visible changes and what the look compares" and "Judgment calls".
   - Quoted: "its three final files were placed in `tests/ui/menu/` again with Write, run with `npx vitest run --config tests/ui/menu/scratch.config.ts ...`, and removed with `rm`"; and "Scratch harness files under `tests/ui/menu/` were made by heredoc, redirect and `sed -i`, and later by Write".
   - What is wrong: the rules file's paragraph on case-run programs (section "What every package obeys") allows one whose files live "in the scratchpad or the base copy" and whose "source and its output [are] quoted in the report, so the reviewer can run it again". It also counts `sed -i` and a shell redirect that changes a file as a script that needs approval. The harness files (`scratch.config.ts`, `scratch-*.dom.test.ts`, `Scratch*.svelte`) import `../../../src/...` and run only from inside the worktree's `tests/`. Their source is not quoted in the report. No line of `plan.md`'s Rulings approves a script for O161 (`grep -n O161 plan.md` shows only rulings 700, 705, 712 and 713).
   - Not a finding: `rm -r node_modules/.cache/eslint` deleted an untracked cache, not a file of the step.
   - Failure scenario: the harness is the only run behind item 3 ("the harness below matches the unchanged tree") and behind the first-event hand-over of the tooltip. No reviewer can repeat it without writing into the worktree. Under the skill's dispositions, nothing it produced is used until Axel rules.
   - Verdict: none. Item 3 holds by reading. C5 is not verifiable.
2. The profile analysis scripts were written for the step without approval.
   - Place: `.../scratchpad/anal/*.mjs`: nine files, `app.mjs` to `runs.mjs`, dated Nov 6 22:08 to 22:34, after `O161-cases.md` (21:54).
   - What is wrong: they are not case-run programs, since they run no case of the brief. They read `litwatch.cpuprofile` and print sums. The rules file says "Any other script needs the approval the brief names", and no ruling approves them.
   - Failure scenario: item 1's table, the bits-ui split (223 and 168 ms), and the corrections in "Errors in the brief" (DOMPurify's time is in `sanitiseSvg`, not `inlineMarkdown`) rest on these scripts. Under the skill, the finding goes to Axel and their output is not used until he rules. My reruns gave the same output, and my own read of the layout reads agrees.
   - Verdict: none.
3. The report's list of Glyph callers misses one.
   - Place: the report, "Where each memo comes from".
   - Quoted: "The 71 components that import Glyph (`git grep -l "import Glyph from" -- src | wc -l` prints 71) are, under `src/lib/`: ...".
   - What is wrong: the clash ruling asks for every `Glyph` caller to be named with where its memo comes from. `git grep` does not list untracked files, so `src/lib/ui/menu/trigger/MenuOpener.svelte` is missing. `grep -rln "import Glyph from" src | wc -l` prints 72. Its memo comes from the route root like every other caller, so the code is unaffected.
   - Failure scenario: a reader who checks the memo sources against the report's list misses one caller.
   - Verdict: none. The fix is to the report, at landing.

## 2. Proof

1. C2 does not reach the memo it is written to guard.
   - Place: `tests/state/forms/page-entry.test.ts:323-347`.
   - Quoted: "const found = createPages(\n{ snapshot: () => snapshot(CAREER), feeds: () => feeds },\ncreateSettled(() => 0)\n);".
   - What is wrong: the case passes no `reads`. So `feedPage` calls `feedEntryOf(..., reads)` with `reads` undefined, and `feedIndex` returns `indexOf(kind, entries)` built afresh on every call. The memo path, `reads.held(entries, 'feed index <kind>', ...)` (`idents.ts`), is never run. No other test passes a memo either (`grep -rln "createReadMemo\|feedEntryOf\|feedIdCount" tests` prints nothing). In the app, the pages store always gets the memo (`context.ts:180`, `entities.svelte.ts:79`). The cases ruling calls C2 "the case that guards the shared identities of item 2 against a stale list". As written, it would still pass if the memo kept the first list's index forever. The fix is to give the case's sources `reads: createReadMemo()`.
   - Failure scenario: a later change keys the index by the feed kind alone, or stops replacing it. A new feed message then leaves every card's page on the old entries. C2 stays green, because it takes the path without a memo.
   - Verdict: C2 partial.

## 3. Standards

1. The quick list ran an eighth time only because the seventh run's output was lost.
   - Place: the report, "Checks as printed".
   - Quoted: "Run 7, the first after the redo, ran with a `grep` filter on its output that failed (`grep: repetition-operator operand invalid`), so none of its result lines were printed. Run 8 is the run quoted above."
   - What is wrong: the rules file's "Token discipline" allows the list once after the last change, and once more after a red line in a changed file is fixed. It says "a run of the list beyond what this paragraph allows, is a finding of the review". Run 8 followed no change and no red line. The report does not say whether run 5 followed a change after run 4's red in `hub-portfolio.test.ts`, a file the step does not change, for which "the list is not run again".
   - Failure scenario: a 136.5 s full list ran again on a machine already loaded by other builders (`load averages: 18.73 ...` in the same report), for a result the seventh run had already produced.
   - Verdict: none.

## 4. Behaviour

None.

## Declined to judge

- `npm run test:quick` and every whole-suite command: they run at landing.
- The jsdom harness (`lazy-scratch/`, `lazy-scratch-final/`): its files must be placed in the worktree's `tests/ui/menu/` to run, so I did not run it (Spec 1).
- The commands the report quotes as `git grep ...` and `git status --short --untracked-files=all | grep -c .`: they are not among the three git commands a reviewer runs. I reproduced the caller lists with `grep -rn` and found the Glyph count difference of Spec 3.
- `npm run diagrams`: it writes `docs/diagrams/`. I did not check the eight changed diagram files against a regeneration. `git diff 75bf4dd10 --stat` shows only those eight files under `docs`.
- C3 to C9 and item 8's timing: they need the look on the scratch server. No run of mine or of the report covers Shift+F10, Escape returning the focus, a tooltip opened by keyboard focus, or a rest on a tree row's `over` element.
- A `flushSync` inside an effect.
  - What the code does: `lazyTrigger.build()` calls `flushSync()` (`lazy-trigger.svelte.ts:42`). It is reached from `Tooltip.svelte:191` (`focused`, on focusin with `:focus-visible`) as well as from event handlers.
  - Why it could matter: a `.focus()` called synchronously inside a Svelte effect that lands on a control inside a Tooltip never built would run `flushSync` inside the outer batch's flush. In svelte 5.57.1 `batch.js`, `flushSync` calls `current_batch.flush()`, whose `finally` clears `current_batch` and `is_processing`.
  - What I found: no caller that reaches this. `FindBar.svelte:60`, `RenameField.svelte:29` and `WorktreeName.svelte:30` focus fields that have no Tooltip, and `focusQuietly` focus returns early in `focused`.
  - What would settle it: a keyboard focus into a ToolButton issued from an effect, at the look.
- How the twelve files were remade under the redo ruling: they equal their saved copies byte for byte. Whether that was done hunk by hunk with Edit, as the report says, cannot be read from the tree. The builder's transcript settles it.
- `hub-portfolio.test.ts`'s timeout in run 4: the step does not change that file, so I did not rerun it.
- `.scratch/migration/agents/briefs/O161.md` (modified) and the three untracked rulings in the worktree: these are the orchestrator's copies. I did not judge them as builder work. Leaving them out of the cherry-pick is a landing matter.

Reviewer usage: a43610d99c434bb8e, claude-opus-5-5, 312868 tokens, 89 tool uses, 18.7 min.

## Repair round 1, refuted

Verification lines (the reviewer's runs, from the worktree root):

- `npm run test:quick -- --base 75bf4dd10`: `test:quick: 57 changed file(s), from git since 75bf4dd10`, `84 test file(s)`; prettier, ASCII gate, svelte-kit sync, eslint, svelte-check (`585 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`), vitest, vitest checks and vitest slow all `ok`; `test:quick: 100.9 s; every command passed`.
- Scoped tests (34 files that name a changed or new src file, two more than the builder's list, plus `size.test.ts`): `Test Files  35 passed (35)`, `Tests  563 passed (563)`. `page-entry.test.ts` verbose: C2 "finds the fields and the entries of a feed whose entries are replaced by a new list" passes, `Tests  31 passed (31)`.
- Perl ASCII gate over the 41 changed and new src files and `page-entry.test.ts`: nothing printed.
- `wc -l`: `context.ts` 879, `source.svelte.ts` 866, `html.ts` 804, `LeadCard.svelte` 455, `Tooltip.svelte` 444.
- `utils/unused-exports.sh` against the base list: `diff` prints nothing.
- History-word grep over the added comment lines and test titles: 12 hits, each "before" in the running sense or "no longer holds" of a running client.
- `grep -rln "import Glyph from" src | wc -l`: 72, and the 72 paths equal the report's list (`ui/menu/trigger/MenuOpener` included).
- `idents.ts:90`: `return reads.held(entries, \`feed index ${kind}\`, () => indexOf(kind, entries));`
- `boundaries.test.ts` verbose: "holds no process-wide state under src" passes, `Tests  11 passed (11)`.
- `hub-portfolio.test.ts` alone (`--tagsFilter slow --testTimeout 20000`): one case failed by time under load (G32 resolution case), `Tests  1 failed | 15 passed (16)`; the step does not change the file, and it passed inside the reviewer's full run.
- `tests/checks/source`, `tree`, `imports`: `Tests  107 passed (107)`. `git diff 75bf4dd10 --stat -- tests/checks` and `-- docs/HELP.md docs/data-map.md docs/decks.md` print nothing.
- The round's delta: only `tests/state/forms/page-entry.test.ts` differs from the snapshot (the `createReadMemo` import and `reads: createReadMemo()` in C2's sources).

Not run: the jsdom harness and the `anal/*.mjs` scripts (open item 715), `npm run diagrams` (it writes into `docs/`), and the quoted `git grep` and `git status --untracked-files=all` forms.

### Verdicts

- Item 1 (profile first): holds by reading for the mapping from each profile entry to its source. The times, and the decisions to leave `Menu.svelte`, `RecordCard.svelte` and `Card.svelte` uncut, rest on the `anal/` output, which is not used; the profile at landing settles them.
- Item 2 (a card's page found without the whole feed): holds (`idents.ts:90`, `feedPage` through `feedEntryOf(kind, feed.entries, ident, reads)`, `context.ts:180`; C2 runs the memo path).
- Item 3 (the menu built when first opened): holds by reading (`{#if menu.built || open}`; the first right-click, menu key, Shift+F10 or non-mouse press handed to the trigger after `flushSync`; a prevented event left alone). The look settles behaviour (C5).
- Item 4 (markdown once per text and per math): holds by reading.
- Item 5 (the other per-card work): holds by reading.
- Item 6 (nothing a reader sees or does changes): holds by reading for the DOM text and structure; the rest is the look. The threat paragraph's template claim rests on a program whose source is not quoted (Spec 2).
- Item 7 (the words): holds.
- Item 8 (the time to show): holds for the builder's part; the estimate rests on output that is not used, and the measurement is at landing.
- Clash ruling: holds in code (boundaries case passes, `tests/checks` untouched, no module-level mutable among the added lines). The report's account of where each Glyph's memo comes from is wrong for the controls mounted by `PdfControl` (Proof 1).
- Redo ruling: holds; round 1 changed none of the twelve files.
- C1: met. C2: met. C3 to C9: not verifiable here; the look settles each.
- Round 1 item 1 (C2 reaches the memo): closed. Item 2 (the 72 Glyph importers): listed, with the memo source wrong in one place (Proof 1). Item 3 (nothing claimed from an unapproved script): closed for the harness and `anal/`; a third program, the template compile, is not marked (Spec 2). Item 4 (the full list once): closed as far as the files show.

### 1. Spec

1. `O161-report.md:9-15`, "## Open items of the state file (`orchestrator-state.md:216-220`, verbatim)" ... "None.": copied from the worktree's copy of the state file at the base, while the main state file holds open item 715. Failure scenario: a reader takes the report's list as "no open items" while item 715, which decides whether the marked evidence may be used, is open. Verdict: none.
2. The report, "User-visible changes and what the look compares", and the DONE row of item 6: "the compiled template of the paragraph is `<p class="threat ..."><!> <span></span></p>` for the base and for the final file (read from `svelte/compiler`'s `compile` output of both)". The program and its command are not quoted and the sentence is not marked as resting on an unapproved script. The reviewer's reading finds the template equal to the base's. Failure scenario: a reader takes item 6's DONE row as resting on a run no reviewer can repeat. Verdict: none.

### 2. Proof

1. The report, "Where each memo comes from": "no `mount`, `hydrate` or `createRawSnippet` appears in `src` ... So every component sits under one of the four route roots." `grep -rnE "createRawSnippet|\bmount\(|\bhydrate\(" src` lists `Markdown.svelte:203` (mounts `ToolButton` with `context: contexts`, so it gets the memo), `side-panel.ts:106` and `viewer.svelte.ts:527` (mount `PdfControl` with no `context`; `PdfControl.svelte:10,58-66` draws `ToolButton` and so `Glyph`, where `useHtmlMemo()` returns undefined and `sanitiseSvg` filters afresh, as on the base). Failure scenario: the look checks icons only in the views the report lists, and a later change that trusts the sentence makes `useHtmlMemo` required, so the PDF viewer's buttons throw or lose their icons. Verdict: none on an item; the fix is the report's text at landing.

### 3. Standards

None.

### 4. Behaviour

None.

### Declined to judge

- The jsdom harness and the `anal/*.mjs` scripts: not run, nothing they produced used (open item 715). Item 1's times, the bits-ui and DOMPurify split, item 8's estimate and the uncut components go to the profile at landing; C5 and the tooltip's first-event hand-over to the look.
- Whether open item 715 was in the main state file when the report was written: `git log -p -- .scratch/migration/orchestrator-state.md` on main settles it.
- That round 1 ran the full list once and made its edit with Edit: the builder's transcript settles both.
- The quoted `git grep` and `git status --untracked-files=all` forms: outside the three git commands.
- `npm run diagrams`: it writes `docs/diagrams/`; the eight changed files were not checked against a regeneration.
- The `hub-portfolio.test.ts` failure in the reviewer's run of that file alone: the step does not change the file and it passed inside the full run.
- `flushSync` reached from inside an effect through `Tooltip.svelte` `focused`: no caller found; a keyboard focus into a never-built ToolButton issued from an effect, at the look, settles it.
- The ledger copies under the worktree's `.scratch/`: a landing matter.

Reviewer usage: a96cb64bab02b38fc, claude-opus-5-5, 246209 tokens, 51 tool uses, 14.5 min.
