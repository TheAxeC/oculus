# Step D77 brief check (on main at 7fa484997)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/D77.md`. A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A line of code or a hit of a grep keeps its `file:line`.

Commands ran from `/Users/axelfaes/workspace/research-hub/tools/oculus` unless stated. Every `git grep` excluded `local.yml`. Nothing was changed.

## 1. Names

- `commit_message_account`: `git grep -n "commit_message_account" -- . ':!*local.yml'` (from the hub root). Hits only under `.scratch/` (plan.md:797,1990,1992; choices.md:9; orchestrator-history.md:7-9). No hit outside the paths.
- `--no-session-persistence`: same grep form. Hits only under `.scratch/` (S2-landing.md:27, S2-refuter.md:187, plan.md:797,1982). No hit outside the paths.
- `go-back`, `go-forward`, `toggle-left-dock`, `toggle-bottom-dock`, `toggle-right-dock`: same grep form. Hits only plan.md:1991 and an unrelated D21.md:82. No hit outside the paths.
- `titleBarStyle`, `trafficLightPosition`, `app-region`: same grep form. No hit.
- The term "title bar": `git grep -n -i "title bar\|titlebar" -- src config docs HELP.md DESIGN.md README.md ':!*local.yml' ':!docs/diagrams/*'`.
  - `src/desktop/app.ts:77` "The title bar, the sheets and the dialogs the app shows follow the page's dark theme." This file is on the list, and the change makes the comment false, since the app will draw no native title bar.
  - `src/lib/shell/window/desktop-windows.svelte.ts:18-21,32` (`titleBar()` = outerHeight - innerHeight) and `src/lib/shell/panes/floats/window-bounds.ts:4,24`. Both are outside the list. With the native bar hidden the difference becomes 0, so the sentences and the code stay true.
  - `config/text/ui.yml:27` `editor_actions_title_bar: Title Bar`, `src/lib/shell/panes/pane-view.ts:300,380`, and `src/lib/ui/frame/Pane.svelte:162,167` ("titlebar strip" for the pane header). All are outside the list. They are not made false, but after the step "Title Bar" names two things: the pane head of the Editor Actions Position setting and the new window strip. In VS Code, the `titleBar` editor-actions place is the window title bar, which oculus will now have.
  - `src/lib/views/apps/Apps.svelte:32` and `src/lib/views/sources/repositories/Repositories.svelte:69` mean a view's own title row. Not false.
- `SessionAgent` (gains `agentId`): `git grep -n "SessionAgent\b" -- src tests ':!*local.yml'`.
  - Outside the list and still true: `src/lib/data/model/index.ts:609`, `src/lib/data/model/model-agents.ts:6,141`, `src/lib/state/client/selectors.svelte.ts:80`.
  - Related code outside the list: `src/lib/server/sessions/fold.ts:245-256` is where a call that ran to its end is ended (`agent.ended`, `status`, `resultChars`, `tokens`). That is where the completed call's `toolUseResult.agentId` must be taken, and the list names only `record.ts` and `stores/`.
  - `src/lib/server/sessions/cache.ts:24-29` says `CACHE_VERSION` (6) is "Bumped by any change to the accumulator's shape, or to what a record reads out of it". The change makes that false unless the version is bumped, and `cache.ts` is not on the list.
- `pinnableAreas`: `git grep -n "pinnableAreas" -- src tests ':!*local.yml'` hits `selectors.svelte.ts:169` (the store type) and `:668` (the returned object). Both are outside the list's "lines 520-560". They become false if the selector's shape changes or a hub-grouped selector is added beside it.
- The new local key (`LOCAL_KEYS`, `LocalConfig`). Hits outside the list:
  - `src/lib/server/root/process/context/machine-defaults.ts:35-66` holds "The default of each key of the file, by the key" (the Settings view's default column). It is incomplete without an entry for the new key.
  - `src/lib/data/sources/config/machine.ts:1-7,104-132` is where every hub's `accounts:` rows are joined. A label check against the accounts the server uses has to run here, after the join, and the file is not on the list.
  - `src/lib/data/sources/config/catalogs.ts:261-293` (`localText`, `localFindings`) says "a finding never holds a value the file holds, a label or the parser's text". The required finding "naming the key and the label" makes that false.
  - `config/text/findings.yml:121-134` holds the local.yml finding sentences (`findings.config.*`). The brief names `config/text/server.yml` for "the finding's sentence".
  - `src/routes/api/(git)/git/+server.ts:15-29` builds `GitOptions` from `server.local.claudeBin`. The account has to pass through here too.
  - Test fixtures with `LocalConfig` literals (`git grep -ln "riteDapBin" -- tests`): `tests/routes/apps/app-private.test.ts`, `tests/server/root/config-cache.test.ts`, `tests/server/root/context-fixture.ts`. They break only if the new field is required.
- The `Pages` shape (gains an optional list): `src/lib/state/workbench/layout/saved/saved.ts:9` ("The envelope is `{ version, pages, current, floats, kept }`") and `layout/model.ts:204-209` (the `LAYOUT_VERSION` comment listing the envelope) become incomplete. Both are under `state/workbench/`, which the list names "for the navigation history and the hidden docks".
- The Transcript instance state (gains `agent`): `src/lib/state/workbench/layout/instance.ts:237-252` (`stateId`) says "a session or terminal pin uses `session`". With `{ session, agent }` an agent's tab and its session's tab would be one instance. The file is outside the stated purpose of the list's `state/workbench/` entry.

Findings:
1. `cache.ts:24-29` is made false (CACHE_VERSION not bumped), and `cache.ts` is not on the list.
2. `fold.ts:245-256` is the place the completed call's agent id is taken, and it is not on the list.
3. `selectors.svelte.ts:169,668` lie outside the listed line range.
4. `machine-defaults.ts` has no default for the new key.
5. `machine.ts` (the cross-hub label check) is not on the list.
6. `catalogs.ts:291-293` is contradicted by "naming the label".
7. `findings.yml` is the catalog of local findings, and the list names `server.yml`.
8. `routes/api/(git)/git/+server.ts` is not on the list.
9. `instance.ts:243-252` gives an agent tab its session tab's identity.
10. `app.ts:77` becomes false (it is on the list).
11. The two meanings of "Title Bar" (`ui.yml:27`, `pane-view.ts:300`) are not addressed.

## 2. The step line

- (1) The flicker found, its cause confirmed by a run before the fix, and ended: item 1 (the diagnosis's cause; the red command run on the unchanged tree first, Verify 4). Step 0's pending flash: item 1, second half.
- (2) `--no-session-persistence`, so no transcript is written and the Sessions view lists no such session: item 2, bullet 1. The account named by `commit_message_account` (Z888) by its `accounts:` label: bullets 2 and 3. Empty or absent means `~/.claude` with `CLAUDE_CONFIG_DIR` removed as the terminals remove it: bullet 3. A label no `claude` row holds is a finding and the default is used: bullet 4.
- (3) The composer's New worktree choice beside its folder, made by the Repositories view's New worktree code, the session starting in the new worktree: item 3, bullets 1 to 3.
- (4) Pin offers every project of every hub, grouped by hub, beside the areas it offers now: item 4.
- (5) A press on an agent row opens that agent's transcript in a Transcript tab, read under the session transcript's rules: item 5, bullets 1 to 3.
- (6) Title bar: back and forward, the Command Center opening the palette, the layout toggles, the native bar hidden with the window buttons kept in the app, and the same strip in the browser: item 6, bullets 1 to 5.
- (7) Values and the outcome sentence at `--fs-sm`, labels at `--fs-xs`: item 7.

Findings: none.

## 3. Premises

- Brief line 18 says D73 changed `DESIGN.md`, `HELP.md`, `options.yml` and `docs/templates.md`, and that no other file the brief cites by line changed with D73.
  - `git diff --name-only 756940b59 7fa484997 -- src config`, crossed with the files the brief cites, prints only `tools/oculus/config/catalogs/options.yml`.
  - `git diff --name-only 756940b59 7fa484997 -- docs HELP.md DESIGN.md` also lists `docs/palette.md` (cited by line at brief line 48), `docs/apps.md` and `docs/diagrams/*`. Differs.
- `claude_bin` at `options.yml:1400` and `# claude_bin: claude` at `docs/templates.md:128`: `sed -n 1398,1402p`, `sed -n 126,130p`. Match.
- `Transcript.svelte`: `awk` of lines 52, 72, 77, 80, 82, 94, 166, 167 prints `const record = $derived(sessionFor(instance.id));`, the comment at 77-79, `$effect(() => showing(record?.id ?? ''));` at 80, the effect at 82-94, and `{:else if turns.length === 0}` at 166-167. `grep -n pending` exits 1. Match.
- `entities.svelte.ts:28,41` (`$state({})`, `messages[message.channel] = message`) and `transcript.svelte.ts:199-208` (the release calling `forget(id)` at 207): Match.
- `git-message.ts` is 114 lines; no `env` option at :98; args at :93.
  - `run()` spans 85 (doc comment) to 114, against the brief's 85-113. `suggestMessage` is declared at :54, against the brief's 56. Small offsets.
  - `claude --help | grep -n no-session-persistence` prints `142: --no-session-persistence ...`. Match.
- `suggestFor` at `git-routes.ts:294-310`, called at :434, `claudeBin` at :193-194: Match.
- `compose.ts`:
  - `ACCOUNT_ENV` :61, `defaultAccountDir` :67, `agentAccounts` :75 and `accountEnv` :133-142 match. `accountFor` is declared at :111 (doc comment at :110), against the brief's :112.
  - `accountEnv` is already `export function` (:133). For the default folder or no account it answers `{ prefix: ['env', '-u', variable], env: {} }` (:138-140), an argv prefix, not an environment without the variable. The brief assumes an export is needed ("only to export what part 2 reuses"; decision 5).
- `local.ts`: `LOCAL_KEYS` :145-167, `PROGRAM_KEYS` :401-406, `readLocalText` :445-517 (problem `wrong(key, 'a non-empty string')` at :479) and `localDefaults` :181-193 (labels `claude` and `codex`) match.
- The options catalog at `options.yml:1419-1430` and the template at `docs/templates.md:140-151`:
  - `git show 756940b59:... | grep -n` prints `1419: claude_bin:`, `1428: accounts:`, `146:# claude_bin`, `151:# accounts:`. These are the pre-D73 lines.
  - At 7fa484997: `claude_bin` :1400, `accounts` :1409-1418, template :128 and :133-136. Differs, and contradicts the brief's own line 18.
- "D73 adds the key-set test that holds the template's keys equal to `LOCAL_KEYS`": `templates.test.ts:67` 'shows every local.yml key of the options catalog in the local.yml template, and no other' compares with the options catalog (G83). `git grep -n "LOCAL_KEYS" -- tests` prints nothing. Differs.
- Composer and repositories:
  - `Composer.svelte` (501 lines): :99, :101, :102, the `WorkspacePicker` at :338-344, the branch at :345-350 and `start()` at :223-264 match.
  - `branchOf` at `composer.ts:376-388` matches, but it returns the branch, never the root. The brief's "the root `branchOf` finds" needs a helper of its own.
  - `Repositories.svelte:307-318`, `repositories.svelte.ts:481-486` (with `act` at :263-270 answering only `ok` and the sentence going to `say`), `git-write.ts:558-571` and `worktrees.ts:30-32,39-43` match.
- `pinnableAreas` at `selectors.svelte.ts:536-559` (:543 `hubOfProject(project) !== workspace`), `DetailsBody.svelte:122-126,153,237` (`pin_scored`), `Select.svelte` (84 lines, no groups) and `group.ts:155-164`: Match.
- `AgentRows.svelte` (130 lines, `TreeItem` at :93-109 with no press) and `model-sessions.ts:23-37`: Match.
- The subagent file layout: `background.ts:6,129-133` holds `join(dirname(acc.path), acc.id, 'subagents')` and `agent-${agentId}.jsonl`. Match. `takeLaunch` at :74-77 matches. `fold.ts:247-256` keeps no agent id for a completed call. Match.
- "seen in `~/.claude-backup/projects/effort-probe-proj/*.jsonl`": `ls ~/.claude-backup/projects/effort-probe-proj` prints "No such file or directory". `ls ~/.claude-backup/projects/ | grep effort-probe` prints `-private-tmp-claude-502--Users-axelfaes-workspace-ordo-6266a558-ed92-43a1-ac08-9bf8f4bc78a8-scratchpad-effort-probe-proj`. Reading that folder was refused by the permission system. Differs (the path); the content is not verified.
- The transcript route (`transcript-routes.ts:5-7,46-54`): Match. `ls tests/server/sessions` prints `overrides.test.ts transcripts.test.ts usage-sessions.test.ts`, so the G84 test file is new.
- `windows.ts:337-354`, with no `titleBarStyle`, and `app.ts:77-78`: Match.
- `Workbench.svelte` is 520 lines, with :281, :363-365, :371, :377, :382, :423 and :451-461. Match. 520 is the component limit of the rules file ("What every package obeys"), so any added line forces a split, which the brief does not say.
- `model.ts:147-158,184-189`: Match.
- `git grep -n -i "go_back\|goBack\|history_back" -- src config ':!*local.yml'` prints nothing (exit 1). Match.
  - The brief's command has no `':!config/local.yml'`, which the state file's standing order asks of every grep over `config/`. git grep reads no untracked file, so nothing was read.
- `palette.ts:110,493-494`, `workbench-keys.svelte.ts:268`, `CommandRows.svelte:142`, `resolve.ts:179` and `chords.ts:69`: Match.
- `docs/palette.md` lines "93-120 at 756940b59": at 756940b59 `## Colon commands` is :87 and `:folder` is :113. At 7fa484997 they are :94 and :120. The label "at 756940b59" is wrong; the numbers are head's.
- `tokens.css:136-138` (11, 12, 13 px) and `themes.css:737-739` (10, 11, 12 px, under `body.rice`): Match.
- "a component may hold 520 lines (`utils/size-check.sh`)": the script refuses above 540 and 900 (`over = ($1 > 900 || ... $1 > 540)`); 520 and 880 are the rules file's lines.
- Folder counts: `git ls-files <dir> | cut -d/ -f1 | sort -u | wc -l` gives:
  - 10 for `src/lib/state/workbench`, its `layout/` and its `navigation/`;
  - 10 for `src/lib/state/sessions`, `src/lib/server/sessions`, `src/lib/ui/forms/choice`, `src/lib/shell/keys` and `src/lib/shell/keys/rows`;
  - 9 for `src/lib/shell`.
  - The brief's "a new subfolder when a folder is full" for `state/workbench/` makes 11 there, so the history and hidden-dock files force a regrouping of existing files that the brief does not name.

Findings:
1. Brief line 18: D73 also changed `docs/palette.md`, which the brief cites by line.
2. Brief line 28: `options.yml:1419-1430` and `templates.md:140-151` are pre-D73 lines. They are now 1400-1418 and 128-136.
3. Brief line 28: the D73 key-set test compares the template with the options catalog, not with `LOCAL_KEYS`.
4. Brief line 39: the cited transcript path does not exist.
5. Brief line 48: "at 756940b59" is wrong. The colon table is 87-113 there and 94-120 at head.
6. Brief line 27 and the list: `accountEnv` is already exported, and its removal form is an argv prefix.
7. Brief line 31: `branchOf` returns no root.
8. Brief line 53: 520 is attributed to `size-check.sh`, which holds 540. The full folders and Workbench.svelte at 520 are not stated.
9. Brief lines 25 and 27: small line offsets (`suggestMessage` :54, `run()` 85-114, `accountFor` :111).
10. Brief line 47: the grep over `config/` lacks the local.yml exclusion.

## 4. Cases and checks

- Case 1:
  - The harness is kept out of the worktree and run on a scratch copy of the base. That is consistent with the rules file's test rule and its `*.client.test.ts` rule.
  - The expected after-change output is wrong. "every case drawing `2 turns` at each flush and asking `from=0` once" does not hold for other 4, which asks s1, s2, s1 at `from=0`, for other 5 (`gone:` draws the pick sentence; asks `from=0` twice) or for other 6 (asks twice). This is per the diagnosis record's "Fix and test" output.
  - Adjusting other 4's expected `seen` makes the unchanged-tree run 8 failed and 4 passed, not the stated `7 failed | 5 passed (12)`, unless two different harness texts are run.
  - Other 5's `back:` line shows the same pending flash and is unasserted.
- Cases 2 and 3: consistent (runs, no kept test).
- Cases 4, 5, 6, 8 and 9: consistent.
- Case 7: inconsistent.
  - (a) "a finding naming the key and the label" contradicts `catalogs.ts:291-293` and the existing G13 row `tests/data/sources/config/local.test.ts:170` 'words each problem against local.yml with no value of the file in it', which asserts that an account label never appears in a finding. Changing that assertion is an edit the rules file ("What every package obeys", the rule on edited assertions) makes a finding. The rulings (the plan line and Z890) say only "a finding naming the key".
  - (b) "or the route's test": the git route is no unit of G13's Code line (`agents/guarded.md`, G13). The rules file's test rule allows a test only for a unit its entry names.
- Cases 10, 12, 13, 14 and 16 to 24: consistent.
- Cases 11 and 15 ask the builder to check places the step does not change:
  - Case 11 asks for the server's refusal sentences of `createWorktree` (`git-write.ts:558-571`, unchanged). With the send stubbed, the sentence is the stub's.
  - Case 15 rests on the overrides writer and `forcedWorkspace` (`group.ts:155-164`), both unchanged.
- Case 25: "G29 or G8 ... when an existing row covers the saved layout". Neither G29's text ("read with every page and tab kept") nor G8's (write kinds) covers a hidden edge, so the condition is never met. The builder is left to judge.
- Case 26: consistent with "No migration code" only because the brief makes absence the written form of "none hidden". The tree reads `locked`, `added` and `documents` the same way (`saved.ts:16-20`).
- Case 27: consistent.
- Brief "Decisions taken in this brief" 4 ("an older published record has none and reads as empty ... (no migration code)"): the sessions cache is stored data under `~/.oculus`. Reading a cached accumulator without `agentId` as empty tolerates an older form, which the rules file's "No migration code" forbids. The tree's own rule is to bump `CACHE_VERSION` (`cache.ts:24-28`).
- Brief "Verify before you report" item 1:
  - `npx vitest run tests/checks` is the tree-checks suite (`package.json:16` `"test:checks": "vitest run tests/checks ..."`), a whole-suite command that the rules file's "Token discipline" makes a review finding.
  - The ASCII gate it dictates is the `grep '[^ -~]'` form, which the rules file's ASCII gate paragraph says the perl form replaces wherever a brief names it.
- Brief "Paths this step writes" limits `DESIGN.md` to "the sentences the step makes false". The rules file ("What every package obeys", the paragraph after a name change) asks for "a decision with its reason into DESIGN.md", so the brief's five decisions would not reach it.

Findings:
1. Case 1's expected after-change output and failure count are inconsistent with the diagnosis record.
2. Case 7 contradicts `catalogs.ts:291-293` and an existing G13 row, and offers a test file outside G13's Code line.
3. Decision 4 contradicts "No migration code" and `cache.ts:24-28`.
4. Verify 1 asks for a whole-suite command and the replaced ASCII gate form.
5. The DESIGN.md scope of the write list is narrower than the rules file asks.
6. Cases 11 and 15 check places the step does not change.
7. Case 25's test condition can never be met.

## 5. The question

The goal is the part of the plan's goal D77 delivers: parts (1) to (7) of its line, in the app and the browser.

- Case 1: no. It runs the real view on the client runtime, red without the fix. The "jumps" half (scroll) is not measured by it.
- Case 2: yes. A unit run of the store alone never re-runs the view's hold effect, where the defect is, so it passes on the unchanged tree.
- Case 3: yes. A store-only run of the release passes on the unchanged tree. The harness's other 4 and other 6 cover it in the view.
- Case 4: no.
- Case 5: no. It would catch an `env` built without applying the removal, since the stub sees `/x`.
- Case 6: yes. A `#!/bin/sh` stub prints the variable even when `env` replaces the whole environment (no PATH, no HOME), with which the real `claude` cannot start.
- Case 7: yes. With a single hub it passes even when the label is checked only against the primary file's rows, while `accounts:` rows are joined from every hub (`machine.ts:120-132`).
- Case 8: no.
- Case 9: no.
- Case 10: no.
- Case 11: yes. With the send stubbed, the "server's sentence" is the stub's, so it passes whatever the server refuses.
- Cases 12 and 13: no.
- Case 14: yes, for the drawing. A run of the selector passes while `Select` draws no `<optgroup>`, and no case checks the drawn groups.
- Case 15: no (the look).
- Case 16: yes. A fresh fixture has no cache, so it passes while every session already in the sessions cache (`CACHE_VERSION` 6) keeps agents without ids.
- Case 17: no.
- Case 18: no.
- Case 19: yes. "a second press brings the same tab forward" passes when the press brings forward the session's own Transcript tab, or one tab shared by two agents, since `stateId` keys on `session` alone (`instance.ts:243-252`).
- Cases 20 and 21: no (the look).
- Case 22: yes, for the wiring. A unit run of the history passes when no page, pane or float change feeds it.
- Case 23: yes. A unit run with synthetic caret events passes with the editor never reporting a caret move or a definition jump, and the case is not marked for the look.
- Case 24: no.
- Case 25: no.
- Case 26: no.
- Case 27: no.
- The step line's check (the diagnosis's red command): no for part (1). It covers nothing of parts (2) to (7), which rest on the cases above.
- Item 1: no (case 1). The scroll "jump" half rests on reading.
- Item 2: yes, through cases 6 and 7.
- Item 3: no for the start. Yes for refusals (case 11).
- Item 4: yes for the groups drawn (case 14).
- Item 5: yes, through cases 16 and 19. "A running agent's tab follows it" has no case at all.
- Item 6: yes. The Command Center (its words, its press opening the palette with `''`), the float window's strip, a step whose file is gone, and search-result and problem steps have no case. Cases 22 and 23 are unit runs of the history alone.
- Item 7: no (case 27).

Findings:
1. Cases 2, 3, 6, 7, 11, 14, 16, 19, 22 and 23 could pass without their part of the goal, each for the reason above.
2. Item 5's following of a running agent has no case.
3. Item 6's Command Center, the float window's strip, a skipped gone-file step, and search and problem steps have no case.

## 6. Implied inputs

This is a code step. Inputs the step implies but never states:

1. `commit_message_account` names the label of an `accounts:` row held in a non-primary hub's local.yml. The rows are joined from every hub (`machine.ts:120-132`). Expected: accepted, that row's folder used. Missing.
2. A label differing only in case or punctuation from a Claude row's label. Claude labels are compared reduced (`usageAccountLabel`, `local.ts:206`; duplicates at :286). Expected: one stated rule, exact or reduced. Missing.
3. A hub that sets `accounts:` with no row labelled `claude`. The defaults are replaced (`machine.ts:124-126`), so `commit_message_account: claude` names no row. Expected: the finding, and the default folder. Missing.
4. The rest of the server's environment kept in the suggestion's run (PATH, HOME) when the account is set. Expected: the stub sees PATH and HOME besides `CLAUDE_CONFIG_DIR`. Missing; the cost is that every suggestion fails under a named account.
5. `commit_message_account` set in a non-primary hub's file. Expected: the existing "read from the primary hub's file only" finding (`machine.ts:104-117`), the value unused. Missing; low cost, since the existing code handles it.
6. `commit_message_account: ''` (empty). Expected: no finding, the default folder, the variable removed. Case 5 states the environment but not the absence of a finding, and `filledAt` makes an empty program key a problem (`local.ts:478-479`). Missing in part.
7. Sessions already in the sessions cache. Expected: refolded so their agents carry ids (`CACHE_VERSION` bumped). Missing; the cost is that every existing agent row shows "not available".
8. The session's own Transcript tab open, then an agent row of it pressed; and two agent rows of one session pressed in turn. Expected: a separate tab per agent, the session's tab untouched (`stateId`, `instance.ts:243-252`). Missing.
9. A running background agent appending to its own `agent-<id>.jsonl` while the parent session's file is unchanged. The `follow` signal is the parent record's `lastActivity` (`transcript.svelte.ts:165-174`). Expected: the agent's tab asks its tail. Missing.
10. An agent the record lists with an agent id whose file is not there yet (just launched). Expected: the route's answer (404 or no turns) and the row drawn without a press. The item text states the row; no case states the route's answer. Missing.
11. The composer's folder is a subfolder of the repository (this hub's project folders are). Expected: the session's cwd in the new worktree, its root or the same subpath. Missing.
12. A repository whose `.gitignore` lacks `/.agents/worktrees/`. The Repositories view warns (`Worktrees.svelte:146`, `repositories.worktrees_unignored`). Expected: the composer warns as well, or says why not. Missing.
13. The worktree write succeeds and the start then fails. Expected: the failure line names both facts, as `shellIn` and `agentIn` do (`repositories.svelte.ts:278-294`). A retry with the same kept name is otherwise refused as "already there". Missing.
14. The folder is itself inside a worktree under `.agents/worktrees/` (the deepest watched root is that worktree). Expected: the root used, stated. Missing; low cost.
15. Pin with a project read from a repository workspace folder: `hubOfProject` answers the folder's own dir (`selectors.svelte.ts:105-106`). Expected: the group it is listed under. Missing.
16. The app in macOS full screen, where the window buttons are hidden. Expected: the strip leaves no room for them. Missing; cosmetic.
17. The find bar, a `WebContentsView` "laid over the window's top right" (`find-bar.ts:3`, `y: INSET` at :49-51), opened over the strip's layout toggles. Expected: placed below the strip. Missing, and `find-bar.ts` is not on the list.
18. Ctrl+Minus and Ctrl+Shift+Minus pressed with focus in a Terminal tab, where xterm sends them to the program. Expected: who takes them. Missing.
19. The chords pressed in a text field or the palette input. `resolve.ts:272-274` keeps the keyboard with a field. Expected: stated. Missing; low cost.
20. A new float docked at an edge that is hidden, and a hidden float undocked or redocked. Expected: shown or hidden, stated. Missing.
21. A saved hidden list holding an unknown edge, or one edge twice. Expected: dropped on reading, as `saved.ts:13-16` drops what does not add up. Missing; low cost.
22. Back and Forward in a float window of the desktop app (per window history). Expected: each window walks its own history. Missing; low cost.
23. A new zoom channel needs `src/desktop/decide/channels.ts`, the bridge type in `src/lib/state/shared/stores/desktop.ts:75` and a main-process handler. Only the preload is on the list. Not an input; a path gap.

Findings: items 1, 2, 4, 7, 8, 9, 11, 13 and 17 are missing from "Cases" and have a real cost. Items 3, 5, 6, 10, 12, 14, 15, 16, 18, 19, 20, 21 and 22 are missing, at lower cost.

## 7. ADRs

- `ls docs/adr tools/oculus/docs/adr` (from the hub root) prints "ls: docs/adr: No such file or directory" and "ls: tools/oculus/docs/adr: No such file or directory". No record.

Findings: none.

## 8. Dictated text

All dictated lines are code, identifiers or control names. `LC_ALL=C grep -n '[^ -~]'` over the brief prints nothing.

- "`const sessionId = $derived(record?.id ?? '')` ... `$effect(() => showing(sessionId))`": `grep -n "const sessionId = \$derived" briefs/D77.md` (line 57). Holds.
- "passes `--no-session-persistence` before `-p`": `grep -n -- "--no-session-persistence\` before" briefs/D77.md` (lines 60, 96). Holds.
- "`commit_message_account`" as the key: `grep -n "A new key of a hub's \`local.yml\`, \`commit_message_account\`" briefs/D77.md` (line 61). Holds.
- "`wrong('commit_message_account', 'a label')`", giving "commit_message_account must be a label; the default is used" through `findings.config.setting_default` (`findings.yml:121`): `grep -n "wrong('commit_message_account', 'a label')" briefs/D77.md` (line 63). Holds.
- "as a field (`agentId`, empty when the result named none)": `grep -n "as a field (\`agentId\`" briefs/D77.md` (line 75). Holds.
- "`openView('transcript', { session, agent, label })`": `grep -n "openView('transcript', { session, agent, label })" briefs/D77.md` (line 77). Holds.
- "New worktree" as the choice's name: `grep -n "offers New worktree" briefs/D77.md` (line 67). Holds, and matches `repositories.yml:242`.
- "Back and Forward, the Command Center ...": `grep -n "Back and Forward, the Command Center" briefs/D77.md` (line 80). Holds.
- "`titleBarStyle: 'hidden'`", "`-webkit-app-region: drag`", "`no-drag`": `grep -n "titleBarStyle: 'hidden'" briefs/D77.md` (line 81). Holds.
- "Toggle Left Dock, Toggle Bottom Dock and Toggle Right Dock": `grep -n "Toggle Left Dock, Toggle Bottom Dock and Toggle Right Dock" briefs/D77.md` (line 83). Holds.
- "`go-back`, `go-forward`, `toggle-left-dock`, `toggle-bottom-dock` and `toggle-right-dock`": `grep -n "Palette commands \`go-back\`" briefs/D77.md` (line 84). Holds; the form matches `reopen-closed-tab`.

Findings: none.

## Declined to judge

- Whether a completed Agent call's `toolUseResult` carries `agentId`, `totalTokens`, `totalToolUseCount` and `totalDurationMs` (brief line 39). The permission system refused reading the transcript folder, and the cited path does not exist.
- Whether G84, taken under self-rule (Z890), meets `agents/guarded.md`'s head ("A new entry needs Axel's yes") and the rules file's test rule ("A step that needs a new entry stops and asks Axel for it"). The state file's automode order names "a guarded entry's wording" among the choices the orchestrator closes. This is a question between two written rules, which is the user's call.
- Whether VS Code's Go Back and Go Forward are Ctrl+Minus and Ctrl+Shift+Minus "on macOS and elsewhere" (brief item 6, case 24). From memory, VS Code uses other chords off macOS (Alt+Left and Alt+Right on Windows, Ctrl+Alt+Minus on Linux). No file in the repository states it, so this is not verified.
- Whether macOS already zooms a window on a double press of a `-webkit-app-region: drag` area with `titleBarStyle: 'hidden'`, which would make the channel needless. This needs the app running.
- Whether Monaco on macOS binds Ctrl+Minus, which would need `src/lib/ui/controls/editor/chords.ts` (not on the list) to free it. This needs Monaco loaded.
- Whether Ctrl+Shift+Minus (Ctrl+_) is an undo key of the Claude Code input inside a Terminal tab. Not verified.

Agent usage: a54a1d685d11d12dd, claude-opus-5-5, 299,890 tokens, 105 tool uses, 15.2 min.

## Closed

Every finding is closed by a change to `agents/briefs/D77.md`, read on main at 7fa484997.

- Names 1 and 2: item 5 takes the completed call's agent id in `fold.ts:245-256` and bumps `CACHE_VERSION` from 6 to 7; both files are on the path list; decision 4 rewritten.
- Names 3: the whole of `selectors.svelte.ts` is on the path list, and item 4's premise names `:169` and `:668`.
- Names 4, 5 and 8: `machine-defaults.ts`, `machine.ts` and the git route `+server.ts` are on the path list; item 2 says what each does (default column, label check after the join, the account passed beside `claudeBin`).
- Names 6 and 7, and Cases 2: the finding names the key only, worded through `findings.config.setting_default` with no value of the file, as `catalogs.ts:288-293` and G13's row require (decision 6); `config/text/findings.yml` replaces `server.yml` on the list; case 7's test is a G13 row in `machine.test.ts` or `local.test.ts`, the route's test dropped.
- Names 9: item 5 and case 19 key an agent's tab on its session and agent in `stateId`; `instance.ts` is on the list.
- Names 10: item 6 has the comment at `app.ts:77` changed.
- Names 11: Z891 taken in automode: with the tab bar not drawn, the editor actions draw in the window strip, as VS Code's `editorActionsLocation` default (VS Code's `workbench.contribution.ts`, read by the orchestrator: "Show editor actions in the window title bar when ... showTabs is set to none"); item 6, case 28, decision 8, the path list (`pane-view.ts`, `strip/`, `ui.yml`).
- Premises 1, 2, 3, 5 and 9: the premise lines rewritten with head's numbers (`options.yml:1400-1418`, `templates.md:128,133-136`, `palette.md:94-120`, `suggestMessage` :54, `run()` 85-114, `accountFor` :111) and G83's key-set test against the options catalog.
- Premises 4: the path is the effort-probe folder's full name; the orchestrator read its four transcripts: three completed and three background results each carry `agentId`.
- Premises 6: the premise states `accountEnv`'s answer (an argv prefix for the default); item 2 applies prefix and env through `execFile`; `compose.ts` leaves the path list.
- Premises 7: item 3 adds a root helper beside `branchOf`.
- Premises 8: the folders paragraph gives the rules file's 880/520 and the scripts' 900/540, every full folder by count, and where each new file goes (`rail-badges/` moved out, `history/` and `titlebar/` new); item 6 keeps `Workbench.svelte` at or under 520 by moving a named part out.
- Premises 10: the grep carries `':!config/local.yml'`.
- Cases 1: case 1 restated: the record's harness 7 failed | 5 passed unchanged, then the adjusted harness (other 4's `s2:`/`s1:` and other 5's `back:` drawing no sentence while pending) 9 failed | 3 passed unchanged and 12 passed changed, with the record's after-fix requests per case; item 1 names other 5's `back:`.
- Cases 3: decision 4 now bumps `CACHE_VERSION`, the tree's own rule; case 16 holds a store cached at version 6.
- Cases 4: Verify 1 names the tree-check files by name and the ASCII gate in the rules file's perl form.
- Cases 5: item 8 writes every decision into `DESIGN.md` with its reason.
- Cases 6: case 11 checks the composer's own refusals (`validName` before any send, a stubbed refusal's sentence in the failure line, a write that went and a start that failed); case 15 is the look only.
- Cases 7: case 25 is a unit run; the test bullet no longer names G29 or G8.
- The question 1: cases 2 and 3 are harness cases of the view; case 6 and 5 have the stub show PATH and HOME; case 7 runs over two hubs; case 11 as above; case 14 has the `<optgroup>` look; case 16 refolds a version 6 store; case 19 has a `stateId` unit run; case 22 feeds the history through the layout store; case 23 has the Monaco look.
- The question 2 and 3: item 5 and the running agent's follow (each sessions message while it runs, once at its end); case 27 for the Command Center and the float window's strip; case 22 for a skipped gone-file step.
- Implied inputs 1 to 22: each is stated in its item with its expected result (2: labels compared reduced; 3: the finding; 4: PATH and HOME kept; 5: the other-hub finding; 6: no finding; 7: the cache refold; 8: separate tabs; 9: the agent's follow; 10: 404 and no press; 11: the same subfolder, decision 7; 12: the warning; 13: both facts, folder switched; 14: that worktree as root; 15: grouped under the folder's name; 16: no room in full screen; 17: the find bar below the strip; 18: the terminal keeps a key it took; 19: answered with a field focused, as `appKey`; 20: docking at a hidden edge shows it; 21: dropped on reading; 22: each window its own history). 23: the bridge's files are on the path list.
- Declined to judge, G84: the state file's automode order (Axel's) closes every choice a brief writer raises, "a guarded entry's wording" among them, and says a skill's words "raised to the user" never by themselves make an item Axel's; Z853 and Z858 took new entries the same way and wait in `choices.md` for his review, where Z890 is too. No clash is left for him beyond that review.
- Declined to judge, the chords: VS Code's source (`editorActions.ts`, read by the orchestrator) gives macOS `WinCtrl+Minus` / `WinCtrl+Shift+Minus`, Linux `Ctrl+Alt+Minus` / `Ctrl+Shift+Minus`, Windows `Alt+Left` / `Alt+Right`; item 6 and case 24 follow it, and Z889's text is corrected.
- Declined to judge, the double press: item 6 reads `AppleActionOnDoubleClick` through a new bridge channel, and the landing's look checks it zooms once.
- Declined to judge, Monaco and the terminal: item 6 frees the chord in `chords.ts` when Monaco takes it, and leaves a key the terminal took to the program; `chords.ts` is on the list.
