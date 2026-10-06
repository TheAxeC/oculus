# Step Q125 brief check (on main at bc42cb101)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/Q125.md` (the uncommitted working copy). I changed no file.

**Summary of what needs changing before dispatch:**
- Four premises are wrong:
  - DESIGN.md already shows all nine diagrams, not seven.
  - The example in case 12 is wrong: "Q125" does not fail G22's audit.
  - The command in case 7 misses 11 views.
  - "The tests whose imports name a moved file": none exist.
- The paths list misses files that the change makes false or has to edit:
  - `src/lib/data/model/index.ts`, which re-exports `ManualPart`.
  - `server/content/diagrams.ts` and `utils/diagrams/diagrams.mjs`, whose comments say the diagrams are for the Help view.
  - `tests/checks/config/config-folder.test.ts`, if the diagram words move to a text file of their own.
  - The 61 files whose comments cite DESIGN.md sections by name.
- `views/shared/` already holds 10 items, so a new folder there fails the ten-item folder check.
- Implied inputs with no case:
  - Pressing a relative link to a guide navigates the oculus page itself away (`jump.ts:31` handles only `#` links).
  - The address a guide uses for a diagram.
  - An engine directory outside the hub.
  - A diagram name the route answers 404.
  - Whether the new guides go onto the Help page's arrangement, as E4g's Apps guide does.
- The verify list leaves out the tree checks the step touches, refers to a "filter" and to "rules on list items and sentence length" that the rules file does not have, and does not name the base copy.
- Item 5's accounting counts lines, which are always 1 for a one-line item, so a lost decision would not show.

## 1. Names

- HELP.md's sections:
  - `grep -rn "HELP.md#" src config tests docs README.md DESIGN.md`: no output, exit 1.
  - A grep for heading anchors (`#the-`, `#source-control`, `user-content-the`, ...) and for quoted section names across `src config tests utils docs README.md DESIGN.md HELP.md`: no output.
  - Outside oculus, `grep -rln "HELP\.md"` over the hub (worktrees, `.git` and `secrets` excluded) finds `README.md:34` (the cockpit's HELP.md, unrelated) and `docs/DATA-MAP.md:218` ("oculus's manual, `tools/oculus/HELP.md`"), which stays true.
  - No hit is made false.
- `renderManualParts`, `ManualPart`, `Diagram.svelte`, `manual.ts`, `newest.ts`, `loadDiagram`, `newestAnswer`, `views/system/help`: `grep -rn "renderManualParts\|ManualPart\|views/system/help\|help/Diagram\|help/manual\|help/newest\|newestAnswer\|loadDiagram\|renderManual\b\|MANUAL_PARAM\|\bMANUAL\b" src tests config utils docs README.md DESIGN.md HELP.md agents/guarded.md`. The hits outside the brief's paths:
  - `src/lib/data/model/index.ts:377: ManualPart,`. A rename of `ManualPart` (item 7) has to edit this file, which is not in "Paths this step writes".
  - `tests/checks/config/config-folder.test.ts:278: 'views/system/help.yml',` stays true while the file stays. Its list `CATALOG_FILES` is asserted exactly (`:296-301`, `expect(names).toEqual(CATALOG_FILES)`). If the builder moves the keys `help.diagram_loading` and `help.diagram_failed` (`Diagram.svelte:49,51`) to a shared text file, this test has to change. The test is not in the paths, and the brief says G22's test is the only test the step changes.
  - No test imports `Diagram.svelte`, `manual.ts` or `newest.ts` (no hit under `tests/`). The paths entry "the tests whose imports name a moved file" names nothing that exists.
- Phrases about the Help view drawing the diagrams: `grep -rn -i "help view\|the manual\|manual's\|HELP\.md" src tests config utils`. The hits outside the paths that the change makes false:
  - `src/lib/server/content/diagrams.ts:2` ("served read-only to the Help view") and `:14` ("The Help view passes what this answers through ui/html.ts's graph filter"): after the change the doc view draws diagrams and the Help view draws none.
  - `utils/diagrams/diagrams.mjs:24`, `:56` ("Every diagram, in the order the Help view and DESIGN.md name them"), `:88-93` ("the Help view's graph filter"): the same.
  - `tests/checks/diagrams/diagrams.test.ts:15` ("What this does not cover is the Help view drawing a diagram"): the same.
  - `tests/checks/config/config-folder.test.ts:3` ("the one line the Settings view and the manual show"): the configuration table moves from the manual to `docs/configuration.md`.
  - `src/lib/views/shared/prose/jump.ts:12` ("the doc and help views"), `CodeText.svelte:8,39`, `Cards.svelte:319` and `Project.svelte:35`: these stay true.
- DESIGN.md's section and paragraph names, which item 5 rewrites. `grep -rl "DESIGN\.md" src tests utils config | wc -l` prints 61. The names quoted in those comments, from `grep -rhno 'DESIGN\.md[^"]\{0,20\}"[^"]\{2,60\}"'`:

  | Name | Times quoted |
  |---|---|
  | Auth | 13 |
  | The socket | 4 |
  | PTY | 4 |
  | Git | 3 |
  | Apps added while oculus runs | 2 |
  | Approval | 2 |
  | Watchers | 1 |
  | sessions are six views, not one | 1 |
  | Sessions | 1 |
  | Normalise | 1 |
  | Layer 1, data | 1 |
  | Hot reload | 1 |
  | Client state | 1 |
  | Boundaries | 1 |

  Unquoted references also exist: "wire model", "boundary table", "Untyped", "Opening things in", and "third row of Hot reload" / "Hot reload, second row".
  - Examples: `src/lib/server/core/auth.ts:1`, `src/lib/server/root/socket.ts:1`, `tests/checks/tree/boundaries.test.ts:1` (section "Boundaries"), `tests/server/machine/apps/manifest.test.ts:1` ("Apps added while oculus runs"), `src/lib/server/machine/approvals/approvals.ts:1` ("Approval" paragraph).
  - Rewriting DESIGN.md "to its decisions" makes each comment false whose name it drops or renames.
  - The brief does not tell the builder to keep these names, and none of the 61 files is in the paths.
  - Three of the references are already false on main: `deposit-git.ts:17,299` ("DESIGN.md's step 6"), `root/hooks.ts:1` ("step 5") and `boards/editor/Editor.svelte:15` ("step 4"). `grep -n "^[0-9]\+\. " DESIGN.md` prints nothing, so DESIGN.md has no numbered steps.
- The `docs:` labels and the key sheet row: `config/layout.yml:176-180` and `config/text/app.yml:12` are in the paths.
  - The Help page's arrangement `config/layout.yml:92-98` lists the Help page's tabs.
  - E4g adds the Apps guide there too: `diff tools/oculus/config/layout.yml .agents/worktrees/E4g/tools/oculus/config/layout.yml` shows `:93` gaining `{ view: doc, state: { id: tools/oculus/docs/apps.md, ... label: "Apps guide" } }`.
  - The brief's write range (lines 176-180) excludes the arrangement and says nothing about whether the new guides and Design join it.
  - HELP.md's rail paragraph lists the Help page's tabs.
- `agents/guarded.md` entries whose Code or Test lines name these files: `grep -n "docs.ts\|docs.svelte\|help/\|Diagram\|newest\|manual\|catalogue.ts\|layout.yml\|app.yml\|history.test\|diagram\|Doc.svelte"` hits G22 (`history.test.ts`), G25 (`diagrams.test.ts`) and G12 (config tests, `:115` and `:149`). G16 (`boundaries.test.ts`, the import graph) covers moving a component between view folders. No entry names `docs.ts`, `docs.svelte.ts`, the help files or `Doc.svelte`.

Findings:
- (a) `src/lib/data/model/index.ts:377` has to change with the rename and is not in the paths.
- (b) `server/content/diagrams.ts:2,14`, `utils/diagrams/diagrams.mjs:24,56,88-93`, `tests/checks/diagrams/diagrams.test.ts:15` and `tests/checks/config/config-folder.test.ts:3` become false and are not in the paths, and item 10 does not list them.
- (c) Rewriting DESIGN.md can make up to 61 files' comments false. The brief has to either require every cited name to stay as a heading or bold label, listing the names above, or widen the paths and item 10 to those files.
- (d) Where the two diagram text keys go is not said. A new text file forces a change to `config-folder.test.ts`'s exact list, which conflicts with "G22's test is the one test this step changes".
- (e) The Help page's arrangement (`layout.yml:92-98`) is left undecided, while E4g put its guide there.
- (f) The paths entry "the tests whose imports name a moved file" names nothing that exists.

## 2. The step line

- "HELP.md becomes the user's guide alone (what each page and view is for, how to do the common things, the keys, links to the guides)": item 1. The links work only in a Markdown reader outside oculus; see section 6.
- "the detail moves to guides in `tools/oculus/docs/` (the configuration reference in `docs/configuration.md`, Source Control in a guide of its own, beside `docs/apps.md`)": items 2 and 3.
  - "beside `docs/apps.md`" has no instruction for the detail of HELP.md's Apps section (`:210-221`, manifest keys, approval, limits).
  - Item 1 sends detail "to the guide that owns it", which is E4g's `docs/apps.md`. That file is not in Q125's paths and is not on the base until E4g lands.
- "the developer sections move to README.md and DESIGN.md": item 4.
- "DESIGN.md is rewritten to its decisions without the step-by-step detail": item 5. The same E4g problem applies to DESIGN.md's "Apps added while oculus runs" (`:252-342`), whose step-by-step detail would go to `docs/apps.md`.
- "the Help view ... follow[s]": items 7 and 8.
- "`tests/checks/source/history.test.ts` follow[s]": item 9.
- "`spec.md:66` and the brief template say ...": item 11, with the brief's correction that "the brief template" means the state file's standing demand. That correction resolves a clash between ruling Z636 ("the brief template") and the standing rule `orchestrator-state.md:109` ("Skills are never edited, ever"). The hub's rules route a clash between two rulings to Axel. The brief resolves it itself, and neither `choices.md` nor the state file's open items holds it (`grep -n Q125 orchestrator-state.md choices.md` hits only the Z643 entry).
- "Axel reads the new HELP.md and DESIGN.md before the landing": the paragraph under "What to build" ("the builder's report gives both whole as paths and the orchestrator shows them to him").
- "launched beside the steps in flight, whichever ... lands second carrying the other's text (Z642)": the section "Steps writing the same documents".

Findings:
- The Apps detail in HELP.md `:210-221` and in DESIGN.md `:252-342` has no destination inside the paths.
- The template correction resolves a ruling clash without Axel; it should be booked as an open item or as a choice.

## 3. Premises

- Step line `plan.md:644`: `grep -n "^- Q125 " plan.md` prints 644. Matches.
- Z636, Z642 and Z643 at `plan.md:1383`, `:1389` and `:1390`. Their words match the brief's summary.
- `plan.md` has no section called "Goal" (`grep -n "^## " plan.md`: Packages, Could run in parallel, Rulings, Agents, Blocked). I took the goal from the task prompt.
- `wc -l HELP.md` prints 375; `grep -n "^#" HELP.md` matches every line number given. The brief leaves out `## Contents` at `:5`, which holds `[TOC]` at `:7`. Source Control has 11 subsections (`:226-268`). Matches.
- DESIGN.md: 436 lines; `grep -n "^## "` matches every section and line; `awk 'length>1500' DESIGN.md | wc -l` prints 76. Matches.
- "DESIGN.md already holds seven of HELP.md's nine diagrams": wrong.
  - `diff <(grep -o "docs/diagrams/[a-z-]*\.svg" HELP.md | sort) <(grep -o ... DESIGN.md | sort)` prints nothing ("same nine"), and `grep -c` gives 9 for each file.
  - DESIGN.md `:120`, `:152`, `:188`, `:190`, `:192`, `:194`, `:196`, `:198` and `:200` are nine images.
  - Item 4's "the two HELP.md has that DESIGN.md lacks" describes nothing that exists.
- README.md: 38 lines; the contents are as the brief says; the verification commands are at `:17`. Matches. The pointer "HELP.md describes what the app adds to the page" is at `README.md:9` (the brief gives no line).
- `ls docs` prints `diagrams`. Matches.
- E4g's `config/layout.yml:176` is `- { label: "Apps guide", path: tools/oculus/docs/apps.md, group: help }`. Matches. E4g also changes the arrangement at `:93` and HELP.md `:82` (`h1-h7`), `:21` and `:220`.
- `Help.svelte` 99 lines; `Diagram.svelte` 71; `docs.ts:298` `export function renderManualParts`; `docs.ts:400` `export function renderHubDoc`; `docs.svelte.ts:46-50` is the `parts` comment and field. Match.
- `catalogue.ts:159` is the doc comment of `keyOf`, and `at < 9` returns `''` past the ninth. Matches.
- `app.yml:12` holds the `rows` string with "h1-h6 | open the manual, the Memories wall or a hub document, the Help page's group"; `HELP.md:82` holds the same row. Match.
- `history.test.ts:21` is `const DOCS = ['HELP.md', 'DESIGN.md', 'README.md'];`. Matches. The words "the three documents" also stand at `:4-5`, `:20` and `:111`, so more than line 21 changes.
- `grep -rln "HELP.md" src config tests utils` prints the 8 files the brief lists. Matches. The docs.ts comment lines `:11`, `:268`, `:287` and `:549`, and `MANUAL` at `:534`, match.
- `DESIGN.md:388` is "The manual, the configuration and the hub's own documents ..." (2348 characters). Matches.
- `agents/spec.md:66` is the line quoted. Matches.
- `grep -n "Every brief also lists" orchestrator-state.md` prints 186 in the working copy. In the committed HEAD the same text is at line 185 (`git show HEAD:...| grep -n` prints 185), so "on main at bc42cb101" is line 185 and the working copy is line 186. The "Doc text" item asks for the line as `grep -n` prints it at the time, so this does no harm.
- The template correction: `grep -n "HELP\|DESIGN" ~/.claude-work/skills/spec/templates/brief.md` prints nothing (exit 1). Matches. The template does define a "Doc text" section (`brief.md:103-104`).
- Layer rule: DESIGN.md `:178` lets `views/` import `ui/, state/, views/shared/, ...`. Matches.
- Not stated by the brief but bearing on its premises:
  - `git ls-files src/lib/views/shared | awk -F/ '{print $5}' | sort -u | wc -l` prints 10, and `utils/folder-check.sh` refuses more than ten. A new folder under `views/shared/` fails; moving three files into `prose/` (8 files) gives 11 and fails too.
  - A placement that passes is `views/shared/prose/<folder>/`, which gives prose 9 items.

Findings:
- "seven of nine diagrams" is false: all nine are in DESIGN.md.
- `views/shared/` is full, and the brief's "a folder the builder names" should name a place that passes the folder check.
- The brief omits HELP.md's `## Contents` / `[TOC]` (`:5-7`).
- The state-file line is 185 at the base commit and 186 in the working copy.

## 4. Cases and checks

- Cases 1-5: text cases checked by reading. Consistent with the rules file.
- Case 6: consistent, but it needs the base HELP.md.
  - The brief names no base copy. The standing demand `orchestrator-state.md:186` says "every brief names, under 'What is on the tree', a base copy `.agents/worktrees/<step>-base/tools/oculus/`"; `grep -n "base copy\|-base" Q125.md` finds it only in Verify item 6.
  - The builder runs no git command. The base copies of other steps (`ls .agents/worktrees/Q123-base/tools/oculus`) hold HELP.md and DESIGN.md but not README.md, and case 4, item 4 and case 8 need the base README.md.
- Case 7: the command is wrong.
  - `grep -rn "id: '" src/lib/views --include="*.svelte" -h` yields 110 distinct values, about 60 of which are not views (`add-folder`, `dayGridMonth`, `staged`, `prio:`, ...).
  - It misses 11 views that HELP.md's table has: applications, archive, coauthor, code, education, events, funding, joint-work, projects, statements, tasks. These are registered through maps such as `views/boards/collection/Collection.svelte:13`.
  - A dropped row for any of those 11 would pass the case.
- Cases 8-11: consistent. Cases 9-11 are runs and keep no test, which the rules file's test rule allows.
- Case 12: consistent with the test rule, since it is G22's test.
  - The claim "A guide holding a plan id such as 'Q125' fails it" is false. The audit's family is `Q[0-9]{1,2}[a-b]?` followed by `([^A-Za-z0-9]|$)`.
  - A node run of `HISTORY` printed `"Q125" false`, `"a Q125 b" false`, `"E4g" false`, `"PR1" false`, `"Z643" false` and `"Q12 x" true`.
  - An example that does fail is "D23" or "O30b".
- "Verify before you report":
  - It says "each output piped through the filter the rules file names". `grep -n -i "filter\|pipe" agents/spec.md` prints nothing, so there is no such filter.
  - Item 7 cites "the rules file's rules on list items and sentence length". `grep -n -i "sentence length\|list item"` over spec.md and the state file prints nothing.
  - `npm run test:quick` leaves out every test under `tests/checks` (`tests/tiers/quick.mjs:124`). The rules file says "A step whose change touches an entry's code runs that entry's test". The step moves components between view folders (G16 `boundaries.test.ts`), redraws diagrams (G25 `diagrams.test.ts`), changes folder counts (`size.test.ts` runs `folder-check.sh`) and may change the text-file list (`config-folder.test.ts`, under G12). The verify list names none of these files. `grep -ln "@module-tag slow"` over them prints nothing, so none is tagged slow.
- Cases that ask the builder to check a place the step does not change: case 7 reads the registrations, which is reading for the account and acceptable. No other.

Findings:
- Case 7's command misses 11 views and takes in about 60 values that are not views.
- Case 12's example is false.
- The base copy is not named, and README.md has to be in it.
- The verify list refers to a filter and to rules that do not exist.
- The verify list lacks `npx vitest run tests/checks/tree/boundaries.test.ts tests/checks/tree/size.test.ts tests/checks/diagrams/diagrams.test.ts tests/checks/config/config-folder.test.ts`.

## 5. The question

The goal: a short user's guide, the detail in guides, DESIGN.md stated as decisions, and nothing a reader needs lost.

- Case 1: yes, it could pass without the goal. The row and a link `docs/source-control.md` can be there while a press on that link in the Help view navigates the oculus page to `/docs/source-control.md`, because `jump.ts:31` handles only `#` and `html.ts` `markLinks` targets only outward schemes.
- Case 2: no.
- Case 3: yes, for the same link reason.
- Case 4: partly. "Each said once" is read in README.md only; a command repeated in HELP.md or DESIGN.md passes.
- Case 5: yes. One sample decision cannot show that the other 73 items are intact.
- Case 6: no, given the base HELP.md.
- Case 7: yes; see section 4.
- Case 8: yes.
  - It accounts for HELP.md's paragraphs and the items of "Decisions taken" only. DESIGN.md `:1-360` (Layer 1-3, the Apps section, Hot reload, Boundaries) is outside it, and a lost paragraph there is not seen.
  - "Line count before and after" is 1 to 1 for every one-line item, whatever was cut.
- Case 9: it could pass vacuously.
  - The third path `docs/DATA-MAP.md` has no image (`grep -c "!\["` prints 0), so "drawn as now" tests nothing. `docs/RESEARCH-APPROACH.md` (5 figures through the file route) would test it.
  - The case does not say that the scratch hub holds the scratch engine at `tools/oculus`. Without that, `tools/oculus/DESIGN.md` is not under the engine and the expected result fails, or the builder bends the rule to get it.
- Case 10: no.
- Case 11: no.
- Case 12: yes. The widened audit passes over a guide holding Q100 and above, PR, Z, G or E4g ids (see section 4), so the convention "No plan id ... (G22)" is not enforced for the ids this plan now uses.
- Step-line check: no requirement fails to map (section 2), but the goal "links to the guides" is not met inside oculus.
- Item 1: it could pass at 150 lines with detail dropped. Case 8's paragraph account guards it, provided the account is read.
- Item 4: the false premise could lead to a duplicate diagram or to a search for two diagrams that do not exist. "No diagram is shown twice" limits the harm.
- Item 5: yes; see the sonnet question below.
- Item 6: it could pass with the guides missing from the Help page's arrangement, which is undecided.
- Item 7: it could pass only for the engine-in-hub layout (section 6).
- Items 9-11: see case 12 and section 2.

Can a sonnet builder do item 5 without losing a decision? Not with the brief as written.
- DESIGN.md is 348,197 bytes (`wc -c`) against 165,665 for HELP.md, and both are to be read whole and largely rewritten.
- "Decisions taken" is 74 items totalling 169,928 characters, the longest 12,255 (`awk 'NR>=361 && /^- /'`, `awk 'NR>=361{print length}' | sort -n | tail`).
- Another 61 files cite DESIGN.md by section name.
- The orchestrator state names the worker as Claude Sonnet 5.5 (`orchestrator-state.md:175`).
- The brief's only means of making a loss visible are the line counts per item (always 1) and Axel's read, and a read cannot show an absence.

What would make a loss visible:
- A table in the report with one row per paragraph of every DESIGN.md section, not only "Decisions taken", giving:
  - its first words;
  - its character count before and after;
  - the decision sentence kept, quoted;
  - for each removed run of sentences, the destination: a guide section, or the head comment's `file:line` that already says it.
- A check that every DESIGN.md name cited in code (section 1) still stands as a heading or bold label, quoted with its `grep -n`.
- A reviewer told to read the old and new DESIGN.md side by side against that table.

Under the hub rule "If a task is too large to finish, say so before starting it", the orchestrator should judge whether one sonnet builder can carry both rewrites. Z636 keeps DESIGN.md in the same step, so a split needs Axel's ruling.

Findings: cases 1, 3, 5, 7, 8, 9 and 12 and items 5, 6 and 7 could pass without the goal, for the reasons above.

## 6. Implied inputs

- A press on a relative link to a guide (`docs/configuration.md`) in the Help view, or on a link between guides and DESIGN.md (`../HELP.md`) in the doc view: missing.
  - What happens now: the sanitiser keeps a relative href (`html.ts:109-114`), `markLinks` gives no target to it (`html.ts:153-158`), and `jump.ts:31` returns for anything but `#`. The browser navigates the oculus page, or the app window, away to `/docs/configuration.md`.
  - Expected: the press opens that guide as a `doc` tab, by the rule for where an opened tab lands, and the page stays. This is a user-visible behaviour the brief must state, or rule on.
- Links into HELP.md anchors from elsewhere: none exist (section 1), so nothing is missing.
- `[TOC]` in HELP.md (`:7`): not stated. Expected: HELP.md keeps it, and its entries follow the new sections. Help.svelte's TOC style (`.view :global(.doc ul.toc li)`) stays.
- The engine directory outside the hub (`--engine <dir>` in the server or the app), or a hub whose `tools/oculus` is not the engine (`hub` in `local.yml`): missing.
  - The `docs:` entries are hub-relative (`tools/oculus/DESIGN.md`) and `/api/diagrams` serves the engine's `docs/diagrams/`.
  - Expected: a hub document whose real path is not inside the engine's real path is drawn as now, with images through the file route. The test is made on real paths, so a symlinked checkout still counts as inside.
  - Case 9 should state its scratch layout: hub with the engine at `tools/oculus`.
- The guides read in a Markdown reader outside oculus: missing.
  - A guide in `docs/` reaches a diagram as `diagrams/<name>.svg` and the manual as `../HELP.md`. `DIAGRAM` (`docs.ts:269`) matches only `^docs/diagrams/`, an address relative to the engine root.
  - The `figures()` pass (`docs.ts:254-266`, a `walkTokens` that runs before the renderer) rewrites a hub document's image href to `/api/file/hub/...` before `diagramOf` sees it.
  - Expected: a diagram is recognised by the path it resolves to (`<engine>/docs/diagrams/<name>.svg`) from the document's own folder, so `docs/diagrams/x.svg` in DESIGN.md and `diagrams/x.svg` in a guide are both parts, and both addresses work in a Markdown reader.
- The `doc` view's figures under the hub root (`../tools/figures/*.svg` in `RESEARCH-APPROACH.md`, `AGENT-APPROACH.md` and `HPC-UTwente-howto.md`): missing as a case. Expected: drawn as now, through the file route.
- A diagram name in a guide or in DESIGN.md that the route answers 404 (`docs/diagrams/nonesuch.svg`): missing. Expected: a diagram part, drawn as `Diagram.svelte`'s failure line ("The diagram nonesuch could not be drawn (...): npm run diagrams writes it."). An upper-case name (`Layers.svg`) fails `DIAGRAM`, stays an image and goes through the file route.
- Diagram names the route refuses (`../secrets.svg`, `docs/diagrams/../x.svg`): listed, case 10.
- The Help page's arrangement (`layout.yml:92-98`) gaining the guides and Design, as E4g did for the Apps guide: missing. Expected: the decision stated, and the rail paragraph of HELP.md matching it.
- HELP.md's Apps detail (`:210-221`) and DESIGN.md's Apps section when E4g has not landed on the base: missing. Expected: the detail stays in place, or the step waits for E4g. The brief should say which.
- A held answer: the 304 path keeps parts for a document that is not the manual. `docs.svelte.ts` reads `parts` for every answer once it is widened. Low cost, not listed. Expected: a 304 keeps the held parts.

Findings: the link press, the engine outside the hub, the guide's diagram address and the figure-rewrite order, the figures of a hub document, a 404 diagram name, the Help page's arrangement, and the Apps detail before E4g lands are missing from "Cases".

## 7. ADRs

- `ls docs/adr` at the hub root prints "No such file or directory", and so does `ls tools/oculus/docs/adr`. No record.

Findings: none.

## 8. Dictated text

- `{ label: "Configuration guide", path: tools/oculus/docs/configuration.md, group: help }`, `{ label: "Source Control guide", path: tools/oculus/docs/source-control.md, group: help }` and `{ label: "Design", path: tools/oculus/DESIGN.md, group: help }` (`grep -n 'label: "' Q125.md` finds them at line 33): hold. They parse as flow maps. The existing entries pad their columns; prettier formats YAML, so the builder runs `npm run format`.
- The key sheet and key table row "h1-h9 | open the manual, the Memories wall, a hub document or a guide, the Help page's group" (`grep -n "a hub document or a guide" Q125.md` finds line 33): holds under the prose rules (ASCII, no dash, no history). Every guide is also a hub document of the `docs:` list, so "a hub document or a guide" names one kind of thing twice. "or another hub document" would be exact, but this is wording, not a broken rule.
- The labels "Configuration guide" and "Source Control guide" match E4g's "Apps guide"; "Design" holds.
- The rule text of item 11 is given as content, not as exact words; its sense holds.
- `LC_ALL=C grep -n '[^ -~]' Q125.md` prints nothing. The one ` - ` hit is a nested bullet at `:150`.

Findings: none.

## Declined to judge

- I did not run `npx vitest run tests/checks/source/history.test.ts` on main, to leave the main checkout's caches untouched. I checked the audit's pattern with a node copy of `HISTORY`, which found no hit in HELP.md, DESIGN.md, README.md or E4g's `docs/apps.md`.
- Whether the "brief template" correction should go to Axel or stand under `orchestrator-state.md:109`: that is his call, raised in section 2.
- Whether 150 lines is reachable: the keys table (`:58-111`) and the views table (`:116-155`) are about 95 lines on their own. The brief allows an overrun with a reason.
- Whether one builder can carry both rewrites (section 5): the orchestrator's judgment, and a split needs Axel's ruling under Z636.
- The cost of the in-flight steps' merges under Z642: ruled, not judged here. `cmp` against main's working tree shows E4g, O30b, Q123 and Q124 differing on HELP.md, DESIGN.md or README.md. D23 and PR1 do not differ yet, and their briefs list HELP.md and DESIGN.md lines.
- `history.test.ts:128-131` carries a "Revert:" comment that describes a breakage check, which the rules file says the tree has none of. The comment predates this step, and the step writes that file only at line 21.

Agent usage: a401d3fdf1183fba1, claude-opus-5-5, 223,091 tokens, 83 tool uses, 12.3 min.

## Closed

- Names (a), (b), (f): closed, the paths name `data/model/index.ts:377`, `server/content/diagrams.ts`, `utils/diagrams/diagrams.mjs`, `diagrams.test.ts:15`, `config-folder.test.ts`; the nonexistent "tests whose imports name a moved file" is removed.
- Names (c): closed, item 5 keeps every DESIGN.md name a comment cites as a heading or bold label, with its `grep -n` quoted (verify 8); the three comments already false are rewritten and in the paths.
- Names (d): closed, the words move to `config/text/views/shared/diagram.yml`, and `CATALOG_FILES` changes with it (item 7, decision 5).
- Names (e): closed, item 6 puts the two guides on the Help page's arrangement as E4g's Apps guide; the paths name `layout.yml:92-98`.
- The step line, the Apps detail: closed, items 1 and 5 send it to `docs/apps.md` when E4g is on the base, and otherwise keep it and list it for the orchestrator's carry at the second landing.
- The step line, the template correction: closed, not a clash between rulings: Ordo's template holds no rule on HELP.md or DESIGN.md, so nothing in it is changed, and the rule Z636 names is in the plan's own two files; the premise says so.
- Premises: closed, all nine diagrams already in DESIGN.md (item 4 rewritten), `views/shared/` full (the folder `views/shared/prose/diagram/`), `[TOC]` kept (item 1), the state line's number is read at the time by `grep -n` as the Doc text section asks.
- Cases and checks: closed, case 7 diffs the old and new table and names the registry; case 12's example is "D23"; the base copy is named with HELP.md, DESIGN.md and README.md; verify names no filter and no nonexistent rule, and runs `boundaries`, `size`, `diagrams` and `config-folder` tests and `folder-check.sh`.
- The question: closed. Case 8's table covers every paragraph of DESIGN.md with characters, the kept decision sentence and each destination; case 9 uses `RESEARCH-APPROACH.md`, states the scratch layout and adds an engine outside the hub; case 13 checks the links. Whether one builder carries both rewrites: Z636 keeps them in one step, and the paragraph table makes a loss visible to the reviewer and to Axel's read.
- Implied inputs: closed, the link press (item 8, case 13), the engine outside the hub and real paths (item 7, case 9), the diagram address resolved from the document's folder and the cut before `figures` (item 7), the hub figures (case 9), a 404 name and an upper-case name (case 10), the Help arrangement (item 6), the Apps detail before E4g (items 1 and 5), a 304 keeping parts (item 7).
- Dictated text: holds.
