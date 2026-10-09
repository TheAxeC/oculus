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
