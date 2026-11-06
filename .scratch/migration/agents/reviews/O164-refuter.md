# Step O164 refuter report (on .agents/worktrees/migration-O164, base 75bf4dd10)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
$ npm run test:quick -- --base 75bf4dd10        (from the worktree root)
ok      prettier (1.3 s): All matched files use Prettier code style!
ok      ASCII gate (1.4 s)
ok      svelte-kit sync (3.2 s)
ok      eslint (5.2 s)
ok      svelte-check (25.9 s): 1793996565644 COMPLETED 584 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (76.1 s): Duration  45.67s (transform 77.29s, setup 0ms, import 152.89s, tests 6.30s, environment 966ms)
ok      vitest checks (129.7 s): Duration  98.86s (transform 48.53s, setup 0ms, import 89.30s, tests 222.75s, environment 4ms)
ok      vitest slow (146.8 s): Duration  116.29s (transform 50.50s, setup 0ms, import 71.57s, tests 106.27s, environment 1ms)
test:quick: 150.4 s; every command passed

$ grep -rl -e 'CardLinks' -e 'CardFacts' -e 'CardDetails' -e 'ProjectCard' -e 'card/card' -e 'page-entry' -e 'focus/rows' -e 'Band.svelte' -e 'focus/Focus' -e 'CommandCenter' -e 'LaneCard' -e 'lanes/Lanes' tests | sort
tests/checks/source/keys.test.ts
tests/checks/tree/boundaries.test.ts
tests/checks/tree/layer-rows.ts            (a helper, not a test file)
tests/data/helpers/hub-names.test.ts
tests/data/hubs/hub-portfolio.test.ts
tests/data/sources/career.test.ts
tests/data/sources/collections.test.ts
tests/state/client/created-ids.test.ts
tests/state/forms/entry-save.test.ts
tests/state/forms/form-draft.test.ts
tests/state/forms/page-entry.test.ts
$ npx vitest run tests/checks/tree/size.test.ts tests/checks/tree/boundaries.test.ts <the ten test files above> --testTimeout 0 --hookTimeout 0 --reporter=dot
 Test Files  11 passed (11)
      Tests  197 passed (197)

$ LC_ALL=C perl -ne '... print "$ARGV:$.:$_" if $l =~ /[^\x20-\x7E\n]/ ...' <the 12 changed src files> .scratch/migration/agents/reviews/O164-report.md
(nothing)  ascii exit 0

$ wc -l <the changed files>
496 page-entry.ts | 308 Band.svelte | 282 CommandCenter.svelte | 471 Focus.svelte | 360 LaneCard.svelte | 380 Lanes.svelte | 455 rows.ts | 255 card.ts | 193 CardDetails.svelte | 179 CardFacts.svelte | 320 CardLinks.svelte | 459 ProjectCard.svelte   (every count equals the report's file table; all under 880 / 520)

$ diff -rq ../O164-base/src src      -> the 12 files above differ, nothing else
$ diff -rq ../O164-base/tests tests ; diff -rq ../O164-base/config config -x local.yml ; diff -rq ../O164-base/utils utils
(nothing)

$ sh utils/unused-exports.sh > <scratchpad>/O164-unused.txt ; diff ../O164-base/unused-exports.txt <scratchpad>/O164-unused.txt
diff exit 0 ; 334 lines in the base list

$ git diff 75bf4dd10 -U0 -- src | grep '^+' | grep -v '^+++' | grep -n -i -E "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|O16[0-9]|20[0-9]{2}-[0-9]{2}"
224:+    // stop, so a card gains no stops before its controls for them; a reader of the page reads each
   (judged: "before" is the order of tab stops on the page, the same phrase the base comment had; no history)

$ grep -rn -w -e entryPage -e venuePage -e pageLookup -e linkView -e entryOpener -e venueOpener src tests docs/*.md README.md
   (verify 7's `git grep` form is not run: it is outside the three git commands a reviewer may run; this grep is its equivalent)
   definitions: page-entry.ts:183 pageLookup, :199 entryPage, :216 venuePage; head comment :24, doc :162
   card.ts:20 import, :101 entryOpener, :116 venueOpener, :108 :120 calls, :96 :113 doc comments
   CardFacts.svelte:17,38,131; CardLinks.svelte:22,36,49,187,188; ProjectCard.svelte:9,50,348
   CommandCenter.svelte:40,251; rows.ts:32-34 (import), :359,:361,:379 (calls); Focus.svelte:65,218; Band.svelte:9,44,103; Lanes.svelte:17,61,246
   EntryFields.svelte:94,210,217: a local $derived named venuePage, a different lookup, untouched
   linkView: no hit
$ grep -rn 'goto(' src tests
(nothing)  exit 1

Quoted by the report, rerun:
$ git diff 75bf4dd10 -- docs/diagrams/*.dot, edge and node sets of channels.dot against `git show 75bf4dd10:docs/diagrams/channels.dot`
> "ch portfolio" -> "state/forms/page-entry"      (the one edge added)
> "state/forms/page-entry"                        (the one node added)
layers.dot / layer-views.dot: only the import-count labels change (77->78, 147->150, 488->490, 258->259, 1566->1571, 1102->1103)
$ git status --short     -> the 18 modified paths of the diff stat and the untracked report, nothing else
$ test -d docs/adr       -> ls: docs/adr: No such file or directory
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `entryPage`, `venuePage`, `pageLookup`, `EntryPage`, `PageLookup` are defined in `src/lib/state/forms/page-entry.ts:160-221` and nowhere else (grep above); `Band.svelte:44`, `Focus.svelte:65`, `CommandCenter.svelte:40` import from `$lib/state/forms/page-entry`; `rows.ts:31-37` imports them for its own `linePage`/`openLine` and exports none of them; `Band.svelte:9` names `state/forms/page-entry.ts`. The structural `LookupSource` type (`page-entry.ts:166-172`) stands in for `ClientState` because `tests/checks/imports/order.test.ts` refuses `state/forms` importing `state/client`; it is one copy of the lookup, not a second one.
- 2: holds. `card.ts:101-109` `entryOpener` takes the hub from `addressOfId(id)` of the tag's own id, asks `registryKey(registry, hub)`, and calls `entryPage(key, hub, id, collectionsOfKey)`; `opener` (`card.ts:89-91`) opens `page.view, page.state` with `layout.openView` in the current pane. `CardLinks.svelte:115-135,188` passes `funding`, `pillars`, `datasets`; `ProjectCard.svelte:347-363` passes `domains`. A Funding tag no longer reaches a collection view (`linkView`/`goto` are gone).
- 3: holds. `CardLinks.svelte:187` sends the venue to `venueOpener`; the `{:else if marked(kind)}` branch (`:215-237`) draws the tier glyph as its own `Tag` (glyph, `glyphTone`, `glyphTip`, so `Tag.svelte:65-71`'s `tabindex="0" role="img"` stop) outside the `ToolButton`, and the button holds a glyph-less `Tag` with `wrap={kind.wrap === true}`. A venue whose tier has no tip takes the `{:else}` branch, whose glyph carries no tabindex (`Tag.svelte:72-75`), so no focusable element sits inside a button in either branch.
- 4: holds. `CardFacts.svelte:130-150`: a found resource is `<span class="press"><ToolButton plain label title={t('project.card.compute_tip', resource.label)} onclick>` with no outer `Tooltip`; `.press` (`:161-172`) is the folder's old box, the monospace face moved to `.folder` alone (`:176-178`); the head comment `:16-25` names the presses.
- 5: holds. `CardDetails.svelte:44-48` `openShown` opens `pageView(entry.collection, entry.id, entry.title)` with `openView`; `entry.id` is the internal id and `entry.collection` the collection key (`state/boards/board/stats.ts:112`).
- 6: holds. `LaneCard.svelte:179,211-216` draws the venue as `ToolButton plain cut` with `title={one.tip}` (the same `project.card.venue_tip` words) inside `.press.cut` (max-width 14em kept); the press comes from `Lanes.svelte:244-246`, `venueOpener(client, project.venueId)`. `Lanes.svelte` is outside the brief's path list; judged under Spec below as no finding.
- 7: holds. `opener` returns null for a null page; each caller draws its unchanged no-press form on null: `CardLinks.svelte:206-214`, `CardFacts.svelte:132-136`, `ProjectCard.svelte:349-350`, `LaneCard.svelte:217-229`.
- 8: holds. `linkView` and `goto` and their doc comments are gone from `card.ts` (diff hunks at `:80-93` and `:114-124` of the base); `grep -rn 'goto(' src tests` prints nothing; the unused-exports list is unchanged (diff exit 0).
- 9: holds. The head comments of `CardLinks.svelte:21-42`, `CardFacts.svelte:16-25`, `CardDetails.svelte:9-11`, `LaneCard.svelte:16-20` and `ProjectCard.svelte:8-11` say what each press does, with no history (grep above). `docs/HELP.md` is unchanged (`git status --short` lists no docs file but the diagrams). Read against `docs/HELP.md:297,299,306`, I agree with the report that no sentence becomes false (none says a tag has no press or that Funding opens the collection; "the icon takes a tab stop of its own" stays true) and that the four sentences it names are made incomplete.
- 10: holds. `diff -rq` lists no file under `views/structure/map`.

Cases of the brief's "Cases":

- C1: met by reading: Funding goes through `entryOpener(client, 'funding', tag.id)` to `pageView(key, entry.id, entry.title || entry.id, home.registry)`, the `entry` view named by the scheme's title. The tab seen on screen is the look's.
- C2: met by reading, `registry: 'pillars'` (`CardLinks.svelte:127`).
- C3: met by reading, `registry: 'datasets'` (`CardLinks.svelte:134`), resolved to the `data` collection by `registryKey`.
- C4: met by reading (item 3): press on the words, glyph outside with its tone, tip and own stop, one stop per control. The 4px glyph-to-words gap and the wrapping inside the nested boxes are the look's.
- C5: met by reading: every resource kind takes the same `entryOpener(client, 'resources', ...)`; one tip, the button's own.
- C6: met by reading (item 7).
- C7: met by reading: `card.ts:106` `const { hub } = addressOfId(id)` feeds both `registryKey` and `entryPage`; `venuePage` reads the hub from `rootOf(venue)`.
- C8: met by reading (`ProjectCard.svelte:347-363`).
- C9: met by reading (item 5).
- C10: met by reading: the same tip words, and the same placement, since `Tooltip.svelte:77` defaults to `below` as `ToolButton.svelte:64` passes, which settles the placement the report lists as not verified.
- C11: met by reading: the Waiting, Related and Team branches of `press` (`CardLinks.svelte:176-186`) are unchanged; the pressed branch's new `wrap`/`glyphTone` props are `false`/`undefined` for those kinds, so their markup is unchanged.
- C12: met by reading: every new press is a `ToolButton` (a native button), so Tab reaches it and Enter fires its `onclick`. Seen behaviour is the look's.
- C13: met by reading: the board, the Project tab and `ProjectCards.svelte` draw the one `ProjectCard.svelte`.
- C14: met by reading: tags after "more" go through the same `{#each drawn}` and `press` (`CardLinks.svelte:201-256`).

## 1. Spec

none.

The write list: `src/lib/views/boards/focus/lanes/Lanes.svelte` is outside the brief's paths. It is not a finding: item 6 asks for the press, `LaneCard.svelte:4-6` says the card "reads no store ... every press is handed back", and `Lanes.svelte` is its only caller (`grep -rln LaneCard src` prints only `Lanes.svelte`), so the press has to be made there or the card's design broken. The change is a prop and a head-comment sentence, adds no requirement and no case, and the report names the path with its reason (judgment call 1), as the rules file's "Where you work" asks.

## 2. Proof

none.

## 3. Standards

- `src/lib/views/shared/card/project/ProjectCard.svelte:444-458` and `src/lib/views/boards/focus/lanes/LaneCard.svelte:322-334`: "`.crosslink { display: inline-flex; align-items: center; min-width: 0; max-width: 100%; border: 1px solid transparent; border-radius: var(--radius-sm); text-align: left; } .crosslink:hover { background: var(--chip); }`" and "`.press { display: inline-flex; align-items: center; min-width: 0; border: 1px solid transparent; border-radius: var(--radius-sm); } .press:hover { background: var(--chip); }`", each with its own `<span class=...><ToolButton plain ...><Tag .../></ToolButton></span>` markup. What is wrong: the step adds two more copies of the press box, making five (`CardLinks.svelte:297-309`, `CardDetails.svelte:180-192`, `CardFacts.svelte:161-172` on the base already), against the rules file's "The principles every package is judged on" (DRY; "a parser, a fold or a rule exists once and is reused") and the brief's Conventions ("a function written once and reused"). The report's reason for not making one shared part (judgment call 7, "a new file the brief does not name") does not hold: the rules file's "Where you work" lets a needed path outside the write list be named in the report, as the builder did for `Lanes.svelte`; `src/lib/views/shared/card/project/` holds 7 items, so one component there (the box, the plain `ToolButton`, the `Tag`) stays inside the ten-item rule and is importable from `views/boards/focus/lanes` (`views/shared/**` is allowed by `tests/checks/tree/boundaries.test.ts`). Failure scenario: the copies already differ (LaneCard's `.press` has no `max-width: 100%` and no `text-align: left`, CardFacts' `.press` no `text-align: left`); the next change to the press look (the hover fill, a focus ring, a terminal-theme rule) is made in one file and the other four keep the old look, so a card on one screen draws its domain, compute and link presses two ways.

## 4. Behaviour

none. Every visible change is in the report's before-and-after section, the terminal-palette bracket change on the venue line included (under "Limitations").

## Declined to judge

- What only the look settles, at landing on the scratch server: the page tab named by each entry's title (C1 to C3, C5, C8 to C10); the Tab order and focus rings of the new stops, the compute facts adding stops ahead of the card's other controls included (C4, C5, C12); the venue line's spacing between the tier glyph and the pressed words and whether its words still wrap through the nested `.marked > .crosslink > Tooltip > button > .label > Tag` boxes (C4); the lane card venue's ellipsis inside the cut button (C10); and whether a press on the Project tab's own card opens beside or replaces the project tab (C13).
- The terminal palette with brackets on: by reading `text.ts:116-120` and `Tag.svelte:126-134`, the venue's words, now a glyph-less `Tag`, get their own `[`...`]` while the glyph tag keeps its bracketed stand-in, so the venue line reads differently from the Funding and Pillar lines there. The report states it; whether that look is acceptable is for the look and Axel.
- Booking the widening of the path list to `Lanes.svelte` in `choices.md` is the orchestrator's, under the standing demand on internal widenings.
- Whether the committed diagrams match the source: `npm run diagrams` writes files, so I did not run it; the node and edge sets the report names reproduce against the base. The landing's verify list runs it.
- Verify 7 in its `git grep` form: not run, since it is outside the three git commands a reviewer may run; the `grep -rn -w` form above covers the same names over `src`, `tests` and `docs`.
- The builder's runs outside the list (`npx svelte-check` twice, `npx eslint`, `npx prettier --write` over changed files): not rerun separately; the rerun list covers all three and is green.

Reviewer usage: a30a3f28ea4eb8488, claude-opus-5-5, 241783 tokens, 54 tool uses, 12.4 min.
