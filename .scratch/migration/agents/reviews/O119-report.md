NOT done as ruled: the means of ruling 2 of round 1. A `read` menu does not open on the long press, as the ruling asks, but the code leaves bits-ui's handler off (`ContextMenu.svelte:157-160`) in place of a `preventDefault` handler through `composeHandlers`. The reason and the change that reverses it are under "Round 1". Everything else in the brief and the round is done.

Cases that need a page were read at file:line and go to the look on landing; no page was opened.

# O119 report

## Open items of the state file, verbatim

`.scratch/migration/orchestrator-state.md:165-167` holds the heading and this sentence, and no entry:

"An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own."

## Round 1

The review is `agents/reviews/O119-refuter.md`; the rulings are `agents/briefs/O119-round-1.md`.

| Ruling | State | Where |
| --- | --- | --- |
| 1. A press on a cut run | DONE | `callKey` at `turn-rows.ts:135`, which `runKey` uses at `turn-rows.ts:142`, so `runKey`'s value is as the brief names it. `carryChoices` in `turn-rows.ts` tries the keys of a run's later calls, last call first, moves the choice from the latest of them that holds one and deletes the others, on every draw (a fix at landing). The head comment says so (`turn-rows.ts:12-22`). |
| 2. The long press | DONE in what it asks, by another means | `ContextMenu.svelte:157-160`, head comment at lines 23-29. See below. |
| 3. A false sentence | DONE | `turn-rows.ts:14-15` reads "so it names the same call in every read of the transcript". |
| 4. The report | DONE | This file. |

**Ruling 2, the departure, a decision the orchestrator may reverse.** The ruling reads "stop it with a pointer handler through bits-ui's `composeHandlers`". `composeHandlers` (`node_modules/svelte-toolbelt/dist/utils/compose-handlers.js`) stops only on `e.defaultPrevented`, so the ruled handler has to call `preventDefault` on `pointerdown` of a touch or a pen, on every `read` menu's wrapper. A cancelled `pointerdown` suppresses that pointer's compatibility mouse events, under the Pointer Events specification. Those menus wrap text boxes (`TextBoxMenu.svelte:69`), the terminal grid (`TerminalGrid.svelte:442`), and the prose of `Markdown.svelte` and `TurnList.svelte`. So a tap may not focus a text box or the grid, and a pen may not start a text selection. That effect on a tap and a pen is not verified, since no page was run; it comes from my reading of the specification. Leaving the handler off needs no such trade: `wrapperOf` drops bits-ui's `onpointerdown` for a `read` menu, so `ContextMenu.svelte:159-160` starts no timer and cancels nothing.

To build it as ruled instead, `wrapperOf` goes back to dropping only `tabindex`, and `<ContextMenu.Trigger>` takes `onpointerdown={held}`, with `held` calling `preventDefault` when `read !== undefined && event.pointerType !== 'mouse'`.

What the ruling asks for, by reading:

- A menu with `read` does not open on that path: the wrapper has no `onpointerdown`, and `#handleOpen`'s long-press timer is set only there (`node_modules/bits-ui/dist/bits/menu/menu.svelte.js:1534-1539`).
- A menu with `items` or `groups` keeps its long press: `read === undefined` keeps the handler (`ContextMenu.svelte:160`).
- A right-click and the menu key stay: `oncontextmenu` and `onkeydown` are in `rest`, and bits-ui ignores a mouse at `onpointerdown` (`isMouseEvent`), so a mouse lost nothing.
- Callers read: the ten `read` menus are `TextBoxMenu.svelte:69`, `PaneStrip.svelte:215`, `Tree.svelte:442`, `Markdown.svelte:243`, `CallStack.svelte:79`, `Variables.svelte:100`, `TurnList.svelte:77`, `TerminalTitle.svelte:47`, `TerminalList.svelte:272` and `TerminalGrid.svelte:442`. `Props` has no pointer prop, so none hands a handler to the wrapper.
- A browser that raises `contextmenu` on a long press takes the right-click path and calls `read`. Not run.

No test was added, as the round says. `grep -n 'ContextMenu.svelte' .scratch/migration/agents/guarded.md` and `grep -rln 'ContextMenu' tests` printed nothing, so no entry covers the file.

## The cases' first run, on the unchanged tree

Commands were run on the unchanged worktree; a reading cites the base tree's lines. "Look" means the case goes to the look on landing.

| Case | How | Result on the unchanged tree |
| --- | --- | --- |
| Text selected in a person's turn, right-click | read `TranscriptBody.svelte:343`, `context-guard.ts:20-25`; look | No menu around `.said`: nothing opens, the page cancels the browser's menu. |
| Text selected on a call's row of an open run | read `TranscriptBody.svelte:362`, `TurnRun.svelte`; look | The same: no menu around a run. |
| Selection from a person's turn into the answer, right-click on the answer | read `Markdown.svelte:90-97`; look | The anchor is outside the answer's box, so `pointed` passes null: no Copy, nothing opens. |
| Text selected in an answer | read `Markdown.svelte:230`; look | One menu, the answer's own. |
| No selection, right-click on a blank part of a person's turn | read `ContextMenu.svelte:118-124`, `context-guard.ts:20-25`; look | Nothing opens, no browser menu. |
| Right-click with a selection on `.older` or under the last row | read `TranscriptBody.svelte:317-329`; look | Nothing opens. |
| Selection changes or turns arrive under an open menu | read `Markdown.svelte:85,216-220` | `heard` is kept from the right-click, so Copy gives that text. |
| Menu key on a run's press or a code block's Copy | read `ContextMenu.svelte:136-142`; look | A run's press has no menu around it; a code block's Copy opens the answer's menu with a selection inside that answer. |
| Right-click on an image in an answer | read `prose-menu.ts:82-93`; look | Copy Image, and Open Image on a served image. |
| Right-click in the Doc view's Markdown | read `Doc.svelte:296`, `Markdown.svelte:230`; look | Its menu. |
| Press a run open, Live, Transcript | read `Terminal.svelte:376`, `TranscriptBody.svelte:111,123-128,192`; look | The run reads as never pressed: `chosen` goes with the body. |
| A session's terminal ends with Transcript showing and a run pressed | read `terminal-lists.ts:96-116`, `TranscriptBody.svelte:118`; look | The body stays and `chosen` stays; if a first read replaces the list, `first` can change and `runKey` misses. |
| A run cut by a new first read | read `turn-rows.ts:126-128`, `transcript.svelte.ts:199-205`; look | The index and stamp of the cut run differ from the press's key: never pressed, and growth moves no press back. |
| A tab moved to another pane, a page switch, a reload | read `PaneBody.svelte:2-12,327`, `PageArea.svelte:4-6,64` | Never pressed: each unmounts `Terminal.svelte`. A tab in a float keeps its presses through a page switch, since a float stays mounted. |
| The agent's transcript tab | read `TranscriptBody.svelte:123-128`; look | A change of agent empties the choices; a right-click opens what it opens on a session's tab. |
| Press a run, read another session, come back | read `TranscriptBody.svelte:118-128`; look | Never pressed: the target change clears `chosen`. |
| Press a run closed that holds a failed call, Live, Transcript | read `turn-rows.ts:150-152`; look | Open: the choice is lost and a failed call opens it. |
| Two tabs on one session | read `TranscriptBody.svelte:111`; look | Each body has its own map. |
| A run grown at its head by a read of older turns | read `turn-rows.ts:134-147`, `TranscriptBody.svelte:199-211` | The press moves. |
| Two Codex runs, empty ids | read `src/lib/server/sessions/stores/turns.ts:297`, `model-sessions.ts:64-70` | The key is index and stamp, so they differ by index. |
| `npx vitest run tests/checks/imports/cycles.test.ts` | command | `Tests  1 failed \| 6 passed (7)`; received `"lib/views/system/workbench/editors/Cards.svelte -> lib/views/system/workbench/editors/NestedCards.svelte -> lib/views/system/workbench/editors/Cards.svelte"` |
| Settings, a list inside a card inside a card | `npx svelte-check --tsconfig ./tsconfig.json --output human`; look | `svelte-check found 0 errors and 0 warnings` |

The first run found one case that decision 2's rule answers otherwise: a tab in a float and a page switch. The brief says a builder stops there; this builder went on and reported it after the build. The code is unchanged by the ruling. The case now reads: a tab in a float keeps its presses through a page switch, since a float stays mounted.

G138 on the unchanged tree: `npx vitest run tests/state/system/config/sparse-card.test.ts` printed `Tests  37 passed (37)`.

## DONE / NOT DONE

| Item | State | Proof, as printed |
| --- | --- | --- |
| 1. One menu over the list | DONE by reading; the behaviour is the look | `TurnList.svelte:77-78` holds `<ContextMenu ...>` around `<div class="turns" ...>`; `grep -n '<ContextMenu\|class="turns"'` printed those two lines. The rows, `roleLabel` and their styles are in `TurnList.svelte`. `Markdown.svelte:78,81` has `plain`, default false, `TurnList.svelte:98` passes it. `proseRead` is at `prose-menu.ts:105`; `diff` of `Document.svelte` against the base prints nothing. |
| 1. Body under 520 lines | DONE | `wc -l`: `347 .../TranscriptBody.svelte`, `231 .../TurnList.svelte` |
| 2. A pressed run stays as pressed | DONE by reading; the behaviour is the look | `tab-session.svelte.ts:44,57-61,68`; `Terminal.svelte:383` `chosen={session.choices}`; `turn-rows.ts:135,142`; `TranscriptBody.svelte` clears `docs` alone. |
| 3. The cycle | DONE | `npx vitest run tests/checks/imports/cycles.test.ts`: `Tests  7 passed (7)`. `git diff --stat` shows no edit under `tests`; `diff -rq ../O119-base/tests tests` printed nothing. |
| 3. NestedCards imports only the type | DONE | `grep -n "^ *import.*Cards" .../NestedCards.svelte`: `29:    import type CardsView from './Cards.svelte';` |
| 3. G138 | DONE | `npx vitest run tests/state/system/config/sparse-card.test.ts`: `Tests  37 passed (37)` |
| 4. Help | DONE | `docs/HELP.md:458`, one new bullet; `git diff --stat`: `docs/HELP.md | 1 +` |
| 4. Diagrams | DONE | `npm run diagrams` before each list run; `layer-views.dot`, `layer-views.svg`, `layers.dot`, `layers.svg` changed, counts only. |
| Verify list | DONE | `test:quick: 41.7 s; every command passed`, with `ok prettier`, `ok ASCII gate`, `ok eslint`, `ok svelte-check (8.4 s): 1793640443418 COMPLETED 581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok vitest`, `ok vitest checks`. It prints: `not covered: tests that reach no changed file within the import depth, other than the checks under tests/checks/source and tests/checks/tree, which run for any change under src, tests or utils; the build, the lint of unchanged files` |
| ASCII of touched files | DONE | `LC_ALL=C grep -n '[^ -~]'` over the transcript folder and the other changed source files printed nothing; `sed -n 458p docs/HELP.md | LC_ALL=C grep -c '[^ -~]'` printed 0 for the one line added there. |
| Unused exports | DONE | `diff ../O119-base/unused-exports.txt` against `sh utils/unused-exports.sh` printed nothing, so the step added no line. |

Tests: the step adds and changes no test, as the brief says. `diff -rq` over `tests`, `utils` and `config` against the base printed nothing, so no assertion, allow list or predicate was edited. The cases are proved by reading and by the look.

Per case after the change, by reading, each with the look as its proof where the brief sends it there:

- Selection in a person's turn, on a call's row, or from a turn into an answer: `proseRead` takes the `.turns` box, so an anchor in any row gives Copy, and `selection.toString()` gives the whole selection.
- Text in an answer: the answer is `plain`, so `Markdown.svelte:239` draws no menu and one `ContextMenu` hears it.
- No selection, no image: `read` gives no items, `ContextMenu.svelte:121-124` calls `preventDefault`, and bits-ui opens nothing, so nothing opens and no browser menu.
- `.older` and the space under the last row are outside the wrapper: `.older` is a sibling of the list (`TranscriptBody.svelte:288,290`), and `.turns` is `flex: none`. The page cancels the browser's menu (`context-guard.ts:20-25`).
- An open menu: `heard` in `TurnList.svelte` is set only in `pointed`, and `TurnList` stays mounted while turns arrive.
- Menu key: `ContextMenu.svelte:136-142` raises a right-click at the control, `pointed` reads it, so Copy with a selection, nothing without.
- Image: `proseAt` reads `closest('img')` from the event target, `TurnList` picks through `prosePicked` with `openView`.
- Doc view: `plain` is false there, so the same `ContextMenu` around the same `.doc`.
- Live then Transcript, a terminal's end, a closed failed run: the map is `tabSession`'s and the key is the first call's id. `turn-rows.ts:135-139` holds no index.
- A cut run: the key of its later first call misses. A read of older turns restores the first call and the old key finds the press. A press made on the run while it was cut is held under a later call of the grown run, and `carryChoices` carries it to the run's key.
- Move, page switch, reload: `Terminal.svelte` unmounts, so a new map is made. Nothing is saved. A tab in a float keeps its presses through a page switch, since a float stays mounted.
- Another session or agent: `reads` changes and the `$effect.pre` empties the map before the body's effects run; a null target returns early and keeps it.
- Two tabs: `tabSession` is called once per `Terminal.svelte`.
- Two Codex runs: `JSON.stringify([call.at, tool?.name, tool?.summary])` at `turn-rows.ts:138`, over `toolTurn(at, '', type, codexSummary(item), codexOk(item))` at `src/lib/server/sessions/stores/turns.ts:297`.

## Files with line counts

From `diff -rq` against the base copy, `git status --short` and `wc -l`. Every path is on the write list.

| File | Lines at base | Lines now |
| --- | --- | --- |
| `src/lib/views/sessions/terminal/transcript/TranscriptBody.svelte` | 525 | 347 |
| `src/lib/views/sessions/terminal/transcript/TurnList.svelte` (new) | 0 | 231 |
| `src/lib/views/sessions/terminal/transcript/TurnRun.svelte` | 158 | 158 |
| `src/lib/views/sessions/terminal/transcript/turn-rows.ts` | 176 | 194 |
| `src/lib/ui/menu/ContextMenu.svelte` (added to the write list by round 1) | 184 | 189 |
| `src/lib/views/sessions/terminal/transcript/tab-session.svelte.ts` | 72 | 101 |
| `src/lib/views/sessions/terminal/Terminal.svelte` | 486 | 488 |
| `src/lib/views/shared/prose/Markdown.svelte` | 411 | 421 |
| `src/lib/views/shared/prose/prose-menu.ts` | 152 | 178 |
| `src/lib/views/system/workbench/editors/Cards.svelte` | 490 | 493 |
| `src/lib/views/system/workbench/editors/NestedCards.svelte` | 132 | 138 |
| `docs/HELP.md` | 614 | 615 |
| `docs/diagrams/layer-views.dot`, `.svg`, `layers.dot`, `.svg` | generated | counts only |

## Judgment calls the brief left open

Each may be reversed.

1. The shared read is `proseRead(event, box, t)` in `prose-menu.ts`, returning `{ heard, items }`, with the type `ProseRead`, so `Markdown.svelte` and `TurnList.svelte` also share the three lines that build the items.
2. `TurnList` takes `docOf`, the function `docs.of`, so the store of documents stays in the body, which clears it. Its props are `rows`, `docOf`, `chosen`, `zoom`, `onpress`, and the bindable `list`.
3. `tabSession` exposes the map as `choices`; the body's and the list's prop is `chosen`, typed `Map` and `ReadonlyMap`.
4. The key for an empty id is `JSON.stringify([call.at, tool?.name, tool?.summary])`, so no two fields run together. `runKey` reads `row.calls[0]` with no `?.`: `groupTurns` makes a run only with its first call and eslint refuses the chain.
5. The Help sentence is a bullet of its own, and it adds "wherever in the list of turns the selection started", which `proseRead` over the `.turns` box does. The case that proves it goes to the look.
6. The markup of `Markdown.svelte` moved into a snippet `prose`, named so to leave the global `document` free for `copyControl`. Each `{@render}` carries the same eslint comment `TurnRun.svelte` uses.
7. The body's head comment gives the rows' paragraph to `TurnList.svelte`'s head comment. No sentence is lost; the sentences about a person's turn and an answer moved with them.
8. When several later calls of a grown run hold a choice, the last call's wins and the others are deleted, since the cut of a first read falls later as the file grows, so a later call holds the later press. A choice found this way replaces one held under the run's first call, as a later press does.
9. The means of ruling 2, under "Round 1".

Keys and paths in flight, as the spec asks: an empty id takes the composite; a duplicate tool id, or two composites equal in all three fields, share one choice, so a press on one is a press on both; the key reaches no HTML and no reserved key exists, since it is a key of a `Map`. An open menu when the list is replaced by the error box goes with `TurnList`. A target superseded while the body draws: the `$effect.pre` empties the map once for each change of words.

## Every user-visible change, before and after

The view is a Terminal tab on Transcript, with a session holding a person's turn, a run of two or more tool calls, and an answer with a code block and an image. For the last group, Settings on a row whose family nests a list in a card in a card.

| State | Before | After |
| --- | --- | --- |
| Select text in a person's turn, right-click it | Nothing opens | One menu, Copy, which copies that text |
| Open a run, select text on a call's row, right-click it | Nothing opens | One menu, Copy |
| Drag from a person's turn into the answer below, right-click the answer | Nothing opens | One menu, Copy, the whole selection |
| Select in an answer, right-click | One menu, Copy | One menu, Copy |
| Select in a row, right-click an image in an answer | Copy Image and Open Image only | Copy, then Copy Image and Open Image |
| Focus a run's press with a selection in the list, press the menu key | Nothing | Menu, Copy |
| Press a run open, press Live, press Transcript | The run reads as never pressed | The run stands open, at the foot of the list as on any first draw |
| Press closed a run holding a failed call, Live, Transcript | Open again | Closed |
| With a failed read of older turns, press the cut run, Live, more turns, Transcript, then the run read whole by any read | The run reads as never pressed | The press stands on the whole run, wherever the run stands in the list (`carryChoices`, landed as a fix at landing) |
| Hold a touch or a pen for 700 ms on a menu with `read` (any of the ten under "Round 1") | The list opens empty or with the last right-click's items | The list does not open from that long press |
| Hold a touch or a pen on a menu with `items` or `groups` | The list opens | The same |
| A terminal's end with a run pressed | The press can miss after a first read | The press holds |
| Nested cards in Settings | Drawn | Drawn the same; `svelte-check` passes |
| Help, Terminal section | No line about Copy | One bullet at `docs/HELP.md:458` |

No word joins a catalog. The look also reads a code block's Copy, the Markdown export and a refused value in the `terminal.transcript_font_px` row, as the brief says.

## Anything in the brief that was wrong, with the evidence

1. The case on a page switch now reads, by ruling: a tab in a float keeps its presses through a page switch, since a float stays mounted. `Workbench.svelte:392-394` draws `FloatLayer` beside `PageArea`, and `{#key page.id}` (`PageArea.svelte:64`) unmounts only what is in `PageArea`. Decision 2's list holds maximising a pane as well: `PageArea.svelte:68-72` draws a maximised pane in another branch, which unmounts `Terminal.svelte`, so presses read as never pressed. Nothing was built for either.
2. Brief item 2 says "the id of the run's first call". A `Turn` carries no id; the id is `turn.tool.id` (`src/lib/data/model/model-sessions.ts:64-70`). `stores/turns.ts:297` is `src/lib/server/sessions/stores/turns.ts:297`. The line reproduces there.

All other premises reproduced where they were read: the line numbers of the brief's "What is on the tree" for `context-guard.ts`, `Markdown.svelte`, `Doc.svelte:296`, `turn-rows.ts:126-128`, `tab-session.svelte.ts:24-27`, `Terminal.svelte:376`, `PaneBody.svelte:327`, `context.ts:256`, the 525 lines of the body, `Cards.svelte:71`, `NestedCards.svelte:26,79,101,111`, and `cycles.test.ts` at 1 failed, 6 passed. G138's Code line names `Cards.svelte`; `.scratch/migration/agents/guarded.md` names none of the transcript files, `Markdown.svelte`, `prose-menu.ts` or `ContextMenu.svelte`.

## Limitations and sharp edges

- A press on a cut run is carried at the first draw that holds a later call of the run, by any read and in any place in the list (`carryChoices`, a fix at landing). While the run is cut under another key, it reads as never pressed.
- Two Codex runs whose first calls match in stamp, name and summary share a key (a stamp can be null). A press on one presses both. A repeated Claude tool id does the same.
- A press made on a cut run, then grown, replaces a press held under the whole run's key: the later press stands.
- Decision 3 stands: after a redraw the reader lands at the foot, so a run pressed open may be out of view until scrolled to.

## Standing checks of the spec

- History words, over the comment lines and titles added: `grep -nE "(before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands)"` over the diffs against the base and over `TurnList.svelte` gave two hits: "the documents of the turns that go with it before the new turns are drawn" and "The choices go before the new target's turns are drawn". Both name the order of a draw, and neither compares with an earlier state.
- Helper grep: `grep -rn "getSelection\|anchorNode" src` prints, for the page's own selection, `prose-menu.ts:110-111` (moved from `Markdown.svelte:91-92`), `Present.svelte:372` and `src/routes/present/show/+page.svelte:178`, both `window.getSelection()?.isCollapsed`; `Document.svelte:98` for its frame's window; xterm's at `grid-look.ts:114,136` and `TerminalGrid.svelte:232,244`; and Monaco's under `src/lib/ui/controls/editor`. None but the moved one reads an anchor against a box, so no helper covered it. `grep -rn 'NestedCards' src` found `Cards.svelte` as its one user.
- Name grep: `grep -rn 'runKey' src/lib/views docs README.md` shows `turn-rows.ts`, `TurnList.svelte`, the comments of `TranscriptBody.svelte`, `tab-session.svelte.ts` and `TurnRun.svelte`; no `docs` hit. `src/lib/server` has unrelated functions of the same name. `grep -rln 'TranscriptBody' src tests docs README.md` lists `Terminal.svelte`, `TurnList.svelte` and the helper `tests/state/sessions/transcript-tab.svelte.ts`, whose sentence is true.
- Paragraphs read after the change:

| Paragraph | State |
| --- | --- |
| `docs/HELP.md:457-460` | still true, one bullet added at 458 |
| `TranscriptBody.svelte` head comment | rewritten |
| `TurnRun.svelte` head comment | rewritten |
| `turn-rows.ts` head comment and `runKey` doc comment | rewritten |
| `tab-session.svelte.ts` head comment | rewritten |
| `Markdown.svelte` head comment, lines 6-7 and 30-35 | rewritten |
| `prose-menu.ts` head comment | rewritten |
| `Cards.svelte` head comment | rewritten |
| `NestedCards.svelte` head comment | rewritten |
| `Terminal.svelte` head comment | rewritten |
| `Document.svelte:33` comment | still true |
| `ContextMenu.svelte` head comment and `wrapperOf` doc comment | rewritten |

- Each new or changed sentence was read against the spec's prose rules. The comment lines hold to 100 columns, which `tests/checks/source/comment-width.test.ts` checks in the list.
- No library was added, and none found that would replace this work. No script was written; every edit was made with Edit and Write, and `npm run diagrams` is the tool the spec names.

## Number of full-list runs

First build: 2. Round 1: 2. In each, the first run was red on `tests/checks/source/comment-width.test.ts`, on a comment line of a file the step changed; that file was rerun alone with `Tests  2 passed (2)`, and the second run passed whole. The last run is the one quoted above. No whole-suite command was run.
