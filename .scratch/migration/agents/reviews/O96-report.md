Everything in the brief is done. One verify line is not green: check 1's `vitest slow` ended red on a 20 s timeout in `tests/data/hubs/hub-portfolio.test.ts` (C1), a file the step does not change; the same file run alone with a 120 s timeout passes 16 of 16 (below). One file outside the paths list was changed: `src/lib/data/shapes/vocab-keys.ts`, one `export` dropped (under "Anything in the brief that was wrong").

# O96 report: the project strip grouped by `categories:`, and a Projects section in a collection's More

## Open items of the state file, verbatim

The lines below are `sed -n 175,237p .scratch/migration/orchestrator-state.md`, as printed.

## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

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
- 513 (2026-10-27, O95's brief check, implied input 5): the Awaiting box counts a project once per `waiting-on:` value, so a project whose `waiting-on:` names one value twice, or names two values that `waitingLabel` draws as the same words (`src/lib/state/boards/waiting.ts:17-29`, `src/lib/state/boards/focus.ts:596-601`), reads "(2)" under one name while the name's board, which O95 builds to hold each project once, draws one card. Changing the count is beyond O95's line, so O95's brief leaves it as it is.
  - (a) The count becomes the number of distinct projects under the name, folded into O95 and sent with its repair round 1, with a G124 row of one project naming one person twice. Pros: the name's count and its board always agree. Cons: O95's round carries a part its line does not name.
  - (b) The count stays a count of values. Pros: no change. Cons: in that case the name reads "(2)" and its board draws one project.
  - Recommended: (a), as my judgment that a count of projects is what the box says it counts. The lazy option: (b).
  - Status: Axel's to rule; nothing picked automatically.


## The cases

The case-run program is two scratch test files run by a scratch config outside the worktree, nothing of either in the diff. The config imports the worktree's `vite.config.ts`, drops its `projects`, and points `dir` and `include` at the scratch folder; `vitest list` under it listed only the scratch file. The command, from the worktree root:

```
npx vitest run --config <scratchpad>/caserun/case.config.mts --root $PWD first   # the first run, on the unchanged tree
npx vitest run --config <scratchpad>/caserun/case.config.mts --root $PWD final   # the run on the changed tree
```

The program calls `groupProjects`, `crossLinks`, `roleLinks` and `collectionBar` on built inputs (a hub config with the default `categories:` rows, projects, entries, people) and prints one line per case. Sources and outputs are quoted at the end of this section.

### First run, on the unchanged tree

The first run found no case the brief's rules get wrong, so there was no stop. Per case:

- Case 1: `[in-flight 3: a-sub@submitted,b-exp@exploring,c-exp@exploring] [done 1: e-pub@published] [ideas 1: d-nas@nascent]`; the submitted project sits in "in flight", the stopped one is left out.
- Case 2: `[done 1: pub-noform@published]`.
- Case 3: `[in-flight 2: b:x@submitted,b:z@exploring] [ideas 1: b:y@nascent]`; the hub's row order and words play no part.
- Case 4: `[in-flight 2 WARN: ...] | [ideas 1: blk-nas@nascent]`; the blocked idea gives no warning.
- Case 5: lead `[in-flight 2 ...] [ideas 1 ...]`, collaborator `[in-flight 1 ...] [done 1 ...]`.
- Case 6: `[in-flight 1: rel-exp@exploring] [done 1: rel-pub@published]`.
- Case 7: `[stage:failed 1: dead1@failed] [stage:stopped 1: dead2@stopped]`.
- Case 8: `groups=[] line=[] shown=3/3 card=true`: no Projects section exists.
- Cases 9, 10, 11, 12, 19, 20, 22/24: the same line; no project group exists to pick.
- Case 13: read on the unchanged tree: the bar has no project group (case 8's line), so nothing narrows a person's role strips.
- Case 14: read on the unchanged tree: `EntryCard.svelte` has no `keeps` prop at the base, so the entry page draws the whole strip.
- Case 15: `(no group)`: the stopped project is left out.
- Case 16: `[ideas 1: nas@nascent]`.
- Case 17: `(no group)`: a project with no stage is left out.
- Case 18: the role lines of case 5; `both` is in both strips; no Projects counts exist.
- Case 21: `status counts=[{"value":"active",...,"count":2},{"value":"closed",...,"count":1},{"value":"no-funding",...,"count":2}]`; no Category pick exists.
- Case 23: `(no group)`.
- Case 25: `[in-flight 1: v-exp@exploring] [done 1: v-pub@published]`; the thesis and the released project are left out.
- Case 26: `[in-flight 2: a:sub@submitted,b:sub@submitted] [ideas 2: a:nas@nascent,b:nas@nascent]`.

### Run on the changed tree, each case with its verdict

Each line quoted is from the final run's output below. The "look" part of a case names what the landing look must see.

1. Met. `case 1: [in review 1 colour=#0ea5e9: a-sub@submitted] [in flight 2 colour=#16a34a: ...] [idea 1 colour=#7c5cff: d-nas@nascent] [publications 1 colour=#db2777: e-pub@published]`, the stopped project in no group; `case 1 tones: in-review=sky in-flight=green idea=violet publications=rose`. Look: the four headings in those hues on a funding card.
2. Met. `case 2: [other 1 colour=none: pub-noform@published]`.
3. Met. `case 3: [B-idea 1 colour=#7c5cff: b:y@nascent] [B-in flight 2 colour=#16a34a: b:x@submitted,b:z@exploring]`: hub b's rows put idea first and rename both rows; the strip follows them.
4. Met. `case 4: [in review 1 colour=#0ea5e9 WARN: blk-sub@submitted] [in flight 1 ...: ok-exp@exploring] | [idea 1 colour=#7c5cff WARN: blk-nas@nascent]`.
5. Met. `case 5 role lead: [in review 1 ...] [in flight 1 ...] [idea 1 ...]`, `case 5 role collaborator: [in flight 1 ...] [publications 1 ...]`.
6. Met. `case 6: [in flight 1 colour=#16a34a: rel-exp@exploring] [publications 1 colour=#db2777: rel-pub@published]`.
7. Met. `case 7: [failed 1: dead1@failed] [stopped 1: dead2@stopped]`: the Archival card's stage groups, unchanged.
8. Met. `case 8: line=[field:funder] section="Projects" [project_category,project_stage,project_form,project_tier,project_pillar]` with the five groups' counts; the view with no strip: `section=none`. Role is absent because no self is marked (case 11). Look: the Funding view's More, its last part under a rule and the heading PROJECTS, Category with coloured dots, then Stage, Form, Tier, Pillar.
9. Met. `case 9: ... shown=1/4 kept=[S1] card=true`, `strips S1:[in flight 1 colour=#16a34a: p-exp@exploring] S2:(no group) S3:(no group) S4:(no group)`, `status counts [["active",1],["closed",0],["no-funding",1]]`; Clear all (`filters {}`): `shown=4/4`. Look: line 2 reads "1 of 4 shown" (the Funding view at that pick), and Clear all brings the cards back.
10. Met. `case 10: ... shown=1/4 kept=[S1]`, `project_stage "Stage" {..., submitted / under review=1*, published=1}` under the Form pick, `project_form "Form" {journal article=1*, conference paper=1}` under the Stage pick; `strips S1:[in review 1 ...: p-sub@submitted]`.
11. Met. `case 11 (no self): section ids project_category,project_stage,project_form,project_tier,project_pillar`; `case 11 (self marked): ... project_tier,project_role,project_pillar`.
12. Met. `case 12: project_pillar "Pillar" {Pillar L=1, gone=0*} ... shown=0/4`. The value is listed, so a press on it takes it out. Look: the Pillar group lists the gone pillar at 0, ticked, and a press unticks it.
13. Met. `case 13: shown=1/2 kept=[ann]`, `ann lead: [in flight 1 ...: both@exploring]`, `ann collaborator: [in flight 1 ...: both@exploring]`: bob, whose role strips the pick empties, is hidden. Look: the People view under Category "in flight".
14. Met by reading: `src/lib/views/boards/entry/Entry.svelte:308-322` draws `<EntryCard ...>` with no `keeps`, and `EntryCard` handed none passes `KEEPS_ALL` through `roleLinks` and `crossLinks`. Look: a scheme's entry page opened while the Funding tab has a Category pick draws its whole strip.
15. Met. `case 15: [other 1 colour=none: stop@stopped]`.
16. Met. `case 16: [idea 1 colour=none: nas@nascent]`; `CrossLinks.tone` gives no tone for an empty colour, and `Disclosure` then draws the muted colour. Look: a hub whose idea row has no `color:`.
17. Met. `case 17: [other 1 colour=none: nostage@]`.
18. Met. `case 18: project_category "Category" {in review=1, in flight=1, idea=1, publications=1}`: the project in both of the person's strips is counted once in "in flight".
19. Met. `case 19: project_category "Category" {..., other=1*}`, `shown=1/4 kept=[S3]`, `S3:[other 1 colour=none: p-noform@published]`.
20. Met. `case 20: ... shown=4/4 kept=[S1,S2,S3,S4] card=true`: a saved Role pick with no self narrows nothing, and the section has no Role group.
21. Met. `case 21: field:funder "funder" {nwo=2, fwo=0}` under the Category pick, against `case 21 (no pick): field:funder "funder" {nwo=3, fwo=1}`.
22. Met. `case 22 (list rows = the entries keeps keeps): ... shown=1/4 kept=[S1]`; the list draws `shown` (`Collection.svelte:455`), the same entries the cards draw. Look: List mode in the Funding view under Category "in flight", the emptied rows gone.
23. Met. `case 23: strip (no group); Related line holds r1,r2`.
24. Met. Under "in flight": `card=true No funding strip=[u-exp]`; under "idea": `card=false No funding strip=[] No funding slice count={"value":"no-funding","label":"No funding","count":0}`. Look: the No funding card narrowed, then gone.
25. Met. `case 25: [in flight 1 ...] [publications 1 ...] [other outputs 1 colour=#9333ea: v-thesis@published] [released 1 colour=#0d9488: v-rel@released]`.
26. Met. `case 26 hub b alone: [idea 1 ...] [in review 1 ...]` (hub b's order); `case 26 both hubs: [in review 2 colour=#0ea5e9: a:sub@submitted,b:sub@submitted] [idea 2 colour=#7c5cff: a:nas@nascent,b:nas@nascent]` (the union order, the primary hub's rows first).

The final run's output was produced twice, at 18:30 and at 18:45 after the last edits; `diff` of the two outputs' `case` lines printed nothing (exit 0).

### Source of the case config

```ts
import base from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O96/vite.config.ts';

const SCRATCH = '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/caserun';

export default async (env: { mode: string; command: string }) => {
    const made = await (base as unknown as (e: unknown) => Promise<Record<string, any>>)(env);
    const test = { ...made.test };
    delete test.projects;
    test.environment = 'node';
    test.dir = SCRATCH;
    test.include = ['tests/*.test.ts'];
    test.maxWorkers = 1;
    return { ...made, test };
};
```

### Source of the first run (`first.test.ts`)

```ts
// Case-run program of O96, first run on the unchanged tree: prints each case's result.
import { expect, test } from 'vitest';
const W = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O96';
const { loadConfig, textCatalog } = await import(`${W}/src/lib/data/sources/config.ts`);
const { hubVocabs } = await import(`${W}/src/lib/data/index.ts`);
const { setCatalog } = await import(`${W}/src/lib/state/shared/words/text.ts`);
const { setVocab } = await import(`${W}/src/lib/state/shared/words/tones.ts`);
const xl = await import(`${W}/src/lib/state/boards/structure/cross-links.ts`);
const { collectionBar } = await import(`${W}/src/lib/state/boards/collection/bar.ts`);
const { fixtureProject } = await import(`${W}/tests/fixtures/entities-fixture.ts`);

const { config } = loadConfig(W);
setCatalog(textCatalog(config));
setVocab(hubVocabs({ primary: null, folders: [], own: config }, null, []));

const out: string[] = [];
const say = (line: string): void => void out.push(line);
const p = (id: string, over: Record<string, unknown> = {}) =>
    fixtureProject({ id, title: id, ...over });
const strip = (groups: any[]): string =>
    groups.length === 0
        ? '(no group)'
        : groups
              .map(
                  (g) =>
                      `[${xl.groupKey(g)} ${g.count}${g.warn ? ' WARN' : ''}: ${g.members.map((m: any) => `${m.id}@${m.stage}`).join(',')}]`
              )
              .join(' ');
const entry = (id: string, fields: Record<string, unknown> = {}, root?: string) => ({
    id,
    title: id,
    fields,
    file: 'f.yml',
    index: 0,
    ...(root === undefined ? {} : { root })
});
const funding = { registry: 'funding' };
const scheme = 'S';
const funded = (id: string, over: Record<string, unknown> = {}) =>
    p(id, { fundingIds: [scheme], ...over });

const case1 = [
    funded('a-sub', { stage: 'submitted' }),
    funded('b-exp', { stage: 'exploring' }),
    funded('c-exp', { stage: 'exploring' }),
    funded('d-nas', { stage: 'nascent' }),
    funded('e-pub', { stage: 'published', form: 'journal' }),
    funded('f-stop', { stage: 'stopped' })
];
say(`case 1: ${strip(xl.crossLinks(entry(scheme), funding, case1, [], config))}`);
say(`case 2: ${strip(xl.groupProjects([p('pub-noform', { stage: 'published' })], config))}`);
const rows = config.categories as Record<string, unknown>[];
const reordered = { ...config, categories: [...rows].reverse().map((row) => ({ ...row, label: `B-${String(row.label)}` })) };
const wordsAB = (hub?: string) => (hub === 'b' ? reordered : config);
say(
    `case 3: ${strip(xl.groupProjects([p('b:x', { root: 'b', stage: 'submitted' }), p('b:y', { root: 'b', stage: 'nascent' }), p('b:z', { root: 'b', stage: 'exploring' })], config, wordsAB))}`
);
say(
    `case 4: ${strip(xl.groupProjects([p('blk-sub', { stage: 'submitted', chips: ['blocked'] }), p('ok-exp', { stage: 'exploring' })], config))} | ${strip(xl.groupProjects([p('blk-nas', { stage: 'nascent', chips: ['blocked'] })], config))}`
);
const person = entry('ann');
const people = { registry: 'people' };
const case5 = [
    p('lead-sub', { stage: 'submitted', lead: ['ann'] }),
    p('lead-nas', { stage: 'nascent', lead: ['ann'] }),
    p('col-pub', { stage: 'published', form: 'journal', collaborators: ['ann'] }),
    p('both', { stage: 'exploring', lead: ['ann'], collaborators: ['ann'] })
];
for (const row of xl.roleLinks(person, people, case5, config) ?? []) {
    say(`case 5/18 role ${row.key}: ${strip(row.groups)}`);
}
say(`case 6: ${strip(xl.groupProjects([p('rel-exp', { stage: 'exploring' }), p('rel-pub', { stage: 'published', form: 'conference' })], config))}`);
say(
    `case 7: ${strip([xl.stageGroup({ word: 'failed', label: 'failed', glyph: 'x' }, [p('dead1', { stage: 'failed' })]), xl.stageGroup({ word: 'stopped', label: 'stopped', glyph: 'y' }, [p('dead2', { stage: 'stopped' })])])}`
);
const noArchival = { ...config, categories: rows.filter((row) => row.archival !== true) };
say(`case 15: ${strip(xl.groupProjects([p('stop', { stage: 'stopped' })], noArchival))}`);
const noColour = { ...config, categories: rows.map((row) => (row.key === 'idea' ? { ...row, color: undefined } : row)) };
say(`case 16: ${strip(xl.groupProjects([p('nas', { stage: 'nascent' })], noColour))}`);
say(`case 17: ${strip(xl.groupProjects([p('nostage')], config))}`);
say(`case 23: ${strip(xl.groupProjects([p('r1', { stage: 'failed' }), p('r2', { stage: 'stopped' })], config))}`);
say(`case 25: ${strip(xl.crossLinks(entry('V', { related: ['v-exp', 'v-pub'] }), undefined, [p('v-exp', { stage: 'exploring' }), p('v-pub', { stage: 'published', form: 'journal' })], [], config))}`);
const otherRows = { ...config, categories: [rows[2], rows[0], rows[1], ...rows.slice(3)] };
const wordsTwo = (hub?: string) => (hub === 'b' ? otherRows : config);
say(
    `case 26: ${strip(xl.groupProjects([p('a:sub', { root: 'a', stage: 'submitted' }), p('a:nas', { root: 'a', stage: 'nascent' }), p('b:sub', { root: 'b', stage: 'submitted' }), p('b:nas', { root: 'b', stage: 'nascent' })], config, wordsTwo))}`
);

// The bar cases: the Funding view with three scheme entries.
const schema = [{ field: 'status', type: 'select' }];
const schemes = [entry('S1', { status: 'active' }), entry('S2', { status: 'active' }), entry('S3', { status: 'closed' })];
const bar = (filters: Record<string, string[]>, self: Set<string> = new Set()) =>
    collectionBar({ entries: schemes, schemas: [schema], filters, search: '', mine: false, config, self, hubs: [], noFunding: 2 });
const describeBar = (made: any): string =>
    `groups=[${made.groups.map((g: any) => g.id).join(',')}] line=[${made.line.join(',')}] shown=${made.shown}/${made.total} card=${made.card}`;
say(`case 8: ${describeBar(bar({}))}`);
say(`case 9: ${describeBar(bar({ project_category: ['in-flight'] }))}`);
say(`case 10: ${describeBar(bar({ project_stage: ['submitted'], project_form: ['journal'] }))}`);
say(`case 11: ${describeBar(bar({}))}`);
say(`case 12: ${describeBar(bar({ project_pillar: ['gone'] }))}`);
say(`case 19: ${describeBar(bar({ project_category: ['__none__'] }))}`);
say(`case 20: ${describeBar(bar({ project_role: ['lead'] }))}`);
say(`case 21: ${describeBar(bar({ project_category: ['in-flight'] }))} status counts=${JSON.stringify(bar({ project_category: ['in-flight'] }).counted[0].values)}`);
say(`case 22/24: ${describeBar(bar({ project_category: ['in-flight'] }))}`);

test('first run', () => {
    process.stdout.write(`${out.join('\n')}\n`);
    expect(out.length).toBeGreaterThan(0);
});
```

### Output of the first run, as printed

```
 RUN  v4.1.11 /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O96

case 1: [in-flight 3: a-sub@submitted,b-exp@exploring,c-exp@exploring] [done 1: e-pub@published] [ideas 1: d-nas@nascent]
case 2: [done 1: pub-noform@published]
case 3: [in-flight 2: b:x@submitted,b:z@exploring] [ideas 1: b:y@nascent]
case 4: [in-flight 2 WARN: blk-sub@submitted,ok-exp@exploring] | [ideas 1: blk-nas@nascent]
case 5/18 role lead: [in-flight 2: both@exploring,lead-sub@submitted] [ideas 1: lead-nas@nascent]
case 5/18 role collaborator: [in-flight 1: both@exploring] [done 1: col-pub@published]
case 6: [in-flight 1: rel-exp@exploring] [done 1: rel-pub@published]
case 7: [stage:failed 1: dead1@failed] [stage:stopped 1: dead2@stopped]
case 15: (no group)
case 16: [ideas 1: nas@nascent]
case 17: (no group)
case 23: (no group)
case 25: [in-flight 1: v-exp@exploring] [done 1: v-pub@published]
case 26: [in-flight 2: a:sub@submitted,b:sub@submitted] [ideas 2: a:nas@nascent,b:nas@nascent]
case 8: groups=[] line=[] shown=3/3 card=true
case 9: groups=[] line=[] shown=3/3 card=true
case 10: groups=[] line=[] shown=3/3 card=true
case 11: groups=[] line=[] shown=3/3 card=true
case 12: groups=[] line=[] shown=3/3 card=true
case 19: groups=[] line=[] shown=3/3 card=true
case 20: groups=[] line=[] shown=3/3 card=true
case 21: groups=[] line=[] shown=3/3 card=true status counts=[{"value":"active","label":"active","count":2},{"value":"closed","label":"closed","count":1},{"value":"no-funding","label":"No funding","count":2}]
case 22/24: groups=[] line=[] shown=3/3 card=true

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  18:20:08
   Duration  4.28s (transform 1.10s, setup 0ms, import 4.17s, tests 2ms, environment 0ms)
```

### Source of the run on the changed tree (`final.test.ts`)

```ts
// Case-run program of O96, run on the changed tree: prints each case's result.
import { expect, test } from 'vitest';
const W = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O96';
const { loadConfig, textCatalog } = await import(`${W}/src/lib/data/sources/config.ts`);
const { hubVocabs } = await import(`${W}/src/lib/data/index.ts`);
const { setCatalog } = await import(`${W}/src/lib/state/shared/words/text.ts`);
const { setVocab, toneOf } = await import(`${W}/src/lib/state/shared/words/tones.ts`);
const xl = await import(`${W}/src/lib/state/boards/structure/cross-links.ts`);
const { collectionBar } = await import(`${W}/src/lib/state/boards/collection/bar.ts`);
const { boardItems, mapPreset } = await import(`${W}/src/lib/state/boards/board/index.ts`);
const { fixtureProject } = await import(`${W}/tests/fixtures/entities-fixture.ts`);

const { config } = loadConfig(W);
setCatalog(textCatalog(config));
setVocab(hubVocabs({ primary: null, folders: [], own: config }, null, []));

const out: string[] = [];
const say = (line: string): void => void out.push(line);
const p = (id: string, over: Record<string, unknown> = {}) =>
    fixtureProject({ id, title: id, ...over });
const strip = (groups: any[]): string =>
    groups.length === 0
        ? '(no group)'
        : groups
              .map(
                  (g) =>
                      `[${g.stage?.label ?? g.category?.label} ${g.count}${g.category === undefined ? '' : ` colour=${g.category.color === '' ? 'none' : g.category.color}`}${g.warn ? ' WARN' : ''}: ${g.members.map((m: any) => `${m.id}@${m.stage}`).join(',')}]`
              )
              .join(' ');
const entry = (id: string, fields: Record<string, unknown> = {}, root?: string) => ({
    id,
    title: id,
    fields,
    file: 'f.yml',
    index: 0,
    ...(root === undefined ? {} : { root })
});
const funding = { registry: 'funding' };
const funded = (scheme: string, id: string, over: Record<string, unknown> = {}) =>
    p(id, { fundingIds: [scheme], ...over });
const rows = config.categories as Record<string, unknown>[];

// Cases 1, 14: the strip of a scheme, on its card and on its page (no `keeps`).
const case1 = [
    funded('S', 'a-sub', { stage: 'submitted' }),
    funded('S', 'b-exp', { stage: 'exploring' }),
    funded('S', 'c-exp', { stage: 'exploring' }),
    funded('S', 'd-nas', { stage: 'nascent' }),
    funded('S', 'e-pub', { stage: 'published', form: 'journal' }),
    funded('S', 'f-stop', { stage: 'stopped' })
];
const scheme = entry('S');
say(`case 1: ${strip(xl.crossLinks(scheme, funding, case1, [], config))}`);
say(`case 1 tones: ${rows.slice(0, 4).map((row) => `${String(row.key)}=${toneOf(String(row.color))}`).join(' ')}`);
say(`case 2: ${strip(xl.groupProjects([p('pub-noform', { stage: 'published' })], config))}`);
const reordered = {
    ...config,
    categories: [...rows].reverse().map((row) => ({ ...row, label: `B-${String(row.label)}` }))
};
const wordsAB = (hub?: string) => (hub === 'b' ? reordered : config);
say(
    `case 3: ${strip(xl.groupProjects([p('b:x', { root: 'b', stage: 'submitted' }), p('b:y', { root: 'b', stage: 'nascent' }), p('b:z', { root: 'b', stage: 'exploring' })], config, wordsAB))}`
);
say(
    `case 4: ${strip(xl.groupProjects([p('blk-sub', { stage: 'submitted', chips: ['blocked'] }), p('ok-exp', { stage: 'exploring' })], config))} | ${strip(xl.groupProjects([p('blk-nas', { stage: 'nascent', chips: ['blocked'] })], config))}`
);
const person = entry('ann');
const peopleColl = { registry: 'people' };
const case5 = [
    p('lead-sub', { stage: 'submitted', lead: ['ann'] }),
    p('lead-nas', { stage: 'nascent', lead: ['ann'] }),
    p('col-pub', { stage: 'published', form: 'journal', collaborators: ['ann'] }),
    p('both', { stage: 'exploring', lead: ['ann'], collaborators: ['ann'] })
];
for (const row of xl.roleLinks(person, peopleColl, case5, config) ?? []) {
    say(`case 5 role ${row.key}: ${strip(row.groups)}`);
}
say(
    `case 6: ${strip(xl.groupProjects([p('rel-exp', { stage: 'exploring' }), p('rel-pub', { stage: 'published', form: 'conference' })], config))}`
);
say(
    `case 7: ${strip([xl.stageGroup({ word: 'failed', label: 'failed', glyph: 'x' }, [p('dead1', { stage: 'failed' })]), xl.stageGroup({ word: 'stopped', label: 'stopped', glyph: 'y' }, [p('dead2', { stage: 'stopped' })])])}`
);
const noArchival = { ...config, categories: rows.filter((row) => row.archival !== true) };
say(`case 15: ${strip(xl.groupProjects([p('stop', { stage: 'stopped' })], noArchival))}`);
const noColour = {
    ...config,
    categories: rows.map((row) => (row.key === 'idea' ? { ...row, color: undefined } : row))
};
say(`case 16: ${strip(xl.groupProjects([p('nas', { stage: 'nascent' })], noColour))}`);
say(`case 17: ${strip(xl.groupProjects([p('nostage')], config))}`);
const archivedRelated = [p('r1', { stage: 'failed' }), p('r2', { stage: 'stopped' })];
const related = xl.groupProjects(archivedRelated, config);
const listed = new Set(related.flatMap((g: any) => g.members.map((m: any) => m.id)));
say(`case 23: strip ${strip(related)}; Related line holds ${archivedRelated.filter((one) => !listed.has(one.id)).map((one) => one.id).join(',')}`);
say(
    `case 25: ${strip(xl.groupProjects([p('v-exp', { stage: 'exploring' }), p('v-pub', { stage: 'published', form: 'journal' }), p('v-thesis', { stage: 'published', form: 'thesis' }), p('v-rel', { stage: 'released' })], config))}`
);
const otherRows = { ...config, categories: [rows[2], rows[0], rows[1], ...rows.slice(3)] };
const wordsTwo = (hub?: string) => (hub === 'b' ? otherRows : config);
say(`case 26 hub b alone: ${strip(xl.groupProjects([p('b:sub', { root: 'b', stage: 'submitted' }), p('b:nas', { root: 'b', stage: 'nascent' })], config, wordsTwo))}`);
say(
    `case 26 both hubs: ${strip(xl.groupProjects([p('a:sub', { root: 'a', stage: 'submitted' }), p('a:nas', { root: 'a', stage: 'nascent' }), p('b:sub', { root: 'b', stage: 'submitted' }), p('b:nas', { root: 'b', stage: 'nascent' })], config, wordsTwo))}`
);

// The bar cases. A snapshot holding the projects, people and pillars the cases name.
const snapshotOf = (projects: any[], people: any[] = []) =>
    ({
        entities: {
            projects: Object.fromEntries(projects.map((one) => [one.id, one])),
            people: Object.fromEntries(people.map((one) => [one.id, one])),
            venues: {},
            pillars: { pl: { id: 'pl', title: 'Pillar L' } },
            resources: {}
        },
        relations: { projectRelated: [] }
    }) as any;
const preset = mapPreset(config, () => config);
const stripsFor = (
    entries: any[],
    collection: any,
    projects: any[],
    people: any[],
    unfunded: any[] = []
) => {
    const items = new Map(
        boardItems(snapshotOf(projects, people), preset).map((item: any) => [item.id, item])
    );
    const itemsOf = (some: any[]) => some.flatMap((one) => items.get(one.id) ?? []);
    const drawn = new Map(
        entries.map((one) => [one, itemsOf(xl.stripProjects(one, collection, projects, people, config))])
    );
    return { of: (one: any) => drawn.get(one) ?? [], unfunded: itemsOf(xl.drawnProjects(unfunded, config)), preset };
};
const schema = [
    { field: 'status', type: 'select' },
    { field: 'funder', type: 'select', filter: true }
];
const schemes = [
    entry('S1', { status: 'active', funder: 'nwo' }),
    entry('S2', { status: 'active', funder: 'fwo' }),
    entry('S3', { status: 'closed', funder: 'nwo' }),
    entry('S4', { status: 'active', funder: 'nwo' })
];
const projects = [
    funded('S1', 'p-sub', { stage: 'submitted', form: 'journal', tier: 'research', pillarIds: ['pl'] }),
    funded('S1', 'p-exp', { stage: 'exploring', tier: 'research' }),
    funded('S2', 'p-nas', { stage: 'nascent', tier: 'software' }),
    funded('S2', 'p-pub', { stage: 'published', form: 'journal', tier: 'research' }),
    funded('S3', 'p-sub2', { stage: 'submitted', form: 'conference', tier: 'research' }),
    funded('S3', 'p-noform', { stage: 'published', tier: 'research' }),
    p('u-exp', { stage: 'building', tier: 'research' })
];
const unfunded = [projects[6]];
const fundStrips = stripsFor(schemes, funding, projects, [], unfunded);
const bar = (filters: Record<string, string[]>, self: Set<string> = new Set(), strips: any = fundStrips) =>
    collectionBar({
        entries: schemes,
        schemas: [schema],
        filters,
        search: '',
        mine: false,
        config,
        self,
        hubs: [],
        noFunding: unfunded.length,
        strips
    });
const groupLine = (g: any) =>
    `${g.id} "${g.heading}" {${g.items.map((i: any) => `${i.label}=${i.count}${i.active ? '*' : ''}`).join(', ')}}`;
const describe = (made: any, note = ''): string =>
    `${note}line=[${made.line.join(',')}] section=${made.section === undefined ? 'none' : `"${made.section.heading}" [${made.section.ids.join(',')}]`} shown=${made.shown}/${made.total} kept=[${schemes.filter(made.keeps).map((one) => one.id).join(',')}] card=${made.card}`;
const stripsOf = (made: any): string =>
    schemes
        .map((one) => `${one.id}:${strip(xl.crossLinks(one, funding, projects, [], config, undefined, made.strip))}`)
        .join(' ');

const b8 = bar({});
say(`case 8: ${describe(b8)}`);
for (const g of b8.groups.filter((one: any) => b8.section?.ids.includes(one.id))) say(`case 8   ${groupLine(g)}`);
const empty = collectionBar({ entries: schemes, schemas: [schema], filters: {}, search: '', mine: false, config, self: new Set(), hubs: [], noFunding: 0, strips: stripsFor(schemes, funding, [], []) });
say(`case 8 (view with no strip): ${describe(empty)}`);
const b9 = bar({ project_category: ['in-flight'] });
say(`case 9: ${describe(b9)}`);
say(`case 9   strips ${stripsOf(b9)}`);
say(`case 9   status counts ${JSON.stringify(b9.counted[0].values.map((v: any) => [v.value, v.count]))}`);
const b9c = bar({});
say(`case 9 Clear all (filters {}): ${describe(b9c)}`);
const b10 = bar({ project_stage: ['submitted'], project_form: ['journal'] });
say(`case 10: ${describe(b10)}`);
for (const g of b10.groups.filter((one: any) => ['project_stage', 'project_form'].includes(one.id))) say(`case 10   ${groupLine(g)}`);
say(`case 10   strips ${stripsOf(b10)}`);
const b10s = bar({ project_stage: ['submitted'] });
for (const g of b10s.groups.filter((one: any) => one.id === 'project_form')) say(`case 10 (Stage pick alone)   ${groupLine(g)}`);
say(`case 11 (no self): section ids ${b8.section.ids.join(',')}`);
const self = new Set(['me']);
const b11 = bar({}, self);
say(`case 11 (self marked): section ids ${b11.section.ids.join(',')}`);
const b12 = bar({ project_pillar: ['gone'] });
for (const g of b12.groups.filter((one: any) => one.id === 'project_pillar')) say(`case 12: ${groupLine(g)} ${describe(b12)}`);
const b19 = bar({ project_category: ['__none__'] });
for (const g of b19.groups.filter((one: any) => one.id === 'project_category')) say(`case 19: ${groupLine(g)}`);
say(`case 19   ${describe(b19)} strips ${stripsOf(b19)}`);
const b20 = bar({ project_role: ['lead'] });
say(`case 20: ${describe(b20)}`);
const b21 = bar({ project_category: ['in-review'] });
for (const g of b21.groups.filter((one: any) => one.id === 'field:funder')) say(`case 21: ${groupLine(g)}`);
for (const g of b8.groups.filter((one: any) => one.id === 'field:funder')) say(`case 21 (no pick): ${groupLine(g)}`);
say(`case 22 (list rows = the entries keeps keeps): ${describe(b9)}`);
say(`case 24: Category in-flight ${describe(b9)} No funding strip=[${unfunded.filter(b9.strip).map((one) => one.id).join(',')}]`);
const b24 = bar({ project_category: ['idea'] });
say(`case 24: Category idea ${describe(b24)} No funding strip=[${unfunded.filter(b24.strip).map((one) => one.id).join(',')}] No funding slice count=${JSON.stringify(b24.counted[0].values.find((v: any) => v.value === 'no-funding'))}`);

// Cases 13 and 18: the People view.
const people = [
    { id: 'ann', name: 'Ann', affiliations: [] },
    { id: 'bob', name: 'Bob', affiliations: [] }
];
const persons = [entry('ann'), entry('bob')];
const roleProjects = [
    p('lead-sub', { stage: 'submitted', lead: ['ann'] }),
    p('col-pub', { stage: 'published', form: 'journal', collaborators: ['ann'] }),
    p('both', { stage: 'exploring', lead: ['ann'], collaborators: ['ann'] }),
    p('bob-nas', { stage: 'nascent', lead: ['bob'] })
];
const personStrips = stripsFor(persons, peopleColl, roleProjects, people);
const peopleBar = (filters: Record<string, string[]>) =>
    collectionBar({ entries: persons, schemas: [[{ field: 'name', type: 'text' }]], filters, search: '', mine: false, config, self: new Set(), hubs: [], noFunding: 0, strips: personStrips });
const pb = peopleBar({ project_category: ['in-flight'] });
say(`case 13: shown=${pb.shown}/${pb.total} kept=[${persons.filter(pb.keeps).map((one) => one.id).join(',')}]`);
for (const one of persons) {
    for (const row of xl.roleLinks(one, peopleColl, roleProjects, config, undefined, pb.strip) ?? []) say(`case 13   ${one.id} ${row.key}: ${strip(row.groups)}`);
}
for (const g of peopleBar({}).groups.filter((one: any) => one.id === 'project_category')) say(`case 18: ${groupLine(g)}`);

test('final run', () => {
    process.stdout.write(`${out.join('\n')}\n`);
    expect(out.length).toBeGreaterThan(0);
});
```

### Output of the run on the changed tree, as printed

```

 RUN  v4.1.11 /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O96

case 1: [in review 1 colour=#0ea5e9: a-sub@submitted] [in flight 2 colour=#16a34a: b-exp@exploring,c-exp@exploring] [idea 1 colour=#7c5cff: d-nas@nascent] [publications 1 colour=#db2777: e-pub@published]
case 1 tones: in-review=sky in-flight=green idea=violet publications=rose
case 2: [other 1 colour=none: pub-noform@published]
case 3: [B-idea 1 colour=#7c5cff: b:y@nascent] [B-in flight 2 colour=#16a34a: b:x@submitted,b:z@exploring]
case 4: [in review 1 colour=#0ea5e9 WARN: blk-sub@submitted] [in flight 1 colour=#16a34a: ok-exp@exploring] | [idea 1 colour=#7c5cff WARN: blk-nas@nascent]
case 5 role lead: [in review 1 colour=#0ea5e9: lead-sub@submitted] [in flight 1 colour=#16a34a: both@exploring] [idea 1 colour=#7c5cff: lead-nas@nascent]
case 5 role collaborator: [in flight 1 colour=#16a34a: both@exploring] [publications 1 colour=#db2777: col-pub@published]
case 6: [in flight 1 colour=#16a34a: rel-exp@exploring] [publications 1 colour=#db2777: rel-pub@published]
case 7: [failed 1: dead1@failed] [stopped 1: dead2@stopped]
case 15: [other 1 colour=none: stop@stopped]
case 16: [idea 1 colour=none: nas@nascent]
case 17: [other 1 colour=none: nostage@]
case 23: strip (no group); Related line holds r1,r2
case 25: [in flight 1 colour=#16a34a: v-exp@exploring] [publications 1 colour=#db2777: v-pub@published] [other outputs 1 colour=#9333ea: v-thesis@published] [released 1 colour=#0d9488: v-rel@released]
case 26 hub b alone: [idea 1 colour=#7c5cff: b:nas@nascent] [in review 1 colour=#0ea5e9: b:sub@submitted]
case 26 both hubs: [in review 2 colour=#0ea5e9: a:sub@submitted,b:sub@submitted] [idea 2 colour=#7c5cff: a:nas@nascent,b:nas@nascent]
case 8: line=[field:funder] section="Projects" [project_category,project_stage,project_form,project_tier,project_pillar] shown=4/4 kept=[S1,S2,S3,S4] card=true
case 8   project_category "Category" {in review=2, in flight=2, idea=1, publications=1, other=1}
case 8   project_stage "Stage" {nascent=1, exploring=1, building=1, submitted / under review=2, published=2}
case 8   project_form "Form" {journal article=2, conference paper=1}
case 8   project_tier "Tier" {Research=6, Software=1}
case 8   project_pillar "Pillar" {Pillar L=1}
case 8 (view with no strip): line=[field:funder] section=none shown=4/4 kept=[S1,S2,S3,S4] card=false
case 9: line=[field:funder] section="Projects" [project_category,project_stage,project_form,project_tier,project_pillar] shown=1/4 kept=[S1] card=true
case 9   strips S1:[in flight 1 colour=#16a34a: p-exp@exploring] S2:(no group) S3:(no group) S4:(no group)
case 9   status counts [["active",1],["closed",0],["no-funding",1]]
case 9 Clear all (filters {}): line=[field:funder] section="Projects" [project_category,project_stage,project_form,project_tier,project_pillar] shown=4/4 kept=[S1,S2,S3,S4] card=true
case 10: line=[field:funder] section="Projects" [project_category,project_stage,project_form,project_tier,project_pillar] shown=1/4 kept=[S1] card=false
case 10   project_stage "Stage" {nascent=0, exploring=0, building=0, submitted / under review=1*, published=1}
case 10   project_form "Form" {journal article=1*, conference paper=1}
case 10   strips S1:[in review 1 colour=#0ea5e9: p-sub@submitted] S2:(no group) S3:(no group) S4:(no group)
case 10 (Stage pick alone)   project_form "Form" {journal article=1, conference paper=1}
case 11 (no self): section ids project_category,project_stage,project_form,project_tier,project_pillar
case 11 (self marked): section ids project_category,project_stage,project_form,project_tier,project_role,project_pillar
case 12: project_pillar "Pillar" {Pillar L=1, gone=0*} line=[field:funder] section="Projects" [project_category,project_stage,project_form,project_tier,project_pillar] shown=0/4 kept=[] card=false
case 19: project_category "Category" {in review=2, in flight=2, idea=1, publications=1, other=1*}
case 19   line=[field:funder] section="Projects" [project_category,project_stage,project_form,project_tier,project_pillar] shown=1/4 kept=[S3] card=false strips S1:(no group) S2:(no group) S3:[other 1 colour=none: p-noform@published] S4:(no group)
case 20: line=[field:funder] section="Projects" [project_category,project_stage,project_form,project_tier,project_pillar] shown=4/4 kept=[S1,S2,S3,S4] card=true
case 21: field:funder "funder" {nwo=2, fwo=0}
case 21 (no pick): field:funder "funder" {nwo=3, fwo=1}
case 22 (list rows = the entries keeps keeps): line=[field:funder] section="Projects" [project_category,project_stage,project_form,project_tier,project_pillar] shown=1/4 kept=[S1] card=true
case 24: Category in-flight line=[field:funder] section="Projects" [project_category,project_stage,project_form,project_tier,project_pillar] shown=1/4 kept=[S1] card=true No funding strip=[u-exp]
case 24: Category idea line=[field:funder] section="Projects" [project_category,project_stage,project_form,project_tier,project_pillar] shown=1/4 kept=[S2] card=false No funding strip=[] No funding slice count={"value":"no-funding","label":"No funding","count":0}
case 13: shown=1/2 kept=[ann]
case 13   ann lead: [in flight 1 colour=#16a34a: both@exploring]
case 13   ann collaborator: [in flight 1 colour=#16a34a: both@exploring]
case 18: project_category "Category" {in review=1, in flight=1, idea=1, publications=1}

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  18:45:32
   Duration  2.69s (transform 819ms, setup 0ms, import 2.59s, tests 2ms, environment 0ms)

```

## DONE / NOT DONE

All commands ran from the worktree root with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`.

| Item | State | Proof |
| --- | --- | --- |
| 1. `groupProjects` by the rows of `categories:`, archival rows out, "other" last, warning on any group with a blocked project, union order over several hubs, no category name in code | DONE | cases 1 to 7, 15 to 17, 23, 25, 26 above; check 3 below |
| 1. CrossLinks heads each group with its row's label in its row's colour, through a `tone` prop on Disclosure; the `xlink_*` words removed | DONE | `CrossLinks.svelte:57-68`, `Disclosure.svelte:15-27,50`; check 3 |
| 2. Projects section in More: Category, Stage, Form, Tier, Role (with a self), Pillar, saved as `project_*`, distinct-project counts, picks narrow strips and hide emptied entries and the No funding card, list mode, entry counts under the picks, Clear all, entry page whole | DONE | cases 8 to 14, 18 to 22, 24 above |
| 2. FilterBar and PickMenu each one optional prop | DONE | `FilterBar.svelte:60-61`, `PickMenu.svelte:50-51` (`section`) |
| 3. HELP.md 277, 296, 301; head comments; vocab.yml 53, 55, 56, 90, 264; options vocab 29, 347; vocab.ts 148, 154, 162, 201, 330; CardLinks 24-26 | DONE | hunk headers of `git diff -U0` at exactly those lines (CardLinks `@@ -26 +26 @@`); check 9 |
| Check 1: `npm run diagrams && npm run test:quick` | NOT GREEN, one timeout in a file the step does not change | output below |
| Check 2: ASCII gate | DONE | printed nothing, exit 0 |
| Check 3: the two greps | DONE | each printed nothing, exit 1 |
| Check 4: line counts | DONE | below; largest source 537 (`vocab.ts`), largest component 511 (`Collection.svelte`) |
| Check 5: every case run and quoted, each look named | DONE | "The cases" above |
| Check 6: prose of every new sentence read | DONE | read in `git diff` of every changed file; no break of the rules file found |
| Check 7: unused exports | DONE | `diff` with the base list printed nothing, exit 0 |
| Check 8: history words | DONE | grep below, every hit judged |
| Check 9: grep | DONE | printed nothing, exit 1 |

### Check 1

Run twice in the step (the verify list run twice in all). The second run, `npm run diagrams && npm run test:quick`, printed, after the 18 diagram files:

```
test:quick: 23 changed file(s), from git since HEAD
test:quick: 53 test file(s)
ok      prettier (0.7 s): All matched files use Prettier code style!
ok      ASCII gate (0.7 s)
ok      svelte-kit sync (2.2 s)
ok      svelte-check (50.1 s): 1793122788919 COMPLETED 551 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (76.8 s)
ok      vitest (131.6 s): Duration  122.01s (transform 95.67s, setup 0ms, import 163.97s, tests 158.52s, environment 9.76s)
ok      vitest checks (137.1 s): Duration  124.86s (transform 108.86s, setup 0ms, import 270.52s, tests 198.54s, environment 3ms)
FAILED  vitest slow (206.6 s)
 FAIL  |unit| tests/data/hubs/hub-portfolio.test.ts > a workspace of several hubs, every record under its hub and its key > gives a key two hubs hold two records, each project naming its own hub record, each shown by the key (C1)
Error: Test timed out in 20000ms.
 Test Files  1 failed | 7 passed (8)
      Tests  1 failed | 85 passed | 107 skipped (193)
test:quick: 209.0 s; failed: vitest slow
```

`uptime` after it: `load averages: 21.67 15.87 10.38`. The same file alone, `npx vitest run --project unit --tagsFilter slow --testTimeout 120000 tests/data/hubs/hub-portfolio.test.ts` (load 6.93 at its start), printed `Test Files  1 passed (1)`, `Tests  16 passed (16)`, `Duration  209.95s (... tests 195.02s ...)`. The 16 slow tests take 195 s together, so one passing 20 s depends on the machine's load. `hub-portfolio.test.ts` reaches the step's files at import depth 2 (`test:quick`'s selection); the step's changes on that path are description strings in `vocab.ts` and one dropped `export` in `vocab-keys.ts`. Whether the base runs the same test faster under the same load is not verified: no base run of it was made, since the base copy has no installed tree to run it from.

The first run of the list had two more reds, each closed: `boundaries.test.ts` flagged a `.label` rule in `Disclosure.svelte` (the tone is now one custom property on the button, and `boundaries.test.ts` run alone printed `Tests 11 passed (11)`), and `choices.test.ts` timed out at 5 s (run alone, `Tests 11 passed (11)`); the second run's `vitest` and `vitest checks` lines above are green.

One whole-suite command ran by mistake: `npx vitest run --project unit --dir <scratchpad>` ignored `--dir` and ran the unit project; it was stopped part way after about 300 s, before any result, and its workers killed.

### Check 2

```
printf '%s\0' <the 21 changed non-svg files> | xargs -0 env LC_ALL=C perl -ne '...'
```
printed nothing; `exit=0`.

### Check 3

`grep -rn "in-flight'\|'ideas'\|'done'" src/lib/state/boards/structure/cross-links.ts src/lib/views/shared/links/CrossLinks.svelte` printed nothing, `exit=1`; `grep -rn "xlink_" src config` printed nothing, `exit=1`.

### Check 7

`sh utils/unused-exports.sh > unused-after.txt` (exit 0), then `diff .agents/worktrees/O96-base/unused-exports.txt unused-after.txt` printed nothing, `diff exit=0`. The difference is none.

### Check 8

`git diff -U0 -- src config docs/HELP.md | grep '^+' | grep -inE "<step ids, dates, before, used to, no longer, still, always has been, always had, as before, previously, the step adds, after this package, now, anymore, was, were, replac, instead of, formerly, old, new>"` printed 17 lines. Each judged:

- `vocab.yml` `terminal` line and its `vocab.ts` twin: hit on "hold" inside "hold none"; no history.
- HELP.md 277: hits on "hold"/"holds"; the sentence states what the bar does; no history.
- HELP.md 296: "before an empty terminals pane", "while that tab is still open": existing text of the paragraph, an order and a state, not a comparison with an earlier version.
- `bar.ts` "The preset the items were joined by": the past tense of how the items were made, not of the code's history.
- `cross-links.ts` "told apart by": hit on "told".
- `PickMenu.svelte` "parts the run from the groups before it" and `CrossLinks.svelte` "draws it before its groups": places on the page.
- The other hits are code (`new Set`, `new Map`), not comments.

No step id, date or comparison with an earlier state is in a changed comment.

### Check 9

`grep -n "cross-link group\|groups under none" config/catalogs/vocab.yml config/options/catalogs/vocab.yml src/lib/data/shapes/catalog-files/vocab.ts src/lib/views/shared/card/project/CardLinks.svelte` printed nothing, `exit=1`.

## Terms

The repository has no `docs/glossary.md` (`ls docs/glossary.md`: "No such file or directory").

## Files with line counts

`wc -l` after the last edit:

| File | Lines |
| --- | --- |
| `src/lib/data/shapes/catalog-files/vocab.ts` | 537 |
| `src/lib/data/shapes/vocab-keys.ts` | 335 |
| `src/lib/state/boards/collection/bar.ts` | 532 |
| `src/lib/state/boards/structure/cross-links.ts` | 355 |
| `src/lib/state/boards/structure/map-bar.ts` | 251 |
| `src/lib/ui/tree/Disclosure.svelte` | 84 |
| `src/lib/views/boards/collection/Collection.svelte` | 511 |
| `src/lib/views/boards/collection/NoFundingCard.svelte` | 58 |
| `src/lib/views/shared/card/project/CardLinks.svelte` | 252 |
| `src/lib/views/shared/card/record/RecordCard.svelte` | 361 |
| `src/lib/views/shared/forms/bar/FilterBar.svelte` | 213 |
| `src/lib/views/shared/forms/bar/PickMenu.svelte` | 321 |
| `src/lib/views/shared/forms/entry/card/EntryCard.svelte` | 338 |
| `src/lib/views/shared/links/CrossLinks.svelte` | 201 |
| `config/catalogs/vocab.yml` | 307 |
| `config/options/catalogs/vocab.yml` | 419 |
| `config/text/views/boards/collection.yml` | 79 |
| `config/text/views/boards/project.yml` | 189 |
| `docs/HELP.md` | 587 |
| `docs/diagrams/layer-state.dot` (+ `.svg`) | 173 |
| `docs/diagrams/layers.dot` (+ `.svg`) | 101 |

The diagrams changed by `npm run diagrams` alone: three edge counts, `state/boards to state/shared` 18 to 19, `state/boards to layer data` 94 to 95, `state to data` 511 to 512. No test was added or changed.

## Docs and comments, each still true or rewritten

- `docs/HELP.md:277`, `:296`, `:301`: rewritten.
- `config/catalogs/vocab.yml:53`, `:55`, `:56`, `:90`, `:264`: rewritten.
- `config/options/catalogs/vocab.yml:29`, `:347`: rewritten.
- `src/lib/data/shapes/catalog-files/vocab.ts:148`, `:154`, `:162`, `:201`, `:330`: rewritten.
- `CardLinks.svelte:24-26`: rewritten (the project "in a row of `categories:` carrying `archival`").
- Head comments rewritten: `cross-links.ts`, `CrossLinks.svelte`, `Disclosure.svelte`, `EntryCard.svelte`, `NoFundingCard.svelte` (with its prop doc), `RecordCard.svelte` (with its `projects` doc). Head comments extended by a paragraph: `bar.ts`, `map-bar.ts`, `Collection.svelte`, `FilterBar.svelte`, `PickMenu.svelte`.
- Doc comments in `cross-links.ts` rewritten: `CrossGroup`, `crossLinks`, `roleLinks`, `groupProjects`, the new `rowOrder`, `stripProjects`, `drawnProjects`, `membersOf`.
- Still true, unchanged: `ProjectCard.svelte:25` ("those the strip groups under none stay on" the Related line: the archival projects, case 23), `RadarCard.svelte:11` and `:154` ("the projects the strip groups under none": the archival ones), `src/lib/state/boards/collection/index.ts` (names no grouping), `cross-links.ts:26` and `:344` (a member and its stage order, unchanged).

## Judgment calls the brief left open

1. A strip whose projects are all of one hub stands in that hub's rows' order and words; a strip with projects of several hubs stands in the union order (`vocabOf()` with no hub), each project filed under its own hub's rows. A row a project's own hub holds and the union lacks stands after the ordered rows.
2. The group's label and colour come from the order's row (the hub's own for one hub, the union's for several).
3. The "other" group's words are `board.section_other`, the words a board's section uses; its key is the empty text, and in the bar the "other" value is `__none__` (`NONE`).
4. The strip items the Projects section counts are built by `board(mapPreset(...))`, the board's join of a project and its values, as the Map's bar does.
5. The four facet groups (Form, Tier, Role, Pillar) list their values from every strip project and count them under the other picks; Category and Stage do the same through their own builders.
6. A Projects group with no value is not drawn.
7. The No funding card's projects are counted in the Projects counts while its slice keeps the card; the No funding slice's count, and the card's own count tag, are of the projects the picks leave.
8. The Category group's heading is drawn in the unknown tone, grey (`namedTone('')`, `bar.ts:277`), as an entry field's group heading is (`bar.ts:463`), and its values' dots in their rows' tones; Stage keeps the Map's tones.
9. The section heading is a plain `<span>` above the first group of the run, with no ARIA role, since each group under it keeps its own `Command.Group` heading.
10. The Disclosure tone colours the count, the label and the marker, through its own custom property `--disclosure-tone`, so a `--tone` an enclosing card sets does not reach it.

## Visible changes, for the look at landing

- Every project strip at a card's foot (a funding card, a person's role strips, a project card's related strip, a Venues record card, the No funding card). Before: up to three groups, "in flight", "done", "ideas", each with a glyph in the muted colour. After: one group per row of `categories:` that holds a project, in the rows' order, then "other"; each group's count, label and marker in its row's colour, no glyph; "other" and a row with no colour in the muted colour. State: the Funding view of a hub with the default rows.
- The Archival card. Before and after: one group per dead stage with its glyph; unchanged.
- The Funding view's More. Before: the folded entry groups and the entry groups not on line 1. After: the same, then a rule, the heading PROJECTS and the groups Category (dots in the rows' colours), Stage, Form, Tier, Role (only with a self marked) and Pillar.
- The Funding view under Category "in flight". After: each card's strip holds only its in-flight projects; a scheme with none is hidden; line 2 reads "N of M shown"; the No funding card shows only its in-flight projects and its count, or is hidden when none is left; Clear all brings everything back. The same in List mode, the emptied rows hidden.
- A scheme's entry page opened while the Funding tab has a pick. After: the whole strip, unnarrowed.
- The People view under a Category pick. After: each role strip narrowed, a person with every role strip empty hidden.
- A view whose entries hold no project. After: no Projects section in More.
- The warning mark on a strip's group. Before: only the in-flight group carried it, for a blocked project at a `live` stage; a blocked project at `nascent` marked no group. After: any group holding a blocked project carries it: a blocked `nascent` project marks the idea group, a blocked `submitted` one the in-review group (case 4: `[in review 1 colour=#0ea5e9 WARN: blk-sub@submitted] ... | [idea 1 colour=#7c5cff WARN: blk-nas@nascent]`). State: a funding scheme whose blocked projects stand at those stages.
- The counts of the bar under a Projects pick. Before: no Projects pick existed, and the entry groups' counts, line 2's status slice counts and the No funding slice's count were taken over the entries the entry picks, the search and Mine only leave. After: with a Projects pick, the entry groups and the status slices count only the entries the pick leaves, and the No funding slice counts the projects no scheme covers that the pick leaves. Case 21: Funder `{nwo=3, fwo=1}` without a pick, `{nwo=2, fwo=0}` under Category "in flight". Case 9 on the same entries: status `[["active",3],["closed",1],["no-funding",1]]` after Clear all, `[["active",1],["closed",0],["no-funding",1]]` under Category "in flight". Case 24: the No funding slice's count is 0 under Category "idea". State: the Funding view, More, Projects, Category "in flight", then "idea".

## Anything in the brief that was wrong or impossible

- The paths list does not hold `src/lib/data/shapes/vocab-keys.ts`, and the step had to change it. `groupProjects` was the only caller of `wordNumber` outside its own file; once it no longer calls it, `wordNumber` is an unused export, which check 7 refuses. The change is `export function wordNumber(` to `function wordNumber(`; `grep -rn "wordNumber" src` now prints only `vocab-keys.ts:146` (the definition) and `:171` (its use inside the file).
- Found, not changed, outside the paths: `tests/checks/tree/allow-styling.ts:25`, `:29` and `:33` cite `CrossLinks.svelte:169` and `:163` for the `:global(.label)` and `:global(.tip)` rules; those rules were at `:187` and `:181` on the base copy and are at `:190` and `:184` now (`grep -n ":global(.label)\|:global(.tip)"` on both). The `line:` keys the check matches are unchanged and still match.
- Nothing else in the brief was wrong.

## Repair round 1

Every item of `.scratch/migration/agents/briefs/O96-round1.md` is done: items 1 to 4 changed what they name, and item 5 needed no change.

### Item 1 (T1): two comment paragraphs rewrapped at 100 columns

- `src/lib/state/boards/structure/cross-links.ts` lines 1-10, the head comment: rewrapped as one paragraph, every word kept; still 10 lines.
- `src/lib/views/shared/card/record/RecordCard.svelte` lines 18-27, the paragraph "The body draws, ...": rewrapped as one paragraph, every word kept; still 10 lines.

The rewrap ran as a word-for-word join and wrap at 100 columns (97 after `// `, 93 after `    // `), with an assert that the words before and after are the same. No other comment was changed.

### Item 2 (T2): the "other" group named

In `groupProjects`:

```ts
    const otherGroup = held.get('');
    const groups = [
        ...order.flatMap((row) => held.get(row.key) ?? []),
        ...[...held].flatMap(([key, group]) => (key === '' || listed(key) ? [] : [group])),
        ...(otherGroup === undefined ? [] : [otherGroup])
    ];
```

The case program's output on the changed tree is unchanged by items 1 to 3: `diff` of its `case` lines against the earlier run prints only the one line added for item 4 (`> case 9 Clear all   status counts [["active",3],["closed",1],["no-funding",1]]`).

### Item 3 (B1): no stage tag for a project with no stage

`src/lib/views/shared/links/CrossLinks.svelte`, in the members of a category's group:

```svelte
                            {#if group.stage === undefined && kind.stage !== ''}
                                <Tag label={kind.stage} />
```

Case 17 is extended into a drawn case: `groupProjects` on one project with no stage, then `CrossLinks.svelte` mounted in jsdom inside the page's tooltip group, its group opened by a click on the disclosure, then whether the members' kind holds a `.tag`. The command, from the worktree root: `npx vitest run --config <scratchpad>/caserun/strip.config.mts --root $PWD case17`.

Run on the tree before the change (the empty tag present):

```
 RUN  v4.1.11 /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O96
case 17 groups: other 1
case 17 kind data-project-kind="" stage tag drawn: true
case 17 tag markup: <span class="tag svelte-138vb85"> <span class="label svelte-138vb85"></span></span>
case 17 member buttons: nostage nostage
 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  21:12:20
   Duration  9.34s (transform 4.40s, setup 0ms, import 8.63s, tests 44ms, environment 591ms)
```

Run after the change:

```
 RUN  v4.1.11 /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O96
case 17 groups: other 1
case 17 kind data-project-kind="" stage tag drawn: false
case 17 member buttons: nostage nostage
 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  21:13:02
   Duration  15.48s (transform 8.82s, setup 0ms, import 14.44s, tests 101ms, environment 846ms)
```

The config (environment `jsdom`, the browser conditions, svelte inlined, as the `client` project resolves):

```ts
import base from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O96/vite.config.ts';

const SCRATCH = '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/caserun/dom';

export default async (env: { mode: string; command: string }) => {
    const made = await (base as unknown as (e: unknown) => Promise<Record<string, any>>)(env);
    const test = { ...made.test };
    delete test.projects;
    test.environment = 'jsdom';
    test.dir = SCRATCH;
    test.include = ['*.test.ts'];
    test.maxWorkers = 1;
    test.server = { deps: { inline: [/svelte/] } };
    return { ...made, resolve: { ...(made.resolve ?? {}), conditions: ['browser'] }, test };
};
```

The host (`Host.svelte`):

```svelte
<script lang="ts">
    import { setContext } from 'svelte';
    import TooltipGroup from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O96/src/lib/ui/menu/TooltipGroup.svelte';
    import CrossLinks from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O96/src/lib/views/shared/links/CrossLinks.svelte';
    import { STATE_KEY } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O96/src/lib/state/client/use.ts';
    import { TIP_KEY, createTipIds } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O96/src/lib/ui/menu/tip-ids.ts';
    import { createClientState } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O96/src/lib/state/client/context.ts';
    import type { CrossGroup } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O96/src/lib/state/boards/structure/cross-links.ts';

    let { groups }: { groups: CrossGroup[] } = $props();
    setContext(STATE_KEY, createClientState());
    setContext(TIP_KEY, createTipIds());
</script>

<TooltipGroup>
    <CrossLinks {groups} />
</TooltipGroup>
```

The case (`case17.test.ts`):

```ts
// Case 17 drawn: a project with no stage, grouped by groupProjects, drawn by CrossLinks.svelte (inside the
// page's tooltip group, Host.svelte) with its group opened; prints the members' markup and whether a stage tag is drawn.
import { flushSync, mount, unmount } from 'svelte';
import { expect, it } from 'vitest';
import { engineDir, glyphCatalog, loadConfig, textCatalog } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O96/src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O96/src/lib/state/shared/words/text.ts';
import { groupProjects } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O96/src/lib/state/boards/structure/cross-links.ts';
import Host from './Host.svelte';

const out: string[] = [];
const say = (line: string): void => void out.push(line);
const loaded = loadConfig(engineDir()).config;
setCatalog(textCatalog(loaded));
setGlyphs(glyphCatalog(loaded));

it('case 17 drawn', () => {
    const config = loaded as Record<string, unknown>;
    const project = { id: 'nostage', title: 'nostage', stage: '', form: '', chips: [], tier: 'research' } as any;
    const groups = groupProjects([project], config);
    const target = document.createElement('div');
    document.body.append(target);
    const view = mount(Host, { target, props: { groups } });
    flushSync();
    (target.querySelector('button.disclosure') as HTMLButtonElement).click();
    flushSync();
    const kinds = [...target.querySelectorAll('.kind')];
    say('case 17 groups: ' + groups.map((g) => g.category?.label + ' ' + g.count).join(', '));
    for (const kind of kinds) {
        say('case 17 kind data-project-kind="' + kind.getAttribute('data-project-kind') + '" stage tag drawn: ' + (kind.querySelector('.tag') !== null));
        const tag = kind.querySelector('.tag');
        if (tag !== null) say('case 17 tag markup: ' + tag.outerHTML.replace(/<!---->/g, ''));
    }
    say('case 17 member buttons: ' + [...target.querySelectorAll('.member')].map((m) => m.textContent?.trim()).join(', '));
    process.stdout.write(`${out.join('\n')}\n`);
    expect(target.querySelectorAll('.member').length).toBe(1);
    unmount(view);
});
```

Nothing of the three files is in the worktree.

### Item 4 (B2): visible changes added

Two entries were added to "Visible changes, for the look at landing" above: the warning mark on any group holding a blocked project, and the bar's counts under a Projects pick, each with its before, its after and the case lines that show it. The status counts after Clear all come from one line added to the case program (case 9), whose run printed `case 9 Clear all   status counts [["active",3],["closed",1],["no-funding",1]]`.

### Item 5 (S1)

No change: no whole-suite command ran in this round.

### Checks over the files this round changes

The files are `cross-links.ts`, `RecordCard.svelte`, `CrossLinks.svelte` and this report.

- Check 1, `npm run diagrams && npm run test:quick`, exit 0:

```
test:quick: 25 changed file(s), from git since HEAD
test:quick: 53 test file(s)
ok      ASCII gate (6.5 s)
ok      svelte-kit sync (6.5 s)
ok      prettier (6.5 s): All matched files use Prettier code style!
ok      svelte-check (78.8 s): 1793132128340 COMPLETED 551 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (103.4 s)
ok      vitest slow (143.6 s): Duration  135.05s (transform 28.22s, setup 0ms, import 96.90s, tests 240.19s, environment 4ms)
ok      vitest (146.0 s): Duration  137.74s (transform 103.29s, setup 0ms, import 186.33s, tests 184.82s, environment 2.69s)
ok      vitest checks (147.2 s): Duration  138.76s (transform 129.43s, setup 0ms, import 298.08s, tests 185.47s, environment 4ms)
test:quick: 154.7 s; every command passed
```

  The 25 changed files are the 23 of the step plus the two untracked files under `.scratch/` (this report and the round brief). `vitest slow`, red in the step's second run on the `hub-portfolio.test.ts` timeout, is green in this run (load average after it: 14.71).
- Check 2, the ASCII gate over the three files: printed nothing, `exit=0`.
- Check 3: `grep -rn "in-flight'\|'ideas'\|'done'" ...` printed nothing, `exit=1`; `grep -rn "xlink_" src config` printed nothing, `exit=1`.
- Check 4: `356 cross-links.ts`, `361 RecordCard.svelte`, `201 CrossLinks.svelte`.
- Check 7: `sh utils/unused-exports.sh` exit 0; `diff` with `O96-base/unused-exports.txt` printed nothing, `diff exit=0`.
- Check 8: the history-word grep over the added lines of the three files printed 6 lines: "told apart by" (`told`), three `new Set`/`new Map` code lines, and "the question before a delete" and "draws it before its groups" (places, not time). No history.
- Check 9: printed nothing, `exit=1`.
- The comment width: `awk 'length > 100'` over `cross-links.ts` and `RecordCard.svelte` prints only `RecordCard.svelte:308`, `:325` and `:329`, markup lines that stand at `:307`, `:324` and `:328` on the base copy at the same widths (139, 131, 127).
- The character-set scan of this report, `LC_ALL=C perl -ne 'print "$.:$_" if /[^\x20-\x7E\n]/' O96-report.md`: printed nothing.

