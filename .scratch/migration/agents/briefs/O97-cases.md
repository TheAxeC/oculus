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
