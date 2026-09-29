# Step Q88 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q88, base 2a72d052)

This report cites a page (the rules file, a standard, a skill's text) by its section, since a page's line numbers move. A finding in code keeps its `file:line`.

## Verification (rerun by the reviewer)

```
$ (from W/tools/oculus) PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh .../orchestrator-state.md </dev/null   -> exit 0, log .scratch-refute/checks.log
$ npm test
 Test Files  365 passed (365)
      Tests  5781 passed | 1 skipped (5782)
$ npm run check
... COMPLETED 2064 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build            (built, no error)
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint             (no output)
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 6 commands passed
(the "Rebasing ... could not apply" lines inside npm test are the deposit tests' own scratch repositories under $TMPDIR)

$ bash bin/folder-check.sh            -> printed nothing, exit 0
$ npm run diagrams (run on a copy under .scratch-refute/copy, since it rewrites docs/diagrams) -> exit 0; `diff -r copy/docs/diagrams W/tools/oculus/docs/diagrams` prints nothing, so W's docs/diagrams are what the script produces
$ grep -c "timed out" .scratch-refute/checks.log -> 0 (the report's claim that no file timed out holds)
$ tail .scratch-builder/first-run.log -> "Test Files  8 failed (8)" / "Tests  12 failed (12)" (matches the report)
$ wc -l over the files the report counts (menu-items.ts 137, MenuList.svelte 268, Graph.svelte 447, TerminalList.svelte 462, ContextMenu.svelte 146, repositories.svelte.ts 379, HELP.md 297, DESIGN.md 322) -> all match the report
$ grep -n "'k'" src/lib/shell/keys/workbench-keys.svelte.ts -> line 93 `event.key.toLowerCase() === 'k'`, then `options.openPalette('')`: the report's correction that the palette opens on Cmd-K, not Cmd+P, holds
```

Named reverts I ran on a copy under `.scratch-refute/copy` (the copy was restored from W after each one, and `diff -r -q copy/src W/src` printed nothing at the end):
- `worktreeMenu` ignoring `busy`: red ("offers a shell and Delete Worktree ...").
- `changePicked` calling `deps.discard` directly: red (case 7's test).
- `inShownSplit` without `!tab.composing`: red.
- `commitMenu` ignoring `busy` for checkouts: red.
- `pasteRoute` always returning `{ send }`: red (case 12's test).
- `askTagDelete` with the stated revert ("call deps.deleteTag before deps.ask, outside the answer"): **green, 16 of 16 pass**. See Proof 1.

## Verdicts

Items of the brief's "What to build":

- 1 (rule between groups): holds. `MenuItem.rule`, `ruleAbove` and `grouped` are in `menu-items.ts:36-55`. `MenuList.svelte` draws bits-ui `DropdownMenu.Separator` with `.rule { height: 1px; margin: 4px 0; background: var(--line) }`, where 4px is the list's own padding (`FloatingList.svelte:47`). It is never the first line (`index > 0`) and never the last, since it is drawn above an item.
- 2 (Files view): holds. `row-menu.ts` builds file, folder and root menus in the brief's order and groups. A root reveals through `openFolder(dir)` and a folder through `openFile(root, path)` (ruling 4), and relative `.` is used for a root. Standards 1 applies to how its shell is started.
- 3 (Repositories): holds as built, with Behaviour 1 on a name's empty menu. The merge group has no menu, the Untracked group has no Discard (ruling 1), and group heads call the head controls' functions. A repository row uses `shellIn` and `openFolder`, and a worktree row uses `onterminal` and `onremove`. A commit has Open Changes, Copy ID and Copy Message, a Checkout submenu of local branches minus the current one (ruling 7) and a Delete Tag submenu; both the right-click and the "more" `Menu` use `menuOf`. Name menus use `refMenu`, and a switch goes through `switchTo`, which asks (`Repositories.svelte:232-236`).
- 4 (pane): holds. `stripMenu` and `stripPicked` are in `pane-view.ts`. The menu wraps the strip (with right-clicks on tabs filtered out, `onTab`) and an empty pane's `p.empty`. The opener reaches the pane as `onpalette` through the `Workbench.svelte` and `PageLeaf.svelte` snippets. Close is `pick('close')`, and New Terminal is `composeIn(page)`.
- 5 (terminal): violated, Spec 1 (Kill Terminal from the grid and row menus bypasses the row control's arming). The rest holds: Copy only with a selection, Paste through `pasteRoute` onto the same `pasting` question, Select All, Split through `splitOn` (which the row's Split now calls too), Unsplit, Join through `moveTerminal`, and New and New With Profile.
- 6 (text surfaces): holds. `text-menu.ts` covers `TextInput` and `TextArea`, `prose-menu.ts` covers `Markdown.svelte`, and the Document frame's right-click is heard on the frame's document and raised again on the iframe element. Behaviour 2 applies.
- 7 (words): holds. Every label the builders write is `t(...)` of a key, and names from data pass through (ruling 2). Where oculus already had the words, the existing keys are reused (`git.stage_all` "Stage All Changes", `repositories.copy_id`, `repositories.tag_delete`).
- 8 (documents): holds. `DESIGN.md:306` has the one sentence. `HELP.md` has the pane bullet in lines 27-47, sentences in the Files, Repositories and Terminal rows, and the Shift-F10 key row after the `n` row (base line 78). D13a's lines 85 and 87 are untouched.

Cases of the brief's "Cases":

1. met: `files-menu.test.ts` asserts the order and the rules (`| ` markers) above Terminal, Download, Copy Path and Preview.
2. met: same file, the `src/x.py` case.
3. met: same file, the folder case.
4. met: same file. A configured root has no removal, and an added root has Remove last.
5. met: `rowPaths('/tmp/r','notes/a.md')` gives `/tmp/r/notes/a.md` and `notes/a.md`; for the root it gives `/tmp/r` and `.`.
6. met, as ruled: `repositories-menu.test.ts` covers the three groups, with Untracked having no Discard.
7. met: the test records only `ask:` before the answer and `discard:` after it. The revert that makes it red was run.
8. met: Checkout holds `main` alone, Delete Tag holds `v1`, there is no submenu on a bare commit, and the current branch is left out (ruling 7).
9. met: `pane-strip-menu.test.ts`, both states.
10. met: `stripPicked` hands `left` and `top` with the tab, path and page.
11. met: `gridMenu(false)` and `gridMenu(true)`.
12. met: `pasteRoute('a\nb\n')` gives `{ask: 2}` and `'a'` gives `{send}`. Reading `TerminalGrid.svelte` `pasteClipboard` confirms the grid sets the same `pasting` value `holdPastes` sets. The revert that makes it red was run.
13. met: Unsplit on the right half of the split and not on a row shown alone, and Join holds `t2` and `t3` by name.
14. met: `text-menu.test.ts`, plus the read-only case from ruling 8.
15. met: `prose-menu.test.ts`, all four states.
16. met for what a unit test reaches (`ruleAbove` true above an item carrying `rule`, false for a first item). Whether the separator is drawn and whether the arrow keys and type-ahead pass over it cannot be checked here: it needs a DOM and is for the look.
17. met, as ruled: `menu-words.test.ts` finds that the only labels not worded through `t` are exactly the three names handed in, and every key asked for is in the real catalog.

## 1. Spec

1. `src/lib/views/sessions/terminal/Terminal.svelte:86-91`: `/** Kill Terminal from a menu: the terminal stops at once, with no second press. */ async function killNow(terminal) { failure = ''; const answer = await stopTerminal(terminal); ... }`, wired to the grid menu (`onkill={(one) => void killNow(one)}`) and the row menu (`TerminalList.svelte` `rowPicked`, `MENU_KILL -> onkill`).
   - What is wrong: the brief ("What to build", preamble) says a pick "is answered by the function the view's own control for that action already calls, so a menu's Discard asks the same question the row's Discard control asks". Item 5 also says "Split Terminal and Kill Terminal ... as the list's controls do". The row's Kill control is `kill(row)`, which arms first and kills on a second press. The menu calls `stopTerminal` directly.
   - The builder listed this as judgment call 1 ("as VS Code's menu item does"). It is a destructive action the brief routed through the existing control's confirmation, and it is not a gap the brief left open.
   - Failure scenario: a reader right-clicks the grid of a running Claude session to Paste, and the pointer slips one item down to Kill Terminal. The session's tmux process is stopped at once, with no arming step. The same slip on the row control would only arm it.
   - Verdict: makes item 5 violated.
2. Report, "Cases: first run": "The cases added to these files after the rulings (the Untracked menu, names passed through, Checkout without the checked-out branch, the read-only box, the picker and the addable-false case) ... were not run on the unchanged tree."
   - What is wrong: the refute skill counts "a case whose first run on the unchanged tree the report does not give" as a finding. Case 6 in its ruled form and case 17's name pass-through are brief cases whose first run on the unchanged tree is not given. Every such test imports a module that did not exist at base, so it would have been red. The finding is the missing record, not a missing red.
   - Failure scenario: the orchestrator reads the report as a full first-run record and cannot show from it that the ruled forms of cases 6 and 17 were ever red.
   - Verdict: none (the cases are met).

## 2. Proof

1. `tests/views/sources/repositories/repositories-menu.test.ts`, case "audits that asks the Tags section question before a tag goes", annotated `// Revert: call deps.deleteTag before deps.ask in askTagDelete, outside the answer.`
   - What is wrong: I ran that revert on the copy. `askTagDelete` became `deps.deleteTag(name); deps.ask(..., () => undefined);`. The file stayed green: "Test Files 1 passed (1) / Tests 16 passed (16)". The fake `ask` runs `act()` at once, and the test checks only that `asked` has one entry and `gone` is `['v1']`, which a delete made before and outside the question also produces.
   - The report also says "The reverts were reasoned from the code, not each run as a mutation; none was run", and the brief's verify item 4 requires each test to name the revert that turns it red.
   - Failure scenario: `Tags.svelte` and the graph's Delete Tag both go through `askTagDelete`. A change that deletes the tag before the reader answers (or when the reader answers No) passes the suite.
   - Verdict: none (the code is right today; the proof of the case "a tag's removal behind its question" is void).
2. Report, "Judgment calls" 10: "A branch or tag name on the graph with nothing to offer (busy, or a checked-out branch) leaves its right-click to the commit's menu rather than opening nothing."
   - What is wrong: for the busy case, reading the code does not reproduce this claim.
   - `Graph.svelte` `named` passes `items = refMenu(name, kind, busy, t)`, which is `[]` while busy, with `own={false}`. `ContextMenu.svelte:84-86` `pointed` then calls `event.preventDefault()` and returns.
   - The event bubbles to the commit's `ContextMenu` wrapper. Its `oncontextmenu` is svelte-toolbelt's `composeHandlers(pointed, bitsHandler)` (`node_modules/svelte-toolbelt/dist/utils/compose-handlers.js`), which returns before calling any handler once `e.defaultPrevented` is set. bits-ui's own trigger handler also returns on `defaultPrevented` (`node_modules/bits-ui/dist/bits/menu/menu.svelte.js`, `oncontextmenu`).
   - So nothing opens. The checked-out branch is not affected, because it is drawn as a plain span (`refKind` is `'none'`).
   - Failure scenario: Behaviour 1.
   - Verdict: none (the claim is in the report; the defect is under Behaviour 1).

## 3. Standards

1. `src/lib/views/sources/files/tree/row-menu.ts` `rowPicker.shell`: `const answer = await deps.startTerminal('shell', cwd); if (!answer.ok) { deps.say(answer.error); return; } deps.showTerminal(answer.id, nameOf(cwd));`
   - What is wrong: this repeats the body of the repositories store's `shellIn` (`repositories.svelte.ts:221-229`). Ruling 5 of `Q88-cases.md` names `shellIn` as "the function" a shell in a folder goes through. The rules file's principles ("a parser, a fold or a rule exists once and is reused") ask for one start-and-show path. The two now differ only in where a refusal is said. The report does not name this as a judgment call.
   - Failure scenario: a later change to how a shell is started and shown (a label rule, a tab choice) is made in `shellIn`. The Files menu's Open in Integrated Terminal keeps the old behaviour.
   - Verdict: none.
2. `/Users/axelfaes/workspace/research-hub/.agents/worktrees/Q88/.scratch-builder/` (untracked: `checks.log`, `diagrams*.log`, `first-run.log`, `folder-final.log`, `format.log`, `rewrap.py`).
   - What is wrong: this path is not on the brief's list ("The step writes these paths and nothing else"), and nothing in `.gitignore` covers it (`grep scratch .gitignore` finds only `/.agents/worktrees/`). The `land` skill's step 3 stages with `git add -A` of the whole worktree tree.
   - Failure scenario: the wip commit carries `rewrap.py` and the logs onto main, unless the landing's explicit path list leaves them out. The same applies to this review's `.scratch-refute/`.
   - Verdict: none.

## 4. Behaviour

1. `src/lib/views/sources/repositories/graph/Graph.svelte`, snippet `named`: `{@const items = refMenu(name, kind, busy, t)} <ContextMenu label={name} {items} own={items.length > 0} ...>`
   - What is wrong: while a write is in flight on the repository (`busy`), a right-click on a local branch name or a tag name on a commit opens no menu at all, and the browser's menu is suppressed too. The commit's own menu (Open Changes, Copy Commit ID, Copy Commit Message), which the rest of the row opens, is not reached, for the reason given in Proof 2.
   - The comment above the snippet ("a name offering none leaves the right-click to the commit's menu") and the report's judgment call 10 both state the opposite.
   - Failure scenario: during a push, a reader right-clicks the `v1` label on a commit to copy its id. Nothing appears. Right-clicking the subject text beside it works.
   - Verdict: none (item 3's named actions are all present when not busy).
2. `src/lib/ui/forms/TextArea.svelte` (the `ContextMenu ... own` wrapper around `<textarea ... {spellcheck}>`, `spellcheck = true` by default at `:49`), and `TextInput.svelte` likewise.
   - What is wrong: every text box now shows oculus's menu in place of Chrome's. Chrome's menu is where the spelling suggestions for a misspelled word, Look Up and the writing tools appear. A prose field with spellcheck on still underlines a misspelling, but a right-click no longer offers the correction.
   - The report's before and after section says only "Before ... the browser's own context menu" and lists the new items. It does not state this loss. The brief asked for the menu, so this is a missing statement, not a missing item.
   - Failure scenario: a reader writing a commit message or a project note right-clicks an underlined word to pick the suggested spelling and gets Undo, Redo, Cut, Copy, Paste and Select All.
   - Verdict: none.

## Declined to judge

- The reports's first run on the unchanged tree: I did not rerun it. Rebuilding the base tree needs a git command outside the two I may run. I checked the log tail only.
- Everything a DOM decides was left for the look: menus opening on right-click and Shift+F10, focus return, the separator skipped by arrow keys and type-ahead, `execCommand` paste as one undoable edit with focus and caret kept, the Document frame's raised right-click landing at the right point, and `holdMenuKeys` placing the grid menu at the cursor.
- Reveal in Finder on a repository row whose root is a session workspace outside every served root: `openFolder` sends `{ path }`, which DESIGN says answers 403 outside the roots, so the item would always say "Finder could not show it". Whether such roots exist on this machine needs the local config, which I may not open.
- Paths written outside the brief's list: `ui/menu/ContextMenu.svelte` (`read` and `own`), `state/sources/repositories/repositories.svelte.ts` (`revealFile`, `ViewOpener.showInFiles`), `views/sources/files/opening.ts`, `views/shared/forms/NewIdeaForm.svelte`, and `tests/ui/menu/menu-words.test.ts`. Each is reported with its reason, and each serves an item. Whether the widening stands is the orchestrator's call. The new `read` and `own` props of the `ContextMenu` primitive are an API shape the brief did not name.
- Copy Image's fallback (HTML `<img src>` plus the address as text when the bytes cannot be read) goes beyond the brief's "its bytes as image/png". It is disclosed as judgment call 3, and whether it stays is the orchestrator's call.
- Key order in `config/text/views/sources/repositories.yml`: `diff` against main's current copy (Q79b landed) shows only the 11 added lines (`menu_checkout` through `reveal_unserved`), appended after `worktrees_unignored` in the `repositories:` group. No existing key is moved or changed, so the order matches main. The file is not alphabetical on main either, so appending breaks no order convention.
- The builder's disclosed `git --version` run and its read of the Q79b worktree file are process conduct, not something in the diff. Nothing in W's tree carries a trace of either beyond the matching key order.
- Touch long-press on a bits-ui context trigger opens the menu without `pointed` (stale or empty `read` items). This was not judged, since oculus runs on a desktop pointer.

Reviewer usage: 68 tool uses, 286k tokens, 13 min (from the completion notice). One stray file outside the reviewer's scratch folder, `/tmp/q88-gm.bak`, was created during a revert run and deleted in the same run.
