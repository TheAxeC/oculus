# Step O88 refuter report (on ~/workspace/oculus/.agents/worktrees/migration-O88, base 85a826ca6)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

`ls -d docs/adr` prints "No such file or directory" (exit 1), both in the main checkout and in the worktree, and `grep adr .agents/plan.yaml` exits 1. No ADR folder exists.

## Verification (rerun by the reviewer)

```
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams && npm run docs:palette && npm run test:quick -- --base 85a826ca6     (run once; log in the scratchpad, verify.log)
> node utils/diagrams/diagrams.mjs          -> the 18 docs/diagrams files listed; git status shows the same diagram files the builder committed, no new change
> node utils/diagrams/palette.mjs           -> docs/palette.md (unchanged)
test:quick: 147 changed file(s), from git since 85a826ca6
test:quick: 241 test file(s)
ok      ASCII gate (0.9 s)
ok      prettier (1.8 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.1 s)
ok      eslint (77.6 s)
ok      svelte-check (111.1 s): 1793069519877 COMPLETED 550 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
FAILED  vitest checks (172.2 s)
 FAIL  |unit| tests/checks/source/html-sites.test.ts > every {@html} site > is one of the sites this file knows about
AssertionError: expected 33 to be greater than or equal to 34
 Test Files  1 failed | 14 passed (15)
      Tests  1 failed | 251 passed | 9 skipped (261)
ok      vitest (202.0 s)
ok      vitest slow (232.8 s)
test:quick: 235.2 s; failed: vitest checks

$ npx vitest run tests/checks/source/html-sites.test.ts     (the red file, rerun alone)
Tests  1 failed | 18 passed (19)     (the same assertion, :242:32)

The builder's final run had 17 vitest and 21 slow time-outs in unchanged files. They do not reproduce: both tiers above are green.

$ npx vitest run --config <scratchpad>/caserun/o88.config.mts --silent false --reporter verbose     (the builder's case run for cases 7, 18 and 19)
Test Files  1 passed (1) / Tests  3 passed (3). Every printed line is identical to the report's, among them:
case 7 instanceFolded {"folded":["gone","a","a",""]} -> ["gone","a",""]
case 7 stateFolds from ["a"]: toggle b, toggle a, open x, open none, open b -> writes ["[\"a\",\"b\"]","[\"b\"]","[]"]
case 19 lineKinds shipped: [...pillar ["p"], provisional ["v"], offpillar ["o"], {"key":"",...,"lines":["n","x"]}]
case 18 schema check: [{"file":"/hub/demo.yml","key":"intro","message":"findings.schema.not_declared intro","line":2}]
case 18 collection intro: undefined

$ node <scratchpad>/caserun/case21.mts <worktree> pillar_kinds      (identical to the report)
"pillar_kinds: [ { key: '', label: Empty }, { key: b, label: B } ]"  findings: [... pillar_kinds.0.key is not a value this key takes]
"pillar_kinds: [ { key: a, label: One }, { key: a, label: Two } ]"   findings: []
$ node <scratchpad>/caserun/case21.mts <worktree> venue_categories  -> the same two results, so the shape matches R3

$ npx vitest run tests/data/sources/config/layers/hub-vocab.test.ts -t "pillar kinds" --reporter=verbose
<check mark> |unit| ... > the vocabulary a hub lays over oculus's > replaces oculus's pillar kinds whole 174ms
Tests  1 passed | 16 skipped (17)
$ grep -rn --exclude=local.yml pillar_kinds config src     (on the base copy) -> prints nothing. On the base a hub's pillar_kinds is therefore an unknown key, which fits the red quoted for the unchanged tree.

$ grep -rho "{@html" <tree>/src/lib --include='*.svelte' | wc -l   -> 40 on the base copy, 34 on the worktree. The only differences are RadarIntro.svelte (4) and Pillars.svelte (2).
The scanner (svelte parse, counting HtmlTag nodes)                  -> 39 on the base, 33 on the worktree. The grep counts one more because Transcript.svelte:22 is a comment hit.

$ sh utils/unused-exports.sh ; diff against the base's unused-exports.txt  -> diff exit 0 (identical)
$ grep -P '[^\x00-\x7F]' over the changed files / grep '[^ -~]' over the added lines of docs/templates.md -> nothing printed (exit 1)
The history grep of the changed comments -> exit 1, nothing printed

Line counts: every changed file is within its limit. The largest component is Settings.svelte at 516 lines; Diff.svelte and TerminalGrid.svelte are at 520, as at the base. The largest source file is vocab.ts at 522, under 880.

Greps 7, 8, 9 and 10 of the report print the lists the report gives.

The report's stale-name grep (the one under "The grep after the renames") prints the same three lines: options.ts:389 and html-sites.test.ts:259, :265.

ls | wc -l on the base copy's ui folders -> 10 for ui, tabs, tree, forms, controls, menu, frame and display, and 5 for theme. This confirms the reason R1 gives for moving Confirm and CloseQuestion into ui/controls/confirm/.
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `src/lib/ui/controls/heads/GroupHead.svelte` was read whole. It draws a `section`, a sticky `h3.strip` (`position: sticky; top: 0; z-index: 2`, `margin: 0 0 8px`, `--input-radius`, `--panel`), the `--panel-on-wall` layer with the blur, and the free-float fill. The body uses `hidden={open ? false : 'until-found'}` with `onbeforematch`, and the label carries the ellipsis. It sits under R1's folder.
- 2: holds in substance, but in a different file from the one named (Spec 1). One reader and one toggle exist in `state/shared/page/folds.ts`. Every view uses them, and six views repeat the toggle around them (Standards 1).
- 3: holds. Radar, Venues, Pillars, LinkedIn and Inbox unfold the revealed card's group through `folds.open` before the scroll. Settings opens a group through `List`'s `unfold`. `revealState` still opens Expired and Dismissed, and its comment is rewritten. The card cursor uses `checkVisibility()`. No search write touches `folded`. The report's account of this item over-names (Proof 1).
- 4: holds. The diffs of the item 4 views, and grep 7, show no frame around `GroupHead`.
- 5: holds. `ui/controls/heads/SubHead.svelte` is drawn in List, Gallery and Catalogue, at the path R1 puts it; Catalogue reaches into its tag (Standards 3).
- 6: holds by reading every view diff named. What it draws is the look on landing.
- 7: holds. FoldHead and FoldControl differ from the base only on line 2 of their head comments. `git diff --stat` over CrossLinks, History, LiteratureCard and FocusFilter shows no change.
- 8: holds. `appearance.svelte.ts` declares `unloaded` with `$state.raw`.
- 9: holds. `git diff 85a826ca6 --stat` over Section.svelte, Notes.svelte, Changes.svelte and AppSourceGroup.svelte prints nothing. The LaTeX change is the project page's block (item 6), not the panel.
- 10: holds. `views/shared/card/record/CardGrid.svelte` was read whole. Grep 9 shows no other card-list grid.
- 11: holds. The diff removes `intro:` from the schema, normalise, the model, RegistryHead, Collection, the audit and templates.md, from the six fixture files, and from the view intros and their keys, and it deletes RadarIntro. The counts sit at the bar's end. A consequence of this item turns a committed check red (Spec 2).
- 12: holds. `pillar_kinds` has three rows, each with a palette colour, and is registered as `venue_categories` is. `lineKinds` is at `lines.ts:258-270`. Templates are done. Cases 19-21 hold.
- 13: holds. `leads.expired_sec: Expired / actioned` is at `config/text/views/feeds/leads.yml:25`. The stale-name grep finds none of the removed keys outside the G5 sample strings.
- 14: holds as far as a read settles it. The "Doc text" section covers the Focus, Venues, Lit Watch, Leads, Inbox, LinkedIn, Audit, Slides, Pillars, Data, Domains, Map, Settings, Views catalogue, Keys and Person lines, and `data-map.md:80` with its list. The "Hub text" section gives the 11 files and the `kind` schema line. Its wording is declined below.

Cases of the brief's "Cases":

- 1. Projects strip, no wallpaper: not verifiable here; the look on landing settles it. By reading, `GroupHead.svelte` has the 8 px, `--panel` and `--input-radius`, and `Projects.svelte:421-431` puts nothing around it.
- 2. Over a wallpaper: not verifiable here; look on landing. By reading, `body.wall .strip` gives `--panel-on-wall` and the blur.
- 3. Tinted views and a free float: not verifiable here; look on landing.
- 4. Sticky headings: not verifiable here; look on landing.
- 5. Headings side by side: not verifiable here; look on landing.
- 6. Fold and reload: met by reading for the writes. Radar, Inbox and LinkedIn go through `stateFolds`; the Audit and Slides writes keep `folded`; Settings goes through `usePaneFold`. The reload itself is the look on landing.
- 7. The reader of `folded`: met; the case run was reproduced (above).
- 8. Search with a bucket folded: met by reading. No search write touches `folded`, and `Bucket.svelte` counts the searched entries.
- 9. Reveal into a folded group: met by reading for Lit Watch, Leads and Settings; look on landing.
- 10. Find-in-page: met by reading `GroupHead`'s `onbeforematch`; look on landing on Venues.
- 11. A deck dropped on a folded Slides group: met by reading, since the drop attributes go to `GroupHead`'s `section` through its rest attributes; look on landing.
- 12. Dismissed, Expired, run log, Triaged, Muted: met by reading; look on landing.
- 13. Career, Command center, Tasks: met under R1. The three files change by their import line only, plus CareerPanel's rewrapped comment, and FoldHead's text differs only in its head comment.
- 14. Long label: met by reading `.name` (overflow, nowrap, ellipsis); look on landing.
- 15. Keyboard: met by reading FoldControl, which is unchanged apart from its comment; look on landing.
- 16. Card grids: met by reading CardGrid and grep 9; look on landing.
- 17. Intros and bar counts: met by reading; look on landing.
- 18. A hub file holding `intro:`: met as R2 rules it; the case run was reproduced.
- 19. `lineKinds`: met; the case run was reproduced.
- 20. G126 row: met. It is green on the worktree (rerun above). The red on the unchanged tree is quoted in the report and fits the base having no `pillar_kinds`.
- 21. Empty key and duplicate key: met as far as the step goes. The empty key is refused exactly as for `venue_categories` (rerun). The duplicate gives no finding, which R3 assigns to O87's merge at landing.
- 22. The theme: met by reading `$state.raw`; look on landing (the console).

## 1. Spec

- `src/lib/state/shared/page/folds.ts:18-51`: `export function instanceFolded(...)`, `export function foldedWith(...)`, `export function stateFolds(...)`.
  - What is wrong: item 2 names `src/lib/state/workbench/layout/instance.ts` for the two helpers; they are in a new file in `state/shared/page/`. The cause is real: G17's state order (`tests/checks/imports/order.ts`) lets the parsers in `state/feeds`, `state/life` and `state/boards` import `state/shared` and not `state/workbench`.
  - The rules file, "Read first, before changing anything", item 1, asks the builder to stop and report a disagreement between the brief and the code's rules. The builder placed the file without a ruling, though it was ruling the hand-back on three other places. The report gives the reason under "Files written outside", not under "What in the brief was wrong or impossible".
  - Failure scenario: a reader of the brief, or a later step, looks for the fold helpers in `instance.ts` and does not find them. The orchestrator has to accept a placement the plan did not rule.
  - Verdict: item 2 holds in substance. The placement is the orchestrator's to accept.
- `tests/checks/source/html-sites.test.ts:237-242`: "it('is one of the sites this file knows about', ... expect(counted.length).toBeGreaterThanOrEqual(34);".
  - What is wrong: the step turns this committed check red, `expected 33 to be greater than or equal to 34`. The facts:
    - The builder's three counts reproduce: grep gives 40 at the base and 34 now, and the scanner gives 33 now.
    - The report leaves out the scanner's count at the base, which is 39. The floor of 34 therefore had 5 to spare at the base.
    - The 6 sites removed are RadarIntro.svelte (4) and Pillars.svelte (2), both taken out by item 11's intro removal.
    - The grep counts one more than the scanner because Transcript.svelte:22 is a comment.
  - What the floor guards: it is a non-vacuity floor on `htmlSites`. If the parse or the walk broke and found no sites, the first test ("draws the sanitiser, inline Markdown, the catalog, or a named exception", `expect(unfilteredSites(LIB)).toEqual([])`) would still pass on an empty list, and this floor would turn red. A sibling floor, `trusted.length >= 3`, still passes. The 33 sites now found all pass the first test.
  - Lowering the floor is a threshold change in a committed check, which the rules file ("What every package obeys", and the working rules) treats as loosening. The builder left the line unchanged and reported it. This is the user's call; I do not decide it.
  - Failure scenario: the verification list stays red at landing until the user rules on the floor.
  - Verdict: the verification command is red. No item is violated by the builder's handling.
- `src/lib/views/shared/card/pane-fold.ts:25`, `src/lib/views/shared/card/feed/FeedFile.svelte`, `src/lib/ui/controls/confirm/`, `src/lib/views/system/status/Status.svelte:88`: paths outside the brief's list.
  - What is wrong:
    - `pane-fold.ts` is not "beside the heading components" as R1's approved list says. The ui layer may not import `state/client` (the ui row of the boundaries check), so it could not sit there. The report states this.
    - FeedFile (for the duplication check) and the move of the two dialogs (for R1 and the 10-item folder limit) are named with their reasons.
    - `Status.svelte` (a `div.groups` wrapper and its style) is outside both the paths and the approved list, and the report says so.
  - Failure scenario: none in behaviour. The orchestrator accepts four placements at landing that no ruling named.
  - Verdict: none.

## 2. Proof

- `.scratch/migration/agents/reviews/O88-report.md`, "The run after the change", case 9: "the Inbox, Projects and the collections take the revealed card's group out of `folded` before the scroll".
  - What is wrong:
    - Projects takes no reveal at all: `grep -n 'reveal' src/lib/views/boards/projects/*.svelte` prints nothing, and `Projects.svelte` reads `folded` only at :194 and :250.
    - The collections draw no folded groups: `Collection.svelte` has a `Reveal` at :440 but no `GroupHead` or `folded`.
    - The palette reveals only collections and the leads, radar and linkedin feeds (`state/workbench/palette.ts:220-235`).
    - The report contradicts itself: "Judgment calls the brief left open" lists Projects among the views that keep their own `toggleFold` and have no reveal-unfold.
    - The Inbox part of the claim holds (`Inbox.svelte:132-140`).
  - No decision rests on the wrong part, since no path reveals into a folded Projects section.
  - Failure scenario: a reader trusts the report and believes the Projects board unfolds a revealed card's section. A later step that adds a reveal to Projects then assumes the unfold already exists.
  - Verdict: item 3 holds; the report's case 9 row overstates.

## 3. Standards

- `src/lib/views/system/gallery/Gallery.svelte:89-95`:

  ```
  const folded = $derived(instanceFolded(instanceState(instance.id)));
  function toggleFold(key: string): void {
      const next = foldedWith(folded, key, !folded.includes(key));
      setInstanceState(instance.id, withInstanceKey(instanceState(instance.id), 'folded', next));
  }
  ```

  - The same code is written again in `AccountSetup.svelte:52-57`, `Catalogue.svelte:114-119`, `Usage.svelte:77-82`, `Keys.svelte:67-72` and `Project.svelte:115-120`. Audit (:95, :146), Projects (:250) and Slides (:136) each carry a variant.
  - What is wrong: `usePaneFold()` (`views/shared/card/pane-fold.ts:25-47`) already does exactly this read-and-toggle for any component under a pane, and twelve other components use it.
  - The rules file, "The principles every package is judged on", says "a parser, a fold or a rule exists once and is reused". The report states this as a judgment call ("each a few lines the duplication check does not flag"), but a token-count check passing is not the standard.
  - Failure scenario: a later change to how a pane keeps its folds (for example a cap, a rename of the key, or dropping keys of removed groups) is made in `usePaneFold` and `stateFolds`. The six hand-written copies keep the old behaviour, so those views fold differently from the rest.
  - Verdict: item 2 ("every view below uses them") holds in letter. This is a standards finding.
- `src/lib/data/model/model-entities.ts:161-162`, `src/lib/ui/html.ts:458-459`, `tests/data/sources/collections.test.ts:57-58` and `:97-98`, `src/lib/views/system/gallery/Gallery.svelte:32-35`: comments the step edited but did not rewrap.
  - The short lines:
    - model-entities.ts: " * collection files carry). Of the five files carried as both entities and collections," is 87 columns, and "data" from the next line fits after it.
    - html.ts: " * paragraph and a link or two in the hub's files, so this is the inline renderer:" is 82 columns, and the next line's words fit.
    - collections.test.ts: " * A hub with a collection keyed by `title`, one keyed by `key`, one with no title, one" is 87 columns, and "holding" fits. "    // No title: meta is the schema alone, as the hub's" is 55 columns, ahead of a 46-column line.
    - Gallery.svelte: "    // state; the lists inside Chips and Tags are headed by a sub-heading" (73 columns) is followed by "    // (ui/controls/heads/SubHead.svelte)." (42 columns) inside one paragraph.
  - What is wrong: the rules file, "What every package obeys", says "A comment edited by the step is rewrapped as a whole paragraph at 100 columns, so no line inside a sentence ends short." Each of these is a `+` line of the diff.
  - Failure scenario: the comments read with ragged breaks mid-sentence, and the next step that touches them inherits the fix.
  - Verdict: none; fix at landing.
- `src/lib/views/system/workbench/Catalogue.svelte:397`: ".entries > :global(h4) {".
  - What is wrong: the view styles SubHead's inner element by its tag. That couples the view to the primitive's markup, which the low-coupling principle in "The principles every package is judged on" rules out. The report notes that GroupHead's `.label` was avoided for the same reason.
  - Failure scenario: SubHead changes its tag (say to a `div` with a role) and the Catalogue's sub-headings stop taking the full row.
  - Verdict: none; minor.

## 4. Behaviour

- `src/lib/state/boards/structure/lines.ts:267`: "const other = lines.filter((line) => !named.has(line.kind ?? ''));".
  - What is wrong: at the base (`lines.ts:230`), a line with no `kind:` or an unknown kind was drawn among the pillars proper. Now it is drawn under Other. The brief asks for this (item 12), but the report's "Host- and user-visible changes, view by view" Pillars row does not say that such lines move.
  - Failure scenario: a hub with a pillar line missing `kind:` sees that line leave the Pillar section for Other at landing, with nothing in the report to explain it.
  - Verdict: none.
- `src/lib/views/feeds/linkedin/Linkedin.svelte:237`, `:267` (`count={ideas.length}`, `count={posts.length}`) and `src/lib/views/feeds/inbox/Inbox.svelte:265` (`count={triaged.length}`).
  - What is wrong: the base drew `split.ideas.length`, `split.posts.length` (base :218, :248) and `sections.triaged.length` (base :228), which are the counts before the search. These headings now count what the search leaves. Item 3 asks for this, but the report's LinkedIn and Inbox rows ("the count drawn by the strip", the labels losing "(n)") do not say the number now follows the search.
  - Failure scenario: a user types a search and sees the Ideas, Posted and Triaged counts drop. Before this step they stayed at the totals.
  - Verdict: none.
- `src/lib/views/feeds/inbox/Inbox.svelte:132-140`: "if (!held.triagedOpen && triaged.some((thread) => thread.id === wanted)) { write({ triagedOpen: true });".
  - What is wrong: a revealed triaged thread now opens Triaged. This is new behaviour, and the report's Inbox row does not state it. Nothing writes a `reveal` into the Inbox today (`CommandCenter.svelte:239` opens the view with no state), so the behaviour is latent.
  - Failure scenario: none visible today. A later reveal path finds Triaged opening on its own.
  - Verdict: none.

## Declined to judge

- Every look-on-landing case (1-5 and the visual halves of 6, 8-12, 14-17 and 22) is left to the orchestrator's look on the scratch server, since the rules forbid starting a server here. That includes:
  - the sticky strip;
  - the single translucent layer in a tinted pane, in the tray and in a free float;
  - `z-index: 2` against card menus;
  - `checkVisibility()` under `hidden="until-found"`.
- The Update tray keeps its folds "while the page lives". That depends on the tray staying mounted between openings, which a read of `UpdateTray.svelte:58-59` alone does not settle.
- The wording of the "Doc text" entries, which the orchestrator applies at landing.
- The "Hub text" rules: the hub may not be read.
- Whether to lower the html-sites floor (Spec 2): it is the user's call.

Reviewer usage: abdef2fd8ccb0c728, claude-opus-5-5, 153511 tokens, 130 tool uses, 20 min 24 s.

# Repair round 1, refuted

```
Every command below was run from ~/workspace/oculus/.agents/worktrees/migration-O88 with PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH. The only git commands were `git diff 85a826ca6`, `git status --short` (run once with `-uall` added, also read-only) and `git show 85a826ca6:<path>`.

$ npm run diagrams && npm run docs:palette && npm run test:quick -- --base 85a826ca6     (run once, in the foreground; log at <scratchpad>/verify.log; exit 1)
test:quick: 148 changed file(s), from git since 85a826ca6
test:quick: 241 test file(s)
ok      prettier (0.6 s): All matched files use Prettier code style!
ok      ASCII gate (0.6 s)
ok      svelte-kit sync (2.3 s)
ok      eslint (1.9 s)
ok      svelte-check (8.0 s): 1793071901281 COMPLETED 550 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (123.2 s): Duration  115.74s (transform 75.36s, setup 0ms, import 189.73s, tests 245.51s, environment 7.31s)
FAILED  vitest checks (130.9 s)
 FAIL  |unit| tests/checks/source/html-sites.test.ts > every {@html} site > is one of the sites this file knows about
AssertionError: expected 33 to be greater than or equal to 34
 Test Files  1 failed | 14 passed (15)
      Tests  1 failed | 251 passed | 9 skipped (261)
ok      vitest slow (189.3 s): Duration  181.86s (transform 11.00s, setup 0ms, import 94.43s, tests 626.32s, environment 12ms)
test:quick: 191.8 s; failed: vitest checks
   -> The one red is the html-sites floor, open item 490, as the round brief expects.
   -> shasum of docs/diagrams/* and docs/palette.md taken before and after the run: identical. `git status --short | wc -l` gives 144 before and after.

$ sh utils/unused-exports.sh > <scratchpad>/unused.txt ; diff ../O88-base/unused-exports.txt <scratchpad>/unused.txt
unused exit 0
diff exit 0     (nothing printed, so no export was added)

$ LC_ALL=C perl -ne '<the ASCII gate of spec.md>' <the 29 paths changed in the round> .scratch/migration/agents/reviews/O88-report.md
(nothing printed) ascii exit 0
$ LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/reviews/O88-report.md
(nothing printed) grep exit 1

The commands the round report quotes as evidence:
$ grep -rn "foldedWith\|withInstanceKey(.*'folded'" src/lib/views src/lib/shell
src/lib/views/shared/card/pane-fold.ts:9:   (comment)
src/lib/views/shared/card/pane-fold.ts:17:  (import)
src/lib/views/shared/card/pane-fold.ts:48:  (toggle)
src/lib/views/shared/card/pane-fold.ts:49:  (toggle)
src/lib/views/boards/entry/Entry.svelte:196:            restateInstance(instance.id, withInstanceKey(moved, 'folded', folded));
   -> identical to the report's "after" block.
$ grep -rn ":global(h4)" src/lib/views
src/lib/views/shared/prose/Markdown.svelte:249:    .doc :global(h4) {
src/lib/views/shared/prose/Markdown.svelte:266:    .doc :global(h4) {
src/lib/views/sessions/transcript/Transcript.svelte:312:    .doc :global(h4) {
   -> identical to the report. `git show 85a826ca6:<each file> | grep -n ":global(h4)"` prints the same three lines at the base, and none in Catalogue.svelte at the base.
$ npx prettier --check <the round's 25 files> -> All matched files use Prettier code style!
$ npx eslint <the round's 25 files> -> nothing printed, exit 0
$ git status --short docs -> the 12 docs/diagrams files and docs/templates.md, as the report says
$ grep -n reveal src/lib/views/boards/projects/*.svelte -> exit 1, nothing printed
$ grep -n "GroupHead\|folded" src/lib/views/boards/collection/Collection.svelte -> exit 1, nothing printed
$ sed -n <line>p for each file:line of the round's three corrections -> every line is as quoted:
   Radar.svelte:113, Venues.svelte:93, Pillars.svelte:107 and Linkedin.svelte:119 each `$effect(() => folds.open(...))`
   Inbox.svelte:136 `write({ triagedOpen: true })` and :139 `folds.open(...)`
   List.svelte:70 `export async function unfold(target: string)`; Settings.svelte:385 and :412 `await drawn?.unfold(...)`
   page-entry.ts:105-108 `revealState`
   Collection.svelte:440-441; palette.ts:235; CommandCenter.svelte:239 `openView('inbox')`
   lines.ts:267; Linkedin.svelte:237 and :267; Inbox.svelte:265
   at the base, Linkedin.svelte:218 and :248, Inbox.svelte:228 and lines.ts:230
$ sed -n 55,125p tests/checks/imports/order.ts -> the state order and the inner order of state/shared, as the "wrong or impossible" correction quotes them

The case runs the report quotes, run again:
$ npx vitest run --config <scratchpad>/caserun/o88.config.mts --silent false --reporter verbose
 Test Files  1 passed (1) / Tests  3 passed (3); every `case` line is identical to the builder's <scratchpad>/caserun/o88-after-final.out (sorted diff, exit 0)
$ npx vitest run tests/data/sources/config/layers/hub-vocab.test.ts -t "pillar kinds" --reporter=verbose
 <check mark> |unit| ... > replaces oculus's pillar kinds whole 196ms ; Tests  1 passed | 16 skipped (17)
$ node <scratchpad>/caserun/case21.mts <worktree> pillar_kinds  (and venue_categories)
 the empty key: findings ["/scratch/lab/.oculus/config.yml | pillar_kinds.0.key | pillar_kinds.0.key is not a value this key takes"]; two rows with one key: findings []; venue_categories gives the same two results

The reviewer's own reads of the round's delta:
- The round's delta was taken as files.txt says: `diff -u` of the snapshot against the worktree for each of its 145 paths. 35 differ. The paths changed now that files.txt does not list are only the three .scratch files: O88-cases.md, O88-round1.md and O88-report.md.
- Word check over the 13 files the round only rewrapped: the words of the removed and added comment lines are compared after stripping the comment prefix. All 13 print "same words", so no word changed.
- Short-line scan, read-only, over every comment line the whole diff adds, `//`, ` * ` and multi-line `/* */`. A line is listed when the next line's first word would fit after it within 100 columns. One line is listed: src/lib/ui/controls/confirm/Confirm.svelte:7. That is base text the step moved without editing.
- History-word grep over the lines the round added: two hits, html.ts "sanitised before it is returned" and Linkedin.svelte "before it is scrolled to". Both use "before" for time inside a sentence. Neither compares with an earlier state of the code.
- Size: every changed component is at or under 520 lines and every source file at or under 880. Slides.svelte is 447, Projects.svelte 453 and Catalogue.svelte 417. `ls src/lib/ui/controls | wc -l` gives 10.
```

### Verdicts

Items of the brief's "What to build", over the whole diff since 85a826ca6:

- 1: holds. GroupHead is at `src/lib/ui/controls/heads/GroupHead.svelte`, where ruling R1 puts it; lines 84-204 were read.
  - It draws the `section` with the rest attributes and the sticky `h3.strip` (`top: 0`, `z-index: 2`, `margin: 0 0 8px`, `--input-radius`, `--panel`).
  - Over a wallpaper the strip takes `--panel-on-wall` with the blur, and in a free float it takes the float's fill.
  - The body uses `hidden="until-found"` with `onbeforematch`, the label is cut with an ellipsis, and the `actions` snippet is drawn.
  - The round changed only one comment there.
- 2: holds. The one reader and toggle are in `state/shared/page/folds.ts`. The orchestrator accepted that placement (round brief opening), and the report now gives it under "What in the brief was wrong or impossible". After the round, every view folds through `usePaneFold` (20 users) or `stateFolds` (7 views); round case 1 below.
- 3: holds. The reveal unfolds were checked line by line (above). `revealState` still opens Expired and Dismissed. No search write touches `folded`.
- 4: holds. Grep 7 prints 15 lines, each a heading item 7 keeps (Calendar, Presenter, the present parts, Timeline, ApprovalPanel, NoticeCentre, UpdateTray's title, ScheduleDialog). The round adds no frame around a heading.
- 5: holds. SubHead is read whole. The Catalogue now puts it in `<div class="subhead">` (round item 3).
- 6: holds by reading the users of GroupHead and the fold helpers. What each one draws is the look on landing.
- 7: holds. `git diff 85a826ca6 --stat` over Tasks, CommandCenterView and CareerPanel shows only import and comment lines (5 insertions, 5 deletions).
- 8: holds. `appearance.svelte.ts:92` reads `let unloaded = $state.raw({`.
- 9: holds. `git diff --stat` over Section.svelte, Notes.svelte, Changes.svelte and AppSourceGroup.svelte prints nothing.
- 10: holds. `CardGrid.svelte:34-36` holds `repeat(auto-fill, minmax(min(320px, 100%), 1fr))`, `gap: 10px` and `align-items: stretch`. Grep 9 finds no card-list grid in the views of item 10.
- 11: holds. Grep 10 finds no reader of the hub's `intro:` and no removed key, apart from the G5 sample strings in `html-sites.test.ts:257-267`. Removing the intros turns the html-sites floor red; that is open item 490, not a finding of this round.
- 12: holds. The case runs for 19 and 21 and the G126 row reproduce (above).
- 13: holds. `config/text/views/feeds/leads.yml:25` reads `expired_sec: Expired / actioned`.
- 14: holds as far as a read settles it. The wording is declined below.

Cases of the brief's "Cases":

- 1 to 5 (the strip, the wallpaper, tinted panes and floats, sticky headings, the headings side by side): not verifiable here. The look on landing settles them. By reading, GroupHead's styles are as item 1 says.
- 6 (fold and reload): met by reading the writes. After the round:
  - the seven views of round item 1 write through `usePaneFold.toggle`, which is `withInstanceKey(state, 'folded', ...)`;
  - Projects and Slides write through `stateFolds` into their own state;
  - the Audit's `keep` keeps `folded` (`Audit.svelte:131-133`).
  - The reload itself is the look on landing.
- 7 (the reader of `folded`): met. The case run reproduced.
- 8 (search with a bucket folded): met by reading.
- 9 (reveal into a folded group): met by reading the lines the corrected row names. The look on landing settles the rest.
- 10 (find-in-page): met by reading GroupHead's `onbeforematch`; the look on landing settles it on Venues.
- 11 (a deck dropped on a folded Slides group): met by reading. The drop attributes go to GroupHead's `section`, and the round leaves `ondragover` and `ondrop` on it (`Slides.svelte:294-296`).
- 12 (Dismissed, Expired, the run log, Triaged, Muted): met by reading; look on landing.
- 13 (Career, Command center, Tasks): met (item 7).
- 14 (a long label): met by reading `.name`; look on landing.
- 15 (keyboard): met by reading FoldControl. The round changed its comment only.
- 16 (card grids): met by reading CardGrid and grep 9; look on landing.
- 17 (no intros, counts in the bar): met by reading; look on landing.
- 18 (a hub file holding `intro:`): met as ruling R2 rules it. The case run gives `findings.schema.not_declared intro` and `collection intro: undefined`.
- 19 (`lineKinds`): met. The case run reproduced.
- 20 (the G126 row): met. It is green now; the red on the unchanged tree is quoted in the report.
- 21 (an empty key and a duplicate key): met as ruling R3 rules it. The empty key is refused as for `venue_categories`. The duplicate gives no finding until O87's merge lands.
- 22 (the theme): met by reading `$state.raw`. The console is the look on landing.

Items of the round brief:

- R-1 (one fold toggle, reused): holds.
  - Gallery, AccountSetup, Catalogue, Usage, Keys, Project and Audit each replace their `folded` read and `toggleFold` with `usePaneFold()`, and the Audit's `keep('folded', ...)` is gone.
  - Projects (`:196-199`) and Slides (`:134-137`) fold through `stateFolds`, writing through `write({ folded })` and `setInstanceState(instance.id, { ...held, folded })`, the same writes as before the round.
  - The keys are unchanged in every diff.
  - `usePaneFold` reads the id that `TabView.svelte:42` provides as `() => instance.id`, the id each view used before. No other component imports the seven views; the one `Project.svelte` importer found is `present/parts/Project.svelte`, a different file.
  - The head comments of the nine views and of `pane-fold.ts` say how each keeps its folds. pane-fold's two lists match the users found: the `grep -rln usePaneFold` and `grep -rln stateFolds` lists.
- R-2 (comments rewrapped): holds.
  - The five places the review named are rewrapped, and 13 more paragraphs of the step's own diff.
  - The word check prints "same words" for each.
  - The reviewer's short-line scan of the whole diff lists only `Confirm.svelte:7`, base text that was moved.
  - The method used to find the paragraphs is Finding 1.
- R-3 (the Catalogue's sub-heading row): holds. `Catalogue.svelte:296-298` wraps SubHead in `<div class="subhead">`. The style at `:390-392` names `.subhead`, and no `:global(h4)` is left in the Catalogue.
- R-4 (the report): holds. The corrected case 9 row, the three behaviour changes with their before and after, and the placement under "wrong or impossible" are appended, and every file:line in them reads as quoted.

Cases of the round brief:

- 1: met. The grep prints only `pane-fold.ts` and `Entry.svelte:196`. The report quotes the first run on the starting tree, which shows the nine views.
- 2: met by reading each view's diff. The reload is the look on landing.
- 3: partial. The Catalogue's hit is gone. The grep still prints three lines, Markdown.svelte:249 and :266 and Transcript.svelte:312, which were already there at the base and on the round's starting tree. Finding 2.
- 4: met. The case runs reproduce, the G126 row passes, and the verification list is green apart from open item 490.

### Findings

- Finding 1 (spec). `.scratch/migration/agents/reviews/O88-report.md`, Round 1 item 2: "A read-only scan lists ... The scan is `<scratchpad>/caserun/short-comments.sh`, and it writes nothing. Each paragraph it listed was rewrapped whole by a greedy fill at 100 columns (`<scratchpad>/caserun/fill.sh` prints the fill; the change is made with Edit)".
  - What is wrong, the scripts: both are scripts written for the step. The brief does not build them and no line of `plan.md`'s Rulings approves them. The brief's "Paths this step writes" allows no script "other than a case-run program as spec.md allows", and these run no case of the brief.
  - What is wrong, the sources: the report gives their paths but not their source, which spec.md asks for any program the report relies on. The reviewer could read them only because they sit in this session's scratchpad.
  - What is wrong, the git commands: `short-comments.sh` runs `git ls-files --others --exclude-standard -- src tests config` and `git cat-file -e "$base:$f"` after `cd "$1"`. spec.md "Where you work" bans both for a builder; it names `ls-files` and allows only `git status`, `git diff` and `git show`. The round report says "This round ran no command that writes a file in the worktree other than Edit and Write" and does not name these git commands.
  - Neither script wrote a file. Every edit they led to is a comment rewrap made with Edit, and the reviewer's word check and short-line scan confirm those edits independently of the scripts.
  - The disposition is the orchestrator's. The skill's "Finding dispositions" raises an unapproved script to the user. The state file's standing demand closes such a finding in automode under the ruling "Unapproved builder scripts", which is worded for programs that edit files.
  - Failure scenario: a later reviewer cannot rerun a scan the report relies on from the report alone, and the step ran git commands the rules file bans in the worktree without the report saying so.
  - Verdict: none. Round item 2 holds on the reviewer's own checks.
- Finding 2 (spec, a premise of the round brief). `.scratch/migration/agents/briefs/O88-round1.md`, Cases 3: "`grep -rn ":global(h4)" src/lib/views` prints nothing. On the starting tree it prints `Catalogue.svelte:397`."
  - What is wrong: on the base and on the round's starting tree the grep also prints `Markdown.svelte:249` and `:266` and `Transcript.svelte:312` (`git show 85a826ca6:<file> | grep -n`). Each styles the `h4` of sanitised Markdown drawn through `{@html}` inside the view's own `.doc` element (Markdown.svelte:233, Transcript.svelte:205). No primitive draws that `h4`, so the rule of round item 3 does not reach it.
  - The builder handed this back with that reason, and the reviewer judges the handback correct. Nothing in the diff is wrong. The case text needs correcting.
  - Failure scenario: a reader of the round brief takes the three remaining hits for an unfinished item 3 and asks for a change to the Markdown and transcript styles that no rule calls for.
  - Verdict: case 3 of the round, partial.
- Finding 3 (proof, minor). The report's "Round 1" section, "Verification".
  - The history-word grep: spec.md "What every package obeys" asks for a grep of the edited comment lines for history words, quoted in the report with each hit judged. The round report quotes none, though the round edits about 30 comment paragraphs.
  - The ASCII gate: it is quoted as `perl -ne 'print ... if /[^\x00-\x7F]/'`, which lets tabs and control characters through. spec.md's gate is `[^\x20-\x7E\n]`.
  - The reviewer ran both in the rules file's form. The history grep's two hits are each "before" used for time inside a sentence. The gate prints nothing. No decision rests on either omission.
  - Failure scenario: a history word or a tab in a rewrapped comment would not have been caught by the checks the report quotes.
  - Verdict: none.

The first review's findings, as the round leaves them:

- Spec 1 (the placement of the fold helpers): accepted by the orchestrator, and the report now gives it under "wrong or impossible".
- Spec 2 (the floor): open item 490.
- Spec 3 (the paths outside the brief): accepted.
- Proof 1 (the case 9 row): closed; the corrected row reproduces.
- Standards 1 (the toggle written six times): closed; round case 1.
- Standards 2 (the comments not rewrapped): closed; the reviewer's scan and the word check.
- Standards 3 (the Catalogue styling SubHead's tag): closed; round case 3 as far as the Catalogue goes.
- Behaviour 1 to 3: closed by the appended "before and after" rows.
- None of these is closed by removing a check. No fix reaches beyond its finding: every file the round changed is in the round's list or in the step's paths, and the rewraps outside the round's list are the sweep round item 2 asks for.

### Declined to judge

- Every look-on-landing case (1 to 5, and the visual halves of 6, 8 to 12, 14 to 17 and 22). The rules forbid starting a server here, so the orchestrator's look on the scratch server settles them, the nine round-1 views' fold and reload included.
- The html-sites floor (`tests/checks/source/html-sites.test.ts:242`): open item 490, the user's call.
- The wording of the "Doc text" entries and the "Hub text" rules. The orchestrator applies them at landing, and the hub may not be read.
- Whether `short-comments.sh` was actually run in the worktree. Only the transcript settles it; the script's `cd "$1"` and the report's wording say it was.
- The diff view's own fold toggle: `toggleFolded` in `src/lib/state/sources/repositories/repositories.ts:215`, used by `Diff.svelte:456`. It is at the base already, it folds the diff-file tree rows that ruling 488 keeps out of GroupHead, and the step touches Diff.svelte only for an import. Whether "a fold exists once" should reach it is outside the round's list.
- Whether the Update tray keeps its folds while the page lives. A read of `UpdateTray.svelte` alone does not settle whether the tray stays mounted between openings.

Reviewer usage: abb41ebe58d461405, claude-opus-5-5, 263698 tokens, 73 tool uses, 14 min 26 s.

## Closed

- First review, Spec 1 and Spec 3 (the placements outside the brief): accepted by the orchestrator, as the round brief says; the report gives the reasons.
- First review, Spec 2 (the html-sites floor): open item 490, ruled by Axel before landing.
- First review, Proof 1, Standards 1-3 and Behaviour 1-3: closed in repair round 1, as the review over the round finds.
- Round 1, Finding 1 (two scan scripts in the scratchpad, `short-comments.sh` and `fill.sh`, unapproved, and the git commands `ls-files` and `cat-file` they ran in the worktree): closed in automode under the ruling "Unapproved builder scripts" (`plan.md` Rulings), the breach recorded in the booking. Neither script wrote a file; every edit they led to is a comment rewrap made with Edit, and the reviewer's word check (same words in all 13 rewrapped files) and short-line scan confirm those edits independently. No repair round remains, so the builder's list of commands is taken from this finding.
- Round 1, Finding 2 (round case 3's grep also prints the three `:global(h4)` rules of `Markdown.svelte` and `Transcript.svelte`): the case's wording was the orchestrator's error; those rules style rendered Markdown inside the view's own element and no primitive. The case as meant, the Catalogue, is met. Nothing in the diff changes.
- Round 1, Finding 3 (the report quotes no history-word grep, and an ASCII gate wider than spec.md's): closed by the reviewer's own runs in the rules file's form, which print nothing to fix.
