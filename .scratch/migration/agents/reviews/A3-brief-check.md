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
