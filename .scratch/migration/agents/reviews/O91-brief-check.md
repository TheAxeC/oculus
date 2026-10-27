# Brief check of O91 (joint work moves onto the people file; the person, organisation and resource cards list their projects)

Main's head: `git log --oneline -1` printed `370f0ffea Send O87's repair round 1`. The brief is uncommitted (`git status --short` printed `?? .scratch/migration/agents/briefs/O91.md` and ` M docs/data-map.md`). `plan.md` has no Goal section: `grep -n "^## " .scratch/migration/plan.md` lists only `## Steps, in execution order`, `## Could run in parallel`, `## Rulings`, `## Agents` and `## Blocked, and by what`, and its top says it is the "Execution ledger for `tools/oculus/DESIGN.md`". I therefore took the goal this step delivers to be the step line, plan.md:848.

I wrote no file in the repository. I did write three scratch files under `/tmp` with a shell redirect while counting hits in the worktrees of the steps in flight, and deleted them in the next command (`rm -f /tmp/claude-502-o91-migration-O8{7,8}.txt /tmp/claude-502-o91-migration-O94.txt`). No file of the repository or of the worktrees was touched.

## Names

Every name was grepped across the repository (main checkout, `.scratch` left out unless stated otherwise). Below are the hits outside "Paths this step writes", each with whether the change makes it false.

Commands: `git grep -n -i -I "joint" -- . ':!config/local.yml' ':!.scratch'`, `git grep -n "PERSON_FIELD" -- . ':!config/local.yml' ':!.scratch'`, `git grep -n "crossLinks\|cross-links" -- . ':!config/local.yml' ':!.scratch'`, `git grep -n -w "collab\|dlcat_collab\|glyph_collab\|word_collaboration" -- . ':!config/local.yml' ':!.scratch'`, `git grep -n "make_collection_line_joint_work\|make_collection_line_" -- . ':!config/local.yml' ':!.scratch'`, and `git show HEAD:docs/data-map.md | grep -n -i "joint"`.

**Hits the change makes false:**

1. `docs/HELP.md:52` (rail badge sentence). It lists the badge sources "... Funding, Education, Applications, Joint Work, Tasks and Talks & Events". This is false once the rail badge at `layout.yml:335` leaves. The line is not among the step's paths, which name HELP.md lines 236 and 301 only.
2. `docs/HELP.md:547`. It says "the flags of the features that read it (`band_positions`, `band_teaching`, `awaiting`, `open_badge`, `lead_applications`, `dissemination` with `dissemination_skip:`, `tasks`, `joint_work`)". This is false once the flag leaves. It is not among the paths, and the brief's premise 3 grep (`grep -n "joint" README.md docs/HELP.md ...`) prints it but the brief does not list it. This line is also one O87 (in flight) rewrites: O87's diff in `.agents/worktrees/migration-O87` changes HELP.md:547 and still names `joint_work`.
3. `config/options/behavior.yml:161`. Its help says "... and the dated entries of talks, teaching, tasks, positions and joint work." This is false once the collection leaves, and it is not among the paths. O87 (in flight) rewrites this same line and keeps "joint work".
4. `docs/data-map.md` at main's head, line 69: `| Funding, Talks & Events, Education & Service, Applications, Joint work, Tasks, Memories | Academic Life | their files, and the photo wall's pictures |`. This is false, and the brief's "Doc text" names only :46, :72 and :179-180. (The uncommitted working copy has it at :71.)
5. `docs/templates.md:1257-1258`. The range 1233-1256 ends on `#    followup: ""`. Line 1257 is the closing fence and 1258 is the blank line, so removing 1233-1256 as written leaves a stray fence.

**Hits the change does not make false:**

- `src/lib/views/shared/explorer/tree/FileRow.svelte:146,219` (`.joint`, a CSS class) and `config/catalogs/latex.yml:611` ("disjoint") are unrelated words.
- The glyph word `collab` stays in use:
  - `config/catalogs/glyphs.yml:107` and `config/catalogs/icons.yml:106`
  - `config/text/views/boards/collection.yml:36,73` (`person_glyph`, `people_glyph`)
  - `config/text/views/boards/person.yml:5`
  - `config/text/views/boards/project.yml:126`
  - `src/lib/views/boards/person/Person.svelte:212`, which leaves with the button
  - `src/lib/themes/tokens.css:111` (`--map-collab`) and the Graph and Nodes stylesheets
- `tests/fixtures/hubs/demo/projects/coauthor/spectral-clustering-collab` is a project id.
- `cross-links` in the comments of `src/lib/views/shared/card/project/CardLinks.svelte:57,161` and `src/lib/views/shared/card/project/ProjectCard.svelte:7`, and the imports of `src/lib/views/boards/collection/Collection.svelte:83`, `src/lib/views/structure/pillars/ArchivalCard.svelte:14`, `src/lib/views/shared/card/feed/RadarCard.svelte:47` (`groupProjects`, `stageGroup`, `unfundedBy`), stay true unless the builder renames those exports. `crossLinksOf` in `src/lib/state/feeds/radar.ts:119` is a different function.
- `PERSON_FIELD_FILE` (`tests/routes/hubs/hub-writes.test.ts:77`) is within the paths.

**Names with no hit outside the paths:** `jointWorkRows`, `jointWorkPerson`, `jointWorkIds`, `jointWork`, `jointWorkOf`, `openJointWork`, `dlcat_collab`, `glyph_collab`, `word_collaboration` and `make_collection_line_joint_work`. The people.yml keys `note` and `tags` touch only `docs/templates.md:1064-1088` and the demo `people.yml`, both in the paths.

**Ledger files, outside the repository's source:** `grep -n -i "joint" .scratch/migration/agents/guarded.md | cut -c1-20` prints lines 158 and 254.
- Line 158 (G66's Test line) names the row 'a double-quoted select, the person of a joint-work entry'.
- Line 254 (G32's Test line) holds "joint work by its flag: `tests/state/forms/referrers.test.ts`, the rows whose joint-work collection carries `joint_work: true`". Those rows are deleted by the step, so this clause becomes false.

The brief's item 7 asks the report to list only moved rows, so that the orchestrator can rewrite Test lines. It asks for no list of deleted rows, and it never names G32's clause at guarded.md:254.

## The step line

Each part of plan.md:848, mapped to the item of "What to build" that serves it:

- "the `joint-work` collection retired" is served by item 1, plus Hub text "joint-work.yml is deleted".
- "each entry's `note` and `tags` moved once onto that person's entry in `people.yml`, whose schema gains `note` (textarea) and `tags`, in a hub commit" is served by Hub text (the orchestrator), item 7 (the demo fixture) and item 8 (the people template).
- "the file ... removed" is served by Hub text and item 7 (the demo's file).
- "the `joint_work` flag ... removed" is served by item 1.
- "its readers (`jointWorkRows`, `jointWorkPerson`, `jointWorkIds`, the Person page's block, the cross-links branch, the referrers) ... removed" is served by item 2.
- "their tests and words removed" is served by item 1 (words), item 7 (tests) and item 8 (docs).
- "a person's card draws one strip of projects per role, Lead, Supervisor and Collaborator, from the manifests' `lead`, `supervisors` and `collaborators`" is served by item 3, with decisions 2 and 3.
- "each row the in flight, done and ideas pickers" is served by item 3 ("grouped as every strip groups them") and item 6 ("each row through CrossLinks.svelte").
- "a role with no project drawing no row" is served by item 3.
- "an organisation's card draws the strip of the projects whose team holds a person affiliated to it" is served by item 4.
- "a resource's card the strip of the projects whose `compute:` names it" is served by item 5.

No part of the line lacks a requirement. The line names no check of its own.

The brief does not say that the step line fixes the rows as Lead, Supervisor and Collaborator while the brief reads them from `roles:`. Under the brief, a hub that renames, reorders or omits a role changes or drops rows (decisions 2 and 3). That is a reading the brief takes, and it is stated there as a decision.

Brief line 20 credits rulings 480 and 482 with "each row of a person's strip being the in flight, done and ideas pickers". Those rulings (plan.md:2878 and 2880) only schedule. The clause comes from the step line.

## Premises

Each premise was rerun with its own command.

1. **Collection and flag.** Reproduces, except for what it leaves out. Every cited line was checked with `git grep -n "joint_work\|joint-work" -- config src docs README.md ':!config/local.yml'`, `sed -n 104,110p config/options/sources.yml`, `sed -n 25,46p src/lib/data/model/model-collections.ts`, `sed -n 114,118p;333,336p config/defaults/layout.yml` and `sed -n 37,40p;49,51p;102,104p config/text/views/boards/focus.yml`. The cited lines hold:
   - sources.yml :30, :48 and :55
   - options :106-108
   - model-collections.ts :32 and :42
   - layout.yml :116 and :335
   - collection.yml :60-61
   - files.yml :94
   - person.yml :1 and :25-28
   - vocab.yml :209
   - focus.yml :39, :50 and :103

   `git grep -n "category: collab"` prints `config/defaults/sources.yml:48`, `docs/templates.md:87` and `tests/fixtures/hubs/demo/.oculus/config.yml:21`, plus three `.scratch` files (O87.md:90, O78-report.md:546, O87-brief-check.md:134). The brief's command also prints `docs/HELP.md:547`, which the brief does not list.
2. **Readers.** Reproduces. `git grep -n -i "joint" -- src` and `git grep -n "PERSON_FIELD"` print exactly the lines cited:
   - normalise.ts :158-159, :381, :560-575 and :643
   - merge.ts :36 and :362-385
   - links.ts :43-44, :70, :104-105, :127, :148-157 and :186
   - index.ts :179-180
   - model-entities.ts :627 and :666-668
   - person.ts :2, :30-31, :63-72, :74, :81 and :96
   - Person.svelte :2-3, :18-24, :140-143, :195-202, :208-216 and :264-279
   - cross-links.ts :16-17, :66-110 and :92-96
   - referrers.ts :4, :13-14 and :76-104
   - the six comments
3. **Documents.** Partly reproduces. `grep -n "joint" README.md docs/HELP.md docs/apps.md docs/templates.md docs/palette.md` prints the cited lines plus `docs/HELP.md:547`, which the brief leaves out. HELP.md:52 ("Joint Work", capital W) is caught by `git grep -i` but not by the brief's case-sensitive grep. `git show HEAD:docs/data-map.md | grep -n -i "joint"` prints 46, 69, 72 and 179, and the brief leaves out 69. `docs/templates.md` 1233-1256 stops one line short of the closing fence at 1257 (`awk 'NR>=1233 && NR<=1258'`).
4. **Tests and fixtures.** Reproduces for the files. `git grep -n -i "joint.work\|joint_work\|jointWork\|PERSON_FIELD" -- tests` prints the listed files and lines. The vehicle bullet's attribution does not fully reproduce:
   - `grep -n -F "without the hub key" .scratch/migration/agents/guarded.md` and `grep -n -F "its hub cannot resolve" .scratch/migration/agents/guarded.md` print nothing. The hub-writes row 'writes a field that names a record of the second hub without the hub key (G8)' (tests/routes/hubs/hub-writes.test.ts:436) and the hub-portfolio row at :221 are tied to G8 and G32 only by the "(G8)" and "(G32)" in their titles. guarded.md does not name them by title; G32 reaches hub-portfolio only through "the rows O54 names in its landing report".
   - The bullet also leaves out vehicle rows that name the file. `tests/data/sources/collections.test.ts:37,90` is the G32 row 'reads a title-keyed collection with its entries in file order', named at guarded.md:254. `tests/server/machine/lsp/adapters/hub-keys.test.ts:257` is G67's "renames from self of the primary hub's local.yml the person, and that file with it (case 23)", which asserts that the joint-work file is among the changed URIs. `tests/data/sources/config/settings.test.ts:803` is the `FIVE` keys of oculus's default chat_context.
5. **Cards.** Reproduces. `git grep -n "crossLinks(" -- src` gives EntryCard.svelte:183. RecordCard.svelte:148-151 computes `linked` and draws `<CrossLinks groups={linked} {oneOpen} />` at :300. sources.yml:41-43 shows the people, organisations and resources entries. `Collection.svelte:451` draws EntryCard for every entry. cross-links.ts:97-103 is the `related:` fallback.
6. **Joins.** Reproduces.
   - `sed -n 276,284p src/lib/data/snapshot/normalise.ts` shows `resourceIds: strings(manifest.compute)` at :280.
   - `sed -n 145,158p src/lib/data/snapshot/hubs/merge.ts` shows `resourceIds: idsOf(one.resourceIds, at('resources', 'compute'))` at :152.
   - referrers.ts:106-123 joins on `person.affiliations.includes(id)`.
   - team.ts:19-21 is `teamOf`.
   - merge.ts:219 and :226 give entries and entities the same `hubId(own, ...)` form, consistent with "has the id of its entity". I did not check it with a run.
7. **Roles.** Reproduces. `grep -n "^roles:\|key: lead, \|key: other" config/catalogs/vocab.yml` prints 243, 244 and 247. roles.ts:35-43 is `rolesOf`, which dedupes by key, not by field.
8. **Hub counts.** These come from the research hub, which I may not read, so I left them unchecked.
9. **Coverage and folder counts.** Reproduces. `grep -n "cross-link" agents/guarded.md` (from `.scratch/migration`) exits 1. `git grep -ln "crossLinks" -- tests` exits 1. `ls src/lib/views/shared/links | wc -l` prints 10, and `ls src/lib/state/boards/structure | wc -l` prints 6. A grep of guarded.md for `RecordCard`, `EntryCard`, `CrossLinks`, `person.ts` and `Person.svelte` counts 0 each; `referrers.ts` is named once, in G32's Code line (guarded.md:253).

Other premises:
- Brief line 5 (no ADR): reproduces; see ADRs.
- `src/lib/views/shared/links` holding 10 items: reproduces.

## Cases and checks

**Inconsistent with spec.md, guarded.md or the brief's own rules:**

1. **Cases 1, 2, 3, 8, 9 and 10 are research-hub cases** (amir-haeri, van-den-berg, the user, university-of-twente, mst, utwente/data). Brief line 13 forbids the builder to read the hub, but the preface makes "the first run of every case on the unchanged tree" the builder's first task. Only case 1 says how the builder runs it ("over the demo fixture's equivalent"); cases 2, 3, 8, 9 and 10 name no equivalent.
   - The demo fixture lacks the inputs several of them need. A loop over `tests/fixtures/hubs/demo/projects/**/project.yml` printing `stage|lead|collaborators|supervisors|compute` shows no `supervisors:` and no `compute:` in any manifest. So case 3's Supervisor row, case 10's resource strip and case 7 need a planted fixture, and the brief does not say so.
2. **Case 2 says "Collaborator with the five that pass the stage filter".** Premise 8 says the count of 5 "is before the stage filter". The expected count is stated before anyone has applied the filter.
3. **spec.md:59 says "A step deletes the tests and entries its change makes obsolete"**, and spec.md:36 says the builder never edits `.scratch/`. Item 7 provides for moved rows only. The referrers.test.ts joint-work rows that are deleted are named by G32's clause at guarded.md:254, and the brief asks for no report section that lists deleted rows with the guarded clause naming them. Nothing in the brief brings that clause to the orchestrator.
4. **Decision 6 decides "No new test"**, since no guarded entry covers the strips. spec.md:59 says "A step that needs a new entry stops and asks Axel for it". Whether the three new pure joins need an entry is therefore Axel's question, and the brief settles it as a reversible decision without booking an open item. Under the standing demand "a decision for Axel is an open item booked in this file, or it is not raised", this is a decision taken in the brief that spec.md routes to Axel.

**Cases that ask the builder to check a place the step does not change:**

- **Case 15.** The unknown-flag finding comes from the hub layer's shape check (`src/lib/data/sources/config/merge/hub-layer.ts:597` calling `shapeIssues`, `src/lib/data/shapes/shape-issues.ts:37-40`), which the step does not change. Only the options row it is derived from changes. The brief's claim "gets the finding any unknown flag gets today" has no command behind it in the brief, and I did not run one.
- **Case 16, second half.** The category finding is raised by `src/lib/data/helpers/hub-names.ts:357-363` (`findings.collections.category_unknown`), which the step does not change.
- **Case 13.** The question is drawn by `src/lib/views/shared/forms/entry/DeleteAsk.svelte:37`, which the step does not change; it reads `referrersOf`, which the step changes.
- **Case 12.** The editor showing `tags` and `note` depends on the hub commit landing. The builder can neither run nor check this; it is a look on landing.

## The question

The question asked of each item: could this pass without the goal being reached?

**Cases:**

- **Case 1:** yes, for the hub. The case-run over the demo proves the join, but whether amir-haeri's card draws one Collaborator row rests on the look. The look is named, so the risk is covered.
- **Case 2:** yes. The expected "five" may be wrong after the stage filter (see above), and a run that shows fewer would read as a failure when it is not.
- **Cases 3 and 4:** no, if run over planted data with a supervisor. On the demo as it stands, case 3 cannot fail on the Supervisor row because the demo has no supervisors.
- **Cases 5 to 7:** no.
- **Cases 8 and 9:** no, if run over a planted affiliation. As hub cases the builder cannot run them.
- **Case 10:** yes, on the demo: no demo manifest has `compute:`, so "no strip" passes trivially for every resource.
- **Case 11:** no.
- **Case 12:** yes. The editor shows whatever the hub's schema holds, so the case says nothing about the step's code; it checks the hub commit.
- **Case 13:** no.
- **Case 14:** yes. With the demo's entry and file both gone, "no finding for the missing joint-work file" passes trivially. The real risk is a hub whose own list or chat_context still names the key.
- **Cases 15 to 17:** no.
- **Case 18:** yes. A fresh workspace passes while every saved layout that pins `joint-work` (the shipped default pins it at layout.yml:116) behaves in a way the brief never states.

**The step line's check:** the line names none.

**"What to build":**

- **Item 1:** yes. It can pass while the hub's own `.oculus/config.yml` still names `joint-work` (in its collections list, `chat_context` or a layout), which Hub text never addresses. It can also pass while HELP.md:52 and :547 and behavior.yml:161 stay false. Verify 5 would print those lines, but they are outside the paths, so the builder can only name them.
- **Item 2:** no. Verify 4 (unused exports) and verify 5 (the grep) would catch leftovers.
- **Items 3 to 5:** yes, at the unit level. `npm run test:quick` contains no test of the strips (decision 6, and `git grep -ln "crossLinks" -- tests` prints nothing), so a green list says nothing about them. The case-run program covers only the pure functions. The wiring in `EntryCard.svelte` (dispatching on `held.registry`) and the drawing in `RecordCard.svelte` rest on the look alone.
- **Item 6:** no, judged by reading and the folder check.
- **Item 7:** yes, for the guarded ledger. The moved rows pass while G32's guarded.md:254 clause still names deleted rows.
- **Item 8:** yes. The listed lines can all be rewritten while HELP.md:52 and :547, data-map HEAD:69 and the fence at templates.md:1257 stay wrong.

**Hub text:** yes. The brief gives no check for the hub commit, so the goal's data move can land without being verified. Missing checks include a parse of people.yml after the edit, that each of the ten people received exactly one `tags:` and one `note:`, that no person already had either key, that the joint-work file held exactly one entry per person, and that `gen_figures.py` runs.

The step also drops every joint-work field other than `note` and `tags` (title, status, meta, deadline, followup). Ruling 470 (a) moves only those two, but the brief does not say what the hub's entries hold in the dropped fields.

## Implied inputs

These are inputs the step implies but never states, with the expected result for each. The cost of a wrong answer is my judgment.

**The strips:**

1. A people collection keyed otherwise (`registry: people` under another key). G32 already has the row "a person of a people registry keyed otherwise opens the Person view". Expected: role rows are drawn. Missing; a wrong answer costs a hub that keys its people file otherwise.
2. A collection keyed `people` that names no registry. G32 has "an entry of a collection keyed people that names no registry opens the entry view". Expected: no role strip, and the entry's `related:` list strip. Missing.
3. A hub whose `roles:` is empty, or lists none of the three fields (a hub replaces the list whole, premise 7). Expected under item 3: no person strip at all. Missing; a wrong answer silently removes the feature for that hub.
4. Two `roles:` rows naming one field (for example `{ key: coauthor, field: collaborators }` added). `rolesOf` dedupes by key only (roles.ts:35-43). Expected under item 3: two rows holding the same projects. Missing.
5. A person, organisation or resource of hub B referred to by projects of hub A through cross-hub resolution (`affiliations` and `resourceIds` are resolved ids, merge.ts:152, referrers.ts:109). Expected: included exactly when the reference resolves to that record. Case 11 covers people only.
6. The user's own organisation. Expected: its strip holds every project the user is on, about the whole portfolio. Case 8 implies this without saying so.
7. A person only on `waiting-on`. Expected: no strip. Missing; this is a low cost.
8. A project at a stage in none of the three groups that is not dead. Expected: left out (decision 4). Missing as a case.

**The joins on the demo:** no `supervisors:` and no `compute:` exist in any demo manifest, so the case-run needs planted manifests for the Supervisor row and the resource strip. The brief does not say so.

**Removing the flag and the readers:**

9. A saved layout that pins `joint-work`. This has happened: the shipped default pins it (layout.yml:116), so every existing workspace holds it. Decision 7 says it behaves "as any removed view does" but never states what is seen. Missing; the expected result should be stated after a reading of what the layout reader does with an unknown view id. I did not read it.
10. A hub `.oculus/config.yml` whose `chat_context` names `joint-work`. Expected: the finding `chat_context` gives for a key no collection holds, read from settings.ts rows around tests/data/sources/config/settings.test.ts:810. Missing.
11. The academic page's rail badge after the badge row leaves. Expected: the badge sum excludes joint work. Missing; it is a visible change.
12. The People collection view's cards once the people schema gains `tags` and `note`. Expected: chips and body text on every person card that has them (kindOf at `src/lib/state/boards/collection/index.ts:192-200`). Missing from the cases and from the before/after.

**Moved test rows:**

13. Moving the G66 and G67 vehicles into a planted file that already exists in `tests/data/snapshot/reference-hub.ts` (for example `tasks.yml` at :126) shifts the lines and columns other rows assert. Expected: listed in the assertion-change table. The brief asks for that table in general but does not name this consequence.
14. The rows 'a waiting-on value that names a person' and its neighbours at references.test.ts:126 and :150 list `hub:.oculus/data/academic/joint-work.yml:5:13` among their references. Expected: that reference moves to the new vehicle or is removed, an assertion edit to list. Not named.
15. The G32 hub-portfolio row at :221 asserts `merged.relations.jointWorkPerson`, a relation that leaves. Expected: a field of another collection or a manifest that resolves `ghost` in the primary with no finding. The brief does not name the replacement relation or field.
16. The G32 row in collections.test.ts (:37, :90) and settings.test.ts:803 (`FIVE`) use `joint-work` only as a key. Expected: renamed or reworked. Neither is in item 4's vehicle bullet.

## ADRs

`ls -d docs/adr` printed `ls: docs/adr: No such file or directory`. `grep -n -i -w "adr" .scratch/migration/orchestrator-state.md .agents/plan.yaml` printed nothing. `.agents/plan.yaml:6` is `standards: [.scratch/migration/agents/spec.md]`. No ADR folder exists and no `adr` key is configured, which agrees with brief line 5.

## Dictated text

`grep -n "filtered by\|Free notes on the person\|used by a project's lead\|work with one person\", \"joint-work.yml\|in place of \`.oculus/data/academic/joint-work.yml\`" .scratch/migration/agents/briefs/O91.md` finds lines 65, 67 and 68.

- **Line 65,** `help: "Words the person's card is filtered by."` Holds every prose rule of spec.md "The working rules" (ASCII, no em dash, no quip, plain sentence). The sentence is false as dictated. A tags field is a filter only when its schema line says `filter: true` (`docs/HELP.md:278`: "A field whose schema line says `filter: true` is a filter in the bar ..."; `src/lib/data/snapshot/schema/run.ts:222`), and the dictated row `- { field: tags, type: tags, help: ... }` has no `filter: true`. That breaks spec.md "What every package obeys" at :71 ("A sentence in a document or a head comment that the change makes false is a defect of the change").
- **Line 65,** `help: "Free notes on the person and the work with them."` Holds.
- **Line 65,** `"The person's key, used by a project's lead, collaborators, supervisors and waiting-on."` Holds the prose rules. It names only the project's fields, while the entries of funding, events, education, applications and tasks also name people in `lead`, `collaborators` and `supervisors` (data-map at main's head, the lines after :179), and `self` of `local.yml` names one. The sentence is incomplete but not false.
- **Line 67,** the owner row `("work with one person", "joint-work.yml")` and link row `("joint-work.yml", "person", "people.yml")`. These are removals, not dictated text.
- **Line 68,** `names \`.oculus/data/people/people.yml\` in place of \`.oculus/data/academic/joint-work.yml\``. A path swap. Holds.
- `LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/briefs/O91.md` printed nothing (exit 1). The brief is ASCII.

No other line of the brief dictates file text. Item 8's HELP.md:301 sentence is a requirement without words.

## Other findings

**Steps in flight share O91's paths, and the brief does not mention it.** `grep -n "O87\|O88\|O94" .scratch/migration/agents/briefs/O91.md` exits 1. The state file's dispatch block (orchestrator-state.md:27-57) gives:
- O87: `docs/templates.md` 64-68, `docs/HELP.md` 547, and `config/options/sources.yml` 78-90.
- O88: `config/catalogs/vocab.yml` and `src/lib/data/helpers/hub-names.ts`.
- O94: `docs/templates.md` 664-691.

O91 writes `docs/templates.md:66`, inside O87's range. It needs HELP.md:547 and behavior.yml:161, which O87's worktree diff already rewrites (`git diff HEAD` in `.agents/worktrees/migration-O87`, hunks at its lines 88-89, 270-271 and 426-429, each still naming joint work). O91's dispatch entry (orchestrator-state.md:68-70) has no `shared_paths:` yet.

## Declined to judge

- **Premise 8's counts** (amir-haeri 11, van-den-berg 5+1, Guichelaar 5, the user 94/4/17, utwente 9, this-mac 8): from the research hub, which I may not read.
- **The hub keys in the cases** (`university-of-twente`, `mst`, `utwente`, `data`): research hub data.
- **Hub text premises:**
  - that the hub's joint-work file names exactly those ten people, one entry each
  - that no person entry already holds `tags:` or `note:`
  - that the hub's people schema has a `links` row and its `key` row's present help
  - `funding/2026-fwo-senior-stopped-meyfroidt/README.md:45`
  - `docs/figures/gen_figures.py`'s rows
  - whether the hub's `.oculus/config.yml` or its workspace file names `joint-work`

  All need a read of the research hub, which I may not do.
- **The finding case 15 expects:** I did not run a planted hub to see the finding text for `collections.N.joint_work`. I only read that `shapeIssues` gives `findings.config.shape_unknown` for unrecognised keys.
- **What a saved layout pinning a removed view shows** (implied input 9): I did not read the layout reader.

Usage: a9938b4abd405e606, claude-opus-5-5, 228428 tokens, 71 tool uses, 11 min 7 s

## Closed

Each finding, closed by a change to `agents/briefs/O91.md` before the preparation commit:
- Names 1-3 (HELP.md:52 and :547, behavior.yml:161): added to premise 3, item 1, item 8 and the paths; the overlap with O87 on the same lines is named in premise 3 and in the dispatch entry's `shared_paths`.
- Names 4 (data-map HEAD:69): added to premise 3 and item 8's Doc text.
- Names 5 (the fence at templates.md:1257): the range is 1233-1258 in premise 3, item 8 and the paths.
- Ledger lines 158 and 254 (G66's and G32's Test lines): premise 4 names G32's clause; item 7 and the report ask for each deleted row with the entry and clause that name it, for the orchestrator's rewrite at landing.
- The step line (ruling attribution at brief line 20): rewritten; the pickers come from the step's line.
- Premise 4's vehicle rows: premise 4 now names hub-keys.test.ts:251-261, the references.test.ts rows at :126 and :150, collections.test.ts:37 and :90, settings.test.ts:803, and that the G8 and G32 rows of hub-writes and hub-portfolio are tied by their titles only; item 7 names the replacement for the `jointWorkPerson` assertion, the shifted assertions and the two key-only rows.
- Cases and checks 1 (hub cases the builder cannot run; no supervisors or compute in the demo): every strip case runs in a case-run program on planted inputs (premise 10), and the hub keys are looks on landing.
- Cases and checks 2 (case 2's "five"): the count is gone; premise 8 says the hub counts are before the stage filter.
- Cases and checks 3 (deleted rows not reported): item 7 and the report.
- Cases and checks 4 (decision 6): closed on the test rule: a wrong strip costs no lost work, no broken installation and no wrong configuration accepted, so no guarded entry is needed and `spec.md:59`'s stop does not arise; decision 6 says so.
- Case 15 and 16 (unchanged code): kept as cases of the behaviour the change makes (the flag and the category become unknown), case 19 asks for the finding's text from one run.
- Case 12 (hub commit): case 17 is a look on landing.
- Case 14 (trivial): removed; case 20 covers a hub `chat_context` that still names the key, from the reading of `files.ts:153-180` (premise 12).
- Case 18 (saved layout): the layout reader was read (`strip-tab.ts:43-45`, `AppFrame.svelte:340`); premise 11 and case 22 state what is seen.
- Hub text checks: added under Hub text.
- Dropped joint-work fields: premise 13 lists them; `title` holds text the notes lack in some entries, so it is open item 489 (kind 2, it deletes data), booked in the state file; the hub commit waits for it.
- Implied inputs 1-8, 11, 12: cases 6, 7, 10, 11, 12, 13, 14, 16, 23, 24. Inputs 9, 10: cases 22 and 20. Inputs 13-16: item 7.
- Dictated text: the tags help is "Words that describe the person and the work with them."; the key help is "The person's key, which the lead, supervisors, collaborators and waiting-on of a project or an entry name."
- Shared paths with O87, O88 and O94: in the dispatch entry's `shared_paths`, each judged a simple merge.
- Hub reads the agent declined: the orchestrator read the hub's joint-work file (ten entries, one per person, fields as premise 13 says), its people schema (premise 13), and grepped its `.oculus/config.yml` and workspace file for joint, which print nothing.
