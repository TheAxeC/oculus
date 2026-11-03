# Step O138 brief check (on main at cad55b7a7)

The brief was read on main at 0e1fd7510. Main moved to cad55b7a7 during the check. The only change outside `.scratch/` is `src/lib/data/model/model-entities.ts`, one line (`git diff --stat 0e1fd7510 HEAD -- . ':!.scratch'`), and this step does not touch it.

## 1. Names

- `interview`: `grep -rni "interview" src tests docs README.md utils config --exclude=local.yml` printed nothing. No hit.
- `offered` as a status word: `grep -rn "\`offered\`\|'offered'\|\"offered\"\|offered:\|, offered\|offered\]\|\[offered" src tests docs README.md utils config --exclude=local.yml`. Every hit is the English verb or a variable name (for example `gutter.ts:352 offered: (side: DiffSide) => boolean`, `prepared-message.ts:8`, `Palette.svelte:127`). None is a status. No hit.
- HELP's list of `deadline_met` statuses: `grep -rn "deadline_met" src tests docs README.md utils config --exclude=local.yml` and `grep -rn "under-review" ... | grep -v ^config/catalogs/vocab.yml`. The only list of oculus's `deadline_met` statuses is `docs/HELP.md:296`, which is in the paths. The other hits stay true:
  - `focus.ts:229` and `ticker.ts:236` give `(submitted)` as a stage.
  - HELP:296's band-card sentence "a status carrying `deadline_met` (`submitted`) or `closes_deadline`" gives one example, not a list.
  - `config/options/sources.yml:86`, `config/options/catalogs/vocab.yml:101` and `src/lib/data/shapes/catalog-files/vocab.ts:215` describe the flag and list no words.
- `position_stages` rows: `grep -rn "position_stages\|Job applications\|positions column\|open_badge" docs README.md config src tests --exclude=local.yml`. Hits outside the paths, each still true after the change:
  - `docs/templates.md:493-497`: the commented example with one Applied row.
  - `docs/data-map.md:109`.
  - `config/options/catalogs/vocab.yml:218-230` and `config/options/sources.yml:80,89`.
  - Generic comments: `focus-lanes.ts:6,91,226-229`, `rail-badges.svelte.ts:274-277`, `Band.svelte:2-6`, `catalog-files/vocab.ts:345,437`.
  - `tests/data/sources/config/layers/hub-vocab.test.ts:171-176` finds the Applied row by its label. `:321` compares against OCULUS read from the same file.
  - No doc or comment names "Active and Applied" (`grep -rn -i "active.\{0,40\}applied\|applied.\{0,40\}active" docs README.md CLAUDE.md config src tests utils` hits only templates.md:1560 and :1577).
- Applications template options and comment: `grep -rn "\bapplied\b" docs README.md utils config --exclude=local.yml`. The template lines 1560 and 1577-1578 are in the paths. `tests/fixtures/hubs/demo/.oculus/data/academic/applications.yml:8` (options `[in-prep, applied, rejected, declined, withdrawn]`) is the demo hub's own list and does not claim to be oculus's, so it stays true.
- Tests that list or count oculus's statuses: `grep -rln "position_stages\|statuses" tests` gives 11 files. `tests/data/snapshot/schema-rules.test.ts` `STATUS_ROWS` (:222-292) runs closest-word rows against oculus's whole `statuses` list, so a new word could change a row's answer. I ran a probe in the scratchpad (`npx tsx .../scratchpad/o138/probe.mts`, calling `closestWord` from `src/lib/data/shapes/vocab-keys.ts` with and without the two words). Every row's status gives the same answer: acepted to accepted, pased to paused, In Prep to in-prep, not applied to not-applied, under review to under-review, canceled to cancelled, xyz and scope to none. So the file stays true. The brief does not name it.

Findings:
- N1. The brief does not name `tests/data/snapshot/schema-rules.test.ts` `STATUS_ROWS` as a test over oculus's whole status list that stays true, and C5 rests on it. It should be named under "What is on the tree" and in verify item 1, with the probe result above.

## 2. The step line

- `statuses:` gains `interview` with its flags and colour: item 1.
- `statuses:` gains `offered` with its flags and colour: item 1.
- A passed deadline leaves the radar and the entry stays in the awaiting box, as `applied` does: item 1 (the flags), checked by C1 and C2.
- Each in a colour no status uses (c-purple, c-teal, ruling 659): item 1, with the palette premise.
- The Applications template offers both: item 3.
- `position_stages` gains Interview and Offered after Applied: item 2.
- So the positions column stacks them and the green badge counts them: item 2, checked by C1 and C2.
- At landing, the hub's `applications.yml` gains both options and its UGent entry is set to `interview`: no item. The brief names this as the orchestrator's landing work, which is how the line words it ("At landing"). I checked `/Users/axelfaes/workspace/research-hub/.oculus/data/academic/applications.yml`: line 9 holds the options as the brief says, and the UGent entry is `status: applied` at :135. The hub's `.oculus/config.yml` sets no `statuses:` or `position_stages:` (grep printed nothing), so oculus's new rows apply to it.

Findings: none.

## 3. Premises

- The step line: `grep -n "O138" .scratch/migration/plan.md` gives :1656 with the brief's text. Its Step 0 bullets are :1657 and :1658, and the rulings are :3500, :3501, :3502, :3505 and :3507. Matches.
- "`statuses:` is lines 109-155 ... `applied` ... is its last row, line 155". `grep -n "  applied:\|^statuses:" config/catalogs/vocab.yml` prints `109:statuses:` and `154:  applied: ...`. `git show 0e1fd7510:config/catalogs/vocab.yml | grep -n "  applied:"` also prints 154. Line 155 is blank. Differs.
- The comment at :101-108 says what `closes_deadline` and `deadline_met` decide: matches (read with awk at 100-109).
- `deadlineMet` at `focus.ts:223-224`, read at :708 and :716: `grep -n "deadlineMet\|deadline_met" src/lib/state/boards/focus.ts` prints 223, 224, 708 and 716. Matches.
  - Other readers the brief does not name: `ticker.ts:290` and `:328` (the deadline radar, the reader behind C1's "not on the deadline radar"), `focus-lanes.ts:211` (no countdown on a band card), `filter.ts:628,633` and `task-card.ts:29`.
- `position_stages` lines 199-202, read by `stagedEntries` and `openCount` at `rail-badges.svelte.ts:278-285`. vocab.yml shows 199 comment, 200 key, 201-202 rows. `stagedEntries` is at `focus-lanes.ts:165`, and `openCount` is at :278-285. Matches.
- `palette:` is 10-50: matches (`10: palette:`, `50: "#475569": c-slate`).
- `toneOf` and `paletteTone` are at tones.ts:198-219: matches (`198: export function toneOf`, `215: export function paletteTone`, `34: UNKNOWN_TONE = 'grey'`).
- `"#7c3aed": c-purple (:40)`: matches. `"#0d9488": c-teal (:31)`: the grep prints `32: "#0d9488": c-teal`. Differs by one line.
- "`grep -n '7c3aed\|0d9488' config/catalogs/vocab.yml` prints the palette rows, the `flagship` venue tier at :297 and the Build lane at :186". The command prints :32, :40, `75: released: { ... color: "#0d9488" ... }` (a stage), `189:` the Build lane, `271:` the `released` category row, `297:` flagship and `298:` the `strong` venue tier. Differs: Build is at :189, and :75, :271 and :298 are left out. The conclusion "none under `statuses:`" (109-154) holds.
- Every theme sets `--c-purple` and `--c-teal`: `grep -n -- '--c-purple\|--c-teal' src/lib/themes/tokens.css` prints `40: --c-teal`, `46: --c-purple`. In every `rice/*.css` the count of `--c-purple:` and of `--c-teal:` equals its count of palette blocks: catppuccin 4, everforest 2, flexoki 2, gruvbox 2, kanagawa 3, phosphor 2, rosepine 3, singles 6, tokyo 4. `vscode-map.ts` sets no hue token, so the VS Code themes take tokens.css's values. Matches.
- Applications template 1555-1580, `status` at :1560, comment at :1577-1578: matches (`sed -n 1550,1585p docs/templates.md`). The block runs past 1580, to about 1586.
- HELP:296's parenthesis "(`submitted`, `under-review` and `applied` in oculus's)": matches.
- `docs/templates.md:493-496` "shows one row (Applied)": the row is at :497 (`grep -n "statuses: \[applied\]" docs/templates.md` prints 497). Differs by one line.
- `hub-vocab.test.ts:169-176` and `:321`: `grep -n` prints 169, 175 and 321. Matches. `npx vitest run tests/data/sources/config/layers/hub-vocab.test.ts` prints "Tests 31 passed (31)", and the slow-tagged row runs in a direct run.
- Steps in flight: O135 writes HELP 394-411 and O137 writes HELP 148 and 279 and templates.md 62-92: both match their briefs' path lists. O137's list also has `docs/data-map.md` line 34, `tests/data/snapshot/schema-rules.test.ts` and `tests/routes/hubs/make.test.ts`, which are not in O138's paths. "O139 (brief check) writes HELP line 345" is out of date: commit f0a8504b6 "Stop step O139 on open item 662" stopped it, and `.scratch/migration/agents/briefs/O139.md` is no longer on disk. O135 is in repair round 1 (2475d6b64).
- Open item 660 is still open: it is in the state file's open items.

Findings:
- P1. `applied` is line 154, not 155, and `statuses:` is 109-154. The paths line "`config/catalogs/vocab.yml` lines 155-155" names the blank line after it. It should read 154-154, or say "an insertion after line 154".
- P2. The palette row of teal is :32, not :31.
- P3. The grep of the two hexes prints :75, :189, :271 and :298 besides what the brief says, and the Build lane is :189, not :186. Teal is also the `released` stage, the `released` category row and the `strong` venue tier. None of these is a status, so ruling 659's "no status uses" holds.
- P4. The commented `position_stages` example row is `docs/templates.md:497`, so the range is 493-497.
- P5. The steps-in-flight line is out of date: O139 is stopped on open item 662, and O135 is in repair round 1.
- P6. The radar reader `ticker.ts:328` is not named. C1's "not on the deadline radar" has no `file:line` among the code paths the brief tells the builder to quote (`deadlineMet`, `stagedEntries`, `openCount`, `paletteTone`, the Make reader).

## 4. Cases and checks

- C1: consistent with the rules file ("A builder runs no page"; check by reading plus the unit-level runs that reach it, then the look on landing).
- C2: consistent, the same way.
- C3: consistent.
- C4: consistent with the rule in vocab.yml's head comment ("in oculus's own values a row left with no word stays and a single word becomes an empty list").
- C5: consistent with the closest-word rule at vocab.yml:101 and `validate.ts:221-255`. Note that an entry with `interveiw` in a hub whose schema offers `interview` gets two findings: the schema's `findings.schema.not_allowed` and the vocabulary's `status_not_in_vocab`. "The finding" is the second one.
- C6: the expected result is incomplete. On the base, an entry with `interview` gets the schema's `not_allowed` and also the vocabulary's `status_unknown`: the probe gives no word near `interview` on the base and `interview` after. After the change only the schema finding stays. "The finding ... unchanged" leaves out the vocabulary finding that goes away.
- C7: consistent. `templates.ts:1-15` copies the block under the heading as the page has it.
- The method for C4 to C6, "by the existing rows of `hub-vocab.test.ts` and the schema check's tests, quoted from their runs", asks the builder to check a place the step does not change. Those rows plant `applied: null`, `acepted`, `pased` and so on, and no row holds `interview` or `offered` (the `interview` grep over tests printed nothing). Their runs come out the same before and after the change.
- The brief bans case-run programs ("No script is written to run the cases"). The rules file allows them without approval ("A case of the brief may be run by a case-run program: one that only prints the result of each case ..."). It also says a check is chosen by asking whether it would fail if the risk were real.
- Verify item 1: the test files exist (`ls` of all five). `tests/checks/config/templates.test.ts` reads no Applications option, and `tests/routes/hubs/make.test.ts` has no applications row (`grep -n "applications" tests/routes/hubs/make.test.ts` hits only funding and tasks). The grep `grep -rln "position_stages\|statuses" tests` also lists `tests/routes/apps/approve.test.ts`, whose `statuses` are HTTP codes, and `tests/checks/tree/layer-rows.ts`, a helper rather than a test.
- Verify item 2: `npm run test:quick` is `node tests/tiers/quick.mjs`, and its verdict line is "every command passed" (`tests/tiers/quick.mjs:304`). The brief leaves out `npm run diagrams`, which the rules file says runs right before each run of the list.
- Verify item 3: the rules file's command is written over `$(find src tests bin config ...)`, which leaves out `docs/`. There is no `bin` folder (`ls bin`: No such file or directory). I ran the rules file's perl over the three changed files on main and it printed nothing.
- Verify item 4: `python3 -c "import yaml; ..."` exits 0 on main.
- The rules file asks the report to state, for each new key, whether it is empty, duplicated or colliding. The brief's report shape does not ask for it. Neither word is a word of `stages`, `lead_statuses` or `statuses` (the `interview` grep printed nothing).

Findings:
- C-1. C4, C5 and C6 are checked by rows that do not hold the new words, which is a check that does not exercise the case. Allow the case-run program the rules file permits: a program in the scratchpad that loads `loadConfig(engineDir())` with `statuses: { interview: null }` as hub text, the way `hub-vocab.test.ts`'s `withHub` does, and prints the Interview row. It also calls `closestWord('interveiw', statuses)` and prints the findings of a planted entry, as `schema-rules.test.ts:418-435` plants one. Or say the cases are checked by reading the generic code path with `file:line`. Either way, drop "quoted from their runs" for these three cases.
- C-2. C6's expected result should say that the base's vocabulary finding for `interview` (`findings.validate.status_unknown`) is gone after the change, and that only `findings.schema.not_allowed` stays.
- C-3. Verify item 2 should name `npm run diagrams` right before `npm run test:quick`, as the rules file's "Token discipline" says.
- C-4. Verify item 3 should give the exact command over the three paths, because the rules file's form does not reach `docs/`: `LC_ALL=C perl -ne '...' config/catalogs/vocab.yml docs/templates.md docs/HELP.md`.
- C-5. The report shape should carry the new-key check ("What every package obeys", ids and keys) for `interview`, `offered`, and the labels Interview and Offered.

## 5. The question

- C1: yes, it could pass. A reading of `deadlineMet`, `stagedEntries`, `openCount` and `toneOf` shows the code takes any word. A typo in a new row (for example `statuses: [interveiw]` in the Interview row, or an unlisted hex) passes that reading, YAML parsing and every named test, and only a read of the diff or the look catches it. A case-run program over the loaded config and `waiting`/`collectionLanes` would fail on it.
- C2: yes, for the same reason.
- C3: no part of the goal rests on it. It is a regression case and is checked as written.
- C4: yes. The `applied: null` row passes whether or not the Interview row exists.
- C5: yes. No `STATUS_ROWS` row holds `interveiw`. The probe shows the answer changes from none to `interview`, so a case-run program would separate the two.
- C6: yes. The schema rows pass on the base and after, and the case leaves out the vocabulary finding that changes.
- C7: no. The Make reader copies the block verbatim, so a read of the edited block is the result.
- The step line's check (the look on landing): no, provided the look is made over the hub with its landing edit (`interview` in the options and the UGent entry set to it), which the brief assigns to the landing.
- Item 1's checks (verify 1 to 4): yes. No test reads the new rows, and the YAML parse checks syntax only. Only the diff read covers it.
- Item 2's checks: yes, the same.
- Item 3's checks: yes. `templates.test.ts` does not read the Applications options. The diff read covers it.
- Item 4's checks: yes. No check reads HELP:296. The diff read covers it.
- Item 5's check: no. `diff -rq` against the base copy shows no change under `src/`.

Findings: Q1. C1, C2 and C4 to C6, and the checks of items 1 to 4, can pass without the goal. The fix is C-1's case-run program, extended to C1 and C2. It would print, for a planted applications entry at `interview` and at `offered` with a past deadline, whether `ticker.ts`'s radar line is made, whether `waiting().applications` holds it, the stack label and `toneOf` colour from `collectionLanes`, and the `stagedEntries` count. That needs one edit to the brief's ban.

## 6. Implied inputs

This is a configuration step whose words drive product code, so I treat it as a code step.

- I1. An entry at `interview` or `offered` with subtasks or follow-up notes. Both statuses carry `closes_deadline` and no `live_subtasks`. `ticker.ts:461-466` and `:522-527` skip such an entry's follow-ups and subtasks, so they leave the Focus Tasks section, as an `applied` entry's do today. An application at interview is the one most likely to hold preparation tasks. The rulings (Interview status, Offered status flags) fix `closes_deadline` and `deadline_met` but do not mention `live_subtasks`, so the brief should state this result as a case: expected, the lines leave the radar. Whether `live_subtasks: true` is wanted is a design point the rulings do not settle, and I think it should be raised as an open item rather than left implicit. The UGent entry carries no subtasks or follow-ups today (read at its key in the hub file). Missing.
- I2. The entry's card in the Applications view draws its status chip in `statusTone` (`tones.ts:229-232`): purple for `interview`, teal for `offered`. It is visible, and it is in neither the cases nor the report's before-and-after list. Missing. Expected: purple and teal chips.
- I3. The Focus band card of an entry at `interview` or `offered` shows no countdown (`focus-lanes.ts:211`). This is visible and implied by C1, but not stated. Missing. Expected: no countdown.
- I4. A hub that replaces `position_stages` whole: oculus's new rows do not reach it, and its own list stands. Expected: unchanged. The research hub sets none (grep of its `.oculus/config.yml` printed nothing), and no other workspace hub has an applications file (`ls ~/workspace/*/.oculus/data/academic/applications.yml` printed only the research hub's). Low cost. Missing, but it can stay out.
- I5. A status written as `Interview` or ` interview `:
  - `wordFlag` and `stagedEntries` trim and lower-case it, so it is deadline-met and stacked.
  - `statusTone` lower-cases without trimming.
  - `validate.ts` compares it exactly, so it gets a finding naming `interview`.

  This is the same for every status and costs nothing new. Not needed.

Findings: I1, I2 and I3 are missing from "Cases" with the expected results above, and I1's flag question should go to the orchestrator.

## 7. ADRs

- `ls docs/adr` prints "No such file or directory". No record.

Findings: none.

## 8. Dictated text

- `interview: { color: "#7c3aed", closes_deadline: true, deadline_met: true }`: found by `grep -n 'interview: { color: "#7c3aed", closes_deadline: true, deadline_met: true }' .scratch/migration/agents/briefs/O138.md` (lines 11, 24). Holds.
- `offered: { color: "#0d9488", closes_deadline: true, deadline_met: true }`: found the same way (lines 11, 24). Holds.
- `{ label: "Interview", color: "#7c3aed", statuses: [interview] }`: `grep -n '{ label: "Interview", color: "#7c3aed", statuses: \[interview\] }'` (line 25). Holds.
- `{ label: "Offered", color: "#0d9488", statuses: [offered] }`: `grep -n '{ label: "Offered", color: "#0d9488", statuses: \[offered\] }'` (line 25). Holds.
- `[not-applied, active, accepted, rejected, declined, withdrawn, applied, interview, offered]`: `grep -n 'withdrawn, applied, interview, offered\]'` (line 26). Holds, subject to open item 660.
- "the comment of the commented entry lists the same nine words, wrapped as it is now": `grep -n 'wrapped as it is now'` (line 26). This breaks the rules file's "What every package obeys" ("A comment edited by the step is rewrapped as a whole paragraph at 100 columns, so no line inside a sentence ends short") and CLAUDE.md's "Writing", first bullet (a code comment "is wrapped as a whole paragraph at 100 columns"). Line 1577 is 86 columns, and "declined," fits on it at 96. The rewrapped text is these two lines (96 and 76 columns, measured with `${#a}`):
  ```
  #    status: active               # required: not-applied, active, accepted, rejected, declined,
  #                                 # withdrawn, applied, interview or offered
  ```
- The HELP:296 parenthesis, `grep -n "and \\\`offered\\\` in oculus's)"` (line 27). The words hold. The brief writes them as `` `(\`submitted\`, \`under-review\`, ...)` ``, with backticks escaped by a backslash inside a single-backtick code span. A backslash is literal inside a code span, so the line as written holds `\` characters a builder could copy into HELP.md. It should be dictated in a double-backtick span or a fenced block: ``(`submitted`, `under-review`, `applied`, `interview` and `offered` in oculus's)``.
- `LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/briefs/O138.md` prints nothing: the brief is ASCII.

Findings:
- D1. Replace "wrapped as it is now" with the two rewrapped lines above, which follow the 100-column comment rule.
- D2. Dictate the HELP:296 parenthesis without backslash escapes: a double-backtick span or a fenced block.

## Declined to judge

- Whether `interview` and `offered` should carry `live_subtasks` (I1): it is a design choice outside the rulings, for Axel or the orchestrator.
- The order of the template's options: open item 660, Axel's call. The brief handles it as pending.
- The brief's report path under `.scratch/`: open item 661, Axel's call.
- Two sentences on main outside this step contradict `toneOf`'s grey for an unlisted hex: `config/catalogs/vocab.yml:9` ("Unlisted hex values pass through unchanged") and `config/options/catalogs/vocab.yml:11` ("a hex the palette does not list is drawn as it is written"). They are not names this step changes, so I did not judge them as findings of the step. I did not check every colour reader for a hex pass-through.
- Whether purple `#7c3aed` (c-purple) reads apart from violet `#7c5cff` (c-violet, used by in-prep, planned and others) in each theme: not measured. No stack of the Job applications column uses violet.

Agent usage: a3acca86b4a0aeeaa, claude-opus-5-5, 220970 tokens, 97 tool uses, 11 min 7 s.

## Closed

Each finding closed in `agents/briefs/O138.md` before the preparation commit:

- N1: `schema-rules.test.ts` `STATUS_ROWS` named under "What is on the tree" with the probe's result, and in verify 1.
- P1: `applied` is line 154; the premise and the paths line read 154.
- P2, P3: the teal row is :32, and the hex grep's every line is quoted.
- P4: the commented example is 493-497.
- P5: the steps-in-flight line drops O139 (stopped, now ruled 662) and gives O135's round.
- P6, I3: `ticker.ts:328` and `focus-lanes.ts:211` named; C10 added.
- C-1, Q1: the case-run program the rules file allows replaces the test rows that hold none of the new words, for C1, C2, C4 to C6 and C8 to C10.
- C-2: C6's expected result names both findings on the base and the one after.
- C-3: verify 2 runs `npm run diagrams` first.
- C-4: verify 3 is the perl gate over the three files.
- C-5: the report checks each new key and label.
- I1: C8 states the result under the rulings (as `applied`); whether the two words carry `live_subtasks` is Axel's, open item 664, applied at landing.
- I2: C9 added.
- D1: item 3's comment dictated as the two lines rewrapped at 100 columns, in ruling 660's order (92 and 80 columns).
- D2: item 4's parenthesis dictated in a fenced block, without backslashes.
- The verify list drops `templates.test.ts` and `make.test.ts`, which read no Applications option.
- Ruling 660 (a), given after the check: item 3, C7 and decision 1 take its order.
