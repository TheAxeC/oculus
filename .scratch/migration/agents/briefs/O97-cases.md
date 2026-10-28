# O97 cases ruling (round 0)

Axel ruled open item 529 (a) on 2026-10-28. It changes the brief's "Cases" and item 10 as follows; everything else in the brief stands.

1. The cases the brief marks "A test" with no entry are now tests of three new guarded entries, each written as a table with one row per input that gives a different outcome:
   - G136, the configured reader: it sends exactly the requests a row describes (address, parameters, headers, body, paging, auth, pacing and the 429 state) and reads exactly the records and fields the row names, every value encoded in its part. Code `src/lib/server/core/reader/`; Test `tests/server/core/reader/reader.test.ts`, one row per literature source against its recorded answer, plus the request, paging, encoding, link and 429 rows. Cases 1 to 3, 5 to 7, 12 to 14 and 24 to 27.
   - G137, the journal browser: it asks only on a press, and writes a hit, or a venue's `fee` and `open_access`, through the write chain. Code the browser's files under `src/lib/views/sources/venues/` and `src/lib/state/sources/registries/`; Test `tests/state/sources/registries/browser.test.ts`. Cases 15 to 17, 18's "Read from the browser", 28 and 32.
   - G138, a Settings family marked `sparse: true`: its card draws the fields its row sets with an Add field menu, and a pairs value may be a text or a record. Code `src/lib/state/system/config/editors/fields.ts`; Test `tests/state/system/config/sparse-card.test.ts`. Cases 19 and 31.
2. Case 11 (a kind no row of its hub names) becomes a row of G111's table in `tests/server/machine/runs/recover/sources.test.ts`.
3. The paths of the brief gain `tests/server/core/reader/reader.test.ts`, `tests/state/sources/registries/browser.test.ts` and `tests/state/system/config/sparse-card.test.ts`. Check each test folder's item count with `utils/folder-check.sh`; a folder at ten takes a sub-folder by concern, named in the report.
4. Each new test is run on the unchanged tree first, where the behaviour it tests does not exist yet, and after the change; both runs quoted.
5. Your report's "Doc text" gives, for `agents/guarded.md`:
   - the three new entries G136, G137 and G138, each with its rule sentence, its Code line and its Test line (file and the titles of its tests), in the form of the entries around them;
   - G111's rule sentence with "a `recover.sources` row" in place of the services it names, and G114's rule sentence with "the address the row's `access` names" in place of the three login requests (PhysioNet's `SHA256SUMS.txt`, Kaggle's dataset list, Synapse's user profile), each rule otherwise as it stands;
   - the Code and Test lines item 10 already names.
   The orchestrator writes them into `guarded.md` at landing; you do not edit the ledger.

## The first run's five cases, ruled by the orchestrator

The builder's first run (its hand-back of 2026-10-28) found five cases the brief gets wrong. Each ruling below replaces the brief's text it names.

(a) Case 22, verify 4's second grep. Its exclusions widen to the lines that read an identifier or the hub's venue fields and send no request: the venue fields of `src/lib/data/model/model-entities.ts` (`wos`, `scopus`, `scopusMark`), the hit field `arxiv` of `src/lib/data/model/model-search.ts`, and the lines of `src/lib/state/feeds/literature/merge.ts`, `answers.ts`, `bibtex.ts` and `lookup.ts` that read `arxiv` or `pubmed` ids or parse the addresses a reader types into Add. A line that builds an address to open or ask is not excluded: it reads the `links` rows (item 6). The report quotes the grep after the build with every remaining line, each judged "reads an identifier" or "the hub's venue field"; no field, vocabulary or stored value is renamed.

(b) Case 9, GEO. The GEO row's file selector is `pre a:not([href^="/"]):not([href*="?"])`, which gives the pattern's two files on the recorded listing. A row gets `expect`, a path or selector the answer must hold; an answer without it is refused with a line naming the row (GEO's `title` holding `Index of`, as `geo.ts:44` refuses today). Open item 531, closed in automode (`choices.md` Z1057).

(c) Case 2 and decision 4. Case 2 compares every header except `user-agent`; case 16 checks the User-Agent `oculus/<version>` on every reader request.

(d) Case 6, Synapse. "Not followed" means no request for the folder at depth 9 and the whole listing refused with `{ refused: 'answer', source: 'synapse' }`, as `tokened.ts:135` does today (G111).

(e) Case 17, open access. The UT row reads `open_access: { select: "li.open_access", attr: title }`; case 17 expects "Full Open Access. All articles in this journal are Open Access" for the recorded hits.

Also ruled:
- The UT browser's `query.issn` asks with `wq_fld=q` and the ISSN as `q`, as your recorded request did. The ISSN cell `ISSN: 1053-8119 (1095-9572)` is read by `match` with `all: true`, which gives every match as a list (Z1057).
- Semantic Scholar's answer written by hand from its zod shape, after its one curl answered 429, stands; say so in the report.
- Name in the report the command that turned `europepmc.json` and `openalex.json` to ASCII and the two HTML pages' entities. A file in the diff is written with Write, so if a program wrote them, write each again with Write from its checked text and quote the check that the parsed value is unchanged.

Go on with the build: write the G136 to G138 tests and run them on the unchanged tree, then items 1 to 11 under the brief, the 529 (a) ruling and these rulings.
