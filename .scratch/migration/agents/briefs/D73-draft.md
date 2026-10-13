# Brief: D73, the Literature view: saved papers as the collection `literature`, Save to Literature from the two feeds, Add by DOI or URL, schema filters in every collection view, a venue linked to its record, Copy BibTeX

Size: a full step

Read `tools/oculus/.scratch/migration/agents/spec.md` first; its rules govern this step unchanged. The configuration lists no standards pages, and the repository has no ADR folder.

A design ruling decides what is built. It never exempts the code: every line is written to the standards pages, so that people can read, use and maintain it.

Authority: open item 76 (agreed by Axel as proposed, the lazy option (b) rejected), the D74 split, Z868.

## What is on the tree (read on main at f3c588783, D72 landed)

The file and the collection list:
- `registries/literature.yml` does not exist (`ls registries/`: boilerplate, career, data, domains, organisations, people, pillars, resources, venues).
- The collections are listed twice, in `tools/oculus/config/sources.yml:54-68` and in the hub's `.oculus/config/sources.yml:59-73`, fourteen entries each, ending with `tasks` (`grep -n "collections" -A 16` of both).

The key `literature` is taken (Z868):
- The Literature search view registers the id `literature` (`src/lib/views/feeds/literature/Literature.svelte:6`), in the group `incoming` at order 5, with the words `views.literature: Literature search` and `views.literature_glyph: book` (`config/text/views/feeds/literature.yml:103-105`).
- A collection's key is the id of its view: `Collection.svelte`'s `registration` (`src/lib/views/boards/collection/Collection.svelte:21-40`) registers one view per key, label `views.<key>`, glyph `views.<key>_glyph`, placed by the `placements` map (`Collection.svelte:8-19`) or in `references` from order 100.
- `registerCollections` (`src/routes/views.ts:64-89`) leaves out a key that is a built-in view's id ("A key that is the id of a view a module registers as its own is left out", `views.ts:68`), so a collection keyed `literature` gets no view on this tree. Z868 renames the Literature search view's id to `literature-search`.
- The incoming group's orders (`grep -n "order:"`): Inbox 0, Lit Watch (`radar`) 1, Leads 2, LinkedIn 3, Calendar 4, Literature search 5.

The schema:
- `SchemaField` (`src/lib/data/model/model-collections.ts:29-54`) has no `filter` key; `fieldOf` (`src/lib/data/snapshot/schema/field.ts:46-67`) reads `label`, `options`, `from`, `required`, `help`, `when`, `open`, `map`, `fields`.
- The type words are `FIELD_TYPES` (`src/lib/data/snapshot/schema/record.ts:50-60`): text, textarea, date, checkbox, select, tags, metalist, raw, records. There is no number or year type; Lit Watch's `year` is `type: text` holding a whole number (`feeds/literature-radar.yml:17`, values such as `year: 2026` at line 38).
- The collection view's bar (`Collection.svelte:291-318`) draws a search and the status facets (`statusFacets`, `applyCollectionFilters` of `src/lib/state/boards/collection.ts`); no other filter exists.

The two feeds and the search:
- The Literature search card (`src/lib/views/feeds/literature/LiteratureCard.svelte`, 212 lines) has Copy BibTeX (`entryFor`, `src/lib/state/feeds/literature/bibtex.ts:75`, citation-js with `useIdAsLabel` off at line 70, so the entry key is citation-js's) and Add to Lit Watch / In Lit Watch (lines 145-160), the form `AddForm.svelte` sending `addRadarEntry` (`radarFields`, `src/lib/state/feeds/literature/radar.ts`).
- Whether Lit Watch holds a paper is `inRadar` (`radar.ts`), by `sameTitle` (`src/lib/data/prose/literature.ts:34`, trim and lower case, punctuation kept) or `addressKey` (`literature.ts:29`).
- `MergedHit` (`src/lib/state/feeds/literature/merge.ts:64-90`) carries title, authors, venue, year, date, type, abstract, cites, url, doi, pmid, arxiv, s2 and sources; no keywords.
- A search whose query is a DOI is a DOI lookup: `queryDoi` (`literature.ts:80`) recognises a DOI with or without `https://doi.org/` or `doi:`, the request sets `query.doi` (`src/lib/server/content/literature/request.ts:97`), and Crossref answers the one work (`sources/crossref.ts:120-128`). `arxivId` (`literature.ts:92`) reads an arXiv address; `pubmedId` (`literature.ts:109`) a PubMed id.
- The Lit Watch card is `src/lib/views/feeds/radar/RadarCard.svelte`; a radar entry holds title, authors, venue, year, url, bucket, project, relevance, why and the rest of `feeds/literature-radar.yml:12-27`, no DOI.

D72's Add and cards:
- Add on a collection is `collectionAsk` (`src/lib/views/shared/forms/entry/entry-add.ts:30-49`), asking the identity field and writing `newEntry`; the page opens by `pageView` (`src/lib/state/forms/page-entry.ts`).
- A collection card is `EntryCard.svelte` (`src/lib/views/shared/forms/entry/`, 499 lines) with an `extra` slot of actions (`task-card.ts`, Start Agent on a task's card).
- The venues are on the page as `selectors.venues()` (`src/lib/state/client/selectors.svelte.ts:149,383-385`); a venue record has `name` and `id` (`registries/venues.yml:38`).

Guarded entries this step falls under (`agents/guarded.md`): G8 (each write kind changes only its file and key), G9 (each write is logged and its undo puts the file back), G45 (hits that share an identifier are one hit), G5 (feed text reaches HTML only through the sanitiser).

No ADR touches the step: the repository has no ADR folder.

## What to build

1. The collection. `registries/literature.yml` is created with a `title:` ("Literature"), an `intro:`, a `schema:` and `entries: []`, and is added to both `collections:` lists as `{ key: literature, file: "registries/literature.yml" }`. Its schema, in this order: `key` (text, required; the citation key, the identity field), `title` (text, required), `authors` (tags), `venue` (text), `year` (text, a whole number), `doi` (text), `url` (text), `abstract` (textarea), `keywords` (tags), `projects` (tags, `from: projects`), `source` (select, options `search`, `lit-watch`, `hand`), `added` (date), `note` (textarea); `venue`, `keywords`, `year`, `projects`, `source` and `authors` carry `filter: true`. Each field has its `help:` sentence.
2. The Literature search view's id becomes `literature-search` (Z868): its registration, its words (`views.literature_search`, `views.literature_search_glyph`), and every reader of the id (the grep of `'literature'` as a view id across `src/`, `config/` and `tests/`). The collection's view is placed in the group `incoming` at order 6, after the Literature search, so the chords of the views before it stay as they are, and its words are `views.literature: Literature`, `views.literature_glyph: book`.
3. The citation key. A saved paper's key is the first author's surname, the year and the first word of the title, lowercase ASCII letters and digits only (accents stripped as `slugOf` strips them), with `b`, then `c` and on, appended when the file holds the key already; a paper with no author uses `anon`, with no year `nd`, with no title word nothing. One function makes it, on the server, where the file is read under its lock.
4. Save to Literature. The Literature search card and the Lit Watch card each gain Save to Literature, which writes the paper to `registries/literature.yml` of the primary hub (else the first) through one new write kind, with `source` `search` or `lit-watch`, `added` today, and every field the paper carries (from a search hit: title, authors, venue, year, doi, url, abstract; from a Lit Watch entry: title, authors as the names of its line, venue, year, url). A paper is not saved twice: the server refuses it when the file holds an entry with the same DOI or, when either has no DOI, the same title compared ignoring case and punctuation; the card reads In Literature, not pressable, once the file holds the paper, by the same rule on the page. The write is logged and undoable like every write (G9), and changes only the file it names (G8).
5. Add on the Literature view asks one value, a DOI or an address. A DOI (as `queryDoi` reads it, a doi.org address included), an arXiv address (`arxivId`) or a PubMed address is looked up through the sources the Literature search asks, the hits merged as the search merges them, and the merged paper is saved with `source: hand` and its page opened in its editor. Any other address, or a lookup that finds nothing, saves an entry with that `url`, `source: hand`, and a key from the address's last path word, and opens its page; an empty answer opens an empty entry's page with the key asked, as every collection's Add does. A refusal (a duplicate) is said in the Add box.
6. Filters. A schema field may carry `filter: true`: `SchemaField` gains `filter?: boolean`, read by `fieldOf` as the other flags are, and the generic collection view draws, in the bar beside the search, one filter per such field of every collection: a `select` or `tags` field as chips of its values with their counts, a `text` field whose values are all whole numbers as a range (from and to), any other `text` field as chips of its values. The filters are the tab's instance state, saved with it as the search and the facets are. The reader of a schema in the apps API and the schema checker accept the key.
7. A venue linked to its record. A literature entry whose `venue` equals the `name` of a record of the venues registry, ignoring case, draws the venue as a link that opens that venue's page (`pageView('venues', id)`), on the card and the page.
8. Copy BibTeX. A literature entry's card and page have Copy BibTeX, which puts one BibTeX entry on the clipboard: fetched by its DOI as the search's Copy BibTeX fetches it, else formatted by citation-js from the entry's fields; the entry key is always the literature entry's own key. The Literature view's toolbar has Copy BibTeX of the entries shown, the entries the search and filters leave, in the view's order, one after another. Each copy says how many entries it copied, and which it could not.
9. The words. Every string a reader sees is a line of the catalog under `config/text/`; the server's refusals of the new write kind are lines of `config/text/server.yml`. HELP.md names the Literature view, Save to Literature, Add by DOI or address, the filters and Copy BibTeX; DESIGN.md's view and catalogue section names the Literature view and the `filter:` key; `docs/apps.md` names `filter` among a schema field's keys where it lists them.
10. Tests, each under its guarded entry, each with its failing first run: under G8, the new write kind writes the entry with the key rule of item 3 and refuses a duplicate by DOI and by title (a row of the writes tests); under G9, its undo removes the entry (a row of `tests/server/core/changes.test.ts`). The orchestrator adds the rows to `agents/guarded.md` at landing.

## Cases

1. Save to Literature on a search hit with DOI `10.1016/j.neucom.2024.127654`, authors `["Axel Faes", "Marc M. Van Hulle"]`, year 2024, title "Block-term tensor regression for ECoG": the file gains one entry with key `faes2024block`, `source: search`, today's `added`, and the card reads In Literature.
2. Save the same hit again, or a hit with the same DOI in capitals with its doi.org address: refused, the file unchanged, the sentence said.
3. Save a hit with no DOI whose title differs from a saved one only in case and punctuation ("Block-Term Tensor Regression, for ECoG."): refused.
4. Save a second paper by Faes in 2024 whose title starts with "Block": key `faes2024blockb`; a third: `faes2024blockc`.
5. A first author "M<u with diaeresis>ller" and the title "<U with diaeresis>ber tensors" (year 2025): key `muller2025uber`.
6. A paper with no author and no year, title "Tensor methods": key `anonndtensor`.
7. Save to Literature on a Lit Watch card: the entry has `source: lit-watch` and the radar's title, authors, venue, year and url; the radar file unchanged.
8. Add with `https://doi.org/10.1016/j.neucom.2024.127654` (with the sources answering): the entry holds the merged paper's fields, `source: hand`, and its page opens in its editor; Add with the bare DOI the same.
9. Add with an address no source knows, `https://example.org/papers/tensor-notes`: an entry with that `url`, `source: hand`, key `tensor-notes`, its page open.
10. Add with an empty answer: as every collection's Add, the key asked and the empty entry's page open.
11. A literature entry with `venue: Neurocomputing` (a record of `registries/venues.yml` by name): the card's venue opens the Neurocomputing venue page; `venue: Some Workshop` (no record): plain text.
12. Copy BibTeX on an entry with a DOI: the clipboard holds one entry whose key is the entry's key; on an entry with no DOI: an entry citation-js formats from its fields, key the entry's.
13. Copy BibTeX of the entries shown with a keyword filter leaving two of five entries: two entries on the clipboard, in the view's order.
14. A `filter: true` select field on another collection (add one to a scratch collection's schema): its chips appear in that collection's bar and hide the cards whose value is unpressed.
15. The year range 2020 to 2023 over entries of 2019, 2021 and 2024: only 2021's card is shown.
16. A saved Literature search tab under the old id `literature`: it opens the Literature view (no code reads the old id); the rail's Literature search opens `literature-search`.
17. The schema checker over `registries/literature.yml`: no finding; a `filter: yes` (not a boolean) reads as absent, as the other flags do.
18. Undo of a Save from History: the entry is gone and the file is byte-identical to before the save.
19. A search hit's abstract holding markup (`<i>in vivo</i>`): saved as plain text (`plainText`), drawn as text, never as markup (G5).

The builder's first task, before any change, is the first run of every case above on the unchanged tree, with each case's result noted.

- A case of a code step becomes a test of the step only when the rules file's test rule calls for a test of it: here the rows of item 10, under G8 and G9.
- A case kept as a test is run on the unchanged tree first.
- No prototype script stands in for such a test.
- Every other case is checked by a run the report quotes, and no test is kept for it.

When the first run finds a case the brief's own rules get wrong, the builder stops there, before changing any code, and hands back the first run and that case, with the rule and the result it gives. The orchestrator rules on the case and resumes the builder with the ruling, and the final report carries it.

## Paths this step writes

- `registries/literature.yml`
- `tools/oculus/config/sources.yml` lines 54-68
- `.oculus/config/sources.yml` lines 59-73
- `tools/oculus/src/lib/views/feeds/literature/` (the view id, Save to Literature on the card)
- `tools/oculus/src/lib/views/feeds/radar/RadarCard.svelte` (Save to Literature)
- `tools/oculus/src/lib/views/boards/collection/Collection.svelte` (the placement, the filters, Copy BibTeX of the entries shown)
- `tools/oculus/src/lib/views/shared/forms/entry/` (`entry-add.ts` for the Literature Add, `EntryCard.svelte` or a card action file for Copy BibTeX and the venue link)
- `tools/oculus/src/lib/views/boards/entry/Entry.svelte` (Copy BibTeX and the venue link on the page)
- `tools/oculus/src/lib/state/boards/collection.ts` (the filters)
- `tools/oculus/src/lib/state/feeds/literature/` (the in-Literature check, the BibTeX of an entry)
- `tools/oculus/src/lib/data/model/model-collections.ts` (`filter`)
- `tools/oculus/src/lib/data/snapshot/schema/field.ts`, `check.ts`, `record.ts`
- `tools/oculus/src/lib/data/prose/literature.ts` (the title comparison ignoring punctuation, the citation key)
- `tools/oculus/src/lib/server/edit/` (the new write kind and its refusals), `tools/oculus/src/routes/api/` where the write kinds are routed
- `tools/oculus/src/lib/state/client/` (the write's client call)
- `tools/oculus/config/text/views/feeds/literature.yml`, `tools/oculus/config/text/views/boards/collection.yml` or the file the collection view's words live in, `tools/oculus/config/text/server.yml`
- the readers of the view id `literature` that grep finds under `tools/oculus/src/`, `tools/oculus/config/` and `tools/oculus/tests/`
- `tools/oculus/HELP.md` (the Literature search section and a Literature section)
- `tools/oculus/DESIGN.md` (the view and catalogue section, the schema keys)
- `tools/oculus/docs/apps.md` (a schema field's keys)
- the tests of item 10 under `tools/oculus/tests/`, and a test whose expected view id or schema keys the change alters
- the diagrams `npm run diagrams` regenerates
- `tools/oculus/.scratch/migration/agents/reviews/D73-report.md`

The step writes these paths and nothing else.

## Decisions taken in this brief (each reversible, none silent)

1. The Literature view sits in the group `incoming` at order 6, after the Literature search, so no chord of an earlier view moves.
2. A filter on a text field is a range when every value present is a whole number, which is how a year is told apart without a new type word; the year stays `type: text` as Lit Watch's is.
3. The title comparison for a duplicate drops every character that is not a letter or a digit, after lower casing, so "Block-Term Tensor Regression, for ECoG." equals "block term tensor regression for ecog".
4. The key's title word is the first word of the title as written, with no stop-word list, as open item 76 says; a title starting "A" gives the word `a`.
5. Save to Literature writes without asking anything, as Copy BibTeX acts at once, and the entry's page is where the projects and the note are filled.
6. A BibTeX entry copied of a saved paper always carries the entry's own key, so a manuscript that cites the key finds it.

## Libraries checked

citation-js (`@citation-js/core` with `@citation-js/plugin-bibtex` and `plugin-doi`) is already a dependency (`package.json`) and formats BibTeX here as the search's Copy BibTeX does. No new dependency: the step names none, and the builder adds none.

The builder adds no dependency this brief does not name. A library the builder finds that would cover its work is reported, not installed.

## Read, with sections or line ranges

1. `src/lib/views/boards/collection/Collection.svelte` whole: the registration, the bar, the cards.
2. `src/lib/state/boards/collection.ts` whole: `applyCollectionFilters`, `statusFacets`, `parseCollectionState`.
3. `src/lib/views/feeds/literature/` whole and `src/lib/state/feeds/literature/` whole: the card, the Lit Watch hand-off, `entryFor`.
4. `src/lib/server/edit/feeds.ts` from `addRadarEntry` (line 451): how a feed write refuses a duplicate under the file's lock.
5. `src/lib/views/shared/forms/entry/entry-add.ts` and `EntryCard.svelte`: D72's Add and the card's `extra` actions.
6. `src/routes/views.ts:55-89`: why a collection key may not be a built-in view's id.

## Conventions

The rules file's character set (ASCII) in every file the step writes; `registries/literature.yml` in the hub's YAML style (one `{ field: ..., type: ..., help: "..." }` line per schema field, as `feeds/literature-radar.yml:12-27`). No English literal in a refusal or a label: each is a catalog line.

## Verify before you report

Run from `tools/oculus` in the worktree, each must hold, each output piped through the filter the rules file names:

1. The checks of the verify list that cover the files the step changes: `npm run lint` (no error), `npm run format:check` ("All matched files use Prettier code style!"), `npm run check` (0 errors), `npm run test:quick` once after the last change (every command passes), `npx vitest run tests/checks` (every test passes), and the ASCII gate over the changed files (the rules file's command, exit 0). The plan's whole verify list runs once, at landing on main.
2. `sh utils/folder-check.sh` and `sh utils/size-check.sh` pass, and `sh utils/unused-exports.sh` prints no line the base's run does not print.
3. `npm run diagrams` leaves the diagrams matching the tree.
4. The rows of item 10 fail on the unchanged tree and pass after the change, both runs quoted.
5. Each case's run is quoted on the unchanged tree and after the change.
6. Each new or changed list item and sentence is read against the standards pages' rules on list items and sentence length, and each place it departs from them is named in the report with why it needs its form.

## Report

Write it to `tools/oculus/.scratch/migration/agents/reviews/D73-report.md`, in the rules file's character set, a character outside it in quoted output written by its name in angle brackets, such as `<tab>` or `<em dash>`, with these parts in this order.

- The first line: anything NOT done, or "Everything in the brief is done".
- The open items of the state file, verbatim, which hold only what the user must rule on.
- The cases' first run: every case of "Cases" by its number, each with the command or the reading that checked it and its output as printed.
- The DONE / NOT DONE table with the checks above and their output as printed, the ASCII gate's line and its exit status included.
- The files with line counts.
- Every judgment call the brief left open.
- Every host- or user-visible change with its before and after.
- Anything in the brief that was wrong or impossible, with the evidence.
