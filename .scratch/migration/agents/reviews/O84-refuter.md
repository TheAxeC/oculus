# Step O84 refuter report (on /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O84, base 65f5c83c2)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
npm run test:quick -- --base 65f5c83c2        (verify 1 without `npm run diagrams`, see Declined to judge)
ok      ASCII gate (0.9 s)
ok      prettier (1.0 s): All matched files use Prettier code style!
ok      svelte-kit sync (7.7 s)
ok      svelte-check (81.5 s): 1793053054890 COMPLETED 546 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (84.4 s)
ok      vitest checks (124.5 s): Duration  111.02s
ok      vitest (180.4 s): Duration  167.50s
ok      vitest slow (236.1 s): Duration  223.58s
test:quick: 244.0 s; every command passed
(html.dom.test.ts and hub-portfolio.test.ts did not fail, so neither was rerun alone)

npx vitest run tests/data/snapshot/ tests/data/hubs/ tests/server/edit/config-key.test.ts tests/routes/edit/undo/ tests/state/system/settings/ tests/state/boards/board/ tests/server/machine/lsp/adapters/hub-keys.test.ts tests/checks/config/config-folder.test.ts        (verify 2, run as written and again with --testTimeout 20000)
 Test Files  30 passed (30)
      Tests  547 passed | 2 skipped (549)
(both runs printed these two lines)

The report's second list plus tests/checks/config/templates.test.ts
 Test Files  4 passed (4)
      Tests  45 passed (45)

wc -l of the changed files (verify 3): no source file over 880, no component over 520. Largest: selectors.svelte.ts 871, context.ts 842, model/index.ts 836, Collection.svelte 520 (its base length), Person.svelte 450; src/lib/data/snapshot/hubs/self.ts 63.

sh utils/unused-exports.sh, diffed with .agents/worktrees/O84-base/unused-exports.txt (verify 5), exit 0:
1c1
< Unused exports (229)
---
> Unused exports (230)
15c15
< src/lib/data/sources/config/local.ts: LOCAL_KEYS, readLocalText
---
> src/lib/data/sources/config/local.ts: LOCAL_KEYS
49a50
> src/lib/server/edit/writes/config/config-key.ts: writeSelf
(writeSelf is the exported function item 4 asks for, so the one new entry is required by the brief)

grep -rn 'Z10[0-9][0-9]\|ruling 4[0-9][0-9]\|\bO8[0-9]\b' src config docs tests --exclude=local.yml        (verify 6)
(nothing printed; exit 1)

ASCII gate of spec.md (perl form) over every changed file, and LC_ALL=C grep -n '[^ -~]' over the report        (verify 7)
(nothing printed by either)

grep -rn "workspace setting .self\|setting .self.\|setting self\|self. option of the sources\|setting such as .self\|self. key below\|whose .self. the people\|names no self\|names a .self\|workspace names" src config docs tests --exclude=local.yml        (verify 8)
src/lib/server/machine/runs/seeds/task-start.ts:44, src/lib/state/sources/repositories/repositories.ts:497 and :800, src/lib/data/snapshot/schema/set.ts:9, config/options/catalogs/{glyphs,latex,file-nesting,agents,icons}.yml:4, docs/data-map.md:150, docs/data-map.md:214, docs/HELP.md:288, docs/HELP.md:532, tests/server/root/process/config-cache.test.ts:177, tests/data/sources/config/layers/agents.test.ts:2
(the same hits the report names; the report gives config-cache.test.ts at 176, the tree has it at 177; data-map.md:214 and HELP.md:288 are the Doc text lines kept for landing; no decision rests on the line number)

Commands the report quotes as evidence: the first-run files of the unchanged tree, read from the builder's scratch folder o84/:
first-edits.txt:   Tests 1 failed | 1 passed | 10 skipped (12)
first-g119.txt:    Tests 8 failed | 16 skipped (24)
first-g124.txt:    Tests 1 failed | 4 passed | 102 skipped (107)
first-g8.txt:      Tests 9 failed | 1 passed | 24 skipped (34)
first-index.txt:   Tests 5 failed | 82 passed (87)
first-lspedit.txt: Tests 2 failed | 11 passed (13)
first-route.txt:   Tests 3 failed | 11 skipped (14)
first-self.txt:    Tests 13 failed | 3 passed (16)
first-undo.txt:    Tests 5 failed (5)
(these agree with the report's first-run column)

git status --short and git diff 65f5c83c2 --stat: 107 tracked files changed and 3 untracked (self.ts, self.test.ts, user-key.test.ts), plus the report file. ls docs matches the report; docs/adr does not exist.
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `self` leaves config/defaults/sources.yml and config/options/sources.yml and joins config/options/local.yml, LOCAL_KEYS and LocalConfig; another hub's file setting it gives local_other_hub (self.test.ts case 7 row); a workspace file setting it gives settings_unknown (case 8 row); docs/templates.md changed as asked; SelfCheck and the per-hub validate rule are gone.
- 2: holds. The per-hub mark in normalise.ts and checkSelf in index.ts are gone; markSelf (src/lib/data/snapshot/hubs/self.ts) marks the one person resolveKey/holdersOf names after the merge; `self` joins FIELDS with BUILT_FROM.self = ['portfolio']; the watcher-level case 10 row and the case 30 and 32 rows pass in verify 2.
- 3: holds. self_unknown is rewritten and self_ambiguous added beside it in config/text/findings.yml, both on the primary's local.yml at `self`; the case 4, 5 and 6 rows pass.
- 4: violated, Spec 1.
- 5: holds. resolvedRecords in catalog/options.ts feeds both the Settings choice and the server's value check; the row is in This machine with Reset and Add person; theme-groups.test.ts case 19 row and machine-section.test.ts pass.
- 6: holds. selfStanding gives mark, named, ambiguous and no_primary; Person.svelte draws the button on every person with the tips of person.yml. The ambiguous state is a fourth state the report names as judgment call 9. One standards finding, Standards 4.
- 7: holds. newProjectPerson takes `where` and names the user only where the key resolves to them; the case 26 rows pass.
- 8: holds, except that case 28 is partial (Spec 2). The reference index scans the primary's local.yml through localNode/localScans for `self` alone; edits.ts and lsp-edit.ts accept a hub's own `.oculus/` files through outsideEdits and keep refusing nested dot folders, node_modules, `<hub>/secrets` (lsp-edit.ts:51) and `~/.oculus`; lsp-edit.ts:89-90 checks a machine file with checkLocal.
- 9: holds for the catalog keys and the Doc text section; three sentences the change makes false remain (Standards 2).
- 10: holds, with Spec 3 on the entry the brief names for edits.test.ts.

Cases of the brief's "Cases":

- 1: met, self.test.ts case 1 row, red on the unchanged tree (first-self.txt), passes in verify 2.
- 2: met, self.test.ts case 2 row.
- 3: met, self.test.ts case 3 row.
- 4: met, self.test.ts case 4 row.
- 5: met, self.test.ts case 5 row.
- 6: met, self.test.ts case 6 rows.
- 7: met, self.test.ts case 7 row.
- 8: met, self.test.ts case 8 row.
- 9: met, self.test.ts case 9 row and the no_primary row of config-key.test.ts.
- 10: met, the watcher-level row of self.test.ts (tagged slow, passes in vitest slow).
- 11: met, user-key.test.ts case 11 row (bytes, checks, log record, undo byte for byte).
- 12: met, user-key.test.ts case 12 rows (mode 600 kept; file created at 600; .gitignore made, extended, untouched).
- 13: met, user-key.test.ts case 13 row.
- 14: met, config-key.test.ts case 14 row.
- 15: met, config-key.test.ts case 15 row.
- 16: met, config-key.test.ts case 16 row.
- 17: met, config-key.test.ts case 17 rows (zed refused, kim of L and L2 refused, lee of one other hub written).
- 18: met, user-key.test.ts case 18 row.
- 19 (look): not verifiable by a run; the choice's items are met by theme-groups.test.ts ('Ada', 'Bob (other)') and the read-only rows by machine-section.test.ts; the drawn page needs a look.
- 20: met, the G119 rows of theme-groups.test.ts over the primary's people and the row with a same-named person of L.
- 21 (look): not verifiable by a run; selfStanding's named state is tested, the press and the drawn pressed state need a look.
- 22 (look): not verifiable by a run; the disabled state with the tip naming P's kim is tested through selfStanding, the drawn button needs a look.
- 23: met, rename.test.ts and hub-keys.test.ts case 23 rows.
- 24: met, rename.test.ts case 24 rows.
- 25: met, the hub-keys.test.ts definition row from `self` of local.yml.
- 26: met, the board case 26 rows.
- 27: met, self.test.ts case 27 row (selfName) and the G124 Mine only row.
- 28: partial, the `.oculus/secrets/` clause, Spec 2; the rest met by edits.test.ts and routes/replace/lsp-edit.test.ts case 28 rows.
- 29: met by reading: setSelf in ui.svelte.ts sends the config key write without writeOption, so the unsaved workspace with a primary writes P's local.yml and no Save Workspace As is offered for it.
- 30: met, self.test.ts case 30 row (mark moves) and user-key.test.ts gone row.
- 31: met, self.test.ts case 31 rows and the source save refusal by checkLocal.
- 32: met, self.test.ts case 32 rows.
- 33: met by reading: the local.yml schema gives `self` as a string with no enum, so kim of L alone gives no diagnostic.
- 34: met, the user-key.test.ts not_parsed row of writeSelf: refusal returned, file unchanged, refusal text holds no text of the file.

## 1. Spec

- src/lib/server/edit/writes/config/config-key.ts:339: "if (localProblemAdded(source, edited)) return { refused: 'local_check' };"; what is wrong: item 4 asks that the new text be "verified with `checkLocal` ... a text that fails refused with its reason and nothing written". The write uses localProblemAdded (config-checks.ts:143), which refuses only a problem the edit adds, and answers the fixed sentence `server.config_key.local_check` ("The edit would leave a key of local.yml that the machine does not read, so the file is left as it is", config/text/server.yml:121) instead of checkLocal's sentence naming the key. The report does not name the departure under Judgment calls or under "What in the brief was wrong". failure scenario: a local.yml already holding `port: x` takes a `self` write, where checkLocal would refuse it; and an edit refused for a key it breaks tells the user a generic sentence with no key named, so they cannot tell which key to fix. The first behaviour may be the better one (a broken key elsewhere should not block `self`), but it is a ruling for the orchestrator, not a silent choice. verdict: item 4 violated (minor).

- src/lib/data/prose/markdown/note-names.ts:169-178: "const own = hub && folders[0] === HUB_OWN_FOLDER; return folders.slice(own ? 1 : 0).some((part) => part === 'node_modules' || part.startsWith('.') || part === '..');"; what is wrong: case 28 asks that "an edit naming a file in `.oculus/secrets/` ... is refused `lsp_edit_outside` as now". outsideEdits('.oculus/secrets/a.yml', true) is false (a node run of the function), where the base rule inHiddenFolder gave true, so such an edit is now accepted. The hub's secrets folder is `<hub>/secrets` (src/lib/data/helpers/files/private-folders.ts:16) and stays refused (lsp-edit.ts:51, edits.ts:114), so the brief's case names the wrong folder; the report names neither the gap nor the wrong premise. failure scenario: a language server edit reaching a file someone keeps under `<hub>/.oculus/secrets/` is written by Apply, where the case says it is refused. verdict: case 28 partial; the orchestrator rules whether the clause means `<hub>/secrets` (then met) or `.oculus/secrets/` too (then a refusal is missing).

- Brief item 10, "the entry of `tests/state/system/lsp/edits.test.ts` for the apply"; what is wrong: no guarded entry names that file (`grep -n 'edits.test' .scratch/migration/agents/guarded.md` prints nothing, as the report states in its test table), so the premise is wrong; the report assigns the rows to G2 and G8 in the table but does not list the premise under "What in the brief was wrong". failure scenario: the orchestrator writing guarded.md at landing looks for an entry of edits.test.ts that does not exist. verdict: item 10 holds; the premise is for the orchestrator to settle.

- src/lib/server/root/context.ts (hunks at 320, 723 and 751-753): the step's path list names "context.ts (lines 295-330)"; the hunks at 723 and 751-753 lie outside it and the report does not name the widening there. failure scenario: a step in flight working near context.ts 720-760 merges against an unexpected hunk; main's O86 hunks at 386-389 and 813-816 do not overlap these, so the merge stays simple. verdict: none.

## 2. Proof

- The report's test table, tests/state/system/lsp/edits.test.ts row "tells the server's refusal of a local.yml the edit would leave with a key the machine does not read, with the reader's sentence (case 28)": "was written after the source changed and was not run on the unchanged tree (by reading: the base's `refusedWrite` in edits.ts has no `local` branch and answers `lsp_edit_failed`)"; what is wrong: verify 4 asks that each new test of a changed behaviour fail on the unchanged tree; this row was never run there (first-edits.txt shows only the posting row red and the no-hub row passing). The report says so and gives a reading; the reading agrees with the base. failure scenario: none observed; the row's proof rests on a read instead of a run. verdict: none.

## 3. Standards

- Comment lines past 100 columns, against spec.md "What every package obeys" (a comment edited by the step is rewrapped at 100 columns) and CLAUDE.md "No hard wrapping in prose": src/lib/data/snapshot/hubs/self.ts:26 (104) "/** Whether the people file of every hub read, so a key no hub holds is known to be held by none. */"; tests/data/hubs/self.test.ts:5 (101); src/lib/data/file-ops.ts:222 (102) "/** The machine reader's sentence of a `local` refusal, naming the key it would not read. */"; tests/data/snapshot/rename.test.ts:119 (101); tests/routes/edit/config-key.test.ts:219 (105); tests/server/machine/lsp/adapters/hub-keys.test.ts:6 (127) "// keys, wherever the file lies, and so is `self` of the primary hub's own `.oculus/local.yml`. The index is the planted hub of". Each is a `+` line of the diff; prettier does not wrap comments, so the quick list passes over them. failure scenario: the next reader sees a paragraph whose wrapping breaks the stated rule, and the next step that rewraps it carries an unrelated diff. verdict: none.

- Sentences the change makes false, against spec.md "What every package obeys" (a sentence in a head comment the change makes false is a defect): src/lib/server/accounts/connect/rows.ts:1 "// Layer 2, server. The one edit oculus makes to the machine's own `.oculus/local.yml` of a hub: one" (writeSelf and lsp-edit now edit it too); src/lib/server/files/workspace/machine-file.ts:7-11 "The modules that ask here are the source tab's key check ... and the place of a Settings write (`edit/writes/config/config-place.ts`)." (lsp-edit.ts:43 and :89 now ask, and the report lists this head as "Still true"); src/lib/server/edit/writes/config/config-place.ts:184-187 "a link from a settings file to one of them leads to it, and no write lands there." (the `local` place of `self` is now a write to that file). failure scenario: a reader auditing who writes local.yml trusts rows.ts or machine-file.ts and misses writeSelf and lsp-edit. verdict: item 9, fix at landing.

- src/lib/server/edit/writes/config/config-key.ts:231-238 `function localText(path: string): string | null` and src/lib/server/edit/writes/config/config-place.ts:173 `export function placeText(place: Place)`: both read a file and answer null on ENOENT; and `const USER_KEY = 'self';` is defined twice (config-place.ts:56, src/lib/state/system/config/rows.ts:460). Against spec.md "The principles every package is judged on" (DRY). failure scenario: the key or the read rule is changed in one place and not the other. The two USER_KEY sit in the server and the state layer, so a shared constant would live in the data layer. verdict: none.

- src/lib/views/boards/person/Person.svelte:173: "return t('person.self_ambiguous_tip', personKey, standing.hubs.join(', '));"; what is wrong: a literal separator a reader sees, where the same file joins with `t('person.sep')` at line 137 (config/text/views/boards/person.yml:20 `sep: ', '`); spec.md "What every package obeys" makes a literal string a reader sees a defect. src/lib/data/snapshot/hubs/self.ts:60 `found.hubs.join(', ')` in the finding has the same shape. failure scenario: a change of the catalog's separator leaves the tip and the finding with the old one. verdict: none (item 6 holds).

- The report does not quote the history-word grep over its added comment lines and test titles, the reuse grep, or the grep of renamed names (spec.md "What every package obeys" asks that each be quoted with its hits judged). The reviewer's verify 6 and verify 8 reruns are above and are clean or explained. verdict: none.

## 4. Behaviour

- config/text/server.yml (`server.config_key.local`) and the `lsp_edit_outside` notice: both sentences are reworded by the step; the report's "Before and after" table gives neither the old nor the new text. failure scenario: a user who knew the refusal sentence meets a different one, and the reviewer of the words cannot compare them without the diff. verdict: none.

- src/lib/server/files/fs/lsp-edit.ts:89-90 and the OpsRefusal type in src/lib/data/file-ops.ts: the `lsp-edit` operation's answer gains `error: 'local'` with a `reason` field, a wire shape the page reads (the notice `lsp_edit_local`). The report lists it in "Before and after" but not as a decision of the brief or a judgment call. failure scenario: low; an app or client reading lsp-edit answers meets a new error value. verdict: none.

## Declined to judge

- Runs of the new tests on the unchanged tree: a run there needs the new test files written into a copy of the base, which the reviewer may not do; the builder's first-run files were read and agree with the report.
- `npm run diagrams` (part of verify 1): it writes files under docs/diagrams, which the reviewer may not do. The report's diagrams sample (layer-data.dot, layer-server.dot and layers.dot label counts; writes.dot 760 insertions and 750 deletions) was not read against a regenerated set.
- The looks of cases 19, 21 and 22, and the Settings row in its 'set' state: they need the page drawn, and the reviewer may not start a server.
- Whether the builder ran any unapproved script or whole-suite command: there is no transcript to read.
- The bare-key match of `isSelfByKey` in the collection views, which reads a same-key person of another hub as the user: it predates the step and the step's items do not name it.
- The test-title updates of G66 and G67 in agents/guarded.md: the brief leaves guarded.md to the orchestrator at landing.
- The People section of the Sources heading leaving Settings: base config/options/sources.yml:191 shows `self` as its only option, so the section goes with the move; this is not a finding.

Reviewer usage: aa3b772655f6267cf, claude-opus-5-5, 111375 tokens, 116 tool uses, 23 min 38 s.
