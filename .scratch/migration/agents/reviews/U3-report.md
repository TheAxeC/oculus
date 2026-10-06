U3 REPORT (takeover builder). Worktree: /Users/axelfaes/workspace/research-hub/.agents/worktrees/U3/tools/oculus. Plain ASCII.

NOT DONE / DEVIATIONS (first, as the brief asks)
1. The brief's check 4 asks that each new or changed test of an added behaviour fails on the UNCHANGED tree. I may run no git command except `git status --short` and `git diff`, so I cannot run the tests on base 41cc19bf. I proved each test by taking the behaviour out of the final tree instead (mutation, then restored; see "Test failure proofs"). That is not the brief's form of proof. The orchestrator can run the same test files on base at landing.
2. The first run of the cases on the unchanged tree is not mine. The first builder's first run is recorded only in `agents/briefs/U3-cases.md` (case 8 against `ui/tabs/`, ruled Z161, plus six corrections). I ran every case again on the final tree (below).
3. The ASCII gate with `config` included prints one line: `config/present.yml:255: ... (Twente and Linköping) ...`. The file is not in `git status`, so this step did not touch it. The gate in checks.sh (`src tests`) is empty. The brief's `bin` directory does not exist in this tree (`ls bin` fails). Linköping is an accented place name.
Everything else in the brief is done. Full verify-list runs: 1 (checks.sh); it printed `checks: 7 commands passed`, exit 0.

OPEN ITEMS (orchestrator-state.md lines 144-151, verbatim)
- Z172, git behaviours that differ from VS Code's defaults (raised 2026-10-01 by D31's item 14 and its review, `agents/reviews/D31-refuter.md` Spec 1). D31's widening line in `plan.md` says the other git options stay at VS Code's defaults as X3d built them; the review reproduced seven that do not, against VS Code 1.137.0: `git.pullTags` (VS Code true; oculus runs plain `git pull`, `git-write.ts:590`), `git.requireGitUserConfig` (true, `-c user.useConfigOnly=true`; oculus plain `git commit`), `git.enableCommitSigning` (false, `--no-gpg-sign`; oculus leaves `commit.gpgsign` to decide, unset on this machine), `git.statusLimit` (10000; oculus 200, `core/git.ts:126`), `git.untrackedChanges` (mixed; oculus a separate Untracked group), `scm.alwaysShowRepositories` (false; oculus lists every root, `RepoList.svelte:120`); `git.pruneOnFetch` (false; oculus prunes, which Z83 ruled for oculus). Two more (`git.countBadge`, `git.autoRepositoryDetection`) are being examined in D31's round 1. (a) Recommended: a new step that brings the six unruled rows to VS Code's defaults, prune kept under Z83, HELP.md and DESIGN.md then saying the rest is at VS Code's defaults. For: the parity the plan line claims. Against: Untracked folded into Changes and the repository list hidden for one root change what you see today. (b) Keep oculus's choices and write each one into HELP.md and DESIGN.md as a fixed choice. For: nothing on screen changes. Against: seven divergences from the editor oculus copies. (c) Nothing, the plan line left false: the lazy option.
- Z170, `local.yml` and the 53 `config/text/` files in the Settings view (raised 2026-10-01 by Axel's question). Today Settings draws `local.yml`'s 16 keys as rows with their description and key path, never reads the file (`state/system/config/groups.ts:8-10`) and gives no open link (`settings/Item.svelte:53`); the text files (2,581 key lines, `find config/text -name '*.yml' | xargs cat | grep -cE`) are in no Settings group and were no Config card. (a) Recommended: a `local.yml` group heading with the open-the-file action S4 adds for every file, and a Texts group listing the 53 files, each with that action; no card shows `local.yml`'s text, since it holds the calendar link. For: every config file reachable from Settings; the secret stays off the page. Against: the text keys are edited in the source tab, not as rows. (b) the same, plus every text key a Settings row with a text control. For: words found by search. Against: 2,581 rows drown the 128 options in every search. (c) neither, the lazy option.
- Z171, the Pages view folded into Settings (raised 2026-10-01 by Axel's question). Pages (`views/system/workbench/Pages.svelte`, 391 lines) lists every page, the rail's and the reader's own, and shows, renames, resets, closes and makes one, and a row dragged onto a pane's edge nests that page; Settings already holds the rail list (`RailEditor`) and the reset of every page (`PagesReset`) as rows (`settings/Item.svelte:175-177`). (a) Recommended: Pages kept as its own view on the merged page. For: it is a navigator used to reach and arrange pages, closer to VS Code's Open Editors than to a setting, and its drag onto a pane needs a view beside the panes. Against: two places name pages. (b) Pages moved into Settings as a section with all its controls, the view removed. For: one view fewer. Against: reaching a page means opening Settings, and the drag to a pane edge starts inside a settings list.
Raised by this step for the orchestrator (not in the state file): the page's body font is `--fs-xl` (16px) at `src/routes/+layout.svelte:33`, outside this step's paths (`src/routes` is excluded). `.pane { font-size: var(--fs-md) }` (Pane.svelte) covers every view; a surface drawn outside a Pane inherits 16px. Recommendation: change the layout font to `--fs-md` in a step that may touch `src/routes`. Lazy option: leaving it covered by the Pane rule.

CASES' RUN (final tree; command: `npx vitest run tests/ui/frame/toolbar-fit.test.ts tests/ui/frame/pane-bar.test.ts tests/ui/frame/empty.test.ts tests/ui/controls/chip.test.ts tests/ui/display/glyph.test.ts tests/state/sources/search.test.ts tests/views/sources/search.test.ts tests/views/boards/collection tests/views/boards/projects tests/config`: Test Files 11 passed, Tests 177 passed)
Round-0 first run (from `agents/briefs/U3-cases.md`, the first builder's): case 8 conflicted with "ui/tabs/ is not changed" (Z161 option A, TabFace.svelte gets two rules); six corrections: (2) order.ts unchanged, (3) retry is the existing `runSearch(id, roots)`, (4) chip padding 3px 5px, (5) `--header-action` is calc(20px * var(--text-scale, 1)), (6) case 11 as an overflow opener that moves the focus into its popover, (7) Projects' `board.new_idea` is an add action on the `add` glyph with `aria-pressed`.
1 fit: `tests/ui/frame/toolbar-fit.test.ts` 7 tests pass (all fit, 3 of 6, exact fit, 200 wide gives 0, empty, room 0, non-finite).
2 Pane bar and opener: `tests/ui/frame/pane-bar.test.ts` 5 pass.
3 Projects: `tests/views/boards/projects.test.ts` "puts the search, the filter menu, the toggles and both segments in the bar" and "keeps only bare icon actions in the header" pass.
4 Collection add: `collection.test.ts` "draws the add control as a bare icon on the add glyph, its words as its name" passes; config checks pass (`tests/config`; `glyphs.yml:38` `add: "[+]"`, `icons.yml:37` `add: plus`).
5 Empty error: `tests/ui/frame/empty.test.ts` 4 pass (text not markup, action after the words, no button without action, centred markup without error).
6 Chip pressed: `tests/ui/controls/chip.test.ts` 3 pass.
7 Glyph: `tests/ui/display/glyph.test.ts` pass (ASCII stand-in; empty box for a name with no drawing).
8 greps, final tree: `grep -rn "fs-3xs\|fs-xxs" src tests`, `grep -rn "outline: 2px" src`, `grep -rnE "outline-offset: [^;]*" src | grep -v "\-1px\|1px"`, `grep -n "1em" src/lib/ui/display/Glyph.svelte`: all print nothing. `git diff -U0 src/lib/ui/tabs` shows only TabFace.svelte: `--fs-xxs` to `--fs-xs`, and `outline: 1px solid var(--accent); outline-offset: -1px`.
9 Search: `tests/state/sources/search.test.ts` and `tests/views/sources/search.test.ts` pass; `src/lib/state/sources/search.svelte.ts` is unchanged (`git status --short src/lib/state src/routes src/lib/server src/lib/data` prints nothing).

TEST FAILURE PROOFS (behaviour removed from the final tree, test run, file restored)
- fit.ts `all <= space` to `all < space`: toolbar-fit "draws no opener when the last control fits exactly" fails (1 failed, 6 passed).
- Chip.svelte `aria-pressed={pressed}` removed: chip.test "says it is pressed" and "says it is not pressed" fail.
- Empty.svelte `<CodeText text={message} />` to `{@html message}`: empty.test "draws the message as text, never as markup" fails.
- Pane.svelte `{#if bar}` to `{#if true}`: pane-bar.test "draws no strip for a pane with no toolbar and no bar" fails.
- AddButton.svelte `glyph="add"` to `glyph="close"`: collection.test, 28 failed including "draws the add control as a bare icon on the add glyph".
- Projects.svelte `<Pane ... {bar}>` bar removed: projects.test 6 failed including "offers one filter control in the toolbar".
These are audits of removal, not runs on base (deviation 1).

DONE / NOT DONE (one run of the verify list; output as `checks.sh` printed it)
| Item | Status | Proof |
| 1 Header frame (Pane 22 px header, `--header-action`, Toolbar in `ui/frame/toolbar/` with `fit.ts`, `bar`, Z157 placement, `add` glyph, Findings Pane) | DONE | pane-bar, toolbar-fit, projects, collection tests; `Pane.svelte:88-142`; `Toolbar.svelte:1-117` |
| 2 Control sizes and one focus ring | DONE | `ToolButton.svelte:226-262` (26 px, 22 px small, 20 px compact); `TextInput.svelte:83-94`; case 8 greps empty |
| 3 Type and row scale (seven steps, rice one step down, rows 22 px) | DONE | `tokens.css:121-129`; `themes.css:752-760`; `tests/views/whole/type-scale.test.ts` passes |
| 4 Icons at 16 px | DONE | `Glyph.svelte:58-67`; glyph.test passes |
| 5 Actions on hover or focus | DONE | `Card.svelte:106-131` `--card-reveal`; `CardActions.svelte:204`; 20 view files use the card-reveal or row-reveal rule |
| 6 Cards on the scale, one chip shape, links | DONE | `Chip.svelte:96-105`; `tokens.css:209-224`; chips.test, tinted.test pass |
| 7 Empty, error, narrow states, Intro | DONE | `Empty.svelte:48-89`; Hpc, Search, Source use `<Empty error>`; Linkedin nudge `Linkedin.svelte:272-274`; `Intro.svelte` plain paragraph |
| 8 Size limits | DONE | `sh utils/folder-check.sh` rc=0; `sh utils/size-check.sh` rc=0; largest touched components Terminal 514, TreeItem 539, Files 536, Diff 524, Editor 517, PaneView 449, ToolButton 538 (limit 540) |
| 9 DESIGN.md | DONE | "Theming" sentences, the tree indent, the Pane/Toolbar paragraph, the chips.test sentence, lines 374, 375, 392 corrected |
Checks output: `$ npm test` Test Files 382 passed | 20 skipped (402), Tests 6259 passed | 614 skipped; `$ npm run test:checks` Test Files 29 passed | 2 skipped (31), Tests 442 passed | 9 skipped; `$ npm run check` `COMPLETED 2881 FILES 0 ERRORS 0 WARNINGS`; `$ npm run build` built in 23.65s; `$ npm run format:check` "All matched files use Prettier code style!"; `$ npm run lint` no output; `$ ! LC_ALL=C grep -rna '[^ -~]' src tests` no output; `checks: 7 commands passed`; exit=0. `npm run diagrams` ran before it and regenerated layers, layer-ui, layer-shell, layer-views and the others.

FILES WITH LINE COUNTS (273 changed files per `git diff --stat`, plus untracked; areas: 151 under src/lib/views, 33 config/text/views, 27 src/lib/ui, 9 src/lib/shell, tests in views/ui/checks, DESIGN.md 418 lines, HELP.md 302, 7 files in docs/diagrams)
New: `ui/frame/toolbar/Toolbar.svelte` 265, `toolbar/fit.ts` 32, `toolbar/watch.ts`; `shell/panes/PaneBody.svelte`; `views/shared/accounts/AccountActions.svelte` 39; `views/shared/forms/AddButton.svelte`, `RegistryCard.svelte` 70, `ThemeFacets.svelte` 51; `views/sources/files/tree/Filters.svelte`; `views/structure/map/Legend.svelte`, `node-view.ts`; `views/sessions/terminal/bar/`, `terminal/grid/grid-find.svelte.ts`; tests `ui/frame/{toolbar-fit,pane-bar,empty}.test.ts`, `ui/controls/chip.test.ts`, `views/shared/{pane-parts,real-text}.ts`, `views/sources/files/{files-instance.ts,files-stored.test.ts}`. Removed: `ui/frame/Toolbar.svelte` (moved), `views/sources/data/Facets.svelte` and `views/sources/venues/Facets.svelte` (replaced by `ThemeFacets.svelte`). `Pane.svelte` 169, `Empty.svelte` 92, `Chip.svelte` 191, `Glyph.svelte` 78, `tokens.css` 224.

EVERY VIEW: what changed (all views got the same frame)
Header: icon actions only, 22 px, one line; bar under it for search, selects, segments, toggles, chips, text buttons, status words. Rows: 22 px, 13px words. Cards: Card radius 4px, title 13px weight 600, grids `minmax(min(320px, 100%), 1fr)`, actions revealed on hover or focus. States: Empty centred, boxed error with a small retry. Shared folds that changed several views at once: Pillars, Domains, Data, Venues use `RegistryHead` (the add form and its outcome line) and `ThemeFacets`; Domains and Pillars cards use `RegistryCard`; Inbox and Calendar use `AccountActions`; Dataset and Venue cards use `editAction`/`projectCount` from `card.ts`. Projects' bar: Search, filter Menu, type and quick toggles, both Segments; header: add (`add` glyph, `aria-pressed`) and icon actions. Collection: Search in the bar, add as a header icon. Files, Repositories, Terminal, Source, File, Present, Slides, Search, Leads, Linkedin, Radar, Hpc, History, Findings, Help follow the Z157 rule; the per-file list is in `git diff --stat`.

JUDGMENT CALLS
- Settings `.section-title` stays `fs-md` weight 600 (a mixed-case subheading, not an uppercase group heading).
- Several `.said` outcome lines stay `fs-sm` (Files, Follow, ShowPath, Hooks): secondary words.
- Venues' `.said` margin changed from 8px 0 to RegistryHead's `spaced` (6px 0 0).
- Software's code state stays a Tag (a chip would break the tag rule in `DESIGN.md:220`); collection-views.test asserts a tag and `not.toContain('class="chip')`.
- The chips rule (`tests/views/whole/chips.test.ts`) now covers a control chip (no tone) and `badge.tone`; `tests/ui/theme/wall.test.ts` SOLID map has new hover entries and the CardActions entry removed.
- The history view's `Empty` keeps the one wording `history.none`; a filtered-empty log still reads "No writes are recorded yet." (existing behaviour; fixing the wording would be a text change the brief does not name).
- `RegistryCard.svelte` sits in `views/shared/forms/` (10 items, the folder limit), because a view may import only `shared/` across folders (`boundaries.test.ts`).
- HELP.md has 7 sentences corrected (outside the brief's path list; each was false after the step): Projects filter in the bar, Files bar toggles, Repositories header first button, Leads bar toggle, Terminal header new terminal and Split, program control in the file and source headers.
- 9 stale entries removed from `tests/checks/tree/allow-duplication.txt` (clones folded into helpers); 34 negative assertions got reason comments (`negatives.test.ts` unchanged).
- Accents: the `Linköping` hit in `config/present.yml` untouched.

USER-VISIBLE CHANGES (before and after)
Header: before, mixed text buttons, selects and toggles in a wrapping header; after, a 22 px one-line header with 20 px icon actions, a `more` button for what does not fit, and the rest in a bar. Add actions: before words on a button; after the `add` icon with the words as the name. Chips and filter toggles: before pill shapes at several sizes; after 18 px minimum, 11px, radius 11px, pressable with `aria-pressed`. Links: before underlined at rest in places; after underlined only under the pointer or the focus. Focus ring: before 2px; after one 1px ring. Text: 7-step scale 11/12/13/14/16/20/26, body words 13px. Tree indent 8px. Card actions appear on hover or focus. Cards fit a 309 px pane. Empty states centred; errors in a red-bordered box with a retry. Intro boxes are plain paragraphs.

AUDITS FOR THE LOOK (cases 10-18; by reading, no test computes a style)
10 `Pane.svelte:90-100` header `height: calc(22px * var(--text-scale, 1))`, flex, one line; `:104-115` title `min-width: 3ch`, ellipsis; `Toolbar.svelte:60-77` clips controls and sets `data-clipped` + `inert`; `:123-131` the `more` button only while `shown !== null`; Popover (bits-ui) gives Escape and returns the focus to the trigger.
11 `Toolbar.svelte:73` clipped controls are `inert` (out of the tab order); `:93-107` `focusFirst` moves the focus to the first control of the popover on open; `:109-114` a press on a control closes it after the action. Ruling 6 applies: Tab reaches the `more` opener, opening it focuses the first clipped control's copy.
12 `ToolButton.svelte:226-247` text button 12px/16px line/4px 8px/1px border = 26 px, radius `--input-radius`; `.small` 11px/14px/3px 6px = 22 px; `:253-260` compact 20 px box (`--header-action`), `Glyph` 16 px; `TextInput.svelte:83-94` 13px, 16px line, 4px 6px, 1px border = 26 px, radius 4px.
13 `Glyph.svelte:58-67` `var(--glyph-size, calc(var(--icon-box) * var(--text-scale, 1)))`: 16 px at scale 1, 24 px at 1.5; rail sets `--rail-icon` (24 px), status bar `--status-icon` (14 px) (`tokens.css:108,116`).
14 `Card.svelte:106-131` `--card-reveal` 0 at rest, 1 on `:hover`, `:focus-within`, `[data-cursor]`, and under `@media (hover: none)`; each `.card` sets it itself, so a nested card answers for itself; `CardActions.svelte:204` `opacity: var(--card-reveal)`.
15 `Card.svelte:118` `overflow: hidden`, `:160` `min-width: 0`; `LeadCard.svelte:222` `overflow-wrap: anywhere`; `Leads.svelte:326` `min-width: 0`; grids `minmax(min(320px, 100%), 1fr)` in Collection, Projects, Venues, Data.
16 `Chip.svelte:96-105` min-height `calc(18px * scale)`, padding 3px 5px (ruling 4), radius `--radius-pill` (11px, `tokens.css:102`), `--fs-xs`; links `tokens.css:209-224` underline on `a:hover, a:focus-visible` only.
17 `Empty.svelte:48-49` padding `0 20px 1em`, centred; `:54-66` error box left aligned, red border; `:75-89` under `body.rice` a left-aligned `# ` line.
18 `Pane.svelte:97` and `ToolButton.svelte:304` scale with `--text-scale` (22 px x 1.5 = 33 px); `--tree-row` rows multiply by the scale; `Glyph` 24 px; `.title` ellipsis keeps the header to one line at 309 px; `themes.css:752-760` the rice scale one step down; `Chip.svelte:163` bracketed text tag, no pill and no fill under a terminal palette.

NINE TWO-AGENT FILES (each read whole)
1. `src/lib/themes/tokens.css` (224 lines): clean. The diff is the seven steps, `--radius-pill: 11px`, `--tree-indent: 8px`, `--header-action`, and the link rules; comments say seven steps.
2. `src/lib/ui/controls/Chip.svelte` (191): matches the brief and the cases ruling (padding 3px 5px); `aria-pressed` when `pressed`; no tone with `filled` stays outlined.
3. `src/lib/views/sources/search/Search.svelte`: clean; Pane asks for `tinted`; the error uses `Empty error` with the retry calling `runSearch`.
4. `src/lib/views/boards/project/Project.svelte`: two small CSS edits only.
5. `src/lib/views/sources/repositories/Repositories.svelte`: its header comment was inaccurate (said the toggle was in the bar); now says the header holds the toggle before its menu, under 100 columns.
6. `src/lib/views/system/help/Help.svelte` (100): only `.view :global(.doc ul.toc li)` added, which reaches the Markdown partial's HTML and not a primitive's class.
7. `tests/checks/.../negatives.test.ts`: identical to base (no diff); the 34 reason comments were added in the view tests it checks.
8. `tests/views/.../intro.test.ts`: audit case renamed; passes.
9. `tests/views/sources/source.test.ts`: updated for the Z157 structure (Save and Revert are header actions; the pressed-chip test reads the bar through `barOf`); passes.
Also checked: `git status --short src/lib/state src/routes src/lib/server src/lib/data` prints nothing; no `config/local.yml` was opened; no server was started or stopped.

## Repair round 1 (also appended to /Users/axelfaes/workspace/research-hub/.agents/worktrees/U3/tools/oculus/.scratch/migration/agents/reviews/U3-report.md, which did not exist in the worktree's ledger copy, so this section is its whole content)

NOT DONE
1. The failing-first runs for rulings 9, 10 and 12 are on the tree with the behaviour taken out of the source (edit, run, restore), not on the tree before the step: no git command is allowed here. Ruling 1's failing-first run is on the tree before the round's change (the function did not exist). Files edited and restored for the mutation runs: `src/lib/ui/controls/Chip.svelte`, `src/lib/ui/frame/Empty.svelte`, `src/lib/ui/frame/toolbar/fit.ts`, `src/lib/views/structure/domains/Domains.svelte`, `src/lib/views/sources/data/Data.svelte`, `src/lib/views/sources/venues/Venues.svelte`.
2. Ruling 2's grep prints nothing, but one of the thirteen matches is not a field: `src/lib/shell/rail/RailPages.svelte:265` is the rail badge's line, inside a fixed 16 px box (`height: 16px`). Scaling its line with the text would push the count out of its pill. It now reads a new token `--rail-badge-height: 16px` (`src/lib/themes/tokens.css:110`) for both its `height` (`RailPages.svelte:256`) and its `line-height` (`:265`), so it stays fixed. This adds one token the rulings do not name.
Everything else in the sixteen rulings is done. Full-list runs: 1.

Ruling 1, a clipped menu opener in the popover
- Changed: `src/lib/ui/frame/toolbar/fit.ts:34-47` adds `closesPopover(target: Pressable): boolean` (a button or link closes; one inside an `[aria-haspopup]` does not) and the type `Pressable = { closest(selector: string): Pressable | null }`, which a DOM `Element` satisfies (`npm run check`: 0 errors) and a plain object can implement, since the unit project has no DOM. `Toolbar.svelte:110-112` calls it; the header comment (`:6-14`) names it.
- Test: `tests/ui/frame/toolbar-fit.test.ts:71-106`, six cases over plain nodes (button, link, span in a button close; button with `aria-haspopup="menu"`, span inside it, span outside any control do not).
- Failing first (before the change): `npx vitest run tests/ui/frame/toolbar-fit.test.ts` gave `6 failed`, each `TypeError: closesPopover is not a function`. With `fit.ts` set back to the old rule (`return control !== null;`, restored): `Tests 2 failed | 11 passed (13)`, failing "stays open on a button that opens a menu" and "stays open on a span inside a button that opens a menu". Passing run: `Tests 13 passed (13)`. The mouse check on a clipped menu opener is the orchestrator's on TEST.

Ruling 2, field lines at every text size
- Changed to `line-height: calc(var(--button-line) * var(--text-scale, 1));`: `ui/forms/TextInput.svelte:93`, `ui/controls/text/Search.svelte:75`, `ui/forms/choice/Select.svelte:56`, `ui/forms/DateInput.svelte:58`, `ui/forms/TextArea.svelte:110`, `ui/forms/choice/GlyphSelect.svelte:91`, `ui/forms/choice/MultiSelect.svelte:184`, `ui/forms/Prompt.svelte:115`, `ui/display/Table.svelte:103` and `:146`, `ui/display/Ticker.svelte:371`. The rail badge is described in NOT DONE 2.
- `grep -rn "line-height: 16px" src` prints nothing. `type-scale.test.ts` does not pin line heights and needed no change.
- Test: none added (the ruling names none). Run: `npx vitest run tests/views/whole tests/ui` gave 46 files, 702 tests passed.

Ruling 3, the page body size
- `src/routes/+layout.svelte:34` is `font: var(--fs-md) / 1.5 var(--font-ui);` (the line moved from 33 to 34 with the comment above it, `:26-29`, which now names the body size). No test pins the body rule (`grep -rn "fs-xl) /" tests` prints nothing).

Ruling 4, behaviour changes the step made, each with before and after
- Error `Empty` carries `role="alert"`: before, Files' notes were `<p class="note" aria-live="polite">{view.note}</p>` and `<p class="note" aria-live="polite">{t('files.read_failed', saved.error)}</p>`; after, `<Empty error message={view.note} />` (`Files.svelte:412`) and `<Empty error message={t('files.read_failed', saved.error)} />` (`:455`), each `<p class="empty error" role="alert">`, announced assertively. A Files tab with several unreadable folders draws one alert box per failure.
- Leads declined toggle: before, a `ToolButton` whose visible words were "Show declined (n)" or "Hide declined (n)" with an `active` state; after, a pressable `Chip` whose visible name is `declined n` (`leads.yml: declined: declined {0}`) with `aria-pressed`, and those two phrases are its tooltip (`declinedToggleTip`, `Leads.svelte`).
- Changes: before, two Pin controls (its own and the session picker's); after, one, the picker's (`tests/views/sessions/sessions.test.ts:375` asserts exactly one in the Changes bar).
- Registry views (Domains, Pillars, Data, Venues): before, the Add control was drawn among the view's intro actions (the RegistryHead intro comment said so); after, a bare header icon on the `add` glyph named by `collection.add`, with `aria-pressed` for its open form (`AddButton.svelte`).

Ruling 5, DESIGN.md:410
- Now "the label at the `--fs-lg` step (14 px against VS Code's 13 px, since every size comes from the type scale)".

Ruling 6, the 20 px box
- `DESIGN.md:405` says the Repositories view sets 1 px and the box is 20 px from the compact control's `min-width` and `height` of `--header-action`, with no border. `Repositories.svelte:390-392` comment says the same. `tests/views/sources/repositories/change-rows.test.ts:150-151` comment says it is an audit of source text and gives the same account.

Ruling 7, DESIGN.md:220
- The capsule sentence lists a status word, the project type, a filter toggle and the badge of a view in the Views catalogue; says Chip draws the catalogue badge in the hue its registration names; and says a toggle is toned or untoned (the Joint-work and disclosure pills are untoned). It agrees with the `chips.test.ts` sentence later in the paragraph.

Ruling 8, HELP.md:122
- The `leads` row reads "The bar's toggle declined (n) shows the declined leads, and its tooltip reads Show declined (n) or Hide declined (n), counting the older `dismissed` ones with them". The tooltip words keep the (n), since that is what `leads.yml` holds. The other HELP.md edits (lines 101, 111, 112, 127 and 150, and the earlier "bar" wording of line 122) stay: each corrects a sentence a moved control made false (Projects filter in the bar, Files bar toggles, Repositories header first button, Leads bar toggle, Terminal header New and Split, program control in the file and source headers).

Ruling 9, the Chip
- `tests/ui/controls/chip.test.ts:30-52` adds "is drawn filled while it is pressed, without being asked to be filled", "is drawn outlined while it is not pressed" and "carries the tooltip it is given". The three earlier cases stay as preserved behaviour.
- Failing first (`Chip.svelte` edited and restored): `const solid = $derived(filled)` gave `1 failed | 5 passed`, failing the filled case; `<Tooltip text=''>` gave `1 failed | 5 passed`, failing the tooltip case. Passing run: `npx vitest run tests/ui/controls/chip.test.ts tests/ui/frame/empty.test.ts` gave 11 passed. The three earlier cases passed in both mutation runs, as preserved behaviour.

Ruling 10, the Empty primitive
- `tests/ui/frame/empty.test.ts:51-58` asserts, in the error case, the `error` class and `role="alert"` on the one `<p>`; `:60-65` asserts, in the plain case, no `role="alert"` and no `error` class. Tests 1, 3 and 4 of the earlier file stay as preserved behaviour.
- Failing first (`Empty.svelte` edited and restored): dropping `class:error` and the role gave `1 failed | 4 passed` (the error case); `role='alert'` always gave `1 failed | 4 passed` (the plain case). Passing run as above.

Ruling 11, the search state
- `tests/state/sources/search.test.ts:136-153` is unchanged. `src/lib/state/sources/search.svelte.ts` is unchanged by the step (`git status --short src/lib/state src/routes src/lib/server src/lib/data` earlier printed nothing for it), so both cases hold on the tree before the step. Run: `npx vitest run tests/views tests/ui tests/checks tests/state/sources/search.test.ts tests/shell` passed this file; the one failure in that run was the comment-width check on a Toolbar comment, fixed, and the full list below ran after it.

Ruling 12, the three empty states
- `tests/views/structure/domains.test.ts:84`, `tests/views/sources/data.test.ts:349-351` and `tests/views/sources/venues.test.ts:593` each require `<span class="message...">`, which only `Empty` draws.
- Failing first (each view edited back to a plain `<p class="empty">` and restored): Domains `1 failed | 7 passed` ("draws the catalogued empty state when no domain has a member"); Data `1 failed | 13 passed` ("draws the dataset empty message when the file has no entries"); Venues `1 failed | 26 passed` ("draws the catalogued empty state"). Passing run: `npx vitest run tests/views/structure/domains.test.ts tests/views/sources/data.test.ts tests/views/sources/venues.test.ts` gave 49 passed.

Ruling 13, the css:N references
- All 17 lose the reference and keep the measure and the VS Code part in words: `Empty.svelte:7,8`, `Pane.svelte:7,54,88,102,128`, `toolbar/Toolbar.svelte:179`, `ToolButton.svelte:48,225,242,250`, `Chip.svelte:5`, `MenuOpener.svelte:99`, `Glyph.svelte:51`, `tokens.css:152,210,211`. `grep -rn "css:[0-9]" src` prints nothing.

Ruling 14, history in test text
- `tests/views/sources/data.test.ts:239,242,244` (title "keeps the add control out of the body, which holds the search box alone"; comments "the add control is a header action, so the body does not hold it" and "the body draws no row of controls, since the bar holds the search box"), `note.test.ts:138` ("the header holds only the status words, so it draws no toolbar") and `file.test.ts:169` ("the bar holds only the failure words, so it draws no strip of controls").

Ruling 15, one `between`
- `editor.test.ts:29`, `projects.test.ts:42`, `sources/data.test.ts:27`, `document.test.ts:16`, `file.test.ts:20`, `search.test.ts:22` and `files/files.test.ts:26` import `between` from `tests/views/shared/pane-parts.ts`. `grep -rn "function between" tests` prints only `tests/views/shared/pane-parts.ts:8`.

Ruling 16
- No change. `docs/diagrams/` was regenerated by `npm run diagrams` in the verify run and left in the worktree.

Verify (one full run; `npm run diagrams`, then `checks.sh`; exit 0)
```
$ npm test
 Test Files  382 passed | 20 skipped (402)
      Tests  6269 passed | 614 skipped (6883)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  442 passed | 9 skipped (451)
$ npm run check
COMPLETED 2881 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```
Also: `sh utils/folder-check.sh` exit 0; `sh utils/size-check.sh` exit 0; the case-8 greps print nothing. Number of full-list runs: 1.
