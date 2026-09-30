# Q111 brief check

**Summary.** Five findings need the brief changed before dispatch:

- **Case 8's expected result is wrong in general.** It depends on how many characters the other write adds.
- **Case 9's example cannot give its stated result.** Today's value write refuses on a flow-map root.
- **Item 1 does not say where `removed` lives.** Putting it on `EditResult` as a required key breaks six files outside the brief's paths.
- **The undo's insertion path does not say that the schema checks still run first.** Without them, a record for `paths` or `tier` carrying `removed` would be written.
- **The six measured removals do not state the texts they were measured on.** On the fixture's `MANIFEST`, `status.line` gives `at` 44, not 27.

Several implied inputs need cases. There is also one design point for the orchestrator: whether `{ at, text }` can meet the goal when undos run out of order (check 5).

## 1. Names

Commands: `grep -rn "EditResult" src tests`, `grep -rn "setFields" src tests HELP.md DESIGN.md README.md`, `grep -rn "ChangeRecord" src tests HELP.md DESIGN.md README.md`, `grep -rn "writeManifest(" src tests`, and `grep -n "removed" DESIGN.md HELP.md README.md` plus the same over the server edit, core, history and state files.

**`EditResult`, finding.** It is answered by 12 functions in files outside the paths list:
- `entry-edit/host-status.ts:31`
- `entry-edit/entries.ts:44,109,155,237,285`
- `entry-edit/lines.ts:68`
- `entry-edit/subtasks.ts:151,201,233`
- `writes/entries.ts:50` (it reads the type)
- `writes/subtasks.ts:73` (it reads the type)

Item 1 says `setFields` "answers ... `removed`", and item 3 says the insertion "answers the same `EditResult` shape". If `removed` becomes a required key of `EditResult`, all of those files stop type-checking. The brief must name the shape: either `removed?` optional on `EditResult`, or a separate result type for `setFields` and the insertion (for example `EditResult & { removed: ... }`). `renameKey` (`yaml-edit.ts:617`) answers `EditResult` inside the paths.

**`ChangeRecord`.** Hits in `feeds.ts:27,367`, `writes.ts:72,137,243`, `writes/entries.ts:40,395,570`, `writes/subtasks.ts:29,76,84`, `writes/deck.ts:23,28`, `writes/rail.ts:25,32`, `sessions/overrides.ts:16,66,151`, `tests/server/core/changes.test.ts:24,547` and `undo.test.ts:13,407`. An optional key makes none of them false. `tests/server/core/changes.test.ts:381` asserts the key order of a line made by hand and is unaffected.

**`writeManifest` arguments.** Callers:
- `writes.ts:274` (form)
- `git/deposit.ts:386` (form; its `records` are never logged: deposit.ts:386-393 reads only `found` and `refused`)
- `undo.ts:199`
- `tests/server/edit/writes.test.ts:80,87,101,111,118,132,140,158,176,188,197,211`, positional with at most 5 arguments

An optional sixth argument keeps them all true. `writes.test.ts:118` ("refuses a value for a grouped field by its parent name") stays true only if a group value without `removed` is still refused. Item 3 says it is, but the file is not in the paths list.

**`removed`.** No existing hit in the server edit, core, history or state code. Unrelated hits exist in `PagesReset.svelte`, `lines.ts:333` (a comment) and `bodies.ts:84` (a comment).

**The name `at`, finding for the orchestrator.** `Change.at` is already the record's ISO time (`changes.ts:62-63`, "The moment the line was written"), and `undoes` names that `at`. `removed.at` would be a string index in the same record, so one name means two things in one JSON line. The plan line fixes `{ at, text }` (ruling Z105), so renaming it is Axel's call. At the least, the brief should have the doc comment and the report say that `removed.at` is an offset and not the record's time.

**The wire type and the History view.** `src/lib/state/sessions/changes.svelte.ts:19-31` does not declare `removed`, and `History.svelte:132-138` draws the undo control for any row whose `undo` is not `none`. Neither is made false.

**Docs.** `DESIGN.md:140`, `DESIGN.md:376` and `HELP.md:254` are covered by item 5. `DESIGN.md:313` cites `writes/undo.ts:181` and `writes/manifest.ts:350`. Both are correct now (read), and both move if lines are added above them. Verify item 4 covers this.

## 2. The step line

| Part of the plan's Q111 line | Item of "What to build" |
|---|---|
| a write that removes a field records the removed lines and where they stood | items 1 and 2 |
| optional `removed: { at, text }` on the record in `changes.jsonl` | item 2 |
| its undo puts those lines back | item 3 |
| a group clear included | item 3 (group sentence), case 4 |
| so the text is as it was | items 1 and 3, cases 1 to 6 |
| a record without the key undoes as today | item 3 fallback, cases 10 and 11 |
| `src/lib/server/edit/writes/` | paths list |
| after Q110 | plan.md:280 shows Q110 ticked |

Every part maps to an item. "So the text is as it was" is not met in case 7 (decision 4) or in case 8 for a large length change; see check 5.

## 3. Premises

**Line numbers.** Re-read with Read, `grep -n` and `sed`. All correct:
- `yaml-edit.ts`: 507-574, 517, 519, 532, 543, 545, 547, 577, 654, 684-692, 706-711; the file is 720 lines.
- `manifest.ts`: 205-218, 239, 243-250.
- `undo.ts`: 180-191, 196-200, 199.
- `changes.ts`: 42-58, 149-154, 161-169.
- `writes.ts:274` and `deposit.ts:386`.
- `undo.test.ts` is 603 lines with the describe at 378; `yaml-edit.test.ts` is 538 lines; `MANIFEST` is at `write-fixture.ts:27`.
- The schema names `title` (text, line 33), `related` (chips, line 53) and `followup.do` / `followup.after` (lines 56-57), from `grep -n` over `config/catalogs/manifest-schema.yml`.

One offset: the wire type starts at `changes.svelte.ts:19`, not 20.

**The six measured removals.** Rerun with `npx tsx scratchpad/q111-check/six.ts`, which runs `setFields` and takes the common prefix and suffix of the text before and after:

```
title {"at":10,"removed":"title: \"A title\"  # the name\n"}               (src 'id: alpha\ntitle: "A title"  # the name\nnext: go\n')
status.line (MANIFEST) {"at":44,"removed":"status:\n  line: \"the line\"\n"}
status.line (no title) {"at":27,"removed":"status:\n  line: \"the line\"\n"}
related {"at":10,"removed":"related:\n  - a\n  - b\n"}
followup {"at":10,"removed":"followup:\n  do: call\n  after: 2026-10-01\n"}
flow child {"at":20,"removed":"line: \"x\", "}                              (src 'id: alpha\nstatus: { line: "x", chips: [a] }\n')
two {"at":10,"removed":"title: T\nnext: go\nshort: s","inserted":"next: go"}
```

All six reproduce, but only on texts the brief does not give. `at` 27 for `status.line` holds only without the `title` line. On the fixture's `MANIFEST`, which case 2 uses, it is 44. **Finding:** the brief must quote the six source texts, since case 15 asserts the `at` values.

**Base behaviour of cases 1 to 5.** Run through the route under vitest (`npx vitest run --config scratchpad/q111-check/vitest.config.mts`, output in `out.txt`):
- case 1: undo 200, text `...status:\n  line: "the line"\ntitle: A title\n` (quotes and comment lost, moved to the end)
- case 2: undo 200, `line: the line` (quotes lost)
- case 3: undo 200, `related: [a, b]` appended at the end
- case 4: undo 400 `{"error":"refused","refused":[{"field":"followup","reason":"the field is a group; set its children, or clear it whole"}]}`
- case 5: undo 200, `status: { chips: [a], line: x }`

These match the brief's "what was seen".

## 4. Cases and checks

**Case 8, expected result wrong in general.** Simulated with item 3's rule in `sim.ts`, original `id: alpha\nshort: s\ntitle: "A title"  # the name\nnext: go\n`, `title` cleared, then `short` rewritten:
- `short: ss`: title comes back between `short` and `next`.
- `short: a longer value`: output `id: alpha\ntitle: "A title"  # the name\nshort: a longer value\nnext: go\n`. The title lands above `short`, because the line start of `short` is nearer to the stale `at` and the parse check ignores key order (`isDeepStrictEqual`).

"Between the same neighbours as before" holds only when the growth is smaller than the distance back to the previous line start. The case must fix the length change, or name both outcomes. See check 5 for the design point.

**Case 9, expected result wrong for its own example.** Probe `flow.ts`: `setFields('{id: alpha, next: go}\n', { title: 'A title' })` answers `changed: []` with `refused: [{ field: 'title', reason: 'the edit did not verify; nothing was written' }]`. So "the rest of the file rewritten as a flow map" gives 400 `refused`, not 200 with `title: A title` appended.

In a block-map root, some line start almost always passes for top-level whole-line text, so the fallback is rarely reachable. An input that does reach it (probe `sim.ts` "parent back"): `status.line` cleared as the only child, then `status:\n  chips: [a]\n` added by hand. No line start passes, because it would duplicate `status`. The value write gives `status:\n  chips: [a]\n  line: the line\n` with `changed: ['status.line']`, so the answer is 200.

**Case 10, untestable as written.** "The same text Q110's cases expect" names no text. It should state the file, the record and the exact text expected, for example a file without `title` and `recorded(into, 'title', 'A title', null)`, giving `title: A title` appended.

**Case 14, inconsistent with item 3.** Item 3 tries `at` only "when `at` is within the file's length" and tries line starts only "when the check fails at `at`". It does not say that an `at` past the end counts as a failure. It also does not say whether `text.length` counts as a line start when the file ends with a newline. The second half of case 14 ("when none passes") cannot be built with a top-level field in a block map. It needs the recreated-parent input above.

**Item 3's wording "within the file's length", finding.** Removing the last key always gives `at` equal to the length after removal. Probe "last key": `{ at: 10, text: 'title: T\n' }` with length 10, and the no-final-newline case also gives `at` 10 for text `title: T`. The rule must be `0 <= at <= text.length`, or undoing a clear of the last key fails.

**Item 3's wording "at was a line start", not determinable.** The undo holds only `{ at, text }` and the current file, so it cannot know whether `at` was a line start. Define "whole lines" from `text` alone (it ends with `\n`). The parse check is the real guard.

A multi-line flow map shows the difference: probe "multi-line flow" removed `line: "x",\n  `, which ends without a newline. Text such as `line: "x",\n` from `status: { line: "x",\nchips: [a] }` does end with a newline even though `at` is mid-line.

**Case 16.** It holds only because `title: "A title"` has no trailing newline. With `\n` it is whole lines, and a top-level line start passes. The case should say so, and state what `refused` holds (field and reason).

**Case 3 and case 5.** "Back at its place" and "back as written" should be the whole-text comparison the describe promises (`toBe(<text before>)`).

**Case 17** is not marked Route or Pure. **Case 18:** the lines are `changes.svelte.ts:19-31` and `History.svelte:96,132-138`.

**Item 5's doc sentence is inaccurate against item 3.** "A change ... whose place no longer fits, gives the value back as a new line". Under item 3, text that no longer fits at `at` is first tried at other line starts, and it comes back as the recorded lines at a different place. The value comes back as a new line only when no line start passes.

**spec.md's "every key ... exercised empty, duplicated, and colliding".** Case 11 covers `at: -1`, `text: ''` and `removed: 'yes'`. Missing:
- `at` not an integer (`3.5`)
- `at` as a string (`"10"`)
- `removed: null`
- `removed` as an array
- `text` not a string

## 5. Could it pass without the goal being reached

The goal: an undo of a manifest write that removed a field gives the file's text back as it was, a group clear included.

- **Cases 1, 2, 4, 6, 12 and 13:** no. Each compares the whole text byte for byte, or the record's exact values.
- **Cases 3 and 5:** yes as worded ("at its place", "as written"). Fix by comparing the whole text.
- **Case 7:** yes, by design (decision 4). The text differs when undone oldest first. `History.svelte:132-138` offers Undo on every row, so the reader can reach that order.
- **Case 8:** yes. With a large length change the check passes with the lines above their old neighbour, and the case's claim fails.
- **Cases 9, 10, 11 and 14:** they test the fallback, not the goal. As written, 9 and 14 cannot be built as stated.
- **Case 15:** could pass on texts of the builder's choosing unless the brief gives the texts.
- **Case 16:** fine for its purpose.
- **Case 17:** yes only if the new key is added above `at`, which the case excludes.
- **Items 1, 2 and 4:** no.
- **Item 3:** yes. The nearest-line-start search accepts any place the parse check passes, and the check ignores key order and comments. Any top-level line start passes for a top-level field, so a stale `at` returns the lines "somewhere", and every test that compares parsed values passes.
- **Item 5:** passes with an inaccurate sentence (see check 4).

**Design point for the orchestrator.** `{ at, text }` cannot be exact for every order of undo. The brief's choice of coordinates (the text just before the field's own edit) is exact for newest-first undo. It is not exact for the undo of one row of a mixed form save, where a changed field above the cleared one is applied after the clear.

That save is realistic. `Editor.svelte:130-137` posts every dirty field in one write, so clearing `short` and changing `title` above it in the same save puts `short`'s `at` off by the title's length change.

Coordinates in the text the whole write left would be exact for that single undo, but not for newest-first sequences. Exact placement in every order needs context recorded beside `at` (for example the neighbouring line), which is a shape beyond the plan line and Axel's to rule.

Options:
- (a) Keep the brief's coordinates and state the limits in cases 7, 8 and the mixed save.
- (b) Record context, raised to Axel as a new key.
- (c) Coordinates in the final text, with the opposite trade-off.

The lazy option is to decide this silently in the brief.

## 6. Implied inputs

Each with its expected result.

**Must add:**
- **CRLF document.** Probe: `id: alpha\r\ntitle: T\r\n...` gives `at` 11, `text` `title: T\r\n`. Undo gives the bytes back exactly, and a line-start search counts the position after `\n` as a line start. Add a pure case and a route case.
- **File without a final newline.** Probe: `id: alpha\ntitle: T` gives `at` 10, `text` `title: T` (partial, tried only at `at`, which equals the length). Undo is exact. Add one.
- **Multi-line block scalar.** Probe: `abstract: |\n  one\n  two\n\nnext: go\n` gives `text` `abstract: |\n  one\n  two\n` with the blank line left in the file. `|+` gives `abstract: |+\n  one\n` while the value `"one\n\n"` spans the blank line. Undo is exact in both, and the check compares the kept trailing newlines. Add a pure case for `|+` (the check must pass at `at` even though the value's last newline stayed in the file).
- **List of maps cleared by `[]`, and an empty map cleared by `{}`** (the conversion at `yaml-edit.ts:684-692`). Probe: `meta:\n  - { a: "1" }\n  - { a: "2" }\n` gives `at` 10, whole lines. The `removed` entry is present and the undo gives the text back. A pure case is needed, since no manifest schema field holds a list of maps for a route case.
- **Schema checks before the insertion.** A record made by hand with a well-formed `removed` for `tier` (readonly), `paths` (keymap), `nosuch` (unnamed) or `id`/`type` (`READ_ONLY`). Expected: refused exactly as today (`undo.test.ts:553-583`), with the file unchanged. Item 3 does not say the insertion runs after `unwritable` and the `named` check, and without them an insertion would write a keymap block.
- **A parent recreated since.** `status.line` cleared as the only child, then `status:` with another child added. Expected: no place passes, and the value is written into the existing map. This replaces case 9's example.
- **A mixed save.** A clear and a value change in one write, with the changed field above the cleared one and applied after it (schema order `short` before `title`, file order `title` above `short`). Expected: state it, per the design point in check 5.
- **`at` between two halves of a surrogate pair.** `at` is a UTF-16 code-unit index. Probe "emoji before": `note: "😀"` before `title` gives `at` 21, where code points give 20 and bytes 23. Expected: that position is never tried, since a lone surrogate would be written as U+FFFD by `writeTextAtomic`, and the line-start search continues. The brief's "character index" must say "UTF-16 code-unit index into the text read as UTF-8".
- **`removed.text` holding non-ASCII.** Expected: carried through JSON and reinserted exactly. A route case with an accented value (`title: "Linköping"`) keeps the bytes.
- **Malformed variants** listed in check 4.

**Not needed as cases (state in the report):**
- **The deposit's writes.** `writeManifest`'s records from `deposit.ts:386` are never logged, so a `removed` there is dropped. The deposit does not pass the new argument, and nothing changes.
- **Concurrent writes.** The insertion reads the file and writes it by rename with no lock, like every manifest write. An edit that lands between the read and the rename is overwritten. This is an existing property, not introduced here.
- **A `before` that JSON does not keep exactly** (`.nan`, `.inf`, `-0`). The check fails at every place, and the undo falls back to today's value write.
- **A `removed` key on a non-manifest record.** Ignored, since item 3 limits it to manifest changes. One cheap route case is optional.

## 7. ADRs

- `ls docs/adr` prints `ls: docs/adr: No such file or directory`.
- `ls docs` prints only `diagrams`.
- `grep -n -i "adr" .agents/plan.yaml` prints nothing, so the configuration names no ADR folder.

None.

## Declined to judge

- Whether option (a), (b) or (c) of the design point in check 5 is right. The record's shape is Axel's (ruling Z105), and exactness across undo orders is a product decision.
- Whether `yaml-edit.ts` stays well under 1000 lines after the insertion and the search. It is 720 now, and the brief already names the split.
- The count `checks: 7 commands passed` in verify item 1 was not checked against the verification block.

Probe files are in `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/q111-check/` (`six.ts`, `flow.ts`, `sim.ts`, `base.test.ts`, `vitest.config.mts`, `out.txt`). The brief is `/Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/agents/briefs/Q111.md`.

Usage: 197,316 tokens, 41 tool uses, 10.0 min (601,526 ms), served claude-opus-5-5.
