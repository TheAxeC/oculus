# Step D41 refuter report (on .agents/worktrees/D41, base 53fa9b002)

## Verification (rerun by the reviewer)

```
$ npm run test:quick -- --base 53fa9b002        (from .agents/worktrees/D41/tools/oculus, PATH with node v24.21.0)
ok ASCII gate (0.6 s)
ok svelte-kit sync (2.6 s)
ok prettier (2.6 s): All matched files use Prettier code style!
ok eslint (2.3 s)
ok svelte-check (6.2 s): 1791543089124 COMPLETED 441 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok vitest (21.5 s): Duration 17.12s ...
test:quick: 22.2 s (limit 45.0 s); every command passed

$ sh ~/.claude/skills/land/templates/checks.sh <main checkout>/tools/oculus/.scratch/migration/orchestrator-state.md
test:quick: 81 changed file(s), from git since HEAD ...
test:quick: 21.5 s (limit 45.0 s); every command passed
checks: 1 commands passed
(checks.sh takes no --base argument, so it selects changed files from git since HEAD, not from the base.)

$ npx vitest run tests/checks/tree/boundaries.test.ts tests/checks/source/keys.test.ts tests/checks/config/config.test.ts tests/checks/tree/size.test.ts
first run:  Test Files 1 failed | 3 passed (4) / Tests 1 failed | 59 passed (60)
reruns 2-4: Test Files 4 passed (4) / Tests 60 passed (60)
(the first run's output was cut by tail, so the failing test is not identified; three later runs passed)

$ npx vitest run <the three files of verify 2>
Test Files 3 passed (3) / Tests 84 passed (84)

$ npx vitest run --no-isolate --testTimeout 0 --hookTimeout 0 tests/server/machine/lsp tests/state tests/checks tests/ui/controls tests/views/sources
Test Files 49 passed (49) / Tests 608 passed (608)   Duration 185.81s

$ npx vitest run --no-isolate --testTimeout 0 --hookTimeout 0 tests/data tests/server tests/routes tests/shell tests/fixtures
Test Files 137 passed (137) / Tests 1028 passed (1028)   Duration 235.17s

$ wc -l src/lib/server/machine/lsp/relay.ts src/lib/server/machine/lsp/servers.ts src/lib/state/.../ops.svelte.ts src/lib/views/.../Editor.svelte
880 relay.ts / 857 servers.ts / 696 ops.svelte.ts / 518 Editor.svelte

$ folder check (verify 6)
folder=0
$ unused-exports.sh
364 lines, identical to .agents/worktrees/D41-base/tools/oculus/unused-exports.txt

$ ASCII gate, spec.md perl form, over the changed docs and sources
(no output)
$ the ASCII gate script's own find
bfs: error: bin: No such file or directory.   (exit 0, no other output; the worktree has no bin folder)

$ added source lines over 100 columns: none
$ spec.md's history-word list over added comments and test titles: hits only where a word names order or place, none naming history

$ OC=$PWD HUB=<hub> npx tsx <scratchpad>/b41/audit-run.ts   (the builder's harness, cases 25-28)
type dropped is not the folder's nogo
type in-prep is not the folder's abandoned
type active is not the folder's idea
tw typeWritten undefined, type idea
real hub findings (type_not_tier): 0  audit rows with type disagreement: 0  audit rows total: 1

$ npx tsx <scratchpad>/b41/watch-late.ts   (the builder's harness, case 32, scratch hub)
worktree: watch lines: []  rebuilds 1, 2, 3
worktree, DENY=1: one EACCES line for projects/ideas
b41/unchanged copy: the ENOENT line for projects/software

$ npx tsx <scratchpad>/rv/count.ts   (my walk of the hub, skipping .git, node_modules, secrets, .claude, .codex, worktrees, .scratch)
{files 881, counted 876, resolving 791, marked 85, markedFiles 39, skillsMarks 68}
builder's report: 884 counted / 799 resolving / 85 marked / 39 files / 68 under skills, over 877 files; brief: 911 / 825 / 86
per line: RESEARCH-APPROACH.md:90 schema.py:61 -> file, line 61; AGENT-APPROACH.md:78 `docs/adr/` -> none (marked);
project-cleanup SKILL.md:16 `projects/active/ward-bttr-crosssubject/` -> none (marked);
project-cleanup SKILL.md:17 `projects/manuscripts/hccnet-revision/code/` -> folder (not marked)
$ ls: docs/adr and projects/active/ward-bttr-crosssubject absent; hccnet-revision/code and schema.py present
```

The relay runs 1 to 13 of the builder's report start the Markdown language server outside the tests and were not rerun (the brief forbids it); they are under "Declined to judge".

## Verdicts

Items of the brief's "What to build":

- 1: holds. The Markdown entry in `servers.ts`, the adapter under `adapters/markdown/` and the `lsp:markdown` channel serve `.md` tabs; the request handlers are covered by `markdown-requests.test.ts` (26 rows, passing in verify 2).
- 2: holds. `diagnostics.ts` drops marks that are not `served` and rewords them through `source.md_no_such_path`; the G2 rows pass.
- 3: holds. `backticks.ts` gives the rule, the resolved paths and the span; the count rerun gives 85 marked over 39 files, matching the report.
- 4: holds. `answers.ts` `answerBackticked` opens the target and the `#L` fragment through `uris.ts` `splitFragment`/`spelledForPage`.
- 5: violated. Behaviour 1 (the server's document cache is never told of Markdown files changed on disk) and Spec 1 (the merge keeps one root's entry per file).
- 6: holds. `manifests.ts` deletes a read `typeWritten` and sets it only when the type differs; `audit/projects.ts` `folderType` gives the conformance row; the harness rerun gives the three rows and 0 rows on the real hub.
- 7: holds for the bar, the note and the automatic save, with Behaviour 3 and Behaviour 4 against it.
- 8: holds. `portfolio.ts` tests `existsSync` before `open` in the scan loop; `openParent`, `openFile` and `openRootParent` already test their folder; the case 32 rerun prints no line.
- 9: holds. `rename.css` uses `var(--muted-txt, var(--muted))`, the token the editor theme gives `descriptionForeground`; `Editor.svelte` is 518 lines.
- 10: partial. Spec 2 (G36's Code line).

Cases of the brief's "Cases":

- 1: met by reading (`diagnostics.ts`, `source.md_no_such_path`) and the report's relay run 1; not rerun.
- 2: met by the report's relay run 1 and reading; not rerun.
- 3: met by the report's relay run 1; not rerun.
- 4: met by the report's relay run 1 and `backticks.ts` skipping fenced code and code spans; not rerun.
- 5: not verifiable here, a page case; reading of `answers.ts` and `hosts.ts` `lineOfFragment` gives the expected line.
- 6: not verifiable here, a page case; `answerMissing` returns no target for a missing file.
- 7: met by the report's relay run; not rerun.
- 8: met; the count rerun resolves `schema.py:61` to the file, line 61, unmarked.
- 9: met; the count rerun marks `docs/adr/` and `ls` shows it absent.
- 10: met; line 17 resolves to a folder, unmarked. The brief's case is right (Proof 1).
- 11: met by the `backticks.ts` rule and the `markdown-requests.test.ts` rows; the link form into `secrets` is under "Declined to judge".
- 12: met; the G3 rows of `markdown-requests.test.ts` pass in verify 2 and read as the brief asks.
- 13: met; the G2 rows pass and read as the brief asks.
- 14: met by the test row; Behaviour 5 on the order of the read.
- 15: met; the `lifetime.test.ts` row passes.
- 16: met; the row passes and reads 59.999 s and 60 s on fake time.
- 17: met by the report's relay run; not rerun.
- 18: met by the report's relay run; not rerun.
- 19: met by reading `link-rewrite.ts` `byRoot` (cross-root skipped), `ops.svelte.ts` (`moved` only after a rename and after the drop/paste loop with `finishedMoves`; `undoFile` does not call it).
- 20: met as written by the report's relay run; Spec 1 is the case it does not cover (an outer root's edit to a file inside the inner root).
- 21: not verifiable here; a page run would settle it, including whether `followDocuments` and the page's own didOpen of the moved tab send two didOpen for one uri.
- 22: met by reading; `RefactorPreview` `submit` holds a second preview as incoming.
- 23: met by the report's run 6, which edits only `guide.md`; Behaviour 1 is the stale-cache case the run does not reach.
- 24: met by reading `ops.svelte.ts` (one `moved` call with `finishedMoves` after the loop).
- 25: met; harness rerun.
- 26: met; harness rerun.
- 27: met; harness rerun (typeWritten undefined).
- 28: met; harness rerun, 0 rows.
- 29: partial; the bar and the automatic save hold by reading (`autosave.svelte.ts:84` needs `disk === 'same'`), Behaviour 3 (Cmd+S) and Behaviour 4 (the restore route) are not covered.
- 30: met by reading the 404 branch (`missing()` returns 'gone' under a served root).
- 31: met; the `uris.test.ts` row and the `wire.ts` `addressOf` resolve row pass.
- 32: met; harness rerun.
- 33: not verifiable here, a page case for the look on landing.
- 34: not verifiable here; the capabilities in `capabilities.ts` (triggers `. / # ( [ <`, quickfix, refactor, `source.organizeLinkDefinitions`) and the report's relay runs support it.

Acceptance items: the new catalog keys exist in the YAML catalog and pass `keys.test.ts`; the asynchronous paths (`editOf` raced against ASK_MS 30 s, `askLinks` LINKS_MS 60 s, `calls.ts` `end()` resolving null, the `asking` counter released in `finally`) hold by reading. The test of one asynchronous path waits on a margin (Standards 3).

The orchestrator's 13 points:

1. Paths outside the write list: hold. Each is needed by an item and sits within the layer rules; `boundaries.test.ts` passes.
2. Item 7: holds, with Behaviour 3 and 4.
3. Item 8: holds.
4. G3 (case 12), G2 (cases 13 and 31): hold.
5. The link rewrite: violated, Behaviour 1 and Spec 1.
6. Backticked counts and the case 10 line: the counts differ by a few files and no decision rests on them; the case 10 line is right (Proof 1).
7. Item 6: holds.
8. `rename.css` and its import in `Editor.svelte` (518 lines): hold.
9. Capabilities and the Outline fallback: hold; `outline.ts` `outlineOf('markdown')` already gives the heading reader.
10. `relay.ts` at 880 lines: holds; the publish code moved to `held/diagnostics/published.ts`.
11. Doc text for G2, G3 and G36: holds; G3's sentence is byte-identical to the brief's. The proposal to add `held/requests/links.ts` to G36's Code line is right (Spec 2).
12. The builder's git commands: Standards 4.
13. `refactor_preview.title_md_links`: holds. No `refactor:` group exists; `refactor_preview` sits at `config/text/views/sources/search.yml:32`.

## 1. Spec

- 1. `src/lib/server/machine/lsp/held/requests/links.ts:262`: "if (taken.has(name)) continue; taken.add(name); merged.push(one);". What is wrong: the merge keeps the first root's whole entry per page uri, holders sorted innermost first, so an outer root's edits to a file inside the inner root are dropped whenever the inner root also edits that file. The brief asks for every root's edits. Failure scenario: `tools/oculus/docs/a.md` holds `[x](../guide/b.md)` (inner-root edit) and a hub-rooted backtick `` `tools/oculus/guide/b.md` `` (outer-root edit); moving `guide/` gives a preview that rewrites the link and leaves the backtick naming the old path. Fix: merge edits per file, removing duplicates by range. Verdict: item 5 violated.
- 2. `agents/guarded.md` G36, Code line (main checkout): "Code: `src/lib/server/machine/lsp/held/process.ts`, `src/lib/server/machine/lsp/relay.ts`, ...". What is wrong: plan.md Z743 (d) says G2's and G36's Code and Test lines gain the Markdown entry; the server held for a link rewrite with no tab open is ended through `held/requests/links.ts` (`asking`, `armEnd(LINGER_MS)`), which the line does not name. The builder proposes the addition and cannot edit the plan files. Failure scenario: a later step changes `links.ts` and its guarded-entry check does not name G36. Verdict: item 10 partial; a fix at landing.

## 2. Proof

- 1. Builder's report, the case 10 line: it calls the brief's case 10 an error. What is wrong: the rerun resolves SKILL.md:17 `projects/manuscripts/hccnet-revision/code/` to an existing folder, unmarked, as case 10 says; line 16 (`projects/active/ward-bttr-crosssubject/`) is the marked one. The counts also differ (876/791/85 against the report's 884/799/85); no decision rests on them. Failure scenario: the orchestrator edits a correct case. Verdict: none.
- 2. Builder's report, the history-word check: it used its own word list, not spec.md's. My rerun with spec.md's list found no history wording. Verdict: none.

## 3. Standards

- 1. `src/lib/state/system/machine/refactor/link-rewrite.ts:74`: "parts.say(t('source.md_links_unanswered', root, reply.error));". What is wrong: spec.md maps engine errors to catalog lines; `reply.error` carries the literals from `links.ts` ('unsent', 'the Markdown server did not answer', 'the moves name no place under a served root') into a user-visible warning, and {0} is the root key. The warning is not in the report's table of visible changes. Failure scenario: after a move with the Markdown server failing, the user reads "links in Markdown files to hub ... unsent". Verdict: item 5 partial with Spec 1.
- 2. `src/lib/state/system/machine/refactor/link-rewrite.ts:39`: "const REFUSALS: Record<LspEditNotice, (words: string[]) => string> = {". What is wrong: spec.md's DRY rule; the 17 entries repeat `noticeWords` in `views/sources/source/language/notice-words.ts`. Failure scenario: a new `LspEditNotice` is worded in one table and not the other, and the link preview shows a different sentence than the rename preview. Verdict: none.
- 3. `tests/server/machine/lsp/lifetime.test.ts:397`: "for (let turn = 0; turn < 200 && askedOf() === undefined; turn += 1) await settle();" (and :410). What is wrong: spec.md says a test waits on a signal, never on a margin; `settle` is 12 setImmediate turns and the awaited work is real disk I/O. Failure scenario: under the full suite's load the read finishes after 2400 turns and the row fails, or passes by checking nothing. Verdict: case 16's proof weakened.
- 4. Builder's report, Standards: the builder ran `git -C . status` and `git ls-files`. What is wrong: spec.md gives builders no git; both are read-only and change no tracked content, though `git status` may refresh the worktree index's stat data. The report discloses them and also calls git "not available". Verdict: none.

## 4. Behaviour

- 1. `src/lib/server/machine/lsp/held/requests/links.ts:138`: "held.notify({ jsonrpc: '2.0', method: 'workspace/didChangeWatchedFiles', params: { changes } });" is the only file event oculus sends. What is wrong: the Markdown server updates its document cache only through `workspace/didChangeWatchedFiles` and the open-document notices; VS Code's client sends `**/*.md` events itself, oculus does not. The report's claim that "the server's watchers do not cover folder renames" is incomplete. Failure scenario: a first move makes the server read `README.md`; the file is then edited on disk (a tab saved and closed, an agent, git); a later move gets edits computed on the old text, the `lsp-edit` plan checks only that positions are in bounds, and Apply writes at the wrong offsets. A file deleted on disk and left in the cache makes the plan refuse the whole rewrite. Fix: a RootWatch match on the root's Markdown files that sends didChangeWatchedFiles. Verdict: item 5 violated; case 23 met only for the run's one file.
- 2. Same as Spec 1, seen by the user as a partly rewritten file. Verdict: item 5.
- 3. `src/lib/state/sessions/source/source.svelte.ts:630`: "async function performSave(" checks readonly, truncated and notText, not `disk === 'unserved'`. What is wrong: Cmd+S and the palette Save (`SAVE_ACTION`, `tab-save.svelte.ts`, `saveSourceDraft`) still post for an unserved tab; the server refuses and a failure line shows while the note says Save is not offered. Not in the report. Verdict: case 29 partial.
- 4. `src/lib/state/sessions/source/source.svelte.ts:332`: "if (answer.status === 404 && sourceDraft(id).loaded && unserved(root)) {". What is wrong (by reading, not verified by a run): `served()` is null while the workspaces load, so a restored tab whose 404 arrives then takes `error: cannot_open`; the effect at :247 later sets `unserved` without clearing the error. The builder's case 29 harness covers only the route where the served roots change. Verdict: case 29 partial.
- 5. `src/lib/server/machine/lsp/adapters/markdown/requests.ts:33`: "const bytes = await readFile(real); if (bytes.length > TEXT_LIMIT) throw ...". What is wrong: the whole file is read before the limit check, whereas `links.ts` `diskText` stats first. Failure scenario: a large `.md` (a log saved as Markdown) is read into memory on every server request for it. Verdict: case 14 met; minor.

## Declined to judge

- The relay runs 1 to 13 (cases 1 to 4, 7, 11, 17, 18, 20, 23, 34) start the Markdown server and were not rerun; their verdicts rest on the report's runs and my reading.
- The page cases 5, 6, 21, 29, 33 and 34 are for the look on landing; case 21 includes the possible double didOpen.
- Whether a Markdown link (not a backtick) into `secrets` opens a tab, which would make the docs sentence "never marked, completed or opened" false for links; needs the server or a page.
- Whether `scrub.ts` changing a completion item's `data` breaks `completionItem/resolve`; not verified.
- The one failed run of the four check files: the failing test is not identified; three reruns passed.

Reviewer usage: a0542130f88439869, claude-opus-5-5, tokens not known, about 115 tool uses, minutes not known.

## Repair round 1, refuted

Reviewed tree: `.agents/worktrees/D41`, base 53fa9b002. Round delta read against `.agents/worktrees/D41-round0/tools/oculus`. I changed nothing in the worktree or the ledger. My scratch copy and probes were under $TMPDIR and have been removed.

```
$ npm run test:quick            (from .agents/worktrees/D41/tools/oculus, node v24.21.0)
run 1, load average 18.9 to 19.1:
 Test Files  6 failed | 113 passed | 3 skipped (122)
      Tests  8 failed | 1028 passed | 23 skipped (1059)
ok      svelte-check (239.8 s): ... COMPLETED 441 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
test:quick: 338.5 s (limit 45.0 s); failed: vitest
test:quick: over the time limit
(One failure was shown: tests/server/machine/lsp/servers.test.ts:74, which is a turn-count loop
"for (let turn = 0; turn < 30 && spawned.calls.length < 5; ..."; the other five failing files were
not kept. The step does not change servers.test.ts.)
run 2, load average 17.0 to 19.4:
ok      ASCII gate (14.8 s)
ok      svelte-kit sync (56.0 s)
ok      prettier (14.8 s): All matched files use Prettier code style!
ok      eslint (98.5 s)
ok      svelte-check (113.8 s): ... COMPLETED 441 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (182.1 s): Duration  140.68s ...
test:quick: 90 changed file(s), from git since HEAD
test:quick: 122 test file(s), 10 essential
test:quick: 201.0 s (limit 45.0 s); every command passed
test:quick: over the time limit

$ npx vitest run tests/server/machine/lsp/servers.test.ts
 Test Files  1 passed (1)      Tests  6 passed (6)

$ npx vitest run tests/server/machine/lsp/adapters/markdown-requests.test.ts tests/server/machine/lsp/uris.test.ts tests/server/machine/lsp/lifetime.test.ts
 Test Files  3 passed (3)      Tests  84 passed (84)

$ wc -l relay.ts servers.ts ops.svelte.ts Editor.svelte
 880 / 864 / 696 / 518

$ sh utils/folder-check.sh; echo folder=$?
folder=0
$ sh utils/unused-exports.sh vs .agents/worktrees/D41-base/tools/oculus/unused-exports.txt
364 lines, identical
$ spec.md perl ASCII gate over src tests config (local.yml excluded; there is no bin folder)
ascii=0, no output; DESIGN.md, docs/files-and-search.md, docs/DATA-MAP.md: 0 non-ASCII lines
$ added lines over 100 columns in the round's changed files: none
$ history words in the round's added comments and test titles: only ordering words
  ("comes before the second", "before they are read", "before the served roots were known",
  "sent before or is sent later")

$ npx vitest run --no-isolate --testTimeout 0 --hookTimeout 0 tests/server/machine/lsp tests/state tests/checks tests/ui/controls tests/views/sources
 Test Files  49 passed (49)    Tests  608 passed (608)   Duration 224.09s
$ npx vitest run --no-isolate --testTimeout 0 --hookTimeout 0 tests/data tests/server tests/routes tests/shell tests/fixtures
 Test Files  137 passed (137)  Tests  1028 passed (1028) Duration 989.11s

The builder's round probes, rerun with its scripts in $TMPDIR/d41r1 ("after" with OC set to the
worktree; "before" with OC set to $TMPDIR/d41r1/before, whose src is the same as D41-round0's src
by diff -rq):
probe1  before: {"changes":[["inner/docs/a.md",["3:4-17 -> ../library/b.md"]]]}
probe1  after:  {"changes":[["inner/docs/a.md",["3:4-17 -> ../library/b.md","3:24-47 -> tools/oculus/library/b.md"]]],"overlaps":[]}
probe1b after:  a.md gets the shared edit once plus the outer edit; "overlaps":["oculus-file:///inner/c.md"]
probe4  before: SECOND ... {"changes":[]}
probe4  after:  SECOND ... {"changes":[["ws/README.md",["7:4-17 -> documentation/DATA.md"]]]}  README.md link is on line 7
probe4b before: SECOND ... [["ws/other.md",...],["ws/README.md",...]]
probe4b after:  SECOND ... {"changes":[["ws/README.md",["3:4-17 -> documentation/DATA.md"]]]}
probe8  before: pulls=undefined -> ["textDocument/diagnostic"]; pulls=true -> ["textDocument/diagnostic"]
probe8  after:  pulls=undefined -> []; pulls=true -> ["textDocument/diagnostic"]
relay run10 after: CASE 14 readFile big.md refused: Error: the file is too large to read / small.md bytes: 4
relay run9  after: CASE 14 links answered: 3 error: null / symbols answered: ["# L"]
probe2.test.ts and probe56.client.test.ts, run in a scratch copy of the tree (node_modules linked,
local.yml not copied): Test Files 2 passed (2), Tests 3 passed (3); output identical to the
report's "after" lines: SAID [the three md_links_* sentences for a, b, c; "Two served folders
rewrite the same text of docs/a b.md differently; it is left as it is."]; ITEM 5 save returned
false, requests sent 0, message = the disk_unserved sentence; ITEM 6 [] -> disk unserved, error "";
["fixture"] -> error "Cannot open: The server refused the request (HTTP 404)."

$ node watch-probe.ts (my probe: a RootWatch registered with the Markdown entry's own glob
**/*.md over a scratch root, then one file written in each folder)
["1 docs/a.md","1 node_modules/p/README.md","1 secrets/key.md"]

$ git status --short (inside the worktree)
src/lib/state/system/machine/refactor/notice-words.ts is "??" (untracked, not intent-to-add);
src/lib/views/sources/source/language/notice-words.ts is " D". The landing commit has to stage the
new file explicitly.
```

I did not rerun the builder's backticked-path count: its `count.ts` is not in $TMPDIR. No decision depends on the count.

### Verdicts

Items of the brief's "What to build", for the whole diff since the base:

- 1: holds. The round's item 7 added a stat check before `readFile` (`requests.ts:33`; run10 reproduces). The round's item 8 added the `pulls` check (`held.ts:417`; probe8 reproduces). Spec 1 below is a G3-adjacent leak of path names, not of file content.
- 2: holds. The `pulls` check means a server that pushes its diagnostics is not pulled.
- 3: holds (no change in the round).
- 4: holds (no change in the round).
- 5: violated, Behaviour 1. The first run's Spec 1 / Behaviour 2 (per-file merge) is closed: probe1 and probe1b reproduce. Its Behaviour 1 (disk changes reaching the server) is closed: probe4 and probe4b reproduce. Its Standards 1 (catalog wording) is closed: the four sentences are byte-identical to the round brief, and probe2 reproduces. What remains open is that a server failing for one of several roots is silent.
- 6: holds (no change in the round).
- 7: holds. Behaviour 3 is closed: `performSave` refuses at `source.svelte.ts:658`. Behaviour 4 is closed: the 404 waits in `unsettled`. probe56 reproduces both. Behaviour 2 below is a remaining edge case, and Proof 1 below concerns the report's evidence.
- 8: holds (no change in the round).
- 9: holds (no change in the round).
- 10: partial, Spec 2. The G36 Code line still lacks `held/requests/links.ts`. The round did not send this; it is for landing.

Cases:

- 1, 2, 3, 4, 7: met by the report's relay runs 1, 11 and 13 and by reading; not rerun.
- 5, 6: not verifiable here; they are page cases for the look on landing.
- 8, 9, 10: met. The report now states case 10 correctly: line 17 is an existing folder and is not marked, and line 16 is the marked one.
- 11: met by the rule in `backticks.ts` and the test rows.
- 12, 13: met; verify 2 passes.
- 14: met; run10 and run9 reproduce, and the file size is now checked before the read.
- 15, 16: met. Case 16's row now waits on signals (`childOf`, `sentOf`, `arrival`) and passes.
- 17, 18, 19: met by the report's relay runs and by reading; not rerun.
- 20: met; probe1 shows the outer root's backtick edit kept beside the inner root's link edit.
- 21, 22: not verifiable here; page cases.
- 23: met; probe4 and probe4b show the second rewrite computed on the new text, with the deleted file dropped.
- 24: met by the report's unit run and by reading.
- 25 to 28: met by the report's audit harness; nothing changed in the round.
- 29: met. probe56 shows Save refused with the unserved sentence, no request sent, and the restore path settled. Cmd+S and the palette's Save reach `saveSourceDraft` by reading (Proof 1). The bar and the note are for the look on landing.
- 30: met by reading; nothing changed in the round.
- 31: met; verify 2.
- 32: met by the report's harness; nothing changed in the round.
- 33: not verifiable here; page case.
- 34: met by the report's relay runs; the Outline is for the look.

### Findings

Spec

- 1. `src/lib/server/machine/lsp/servers.ts:787`: "fileEvents: () => extensions().map((extension) => `**/*.${extension}`)", registered at `held.ts:510-523` through `RootWatch`.
  - What is wrong: `RootWatch` leaves out only `.git`, so this registration sends `workspace/didChangeWatchedFiles` to the Markdown server for `.md` files under the hub's `secrets` folder and under `node_modules`. My watch-probe printed "1 secrets/key.md" and "1 node_modules/p/README.md". The round 0 tree never named a path under `secrets` to this server; the test row "watchers are not made for a file under secrets" exists for that reason. G3's new sentence says no file under `secrets` "is given to the ... Markdown language server". `DESIGN.md` 166 says such a file is "never given to it".
  - Why the damage is limited: the server acts only on files already in its cache (`workerMain.js:25015-25048`), and `readFile` refuses `secrets`, so no content leaks.
  - Failure scenario: a file `secrets/<client>-contract.md` is saved while a hub Markdown server runs. Its full path reaches the server process, and the server logs it at trace level.
  - Fix at landing: register with `registerMatch` and a test that drops `withheld(...)` paths, dot folders and `node_modules`, the same set `markdownFiles` leaves out.
  - Verdict: no item violated; it bears on item 10's G3 sentence.
- 2. Carried from the first run (its Spec 2): `agents/guarded.md` G36's Code line does not name `src/lib/server/machine/lsp/held/requests/links.ts`, which starts the server for a rewrite and arms its end. The round brief leaves this to landing.
  - Failure scenario: a later step changes `links.ts`, and its guarded-entry check does not point at G36.
  - Verdict: item 10 partial.

Proof

- 1. Report, round section 5: "Cmd+S (`views/sources/source/save/tab-save.svelte.ts:36`) and the palette's Save (`state/client/context.ts:423`) both call `saveSourceDraft`".
  - What is wrong: `context.ts:423` is the LaTeX `saveAll` loop, not the palette Save. The palette path is `shell/Workbench.svelte:238` (`SAVE_ACTION`), then `views/sources/source/status/ask-perform.ts:60` (`run: deps.save`), then `tab-save.svelte.ts` `save()`, then `deps.saveDraft` (= `saveSourceDraft`, `Source.svelte:244`). The conclusion holds by that reading.
  - The round brief asked for "a probe run of each, before and after". The only probe calls `saveSourceDraft` directly.
  - Failure scenario: the orchestrator checks the wrong line when it confirms the palette path.
  - Verdict: none; case 29 is met by reading.

Standards: none. The round's files are under the size line, folders hold at most ten items, new comments carry no history and end by column 100, the ASCII gate passes, and unused exports are unchanged.

Behaviour

- 1. `src/lib/server/machine/lsp/held/requests/links.ts:255-258`: "if (found === null) { failed = true; continue; }", together with `:274`: "if (failed && changes.length === 0 && overlaps.length === 0) return { error: 'no_answer' };".
  - What is wrong: when several roots hold a move and one root's server ends or does not answer within `ASK_MS` while another root answers with edits, the answer carries those edits and no error. The page opens a preview with nothing said about the failed root. Brief item 5 says a server that ends while a rewrite is asked answers with an error. Round item 2 says `links.ts` answers a code for each failure. The report does not state this case.
  - Failure scenario: a folder under `tools/oculus` is moved. The inner root's server answers. The hub root's server ends mid-request. The preview lists only the inner root's edits, and the hub's Markdown files that link into the moved folder keep their old links with no notice.
  - Fix at landing: answer the failed roots beside the edit and say `md_links_no_answer` for each one.
  - Verdict: item 5 violated (in the multi-root case only).
- 2. `src/lib/state/sessions/source/source.svelte.ts:346-349`: "if (deps.served() === null) { unsettled.set(id, ...); return; }".
  - What is wrong: `served()` is `readRoots(fs.workspaces())`, which is null while the workspaces load and also while their read has failed (`fs-transport.ts:95`, `saved.error !== ''`). A restored tab whose 404 arrives in the failed state shows its old text with no error and disk `same` until the workspaces read succeeds. Before the round it said "Cannot open" at once. The report states only the loading case.
  - Failure scenario: the workspaces read fails and a restored tab's file was deleted on disk. The tab shows no "Cannot open" line and no gone note, so the reader keeps editing a file that is not there.
  - Verdict: case 29 met; an edge case of the round's item 6 for the orchestrator to judge.
- 3. `src/lib/state/system/machine/lsp/lsp.svelte.ts:369,381`: "if (answer === null) resolve({ ok: false, error: 'unsent' })", reached also by the 60 s `LINKS_MS` timeout.
  - What is wrong: a request that was sent but not answered within 60 s is reported with "the Markdown server could not be asked". The `md_links_no_answer` sentence is the true one for that case. The report states the choice but not that the sentence is wrong.
  - Failure scenario: a move held by two roots whose servers both hang. The relay times out at 30 s plus 30 s, the page gives up at 60 s first, and the reader is told the server could not be asked.
  - Verdict: none; the wording should be fixed at landing.

### Declined to judge

- Whether round item 1's "the preview's warning line" means the warning notification (`parts.say`, which the build uses) or a line inside the Refactor Preview. The preview's only line is its `failed` alert for Apply. This is the orchestrator's reading.
- Run 1 of `test:quick` failed 8 tests in 6 files under a load average of 19. Only `servers.test.ts` was identified; it passes alone and is not changed by the step. Run 2 passed every command. The 45 s limit was exceeded in both runs, as the builder reported, under the load of the other builders.
- The builder's relay runs 1 to 8 and 11 to 13 for cases 1 to 4, 7, 11, 17 to 20, 23 and 34 were not rerun beyond run9 and run10. Nothing in the round changes their code paths, apart from those my probes cover.
- The backticked-path counts (886 / 801 / 85 / 39 / 68 in the report) were not reproduced, because `count.ts` is not available. No decision rests on them.
- A Markdown server now holds two recursive `fs.watch` of its root: `Held`'s and `Followed`'s. The cost on the hub root was not measured.
- `.md` files under dot folders (for example `.agents/skills/*`) match no file-event glob (`matchesGlob('.agents/skills/x/SKILL.md', '**/*.md')` is false). A cached link target there stays stale after a disk edit. With fragment-link validation off, I judged this minor and did not probe it.
- The page cases 5, 6, 21, 22, 29 (bar and note), 33 and 34 are for the look on landing.

Reviewer usage: agent id not known to me, claude-opus-5-5, tokens not known, about 75 tool uses, about 40 minutes.

## Closed (at landing)

- Spec 1 (the Markdown server told of a file under `secrets`, a dot folder or `node_modules`): closed at landing. `server/machine/lsp/held/watch.ts` gains `entryFiles(globs, refused)`, a match that drops a path under a dot folder or `node_modules` and a path the entry's `refuses` withholds; `held.ts` `#watchEntryFiles` registers through `registerMatch` with it. Test: `tests/server/machine/lsp/adapters/markdown-requests.test.ts`, four rows "tells the server a change on disk of %s: %s" (a file at the root and in a folder told; a file under `secrets` and under `node_modules` not told).
- Spec 2 (G36's Code line): closed at landing. `agents/guarded.md` G36's Code line names `held/requests/links.ts`.
- Proof 1 (the palette Save's line): no change needed. The palette path is `shell/Workbench.svelte:238` to `ask-perform.ts:60` to `tab-save.svelte.ts` to `saveSourceDraft`, the reviewer's reading, and case 29 is met by it.
- Behaviour 1 (a root that does not answer beside one that does): closed at landing. `held/requests/links.ts` answers `unanswered: string[]` beside the edit, and `no_answer` only when no root answered; `model-machine.ts`'s `links_answer`, `lsp.svelte.ts`'s `LinksReply` and `link-rewrite.ts` carry it, the last saying `md_links_no_answer` for each root named. Tests: `tests/server/machine/lsp/lifetime.test.ts` "a link rewrite of a move two roots hold" (the inner root answers, the outer one times out, `unanswered: ['repo']`) and `tests/state/system/link-rewrite.test.ts` (three rows). `DESIGN.md:576` states it.
- Behaviour 2 (a restored tab whose file is gone while the served roots' read has failed): closed at landing. `SourceDeps.rootsFailed` (`state/client/context.ts`: `fs.workspaces().error !== ''`) lets `source.svelte.ts` settle the 404 at once when the read failed. Test: `tests/state/sessions/source.test.ts` "a restored source tab whose file is gone, before the served roots are known" (two rows).
- Behaviour 3 (the 60 s timeout said as "could not be asked"): closed at landing. `lsp.svelte.ts` ends a timed-out request with `no_answer` and a failed write with `unsent`.

# Prepared again from main, base d13535993

## Step D41 refuter report (on .agents/worktrees/D41, base d13535993)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

### Verification (rerun by the reviewer)

```
$ npm run test:quick -- --base d13535993      (from .agents/worktrees/D41/tools/oculus, node v24.21.0, load average 7.5 to 12.7)
        tests/checks/source/keys.test.ts: changed, run by npm run test:checks
        tests/server/machine/lsp/adapters/markdown-created.test.ts: changed, run by npm run test:slow
ok      ASCII gate (5.2 s)
ok      svelte-kit sync (5.2 s)
ok      prettier (5.2 s): All matched files use Prettier code style!
ok      eslint (44.0 s)
ok      svelte-check (57.3 s): 1791564330934 COMPLETED 444 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (98.2 s): Duration  93.04s (transform 128.67s, setup 0ms, import 183.73s, tests 176.19s, environment 410ms)
test:quick: 103.6 s (limit 45.0 s); every command passed
test:quick: over the time limit
second run:
test:quick: 93 changed file(s), from git since d13535993
test:quick: 119 test file(s), 10 essential
test:quick: 125.0 s (limit 45.0 s); every command passed
test:quick: over the time limit

$ npx vitest run tests/server/machine/lsp/adapters/markdown-requests.test.ts tests/server/machine/lsp/uris.test.ts tests/server/machine/lsp/lifetime.test.ts
 Test Files  3 passed (3)
      Tests  89 passed (89)

$ npx vitest run --testTimeout 0 --hookTimeout 0 tests/checks/tree tests/checks/source/keys.test.ts tests/checks/config/config.test.ts tests/checks/source/history.test.ts tests/checks/source/comment-width.test.ts tests/checks/diagrams tests/state/sessions/source.test.ts tests/state/system/link-rewrite.test.ts tests/state/system/refactor-preview.test.ts tests/ui/controls/editor/lsp-transport.test.ts tests/checks/imports
 Test Files  15 passed (15)
      Tests  201 passed (201)
(the same set with the default 5000 ms timeout, load average about 17: 9 tests timed out in order, diagrams and comment-width; none failed on an assertion)

$ wc -l relay.ts servers.ts ops.svelte.ts Editor.svelte
     880 / 879 / 696 / 518

$ sh utils/folder-check.sh; echo folder=$?
folder=0
$ sh utils/unused-exports.sh > $TMPDIR/rv41-unused.txt; diff it .agents/worktrees/D41-base/tools/oculus/unused-exports.txt
diff=0, 364 lines each   (the report says 365 each; no decision rests on the count)
(D41-base is at the new base: docs/window.md, which D57 changed, is byte-equal to the worktree's)

$ HOME=$TMPDIR/rv41home npx vitest run tests/server/machine/lsp/adapters/markdown-created.test.ts --testTimeout 20000 --reporter=verbose   (twice)
 ok 'a file created after the first refere...' 722ms / 405ms
 ok 'a file moved after the first referenc...' 755ms / 400ms
 ok answers a second move from the files as the first move left them 412ms / 196ms
 Test Files  1 passed (1)   Tests  3 passed (3)   (both runs)

$ spec.md perl ASCII gate over $(find src tests config -type f ! -name local.yml)
ascii=0, no output
$ LC_ALL=C grep -n '[^ -~]' DESIGN.md docs/files-and-search.md docs/views.md README.md ../../docs/DATA-MAP.md
(no output)
$ history words (before, used to, no longer, still, always, previously, as before, the step adds) over notices.ts and markdown-created.test.ts
notices.ts:50: "Send a list of changes after the lists before it."   (an ordering word, no history)
$ awk 'length>100' over notices.ts, markdown-created.test.ts, held/watch.ts
(no output)

$ grep -rnE '^(<<<<<<<|>>>>>>>|=======$|\|\|\|\|\|\|\|)' --exclude-dir=node_modules --exclude=local.yml .  (worktree tools/oculus, .scratch left out)
(no output); grep -rlE '^(<<<<<<< |>>>>>>> )' over the same: (no output)
$ git status --short (worktree)
UU tools/oculus/docs/diagrams/layer-views.dot      (index still unmerged; the file holds no marker and tests/checks/diagrams passes)
?? tools/oculus/src/lib/server/machine/lsp/held/requests/notices.ts
?? tools/oculus/tests/server/machine/lsp/adapters/markdown-created.test.ts

servers.test.ts (the report's one unexplained failure at :228):
$ npx vitest run tests/server/machine/lsp/servers.test.ts     six runs, load average 16.7 to 18.5
      Tests  6 passed (6)   (each of the six)
$ HOME=$TMPDIR/rv41home npx vitest run tests/server/machine/lsp --testTimeout 20000     three runs, load average 12.4 to 13.3
 Test Files  12 passed (12)       Tests  175 passed (175)   (each of the three)

Report evidence rerun (the builder's probe scripts in the session scratchpad probe/, from tools/oculus, TREE=$PWD HOME=$TMPDIR/rv41home node --experimental-strip-types --no-warnings <script>):
$ stat.ts (HUB=the worktree root, which holds no secrets folder: test -d secrets printed no-secrets), three runs
files=469 firstCall changes=0 secondCall changes=0 secondCallMs=1.5 / 1.4 / 1.2      (report: 2.8 ms)
$ c34.ts MODE=created with OPEN_README=0, OPEN_README=1, OPEN_README=0 RESTART=1, OPEN_README=1 RESTART=1 (the last twice)
MODE=created OPEN_README=0 references on ## Intro: ["hub/README.md:0"]
MODE=created OPEN_README=1 references on ## Intro: ["hub/README.md:0"]
MODE=created OPEN_README=0 references on ## Intro: ["hub/README.md:0"] / after restart references on ## Intro: ["hub/README.md:0"]
MODE=created OPEN_README=1 references on ## Intro: ["hub/README.md:0"] / after restart references on ## Intro: ["hub/README.md:0"]   (both runs)
$ c34.ts MODE=created FULL=1
completion after ](: ["README.md","docs/","warm.md"]
definition on [sec](docs/DATA.md#intro): {"uri":"oculus-file:///hub/docs/DATA.md","range":{"start":{"line":4,...
prepareRename on ## Intro: {"range":{"start":{"line":4,"character":3},"end":{"line":4,"character":8}},"placeholder":"Intro"}
rename ## Intro -> Start: DATA.md 4:3-4:8 "Start" and README.md 0:48-0:53 "start" (README.md not open)
documentSymbol of DATA.md: ["# Data"]
$ cl.ts CASE=23 GAP=0, 0, 10, 100
      hub/README.md: 1:8-1:21=>"manual/DATA.md" ; 1:31-1:50=>"manual/DATA.md#intro" ; 1:57-1:70=>"manual/DATA.md"   (each of the four)
$ cl.ts CASE=17 / 18 / 20
case 17: hub/README.md: 1:8-1:20=>"guide/DATA.md" ; 1:30-1:48=>"guide/DATA.md#intro" ; 1:55-1:67=>"guide/DATA.md"; nothing written by the ask: true
case 18: hub/docs/other.md: 1:15-1:27=>"../sub/README.md"; hub/sub/README.md: 1:8-1:20=>"../docs/DATA.md" ; 1:30-1:48=>"../docs/DATA.md#intro"
case 20: inner/README.md: 1:8-1:20=>"guide/DATA.md"; hub/README.md: 1:8-1:32=>"tools/inner/guide/DATA.md" ; 1:39-1:63=>"tools/inner/guide/DATA.md"
$ c1.ts
c1.md [[0,2,"link.no-such-file","File does not exist at path: docs/missing.md"]]; c2.md []; c3.md []; c4.md []
$ c5.ts
resolve target: "oculus-file:///hub/docs/DATA.md"; "oculus-file:///hub/docs/DATA.md#L5,1"; undefined (missing); machine path in any field: false
$ c7.ts HUB=the worktree root (read only)
case 7  CLAUDE.md: [[3,2,"link.no-such-file","File does not exist at path: projects/manuscripts/CLAUDE.md"]]
case 8  definition: [{"uri":"oculus-file:///hub/tools/cockpit/src/cockpit/schema.py","range":{"start":{"line":60,...
case 9  line 78 diagnostics include the docs/adr/ mark among absent tools/figures/*.svg marks
$ ca.ts (scratch hub) and CASE=28 HUB=the worktree root
projects/archive/nogo/y | conform | type dropped is not the folder's nogo
projects/coauthor/abandoned/v | conform | type in-prep is not the folder's abandoned
projects/ideas/x | conform | type active is not the folder's idea
project keyed type= idea typeWritten= undefined
case 28 real hub (the worktree, read only): projects 94 audit rows of this kind 0 []

Reviewer's own probe ($scratchpad/rv41/folder-move.ts and folder-move2.ts: the real relay and server over a scratch root holding warm.md, docs/DATA.md and notes/README.md = "[sec](../docs/DATA.md#intro)"; references on warm.md first; then the change; DATA.md opened; references on ## Intro asked every 200 ms for 6 s):
MODE=folder    (notes/ renamed to letters/ on disk)            references on ## Intro: ["hub/notes/README.md:0"] NOT LISTED   (twice)
MODE=file      (notes/README.md renamed to notes/LETTER.md)    references on ## Intro: ["hub/notes/LETTER.md:0"] LISTED
MODE=filesview (notes/ renamed, then the page's `links` ask for notes -> letters, as the Files view sends it)
               links_answer edit: null error: undefined; references on ## Intro: [] NOT LISTED   (twice)
```

Not rerun: the report's 49-file run of the guarded entries' tests (its file list is not on disk); I ran the subset above. c10, c11, c14, c32 and the case 29 scratch client test were not rerun; their code paths are the reviewed patch's and the rows that guard them passed above.

### Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. Verify 2 (89 passed, the G2 and G3 rows); c1, c5 and c34 FULL reruns give the marks, the resolve with its `#L` fragment and no machine path, completion, definition, prepareRename, rename and symbols.
- 2: holds. c1 rerun gives the one `link.no-such-file` mark with the path from the root; `relay.ts` is 880 lines.
- 3: holds by the c5 rerun (targets with and without `#L5,1`, none for a missing file); the click itself is the look at landing.
- 4: holds. c7 rerun: case 8's definition at line index 60, case 9's `docs/adr/` mark.
- 5: holds. cl.ts reruns of cases 17, 18, 20 and 23; `link-rewrite.test.ts` and `refactor-preview.test.ts` pass. Behaviour 2 and Standards 2 bear on its wait.
- 6: holds. ca.ts rerun gives the three rows, `typeWritten` undefined for a manifest key, and 0 rows on the worktree's hub.
- 7: holds. `tests/state/sessions/source.test.ts` passes (the restored-tab rows with `rootsFailed`, `source.svelte.ts:349`); the note and the bar are the look.
- 8: holds by reading `portfolio.ts` (the `existsSync(dir)` test before `open`, `openParent` for a missing folder); case 32's harness not rerun.
- 9: holds. `kit/theme/rename.css` (doubled class, `var(--muted-txt, var(--muted))`), imported by `Editor.svelte` (518 lines); the line itself is the look.
- 10: holds. The report's "Doc text" gives G2, G3 (word for word as ruling 24) and G36 as they are and as they become; G72's Test line differs from ruling 29 (Spec 1, Standards 3).
- 11: violated. Behaviour 1 (a Markdown file moved by the rename of its folder is not in the workspace answers, so the item's heading and G72's sentence do not hold for a folder move) and Spec 1 (a third test beyond the two rows ruling 29 names). The mechanism the item dictates (`introduce` on Created Markdown changes, the ordered chain, the 10 s bound, servers.ts at 879) is built and closes the diagnosed cause for a single file: G72 rows 1 and 2 pass, and every c34 form, README open and after a restart included, lists the link.

Cases of the brief's "Cases":

- 1: met; c1 rerun. The Problems view row is the look.
- 2: met; c1 rerun (`c2.md []`).
- 3: met; c1 rerun (`c3.md []`).
- 4: met; c1 rerun (`c4.md []`).
- 5: not verifiable here (the click is a page case); c5 rerun gives the targets the opener receives.
- 6: not verifiable here (page case); c5 rerun gives no target for the missing file.
- 7: met; c7 rerun.
- 8: met; c7 rerun.
- 9: met; c7 rerun.
- 10: met by the report's scratch-root run c10 (the file is not in the worktree); not rerun.
- 11: met by the report's c11 run and the `backticks.ts` rule rows; not rerun.
- 12: met; verify 2.
- 13: met; verify 2.
- 14: met by the report's c14 and c14b runs and the stat before the read (`requests.ts:40`); not rerun.
- 15: met; verify 2 (lifetime row).
- 16: met; verify 2 (lifetime row on fake time).
- 17: met at relay level (cl.ts CASE=17 rerun, nothing written by the ask); the preview title, Apply and the History record are the look.
- 18: met; cl.ts CASE=18 rerun.
- 19: met by the report's run (`edit=null`) and reading; not rerun.
- 20: met; cl.ts CASE=20 rerun.
- 21: not verifiable here; the report's cl.ts CASE=21 gives the edits with the tab text, the tab is the look.
- 22: met by reading and `refactor-preview.test.ts` passing.
- 23: met; cl.ts CASE=23 at GAP 0, 0, 10 and 100 gives all three edits. Behaviour 2 names the timing the wait rests on.
- 24: met by reading `ops.svelte.ts` (one `moved(finishedMoves)` per paste or drop).
- 25: met; ca.ts rerun.
- 26: met; ca.ts rerun (the y and v rows, none for z and w).
- 27: met; ca.ts rerun (`keyed` and `notype` give no row, `typeWritten` undefined).
- 28: met; ca.ts CASE=28 rerun, 0 rows.
- 29: met for the store (source.test.ts passes); the note and the bar are the look.
- 30: met by the report's scratch test and reading; not rerun.
- 31: met; verify 2 (the uris.test.ts row) and the c5 rerun.
- 32: met by the report's c32 runs; not rerun.
- 33: not verifiable here; a page case for the look on landing.
- 34: met at relay level: every c34 rerun lists README's link (README open or not, before and after a restart), and completion, definition, prepareRename, rename and symbols answer. The Outline fallback and the page's Shift+F12 are the look. The look's own unexplained part (README open, Restart) did not reproduce at relay level, before or after item 11.
- 35: met; G72 row 1 passes (two runs); its failure before item 11 is quoted in the report.
- 36: met as written (a file moved); G72 row 2 passes. A folder move is not covered (Behaviour 1).

### 1. Spec

- 1. `tests/server/machine/lsp/adapters/markdown-created.test.ts:191-208`: "it('answers a second move from the files as the first move left them', async () => { ... writeFileSync(join(root, 'README.md'), '[a](guide/DATA.md) [b](guide/DATA.md#intro)\n'); const second = (await move(41, 'guide', 'manual')) ...". What is wrong: ruling 29 gives G72 two rows (a file created, a file moved, both read by references); the brief says every case other than 12, 13, 15, 16 and 31 "is checked by a run the report quotes", and case 23 is one of them. This third test, outside the `it.each` table, guards a file changed on disk just before a second link rewrite (the `caughtUp` wait), which G72's sentence ("A Markdown file created, moved or renamed on disk ... is in the server's workspace answers") does not state. The report's Doc text lists it as a third G72 row. spec.md, "What every package obeys": a test exists only as the test of one entry, and a step that needs a new entry stops and asks Axel. Failure scenario: the orchestrator writes the Doc text as given, and `agents/guarded.md` then holds under G72 a row guarding a guarantee its sentence does not name, a widening of a ruled entry nobody ruled; or the row is dropped at landing and case 23's fix has no test. Either way it is the orchestrator's choice to make: drop the row (case 23 stays the quoted cl.ts run), or put G72's widened sentence to Axel. Verdict: item 11 violated (with Behaviour 1).

### 2. Proof

- 1. Report, "Anything wrong or impossible in the brief": "The section 'The patch as applied' that the brief names (`grep -n "The patch as applied" agents/briefs/D41.md` prints nothing) is not in the brief". What is wrong: the ledger's brief holds that section at its end (`tools/oculus/.scratch/migration/agents/briefs/D41.md:376-378`), added by commit 0d3a339f6 ("Launch D41's builder again: Add the patch as applied to D41's brief"), which came after the worktree's base d13535993. The worktree's copy of the brief, the one the builder read, does not hold it (`diff` of the two copies: lines 375-378 only in the ledger's). The builder's statement is true of its copy and false of the ledger. What the section says reproduces: the only file the patch left with markers was `layer-views.dot`; no conflict marker is left anywhere under the worktree's `tools/oculus` (the grep above prints nothing); `tests/checks/diagrams` passes; the index still shows `UU` for `layer-views.dot`, and `notices.ts` and `markdown-created.test.ts` are untracked, so the landing stages all three explicitly. Failure scenario: a reader of the report concludes the orchestrator dispatched an incomplete brief; the cause is the brief edit after the base. Verdict: none.

### 3. Standards

- 1. `tests/server/machine/lsp/adapters/markdown-created.test.ts:173-185`: "const end = Date.now() + WAIT_MS; while (Date.now() < end && !found.includes(pageFile('hub', listed))) { ... await new Promise((resolve) => setTimeout(resolve, 100)); }". What is wrong: spec.md, "What every package obeys": "A test waits on a signal (an event, a promise, a fake clock), never on a fixed sleep or a wall-clock margin". Rows 1 and 2 poll references every 100 ms against an 8 s wall clock (`WAIT_MS = 8000`). The signal exists in the harness: the recording sink sees the relay's frames, and the server's `markdown/fs/readFile` of the created file (the relay's handler) or the notice could be awaited before the one references ask. Failure scenario: under the load seen in this session (load average 17 to 19, test:quick at 103 to 157 s), the 200 ms debounce, the `introduce` ask and the server's reads pass 8 s and the row fails with the behaviour correct, at `npm run test:slow` on landing. Verdict: none (the rows pass here).
- 2. `src/lib/server/machine/lsp/held/requests/links.ts:14-16`: "A root whose server ended or did not answer within 30 s is named in the answer beside the edits of the others". What is wrong: `editOf` awaits `held.caughtUp(files)` (`links.ts:160`) before the 30 s race (`links.ts:166-180`), outside it. `caughtUp` waits for the whole chain of notices (`notices.ts:84`), each list bounded by `INTRODUCE_MS` 10 s (`notices.ts:19, 96-105`), then up to `SETTLE_MAX_MS` 2 s (`notices.ts:123-129`). The sentence is false for that part of the wait (spec.md: a head comment the change makes false is a defect of the change). It cannot wait forever: every list ends within 10 s, `Calls.end()` answers null when the server exits, and `call` with `start=false` answers null at once for a server not running. Failure scenario: a hub Markdown server that does not answer `markdown/resolveLinkTarget` while a checkout writes Markdown files in seven debounced lists; the next move's rewrite waits about 70 s in `caughtUp` and 30 s more for the edit; the page gives up at `LINKS_MS` 60 s with "did not answer", while `held.asking` keeps the server alive; a reader of the comment expects a 30 s bound. Fix at landing: the sentence says the wait before the ask, or the 30 s race covers `caughtUp` too. Verdict: none.
- 3. Placement of G72's test: `tests/server/machine/lsp/adapters/markdown-created.test.ts` (the ruled path is `tests/server/machine/lsp/markdown-created.test.ts`). What is wrong: `tests/server/machine/lsp` holds ten items (the `ls` above), so the ruled path breaks the folder rule; the builder disclosed it (Judgment call 1). spec.md says a folder that would pass ten "is split into folders named for what they hold", and "a new file goes where its concern already lives"; the test's subject is the held server's notices (`held/held.ts`, `held/requests/notices.ts`, `held/watch.ts`, G72's Code line), and `adapters/` holds the adapter tests (`cpp-file`, `hub-keys`, `markdown-requests`). The other two placements are judged fit: `held/requests/notices.ts` sits beside `followed.ts`, which also tells a server of path changes, and `introduceMarkdown` in `adapters/markdown/requests.ts` (ten files there) has its head comment made true. Failure scenario: a later step changing `held/` looks for G72's test beside the held server's tests and does not find it under `adapters/`. Either placement needs G72's Test line written with the path that lands, which the Doc text gives. Verdict: none.

### 4. Behaviour

- 1. `src/lib/server/machine/lsp/held/watch.ts:100-103` with `adapters/markdown/requests.ts:96-110` and `held/requests/notices.ts:75-86`: the root watch matches each event's own path against `**/*.md` ("if (![...this.#globs.values()].some((match) => match(relative))) return;"), and `introduceMarkdown` words a read only for a Created change "whose ending is a Markdown extension". What is wrong: a folder renamed on disk produces events for the folder's own name only (the files inside raise none), so the server is told nothing of the files under the folder's new name, nor that the old ones are gone. My probe: `notes/` renamed to `letters/` on disk after the first references gives "references on ## Intro: ["hub/notes/README.md:0"] NOT LISTED" after 6 s (twice): the moved file is missing and a path that no longer exists is listed. The same move made as the Files view makes it (rename, then the page's `links` ask) gives `links_answer edit: null` and then "references on ## Intro: [] NOT LISTED" (twice): `goneFiles` tells the old path deleted, and the first `caughtUp` of that server "only takes the times" (`writtenSince` with `known === null`, `watch.ts:150-172`), so `letters/README.md` is not told as created. A single file renamed in place gives "LISTED". G72's sentence (ruling 29) and item 11's heading say a Markdown file "moved or renamed on disk" is in the workspace answers; ruling 21 makes a folder move part of this step. Case 36 runs only a file move. The report does not state this. Failure scenario: Axel moves `docs/` to `guide/` in the Files view, applies or skips the link preview, then Shift+F12 on a heading in `tools/oculus/HELP.md`: the links in the files under `guide/` are missing and stale `docs/...` places are listed, until a tab opens each file or the server restarts. This is the look's case 34 symptom by another route. Fix: tell the server, for a folder Created or Deleted, the Markdown files under it (read from disk, the same exclusions as `markdownFiles`), and introduce the created ones; a G72 row for a folder moved after the first references. Verdict: item 11 violated.
- 2. `src/lib/server/machine/lsp/held/requests/notices.ts:117-129`: "Returns when none of its requests is open and none has been made for SETTLE_MS, or after SETTLE_MAX_MS." What is wrong (by reading, not reproduced): the wait that makes the case 23 fix hold is a quiet interval (50 ms with no request of the server to the relay, capped at 2 s), not a signal that the server has read the files it was just told changed. The server's handler of `workspace/didChangeWatchedFiles` asks `markdown/fs/readFile` asynchronously; if that ask starts more than 50 ms after the notice (a busy machine), `caughtUp` returns and `markdown/getEditForFileRenames` is answered from the old text, the case 23 defect again; with a large root the 2 s cap ends the wait before the reads do. The report states the 50 ms and 2 s bounds but not this failure. My four CASE=23 reruns (GAP 0, 0, 10, 100) and the report's were all correct on this machine. A signal is at hand: the relay told the server the exact Changed and Created files, and its own `readFile` handler sees each read, so the wait can end when each told file has been read, bounded as now. Failure scenario: under load, a folder moved, its link preview applied, and the folder moved again at once: the second preview lists only the backticked edit, and Apply leaves `README.md` linking into the folder's first new place. Verdict: none (case 23 met here).

### Declined to judge

- The servers.test.ts failure the report saw at `servers.test.ts:228`: not reproduced in six runs of the file alone and three runs of `tests/server/machine/lsp` (all passed). Line 228 is the `await steps()` of `it.each(ROWS)`, so the line names no row. By reading, the start row waits a fixed 30 `settle()` turns for five spawns (`servers.test.ts:73`, and the file's own slow tag says so), and the coordinator's fact that D48's builder, whose worktree changes nothing under `src/lib/server/machine/lsp`, saw the same file fail once on a list ending in `clangd` against `/node` entries and pass alone, points to that turn-count wait under load rather than D41's change. Its cause is not known: a run that catches the failure with its output kept would settle it.
- Whether the look's unexplained part of case 34 (README open, and after Restart Language Server) is closed: it never reproduced at relay level; the page look on landing settles it, and Behaviour 1 is one route to the same symptom.
- The report's 49-file run of the guarded entries' tests (337 passed, 1 skipped): not rerun in that form, since its file list is not on disk; the subset above passed.
- Cases 5, 6, 21, 29 (note and bar), 33 and 34's page parts: page cases for the look on landing.
- The `vscode-markdown-languageserver` version risk the diagnosis names (the fix rests on a fragment resolve reading the file in 0.5.0): a fact of the dependency, not checkable beyond the runs above.

Reviewer usage: agent id not known to me, claude-opus-5-5, tokens not known, about 55 tool uses, minutes not known.

## Repair round 1, refuted

Sections of the rules file and the brief are cited by name. Code findings keep `file:line`, and those line numbers are the worktree's as it stands. I changed nothing in the worktree, the ledger or the round-0 copy. My probes are in the session scratchpad under `rv41r1/` and use the builder's harness `probe/lib.ts`. Every run set HOME under `$TMPDIR/rv41r1home`.

### Verification (rerun by the reviewer)

```
$ npm run test:quick -- --base d13535993      (worktree tools/oculus; load average 18.10 at start, 18.00 at end)
        tests/checks/source/keys.test.ts: changed, run by npm run test:checks
        tests/server/machine/lsp/adapters/markdown-created.test.ts: changed, run by npm run test:slow
ok      ASCII gate (8.5 s)
ok      prettier (8.5 s): All matched files use Prettier code style!
ok      svelte-kit sync (50.5 s)
ok      eslint (66.1 s)
ok      svelte-check (101.3 s): 1791571640662 COMPLETED 444 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (158.0 s): Duration  114.52s (transform 140.39s, setup 0ms, import 211.32s, tests 212.97s, environment 10.02s)
test:quick: 168.5 s (limit 45.0 s); every command passed
test:quick: over the time limit

$ npx vitest run tests/server/machine/lsp/adapters/markdown-requests.test.ts tests/server/machine/lsp/uris.test.ts tests/server/machine/lsp/lifetime.test.ts
 Test Files  3 passed (3)
      Tests  89 passed (89)

$ wc -l relay.ts servers.ts ops.svelte.ts Editor.svelte
     880 src/lib/server/machine/lsp/relay.ts
     878 src/lib/server/machine/lsp/servers.ts
     696 src/lib/state/sources/explorer/ops.svelte.ts
     518 src/lib/ui/controls/editor/Editor.svelte
(round-0 copy: servers.ts 879)

$ sh utils/folder-check.sh; echo folder=$?
folder=0
$ sh utils/unused-exports.sh > $TMPDIR/rv41r1-unused.txt; diff it .agents/worktrees/D41-base/tools/oculus/unused-exports.txt; echo diff=$?
diff=0      (364 lines each)

$ npx vitest run tests/server/machine/lsp/adapters/markdown-created.test.ts --testTimeout 20000 --reporter=verbose    (three runs)
 ✓ ... 'a file created after the first refere…' 560ms / 363ms / 373ms
 ✓ ... 'a file moved after the first referenc…' 379ms / 313ms / 353ms
 ✓ ... 'a folder moved after the first refere…' 333ms / 347ms / 398ms
 Test Files  1 passed (1)   Tests  3 passed (3)   (each run)
$ grep -n "setTimeout\|Date.now\|WAIT_MS\|sleep\|second move" tests/server/machine/lsp/adapters/markdown-created.test.ts; echo exit=$?
exit=1

$ spec.md perl ASCII gate over $(find src tests config -type f ! -name local.yml); echo ascii=$?
ascii=0, no output
$ LC_ALL=C grep -n '[^ -~]' DESIGN.md docs/files-and-search.md ../../docs/DATA-MAP.md; echo $?
1, no output
$ awk 'length>100' over the round's eleven changed files: no output
$ history words over the comment lines of the round's files: only ordering uses ("before it reaches the server", "no longer served"), none added by the round

$ npx vitest run tests/server/machine/lsp/servers.test.ts     (three runs)
      Tests  6 passed (6)   (each)
$ npx vitest run tests/server/machine/lsp --testTimeout 20000
 Test Files  12 passed (12)
      Tests  175 passed (175)
$ npx vitest run tests/checks/tree tests/checks/source/keys.test.ts tests/checks/diagrams tests/checks/config --testTimeout 300000
 Test Files  9 passed (9)
      Tests  168 passed | 1 skipped (169)     (the report says "169 passed (169)"; the skip is config-folder.test.ts 'reads the roots of sources.yml without a finding'; no decision rests on it)
$ npx vitest run tests/state/sessions/source.test.ts tests/state/system/link-rewrite.test.ts tests/state/system/refactor-preview.test.ts tests/ui/controls/editor/lsp-transport.test.ts tests/checks/source/history.test.ts tests/checks/source/comment-width.test.ts tests/checks/imports
 Test Files  9 passed (9)
      Tests  77 passed (77)
$ $TMPDIR/d41/unchanged2.out (the builder's unchanged-tree run): "Test Files  8 failed (8)", "Tests  9 failed | 88 passed (97)", the nine failing tests as the report lists them

$ git status --short (worktree, excerpt)
UU tools/oculus/docs/diagrams/layer-views.dot
?? tools/oculus/src/lib/server/machine/lsp/held/requests/notices.ts
?? tools/oculus/tests/server/machine/lsp/adapters/markdown-created.test.ts
$ git diff d13535993 --stat | tail -1
 92 files changed, 3754 insertions(+), 796 deletions(-)

Report evidence rerun (builder's probes, TREE=$PWD node --experimental-strip-types --no-warnings <script>, from the worktree's tools/oculus):
$ fold.ts MODE=disk / MODE=view (case 37, ruling 1)
before the rename: ["notes/README.md"]
MODE=disk references on ## Intro: ["letters/README.md"] letters/README.md LISTED; notes/ place none
MODE=view links_answer: {"oculus":"links_answer","id":900,"edit":null,...,"unanswered":[]}
MODE=view references on ## Intro: ["letters/README.md"] letters/README.md LISTED; notes/ place none
$ the same on the round-0 source ($TMPDIR/d41/r0, src equal to D41-round0 by diff -rq), first as the report ran it:
MODE=created ... {"code":-32800,"message":"the server is not running"}   (the copy's own node_modules no longer starts the server)
  then with OC=<worktree tools/oculus> (the worktree's packages, the round-0 source):
before the rename: ["notes/README.md"]
MODE=disk references on ## Intro: ["notes/README.md"] letters/README.md NOT LISTED; notes/ place LISTED
MODE=view references on ## Intro: [] letters/README.md NOT LISTED; notes/ place none
$ first reviewer's rv41/folder-move.ts MODE=folder (twice), folder-move2.ts MODE=filesview (twice), MODE=file
MODE=folder references on ## Intro: ["hub/letters/README.md:0"] LISTED   (both)
MODE=filesview references on ## Intro: ["hub/letters/README.md:0"] LISTED   (both)
MODE=file references on ## Intro: ["hub/notes/LETTER.md:0"] LISTED
$ cl.ts CASE=23 GAP=0 / 10 / 100
      hub/README.md: 1:8-1:21=>"manual/DATA.md" ; 1:31-1:50=>"manual/DATA.md#intro" ; 1:57-1:70=>"manual/DATA.md"   (each)
$ t23.ts
second ask took 7 ms; edits 3
$ cl.ts CASE=17 / 18 / 19 / 20 / 21: the same lines the report quotes (17: three edits, "nothing written by the ask: true"; 18: other.md and sub/README.md edits; 19: edit=null; 20: inner and hub edits; 21: 2:8-2:15 and 2:25-2:37 with the tab text held, disk text unchanged)
$ c34.ts MODE=created, OPEN_README 0/1 x RESTART 0/1: references on ## Intro: ["hub/README.md:0"] in every form, before and after the restart
$ c34.ts FULL=1: completion ["README.md","docs/","warm.md"]; definition line 4; prepareRename 4:3-4:8 "Intro"; rename edits DATA.md and README.md 0:48-0:53; documentSymbol ["# Data"]
$ c1.ts: c1.md [[0,2,"link.no-such-file","File does not exist at path: docs/missing.md"]]; c2.md []; c3.md []; c4.md []
$ c5.ts: targets ".../docs/DATA.md", ".../docs/DATA.md#L5,1", undefined; machine path in any field: false
$ c7.ts HUB=<worktree root>: case 7 [[3,2,"link.no-such-file","File does not exist at path: projects/manuscripts/CLAUDE.md"]]; case 8 definition line 60; [78,2,"oculus.no-such-path","File does not exist at path: docs/adr/"]
$ c10.ts: case 10 diagnostics: [] / definition: undefined;  c11.ts: lines 1-9 undefined, line 11 DATA.md
$ c14.ts / c14b.ts: the report's lines (big.md refused, ok.md answered, references and diagnostics for the other files)
$ ca.ts: the three conform rows (y, v, x); x typeWritten= active; CASE=28 on the worktree: 94 projects, 0 rows, 0 type_not_tier findings
$ stat.ts HUB=<worktree root>: files=469 firstCall changes=0 secondCall changes=0 secondCallMs=1.1

Reviewer's own probes (scratchpad rv41r1/):
$ fresh.ts: root warm.md, docs/DATA.md, notes/README.md ("[sec](../docs/DATA.md#intro)"), x/keep.md; workspace loaded by references on warm.md; then either
  MODE=newfile: new/README.md ("[a](../docs/DATA.md) [b](../docs/DATA.md#intro)") written, GAP ms, docs/ renamed to guide/, the Files view's links ask at once
  MODE=deep: GAP ms, notes/ renamed to x/notes/, GAP2 ms, the links ask
MODE=newfile GAP=0: edit=1 file(s) (hub/notes/README.md only; new/README.md missing)   7 of 7 runs
MODE=newfile GAP=50 / 100 / 200 / 250 / 300 / 400: edit=2 file(s) (new/README.md's two edits included)
MODE=deep GAP2=0: edit=null 3 of 22 runs, otherwise hub/x/notes/README.md: 1:6-1:27=>"../../docs/DATA.md#intro"
MODE=deep GAP2=20 / 50 / 100: edit=1 file(s), 15 of 15
round-0 source (OC trick): newfile GAP=0 edit=1 file(s) 3 of 3; deep GAP2=0 edit=null 3 of 3
$ hubmove.ts: a copy of the worktree's 469 Markdown files (no dot folders, no node_modules, no secrets); HELP.md open, its diagnostics in; tools/oculus/docs renamed to guide, the links ask
links answer in 957 ms / 1287 ms: 3 files, 127 edits      round-0 source: 1994 ms / 1312 ms, 3 files, 127 edits
$ quiet.ts: a RootWatch with '**/*.md'; a.md written, then a new file under out/ every 100 ms for 2 s
current tree:  a.md written at 302 ms ... changed at 2554 ms: a.md:1
round-0 tree:  a.md written at 301 ms ... changed at 514 ms: a.md:1
$ link.ts: markdownFiles over a root holding a link ext -> an outside folder
walk of the root: ["/root/docs/A.md"]
walk from the link (a folder event of ext): ["/root/ext/deep/SECRET-NOTES.md"]
```

Not rerun: the report's 72-path run of the guarded entries' tests (I ran the lsp folder, the checks set and the state set above), c32 and c32b, the case 29 scratch client test, and ten consecutive runs of G72's file (I ran three). The round's delta does not touch the code these cover. It touches only DESIGN.md, docs/files-and-search.md, adapters/asks.ts, markdown/places.ts, markdown/requests.ts, held/held.ts, held/requests/links.ts, held/requests/notices.ts, held/watch.ts, servers.ts and markdown-created.test.ts, per `diff -rq` against D41-round0.

### Verdicts

Items of the brief's "What to build", for the whole diff since d13535993:

- 1: holds. Verify 2 passes with 89 tests, which include the G2 and G3 rows. The c1, c5 and c34 FULL reruns give the marks, the resolve with its `#L` fragment and no machine path, completion, definition, prepareRename, rename and symbols.
- 2: holds. The c1 rerun gives one `link.no-such-file` mark worded from the root, and `relay.ts` is 880 lines.
- 3: holds by the c5 rerun. The click itself is the look at landing.
- 4: holds by the c7, c10 and c11 reruns.
- 5: holds at the gaps a page's ask can follow a move. With 20 to 100 ms between the rename and the ask, the deep folder move gave the edit in 15 of 15 runs, and cl.ts cases 17 to 23 give their edits. Behaviour 1 names a race when the ask follows the disk change by about 0 ms.
- 6: holds. The ca.ts reruns give the three rows, `typeWritten` undefined for a manifest key, and 0 rows on the worktree's hub.
- 7: holds. `tests/state/sessions/source.test.ts` passes. The note and the bar are the look.
- 8: holds by the first review's reading of `portfolio.ts`. The round does not touch it.
- 9: holds. `kit/theme/rename.css` is imported by `Editor.svelte` (518 lines). The line itself is the look.
- 10: holds. The report's "Doc text" gives G2, G3 (word for word as ruling 24) and G36, and G72 with the `adapters/` test path that was closed at landing.
- 11: holds. `introduce` on Created Markdown changes, the ordered chain with a 10 s bound, and `servers.ts` at 878 lines are all built. G72's three rows pass three times each, and every c34 form lists the link. The ruling 1 folder notices close the folder case: fold.ts gives LISTED both on disk and through the Files view. Behaviour 2 and Behaviour 3 are defects of the round's folder code, and Standards 1 is how `servers.ts` was kept at 878.

Cases of the brief's "Cases":

- 1: met (c1 rerun). The Problems view row is the look.
- 2: met (c1, `c2.md []`).
- 3: met (c1, `c3.md []`).
- 4: met (c1, `c4.md []`).
- 5: not verifiable here (a page case). The c5 rerun gives the targets the opener receives.
- 6: not verifiable here (a page case). The c5 rerun gives no target for the missing file.
- 7: met (c7 rerun).
- 8: met (c7 rerun).
- 9: met (c7 rerun, the `docs/adr/` mark).
- 10: met (c10 rerun on a scratch root, since the file is not in the worktree).
- 11: met (c11 rerun).
- 12: met (verify 2).
- 13: met (verify 2).
- 14: met (c14 and c14b reruns).
- 15: met (verify 2, the lifetime row).
- 16: met (verify 2, the lifetime row on fake time).
- 17: met at relay level (cl.ts 17 rerun, nothing written by the ask). The preview title, Apply and the History record are the look.
- 18: met (cl.ts 18 rerun).
- 19: met for a move of a file nothing links to (cl.ts 19 rerun, `edit=null`). The copy, cross-root, refused and undo parts are met by reading `ops.svelte.ts`, which the round does not touch.
- 20: met (cl.ts 20 rerun).
- 21: not verifiable here. The cl.ts 21 rerun gives the edits with the tab text held and the disk unchanged; the tab itself is the look.
- 22: met by reading and by `refactor-preview.test.ts` passing.
- 23: met. cl.ts 23 at GAP 0, 10 and 100 gives all three edits, and t23 gives "second ask took 7 ms; edits 3".
- 24: met by reading `ops.svelte.ts` (untouched by the round).
- 25: met (ca.ts rerun).
- 26: met (ca.ts rerun).
- 27: met (ca.ts rerun).
- 28: met (ca.ts CASE=28, 0 rows).
- 29: met for the store (`source.test.ts` passes). The note and the bar are the look.
- 30: met by the report's scratch test, not rerun. Its code is untouched by the round.
- 31: met (verify 2, `uris.test.ts`; c5 rerun).
- 32: met by the report's c32 runs and the first review's reading, not rerun. The round does not touch `portfolio.ts`.
- 33: not verifiable here (a page case).
- 34: met at relay level: every c34 form lists README's link, with README open or not and before and after a restart. The Outline fallback and the page's Shift+F12 are the look.
- 35: met (G72 row 1 passes three times). Its failure before item 11 is quoted in the report from the first pass and in `$TMPDIR/d41/unchanged2.out`.
- 36: met (G72 row 2 passes three times).
- 37 (added by the builder for ruling 1): met. fold.ts gives LISTED both on disk and through the Files view, and gives the report's NOT LISTED lines on the round-0 source.

### Closures of the round's rulings

1. Ruling 1, a folder moved on disk: closed. On the current tree, fold.ts (both modes) and the first reviewer's folder-move.ts and folder-move2.ts give `letters/README.md` LISTED with no `notes/` place. On the round-0 source, fold.ts reproduces the report's NOT LISTED lines. The G72 folder row is in the `it.each` table and passes. On the round-0 tree it times out, according to the report; I judged that by reading the row, since `learned()` waits for a read the round-0 code never causes.
   - The fix reaches beyond the finding in two ways. Behaviour 2: every unmatched `rename` event now restarts the 200 ms quiet of every server's root watch. Behaviour 3: a folder event's walk follows a link to a folder out of the root.
   - The first `caughtUp` tells Created for every file the server has not read, which is wider than "the files under the folder's new name". I judged that on cost: over a 469-file copy of the hub, hubmove.ts answered in 957 and 1287 ms, against 1994 and 1312 ms on the round-0 source. That is no regression, and it is not a finding.
2. Ruling 2, the wait for the server's reads: partly closed.
   - Changed files are closed. A Changed file the server has read is marked unread before the notice, and the wait ends on the server's read of it after the notice (`notices.ts:193`, `asked()` at :111). Case 23 gives all three edits at GAP 0, 10 and 100, and `SETTLE_MS` is gone (grep).
   - Created files are not closed. The read that clears a Created file is the one the introduce ask causes, which completes before `workspace/didChangeWatchedFiles` is written. The read the server makes after taking the notice is not waited for. That is the read the builder's own G72 test has to wait for (Judgment call 7). See Behaviour 1.
3. Ruling 3, the 30 s bound: closed, by reading. `links.ts:161-186` runs `caughtUp`, `touched`, `goneFiles` and the ask inside one async function that the `ASK_MS` timer races. `abandoned.now` stops a late `caughtUp` from asking, and a root that loses the race reaches `unanswered`. The head comment at `links.ts:14-17` says this. The `markdownFiles` walk before the timer is the relay's own work, not the server's, so the sentence stays true. No run passes 30 s; the report says so.
4. Ruling 4, the waits of G72's rows: closed in substance, with a disclosed departure that I accept. The recording sink only holds frames the relay sends to the page. The server's `markdown/fs/readFile` is answered inside the relay, so the signal the ruling names does not exist in the sink. `tapped()` reads the server's stdout and the relay's writes to its stdin with `StreamMessageReader`. Each row waits, in order, for the server's read of the file, the notice naming it, the server's next read and the relay's answer, then asks references once. The grep for clock waits exits 1. The test's own 30 s timeout is the only bound, which fits the rules file's signal rule. The waits depend on server 0.5.0 re-reading after the notice; Judgment call 7 states this.
5. Ruling 5, the third test: closed. The grep for "second move" exits 1, and the file holds one `it.each` of three rows. Case 23 is checked by the cl.ts runs above.
6. Ruling 6, the report: closed.
   - The first line states the departures. The visible changes list the folder move and the 30 s bound with before and after.
   - "Anything wrong or impossible" says the worktree's brief predates the ledger's.
   - No git command is named as run. The only git text is test:quick's own "from git since HEAD".
   - Two figures differ from my reruns, and no decision rests on either. The checks set gives "168 passed | 1 skipped" against the report's "169 passed". The `$TMPDIR/d41/r0` copy no longer starts the server; its round-0 lines reproduce with the worktree's packages.
7. Standards 3 (closed at landing, not sent): G72's Test line in the Doc text uses `tests/server/machine/lsp/adapters/markdown-created.test.ts`.
8. Judgment call 8, a file created in a quiet stays Created when a change follows: I accept it. It applies to every server's root watch. For a file that did not exist before the quiet, Created is the protocol's true kind. Without it, a new Markdown file written in two steps would reach `introduce` as Changed, and the server would drop it. Created then Deleted still ends Deleted (`watch.ts:127-129`).

### Findings

#### Spec

None.

#### Proof

None. The report's statements about how the wait ends (Judgment call 4, "Host- or user-visible changes") are taken up under Behaviour 1.

#### Standards

1. `src/lib/server/machine/lsp/servers.ts`: comments were cut to stay under 880 lines.
   - **What changed:** the file went from 879 lines (round 0) to 878 while the round added three lines (the `markdownFiles` import and the two lines of `filesUnder`). The round removed these lines from the head comment:
     > "// backticked path. The Markdown server takes the notice of a created file only for a file it holds, // so the entry's `introduce` words the request that makes it read the file first // (adapters/markdown/requests.ts). clangd is ..."
   - It also shortened the `introduce` doc (`servers.ts:220`) from "The requests the server is asked ahead of the notice of changes on disk, one for each change it would otherwise drop; it is told after the last answer, or after a bound on the wait." to "The requests asked of the server ahead of a notice of changes, one per change it drops."
   - **What is wrong:** the rules file's "What every package obeys" says a file that would pass 880 is split by concern, and "comments are not shortened and code is not compacted to stay under it". Without the cut, the file is 882. The cut also leaves `servers.ts:24`, "// backticked path. clangd is the `clangd` on the oculus process's PATH, with", at 77 columns inside a sentence. The rewrap rule says a comment the step edits is rewrapped as a whole paragraph.
   - **Failure scenario:** a reader of `ServerEntry.introduce` no longer learns that the notice is sent only after the asks are answered or given up on. A reader of the head comment of the file that "holds how each server is started" no longer learns why the Markdown entry has an `introduce`. The next step that adds a line to `servers.ts` meets the same wall.
   - **Fix:** restore both texts and move a concern out of `servers.ts`, for example the Markdown entry's construction into `adapters/markdown/`.
2. `src/lib/server/machine/lsp/held/requests/notices.ts:45`: `export type Asked` has no importer outside the file (grep over src and tests; the `Asked` names in `hub-keys.ts` and `run.svelte.ts` are their own local types). `NoticeHost` at :29 is in the same position, carried from round 0.
   - **What is wrong:** the rules file's principles say every export the step adds that has no importer outside its own file and its tests is removed or made local. knip did not list either one.
   - **Failure scenario:** a reader takes `Asked` for part of the module's interface to other modules. A later change that renames it searches for importers that do not exist.

#### Behaviour

1. `src/lib/server/machine/lsp/held/requests/notices.ts:186-215` (`#send`): a Created file counts as read before the server has taken its notice.
   - **The code:**
     ```
     for (const change of changes) { ... else if (change.type === CHANGED ? this.#seen.has(real) : asks.length > 0) { this.#unread.set(real, at); } }
     if (asks.length > 0) { ... await Promise.race([Promise.all(asks.map((one) => this.#host.call(one.method, one.params))), bound]); ... }
     this.#host.notify({ ... method: 'workspace/didChangeWatchedFiles', params: { changes } });
     ```
   - **What is wrong:** a Created file is marked unread before the introduce asks. The read those asks cause clears it before the notice is written. `caughtUp` then returns right after the notice, and `markdown/getEditForFileRenames` is asked while the server is still taking the notice. Judgment call 7 records that the server re-reads the file when it takes the notice and answers from its old table until it has the bytes, and G72's `learned()` waits for exactly that second read. Ruling 2 asks for "each Changed and Created file it was just told of" to be read. The head comment of `notices.ts` (lines 7-9) and `DESIGN.md:575` say a link rewrite waits until the server "has read every Markdown file written since the last one, including a write the platform's watch has not reported yet".
   - **What my probe shows** (fresh.ts above):
     - A Markdown file written right before the move, with the ask at once (GAP 0): its two links into the moved folder are missing from the edit in 7 of 7 runs. At 50 ms and later they are included.
     - A folder moved into another folder (`notes/` to `x/notes/`), with the ask at once: the edit is null in 3 of 22 runs, so the relative link inside the moved file is not rewritten and no preview opens. With 20 to 100 ms between the rename and the ask, it was right in 15 of 15.
     - The round-0 source misses both in 3 of 3, for a different reason: its first call only took the times.
   - **Exposure:** the window is the one the comment claims to cover, a write the platform's watch has not reported yet. A page's ask after the Files view's own move probably comes later than that (not measured). A script or agent that writes Markdown files and moves a folder through oculus within a few ms meets it.
   - **Failure scenario:** an agent writes `new/README.md` linking `../docs/DATA.md` and `docs/` is moved straight after. The preview lists the other files but not `new/README.md`, and Apply leaves its two links pointing at `docs/`. Or a folder is moved into another folder with the ask at once, no preview appears, and the moved file's `../` links break silently.
   - **Fix:** for a Created change with asks, mark it unread after the asks have resolved, just before the notice is written, so `#read` waits for the read the server makes after taking the notice, as the G72 rows do. Quote fresh.ts at GAP 0 for both modes before and after the fix.
   - **Bears on:** ruling 2 (partly closed) and item 5 (holds at the measured page gaps).
2. `src/lib/server/machine/lsp/held/watch.ts:115-123`: every unrelated file creation now restarts the quiet of every server's root watch.
   - **The code:**
     ```
     if (![...this.#globs.values()].some((match) => match(relative))) { const hidden = ...; if (event === 'rename' && this.#options.folders !== undefined && !hidden) { if (isFolder(real)) this.#folders.set(real, true); else if (!existsSync(real)) this.#folders.set(real, false); this.#later(); } return; }
     ```
   - **What is wrong:** `#later()` runs for every unmatched `rename` event outside dot folders and `node_modules`, including a regular file of another kind being created, which records nothing. `held.ts:529` passes `folders` to the root watch of every server, so this applies to pyright, clangd, the YAML server and the rest. Each such event also costs a `statSync` and an `existsSync` on the event loop. In round 0, unmatched events never touched the timer. The head comment's "debounced 200 ms" is no longer what a reader gets.
   - **Probe** (quiet.ts above): `a.md` written at 302 ms while a new file is created under `out/` every 100 ms for 2 s. The current tree hands `a.md` over at 2554 ms; round 0 at 514 ms.
   - **Failure scenario:** a Python tab is open on a root where a build or an experiment creates files under a non-dot folder faster than every 200 ms, such as a LaTeX build or `make` writing objects. A `.py` or `.md` file changed on disk by another program is not told to its server until the churn stops. Diagnostics, references and hover answer from the old text for the whole build, and a long build delays it for minutes. A link rewrite is unaffected only because it calls `flush`.
   - **Fix:** call `#later()` only when a folder entry was recorded, or give folder events a timer of their own. Rerun quiet.ts to show `a.md` handed over within the quiet.
3. `src/lib/server/machine/lsp/held/watch.ts:120` with `adapters/markdown/places.ts:66-99` and `held/requests/notices.ts:157-171`: a folder event's walk follows a link to a folder out of the root.
   - **The code:** `if (isFolder(real)) this.#folders.set(real, true);` (`statSync` follows a link), and `markdownFiles(reach, extensions, from)` starts with `const folders = [from];`.
   - **What is wrong:** the root walk leaves out a link to a folder, as `markdownFiles`' doc comment says. A walk started at `from` enters `from` even when it is such a link. Ruling 1 asks for the files under the folder "read from disk with the exclusions `markdownFiles` uses".
   - **Probe** (link.ts above): the root walk gives `["/root/docs/A.md"]`, while a walk from the link `ext` gives `["/root/ext/deep/SECRET-NOTES.md"]`, a file outside the root.
   - **Failure scenario:** while the Markdown server runs and has read files, someone runs `ln -s ~/data/eeg projects/x/data` in a served root. The relay walks the whole outside tree one `readdir` at a time inside the ordered notice chain, so every later notice and link rewrite of that root waits behind it, and the rewrite is named `unanswered` after 30 s. The relay then tells the server Created for every `.md` under the link, with one `markdown/resolveLinkTarget` ask each. The reads are refused (`reachable` resolves the real path, so G2 holds at `readFile`), but the server is given the names of files outside the root.
   - **Fix:** skip a `from` that is a symbolic link (`lstat`) or whose real path lies outside the root, in `#event` or in `markdownFiles`.

### Declined to judge

- The `servers.test.ts:228` failure the report saw once. It passed in my three runs of the file and one run of `tests/server/machine/lsp`, and in the first review's nine runs. The file exercises `servers.ts`, which the step changes, so a reproduced failure would count. A run that catches it with its output kept would settle it.
- test:quick at 168.5 s against its 45 s limit. Every command passed. The selection is 119 test files, because 93 files changed since the base, and the load average was 18. That a list of this size can meet 45 s on an idle machine is not verified here.
- Whether the page's real ask after a Files view move falls inside Behaviour 1's window. That needs the page, and is settled at the look on landing by moving a folder holding a `../` link into another folder.
- Cases 5, 6, 21 (the tab), 29 (the note and the bar), 33 and 34's page parts. These are page cases for the look on landing.
- Whether server 0.5.0 always re-reads a Created file after its notice. Judgment call 7 and G72's rows rest on it, and it is a fact of the dependency beyond the runs above.

Reviewer usage: ac925e245cbc13ce9, claude-opus-5-5, 314,411 tokens, 73 tool uses, 28.3 min.

## Closed (at landing, over round 1)

Each finding of the run over round 1 is small and inside the brief and was fixed on main at landing by the orchestrator (`refute` "Over a repair round" 7). The probes are the reviewer's, in the session scratchpad `rv41r1/`, run with `TREE` at the gate's `tools/oculus`.

- Standards 1 (`servers.ts` comments cut to stay under 880): both texts restored word for word from the round-0 copy (the head comment's sentence on `introduce`, and the `introduce` doc); `YAML_SETTINGS` moved to `adapters/yaml/settings.ts`, beside the Markdown entry's `adapters/markdown/settings.ts`; `servers.ts` is 871 lines; `sh utils/folder-check.sh` exits 0.
- Standards 2 (`Asked` and `NoticeHost` exported with no importer): both made local to `notices.ts`.
- Behaviour 1 (a Created file counted as read before the server takes its notice): `Notices.#send` marks a Changed file it has read as unread before the asks and a Created file after the asks resolve, just before the notice, so `caughtUp` waits for the read the server makes on taking the notice. `fresh.ts` at GAP 0: MODE=newfile gives `edit=2 file(s)` 5 of 5 (1 file in 7 of 7 before); MODE=deep gives `edit=1 file(s)` 10 of 10 (null in 3 of 22 before).
- Behaviour 2 (every unmatched creation restarts the quiet of every root watch): folder events have a timer of their own (`#laterFolders`, `#flushFolders`), and a path that is there and is no folder records nothing; `flush` hands both over. `quiet.ts`: `a.md` handed over at 517 ms with files created under `out/` every 100 ms until 2349 ms (2554 ms before).
- Behaviour 3 (a folder event's walk follows a link out of the root): `isFolder` reads `lstatSync`, so a link to a folder raises no folder event. `linkwatch.ts` (a link `ext` to an outside folder and a real folder `real` made in the root): `folder events: ["real=true"]`.
