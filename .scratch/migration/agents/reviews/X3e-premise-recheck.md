# X3e premise recheck against main 10ac00c69

X3e brief premise check against main at 10ac00c69. I changed nothing.

Since 8411697e8, seven commits touched `tools/oculus/src`, `tests`, `config`, `HELP.md` and `DESIGN.md`: D44 d7ff5fd3d, 57c6ba7e6, 8aa491caa, 61f253977, O30 3cb170eae, A3 09509b5b6 and E4 10ac00c69. `git diff --stat 8411697e8 HEAD -- <those paths> ':!tools/oculus/config/local.yml'` prints "296 files changed, 21969 insertions(+), 2365 deletions(-)". All numbers below come from main's tree. `plan.md` is modified in the working tree, but every plan.md line cited here has the same number in HEAD and in the working tree (`git show HEAD:...plan.md | grep -nE ...` and the same grep on the file).

## Claims no longer true

1. **Brief :45.** Claim: the dispatch checks that `git diff --quiet 8411697e8 <head> -- tools/oculus/src tools/oculus/config tools/oculus/tests tools/oculus/HELP.md tools/oculus/DESIGN.md` exits 0. Now: that diff holds 296 files (command above), so the dispatch check fails. Correct to: "read on main at 10ac00c69 … `git diff --quiet 10ac00c69 <head> -- …` exits 0". Every "read on main at 8411697e8" heading (:43, :45, :49, :97, :108) needs the same new base.

2. **Brief :49.** Claim: the list of premise files unchanged since 863cdc7d0, with `git diff --quiet 863cdc7d0 HEAD -- <file>` exiting 0 for each. Now the command fails for seven of them: `payloads.ts`, `commands.svelte.ts`, `pane-view.ts`, `auth.ts`, `core/git/run.ts`, `core/git/files.ts` and `picker.ts` (per-file loop of `git diff --quiet 863cdc7d0 HEAD`). They changed in E4, A3, O30 and D44 (`git log --oneline 863cdc7d0..HEAD -- <file>`). Correct to: remove those seven from the list and add a sentence naming D44, O30, A3 and E4 as landed after 8411697e8.

3. **Brief :97.** Claim: `run.ts`, `files.ts` and `picker.ts` are unchanged since 863cdc7d0, and the moved lines of `context.ts`, `context-fixture.ts` and `git.test.ts` are corrected below. Now: those three files changed (item 2), and `context.ts`, `context-fixture.ts` and `git.test.ts` moved again (items 17, 37 and 41). Correct to: name D44 (run.ts, files.ts) and O30 (picker.ts) as the commits that changed them.

4. **Brief :22 (Z440).** Claim: `sed -n 440,482p settings.ts` shows `PROBLEM_READERS` and `settingProblems`. Now: they are at :505-525 and :531-541 (`grep -n "PROBLEM_READERS\|export function settingProblems"`). Correct to: `sed -n 497,541p`.

5. **Brief :25 (Z443).** Claim: the `settingReader`/`valueProblem` grep printed :17 and :97. Now it prints :18 (the import) and :98 (`grep -n "settingReader\|valueProblem" settings.ts`). Correct to: ":18 and :98".

6. **Brief :39, :239, :516.** Claim: Z524 is at `plan.md:1248`. Now: :1257 (`grep -nE "^- Z524" plan.md`). Correct to: 1257.

7. **Brief :41, :240, :516.** Claim: Z527 is at `plan.md:1249`. Now: :1258. Correct to: 1258, and "plan.md:1257-1258" at :516.

8. **Brief :22.** Claim: Z440 is at plan.md :1171. Now: :1180. Correct to: 1180.

9. **Brief :58, :526, :672.** Claim: G31's Code line naming `fs/notes.ts` is `agents/guarded.md:63`, and its Test line is :64. Now: :69 and :70 (`grep -n "^- G31\." agents/guarded.md` prints 68). Correct to: ":69" and ":70", and "agents/guarded.md:69-70".

10. **Brief :60, Read 6 (:634).** Claim: `reorderEntries` is at `writes.svelte.ts:297`. Now: :342 (`grep -n reorderEntries`). Correct to: `:342`, and Read 6 to `writes.svelte.ts:335-350`.

11. **Brief :68, :143, :450.** Claim: `filesShape` is at `payloads.ts:108-110`. Now: :112-114, and E4's `appsShape` follows it directly at :116 (`grep -n filesShape`). Correct to: `:112-114`.

12. **Brief :68, :147, :458.** Claim: the commands follower is at `commands.svelte.ts:321-331`. Now: `afterReceive` at :322 and the `files` branch at :323-332 (`sed -n 318,340p`). Correct to: `:322-332`.

13. **Brief :68 (and decision 32, :603).** Claim: "Three followers read the payload's `root` alone". Now `grep -rn "'files'" src/lib` prints two more:
    - `state/sessions/latex.svelte.ts:355-358` and `filesMoved` at :389-400, which calls the shared `holds` (`latex.svelte.ts:51` imports it from `docs.svelte.ts`).
    - `state/sources/files.svelte.ts:85-89`, which marks every project's files query on any `files` message.

    Both predate 8411697e8 (`git diff --quiet 8411697e8 HEAD` on both exits 0). E4 adds a third: the app frames, through `state/system/apps/rules.ts:102-105` (`partOf`) and `apps.svelte.ts:281` and :341. Correct to: "Six followers read the payload…", naming them. Item C2 must also say what the LaTeX follower and the project files store do with `folders`. `holds` (`docs.svelte.ts:142`) is shared by three callers (docs, commands, latex), so changing it changes `latex.svelte.ts` (`grep -rn "holds(" src/lib`).

14. **Brief :70, :161, :188.** Claim: the watcher is built at `context.ts:362-367` (`make.watchGit(hub, {` at :363). Now: `startGit` at :396-401, `make.watchGit` at :397 (`grep -n "make.watchGit"`). Correct to: `context.ts:396-401` (`:397`).

15. **Brief :75.** Claim: `loadSourceDraft` is at `source.svelte.ts:292-301`, with `readIn === LIFETIME` at :300 and `reloadSource` at :360. Now: :300, :308 and :370 (`grep -n "async function loadSourceDraft\|readIn === LIFETIME\|async function reloadSource"`); the early-return line now reads `held.readIn === LIFETIME && held.file === file`. Correct the numbers to :300-309, :308 and :370.

16. **Brief :78, :159, :163, :24.** Claim: the write-token sentences are at `auth.ts:97` and :101, `tokenedBody` at :89-103 and `RefusalShape` at :78-82. Now: :98 and :102, `tokenedBody` at :90-104, `RefusalShape` at :79-83 (`grep -n "RefusalShape\|export async function tokenedBody\|missing or stale\|not JSON"`). Correct to those numbers. Z442 at :24 still names `auth.ts:97`; correct it to `:98`.

17. **Brief :79.** Several sub-claims:
    - (a) "13 call sites": `grep -rn "tokenedBody(" src/lib src/routes` now prints 15 besides the definition. A3 added `server/machine/schedules/routes.ts:249` (`handleSchedules`) and E4 added `server/machine/apps/routes.ts:104` (`handleApprovePost`). Correct to: 15.
    - (b) "`gatedBody` (:114)": its call is now `auth.ts:115`, with `gatedBody` defined at :111. Correct to: ":115".
    - (c) "18 routes in all": now 20 on the brief's own arithmetic (15 + 5).
    - (d) "`fs/picker.ts:97`": now :109.
    - (e) "the nine others": now eleven. Add `handleSchedules` (`server/machine/schedules/routes.ts:249`) and `handleApprovePost` (`server/machine/apps/routes.ts:104`); both pass only `{ headers: NO_STORE }`, so both answer the default sentences.
    - (f) "`handleTerminal` (`server/machine/pty/routes.ts:576`)": now :547.
    - (g) "`tests/routes/git/git.test.ts:61`": now :60 (`grep -rn "missing or stale" src tests config --exclude=local.yml`).
    - (h) "`configFor` read at `pty/routes.ts:266`, :336, :418, :461 and :657": now four reads, at :258, :328, :432 and :628 (`grep -n configFor`).
    - (i) "`terminal/+server.ts:30`": now :29.
    - (j) "`target()` (`writes.ts:226`)": now :242.

18. **Brief :81–82.** Claim: the layout's `showInFiles` is at `state/workbench/layout.svelte.ts:213`. Now: :204 (`grep -n showInFiles`). Correct to: `:204`.

19. **Brief :90, :106, :227-233 (H2).** O30 changed the picker numbers (`grep -n` over `picker.ts`):
    - `busy` at `picker.ts:105` → now :117.
    - `done.code !== 0` at :109 → now :125.
    - `osascript` at `picker.ts:68-79` → now :80-91.
    - `PickRun` at :45 → now :48.
    - `PickRunner` at :48 → now :51.
    - `PickerState` "`{ open: boolean }` (:51)" → now `{ open: boolean; ask?: PickAsk }` at :63.
    - `pickerState()` at :54 → now :66.
    - `PickDeps` at :59-62 → now :71-74.
    - `handlePick` at :91-116 → now :103-132.
    - The head comment at :9-16 → now :11-19.

    Correct those numbers. The `ask` member is item B1.

20. **Brief :106, :227, :541, :554.** Claim: `ServerContext.folderPicker` is `context.ts:138-139`, built at :462, and `close()` is :477-495. Now: the doc is at :164 and the field at :165; it is built at :554; `close()` runs :570-590 and now also calls `apps.close()`, `hpcSubmits.close()` and `held.schedules.close()` (`grep -n "folderPicker\|close(): void"`, `sed -n 570,592p`). Correct to: `:164-165`, `:554`, `:570-590`, "the field's doc at `:164`".

21. **Brief :106.** Claim: a server's `close` event calls `close()` at `server/root/process/serve.ts:43-47`. Now the block is :44-48 (`sed -n 40,48p`). serve.ts is unchanged since 8411697e8, so this number was already one off. Correct to: `:44-48`.

22. **Brief :106, :513, :674, :215.** Claims:
    - `context-fixture.ts:98` builds `folderPicker`: now :115.
    - `git: { refresh: noop … }` at `:58`: now :60 (`grep -n "refresh\|folderPicker" tests/server/root/context-fixture.ts`).

    Correct to: `:115` and `:60`.

23. **Brief :92, :148 (C3), :483.** Claim: "`PaneView.svelte:186-217` builds each tab, setting `file` from `shownFileOfTab(instance)`". Now O30 moved the tab's construction into the new `shell/panes/strip/strip-tab.ts`: `stripTab` at :30-60, `file: shownFileOfTab(instance)?.path` at :43, `StripTabFacts` at :22-28. PaneView.svelte now only maps the instances through `stripTab` at :179-183 (`sed -n 178,215p PaneView.svelte`; `cat strip-tab.ts`). Also `shownFileOfTab` is now `pages.ts:388`, not :389. Correct to: "`stripTab` (`shell/panes/strip/strip-tab.ts:30-60`, `file` at :43), called by `PaneView.svelte:179-183`". C3 then sets `gone` in `stripTab` through a new member of `StripTabFacts`. Add `tools/oculus/src/lib/shell/panes/strip/strip-tab.ts` to the paths; `shell/panes/strip` holds 7 items (`git ls-files … | wc -l`).

24. **Brief :92, Read 11 (:639).** Claim: `tabHint` is `pane-view.ts:421-427`. Now: :472-478, with its doc at :468-471 (`grep -n "export function tabHint"`). Correct to: `:472-478`, and Read 11 to `pane-view.ts:460-480`, `PaneView.svelte:175-185`, `shell/panes/strip/strip-tab.ts` whole.

25. **Brief :94.** Every number moved:
    - `settings.ts` (482 lines) → 541.
    - `settingReader` (:97) → :98.
    - The throw for a key with no rule (:110) → :111.
    - `PROBLEM_READERS` (:447-466) → :505-525, with E4's `appsSettings` inserted after `mailSettings`; `latexAutoBuild` is still last.
    - `settingProblems` (:472-482) → :531-541.
    - `settingFindings` (`catalogs.ts:217`) → :234; `const file` at :218 → :235; `sed -n 217,233p` → `sed -n 234,250p`.
    - `context.ts:288-289` → :321-322.
    - The findings at :308-318 → :342-352; `settingFindings` at :311 → :345.
    - `options.yml` (1280 lines) → 1354.
    - The `roots` entry (:1196-1204) → :1261-1269.
    - `sources.yml:` (:1077) → :1142.
    - `local.yml:` (:1205) → :1270.
    - Counts: `heading:` 135 → 143, `min:` 24 → 32, `whole:` 11 → 19.

    Commands: `wc -l`; `grep -n` over each file; `grep -c "^            heading:"` and the same for `min:` and `whole:`. Correct the numbers in place.

26. **Brief :186-187 (E1).** Claims:
    - `options.yml` `roots` at (:1196-1204), before `local.yml:` (:1205) → :1261-1269 and :1270.
    - `settingReader` (`settings.ts:97-101`) → :98-102.
    - `settingEntry` (:89-94) → :90-95.
    - `settingFindings` (`catalogs.ts:217-233`, :218) → :234-250, :235.
    - `PROBLEM_READERS` (:447-466) → :505-525.
    - `context.ts:311` → :345.

    `portfolio.ts:521` is still true.

27. **Brief :99, :207, :78.** `run.ts` (D44 added one vector line at :29 and two comment lines at :49-51; `grep -n` over run.ts, `grep -rn spawnSync src`):
    - `run` at `run.ts:145-179` → :148-182.
    - `spawnSync` at `:156` → :159.
    - `show` at `:130-132` → :133-135.
    - `readDiff` at `:135-137` → :138-140.
    - The import "`run.ts:79`" → :82.
    - 'git timed out' at `:164` → :167.
    - 'git failed' at `:168` → :171.

28. **Brief :219 (H1.8).** Claim: run.ts's paragraph is at `:71-73`. Now: :74-76 (`grep -n "A repository on a slow mount"`). Correct to: `:74-76`.

29. **Brief :78, :100, :103.** D44 added `keptFiles` at :64 in `core/git/files.ts` (`grep -n "^export\|refused(\|run(" files.ts`):
    - The `input` pass at `files.ts:38` → :39.
    - `ignoredIn` at :30 → :31.
    - `trackedFiles` at :50 → :51.
    - `fileLog` at :72 → :90.
    - The `fileLog` refusals at `:78, :79, :102, :116` → :96, :97, :120, :134.
    - The export list at :103 lacks `keptFiles` at :64.

30. **Brief :103.** Claim: "No test calls an on-demand read …" with the grep shown. Now `tests/server/machine/hpc/submit-files.test.ts:12` imports `keptFiles` and :72 passes it to `world(...)`. `keptFiles` is an on-demand read that H1.4 makes asynchronous under Z554. The brief's grep does not name `keptFiles`, so it still prints nothing. The callers outside `server/core/git` also gain:
    - `src/routes/api/(machine)/hpc/+server.ts:9` and :38 (`kept: keptFiles`);
    - `server/machine/hpc/submit.ts:100` (type `kept: (code) => Read<string[]>`) and :215 (`deps.kept(code)`, synchronous);
    - `tests/server/machine/hpc/submit-world.ts:21-33` (the `listed` stand-in returns synchronously) and :39 (`kept: SubmitDeps['kept'] = listed`);
    - `tests/server/machine/hpc/submit.test.ts:228` (`vi.fn(deps.kept)`).

    Command: `grep -rn "core/git/files\|keptFiles\|kept" src tests/server/machine/hpc`. Correct to: add these to the caller list and add `keptFiles` to the grep.

31. **Brief :102, :215, :101.** Claims:
    - `server/root/context.ts:371` passes `(root) => owned().git.refresh(root)`: now :405.
    - `tests/routes/git/git.test.ts:42` calls the refresh: now :41 (`grep -n refresh tests/routes/git/git.test.ts`).

    Correct to: `:405` and `:41`.

32. **Brief :105, :205, :605, :733, Read 21 (:649).** Claim: DESIGN.md's Git paragraph is `DESIGN.md:128` and the Watchers paragraph is :116. Now Watchers is :118 and Git is :130; :116 is now "The socket" (`grep -n "^\*\*Watchers\|^\*\*Git\." DESIGN.md`). Correct to: `DESIGN.md:118` and `:130`.

33. **Brief :733, Read 21 (:649).** Claim: HELP.md's Files, Repositories, Changes and `sources.yml` rows are at :121, :122, :141 and :278. Now: :130, :131, :150 and :299; line 121 is the `archive` row (`grep -n "^| \`files\` \|^| \`repositories\`\|^| \`changes\`\|sources.yml\` |" HELP.md`). Correct to: `HELP.md:130`, `:131`, `:150`, `:299`.

34. **Brief :108, :685.** Folder counts (`git ls-files <d> | sed … | cut -d/ -f1 | sort -u | wc -l`):
    - `views/sources/source` is 9, not 10 (full); D44 moved `read-again.ts` into `actions/`.
    - `state/system` is 8, not 7; E4 added `apps/`.
    - `server/root/watch` is 8, not 7; E4 added `apps.ts`.

    Correct to: remove `views/sources/source` from the full list (:108, :685), "`state/system` 8", "`server/root/watch` 8".

35. **Brief :123.** Claim: `ROW_OPEN_SIDE` is at `row-menu.ts:64`, :521. Now: :64, :286 and :523 (`grep -rn ROW_OPEN_SIDE src/lib`). Correct to: `:64`, `:523`.

36. **Brief :130, :363 (case 91).** Claim: "the route's answer for a body it does not know (`writes.ts:524`)", and case 91's `writes.ts:510`. Now: :573 (`grep -n "the body is not a write this route knows"`). Case 91 already disagreed with :130 before these landings. Correct both to: `writes.ts:573`.

37. **Brief :161.** Claim: `processesText` at `context.ts:422` and `liveSettings` at :410. Now: :506 and :494 (`grep -n "processesText\|liveSettings("`). Correct to: `:506`, `:494`.

38. **Brief :163.** Claims:
    - `target()` at `writes.ts:225`: now :242.
    - The member goes after `config` "at :96 in `WriteTarget` and :233 in `target()`" with "printed :94, :96, :225 and :233": now `WriteTarget` at :104, `config` at :106, `target(` at :242 and `config:` in `target()` at :256 (`grep -n "export type WriteTarget\|    config: \|function target("`).
    - "The nine routes": now eleven (item 17).
    - `git.test.ts:61`: now :60.

    Correct to those numbers.

39. **Brief :149 (C4).** Claim: `dismiss` is at `config/catalogs/glyphs.yml:34`. Now: :35, after D44's `submit_job` row (`grep -n "dismiss:"`). Correct to: `:35`.

40. **Brief :106 (H2 premise).** Claim: "The route … passes no connection", and `PickerState` is a flag. The route text is still true. But O30's `src/server.ts:58` now sets `context.folderPicker.ask = askParentToPick(parent)` when the server has a parent; `askParentToPick` is at `server/root/process/parent.ts:96-115`. Correct to: add that sentence (see B1).

41. **Brief :671, :670.** Claim: git.test.ts sentence assertions at `:61, :73, :208`, "beside D20's capitalised :125 and :145". Now: :60, :72 and :151. Only one capitalised D20 assertion is left, at :88. 57c6ba7e6 deleted the 'cancel ends the write in flight…' case, which held :125 (`grep -n "error: '\|toEqual({ error\|it('" tests/routes/git/git.test.ts`). Correct to: "`git.test.ts:60, :72, :151` … beside D20's capitalised :88".

42. **Brief :479 (paths) and :558.** Claim: `Source.svelte` "(the load effect at :347-355 only; the file is 528 lines, over the 520 rule, and D44 splits it…; `grep -n loadSourceDraft` printed :354)", and the folder is full. Now: D44 has landed. Source.svelte is 513 lines, the load effect is still there at :361-369, `loadSourceDraft` is at :151 and :368, and the folder holds 9 items (`wc -l`, `grep -n loadSourceDraft`, folder count). Correct to: "the load effect at :361-369 only; 513 lines".

43. **Brief :773 (Z553).** Claim: "`Source.svelte` is 528 lines, over the 520 limit, its folder at 10 items". Now: 513 lines and 9 items, and the effect stayed in `Source.svelte` after D44's split. Correct to: "D44 landed at d7ff5fd3d; the load effect stayed in `Source.svelte:361-369` (513 lines)".

44. **Brief :774 (Z554) against :420-519 (paths).** Claim: "X3e's paths gain … `submit.ts`, added at X3e's dispatch". Now: the "Paths this step writes" list names neither `src/lib/server/machine/hpc/submit.ts` nor the test helper whose type follows it (item 30). Correct to: add `tools/oculus/src/lib/server/machine/hpc/submit.ts` (the `kept` type at :100 and its await at :215) and `tools/oculus/tests/server/machine/hpc/submit-world.ts` (`listed`, :21-33). If the types require it, also add `submit.test.ts` and `submit-files.test.ts`, and run them under G43 (item 49).

45. **Brief :526.** Claim: "`HELP.md` and `DESIGN.md` are not in this list: A3 and D44 write them beside this step". Now A3 and D44 have landed (`queue.md`, "Landed"). The steps that now write them beside X3e are D23 (HELP.md and DESIGN.md lines, `D23.md` paths), D45, E4g (HELP.md :210-221, :21, :82; DESIGN.md :79-80) and O30b (DESIGN.md :38-81, :436). Correct to name those.

46. **Brief :532-561 ("Shared with the steps in flight").** Claim: the steps in flight are A3 and D44, both building from 378c5b60e. Now: A3, D44, O30 and E4 have landed. `queue.md` shows "In flight (0 of 6 slots)" and queues E4g, O30b, Q123, Q124, D23 and X3e "now", and D45 "at the first free slot". Every region in this section is obsolete, including A3's settings.ts append and context.ts regions and D44's run.ts, files.ts, context.ts and Source.svelte regions. The overlaps the section must now judge, from each brief's "Paths this step writes":
    - **D23** (`briefs/D23.md`, committed): `server/root/context.ts`, `tests/server/root/context-fixture.ts`, `server/core/auth.ts` (`carriesToken`), `views/sources/files/sections/Outline.svelte` and `Sections.svelte`, `state/workbench/palette.ts`, `shell/keys/Palette.svelte` plus two new `shell/keys` files (`palette-modes.ts`, `ChoiceRows.svelte`; shell/keys goes from 7 to 9, and X3e's `PaletteCommands.svelte` would make 10), `shell/panes/PaneView.svelte`, `config/text/app.yml` (the `palette` group, ":17 onward"), `files.yml`, `source.yml`, `glyphs.yml`, `icons.yml`, `options.yml`, `Source.svelte`, HELP.md and DESIGN.md.
    - **D45**: `settings.ts` (`PROBLEM_READERS`), `pty/routes.ts`, `row-menu.ts`, `palette.ts`, `files.yml`, `options.yml`, `Source.svelte`, `commands.svelte.ts` :31, and `state/sessions/latex.svelte.ts`, which it moves to `state/sessions/latex/`. That file is a `files` follower using `holds` (item 13).
    - **O30b**: `src/lib/server/root/watch/git.ts` (adds `.svelte-kit-app` and `build-app` to `IGNORED` at :80, `O30b.md` item 4), `vite-plugin.ts`, `src/server.ts`.
    - **E4g**: `HELP.md` and `DESIGN.md` lines, `app.yml` line 12.
    - **Q123**: `pty/channel.ts` and `sessions.ts`, not X3e's.
    - **Q124**: `tests/tiers/*`, `package.json` scripts and `vite.config.ts` (verify 1's `test:quick` script).

    The E4g, O30b, Q123 and Q124 briefs are untracked files in the working tree (`git status`), not on main.

47. **Brief :537.** Claim: the group-heading grep "printed :8, :16, :19, :50, :72, :83, :85, :97, :99". Now: :8, :16, :19, :50, :72, :83, :85, :97, :99 and :102. O30 added the group `server.start` at :99-101, and `task:` moved to :102 (`grep -n "^        [a-z_]*:$" config/text/server.yml`). Correct to: add `:102`.

48. **Brief :563-568 ("Steps not in flight").** Claims:
    - "D45 (waiting, …)": now "at the first free slot (its brief rechecked on main)" (`queue.md`).
    - D28's context.ts lines "main's :363" and "main's :477-495": now :397 and :570-590.
    - "O30 (queued, once X3e has landed …) … O30 lands after X3e and builds on that text": O30 landed at 3cb170eae, before X3e, with `PickerState = { open: boolean; ask?: PickAsk }`. X3e now builds on O30's text (B1). The cites `O30.md:139` and `:286` no longer hold the lines described (`sed -n 139p` and `286p O30.md`).
    - "E4 (queued, once X3e has landed; `E4.md:211`) … lands after X3e": E4 landed at 10ac00c69 (`queue.md`), and `E4.md:211` is now a case line.

    Correct to: say O30 and E4 have landed and what X3e takes from them (B1, B3).

49. **Brief :699 (verify 4).** Claim: the named list of guarded tests. Now:
    - G1's Code line adds "approve", and its Test line adds `tests/routes/apps/approve.test.ts`, 'refuses a request without the write token' (`grep -n "^- G1\. " -A2 agents/guarded.md`).
    - G43's Code line names `keptFiles` in `src/lib/server/core/git/files.ts` and `hpc/submit.ts`, with tests `tests/server/machine/hpc/submit.test.ts` and `submit-files.test.ts`.
    - G41's Code line names `git-write.ts`, `deposit-git.ts` and `git-routes.ts` (`tests/server/core/git-failure.test.ts`).
    - G44's names `git-index.ts` and `git-routes.ts`.
    - G49's names "the write route's app gate" (`tests/routes/edit/app-gate.test.ts`), which reads `rootsWrite`/`rootsShape` through `server/edit/writes/app-gate.ts:42`, :83.

    Correct to: add `tests/routes/apps/approve.test.ts` under G1, and G41 (`git-failure.test.ts`), G43 (`submit.test.ts`, `submit-files.test.ts`), G44 and G49 (`tests/routes/edit/app-gate.test.ts`, `tests/server/edit/app-store.test.ts`).

50. **Brief :597 (decision 26).** Claim: "nine handlers, four route files" and "(b) changes all 18 routes". Now: eleven handlers (item 17) and 20 routes on the same count. Correct the numbers and add `handleSchedules` and `handleApprovePost` to the handler list.

51. **Read list.** Each range has moved:
    - Read 9 (:637): `payloads.ts:100-130` still covers `filesShape`. `context.ts:270-320` and `:355-375` → `:303-353` and `:390-410`. `commands.svelte.ts:315-335` → `:315-340`.
    - Read 12 (:640): `source.svelte.ts:175-215` and `:285-375` → `:181-221` and `:293-385`. `Source.svelte:335-360` → `:355-375`.
    - Read 19 (:647): `catalogs.ts:195-235` → `:220-252`. `options.yml:1185-1210` → `:1250-1275`.
    - Read 22 (:650): "the nine handlers" → eleven.
    - Read 26 (:654): `files.ts` whole now includes `keptFiles`.
    - Read 27 (:655): `context.ts:125-145` and `:455-497` → `:155-170` and `:545-592`. `context-fixture.ts:50-100` → `:50-117`.

52. **Brief :743, :750, :764 ("Changes from the brief check").** These are stale numbers from older bases, already wrong at 8411697e8:
    - Item 5 says the paths take the `<ul>` at :266, the `<li>` at :276-288 and the style block at :351-379. They are now :271, :281-293 and :356-384 (`grep -n` over `Tree.svelte`).
    - Item 12 says the `<li>` is :276-288.
    - Item 26 says `Repo.svelte:130-132`; it is now :133-135 (`grep -n "repositories.merging"`).

    Correct to the current numbers, or state that these items record the numbers of their own base.

## Claims a landing changed by more than a number

**B1. O30 (3cb170eae): the folder panel has a second path (H2, G42's five rows, D17).**

What changed: `PickerState` is `{ open: boolean; ask?: PickAsk }` (`picker.ts:63`). `handlePick` skips the platform refusal when `ask` is set (`:114`) and, with `ask`, answers from the parent's sheet instead of osascript (`:120-123`); a cancel there answers ok with `[]`. In the desktop app, `src/server.ts:58` sets `ask`; `askParentToPick` (`server/root/process/parent.ts:96-115`) sends `pick-folders` and has no cancel message.

What it means for X3e:
- H2's `{ panel: AbortController | null }` must keep `ask`.
- The busy check moves from `state.open` to `state.panel`.
- H2 must say what a closed connection or a closed ServerContext does to a sheet the parent shows. An abort cannot end that sheet today, so G42's rule ("a folder panel lives no longer than the request that opened it") would hold only for osascript. Making it hold for the sheet needs `parent.ts` and `src/desktop/` (O30b writes `src/desktop/`), which are outside X3e's paths.
- This is a decision for the orchestrator before dispatch: widen the paths, or rule G42 to the osascript path.
- `picker.ts`'s head comment is now :11-19 and already describes `ask`, so H2's rewrite must keep that text.

**B2. Z442/D5: two more routes answer the token sentence.**

A3's `handleSchedules` (`server/machine/schedules/routes.ts:244-250`) and E4's `handleApprovePost` (`server/machine/apps/routes.ts:99-105`) answer the default sentences. X3e must also touch:
- `server/machine/schedules/routes.ts` (`SchedulesRouteOptions` :51-64 carries no configuration);
- `src/routes/api/(machine)/schedules/+server.ts`;
- `server/machine/apps/routes.ts` (`routeOptions(server, config)` at :64 already takes `config`);
- the tests that call these handlers: `tests/routes/machine/schedules.test.ts`, `tests/routes/apps/approve.test.ts`, and `tests/server/machine/schedules/file.test.ts` and `record.test.ts` (`grep -rln "handleApprovePost\|handleSchedules" tests src/routes`).

None of these is in the paths, and none asserts the sentence (`grep -rn "missing or stale" tests` prints three lines).

**B3. E4 (10ac00c69): the `files` payload is now a documented app contract (C0, C1, Z439).**

What changed: DESIGN.md:323 says "`files` is the notice `{ root, bookmarks? }` (`model-sessions.ts:672`, `watch/git.ts:237`, `watch/bookmarks.ts:76`) … the bookmarks notice (`root: ''`) reaches machine apps only". `config/text/views/apps/apps.yml:34` and :41 (`apps.read.files`, `apps.read_root.files`) word what an app is told. Apps receive the payload through `state/system/apps/rules.ts:102-105`, which filters a root app by `notice.root === dir`, and `apps.svelte.ts:341`.

What it means for X3e: C1's `folders` and the new `{ root: '', workspaces: true }` notice reach apps. The brief must:
- add DESIGN.md:323 to the Doc text section;
- decide whether a machine app is told of `workspaces` notices (`rules.ts` and `apps.yml` would be new paths if so);
- read Z439's ruled shape against this contract.

**B4. O30: where a tab is built (C3).** The `Tab` is built in `shell/panes/strip/strip-tab.ts` (item 23), so C3's `gone` lands in that file and in `StripTabFacts`, not in `PaneView.svelte:186-217`. D28's brief (`D28.md` paths, "`PaneView.svelte` (`deleted` beside `dirty`, X3f :212)") has the same stale target.

**B5. D44 (d7ff5fd3d): `keptFiles` is a new synchronous on-demand read (H1.4, Z554).** It is called through an injected dependency: `src/routes/api/(machine)/hpc/+server.ts:38` passes `kept: keptFiles` to `submit.ts`, which calls `deps.kept(code)` synchronously at :215. G43 covers it, and its tests construct a synchronous stand-in (`submit-world.ts:21-39`) and pass `keptFiles` itself (`submit-files.test.ts:72`). Making it asynchronous changes the `SubmitDeps.kept` type and those test files (item 30). The route file needs no change.

**B6. Followers the brief did not count (C2, decision 32).** The LaTeX follower `state/sessions/latex.svelte.ts:355-400`, which uses the shared `holds`, and the project files store `state/sources/files.svelte.ts:85-89` predate 8411697e8. They would re-read once per throttle window under C1's `IGNORED`-folder messages, which decision 32 exists to prevent. Changing `holds` changes `latex.svelte.ts`, which is not in the paths and which D45 moves to `state/sessions/latex/`. That is a collision to judge in the shared-paths section.

**B7. O30b (queued "now"): `IGNORED` gets two names.** O30b rewrites `IGNORED` (`watch/git.ts:80`) to add `.svelte-kit-app` and `build-app`. The list at brief :69 then grows. The merge is simple only if X3e leaves :80 alone.

**B8. A3 (09509b5b6) and E4: what `context.ts` holds now (H2, E2, D5).** `close()` (:570-590) now also closes `apps`, `hpcSubmits` and `held.schedules`. The git watcher is built by `startGit` (:396-401) beside the new `startSchedules` (:415-439) and the `apps` watcher (:443-449). `closePicker` and the watcher's `depth` and catalog go into that text. The brief's "not simple at `close()`" against A3 and D44 is settled; both have landed.

**B9. A3: no new setting reader.** A3 did not add a reader after `latexAutoBuild`, and does not rewrite `heldAt`, as the brief's :539 expected; settings.ts's diff since 8411697e8 holds only E4's `closedPaths` and `appsSettings`. E1's depth reader joins `PROBLEM_READERS` (:505-525) with E4's `appsSettings` already inside it, and D45 (`settings.ts`, `PROBLEM_READERS`) is now the step that shares this region.

**B10. 57c6ba7e6: test cases deleted.** It cut `settings.test.ts` from 585 to 533 lines (its synthetic catalog `DEFAULTS` is now :45-81), deleted the 'cancel ends the write in flight…' case from `git.test.ts`, and deleted `value-rule.test.ts`, `editor-options.test.ts` and `tree-keep.test.ts`. The brief names none of the deleted files. G13's settings row is "one case per setting reader" (`guarded.md` G13 Test line), which matches the brief's :667.

## Unchanged

289 claims checked and found true. The count is a hand tally of the checks run above, not a script's output. Among them:
- every claim on the 100 cited files that `git diff --quiet 8411697e8 HEAD` shows unchanged and that I spot-checked (dragging, Tree, place, roots, bodies, config-write, fs, list-edit, notes, collection, entries, the Files sections, files-view, fs.svelte, ops, the whole of watch/git.ts, docs, fs-history, the git reads, autofetch, lines, git-routes, parse, running, server.yml's groups, app.yml's palette group, the views of section D, files.yml, Repo.svelte, picker.test.ts, vite-plugin, app.d.ts);
- the existence of 44 test files the brief names;
- spec.md :48, :64 and :97;
- G42 at `guarded.md:28-30`;
- the 62 `failed(` literals and their per-file counts;
- the `json({ error })` literals;
- the absence of read-path sentences in tests;
- 23 of the 26 folder counts;
- the ancestry of e6d00fb0f, 722a287a7, 30b4ddced and 863cdc7d0, and that b68058ce4 is not an ancestor;
- `plan.md:196` and the other plan.md lines cited;
- quick.mjs's last-line format;
- the lucide `target.svg` and the missing `head` glyph.

Usage: model Opus 5.5 (claude-opus-5-5); tokens, tool uses and time not measured here.

Usage: a3197582441fe32df, claude-opus-5-5, 379,052 tokens, 142 tool uses, 17.6 min.
