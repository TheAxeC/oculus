# Step D23b refuter report (on .agents/worktrees/D23b, base 8d9cdd60)

Summary: items 1 and 4 are violated and item 2 is violated in part. Cases 4 and 13b are partial. Every check I reran passes. The findings that change what the orchestrator does next:
- (a) The page's edit function checks other pages only for files that no tab of this page holds, and it merges a file named twice instead of refusing it.
- (b) An edit to a tab whose unsaved text the server does not hold is applied at disk positions to the unsaved text. This is a likely cause of the "partial tab edit" the report could not explain.
- (c) Typing during a cross-file edit is overwritten.
- (d) `held/oculus.ts` holds a third server table.
- (e) The Svelte server's semantic tokens are switched off although the server offers them.
- (f) The TypeScript plugin loads only under the Svelte approval, a departure from Z686 (8) that the orchestrator or Axel must rule on.

## Verification (rerun by the reviewer)

```
npm run diagrams
  -> regenerated docs/diagrams/* ; `git status --short | md5` before and after: 67e0b2a12d15778bf2081231f8aeb8b6 both (no change against the builder's tree)

npm run test:quick -- --base 8d9cdd60
  test:quick: 121 changed file(s), from git since 8d9cdd60
  ok      prettier (0.3 s): All matched files use Prettier code style!
  ok      ASCII gate (0.3 s)
  ok      svelte-kit sync (1.8 s)
  ok      eslint (1.7 s)
  ok      svelte-check (5.1 s): ... COMPLETED 406 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
  ok      vitest (17.4 s)
  test:quick: 17.8 s (limit 45.0 s); every command passed
  test:quick: not covered: tests outside the selection, tests/checks, slow tests,
  (An earlier run in this task, before the cache warmed: eslint 26.3 s, vitest 35.3 s, total 40.2 s, every command passed. The ASCII gate passing confirms the fix the builder made after its single run.)

npx vitest run tests/server/machine/lsp tests/server/files/ops.test.ts tests/routes/replace tests/state/system/lsp tests/views/sources/hierarchy.test.ts tests/ui/controls/editor/own-listing.test.ts tests/shell/keys
  Test Files  19 passed (19)
  Tests  174 passed (174)        (matches the report)

npx vitest run tests/server/machine/lsp/svelte-trust.test.ts tests/routes/replace/replace-undo.test.ts tests/routes/replace/lsp-edit.test.ts tests/server/machine/lsp/uris.test.ts tests/state/system/lsp/edits.test.ts
  Test Files  5 passed (5)
  Tests  51 passed (51)
  then `ps -axo command | grep -E "tsserver.js|typescript-language-server|svelte-language-server" | grep -v grep | wc -l` -> 0

sh utils/folder-check.sh; echo $?          -> no output, 0
sh utils/unused-exports.sh > $TMPDIR/d23b-ue.txt; diff <D23b-base>/tools/oculus/unused-exports.txt $TMPDIR/d23b-ue.txt  -> no output, exit 0

item 4 grep (brief's pattern, --include='*.ts' --include='*.svelte', entries modules excluded):
  kit/folding.ts:97, kit/lsp/hosts.ts:19,22,148, views/sources/source/language/lsp.ts:36,120   (matches the report; the pattern cannot see ADAPTERS in held/oculus.ts)

wc -l of the changed .ts/.svelte: largest .ts kit/lsp/transport.ts 861, relay.ts 839, ops.ts 849; largest .svelte Palette.svelte 520, Editor.svelte 506 (all within 880 / 520)

npx tsc --noEmit -p .
  src/lib/views/boards/collection/task-card.ts(10,15): error TS2614: Module '"*.svelte"' has no exported member 'CardAction'...
  src/lib/views/shared/card/card.ts(10,15): error TS2614: ...
  `git diff 8d9cdd60 --stat` over views/shared/card, views/boards: no file. The ambient `declare module '*.svelte'` that tsc resolves is node_modules/svelte/types/index.d.ts.

Killed-server probe (my own scratch repo under the scratchpad, typescript-language-server started with the options servers.ts:407-408 sets, ended three ways):
  before: two tsserver.js children, args include ".../D23b/tools/oculus/node_modules/typescript/lib/tsserver.js ... --disableAutomaticTypingAcquisition ... --useNodeIpc"
  after exit:    (none)
  after SIGTERM: (none)
  after SIGKILL: (none)
  no typingsInstaller at any point; `find` of the scratch repo afterwards: only a.ts (no .log folder)
```

## Verdicts

Items of the brief's "What to build":

- 1: violated (Spec 1). `held/oculus.ts:22` `ADAPTERS: Record<ServerId, Adapter>` names all four servers in a third place. `servers.ts:6-8` tells the reader that an adapter is a third piece, while the brief puts the adapter inside the `servers.ts` entry. The rest holds: the facts module `data/prose/lsp-servers.ts`, the grep above, the `COMPUTED_PREFIXES` widening named in the report, and `approve` / `ChoicesBody` reading the entries.
- 2: violated in part (Spec 3, Spec 4, Behaviour 5). What holds:
  - the pins (package.json diff);
  - oculus's own tsserver with type acquisition and the log off (servers.ts:407-408, and my probe's process arguments);
  - children ending with a killed server (my probe: no tsserver left after SIGKILL, because tsserver runs over `--useNodeIpc`);
  - the untrusted Svelte start (servers.ts:473, and G55 read below);
  - the restart on approve and revoke.

  What does not hold:
  - the Svelte server's semantic tokens are switched off against Z686 (9);
  - the TypeScript plugin is conditional against Z686 (8);
  - the trusted tooltip is false for a repository with no svelte package.
- 3: holds. lsp-edit.ts refuses `inLibraryFolder` before any read, then `readChecked` (outside, missing, protected, denied, binary, too_large), then the hash. Every file is planned before any write. Each write keeps a history copy, writes atomically and is read back against the computed bytes. `noted` makes one record. The undo row passes. A file named twice and overlapping ranges both give `not-an-action`.
- 4: violated (Spec 2, Spec 5, Behaviour 1, Behaviour 2). The single page function, `lsp-edit` posted first and the transactional declaration all hold.
- 5: holds. The `uris.ts` row passes. The relay's `editAddress` reads `documentChanges`.
- 6: holds, by the report's case 1 and 13b runs and by reading `transport.ts` (rename answer `{documentChanges: []}` or `null`). See Behaviour 3 for how an in-tab edit is now drawn.
- 7: holds for `#`, by the report's case 14 run and my reading of `relay.ts` `#heldFor` routing by `params.root`. Cmd+T is only shown by `app-keys.test.ts`.
- 8: holds under Z691 (hidden, as VS Code does). The follow-up requests are routed by `params.item.uri` (wire.ts `addressOf`).

Cases:

- 1: met, per the report's quoted run (not rerun by me).
- 2: met as written (the file open only in another page), per the report's run. A file open both here and in another page is not refused (Spec 2).
- 3: met. lsp-edit.test.ts G8 row passes, plus the report's probe answer `changed`.
- 4: partial. No library file reached the live refusal. The refusal is shown by `tests/state/system/lsp/edits.test.ts`, a page-function test. The relay's test that the brief offered as the alternative was not used. The report says so.
- 5: met, per the report's clangd run.
- 6: met. The `uris.test.ts` row passes. That it fails on the unchanged tree rests on the report (not rerun).
- 7, 8: met. lsp-edit.test.ts passes.
- 9: met. The replace-undo.test.ts lsp-edit row passes.
- 10: met. The report's run, and my probe for the tsserver path, no typingsInstaller and no .log.
- 11: met per the report's run. The tooltip that run shows is false for this fixture (Behaviour 5).
- 12: met. The lifetime.test.ts and servers.test.ts rows pass.
- 13a: met. svelte-trust.test.ts passes, and by reading it discriminates: svelte-language-server's TS service runs `await configLoader.loadConfigs(workspacePath)` (`plugins/typescript/service.js:189`) before it answers documentSymbol. With the guard taken out, the marker would exist before the answer, and the untrusted row would fail.
- 13b: partial. Before the Svelte approval a `.ts` rename does not reach the `.svelte` file (report: "untrusted: util.ts rename `hi` reaches only its own tab"). See Spec 4.
- 13c: met, per the report's run.
- 14: met for `#` with Python, C++ and TypeScript, per the report's run. Cmd+T: not verifiable without the app.
- 15: met, per the report's run.
- 16: met under Z691, per the report's run.
- 17: met under Z687, per the report's before/after.
- Implied inputs:
  - file named twice: unmet on the page side (Spec 5);
  - file in two tabs: met by `edits.test.ts` 'edits every tab that shows the file';
  - overlap: met;
  - CRLF/BOM/UTF-16: met (lsp-edit.test.ts);
  - answer after the tab closed: met by reading (`transport.ts:515` throws `Closed`);
  - revoke restarts untrusted: met per case 11's run;
  - killed server: met by my probe (Proof 2).

## 1. Spec

1. `src/lib/server/machine/lsp/held/oculus.ts:22`: `export const ADAPTERS: Record<ServerId, Adapter> = { pyright: pyrightAdapter, clangd: clangdAdapter, typescript: typescriptAdapter, svelte: svelteAdapter };`. What is wrong: a server is named in a third table. Brief item 1 says "A server is declared by one entry of `servers.ts` (its spawn, its adapter) and one entry of a shared module ... and nothing else names a server". The head comment `servers.ts:6-8` ("A new server is one entry in each of the two places and its adapter (what it needs of a root, in a folder of its own beside this one), and nothing else names a server") states two places and then a third. The adapter belongs in the `servers.ts` entry (`adapter: typescriptAdapter`), with `handleOculus` reading `entry.adapter`. Failure scenario: a reader adding a fifth server follows the head comment's "two places", and tsc stops them at `held/oculus.ts` with a `Record` error the comment did not lead them to. Verdict: item 1 violated.

2. `src/lib/state/system/machine/lsp/edits.ts:154` and `:166-169`: `const onDisk = named.filter((one) => inTabs(one).length === 0);` ... `const held = await parts.askHeld(onDisk.map((one) => one.place));`. What is wrong: only files that no tab of this page holds are checked against other pages. Brief item 4: "The whole edit is refused, nothing applied, with a sentence naming the file, when any file it names is open in a tab of another page". The test title `edits.test.ts:148` 'refuses the whole edit when another page holds a file no tab of this page holds' encodes the narrower rule. Failure scenario: `calc.py` is open in a tab of page A and of page B, and F2 in page A renames `total`. Page A's tab gets the edit unsaved. Page B's tab keeps the old text. Whichever page saves second either overwrites the rename or overwrites the other page's edit. Verdict: item 4 violated.

3. `src/lib/data/prose/lsp-servers.ts:141`: `semanticTokens: false,` (the `svelte` entry). What is wrong: `node_modules/svelte-language-server/dist/src/server.js` declares `semanticTokensProvider: { legend: ..., range: true, full: true }`, and `client.ts:342` asks for tokens only when the fact is true. Z686 (9) and brief item 2 require each server to serve "every feature it offers that oculus's client draws (..., semantic tokens, ...)". The report does not mention the choice. Failure scenario: a `.svelte` tab never gets the server's semantic colours, while a `.ts` tab does. Verdict: item 2 violated in part.

4. `src/lib/server/machine/lsp/servers.ts:409-410`: `plugins: setup.configApproved === true ? [{ name: 'typescript-svelte-plugin', location: options.oculus, languages: ['svelte'] }] : ...`. What is wrong: Z686 (8) and brief item 2 give the plugin "as a global plugin from oculus's own `node_modules` so a rename in a `.ts` file reaches the `.svelte` files". The step loads it only under the Svelte config approval. By reading `typescript-svelte-plugin` there is a reason: it calls `require.resolve('svelte/compiler', {paths:[configFilePath]})`, which loads the repository's Svelte, and that falls under G55 and the processes rule. The report lists this among its judgment calls, not as a departure from a ruling. Two rulings meet here: Z686 (8), plugin always on, and G55 with DESIGN's processes rule, no repository code without approval. Who resolves that, the orchestrator or Axel, follows the plan's self-rule setting. Options:
   - (a) keep it conditional, and record the departure from Z686 (8) as ruled;
   - (b) give the plugin unconditionally and accept that the TypeScript server loads the repository's `svelte/compiler`. This breaks G55.
   - (c) give the plugin unconditionally with a resolution that cannot reach the repository. This is not available in 0.3.52 without a patch to a vendored package.

   Failure scenario: case 13b in an unapproved repository. A `.ts` rename leaves the `.svelte` file's use under the old name, which then appears as a diagnostic. Verdict: case 13b partial.

5. `src/lib/state/system/machine/lsp/edits.ts:101-104`: `const held = files.get(key) ?? { place, name: key, edits: [] }; held.edits.push(...); files.set(key, held);`. What is wrong: a file named twice (a `changes` key plus a `documentChanges` entry, or two entries) is merged into one list. The brief's implied input requires it to be refused whole. The server refuses a file named twice, but the page merges before the post, so the server never sees it. Failure scenario: a server sends `changes[a.ts]` and `documentChanges[{a.ts}]` holding the same rename. If the ranges are equal, the merged list is refused as an overlap with `lsp_edit_changed` ("changed since"), a wrong reason. If the second entry was meant to replace the first and does not overlap, both edits are applied. Verdict: item 4 violated (implied input unmet).

## 2. Proof

1. Report, first section: "One partial tab edit was seen once in an exploratory TypeScript rename and did not recur ... Its cause is not found." What is wrong: a defect seen in delivered behaviour is left open, and the brief's standard is that a defect is fixed or escalated. Behaviour 1 and 2 below each give a mechanism that produces a partial or misplaced tab edit. Failure scenario: a reader of the report takes "did not recur" as closure. Verdict: item 4 violated (the defect is in the item 4 function).

2. Report, case 12 and DONE table. The brief asks for `ps` to be quoted after case 12's run for the input "a killed `typescript-language-server`: no tsserver child left running", and the report quotes none. My probe settles it: after SIGKILL of typescript-language-server, `ps` lists no tsserver.js, because both children run with `--useNodeIpc` and exit when their IPC channel closes. No verdict changes. The missing quote is a proof gap only.

3. Report, DONE row "Item 5, tests on the unchanged tree": "the files that import modules the step adds (`svelte-trust`, `edits`, `hierarchy`, `workspace-symbols`, `views/sources/hierarchy`) fail at import with 0 tests". What is wrong: case 13a requires G55's row to be "run on the unchanged tree first". An import failure shows no assertion failing, so that run proves nothing about the row. I judged the row by reading (Verdicts, 13a): it discriminates. No verdict changes. The report should say that the unchanged-tree run of G55 did not reach its assertion.

## 3. Standards

1. New test files with no guarded entry:
   - `tests/server/machine/lsp/workspace-channel.test.ts`;
   - `tests/shell/keys/app-keys.test.ts`;
   - `tests/ui/controls/editor/own-listing.test.ts`;
   - `tests/state/system/lsp/edits.test.ts`, except the rows the report files under G2;
   - `tests/state/system/lsp/hierarchy.test.ts`;
   - `tests/state/system/lsp/workspace-symbols.test.ts`;
   - `tests/views/sources/hierarchy.test.ts`.

   (`git status --short` lists them as new; `grep` of `agents/guarded.md` names none of these files.) What is wrong: the brief says "A case of a code step becomes a test of the step only when the rules file's test rule calls for one: cases 6, 7, 8, 9, 12 and 13a ... Every other case is checked by a run the report quotes ... and no test is kept for it". The spec says a builder writes no other test, and a new guarded entry needs Axel's yes. Failure scenario: the suite carries tests nobody approved, and one of them (edits.test.ts:148) fixes the narrower other-page rule of Spec 2 as expected behaviour, so a fix of Spec 2 turns it red. Verdict: none on an item. This is a process finding for the orchestrator: keep the tests with entries Axel approves, or remove them at landing.

2. `src/lib/ui/controls/editor/types.ts:49`: `/** Shown in the editor's menu but not runnable, and left out of the palette. */`. What is wrong: the report's own case 16 run, and Monaco's use of the precondition as the menu item's visibility, show that the action is hidden, not shown greyed. The comment is false (spec prose rule, comments say what the code does). Failure scenario: a reader relies on the comment and expects a greyed item, then files a defect. Verdict: none.

3. Report, first section: "Two read-only git commands were run despite the no-git rule". What is wrong: the spec says agents never run a git command. The report states it, and nothing changed. Verdict: none.

## 4. Behaviour

1. `src/lib/state/system/machine/lsp/edits.ts:157-164`: `const made = applyTextEdits(draft.text, one.edits);`. Also `transport/edits.ts:47-58`: `staleFile` only compares versions of documents registered on the asking transport. What is wrong: a tab's unsaved draft is edited at positions that the server may have computed from the disk text. Three kinds of tab are not registered with the asking server:
   - a tab not shown since a reload, which `PaneBody.svelte:118-119` does not mount, while its draft comes back from storage with `loaded: true` and its unsaved text (`source.svelte.ts:129`, `:407-410`);
   - a tab on another channel, such as a `.ts` tab named by the Svelte server;
   - a tab no server serves.

   For these the server reads the file from disk, and nothing compares the draft with the disk text before the edit lands. Brief item 4 asks for these tabs to be edited in the tab, and it does not waive the "range the tab no longer has" refusal. Failure scenario: reload with `lib.ts` holding an unsaved line added at the top and its tab not shown since, then rename from `app.ts`. The rename's ranges land one line off in `lib.ts`'s unsaved text and corrupt it without a notice. The report should have stated it under host-visible changes. Fix shape: when a tab is not registered with the asking server and its draft differs from `saved` (or from the disk hash), refuse with `lsp_edit_changed`. Verdict: item 4 violated.

2. `src/lib/state/system/machine/lsp/edits.ts:157-179`: the tab texts are computed before `await parts.askHeld`, `await parts.hashOf` and `await parts.write`, and then `parts.edit(one.id, one.text)` replaces each draft's whole text. What is wrong: anything typed into such a tab during the awaits is overwritten by the precomputed text. The ask can last up to `ANSWER_MS = 10_000` (`lsp.svelte.ts:111`). Failure scenario: start a cross-file rename and keep typing in the asking tab. Characters typed between the answer and the end of the post disappear, and no notice says so. Fix shape: re-check the draft against the text the edit was computed from just before `parts.edit`, and refuse or recompute if it changed. Verdict: item 4 violated.

3. `src/lib/ui/controls/editor/Editor.svelte:345-349` (unchanged code, newly reached): `held.pushEditOperations([], [{ range: held.getFullModelRange(), text: wanted }], () => null);`. What is wrong: every in-tab LSP edit, including a same-file F2 rename and a quick fix, now reaches the model as one replacement of the whole text, where Monaco's own client used to apply the edit's ranges. Selections, decorations and folded regions tracked across a whole-content replace are not kept as they were. The report does not state it. Not verified by a run. Failure scenario: F2 in line 400 of a long file may move the caret away from the renamed symbol and unfold regions. Verdict: none until run. The report should have listed it as user-visible.

4. `config/text/views/sources/source.yml:61`: `lsp_edit_failed: "The language server's edit to {0} could not be made, so nothing more was changed."`. What is wrong: it is used when nothing at all was written (`edits.ts:136`, `:168`, `:173`, and `refusedWrite` for missing, denied, binary, too_large and not-an-action), and "nothing more" suggests that part was changed. Failure scenario: the reader looks for a partial change that does not exist. Verdict: none.

5. `config/text/statusbar.yml:112`: `svelte_config_trusted_tip: ... the Svelte server runs it with the repository's own Svelte, Prettier and preprocessors.` What is wrong: in a repository with no `svelte` package (case 11's fixture, which brief item 2 names), the server falls back to its own Svelte, so the tooltip is false there. Failure scenario: the reader trusts diagnostics as coming from the repository's Svelte version. Verdict: item 2 violated in part (the brief asks the tooltip to say Svelte 4 diagnostics for this case).

6. `src/lib/server/machine/lsp/web/approval.ts:41`: `return approveConfig(env.approvals, (await configOf(env)).text);`. What is wrong: the approval is taken over the config text read at the moment of approval, and the `approve` message (`wire.ts:48`, `{ kind: 'config' }`) carries nothing about the text the reader was shown. DESIGN's processes rule says a process runs "only after the reader has approved that exact text". Failure scenario: `svelte.config.js` changes between the list being drawn and Approve being pressed, and the changed text is approved and run. Fix shape: the list sends the key it showed, and approve refuses a mismatch. Verdict: none (minor).

## Declined to judge

- The two `tsc` `CardAction` errors (`task-card.ts:10`, `card.ts:10`). Neither file is in the diff (`git diff 8d9cdd60 --stat` over those folders lists none), and I did not run tsc on the base, so whether they predate the step is not verified.
- The live Electron cases (1, 2, 5, 10, 11, 13b, 13c, 14 to 17). I did not rerun them. Their verdicts above rest on the report's quoted runs.
- Cmd+T in the desktop app. Not runnable under the standing rules.
- That the new tests fail on the unchanged tree. That needs a base copy with node_modules, which I did not build.
- Whether the Svelte approval should also cover the repository's `node_modules` packages that trusted mode loads (Svelte, Prettier, preprocessors). Z686 (1) defines the approval as the config files' text, so this is Axel's call, not a finding.
- `npm run test:checks`. Not rerun. The report quotes 2 failures, both `integrity.test.ts`, the sparse-checkout `deck/` case the orchestrator excluded.

Reviewer usage: agent id not known to the reviewer, claude-opus-5-5, tokens not measured, tool uses not counted across the context compaction, minutes not measured.

Usage: a4154cbe655a3b836, claude-opus-5-5, 138,932 tokens, 133 tool uses, 23.8 min.

## Repair round 1, refuted

Summary: the round closes items 1, 3, 4, 5, 9 to 13, 15 and 16 as asked, and every check I reran passes. Item 4 of the brief is still violated:
- (a) The new check for tabs the server does not hold works per file, not per tab. A second tab over a file the server holds is edited at positions computed from another tab's text, and is corrupted without a notice.
- (b) The "held" set is the asking transport's, which is one language channel. A tab with unsaved text on the other channel of the same server (a `.c` tab named by clangd's `cpp` rename, a `.js` tab named by the TypeScript server) is now refused with "changed since", although the server computed the edit on that text.
- (c) The two-page refusal row that Z693 (1) keeps under G2 is not in `edits.test.ts`.

Also: `Source.svelte` is 522 lines, over the 520 limit. The round writes files that D45 also changes, and `shared_paths` does not name them.

```
npm run diagrams            (worktree tools/oculus)
  regenerated docs/diagrams/*; `git diff 8d9cdd60 | md5` 04a3d6940e34d20989d8c5efe85a1bfb before and after (no change against the builder's tree)

npm run test:quick -- --base 8d9cdd60
  test:quick: 119 changed file(s), from git since 8d9cdd60
  test:quick: 103 test file(s), 10 essential
  ok      ASCII gate (0.8 s)
  ok      prettier (2.0 s): All matched files use Prettier code style!
  ok      svelte-kit sync (2.5 s)
  ok      eslint (2.5 s)
  ok      svelte-check (5.8 s): 1791359671301 COMPLETED 406 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
  ok      vitest (21.5 s): Duration  17.23s (transform 22.53s, setup 0ms, import 33.96s, tests 32.79s, environment 141ms)
  test:quick: 22.3 s (limit 45.0 s); every command passed
  test:quick: not covered: tests outside the selection, tests/checks, slow tests,
              build, lint of unchanged files; npm run test:landing runs them
  -> inside the 45 s limit. The tasks run at once, so the total is the slowest task. In the builder's 47.9 s run eslint ended at 45.0 s and svelte-check at 44.3 s. In mine they took 2.5 s and 5.8 s, and vitest was the slowest at 21.5 s. Why eslint and svelte-check were slow in the builder's run (cold caches, or D45's builder running at the same time) is not verified.

npx vitest run tests/server/machine/lsp tests/server/files/ops.test.ts tests/routes/replace tests/state/system/lsp tests/views/sources
  Test Files  14 passed (14)
       Tests  150 passed (150)          (matches the report)
npx vitest run tests/state/system/lsp/edits.test.ts --reporter=verbose
  3 rows pass: 'refuses a library file, ...', 'refuses an entry that creates, renames or deletes a file', 'does not overwrite a tab typed into while the edit waited, and writes nothing before it notices'
npx vitest run tests/server/machine/lsp/svelte-trust.test.ts tests/routes/replace/replace-undo.test.ts --reporter=verbose
  Test Files  2 passed (2), Tests  4 passed (4); then `ps -axo pid,command | grep -E "tsserver.js|typescript-language-server|svelte-language-server" | grep -v grep | wc -l` -> 0

npm run test:checks
  Test Files  1 failed | 16 passed (17); Tests  2 failed | 241 passed (243)
  FAIL tests/checks/config/integrity.test.ts > the real hub > validates with no findings
  FAIL tests/checks/config/integrity.test.ts > the real hub > reads the portfolio deck with every named deck found   (the two real-hub rows; deck/ is not in the worktree)
npx eslint src tests                      -> prints nothing
npx prettier --check src tests docs config/text   -> All matched files use Prettier code style!
npx svelte-check --threshold error        -> COMPLETED 3202 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
npx tsc --noEmit -p .   (worktree)        -> task-card.ts(10,15) and card.ts(10,15) TS2614 'CardAction', nothing else
npx tsc --noEmit -p .   (D23b-base/tools/oculus)  -> the same two errors: they precede the step (item 16 reproduced)

sh utils/folder-check.sh; echo $?          -> no output, 0
sh utils/unused-exports.sh vs D23b-base/tools/oculus/unused-exports.txt -> diff prints nothing, exit 0; "Unused exports (250)"
brief's item 4 grep (entries modules excluded) -> kit/folding.ts:97, kit/lsp/hosts.ts:19,22,148, views/sources/source/language/lsp.ts:36,120 (as reported; none a server branch)
wc -l: largest .ts kit/lsp/transport.ts 864, ops.ts 849, relay.ts 839; .svelte: Source.svelte 522 (base 520), Palette.svelte 520, ui Editor.svelte 516 (base 496)

grep -rn "ADAPTERS" src/lib/server/machine/lsp; echo $?   -> exit 1
grep -n "lsp_edit_failed" config/text/views/sources/source.yml -> 61: "The language server's edit to {0} could not be made, so nothing was changed."
sed -n 49p src/lib/ui/controls/editor/types.ts -> "Not runnable: the action is hidden from the editor's menu and left out of the palette."
ls tests/state/system/lsp tests/shell tests/ui/controls/editor -> edits.test.ts; fixtures panes rail; monaco-diff.ts
node $TMPDIR/d23b/probe-edits.mjs   (the builder's probe, item 5)
  two entries for one file: {"applied":false,"notice":"lsp_edit_failed","words":["hub/a.py"]} calls []
  changes key and documentChanges entry: {"applied":false,"notice":"lsp_edit_failed","words":["hub/a.py"]} calls []

Reviewer probes of the page function (scripts in my scratchpad, edits.ts imported as it is, recording parts; nothing in the worktree changed):
  two-tabs.mts: hub/a.py in tabs t1 'old = 1\n' and t2 '# typed\nold = 1\n' (unsaved), held = {a.py}, rename at line 0 chars 0-3 to 'new'
    outcome {"applied":true}
    edited [{"id":"t1","text":"new = 1\n"},{"id":"t2","text":"newyped\nold = 1\n"}]
  other-channel.mts: asking transport holds user.cpp; legacy.c tab holds an unsaved first line the server was told of; rename names both
    outcome {"applied":false,"notice":"lsp_edit_changed","words":["hub/legacy.c"]}
    edited []
```

Not rerun: the live Electron cases the round quotes (cases 18 to 23, and the regression of cases 1, 10, 13b and 13c). Their verdicts below rest on the report's quoted runs and on my reading of the code.

### Verdicts

Items of the brief's "What to build", for the whole diff since the base:

- 1: holds. `adapter: Adapter` is a field of `ServerEntry` (`servers.ts:130`, entries at :290, :324, :381, :456), and `held/oculus.ts:77` reads `entry.adapter`. `ADAPTERS` is gone (grep exit 1). The head comment `servers.ts:6-8` now names the two places and the entry's adapter. The facts module, the grep and the `COMPUTED_PREFIXES` change stand as they were in the first review.
- 2: holds.
  - The Svelte entry's `semanticTokens: true` (`lsp-servers.ts:141`); the report's case 20 shows the tokens asked for and drawn.
  - The plugin is given only after the approval, as Z692 narrows Z686 (8). `statusbar.yml:110` and `docs/files-and-search.md:71` say that a `.ts` rename reaches `.svelte` files only after the approval.
  - The trusted tooltip now depends on `hasSvelte` (`LanguageItems.svelte:125-130`, `statusbar.yml:113`).
  - `svelte-trust.test.ts` passes.
- 3: holds. The round does not change the server side of `lsp-edit`. `lsp-edit.test.ts` and `replace-undo.test.ts` pass.
- 4: violated (Findings 1, 2 and 3). What holds:
  - other pages are asked about every named file (`edits.ts:212`);
  - a file named twice is refused before any ask (`edits.ts:134`, probe above);
  - a tab of a file the asking transport does not hold is checked against its saved text and the disk (`edits.ts:223-230`);
  - the draft is checked before and after the post (`edits.ts:238-248`; the test row passes);
  - Monaco gets the edit's own ranges (`commands.ts:141` `reachedBy`).
- 5: holds. The `uris.test.ts` row passes in the covering run.
- 6: holds. Rename goes through the same page function, and the case 23 run shows the caret and the fold kept.
- 7: holds. `#` works by the report's case 14 run. Cmd+T, by reading the key table: `keys.ts:150` `if (event.code === 'KeyT') return { kind: 'workspace-symbol' };` and `workbench-keys.svelte.ts:222-224` `options.openPalette('#')`.
- 8: holds under Z691.

Cases of the brief's "Cases":

- 1: met, per the report's regression run on the final tree.
- 2: met, per case 19 (a file open on both pages is now refused). Its test row is missing (Finding 3).
- 3, 7, 8, 9: met. `lsp-edit.test.ts` and `replace-undo.test.ts` pass.
- 4: met by reading two rows together.
  - `library.test.ts:646-665` shows that an `oculus-lib:` address reaches the page under that address.
  - The `edits.test.ts` row 'refuses a library file, ...' shows that the page refuses it with the file's name, with no edit and no write.
  - No live run reached it: pyright's answer named no library file.
- 5: met, per the report's clangd run.
- 6: met. The `uris.test.ts` row passes.
- 10: met. The report's run, and the first review's probe.
- 11: met, per the report's run. The tooltip is now true for the no-svelte fixture (case 18).
- 12: met. The `lifetime.test.ts` and `servers.test.ts` rows pass, and `ps` after the kill is now quoted (round item 12).
- 13a: met. `svelte-trust.test.ts` passes, and the report now states that the unchanged-tree run stopped at import. The row discriminates by reading.
- 13b: met under Z692, per the report's trusted run; before the approval, the tooltip and the docs say that the rename stops at `.ts` files.
- 13c: met as written, with clean tabs, per the report's regression run. With unsaved text in the `.c` tab the edit is now refused (Finding 2).
- 14: met for `#` with Python, C++ and TypeScript per the report's run, and for Cmd+T by reading the key table.
- 15, 16, 17: met, per the report's runs, under Z691 and Z687.

Implied inputs:

- A file named twice: met (probe above).
- A file in two tabs of one page: partial. Both tabs get the edit, but when the second tab's draft differs from the text the server holds, its text is corrupted (Finding 1).
- Overlapping ranges, and CRLF, BOM and UTF-16: met (`lsp-edit.test.ts`).
- An answer after the tab closed: met by reading.
- A revoke restarts untrusted: met per case 11.
- A killed server leaves no tsserver child: met (round item 12).

Case 22, the partial tab edit: not established. The five reruns did not reproduce it.
- By the builder's own account of the sequence, both tabs were registered, and nothing was typed while the edit waited. So neither the item 6 mechanism nor the item 7 mechanism applies to it.
- The item 8 change (applying the edit's ranges) does not explain an occurrence left unrenamed either.
- Findings 1 and 2 give corrupted or refused edits, not one occurrence left out, so they do not explain it.
- Five runs that do not recur do not show a cause. The defect stays unexplained.

### Findings

1. Behaviour, `src/lib/state/system/machine/lsp/edits.ts:223-224`: `for (const one of texts) { if (served.has(one.name)) continue;`.
   - What is wrong: round item 6 asks for "a tab whose draft the asking server does not hold at the draft's version" to be edited only when its draft equals the file on disk. The check skips every tab of a file that is in `held`. The transport keeps one document per file, and the server follows only the first registered model (`transport.ts:13-14`: "Two models of one file are one document: the server follows the first registered model"). Drafts belong to each tab (`source.svelte.ts:331`). So a second tab over a held file whose draft differs from the first one is edited at positions computed for the other text.
   - Failure scenario (the probe above): `a.py` is open in two tabs of one page, and the second tab holds an unsaved first line. This is the reviewer's reload case with a second, mounted tab of the same file, or a copied tab typed into. A rename from the first tab turns the second tab's `# typed` into `newyped` with `applied: true`, and no notice is shown.
   - Fix shape: skip the check only for a tab whose draft is the text of the document the transport holds for that file. Otherwise apply the unheld rule, or refuse with `lsp_edit_changed`.
   - Verdict: item 4 violated; implied input "a file in two tabs" partial.

2. Behaviour and spec, `src/lib/ui/controls/editor/kit/lsp/transport.ts:503`: `return await this.#host.applyEdit(edit, new Set(this.#versions().keys()));`.
   - What is wrong: `held` holds the documents of the asking transport, and the page makes one transport per language (`client.ts:328`, `new LspTransport(this.#port, language, ...)`). One server serves two channels: clangd serves `c` and `cpp`, and the TypeScript server serves `typescript` and `javascript` (G36). A tab on the other channel of the same server is treated as a tab the server does not hold. Brief item 4 names exactly these tabs ("a header open as `c` named by a `cpp` server, a `.js` tab named by the TypeScript server") as edited in the tab, unsaved.
   - Failure scenario (the probe above): `legacy.c` has an unsaved line, clangd was told of it through `lsp:c` and computed the rename on it. The rename from `user.cpp` is refused with "hub/legacy.c changed since the language server made this edit, so nothing was changed.", which is false. Before the round the same edit was applied.
   - Fix shape: `held` is the documents of every transport of a language that the asking server's entry serves (`lsp-servers.ts` languages).
   - Verdict: item 4 violated.

3. Spec and proof, `tests/state/system/lsp/edits.test.ts` (3 rows; `askHeld` always answers `[]`, :52-55).
   - What is wrong: round item 2 asked for the row at `edits.test.ts:148` to follow the brief's rule. Z693 (1) keeps the other-page refusal as a G2 row of this file, "restored at landing if the round's review does not find it". The builder removed the row, so the refusal it guarded has no check. This is a check removed instead of a check fixed. The report's "To rule" raises the conflict between items 2 and 14, which Z693 (1) had already settled.
   - The row at landing: `askHeld` answers `[a]` for a file that a tab of this page also holds; it expects `{ applied: false, notice: 'lsp_edit_elsewhere', words: ['hub/a.py'] }`, no `edit` and no `write`. It is named in G2's Doc text.
   - Failure scenario: a later change narrows the other-page check again, and nothing fails. Then one page's save overwrites the other page's edit.
   - Verdict: item 4 violated (its test).

4. Behaviour, `config/text/views/sources/source.yml`, `lsp_edit_partial`: "The language server's edit stopped at {0} after {1} files were written. History undoes them.", used at `edits.ts:247` with the typed tab as {0} and `files.length` as {1}.
   - What is wrong: in the item 7 case the edit did not stop at {0} because of a write. The tab was typed into, and no tab was edited, the untouched ones included. The sentence says neither. With one disk file it reads "after 1 files". It also gives one key two meanings: a server write that failed partway, and a tab typed into.
   - Failure scenario: rename from `calc.py`, then typing in that tab during the post. `use.py` is written with `grand_total`, and `calc.py` keeps `total` and the typing. The reader reads "stopped at cathedra/calc.py after 1 files were written", looks for a failed write of `calc.py`, and does not learn that the tabs were left as they are.
   - Fix shape: a sentence of its own for the typed tab, which says that the tabs were left as they are and how many files were written, with a singular form.
   - Verdict: none.

5. Standards, `src/lib/views/sources/source/Source.svelte`: 522 lines (`wc -l`; 520 in the base copy; `git diff 8d9cdd60 --stat` shows +2, `sourceReach,` and `reached={() => sourceReach(instance.id)}` from round item 8).
   - What is wrong: the brief's file constraints and the spec's size rule set 520 for a component, to be split by responsibility before it passes. The report's size row lists `Editor.svelte` (ui) 516 and `Palette.svelte` 520 and leaves this file out, although its file list shows 522.
   - Failure scenario: the landing takes a component over the limit, and D45, which splits this file because it is at 520, merges against two lines it did not plan for.
   - Verdict: none (the brief's file constraint).

6. Spec, files outside the brief's "Paths this step writes":
   - The files are `src/lib/state/sessions/source.svelte.ts`, `views/sources/source/Source.svelte`, `views/sources/source/Editor.svelte`, `ui/controls/editor/commands.ts`, `ui/controls/editor/Editor.svelte`, `ui/controls/editor/types.ts` and `ui/controls/editor/chords.ts`.
   - Z686 (4) lets the step widen its write list. Round item 8 needs the first five.
   - What is wrong: D45's worktree (`git status --short` there) changes `source.svelte.ts`, `ui/controls/editor/Editor.svelte`, `chords.ts`, `commands.ts`, `types.ts` and `Source.svelte`. D23b's `shared_paths` in the state file names none of them, so the merge judgement was made without them. The report does not list them as departures from the path list.
   - Failure scenario: the second of D45 and D23b to land meets conflicts in `commands.ts`, `Editor.svelte` and `Source.svelte` that no one planned for, the last one while D45 splits it.
   - Verdict: none.

7. Proof, `tests/state/system/lsp/edits.test.ts:127` 'does not overwrite a tab typed into while the edit waited, and writes nothing before it notices'.
   - What is wrong: the report quotes no unchanged-tree run of this new row, and says such a run would need the repaired code taken out. On the base, `edits.ts` does not exist, so the row stops at import, as G55's did, and the report should say so as round item 13 does for G55.
   - By reading, both halves discriminate: `held` contains `a`, so the disk check is skipped and only `moved()` can refuse.
   - The row also has no guarded entry: the Doc text files it as "not G2's". At landing it needs an entry. G8, "a write whose base the file no longer holds is refused", fits.
   - Failure scenario: the row stays in the suite as a test of no entry.
   - Verdict: none.

8. Standards, `tests/state/system/lsp/edits.test.ts:10-13`: "the other refusals of the page's function (another page's tab, a file named twice, a tab the server does not hold), which the report's live runs show".
   - What is wrong: the refusal of a file named twice is shown by `probe-edits.mjs`, not by a live run. Once Z693 (1)'s row is restored, "another page's tab" is no longer outside the file. The comment then says what the file does not do.
   - Failure scenario: a reader looks in the report's live runs for the refusal of a file named twice and does not find it.
   - Verdict: none.

### Declined to judge

- The live Electron cases of the round (cases 18 to 23) and the regression reruns. I did not run them. Their verdicts rest on the report's quoted output and my reading of `edits.ts`, `commands.ts`, `ChoiceRows.svelte` and `approval.ts`. Findings 1 and 2 are shown on the page function by my probes, not by a live run.
- Round item 11, the approval key: it holds by reading. `wire.ts:48` requires the key. `approval.ts:47-49` approves only when `configKey(text) === key`, and `svelte-adapter.ts:38-40` answers no restart for a key that does not match. `applyApprove` sends the choices again, and the page sets the choices before it resolves the answer (`lsp.svelte.ts:220-231`), so `stillAsks()` reads the new rows. Whether the list closes after a successful approval in the live app is not verified, since case 18 does not say.
- Item 7's choice of applying no tab edit when a tab was typed into after the post, the untouched tabs included: the round's text asks only that the typed tab is not overwritten. Either choice leaves a partial edit that History undoes. I judge the choice acceptable and leave it to the orchestrator; Finding 4 covers only the sentence.
- Z693 (2) and the brief's implied input refuse a file named in both `changes` and `documentChanges`. The LSP specification prefers `documentChanges` when both are present, so a server that sends both for compatibility would have every edit refused. Whether any of the four servers sends both is not verified. The rule is the brief's and the ruling's, so this is the orchestrator's call, not a finding.
- The cause of case 22's partial tab edit: not settled by reading. A run that reproduces it would settle it.
- Whether the base copy's `src` is byte-identical to `8d9cdd60`: not checked. The item 16 conclusion assumes it.

Reviewer usage: agent id not known to the reviewer, claude-opus-5-5, tokens not measured, about 60 tool uses, about 20 minutes.

Usage: a12a7cba3671b22e6, claude-opus-5-5, 255,821 tokens, 86 tool uses, 17.9 min.

## Repair round 2, refuted

Summary: the round closes its nine items. Every check I reran passes. Item 4 of the brief now holds, and so do the other seven items. What is left:
- (a) The restored two-page row (`edits.test.ts:132`) would still pass if the other-page check were narrowed again. Its mock answers the same thing whatever files it is asked about. This is a Proof finding, and the fix is small.
- (b) Four small text fixes: the singular of `lsp_edit_partial`, one false sentence in the head comment of `edits.ts`, a test comment that points at "the step's report", and G8's Code line in the Doc text.
- (c) A Behaviour finding from the first build, outside this round's delta. After every rename, the screen reader announces Monaco's "Made 0 edits in 0 files". The fix is not small.
- (d) A breach of a standing rule in this round: the builder ran `tmux kill-session -t oculus-usage-claude` on the default tmux socket twice, without checking whose session it was.
- (e) Case 22 is not settled. Nothing in the page's code leaves one named tab unedited while another is edited. The logged state matches a server answer that named only `lib.ts`. My probe shows typescript-language-server answers that way for this fixture whenever `app.ts` is not open on the server.

```
npm run diagrams                     (worktree tools/oculus)
  regenerated docs/diagrams/*; `git diff 8d9cdd60 | md5` 5206a2da136cfa83c6b0f0e09a75dcec before and after (no change against the builder's tree)

npm run test:quick -- --base 8d9cdd60
  ok      ASCII gate (1.0 s)
  ok      prettier (2.2 s): All matched files use Prettier code style!
  ok      svelte-kit sync (8.7 s)
  ok      eslint (23.1 s)
  ok      svelte-check (19.5 s): 1791364513631 COMPLETED 406 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
  ok      vitest (32.6 s): Duration  24.31s (transform 49.11s, setup 0ms, import 62.05s, tests 29.43s, environment 141ms)
  test:quick: 33.4 s (limit 45.0 s); every command passed
  test:quick: not covered: tests outside the selection, tests/checks, slow tests,
              build, lint of unchanged files; npm run test:landing runs them

npx vitest run tests/server/machine/lsp tests/server/files/ops.test.ts tests/routes/replace tests/state/system/lsp tests/views/sources
  Test Files  14 passed (14)
       Tests  151 passed (151)          (matches the report)
npx vitest run tests/state/system/lsp/edits.test.ts tests/server/machine/lsp/svelte-trust.test.ts tests/routes/replace/replace-undo.test.ts --reporter=verbose
  edits.test.ts: 4 rows pass, among them 'refuses an edit that names a file open in a tab of another page, whether or not a tab of this page holds it' (:132) and 'does not overwrite a tab typed into while the edit waited, and writes nothing before it notices' (:146)
  Test Files  3 passed (3), Tests  8 passed (8); then `ps ... | grep -E "tsserver.js|typescript-language-server|svelte-language-server" | wc -l` -> 0
npm run test:checks
  FAIL tests/checks/config/integrity.test.ts > the real hub > validates with no findings
  FAIL tests/checks/config/integrity.test.ts > the real hub > reads the portfolio deck with every named deck found
  Test Files  1 failed | 16 passed (17); Tests  2 failed | 241 passed (243)   (the two real-hub rows; deck/ is not in the worktree)
npx tsc --noEmit -p .   -> task-card.ts(10,15) and card.ts(10,15) TS2614 'CardAction', nothing else (present in the base, round 1 item 16)
sh utils/folder-check.sh; echo $?   -> 0
sh utils/unused-exports.sh vs D23b-base/tools/oculus/unused-exports.txt -> diff prints nothing; "Unused exports (250)"
brief's item 4 grep (entries module excluded) -> kit/folding.ts:97, kit/lsp/hosts.ts:19,22,162, views/sources/source/language/lsp.ts:36,120 (as before; none a server branch)
wc -l: Source.svelte 513, save/tab-draft.svelte.ts 57, kit/lsp/transport.ts 873, client.ts 640, hosts.ts 188, services.ts 89, state/.../lsp/edits.ts 285, ui Editor.svelte 516, Palette.svelte 520, relay.ts 839, ops.ts 849; `ls save | wc -l` 8
line references of the round's report: hosts.ts:104 heldOf, :176 `held: heldOf`, client.ts:133, :231 documents(), :516, transport.ts:99 and :512 applyEdit(edit), :388 documents(), source.yml:68-69, edits.test.ts:132 and :146: all as quoted

My own probes of the final edits.ts (scratchpad probes/probe.mts, the module imported as it is, recording parts):
  two-tabs, second dirty:            {"applied":false,"notice":"lsp_edit_changed","words":["hub/a.py"]} {"edited":[],"written":[]}
  two-tabs, both the held text:      {"applied":true} edited t1 and t2 "new = 1\n"
  two-tabs, first dirty and held:    {"applied":false,"notice":"lsp_edit_changed","words":["hub/a.py"]} {"edited":[],"written":[]}
  other-channel, held of the asking channel only: {"applied":false,"notice":"lsp_edit_changed","words":["hub/legacy.c"]}
  other-channel, held of c and cpp (what heldOf passes): {"applied":true} edited tu "int y = neu();\n", tl "// typed\nint x = neu();\n"
  crlf draft, lf model text:         {"applied":true} edited "new = 1\r\n"

typescript-language-server probe (scratchpad tsprobe/probe.mjs, the worktree's node_modules, cathedra/ts/app.ts and lib.ts copied from the builder's fixture, which has no tsconfig; rename of `double` in lib.ts):
  both          ["lib.ts:1","app.ts:3"]
  typed-undone  ["lib.ts:1","app.ts:3"]
  lib-only      ["lib.ts:1"]
  app-closed    ["lib.ts:1"]
  then tsserver/typescript-language-server processes: 0

The builder's logs read (not rerun): $TMPDIR/d23b/out/f-case24.txt, f-case13c.txt, case13c-dirty.txt, r2-case22.txt: as the round's report quotes them.
```

Not rerun: the live Electron cases (24, 13c clean and dirty, 13b, 1, 2, 10, 19, 21, 22). Their verdicts rest on the builder's logs, which I read on disk, and on my probes.

### Verdicts

Items of the brief's "What to build", for the whole diff since the base:

- 1: holds. The round does not change the entries; the grep and the facts module are as in the first review.
- 2: holds, as in the review over round 1. The round does not change the servers.
- 3: holds. `lsp-edit.test.ts` and `replace-undo.test.ts` pass. The round does not change the server side.
- 4: holds.
  - The check is per tab (`edits.ts:224-241`). A tab of a held file is edited only when its draft is the text the server holds, which is the first model's text (`transport.ts:388-394`, `client.ts:231`). Any other tab of that file is refused. Refusing that tab is correct, not stricter than needed: when the held tab is dirty, a clean second tab equal to the disk would get positions computed for other text. My probes show both outcomes.
  - `heldOf` (`hosts.ts:104-112`) merges the `documents()` of every host whose language the asking server's entry lists. `factsForLanguage` gives clangd `['c','cpp']` and the TypeScript server `['javascript','typescript']` (`lsp-servers.ts:97`, `:115`). It is passed per host (`hosts.ts:176`), and `client.ts:516` hands it to `services.applyEdit` (`lsp.ts:197`). My probe with the merged map edits the dirty `.c` tab.
  - The two-page refusal asks about every named file (`edits.ts:219-221`). Its row is weak (Finding 1).
  - A tab typed into after the post gets `lsp_edit_typed` or `lsp_edit_typed_one` (`edits.ts:256-261`). Its singular is chosen by `files.length === 1`, and the row asserts both forms. The rest stands as in the review over round 1.
- 5: holds. The `uris.test.ts` row passes in the covering run.
- 6: holds. Rename goes through the page function, per case 24's second rename and case 13c. The announcement Monaco makes after a rename is Finding 6.
- 7: holds, as in the review over round 1.
- 8: holds under Z691.

The split of `tab-draft.svelte.ts` out of `Source.svelte`: holds by reading.
- The `$effect` body, `typed` and `toggleWrap` match the removed code line for line (`git diff 8d9cdd60 -- Source.svelte`), with `untrack` imported where it is used.
- Nothing else left `Source.svelte`.
- One difference: the load effect is now created at `Source.svelte:212`, before `createTabLanguage` and the other partials, where before it was the last effect created. Every getter it reads (`root`, `path`, `head`, `blocked`, `untitled`, `options`) is declared above line 212. The load runs untracked and async. So the order changes only which effect sees the loaded draft on its first run. The builder's runs after the move (cases 24, 1, 13c) show tabs loading and typing reaching the draft.

Cases of the brief's "Cases":

- 1: met, per the builder's final run.
- 2: met, per cases 2 and 19. Its test row does not discriminate (Finding 1).
- 3, 7, 8, 9: met. `lsp-edit.test.ts` and `replace-undo.test.ts` pass.
- 4: met by reading the two rows together, as in the review over round 1.
- 5, 10, 11, 14 to 17: met, as in the review over round 1. The round does not change these paths.
- 6: met.
- 12: met.
- 13a: met.
- 13b: met under Z692.
- 13c: met with clean tabs (f-case13c.txt). With unsaved text in the `.c` tab the edit now applies to that tab, unsaved, and writes nothing (case13c-dirty.txt).

Implied inputs:
- A file named twice: met.
- A file in two tabs of one page: met (my two-tabs probes; case 24's log).
- Overlapping ranges, CRLF, BOM and UTF-16: met.
- An answer after the tab closed: met by reading.
- A revoke restarts the server untrusted: met.
- A killed server leaves no child: met.

Case 22, the tab left unrenamed: not established.
- The page's function edits every tab its answer names, or none. All tab edits run in one loop after every check (`edits.ts:263`).
- A named tab whose file is not matched would have gone to `lsp-edit` and been written. The log shows `app.ts` unchanged on disk too.
- So the logged state (`lib.ts` renamed; `app.ts` unchanged in the tab and on disk; no refusal) matches an answer that named `lib.ts` alone. Nothing in `edits.ts`, `client.ts`, `hosts.ts` or `transport.ts` explains it.
- typescript-language-server gives exactly that answer for this fixture (`cathedra/ts` has no tsconfig, so `app.ts` and `lib.ts` are loose files in an inferred project) whenever `app.ts` is not open on the server (my probe: `lib-only` and `app-closed` give `["lib.ts:1"]`).
- Whether `app.ts` had been closed on the server at that moment is not established. The original frames are gone, and `out/case10.txt` was overwritten at 10:34.
- The three reruns are not the original state. In all three, `app.ts` keeps the typed `}dou` (`r2-case22.txt`), so the undo did not take. The builder's account of the original says the undo ran, and its quote shows no `dou`.
- The likely cause is the server's own reach for loose TypeScript files, not oculus's page code. In VS Code, a TypeScript rename in a folder without a tsconfig also misses files that are not open.

### Findings

1. Proof, `tests/state/system/lsp/edits.test.ts:132-144`. The row is `elsewhere: [{ root: 'hub', path: 'a.py' }]` with `askHeld: () => { options.during?.(); return Promise.resolve(options.elsewhere ?? []); }` (`:57-60`).
   - What is wrong: the mock answers `[a]` whatever files it is asked about. So under the narrow rule Z693 (1) guards against, the row still passes. That rule is `askHeld(onDisk...)`, which asks only about `b`, the file no tab holds. It would refuse with `lsp_edit_elsewhere`, `hub/a.py`, which is what the row expects. Judged by reading.
   - Failure scenario: a later change narrows the other-page check to files no tab of this page holds. The suite stays green. Then a file open in both pages is renamed in one page, and one page's save overwrites the other's text.
   - Fix (small, at landing): the mock answers only the files it is asked about:
     ```ts
     askHeld: (files) => {
         options.during?.();
         const asked = (one: LspPlace) => files.some((f) => f.root === one.root && f.path === one.path);
         return Promise.resolve((options.elsewhere ?? []).filter(asked));
     },
     ```
   - Verdict: case 2's test (item 4's other-page refusal) is not proven by its row; the behaviour itself holds.

2. Behaviour and standards, `config/text/views/sources/source.yml:65`: `lsp_edit_partial: "The language server's edit stopped at {0} after {1} files were written. History undoes them."`
   - What is wrong: `refusedWrite` (`edits.ts:173-175`) fills `{1}` with `outcome.done.length`. When the second of two files fails, that is 1. The round gave `lsp_edit_typed` a singular, and this key, from the same family, still reads "after 1 files were written. History undoes them."
   - Failure scenario: a two-file rename whose second write fails shows the plural sentence for one file.
   - Fix (small): add `lsp_edit_partial_one` ("... after 1 file was written. History undoes it."), add it to `LSP_EDIT_NOTICES` (`text-edits.ts`), and branch on `done.length === 1` in `refusedWrite`.
   - Verdict: none.

3. Standards, `src/lib/state/system/machine/lsp/edits.ts:19-27`: "The whole edit is refused, with the notice that names the file, when ... - a tab's draft changed while the edit waited".
   - What is wrong: when the tab is typed into after the post, the files stay written and only the tabs are left. `edits.ts:255` says so, but the head comment lists this case under "the whole edit is refused" (spec: a head comment the change makes false is a defect).
   - Failure scenario: a reader trusts the head comment and expects nothing written in that case.
   - Fix (small): the item reads "a tab's draft changed while the edit waited, before the files were written (after, the files stay written, History undoes them, and the tabs are left as typed)".
   - Verdict: none.

4. Standards, `tests/state/system/lsp/edits.test.ts:11-13`: "the refusals of a file named twice and of a tab whose text is not the one the server holds, which the step's report shows with a probe of this function over recording parts and with live runs".
   - What is wrong: a test comment points at "the step's report", a process document under `.scratch/` that a reader of the tree cannot find. That is the history the spec's comment rule bans. Round item 7 asked to say where each refusal is shown, and the only true place is not one a comment may name.
   - Failure scenario: a reader looks for "the step's report" in the tree and finds nothing.
   - Fix (small): "...and of a tab whose text is not the one the server holds, which no guarded entry names, so no row here tests them".
   - Verdict: none.

5. Spec (Doc text), report "Doc text", entry G8: "Code adds `src/lib/server/files/fs/lsp-edit.ts`. Test adds ... `tests/state/system/lsp/edits.test.ts`, 'does not overwrite a tab typed into ...'".
   - What is wrong: the G8 row tests `src/lib/state/system/machine/lsp/edits.ts`, which G8's Code line does not name. The spec says an entry names the units its tests cover.
   - Failure scenario: a later step changes `edits.ts`, does not run G8's test, and the typed-tab refusal breaks unseen.
   - Fix (small, at landing, where the orchestrator applies the Doc text): G8's Code line also names `src/lib/state/system/machine/lsp/edits.ts`.
   - Verdict: none.

6. Behaviour, from the first build and outside this round's delta, `src/lib/ui/controls/editor/kit/lsp/transport.ts` (the rename branch of the answer handler): `result: outcome.applied ? { documentChanges: [] } : null`.
   - What is wrong: Monaco's rename controller applies the empty edit and announces its summary in its aria live region. Every rename that oculus applied is announced "Successfully renamed 'total' to 'grand_total'. Summary: Made 0 edits in 0 files" (`f-case24.txt`, `f-case13c.txt`, `r2-case22.txt`). The spec counts the accessible output as visible. The reports state no before and after for it.
   - Failure scenario: a screen-reader user renames across two files, hears "Made 0 edits in 0 files", and concludes the rename did nothing.
   - Not small. Options:
     - (a) Register oculus's own rename provider over the client's. It applies through the page and returns an edit that names nothing, together with the page's own announcement.
     - (b) Return `null` and let the page announce the result. Monaco then shows its visible "No result", which is worse.
     - (c) Book it as a later step for the editor's announcements. This is the lazy option.
   - Recommended: (a), raised to the orchestrator.
   - Verdict: none.

7. Standards (the state file's standing demand "Never run tmux without `-L` or a private `-S` socket, and never list the default socket"), the builder's transcript `agents/agent-adf9011378450f02a.jsonl`:
   - In the first build (06:10) the builder ran `tmux list-sessions ...` and `tmux kill-session -t oculus-usage-claude`. The list showed the session was the scratch hub's.
   - In this round (08:39 and 08:50) it ran `tmux kill-session -t oculus-usage-claude 2>/dev/null` twice, on the default socket, with no check of whose session it was. The report's stray-processes row calls this ending the session.
   - What is wrong: `oculus-usage-claude` is the fixed name both the scratch server and Axel's own server on 8787 give their usage-refresh session on the default socket (`usage/refresh.ts:67`, `:197`; `pty/tmux.ts:44-46` adds `-S` only when a socket is given). The blind kill could have ended Axel's server's refresh mid-run. Also, the scratch server's own tick kills a leftover of that name, so any scratch server collides with Axel's on that session.
   - Failure scenario: Axel's server is mid-refresh when a builder's cleanup runs. Its usage refresh is killed, and the Usage view shows a failed refresh.
   - No code fix in this step. For the orchestrator: the next brief that starts a scratch server says to turn its usage refresh off and never to call tmux on the default socket.
   - Verdict: none.

### Declined to judge

- The live Electron cases of the round (24, 13c clean and dirty, 13b, 1, 2, 10, 19, 21, 22). I did not rerun them. I read the builder's logs on disk, which match the report's quotes, and I checked the page function with my own probes.
- `heldOf` live. I read it and fed `edits.ts` the merged map it builds. I did not run a page with `c` and `cpp` hosts myself.
- Whether either blind `tmux kill-session` in this round ended a session of Axel's server. The output was sent to `/dev/null`, so the transcript cannot settle it, and I did not touch tmux.
- The cause of case 22. Settling it needs a rerun of the original sequence that logs, at rename time, whether `app.ts` was open on the TypeScript server (the transport's `didOpen`/`didClose` frames) and the server's raw rename answer.
- The effect-order change in `Source.svelte`. Read only; no run of mine.

Reviewer usage: agent id not known to the reviewer, claude-opus-5-5, tokens not measured, about 65 tool uses, about 16 minutes.

Usage: a5cfe6049df8286b5, claude-opus-5-5, 272,924 tokens, 74 tool uses, 17.0 min.

## Closed

The dispositions of the findings of the review over round 2, the step's last round (none goes back to the builder):

1. Finding 1 (the two-page row's mock answers whatever it is asked): fixed at landing, `askHeld` answers only the files it is asked about.
2. Finding 2 (`lsp_edit_partial` for one file): fixed at landing, `lsp_edit_partial_one` and the branch on `done.length === 1`.
3. Finding 3 (`edits.ts`'s head comment): fixed at landing.
4. Finding 4 (`edits.test.ts`'s comment naming the step's report): fixed at landing.
5. Finding 5 (G8's Code line): fixed at landing in `agents/guarded.md`, with the round's Doc text.
6. Finding 6 (Monaco announces "Made 0 edits in 0 files" after every rename oculus applies): fixed at landing. The transport answers Monaco's rename request with no result once the page has applied or refused the edit (`kit/lsp/transport.ts`, the rename branch of the answer handler), so Monaco applies nothing and announces no summary; each language has one rename provider (`forLanguage` in `server/machine/lsp/servers.ts`), so no second provider is asked, and the standalone editor writes its "No result." to the console only (`rename.js:241-244`, `standaloneServices.js:168-192`).
7. Finding 7 (`tmux kill-session -t oculus-usage-claude` on the default socket in round 2): a breach of the standing demand, reported to Axel; whether it ended a session of his server cannot be read from the transcript (output to `/dev/null`). The next brief that starts a scratch server repeats the demand.
8. Case 22: the cause is not established in oculus's code; the review reads `edits.ts`, `client.ts`, `hosts.ts` and `transport.ts` and finds no path that leaves a named tab unedited, and its probe shows typescript-language-server answering a rename in a folder with no tsconfig with `lib.ts` alone whenever `app.ts` is not open on the server (`lib-only`, `app-closed`: `["lib.ts:1"]`), which matches the logged state.

The earlier runs' findings are closed as `agents/briefs/D23b-round1.md` and `agents/briefs/D23b-round2.md` list them, each verified by the review over the following round.
