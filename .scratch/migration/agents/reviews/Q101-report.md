Everything in the brief, the cases ruling and repair round 1 is built. The verify list is not green: `checks.sh` stops at `npm test` with 3 failing tests, all in files and lines this step does not change (named under "Verify"); the five commands after it, run one by one, exit 0.

## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

- Z45, Q87's import-graph half cannot rest on dependency-cruiser as LA11 (a) assumed (raised 2026-09-29, by the orchestrator at `/spec` Q87). Probed on main at 414d27fa with dependency-cruiser 18.4.0 (MIT, 2026-09-20) in a scratch folder: it resolves `$lib` (with the alias given) and reads an `import()` in a component's markup as a dynamic import, as the plan asked to prove. But it compiles every `.svelte` file with the Svelte compiler before reading it (`src/extract/transpile/svelte-wrap.mjs`), so a component's type-only imports never reach it. Over `src/lib` the hand reader (`tests/checks/imports/graph.ts` `importGraph(..., true)`) finds 2877 import edges and dependency-cruiser finds every one of them except 199, all from `.svelte` files, 198 of them `import type` and one an inline `{ type Tab }` (`ui/tabs/TabFace.svelte:19`). The folder order (`order.ts`) and the boundary rows (`boundaries.test.ts`) read type-only imports, by DESIGN.md:174 ("a type a folder takes from a folder above it ties the two as an import does"). The runtime edges agree. `bin/diagrams/imports.mjs` stays whichever way, since `code.mjs` and `parsed.mjs` read comments and calls through its parses. The jscpd half works: jscpd 5.3.3 read 1255 files of `src/lib` in 1.6 s and found 132 clones at eight lines, a component split into its script, markup and style blocks. Options:
  - (a) Keep the import checks hand-written (LA11 (c)), and Q87 is the duplication check on jscpd alone (LA12 (a)); Q72's measures run through the hand checks. Pros: every check keeps reading every import, types in components included, through one reader for the checks and the diagrams, as DESIGN.md:174 requires. Cons: about 740 lines of the import checks stay, among them the cycle finder (`graph.ts` `findCycles` and `walk`, about 75 lines).
  - (b) dependency-cruiser for what reads runtime imports only (the cycle check and the diagrams' import edges), the hand reader for the folder order, the boundary rows and the augmentation check. Pros: the cycle finder goes, and the cycle rule is dependency-cruiser's `no-circular`. Cons: two readers and two resolvers of one module, which DESIGN.md:174 rules out so that the checks and the diagrams cannot read a module apart; about 75 lines removed against a new dependency and its configuration.
  - Not offered: dependency-cruiser alone with the components' type-only imports left out of the folder order and the boundary rows, which drops 199 checked imports, a loosened check.
  - Recommendation: (a). The library cannot see what the order and the boundary rows hold, and (b) buys the cycle finder's 75 lines with a second reader the design forbids. (a) is also the cheaper option; it is recommended because it keeps the checks whole, not for its cost.
- Z46, D13 as one step or three (raised 2026-09-29, by the orchestrator at `/spec` D13). D13 replaces the source tab's editor, X3b's diff pane and the merge view with Monaco. Counted on main at e0fea3a2 with `wc -l`: the code it rewrites or removes is 3,272 lines (`views/sources/source/` Editor 431, Source 421, Gutter 185, Preview 79; `views/sources/repositories/diff/` Diff 402, DiffFile 391; `merge/` Merge 290, MergeSide 177; `views/shared/code/Code.svelte` 151; `state/sources/repositories/` diff-rows 295, merge-regions 242, diff-words 132, diff-patch 76). The library audit's spike estimates 1,500 to 2,100 new hand-written lines (`library-audit.md` LA9). The step also changes the `api/git` answer to carry both versions of a file (a wire change), adds the `code_theme:` key to `config/appearance.yml` with a Settings control (LA22 (a)), and starts with a proof that `@shikijs/monaco` 4.4.3 works with monaco-editor 0.57, which the spike did not prove. As one step that is one builder for many hours and a diff of several thousand lines that must be read whole, sharing files with the repositories, Settings and key-handling steps. Options:
  - (a) Split D13 into three steps, each with its own brief, review and landing. D13a: the source tab on Monaco, meaning the `ui/editor/` primitive, the theme read from the tokens with 3-digit hex expanded, `typingIn` treating Monaco's EditContext as typing, Cmd+K kept for the palette with Monaco's Cmd+K chords removed and their actions listed in the palette (LA21 (a)), the languages through `@shikijs/monaco` with its fit proven first, and the gutter D11 needs. D13b, after D13a: every single-file diff in Monaco's diff editor, `api/git` answering both versions, hunk and line staging over `diff-patch.ts`, X3b's hand diff removed, and the three-way regions from `node-diff3` drawn as Monaco editors. D13c, after D13a and beside D13b: the `code_theme:` key and its Appearance control. D23 then waits on D13a. Pros: each diff can be read whole and reviewed, and a failed fit (the Shiki proof) stops only D13a. Cons: three dispatches, three landings.
  - (b) D13 as one step, as the plan has it. Pros: one landing. Cons: the review and the landing read a diff of several thousand lines, and nothing that touches the repositories views, Settings or the keys can run beside it.
  - Recommendation: (a), for the same reason Q79 was split (Z37). (b) is the lazy option.
- Z47, X3c's order and three names and settings it would otherwise choose (raised 2026-09-29, by the orchestrator at `/spec` X3c). X3c is every row of the Editor tabs table of `agents/reviews/vscode-parity.md` (pinned tabs, the tab context menu with close others, to the right and all, editor actions at the strip's end, breadcrumbs, wrapped tabs). On main at 1d31d8aa: the tab strip has no context menu (`grep -rn contextmenu src/lib/ui/tabs src/lib/shell/panes` prints nothing); the strip scrolls (`ui/tabs/tab-scroll.svelte.ts`) and nothing wraps it; `ui/tabs/Breadcrumb.svelte` has one user, the Files view; and oculus's "pin" ties a view to a session (`state/workbench/layout/instances.ts:99` `pinInstance`, labelled "Pin this pane" at `config/text/views/sessions/session-list.yml:43`), which is not VS Code's pinned tab (a tab kept at the strip's start that Close Others leaves open). Q88 also builds a right-click menu for tabs, on the menus Q81 moves to bits-ui. Questions:
  1. Order. (a) X3c after Q81 lands, so the tab menu is built once, on bits-ui, as Q96 waits for Q81; Q88 then leaves the tab menu to X3c. (b) X3c now, with the tab menu on the hand-written `ui/menu`, which Q81 then moves to bits-ui with the other menus. Recommendation (a). (b) is the lazy option: it starts sooner and builds the menu twice.
  2. The two pins. (a) VS Code's pinned tab is called "Pin", as in VS Code, and oculus's session pin is renamed "Lock to this session" (labels only, the state unchanged). (b) VS Code's pinned tab is called "Keep at start", and the session pin keeps "Pin this pane". Recommendation (a), since the migration copies VS Code's words. (b) is the lazy option.
  3. Wrapped tabs. VS Code has it as a setting, off by default. (a) A key in `config/appearance.yml`, `wrap_tabs: false` by default, with a toggle in the Settings view's Appearance section. (b) The strip always wraps. (c) The strip always scrolls, and the row is dropped from X3c. Recommendation (a), as VS Code has it; the key's name is yours to rule. (c) is the lazy option.
  4. Breadcrumbs. (a) The path of a file tab (the source tab, a document, a PDF) shown above its body as `Breadcrumb.svelte` segments, a segment opening the Files view at that folder; symbols in the path wait for D23's language servers. (b) Breadcrumbs only after D23, with symbols. Recommendation (a). (b) is the lazy option.

## The cases' first run (unchanged tree, before any code change)

`Test Files  6 failed | 2 passed (8)`, `Tests  15 failed | 116 passed (131)`. Failing: the whole of `tests/state/sessions/terminal-tabs.test.ts` (module missing), the whole of `tests/state/client/terminal-tabs.test.ts` and `tests/shell/keys/workbench-keys.test.ts` (`showTerminal`, `moveTerminal`, `composeIn` missing), `composer.test.ts` "keeps the tab's other choices when a Split writes into a tab that holds a record", `repositories.test.ts` "asks for a shell in the worktree it just made, and shows the terminal" and "asks for a shell in a worktree that is already there", and in `tests/views/sessions/terminal.test.ts` the steer-box, one-terminal, list, split and tab-rows cases. The hand-back that followed produced the cases ruling at the end of this report.

## What was built

| Item | State | Where | Proved by |
|---|---|---|---|
| 1. A tab's own state | DONE | `src/lib/state/sessions/terminal/terminal-tabs.ts` (shape with `id`, readTab, ownerOf, withTerminal, withoutTerminal, reordered, splitWith, showingOne, showingRow, splitAt, composingIn, withStarted, splitDrawn, pageTarget) | `tests/state/sessions/terminal/terminal-tabs.test.ts` |
| 2. The store keeps ownership | DONE | `src/lib/state/sessions/terminals.svelte.ts` closeEnded, afterReceive, showTerminal, moveTerminal, composeIn; wiring `src/lib/state/client/context.ts:168-194` | `tests/state/client/terminal-tabs.test.ts` |
| 3. The Terminal view | DONE | `Terminal.svelte` (304 lines), `TerminalGrid.svelte` (258), `TerminalList.svelte` (389), `terminal-list.ts` | `tests/views/sessions/terminal.test.ts`, `tests/views/sessions/sessions.test.ts` |
| 4. Every start through `showTerminal` | DONE | UpdateTray, SessionDetail, DatasetCard, ProjectCard, Latex, SessionList (resume, fork, New, own pane), TerminalRows, `repositories.svelte.ts`; the `n` key through the store's `composeIn` | client test, `repositories.test.ts`, `workbench-keys.test.ts` |
| 5. Docs | DONE | `DESIGN.md:266`, `:273`, `:208`; `HELP.md:121`, `:123`; head comments; `docs/diagrams/*` | `npm run diagrams` exit 0 |
| Round 1, 1. Page-wide order store gone | DONE | `pageViewState`, `setPageViewState` removed from `state/workbench/layout.svelte.ts`; `views?:` and its comment from `layout/model.ts`; `viewStates`, the `known` parameter of `parseLayout`, `knownRule` and `registerViews` (which fed only it) from `layout/saved/saved.ts`, `layout.svelte.ts` and `client/context.ts` | `pages.test.ts` "reads a page saved with a views field without it, and saves it again without the field" |
| Round 1, 2. One New | DONE | `workbench-keys.svelte.ts` Options `composeIn`, the `n` key calls `options.composeIn(pageOf())`, its own copy of the rule gone; `shell/Workbench.svelte` hands `client.terminals.composeIn`; the re-export block of `terminals.svelte.ts` gone, `isTerminalId` imported from `terminal/terminal-tabs.ts` by `selection.svelte.ts` and `terminals.test.ts` | `workbench-keys.test.ts` "calls the New it was handed, for the page the focused pane is in" |
| Round 1, 3. A composing tab stays | DONE | `terminals.svelte.ts` closeEnded `next.terminals.length === 0 && !held.composing`, moveTerminal `left.terminals.length === 0 && !was.composing` | two client cases "leaves a tab the reader is composing in open, its composer alone and its record kept" |
| Round 1, 4. New clears a Split's record | DONE | `composer.ts` `freshComposer`; `composeIn` writes it before restating; the bar's New (`Terminal.svelte` `composeHere`) does the same | client case "clears a Split's folder and kind from the tab's composer, keeping its accounts and picks"; `sessions.test.ts` audit "the bar's New puts the composer's folder and kind back" |
| Round 1, 5. Tests for the two unproven changes | DONE | `SESSION_VIEWS` and `sessionViewShown` moved to `views/shared/card/card.ts` (the folder holds 10 items, so the rule joined the existing module rather than a new file); `CardSessions.svelte` reads it | `card.test.ts` two cases; client cases "clears at the first message a selected terminal no tab owns that the message does not list" and "keeps at the first message a selected terminal no tab owns that the message lists" |
| Round 1, 6. Sentences made true | DONE | `Composer.svelte` head comment; `model.ts` sentence gone with the field; `folds.ts` `TerminalChoice` (its unread `id` and `created` fields removed, with `folds.test.ts`); `layout.svelte.ts` head comment; `terminals.svelte.ts` and `Terminal.svelte` head comments, `DESIGN.md:266`, `:273` and `HELP.md:123` for items 3 and 4; the two test texts in `sessions.test.ts` reworded | `grep -rn "pageViewState\|setPageViewState\|registerViews\|viewStates" src tests` prints nothing |

## Verify

1. `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md </dev/null`, run once at the end of round 1 from the worktree's tools/oculus, exit 1. Every line it printed:

```
$ npm test

> oculus@0.0.1 test
> vitest run --tagsFilter '!slow'


 RUN  v4.1.11 /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q101/tools/oculus

 ❯ tests/views/whole/type-scale.test.ts (238 tests | 1 failed) 108ms
     × sets every local role in personal/calendar/Calendar.svelte 4ms
 ❯ tests/checks/source/comment-width.test.ts (2 tests | 1 failed) 1001ms
     × ends by the hundredth column everywhere under src, tests and bin 999ms
warning: You appear to have cloned an empty repository.
 ❯ tests/checks/tree/scratch.test.ts (10 tests | 1 failed) 3017ms
     × is planted with the files given, and refuses one whose path leaves it 9ms
Rebasing (1/1)
error: could not apply bc2015b... Main
hint: Resolve all conflicts manually, mark them as resolved with
hint: "git add/rm <conflicted_files>", then run "git rebase --continue".
hint: You can instead skip this commit: run "git rebase --skip".
hint: To abort and get back to the state before "git rebase", run "git rebase --abort".
hint: Disable this message with "git config set advice.mergeConflict false"
Could not apply bc2015b... Main
Rebasing (1/1)
error: could not apply c9524fb... Main
hint: Resolve all conflicts manually, mark them as resolved with
hint: "git add/rm <conflicted_files>", then run "git rebase --continue".
hint: You can instead skip this commit: run "git rebase --skip".
hint: To abort and get back to the state before "git rebase", run "git rebase --abort".
hint: Disable this message with "git config set advice.mergeConflict false"
Could not apply c9524fb... Main
Rebasing (1/1)
error: could not apply bd2aa64... Main
hint: Resolve all conflicts manually, mark them as resolved with
hint: "git add/rm <conflicted_files>", then run "git rebase --continue".
hint: You can instead skip this commit: run "git rebase --skip".
hint: To abort and get back to the state before "git rebase", run "git rebase --abort".
hint: Disable this message with "git config set advice.mergeConflict false"
Could not apply bd2aa64... Main
To /var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-deposit-test-d8VXa9/remote/alpha-code.git
 * [new branch]      HEAD -> main

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 3 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  tests/checks/source/comment-width.test.ts > a comment line > ends by the hundredth column everywhere under src, tests and bin
AssertionError: expected [ …(3) ] to deeply equal []

- Expected
+ Received

- []
+ [
+   "src/lib/views/personal/calendar/Calendar.svelte:355",
+   "tests/views/whole/tinted.test.ts:13",
+   "tests/views/whole/tinted.test.ts:44",
+ ]

 ❯ tests/checks/source/comment-width.test.ts:63:23
     61|             )
     62|         );
     63|         expect(found).toEqual([]);
       |                       ^
     64|     });
     65|

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/3]⎯

 FAIL  tests/checks/tree/scratch.test.ts > a scratch directory > is planted with the files given, and refuses one whose path leaves it
AssertionError: expected true to be false // Object.is equality

- Expected
+ Received

- false
+ true

 ❯ tests/checks/tree/scratch.test.ts:239:56
    237|             /outside its scratch directory/
    238|         );
    239|         expect(existsSync(join(dir, '..', 'out.txt'))).toBe(false);
       |                                                        ^
    240|         sweepScratch();
    241|     });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/3]⎯

 FAIL  tests/views/whole/type-scale.test.ts > the view type scale > sets every local role in personal/calendar/Calendar.svelte
AssertionError: expected '.period=fs-md | footer=fs-sm | .grid …' to be '.period=fs-md | footer=fs-sm | .grid …' // Object.is equality

Expected: ".period=fs-md | footer=fs-sm | .grid :global(.ec)=fs-sm"
Received: ".period=fs-md | footer=fs-sm | .grid :global(.ec)=fs-sm | .grid :global(.ec-list .ec-event-title)=fs-sm | .grid :global(.ec-list .ec-event-title)=fs-sm"

 ❯ tests/views/whole/type-scale.test.ts:337:49
    335|     for (const [file, expected] of Object.entries(VIEWS)) {
    336|         it(`sets every local role in ${file}`, () => {
    337|             expect(typeRules(join(ROOT, file))).toBe(expected);
       |                                                 ^
    338|         });
    339|     }

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[3/3]⎯


 Test Files  3 failed | 345 passed (348)
      Tests  3 failed | 5603 passed | 1 skipped (5607)
   Start at  01:45:10
   Duration  94.64s (transform 12.37s, setup 0ms, import 82.77s, tests 262.08s, environment 75ms)

checks: failed with exit 1: npm test
```

The three failures, one line each:
- comment-width: `Calendar.svelte:355` and `tinted.test.ts:13`, `:44`, lines this step does not change (fixed on main).
- type-scale, Calendar entry: `Calendar.svelte` is not changed by this step; its change to `type-scale.test.ts` is the Terminal and TerminalGrid lines only (fixed on main).
- `scratch.test.ts` "is planted with the files given, and refuses one whose path leaves it": its line 239 asserts that no `out.txt` sits in the system temporary directory, and `ls -la $TMPDIR/out.txt` shows one there, 38 bytes, dated Sep 29 01:16, which no command of this step made; the file is identical to main's and fails alone too (`npx vitest run tests/checks/tree/scratch.test.ts`: `Tests  1 failed | 9 passed (10)`). The file was left in place, since this step did not make it.

`checks.sh` stops at the first failure, so the other five commands were run one by one through `bash -o pipefail -c`, each exit 0: `npm run check` (`COMPLETED 1486 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`), `npm run build`, `npm run format:check` (`All matched files use Prettier code style!`), `npm run lint`, `! LC_ALL=C grep -rna '[^ -~]' src tests`.

2. `grep -rn "followsSelection\|composerTarget\|composerState\|pinnedTerminal\|storedOrder\|withOrder\|pageViewState\|setPageViewState\|registerViews\|viewStates" src tests` prints nothing (exit 1).
3. `wc -l src/lib/views/sessions/terminal/*.svelte`: AttachPicker 152, Composer 425, Terminal 304, TerminalGrid 258, TerminalList 389, TerminalTitle 61.
4. `npm run diagrams` exit 0 after the round's changes.
5. `bash bin/folder-check.sh` exit 0; `src/lib/views/shared/card` holds 10 items.

## Files, line counts before and after

"Before" is the main checkout's copy at the time of round 1 (no git command may be run, so base a6f61d7e was not read), except `TerminalRows.svelte`, whose base count is 197 as the reviewer read it with `git diff a6f61d7e --numstat`. Q79d shares `TerminalRows.svelte`, `DESIGN.md` and `docs/diagrams`.

| File | Before | After |
|---|---|---|
| src/lib/state/sessions/terminal/terminal-tabs.ts | new | 291 |
| src/lib/state/sessions/terminal/composer.ts (moved from src/lib/state/sessions/composer.ts) | 297 | 321 |
| src/lib/state/sessions/terminals.svelte.ts | 664 | 716 |
| src/lib/state/sessions/folds.ts | 282 | 301 |
| src/lib/state/client/context.ts | 322 | 330 |
| src/lib/state/workbench/selection.svelte.ts | 63 | 58 |
| src/lib/state/workbench/layout.svelte.ts | 680 | 638 |
| src/lib/state/workbench/layout/model.ts | 163 | 162 |
| src/lib/state/workbench/layout/saved/saved.ts | 447 | 427 |
| src/lib/state/sources/repositories/repositories.svelte.ts | 359 | 362 |
| src/lib/shell/Workbench.svelte | 382 | 383 |
| src/lib/shell/keys/workbench-keys.svelte.ts | 447 | 432 |
| src/lib/shell/rail/UpdateTray.svelte | 263 | 258 |
| src/lib/views/sessions/terminal/Terminal.svelte | 497 | 304 |
| src/lib/views/sessions/terminal/TerminalGrid.svelte | new | 258 |
| src/lib/views/sessions/terminal/TerminalList.svelte | 367 | 389 |
| src/lib/views/sessions/terminal/terminal-list.ts | 151 | 146 |
| src/lib/views/sessions/terminal/Composer.svelte | 423 | 425 |
| src/lib/views/sessions/session-list/SessionList.svelte | 325 | 321 |
| src/lib/views/sessions/session-list/TerminalRows.svelte | 197 | 204 |
| src/lib/views/sessions/session-list/Customizations.svelte | 247 | 247 |
| src/lib/views/sessions/session-detail/SessionDetail.svelte | 491 | 485 |
| src/lib/views/shared/card/card.ts | 100 | 123 |
| src/lib/views/shared/card/CardSessions.svelte | 134 | 119 |
| src/lib/views/shared/card/ProjectCard.svelte | 476 | 475 |
| src/lib/views/shared/sessions/SteerBox.svelte | 171 | 171 |
| src/lib/views/sources/data/DatasetCard.svelte | 192 | 186 |
| src/lib/views/boards/project/Latex.svelte | 242 | 240 |
| config/text/views/sessions/composer.yml | 36 | 35 |
| config/text/views/sessions/terminal.yml | 31 | 31 |
| config/text/views/sessions/session-list.yml | 68 | 67 |
| DESIGN.md | 322 | 322 |
| HELP.md | 294 | 294 |
| tests/state/sessions/terminal/terminal-tabs.test.ts | new | 278 |
| tests/state/sessions/terminal/composer.test.ts (moved from tests/state/sessions/composer.test.ts) | 381 | 381 |
| tests/state/client/terminal-tabs.test.ts | 139 | 381 |
| tests/state/sessions/terminals.test.ts | 508 | 445 |
| tests/state/sessions/folds.test.ts | 352 | 370 |
| tests/state/workbench/selection.test.ts | 59 | 51 |
| tests/state/workbench/layout/pages.test.ts | 708 | 628 |
| tests/shell/keys/workbench-keys.test.ts | 401 | 425 |
| tests/state/sources/repositories/repositories.test.ts | 816 | 824 |
| tests/views/sessions/terminal.test.ts | 399 | 456 |
| tests/views/sessions/sessions.test.ts | 639 | 627 |
| tests/views/shared/card/card.test.ts | 97 | 117 |
| tests/views/whole/type-scale.test.ts | 348 | 348 |
| docs/diagrams/* (rerun) | | |

Paths beyond the brief, the ruling's widening and round 1's list: `tests/views/sessions/sessions.test.ts` and `tests/views/whole/type-scale.test.ts` (tests of the changed views), `config/text/views/sessions/session-list.yml` (`pin_glyph`, left unread), `HELP.md`'s session-list row, `src/lib/state/sessions/folds.ts` with `tests/state/sessions/folds.test.ts` (`TerminalChoice`'s `id` and `created`, read by nothing after the step), `src/lib/views/shared/card/card.ts` with `tests/views/shared/card/card.test.ts` (round 1 item 5), and `src/lib/state/client/context.ts`'s `registerViews` call (round 1 item 1).

## Judgment calls

- The tab's `id` (ruling 2) is part of `TerminalTabState`; `readTab` gives a state without one a fresh `crypto.randomUUID()`.
- `showTerminal(id, label?)` takes an optional label, used by the Repositories shell so the tab is named after the package until the terminal's own name arrives.
- `splitState(folder, agent, held?)` keeps the accounts and picks of the tab's composer record when Split writes into a tab that holds one; `freshComposer(held?)` does the same for New, with the folder and kind of a new composer (workspace empty, so the composer starts in the hub, and Claude).
- The bar's New in `Terminal.svelte` resets the composer record as the store's `composeIn` does, so both New controls behave alike.
- The wiring's `restate(id, page, state)` ignores `page`, since `restateInstance` finds an instance by id across pages.
- New in an unsplit tab appends the started terminal at the end (ruling 3); a row dropped on a tab's body, or below the rows of a list, joins at the end.
- `withShare` keeps the share between 0.1 and 0.9.
- A tab composing when its last terminal ends or leaves keeps its composer shown alone, whether the composer was alone or the right half of a split; a tab not composing closes.
- The `known` parameter of `parseLayout`, `knownRule` and `registerViews` existed only to keep a page's view states, so they went with `viewStates`.
- `SESSION_VIEWS` and the pick's rule moved into `views/shared/card/card.ts`, the card folder's existing helper module, because the folder is at the ten-item limit.
- `TerminalChoice`'s `id` (the session running in a terminal) and `created` were read by nothing after the step, so they were removed rather than described.
- The start sites in components are covered by the store case (ruling 5): no view test file for UpdateTray, SessionDetail, DatasetCard, ProjectCard, Latex or SessionList's resume and fork had a source-read test, so none was added; the client cases "opens no second Terminal tab when the page has one, however many terminals start" and "hands a terminal no tab owns to the active Terminal tab of the page's focused pane" carry their store half, and `repositories.test.ts` the Repositories shell.

A correction to round 0's report: it said a selected terminal no tab owns is "held from closing" on the first `sessions` message. The code (`terminals.svelte.ts`, `if (isTerminalId(selected)) held.push(selected);` feeding `endedTerminals`) does the opposite: on the first message, a selected terminal that the message does not list counts as ended, and the selection is cleared; one the message lists stays selected. Round 1's item 5 case was written to what the code does, and it turns red with that line removed.

## Reader-visible changes (Sessions page, Terminal view; to look at on TEST)

- **Two Terminal tabs on one page, each with terminals of its own.** Before: every Terminal tab listed every terminal of the machine, in one page-wide order saved on the page, and a tab either followed the rail selection or was pinned to one terminal. After: each tab lists only the terminals it owns, in its own order; a tab showing its only terminal names it on the bar; no pin control; no page-wide order is saved.
- **New in a tab.** Before: `new terminal` opened another Terminal tab with a composer. After: the composer shows in this tab (in the right half when the tab is split), in the hub with Claude chosen; the terminal it starts joins this tab at the end and is shown (in a split, it becomes the right half).
- **New after a Split in the same tab.** Before round 1: the composer kept the split row's folder and kind. After: New's composer opens in the hub with Claude chosen, the accounts and options chosen earlier kept.
- **Split on a row.** Before: opened a second Terminal tab beside, with the composer in the row's folder. After: the same tab divides, the row's terminal on the left and the composer on the right in the row's folder and kind, with a handle between them (drag moves the share, double click resets it); what it starts becomes the right half; both rows are marked current; a press on a row outside the split shows it alone.
- **A row dragged to the other tab's list, and to a tab with one terminal.** Before: a row dropped only within its own list, reordering the page-wide order. After: dropped on the other tab's list it moves there at the drop mark and is shown; dropped on the body of a tab showing one terminal it joins the end of that tab; the tab it left closes when it owns nothing more and is not showing the composer.
- **`exit` in the last terminal of a tab.** Before (at the base): tabs pinned to the ended terminal closed on every page; a tab following the selection closed only while the selection still showed that terminal; a terminal selection was cleared and a session selection kept; a composer tab New had put there stayed with its typed text. After: the row leaves the tab that owns it, on any page; that tab closes unless it shows the composer, which stays alone with what was typed; with other terminals left, the next row is shown, else the previous; a selection of that terminal is cleared, any other selection kept.
- **A composing tab whose last terminal ends or is dragged away.** Before round 1: the tab closed with its composer and typed text. After: the tab stays, showing its composer alone with its record and typed text.
- **Closing a tab, then pressing its terminal in the Sessions view.** Before: closing a pinned tab left the terminal running; pressing it selected it and a following tab showed it. After: closing leaves the terminals running and listed in the Sessions view; a press selects it and takes it into the Terminal tab of the page on screen (the active one of the focused pane, else the first, else a new one) and shows it.
- **A session press on a project card with only a Terminal tab open.** Before: the Terminal tab counted as a view following the selection, so the press only selected the session and nothing new showed. After: the press opens the session's detail view beside the board.
- **The Repositories view's shell.** Before: it opened a Terminal tab of its own, pinned to the new shell. After: the shell is taken into the page's Terminal tab (or a new one when the page has none) and shown there, the tab named after the package until the shell's own name arrives.
- **An update task from the tray.** Before: selected the task's terminal and opened a Terminal tab when the page had none, which followed the selection. After: the terminal is taken into the page's Terminal tab (or a new one) and shown there; no second tab opens.
- **A reload with an old saved Terminal tab.** Before: `{ session, label }` was a pinned tab, `{ id }` a composer tab, anything else followed the selection. After: a tab naming one terminal as `session` reads as a tab owning that terminal and showing it; any other old tab reads as a tab owning nothing, showing the composer; a page saved with a `views:` field is read without it and saved again without it.

## For each new or changed case, the change whose undoing turns it red

Round 1's cases, each run with its change undone and the file put back (the undo applied as a text replacement, the case run with `npx vitest run <file> -t <name>`, the file restored and compared byte for byte):

```
===== R1 views field kept | src/lib/state/workbench/layout/saved/saved.ts
     × reads a page saved with a views field without it, and saves it again without the field 9ms
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯
AssertionError: expected [ 'id', 'label', 'views', 'workbench' ] to deeply equal [ 'id', 'label', 'workbench' ]
- Expected
+ Received
+   "views",
 ❯ tests/state/workbench/layout/pages.test.ts:626:52
      Tests  1 failed | 44 skipped (45)
===== R2 n key runs its own copy of New | src/lib/shell/keys/workbench-keys.svelte.ts
     × calls the New it was handed, for the page the focused pane is in 11ms
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯
AssertionError: expected [] to deeply equal [ 'page-two' ]
- Expected
+ Received
- [
-   "page-two",
- ]
+ []
 ❯ tests/shell/keys/workbench-keys.test.ts:398:23
      Tests  1 failed | 2 passed | 22 skipped (25)
===== R3 composing tab closes when its last terminal ends | src/lib/state/sessions/terminals.svelte.ts
     × leaves a tab the reader is composing in open, its composer alone and its record kept 11ms
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯
AssertionError: expected false to be true // Object.is equality
- Expected
+ Received
- true
+ false
 ❯ tests/state/client/terminal-tabs.test.ts:200:34
      Tests  1 failed | 8 passed | 14 skipped (23)
===== R4 composing tab closes when its last terminal is moved away | src/lib/state/sessions/terminals.svelte.ts
     × leaves a tab the reader is composing in open, its composer alone and its record kept 3ms
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯
AssertionError: expected false to be true // Object.is equality
- Expected
+ Received
- true
+ false
 ❯ tests/state/client/terminal-tabs.test.ts:145:34
      Tests  1 failed | 2 passed | 20 skipped (23)
===== R5 New keeps a Split's record | src/lib/state/sessions/terminals.svelte.ts
     × clears a Split's folder and kind from the tab's composer, keeping its accounts and picks 5ms
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯
AssertionError: expected { workspace: '/work/split-row', …(4) } to deeply equal { Object (workspace, agent, ...) }
- Expected
+ Received
+     "claude": undefined,
-   "agent": "claude",
+   "agent": "shell",
-   "workspace": "",
+   "split": "/work/split-row",
+   "workspace": "/work/split-row",
 ❯ tests/state/client/terminal-tabs.test.ts:365:24
      Tests  1 failed | 2 passed | 20 skipped (23)
===== R6 the bar's New keeps a Split's record | src/lib/views/sessions/terminal/Terminal.svelte
     × audits that the bar's New puts the composer's folder and kind back to a new composer's own 13ms
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯
AssertionError: expected '<script module lang="ts">\n    // Lay…' to contain 'setInstanceState(instance.id, freshCo…'
- Expected
+ Received
- setInstanceState(instance.id, freshComposer(instanceState(
+ <script module lang="ts">
+     // Layer 3, view registration. Terminal follows the session list in the Sessions page's group.
+     import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
+     export const registration: ViewRegistration = {
+         id: 'terminal',
+         label: 'sessions.view_terminal',
+         glyph: 'sessions.terminal_glyph',
+         group: 'sessions',
+         order: 1
+     };
+ </script>
+ <script lang="ts">
+     // Layer 3, view. One Terminal tab, a terminal panel of its own as VS Code's terminal panel is:
+     // the tab owns one or more terminals, kept in its own layout state and read through
+     // state/sessions/terminal/terminal-tabs.ts, and draws only those. A terminal belongs to exactly
+     // one tab; the terminals store (state/sessions/terminals.svelte.ts) keeps which, shows a
+     // terminal started anywhere in the tab that owns it or in the page's Terminal tab, and takes an
+     // ended terminal out of its tab, closing a tab left with none. Closing a tab stops nothing.
+     //
+     // The body draws the composer alone while the tab shows no terminal; one grid
+     // (TerminalGrid.svelte) for the shown terminal; and, in a split, the shown terminal on the left
+     // and the second one, or the composer while a Split or New waits for its start, on the right,
+     // with the handle between them moving the left half's share. The bar's `new terminal` shows the
+     // composer in this tab, and what it starts joins this tab. From two terminals on, the tab's
===== R7 'terminal' back in SESSION_VIEWS | src/lib/views/shared/card/card.ts
     × audits that it opens its detail view on a page whose only session view is a Terminal tab 3ms
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯
AssertionError: expected true to be false // Object.is equality
- Expected
+ Received
- false
+ true
 ❯ tests/views/shared/card/card.test.ts:25:66
      Tests  1 failed | 1 passed | 6 skipped (8)
===== R8 the selected terminal not held on the first message | src/lib/state/sessions/terminals.svelte.ts
     × clears at the first message a selected terminal no tab owns that the message does not list 9ms
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯
AssertionError: expected 'e5e5e5-shell' to be null // Object.is equality
- Expected:
+ Received:
 ❯ tests/state/client/terminal-tabs.test.ts:213:45
      Tests  1 failed | 2 passed | 20 skipped (23)
===== R9 freshComposer keeps the folder and kind | src/lib/state/sessions/terminal/composer.ts
     × clears a Split's folder and kind from the tab's composer, keeping its accounts and picks 5ms
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯
AssertionError: expected { workspace: '/work/split-row', …(4) } to deeply equal { Object (workspace, agent, ...) }
- Expected
+ Received
+     "claude": undefined,
-   "agent": "claude",
+   "agent": "shell",
-   "workspace": "",
+   "split": "/work/split-row",
+   "workspace": "/work/split-row",
 ❯ tests/state/client/terminal-tabs.test.ts:365:24
      Tests  1 failed | 2 passed | 20 skipped (23)
```

Round 0's cases:
- `tests/state/sessions/terminal/terminal-tabs.test.ts`: each case is red without its function in `terminal-tabs.ts`: reading old shapes (the `session` branch and the `terminals` filtering of `readTab`), the id case (`freshId` in `readTab`), ownership (`ownerOf`), leaving (`withoutTerminal`'s next-else-previous and split rules), joining (`withTerminal`'s clamp and de-duplication), `reordered`, `splitWith` and `showingOne`, `showingRow`'s split-keeping, `splitDrawn`, New and Split (`composingIn`, `splitAt`, `withStarted`'s insert-after-shown), the label (`withLabel`), and the page target (`pageTarget`).
- `tests/state/client/terminal-tabs.test.ts`: move cases red without `moveTerminal` and its closing of the emptied tab; ended cases red without `closeEnded` taking ended ids out of every tab and clearing the selection. Replacing the tab-held list in `afterReceive` (`const held = terminalTabs().flatMap(...)`) with an empty list turns one case red, "closes at the first message when that message does not list it" (`terminal-tabs.test.ts:226`, `expected true to be false`), and leaves "leaves the tab that owned it, and a tab owning only it closes, on a page not on screen too" green, since that case lists the terminal before it ends. Show cases red without `showTerminal`'s owner branch (page switch, activate, `showingRow`) and its fallback to the active, first, or a new tab; the close case red if closing a tab stopped its terminals or if `afterReceive` took unowned terminals into a tab; New cases red without `composeIn`.
- `tests/views/sessions/terminal.test.ts`: steer-box cases red without `TerminalGrid.svelte`'s `agent` condition and with the old follow-the-selection read; list cases red without `tabRows` filtering to `tab.terminals` and with the pin control back on the bar; split cases red without the `splitDrawn` branch of `Terminal.svelte` and the `current` pair; "draws the composer alone after New" red without `composingIn`'s unsplit branch; the Sessions-view case red with `'terminal'` or an ownership filter in the Sessions list; the tab-rows audit red without `tabRows`.
- `tests/views/sessions/sessions.test.ts`: the Terminal cases red with the pin control back, or with `readTab` reading an old `{ session }` or `{ id }` differently.
- `tests/state/sessions/terminal/composer.test.ts`, "keeps the tab's other choices when a Split writes into a tab that holds a record": red without the `held` argument of `splitState`.
- `tests/shell/keys/workbench-keys.test.ts`, the two n-key store cases: red without the store's `composeIn` handing the composer to the page's Terminal tab or a new one.
- `tests/state/sources/repositories/repositories.test.ts`, the two shell cases: red without `shellIn` calling `terminals.showTerminal(answer.id, label)`.
- `tests/state/sessions/terminals.test.ts`, `tests/state/workbench/selection.test.ts`, `tests/state/sessions/folds.test.ts`, `pages.test.ts`: removals and field removals only (the following-tab, `pinnedTerminal`, page view state and `TerminalChoice` `id`/`created` expectations went with the code).
- `tests/views/whole/type-scale.test.ts`: red if `Terminal.svelte` gains a font rule or `TerminalGrid.svelte` one not listed.

## The cases ruling (Q101-cases.md, verbatim)

## Q101 cases ruling (round 0, 2026-09-29)

The builder handed back before any code change, with the cases' first run (`Test Files 6 failed | 2 passed (8)`, `Tests 15 failed | 116 passed (131)`) and three points the brief gets wrong. Each was checked on the tree: `ls src/lib/state/sessions | wc -l` gives 10 and `tests/state/sessions` holds 10 items before the new test; `stateId` (`state/workbench/layout/instance.ts:92`) is read by `openView` at `open/opening.ts:97-99` to activate an existing tab; `views/shared/card/CardSessions.svelte:27-34` lists `'terminal'` among the views that follow the selected session.

1. **The folder limit: (A).** `src/lib/state/sessions/terminal/` holds `composer.ts` (moved) and `terminal-tabs.ts` (new); `tests/state/sessions/terminal/` holds `composer.test.ts` (moved) and `terminal-tabs.test.ts`. The paths widen to the importers of `sessions/composer`: `views/shared/sessions/SteerBox.svelte`, `views/sessions/session-list/Customizations.svelte`, `views/sessions/terminal/Composer.svelte` and `tests/checks/config/config-folder.test.ts` (import lines only), plus `DESIGN.md`'s boundary lines or text naming `state/sessions/composer` if any, and `docs/diagrams`. The lazy option was (B), the pure rules folded into the store.
2. **The tab's identity: add `id: string`** to the state shape, a random UUID when a tab is opened; an old saved state keeps its own `id` when it has one, and one without gets a fresh one when read. `openView` then opens a new tab for each new state.
3. **New and Split: (a).** New in an unsplit tab sets `shown` to null and `composing`, so the composer shows alone, and what it starts joins at the end of the tab's order and is shown. New in a split tab keeps both halves with the composer in the right half; what it starts is inserted after `shown` and becomes `beside`. Split on a row is `shown` = that row with `composing`. The split is drawn when `shown !== null && (beside !== null || composing)`. The brief's "joins this tab after the shown one" for New in an unsplit tab is replaced by "joins at the end", as VS Code's New Terminal appends.
4. **`CardSessions.svelte` widens the path list:** `'terminal'` leaves `SESSION_VIEWS`, since the Terminal view no longer follows the selection; its test, if one reads the list, changes with it.
5. **The start sites in components** (the update tray, SessionList resume and fork, SessionDetail, DatasetCard, ProjectCard, Latex): their store half is tested in the client test as the builder describes; each component's call is checked by a source read in the view tests only where that file already has such a test, and otherwise named in the report as covered by the store case.

The report carries this ruling.

## Repair round 1

Every item of `agents/briefs/Q101-round1-sent.md` is answered above: items 1 to 6 in "What was built" (rows "Round 1, 1" to "Round 1, 6") with their cases and reverts; item 7 (the file table no longer lists `tests/checks/config/config-folder.test.ts`, which `diff -q` against the main checkout's copy shows unchanged); item 8 (`TerminalRows.svelte` before 197); item 9 (the tab-held list revert under round 0's cases); item 10 (the `exit` row under reader-visible changes); item 11 (the project-card, Repositories-shell, composing-tab and New-after-Split rows); item 12 (the open items at the head, as the main checkout's state file lists them at the end of this round); item 13 (the reverts block).
