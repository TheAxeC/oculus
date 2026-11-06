# O149 brief check

## Names

Command: `for n in 'decks\.md' 'Decks guide' 'engine:docs/decks' 'giveViews' 'giveDocuments' 'viewIds' 'docPaths'; do grep -rn --exclude=local.yml -E "$n" src tests config docs README.md utils; done`. Output: no hit for `decks\.md`, `Decks guide` or `engine:docs/decks`. The other hits are listed below.

1. `src/lib/shell/Workbench.svelte:279-280` is outside the write list. The comment reads "A page of the rail, saved or adopted by its button, is given each of the hub's documents and each view of its arrangement it lacks, once, as a tab." Item 3 makes it incomplete: the page will also be given its arrangement's documents. Change to the brief: add `src/lib/shell/Workbench.svelte` (comment lines 279-280 only) to the write list, or have the builder report it as a doc comment to rewrite.
2. `src/lib/state/workbench/layout.svelte.ts:182-186` is outside the write list. The doc comment of `giveDocuments` reads "Give every rail page the documents its source lists that it has not been given: a tab after the page's first tab, recorded so a tab the reader closes is not given again." Item 3 makes it false: an arrangement document is placed after the tab before it, not after the first tab. Change: add these lines to the write list.
3. `src/lib/state/workbench/layout/model.ts` is outside the write list.
   - Lines 130-138 (the `Page` doc comment) say "`docs` is the paths of the hub's documents the page has been given as tabs". After item 3, `Page.docs` also holds engine ids such as `engine:docs/decks.md`, so the comment becomes false.
   - Lines 412-417 (`newPage`) say a rail page "records the paths of the documents its tabs hold (`Page.docs`)". `newPage` sets `page.docs = docPaths(workbench.root)` (`model.ts:426`), which leaves out every engine tab (`instance.ts:88-93`).
   - Change: add `model.ts` lines 125-138 and 412-430 to the write list, and say whether `newPage` records the engine ids. See Implied inputs 1.
4. `src/lib/state/workbench/layout/open/float/pages.ts:295-302` (`remade`, the Reset path) is outside the write list. It sets `made.docs = docPaths(workbench.root)`, so a page put back by Reset also records no engine id. Nothing in it becomes false as text. It is the second place that writes `Page.docs` (Implied inputs 1). Change: name it in the write list or in a sentence saying why it stays.
5. `src/lib/state/workbench/layout/instance.ts:95-98`, the `viewIds` doc comment ("every view but the document view, whose tabs `docPaths` names by their documents"). The file is on the write list only conditionally. The comment is already false for engine tabs, which `docPaths` excludes (`instance.ts:83-86`), and stays false unless rewritten. Change: make this comment a required rewrite whenever the helper lands beside `viewIds`, or list it among the comments to re-read.
6. `src/lib/state/workbench/layout/open/float/rail-pages.ts`. The head comment (lines 4-5) and the doc comment of `giveDocuments` (lines 110-113, "Every rail page given the documents its source lists, and the views its arrangement shows") both become incomplete. The file is on the write list only for "what the giving must be passed". Change: allow these comment lines explicitly.
7. Hits that the change does not make false:
   - `viewIds` at `model.ts:427` and `pages.ts:299`.
   - `saved.ts:105` (`docsShape = z.array(z.string())`) and `saved.ts:548-549`: they read ids as well as paths.
   - The `docs:` rows of `tests/state/workbench/layout/saved/layout-saved.test.ts` at 101-197.
8. Sentences that list what the Help page holds. Command: `grep -rn --exclude=local.yml -i 'help page holds\|Templates and Palette\|the data map and the palette\|Apps guide, the templates\|...' src tests config docs README.md utils`.
   - Hit outside the write list: `src/lib/views/system/help/Help.svelte:2-5`, the head comment: "...the hub's documents (the `docs:` entries whose group is `help`) and the Apps guide, the Templates and the Palette pages, documents of oculus's own folder." It already omits the Data map, and becomes false again with the Decks guide.
   - Change: add `src/lib/views/system/help/Help.svelte` lines 2-5 to the write list.
9. Sentences about giving tabs once. Command: `grep -rn --exclude=local.yml -i 'given once\|not given again\|added once' ...`. The hits outside the write list are `model.ts:132` and `:135` and `layout.svelte.ts:184`, already named in 2 and 3. `views.ts:5` is on the list.
10. The `find` help line exists only at `config/schemas/deck-schema.yml:29`. Command: `grep -rn 'statuses they may have\|the types and' tests src config docs --exclude=local.yml`. No other place states it.
11. README pattern. `README.md:28` names the Apps guide beside its feature line ("The [Apps guide](docs/apps.md) shows how to build one"), and `README.md:42` is the Present feature line. The brief's "as they name the Apps guide" names only :44 and :98. This is a judgment and not a defect: a link on :42 would match :28. Change, optional: name README.md:42 or say why not.
12. The `## present.yml` section of `docs/templates.md` (1912-1932) is read whole only by `tests/checks/config/templates.test.ts:18` (`PAGE`), which compares its YAML with the key lists. A change to the sentence alone leaves that test as it is.

## The step line

Command: `grep -n '^- O149' .scratch/migration/plan.md`, which gives line 1688.

1. Each part of the line, mapped to what the brief requires:
   - "a page `docs/decks.md` written from the deck reader's code": item 1, its first sentence and last bullet.
   - "after O146 to O148": a dependency. `grep -n -E '^- .{0,3}O14[5-9] ' plan.md` shows O146, O147 and O148 ticked at 1682, 1684 and 1686, and the base 64b159a6f is O148's landing ("Draw each project's facts at the foot of its slides").
   - "what a deck is": item 1, bullet 1.
   - "every key of `present.yml` (`deck.frame` included)": item 1, bullet 2, and C1.
   - "how a group picks its decks": item 1, bullet 3.
   - "every order entry": item 1, bullet 4, and C2.
   - "every slide kind with an example": item 1, bullet 5, and C2 and C3.
   - "the filter bar": item 1, bullet 7.
   - "the Project facts strip and `{{project.<field>}}`": item 1, bullets 8 and 9.
   - "the two slide findings": item 1, bullet 10.
   - "pinned as a 'Decks guide' tab on the Help page (`config/defaults/layout.yml` pinned tabs)": item 2, with item 3 as the widening for saved pages.
   - "`docs/HELP.md`'s Present paragraph and the `present.yml` section of `docs/templates.md` link to it": item 4.
   - "(ruling 677)": `sed -n '3559p' plan.md` reads the same contents.
2. No part of the line is left without a requirement.
3. The line names no check of its own. Items 3, 5, 6 and 7 and HELP.md lines 3, 56 and 57 go beyond the line; each is justified in the brief's decisions.

## Premises

Each premise was rerun on main at 64b159a6f (`git log -1`: "64b159a6f... Draw each project's facts at the foot of its slides").

1. These premises hold:
   - `ls docs/decks.md` prints "No such file or directory". `ls docs` prints apps.md, data-map.md, diagrams, HELP.md, licenses, palette.md, templates.md, third-party.md.
   - `sed -n '130,150p' config/defaults/layout.yml` shows `help:` at 135 and the four pinned doc tabs at 141-144, in the shape quoted.
   - `src/lib/server/content/docs.ts:1-15` describes the `engine` read.
   - `giveViews` is at `views.ts:58-65`. `viewIds` is at `instance.ts:99-107`, with `.filter((view) => view !== DOC_VIEW)` at 104. `giveDocuments` is at `docs.ts:63-69` (the brief says 62-69; 62 is the end of its doc comment). `Page.docs` is at `model.ts:142`. The two calls are composed at `rail-pages.ts:116`: `giveViews(giveDocumentsIn(held, sources), sources)`.
   - G29 is at `guarded.md:98-100`. `grep -rn 'giveViews' tests` exits 1, and `grep -rln 'giveDocuments\|saved/docs\|saved/views' tests` exits 1.
   - HELP.md :3, :56 and :57 read as quoted.
   - `docs/templates.md`: `## present.yml` is at 1912 and the file ends at 1932 (`wc -l` gives 1932).
   - `README.md:44` and `:98` read as quoted.
   - `spec.ts`: `readSpec` is at 214, `find` is read at 135-141, `orderOf` is at 176-211, and the key set is as listed.
   - `SlideKind` is at `model-deck.ts:65-77`. `findings.yml:143-144` hold `untitled` and `too_tall`. `COUNT` is at `read.ts:117`. `readDeck` is at `src/lib/server/content/deck/read.ts:101`, calling `createReader` at 126.
   - `history.test.ts:131-141` (`documentsOf`) reads every `.md` file of `docs/`.
   - `.agents/plan.yaml:4` makes the state file the verification page.
2. Wrong: the end of the Present bullets. The brief says "followed by its bullets to `:347`" (brief:15), and C4 says `docs/HELP.md:331-347` (brief:56). `grep -n '^- \*\*Present\.\*\*\|^- \*\*Literature search' docs/HELP.md` prints 331 and 349, and `sed -n '348p' docs/HELP.md` prints "    - `{{project.count}}` stays the count of a group named `project`...". The bullets run to :348. Change: write 332-348 in both places.
3. Wrong: the line of the `find` help. The brief says `config/schemas/deck-schema.yml:27` (brief:20), and the write list says "line 27" (brief:71). `grep -n 'field: find' config/schemas/deck-schema.yml` prints `29:      - { field: find, type: raw, help: "Which project folders the group finds: ..." }`. Line 27 is the `groups` help line. Change: write 29 in both places.
4. Stated, but incomplete as a premise for item 3. The brief says the doc tabs reach "a fresh page and a page put back by Reset". It does not say that both of those pages record `docs = docPaths(...)` (`model.ts:426`, `pages.ts:298`), and `docPaths` leaves out engine tabs. So no page, fresh or reset, records an engine id today.
   - The real saved layout shows the effect. A read-only python read of `~/.oculus/layouts.json` printed `help page docs: ['docs/RESEARCH-APPROACH.md', 'docs/AGENT-APPROACH.md', 'docs/HPC-UTwente-howto.md'] views: ['help', 'keys']`, with all four engine tabs pinned and the active tab `a95c1e91...`, which is the Data map tab.
   - Change: add this to "What is on the tree". C10 is the case every existing page takes.
5. The node passed as an arrangement is not the plain arrangement, and the brief does not say so. `rail.ts:45-46` builds `node: withDocs(arrangements[entry.page], docs)`, and `withDocs` (`arrangement.ts:186-197`) inserts the hub's `docs:` tabs after the first tab. So on the real hub, the Help node that item 3's rule reads holds help, then three hub doc tabs with ids equal to their paths, then keys, then the four engine tabs. Change: state this premise; Implied inputs 2 depends on it.

## Cases and checks

1. Verify item 3 is not consistent with the rules file. It names `LC_ALL=C grep -n '[^ -~]'`. `spec.md:103` says the perl gate "replaces the `grep '[^ -~]'` form wherever a brief or a check names it", with the accented-letter allowance under `config/`. Change: use the perl gate of `spec.md:103` for `config/` and `src/` files, and keep the grep form only for `docs/*.md` and `README.md`, which the perl gate's `find src tests bin config` does not reach.
2. Item 1's slide-kind bullet and C2 ask for "a fenced example of its front matter and body" for every kind, `summary` and `grid` included. These two are no front-matter kind: `kinds.ts:76-88` lists `KINDS` without them, and `kinds.ts:262-265` raises `findings.deck.kind_unknown` for any other `kind:`. They come only from `{ kind: summary | grid, of: <group> }` order entries (`spec.ts:196`). A builder that follows the bullet literally writes a slide file that C3 reports with a finding, or bends C3. Change: say that the examples of `summary` and `grid` are `present.yml` order entries with the group they draw over, read by C3 through `order:`.
3. C4 asks for each disagreement to be fixed in `docs/HELP.md`, and item 1's last bullet says it is "fixed there in the same step". The write list allows only HELP.md lines 3, 56-57 and 331. A wrong statement in a bullet at 332-348, or at `HELP.md:579` (the `defaults/present.yml` row), is outside the list. Change: widen the write list to HELP.md 331-348 and 579, or say that a fix elsewhere in HELP.md is named in the report as a path outside the list.
4. C6, C5 and C13 rest on the look or on a resolver run, and C1, C2 and C4 are checked by reading. All of these fit `spec.md:65-66`.
5. Places the step does not change that a case asks the builder to check:
   - C6 asks for a run of `doc-link.ts`, which the step does not change. It is a read-only proof that the links work, allowed as a case-run program by `spec.md:66`.
   - C7 runs `history.test.ts`, which the step does not change. It is the gate that `docs/decks.md` holds no id; it fits.
   - No case asks to quote or explain an unchanged place for its own sake.
6. C8 to C11 are consistent with G29's rule for `views` ("a page with no `views` was given none", so every view it lacks is given). C11 applies the same reading to `docs`, and `model.ts:136-137` says the same for hub documents.
7. Item 7 says "the orchestrator ... widens G29's sentence to documents at landing". This is a change to an existing entry, not a new one, so `spec.md:60` (a new entry stops for Axel) does not bind it.

## The question

The goal used here: a guide a reader of oculus can write any deck from, reachable as a Help tab and from the Present paragraph and the template.

1. C1: yes, it could pass without the goal.
   - C1 covers only the keys of `present.yml`. A guide can list every one of them and still leave out the front-matter keys the slide reader reads. `grep -ohE "meta\.[a-z_]+" src/lib/data/sources/deck/*.ts | sort | uniq -c` prints contact, eli, foot, kicker, kind, legend, method, notes, panels, results, specs, tag and title. Item 1 names only `notes:` and the tag. A reader cannot write a section slide with a `legend:`, a closing slide with `contact:`, or a project slide with `method:`, `results:`, `specs:` or `panels:` from such a guide.
   - Change: add to item 1 and to C1 "every front-matter key each kind reads (`kinds.ts`, `project.ts`, `slide-text.ts`), with what it does and the kinds that read it". Quote that list from the code beside the guide's.
   - C1 also checks "with its type, its default" only by reading. Change: have the quoted code list carry each key's type and default with `file:line`, so the comparison is of values and not of names.
2. C2: yes. It checks only that each kind has an example, which can hold with examples that show none of a kind's parts. C3 and the change in 1 close this.
3. C3: mostly no. It reads every example through `createReader` and prints each slide's kind and every finding.
   - It could still pass for a project or idea example that shows its title only because the scratch `DeckContext` has `projects: []`, and the title then has to come from `title:` (`kinds.ts:375-389`). Change: name the context the script hands `createReader`, and include one project in it so the project and idea examples are read as a project's deck reads them.
   - The deck reader never measures a slide, so C3 cannot catch an example taller than its frame. That finding comes only from the view (`findings.deck.too_tall`). It does not bear on the goal.
4. C4: no, once the line range in Premises 2 and the write list in Cases 3 are fixed.
5. C5: no. A fresh page is made from the arrangement.
6. C6: no.
7. C7: yes, it could pass without the goal, since it only shows the absence of ids. It is a gate and not a proof, which is acceptable.
8. C8 to C11: yes, they could pass without the goal.
   - Item 7 places them as rows of a new test in `tests/state/workbench/layout/saved/`. If the rows call a new function of `saved/` directly, they pass while `rail-pages.ts:116` never calls it, and no saved Help page gains the tab.
   - Their "failing run on the unchanged tree" (`spec.md:69`) would then be an import error and not a red row.
   - Change: have the table drive the composition that runs in the app, `createRailPages(access, grounds).giveDocuments(sources)` (`rail-pages.ts:114-118`) with a plain access object, or the exported `giveDocuments` and `giveViews` as composed there. Then the base run is a real red row (no Decks guide given), and the wiring is under test.
9. C12: no.
10. C13: no. It is read, and the hover is seen at the look.
11. The step line: it names no check, so there is nothing to ask of it.
12. Item 1 (the guide): yes, as for C1. Without the front-matter keys a reader cannot write any deck.
13. Item 2 (the tab line): it reaches only fresh and reset pages. Item 3 covers saved ones.
14. Item 3 (giving saved pages the documents): yes, as for C8 to C11, while the test does not reach the wiring.
15. Item 4 (links): no. Each link is named by its line.
16. Item 5 (schema help): no.
17. Item 6 (examples script): it proves only that the examples parse, which is its job. C3 bounds it.
18. Item 7 (tests): see 8.

## Implied inputs

What I read: `src/lib/state/workbench/layout/saved/` (views.ts and docs.ts whole, saved.ts:105-113 and 540-552); `rail-pages.ts` whole; the callers `Workbench.svelte:201-205` and `:276-283`, `layout.svelte.ts:182-186`, `:700-740` (resetPage and resetPages) and `:797`; `pages.ts:295-370` (`remade`, `rebuiltPage`, `resetAll`); `model.ts:125-150` and `:412-430`; `arrangement.ts:150-222`; `rail.ts:40-60`; `catalogue.ts:44-70`. I also read the real saved layout `~/.oculus/layouts.json` read-only with python.

1. Fresh pages and Reset record no engine id, and the brief does not say whether that changes.
   - `newPage` (`model.ts:426`) and `remade` (`pages.ts:298`) record `docs = docPaths(...)`, which excludes engine tabs.
   - So under item 3's rule, every page made fresh or put back by Reset relies on the C10 path ("already shows, records it") at the next giving run.
   - The giving effect (`Workbench.svelte:279-283`) reads `access.held()`, which is `store.current`, a `$state` (`layout.svelte.ts:317` and `:402`). By that reading the effect runs again after each layout save, so the record is made at once. This is inferred from the code and not verified by a run.
   - Missing from Cases: "a fresh or reset Help page records the arrangement's document ids, at its making or at the first giving run, so closing a guide tab right after a Reset keeps it closed". The brief should say which of the two it is. Recording in `newPage` and `remade` needs `model.ts` and `pages.ts` on the write list.
2. The hub's documents inside the node.
   - The node holds `withDocs`' hub doc tabs (Premises 5), whose ids equal their paths (`catalogue.ts:51`).
   - If item 3's rule reads every `doc` tab of the node with an id, it also covers the hub's documents. It gives them nothing only because `giveDocuments` runs first and records the same strings (`rail-pages.ts:116`, `docs.ts:56`).
   - The real hub has exactly these three Help documents (`grep -rn 'group: help' ~/workspace/research-hub/.oculus --exclude=local.yml` prints config.yml:60-62).
   - Missing from Cases: "a hub `docs:` entry of the page's own group, present in the node, is given only by `giveDocuments`, after the first tab, and never a second time or at its arrangement place". The brief should state the rule's input, whether every `doc` tab or the engine tabs only, and that the order at `rail-pages.ts:116` stays. C12 covers only a hub entry given to its own Help page "as today".
3. The active tab.
   - On the real saved Help page the active tab is the Data map (`a95c1e91-...`), which sits right after Templates, where the Decks guide is inserted.
   - Expected: the Data map stays active, as `withView` keeps it with `activate(added, target.pane.active)` (`views.ts:30`).
   - Item 3 and C8 never state it. A wrong answer would switch the reader's Help page to the Decks guide, or to another tab, at load. Change: add "each pane's active tab stays active" to item 3 and to C8.
4. The tab before is missing or moved.
   - The brief does not say where the Decks guide goes when the page shows no Templates tab (the reader closed it) or holds it unpinned or in another pane.
   - Expected, as `withView` does (`views.ts:22-31`): after the Templates tab in the pane that holds it, no later than that pane's pinned tabs; at the end of the first pane's pinned tabs when no pane holds it.
   - A closed Templates tab is a common state, and a wrong answer puts the tab before Help or among unpinned tabs. Change: add a case.
5. View placement once views and documents share one order.
   - If the builder merges views and doc tabs into one order to compute "the tab before", then `keys`' tab before becomes the hub tab `docs/HPC-UTwente-howto.md` in the real node, not `help`. That changes `giveViews`' outcome for a newly given view.
   - Expected: a view is placed as `giveViews` places it today, after the view before it in `viewIds`. Change: state it.
6. Empty and repeated ids (`spec.md:73`).
   - The brief says only "no `id`". `instanceText` returns `''` for a missing id (`docs.ts:23`).
   - Expected: an arrangement doc tab with `id: ''` is given to no page, and two arrangement tabs with one id are given once. Change: add both to the cases.
7. The document already open on another page or in a float.
   - A Decks guide tab opened from a link on another page or in a float before the Help page's giving run would get a second tab on the Help page, since "already shows" checks only the page itself (as `shownPaths` does, `docs.ts:19-25`).
   - This has not happened: `docs/decks.md` does not exist, and the giving runs at load. Low cost. The brief could say that the check is the page's own tabs, as for hub documents.
8. Pages saved before the step, where the reader closed a guide.
   - Decision 3 accepts that such a page shows a closed guide tab once more.
   - On the real saved layout the Help page shows all four guides (command in Premises 4), so on Axel's machine no guide reappears. This bears on decision 3 and costs nothing there.

## ADRs

`test -d docs/adr || echo "no docs/adr"` prints `no docs/adr`. `find . -path ./node_modules -prune -o -path ./.agents/worktrees -prune -o -iname '*adr*' -print` prints nothing, and a `find` for directories named adr, adrs or decisions prints nothing. `.agents/plan.yaml` names no ADR folder (`grep -n -i 'adr' .agents/plan.yaml` prints nothing). No ADR exists, so none is touched.

## Dictated text

Each line was found with `grep -n` over `.scratch/migration/agents/briefs/O149.md`. `LC_ALL=C grep -n '[^ -~]'` over the brief prints nothing (exit 1).

1. `grep -n 'label: "Decks guide"'`, line 42: `{ view: doc, state: { id: engine:docs/decks.md, path: docs/decks.md, engine: true, label: "Decks guide" }, pinned: true }`. Read whole: it holds. It has the shape of `layout.yml:141-144` byte for byte, apart from the names, it is ASCII and it is one line.
2. `grep -n '\[Decks guide\](decks.md)'`, line 44: `[Decks guide](decks.md)`. Holds. The link is relative from `docs/HELP.md` and `docs/templates.md`; see Other checks 4.
3. `grep -n 'a view or a document oculus adds'`, line 44: "a view or a document oculus adds to a page's arrangement later is given once, and one you closed is not given again". It holds against the Writing rules: plain, no dash, no contrast construction, no history. Its truth is limited by decision 3: a page saved before the step shows a closed guide once more. The sentence must stay as it is, since naming that one-time case in the manual would be history.
4. `grep -n 'status chips a deck'`, line 45: "the folder globs, and the tiers, stages, forms and status chips a deck's project may have". Holds. The keys match `spec.ts:135-141`. "status chips" names the `status:` key, whose values are chips (`spec.ts:24-25`).
5. `grep -n 'Filtered: n of m'`, line 37: "Filtered: n of m decks". It holds as prose. The catalog has two forms: `config/text/views/academic/present.yml:89` `'Filtered: {0} of {1} decks'` and `:90` `'Filtered: {0} of 1 deck'`. A guide that quotes "in the catalog's words" should give both. Change, optional: write "the Filtered line" and leave the words to the catalog.
6. `grep -n 'joined with'`, line 39: `", "`. Holds. `read.ts:504` is `fact.words.join(', ')`.
7. The quoted current texts at brief lines 15, 17 and 20 are quotations of the tree and not dictated text. They match the tree (Premises 1), with the line-number errors in Premises 2 and 3.

## Other checks

1. The widening in item 3 is needed. A saved Help page never gains an arrangement doc tab today.
   - `viewIds` drops every `doc` tab (`instance.ts:104`).
   - `giveDocuments` gives only `source.docs`, which is the hub's `docs:` entries filtered by group (`rail.ts:45-46`, `Workbench.svelte:282`). The engine tabs are never in it; `arrangedDocs` feeds only the catalogue (`Workbench.svelte:202-205`).
   - The Reset path (`layout.svelte.ts:706-740`, `pages.ts:295-370`) rebuilds from the arrangement, so it does show the new tab.
   - The real saved Help page lacks the tab and has no engine id in its record (Premises 4).
2. Could the rule lose or duplicate a reader's tabs?
   - It removes no tab.
   - Duplicates are avoided only if "already shows" is checked by `id` on the page (C10) and `giveDocuments` keeps running first for the hub's documents (Implied inputs 2).
   - A duplicate is possible only when the same document is open on another page or in a float before the giving run (Implied inputs 7).
   - Tabs reappear once on pages saved before the step (decision 3); not on Axel's layout.
3. `tests/checks/source/history.test.ts` reads `docs/*.md`. `documentsOf` (`history.test.ts:131-141`) reads every `.md` file of `docs/` whole, and the test 'names no package id, date or session in any document' asserts no hit.
   - Its `FAMILIES` (`:44-59`) include `H1`, `S1`, `M[0-9]`, `L[0-9]`, `K[0-9]`, `W[0-9]`, `X[0-9]` and `C[0-9]{1,2}`, case-sensitive, beside the families the brief names. A slide guide is likely to write "H1" for a level-1 heading, or "Q1" in a venue example.
   - Change: name `H1` and `Q1` in brief:25, and say "level-1 heading".
4. `doc-link.ts` resolves `decks.md` from both pages, by reading `docLinkOf` (`doc-link.ts:59-68`) and `openingOf` (`:91-110`). `docLinkOf('decks.md', 'docs/HELP.md')` gives `{ path: 'docs/decks.md' }`. In the engine space, `openingOf` returns `{ kind: 'engine', path: 'docs/decks.md' }`, since `engineServes` refuses only hidden segments (`catalogue.ts:97-99`). The same holds from `docs/templates.md`. `HELP.md:3` already links `apps.md` and `templates.md` the same way. This is by reading, not run.
5. No link check exists over `docs/`. `grep -rln -i "link" tests/checks` shows only `allow-styling.ts`, `layer-rows.ts`, `config-folder.test.ts`, `diagrams.test.ts` and `walk.ts`, none of which reads Markdown links. The only tests that read files of `docs/` are `history.test.ts`, `templates.test.ts:18` and `catalog-file-keys.test.ts:47`. `docs/decks.md` must pass `history.test.ts` alone.
6. A user-visible change the brief does not name: the Help chord.
   - The Help group's chord list is its views, then the engine documents in tab order, then the hub's `docs:` entries (`catalogue.ts:182-244`, `Workbench.svelte:202-205`). Only the first nine get a key (`keyOf`, `catalogue.ts:250-258`; `HELP.md:147` "h1-h9 | the Help page's tabs").
   - On the real hub that is help, keys, four guides and three hub documents: nine entries, with "HPC how-to" on h9.
   - With the Decks guide after Templates, Data map moves from h5 to h6, Palette from h6 to h7, Research approach from h7 to h8 and Agent approach from h8 to h9, and HPC how-to loses its key. This is by reading, not run.
   - Placing the guide after Palette still takes the key from HPC how-to.
   - `spec.md:18` counts a keybinding as a user-visible shape. Change: add this consequence to decision 2 and to the before and after of C5 (the Views catalogue and the Keyboard Shortcuts view, each Help entry's key). It goes to the orchestrator as a decision it may reverse.
7. Steps in flight: O150's write list is hub files only (`awk` over `briefs/O150.md`). O152 and O153 write `docs/HELP.md:299` and `docs/templates.md:541-546`, which do not overlap O149's lines.

## Declined to judge

- Whether every sentence of `docs/HELP.md:331-348` is true of the code at the base. That is C4's work for the builder and the reviewer, and it needs a full read of `present.ts`, `groups.ts` and `read.ts`.
- Whether the giving effect reruns after each layout save in the running app. It is inferred from `$state` at `layout.svelte.ts:317` and `:402`. Settling it needs a run of the page, which this check does not start.
- The `npm run diagrams` and `npm run docs:palette` outputs for this step: not run, since this check changes nothing.
- The full list of front-matter keys in `project.ts` and `slide-text.ts` read in forms other than `meta.<key>`. The grep in The question 1 found the `meta.` reads only.

Usage: ab3e6c362e8cd02fd, claude-opus-5-5, 208864 tokens, 91 tool uses, 12 min 48 s

## Closed

- Names 1 to 6 and 8: the comments of `Workbench.svelte:279-280`, `layout.svelte.ts:182-186`, `model.ts:130-138` and `:412-417`, `instance.ts:95-98`, `rail-pages.ts:4-5` and `:110-113` and `Help.svelte:2-5` are required rewrites under item 3 and item 4, and their lines are on the write list; `pages.ts:295-302` and `model.ts:412-430` are on it for the record at making (Implied inputs 1). An internal widening, taken in automode and booked in `choices.md`.
- Names 7, 9, 10 and 12: no change needed.
- Names 11: `README.md:42` is named in item 4 and on the write list.
- Premises 2 and 3: the line numbers read `:348` and `:29`.
- Premises 4 and 5: two premises added (the record of a fresh or reset page, the node through `withDocs`), and a third on the Help keys (Other checks 6).
- Cases and checks 1: Verify 3 is the perl gate of `spec.md:103` for `src`, `tests`, `config`, and the grep form for the Markdown files.
- Cases and checks 2: `summary` and `grid` are exemplified as order entries (item 1).
- Cases and checks 3: `docs/HELP.md` lines 331-348 and 579 are on the write list.
- Cases and checks 4 to 7: no change needed.
- The question 1 and 12: item 1 and C1 name every front-matter key each kind reads, with type, default and `file:line`.
- The question 3: C3 reads the examples in a context holding one project.
- The question 8 and 14: item 7's table drives the composition `rail-pages.ts:116` runs.
- Implied inputs 1: item 3 records the engine ids at a page's making (`newPage`, `remade`), case C17.
- Implied inputs 2: item 3's input is the `engine: true` doc tabs only, `giveDocuments` first, case C16.
- Implied inputs 3: the active tab stays, in item 3 and C8.
- Implied inputs 4: placement when the tab before is missing, in item 3 and C14.
- Implied inputs 5: views are placed as today, in item 3.
- Implied inputs 6: an empty and a repeated id, in item 3 and C15.
- Implied inputs 7: "already shows" reads the page's own tabs, in item 3.
- Implied inputs 8: no change needed.
- Dictated text 5: the guide names the Filtered line in the catalog's words.
- Other checks 3: `H1`, `Q1` and the other families are named in the premise, with "level-1 heading".
- Other checks 6: the tab moves after Palette, so no guide's key changes; HPC how-to loses `h9` whatever the place, stated in decision 2 and case C5, and named in the next report.
