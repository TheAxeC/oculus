# Step A3 brief check (on main at 2b42bc9ea)

Agent ae22a5a2d18de236a, claude-opus-5-5: 278,261 tokens, 107 tool uses, 13.2 min (completion notice). The brief predates S5 (71017ce60) and cites main at 127525b40.

## 1. Names

- N1. The page's channel list is `src/routes/+page.svelte:177-190`, outside the write list; without `'schedule'` there the tray never gets its payload. The write list names `socket.svelte.ts` instead.
- N2. A `cron` form needs arms in `value-words.ts:38-47` (`formWords`), `server/edit/writes/config/config-fit.ts:98-101`, `state/system/config/editors/fields.ts:340-349` (`formMessage`), `state/system/config/messages.ts:21-23`, and makes false `options.yml:11`, `options.ts:102`, `value-rule.ts:59` and `DESIGN.md:85`; none is in the write list.
- N3. `empty` on a text control makes false `options.yml:11` and `options.ts:132-133`.
- N4. A new reader joins through `PROBLEM_READERS` (`settings.ts:423-442`), not `catalogs.ts`; its rows belong in `tests/data/sources/config/wrong-settings.ts:6-26`, `settings.test.ts:488-520` and `tests/checks/config/config.test.ts:397-472`, the first and last not in the write list.
- N5. `DESIGN.md:411` and `tasks.ts:10-12` say the `tasks:` block has no schema; item 8 adds sentences but does not rewrite that clause.

## 2. The step line

- L1. No built / left-out / later table against VS Code's Automations (Hourly, Daily, Weekly, Manual, Run now, History, Enable/Disable, catch-up, one session at a time), and no side-by-side at the look, as the parity demand asks.
- L2. Z510 closed choices 1 to 4 and 6 to 9; the brief still says they go to Axel. Z511 asks for the risk (an agent edits and runs commands with nobody asked, on a timer) in HELP.md and the option's description; neither sentence of item 8 states it.

## 3. Premises

Line drift throughout (plan.md, orchestrator-history.md, orchestrator-state.md, routes.ts, context.ts, live-settings.ts, options.yml, folder counts, sizes). Changed by S5: the readers read every key through `valueProblem` and give the default and a `SettingProblem`, the `chat.skip_permissions` finding is at `catalogs.ts:168-172`.
- P1. `heldAt` (`settings.ts:69-86`) splits a key at its first dot only, so `tasks.litwatch.schedule` is looked up as `block['litwatch.schedule']`; the reader would read `''` with no finding whatever the file says. The Settings view's write walks every segment (`config-key.ts:55-59`).
- P2. `empty` applies to a choice and a path only (`value-rule.ts:113`, `:146`); a text control answers `{ kind: 'form' }` for `''`.
- P3. The brief's `not_cron` and `cron_never` are words, not kinds of `ValueProblem`; the brief should say: `form` with `form: 'cron'` for a pattern that does not construct, and one new kind for no next run.
- P4. "Shared with the steps in flight" names S5 and X3e as in flight and D20's brief as a stub, and compares no other step.
- P5. The route test fixture (`tests/routes/sessions/terminal-fixture.ts`) hands no record path, so a hand press under the test must not fall back to the real `~/.oculus/schedule.json`.
- Holds: the task kinds, `behavior.yml:89-91`, `startTask`/`taskCommand`, `tasks.ts`, the sessions model, the pollers wiring, the client channel points, croner absent from package.json, and the croner probes (refusals, macros, `@hourly`, Feb 31 null, DST).

## 4. Cases and checks

- C1. Z512 is ruled yes; the brief still says no test is written until Axel rules, and names no test file or title for G46 or the G31 widening.
- C2. C4 expects `5`, `null`, `[]` in the `not_cron` form; the rule answers a non-string on a text control as `{ kind: 'text' }`.
- C3. C25 expects a finding for `tasks.foo.schedule`; a key with no catalog entry gives none (`catalogs.ts:213-214`).
- The dictated finding sentence breaks Q119 Decision 5 (D3). Look case 7 stops at the Settings refusal.

## 5. The question

- Q1. C11 (a changed pattern reaches the watcher) is exercised only by calling `set()`; the `liveSettings` path is never run.
- Q2. Whether real `claude` under `taskCommand` writes its registry entry where the going rule reads it is checked only by a stub printing `$$`; a run whose entry lands elsewhere counts as going forever.

## 6. Implied inputs

I1 a stale `schedule.json.lock`; I2 a due time while the same task's start is in flight; I3 a catch-up at start before the first `sessions` payload while an earlier tmux terminal still runs; I4 idle earlier runs accumulating (one idle Claude terminal per run); I5 malformed task entries (`tasks.litwatch: "0 7 * * *"`, `tasks: []`, an extra field); I6 a hand press with no record path; I7 a record holding a key outside the four, and the 21st run.

## 7. ADRs

None.

## 8. Dictated text

- D3. "tasks.scout.schedule must be a cron pattern of five fields; there is no schedule" and its sibling break Q119 Decision 5 and `findings.yml:67` (`'{0} must be {1}; the default is used'`, filled by `mustBe` from `findings.words.*`).
- D4. `taskSchedules(config)` breaks the reader shape `PROBLEM_READERS` requires, `(config, problems: SettingProblem[]) => unknown`.
- The rest holds; the skipped words need the earlier run's time, which the `skipped` record does not carry.

## Shared paths

X3f, D20, D44: simple (D44's `close()` insertion read at landing). D11, D23, D38, D45: not simple (D11 renames `model-processes.ts` and adds a channel at the same points; D23 the same model file and DESIGN.md lines; D38 `HELP.md:267`, `PROBLEM_READERS`, `settings.test.ts`; D45 `PROBLEM_READERS`, `wrong-settings.ts`, `config.test.ts`).

## Declined to judge

Look case 9 on Axel's running server; D44's `close()` line; the choice behind I4.

## Closed

Closing agent a29086760e73aef5a, claude-opus-5-5: 312,666 tokens, 106 tool uses, 19.8 min (completion notice).

- Line drift (section 3): every tree and ledger citation renumbered on main at 2b42bc9ea, each bullet carrying its command (A3.md:13-21, 25-50, 300-354); "S5 in flight" and "goes to Axel" removed and Z510, Z511, Z512 stated as ruled (A3.md:18-19, 371-401); `grep -n "goes to Axel\|127525b40\|until Axel rules" agents/briefs/A3.md` prints nothing.
- N1: `'schedule'` joins `connect([...])` at `+page.svelte:177-190` (A3.md:36, 186, 326); the guessed `socket.svelte.ts` path is dropped, since it takes `channels: string[]` and names none (A3.md:36).
- N2: the `cron` arms of `formWords`/`mustBe`, `sentenceOf`, `formMessage`/`Trouble`/`troubleOf`/`troubleMessage` and `SETTINGS_MESSAGES` with their words (A3.md:40, 97-101, 314, 321, 331-332), and `options.yml:11`, `options.ts:102`, `value-rule.ts:59`, `DESIGN.md:85` and `findings.yml:102` rewritten to name four forms (A3.md:94, 101-102, 201, 305-313, 348).
- N3 and P2: `empty` joins the text control in `value-rule.ts`, `''` right only under `empty` for a text with a form, `emptyIsValue` adding `text` (A3.md:39, 95); `options.yml:11`, `options.ts:132-134` and `DESIGN.md:85` say it applies to a choice, a path or a text (A3.md:102, 201).
- N4: `taskSchedules` joins `PROBLEM_READERS` (A3.md:37, 104-109); `catalogs.ts` left the write list; `wrong-settings.ts:6-26` and `config.test.ts:397-472` rows added and `settings.test.ts`'s rows named (A3.md:284-291, 340-341).
- N5: item 8 rewrites the "no schema" clause of `DESIGN.md:411` and `tasks.ts:10-12` (A3.md:31, 205-206).
- L1: the table "VS Code's Automations, feature by feature", each row built or left out with why (A3.md:52-68); look case 11 compares the tray with it side by side (A3.md:226).
- L2: Z511's risk in the dictated words "With it on, a scheduled run lets an agent edit files and run commands with nobody asked, on a timer." in `HELP.md:25` and the option's description (A3.md:199, 208); held: plain, no dash, no negation-contrast.
- P1: `heldAt` walks every segment as `config-key.ts:55-59` does, an inner non-map a `block` problem by its dotted path (A3.md:38, 103); the settings row 'reads a pattern the Settings view wrote at its three-level key' writes through `writeConfigKey` and reads through `taskSchedules`, red on the unchanged tree (A3.md:289).
- P3: a pattern that does not construct is `{ kind: 'form', form: 'cron' }`, one with no next run the new kind `{ kind: 'cron_never' }`, each with its words in the four catalogs (A3.md:96-101, 377).
- P4: "Shared with the steps in flight" is the check report's comparison: X3f, D20, D44 simple, D11, D23, D38, D45 not simple, A3 prepared first or after each and the other prepared on main after it lands (A3.md:358-369).
- P5 and I6: `ServerContext.scheduleRecord` reaches the route through `+server.ts`; `makeTaskConfig` and `contextFixture` hand scratch paths; a start with no record path writes nothing (A3.md:143-144, 182, 262, 325, 344-345).
- C1: G46's `tests/server/machine/tasks/schedule.test.ts` with four dictated titles, one per clause, over the real `startUpdateTask` and a recording tmux runner; G31's row 'refuses a write over a schedule record it cannot read, leaving it' in `tests/server/machine/tasks/record.test.ts`; both in the write list (A3.md:278-283, 337-338).
- C2: C4's `5`, `null`, `[]` expect `{ kind: 'text' }` and "must be text; the default is used" (A3.md:233, 291).
- C3: C25 states no job and no finding for a key outside the catalog (A3.md:254, 288).
- Look case 7 (section 4): it goes on past the refusal, takes `0 7 * * 1` and sees the tray's next run move with no restart, and refuses `0 0 31 2 *` in the `cron_never` words (A3.md:222).
- D3: the findings go through `findings.config.setting_default` filled by `mustBe` with new `findings.words.cron` and `findings.words.cron_never` (A3.md:98, 216, 291); held: each line fits "{0} must be {1}; the default is used".
- D4: `taskSchedules(config, problems: SettingProblem[] = [])` (A3.md:107-112).
- Skipped words (section 8): `outcome_skipped` is 'skipped, the earlier run was still going', which needs no earlier time (A3.md:189, 192, 218); held.
- Q1: C35 writes a changed pattern through `liveSettings` and sees the payload's next run move, by a quoted probe (A3.md:148, 264).
- Q2: C36 starts the real `taskCommand` argv with a stub `claude` writing its registry entry and transcript into the configured account folder, the one-run rule reading it; look case 10 runs one real task by hand and checks its registry entry is found; the rule at the head names that one exception (A3.md:9, 34, 214, 225, 265).
- I1: C28, a lock older than 60 s taken over with one stderr line (A3.md:180, 257).
- I2: C29, a due time while the task's start is awaited recorded `skipped` with `terminal` null (A3.md:155, 177, 258).
- I3: C30, the decision waits for the first `sessions` payload (A3.md:153, 259).
- I4: C31 and item 5 follow Z545's recommendation (b), an idle earlier run ended by `stopTerminal` before the new run, a working one skipped, with the note that the case changes if Axel rules otherwise (A3.md:20, 154, 204, 260, 401).
- I5: C32, `tasks.litwatch` and `tasks` non-maps as `block` findings, an extra field read past with no finding (A3.md:103, 261).
- I7: C34, a key outside the four kept and not shown, the 21st run dropping the oldest (A3.md:177, 179, 263).
- Dictated lines added after the check, each held against `spec.md:20` and the prose rules (plain, ASCII, no dash, no negation-contrast): the `findings.words`, `server.config_key` and `workbench.yml` cron lines and `findings.options.form` (A3.md:98-101), the `app.tasks` words (A3.md:192), the risk sentence (A3.md:199), the test titles (A3.md:279-292).

## Rechecked after X3f, D38 and D20 (2026-10-05)

- The tree read: main's working tree at f0f311964, X3f (ee0407a5a) and D38 (b07d24766) landed, D20 applied and staged; `git diff --cached --stat -- tools/oculus` prints 97 files and `git diff --stat -- tools/oculus` prints nothing, so the working tree under `tools/oculus` is the index. `config/local.yml` was not opened, and every grep over `config/` carried `--exclude=local.yml`.
- The counts: 9 premise bullets under "Where this step sits", 24 under "What is on the tree", every `file:line` of items 1 to 8, the look, the cases and the tests, the 53 lines of "Paths this step writes" and the 13 items of the reading list, each re-read by a grep, `sed`, `awk` or `wc -l` on that tree. The brief now carries 56 "corrected after X3f, D38 and D20" markers, 5 "added after" markers and 9 "ruled Z545 (b)" markers (`grep -o ... | wc -l`); `LC_ALL=C grep -c '[^ -~]' agents/briefs/A3.md` prints 0.
- Held on this tree: `behavior.yml:89-91`, `options.yml:11` and :386-391, `app.yml:41-53` (72 lines; D38 changed only the keys overlay row :12), `server.yml:19-49`, `findings.yml:67` and :102, `workbench.yml:13` and :173-175, `tasks.ts` (22 lines), every line of `value-rule.ts`, `value-words.ts`, `options.ts`, `fields.ts`, `messages.ts`, `catalogs.ts`, `live-settings.ts`, `pollers.ts`, `+page.svelte:177-190`, `payloads.ts`, `entities.svelte.ts:94`, `UpdateTray.svelte`, `json.ts`, `saved.ts`, `size.test.ts:29-30`, `HELP.md:25`, `DESIGN.md:85`, :114 and :124, croner absent from `package.json`, `sh utils/unused-exports.sh | wc -l` 379, the shipped `''` values and the text entries with default `''` (0, by `yaml.safe_load`), and the croner probe, run again under `$TMPDIR/a3brief` with the same output.
- The main corrections, each in place with its command: `pty/routes.ts` (685 lines; D20 adds imports at :35-42 and :86, the compose task path and the `seed` actions) `TASKS` :88-95, `TerminalOptions` :128-151, `taskCommand` :395-407, `startTask` :409-434, the dispatch :602-604; `context.ts` (737 lines) `ServerContext` :106-186 with D20's `gitRunning` at :135, `ContextDependencies` :198-216 and `dependencies` :218-236, the pollers' start :392-404, `liveSettings` :410-434, `close()` :477-495; `settings.ts` (482 lines, D38's `literatureSettings`) `heldAt` :66-87 and its first-dot split :71, `settingReader` :97, `latexAutoBuild` :438-445, `PROBLEM_READERS` :447-466, `settingProblems` :472; `config-fit.ts` `sentenceOf` :77-127; `findings.words` :103-130; `terminals.svelte.ts` (839) `TaskKind` :106, :124, :476 and `startTask` :472-481; `model-sessions.ts` (859) `Terminal` :333, `pid` :350, `task` :362, `exit` :367; `transcripts.ts` `scan` :276-321 with the registry merge :286-305; `pty/sessions.ts` `startTerminal` :601 and `stopTerminal` :694; `shapes.ts` `Payloads` :29; `state/client/context.ts` `createProcesses` :345; `model/index.ts` the `model-processes.ts` export :535; `options.yml` 1280 lines and `approvals` :1236; the test ranges `taskArgv` :52-68, `makeTaskConfig` :65-94, `DEFAULTS` :45-73, 'the shipped files' :535-585, `WRONG_SETTINGS` :6-27, `settingFindings` :397-476; `HELP.md:269`; `DESIGN.md` **Processes view.** :137, **Processes.** :155, the update tasks' item :414; `src/lib/server/machine` 8 items (D20's `seeds/`), so A3's `tasks/` makes 9; the sizes list; the ledger lines (plan.md:588, :589, :798, :519, Z510 :1273, Z511 :1238, Z512 :1239, Z507 :1271, Z488 :1218, Z467 :1197; `orchestrator-history.md:693`, :671, :23, :24; `orchestrator-state.md:93`, :112, :114; G46 at `agents/guarded.md:89`).
- One dictated key corrected: the cron form's finding words are `findings.words.form_cron`, since the group keys each form's words `form_<form>` (`sed -n '115,118p' config/text/findings.yml`); the words are unchanged.
- Added facts: Z548 (plan.md:1264) closes the scope of `empty` on a text control as item 2 builds it; D20's `server/machine/seeds/task-*.ts` and `server.task` group use "task" for a hub task, so A3's names keep "update task"; M6 joins "Shared with the steps in flight" (`shapes.ts`, `HELP.md`, `DESIGN.md`, diagrams, simple); X3f, D38 and D20 leave that list as the base; the VS Code Automations page was not read again.
- The ruling written: Z545 (b) (plan.md:1267) stated as ruled at the brief's head, in the Automations table, the step summary, item 5's one-run rule (the idle earlier terminal, started by oculus, ended by `stopTerminal` with no confirmation before the new run), item 8's `DESIGN.md:155` exception (a scheduled run's own idle terminal), C31 and a new Decision 10; the fallback wording for other options removed (`grep -n "otherwise\|recommendation (b)\|Open:" agents/briefs/A3.md` prints only item 2's unrelated "otherwise checked by its form"). G46's text is quoted in the tests section equal to `agents/guarded.md:89`, and G46's fifth clause gets the fifth test 'ends the terminal of the task's idle earlier run, and then starts the new run' (C31, C30's idle half), so the quoted-run list drops C31.
- Stops: none.
