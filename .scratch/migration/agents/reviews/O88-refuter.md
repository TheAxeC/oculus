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
