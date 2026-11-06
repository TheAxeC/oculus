# O161 report: cards drawn as they are seen (handed back before any change)

NOT done: nothing of "What to build" is built. The step is handed back after the cases' first run and before any code change, because the brief's mechanism (item 2: a found stand-in fires `beforematch` and the grid replaces it with the drawn card) cannot give the Cmd+F behaviour that ruling 712 (a), item 2's last sentence, C3 and C3d require. The evidence is Chromium's own find-in-page source, quoted below; the case that shows it is C3d, with C3 and C4 for Shift+Enter.

## Open items of the state file, verbatim

From `.scratch/migration/orchestrator-state.md:216-220`:

> ## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)
>
> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
>
> None.

## The rule that is wrong, and the result that shows it

The rule (brief item 2): "A find that matches a stand-in (the browser's, or the desktop app's find bar) fires `beforematch`; the grid then draws that card and the cards above it in its grid at once ... so the match lands in the drawn card ... Enter and Shift+Enter step through them as today, and each match is shown highlighted in the drawn card". C3d asks for the same count, order and steps as the unchanged tree, each match highlighted in a drawn card.

The desktop app's find bar runs the same engine as the browser tab: `src/desktop/windows/find-bar.ts:107-111` calls `win.webContents.findInPage(query, { forward, matchCase, findNext })` (Electron 44.5.1, `package.json:46`), which is Blink's `FindInPage::Find`. So both find bars behave as below.

Source read: Chromium main, fetched with `curl -sSfL -o chromium/text_finder.cc https://raw.githubusercontent.com/chromium/chromium/main/third_party/blink/renderer/core/editing/finder/text_finder.cc` and the same for `third_party/blink/renderer/core/frame/find_in_page.cc` into the session scratchpad (`shasum`: `887bf9f0bc8581afe73e476a064fc2647610cb37 text_finder.cc`, `64876c83594718e901f19379f3b166fae6acfdc8 find_in_page.cc`). The behaviour below is read from that source and from the DOM standard's live-range rules; it was not seen in a browser, since a builder runs no page (rules file line 65). Electron 44's Chromium is older than main; the passages quoted have the same shape since `beforematch` shipped, but that is not verified for Electron 44 itself.

What the source does when a find lands in a hidden-until-found stand-in:

1. `TextFinder::FindInternal` finds the match in the stand-in's text, marks it active (`text_finder.cc:395`, `SetMarkerActive`) and queues `TextFinder::Scroll` for the next animation frame (`:388`, `EnqueueAnimationFrameTask`).
2. `Scroll` fires `beforematch` and removes `hidden` (`:1088` calls `AutoExpandSearchableHiddenElementsUpFrameTree`, which calls `RevealAutoExpandableAncestors(first_node)` at `:102`).
3. If the handler removed the matched text, `Scroll` takes the now collapsed range as the active match and searches again from it in the find's direction: `:1100-1112`, "If the range we were going to scroll to was removed, then we should continue to search for the next match ... active_match_ = context->range; FindInternal(...)".

What the brief's grid does to that: replacing the stand-in by the card removes the matched text node, so by the DOM standard's rule for a removed node the range collapses to one point in the cell's parent, either just before the drawn card or just after it (which one depends on whether the new card is inserted before the stand-in is removed). Chromium then searches again from that one point:

- If the point is before the card, Enter (forward) finds the card's first match, which is the match Enter found in the stand-in: correct. Shift+Enter (backward) searches up from before the card and lands on the match above it, so every match of that card is skipped.
- If the point is after the card, Shift+Enter finds the card's last match: correct. Enter searches down from after the card and skips every match of it; the next stand-in it meets does the same, so Enter runs on past every not-yet-drawn card to the next drawn one.

No order of the swap serves both directions, and `beforematch` carries no direction or query (the event is a plain bubbling `Event`). Shift+Enter lands on a stand-in on Lit Watch whenever it steps up from one bucket into the bottom of the bucket above (each bucket is its own grid, `Bucket.svelte:66`, and item 2 draws only "the cards above it in its grid"), and always when Shift+Enter on the first match wraps to the last match of the page, which on a long list is a stand-in. Under today's tree, where every card is drawn, both step through every match.

The highlights: Chromium paints a find highlight only on text that carries a text-match marker. Markers are added by the scoping pass (`text_finder.cc:717-760`, `DidFindMatch`) and, for the active match only, by `Scroll` (`:1118-1130`). Text drawn after the scoping pass carries none. So the cards the brief draws at once above a found card, and every card drawn by scrolling while the find bar is open, show their matches without the yellow highlight and without scroll-bar tick marks, until Chromium scopes again, which it does on a find-next only when the next match it lands on carries no marker (`find_in_page.cc:126-144`, case (3)). Under today's tree every match on the page is highlighted from the first find.

Result: under item 2's mechanism, Shift+Enter skips cards and matches lose their highlight, both of which C3d and ruling 712 (a) rule out. The rule is not one a builder can satisfy by care in the code; it needs a ruling.

### Options (judgments, for the orchestrator to book; each reversible)

- (a) Keep every card drawn, as today, and let the browser skip the rendering of the cards out of view: each cell of `CardGrid.svelte` gets `content-visibility: auto` with `contain-intrinsic-size: auto <first guess in rem>`. Pros: Cmd+F is unchanged, since the same text nodes stay in the page (Chromium searches and activates `content-visibility: auto` content, `ActivateFindInPageMatchRangeIfNeeded`, `text_finder.cc:93`), so count, order, Enter, Shift+Enter and every highlight are those of today; a reveal, the card cursor (`checkVisibility()` with no options does not count `content-visibility: auto` as hidden) and a held cursor need no change; the callers keep their shape and need no stand-in words, so the text-fidelity work of item 4 disappears; the `auto` keyword keeps a drawn cell's last height, so rows do not jump. Cons: Svelte still creates every card's DOM, so only the style, layout and paint of the cards out of view are saved; whether item 8's after time comes below its before time is a measurement nobody has taken (judgment: likely, since layout and paint of 678 cards are a large part of the first frame, but not settled until the trace is taken). It reads ruling 700's "draws" as the browser's rendering, which is Axel's to accept.
- (b) The brief as written, with ruling 712 (a) relaxed to accept that Shift+Enter skips a card it lands on as a stand-in and that matches in cards drawn after the find began are unhighlighted until the next re-scope. Pros: the full saving of mounting only the cards in view. Cons: Cmd+F changes, which Axel ruled out in the strongest form ("exactly as it works today, with no change in behaviour").
- (c) The brief's stand-ins, with the swap order chosen by where the stand-in lies against the viewport (below: forward; above: backward). Pros: ordinary stepping in both directions works. Cons: the wrap cases (Shift+Enter from the first match, Enter from the last) still skip cards, and the missing highlights remain; still a change to Cmd+F.

Recommendation (judgment): (a), the only option that keeps Cmd+F exactly as today, with item 8's timing deciding at landing whether it is enough. The lazy option is (b): it is the cheapest way to carry on with the brief as written and leaves the ruled Cmd+F behaviour broken.

Two further facts for any rewrite that keeps stand-ins (they do not apply under (a)): the Lit Watch card's face draws its note and threat through `{@html inlineMarkdown(note, cardMath(note))}` (`RadarCard.svelte:292`, `:298`), whose math is drawn only after the math module loads (`views/shared/latex/card-math.svelte.ts:17-25`), so "exactly the text the face draws" changes when that load ends; and a glyph in the text glyph mode draws a character as text (`ui/display/Glyph.svelte:20-29`), which find matches.

## The cases' first run, on the unchanged tree

Read in the code at the worktree's base (no change made). The grid draws every child it is given: `CardGrid.svelte:28-30` renders `children()` inside `<div class="cards">`, and every caller's `{#each}` sits inside it, so on the unchanged tree every card of every list is drawn.

- C1: every card is drawn: `Bucket.svelte:66-80` draws one `Reveal` and `RadarCard` per entry of `ordered` (`sortBucket(entries)`, `:53`); a list arriving over the socket (`Radar.svelte:74`, `feed('radar')`) draws every card it brings. Holds as the brief says.
- C2: no stand-ins exist; every cell is a drawn card, so scrolling at any speed or a scroll-bar drag shows drawn cards and nothing is drawn on the way. Holds.
- C2b: as C2; nothing above is drawn late, so nothing moves on scrolling up. Holds.
- C3: every card is drawn, so a word of a card's title is in the page and find finds it in place; Enter steps on through Chromium's find-next from the active match (`text_finder.cc:276-325`, the search from `active_match_` at `:321`). Holds.
- C3b: the Lit Watch face draws `note = word('why') || word('idea_spark')` (`RadarCard.svelte:126`, drawn at `:290-293`), so an idea spark is on the face when `why` is empty; `radarSearch` reads `title, authors, venue, year, project, motif, why, threatens` (`state/feeds/radar.ts:103`), not `idea_spark`. A project title is drawn only inside an opened project group of the foot strip (`views/shared/links/CrossLinks.svelte:94-117`, the `ToolButton` label at `:105`, behind `isOpen(groupKey(group))` at `:94`); a folded group draws its label and count (`:81-87`, the `Disclosure`). Find on the unchanged tree finds both where drawn. Holds.
- C3c: the face draws the project's title (`member.label`) and never its key; the key is read by `radarSearch` (`radar.ts:103`, field `project`) and by `crossLinksOf` (`radar.ts:126-127`) and is not a text node of the card. Find gives no match for it. Holds.
- C3d: every match is a drawn text node, in DOM order, all marked by the scoping pass (`text_finder.cc:717-760`), so the count, the order and the steps are Chromium's ordinary ones over the whole page. The count itself is a figure of the real page, not measured here (no page is run by a builder); the look at landing takes it. This is the case the hand-back rests on, above.
- C4: a folded group's body is `hidden="until-found"` with `onbeforematch={found}` (`GroupHead.svelte:189-194`); `found` presses the fold only when folded (`:149-151`); its cards stay mounted, so find reaches them and the group unfolds. Holds.
- C5: every card is drawn, so `Reveal`'s effect (`Reveal.svelte:19-28`) finds its node and scrolls it to the middle, flashing it for 900 ms. The five grids whose key is not the Reveal id are as the brief says: `Bucket.svelte:67/69`, `Radar.svelte:174/176`, `Collection.svelte:401/403` (key `` `${rootOf(entry)}:${entry.index}` ``, id `entry.id`) were read; Leads at `:198/200` and `:229/231` is as the brief cites it, not verified by this builder. In Collection the card cursor's id is a third value, `identityValue(entry)` (`Collection.svelte:409`, `state/boards/collection/index.ts:664-668`), which is `entry.id` or `''`. Holds.
- C6: each view filters before its `each`: Lit Watch draws `filledBuckets(searchedLive, buckets)` and `searchedDismissed` (`Radar.svelte:83-85`), and a bucket's count is `entries.length` of that filtered list (`Bucket.svelte:62`). Holds.
- C7: every card is drawn at once (`CardGrid.svelte:28-30`). Holds.
- C8: a resize or a text-size change reflows the grid's `auto-fill` columns (`CardGrid.svelte:33-38`); every card stays drawn. Holds.
- C9: the `each` is keyed (`Bucket.svelte:67`, title and index), so Svelte keeps each card by its key; a paper added above shifts the index part of the keys below it, so those cards are created again under their new keys. The cursor is held by the card's id in the tab's state (`workbench-keys.svelte.ts:430-433`) and is cleared only when the held card leaves the page (`:463-472`), so it stays on its card. Holds as far as reading shows; the recreation of shifted cards is today's behaviour.
- C10: every card is in the page, so the scroll bar spans the whole list from the first draw. Holds.
- C11: the cursor's rows are the `[data-card]` elements that pass `checkVisibility()` (`workbench-keys.svelte.ts:385-391`); `data-card` is set by `ui/frame/Card.svelte:97`. Every card is drawn, so every card is a row. Holds.
- C11b: the cursor comes back with the restored layout (`cardCursor(instance.state)`, `Radar.svelte:76`); Enter queries `[data-card=...]` (`cardSelector`, `key-dom.ts:49-51`, used by `activateCursor` at `:62-75`), and the card is in the page. Holds.
- C12: `Projects.svelte:271-273` draws `BoardList` in list mode and `CardGrid` only in card mode (`:276`). Holds.
- C13: a pane in a background tab is `hidden` (`src/lib/shell/panes/TabView.svelte:48`, `hidden={!shown}`; the brief's `:18` is a head-comment line) but its view is mounted, so all 678 cards are created there. Holds as the brief says.
- C14: `Collection.svelte:388-390` holds only `<NoFundingCard {...noFunding} />`; `:440-442` draws it after the `each`; `Pillars.svelte:152-167` draws `OrphansCard` and `ArchivalCard` after the `each`. Holds.

## DONE / NOT DONE

| Item | State | Proof |
| --- | --- | --- |
| Cases' first run on the unchanged tree | DONE | the readings above, each with its `file:line` |
| The brief's rule checked against the browser's find | DONE, rule found wrong | `text_finder.cc:388`, `:395`, `:1088`, `:1100-1112`, `:717-760`, `:1118-1130`; `find_in_page.cc:126-144` |
| 1. The grid draws what is seen | NOT DONE | handed back before any change |
| 2. Stand-ins | NOT DONE | handed back; this item's mechanism is the one found wrong |
| 3. A revealed card drawn first | NOT DONE | handed back |
| 4. The words of a stand-in | NOT DONE | handed back |
| 5. Every caller moves | NOT DONE | handed back; `git grep -n "<CardGrid" -- src` still prints the 15 lines of the brief |
| 6. Nothing else changes | not applicable | no change made |
| 7. The head comments | NOT DONE | handed back |
| 8. Timing, what to open | NOT DONE | depends on the option ruled |
| Verify 1, `npm run test:quick` | not run | no change to check; the full list was run 0 times |
| Verify 2 to 7 | not run | no change to check |

## Files changed

`diff -rq --exclude=local.yml .agents/worktrees/O161-base/<d> .agents/worktrees/migration-O161/<d>` for `src`, `tests`, `config` and `utils` (the folders the base copy holds) prints nothing. `git status --short` prints ` M .scratch/migration/agents/briefs/O161.md`, the orchestrator's brief update, not this builder's. This report is the one file written.

## Per caller, the stand-in's words

Not built: they exist only under the brief's mechanism, which is handed back.

## User-visible changes, before and after

None: no code changed. Item 8's timing is for the orchestrator once an option is ruled.

## Head comments

`CardGrid.svelte:2-15`, `Reveal.svelte:2-4` and `GroupHead.svelte:49-57`: still true, unchanged. `docs/HELP.md`, `docs/data-map.md` and `docs/decks.md`: unchanged, and no sentence of theirs is made false, since nothing changed.

## Judgment calls the brief left open

None taken; the options above are for the orchestrator.

## Anything in the brief that was wrong or impossible

Item 2's mechanism against ruling 712 (a), item 2's last sentence, C3 and C3d, as shown in the second section. The rest of the brief's premises read as stated: 15 grids in 12 files (`git grep -n "<CardGrid" -- src`), the five grids whose key is not the Reveal id, the cards outside the list, and the find bar's route. One citation is off: the brief's `TabView.svelte:18` for a hidden pane is a head-comment line; the attribute is at `src/lib/shell/panes/TabView.svelte:48` (`grep -n "hidden=" src/lib/shell/panes/TabView.svelte`).

## Tests

No test added or changed. The full list was run 0 times; no test file was run.

Usage: a336874264e7be26f, claude-opus-5-5, 198509 tokens, 52 tool uses, 11.4 min
