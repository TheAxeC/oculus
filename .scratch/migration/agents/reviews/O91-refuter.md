# Step O91 refuter report (on .agents/worktrees/migration-O91, base eeafcd4cb)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
Brief check 1, from the worktree root, PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH:
npm run diagrams && npm run docs:palette && npm run test:quick -- --base eeafcd4cb
  diagrams wrote the 18 docs/diagrams files, palette wrote docs/palette.md; shasum of docs/diagrams/* and docs/palette.md before and after the run: identical ("generated docs unchanged"), so the committed generated files are current and the run changed no file
  test:quick: 53 changed file(s), from git since eeafcd4cb
  test:quick: 304 test file(s)
  ok      svelte-kit sync (7.4 s)
  ok      prettier (7.4 s): All matched files use Prettier code style!
  ok      ASCII gate (8.1 s)
  ok      eslint (226.8 s)
  ok      svelte-check (391.5 s): 1793068280316 COMPLETED 548 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
  FAILED  vitest (785.3 s)
   Test Files  11 failed | 212 passed | 64 skipped (287)
        Tests  29 failed | 2818 passed | 762 skipped (3609)
       Errors  1 error
  ok      vitest checks (793.1 s): Duration  771.76s (transform 441.22s, setup 0ms, import 1443.02s, tests 1457.79s, environment 19ms)
  FAILED  vitest slow (924.0 s)
   Test Files  8 failed | 74 passed (82)
        Tests  20 failed | 742 passed | 267 skipped (1029)
  test:quick: 932.1 s; failed: vitest, vitest slow
  Every red line is "Error: Test timed out in <N>ms." (37 of 37 error lines counted), and the one unhandled error is "[vitest-pool]: Failed to start forks worker for test files .../tests/ui/html.dom.test.ts". Red files: tests/data/hubs/hub-portfolio.test.ts, self.test.ts, tests/data/snapshot/references.test.ts, rename.test.ts, hub-vocab.test.ts, app-fs, app-manage, app-open, routes/edit/config-key, undo, clone, tests/routes/hubs/hub-writes.test.ts, compose, app-store, server/edit/config-key, writes-collection, apps/manage, languages, hpc/submit.
  Four of them are files the step changes; each rerun alone (npx vitest run <file> --reporter=dot):
  == tests/data/hubs/hub-portfolio.test.ts   Test Files  1 passed (1)   Tests  16 passed (16)
  == tests/data/snapshot/references.test.ts  Test Files  1 passed (1)   Tests  40 passed (40)
  == tests/data/snapshot/rename.test.ts      Test Files  1 passed (1)   Tests  31 passed (31)
  == tests/routes/hubs/hub-writes.test.ts    Test Files  1 passed (1)   Tests  47 passed (47)
  The other red files are files the step does not change (spec.md "Verify before you report": not counted).

Brief check 2: wc -l of every changed .ts/.svelte file: largest source src/lib/state/client/selectors.svelte.ts 871, largest component src/lib/views/boards/person/Person.svelte 400 (RecordCard.svelte 360, EntryCard.svelte 334, CrossLinks.svelte 198, cross-links.ts 268). All within 880 / 520.

Brief check 3: the report's changed-rows command, rerun in the same form (11 files, verbose, its grep):
  every listed row <check>, the two G32 rows of hub-portfolio at 2618ms and 2466ms, referrers row "names for a person the projects with them as collaborator or awaited" <check>
   Test Files  11 passed (11)
        Tests  434 passed (434)

Brief check 4: sh utils/unused-exports.sh > .../scratchpad/o91-review/unused-after.txt -> script exit 0; diff .agents/worktrees/O91-base/unused-exports.txt unused-after.txt -> no output, diff exit 0

Brief check 5 (run with plain grep, see Declined to judge): grep -rn -i "joint.work\|joint_work\|jointWork\|dlcat_collab\|word_collaboration\|glyph_collab" src config docs tests README.md --exclude=local.yml --exclude=data-map.md
  tests/fixtures/hubs/demo/.oculus/data/people/people.yml:29:    note: "Early conversations about a joint workshop paper."
  (the one hit the report names; the moved note's own words)

Brief check 6: grep -rn 'Z10[0-9][0-9]\|ruling 4[0-9][0-9]\|\bO9[0-9]\b' src config docs tests --exclude=local.yml -> nothing, exit 1

Brief check 7: the perl ASCII gate of spec.md over $(find src tests config -type f ! -name local.yml) -> nothing, exit 0; LC_ALL=C grep -n '[^ -~]' README.md docs/HELP.md docs/apps.md docs/templates.md docs/palette.md .scratch/migration/agents/reviews/O91-report.md -> nothing, exit 1

Report evidence, rerun (programs recreated byte for byte from the report's quoted source in the reviewer's scratchpad o91-review, the config's root path changed to that folder):
  case-run.test.ts, TREE=O91-base/src: every line identical to the report's first run (1 to 12, 14 to 16d "no strip"; 13 "strip: in-flight[hub:related-one]")
  case-run.test.ts, TREE=migration-O91/src: every line identical to the report's last run, e.g.
    2  lead of one, collaborator on others (hub:steph): Lead: in-flight[hub:s-lead] | Collaborator: in-flight[hub:s-collab]
    3  lead, supervisor and collaborator (hub:me): Lead: in-flight[hub:me-lead] | Supervisor: done[hub:me-sup] | Collaborator: ideas[hub:me-collab]
    11 coauthor on collaborators too (hub:maryam): Collaborator: ... | Coauthor: in-flight[hub:m-live] done[hub:m-done] ideas[hub:m-idea]
    14 organisation (hub:ut): strip: in-flight[hub:ut-shared] done[hub:ut-other]
    16 second hub person (lab:maryam): Lab collaborator: in-flight[lab:lab-own]
  case-run-hub.test.ts, base: identical to the report's first run (19 none / none / none / "joint_work flag true, ticker {"category":"collab"}"; 21 none; 20 ["funding","tasks"], problems: [])
  case-run-hub.test.ts, worktree: identical to the report's last run:
    19 findings naming joint or collab: snapshot: <hub>/.oculus/config.yml: ticker category collab names no word of ticker_categories; the entry gives no ticker lines
    19 config findings naming joint or collab: none
    19 hub-config schema marks: line 21: [collections[12].joint_work] key collections[12].joint_work is not declared by the schema of this file
                                line 21: [collections[12].ticker.category] collections[12].ticker.category is collab, which is not a key of ticker_categories
    19 collection hub:joint-work read: yes, 1 entries, joint_work flag undefined, ticker undefined
    21 ticker category findings: ticker category collab names no word of ticker_categories; the entry gives no ticker lines
    20 chatContext read: ["funding","tasks"], problems: []
    20 findings naming chat_context, joint or collab: none
  git show eeafcd4cb:docs/data-map.md | grep -n -i joint -> :46, :69, :72, :179 (and :180 "  person: people key"), as the report's Doc text gives them
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. The entry, the `chat_context` word, `'joint_work'` of `COLLECTION_FLAGS`, the options row, the flag comments (sources.yml:30, model-collections.ts:29-32, templates.md:62-70), layout.yml:116 and :335, the text keys, `collab` with its three words, HELP.md:52 and :547 and behavior.yml:161 all leave (diff); case-run-hub rerun shows the flag unread and the editor mark.
- 2: holds. `jointWorkRows`, `PERSON_FIELD`, the merge's joint work, `Sides.jointWork`, `jointWorkPerson`, `jointWorkIds`, `PersonJoin.jointWork`, `jointWorkOf`, the Person block, button and `openJointWork`, the cross-links branch and the referrers' joint work leave (diff); grep 5 clean; unused-exports diff empty; svelte-check 0 errors.
- 3: holds. `roleLinks` (cross-links.ts:672-689) reads `rolesOf` under the person's hub words, keeps fields `lead`/`supervisors`/`collaborators` in `roles:` order, drops empty rows; case-run cases 1 to 12 rerun.
- 4: holds. `affiliatedTo` (cross-links.ts:580-589) over `teamOf`, each project once; affiliations hold resolved organisation ids (merge.ts:184), as `organisationReferrers` joins them; case 14 rerun.
- 5: holds. cross-links.ts:639-640 over `resourceIds`; case 15 rerun.
- 6: holds. The joins are pure functions in cross-links.ts; EntryCard.svelte:186-189 calls `roleLinks`, else `crossLinks`; RecordCard.svelte gains `rows` and draws each through CrossLinks.svelte with `label`; `src/lib/views/shared/links` still holds 10 items (`ls | wc -l`); the four head comments are rewritten.
- 7: holds. Joint-work rows are deleted, vehicle rows moved (statements file, funding `lead`, key `collaborations`, `KEPT`), the demo fixture moved its notes and tags; the report lists moved and deleted rows with G131 and G32's clause; check 3 rerun 434 passed.
- 8: holds. README, HELP 52/236/301/547, behavior.yml:161, apps.md:407/414, templates.md 66/87/94/1064-1088/1233-1258 and palette.md are changed as asked; the Doc text covers data-map :46, :69, :72, :179-180. A comment-wrap defect in templates.md is Standards 1.

Cases of the brief's "Cases":

- 1: met, case-run rerun: one Collaborator row, three groups.
- 2: met, case-run rerun: Lead first, then Collaborator, the dead-stage project left out.
- 3: met, case-run rerun: Lead, Supervisor, Collaborator.
- 4: met, case-run rerun: `hub:both` in both rows.
- 5: met, case-run rerun: no strip.
- 6: met, case-run rerun: no strip.
- 7: met, case-run rerun: no strip.
- 8: met, case-run rerun: Collaborator first.
- 9: met, case-run rerun (9 and 9b): no row for `waiting-on`.
- 10: met, case-run rerun (10 and 10b): no strip.
- 11: met, case-run rerun: Collaborator and Coauthor rows with the same projects; `rolesOf` dedups by key only (roles.ts).
- 12: met, case-run rerun: rows drawn under `registry: people` with another id.
- 13: met, case-run rerun: no role strip, the `related:` strip.
- 14: met, case-run rerun: `ut-shared` once.
- 15: met, case-run rerun: two projects for `hpc`, none for `data`.
- 16: met. The case-run rerun gives each second-hub record only its own hub's projects (16 to 16d). The program plants ids that are already resolved and not a primary-hub manifest naming a lab-only key. Reading confirms the rest: the joins compare those resolved ids, and the merge resolves a primary manifest's key to the second hub's record (merge.ts head comment, G32 rows).
- 17: met by reading: Person.svelte loses the block, the button and `openJointWork`, and the other blocks are unchanged in the diff. The look on landing shows the visual state.
- 18: met, referrers.test.ts row rerun inside check 3: `['project:raw-pls', 'project:hccnet']`.
- 19: met, case-run-hub rerun. The editor's hub-config schema mark names the key `collections[12].joint_work` on `.oculus/config.yml`, and the collection is read as a plain collection (flag undefined). The builder's correction is accurate on the evidence: `loadConfig(...).findings` gives no finding for the key, and the snapshot's schema run checks only manifests and data files (run.ts:476, :541), so the key never reaches the Findings view. The brief's words "the finding the shape check gives any key its options do not list" are met by the editor's check, the same check every unlisted collections key gets.
- 20: met, case-run-hub rerun.
- 21: met, case-run-hub rerun: the `category_unknown` text. The "joint work" group is gone because the category left vocab.yml (diff). The look on landing shows the Focus view.
- 22: not verifiable here. Reading strip-tab.ts:43-45 gives the tab label `ui.unknown_view`. The look on landing settles the tab and the pane.
- 23: met by reading: layout.yml's `joint-work:` counts row is removed. The look on landing shows the badge.
- 24: not verifiable before the hub commit. The demo people.yml declares and fills `tags` and `note` (diff). The look on landing settles it.
- 25: met, check 3 rerun: every moved row passes (434 passed). The builder quotes the first runs on the old vehicle, and they could not be rerun here without the old test text.

## 1. Spec

- none.

## 2. Proof

- none.

## 3. Standards

- docs/templates.md:70 (and :64): "# schema flags its own. The domains registry holds each domain's colour" (71 columns), followed at :71 by "# and label and which domains expect a dataset; ..."; what is wrong: the step edited this comment paragraph (lines 65-70) but rewrapped only part of it, so a line inside a sentence now ends short. At the base, line 70 was 95 columns. Line 64, at 85 columns, could also take "`open_badge`,". spec.md "What every package obeys" says a comment edited by the step is rewrapped as a whole paragraph at 100 columns, so no line inside a sentence ends short. Failure scenario: a reader of the hub config template in docs/templates.md sees a paragraph that breaks in mid-sentence, and the next edit of it carries the ragged wrap forward. Small, inside the brief, fixable at landing by rewrapping lines 61-73. verdict: none.
- src/lib/views/shared/card/record/RecordCard.svelte:23: "    // person's card, one per role), then the kind's own `foot`. A kind that draws the dated" (92 columns), followed by ":24     // lines inside a block of its own, ..."; what is wrong: the same rule. The rewrapped foot paragraph ends line 23 short, though the next word "lines" fits (98 columns). Failure scenario: as above, a ragged comment paragraph in the component's head comment. Small, fixable at landing. verdict: none.

## 4. Behaviour

- none.

## Declined to judge

- Check 5 as the brief writes it is a `git grep`, which the refute skill's Rules do not let the reviewer run. I ran it with plain `grep -rn` over the same paths, excluding local.yml and data-map.md. That also reads untracked and ignored files under those paths, and it printed only the one hit the report names. `git grep` itself, from the worktree root, would settle the tracked-files form.
- The report's case 17 quotes `git grep -n -i "joint" -- src/lib/views/boards/person/Person.svelte`, and its assertion table was built from `git diff -U0`. Neither was rerun in that form. The diff since the base and a plain grep of Person.svelte cover the same facts. That the builder ran `git grep` at all, which spec.md's "Where you work" does not list among its git commands (status, diff, show), is a process point with no effect on the diff, and the brief's own check 5 asks for that command.
- The organisation strip counts the user. `affiliatedTo` uses `teamOf`, which keeps the user (`self`), as brief item 4 says. `shownTeam` would leave the user out. So an organisation the user is affiliated to lists every project the user is on. Whether the user should count toward an organisation's strip is the user's call under ruling 479 ("the projects whose team holds a person affiliated to it"). The look on landing at `university-of-twente` shows the size of that strip. I did not read the hub, so the user's affiliations are not verified.
- The demo fixture's joint-work `title`, `status` and `meta` were deleted with the file, while only `note` and `tags` moved, as item 7 says. How the hub's titles are carried is open item 489, which waits on the user. The builder's suggestion to make the demo follow that ruling at landing is the orchestrator's call.
- The judgment calls the orchestrator asked me to weigh hold on the evidence:
  - The statements file is a valid vehicle for the G66, G67 and G8 rows: it is on oculus's list (config/defaults/sources.yml:40, no registry), and only the utwente row's reference order changed, in path order. That change is listed in the assertion table.
  - The funding `lead` row for G32 still proves the cross-hub behaviour through its no-finding assertion: lab's schema run joins the other hubs' keys (run.ts:438 `joinedLists(hubLists(raw), others)`), and an item of a `tags` list is held to its keys (references.ts head comment). Its `resolvedId(holders, 'lab', 'ghost')` line reads only the merged people and would pass without the planted field. Since the snapshot keeps entry fields as written (merge.ts head comment), no snapshot table is left to assert on.
  - Dropping the person, organisation and resource entries' own `related:` strip agrees with ruling 481 ("`related:` stays on the entries that are about projects (events, education, applications)") and with items 3 to 5.
  - `docs/apps.md:414` naming `supervisors` is true: links.ts:72 builds `projectPerson` from `lead`, `collaborators` and `supervisors`.
  - The Referrers.svelte edit at lines 25-37, outside the brief's lines 1-8, was needed. Removing the `'entry'` kind and the `collection` field from `Referrer` (item 2) leaves the `openPage` branch unreachable, and its `one.collection` would not type-check. The inlined funding branch is equivalent to the base `openPage` (`pageView(collection, one.id, one.label)`, then `openView`). The report names the edit with its reason, as spec.md "Where you work" asks.
- The visual cases (strip headings on the cards, the Person page, the rail badge, the saved tab, the People view's tags and note) were not looked at, since the reviewer runs no page. The look on landing settles them.
- The hub text (the hub commit) was not judged: it is the orchestrator's work at landing and is not in the diff.

Reviewer usage: a9b1c10a67c74430a, claude-opus-5-5, 304973 tokens, 100 tool uses, 28 min 53 s.
