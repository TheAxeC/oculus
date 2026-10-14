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
