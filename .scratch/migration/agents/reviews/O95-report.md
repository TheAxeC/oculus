# O95 report

Everything in the brief is done.

The step's paths were widened by one file: `src/lib/data/helpers/hub-names.ts`, where `flaggedEntries` is deleted, since `waiting()` was its one caller and Verify 8 allows no new unused export (see "Judgment calls").

## The ruling this build follows (`.scratch/migration/agents/briefs/O95-cases.md`)

1. Option (a): the tab state is `{ id, row, name, label, filter }`, `label` holding the title. Built: `AwaitingTab` in `src/lib/state/boards/focus/filter.ts`.
2. G124's new rows and the describe 'New project on a board', moved whole from `board-rules.test.ts` (`:606-791` at the base), are in the new `tests/state/boards/board/board-new-project.test.ts`. The moved rows were run after the move and pass (DONE table, Verify 3).
3. Case 6 uses a terminal stage (`published`) for the blocked project on no awaiting lane.
4. "Never read the same" applies across hubs: a name of a hub other than the primary carries its hub's name while the workspace has more than one hub; two entries of one title in one hub are two buttons with the same words.
5. The tally's count is unchanged by this step (open item 513, booked on main).

## The open items of the state file

The worktree's `.scratch/migration/orchestrator-state.md`, the "Open items" section, lines 171-225, verbatim (compared with `diff` against `sed -n 171,225p` of the state file: no difference, exit 0):

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

- 510 (2026-10-27, O98's /spec, the brief check `agents/reviews/O98-brief-check.md`; O98's third stop before its build, after 507 and 508, so the stop "A step that does not converge": O98 is booked under "Blocked, and by what" and is prepared again once a ruling on this item rewrites its line). Six findings of the brief check are choices for Axel: three correct or extend text he ruled, three are choices no ruling names. Every other finding is closed in the brief when /spec runs again.
  - (1) G135's token clause. What the tree shows: the dictated text "a token is kept only in its host's file in `~/.oculus/connect/` at mode 0600 and given only in git's credential answer for that host's credential address" is false for the Google and Microsoft refresh tokens, which are kept in per-account files and sent to the provider's token address at every refresh (`src/lib/server/accounts/connect/store.ts:1-3`, `oauth.ts:269-279`, `:331`), and for the git token, which item 17 sends to the row's `user` address to read the login. (a) The clause reads: "a sign-in token is kept only in its own file in `~/.oculus/connect/` at mode 0600, and is sent only to the addresses of its own `sign_in` row (the token address to refresh it, the user address to read the login) and, for a git host, in git's credential answer for that row's credential address; never in a log, a channel, a command line, an environment variable or a report". Pros: true for every token oculus holds, and it guards the mail and calendar refresh too. Cons: the Google and Microsoft token code comes under G135, so its test file is written in this step. (b) G135 guards a git host's token alone: "a git host's token is kept only in its row's file in `~/.oculus/connect/` at mode 0600, and is sent only to the row's user address and in git's credential answer for the row's credential address; never in ...". Pros: one test file fewer. Cons: the mail and calendar refresh tokens stay unguarded. Recommended: (a). The lazy option: (b).
  - (2) G34's log clause. What the tree shows: ruling 508 gave G34 "cancel cancels only that job id, on the cluster the job's row came from"; item 10 sends log to the job's cluster too, but G34's log clause names no cluster, a job id can stand on two clusters, and the remembered log paths are keyed by job id alone (`LogPaths`, `src/lib/server/machine/hpc/actions.ts:10`). (a) The clause reads "log reads only that job's log, on the cluster the job's row came from", the remembered paths keyed by cluster and job id, with a test row of job 123 on two clusters. Pros: a log press on cluster b's job 123 never reads cluster a's log. Cons: one more test row. (b) G34 as ruled, the paths keyed as today. Pros: no change to the log code. Cons: with job 123 on both clusters, a log press can read the other cluster's log. Recommended: (a). The lazy option: (b).
  - (3) Who writes a `clusters:` row. What the tree shows: ruling 507 put the rows in `local.yml` and named no writer; G8 says the Settings writers "never write a `local.yml` but the one key `self`" (`agents/guarded.md:70`), the one `local.yml` write being `src/lib/server/edit/writes/config/config-key.ts:240-338`; Settings' This machine section lists the keys and edits only `self`. (a) G8 gains "and the rows of `clusters:` of the primary hub's, each row written as that row alone, every other byte kept, the result read back by the machine's reader before it is written"; Account setup's Save and Settings both write a row through that one writer, with test rows under G8. Pros: one writer; the rows are edited where every other key is. Cons: Settings' `local.yml` write grows from one scalar to a list of rows. (b) Only Account setup's Save writes a row, through a write of its own, under a G8 sentence naming that write; Settings lists the rows read-only and names Account setup. Pros: Settings' `local.yml` write stays one scalar. Cons: two views show the rows and only one edits them. Recommended: (a). Neither is the lazy option; the lazy option, not offered, is no writer, the rows typed into `local.yml` by hand.
  - (4) The first password login to a host ssh has never seen. What the tree shows: ssh asks "Are you sure you want to continue connecting (yes/no/[fingerprint])?" through `SSH_ASKPASS`, so the one-shot helper of item 16 would answer that question with the password. (a) Before the password login, the section reads the host's key with `ssh-keyscan` (the host as one argument), shows its SHA256 fingerprint and asks the reader to confirm it; on confirm the key is added to `~/.ssh/known_hosts` and the login runs with `StrictHostKeyChecking=yes`, so the helper only ever answers the password prompt. Pros: the reader sees the fingerprint before trusting the host. Cons: one more confirm in the steps. (b) The login runs with `StrictHostKeyChecking=accept-new`: ssh trusts a host it has never seen and refuses one whose key changed; the fingerprint is shown after. Pros: one step fewer. Cons: the first connection trusts whatever answers at that address, so a host posing as the cluster receives the password. Recommended: (a). The lazy option: (b).
  - (5) Which hub's rows are read. What the tree shows: `slurm.resource` is read from the primary hub alone (`docs/data-map.md:262`); `local.yml`'s account rows are joined over every hub (`src/lib/data/sources/config/machine.ts:54-55`). (a) `sign_in`, `connections.failures`, `clusters.key_type`, `clusters.key_file` and the `clusters:` rows are all read from the primary hub alone, as `slurm.resource` is; the same key in another hub is a finding naming that hub. Pros: a token's addresses and a cluster's user and key come from the one hub whose clusters are polled; a second hub can never send a token elsewhere. Cons: a row kept in a second hub's files does nothing. (b) The four hub keys from the primary alone, and the `clusters:` rows joined over every hub's `local.yml`, the primary's first by resource, as the account rows are. Pros: the rows behave as the account rows do. Cons: a row in another hub's `local.yml` decides the user and the key for the primary hub's cluster. Recommended: (a). Neither is the lazy option.
  - (6) What the landing writes into the research hub's `.oculus/config.yml`. What the tree shows: oculus ships none of the rows (rulings 508 2 (a), 509), so a hub with none set refuses Connect and stops the mail and calendar refresh, and tells no failure apart. (a) The landing writes, beside `slurm.resource: [utwente]`: the `sign_in` rows `google` and `microsoft` with the addresses and scopes now in `oauth.ts:122-142` and the calendar, mail and `mail_link` addresses now in `calendar/google.ts:20`, `calendar/microsoft.ts:23`, `mail/google.ts:28,69` and `mail/microsoft.ts:38`; a `github` row with GitHub's device-code, token, user and register addresses and the credential address `https://github.com`; `connections.failures` rows for ssh's "Permission denied (publickey)", "Could not resolve hostname", "No route to host" and "Host key verification failed" and git's "Authentication failed"; `clusters.key_type: ed25519` and `clusters.key_file: ~/.ssh/id_{type}_{resource}`; `recover.node_download` with the address now in `recover/cluster.ts:308`. The values are quoted in the landing report and committed in the hub. Pros: nothing in use stops at the landing. Cons: the values are written into Axel's hub by the orchestrator. (b) The landing writes only `slurm.resource: [utwente]`, and Axel fills the rest in Settings. Pros: every value is Axel's own. Cons: Connect, mail and calendar stop until he fills them. Recommended: (a). The lazy option: (b).
  - Kind: corrections and extensions of ruled text (1, 2, 3) and user-visible choices no ruling names (4, 5, 6), raised in one stop as the /spec skill's brief check 4 says.
- 511 (2026-10-27, O97's /spec, the checks its step line asks for before the brief): three choices O97 needs before its brief. What the checks show: the UT Journal Browser (`https://library.wur.nl/WebQuery/utbrowser`) shows its records without a login ("Records 1 - 20 / 49030"; the page carries a log-in dialog, "Please log in to use this service", that does not hide them); it answers HTML alone, its export being an in-page dialog of at most 500 titles with no stated format; and `https://library.wur.nl/robots.txt` says, under `User-agent: *`, "Disallow: /WebQuery" and "Disallow: /WebQuery*& # no searches". The readers O97 replaces answer JSON (OpenAlex, Crossref, Semantic Scholar, Europe PMC, Web of Science, Scopus, Zenodo, Figshare, DANDI, Hugging Face, TCIA, Kaggle, Synapse), XML through `fast-xml-parser` (PubMed's two-request chain, arXiv's Atom) and one HTML listing read by a hand-written pattern (GEO, `src/lib/server/machine/runs/recover/sources/geo.ts:34`); oculus has no HTML parser at run time (`jsdom` 30.1.1 is a dev dependency, `package.json:52`).
  - (1) The library's robots.txt against the browser. (a) oculus asks the configured browser only on a reader's press, one request per press: a search of the view (b) and a "Read from the browser" press on a venue's card, which writes the ISSN's fee line and open-access status into that venue's entry in `venues.yml`, the card drawing the stored values; no request runs in the background, at start or on a refresh, and every request carries a User-Agent naming oculus. Pros: oculus then behaves as the person using the browser does, which is what robots.txt does not address (it is written for crawlers, RFC 9309); the fee line and the search work for the UT as soon as O97 lands. Cons: the requests still reach a path whose robots.txt says "no searches"; whether the library's terms of use allow it is not verified. (b) O97 builds the same configurable reader and both views, and the hub's `venues.browser` row for the UT is written only once the library agrees in writing; asking the library is a message on your behalf, sent by you or by me on your yes. Pros: no request goes against the library's stated wish. Cons: the UT fee line and the journal search stay empty until the library answers, and may never come. Recommended: (a), as my judgment that a press-driven, person-paced reader is not the crawling robots.txt addresses. Neither is the lazy option; the lazy option, not offered, is dropping the browser from O97.
  - (2) How an HTML answer is read, under `libraries: check`. A row of format `html` names, per field, a CSS selector and the attribute or text it reads. (a) `cheerio` 1.2.0 (MIT, the cheeriojs project, last published 2026-07-17, eleven dependencies), built on `parse5`, the spec-conformant HTML parser, so a library's malformed markup parses as a browser parses it; it also replaces GEO's hand-written pattern. (b) `node-html-parser` 9.0.5 (MIT, last published 2026-10-19), a lenient parser with no spec conformance and fewer dependencies. Pros of (a): the same tree a browser builds, the selector a reader copies from the browser's inspector works as written. Cons of (a): a larger dependency tree. Pros of (b): small and fast. Cons of (b): on markup it repairs differently from a browser, a selector copied from the inspector can match nothing. Recommended: (a). The lazy option, not offered: patterns written by hand per field.
  - (3) The configuration's shape. Every row lives in the hub's `.oculus/config.yml` beside the feature that reads it, as ruling 509 says: `venues.browser` (one row; none set shows no browser), `literature.sources` (a list), `recover.sources` (a list) and `links` (a list of `{ key, address }`). A row of any of the three reader lists has the same keys: `key`, `name`, `format` (`json`, `xml`, `html`), `address` with `{name}` holes, `query` (what each search term maps to), `paging` (offset or page parameter, size parameter, the sizes offered), `filters` and `sorts` (each a label and the parameters it sends), `auth` (the header or parameter that carries a key, and the `downloads` row it reads), `records` (where the list of hits is) and `fields` (each field's path or selector, with a named generic operation where one is needed: `inverted_index`, `strip`, `first_byte_size`, `checksum_file`, `then` for a two-request chain). Worked rows, the UT selectors read off the page at the build:
    ```yaml
    venues:
      browser:
        key: utbrowser
        name: UT Journal Browser
        format: html
        address: https://library.wur.nl/WebQuery/utbrowser
        query: { words: title }
        paging: { offset: wq_ofs, size: wq_max, sizes: [20, 50, 100] }
        filters:
          - { label: APC, params: { wq_flt: journal/apc, wq_val: "{value}" } }
          - { label: Open access, params: { wq_flt: journal/oa-status, wq_val: "{value}" } }
        sorts:
          - { label: CiteScore, params: { wq_srt_desc: citescore } }
          - { label: Title, params: { wq_srt_asc: journal/title } }
        records: "<hit row selector>"
        fields: { title: "<selector>", issn: "<selector>", publisher: "<selector>", fee: "<selector>", open_access: { select: "<selector>", attr: alt } }
    literature:
      sources:
        - key: openalex
          name: OpenAlex
          format: json
          address: https://api.openalex.org/works
          query: { words: { filter: "title_and_abstract.search:{words}" }, doi: { filter: "doi:{doi}" } }
          paging: { page: page, size: per-page }
          auth: { param: api_key }
          records: results
          fields: { title: title, doi: doi, year: publication_year, cited: cited_by_count, abstract: { path: abstract_inverted_index, op: inverted_index } }
    recover:
      sources:
        - key: zenodo
          name: Zenodo
          format: json
          address: "https://zenodo.org/api/records/{record}"
          records: files
          fields: { name: key, size: size, checksum: { path: checksum, op: strip, prefix: "md5:", kind: md5 }, url: links.self }
    links:
      - { key: doi, address: "https://doi.org/{id}" }
    ```
    (a) Field paths as dotted paths with `[]` for a list (`authorships[].author.display_name`) and CSS selectors for HTML, each transform a named generic operation the code holds. Pros: one small path syntax a reader writes by eye; every transform has a name a reader can look up in the help. Cons: a transform not on the list needs a code change. (b) Field paths as JMESPath expressions (the `jmespath` package), CSS selectors for HTML, the named operations kept for what JMESPath cannot express (the inverted index, the first-byte size, the checksum file). Pros: projections and filters written in the row, without a code change. Cons: a second expression language next to CSS selectors, one more dependency, and rows a reader cannot read at a glance. Recommended: (a). Neither is the lazy option.
  - Kind: a check that goes against the step (1), a library choice (2) and a user-visible shape (3), raised in one stop as the step line asks.

## The cases' first run

Cases 1 to 8 were run on the unchanged tree (base 046e0debc) before any change, by a case-run program in the session scratchpad loaded through Vite with the Svelte plugin (the rune modules the Focus page reaches need it), printing the Awaiting box's strip `focusPage` computes for each case's projects on `board-fixture.ts`, and the exports of `state/boards/board` whose name holds "awaiting". The program and its loader are removed. Command `node o95-run.mjs /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O95`, printed:

```
case 1: {"people":[],"venues":[{"label":"BSPC","count":2}],"blocked":0,"grants":[],"applications":[]}
case 2: {"people":[],"venues":[{"label":"","count":1}],"blocked":0,"grants":[],"applications":[]}
case 3: {"people":[{"label":"Maryam","count":3}],"venues":[],"blocked":0,"grants":[],"applications":[]}
case 4: {"people":[{"label":"Bee","count":1}],"venues":[],"blocked":0,"grants":[],"applications":[]}
case 5: {"people":[{"label":"the ethics board","count":1}],"venues":[],"blocked":0,"grants":[],"applications":[]}
case 6: {"people":[],"venues":[{"label":"","count":1}],"blocked":2,"grants":[],"applications":[]}
case 7: {"people":[],"venues":[{"label":"BSPC","count":1}],"blocked":0,"grants":[],"applications":[]}
case 8: {"people":[{"label":"Maryam","count":2}],"venues":[],"blocked":0,"grants":[],"applications":[]}
awaiting board exports: []
```

On the base no tally holds a project id, `blocked` is a number, and no transient board exists: `grep -rn "awaitingTake\|awaitingPreset\|awaitingTab" src` in `.agents/worktrees/O95-base` prints nothing (exit 1). So every row of the new describe "the Awaiting box's board" and the new row "is offered on no Awaiting box's board" fails on the unchanged tree: the file's imports `awaitingPreset`, `awaitingTab` and `awaitingTake` do not exist there, and the values the rows assert (the ids of a tally) are absent from the strip printed above.

1. Two submitted projects at BSPC: the box counts `BSPC` 2, no take exists. Failed as expected. Test row: "the board of the name for 'the venue BSPC' ...", takes `['a', 'b']` (project `b` on the software tier, `d` exploring and waiting on nothing, `c` with no venue); New project: row "is offered on no Awaiting box's board". The tab, its title "Under review: BSPC", no count on tab or rail, absence from the view catalogue and the second press are the look (below).
2. A submitted project with no venue: tallied under `''`, no take. Failed as expected. Test row 'no venue', takes `['c']`. The title "Under review: (venue unset)" is the look.
3. Three projects waiting on one person: `Maryam` 3, no take. Failed as expected. Test row 'the person Maryam', takes `['a', 'b', 'c']`.
4. A project waiting on another: `Bee` 1, no take. Failed as expected. Test row 'the project Bee', takes `['a']`.
5. A value naming neither: `the ethics board` 1, no take. Failed as expected. Test row 'a waited-on value naming neither a person nor a project', takes `['a']`.
6. Blocked: `blocked` 2, a number with no ids. Failed as expected. A blocked project at a non-terminal stage always sits on the Blocked chip lane (`laneOf`, `src/lib/state/boards/focus.ts`, a chip lane matched before a stage lane), so the project on no awaiting lane is at `published`, per ruling 3. Test row 'Blocked, a blocked project at a terminal stage on no awaiting lane', takes `['a', 'b']`.
7. The tier `software` unticked: `BSPC` reads 1, no take. Failed as expected (no ids). Test row 'the venue BSPC, one of its projects of a tier the Focus filter unticks', takes `['a']`, and the row 'case 7: a venue name counts and holds only the projects the Focus filter keeps', which asserts the strip's venues `[{ label: '', count: 1, ids: ['c'] }, { label: 'BSPC', count: 1, ids: ['a'] }]`; on the base the strip has no `ids`, so it fails there.
8. One project naming one person twice: `Maryam` 2, no take. Failed as expected. Test row 'the person Maryam, whom one project names twice', takes `['a']`. The count 2 is unchanged by the step (ruling 5) and no row asserts it, since a test may not assert a known defect.
9. (look) Read on the base: no transient board; the Focus filter's Mine only starts on (`filter.ts` `focusFilter`), as does a board's (`state.ts` `emptyBoardState`). Failed as expected.
10. (look) Read on the base: the box drew each row as one span, `{row.names.join(', ')}`; no press. Failed as expected.
11. (look) Read on the base: no `awaiting_board` view registered; `docs/palette.md` lists only `| Track record | track_record |`. Failed as expected.
12. (look) Read on the base: no board to leave. Failed as expected.
13. (look) Read on the base: Grants and Applications were titles only (`Waiting.grants: string[]`, `Waiting.applications: string[]`), drawn as text. Failed as expected.
14. (look) Read on the base: `openLine` opened `layout.openView(line.entry)`, the collection's view; a conference call's `entry` is `REGISTRY_VIEWS.venues`; a Needs-attention venue line revealed the venue in the Venues view. `grep -n "pageView" src/lib/views/boards/focus/*.svelte src/lib/views/boards/focus/rows.ts` printed nothing (exit 1). Failed as expected.
15. (look) Read on the base: the same `openLine`; an entry's follow-up and subtask lines carry `entry: key`; a funding scheme's subtask line carried no `entry` (`rootMark(scheme)` alone), so a press on it opened nothing. Failed as expected.
16. (look) Read on the base: the tasks section's `pick` called the same `openLine`. Failed as expected.
17. (look) Read on the base: a band card's title called `reveal(item)`, the collection's view with a reveal id. Failed as expected.
18. (look) Read on the base: no row reached `pageView`. Failed as expected.
19. (look) Read on the base: a venue line and a funding line opened their collection's view, the behaviour the case keeps. Held, as the case expects it to keep holding.
20. (run) `npx vitest run tests/checks/diagrams/palette.test.ts --testTimeout 0 --reporter=verbose` on the base: `<check mark> |unit| tests/checks/diagrams/palette.test.ts > the palette page > is what the palette gives now 14958ms`, `Tests  1 passed (1)`; `grep -n "track_record\|awaiting" docs/palette.md` printed only `28:| Track record | track_record |`. The page listed no awaiting board.

The case the brief's rules got wrong, found at the first run: the brief's tab state `{ id, row, name, title, filter }` could not title the tab "Under review: BSPC" (cases 1 and 2), since every reader of a tab's name reads `label` (`instanceLabel`, `src/lib/state/workbench/layout/instance.ts:96-98`; `src/lib/shell/panes/strip/strip-tab.ts:47`; `tabNameOf`). The orchestrator's ruling: option (a), `label` (ruling 1 above).

## DONE / NOT DONE

| Check | State | Output |
| --- | --- | --- |
| Item 1, the box's names are buttons | DONE | `src/lib/views/boards/focus/Focus.svelte` `boardName`, `entryName`, the box markup; look cases 1, 9, 10, 13 |
| Item 2, the transient board | DONE | `AWAITING_VIEW`, `awaitingPreset` (`presets.ts`), `AwaitingTab`, `awaitingTabOf`, `awaitingTake` (`filter.ts`), `BoardRule.ids` (`takes.ts`), `Projects.svelte` registration and branch; Verify 3 rows |
| Item 3, ticker rows open the entry's page | DONE | `rows.ts` `entryPage`, `venuePage`, `linePage`, `openLine`; `CommandCenter.svelte` `pick`, `pickAttention`; `Tasks.svelte` `pick`; `ticker.ts` the scheme subtask line's `entry` |
| Item 4, band cards open the entry's page | DONE | `Band.svelte` `openEntry` |
| Item 5, words and page | DONE | `docs/HELP.md:294`, the comments listed in item 5, `docs/palette.md:29` `| Awaiting | awaiting_board |` |
| Item 6, G124's rows | DONE | `tests/state/boards/board/board-new-project.test.ts`; Doc text below |
| Verify 1 | DONE | `npm run diagrams && npm run docs:palette && npm run test:quick -- <the 21 changed files>`, after the last change, exit 0. `diagrams` printed `docs/diagrams/layers.dot` through `docs/diagrams/writes.svg`; `docs:palette` printed `docs/palette.md`; `test:quick` printed `test:quick: 21 changed file(s), from the given paths`, `test:quick: 158 test file(s)`, `ok      prettier (0.9 s): All matched files use Prettier code style!`, `ok      ASCII gate (1.0 s)`, `ok      svelte-kit sync (3.2 s)`, `ok      eslint (4.2 s)`, `ok      svelte-check (15.5 s): 1793123583079 COMPLETED 551 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok      vitest (167.0 s): Duration  156.40s (transform 111.09s, setup 0ms, import 239.91s, tests 322.65s, environment 5.89s)`, `ok      vitest checks (195.1 s): Duration  183.45s (transform 74.59s, setup 0ms, import 266.87s, tests 397.82s, environment 4ms)`, `ok      vitest slow (262.9 s): Duration  252.39s (transform 19.27s, setup 0ms, import 143.66s, tests 857.88s, environment 12ms)`, `test:quick: 266.1 s; every command passed`, and its not-covered lines: tests that reach no changed file within the import depth other than the checks under `tests/checks/source` and `tests/checks/tree`, the build, the lint of unchanged files. A run of the same command just before it, with the machine at load average 12 to 14 from another step's builder, timed out 11 tests in `file-undo.test.ts`, `clone-after.test.ts`, `workspace-projects.test.ts`, `app-store.test.ts`, `hub-portfolio.test.ts` and `config-value.test.ts` (`Error: Test timed out in 5000ms.` / `20000ms.`), none an assertion; run alone, `npx vitest run` of the first four printed `Tests  39 passed (39)` and `npx vitest run --tagsFilter slow --testTimeout 20000` of the last two `Tests  39 passed (39)`. The landing's run on main may meet the same timeouts under load |
| Verify 2, ASCII gate | DONE | over the 28 paths `git status --short` lists other than the briefs (the source, test, config and docs files, `docs/diagrams/`, `docs/palette.md` and this report): printed nothing; `ascii exit 0` |
| Verify 3 | DONE | `npx vitest run tests/state/boards/board/board-new-project.test.ts tests/state/boards/board/board-rules.test.ts`: `Test Files  2 passed (2)`, `Tests  118 passed (118)`; the moved describe's 22 rows and its 2 new rows "is offered on no Awaiting box's board" each printed passing under `--reporter=verbose` (`New project on a board > is offered on the boards that take the project it writes, 'with self named'` through `New project on a board > reads the stage written and the boards that offer it in the chosen hub's words 198ms`), with the 8 table rows of "the Awaiting box's board" (verbose run) and its case 7 row (`-t "case 7"` run, then the two-file run's 118) |
| eslint over the 17 changed source and test files | DONE | `npx eslint <the files>`: no output, `eslint exit 0` |
| Verify 4, line counts | DONE | every source file at or under 880, every component at or under 520 (Files, below) |
| Verify 5 | DONE | `grep -n "open the Funding view, a conference call opens the Venues view" docs/HELP.md` printed nothing, exit 1 |
| Verify 6, look cases read against the diff | DONE | "Before and after", below; no scratch oculus started, no browser driven |
| Verify 7, prose | DONE | every new sentence is ASCII with no dash or spaced hyphen; departures: none found |
| Verify 8, unused exports | DONE | `sh utils/unused-exports.sh` against `.agents/worktrees/O95-base/unused-exports.txt`: `diff` printed nothing, exit 0 |
| Verify 9, history words | DONE | `git diff -U0 -- src config tests docs/HELP.md` added lines grepped for `before|used to|no longer|still|previously|now|anymore|formerly|was|were|old|new|O9[0-9]|step|item [0-9]|20[0-9][0-9]-|replaced|instead|ruling|reverted`: the hits are the catalog word `awaiting_none` ("was opened", the brief's text), the feature name "New project", the existing HELP paragraph, a variable `now`, and "now" in the present sense ("the Focus filter in force now", "the Awaiting box's name counts now"); no history |
| Type check | DONE | `npm run check`: `COMPLETED 4344 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |

## Terms

The repository has no `docs/glossary.md`.

## Files with line counts (`wc -l`, base then now)

| File | Base | Now |
| --- | --- | --- |
| `src/lib/data/helpers/hub-names.ts` | 831 | 823 |
| `src/lib/data/shapes/boards/takes.ts` | 182 | 192 |
| `src/lib/state/boards/board/index.ts` | 84 | 86 |
| `src/lib/state/boards/board/presets.ts` | 664 | 713 |
| `src/lib/state/boards/board/ticker-lines.ts` | 176 | 176 |
| `src/lib/state/boards/focus.ts` | 690 | 763 |
| `src/lib/state/boards/focus/filter.ts` | 669 | 730 |
| `src/lib/state/boards/focus/focus-lanes.ts` | 309 | 309 |
| `src/lib/state/boards/ticker.ts` | 688 | 692 |
| `src/lib/views/boards/focus/Band.svelte` | 307 | 308 |
| `src/lib/views/boards/focus/CommandCenter.svelte` | 265 | 289 |
| `src/lib/views/boards/focus/Focus.svelte` | 395 | 474 |
| `src/lib/views/boards/focus/Tasks.svelte` | 205 | 210 |
| `src/lib/views/boards/focus/rows.ts` | 428 | 504 |
| `src/lib/views/boards/projects/Projects.svelte` | 471 | 516 |
| `tests/state/boards/board/board-rules.test.ts` | 862 | 664 |
| `tests/state/boards/board/board-new-project.test.ts` | new | 362 |
| `config/text/views/boards/focus.yml` | 164 | 166 |
| `config/text/views/boards/projects.yml` | 107 | 111 |
| `docs/HELP.md` | line 294 only | 587 |
| `docs/palette.md` | regenerated | 203 |
| `docs/diagrams/` (`channels`, `layer-views`, `layers`, `.dot` and `.svg`) | regenerated by `npm run diagrams` | |

`Projects.svelte` is 4 lines under the 520 component limit.

## Judgment calls the brief left open

- Mine only at the press: after `openView(AWAITING_VIEW, awaitingTab(...))`, Focus writes `mine: filter.mine` into that tab's board UI state (`Focus.svelte` `openBoard`), each press, so a second press resets Mine only to the Focus filter's. The alternative, reading `filter.mine` in `Projects.svelte` as the default only, would leave a board the user toggled out of step with the carried filter.
- The hub suffix of an Applications or Grants name uses a new word `focus.wait_in_hub: '{0} ({1})'`, the hub's name in parentheses, as the quick add's records carry a hub's name; the separator between names is a new word `focus.wait_join: ', '`, so the comma stays a catalog word now that names are separate elements.
- The `BoardRule` key is named `ids`.
- A funding scheme's subtask lines now carry `entry: <funding key>` (`ticker.ts`), which item 3 needs for the press; a side effect is that the hub filter's `hubLines` now hides those lines with their hub, as it hides every other line carrying an entry. A scheme in a hub with no funding collection gets `entry` undefined and stays not pressable.
- A name of the box is a `ToolButton plain` inline in the existing `.wait-names` span; `plain` inherits the span's font, colour and `white-space`, so the box reads as before apart from the button's hover and focus ring. A long name now wraps as one element between names, where the plain text could break inside a name (`overflow-wrap: anywhere`).
- `flaggedEntries` in `src/lib/data/helpers/hub-names.ts` is deleted: `waiting()` needs each application's collection, so it reads `flaggedCollections` directly, and `flaggedEntries` had no other caller (`grep -rn flaggedEntries src tests utils docs` finds none). This widens the step's paths by that file.
- `linePage` in `rows.ts` is module-private; `entryPage`, `venuePage` and `pageLookup` are exported for `Band.svelte`, `Focus.svelte` and `CommandCenter.svelte`.
- The case 7 count is checked by its own row in the new file, since the table rows assert the take only.

## Before and after, for the look at landing

All on the Focus board of the research hub, Awaiting box and command center visible.

- Awaiting box, a row with names (case 1, 3, 13): before, each row's names were one run of text joined by commas. After, every name is a plain button with the same words and commas; hover shows the button state. A grant whose hub holds no funding collection stays plain text.
- Press "BSPC (2)" under Under review (cases 1, 9, 10): before, nothing. After, a tab titled "Under review: BSPC" opens with exactly the projects counted, as board cards in sections by `categories:`, with no New project button, no count on the tab or rail; the palette's view catalogue does not list it (Command palette, views). With Focus's Mine only off, the tab opens with Mine only off. Change the Focus filter (untick a tier) and press "BSPC" again: the same tab comes forward with the new count's projects.
- A submitted project with no venue (case 2): the tab reads "Under review: (venue unset)".
- Waiting on "Maryam" and Blocked's count: tabs "Waiting on: Maryam" and "Blocked".
- Open the view "Awaiting" from the palette (case 11): the board draws "This tab was opened for no name of the Awaiting box. Press a name of Focus's Awaiting box to open its projects." and no projects.
- With an Awaiting tab open, move one of its projects to `revision` (case 12): it leaves the tab; when the last leaves, the empty board's message.
- Applications and Grants names (case 13): before, plain titles; after, a press opens the entry's page (the funding scheme's page for a grant); with two hubs, a name of the non-primary hub reads "Title (hub)"; an entry with an empty title reads its id.
- Command center (cases 14, 15, 18, 19): a funding deadline line, a dated talk's line, a conference call line, a follow-up or subtask line of an entry or a scheme, a snoozed entry line: before, the collection's view (Funding, Talks, Venues); after, the entry's page (a person page for the people registry). A Needs-attention venue line: before, the Venues view at the venue; after, the venue's page. A project's follow-up line: the project tab, unchanged. A venue id naming no registry venue, or a scheme in a hub with no funding collection: the collection's view, unchanged.
- Tasks section (case 16): a tasks-file entry's line opens its entry page, before the tasks collection's view.
- Band (case 17): a card's title in Funding, Job applications or Teaching & supervision opens the entry's page, before the collection's view scrolled to the entry.
- `docs/palette.md` (case 20): a new row `| Awaiting | awaiting_board |` after the track record's.

## What in the brief was wrong or impossible

- The tab state key `title` (item 2, decision 6) could not title the tab; ruled (a), `label` (above).
- The brief cites rulings 494 to 497 as `plan.md` lines 2926-2929; in the worktree they are lines 2971-2974 (`grep -n "^- Open item 49[4-7]" .scratch/migration/plan.md`).
- The brief cites open item 513; the worktree's state file holds no 513 (`grep -n "513" .scratch/migration/orchestrator-state.md` finds only a line of item 309); the ruling says it is booked on main.
- Item 6 put the rows in `board-rules.test.ts`, which is 862 lines; ruled into the new file.
- The paths list lacked `src/lib/data/helpers/hub-names.ts`, whose `flaggedEntries` the build leaves unused.
- `src/routes/views.ts` and `tests/state/boards/board/board-fixture.ts` are on the paths and needed no change: `registerBoards` keeps a module's registration list as it is.

## Doc text

G124 in `.scratch/migration/agents/guarded.md`, its current lines as `grep -n` prints them (lines 183-185):

```
183:- G124. A project is on every board whose keys it meets and in the category of the first row of `categories:` that holds it; its role is the first row of `roles:` whose field holds `self`, and Mine only keeps what names `self` or names no one; a project no board takes, a manifest naming no lead and a terminal project on a chip lane are findings. A board offers New project only when its rule takes the project the write makes, which names the user in the field of the first of the board's roles that has one, or of the first row of `roles:` that has one on a board naming no `role:`.
184:  Code: `src/lib/state/boards/board/` (`presets.ts`, `items.ts`, `new-project.ts`), `src/lib/data/shapes/boards/` (`takes.ts`, `roles.ts`, `categories.ts`, `words.ts`), `boardsFindings` in `src/lib/data/sources/config/sections/boards.ts` for the board keys.
185:  Test: `tests/state/boards/board/board-rules.test.ts`, one table per unit, every row of each describe: 'the boards a project is on', 'the category of a project', "the user's role on a project", "a board's items, the Mine only filter and the Role facet", 'the card sections', 'the rail count of a board', 'the Archival band, the real projects and the Orphans card', 'the Focus lanes', "the audit's placement findings", "a board's keys", 'a saved slice filter', 'New project on a board', 'the roles of a collection'; and the row "reads the stage written and the boards that offer it in the chosen hub's words"; `tests/state/boards/board/board-views.test.ts`, every row of describe 'the board views'.
```

Their replacements:

```
- G124. A project is on every board whose keys it meets and in the category of the first row of `categories:` that holds it; its role is the first row of `roles:` whose field holds `self`, and Mine only keeps what names `self` or names no one; a project no board takes, a manifest naming no lead and a terminal project on a chip lane are findings. A board offers New project only when its rule takes the project the write makes, which names the user in the field of the first of the board's roles that has one, or of the first row of `roles:` that has one on a board naming no `role:`. The Awaiting box's board of a name takes exactly the projects that name counts on the Focus page under the Focus filter its tab carries, each once, and offers no New project.
  Code: `src/lib/state/boards/board/` (`presets.ts` with `awaitingPreset`, `items.ts`, `new-project.ts`), `src/lib/data/shapes/boards/` (`takes.ts`, `roles.ts`, `categories.ts`, `words.ts`), `boardsFindings` in `src/lib/data/sources/config/sections/boards.ts` for the board keys, `waiting` and `awaitedIds` in `src/lib/state/boards/focus.ts`, and `awaitingTab`, `awaitingTabOf` and `awaitingTake` in `src/lib/state/boards/focus/filter.ts`.
  Test: `tests/state/boards/board/board-rules.test.ts`, one table per unit, every row of each describe: 'the boards a project is on', 'the category of a project', "the user's role on a project", "a board's items, the Mine only filter and the Role facet", 'the card sections', 'the rail count of a board', 'the Archival band, the real projects and the Orphans card', 'the Focus lanes', "the audit's placement findings", "a board's keys", 'a saved slice filter', 'the roles of a collection'; `tests/state/boards/board/board-new-project.test.ts`, every row of the describes 'New project on a board' (the row "reads the stage written and the boards that offer it in the chosen hub's words" included) and "the Awaiting box's board"; `tests/state/boards/board/board-views.test.ts`, every row of describe 'the board views'.
```

Nothing of mine is running: the background `test:quick` run has ended and `ps -ax -o pid,command | grep migration-O95` shows no process.
