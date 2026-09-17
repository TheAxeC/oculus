# Landing report: Q38

## Open items at this landing

- The steps a review booked rather than a brief (kept here because the skill books a finding beyond a brief in this list, and plan.md alone is not read in a report): Q49 a ticker row's hidden buttons take no room; Q50 a web address in a path field is not a hub path; Q51 `state/layout.svelte.ts` split; Q52 one branch-state sentence for the two git views, with the `data-repo` spelling; Q53 the accent line across nested pages and a folded pane; Q54 `ui/Tabs.svelte` split; Q55 the pane menu behind the pane body under the rice themes; Q56 the Files view retries a failed read; Q57 a workspace that is gone is not "not a git repository". Each is a fix of delivered work and needs no ruling; they are worked in queue order.
- The Files view keeps a failed read on screen after the cause is gone (seen 2026-09-17 22:25 on the TEST page while looking at Q43): the bookmarks section read "The bookmarks could not be read: Failed to fetch" while `GET /api/fs?bookmarks=1` answered 200, and only a reload cleared it; nothing retries the read and no control offers to. The same shape as the `no-roots` line D22 fixed at its landing. A fix of delivered work, no ruling needed: booked as Q56, after Q48.
- A Focus ticker row's name cut mid-word (seen 2026-09-17 22:22 on the TEST page while looking at Q41): on the Funding and Teaching rows of Axel's own board a row's name is cut with no ellipsis ("FWO Senior Postdo", "Bioinformatics (3740) - Coordin"), which is the hidden buttons holding their width. Already booked as Q49; recorded here as seen in the page.
- The recurring-findings pass the skill asks for at a pause (raised 2026-09-16 23:37): not done for the trial set's nine review reports; to run before the next dispatch. Ruled 2026-09-17 09:44, Axel: at the next pause; this one was a trial.

## NOT DONE

Nothing of the step itself. What the landing did not close is named in the note below and booked as its own step.

## What landed

- Q38 landed 2026-09-17 21:08 from worktree `q38` at 91fb46cb, one review (eight rulings), one repair round, the run over the round (eight findings, three closed at landing, three booked as Q53, Q54 and Q55, two recorded). Fixes at landing, in the worktree before the cherry-pick: the dirty-dot check measures the drawn svg on both axes, so it is red with the dot's `transform` removed (it was green with the mark 20.66 px off); a new case splits a pane downwards and reads the handle's reach on the border rows and its keyboard line, red with `.sash.col::before` and red with `.sash.col:focus-visible .line` dropped; the page-strip case switches to a wallpaper theme and reads both strips' surfaces, red with `:global(body.wall) .strip.card` dropped. Conflicts resolved at the cherry-pick: `config/glyphs.yml` and `config/icons.yml` keep both D22's `show_in_files` entries and Q38's header-action ones; `tests/browser/unsaved-forms.spec.ts` takes D22's `pressCardAction` and Q38's `tabNamed`. On main: `npm test` 250 files 4,200 tests, `check` 1,217 files 0 errors 0 warnings, build, `format:check`, `lint`, the ASCII gate, `npx playwright test` 238 passed (9.0m). Two catalog keys are new and user-visible: `ui.tab_unsaved` ('{0}, unsaved', what a screen reader hears on a tab holding unsaved text) and `ui.pane_more_glyph` (the pane opener's `...`, while `ui.pane_menu_glyph` stays the Sessions row menus' list glyph). The look was taken from the built worktree in Playwright's own browser, in light, dark, gruvbox and mocha at 1600 wide and at 820 wide (`scratchpad/looks/q38/`): tabs edge to edge with the shown tab on the pane surface, the dot on the dirty Tasks tab and on its page tab, the bare split and `...` buttons at the strip's right, the page strip lower on the card surface, and the scroll control with its count at the narrow width. HELP.md and DESIGN.md carry the Doc text, with the nested-page case written as it behaves.

## Where the proof is

- The step's brief: `agents/briefs/Q38.md`.
- Its review and the run over its repair round, with what was closed at landing: `agents/reviews/Q38-refuter.md`.
- The builder's report and its repair round: `agents/reviews/Q38-report.md`.
- The commands and their outputs are quoted in the note above.
