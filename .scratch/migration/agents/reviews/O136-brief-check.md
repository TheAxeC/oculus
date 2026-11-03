# Step O136 brief check (on main at 786ffd7ac)

This is the report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/O136.md`. All reads and probes ran in the gate worktree `/Users/axelfaes/workspace/oculus/.agents/worktrees/gate` (`git log -1` printed `786ffd7ac79c6dcc907762e4c58c969983e19a1c Launch the builder of step O132`). My probes are in `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o136check/` (`defaults.mts`, `cases.mts`, `nodefault.mts`, `c10.mts`, `boardwith.mts`, `rule.mts`, `hubfiles.mts`). Each one only prints, and each runs with `npx tsx <file>` from the gate.

Two findings matter most:
- The change turns two rows of an existing G13 test red, and the brief does not name that edit (Names, N1).
- Item 2's stated reason for dropping the head-comment clause is false for top-level keyed families (Premises, P5).

## 1. Names

- `familySchema`: `git grep -n "familySchema" -- . ':!config/local.yml'`. Outside `.scratch/`, the only hits are in `options.ts` (lines 302, 336, 384), which is in the paths. No hit outside the paths.
- "two forms": `git grep -n "two forms" -- src docs tests config utils README.md ':!config/local.yml'`.
  - Hits outside the paths: `model-calendar.ts:12`, `lsp/uris.ts:1`, `state/life/calendar.ts:7`, `latex-target.ts:3`, `terminal-tabs.ts:57`, `words/format.ts:109`, `MenuList.svelte:89`, `tests/server/machine/lsp/uris.test.ts:1,118`.
  - All of them concern other subjects. The change makes none false.
- "list of rows": `git grep -n -i "list of rows" -- src docs tests config utils README.md ':!config/local.yml'`.
  - `engine.ts:15` and `engine.ts:138` describe the forms of `withShapes`, which stay true.
  - `in-place.ts:8,42,256` describe the merge, which stays true.
  - `manifest-schema.yml:13`, `findings.yml:76,81`, `actions.ts:194`, `manifest.ts:147,224`, `career-view.ts:83`, `forms/schema.ts:171`, `list-drag.svelte.ts:171`, `AuditSection.svelte:30`, `config.test.ts:716,757`, `served-roots.client.test.ts:111` and `convert-vscode-themes.ts:366` are other subjects. None is made false.
- "keyed family": `git grep -n -i "keyed famil" -- . ':!config/local.yml' ':!.scratch'`. The only hits are `options.ts:22` and `options.ts:314`, inside the paths.
- The head comment's sentences: `git grep -n "taken here\|refused by the rule\|refused here\|marks what the Settings view refuses\|catalog's rule"`.
  - Outside `options.ts`, the hits are other subjects: `counts.ts:6`, `catalogs.ts:4,320`, `editor-options.ts:2`, `live-settings.ts:14` and similar.
  - `git grep -n -i "a map from a key to a record\|map from a key to a value"` also hits `src/lib/data/shapes/catalog-files/options.ts:95` and `NestedCards.svelte:3`. Both say a family is "a list of records, a map from a key to a value, or one record", which stays true.
- The HELP bullet at line 570: `git grep -n "Ctrl+Space\|whose words oculus holds" -- docs README.md src config ':!config/local.yml'`. `README.md:27` ("Ctrl+Space in a settings file completes each key with its description") stays true. The other hits are about Monaco keys.
- `tests/data/sources/config/catalog/options-schema.test.ts` (in the paths, but not named by "What to build"): `grep -n "boardWith" tests/data/sources/config/catalog/options-schema.test.ts` printed lines 158, 188 and 189.
  - At lines 157-160, `boardWith` writes `boards:` in `config/defaults/layout.yml` as a list of rows (`boards:\n  - key: mine\n    label: Mine\n    tier: ${tier}\n`).
  - Its doc comment reads "A `boards:` list of one board whose `tier`, on line 4, is `tier`."
  - Rows 188-189 of describe 'the schema of a multi' expect `['4:']` and `[]`.
  - On main (`boardwith.mts`): `boardWith(nonsense) => ["4: boards[0].tier does not fit the schema of this file"]`, `boardWith(research) => []`. The map form gives `["4: boards.mine.tier does not fit the schema of this file"]` and `[]`.
  - By the brief's own C1 (a list of boards in layout.yml is one problem on line 2 after the change), both rows go red after the change: they would get `['2:']` instead of `['4:']` and `[]`. The doc comment also becomes false once the helper is rewritten.

Findings:
- N1: The change makes `boardWith` (`options-schema.test.ts:157-160`) and rows 188-189 of 'the schema of a multi' false or red. "What to build" does not name the edit, and item 2's grep words do not find it.
  - Closable in the brief, within the step's paths: item 4 names rewriting `boardWith` and its doc comment to the map form, with `tier` still on line 4 and the expected lines unchanged.
  - The report then lists that edit with its before and after, as the rules file's "What every package obeys" requires for an edit to an existing test.

## 2. The step line

- "`familySchema` gives every keyed family the form its reader takes, in place of `type: ['array', 'object']` with rows": item 1.
- "a family field (`control: records`) a map, as `familyProblem` holds it": item 1, first bullet (a key/value family as a family field is a map). This rests on the premise that every keyed family field is a key/value family, which `def.mts` confirms ("nested keyed 44", "all nested keyed are pairs").
- "a top-level keyed family the form its whole-file shape and the in-place merge read ..., a map for `research_audit`, `stages`, `palette` and the others merged by their words, a list of rows for `categories`, `focus_lanes` and the others read as rows, in every options file that has one": item 1, second bullet, with Decision 1 (the form comes from the entry's `default`) and `withShapes` kept.
  - The two agree: `def.mts` printed "disagree 0".
  - `defaults.mts` shows that the rule the brief states gives, for every non-hub keyed family, the form `familyKind` takes (no WS-DISAGREE line).
- "so a keyed family written in the form its reader refuses is marked in the editor": item 4 (rows C1 to C9 through `problemsOf`) and item 5 (yaml-language-server over the served schema for C1 and C6).
- "with a case per form in oculus's files and a hub's settings file":
  - A list where a map is taken: C1, C2, C3 and C5 in oculus's files, C7 in a hub's file, C9 in a workspace file.
  - A map where a list is taken: C4 in oculus's files, C6 and C8 in a hub's file.
- "the head comment of `options.ts` no longer names keyed families among the places the schema and the rule part": item 2.
- "Corrected at /spec": the marks are added in the defaults files (C1 to C5), at a hub's keys with no in-place shape (C6 `collections`, C7 `counts`, C8 `audit.required_sections`), at a workspace's keyed families (C9 `boards`) and at every family field (C2 `params`). C11 serves the sentence's claim that `withShapes` already marks `research_audit`, `stages` and `categories`.
- "A full step": the Size line.
- Parts of "What to build" with no requirement in the line:
  - Item 3 (the HELP.md sentence) comes from the rules file ("What every package obeys": a step writes what a user does into `docs/HELP.md`).
  - C12 to C14 are audits that serve "in place of" without false marks.

Findings: none.

## 3. Premises

- `ls docs/adr`: "ls: docs/adr: No such file or directory". This matches the brief.
- The `familySchema` line references: I read `options.ts:298-328`, `:309`, `:310`, `:323-324`, `entrySchema` at `:375-388` and `ownSchema` at `:334-339`. They match.
- `familyProblem` at `value-rule.ts:249-273`: `grep -n "function familyProblem"` printed `249:`. This matches.
- `def.mts`: "no default text inPlace none", "no default leads_fit inPlace map", "disagree 0", "nested keyed 44", "all nested keyed are pairs". This matches the brief.
- `hub.mts`, among other lines:
  - "research_audit ... list: research_audit must be a map; oculus's value stands"
  - "stages ... list: stages must be a map; oculus's value stands"
  - "categories ... map: categories must be a list; oculus's value stands"
  - "collections shipped list | list: ok | map: ok"
  - "audit.required_sections shipped list | list: ok | map: ok"
  - This matches, and the brief places the refusal of `collections` and `audit.required_sections` in their readers.
  - The readers checked: `readList` (`hub-names.ts:396`) reads a non-list as no entries; `rowsOf` (`setting.ts:77`, `if (!Array.isArray(value))`) refuses a non-list; `countsFindings` refuses a non-map (`counts.ts:74`).
- `ws.mts`: `settings.boards`, `nav_groups`, `editor.languages`, `arrangements`, `read_limits` and `agents` each print "list [words]" for the list form and "map applied" for the map form. This matches.
- `familyKind` at `workspace-layer.ts:61-66`: `grep -n` printed `61:`. This matches.
- `enum.mts`: 44 lines. This matches "44 top-level keyed families", but one of the 44 is `venues.browser` (`holds: record`), which item 1 excludes (see P2).
- `schema.mts`:
  - `research_audit` list gives `2: research_audit must be a map, not a list`; `stages` list gives `2: stages must be a map, not a list`; `categories` map gives `2: categories must be a list, not a map`; vocab `stages` list gives `2: stages must be a map, not a list`.
  - layout `boards` list, sources `collections` map, hub `collections` map and hub `counts` list give `[]`.
  - This matches.
- `schema2.mts`:
  - hub `new_project_dir` list, behavior `links` map, `editor.languages` list, layout `counts` list and workspace `settings.boards` list give `[]`.
  - `read_limits` list gives `2: read_limits[0].key is pdf, which is not one of ...`, and `languages` list gives `2: languages[0].key is en, which is not a key of languages`.
  - This matches.
- `cases-before.mts`: C1, C3 to C9, C10b to C10h and C14 give `[]`. `c2b.mts`: `C2p => []`, `C2pok => []`. `c2.mts`: `5: boards.b.stages[0].value is ["nascent"], which is not a key of project_stages`. This matches. The brief's C10 has two texts that `cases-before.mts` lacks (see P4); my `c10.mts` gives `C10 layout boards map => []` and `C10 layout boards flow map => []` for the first, and `c2b.mts` `C2pok` covers the second.
- C11 texts (`c10.mts`): `C11 hub stages list => ["2: stages must be a map, not a list"]` and `C11 hub categories map => ["2: categories must be a list, not a map"]`. This matches.
- The head comment (`options.ts:11-24`), the doc comment at `:298-301` and the comment at `:313-314`, as quoted. This matches.
- G13 at `guarded.md:252-254`: `grep -n "G13"` printed `252:`. The three describes exist (`options-schema.test.ts:80,133,211`). This matches.
- `checkDocument` callers: `git grep -ln "checkDocument" -- src tests` printed `check.ts`, `run.ts`, `config-folder.test.ts` and `options-schema.test.ts`. `run.ts:568` checks only manifests and hub data files ("The other schemas serve the editor alone", `run.ts:13-14`). This matches.
- HELP.md:570: `sed -n 570p docs/HELP.md` shows the quoted text. This matches.
- `node_modules/yaml-language-server` is present, version 1.24.0.
- Steps in flight: the "Paths this step writes" of O132 and O133 are as the brief says. Neither names `options.ts` or `options-schema.test.ts`; the HELP ranges are 588-596 and 400-410.

Findings:
- P1: `.agents/worktrees/O136-base/` does not exist (`ls`: "No such file or directory"). The brief states it as present. It is made at /spec Steps 7, so it must stand before dispatch.
- P2: The "44 top-level keyed families" printed by `enum.mts` include `venues.browser` (`holds: record`). Item 1 governs 43. "Every one whose in-place shape is known has a default of that form" holds for those 43.
- P3: Some line references are slightly off. The builder's Read list covers the true lines.
  - `counts.ts:60` is the doc comment; `countsFindings` is at `:67` and its map check at `:74`.
  - `in-place.ts:83-142`: `VOCAB_SHAPES` opens at `:82`.
  - `engine.ts:150-200`: `shapedSchema` opens at `:141`.
  - `options-schema.test.ts` "lines 31-73": `problemsOf` is at `:50-60` and `READERS` at `:72-78`.
- P4: `cases-before.mts` labels a board `stages` text as "C2" and "C10a". Those texts are not the brief's C2 and C10, and the brief correctly takes C2 from `c2b.mts`. The file has no row for C10's layout `boards: { b: { label: B } }` or the reader row's `params: { q: v }`. `c10.mts` and `c2b.mts` show both give `[]` on main, so the brief's claim holds.
- P5: Item 2 says the head comment's keyed-family clause goes "since the schema and the rule no longer part on it". That is false for a top-level keyed family.
  - An entry with `fields` and no control gets no control (`options.ts:433-434`, "A family is described by its fields; it has no control of its own"), and `valueProblem` returns null for it (`value-rule.ts:340-341`).
  - `rule.mts` printed `boards control=- list: null map: null`, and the same for `counts`, `collections`, `links`, `read_limits` and `audit.required_sections`.
  - After the change, the schema refuses one form of each top-level keyed family while the rule takes both. Only family fields stop parting.
  - A head comment that states keyed families no longer part would be false of the file. That is the defect the O131 review raised against this head comment.
  - Closable in the brief: item 2 says that a family field's map is the rule's (`familyProblem`), and that the rule reads no form of a top-level family, which the schema holds to its reader's form.

## 4. Cases and checks

- C1 to C9: consistent with the rules file ("What every package obeys": a test belongs to one guarded entry, as a table; "Verify before you report" 5). Each fails on main, as section 3 shows.
- C10: consistent. It bundles nine texts read through four different readers (layout, behavior, hub, workspace) into one row. The table of 'the schema of a multi' holds one reader per row, so the new table must carry a reader per text. This is a builder detail, not a break.
- C11: consistent as an audit. Its marks come from `withShapes` (`engine.ts`, unchanged), but its input is `familySchema`'s output, so the change reaches it.
- C12, C13: consistent, as audits run after the change.
- C14: consistent as a case-run (rules file, "What every package obeys", the case-run program).
  - The `boards: { projects: null }` half reaches the changed code through `withOverrides`.
  - The `themes` half does not. `themes` has `key: name` and no `key` field, so `keyed` is false and its schema is unchanged.
  - No keyed family in the workspace schema is a list on the tree: `defaults.mts` shows every non-hub keyed family ships a map, and the two keyed families with a `key:` attribute (`sign_in`, `categories`) are hub keys.

Findings:
- K1: C14's `themes` half checks a place the step does not change (a family with no `key` field, which `familySchema`'s change does not reach). It can stay as a cheap audit, but it proves nothing about the change.
- K2: The brief's cases and "What to build" do not mention the existing rows of 'the schema of a multi' that the change turns red (N1). The builder's first run would meet them red only after the change, with no ruling on the edit.

## 5. The question

- C1 to C9 (rows of item 4): could they pass without the goal being reached? Yes, in a narrow way.
  - Each row compares only the count and the line, so any single problem on that line passes, for example a field problem of the row instead of the form.
  - Decision 4's reason ("check.ts words a union by one sentence") does not apply here. After the change, the family-level schema is one `type`, and its message is fixed and names the form, as the in-place keys show today: `2: stages must be a map, not a list` (`schema.mts`).
  - Item 5 checks the message only for C1 and C6.
- C10, C11, C12, C13, C14: yes, by design. They are audits that guard against false marks, and the brief says so.
- The check on the step line (a case per form, marked in the editor): no. Rows C1 to C9 fail on main and must mark after the change, and item 5 runs the editor's own server over the served schema for one case of each form.
- Item 1 (via items 4 and 5): no, with the caveat for C1 to C9 above.
- Item 2 (comments true of the file, found by a grep of four words): yes.
  - The grep does not find `boardWith`'s doc comment (N1).
  - Item 2's reason would lead to a false head-comment sentence on top-level families (P5).
- Item 3 (HELP sentence): it is checked by reading and does not bear on the mark itself. No.
- Item 5 (case-run on yaml-language-server for C1 and C6): no. It runs the editor's validator on the served schema and requires the message to name the form.

Findings:
- Q1: Rows C1 to C9 compare lines only. Closable within the test: each row also compares the form its message names ("must be a map" or "must be a list"), which is fixed for these schemas.
- Q2: Item 2's grep can pass with `boardWith`'s doc comment false (N1), and item 2's reason can lead to a false head-comment sentence (P5).

## 6. Implied inputs

This is a code step.

- A keyed family with no default (`text`, `leads_fit`; `def.mts`): missing from "Cases".
  - This input exists on the tree.
  - A wrong answer (a list form, from reading the absent default as "not a map") would cost the value checks. For a list-form schema with no `additionalProperties`, the map shape `withShapes` lays (`shapedSchema`, `engine.ts:141-160`, and the `text` handling at `:189-200`) carries no member, so any value would be taken.
  - On main (`nodefault.mts`):
    - `leads_fit:\n  strong: [a, b]\n` (hub) gives `2: leads_fit.strong must be a text, not a list`.
    - `leads_fit:\n  - { key: strong, value: green }\n` (hub) gives `2: leads_fit must be a map, not a list`.
    - `settings:\n  text:\n    a.b: [x]\n` (workspace) gives `3: settings.text.a.b must be a text, not a list`.
    - `settings:\n  text:\n    - { key: a.b, value: x }\n` gives `3: settings.text must be a map, not a list`.
  - Expected: the same problem on the same line, before and after (an audit).
- An empty default (`audit.required_sections: []`; `new_project_dir: {}`; `defaults.mts`): `audit.required_sections` is covered by C8 and C10 (the map form marked, the list form not). `new_project_dir` is a key/value family, a map whatever its default. No case is needed.
- A described record (`behavior.yml#reader_fields`, a key/value family): it takes the same `ownSchema` path as C2. Its map form is held by the existing scalar describe (`fields: { oa: { value: ... } }`). Covered.
- A family under `loose` (OWN_READER, `arrangements`): the map form is covered by C12 (shipped `layout.yml`). The list form is not in "Cases".
  - On main, `layout arrangements list => []` and `ws arrangements list => []` (`cases.mts`).
  - Expected after: one problem on line 2 (layout) and line 3 (workspace).
  - The cost of a wrong answer is low.
- A workspace override with a null key: C14 (`boards: { projects: null }`, `[]` on main). Covered.
  - The `removed: true` row reaches only non-keyed `themes` (K1). No keyed list exists in the workspace schema.
- The hub file's in-place keys after `withShapes`: C11 covers the marks of the wrong form. The hub's removal forms are missing from "Cases".
  - `stages:\n  drafting: null\n` and `categories:\n  - { key: x, removed: true }\n` give `[]` on main (`cases.mts`).
  - A wrong answer (`additionalProperties` or `items` lost before `shapedSchema` reads them) would mark a hub that takes oculus's word or row out. That form is documented in `config/catalogs/vocab.yml:4`.
  - Expected: no problem, before and after.
- A keyed family field that is not a key/value family: none on the tree. Item 1 does not state its form.
  - `familyProblem` takes such a field as a list of records (`value-rule.ts:271-272`), so the expected result is a list of rows.
  - Not required as a case. The cost arises only when such a field is added.
- A family value written as YAML null (`collections:` with no value): on main, `1: collections must be a list or a map, not null`. After the change the line is the same and only the message changes. No case is needed.

Findings:
- I1: The keyed families with no default (`text`, `leads_fit`) are missing, with the expected results above.
- I2: The hub's removal forms of in-place keys (`<word>: null`, `removed: true`) are missing, with the expected result "no problem, before and after".
- Both are within the step's line, since they hold the form of a keyed family. Neither widens the paths.

## 7. ADRs

- `ls docs/adr` printed "ls: docs/adr: No such file or directory". `.agents/plan.yaml` has no `adr` key (`grep -n "adr" .agents/plan.yaml` printed nothing). There is no record.

Findings: none.

## 8. Dictated text

- The describe title 'the schema of a keyed family': `grep -n "the schema of a keyed family" O136.md` (line 33). Holds: plain, with no word the rules file's "No history in code or comments" bans, and it matches the sibling titles.
- `{ type: 'object', additionalProperties: <member> }`: `grep -n "{ type: 'object', additionalProperties: <member> }" O136.md` (lines 28, 29). A code fragment, read whole. Holds.
- `{ type: 'array', items: <rows> }`: `grep -n "{ type: 'array', items: <rows> }" O136.md` (line 29). Holds.
- The YAML case texts: each holds (ASCII, flow YAML, no prose).
  - `- { key: b, label: B }` (lines 40, 48)
  - `- { key: q, value: v }` and `params: { q: v }` (lines 41, 49)
  - `- { key: projects, tab: true }` (lines 42, 46)
  - `doi: { address: 'https://doi.org/{id|path}' }` (line 43)
  - `- { key: next, value: 300 }` (line 44)
  - `notes: { file: .oculus/data/notes.yml }` (line 45)
  - `x: { file: README.md, heading: Results, folders: [] }` (line 47)
  - `boards: { projects: null }` and `- { name: <a theme of appearance.yml>, removed: true }` (line 53)
  - Each found by `grep -n` of the text in `O136.md`.
- C10's `links: [{ key: doi, address: ... }]` (line 49): the `...` is a placeholder for C4's address, not a literal to write. Holds as a placeholder.
- Item 3 gives no words ("The builder words it"), and item 2 gives none, so neither is dictated.
- `LC_ALL=C grep -n '[^ -~]' O136.md` printed nothing.

Findings: none.

## Declined to judge

- `plan.md` has no Goal section; its headings are `# Plan`, `## Steps, in execution order`, `## Could run in parallel`, `## Rulings`, `## Agents` and `## Blocked, and by what`. I used the goal part the caller named: the editor marks a keyed family written in the form its reader refuses.
- I ran no probe of the tree after the change, since no code may be changed here. That N1's rows go red, and the messages in Q1, follow from the brief's expected results for C1 and from `schema.mts`'s messages for the in-place keys.
- Whether a truthful head-comment sentence on top-level families (P5) counts as "naming keyed families among the places the schema and the rule part", which the step line rules out, is the orchestrator's reading. A separate sentence saying that the rule reads no top-level family's form meets both, so I raise no clash.
- Whether I1 and I2 become test rows or case-run lines under the rules file's test rule is the orchestrator's choice.

Agent usage: a9fae723e1ab7ad1b, claude-opus-5-5, 236992 tokens, 68 tool uses, 14 min 46 s.

## Closed

- N1 and K2: item 4 names the rewrite of `boardWith` (`options-schema.test.ts:157-160`) to the map form, `boards:\n  mine:\n    label: Mine\n    tier: ${tier}\n`, `tier` still on line 4, its doc comment rewritten, rows 188-189 keeping their expected lines, the edit listed in the report with its before and after. The dictated code line is held: ASCII, the test's own template form, read whole.
- P1: the base copy's bullet says it is made at /spec before the builder starts; /spec makes it after the preparation commit.
- P2: the bullet says 43 families are governed by item 1, the 44th of `enum.mts` being `venues.browser` (`holds: record`).
- P3: the line references corrected: `counts.ts:67` and `:74`, `in-place.ts:82-142`, `engine.ts:141-200`, `problemsOf` at `:50-60` and `READERS` at `:72-78`.
- P4: no change; the brief takes C2 from `c2b.mts` and C10's texts were confirmed by the check's `c10.mts`.
- P5 and Q2: item 2 now says the keyed-family clause goes because no keyed family has a form the schema takes and the rule refuses, and puts in its place a sentence of its own: a family field's map is the rule's form (`familyProblem`); the rule reads no form of a top-level family, which has no control, and the schema holds it to its reader's form. The requirement gives no words, so the builder words it.
- K1: C14's `themes` half removed; C14 keeps `boards: { projects: null }`, which reaches `withOverrides`.
- Q1: item 4's rows C1 to C9 also compare the form the message names, "must be a map" or "must be a list".
- I1: case C15 added, the keyed families with no default (`leads_fit` in a hub's file, `text` in a workspace file), with the expected results of `nodefault.mts`, an audit row.
- I2: case C16 added, a hub's removal forms of keys laid in place (`stages: { drafting: null }`, `categories: [{ key: x, removed: true }]`), no problem before and after, an audit row.
- The arrangements list form (an implied input the check names under "Implied inputs" without a finding): not added, the check judging its cost low.
- Paths compared again after these changes: unchanged (`options.ts`, `options-schema.test.ts`, `docs/HELP.md` line 570, `docs/diagrams/*`, the report); the shared paths with O133 and O132 are as before.
