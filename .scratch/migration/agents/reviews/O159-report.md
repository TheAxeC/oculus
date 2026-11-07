# O159 builder report: one folder search per hub

NOT done: check 1 of "Verify before you report". The one `npm run test:quick` run after the last change of repair round 1 did not print `every command passed`. It had two red lines, both time-outs. Neither red file is a file the step changed, and each passes when run alone, so the list was not run again. Every item of "What to build" and every item of repair round 1 is built, and every other check holds. Item 9's run over `~/workspace/research-hub` is the orchestrator's at landing, as the brief says. The builder ran it over a synthetic fixture hub only (C16 below).

## Open items of the state file, verbatim

From `.scratch/migration/orchestrator-state.md:203-207` in the worktree:

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

None.
```

## Repair round 1, item by item

| Item | State | Proof |
| --- | --- | --- |
| 1 The last-segment test | DONE | `glob-drop.ts` `namedBy`; C15 rows for `slides/*` pass |
| 2 One `NEVER` | DONE | `audited.ts:27` exports it; `glob-drop.ts:31` imports it; the second list is gone |
| 3 A rebuild only when the project set can change | DONE | `glob-drop.ts` `movedFolder`; the rebuild rows of `glob-drop.test.ts` and the slow case pass; C4 passes |
| 4 The route reads warm | DONE | the slow case through the route's `GET` passes with one walk; no spelling differed, so no code changed |
| 5 The script-made edit redone | DONE | the file written again whole with Write; the diff is below |
| 6 The first run quoted | DONE | source and output below |
| 7 The rules file's forms | DONE | checks 3 and 7 below |
| 8 `path_outside` in the report | DONE | "Host- and user-visible changes" |

### Item 1

`glob-drop.ts:74-77`:

```ts
function namedBy(name: string, last: string): boolean {
    if (!isGlob(last)) return name === last;
    return name === DECK_FILE && matchesGlob(name, last);
}
```

`droppedKeys` drops a key by its last name only when `namedBy(name, last)` holds. For a last segment with no glob character the name must equal it. For one with a glob character the name must be `present.yml` and match it. `isGlob` is a new export of `folder-globs.ts`, which `fixedPart` also uses, so one test of the glob characters serves both places. The head comment of `glob-drop.ts` is rewritten to match: "A save drops a key only when the file it renames into place is named by the pattern's last segment, as a `present.yml` saved under `projects/*/present.yml` or `slides/*` is".

The C15 file holds a third key, `slides/*`, held with the match `slides/one`. It has three new rows:

- 'the temporary name of a slide save under slides/* drops nothing' (`slides/one/main.md.2215404123`, gone);
- 'a slide file renamed into place under slides/* drops nothing' (`slides/one/main.md`, file);
- 'a present.yml renamed into slides/one/ drops the key of slides/*' (`slides/one/present.yml`, file).

### Item 2

`audited.ts:22-27`: `export const NEVER: readonly string[] = ['code', 'attic'];`, its doc now ending "The file filter here and the folder-glob drop rule (glob-drop.ts) both leave them out." `glob-drop.ts` imports it in `heardBy` and `movedFolder` and defines no list of its own. `audited.ts` is outside the brief's write list; the round's item 2 names it.

### Item 3

`movedFolder` in `glob-drop.ts:101-132` takes a `rename` below one of the scan folders, outside `code/`, `attic/` and every dot folder, and answers true only when:

- the path is a folder now that holds a project manifest (`event.manifest()`, which is `projectFileIn(path) !== null` from `data/sources/manifests.ts`, asked only for a folder);
- or the path is gone and is a project folder the last snapshot names or the folder above one (`within(path, dir)` over `projects`);
- or the path is gone and is a held key's match or the folder above one (`wasMatch`).

A file renamed into place, a folder that holds no manifest and a `change` event answer false. The project folders come from `portfolio.ts:737-743`: after each build, `projectDirs` is the folder of every project the snapshot names, joined to its root's folder, or the folder itself for a project of a repository, whose folder is absolute. `globWatch` takes them as `projects: () => projectDirs`. The head comments of `glob-drop.ts`, `glob-watch.ts` and `portfolio.ts` say the narrowed rule.

The tests:

- `glob-drop.test.ts`, describe 'the events that rebuild the snapshot, the rule of case C4', ten rows. Among them: a folder made that holds a manifest rebuilds; `projects/active/a/results/run1` made rebuilds nothing; a gone project folder of the snapshot, a gone folder above one (`projects/active/group`) and a gone held match each rebuild; a manifest folder under `code/` or a dot folder, a file and a `change` event rebuild nothing.
- `deck-folders.test.ts`, 'rebuilds nothing for a folder made inside a project'. It makes `projects/active/a/results/run1`, then a fence file, waits on the fence key's drop, and so on both folders' events having been heard. It then runs the watcher's debounce on faked `setTimeout`, `clearTimeout` and `Date`, installed before the `mkdir`, by `vi.advanceTimersByTime(1000)`, and asserts `builds.count()` unchanged. lodash's `debounce` reads `setTimeout` and `Date.now` at call time (`node_modules/lodash-es/debounce.js:103`, `now.js:20`), so a rebuild the events queued would run inside that advance.
- C4 passes in the same run (below).

### Item 4

`deck-folders.test.ts`, 'reads the deck the build read through the deck route with no walk of its own':

- The watcher's first build walks `projects/**/present` once (`globs.walks(PATTERN)` is 1). `walks` counts by pattern over every folder, so a route walk under a differently spelled folder would count too.
- It then builds `contextFixture({ hub: channels, workspace, engine: engineDir(), deckGlobs: globs.source.store })` and calls the route module's `GET` (`src/routes/api/(docs)/deck/+server.ts`) with `locals = { server: context, token: context.token, config: () => context.configCache.read() }`, the shape `hooks.server.ts:186-188` gives.
- The request is `?root=hub&path=deck` with the token header.
- It asserts status 200, the group's members equal to the three start folders, and `globs.walks(PATTERN)` still 1.

It passes, so the route's key `${open.roots[].dir}\n${pattern}` is the build's key. Both folders come from `read.folders[].dir` in `open.ts`. No code changed for this item.

### Item 5

The file was copied to `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/O159-before-redo/tests/data/hubs/deck-globs.test.ts` and written again whole with Write. No later change was needed. `diff <copy> tests/data/hubs/deck-globs.test.ts`:

```
3c3
< // store, and each reader still raises its own findings and tests each matched folder for its
---
> // store, and each reader raises its own findings and tests each matched folder for its
```

The one difference drops `still`, a word on the rules file's history-word list. The greedy fill of that paragraph at 100 columns is unchanged, since the next word, `` `present.yml`, ``, does not fit on the line. The copy is kept so the reviewer can run the diff again.

### Item 6

The program was written again as a scratch file, `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/O159-first-run.ts`, and run over the unchanged tree. The base copy holds only `config`, `src`, `tests`, `utils` and `unused-exports.txt`, with no `package.json` and no `node_modules`. Run in place, it would load its packages from the main checkout's `node_modules`.

So the four folders were copied to `<scratchpad>/O159-base-run/`, with the worktree's `package.json` (`git diff --quiet HEAD -- package.json` holds) and a link to the worktree's `node_modules`. `diff -rq` of the copy's `src`, `tests` and `config` against the base copy printed nothing.

The command was `node <scratchpad>/O159-first-run.ts <scratchpad>/O159-base-run`, on Node v24.21.0. The program and the copy were removed after the run. Its source:

```ts
// Case-run program of C1 (walks of two readers) and C4 (a rename of a project folder under a scan
// folder, and whether the watcher rebuilds), run on a tree given as the first argument. Prints only;
// every folder it makes is under the system temporary directory and is removed at the end.
import fs, {
    appendFileSync,
    cpSync,
    mkdirSync,
    mkdtempSync,
    renameSync,
    rmSync,
    writeFileSync
} from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const W = process.argv[2];
let walks = 0;
const original = fs.globSync;
(fs as { globSync: unknown }).globSync = (...args: Parameters<typeof original>) => {
    walks += 1;
    return original(...args);
};
syncBuiltinESMExports();

const { createReader } = await import(`${W}/src/lib/data/sources/deck/read.ts`);
const { deckOrderOf } = await import(`${W}/src/lib/data/shapes/boards/order.ts`);
const config = await import(`${W}/src/lib/data/sources/config.ts`);
const VOCAB = config.loadConfig(W).config;

const base = mkdtempSync(join(tmpdir(), 'o159-first-'));
const plant = (dir: string, rel: string, text: string): void => {
    mkdirSync(join(dir, rel, '..'), { recursive: true });
    writeFileSync(join(dir, rel), text);
};

// C1: one deck whose group finds its members by a folder glob, read through two readers.
const hub = join(base, 'c1');
plant(
    hub,
    'deck/present.yml',
    "groups:\n    found:\n        find: { folders: ['projects/**/present'] }\n        discover: true\norder:\n    - title.md\n    - { slides: found }\n"
);
plant(hub, 'deck/title.md', '# P\n');
for (const id of ['a', 'b']) {
    plant(hub, `projects/active/${id}/present/present.yml`, 'order: [main.md]\n');
    plant(hub, `projects/active/${id}/present/main.md`, `# ${id}\n`);
}
const context = {
    hub: { key: 'hub', dir: hub },
    projects: [],
    tagTones: {},
    frame: config.frameSetting(VOCAB),
    catalog: config.textCatalog(VOCAB),
    order: deckOrderOf(VOCAB)
};
walks = 0;
createReader(context).read({ key: 'hub', dir: hub }, 'deck');
createReader(context).read({ key: 'hub', dir: hub }, 'deck');
console.log(`C1: walks of two readers = ${walks}`);

// C4: the watcher over a copy of the demo hub with two scan folders; one project folder renamed.
const { watchPortfolio } = await import(`${W}/src/lib/server/root/watch/portfolio/portfolio.ts`);
const { Hub } = await import(`${W}/src/lib/server/core/channels.ts`);
const { writeState } = await import(`${W}/src/lib/server/files/workspace/state.ts`);
const { openWorkspace } = await import(`${W}/src/lib/server/files/workspace/open.ts`);
const state = join(base, 'state');
mkdirSync(state);
const dir = join(base, 'hub');
writeState(state, {
    open: null,
    recent: [],
    unsaved: { folders: [{ name: 'hub', path: dir }], primary: 'hub' }
});
cpSync(join(W, 'tests/fixtures/hubs/demo'), dir, { recursive: true });
rmSync(join(dir, 'projects'), { recursive: true, force: true });
appendFileSync(
    join(dir, '.oculus/config.yml'),
    '\nscan:\n  - { dir: projects/active }\n  - { dir: projects/archive }\n'
);
for (const id of ['a', 'b']) {
    plant(dir, `projects/active/${id}/project.yml`, 'tier: research\nstage: in-prep\ntitle: A project\n');
    plant(dir, `projects/active/${id}/present/present.yml`, 'order: [main.md]\n');
    plant(dir, `projects/active/${id}/present/main.md`, '# The slide\n');
}
const channels = new Hub();
let builds = 0;
const watcher = watchPortfolio(
    channels,
    {
        engine: W,
        icons: { set: {} },
        host: { name: 'test', address: '127.0.0.1' },
        open: () => openWorkspace(state),
        settings: (h: string) => config.loadConfig(W, { hub: h }),
        defaults: () => config.loadConfig(W),
        problems: () => [],
        self: () => ''
    },
    { debounce: 20, built: () => (builds += 1) }
);
await new Promise((done) => setTimeout(done, 500));
const before = builds;
renameSync(join(dir, 'projects/active/b'), join(dir, 'projects/active/b2'));
await new Promise((done) => setTimeout(done, 1500));
const projects = channels.latest('portfolio').payload.entities.projects;
const folders = Object.values(projects)
    .map((one) => (one as { folder: string }).folder)
    .sort();
console.log(
    `C4: builds after the rename = ${builds - before}; snapshot folders = ${JSON.stringify(folders)}`
);
watcher.close();
rmSync(base, { recursive: true, force: true });
```

Its output, exit 0:

```
C1: walks of two readers = 2
C4: builds after the rename = 0; snapshot folders = ["projects/active/a","projects/active/b"]
```

On the unchanged tree, two readers walk the pattern twice. A folder renamed under a scan folder rebuilds nothing, and the snapshot keeps naming `b`. The fixed waits are in a case-run program only; no test waits on a timer.

### Items 7 and 8

These are under checks 3 and 7 below, and under "Host- and user-visible changes".

## The cases' first run, on the unchanged tree

Each new test file was run with `npx vitest run <file>` before any source change. Each failed to load on the missing store module, `Error: Cannot find module '.../src/lib/data/sources/documents/folder-globs.ts'`:

- `tests/data/hubs/deck-globs.test.ts` (C1, C2, C8, C10, C12);
- `tests/server/root/watch/glob-drop.test.ts` (C15);
- `tests/server/root/watch/deck-folders.test.ts` (C3 to C7, C9, C13, C14);
- `tests/server/edit/deck/deck-globs.test.ts` (C11).

C1 and C4 were also run by the case-run program of item 6, with the output quoted there. The other cases on the unchanged tree:

- C2, C8, C10 and C12 compare a held key with a fresh walk, or read through one store, which the unchanged tree has not.
- C3 and C5 add or remove a folder that holds a `project.yml`. The unchanged watcher hears the `.yml` event, so they hold there too.
- C6, C7, C9, C13, C14 and C15 are behaviour of the store and its drop rule.
- C11's act and read hold on the unchanged tree, since every reader walks afresh.
- C16 reads through the store. The brief takes the fresh-store run as the before figure.

## DONE / NOT DONE

| Item of "What to build" | State | Proof |
| --- | --- | --- |
| 1 The store | DONE | `folder-globs.ts`; C1, C2 pass |
| 2 The reader reads through it | DONE | `deck/read.ts` `under`; C2, C8, C10, C12 pass |
| 3 One store, every caller names it | DONE | `npx tsc --noEmit -p tsconfig.json` exit 0 with the field required |
| 4 Every held glob is heard | DONE | `glob-watch.ts` `take`; C13, C14 pass |
| 5 The drop rule | DONE | `glob-drop.ts` `droppedKeys`; C15's 15 rows pass |
| 6 A project folder moved queues a rebuild | DONE | `glob-drop.ts` `movedFolder`; C4 and the rule's 10 rows pass |
| 7 The deck acts drop at the write | DONE | `deck-new.ts`, `deck-undo.ts`; C11 passes |
| 8 The words | DONE | head comments below |
| 9 The measurement | DONE | C16 below |
| 10 The sizes | DONE | `wc -l` below |
| 11 The guarded entry | DONE for the builder | tests listed below; the G32 widening in `guarded.md` is the orchestrator's |

The checks of "Verify before you report", run after the last change:

1. `npm run test:quick` after `npm run diagrams` (`diagrams exit 0`): NOT green.
   - `test:quick: 46 changed file(s), from git since HEAD`, `test:quick: 142 test file(s)`, `test:quick: 534.1 s; failed: vitest, vitest slow`.
   - `ok` lines: prettier, the ASCII gate, svelte-kit sync, eslint, svelte-check (`585 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`), vitest checks.
   - `vitest`: `Tests  1 failed | 1176 passed | 667 skipped (1844)`. The red line is `tests/server/edit/app-store.test.ts > writes the store of an app as the app-store kind > a file over the limit, which holds no value to compare, so the write goes ahead`, `Error: Test timed out in 5000ms.`. Alone (`npx vitest run tests/server/edit/app-store.test.ts --tagsFilter '!slow' --testTimeout 5000`): `Tests  15 passed (15)`.
   - `vitest slow`: `Tests  1 failed | 666 passed | 229 skipped (896)`. The red line is `tests/data/hubs/hub-portfolio.test.ts > the portfolio of several hubs > keeps a primary-hub id that begins with the name of a hub folder and a colon as a record of the primary, with no finding`, `Error: Test timed out in 20000ms.`. Alone (`--tagsFilter slow --testTimeout 20000`): `Tests  16 passed (16)`, that test in 2314ms.
   - The vitest import times were 352.52 s and 332.54 s, under the load of the other agents running on the machine.
   - Neither red file is one the step changed (neither is in the `diff -rq` list below), so the list was not run again.
   - Full-list runs in this round: 1. Full-list runs over the step, round one's two included: 3. No whole-suite command was run.
2. The changed and new test files, and the test files that import a file changed in this round:
   - `npx vitest run tests/server/root/watch/glob-drop.test.ts`: `Tests  25 passed (25)`.
   - The slow file alone, `npx vitest run tests/server/root/watch/deck-folders.test.ts --testTimeout 20000` (the slow lane's limit, `package.json` `test:slow`): `Tests  10 passed (10)`. It lists C3 2395ms, C4 2204ms, C5 2302ms, C6 1475ms, C7 1146ms, the case of a folder made inside a project 1081ms, the case of the route 1127ms, C9 3125ms, C13 1293ms and C14 1446ms.
   - The fast files together, with `--tagsFilter '!slow' --reporter=dot`: `deck-globs` (data and edit), `hub-portfolio`, `self`, `workspace-projects`, `references`, `manifests`, `present`, `glob-drop`, `items`, `choices`, `hub-words` and `routes/docs/deck`. The run printed `Test Files  10 passed | 3 skipped (13)`, `Tests  141 passed | 43 skipped (184)`.
   - The slow tests of the callers, each alone with `--tagsFilter slow --testTimeout 20000`:
     - `website-watch` `Tests  1 passed (1)`;
     - `routes/docs/deck` `Tests  4 passed (4)`;
     - `hub-portfolio` `Tests  16 passed (16)`;
     - `self` `Tests  17 passed (17)`;
     - `references` `Tests  6 passed | 34 skipped (40)`.
   - `tests/checks/config/integrity.test.ts` with `--testTimeout 0 --hookTimeout 0`: `Tests  7 passed | 7 skipped (14)`.
   - `eslint-switch.test.ts` and `workspace-follow.test.ts`, which run `watchPortfolio`: `Tests  1 passed (1)` and `Tests  6 passed (6)`.
3. The ASCII gate in the rules file's form, from the worktree's root:

   ```
   LC_ALL=C perl -ne 'my $l = $_; $l =~ s/\xC3[\x80-\xBF]//g if $ARGV =~ m{^config/}; print "$ARGV:$.:$_" if $l =~ /[^\x20-\x7E\n]/; close ARGV if eof' $(find src tests bin config -type f ! -name local.yml 2>/dev/null)
   ```

   It printed nothing, `gate exit 0`. There is no `bin` folder in the tree, so `find`'s message about it went to `/dev/null`. The same perl test over this report printed nothing.
4. `wc -l`: every changed file is at or under 880 (table below). `portfolio.ts` has 867 lines.
5. `sh utils/folder-check.sh`: printed nothing, exit 0.
6. `sh utils/unused-exports.sh` against `.agents/worktrees/O159-base/unused-exports.txt`: `diff` exit 0, no line added. The new exports `isGlob` and `NEVER` have production importers, `glob-drop.ts` for both and `folder-globs.ts` `fixedPart` for `isGlob`.
7. The history-word grep. The `>` lines of `diff` of each changed file against the base copy, and every line of each new file, were kept where they are a comment line or a test title, 339 lines. They were grepped with every word of the rules file's list and its package ids and dates, `always` included:

   ```
   grep -inE "\b(before|used to|no longer|still|always|as before|previously|the step adds|after this package lands)\b|\b[A-Z][0-9]{1,3}[a-z]?\b|\b20[0-9]{2}-[0-9]{2}(-[0-9]{2})?\b"
   ```

   No hit for `used to`, `no longer`, `still`, `always`, `as before`, `previously`, `the step adds`, `after this package lands`, a package id or a date. The hits:
   - `before`, each naming an order at run time or a place in a pattern, none an earlier state of the code:
     - `folder-globs.ts`: "The segments of the pattern before the first that holds a glob character";
     - `deck-new.ts`: "after the write and before its answer", "before the watcher's event can drop them";
     - `deck-undo.ts`: "the failure that puts them back included, before the answer";
     - `glob-watch.ts`: "before the debounce, so a deck read in the quiet before the rebuild already walks again";
     - `portfolio.ts`: "at the event, before the debounce", twice, and "The keys held before this rebuild", the keys the store holds when a rebuild starts;
     - `deck-folders.test.ts`: "checked to stay inside it before anything is made or removed there", "asked for before the change that makes it", and the title of C14, "drops a key a deck read took between two rebuilds at the event, before any rebuild (case C14)".
   - `C1` to `C15` and `G32`: the brief's case names and the guarded entry, in test titles and the slow file's head comment, as the brief asks. No package id appears.
8. C16, `node .agents/O159-time.ts <tmp>/demo`, run in round one over a copy of `tests/fixtures/hubs/demo/` in the scratchpad, with eight synthetic project decks added under `projects/active/synth-<n>/`, each with a `code/build/` folder. This round changed no file it reads, so the run was not repeated:

```
hub /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/time-hub/demo: 18 research projects, keep 9
with keep: 5 slides, 9 members; with no filter: 13 slides, 9 members
before (a fresh store per read, 10 reads): mean 16.5 ms, sd 18.1 ms
after (one warm store, 10 reads): mean 9.4 ms, sd 1.8 ms
```

## Files, from `diff -rq` against the base copy

`diff -rq .agents/worktrees/O159-base/<d> .agents/worktrees/migration-O159/<d>` for `config`, `src`, `tests` and `utils`, with line counts from `wc -l`. `config` and `utils` have no differences.

| Path | Lines | Note |
| --- | --- | --- |
| src/lib/data/index.ts | 840 | |
| src/lib/data/sources/deck/read.ts | 843 | |
| src/lib/data/sources/documents/decks.ts | 136 | |
| src/lib/data/sources/documents/folder-globs.ts | 134 | new, the store |
| src/lib/server/content/deck/read.ts | 116 | |
| src/lib/server/edit/writes.ts | 793 | |
| src/lib/server/edit/writes/config/lists/deck/deck-files.ts | 470 | |
| src/lib/server/edit/writes/config/lists/deck/deck-new.ts | 132 | |
| src/lib/server/edit/writes/config/lists/deck/deck-undo.ts | 125 | |
| src/lib/server/root/context.ts | 858 | |
| src/lib/server/root/process/context/config-parse.ts | 85 | new, the concern split out of context.ts |
| src/lib/server/root/process/server-context.ts | 219 | |
| src/lib/server/root/watch/build.ts | 242 | |
| src/lib/server/root/watch/portfolio/audited.ts | 103 | OUTSIDE the write list; repair round 1 item 2 names it |
| src/lib/server/root/watch/portfolio/glob-drop.ts | 132 | new, the drop rule and the rebuild rule |
| src/lib/server/root/watch/portfolio/glob-watch.ts | 148 | new, the handles of item 4 and the server's store |
| src/lib/server/root/watch/portfolio/portfolio.ts | 867 | |
| src/routes/api/(docs)/deck/+server.ts | 40 | |
| tests/checks/config/integrity.test.ts | 342 | |
| tests/data/hubs/deck-globs.test.ts | 211 | new |
| tests/data/hubs/hubs-fixture.ts | 134 | |
| tests/data/hubs/workspace-projects.test.ts | 164 | |
| tests/data/snapshot/reference-hub.ts | 390 | |
| tests/data/sources/manifests/manifests.test.ts | 779 | |
| tests/data/sources/present.test.ts | 871 | |
| tests/fixtures/hubs/deck-hub.ts | 422 | |
| tests/fixtures/hubs/deposit-world.ts | 83 | one of the 8 WriteTarget files, in the list |
| tests/fixtures/hubs/hub-build.ts | 40 | |
| tests/routes/docs/deck.test.ts | 201 | |
| tests/routes/edit/write-fixture.ts | 594 | OUTSIDE the write list: it builds `PrimaryTarget` literals (`targetOver`, `deckTarget`) that the type check requires to carry the store; the brief's grep matches only `WriteTarget` |
| tests/server/edit/deck/deck-globs.test.ts | 76 | new; OUTSIDE the write list, which names `deck-acts.test.ts` for C11; see "Brief errors" |
| tests/server/root/context-fixture.ts | 250 | |
| tests/server/root/watch/deck-folders.test.ts | 430 | new, slow |
| tests/server/root/watch/glob-drop.test.ts | 256 | new |
| tests/server/root/watch/website-watch.test.ts | 141 | |
| tests/state/boards/board/items.test.ts | 41 | |
| tests/state/forms/choices.test.ts | 212 | |
| tests/state/shared/hub-words.test.ts | 235 | |

`git status` also lists `docs/diagrams/layer-server.dot`, `layer-server.svg`, `layers.dot`, `layers.svg`, `writes.dot` and `writes.svg`, which `npm run diagrams` regenerated from the changed source. `.agents/O159-time.ts` (90 lines) is ignored by git.

Folder sizes (`ls | wc -l`): `src/lib/server/root/watch/portfolio/` 6, `src/lib/data/sources/documents/` 6, `tests/server/root/watch/` 4, `src/lib/server/root/process/context/` 9, `tests/data/hubs/` 10, `tests/server/edit/deck/` 3.

Three paths of the write list needed no change, since the type check accepts them as they are:

- `src/lib/server/edit/writes/config/lists/deck/deck.ts`, whose read goes through `deckSourceOf`;
- `tests/data/hubs/decks.test.ts`, which builds through `deck-hub.ts`;
- seven of the 8 `WriteTarget` files. `hosts-world.ts` and `write-log.ts` cast with `as unknown as WriteTarget`; `clone-after.test.ts` and `roots.test.ts` spread `target()`; `config-key.test.ts`, `hub-routing.test.ts` and `hub-writes.test.ts` spread a target that already carries the store.

## Tests under G32 (item 11), by file and title

- `tests/data/hubs/deck-globs.test.ts`, describe 'the folder globs a deck group finds its members by, read through one store':
  - 'walks a pattern once for two readers over one store (case C1)'
  - 'gives the decks and the findings of a fresh walk through a held key, a pattern ending in present.yml among them (case C2)'
  - 'reads a deck whose matched folder gets its present.yml after the walk, with no drop (case C8)'
  - 'raises the finding of a match that leaves the root through a link on every reader of the key (case C10)'
  - 'gives the slides of a fresh walk through a held key, for a read with drafts and a read with keep (case C12)'
- `tests/server/root/watch/glob-drop.test.ts`:
  - describe 'the keys one watch event drops (case C15)', `it.each` over 15 rows titled by `$row`;
  - describe 'the events that rebuild the snapshot, the rule of case C4', `it.each` over 10 rows.
- `tests/server/root/watch/deck-folders.test.ts` (`// @module-tag slow`), describe 'the portfolio deck over the folders of a hub, read through the server store (G32)':
  - 'holds a deck folder added under a scan folder after the rebuild (case C3)'
  - 'holds a moved deck folder at its new path with the tiers filter applied, after the rebuild (case C4)'
  - 'leaves a removed deck folder out after the rebuild (case C5)'
  - 'keeps the key through a save of a slide and reads the saved text with no walk (case C6)'
  - 'keeps the key when a folder is made inside a project code folder (case C7)'
  - 'rebuilds nothing for a folder made inside a project'
  - 'reads the deck the build read through the deck route with no walk of its own'
  - "drops the key of the hub a folder was added under and keeps the other hub's (case C9)"
  - 'holds a deck folder added under the glob of a workspace folder that is no hub (case C13)'
  - 'drops a key a deck read took between two rebuilds at the event, before any rebuild (case C14)'
- `tests/server/edit/deck/deck-globs.test.ts`, describe 'a deck act and the folder globs the server holds (case C11)': 'finds the deck an outline and a create made in a read made at once after each act'.

The rows of C15:

- 'a folder made under the fixed part drops both'
- 'a folder name gone that was a held match drops both'
- 'a gone name that is an ancestor of a held match drops both'
- 'a write-file-atomic temporary name gone drops nothing'
- "a file renamed into place whose name is not the pattern's last segment drops nothing"
- 'a present.yml renamed into place drops the key of the present.yml pattern'
- 'a change event drops nothing'
- 'a folder made under code/ drops nothing'
- 'a folder made under attic/ drops nothing'
- 'a folder made outside the fixed part drops nothing'
- 'a folder made under a dot folder the pattern does not name drops nothing'
- 'a folder made under another root drops nothing'
- 'the temporary name of a slide save under slides/* drops nothing'
- 'a slide file renamed into place under slides/* drops nothing'
- 'a present.yml renamed into slides/one/ drops the key of slides/*'

The rows of the rebuild rule:

- 'a folder made that holds a project manifest rebuilds'
- 'a folder made inside a project rebuilds nothing'
- 'a project folder of the snapshot gone rebuilds'
- 'a gone folder above a project folder of the snapshot rebuilds'
- 'a gone folder inside a project that is no held match rebuilds nothing'
- 'a gone held match rebuilds'
- 'a file renamed into place rebuilds nothing'
- 'a manifest folder made under code/ rebuilds nothing'
- 'a manifest folder made under a dot folder rebuilds nothing'
- 'a change event rebuilds nothing'

## Host- and user-visible changes

- A project folder moved, added or removed under a scan folder now queues a rebuild of the snapshot. The rule as built (`movedFolder`) applies to a `rename` under a scan folder, outside `code/`, `attic/` and dot folders. It rebuilds when the path is a folder now that holds a project manifest. It also rebuilds when the path is gone and was a project folder of the last snapshot, the folder above one, a held key's match, or the folder above a match. A folder made inside a project, such as `results/run1`, a figures folder under `manuscript/` or a `__pycache__`, queues no rebuild.
  - Before: the first run printed `C4: builds after the rename = 0; snapshot folders = ["projects/active/a","projects/active/b"]`. A folder renamed under a scan folder left the snapshot naming the old folder until some `.yml` or `.md` event came.
  - After: C4 passes, so the snapshot names `projects/active/b2` and the portfolio deck's `tiers: [research]` group holds `projects/active/b2/present`. The slow case shows `projects/active/a/results/run1` made leaves the build count unchanged.
- The server now holds a recursive watch on the research hub's `projects/` folder.
  - Why: the hub's portfolio deck finds its members by `find: { folders: [projects/**/present], tiers: [research] }` (`deck/present.yml:6`). That key's fixed folder is `projects`. The hub's scan folders are `projects/ideas`, `projects/active`, `projects/manuscripts` and `side-projects` (`.oculus/config.yml:7-15`), and none of them covers `projects`. So `glob-watch.ts` `take` opens its own recursive watch on `<hub>/projects`.
  - Before: no watch on `projects/` itself.
  - After: every event under `projects/`, inside `code/` and `attic/` folders included, reaches that handle's callback. The drop rule drops nothing for a path inside `code/`, `attic/` or a dot folder. Under `projects/` but outside the scan folders, an event can drop the portfolio key and never rebuilds.
- A deck read after a folder change shows the change at once (C14), without waiting for the rebuild.
  - Before: every read walked afresh.
  - After: a read walks a pattern only when its key is missing, and the watcher drops the key at the event. A deck act drops the keys covering the folder it made before it answers (C11).
- `path_outside` is now raised on every deck file of a reader that reads that pattern; the base raised it on the first.
  - Before: the base's reader kept the docs a pattern found in a per-reader cache, `globbed`. It raised `path_outside` for a match that leaves the root only on the cache miss, so within one reader only the first deck file that read a given root and pattern got it.
  - After: every read of the pattern resolves every match and raises the finding (`read.ts:359-364`), deduped per file by `raiseAt`.
  - Example: a hub whose `deck/present.yml` and `talks/present.yml` both have `find: { folders: ['shared/*'] }`, where `shared/link` is a link to a folder outside the hub. One snapshot build reads both decks through one reader. The base showed the finding on `deck/present.yml` only; now it shows on both files. C10 covers the finding on every reader of a held key.
- No deck's members, slides or drafts differ for a given state of the disk. C2 and C12 compare a held key with a fresh walk for decks, findings, drafts and `keep`. C8 shows a `present.yml` added to a matched folder is read with no drop.
- A filter change on the portfolio deck walks the hub only when the key is missing. Over the fixture hub of C16, a read takes a mean of 16.5 ms with a fresh store and 9.4 ms with a warm one. The real hub's figure is the orchestrator's run.

## Head comments, doc comments and docs

Rewritten or new:

- `folder-globs.ts`: the head comment (what the store holds, who owns it, what drops it), the `HeldGlob.fixed` doc and the `isGlob` doc.
- `glob-drop.ts`: the head comment, with the drop rule, the last-segment test, the Node dot-folder reading and the narrowed rebuild rule. Also the docs of `GlobEvent`, `namedBy` and `movedFolder`.
- `glob-watch.ts`: the head comment and the `globWatch` doc, which names `projects`.
- `audited.ts`: the `NEVER` doc.
- `portfolio.ts`: the head comment paragraph on folder events, now the narrowed rule; the `WatchPaths.globs` doc; the comments on `deep`, `scanned`, `projectDirs`, the drop in `open` and the `follow` after the rebuild.
- `src/lib/data/sources/deck/read.ts`: a head comment paragraph on the store, the `DeckContext.globs` doc and the `under` doc line.
- `decks.ts`: the `DeckInput.globs` doc and the `readDecks` doc.
- `src/lib/data/index.ts`: the `decked` and `withDecks` docs.
- `build.ts`: the `buildHubs` doc.
- `server-context.ts`: the `deckGlobs` doc.
- `context.ts`: the comment on `deckGlobs`; the display-language comment is now in `config-parse.ts`'s head comment.
- `src/lib/server/content/deck/read.ts`: the head comment paragraph and the `DeckSource.globs` doc.
- `src/routes/api/(docs)/deck/+server.ts`: the head comment sentence.
- `writes.ts`: the `WriteTarget.deckGlobs` doc and the `target()` doc.
- `deck-files.ts`: the `deckSourceOf` doc.
- `deck-new.ts` and `deck-undo.ts`: head comment paragraphs and the comment on `touched`.

Every comment paragraph changed in repair round 1 was rewrapped whole at 100 columns, greedily. No comment line is over 100 columns (`awk 'length > 100 && /^ *(\/\/|\*)/'` over the round's files printed nothing).

Still true:

- `docs/decks.md:112`: "Each folder that holds a `present.yml` is a deck the group finds, the deck itself left out." Every reader tests `present.yml` at every read (C8).
- `docs/decks.md:87` and `:111`: the examples of `find`.
- `grep -nE "find\.folders|folders:|glob|walk|renamed|moved|rebuild|path_outside"` over `docs/decks.md`, `docs/HELP.md` and `docs/data-map.md` finds no sentence about when a deck sees a new folder, when the snapshot rebuilds or where `path_outside` is raised. No docs sentence is made false, and none was changed.

## Judgment calls

- `buildHubs`, `withDecks` and `readDecks` take the store as a new last positional argument: `buildHubs(read, version, checker, engine, globs)`, `withDecks(hubs, globs)` and `readDecks(read, own, others, globs)`. `DeckContext`, `DeckSource`, `DeckInput` and `WriteTarget` take it as a required field, `globs`, or `deckGlobs` on the target.
- `WriteTarget` test files: of the 8 the brief's grep lists, only `tests/fixtures/hubs/deposit-world.ts` changed. `tests/routes/edit/write-fixture.ts` changed too, outside the write list.
- The concern split out of `context.ts` is the parse of the config folders (`config-parse.ts`, `contextConfig`). That parse is the apps holder, the language source and `createConfigCache` with its dependencies, one block that depends on no other object the context builds. That took `context.ts` from 900 lines to 858.
- Node's documentation on dot folders: the `fs.globSync(pattern[, options])` section of https://nodejs.org/docs/latest-v24.x/api/fs.json lists only `cwd`, `exclude`, `followSymlinks` and `withFileTypes`, and says nothing of dot folders. A run on Node v24.21.0 over a probe tree printed `projects/**/present ["projects/a/present"]` and `projects/.hidden/*/present ["projects/.hidden/b/present"]`. So `heardBy` hears a dot folder only when a segment of the pattern starts with a dot.
- The rebuild rule leaves dot folders out, as the manifest scan does (`subdirs` with `entersFolder` in `data/sources/manifests.ts`).
- The rebuild rule's manifest look is `projectFileIn(path)`, the scan's own test, so a folder counts as a project exactly when the next build would name it. It is asked only for a `rename` below a scan folder whose path is a folder now, and once per event.
- The gone-path test uses the folders of the last snapshot's projects, kept in `portfolio.ts` as `projectDirs` after each build. For a project of a repository, whose `folder` is absolute, the folder itself is kept.
- A key whose fixed folder is missing is watched through its nearest existing ancestor, the root at worst. With no root, nothing is watched.
- A save of `present.yml` under a pattern whose last segment is `present.yml`, or a glob matching it, drops that key, and the next read walks that one pattern again (C15 rows 6 and 15).
- The undo drops the keys covering every path it writes, makes or removes, in its success path and in the failure that puts the files back.
- The drop rule takes the path's state as a lazy probe, `now: () => PathNow`, memoised per event, where the brief has a boolean "whether that path is a folder now". The rule needs "gone" as well as "folder".
- C9: the build reads the portfolio deck of the primary hub only (`readOtherHub` sets `portfolioDeck: null`), so the second hub's key is taken by a deck-route read in the test before the folder is added.
- C6, C7 and the case of a folder made inside a project are in the slow file, since they need the real watcher's events. Each uses a fence key, `projects/**/fence.txt`. A file made after the act drops it, so the test resumes on that drop and on no timer.
- Every edit of the step's files is now an Edit or Write call. `tests/data/hubs/deck-globs.test.ts` was written again whole with Write in this round (item 5). Scratch programs that only print were run from the scratchpad: the case-run program of item 6, and a reader of the session's own transcript that printed the earlier program's text. Both are removed.

## Brief errors

- C11 is placed "a fast test in `tests/server/edit/deck/deck-acts.test.ts`", but that file's head comment carries `// @module-tag slow`. C11 is in the new fast file `tests/server/edit/deck/deck-globs.test.ts`, outside the write list.
- The placement sentence of "Cases" names no file for C6 and C7. They are in the slow file.
- The write list's grep for the `WriteTarget` files misses `tests/routes/edit/write-fixture.ts`, whose targets are typed `PrimaryTarget`.
