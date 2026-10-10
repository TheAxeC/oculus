# Step D55 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/D55, base ecbc37a0c)

Short version: two items are violated (3 and 4), and case 13 is partial. All the verification commands pass, and every scratch script the builder quotes gives the same output when I rerun it. The defects below are the ones the tests and the case runs do not reach.

## Verification (rerun by the reviewer)

```
# Brief verify 1. npm run diagrams was not run, because it writes files. I ran the read-only staleness test in its place.
npx vitest run tests/checks/diagrams --testTimeout 0 --hookTimeout 0 -t "each file byte for byte"
  ✓ ... are what the source gives now, each file byte for byte 138237ms
  Tests  1 passed | 45 skipped (46)
npm run test:quick
  ok ASCII gate (0.6 s)
  ok prettier (2.1 s): All matched files use Prettier code style!
  ok svelte-kit sync (2.3 s)
  ok eslint (2.0 s)
  ok svelte-check (5.7 s): 1791602858777 COMPLETED 455 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
  ok vitest (30.2 s): Duration 26.29s (transform 25.23s, setup 0ms, import 43.22s, tests 58.53s, environment 383ms)
  test:quick: 30.9 s (limit 45.0 s); every command passed

# Brief verify 2
npx vitest run tests/server/edit tests/routes/edit tests/server/core/changes.test.ts tests/server/files tests/data tests/checks/config tests/checks/tree tests/checks/imports tests/checks/source --testTimeout 300000
  Test Files  66 passed (66)
  Tests  572 passed | 1 skipped (573)

# The new and changed slow test files, run alone (HOME under $TMPDIR)
npx vitest run tests/routes/hubs tests/server/git/deposit.test.ts tests/data/hubs tests/routes/edit/undo/undo.test.ts --testTimeout 300000
  Test Files  6 passed (6)
  Tests  60 passed (60)
  per file: hub-portfolio 6, hub-roots 6, undo 20, hub-secrets 7, hub-writes 19, deposit 2
  (hub-writes 19 + hub-secrets 7 + deposit 2 = 28, the report's "Tests 28 passed (28)")

# The report's scratch scripts on the changed tree, HOME=$TMPDIR/d55rev-home, Node v24.21.0 first on PATH
node $TMPDIR/d55/after-run.ts   exit 0
node $TMPDIR/d55/cases2.ts      exit 0
node $TMPDIR/d55/case12a.ts     exit 0
node $TMPDIR/d55/case6d.ts      exit 0
diff of each output against the builder's saved after-run.out, cases2-after.out, case12a-after.out and case6d-after.out, with the temp-folder names masked: no difference in any of the four
  e.g. case 16 two hubs: [[null,"projects/active/graph-bandits","`next`",...,"b99db6bdbe2e"],["lab","lab:projects/active/graph-bandits","`next`",...,"871e5675cbcf"]]
  e.g. case 6d: undo of the remove of the hub root 200 [ 'lab(hub)', 'other' ]
  e.g. case 19d: undo of the earlier write {"status":404,"body":{"error":"outside"}}; the copy file still holds the line: true

# Brief verify 6
sh utils/folder-check.sh                -> exit 0
sh utils/unused-exports.sh (worktree)   -> 365 lines, exit 0
sh utils/unused-exports.sh (D55-base)   -> 365 finding lines plus knip's error lines; exit 2 (no .svelte-kit/tsconfig.json in the base copy)
diff base vs worktree:
  < src/lib/data/snapshot/normalise-personal.ts: UNKNOWN_STATUS, sideProject
  > src/lib/data/snapshot/normalise-parts/personal.ts: UNKNOWN_STATUS, sideProject
  < src/lib/data/model/index.ts: Entities, Chip, ...   > src/lib/data/model/index.ts: Chip, ...
  < src/lib/data/snapshot/normalise-personal.ts: ProblemWord, Problem, ReadSideProject
  > src/lib/data/snapshot/normalise-parts/personal.ts: ProblemWord, Problem, ReadSideProject
  (the step adds no unused export)
wc -l of the changed files at or near a limit (880 for a source file, 520 for a component):
  880 server/git/deposit.ts   879 state/client/context.ts   871 server/root/context.ts   868 server/edit/yaml/yaml-edit.ts
  518 views/shared/forms/entry/EntryCard.svelte   509 views/shared/card/ProjectCard.svelte
  (none is over; I read the diffs of deposit.ts and state/client/context.ts, and neither is compacted)

# ASCII gate of spec.md, from tools/oculus in the worktree
LC_ALL=C perl -ne '...' $(find src tests bin config -type f ! -name local.yml)  -> no output
git diff ecbc37a0c -U0 of DESIGN.md, HELP.md, docs/*.md and docs/DATA-MAP.md, added lines, grepped for '[^ -~]' -> no output

# Comment width and history words in added comments and test titles
added comment lines over 100 columns: none
short line inside a sentence (heuristic over the diff and the new files): 1 hit, portfolio.ts watchLayer (Standards 2)
history words (used to, no longer, previously, still, earlier, moved, ...): 4 hits, each describes behaviour and none is history

# Reviewer's own probe for case 13 (search over a folder named Secrets, on both trees)
node $TMPDIR/d55rev/names13.ts <worktree>   -> [["hub",["Secrets/x.yml","open.md"]],["lab",["Secrets/x.yml","open.md"]]]
node $TMPDIR/d55rev/names13.ts <D55-base>   -> [["hub",["Secrets/x.yml","open.md"]],["lab",["Secrets/x.yml","open.md"]]]
test -e <tmp>/hub/secrets/x.yml             -> case-insensitive: secrets/x.yml resolves to Secrets/x.yml
```

## Verdicts

Items of the brief's "What to build":

- 1: holds. Evidence: the 6 tests of hub-roots.test.ts; the case 4, 5, 6, 6a and 6b lines rerun; and case6d.ts rerun, where the undo of removing the hub root brings back `lab(hub)`. `itemShape` carries `hub: z.literal(true).optional()`.
- 2: holds. Evidence: case 7 rerun (`["lab:extra"]`, served roots `hub, engine, lab`, 0 findings), and 19a met under ruling 2 of D55-cases.md. Schemas and the reference index are built per hub (`scopedSchemas`, `graphOf(index, root)`).
- 3: violated. The references inside a second hub's collection entries are not prefixed, and the page resolves them against the first hub (Spec 1). Feed item ids are not checked for ambiguity (Spec 3).
- 4: violated. A second hub's venue opens its `link` path under the first hub (Spec 2).
- 5: holds. Evidence: case 16 rerun (first-hub signature `b99db6bdbe2e` unchanged, the second hub's is `871e5675cbcf`, 0 publication findings for the second hub), case 21 rerun, and case 15 rerun.
- 6: holds. Evidence: the 19 tests of hub-writes.test.ts, the second-hub deposit test, and the case 8, 9, 10, 19b and 19d lines rerun. Under rulings 1 and 5 of D55-cases.md the manifest and feed-field routes keep their refusal, and the session override has no hub file.
- 7: holds. RootChip draws the chip on 10 views, and the Focus rows draw it through the `marked` snippet. Standards 3 covers the Focus rows' chip, which has no tooltip.
- 8: holds for the six callers that `git grep "privateFolders("` lists, each given every hub; paste is out under ruling 3. The page learns the hub roots from the workspaces answer (hub-secrets test). Letter case: see case 13.
- 9: holds. Evidence: the case 14 line `[["lab:side:x","lab"]]` and case 19f (side projects `[]` with `hub: true`).
- 10: holds. Evidence: the undo test "puts a deleted entry back with its subtasks, each as the file held it", the case 11 and 12 lines rerun, and case 12a as below.
- 11: holds. Evidence: case 19 rerun; the session in the second hub's project folder is filed under that project's folder.
- 12: holds. The HELP.md bullets, the DESIGN.md "Several hubs" bullet (last in the list) and the DATA-MAP.md "A second hub" section (before "Outside the hub") are in place. The rewrites of the sentences "What is on the tree" lists as made false are in place. Grepping the changed names finds no other sentence the change makes false.
- 13: holds. Each named G row has its tests. Proof 1 and Proof 2 cover the weak ones.

Cases:

- 1: met. Rerun counts are 22 projects, 11 with a `lab:` id and 11 with root `lab`; hub-portfolio test.
- 2: met. Rerun gives `["graph-bandits","lab:graph-bandits"] unique ids true`, the pairs `["lab:graph-bandits","lab:graphs"]`, and every count doubled.
- 3: met for the manifest's `venue_id`: the rerun gives the first hub's unknown-venue finding on the second hub's file, and the test "resolves a reference of the second hub in the second hub only" covers it. Spec 1 is a crossing on the page that this case does not exercise.
- 4: met (rerun).
- 5: met (rerun).
- 6: met (rerun).
- 6a: met (rerun).
- 6b: met (rerun; the finding text is the existing one).
- 6c: met for the record kinds `ambiguousIds` scans (rerun). Feed items are not scanned (Spec 3).
- 6d: met (case6d.ts rerun; all four steps keep `lab(hub)`).
- 7: met (rerun).
- 8: met (rerun: `labChanged` only, logged by its absolute path, undo 200).
- 9: met (rerun gives 404 with the route's existing sentence).
- 10: met (rerun: only the first hub's `/tasks/tasks.yml` changes).
- 11: met (rerun and the undo test).
- 12: met (rerun; the refusal names "list of maps of scalars").
- 12a: met under ruling 1 of D55-cases.md. `setFields` writes and re-reads the list. `lead-add` over a metalist field writes `- { do: x, done: true, n: 2 }`. The manifest route refuses with "a map field is not written by the form", and the feed-field body stays scalar.
- 13: partial. The relay (`machine-file.ts`), the library rules and the folder Fix All compare paths through `under`, which resolves the operating system's own letter case. The names search lists `Secrets/x.yml` of the second hub, and the page's `isPrivateFile` compares paths as plain strings, so neither withholds a folder spelled `Secrets` (Spec 4, Proof 2).
- 14: met (rerun).
- 15: met for the ids and writes. The rerun gives leads 8, radar 6; the lead field write changes only the second hub's file; LinkedIn posted with root lab returns 200 and changes the second hub's file. The chip is checked at the look.
- 16: met (rerun).
- 17: met for the open. The report's page-cases output gives `/api/file/lab/...` and the workbench opening under root `lab`. The chip is checked at the look.
- 18: met. In the report's page-cases output, a second-hub finding opens under root `lab` and a first-hub finding under `hub`.
- 19: met (rerun).
- 19a: met under ruling 2 of D55-cases.md. The rerun gives "Lab title changed", with the first hub's title unchanged.
- 19b: met (rerun; each of the four writes and its undo changes only the second hub's file).
- 19c: the base part is met by the deck tests. The unsaved-tab refusal is not verifiable here: `writtenFile` names `{root: lab, path}`, and only a page run of the refusal settles it, which is forbidden in this review.
- 19d: met for the snapshot (11 records to 0), the `404 outside` undo and the file left as it was. The tab's not-found state is not verifiable without a page run.
- 19e: met (rerun: `lab(hub)`, 22 projects).
- 19f: met for the snapshot (side projects `[]`). Focus is not run.
- 19g: met. The two app rows of hub-writes refuse `lab:` with 404. Without the `app !== null` check in `hubNamed` (hubs.ts:51) those rows would get 200, so they pin the rule.
- 19h: met for the tone (grey, from the report's run). The drawing is checked at the look.
- 20: met (rerun: no `root` field, the same counts).
- 21: met (rerun: `["FirstHostMarker"]`).

## 1. Spec

- `src/lib/data/snapshot/hubs/merge.ts:68-75` with `src/lib/views/shared/forms/entry/EntryCard.svelte:268-270` and `:380-382`. The merge prefixes only the ids of a collection and its entries:
  ```ts
  const entries = one.entries.map((entry: Entry) => ({ ...entry, id: put(entry.id), root: key }));
  ```
  The reference values inside the entry's fields stay bare, and EntryCard resolves them against the whole merged portfolio:
  ```svelte
  label={personName(portfolio(), drawn.values[0])}
  onclick={() => openPerson(drawn.values[0])}
  ```
  What is wrong: item 3 says every id inside a record is prefixed alike and that "a reference never crosses hubs". A second hub's entry field `person: alice` stays `alice`, and `personName` and `openView('person', { key })` find the first hub's `alice`.
  Failure scenario: both hubs are copies of `demo/`, and a task in the second hub names `person: alice`. Its card shows the first hub's Alice by name. Clicking the chip opens the first hub's person page. If the second hub's `alice` exists only there, the card shows the bare key and the person page opens empty, even though `lab:alice` is in the snapshot.
  Verdict: item 3 violated.

- `src/lib/views/sources/venues/VenueCard.svelte:91` `showInFiles(path);` and `:147` `href: hrefOf(linkPath ?? venue.link),`.
  What is wrong: item 4 says each hub-relative path opens under the record's `root`, Show in Files included. `showInFiles(path, root?)` (state/workbench/layout/open/show.ts:101) and `hrefOf(value, root = HUB_ROOT)` (state/boards/collection.ts:276) both default to the first hub, and VenueCard passes no root. RegistryCard, EntryCard, DatasetCard and ProjectCard do pass one.
  Failure scenario: a second-hub venue whose `link` is a hub path, such as `network/<event>/deck.html`. Show in Files reveals the first hub's file at that path, or nothing if there is none. The Site link fetches `/api/file/hub/...` instead of `/api/file/lab/...`.
  Verdict: item 4 violated.

- `src/lib/data/snapshot/hubs/merge.ts:230-262` (`ambiguousIds`) with `src/lib/state/feeds/idents.ts:27-29` and `src/lib/server/edit/writes/hubs.ts:46-53`. `ambiguousIds` scans projects, personal, collections, their entries and the registries, but not feed items. `feedWriteId` sends a first-hub lead's title unprefixed:
  ```ts
  return hubId(feedRoot(entry), name);
  ```
  `hubNamed` then splits on any `<key>:` prefix.
  What is wrong: item 3 lists feed items among the ids, and says "a first-hub id that begins with `<a hub root key>:` is a finding naming its file, so no merged id is ambiguous". A first-hub lead or Lit Watch entry titled `lab: <title>` gets no finding. Its write is routed to the second hub.
  Failure scenario: hub root `lab`, and a first-hub position lead titled `lab: Postdoc in graph learning`. Changing its status sends `id: "lab: Postdoc in graph learning"`. The server routes it to the second hub, finds no such lead, and returns 404 with no finding to explain why. A delete of that lead fails the same way.
  Verdict: item 3 partial for feed items; case 6c met only for the kinds scanned.

- `src/lib/server/files/search.ts:561` and `src/lib/state/system/config/config-files.ts:35-37`.
  ```ts
  const folders = withheld.map((folder) => realPath(expandHome(folder)) ?? expandHome(folder));
  ```
  ```ts
  return privateFolders(hubDirs(first?.dir ?? null, roots), home).some((folder) => pathUnder(folder, absolute) !== null);
  ```
  What is wrong: case 13 asks that a mixed-case `Secrets/x.yml` of the second hub be withheld from search and from the page's `isPrivateFile`. The names search resolves the folder with the non-native `realPath`, which keeps the spelling `secrets`, so the ripgrep exclusion misses `Secrets`. `pathUnder` is a string-prefix compare. The relay, the library rules and Fix All use `under`, which compares against `realpathSync.native`, so they do fold letter case. The first hub has the same gap on the base (the D55-base run above), but the case states the expected result for the second hub's mixed-case file.
  Failure scenario: a second hub on APFS with its private folder named `Secrets`. The reviewer's probe lists `Secrets/x.yml` in the names answer for `lab` (and for `hub`). A search over that root shows the secret file's name, and the page treats the file as not private.
  Verdict: case 13 partial.

## 2. Proof

- `tests/routes/hubs/hub-writes.test.ts:249-262`. The title is 'answers a LinkedIn idea of the second hub as missing when the write names no root', but the body sends:
  ```ts
  request({ kind: 'linkedin-post', file: 'xx-nowhere.md', root: 'lab' })
  ```
  The `second` path is only asserted not to exist.
  What is wrong: the test names a root and a file that neither hub holds. It does not exercise "names no root". It would pass if `root` were ignored and the post went to the first hub, because the file is missing there too. The report lists it under G8 and G9 as the test of Z765 (b)'s "absent read as `hub`".
  Failure scenario: a later change drops the absent-root default, or routes an absent root to the second hub. This test stays green and the G row stays ticked.
  Verdict: none on its own; the behaviour is covered by the case 15 run.

- `tests/routes/hubs/hub-secrets.test.ts:116-118`.
  ```ts
  if (isPrivateForServer(join(lab, 'SECRETS', 's.yml'), served)) {
      expect(isPrivateForServer(join(lab, 'Secrets', 'deep', 'd.yml'), served)).toBe(true);
  }
  ```
  What is wrong: the mixed-case assertion is guarded by the very predicate under test. If case folding were taken out, the `if` would be false and the test would still pass. The report says case 13 is met by "seven tests, one per caller". No other of the seven uses a mixed-case folder, and the rerun shows the names search and the page do not fold letter case (Spec 4).
  Failure scenario: a reader of guarded.md G3 takes the mixed-case leak as covered, while search lists `Secrets/x.yml`.
  Verdict: case 13 partial (with Spec 4).

## 3. Standards

- `src/lib/views/shared/card/CardDocs.svelte:65-68`.
  ```svelte
  /** The key of the record this card keeps its tree and its finder text under. */
  /** The key of the hub the project is of. */
  const hub = $derived(rootOf(item.project));
  const owner = $derived(cardTreeKey(instance?.() ?? '', item.id));
  ```
  What is wrong: the new doc comment and `const hub` were inserted between the existing doc comment for `owner` and its const. That leaves two doc comments stacked and `owner` with none (spec.md, "a comment says what the code does").
  Failure scenario: an editor's hover on `owner` shows nothing, and a reader takes the "tree key" sentence to describe `hub`.

- `src/lib/server/root/watch/portfolio.ts`, the watchLayer doc comment (around line 432).
  ```
  * the portfolio alone, since the page's settings are the first hub's. A layer that is not there
  * is waited for through the nearest
  * folder that is, and a rebuild is queued only once the layer itself exists, so creating
  ```
  What is wrong: spec.md says a comment the step edits is rewrapped as a whole paragraph at 100 columns, so that no line inside a sentence ends short. This line ends at 37 characters in the middle of a sentence.
  Failure scenario: the next prettier or reader pass leaves the ragged paragraph in place.

- `src/lib/views/boards/focus/Tasks.svelte:74-76` and `src/lib/views/boards/focus/CommandCenterView.svelte:76-78`.
  ```svelte
  {#snippet marked(text: string)}
      <Chip label={text} />
  {/snippet}
  ```
  What is wrong: the views layer already has `RootChip.svelte`, which draws this chip inside its Tooltip with `t('hubs.root_tip', root)`. The two Focus snippets draw a bare Chip a second time, so the Focus rows carry no tooltip words. Every other surface item 7 names does (spec.md DRY: "a ... rule exists once and is reused"). The snippets live in views, so `<RootChip record={{ root: text }} />` is importable there.
  Failure scenario: hovering a Focus row's `lab` chip explains nothing, while the same chip on a card does. A change to the chip's look has to be made in three places.

- The builder's report, section "Anything in the brief that was wrong or impossible", says "One read-only `git -C . status` was run once, which the brief forbids". This is recorded as a breach of the brief's git rule. It changed nothing in the tree.

## 4. Behaviour

- `src/lib/views/boards/person/Person.svelte:63-64`.
  ```ts
  /** The first hub's people file; a person of another hub is edited in that hub's own file. */
  const source = $derived(hub === HUB_ROOT ? viewSourceFile('people', configMap()) : null);
  ```
  What is wrong: a person of the second hub gets no source (Edit in File) button on the person page. The comment says such a person "is edited in that hub's own file", but the page offers no way to open that file. The report's "Visible changes" table does not list this.
  Failure scenario: Axel opens `lab:alice` from a second-hub card, looks for the button the first hub's people have, finds none, and has to locate the second hub's `registries/people.yml` by hand in Files.

## Declined to judge

- The chip on cards, rows and pages, the Focus marks and the neutral tone of a second-hub domain (cases 15, 17, 19h) are left to the landing look. Starting the app or a browser is forbidden in this review.
- The unsaved-tab refusal of case 19c and the tab's not-found state of case 19d: only a page run settles them, and none was made.
- Whether the first hub's own mixed-case `Secrets` gap in search and on the page (present on the base) should be closed in this step or booked elsewhere is the orchestrator's call. I report it under case 13 because the case states the expected result.
- For its unchanged-tree runs the builder copied the real hub's data folders and `.oculus/` into `$TMPDIR/d55basetree`. `test -e` shows no `secrets` or `Secrets` folder and no `tools/oculus/config/local.yml` in that copy. Whether such a copy is allowed is the brief author's call.
- The report's assertion table gives "12 tests" for the base `undo.test.ts`. The base file has 11 `it(` calls, and its runs expand to 19 through `.each`. No decision rests on that count.

Reviewer usage: a1856be287746a96e, claude-opus-5-5, 196,464 tokens, 159 tool uses, 35.7 min.

## Repair round 1, refuted

Not closed by this round: item 3 for manifest writes of a second-hub project, item 4 for the registry cards of a second hub, item 6 for the page's naming of the file a second-hub entry write changes, item 12 for `docs/apps.md`, and the two hub-secrets tests that go red on a case-sensitive file system. Each is a finding below. The rest of the round holds, and every run of the round brief passes.

```
# Round brief: "npm run diagrams && npm run test:quick". I did not run npm run diagrams, because main() writes files whatever the state. I ran the read-only staleness check in its place:
node -e "import('./utils/diagrams/diagrams.mjs').then(async m => {... m.staleFiles(process.cwd()) ...})"
stale diagram files: []

# npm run test:quick, run 1 (load average 2.72 / 3.21 / 3.93 before, 4.20 after)
ok ASCII gate (1.4 s)
ok prettier (2.7 s)
ok svelte-kit sync (7.7 s)
ok eslint (17.0 s)
ok svelte-check (22.7 s): ... 455 FILES 0 ERRORS 0 WARNINGS
ok vitest (47.5 s): Duration 39.54s (transform 73.78s, setup 0ms, import 92.08s, tests 57.37s)
test:quick: 48.6 s (limit 45.0 s)
every command passed
test:quick: over the time limit

# npm run test:quick, run 2
176 changed file(s), from git since HEAD; 128 test file(s), 10 essential
ok vitest (28.6 s): Duration 25.03s (transform 24.15s ... tests 54.54s)
test:quick: 29.1 s (limit 45.0 s)
every command passed

# Each changed test file in the quick set, alone, --tagsFilter '!slow'
hub-portfolio 0 run, 9 skipped | hub-roots 6 tests 27 ms | career 2 tests 13 ms | hub-secrets 8 tests 421 ms | app-store 11 tests 2593 ms | undo 19 run, 1 skipped, 3787 ms (the new undo test about 195 ms)

# Brief verify item 2
npx vitest run tests/server/edit tests/routes/edit tests/server/core/changes.test.ts tests/server/files tests/data tests/checks/config tests/checks/tree tests/checks/imports tests/checks/source --testTimeout 300000
Test Files 66 passed (66); Tests 575 passed | 1 skipped (576)

# Round brief's last run
npx vitest run tests/routes/hubs tests/data/hubs tests/server/git/deposit.test.ts tests/routes/edit/undo --testTimeout 300000
Test Files 6 passed (6); Tests 67 passed (67)

# The report's base copy, $TMPDIR/d55base1/tools/oculus (src and config: diff -rq against D55-base prints nothing; hub test files cmp-identical to the worktree's)
npx vitest run tests/data/hubs tests/routes/hubs
Tests 34 failed | 11 passed (45)
(the G8 lead test and both LinkedIn tests pass there; the R1 tests fail)

# The report's case script, changed tree
node $TMPDIR/d55/round1-cases.ts
personInSecondHubFile: "chen-graph"; fileHasLabPrefix: false; secretsFilesListed: []; folds [["hub",true],["lab",true]]; openedAs {root: lab, path: registries/people.yml}
# Same script, D55_ENG=$TMPDIR/d55base1/...
stopped by roots.hubTargets is not a function; secretsFilesListed: ["Secrets/x.yml"]; folds null; R1-8 "Cannot read properties of undefined (reading 'file')"

# Brief verify item 6
sh utils/folder-check.sh                     -> exit 0
sh utils/unused-exports.sh                   -> 365 lines; diff against the base list shows only the moved normalise-parts/personal.ts lines and Entities dropped; nothing added
wc -l                                        -> deposit.ts 880/880, state/client/context.ts 879, server/root/context.ts 871, yaml-edit.ts 868, EntryCard.svelte 518/520, ProjectCard.svelte 509; none over

# ASCII gate (perl form over src tests config): no output, exit 0. Added doc lines: no non-ASCII.
# Comment width: no added line over 100 columns (only existing eslint-disable lines).
# History-word grep over added comments and test titles: hits are "before" for operation order and "new" in 'new-entry'; none records history.

# Reviewer probes, $TMPDIR copies of demo/, HOME=$TMPDIR/d55home
npx tsx scratchpad/manifest-ref.ts
project lab:streaming-anomaly collaborators in the snapshot ["lab:rivera-lab"]
write 200 {"ok":true,"changed":["collaborators"],"refused":[]}
second hub manifest collaborators lines: collaborators: [lab:rivera-lab]

npx tsx scratchpad/wf.ts   (writtenFile for the bodies the views send)
{"kind":"entry","collection":"tasks","id":"lab:Review the draft",...}          -> {"root":"hub","path":"tasks/tasks.yml"}
{"kind":"delete-entry","collection":"tasks","id":"lab:Review the draft"}       -> {"root":"hub","path":"tasks/tasks.yml"}
{"kind":"subtask","target":{"collection":"tasks","id":"lab:Review the draft"}} -> {"root":"hub","path":"tasks/tasks.yml"}
{"kind":"reorder","collection":"tasks","order":["lab:a","lab:b"]}              -> {"root":"hub","path":"tasks/tasks.yml"}
{"kind":"entry","collection":"lab:tasks","id":"Review the draft","fields":{}}  -> {"root":"lab","path":"tasks/tasks.yml"}

# test -e for config/local.yml in the worktree, D55-base, $TMPDIR/d55basetree and $TMPDIR/d55base1: absent in all four. test -e for a secrets folder in any letter case under $TMPDIR/d55basetree: absent.
```

### Verdicts

Items of "What to build":

- 1: holds. hub-roots tests (6), the case 4 to 6d lines, and the undo of a removed hub root.
- 2: holds. Case 7 and 19a.
- 3: violated. Entry references of a second hub are prefixed now (`merge.ts` `collectionOf` through `throughSchema`; R1-1 rerun gives `chen-graph` in the file, `lab:` in the snapshot), and feed ids are scanned. Manifest writes of a second-hub project write the prefix into the hub's file, and the editor offers ids of every hub (finding 1).
- 4: violated in part. VenueCard now passes the venue's root (round item 2 closed). The registry cards of a second hub get no entry, so they draw no Edit in File and no deadline (finding 3).
- 5: holds. Case 15, 16 and 21.
- 6: violated. Server routing holds (hub-writes tests, 19b). The page's `writtenFile` names the first hub's file for every entry, delete, subtask and reorder write of a second-hub entry (finding 2), and the manifest write path keeps prefixes (finding 1).
- 7: holds for the code. Tasks.svelte and CommandCenterView.svelte draw the chip through RootChip (round item 6 closed). The look is checked at landing.
- 8: holds. All six `privateFolders(` callers pass every hub; `isPrivateFile` lower-cases when `folds` is true; `namesPlans` resolves native case. Proof finding 4 is about the tests of it.
- 9: holds. Case 14 and 19f.
- 10: holds. The undo test and cases 11, 12, 12a.
- 11: holds. Case 19.
- 12: violated. `docs/apps.md` is not updated for app-visible shapes the step changes (finding 5).
- 13: holds. Each named G row has its tests; finding 4 is on two of them.

Cases:

- 1, 2: met (as in the first review; hub-portfolio tests pass).
- 3: met for the read side. The manifest write side is finding 1.
- 4, 5, 6, 6a, 6b: met.
- 6c: met, feed items included (round item 3; the G32 lead test passes).
- 6d: met.
- 7 to 12, 12a: met.
- 13: met on macOS (R1-4 rerun gives `secretsFilesListed: []`, hub-secrets tests pass). On a case-sensitive file system two tests fail at a precondition (finding 4).
- 14: met.
- 15: met (feed ids and `root` on feed-field, feed-delete and linkedin-post; hub-writes tests).
- 16, 17, 18, 19, 19a, 19b: met.
- 19c: partial. The deck base is met. The unsaved-tab refusal names `hub/tasks/tasks.yml` for an entry write of a second-hub task (finding 2).
- 19d: met for the snapshot and the undo; the tab's not-found state needs a page run.
- 19e, 19f, 19g: met.
- 19h: met for the tone; the drawing is checked at landing.
- 20, 21: met.

### Findings

1. Spec and behaviour. `src/lib/server/edit/writes/manifest.ts:395` `export function writeManifest(` strips no hub prefix, while `entries.ts:228` does: `const fields = hubKey === undefined ? given : hubOwnValues(held.schema, given, hubKey);`. What is wrong: Editor.svelte fills the form through `fieldValues` (state/forms/schema.ts) from the merged, prefixed snapshot (`venue_id`, `collaborators`, `waiting-on`, `pillar`, `funding`, `related`, `datasets`, `compute`) and posts the changed fields to `writeManifest`. Round item 1 requires that a second hub's file keep its own ids. In addition, `choicesFor` and `entityChoices` offer the ids of every hub. A first-hub project can be given `lab:x`, which the page then resolves to the second hub's record. A second-hub project can be given a bare first-hub id, which then resolves to that hub's own record of the same id. HELP.md's "the people, venues, projects and other records its entries name are that hub's own" and DESIGN.md's "never crosses hubs" are false for manifests. Failure scenario: the reviewer probe above. Editing collaborators on `lab:streaming-anomaly` writes `collaborators: [lab:rivera-lab]` into the second hub's `project.yml`. Opened as a hub of its own, that file names a person that does not exist. Verdict: items 3 and 6 violated.

2. Behaviour, and proof against the report's item-8 table. `src/lib/state/sessions/source/write-files.ts:95-96`: `const collection = (name: unknown): ViewSource | null => look.collectionFile(text(name)) ?? viewSourceFile('collection', merged, text(name));`. What is wrong: `look.collectionFile` (state/client/context.ts) answers only for a collection id whose root is not `hub`, such as `lab:tasks`. The views send the bare key: Collection.svelte:344 `collection={key}`, InPlace.svelte:66, EntryCard:259/264, Collection:252 `reorderEntries(key, moved)`, focus/rows.ts:347/351. So every entry, delete-entry, subtask and reorder write of a second-hub entry is named as the first hub's file (probe above). The report's table says `look.collectionFile` gives the record's hub for a collection entry, and for these bodies that claim is false. The view-level checks (EntryCard, Subtasks, Focus rows, Collection writeOrder) pass `part.file` and so check the right file. The store's guard (`writes.svelte.ts:562` `fileOf` and `unsavedRefusal`) does not. Failure scenario: with unsaved text in a tab of the first hub's `tasks/tasks.yml`, a status change on a second-hub task is refused as a write over unsaved text. With unsaved text in the second hub's `tasks/tasks.yml`, the same write is let through the store's guard. Verdict: item 6 violated, case 19c partial.

3. Spec, and proof against round item 8. `src/lib/views/shared/forms/registry/registry-file.svelte.ts:59` `entryOf: (id) => entryById(collection, id),` with `const collection = $derived(collectionOf(key));` (:42), which is the first hub's registry. Callers: Venues.svelte:140, :179, Data.svelte:126, Pillars.svelte:93, :122, :152 pass `entry={file.entryOf(<id>)}`. What is wrong: for a second-hub id (`lab:x`) the entry is null. VenueCard then skips `if (entry !== null && schema !== undefined)` (:97) and `{#if entry?.fields.deadline !== undefined}` (:239), so it draws no Edit in File and no deadline in place. The report's row says "the card of a second-hub venue, dataset, domain or pillar opens its own file from its own card controls (VenueCard, DatasetCard, RegistryCard)". Reading the code refutes that. Failure scenario: a venue held only by the second hub shows no edit control and no deadline, while the same venue in the first hub shows both. Verdict: item 4 violated in part.

4. Proof. `tests/routes/hubs/hub-secrets.test.ts:118` `expect(existsSync(join(lab, 'SECRETS', 's.yml'))).toBe(true);` and `:192` `expect(existsSync(join(lab, 'secrets', 'x.yml'))).toBe(true);`. What is wrong: each precondition holds only where the file system folds case. The file is not tagged slow, so it runs in `npm test` and the quick tier. The ruling "Remote and group dropped" and O33's Lima Ubuntu run put Linux among the supported hosts. Failure scenario: on Linux, both tests fail at the precondition, so `npm test` goes red there, and they check nothing about the case-sensitive behaviour. The fitting forms are a skip on `foldsCase`, or an assertion of what the case-sensitive file system should give. Verdict: item 13 holds, with this defect in its proof. Case 13 is met on macOS only.

5. Standards (brief item 12, every sentence the change makes false). `docs/apps.md:273`: "`id` is the entry's `key` when it has one and its `title` otherwise." That sentence is false for a second-hub entry, whose id is `lab:<key>`. `docs/apps.md:425-430` gives `feed-field` as `{ kind, feed, id, field, value }`, `feed-delete` as `{ kind, feed, id }` and `linkedin-post` as `{ kind, file }`, and none of them names the `root?` the step adds in `bodies.ts`. The `portfolio` channel tables (:232-276, people at :244) name neither the `root` the step adds on every entity and audit finding, nor `Person.file`, nor `hubFiles` on the feeds payload. Only :524 is changed by the step. Failure scenario: an app author reading apps.md posts a feed-field write for a second-hub lead without `root`. The write goes to the first hub, which holds no such id, and is refused. Verdict: item 12 violated.

6. Standards (round brief opening paragraph: "no copy of the real hub's folders is made"). The report's line 35 says the earlier base runs used `$TMPDIR/d55basetree` "with the hub data beside it". That folder holds copies of the real hub's applications, deck, docs, education, feeds, funding, network, projects, registries, side-projects and tasks. Its top level was last modified at 02:32 and 04:51, before the round. The command that made it is not given, and the copy is still on disk. No `local.yml` exists there, and loadLocal's default hub is `resolve(engine,'..','..')`, so a run on that tree reads the copy of the real data as its hub. `test -e` finds no secrets folder in it in any letter case. The round's own scripts copy `ENG/demo` only (`world()`). Failure scenario: base numbers in the report's earlier sections come from real data, not from the demo the brief names, and the copy of private data stays under `$TMPDIR`. Verdict: no item; the orchestrator decides whether to remove the copy.

### Declined to judge

- `root` on feed-field and feed-delete: round brief item 3 names it, but no plan.md ruling books it (Z765 (b) names linkedin-post only), and it sits on a public app write kind. Whether it needs a ruling is the orchestrator's call.
- `folds` on the workspaces answer: round item 4 allows it. The key name is the builder's and is listed under Judgment calls. `/api/fs` is not an app channel.
- `Person.file`: named in no brief or ruling, it sits on the `portfolio` channel apps read, and it is listed under Judgment calls. Whether it needs a ruling is the orchestrator's call. Its doc gap is part of finding 5.
- `FeedItem` changes: an internal data type, on no wire. Not judged as a shape.
- Not checked: whether a collection view is registered for a key that only a second hub holds.
- The remaining `HUB_ROOT` uses in page code (card.ts urlOf and openDocument defaults, EntryLink, FolderFiles, post-card, Settings.svelte, Doc.svelte:149/155; 55 lines by grep): the step does not change Doc.svelte (`git diff ecbc37a0c --stat` of views/sources/doc is empty), Settings is the first hub's by design, and no second-hub path through the others was found. They were not judged as findings.
- The chips, tooltips and neutral tones, and the tab's not-found state (19d): these need a page run, which this review may not start. They are left to the landing look.
- The test:quick run over its limit (48.6 s) came with a cold transform cache (transform 73.8 s against 24.2 s on the 29.1 s run) and machine load. The step's added tests add well under 1 s (the per-file times above). This finding of cause comes from those runs. No run with a warm cache and an idle machine was made to settle it further.

Answers to the task's nine points:
1. Prefixing rule: a `select` value and a `tags` item are prefixed even when the hub does not resolve them (`hub-portfolio` "prefixes a value its hub cannot resolve too": `ghost` becomes `lab:ghost` and the finding stays). A free `text` value is prefixed only when the hub holds that record (`merge.ts` `reach`). The two rules are consistent with round item 1. An unresolved value shows as the raw `lab:ghost`, since `personName` falls back to the key. The entry write strips the prefix (R1-1: the file holds `chen-graph`). The manifest write does not (finding 1).
2. New wire shapes: `root?` on feed-field, feed-delete and linkedin-post; `folds` on the workspaces answer; `Person.file`, `hubFiles` and `root` on entities and findings on the portfolio channel. See Declined and finding 5.
3. test:quick: 48.6 s and then 29.1 s, every command passing both times. The added tests are not the cause (see Declined).
4. Tests that pass on the unchanged tree: the G8 lead test and the LinkedIn absent-root test cover behaviour the step keeps from the one-hub base. Their base and after runs are reproduced above. The round-start tree was not kept, which the report's first line states. The other round tests fail on the base for want of the hub machinery, with the failure lines quoted.
5. Relay test on a case-sensitive file system: finding 4.
6. File-opening calls: every record call passes its root. Linkedin.svelte:126 (a new idea, always the first hub) and posting.ts:15 (http only) need none. The collection and registry pane toolbars open the first hub's file, which fits item 6, since a new entry goes to the first hub. The registry cards are finding 3.
7. isPrivateFile: the server says whether the file system folds case (`foldsCase`, `folds: true`) and the page lower-cases. All six callers pass every hub: library/rules.ts withheldFolders, machine-file.ts, writing/folder.ts, search-routes.ts:70, fs/ops.ts:744, config-files.ts:39.
8. Base runs and copies of the real hub: the round's base runs use a demo copy (`d55base1` holds only `tools`). The earlier copy of real data remains (finding 6).
9. Non-ASCII, history words, size limits and prose: clean (runs above).

Reviewer usage: aa068552ee5aa1c92, claude-opus-5-5, 91,605 tokens, 149 tool uses, 23.9 min (from the completion notice; the reviewer counts about 450,000 tokens across its own compaction).

## Closed (at landing)

The findings of the review over repair round 1, the last round, fixed on main at landing (`repair_rounds: 1`, so none went back to the builder), and the defects the look found:

- Finding 1 (a manifest write kept the hub key; the form offered every hub's records): fixed. `writeManifest` takes `hubKey`, which `routed` in `server/edit/writes/hubs.ts` now returns, and takes the key off every value of a manifest field whose `from:` names a registry or the projects (`hubOwnFields`, through the walk of `data/snapshot/hubs/references.ts`); `choicesFor` and `entityChoices` in `state/forms/schema.ts` offer the records of the edited project's own hub alone. Test under G8: `writes a manifest field that names records of the second hub without the hub key`, red on the step's tree (`expected [ 'lab:rivera-lab' ] to deeply equal [ 'rivera-lab' ]`), green on main. Look: the Editor of the `lab` project offers four people, `Lab Only Person` among them; the first hub's offers three.
- Finding 2 (the page named the first hub's file for a second-hub entry write): fixed. `writtenFile` in `state/sessions/source/write-files.ts` names the collection of the hub the entry id names (`entryHubFile`) for entry, delete-entry, reorder and subtask writes, as the server routes them. Test in `tests/state/client/held-unsaved.test.ts`: `is checked against the file of the hub the entry id names, as the server routes it`, red on the step's tree (the two writes were posted), green on main.
- Finding 3 (a second-hub registry card had no entry): fixed. `registryFile` reads each card's entry, schema, file and identities from the registry file of the hub that holds it (`entryOf`, `schemaOf`, `sourceOf`, `faultOf`); Venues, Data, Pillars and Domains pass them. Look: the `lab` venue `Lab Only Conference` draws its deadline in place and Edit in File, which opens `lab/registries/venues.yml`.
- Finding 4 (two letter-case tests fail on a case-sensitive file system): fixed. The relay test is split, and the letter-case cases run under `it.skipIf(!FOLDS)`, `FOLDS` being `foldsCase(tmpdir())`.
- Finding 5 (`docs/apps.md` not updated): fixed. The Entry sentence gives the hub key on a second hub's id; a paragraph says every record, Entry, lead and audit finding carries `root`, how ids and references of another hub are prefixed, and that an app writes the first hub alone; `file?` on people, `root?` on leads, `hubFiles?` and `root` on the `feeds` channel, and `root?` on `feed-field`, `feed-delete` and `linkedin-post` with what it does. The two shapes no ruling named are booked as Z767.
- Finding 6 (a copy of the real hub's folders under `$TMPDIR/d55basetree`): removed before landing.
- Look 1 (a second hub's `related:` ids in a field with no `from:` resolved to the first hub's projects, so a first-hub project listed the `lab` talk under Disseminated in): fixed. `inHubOf` in `data/helpers/hub-names.ts` reads such a value inside its record's own hub; `disseminated` and `crossLinks` use it. Look: each of the two projects lists one talk.
- Look 2 (the palette listed both hubs' records as identical rows): fixed. A project, collection entry or feed row of a second hub carries the hub key as its hint. Look: `lab` beside each second-hub row.
- Look 3 (a second-hub card showed `lab:method` and `lab:stream-bench`): fixed. `domainLabel` and `domainTone` look a domain up as written, then by the word after its first colon (`domainEntry` in `state/shared/words/tones.ts`), and the card's dataset, funding, pillar and collaborator tags named by id show the id inside the project's hub. Look: `Methods frontier` and `stream-bench` on the `lab` card.
- Declined point (`root` on `feed-field` and `feed-delete`; `Person.file`): Z767, kept and documented.
- The conflict with D49 at landing: D49 removed `docs/configuration.md`, `docs/files-and-search.md` and `docs/views.md`; D55's sentences in them are carried into HELP.md (the Personal row and bullet, the second-hub bullets of "Configuration and the data") and into `docs/DATA-MAP.md`; D55's path renames inside text D49 cut are dropped with it.
