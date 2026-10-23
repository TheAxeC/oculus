# Brief check of O61 (`.scratch/migration/agents/briefs/O61.md`, main at 2d92bbac)

The brief has a wrong premise, `deadline_met`, and dispatching it as written breaks how collection entries behave. Item 3 and decision 4 remove `deadline_met` from `statuses:` because its "one reader, `settled`, reads a project". That is false: the flag is also read on funding and collection entry statuses at `focus.ts:329`, `ticker.ts:221` and `ticker.ts:249`. The brief also contradicts its own case C7. Several other premises, cases and implied inputs also need fixing before dispatch; they are listed below.

## 1. Names

Each name below was grepped across src, config, docs, tests and README.md (`--exclude=local.yml`). Only hits outside "Paths this step writes", or outside the line ranges given there, are listed.

**Text and comments the change makes false:**
- `config/defaults/layout.yml:303`, the head comment of `counts`: "so `in prep` on the Funding tab is the same violet as an in-prep chip on a card". The write path allows only lines 236-260 and 321 of this file.
  - The sentence becomes false: `in prep` is removed, and a chip row carries no colour.
  - Verify item 6 does not catch it, because its pattern needs double quotes.
- `config/schemas/manifest-schema.yml`: the brief names only `:40`, but three more places in the same file become false:
  - `:15-16`, the head comment, which names `vocab.statuses.chip`.
  - `:35`, the help of `type`: "(active or idea) ... software on a software project".
  - `:61`, the help of `deadline`: "until the project carries a chip that meets it, such as submitted".
- `tests/checks/config/config-folder.test.ts:677-689` (not in the write paths).
  - It holds rows `['statuses', ...]`, `['types', ...]` and `expect(keys).toHaveLength(38)`, commented "17 status flags, 11 of types".
  - The count and the rows become false: flags leave `statuses`, four flags join `types`, and `chips` and `lead_statuses` have no rows.
- `src/lib/server/edit/feeds/feeds.ts:342`, comment "the word of `statuses` carrying `default_lead`". It becomes false, since `default_lead` moves to `lead_statuses:`.
- `src/lib/views/shared/card/feed/lead-apply.ts:5`, comment "status carrying `lead_applied` in `statuses` of config/catalogs/vocab.yml". It becomes false.
- `docs/templates.md:135-141`, the config.yml template's `statuses` block.
  - It says the hub's statuses carry "label, icon, colour and the flags", and its example is `on-hold: { label: on hold, icon: black, color: "#9ca3af", blocked: true }`.
  - It becomes false: `statuses:` loses `label`, `icon` and `blocked`.
  - `docs/templates.md` is in the paths, but item 11 names only the lines that name words.

**Code outside the paths that reads stage chips** (none of these files is in the paths):
- `src/lib/data/sources/deck/read.ts:400` and `src/lib/data/sources/deck/kinds.ts:211`: `card.maturity = project.chips[0]`. After the rewrite an idea has no stage chip, so its Present card draws no maturity.
- `src/lib/data/sources/deck/groups.ts:67` and `spec.ts:21`: a deck `find:` `status:` matches stage chips. After the rewrite such a find matches nothing.
- `src/lib/data/helpers/hub-names.ts:346`: `HUB_LIST` holds `statuses` and not `types`, `chips` or `lead_statuses`. Case C16 needs rows added here, which also changes:
  - `docs/data-map.md:80` ("these 25 keys");
  - the G83 template test, `tests/checks/config/templates.test.ts:64`.

**Code the catch-all path covers, but no item names:**
- `src/lib/views/system/gallery/Gallery.svelte:45-75` (`chipKeys`, `chipLabel`, `chipGlyphName`): the Gallery's chip row changes once the legend loses the stage words.

**Hits that stay true or are inside the paths:**
- `src/lib/state/forms/schema.ts:172`, `references/model.ts:58`, `vocab-keys.ts:47` and `docs/data-map.md:195` (all `statuses.chip`): in the paths; they are made true by the change.
- `config/options/layout.yml:156,177` and `config/options/behavior.yml:122,128,134` (`status_chips`, `entry_statuses`): stay true, since the source names keep their names.
- `tests/data/sources/config/boards.test.ts:59` ("one of the items of the list status_chips, project_types"): stays true.
- The audit texts `msg_terminal_live`, `msg_terminal_live_one`, `msg_projects_published` and `msg_contradictory_chips` are named only in `projects.ts` and `audit.yml`, both in the paths.

**Collisions:** `grep -rnE "^chips:|^lead_statuses:"` over config finds no existing top-level key with either name. `grep -rn closestWord src tests` finds nothing.

## 2. The step line

| Part of the step line | Requirement that serves it |
|---|---|
| Stage words are type words with the flags they carry as chips | Item 1 |
| Chips are form and situation labels | Item 2 |
| The audit rules comparing type and chips go | Item 6 |
| A stage word written as a chip is a finding | Item 6 |
| Oculus's vocabulary and fixtures are rewritten once | Items 1-4 and 10 |
| `lifecycle` and `publication_kinds` are rewritten | Items 6 and 7 |
| Ruling 219 (the groups) | Item 1 |
| Ruling 221 (three lists) | Items 2 and 3 |
| Ruling 222 (one spelling, closest word) | Items 4 and 8 |
| Ruling 243 (`on_map`, `standard`, `placed`, `public`) | Item 1 |
| Ruling 244 (hyphenated spellings) | Items 4 and 8, cases C8 and C9 |
| Ruling 248 (hand-written edit distance) | Item 8 |

Parts with no requirement, or one that departs from the line:
- **Ruling 247 (the hub rewritten at landing).** No item serves it, by design, since it is the orchestrator's work at landing; premise line 11 says so. Its rule does not cover two hub files that have happened (check 6, inputs a and b).
- **"with the flags they carry as chips today".** The `published` chip carries `published: true`. Decision 3 drops that flag instead of moving it, so the line is not met for this flag.
  - The justification is that "its one reader is the audit rule ruling 218 removes".
  - That rule (`projects.ts:403`) compares the tier with the chips, not the type with the chips, so ruling 218 does not cover its removal.
  - The brief's premise misdescribes it (check 3).
- **Step 0's text of open item 243** lists "`published` on published" among the chip flags that move; item 1 does not carry it.

## 3. Premises

**Wrong, and the work depends on it:**
- **Line 14, "`grep -rn "deadlineMet\|settled(" src/lib/state/boards` shows `deadlineMet` called only from `settled`".** The rerun prints:
  - `ticker.ts:179 settled(project, config)`
  - `ticker.ts:221 ... closesDeadline(config, status) || deadlineMet(config, status)` (grants)
  - `ticker.ts:249 if (closesDeadline(config, status) || deadlineMet(config, status)) continue;` (collection entries)
  - `focus.ts:115`
  - `focus.ts:329 .filter((scheme) => deadlineMet(config, scheme.status ?? ''))` (the awaiting box's grants)

  So `deadline_met` on the `statuses` words `submitted` and `under-review` is read for funding and collection entries. Removing it (item 3, decision 4) would:
  - put submitted grants and `under-review` entries back on the ticker;
  - empty the Focus awaiting box's grants list.

  The hub's `funding.yml` holds 2 entries with `status: submitted`; the tally is in check 6. The flag has to stay on `statuses:` and also be added to `types:`.

**Wrong or incomplete readers:**
- **Line 14, `blocked`.** It lists `focus.ts:100` and `stats.ts:60` and misses `collection.ts:808` (`anyWord(config, 'statuses', 'blocked', project.chips)`, the cross-link warn). Also, `stats.ts:60` is `waitingLine`, not a count: the board statistics' blocked count is `item.project.focus === BLOCKED` (`stats.ts:87`), which is a lane and reads no chip.
- **Line 15, `structure/graph.ts:88` as a `live`/`idea` reader.** False: `graph.ts:87` reads `hasWord(config, 'tiers', 'finished', project.tier)`. The only reader of `on_map` is `lines.ts:116` (`isDormant`, the Pillars and Domains card dormancy), not the Map's nodes.
- **Line 16, `projects_published` described as "a published type without a `published` chip".** False: `projects.ts:403` is `if (!finished && [...chips].some((chip) => rules.publishedChips.has(chip)))`, a project on an unfinished tier that carries the `published` chip.
- **Line 23, O54's paths.** It omits some that O61 also writes or needs:
  - `src/lib/server/edit/writes/manifest.ts`
  - `src/lib/views/shared/card/card.ts`
  - `config/text/findings.yml` (`findings.hubs`)
  - `src/lib/data/snapshot/schema/*.ts`
  - "the test files of G8, G28, G32" (`manifests.test.ts` is in G32's test list, and O61 rewrites it)
  - `src/lib/data/helpers/hub-names.ts` lines 1-115

  These come from `awk` over `briefs/O54.md`. O51, also in flight, writes `docs/HELP.md` lines 70-71 (`briefs/O51.md`), and O61 writes `docs/HELP.md` too; the brief does not mention it.
- **Line 24, the base copy.** `ls -d .agents/worktrees/migration-O61-base*` prints "no matches found": the base copy and its `unused-exports.txt` do not exist yet. Verify item 5 depends on them.

**Wrong line numbers or counts that the work does not depend on:**

| Premise | Brief says | `grep -n` / `awk` shows |
|---|---|---|
| Line 12, `types:` | 17 words | 16 (`awk 'NR>=60 && NR<=76' ... \| grep -c` prints 16; the brief's own list names 16) |
| Line 12, head comment of `types:` | 49-59 | 50-59 (line 49 is blank) |
| Line 12, `tiers` | 214-219 | 215-220 |
| Line 13, the status row's flags in `vocab.ts` | "to line 105" | `statusWord` is 34-91 |
| Line 13, `typeWord` | `:111-150` | 97-131 |

**Confirmed:**
- `vocab.yml` is 264 lines; `statuses:` is 97-171 with its head comment 79-96; `fund_stages` 198-201; `publication_kinds` 224-234; `lifecycle` 238-244.
- `vocab.ts` is 317 lines and `vocab-keys.ts` 144; `vocabSource` and `coloredWords` are as stated; `grep -rniE "closest|levenshtein|editDistance" src` prints nothing.
- `focus.ts:89,322`, `stats.ts:48,86`, `manifest.ts:669-670`, `rules.ts:200`.
- The audit guardrails are at `projects.ts:366-435` and `rules.ts:180-206`.
- `checkEntryStatus` is at `validate.ts:211-234` and compares exactly, not lowercased; `data/index.ts:299-300`; `findings.yml:278`.
- The Position Lead flags are at `leads.ts:22-29`, `lead-application.ts:39` and `new-entry.ts:74`.
- `setVocab` is at `tones.ts:97-114`; the type chip is drawn at `ProjectCard.svelte:346`; Present's `Project.svelte:42`.
- The option sources: `catalog-words.ts:59-62`, `options.ts:482-532`, `references.ts:32-35`, `manifest-schema.yml:35,40`, `behavior.yml:122-134`.
- `layout.yml` group rows: 238-239, 252-256, 283-288; `:321`.
- `docs/templates.md:1068,1082`.
- The demo fixtures match the brief exactly (`grep -rn "^type:\|chips:" tests/fixtures/hubs/demo/projects`). `bench-suite` and `tensorkit` have no `status:` block.
- The test files listed on line 21 hold the stage chips the brief says (`manifests.test.ts:46,125,143,235`, `write-fixture.ts:330,430`, `writes-fixture.ts:25`, `writes.test.ts:662`).
- `standards: [.scratch/migration/agents/spec.md]` and `verify: npm run test:quick` are as stated (`orchestrator-state.md:6-11`).

## 4. Cases and checks

**Cases inconsistent with the code or the rules file:**
- **C7, "`status: under-review` ... on the deadline radar as today".** Today `under-review` is off the radar through `deadline_met` (`ticker.ts:249`). Item 3 removes that flag, so C7 and item 3 cannot both hold.
- **C17, "Every idea and in-flight project is a node; a `type: finished` project is not".** The code does not work this way. Map nodes are every project, and those of a tier carrying `finished` are hidden unless toggled (`graph.ts:86-103`). `on_map` is read only by `isDormant` (`lines.ts:116`). A `type: finished` personal project is a node today and after the step. The case that tests `on_map`: a Pillars or Domains card whose members are all `type: finished` is dormant, and one with a `type: submitted` member is not.
- **C3, "kept out of the backlog, as today".** No code keeps a blocked project out of the backlog: `backlog()` (`focus.ts:244-256`) reads no chip, and `grep -rn "backlog" ... | grep -i block` prints nothing. The claim comes from the help of `blocked` (`vocab.yml:94`, `vocab.ts` help). Item 2 asks that the head comment of `chips:` "say what each field and flag decides", so copying this sentence carries a false claim.
- **C16, "Its `types:` and `statuses:` merge as today".** A hub's `types:` does not merge today: `HUB_LIST` (`hub-names.ts:329-353`) holds `statuses` and not `types`, so a hub `types:` is a finding and is not applied. Making `chips:` and `lead_statuses:` merge needs `hub-names.ts`, `docs/templates.md:135-141`, `docs/data-map.md:80` and the G83 test, none of which item 5 or the paths name.

**Tests that conflict with the rules file:**
- **Item 12, the `closestWord` table test.** `spec.md` says: "A test exists only as the test of one entry of `agents/guarded.md` ... A step that needs a new entry stops and asks Axel for it." No entry names `vocab-keys.ts` (`grep -n "vocab-keys" .scratch/migration/agents/guarded.md` prints nothing). Ruling 248 asks for the table test, but the brief names no entry, so a builder following `spec.md` stops.
- **Item 12, the new manifest finding "as a row beside the manifest check's rows" and the entry and lead status rows.** No test file holds the `findings.validate` rows: `grep -rln "status_not_in_vocab\|waiting_on_itself\|related_itself" tests` prints nothing. The brief names neither a file nor a G entry; the candidate is G56, whose test is "written by M8 ... named in M8's landing report".
- **Verify item 9's word list.** It omits two phrases that `spec.md` lists: 'the step adds' and 'after this package lands'. The brief's list is a subset of the rules file's.

**Cases that ask about a place the step does not change:**
- C16: the merge code (`hub-layer.ts`, `hub-names.ts`).
- C17: `buildGraph`'s node rule.
- C3's backlog clause: `backlog()`.

## 5. The question: could this pass without the goal being reached?

**Could pass without the goal:**
- **Item 3 against C7.** Item 3 passes by following the brief, and the goal fails, since entries lose their deadline behaviour; C7 then fails.
- **Item 5, "draw the same words and glyphs as today".** It cannot be met literally, and a look could pass it on a different reading.
  - Today a card draws the raw type word (`<Chip label={item.project.type} ...>`, `ProjectCard.svelte:346`) and the stage as a chip label with a glyph.
  - After the rewrite the old type word (`active`) is gone.
  - C14 asks for the stage's label on the type chip.
  - The brief does not say what "same words" means for the type chip.
- **Item 6's new finding.**
  - A stage word in `status.chips` also falls outside the `vocab.chips` options of `manifest-schema.yml:40`, so the schema check gives its own finding as well.
  - Item 8's sentence "a project chip `chips:` does not hold and is no stage word is the schema's finding" implies a stage word is not the schema's finding, which needs a change in `src/lib/data/snapshot/schema/` (not in the paths).
  - C4 passes with either one finding or two.
- **Verify item 6.** It passes while `layout.yml:303` still says "`in prep` on the Funding tab ...", because the pattern needs double quotes.
- **Verify item 7.** It passes by deleting code, which is the goal itself.
- **Item 12's moved-flag rows.** No `guarded.md` entry names `focus.ts`, `stats.ts`, `ticker.ts`, `leads.ts` or the audit, so every row may be "named in the report as a case checked by a run". The rules file allows this, but a run quote could pass without the reader being changed if the run is chosen loosely.
- **C1.** The countdown and the settled deadline are proved only by reading `card.ts:161` and `Lanes.svelte:81,99` plus a run.
  - `card.ts:161` passes `{ chips }` alone, so a builder who changes `pausesCountdown` but not its caller fails the goal.
  - Only a run that uses `card.ts`'s call would catch it.

**Cannot pass without the goal:**
- Items 1, 2, 4 and 7.
- Item 8: the table of `closestWord`. The distances computed in Python over the remaining 43 coloured words: "In Prep" gives `in-prep` at 3 (next is 6), "not applied" gives `not-applied` at 1, "under review" gives `under-review` at 1, "canceled" gives `cancelled` at 1.
- Item 9: C12 checks the groups.
- Item 10: the five fixture cases.
- C2, C5, C6, C8-C11, C13-C15, C18 and C19.
- The step line can pass only if items 3 and 6 are corrected.

## 6. Implied inputs

The hub at `~/workspace/research-hub` was read only, excluding `.agents/worktrees`. The manifests were tallied with `find projects side-projects -name project.yml`, and the statuses with `grep status:` over `.oculus/data`.

**Inputs that have happened, with the expected result missing from the brief:**
- **a. The hub's deck, `deck/present.yml:7,17,28`.** It holds `find: { ..., types: [active, idea] }`, `types: [active]` and `types: [idea], status: [nascent, scoping, de-risking]`. Ideas carry stage chips today (25 `idea` [nascent], 5 [scoping], 2 [de-risking]).
  - After the landing rewrite, the third group matches nothing, the first loses every rewritten project, and idea cards lose their maturity (`deck/read.ts:400`).
  - Expected: the maturity is read from the type, and the finds name the stage words.
  - Neither the brief nor ruling 247's rule covers this file.
- **b. The hub's `applications.yml:10` schema `options: ["not applied", active, ...]`.**
  - After the step the apply control writes `not-applied`, and after the landing rewrite the 9 entries hold `not-applied`. Every one is then a schema finding, "value outside its options".
  - Expected: the landing rewrite also changes the schema option.
- **c. The hub's `funding.yml`, 2 entries with `status: submitted`.**
  - Expected: they stay in the Focus awaiting box's grants list and off the ticker, as today.
  - Item 3 breaks this.
- **d. `projects | idea | [paused]`, one project (`projects/ideas/fedbtd`, `focus: holding`).**
  - The rewrite gives `type: paused`: neither group, `dead: 5`, not `on_map`.
  - It leaves the Projects board's "idea" group for no group.
  - It leaves pillar and domain membership: `lines.ts:106` puts it in the Archival band.
  - It can turn a pillar card dormant.
  - Expected result not stated.
- **e. `idea` [de-risking] (2 projects in the hub) and the demo's `tensor-sketch` and `online-clustering` (`idea` [exploring]).**
  - They become live types and move from the "idea" group to "in progress".
  - The Projects tab and rail count is the first group's count, so it rises: demo 5 to 7.
  - The audit's live-type rules now apply to them (`projects.ts:219` `msg_missing_field` results and datasets; `:424` eli5).
  - The same holds for every project that becomes `submitted`, `in-prep` or `submit-ready`.
  - Expected result not stated; it is visible.
- **f. The archive `phd` [thesis, lead] (`projects/archive/phd/phd-thesis`).**
  - It becomes `type: finished`, chips `[thesis, lead, phd]`.
  - It loses `public`: the website audit no longer expects the thesis on the site (`publications.ts:189,207,216`).
  - It loses `archive_outcome`: `folderType` no longer checks the `archive/phd/` folder.
  - The Map's archived toggle names it `finished`.
  - Expected result not stated.
- **g. 9 hub projects and the demo's `graph-transfer` become `type: submit-ready`.**
  - The colour rule of item 1 gives `submit-ready` no colour: the type row has none and the chip row has none.
  - `typeTone` then returns the unknown tone, so cards, the Map and Present draw them neutral where today they are active's orange.
  - Expected result not stated.
- **h. Demo `bench-suite` and `tensorkit`, `type: software` with no `status:` block.**
  - Expected: `type: finished` and a new `status: { chips: [software] }` block.
  - The cases name only `demo-toolkit`.
- **i. A manifest still holding an old type (`software`, `tech-report`, `phd`) on a hub not yet rewritten.** The hub has 3 software, 1 coauthor software, 1 tech-report and 1 phd.
  - Expected: the schema's type finding, and no code reading it.
  - Not among the cases.
- **j. Position Lead statuses.** No validation of them exists today: leads are a feed, and `isFeedCollection` keeps them out of `checkEntryStatus`.
  - Item 8 adds a check but names neither the file nor the text key.
  - The hub's leads hold `open` 9, `declined` 46, `applied` 1, all in the planned `lead_statuses:`. Expected: no finding.

**Inputs that have not happened but cost something if wrong:**
- **k. A word in both `types:` and `chips:` through a hub override** (`statuses` is overridable). Expected result unstated.
- **l. No type carrying `new_idea`** (a hub `types:` is not overridable today, but the code must answer).
  - Today the new-idea write falls back to the first `idea` type for `type:` (`manifest.ts:669`); item 5 drops that.
  - Expected: no `type:` line, which is the schema's required-field finding.

**Inputs that have happened and hold:**
- The hub sets no vocabulary key: `grep -nE "^(types|statuses|chips|lead_statuses|lifecycle|publication_kinds|boards|counts|fund_stages|tiers):" .oculus/config.yml` prints nothing.
- Every collection status the hub uses stays a word of `statuses:` except `not applied`: `accepted`, `active`, `declined`, `rejected`, `withdrawn`, `awarded`, `contributing`, `in-prep`, `planned`, `submitted`, `completed`, `ongoing`, `upcoming`, `not-attending`, `ready`.

## 7. ADRs

`ls docs/adr` prints "ls: docs/adr: No such file or directory". No ADR touches the step.

## 8. Dictated text

- **`grep -n "nascent (concept)\|its own word as its label" briefs/O61.md` finds line 30.** The type row's `label` and `icon` copy the chip row's, and `idea`, `active` and `archived` take their own word. Holds (ASCII, one YAML row per word).
- **`grep -n "kind: \[thesis\]" briefs/O61.md` finds line 42.** The four `publication_kinds` rows:
  - `{ kind: [thesis], chips: [phd, thesis] }`
  - `{ kind: [papers-in-review], types: [submitted, revision] }`
  - `{ kind: [papers-in-preparation], types: [in-prep, submit-ready] }`
  - `{ kind: [abandoned-papers], types: [abandoned] }`

  Holds: one line per row, ASCII, no history. The head comment at `vocab.yml:223` stays true.
- **`grep -n '\[in-prep\]\|\[submitted, under-review\]\|\[in-prep, submitted\]' briefs/O61.md` finds line 39.** `fund_stages` `[in-prep]`, `[submitted, under-review]`, `[planned]`; `layout.yml:321` `[in-prep, submitted]`; `templates.md:1068,1082` `not-applied`. Holds.
- **`grep -n "LC_ALL=C perl" briefs/O61.md` finds line 149.** The ASCII gate matches `spec.md`'s form. Holds.
- **`grep -n "'before', 'used to'" briefs/O61.md` finds line 155.** The history word list for the builder's grep breaks `spec.md` ("What every package obeys"): it omits 'the step adds' and 'after this package lands'.
- `LC_ALL=C grep -n '[^ -~]' briefs/O61.md` prints nothing: the brief is ASCII.

## Declined to judge

- Whether the visible changes in check 6 (inputs d, e and g) are wanted: that is a ruling for Axel or the orchestrator, not a fact the tree settles.
- Whether removing the `projects_published` check is acceptable under ruling 218. The text of the ruling does not cover it, and whether Axel meant it to is his call.
- `docs/HELP.md` sentences: `grep -nE "contradictory|live chip|terminal|archive/published|status chip|stage|status legend|in prep|not applied|chips" docs/HELP.md` found no sentence about chips or the removed audit rules; a fuller read of HELP.md was not done.
- The callers of `waitingLine` and `pausesCountdown` in views (`ProjectCard.svelte:119`, `Lanes.svelte:81,99,107`) were found, but their argument shapes after the change were not read.
- The client receiving `lead_statuses` and `chips` (`catalogs.ts` `VOCAB_KEYS` at `:40-60`) was read, but whether the Position Leads view's client config comes from `VOCAB_KEYS` or another path was not traced.
- Whether `collection.ts` (860 lines) must be split: that depends on the builder's change.

Usage: adc42eb23995ab62d, claude-opus-5-5, 259489 tokens, 97 tool uses, 11 min 56 s

## Closed

Each finding closed by a change to `agents/briefs/O61.md`, before the preparation commit:

- 1, Names: `layout.yml:303` added to the paths and to Verify 6 (unquoted pattern); `manifest-schema.yml:15-16,35,61` in "What is on the tree", the file whole in the paths; `config-folder.test.ts:677-689` named in item 12 and the paths; `feeds.ts:342` and `lead-apply.ts:5` comments in the paths; `templates.md:135-141` named in item 4; the deck readers (`read.ts:400`, `kinds.ts:211`, `groups.ts`, `spec.ts`) in item 6, case C22 and the paths; `HUB_LIST`, `data-map.md:80` and the G83 test in item 4 and the paths; `Gallery.svelte:45-75` in item 6 and the paths.
- 2, The step line: `published` kept as a stage flag on `published` (item 1, decision 3); `projects_published` stays and reads the stage (item 8). Ruling 247's two hub files outside the manifests (`deck/present.yml`, `applications.yml`'s schema options) raised to Axel as an open item in `orchestrator-state.md`, since the ruling names the manifests.
- 3, Premises: `deadline_met` stays on `statuses:` and is added to `stages:` (item 4, decision 4); the `blocked` readers, `on_map`'s one reader, `graph.ts:87` and `projects_published` corrected in "What is on the tree"; O54's full path list and O51's `docs/HELP.md` lines named, and O61 is prepared after O54's landing, the premises read again then; the base copy is made by `/spec` before the launch; the line numbers and the count 16 corrected.
- 4, Cases and checks: C7 holds with item 4 (`deadline_met` kept); C17 rewritten to the dormancy of a Pillars or Domains card; C3's backlog clause removed; C16 rewritten to the merge `HUB_LIST` gives, with item 4 widened to it; the closest-word and stage-chip rows placed in G56's test `tests/data/snapshot/schema-rules.test.ts` (item 14, decision 10); Verify 9 names the whole history list of `spec.md`.
- 5, The question: item 6 says what a card draws (the stage by its label and colour, then the form and the chips); item 8 gives one finding for a stage word or a form as a chip, not also the schema's (decision 9), with `src/lib/data/snapshot/schema/` in the paths; Verify 6 reads the unquoted spellings; C1 runs through `card.ts:161`.
- 6, Implied inputs: (a) and (b) raised to Axel with the hub files of ruling 247 (an open item); (c) C7; (d) the Projects board's `paused` group (item 11, decision 6), C12; (e) C5 states the count rises, as ruling 219 decides; (f) the PhD thesis's stage after the rewrite raised to Axel as an open item, since `public` follows the stage; (g) the colour rule of item 1, C2; (h) the bench-suite and tensorkit rows of the fixture cases; (i) C20; (j) the lead check in `validate.ts` with its text key (item 10); (k) a hub `chips:` naming a stage word gives the manifest finding of item 8 on any project that writes it, and needs no rule of its own, since it has not happened; (l) C21.
- 7, ADRs: none.
- 8, Dictated text: the history word list replaced by `spec.md`'s list (Verify 9); the `publication_kinds` rows rewritten for ruling 253 (item 9), one line per row, ASCII.
- Rulings 252 (a) and 253 (a), given after the check: items 1, 2, 7, 9, 12 and 13, cases C4, C6, C12 to C14, C20 and C22, decisions 1 to 10 and the paths written for the rename and the form field; the changed text read line by line against `spec.md` (ASCII, no history, one line per row).
- Premises read again on main at 08567e63, after O54 landed: the line numbers in "What is on the tree", items 4, 6, 7 and 12, "Paths this step writes" and "Read" corrected to main's; no premise changed in substance; rulings 255 to 257 named as the hub's landing rewrite.
