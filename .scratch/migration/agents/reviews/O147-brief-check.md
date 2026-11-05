# Brief check: O147

Brief check of O147, the Present view's filter bar (`/Users/axelfaes/workspace/oculus/.scratch/migration/agents/briefs/O147.md`), read against main at 1842b5751 (`git log -1 --oneline` printed `1842b5751 Give each deck its frame size and raise slide findings`). I changed nothing.

Before the checks: `plan.md` has no `## Goal` section. `grep -n '^## ' plan.md` lists only `## Steps, in execution order`, `## Could run in parallel`, `## Rulings`, `## Agents` and `## Blocked, and by what`. I took the goal to be the filter bar that rulings 676 and 682 describe (`plan.md:3553` and `:3559`), as the prompt says.

## Names

1. **The answer's `DeckMember` fields reach code outside the write list that the change makes wrong.** `src/lib/state/life/arrange.ts` is not on the write list:
   - `decksOf` (`arrange.ts:99-106`) makes a tile for every one of `group.members`. The brief keeps `members` whole and adds `kept`, so while a filter is in force the Overview would draw the hidden members as empty tiles. That contradicts item 4 ("The Overview's group tiles are the kept members").
   - `deckStepped` (`arrange.ts:288-305`) steps among `group.members`. Move Earlier and Move Later while filtered would swap a kept tile with a hidden one. Nothing would change on screen, and a hidden member would move, which contradicts "the members the filter hides kept in their places".
   - `holds` (`arrange.ts:235-237`) is unaffected.
   - `Group.svelte:134` draws `count={block.group.members.length}`. It is on the list, but the brief does not say whether that count follows the kept members.
2. **`DeckProject` is built in four places.** `grep -rn 'DeckProject\b' src tests` and reading the files show `src/lib/server/content/deck/read.ts:41` (on the list), `src/lib/data/index.ts` `deckProjects` (used at `:339`, not on the list), `tests/checks/config/integrity.test.ts:~90-99` (not on the list; a read-only real-hub test) and `tests/data/sources/present.test.ts` `project(...)` (on the list). A required new field breaks the type check in the two files off the list. The brief should say the field is optional, or widen the list.
3. **Every peek at the deck query key is affected.** `grep -n '\[KIND' src/lib/state/life/present.svelte.ts` shows `:273` (the read), `:339` (`prune`, `queries.peek([KIND, one.root, one.path])`) and `:419` (`savedFrame`).
   - Once the key holds the kept list, the peeks at `:339` and `:419` miss a filtered entry.
   - `savedFrame` feeds `createPresenting(savedFrame)` (`:432`), which sizes the audience window (`audienceFeatures(frameOf(held.ref))`).
   - `prune` decides which too-tall measures stay (C12).
   - The file is on the list, but the brief names only `load`, `drawn` and the key.
4. **`Overview.svelte:60-67` makes its own deck query.** It calls `present: { deck: deckOf }` and `files: () => deckOf(ref).deck`. Unchanged, it opens a second, whole-deck query per pane beside the filtered one. The file is on the list, but item 4 does not mention this read.
5. **The two `readDeck` functions:**
   - The client `readDeck` (`present.svelte.ts:202`) is called from `src/routes/present/show/+page.svelte:127` and `src/routes/present/print/+page.svelte:79`, both on the list.
   - The server `readDeck` (`server/content/deck/read.ts:77`) is also called by the write route, at `src/lib/server/edit/writes/config/lists/deck/deck.ts:212` and `deck-files.ts:143` (off the list). These stay correct if `keep` is optional and `members` stay whole, since `knownIn` (`deck.ts:85-97`) reads the names only.
   - The head comment at `server/content/deck/read.ts:13-15` ("the write ... reads the group's members, candidates and missing names through the same function") stays true under that design.
6. **`candidates` share the `DeckMember` type** (`model-deck.ts:208`). With `DeckMember` gaining `project` and `kept`, candidates gain them too, and the brief does not say what `kept` means on a candidate.
7. **The name `project` already means something else in the same model.** `DeckSummaryRow.project` is display words (`read.ts:466`: `project: project === null ? member.doc.title : project.short || project.title`). `Doc.project` is a `DeckProject` object (`groups.ts:27`). The new `DeckMember.project` would be an id string, so one name would carry three meanings in one model.
8. **`keep` collides with no other key of the deck route.** The route's keys are `root`, `path` and `drafts` (`endpoint.ts:24-31` and `:44-47`). The same word is a local function in `present.svelte.ts:513` (`const keep = ...` in `hold`) and is close to `keeps` (`groups.ts:63`, the `find:` filter). Neither is a wire collision; both make the code harder to read.
9. **`filters`** is the name the boards use for their own instance state (`Collection.svelte:205`, `held.filters`). It means the same thing there, and nothing collides.
10. **The channel's messages and the error word are not named.** `messageShape` (`present.ts:526-534`) is parsed by `show/+page.svelte` `hear` and `present.svelte.ts:478` `hear`. The brief leaves the new kinds to the builder. Under `spec.md:18`, a wire format the brief does not name is a decision to report, so the brief should name the kinds and the 400 error word. Today every 400 of the route says `{ error: 'invalid' }` (`endpoint.ts:46`, `:66`, `:69`), and "naming the parameter" is a new error word.
11. **The ids of the filter groups are not named.** `filters` is "a map from a group id to the picked values", and that map is saved in the layout under `~/.oculus`. The boards use `stage` (`map-bar.ts:40`, `STAGE_FACET = 'stage'`) and the facet keys `status`, `tier`, `pillar` and `form`, while the collection bar uses `project_<facet>` (`collection/bar.ts:80-83`). The brief should say which.
12. **Docs that describe the behaviour:** `docs/HELP.md:331` (the Present paragraph) and `docs/templates.md:1910` (the `present.yml` section) are both on the list. `docs/data-map.md:220` describes the deck file only and stays true.

## The step line

The step line is `plan.md:1684`.
- "the boards' filters (Stage, Status, Tier, Pillar, Form) on the Present view": item 2, second bullet, and item 3.
- "held in the pane's saved state": item 2, first bullet.
- "narrowing the member decks every group of project decks shows": item 1.
- "in the Overview": item 4, second bullet.
- "on screen" and "in the presenter screen": item 4, first bullet.
- "in the PDF": item 4, third bullet.
- "the summary and grid slides count only what the filter keeps": item 1, fourth bullet.
- "the file is never written": item 2, first bullet, and item 5.
- "a 'Filtered: n of m decks' line with Clear in the toolbar": item 3, second bullet.
- "drawn only when the deck holds a group of project decks ... a deck opened from Files that holds none shows no bar": item 3, first bullet.

Every part has a requirement. The Project facts toggle of ruling 682 is step O148 (`plan.md:1685`) and is correctly outside this step.

## Premises

1. **The full project id is not available in `deckProject`.** The brief says the `DeckProject` `id` is "the bare id, `bareId(project)`, built at `read.ts:41-57`", and that `deckProject` "keeps [the project's own id] beside the bare one". On the tree, `readDeck` passes `ofHub(source.projects, hub.key).map(deckProject)` (`server/content/deck/read.ts:95`). `ofHub` (`src/lib/data/helpers/hub-names.ts:98-102`) already replaces `id` with `bareId(record)` and keeps `root`. So `deckProject` never receives the full `<hub>:<key>` id, and its `bareId` call is a no-op. The full id has to be rebuilt (`hubId(rootOf(project), project.id)`) or taken before `ofHub`. As written, the brief's instruction cannot be done inside `deckProject`.
2. **A full id is not needed.** The deck answer carries `hub` (`model-deck.ts:266`), and the reader's projects are those of that one hub, so the bare key is already unique there. Matching by bare key, with the client mapping board items through `addressOf` restricted to `deck.hub`, adds no field to `DeckProject`. This is a judgment on decisions 1 and 2. `merge.ts:14-15` says "The joined id is internal: no file, form, finding, label or address writes or shows it". The internal id does already travel in a query at `files.svelte.ts:141` (`/api/project-files?id=`), so this is not a defect.
3. **`Present.svelte` is at the size limit.** `wc -l` gives 520 lines, the component limit (`spec.md:48`). Any line added forces a split, and `src/lib/views/academic/present` already holds 10 items (`ls | wc -l`), so a split-out component must go into a subfolder. The brief does not say this.
4. **The print page has no wait of its own.** The brief says the print page waits "the time it already waits to be ready". On the tree, the page itself waits nothing. The host waits `READY_WAIT_MS` from before the load (`src/desktop/windows/print.ts:51`, `const deadline = Date.now() + (options.wait ?? READY_WAIT_MS)`), and a browser tab has no wait at all (`print/+page.svelte:86-104`). If the page waits `READY_WAIT_MS` for the answer and only then fails, the host's deadline passes first and it answers a timeout.
5. **`FilterBar.svelte` always draws a Search box,** and draws Mine only whenever `named` is set (`FilterBar.svelte:144-158`, `<Search fill value={search} ...>`). Its `search`, `placeholder`, `onsearch`, `named`, `mine`, `pressed` and `onmine` props are required (`:36-58`). The brief says to draw the filter "as a board does" and names no search. Reused unchanged, the bar shows a search box the step never asked for, and that box does nothing unless the brief says what it searches.
6. **Line references that are off:**
   - `stageGroup` is at `map-bar.ts:122-157` (doc comment from 122, function 128-157); the brief says 122-150.
   - `FACETS` is at `presets.ts:287-305`; the brief says 287-304.
   - Every other reference reproduces: `groups.ts:18-32` and `:119`; `kinds.ts:25-47`; `read.ts:324-330`, `:333-345`, `:419-483`, `:500-516` and `:537-562`; `present.ts:63`, `:82`, `:498`, `:506`, `:514` and `:526-534`; `present.svelte.ts:202`, `:280` and `:289`; `Present.svelte:197`; `links.ts:54-63`; `guarded.md:31-33`; `items.ts:135`; `facets.ts:151` and `:152-158`; `Collection.svelte:177-198`; `collection/bar.ts:216-329`; `FilterBar.svelte` 213 lines; `Bar.svelte` 108 lines; `present/acts` 5 items; `state/life` 10 items.
7. **`deckShape` keeps the new fields.** It is `unchangedAs` (`src/lib/data/shapes/shapes.ts:45-47`), which keeps the value whole, so the new `project` and `kept` fields reach the pane with no change to the shape. The brief is silent on this and needs no change.
8. **The worktree is not named.** The brief names its base copy `.agents/worktrees/O147-base` but not the worktree itself (`spec.md:32` says the brief names it). `ls -d .agents/worktrees/O147*` printed "no matches found", so neither exists yet. The base file `.agents/worktrees/O147-base/unused-exports.txt` could not be checked for the same reason.

## Cases and checks

1. **Item 6 asks for two tests that no `guarded.md` entry covers.** `guarded.md:3` says a test exists only as the test of one entry, and `spec.md:60` says a step that needs a new entry stops and asks Axel, writing no test until he has ruled. The greps found:
   - `src/lib/state/life/present.ts` and `parsePresentState`: no entry (`grep -n -o -E '[^;]*state/life[^;]*' guarded.md` printed nothing).
   - A 400 for a malformed `keep`: no entry. G2 covers the deck route only for paths outside the roots.
   - `tests/state` has no `life` folder.
   - The reader's narrowing can be a row under G32 (`guarded.md:276-278`, Code `src/lib/data/sources/` and `src/lib/server/content/deck/`, Test `tests/data/sources/present.test.ts`). The brief should name G32 and the title.

   As written, the builder must stop at item 6, or write tests the rules forbid.
2. **C1 cannot pass on the hub as written.**
   - No member project carries a status chip. Of the hub manifests, 113 have `chips: []`, and the only chipped ones (`projects/active/novel-math-primitives`, `projects/active/sandpile-operator` and three side projects) have no `present` deck (`ls -d .../present` gave "No such file"). So the Status group has no value.
   - `filterGroups` draws no group for a facet with no value (`filter-menu.ts:148-170`: "A facet with no values draws no group").
   - Tier has the one value `research`, and only 3 members carry `form:`.
3. **C2 picks a stage no member holds.** C2 says "Pick Stage `published`", but no member deck's project is at `published`. Counted over `projects/*/*/present`: submitted 11, nascent 6, accepted 2, revision 2, scoping 2, exploring 1. `stageGroup` lists only stages a member is at, so `published` cannot be picked from the bar. `submitted` would work.
4. **C7 covers dragging only.** Move Earlier and Move Later while filtered (`deckStepped`, Names 1) have no case.
5. **C8 and C9 can only be seen at the look in Chrome** (`spec.md:65`). The desktop host's hidden print window (`print.ts`) is never exercised there, so C9 covers only the browser-tab path.
6. **C12 needs the peek fix** in `prune` and `savedFrame` (Names 3), which the brief does not name.
7. **The report shape omits C10 to C12** from "every host- or user-visible change ... for C1 to C9 and C13". C12, two panes with different filters, is visible.
8. No case asks the builder to check a place the step does not change, apart from C2's `git status` in the scratch hub, which is the look's.

## The question

For each item, case and the step line: could it pass without the filter bar of rulings 676 and 682 being reached?
- **Item 1 (reader and route):** yes, with the pane never sending `keep`. The tests prove only the server half.
- **Item 2 (pane state and query):** yes. The key can carry the kept list while `prune` and `savedFrame` peek the old key, so measures drop (C12) and the audience window loses its frame.
- **Item 3 (bar and line):** yes. It can pass with a Search box drawn that does nothing, and with the Status group missing on the hub (Cases 2).
- **Item 4 (Overview):** yes, while the write list excludes `arrange.ts`. Hidden members show as empty tiles and Move Earlier moves hidden members, and C7 (drag) still passes.
- **Item 4 (audience and PDF):** yes, in the desktop app. The look in Chrome exercises only the browser-tab print path, and for that path "the pane answers only while its export is in progress" is undefined: `exportPdf` returns right after `openTab` (`export.ts:85-88`), so a literal reading makes the print tab hear no answer and print nothing.
- **Item 5 (docs):** no; the docs are read at review.
- **Item 6 (tests):** blocked (Cases 1). If written anyway, it passes without the client half.
- **C1:** no hole of its own beyond Cases 2.
- **C2 and C4:** C2 as written cannot be run through the bar (Cases 3). C4 needs two picks in different groups, or a value no member holds any more, to reach "keeps nothing". The case does not say which, so it may be run by a hand-made state only.
- **C6:** could pass while the first answer after a reload is the whole deck (Implied inputs 4). The case only checks the picks.
- **C8:** could pass while the audience reads the right deck only when the pane is drawn (Implied inputs 5).
- **C10 and C11:** no; they check the server directly.
- **C13:** no.
- **The step line:** it carries no check of its own. Its gate is the cases, so every hole above is the step line's too.

## Implied inputs

1. **A project in two groups, and the identity of a member.** m is "the number of distinct member decks", but the identity is not named. `DeckMember` has `name`, `title` and `path`, and no root. A project deck kept in a repository has `path` `present` (`read.ts` `docAt`: `path: relative(realOf(root.dir), dir)` with the repository as the root), so distinct-by-path merges every repository-held project deck into one. Expected: a deck in two groups counts once in m and in n, by its project id (or root and path).
2. **A member deck reached by `find:` from another repository root.** `under(doc.root, ...)` globs only under the deck's own root (`read.ts` `under`, `groups.ts:83-87`), so `find:` cannot reach another root. A repository-held project deck is a member only through a group with no `find:` (`finder.projects()`), and its `Doc.project` is set from `projectDirs`. Expected: kept by its project id like any member. No gap beyond Implied inputs 1.
3. **A filter value no member holds after a manifest change.** `stageGroup` (`map-bar.ts:135-139`) and `filterGroups` (`filter-menu.ts:168-171`) list a picked value nothing holds at count 0, so it can be taken out. The brief should state the outcome: with that pick alone in force, keep is `[]`, every group of project decks is empty, and the line reads "Filtered: 0 of m decks".
4. **Reload with picks saved.** The kept projects are defined from the answer's members, so the first request after a reload cannot carry `keep`. A whole deck is drawn first, then the filtered one. Before the first snapshot `board()` returns `[]` (`selectors.svelte.ts:364-367`), so a keep computed then would be empty and draw "0 of m". Expected: no `keep` is sent until the board items and the members are both held, and the brief should say so. Computing the kept set from every board item that passes the picks would avoid the two-step read.
5. **Presenting while the pane is not drawn.** The presentation goes on while the pane is not drawn (`Present.svelte:50-51`), and the presenting store answers the audience's `opened` (`present.svelte.ts:481-486`). If the keep is computed in a view module, nothing answers an audience window that reloads while another page is shown. Expected: the keep travels in the `PresentLink` (`present.svelte.ts:299-303`), computed from the instance state and the selectors as `current` is.
6. **Two panes on one deck exporting or presenting at once.** The channel is one per deck (`presentName`, `present.ts:514-516`), and under G47 the print address can carry no id to tell the panes apart. Two overlapping exports can each receive the other pane's keep. A second presenter on the deck steals the lock and takes the window over (`present.svelte.ts:536-541`), so presenting is one pane at a time, but exporting is not. Expected: named in the brief, for example the print page takes only an answer that names the deck and the moment of the export's start.
7. **Drafts while filtered.** `drawn(ref, drafts)` must carry `keep` (the brief says so). The effect in `live.svelte.ts:47-66` re-runs on `reads.files()`, which changes with the filtered query, and its `current` flag drops a superseded answer. Expected: the drafted deck is the filtered deck over the drafts. The brief covers this.
8. **The portfolio deck vs a project's own deck.** `leftDeck` (`present.ts:300-308`) spreads `...held` into the next deck's state, so `filters` carry from the portfolio deck to a project's own deck. That deck usually holds no group of project decks, so no bar is drawn to clear the picks. Whether the line and Clear show, and whether `keep` is sent, is not stated. Expected: named in the brief, for example the picks are cleared when the pane opens another deck, or are not in force on a deck with no group of project decks.
9. **Two hubs in the workspace.** The board items hold both hubs' projects (`<hub>:<key>`), while the reader holds only the deck's hub's projects (`ofHub`, `read.ts:95`). A project `x` in hub A and another `x` in hub B: a pick keeping only `A:x` keeps `x` on a deck of hub A and not on one of hub B. This works with full ids only if Premises 1 is handled. With bare ids, the client must restrict the board items to `deck.hub`.
10. **A `keep` with duplicates, an empty string, ids no project has, or a large list in the GET query.** The brief names only "not an array of strings". Expected: duplicates and unknown ids are harmless and keep nothing extra. No cap is named, while the POST caps drafts at 64 (`endpoint.ts:21`).
11. **A member deck that itself holds a group of project decks.** The reader's narrowing applies in nested decks too, through `slidesOf` and its memo per request. The brief says "every group", so this is consistent, but it is not stated.

## ADRs

`test -d docs/adr || echo "no docs/adr"` printed `no docs/adr`. `git ls-files | grep -i -E 'design|adr|decision'` printed only `.scratch/migration/agents/briefs/PR2-design.md`, which is another step's brief. No record governs this step.

## Dictated text

`grep -n -E '"[^"]+"'` over the brief gives the dictated words at lines 29, 40, 53, 54, 56 and 97. `LC_ALL=C grep -c '[^ -~]'` over the brief printed `0`.
- **"Filtered: n of m decks" (`:40`, `:54`, `:56` as "Filtered: 0 of m decks"):** holds against the rules file (ASCII, plain), with two points. With m = 1 it reads "1 of 1 decks"; the catalogs handle a count of one with a separate key (`collection.yml:53-55`: `count`, `count_one`, `count_shown: '{0} of {1} shown'`). Also, the same state is worded "shown" on the boards ("{0} of {1} shown") and "Filtered" here, two words for one thing across views.
- **"Clear" (`:40`):** holds, and matches `search.yml:56` `clear: Clear`.
- **"n of m" (`:29`, `:97`):** the brief's own shorthand, not a user-facing string; holds.
- **"Filtered" (`:53`):** a reference to the line above; holds.

## Specific checks

1. **G47 and `window-guard.test.ts`.** The design keeps the addresses `?root=&path=`. `audienceDeck` (`links.ts:58-63`) requires the parameter keys to be exactly `path,root`, and the tests at `window-guard.test.ts:100` and `:120` test exactly that. Nothing in the BroadcastChannel design touches `src/desktop/`, so G47 and its tests stay unchanged. Holds.
2. **The desktop hidden print window.** `print.ts:52-58` makes the window with `windowPreferences(options.preload)` and no partition, and `grep -rn -E 'partition|session\.' src/desktop` found only `app.ts:160` `session.defaultSession`. `show.ts:7-9` states that the default session "is what lets its page and the presenter screen share a BroadcastChannel and a Web Lock". The print page loads the server's own origin (`export.ts:83`). So a BroadcastChannel between the main window's pane and the hidden print window works by the same mechanism the audience window already uses. This is a judgment from the code; I did not run it. The open point is timing (Premises 4): the host's deadline starts before the load, so the page must hear the answer well inside `READY_WAIT_MS` and say `data-failed` at once on no answer.
3. **The browser-tab fallback of `acts/export.ts`.** `window.open(address, '_blank', 'noopener')` (`Present.svelte:176`) opens the same origin in the same profile, so BroadcastChannel reaches it. `noopener` cuts `window.opener`, not BroadcastChannel. But "in progress" is undefined there, since `exportPdf` returns right after `openTab` (`export.ts:85-88`). The brief must define how long the pane answers on that path (The question, item 4 audience and PDF).
4. **Board items in the Present view's context.** `board` and `configMap` are selectors on the client state (`selectors.svelte.ts:182`, `:194`, `:364-367`, exported at `:797` and `:811`). Any view reaches them through `useState().selectors`, as `Collection.svelte:123` does. `mapPreset` comes from `$lib/state/boards/board` (`Collection.svelte:101`) and `vocabOf` from `$lib/state/shared/words/tones` (`:110`); `mapPreset` keeps every tier, role, stage, chip and form (`presets.ts:650-659`, all `null`). So the board items are available exactly as `Collection.svelte:177-198` uses them. The print and audience routes have no store and get the kept list from the pane, which is consistent. Caveat: `board()` is `[]` before the first snapshot (Implied inputs 4).
5. **Folder room for the new module.**
   - `present/acts` holds 5 items, so a new module fits.
   - `present` (10) and `state/life` (10) are full.
   - `tests/data/sources` holds 10, so a new test file there does not fit; the narrowing rows go into the existing `present.test.ts`.
   - `tests/state` holds 9 and has no `life` folder.
   - `spec.md:49` says "a new file goes where its concern already lives". The groups' rules (`facets`, `facetValues`, `stageGroup`, `filterGroups`) live in `src/lib/state/boards/`, so a view-layer module under `present/acts` holding them is placed by the brief against that rule. It also repeats much of `projectGroups` (`collection/bar.ts:288-329`, not exported), which is a DRY point the builder will meet.
   - The `Present.svelte` split (Premises 3) needs a subfolder with room: `screen` holds 4, `presenter` 1, `arrange` 7.

## Declined to judge

- The base file `.agents/worktrees/O147-base/unused-exports.txt` and the worktree itself: neither exists yet (`ls` printed "No such file or directory"), so they could not be checked.
- Whether a hidden Electron window throttles a BroadcastChannel message or a timer enough to miss `READY_WAIT_MS`: this needs a run in the desktop app, which a read-only check does not do.
- Whether the boundaries test allows `present/acts` to import `views/shared/forms/bar` and `state/boards`: judged allowed from `Collection.svelte:93-114` importing the same kinds of modules. I did not run `tests/checks/tree/boundaries.test.ts`.

Agent usage: a5ec4b5cba21b2e92, claude-opus-5-5, 286289 tokens, 113 tool uses, 16 min 3 s.

## Closed

Each finding is closed by a change to `agents/briefs/O147.md`:

- Names 1, `arrange.ts` off the list: `src/lib/state/life/arrange.ts` is on the list; item 4 makes `decksOf` the kept members, `deckStepped` step a kept tile past the next kept tile with hidden members in place, and `Group.svelte:134`'s count the kept members'; C7b added; a premise names the three.
- Names 2, `DeckProject` built in four places: `DeckProject` gains no field (item 1, matching by the bare key it already holds).
- Names 3, the peeks at the query key: item 2 makes the read, `prune` and `savedFrame` use the one key; a premise names `:273`, `:339`, `:419`.
- Names 4, the Overview's own query: item 2 has the Overview read the pane's filtered query and open no second one.
- Names 5, the two `readDeck`s: item 1 says the write route's reads pass no `keep` and read every member.
- Names 6, `kept` on candidates: item 1 gives a candidate `projectId` and `kept: true`.
- Names 7, `project` overloaded: the field is `projectId` (item 1, with the reason).
- Names 8 and 9: no collision; no change.
- Names 10, the channel's messages and the error word: item 4 names the kinds `keep-asked` and `keep` with the `keep` shape; item 1 answers a bad `keep` with the route's `{ error: 'invalid' }`; decisions 2 and 3.
- Names 11, the group ids: item 2 names `stage`, `status`, `tier`, `pillar`, `form`.
- Names 12: true as it stands; no change.
- Premises 1 and 2, the full id: item 1 matches by the bare key of the deck's hub, which `DeckProject.id` holds; the premise is corrected (`ofHub`, `read.ts:95`); item 2 restricts board items to `deck.hub`; decision 2.
- Premises 3, `Present.svelte` at 520: item 3 moves what the filter adds into a subfolder with room; the list names that component; a premise states the size.
- Premises 4, the print wait: item 4 sets the page's wait at 5 s inside the host's 60 s, with `data-failed` on no answer; a premise names `READY_WAIT_MS` and `print.ts:51`.
- Premises 5, `FilterBar`'s search and Mine: item 3 makes those props optional and draws neither in the Present bar; `FilterBar.svelte` is on the list; decision 7; a premise states the props.
- Premises 6, line references: `map-bar.ts:122-157` and `presets.ts:287-305`.
- Premises 7: no change needed.
- Premises 8, the worktree: the brief names `.agents/worktrees/migration-O147`.
- Cases 1, tests no entry covers: item 6 keeps only the narrowing, under G32 in `present.test.ts`, and C6 and C10 are quoted runs; the orchestrator names the test in G32's Test line at landing.
- Cases 2, C1's Status group: C1 expects no Status group on the hub and shows it in the scratch hub copy with a chip put back after the look; a premise gives the hub's chips and stages.
- Cases 3, C2's stage: C2 picks `submitted`.
- Cases 4, Move Earlier and Later: C7b.
- Cases 5, C8 and C9 at the look: C9 checks the desktop print window by reading `print.ts` against the 5 s wait.
- Cases 6, C12 and the peeks: item 2.
- Cases 7, the report shape: the look list holds C12 and C14.
- The question, item 4's export undefined on the browser-tab path: item 4 holds the export under a Web Lock from the press for at most 10 s on both paths, and the print page takes the first answer.
- The question, C4: C4 is a saved pick of a stage no member holds.
- The question, C6: C6 says no request with an empty `keep` goes out before the board items are read; item 2.
- The question, C8: C8 adds the audience window reloaded while the pane is not drawn; item 4 carries the keep in `PresentLink`.
- Implied inputs 1 and the m count: item 3 counts a project's deck once by `projectId` and any other by its path; C15.
- Implied inputs 2: no gap; no change.
- Implied inputs 3: item 2 lists a picked value no member holds at 0, as a board does; C4.
- Implied inputs 4, the reload: item 2 and C6; the kept list is computed from the hub's board items through the picks, so no two-step read.
- Implied inputs 5, presenting while not drawn: item 4, `PresentLink`; C8.
- Implied inputs 6, two exports of one deck: item 4 refuses a second export during the hold with a line; C9; decision 9.
- Implied inputs 7: covered; no change.
- Implied inputs 8, the picks carried to another deck: item 2, `leftDeck` drops `filters`; C14; decision 8.
- Implied inputs 9, two hubs: item 2 restricts to `deck.hub`.
- Implied inputs 10, duplicates, empty strings, unknown keys, a large list: item 1 (non-empty strings, at most 1024, duplicates and unknown keys harmless); C10.
- Implied inputs 11, nested groups: item 1 says the narrowing applies in a member deck's own groups; item 6's test holds nested groups.
- Dictated text, "1 of 1 decks": item 3 adds "Filtered: 1 of 1 deck" as its own key; "Filtered" against the boards' "shown" is the wording ruling 682 gives, kept.
- Specific checks 5, the folder rule for the group rules: item 2 takes them from `src/lib/state/boards/`, exported from `collection/bar.ts`, which is on the list.

Dictated lines added after the check, each held against `agents/spec.md` (ASCII, plain words): "Filtered: 1 of 1 deck" (`grep -n 'Filtered: 1 of 1 deck' agents/briefs/O147.md`), holds; "An export of this deck is already in progress" (`grep -n 'already in progress' agents/briefs/O147.md`), holds; the message kinds `keep-asked` and `keep` and the shape `{ kind: 'keep', keep: string[] | null, at: <the export's start, ms> }`, code, holds; `{ error: 'invalid' }`, the existing word, holds.
