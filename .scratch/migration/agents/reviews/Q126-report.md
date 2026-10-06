Everything in the brief and in repair round 1 is done. One limit was crossed: a `git status` call in the worktree (its output discarded) ran once during round 1; no other git command was run and nothing was changed by it.

# Q126 report

## Open items of the state file

`orchestrator-state.md`, section "Open items", holds no entry; its text is: "An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own."

## The cases' first run, on the unchanged tree

Read in `.agents/worktrees/Q126-base/tools/oculus/` (`diff -rq` of the worktree's `DESIGN.md` and `docs` against it printed nothing before the first edit). `wc -l DESIGN.md docs/*.md README.md HELP.md` there: DESIGN.md 576, apps.md 861, configuration.md 64, files-and-search.md 91, source-control.md 67, terminals.md 69, views.md 233, window.md 82, README.md 48, HELP.md 159.

1. "Fixed git choices" (`:137`) vs `docs/source-control.md:55`. DESIGN.md:137: "Signing is left to git's own `commit.gpgsign` and a pull is a plain `git pull`, so the repository's own configuration decides, and a commit never takes an identity git guessed from the machine, because `user.useConfigOnly` is set for it. No Source Control action pushes with `--force`; the deposit snapshot push (`forcePushSnapshot` of `deposit-git.ts`) is the one forced push in oculus." `source-control.md:55`: "Signing is left to git's own `commit.gpgsign`, so oculus adds no flag. Pull is a plain `git pull`, so the repository's own `pull.rebase` decides between merging and rebasing. A commit sets `user.useConfigOnly`, so it never takes an identity git guessed from the machine. No Source Control action carries `--force`; the push of a deposit snapshot is the one forced push in oculus." Result: the same four choices are stated with their consequences in both places, and `:55` holds two reasons ("so one press of Stage All Changes cannot stage a file nobody looked at", "because oculus shows every repository it knows at once") that DESIGN.md does not. The case's end state does not hold on the unchanged tree.
2. Docking (`:465`) vs `window.md:47-51`. DESIGN.md:465: "Docking: tabs drag between panes and across pages, a drop on a pane's edge splits it, a tab dragged with Alt held floats at the pointer, a pane can be closed whole, maximised and floated, all with keyboard equivalents." `window.md:47` and `:50`: "**Split.** Drag a tab onto the edge of a pane to split that pane ... The pane menu splits without a drag." and "**Float.** ... a tab dragged with Alt held (Option on a Mac) floats at the pointer wherever it is let go". The item holds no decision and no reason; it is a behaviour list that the guide states in more detail. The one sentence the guide lacks is the keyboard equivalents ("all with keyboard equivalents"): `window.md:47-51` does not say that every drag has a menu the keyboard reaches.
3. The tooltip rule (`:548` vs `window.md:70`). DESIGN.md:548: "One tooltip is open at a time: `ui/menu/TooltipGroup.svelte` holds bits-ui's one Tooltip Provider and `src/routes/+layout.svelte` draws the page inside it, so a bubble opening closes the one that was open." `window.md:70`: "One tooltip is open at a time: a bubble opening closes the one that was open." The rule is said in both, the second sentence of DESIGN.md:548 (the focus a closing menu or a dialog gives back opens no tooltip) is also in `window.md:70` ("No tooltip opens during a drag, on the focus a closing menu gives back to its opener, or on the focus a dialog takes or gives back").
4. Worktrees (`:528` vs `source-control.md:63`, `:67`). DESIGN.md:528: "a worktree goes at `<root>/.agents/worktrees/<name>` on a new branch of that name, made by the confirmed `createWorktree` write with a shell started in it, and a root whose `.gitignore` lacks `/.agents/worktrees/` is warned about in the view rather than edited. Removing a worktree is refused over one holding uncommitted changes or untracked files, since the removal takes the folder and everything in it." `source-control.md:63`: "on confirm makes `<root>/.agents/worktrees/<name>` on a new branch of that name from the repository's HEAD, then opens a shell there." and, in the same line, "warned about in the view rather than edited: what a repository ignores is its owner's to decide, and without the rule a worktree made there becomes content of the repository." `source-control.md:67`: "It refuses a worktree holding uncommitted changes or untracked files ... the removal takes the folder away and everything in it with it". The path, the branch, the shell, the warning and the refused removal are in both; the reason for the warning is in the guide only.
5. The Files view's file operations (`:516` vs the `ops.ts` head). DESIGN.md:516: "behind the write token and a write chain of its own, so a long copy holds up another file operation and nothing else. Every path is resolved by real path and must lie inside its root, and a path that is a symbolic link is acted on as the link, never as what it points at; the machine's `config/local.yml` is protected in every operation". `ops.ts:7-10` and `:33-34`: "A path that is a symbolic link is acted on as the link: its parent folder is resolved by real path and its own name is kept ... The folder an item lands in is resolved by real path as well and must lie inside its root" and "Each operation runs behind the write chain `opsWrites`, apart from the workspace chain, so a long copy holds up another file operation and nothing else." The item restates the head comment's sentences, and `files-and-search.md:47` states the taken-name rule ("pasting a Cut onto a taken name asks before it replaces the item, which goes to the Trash") that DESIGN.md:516 states again.
6. The failure scenario. Someone edits `docs/window.md:70` (the tooltip rule) or `docs/source-control.md:63` (the worktree path): on the unchanged tree DESIGN.md:548 and DESIGN.md:528 then state the old rule and the old path, so the edit leaves DESIGN.md false. Case 6 does not hold before the change.
7. The names. `grep -nF -e "**<name>" -e "# <name>" DESIGN.md` on the base copy: Auth 161, The socket 121, PTY 153, Git 135, Apps added while oculus runs 267, Approval 408, Watchers 123, Sessions 127, Normalise 102, Layer 1, data 94, Hot reload 251, Fixed git choices 137, Configuration 88, Client state 167, Boundaries 179, Validate 100, Untyped input 163; `grep -n "^- Sessions are six views, not one" DESIGN.md` prints 466; `grep -n "^- Decks:" DESIGN.md` prints nothing and `grep -n "Decks" DESIGN.md` prints nothing, so `utils/migrations/convert-decks.mjs:4`'s "(DESIGN.md, "Decks")" has no target. `grep -rn 'DESIGN' src tests utils config --exclude=local.yml` (read): the comments citing `:461` (`deposit-git.ts:3`, `deposit.ts:1-4`, `deposit-routes.ts:8`, `git-write.ts:50`, `Confirm.svelte:7`), `:100` (`validate.ts:1`, `integrity.test.ts:5`) and "Untyped input" (`guards.ts:4-5`) hold today; `memories.ts:5`, `audit.ts:4` ("DESIGN.md's rule for the deck write is that the view shows a sentence of its own per refusal"; `grep -n -i "sentence of its own" DESIGN.md` prints nothing), `channel.ts:7` ("The socket accepts nothing from the page except subscriptions and, later, terminal input" is at DESIGN.md:161 under Auth, not under "The socket" at :121) and `deposit.ts:319` ("DESIGN.md's step 6"; `grep -n -i "step 6" DESIGN.md` prints nothing) are false today. One more comment has the same defect as `channel.ts:7` and is not on the brief's list: `src/lib/server/root/socket.ts:6` ("The one exception DESIGN.md's "The socket" names is terminal input").
8. No decision lost: the item table at the end of this report names, for each item of the list, the decision it held on the unchanged tree (its "before" column) and where it stands after the change.
9. `awk 'length>1500' DESIGN.md` on the base copy prints lines 374 (1504), 398 (1512), 479 (2271) and 574 (2070); `wc -l DESIGN.md` is 576.

## The cases after the change

Read in the worktree after the last edit (`DESIGN.md` 569 lines, the guides at their base line counts).

1. "Fixed git choices" vs `docs/source-control.md:55`. DESIGN.md:137 now holds the reasons ("so the repository's own configuration decides", "so that one press of Stage All Changes cannot stage a file nobody looked at", "because oculus shows every repository it knows at once") and the one forced push with its reason ("its orphan commit replaces the remote's `main` outright", from `deposit-git.ts:300-303`). `source-control.md:55` now reads "These git choices have no setting. Untracked files are their own group, as VS Code's `git.untrackedChanges: separate`. Every configured root is listed. Fetch prunes, ... Signing is left to git's own `commit.gpgsign`, so oculus adds no flag. Pull is a plain `git pull`, so the repository's own `pull.rebase` decides ... A commit sets `user.useConfigOnly`, so it never takes an identity git guessed from the machine. No Source Control action carries `--force`." After repair round 1 (below) DESIGN.md:137 no longer restates any behaviour of `source-control.md:55`: it holds the decision that git settings are left to git, the two reasons (Stage All Changes, every root listed) and the reason for the one forced push, and the guide holds the behaviours without reason clauses.
2. Docking. The item is removed; `grep -c "^- Docking" DESIGN.md` prints 0. Its one fact the guide lacked is now at `window.md:51`: "A drop on a pane of a page shown inside another page lands in that page. Every drag has a menu equivalent that the keyboard reaches: the pane menu splits, floats, closes and maximises a pane and moves a tab to another page, and Shift-F10 opens the menu of the focused control." I read `paneMenu` in `src/lib/shell/panes/pane-view.ts:121-160` (Close, Maximise or Restore, Fold, the page choices, Split right and down, Float) against it, and `window.md:54` for Shift-F10.
3. The tooltip rule. DESIGN.md:541 no longer states the one-open-at-a-time rule; it names the provider (`TooltipGroup.svelte`, `+layout.svelte`) and `focusQuietly`, and points to `window.md` ("Focus, tabs and unsaved text"). `window.md:70` holds the rule alone. An edit of `window.md:70` leaves DESIGN.md true.
4. Worktrees. DESIGN.md:522 holds the decision (a folder inside the root that the root's `.gitignore` ignores, so a worktree never becomes content of the repository; a root lacking the rule is warned about and not edited, since what a repository ignores is its owner's to decide) and no literal path or branch. `source-control.md:63` holds the path, the branch, the shell and the warning without its reason; `:67` holds the refused removal. An edit of the path in the guide leaves DESIGN.md true.
5. File operations. DESIGN.md:510 says the writes are under the served roots only, behind the write token, on one write chain of their own apart from the other writes, with the reason, and points to `ops.ts`'s head for the refusals; the symlink and real-path sentences and the `local.yml` protection are in the `ops.ts` head only (`ops.ts:7-10`, `:33-34`), and the taken-name rule stays at `files-and-search.md:47`.
6. The failure scenario. Editing `window.md:70` or `source-control.md:63` leaves DESIGN.md:541 and :522 true, since neither states what the guide states. The same holds for each other pair of the item table: a reason is in DESIGN.md and the behaviour in the guide.
7. The names, `grep -nF -e "**<name>" -e "# <name>" DESIGN.md` on the worktree: Auth 159, The socket 121, PTY 151, Git 135, Apps added while oculus runs 265, Approval 406, Watchers 123, Sessions 127, Normalise 102, Layer 1, data 94, Hot reload 249, Fixed git choices 137, Configuration 88, Client state 165, Boundaries 177, Validate 100, Untyped input 161, and the names cited by description or in a longer sentence: Live data 452, Wire model 454, Opening things in oculus 394, Git writes and the deposit 458, Sessions cover two agents and a shell 460, Unsaved form input is instance state 545. `grep -n "^- Decks:" DESIGN.md` prints 476 (was no hit); `grep -n "^- Sessions are six views, not one" DESIGN.md` prints 463. `grep -rhno 'DESIGN\.md[^"]\{0,20\}"[^"]\{2,60\}"' src tests utils config --exclude=local.yml` prints 17 distinct quoted names, each resolved in the list above. The comments citing by description, read against the new DESIGN.md: `deposit-git.ts:3-6`, `deposit.ts:1-6`, `deposit-routes.ts:8`, `git-write.ts:50-52`, `Confirm.svelte:7` hold against DESIGN.md:458 (`code/` tracked and no `.git`, the mirror clone outside the hub, every write behind the token and a confirm); `validate.ts:1` and `integrity.test.ts:5` hold against :100 (every id resolved, every status in the vocabulary, zero findings against the real hub); `guards.ts:4-5` holds against "Untyped input" (:161). The five rewritten comments: `memories.ts:4-6` and `audit.ts:4-6` no longer cite DESIGN.md ("the view shows a sentence of its own per refusal, and this is the map from word to sentence"), `channel.ts:6-8` and `socket.ts:6` cite "Auth" (where the sentence stands, DESIGN.md:159), and `deposit.ts:318-322` says "the dry run of the deposit" with no DESIGN.md cite. `socket.ts:6` is outside the brief's four and had the same false cite as `channel.ts:7`; item 3 covers "every comment that cites DESIGN.md".
8. No decision lost: the item table below names, per item, what stayed and where each removed fact is said.
9. `awk 'length>1500' DESIGN.md` prints lines 372 (1504) and 396 (1512), the two Apps lines (base 374 and 398). `:479` is now line 476 at 1465 characters and `:574` is line 567 at 1412 characters, each one item, neither split. `wc -l DESIGN.md`: 576 before, 569 after.

## The DONE / NOT DONE table

| # | Check | Result |
|---|-------|--------|
| 1 | `npm run diagrams` then `npm run test:quick` | DONE, output below, every command passed |
| 2 | `npx vitest run tests/checks/source/history.test.ts` | DONE, `Test Files  1 passed (1)`, `Tests  3 passed (3)` |
| 3 | ASCII gate on `DESIGN.md docs/*.md`, spaced-hyphen grep | DONE, the perl gate printed no line (exit 0), the spaced-hyphen grep over DESIGN.md and docs/*.md printed 0 lines |
| 4 | `wc -l` before and after, the count of lines over 1500 characters | DONE, DESIGN.md 576 to 569, the guides' line counts unchanged, awk prints 2 (lines 372 and 396, both Apps) |
| 5 | The names of case 7 | DONE, quoted in case 7 above |
| 6 | History-word grep over the changed comment lines | DONE, below |
| 7 | Prose rules read over every new or changed sentence | DONE, below |
| 8 | Apps section and `docs/apps.md` unchanged | DONE, `cmp <(sed -n 267,431p base/DESIGN.md) <(sed -n 265,429p DESIGN.md)` prints nothing and `cmp docs/apps.md base/docs/apps.md` prints nothing; README.md and HELP.md also `cmp` equal to base |
| 9 | Every listed item reduced, off-list reductions named | DONE, item table below |
| 10 | Guide headings unchanged | DONE, for each of the six guides, `cmp <(grep -n "^#" base/docs/<guide>.md) <(grep -n "^#" docs/<guide>.md)` printed nothing (headings and their line numbers identical); every `docs/x.md ("Heading")` and "<Name> guide (Heading)" cite of the new DESIGN.md text was checked against the guide headings by script and matches one |
| 11 | Unused-exports comparison | NOT APPLICABLE, no code changed except comment paragraphs |

The output of 1 to 4 as printed (the final run, after the last edit):

```
npm run diagrams: exit 0
npm run test:quick: exit 0
test:quick: 11 changed file(s), from git since HEAD
test:quick: 16 test file(s), 10 essential
ok      prettier (0.3 s): All matched files use Prettier code style!
ok      ASCII gate (0.3 s)
ok      svelte-kit sync (1.4 s)
ok      eslint (1.4 s)
ok      svelte-check (5.2 s): 1791313191100 COMPLETED 392 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (7.1 s): Duration  4.63s (transform 4.25s, setup 0ms, import 8.58s, tests 2.28s, environment 3ms)
test:quick: 7.5 s (limit 45.0 s); every command passed
 Test Files  1 passed (1)
      Tests  3 passed (3)
ascii gate printed nothing, perl exit 0
spaced-hyphen grep lines:        0
wc -l DESIGN.md:      569
awk length>1500 lines:        2
  line 372 length 1504
  line 396 length 1512
Apps section byte-identical
```

Not covered by these checks: `test:quick` runs only the tests selected for the changed files and not `tests/checks` beyond the history test run on its own; the plan's whole verify list runs at landing. No browser was opened, so the Help page rendering of the changed guides is not looked at.

Check 6, `grep -n -i -E "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands|[0-9]{4}-[0-9]{2}-[0-9]{2}|\b[OQRDPFWHSMLKCEX][0-9]{1,3}\b"` over the added lines of `memories.ts`, `audit.ts`, `channel.ts`, `deposit.ts` and `socket.ts` (`diff base file | grep '^>'`): no hit.

Check 7: every new sentence is plain, ASCII, one line per paragraph, no em dash, no spaced hyphen standing in for a dash. `rather than` appears where the base had it. One departure: the `:479` and `:574` items stay long (1465 and 1412 characters) because each is one item with several decisions that nothing else holds; the brief caps the line at 1500 and does not ask to split them.

## The item table

Before and after are DESIGN.md line numbers and character counts (base line:chars to worktree line:chars). "Guide" names the file that holds a removed fact.

| Item | Before to after | Stayed (decision and reason) | Went, and where it is said | Moved to a guide |
|---|---|---|---|---|
| :137 Fixed git choices | 137:523 to 137:741 | signing and pull left to the repository's configuration, `user.useConfigOnly`, untracked group and listed roots with their reasons, the forced snapshot push | the choice-by-choice list stays in `source-control.md:55` | the reasons of `source-control.md:55` came into DESIGN.md; the guide dropped them and the sentence that the snapshot push is the one forced push |
| :139 Search | 139:988 to 139:945 | GET not a channel and why, origin check and token and why, ripgrep from the dependency, one query rule, replace through `/api/ops` | the cap and `truncated` sentence (`files-and-search.md:81`), the replace refusal (`:91`, `replace.ts` head) | the guide dropped "so the version that answers is the one the lockfile pins" (`files-and-search.md:73`) |
| :141 Literature search | 141:863 to 141:848 | the route and its token, one request per source, the desk, a failure names the source | the key-in-no-answer paragraph (`configuration.md:46`) | none |
| :143 Live HPC | 143:825 to 143:673 | one poller, the poll's own connection, the two writes, the injected processes | `scancel`, Submit Job's content and the confirm sentence (`views.md:165`) | none |
| :145 Processes view | 145:250 to removed | none held: its fact is `views.md:199` ("Stop, on a terminal's own row ... no other process has a Stop") and DESIGN.md:163 | line removed | none |
| :147 Schedules | 147:831 to 145:654 | one rule for dialog and server, the prompt as one argument after `--`, the token | the fields and due-time rules (`window.md:29`, head comments) | none |
| :149 Calendar | 149:907 to 147:942 | read-only, no secret in the tree, PKCE with the read-only scope, the one ungated callback and its `state` guard | the account row detail (`configuration.md:58`) | none; 35 characters longer than the base because the read-only scope and the credentials location are stated as decisions |
| :151 Mail | 151:920 to 149:832 | one poller in the calendar's shape, the shared connect folder keyed by kind, the page never names a provider id | the account and triage detail (`configuration.md:50`, `:52`) | none |
| :155 The change log | 155:899 to 153:1336 | the record, where it is made and why, machine-local and why, the undo, `moved`, byte-for-byte `config-value`, `undo: none` | none held back | merged with :497, which lost the same sentences; DESIGN.md's change log is now one item (:497 is 170 characters, the History view's name) |
| :100 Validate | 100:624 to 100:339 | the gate | the vocabulary and finding-sentence detail (:559, :545 and the config files) | none |
| :86 | 86:863 to 86:664 | the layer mapping | the ten-item rule, now only at :442 (:440 after) | none |
| :237 | 237:555 to 235:356 | the keep rule reaches the tree functions as a `KeepRule` | the rule's content (`window.md` "Where an opened tab lands") | none |
| :239 | 239:503 to 237:511 | a page leaf is a leaf and why a page is never drawn twice | the behaviour list (`window.md` "Inside a page") | none; 8 characters longer because the :473 sentence merged in |
| :245 | 245:1088 to 243:907 | one translucent layer, the portal reason | the wallpaper toggle rule | `views.md` Settings section: "The Wallpaper toggle starts on whatever the theme answers and holds a value of its own only once pressed, so saving any other appearance value leaves it alone." |
| :247 | 247:883 to 245:883 | unchanged | none (its repeats :484, :485, :486 were reduced) | none |
| :265 | 265:1318 to 263:1266 | every key holds at once, the port move, the carry | the user's list of keys (`configuration.md:32`) | none |
| :461 | 461:1453 to 459:1105 | the `code/` rule, the mirror outside the hub, token and confirm, engram, the shared commit box, hooks with no time limit | Cancel's mechanics and the classifier (head comments of `running.ts`, `parse.ts`) | none |
| :465 Docking | 465:220 to removed | none held: a behaviour list | line removed | `window.md:51`, the keyboard equivalents and the inside-a-page drop |
| :471 | 471:358 to 468:183 | the catalog reaches the page as data and by push | the `local.yml` keys (`README.md:7`, `:13`, `configuration.md:32`) | none |
| :472 | 472:501 to 469:341 | no panel beside the tree | where a tab lands (`window.md`) | none |
| :473 | 473:483 to 470:284 | a nested page is reached by focus, every store operation names a page | the behaviour (`window.md`) | none |
| :474 | 474:1299 to 471:971 | pages, the saved layout, the 500-write record | the rail and Pages behaviour (`window.md:21`, `:33`) | none |
| :476 | 476:923 to 473:557 | floats saved beside pages, `locked` and `recent` | the envelope (`saved.ts` head), the lock behaviour (`window.md`) | the guide gained that a locked pane keeps its place when its last tab closes (`window.md:54`, from `tree.ts:174-181`) |
| :478 | 478:853 to 475:544 | opened views land beside the tools, the registry call | the landing order (`window.md` "Where an opened tab lands") | none |
| :481 | 481:835 to 478:648 | the composer, argument-vector start, one seed builder | the terminal behaviour (`terminals.md:7`, `:13`) | none |
| :483 | 483:663 to 480:343 | the layout `state:` key, the Customizations reader | the Files tab behaviour (`terminals.md:45`, `files-and-search.md:55`) | none |
| :492 | 492:603 to 487:418 | the `engine` root, the `docs:` list | the config view behaviour (`window.md:15`) | none |
| :494 | 494:1010 to 489:863 | one write per group with `base`, text edit and parse-back, the shared placement rule | the catalog's behaviour (`views.md:97`) | none |
| :495 | 495:565 to 490:359 | the filters are instance state, an empty list means all, a pillar is a bar control | the row placement | `views.md` Map: "The three filters are one wrapping row in the pane's bar, above the legend." |
| :497 | 497:1069 to 492:170 | the History view's name and why | the change log's content (merged into :155) | none |
| :501 | 501:742 to 496:535 | the upload limit shared with the Files view, the shared image rules | the view's chord and folder (`HELP.md:51`, `configuration.md:12`) | none |
| :503 | 503:976 to 498:615 | the scan in the portfolio watcher, the mute signature and write | the rule list (`views.md` Audit) | none; the cite `server/content/audit.ts` did not exist and now names `src/lib/server/content/audit/` and `src/lib/server/edit/writes/config/audit-mute.ts` |
| :507 | 507:259 to removed | none held: a behaviour | line removed | `window.md:78`, "up to the ninth entry, since a chord is a letter and one digit" |
| :509 | 509:766 to 503:328 | the argument rules are one pure function, the engine threads from the context | the arguments and environment (`README.md:11`, `:13`) | none |
| :511 | 511:572 to 505:501 | the box tint, `surface={false}`, the first-keystroke note file | none | none |
| :513 | 513:1147 to 507:661 | stale reads and saves, the paint limit and why | how a file opens (`files-and-search.md:59`, `:61`, `views.md:219`) | none |
| :515 | 515:631 to 509:519 | one resolver, the catalog's own rule | the order (`files-and-search.md:65`) | none |
| :516 | 516:1017 to 510:485 | served roots only, the write token, the own write chain and why, the shared name rule | the symlink and real-path rules, the protected `local.yml` (`ops.ts:7-10`, `:33-34`) | none |
| :518 | 518:730 to 512:514 | the copy before a save, the kept delete and replace copies, the bounds | the undo behaviour (`files-and-search.md:51`) | none |
| :521 | 521:1163 to 515:948 | a decline is the lead's own status, the statuses live once | the controls' rules (`views.md:109`, `lead-application.ts` head) | none |
| :522 | 522:1002 to 516:885 | neato then one `d3-force`, the dynamic import, the seed in instance state | the controls (`views.md:37`) | none |
| :523 | 523:953 to 517:514 | `local.yml` in `config/`, the engine root, `readLocal` never throws | the keys (`configuration.md:32`) | none |
| :524 | 524:769 to 518:231 | the view's place in the catalogue | the server side (the Search paragraph, :139), the behaviour (`files-and-search.md:77`) | none |
| :525 | 525:561 to 519:465 | the view's place, state that is not saved, `radar-add` | the keys (`configuration.md:46`), the behaviour (`views.md:105`) | none |
| :526 | 526:1003 to 520:786 | the `git` channel's roots, whole-version diffs, the hunk actions via `git apply` | the view's sections (`source-control.md:9`, `:21`) | none |
| :528 Worktrees | 528:419 to 522:392 | the ignored folder and the warn-not-edit rule with their reasons | the path, branch, shell, removal (`source-control.md:63`, `:67`) | the guide dropped the reason clause |
| :529 | 529:889 to 523:622 | Ctrl with a bracket and why, Delete through the close call, `unsaved()` | the focus stops and the key table (`window.md:66`) | the guide dropped "Ctrl and Tab is not the pair that cycles a pane's tabs, because a browser keeps it for its own tabs" (the reason now in DESIGN.md) |
| :531 | 531:859 to 525:463 | the registry, `resourceIds`, what the snapshot leaves out | the findings and `slurm.resource` (`configuration.md:38`), the facet and tag (`views.md` Projects) | `views.md` Projects: "its compute facet offers the resources present by name; a card draws one tag per resource, the cluster's with the HPC glyph" |
| :532 | 532:984 to 526:811 | the control exists because a view's own controls cannot change the file, the one resolver | the view list (`views.md:117`) | none |
| :533 | 533:839 to 527:549 | a main file is content, not configuration, the endpoint check | the definition and the view (`views.md:233`) | `views.md` LaTeX builds: "whose first 64 KB declares a document class outside a comment, listed with `main.tex` first and the rest by name" |
| :535 | 535:1046 to 529:817 | task terminals, only logged rows are attributed, the end of a build | the build behaviour (`views.md:233`) | none |
| :539 | 539:908 to 533:745 | normal permissions always, the one unattended route | the tray's fields (`window.md:29`) | none |
| :540 (off list) | 540:364 to 534:251 | the Calendar view's place, never in the Command centre | the connector (the Calendar paragraph, :147) | none |
| :542 | 542:1270 to 536:683 | Add and Remove through `rows.ts`, the page sends one address, `action: 'open'` | the PKCE and state rules (:149), the views' forms (`views.md:187`) | none |
| :543 | 543:1121 to 537:334 | the Inbox is not a feed view, the plate is one module | the poller and the triage notes (:151, `configuration.md:50`, `:52`) | none |
| :544 | 544:569 to 538:117 | `open_bin` exists so a served test run records a consent page | the watch (:265), the keys (`configuration.md:32`) | none |
| :546 | 546:178 to removed | none held: it restates :163 | line removed | none |
| :547 | 547:1232 to 540:1124 | `/api/open`, realpath inside a served root, folder revealed, the one program per extension, the opener | the control rule (`views.md:219`) | none |
| :548 Tooltips | 548:518 to 541:544 | the one provider, `focusQuietly` and what it keeps | the one-open-at-a-time rule (`window.md:70`) | none |
| :550 | 550:834 to 543:478 | the rail's fade, bits-ui menus, one list | the rail and menu behaviour (`window.md:15`, `:25`, `:54`) | none |
| :551 | 551:505 to removed (repair round 1) | none held: `views.md:7` states the lane rule | line removed | `views.md` Focus gained the flames and Move to menu sentence in the first round |
| :552 | 552:958 to 545:669 | the personal entities, the one `personalRoots`, the status key | the tier and view (`configuration.md:36`, `views.md:23`) | none |
| :555 | 555:685 to 548:412 | the open form in instance state, answers matched to the opening | what lets a draft go (`window.md:66`) | none |
| :560 | 560:847 to 553:642 | the card controls, the measurements | the card grid's behaviour (`views.md:11`) | none |
| :561 | 561:1068 to 554:752 | the lane header's colour rule | the lane list (`views.md:7`), the awaiting strip's tally (`views.md:7`) | none |
| :563 | 563:613 to 556:524 | the strip components, the focused pane | the tab behaviour (`window.md:60`) | none |
| :565 | 565:1046 to 558:911 | the sash, what differs from VS Code, the Modern theme keys | the key list (`configuration.md`, `window.md:54`) | none |
| :567 | 567:904 to 560:559 | the tab menu, `askAndClose`, the palette actions | the menu entries (`window.md:54`, `:58`, `:59`) | none |
| :569 Dialogs | 569:874 to 561:212 (repair round 1) | the dialog and Memories overlay drawn into the document body so they stand over a float | the per-terminal viewport sentence (`terminals.md:25`) | none |
| :570 | 570:539 to 563:271 | a write answers with the entry's id after the write | the form behaviour (`window.md:66`) | none |
| :572 | 572:1104 to 565:786 | the bar's components and the notification store | the items and the bell (`window.md` "The status bar and notifications") | none |
| :573 | 573:821 to 566:523 | the failed read held as the answer, the bookmark watch and merge | the Files view behaviour (`files-and-search.md:25`) | none |
| :574 native window | 574:2070 to 567:1412 | the utility process, single-instance lock, build folders, the full-screen file, the window options and bridge | the start and packaging (`README.md:9`), the window behaviour (`window.md:7`), `src/desktop/` run unbuilt | none |
| :576 | 576:1022 to 569:779 | a float as a window, the shared arrangement through the main | the app's items (`window.md:7`, `:54`) | none |
| :479 Decks (off the table's list by the brief's item 4) | 479:2271 to 476:1465 | live view, folder deck, the server read, the identity of a Present tab, full screen | the controls (`views.md` Present), the repeated Present items | none; label `- Decks:` |
| :442 (merge target of :86) | 442:110 to 440:187 | the folder rule | | none |
| :447 (off list) | 447:515 to 445:181 | no agent working on the application runs a git write, a commit is the reader's | the application's own writes and the one timer (DESIGN.md:135) | none |
| :484 (off list, repeat of :247) | 484:225 to 481:101 | the cross-links keep their click, no tighter radius, no single accent | the capsule rule (:247) | none |
| :485 (off list, repeat of :247) | 485:169 to removed | none held: :247 says it | line removed | none |
| :486 (off list, repeat of :247) | 486:213 to removed | none held: :247 and `README.md:15` (the Lucide licence) and `configuration.md:15` (the ASCII stand-in) say it | line removed | none |

Moved sentences and where each now stands: `window.md:51` (docking keyboard equivalents, the inside-a-page drop), `window.md:54` (a locked pane keeps its place), `window.md:78` (the ninth entry), `views.md:7` (Focus lanes of other tiers), `views.md:11` (compute facet and tag), `views.md:35` (Map filters row), `views.md:207` (Wallpaper toggle), `views.md:233` (main file definition). Dropped from guides because DESIGN.md now holds them: `source-control.md:55` (the two reasons and the forced-push sentence), `:63` (the warning's reason), `files-and-search.md:73` (the lockfile clause), `window.md:66` (the Ctrl-and-Tab reason).

## The files with line counts

`wc -l` before (base copy) and after: DESIGN.md 576 to 569; docs/apps.md 861 to 861; configuration.md 64 to 64; files-and-search.md 91 to 91; source-control.md 67 to 67; terminals.md 69 to 69; views.md 233 to 233; window.md 82 to 82; README.md 48 to 48; HELP.md 159 to 159. `diff -rq` of the worktree's `tools/oculus` against the base copy, restricted to what differs in both: `DESIGN.md`, `docs/files-and-search.md`, `docs/source-control.md`, `docs/views.md`, `docs/window.md`, `src/lib/server/git/deposit.ts`, `src/lib/server/machine/pty/channel.ts`, `src/lib/server/root/socket.ts`, `src/lib/state/life/memories.ts`, `src/lib/state/system/audit.ts` and this report (the base copy holds no `.scratch`, so `diff` also lists files that exist only in the worktree). No file under `docs/diagrams` differs after `npm run diagrams`.

## Judgment calls the brief left open

- `:137`: the brief's "no fact restated" and "state the choice and reason" pull apart; DESIGN.md names the four choices whose reason it gives and the one forced push, and the guide keeps the whole list with the reason clauses dropped.
- `:465` and `:507` hold no decision, so both are removed; their one new fact each went to `window.md`.
- `:145` and `:546` are removed as the review says; `:485` and `:486` are removed because `:247` states them; `:484` keeps only the cross-link and radius sentence.
- `:447` is kept as one sentence about agents, since the rest repeated :135.
- `:155` and `:497` are merged into :155, so :155 grew by 436 characters while :497 shrank by 899; the merged change log item states each fact once.
- `:149`, `:139`, `:141` and `:137` are still near their base length, since each held reasons that the guide also held; the reason is now in DESIGN.md only. `:149` is 35 characters longer than the base.
- The `:535` sentence on `auto_build` is dropped because it repeats `views.md:233`: the option `latex.auto_build` (`config/catalogs/options.yml:524-530`, values `on_save` and `never`, default `on_save`) builds on save unless it is `never`, which is what the guide says.
- `:503` and the `:494` item cite files that did not exist at the old names; the cites name the real files now.
- To keep every comment-cited name, the item `:479` begins `- Decks:`, and `:121` is not edited (it is a paragraph a plan in flight also edits), so `channel.ts` and `socket.ts` cite "Auth" for the sentence that stands at :159.

## Host- and user-visible changes (the guides are shown on the Help page)

Each sentence below was added or removed in a guide; the headings are unchanged.

- `docs/window.md` ("Inside a page", the Drag bullet, line 51): added "A drop on a pane of a page shown inside another page lands in that page. Every drag has a menu equivalent that the keyboard reaches: the pane menu splits, floats, closes and maximises a pane and moves a tab to another page, and Shift-F10 opens the menu of the focused control."
- `docs/window.md` ("Pages", locked pane): "a locked pane takes no tab opened from elsewhere, though a tab can still be dragged onto it, and a lock mark" became "... and keeps its place when its last tab closes, so only Close pane removes it; a lock mark".
- `docs/window.md` ("The key sheet", line 78): "so the digit after the group's last view opens its first document; the directly" became "so the digit after the group's last view opens its first document, up to the ninth entry, since a chord is a letter and one digit; the directly".
- `docs/window.md` ("Focus, tabs and unsaved text"): removed " Ctrl and Tab is not the pair that cycles a pane's tabs, because a browser keeps it for its own tabs and never hands it to a page." (the reason is DESIGN.md's).
- `docs/views.md` Focus: added "A project of another tier on a lane has the flames and the Move to menu of every card, which write its manifest as they do any card's, and the ideas backlog and the unplaced hint stay over the three live tiers."
- `docs/views.md` Projects: "counts them on its button; a long ELI5" became "counts them on its button, and its compute facet offers the resources present by name; a card draws one tag per resource, the cluster's with the HPC glyph; a long ELI5".
- `docs/views.md` Map: added "The three filters are one wrapping row in the pane's bar, above the legend."
- `docs/views.md` Settings: added "The Wallpaper toggle starts on whatever the theme answers and holds a value of its own only once pressed, so saving any other appearance value leaves it alone."
- `docs/views.md` LaTeX builds: "A main file is a `.tex` file directly in the folder that declares a document class, so a folder" became "A main file is a `.tex` file directly in the folder whose first 64 KB declares a document class outside a comment, listed with `main.tex` first and the rest by name, so a folder".
- `docs/files-and-search.md` ("Creating, renaming, deleting, moving and pasting"): added "The question uses the folder wording only for a folder that is not a link, since deleting a link removes the link alone."
- `docs/files-and-search.md` ("Searching the files"): removed "so the version that answers is the one the lockfile pins".
- `docs/source-control.md` ("What oculus fixes"): the paragraph lost its two reason clauses and the forced-push sentence's second half (now "No Source Control action carries `--force`."); the worktree paragraph lost "what a repository ignores is its owner's to decide, and without the rule a worktree made there becomes content of the repository."
- Five code comments (comment paragraph only): `memories.ts`, `audit.ts`, `channel.ts`, `deposit.ts`, `socket.ts`, as in case 7.

The `files-and-search.md` delete sentence is read from `src/lib/views/shared/explorer/tree/menu/row-ops.ts:111-115` (a folder's delete takes what is inside it, a link to a folder does not); I did not run the delete control on a link.

## Anything in the brief that was wrong or impossible

- The brief's case 7 lists `Layer 1 data` as a name to find; the heading reads `Layer 1, data` (DESIGN.md:94) and the comment cites `"Layer 1, data"`, so the name is found under its real spelling.
- `:503` and the brief's `:494` cite `src/lib/server/content/audit.ts`, which is a folder `audit/` on the tree; corrected in the item.
- `:535`'s `auto_build` sentence repeats `views.md:233` and is dropped as a repeat (the wording "when `on_save`" and "unless `never`" state the same rule).
- `socket.ts:6` has the false "The socket" cite that `channel.ts:7` has; it is not on the brief's list of four, and is rewritten under item 3.
- `HELP.md` is unchanged. A scan of every DESIGN.md line outside Apps against `HELP.md` and the six guides for 8-word runs they share verbatim leaves runs in `:247`'s "a terminal theme draws in place of its", `:501` (the source tab item), `:505` (the file browser's box) and `:526` (the control that opens a view's file), all items the brief does not list and that I left as they were.

## Repair round 1

Line numbers are the worktree's after round 1 (`DESIGN.md` is 568 lines; items after the removed Focus board item moved up one line against the item table above). Each row gives the file and line, the text before and after, and the rerun.

| # | Item | File and line | Before | After |
|---|------|---------------|--------|-------|
| 1 | Spec 1, fixed git choices | `DESIGN.md:137`, `docs/source-control.md:55` | DESIGN: "Signing and the pull strategy are left to the repository's own git configuration, so oculus adds no flag for either, and a commit sets `user.useConfigOnly` so git never guesses an identity ...". Guide: "Signing is left to git's own `commit.gpgsign`, so oculus adds no flag. Pull is a plain `git pull`, so the repository's own `pull.rebase` decides ... A commit sets `user.useConfigOnly`, so it never takes an identity git guessed from the machine." | DESIGN: "Where git has a setting of its own for a choice, oculus leaves the choice to it and adds none, so the repository's own configuration decides." then the Stage All Changes and every-root reasons, then "Forcing is confined to the deposit snapshot push ..., kept because the snapshot is an orphan commit that has to replace the remote's `main`." Guide: "Signing is left to git's own `commit.gpgsign` and oculus adds no flag. Pull is a plain `git pull`, and the repository's own `pull.rebase` decides between merging and rebasing. A commit sets `user.useConfigOnly` and never takes an identity git guessed from the machine." DESIGN names none of the guide's behaviours, and the guide has no reason clause. |
| 2 | Spec 2, page leaf | `DESIGN.md:237` | "Because it is the same page and never a copy, a tab opened in it is open everywhere that page shows, and a page is never drawn twice on a screen, so that no view is mounted twice, which is why a leaf or a drop that would draw a page twice, or a page inside itself, is refused and never offered" | "A page is drawn once on a screen so that no view is mounted twice, which is why a leaf or a drop that would break that is never offered (`docs/window.md`, "Inside a page")." The same-page, tab and self-containment sentences are `window.md:52` only. |
| 3 | Spec 3, bracket keys | `docs/window.md:68`, `DESIGN.md:523` | window.md: "In a browser tab Ctrl+Tab belongs to the browser, so the brackets cycle a pane's tabs; in the app Ctrl+Tab and Ctrl+Shift+Tab do too." | window.md: "The brackets cycle a pane's tabs; in the app Ctrl+Tab and Ctrl+Shift+Tab do too." The reason ("a browser keeps Ctrl and Tab for its own tabs and never dispatches it to a page") is at `DESIGN.md:523` alone. |
| 4 | Spec 4, items with no decision | `DESIGN.md:544` (Focus board), `:562` (terminals and dialogs) | `:544` "The Focus board draws what a manifest places: `laneItems` puts a project of any tier on the lane its `focus:` names"; `:562` "Terminals and dialogs: a terminal's viewport line ... kept per terminal when its grid goes ... A dialog and the Memories picture overlay are drawn into the document body ..." | `:544` removed (its fact is `views.md:7`); `:562` is now `:561` "- Dialogs: a dialog and the Memories picture overlay are drawn into the document body through `portal` of `ui/shown.ts`, outside the area that holds the floats, so they stand over a float", which is a decision with its reason; the viewport sentence is `terminals.md:25`. The item table rows for :551 and :569 above carry the result. |
| 5 | Spec 5, the forced push | `docs/source-control.md:55`, `:27` | `:55` "No Source Control action carries `--force`."; `:27` "...and none of them ever forces." | `:55` adds "The one forced push in oculus is the push of a deposit's snapshot, which replaces the remote's `main` and the history that was there."; `:27` reads "...none of them ever forces; the one forced push in oculus, a deposit's snapshot push, is named under "What oculus fixes" below." |
| 6 | Spec 6, base :459 and :464 | `DESIGN.md:457`, `:462` | base :459 ended "Appearance adds VS Code Dark Modern and Light Modern as two more themes, the wallpaper behind the panels and the icon or ASCII toggle."; base :464 ended "the rail draws one button per page of `rail:`, and every view is listed in the Views catalogue; every control has an immediate tooltip." | Both items keep their decisions and are in the item table below. Where each dropped fact lives: the two Modern themes at `DESIGN.md:241` (Theming) and now `views.md:207` ("The theme list includes vscode dark modern and vscode light modern."); the wallpaper at `DESIGN.md:245`, `configuration.md:12` and `views.md:207`; the icon toggle at `views.md:207`, which now says "The Icons toggle keeps the icons on a terminal theme instead of their ASCII stand-ins." (read from `config/text/views/system/workbench.yml:111`) and `configuration.md:15` for the ASCII stand-ins; one rail button per page of `rail:` at `window.md:15` and `HELP.md:17`; every view and document of the `docs` key listed in the Views catalogue at `window.md:15`. The "immediate tooltip" clause is not restored (`TooltipGroup.svelte` has `DELAY`). |
| 7 | Spec 7, three cites | `DESIGN.md:523`, `:558`, `:459` | :523 "the key table are in `docs/window.md`"; :558 "the keys that shape it are in `docs/configuration.md` (`appearance.yml`)"; :459 "in the head comments of `running.ts` and `parse.ts`" | :523 "the focus stops are in `docs/window.md` ("Focus, tabs and unsaved text"), the key table in `HELP.md` ("The keys")" (`HELP.md:23` heading, Ctrl+] at `HELP.md:31`); :558 "the keys that shape it, `show_tabs`, `editor_actions` and `wrap_tabs` of `appearance.yml`, are in `docs/window.md` ("Inside a page")" (`window.md:54`, `:56` under that heading); :457 now :459 "how Cancel ends it is in the head comment of `running.ts` and how a failed command is worded in the doc comment of `classifyFailure` in `parse.ts`" (`parse.ts:697`). |
| 8 | Standards 1, rewrap | `src/lib/server/root/socket.ts:1-16`, `src/lib/server/machine/pty/channel.ts:1-24` | `socket.ts:6` 94 columns, `channel.ts:7` 96 columns | the whole head comment of each file refilled to 100 columns; `awk` over the comment lines of each prints a longest line of 100 and none over. |
| 9 | Standards 2, dangling participle | `DESIGN.md:533` | "...a schedule's Run unattended choice, which a saved command is not offered since its line asks nothing of the CLI, placed before the skill or before the `--` that ends the options" | "...a schedule's Run unattended choice, which puts the flag before the skill, or before the `--` that ends the options for a prompt (`task.ts`, `run.ts`); a saved command is not offered it, since its line asks nothing of the CLI." (`task.ts:44`, `run.ts:76`) |
| 10 | Standards 3, negation-contrast | `DESIGN.md:139`, `:490`, `:553` | :139 "answered by `GET /api/search` and not over a channel", "rather than from the machine's PATH", "and not a route of its own"; :490 "a bar control and not a capsule"; :553 "transparent when hidden rather than absent" | :139 "answered by `GET /api/search`, since a search is a request with an answer and holds no state on the server, so it travels over no channel", "ripgrep is the `@vscode/ripgrep` dependency, so the search works where no `rg` is installed", "Replace is the `replace` operation of `POST /api/ops`, with no route of its own"; :490 see item 15; :553 "the controls stay in the layout, transparent until the card is hovered or focused, so nothing moves and Tab reaches them". |
| 11 | Standards 4, delete sentence | `docs/files-and-search.md:47` | "a question that is always asked. The question uses the folder wording only for a folder that is not a link, since deleting a link removes the link alone. The question carries a Do not ask me again box;" | "a second question that is always asked. The first question names a folder that is not a link with "and its contents" ("Are you sure you want to delete 'src' and its contents?"), since deleting it takes everything inside; a link to a folder is named alone, since deleting a link removes the link only. The first question carries a Do not ask me again box;" (`config/text/views/sources/files.yml` `delete_question_folder`, `row-ops.ts:111-115` `holdsContents`) |
| 12 | Standards 5, `:447` | `DESIGN.md:445` | "No agent working on the application runs a git command that writes, and a commit is the reader's. What the application itself runs, the one timer among it, is in "Git" of Layer 2." | "An agent working on the application runs no git command that writes, and a commit is the reader's. The git commands the application itself runs, the one timer included, are in "Git" of Layer 2." |
| 13 | Behaviour 1, floats | `DESIGN.md:473` | "an arrangement saved without floats takes the floats of `config/layout.yml` once" | "an arrangement saved at version 4 or 3 takes the floats of `config/layout.yml` once" (`saved.ts:9-15`) |
| 14 | Behaviour 2, credentials | `DESIGN.md:147` | "The credentials are kept in files under `~/.oculus`" | "The credentials are kept in the account files under `calendar_dir` of `local.yml` (`~/.oculus/calendar` by default) and the client half under `~/.oculus/connect`" (`configuration.md:32`, `:58`) |
| 15 | Behaviour 3, capsule | `DESIGN.md:490` | "A pillar filter is a bar control and not a capsule, since the capsule stands for a status word and a project type alone." | "The project type filters and the connected toggle are capsules, as Theming says the capsule belongs to a project type and a filter toggle, and a pillar filter is a text button, since a pillar is a name and takes no capsule." (`DESIGN.md:245`; `map/Controls.svelte:6-9`) |
| 16 | The report | this file | case 1 result, the `auto_build` reason, the count of cited names | case 1 after: rewritten above; `auto_build`: now "repeats `views.md:233`" (`options.yml:524-530`, `latex.svelte.ts:651-655`); names: "prints 17 distinct names", with the six names outside the quoted-name grep listed apart. |

Item table rows for the two off-list reductions of the first round (base lines, with the result):

| Item | Before to after | Stayed (decision and reason) | Went, and where it is said | Moved to a guide |
|---|---|---|---|---|
| base :459 Configuration (now :457) | 459:348 to 457:213 | one concern per file, the domains' colours keyed `domains`, the theme list as data so a theme is added without touching a component | the two Modern themes (`DESIGN.md:241`), the wallpaper (`DESIGN.md:245`, `configuration.md:12`), the icon or ASCII toggle (`configuration.md:15`) | `views.md:207`: the two themes and the Icons toggle sentence |
| base :464 (now :462) | 464:344 to 462:208 | a project opens as its own tab, a local HTML file opens as a `document` tab | one rail button per page and every view in the Views catalogue (`window.md:15`, `HELP.md:17`); "immediate tooltip" was false and is not stated | none |

Reruns after the last edit, from `tools/oculus` in the worktree:

```
npm run diagrams: exit 0
npm run test:quick -- --base 60263c8d: exit 0
test:quick: 13 changed file(s), from git since 60263c8d
test:quick: 16 test file(s), 10 essential
ok      prettier (0.4 s): All matched files use Prettier code style!
ok      ASCII gate (0.4 s)
ok      svelte-kit sync (2.0 s)
ok      eslint (1.7 s)
ok      svelte-check (5.6 s): 1791314416853 COMPLETED 392 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (7.7 s): Duration  4.73s (transform 4.81s, setup 0ms, import 9.31s, tests 1.81s, environment 4ms)
test:quick: 8.3 s (limit 45.0 s); every command passed
 Test Files  1 passed (1)
      Tests  3 passed (3)
ascii gate printed nothing above; perl exit 0
spaced-hyphen grep lines:        0
wc -l DESIGN.md:      568
  over 1500: line 372 length 1504
  over 1500: line 396 length 1512
window headings identical
views headings identical
files-and-search headings identical
source-control headings identical
configuration headings identical
terminals headings identical
Apps section byte-identical
apps.md identical
```

Not covered: `test:quick` runs the tests selected for the changed files, and `tests/checks` beyond the history test is not run; the Help page rendering of the guides is not looked at (no browser). The new `views.md` Icons toggle sentence rests on `config/text/views/system/workbench.yml:111`; I did not press the toggle.
