# Q126 refutation: DESIGN.md reduced to its decisions

The reviewer's report, read-only, saved by the orchestrator as the reviewer gave it.

## Verification lines (verbatim, run from `tools/oculus` in `.agents/worktrees/Q126`)

`npm run test:quick -- --base 60263c8d`:

```
test:quick: 11 changed file(s), from git since 60263c8d
test:quick: 16 test file(s), 10 essential
ok      prettier (0.4 s): All matched files use Prettier code style!
ok      ASCII gate (0.5 s)
ok      svelte-kit sync (1.7 s)
ok      eslint (1.6 s)
ok      svelte-check (5.1 s): 1791313455845 COMPLETED 392 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (7.2 s): Duration  4.50s (transform 4.20s, setup 0ms, import 8.64s, tests 1.97s, environment 3ms)
test:quick: 7.8 s (limit 45.0 s); every command passed
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
```

`npx vitest run tests/checks/source/history.test.ts`: `Test Files  1 passed (1)`, `Tests  3 passed (3)`.

ASCII gate (`LC_ALL=C perl ... DESIGN.md docs/*.md`): printed nothing, `perl exit 0`.

`grep -nE "\S - \S" DESIGN.md docs/*.md`: printed nothing (exit 1).

`awk 'length>1500' DESIGN.md | wc -l`: `2`. The two lines are `DESIGN.md:372` (1504) and `:396` (1512), both in Apps.

`wc -l`: DESIGN.md is 569 (576 in the base copy). The guides are unchanged in line count: apps 861, configuration 64, files-and-search 91, source-control 67, terminals 69, views 233, window 82.

Apps section: `diff <(sed -n 267,431p base/DESIGN.md) <(sed -n 265,429p DESIGN.md)` printed `APPS-SAME`, and `diff -q` on `docs/apps.md` printed `APPSMD-SAME`.

Headings: `cmp` of `grep -n "^#"` against the base for all six guides printed "headings same", and DESIGN.md's heading text is the same.

`ls tools/oculus/docs/adr docs/adr`: "No such file or directory" for both.

`git status --short`: 10 files modified plus the untracked report. One of them, `src/lib/server/root/socket.ts`, is outside the brief's write list, and the report names it.

The brief's quoted-name grep (`grep -rhno 'DESIGN\.md[^"]\{0,20\}"[^"]\{2,60\}"' ...`) prints 17 distinct names. Each one resolves in the new DESIGN.md: Auth 159, PTY 151, Git 135, The socket 121, Apps added while oculus runs 265, Approval 406, Watchers 123, Sessions 127, Normalise 102, Layer 1, data 94, Hot reload 249, Fixed git choices 137, Configuration 88, Client state 165, Boundaries 177. `^- Decks:` is at 476 and `^- Sessions are six views, not one` at 463.

## What to build

1. Each item keeps its decision and its reason, and loses every repeat: violated, in part. Most items are reduced correctly. Repeats remain at :137, :237, :523, :544 and :562 (Spec 1 to 4). The deposit snapshot's forced push left the guide entirely, where only its reason should have gone (Spec 5). Two off-list reductions, base :459 and base :464, are not named in the item table (Spec 6).
2. Control behaviour no guide holds moves to its guide: holds. Each moved sentence was read in its new place: `window.md:51`, `:54`, `:78`; `views.md:7`, `:11`, `:35`, `:207`, `:233`; `files-and-search.md:47`.
3. Every cite holds: violated, in part. The 17 quoted names resolve. The four comments the brief named as false are rewritten. The by-description comments hold: `deposit-git.ts:3`, `deposit.ts:1-5`, `deposit-routes.ts:8`, `git-write.ts:50`, `Confirm.svelte:7` against :459; `validate.ts:1` and `integrity.test.ts:5` against :100; `guards.ts:4-5` against :161. Three DESIGN cites point at text that does not hold their sentence: :523 (the key table), :558 (`wrap_tabs`) and :459 (the head comment of `parse.ts`). See Spec 7.
4. No DESIGN.md line over 1500 characters outside Apps: holds. :476 is 1465 characters and :567 is 1412, each still one item.
5. Items not on the list are unchanged except where allowed: holds. The off-list edits are further repeats that item 1 allows, but two of them are unnamed (Spec 6).

## Cases

1. partial. `source-control.md:55` still holds "Signing is left to git's own `commit.gpgsign`, so oculus adds no flag", "so the repository's own `pull.rebase` decides" and "A commit sets `user.useConfigOnly`, so it never takes an identity git guessed from the machine". DESIGN.md:137 says the same: "left to the repository's own git configuration, so oculus adds no flag for either, and a commit sets `user.useConfigOnly` so git never guesses an identity".
2. met. The Docking item is gone, and the drags are in `window.md:47-51`.
3. met. The rule is only at `window.md:70`, and DESIGN.md:541 names `TooltipGroup.svelte`.
4. met. DESIGN.md:522 has no literal path, and `source-control.md:63` and `:67` hold the path and the removal.
5. met. DESIGN.md:510 keeps the chain and the roots, and `ops.ts:7-16` holds the refusals.
6. met for the tooltip and the worktree path.
7. met. "Decks" goes from no hit to one, and the by-description comments hold.
8. met for the listed items: the table has a row for each.
9. met.

## Spec

1. The fixed git choices still say the same reasons twice. Place: `DESIGN.md:137` and `docs/source-control.md:55`. DESIGN.md says "Signing and the pull strategy are left to the repository's own git configuration, so oculus adds no flag for either, and a commit sets user.useConfigOnly so git never guesses an identity"; only two reason clauses (Stage All, every root listed) were taken out of the guide. Case 1 asks that no fact of `:55` be restated and that each reason be said once. Failure scenario: a maintainer changes how oculus treats `user.useConfigOnly` and edits only the guide; DESIGN.md is then false. Verdict: case 1 partial, item 1 violated.
2. The page leaf item still restates the guide. Place: `DESIGN.md:237` and `docs/window.md:52`. DESIGN.md: "Because it is the same page and never a copy, a tab opened in it is open everywhere that page shows, and a page is never drawn twice on a screen". `window.md:52`: "It is the same page, never a copy: a tab opened in it is open wherever that page shows. A page never contains itself and is drawn at most once on a screen." This is the review's `:239` repeat, still present. Failure scenario: someone edits the nesting rule in the guide only and leaves DESIGN.md stale. Verdict: item 1 violated for :239.
3. The bracket keys' reason is said twice. Place: `DESIGN.md:523` and `docs/window.md:68`. DESIGN.md says "because a browser keeps Ctrl and Tab for its own tabs and never dispatches it to a page". The builder removed the same reason from `window.md:66`, but `window.md:68` still says "In a browser tab Ctrl+Tab belongs to the browser, so the brackets cycle a pane's tabs". Verdict: item 1 violated for :529.
4. Two items still hold only behaviour, with no decision. `DESIGN.md:544` ("The Focus board draws what a manifest places: `laneItems` puts a project of any tier on the lane its `focus:` names") repeats `views.md:7`. `DESIGN.md:562` ("a terminal's viewport line, and whether it sat at the end, are kept per terminal when its grid goes") repeats `terminals.md:25`, and its reason was dropped. Item 1 says an item with no decision left is removed or merged. Failure scenario: a change to the lane rule or the scrollback rule made in the guide leaves DESIGN.md stale. Verdict: item 1 violated for :551 and :569.
5. The deposit snapshot's forced push left the guide entirely. Place: `docs/source-control.md:55`. "the push of a deposit snapshot is the one forced push in oculus" was removed. This was behaviour, not a reason clause. No guide now says that the deposit's snapshot replaces the remote's `main`; a search of `HELP.md` and `docs/*.md` for orphan, force and snapshot finds none, and `source-control.md:27` says "none of them ever forces". Failure scenario: a reader of the guides concludes nothing in oculus force-pushes, presses the deposit's snapshot and loses the remote history unwarned. Verdict: item 1 violated.
6. Two off-list reductions are missing from the item table. `DESIGN.md:457` (base :459, which dropped "Appearance adds VS Code Dark Modern and Light Modern as two more themes, the wallpaper ... and the icon or ASCII toggle") and `DESIGN.md:462` (base :464, which dropped "the rail draws one button per page of `rail:`, and every view is listed in the Views catalogue; every control has an immediate tooltip"). Item 1 requires a further repeat to be named in the table, and the report's check 9 says they are. The dropped "every control has an immediate tooltip" is in no document now; `TooltipGroup.svelte` has a `DELAY`, so the clause was not true anyway. Verdict: item 1 violated (the reporting half).
7. Three cites point at the wrong text. (a) `DESIGN.md:523`: "The focus stops and the key table are in `docs/window.md` ("Focus, tabs and unsaved text")"; `window.md` holds no table (`grep -c "^|" docs/window.md` prints 0); the table is `HELP.md` "The keys", and Ctrl+] / Ctrl+[ appear only at `HELP.md:31`. (b) `DESIGN.md:558`: "the keys that shape it are in `docs/configuration.md` (`appearance.yml`)"; `wrap_tabs` is only at `window.md:56`. (c) `DESIGN.md:459`: "how Cancel ends it and how a failed command is worded are in the head comments of `running.ts` and `parse.ts`"; the classifier is a doc comment at `parse.ts:697`, not the head. Failure scenario: a reader follows the cite and does not find the fact. Verdict: item 3 violated.

## Proof

1. The report's case 1 result does not reproduce: "The behaviour is in the guide, each reason in DESIGN.md once" is not true (Spec 1).
2. The report's reason for dropping the `auto_build` sentence is wrong. `config/catalogs/options.yml:524-530` has `values: [on_save, never]`, default `on_save`, and `latex.svelte.ts:651-655` builds when the value is not `never`; "when `on_save`" and "unless `never`" are the same rule. Dropping the sentence is right (it repeats the guide), but the stated reason is false.
3. The count of cited names does not reproduce. The report says the brief's grep lists 21 distinct quoted names; run as the brief gives it, it prints 17. "Live data", "Wire model" and "Opening things in oculus" are cited by no comment.
4. Check 7 claims no departures from the prose rules, but new negation-contrast constructions were added (Standards 3).

## Standards

1. Two rewritten comments are not rewrapped whole at 100 columns. `src/lib/server/root/socket.ts:6` is 94 characters; the next word, "token", would make it exactly 100, and `:7` is itself 100. `src/lib/server/machine/pty/channel.ts:7` is 96 characters; "the" would make it 100. Rule: `agents/spec.md:43`.
2. A participle dangles in the update tasks item. At `DESIGN.md:533`, "is a schedule's Run unattended choice, which a saved command is not offered since its line asks nothing of the CLI, placed before the skill or before the `--` that ends the options": "placed" now attaches to the saved command's line instead of to the flag.
3. New negation-contrast constructions: `DESIGN.md:139` "Replace is `POST /api/ops` with `op: 'replace'` and not a route of its own"; `DESIGN.md:490` "A pillar filter is a bar control and not a capsule"; `DESIGN.md:553` "transparent when hidden rather than absent". Rule: `agents/spec.md:20`.
4. The new delete sentence in the files guide is ambiguous. At `docs/files-and-search.md:47`, "The question uses the folder wording only for a folder that is not a link ... The question carries a Do not ask me again box" reads as the delete-for-good question, and "the folder wording" is defined nowhere in the guide.
5. The `:447` rewrite reads badly. `DESIGN.md:445`: "What the application itself runs, the one timer among it, is in "Git" of Layer 2." "the one timer among it" does not parse.

## Behaviour

1. The floats sentence is now false for a reader who closed every float. `DESIGN.md:473`: "an arrangement saved without floats takes the floats of config/layout.yml once". The base said "a browser that saved before floats". `src/lib/state/workbench/layout/saved/saved.ts:9-15` takes the shipped floats only for a version 4 or 3 envelope; an arrangement saved at the current version with no floats does not take them. Failure scenario: a maintainer expects a reader who closed every float to get them back on reload and reports a bug or changes the code to match.
2. The calendar credentials location is stated as fixed. `DESIGN.md:147`: "The credentials are kept in files under ~/.oculus, so no secret is in the tracked tree". The files live under `calendar_dir` of `local.yml` (`docs/configuration.md:32`, `:58`), `~/.oculus/calendar` by default; the base said "under `calendar_dir`". Failure scenario: a machine with `calendar_dir` set elsewhere; a reader looks under `~/.oculus`.
3. The Map filter item contradicts Theming. `DESIGN.md:490` (rewritten): "since the capsule stands for a status word and a project type alone"; `DESIGN.md:245`: "The capsule belongs to a status word, the project type, a filter toggle and the badge of a view in the Views catalogue".

## Declined to judge

- `window.md:51`'s new "Every drag has a menu equivalent that the keyboard reaches" and "A drop on a pane of a page shown inside another page lands in that page": not verified. `paneMenu` and `pageListItems` (`pane-view.ts:81-160`) confirm Close, Maximise, Fold, move to another page, show a page, the splits and Float; whether every drag has a keyboard path, and where a drop into a shown page lands, needs the drag store read in full or the look.
- `DESIGN.md:540`, the refusals of a mapped file existing because `open` follows an alias: it mirrors the head comment `open.ts:19-22`; whether the execute-bit refusal has that reason is a design question this step did not change.
- The Help page rendering of the changed guides: the look at landing.
- landing.mjs, test:slow, test:landing and the desktop tests were not run, as the prompt said.

## Judgment calls by the builder

- `:145` and `:546` removed: inside the brief and right; `views.md:199` and `DESIGN.md:163` hold their facts.
- `:465` and `:507` removed: inside the brief and right, apart from the window.md sentence under "Declined to judge".
- `:485` and `:486` removed, `:484` reduced: inside the brief and right; `DESIGN.md:245` holds the capsule, the hue and Lucide.
- `:497` merged into `:155`: inside the brief and right.
- The `:535` `auto_build` sentence dropped: right as a repeat of `views.md:233`; the stated reason is wrong (Proof 2).
- The extra `socket.ts:6` comment: inside item 3's aim and right; its rewrap is short (Standards 1).

## Usage

a632fa655d3e8b1a2, claude-opus-5-5, 309,031 tokens, 82 tool uses, 13.5 min (from its completion notice).

## Repair round 1, refuted

The reviewer's report over round 1, saved by the orchestrator. Its verification lines: `npm run test:quick -- --base 60263c8d` every command passed (13 changed files, svelte-check `COMPLETED 392 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`); `history.test.ts` 3 passed; the ASCII gate printed nothing; the spaced-hyphen grep printed nothing; `awk 'length>1500' DESIGN.md` names only `:372` (1504) and `:396` (1512), both in Apps; DESIGN.md 576 to 568 lines, each guide at its base count; the Apps section and `docs/apps.md`, `configuration.md`, `terminals.md`, `HELP.md`, `README.md` identical to the base; the headings the same in DESIGN.md and all seven guides.

Round items: 1 the repeat closed, the rewrite adds a false sentence (Behaviour 1); 2 to 15 hold; 16 partial (Proof 1 to 4).

What to build: 1 holds apart from Behaviour 1; 2 holds; 3 violated in part (Spec 1, Spec 2); 4 holds; 5 holds. Cases: 1 to 7 met; 8 partial (Proof 2); 9 met in the file, the report's count stale (Proof 3).

### Spec

1. `DESIGN.md:141` cites the Configuration guide's "Literature search"; its heading is "## The Literature search's keys" (`docs/configuration.md:44`). A reader looks for a section that does not exist. Item 3 violated.
2. `DESIGN.md:473` cites `docs/window.md` ("Pages", "Inside a page") for what `recent` does; that is at `window.md:41`, under "## Where an opened tab lands" (`:39`). Item 3 violated.

### Proof

1. Report :27 quotes `source-control.md:55` as it was before the round. Round item 16 partial.
2. Report :90, :136, :202 and :204 (the item table rows :137 and :529, the before-and-after quotes) state the pre-round text; `agents/spec.md:18`. Case 8 partial.
3. Report :35, :44, :175 give 569 lines and the native window item at 567; `wc -l` prints 568 and the item is at 566. Report :33 gives Live data 452, Wire model 454, Git writes and the deposit 458, Sessions cover two agents 460; `grep -n` prints 453, 455, 459, 461.
4. Report :80's "no hit" for the history-word grep does not reproduce: `channel.ts:23` "again before it is taken as an empty list" is an added line after the rewrap; "before" is a time order and no defect.

### Standards

1. Negation-contrast left in round-0 text: `DESIGN.md:153` "and not by comparing the file with itself, so it holds the value the writer saw and not a guess"; `DESIGN.md:522` "is warned about in the view and not edited". `agents/spec.md:20`.
2. `DESIGN.md:147` "the client half under `~/.oculus/connect`": the term is defined only in `store.ts:7-10` (the reader's own OAuth client id and secret, or Entra application id and tenant).

### Behaviour

1. `DESIGN.md:137` "Where git has a setting of its own for a choice, oculus leaves the choice to it and adds none, so the repository's own configuration decides" is false for the commit identity: `git-write.ts:38-41` and `:609-614` set `user.useConfigOnly` through `GIT_CONFIG_KEY_0` on every commit, and DESIGN.md no longer holds that decision or its reason. A maintainer removes the setting as contrary to the decision, and commits go out under a guessed identity.

### Declined to judge

- `window.md:51` "Every drag has a menu equivalent that the keyboard reaches": first-round text; whether a reorder along the strip or a move to another pane of the same page has a keyboard path needs the drag store and the strip keys read in full, or the look.
- The Help page rendering of the changed guides: the look at landing.
- landing.mjs, test:slow, test:landing and the desktop tests were not run.

Usage: a3c24fe9dcb004e1d, claude-opus-5-5, 249,685 tokens, 73 tool uses, 8.8 min (from its completion notice).

## Closed

Each finding of the run over the last round is small and inside the brief, and is fixed on main at landing: Spec 1 (the cite names "The Literature search's keys"), Spec 2 (the cite names "Where an opened tab lands" for `recent`), Standards 1 (`:153` and `:522` restated directly), Standards 2 (`:147` says what the client half is), Behaviour 1 (`:137` keeps the identity decision and its reason: a commit sets `user.useConfigOnly` through the environment so git never takes an identity guessed from the machine, the one setting oculus adds), Proof 1 to 4 (the report's stale quotes, rows and counts corrected in the landing report, which supersedes them; the builder's report is a record and is not rewritten).
