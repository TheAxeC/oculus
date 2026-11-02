# Brief check of O119, read on main at fc6799363

`git log --oneline -3` shows head fc6799363. `git status --short` at the end shows only `.scratch/migration/orchestrator-state.md` and the untracked brief, so the checkout is unchanged by this check. The scratch folders I made in my scratchpad are removed.

The four findings that must change the brief before dispatch:
- F1, the Svelte size rule. `TranscriptBody.svelte` is over the limit and the brief names no split.
- F2, the new test has no guarded entry.
- F3, the closeEnded premise is false for the order it names.
- F8, the same-name type import fails svelte-check.

## 1. Names

Commands: `grep -rn 'runKey\|movedRun' src tests docs README.md`, `grep -rn '\bchosen\b' src/lib/views/sessions/terminal tests/views/sessions`, `grep -rn 'proseAt\|proseMenu\|prosePicked\|prose-menu' src tests docs/*.md README.md`, `grep -rn 'NestedCards' src tests docs/*.md README.md`, `grep -rn '<Markdown' src tests docs/*.md`, `grep -rn "Cards.svelte" src tests docs/*.md`, and `grep -rl 'TranscriptBody\|prose-menu\|NestedCards\|turn-rows' docs`, which prints nothing.

- `runKey`, the transcript's: all hits are in `turn-rows.ts`, `TranscriptBody.svelte:66,110,202,360` and `TurnRun.svelte:6`, all in the write list. The other `runKey` hits are unrelated local functions: `server/edit/writes/config/save/settings-save.ts:179`, `server/machine/hpc/clusters/keys.ts:42` and `setup.ts`, `server/machine/runs/lint/routes.ts:392`. Not made false.
- `chosen`: every hit of the map is in `TranscriptBody.svelte`, plus the word in the comment at `turn-rows.ts:149`. The other hits under `terminal/` are other locals. Not made false.
- New Markdown prop: the brief gives it no name, so it cannot be grepped. Drawers outside the write list: `RenderedMarkdown.svelte:159`, `Help.svelte:68`, `EntryFolder.svelte:110`, `Project.svelte:178`, `Doc.svelte:287,296`. All keep the default. Brief line 13 names only `Doc.svelte:296`, an example of "also", and that is not false.
- Moved read: `Document.svelte:33,55,98,100,188` uses `proseAt`, `proseMenu` and `prosePicked` with its own frame selection. It stays true only if `proseAt` keeps its signature. The brief says "move it to prose-menu.ts", which is `pointed`'s read, so add "`proseAt`'s signature stays; `Document.svelte` does not change". `prose-menu.ts:1-3` names only Markdown and the Document view and needs the Transcript; it is in the write list.
- Comments in the write list that the change makes false but the brief does not name: `Markdown.svelte:30-32` (the menu is now conditional) and `TranscriptBody.svelte:33-35` ("brings ... the prose menu"). Item 2's sentence on comments covers only the choices; spec.md:72 covers the rest.
- `NestedCards`' import: hits outside the write list are `Fold.svelte:4` (comment, still true) and `Editor.svelte:71`, which imports `Cards` and is unaffected. Comments at `tests/state/system/config/sparse-card.test.ts:20` and `collection-fields.test.ts:9` stay true.
- Finding F9: guarded.md G138 names `Cards.svelte` in its Code line (`.scratch/migration/agents/guarded.md:223`). spec.md:60 says a step touching an entry's code runs that entry's test. The brief does not name `tests/state/system/config/sparse-card.test.ts`. Add it to the verify list, or state that test:quick runs it.

## 2. The step line

- "a right-click in the Transcript keeps a menu with Copy for selected text": item 1.
- "a pressed run stays as pressed when the session moves from a terminal to none": item 2. See F3 on which inputs that covers.
- "Cards.svelte and NestedCards.svelte stop importing each other so cycles.test.ts passes": item 3. A type-only import stays, which `cycles.test.ts:34-46` allows.
- "the look presses a code block's Copy, the Markdown export and a refused value in the `terminal.transcript_font_px` row": "The look at landing", named word for word. These are the look's, as you said. The targets exist: `config/options/appearance.yml:79`, and `export_tip` at `config/text/views/sessions/session-list.yml:20`.
- "(ruling 631)": `plan.md:3429` matches.
- Parts of the line with no requirement: none.
- Item 4 (Help) has no part in the line. spec.md:72 requires it.

## 3. Premises

Confirmed by reading or running:
- `context-guard.ts:13,20-25`, by `grep -n` and read.
- `Markdown.svelte:90-97,216-236`.
- The TranscriptBody lines, from `grep -n 'class="said"\|<Markdown\|<TurnRun'`: 343, 346, 362.
- `ContextMenu` takes `read`, wrapper `display: contents`, `own`.
- `turn-rows.ts:126-128`.
- `tab-session.svelte.ts:24-27`.
- `Terminal.svelte:376`.
- `terminal-lists.ts:96-116`.
- `NestedCards.svelte:26,79,101,111`; `Cards.svelte:71`.
- `TranscriptBody.svelte:192`.
- No test of `runKey` or `movedRun`.
- `npx vitest run tests/checks/imports/cycles.test.ts` prints "Tests 1 failed | 6 passed (7)", naming the Cards and NestedCards cycle.
- The planted case is at `cycles.test.ts:34-46`, not 35-49: the last lines of the brief's range are the expect, and the cited facts hold.
- `bits-ui` 2.19.3 at `package.json:82`.
- `TurnRun.svelte` imports nothing of Markdown.
- The verify list is `npm run test:quick` in the state file, which `.agents/plan.yaml:4` names as the page.

**F3. Brief line 18 is false for the order it names.**

Order A, the terminal leaves the list with its link still noted, main window:
- `entities.svelte.ts:37-43` stores the message and calls the listeners in the same call.
- `terminals.svelte.ts:343-358` calls `closeEnded`.
- `restateInstance` then `change` then `apply` then `writeHost` and `savePages` (`instances.ts:133-137`, `layout.svelte.ts:577-583,619-622`) has no await on the path, as far as `savePages`'s body, which I read only to its head.
- So by this reading no draw falls between, `session.reading` holds, and the body is not torn down. Svelte's flush timing is from knowledge; not run.

Order B, the link drops while the terminal stands (an agent typed in a shell quits, `docs/HELP.md:453`):
- `running` and `target` go null, the body is torn down and the grids draw.
- `linkTerminals` runs after `closeEnded` on every message and rebuilds the map without that terminal (`terminals.svelte.ts:358-360`, `open-session.ts` `linkTerminals`).
- At the terminal's end `linkedSession` is null, so `closeEnded` leaves `transcript` null and closes the tab (`terminal-lists.ts:104-112`, `tests/state/sessions/terminal/reading-tab.test.ts:183`).
- `closeEnded` never sets `transcript` in this order.
- The target returns only if the link returns, for example the same session resumed in that shell.
- A press on the session row after the quit opens or reuses another tab (`open-session.ts:60-81`), which has a fresh map.

Real teardowns with a return to the same target:
- A popped-out window: `upkeep: float === null` at `context.ts:256`, and `closeEnded` does not run there (`terminals.svelte.ts:357`), so target is null until the main window's write arrives. How that write arrives was not read.
- The link flapping, or a resume in the same shell.
- Live then Transcript: `reading` goes false with the target unchanged.

Does the map survive? Yes in each of those. `Terminal.svelte` stays mounted: the `{#if}` at :376 is inside it, tabs are keyed at `PaneBody.svelte:327`, and `closeEnded` only restates.

It does not survive:
- A page switch: `PageArea.svelte:4-6,64`, `{#key page.id}`.
- A tab moved to another pane: `{#each kept}` belongs to each `PaneBody`. By reading; not run.
- Closing the tab, or a reload.

The O115 sighting (`reviews/O115-landing.md:16`, "seen once") has no established cause. A `from === 0` read with the body mounted would also change `first` (`transcript.svelte.ts`, `merged`), so it is a further candidate that the id key covers.

Change line 18: state orders A and B and the teardowns above, and drop "closeEnded then sets transcript". Order B's closing tab, if it is held to break the step line or G147, needs a change in `terminals.svelte.ts` or `open-session.ts`, outside the paths. Under the standing demand that goes to Axel as an open item; it does not go into the brief.

**F4. Brief line 86 (Decision 2) "They last for the tab's life" is false.** See the three remounts above. Say "while the tab's `Terminal.svelte` stays mounted; a move to another pane or a page switch reads as never pressed".

**F1. `TranscriptBody.svelte` is 525 lines (`wc -l`), over spec.md:48's 520, and the step adds to it.** It gains the ContextMenu import, the wrapper, `heard`, the read and `picked`; it loses `SvelteMap` and `chosen`. The size check refuses 540 (`tests/checks/tree/size.test.ts`, `COMPONENT = 540`), and `utils/size-allow.txt` has no entry for it (`grep` prints nothing). spec.md:48 requires a split in the step; the brief has none and no new path. The folder holds 5 items (`ls | wc -l`), so there is room. Add a path, for example `transcript/TurnList.svelte` holding the `.turns` markup and styles, and say what moves. This is an internal widening under the standing demand.

**F5. Item 1 says "Wrap the list" without saying which side of `.turns`.** `reader-place.ts:62,90` reads `list.children` as one child per row, and `TranscriptBody.svelte:162` says so. A `ContextMenu` inside `.turns` makes one child. Add "the `ContextMenu` stands outside the `.turns` box".

**F6. An empty id is not an edge case.** `turns.ts:297` gives every Codex tool turn `id: ''`, so every Codex run is keyed by its stamp alone. `stampShape` can be null (`record.ts:222`), so two runs with no id and no stamp both key as `''` and share one press. The old key's index prevented that. spec.md:73 asks for the empty and duplicate cases. Brief line 48 tests only the stamp fallback. Say what a run with neither gets. Adding the first call's name and summary is one way that keeps "no list index".

**F7. Item 4's diagram paths cannot be checked before the build.** `layer-views.dot:33-36` carries folder import counts, and `layers.dot` the layer arrows, so both can move. Those are the two the brief lists. A split (F1) stays in the same folder.

## 4. Cases and checks

- Case "Text selected on a tool row": a closed run's line is a `RowButton`. Starting a drag selection inside a button in Chrome is not expected to select (from knowledge; not run). Say "a call's row".
- Case "No selection, right-click on a person's turn: nothing opens": on macOS, Chromium selects the word under a right-click before `contextmenu` (from knowledge; not run here). The case would then show Copy with that word, as answers do today. This machine is darwin. Say so in the case, or use a blank part of the row.
- Case "A new first read of the same file gives the same key for that run": true only for a run wholly inside the new first read. A run cut by that read takes another first call, reads as never pressed until older turns grow it, and then finds its key again. Add the qualifier.
- Case "Press a run open, then have the tab's target go null and return": no input is named. See F3.
- Case "A turn with an empty tool id": see F6.
- Check 3 of "Verify": `grep -rn "NestedCards\|Cards.svelte" .../NestedCards.svelte` also prints line 3, the head comment "(Cards.svelte)", on the unchanged tree and after. "shows only a type-only import" cannot hold while that comment stands. Say "the only import line it shows is type-only".
- **F2. "`runKey` keeps a test" breaks spec.md:60.** `grep -c 'turn-rows\|runKey' .scratch/migration/agents/guarded.md` prints 0, `grep -n 'runKey\|turn-rows' .scratch/migration/plan.md` prints nothing, and `grep -rln "turn-rows\|groupTurns\|runOpen\|runWords" tests` prints nothing. So "the tests of the transcript's rows" do not exist. `tests/views/sessions/terminal/` holds only `kill-arm.client.test.ts`. A new test needs a new entry, which is Axel's, and spec.md:36 bars the builder from `.scratch`. Either book an open item for an entry, or drop the test and read the key. My judgment: drop it, since a wrong key costs one wrong disclosure.
- spec.md:33,89 need a named worktree and base copy. The brief names neither; O118's did at `briefs/O118.md:25`. Add them before dispatch.
- No case checks a place the step does not change.

## 5. The question

Cases:
- Menu cases on a person's turn, a tool row, across rows: pass only at the look. A menu that opens but copies wrong text passes unless the look reads the clipboard. Add "paste what Copy gave" to the look.
- Answer, one menu: no.
- No selection: see section 4.
- Image, Doc view: these guard existing behaviour and prove nothing of the goal.
- Target null and return: yes, if the input is order A, since by my reading it passes on the unchanged tree. "A pressed run through a terminal's end" in the look has the same flaw. Name the input: Live then Transcript in a tab, and a popped-out window at a terminal's end.
- New first read, same key: pure, cannot be passed by accident, subject to F2.
- Other session and back, closed failed run, two tabs, `movedRun`: no for each, read at `file:line`.
- Empty id: yes, it passes with the collision of F6.
- `cycles.test.ts`, 7 passed: reaches the goal for runtime imports; `graph.ts` also reads `import()`.
- Settings nested cards: needs the look; svelte-check alone does not draw.

Step line's check: the cycle part holds. The menu and pressed-run parts hold only with the look's named inputs.

What to build:
- Item 1: no, given F5.
- Item 2: yes for "drawn anew" if order A is the input (F3). Otherwise no.
- Item 3: no.
- Item 4: a Help sentence, not checkable beyond reading.

## 6. Implied inputs

- Pick after the selection changed: `heard` is taken at the right-click, so Copy gives the text read then, also when turns arrive under an open menu. Expected and as in Markdown today. State it.
- A right-click with a selection, below the last row in `.chat`, or on the `.older` line: outside `.turns`, so nothing opens. A selection that starts on `.older` gives no Copy. Expected; name it, since "anywhere in the list" does not cover it.
- Menu key or Shift+F10 on a focused control, a run's `RowButton`, a link or a code block's Copy control: `keys` opens through `read` at the control's edge, giving Copy with a selection and nothing without (`ContextMenu.svelte:136-142`). No menu is nested inside; `PaneBody.svelte:337` is for an empty pane only and `Terminal.svelte` has none around the body. So `own` is not needed. Expected; add it to the look.
- Agent's transcript tab: `tab.transcript` holds `{session, agent}`, so the target is never null. The menu and presses work as elsewhere, and moving to another agent empties the choices. No SteerBox.
- Tab moved to another pane: the choices are lost, as on main (F4). Page switch: the same. HELP line 459's "A press is kept" stays loose but not newly false.
- Live then Transcript: on main the press is lost; after the step it is kept. This is a user-visible change and belongs in the report's before and after.
- A tab whose shown terminal changes to one of another session: emptied, as on main.
- Same tool id twice in one read: `turns.ts` does not dedupe, so two runs would share a press if a file repeats a call. Not checked on real files.

## 7. ADRs

`ls docs/adr` prints "No such file or directory". Confirmed; the brief says so.

## 8. Dictated text

- `import Self from './Cards.svelte'`: accepted by svelte-check in a scratch pair of components, 0 errors. `graph.ts` and the comment at `cycles.test.ts:35` treat a self-import as no cycle. No rule in spec.md or `eslint.config.js` bars it (`grep -n 'self-import\|no-cycle\|import-x\|import/'` prints nothing). No other self-import in `src/lib`; `grep -rn "import Self\|svelte:self"` prints nothing.
- `<NestedCards Cards={Self} ... />` with "the prop typed with a type-only import of `Cards.svelte`":

**F8. If the type import keeps the name `Cards`, svelte-check fails.** Run in the scratch pair with `import type Cards` and `type Props = { Cards: typeof Cards; ... }`: "'Cards' is referenced directly or indirectly in its own type annotation", 2 errors. With `import type CardsView from` and `Cards: typeof CardsView`: "svelte-check found 0 errors". Dictate the second name, and carry it to `ComponentProps<typeof ...>` at `NestedCards.svelte:79`. The name `Self` and the capitalised prop are the first of their kind in the tree (`grep` over Svelte props prints none); the rules are silent on both.
- Also dictated: the verify command of check 3, see section 4. `docs/HELP.md` "after line 457": line 457 is the "In Transcript" bullet, and the range 457-458 holds a new bullet or a sentence.
- `grep -n` of the brief for "not X but Y" forms and history words was not run; read by eye, "no longer" at lines 28 and 30 is brief prose, not a comment or a test title.

## Declined to judge

- Which path caused the O115 sighting; reading does not settle it.
- Browser facts marked "not run": right-click word selection, drag selection in a button, Svelte's flush timing.
- Whether order B's closing tab breaks G147 or the step line. That is a ruling.
- Whether choices should move to the tab's ui record to survive a move or a reload. That widens the step.


## Closed

- F1: split named, `transcript/TurnList.svelte`, in item 1 and the paths.
- F2: the `runKey` test dropped; the key is read and goes to the look. No guarded entry is asked for.
- F3: the premise on the terminal's end rewritten with both orders and what O118's derived `agentId` changed. Order B's tab draws its grids, as ruled for a tab with no session, so it raises no open item.
- F4: Decision 2 rewritten.
- F5: the menu stands outside the `.turns` box, in item 1.
- F6: the key's fallback is stamp, name and summary of the first call, in item 2 and the case.
- F7: no change; the diagrams stay in the paths.
- F8: `CardsView` dictated in item 3.
- F9: `tests/state/system/config/sparse-card.test.ts` added to the verify list.
- Section 1: `proseAt`'s signature and `Document.svelte` stated; `Markdown.svelte`'s and `TranscriptBody.svelte`'s comments named.
- Section 4: cases rewritten; check 3 rewritten; worktree and base copy named.
- Section 5: the look reads what Copy gave and names its inputs.
- Section 6: the implied inputs added to the cases.

Usage: a6c9625db56cd6374, claude-opus-5-5, 219620 tokens, 35 tool uses, 10 min 36 s.
