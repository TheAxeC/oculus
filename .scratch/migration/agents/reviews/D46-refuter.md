# Step D46 refuter report (on .agents/worktrees/D46, base 29b50632c)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

## Verification (rerun by the reviewer)

```
# Verify 1, from tools/oculus (npm run diagrams not run: it writes the diagrams; tests/checks/diagrams below reads them current)
npm run test:quick -- --base 29b50632c          (load average 18)
ok      prettier (8.9 s): All matched files use Prettier code style!
ok      ASCII gate (9.0 s)
ok      svelte-kit sync (23.8 s)
ok      eslint (55.9 s)
ok      svelte-check (90.0 s): ... COMPLETED 444 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
FAILED  vitest (158.9 s)
 Test Files  4 failed | 114 passed | 3 skipped (121)
      Tests  4 failed | 950 passed | 23 skipped (977)
test:quick: 168.3 s (limit 45.0 s); failed: vitest
  the four: tests/routes/files/source.test.ts, tests/routes/edit/roots.test.ts, tests/server/machine/apps/manifest.test.ts
  ("Test timed out in 5000ms"), tests/server/machine/lsp/servers.test.ts (spawn count in a 30-turn loop); none imports
  a file the step changes; not the step's under the rules file's "Verify before you report", not rerun.

# Verify 2
npx vitest run --reporter=dot tests/server/files/search.test.ts tests/routes/files/search.test.ts tests/checks/source/keys.test.ts tests/checks/tree/size.test.ts tests/checks/tree/boundaries.test.ts tests/checks/config/config-folder.test.ts
 Test Files  1 failed | 5 passed (6)   Tests  1 failed | 56 passed (57)
  (keys.test.ts 'reads every findingText key...' and config-folder.test.ts 'passes every config file...': "Test timed out in 5000ms", load 18)
# the same group in the report's form:
npx vitest run --reporter=dot --testTimeout 0 --hookTimeout 0 <the six> tests/checks/source tests/checks/diagrams tests/checks/config
 Test Files  13 passed (13)   Tests  178 passed (178)

# Verify 3
wc -l: Palette.svelte 516, Workbench.svelte 520, workbench-keys.svelte.ts 559, server/files/search.ts 637, palette.ts 556,
       ops.svelte.ts 680, search.svelte.ts 533, context.ts 858 (settings.ts 864, PaletteRow 163, rows/* at most 165)

# Verify 6
sh utils/folder-check.sh                -> exit 0
sh utils/unused-exports.sh              -> 364 lines; base unused-exports.txt 364; diff: the one line of layout/index.ts loses `pageLeaves`

# The ASCII gate (rules file form)
LC_ALL=C perl -ne '...' $(find src tests bin config -type f ! -name local.yml)  -> prints nothing (bin does not exist), exit 0
LC_ALL=C grep -n '[^ -~]' DESIGN.md HELP.md docs/window.md docs/files-and-search.md -> nothing; D46-report.md:183 holds vitest's own "…"

# Commands the report quotes
npx vitest run --reporter=dot --testTimeout 0 --hookTimeout 0 tests/checks          -> Test Files 17 passed (17), Tests 248 passed (248)
npx vitest run ... tests/state/sources/search tests/server/files/search.test.ts tests/routes/files/search.test.ts
    tests/data/sources/config/settings.test.ts tests/views/shared/explorer tests/checks/source/history.test.ts
                                                                                     -> Test Files 9 passed (9), Tests 122 passed (122) (= 21 + 98 + 3)
npm run check                                                                        -> COMPLETED 3572 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
node $TMPDIR/d46/workerprobe.mjs (the builder's 50 ms probe, Node worker_threads, 100,000 names, load 14.5 to 17.9)
  names message: postMessage call on the page thread 13.0 ms; first query waited 403 ms (worker-side 334 ms)
  longest block of the page thread per query: rpls 1.9, plan 1.6, oculus plan 4.4, palette rows 2.0, oculus plan md 3.8,
  raw pls 3.9, src lib 4.9, tools oculus migration 9.4, src lib shell keys palette 7.0 ms
  worker best of 3 max: 7.1, 7.4, 45.1, 45.7, 47.3, 23.7, 21.0, 37.3, 28.3 ms; burst of 14 keystrokes: 1 answered
  (reproduces the report's shape: every page-thread figure under 10 ms)

# Reviewer's own runs under $TMPDIR (synthetic root: secrets/, a/secrets/, node_modules/, .agents/, .scratch/, .git, "my dir/", .gitignore naming ignored.txt)
rg --files --hidden --glob '!node_modules' --glob '!.git' --glob '!.svelte-kit' --glob '!.svelte-kit-app' --glob '!/secrets' .
  -> ./.agents/plan.yaml ./.gitignore ./.scratch/x.md ./a/secrets/keep.txt ./my dir/f g.md   (top secrets/ left out, nested a/secrets kept)
node names.mjs (runNames over roots hub=<root>, inner=<root>/my dir, sec=<root>/secrets, withheld <root>/secrets)
  root all:  hub [.scratch/x.md .gitignore .agents/plan.yaml a/secrets/keep.txt], inner [f g.md], sec [], cut false
  root hub:  hub [.scratch/x.md .gitignore a/secrets/keep.txt .agents/plan.yaml]     <- "my dir/f g.md" listed under no root
  max 2:     hub 2, inner 0, sec 0, cut true
node parse.mjs (JSON.parse + namesOf + fileSummary of a 6.4 MB answer of 100,000 paths): 4.1 to 9.8 ms + 1.0 to 2.4 ms + 0.0 ms
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `paletteKeyOf` (`palette.ts:520-531`) reads Cmd on macOS and Ctrl elsewhere, F1 with no modifier, macOS Ctrl+P left alone; `workbench-keys.svelte.ts:132-138` sits after the key-sheet return and before Cmd+K, so the sheet, a confirmation and the tray behave as for Cmd+K; switch and close through `paletteMode`; `grid-keys.ts:27` keeps the palette keys from the program; float windows mount the same handler (report's probe of `shownTrees`; the page part is the look's).
- 2: holds by reading. `chords.ts` `freedKeys` lists F1 on both platforms; Monaco binds no Cmd+P or Cmd+Shift+P (`grep -rn "KeyCode.KeyP \*/" node_modules/monaco-editor/esm/vs/editor`: only WinCtrl+P, Alt+P, Cmd+Alt+P); `kit/load.ts:222-226` replaces `editor.action.quickCommand`, whose newest registration is the one CommandsRegistry runs. A null-command binding is not prevented and bubbles (`abstractKeybindingService.js:240-247`). The menu itself is the look's.
- 3: violated, Behaviour 4.1 (the waiting state draws "No file matches."); the rest holds: names asked once per opening through the `search` store, matched in a worker (`file-match.worker.ts`), at most 200 rows (`FILE_ROWS`), name first then path (`fuzzyIndex` keys), `PaletteRow` gains the icon, empty query lists open file tabs (`openFileEntries`), `paletteSource.openFile` opens a kept tab with `askFocus`, `tabForKind` moved per case 9 option A, `search.max_names` key with its help and reader. The 50 ms evidence carries Proof 2.3.
- 4: violated, Spec 1.2 (a one-root request omits the files of a served root nested inside it); the rest holds: `requestFrom` (`query.ts:259-264`), refusals before any process, token first, roots run at once (`Promise.all`), cap with the child ended, `--files --hidden` with `SKIP_GLOBS` and an anchored glob per private folder.
- 5: holds. The Cmd+K branch, `:` branch and `openPalette('')` callers are unchanged; `openPalette(prefill)` keeps its signature for every caller.
- 6: holds. Key sheet row, HELP rows, `docs/window.md` paragraph, DESIGN.md:142, `editor-status.svelte.ts:14-18`, new catalog keys each read by a literal `t(...)` (grep above; `files_loading`/`files_none` also exist under `project.card`, another group, no collision). Text defects in sentences outside this item's list are Standards 3.2 and 3.3.
- 7: holds. Sizes and folders as in Verify 3 and 6 (Workbench.svelte at exactly 520).

Cases of the brief's "Cases":

- 1: met at unit level (report's handler probe: `showPalette(commands)`, `defaultPrevented=true`; reading of `workbench-keys.svelte.ts:132-138`); the page is the look's.
- 2: met at unit level, as case 1.
- 3: not verifiable here: Monaco must run in a page; reading supports it (F1 freed, quickCommand replaced). The look settles it.
- 4: met by reading: Monaco binds neither key, the handler takes it.
- 5: met for the handler (`preventDefault`, file mode); whether the print dialog stays shut is the look's.
- 6: met by reading of `gridKeys` and `paletteKeyOf` (mac: F1, Cmd+P, Cmd+Shift+P kept, Ctrl+P sent; off mac: F1, Ctrl+P, Ctrl+Shift+P kept).
- 7: met (report's probe of `openFileEntries`, `first` leads, then each pane's active, recent, rest).
- 8: met (report's probe over the worktree's names: `raw_pls.py`, `rawpls.png` first; first folder-only row at rank 139).
- 9: met by reading of `tabForKind` and `openFile`; pane and focus on a page are the look's.
- 10: met by reading of `modeOf` and the probe's `modeOf` table.
- 11: met by reading of the key handler (`paletteMode() === wanted` closes, else `showPalette`; Cmd+K closes any mode).
- 12: met by reading (branches unchanged) and the report's probe.
- 13: met: the new `it` in `tests/server/files/search.test.ts` passes (Verify 2); its unchanged-tree failure `TypeError: runNames is not a function` is quoted in the report.
- 14: met by reading: `namesArgs` builds one argument array; `runRipgrep` spawns `rgPath` with it, no shell.
- 15: met: reviewer's run with max 2 gives `cut true`, 2 names; `listRoot` returns false past the cap, which kills the child.
- 16: met by reading (`Promise.all`, per-root `error`, `files_partial` drawn whatever the query); see Proof 2.2 on the report's evidence.
- 17: met by reading of `file-names.svelte.ts` (`turn`, abort, matcher ended) and the client test runs.
- 18: met: reviewer's synthetic run (hidden folders listed, top `secrets/` left out, `node_modules`, `.git`, ignored file left out); no `--max-filesize` in `namesArgs`.
- 19: met (probe rows carry the root key; `several` draws it).
- 20: met by reading: `+server.ts` composes `browserRoots` per request, `ask()` per opening.
- 21: not verifiable: needs a browser; the look settles it.
- 22: met: reviewer's run lists the nested root's file once under the nested root; see Proof 2.2 on the report's evidence.
- 23: met: `tests/routes/files/search.test.ts` passes; `requestFrom` reading; report's probe gives the four 400s.
- 24: not verifiable here beyond `shownTrees` for a float (probe); opening in the float's pane needs the look.
- 25: met by reading: the palette keys sit after the key-sheet return and beside Cmd+K.

## 1. Spec

- 1.1 `tests/state/sources/search/file-match.test.ts` (179 lines) and `tests/state/sources/search/file-matcher.client.test.ts` (241 lines), new: "describe('the files a query lists', ...) ... it('lists at most 200 rows', ...)"; what is wrong: the brief says "Case 13 is a test ... No other case becomes a test" and the cases ruling asked for "a unit run" of the dropped older answer; the rules file ("What every package obeys") says a test exists only as the test of an entry of `agents/guarded.md`, a builder writes no other test, and a step that needs a new entry stops and asks. No entry names either file (`grep -n "file-match\|sources/search" guarded.md`: nothing), and the ranking, threshold and 200-row cases test behaviour whose failure loses no work, breaks no installation and accepts no wrong configuration. The report lists them as "new tests of the matching and the page's end" with no stop. Failure scenario: the suite carries 21 tests outside the guarded list, which the next step that changes the matcher must keep or delete without a rule to judge them by. Verdict: none (the cases they cover are met by reading).
- 1.2 `src/lib/server/files/search.ts:557-563` and `:619-621`: "deeper: dirs.filter((other) => other.key !== root.key && below(other.real, root.real))" computed over every served root, then "namesPlans(roots, options.withheld).filter((plan) => root === ALL_ROOTS || plan.key === root)"; what is wrong: item 4 says `root=<key>` answers "the paths under that root that ripgrep's `--files` lists"; for a one-root request the files of a nested served root are left out of the asked root and the nested root is not in the answer, so they are listed under no root (reviewer's run: `root hub` omits `my dir/f g.md`). `docs/files-and-search.md:144` repeats item 4's promise. Failure scenario: `GET /api/search?list=names&root=<hub key>` on main answers no file under `tools/oculus/config` (81 names). No caller in the tree sends `root` (`namesUrl()` is called without it), so the palette is unaffected. Verdict: item 4 violated.

## 2. Proof

- 2.1 `D46-report.md`, "DONE / NOT DONE" and the acceptance items: the brief's "Acceptance items" asks for "a `grep -rn` of each key over `config/text`" and verify 5 asks that each new sentence of HELP.md, DESIGN.md, `docs/window.md` and the comments be read against the rules file's prose rules with each departure named; the report quotes neither. The reviewer's grep finds no collision, so no decision changes; the missing prose read is where Standards 3.2 and 3.3 would have been caught. Failure scenario: a reader of the report takes the prose as checked. Verdict: none.
- 2.2 `D46-report.md`, "Cases, run after the change", rows 16 and 22: "A 1 ms timeout over the worktree: `200 cut=false`, root `wt:0 paths error=timed_out`; the other roots are listed." and "The probe lists `engine:layout.yml` and the hub's copy."; what is wrong: the case 16 run (`server2.probe.test.ts`) had one root, so "the other roots are listed" was not run; the case 22 evidence is `palette2.probe.test.ts`, a hand-made answer in which the same file is listed under `hub` and `engine`, which is the double listing case 22 forbids, and does not run `runNames`. The decision resting on them: the verdicts of cases 16 and 22. The reviewer's own run and reading settle both as met. Failure scenario: a landing reader takes row 22 as showing the nested file twice. Verdict: none.
- 2.3 `D46-report.md`, "The 50 ms bound (option B)": "The page thread stays under 10 ms for every keystroke of every query. The ruled bound, under 50 ms of the page's main thread, holds."; what is wrong: the probe runs a Node `worker_threads` worker and measures Node's event loop, so the page thread's share excludes the structured clone of the rows into the page and the Svelte draw of up to 200 `PaletteRow`s with their `FileIcon`s, which run on the page's main thread for each answered keystroke (Z754: "its rows are drawn on the first frame after the worker answers"); the ruling also asked for the figures of each keystroke, and the report gives one maximum per query (the probe's output file holds them). The decision resting on it: whether Z754's bound is met. Failure scenario: a 200-row redraw over 50 ms on Axel's page passes this report unseen. Verdict: none here; the draw's time is under "Declined to judge".

## 3. Standards

- 3.1 `src/lib/state/sources/search/search.svelte.ts:485-502`: "async function askNames(token: string, signal: AbortSignal): Promise<NamesRead> { try { const response = await fetch(namesUrl(), ..." repeats `ask` (`:505-533`) line for line except the address and the reader; what is wrong: the rules file's "The principles every package is judged on" (a parser, a fold or a rule exists once and is reused). Failure scenario: a change to how the page reads a refusal of `/api/search` (a new word) is made in `ask` and missed in `askNames`, and the file mode shows the generic refusal sentence. Verdict: none.
- 3.2 `src/lib/shell/Workbench.svelte:278`: "// The editor's F1 and its Command Palette item ask for the command mode by an event."; what is wrong: F1 is freed in Monaco with a null command, which Monaco neither runs nor prevents (`abstractKeybindingService.js:240-247`), so F1 reaches the workbench key handler as a keydown; only the menu item raises `COMMAND_PALETTE_EVENT`. A comment says what the code does (rules file, "What every package obeys"). Failure scenario: a maintainer who drops the listener for the menu item believes F1 depends on it, or one who takes F1 out of `freedKeys` believes the event still serves F1. Verdict: none.
- 3.3 `docs/files-and-search.md:144`: "The rules differ from a search's in one way: hidden files and folders are listed, ..."; what is wrong: the same paragraph then lists "no size limit applies" (a search passes `--max-filesize 2M`, `query.ts:173`, and line 132 says a file over two megabytes is not opened) and the private folders left out, so the sentence is false. Failure scenario: a reader trusts "one way" and expects a 3 MB file to be missing from Cmd+P. Verdict: none.
- 3.4 `src/lib/shell/keys/PaletteRow.svelte:33`: "// matched marked, and the key of its root after it. The Command reads" (74 columns, mid-paragraph); what is wrong: the rules file's rule that an edited comment is rewrapped as a whole paragraph at 100 columns. The sentence also says the root key is drawn on every file row, while `FileRows.svelte` draws it only when more than one root holds files. Failure scenario: the next editor of the comment inherits a ragged paragraph and a claim the code does not keep. Verdict: none.
- 3.5 `D46-report.md`, "Disclosures": "I ran one read-only `git status` early on, which the launch rules forbid."; what is wrong: the rules file's "Where you work" (a builder never runs a git command). It changed nothing on the tree. Failure scenario: none on the tree. Verdict: none.
- 3.6 `D46-report.md:183`: "AssertionError: expected { value: { maxHits: 300, …(1) }, …(1) }"; what is wrong: non-ASCII in an authored file (vitest's ellipsis, quoted verbatim). Failure scenario: an ASCII scan of the ledger flags the report. Verdict: none.

## 4. Behaviour

- 4.1 `src/lib/shell/keys/rows/FileRows.svelte:65-66`: "{:else if found.length === 0} <p class=\"empty\" data-palette-files-empty>{t('app.palette.files_none')}</p>"; what is wrong: `names.rows()` is empty until the worker answers its first query, which waits behind the worker's start and the preparation of every name (403 ms over 100,000 names in the reviewer's rerun of the probe), so with a query typed the palette says "No file matches." for files that match; Z754 says nothing new is drawn for the waiting state, and the report does not state this before and after. Failure scenario: Cmd+P, type `rpls` as the names arrive: "No file matches." shows, then the rows replace it. Verdict: item 3 violated.
- 4.2 `src/lib/shell/keys/rows/FileRows.svelte:57-62`: "{#if listingOpen} {#if found.length === 0} ... files_open_none ... {/if} {:else if where.phase === 'refused'}"; what is wrong: with nothing typed, a refusal of the names request (a token refused, a failed fetch, the worker failing) is not said; item 3 says a refusal of the server is said in the palette, and `docs/window.md` says so too. Failure scenario: Cmd+P with the server refusing: the palette lists the open tabs and says nothing until a letter is typed. Verdict: none (said once a query is typed).
- 4.3 `D46-report.md`, "Host- and user-visible changes": the table does not state that a terminal's program no longer receives F1 (on every platform) nor, off macOS, Ctrl+P and Ctrl+Shift+P (readline's previous line, for one), nor that the Settings view gains a `search.max_names` row and a changed `search.timeout_s` help line. Failure scenario: the landing look and Axel read no before and after for a key a shell program loses. Verdict: none.

## Declined to judge

- Cases 3, 5 (the print dialog), 21 and 24 (the float's pane) and the page sides of 1, 2, 7, 9, 11: they need a browser or the app, which this review may not start; the landing look settles them.
- The main-thread time of drawing up to 200 rows per answer in a browser (Proof 2.3): needs a page.
- The history check's failure on the step's tree before the `FAMILIES` change: reproducing it would mean putting `F1` back into `history.test.ts`, which is breakage testing; the report's quoted lines are taken as given.
- `npm run diagrams`: not run, since it writes the diagram files; `tests/checks/diagrams` passed in the 17-file run.
- The four timeouts and the spawn-count failure in `test:quick` in files the step does not change: not the step's under the rules file, not rerun.
- The report's copy of the state file's open items at the moment it was written: that moment cannot be read back.
- One deviation of the reviewer's own: a `git init -q` was run in a scratch folder under `$TMPDIR` so that ripgrep would read the synthetic root's `.gitignore`; it touched no repository, and no other git command than `git diff 29b50632c` and `git status --short` was run on the worktree.

Reviewer usage: agent id not exposed to this session, claude-opus-5-5, tokens not known (about 300,000), 63 tool uses, about 33 minutes.
