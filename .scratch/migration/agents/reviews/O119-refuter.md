# Step O119 refuter report (on /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O119, base 7503f75c3)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

Summary: every item holds, 21 of 22 cases are met and one is partial. No red check. There are six findings, none blocking: one spec (a stop the builder did not make), one proof, one standards (one comment sentence) and three behaviour (the three stated limits). All cases that need a DOM are met by reading only, and the look at landing remains their proof.

## Verification (rerun by the reviewer)

```
npm run test:quick -- --base 7503f75c3
test:quick: 16 changed file(s), from git since 7503f75c3
test:quick: 10 test file(s)
ok      prettier (0.6 s): All matched files use Prettier code style!
ok      ASCII gate (0.8 s)
ok      svelte-kit sync (2.4 s)
ok      eslint (2.2 s)
ok      svelte-check (7.5 s): 1793639637469 COMPLETED 581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (20.8 s): Duration  11.53s (transform 8.45s, setup 0ms, import 11.35s, tests 64ms, environment 0ms)
ok      vitest checks (38.8 s): Duration  29.33s (transform 12.99s, setup 0ms, import 26.29s, tests 39.23s, environment 2ms)
test:quick: 41.3 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth, other than the checks under tests/checks/source and tests/checks/tree, which run for any change under src, tests or utils; the build, the lint of unchanged files

npx vitest run tests/checks/imports/cycles.test.ts
      Tests  7 passed (7)

grep -n "^ *import.*Cards" src/lib/views/system/workbench/editors/NestedCards.svelte
29:    import type CardsView from './Cards.svelte';

npx vitest run tests/state/system/config/sparse-card.test.ts
      Tests  37 passed (37)

Item 4 of the brief's verify list: the step adds and changes no test. diff -rq ../O119-base/tests tests printed nothing.
Item 5 of the brief's verify list: each new or changed sentence was read; one finding, under Standards.

Commands the report quotes:
grep -n '<ContextMenu\|class="turns"' .../TurnList.svelte
77:<ContextMenu label={t('ui.prose_menu')} read={pointed} onpick={picked}>
78:    <div class="turns" style:zoom bind:this={list}>
wc -l: TranscriptBody.svelte 345, TurnList.svelte 231, TurnRun.svelte 158, turn-rows.ts 186, tab-session.svelte.ts 101, Terminal.svelte 488, Markdown.svelte 421, prose-menu.ts 178, Cards.svelte 493, NestedCards.svelte 138, docs/HELP.md 615. All as the report states.
diff -rq ../O119-base/{tests,utils} and config with -x local.yml: printed nothing.
diff -rq ../O119-base/src src: the 9 changed source files of the report and "Only in ... transcript: TurnList.svelte"; Document.svelte is not among them.
sh utils/unused-exports.sh, diffed against ../O119-base/unused-exports.txt: no difference, exit 0.
LC_ALL=C grep -n '[^ -~]' over the transcript folder, the other changed source files and the report: no output, exit 1.
sed -n 458p docs/HELP.md | LC_ALL=C grep -c '[^ -~]': 0
History grep over the added lines and TurnList.svelte: two hits, "the documents of the turns that go with it before the new turns are drawn" and "The choices go before the new target's turns are drawn". Both name draw order. Same two as the report.
grep -rln 'TranscriptBody' src tests docs README.md: Terminal.svelte, TurnList.svelte, tests/state/sessions/transcript-tab.svelte.ts. As the report states.
grep -rn 'NestedCards' src: Cards.svelte is the one user. As the report states.
grep -rn "getSelection\|anchorNode" src: does not match the report's sentence; see Proof.
node_modules/bits-ui/dist/bits/menu/menu.svelte.js:1534-1539: the long press path, as the report cites it.
ls transcript folder: 6 items (limit 10).
cmp of the report in the worktree and the main checkout: identical.
npm run diagrams: not run, since it writes; see Declined to judge.
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `TurnList.svelte:77-121` holds one `ContextMenu` around and outside `.turns`, with the rows, `roleLabel` and styles moved. The style block equals the base's apart from one comment word ("this view" to "the view"). `.context` is `display: contents` (`ContextMenu.svelte`), so `.turns` stays the flex child of `.chat`. `plain` defaults to false at `Markdown.svelte:81`, and of the eight `<Markdown` sites only `TurnList.svelte:98` passes it. `proseRead` at `prose-menu.ts:105` takes the box, `proseAt` keeps its signature and `Document.svelte` is unchanged. No other `ContextMenu` stands around or inside the rows: `TabView` has none, PaneBody's is only for an empty pane, and `TurnRun`, `RowButton` and `ToolButton` have none. So one right-click opens one menu.
- 2: holds. `tab-session.svelte.ts:44,57-61` owns the `SvelteMap` and clears it only on a different non-null target. `Terminal.svelte:383` hands it in and the body clears `docs` alone. `runKey` at `turn-rows.ts:133-138` holds no index. The brief scopes the key's survival to "a run wholly inside that read"; the corner past that is Behaviour 1.
- 3: holds. `NestedCards.svelte:29` imports the type alone, cycles.test.ts gives 7 passed with no edit, and `Cards.svelte:73,263` passes `Self`. Both draw sites take `{...entries}`, which carry `single` and `form: 'pairs'`, and each nested `Cards` hands `Self` on, so every depth is covered.
- 4: holds. `docs/HELP.md:458` is one bullet. The diagram diffs are counts only, and the changes match a read of the moved imports: sessions to shared +1, to state +2, to ui +1.

Cases of the brief's "Cases":

- Text selected in a person's turn: met by reading (`proseRead` over `.turns`, `prosePicked` copies `heard.text`); the look is the proof.
- Text selected on a call's row: met by reading. `.line.call` is plain text and the only `user-select: none` near it is the code block's control (`Markdown.svelte:357`). Look.
- Selection from a person's turn into the answer: met by reading. The anchor is in `.turns` and `selection.toString()` gives the whole selection, with no inner menu. Look.
- Text selected in an answer, one menu: met by reading (`Markdown.svelte:239`, `plain`). Look.
- No selection, blank part of a person's turn: met by reading. `pointed` calls preventDefault, bits-ui's `composeHandlers` stops, and `shouldCancel` returns false on the prevented event, so neither menu opens. Look.
- `.older` or under the last row: met by reading. Both are outside `.context`, and the page guard cancels the browser's menu. Look.
- Selection changes or turns arrive under an open menu: met by reading. `heard` is set only in `pointed`, and `TurnList` stays mounted across rows.
- Menu key on a focused control: met by reading. `keys` passes since `read` is given, `openAtEdge` raises a synthetic right-click, and with no items nothing opens. Look.
- Right-click on an image: met by reading (`proseAt` from `event.target`, `openView` from `useState`). Look.
- Right-click in the Doc view's Markdown: met by reading. The default branch is the same `ContextMenu` around the same `.doc`; `bind:this={box}`, `pressed` and `sanitise` moved into a snippet with no change of logic. Look.
- Press a run open, Live, Transcript: met by reading. The map outlives the body, and `target` stays non-null, so `reads` does not move. Look.
- A session's terminal ends with Transcript showing: met by reading. `closeEnded` gives `{ session, agent: '' }`, the same words as `running`'s target, so `reads` does not change and nothing clears. Look.
- A run cut by a new first read: met by reading. The cut run's key misses and `K1` stays in the map. On growth `movedRun` finds no choice under the cut key, and `K1` is found.
- A tab moved to another pane, a page switch, a reload: partial. A tab in a float keeps its presses through a page switch (`Workbench.svelte` draws `FloatLayer` beside `PageArea`, and only `PageArea` is under `{#key page.id}`). Spec 1. The rest is met by reading.
- The agent's transcript tab: met by reading (`reads` holds the agent). Look.
- Press a run, the tab reads another session and comes back: met by reading. `owner` moves at the first non-null other target and clears, and `owner` does not return the entry. Look.
- Press a run closed that holds a failed call, Live, Transcript: met by reading (`runOpen` with `'closed'`). Look.
- Two tabs on one session: met by reading. `tabSession` is called once at `Terminal.svelte:147`, per component, and `kept` at `PaneBody.svelte:126` keeps a shown tab mounted, so a switch between tabs loses nothing.
- A run grown at its head by a read of older turns: met by reading (`TranscriptBody.svelte:173-185`, `movedRun`).
- Two Codex runs, empty ids: met by reading (`turn-rows.ts:133-138` over `src/lib/server/sessions/stores/turns.ts:297`).
- `npx vitest run tests/checks/imports/cycles.test.ts`: met, 7 passed.
- Settings, a list inside a card inside a card: partial evidence by design, met for what can run. `svelte-check` shows 0 errors and the draw is read as above. That nested cards draw on screen is the look; no test renders `Cards` (`sparse-card.test.ts:20` says so).

## 1. Spec

- `.scratch/migration/agents/reviews/O119-report.md`, "The cases' first run": "No case came out wrong under the brief's rules for item 2 or for the menu, so nothing was handed back before the build. The float tab is a sentence of a case, not a rule that fails; it is reported below."
  - What is wrong: the first run found that the case "A tab moved to another pane, a page switch, a reload: reads as never pressed" gives a different result under decision 2's own rule for a float tab. The brief says a case its rules get wrong stops the builder before any code change, with the first run handed back. The builder went on and reported it afterwards.
  - The code is right by decision 2's rule, and the change it would have stopped for is a ruling, not code.
  - Failure scenario: the look on landing reads a float tab's page switch against the case, sees the press kept, and either calls it a defect or passes a case whose text is false.
  - Fix: the orchestrator rules that a float tab keeps its presses and corrects the case and decision 2's sentence in the closing record.
  - Verdict: makes "A tab moved to another pane, a page switch, a reload" partial.

## 2. Proof

- `.scratch/migration/agents/reviews/O119-report.md`, "Standing checks of the spec": "`grep -rn "getSelection\|anchorNode" src` found the page's selection read at `Markdown.svelte:91` alone, the others being Monaco's".
  - What is wrong: the rerun also shows `src/lib/views/academic/present/Present.svelte:372` and `src/routes/present/show/+page.svelte:178` (`window.getSelection()?.isCollapsed`), `src/lib/views/sources/document/Document.svelte:98` and xterm's at `grid-look.ts:114,136`. None of them is Monaco's.
  - Decision resting on it: that no existing helper covers the read. That conclusion stands, since none of those reads an anchor against a box.
  - Failure scenario: a reader trusts the sentence as an inventory of page selection reads and misses the two `isCollapsed` checks when next changing selection handling.
  - Verdict: none.

## 3. Standards

- `src/lib/views/sessions/terminal/transcript/turn-rows.ts:14-15`: "The key holds no list index, so it names the same run in every read of the transcript."
  - What is wrong: this sentence of the rewritten head comment is false. Its own next sentences say a cut run goes under another key, and `runKey` names the first call the list holds, which is why `movedRun` exists. "A sentence in a document or a head comment that the change makes false" is a defect under `agents/spec.md`, "What every package obeys".
  - Failure scenario: a maintainer reads that the key names the same run in every read and removes `movedRun` as dead, and a press on a cut run is then lost at every read of older turns.
  - Fix at landing: "...so it names the same call in every read".
  - Verdict: none.

## 4. Behaviour

- Limit 1, press on a cut run. `.scratch/migration/agents/reviews/O119-report.md`, "Limitations and sharp edges": "Closing it needs a rule beyond the first call's key, which is the orchestrator's to rule on." Code at `turn-rows.ts:148-158`, `return { from: runKey(top), to: runKey(row) };`.
  - What is wrong: the defect is as stated, but the claim that a key rule must change does not hold. A fix fits inside two paths the step writes and leaves `runKey`'s value as the brief names it:
    - give `turn-rows.ts` a `callKey(call)` that `runKey` calls for `calls[0]`;
    - have the body's move look through the keys of the grown run's later calls for a held choice, in place of `runKey(top)` alone.
    This is about six lines, with no new user-visible shape, so it does not need a ruling from Axel.
  - Failure scenario:
    1. The read of older turns fails, so the run stays cut at c4 with the Try again line up.
    2. The reader presses it, and the press is held under c4.
    3. The reader presses Live, new turns arrive, and pressing Transcript makes a first read that cuts at c6.
    4. One read of older turns grows the run from c6 to c1. `movedRun` looks only at c6 and finds nothing, so the run reads as never pressed.
  - Reach: the press needs a cut run, which `askOlder` normally heals within one read's latency, and a wrong result costs one disclosure, as the brief weighs it.
  - My judgment: fix it at landing, or send it in the repair round. A stated limit stands here where a fix inside the step's part was possible.
  - Verdict: none, since item 2's text scopes the key to a run wholly inside the read.

- Limit 2, maximising a pane. Same section: "`PageArea.svelte:68-72` draws a maximised pane in another branch, so maximising a pane that shares its page with others unmounts `Terminal.svelte`, and the presses read as never pressed."
  - Confirmed by reading `src/lib/shell/panes/leaf/PageArea.svelte` (`zoomed !== null && focus !== null` is a separate branch around `PaneView`).
  - This changes nothing against the base, where the map also went with the component.
  - The limit stands. A fix needs the choices held above `Terminal.svelte`, for example per instance through the client's `ui.instanceState` (which I did not read further), and that reverses decision 2 and the case naming a reload or a move. It is outside the step's part.
  - Failure scenario: a reader presses a run open, maximises the pane to read it, and the run closes.
  - The orchestrator should add maximise to decision 2's list in the closing record; Axel can then reverse decision 2 if he wants it.
  - Verdict: none.

- Limit 3, long press with no `read`. Same section: "bits-ui opens a context menu on a long press of a non-mouse pointer without the `contextmenu` event ... so `read` is not called."
  - Confirmed at `menu.svelte.js:1534-1539`. The report understates what the reader gets. `ContextMenu.svelte` keeps `heard` from the last right-click and does not check `offered` on this path. A long press therefore opens an empty box on a first use, or the last right-click's items, and a pick of Copy gives `TurnList.heard.text`, the older text.
  - The area is now the whole list where it was an answer's box.
  - A fix is possible in one file, `src/lib/ui/menu/ContextMenu.svelte` (a user `onpointerdown` that calls preventDefault for a `read` menu stops bits-ui through `composeHandlers`). That file is outside the write list and the defect stands on every `read` menu, so it is a different concern from this step and may legitimately be booked. Nothing bars widening the write list either.
  - My judgment: no touch use of oculus shows in `docs/HELP.md` or `README.md`, so it is low. Booking it as a line in the ledger is the honest end state, and the report sentence should carry the empty box and the stale Copy.
  - Failure scenario: a touchscreen reader holds a finger on a row for 700 ms and gets an empty menu box, or a Copy that puts older text on the clipboard.
  - Verdict: none.

## Declined to judge

- Every behaviour that needs a DOM, the look's three owed presses (a code block's Copy, the Markdown export, a refused value in the `terminal.transcript_font_px` row) and the before and after table: no page is opened in this review, and the look at landing settles them.
- Effect order at run time (the body's `$effect.pre` ahead of `TurnList`'s each block, the body's `$effect` after `bind:list`, and the tab's `$effect.pre` ahead of the body's): judged by reading Svelte's tree-order traversal and the creation order. It was not run; only a `*.client.test.ts` or the look would run it, and the brief adds no test.
  - `tabSession`'s `$effect.pre` now forces `tab` at `Terminal.svelte:147` during init. Everything it reads is declared above that line, so there is no temporal dead zone.
  - The first run clears an empty map, which `SvelteMap.clear` returns from at once.
  - A null target returns early and leaves `owner` as it was, so it never clears.
- Whether the committed diagrams equal what `npm run diagrams` writes: it writes into the worktree and this review changes nothing. The counts were checked by reading the moved imports; the run at landing settles it.
- The self-import `import Self from './Cards.svelte'` under the dev server's hot reload and in the built app: read as sound (the binding is used at render time, after the module has evaluated), not run. The look at landing on nested cards settles it.
- Whether a person uses oculus on a touch device: not settled by the tree.
- Whether `ui.instanceState` is saved with the layout: not read, since Limit 2's verdict does not rest on it beyond naming it as one possible holder.

Reviewer usage: <the session fills this from the completion notice: agent id, served model, tokens, tool uses, minutes>.
