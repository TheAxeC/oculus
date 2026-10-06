# Step S4 brief check (on main at 125203b5)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/S4.md`. `plan.md` has no heading named Goal (`grep -n -i 'goal' plan.md` finds no heading). I took the goal from its opening paragraph, "Execution ledger for `tools/oculus/DESIGN.md`", together with the step line and the five rulings.

Disclosure first. Two of my commands named the `config/` folder without excluding `local.yml`:
- `grep -rln "config-key" src tests config` listed file names only, and no `config/` file was among them.
- `grep -c $'\r' config/*.yml ...` counted carriage returns, and its output was filtered with `grep -v local`.

Neither printed any content of `local.yml`. Every later command named the tracked files one by one.

## 1. Names

Greps run:
- `grep -rn "views/system/config\|Config\.svelte\|system/config\.yml\|config/files\.ts" . --exclude=local.yml` (outside `.scratch`)
- `grep -rn "group: 'info'\|group: 'views'" src`
- `grep -rn "Views and Settings" . --exclude=local.yml`
- `grep -rn "y1-y6\|w1-w4\|chord: w\|chord: y\|:w:\|:y:" src tests config HELP.md DESIGN.md README.md --exclude=local.yml`
- `grep -rn "'config-key'" src`
- `grep -rnoE "'config\.[a-z_]+'" src`

Hits outside "Paths this step writes" that the change makes false:
- `config/text/app.yml:12`, the keyboard sheet: `...y1-y6 | open a view of the System page's group;;...;;w1-w4 | open a view of the Views and Settings page's group;;...`. Made false. `tests/views/system/help.test.ts:266-279` requires one sheet row per chorded group, with the group's label and range, so the step cannot go green without editing this file.
- `config/text/views/system/history.yml` must gain `history.kind_config_value`. `tests/checks/source/keys.test.ts:174` derives a required key from every `kind: z.literal(...)` in `bodies.ts` (`tests/fixtures/kinds.ts`). This file is not in the paths.
- Five comments made false:
  - `src/lib/shell/rail/ActivityRail.svelte:5-7` ("the catalogue on the Views and Settings page").
  - `src/lib/state/workbench/navigation/catalogue.ts:4` and `:266`.
  - `src/lib/state/workbench/navigation/pages.ts:4-5`.
  - `config/catalogs/glyphs.yml:169` and `config/catalogs/icons.yml:168` ("the Views and Settings page's three views").
- Keys inside the file item 6 deletes but used elsewhere:
  - `config.local_tag` is read by `src/lib/views/system/workbench/settings/List.svelte:33`.
  - The 15 `config.desc_*` keys are read through `descriptionKey` (`views/system/config/files.ts`, also deleted) by `tests/views/system/help.test.ts:331` (HELP.md must quote each file's description), `tests/checks/config/config-folder.test.ts:468-476` (every config file must have one) and `tests/checks/source/keys.test.ts:150-157`.
  - "every key only it used removed" does not settle these. Three things are unnamed: where the `config` group goes (a group lives in one file), where `descriptionKey` moves, and whether Settings draws each file's description now that the Config view's cards are gone.

Hits inside the paths that the brief does not name but the change makes false (the builder will miss them without a pointer):
- HELP.md:
  - `:19`: "twelve" buttons, the System and Views and Settings entries.
  - `:21` and `:29`: "on the Views and Settings page".
  - `:72`: `w1-w4`.
- DESIGN.md:
  - `:322`: the closed kinds list names `config-key` and must name `config-value`.
  - `:374`: "`y`, `h` and `w`, one per rail page".
  - `:409`: "Account setup a view of the Views and Settings group".
- Head comments of the registrations:
  - `Catalogue.svelte:2`: "opens the ... group". Catalogue becomes third.
  - `Pages.svelte:2`: "closes the ... group". Pages becomes fourth.
  - `AccountSetup.svelte:2`.
  - `Settings.svelte:2`.
- `settings/List.svelte:2-3`: "the tag the Config view puts".
- `Settings.svelte:72`: `writes: { writeConfigKey }`, which must also name `writeConfigValue`.
- Tests not in item 7's list:
  - `tests/state/workbench/navigation/registry.test.ts:180,240-274` (groups and orders, `config` among them).
  - `tests/views/system/workbench/settings.test.ts:224` (`value="Views and Settings"`).
  - `tests/views/personal/account-setup.test.ts:60`.
  - `config-folder.test.ts:479-486` ("Help after System", `pages.indexOf('info')`).
  - `catalogue.test.ts:241,284-286,318`.
  - `arrangement.test.ts:289,352,396`.
- `docs/diagrams/channels.dot:102,147` and `channels.svg` hold the Config view's node. This is covered by the diagrams path.

Findings:
1. `config/text/app.yml:12` is outside the paths and made false. help.test fails without it.
2. `config/text/views/system/history.yml` (`history.kind_config_value`) is outside the paths and required by keys.test.
3. The fate of `config.local_tag`, the 15 `config.desc_*` keys and `descriptionKey` when `config.yml` and `files.ts` are deleted is unstated, and three test files and one component depend on them.
4. Five comments outside the paths are made false (`ActivityRail.svelte:5-7`, `catalogue.ts:4,266`, `pages.ts:4-5`, `glyphs.yml:169`, `icons.yml:168`).
5. The HELP.md, DESIGN.md (`:322` closed kinds), head-comment and test hits listed above are inside the paths but not named in the brief.

## 2. The step line

- List editor (add, edit, remove, reorder) for the 7 lists: item 3, list editor.
- Key/value table for the key/value families: item 3, key/value table. The count is corrected to 6 in the premises.
- A form for each of the 15 record families: item 3, form per record family.
- The rail keeps its own editor: item 1 refuses `rail` and `arrangements`; `Item.svelte` keeps `RailEditor`.
- A new confirmed write kind whose shape goes to Axel (Z190 (a)): item 1.
- Table of contents reachable below 700 px: item 4.
- Z168 `local.yml` link-only: items 1 and 5.
- Z190 (base, in-place lines, three checks): items 1 and 2.
- Z169:
  - Config view removed: item 6.
  - Pages merged, Settings and Catalogue swapped, five views placed: item 7.
  - The 7 (8) catalog files as entries: item 5.
  - Saved `info` page migrated: item 8.
- Z170 (open action for every file including `local.yml`, Texts group): item 5.
- Z171 (Pages kept, in the pane with Catalogue): item 7.

Findings: none.

## 3. Premises

- 7 lists, 6 key/value families, 15 record families besides `rail` and `arrangements`: confirmed. A Python walk of `config/catalogs/options.yml` printed `7 [...]`, `6 [...]` and 17 record entries including `rail` and `arrangements`.
- Shapes and counts: confirmed by `yaml.safe_load` of each file at the key, `layout.yml` from `git show HEAD:`:
  - `themes` 17, `floats` 1, `docs` 3, `deck.meta.legend` 4, `deck.order` 21, `deck.ideas.items` 10, `scan` 7, `collections` 12, `roots` 6.
  - `nav_groups` 12, `nav_live` 4, `deck.themes` 11, `deck.framing` 2 (`cards` 3, `legend` 4), `deck.summaries` 2 (`rows` 8 and 6), `tab_rollup` 3 (map of lists).
  - `read_limits` 5, `usage_tiers` 4, `open.program_ext` 10, `tab_split` 3, `deck.tag_tones` 4, `languages` 32 (map of lists).
  - `audit_ignore` holds an empty list `[]` (`behavior.yml:34`).
- Line counts: `wc -l` matches every count the brief gives: Settings.svelte 221, Item 308, Control 140, Contents 101, Header 91, List 92, BrowserControl 200, EditLink 24, Gear 43, groups 157, rows 262, write 160, config-files 56, config-key 339, list-edit 193, Config.svelte 189, files.ts 12, saved.ts 637.
- `config/catalogs` holds 8 files (`ls | wc -l`). `config/text` holds 54 `.yml` files and no other file (`find ... | wc -l` printed 54; `! -name '*.yml'` printed nothing).
- Committed `layout.yml` (`git show HEAD:...`):
  - rail at lines 9-21 with 12 buttons;
  - `nav_groups` `info` and `views` at 35 and 37;
  - `arrangements.info` at 92-93;
  - `arrangements.views` at 101-113.
  
  All confirmed. `catalogue.ts:159-160` "one past the ninth" and `HELP.md:70` `y1-y6` are confirmed.
- `LAYOUT_VERSION = 5` at `model.ts:131` and the empty-pane comment at `:6-10` are confirmed. `ls docs/adr` fails, `grep -n '^adr' .agents/plan.yaml` prints nothing, `.agents/plan.yaml:15` is `libraries: check`, and `printenv CLAUDE_CODE_EFFORT_LEVEL` exits 1.
- `bodies.ts:121` and `:273`, `config-write.ts:59-64`, `writes.svelte.ts:374-376`, and `undo.ts:143` and `:297-300` are confirmed.
- Drifted line numbers (`grep -n` and `sed -n`):
  - `Item.svelte:165`: the local branch is at `:159-160`.
  - `groups.ts:105-115`: the local group is at `:107-117`.
  - `config-key.ts:150-155`: `single` is at `:160-165`.
  - `config-key.ts:192-201`: `kept` is at `:197-210`.
  - `config-key.ts:213-245`: `refusedBy` is at `:217-256`.
  - `saved.ts:464-503`: `parseLayout` is at `:469-501`.
- `kept` "made to compare the whole path": it already sets the value at the full dotted path and compares at every depth (`config-key.ts:197-210`). The item's wording describes a change that is not needed.
- The open-the-file action already exists. `settings/List.svelte:35-43` draws a ToolButton with `openView('source', sourceTabState(ENGINE_ROOT, file))` on every group whose `file !== null`, and the `local.yml` group sets `file: LOCAL_NAME` (`groups.ts:110`). The brief presents item 5's action as new and does not say so. The only difference is the line argument `1`.
- Folder cap (`git ls-files <dir> | cut -d/ -f1 | sort -u | wc -l`; `utils/folder-check.sh` allows at most ten items):
  - `views/system/workbench/settings/` already holds 10 tracked items: the 8 partials plus `said.ts` and `writer.svelte.ts`, which the brief does not list. Item 3's "new partials under `views/system/workbench/settings/`" cannot fit.
  - `tests/state/system` holds 10 and `tests/state/workbench/layout` holds 10, which is where the editors' state tests and the migration's tests would naturally go.
- D18 is in flight. Its worktree is `.agents/worktrees/D18` at 57986be1, built and round-reviewed, and its landing waits only on Z275 (state file line 779). There, `grep -rn "group: 'info'" src` lists `views/system/machine/processes/Processes.svelte:8`; `config/layout.yml:93` is `[status, findings, audit, history, config, gallery, processes]`; `HELP.md:70` is `y1-y7`. Consequences:
  - If D18 lands before S4, the merged group holds ten views and `y1`-`y9` reach nine of them. Item 7's "nine, every one reachable by `y1` to `y9`" and C20 are then false.
  - If S4 lands first, D18's landing re-adds a tenth view to a group and an arrangement that no longer exist.
  - D18 also adds `processes.patterns`, so C1's "7 lists" becomes 8.
  
  The brief mentions D18 only for `processes.patterns`.
- S4's own landing touches `config/layout.yml` lines 9-37, where Axel's uncommitted change sits. The state file says a landing is refused while the step's paths carry that change (Z275). The brief does not say S4's landing waits on Z275.

Findings:
1. The open action is already on the tree, `local.yml` included (`List.svelte:35-43`), and the brief does not say so.
2. `settings/` is at the ten-item cap (10, not 8 partials). So are `tests/state/system` and `tests/state/workbench/layout`. The brief names no subfolder for the new partials and tests.
3. D18's tenth System view (`processes`, `group: 'info'`, order 6, `y7`) contradicts "nine, every one reachable" and C20 once D18 lands. Where Processes goes in the merged page, and which view loses its chord, is a user-visible placement. Either the brief decides it or it goes to Axel.
4. S4's landing is blocked by Z275 in the same way as D18's. The brief does not say so.
5. Six line references drifted (listed above), and the `kept` "made to compare the whole path" premise is already true.

## 4. Cases and checks

- C1 to C10: consistent with the rules file. C5 requires a comment inside `deck.order`, and the shipped block has none (`sed` of `present.yml` from `    order:` shows 21 flow items and no comment). The case should say that the test writes the comment into the scratch copy.
- C11 and C16: Add, Move, Remove, Save and Reset are presses. The rules file ("What every package obeys": "a behaviour that needs a DOM (a press, a focus, an effect) is seen at the look ... an assertion over source text ... is reported as an audit") means they count only when stated over the editor's state functions.
- C12 to C15: consistent.
- C17: inconsistent with the rules file. `Settings.svelte` reads its width through `bind:clientWidth={width}` (`:178`) and `narrow = width > 0 && width < NARROW` (`:118`). Under `svelte/server` the width is 0, so the toggle is never drawn in the unit suite. Pressing, scrolling and Escape all need a DOM. Restate C17 as a state test (the toggle's shown state and the hide-after-press rule as pure functions) plus a line for the look.
- C18 to C24: consistent.
- C19: "the 8 catalog files" read off the real folder lets a fixed list pass, which contradicts item 5's "never a fixed list". It needs a fixture listing that differs from the tree.
- The rules file says "Every asynchronous path is exercised in flight, after close, and superseded by a later one". Item 3 adds one: "while the write is out the editor shows the draft, and the watcher's push of the file ends it". No case covers the tab closed while the write is out, a second Save before the push, or a push carrying a value other than the one sent.
- The rules file says "Every id or key a package introduces is exercised empty, duplicated, and colliding with a configured or reserved key". No case covers:
  - the draft's instance-state key colliding with `typed.ts`'s key for the same file and key;
  - a key/value or map-keyed record key of `__proto__`, `constructor` or `toString` inside the value (C9 covers only the key path).

Findings:
1. C17 cannot run in the unit suite as written: width is `bind:clientWidth`, and presses, scroll and Escape need a DOM.
2. C11 and C16 are audits unless stated over state functions.
3. No case covers the editor's asynchronous path (in flight, after close, superseded).
4. No case covers the draft key collision or a reserved map key inside the value.
5. C19's fixed count lets a fixed list pass.

## 5. The question

Could each pass without the goal being reached?
- C1: yes. Item 1 already makes an equal value write nothing, and a renderer that returns the source when the value deep-equals passes C1 for all 28 values while losing every kept byte on a real edit. The measurement in "Judgments" shows the node-render route fails 13 of 28 values once the short-circuit is removed. C1 should change one scalar of one item in each of the 28 values and assert that only that item's lines differ.
- C2, C3, C5, C6, C7, C8, C9: no. Each asserts the bytes or the refusal directly.
- C4: yes. It asserts only that `bash`'s list and `20` are written. `languages` is column-aligned (`bash:          [.sh, .bash, .zsh, .slurm]`), and a render that collapses the other 31 entries' padding passes. Add "every other line byte-identical".
- C10: yes for the base rule. Two writes of different keys land even with no base check. Add two writes of the same key with the same `base`: the second is refused with the changed-since-read sentence.
- C11 to C14, C16: no, once stated over state (section 4).
- C15: yes. A draft that holds raw values and never goes through decision 2's flow text passes deep equality. The round trip should go through each field's shown text.
- C17: an audit as written (section 4).
- C18: its first half passes on the unchanged tree (premise finding 1). It is a test of preserved behaviour and should be called that.
- C19: yes, with a fixed list (section 4).
- C20 to C24: no for what they state. Item 8 has no case for page leaves and floats (section 6), so a migration that leaves a dangling page leaf passes.
- Verify 2 (`grep ... "views/system/config\|group: 'info'"` prints nothing): no. C20 covers a `config` registration moved elsewhere.
- Verify 3 (`grep -c "page: info"` prints 0): yes, it passes with `nav_groups.info` and `arrangements.info` left in place. Add `grep -n "^  info:" tools/oculus/config/layout.yml` printing nothing.
- Item 2: yes, through C1 (above).
- Item 4: yes as a unit case (C17). Only the look can show it.
- Item 5: partly built already (premise finding 1).

Findings:
1. C1 can pass through an equality short-circuit.
2. C4 does not guard the other entries' column padding.
3. C10 does not exercise `base` between two writes of one key.
4. C15 can bypass the flow text.
5. C19 can pass with a fixed list.
6. Verify 3 does not catch `nav_groups.info` or `arrangements.info` left in place.

## 6. Implied inputs

None of the following is under "Cases".

Writes:
- **A multi-line flow collection.** `file_index.ext` (`behavior.yml:68-69`), and the `- {` items spanning lines in `deck.ideas.items`, `deck.framing` cards and `deck.summaries` rows. Expected: editing one item leaves the others' line breaks as they are.
- **Column-aligned flow maps.** `themes`, `docs`, `scan`, `collections`, `roots`, `languages`. Expected: the untouched records keep their padding.
- **Mixed flow padding inside one value.** `{ match: [exploring], label: exploring }` in `nav_live`, `floats`, `tab_rollup`. Expected: kept.
- **An empty list filled, and a list emptied.** `audit_ignore: []` filled; any list emptied to `[]`. Expected: the style of the first added item, and `[]` written for an emptied list.
- **A family emptied.** Expected: refused if a reader refuses it, otherwise written as `{}` or `[]`.
- **A list option or family whose key the file does not hold, or holds as null.** Expected: refused as not in the file. The row is `missing` and draws no editor (`rows.ts:185-195`, `Item.svelte:54`), so it can never be created from Settings. State this.
- **A string value that needs quoting.** Values with `: `, ` #`, a leading `#`, `- `, `[`, `{`, `*`, `&`, `!`, or the bare words `yes`, `no`, `null`, `~`, `"20"`. Expected: written quoted, reading back as the string.
- **A colour typed bare as `#123456` in decision 2's flow text field.** `yaml.parse` reads it as null. This affects the `color` fields of `tab_rollup`, `deck.meta.legend`, `deck.themes` and `deck.ideas.items`. Expected: decide whether it is named as an error or kept as text.
- **A key/value or map key that needs quoting.** A space, a colon, a dot (`status.line` exists in `read_limits`), `yes`, `1`, the empty string, `__proto__`. Expected: written so it reads back as the same key, or refused for `__proto__`.
- **A CRLF file.** None is shipped: zero CR bytes in the five tracked files and the committed `layout.yml`. Expected: the new lines use CRLF (`list-edit.ts` `newlineOf`).
- **A comment on the key's own line, and a comment with a blank line after the block that belongs to the next key.** The `# Section slides...` line after `deck.order` in `present.yml` is one. Expected: both stay where they are.
- **A list item in the file that is not a string, or a row flagged `mismatch`.** Expected: the editor's behaviour is unstated.
- **A record field the file holds that the catalog does not name.** Item 3 keeps it, draws it read-only and sends it back; item 1 and C8 refuse a record with such a field. Saving that family is then impossible. Expected: one rule, for example that the write accepts a field the file already holds at that record.
- **`tab_rollup`.** It is a map of lists of `{ label, keys, color }`. Item 1's shape rule ("each record a map whose keys are the catalog's `fields`") does not describe it. Expected: its shape rule stated.
- **Undo after a later edit of the same key.** Expected: refused (`base` is `after`), with the sentence.
- **Undo when the file no longer parses.** Expected: refused, unwritable.

Saved layout:
- **A page leaf (`{ kind: 'page', page }`, `model.ts:57`) on another page naming the `info` page.** Expected: pointed at the `views` page, or an empty pane, unless that would make the views page show itself.
- **A float holding a `config` tab or a former System view.** Expected: "anywhere" should say that floats are included.
- **The one-workbench envelope (`WORKBENCH_VERSION`, `saved.ts:471-474`) holding a `config` tab.** Expected: the tab becomes `settings`.
- **A pane whose active tab is the removed `config` tab.** Expected: the active tab moves to its neighbour.
- **An `info` page whose every tab is already on the `views` page.** Expected: the page is removed and nothing is appended.
- **A `config` tab carrying instance state.** Expected: the state is dropped (the brief says "no state").

View:
- **The merged button's rail badge.** It is the first counting view in tab order, which now starts with settings, account-setup, catalogue and pages. Expected: say which badge the button shows.
- **The merged group's glyph and the rail glyph.** `nav_groups.views` keeps `glyph: settings` and the rail keeps `sliders`, which is the Settings view's own glyph. The `info` glyph goes. Expected: a user-visible choice, to be stated.
- **The Texts listing while loading, while failed, and with a non-`.yml` file.** Expected: the group says so.

Findings: every item above is missing from "Cases". The ones a defect would most likely hide behind:
- the multi-line and aligned flow values;
- the bare `#` colour;
- the unnamed-field contradiction;
- `tab_rollup`'s shape rule;
- page leaves and floats in the migration.

## 7. ADRs

- `ls docs/adr` fails: "No such file or directory". `ls tools/oculus/docs/adr` fails too. `find . -type d -name adr` outside `node_modules` finds nothing, and `grep -n '^adr' .agents/plan.yaml` prints nothing. There is no record, so none touches the step.

Findings: none.

## Judgments the brief check was asked for

**The block-rewrite requirement and `yaml` 2.9.0** (`package.json:85` `"yaml": "^2.9.0"`, installed 2.9.0).

The requirement can be met with yaml 2.9.0, but not by the mechanism item 2 names.

Item 2 renders the new lines "from the parsed document's own node for the key". I measured that with a probe in the scratchpad, `probe2.mjs`. It renders each pair alone with the file's indent, `lineWidth: 0`, and every combination of `indentSeq` and `flowCollectionPadding`, and compares with the source bytes:
- 15 of 28 values come back identical.
- 13 differ: `themes`, `file_index.ext`, `floats`, `docs`, `tab_rollup`, `nav_live`, `deck.framing`, `deck.summaries`, `deck.ideas.items`, `scan`, `collections`, `roots`, `languages`.
- Example: `"  bash:          [.sh, .bash, .zsh, .slurm]" => "  bash: [ .sh, .bash, .zsh, .slurm ]"`.

There are three causes:
- column padding inside flow maps;
- flow collections written over several lines;
- one value mixing `{ ... }` with `[a, b]`, where `flowCollectionPadding` sets both at once.

`list-edit.ts:3-6` already records this: a dump loses "every quote and line break the author chose". So C1 and C6 cannot pass on that route without an equality short-circuit.

The route that works uses yaml's CST: `new Parser().parse(text)`, then `new Composer({ keepSourceTokens: true })`, then `CST.setScalarValue(node.srcToken, value)` and `CST.stringify` per token. In `probe4.mjs` this round-trips `present.yml` byte for byte (`unchanged roundtrip true`), and changing one `deck.framing` card title changed only line 75 (`changed lines: [ 75 ]`). Added and removed items need the kept items' source bytes spliced by their `range` or `srcToken`, with only added items rendered by `stringify`.

The brief should name that mechanism:
- kept items reuse their source bytes verbatim;
- changed scalars go through `CST.setScalarValue`;
- only added items are rendered, by `stringify`.

**Decisions 1 to 5 against the rulings:**
- **Decision 1 (draft plus Save):** consistent with Z190 (one write of the whole value).
- **Decision 4 (Move buttons, no drag):** no ruling forbids it.
- **Decisions 1, 2 and 4 against VS Code:** they depart from the list and object setting widgets of VS Code's Settings editor (Add Item, per-item Edit with OK and Cancel). Z75 (a) adopted VS Code's Settings editor as the standard for this view. The rules file ("The principles", VS Code clause) requires such a departure to be judged against VS Code's own behaviour. The brief does not name the departure as one. I took VS Code's widget behaviour from knowledge and did not check it against VS Code's source (no URL fetched).
- **Decision 3 (label "System", chord `y`, key `views`, Settings first):** within what Z169 left to the brief. The button's place on the rail (last, after Help) depends on Z275, which is open.
- **Decision 5 (fold `info` into `views`, `config` becomes `settings`):** consistent with Z169 ("a saved `info` page is carried over by a layout migration").
- **Z168 and Z170 (`local.yml` link-only, no card of its text):** items 1 and 5 hold to them.
- **D18:** no decision contradicts a ruling, but decision 3's "nine views" is contradicted by D18's tenth view (section 3, finding 3).

## Declined to judge

- Whether VS Code's narrow Settings editor draws a `list-tree` toggle for the table of contents, as item 4 says. It cannot be checked without fetching VS Code's source, which this check may not do.
- Whether the merged page should sit last or fourth on the rail. That is Axel's call under Z275.
- Where Processes should sit in the merged page once D18 lands. That is a user-visible placement for the brief's author or Axel.

Agent usage: claude-opus-5-5, about 220,000 tokens (from the context counter), about 62 tool uses, minutes not measured.

## Closed

Left to the orchestrator: the session's change to the brief for each finding above.

Probe scripts: `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/probe2.mjs` and `probe4.mjs`, run against the committed `layout.yml` copy `layout.head.yml` in the same folder.

Usage (completion notice): claude-opus-5-5, 234939 tokens, 68 tool uses, 710 s.

## Closed (the orchestrator, in `agents/briefs/S4.md`)

- 1.1 to 1.5: the premises list `app.yml:12`, `history.yml`, the five comments outside the paths and the hits inside them with their tests; item 6 moves `config.local_tag` and the 15 `config.desc_*` keys to `workbench.yml` as `settings.*`, moves `descriptionKey` to `config-files.ts`, adds `history.kind_config_value` and draws each file's description on its group heading (item 5); the paths name every file.
- 3.1: item 5 says the open action is on the tree and stays; C18 is a preserved behaviour.
- 3.2: the editors go in a new `views/system/workbench/editors/`, their state tests in `tests/state/system/settings/`, the migration in `saved/migrate.ts` with its tests in `layout-saved.test.ts`.
- 3.3: Z282 (automode): `processes` last with no chord, merged by whichever of D18 and S4 lands second; item 7 says so.
- 3.4: item 7 says S4's landing waits on Z275.
- 3.5: the six line numbers corrected; item 1's `kept` reads "as it stands".
- 4.1, 4.2: C11, C16 and C17 restated over state functions, the presses and the drawn toggle at the look.
- 4.3: item 3 states the write in flight, after close and superseded; C34.
- 4.4: item 3 gives the draft key its own prefix (C35); item 1 refuses a reserved key inside the value (C29).
- 4.5, 5.5: C19 runs over a fixture listing that differs from the tree.
- 5.1: item 2 tests the render apart from the equal-value rule; C1 changes one scalar per value.
- 5.2: C4 requires every other line of `languages` byte-identical.
- 5.3: C10 adds two writes of one key with one `base`.
- 5.4: C15 reads back through each field's shown text.
- 5.6: Verify 3 adds the `^  info:` grep.
- 6 (writes): item 1 states empty lists and families, a missing key, quoting of strings and keys, the line ending; item 3 states the bare colour (decision 7), a non-string item and a `mismatch` row; item 1 and decision 8 settle the unnamed-field rule; item 1 states `tab_rollup`'s shape; C26 to C33 and C36.
- 6 (saved layout): item 8 states page leaves, floats, the one-workbench envelope, the active tab and the `info` page with nothing to add; C25.
- 6 (view): item 7 states the badge rule and the report's before and after, and the glyphs (decision 6); item 5 states the Texts listing's loading, failure and non-`.yml` file.
- Judgment, the block rewrite: item 2 names the CST mechanism (`Parser`, `Composer` with `keepSourceTokens`, `CST.setScalarValue`, kept items spliced verbatim, only added items rendered).
- Judgment, VS Code: decision 9 names the departure from VS Code's list and object widgets and its reason.
