# Step D76 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/D76, base f4ed47774)

I changed no file in the repository, started no server, app or browser, did not use port 8787 or 8790, and read no `local.yml`. The only git commands I ran were `git diff f4ed47774`, `git status --short` and `git show f4ed47774:<path>`.

Every command below was run in the foreground from the worktree's `tools/oculus`, with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`. There is one write outside the repository, which the rules make me disclose. Rerunning the builder's quoted probe `case42.test.ts` added two lines to the builder's scratch file `$TMPDIR/d76-case42.txt` (the probe writes with `appendFileSync`). The vitest runs also wrote their usual temporary fixtures under `$TMPDIR`.

## Verification (rerun by the reviewer)

```
npm run test:quick
  ok prettier (5.5 s)
  ok ASCII gate (6.9 s)
  ok svelte-kit sync (13.6 s)
  ok eslint (27.0 s)
  ok svelte-check (22.9 s): 0 ERRORS 0 WARNINGS
  ok vitest (74.9 s): Duration 65.77s
  test:quick: 80.7 s (limit 45.0 s); every command passed
  test:quick: over the time limit

npx vitest run tests/checks/source/keys.test.ts tests/checks/diagrams tests/checks/tree tests/checks/config --testTimeout 0 --hookTimeout 0 --reporter=dot
  Test Files 2 failed | 8 passed (10)
  Tests 3 failed | 190 passed (193)
  failed: config-folder 'gives every group a chord and a glyph, and no letter a key the workbench binds'
          AssertionError: expected [ { label: 'Apps', ...(3) } ] to deeply equal [] (:502:67)
  failed: 'names a group of its own and a path under the hub for every document' (:551:28)
  failed: integrity 'validates with no findings' (:169:36)
  (The last two are the rows the brief says pass only on main, because the sparse worktree holds no hub .oculus/.)

The chord row, both halves of the builder's claim:
  git show f4ed47774:tools/oculus/config/layout.yml, line 36:   apps: { label: "Apps", glyph: app }   (no chord)
  worktree config/layout.yml: the same as the base
  main tools/oculus/config/layout.yml:36:                       apps: { label: "Apps", glyph: app, chord: a }
  config-folder.test.ts differs from the base only at line 275 (note.yml -> notes.yml),
  so the red row comes from layout.yml, which D76 does not touch.

sh utils/folder-check.sh   -> exit 0
sh utils/size-check.sh     -> exit 0
sh utils/unused-exports.sh -> exit 0
  (Compared with the base list by comm -13: the same six lines the report quotes. Each is part of a
  base line or a moved path, so no unused name is new. noteFile was on the base list too.)

npx vitest run tests/server/machine/lsp/adapters/markdown-created.test.ts --testTimeout 0
  -> Tests 4 passed (4)

The 18 guarded test files the report names (html, lsp-edit, local, notes, autosave.client,
markdown-requests, search, fs, ops, source, machine-answer and the others), in one call:
  -> Test Files 18 passed (18), Tests 194 passed (194)

The builder's probes under $TMPDIR:
  diff -rq of d76-after's src/ and config/ against the worktree: clean
    (only tests/checks/source/keys.test.ts differs, from the last comment edit)
  npx vitest run tests/zz/after.test.ts --silent=false --reporter=verbose (in d76-after)
    -> every CASE line the report quotes, unchanged
       (cases 1, 2-4, 4, 6, 8, 9, 11-18, 20, 21, 23-28, 31-34, 37-42)
    -> 4 failed | 14 passed; the 4 are print-only blocks with no assertions, as the report says
  case42.test.ts -> reproduced
  diff -rq of d76-before's src/ against the base copy: clean
  tests/zz/before.test.ts -> reproduced the report's "Before" lines

A node probe of rootSearchArgs (no file written): the paths ripgrep searches for a scope
  scope .oculus,            notes folder there      -> ["./.oculus/notes"]
  scope .oculus,            no notes folder         -> ["./.oculus"]
  scope .oculus/workspaces, no notes folder         -> ["./.oculus/workspaces"]
  scope .oculus/workspaces, notes folder there      -> null
```

## Verdicts

Items of "What to build":

| Item | Verdict | Grounds |
|---|---|---|
| Part 1 (a note, the notes folder, the name rule) | holds, with one finding | The server applies the name rule. It does not apply it to the first note made while `.oculus/notes` does not exist yet (Spec 4). |
| Part 2 (links, the editor's answers, rename) | violated | Rename on a link in a note's source tab is refused and renames nothing (Spec 1). The Notes tree rename, drag and move are as the brief says. |
| Part 3 (Backlinks) | holds | Placed after Outline; the `sectionsOf` run is case 24. |
| Part 4 (the Notes view and the Graph) | holds | Registered in the explorer group at order 4; the Graph moved to `views/shared/graph/`. |
| Part 5 (autosave) | holds | |
| Part 6 (content search over notes folders) | violated (partial) | A scope of `.oculus` with no notes folder searches the whole `.oculus` folder (Spec 2). |
| Part 7 (embeds and attachments) | holds | Embeds go through the file route; `SVG_GUARD` is shared with `diagrams.ts`. |
| Part 8 (tags) | violated (partial) | The search from a tag finds more notes than the Tags section counts (Spec 3). |
| Part 9 (math) | holds | `marked-katex-extension` 5.1.13 is pinned exactly in package.json; `MATH_PROFILE`. |
| Documents (DESIGN, HELP, behavior.yml) | holds, apart from the false code comments listed under Standards | |

Cases:

| Case | Verdict | Grounds |
|---|---|---|
| 1, 5, 6, 7, 12, 18, 23, 25, 29, 33, 36, 40 | met for the half that can be read or run; the look is not judged | The look half is settled at landing (Declined to judge). Case 6's probe stubs the Trash and shows only `ok: true` (Proof 4). Case 29 was checked by reading only. |
| 2, 3, 4, 9, 10, 11, 13, 14, 16, 17, 19, 20, 21, 22, 24, 26, 27, 28, 30, 32, 34, 35, 37, 39, 41 | met | By a rerun probe or by reading. For case 3, see Proof 3. |
| 8 | met | The brief's wording is wrong, as the builder reported: `checkLocal` returns only problems (`src/lib/data/sources/config/local.ts:574-577`). |
| 15 | met | Its words are "from the Notes tree", and the rerun probe shows that. The source tab's Rename is the Part 2 finding. |
| 31 | met for a hub that has a notes folder | The gap for a hub without one is Spec 2. Whether case 31 falls under G2's words is not judged. |
| 38 | partly met | Over-match (Spec 3). |
| 42 | met by reading only | No run reaches DOMPurify (Proof 1). |

## 1. Spec

1. **Rename on a link in a note's source tab renames nothing (Part 2, brief lines 71-72).**
   - The brief says "Rename on a link renames the note and rewrites every link to it", and line 72 lists "a source tab's Rename" among the moves that plan the rewrite.
   - Where the answer comes from: `answerWiki` in `src/lib/server/machine/lsp/adapters/markdown/own/wiki.ts:234-238` answers with a resource operation:
     ```ts
     const oldUri = addressIn(at.place, target, view);
     if (oldUri === null || newUri === null) return { result: null };
     const changes: unknown[] = [{ kind: 'rename', oldUri, newUri }];
     ```
   - Where it is refused: the page applies that edit through its edit plan, and `src/lib/state/system/machine/lsp/edits.ts:218-222` refuses any entry that has no `textDocument`:
     ```ts
     if (!isRecord(change) || !isRecord(document) || typeof document.uri !== 'string') {
         const target = isRecord(change) ? (change.uri ?? change.oldUri) : null;
         return refuse('lsp_edit_structure', typeof target === 'string' ? target : '');
     }
     ```
   - The refusal shows "The language server's edit creates, renames or deletes {0}, which oculus does not do, so nothing was changed."
   - `src/lib/ui/controls/editor/kit/lsp/transport/edits.ts:21` says "a create, rename or delete is for the page to refuse".
   - No code on the page sends a `kind: 'rename'` entry to the note rename: a grep of `src` for `oldUri`, `noteRename` and `documentChanges` finds no such route.
   - What happens: F2 on `[[Kickoff]]` in a note's tab, with a new name typed, shows that refusal; the note keeps its name and no link changes.
   - Case 15's runs cover only the Notes tree and the server half of the answer.

2. **A Find in Folder scope of `.oculus` reads files other than notes when the hub has no notes folder (Part 6, brief line 89).**
   - The brief says the search covers `.oculus/notes/` "and nothing else under any `.oculus/` folder: not `local.yml`, `config.yml`, `workspaces/`...".
   - `searchedPaths` in `src/lib/data/helpers/search/query.ts:229-233`:
     ```ts
     if (under === '') return place.notes ? [SEARCH_PATH, notes] : [SEARCH_PATH];
     ...
     if (!place.notes || segments[0] !== STATE_FOLDER) return [`./${under}`];
     ```
   - When `place.notes` is false, a scope `under` of `.oculus` or `.oculus/workspaces` is searched as it is. The probe printed `["./.oculus"]` and `["./.oculus/workspaces"]`.
   - The guard at line 246 returns null only for `ALL_ROOTS`.
   - What happens: on a hub with no `.oculus/notes` (or one whose notes folder is refused), Find in Folder on `.oculus` (Query.svelte sets `under`) searches `config.yml` and `workspaces/`, and `local.yml` unless the hub's ignore rules hide it from ripgrep. That is the folder the brief says is never searched.

3. **The search from a tag finds more notes than the Tags section counts (Part 8, brief line 96; case 38).**
   - The brief says the search "finds exactly the notes the section counts for it".
   - The doc comment of `tagPattern` (`src/lib/data/notes/note-index.ts:130-156`) and judgment call 10 of the report both say the regex also matches `#tag` in fenced code, in link text and in front matter outside `tags:`. The section does not count any of those.
   - What happens: a note whose only `#plan` is inside a code fence is not counted under `plan`, but pressing `plan` lists it.
   - The same choice adds `--multiline` (`spansLines`) to every regex search, and to Replace through `matchArgs`/`fileArgs`. That changes search behaviour across the whole app, and no part asks for it (stated in the report; see Behaviour 1).

4. **The server's name rule does not apply to the first note in a hub that has no notes folder yet (Part 1).**
   - `inNotesFolder` in `src/lib/server/files/fs/notes.ts:315-329` compares against `realPath(notesFolderOf(hub))` and treats null as "not inside":
     ```ts
     const notes = realPath(notesFolderOf(hub));
     return notes !== null && inside(real, notes);
     ```
   - A create of `notes/<name>.md` into `.oculus` (the path `noteMaking` uses when the folder is missing) therefore lands with the name unchanged, and no rule is checked on the server.
   - The page's `typedRefusal`/`landingRefusal` still check the name, so only a request that does not come from the page gets through.
   - The comments that say every landing follows the rule are false in this case (Standards 2).

## 2. Proof

1. **No run checks the sanitiser.** The report calls the G5 `tests/ui/html.test.ts` row "the browser run". That file runs in the `unit` project with `environment: 'node'` (`vite.config.ts`, the `projects` entry named `unit`). Its own head comment says "DOMPurify's own filtering ... `sanitize` is not even defined, so `sanitise` hands the text back as it came".
   - So no run checks `MATH_PROFILE`, that the slot spans survive `PROFILE`, or that `style` is stripped.
   - Case 42 holds by reading only: `PROFILE` is unchanged, and `span`/`class` are in `ALLOWED_TAGS`/`ALLOWED_ATTR`.
2. **The verify list ran twice.** The report shows a first full verify run, all green, that was not after the last change, then a second one. spec.md "Token discipline" allows one run after the last change, plus a rerun only after a red line. The extra run is a finding against that rule. A comment edit to `tests/checks/source/keys.test.ts` came after the second run; the builder reran that file alone.
3. **Case 3's probe used other text than the case names.** The builder ran `  Spaced  ` instead of the case's `  Kickoff  ` and lists this as an error in the brief. The brief is not wrong; the probe's own design caused the swap. The trim the case asks for is still shown by the run.
4. **Case 6's probe proves less than the case.** It stubs the Trash, so `A.md` is still listed after the act and the run shows only `ok: true`. That the note left the tree and entered the Trash is shown by reading only.

## 3. Standards

1. **Comments edited by the step but not rewrapped at 100 columns** (spec.md asks for a rewrap when a step edits a comment):
   - `src/lib/server/files/workspace/paths.ts:2` (78 columns)
   - `src/lib/server/machine/lsp/held/answers.ts:3` (66)
   - `src/lib/server/machine/lsp/relay/relay-route.ts:6` (81)
   - `src/lib/server/machine/lsp/relay/relay-server.ts:3` (87)
   - `src/lib/server/files/fs/lsp-edit.ts:14` (77)
2. **Comments that say something the code does not do:**
   - `src/lib/server/machine/lsp/adapters/markdown/own/wiki.ts:15-16`: "The page writes such an edit through its note rename". The page refuses it (Spec 1).
   - `src/lib/server/machine/lsp/servers.ts:24`: "the rename of a note a link names". Same.
   - The head comment of `src/lib/server/files/fs/ops.ts:45` ("A name that lands in a hub's notes folder, or a folder under it, follows the name rule") and the `noteLanding` doc in `notes.ts:314`. Both are false for the first note when the notes folder is missing (Spec 4).
3. **The builder ran a git command.** It ran a read-only `git status`. spec.md "Where you work" says "You never run a git command, read-only ones included". The report discloses it and it changed nothing; it is still a breach of the rule.
4. **The history-word grep was too narrow.** The report runs it over the documents only, but spec.md also asks for it over added comment lines and test titles. My grep of the added comments and test titles found only words that describe behaviour, no history, so nothing is wrong in the result.

## 4. Behaviour

1. **Every regex search changes.** `--multiline` is added for any regex holding `\n`, in Search and Replace alike (stated in the report). No part asks for this.
2. **The KaTeX `errorColor` changes in the TeX view and the Math Preview** (stated in the report).
3. **Rename on a link in a note's tab shows the `lsp_edit_structure` notice and does nothing** (Spec 1). The report does not state this.
4. **An embed renders as `<p><div class="embed">...</div></p>`.** A `<div>` inside a `<p>` is invalid HTML; the browser closes the `<p>` early, which may leave an empty paragraph before the embed. This is minor.

## Declined to judge

- `npm run diagrams` and `npm run docs:palette`: both write files, so I did not run them. Their checks passed inside the tree-checks command above.
- The chord row on main and on the unchanged tree: either needs a run outside this worktree. That the red row comes from the base layout.yml and that main already holds `chord: a` was checked by reading.
- The look half of cases 1, 5, 6, 7, 12, 18, 23, 25, 29, 33 (the images), 36 and 40: it needs the app in a browser, which I may not start.
- Whether case 31 falls under G2's words.
- Case 29, whether the root watch reaches `.oculus/notes`: checked by reading only (the walk in `git.ts` enters dot folders); not run.
- The "over the time limit" line of `test:quick` (80.7 s against 45.0 s): the machine was under load from other worktrees, so I did not judge whether the step made the suite slower.
- The module-level `let loading` added in `src/lib/views/shared/latex/math.ts:51`: spec.md "No globals" bans "module-level mutable state shared across module graphs". This is a lazy-import cache inside one module graph, and the base has the same pattern at `src/lib/ui/controls/editor/kit/load.ts:183` (per `git show f4ed47774:`). Whether the rule's words reach it is for the orchestrator.

Reviewer usage: agent a92c8631fdab55e6c, claude-opus-5-5, 76,065 tokens, 90 tool uses, 17.5 min.

## Repair round 1, refuted

I changed nothing in the repository or the ledger. `git status --short` gives 147 lines and the `git diff f4ed47774 | shasum` hash `933af844c9ff...` is the same at the start and at the end of the review. I started no server, app or browser and read no `local.yml`. The only git commands I ran were `git diff f4ed47774`, `git status --short` and `git show f4ed47774:<path>`, all from inside the worktree.

I reran the builder's probes in its scratch copy `$TMPDIR/d76-r1`, with `TMPDIR` pointed at my scratchpad. Their output files and fixture hubs went there, so the builder's own output files were not appended to. vitest wrote its usual caches.

I checked the round's delta in two parts:
- `diff -u` of every path in `files.txt` (the snapshot `D76-round-1`) against the worktree.
- The base diff of the four changed paths that `files.txt` does not list. I confirmed the list by comparing the `diff --git` lines of `git diff f4ed47774` with `files.txt`: `state/sources/search/search.svelte.ts`, `state/sources/search/search.ts`, `ui/controls/editor/kit/lsp/transport/edits.ts` and `views/sources/source/language/lsp.ts`. The other paths that appear in `files.txt` but not in that diff are untracked new files.

```
npm run test:quick
  ok      ASCII gate (0.5 s)
  ok      prettier (1.1 s): All matched files use Prettier code style!
  ok      svelte-kit sync (2.6 s)
  ok      eslint (23.1 s)
  ok      svelte-check (25.1 s): 1791973957747 COMPLETED 502 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
  ok      vitest (68.0 s): Duration  62.99s (transform 110.98s, setup 0ms, import 138.79s, tests 92.32s, environment 897ms)
  test:quick: 68.6 s (limit 45.0 s); every command passed
  test:quick: over the time limit

npx vitest run tests/checks/source/keys.test.ts tests/checks/diagrams tests/checks/tree tests/checks/config --testTimeout 0 --hookTimeout 0 --reporter=dot
   FAIL  |unit| tests/checks/config/config-folder.test.ts > oculus's own config directory > gives every group a chord and a glyph, and no letter a key the workbench binds
  AssertionError: expected [ { label: 'Apps', ...(3) } ] to deeply equal []
   FAIL  |unit| tests/checks/config/config-folder.test.ts > oculus's own config directory > names a group of its own and a path under the hub for every document
   FAIL  |unit| tests/checks/config/integrity.test.ts > the real hub > validates with no findings
   Test Files  2 failed | 8 passed (10)
        Tests  3 failed | 190 passed (193)
  (The same three rows as round 0. The second and third read the hub's own .oculus/, which the
  sparse worktree lacks; the brief names them as passing only on main. The chord row comes from
  the base config/layout.yml, as the first review read.)

sh utils/folder-check.sh    -> exit 0
sh utils/size-check.sh      -> exit 0
sh utils/unused-exports.sh  -> exit 0; comm -13 against .agents/worktrees/D76-base/unused-exports.txt:
  src/lib/data/prose/markdown/markdown.ts: TOC_MARK, TOC_CLASS, tocList
  src/lib/server/files/fs/notes.ts: noteFile
  src/lib/state/boards/structure/graph.ts: EdgeKind, Direction
  src/lib/state/boards/structure/graph.ts: typeCounts, lineCounts
  src/lib/state/sources/fs.svelte.ts: BookmarksState, FileText, Listing, NotesState, WorkspacesState
  src/lib/views/shared/graph/pointer.ts: DRAG_PIXEL, LINK_REACH
  (the same six lines the report quotes)

npx vitest run tests/server/machine/lsp/adapters/markdown-created.test.ts --testTimeout 0
   Test Files  1 passed (1)
        Tests  4 passed (4)

npx vitest run tests/checks/source/html-sites.test.ts tests/ui/html.test.ts --reporter verbose
   (check) |unit| tests/ui/html.test.ts > inlineMarkdown > is the sanitiser over the inline renderer, so no field reaches a card around it
   (check) |unit| tests/ui/html.test.ts > blockMarkdownParts > draws a note link's shown text as text, so no tag it holds reaches the page
   (check) |unit| tests/ui/html.test.ts > blockMarkdownParts > typesets a formula's words as text, and a link it asks for as no link
   Test Files  2 passed (2)
        Tests  22 passed (22)

The builder's probes, in $TMPDIR/d76-r1:
  diff -rq -x local.yml -x zz of $TMPDIR/d76-r1/{src,tests,config} against the worktree -> no output
  TMPDIR=<scratchpad> npx vitest run tests/zz/round1.test.ts --project unit -> Tests 1 passed (1)
    Every CASE line of round-1 cases 1 to 6 and 8 that the report quotes is reproduced. The hit
    order of case 5 differs (ripgrep order). Kept: [".oculus/notes/C.md:2",".oculus/notes/A.md:1"].
  TMPDIR=<scratchpad> npx vitest run tests/zz/r1extra.test.ts tests/zz/after.test.ts tests/zz/case42.test.ts --project unit
    -> Test Files 1 failed | 2 passed (3), Tests 4 failed | 16 passed (20). The 4 are the
       print-only blocks (cases 8, 17, 24, 40-42): "expected any number of assertion, but got none".
    CASE 3 create "  Kickoff  .md": [{"ok":true,"path":".oculus/notes/Kickoff.md"},["Kickoff.md","Old.md"]]
    CASE 6 trash Kickoff.md: [true,["Old.md"],["Kickoff.md"]]
    The case 9, 11, 24, 26 to 28, 31, 32, 36 to 39, 41 and 42 lines are as the report quotes them.

Item 5's premise:
  tests/ui/frame/client-runtime.ts:1 "A vitest environment with no DOM whose modules are transformed as the browser's"
  vite.config.ts projects: 'unit' environment 'node'; 'client' environment './tests/ui/frame/client-runtime.ts'
  (setup returns only a teardown; no window or document is installed)
  ls node_modules | grep -iE '^(jsdom|happy-dom|linkedom)$' -> nothing (exit 1)
  grep -rn "vitest-environment" tests -> nothing
  node -e "import('dompurify')..." -> {"sanitize":"undefined","isSupported":false,"window":"undefined","document":"undefined"}
  html.ts:188-189 purifierOver: if (!DOMPurify.isSupported) return null
  package.json scripts: no browser runner; test:landing runs vitest, check, build, slow, format, lint, ASCII

Not run: npm run diagrams and npm run docs:palette, because both write files. tests/checks/diagrams,
which compares both with the tree, passed in the checks command above.
```

### Verdicts

Items of the round's brief:

- 1: holds.
  - The source tab's `applyEdit` (`views/sources/source/language/lsp.ts:235-252`) routes an edit that `noteRenameOf` names to `client.explorer.rename`. Every other edit goes to `refactor.submit`.
  - `noteRenameOf` (`state/system/machine/lsp/edits.ts:196-220`) asks for exactly one entry that is not a text edit. That entry must be a `rename` between notes of one notes folder of a hub root.
  - The rerun of round-1 case 1 reproduces the single rename and one write per linking note. Case 2 reproduces the refusal of a `.ts` rename and of a create.
  - Skipping the Cmd+Enter preview is stated as judgment call 2. The DESIGN sentence it makes false is finding 6.
- 2: holds against the round's words. The rerun of round-1 case 3 gives nothing for `.oculus` and `.oculus/workspaces` with and without a notes folder, and `["./.oculus/notes"]` for the notes folder. The rule now reaches every scope with a `.oculus` segment anywhere in its path (finding 3).
- 3: holds.
  - `grep -rn "multiline\|spansLines" src` prints nothing, and the hunks of `server/files/search/search.ts` in `hitOf` and the run loop match the base again.
  - `tagPattern` holds no `\n`, and `taggedHits` keeps the indexed lines (case 5 rerun).
  - `tag` is in `SearchState`, `searchStateShape` and `parseSearchState` (`state/sources/search/search.ts:79-80`, `:96`, `:257`, `:281`). A change of the query, a toggle, the root or the scope drops it (`search.svelte.ts:219-223`).
  - One residual gap is finding 4.
- 4: holds. `inNotesFolder` compares through `wouldBeReal` (`server/files/fs/notes.ts:311-334`), and the case 6 rerun answers `invalid_name` with no folder.
- 5: not applicable, because the premise is wrong.
  - Neither vitest project has a DOM. DOMPurify's `isSupported` is false under Node, so `purifierOver` returns null and `sanitise` hands the text back in both projects.
  - The repository has no DOM library and no browser runner, so a move into a `*.client.test.ts` file would show nothing.
  - The builder named what would settle it: `happy-dom` or `jsdom` as a dev dependency. That is a new dependency, which spec.md makes a report and not an action, so it is the orchestrator's to raise.
- 6: holds. The rerun of case 8 gives a block `<div class="embed">` outside any `<p>` and an inline `<span class="embed">`. The flattening of an inline embed in `inlineDrawn` is judged in finding 7.
- 7: holds. A fill check of the five head comments (each line plus the next word against 100 columns) finds no line in those paragraphs that ends short.

Cases of the round's brief:

- 1: met for the server half and the rename steps (rerun). The source tab's routing is checked by reading `lsp.ts:235-252`, and the look on landing remains.
- 2: met (rerun).
- 3: met (rerun).
- 4: met (rerun). No `--multiline` appears in the search or replace arguments.
- 5: met (rerun). `plan 2`, and only `A.md` and `C.md` are kept, `C.md` at its `tags:` line.
- 6: met (rerun).
- 7: not verifiable. No project of the test configuration runs DOMPurify. A DOM environment for one file would settle it (a dev dependency, a decision above the builder), or the look on landing.
- 8: met (rerun).
- 9: met (fill check above).

Parts of the step's "What to build", for the whole diff since the base:

- Part 1: holds. Cases 2 to 4, 9 and 11 rerun, and round-1 case 6 closes review Spec 4.
- Part 2: holds. Rename on a link now renames the note, which closes review Spec 1. Finding 6 is a sentence in DESIGN.md.
- Part 3: holds (case 24 rerun).
- Part 4: holds (cases 25 and 26 rerun).
- Part 5: holds (cases 27, 28 and 30 rerun).
- Part 6: holds. Case 31 rerun lists only the note's hit, and the scopes are as in round-1 case 3. Finding 3 is the wider reach.
- Part 7: holds for a note's render. Each embedded text reaches the page through `Markdown.svelte`'s `sanitise(doc.html, slots)`. Case 37's headers were rerun.
- Part 8: violated, narrowly (finding 4).
- Part 9: holds for its own text. `PROFILE` is unchanged, `MATH_PROFILE` is filled by `sanitise(html, slots)`, and the case 40 and 41 lines were rerun. The same change took the sanitiser off `blockMarkdown`, which case 42 and finding 1 cover.
- Documents: violated (findings 1 and 6). The sentences listed there are false after the diff. The rest of HELP.md and DESIGN.md as changed this round reads true against the code.
- "Kept where oculus differs": holds, as read in round 0. Nothing this round touched it.

Cases of the step's brief, for the whole diff:

- Cases 1, 5, 6, 7, 12, 18, 23, 25, 29, 33, 36 and 40: met for the half a run or a reading reaches. The look half is settled at landing.
  - Case 6 now has a run with a trash that moves the file (`CASE 6 trash Kickoff.md: [true,["Old.md"],["Kickoff.md"]]`).
  - Case 29 is checked by reading only.
- Cases 2, 3, 4, 9, 10, 11, 13, 14, 16, 17, 19, 20, 21, 22, 24, 26, 27, 28, 30, 32, 34, 35, 37, 39 and 41: met, by the reruns above or by reading.
  - Case 3 now has its own name (`  Kickoff  ` to `Kickoff.md`, rerun).
  - Case 10's follow of a rename is by reading.
- Case 8: met. `checkLocal` returns only problems; `readLocalText` names `notes` as unknown (rerun).
- Case 15: met. The Notes tree rename was rerun in round 0, and the source tab's Rename now routes to it (round-1 case 1).
- Case 31: met (rerun).
- Case 38: partial. The counts and the kept hits match for every form the probe writes. A `tags:` block text with two words on one line is counted and not listed (finding 4).
- Case 42: unmet. The formula half holds by the rerun (`<img false <script false`). A hub text outside math drawn through `blockMarkdown`, which is every slide's body, lede, column and card description, no longer passes `PROFILE` at all (finding 1). The DOMPurify half is also run by no test (finding 5).

### Findings

1. **`src/lib/ui/html.ts:473-475` and `:571-605`, under Spec and Behaviour. A slide's Markdown is drawn unsanitised.**
   - The code:
     ```ts
     export function blockMarkdown(text: string): string {
         return blockMarkdownParts(text).html;
     }
     ...
     return { html: joined, slots: { mark, formulas }, headings };
     ```
   - What is wrong: the extra change for the html-sites check moved the sanitiser out of `blockMarkdownParts`. On the base (`git show f4ed47774:` lines 347-350) and on round 0, `blockMarkdownParts` returned `sanitise(html)`. Now it returns the raw render.
   - `blockMarkdown` still returns `.html`, and nothing sanitises it afterwards. Its one caller is `views/academic/present/markup.ts:100` (`body()`), drawn by `{@html html}` in `views/academic/present/parts/Words.svelte` for every `block` field. Those are `Plain.svelte:24`, `:33-34`, `Title.svelte:29`, `Section.svelte:26`, `Grid.svelte:33`, `:45` and `Project.svelte:112`.
   - No item asks for this change, and it breaks G5 ("Hub or feed text reaches HTML only through the sanitiser").
   - The html-sites check still passes this site only because its `ALLOWED` entry for `views/academic/present/parts/Words.svelte:html` gives the reason "render the slide field through ui/html.ts, which sanitises what it renders", and that reason is now false.
   - The diff also makes these sentences false:
     - `blockMarkdown`'s doc comment ("the result is sanitised", `html.ts:469-471`);
     - the head comment of `html.ts` ("the one sanitiser every string of it passes through", `:1-2`);
     - `markup.ts:1` ("Markdown through the app's sanitiser");
     - the eslint note on `Words.svelte` ("body() sanitises the file's markup").
   - The report lists neither the change nor its effect.
   - Failure scenario: a deck file of a hub whose slide body holds `<img src=x onerror="fetch('/api/...')">`, or a `style` attribute. The Present view draws the slide and the handler runs in oculus's origin. On the base it was stripped.
   - The fix is small and inside the brief's paths: `blockMarkdown` returns `sanitise(parts.html, parts.slots)` for `const parts = blockMarkdownParts(text)`.
   - Verdict: case 42 unmet; Documents violated.

2. **The report's head and its DONE row "html-sites check (G5) | DONE", under Proof.**
   - What is wrong: the report says a G5 check was red on round 0 and is green now. No run or reading in the report covers the other consumer of the function the fix changed, and that consumer lost the sanitiser (finding 1).
   - A green check that passes through an exemption whose reason the diff falsified is the case the Proof heading names as a check made to pass by exempting.
   - Failure scenario: the orchestrator reads "G5 green" and lands an unsanitised slide renderer.
   - Verdict: case 42 unmet (with finding 1).

3. **`src/lib/data/helpers/search/query.ts:219-225`, under Spec and Behaviour. The rule reaches beyond the item.**
   - The code:
     ```ts
     if (!segments.includes(STATE_FOLDER)) return [`./${under}`];
     return place.notes && inNotes(under) !== null ? [`./${under}`] : [];
     ```
   - What is wrong: the round's item names a scope whose first segment is the state folder. The diff searches nothing for any scope with a `.oculus` segment anywhere in its path.
   - Part 6's own words ("nothing else under any `.oculus/` folder") can be read to ask for this. The base searched any Find in Folder scope as `./<under>` (`git show f4ed47774:` `query.ts:177`).
   - The report gives the rule but not this before and after.
   - Failure scenario: in the research-hub root, Find in Folder on `side-projects/theaxec.github.io/.oculus` (which holds only `project.yml`, `ls -a` above) for a word in that manifest. On the base the file is searched and the hit listed. Now the view says no results, with nothing saying the folder was skipped. The same happens for `tools/oculus/demo/.oculus`.
   - Whether a nested repository's or project's `.oculus` is searched when it is scoped explicitly is the orchestrator's reading of Part 6. Keeping it needs a HELP sentence saying so. Narrowing it is `segments[0] !== STATE_FOLDER`.
   - Verdict: none.

4. **`src/lib/state/sources/explorer/notes/note-index.ts:136-157` (`tagPattern`), under Spec. A stated limit stands where the brief asks for "exactly".**
   - The code:
     ```ts
     const listed = `^[ \\t]*${before}['"]?#?${word}['"]?[ \\t]*(?:,|\\]|\\r?$)`;
     ```
   - What is wrong: Part 8 says the search "finds exactly the notes the section counts for it". The doc comment and HELP.md state that a `tags:` text written as a block over several lines is counted and listed only at lines holding one word.
   - `frontTags` splits a block scalar on spaces and commas, so the index holds `idea` at a line `  idea paper`. None of the four alternatives matches that line: `listed` needs a `,`, a `]` or the line end after the word.
   - Since `taggedHits` keeps only indexed lines, the pattern could add a word-bounded alternative for any line and leave the precision to the index. The cost is more raw hits counted against `search.max_hits`, which the report can weigh.
   - Failure scenario: `B.md` with front matter `tags: >` and `  idea paper` on the next line. The Tags section counts `idea 1` and `paper 1`, and a press on `idea` lists no note.
   - Verdict: Part 8 violated (narrowly); case 38 partial.

5. **`tests/ui/html.test.ts` (G5 rows) and round-1 item 5, under Proof. No run reaches DOMPurify.**
   - What is wrong: as round 0's Proof 1 said, no run shows `PROFILE` stripping `style` or `MATH_PROFILE` keeping KaTeX's markup. Round 1 confirmed that no project of the test configuration can.
   - The rows that pass assert the renderer's and KaTeX's own escaping, which hold without DOMPurify. That is correct for their titles.
   - The gap left is the one that let finding 1 through. A DOM environment for one file (a dev dependency) would settle it, and adding one needs the orchestrator's or Axel's ruling.
   - Failure scenario: a change that drops the sanitiser from a path, as in finding 1, passes every test.
   - Verdict: round-1 case 7 not verifiable; case 42 unmet (with finding 1).

6. **`DESIGN.md` "What a language server may change" (the sentence "any rename the reader accepted with Cmd+Enter, is held as a Refactor Preview"), under Standards.**
   - What is wrong: `applyEdit` in `lsp.ts:235-252` ignores `options.preview` for a note rename, as judgment call 2 of the report states. DESIGN adds the note-rename exception to the refusal sentence but keeps the preview sentence unqualified.
   - Failure scenario: a reader of DESIGN.md expects Cmd+Enter on F2 over `[[Kickoff]]` to show a Refactor Preview. The note is renamed at once.
   - Verdict: Documents violated.

7. **`src/lib/ui/html.ts:546-563` (`inlineDrawn`), under Standards (HELP.md "Notes").**
   - What is wrong: an embed inside a line draws headings as `strong` and paragraphs as inline text. Every other block (a list, a table, a code block, a quote) is drawn as its escaped source text joined by `<br>`, and code's line breaks collapse inside the span.
   - The item asks only for a `span` of the same class, and block content cannot sit in a `span`, so the flattening follows from the item, and the item holds.
   - HELP.md says "the note's headings and paragraphs separated by line breaks" and does not say the other blocks appear as Markdown source. The report does state it, under item 6.
   - Failure scenario: `see ![[Plan]] here`, where `Plan.md` holds a list. The reader sees `- a - b` as raw text inside the frame, and HELP does not tell them why.
   - Verdict: none.

8. **Comments edited this round with a line that ends one word short of 100 columns, under Standards (spec.md "A comment edited by the step is rewrapped as a whole paragraph at 100 columns").**
   - The lines:
     - `src/lib/server/machine/lsp/adapters/markdown/own/wiki.ts:15` (97 columns; the next word `an` fits at 100);
     - `src/lib/state/system/machine/lsp/edits.ts:42` (96; `the` fits at 100);
     - `src/lib/state/sources/explorer/notes/note-index.ts:14` (96; `the` fits at 100).
   - In the same comments, `relay-server.ts:3` is filled to exactly 100, so the fill width is not applied the same way throughout.
   - The new head comment of `views/sources/source/language/lsp.ts:34` names `state/system/machine/refactor/` as "the page's edit plan". DESIGN.md names `state/system/machine/lsp/edits.ts` as the plan; `refactor/` is the preview that calls it.
   - Failure scenario: the next step that edits these comments rewraps them differently.
   - Verdict: none.

9. **The report's "Files changed in round 1" list, under Spec ("each path outside the write list with its reason").**
   - What is wrong: `src/lib/state/sources/search/search.ts` and `search.svelte.ts` are under neither the step's write list nor the round's. The round's list names "the Search view's files under `src/lib/views/`".
   - The report marks other paths "outside" with reasons, but not these two.
   - Failure scenario: the orchestrator's check of the diff against the write lists finds two unexplained paths.
   - Verdict: none.

Closures of the first review's findings, checked:
- Spec 1: closed by a change to the code (round-1 case 1).
- Spec 2: closed, with the reach in finding 3.
- Spec 3: closed apart from finding 4.
- Spec 4: closed.
- Standards 1: closed.
- Standards 2: closed for `wiki.ts`, `servers.ts:24`, `transport/edits.ts`, `ops.ts:45` and `noteLanding`.
- Behaviour 1: closed (no `--multiline`).
- Behaviour 3: closed.
- Behaviour 4: closed.
- No check was removed to close a finding. `html-sites.test.ts` is unchanged, and the code was changed to pass it, with the side effect in finding 1.

### Declined to judge

- The look half of round-1 cases 1 and 8 and of the step's (look) cases: they need the app in a browser, which I may not start.
- Whether a DOM test environment (`happy-dom` or `jsdom`) should be added so G5's rows run DOMPurify: it is a new dependency, which is the orchestrator's to raise with Axel.
- Whether Part 6 means a nested repository's or project's `.oculus` is never searched, even when scoped explicitly (finding 3): it is a reading of the brief for the orchestrator.
- The "over the time limit" line of test:quick (68.6 s against 45.0 s): the machine runs other worktrees' suites, so I did not judge whether the step made the suite slower.
- `npm run diagrams` and `npm run docs:palette`: both write files. Their match with the tree passed inside `tests/checks/diagrams`.
- The rows of the checks command that read the hub's own `.oculus/`, and the chord row: they pass only on main or come from the base `layout.yml`. Settling them needs a run outside this worktree.

Reviewer usage: ae5d265da61e0b75e, claude-opus-5-5, 305,967 tokens, 76 tool uses, 15.9 min.

## Closed

Every finding of the run over repair round 1 is closed at landing, in the gate worktree, inside the brief's paths or open item 102's ruling. None went back to the builder.

1. Spec and Behaviour 1 (slide Markdown unsanitised): fixed. `blockMarkdown` in `src/lib/ui/html.ts` returns `sanitise(parts.html, parts.slots)`, so the comments of `html.ts`, `markup.ts:1` and `Words.svelte` are true again. The row 'drops a handler, a script and a style from a slide's Markdown and keeps its markup' of `tests/ui/html.dom.test.ts` checks it under DOMPurify.
2. Proof 2 (G5 green through an exemption): closed with finding 1; the exemption's reason holds again.
3. Spec and Behaviour 3 (`.oculus` anywhere in a scope): fixed to the round's words. `searchedPaths` in `query.ts` withholds a scope only when its first segment is `.oculus`, so Find in Folder on a nested repository's or project's `.oculus` is searched as on the base; the head comment says so.
4. Spec 4 (`tagPattern` misses a block text line): fixed. The item and bracket-list alternatives became one alternative for the tag's words between spaces, commas, brackets or quotes on any line, and `taggedHits` keeps the precision; the doc comment states it, and HELP.md no longer states a limit.
5. Proof 5 (no DOM): closed by open item 102 (a). `jsdom` 30.1.1 is an exact dev dependency, `vite.config.ts` has a third project `dom` for `*.dom.test.ts`, `tests/ui/html.test.ts` moved to `tests/ui/html.dom.test.ts` with two rows added, and `tests/tiers/essential.txt` and G5 in `agents/guarded.md` name the new file.
6. Standards 6 (DESIGN preview sentence): fixed. The sentence now excludes the rename of a note from the Cmd+Enter preview and says it is made at once.
7. Standards 7 (inline embed): fixed in HELP.md's new Notes section: inside a line of text the embedded note shows as plain text, its other blocks as their source.
8. Standards 8 (fill and the edit plan): the four comment paragraphs are rewrapped at 100 columns, and `lsp.ts` names `state/system/machine/lsp/edits.ts` as the edit plan.
9. Spec 9 (paths outside the lists): `src/lib/state/sources/search/search.ts` and `search.svelte.ts` are named in the booking as written outside the path lists, for the tag search's state.
