# Brief check of step O124

Read at oculus main 9fdbbb4ec (`git log --oneline -3`). No file changed. The brief is ASCII (`LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/briefs/O124.md | wc -l` prints 0).

Findings that need the brief changed before dispatch, most serious first:
- F1 (Check 1): user-visible text and comments that become false lie outside the write list.
- F2 (Check 4): the case-run line contradicts spec.md:65.
- F3 (Check 4): `git grep` is banned for a builder by spec.md:33, and it misses the two new untracked files.
- F4 (Check 4): the brief names no worktree, base copy or port.
- F5 (Check 6): a search breaks the index-keyed KeyChoice.
- F6 (Check 6): Reset's owner and its closed state are undecided.
- F7 (Check 6): the Status tint makes sample cards paint no fill.
- F8 (Check 6): chords shift, and no case covers it.
- F9 (Check 6): heading counts under a search are not said, and HELP:296 already rules them.

## 1. Names

Commands:
- `git grep -n -E "Audit (view|tab|page|row|section|finding)|Audit's|the Audit\b|an Audit\b|Gallery('s)? (view|tab|page|section)|the Gallery\b" -- src tests config docs README.md bin utils ':!config/local.yml' ':!docs/diagrams' ':!src/lib/views/system/audit' ':!src/lib/views/system/gallery'`
- `git grep -n -i "gallery" -- src config docs README.md tests utils ':!config/local.yml' ':!src/lib/views/system/gallery' ':!config/text/views/system/gallery.yml' ':!docs/diagrams'`
- `git grep -n -E "Findings view|findings item|Findings tab|the Findings\b" -- src config docs README.md ':!config/local.yml' ':!src/lib/views/system/audit'`
- `git grep -n "auditBadge\|auditCount\|findingsCount\|railBadges\.\|BadgeClient\|COUNTED" -- src tests docs README.md`
- `git grep -n -i -E "'audit'|\"audit\"|'gallery'|\"gallery\"|view: *audit|view: *gallery|..."`

**F1. Hits outside "Paths this step writes" that the change makes false.** spec.md:72 calls each one a defect of the change, and brief line 98 says the step writes nothing else. The list must be widened.

User-visible text:
- `config/text/server.yml:111`: "an item is added from the Audit view"
- `config/text/server.yml:346`: "the Audit view names the fault"
- `config/text/views/academic/present.yml:34`: "The Audit view says where."
- `config/text/views/boards/collection.yml:24`: "the Audit view names the fault"
- `config/options/behavior.yml:22`: "the Audit view's mute control" (a Settings help line)

Documents and config comments:
- `config/defaults/behavior.yml:25`: "the Audit view's mute control"
- `docs/templates.md:281`: "The conventions the Audit view holds this hub's projects to"
- `docs/HELP.md:52`: lists "Findings, Audit" among the rail counts. The file is in the list, but line 52 is outside the named lines 65, 248-254, 296, 345.

Comments that become false:
- `src/lib/shell/status/status-items.ts:29`: "The findings item counts the Findings view's list, the snapshot's findings and the config channel's"
- `src/lib/server/content/audit/scan.ts:10`: "It is not the Findings view's list and does not repeat it"
- `src/lib/server/content/audit/scan.ts:20`
- `src/lib/server/content/audit/scan.ts:46`: "The order the Audit view draws the sections in"
- `src/lib/server/content/audit/rules.ts:322`
- `src/lib/server/edit/writes/config/lists/audit-mute.ts:8`
- `src/lib/server/root/watch/portfolio/audited.ts:3`
- `src/lib/data/model/index.ts:365`
- `src/lib/data/model/index.ts:384`
- `src/lib/ui/display/text/CodeText.svelte:3`
- `src/lib/state/system/audit.svelte.ts:4-5,24`: "the view's badge", since the badge is now the sum

Hits outside the list that stay true:
- `README.md:46`
- `docs/HELP.md:148,571,589`
- `docs/data-map.md:231`
- `docs/apps.md:383,422` (the channel)
- `config/text/views/system/help.yml:7`
- `config/options/behavior.yml:9,21` ("Audit checks" section)
- `src/lib/ui/display/table/Table.svelte:25` ("Problems, Gallery"; the file is listed)
- `src/lib/ui/display/ticker/Ticker.svelte:4`
- `src/lib/state/shared/words/tones.ts:360`
- `src/lib/data/helpers/files/apps/apps.ts:96` and every `'audit'` channel hit
- `tests/checks/config/config-folder.test.ts:161` (a behavior key) and `:349,351` (the text files stay)
- every `Findings view` hit not named above; each says a file finding is listed there, which stays true

Hits inside the list needing more than the brief says:
- `config/text/statusbar.yml:68` `findings_tip_one`: item 3 names only `findings_tip`, and the singular says the same false thing.
- `src/lib/ui/controls/heads/GroupHead.svelte:8-9`: "A heading inside a group is SubHead.svelte". Nesting makes this false. `docs/HELP.md:296` has the same sentence ("A heading inside a group ... is a plain label that does not fold") and "Dismissed, Expired, the run log, Triaged and Muted start folded, and every other group starts open", which Gallery breaks. Item 7 names line 345 and not 296's content.
- `src/lib/views/system/history/History.svelte:2`: "History follows the audit". It falls under the wildcard path; item 7 does not name it.

Callers of the deleted views: none besides the registrations and `layout.yml:180,182,321`. The `'audit'` and `'gallery'` grep shows no `openView('audit')` or `openView('gallery')` anywhere. No test names `findingsCount`, `auditCount` or `auditBadge`.

## 2. The step line

Step line, `plan.md:1625`: "O124 the System page's merges: Audit becomes a section of Findings with one count, and Gallery a closed section of Status that draws nothing until opened (ruling 635)".

| Part of the line | Requirement |
|---|---|
| Audit becomes a section of Findings | item 1, item 2, item 6 |
| with one count | item 3 |
| Gallery a closed section of Status | item 4, item 6 |
| draws nothing until opened | item 4 (`{#if}`) |
| ruling 635, "a tab says how much is in the view" | item 3 |
| ruling 635, "the rail says only what needs the reader now" | item 3 keeps `findings` `rail: true` |

Every part of the line has a requirement. No requirement lacks a part: item 5 is the means of the nested section (Decision 1), item 2 a consequence of one pane (Decision 2), item 7 is spec.md:72.

Two choices in item 3 are not in "Decisions taken", and both are user-visible:
- `findings` keeps `rail: true`. The ruling names only `session-list`, `repositories` and `problems`, so the brief is applying the rail sentence to Findings by its own choice.
- A muted finding is not counted, while the ruling says a tab says how much is in the view; a Muted row is in the view. Case 5 shows this as "tab 0" with Muted under it.

Add both to the list.

## 3. Premises

Commands:
- `wc -l` on the four views prints 369, 149, 127, 445.
- The `sed` and `git grep` reads quoted in Check 1.
- `sed -n 60,80p src/routes/views.ts`
- `sed -n 1,20p src/lib/state/workbench/layout/tabs/left-out.ts`
- `sed -n 245,256p docs/HELP.md`
- `sed -n 76,80p docs/data-map.md`
- `grep -n "findings_tip" config/text/statusbar.yml` prints lines 67 and 68.

Every claim of "What is on the tree" holds as stated, with these two exceptions and one gap:

- **Line 23 (saved layout), partly.** "One tab each" holds. A walk of `~/.oculus/layouts.json` prints `pages/6/workbench/.../tabs/2/view audit`, `tabs/4/view gallery`, and also `pages/6/views/7 audit`, `pages/6/views/9 gallery`. That is four references: two tabs and two entries of the page's `views` record. `state/workbench/layout/saved/views.ts:41` reads `views` only as "already given", so a stale entry there does no harm. The landing change must remove the two tab objects and keep the pane's `active` right, since removing tabs at 2 and 4 moves the indices.
- **Line 21, "No view nests one GroupHead in another today": holds.** A read-only walk of 40 files that draw GroupHead, following their imports, printed no nest. The walk does not see a nest passed through a snippet from another file.
- **Missing premise.** O123's brief line 22 names O124 as in flight; O124's brief does not name O123. `comm -12` of the two write lists prints `config/defaults/layout.yml`, `docs/HELP.md`, `docs/diagrams/layer-views.*`, `docs/diagrams/layers.*`. O123's item 9 rewrites the `counts` comment at `layout.yml:307`, and O124 rewrites the same line (one physical line). `docs/HELP.md:52` is the same kind of case. Say so in `shared_paths`.

Verified without change: `grep -rln "audit\|gallery" .oculus/workspaces` in the hub prints nothing; `apps.svelte.ts:800` shows `appFindings` is `entities.apps()?.findings`, the same source rail-badges reads. A hub override of `counts:` is absent from `.oculus/config.yml`. `config/local.yml` and the hub's `local.yml` were not read, so an override there is not verified.

## 4. Cases and checks

**F2. Brief line 57 is inconsistent with spec.md:65.** It says "Each case is a run the report quotes, on a scratch server". spec.md:65 says "A builder runs no page: it starts no scratch oculus for a browser and drives no headless browser, whatever a brief says." O123's line 61 has the right form: "by reading ... each case's row in the report names the look at landing as its proof". Most O124 cases are page cases, for example `document.querySelector('[data-card="plain"]')`, Reload, Scrolling, Wallpaper.

**F3. `git grep` in the last case and in Verify 3 is inconsistent with spec.md:33.** That line allows only `git status`, `git diff` and `git show`. It also proves less than it says: see Check 5.

**F4. The brief names no worktree, no base copy and no scratch port.** spec.md:32-33 and :89 depend on them ("The brief names a base copy", "compare its lines with the base's, which the brief names"). O123.md:23 and O122.md:27 carry the line.

**F10. "The terms: each term of `docs/glossary.md`" names a file that does not exist.** `ls docs/*.md` prints apps, data-map, HELP, palette, templates, third-party.

Cases that ask the builder to check, quote or explain a place the step does not change: none that matter. "Status socket, snapshot counts" reads code unchanged inside a changed file. `KeyChoice.svelte`, `openSourceFile` and `website` are unchanged, but their callers move, so those cases stand.

## 5. The question

The goal is that Audit is one section of one Findings view with one number on every surface, and that a closed Gallery section in Status draws nothing. `plan.md` has no Goal heading (`grep -n '^## ' plan.md` prints Steps, Could run in parallel, Rulings, Agents, Blocked), so the goal is taken from the step line and ruling 635. The step line carries no check of its own.

Cases:
1. No saved layout: **yes** alone; it passes with the audit rows lost. Cases 2 and 9 close that.
2. File findings 2, audit 5, muted 1: **no** on the numbers. The look cannot set up that hub state without editing the hub; state it as "tab = Files + Audit" on whatever the scratch hub has, or as a case-run program over the rail-badges store (spec.md:66).
3. Mute: no.
4. Failed mute: passes only by reading, since no failing write can be forced at the look. It does not bear on the goal.
5. Both lists empty / only muted: no, but it is reading-only for the same reason.
6. Search: no for the tab count; **yes** for heading counts, because any heading number passes (F9).
7. Key choice: **yes**. It passes with no search, and the defect is under a search (F5).
8. Fold and reload: no.
9. Arrow keys: no.
10. Place press: no.
11. Gallery closed: **yes**. `[data-card="plain"]` being null shows the Cards section is absent and says nothing of the other seven. A guard on Cards alone passes. Use: no `[data-card]` in the Status pane, and the Gallery group's `.body` has no element children. The case needs a marker: the brief gives the group no `data-section`.
12. Scrolling nested: **yes**, vacuously. The Gallery table has one row per hue, so at an ordinary pane height its header never sticks. Name a short pane.
13. Unnested strip: no.
14. Sample cards take the cursor: no.
15. Wallpaper: **yes**. "No double fill" passes while the cards paint no fill at all (F7).
16. Narrow pane: no.
17. Status facts: no.
18. The grep: **yes**. See below.

Verify list:
- Verify 1, `npm run test:quick`: **yes**. No test names `findingsCount`, the rail sum or a view list (`git grep` over `tests` shows only `config-folder.test.ts` and the channel). Every requirement can be unbuilt and it passes.
- Verify 2, the ASCII gate: not about the goal.
- Verify 3: **yes**. The pattern misses `id: 'audit'`, `id: 'gallery'`, `audit:` in `counts`, `'audit'` in `COUNTED`, `views.audit` and `views.gallery`. It also does not search untracked files, and `findings/AuditSection.svelte` and `status/Gallery.svelte` stay untracked because a builder never commits. Replace it with `grep -rnE "auditBadge|auditCount|view: (audit|gallery)|id: '(audit|gallery)'|^  audit: +\{|views\.(audit|gallery)" src config tests --exclude=local.yml`, plus `grep -n "'audit'" src/lib/data/sources/config/sections/counts.ts`. Then `test ! -e src/lib/views/system/audit && test ! -e src/lib/views/system/gallery`.
- Verify 4: no.
- Verify 5: reading.

Items:
- Item 1: the deletion of the closing note has no case. Only the orphan-key test reaches it.
- Item 2: case 6, with F5 and F9.
- Item 3: **yes**. Case 2 passes if `+page.svelte` adds `findingsCount(...) + audit.openCount()` itself, which is two computations of one number. Add a check: `grep -n "findingsCount" src/routes/+page.svelte` shows only `client.railBadges.findingsCount()`.
- Item 4: case 11, as above.
- Item 5: cases 12 and 13, as above. Note also F11 in Check 6.
- Item 6: **yes**. No case reads the catalogue's order or a chord (F8).
- Item 7: **yes**. No case, and the named lines are short of Check 1's list. spec.md:72's grep is the only guard.

## 6. Implied inputs

**F5. A search with a key choice present.** `keyChoicesOf` returns a `Map<number, KeyChoice>` by index in the list it was given (`key-choice.ts:51-65`), and `Findings.svelte:77-78` reads it by the `{#each}` index, with the index in the row's key too. If the rows are filtered and the map is built from the full list, the choice lands under the wrong row. If built from the filtered list, the choice moves to another finding of the file, and a picked field is dropped when the key changes. Expected: the choice stands under its own finding, with its pick kept while the search changes. Key the rows by the finding, or carry the index through the filter.

**F6. Reset on a closed section.** Item 4 puts Reset in the group's `actions`, which `Status.svelte` draws, while `form` and `query` live in `Gallery.svelte`, which is unmounted when closed (`Gallery.svelte:169-187`). The brief does not say who owns them. Lifting them into Status breaks Decision 5. A strip action on an unmounted child does nothing. Decision 7 ("a group head only") implies Reset is absent when closed, but item 4 says otherwise by omission. Expected: Reset is not drawn while closed; while open it reaches the mounted partial (for example an exported function through `bind:this`). State this in item 4.

**F7. The Status tint.** `Pane.svelte:33-38`: "a view that draws cards or a frame of its own leaves it off". Status is tinted, and a tinted pane carries `data-surface`, so `Card.svelte:181` makes a card's background transparent there, with `Surface` painting nothing. Over a wallpaper, every sample card in the Gallery loses its own fill. That undoes the Gallery's purpose at `Gallery.svelte:20-22` ("what a card ... actually look like there") and makes its comment lines 37-40 false. Also `Table.svelte`'s `.stays th` paints `--panel-on-wall` on top of the tint.

This is a design choice the brief must name. The options are (a) Status untinted, with its facts and groups wrapped in `Surface`, as Pane's rule says, or (b) a tinted Status with an untinted Gallery body. A third option, keeping the tint and accepting transparent samples, breaks the Gallery's purpose. My judgment: (a). Without a wallpaper nothing changes, so only the wallpaper case sees it.

**F8. Chords.** System's letter is `y` (`layout.yml:22`), and `catalogue.ts:254` keeps the first nine. The group today is settings, account-setup, catalogue, pages, status, findings, audit, history, gallery, processes.
- Today: y7 Audit, y8 History, y9 Gallery, and Processes has no key.
- After: y7 History, y8 Processes.
- A keybinding change is a user-visible shape under spec.md:18, and it is not in Decisions or Cases.
- `Processes.svelte:3` "past the nine a chord reaches" becomes false as well as "after Gallery"; item 7 names the file for the moved name only.
- Expected case: y7 opens History, y8 opens Processes, and the Keys view and the Views catalogue show them.

**F9. Heading counts under a search.** `docs/HELP.md:296`: "a heading's count is what the search leaves". Item 2's "The count does not follow the search" and item 1's "the open audit count" do not say this. Expected: tab, status bar and rail do not move; Files, Audit, each kind and Muted show what the search leaves. So the Audit head is `shown.length`, 5 only with an empty search. A Files group with none left is not drawn.

**F11. CSS for the nested strip.** `--group-strip` on `.body` (GroupHead.svelte:132) cannot read itself: `calc(var(--group-strip, 0px) + Npx)` on the same element is a cycle and the property goes invalid. The total needs a second property set on the section, or a Svelte context. The builder runs no page, so this shows only at the look. Name it in item 5. `.strip` needs `top` from the inherited value. `scroll-margin-top` at `settings/List.svelte:210` reads the same property, and there is no change there.

**F12. Find-in-page through two folds.** HELP:296 says a match inside a folded group unfolds it. A match in a folded kind inside a folded Audit must unfold both. `beforematch` is handled per body, and the inner event also bubbles to the outer handler. Expected: both open, once each. Add a case. `found()` guards on `open`, so a double toggle needs reading.

**F13. `data-instance`.** Both moved partials carry `data-instance={instance.id}` on their wrappers (`Audit.svelte:220`, `Gallery.svelte:248`). The brief deletes `data-audit` only. Expected: one per tab. `ShowPath.svelte:103` and `jump.ts:64` read this attribute, though not for these views. `instance` also has to reach `Gallery.svelte` for `cursor`.

**F14. The state keys.** The Gallery's "state key beside `folded`" is a key in a saved record, unnamed (spec.md:18). Name it. Fold keys for the two new groups: `lines`, `hooks`, the six kinds and the eight sections do not collide with `files`, `audit` or `gallery`, read from the sources; spec.md:73 wants that stated.

**F15. A float.** Findings or Status in a free float: the two strips paint the float's fill (GroupHead.svelte:171), and the Gallery's Confirm opens above them. Expected: as in a pane. Add to case 15.

**F16. Search on `file`.** Findings hold the full path, while a row shows it relative to its root (`named`, `Findings.svelte:65`). A word from a folder above the root matches every row with nothing visible to explain it. Expected: search the shown name, with the whole path only in the tooltip.

**F17. The combined `Empty` before the first audit payload.** With `entities.audit()` null, one Empty says nothing is wrong, as each view does alone today. Expected: unchanged. Listed so the sentence is written knowing it.

Checked and clean:
- The view catalogue and the palette read registrations (`palette-page.ts:131`).
- `openView` has no literal caller of either id.
- Card stepping uses `checkVisibility`, which sees through nested `hidden`.
- There are no deep links (`git grep -i "deep.?link"` over `src` and HELP prints nothing).
- A pinned tab appears only at `layout.yml:180,182`.
- An app's read list holds the channel `audit`, which is unchanged.
- No test counts views.
- The `boundaries.test.ts` `ownPartials` rule allows both new partials.
- `views/system/findings` goes to 3 tracked files and `status` to 4, under ten.
- `Gallery` at 445 lines and `Status` at 127 stay under the limits.

## 7. ADRs

Confirmed. `ls docs/adr` prints "No such file or directory". `grep -n -i "adr" .agents/plan.yaml` prints nothing, and the state file's block names none.

## 8. Dictated text

The brief dictates no sentence for a file. It dictates three labels and a set of config lines.

- `Files`: `grep -n "labelled" .scratch/migration/agents/briefs/O124.md` lines 28, 106. Holds: ASCII, and it goes through `t()`. The word is also the name of the Files view; no rule of spec.md is broken.
- `Audit`: line 28. Holds.
- `Gallery`: line 31. Holds.
- `layout.yml` "holds status, findings, history": line 33. Holds.
- `audit.none_match` is existing text. Holds.

The words of `findings_tip` and of the one `Empty` are left to the builder, so spec.md's prose rule binds them at review.

The rule in the task: confirmed. Under spec.md:43 a design that breaks the no-migration rule is a finding, and a count that disagrees between tab, status bar and rail is a finding under ruling 635.

The brief's design breaks neither:
- `layouts.json` is changed once by the orchestrator and no code tolerates the old form.
- All four surfaces read `railBadges.findingsCount()`: `badgeOf` for tab and catalogue, `railPartOf` for the rail, `+page.svelte` for the status bar.

Only the heading counts under a search are open (F9).

## Declined to judge

- How the outer strip, inner strip and table header look in the browser, including F7's fill. This was read from the CSS and not seen; no page was run, as the task bars it.
- Whether `findings` should stay on the rail under the ruling's rail sentence. That reading is the orchestrator's or the user's.
- Merge order with O122 and O123, beyond naming the shared paths.
- Whether a hub override sits in a `local.yml`, which was not read.

## Usage

a245ccc2df2413f9c, claude-opus-5-5, 236996 tokens, 28 tool uses, 9 min 55 s

## Closed

- F1: the write list and item 7 widened to every false hit; line 52 and `findings_tip_one` added.
- F2: the first-run paragraph follows the rules file's rule on pages.
- F3: Verify 3 uses `grep -r` and `test`, and reaches untracked files; the last case dropped.
- F4: the base copy and the worktree named.
- F5, F16: item 2 keeps a row's index, and searches the shown name; two cases added.
- F6: item 4 says who owns Reset's state, and that Reset is absent while closed.
- F7: item 4 and decision 10 take Status off the tint, with `Surface`.
- F8: a premise, decision 11 and a case; `Processes.svelte`'s comment named.
- F9: items 1 and 2 follow HELP 296.
- F10: the report's terms part changed; a premise added.
- F11, F12: item 5 names the second property and the double fold; a case added.
- F13, F14: items 1 and 4 name `data-instance` and `showGallery`; decision 12.
- F15: added to the wallpaper case. F17: unchanged behaviour, the sentence is written knowing it.
- Check 2: decisions 8 and 9 added. Check 3: a premise on the `views` record and one on O123.
- Case 2 restated on any hub, with the fixed numbers for a case-run program; the close of a Gallery case made total.

No dictated line was rewritten or added beyond the state key `showGallery`, the attribute `data-section="gallery"` and the grep of Verify 3, each read and held.
