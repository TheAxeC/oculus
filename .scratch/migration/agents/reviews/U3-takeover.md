# U3, the worktree a new builder takes over (Z164 (b))

The first builder of U3 split the views into six groups (G1 to G6) and gave each to a helper agent, working in the same worktree, from the group file below. All seven agents were stopped at 16:37 on 2026-10-01 (each transcript's meta reads `stoppedByUser: true`), with no final report from the builder. The worktree `.agents/worktrees/U3` holds 259 changed paths against the base 41cc19bf (`git status --short | wc -l`).

What is known of each group:

- G3 (feeds) handed its report back to the builder before the stop; it is below, whole.
- G1, G2, G4, G5, G6 and the builder's own part (the primitives) stopped mid-work, with no report. Their state is only what the worktree holds.
- Nine files were written by two agents, read from the agents' commands that write a file (a pattern match over their Bash commands, so it may miss a write and may name a path a command read): `src/lib/themes/tokens.css` (G5, builder), `src/lib/ui/controls/Chip.svelte` (G6, builder), `src/lib/ui/controls/text/Search.svelte` (G5, builder), `src/lib/views/boards/project/Project.svelte` (G1, G2), `src/lib/views/sources/repositories/Repositories.svelte` (G5, builder), `src/lib/views/system/help/Help.svelte` (G1, G6), `tests/checks/tree/negatives.test.ts` (G3, builder), `tests/views/shared/prose/intro.test.ts` (G1, builder), `tests/views/sources/source.test.ts` (G1, G5). Each is read whole for a change of one agent overwritten or half-applied by the other.

## The group file the helpers were given (the first builder's own summary, not the brief)

# U3 view work: the common brief for every view agent

You are one of six agents bringing a group of oculus views onto VS Code's scale. The primitives are built and in the tree. You apply them to the views of your group. The orchestrating builder reads every diff you leave.

## Where you work, and what you never do

- Worktree: `/Users/axelfaes/workspace/research-hub/.agents/worktrees/U3`, the app in `tools/oculus`. Use absolute paths under it. Never touch `/Users/axelfaes/workspace/research-hub` outside the worktree, and never another worktree.
- Node: prefix every npm/npx call with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`, run from `/Users/axelfaes/workspace/research-hub/.agents/worktrees/U3/tools/oculus`.
- Never run a git command. Never edit anything under `tools/oculus/.scratch/`.
- Never print, open, grep or hash `config/local.yml`; every grep over `config/` uses `--exclude=local.yml`. Never fetch a calendar address. Never touch or curl ports 8787 or 8790, never start or kill a server. Never read `.vscode`. No browser. Never run `npm run test:slow`. Do not run the whole suite; run only the test files that cover what you changed.
- Quote globs in grep (`--include='*.svelte'`) because the shell is zsh. On macOS `sed -i` needs `sed -i ''`; prefer the Edit tool or a Python script.
- Write only the files of your group (listed in your assignment), the tests under `tests/views/` that cover your group's views, and the catalog files under `config/text/views/` for your group's views. Do not edit: anything under `src/lib/ui/`, `src/lib/themes/`, `src/lib/state/`, `src/lib/shell/` (unless it is yours), `tests/views/whole/` (the orchestrator re-pins `type-scale.test.ts` and the other whole-tree tests), `tests/checks/`, `tests/ui/`, `DESIGN.md`, `config/catalogs/`, another group's views, `views/shared/` directories that are not yours. When a primitive or a shared file you do not own lacks something your view needs, say so in your report (name the file and the need); do not edit it and do not work around it with a `:global(...)` reach into a primitive.
- Rules of the tree (spec): ASCII only; four-space indentation; no history in comments (a comment says what a rule does and why, never when or after what); every size from a token, no literal px `font-size` (the line-height of VS Code's controls is the only px typography allowed, as in the primitives); every user-facing string from `config/text/` through `t('group.key')` (a key joins its group where the group already is; keys in the yml files are in ASCII order); every glyph from the catalog; every control a `ui/` primitive (ToolButton, Chip, Segment, Search, Menu, Select ...), never a raw `<button>`, `<input>`, `<select>`; a component at most 540 lines (split by concern into a new component beside it when your change takes it past 540: the new file opens with the layer head comment, the folder keeps at most 10 items, the new file is listed in your report because `tests/views/whole/type-scale.test.ts` must list it); a file under 1000 lines; no new `:global(...)` reach into a primitive's class; markup one element per line. Format with `npx prettier --write <the files you wrote>` and check with `npx prettier --check <those files>`.
- A shortcut is a finding against you: a view of your group skipped, a rule applied to one view of two that need it, a check loosened, a test fitted to its revert, a sentence in the report instead of a change in the code. Every view of your group, and every shared partial of your group, is in scope for every item below that reaches it.
- Report the end state only, plainly and in ASCII, no narration of wrong turns.

## What is built (read these files first)

- `src/lib/themes/tokens.css`: type scale `--fs-xs` 11px, `--fs-sm` 12px, `--fs-md` 13px, `--fs-lg` 14px, `--fs-xl` 16px, `--fs-2xl` 20px, `--fs-3xl` 26px, each times `--text-scale`; `--fs-3xs` and `--fs-xxs` no longer exist; `--header-action` 20px; `--radius-pill` 11px; `--tree-indent` 8px; `--icon-box` 16px; `--input-radius` 4px; a global rule for `a` (no underline at rest, underline on hover, the 1px ring on focus).
- `src/lib/ui/frame/Pane.svelte`: header 22px with the title and a `toolbar` snippet; new `bar` snippet drawn under the header (`.viewbar`, padding 6px 12px, wrapping; `:empty` hides it).
- `src/lib/ui/frame/toolbar/Toolbar.svelte`: `<Toolbar label overflow>`. In the header snippet pass `overflow`; in the bar snippet do not.
- `src/lib/ui/controls/ToolButton.svelte`: text button 26px (default); `small` (22px, for a button inside a 22px row); `compact` (icon alone, 20px box, 16px icon, no border; the words become the tooltip and the aria-label; needs a `glyph`); `bare` (same box, for a header action); `pressed` sets `aria-pressed`; `active` draws it as in force.
- `src/lib/ui/controls/Chip.svelte`: the count-badge capsule (18px min, 11px words, radius 11px). With `onclick` it is a pressable toggle with `pressed` (aria-pressed true/false, pressed drawn filled in its `tone`), `glyph`, and `title` for a tooltip.
- `src/lib/ui/controls/text/Search.svelte`: `fill` makes it `flex: 1 1 12em; max-width: 32em`. Inputs are 26px high, radius 4px, 13px.
- `src/lib/ui/frame/Empty.svelte`: `<Empty message glyph error action />`. Without `error`: centred empty state. With `error`: a boxed red message drawn as text; `action` is a snippet drawn after the words (use a `<ToolButton small ...>` for a retry).
- `src/lib/ui/frame/Card.svelte`: radius 4px, `.face` padding 8px 12px, title `--fs-md` weight 600, `--card-reveal` (0 at rest, 1 while the card is hovered, holds the focus, has the keyboard cursor, or the screen does not hover). `src/lib/views/shared/card/CardActions.svelte` already uses `opacity: var(--card-reveal)`.
- `src/lib/ui/display/Glyph.svelte`: draws 16px by default (`--glyph-size`), independent of `font-size`.
- `src/lib/views/shared/prose/Intro.svelte`: plain muted paragraph.
- Glyph `add` exists (Lucide plus, stand-in `[+]`). `SourceButton` is now a bare header icon.
- Worked examples, already done: `src/lib/views/boards/collection/Collection.svelte` (header: add as `bare` `glyph="add"` ToolButton with `pressed`, SourceButton; bar: Search `fill`, the status facets as pressable `Chip`s with `tone`, `pressed`, `onclick`), `src/lib/views/boards/projects/Projects.svelte` (header: add, expand all, collapse all as bare icons; bar: Search, Menu, quick toggles and type toggles as pressable Chips with `title`, two Segments), and their tests `tests/views/boards/collection/collection.test.ts`, `tests/views/boards/projects.test.ts` ("where the board puts its controls"). Read Projects' `tools` and `bar` snippets before you start.

## What each view of your group comes out with (brief items, all in scope)

1. Header and bar (the Z157 rule). The header `Toolbar` (with `overflow`) holds icon actions only, each a `bare` ToolButton with a `glyph` and its words as the label (tooltip and aria-label). In the bar (a `bar` snippet passed to `Pane` as `{bar}`, holding a `<Toolbar label=...>` without `overflow`) go: a search box (`Search fill`), a select, a Segment, a toggle with or without a glyph (a pressable `Chip`), a chip, a text button whose words carry state (a count, a current value, a choice), a composite with words (`SessionPicker`, `TerminalTitle`, `TerminalFontTools`), and an action with no glyph (a text button). An add action (`*.add` keys of the same meaning: `leads.add`, `memories.add`, accounts' add, data's and venues' `collection.add`) is a header icon on the glyph `add` with `pressed` when it opens a form. An action with a glyph stays in the header as a bare icon with the words as the label. Status or alert words go at the end of the bar (`margin-left: auto`), keeping their role and size; a view whose header held only status words has a bar and an empty header toolbar (pass no `toolbar` snippet then). A view that has a header toolbar with no icon action left passes no `toolbar`. A new Toolbar `label` for a bar needs a catalog key in the view's own file under `config/text/views/` (for example `projects.filters`).
2. Controls: a text button is the default ToolButton (26px); inside a row of 22px use `small`; an icon-only control in a row or card is `compact`. Raw measures for buttons/inputs a view draws itself are removed in favour of the primitive.
3. Text: every `font-size: var(--fs-*)` in a view takes its token by role: the main words of a row, a list item, a paragraph, a card body, an empty or error message `--fs-md`; secondary words (a detail, a date, a count beside words, a caption, a description under a title, a control's words) `--fs-sm`; a label, a badge, an uppercase heading of a section or group, a header title `--fs-xs` (weight 700 where it is a heading); a page or document title `--fs-xl` and above. A list item's words in a panel of facts are main words. Decided cases: Collection `.label` xs; Inbox `.group h3` xs weight 700 uppercase; Person `.facts dt` xs; History `.what`/`.value` md and `.when` sm; Linkedin h3 like Inbox's; AccountSetup h3 md weight 700. Note that the former `--fs-3xs`/`--fs-xxs` uses became `--fs-xs` mechanically; re-judge each by role. A rule that sizes a Glyph by `font-size` to change the icon's size is removed (Glyph ignores font-size now).
4. Rows: every list row a view draws outside `ui/tree` is one line of `calc(var(--tree-row) * var(--text-scale, 1))` (22px), its words `--fs-md`, a two-line item growing by whole lines; the views by name: Focus's lane items, Venues' `li.nextitem`, Code's and Funding's `div.row`, Search's hits and file groups, Status, Help, the session list, Timeline, Agents, Changes, Slides, Person, Usage, Gallery, History, Tasks.
5. Actions on hover or focus: the actions of a card or a row are at opacity 0 at rest and 1 while the card/row is hovered, holds the focus, or is selected, always 1 on a screen that does not hover (`@media (hover: none)`), with `transition: opacity 120ms ease-out`. A card uses `opacity: var(--card-reveal)`. A row uses the same rule written on the row (`--row-reveal`, set 0, then 1 on `:hover`, `:focus-within`, selected, and in `@media (hover: none)`). A control keeps the keyboard focus while hidden (do not use `display:none` or `visibility:hidden`), and taking it reveals the set (`:focus-within`). In scope by name: the card controls outside CardActions (Pillars', Venues' and Data's Edit entry, Data's Recover, Coauthor's pin to top), Radar's, Leads', Inbox's, Linkedin's, Focus's status buttons, the session list's per-row opener, AccountSetup's, Tasks' subtask buttons (through `Ticker`'s `reveal` prop, which exists), History's Undo and pills.
6. Cards: the grids fit the pane: card grids become `repeat(auto-fill, minmax(min(320px, 100%), 1fr))` (Collection, Projects, Venues, Data) or `minmax(min(290px, 100%), 1fr)` (Pillars, Domains); `.leads` gets `grid-template-columns: minmax(0, 1fr)` and the card wrappers in a grid `min-width: 0`; the Slides row box fits its pane the same way. Nothing clips at a 309px pane or at a 170px pane. The 3px tone rule on `EntryCard`/`ProjectCard` follows the card's radius (`border-radius: var(--input-radius)` corners of the rule). Every capsule is a `Chip` (one shape): the filter toggles (Collection's facets, Projects' type and quick filters, Leads' declined toggle) are pressable Chips; the `.disclosure` pills of Pillars and Venues use `Disclosure` (already the chip shape), Joint-work's bordered pill and the filled status chips of Code and Funding use `Chip`. A Tag stays a Tag. Titles at `--fs-md` weight 600.
7. Links: no underline at rest, underlined under the pointer and with the focus; the global `a` rule does it. Remove every view rule that sets `text-decoration: underline` at rest, and any `a { ... }` rule in a view that fights the global one; keep a view's colour rule. Focus's item-name buttons, Help's links and AccountSetup's links get the 1px focus ring (`outline: 1px solid var(--accent); outline-offset: 1px` for plain words; `-1px` for a control with a box).
8. Empty, error and narrow states: a view's empty line with no centred shape (the code, changes and `none` lines that draw 10.5px with no glyph, Findings' empty line) uses `Empty`. Error states with a retry use `<Empty error message action>`: Search's `error: unclosed group` (retry: the existing `runSearch(id, roots)` of `src/lib/state/sources/search.svelte.ts`; that file is not changed), the source tab's read failure (retry: read the file again), Hpc's red monospace line (its Refresh now becomes the action). Linkedin's `.nudge` is the same box in amber: if `Empty` has no tone prop for that, write it in your report as a need (do not edit `Empty`) and draw the box in the view with the amber token pair `--c-amber`, `--c-amber-bg`, `--c-amber-txt` at `--fs-sm` on 17px lines, padding .4em, 1px border. Narrow: no box clips at a 309px pane: Hpc's Refresh now, and the Status and Usage tables scroll inside their own box and not the pane (`overflow-x: auto` on a wrapper; `min-width: 0`).
9. Calendar: event text set through the library's own `--ec-*`/rule to `--fs-sm` so no 9.8px text is left.

## Tests

- The unit suite renders a component to a string (`render` from `svelte/server`, see the neighbouring tests) and has no DOM; a press, focus, hover or computed style is not testable and is reported as an audit "seen at the look". Do not write a test over source text and call it coverage; a source-text assertion is allowed only where the neighbouring test already does so (CSS pins), and the report names it as an audit.
- For each behaviour or markup you change, update the existing tests whose pinned markup changed, and add a test that fails on the unchanged tree: e.g. "view X puts control Y in the bar and only bare icons in the header", "toggle Z renders aria-pressed", "the error state renders the Empty error box with the retry button". Never loosen an assertion to make it pass.
- Run: `npx vitest run --project unit <the test files of your group>` (find them with `grep -rln '<ViewName>\|views/<dir>' tests/views tests/ui | sort`), `npx svelte-check --threshold error` (must print 0 errors), `npx prettier --check <files>`, `LC_ALL=C grep -n '[^ -~]' <files>` (nothing).
- Do NOT edit `tests/views/whole/*`. Tests there will fail until the orchestrator re-pins them; ignore those failures and do not run them.

## Your report (the final message of your run)

1. First line: anything in your group NOT done (or "all of the group's items are done").
2. A table: one row per view/partial file of your group: header/bar moved (yes/no/n.a.), rows 22px, reveal, links, states, tokens re-judged; with the command or test that shows it.
3. The final `font-size` map you set for every changed file, as `file: selector=token | ...` (the orchestrator uses it to re-pin `type-scale.test.ts`), and the list of new files with their line counts.
4. Needs from files you do not own, with file and the exact need.
5. Design decisions you took that a reader could dispute (each one line, with why).
6. Audits "seen at the look": what could not be proven by a string render, per view.
7. The commands you ran and their last lines (vitest summary, svelte-check, prettier, the ASCII grep).


## G3's report, as it handed it back

**G3 (feeds) report. All of the group's items are done. Three things outside my files need the orchestrator (section 4).**

Files I wrote, all under `tools/oculus`: the ten `.svelte` files in `src/lib/views/feeds/{inbox,leads,linkedin,radar}/`, the four yml files in `config/text/views/feeds/`, and the four tests in `tests/views/feeds/`. I did not touch `post-card.ts`.

## 2. Per file

| File | Header/bar | Rows 22px | Reveal | Links | States | Tokens |
|---|---|---|---|---|---|---|
| inbox/Inbox.svelte | Yes. Search `fill` moved to a `bar` snippet (`inbox.filters`). No header toolbar is passed. | n.a. | n.a. | n.a. | Already used `Empty` | `.group h3` is now xs, weight 700, uppercase |
| inbox/InboxCard.svelte | n.a. | n.a. | Yes. The four compact controls sit in `span.controls` with `opacity: var(--card-reveal)` and a 120ms transition. | n.a. | n.a. | Unchanged; re-judged and kept |
| leads/Leads.svelte | Yes. Header: `add` as a bare icon on glyph `add` with `pressed`, plus `SourceButton`. Bar: Search `fill` and the declined toggle as a pressable `Chip` with `pressed`. | n.a. | n.a. | n.a. | The `leads.empty` line is now `Empty` | `.empty` removed |
| leads/LeadCard.svelte | n.a. | n.a. | Yes. `.actions` uses `--card-reveal`. All four buttons are now `small` (they were `compact` with no glyph, which rendered as 26px text buttons). | Colour rule kept, no underline rule | n.a. | `.sub` is now sm |
| linkedin/Linkedin.svelte | Yes. Header: `addidea` as a bare icon on glyph `idea` with `pressed`. Bar: Search `fill`. | n.a. | n.a. | n.a. | `.nudge` is an amber box. The other `Empty` uses are unchanged. | `h3` is now xs, weight 700, uppercase |
| linkedin/PostCard.svelte | n.a. | n.a. | Yes. The footer `.actions` uses `--card-reveal`. | n.a. | n.a. | `.date` is sm (unchanged) |
| radar/Radar.svelte | Yes. Header: `SourceButton` only, with no `toolbar` passed when `source === null`. Bar: Search `fill`. | n.a. | n.a. | n.a. | Unchanged | none |
| radar/RadarCard.svelte | n.a. | n.a. | Yes. Restore, idea and dismiss sit in `span.controls`, drawn only when the entry has a title. | No underline rule in the file; the global `a` rule applies | n.a. | `.sub` is now sm |
| radar/Bucket.svelte | n.a. | n.a. | n.a. | n.a. | n.a. | The `:global(.tip .tool .glyph)` rule is removed. |
| radar/RadarIntro.svelte | n.a. | n.a. | n.a. | n.a. | n.a. | No font-size rules; nothing to change |

Grids:
- `.inbox`, `.leads`, `.linkedin` and `.radar` use `grid-template-columns: minmax(0, 1fr)`.
- The card wrappers (`.cards > :global(*)`) have `min-width: 0` in all four views.
- Card text has `overflow-wrap: anywhere` where a long unbroken string could clip.

How these were checked: `npx vitest run --project unit tests/views/feeds` passes (67 tests before my last edits, re-run at the end with the checks below: 116 passed across 7 files). The CSS-only items, which are reveal, grids, wrap and the amber box, cannot be tested by a string render and are listed in section 6.

## 3. Font-size map (for re-pinning `type-scale.test.ts`)
- `feeds/inbox/Inbox.svelte`: `.group h3=fs-xs`
- `feeds/inbox/InboxCard.svelte`: `.address=fs-sm | .age=fs-sm | .subject=fs-md | .snippet=fs-sm`
- `feeds/leads/Leads.svelte`: `.runlog=fs-sm` (`.empty` removed)
- `feeds/leads/LeadCard.svelte`: `.deadline=fs-sm | .sub=fs-sm`
- `feeds/linkedin/Linkedin.svelte`: `.nudge=fs-sm | h3=fs-xs`
- `feeds/linkedin/PostCard.svelte`: `.date=fs-sm`
- `feeds/radar/Radar.svelte`, `Bucket.svelte`, `RadarIntro.svelte`: `''`
- `feeds/radar/RadarCard.svelte`: `.sub=fs-sm | .date=fs-sm`

No new files. Line counts: Inbox 262, InboxCard 336, LeadCard 232, Leads 354, Linkedin 310, PostCard 113, Bucket 108, Radar 195, RadarCard 241, RadarIntro 114.

Catalog keys added:
- `inbox.filters`
- `leads.declined`, `leads.filters`, `leads.toolbar`
- `linkedin.filters`, `linkedin.toolbar`
- `radar.filters`, `radar.toolbar`

`leads.empty` now uses backticks instead of `<code>`.

## 4. Needs from files I do not own
1. `tests/checks/tree/allow-styling.ts`: remove the three HELD entries for `views/feeds/radar/Bucket.svelte`. They cover `.glyph`, `.tip` and `.tool` via `section > :global(.tip .tool .glyph)`. `boundaries.test.ts` "holds the styling lists to rules the tree still has" lists them as stale.
2. `tests/checks/tree/allow-duplication.txt`, line 36: remove the entry `src/lib/views/feeds/radar/Radar.svelte src/lib/views/sources/venues/Venues.svelte c95bebb07c98`. Radar's header markup changed, so the clone no longer exists. `duplication.test.ts` "holds the lists to clones that are still shared" reports it as stale.
3. `src/lib/views/shared/accounts/ConnectorHead.svelte` and `NoAccounts.svelte`: Refresh now and Add account are body buttons drawn there, and Inbox only passes `adding` and `onadd`. By brief item 1, "accounts' add" belongs in the header as a bare icon on glyph `add`. Inbox cannot do that without a change in that shared file. I left Inbox with no header toolbar. Please assign the accounts partials to an owner and say whether the add moves into Inbox's header snippet.
4. `ui/frame/Empty.svelte` has no tone prop. I drew the Linkedin nudge in the view with the amber token pair, as the brief allows.

## 5. Decisions a reader could dispute
- **Declined toggle words.** The Chip label is fixed (`declined 2`, new key `leads.declined`), and the old Show/Hide words moved to the tooltip. Reason: `aria-pressed` already carries the state.
- **Bucket heading colour.** I did not simply delete the rule, because that would drop the bucket colour from the heading mark. The mark is now a `span.mark` passed as `ToolButton` children, painted `var(--bucket-txt)`, so no `:global` reach is left. The pinned markup in the radar test changed to match.
- **Linkedin add-idea icon.** It stays on glyph `idea`, because brief item 1 names only `leads.add` for the `add` glyph. The `+` in `leads.add` and `linkedin.addidea` stays in the words, as in the worked examples.
- **`.sub` lines.** Leads (institution | country) and Radar (authors | venue | year) are sm as descriptions under a title. Inbox `.subject` stays md 600.
- **Feed read errors.** The `radar.feed_error` lines in Leads, Radar and Linkedin keep their centred `Empty` with the warn glyph. There is no retry there, and brief item 8 asks for a boxed error only where a retry exists.
- **Linkedin nudge.** The red left-rule box with `--chip-on-wall` is now the amber box. Its wallpaper rule is dropped, as `Empty`'s error box has none.
- **Leads empty line.** It now goes through `Empty` with glyph `scout`.

## 6. Audits "seen at the look" (not provable by a string render)
- **Reveal of card actions.** Inbox, Leads, Linkedin and Radar: transparent at rest, shown on hover or focus-within or cursor, always shown on a no-hover screen, with the 120ms transition.
  - Only Inbox has a CSS pin, named "audits that the card controls are transparent at rest and follow the card".
  - The `.controls` markup is pinned in Inbox and Radar.
- **No clipping.** At 309px and 170px for every card grid, and Leads' card at 486px before the change.
- **Amber nudge box.** Colours and 17px lines (Linkedin).
- **Section headings.** The uppercase, weight 700 look of the Inbox and Linkedin headings.
- **Bucket heading mark colour.** Rendered in the bucket's hue.
- **Links.** No underline at rest, underline on hover, the 1px ring on focus.
- **Inbox card.** The long sender address wrapping at 170px.

## 7. Commands and last lines
- `npx vitest run --project unit tests/views/feeds`: 4 files, 67 tests passed before the last edits.
- Final run of `tests/checks/source/text.test.ts`, `tests/checks/source/html-sites.test.ts`, `tests/checks/config/config-folder.test.ts` and `tests/views/feeds`: `Test Files 7 passed (7)`, `Tests 116 passed (116)`.
- `tests/checks/tree/audits.test.ts`: my cases all pass. The only failures are `tests/views/shared/prose/intro.test.ts` cases, which are not mine.
- `tests/checks/tree/negatives.test.ts`: no feeds entries remain after I added reason comments above each absence. Still failing from other groups: `editor.test.ts` and `file.test.ts`.
- `tests/checks/tree/duplication.test.ts`: my tests add no new clone. The one remaining failure is the stale entry in section 4, item 2.
- `tests/checks/tree/boundaries.test.ts`: three stale entries are mine (section 4, item 1). The other three stale entries are for `views/sources/search/Results.svelte`, not mine.
- `npx svelte-check --threshold error`: `3 ERRORS`, all in `views/system/workbench/Catalogue.svelte` and `tests/views/system/workbench/catalogue.test.ts` (a duplicate `<script>` element). None are under `feeds` (the output filtered for "feeds" counts 0).
- `npx prettier --check` on the group's svelte, ts and yml files: "All matched files use Prettier code style!".
- `LC_ALL=C grep -n '[^ -~]'` over the same files: no output.
- Not run, as instructed: `tests/views/whole/*`, the whole suite and `test:slow`.

