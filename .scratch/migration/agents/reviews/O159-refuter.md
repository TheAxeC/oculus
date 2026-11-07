# Step O159 refuter report (on .agents/worktrees/migration-O159, base 2e8c2c4dd)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
# Brief check 1, npm run test:quick: not run by the reviewer (excluded by the dispatch; the whole verify list runs at landing).
# The builder's report gives it as NOT done: two runs, both red on vitest time-outs only.

# Brief check 2, the new case files (fast)
npx vitest run tests/data/hubs/deck-globs.test.ts tests/server/root/watch/glob-drop.test.ts tests/server/edit/deck/deck-globs.test.ts --reporter=dot
 Test Files  3 passed (3)
      Tests  18 passed (18)

# Brief check 2, the slow file alone (timeout raised, as the report's command does)
npx vitest run tests/server/root/watch/deck-folders.test.ts --testTimeout 20000 --reporter=verbose
 (C3 3453ms, C4 2095ms, C5 1830ms, C6 1662ms, C7 1224ms, C9 2898ms, C13 1429ms, C14 1347ms, each passed)
 Test Files  1 passed (1)
      Tests  8 passed (8)

# Brief check 2, the changed callers (run with --testTimeout 20000 raised up front because of the load; nothing timed out)
npx vitest run tests/data/sources/present.test.ts tests/checks/config/integrity.test.ts tests/data/hubs/workspace-projects.test.ts tests/data/sources/manifests/manifests.test.ts tests/state/boards/board/items.test.ts tests/state/forms/choices.test.ts tests/state/shared/hub-words.test.ts tests/data/hubs/decks.test.ts --reporter=dot --testTimeout 20000
 Test Files  8 passed (8)
      Tests  85 passed | 7 skipped (92)

# Brief check 2, the slow callers, each alone with --testTimeout 20000
tests/server/edit/deck/deck-acts.test.ts      Test Files  1 passed (1)   Tests  7 passed (7)
tests/routes/docs/deck.test.ts                Test Files  1 passed (1)   Tests  4 passed (4)
tests/server/root/watch/website-watch.test.ts Test Files  1 passed (1)   Tests  1 passed (1)

# Brief check 3, the rules file's perl form of the ASCII gate over the 37 touched files plus .agents/O159-time.ts
LC_ALL=C perl -ne 'my $l = $_; $l =~ s/\xC3[\x80-\xBF]//g if $ARGV =~ m{^config/}; print "$ARGV:$.:$_" if $l =~ /[^\x20-\x7E\n]/; close ARGV if eof' <files>
 (no output) ascii exit 0

# Brief check 4, wc -l of every changed file (the largest)
 840 src/lib/data/index.ts | 843 src/lib/data/sources/deck/read.ts | 856 src/lib/server/root/watch/portfolio/portfolio.ts | 858 src/lib/server/root/context.ts | 871 tests/data/sources/present.test.ts; every file at or under 880

# Brief check 5
sh utils/folder-check.sh
 (no output) folder-check exit 0

# Brief check 6
sh utils/unused-exports.sh > <scratch>; diff ../O159-base/unused-exports.txt <scratch>
 diff exit 0 (no line added)

# Brief check 7, the rules file's word list (the report's grep omits 'before', 'still', 'always'), over added comment lines, the new files' comments and test titles
 13 hits, all of them 'before' in a run-time order sense ("before its answer", "before the debounce", "before the rebuild", "before any rebuild", "The segments of the pattern before the first...", "The keys held before this rebuild") and one 'still' (tests/data/hubs/deck-globs.test.ts:3, "each reader still raises its own findings", a contrast inside the present design). No history.

# Brief check 8 / C16, over a scratch copy of tests/fixtures/hubs/demo with eight synthetic projects (each with code/build/ holding 50 files)
node .agents/O159-time.ts <scratch>/o159-review/demo
 hub ...: 18 research projects, keep 9
 with keep: 5 slides, 9 members; with no filter: 13 slides, 9 members
 before (a fresh store per read, 10 reads): mean 45.6 ms, sd 21.3 ms
 after (one warm store, 10 reads): mean 48.8 ms, sd 25.7 ms
 exit 0
 second run: before mean 9.1 ms, sd 2.4 ms; after mean 11.5 ms, sd 7.4 ms (uptime: load averages 15.21 10.81 10.55)
 The report's 16.5 ms against 9.4 ms is not reproduced: on the fixture the walk is too cheap to show over the load. No decision rests on the fixture figure; the decision rests on the orchestrator's run over the research hub at landing.

# Commands the report quotes as evidence
npx tsc --noEmit -p tsconfig.json
 tsc exit 0 (no output)
grep -rlE "WriteTarget = \{|\): WriteTarget|as WriteTarget|WriteTarget>" tests
 8 files: deposit-world.ts, config-key.test.ts, roots.test.ts, hub-routing.test.ts, hub-writes.test.ts, write-log.ts, hosts-world.ts, clone-after.test.ts (tests/routes/edit/write-fixture.ts not among them, as the report says)
head of tests/server/edit/deck/deck-acts.test.ts
 9:// @module-tag slow: each act is written and then taken back through the change log and the Trash.  (the report's brief error holds)
dot-folder probe, node -e over a scratch tree holding projects/a/present, projects/.hidden/b/present, projects/c/.present, .top/present
 projects/**/present ["projects/a/present"]
 projects/.hidden/*/present ["projects/.hidden/b/present"]
 **/present ["projects/a/present"]   (the report's reading reproduces)
npx prettier --check <the 37 touched files>
 All matched files use Prettier code style!
grep -rn "globbed\|DeckContext\b" src tests docs README.md (outside read.ts); grep -rnE "withDecks\(|buildHubs\(|readDecks\(" docs README.md
 (no output)

# Reviewer probes of the drop rule (scratch programs importing the worktree's glob-drop.ts; write nothing)
pattern 'slides/*' held with match 'slides/one', root /fixture/notes:
 slides/one/main.md.2215404123 gone ["/fixture/notes\nslides/*"]
 slides/one/main.md file ["/fixture/notes\nslides/*"]
pattern 'notes/*-slides': notes/talk-slides/slides.md.99 gone []
pattern 'projects/**/present', scan folder /hub/projects/active, event x/results/run1 (folder):
 moved true drops ["/hub\nprojects/**/present"]
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `src/lib/data/sources/documents/folder-globs.ts`: type `FolderGlobs` and factory `folderGlobs({ walk, taken })`, raw match strings by `<root>\n<pattern>` (`:78-92`), `held()` with `fixed` per key, `drop`, no module-level state; C1 passes.
- 2: holds. `read.ts:356-372` reads matches from `context.globs`, keeps `resolveIn`, the `path_outside` raise, the `present.yml` folder rule and the `existsSync` test per read; `globbed` is gone; `DeckContext.globs` is required (`read.ts:110-114`); C2, C8, C10 and C12 pass.
- 3: holds. `ServerContext.deckGlobs` (`server-context.ts`), built in `createServerContext` (`context.ts`, `globSource()`, its `.store` beside `ignoredCache()`), the fixture builds one (`context-fixture.ts:200`); watcher to `buildHubs` to `withDecks` to `readDecks` as new last positional arguments; the route's `sourceOf` sets `globs: locals.server.deckGlobs`; `target()` takes `server.deckGlobs`, a no-server target gets `folderGlobs()` (`writes.ts:334`); required at `DeckContext`, `DeckSource`, `DeckInput`; `tsc --noEmit` exit 0.
- 4: holds. `glob-watch.ts:95-114` opens a recursive watch on the key's fixed folder (or the nearest existing folder above it) when no recursive handle of the watcher (`deep`, `portfolio.ts:269,306`) or of its own covers it, closed in `close()`; C13 and C14 pass.
- 5: violated, Spec 1. The third condition is a glob match of the last segment, so a save drops a key whose pattern ends in a wildcard.
- 6: holds. `movedFolder` (`glob-drop.ts:80-104`), queued from `open`'s callback and the own handles; C4 passes. What it covers is wider than the report says (Behaviour 1).
- 7: holds. `dropUnder` after the writes in `createDeck` (`deck-new.ts:76`), `outlineDeck` (`:130`) and the undo's success and failure paths (`deck-undo.ts:103,106`); C11 passes.
- 8: violated, Standards 1. The head comments are written, but one sentence of `glob-drop.ts` is false for the code as built.
- 9: holds. `.agents/O159-time.ts` follows the path the brief names (`loadConfig`, `portfolioConfigFrom`, `buildOneHub`, `mergeHubs`), ten fresh-store reads and then one untimed read plus ten warm reads, prints mean and sd, writes nothing; my run over a fixture copy printed its four lines and exit 0.
- 10: holds. `context.ts` 858 lines, the config parse moved whole into `src/lib/server/root/process/context/config-parse.ts` (85 lines, folder now 9 items); every changed file at or under 880.
- 11: holds for the builder's part: the tests are named by file and title in the report. The G32 widening in `guarded.md` is the orchestrator's at landing.

Cases of the brief's "Cases":

- C1: met, `deck-globs.test.ts` 'walks a pattern once for two readers over one store (case C1)' asserts one walk for two readers.
- C2: met, held key against a fresh walk with three decks, `c` reached by `projects/*/c/present/present.yml`, `toEqual` over the whole deck including findings.
- C3: met, slow file C3 waits on `built` and reads `c` through `readDeck` over the published snapshot.
- C4: met, slow file C4, `b2` held and `b` gone with `tiers: [research]`.
- C5: met, slow file C5.
- C6: met, slow file C6 saves through `writeBytesAtomic`, the key held and walk count unchanged, new slide text read. Met for the case's `projects/**/present` pattern; for a pattern whose last segment is a wildcard a save does drop (Spec 1).
- C7: met, slow file C7.
- C8: met, `deck-globs.test.ts` C8, one walk, the new deck read.
- C9: met, slow file C9, hub key dropped, lab key held, `runs(lab)` 1.
- C10: met, `deck-globs.test.ts` C10, the finding on both readers.
- C11: met, `tests/server/edit/deck/deck-globs.test.ts`, outline and create each followed by a read that holds the new deck. The file is not the one the brief names (Spec 2).
- C12: met, drafts and keep through a held key equal a fresh walk.
- C13: met, slow file C13, a workspace folder that is no hub; the drop can only come from the listener's own handle, since nothing else watches `notes/slides`.
- C14: met, slow file C14, dropped at the event with `builds.count()` unchanged.
- C15: met, `glob-drop.test.ts`, 12 rows covering every row the brief lists plus another root. No row covers a wildcard last segment (Spec 1).
- C16: met, the program runs over a fixture hub and its run is quoted; the report's fixture speedup does not reproduce over the load (Verification), and no decision rests on it.

## 1. Spec

- `src/lib/server/root/watch/portfolio/glob-drop.ts:65-67`: "const last = segmentsOf(glob.pattern).at(-1) ?? ''; const name = segmentsOf(under).at(-1) ?? ''; if (matchesGlob(name, last)) return [glob.key];". What is wrong: item 5's third condition is "the path's last name is the pattern's last segment (`present.yml` for a file pattern)", and decision 2 says an oculus save drops nothing. The code glob-matches the name against the last segment and runs that test before the state check, so under a pattern whose last segment is a wildcard every rename at any depth under the fixed folder drops the key, a write-file-atomic temporary name and the saved file included. My probe: for `slides/*`, `slides/one/main.md.2215404123` (gone) and `slides/one/main.md` (file) each drop `/fixture/notes\nslides/*`. A file match is never a deck unless it is named `present.yml` (`read.ts:368`), so the wider test makes walks and never finds a deck the literal rule would miss, except where a pattern ends in a glob that matches `present.yml`. Failure scenario: a deck with `find: { folders: ['slides/*'] }` (the shape of C13); each source-tab save of a slide in `slides/one/` drops the key and the next read walks again, against decision 2. The hub's `projects/**/present` is not affected. A fix that keeps the `present.yml` case: apply the last-segment glob test only when the name is `present.yml` (folders are already covered by the first condition), and add a C15 row for a wildcard last segment. Verdict: item 5 violated.
- `tests/server/edit/deck/deck-globs.test.ts` (new) and `tests/routes/edit/write-fixture.ts`: paths outside the write list. What is wrong: the brief places C11 in `tests/server/edit/deck/deck-acts.test.ts` and also calls it "a fast test", but that file carries `// @module-tag slow` at line 9 (reproduced), so the builder made a fast file of its own. `write-fixture.ts` builds `PrimaryTarget` literals the type check requires to carry `deckGlobs`, and the brief's grep misses it (reproduced: 8 files, without it). The report names both, with the reason. Failure scenario: the orchestrator widening G32 at landing from the brief's text would name `deck-acts.test.ts` for C11, a test that is not there. Verdict: none (the brief's error, for the orchestrator's disposition).
- The report, "Judgment calls", last bullet: "One edit went through an inline `python3` script rather than the Edit tool: a single replacement in `tests/data/hubs/deck-globs.test.ts`." What is wrong: an unapproved script under the rules file's "What every package obeys" (an inline `python3` that changes a file is a script and needs the brief's approval); the brief approves only `.agents/O159-time.ts`, and no `plan.md` Ruling approves this one. The report names it with the file it changed. The state file's standing demand closes such a finding in automode under the ruling "Unapproved builder scripts". Failure scenario: an edit made outside the Edit tool is not in the builder's tool record, so the diff of that file has no edit to read it against; the file passes its five tests and is read whole above. Verdict: none.

## 2. Proof

- The report, "The cases' first run, on the unchanged tree": "`node <scratchpad>/O159-first-run.ts <worktree>` (a scratch file, since removed)", with output "C1: walks of two readers = 2" and "C4: builds after the rename = 0; snapshot folders = ...". What is wrong: the rules file's case-run rule requires the program's source and output quoted "so the reviewer can run it again". Only the output and a description are quoted, so the C1 and C4 first-run results cannot be rerun. My reading of the base agrees with both: base `read.ts` keeps `globbed` per reader (`git show 2e8c2c4dd:src/lib/data/sources/deck/read.ts`, the old `:217`), and a folder event names no `.yml` or `.md`, so the base filter takes none. The "before" of the report's Behaviour section rests on the C4 line. Failure scenario: an orchestrator checking that item 6 is new behaviour has to rebuild the program from a prose description. Verdict: none.
- The report, check 7: "`grep -inE \"\b(no longer|previously|used to|formerly|today|anymore|...|now)\b\"`", and check 3: "`perl -ne 'print \"$ARGV:$.: $_\" if /[^\x00-\x7F]/'`". What is wrong: the history grep leaves out the rules file's words 'before', 'still' and 'always', and the ASCII gate is not the rules file's perl form (that form also flags control characters such as a tab). My reruns with the rules file's forms find no history (13 run-time 'before' hits and one present-tense 'still') and no character outside the set. Failure scenario: a comment holding "as before" or "still", or a tab, would pass the builder's quoted checks unseen. Here none is present. Verdict: none.

## 3. Standards

- `src/lib/server/root/watch/portfolio/glob-drop.ts:9-11`: "A save never drops: oculus writes a file through a temporary name renamed over it, and the temporary name is gone and no match, while the file renamed into place is no folder and a slide file's name is no deck pattern's last segment." What is wrong: the rules file ("What every package obeys": a sentence in a head comment that the change makes false is a defect). Under a pattern whose last segment is a wildcard (`slides/*`), a slide file's name matches it and a save drops (Spec 1, probe in Verification). Failure scenario: a reader of the head comment trusts that saves keep the store warm, and does not look further when a `slides/*` deck re-walks on every save. Verdict: item 8 violated. The fix of Spec 1 makes the sentence true.
- `src/lib/server/root/watch/portfolio/glob-drop.ts:35`: "const NEVER = ['code', 'attic'];". What is wrong: the rules file's "The principles every package is judged on" ("a parser, a fold or a rule exists once and is reused"). The same list is `audited.ts:26`, in the same folder, unexported (`grep -rn "\['code', 'attic'\]" src` prints both). Failure scenario: a folder added to `audited.ts`'s `NEVER` (say `archive`) stops the file filter's rebuilds there, while the drop rule and the scan-folder rebuild of `glob-drop.ts` keep firing for it, and the two rules disagree on which folders the build ignores. Export it from `audited.ts` and import it. Verdict: none.

## 4. Behaviour

- `src/lib/server/root/watch/portfolio/glob-drop.ts:80-104` (`movedFolder`) and `glob-watch.ts:95-114`: the report's "Host- and user-visible changes" says "A project folder moved, added or removed under a scan folder now queues a rebuild". What is wrong: the code rebuilds for any folder made or renamed at any depth under a scan folder outside `code/`, `attic/` and dot folders, and it drops the portfolio key with it (probe: `x/results/run1` under `projects/active` gives `moved true` and drops `/hub\nprojects/**/present`). The server also now holds a recursive watch on the research hub's `projects/` folder. This is item 6's text, but the report states a narrower change. Failure scenario: results synced into `projects/active/<p>/results/<run>/`, a figures folder made under `manuscript/`, or a `__pycache__` outside `code/` each rebuild the snapshot and re-walk `projects/**/present`, about 1 s on the real hub by the brief's own timing, debounced. The look and the landing timing are read against the narrower sentence. Verdict: none.
- `src/lib/data/sources/deck/read.ts:356-372`: "for (const match of context.globs.matches(root.dir, pattern)) { ... raise('find', 'findings.deck.path_outside', match, root.dir);". What is wrong: on the base the per-reader cache raised `path_outside` only on the cache miss, so in one reader only the first deck file reading a root and pattern got the finding. Now every deck file of the reader that reads that pattern gets it (deduped per file by `raiseAt`). The report says "No deck reads differently for a given state of the disk". Failure scenario: two decks read in one request, both with `find.folders` matching a link out of the root, now show the finding on both decks' files where the base showed it on one. Verdict: none.

## Declined to judge

- `npm run test:quick` and the import closure it covers (the report's 142 test files): not rerun, excluded by the dispatch. The report gives check 1 as NOT done on vitest time-outs only; the landing run on main settles it.
- Whether the deck route's key spelling equals the snapshot build's (`read.hub` against `open.roots`' `dir`), so that the route reads warm from the build as `DeckSource.globs`' doc says: not settled by a read or by a test here. A walk count across one build and one route read, or the orchestrator's real-hub timing through the server at landing, would settle it.
- The real-hub measurement of item 9: the orchestrator's at landing, by the brief.
- That `.agents/O159-time.ts` is ignored by git: only `git status --short --ignored` or `git check-ignore`, outside the three git commands, would show it.
- The watcher's behaviour off darwin (Linux recursive `fs.watch` event names): the tests ran on darwin only.
- The builder's hand-copying of prettier's output with Edit: no defect to judge, since `npx prettier --check` over the touched files passes.
- The G32 Code-line widening and the look on the Present view: the orchestrator's at landing.

Reviewer usage: a864d9923908a74ce, claude-opus-5-5, 268862 tokens, 59 tool uses, 15.6 min

## Repair round 1, refuted

```
# Brief check 1, from the worktree root (the reviewer form, with the base)
npm run test:quick -- --base 2e8c2c4dd
test:quick: 46 changed file(s), from git since 2e8c2c4dd
test:quick: 142 test file(s)
ok      prettier (1.4 s): All matched files use Prettier code style!
ok      ASCII gate (1.5 s)
ok      svelte-kit sync (3.1 s)
ok      eslint (4.0 s)
ok      svelte-check (15.5 s): 1794012367206 COMPLETED 585 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (163.6 s)
ok      vitest (177.4 s)
ok      vitest slow (324.7 s)
test:quick: 327.9 s; every command passed
(git status --short: 46 lines before and after the run)

# Brief check 2
npx vitest run tests/server/root/watch/glob-drop.test.ts tests/data/hubs/deck-globs.test.ts tests/server/edit/deck/deck-globs.test.ts --reporter=dot
 Test Files  3 passed (3) | Tests  31 passed (31)
npx vitest run tests/server/root/watch/deck-folders.test.ts --testTimeout 20000 --reporter=verbose
 Test Files  1 passed (1) | Tests  10 passed (10)
the report's fast set (13 files) --tagsFilter '!slow': Test Files  10 passed | 3 skipped (13); Tests  141 passed | 43 skipped (184)

# Brief check 3, the perl ASCII form over src tests bin config (local.yml excluded), the three diagrams and O159-report.md: exit 0, no output
# Brief check 4, largest changed file: 871 tests/data/sources/present.test.ts (every file at or under 880)
# Brief check 5, sh utils/folder-check.sh: exit 0
# Brief check 6, unused-exports diff against the base: exit 0
# Brief check 7, the history word list over the 338 added comment lines and titles: 'before' 10 times, each a run-time order; no history
# Brief check 8 / C16, node .agents/O159-time.ts over a scratch copy of tests/fixtures/hubs/demo, after the round's last change
before (a fresh store per read, 10 reads): mean 8.6 ms, sd 1.0 ms
after (one warm store, 10 reads): mean 6.9 ms, sd 0.7 ms

# Round item 6, the report's program from its quoted source, over a scratch copy of the base: C1 walks = 2; C4 builds after the rename = 0 (reproduces)
# Reviewer probe of the rebuild rule through globWatch.heard (scratch, writes only under tmpdir)
filing folder holding a project moved in: rebuilds false
project folder moved in: rebuilds true
```

### Verdicts

Items: 1 to 5 hold; 6 violated (Spec 1), for one input: a filing folder that holds projects, moved into a scan folder from outside one, queues no rebuild; 7 to 10 hold; 11 holds for the builder's part (the G32 widening is the orchestrator's at landing).

Cases: C1 to C16 met. C11 is met in `tests/server/edit/deck/deck-globs.test.ts`, outside the brief's write list (first report, Spec 2).

Round items: 1, 2, 4, 5, 6 and 7 closed; 3 closed as the round's text reads, which leaves the filing-folder case of Spec 1 open; 8 closed in its statement, its example wrong (Proof 1).

### 1. Spec

- `src/lib/server/root/watch/portfolio/glob-drop.ts:124-125`: "const state = event.now(); if (state === 'folder') return event.manifest();", with `glob-watch.ts:79` "manifest: () => (manifest ??= projectFileIn(path) !== null)".
  - What is wrong: a folder that is there now rebuilds only when it is itself a project. The scan walks a filing folder to any depth (`nestedProjects`), so a filing folder holding projects, moved into a scan folder, changes the project set but queues no rebuild (the probe: rebuilds false). The gone branch counts ancestors, so the rule is asymmetric. The opposite error: a folder with a `project.yml` made inside a project rebuilds once, harmless. The report's "a folder counts as a project exactly when the next build would name it" and `portfolio.ts:21` are false for these inputs.
  - Failure scenario: the hub's `projects/archive` holds filing folders `failed/`, `phd/`, `published/`, `stopped/`; moving in a filing folder holding project `x` with a `present/` deck leaves `x` out of the snapshot and its deck out of the portfolio deck until another `.yml` or `.md` event, which brief item 6 forbids.
  - Fix inside the item: a folder now that lies inside no project folder of the last snapshot (`projectDirs`) rebuilds when it, or a folder below it walked as the scan walks, holds a manifest; a folder inside a snapshot project rebuilds nothing.
  - Verdict: item 6 violated.

### 2. Proof

- `O159-report.md`, "Host- and user-visible changes", the `path_outside` example with `deck/present.yml` and `talks/present.yml`: no build reads a deck at the hub's `talks/` (`decks.ts:129-132`, `read.ts:343-349`), so the example shows no difference. A correct example is two project decks, or the portfolio deck and one project deck. Failure scenario: the look builds the example and reads the unchanged result as the change missing. Verdict: none.
- `O159-report.md`: "The hub's scan folders are `projects/ideas`, `projects/active`, `projects/manuscripts` and `side-projects` (`.oculus/config.yml:7-15`)": the list is seven folders, `config.yml:7-21`, adding `projects/software`, `projects/coauthor` and `projects/archive`. The conclusion holds. Failure scenario: a reader tests the look against the wrong list. Verdict: none.
- `O159-report.md`, check 8: the 16.5 ms against 9.4 ms figures predate round item 1's change to `folder-globs.ts`; the run after the change gives 8.6 ms against 6.9 ms. No decision rests on it; the real-hub run at landing decides. Verdict: none.
- `O159-report.md`, "Open items of the state file, verbatim: None": quotes the worktree's base copy; the main state file holds open item 715. Verdict: none.

### 3. Standards

- `O159-report.md`, "Judgment calls": a reader of the session's own transcript was run from the scratchpad; it is not a case-run program and no ruling approves it. It changed no file of the step, and the item-6 program's output reproduces without it. Verdict: none.
- `audited.ts:22-25` and `glob-drop.ts:36-39`: two doc comments edited in the round are not rewrapped whole at 100 columns (line 23 ends 6 columns short of `attic`; `glob-drop.ts:37` ends where `two` fits). The report's claim that every changed paragraph was rewrapped is not reproduced for these two. Verdict: none.
- `folder-globs.ts:13-14`, `:19-22`, `:41-43`: rewrapped with no word changed and no round item asking for it; the report lists the head comment under "Rewritten or new" without saying so. Verdict: none.

### 4. Behaviour

- None beyond Spec 1, whose two inputs are also host-visible changes the report does not state.

### Declined to judge

- `git diff --quiet HEAD -- package.json`: a git form outside the three allowed; `git diff 2e8c2c4dd -- package.json` printed nothing.
- Whether `.agents/O159-time.ts` is ignored by git.
- The transcript reader's source and output: not quoted, removed.
- A run of round item 6 in the base copy in place, rather than on a copy with a `node_modules` link.
- The real server's route key spelling beyond the fixture: settled by the real-hub timing at landing.
- The real-hub measurement of item 9, the look on the Present view and the G32 widening: the orchestrator's at landing.
- The watcher off darwin.

Reviewer usage: ab49ab10318c7d20f, claude-opus-5-5, 252595 tokens, 62 tool uses, 16.4 min
