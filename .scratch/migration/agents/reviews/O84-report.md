# O84 builder report: who the user is, read from the primary hub's local.yml and found in any hub

Everything in the brief is done.

## Open items of the state file, verbatim

`.scratch/migration/orchestrator-state.md` lines 188-191, as `sed -n 188,191p` prints them; the section holds no entry:

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
```

## The cases' first run

Every new test row was run once on the unchanged source tree, before the code changed, with `npx vitest run <file> --testTimeout 20000` (the describe or rows named). The outputs are kept at `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o84/first-*.txt`. Their lines, as printed, with `<multiplication sign>` for the failure mark and `<horizontal ellipsis>` for vitest's cut of a long row name, the time per row left off:

```
=== first-self.txt   (tests/data/hubs/self.test.ts)
<multiplication sign> marks the primary person of the key, and gives no finding (case 1)
<multiplication sign> marks the person of the one other hub that holds the key, and gives no finding (case 2)
<multiplication sign> marks the primary's person of a key another hub holds too, and not the other's (case 3)
<multiplication sign> marks nobody for a key two other hubs hold, with one finding naming them (case 4)
<multiplication sign> marks nobody for a key no hub holds, with exactly one finding on the file at self (case 5)
<multiplication sign> reads the key from the primary's file alone: another hub's is a problem naming the key and the hub (case 7)
<multiplication sign> applies no self of a workspace file's settings, which is a key that is no option (case 8)
<multiplication sign> moves the mark at the build a save of the key starts (case 10)
<multiplication sign> follows a move of the primary, reading the key from the new primary (case 30)
<multiplication sign> marks nobody for 'a number', a problem naming self that a save is refused by (case 31)
<multiplication sign> marks nobody for 'a list', a problem naming self that a save is refused by (case 31)
<multiplication sign> marks the next single holder once a holder leaves the workspace (case 32)
<multiplication sign> gives the finding of a key no hub holds once the person leaves its people file (case 32)
Test Files  1 failed (1)
Tests  13 failed | 3 passed (16)
=== first-g8.txt   (tests/server/edit/config-key.test.ts, describe "the user's key in the primary hub's local.yml")
<multiplication sign> changes the one scalar of self, keeps every other byte and the mode, and records the two values (case 11)
<multiplication sign> adds self to a file without it, every other byte and the mode kept (case 12)
<multiplication sign> makes a missing local.yml at mode 600 holding self, with 'no .gitignore, which is made' (case 12)
<multiplication sign> makes a missing local.yml at mode 600 holding self, with 'a .gitignore without local.yml, which<horizontal ellipsis>' (case 12)
<multiplication sign> makes a missing local.yml at mode 600 holding self, with 'a .gitignore naming local.yml, which <horizontal ellipsis>' (case 12)
<multiplication sign> takes self out on Reset, every other byte kept, the record holding the removed line alone (case 13)
<multiplication sign> refuses the write and the reset of self with no primary hub, and writes nothing (case 9)
<multiplication sign> refuses self over a local.yml that does not parse, and leaves it as it is (case 16)
<multiplication sign> answers a local.yml that does not parse with a refusal that holds no text of the file (case 34)
Test Files  1 failed (1)
Tests  9 failed | 1 passed | 24 skipped (34)
=== first-route.txt   (tests/routes/edit/config-key.test.ts, describe "the user's key written through the route")
<multiplication sign> refuses 'zed, a key no hub holds' by the value check, and writes nothing (case 17)
<multiplication sign> refuses 'kim, a key two hubs other than the pr<horizontal ellipsis>' by the value check, and writes nothing (case 17)
<multiplication sign> writes lee, a key one hub other than the primary holds, and logs the key and its two values (case 17)
Test Files  1 failed (1)
Tests  3 failed | 11 skipped (14)
=== first-undo.txt   (tests/routes/edit/undo/user-key.test.ts)
<multiplication sign> puts self: ada back byte for byte after a write of bob (case 11)
<multiplication sign> takes out the key a write added, every other byte kept (case 12)
<multiplication sign> puts the line a reset took out back where it stood (case 13)
<multiplication sign> refuses as moved a write whose value another hand changed since, and writes nothing (case 18)
<multiplication sign> answers gone once the primary is another hub, and writes nothing (case 30)
Test Files  1 failed (1)
Tests  5 failed (5)
=== first-g119.txt   (tests/state/system/settings/theme-groups.test.ts, describe 'the people of the choice self')
<multiplication sign> draws { ada: 'Ada', bob: '' } as [ 'Ada', 'bob' ], so no two items read alike
<multiplication sign> draws { k1: 'Kim', k2: 'Kim' } as [ 'Kim (k1)', 'Kim (k2)' ], so no two items read alike
<multiplication sign> draws { ada: '', bob: 'ada' } as [ 'ada (ada)', 'ada (bob)' ], so no two items read alike
<multiplication sign> draws { k1: 'Kim', k2: 'Kim', x: 'Kim (k1)' } as [ 'Kim (k1)', 'Kim (k2)', <horizontal ellipsis>(1) ], so no two items read alike
<multiplication sign> draws { k1: 'Kim', k2: 'Kim', <horizontal ellipsis>(2) } as [ 'Kim (k1)', 'Kim (k2)', <horizontal ellipsis>(2) ], so no two items read alike
<multiplication sign> offers a person of another hub whose key resolves to them from the primary, with that hub's name, and no person whose key the primary or a third hub holds (case 19)
<multiplication sign> draws a person of another hub named like a person of the primary apart: [ 'Kim', 'Kim (other)' ] (case 20)
<multiplication sign> draws a person of another hub named like a person of the primary apart: [ 'Kim (other) (x)', <horizontal ellipsis>(1) ] (case 20)
Test Files  1 failed (1)
Tests  8 failed | 16 skipped (24)
=== first-index.txt   (tests/data/snapshot/references.test.ts, tests/data/snapshot/rename.test.ts, tests/server/machine/lsp/adapters/hub-keys.test.ts)
<multiplication sign> goes from self of the primary hub's local.yml to the person it names (case 25)
<multiplication sign> renames from self of the primary hub's local.yml the person, and that file with it (case 23)
<multiplication sign> edits 'the person self of the primary hub\'s<horizontal ellipsis>'
<multiplication sign> edits self in the primary's local.yml, and no other byte, when lab alone holds amir (case 24)
<multiplication sign> scans 'self of the primary\'s file alone, un<horizontal ellipsis>' (case 23)
Test Files  3 failed (3)
Tests  5 failed | 82 passed (87)
=== first-g124.txt   (tests/state/boards/board/board-rules.test.ts, the case 26 and case 27 rows)
<multiplication sign> case 26: with self naming the primary kim, 'offers none for lab, which holds its <horizontal ellipsis>'
Test Files  1 failed (1)
Tests  1 failed | 4 passed | 102 skipped (107)
=== first-edits.txt   (tests/state/system/lsp/edits.test.ts, the case 28 rows)
<multiplication sign> posts the files of a hub's own .oculus folder, its local.yml among them, and refuses a nested dot folder and node_modules there (case 28)
Test Files  1 failed (1)
Tests  1 failed | 1 passed | 10 skipped (12)
=== first-lspedit.txt   (tests/routes/replace/lsp-edit.test.ts)
<multiplication sign> writes the people file and local.yml of the hub's .oculus folder, local.yml checked as a save of it is
<multiplication sign> refuses an edit whose local.yml would not read, with the reason, and writes neither file
Test Files  1 failed (1)
Tests  2 failed | 11 passed (13)
```

The row of case 27 in `tests/data/hubs/self.test.ts` was added after `first-self.txt` was taken and run once on the unchanged tree then; its line, as the run printed it: `<multiplication sign> names another hub's person as the portfolio chat's user (case 27)`.

Every case by number:

| Case | Checked by | First run on the unchanged tree | After the change |
|---|---|---|---|
| 1 | self.test.ts row (case 1) | red (first-self) | passes |
| 2 | self.test.ts row (case 2) | red | passes |
| 3 | self.test.ts row (case 3) | red | passes |
| 4 | self.test.ts row (case 4) | red | passes |
| 5 | self.test.ts row (case 5) | red | passes |
| 6 | self.test.ts rows 'an empty key', 'no key' | passed (2 of the 3 passed of first-self): audit, nobody is marked on the base too | passes |
| 7 | self.test.ts row (case 7) | red | passes |
| 8 | self.test.ts row (case 8) | red | passes |
| 9 | self.test.ts row (case 9); config-key.test.ts row (case 9) | self.test row passed (audit); config-key row red (first-g8) | passes |
| 10 | self.test.ts row (case 10), a build of the portfolio watcher through `watchedOnce` (tests/data/hubs/hubs-fixture.ts) after the save | red | passes |
| 11 | config-key.test.ts row (case 11); user-key.test.ts row (case 11) | red, red | passes |
| 12 | config-key.test.ts 4 rows (case 12); user-key.test.ts row (case 12) | red, red | passes |
| 13 | config-key.test.ts row (case 13); user-key.test.ts row (case 13) | red, red | passes |
| 14 | the existing row 'refuses the file name local.yml without reading or writing any file' of tests/server/edit/config-key.test.ts (a write of `port`) | not part of the first run (skipped by the describe filter); a preserved behaviour | passes (vitest list below) |
| 15 | config-key.test.ts row (case 15) | passed (the 1 passed of first-g8): audit, the base refuses every `local.yml` write | passes |
| 16 | config-key.test.ts row (case 16) | red | passes |
| 17 | routes/edit/config-key.test.ts 3 rows (case 17) | red | passes |
| 18 | user-key.test.ts row (case 18) | red | passes |
| 19 | theme-groups.test.ts row (case 19); look at landing | red | passes |
| 20 | theme-groups.test.ts rows (case 20) and the 5 G119 rows over the primary's people | red; the 5 G119 rows of a preserved behaviour are red on the base because `shipped['local.yml'].self` does not exist there ("Cannot read properties of undefined (reading 'options')"), so they cannot run on the unchanged tree | passes |
| 21 | look at landing; reading below | n/a | n/a |
| 22 | look at landing; reading below | n/a | n/a |
| 23 | references.test.ts 'scans ... (case 23)'; rename.test.ts row (case 23); hub-keys.test.ts rename row (case 23) | red | passes |
| 24 | rename.test.ts rows (case 24) | the 'edits self ... when lab alone holds amir' row red; the 'leaves the primary's local.yml as it is when the primary holds amir too' row passed (audit) | passes |
| 25 | hub-keys.test.ts definition row (case 25) | red | passes |
| 26 | board-rules.test.ts rows (case 26) | 'offers none for lab' red; 'offers it ... lead kim' passed (audit) | passes |
| 27 | self.test.ts row (case 27, `selfName`); board-rules.test.ts row (case 27, Mine only) | self.test row red; board-rules row passed (audit: Mine only reads the mark, which the base sets by hand in the row) | passes |
| 28 | edits.test.ts rows (case 28); routes/replace/lsp-edit.test.ts describe "an lsp-edit of a hub's own .oculus folder (case 28)" | edits.test 'posts the files ...' red, 'refuses ... a root that is no hub' passed (audit); lsp-edit route 2 rows red; the edits.test row 'tells the server's refusal of a local.yml ...' was written after the source changed and was not run on the unchanged tree (by reading: the base's `refusedWrite` in edits.ts has no `local` branch and answers `lsp_edit_failed`) | passes |
| 29 | reading below | n/a | n/a |
| 30 | self.test.ts row (case 30); user-key.test.ts row (case 30) | red, red | passes |
| 31 | self.test.ts rows (case 31) | red | passes |
| 32 | self.test.ts 2 rows (case 32) | red | passes |
| 33 | reading below | n/a | n/a |
| 34 | config-key.test.ts row (case 34) | red | passes |

No case of the brief was found wrong by its rules, so the builder did not stop.

The readings:

- Case 21: `src/lib/state/boards/person.ts:121-133` `selfStanding` answers `{kind: 'mark'}` for a person whose key resolves to them from the primary (`resolveKey(holdersOf(...), primary, keyOf(person.id))`); `Person.svelte` draws the button for a person of any hub, enabled for `mark`, and the press calls `setSelf`, which sends `writeConfigKey('local.yml', 'self', key)` (`src/lib/state/workbench/ui.svelte.ts:462-465`). After the rebuild the person carries `self: true` (case 2 row).
- Case 22: the same function answers `{kind: 'named', ...}` with the other person and their hub when the key resolves to another person, and the button is drawn `disabled` with the tip `person.self_named_tip` ("self: {0} in the primary hub's .oculus/local.yml names {1} of the hub {2} first, so it cannot name this person").
- Case 29: `setSelf` (`ui.svelte.ts:462-465`) calls `deps.writes.writeConfigKey(LOCAL, 'self', key)` directly and not `writeOption`, so no Save Workspace As... offer is made and the write is sent in an unsaved workspace; the server places it in the primary's `.oculus/local.yml` (`config-place.ts`, the `local` layer).
- Case 33: `src/lib/data/sources/config/catalog/schemas/engine.ts:262-265` builds the `local.yml` schema with `localLists`, whose `items` answers null for `people`, so `choiceSchema` gives `self` no `enum` and the YAML server reads it as text; a key of another hub gives no diagnostic.

## DONE / NOT DONE

| Item | State | Command and its output |
|---|---|---|
| 1. The key moves | DONE | `npx vitest run tests/checks/config/templates.test.ts --testTimeout 20000`: `Tests  5 passed (5)`; config-folder test in the vitest list |
| 2. The mark over all hubs | DONE | self.test.ts, vitest list below |
| 3. One finding | DONE | self.test.ts cases 4, 5 |
| 4. The write | DONE | config-key.test.ts, routes/edit/config-key.test.ts, user-key.test.ts |
| 5. The Settings row | DONE | theme-groups.test.ts, machine-section.test.ts; look at landing |
| 6. The Person button | DONE | reading of cases 21 and 22; look at landing |
| 7. New project | DONE | board-rules.test.ts case 26 |
| 8. The rename and the apply | DONE | references, rename, hub-keys, edits, lsp-edit route tests |
| 9. Words, comments, docs | DONE | the self-sentence grep below; Doc text section |
| 10. Tests | DONE | the new tests section |
| Verify 1 | DONE | `npm run diagrams && npm run test:quick -- --base 65f5c83c2`, exit 0, its summary lines below |
| Verify 2 | DONE | the vitest list, below |
| Verify 3 | DONE | `wc -l`, the files section |
| Verify 4 | DONE | the first run above and the runs after |
| Verify 5 | DONE, one new unused export required by the brief | the diff below |
| Verify 6 | DONE | prints nothing, exit 1 |
| Verify 7 | DONE | the quick tier's `ok      ASCII gate`; the perl form over the 110 changed files printed nothing (`xargs -0 perl ...`, exit 0); `LC_ALL=C grep -n '[^ -~]'` over this report prints nothing |
| Verify 8 | DONE | the grep and each remaining hit below |
| Verify 9 | DONE | the sentences read, below |

Verify 1, the last run, after the last change (`quick4.txt` in the scratch folder), as printed:

```
test:quick: 110 changed file(s), from git since 65f5c83c2
test:quick: 314 test file(s)
ok      ASCII gate (0.7 s)
ok      prettier (1.8 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.4 s)
ok      eslint (11.3 s)
ok      svelte-check (37.9 s): 1793052024368 COMPLETED 546 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (141.5 s): Duration  129.03s (transform 68.26s, setup 0ms, import 250.55s, tests 228.23s, environment 3ms)
ok      vitest (184.3 s): Duration  173.76s (transform 185.99s, setup 0ms, import 302.73s, tests 309.65s, environment 39.93s)
ok      vitest slow (249.3 s): Duration  239.02s (transform 14.80s, setup 0ms, import 151.04s, tests 793.07s, environment 19ms)
test:quick: 251.9 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
```

The run above is the one after the last change. Earlier runs of the tier, under a machine load average near 20 (`uptime`), timed out in files this step does not change; each was rerun alone by name and passed: `tests/routes/hubs/make.test.ts` (`Tests  35 passed (35)`), `tests/ui/html.dom.test.ts` (`Tests  8 passed (8)`), `tests/data/hubs/hub-portfolio.test.ts` (`Tests  16 passed (16)`), `tests/server/core/changes.test.ts` and `tests/server/machine/apps/host-manager.test.ts` (with machine-section and html.dom, `Tests  66 passed (66)`), `tests/routes/apps/app-open.test.ts` (`Tests  44 passed (44)`), `tests/server/machine/lsp/svelte-trust.test.ts` (`Tests  2 passed (2)`). The case 32 row of `self.test.ts` timed out at 20 s once under that load; alone it takes 2851 ms (`--reporter verbose`), the other rows 651 to 1615 ms.

Verify 2, after the last change:

```
$ npx vitest run tests/data/snapshot/ tests/data/hubs/ tests/server/edit/config-key.test.ts tests/routes/edit/undo/ tests/state/system/settings/ tests/state/boards/board/ tests/server/machine/lsp/adapters/hub-keys.test.ts tests/checks/config/config-folder.test.ts --testTimeout 20000
 Test Files  30 passed (30)
      Tests  547 passed | 2 skipped (549)
$ npx vitest run tests/routes/edit/config-key.test.ts tests/state/system/lsp/edits.test.ts tests/routes/replace/lsp-edit.test.ts --testTimeout 20000
 Test Files  3 passed (3)
      Tests  40 passed (40)
```

Verify 5, `diff .agents/worktrees/O84-base/unused-exports.txt <the run of sh utils/unused-exports.sh>`:

```
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
```

`writeSelf` is the one exported function item 4 asks for ("The edit is one exported function that takes the primary's folder and the new key and returns the outcome ... so the landing can run it once from a node run"); production reaches it inside `config-key.ts` and `config-reset.ts` reaches the reset through `resetSelf`, so knip lists the export. `readLocalText` leaves the list, now imported by `config-checks.ts`.

Verify 6: `grep -rn 'Z10[0-9][0-9]\|ruling 4[0-9][0-9]\|\bO8[0-9]\b' src config docs tests --exclude=local.yml` printed nothing, exit 1.

Verify 8, the grep after the change, each hit and why it stays:

```
src/lib/server/machine/runs/seeds/task-start.ts:44: * one the id names; an id that names no hub of the workspace names no task.
src/lib/state/sources/repositories/repositories.ts:497: * repository only a session's workspace names: the server marks the roots of the workspace
src/lib/state/sources/repositories/repositories.ts:800: * workspace names no folder for git to be asked about, which is a sixth thing to say.
src/lib/data/snapshot/schema/set.ts:9:// them, so a rule that reaches `schemaFor` names roots by their workspace names. A file no rule
config/options/catalogs/icons.yml:4: (the catalog laid over oculus's: "a glyph name the workspace names replaces oculus's icon")
docs/HELP.md:288: (the Focus paragraph; its self sentences are in Doc text)
docs/HELP.md:532: (the workspace file's settings: "a name the workspace names replaces oculus's entry")
docs/data-map.md:150: (a catalog laid over oculus's: "an entry the workspace names")
docs/data-map.md:214:- `people`: the workspace setting `self` names the key of one entry, the user's own; a key no entry carries is a finding.
config/options/catalogs/file-nesting.yml:4, glyphs.yml:4, latex.yml:4, agents.yml:4: (the same catalog sentence as icons.yml)
tests/server/root/process/config-cache.test.ts:176:    it('reads the settings file of the primary hub the open workspace names now', async () => {
tests/data/sources/config/layers/agents.test.ts:2:// config/catalogs/agents.yml: an agent the workspace names replaces oculus's entry, and every
```

Every hit but two uses "workspace names" for a folder, a root or a catalog entry the workspace names, not for `self`, and stays. `docs/HELP.md:288` and `docs/data-map.md:214` are kept out of this step's paths by item 9; their replacements are in Doc text.

## The new tests

| File | Title | Entry | Proof or audit |
|---|---|---|---|
| tests/data/hubs/self.test.ts (new) | describe 'the user the key self names', every row: cases 1, 2, 27, 3, 4, 5, 6 (2 rows), 7, 8, 9, 10, 30, 31 (2 rows), 32 (2 rows) | G133 | proof, but case 6 (2 rows) and case 9: audits |
| tests/server/edit/config-key.test.ts | describe "the user's key in the primary hub's local.yml": cases 11, 12 (4 rows), 13, 9, 15, 16, 34 | G8 | proof, but case 15: audit |
| tests/routes/edit/config-key.test.ts | describe "the user's key written through the route": 'refuses $row by the value check, and writes nothing (case 17)' (2 rows), 'writes lee, a key one hub other than the primary holds, and logs the key and its two values (case 17)' | G8 | proof |
| tests/routes/edit/undo/user-key.test.ts (new) | describe "taking back a write of the user's key": cases 11, 12, 13, 18, 30 | G8 (the write's undo; G9's change log is the record it reads) | proof |
| tests/data/snapshot/references.test.ts | 'scans $name (case 23)' over the primary's `local.yml` | G66 | proof |
| tests/data/snapshot/rename.test.ts | 'edits $name' row "the person self of the primary hub's local.yml names, and no other byte of that file or the workspace file (case 23)"; "edits self in the primary's local.yml, and no other byte, when lab alone holds amir (case 24)"; "leaves the primary's local.yml as it is when the primary holds amir too (case 24)" | G67 | proof; the last row: audit |
| tests/server/machine/lsp/adapters/hub-keys.test.ts | describe "the answer to a request on self of the primary hub's local.yml": case 25, case 23 | G66 (definition), G67 (rename) | proof |
| tests/state/system/settings/theme-groups.test.ts | the case 19 row and the case 20 rows | G119 | proof |
| tests/state/boards/board/board-rules.test.ts | 'case 26: with self naming the primary kim, $name' (2 rows); "case 27: Mine only keeps a project naming the user who is another hub's person" | G124 | case 26 first row proof, second row audit; case 27 audit |
| tests/state/system/lsp/edits.test.ts | "posts the files of a hub's own .oculus folder, its local.yml among them, and refuses a nested dot folder and node_modules there (case 28)"; "tells the server's refusal of a local.yml the edit would leave with a key the machine does not read, with the reader's sentence (case 28)"; "refuses a file of the .oculus folder of a root that is no hub (case 28)" | `grep -n 'edits.test' .scratch/migration/agents/guarded.md` prints nothing, so no entry names this file; the outside refusals belong with G2, the posting with G8 | first: proof; second: proof by reading (not run on the unchanged tree); third: audit |
| tests/routes/replace/lsp-edit.test.ts | describe "an lsp-edit of a hub's own .oculus folder (case 28)": "writes the people file and local.yml of the hub's .oculus folder, local.yml checked as a save of it is"; "refuses an edit whose local.yml would not read, with the reason, and writes neither file" | G8 (`lsp-edit.ts` is in its Code list) | proof |

Changed rows of existing tests are in the assertion table below.

## The terms

The tree has no glossary: `ls docs` lists `apps.md data-map.md diagrams HELP.md palette.md templates.md`.

## The files with line counts

`wc -l` of every changed file; each source file is at or under 880 lines and each component at or under 520 (`Collection.svelte` 520 is its base count, comment only).

| File | Lines |
|---|---|
| config/catalogs/vocab.yml | 290 |
| config/defaults/layout.yml | 347 |
| config/defaults/sources.yml | 115 |
| config/options/layout.yml | 293 |
| config/options/local.yml | 120 |
| config/options/sources.yml | 189 |
| config/text/findings.yml | 472 |
| config/text/server.yml | 543 |
| config/text/views/boards/person.yml | 36 |
| config/text/views/sources/files.yml | 340 |
| config/text/views/sources/source.yml | 232 |
| docs/diagrams/layer-data.dot | 97 |
| docs/diagrams/layer-data.svg | 482 |
| docs/diagrams/layer-server.dot | 159 |
| docs/diagrams/layer-server.svg | 781 |
| docs/diagrams/layers.dot | 101 |
| docs/diagrams/layers.svg | 556 |
| docs/diagrams/writes.dot | 1405 |
| docs/diagrams/writes.svg | 4741 |
| docs/templates.md | 1523 |
| src/lib/data/file-ops.ts | 398 |
| src/lib/data/index.ts | 798 |
| src/lib/data/model/index.ts | 836 |
| src/lib/data/model/model-collections.ts | 496 |
| src/lib/data/model/model-entities.ts | 741 |
| src/lib/data/prose/markdown/note-names.ts | 178 |
| src/lib/data/prose/text-edits.ts | 345 |
| src/lib/data/shapes/boards/roles.ts | 220 |
| src/lib/data/shapes/boards/takes.ts | 182 |
| src/lib/data/snapshot/hubs/self.ts (new) | 63 |
| src/lib/data/snapshot/normalise.ts | 664 |
| src/lib/data/snapshot/references/build.ts | 308 |
| src/lib/data/snapshot/validate.ts | 534 |
| src/lib/data/sources/config/catalog/options.ts | 735 |
| src/lib/data/sources/config/catalog/schemas/engine.ts | 318 |
| src/lib/data/sources/config/catalog/schemas/references.ts | 156 |
| src/lib/data/sources/config/local.ts | 680 |
| src/lib/server/content/audit/rules.ts | 349 |
| src/lib/server/content/audit/scan.ts | 83 |
| src/lib/server/edit/writes/config/config-checks.ts | 550 |
| src/lib/server/edit/writes/config/config-key.ts | 406 |
| src/lib/server/edit/writes/config/config-place.ts | 321 |
| src/lib/server/edit/writes/config/config-reset.ts | 233 |
| src/lib/server/edit/writes/config/config-sources.ts | 91 |
| src/lib/server/edit/writes/manifest.ts | 743 |
| src/lib/server/files/fs/lsp-edit.ts | 174 |
| src/lib/server/machine/apps/tools/workspace/writes.ts | 219 |
| src/lib/server/machine/pty/start/chat.ts | 141 |
| src/lib/server/root/context.ts | 842 |
| src/lib/server/root/process/context/machine-defaults.ts | 65 |
| src/lib/server/root/process/context/machine-values.ts | 113 |
| src/lib/server/root/watch/build.ts | 232 |
| src/lib/server/root/watch/local.ts | 195 |
| src/lib/server/root/watch/portfolio/portfolio.ts | 798 |
| src/lib/server/sessions/stores/hooks.ts | 231 |
| src/lib/state/boards/board/facets.ts | 330 |
| src/lib/state/boards/board/filter-menu.ts | 319 |
| src/lib/state/boards/board/items.ts | 242 |
| src/lib/state/boards/board/new-project.ts | 154 |
| src/lib/state/boards/board/presets.ts | 608 |
| src/lib/state/boards/board/state.ts | 201 |
| src/lib/state/boards/board/team.ts | 34 |
| src/lib/state/boards/career.ts | 109 |
| src/lib/state/boards/focus.ts | 710 |
| src/lib/state/boards/focus/filter.ts | 511 |
| src/lib/state/boards/person.ts | 138 |
| src/lib/state/boards/structure/graph.ts | 506 |
| src/lib/state/client/selectors.svelte.ts | 871 |
| src/lib/state/shared/answers/answers.ts | 177 |
| src/lib/state/sources/explorer/ops.svelte.ts | 795 |
| src/lib/state/system/config/editors/sources.ts | 221 |
| src/lib/state/system/config/groups.ts | 486 |
| src/lib/state/system/config/rows.ts | 574 |
| src/lib/state/system/machine/lsp/edits.ts | 509 |
| src/lib/state/workbench/ui.svelte.ts | 549 |
| src/lib/views/boards/collection/Collection.svelte | 520 |
| src/lib/views/boards/focus/FocusFilter.svelte | 283 |
| src/lib/views/boards/person/Person.svelte | 450 |
| src/lib/views/boards/projects/FilterBar.svelte | 200 |
| src/lib/views/boards/projects/Projects.svelte | 480 |
| src/lib/views/shared/card/project/CardFacts.svelte | 138 |
| src/lib/views/shared/card/project/CardLinks.svelte | 264 |
| src/lib/views/shared/card/project/ProjectCard.svelte | 505 |
| src/lib/views/shared/forms/NewIdeaForm.svelte | 215 |
| src/lib/views/system/workbench/editors/FieldControl.svelte | 510 |
| tests/checks/config/config-folder.test.ts | 832 |
| tests/data/hubs/hubs-fixture.ts | 130 |
| tests/data/hubs/self.test.ts (new) | 235 |
| tests/data/hubs/workspace-projects.test.ts | 162 |
| tests/data/snapshot/normalise.test.ts | 344 |
| tests/data/snapshot/reference-hub.ts | 378 |
| tests/data/snapshot/references.test.ts | 657 |
| tests/data/snapshot/rename.test.ts | 563 |
| tests/data/sources/manifests/manifests.test.ts | 778 |
| tests/fixtures/hubs/demo/.oculus/data/people/people.yml | 40 |
| tests/routes/apps/app-private.test.ts | 256 |
| tests/routes/edit/config-key.test.ts | 263 |
| tests/routes/edit/undo/user-key.test.ts (new) | 101 |
| tests/routes/replace/lsp-edit.test.ts | 300 |
| tests/server/edit/config-key.test.ts | 684 |
| tests/server/machine/lsp/adapters/hub-keys.test.ts | 273 |
| tests/server/root/context-fixture.ts | 234 |
| tests/server/root/process/config-cache.test.ts | 325 |
| tests/state/boards/board/board-fixture.ts | 75 |
| tests/state/boards/board/board-rules.test.ts | 863 |
| tests/state/forms/choices.test.ts | 211 |
| tests/state/system/lsp/edits.test.ts | 377 |
| tests/state/system/settings/machine-section.test.ts | 93 |
| tests/state/system/settings/port-row.test.ts | 88 |
| tests/state/system/settings/theme-groups.test.ts | 466 |

The folders that gained an item: `src/lib/data/snapshot/hubs` (3 tracked, 4 with `self.ts`), `tests/data/hubs` (5, 6 with `self.test.ts`), `tests/routes/edit/undo` (2, 3 with `user-key.test.ts`); `src/lib/server/edit/writes/config` stays at 10.

Files outside the brief's path list, each needed by an item of the brief:

- the apply of item 8: `src/lib/data/file-ops.ts` (the `local` refusal and its `reason`), `src/lib/data/prose/text-edits.ts` (the notice `lsp_edit_local`), `config/text/views/sources/source.yml`, `config/text/views/sources/files.yml` (`refused_local`), `src/lib/state/sources/explorer/ops.svelte.ts` (reads `reason`), `src/lib/state/shared/answers/answers.ts`, `src/lib/server/machine/apps/tools/workspace/writes.ts` (its record over every refusal), `tests/routes/replace/lsp-edit.test.ts`;
- the required `self` of `WorkspaceRead` and `LocalConfig`: `tests/data/hubs/workspace-projects.test.ts`, `tests/data/sources/manifests/manifests.test.ts`, `tests/state/forms/choices.test.ts`, `tests/routes/apps/app-private.test.ts`, `tests/server/root/context-fixture.ts`, `tests/server/root/process/config-cache.test.ts`, `tests/data/hubs/hubs-fixture.ts` (`watchedOnce` gains `self`);
- the This machine rows of item 5: `tests/state/system/settings/machine-section.test.ts` and `tests/state/system/settings/port-row.test.ts` (rows read through `machineRows`, so `localRows` is no export);
- the comments of item 9 the grep lists: `src/lib/server/content/audit/rules.ts`, `scan.ts`, `src/lib/state/boards/board/facets.ts`, `filter-menu.ts`, `state.ts`, `src/lib/state/boards/focus.ts`, `src/lib/data/model/model-entities.ts`, the five components under `src/lib/views/boards/` and `src/lib/views/shared/card/project/`, `config/defaults/layout.yml`, `config/catalogs/vocab.yml`;
- `src/lib/state/boards/person.ts` (`selfStanding`, item 6).

## Judgment calls

1. The finding is given only when the people file of every hub read; one that did not read has its own finding (`self.ts` header, `build.ts`).
2. `reloadLocal` (`context.ts`) publishes the files workspaces when `self` changes, so the Settings row shows the new value at once, as it does when the set of keys changes.
3. An undo that takes out a `local.yml` the write made removes that file and leaves the `.oculus/.gitignore` line, which names a file that may come back and is harmless.
4. `writeSelf` refuses `not_in_file` for a `self:` the file holds in a shape it cannot write over (null, a list, an anchor), as the other settings do.
5. `writeSelf` honours `copy` like the other config writes.
6. A comment-only edit of `local.yml` does not rebuild the reference index; a stale offset is caught by `planRename`'s read-back refusal.
7. The finding names the hubs in the workspace's order (`inOrder` in `self.ts`); the Person page's ambiguous tip names them in the order of the snapshot's people, which `selfStanding` reads.
8. `WorkspaceRead.self`, `WatchPaths.self` and `LocalConfig.self` are required, so no caller can leave the key out silently; six test fixtures gained `self: ''` and `watchedOnce` of `tests/data/hubs/hubs-fixture.ts` gained `self`.
9. The Person button has a fourth state beyond item 6: a key two other hubs hold and the primary does not draws the button disabled with `person.self_ambiguous_tip`, since no write could make that person the user.
10. `person.of_hub` holds `'{0} ({1})'`, the same value as `person.named_key` and `person.organisation_line`; the keys stay apart because each names a different thing and may be worded apart.
11. `HUB_OWN_FOLDER = '.oculus'` is a constant of `note-names.ts` beside `NOTES_FOLDER = '.oculus/notes'`, since `data/prose` may not import `data/helpers` (`tests/checks/imports/order.test.ts`).
12. The workspace-file rows of G66 and G67 (`references.test.ts`, `rename.test.ts`, `hub-keys.test.ts`) keep their behaviour over the setting `slurm.resource`, the one other workspace setting that names a hub key, instead of `self`.

## Before and after

| What | Before | After |
|---|---|---|
| Where `self` is kept | the open workspace file's `settings:`, an option of `config/defaults/sources.yml` | the primary hub's `.oculus/local.yml`, an option of `config/options/local.yml` (section You); a workspace file setting it gives the finding of a key that is no option |
| Who is marked | the person of each hub whose own people hold the key | one person over all hubs: the primary's person of the key, else the one other hub's |
| Findings | `self_unknown` per hub lacking the key: 'the workspace setting self names {0}, a key no entry of the people file carries, so nobody is marked as you' | one finding on the primary's `local.yml` at `self`: 'self of the primary hub''s local.yml names {0}, a key no person of any hub carries, so nobody is marked as you', or 'self of the primary hub''s local.yml names {0}, a key the primary does not hold and the hubs {1} each hold, so nobody is marked as you' |
| Settings row | Sources, People, a choice of the primary's people, written to the workspace file | This machine, You, a choice of every hub's person whose key resolves to them, another hub's drawn "<words> (<hub>)", written to the primary's `local.yml`, Reset takes the key out; with no primary it writes nothing and says why |
| Person button | on the primary's people only, writing the workspace file; another hub's person had a hub chip and no button | on every person; enabled where the key resolves to them, disabled with a tip where it resolves to another person, where two other hubs hold it, or with no primary; another hub's person also draws its hub chip |
| Rename of the user's person | edited the workspace file's `self` | edits `self:` in the primary's `local.yml` and no other byte; Apply writes files of a hub's `.oculus/` folder, checking `local.yml` with the machine's reader |
| New project | named the user by key in any hub | names the user only where the key resolves to the user in the hub written to |
| Change log record | the record of a config key write of the workspace file's `settings:` | `{file: <primary>/.oculus/local.yml, key: 'local.yml', field: 'self', before, after}` (`selfOutcome` in `config-key.ts`), a reset's record holding the removed line alone |
| An lsp-edit of `.oculus/` | refused `lsp_edit_outside` unless under `.oculus/notes/` | accepted in a hub's `.oculus/` but nested dot folders and `node_modules`; a `local.yml` that would not read is refused with the notice `lsp_edit_local` and the reader's sentence |

## Changed lines of existing assertions, allow lists and predicates

| File:line (after) | Before | After |
|---|---|---|
| tests/checks/config/config-folder.test.ts:219 (before) | `'self',` in the keys of `defaults/sources.yml` | removed |
| tests/data/snapshot/normalise.test.ts:345-370 (before) | describe 'normalise, the person the setting `self` names' (2 rows) | removed: normalise marks nobody; G133's `self.test.ts` holds the mark |
| tests/data/snapshot/references.test.ts:574 | `'settings:', '  self: dana-example'` | `'settings:', '  slurm: { resource: hpc }'` |
| tests/data/snapshot/references.test.ts:606 | `named: ['dana-example']` | `named: ['hpc']` |
| tests/data/snapshot/references.test.ts:611 | `named: ['dana-example']` | `named: ['hpc']` |
| tests/data/snapshot/rename.test.ts:259-268 | 'the person the setting self of the open workspace file names, and no other byte of that file', at the people file, `WORKSPACE_TEXT.replace('self: amir', 'self: amir-2')` | 'the cluster the setting slurm.resource of the open workspace file names, and no other byte of that file', at the resources file, `WORKSPACE_TEXT.replace('resource: hpc', 'resource: hpc-2')` |
| tests/data/snapshot/rename.test.ts:269-277 | 'the person the setting self names, in an open workspace file of another workspace folder' | 'the cluster the setting slurm.resource names, in an open workspace file of another workspace folder', `resource: hpc-2` |
| tests/server/machine/lsp/adapters/hub-keys.test.ts:209-219 | "goes from the setting self of the open workspace file in %s to the primary hub's person", `SELF_AT`, `targetUri: pageUri('hub', PEOPLE), targetRange: AMIR_DEFINED` | "goes from the setting slurm.resource ... to the primary hub's cluster", `SETTING_AT`, `pageUri('hub', RESOURCES), targetRange: HPC_DEFINED` |
| tests/server/machine/lsp/adapters/hub-keys.test.ts:222-238 | "renames ... the primary hub's person", `'amir-2'`, expected `[people, joint-work, alpha project.yml, lab workspace file]` | "renames ... the primary hub's cluster", `'hpc-2'`, expected `[resources, engine defaults/behavior.yml, lab workspace file]` |
| tests/routes/replace/lsp-edit.test.ts:52-54 | "refuses a file of another .oculus folder as outside", `'.oculus/workspaces/x.md'` | "refuses a file of a dot folder inside .oculus as outside", `'.oculus/.cache/x.md'` |
| tests/state/system/settings/theme-groups.test.ts:427 | `poolOf(shipped['sources.yml'].self, {}, lists)` | `poolOf(shipped['local.yml'].self, {}, lists)` |
| tests/state/system/settings/theme-groups.test.ts:447-450 | 'offers the people of the primary hub by key, and no person of another hub', `toEqual(['Ada'])` | the case 19 row, `toEqual(['Ada', 'Bob (other)'])` |
| tests/state/system/settings/machine-section.test.ts:64-70 | `expect(rows.every((row) => row.setIn === null)).toBe(true);` over every row | over the read-only rows (`row.kind === 'local'`), plus `expect(byKey('self')).toMatchObject({ own: false, blocked: { key: 'workbench.settings_no_primary' } })` |
| tests/state/system/settings/port-row.test.ts:55, 63, 78, 86 | `localRows(shipped['local.yml'], ...)`, `rows.find((row) => row.key === 'port')` | `machineRows(shipped['local.yml'], ...)`, `rows.find(isPort)`, the Port row of the read-only rows |
| tests/state/system/lsp/edits.test.ts:84 | the post always answers `{ ok: true, paths: [] }` | `options.answer ?? { ok: true, paths: [] }` |

## Doc and head-comment sentences

Rewritten: the head comments of `config/defaults/sources.yml` (line 5 and the people registry line 29), `config-place.ts`, `config-checks.ts`, `config-key.ts`, `config-reset.ts`, `config-sources.ts`, `references/build.ts`, `references.ts`, `rows.ts`, `editors/sources.ts`, `ui.svelte.ts`, `Person.svelte`, `new-project.ts`, `selectors.svelte.ts`, `NewIdeaForm.svelte`, `edits.ts`, `lsp-edit.ts`, `note-names.ts` (`inHiddenFolder` now says file events only), `roles.ts`, `team.ts`, `items.ts`, `takes.ts`, `career.ts`, `graph.ts`, `focus/filter.ts`, `presets.ts`, `state.ts`, `facets.ts`, `filter-menu.ts`, `focus.ts`, `audit/rules.ts`, `audit/scan.ts`, `manifest.ts`, `hooks.ts`, `chat.ts`, `model-entities.ts` (the `self` field), `FieldControl.svelte`, `Collection.svelte`, `FocusFilter.svelte`, `FilterBar.svelte`, `Projects.svelte`, `CardFacts.svelte`, `CardLinks.svelte`, `ProjectCard.svelte`, `config/options/layout.yml:145`, `config/defaults/layout.yml:226`, `config/catalogs/vocab.yml:242`, the demo `people.yml` line 1, `docs/templates.md` (the workspace template drops `self`, the `local.yml` template gains `# self: me` with its help, line 1061 names `local.yml`), and the test heads of `board-rules.test.ts`, `board-fixture.ts`, `edits.test.ts`, `machine-section.test.ts`, `theme-groups.test.ts`, `config-key.test.ts`, `reference-hub.ts`, `rename.test.ts`, `hub-keys.test.ts`.

Still true: `machine-file.ts` (the machine's own files, recognised by device and inode), `source.ts` `localRefusal`, `hub-names.ts` `resolveKey`, `merge.ts`.

Kept for landing (Doc text): `docs/HELP.md` 277, 288, 317, 327, 514, 538 and `docs/data-map.md:214`.

Verify 9, the sentences added, read against the prose standard: each list item of the new catalog words and comments is one sentence or one clause list. Three long sentences keep their form: the `self` help of `config/options/local.yml` (an option's help is one paragraph by the catalog's rule), the `lsp_edit_outside` notice (one notice names every reason a file is outside, as before), and the head comment of `self.ts` (the resolution rule is one sentence so its two branches read together).

## What in the brief was wrong

- The brief names `docs/data-map.md` line 216; `grep -n "self" docs/data-map.md` prints it at 214.
- The brief's path list leaves out files its items need (listed under the files section); each was widened, not booked.
- The G119 rows the brief keeps cannot run on the unchanged tree with the choice moved: `shipped['local.yml'].self` is undefined there, so the five preserved rows were red on the first run for that reason (first-g119.txt), and their preserved behaviour is shown by the after run only.

## Doc text

`docs/HELP.md`, as `grep -n` prints each line, then its replacement.

277 now:

```
277:- A field that picks people, a project's `lead:` and `collaborators:` and the Settings row `self`, offers Add person with the typed name when the name matches no person. A field picks people when the collection its `foreign_key:` names is the hub's `people` registry, whatever its key. It writes the person, with that name under the field the people schema ranks `display: 1` and a key made from it under its primary key, to the people file of the hub of the record being edited (the primary hub for `self`) and picks them. History undoes it as it undoes an Add.
```

277 replacement:

```
- A field that picks people, a project's `lead:` and `collaborators:` and the This machine row `self`, offers Add person with the typed name when the name matches no person. A field picks people when the collection its `foreign_key:` names is the hub's `people` registry, whatever its key. It writes the person, with that name under the field the people schema ranks `display: 1` and a key made from it under its primary key, to the people file of the hub of the record being edited (the primary hub for `self`) and picks them. History undoes it as it undoes an Add.
```

288, its sentences that name `self` (the rest of the line stays):

```
288: ... Mine only and Role are drawn only while a person has `self: true`. ... The tab offers no New project, has no count on the tab or the rail and is not in the view catalogue; with no `self` it draws no project. ... The track record counts the projects of every hub whose lead, supervisors or collaborators name you (the workspace setting `self`), in the record rows of `categories:` (in review, in flight, publications, other outputs), never summed. ... With no `self`, or with no project in a record row and no obtained funding, the track record is not drawn.
```

288 replacements, sentence by sentence (the sentences "Mine only and Role are drawn only while a person has `self: true`" and "then your role on the project, only while a person has `self: true`" stay):

```
The tab offers no New project, has no count on the tab or the rail and is not in the view catalogue; with no person marked as you it draws no project.
The track record counts the projects of every hub whose lead, supervisors or collaborators name you (the person `self` of the primary hub's `.oculus/local.yml` names), in the record rows of `categories:` (in review, in flight, publications, other outputs), never summed.
With no person marked as you, or with no project in a record row and no obtained funding, the track record is not drawn.
```

317 now:

```
317:- **Person.** The "this is me" button marks who you are. It is pressed on your own person, and pressing it on another person of the primary hub writes that person's key to `self` in the open workspace file's `settings:`, undoable in History. The Settings row `self` sets the same key from a list of the people, and clears it. A person of another hub has no button.
```

317 replacement:

```
- **Person.** The "this is me" button marks who you are. It is pressed on your own person, and pressing it on another person writes that person's key to `self` in the primary hub's `.oculus/local.yml`, undoable in History; the file is made, at mode 600 and named in `.oculus/.gitignore`, when it is not there. The key is read from the primary hub first, so a person of another hub is marked by it only when the primary holds no person of that key and no third hub holds it; on any other person of another hub the button is disabled and its tip says which person the key names. With no primary hub the button is disabled. The This machine row `self` in Settings sets the same key from a list of the people, and clears it.
```

327 now:

```
327:- **Settings.** Each control writes your value into the open workspace file's `settings:` as you set it, keeps the file's comments, and is undoable in History; with no workspace file open it offers Save Workspace As... and writes nothing. A key of the hub's list that each hub's own `.oculus/config.yml` is read for is written to the `.oculus/config.yml` of the hub its row names, and any other key of the hub's list to the primary hub's; oculus's own files are never written. A value differing from oculus's is marked Modified, and Reset takes your value out of its file. A list or map is written as you see it, and an entry of oculus's you remove or hide is written as `removed: true` (a list) or `null` (a map), so it stays out. Each heading has Open Settings File, which opens the workspace file, and Show Defaults, which opens oculus's defaults file to read only; Edit in a file opens the file at the key, adding the key with the value in force when the file lacks it. The `local.yml` keys are listed under This machine with their value in force. Search takes `@modified` and `@id:`.
```

327 replacement (only the last-but-one sentence changes):

```
- **Settings.** Each control writes your value into the open workspace file's `settings:` as you set it, keeps the file's comments, and is undoable in History; with no workspace file open it offers Save Workspace As... and writes nothing. A key of the hub's list that each hub's own `.oculus/config.yml` is read for is written to the `.oculus/config.yml` of the hub its row names, and any other key of the hub's list to the primary hub's; oculus's own files are never written. A value differing from oculus's is marked Modified, and Reset takes your value out of its file. A list or map is written as you see it, and an entry of oculus's you remove or hide is written as `removed: true` (a list) or `null` (a map), so it stays out. Each heading has Open Settings File, which opens the workspace file, and Show Defaults, which opens oculus's defaults file to read only; Edit in a file opens the file at the key, adding the key with the value in force when the file lacks it. The `local.yml` keys are listed under This machine with their value in force; of them only `self`, who you are, is set there, written to the primary hub's `.oculus/local.yml` with or without a workspace file open, and Reset takes it out. Search takes `@modified` and `@id:`.
```

514 now:

```
514:- Every setting is in one of four places: oculus's `config/defaults/` folder, which holds oculus's own values and is never written; the open workspace file's `settings:`, which holds your values and is where Settings and every control that sets an option write; a hub's `.oculus/config.yml`, for the keys of the hub; and a hub's `.oculus/local.yml`, for this machine's. A saved change applies at once, on every page.
```

514 replacement:

```
- Every setting is in one of four places: oculus's `config/defaults/` folder, which holds oculus's own values and is never written; the open workspace file's `settings:`, which holds your values and is where Settings and every control that sets an option write; a hub's `.oculus/config.yml`, for the keys of the hub; and a hub's `.oculus/local.yml`, for this machine's, of which Settings and the Person page write only `self`, in the primary hub's file. A saved change applies at once, on every page.
```

538 now:

```
538:- A hub's `.oculus/local.yml` is this machine's: the port, `hpc_host`, the programs, the agent accounts, the calendar and mail accounts, the Literature keys, the download accounts, and where oculus keeps this machine's files. Every key has a default. It stays out of git, and only the primary hub's file is read (the account rows are joined over every hub). The keys are in its template.
```

538 replacement:

```
- A hub's `.oculus/local.yml` is this machine's: the port, who you are (`self`), `hpc_host`, the programs, the agent accounts, the calendar and mail accounts, the Literature keys, the download accounts, and where oculus keeps this machine's files. Every key has a default. It stays out of git, and only the primary hub's file is read (the account rows are joined over every hub). `self` is the key of your own person in any hub, read from the primary hub first: the primary's person of that key, else the person of the one other hub that holds it; a key no hub holds, or one two other hubs hold, marks nobody and is a finding on the file. The keys are in its template.
```

`docs/data-map.md`:

```
214:- `people`: the workspace setting `self` names the key of one entry, the user's own; a key no entry carries is a finding.
```

214 replacement:

```
- `people`: the key `self` of the primary hub's `.oculus/local.yml` names the key of one entry of any hub, the user's own, read from the primary hub first; a key no hub's entry carries, or one two hubs other than the primary carry, is a finding on that file.
```

`agents/guarded.md`, the new rule sentences for the orchestrator to write at landing:

G8, the sentence "The Settings writers (`config-value`, `config-key`) never write a `local.yml`." becomes:

```
The Settings writers (`config-value`, `config-key`) never write a `local.yml` but the one key `self` of the primary hub's, which the config key write and the config reset change as that scalar alone, every other byte kept, the result read back by the machine's reader before it is written; a `local.yml` they make is mode 600 and named in `.oculus/.gitignore`, and an existing one keeps its mode.
```

G119, the sentence "The choice Self lists the people of the primary hub that have no `root`, each under the person's name, or the key for an empty name, and an item whose words would read like another item's is followed by its key until no two items read alike." becomes:

```
The choice Self lists the people whose key resolves to them from the primary hub: every person of the primary, and a person of another hub whose key the primary does not hold and no third hub holds; each is drawn under the person's name, or the key for an empty name, a person of another hub followed by that hub's name in parentheses, and an item whose words would read like another item's is followed by its key until no two items read alike.
```
