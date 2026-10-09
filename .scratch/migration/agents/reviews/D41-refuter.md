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
