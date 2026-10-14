# Brief check of D73: report

Read on main at 6591750a3 (`git log --oneline -3` printed `6591750a3 Book Axel's ruling on open item 94` first; `git status --short` showed only the state file modified and the brief untracked). Everything below was checked read-only. One grep over the whole hub ran past the tool's 120 s limit, was moved to the background by the harness, and was stopped with TaskStop. Every later search used `rg` in the foreground.

## Names

Command: `rg -n --no-heading [--hidden] -g '!local.yml' -g '!secrets/**' -g '!**/node_modules/**' -g '!.agents/**' -g '!**/.scratch/**' -g '!**/build/**' "<name>" .` from the hub root, run once per name. Hits under `tools/cockpit/` are left out below: the cockpit is a cautionary reference, and the step does not touch it.

1. **The demo hub, `tools/oculus/demo/`, is missing from the brief.** It is a shipped hub, tracked (`git log -1 -- demo/.oculus/config.yml` gives `f92a0abe6 Land D74`). Its `.oculus/config.yml` holds `data_domains` (line 8), `domains:` (line 17), `venue_themes:` (line 33) and `data_themes:` (line 49). `demo/registries/` holds `domains.yml`, `venues.yml` and `data.yml`. Its `domains.yml` entries are `method`, `graphs` and `nlp`, with only `key` and `title`.
   - Both copies of the test hub are copies of `demo/` (`tests/data/hubs/hubs-fixture.ts:24-25`).
   - After the change, case 24 makes each of the four keys a finding on the demo hub, and the demo's projects lose their domain colours and theme labels.
   - Neither the brief's premises nor its paths list mentions `demo/`.
2. **`config/text/findings.yml:235`** (`findings.validate.theme_labels_retired`, which says "the labels are data_themes in .oculus/config.yml in the hub, or in config/catalogs/vocab.yml") becomes false. The file is on the paths list, but no item names this line.
3. **`config/text/server.yml:509` (`no_radar_file`) and `src/lib/server/edit/writes.ts:684`.** Item 12 keeps the key `server.write_route.no_radar_file`. Verify step 4 requires `grep -rn "...radar_file" src config` to print nothing. That grep matches this key at both places, so verify 4 and item 12 contradict each other.
4. **`config/catalogs/options.yml:1321`**, the `collections` help, says "the keys data, venues, pillars and domains name the file of the registry ... Each key except data, venues, pillars and domains also becomes a collection view". This is false once `leads` and `radar` name files and are not card lists. The file is on the paths list; the line is not named.
5. **The hub's `.oculus/config.yml:29`**, the `collections:` comment, says the same thing ("except the keys data, venues, pillars and domains"). It becomes false. Item 13 rewrites only the head comment and the comments of the six removed keys.
6. **`config/layout.yml:101`** pins `- { view: literature, pinned: true }` on the Incoming page.
   - After the rename to `literature-search`, the Incoming page would pin the new Literature collection view instead of the search.
   - Item 2's grep for `'literature'` (quoted) cannot find this unquoted YAML value. The brief's premises do not mention the line.
7. **`HELP.md:206`** (the view table row `literature | Literature search`) and **`DESIGN.md:674`** ("`literature` is a listed view of the Incoming group at order 5") become false with the rename. Item 14 does not name them; they fall only under item 2's "every reader of the id".
8. **`HELP.md`.**
   - Line 302 ("Show Hidden Files ... Show Ignored Files ... are off until turned on") is covered by item 14's Files default.
   - Line 466 ("`vocab.yml` (words and their colours: ... domains and theme words)") becomes false and is not named.
   - Line 472 (the engine holds `leads_file`, `radar_file`) and line 474 (the `domains`, `venue_themes`, `data_themes` paragraph) become false. Item 14 points at "lines 471-473" only.
9. **`DESIGN.md`.**
   - Line 599 ("the research domains' colours keyed `domains`") becomes false and is not named.
   - Line 694 (the theme words in `venue_themes` and `data_themes` of the hub settings file) becomes false. It also names `src/lib/data/snapshot/validate-themes.ts`, which does not exist (`rg` gave "No such file or directory").
10. **`docs/DATA-MAP.md`.** Item 14 names rows 229 and 561 and "the collection rows". These other hits become false and are not named:
    - line 186: "each feed view the file that its key in `.oculus/config.yml` names: `leads_file`, `radar_file` and `linkedin_dir`";
    - line 230: the `domains`, `venue_themes`, `data_themes` row;
    - line 232: `leads_file`, `radar_file` in the sources row;
    - lines 283 and 287: "(the `data_themes` / `venue_themes` of `.oculus/config.yml`) | schema `from`";
    - line 289: "the keys of the `domains` map of `.oculus/config.yml`, each naming the registry entry";
    - line 296: `leads_file`, `radar_file`;
    - line 314: "`themes` (vocabulary keys)";
    - line 508: "`options` | the literal values of a `select`", which is false once a `tags` field takes `{ key, label }` options. The schema attribute table at lines 504-516 also has no `filter` row, and item 14 does not ask DATA-MAP for one.
11. **`docs/apps.md`.**
    - Line 367 gives the apps API `config` payload as `hubs.lists: map of hub name to { domains: map, venue_themes: list, data_themes: list }`. Item 11 changes that shape, which apps can see. Item 14 asks apps.md only for `filter`.
    - Line 354 (the collection `schema?` key list, `options?`) changes too, since an option may now be a map.
    - Line 349 (`domains` records: `id, title, projectIds; blurb?`) would gain `color` and `expects_datasets` if the page reads them from the domain record.
12. **Readers of `HubVocab` outside the paths list.**
    - `src/lib/server/root/watch/portfolio.ts:612` and `src/lib/server/root/context.ts:285-288` (callers of `hubVocabs` and `readHubVocab`, `rg -n "hubVocabOf|HubVocab\b|hubVocabs" src`).
    - `tests/server/root/context-fixture.ts:172` and `tests/shell/rail/rail-fixture.ts:31`. These two are covered by the test catch-all.
    - The first two are not on the paths list.
13. **Readers of a schema field's `options` outside the paths list.** From `rg -n "\.options\b" ...`:
    - `src/lib/data/helpers/files/yaml/collection-text.ts:262-263` (takes `options[0]` as a select's default);
    - `src/lib/state/boards/ticker.ts:99`;
    - `src/lib/views/shared/forms/InPlace.svelte:46`;
    - `src/lib/server/edit/writes/entries.ts:89` (the type check of a write, which item 11 says must read labels from the options). The paths list narrows `src/lib/server/edit/` to "the new write kind and its refusals".

    Changing `SchemaField.options` from `string[]` touches all four.
14. **`src/lib/data/index.ts:251-255` `FEED_FILES`** hard-codes `feeds/position-leads.yml` and `feeds/literature-radar.yml` beside the config. Once the engine's `collections:` names these files, this is a fallback the rules file bans (spec.md:53). The brief does not name it.
15. **The reference index.**
    - `src/lib/data/snapshot/references/specs.ts:11-12` and `90-94` state the `domains:` map rule; the paths list covers `references/`.
    - `src/lib/data/snapshot/schema/lists.ts:17-35` (the `vocab.<key>` lists) is covered by `schema/`.
    - `scan.ts:258` (`defineVocab`) gives theme words their definition in a vocabulary list. Once the words move into a schema's `options`, the brief does not say where a theme word's definition is.
16. **Registry text the builder edits.** Item 11 drops `from:` but does not ask for these sentences to be rewritten; each becomes false:
    - `registries/domains.yml:1` (head comment: "card colour and label come from the `domains` map of .oculus/config.yml");
    - `registries/venues.yml:27` help ("Theme words from the venue_themes list of .oculus/config.yml");
    - `registries/data.yml:28` help.
17. **Tests holding the removed keys.** All are covered by "a test whose fixtures hold the removed keys":
    - `tests/checks/config/config-folder.test.ts:128,191-192,221-222`;
    - `tests/checks/config/config.test.ts:330,345`;
    - `tests/server/edit/config-value.test.ts:110-134`, which uses `data_domains` as the hub key in G8 rows;
    - `tests/data/snapshot/rename.test.ts:192`;
    - `tests/data/snapshot/reference-hub.ts:186`;
    - `tests/data/snapshot/normalise.test.ts`.
18. **No collisions for the new names.** `rg -n "literature-search|literature_search|In Literature|Save to Literature|expects_datasets|lit-watch" src config tests docs HELP.md DESIGN.md README.md demo` printed nothing. A `filter` key exists only on other types (`model-sessions.ts:413`, `model-debug.ts:82`, `files-view.ts:182`); none is a SchemaField.
19. **The project card trees share the Files toggles.** `src/lib/views/shared/explorer/ProjectTree.svelte:6-8` says the card tree "keeps its state in the record the card owns ... a record of the Files view's shape", read through `filesViewOf` (`rooted-tree.svelte.ts:110-117`). Changing the defaults in `emptyFilesView` and in the `.catch` therefore also makes every project card's tree list dotfiles, `.git`, `node_modules`, `__pycache__` and ignored entries. The step line says "the Files view".

## The step line

The step line's parts mapped to "What to build":

1. Saved papers in `registries/literature.yml` as the collection `literature`, with its schema and citation keys: items 1 and 3.
2. Save to Literature on the search and Lit Watch cards, no duplicates, the card reading In Literature: item 4.
3. Add by DOI or URL: item 5.
4. `filter: true` fields drawn as filters in every collection view: item 6.
5. A venue linked to its record: item 7.
6. Copy BibTeX on card, page and shown entries: item 8.
7. The view in the rail beside Literature search and Lit Watch: item 2 (group `incoming`, order 6). Order 6 sits after Literature search (5); Lit Watch is order 1. The Incoming page arrangement (`config/layout.yml:101`) is not addressed (Names 6).
8. Files shows hidden and ignored files by default, in new tabs and in every open tab, with the two header items still hiding them: item 9.
   - Decision 9 keeps a stored `hidden: false` / `ignored: false`, which narrows "every Files tab already open". The ruling line reads "in new and open Files tabs alike". Decision 9 is listed as reversible, but it is a departure from the ruling's letter that Axel has not ruled on.
9. "`HELP.md` and `DESIGN.md` say the new default": **this part has no requirement for DESIGN.md.** Item 14 asks HELP.md for the Files default, but DESIGN.md only for the Literature view, `filter:`, the `{ key, label }` options and the domain fields.
10. 94 (1), domains with `color` and `expects_datasets`, the title as the card label: item 10.
11. 94 (2), the theme lists as `options:`: item 11.
12. 94 (3), `leads` and `radar` as `collections:` entries: item 12.
13. The hub's `.oculus/config.yml` and three registries changed once by hand at landing, with no migration code: item 13. **Item 13 departs from the step line.** It has the builder edit `registries/domains.yml`, `venues.yml` and `data.yml` in the worktree, and create `registries/literature.yml` (item 1). The step line puts all four hub files at landing, by hand.
14. HELP.md, DESIGN.md and DATA-MAP say the new places: item 14, partial (Names 7-10).

## Premises

1. `ls registries/`: boilerplate, career, data, domains, organisations, people, pillars, resources, venues. Holds.
2. `grep -n "collections:" -A 15` on both files: `config/sources.yml:29` header with entries at 30-43; `.oculus/config.yml:30` header with entries at 31-44. Fourteen entries each, ending `tasks`. Holds.
3. `Literature.svelte:6` is `id: 'literature'`, group `incoming`, order 5. `config/text/views/feeds/literature.yml:104-105` are `literature: Literature search` and `literature_glyph: book`. `grep -rn "order:"` gives Inbox 0, Radar 1, Leads 2, Linkedin 3, Calendar 4, Literature 5. Holds.
4. `Collection.svelte:8-19` (placements) and `21-30` (registration) hold. `src/routes/views.ts:68-69` is the doc comment; the code that leaves out built-in ids is at lines 76-84 (`const builtIn` at 76, `const free = keys.filter((key) => !builtIn.has(key))` at 84). Holds in substance.
5. `SchemaField` at `model-collections.ts:56-82`, `options?: string[]`, no `filter`: holds. `fieldOf` at `field.ts:46-67` reads the listed keys: holds. `FIELD_TYPES` at `record.ts:51-61`: holds.
6. The search is at `Collection.svelte:293-298`, not 295-297. Facets begin at 299. Small line drift.
7. Literature search card:
   - `LiteratureCard.svelte` is 212 lines (`wc -l`); `bibtex.ts:70` sets `useIdAsLabel = false`; `radar.ts:23` `inRadar`; `literature.ts:29` `addressKey`; `literature.ts:34` `sameTitle`; `literature.ts:80` `queryDoi`; `literature.ts:92` `arxivId`; `literature.ts:109` `pubmedId`; `merge.ts:64` `MergedHit`. All hold.
   - `MergedHit` also carries `key`, `citesBy`, `oa` and `pdf`, which the brief does not list.
8. `RadarCard.svelte` and `LeadCard.svelte` are in `src/lib/views/shared/card/feed/`. Holds. The 616 radar entries have no `doi` key (python over `feeds/literature-radar.yml`). Holds.
9. `entry-add.ts:31` `collectionAsk`, `selectors.svelte.ts:157,404`, `feeds.ts:465` `addRadarEntry`, `package.json:62-63`: hold. The venue record has `id` and `name` (`model-entities.ts:410-412`). Holds.
10. **The citation-js label does not reproduce for the search's own name form.** Run with `node --input-type=module -e "... new Cite([item]).format('bibtex',{format:'text'}) ..."` in `tools/oculus`, with `useIdAsLabel = false`:
    - authors as `{ literal: 'Axel Faes' }`, which is how `cslOf` (`bibtex.ts:49-55`) builds them, gives `@article{Axel2024Block,`;
    - `{ given: 'Axel', family: 'Faes' }` gives `@article{Faes2024Block,`;
    - `{ literal: 'M<u with diaeresis>ller' }` gives `@article{Muller2025Uber,`;
    - no author and no year gives `@article{Tensor,`.

    So item 3's sentence "citation-js's own label, lower-cased, gives the same letters for an author and a year" is false for a hit as `cslOf` passes it: it gives the given name.
11. Files:
    - `files-view.ts:191-192` and `232-233`: hold.
    - `WorkspaceHeader.svelte:84-85` and `files.yml:129-130`: hold.
    - `fs.ts:130` `SKIPPED` and `fs.ts:141` `DEFAULT_SHOWN`: hold. `place.ts:65` `SHOWN_DEFAULT`: holds.
    - `git check-ignore -v side-projects/theaxec.github.io/` printed `.gitignore:22:/side-projects/theaxec.github.io/`. Holds.
    - "its callers `ops.svelte.ts:709`, `tab-roots.ts:121,160`" is incomplete. `rg -n "patchedFilesView" src` also finds `tab-actions.ts:48`, `view-access.ts:28`, `ProjectTree.svelte:68`, `CardDocs.svelte:80` and `follow.ts:152`. Item 9 asks the builder to read every writer, so the shortfall is only in the premise.
12. Open item 94 lines in the hub config:
    - `.oculus/config.yml:47` `leads_file`, `50` `radar_file`, `69` `data_domains`, `76` `domains:` with twelve keys, `91` `venue_themes:` (13 rows), `107` `data_themes:` (11 rows): hold (sed and python).
    - Engine: `vocab.yml:51` `domains: {}`, `239` and `242`; `behavior.yml:26`; `sources.yml:47,51`; `HUB_LIST` at `hub-names.ts:225-245`. All hold.
13. `registries/domains.yml`: twelve entries, schema fields `key`, `title`, `blurb`. The titles differ from the config labels only for `method` and `cs`, as the brief says (python compare). Holds.
14. **The readers list is incomplete.** Rerunning the brief's grep (`grep -rn "data_domains\|dataDomains\|venue_themes\|data_themes\|leads_file\|radar_file\|vocab.domains" src config --exclude=local.yml`) gives every line the brief lists, plus `src/lib/server/edit/writes.ts:684` and `config/text/findings.yml:235`. The brief omits both. The grep pattern also cannot find the domains-map readers `config.domains` and `merged.domains` (`deck/read.ts:93`, `index.ts:323,406`, `catalogs.ts:67`). The brief names those separately.
15. `registries/venues.yml:27` and `registries/data.yml:28` hold `from: vocab.venue_themes` and `from: vocab.data_themes`. `retrieval.method` has `options: [...]` (`data.yml:38`). Holds.
16. **Missing premise: several write-list folders already hold ten items.** `ls -A | wc -l` gives 10 for `src/lib/state/boards`, `src/lib/views/shared/forms/entry`, `src/lib/server/edit`, `src/lib/data/snapshot/schema` and `src/lib/data/prose`. File sizes are close to the limits: `EntryCard.svelte` 499 of 520, `feeds.ts` 788, `collection.ts` 700 (`wc -l`).
    - A new file in any of these folders forces a split into subfolders that the paths list does not name.
    - Item 4's "or a card action file" lands in a full folder.

## Cases and checks

1. **Item 13 and item 1 break the rules file.** spec.md:37 says the builder never writes under `registries/`. spec.md:104 allows a write to a hub data path only "through the script the brief names and by nothing else". Hand rewording is allowed only for "lines of hub text ... where a ruling of Axel's asks for the rewording", and ruling 94 says "by hand at landing". The brief names no script.
2. **Cases 1-13 and 18 do not say where the save writes.** spec.md:37 requires synthetic fixtures in a temporary directory, with the path checked before any write. The cases say "the file gains one entry" without naming a scratch hub, so a builder's run could write the worktree's real `registries/literature.yml`.
3. **Cases that only a page shows.** Cases 1 (card reads In Literature), 8 and 9 ("its page opens"), 11, 12, 13 (clipboard), 14, 15, 16, 20, 21, 23, 25, 26 and 27 are "checked by a run the report quotes" (brief line 109). The rules file (spec.md:63-64) says such a case is checked by reading and by unit-level runs, and its proof is the look on landing, with the view, state and expectation named. The brief never says this for these cases.
4. **The test list leaves out units the change touches.** The rules file's test rule (spec.md:58) asks for one row per input that gives a different outcome, for each unit an entry covers. The brief limits tests to item 15.
   - Case 28 is a new input (`collections:` keyed `radar`) to the reader under G13. Its existing row is `tests/data/sources/manifests.test.ts`, 'reads a registry from the collections entry that names it and leaves the others unnamed'. G32 also covers this reader.
   - Cases 17 and 25 are a new option form (`{ key, label }`) for G56's "a value outside its options".
   - These are G13, G56 and G32 rows the brief neither asks for nor rules out.
5. **Item 15 names a G67 row as a G66 row.** It names 'a key of the domains: map of vocab.yml, the domains registry entry and the engine reference' in `tests/data/snapshot/rename.test.ts` under G66. In `agents/guarded.md` that row sits on line 154, the Test line of G67 (the rename), not G66. Case 29 is the G67 behaviour that replaces it.
6. **Item 3 and case 9 conflict.** Case 9 expects the key `tensor-notes`, with a hyphen. Item 3 states the key rule as "lowercase ASCII letters and digits only (... every other character dropped)", which gives `tensornotes`. Item 5 gives the address word as the key source but does not say whether item 3's character rule applies to it.
7. **Verify 4 conflicts with item 12** (Names 3).
8. **Verify 1 may be red in the worktree. Not verified.** `npx vitest run tests/checks` includes `tests/checks/config/integrity.test.ts`, which asserts `snapshot?.findings` equals `[]` (line 169). The worktree's real hub keeps the six old keys until landing, and case 24 makes them findings. Whether those hub-layer findings reach `snapshot.findings` is not settled: `rg -n "findings" src/lib/data/index.ts` shows the snapshot's findings built from manifests, registries, collections, feeds, career, deck and validate. A run of that test in the worktree after the change would settle it.
9. **Cases that ask the builder to check a place the step does not change.**
   - Cases 22, 25 and 26 compare with behaviour "as today". This is the unchanged tree, which the first run covers anyway.
   - Case 20 depends on `.gitignore:22` and on `side-projects/theaxec.github.io` existing. A git worktree does not check out a git-ignored folder, so the folder does not exist in the builder's worktree, and the builder may run no git command.
10. Case 16 is consistent with spec.md:42 (no code reads the old id). Case 17 is consistent with `flagShape` (`field.ts:43`): `node -e` with the `yaml` package parses `a: yes` as the string `"yes"`, so `filter: yes` reads as absent with no finding.

## The question

The plan has no Goal section: `grep -n "^## " plan.md` lists Packages, Could run in parallel, Rulings, Agents and Blocked. The goal used here is the step line's behaviour. The step line carries no separate check; its two checkable clauses are "`HELP.md` and `DESIGN.md` say the new default" and "changed once by hand at landing".

Cases:

- Case 1: could pass. A server write run proves the key and the entry, not the card reading In Literature; that needs the look.
- Cases 2, 3 and 18: could not pass without the goal; they are server rows with exact outcomes.
- Case 4: could not.
- Case 5: could not.
- Case 6: could not.
- Case 7: could pass if the run calls the write with fields the test supplies, without the Lit Watch card ever offering Save.
- Case 8: could pass. "With the sources answering" can be met with stubs while the page's lookup and merge are never wired to Add.
- Case 9: could pass with either key spelling, since items 3 and 5 disagree.
- Case 10: could not. It is the existing Add.
- Cases 11, 12, 13, 14, 15 and 16: could pass. Each is a page behaviour with no look named as its proof.
- Case 17: could not.
- Case 19: could pass. "Drawn as text" is a page fact.
- Cases 20 and 21: could pass by reading the defaults. Neither covers the project card trees (Names 19), and case 20's folder is absent in the worktree.
- Case 22: could not.
- Case 23: could pass by reading. It is a page colour.
- Case 24: could pass while the demo hub keeps the six keys and shows four findings (Names 1).
- Cases 25 and 26: could pass while the theme words lose their definition in the reference index (Names 15).
- Case 27: could pass by reading. It is a page fact.
- Case 28: could pass while `leads` and `radar` are also read as generic collections, since no case checks that they are not.
- Case 29: could not, if run over the planted hub.

The step line's two checkable clauses:

- "HELP.md and DESIGN.md say the new default": could pass without the DESIGN.md half, since item 14 does not ask for it.
- "changed once by hand at landing": item 13 moves three of the files into the build, so the clause is not what is checked.

Items of "What to build":

1. Could not.
2. Could pass while the Incoming page still pins `literature` (Names 6).
3. Could pass while the surname is taken wrongly for the name forms the sources give (see Implied inputs 1).
4. Could pass with the page rule unbuilt; In Literature is a look.
5. Could pass with stubbed sources.
6. Could pass for the literature file only. "Every collection" is proven by case 14 alone, by reading.
7. Could pass by reading; it needs the look.
8. Could pass by reading; it needs the look.
9. Could pass while card trees change and decision 9 leaves open tabs hidden.
10. Could pass while the demo hub and `docs/apps.md:349,367` keep the old shape.
11. Could pass while a malformed `{ key, label }` row reads silently and the theme definitions vanish.
12. Could pass while `FEED_FILES` stays as a hardcoded fallback.
13. Could not, but it breaks the rules file (Cases and checks 1).
14. Could pass with the HELP, DESIGN and DATA-MAP lines of Names 7-10 left false.
15. Could not for its rows. It misattributes one row (Cases and checks 5).

## Implied inputs

Each item is an input the step implies but "Cases" does not state, with its expected result.

1. **The surname from the name forms the sources give.**
   - Forms: `pubmed.ts:232` gives "ForeName LastName"; `crossref.ts:140` gives "given family"; Europe PMC's `authorString` is "Faes A"-style (`europe-pmc.ts:80`); WoS gives `displayName` ("Faes, Axel"); Scopus gives `dc:creator`.
   - The merge keeps the longest author list (`merge.ts:179-180`).
   - "Faes A" taken by last word gives `a2024...`, and "Faes, Axel" gives `axel2024...`.
   - This has happened: every search hit comes through these parsers.
   - Expected: the rule states how a surname is read from each form, and a case pins "Faes A" and "Faes, Axel" to `faes`. Also "Marc M. Van Hulle" or "Khanh Dao Duc" (radar line 6) needs a stated surname (`vanhulle` or `hulle`).
2. **The first Save into the new `entries: []` file**, written in flow form by item 1. It happens on the first use. Expected: the entry is appended as a block list item and the reparse holds. Case 1 covers it only if run on a copy of the new file, which the case does not say.
3. **A hub with no literature file.** This applies to the demo hub, any second hub, and a hub whose `collections:` omits `literature` while the engine path file is absent. Expected: a stated refusal sentence, or the file made with its schema. The brief gives neither.
4. **The source lookup in Add fails** (a network error, a rate limit, a timeout), as opposed to "finds nothing". This has happened with these sources. Expected: say which happened; it is unstated whether an entry with the bare url is saved.
5. **Add with a bare DOI that no source knows.** Expected: unstated. Item 5 would make the url the bare DOI and the key `j.neucom.2024.127654`, with dots, against item 3's character rule.
6. **An address whose last path word is empty or a file name** (`https://example.org/`, `.../paper.pdf`), or whose word is a key the file already holds. Expected: unstated; it should be suffixed as item 3 suffixes.
7. **DOI forms in the duplicate rule.** `http://`, `dx.doi.org` and `DOI:` forms fall outside the duplicate rule's two prefixes. `normalDoi` behind `queryDoi` (`literature.ts:77-82`) already accepts `https?://(dx\.)?doi\.org/` and `doi:`. Expected: one DOI rule, reused (spec.md:86).
8. **The title compare.** Item 4's compare (drop every non-letter, non-digit) and `sameTitle` (`literature.ts:34`, trim and lower case) would be two title rules in one feature. Expected: name which rule the In Literature check on the Lit Watch card uses.
9. **A domain `color` that is not `#rrggbb`.** This is a hub value reaching a style attribute; spec.md:70 says it is untrusted. Today it passes `colorShape` (`tones.ts:97`). Expected: a finding, and the domain drawn as unlisted. No case.
10. **A malformed `{ key, label }` option row** (no key, no label, a number, a duplicate key). Expected: a finding naming the file and line (G56). No case.
11. **`filter: true` on a `date`, `checkbox`, `textarea`, `metalist` or `records` field, or on a feed file's schema.** Item 6 covers `select`, `tags` and `text` only. Expected: unstated.
12. **The project card trees** (Names 19). Expected: decide whether the new default applies there. If it does, `.git` and `node_modules` show in every card with no header menu to hide them.
13. **The Incoming page arrangement** (`config/layout.yml:101`). Expected: `literature-search` pinned where the search was. Whether the new `literature` view is also pinned is a user-visible choice the brief does not name.
14. **`collections:` entries keyed `leads` and `radar` read as generic collections.** These would land in `snapshot.collections`, the apps `collections` payload, the badges and the referrers. Expected: left out, as `data` and `venues` are. No case.
15. **A hub whose `collections:` names a `radar` file that does not exist.** A registry the list names and does not hold is a finding (G13 row); a feed file today gives "nothing and no finding" (DATA-MAP:296). Expected: unstated.
16. **Save over a literature file that a source tab holds unsaved text of** (G28). Expected: refused before it is sent. This needs `write-files.ts` to name the new write kind's file, which is outside the paths list.
17. **The demo hub's config and registries** (Names 1). Expected: changed with the step or named, so no shipped hub carries the removed keys.
18. **The worktree's real hub config still holding the six keys** while the builder runs cases 20 and 22-28 and the `tests/checks` run (Cases and checks 8). Expected: unstated.
19. **The search view's glyph.** `views.literature_search_glyph` has no value given, and the new view takes `book`. Two rail entries could carry one glyph.

## ADRs

1. None. `ls docs/adr tools/oculus/docs/adr` printed "No such file or directory" for both.

## Dictated text

Commands: `grep -n 'title: Literature`\|views.literature: Literature\|views.literature_glyph: book\|views.literature_search\|Save to Literature\|In Literature\|key: literature, file\|...' D73.md` for the lines, and `LC_ALL=C grep -n '[^ -~]' D73.md`, which printed nothing (exit 0).

1. `title: Literature` (line 47): holds.
2. `{ key: literature, file: "registries/literature.yml" }` (line 47): holds.
3. The schema field names and the `source` options `search`, `lit-watch`, `hand` (line 47): hold.
4. `views.literature_search`, `views.literature_search_glyph` (line 48), key names only: hold.
5. `views.literature: Literature`, `views.literature_glyph: book` (line 48): hold.
6. The label "Save to Literature" (lines 50, 74, 80, 140): holds.
7. The label "In Literature" (lines 50, 74): holds.
8. The label "Copy BibTeX" (line 54): holds; it is the existing label.
9. Decision 7's example `- { field: themes, type: tags, options: [{ key: core-ml, label: "Core ML" }, { key: clinical, label: "Clinical" }, ...], help: "..." }` (line 142). It is not dictated in full: `...` and `"..."` are placeholders. The parts given hold.

## Declined to judge

1. Whether hub-layer config findings reach `snapshot.findings`, and so whether `integrity.test.ts` turns red in the worktree. It needs a run of the changed code, which a brief check cannot do.
2. Whether any saved Files tab state under `~/.oculus` already holds `hidden: false` or `ignored: false`, which bears on decision 9. Reading under `~/.oculus` is forbidden.
3. Which file is "the reader of a schema in the apps API" (item 6). The brief names no file. `rg -n "open:\s*z\.|map:\s*z\.boolean" src` found no zod schema-field reader outside `field.ts`.
4. Whether `src/lib/server/root/watch/portfolio.ts` and `context.ts` need edits or only follow a changed `HubVocab` type. That depends on the builder's shape.
5. Line-level reading of DESIGN.md beyond the hits quoted. The rules file says a brief names the sections to read.

## Closed

Each finding, with what changed in `agents/briefs/D73.md`:

- Names 1 and Implied inputs 17: the demo hub is in the brief, moved to `tests/fixtures/hubs/demo/` and given the new shapes (Part E, item 22; open item 99, Z880).
- Names 2: `findings.yml:235` named in items 11 and 14.
- Names 3 and Cases and checks 7: Verify 4 is `grep -rnw`, which does not match `no_radar_file`.
- Names 4 and 5: `options.yml:1321` and the hub config's line-29 comment named in items 14 and 15.
- Names 6 and Implied inputs 13: `config/layout.yml:101` named in item 2; the Incoming page pins both views (Z883).
- Names 7 to 11: the document lines are named again by content in item 23, against the rewritten documents.
- Names 12: `portfolio.ts:612` and `context.ts:285-288` on the paths list; `hubs.lists` keeps its shape (item 12, Z881).
- Names 13: the four readers of `options` named in item 11 and on the paths list.
- Names 14: `FEED_FILES` goes (item 13).
- Names 15: a theme word's definition is its option row (item 11).
- Names 16: the registry text goes into the Doc text (items 10, 11, 15).
- Names 17: the tests are named on the paths list.
- Names 19 and Implied inputs 12: the project card trees keep both kinds out (item 9, Z882).
- The step line 8 and decision 9: the toggles' keys are renamed so every open tab follows the ruling (item 9, decision 10).
- The step line 9: DESIGN.md names the Files default (item 23).
- The step line 13 and Cases and checks 1: every hub file (config and the four registries) is Doc text applied at landing (items 1 and 15).
- Premises 6, 7, 11, 14 and 16: the line drift, the `MergedHit` fields, the `patchedFilesView` callers, the readers and the full folders are in the premises; the paths list allows a subfolder.
- Premises 10 and Implied inputs 1: the key is oculus's own function with a stated surname rule over the sources' name forms (item 3, decision 5, case 5); the citation-js sentence is gone.
- Cases and checks 2: every writing case runs on a scratch hub (the Cases section's head).
- Cases and checks 3: the page-only cases are marked "the look" and proven at landing.
- Cases and checks 4 and 5: G13, G56 and G67 rows in item 24.
- Cases and checks 6 and Implied inputs 5 and 6: one character rule for every key source; case 9 gives `tensornotes`.
- Cases and checks 8 and Implied inputs 18: the last paragraph of Cases says how a red line caused only by the worktree's hub data is reported.
- Cases and checks 9: case 20 runs on a scratch git repository.
- Implied inputs 2: case 1 writes into a new `entries: []` file.
- Implied inputs 3: a hub with no literature file refuses Save with a sentence (item 4).
- Implied inputs 4: a lookup whose sources fail saves nothing (item 5, decision 11).
- Implied inputs 7 and 8: one DOI rule (`normalDoi`) and one title rule (`sameTitle`, decision 3).
- Implied inputs 9 and 10: a bad colour and a bad option row are findings (items 10 and 11, cases 23 and 25).
- Implied inputs 11: `filter: true` on another type is a finding (item 6, case 14).
- Implied inputs 14 and 15: `leads` and `radar` are no generic collections, and a named missing file is a finding (item 13, decision 12, case 28).
- Implied inputs 16: the save is refused over unsaved text (item 4, `write-files.ts` on the paths list).
- Implied inputs 19: the search takes the glyph `search` (item 2).
- Declined to judge 1: the last paragraph of Cases. Declined 2: answered by the key rename. Declined 3: the apps' `collections` payload carries `filter` (item 6). Declined 4: both files on the paths list.

Usage: agent a70d783a1699be8de, claude-opus-5-5, 239,040 tokens, 92 tool uses, 16.1 min.

After D76 landed (8e41021f3), every line number of the brief's "What is on the tree" in a file D76 changed was read again on main's head and corrected in the brief: `HELP.md:201` and `:279`, `DESIGN.md:675` and `:695`, `files-view.ts:200-201` and `:241-242`, `files.yml:128-129`, `ops.svelte.ts:755` and the new caller `notes-section.svelte.ts:92,99`, `fs.ts:131` and `:142`, the templates' lines 419, 454, 475, 495 and 511, and `rooted-tree.svelte.ts` named at its real path, `src/lib/views/shared/explorer/`.
