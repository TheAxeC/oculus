# Step O50 brief check (on main at cd00ebb1)

Main moved to ad6e6685 while I worked (`git log --oneline -3`). `git diff --stat cd00ebb1 ad6e6685` shows only `.scratch/migration/{orchestrator-state,plan,queue}.md`, so every source fact below holds at cd00ebb1. Plan line numbers are as at cd00ebb1 (`git show cd00ebb1:.scratch/migration/plan.md | grep -n ...`). The brief says it was read at cfa2d965. `git diff --stat cfa2d965 cd00ebb1` shows only `.scratch/` files, so that premise holds.

## 1. Names

Command: `git grep -n -w self -- src tests config docs README.md utils ':!config/local.yml'` gives 93 lines (`| wc -l`). The other names were grepped with `git grep -n -E '<name>' -- src tests config docs README.md utils ':!config/local.yml'`.

Hits about the person:

- **Inside the write list, but not named in the brief, and made false by the change.** `config/defaults/sources.yml:28`, in the long `collections` comment, says: "`people` the people registry (one entry per human the hub names, exactly one with `self: true`, whose `affiliations:` ...". The file is on the write list as a whole, but neither "What is on the tree" nor item 7 names this line. Fixing it is a correction inside the step.
- **Outside the write list, staying true:**
  - `docs/apps.md:380` (`self?` among the wire fields; item 3 keeps the wire field).
  - `src/routes/api/(sessions)/terminal/+server.ts:7,21` (`ownerName` import and `ownerFor: () => ownerName(server.hub)`; `ownerName` is kept).
  - `tests/routes/sessions/terminal-actions.test.ts:537,571` (the fallback words and an injected `ownerFor`).
  - `config/text/server.yml:58` (`chat_owner_fallback: its owner`, still the empty-`self` words).
  - `src/lib/server/edit/writes.ts:45,319`. These are the import of `entities as entitiesOf` and the pass-through `(kind) => entitiesOf(server.hub, kind)`. Line 319 is outside the write range "lines 135-142". It still type-checks if `hooks.ts`'s `entities` parameter widens with it, so nothing there becomes false.
- **Outside the write list, needed by item 2 (widens the step: paths).** `src/lib/views/system/workbench/Settings.svelte:187-196` builds `listsOf({... portfolio: { domains, resources, projects } ...})`. `ListInputs.portfolio` in `editors/sources.ts:45-49` carries only those three maps. Item 2's page half ("the keys of the portfolio's people that carry no `root` ... `labels` mapping each key to the person's name") cannot read people unless Settings.svelte hands them in. The fix adds a path. The step line's own words ("Settings draws the row with a picker of the people registry") ask for it. Whether it is a correction or a widening is the orchestrator's or Axel's call.
- **Outside the write list, not made false (widens the step if acted on).** `src/lib/data/sources/config/catalog/schemas/references.ts:26-33`: `OPTION_SOURCES` maps option source words to the sources the reference index follows. Without `people`, a `self` value is no reference, so renaming a person key does not reach `settings.self`. The head comment (":21-24, a word outside this table ... names no source the index holds") stays true.
- **Generic readers of `SOURCES` that follow the new word, not false:** `src/lib/data/shapes/catalog-files/options.ts:23-28` (`z.enum(SOURCES)`), `src/lib/data/sources/config/catalog/options.ts:60`, and `config/options/appearance.yml:11` ("SOURCES in options.ts", as true as today).
- `tests/views/system/workbench/workbench-fixture.ts:34` and `tests/state/system/settings/theme-groups.test.ts:63` build `ListInputs` with `portfolio: null`. They are unaffected.
- **Every other name is inside the write list:**
  - `self_not_one`: `config/text/findings.yml:282`, `validate.ts:312`.
  - `person.self`: `config/text/views/boards/person.yml:13`, `Person.svelte:190`.
  - `checkPeople`: `validate.ts:301,394`.
  - `ownerName`: `hooks.ts:151`.
  - `person` of normalise.ts: `normalise.ts:379,699`.
  - `entities` of hooks.ts: `hooks.ts:140`.
  - The source word `people` has no hit as a source today.
- **Inside the write list, a different `self`:** `Person.svelte:184,189,282,310` use the CSS class `.self` for the page's paragraph rows, not the flag.

Hits about something else, one group per line:

- CSP `'self'`: `src/hooks.server.ts:14,76`; `src/lib/server/machine/apps/serve/address.ts:14`; `tests/server/machine/runs/recover/answers/physionet/mitdb.headers:9`, `zenodo/aad-dtu.headers:19`, `zenodo/picai.headers:19`.
- Worker `self`: `file-match.worker.ts:10,14`; `inner-changes.worker.ts:67,69`; `ui/controls/editor/kit/load.ts:13,320,408`.
- `align-self` / `justify-self`: `PaletteRow.svelte:148`, `Ticker.svelte:193`, `TabFace.svelte:298`, `Tabs.svelte:428,462,513`, `TreeItem.svelte:373`, `FoldLine.svelte:34`, `DetailsBody.svelte:349`, `TerminalTitle.svelte:105`, `Clamp.svelte:83`, `ChangeGroups.svelte:444`, `File.svelte:503`.
- LaTeX root `self`: `server/content/latex/root.ts:10,42,379`; `state/sessions/latex/latex-state.ts:117,322`.
- `dependency-self` error: `data/helpers/run/chain.ts:46`, `model/machine/model-machine.ts:314`, `state/shared/answers/terminal-words.ts:44`.
- Page state's `self` id: `state/shared/stores/page-state.svelte.ts:144,225,243,268,285,359,371,391,430,436`.
- Terminal list's `self`: `views/sessions/terminal/terminal-list.ts:470,471,476,480`.
- Zenodo link: `recover/sources/zenodo.ts:27,43`; `answers/zenodo/*.body:1`, `answers/stanford/purl.body:1`.
- Other unrelated words:
  - desktop `close-self` (`desktop/decide/channels.ts:7`, `desktop/preload.cjs:25`);
  - clangd `self=` (`state/system/machine/lsp/clangd.ts:66,105`, `MemoryUsage.svelte:7`);
  - "self-contained" (`config/text/views/boards/deposit.yml:37`);
  - "self-evaluating" (`rite.ts:173`);
  - "ancestor-or-self" (`ui/frame/toolbar/fit.ts:37`);
  - a cyclic test object (`tests/state/system/apps/methods.test.ts:162`).

`utils`: no hit (`grep -rn -w self utils`, empty).

## 2. The step line

`plan.md:669` matches the brief's quote exactly (compared in the shell: SAME). Each part maps to these items:

- "who the user is becomes the workspace setting `self`, naming the user's person key": item 1, with Decision 1.
- "in place of `self: true` in `people.yml`": items 3, 4, 7 and 8, and C11.
- "the Person page's tag ... read it": item 3 (the wire flag set from the setting) and item 6 (pressed state).
- "the portfolio chat ... read it": item 5.
- "the check read it": item 4.
- "the hub's line is moved once": item 8.
- "Settings draws the row with a picker of the people registry": items 1 and 2. The page half needs `Settings.svelte`, which is not on the write list (section 1).
- "the Person page's 'this is me' becomes a button that writes it": item 6.

No part is left without a requirement. One note: the chat part also sits on O53's line ("the portfolio chat names the person `self` names", `plan.md:672`), so the same requirement appears on two steps.

## 3. Premises

Hold as stated (reread or rerun):

- The ruling quotes. `grep -n -F` of each quote finds `plan.md:2400`, `:2406` and `:2409`.
- `normalise.ts:375-393` (`person()`, `self: entry.self === true ? true : undefined` at :389).
- `model-entities.ts:790-791`.
- `validate.ts:297-314`, with the call at :394.
- `findings.yml:282`.
- `Person.svelte:188-192`, `person.yml:13`.
- `hooks.ts:140-145` and `:147-160`, `+server.ts:21`, `chat.ts:28-31` and `:115`.
- `data-map.md:158`, `templates.md:843,856,866`, `apps.md:380`.
- Fixture lines 1-4, 16 and 33.
- The test lines `normalise.test.ts:185`, `schema-rules.test.ts:197-199`, `collections.test.ts:138,179`, `registries.test.ts:76`. `collections.test.ts:179` is a `toMatchObject` assertion that the raw entry keeps `self: true`. That is an assertion over the field, not over the owner, so item 7 edits an asserted line.
- The hub: `people.yml` lines 1-4, 16 and 112; `research-hub.yml` has `primary: research-hub` at :14 and `settings:` at :15. `grep -rln "self: true" .oculus projects` prints only `.oculus/data/people/people.yml`.
- `grep -rn --exclude=local.yml -E "^self:|^  self:" config` prints nothing (exit 1).
- `config-place.ts:3-9`, `hub-names.ts:329-353` (no `self`), `behavior.yml:150-156`.
- `catalog-words.ts:49-70`, `editors/sources.ts:113-122` and `:127-158`, `config-sources.ts:33` and `:45-71`, `writes.ts:139` and `:319`.
- `engine.ts:83-104`, `lists.ts:62-73` (REGISTRIES holds `people`).
- `ui.svelte.ts:121-122`, `:237-257`, `:243-246`.
- `index.ts:512-516`, `:531`, `:587-601`; `model/index.ts:89-98`; `portfolio.ts:613-614`; `paths.ts:61-69` (`configOptions` carries the workspace file); `merge.ts:1-10`.
- `hub-layer.ts:61-69`: a hub key outside the list gives `findings.config.hub_key_unknown` and is not applied.
- File sizes by `wc -l`: all ten match.

Differ:

- **`record.ts:120`.** This line is `additionalProperties: false` of `METALIST_ROW` (record.ts:113-121). The record schema of a file's fields closes at `record.ts:284`.
- **HELP.md range.** The notes on single views in `docs/HELP.md` run from line 280 to 314 (References at :314, `### LaTeX builds` at :316), not 280-312.
- **HELP.md grep.** `grep -n -i "self\|this is me" docs/HELP.md` prints three lines (:309, :318, :361, all "itself"), not nothing. The claim "says nothing of it" holds in meaning.
- **Template range.** The workspace template is `docs/templates.md:272-303`: the commented settings end with `#     hpc: null` at :302 and the fence is at :303. The brief and its path range say 272-300.
- **Minor line numbers.** `setStatusRepository` is at `ui.svelte.ts:433-437` (brief :434-437). The `settings` describe is at `workspace-file.ts:51-57` (brief :49-55).
- **Guarded entries.** The brief says "No entry covers `validate.ts`'s `checkPeople`, `normalise.ts`'s `person`, ..." (line 27). By the letter of `guarded.md` that is false for two files:
  - G32's Code names `src/lib/data/snapshot/`, `src/lib/data/model/`, `src/lib/data/index.ts` and `src/lib/data/sources/` (guarded.md:211).
  - G56's Code names `validate.ts` (guarded.md:193).
  - G64's Code names `validate.ts` (`checkRelationShapes`) (guarded.md:178).
  - G12's Code names `config/` (guarded.md:184), with `tests/checks/config/config.test.ts` held under it (guarded.md:356).
  - G13's Code names "the config readers under `src/lib/data/sources/config/`" (guarded.md:187), which arguably includes `engine.ts`.
  - The claim holds for `hooks.ts` and `Person.svelte` (no entry names them).

  Consequences are in section 4.
- **File sizes not given in the brief.** `model-entities.ts` is 876 lines, 4 under spec.md's 880 ("What every package obeys"), and item 3 rewrites its line 790. `model/index.ts` is 867, `writes.ts` 791, `chat.ts` 142, `Settings.svelte` 405.
- **Base copy.** `.agents/worktrees/migration-O50-base/` does not exist yet (`ls .agents/worktrees/ | grep O50`, exit 1). The brief places it at preparation, so this is consistent.

## 4. Cases and checks

- **C11 and Verify 4 have the builder run `git grep`.** spec.md "Where you work" (":33") says a builder never runs a git command, read-only ones included. This is a correction inside the step.
- **C1 to C6, C9 and C10 are "Checked by a run ... quoted", and the first-run paragraph asks for those runs on the unchanged tree.** Three things rule out every means of making them:
  - Brief line 104 forbids any script the step does not build. That is ruling Open item 116 (`plan.md:2240`).
  - spec.md ":59" forbids a test outside a guarded entry.
  - No existing test drives these paths. For example, `git grep -n -w entities -- tests/server/edit tests/routes/edit` prints nothing, so no write test hands the server a portfolio list.

  As written, these runs have no permitted means. A probe would need Axel's approval, quoted from Rulings, and a reading instead of a run changes the check method. This is reported, not resolved.
- **C11's expected output is wrong.** It expects "prints only the reader of the wire flag". The step keeps two readers: `hooks.ts:155` (item 5) and `Person.svelte:188` (pressed state, Decision 3). This is a correction inside the step.
- **Verify 1 lacks `tests/checks/config/config.test.ts`.** spec.md ":59" says a step whose change touches an entry's code runs that entry's test, and the step changes `config/`, which is G12's code. Adding it is a correction inside the step.
- **Whether C3 and C5 need a test row.** C3 and C5 (the snapshot's person mark) may fall under G32's guarantee: "What the hub shows is what its files say ... the snapshot built from them". If they do, spec.md ":59/:71" gives them a test row. That adds a test: widens the step. It goes to Axel or the orchestrator.
- **G8's `options-pages.test.ts`.** It covers page setters through `createUi` (`tests/state/workbench/options-pages.test.ts:35`), but G8's Code line does not name `ui.svelte.ts`, so no obligation follows.
- **Cases that check places the step does not change:**
  - C9 entirely (`hub-layer.ts:61-69`).
  - C10's finding half (`workspace-layer.ts`, `value-rule.ts`).
  - C8 (the unsaved branch of `writeOption`, `ui.svelte.ts:243-246`; only the setter is new).
  - C6 (`ownerName` is kept whole by item 5, and the `chat.ts:115` fallback is unchanged).
  - C1's byte-identical half (the config-key write is unchanged; only `config-sources.ts`'s check changes).
- **C7's look.** C7 is checked "by the look", but no folder of `research-hub.yml` other than the primary is a hub: a loop over the folders' `.oculus/config.yml` and `.oculus/data/people/people.yml` printed nothing. So the half "a person of another hub shows no button" cannot be seen on TEST; it rests on reading.
- **Consistent with spec.md:** C1's and C7's look ("Where you work", ":60,64-65"); Verify 2 (":26"); Verify 3 (the last paragraph's gate); Verify 5 (":87"); Verify 6 (":44"); Verify 7 (":61"); Verify 8 (":21").

## 5. The question

The step line carries no check of its own (`plan.md:669` ends with its rulings).

Each case:

- **C1:** the run part yes, the look part no. The run passes once the option exists and writes `settings.self`; it does not show a people picker. The look does.
- **C2:** yes, on its own. On the unchanged tree a write of `self` is already refused as no option, and nothing is written. It bears on the goal only if the quoted refusal is the out-of-list sentence and the run hands the write the portfolio's people.
- **C3:** no, once item 7 removes `self: true` from the fixture's `owner`. With the fixture unchanged, code that reads both the entry and the setting would pass.
- **C4:** no. The old count check gives a finding for an empty `self`, which C4's "none" half rejects.
- **C5:** no.
- **C6:** yes. `ownerName` is unchanged, so a run over a hand-made payload passes on the unchanged tree. It shows the setting reaching the chat only when fed by C3's build.
- **C7:** no for the press and pressed state (the look on the real hub after item 8); the other-hub half rests on reading.
- **C8:** yes. It reads the unchanged `writeOption`, and any setter that calls it passes.
- **C9:** yes. It passes on the unchanged tree (hub_key_unknown).
- **C10:** partly. It fails on the unchanged tree only because the fixture marks `owner`. After item 7 it would pass with code still reading the entry.
- **C11:** yes. A read written as `entry['self']`, `'self' in entry` or a destructuring escapes the pattern; reading item 3 closes it.

Each item of "What to build":

- **Item 1:** C1 checks it; it does not by itself need people.
- **Item 2:** three parts, checked unevenly.
  - The page part is checked only by the look.
  - The server part is checked by C2, with C2's caveat.
  - The `engine.ts` part (the workspace file's editor schema, `engine.ts:153-221`) has no case, so it could pass unbuilt.
- **Items 3 and 4:** C3, C5 and C4, as above.
- **Item 5:** C6, which could pass without the goal.
- **Item 6:** C7 and C8.
- **Item 7:** Verify 4's grep, which would fail if a hit were left.
- **Item 8 could pass without the goal.** With the hub left unchanged after landing:
  - the hub's own schema still declares `self`, so no schema finding;
  - an empty `self` gives no finding (Decision 4), so G14's `integrity.test.ts` stays green;
  - the chat falls back to "its owner".

  Nothing fails when the move is not made.

## 6. Implied inputs

None of these is in Cases. All lie inside the step's line unless marked.

- **A person key renamed, or the person deleted, while `self` names it.** Expected: item 4's finding naming the setting and the key, no person marked, and the fallback words. C4 covers the build state. How the Settings choice draws a held value outside its list is not stated. Carrying a rename into `settings.self` through `references.ts` widens the step.
- **The people registry unread, or empty, while `self` is set.** Today `checkPeople` returns on an empty registry (`validate.ts:307`), and the finding's file is `entries[0]?.file ?? ''` (:308). Expected, my judgment: no `self` finding when the file did not read, since the file's own finding names the cause. With a read but empty registry, the finding should name the people file's configured path, not ''.
- **A Settings write or a button press before the server has published a portfolio.** The server's check is then by type alone (`config-sources.ts:7-9,55-61`). Expected: the value is written, and item 4's finding follows if it names nobody.
- **A press while an earlier write is in flight, a second press superseding it, or the tab closed mid-write.** The case also includes the button's state between the write and the rebuilt portfolio's push: the pressed state comes from the wire flag, while `writeOption` holds a pending value (`ui.svelte.ts:247`). spec.md ":71" requires these to be stated, and neither "The key `self`" nor the report shape lists them.
- **A person with an empty name, or two people with one name, in the picker.** `labels` maps key to name. Expected, my judgment: an empty name drawn by its key, and equal names drawn so they can be told apart. Cost: an item that cannot be picked or is ambiguous.
- **A hand-set `self: lab:key` naming another hub's person.** The brief's "Colliding" paragraph states item 4's finding, but there is no case.
- **A workspace with no primary.** `buildFolderProjects` (`index.ts:546-575`) runs no validate and has no people. Expected: the choice offers only the empty item, and a hand-set value gives no finding. Low cost.
- **The hub left with its `self` schema row and `self: true` and no setting.** This is the state in section 5 under item 8. Expected after landing: `settings.self: axel-faes` in `research-hub.yml`. No case or landing check reads it.

## 7. ADRs

`ls docs/adr` prints "No such file or directory" (exit 1). `ls docs/glossary.md` prints the same. `grep -n -E '^adr|adr:' .scratch/migration/orchestrator-state.md` finds nothing (exit 1). This matches brief line 5.

## 8. Dictated text

- `grep -n -o 'a button "this is me"' O50.md`: line 40. Holds (plain ASCII words already in `person.yml:13`; spec.md "Prose").
- `grep -n -o 'self: axel-faes' O50.md`: line 42. Holds.
- ``grep -n -o "whose value is `''`" O50.md``: line 35. Holds.
- ``grep -n -o 'heading `sources`, section `People`' O50.md``: line 108. Holds.
- `grep -n -o '"Everything in the brief is done"' O50.md`: line 157. Holds (spec.md "Report").

The `empty:` words, the help line, the title key and the new finding sentence are requirements without words, so they are not dictated.

## 9. Sources

Every item names a source (`grep -n -E '^[1-8]\. \(' O50.md`: items 1 to 8 each open with a parenthesised source). Some parts inside items have no source but the brief's own Decisions, rather than Axel's words, a ruling or the step line:

- item 2's `engine.ts` part (the workspace file's editor schema), which ruling 208's "picker" does not name;
- item 4's "an empty `self` gives no finding" (Decision 4);
- item 6's "a person of another hub gets no button" and "pressing it on the person already set writes nothing" (Decisions 2 and 5);
- item 1's empty item (from the brief's "Empty" key case).

Item 7's HELP note is sourced by spec.md ":70".

## Declined to judge

- Whether C3 and C5 fall under G32's guarantee, and so need a test row. That is the orchestrator's or Axel's reading of guarded.md:210.
- Whether `engine.ts` is one of G13's "config readers".
- Whether "this is me" reads well as an unpressed button's words. No spec.md rule covers it.
- Whether the button's pressed state should follow `writeOption`'s pending value or only the wire flag.

## Closed

Each finding, with what was done in `agents/briefs/O50.md`.

- Names, `config/defaults/sources.yml:28` made false: added to item 7 and to Verify 8; inside the line (the old form is removed).
- Names, `Settings.svelte:187-196` and `ListInputs.portfolio` carry no people: item 2 now has Settings hand the portfolio's people into `listsOf`, and the path is added; inside the line ("Settings draws the row with a picker of the people registry" cannot hold without it).
- Names, `OPTION_SOURCES` in `references.ts`: not closed in the brief. It adds a requirement beyond the step's line (a rename of a person key carried to `settings.self`), so it was raised as open item 226 (ruling Brief check scope); Axel ruled (a), and item 2, C14 and the paths list now carry it.
- Premises, `record.ts:120`, the HELP.md range and grep, the template range, `ui.svelte.ts:433-437`, `workspace-file.ts:51-57`: corrected in "What is on the tree" and the paths list.
- Premises, guarded entries: the paragraph rewritten to name G32, G56, G64, G12 and G13 with their tests; their tests join Verify 1 and the test-edit rule.
- Premises, file sizes: `model-entities.ts` at 876 of 880 is stated.
- Cases, `git grep` in C11 and Verify 4: both now use `grep -rn`.
- Cases, runs with no permitted means (C1, C2, C4, C6, C9, C10): each is now checked by reading, C1's proof the look on landing; C3 and C5 are rows of G32's `normalise.test.ts` (spec.md test rule), each with its failing line on the unchanged tree.
- Cases, C11's expected output: it now expects the two readers of the wire flag, `hooks.ts` and `Person.svelte`, and reads item 3 for other spellings.
- Cases, Verify 1 lacks `config.test.ts`: added, with `relation-shapes.test.ts`.
- Cases, C7's look: the other-hub half rests on reading, said in C7.
- The question, items that could pass without the goal: C3's row names an entry still carrying `self: true` while `self` names another person; item 8 gets the landing check that `research-hub.yml` holds `settings.self: axel-faes` and the hub's `people.yml` no `self`.
- Implied inputs: the registry unread or empty (item 4), a write before the portfolio is published (Colliding paragraph), a press in flight or superseded (item 6), empty or equal names in the picker (item 2 and C13), a hand-set `lab:key` (C4), no primary hub (item 2 and C13), the editor's schema (C12). Each is an input of a part the step's line names, so inside the line.
- ADRs: none, as the brief says.
- Dictated text: holds, nothing changed.
- Sources: each item and the parts from Decisions now carry their source tag.

Agent usage: a5cae3c5b6723f862, claude-opus-5-5, 257554 tokens, 86 tool uses, 12 min 53 s.
