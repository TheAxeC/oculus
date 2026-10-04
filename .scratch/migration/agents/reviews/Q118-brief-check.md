# Step Q118 brief check (on main at 80d096a48)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/Q118.md`. A page this report cites is named with its section; a line of code or a grep hit keeps its `file:line`. Paths are under `/Users/axelfaes/workspace/research-hub/tools/oculus` unless they start with `.scratch/`. Nothing was written; no skill, agent, server or browser was used; `config/local.yml` was not opened or grepped.

Main's head is `80d096a48` ("Rule on D11's brief check and Q118's brief"), one commit after the brief's stated base `c204afbbc`. `git diff --stat c204afbbc 80d096a48` lists only seven files under `.scratch/migration/` (reviews, choices.md, orchestrator-history.md, orchestrator-state.md, plan.md, queue.md), so the code tree the brief describes is unchanged.

## 1. Names

- `HELP.md:79` "Enter | expand the card under the cursor" (item 7 rewrites it). `sed -n 12p config/text/app.yml | tr ';' '\n' | grep -n -i "enter\|cursor"` printed `41:Enter | expand the card under the cursor`. This is the `?` key sheet, which repeats the HELP row word for word. Items 4 to 7 make it false, since Enter will open a finding's file and a lane card's project. It is outside the write list. It also sits on one YAML line, `config/text/app.yml:12` (1684 bytes, `awk 'NR==12' config/text/app.yml | wc -c`), and H3 in flight writes that same line: `grep -n "app.yml" .scratch/migration/agents/briefs/H3.md` printed `154:- tools/oculus/config/text/app.yml line 12 (the h1-h5 row only)`.
- `dataCardToggle` / `data-card-toggle`: `grep -rn "dataCardToggle\|data-card-toggle" src/lib` printed `ToolButton.svelte:107`, `:152`, `:197`, `key-dom.ts:36` and `CardActions.svelte:160`.
  - `ToolButton.svelte:106` reads "Marks the project-card control the keyboard cursor activates when its title is plain." Ruling Z460 has Q118 rewrite it. The brief does the opposite: Decision 4, the "Size, docs and tests" premise at brief line 72 and the write list keep the file unchanged, and the report section lists the line only "with Decision 4". The brief contradicts the ruling.
  - `key-dom.ts:32` reads "Activate the selected card's title, or its marked toggle when the title is plain." On an Audit row and on a lane card, the marked control becomes an open link, which is not a toggle. The brief's report asks for this line as still true or rewritten (brief line 208), but `key-dom.ts` is outside the write list and brief line 180 says "nothing there is changed". The change makes the line partly false, and the builder cannot fix it.
  - `CardActions.svelte:160` (`dataCardToggle={action.toggle === true}`) stays true.
- `AuditFinding` (`data/model/index.ts:258-264`): `grep -rn "AuditFinding\b" src tests | grep -v "^src/lib/server/content/audit/"` finds only readers of the type (`audit.svelte.ts:7-48`, `state/system/audit.ts:9-40`, `Audit.svelte:48,98,114`, `server/content/audit.ts:22,41`) and no literal that builds one outside the 32 `add` sites. The type check catches every site.
  - The type's own doc comment `index.ts:253-257` says "`where` the file, field or entry it is about". It sits outside the write range "lines 258-264". With `file` added, that comment describes `where` as the file and does not name `file`. D42 touches only the export block (`grep -n "model-sessions" src/lib/data/model/index.ts` printed `477`, `478`, `511`), so widening the range to 253-264 merges just as simply.
- The `audit` catalog group: `grep -rn "audit" config/text --exclude=local.yml | grep -v "^config/text/views/system/audit.yml"` printed only `history.yml:50` and `workbench.yml:13`, and neither is affected.
- `DESIGN.md:320` (the `audit` channel open to every app whole) stays true with a hub-relative `file` added. `grep -n -i "card cursor\|Enter\b" README.md` printed nothing.

Findings:
- `config/text/app.yml:12`, the Enter row of the key sheet, is made false and is not in the write list. That line is H3's line, so the two cannot merge as separate hunks.
- `ToolButton.svelte:106` is left unwritten, against Z460.
- `key-dom.ts:32` is made partly false and is outside the write list.
- `index.ts:253-257` sits outside the write range although the change makes its field list incomplete.

## 2. The step line

- "the Audit view reads its instance's card cursor (`cardCursor`) as the Inbox does": item 1.
- "marks the row it names with `data-cursor`": item 1.
- "and the list's cursor style": item 2.
- "so the arrow keys that step through its `li[data-card]` rows show which finding they are on": items 1 and 2, with item 3 for two findings with one signature.
- "and Enter acts on that row as on a card (ruling Z446)": items 4 and 5, under Z458 (a).
- Ruling Z459 (lane card Enter): item 6.
- Ruling Z460 (rewrite `ToolButton.svelte:106` in Q118, the file joins the write list): no requirement. Decision 4 says the reverse.
- Ruling Z461 (reload is its own step, Q121): case 11 still says "outside this step" and does not name Q121.

Findings:
- Z460 has no requirement in "What to build", no write-list line and no verify line, and Decision 4 contradicts it.
- Z461 is not reflected in case 11.
- The O1 and O2 sections still read as open items ("The orchestrator closes them before dispatch"). Z458 and Z459 (`plan.md:1176-1177`) closed both as (a), and the brief does not say so.

## 3. Premises

All commands were run from `tools/oculus` unless noted.

- Base `c204afbbc`: main is at `80d096a48` (`git log --oneline -1`), and the code tree is unchanged between them (`git diff --stat`, see the top). The step line `plan.md:256` matches. Z446 is now `plan.md:1163` (`grep -n "^- Z446 (" plan.md`); it was 1162 at `c204afbbc` (`git show c204afbbc:.../plan.md | grep -n`).
- `grep -c cardCursor src/lib/views/system/audit/Audit.svelte` printed `0`. `grep -c -e 'class="title"' -e dataCardToggle -e data-card-toggle .../Audit.svelte` printed `0`. Both match.
- `awk 'END{print NR}'` printed `300` for `Audit.svelte`, `539` for `ToolButton.svelte` and `231` for `LaneCard.svelte`. Audit and ToolButton match the brief; the brief gives no count for LaneCard.
- Audit line refs, by `cat -n`: `:115` `<li data-card={finding.signature}>`, `:114-138` the row snippet, `:124-126` `.where`, `:127-136` `.act`, `:159` and `:177` the each keys, `:61-63` and `:89-95` the ui-store state, `:239-265` the row style, `:279-284` `.act`, `:175` `{#if showMuted}`. All match.
- `instance.ts` (by `sed -n 55,85p`): `cardCursor` at `:63-66` (the function at 64), `withCardCursor` at `:68-75`, `reconcileCardCursor` at `:77-81`. All match.
- `workbench-keys.svelte.ts` (by `sed -n 236,445p`): `cards` `:277-283` (keeps `offsetParent !== null`), `selectCard` `:285-291`, `moveCursor` `:293-309` (`findIndex`), `cursorIn` and `writeCursor` `:330-351`, `reconcilePane` `:358-367`, `observePane` `:370-389` (`childList`, `subtree`, `attributeFilter: ['data-card']`), `rememberPane` `:407-416` (`writeCursor(lastFocusedPane ?? pane, null)`), `showTab` `:241-245` (`clearCursor()`), `activate` dispatch `:175-176`, `typingIn` `:434-442`. All match.
- `keys.ts`: `:63-68` `horizontalCursor`, `:71-87` `rowCursor`, `:163-165` Escape, `:190-195` J/K, `:196-207` the arrows, `:208-210` Enter only with `cursorActive`. All match.
- `key-dom.ts:32-40` `activateCursor` clicks `'.title button, [data-card-toggle]'`. Matches. `Workbench.svelte:202-206` (`syncCards`) and `:281-285` (`<svelte:window onkeydown=...>`) match.
- `grep -rln cardMoveRequested src/lib/views` printed only `Collection.svelte`. Matches.
- `Inbox.svelte:66-67` and `:139` match. `grep -rn "cardCursor(instance.state)" src/lib/views | wc -l` printed `16`. Matches.
- `Card.svelte:70` `data-cursor={cursor || undefined}`, `:121-126` the reveal (rule at 124), `:148-151` the global outline. All match.
- `LaneCard.svelte:72-73` `data-card` and `data-cursor`, `:107-109` the name ToolButton, `:144-149` the reveal, `:8-12` the head comment. All match.
- `TreeItem.svelte:256-260` the selection fill and `:262-267` the focus outline match. `grep -c "data-card" .../Findings.svelte` printed `0`. Matches.
- `source-file.ts:16-28` matches. `Person.svelte:37` and `:39` are the imports and `:124-127` is `openFile`. `fs.ts:35` re-exports `place.ts`, and `place.ts:14` is `export const HUB_ROOT = 'hub';`. `landing.ts:1-5` matches.
- `rules.ts`: `:143-152` `signatureOf`, `:172` `Raised`, `:175-190` `collector`, `:202-208` `isFolder`. All match. `audit.ts:12-15` the head comment on signatures matches.
- `grep -c "add({"` printed `projects.ts:26` and `publications.ts:6`, and `grep -n "add({"` gave exactly the 32 line numbers the brief lists. `sed -n 120,495p projects.ts` confirms item 4's table site by site: 26 sites mapped, none missing.
- `model-entities.ts:513-515` (`folder`, `file`), `model-collections.ts:54-55`, `projects.ts:175-178` `relative`, `paths.ts:28-32` `below`: all match. `paths.ts:27` is the doc comment, and `below` uses `resolve`, not realpath.
- `config/sources.yml:79` `publications_file: theaxec.github.io/_data/publications.yml` matches. In `publications.ts`, `:158` returns on the empty name, `:159` joins and `:160` skips when absent. The brief says `:157-159`.
- `payloads.ts:104-106` `z.object({ findings: listShape, muted: listShape })` matches.
- `grep -rln -e Audit.svelte -e workbench-keys -e key-dom -e content/audit -e system/audit tests` printed the three files named. `boundaries.test.ts:292`, `config-folder.test.ts:271` and `keys.test.ts:109` match. `grep -n -i audit .scratch/migration/agents/guarded.md` shows G8's `audit-mute.test.ts` only. Matches.
- `HELP.md:79` and `:147` and `DESIGN.md:390` read as the brief quotes them.
- `ls docs/adr ../../docs/adr` printed "No such file or directory" for both. `grep -n adr .agents/plan.yaml` printed nothing. `libraries: check` is at `.agents/plan.yaml:15`. Matches.
- `npm view @zag-js/listbox version license time.modified --json` printed `1.44.0`, `MIT`, `2026-09-14T01:25:11.362Z`. `package.json:60-61` are the zag lines and `:62` is `bits-ui 2.19.3`. All match.
- Shared paths, from the write lists of D37, S5, H3 and D42 (`awk` over each brief's "Paths this step writes"):
  - `HELP.md`: H3 writes lines 19 and 74, S5 154/157/261/274, D42 44/120/211 (D42.md:83), D37 163/181/183 (D37.md:47). None touch 79 or 147.
  - `DESIGN.md`: S5 writes 85 and 408. D42 writes 128. D37's grep (`grep -n "Replace Preview\|latexmk\|task terminal\|cut at\|landingFor" DESIGN.md`) hits 128, 131, 153, 372, 377, 378, 380, 397, 404 and 409. None is 390.
  - `data/model/index.ts`: D42 only. `landing.ts` is in D37's write list, but Q118 only cites it.

Findings:
- The base is stale: the brief says `c204afbbc`, main is `80d096a48`. The code is identical.
- Z446 is at `plan.md:1163`, not `:1162`.
- The skip when the website file is absent is at `publications.ts:160`, not inside `:157-159`.

## 4. Cases and checks

- Cases 1-10, 14-19, 22, 24, 25 and 27: consistent with spec.md ("What every package obeys": a DOM behaviour is seen at the look; no test without an entry of `agents/guarded.md`).
- Case 11: consistent with spec.md, but stale against Z461. It should name Q121 as the step that owns the reload loss.
- Case 13: its first-run expectation, "On the unchanged tree both rows carry one id, both are marked", is wrong. The unchanged view never reads the cursor (`grep -c cardCursor .../Audit.svelte` printed `0`), so nothing is marked. The rest of the case holds: `findIndex` stops Down at the second row.
- Case 20: consistent. Opening a source tab moves no DOM focus (`grep -rn "\.focus(" src/lib/views/sources/source src/lib/ui/controls/editor` hits only `commands.ts:22,37` and `DiffEditor.svelte:382`), so `rememberPane` does not clear the cursor.
- Case 21: consistent only when no button holds the focus. See section 6.
- Case 23: consistent. With a held cursor, `activateCursor` returns true and `perform` calls `preventDefault` (`workbench-keys.svelte.ts:134`).
- Case 26: consistent. `theaxec.github.io` is a real folder inside the hub (`ls -la .../research-hub | grep theaxec` shows a directory, not a link), so `resolveRootPath` (`server/files/files.ts:102-127`) serves it.
- Case 28: inconsistent with the code for a ghost. `Lanes.svelte:148-157` `openMissing` opens a ghost's `README.md` through `openView('document', ...)` when it has one, and nothing otherwise, so "the project opens" is wrong for a ghost.
- The look line (no mute pressed, source tab closed after) is consistent with the state file's standing demand "Looks and the machine".

Findings:
- Case 11 should name Q121.
- Case 13's first-run claim "both are marked" is false on the unchanged tree.
- Case 28's ghost expectation should read "its README opens, or nothing when it has none, as a press on its name does".

## 5. The question

The question asked of each case and check is "could this pass without the goal being reached?", the goal being "the Audit's arrow keys show which finding they are on, and Enter acts on that row".

- Cases 1-10, 12, 14-19: no. Each is seen at the look on TEST, where an unmarked row fails it.
- Case 11: not about this step's goal. It records the shell's behaviour, now Q121's.
- Case 13: no. The pure function is run on `[a, b, a, a]`, `[]` and `[a]`, and the look shows one marked row at a time.
- Cases 20, 21, 24 and 28: no. They are seen at the look.
- Cases 22 and 23: no. They are read in `keys.ts:208` and `workbench-keys.svelte.ts:134`.
- Case 25: no. It is read in `signatureOf` and `collector`.
- Case 26: yes, in part. The look samples three kinds of site (manifest, marker, website), and the type check (verify 6) passes with `file: ''` at every site. The other 23 site values rest on reading item 4's table, which the reviewer must do site by site.
- Case 27: no. It is read in the helper.
- The step line's check, the look: no.
- The checks of the items:
  - Item 1 (verify 5 grep plus the look): no.
  - Item 2 (the look): no.
  - Item 3 (verify 7): no.
  - Item 4 (verify 6 plus case 26): as case 26 above.
  - Item 5 (verify 5 plus the look): no.
  - Item 6 (case 28): no.
  - Item 7 (reading): no.

Findings: case 26 and verify 6 could pass with wrong or empty `file` values at the sites the look does not sample. The brief should require the report to quote each site's `file` argument, by `grep -n "file:" src/lib/server/content/audit/*.ts` against item 4's table.

## 6. Implied inputs

A code step. Inputs the step implies that "Cases" does not list:
- Enter with the cursor on a row whose finding has no file, while the Tab focus is on a mute control. `activateCursor` returns false and the key is not prevented (`workbench-keys.svelte.ts:134`), so the browser presses the focused mute control and writes `config/behavior.yml`. Case 21's "nothing happens" holds only with no button focused. The case should state this result, and the look must not run it.
- Enter on a muted row that has a file, with the muted section open: the file opens, as on an open row. Missing.
- Enter twice on the same row: the source tab already open is activated, with no second tab (`open/opening.ts:4`, "A view already open is activated where it is"). Missing.
- A file deleted between the scan and the press: the source tab opens on a missing file and shows its missing state, until the next rebuild clears `file`. Missing.
- A path inside the hub that is a symlink leading out of it. The helper's `below` uses `resolve` (`paths.ts:28-32`), so it answers the path, but `resolveRootPath` uses realpath and refuses it as `outside` (`files.ts:109-126`). Expected: the helper answers the empty text, by testing the realpath, or the case states the tab's refusal. Missing.
- A path equal to the hub itself: `below` refuses it, so `file` is ''. Missing, and covered by the helper as briefed.
- The card id empty or colliding (spec.md "What every package obeys": "Every id or key a step introduces is checked empty, duplicated, and colliding"). A signature is never empty (`SIGNATURE = /^[0-9a-f]{12}$/`, `rules.ts:125`), and `:` is not a hex character, so `<signature>:<n>` cannot equal another signature. The brief does not state either case.

Findings: the seven inputs above are missing from "Cases". The first is the one that matters, since it writes Axel's `config/behavior.yml`.

## 7. ADRs

- No record: `ls docs/adr ../../docs/adr` printed "No such file or directory" for both, and the configuration has no `adr` key (`grep -n adr .agents/plan.yaml` printed nothing).

Findings: none.

## 8. Dictated text

- `const cursor = $derived(cardCursor(instance.state))` (`grep -n 'cardCursor(instance.state))' agents/briefs/Q118.md`, line 79): holds. It is the Inbox's line, `Inbox.svelte:67`.
- `data-cursor={... || undefined}` (line 79): holds.
- `outline: 1px solid var(--accent); outline-offset: -1px` with `--row-reveal: 1` (`grep -n "outline: 1px solid" agents/briefs/Q118.md`, line 80): holds.
- The card id form `<signature>:<n>` (line 81): holds.
- Item 3's doc comment, "two findings of one signature are two rows, and the cursor and the keyboard name a row" (line 81): holds (plain, ASCII, no history words).
- Item 4's doc comment, "the hub-relative path of the file the finding is about, or the empty text when there is none; the signature does not read it" (line 82): holds.
- The catalog line `audit.open_place_tip`, "Open {0}" (`grep -n "open_place_tip" agents/briefs/Q118.md`, lines 92, 162, 201): holds as prose, but it duplicates an existing line.
  - `grep -rn "open_source_tip" config/text src --exclude=local.yml` prints `config/text/app.yml:72` `open_source_tip: 'Open {0} in a source tab'`. Two views already read it: `SourceButton.svelte:22` and `views/system/workbench/settings/List.svelte:48,73`.
  - spec.md "The principles every package is judged on" says "a parser, a fold or a rule exists once and is reused ... reuse what exists". Every other source-tab tooltip in the tree says "in a source tab" (`person.yml:33`, `workbench.yml:124`).
- `HELP.md:79`, "Enter presses the title of the card under the cursor, or its marked open control when the title is plain, and on an Audit row opens the finding's file" (`grep -n 'HELP.md:79' agents/briefs/Q118.md`, line 94): breaks spec.md "The working rules", "Verify before asserting". On a project card the marked control is the expand and collapse toggle (`ProjectCard.svelte:172-180`, `toggle: true`, glyph `collapse_glyph`/`expand_glyph`), not an open control. The line also does not name the lane card's name.
- `HELP.md:147`, "the arrow keys mark a row, and Enter or a press on the place opens the file the finding is in" (line 94): holds.
- The `DESIGN.md:390`, `LaneCard` head comment, `audit.ts` head comment and row-style comment requirements are not dictated: they say what to say, and the builder words them.

Findings:
- The HELP.md:79 line calls a project card's expand toggle an "open control" and leaves out the lane card.
- The new key `audit.open_place_tip` duplicates `views.open_source_tip`. Reusing that key, or wording the new one "Open {0} in a source tab", is the change.

## Rule clash for the session (from section 2)

Z460 has Q118 change `ToolButton.svelte` "as a one-line change that keeps the file at its line count" (`choices.md:153`). spec.md, "What every package obeys", says "A file the step changes that would pass 880 or 520 is split by concern in the step". `ToolButton.svelte` is 539 lines (`awk 'END{print NR}'`) and stays 539. spec.md also says "Nothing in a brief overrides anything here". The brief's own Decision 4 reads the rule the same way. So the brief cannot follow Z460 without either:
- (a) splitting `ToolButton.svelte` in Q118, which widens the write list to the shared primitive and its new files; or
- (b) a ruling that a change which keeps the line count does not trigger the split, which is a change to spec.md's rule.

This is for the session to close or raise. It cannot be settled by an edit to the brief alone.

## Declined to judge

- The brief's statements about VS Code (the Problems view opens a row on Enter; `list.focusOutline` is a 1px outline inset by 1px), because this check reads only the tree.
- Whether Z460's "keeps the file at its line count" was meant to exempt the size rule, because that is the orchestrator's ruling to state.
- Whether a `plain` ToolButton keeps `.where`'s wrapping through the Tooltip wrapper, because only the look settles it. `.tool.plain` sets `white-space: inherit` (`ToolButton.svelte:387`), and `word-break` inherits.

Agent usage: ordo-high on claude-opus-5-5 (aa99e18e2a4b762bd), 219,592 tokens, 90 tool uses, 9.6 min.

## Closed

- <left for the session>
