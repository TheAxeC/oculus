# D52 report: a page per collection entry, after repair round 1

Everything in the brief and in the nine items of repair round 1 is done, with two limits stated first. (1) The page was rendered by Svelte's server renderer reading a client store that was filled through a stubbed `fetch` (`tests/fixtures/client.ts`), not mounted in a browser or on Svelte's client DOM runtime, because the repository has no DOM library and its mini document (`tests/ui/tree/list/mini-dom.ts`) cannot carry the page; the look on TEST stays with the landing. (2) The two hand merges the brief does not send this round (`tests/checks/tree/allow-duplication.txt` and `education/education.yml` with main) are done at landing. No test was added or changed this round. The report file is written to `tools/oculus/.scratch/migration/agents/reviews/D52-report.md` in the worktree `/Users/axelfaes/workspace/research-hub/.agents/worktrees/D52`; paths below are relative to `tools/oculus` unless they start with a hub folder name.

## Open items of the state file

Copied from `tools/oculus/.scratch/migration/orchestrator-state.md` in the main checkout at the moment of writing (`sed -n 226,229p`). The section holds no item; its text is: "An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own."

## The nine items of round 1

### 1. Undo of records made before the keys

`valueNow` in `src/lib/server/edit/writes/undo.ts:167` answers `gone` when `namesOldIdentity(collection.held, change)` (`undo.ts:186`) says the record names its entry by a value that is not the entry's identity: for a `new-entry` or `delete-entry` record the identity field of the entry's fields (`change.after` or `change.before`) must hold `change.key`; for a `reorder` record a word that is no identity now but is a field value of an entry now is stale; a field write is already looked up by the identity field, so an old key finds nothing. Scratch run `$TMPDIR/d52r1/undo4.scratch.test.ts` (a vitest config extending the engine's `vite.config.ts`): the four records are made by the unchanged engine (`records.json`), each undone over a copy of the changed hub in the state after the same action (field write on FAIR, `removeEntry` of `investigation`, `createEntry` of `demo-task`, a reorder of `events`), and the file is compared before and after the undo.

Before this round (round-0 engine, `undo4-before.out`):

```
entry: record key "Flanders AI Research Program (FAIR)" undo answer {"error":"gone"}; file unchanged by the undo: true
delete-entry: record key "Investigation" undo answer {"error":"refused","refused":[{"field":"key","reason":"a new entry needs a key"}]}; file unchanged by the undo: true
new-entry: record key "Demo task" undo answer {"error":"moved"}; file unchanged by the undo: true
reorder: record key "events" undo answer {"error":"moved"}; file unchanged by the undo: true
```

After this round (run again at the end of the round, `R1_ENGINE` the worktree, output `undo4-after2.out`, `Test Files  1 passed (1)`):

```
entry: record key "Flanders AI Research Program (FAIR)" undo answer {"error":"gone"}; file unchanged by the undo: true
delete-entry: record key "Investigation" undo answer {"error":"gone"}; file unchanged by the undo: true
new-entry: record key "Demo task" undo answer {"error":"gone"}; file unchanged by the undo: true
reorder: record key "events" undo answer {"error":"gone"}; file unchanged by the undo: true
```

True scope, computed by reading the 14 files against the base copies (`python3`, the entries whose first-schema-field value in the base differs from the key they carry now):

```
funding/funding.yml 11 entries, identity changed: 11 of 11
network/events.yml 7 entries, identity changed: 7 of 7
education/education.yml 21 entries, identity changed: 21 of 21
applications/applications.yml 25 entries, identity changed: 25 of 25
tasks/tasks.yml 2 entries, identity changed: 2 of 2
registries/repos.yml 20 entries, identity changed: 10 of 20
registries/boilerplate.yml 2 entries, identity changed: 2 of 2
total 88 entries, 78 changed
```

Every History record made before the step on one of those 78 hub entries (all 11 funding entries among them, the three that already had a key included, since the base identity of `funding.yml` was its `title`) is refused with the `gone` sentence and writes nothing, for each of the four kinds. A record on one of the 10 `registries/repos.yml` entries whose title was already its key still undoes for a field write, a reorder is judged by its words, and a delete or new record on such an entry is also refused as `gone`, because the maps those records hold carry no `key` field (the entry's fields hold `title` and the identity field is `key`). That last refusal is the one case where the answer is wider than the rule; the entry is in the file and the record can be redone by hand.

### 2. Entry page block headings

Before (round-0 tree): the page drew Documents and Sessions with its own `.heading` (`Entry.svelte`: uppercase, accent colour, 0.04em letter spacing, margin `0 0 6px`) and Files with `FolderFiles.svelte`'s own `h3` (`margin: 0; font-size: var(--fs-xs); font-weight: 700; color: var(--muted-txt, var(--muted))`, from `.agents/worktrees/D52-round0/.../FolderFiles.svelte:99-104`), so Files looked unlike the other two.

After: `FolderFiles` takes `heading: Snippet` (`src/lib/views/shared/links/FolderFiles.svelte`), its own `h3` style is removed, and each page draws the heading in its own style. `Entry.svelte:218-220` passes `<h3 class="heading">{t('entry.files', folder)}</h3>`; `Entry.svelte:193` and `:225` are Documents and Sessions with the same class. The render of the page (item 8) prints the three as `<h3 class="heading svelte-l88dh">` with one scoped-style hash. `Person.svelte:193-195` passes `<h3>{t('person.folder', folder)}</h3>`, which `.block h3` of `Person.svelte:239` styles as before; the person page keeps its look. Not seen in a browser.

### 3. `task-card.ts` head comment

`src/lib/views/shared/forms/entry/task-card.ts:1-6` now reads "Layer 3, shared view helper. The one control the tasks collection's cards carry besides the shared ones: Start Agent ... The collection view (views/boards/collection/Collection.svelte) and the entry page (views/boards/entry/Entry.svelte) both draw a card with it, which is why the file is under views/shared/."

### 4. `docs/apps.md` examples

`docs/apps.md:819`: "2 entries in tasks; an entry is named by its key." `docs/apps.md:747`: `const body = { kind: 'new-entry', collection: COLLECTION, fields: { [identity]: id, title: id } };` and the sentence introducing it says the example writes that field and `title` into the task it creates, since the shipped `tasks` schema requires both `key` and `title`. The grep over `docs HELP.md README.md DESIGN.md ../../docs/DATA-MAP.md` for `first schema field|first field of|named by its title|by its title|keyed by title|[identity]|identity field` prints `apps.md:422`, `:512-514` (generic, about the collection's identity field), `:747`, `DATA-MAP.md:156`, `:194`, `:195`, `:454`; `DATA-MAP.md:156-195` was rewritten with the step (identity column `key`; `venues.yml` writes by `name`, the first field of its schema, which is still true), and `DATA-MAP.md:454` is the file-less rule ("`title` when the file has no schema"), which is true. No other example names a title as an entry's key.

### 5. Views not in the catalogue

`grep -rl "listed: false" src` prints 18 files: `MathPreview`, `Slides`, `Deposit`, `Editor`, `Entry`, `Person`, `Project`, `CustomizationView`, `Doc`, `MarkdownPreview`, `Document`, `File`, `Note`, `Diff`, `Merge`, `RefactorPreview`, `Source`, `Output`. `docs/views.md:257` (section "Views opened for something") says "Eighteen views are left out of the Views catalogue, because each is opened for something" and names each once with what opens it: eight opened for a thing of the hub (`project`, `person`, `entry`, `editor`, `deposit`, `doc`, `math-preview`, `refactor-preview`), three from a file (`source`, `file`, `document`), three opened for one thing (`note`, `slides`, `customization`, `docs/views.md:259`) and four opened from an action of another view (`repositories-diff`, `repositories-merge`, `markdown-preview`, `lsp-output`, `docs/views.md:261`), "That makes the eighteen: the eight, the three that open from a file, the three opened for one thing and these four." A loop of ``sed -n 257,261p docs/views.md | grep -o "`<name>` ("`` over the 18 names prints 1 for each. `HELP.md:156` reads "The views opened for something, or from a file, are not listed in the catalogue, and a view drawn from one file of the hub carries that file's own control; both are in the [Views guide](docs/views.md#views-opened-for-something)." and names no count.

### 6. `hub-names.ts` comment

`src/lib/data/helpers/hub-names.ts:95-97`: the `REGISTRY_SHAPES` comment says `idRequired` in this table, whatever a file's schema marks, is what makes an entry without its id a finding.

### 7. Helpers of `state/boards/collection.ts`

Reuse grep over the base tree (`grep -rn -E "namesOldIdentity|listsAsFolder|isFolderPath|pageFolder|pageState|parentFolder|function dirOf|function pick\b" D52-base/.../src tests`): the only hits are `change-tree.ts:48` `isFolderPath(path)` (a path ending in `/`), `change-tree.ts:111` `dirOf(path)` ("The folder a path sits in"), their users `repositories.svelte.ts:22,315`, `ChangeRow.svelte:31,149-150`, `ChangeGroups.svelte:35`, and unrelated `pick` functions of other views (`Project.svelte:97` among them, which `Entry.svelte`'s `pick` repeats because a view imports no other view's file; the duplication check passes). Done: `parentFolder` is gone and `listsAsFolder` (`collection.ts:326`) calls `dirOf` imported from `../sources/repositories/change-tree.ts` (`collection.ts:30`), `Entry.svelte:55,98` imports `dirOf` from the same file; `isFolderPath` of the step is renamed `listsAsFolder` because `change-tree.ts:48` already owns that name with another meaning; `FolderListing` is a local type (`collection.ts:318`, not exported). Importer greps over `src tests`: `listsAsFolder` is imported by `EntryCard.svelte:60` and called inside `collection.ts:342`; `pageFolder` by `EntryCard.svelte:63` and `Entry.svelte:52`; `pageState` by `Collection.svelte:86`; `namesOldIdentity` is local to `undo.ts` (`:167`, `:186`); `FolderListing` has no importer. `sh utils/unused-exports.sh` prints 364 lines and `diff` against `D52-base/tools/oculus/unused-exports.txt` prints nothing, so the step leaves no export without an importer.

### 8. Cases 9, 12 and the file-link branch of case 11, by a render of `Entry.svelte`

Scratch `$TMPDIR/d52r1/runrender/entry.scratch.test.ts` (outside the tree; run as `npx vitest run --config $TMPDIR/d52r1/runrender/vitest.config.ts --root $TMPDIR/d52r1/runrender`, `Test Files  1 passed (1)`). It builds `emptyClient()` from `tests/fixtures/client.ts`, hands it the engine's config and a portfolio with a `funding` collection of three entries (`alpha` linking `funding/alpha`, `beta` linking `funding/beta`, `gamma` linking the file `funding/gamma/plan.md`), stubs `window` so the file store asks, answers `fetch` through `stubFetch` with listings (`funding`: three folders; `alpha`: `README.md`, `notes.md`, `budget.xlsx`, `plan.pdf`; `beta`: nothing; `gamma`: `plan.md`) and two Markdown documents, lets them land with `settle()`, adds one session working in `/hubroot/funding/alpha`, and renders `Entry.svelte` through `svelte/server` with `clientContext(client)`. Blocks as drawn after the card (class hashes, tooltip wrappers and ids removed):

Case 9, `alpha`, a folder with Markdown and other files:

```
<section class="block"><h3 class="heading">Documents</h3>
  <div class="segment" role="radiogroup" aria-label="Documents">
    <button class="tool active" role="radio" aria-checked="true"><span class="label">README.md</span></button>
    <button class="tool" role="radio" aria-checked="false"><span class="label">notes.md</span></button></div>
  <div class="context"><div class="doc surfaced"><p>README body</p></div></div></section>
<section class="block"><div class="folder" data-folder="funding/alpha"><div class="head">
  <h3 class="heading">Files (funding/alpha)</h3>
  <button class="tool compact" aria-label="Show in Files"> ... tooltip "Open funding/alpha in a Files tab of its own"</div>
  <ul class="rows"> rows: README.md, notes.md, budget.xlsx, plan.pdf, each "Open <name> in a source tab" </ul></div></section>
<section class="block"><h3 class="heading">Sessions</h3>
  <div class="session"><button class="row-button" title="show this session in the other session views">
    <span class="tag">claude</span> <span class="nm">Draft the budget</span> ... opus-5</button></div></section>
```

With the tab's remembered document set to `notes.md` the segment marks `notes.md` active and the document shows `<p>NOTES body</p>`.

Case 12, `beta`, an empty folder:

```
<section class="block"><h3 class="heading">Documents</h3>
  <p class="empty">The folder holds no Markdown file.</p></section>
<section class="block"><div class="folder" data-folder="funding/beta"><div class="head">
  <h3 class="heading">Files (funding/beta)</h3> <button class="tool compact" aria-label="Show in Files"> ...
  <p class="empty">The folder holds no files.</p></div></section>
<section class="block"><h3 class="heading">Sessions</h3>
  <p class="empty">No session has worked in this folder.</p></section>
```

Case 11, `gamma`, whose `link` is a file. While the listing of the link's parent folder is being read, after the card:

```
<p class="empty">Reading the folder ...</p>
```

After the listing landed:

```
<p class="empty">This entry's link names no folder of the hub, so there are no documents, files or sessions to show.</p>
```

The card of `gamma` carries one action, `data-action="files:funding/gamma/plan.md"` ("Show in Files", tooltip "select funding/gamma/plan.md in the Files view"), where the cards of `alpha` and `beta` carry `files:funding/alpha` and `files:funding/beta` ("Open funding/alpha in a Files tab of its own"). What this render does not cover: the browser's layout and colours, a click, and Svelte's client DOM runtime. No test was added; `grep -n -i "entry page\|pageFolder" agents/guarded.md` finds no guarded entry for the page.

### 9. This report

The history-word grep, the extra paths, the opened-field change and the key writing are below.

History-word grep. The list is the one in `agents/spec.md:42`: before, used to, no longer, still, always has been, always had, as before, previously, the step adds, after this package lands. Run as a Python `difflib` pass over every line the step added or changed in the 33 changed files of `tools/oculus` outside the generated diagrams (against the base copy, the four moved files against their old place) and in the 14 hub and demo files (against the base copies): 1125 added lines, 2 hits.

```
docs/window.md: A view opened for something (a project, a person, a collection entry, a deposit, ...) never covers the tool views of the page it is ... [the words "still there" and "before it and is still open" are in the unchanged text of the paragraph; the step inserted "a collection entry"]
src/lib/server/edit/writes/undo.ts: change.kind === 'new-entry' ? change.after : change.before   [the field name `before` of a change record, code]
```

`grep -c "while that tab is still there" D52-base/tools/oculus/docs/window.md` prints 1 and `grep -c "shown before it and is still open"` prints 1. The hits the review named are rewritten: `normalise.ts:516` reads "is carried under its `title`", `Entry.svelte` reads "the one the tab remembers if the folder holds it, else the first", `undo.ts:177` reads "by a value that is not the entry's identity", and `docs/views.md:257` reads "a key the file does not hold says so, and an entry whose `link` names no folder keeps its card and says it has no folder". `sed -n 191p ../../docs/DATA-MAP.md | grep -o -i -E "before|used to|no longer|still|always|previously"` prints nothing.

Paths outside the brief's write list, each with its reason:

- `config/text/views/boards/person.yml`: the folder block's strings moved to the shared block's text file, and the page keeps `person.folder` for its heading.
- `config/text/views/shared/folder-files.yml` (new): the text group `folder_files` of `views/shared/links/FolderFiles.svelte`, drawn by the person page and the entry page.
- `config/text/views/boards/entry.yml` (new): the entry page's text.
- `tests/checks/config/config-folder.test.ts`: it lists the catalog files one per owner; the two new text files must be listed or the check fails (`reads one catalog file per owner and no legacy catalog file`).
- `tests/checks/tree/allow-styling.ts` and `tests/checks/tree/allow-duplication.txt`: they name the moved card files and the clone at `EntryCard.svelte` 130 and 218.
- `src/lib/views/shared/forms/entry/EntryLink.svelte` (new): the card's `link` and `url` controls (Show in Files, Open document, Open in Program), split from `EntryCard.svelte` so that the card is 486 lines against the 520-line component rule.
- `src/lib/views/shared/sessions/SessionRow.svelte` and `src/lib/views/shared/links/FolderFiles.svelte` (new): the session row and the folder block that the project page and the person page drew locally, and the entry page draws too; a view imports no other view's file.
- `docs/DATA-MAP.md` in the hub (line 191 bullet, and the identity lines 156-195, 454): the hub's data map names the identity of each collection and the entry page.
- This round's files: `docs/apps.md` (item 4), `docs/views.md` and `HELP.md` (item 5), `src/lib/views/shared/links/FolderFiles.svelte`, `Person.svelte` and `Entry.svelte` (item 2), `src/lib/server/edit/writes/undo.ts` (item 1), `src/lib/state/boards/collection.ts` and `EntryCard.svelte` (item 7), `src/lib/views/shared/forms/entry/task-card.ts` (item 3), `src/lib/data/helpers/hub-names.ts` (item 6).

Opened long fields. A card of the collection view draws its long body fields cut to their clamp and opened by a control; the open ones are kept in the view's instance state as entry ids (`Collection.svelte:313` `more={held.more.includes(entry.id)}`), and the id is the value of the file's first schema field (`normalise.ts:580` `ident = schema?.[0]?.field ?? 'title'`, `:553-560`). Before the step the id of 78 of the 88 hub entries was the title (the table in item 1, funding included); after it is the key. A collection tab saved before the step that held an opened card by its title therefore shows that card cut once again, for the 78 entries (67 entries of the six files, since 10 entries of `registries/repos.yml` already had their title as key, and all 11 funding entries: the brief names the funding entries that had no key, which are 8, but the 3 that had one also change identity because `funding.yml` listed `title` first in its schema). The same holds for `reveal` (`Entry.svelte` opens the collection with `reveal: entry.id`, `Collection.svelte:298`): a saved `reveal` naming an old title scrolls to nothing. Before: the card stays open across a reload. After: it is cut once, and opens again by its control, which stores the key.

Keys written by a script. The 85 key lines (88 entries less the three that had one), the 14 schema rows and the 14 head-comment sentences were written into the 14 files by `applykeys.py` (a scratch script outside the tree that, for each file, inserts `  - key: <value>` before an entry's `  - title:` line and re-indents that line to `    title:`, puts the key row first in `schema:`, moving and requiring the existing row of the two `funding.yml` files, and puts the head sentence after the leading comment block). The independent check is `$TMPDIR/d52r1/check14.py`, which does not share code with `applykeys.py`: it reads the base copy, computes each entry's key by the brief's rule (keep an existing key; the folder's name when `link` names a folder, the link normalised; else the title slug; `-2` on a clash; `entry-<n>` for an empty slug), compares them with the keys in the worktree's files, requires the schema's first row to be `key` with `required: true`, and requires every added line to be a key line, a re-indented `title:` line, the schema row or the head sentence and every removed line to be an entry's first line or the moved funding row. Run now:

```
MATCH hub funding/funding.yml entries=11 keys_equal_rule=True key_row_first_required=True added=18 removed=9 other_changed_lines=0 nonascii_added=0
MATCH hub network/events.yml entries=7 ... added=16 removed=7 other_changed_lines=0 nonascii_added=0
MATCH hub education/education.yml entries=21 ... added=44 removed=21 other_changed_lines=0 nonascii_added=0
MATCH hub applications/applications.yml entries=25 ... added=52 removed=25 other_changed_lines=0 nonascii_added=0
MATCH hub tasks/tasks.yml entries=2 ... added=6 removed=2 other_changed_lines=0 nonascii_added=0
MATCH hub registries/repos.yml entries=20 ... added=42 removed=20 other_changed_lines=0 nonascii_added=0
MATCH hub registries/boilerplate.yml entries=2 ... added=6 removed=2 other_changed_lines=0 nonascii_added=0
MATCH demo (the same seven files) entries=2,3,2,2,3,3,3 ... other_changed_lines=0 nonascii_added=0
differ files: 0
```

14 of 14 MATCH. No git command was run by this builder.

## The cases

Every case ran first on the unchanged tree. For the scratch runs the unchanged tree is a copy of the base under `$TMPDIR/d52r1/engine-base` (`node_modules` linked, `vite.config.ts` and `tsconfig.json` copied in) run over `hub-base-full`, a copy of the base files and the project manifests. No scratch file or link is in the worktree (`find` for scratch names under the worktree prints only the repository's own `.scratch`, `utils/scratch-count.sh`, `tests/fixtures/scratch.ts` and `src/lib/server/machine/hpc/scratch.ts`). No case's rule gave a wrong answer.

### First run, on the unchanged tree

Case 1, the key rule over the hub's seven files (`python3 keyrule.py <hub>`): equals the brief's quoted lists, and no key reads as anything but text. Output saved from that first run (`rule-hub.txt`; the rule is recomputed independently by `check14.py` in item 9, which compares it with the files on the tree):

```
funding: title nwo-veni-the-self-explaining-hospital | folder 2026-fwo-senior-transplant | title nwo-open-competition-domain-science-xs-enw-xs | kept FAIR | title pioneers-in-healthcare-pihc-innovation-fund | title erc-starting-grant-2027-submission | kept ZonMw-AI-HCC | kept FWO-PhD | folder 2025-fwo-project-fl4phm | folder 2025-fwo-postdoc-fermat | folder 2024-fwo-postdoc-fbttr
events: title aaai-2027 | title flta-2026 | title research-visit-linkoping-sweden | title graz-bci-conference-2026 | folder flta-2025 | folder fllm-2025 | folder inkendaal
tasks: title submission | title investigation
statements: title ai-use-general-coding-writing | title ai-use-experimental-code-experiments
```

(`education`, `applications` and `code` follow the rule in the same way: 21, 25 and 20 entries; their lists are the brief's.) The demo hub: funding `kept ecf | title open-data-infrastructure-grant`; events 3 title keys; education 2; applications 2; tasks 3; code 3; statements 3.

Cases 2, 3 and 19 (`node snap.ts <engine> <hub> all`, the snapshot's findings), base engine:

```
case 2 (base files): total findings 1
case 3 (ZonMw-AI-HCC key changed to FAIR): funding/funding.yml [entries[6].key] two entries share the key FAIR   total findings 7
case 19 (key: FAIR line removed): funding/funding.yml [entries[3]] funding entry Flanders AI Research Program (FAIR) is contributing and has no key   total findings 10
```

Case 4, a status write on a funding entry over a copy, base engine (`node write4.ts`):

```
id FAIR: [{"key":"Flanders AI Research Program (FAIR)","field":"status","before":"contributing","after":"awarded"}] found true refused []  line counts 159 159  68: -    status: contributing  68: +    status: awarded
id "NWO Veni - The Self-Explaining Hospital": [{"key":"NWO Veni - The Self-Explaining Hospital","field":"status","before":"submitted","after":"awarded"}] found true refused []  line counts 159 159  24: -    status: submitted  24: +    status: awarded
```

Case 5, the stub Add renders (`node stub5.ts`), base engine, funding, tasks, events:

```
caret line 160 column 13; text grew by 35 chars   - title: ""
caret line 36 column 13; text grew by 32 chars    - title: ""
caret line 111 column 13; text grew by 67 chars   - title: ""
```

Cases 6, 7, 8, 10, 15 (scratch vitest, `first.scratch.test.ts`, `Test Files  1 passed (1)`):

```
case 6: FAIR card id="FAIR" lists 8 projects ... every FAIR project is listed on the card: true
case 7/8: applications 2025-twente-cancer-ai -> hubPathsOf ["applications/archive/accepted/2025-twente-cancer-ai"] title is a button: no (EntryCard passes no ontitle)
case 7/8: funding nwo-veni (link a file) -> hubPathsOf ["funding/2026-nwo-veni-self-explaining-hospital/CALL-REQUIREMENTS.md"] title is a button: no (EntryCard passes no ontitle)
case 7/8: events aaai-2027 (no link) -> hubPathsOf [] title is a button: no (EntryCard passes no ontitle)
case 10: stateId same entry twice -> applications:a | applications:a equal=true
case 15: funding line "NWO Open Competition - Domain Science XS (ENW-XS)" target {"kind":"funding","id":"NWO Open Competition - Domain Science XS (ENW-XS)"}
case 15: funding line "FWO Senior Postdoctoral Fellowship 2026" target {"kind":"funding","id":"FWO Senior Postdoctoral Fellowship 2026"}
case 15: lines for events/education/tasks: events="FLTA 2026" ; ... ; tasks="Submission"
```

Case 17, a status write recorded and undone by the base engine over the same file (`undo.scratch.test.ts`):

```
record: {"key":"Flanders AI Research Program (FAIR)","field":"status","before":"contributing","after":"awarded","undo":"field"}
undo answer: {"found":true,"changed":["status"],"refused":[],"id":"FAIR","records":[ ... ]}
file unchanged by the undo: false
```

Cases 9, 11, 12, 14, 18: the unchanged tree has no `entry` view (`ls src/lib/views/boards` in the base has no `entry`). Case 13 on the unchanged tree, by reading: `relistFiles` (`src/lib/state/sources/fs.svelte.ts:361`) is called for every folder of the plan built at `:348`, and the watcher adds the parent folder of every event to the files channel, so a parent's listing is marked again when a child folder appears. Case 16 is the boundaries check below.

### After the change

Case 1: `check14.py` above, 14 of 14 MATCH. The Python read also holds every key non-empty text and unique in its file, 88 entries in the hub files and 18 in the demo files.

Cases 2, 3, 19, changed engine over the changed files:

```
case 2: total findings 1
case 3: funding/funding.yml [entries[6].key] two entries share the key FAIR   total findings 7
case 19: funding/funding.yml [entries[3]] entry has no string key
         funding/funding.yml [entries[3].key] key entries[3].key is required   total findings 11
```

Case 19 prints `entry_no_id` ("entry has no string key") and the schema's `required` finding, and neither `funding_no_identity` nor `funding_no_key`.

Case 4, changed engine:

```
id FAIR: [{"key":"FAIR","field":"status","before":"contributing","after":"awarded"}] found true refused []  line counts 168 168  72: -    status: contributing  72: +    status: awarded
id nwo-veni-the-self-explaining-hospital: [{"key":"nwo-veni-the-self-explaining-hospital","field":"status","before":"submitted","after":"awarded"}] found true refused []  line counts 168 168  26: -    status: submitted  26: +    status: awarded
```

Case 5, changed engine:

```
caret line 169 column 11; text grew by 47 chars   - key: ""  /  title: ""
caret line 40 column 11; text grew by 44 chars    - key: ""  /  title: ""
caret line 120 column 11; text grew by 79 chars   - key: ""  /  title: ""
```

Cases 6, 7, 10, 12, 13, 15 (`after.scratch.test.ts`, engine the worktree, hub the worktree, `Test Files  1 passed (1)`; the page-side expressions are the functions the card and the page call):

```
case 6: FAIR card id="FAIR" lists 8 projects; manifests naming FAIR 8; all listed true
case 7: applications 2025-twente-cancer-ai key=2025-twente-cancer-ai pageFolder="applications/archive/accepted/2025-twente-cancer-ai"
case 7: funding nwo-veni (link a file) key=nwo-veni-the-self-explaining-hospital pageFolder=undefined
case 7: events aaai-2027 (no link) pageFolder=undefined
case 7: education bioinformatics key=bioinformatics pageFolder="education/courses/bioinformatics"
case 7: link "missing/nowhere" | "../outside/folder" | "https://example.org/a" | "/abs/path": pageFolder=undefined
case 7: link "applications/archive/accepted/2025-twente-cancer-ai/" pageFolder="applications/archive/accepted/2025-twente-cancer-ai"
case 10: pageState={"id":"applications:2025-twente-cancer-ai","collection":"applications","key":"2025-twente-cancer-ai","label":"Twente, Cancer AI"}
case 10: same entry twice equal=true; two entries differ=true; one key in two collections differ=true
case 13: before pageFolder=undefined
case 13: after pageFolder="applications/zz-new-entry-folder"
case 12: no md -> []; empty -> []; two md -> ["b.md","a.MD"]
case 15: funding line "NWO Open Competition - Domain Science XS (ENW-XS)" target {"kind":"funding","id":"nwo-open-competition-domain-science-xs-enw-xs"}
case 15: funding line "FWO Senior Postdoctoral Fellowship 2026" target {"kind":"funding","id":"2026-fwo-senior-transplant"}
case 15: entry targets events="flta-2026" ; events="research-visit-linkoping-sweden" ; education="thesis-topic-master-of-statistics-and-data-science" ; ... ; tasks="submission"
```

Case 17 after: the record is the one the unchanged tree makes, undone by the changed engine over the changed funding file: `undo answer: {"error":"gone"}`, `file unchanged by the undo: true`; the four kinds are item 1.

Cases 9, 11, 12 (the blocks) and the file-link branch: item 8. Cases read from the source:

- Case 7, the title as a button: `EntryCard.svelte` passes `ontitle={hasPage ? onpage : undefined}` to `Card`, with `hasPage = pageFolder(entry.fields, listed) !== undefined` (`EntryCard.svelte:171`); `Collection.svelte:315` passes `onpage={() => openView('entry', pageState(key, entry))}`.
- Case 8, Show in Files: `EntryCard.svelte` builds one control per hub path of `link`, `url` or `folder`, calling `showFolderInFiles(path)` when `listsAsFolder(path, listed)` (`:180`) and `showInFiles(path)` otherwise.
- Case 14: the disabled controls come from `blockedBy(file, unsavedFile(...), fault)` in `EntryCard.svelte`, the code the collection view runs, with the same `file` prop (`viewSourceFile('collection', configMap(), collection)`).
- Case 16: `tests/checks/tree/boundaries.test.ts` passes (below); `Entry.svelte` imports no file of `views/boards/collection/`, `project/` or `person/`.
- Case 18: `entry.none` at `Entry.svelte` (the `collectionKey === '' || key === ''` branch).

## DONE / NOT DONE

| Check | State | Output as printed |
|---|---|---|
| 1. `npm run diagrams && npm run test:quick` | DONE | diagrams exit 0; `test:quick: 53 changed file(s), from git since HEAD`; `test:quick: 78 test file(s), 10 essential`; `ok      ASCII gate (0.9 s)`; `ok      prettier (1.6 s): All matched files use Prettier code style!`; `ok      svelte-check (17.9 s): 1791561376495 COMPLETED 445 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`; `ok      eslint (37.2 s)`; `ok      vitest (48.6 s): Duration  40.84s (transform 60.51s, setup 0ms, import 96.57s, tests 60.24s, environment 635ms)`; `test:quick: 49.6 s (limit 45.0 s); every command passed`; `test:quick: over the time limit` |
| 2. the 12-file set | DONE | with `--testTimeout 0 --hookTimeout 0` (the flags of `npm run test:checks`): ` Test Files  12 passed (12)` and `      Tests  171 passed (171)`. With the default 5000 ms timeouts two cases (`config-folder.test.ts` "passes every config file through the schema it is matched to", `keys.test.ts` "reads every findingText key ...") ran out of time at a load average of 21; the same files pass with the flags |
| 2. `npx vitest run tests/checks --testTimeout 0 --hookTimeout 0` | DONE | ` Test Files  17 passed (17)` and `      Tests  248 passed (248)` |
| 3. scratch runs on the unchanged tree and after | DONE | above; no scratch file or link in the worktree |
| 4. changed tests on the unchanged tree and after | DONE | three files changed in the step, none this round: `tests/checks/config/config-folder.test.ts`, `tests/checks/tree/allow-styling.ts`, `tests/checks/tree/allow-duplication.txt`. In a copy of the base tree with the three copied in: ` Test Files  3 failed (3)` and `      Tests  5 failed \| 48 passed \| 1 skipped (54)` (`reads one catalog file per owner and no legacy catalog file`, `lets no view or shell component style a primitive own class`, `holds the styling lists to rules the tree still has`, `is not held anywhere under src/lib`, `holds the lists to clones that are still shared, so a repaired copy takes its entry with it`). After the change the same files pass inside the 12-file run and the `tests/checks` run |
| 5. YAML parse of the 14 files | DONE | `yaml ok 14`, exit 0 |
| 5. ASCII gate (`perl` form of `agents/spec.md`) | DONE | prints nothing over `src tests config`; `bfs: error: bin: No such file or directory.` because this tree has no `bin` folder; exit 0 |
| 5. non-ASCII in added lines of the 14 files | DONE | `nonascii_added=0` in all 14 lines of `check14.py`, counting only lines that are not an existing title line re-indented under its new key line; the two files with accented real names (`Linköping`, `Umeå`) keep those bytes |
| 6. prose read against `agents/spec.md` | DONE | the history-word grep above; added comments, text and docs use plain prose, no dashes, one line per paragraph |
| 7. `sh utils/folder-check.sh` | DONE | exit 0 |
| 7. `sh utils/unused-exports.sh` | DONE | 364 lines; `diff` against `D52-base/tools/oculus/unused-exports.txt` prints nothing; the step added no line |
| 7. `wc -l` of every changed file | DONE | below |
| `npx prettier --check`, `npx eslint`, `npx svelte-check` over the files of this round | DONE | `All matched files use Prettier code style!`; eslint no output; `COMPLETED 445 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` inside `test:quick` |
| comment width | DONE | `tests/checks/source/comment-width.test.ts` passes in the `tests/checks` run |

NOT DONE: nothing of the nine items of round 1 or of "What to build" 1 to 9. Not run: the page on TEST in a browser (landing look), the hand merges of `tests/checks/tree/allow-duplication.txt` and `education/education.yml` with main (done at landing, not sent this round).

## The terms

No glossary: `ls docs` has no `glossary.md`.

## The files, with line counts (`wc -l`)

Changed or new under `tools/oculus`:

```
  188 HELP.md
  236 config/text/findings.yml
   23 config/text/views/boards/entry.yml                   (new)
   27 config/text/views/boards/person.yml
   10 config/text/views/shared/folder-files.yml            (new)
  861 docs/apps.md
  150 docs/files-and-search.md
  285 docs/views.md
   82 docs/window.md
  118 src/lib/data/helpers/hub-names.ts
  809 src/lib/data/snapshot/normalise.ts
  406 src/lib/data/snapshot/validate.ts
  623 src/lib/server/content/docs.ts
  442 src/lib/server/edit/writes/undo.ts
  149 src/lib/server/files/fs/collections.ts
  776 src/lib/state/boards/collection.ts
  317 src/lib/state/system/docs.svelte.ts
  408 src/lib/views/boards/collection/Collection.svelte
  269 src/lib/views/boards/entry/Entry.svelte               (new)
  280 src/lib/views/boards/person/Person.svelte
  221 src/lib/views/boards/project/Project.svelte
  295 src/lib/views/shared/forms/Subtasks.svelte
  486 src/lib/views/shared/forms/entry/EntryCard.svelte      (moved)
   80 src/lib/views/shared/forms/entry/EntryLink.svelte      (new)
   38 src/lib/views/shared/forms/entry/Grip.svelte           (moved)
   86 src/lib/views/shared/forms/entry/entry-actions.ts      (moved)
   41 src/lib/views/shared/forms/entry/task-card.ts          (moved)
  131 src/lib/views/shared/links/FolderFiles.svelte          (new)
   89 src/lib/views/shared/sessions/SessionRow.svelte        (new)
  631 tests/checks/config/config-folder.test.ts
   33 tests/checks/tree/allow-duplication.txt
  103 tests/checks/tree/allow-styling.ts
```

Also changed: `docs/diagrams/` `channels`, `layer-state`, `layer-views`, `layers`, `writes` (`.dot` and `.svg`, regenerated by `npm run diagrams`), and `../../docs/DATA-MAP.md` (519 lines). Hub data: `funding/funding.yml` 167, `network/events.yml` 118, `education/education.yml` 266, `applications/applications.yml` 437, `tasks/tasks.yml` 39, `registries/repos.yml` 226, `registries/boilerplate.yml` 31. Demo (`tools/oculus/demo/`): `funding/funding.yml` 34, `network/events.yml` 45, `education/education.yml` 20, `applications/applications.yml` 21, `tasks/tasks.yml` 34, `registries/repos.yml` 52, `registries/boilerplate.yml` 31. The old copies `EntryCard.svelte`, `Grip.svelte`, `entry-actions.ts` and `task-card.ts` under `views/boards/collection/` no longer exist (moved).

## "What is on the tree": still true or rewritten

- The survey of the collection files: rewritten. All seven files carry a key on every entry (88 in the hub, 18 in the demo) and each file's schema opens with `{ field: key, type: text, required: true, help: ... }`.
- The identity paragraph (`identityField`, `identityFieldOf`, `identityFindings`, an entry's `id`): still true; the comments naming it are rewritten (`state/boards/collection.ts` `identityValue`, `server/files/fs/collections.ts` head comment and `identityOf`, the `validate.ts` comments), and `identityFindings` takes no `exempt` argument.
- The manifests name funding by key with `idRequired: false`: rewritten. `idRequired` is true for funding (`data/helpers/hub-names.ts`) and the comment of `REGISTRY_SHAPES` says what the table decides.
- `docs/DATA-MAP.md` lines 156, 191 and 194: rewritten (the schema block that opens every file, the entry page bullet, and the line saying funding writes and links by `key` and every funding entry carries one).
- Funding's identity in code: rewritten. `checkFundingIdentity`, `funding_no_identity`, `funding_no_key`, the keyless branch of `checkEntryIdentity` and the two sentences of `findings.yml` are removed; `checkFundingStatements` keeps its `funding_no_statement` rule.
- `funding/funding.yml:18` and the demo's `:13` declaring `key` after `title`: rewritten. The row is first and required in both, its help kept.
- Four live entries link a file inside a folder: still true (case 7 shows the Veni link is a file).
- The entry writes and their test, and the undo finding the entry by the value the record holds: still true; a record that names an entry by a value that is not its identity is refused with `gone` (item 1).
- `task-card.ts` handed to `EntryCard` as `extra`; the project page's session row; the person page's folder block: rewritten. `task-card.ts` moved with the card; the session row is `views/shared/sessions/SessionRow.svelte`; the folder block is `views/shared/links/FolderFiles.svelte`. `Project.svelte` is 221 lines (285 at the base) and `Person.svelte` 280 (346).
- `docs/files-and-search.md:39`, `docs.svelte.ts` (`hubDocument`'s comment) and `docs.ts:451-456`: rewritten to name the entry page's folder.
- The collection view's instance state keeps entry ids in `more` and `reveal`: still true; the stored ids of the 78 entries whose identity changed no longer match (visible changes).
- The demo hub holds the seven files with no links: still true.
- `EntryCard.svelte`, `entry-actions.ts`, `Grip.svelte`: rewritten; they live under `views/shared/forms/entry/`, `EntryCard.svelte` is 486 lines, and the link block is the new `EntryLink.svelte`.
- `ProjectCard.svelte:163-170` and its title opening the project page: still true, unchanged.
- `docs.hubDocument` and `renderHubDoc`: still true, their comments extended to name the entry page.
- The file store's `listing` and `relistFiles`: still true.
- The view glob and `stateId`: still true.
- The boundary paragraph (`allow-styling.ts`, `allow-duplication.txt`): rewritten; the entries of both lists name the new path.
- The docs paragraph (`docs/views.md`, `HELP.md:156`, `docs/window.md:41`): rewritten, `docs/views.md:257-261` names all 18 views opened for something.
- Folder sizes: rewritten; `ls | wc -l` gives `views/boards` 9, `views/shared/forms` 10, `views/shared/links` 9, `views/shared/sessions` 7, `config/text/views/boards` 9, `config/text/views/shared` 3 (`sh utils/folder-check.sh` exit 0).
- Each collection file's head comment: rewritten, one sentence added after the leading block in each of the 14 files.

## Judgment calls

- The three keys that already existed (`FAIR`, `ZonMw-AI-HCC`, `FWO-PhD`) stay on the lines they were on, after the fields above them, with their trailing comments; the other 85 keys are the first line of their entry. Moving the three would rewrite their entries and comments.
- Help text of the new key rows: "The <noun>'s short name, unique in this file; a write and Edit in File address the entry by it." for the six files; funding keeps its existing help text on the moved row.
- Head-comment sentence: "Each entry has a `key`, its short name, unique in this file; a write and Edit in File address the entry by it." in six files, and in funding "Each entry has a `key`, unique in this file, which a new entry needs; a manifest's `funding:` tag names it."
- The page's view label is "Entry", its glyph `cards` (a key of `config/catalogs/glyphs.yml`), the empty-state glyph `folder`.
- The page's toolbar button is "Show in <collection title>" and opens the collection view with `reveal` set to the entry, the state key the collection view already reads.
- The page draws Start Agent through `taskCardActions`, so the card is the collection view's card; no `tasks` entry has a `link`, so it is not reachable today.
- Binary files in the Files block are rows like any other, as on the person page; the row opens the source tab, which says what it is.
- `FolderFiles.svelte` carries the person page's former folder block text under the group `folder_files`; the person page keeps `person.folder` for its heading.
- The `allow-styling.ts` reasons and the `Collection.svelte` one quote the selector line as it is now.
- The `allow-duplication.txt` entry for the 10-line `said` block is `src/lib/views/boards/focus/lanes/Lanes.svelte src/lib/views/shared/forms/entry/EntryCard.svelte f494adcc1949 the same 10 lines at 130 and 218, to fold into one place`; the hash and the lines differ from the base entry because the lines before the block in `EntryCard.svelte` differ after the move. It is the same function body and the list is not widened.
- `config-folder.test.ts` lists the two new catalog files.
- Item 1's refusal rule compares a record's identity with the entry's fields, which refuses the old delete and new records of the entries whose title equals their key as well (item 1, scope); a record on such an entry can be redone by hand.
- The render of item 8 uses the server renderer over a client store, because the repository's client project has no DOM library and the mini document of `tests/ui/tree/list/mini-dom.ts` supports only the virtual list.

## Visible changes, before and after

- A card of `funding`, `events`, `education`, `applications`, `tasks`, `code` and `statements` draws a `key` row. Before: no such row (joint-work already draws its own).
- A card whose `link` names an existing folder of the hub has a title that is a button and opens the entry page. Before: a plain title.
- Show in Files on such a card opens a Files tab rooted at the folder. Before: the Files tab selected the folder. On a file link it is unchanged.
- The person page's Show in Files tooltip reads "Open {0} in a Files tab of its own". Before: "Select {0} in the Files view".
- The entry page's three block headings (Documents, Files, Sessions) are one style, the uppercase accent `.heading`. Before (round 0): Files had the muted heading of the folder block, which is not uppercase and has no accent colour.
- Snapshot ids of the 78 hub entries whose identity was their title (all 11 funding entries, 67 of the others) are now their keys. Before: their titles. The Focus ticker's funding targets, the History records of new writes and the collection view's remembered `more` and `reveal` ids follow (case 15 after).
- A card whose long fields the reader had opened shows them cut once again for those 78 entries (item 9, opened long fields); a saved `reveal` for an old title scrolls to nothing.
- The undo of any History record made before the step on one of those 78 entries (field write, delete, new entry, reorder) is refused with `gone` and writes nothing (item 1). Before the round: the field write was refused with `gone`, the delete with "a new entry needs a key", and the new-entry and reorder records with `moved`.
- A funding entry with no key: `entry has no string key` and `key entries[3].key is required` (case 19). Before: `funding entry Flanders AI Research Program (FAIR) is contributing and has no key` (case 19, first run).
- Add on the seven files starts the new entry with `- key: ""` and the caret inside it (column 11). Before: `- title: ""` (column 13).
- `docs/views.md`, `HELP.md`, `docs/window.md`, `docs/files-and-search.md`, `docs/apps.md`, `docs/DATA-MAP.md` and the diagrams under `docs/diagrams/` are updated as above.

## Anything in the brief that was wrong or impossible

- The line numbers the brief quotes for the `allow-styling.ts` reasons (411, 418, 422) were not the selector lines of the base `EntryCard.svelte` (422, 429, 433), so those reasons were already off by 11 lines; they now quote the real lines.
- The round-1 brief says the cards that lose their opened state are those of "the six files that had no key and the funding entries that had none". The base identity of every entry of those files, funding included, was its `title` (`funding.yml` listed `title` first and `key` later), so the entries that change identity are 78: all 11 funding entries and 67 of the other 77; ten `registries/repos.yml` entries already had their key as their title.
- A "client-runtime render" is not available for the page: the repository's `client` vitest project runs Svelte's client build with no DOM library, and the one mini document supports `VirtualRows` only (item 8).
