# O159 brief check

12 findings (C-1 to C-12). I changed no file. The git commands I ran were `git log`, `git grep`, `git ls-tree` and `git ls-files`, plus one `git check-ignore`; all of them only read. The worktree `.agents/worktrees/migration-O159` and the base copy `.agents/worktrees/O159-base` did not exist when I checked (`ls -d` printed "No such file or directory" for both).

C-1. Section "What is on the tree", bullet "The watcher", and "What to build" item 4.
Command: `grep -n "scan\|dir:" ~/workspace/research-hub/.oculus/config.yml` prints the scan list at lines 7-21: `{ dir: projects/ideas }`, `side-projects`, `projects/active`, `projects/manuscripts`, `projects/software`, `projects/coauthor`, `projects/archive`. `ls ~/workspace/research-hub/projects` prints only those tiers. `roleDirectories` (`src/lib/server/root/watch/portfolio/reads.ts:99-114`) adds the roots' `.oculus` folders, the scan folders, the folders of the registry, collection and feed files, and the portfolio deck folder. It never adds the hub root or `projects/`.
What is wrong: the premise "a hub's scan tiers such as `projects/` recursively" is false. No handle watches `projects/` itself, and no recursive handle watches the hub root. The fixed part of the real portfolio glob, `projects`, lies above the watched folders. So under item 4's own rule, the real hub needs the extra recursive handle on `projects/`, and a root-walking pattern such as `**/present` needs one on the hub root. Item 4 leaves both to "the builder checks".
Change: state both facts in the brief, so item 4 opens a recursive handle on `projects/` for the research hub's portfolio deck. Build the fixture of C3 to C5 in the real hub's shape: scan tiers under `projects/`, and a glob `projects/**/present` whose fixed part is above them. That way the cases exercise the extra handle.

C-2. Decision 2, item 4 ("a watch event whose type is rename and whose path lies under a held key's root drops that key"), and case C6.
Commands:
- `grep -n "Atomic" src/lib/server/files/source/*.ts` prints `source.ts:339: writeBytesAtomic(real, written)`, the source tab's save.
- `grep -n writeTextAtomic .../deck/*.ts` prints `deck-files.ts:222,246,280,293,352,453`, `deck-new.ts:65,117` and `deck.ts:150`.
- `src/lib/server/core/json.ts:156-161`: `writeAtomic` is `writeFileAtomic.sync`, which writes a temporary file and renames it over the target.
- `manifest.ts:776-777` writes project files the same way.
What is wrong: every save oculus makes inside a hub is a rename. That covers a slide saved in the source tab, every deck act and every manifest write. Under the brief's rule each one drops the key, so the next Present read walks the 1.3 s again. That happens exactly in the common sequence: edit a slide, then look at the deck. Decision 2 calls this "one walk after such a save", but it is every save. C6 rewrites the slide with `writeFileSync`, which no oculus save uses, so C6 never runs the path that matters. Darwin's FSEvents can also report an in-place write to a file made just before as `rename`, so C6 is not stable on a fresh fixture. The rule also drops on any rename under the hub root, for example a write to `.oculus/data/*.yml`. Ruling 697 says "under the glob's root", which is the pattern's fixed part.
Change: scope the drop to the pattern's fixed part, and drop on a `rename` only when one of these holds:
- the path is a folder now;
- the path is gone and is a held match or an ancestor of one (a prefix test on the held strings);
- the path's last name is the pattern's last segment (`present.yml` for a file pattern).
A `write-file-atomic` save then drops nothing: its temporary name is gone and is no match, and its final name is a file. Rewrite C6 to save the slide through `writeBytesAtomic` (the source save) and expect the key kept. Decision 3's skip of `code/` and `attic/` stays. For a pattern whose fixed part is the hub root, the brief should also say that a rename under a dot folder drops nothing. That is my judgment: as far as I know, Node's `globSync` does not enter dot entries without the pattern naming them. I did not verify it; reading Node's glob options would settle it.

C-3. Item 4 ("The watcher hears every held glob") and item 1.
Commands: `src/lib/data/sources/deck/groups.ts:101` calls `finder.under(doc.root, find.folders, raise)` with the root the deck is in. `readDeck` (`src/lib/server/content/deck/read.ts:71-107`) takes any served root (`source.roots`). The watcher watches only hub folders (`watchHubFolders`, `portfolio.ts:535-584`), and only at a rebuild.
What is wrong: a deck in a workspace folder that is no hub makes a held key that no handle ever hears. Today a deck folder added there is seen at the next read; with the store it would never be seen until a restart. A key that a deck route read takes between two rebuilds also has no handle until the next rebuild. The brief does not say when the watcher learns of a key.
Change: the store's factory takes a listener that is called when the store takes a new key. The watcher opens the handle for that key's fixed part at that moment, under any root, and closes it with the others. The alternative: the store keeps matches only for roots a watcher hears and walks fresh for every other root. Either way, add the case: a deck in a root that is no hub, with a folder added after the first read, holds the new deck at the next read. Add a second case for a key first taken by a deck route read, followed by a folder change before any rebuild.

C-4. Case C4, and C3 to C5 "once the watcher has heard it".
Commands:
- `relevantTo` (`audited.ts:70-80`) passes an event only for a name ending in `.yml` or `.md`, or for an audit path.
- `src/lib/server/machine/lsp/held/watch.ts:6-8,58-59`: "the files inside a renamed folder raise no event of their own".
- The deck route builds its source from the snapshot's projects (`src/routes/api/(docs)/deck/+server.ts:18-31`, `projects: projects(locals.server.hub)`).
- The real deck's group is `find: { folders: [projects/**/present], tiers: [research] }` (`cat ~/workspace/research-hub/deck/present.yml`).
What is wrong: renaming `projects/b` to `projects/b2` queues no rebuild today. The snapshot keeps project b at `projects/b`, so `b2/present` is no project's deck, and a find with `tiers:` drops it. The drop alone does not make C4's "holds b2" true for the real deck's shape. C4 also has no signal to wait on: no publish follows, and the test rule allows no fixed sleep (`spec.md:70`).
Change: the watcher also queues a rebuild for a `rename` whose path is a folder (now, or as a held ancestor before) under a watched scan folder, outside `code/` and `attic/`. That is within the step's goal of a moved deck being shown. C3 to C5 then wait on the watcher's `built` hook after that rebuild. Each case names the read it checks: the deck route's `readDeck` over the rebuilt snapshot, with a `tiers:` filter as on the real hub.

C-5. Section "Cases", the last paragraph ("C1, C3 to C5, C9 and C11 are tests under the test rule"), and case C1.
Commands:
- `grep -n "^- G[0-9]*\." .scratch/migration/agents/guarded.md | grep -i deck`: no entry covers the watcher or the deck writes for this.
- G32 (`guarded.md:276-278`) has the Code line `src/lib/data/sources/`, `src/lib/data/index.ts` and `src/lib/server/content/deck/`, which does not include `src/lib/server/root/watch/` or `writes/config/lists/deck/`.
- `tests/server/root/watch/website-watch.test.ts:5` carries `// @module-tag slow: the watcher builds the portfolio ...`.
What is wrong: the brief names no guarded entry, and `spec.md:60` allows a test only as the test of one entry. Units outside the entry's Code line need the entry widened, or Axel's yes for a new one. Tests over a real `fs.watch` wait on the platform, so they are slow tests that must be run alone and named (`spec.md:59-60`). C1 counts walks "through the store, never by mocking node:fs", but the brief does not say how a test counts them.
Change: name the entry (G32, with its Code line widened to the store file, the watcher's drop file, `deck-new.ts` and `deck-undo.ts`, and the titles the orchestrator adds), or stop for Axel's yes on a new entry. Put the event-to-drop rule in a function of its own, tested by a table with one row per input of C-2's rule, in a fast file. Put C3 to C5 and C9 over the real watcher in a file tagged slow, run with `npx vitest run <file>` and named in the report. The store's factory takes the walk as a parameter, `globSync` by default, and C1 counts calls of the walk it passes.

C-6. "What to build" item 1 ("a new file under `src/lib/data/sources/deck/`"), and the paths line "new test files ... beside the deck and watcher tests".
Commands: `git ls-tree --name-only HEAD src/lib/data/sources/deck/ | wc -l` prints 10, as do `tests/data/sources` and `tests/server/root`. `sh utils/folder-check.sh` exits 0 today, and its rule refuses more than ten items.
What is wrong: the new file makes 11 items, and the folder check fails. A test beside `present.test.ts` or in `tests/server/root/` fails the same way.
Change: place the store in `src/lib/data/sources/documents/` (5 items, where `deckReader` lives), or split `deck/` into named subfolders in this step. Put the tests in `tests/data/hubs/` (9 items) and `tests/server/root/watch/` (2 items).

C-7. "Conventions" (the size limit) and the paths list.
Commands:
- `wc -l src/lib/server/root/context.ts` prints 900. `utils/size-allow.txt` holds only its four comment lines, and `tests/checks/tree/size.test.ts:62-76` refuses a count over 900.
- `wc -l` gives `portfolio.ts` 819, `src/lib/data/index.ts` 829 and `read.ts` 836.
What is wrong: context.ts is already over the rules file's 880 (`spec.md:48`). Building the store and handing it to `startPortfolio` and the ServerContext pushes it over 900, so the step must split it by concern. Item 4's drop rule, the extra handles and their comments will likely take `portfolio.ts` past 880.
Change: the brief names the split of `context.ts`, with its new file in the paths list. It puts the watcher's drop rule and the handles it opens in a new file under `src/lib/server/root/watch/portfolio/` (4 items), also listed.

C-8. Paths list, item 3, and decision 5.
Commands:
- `git grep -n "DeckSource\b" -- src tests` finds `src/routes/api/(docs)/deck/+server.ts:18` (`sourceOf` builds the route's DeckSource; `endpoint.ts` only receives it) and `tests/routes/docs/deck.test.ts:25,187` (DeckSource literals).
- `git grep -n "withDecks" -- tests` finds `tests/fixtures/hubs/hub-build.ts:34` and `tests/data/snapshot/reference-hub.ts:337`.
- `git grep -n ignoredCache -- tests` finds `tests/server/root/context-fixture.ts:198`, which builds a ServerContext.
- `git grep -ln "WriteTarget = {\|): WriteTarget\|as WriteTarget\|WriteTarget>" -- tests` lists 8 files.
- `target()` (`src/lib/server/edit/writes.ts:298-345`) builds the WriteTarget from an optional `server`.
What is wrong: the brief's grep leaves out `withDecks` and `DeckSource`. With the field required, the route file, `deck.test.ts`, `hub-build.ts`, `reference-hub.ts` and `context-fixture.ts` must change, and none is in the paths list. "WriteTarget or DeckSource, the builder's choice" leaves the write list open: `deckSourceOf(into, roots)` has only the WriteTarget in hand, so the store must ride on it.
Change: list those five files. Settle the route for the writes: `target()` takes the store from its `server` argument (the ServerContext), the WriteTarget carries it, and `deckSourceOf` reads it. Then list either the 8 test files that build a WriteTarget literal or the rule for a target built with no server. Say how `withDecks` and `buildHubs` take the store, since `readDecks` has no input object.

C-9. Item 5, decision 4, and case C11.
Commands: `createDeck` (`deck-new.ts:35-72`) makes no folder; it writes a `present.yml` into an existing folder (`put(DECK_FILE, ...)` at `:69`). `outlineDeck` makes `<stem>-slides` (`:105`). C2 names a pattern that ends in `present.yml`.
What is wrong: for a file pattern, the `present.yml` that `createDeck` writes is a new match the held key lacks. A read right after the act misses the deck until the watcher's event. Item 5 names only the folders the writes make or remove. C11 does not say which act it runs.
Change: item 5 drops for every path the deck acts make or remove: `createDeck`'s `present.yml`, `outlineDeck`'s folder, and the undo's `mkdirSync` and `rmdirSync`. C11 runs `outlineDeck` under a folder a group's glob covers and `createDeck` under a `present.yml` pattern, each read at once.

C-10. Item 5's scope, and question 3's other file operations.
Commands: `git grep -n "mkdirSync\|mkdir(\|rmSync\|rename(\|cp(\|trash" -- src/lib/server/files src/lib/server/edit ...` shows:
- the Files view: `ops.ts:294` (trash), `:342-343` (new folder), `:392` (move), `:448` (copy), `:459` (rename);
- its undo: `file-undo.ts:141,229-230`;
- the new-project write: `manifest.ts:774-775`;
- the app workspace writes: `apps/tools/workspace/writes.ts:167`.
What is wrong: these make, move or remove folders a deck glob can match, and the brief gives no rule for them.
Change: write the rule into the brief. None of these reads a deck in its own request. The page reads a deck only on a later press, or after the publish that follows the watcher's event, and the watcher drops at the event before the debounce. So they rely on the watcher, through the handles of C-1 and C-3. Only the deck acts, whose own request and answer lead to a deck read, drop at the write. The rule holds only once C-1 and C-3 make every held glob heard.

C-11. Item 7 and case C13.
Commands:
- `ls node_modules/tsx` prints "No such file or directory". `package-lock.json:9654,9688` names `tsx` only as an optional peer of vite.
- `package.json:8`: `"predev": "node src/lib/server/root/process/start/first-run.ts"`; Node 24 strips the types itself.
- `tests/checks/config/integrity.test.ts:98-101,180-192` read the real hub's decks with no server (`loadConfig`, `portfolioConfigFrom`, `buildOneHub`, `mergeHubs`, `deckReader`).
- `spec.md:38`: "Four things read the real hub and nothing else".
What is wrong:
- `npx tsx` would fetch a package the brief does not name.
- The "after" run reads ten times through one store, so its first read walks and the mean carries one 1.3 s walk. The server's store is already warm from the snapshot build at start.
- The brief does not say that the fresh-store run stands for "before": it is the same one walk per read as the unchanged tree's one reader per read.
- The program reads the real hub, and the rules file allows four named tests and nothing else to do that.
The program itself can be built without a server, along the integrity test's path, through `readDeck` with a DeckSource made from those reads.
Change: run it as `node .agents/O159-time.ts`. In the after run, make one untimed read before the ten timed ones. Say why the fresh-store run is the before figure. Say that it times the server's answer to a filter change (`readDeck` with `keep`; through `handleDeck` if the JSON answer should count), and that the request and the draw are untouched by the step. Either record the real-hub read as allowed by the step line, which asks for the research hub, or raise it as a rule clash for the orchestrator.

C-12. Line numbers and wording under "What is on the tree".
Commands:
- `grep -n "export type DeckSource" src/lib/server/content/deck/read.ts` prints 42; the type spans 42-50, and the brief says `:41-49`.
- `git grep -n withDecks` prints `index.ts:376`; the brief says `:375`.
- `deckReader` spans `decks.ts:85-97`; the brief says `:87-99`.
- `grep -n "const watchHubFolders"` prints 535; the brief says `532-584`.
- `IgnoredCache` and `ignoredCache()` span `fs.ts:179-184`.
- "Every handle passes an event on only when relevant(filename) holds" is overstated: `openParent` (`portfolio.ts:311`) passes `filename === wanted`, `openRootFolder`'s filter (`:513`) passes `null` and `.oculus`, `watchFile` passes by name, and the LinkedIn handle passes `isLinkedinFile`. Only the hub-folder handles use `relevant`, and those also need `named`.
Change: correct the numbers. Say that the drop hook sits in `open`'s callback (`:274`) before `accepts`, on the recursive handles and on the new ones.

Holds
- ADR folder: `test -d docs/adr || echo "no docs/adr"` prints "no docs/adr".
- Verification page: `grep -n verification .agents/plan.yaml` prints `verification: .scratch/migration/orchestrator-state.md`.
- Ruling 697 and the step line: `sed -n '1700,1712p;3590,3610p' .scratch/migration/plan.md` shows O159's line and "Open item 697 (2026-11-06): (a), step O159, ... (b) ... was the lazy option".
- Deck count: `find projects -name present -type d | wc -l` in the research hub prints 25. `find projects -path '*/code/*' -name present.yml | wc -l` prints 0, and the same for `attic/` prints 0. The 1466 / 863 / 996 ms timings were not re-run (this check writes no program).
- The reader: `createReader` at `read.ts:208`, `globbed` at `:217`, and `under` at `:340` with the `..` and absolute refusal, the key `${root.dir}\n${pattern}`, `globSync(pattern, { cwd: root.dir })`, `resolveIn`, `path_outside`, the `present.yml` folder rule and `existsSync(join(dir, DECK_FILE))` (`sed -n '200,245p;330,370p'`). `git grep -n "DeckContext\b" -- src tests` prints only `read.ts:78` and `:208`.
- Who makes a reader: `git grep -n "createReader("` finds `decks.ts:87` in src and `present.test.ts:180,290,688,795`. `deckReader(` is called from `decks.ts:120`, `content/deck/read.ts:96`, `integrity.test.ts:101,328` and `deck-hub.ts:243`. `readDecks(` only from `index.ts:312`. Server `readDeck(` from `endpoint.ts:77,106`, `deck-files.ts:147` and `deck.ts:212` (`state/life/present.svelte.ts:261` is the client's fetch of the same name).
- The build path: `buildHubs` at `build.ts:139`, `withDecks` at `:146`, called from `portfolio.ts:677`. `decked` at `index.ts:311`. `watchPortfolio` at `portfolio.ts:221`, started by `startPortfolio` at `context.ts:335-361`. `deckSourceOf` at `deck-files.ts:94`.
- The brief's test-file grep, rerun, lists the same 11 files.
- ServerContext: the head comment of `server-context.ts:1-5` matches. `ignoredCache: ignoredCache()` at `context.ts:625`, `server.ignoredCache` at `fs/+server.ts:50`.
- The watcher's filter: `relevantTo` at `audited.ts:70-80`, `NEVER = ['code', 'attic']` at `:26`; the callback `(_event, filename)` at `portfolio.ts:274`.
- The deck writes: `mkdirSync(folder)` at `deck-new.ts:105`; `mkdirSync(..., { recursive: true })` at `deck-undo.ts:72,93`; `rmdirSync` at `:82`; `rmSync` imported at `:14`.
- `docs/decks.md:111-112` describe `find.folders` and say nothing of when the folders are found. O158's brief writes `docs/decks.md` lines 383-393 (its paths section), so the two steps share no lines.
- `fs.watch` on darwin: the recursive watch reports a folder add, rename and remove as a `rename` with the folder's relative path. The evidence is the Markdown server's watch (`held/watch.ts:105,139,148`: one recursive `fs.watch`, `event === 'rename'`, a folder's own name handed over apart) and its G72 slow test "a folder moved after the first references is listed at its new path". Node's documentation gives the relative path and the two event types. A `rename` is also what every atomic save gives (C-2).
- The five decisions: none is a public shape, a config key, a vocabulary or a wire format. Decisions 1, 3 and 5 are sound. Decision 2 is not (C-2). Decision 4 is too narrow (C-9).
- The libraries line: no dependency is needed for the store.
- The timing program path `.agents/O159-time.ts` is ignored: `.gitignore:12-13` holds `.agents/*` and `!.agents/plan.yaml`.
- `npm run test:quick` is named once, and the base `unused-exports.txt` path follows the spec's base copy rule.

Usage: a1e03b87281fab689, claude-opus-5-5, 250038 tokens, 80 tool uses, 13.5 min

## Closed

- C-1: the watched folders stated (no handle on `projects/` or the hub root); item 4 opens a recursive handle on each held key's fixed part, `projects/` for the hub's portfolio deck; the fixture of C3 to C5 is in the hub's shape.
- C-2: item 5's drop rule (a folder now, a gone held match or ancestor, the pattern's last segment; never `change`, never under code/attic, scoped to the fixed part), its own file and table test C15; decision 2 rewritten; C6 saves through `writeBytesAtomic`; the dot-folder point settled by the builder's reading of Node's documentation, quoted.
- C-3: the store's listener on a new key opens the handle at that moment under any root; cases C13 and C14 added.
- C-4: item 6, a folder rename under a scan folder queues a rebuild; C3 to C5 wait on the `built` hook and read through `readDeck` with the `tiers:` filter.
- C-5: item 11 and decision 7, G32's Code line widened by the orchestrator at landing; the drop rule's table test is fast; the real-watcher cases in one slow file run alone; the walk is a factory parameter, so C1 counts its calls.
- C-6: the store in `src/lib/data/sources/documents/`; tests in `tests/data/hubs/`, `tests/server/root/watch/` and `tests/server/edit/deck/`.
- C-7: item 10, `context.ts` split by concern into `src/lib/server/root/process/context/`; the drop rule in a new file under `watch/portfolio/`; both in the paths.
- C-8: the route file, `deck.test.ts`, `hub-build.ts`, `reference-hub.ts` and `context-fixture.ts` in the paths; the writes take the store through `target()`'s `server`, the `WriteTarget` and `deckSourceOf`; a target with no server carries a fresh store; how `buildHubs`, `withDecks` and `readDecks` take it is the builder's, named in the report.
- C-9: item 7 drops for `createDeck`'s `present.yml`, `outlineDeck`'s folder and the undo's folders; C11 runs both acts.
- C-10: item 7 states the rule for the other folder writes: they rely on the watcher through items 4 and 5.
- C-11: item 9 runs with `node`, one untimed read before the after run, the fresh-store run stated as the before figure, the server's answer to a filter change named; the builder runs it on a fixture only and the orchestrator over the real hub at landing (decision 8), so no builder program reads the real hub.
- C-12: the line numbers corrected (`DeckSource` 42-50, `withDecks` 376, `deckReader` 85-97, `watchHubFolders` 535-584, `IgnoredCache` 179-184) and the handles' filters stated one by one; the drop runs in `open`'s callback before `accepts`.
