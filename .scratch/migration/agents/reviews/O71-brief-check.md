# Step O71 brief check (on main at aa79b883)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/O71.md`. A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A line of code or a hit of a grep keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

Brief check of O71 (`/Users/axelfaes/workspace/oculus/.scratch/migration/agents/briefs/O71.md`), read on main at aa79b883 (`git log --oneline -1`: "aa79b883 Land O60: ..."), with the uncommitted ledger files (`git status --short`: plan.md, orchestrator-state.md, queue.md and choices.md modified; briefs O69, O70 and O71 untracked). I changed no file.

Main findings, in short:
- `docs/apps.md:402` documents `priority?` as a project field apps can read. The step makes that line false, and it is not on the write list.
- The brief does not mention that O70 also writes the whole of `vocab.ts`.
- Three guarded entries are missing from the brief: G83, G126 and G128. G126's own text will also become false.
- Case 7's grep and the brief's assignment of cases to proofs could both pass while parts of the goal are still missing.
- The brief points the builder to an output filter in the rules file that does not exist, and names no base copy.

## 1. Names

Command: `grep -rn -E 'priority_levels|flamesOf|nextPriority|prioritiesShape|cyclePriority|fire_glyph|priority_none|set_priority|\boncycle\b|\bflames\b|\bpriorities\b|\bPriority\b' src tests config docs README.md --exclude=local.yml`. I added `grep -rn -i 'priority' src tests config docs README.md --exclude=local.yml`, `grep -rn -w fire src tests config docs --exclude=local.yml` and `grep -rn -i "flame\|click.to.cycle" ...`.

Every hit of the project priority is inside the write list and its ranges except these:

1. `docs/apps.md:402`, the `projects` row of the `portfolio` payload apps receive, lists `` `statusLine?`, `priority?`, `eli5?` ``. Once item 1 removes `Project.priority`, this line is false. It is not on the write list, and no step in flight writes `docs/apps.md` (it is not in the O69 or O70 write lists). It should be added as `docs/apps.md` line 402. No app reads the field: `grep -rln priority ~/workspace/*/.oculus/apps` prints nothing.
2. Outside the grep scope but found while reading: `agents/guarded.md:` G126 says "lays each key of `config/catalogs/vocab.yml` but `priority_levels` over oculus's by its shape". This becomes false. It is a ledger file, so the orchestrator must rewrite it at landing; the brief says nothing about it.
3. `docs/HELP.md:517` ("every list but `priority_levels`") is outside the write list on purpose and is handed over as Doc text. It is covered.
4. These are other things, kept apart, and the change leaves them true:
   - `src/monaco-modules.d.ts:198,207`, `ui/controls/editor/kit/rite/settings.ts:40` (Monaco language priority).
   - `shell/status/AppItems.svelte:4`, `state/system/apps/shell/shell.svelte.ts:312,332`, `frames.svelte.ts:51-52`, `server/machine/apps/shell/registry.ts:158-159`, `runner-shell.mjs:179-212`, `data/helpers/files/apps/status-items.ts:11,16`, `model-apps.ts:153` (status-bar item priority).
   - `server/machine/apps/read/contributes/{shape.ts:52,reader.ts:345}`, `model-apps.ts:68`, `state/system/apps/shell/editors.ts:45`, `show/editor-pick.ts:23`, `docs/apps.md:191` (custom editor priority).
   - `state/system/apps/tools/scm.svelte.ts:91`.
   - `server/machine/hpc/parse.ts:74`, `model-sessions.ts:631`, `views/system/machine/hpc/Jobs.svelte:48,60` (SLURM job priority).
   - `docs/apps.md:260`.
   - Tests: `comment-rules.test.ts:83-96`, `state/system/apps/shell.test.ts:66,302,313`, `contributions.test.ts:56`, `server/edit/writes-collection.test.ts:96-175` (`priority_first`), `data/sources/career.test.ts:30,85` (prose).
5. The glyph name `fire`: `grep -rn -w fire` finds only `icons.yml:156`, `glyphs.yml:157` and `focus.yml:89` as glyph uses. Every other hit is an emitter method `.fire()`.
6. `utils`, `bin`, `README.md`, `CLAUDE.md`: `grep -rn -E 'priority|flamesOf|nextPriority|fire_glyph|cyclePriority' utils bin README.md CLAUDE.md` prints nothing.

## 2. The step line

Source: `plan.md:797`, its Step 0 line `:798`, ruling `plan.md:2662` (Open item 329), and the state file's `orchestrator-state.md:192`.

1. "the manifest field `priority:`" maps to What to build item 1.
2. "`priority_levels` of `config/catalogs/vocab.yml`" maps to item 2.
3. "the flames of a Focus lane card", "the priority section of its move menu" and "its click cycle" map to item 3.
4. "their texts" (state file 329 (a): "and their texts") maps to item 4.
5. "since no manifest sets it" is a premise, checked under What is on the tree (rerun below).
6. Ruling 329 (b), ordering by priority, is "not taken", and the brief builds nothing for it. Every part has a requirement.
7. `plan.md` has no `## Goal` section: `grep -n '^## ' plan.md` prints only Steps, Could run in parallel, Rulings, Agents and Blocked. I used the goal the caller stated (the priority gone everywhere it is read, written or drawn).
8. The Step 0 line holds O71 until O60 lands. O60 is on main (head aa79b883 "Land O60"), so it is met.

## 3. Premises

1. **No manifest sets `priority:`.** Holds. `find ~/workspace/research-hub -name project.yml | xargs grep -ln "^priority:"` prints nothing (exit 1) over 115 manifests. A looser `grep -ln priority` finds only `projects/ideas/quantum-tensor-fl/project.yml:11`, which is prose in `status.line` ("lowest priority (post-tenure)"). `grep -ln priority ~/workspace/*/.oculus/project.yml` over 7 repository manifests prints nothing. `grep -n priority ~/workspace/research-hub/.oculus/config.yml` prints nothing.
2. **`config/catalogs/vocab.yml:184-189`.** Off by one. Line 184 is blank, the comment is `:185` and the key and rows are `:186-189` (`grep -n` prints `185:# Per-card priority ...`, `186:priority_levels:`). The write range 183-190 covers them. `:4` holds; the sentence "`priority_levels` is oculus's alone." is on line 4.
3. **These references hold as stated:**
   - `config/options/catalogs/vocab.yml:3`
   - `manifest-schema.yml:15` and `:42`
   - `vocab.ts:4`, `:18`, `:309-312`
   - `model-entities.ts:356-360`
   - `normalise.ts:258`
   - `forms/schema.ts:356`
   - `in-place.ts:43`
   - `hub-names.ts:367`
   - `focus.ts:1`, `:72-77`, `:185-203`, `:205-213`, `:553-563`
   - `focus.yml:89`, `:104`, `:109`
   - `icons.yml:156`, `glyphs.yml:157`
   - `normalise.test.ts:95`, `:127`, `:262`
   - `config-folder.test.ts:222`
   - `docs/templates.md:648`, `docs/data-map.md:171`, `docs/HELP.md:517`
4. **`Lanes.svelte`.** These hold: `:5`, imports `:26-45` (names at 29, 38, 41; the block runs to 47), `:75`, `:151-160`, `:173-183`, `:244-248`. The menu is `:123-144` (doc comment from 123), where the brief says `:121-144`; the range 118-184 covers it.
5. **`LaneCard.svelte` numbers are wrong for two items** (`cat -n`):
   - Props: `flames`, `unset`, `oncycle` are on `:48-54` in `Props` and `:67-71` in the destructure. The brief says `:39-62`, which misses `:67-71`.
   - The flame badge is `:92-103`, where the brief says `:83-95`.
   - The head comment mentions the badge at `:3`, `:5` and also `:10-12` ("it is a drag handle with a click-to-cycle badge at its leading edge, which is a different thing from the card a board of projects draws"). The brief names only `:3-5`. Lines 10-12 are the stated reason LaneCard is not `ui/frame/Card.svelte`, and half of that reason goes with the badge (see The question 6).
   - The CSS comment `:172` ("The flames and the name are plain buttons") also changes.
   - The file is on the write list whole, so coverage holds; only the cited numbers are wrong.
6. **Glyph `fire`** is read only through `focus.fire_glyph`. Holds (Names 5).
7. **Steps in flight.** The brief leaves out a shared path. O70's write list (`awk` over `briefs/O70.md`) includes `src/lib/data/shapes/catalog-files/vocab.ts` whole, and O71 writes `vocab.ts` 1-20 and 305-315. The brief's sentence on O70 does not name `vocab.ts`. O70's stated change is `laneRow` at `vocab.ts:28-62`, so the hunks probably stay apart. O70 and O69 also write `icons.yml` and `glyphs.yml` whole, as the brief describes. Adjacency the orchestrator should judge:
   - `focus.ts`: O70 `:57-70` against O71 `:71-78`, and O70 `:154-183` against O71 `:184-214`. These ranges touch, so a merge stays clean only if the deletions keep an unchanged line between the hunks (for example, delete `:72-78`, not `:71-77`).
   - `vocab.yml`: O70's lane rows actually run to `:182` (`grep -n '^focus_lanes:'` gives 172, with rows 173-182; O70 says 168-180), and O71's range starts at 183.
8. **Guarded entries.** The brief names G12, G13, G32 and G124. Results:
   - G124: its Code line names `src/lib/state/boards/board/` and the board shapes, not `focus.ts`. Its test (`board-rules.test.ts` describe 'the Focus lanes') imports only `projectLane, unplaced` from `focus.ts` (line 19 of its imports), and the step changes neither.
   - Missing, G83: `docs/templates.md` and `manifest-schema.yml`. Its test is `tests/checks/config/templates.test.ts` 'shows every field of the manifest schema a file holds in the project.yml template'. The step changes both sides of it.
   - Missing, G126: `in-place.ts` is in its code folder `merge/`, and its text names `priority_levels` (Names 2).
   - Missing, G128: its Code line names `src/lib/state/forms/schema.ts`.
   - The awk over `guarded.md` that found them: G83 manifest-schema/templates.md/hub-names.ts, G126 vocab.yml, G128 forms/schema.ts, G28 hub-names.ts (`sameDiskFile`, not touched), G66 vocab.yml.
   - Verify item 2 runs none of G83's, G126's or G128's tests. `test:quick` reaches `tests/checks` (G83), but the brief should name them.
9. **Verify list.** `.agents/plan.yaml:4` `verification:` is the state file, whose `verify:` is `npm run test:quick`. Holds.
10. **"each output piped through the filter the rules file names"** (brief line 117). `grep -n -i "filter\|pipe" spec.md` prints nothing, so spec.md names no filter.
11. **Base copy and worktree.** The brief names neither (`grep -n -i "worktree\|base copy" O71.md` finds only "the root of the worktree"). spec.md "Where you work" says the brief names a base copy. The `diff -rq` file table and the `unused-exports.sh` comparison "with the base's" both need it.
12. **Verify item 5** says "as the template's rules say" and names no template.
13. **Case 2's finding exists as described.** `src/lib/data/snapshot/schema/check.ts:213-216` gives `findings.schema.not_declared`, "key {0} is not declared by the schema of this file" (`config/text/findings.yml:260`), through `runSchemas`, which `src/lib/data/index.ts:60` calls. `normalise` alone does not produce it.
14. **Case 3's finding exists.** `mergeHub` (`hub-layer.ts:431-470`) names a key outside `hubKeys()`, and `priority_levels` is not in HUB_LIST or VOCAB_SHAPES. A comparison of the vocab.yml keys with HUB_LIST, VOCAB_SHAPES and `config/options/catalogs/vocab.yml` shows every other list is in all three. So the new sentence "every list of `vocab.yml`" is true after the change.
15. **Paths coverage.** Every line the brief asks to change lies inside its listed ranges or whole files. The one exception is `docs/apps.md:402` (Names 1), which no item asks for.

## 4. Cases and checks

1. **Case 1** ("drawn on Focus as before, with no flame badge") and the "the card draws no badge" part of case 2 are drawings. spec.md says a case only a page shows is checked by reading and named against the look on landing. The brief assigns cases 1 to 4 to G32's, G12's and G13's tests and a snapshot run, and only cases 5 and 6 to the look. Cases 1 and 2's drawing parts need the look too. Today every card draws at least one faint flame (`Lanes.svelte:181-182`, `Math.max(flamesOf(...), 1)`).
2. **Case 2** asks for the schema's unknown-key finding, but the stated proof is "a run ... of the snapshot reader". `normalise` gives no finding. The run must be the build that calls `runSchemas` (`data/index.ts`), and the brief should say so. Under spec.md's case-run program rule, its source and output are both quoted; the brief says only "a run the report quotes".
3. **Case 3** checks `mergeHub`, which the step does not change (only the comments of `in-place.ts` and `hub-names.ts`). It holds the same before and after. G12's and G13's tests do not contain `priority_levels`: `config-folder.test.ts:774-785` uses `wallpaperz`. So "checked by G12's and G13's tests" does not exercise this input.
4. **Case 4** is consistent with spec.md (G12's 'merges without a finding ...' and the `EXPECTED` list).
5. **Cases 5 and 6** are consistent: reading plus the look.
6. **Case 7** is consistent, but see The question.
7. **No case covers the keyboard.** The badge's `ToolButton` (`LaneCard.svelte:93-97`) is a tab stop with the accessible name `project.priority ?? t('focus.set_priority')`. spec.md counts focus, tab stops and the accessible name as visible, and the Report's "before and after" should name them (see Implied inputs 4).

## 5. The question

1. **Case 1:** yes, it could pass. G32's normalise row and the snapshot run pass while `LaneCard` still draws a faint flame. Only the look shows the badge, and the brief does not assign it to the look.
2. **Case 2:** yes, if the run is `normalise` only. A schema row `priority` left in `manifest-schema.yml` would still give "no priority read" and no finding is looked for. Run through the build, it would fail correctly.
3. **Case 3:** yes. It passes on the unchanged tree and after, whatever the step does.
4. **Case 4:** on its own, yes. With `'priority_levels'` removed from `vocab.yml` and from `EXPECTED`, a `priority_levels` key left in `vocab.ts`'s shape passes, because it is `.optional()`. Case 7's first grep catches that.
5. **Case 5:** no, if the look is done. The menu is drawn from `menuFor`.
6. **Case 6:** no, if the look or a reading is done. The form's fields come from `manifest-schema.yml`.
7. **Case 7:** yes. Its first grep omits `cyclePriority`, `Priority`, `prioritiesShape`, `priorities`, `flames`, `oncycle`, the `fire:` rows of the glyph catalogs, and `priority` in `Lanes.svelte`, `LaneCard.svelte`, `focus.ts`, `docs/templates.md`, `docs/data-map.md` and `docs/apps.md`. Its second grep covers four files. For example, `choose` could still write `{ priority: value }` (`Lanes.svelte:154-156`) and the `oncycle` and `flames` props could stay, and both greps would print nothing. A wider `grep -rn -i priority` over the step's files and the docs, with the expected other-thing hits listed, would close this.
8. **The step line's check:** the step line names no check. The brief's case 7 stands in for it, with the gap above.
9. **Item 1:** yes. It can be met in full while `docs/apps.md:402` still tells app builders the payload carries `priority?`.
10. **Item 2:** no, for the code. The new sentences are judged by reading.
11. **Item 3:** in part. The head comment must "state what holds now", but `LaneCard.svelte:10-12` justifies the separate component partly by the badge. The brief does not say whether the drag handle alone still justifies not using `ui/frame/Card.svelte`, so a builder can write a reason that has not been checked.
12. **Item 4:** no. `config-folder.test.ts:454` ('names a glyph only where the source or another config file reads it') fails on an orphan glyph.
13. **Item 5:** yes. `toEqual` ignores a property whose value is undefined, so after the inputs lose `priority`, the row passes even if `normalise.ts:258` still reads it. Case 7's second grep catches that. Keeping `priority: 'high'` in alpha's input while dropping it from the expected object would make the row itself show the field is not read. Whether to do that is the orchestrator's call; it keeps the old key name in a fixture.
14. **Item 6:** yes. `docs/apps.md:402` is missing (Names 1).

## 6. Implied inputs

1. **A manifest write naming `priority`** (a page loaded before the change, an app, or a form). Expected: refused. `server/edit/writes/manifest.ts:410-425` refuses a field the schema does not name with `server.manifest_write.not_in_schema`, and also refuses clearing it (`raw === null`), because `priority` is no group. So a manifest that still holds `priority: high` can be cleaned only in the YAML editor. No case states this.
2. **The undo of a recorded `priority` write from the change log.** It goes through the same writer with `reading: 'record'` (`undo.ts` header, `manifest.ts:395-425`). Expected: refused as not in the schema, nothing written. It has not happened on this machine: `grep -c '"priority"' ~/.oculus/changes.jsonl` prints 0 over 274 lines.
3. **An app reading `project.priority` from the `portfolio` payload.** Expected: the field is absent and `docs/apps.md:402` no longer names it. No app reads it (`grep -rln priority ~/workspace/*/.oculus/apps` prints nothing; the only app folder is `~/workspace/officium/.oculus/apps`).
4. **The keyboard on a lane card.** Expected: Tab goes from the card's name button to the hub chip, if any, then the move menu, with no "set priority" stop before the name. The name read out is the name button's. Not in Cases or the Report's before and after.
5. **The project form saved over a manifest that still holds `priority: high`.** Expected: the form has no field, sends no `priority`, and the line stays in the file with its unknown-key finding. `fieldValues` loses `priority` (`forms/schema.ts:356`).
6. **A hub's `manifest_fields:` row naming `priority`.** Today that is a finding, because it names a field oculus has (G128). After the change it is accepted as that hub's own field. A row with `from: vocab.priority_levels` becomes a finding, because `VOCAB_FILE_KEYS` (`vocab.ts:365`, derived from the shape) no longer holds the key. `grep -n priority ~/workspace/research-hub/.oculus/config.yml` prints nothing, so this has not happened.
7. **The Settings view.** Expected: no change. `config/options/catalogs/vocab.yml` describes no `priority_levels` (`grep -nE '^\s{0,4}[a-z_]+:' config/options/catalogs/vocab.yml` lists none), so Settings never showed it. No case is needed.
8. **A new project made from the template.** `server/files/project/make.ts:21` reads `docs/templates.md`. Expected: line 648 is a comment, so no new manifest writes `priority`, before or after. G83's test holds the template to the schema.

## 7. ADRs

1. `ls docs/adr` prints "ls: docs/adr: No such file or directory". The brief's claim holds.

## 8. Dictated text

1. `grep -n 'every list of \`vocab.yml\`' O71.md` finds line 37: the `docs/HELP.md:517` replacement, "every list of `vocab.yml`" in place of "every list but `priority_levels`". It holds spec.md's prose rules: ASCII, plain, no em dash, no 'not X but Y'. A judgment, not a rule break: the result reads "under the keys of `vocab.yml` (every list of `vocab.yml`)", so the parenthesis repeats its own sentence and could be dropped.
2. Line 33, the comments must "state every list of `vocab.yml`" and "each sentence stating what holds now": this says what to state and is not dictated.
3. `LC_ALL=C grep -n '[^ -~]' O71.md` prints nothing. The brief is ASCII.

## Declined to judge

1. Whether O70's and O71's hunks in `vocab.ts`, `focus.ts`, `vocab.yml`, `icons.yml` and `glyphs.yml` merge cleanly. That depends on the exact lines each builder deletes, so it is the orchestrator's `shared_paths:` judgment. I gave the touching ranges under Premises 7.
2. Whether `LaneCard` should become `ui/frame/Card.svelte` once the badge goes. That is a design question for the orchestrator. I only noted that the brief leaves the head comment's reason open.
3. I did not run any test or `npm` command. The brief check runs none, and the counts and lines above come from `grep`, `sed`, `awk` and `find`.
4. `glyphReaders` (the code behind `config-folder.test.ts:454`): I did not read whether it would count a `.fire()` call as a reader of the glyph `fire`. Item 4 removes the row in any case.

Agent usage: a158f829f8014d7a0, claude-opus-5-5, 210478 tokens, 74 tool uses, 8 min 55 s.

## Closed (the session's change to the brief for every finding above, and each dictated line added after the check, made before the preparation commit)

- Names 1, The question 9 and 14, Implied 3: item 6 removes `` `priority?` `` from `docs/apps.md:402`, on the write list; case 7's grep reads `docs/apps.md`.
- Names 2: "What is on the tree" names G126's sentence, which the orchestrator rewrites at landing; the builder does not touch the ledger.
- Premises 2 and 7: the `vocab.yml` range is lines 185-190 and the `focus.ts` ranges 72-78 and 185-214, each leaving an unchanged line between this step's hunks and O70's (O70 now `vocab.yml` 171-182, `focus.ts` 57-70 and 154-183, `vocab.ts` 27-62); "What is on the tree" names O70's `vocab.ts` and `docs/templates.md` lines; the dispatch entry records `shared_paths:`.
- Premises 4 and 5: the menu reads `:123-144`, the props `:48-54` and `:67-71`, the badge `:92-103`, and the head comment `:3`, `:5` and `:10-12` with the style comment `:172`.
- Premises 8: "What is on the tree" names G83, G126 and G128 with their tests, and verify item 2 runs `templates.test.ts`, `hub-vocab.test.ts`, `manifest-fields.test.ts` and `config.test.ts` beside the others.
- Premises 10: the verify section names no output filter, and "What is on the tree" says `spec.md` holds none.
- Premises 11: "What is on the tree" names the worktree, reading the base with `git show <base>:<path>`, and the base's unused-exports output.
- Premises 12: verify item 5 points at the Cases section.
- Cases and checks 1 and The question 1: case 1's and case 2's card parts are checked by reading `LaneCard.svelte` and at the look.
- Cases and checks 2 and The question 2: case 2 is a run of the build that calls `runSchemas` over a copy of the demo fixture, its source and output quoted, with the finding `findings.schema.not_declared` named.
- Cases and checks 3 and The question 3: case 3 is the same build run over the fixture copy with `priority_levels:` in its config; it stays a regression check, its output quoted.
- Cases and checks 7 and Implied 4: case 8, the keyboard on a lane card; item 3 says the name button is a card's first tab stop.
- The question 7: case 7's greps add `cyclePriority`, `prioritiesShape`, `oncycle`, the `fire` rows, and a case-insensitive `priority` and `flame` grep over every file of the step and the three documents, with the other-thing lines it may print named.
- The question 11 and Declined 2: item 3 has `LaneCard.svelte`'s head comment state the reason that holds without the badge; decision 3 keeps it its own component.
- The question 13: item 5 keeps `priority: 'high'` in the row's input and drops it from the expected object; decision 4.
- Implied 1 and 2: case 9. Implied 5: case 10. Implied 6: case 11.
- Dictated text 1: the Doc text drops the parenthesis, decision 5: "under the keys of `vocab.yml`, each laid over oculus's by its shape".
- "under the keys of `vocab.yml`, each laid over oculus's by its shape", added after the check: holds; ASCII, plain, the words of `docs/HELP.md:517` with the parenthesis removed.
