**NOT DONE.** (1) Case 40, Step Into at line 8, is partial: oculus sends the plain DAP `stepIn` request (`session.ts:553`) and cathedra's `rite_dap` ends the program with `+ expects numbers`; the fault is the adapter's and is open item 1 of section 2. (2) What the brief routes to the look is not exercised here: I started no browser, no desktop app and no oculus server, so the DOM parts of cases 1, 2, 36, 44, 51, 52, 58, 59, 60, 61, 62, 79, 82, 84, 85, 86, 89, 90, 91 and 97, and of this round: the hovered, open and warning colours on the orange status bar, the middle and right press in the glyph margin, the console's chevron prompt and the status item's name, are read from the code and from quoted runs of the logic under them (section 12). (3) The live debug look needs `rite_dap_bin` in `config/local.yml`, which only Axel sets; I did not open that file (open item 2). (4) `tests/checks/config/integrity.test.ts` (2 tests) is red in this worktree because the hub folder `deck` is not in the worktree; no file of this step touches it (section 6). Everything else in the brief and in the ten items of round 1 is done.

## 2. Open items of the state file, verbatim

From `tools/oculus/.scratch/migration/orchestrator-state.md`, section "Open items" (read with `awk` at the time of writing):

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

1. D11, case 40 (2026-10-07): Step Into on a line that calls a function ends the program with "+ expects numbers" in cathedra's `rite_dap`, where the brief expects a pause in the callee. oculus sends the plain DAP `stepIn {threadId: 1}` (`session.ts:607`); the builder's own probe client sends the same request and gets the same end, and the reviewer places the fault in cathedra's `debugger_impl.cpp:196-215`, where StepIn arms a temporary break at the callee's first instruction. Options: (a) D11 lands sending `stepIn` as it does, and the StepIn fault is fixed in cathedra as a step of its own (a fix in another repository, with its own test there); (b) D11 lands with Step Into disabled until cathedra is fixed, which removes a working control from every other line; (c) D11 lands as it is and the fault is left. Recommended: (a). The lazy option is (c). It is yours because the fix is in cathedra's code, outside oculus.
2. D11's live look (2026-10-07): the debugger can be looked at on TEST only with `rite_dap_bin` set in `config/local.yml` to `~/workspace/cathedra/bin/debug/rite_dap`, since `rite_dap` is not on PATH (Z447). No agent opens that file. Without it the look sees only the idle Debug view and a launch ending in "rite_dap could not be started". Needed before D11's landing look.
```

## 3. The ten items of round 1: what changed for each finding of the review

The review is `agents/reviews/D11-refuter.md`. Each line names the finding and what changed for it, with file and line as read after the last change (`grep -n` and `wc -l` in section 6).

- Spec 1 and Proof 1, item 1. `session.ts` was 726 lines against the brief's 700 and is 672. The reads of a pause (the stack with its frames, the scopes with their variables, one evaluation, the watch list) moved into the new `src/lib/server/machine/debug/inspect.ts` (88 lines). Its functions ask the adapter through a `Link` that `DebugClient.#link` (`session.ts:467`) hands them: `ask`, `read` (a body through a zod shape, ending the session when it does not read) and `reported` (a frame's path as the page named it). `THREAD` moved to `wire.ts:27` because both files use it. The folder `server/machine/debug` holds 8 items. No line of `session.ts` was shortened to reach the count. The size row of section 6 checks every limit the brief names per file.
- Spec 2, item 2. `StatusBar.svelte:103` is now `debug.payload().session?.name ?? t('debug.default_name')`: the item names the configuration that last ran, which the server holds in the session (a launch of the open file is named by the server's `default_name` sentence, `routes.ts:180`). The menu of the item still lists the repository's configurations (`StatusBar.svelte:91-100`).
- Spec 3, item 3. The approval write failure keeps 409 (`routes.ts:232`), as the approve answer of `/api/commands` does (`runs/commands/routes.ts:105`), because a failed write of the approvals file is no refusal of the request. The head comment of `routes.ts` (lines 15-18) now says so: every refusal of the request is a 400 `{ error }`, and the failed write answers 409.
- Spec 5, item 4. The response shape lists `command` (`wire.ts:55`, `command: z.string()`), as the brief's section 3 does. The adapter sets it on every response (`cathedra/src/rite/src/tools/debug_dap.cpp:95`, read), and the real-adapter runs of section 4 and block S3 pass through it.
- Proof 2, item 5. Case 76 paused is run with the real adapter in section 4, case 6: `frame` and `evaluate` with the id 99 while paused answer 400 "No frame 99 in this pause" and write nothing to the adapter (0 writes to its standard input; the listed frame writes 6).
- Standards 2, item 6. The prompt of a console input row is drawn by `<Glyph name="chevron" />` in a `.prompt` box (`Console.svelte:184`, style at `:252`) in place of `content: '> '`. The catalog already holds `chevron` (`config/catalogs/glyphs.yml:41`, ASCII `>`, and `config/catalogs/icons.yml:40`, icon `chevron-right`), so no entry is added. oculus's `glyphs.yml` has no `dummy/` twin: `find` over the worktree for a file of that name prints only `tools/oculus/config/catalogs/glyphs.yml`, so there is nothing to keep identical.
- Behaviour 1, item 7. `themes/derive.ts:231` derives `--c-orange-hover` (the orange moved a quarter of the way toward the colour opposite the bar's ink; `ORANGE_HOVER_SHARE` at `:70`). While `.bar.debugging` holds, `StatusBar.svelte:288-295` sets `--status-hover: var(--c-orange-hover)`, `--status-warning: var(--on-c-orange)` and `--status-warning-weight: 600`, and the status `ToolButton` reads them (`ToolButton.svelte:238` for the fill under a hovered or open item, `:242-243` for the ink and weight of a warning item; the defaults are `--chip` and `--c-amber-txt`, so every other surface is as it was). The bar hands custom properties to the primitive as it hands `--glyph-size`, since a shell component may not style a primitive's own class. The ratio of every text on the bar in each of 17 themes, before and after, is in section 4, case 5: the least is 4.61 (the ink on the bar in the solarized theme) and 7.22 on the hover fill. The pair `--on-c-orange` on `--c-orange-hover` joined the table of `tests/checks/look/contrast.test.ts:71` (G26).
- Behaviour 2, item 8. `pressInGutter` takes the Monaco mouse event and runs `onglyph` only when `event.event.leftButton` holds (`editor-gutter.ts:83`, `:93`, call at `:159`). The mark and blame presses keep what they do. `docs/debugging.md:41` says "a left press in the editor's glyph margin" and "A middle or right press in the margin does nothing". The run is section 4, case 3.
- Behaviour 3, item 9. `targetNow` refuses a `.rite` file under neither a served root nor a repository before it asks anything: `debug.svelte.ts:346-349` says `debug.frame_unserved` ("<path> is under no root the file browser serves, so it cannot be debugged") and returns, whatever repository was watched before. The run is section 4, case 4, with the repository watched before and with a fixed-program configuration.
- Spec 4, item 10. Nothing changed in oculus: `resume` sends `stepIn {threadId: 1}` (`session.ts:553`). Case 40 is partial and the adapter's output is quoted in section 4, case 7. It is open item 1 of section 2; its text cites `session.ts:607`, which is now line 553.
- Standards 1. The line on the one read-only `git status` of round 0 stays in the report below, since it states what happened; it changes nothing in the tree. Round 1 ran no git command.

Declined to judge, in the review: the DOM parts (section 12), `integrity.test.ts` (section 6), the paths outside the write list (section 8 gives the reason for each), and the edits to existing tests (section 15).

## 4. The cases of round 1, run first on the round-0 tree and then after the change

The round-0 tree is `d11r1/r0`, a copy of the worktree's `tools/oculus` taken before the first edit of this round (`node_modules` linked to the worktree's); the tree after is `d11r1/new`, a copy of the worktree taken after the last edit, re-synced by `d11r1/sync.sh` before each run. The same files run in both: `d11r1/cases/r1.test.ts` (the store with the real server and the real `rite_dap`, built from the earlier `c-store.test.ts` world), `r1b.test.ts` (the gutter and the contrast) and `d11r1/c40.mts`. Each case prints its own lines, `CASE_OUT` names the output file, and the lines below are the files as printed.

Case 1, `wc -l src/lib/server/machine/debug/session.ts`, round-0 tree then worktree:
```
--- round 0 tree
     726 /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/d11r1/r0/src/lib/server/machine/debug/session.ts
--- after
     672 /Users/axelfaes/workspace/research-hub/.agents/worktrees/D11/tools/oculus/src/lib/server/machine/debug/session.ts
```

Case 2, a launch of `a` then a pick of `b` without starting it, via the real server and the store. The two values of the store are the same on both trees; what differs is which of them the item reads, printed under each run (`debugChosen?.name ?? session.name` on the round-0 tree, `session.name` after), so the item names "b" on the round-0 tree and "a" after. The drawn item is a DOM part (section 12):
```
--- round 0 tree
case 2 run a, session name: a
case 2 picked b without starting it: {"chosenName":"b","sessionName":"a","chosenBeforePick":"a","posts":["launch","approve","launch"]}
$ sed -n 102,104p src/lib/shell/status/StatusBar.svelte
    const debugName = $derived(
        debugChosen?.name ?? debug.payload().session?.name ?? t('debug.default_name')
    );
--- after
case 2 run a, session name: a
case 2 picked b without starting it: {"chosenName":"b","sessionName":"a","chosenBeforePick":"a","posts":["launch","approve","launch"]}
$ sed -n 103p src/lib/shell/status/StatusBar.svelte
    const debugName = $derived(debug.payload().session?.name ?? t('debug.default_name'));
```

Case 3, a left, a middle and a right press in the glyph margin and on a blamed line number, by `followGutter` with a recording stand-in for the editor (`pressInGutter` is not exported):
```
--- round 0 tree
case 3 glyph margin, left press: {"onglyph":1}
case 3 glyph margin, middle press: {"onglyph":1}
case 3 glyph margin, right press: {"onglyph":1}
case 3 blamed line number, left press: {"onblame":1}
case 3 blamed line number, middle press: {"onblame":1}
case 3 blamed line number, right press: {"onblame":1}
--- after
case 3 glyph margin, left press: {"onglyph":1}
case 3 glyph margin, middle press: {"onglyph":0}
case 3 glyph margin, right press: {"onglyph":0}
case 3 blamed line number, left press: {"onblame":1}
case 3 blamed line number, middle press: {"onblame":1}
case 3 blamed line number, right press: {"onblame":1}
```

Case 4, F5 on a `.rite` file outside every served root (`b.rite` in a scratch folder), through the store and the real server, with the repository `a` watched before, with none watched, and with a configuration of a fixed program; then the two controls inside the root:
```
--- round 0 tree
case 75 repository watched before: {"lastRepoWatched":true}
case 75 F5 on a .rite file outside every root, a repository watched before: {"started":false,"notices":["<outside>/b.rite is under no root the file browser serves, so it cannot be debugged"],"posts":["launch"],"asking":null,"spawns":0}
case 75 repository watched before, second world: {"lastRepoWatched":false}
case 75 same, no repository watched: {"started":false,"notices":["Open a .rite file to debug"],"posts":[],"spawns":0}
case 75 same, the repository watched before has a configuration with a fixed program: {"started":false,"notices":[],"posts":["launch"],"asking":{"kind":"launch","program":"a.rite"}}
case 75 control: a .md tab inside the root: {"started":false,"notices":["Open a .rite file to debug"],"posts":[]}
case 75 control: a .rite tab inside the root: {"started":false,"asking":"launch","posts":["launch"]}
--- after
case 75 repository watched before: {"lastRepoWatched":true}
case 75 F5 on a .rite file outside every root, a repository watched before: {"started":false,"notices":["<outside>/b.rite is under no root the file browser serves, so it cannot be debugged"],"posts":[],"asking":null,"spawns":0}
case 75 repository watched before, second world: {"lastRepoWatched":false}
case 75 same, no repository watched: {"started":false,"notices":["<outside>/b.rite is under no root the file browser serves, so it cannot be debugged"],"posts":[],"spawns":0}
case 75 same, the repository watched before has a configuration with a fixed program: {"started":false,"notices":["<outside>/b.rite is under no root the file browser serves, so it cannot be debugged"],"posts":[],"asking":null}
case 75 control: a .md tab inside the root: {"started":false,"notices":["Open a .rite file to debug"],"posts":[]}
case 75 control: a .rite tab inside the root: {"started":false,"asking":"launch","posts":["launch"]}
```

Case 5, the ink and the fills on the orange bar, per theme, computed with `ratio` of `themes/derive.ts` over `themeTokens(name)` for all 17 themes. The round-0 tree paints a hovered or open item with `--chip` and a warning item with `--c-amber-txt`; after, with `--c-orange-hover` and `--on-c-orange`. An item that is disabled (the unsaved-tabs item with no unsaved tab) is drawn at half opacity as every disabled control is, which WCAG 1.4.3 exempts, so no ratio is computed for it:
```
--- round 0 tree
case 5 light               : orange #ea580c ink #000000: ink on bar 5.90 | hover/open fill --chip #f1f5f9: ink on it 19.17 | warning ink --c-amber-txt #b45309 on bar 1.41
case 5 dark                : orange #ea580c ink #000000: ink on bar 5.90 | hover/open fill --chip #1b2638: ink on it 1.38 | warning ink --c-amber-txt #f37311 on bar 1.23
case 5 vscode-dark-modern  : orange #ea580c ink #000000: ink on bar 5.90 | hover/open fill --chip #262626: ink on it 1.39 | warning ink --c-amber-txt #f37311 on bar 1.23
case 5 vscode-light-modern : orange #ea580c ink #000000: ink on bar 5.90 | hover/open fill --chip #f3f3f3: ink on it 18.93 | warning ink --c-amber-txt #b45309 on bar 1.41
case 5 mocha               : orange #fab387 ink #000000: ink on bar 11.86 | hover/open fill --chip #292c3c: ink on it 1.52 | warning ink --c-amber-txt #fab387 on bar 1.00
case 5 gruvbox             : orange #fe8019 ink #000000: ink on bar 8.32 | hover/open fill --chip #32302f: ink on it 1.60 | warning ink --c-amber-txt #fabd2f on bar 1.49
case 5 nord                : orange #d08770 ink #000000: ink on bar 7.38 | hover/open fill --chip #434c5e: ink on it 2.43 | warning ink --c-amber-txt #ebcb8b on bar 1.82
case 5 synthwave           : orange #ff8b39 ink #000000: ink on bar 9.00 | hover/open fill --chip #34294f: ink on it 1.58 | warning ink --c-amber-txt #ffcc99 on bar 1.59
case 5 tokyoneon           : orange #ff966c ink #000000: ink on bar 9.83 | hover/open fill --chip #1c1d2b: ink on it 1.26 | warning ink --c-amber-txt #ffc777 on bar 1.39
case 5 tokyonight          : orange #ff9e64 ink #000000: ink on bar 10.33 | hover/open fill --chip #20222f: ink on it 1.33 | warning ink --c-amber-txt #e0af68 on bar 1.02
case 5 rosepine            : orange #ebbcba ink #000000: ink on bar 12.43 | hover/open fill --chip #232135: ink on it 1.34 | warning ink --c-amber-txt #f6c177 on bar 1.03
case 5 everforest          : orange #e69875 ink #000000: ink on bar 9.11 | hover/open fill --chip #343f44: ink on it 1.94 | warning ink --c-amber-txt #dbbc7f on bar 1.26
case 5 dracula             : orange #ffb86c ink #000000: ink on bar 12.32 | hover/open fill --chip #343746: ink on it 1.78 | warning ink --c-amber-txt #ffb86c on bar 1.00
case 5 kanagawa            : orange #ffa066 ink #000000: ink on bar 10.47 | hover/open fill --chip #31313f: ink on it 1.64 | warning ink --c-amber-txt #dca561 on bar 1.09
case 5 solarized           : orange #cb4b16 ink #ffffff: ink on bar 4.61 | hover/open fill --chip #0a3f4c: ink on it 11.49 | warning ink --c-amber-txt #d3a000 on bar 1.93
case 5 latte               : orange #fe640b ink #000000: ink on bar 7.04 | hover/open fill --chip #e6e9ef: ink on it 17.27 | warning ink --c-amber-txt #8d5a12 on bar 1.95
case 5 gruvboxlight        : orange #af3a03 ink #ffffff: ink on bar 6.12 | hover/open fill --chip #f2e5bc: ink on it 1.26 | warning ink --c-amber-txt #87580e on bar 1.00
case 5 least over 17 themes: {"inkOnBar":"4.61","inkOnHoverOrOpenFill":"1.26","warningInkOnBar":"1.00"}
--- after
case 5 light               : orange #ea580c ink #000000: ink on bar 5.90 | hover/open fill --c-orange-hover #ef8148: ink on it 7.90 | warning ink --on-c-orange #000000 on bar 5.90
case 5 dark                : orange #ea580c ink #000000: ink on bar 5.90 | hover/open fill --c-orange-hover #ef8148: ink on it 7.90 | warning ink --on-c-orange #000000 on bar 5.90
case 5 vscode-dark-modern  : orange #ea580c ink #000000: ink on bar 5.90 | hover/open fill --c-orange-hover #ef8148: ink on it 7.90 | warning ink --on-c-orange #000000 on bar 5.90
case 5 vscode-light-modern : orange #ea580c ink #000000: ink on bar 5.90 | hover/open fill --c-orange-hover #ef8148: ink on it 7.90 | warning ink --on-c-orange #000000 on bar 5.90
case 5 mocha               : orange #fab387 ink #000000: ink on bar 11.86 | hover/open fill --c-orange-hover #fbc6a5: ink on it 13.72 | warning ink --on-c-orange #000000 on bar 11.86
case 5 gruvbox             : orange #fe8019 ink #000000: ink on bar 8.32 | hover/open fill --c-orange-hover #fe9f52: ink on it 10.30 | warning ink --on-c-orange #000000 on bar 8.32
case 5 nord                : orange #d08770 ink #000000: ink on bar 7.38 | hover/open fill --c-orange-hover #dba593: ink on it 9.82 | warning ink --on-c-orange #000000 on bar 7.38
case 5 synthwave           : orange #ff8b39 ink #000000: ink on bar 9.00 | hover/open fill --c-orange-hover #ffa86a: ink on it 11.06 | warning ink --on-c-orange #000000 on bar 9.00
case 5 tokyoneon           : orange #ff966c ink #000000: ink on bar 9.83 | hover/open fill --c-orange-hover #ffb090: ink on it 11.86 | warning ink --on-c-orange #000000 on bar 9.83
case 5 tokyonight          : orange #ff9e64 ink #000000: ink on bar 10.33 | hover/open fill --c-orange-hover #ffb68a: ink on it 12.31 | warning ink --on-c-orange #000000 on bar 10.33
case 5 rosepine            : orange #ebbcba ink #000000: ink on bar 12.43 | hover/open fill --c-orange-hover #f0cccb: ink on it 14.20 | warning ink --on-c-orange #000000 on bar 12.43
case 5 everforest          : orange #e69875 ink #000000: ink on bar 9.11 | hover/open fill --c-orange-hover #ecb197: ink on it 11.30 | warning ink --on-c-orange #000000 on bar 9.11
case 5 dracula             : orange #ffb86c ink #000000: ink on bar 12.32 | hover/open fill --c-orange-hover #ffc990: ink on it 14.01 | warning ink --on-c-orange #000000 on bar 12.32
case 5 kanagawa            : orange #ffa066 ink #000000: ink on bar 10.47 | hover/open fill --c-orange-hover #ffb78c: ink on it 12.40 | warning ink --on-c-orange #000000 on bar 10.47
case 5 solarized           : orange #cb4b16 ink #ffffff: ink on bar 4.61 | hover/open fill --c-orange-hover #983810: ink on it 7.22 | warning ink --on-c-orange #ffffff on bar 4.61
case 5 latte               : orange #fe640b ink #000000: ink on bar 7.04 | hover/open fill --c-orange-hover #fe8a48: ink on it 8.94 | warning ink --on-c-orange #000000 on bar 7.04
case 5 gruvboxlight        : orange #af3a03 ink #ffffff: ink on bar 6.12 | hover/open fill --c-orange-hover #832b02: ink on it 9.09 | warning ink --on-c-orange #ffffff on bar 6.12
case 5 least over 17 themes: {"inkOnBar":"4.61","inkOnHoverOrOpenFill":"7.22","warningInkOnBar":"4.61"}
```

The contrast test with the pair added (`tests/checks/look/contrast.test.ts:71`), on the round-0 tree (the new file copied there as `contrast-new.test.ts`) and after:
```
--- round 0 tree
TypeError: Cannot read properties of undefined (reading 'r')
 > measure tests/checks/look/contrast-new.test.ts:49:37
 > pairs tests/checks/look/contrast-new.test.ts:71:5
 > tests/checks/look/contrast-new.test.ts:75:53
 > tests/checks/look/contrast-new.test.ts:75:32
 Test Files  1 failed (1)
      Tests  no tests
--- after
 Test Files  1 passed (1)
      Tests  23 passed (23)
```

Case 6, case 76 paused, with the real adapter: a launch with a breakpoint at line 8 of `a.rite`, then `frame` and `evaluate` with the id 99 through the route. The adapter's standard input is wrapped to count its writes. The round-0 tree and after run the same code on this path, and both are shown:
```
--- round 0 tree
case 76 launch asks: ["approve"]
case 76 launch: {"status":200,"body":{"ok":true}}
case 76 paused: {"status":"paused","frames":["1:(script)@8"],"selected":1}
case 76 frame 99 while paused: {"status":400,"body":{"error":"No frame 99 in this pause"}}
case 76 evaluate in frame 99 while paused: {"status":400,"body":{"error":"No frame 99 in this pause"}}
case 76 requests written to the adapter by those two: 0
case 76 control: the listed frame 1: {"answer":{"status":200,"body":{"ok":true}},"requestsWritten":6}
--- after
case 76 launch asks: ["approve"]
case 76 launch: {"status":200,"body":{"ok":true}}
case 76 paused: {"status":"paused","frames":["1:(script)@8"],"selected":1}
case 76 frame 99 while paused: {"status":400,"body":{"error":"No frame 99 in this pause"}}
case 76 evaluate in frame 99 while paused: {"status":400,"body":{"error":"No frame 99 in this pause"}}
case 76 requests written to the adapter by those two: 0
case 76 control: the listed frame 1: {"answer":{"status":200,"body":{"ok":true}},"requestsWritten":6}
```

Case 7, case 40 (item 10), Step Into at line 8 with the real adapter, round-0 tree then after (`d11r1/c40.mts`):
```
--- round 0 tree
case 40 paused at (script)@8
case 40 step into at line 8, statuses: starting: > running: > paused:breakpoint > running: > ended:
case 40 console: ["stderr: rite_dap: <repo>/a.rite: + expects numbers","console: The debug session ended"]
case 40 ended: The debug session ended
c40 exit 0
--- after
case 40 paused at (script)@8
case 40 step into at line 8, statuses: starting: > running: > paused:breakpoint > running: > ended:
case 40 console: ["stderr: rite_dap: <repo>/a.rite: + expects numbers","console: The debug session ended"]
case 40 ended: The debug session ended
c40 exit 0
```

Cases 1 to 100 of round 0 run again on the tree after this round (`d11r1/cases/a-server.test.ts`, `c-store.test.ts`, `e-config.test.ts`, the same files that produced block S1 and S4; their output lines sorted, since the files run in parallel) and diffed against the same files run on the round-0 tree:
```
--- round-0 tree
+++ after
@@ -4 +4 @@
-case 1 after Approve and Debug: {"status":"running","spawn":[["/Users/axelfaes/workspace/cathedra/bin/debug/rite_dap","<repo>/a.rite"]],"consoleViewOpened":true}
+case 1 after Approve and Debug: {"status":"ended","spawn":[["/Users/axelfaes/workspace/cathedra/bin/debug/rite_dap","<repo>/a.rite"]],"consoleViewOpened":true}
@@ -123 +123 @@
-case 93 stop: {"kind":"stop","process":"rite_dap <repo>/a.rite (pid 44558)"}
+case 93 stop: {"kind":"stop","process":"rite_dap <repo>/a.rite (pid 45804)"}
@@ -126 +126 @@
-case 94 before the move: {"status":"paused","adapters":1,"port":62757}
+case 94 before the move: {"status":"paused","adapters":1,"port":62765}
lines in each output: 131 and 131
```

Normalised for temporary folder names, ports and the digests that hash a folder name, the only line that differs by content is `case 1 after Approve and Debug`, whose `status` reads `running` or `ended` according to how soon the adapter finishes a three-line program; the other two differ by a process id and a port number. Blocks S2 and S3 below are the outputs of `quoted/b1.mts` and `quoted/b2.mts` run on the tree after this round; their diff against the round-0 outputs (process ids and temporary folder names normalised) prints nothing:
```
$ diff <round-0 outputs> <outputs after round 1>
(no output)
```

## 5. The first run of every case 1 to 100, on the unchanged tree

The unchanged tree is `.agents/worktrees/D11-base/tools/oculus` (and its copy with a linked `node_modules` under the scratch folder, `d11b/basetree`, for the runs that execute code). Every block below is the output of the command written above it, run on that tree. The runs of blocks B to H are scratch scripts in `d11b/first/` (`run1.mts`, `run23.mts`, `run31.mts`, `run63.mts`, `run79.mts`, `run65.mts`, `run92.mts`) run with `node --experimental-strip-types`.

Block A (`sh d11b/first/facts.sh <base>`):
```

== absent files (cases 1-4, 17-22, 24-30, 32-62, 66-69, 71, 75, 76, 79-98)
$ ls src/lib/server/machine/debug
ls: src/lib/server/machine/debug: No such file or directory
$ ls src/lib/state/system/machine/debug
ls: src/lib/state/system/machine/debug: No such file or directory
$ ls src/lib/views/system/machine/debug
ls: src/lib/views/system/machine/debug: No such file or directory
$ ls src/lib/shell/commands/DebugAsk.svelte
ls: src/lib/shell/commands/DebugAsk.svelte: No such file or directory
$ ls src/routes/api/(machine)/debug
ls: src/routes/api/(machine)/debug: No such file or directory
$ ls config/text/views/system/machine/debug.yml
ls: config/text/views/system/machine/debug.yml: No such file or directory
$ ls tests/routes/machine/debug.test.ts
ls: tests/routes/machine/debug.test.ts: No such file or directory
$ ls tests/server/machine/debug
ls: tests/server/machine/debug: No such file or directory

== grep for rite_dap, launch.yml, debug-console, oculus.debug in src tests config

== grep for 'debug' in src tests config (case 63)
src/lib/server/machine/lsp/clangd/databases.ts:75:        if (a.name === 'debug') return -1;
src/lib/server/machine/lsp/clangd/databases.ts:76:        if (b.name === 'debug') return 1;
tests/routes/docs/literature.test.ts:82:    for (const name of ['log', 'warn', 'error', 'info', 'debug'] as const) {

== channels line of DESIGN.md (case 64)
121:**The socket.** One WebSocket per open page. Messages are `{channel, version, payload}`. Channels: `portfolio`, `config`, `sessions`, `git`, `files`, `hpc`, `calendar`, `inbox`, `usage`, `feeds`, `audit`, `processes`, `schedule`, `apps`, `jump`, later `pty:<id>` and `lsp:<language>`. A page subscribes to the channels it need

== debug keys in the key resolver (cases 58 to 62, 91)
(end)

== rite_dap_bin and riteDapBin (cases 30-32, 88)
(end)

== breakpoint code in the editor gutter (cases 51, 58-60, 89)
src/lib/ui/controls/editor/gutter/editor-gutter.ts
src/lib/ui/controls/editor/gutter/gutter.ts
src/lib/ui/controls/editor/gutter/marks.css
src/lib/ui/controls/editor/Editor.svelte
(end)

== desktop menu accelerators (case 99)
4:// register their accelerators, so Cmd+Z, Cmd+C and the others reach the page, where Monaco and the
31:                    accelerator: 'Cmd+,',
47:                    accelerator: 'Cmd+Shift+N',
52:                    accelerator: 'Cmd+Shift+W',
76:                { role: 'reload', label: t('desktop.menu.reload'), accelerator: 'Cmd+R' },
80:                    accelerator: 'Ctrl+Cmd+F'
85:                    accelerator: 'Cmd+=',
90:                    accelerator: 'Cmd+-',
95:                    accelerator: 'Cmd+0',
102:                    accelerator: 'Alt+Cmd+I'
```

Block A2 (commands run on the base, `d11b/first/facts2.out`):
```
$ grep -n afterPress src/lib/state/sessions/terminal/commands.svelte.ts
(exit 1)
$ grep -n debug src/lib/server/root/context.ts
(exit 1)
$ sed -n 38,50p src/lib/ui/controls/editor/gutter/marks.css
.editor[data-editor-host] .monaco-editor .oculus-breakpoint {
    cursor: pointer;
}

.editor[data-editor-host] .monaco-editor .oculus-breakpoint::before {
    content: '';
    display: block;
    width: 10px;
    height: 10px;
    margin: 4px auto 0;
    border-radius: 50%;
    background: var(--c-red);
}
$ grep -n "onDidChange\|getDecorationRange\|getModelDecorations" src/lib/ui/controls/editor/gutter/editor-gutter.ts
(exit 1)
$ grep -n "rite" src/lib/views/sources/source/language/extension.ts
(exit 1)
$ grep -n followKey src/lib/state/workbench/ui.svelte.ts
24:import { followKey } from '../shared/stores/storage-events.ts';
418:            source === undefined ? () => undefined : followKey(source, UI_KEY, takeSavedInstances);
$ grep -n "export function repositoryOf" src/lib/server/machine/runs/commands/repo.ts
11:export function repositoryOf(
$ grep -n "not a key" src/lib/server/machine/runs/commands/files.ts
(exit 1)
$ grep -n "F[0-9]" src/lib/shell/keys/keys.ts
$ grep -rn "'F[0-9]" src
src/lib/ui/controls/editor/chords.ts:43:    { id: 'editor.action.revealDefinitionAside', keys: [CMD_K, { code: 'F12' }] },
src/lib/ui/controls/editor/chords.ts:65:    { id: 'togglePeekWidgetFocus', keys: [CMD_K, { code: 'F2' }] }
src/lib/ui/controls/editor/gutter/gutter.ts:115:const NEXT_CHANGE: KeyPress = { code: 'F5', alt: true };
src/lib/ui/controls/editor/gutter/gutter.ts:116:const PREVIOUS_CHANGE: KeyPress = { code: 'F5', alt: true, shift: true };
src/lib/ui/menu/ContextMenu.svelte:112:        if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) return;
src/lib/state/sources/explorer/acts/keys.ts:42:    { code: 'F2', action: 'rename' },
src/lib/views/sessions/terminal/terminal-list.ts:245:        if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) return;
src/lib/views/sources/source/language/lsp.ts:101:    references: { code: 'F12', shift: true, alt: true },
src/lib/views/sources/source/language/lsp.ts:104:    next: { code: 'F4' },
src/lib/views/sources/source/language/lsp.ts:105:    previous: { code: 'F4', shift: true }
src/lib/views/sources/repositories/diff/Diff.svelte:274:        if (event.key !== 'F5' || !event.altKey) return;
(exit 0)
```

Block B (`readCommandsFile` on a scratch repository holding the bad entries, `first/run1.mts`):
```
["run","unk"]
commands[0].cwd | must be a folder inside the repository, not an absolute path
commands[1].cwd | must be a folder inside the repository, not one above it
commands[2].cwd | must be a folder of the repository that exists
commands[3].cwd | must be a folder of the repository that exists
commands[4].name | must not be empty
commands[5].name | must not be empty
commands[6].name | must not hold a tab, a line break or any control character
commands[8].name | repeats a name of this list, so it is left out
commands[9].name | must be text
commands[10].run | must be text
commands[11].cwd | must be text
commands[12] | must be a map of the fields
commands[14].cwd | is a link that leads out of the repository

```

Block C (`chainText` and its hash, `first/run23.mts`), block D (`readLocalText` and `checkLocal`, `first/run31.mts`), block E (`collectionKeys`, `first/run63.mts`):
```
=== run23
{
 "repo": "/r",
 "chain": [
  [
   "utils",
   "utils/benchmark/fib.rite"
  ]
 ]
} 9b6e548b820629836c371e78a574684d90b8d104243ed3ea10c4ab0bd5cfb66f
debug text builder at the base: undefined
=== run31
"rite_dap_bin: ''" checkLocal= null problems= [] unknown= ["rite_dap_bin"] riteDapBin= undefined
"rite_dap_bin: 5" checkLocal= null problems= [] unknown= ["rite_dap_bin"] riteDapBin= undefined
=== run63
collectionKeys with debug = ["debug","papers"]
```

Block F (the create op of the base, `first/run79.mts`):
```
addrepo create -> {"ok":true,"path":".oculus/launch.yml"}
addrepo .oculus holds ["launch.yml"]
addrepo again -> {"ok":false,"error":"exists"}
addrepo2 create -> {"ok":true,"path":".oculus/launch.yml"}
addrepo2 .oculus holds ["launch.yml","project.yml"]
addrepo2 again -> {"ok":false,"error":"exists"}
```

Block G (`first/run65.mts`) and block H (`first/run92.mts`):
```
base loadConfig keys ["config","findings"] findings 0 definedTwice false
base approveTexts on a file that is not JSON -> {"ok":false,"error":"approvals.json is not JSON: <scratch>/approvals.json"} bytes unchanged true
```

The four kept tests on the unchanged tree (`npx vitest run` of the three files, in `d11b/basetree`, whose `src` equals the base; vitest's glyphs shown as ASCII):
```

 RUN  v4.1.11 /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/d11b/basetree

 > |unit| tests/server/machine/debug/session.test.ts (0 test)
 > |unit| tests/routes/machine/debug.test.ts (0 test)
 > |unit| tests/data/sources/config/local.test.ts (25 tests | 2 failed) 31ms
     x answers "rite_dap_bin: ''" with the sentence it would throw 3ms
     x answers "rite_dap_bin: 5" with the sentence it would throw 0ms

------ Failed Suites 2 -------

 FAIL  |unit| tests/routes/machine/debug.test.ts [ tests/routes/machine/debug.test.ts ]
Error: Cannot find module '../../../src/lib/server/machine/debug/routes.ts' imported from /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/d11b/basetree/tests/routes/machine/debug.test.ts
 > tests/routes/machine/debug.test.ts:18:1
     16| import { fsWrites } from '../../../src/lib/server/core/json.ts';
     17| import { defaultApprovalsPath } from '../../../src/lib/server/machine/...
     18| import {
       | ^
     19|     handleDebugPost,
     20|     type DebugRouteOptions

------------------------[1/4]-

 FAIL  |unit| tests/server/machine/debug/session.test.ts [ tests/server/machine/debug/session.test.ts ]
Error: Cannot find module '../../../../src/lib/server/machine/debug/session.ts' imported from /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/d11b/basetree/tests/server/machine/debug/session.test.ts
 > tests/server/machine/debug/session.test.ts:15:1
     13| import { engineDir, loadConfig, textCatalog } from '../../../../src/li...
     14| import { Hub } from '../../../../src/lib/server/core/channels.ts';
     15| import { DebugClient } from '../../../../src/lib/server/machine/debug/...
       | ^
     16|
     17| /** A child whose streams are in memory. */

------------------------[2/4]-


------- Failed Tests 2 -------

 FAIL  |unit| tests/data/sources/config/local.test.ts > checkLocal > answers "rite_dap_bin: ''" with the sentence it would throw
 FAIL  |unit| tests/data/sources/config/local.test.ts > checkLocal > answers "rite_dap_bin: 5" with the sentence it would throw
AssertionError: expected null to be 'local.yml: rite_dap_bin must be a non...' // Object.is equality

- Expected:
"local.yml: rite_dap_bin must be a non-empty string"

+ Received:
null

 > tests/data/sources/config/local.test.ts:92:32
     90|         ["literature: { mailto: '' }", 'local.yml: literature.mailto m...
     91|     ])('answers %j with the sentence it would throw', (text, expected)...
     92|         expect(sentence(text)).toBe(expected);
       |                                ^
     93|     });
     94| });

------------------------[3/4]-


 Test Files  3 failed (3)
      Tests  2 failed | 23 passed (25)
   Start at  17:08:28
   Duration  1.09s (transform 483ms, setup 0ms, import 940ms, tests 31ms, environment 1ms)
```

Per case (the block named is the command and output that checked it):

1. Block A: no `debug` folder, no DebugAsk.svelte, no `/api/debug` route, no `launch.yml` or `rite_dap` string in `src` or `config`: F5 and the question do not exist.
2. Block A: no plain F5 anywhere in `src` (block A2 F-key grep prints Alt+F5 in Diff.svelte:274 and Shift+F10 in two menus), no debug store: nothing posts the notice.
3. Block A: no launch reader, no `debug` store: the chain of `before` then launch does not exist; the commands store alone exists.
4. Block A: no session module, so no argv and no cwd to read; `ls src/lib/server/machine/debug` fails.
5. Block B: no launch reader (block A). The commands reader that the launch reader reuses answers the same classes with the findings of block B (cwd and name classes); the `program` class has no reader at the base.
6. Block A: no `program` rule at the base; the commands reader has no `program` field (block B).
7. Block A: as 6.
8. Block A: as 6.
9. Block B: block B line `commands[14].cwd | is a link that leads out of the repository` is the class the launch reader gives `program`; no `program` reader at the base.
10. Block B: block B prints the four `cwd` findings for commands: `must be a folder inside the repository, not an absolute path`, `not one above it`, `must be a folder of the repository that exists` (two), `is a link that leads out of the repository`.
11. Block B: block B prints `must not be empty` twice and `must not hold a tab, a line break or any control character` for commands.
12. Block B: block B prints `commands[8].name | repeats a name of this list, so it is left out` and lists `["run","unk"]`.
13. Block A: no launch reader; the commands reader at the base has no unknown-key rule (`grep -n "not a key" runs/commands/files.ts` prints nothing, block A2), so the finding is the launch reader's own.
14. Block A: no launch reader, so no `program` placeholder rule; `placeholders.ts` has `NAMES` only for commands.
15. Block A: no launch reader; the commands reader's three whole-file findings are read by the same `readListFile` after the change.
16. Block A: no launch reader and no F5.
17. Block A: no `/api/debug`; `grep -n refused_no_file config/text/views/sessions/terminal.yml` on the base prints `52:        refused_no_file: 'No value for {0}: open a file in a source tab first.'`.
18. Block A: no route, so no refusal naming `<dir>/main.rite`.
19. Block A: no route, so no refusal for a file under no served root.
20. Block A: no spawn site for an adapter; `grep -rn rite_dap src config` prints nothing (block A).
21. Block C: block C: `debug text builder at the base: undefined`, so no launch text can be approved or asked again.
22. Block C: block C: no debug text builder at the base.
23. Block C: block C prints the chain text and its hash `9b6e548b820629836c371e78a574684d90b8d104243ed3ea10c4ab0bd5cfb66f` and `debug text builder at the base: undefined`.
24. Block C: no launch question and no debug text builder (block C), so nothing to cancel.
25. Block A: no store and no `before` for a launch.
26. Block A: as 25.
27. Block A: as 25.
28. Block A: as 25.
29. Block A: as 25; the commands store has no `afterPress` (block A2: `grep -n afterPress` prints nothing, exit 1), so no store hears a press end.
30. Block A: no `rite_dap_bin` key and no spawn site (block A).
31. Block D: block D: `checkLocal` answers null for both texts, `unknown= ["rite_dap_bin"]`, `riteDapBin= undefined`; the two G13 rows fail on the unchanged tree (see the kept tests).
32. Block A: no spawn site.
33. Block A: no wire module.
34. Block A: no session module.
35. Block A: no session module.
36. Block A: no session, no Debug view, no execution-line decoration: `grep -rln breakpoint src` prints four editor files only (block A) and none draws a paused line.
37. Block A: as 36.
38. Block A: as 36; the base draws one red dot per breakpoint and no unverified style (block A2 prints `marks.css:38-50`).
39. Block A: no function breakpoints.
40. Block A: no stepping.
41. Block A: no `finishFrame` call.
42. Block A: no session.
43. Block A: no console.
44. Block A: no hover extension for rite (block A2: `grep -n rite language/extension.ts` prints nothing, exit 1).
45. Block A: no watch.
46. Block A: no stop.
47. Block A: no stop.
48. Block A: no restart.
49. Block A: no launch.
50. Block A: no session.
51. Block A: no breakpoints route.
52. Block A: no session.
53. Block A: no console.
54. Block A: no `debug` channel: block A line 'Channels:' shows the base list with no `debug`.
55. Block A: `grep -rn oculus.debug src tests config` prints nothing (block A).
56. Block A: `ServerContext` has no `debug` field at the base (block A2: `grep -n debug src/lib/server/root/context.ts` prints nothing, exit 1).
57. Block A: no frame list.
58. Block A: no F9 and no glyph-margin toggle: the F-key grep of block A2 prints no F9; the base glyph press is `pressInGutter` in `editor-gutter.ts`, which calls `onglyph` that no source tab hands in.
59. Block A: base breakpoints are decorations handed lines in and never read back (block A2: no `onDidChange`, `getDecorationRange` or `getModelDecorations` in `editor-gutter.ts`).
60. Block A: no disabled state at the base.
61. Block A: no launch, so no save before it.
62. Block A: no F5, F9, F10 or F11 alone at the base (block A2 F-key grep).
63. Block E: block E: the `grep` prints only `databases.ts:75-76` and `literature.test.ts:82`; `collectionKeys` with `debug` answers `["debug","papers"]`, so a `collections:` entry keyed `debug` is kept at the base.
64. Block A: block A prints DESIGN.md line 121 with the channel list holding no `debug` or `debug-console`.
65. Block G: block G: `loadConfig` at the base answers findings 0, `definedTwice false`; no `debug.yml`, no `server.debug` group, no `debug` status item.
66. Block A: no launch list at the base.
67. Block A: no `/api/debug` route.
68. Block A: no route.
69. Block A: no route.
70. Block A: no launch reader.
71. Block A: no route.
72. Block A: no launch reader.
73. Block A: no launch reader.
74. Block A: no launch reader.
75. Block A: no route; `repositoryOf` exists at the base (block A2: `repo.ts:11`) and is the rule reused.
76. Block A: no route.
77. Block A: no store, no `afterPress`.
78. Block A: no store.
79. Block F: block F: the create op of the base makes `.oculus/launch.yml` and `.oculus` holds `["launch.yml"]`; a second create answers `{"ok":false,"error":"exists"}`; no Add Configuration, no listing, no text of section 7.
80. Block A: no launch, so no save refusal said.
81. Block A: no console channel.
82. Block A: no hover.
83. Block C: no debug text builder (block C).
84. Block A: no Debug Console.
85. Block A: no console input.
86. Block A: no `before` wait, no slow notice.
87. Block F: block F: with `.oculus/project.yml` present, the base create op makes `launch.yml` beside it (`["launch.yml","project.yml"]`) and refuses a second with `exists`; no Add Configuration.
88. Block A: no `rite_dap_bin`, no `~` expansion for it.
89. Block A: no rite gutter, no hover: the base gives no tab a breakpoint object.
90. Block A: no `oculus.debug.v1`, so no `storage` follower for debug; `followKey` exists and the ui store uses it (block A2: `ui.svelte.ts:418`).
91. Block A: no debug key reaches a Terminal tab, none exists.
92. Block H: block H: the base `approveTexts` on a file that is not JSON answers `{"ok":false,"error":"approvals.json is not JSON: <path>"}` and leaves the bytes unchanged; no launch calls it.
93. Block A: no launch.
94. Block A: `ServerContext.close` closes no adapter: no adapter exists.
95. Block A: no wire reader.
96. Block A: no launch reader; `readCommandsFile` follows links (block B line `commands[14].cwd | is a link that leads out of the repository`).
97. Block A: no Debug Console.
98. Block A: no route.
99. Block A: block A prints the menu accelerators of the base: Reload is `Cmd+R`, none is F5.
100. Block C: no debug text builder, so no approval of a launch (block C).

No case was found wrong by the first run (the base lacks the feature, or has the rule the brief names). Cases the brief got wrong are found by the runs after the build and are in section 13 with the evidence: 40, 53 and 94.

### Quoted runs after the change, by case

The runs are vitest files and scripts in the scratch folder (`d11r1/cases/a-server.test.ts`, `c-store.test.ts`, `e-config.test.ts`, `d11b/quoted/b1.mts`, `b2.mts`), run again on the tree after round 1, each case printing its own line. Where the harness replaced a scratch path by `<repo>` or `<tmp>`, that is in the line as printed. The outputs are printed whole below. Which output holds which case:

- Block S1 (`d11r1/s1-new.txt`, the lines of `npx vitest run tests/cases/c-store.test.ts tests/cases/a-server.test.ts tests/cases/e-config.test.ts` without the two of S4, in the order the parallel files wrote them): cases 1 to 29, 36, 43, 44, 49, 51, 54 to 62, 66 to 80, 82, 83, 85 to 88, 90 to 94, 96, 98 to 100.
- Block S2 (`d11r1/b1-new.out`, real session module with fake adapters): cases 30, 32 to 35.
- Block S3 (`d11r1/b2-new.out`, the real `cathedra/bin/debug/rite_dap`): cases 36 to 53, 81, 84, 95, 97.
- Block S4 (`d11r1/cases-e-new.txt`, plus the `readLocalText` run below and the `DESIGN.md` grep): cases 31, 63, 64, 65.
- Case 89 is read from the code (section 12); case 85 is the history logic here and the key handling in Console.svelte (section 12).

Block S1:
```
case 1 F5 with a.rite on screen: {"started":false,"asking":{"kind":"launch","program":"${file}","cwd":"."},"spawns":0}
case 1 after Approve and Debug: {"status":"ended","spawn":[["/Users/axelfaes/workspace/cathedra/bin/debug/rite_dap","<repo>/a.rite"]],"consoleViewOpened":true}
case 1 session ended: {"ended":"The debug session ended","cwdInConsole":"rite_dap <repo>/a.rite in <repo>"}
case 1 F5 again: {"started":true,"asking":null,"spawnsNow":2}
case 2 .md tab: {"started":false,"notices":["Open a .rite file to debug"],"posts":[]}
case 2 no source tab: {"started":false,"notices":["Open a .rite file to debug"],"posts":[]}
case 3 F5: {"started":true,"waiting":"rite: build (debug)","pressed":[{"repo":"/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-repo-bUPpXU","name":"rite: build (debug)","source":"file"}],"posts":[]}
case 3 terminal running: {"waiting":"rite: build (debug)","posts":[]}
case 3 exit 0 then the launch question: {"kind":"launch","name":"rite: debug this file","program":"${file}","cwd":".","pressedCount":1}
case 3 after Approve and Debug: {"posts":["launch","approve","launch"],"pressedCount":1,"console":true,"ended":"The debug session ended"}
case 4: {"answer":{"ok":true},"argv":[["<repo>/utils/benchmark/fib.rite"]],"cwd":["<repo>/utils"]}
case 5: {"configurations":[],"findings":["configurations[0].program | leads above the repository; name a .rite file inside it"]}
case 6: {"configurations":[],"findings":["configurations[0].program | must be a path relative to the repository"]}
case 7: {"configurations":[],"findings":["configurations[0].program | must name a .rite file"]}
case 8: {"configurations":[],"findings":["configurations[0].program | must name a file of the repository that exists"]}
case 9: {"configurations":[],"findings":["configurations[0].program | is a link that leads out of the repository"]}
case 10: {"configurations":[],"findings":["configurations[0].cwd | must be a folder inside the repository, not an absolute path","configurations[1].cwd | must be a folder inside the repository, not one above it","configurations[2].cwd | must be a folder of the repository that exists","configurations[3].cwd | is a link that leads out of the repository"]}
case 11: {"configurations":[],"findings":["configurations[0].name | must not be empty","configurations[1].name | must not be empty","configurations[2].name | must not hold a tab, a line break or any control character","configurations[3].name | must be at most 80 characters"]}
case 12: {"configurations":["run"],"findings":["configurations[1].name | repeats a name of this list, so it is left out"]}
case 13a: {"configurations":[],"findings":["configurations[0].programm | is not a key of a launch configuration: name, program, cwd and before are","configurations[0].program | is required: name the .rite file to run, or ${file} for the file on screen"]}
case 13b: {"configurations":[],"findings":["configurations[0].type | is not a key of a launch configuration: name, program, cwd and before are"]}
case 14: {"configurations":[],"findings":["configurations[0].program | may hold only the placeholders file, fileDirname, fileBasename, fileBasenameNoExtension and workspaceFolder"]}
case 15a: {"configurations":[],"findings":[" | is not YAML, at line 3"]}
case 15b: {"configurations":[],"findings":[" | must be a map with a configurations list"]}
case 15c: {"configurations":[],"findings":["configurations | must be a list of configurations"]}
case 16a: {"configurations":[],"findings":[]}
case 16b: {"configurations":[],"findings":[]}
case 17: {"status":400,"body":{"error":"no-file","names":["${file}"]}}
case 18: {"status":400,"body":{"error":"Only a .rite file that exists can be debugged: /private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-repo-JLp0S4/main.rite"},"spawned":0}
case 19: {"status":400,"body":{"error":"/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-else-VihDLc/z.rite is under no root the file browser serves, so it cannot be debugged"},"spawned":0}
case 20: {"body":{"ok":true},"argv":[["<repo>/a b;$(touch pwned)'\"x.rite"]],"oneArgument":true,"pwnedInRepo":false,"pwnedInCwd":false}
case 21/100 unapproved launch: {"answer":{"approve":{"name":"run","cwd":".","program":"a.rite"}},"spawned":0}
case 21/100 approved text: {"answer":{"ok":true},"spawned":1}
case 21 run again once the first session is gone: {"answer":{"ok":true},"spawned":1}
case 22 program edited: {"approve":{"name":"run","cwd":".","program":"b.rite"}}
case 22 same file in another repository: {"approve":{"name":"run","cwd":".","program":"a.rite"}}
case 23: {"chain":{"repo":"/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-repo-N3UHrq","chain":[[".","a.rite"]]},"debug":{"repo":"/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-repo-N3UHrq","debug":[".","a.rite"]},"sha256Chain":"c28718c445e8","sha256Debug":"703ebe7a7004","differ":true}
case 24: {"approvalsFileAfterTheQuestionWithNoApproval":"absent","spawned":0}
case 25 before names nothing-such: {"started":false,"notices":["before names rite: build (debug), which is not a command of this repository"],"pressed":1}
case 26 exit 3: {"asking":{"kind":"before","code":3,"name":"rite: build (debug)"}}
case 26 Show Errors: {"showTerminal":["T3"],"asking":null,"launched":2}
case 26 Abort: {"asking":null,"launchPosts":0}
case 26 Debug Anyway: {"launchPosts":1}
case 27 found command: {"pressedWithSource":{"repo":"/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-repo-bUPpXU","name":"rite: build (debug)","source":"found"}}
case 28 F5 again while it waits: {"started":false,"notices":["A launch is waiting on rite: build (debug)"],"pressedCount":2}
case 28 Shift+F5 while it waits: {"waiting":null,"stopPosted":false,"terminalsStopped":[]}
case 29 cancel at the command approval: {"notices":["The launch is dropped: the command rite: build (debug) was not approved"],"waiting":null}
case 29 next F5: {"pressedAgain":2,"notices":["The launch is dropped: the command rite: build (debug) was not approved"],"waiting":"rite: build (debug)"}
case 36 on the page: {"frames":["(script)@8"],"pausedLine":8,"openFile":["a.rite:8"],"focusEditor":["<repo>/a.rite:8"],"viewsOpened":["debug-console","debug"],"windowFocusCalls":1,"stateWords":"Paused on breakpoint"}
case 43 evaluate through the store: [{"kind":"input","text":"(+ 1 2)"},{"kind":"result","text":"3"}]
case 44 hover x while paused: 1
case 49 F5 while paused: {"posts":"continue","result":{"ok":true,"newPosts":["continue"]}}
case 51 toggled while paused: {"before":5,"posts":[{"action":"breakpoints","path":"/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-repo-5puLdm/a.rite","lines":[8,9]}],"stateBreakpoints":[["8:verified","9:pending"]]}
case 54: {"replayStatus":"paused","replayFrames":["(script)@8"],"consoleByGet":2,"consoleHeldByFirstPage":2}
case 55 reloaded markers for the old repo path: {"keys":["oculus.debug.v1"],"restored":["version","breakpoints","functions","watch","chosen","toolbar"],"reloadedMarkers":[{"line":3,"state":"verified"},{"line":10,"state":"disabled"}]}
case 55 storage that throws: {"markers":[],"error":null}
case 56/94 server closed with the session paused: {"status":"paused","adaptersLeft":0,"free":62766}
case 57: {"notices":["/elsewhere/cathedra/src/mod.rite is under no root the file browser serves, so it cannot be debugged"],"opened":[]}
case 58 F9 twice on the caret line: []
case 58 toggleAtCaret on a .md tab: false
case 58 toggleAtCaret on .rite at line 3: {"done":true,"markers":[{"line":3,"state":"verified"},{"line":8,"state":"verified"}]}
case 59 two lines inserted above: [{"line":3,"state":"verified"},{"line":10,"state":"verified"}]
case 59 moved while paused posts: {"lines":[10,11]}
case 60 disabled: [{"line":3,"state":"verified"},{"line":10,"state":"disabled"}]
case 60 sent at launch: [{"path":"<repo>/a.rite","lines":[8]}]
case 60 Enable All posts: {"lines":[8,9]}
case 61 refused save: {"started":false,"saves":["tab1"],"notices":["The file changed on disk; reload it"],"launchPosts":0}
case 61 saved: {"started":true,"saves":4,"asking":false}
case 62 under a Confirm, session paused, rite focused: ["F5{} -> {\"action\":null,\"swallow\":true}","F5{\"shiftKey\":true} -> {\"action\":null,\"swallow\":true}","F9{} -> {\"action\":null,\"swallow\":true}","F10{} -> {\"action\":null,\"swallow\":true}","F11{} -> {\"action\":null,\"swallow\":true}","F11{\"shiftKey\":true} -> {\"action\":null,\"swallow\":true}"]
case 62 under a Confirm, no session, .md focused: ["F5{} -> {\"action\":null,\"swallow\":false}","F5{\"shiftKey\":true} -> {\"action\":null,\"swallow\":false}","F9{} -> {\"action\":null,\"swallow\":false}","F10{} -> {\"action\":null,\"swallow\":false}","F11{} -> {\"action\":null,\"swallow\":false}","F11{\"shiftKey\":true} -> {\"action\":null,\"swallow\":false}"]
case 62 no overlay, session paused, a field focused: ["F5{} -> {\"action\":{\"kind\":\"debug\",\"which\":\"start\"},\"swallow\":true}","F5{\"shiftKey\":true} -> {\"action\":{\"kind\":\"debug\",\"which\":\"stop\"},\"swallow\":true}","F9{} -> {\"action\":{\"kind\":\"debug\",\"which\":\"toggle\"},\"swallow\":true}","F10{} -> {\"action\":{\"kind\":\"debug\",\"which\":\"over\"},\"swallow\":true}","F11{} -> {\"action\":{\"kind\":\"debug\",\"which\":\"into\"},\"swallow\":true}","F11{\"shiftKey\":true} -> {\"action\":{\"kind\":\"debug\",\"which\":\"out\"},\"swallow\":true}"]
case 66: {"configurations":["build"],"commands":["build"]}
case 67: {"status":403,"spawned":0}
case 68: {"repo":"relative/path","status":400,"body":{"error":"repo must be an absolute path"},"spawned":0}
case 68: {"repo":"<repo>/missing-dir","status":400,"body":{"error":"repo is not a folder that exists"},"spawned":0}
case 68: {"repo":"/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-unserved-F2fygJ","status":400,"body":{"error":"repo is not under a root the file browser serves"},"spawned":0}
case 69: {"status":400,"body":{"error":"No debug session is paused"}}
case 70: {"configurations":[],"findings":["configurations[0].program | is required: name the .rite file to run, or ${file} for the file on screen"]}
case 71: {"status":400,"body":{"error":"Only a .rite file that exists can be debugged: /private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-repo-JLp0S4/README.md"},"spawned":0}
case 72: {"configurations":[],"findings":["configurations[0].cwd | must be a folder of the repository that exists"]}
case 73: {"configurations":[],"findings":["configurations[0].name | must be text","configurations[1].program | must be text","configurations[2].cwd | must be text","configurations[3].before | must be text","configurations[4] | must be a map of the fields"]}
case 74: {"configurations":[],"findings":["configurations[0].before | must not be empty","configurations[1].before | must not hold a tab, a line break or any control character"]}
case 75 root with no .git: {"body":{"ok":true},"cwdIsTheRoot":true}
case 75 folder under the root: {"status":400,"body":{"error":"repo is not a served root or a git repository"}}
case 76: {"action":"breakpoints","path":"rel.rite","lines":[1],"status":400,"body":{"error":"path must be an absolute path under a root the file browser serves"}}
case 76: {"action":"breakpoints","path":"/nowhere/a.rite","lines":[1],"status":400,"body":{"error":"path must be an absolute path under a root the file browser serves"}}
case 76: {"action":"breakpoints","path":"<repo>/a.rite","lines":[0],"status":400,"body":{"error":"lines must be whole numbers from 1"}}
case 76: {"action":"breakpoints","path":"<repo>/a.rite","lines":[-1],"status":400,"body":{"error":"lines must be whole numbers from 1"}}
case 76: {"action":"breakpoints","path":"<repo>/a.rite","lines":[1.5],"status":400,"body":{"error":"lines must be whole numbers from 1"}}
case 76: {"action":"breakpoints","path":"<repo>/a.rite","lines":"10001 numbers","status":400,"body":{"error":"lines must hold at most 10,000 numbers"}}
case 76: {"action":"frame","status":400,"body":{"error":"No debug session is paused"}}
case 76: {"action":"evaluate","status":400,"body":{"error":"Type an expression to evaluate"}}
case 76 requests sent to an adapter: 0
case 77 refused press: {"waitingBefore":null}
case 77 dropped: {"notices":["The launch is dropped: the command rite: build (debug) did not start"],"waiting":null}
case 77 next F5 is not answered waiting: {"waiting":"rite: build (debug)","notices":["The launch is dropped: the command rite: build (debug) did not start"]}
case 78 terminal closed before it ended: {"notices":["The launch is dropped: the terminal of rite: build (debug) closed before the command ended"],"waiting":null,"spawnsOfAdapter":1}
case 79: {"exists":true,"text":"configurations:\n    - name: Debug the open file\n      program: ${file}\n","listed":{"exists":true,"configurations":[{"name":"Debug the open file","program":"${file}","cwd":".","line":2}],"findings":[]},"opened":["/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-repo-5RLB3N:.oculus/launch.yml:2"],"asked":[]}
case 79 again: {"sameBytes":true,"before":"a2490a264cf1","after":"a2490a264cf1","opened":["/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-repo-5RLB3N:.oculus/launch.yml:2"]}
case 80 readonly: {"started":false,"notices":["This file is read-only on this machine; the editor shows it and saves nothing."],"launchPosts":0}
case 80 truncated: {"started":false,"notices":["This file is longer than the editor reads; its first 2 MB are shown and it saves nothing."],"launchPosts":0}
case 82 hover println / comment word: {"println":null,"comment":null,"postedAfter":0,"moduleBefore":["add","x"]}
case 82 module after: ["add","x"]
case 83: {"defaultText":{"repo":"/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-repo-O5Ttbc","debug":[".","${file}"]},"configuredText":{"repo":"/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-repo-O5Ttbc","debug":[".","${file}"]},"identical":true,"sha256":"883f1605f596","repoDiffers":true}
case 83 default launch asks: {"approve":{"name":"Debug the open file","cwd":".","program":"${file}"}}
case 83 configured launch after approving the default text: {"answer":{"ok":true},"spawned":1}
case 85 history: {"matches":["(+ a b)"],"none":[]}
case 86 at 9.999 s: {"notices":[]}
case 86 at 10.001 s: {"notice":"Waiting for the command slow...","tone":"info","actions":["Debug Anyway","Abort"]}
case 86 Debug Anyway: {"waiting":null,"asking":"launch","launchPosts":1,"terminalStillRuns":true,"stopped":[]}
case 86 Abort: {"asked":"abort","terminal":"S2","stopped":["S2"],"waiting":null}
case 86 command ends first: {"noticeCleared":true,"launchPosts":1,"waiting":null}
case 87: {"projectBytesSame":true,"before":"8b20264191ad","after":"8b20264191ad","launchExists":true,"oculusHolds":["launch.yml","project.yml"]}
case 88 ~/path: {"command":"<HOME>/oculus-scratch/rite_dap"}
case 88 ~ alone: {"command":"<HOME>","ended":"rite_dap could not be started: spawn /private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-home-1rsGSi EISDIR. Set rite_dap_bin in config/local.yml to the adapter's path."}
case 90 other tab wrote the key: {"markers":[{"line":5,"state":"verified"}],"watchRows":["y"]}
case 91/62 debugKeyOf: ["F5{} -> start","F5{\"shiftKey\":true} -> stop","F9{} -> toggle","F10{} -> over","F11{} -> into","F11{\"shiftKey\":true} -> out","F5{\"metaKey\":true,\"shiftKey\":true} -> restart"]
case 91: {"sessionPaused_terminalGetsKey":false,"noSession_terminalGetsKey":true}
case 92: {"status":409,"body":{"error":"approvals.json is not JSON: /private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-home-1rsGSi/.oculus/approvals.json"},"bytesUnchanged":true,"spawned":0}
case 93 stop: {"kind":"stop","process":"rite_dap <repo>/a.rite (pid 45804)"}
case 93 two F5 at once: {"results":[true,false],"adapters":2,"notices":["A debug session is running: stop it first"]}
case 94 first answer: {"approve":{"name":"Debug the open file","cwd":".","program":"${file}"}}
case 94 before the move: {"status":"paused","adapters":1,"port":62765}
case 94 after the port move: {"refusal":null,"announced":1,"listeningOn":62766,"status":"paused","adapters":1}
case 96: {"configurations":["a"],"findings":["configurations[1].program | leads above the repository; name a .rite file inside it"]}
case 98: {"body":{"ok":true},"argv":["<repoB>/b.rite"],"cwd":["<repoA>"],"approvedTextNamesA":true}
case 99 focus recorded: {"windowFocusCalls":1}
case 100 other configuration, other program: {"approve":{"name":"fib","cwd":"utils","program":"utils/benchmark/fib.rite"}}
```

Block S2:
```
case 30 pgrep before: (nothing)
case 30: {"status":"ended","ended":"rite_dap could not be started: spawn rite_dap_not_on_path_for_the_case ENOENT. Set rite_dap_bin in config/local.yml to the adapter's path.","pid":0}
case 30 pgrep after: (nothing)
case 32: {"status":"ended","ended":"rite_dap could not be started: spawn <repo>/not-executable EACCES. Set rite_dap_bin in config/local.yml to the adapter's path."}
case 33 header with no Content-Length: {"status":"ended","ended":"rite_dap sent a message with no usable Content-Length header","fakeAdapterGone":true,"stateStillServed":"ended"}
case 33 Content-Length abc: {"status":"ended","ended":"rite_dap sent a message with no usable Content-Length header","fakeAdapterGone":true,"stateStillServed":"ended"}
case 33 body that is not JSON: {"status":"ended","ended":"rite_dap sent a message that is not JSON","fakeAdapterGone":true,"stateStillServed":"ended"}
case 33 short body: {"status":"ended","ended":"rite_dap stopped in the middle of a message","fakeAdapterGone":true,"stateStillServed":"ended"}
case 34: {"status":"ended","ended":"rite_dap exited with code 7"}
case 35: {"status":"ended","ended":"rite_dap ended with signal SIGKILL","pidGone":true}
case pgrep at end: (nothing)
```

Block S3 (the non-ASCII characters of case 95 printed as `\uXXXX`):
```
case 36: {"pause":{"reason":"breakpoint","description":"break: (script)  at a:8"},"frames":["(script)@8"],"selected":1,"scopes":{"Locals":[],"Module":["add = <closure>","x = 1"]},"watch":[],"breakpoints":[{"path":"<repo>/a.rite","bps":[{"line":8,"verified":true,"message":""}]}]}
case 44 hover evaluate x while paused: {"value":"1"}
case 82 hover println: {"value":"<native>"}
case 51 toggled while paused: [[{"line":8,"verified":true,"message":""},{"line":9,"verified":false,"message":"pending: the module is not loaded yet"}]]
case 46 question: {"confirm":"rite_dap /private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-d11-elC0eu/a.rite (pid 23911)"}
case 46 confirmed: {"ok":true}
case 46 after: {"ended":"The debug session was stopped","pidGone":true}
case 46 stop with no session: {"error":"No debug session is running"}
case 37: {"frames":["add@3","(script)@8"],"scopes":{"Locals":["a = 1","b = 2"],"Module":["add = <closure>","x = 1"]}}
case 45 watch at the pause: [{"expression":"x","value":"1"},{"expression":"nope","error":"eval: line 1: undefined variable 'nope'"}]
case 43 (+ a b) at line 3: {"value":"3"}
case 43 nope: {"failed":"eval: line 1: undefined variable 'nope'"}
case 45 Module after the evaluation of nope: ["add = <closure>","x = 1","nope = <undefined>"]
case 37 selected the second frame: {"frame":2,"scopes":{"Locals":[],"Module":["add = <closure>","x = 1","nope = <undefined>"]},"line":8}
case 50-like console: [{"kind":"input","text":"(+ a b)"},{"kind":"result","text":"3"},{"kind":"input","text":"nope"},{"kind":"error","text":"eval: line 1: undefined variable 'nope'"}]
case 49 launch while paused: {"error":"A debug session is running: stop it first"}
case 38: {"statesCarryingTheBreakpoints":1,"lastOfThem":[[{"line":1,"verified":false,"message":"pending: the module is not loaded yet"},{"line":5,"verified":false,"message":"pending: the module is not loaded yet"}]],"statuses":["running"],"ended":"The debug session ended","output":["stdout: before","stdout: 3","stdout: after","console: rite_dap: <repo>/a.rite finished"]}
case 39: {"pause":{"reason":"breakpoint","description":"break: add  at a:3\n  a = 1  b = 2"},"frames":["add@3","(script)@8"],"functions":[{"name":"add","verified":true,"message":""}]}
case 40 step over: {"pause":{"reason":"step","description":"break: (script)  at a:9"},"frames":["(script)@9"]}
case 40 step into at line 8: {"statuses":"starting: > running: > paused:breakpoint > running: > ended:","console":["stderr: rite_dap: <repo>/a.rite: + expects numbers"]}
case 40 step into at line 6, which holds no call: {"pause":{"reason":"step","description":"break: (script)  at a:7"},"frames":["(script)@7"]}
case 40 step out of add: {"status":"paused","pause":{"reason":"step","description":"break: (script)  at a:8"},"frames":["(script)@8"]}
case 41 continue: {"secondPauseAt":["bump@8"],"status":"paused"}
case 41 continue end: ["console: rite_dap /private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-d11-elC0eu/frame.rite in /private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-d11-elC0eu","stdout: x 1 1","console: rite_dap: /private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-d11-elC0eu/frame.rite finished","console: The debug session ended"]
case 41 finishFrame: {"secondPauseAt":null,"status":"ended"}
case 41 finishFrame end: ["console: rite_dap /private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-d11-elC0eu/frame.rite in /private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-d11-elC0eu","stdout: x 1 1","console: rite_dap: /private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-d11-elC0eu/frame.rite finished","console: The debug session ended"]
case 42: {"ended":"The debug session ended","console":["console: rite_dap /private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-d11-elC0eu/a.rite in /private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-d11-elC0eu","stdout: before","stdout: 3","stdout: after","console: rite_dap: /private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-d11-elC0eu/a.rite finished","console: The debug session ended"],"pidGone":true}
case 47 pause on a running program: {"status":"running","stopQuestion":{"confirm":"rite_dap /private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-d11-elC0eu/endless.rite (pid 24002)"}}
case 47: {"ended":"The debug session was stopped","pidGone":true}
case 48: {"newSession":2,"console":["rite_dap <repo>/a.rite in /private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-d11-elC0eu","before"],"first":0}
case 49 while running: {"error":"A debug session is running: stop it first"}
case 49 pgrep count: 1
case 50 bad.rite: {"ended":"The debug session ended","console":["console: rite_dap <repo>/bad.rite in /private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-d11-elC0eu","stderr: rite_dap: <repo>/bad.rite: module 'bad':1: unclosed sequence","console: The debug session ended"]}
case 50 err.rite: {"ended":"The debug session ended","console":["console: rite_dap <repo>/err.rite in /private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-d11-elC0eu","stderr: rite_dap: <repo>/err.rite: module 'err':2: undefined variable 'undefined-fn'","console: The debug session ended"]}
case 52: {"pausedFrames":["<link>/a.rite"],"pathAsSent":true}
case 53: {"first":2003,"held":10000,"firstHeld":"2002","lastHeld":"The debug session ended","numbersHeld":9998,"ended":"The debug session ended","appends":1}
case 81: {"pageHolds":10000,"pageFirst":2003,"sameAsGet":true}
case 84: ["console: rite_dap /private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-d11-elC0eu/same.rite in /private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-d11-elC0eu","stdout: same","stdout: same","stdout: same","stdout: other","console: rite_dap: /private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-d11-elC0eu/same.rite finished"]
case 97: ["\"<img src=x onerror=alert(1)>\"","\"\\\\x1b[31mred\\\\x1b[0m\""]
case 95 real adapter multibyte: [{"kind":"stdout","text":"caf\u00e9 \u4e2d\u6587"}]
case 95 split mid-header, mid-body and mid-character: ["one:{\"text\":\"caf\u00e9\"}","two:{\"text\":\"\u4e2d\u6587\"}","three:undefined"]
case 95 three messages in one chunk: ["one","two","three"]
case pgrep at end: (nothing)
```

Block S4, case 31 after the change (`node --experimental-strip-types d11b/first/run31b.mts`, run on the worktree, output `d11r1/run31b-new.out`):
```
"rite_dap_bin: ''" checkLocal= "local.yml: rite_dap_bin must be a non-empty string" problems= [{"key":"rite_dap_bin","kind":"value","words":"a non-empty string","sentence":"rite_dap_bin must be a non-empty string"}] unknown= [] riteDapBin= "rite_dap" claudeBin= claude port= 8790
"rite_dap_bin: 5" checkLocal= "local.yml: rite_dap_bin must be a non-empty string" problems= [{"key":"rite_dap_bin","kind":"value","words":"a non-empty string","sentence":"rite_dap_bin must be a non-empty string"}] unknown= [] riteDapBin= "rite_dap" claudeBin= claude port= 8790
"rite_dap_bin: ~/x/rite_dap" checkLocal= null problems= [] unknown= [] riteDapBin= "~/x/rite_dap" claudeBin= claude port= 8790
```

Block S4, case 63 and case 65 (`npx vitest run tests/cases/e-config.test.ts`) and case 64 (`d11r1/case64-new.out`, the three commands run in the worktree):
```
case 63: {"before":["debug-console","debug"],"after":[{"id":"debug-console","group":"explorer","label":"views.debug_console"},{"id":"debug","group":"explorer","label":"views.debug"},{"id":"events","group":"academic","label":"views.events"}],"debugViewCount":1}
case 65: {"keys":["config","findings"],"findings":0,"definedTwice":false}
$ grep -n "Channels:" DESIGN.md | cut -c1-20
121:**The socket.** 
$ grep -o "`jump`, `debug`, `debug-console`" DESIGN.md
`jump`, `debug`, `debug-console`
$ grep -n "CHANNEL = " src/lib/server/machine/debug/console.ts src/lib/server/machine/debug/session.ts
src/lib/server/machine/debug/console.ts:25:const CONSOLE_CHANNEL = 'debug-console';
src/lib/server/machine/debug/session.ts:59:const DEBUG_CHANNEL = 'debug';
```

## 6. DONE / NOT DONE

Every output below was printed by the command named in the row, run from `tools/oculus` of the worktree after the last edit of round 1. `npm run test:quick` is the plan's whole verify list (`verify:` of the state file holds that one command).

| Check | Status |
|---|---|
| `npm run diagrams` | DONE, exit 0 (`d11r1/diagrams-final.out`) |
| Verify list, `checks.sh` | DONE, `checks: 1 commands passed`, exit 0 |
| `wc -l` limits | DONE, every limit the brief names per file and spec.md's general limits (table below) |
| ASCII gate of the brief (item 3) | DONE, prints nothing, exit 0 |
| The four kept tests, unchanged tree then changed tree | DONE |
| The ten items of round 1 | DONE, section 3; the cases in section 4 |
| Quoted runs of cases 1 to 100 | DONE except the DOM parts named in the first line |
| `pgrep -fl rite_dap` after the last run | DONE, prints nothing |
| Contrast of every text on the orange bar | DONE, section 4 case 5: least 4.61 over 17 themes |
| Unused exports against the base list | DONE, identical |
| `tests/checks` | NOT DONE for 2 tests: `integrity.test.ts` is red in this worktree for a missing `deck` folder |
| The DOM parts routed to the look | NOT DONE here, by the brief's routing (section 12) |
| Case 40, Step Into at line 8 | NOT DONE, the adapter ends the program (section 13, open item 1) |

The size limits, from `wc -l` of each file after the last edit (the brief's section 3 and 4 limits per file; spec.md's 880 for a source file and 520 for a component):
```
src/lib/server/machine/debug/launch.ts: 174 (limit 300) ok
src/lib/server/machine/debug/wire.ts: 148 (limit 250) ok
src/lib/server/machine/debug/session.ts: 672 (limit 700) ok
src/lib/server/machine/debug/routes.ts: 257 (limit 450) ok
src/lib/state/system/machine/debug/debug.svelte.ts: 731 (limit 750) ok
src/lib/state/system/machine/debug/debug.ts: 258 (limit 350) ok
src/lib/ui/controls/editor/kit/rite/rite-hover.ts: 61 (limit 120) ok
src/lib/shell/commands/DebugAsk.svelte: 96 (limit 120) ok
src/lib/shell/commands/DebugToolbar.svelte: 168 (limit 250) ok
src/lib/views/system/machine/debug/Console.svelte: 280 (limit 520) ok
src/lib/views/system/machine/debug/Debug.svelte: 172 (limit 520) ok
src/lib/views/system/machine/debug/sections/Breakpoints.svelte: 212 (limit 520) ok
src/lib/views/system/machine/debug/sections/CallStack.svelte: 71 (limit 520) ok
src/lib/views/system/machine/debug/sections/Variables.svelte: 66 (limit 520) ok
src/lib/views/system/machine/debug/sections/Watch.svelte: 159 (limit 520) ok
largest changed .ts: src/lib/server/root/context.ts 787 (limit 880)
largest changed .svelte: src/lib/views/sources/source/Source.svelte 516 (limit 520)
folders that received a new file and hold more than 10 items: none; server/machine/debug holds 8
```

The verify list (`sh ~/.claude/skills/land/templates/checks.sh ...orchestrator-state.md`), the final run, printed whole (the file list `test:quick` prints is part of its output):
```
$ npm run test:quick

> oculus@0.0.1 test:quick
> node tests/tiers/quick.mjs

test:quick: 107 changed file(s), from git since HEAD
test:quick: 107 test file(s), 10 essential
        tests/data/sources/config/local.test.ts: changed
        tests/routes/machine/debug.test.ts: changed
        tests/server/machine/debug/session.test.ts: changed
        tests/data/snapshot/normalise.test.ts: imports at depth 1
        tests/data/snapshot/resources.test.ts: imports at depth 1
        tests/data/sources/docs.test.ts: imports at depth 1
        tests/data/sources/feeds.test.ts: imports at depth 1
        tests/data/sources/manifests.test.ts: imports at depth 1
        tests/data/sources/personal.test.ts: imports at depth 1
        tests/data/sources/present.test.ts: imports at depth 1
        tests/routes/apps/approve.test.ts: imports at depth 1
        tests/routes/git/deposit.test.ts: imports at depth 1
        tests/routes/machine/commands.test.ts: imports at depth 1
        tests/routes/machine/hpc.test.ts: imports at depth 1
        tests/server/accounts/connect/oauth.test.ts: imports at depth 1
        tests/server/accounts/mail/routes.test.ts: imports at depth 1
        tests/server/edit/feeds.test.ts: imports at depth 1
        tests/server/machine/approvals/approvals.test.ts: imports at depth 1
        tests/server/machine/hpc/submit.test.ts: imports at depth 1
        tests/server/machine/lsp/choices.test.ts: imports at depth 1
        tests/server/machine/lsp/relay.test.ts: imports at depth 1
        tests/server/machine/pty/channel.test.ts: imports at depth 1
        tests/server/machine/runs/commands/placeholders.test.ts: imports at depth 1
        tests/server/machine/runs/commands/run.test.ts: imports at depth 1
        tests/server/machine/runs/schedules/file.test.ts: imports at depth 1
        tests/server/machine/runs/schedules/record.test.ts: imports at depth 1
        tests/server/machine/runs/schedules/run.test.ts: imports at depth 1
        tests/server/machine/runs/schedules/watch.test.ts: imports at depth 1
        tests/server/machine/usage/refresh.test.ts: imports at depth 1
        tests/server/root/hooks-server.test.ts: imports at depth 1
        tests/state/client/terminal/terminal-close.test.ts: imports at depth 1
        tests/state/feeds/literature-merge.test.ts: imports at depth 1
        tests/state/forms/form-drafts.test.ts: imports at depth 1
        tests/state/forms/manifest-draft.test.ts: imports at depth 1
        tests/state/system/apps/methods.test.ts: imports at depth 1
        tests/state/system/apps/store-cache.test.ts: imports at depth 1
        tests/state/system/lsp/edits.test.ts: imports at depth 1
        tests/views/sources/bar-actions.test.ts: imports at depth 1
        tests/data/helpers/files/nesting.test.ts: imports at depth 2
        tests/data/snapshot/cluster-folder.test.ts: imports at depth 2
        tests/data/sources/agents-catalog.test.ts: imports at depth 2
        tests/data/sources/career.test.ts: imports at depth 2
        tests/data/sources/collections.test.ts: imports at depth 2
        tests/data/sources/config/catalog/options.test.ts: imports at depth 2
        tests/data/sources/config/languages.test.ts: imports at depth 2
        tests/data/sources/config/rail.test.ts: imports at depth 2
        tests/data/sources/config/settings.test.ts: imports at depth 2
        tests/data/sources/registries.test.ts: imports at depth 2
        tests/routes/apps/app-files.test.ts: imports at depth 2
        tests/routes/apps/app-open.test.ts: imports at depth 2
        tests/routes/apps/app-store.test.ts: imports at depth 2
        tests/routes/docs/deck.test.ts: imports at depth 2
        tests/routes/docs/literature.test.ts: imports at depth 2
        tests/routes/docs/memories.test.ts: imports at depth 2
        tests/routes/edit/app-gate.test.ts: imports at depth 2
        tests/routes/edit/audit-mute.test.ts: imports at depth 2
        tests/routes/edit/deck-slides.test.ts: imports at depth 2
        tests/routes/edit/rail.test.ts: imports at depth 2
        tests/routes/edit/roots.test.ts: imports at depth 2
        tests/routes/edit/undo/undo.test.ts: imports at depth 2
        tests/routes/files/file-undo.test.ts: imports at depth 2
        tests/routes/files/file.test.ts: imports at depth 2
        tests/routes/files/fs.test.ts: imports at depth 2
        tests/routes/files/history.test.ts: imports at depth 2
        tests/routes/files/project-files.test.ts: imports at depth 2
        tests/routes/files/search.test.ts: imports at depth 2
        tests/routes/files/source.test.ts: imports at depth 2
        tests/routes/machine/schedules.test.ts: imports at depth 2
        tests/routes/replace/ops-replace.test.ts: imports at depth 2
        tests/routes/sessions/compose.test.ts: imports at depth 2
        tests/routes/sessions/latex.test.ts: imports at depth 2
        tests/routes/sessions/terminal-actions.test.ts: imports at depth 2
        tests/routes/sessions/terminal-edit.test.ts: imports at depth 2
        tests/routes/sessions/terminal.test.ts: imports at depth 2
        tests/server/accounts/connect/accounts.test.ts: imports at depth 2
        tests/server/core/changes.test.ts: imports at depth 2
        tests/server/core/git-failure.test.ts: imports at depth 2
        tests/server/edit/app-store.test.ts: imports at depth 2
        tests/server/edit/config-key.test.ts: imports at depth 2
        tests/server/edit/deck-acts.test.ts: imports at depth 2
        tests/server/edit/writes-collection.test.ts: imports at depth 2
        tests/server/files/search.test.ts: imports at depth 2
        tests/server/machine/apps/manifest.test.ts: imports at depth 2
        tests/server/machine/lsp/cpp-file.test.ts: imports at depth 2
        tests/server/machine/lsp/library.test.ts: imports at depth 2
        tests/server/machine/lsp/lifetime.test.ts: imports at depth 2
        tests/server/machine/lsp/servers.test.ts: imports at depth 2
        tests/server/machine/pty/sessions.test.ts: imports at depth 2
        tests/server/sessions/overrides.test.ts: imports at depth 2
        tests/server/sessions/transcripts.test.ts: imports at depth 2
        tests/state/sessions/source.test.ts: imports at depth 2
        tests/state/sources/repositories/diff/comment-draft.client.test.ts: imports at depth 2
        tests/state/workbench/layout/saved/layout-saved.test.ts: imports at depth 2
        tests/state/workbench/layout/saved/layout-unread.test.ts: imports at depth 2
        tests/state/workbench/navigation/pages.test.ts: imports at depth 2
        tests/views/shared/explorer/opening-apps.test.ts: imports at depth 2
        tests/views/shared/explorer/opening.client.test.ts: imports at depth 2
        tests/checks/config/config-folder.test.ts: changed, run by npm run test:checks
        tests/checks/config/config.test.ts: changed, run by npm run test:checks
        tests/checks/look/contrast.test.ts: changed, run by npm run test:checks
        tests/checks/tree/boundaries.test.ts: changed, run by npm run test:checks
ok      ASCII gate (0.4 s)
ok      prettier (1.6 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.3 s)
ok      svelte-check (22.7 s): 1791389683070 COMPLETED 430 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (27.8 s)
ok      vitest (34.4 s): Duration  30.80s (transform 47.71s, setup 0ms, import 82.66s, tests 34.85s, environment 291ms)
test:quick: 35.0 s (limit 45.0 s); every command passed
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
checks: 1 commands passed
checks.sh exit 0
```

`npm run diagrams`:
```

> oculus@0.0.1 diagrams
> node utils/diagrams/diagrams.mjs

docs/diagrams/layers.dot
docs/diagrams/layers.svg
docs/diagrams/layer-data.dot
docs/diagrams/layer-data.svg
docs/diagrams/layer-server.dot
docs/diagrams/layer-server.svg
docs/diagrams/layer-state.dot
docs/diagrams/layer-state.svg
docs/diagrams/layer-ui.dot
docs/diagrams/layer-ui.svg
docs/diagrams/layer-shell.dot
docs/diagrams/layer-shell.svg
docs/diagrams/layer-views.dot
docs/diagrams/layer-views.svg
docs/diagrams/channels.dot
docs/diagrams/channels.svg
docs/diagrams/writes.dot
docs/diagrams/writes.svg
diagrams exit 0
```

`npx vitest run tests/checks --testTimeout=400000` (`test:checks` runs the same folder with no timeout; the default 5 s timeouts of `diagrams.test.ts` fail under load):
```
------- Failed Tests 2 -------
 FAIL  |unit| tests/checks/config/integrity.test.ts > the real hub > validates with no findings
AssertionError: expected [ { ...(3) } ] to deeply equal []
- Expected
+ Received
- []
+     "message": "deck folder deck is not in /Users/axelfaes/workspace/research-hub/.agents/worktrees/D11",
 FAIL  |unit| tests/checks/config/integrity.test.ts > the real hub > reads the portfolio deck with every named deck found
AssertionError: expected 'missing' to be 'ok' // Object.is equality
Expected: "ok"
Received: "missing"
 Test Files  1 failed | 16 passed (17)
      Tests  2 failed | 241 passed (243)
checks exit 1
```

The two red tests are `tests/checks/config/integrity.test.ts` "validates with no findings" and "reads the portfolio deck with every named deck found". The finding is `deck folder deck is not in <worktree root>`: the hub worktree of this step holds no `deck` folder (`ls -A` of the worktree root prints `.git .gitignore AGENTS.md applications CLAUDE.md CONTEXT.md education feeds funding network projects README.md registries side-projects skills-lock.json tasks tools`, no `deck`). The file is not one this step changes and I did not change it; I could not run it on the base here because the base copy holds no hub root. Not verified: that it passes on main.

The four kept tests after the change (`npx vitest run <the three files> --reporter=verbose`, the lines of the four):
```
 ok |unit| tests/data/sources/config/local.test.ts > checkLocal > answers "rite_dap_bin: ''" with the sentence it would throw 0ms
 ok |unit| tests/data/sources/config/local.test.ts > checkLocal > answers "rite_dap_bin: 5" with the sentence it would throw 0ms
 ok |unit| tests/server/machine/debug/session.test.ts > starts the adapter with the program as one argument and no shell 122ms
 ok |unit| tests/routes/machine/debug.test.ts > POST /api/debug > refuses a request without the write token 13ms
 ok |unit| tests/routes/machine/debug.test.ts > POST /api/debug > runs a debug launch only after its exact text is approved 893ms
 Test Files  3 passed (3)
      Tests  28 passed (28)
four exit 0
```

The four on the unchanged tree are the block "The four kept tests on the unchanged tree" of section 5: `Cannot find module ../../../src/lib/server/machine/debug/routes.ts` for G1 and G38, `Cannot find module ../../../../src/lib/server/machine/debug/session.ts` for G7, and `AssertionError: expected null to be` the sentence `local.yml: rite_dap_bin must be a non-empty string` for the two G13 rows. I judged the four by reading them. Round 1 adds no test file and no test; it adds one pair to the table of G26's `contrast.test.ts` (line 71), whose run on the round-0 tree is in section 4, case 5.

Unused exports: `sh utils/unused-exports.sh > unused-now.txt; diff <base>/unused-exports.txt unused-now.txt` printed nothing and `echo $?` printed 0 ("unused-exports identical to base"), after the last edit.

The ASCII gate (spec.md's perl over `src tests config`) printed nothing and `echo $?` printed 0 after the last edit (`d11r1/ascii-final.out`).

The history-word grep of spec.md (`-i -E "\b(before|used to|no longer|still|always has been|always had|as before|again|now|instead of|previously|formerly|earlier|round [0-9]|D11)\b"` over the comment lines of the 12 files this round changed that carry comments, and the test titles of `contrast.test.ts`) hit 20 comment lines, each judged by reading: `session.ts:102` ("an earlier one" is an earlier pause of the same session), `:146` ("as published now"), `:172` and `:509` ("read again" is a second read at run time), `:363` (the same), `routes.ts:56` ("before the fields are checked" orders two steps of the code), `Console.svelte:26`, `:28`, `:52` ("earlier inputs", "earlier lines" are rows of the console), `:104` ("before the combobox sees it" orders an event), and in `debug.svelte.ts` lines 6, 12, 15, 56, 147, 389, 462, 573, 600 and 625 ("`before`" is the configuration key of the command that runs first, and the others order calls). None compares the code with an earlier state of it, and no hit names a package id or a date.

`pgrep -fl rite_dap` after the last run:
```
pgrep exit 1
```

Reading of the new and changed list items and sentences against the standards pages (item 8): the configuration's `standards` for this plan is `agents/spec.md`, and `grep -n -i "list item\|sentence length\|words per sentence" agents/spec.md` prints nothing, and the brief's line 3 says there are no standards pages. There is no rule on list items or sentence length to depart from, so no departure is named. The docs I wrote follow spec.md line 54 (one line per paragraph or bullet).

## 7. Terms

oculus has no `docs/glossary.md`: `ls tools/oculus/docs` prints `apps.md configuration.md debugging.md diagrams files-and-search.md source-control.md terminals.md views.md window.md`, and `debugging.md` is the guide this step adds.

## 8. Files with line counts

From `diff -rq` of the worktree against the base copy (`d11b/changed3.txt`), docs/diagrams excluded and listed after. CHG is a changed file with its line count at the base and now, ADD a new file with its line count. Paths marked "outside the write list" are written for the reason given.

| Kind | Path | Base | Now | Note |
|---|---|---|---|---|
| CHG | `DESIGN.md` | 574 | 575 |  |
| CHG | `HELP.md` | 174 | 185 |  |
| CHG | `config/catalogs/glyphs.yml` | 264 | 274 |  |
| CHG | `config/catalogs/icons.yml` | 263 | 273 |  |
| CHG | `config/catalogs/options.yml` | 1286 | 1289 |  |
| CHG | `config/layout.yml` | 183 | 184 |  |
| CHG | `config/text/app.yml` | 218 | 218 |  |
| CHG | `config/text/server.yml` | 140 | 168 |  |
| CHG | `config/text/statusbar.yml` | 186 | 189 |  |
| ADD | `config/text/views/system/machine/debug.yml` | - | 73 |  |
| CHG | `docs/configuration.md` | 65 | 65 |  |
| ADD | `docs/debugging.md` | - | 109 |  |
| CHG | `docs/terminals.md` | 69 | 69 |  |
| CHG | `docs/views.md` | 265 | 273 |  |
| CHG | `docs/window.md` | 82 | 82 |  |
| CHG | `package-lock.json` | 8897 | 8905 |  |
| CHG | `package.json` | 112 | 113 |  |
| CHG | `src/lib/data/helpers/run/tasks.ts` | 14 | 14 |  |
| CHG | `src/lib/data/model/index.ts` | 633 | 651 |  |
| ADD | `src/lib/data/model/model-machine.ts` | - | 608 |  |
| CHG | `src/lib/data/model/model-sessions.ts` | 714 | 714 |  |
| CHG | `src/lib/data/shapes/shapes.ts` | 300 | 311 | outside the write list: the console append shape is shared by the server (console.ts) and the page (payloads.ts), so one zod shape is kept instead of two copies that the duplicate-code check flags |
| CHG | `src/lib/data/sources/config/local.ts` | 565 | 573 |  |
| CHG | `src/lib/server/core/channels.ts` | 217 | 219 |  |
| CHG | `src/lib/server/machine/approvals/approvals.ts` | 304 | 316 | outside the write list: holds `debugText`, the launch text kept under `command:<sha256>` beside `chainText`; its head comment is one the brief lists as changed |
| ADD | `src/lib/server/machine/debug/breakpoints.ts` | - | 94 |  |
| ADD | `src/lib/server/machine/debug/console.ts` | - | 116 |  |
| ADD | `src/lib/server/machine/debug/inspect.ts` | - | 88 |  |
| ADD | `src/lib/server/machine/debug/launch.ts` | - | 174 |  |
| ADD | `src/lib/server/machine/debug/routes.ts` | - | 257 |  |
| ADD | `src/lib/server/machine/debug/session.ts` | - | 672 |  |
| ADD | `src/lib/server/machine/debug/shapes.ts` | - | 49 |  |
| ADD | `src/lib/server/machine/debug/wire.ts` | - | 148 |  |
| CHG | `src/lib/server/machine/runs/commands/files.ts` | 241 | 263 |  |
| CHG | `src/lib/server/machine/runs/commands/placeholders.ts` | 102 | 134 |  |
| CHG | `src/lib/server/root/context.ts` | 879 | 787 |  |
| ADD | `src/lib/server/root/process/server-context.ts` | - | 135 |  |
| CHG | `src/lib/server/root/watch/local.ts` | 157 | 158 |  |
| CHG | `src/lib/shell/Workbench.svelte` | 486 | 512 |  |
| ADD | `src/lib/shell/commands/DebugAsk.svelte` | - | 96 |  |
| ADD | `src/lib/shell/commands/DebugToolbar.svelte` | - | 168 |  |
| CHG | `src/lib/shell/keys/keys.ts` | 315 | 354 |  |
| CHG | `src/lib/shell/keys/workbench-keys.svelte.ts` | 498 | 515 |  |
| CHG | `src/lib/shell/status/StatusBar.svelte` | 237 | 306 |  |
| CHG | `src/lib/shell/status/status-items.ts` | 135 | 140 |  |
| CHG | `src/lib/state/client/context.ts` | 666 | 718 |  |
| CHG | `src/lib/state/client/entities.svelte.ts` | 112 | 114 |  |
| CHG | `src/lib/state/client/payloads.ts` | 148 | 206 |  |
| CHG | `src/lib/state/sessions/latex/calls.ts` | 206 | 206 | outside the write list: imports `postWithToken` from its new place |
| CHG | `src/lib/state/sessions/terminal/commands.svelte.ts` | 727 | 772 |  |
| CHG | `src/lib/state/sessions/terminal/pty/pty-io.ts` | 248 | 225 | outside the write list: `postWithToken` and `TokenSource` moved out to `state/shared/stores/token-post.ts`, since `state/system` may not import `state/sessions` and the debug store posts with the token |
| CHG | `src/lib/state/shared/answers/terminal-words.ts` | 83 | 83 |  |
| CHG | `src/lib/state/shared/stores/shapes.ts` | 386 | 392 |  |
| ADD | `src/lib/state/shared/stores/token-post.ts` | - | 26 | outside the write list: new home of `postWithToken` and `TokenSource` (the layer order puts shared last) |
| ADD | `src/lib/state/system/machine/debug/debug-file.ts` | - | 75 |  |
| ADD | `src/lib/state/system/machine/debug/debug-io.ts` | - | 104 |  |
| ADD | `src/lib/state/system/machine/debug/debug-lists.ts` | - | 199 |  |
| ADD | `src/lib/state/system/machine/debug/debug.svelte.ts` | - | 731 |  |
| ADD | `src/lib/state/system/machine/debug/debug.ts` | - | 258 |  |
| CHG | `src/lib/state/system/machine/schedules/schedule-words.ts` | 90 | 90 |  |
| CHG | `src/lib/themes/derive.ts` | 274 | 295 |  |
| CHG | `src/lib/ui/controls/ToolButton.svelte` | 443 | 446 | outside the write list: item 7: the status item reads its hover fill and its warning ink from `--status-hover`, `--status-warning` and `--status-warning-weight`, which the bar sets while it is orange, because a shell component may not style a primitive's own class (`boundaries.test.ts`, "lets no view or shell component style a primitive own class") |
| CHG | `src/lib/ui/controls/editor/Editor.svelte` | 516 | 513 |  |
| CHG | `src/lib/ui/controls/editor/gutter/editor-gutter.ts` | 103 | 194 |  |
| CHG | `src/lib/ui/controls/editor/gutter/gutter.ts` | 397 | 434 |  |
| CHG | `src/lib/ui/controls/editor/gutter/marks.css` | 63 | 102 |  |
| ADD | `src/lib/ui/controls/editor/kit/rite/rite-hover.ts` | - | 61 |  |
| CHG | `src/lib/views/sessions/terminal/grid/TerminalGrid.svelte` | 518 | 514 | outside the write list: case 91: the xterm key handler passes a debug key to the page while a session runs; it calls `gridKeys` |
| ADD | `src/lib/views/sessions/terminal/grid/grid-keys.ts` | - | 33 | outside the write list: the handler of case 91, split out of TerminalGrid.svelte (518 lines at the base, the cap is 520) |
| CHG | `src/lib/views/sources/source/Editor.svelte` | 297 | 296 |  |
| CHG | `src/lib/views/sources/source/Source.svelte` | 517 | 516 |  |
| CHG | `src/lib/views/sources/source/language/extension.ts` | 45 | 52 |  |
| CHG | `src/lib/views/sources/source/language/tab-language.svelte.ts` | 82 | 84 | outside the write list: passes the rite hover to the language extension choice |
| CHG | `src/lib/views/sources/source/source-gutter.svelte.ts` | 151 | 197 |  |
| ADD | `src/lib/views/system/machine/debug/Console.svelte` | - | 280 |  |
| ADD | `src/lib/views/system/machine/debug/Debug.svelte` | - | 172 |  |
| ADD | `src/lib/views/system/machine/debug/sections/Breakpoints.svelte` | - | 212 |  |
| ADD | `src/lib/views/system/machine/debug/sections/CallStack.svelte` | - | 71 |  |
| ADD | `src/lib/views/system/machine/debug/sections/Variables.svelte` | - | 66 |  |
| ADD | `src/lib/views/system/machine/debug/sections/Watch.svelte` | - | 159 |  |
| CHG | `src/routes/+page.svelte` | 271 | 276 |  |
| ADD | `src/routes/api/(machine)/debug/+server.ts` | - | 35 |  |
| CHG | `src/routes/views.ts` | 125 | 137 |  |
| CHG | `tests/checks/config/config-folder.test.ts` | 560 | 561 | outside the write list: its `CATALOG_FILES` list names every catalog file, so `views/system/machine/debug.yml` is added |
| CHG | `tests/checks/config/config.test.ts` | 617 | 620 | outside the write list: three `toEqual` literals of the local config gain `riteDapBin: 'rite_dap'`, the new key's default |
| CHG | `tests/checks/look/contrast.test.ts` | 259 | 262 | outside the write list: the test of G26, which gains the pair `--on-c-orange` on `--c-orange-hover` (section 15) |
| CHG | `tests/checks/tree/boundaries.test.ts` | 738 | 745 | outside the write list: the shell row and the store list name the debug store the shell reads (see section 15) |
| CHG | `tests/data/sources/config/local.test.ts` | 178 | 180 |  |
| ADD | `tests/routes/machine/debug.test.ts` | - | 129 |  |
| ADD | `tests/server/machine/debug/session.test.ts` | - | 63 |  |
| CHG | `tests/server/root/context-fixture.ts` | 154 | 168 |  |
| RENAME | `src/lib/data/model/model-processes.ts` to `model-machine.ts` | 481 | see above | the brief's decision 15 |

The regenerated diagram files (`npm run diagrams`): `docs/diagrams/channels.dot`, `channels.svg`, `layer-data.dot`, `layer-data.svg`, `layer-server.dot`, `layer-server.svg`, `layer-shell.dot`, `layer-shell.svg`, `layer-state.dot`, `layer-state.svg`, `layer-views.dot`, `layer-views.svg`, `layers.dot`, `layers.svg`. `package.json` and `package-lock.json` gain `@vscode/debugprotocol` 1.68.0, exact, as a devDependency; no other dependency changed.

## 9. The paragraphs and head comments of "What is on the tree"

Read with `diff <base> <worktree>` of each file.

- `DESIGN.md:23` (the Not an IDE sentence naming the rite debugger): still true, unchanged.
- `DESIGN.md:121` (the channel list): rewritten, `debug` and `debug-console` added after `jump`.
- `DESIGN.md:165` (the Processes rule): rewritten, it names the debug launch text and its approval.
- `DESIGN.md:177` (the view folders): still true, unchanged; `views/system/machine/` now holds `debug` beside `hpc`, `output`, `processes`, `usage`, which the sentence allows for a full group.
- `DESIGN.md:313` (cites `routes/views.ts` with no lines): still true, unchanged.
- `DESIGN.md:410` (the approval paragraph, `<kind>`): rewritten, it gives the debug text shape.
- `DESIGN.md:568` (the status bar entry): rewritten for the debug item; and a new bullet "The debug client" is added at line 575 to the decisions list.
- `HELP.md:46` (`s1-s5`): rewritten to `s1-s7`. `HELP.md:27-86` (keys table): rewritten, rows for F5, Shift+F5, Cmd+Shift+F5, F9, F10 / F11 / Shift+F11 added. `HELP.md:92-145` (views table): rewritten, `debug` and `debug-console` rows added. `HELP.md:152-154` (Project commands): still true, unchanged; a new "## Debugging" section follows it.
- `docs/window.md:82` (the status bar): rewritten for the debug item. `docs/configuration.md:33` (`local.yml` keys): rewritten for `rite_dap_bin`, and `docs/configuration.md:23` (the `sources.yml` row): rewritten, a `collections:` entry named as a built-in view id is not registered. `docs/views.md`: rewritten, a section for each of Debug and Debug Console after TeX view. `docs/terminals.md:47-69` (project commands): rewritten at line 49, a command may be named as the `before` of a debug launch configuration. `docs/debugging.md`: new.
- `config/layout.yml:171-183` (the `docs:` list) and the Help group's arrangement: rewritten, the Debugging guide entry added to both.
- `README.md`: still true, unchanged (`grep -n -i "debug\|command" README.md` prints lines 9, 11, 13 and 48, each about a shell command).
- Head comments, rewritten: `ui/controls/editor/Editor.svelte`, `gutter/gutter.ts` (rewritten to name the breakpoint states, the hint dot and the paused line), `gutter/editor-gutter.ts`, `gutter/marks.css`, `runs/commands/files.ts`, `runs/commands/placeholders.ts`, `state/sessions/terminal/commands.svelte.ts`, `server/core/channels.ts`, `shell/status/status-items.ts`, `data/model/model-machine.ts` (was `model-processes.ts`), `views/sources/source/source-gutter.svelte.ts`, `views/sources/source/language/extension.ts`, `server/machine/approvals/approvals.ts`, and `views/sources/source/language/tab-language.svelte.ts`.
- Head comments, still true: `shell/keys/keys.ts` ("Pure keyboard routing and card geometry"), `shell/commands/CommandAsk.svelte`, `routes/views.ts` (its function comment of `registerCollections` is rewritten for built-in ids), `server/root/watch/local.ts` and the doc comment of `FIELDS` (it says every key of the machine's own values; `riteDapBin` joins the list).
- Round 1, head comments and docs read again after the edits: `server/machine/debug/session.ts` head (rewritten, it names `inspect.ts`), `server/machine/debug/inspect.ts` head (new), `server/machine/debug/routes.ts` head (rewritten, the 409 of a failed approvals write), `views/system/machine/debug/Console.svelte` head (rewritten, the chevron prompt), `themes/derive.ts` head (rewritten, `--c-orange-hover`), `ui/controls/ToolButton.svelte` comment over `.tool.status` (rewritten, the three properties), `shell/status/StatusBar.svelte` comment over `.bar.debugging` (rewritten) and its head comment (still true: "the name of the last configuration"), `ui/controls/editor/gutter/editor-gutter.ts` doc comment of `pressInGutter` (rewritten, a left press), `tests/checks/look/contrast.test.ts` head (rewritten, the new pair). `docs/debugging.md:41` rewritten (a left press; a middle or right press does nothing), `docs/debugging.md:7` (a file under no served root is refused with a notice naming it) still true and now also for the key with a repository watched before. `DESIGN.md:568` ("the last configuration's name once a session has run, the whole bar painted in the theme's orange") and `docs/window.md:82` still true. `HELP.md:165` ("a press in the editor's margin") still true.

## 10. Number of full-list runs

Round 0: 4 (`checks.sh` over the plan's verify list). Round 1: 3 runs of the verify list: `npm run test:quick` once on its own, then `checks.sh` twice, the second after the last edit of the round (its output is in section 6; it exited 0). Each was followed by `npm run diagrams`, and `npx vitest run tests/checks`, which `test:quick` does not cover, ran after each of the two `checks.sh` runs; the last result is in section 6. Every other run was a scoped vitest file, `prettier`, `eslint` or `svelte-check` on named files.

## 11. Judgment calls

- One `session` field (the session's number and program) in `DebugPayload`, not one field per question; the page reads the number to know a new session began.
- An evaluation answers `{ value }` or `{ failed }`, and the page puts the error line in the console from the console channel, not from the answer.
- The default configuration's name is the catalog sentence `server.debug.default_name`, "Debug the open file"; its approval text equals that of a configured `{ name: x, program: ${file}, cwd: . }` of the same repository, because the name is not in the text (case 83).
- Case 13 gives both findings for `programm: a.rite`: the unknown key and the missing `program`.
- The four wire failures (no usable `Content-Length`, not JSON, a stop in the middle of a message, an adapter exit) end the session each with its own sentence, built from literal `words(...)` calls in `session.ts`.
- After a console evaluation the scopes and the watch are read again, so `nope = <undefined>` shows in Module as the adapter lists it (Z457).
- The watch expressions are evaluated after the variables at a stop, so Variables never waits on a failing watch.
- A partial output line of the program is flushed to the console at a stop and at the end.
- The hover posts `evaluate` only for a word a scope of the paused frame already holds (Z457); `println` and a comment word post nothing (case 82).
- A breakpoint decoration is `NeverGrowsWhenTypingAtEdges`, so typing at the end of a line does not stretch the mark.
- A line the adapter has verified, by an answer or by stopping at it, stays verified when its file's lines are sent again, since the adapter answers a resent line as pending (case 51: line 8 stays verified, line 9 is pending).
- The launch files the page sends are the saved breakpoints of `.rite` files under a served root, enabled lines only.
- The default `launch.yml` text is indented four spaces, as the other YAML of the hub is, and is the text case 79 reads back.
- Add Configuration always shows in the Debug view; Open launch.yml shows only when the file exists (`Debug.svelte:98-111`). Both are `ToolButton`s of `ui/`.
- Stop, Restart and the step keys act only when a session can take them; with no session they say nothing and do not reach the page's default.
- In the Debug Console, Enter sends the typed text; a press on a listed earlier input only takes it into the input (VS Code's `acceptSuggestionOnEnter` off).
- Remove All Breakpoints removes the line breakpoints with `removeAll` and the function breakpoints one by one with `removeFunction` (`Breakpoints.svelte:114-115`).
- The status bar item's menu pick starts the configuration it names; the item is a `Menu` of the configurations, and the bar is orange while a session runs, not while it is `starting`.
- `rite_dap_bin` is read as `claude_bin` is, with `~` and `~/` expanded in the session (`expandHome`), so the stored value stays as the reader wrote it.
- The console holds a dropped-lines line, `console_dropped`, drawn above the rows when the held console starts after line 0.
- `postWithToken` and `TokenSource` moved to `state/shared/stores/token-post.ts`, since the layer order is client > workbench > feeds > life > sessions > system > boards > sources > forms > shared, so `state/system` may not import them from `state/sessions`.
- The debug store takes structural dependency types (`DebugScreen`, `DebugNotices`, `DebugCommands`, `DebugPressEnd`) instead of importing the workbench, sessions or commands store types, for the same reason.
- `debugAppendShape` is in `data/shapes/shapes.ts` so the server's console append and the page's `debug-console` payload share one zod shape.
- The boundaries test names `state/system/machine/debug/debug` in the shell's row (the keys use its pure `debugKeyOf`) and `debug` among the stores the shell reads (section 15).
- A configuration name that equals a command name is listed in both lists, each in its own (case 66).
- Round 1: `inspect.ts` holds the reads of a pause (the stack, the scopes with their variables, one evaluation, the watch list) and takes a `Link` of three functions from the session, so it holds no state; `session.ts` keeps the decision whether an answer is still wanted.
- Round 1: `--c-orange-hover` is the orange moved 0.75 of the way toward the colour opposite the bar's ink (`ORANGE_HOVER_SHARE`, `themes/derive.ts:70`). The share and the token name are a choice; a change of either touches `derive.ts:70` and `:231` only.
- Round 1: a warning-tone status item on the orange bar draws the bar's ink in weight 600 in place of amber, since no amber reads on every orange of the 17 themes (1.00 to 1.95). It is a visible choice: the warning is then told from the other items by weight alone.
- Round 1: the status bar hands `--status-hover`, `--status-warning` and `--status-warning-weight` to the status `ToolButton`, which falls back to `--chip`, `--c-amber-txt` and `normal`, so no other surface changes.
- Round 1: a disabled status item (the unsaved-tabs item with no unsaved tab) stays at half opacity on the orange bar and has no contrast ratio computed; WCAG 1.4.3 exempts an inactive component.
- Round 1: the console prompt reuses the glyph `chevron`, which draws `>` in the ASCII set and the chevron-right icon in the icon set; no catalog entry was added and oculus has no `dummy/` twin of `glyphs.yml`.
- Round 1: the refusal of an unserved file covers a `.rite` file only (`debug.svelte.ts:346`); with a non-`.rite` file or none on screen, the fallback to the last watched repository stays, as the rest of the store reads it.
- Round 1: `THREAD` lives in `wire.ts:27` and `command` is a required field of the response shape (`wire.ts:55`); the adapter always sets it (`debug_dap.cpp:95`).
- The server keeps the session across a port move: `serverMover` keeps one process and one `ServerContext`, so the paused session and its adapter continue on the new port (case 94). An adapter ends only when the server closes.

## 12. Before and after of the visible changes, for the cases routed to the look

The look is on the TEST page of a workbench (spec.md), with `rite_dap_bin` set by Axel to `~/workspace/cathedra/bin/debug/rite_dap`. Each entry gives the state to put it in, what the page shows before this step, what it shows after, and the quoted run that covers the part with no DOM.

- Case 1. State: A scratch repository with no `.oculus/launch.yml`, `a.rite` active, F5. Before: F5 does nothing and no Debug view exists. After: A Confirm "Debug the open file?" with the detail `rite_dap ${file}` (`shell/commands/DebugAsk.svelte`, words `debug.ask_launch_default`, `debug.ask_line`); the button "Approve and Debug" starts the adapter and a Debug Console tab opens in the Explorer group (`debug.svelte.ts:253`). After the session ends, F5 starts with no question. Quoted: S1 `case 1` lines.
- Case 2. State: A `.md` tab or no source tab, F5. Before: Nothing. After: The warning notice "Open a .rite file to debug" (`debug.no_file`, `debug.svelte.ts:352`); nothing starts. Quoted: S1 `case 2` lines.
- Case 36. State: Breakpoint on line 8 of `a.rite`, F5, Approve. Before: No debugger. After: The editor shows an arrow in the glyph margin and the tinted line on 8 (`marks.css:76` and `:87`, `pausedDecorations` in `gutter.ts`), and the caret and the focus are in the editor (`focusEditor`); the Debug view shows `(script)` 8, Locals empty, Module `add = <closure>`, `x = 1`. Quoted: S1 and S3 `case 36`.
- Case 44. State: Paused at line 8, pointer over `x`. Before: No hover. After: A hover with a fenced `1` (`kit/rite/rite-hover.ts`); while running none. Quoted: S1 `case 44` and S3 `case 44`.
- Case 51. State: A breakpoint toggled while paused, then while running. Before: A red dot only. After: A filled red dot once the adapter holds the line, a hollow red ring while it has not (`marks.css:55-63`, classes `oculus-breakpoint-verified`, `-unverified`); the ring appears at once while running and fills at the next stop. Quoted: S1 `case 51` (8 verified, 9 pending) and S3 `case 51`.
- Case 52. State: A served root reached through a symlink, breakpoint on 8. Before: No debugger. After: The pause draws the execution line in the tab of the symlinked path: the tab's `riteFile` is the path the tab shows (`Source.svelte:290`) and the frame path is compared as sent (S3 `case 52`: `pathAsSent true`).
- Case 58. State: A `.rite` tab, F9; a `.md` tab, F9 and a press in the margin. Before: F9 does nothing; the margin press calls no handler. After: A dot on the caret line, gone on the second F9; on the `.md` tab nothing (`riteFile` is empty so the gutter object holds no `onglyph`: `source-gutter.svelte.ts:178-192`). Quoted: S1 `case 58`.
- Case 59. State: Breakpoint on 8, two lines typed above. Before: No debugger. After: The dot follows to line 10 and the page sends 10 (`editor-gutter.ts` reads the tracked ranges back). Quoted: S1 `case 59` (the logic: `moved` posts 10 and 11).
- Case 60. State: A breakpoint turned off. Before: No debugger. After: A grey ring (`marks.css:63`), not sent at launch; Enable All sends it. Quoted: S1 `case 60`.
- Case 61. State: An unsaved `.rite` tab, F5; then the file changed on disk. Before: No debugger. After: The tab saves, then the launch asks; with a refused save no question and the draft's sentence as a warning notice. Quoted: S1 `case 61`.
- Case 62. State: A Confirm open, session paused, `.rite` tab focused, F5 F9 F10 F11. Before: Browser default (F5 reloads). After: No page action and the key is swallowed (`event.preventDefault()` at `workbench-keys.svelte.ts:159`), so the page does not reload; with no session and a `.md` tab the default runs. Quoted: S1 `case 62`.
- Case 79. State: Add Configuration in a repository with no `.oculus/`. Before: No button. After: The Debug view's Add Configuration creates `.oculus/launch.yml` and writes the default text; the tab opens at line 2; the Files view lists `.oculus` (the create op of the base made the folder: block F). Pressed again the file opens unchanged. Quoted: S1 `case 79`, `case 79 again`.
- Case 82. State: Paused at 8, pointer over `println`, then over a comment word. Before: No hover. After: No hover and no `evaluate` post for either; Module reads `add`, `x` before and after. Quoted: S1 `case 82`.
- Case 84. State: A program printing `same` three times then `other`. Before: No console. After: The Debug Console draws `same` once with the count 3, then `other` (`Console.svelte:186` count chip); GET holds four lines. Quoted: S3 `case 84` (the server holds the four lines, `consoleRows` folds them).
- Case 85. State: Console input, paused at line 3, `(+ a b)` sent earlier. Before: No console input. After: Typing `(+` lists `(+ a b)` under the input; Tab takes it into the input; Enter sends `(+` and its error line is drawn (`Console.svelte:103-141`). Quoted: S1 `case 85` (`historyMatches`).
- Case 86. State: A `before` command that sleeps 15 s then exits 0. Before: No wait. After: At 10 s the info notice "Waiting for the command slow..." with Debug Anyway and Abort; Debug Anyway asks the launch; Abort asks to stop the terminal; the command's end removes the notice. Quoted: S1 `case 86` (fake timers).
- Case 89. State: A `.rite` file shown at a commit, as a side of a diff, as a read-only library tab. Before: No gutter breakpoints. After: No breakpoint drawn, F9 and a margin press do nothing, no hover: `riteFile` answers the empty string unless the language is rite, the file is on disk and the library address is empty (`Source.svelte:290`), `extension.ts` adds the hover only for a rite file that is not a version, and a diff editor takes no `breakpoints` (`grep -rn "breakpoints=" src/lib/views` prints only `source/Editor.svelte:236`).
- Case 90. State: Two tabs of one page, session paused, a breakpoint toggled in the second. Before: No debugger. After: The first tab follows through the `storage` event (`followKey` on `oculus.debug.v1`) and the session gets one list. Quoted: S1 `case 90`.
- Case 91. State: Paused, a Terminal tab focused, F10. Before: The program in the terminal gets F10. After: A step over, the terminal gets nothing (`grid-keys.ts`); with no session F10 reaches the program. Quoted: S1 `case 91`.
- Case 97. State: A console line `<img src=x onerror=alert(1)>` and ANSI escapes. Before: No console. After: Drawn as literal text through a Svelte text interpolation (`Console.svelte:187`), never as markup. Quoted: S3 `case 97`.
- Case R1-7. State: A session running, the pointer over a status item, then a menu open; a status item in the warning tone (a repository with a failing check). Before: The hovered or open item is filled with `--chip` under the bar's ink (1.26 to 2.43 in 13 of 17 themes) and the warning item is amber on orange (1.00 to 1.95). After: The hovered or open item is filled with `--c-orange-hover` (`ToolButton.svelte:238`) and the warning item is the bar's ink in bold (`:242-243`), through `StatusBar.svelte:288-295`. Ratios per theme: section 4, case 5 (least 4.61 on the bar, 7.22 on the fill).
- Case R1-8. State: A `.rite` tab, a middle press and a right press in the glyph margin. Before: Each press toggles the breakpoint on its line. After: Neither does; a left press does (`editor-gutter.ts:93`). Quoted: section 4, case 3, through `followGutter`; the real pointer is not exercised here.
- Case R1-6. State: A paused session, the Debug Console open. Before: The input row begins with a CSS `> `. After: It begins with the glyph `chevron` (`Console.svelte:184`): `>` under the ASCII glyph set, the chevron-right icon under the icon set.
- Case R1-2. State: Run `a`, pick `b` in the Debug view, do not start. Before: The status item reads `b`. After: It reads `a` (`StatusBar.svelte:103`). Quoted: section 4, case 2 gives the store's two values; the drawn item is the DOM part.
- Case R1-9. State: A repository watched, then F5 on a `.rite` tab outside every served root. Before: The server's refusal sentence appears as a notice after a POST of the watched repository's launch. After: The warning notice names the file and no POST is sent (`debug.svelte.ts:346-349`). Quoted: section 4, case 4.

## 13. Anything in the brief that was wrong or impossible

- Case 40 (Step Into at line 8 pauses in `add`) is impossible with `rite_dap`: block S3 `case 40 step into at line 8` prints `statuses starting > running > paused:breakpoint > running > ended` and the console line `stderr: rite_dap: <repo>/a.rite: + expects numbers`, and the same happens when the DAP request is sent by a raw probe client in `d11b/dap/probe-in.mjs`, so it is the adapter and not oculus. Step Into on a line with no call works (`case 40 step into at line 6, which holds no call` pauses at 7), Step Over and Step Out work as the brief says. cathedra is read only here. This was found by the runs after the build and not by the first run; it has no orchestrator ruling yet. Round 1 changed nothing in oculus for it (brief item 10): the request is the plain DAP `stepIn` of `session.ts:553`, and the adapter's output is quoted in section 4, case 7. The state file's open item 1 cites `session.ts:607` for this request; the line is now 553.
- Case 53 and case 81 say the console holds the last 10,000 lines with `first` 2,000 and 2,000 earlier lines dropped. The console also holds the start line (`rite_dap <program> in <folder>`), the `rite_dap: ... finished` line and `The debug session ended`, so 12,003 lines were written: block S3 `case 53` prints `first 2003`, `held 10000`, and the page says `2003 earlier lines were dropped`.
- Case 94 reads "the server moved by a `port` change ... no `rite_dap` of the old server is left". A move keeps the one process and the one context (`mover.ts`: "the same context, token and sockets serve on"), so the paused session and its adapter continue on the new port: S1 `case 94 after the port move` prints `status paused`, `adapters 1`. The adapter ends when the server closes: `case 56/94 server closed with the session paused` prints `adaptersLeft 0`. Both are what the code does; the brief's wording fits the close and the restart only.
- Case 93 as written ("the second is refused with 'A debug session is running: stop it first', since `starting` counts") holds: S1 `case 93 two F5 at once` prints `results [true,false]` and the notice. (The `adapters 2` there counts the session before the two presses.)
- Brief item 6 says to add a glyph entry and keep its `dummy/` twin identical "when no entry fits". An entry fits (`chevron`), so none is added; and oculus's `config/catalogs/glyphs.yml` has no `dummy/` twin (only cockpit has one), so the clause has nothing to keep identical.
- Brief item 7 puts the derived values in `themes/derive.ts`; the status item's own colours are in `ui/controls/ToolButton.svelte`, which the brief's write list does not name, and a shell component may not style a primitive's class (`boundaries.test.ts`), so the primitive reads three custom properties. The path is outside the write list and is marked so in section 8.

## 14. Doc text for `agents/guarded.md`

G1's Code line, as `grep -n` prints it (`grep -n "^  Code:" agents/guarded.md | sed -n 1p`); the replacement adds `debug` after `approve`:

```
8:  Code: `src/routes/api/` write, ops, open, git, deposit, terminal, commands, hpc, mail, calendar, literature, approve; the `lsp:` channel: `src/lib/server/machine/lsp/relay.ts`, `src/lib/server/root/socket.ts`.
```

Replacement:

```
  Code: `src/routes/api/` write, ops, open, git, deposit, terminal, commands, hpc, mail, calendar, literature, approve, debug; the `lsp:` channel: `src/lib/server/machine/lsp/relay.ts`, `src/lib/server/root/socket.ts`.
```

G1's Test line, with the new test added at its end (`debug: ...`):

```
  Test: write: `tests/routes/edit/write.test.ts`, 'refuses a request with no token'; the token guard behind mail, calendar, connect, usage and hpc: same file, 'refuses an empty process token, a missing one and a wrong one, in the route shape'; ops: `tests/server/files/ops.test.ts`, 'refuses a request without the token, and one that is no operation (case 25)'; terminal: `tests/server/machine/pty/channel.test.ts`, 'refuses input from a socket that carried no token'; mail: `tests/server/accounts/mail/routes.test.ts`, 'refuses a request with no write token'; calendar: `tests/server/accounts/connect/oauth.test.ts`, 'refuses a request with no write token'; folder picker: `tests/server/files/picker.test.ts`, 'refuses a request without the token with a 403, before it runs anything'; usage refresh: `tests/server/machine/usage/refresh.test.ts`, 'refreshes exactly the requested account behind the write token'; connect setup: `tests/server/accounts/connect/accounts.test.ts`, 'saves a half behind the token, reads every account again, and answers no field of it'.; write route: `tests/routes/edit/write.test.ts`, 'refuses a request with no token'; ops route: `tests/server/files/ops.test.ts`, 'refuses a request without the token, and one that is no operation (case 25)'; open: `tests/routes/files/open.test.ts`, 'requires the write token'; source: `tests/routes/files/source.test.ts`, 'requires the current write token'; fs: `tests/routes/files/fs.test.ts`, 'refuses a missing token, a body that is not JSON, and an unknown action'; search: `tests/routes/files/search.test.ts`, 'refuses a request without the write token'; git: `tests/routes/git/git.test.ts`, 'refuses a request with no token'; deposit: `tests/routes/git/deposit.test.ts`, 'refuses a request with no token'; terminal route: `tests/routes/sessions/terminal.test.ts`, 'refuses a request without the write token, before reading any record'; commands: `tests/routes/machine/commands.test.ts`, 'refuses a request without the write token'; memories: `tests/routes/docs/memories.test.ts`, 'refuses a request without the token, and writes nothing'; latex: `tests/routes/sessions/latex.test.ts`, 'refuses a request without the write token and a body that is no format request'; literature: `tests/routes/docs/literature.test.ts`, 'refuses a request without the write token, before any source is asked'; the app approval route: `tests/routes/apps/approve.test.ts`, 'refuses a request without the write token'; lsp: `tests/server/machine/lsp/relay.test.ts`, 'refuses an lsp message from a socket that carried no token, and sends nothing to a server', 'admits a socket whose subscribe of no channels carries the token', 'keeps refusing a socket whose subscribe of no channels carries a wrong token'; terminal input: `tests/server/machine/pty/channel.test.ts`, 'refuses input from a socket that carried no token'; debug: `tests/routes/machine/debug.test.ts`, 'refuses a request without the write token'.
```

G7's Code line, as `grep -n` prints it, and its replacement with `debug` added (the spawn is `session.ts:237`):

```
26:  Code: `src/routes/api/` commands, hpc, open; `src/lib/server/machine/lsp/servers.ts`, `src/lib/server/machine/lsp/pyright/interpreter.ts`; `src/lib/server/machine/lsp/web/svelte-adapter.ts`, `src/lib/server/machine/lsp/web/typescript-adapter.ts`.
```

```
  Code: `src/routes/api/` commands, hpc, open; `src/lib/server/machine/lsp/servers.ts`, `src/lib/server/machine/lsp/pyright/interpreter.ts`; `src/lib/server/machine/lsp/web/svelte-adapter.ts`, `src/lib/server/machine/lsp/web/typescript-adapter.ts`, `src/lib/server/machine/debug/session.ts`.
```

G7's Test line with the new test added:

```
  Test: commands: `tests/server/machine/runs/commands/placeholders.test.ts`, 'creates nothing, for each line, each selection and each shell'; hpc: `tests/server/machine/hpc/actions.test.ts`, 'accepts only the decided id shape and safe absolute paths'; open: `tests/routes/files/open-program.test.ts`, 'names the application for a file and reveals a folder, the path last'; commands route: `tests/server/machine/runs/commands/placeholders.test.ts`, 'creates nothing, for each line, each selection and each shell'; hpc route: `tests/server/machine/hpc/actions.test.ts`, 'accepts only the decided id shape and safe absolute paths'; open program: `tests/routes/files/open-program.test.ts`, 'names the application for a file and reveals a folder, the path last'; language servers: `tests/server/machine/lsp/servers.test.ts`, 'starts each server and the interpreter probe with an argument array, the root path one argument whatever it holds'; debug launch: `tests/server/machine/debug/session.test.ts`, 'starts the adapter with the program as one argument and no shell'.
```

G38 widened, with its Code and Test lines:

```
- G38. A seeded agent or a debug launch runs only after its exact text is approved; a changed text asks again.
  Code: `src/lib/server/machine/pty/start/compose.ts`, `src/lib/server/machine/approvals/approvals.ts`, `src/lib/server/machine/runs/seeds/task-start.ts`, `src/lib/server/machine/debug/routes.ts`.
  Test: rows in `tests/routes/sessions/compose.test.ts`, written by D20's repair round 1; a debug launch: `tests/routes/machine/debug.test.ts`, 'runs a debug launch only after its exact text is approved'.
```

## 15. Every edit to an existing assertion, allow list or predicate, with before and after

- `tests/checks/config/config.test.ts`, lines 101, 140 and 149: three `toEqual` literals of the local config. Before: no `riteDapBin` key. After: `riteDapBin: 'rite_dap'` added after the existing keys of each literal. The new key's default; no existing value changed.
- `tests/checks/config/config-folder.test.ts`, `CATALOG_FILES` (line 284). Before: the list holds the catalog files of the base. After: `'views/system/machine/debug.yml'` is added. The test asserts that the config folder holds exactly these catalog files.
- `tests/checks/tree/boundaries.test.ts`: the shell row (line 189) gains `'state/system/machine/debug/debug'`, the `SHELL_STORES` list (line 440) gains `'debug'`, and three doc comments (lines 138-141, 413) name them. Before: the shell may read the listed state modules and stores, none of them the debugger. After: the shell may also read the debug module `debug.ts` (the pure `debugKeyOf` that `shell/keys/keys.ts` resolves keys with, and the editor gutter's state types) and the `debug` store (its toolbar, questions and status bar item). No rule was widened for another path.
- `tests/checks/look/contrast.test.ts:71`, round 1: `measure('--on-c-orange', '--c-orange-hover')` added to `pairs()` after the `--on-c-*` loop, with a comment, and the head comment extended. Before: the pairs did not include the hover fill. After: the test measures it at the same 4.5 in every theme. No threshold and no existing pair changed; the file is outside the brief's write list and is the test of G26 (contrast), which the new token falls under.
- `tests/server/root/context-fixture.ts`: not an assertion; it gains the `riteDapBin` default, a `debug` client whose `spawn` throws, `debug` in the context and `debug.close()` in `close`.
- `tests/data/sources/config/local.test.ts`: two rows added to the `checkLocal` `it.each` table (G13), no existing row edited.

No allow list of the duplicate-code check, the unused-exports list, the comment-width check or a threshold was loosened or edited.
