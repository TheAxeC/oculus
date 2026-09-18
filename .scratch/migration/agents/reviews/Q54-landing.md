# Landing report: Q54, `ui/Tabs.svelte` split by concern

## Open items, verbatim from orchestrator-state.md

## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)
- A write that never answers (raised 2026-09-18 02:03 by Q48's second round): `state/writes.svelte.ts`'s `send` has no timeout and no abort, so a request that never comes back leaves that form's Save control disabled until Cancel or a reload. Closing it means choosing how long a write may take before the page gives up, which is a user-visible duration nothing in `config/` names, so it is Axel's to rule. Recommended: a write gives up after 30 seconds and says so in the form's own refusal line, the duration living beside the other timeouts in `config/behavior.yml` so it can be changed without a build. The lazy option here would be leaving it stated as a limitation, which is what the round did. Closed 2026-09-18 08:15, Axel: agreed, the non-lazy option. A write gives up after 30 seconds and says so in the form's own refusal line, the duration in `config/behavior.yml`; booked into Q59.

- The project tab and the card disagree about a document the project has not got (raised 2026-09-18 05:15 by R14's repair round, first seen 2026-09-17 by Q34's review and never booked): `src/lib/views/shared/CardDocs.svelte:79` draws a known document a project does not hold as a plain `Tag`, so a card reads `TEX` in muted text for a project with no `manuscript/main.tex`, while the project tab draws nothing for it, and `tests/views/project.test.ts:219` pins that difference as the expected result with `expect(body).not.toContain('>TEX</span>')`. Which of the two is right is a user-visible shape nobody has ruled, so the test asserts a decision rather than a rule. Recommended: the tab draws the absent tags the card draws, one rule for one fact, since the tab is the fuller view of a project and a reader who opens it should not learn less than the card told them; the test then asserts the ruled behaviour. The lazy option is leaving the assertion as it is and calling the difference intended, which is what the tree does now. Closed 2026-09-18 08:15, Axel: agreed, the non-lazy option. The project tab draws the absent tags the card draws, and the test then asserts the ruled rule; booked into Q59.

- A tap reaches no ticker button on a device that also has a pointer (raised 2026-09-18 06:00 at Q49's landing): before Q49 the waiting buttons were in the page at `opacity: 0` and hit-testable, so a tap on a hybrid raised hover and pressed the button under the finger, which is the defect Q49's ruling 4 closed; now they are out of the page and `over()` in `src/lib/ui/Ticker.svelte:110` admits only a mouse or a stylus, so a hybrid's touchscreen reaches no ticker button at all. Axel's machine has no touchscreen, so nothing he presses is affected. Recommended: leave it as it stands, since the alternative is a first tap that opens the row and a second that presses, a reader-visible interaction shape nothing in oculus names and nothing else in the tree uses. The lazy option is calling it a limit of the design without saying that the touchscreen worked before. Closed 2026-09-18 08:15, Axel: agreed, the non-lazy option. A first tap opens the row and a second presses, which is the option I named and wrongly did not recommend; booked into Q53.

- The Repositories view drops a root whose folder has gone (raised 2026-09-18 07:16 by Q52's review): `src/lib/state/repositories.ts:97` offers the picker only the roots whose git state says `repository === true`, so a root the reader deletes leaves the picker silently and, with no other repository, the view reads "No repository is on the channel yet." Q52 gives the view a true sentence for a folder that is not there and for a folder that is no repository, and neither can be reached while the picker filters that way. Closing it means the picker offers every root the git channel has state for, which changes what the view lists and what `DESIGN.md:319` and `:334` say about it, so it is Axel's. Recommended: the picker offers every root the channel knows and each row says what its state is, which is what the six shapes are for, since a reader who deletes a folder should be told rather than have the row disappear. The lazy option is leaving the two drawings unreachable and calling the step done, which is what the tree does now. Closed 2026-09-18 08:15, Axel: agreed, the non-lazy option. The picker offers every root the git channel knows and each row says what its state is; Q52 gets a second round for it under the cap's one exception, since its own acceptance item is unreachable and too large for a landing fix.

- The repository picker's badge carries no colour, and the reason given for that is false (raised 2026-09-18 11:33 by the third review of Q52): `src/lib/views/Repositories.svelte` passes no `badgeTone`, so all three words ("gone", "no repository", "unreadable") are drawn in one neutral pair, `--accent-txt` on `--chip`, measured in the running page at 4.65:1 and held across themes by `tests/contrast.test.ts:31`. Q52's report gave as the reason that the `--on-c-*` family resolves to nothing in the built CSS; that is wrong, `ui/theme.ts` sets the family on the document and `--on-c-red` reads back `#ffffff` in the page, so a tone could have been passed and the decision was never really taken. Which colours three repository states get, if any, is a look vocabulary nothing in oculus names, so it is Axel's to rule. Recommended: give the three their own tones, since a reader scanning a list of roots reads the colour before the word and the three facts are not the same fact; the lazy option is leaving all three neutral on the ground that the contrast passes, which answers whether the words are legible and not whether they tell the reader apart. Booked into Q53 if ruled yes, since that step already has the shell's drawing in its hands.

Waiting on a ruling as of this landing, 2026-09-18 12:19: the picker badge's tone, the item directly above.

The four of 2026-09-18 08:15: nothing is waiting on those as of 2026-09-18 08:15 on a ruling as of 2026-09-18 08:15: Axel ruled on all four at 08:15, each the non-lazy option, and each is booked in the step named beside it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.
## Booked, no ruling needed (what a review, a look or the closure audit found; each is a step in plan.md and is worked in queue order)
- The audits scan's three holes (raised 2026-09-18 06:53 by the third review of R14, booked 08:04 at its landing into Q59's line): `reaches` in `tests/audits.test.ts` matches `render(` inside a string, `renderNames` takes any declared name whose block reaches a render and those names are ordinary words, and `block` counts brackets inside comments, so the scan passes a case that draws nothing and reports one that draws. Every fix tried at R14's landing reclassified 129 cases, which would mean regenerating the check's 150-entry floor to fit the new rule; Q59 changes the rule and regenerates the floor from the tree in one move. A fix of delivered work, no ruling needed.
- Q64, the bookmarks file watched like the rest of the hub (raised 2026-09-17 23:55 by Q48's review): a bookmark changed outside oculus reaches no open page until a write from the page moves the round, so the Files view's gone-bookmark close waits with it. A fix of delivered work, no ruling needed; folded into Q56 on 2026-09-18 00:31, since one step carries the Files view keeping up with its own reads.

- The steps a review booked rather than a brief (each is a fix of delivered work, worked in queue order; the list was fifteen steps until 2026-09-18 00:30, when Axel ruled that a step is for new or nasty work and the rest is closed where it is found, so they were collapsed into four): Q50 a web address in a path field is not a hub path; Q51 `state/layout.svelte.ts` split; Q52 the two git views tell one story; Q53 the shell's drawing defects; Q54 `ui/Tabs.svelte` split; Q56 the Files view keeps up with its own reads; Q58 the files over the size line; Q59 every outstanding finding of the recurring pass and the closure audit.
- The Files view keeps a failed read on screen after the cause is gone (seen 2026-09-17 22:25 on the TEST page while looking at Q43): the bookmarks section read "The bookmarks could not be read: Failed to fetch" while `GET /api/fs?bookmarks=1` answered 200, and only a reload cleared it; nothing retries the read and no control offers to. The same shape as the `no-roots` line D22 fixed at its landing. A fix of delivered work, no ruling needed: booked as Q56, after Q48.
- A Focus ticker row's name cut mid-word (seen 2026-09-17 22:22 on the TEST page while looking at Q41): on the Funding and Teaching rows of Axel's own board a row's name is cut with no ellipsis ("FWO Senior Postdo", "Bioinformatics (3740) - Coordin"), which is the hidden buttons holding their width. Already booked as Q49; recorded here as seen in the page. Built 2026-09-18 00:52 by Q49, under review.

## NOT DONE

Nothing of Q54's brief is unbuilt. Two things came out of its review that are not defects of this step and are not closed here:

- `tests/views/type-scale.test.ts`'s `PASS_THROUGH` list has no completeness guard for `src/lib/ui`, so a future component with a `font-size` and no entry goes unchecked. `tests/views/type-scale.test.ts:225-232` has such a guard for `src/lib/views` alone. Pre-existing; booked into Q59.
- `node bin/revert-check.mjs tests/ui/primitives.test.ts` on main prints `GREEN ... draws a row action as a button only when the caller says what one means (revert src/lib/ui/Ticker.svelte:231)`. That directive proves nothing. It is outside Q54's diff; `src/lib/ui/Ticker.svelte` is in Q53's path list, and it was sent to Q53's builder to close inside its round.

## What landed

Cherry-picked from `8d8426df` onto main with no conflict: 9 files, 44 insertions, 265 deletions.

- `src/lib/ui/Tabs.svelte` 596 to 362. It keeps the strip, its scrolling, its focus order, its drag, its opener and menu, and every style of `.strip`.
- `src/lib/ui/TabFace.svelte` (new, 306) owns one tab: the `.tab` wrapper, the face button with its glyph, label, badge and split cells, the close control with its dot and cross, and every style for those. The caller binds the wrapper and the face button through `$bindable`, so the strip measures and focuses the same elements.
- `bin/size-allow.txt` loses its `src/lib/ui/Tabs.svelte 596` entry; neither 362 nor 306 needs one.

## What the review reproduced

Every verification line, the line-count table row by row, and the eight revert directives. Beyond that it did three things the report could not do for itself: it sorted the base's CSS declarations against the union of the pair and found 30 rules answering 30, differing only in one selector's text and one added comment; it rendered the base component and the split pair through `svelte/server` with a props set exercising every branch and found the markup byte-identical apart from Svelte's anchor comment, so every `data-`, `role`, `aria-`, class and inline style the browser suite selects on sits on the same element; and it instrumented both `$effect`s plus the queued `reveal` microtask in a copy, built it, and drove a seven-tab reload in Playwright, finding every face bound at every run.

It also tested the report's one design claim by making the move: exporting `badgeStyle` and `cellStyle` from `ui/tab-strip.ts` reddens `tests/ui/colours.test.ts` with four entries, because `assignments()` at `tests/ui/colours.test.ts:296` reads only the source of the component whose CSS names the token. The claim holds as written.

One number in the build report does not reproduce: the table quotes `180673 total` for `find src tests bin -type f | xargs wc -l`; the tree gives `180685`. The 12-line gap is the revert-directive comments the builder added after running that command. A stale quote, not a defect in the diff.

## Fix at landing, mine

`DESIGN.md:339` said `ui/Tabs.svelte` draws the tab, its top line, its unsaved dot and its close control. It now names `ui/TabFace.svelte` for the face, its marks and its close control, and `ui/Tabs.svelte` for the strip. The review checked `DESIGN.md:98` and found it a sample that already omits 21 of the 32 components, so the split makes it no falser; `DESIGN.md:331` names `ui/tab-strip.ts` and `ui/tab-scroll.svelte.ts`, neither of which moved; `HELP.md` names no source file.

## Verification on main

```
npx vitest run --reporter=dot      Test Files 258 passed (259), 1 failed
                                   Tests 4368 passed (4369), 1 failed
npx vitest run tests/server/watch/git.test.ts   Tests  22 passed (22)
npm run check                      COMPLETED 1243 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
npm run lint                       no output
npm run format:check               All matched files use Prettier code style!
sh bin/size-check.sh               no output, exit 0
the ASCII gate                     no output
node bin/revert-check.mjs ...      Q54's eight directives all red; the one GREEN is the pre-existing Ticker one above
npx playwright test tabs pages shell-defects keyboard
                                   49 passed (1.8m)
```

The one red in the full run is `tests/server/watch/git.test.ts > reads a root added to the workspaces file while it is running`, a known load flake; rerun alone it is green, quoted above.

## What is next

Q53 is in its repair round with seven rulings plus the Ticker directive. Q56 was dispatched at 12:10 from `521c938c`, the Files view asking again after a read that failed, its brief rechecked against that head and widened by one premise: the workspaces section has no failure sentence at all, so it gets one. After those, Q58, Q59, Q36, O31, then Q35.
