# Step O78 brief check (on main at a374362d)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/O78.md`. Pages are cited by section; code and grep hits by `file:line`. Every command ran in `~/workspace/oculus` on main at a374362d.

## 1. Names

Command: `git grep -nw "LITERATURE\|LITERATURE_KEY\|REGISTRY_LIST_KEYS\|REGISTRY_KEYS\|FEED_COLLECTION_KEYS\|isFeedCollection\|JOINT_WORK\|LISTED_COLLECTIONS\|COLLECTION_PLACES\|isPlacedCollection\|categoryLabel\|collectionLine\|APPLICATIONS\|TASKS\|FUNDING\|PEOPLE\|LEADS_FEED\|PEOPLE_OPTIONS\|unnamedCollection\|listKey\|collectionKeys\|workspaceCollectionKeys" -- src tests docs config README.md ':!config/local.yml'`, plus `git grep -n "ticker_categories\|make_collection_line\|dlcat_\|focus\.command\.word_\|overdueWord\|COLLECTION_LINE\|tickerCategor" -- src tests docs config ':!config/local.yml'`, `git grep -n "views\.\${" -- src`, `git grep -n "registryFile(\|rowLine\|collectionTemplates" -- src`.

Hits outside "Paths this step writes", and whether the change makes each one false:

- `src/lib/server/edit/writes/hubs.ts:24,221` `LITERATURE_KEY` in `homeNaming` (`collection === LITERATURE_KEY`). Item 3 removes `LITERATURE_KEY`, and Save to Literature's home hub is found here by key. Breaks; the path is missing.
- `src/lib/state/boards/person.ts:14,57` `jointWorkOf` joins `JOINT_WORK`. This is the person page's joint work, which item 6 moves to the `joint_work` flag. False after the change; the path is missing.
- `src/lib/state/boards/structure/cross-links.ts:13,56,58` `collectionKey === FUNDING`, `collectionKey === JOINT_WORK` (an entry's cross-links). This is the item 5 and item 6 rule, and it is not listed. False; the path is missing.
- `src/lib/views/boards/focus/CommandCenterView.svelte:19,230` `categoryLabel(one.category)`. Item 8 removes `categoryLabel`. Breaks; the path is missing.
- `src/routes/views.ts:12,97` `isPlacedCollection`, and `:9,57,62` `workspaceCollectionKeys`. Item 7 removes `COLLECTION_PLACES`, and `isPlacedCollection` goes with it. Breaks; the path is missing.
- `src/routes/+page.server.ts:5,74` `collections: workspaceCollectionKeys(config, hubs)` sends keys only. Registration by `label:`/`group:`/`glyph:` needs the entry's fields at this point. The path is missing.
- `src/lib/data/sources/config.ts:20` re-exports `collectionKeys`, `workspaceCollectionKeys`. False only if their signatures change.
- `src/lib/views/shared/card/feed/SaveToLiterature.svelte:21,56` `collectionsOfKey(LITERATURE)`. Item 3 changes `saved.ts`. False; the path is missing.
- `src/lib/views/shared/card/feed/literature-card.ts:9,44` `if (collection !== LITERATURE) return []`. False; the path is missing.
- `src/lib/views/shared/forms/entry/entry-add.ts:27,170,192` `hubAsk(client, LITERATURE)`, `openPage(client, LITERATURE, ...)`. False; the path is missing.
- `src/lib/views/shared/card/feed/lead-apply.ts:17,29,46,55,62` `collectionsOfKey(APPLICATIONS)`, `viewSourceFile('collection', ..., APPLICATIONS)`. This is where a lead's applied press writes, and item 6 names only `lead-application.ts`. False; the path is missing.
- `src/lib/views/boards/editor/Editor.svelte:61,213` `addPerson(name, collectionsOfKey(PEOPLE), ...)`, which is Add Person (item 5). The path is missing.
- `src/lib/views/shared/forms/registry/registry-file.svelte.ts:53-66` `registryFile(client, kind, key)` reads `collectionOf(key)` and `collectionsOfKey(key)`, so one key serves every hub. The Venues, Data, Pillars and Domains views call it with written keys. Item 5 needs it changed. The path is missing.
- `src/lib/views/boards/entry/Entry.svelte:217` `lookup(\`views.${collectionKey}\`)`. Item 7 removes the `views.<key>` words, so this fallback reads keys that are gone. `tests/checks/source/keys.test.ts:210-213` asserts those keys for every collection key and `PAGE_FEEDS`. The path is missing.
- Make Folder a Hub:
  - `src/lib/server/files/project/make.ts:216` maps the templates to `({ key, file })`.
  - `src/lib/views/shared/explorer/tree/control/making.svelte.ts:47` parses `z.object({ key: z.string(), file: z.string() })`.
  - `src/lib/views/shared/explorer/tree/make/MakeGroup.svelte:11,45` calls `rowLine(group.id, row.key)`.
  - Item 7's `about:` line cannot reach the dialog without changing all three. None of them is in the paths.
- `tests/routes/hubs/make.test.ts:237-240` expects `config.collections` toEqual `{ key, file }` pairs. Case 11 makes this false. The path is missing.
- `tests/state/forms/referrers.test.ts:34-37,67,103` builds a joint-work `Collection` with no flag and expects the joint-work referrer. It is false once joint work is found by flag. The path is missing.
- `src/lib/views/feeds/leads/Leads.svelte:61,130` `LEADS_FEED` (feed kind). This stays, since "Not changed" names the Leads view.
- `docs/diagrams/writes.dot:1190-1194`, `writes.svg:4071-4097` (`isFeedCollection`, `FEED_COLLECTION_KEYS`). These are regenerated, and `docs/diagrams/` is in the paths.
- Comments made false, all outside the paths:
  - `src/lib/data/model/model-entities.ts:648`: "the file the configuration's `collections:` entry keyed `people` names".
  - `src/lib/server/edit/writes/bodies.ts:123`: "when its `collections:` names `literature`".
  - `src/lib/data/sources/config/settings/files.ts:158`: "the feeds `leads` and `radar` among them".
  - `src/lib/views/shared/forms/registry/RegistryCard.svelte:28`: "The registry's collection key: `pillars` or `domains`".
  - `src/lib/views/feeds/literature/Literature.svelte:4`: "`literature` is the key of the collection of saved papers".
- Hits inside written files but not cited by the brief (in the paths, so the builder can reach them):
  - `data/index.ts:238-257` `unnamedBy` compares keys with `REGISTRY_LIST_KEYS`, `FEED_COLLECTION_KEYS` and `LITERATURE_KEY`; `:379,384,634,651` use `unnamedCollection`.
  - `ticker.ts:232,242,372,374,382,445` `FUNDING`.
  - `Collection.svelte:105,257,350,359` Literature by `LITERATURE` and `lookup(\`views.${instance.view}\`)`.
  - `EntryFields.svelte:46,105` `LITERATURE`.
  - `Person.svelte:54,82,105,332` `PEOPLE`, `viewSourceFile('people', ...)`.
  - `FieldControl.svelte:71` imports `PEOPLE`, outside the 150-160 range given.
  - `model-collections.ts:129-134` doc "Five files are carried as entities too (venues, pillars, domains, funding and data)".
- `config/defaults/sources.yml:4`, the header comment ("oculus reads a registry or feed a hub's own list leaves out"), is still true. `:49` is covered under section 6.

## 2. The step line

The step line's parts, each with the requirement that serves it:
- "the Focus band and its filter": item 5 (grants) and item 6 (positions, teaching, `filter.ts:459-461`); `filter.ts:186,437-438` is covered only by item 5's general sentence.
- "the ticker and its category words": item 8.
- "Funding obtained": item 5's general sentence, through `career.ts:99` in "What is on the tree". No item names it.
- "the activity counts": item 6 (Disseminated in, `stats.ts`). The step line's words could also mean the `counts` rows. Nothing serves that reading (see section 6).
- "the rail badge": item 6, `open_badge`.
- "tasks": item 6.
- "the task seed": item 5 (`task-seed.ts:131`).
- "the applications a lead writes": item 6, but it names `lead-application.ts` only and not `lead-apply.ts`, where the write is (section 1).
- "referrers and joint work": items 5 and 6. `state/boards/person.ts` and `cross-links.ts` are missing.
- "the tree words": item 7, `about:`. The path through `make.ts`, `making.svelte.ts` and `MakeGroup.svelte` is missing.
- "the tab groups": item 7, `group:`/`order:`. `routes/views.ts` is missing.
- "oculus's sources.yml setting today's flags": item 2.
- "every registry ... recognised by a `registry:` field": items 1 and 3.
- "no hub collection key is written in code": the opening sentence of What to build, case 12 and check 5.

The step line names no check of its own; case 12 and check 5 stand in for one.

Clash: ruling 396 (a) (`plan.md` Rulings, "Open item 396") moves "the glyph names of ... `ticker-lines.ts:13-25`" to text words, in O80. Z1012 and item 8 instead move the category glyphs of `GLYPHS` to an `icon` on the `vocab.yml` word, which is not a text word. That is a self-rule choice that departs from Axel's ruling on the same lines. The brief does not name this.

## 3. Premises

- The 374-hit grep, rerun exactly as written in the brief: `git grep -nE "['\"\`](data|...|radar)['\"\`]" -- src | wc -l` gives 418, in 134 files (`cut -d: -f1 | sort -u | wc -l`). Without the backtick it gives 370, and single quotes alone give 354. The brief's "374 hits in 120 files" does not reproduce.
- Hits of that grep that are neither a site the brief changes nor a meaning "Not changed" names:
  - `data/index.ts:307,457,595-596`.
  - `data/model/index.ts:114,124,276`.
  - `model-collections.ts:134,170`.
  - `model-entities.ts:61,648`.
  - `data/snapshot/references/scan.ts:235` (`defines.source === 'resources'`, a `from` source not among the named O79 sites) and `references/specs.ts:11`.
  - `data/sources/config/catalogs.ts:213` (`['chat', 'tasks']`).
  - `config/sections/counts.ts:26,41` (`'leads'` view id).
  - `config/settings/files.ts:158`.
  - `data/sources/documents/feeds.ts:71,94,150,153,157`.
  - `server/accounts/calendar/google.ts:4`.
  - `server/edit/writes/bodies.ts:123`.
  - `server/files/search/search.ts:238,265`.
  - `server/machine/apps/host/runner/streams.mjs:11,220`, `apps/tools/streams.ts:19,217`, `runner/tools/tasks.mjs:2`, `lsp/relay/relay-join.ts:9`, `lsp/uris.ts:20`, `processes/ps.ts:32`.
  - `state/boards/focus/filter.ts:325`.
  - `state/boards/structure/cross-links.ts:42`.
  - `ticker.ts:117,230,292,311`.
  - `writes.svelte.ts:622`.
  - `lead-application.ts:15`.
  - `new-entry.ts:74,175`.
  - `state/life/calendar.svelte.ts:50`.
  - `write-files.ts:162,192,196,198`.
  - `view-source.ts:26,29`.
  - `tones.ts:11,85,157,251,263,272`.
  - `explorer/view/reveal.ts:24`.
  - `palette-source.svelte.ts:97-98`.
  - `rail-badges.svelte.ts:224,235` (`countRow(..., 'leads')`).
  - `Legend.svelte:11`.
  - `Person.svelte:105,128`.
  - `Literature.svelte:4,83`.
  - `Tasks.svelte:6`.
  - `LeadCard.svelte:113,133`.
  - `RegistryCard.svelte:28`.
  - `LineCard.svelte:96` (`<Glyph name="funding" />`, a glyph name).
  - `routes/api/(docs)/literature/+server.ts:7`.
  - `Focus.svelte:247`.
  - Most of these are comments or other meanings. Case 12's "each named in the report" cannot be met from the "Not changed" list as written.
- `Focus.svelte:155` is the Awaiting strip's `key: 'people'`, which the brief calls a Focus fold key.
- Line numbers that do not match:
  - `ticker.ts:107` is a comment close; `OWN_LOOPS` is at `:108`.
  - `ticker.ts:446` is `for (const entry of collection.entries)`; the funding skip is `:445` (and `:382`).
  - `task-card.ts:24` is `config: Record<string, unknown>,`; the key sites are `:27,:37`.
  - `templates.ts:66` is `chosen.length === 0`; the `{ key, file }` line is written at `:70` (`grep -n 'one.key'`).
  - `docs/templates.md:60-82`: the comment starts at `:61`, and the list runs `:67-84`.
  - `collections.ts:77-81`: `unnamedCollection` is `:75-85`. `:84-90`: `listKey` is `:87-90`.
- Read list item 4 says the `statuses` and `tiers` rows show "a keyed word map with `label` and `icon`". `vocab.yml:109-115` statuses carry `color` and flags, and `:212-215` tiers carry `label` and `unmarked`. Neither has an `icon`.
- "Tests naming the symbols changed": my grep of the symbols over `tests` lists 7 files and not `tests/data/sources/career.test.ts`, which imports only `engineDefaults`. It also misses `tests/routes/hubs/make.test.ts` and `tests/state/forms/referrers.test.ts` (section 1).
- "Premise corrections, booked in `plan.md`": they exist only as uncommitted edits (`git diff .scratch/migration/plan.md` shows the O78 line and Z1009 to Z1013 added), not on main at a374362d.
- These hold:
  - `sources.yml:28,29-46`: seventeen entries.
  - `options/sources.yml:50-58`.
  - `registries.ts:25-34,43-54`.
  - `data/index.ts:175-198`.
  - `normalise.ts:71,80-85,94-121,146,546-556`.
  - `view-source.ts:38-46`.
  - `literature.ts:40,57,69`; `feed-route.ts:55,136-146`; `saved.ts:16`; `write-files.ts:176`; `writes.svelte.ts:490`.
  - Every focus-lanes, filter, career, collection, card, Referrers, task-seed, venues/data/pillars/domains/people, applications, education/events, tasks and joint-work line except those above.
  - `left-out.ts:19-36`, `Collection.svelte:11-29`, `collection.yml:48-70`, `make-words.ts:51-91`.
  - `behavior.yml:56-57,59-69`; `rows.ts:395-404`; `ticker-lines.ts:13-25`; `focus.yml:34-96`.
  - `findings.yml:10-12`; `When` at `model-collections.ts:120-124`.
  - The demo fixture `:8-25`.
  - No hub writes `collections:` (`grep -l '^collections:' ~/workspace/*/.oculus/config.yml` printed nothing, exit 1).
- Item 8 omits `focus.command.position_deadline` (`focus.yml:75`), which becomes unused once position lines use `generic_in` with the noun "position deadline". Nothing says it goes, and the orphan-key check would fail on it.

## 4. Cases and checks

- Tests vs the rules file: the brief makes cases 2, 3, 5, 6, 7 and 11 tests. spec.md "What every package obeys" allows a test only as the test of one entry of `agents/guarded.md`, named there, and a step needing a new entry stops for Axel. The brief names no entry for any of the six (`grep -n -i "collections\|make folder\|registr\|ticker" .scratch/migration/agents/guarded.md` shows only G32 parsers and G128 manifest_fields as candidates).
- `git grep` vs the rules file: case 12, check 4 and check 5 tell the builder to run `git grep`. spec.md "Where you work" allows a builder only `git status`, `git diff` and `git show`.
- Case 1 runs "over the reference hub", called "the TEST hub". TEST is a page, not a hub. If the real hub is meant, spec.md "Where you work" allows only four named tests to read it. If `tests/data/snapshot/reference-hub.ts` is meant, it is synthetic and holds no Focus or catalogue data for most of the listed items.
- Case 10 says "A hub's `vocab.yml`". A hub sets vocab keys in its `.oculus/config.yml`, and only keys its template lists (`docs/HELP.md` "A hub's `.oculus/config.yml` may set exactly the keys listed in its template"). `docs/templates.md` does not list `ticker_categories` (`grep -n ticker docs/templates.md`: only `:439` `focus.ticker_sources`), and item 9 does not add it.
- Line 176 cites the ruling "Unapproved builder scripts" as the form of a case-run program. That ruling (`plan.md:2712`) is about closing findings on edit programs. The case-run program is spec.md's own rule, which requires its source and output quoted and its files gone before the report. The report shape's "each with its file and what it prints" asks for less.
- The report goes to `.scratch/migration/agents/reviews/O78-report.md` and that path is in the write list. spec.md "Where you work" says "You never edit anything under `.scratch/`". O76 and O77 briefs do the same.
- The brief names no worktree and no base copy folder, which spec.md "Where you work" says a brief names. Check 3 names `.agents/worktrees/O78-base/unused-exports.txt`, which does not exist yet (`ls .agents/worktrees/O78-base`: No such file or directory).
- Folder rule: `tests/data/sources` holds 10 tracked items (`git ls-files tests/data/sources | ... | wc -l` gives 10). "New test files beside the module" for the `collections.ts` findings (cases 5, 6, 7) would go past spec.md's ten-item rule there, and `tests/data/sources/collections.test.ts` is not in the paths.
- Size rule: `Collection.svelte` is 513 of 520 lines (`wc -l`). Items 6 and 7 rewrite its registration, so a split by concern is likely, and its new files are not in the paths.
- No case asks the builder to check a place the step does not change.

## 5. The question

The goal: no hub collection key is written in code, and every feature reads its collection by flag or `registry:`.

- Case 1: yes. Oculus's own keys are unchanged, so output equal before and after holds with every key still in code.
- Case 2: yes. It covers the band, Funding obtained, scheme lines, Funding link, badge, Add Task, the applied press, joint work, Venues, Data, Leads and Save to Literature. It leaves out:
  - Disseminated in for `courses` and `jobs`.
  - Awaiting for `jobs`.
  - The command center's lines for `todo`, `jobs` and `courses`.
  - The task seed for `grants`.
  - Cross-links (`cross-links.ts`).
  - The Literature view's BibTeX and Add (`Collection.svelte:257,359`).
  - The person page's join (`person.ts`).
  - The catalogue place of a renamed key.

  Code keyed on any of these passes.
- Case 3: yes. Only the band and the ticker are joined.
- Cases 4 to 9: yes, each tests one rule.
- Case 10: yes, ticker words only.
- Case 11: yes, Make Folder a Hub only.
- Case 12: yes.
  - The pattern catches quoted literals only. An unquoted object key (as `COLLECTION_PLACES`, `REGISTRY_LIST_KEYS` and `GLYPHS` are written today) or a template literal passes it.
  - "Not changed" is broad ("the entity kinds", "CSS classes", "the option sources"), so a kept key can be filed under a meaning.
- Check 1 (test:quick): yes. It proves no regression only.
- Check 2: yes. It covers only cases 2, 3, 5, 6, 7 and 11.
- Check 3: yes.
- Checks 4 and 5: yes. Removing the listed symbol names passes even if the same mapping survives under another name.
- Check 6: yes.
- Item 1: yes. The fields can be read while the features stay keyed.
- Item 2: yes.
- Item 3: no for the sites it names. Yes overall, because it omits `hubs.ts:221`, `entry-add.ts`, `SaveToLiterature.svelte`, `literature-card.ts` and `registry-file.svelte.ts`.
- Item 4: yes. Helpers alone change no feature.
- Item 5: yes. It is limited to "listed under What is on the tree", which misses `cross-links.ts`, `Editor.svelte`, `registry-file.svelte.ts` and `Entry.svelte`.
- Item 6: yes. It misses `lead-apply.ts`, `state/boards/person.ts` and `cross-links.ts`.
- Item 7: no for placement and labels if `routes/views.ts` and `+page.server.ts` are reached. Yes for Make Folder a Hub, whose path through `make.ts`, `making.svelte.ts` and `MakeGroup.svelte` is not written.
- Item 8: yes. `ticker_sources` still names keys, so the ticker's collection lines for a renamed key stay keyed in config (section 6).
- Item 9: yes.

## 6. Implied inputs

- A view id that collides with oculus's own view ids. Case 4: a hub entry keyed `venues` with no `registry:` gets "a card-list view". The collection view's id is its key (`Collection.svelte:15`, `id`), and `venues`, `data`, `pillars`, `domains`, `leads` and `radar` are oculus's own view ids (`Venues.svelte:5`, `Data.svelte:5`, `Pillars.svelte:5`, `Domains.svelte:5`, `Leads.svelte:5`, `Radar.svelte:6`). Missing: what id that view gets and what a collision does. The expected result would be a card-list tab beside the Venues view, with no registration overwritten.
- One key that is a registry in one hub and plain in another (hub A `grants` with `registry: funding`, hub B `grants` plain). The collection view is registered once per key and joins `collectionsOfKey(key)` across hubs (`selectors.svelte.ts:425-447`). Missing: whether B's plain `grants` is drawn in A's Funding view. Expected: it is not.
- Two hubs with funding under different keys (case 3). There is one collection view per key, so there would be two Funding views, and the Funding view link of a scheme opens its own hub's key. Neither the views nor which `label:` and `group:` win when two hubs give one key different ones is stated.
- `ticker_sources` rows naming keys (`behavior.yml:60-69`): `funding`, `leads` and `venues` name the own loops, and `events`, `education`, `tasks`, `applications` and `joint-work` name collection keys. The setting is workspace-wide and keyed by `collection` (`docs/templates.md:439`). Missing:
  - Whether a registry's row names the registry word or the hub's key.
  - What a hub keying tasks `todo` or applications `jobs` shows in the command center with oculus's rows. Expected per the goal: its lines appear.
  - Case 2 does not cover it.
- `chat_context: [funding, events, education, applications, joint-work, tasks]` (`sources.yml:49`) names keys. A hub that keys funding `grants` and does not set its own `chat_context` gets no grants file in its chat index. Missing; expected that the chat holds it.
- The counts rows of `layout.yml:320-325` are keyed `applications`, `funding`, `education`, `joint-work`, `tasks` and `events`. `counts.ts:60` exempts `APPLICATIONS` from `match`, and `rail-badges.svelte.ts:175-198` reads `countRow(config, key)`. Missing:
  - Which row a `jobs` (`open_badge`) or `todo` collection takes. Case 2's "the badge read `jobs`" depends on a counts row named `jobs`.
  - Whether `counts.ts`'s exemption follows the `open_badge` flag. Item 6 says so.
  - What oculus's rows keyed by oculus's words mean for such a hub.
- Make Folder a Hub reads its rows from the `docs/templates.md` commented list (`templates.ts:48-56`), not from `sources.yml`. So `about:` must be written in `templates.md` too, and the same reader-facing sentence is kept in three files (`sources.yml`, `templates.md`, the demo fixture). The `{ key, file }` shapes in `make.ts:216`, `making.svelte.ts:47` and `make.test.ts:237-240` are unchanged in the paths.
- `ticker_categories` in `vocab.yml` is laid over per hub ("a new word comes after oculus's", `docs/templates.md:180`). The ticker joins hubs. Missing:
  - Whose words and order draw a joined command center.
  - Where a hub's new word `report` lands in drawing order (case 10). Expected: after oculus's eight.
- `noun` is required or optional. Z1012 makes `overdue_noun` optional with `noun` its fallback. Item 8 gives paper, funding and conference no `noun`. A `ticker_sources` row sending an entry collection to `paper`, `funding` or `conference` then has no noun for `generic_in`. Expected result unstated.
- `HubVocab.collections` is `string[]` (`data/model/index.ts:289`). Item 4 changes it. Its reader `left-out.ts:46` is in the paths. Unstated: whether `left-out.ts` (tabs of a placed collection whose key no hub lists) works from the entry's `group:` instead of `isPlacedCollection`.
- `focus_lane_tones: { funding: gold, jobs: grey-d, teaching: teal }` (`vocab.yml:191`) is keyed by band column ids, which are oculus's own words. Checked; nothing is missing.

## 7. ADRs

`ls docs/adr` gives "No such file or directory". `grep -n adr .agents/plan.yaml` prints nothing. The brief's statement holds.

## 8. Dictated text

- `grep -n "ticker_categories. becomes a keyed map" .scratch/migration/agents/briefs/O78.md` (line 59): the eight words.
  - paper (papers, paper).
  - funding (funding, coin).
  - event (talks & events, events, noun event).
  - teaching (teaching, teaching, noun teaching, overdue_noun commitment).
  - position (positions, scout, noun "position deadline", overdue_noun application).
  - collab (joint work, collab, noun "joint work").
  - task (tasks, tasks, noun task).
  - conference (conference calls, conference).

  Holds: ASCII, today's words (`focus.yml:38-45,91-96`), in the catalog file the key lives in. The icons are a departure from ruling 396 (section 2).
- `grep -n "label:. and .glyph:. from" .scratch/migration/agents/briefs/O78.md` (line 47): the `label:` and `about:` values copied from `collection.yml:49-70` and `files.yml:88-104` into `config/defaults/sources.yml`, `docs/templates.md` and the demo fixture. This breaks spec.md "What every package obeys", which says "every user-facing string from a catalog file under `config/text/` through `t("group.key")`". `config/defaults/sources.yml` is neither a catalog nor under `config/text/`, and Z1012 rejects rows in `behavior.yml` on exactly this ground.
- `grep -n "role: attend" .scratch/migration/agents/briefs/O78.md` (lines 47, 73): `dissemination_skip: { role: attend }` and the test rows `role: attend` and `role: present`. Holds.
- `grep -n "label: reports" .scratch/migration/agents/briefs/O78.md` (line 74): `{ label: reports, icon: draft, noun: report }` and "report in 3d". Holds (`draft` is `config/catalogs/glyphs.yml:28`).
- `LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/briefs/O78.md` prints nothing.

## Declined to judge

- Whether G32 of `agents/guarded.md` covers the `collections:` findings tests. That is the orchestrator's call against Axel's entry rule.
- Whether `.scratch/` report writing is an accepted standing exception to spec.md "Where you work". O76 and O77 used it, and no ruling was read.

Agent usage: ab5cec249b37c5055, claude-opus-5-5, 263896 tokens, 81 tool uses, 11 min 55 s.

## Closed

Each finding is closed in `agents/briefs/O78.md` or in the choices it rests on.

- Section 1, the missing paths: every site named is under "What is on the tree" and "Paths this step writes" (`hubs.ts`, `state/boards/person.ts`, `cross-links.ts`, `CommandCenterView.svelte`, `routes/views.ts`, `routes/+page.server.ts`, `data/sources/config.ts`, `SaveToLiterature.svelte`, `literature-card.ts`, `entry-add.ts`, `lead-apply.ts`, `Editor.svelte`, `registry-file.svelte.ts`, `Entry.svelte`, `make.ts`, `making.svelte.ts`, `MakeGroup.svelte`, `make.test.ts`, `referrers.test.ts`, `FieldControl.svelte` whole, the false comments by line range); the hits inside written files are cited in items 3 and 5 to 8.
- Section 2, the step line: Funding obtained, the cross-links, the person page's join and the applied press in `lead-apply.ts` are named in items 5 and 6; the tree words and tab groups name their paths in item 7. The clash with ruling 396 (a): Z1012 is rewritten to follow it, the category glyphs moved to text words named by the vocab word, and the words on the vocab word recorded as the option (b) Axel rejected.
- Section 3, the premises: the count is 418 hits in 134 files; every hit is either a site or named under "Not changed" by meaning; `Focus.svelte:155` is named as the Awaiting strip's row key; the line numbers are corrected (`ticker.ts:108,382,445`, `task-card.ts:27,37`, `templates.ts:70`, `templates.md:61,67-84`, `collections.ts:75-85,87-90`); Read item 4 points at the `stages` map; `career.test.ts` is out of the list and `make.test.ts` and `referrers.test.ts` in; `position_deadline` goes in item 8.
- Section 4, cases and checks: each test names its guarded entry under Z1015 (G32, G9 and the new G131, added at landing); case 12 and checks 4 and 5 use `grep`, not `git grep`; case 1 runs over the demo fixture hub; case 10 runs from a hub's `.oculus/config.yml` with `ticker_categories` added to its template; the case-run program follows the rules file's own rule; the report path is named as the plan-orchestration skill gives a builder; "Where you work" names the worktree, the base copy and its `unused-exports.txt`; the tests go into existing files, so `tests/data/sources` keeps its ten items; the view registration moves into `views/boards/collection/registration.ts` for the size rule.
- Section 5, the question: case 2 covers Disseminated in, Awaiting, the command center's task, position and teaching lines, the task seed, the cross-links, the Literature view's BibTeX and Add and the person page's join; case 12 adds a grep for unquoted object keys; check 5 lists the removed names with the ticker's.
- Section 6, the implied inputs: a key that is one of oculus's view ids and one key in two hubs are Z1016 (item 7, case 4); the ticker's rows are Z1014, moved onto the entry's `ticker:`; `chat_context` stays a list of keys a hub sets itself (item 2); the counts row of a renamed collection is decision 4; `about:` names a word written once in `config/text/`; the hub-joined order of `ticker_categories` and a hub's new word are in item 8; every category word has a noun; `HubVocab.collections` carries the entries and `left-out.ts` places by `group:` (items 4 and 7).
- Section 8, the dictated text: `label:` and `about:` on the entry are rewritten under Z1011 as dotted keys of text-catalog words, so no reader word leaves `config/text/`.
- Declined to judge: the guarded entries are ruled in Z1015; the report under `.scratch/` is the builder's report path that the plan-orchestration skill gives, named in "Where you work".

