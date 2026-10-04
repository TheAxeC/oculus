# Step X3e brief check (on main at 039cd3988)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/X3e.md` (working copy, modified 00:56). Main moved from 5787e0220 to 039cd3988 while the check ran. `git diff --stat e354291af HEAD -- tools/oculus/src tools/oculus/tests tools/oculus/config` prints nothing, so the code premises still stand on the new head. The rulings Z438 to Z443 were committed at e9822c082 and 3c7f2e36d, after the brief was written, and the brief does not carry them yet. Findings are numbered 1 to 27 across the sections.

## 1. Names

- `the write token is missing or stale` (`grep -rn "missing or stale" src tests config --exclude=local.yml`): `src/lib/server/core/auth.ts:97`, `tests/server/core/auth.test.ts:27`, `tests/routes/edit/write.test.ts:27`, `tests/routes/git/git.test.ts:60`. The brief lists only `git.test.ts`.
- Git action function signatures (D5 adds `text` as the last parameter). `grep -rln "server/git/git-\|server/git/deposit" tests` also prints `tests/server/git/refs/{cherry-pick,delete-branch,detached}.test.ts` and `tests/server/git/untracked/{ignore,trash}.test.ts`, and none of these are in the paths. `switchBranch(root, name, roots = allowedRoots())` (`git-write.ts:353-357`) already ends in a defaulted parameter.
- `FilesPayload` (`grep -rn FilesPayload src tests`): `src/lib/state/client/payloads.ts:108-110` holds `z.object({ root, bookmarks })` through `unchangedAs`. That is a pass-through check (`data/shapes/shapes.ts:30-31`), so `folders` and `workspaces` arrive on the client unvalidated. `server/root/watch/bookmarks.ts:76` is unaffected.
- Section heads: `views/sources/files/sections/Outline.svelte:111` and `Timeline.svelte:144` each draw their own `<Section ...>`.
- `subrepositories`, `collapseAll`, `listNotes`, `changeGroups`, `pickerRoots`, `worktreeLabel`, `commitMenu`, `sessions.ch_group_empty`: no hit outside the paths (`grep -rln ... src tests`). The only importer of the worktree helpers is `refs/Worktrees.svelte`, which is in the paths.

Findings:
1. `auth.ts:97`: D5 says the sentence is "capitalised in place". Z442 rules that it is "worded once in the server catalog". The brief should follow Z442 and name the mechanism, since `tokenedBody` takes no catalog and has 18 callers. It should also add `tests/server/core/auth.test.ts` and `tests/routes/edit/write.test.ts` to the paths and to "Tests". `write.test.ts` is in `tests/tiers/essential.txt`, so `npm run test:quick` goes red without that edit. Z442's "eleven test assertions" does not reproduce: the grep finds three.
2. The five `tests/server/git/refs/` and `untracked/` files call the changed functions, so they must join the paths. The brief should also say how `text` follows the defaulted `roots` parameter.
3. Add `src/lib/state/client/payloads.ts` to the paths, with `filesShape` gaining `folders: z.array(z.string()).optional()` and `workspaces: z.boolean().optional()`.
4. A5 needs `Outline.svelte` and `Timeline.svelte` to pass the drag props to `Section`, and neither is in the paths. `Timeline.svelte` is in D42's paths (finding 15).
5. `Tree.svelte` is limited to "the row `<li>` at :276-291 and the key handler wiring only". A1's "below the last row, the roots go last" needs the `<ul>` at `Tree.svelte:266`, where `ondragleave={dragger.left}` sits. A1's "styled there" needs the style block. The restriction should be widened to both.
6. Z438 names "the notes test file", but none exists: `grep -rln "fs/notes\|listNotes\|saveNote" tests` prints nothing. The brief should name a new file, for example `tests/server/files/notes.test.ts` (that folder holds 8 items), in the paths and under "Tests". It should also replace "Tests" bullet 6 ("writes no test ... until the orchestrator has widened G31") with Z438's ruling.
7. D3 changes `switchDetached` (`git-write.ts:372-385`). That is a unit of G33, whose test is `tests/server/git/refs/detached.test.ts:24`, 'detaches HEAD at a hash on a clean tree'. The brief should add an untracked-only row there and add the file to the paths.

## 2. The step line

- Roots, bookmarks, notes and sections reordered by drag: A1 to A5. A second Collapse Folders press: B1. Nested repositories to a configured depth: E1 to E3. The dirty dot (Z359): F2. Z358: F1. Z311: D16.
- Z289's defects: X3a-1 to X3a-6 (C1 to C6), X3a-7 (D15), Q88c-1 to Q88c-14 (D1 to D12, with Q88c-3 under C6), Q88c-19 (D17), Q88c-20 (D13), Q88c-21 (F3), D13a-5 and A1-4 (D14). D27-3, Q88c-22, the Graph wait and X3a-1's Delete are in G.

Findings:
8. A6 moves "an open editor within its pane" with Alt+Up and Alt+Down. The step line, Z263 and Z284 name four lists (roots, bookmarks, notes, sections). No item gives Open Editors a drag, so "The move writes as a drop does" has no drop to follow, and no case covers it. The brief should either remove it or state it as a decision, since it is a keybinding no ruling names, and give it a case.

## 3. Premises

Every other premise reproduces: the line counts, the 62 lower-case literals by file, the folder counts, `subrepositories` at `git.ts:144-155`, `relevant` :119, `heard` :300, `listingAnswer`, `openHead` :431-437, the switch refusals, `CommitBox.svelte:67-73`, `changeGroups`, the Graph counts at :358 and :417, `worktreeLabel`, `pickerRoots`, `openWorktree`, the size of `Palette.svelte` (523), the Ticker titles, `.dirty`, `TabFace.svelte:157-159`, the `dismiss` glyph at `glyphs.yml:32`, `lucide-static/icons/target.svg`, no `head` glyph, `ls config` failing at the hub root, the colours test deleted by 2af5d443a, and no ADR. The library versions also match `npm view`.

Findings:
9. `ACTIONS` is at `fs.ts:487-494`; the brief says :494-501.
10. X3a-2 (the breadcrumb row pushing the tree down) no longer has its cause in the Files view. X3c (1e14d2799) removed `Breadcrumb` and `crumbsOf` from `Files.svelte`, and the crumbs now sit on the file tab's strip (`shell/panes/strip/tab-crumbs.ts`). The brief files X3a-2 under C4 without saying this. It should say the breadcrumb row is gone, that C4 is the same defect for the message lines, and that the look checks that no row moves.
11. "`WORKSPACES` ... is marked only by the store's own writes" is incomplete. `invalidate` marks `['fs']` (`fs.svelte.ts:669-671`), and Refresh calls it (`Files.svelte`, `onrefresh={invalidate}`). Also, `refresh(root, version)` at :684 has no caller: `grep -rn "fs.refresh" src/lib` prints nothing. C2 should either use it or remove it.
12. Small line drifts: the roots are at `sources.yml:96-101`, not :96-102. The `<li>` attributes run :276-288. `loadSourceDraft` returns early for every draft read in this lifetime, working files included (`source.svelte.ts:295`), not only head and index drafts.
13. `spec.md:48` says only "colours from `themes/tokens.css`". The rule that `currentColor` is allowed for `color` but not for `background` came from the deleted test. The brief should attribute it that way, and finding 23 adds the check that F2 now lacks.
14. The brief's rulings list and section G predate Z438 to Z443. Z441 rules three things. D27-3 is read at X3f's landing look. The Graph's first read, the 5 s Delete and Q88c-19's server half go through `/diagnose` before the builder starts, and a cause found joins the brief. Q88c-22 is closed. G still says all five are "held out ... until the orchestrator rules", and the open item Z443 (G13's sentence against the throwing readers) is not named.
15. The brief judges no shared paths. The state file's dispatch block lists five steps in flight: X3f, D37, S5, H3 and D42. Line 329 names only X3f and D37 for `HELP.md` and `DESIGN.md`, but S5, H3 and D42 write them too.
   - **X3f** (worktree diff): Tree.svelte 100-104 and 194-197; Source.svelte 42-49, 89-100, 300-305 and 405; fs.svelte.ts 165-168 and 532-564; RootedTree.svelte 70; files.yml 150. These are apart from X3e's regions, so the merge is simple.
   - **D37** (worktree diff): ops.svelte.ts 67-80 and 195-224 against X3e's 555-590; repositories.svelte.ts 121-263 against 431-437; model-sessions.ts 279-361 against 615. Simple.
   - **S5** (brief): `config-write.ts` 68-79 sits next to X3e's 80-89. `config-checks.ts` (FINDERS against READERS), `context.ts` (303-310 against 282 and 355), `server.yml`, `HELP.md` and `tests/checks/config/config.test.ts` are shared. `options.yml` matters most: Z428 changes the entry vocabulary (`heading:`, `min:`, `max:`), so E1's new `repository_scan_depth` entry must be written in whichever vocabulary is in force at landing.
   - **H3**: `config/sources.yml` comment lines 12-13 and 24-86. E1's key and comment should sit after the roots (:101), and the brief should say so. `app.yml` line 12 does not touch `app.palette` at :17.
   - **D42**: `Files.svelte`, `Sections.svelte`, `files-view.ts`, `section-state.ts`, `fs.svelte.ts`, `reveal.ts`, `ShowPath.svelte`, `files.yml`, `repositories.yml`, `model-sessions.ts`, `git-reads.ts` and `Timeline.svelte`. A5 restructures `Sections.svelte` and `Files.svelte` and adds `sections` to `FilesView`, where D42 adds the Timeline's state. By `spec.md`'s rule on parallel steps this is not a simple merge: X3e waits for D42, or the orchestrator writes its judgment.

## 4. Cases and checks

Findings:
16. The brief says every case that is not a test "is checked by the orchestrator's look on TEST". The brief template says "Every other case of a code step is checked by a run the report quotes". Several cases are server-side and a look cannot see them without crafting requests: 11, 13, 14, 18, 23, 24, 25, 26, 41, 83 to 86, and 81's start refusal, which would need a restart of Axel's server. These should be checked by a quoted run or by the guarded table rows.
17. Case 48 is not the Q88c-3 cause the brief names. It should say the repository was added as a root by a hand edit of `sources.yml` while the page is open.
18. Case 80 names `.agents/worktrees/X3f`, which X3f's landing removes before X3e's look. The case should name a worktree that exists at the look, such as X3e's own.
19. Case 68 ("Open Worktree, then the worktree's root removed") does not pair inputs with results. Rewrite it as (a) the added worktree held by a root: Files shows that root by its key; (b) no root holds it after the add: `repositories.worktree_open_failed`.
20. Case 35 and B1 disagree. B1's test "(the result equals what was open, roots aside)" fails once the first press drops a closed root's remembered folders, yet B1 also says those folders "do not count". The brief should define an open folder as one that is drawn (its root and every folder above it open) and say whether the press drops the closed root's remembered keys.

## 5. The question

- Cases 1 to 10, 12, 15 to 17, 19 to 22, 27 to 40, 42 to 47, 49 to 79, 82 and 87 to 89 could not pass without the goal: each names the visible result or the file written.

Findings:
21. Verify 8 (`grep -rn "failed(\`[a-z]\|failed('[a-z]\|error: '[a-z]" src/lib/server/git src/lib/server/core/auth.ts`) can print nothing while lower-case sentences remain:
   - multi-line `failed(` literals: `git-write.ts:255-256`, `:512-513`, `:548-549`, `:580-581` (a template that starts with `${what}`), and `git-refs.ts:77-78`;
   - template `error:` literals: `git-routes.ts:341` and `deposit-routes.ts:122`;
   - sentences returned by helpers: `git-write.ts:181-182`, `:186`, `:750-751`, `git-refs.ts:106` and `deposit.ts:753-754`;
   - `auth.ts:97` itself, written `?? 'the write ...'`.

   Case 58 reads only the catalog values. The brief should give the full inventory and a check that reads every string literal in `server/git`. It should also say whether `server/core/git/run.ts`'s `'git timed out'` and `'git failed'` are in scope, since they reach the same answers.
22. The verify list does not run the tests of the guarded entries whose code the step changes, which `spec.md`'s "What every package obeys" requires: G1 (`tests/routes/edit/write.test.ts`, `tests/routes/files/fs.test.ts`, `tests/server/files/picker.test.ts`), G2 (`tests/server/files/fs.test.ts`), G6, and G33's `refs/` and `untracked/` tests. S5's brief item 5 shows the form.
23. F2 has no check now that the colours test is deleted. Add `grep -rn "background: currentColor" src` printing nothing.

## 6. Implied inputs

Findings:
24. Missing from "Cases", with their expected results:
   - `sources.yml` unwritable during `order`: refused `unwritable`, file unchanged.
   - An `order` body whose `keys` is absent, not a list, or holds non-strings: which refusal.
   - A `roots:` list with a comment line between entries: the comment kept.
   - `keys` or `ids` sent to `POST /api/fs` that is not a list: refused, or read as empty.
   - Duplicate ids in `order-notes`: kept once.
   - `order.json` that is valid JSON of the wrong shape (`version: 2`, or `order` not a list): treated as unreadable or not.
   - `repository_scan_depth` absent: the reader throws at start naming the key, as its siblings do.
   - An unreadable folder in the depth scan: skipped.
   - The merge of a message with no root (`{ root: '', bookmarks }` or `{ root: '', workspaces }`) with a rooted message carrying `folders`: keep that root and its folders, and OR both flags. C1 gives no rule for `workspaces` in `mergeFiles`, so a merged message loses it, and C2 does not make a version gap mark `WORKSPACES`.
   - `notes-order-unreadable` has no catalog line. `refusal()` (`acts/refusal.ts:11-24`) would fall back to `files.refused_other` with the code, so A4 needs a `files.refused_notes_order_unreadable` sentence.

## 7. ADRs

- `ls docs/adr` and `ls tools/oculus/docs/adr` both fail, and `.agents/plan.yaml` has no `adr:` key. No record.

Findings: none.

## 8. Dictated text

- These hold: `ROOT_DRAG = 'application/x-oculus-root'` (`grep -n ROOT_DRAG`, :72); `files.refused_roots_changed: ...` (:73); `{ "version": 1, "order": [ids] }` (:75); the keymap lines (:77, :110); the `FilesPayload` type (:86); `ui.tab_deleted: Deleted` (:88); `"{0} Git said: {1}"` (:99); `head: "@"` and `head: target` (:103); the depth sentence (:115), which matches its siblings' form.

Findings:
25. F3 (:123) gives the keys as `palette.cmd_<name>`, but the group is `app.palette` (`app.yml:17`, read as `t('app.palette.cmdk_placeholder')` at `Palette.svelte:332`). The theme hint is built from config (`<${themes.join(' | ')}>`, `palette.ts:280`), so its catalog line needs a `{0}` placeholder.
26. D5 (:99) gives one singular, "1 file is in conflict", for all four `_one` keys. Each should be dictated whole, for example `commit_unmerged_one: 1 file is still in conflict; resolve it before committing.` and `merging_one: A merge is in progress. 1 file is in conflict.` D5's "each ending with a full stop" also departs from `server.yml:25-54`, where no sentence ends with one. The brief should choose and say which.
27. D17's `files.picker_open: The folder panel is open.` (:111) repeats `files.picker_busy: The folder panel is already open.` (`files.yml:145`). Under the prose standard's one-name-per-thing rule, the brief should reuse `picker_busy`.

## The six open items and the five causes

- **Z438**: stated correctly. G31's Code line names `fs.ts` but not `fs/notes.ts`. "The notes test file" does not exist (finding 6).
- **Z439**: holds. The shapes match A2, A4, C1 and D9.
- **Z440 and Z443**: stated correctly. The `settings.ts` readers throw at :68, :81, :155 and :213, while G13 says a default is used. Z443 is booked under the state file's open items.
- **Z441**:
  - D27-3: X3f's brief rewrites the press path (`pressing.ts`, `FileRow.svelte`), so this holds.
  - Q88c-22: closed correctly. `ls config` at the hub root fails, and a grep of `~/.oculus/changes.jsonl` (39 lines) for `config/behavior` prints nothing.
  - The Graph wait, the 5 s Delete and Q88c-19's server half: no cause is visible read-only. `handlePick` answers `busy` while `state.open` is set (`picker.ts:105`), so a second panel from one server is not explained by the code.
- **Z442**: the mechanism is right, but the count of eleven does not reproduce: three assertions (finding 1).

## Declined to judge

- What VS Code does (Explorer collapse-all, whether its repository scan enters dot folders, its badge rendering, `openHEADFile`): no VS Code source is available here.
- The causes of the three items Z441 sends to `/diagnose`: these need a probe on a running server.
- Z439's claim that D37's reader uses the `files` payload's `root`: not checked against D37's worktree.

Agent usage: af2605318ca450b06, claude-opus-5-5, 356,640 tokens, 172 tool uses, 18.3 min.

## Closed

Each finding is closed by a change to `agents/briefs/X3e.md`, listed in its section "Changes from the brief check" under the same number. The premises were read again at e354291af, the brief's base, with `git show e354291af:<path>` and `git grep ... e354291af`; X3f landed at b68058ce4 while the brief was closed, and the brief says which of its files that moved and that `/spec` reads every premise again on main once D42 has landed (Z452).

Names:
- 1. The token sentence: change 1 (Z442). `tokenedBody` gets the catalog through `RefusalShape.text`, read only when a refusal is worded and passed by the nine routes that answer the sentence (decision 26). The count is the grep's: three assertions (`auth.test.ts:27`, `write.test.ts:27`, `git.test.ts:60`), not eleven; 13 call sites of `tokenedBody` and 5 of `gatedBody`, 18 routes.
- 2. The git tests outside the paths: change 2.
- 3. `payloads.ts`: change 3 (item C0).
- 4. `Outline.svelte` and `Timeline.svelte`: change 4.
- 5. `Tree.svelte`'s restriction: change 5.
- 6. The notes test (Z438): change 6. `tests/server/files` holds 8 items at HEAD (`git ls-tree --name-only HEAD tools/oculus/tests/server/files/ | wc -l`), 9 with the new file.
- 7. `detached.test.ts`: change 7.

The step line:
- 8. The open-editor move (Z451): change 8. Z451 names A6 as the move of an open editor within its pane, so that move is removed; Alt+Up and Alt+Down for roots, bookmarks, notes and section heads stay, since Z284 rules them.

Premises:
- 9. `ACTIONS`: change 9.
- 10. X3a-2: change 10.
- 11. `WORKSPACES` and `refresh`: change 11 (decision 29, `refresh` used).
- 12. Line drifts: change 12. The `<li>` and `loadSourceDraft` parts are corrected; the roots part does not reproduce (`git show e354291af:tools/oculus/config/sources.yml | grep -n "^roots:\|youtube-downloader"` prints :96 and :102, and the same at 039cd3988), so the brief keeps :96-102.
- 13. The colour rule's source: change 13.
- 14. The rulings after the brief: change 14 (Z438 to Z443, Z451, Z452 listed; section G by Z441; Z443 named and not decided).
- 15. Shared paths: change 15 (Z452).

Cases and checks:
- 16. How a case is checked: change 16.
- 17. Case 48: change 17.
- 18. Case 80: change 18 (`.agents/worktrees/D42/.git` is a file, `ls -la`, so a step worktree is found by its `.git` file).
- 19. Case 68: change 19.
- 20. B1 against case 35: change 20.

The question:
- 21. The inventory and its check: change 21. Decision 27 takes `server/core/git/run.ts`'s 'git timed out' and 'git failed' and the read refusals of `core/git` into scope, since they reach GET /api/git's answers and the Repositories row's failure line (`Repo.svelte:113`, :186); the lazy option, the multi-line and helper sentences left out, is named there.
- 22. The guarded tests in the verify list: change 22 (verify 4).
- 23. F2's check: change 23 (verify 11).

Implied inputs:
- 24. The missing inputs: change 24 (cases 90 to 100, decisions 30 and 31). `writeRoots` drops a comment line among the list's entries on an add or a remove today (read from `roots.ts:67-194` and `list-edit.ts:73-84`, 113-176); case 92's first run is to confirm it on the unchanged tree.

ADRs: none.

Dictated text:
- 25. The palette keys: change 25 (`app.palette`, `{0}` in the `theme` hint).
- 26. The singulars and the full stop: change 26 (decision 28, no full stop, as `server.yml:24-54`).
- 27. `picker_open`: change 27 (`files.picker_busy` reused).

Dictated lines rewritten or added after the check, each read against `agents/spec.md` (the configuration's `standards` list is empty, `grep -n standards .agents/plan.yaml`), its rules on ASCII, catalog lines and catalog groups, and the hub's prose rules:
- `grep -n "refused_roots_invalid: The" agents/briefs/X3e.md` (:88), `files.refused_roots_invalid: The roots in config/sources.yml cannot be rewritten without losing a line, so the file is left as it is.`: holds; joins `files`, which lives in `files.yml` alone.
- `grep -n "refused_notes_order_unreadable: The"` (:90), `files.refused_notes_order_unreadable: The file that keeps the order of the notes cannot be read, so it is left as it is.`: holds.
- `grep -n "catch(\[\])"` (:88, :90), `keys: z.array(z.string()).catch([])` and `ids: z.array(z.string()).catch([])`: hold, code lines read whole, the form of `textShape` (`fs.ts:425`).
- `grep -n "token_refused: The"` (:119), `server.auth.token_refused: The write token is missing or stale` and `server.auth.body_not_json: The body is not JSON`: hold; a new group `server.auth` in `server.yml`, no full stop as its neighbours.
- `grep -n "git_said: '"` (:117), `server.git.git_said: '{0} (Git said: {1})'`: holds.
- `grep -n "ch_failed: 'Git"` (:117), `sessions.ch_failed: 'Git could not read this repository: {0}'`: holds; the key stays where it is (`changes.yml:70`).
- `grep -n "merging_one:\|rebasing_one:\|cherry_picking_one:\|commit_unmerged_one:"` (:123-126), `repositories.merging_one: A merge is in progress. 1 file is in conflict.`, `repositories.rebasing_one: A rebase is in progress. 1 file is in conflict.`, `repositories.cherry_picking_one: Cherry-picking. 1 file is in conflict.`, `git.commit_unmerged_one: '1 file is still in conflict; resolve it before committing.'`: hold; each joins its plural's group and file, with a full stop as its plural has.
- `grep -n "cmd_theme_hint: '"` (:150), `app.palette.cmd_theme_hint: '<{0}>'`: holds.
- The dictated `files.picker_open` line is gone; `files.picker_busy` is the existing line.
