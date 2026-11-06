# O161 brief check

Read on `/Users/axelfaes/workspace/oculus`, main at `ebe587ec0` (`git rev-parse --short HEAD`). The brief is `.scratch/migration/agents/briefs/O161.md` (122 lines). `grep -n "^## Goal" .scratch/migration/plan.md` prints nothing, so the plan has no Goal section. The step line `plan.md:1710`, its Step 0 at `:1711` and the rulings `- Open item 700` (`:3605`) and `- Open item 705` (`:3608`) were read. Some fixes below would widen the step: they add a requirement or a case beyond the step line. Under the standing demand "A brief check never widens a step" (`orchestrator-state.md`, standing demands), each of those goes to Axel as an open item. Each such finding says so.

## Names

`git grep -n "CardGrid" | grep -v "^.scratch"` hits only the 12 caller files and `CardGrid.svelte`. Each caller has its import, its open and close tags, and a head-comment mention (`Collection.svelte:14`, `Projects.svelte:85`, `Leads.svelte:20`, `Linkedin.svelte:22`, `Bucket.svelte:7`, `Radar.svelte:19`, `Data.svelte:16`, `Venues.svelte:21`, `Domains.svelte:15`, `Pillars.svelte:20`). All are in the write list, and each comment still reads true after the change ("drawn in the shared card grid"). `git grep -n -i "card grid\|cardgrid" -- docs tests README.md config ':!config/local.yml'` prints nothing, so no doc, test or diagram names the grid. The only test hit for a changed file is `tests/checks/tree/boundaries.test.ts:430-450`, a fixture string naming `Projects.svelte`, which the change leaves alone. The find-related grep (`git grep -n -i "until-found\|find-in-page\|browser's find\|beforematch\|stay mounted"`) hits places outside the write list, and each stays true:

- `docs/HELP.md:296`, where a find match unfolds a folded group.
- `src/lib/views/boards/focus/Band.svelte:22` and `lanes/Lanes.svelte:11-12`, which are Focus and not a CardGrid.
- `src/lib/shell/keys/workbench-keys.svelte.ts:385-389`, the doc comment of `cards()`. It stays true only if stand-ins carry no `data-card`; see C-15.
- `src/lib/ui/controls/heads/GroupHead.svelte:148`, the doc comment of `found`.

- C-1 (brief line 50, items 3 and 7): `Reveal.svelte` is also used outside any grid. `git grep -n "<Reveal" -- src` shows `src/lib/views/feeds/inbox/Inbox.svelte:180` and `src/lib/views/boards/collection/EntryList.svelte:115` (Collection's list mode). Neither file is in the write list. The brief puts `Reveal.svelte` in the write list but never says whether its code changes. A Reveal is not mounted on a stand-in, so item 3 can only be built in the grid. Item 7's rewrite of Reveal's head comment must stay true for Inbox and EntryList. Close: say Reveal's code is unchanged and only its comment changes, true for every user of it; or name both callers and add a case that their reveal works as today.
- C-2 (brief lines 13 and 51, item 7): the GroupHead paragraph runs from line 49 ("A folded group's body stays in the page, hidden until found") to line 57 ("`foldedWith`)."). Line 48 is a bare `//`. `cat -n` of the file shows this. The brief's `:48-56` drops line 57. Close: write `:49-57` in all three places.
- C-3 (brief line 10): CardGrid's head comment is lines 2-15, and the views are named at lines 11-15 (`cat -n CardGrid.svelte`). The brief says `:1-14`. Close: `:2-15`.

## The step line

The step line `plan.md:1710` maps to "What to build" as follows:

| Part of the step line | What serves it |
|---|---|
| The shared grid, through the listed views, draws what is on screen and just below and the rest as it is scrolled to | Items 1 and 5. The 12 files match the views listed. |
| Each row keeps its height and order, no jump, no reorder | Items 1 (layout rules) and 2 (stand-in height) |
| A revealed card is drawn before it is scrolled to | Item 3 |
| Search, group heads and counts cover every card | Item 5 |
| Hidden-until-found stand-in holding the search words; find finds it; the match draws the card and scrolls to it | Items 2 and 4 |
| Time measured before and after on a scratch server | Item 8 |
| Built by a builder agent | The brief as a whole |

Items 6 and 7 serve the rules file (spec.md:61 and :72), not a part of the step line. Every part has a requirement. Findings: none. Whether item 2 really holds "each row keeping its height" is under C-13 and C-14.

## Premises

These reproduce as the brief states them:

- The plan lines 1710, 3605 and 3608.
- `wc -l`: CardGrid 54, Reveal 58.
- The grid's CSS at `CardGrid.svelte:33-38`.
- `git grep -n "<CardGrid" -- src` gives 15 lines in 12 files, at exactly the brief's line numbers.
- `Bucket.svelte:67-79` has the quoted shape.
- Reveal's `scrollIntoView({ block: 'center' })` and its 900 ms timer (`Reveal.svelte:21-26`).
- `GroupHead.svelte:189-196` holds the body, with `hidden` at 192 and `onbeforematch` at 193.
- `FileRows.svelte:152-170` holds an `IntersectionObserver` with `{ root: box }` and `view.more()`.
- `docs/HELP.md:296` is the Groups bullet and `:485` the Transcript line.
- `guarded.md` line 3 holds the quoted sentence.
- `ls src/lib/views/shared/card/record | wc -l` prints 7.
- `package.json:69` is `"@tanstack/virtual-core": "^3.17.11"`.
- `grep -c "^  - title:" .oculus/data/literature/radar.yml` in the research hub prints 678.

Each caller filters before the grid, which I checked with `grep -n "search\|filter\|derived"` per file:

- Collection `shown` (`:217`)
- Projects `filter.shown`/`sections` (`:181,183`)
- Leads `live`/`expired` = `leadsSearch(...)` (`:108-109`)
- LinkedIn `ideas`/`posts` = `linkedinSearch(...)` (`:88-89`)
- Radar `searchedLive`/`searchedDismissed` (`:83-85`), passed to Bucket, which sorts the same list (`Bucket.svelte:53`)
- Data `shown` (`:58`)
- Venues `shown` to `sections` (`:74-75`)
- Domains `shown` (`:50`)
- Pillars `kind.lines`
- Career `group.cards` (`careerShown`, `:73`)
- ProjectCards `items` (`:30-35`)

Every group head counts the same list its grid draws: `Career.svelte:183`, `Leads.svelte` `count={expired.length}`, `Linkedin.svelte` `ideas.length`/`posts.length`, `Bucket.svelte:62`, `Radar.svelte:169`, Venues `section.venues.length`, Pillars `kind.lines.length`, Projects `section.items.length`. So no caller breaks the coverage of search and counts. These do not reproduce:

- C-4 (brief line 11, "Each draws `{#each <list> as <item> (<key>)}` inside the grid"; item 1's API; item 5): three grids hold cards outside the list (`grep -n "NoFundingCard\|OrphansCard\|ArchivalCard"`):
  - `Collection.svelte:388-390` holds only `<NoFundingCard {...noFunding} />` (:389) and has no `each`.
  - `Collection.svelte:400` has `<NoFundingCard>` after its `each`, at :440-442.
  - `Pillars.svelte:130` has `OrphansCard` (:152-158) and `ArchivalCard` (:160-167) after its `each`.

  Item 1's shape (a list, a key, the words and one card snippet) has no place for these cards. Close: say how a fixed card is given, either as an item of the list with its own key and stand-in words (the No funding card's words) or as a trailing snippet always drawn, and how the one-card grid at `Collection.svelte:388` takes the new shape.
- C-5 (brief line 11, "Each view filters its list before the `each` (its own search and filter bar)"): Career, Domains, Pillars and ProjectCards have no search. `grep -n "search"` over the four files prints nothing. The conclusion still holds, but item 4's second sentence (Decision 2) is the rule for those four. Close: name the four in the premise.
- C-6 (brief line 11 and items 1 and 3): the each key differs from the Reveal id in five grids:
  - `Bucket.svelte:67` (key `` `${asText(entry.title)}:${at}` ``, Reveal id `ident`, :69)
  - `Radar.svelte:174/176`
  - `Leads.svelte:198/200` and `:229/231` (key title plus index, Reveal id `identOf(entry)`)
  - `Collection.svelte:401/403` (key `` `${rootOf(entry)}:${entry.index}` ``, Reveal id `entry.id`)

  Item 1's props carry the key but not the reveal id or the wanted id. The callers gate the wanted id by the fold (`wanted={open ? reveal : ''}`). So the grid cannot know which stand-in to draw for item 3. Close: item 1 adds, for each card, its reveal id, plus the wanted id the view passes with its fold gating.
- C-7 (brief line 64): in the dispatch block, O158 is also in flight and writes `docs/HELP.md` lines 341-347 (`sed -n 26,80p orchestrator-state.md`, O160's `shared_paths:`). O162's brief (`briefs/O162.md:23`) names HELP lines 199-200. Line 296 touches none of them, but the brief names only O160. Close: name O158 and O162 beside O160.

## Cases and checks

Read against spec.md and guarded.md, every case is a look case read on the unchanged code, as spec.md:65 asks. None asks for a test, which matches guarded.md line 3. C12 checks the list branch of `Projects.svelte`, a file the step changes, so it is in scope. No case asks the builder to quote or explain a place the step does not change.

- C-8 (case C9): `Bucket.svelte:67`, `Radar.svelte:174`, `Leads.svelte:198` and `:229` key by title and index. A paper added at the top of a bucket gives every later card a new key. If the grid keeps "drawn" by key, every drawn card goes back to a stand-in. The cursor's card then leaves the page after it was drawn, and `reconcilePane` (`workbench-keys.svelte.ts:463-472`) clears the cursor. C9 as written passes on a view with stable keys. Close: item 1 says the grid keeps "drawn" by the card's stable identity (the reveal id, `identOf`), and C9 names Lit Watch with a paper added at the top of an open bucket, the cursor on a card below it.
- C-9 (case C2, Decision 3): C2 says "each card is drawn before it comes into view" with no speed. A scroll-bar drag or a fling passes one view's height before the observer answers. C2 also covers only scrolling down. After a find, a reveal or a scroll-bar jump, cards above the view are stand-ins, and scrolling up draws them at a height that differs from their stand-in's. Close: C2 says "at reading speed" and gives the expected result of a scroll-bar drag (cells of stand-in size, drawn within a frame). Add a case for scrolling up after a jump: nothing moves on screen.
- C-10 (case C3 and item 4): C3 finds only a title word. Lit Watch's search reads `title, authors, venue, year, project, motif, why, threatens` (`src/lib/state/feeds/radar.ts:103`). Its face also draws `idea_spark` (`RadarCard.svelte:126`), the relevance tag (`:271-272`) and the project titles, none of which the search reads. A word only on a face (a project's title, "high", the idea spark) will not be found in a card not yet drawn. Today it is found on every card. So the goal "the browser's find still reaches every card" fails for those words. A word the search reads but the face does not draw (the `project` key) matches a stand-in, but the drawn card does not hold the word. Close: add cases for both kinds. Change item 4 to give the search's words plus the text the face draws. That is a superset, so it still holds the words ruling 705 names. This widens the step past its line, so it goes to Axel as an open item.
- C-11 (cases C3 and C4, item 2 "so the match lands in the drawn card"): no case covers the desktop app's find bar. `src/routes/find/+page.svelte:1-11` shows that the app runs find through the bridge and shows `{0} of {1}`. No case covers the next Enter in the find bar after a stand-in has been replaced by its card. The browser's active match lies in the stand-in's text, which the draw removes. Item 2 asserts a behaviour the browser does not give by itself, and the builder can check it only by reading. Close: C3 and C4 each name the browser tab and the app's find bar, and give the expected result the look checks: the card drawn and in view, and the next Enter going on to the next match, not starting over from the top.

## The question

The goal: the card grids draw only what is near the view; the browser's find, a view's own search, group counts and reveals still reach every card; nothing jumps or reorders; Lit Watch and the Projects board show their cards faster.

For each case:

- C1: can pass without the goal. It checks what is drawn, not time, so it rests on item 8 (C-12).
- C2: can pass (C-9).
- C3: can pass (C-10, C-11).
- C4: cannot pass without the goal, because the group's `beforematch` is reached by bubbling and `found` acts only on a folded group (`GroupHead.svelte:149-151`).
- C5: can pass in Data and Domains, where the key equals the reveal id, while failing in Bucket, Leads and Collection (C-6).
- C6, C7, C10 and C12: cannot pass without their part of the goal.
- C8: cannot.
- C9: can pass (C-8).
- C11: can pass for a card drawn by scrolling while a restored cursor on a card not yet drawn fails (C-15).

For each item: item 1 can pass with fixed cards left out (C-4); item 3 (C-6); item 4 (C-10); items 5 and 6 cannot pass without their part.

- C-12 (item 8 and the step line's timing): item 8 and the step line ask for before and after times but state no expected result, so the step passes with an "after" that is not lower. The mark of "cards shown" is left to the builder. Close: state that the after time is below the before time for both views, with what a smaller gap leads to (a repair round). Have the orchestrator fix the mark (for example, from the tab's open to the first view of cards painted, in a Chrome performance trace) before the build.
- C-13 (item 2, "the last drawn card's height"): a pane in a background tab is hidden (`TabView.svelte:18`, `hidden`), so a card measured there, or before layout, measures 0. Every stand-in then has no height, all of them intersect when the tab is shown, and all 678 cards are drawn at once. The look, taken in a visible tab, would not see it. A "more" card opened out (`Projects.svelte:220`, `ProjectCards.svelte:50-55`), if it is the last drawn, makes every stand-in tall. Close: item 2 says a measurement of 0 is ignored and which drawn card's height is used, and a fixed first guess follows the text scale as `VirtualRows.svelte:12-14` does. Add a case: Lit Watch restored in a background tab, then shown.
- C-14 (item 2 against item 3): a reveal draws the cards above its card in the grid, so the place holds. A find draws only the matched card. Its neighbours in view are then drawn at once from stand-ins and change their rows' heights, so the match can move after the browser has scrolled to it. C3 passes on cards of equal height. Close: item 2 draws the cards above the found card in its grid, as item 3 does, and C3 checks that the found card stays in view.

## Implied inputs

- C-15 (not stated: a card cursor on a card not yet drawn): the cursor is kept in the tab's state (`cardCursor`, `workbench-keys.svelte.ts:430-433`) and comes back with a restored layout. Enter on it queries `[data-card=...]` (`src/lib/shell/keys/key-dom.ts:64`), which a stand-in does not match, so Enter does nothing. The cursor's row model reads `[data-card]` filtered by `checkVisibility` (`workbench-keys.svelte.ts:390-396`). The brief does not say whether a stand-in carries `data-card`. Expected: the card under a held cursor is drawn, as `VirtualRows.svelte:22-25` keeps `nav.kept` rows drawn, and a stand-in carries no `data-card`, so the cursor steps only onto drawn cards. Close: state both in items 1 and 2, with a case: a tab reloaded with the cursor on a card far down, then Enter.
- C-16 (not stated: the list arriving after the grid mounts): Lit Watch, Leads and LinkedIn get their lists over the socket (`Radar.svelte:74` `feed('radar')`), so the grid first renders empty or partial. Item 1's "at first" must also apply when the list grows from empty. Expected: the first view's worth of cards drawn when the list arrives. Close: say so in item 1, and in C1 open Lit Watch on a cold load.
- Not missing:
  - A drag on a board: no caller's card drags. `git grep -n "draggable" -- src/lib/views` hits only Present, Focus lanes, the terminal list and the explorer.
  - A grid in a nested folded group: `beforematch` bubbles, and `found` acts only on a folded group (`GroupHead.svelte:149-151`).
  - The Projects card's own snippet: `Projects.svelte:276-281` already renders one `card(item)` per item.
  - A card growing after it is drawn: it is a drawn card and is not replaced; its effect on the guess is under C-13.
  - Print and Select All: no card view handles Cmd+A, and a stand-in's text is data. Low cost, and the brief need not state them.

## Libraries

`package.json:69` gives `^3.17.11`, and `node_modules/@tanstack/virtual-core/package.json` gives version 3.17.11 with license MIT, so the brief's facts hold.

- C-17 (brief line 77): the reason "it places rows by computed offsets in an absolute-positioned list" does not hold. The library is headless. The tree's own use of it draws flow spacers before and after the drawn rows (`VirtualRows.svelte:4-7`), and the library has a `lanes` option for several columns (`dist/esm/index.d.ts:79`). These reasons do hold:
  - Ruling 705 keeps one element per card for the browser's find.
  - Decision 1 keeps a drawn card drawn, so the drawn set is scattered (cards found or revealed far down), which a virtualizer's one contiguous range does not model.
  - `lanes` needs a fixed lane count, where the grid's columns come from CSS `auto-fill`.

  Close: replace the first reason with these. The conclusion, no library and no dependency, holds.

## ADRs

`test -d docs/adr || echo "no docs/adr"` prints `no docs/adr`. Findings: none.

## Dictated text

The brief dictates no text in quotes. `grep -n '"'` hits only command text, the quoted guarded line (line 15, which reproduces) and the report's first line (line 113, which follows spec.md:84). Item 7 dictates two pieces of content, found by `grep -n "one sentence\|say what each does now"`, line 26:

- GroupHead: "a folded group's cards not yet drawn are found through their stand-ins". Holds.
- C-18 (HELP.md:296): "the cards of a long list are drawn as they are scrolled to, and the browser's find still finds every card, drawing it." "Still" is on spec.md:44's list only for comments and test titles; here it contrasts with the first clause, so it holds. "Every card" is false for words only on a card's face, unless C-10 is ruled for the superset. "The browser's find" leaves out the app's find bar (C-11). Close: rewrite the sentence after C-10's ruling and name the app's find bar as well.

`LC_ALL=C grep -n '[^ -~]'` over the brief prints nothing.

## Declined to judge

- Whether Chromium's and Electron's find keep or restart the active match after a stand-in's node is replaced (C-11), whether `checkVisibility()` returns true for an element that is itself `hidden="until-found"` (C-15), and whether the browser's scroll anchoring in the pane body (`Pane.svelte:89`, `data-scroll`; `git grep -n "overflow-anchor"` shows it is not turned off there) holds the place when rows above change height (C-9, C-14). Each needs a page run, which this check does not make. The brief should state the expected result so the look decides.
- How large the time gain will be (item 8). It is not measurable without a server.

Usage: ac24ce86435cfa7fd, claude-opus-5-5, 184834 tokens, 49 tool uses, 10.4 min

## Closed

- C-1: item 3 says `Reveal.svelte`'s code is unchanged and its head comment stays true for `Inbox.svelte:180` and `EntryList.svelte:115`; the path list says "its head comment only".
- C-2: `GroupHead.svelte:49-57` in the premise, item 7 and the paths.
- C-3: CardGrid's head comment `:2-15`.
- C-4: item 1 adds a trailing snippet always drawn; `Collection.svelte:388` passes an empty list with its No funding card; Decision 5; case C14.
- C-5: the premise names Career, Domains, Pillars and ProjectCards as views with no search.
- C-6: item 1 carries each card's stable identity and the wanted id with its fold gating; item 3 matches on it; C5 names the grids whose key is not the reveal id.
- C-7: the HELP.md path line names O158, O160 and O162.
- C-8: item 1 keeps a drawn card by its stable identity; C9 adds Lit Watch with a paper added above the cursor.
- C-9: C2 at reading speed with the scroll-bar drag; C2b for scrolling up after a jump.
- C-10: item 4 and Decision 6 give the stand-in exactly the text the card's face draws, as Axel ruled (ruling 712 (a)), so Cmd+F finds what it finds today; cases C3b (a word only on the face: found) and C3c (a word only the search reads: no match, as today) added.
- C-11: item 2 and C3, C4 name the app's find bar and the next Enter.
- C-12: item 8 fixes the mark and requires the after time below the before time.
- C-13: item 2 ignores a measurement of 0 and gives a first guess in `rem`; C13 for a background tab.
- C-14: item 2 draws the cards above a found card; C3 checks it stays in view.
- C-15: item 1 draws the card under a held cursor, item 2 gives a stand-in no `data-card`; C11 and C11b.
- C-16: item 1 draws on a list that grows; C1 adds a cold load.
- C-17: the library reasons replaced.
- C-18: under the ruling "Help redesigned" the step adds no Help sentence; item 7 has the report name any Help sentence the change makes false.
