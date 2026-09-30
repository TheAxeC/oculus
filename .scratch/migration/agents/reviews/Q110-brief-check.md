# Brief check, Q110

Summary of what the builder would hit: case 2 is labelled an audit that passes on main, but it fails on main. Case 8 cannot meet its own "the file's text is what it was" even after the fix. The brief's "What it must do" promises byte-for-byte for every write and its undo, which the step does not deliver for an undo of any clear. DESIGN.md cites line numbers that the change will shift, and DESIGN.md is not in the paths.

## 1. Names

Commands: `git grep -n "writeManifest" | grep -v "^tools/oculus/.scratch/"`, `git grep -n "\bcoerce\b" -- tools/oculus ':!tools/oculus/.scratch'`, `git grep -n -o "writes/manifest\.ts:[0-9-]*\|writes/undo\.ts:[0-9-]*\|manifest\.ts:[0-9][0-9-]*\|undo\.ts:[0-9][0-9-]*" -- tools/oculus ':!tools/oculus/.scratch' ':!*.svg' ':!*.dot'`, and `grep -n -i "undo"` over DESIGN.md, HELP.md and README.md.

Hits outside the brief's paths:
- Callers of `writeManifest`: `src/lib/server/edit/writes.ts:274` (the route's form write) and `src/lib/server/git/deposit.ts:386` (the deposit's three `code_availability.*` fields). Neither becomes false if the form reading stays the default. A fourth parameter that is required, or a default flipped to exact, would silently change the deposit and the route. The brief should say that the form reading is the default.
- The re-export line `src/lib/server/edit/writes.ts:147` (`export { coerce, createIdea, fieldTypes, insideHub, writeManifest }`) and `writes.ts:20-23` ("What an importer of this module needs of them is re-exported here"). A second exported function would not be re-exported. That is not false, since only `undo.ts` imports it.
- The client-side `writeManifest` in `state/client/writes.svelte.ts:163`, `shapes.ts:129`, Editor, QuickAdd, Lanes, ProjectCard, `rows.ts` and the Map's `edge-write.ts:10`: this is another function with the same name, not affected.
- Tests: `tests/server/edit/writes.test.ts` has 13 calls of `writeManifest` and `coerce` at lines 162-185. They stay true if the form reading is unchanged.
- Diagrams: `docs/diagrams/writes.dot:70,101` and `writes.svg:184,397` (tooltips "createIdea, writeManifest" and "manifestValue, writeManifest"). They are covered by the brief's `docs/diagrams/` path.

Findings:
1. `DESIGN.md:313` cites `writes/undo.ts:181` and `writes/manifest.ts:314` by line. Any change above those lines makes both citations false: a new parameter in `writeManifest` (manifest.ts:141-146), a new function, or a change in `undoChange`/`apply`. Line 314 is `undo: 'none'` in `createIdea`, which sits below `writeManifest`, so it will shift. DESIGN.md is not in "Paths this step writes", and the brief says "The step writes these paths and nothing else", which contradicts spec.md:57. Add `DESIGN.md` to the paths, and name the two citations.
2. The sentence "the earlier value goes back through the writer the change came from" appears at `DESIGN.md:140`, at `DESIGN.md:376` ("an undo is an ordinary write"), at `HELP.md:254`, and in the head comment of `undo.ts` at lines 7-8 ("Every writer it reaches is the writer the change itself came from"). All four stay true only if the exact write is `writeManifest` with a mode (a parameter or an option object). The brief offers "a second exported function" as an equal choice. That shape makes these four sentences questionable, and HELP.md is not in the paths. Either rule out the second-function shape, or put DESIGN.md and HELP.md in the paths with the sentence to carry.
3. The head comment of `manifest.ts` at lines 8-9 ("server/edit/writes.ts is the route and re-exports everything here") is already false on main: `currentOf` and `manifestValue` are not in `writes.ts:147`. A second exported function adds another exception. This is low cost. The builder should be told to correct the sentence if it adds an export.
4. Test titles: `git grep -n "taking a change back\|writes a manifest field back"` finds only `undo.test.ts:31,40`. No collision.

## 2. The step line

The step line is at `plan.md:279`. Each part maps to the brief as follows:
- "an undo whose record holds `[]` as `before` writes `[]` back" maps to items 1 and 2, and case 1.
- "one whose `before` is nothing still removes the field" maps to items 1 and 2 (null goes to `setFields`), and case 2.
- "with a test that links, undoes and compares the file's text" maps to item 3 and case 1 ("as the Map's link sends it", byte for byte).
- "`src/lib/server/edit/writes/`" maps to items 1 and 2.
- "ruling Z102" is referenced in the premises.

No part is without an item.

Findings:
1. The step line's "still removes the field" is false on main for list fields, and the brief does not say so. My scratch route probe, run on main (`npx vitest run --root <scratch>/q110`, file `undo-probe.test.ts`), printed `{"label":"case2",...,"record":{"before":null,"after":["x"]},"undo":[400,{"error":"refused","refused":[{"field":"related","reason":"the value is not a list"}]}],...,"identical":false}`. The cause is `coerce` for `chips`/`tags`/`lines` with a raw value of `null`: `items === null` gives the reason 'the value is not a list' (`manifest.ts:82`). Undoing a Map link onto a project with no `related` is therefore refused today. The fix (null handed to `setFields`) does cover it, but the brief must state it as a behaviour the step changes, not one it keeps.
2. Decision 1 (`''` and `false`) stays inside the ruling. It is the same cause and the same code change (an exact write that bypasses `coerce`), and a fix limited to `[]` would take extra code. The ruling's reason ("Undo gives back the file as it was, and `git diff` stays empty") covers it.
3. Case 8 and Decision 2 change the scope. They turn an undo that is refused on main into one that writes, which needs the name check widened. The ruling does not name that behaviour. It is defensible as a fix of delivered work: History offers the control and the endpoint answers `refused`, and spec.md:81 says such a fix needs no yes. But as written, case 8 cannot pass (check 4, finding 2).

## 3. Premises

I read the tree on main at `f81a671e` (`git log --oneline -1` printed `f81a671e Launch Q108's builder`).

These hold:
- `plan.md:279` is the step line and `:580` is the ruling (grep).
- `undo.ts:180` is `undoChange` and `:197` is the `writeManifest` call (`cat -n`).
- In `manifest.ts`: `:141` is `writeManifest`, `:69` is `coerce`, `:184` is the call, `:90` is `strings.length === 0 ? null : strings`, `:97` is `if (text === '') return { value: null }`, and `:73` is the checkbox branch. The record is at `:207-214`, with `before` at `:211`.
- `setFields` is at `yaml-edit.ts:654`.
- `undo.test.ts` has 375 lines (`wc -l`) and 18 cases under "taking a change back" (grep of `it(` lines 40 to 369).
- In `write-fixture.ts`: `MANIFEST` is at `:27` and `target()` at `:55`, and the comment above `targetOver` is at `:96-98`.
- In `manifest-schema.yml`: `title` text at `:33`, `pin` checkbox at `:40`, `related` chips at `:53`, and `followup.do`/`followup.after` at `:56-57`.
- The `setFields` probe (`node probe.mjs`, which imports main's `yaml-edit.ts`): `related: []` to `[x]` and back, `title: ""` to `New` and back, and `pin: false` to `true` and back are all byte-identical.
- The route probe confirms that on main, cases 1, 3 and 4 remove the line. The records are `before: []`, `""` and `false`, and the undo records are `before: ["x"], after: null` and the like.

Findings:
1. The premises omit the null-`before` refusal for list fields described in check 2, finding 1. This is a wrong picture of the tree that decides case 2's class.
2. The brief says case 6's `coerce` tests are at `writes.test.ts` lines 159-181. The actual lines are 160 (`describe`) to 182: titles at 161, 168 and 178 (grep). The brief puts the group test at 95-114; the comment is at 95 and the test at 98-115. Both are off by one and harmless.

## 4. Cases and checks against the rules file

1. Case 2 is inconsistent with verify item 3 and spec.md:14. Verify item 3 lists case 2 among the audits that pass "on the unchanged tree", but it fails on main with 400 `refused` (probe above). The builder's first run will contradict the brief. Move case 2 to the changed behaviours: it fails on main, and its run is quoted as a failure.
2. Case 8 cannot pass as written, and spec.md:16 and :54 forbid the ways to make it pass (loosening the check, or asserting the output that has the defect). The `setFields` probe of the exact write:
   - `followup: "ask"` cleared and undone comes back as `followup: ask`: the quotes are lost, since `appendTop` uses `renderScalar` with no style.
   - `followup: { do: "ask", after: "2030-01-01" }` comes back as a block map, `followup:\n  do: ask\n  after: 2030-01-01`.
   - A value that was not the last key comes back at the end of the file (`followup "ask" mid`: `identical=false`).

   Only an unquoted block map in last position round-trips (`case8b followup block map plain: identical=true`). Meeting case 8 needs `yaml-edit.ts` (not in the paths), or a record that holds the removed text (a change to the change-log shape, a wire format of `~/.oculus/changes.jsonl`, which is Axel's to decide under spec.md:18). The brief must either restate case 8's expectation as parsed equality, with the byte-level miss booked, or take on that design.
3. Case 4 says only "`pin: false` is back". Unlike cases 1 and 3, it does not compare the whole text, so a test that uses `toContain('pin: false')` meets the letter of the case. State the whole-text comparison.
4. Case 7 needs the file to hold the record's `after` for `nosuch` (or `after: null` with `nosuch` absent). Otherwise `undoChange` answers `moved` (409) at `undo.ts:184` before the name check is reached. The case does not say this.
5. spec.md:57 conflicts with "The step writes these paths and nothing else" (check 1, finding 1).

## 5. The question (could it pass without the goal)

- Case 1: No, provided the text is compared byte for byte (as the case says) and the record's `after: []` is checked.
- Case 2: Yes, as classed. As an audit it would be expected to pass on main, but it does not. As a changed behaviour, No.
- Case 3: No, since the text is compared.
- Case 4: Yes. It checks only that `pin: false` is present (check 4, finding 3).
- Case 5: No for the text value. It says nothing about `[]`.
- Case 6: The `coerce` tests pass whatever the undo does, since they test `coerce` and not the write path. The new route case covers lists only. A form write of `''` for a text field through `writeManifest` or the route has no test, and there is none on main either. `writes.test.ts:204` covers the checkbox. If the exact mode leaked into the form path for text, nothing would fail. Add a form write of `title: ''` removing the line.
- Case 7: No for an unnamed field. Yes for the rest of what Decision 2 promises. The exact write skips `coerce`'s `readonly` and `keymap` refusals (`manifest.ts:70-71`), so a record naming `paths` or `subtasks` with a map `before` would be written, where a form write of those is refused (`writes.test.ts:139`). No case checks this.
- Case 8: Cannot pass as specified (check 4, finding 2).
- Step line check ("a test that links, undoes and compares the file's text"): No for `related: []`. It is silent on every undo of a clear.
- Item 1 ("the schema's field names still decide"): Yes. It can pass while the type refusals are dropped (see case 7).
- Item 2: No.
- Item 3: as its cases.
- "What it must do" ("`git diff` on a manifest after a write and its undo is empty"): the step cannot reach this for an undo of any clear. The route probe on main, where the exact write adds nothing for these values:
  - Title cleared, then undone: `title: A title` comes back at the file's end without quotes.
  - `status.line` cleared as the parent's only child, then undone: `status:\n  line: the line` comes back without quotes.
  - A block list cleared, then undone: it comes back as a flow list at the end (the `setFields` probe, "block list related emptied").

  The goal as given ("byte for byte as it was before the write it takes back") therefore holds after the step only for writes that replace a value in place. The brief must either narrow the claim to that, and book the undo-of-a-clear class as a separate item for Axel (restoring it needs the record to carry the removed lines, which is a change to the change-log format), or take that work on. As written, the brief claims more than it builds.

## 6. Implied inputs missing from the cases

1. A dotted field whose parent map would become empty (`status.line` as the only child, the fixture's own `MANIFEST`): form clear, then undo. Result now and after the step: `status:\n  line: the line`, not byte-identical (route probe). Expected per the goal: the original text. This is the same class as a mid-file clear (`title` cleared: it comes back at the end, unquoted). It is unaddressed by the brief (check 5).
2. An undo of an undo for case 1. Expected: `related: [x]` back byte for byte, with the record `before: [], after: ['x']`. It is worth a case because records now carry `after: []` where they carried `null`, and the `moved` check (`same`, `changes.ts:108`) then compares `[]` with `[]`.
3. A record whose `before` is a number (`year: 2024`, write `'2025'`, then undo): byte-identical on main (`{"label":"year number",...,"identical":true}`) and after the step, since `coerce` returns numbers unchanged (`manifest.ts:94`). This is low cost and optional as an audit.
4. A list the file held in block style:
   - Grown by a link and undone: the block style is kept (`setFields` probe "block list related grown: identical=true").
   - Cleared by a form and undone: it comes back as a flow list at the file's end, the same class as item 1.
   
   Expected per the goal: the original text.
5. A field whose value changed since. The existing `moved` case covers text only. The new pair is a record with `after: []` while the file now holds `related: [y]` or lacks `related`, and a record with `after: null` while the file now holds `related: []`. Expected: 409 `moved`, file unchanged.
6. A hand-made record naming a `keymap` field (`paths`, `subtasks`) or a `readonly` one. Expected: `refused`, as the form refuses it. Under the brief's shape it would be written (check 5, case 7).
7. Case 7's precondition (check 4, finding 4). Expected: `refused` only when the `moved` check passes.

## 7. ADRs

None:
- `ls -d tools/oculus/docs/adr docs/adr` printed "No such file or directory" for both.
- `git ls-files | grep -i -c "adr/"` printed `0`.
- The state file's configuration names `standards: [tools/oculus/.scratch/migration/agents/spec.md]` (line 16) and no ADR folder.

## Declined to judge

- Whether the undo-of-a-clear class (check 5, check 6 items 1 and 4) belongs in Q110 or in a new step. It needs either `yaml-edit.ts` or a change to the change-log record's shape, and the second is a wire format that is Axel's to decide. That is for the orchestrator to rule on or raise.
- A record whose `before` is `{}`: `setFields` reads it as a clear (`yaml-edit.ts`, the `isBlockMap ... length === 0 ? null` branch). No schema field on the tree plausibly holds `{}`, so I did not weigh it.
- The Map's own UI behaviour: not run, since the checks here are server-side.

## Usage

claude-opus-5-5 (served, read from the transcript after the launch), 31 tool uses, 166,632 tokens, 6.1 min (from the completion notice).

Scratch files are under `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/q110/` (`probe.mjs`, `undo-probe.test.ts`).

## Closed

Each finding is closed by a change to `agents/briefs/Q110.md` before the preparation commit, except the undo of a clear, which is raised:

- 1.1 (DESIGN.md:313 citations): `DESIGN.md` line 313 is in the paths as What to build 4, with verify item 3.
- 1.2 (the second-function shape): Decision 2 makes the record reading a mode of `writeManifest`; the four sentences stay true.
- 1.3 (the re-export sentence): What to build 1 makes the head comment's sentence true; a premise names it.
- 2.1 and 4.1 (case 2 fails on main): a premise names the null-list refusal; case 2 is a changed behaviour, failing on main; Decision 1 names it.
- 2.2: no change.
- 2.3 and 4.2 (case 8, group fields): case 8 and the old Decision 2 are removed; the group clear is part of Z105.
- 3.1: as 2.1. 3.2 (line numbers): case 6 cites lines 160-182; the group test is no longer cited.
- 4.3 (case 4): case 4 compares the whole text.
- 4.4 (case 7's precondition): case 7 states it.
- 4.5 (paths): as 1.1.
- 5 (case 6 text clear): case 6 adds the route's form write of `title: ''`.
- 5 (case 7, type refusals) and 6.6: What to build 1 keeps `readonly` and `keymap` refused under the record reading; case 8 is that audit.
- 5 ("What it must do" claims too much) and 6.1, 6.4: "What it must do" is narrowed to a write that replaced a value; the undo of a write that removed a field is raised as Z105 (the state file's open items), since restoring its text needs the record to carry the removed lines, a change to the change log's record shape; Decision 3 and a premise say so.
- 6.2 (undo of an undo): case 9. 6.3 (a number): case 11. 6.5 (`moved` for lists): case 10. 6.7: case 7.
- 7: no finding.
