# Step O95 brief check (on main at 69c52091b)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/O95.md`. A page this report cites is named with its section, never with a line number; a line of code or a hit of a grep keeps its `file:line`.

`git log --oneline -1` prints `69c52091b Stop O98 at its /spec on open item 510`. `git status --short` shows ` M .scratch/migration/orchestrator-state.md`, ` M docs/data-map.md` and `?? .scratch/migration/agents/briefs/O95.md`; this check did not read `docs/data-map.md`'s uncommitted change. `plan.md` has no Goal section: `grep -n '^## ' .scratch/migration/plan.md` prints only `## Steps, in execution order`, `## Could run in parallel`, `## Rulings`, `## Agents` and `## Blocked, and by what`. So the goal used below is the one the task gave: every press on the Focus board opens what the rulings say.

## 1. Names

The step changes these names: `openLine`, `pick`, `pickAttention`, Band's `reveal`, the `Waiting` and `Tally` shapes, `waiting()`, `BoardRule` (a new key), `Projects.svelte`'s `registration` (one registration becomes a list), a new view id with its `views.<id>` and `views.<id>_glyph` words, a new `board.*` format word, the HELP sentence on the funding and conference lines, and the comments that say a line or card "opens the ... view".

- `git grep -n 'openLine' -- src tests docs config README.md ':!config/local.yml'`: the only hits are `CommandCenter.svelte:34,227`, `Tasks.svelte:32,71` and `rows.ts:348`, all on the write list. The hits in `Diff.svelte:295,375,461` are a different local function. Nothing outside the paths.
- `git grep -n '\bTally\b' -- src tests`: `ticker.ts:63,156,589` (`venueLoad` returns `Tally[]`). That file is on the write list. If `Tally` gains the projects' ids, `venueLoad` must supply them or the field must be optional.
- `git grep -n 'boardTakes(' -- src tests`: `items.ts:223`, `new-project.ts:153` and `selectors.svelte.ts:517`. All read `preset.rule` through `boardTakes`, so a new key needs no change in them. `new-project.ts:136-137` builds the project it tests with `id: ''`, so a take by a list of ids refuses New project with `new-project.ts` unchanged. Not made false.
- `git grep -n 'record: null\|record: records\|BoardRule\b' -- src tests`: every place that builds a `BoardRule` literal (`takes.ts:67`, `presets.ts:568,605`) is on the write list. Not made false.
- `git grep -n 'track_record' -- config src docs tests`: `docs/palette.md:28` (`| Track record | track_record |`). **Finding 1.1:** `docs/palette.md` lists every registered view, unlisted ones included. It is written by `npm run docs:palette` (`package.json:24`, `utils/diagrams/palette.mjs`) and checked by `tests/checks/diagrams/palette.test.ts` ("A command, an argument, a key or a view added to the palette without `npm run docs:palette` fails it"). The new view makes the committed page stale. `docs/palette.md` is not on "Paths this step writes", and `npm run docs:palette` is not on the verify list (`npm run diagrams` runs `utils/diagrams/diagrams.mjs`, which does not write the palette page: `grep -n palette utils/diagrams/diagrams.mjs` prints nothing).
- `git grep -n -i 'opens its collection\|collection tab\|opens the Venues view\|opens the Funding view\|Awaiting box\|awaiting box\|band card' -- src docs config README.md tests`. These hits become false and are not on the write list or not named in item 5:
  - `src/lib/state/boards/board/ticker-lines.ts:22-24`, "a lead's line opens the Leads view, where its actions are, and a venue's call opens the Venues view." The step makes the venue half false. **Finding 1.2:** the file is outside the write list.
  - `src/lib/views/boards/focus/rows.ts:231`, "neither does a conference call, which opens the Venues view". This becomes false. The file is on the list, but item 5 names only `openLine`'s comment there.
  - `src/lib/state/boards/ticker.ts:219` ("The key of the hub's funding collection, whose view a scheme's line opens") and `ticker.ts:276-278` ("a line of one opens the view of the collection its hub keeps the schemes in"). Both become false. Item 5 names only `:371-373`.
  - `src/lib/state/boards/focus/focus-lanes.ts:69` (`BandItem.entry`, "the collection view whose entry the card reveals"). This becomes false. The file is on the list but not named in item 5, and the build may not otherwise change it, so "every file the step changes" does not reach it.
  - `src/lib/views/boards/focus/CommandCenter.svelte:16` ("Lead and attention lines open their views"), `:150` ("the view each line opens") and `:222` ("a lead's view, a project's tab, or the file's own tab"). All become false. Only "the pick" is named.
  - `src/lib/state/boards/focus.ts:555-567` (the comment of `waiting`). It becomes incomplete once the tallies keep ids and the grants and applications carry their entries. It is covered by "every file the step changes".
  - These hits stay true: `config/catalogs/vocab.yml:60,90,102`, `config/options/...`, `src/lib/data/shapes/catalog-files/vocab.ts:132,178,201,216`, `docs/templates.md:309` and `src/lib/data/model/model-collections.ts:31` say what the box counts, not what a press opens. `CareerPanel.svelte:26` and HELP's "Funding obtained opens the Funding view" are a career row, which the step does not change.
- `git grep -n -i 'transient board' -- docs src config tests` prints nothing. `ls docs/glossary.md` answers "No such file or directory".

Findings: 1.1 (`docs/palette.md` and `npm run docs:palette` missing from the paths and the verify list); 1.2 (`ticker-lines.ts:22-24` false and outside the paths); item 5's list of comments misses `rows.ts:231`, `ticker.ts:219`, `ticker.ts:276-278`, `focus-lanes.ts:69` and `CommandCenter.svelte:16,150,222`.

## 2. The step line

The step line is `sed -n 880p .scratch/migration/plan.md`, printed above. Each part maps to these items:

- "every name of the Awaiting box is a button": item 1.
- "an application or a grant opens its entry's page": item 1, first sub-bullet.
- "a venue a transient board of the projects under review there": item 1, second sub-bullet, and item 2.
- "a person or project waited on a transient board of the projects waiting on it": item 1, second sub-bullet, and item 2. The brief extends this to a `waiting-on:` value that names neither (case 5), which fits "every name of the Awaiting box is a button".
- "Blocked a transient board of the blocked projects": item 1, second sub-bullet, and item 2.
- "a command center row, a tasks row ... naming a collection entry open the entry's page as a card's title does": item 3.
- "a band row": item 4.
- "a row naming no entry opening its collection as now": the last sentence of item 3. Every band card names an entry, so the part does not arise for the band.
- (ruling 494): items 1 and 2. (ruling 495): item 3. (ruling 496): item 4. (ruling 497): the scheduling only.

Items 5 and 6 serve no part of the line. They are the rules file's obligations (the doc and head comments, and the guarded test).

Item 3's list of entry rows leaves out the subtask lines of a funding scheme, whose target is `{ kind: 'funding', id: scheme.id, collection: fundingKey(scheme) }` at `ticker.ts:505`. "A row whose target names an entry of a collection" covers them in general, but the explicit list and case 11 do not. It also leaves out the Snoozed group's lines of an entry or scheme, which the command center draws through the same `pick`.

Findings: none against the line. Every part is served. The scheme's subtask lines and the snoozed entry lines are covered only by the general sentence.

## 3. Premises

Each premise was checked with the command or read named.

- The step line at `plan.md:880` and rulings 494 to 497 at `:2926-2929`: `grep -n '^- \[ \] O95 '` prints 880, and `sed -n 2926,2929p` prints the four rulings, each ending "(the user).". Holds. Ruling 423 at `plan.md:2852` (`grep -n`). Holds.
- `presets.ts:538` `RECORD_VIEW = 'track_record'`, and `recordPreset` at `:549-578`: `grep -n` prints `549:export function recordPreset(` and `581:const MAP_VIEW`. Holds.
- `Projects.svelte:15-25` registration and the branch at `:159-165`: read with `cat -n`. Holds.
- `views.ts:30-33` (`RegistrationSource` is one registration or a list) and `registerBoards` at `:123-138`. Holds. `registerBoards` reads `definitions(drawer.registration)`, which accepts a list (`views.ts:58`, `Array.isArray(source) ? source : [source]`). `moduleViewIds` flattens lists. So a list registration is kept through every push of `boards:`, and `views.ts` needs no change.
- `career-rows.ts:233-235` and `board.record_title` at `projects.yml:71`. Holds.
- `takes.ts:31-39` and `:147-150`. The type runs from 25 to 39, and the `record` branch from 147 to 151. Close enough; holds.
- `Focus.svelte` 395 lines. Holds. **Finding 3.1:** the brief's "`awaiting` derived (`Focus.svelte:150-188`)" and "each name drawn as plain text joined by commas (`Focus.svelte:283-288`)" do not reproduce. `grep -n "names.join\|const awaiting = \|section === 'awaiting'" src/lib/views/boards/focus/Focus.svelte` prints `169:    const awaiting = $derived(`, `288:            {:else if section === 'awaiting'}` and `303:  >{row.names.join(', ')}</span`. The derived (with its comment) is 165-201, and the box's markup is 288-308.
- `focus.ts:568-618` and the parts inside it: `grep -n` prints 568 `waiting(`, 582 `onLanes`, 595 `isBlocked`, 596 `waitingOn`, 603 `pausesCountdown`, 609 `grants`, 613 `applications` and 617 `return`. `Tally` is at 137 and `tallies` at 498. All hold.
- `filter.ts:386` (`strip: waiting(...)`) and `awaitingTotal` at `:486-496` (actually 486-497), used at `:526`. Holds.
- `page-entry.ts:118-127` `pageView` and `:133-140` `writtenPage`, and `Collection.svelte:204-208` `openPage`. Holds.
- `rows.ts:348-355` `openLine`, `CommandCenter.svelte:223-228` `pick` and `:231-238` `pickAttention`, and `Tasks.svelte:68-73` `pick`. Holds.
- `ticker.ts` targets, by `grep -n "kind: '"`: funding at 294, entry at 334, lead at 365, venue at 380, followup at 428, 446 and 470, entry subtask at 528. Holds. The brief does not list the funding subtask target at 505 or the manifest targets at 247 and 488.
- `Band.svelte:97-105` (`reveal` at 98) and `BandItem` at `focus-lanes.ts:67-80`. Holds.
- `docs/HELP.md:294`: `sed -n 294p` holds "A funding scheme's deadline and follow-up lines open the Funding view, a conference call opens the Venues view". Verify 5's grep string is a substring of it. Holds.
- Line counts: `wc -l` prints 690, 664, 471, 182, 688, 669, 428, 265, 205 and 307, as the brief says. Holds.
- `board-rules.test.ts:606-633` 'New project on a board' with the track record rows. Holds.
- `ls -d docs/adr`: "No such file or directory". Holds.
- The verify list: `.agents/plan.yaml:4` names the state file, and `orchestrator-state.md:6` holds `verify:`. Holds.

Whether the transient board, as the brief designs it, can be built on the tree:

- `Projects.svelte` can reach the portfolio, the clock and the scope's selectors through `useState()`, as `Focus.svelte:88-95` does: `entities.portfolio`, `clock.minuteNow`, `selectors.selfPeople` and `hubVocabs`.
- `focusPage` is exported (`filter.ts:643`). `keptSnapshot` is not (`filter.ts:320`, `function keptSnapshot`). It is a judgment, not checked by a run, that calling `focusPage` itself for the take costs more than the take needs: it builds the ticker two or three times (`filter.ts:636-641`) and needs the minute clock running in the board tab.
- `pageView` can be resolved for each row kind the brief names:
  - An application needs `bareId(collection)` and the collection's `registry`, which `Waiting` does not carry yet.
  - A grant needs the funding collection's key `fundingKey(scheme)` (`ticker.ts:220`, `entryOf(record, 'funding')?.key`), which can be undefined.
  - A conference call (`{ kind: 'venue', id }`, no collection) and a Needs-attention venue line (`feeds.ts:100`, `id` the venue's registry id) need `registryKey('venues', hub)`, which is the selector at `selectors.svelte.ts:495`. `EntryFields.svelte:88` already opens a venue's page this way.
  - A band card needs `pageView(item.entry, item.id, item.title)`, since `item.entry` is the collection key in the entry's hub (`focus-lanes.ts:69-70`).
- Tab identity is `stateId`, which reads `id` from the state (`instance.ts:271-275`). The brief's state lists the row, the name, the title and the filter, but no `id`. The builder must form one, and the brief does not say from what.
- **Finding 3.2:** `src/lib/state/client/selectors.svelte.ts` is 871 lines (`wc -l`), 9 below the 880 limit. It is on the write list, and the brief does not say that a selector added there means splitting the file in the step.
- **Finding 3.3:** a Focus filter with Mine only off and the board's own Mine only on give different counts. The Focus filter's Mine only defaults to on (`filter.ts:104`), and so does a board's (`state.ts:157`). The board applies its Mine only "only where one of the board's projects is one it does not keep" (`Projects.svelte:63-64`). Suppose the reader turned Focus's Mine only off and the box counts a BSPC project that is not theirs. The new board then starts with Mine only on and hides that project. Decision 1's claim, "the board's count equals the name's count (case 7)", is then false.

Findings: 3.1 (the two `Focus.svelte` ranges are wrong), 3.2 (`selectors.svelte.ts` at 871 lines), 3.3 (the Mine only defaults break decision 1).

## 4. Cases and checks

- **Finding 4.1:** the paragraph after "Cases", the first-run instruction and Verify 6 conflict with the rules file. They ask the builder to start "a scratch server from the worktree on a free port", with "a screenshot or the tab's title and state" for cases 8 to 16. The rules file (`agents/spec.md`, "What every package obeys") says: "A builder runs no page: it starts no scratch oculus for a browser and drives no headless browser, whatever a brief says. A case that only a page shows is checked by reading and by the unit-level runs that reach it, and its row in the report names the look on landing as its proof". The brief should name the look on landing, with the view and state for each case, as the proof of cases 8 to 16 and of the press parts of cases 1 to 7.
- **Finding 4.2:** "Cases 1 to 7 ... are G124's rows". Cases 1 to 7 also assert things no take row can show: the tab title ("Under review: BSPC"), no count on the tab or the rail, the view absent from the catalogue, and a second press bringing the same tab forward. The brief gives these parts no check, neither a reading nor the look on landing.
- **Finding 4.3:** item 6 widens G124 without new entry text. The rows test the ids `waiting()` keeps under the Focus filter (`focus.ts`, `filter.ts`), and G124's Code line names neither file (`sed -n 183,186p .scratch/migration/agents/guarded.md`). G124's text is about a board's take from its keys ("A project is on every board whose keys it meets ..."), and the brief asks only for a new Code line and Test line, not text describing the Awaiting board's take. The rules file ("What every package obeys": "A step that needs a new entry stops and asks Axel for it") makes widening an entry to a new unit the orchestrator's call or Axel's. The brief does not say which it is.
- **Finding 4.4:** Verify 4 and "Conventions" give 880 lines for every changed source file. The rules file gives 520 for a Svelte component ("a Svelte component at or under 520"). Five of the changed files are components, and `Projects.svelte` is at 471.
- **Finding 4.5:** case 1 says "The research-hub fixture or a scratch hub". `ls tests/fixtures/hubs` prints `demo deposit-world.ts hub-build.ts real-hub.ts workspace.ts`, so no fixture has that name. Read as Axel's real hub, the case would run a page over the real hub, which the rules file allows only for its four read-only tests.
- Cases that ask the builder to check a place the step does not change:
  - Case 12: the task line's Done status, Remove and agent buttons (`rows.ts` `actionsFor`, not changed).
  - Case 13: the inbox line and the refresh line (`pickRefresh`, `CommandCenter.svelte:241`, not changed). The lead branch of `pick` is kept as it is.
  - Case 16: the entry page's message for a deleted entry (`Entry.svelte`, not changed).

Findings: 4.1, 4.2, 4.3, 4.4, 4.5, and cases 12, 13 and 16 check places the step leaves unchanged.

## 5. The question

For each check, could it pass without the goal being reached?

- Cases 1, 3, 4, 5 and 6 (G124 take rows): yes. A row tests the take function, not the box's button, the tab's state, its title or its identity. A take can be right while a press opens nothing.
- Case 2: yes. A row can call the take with the tally's label `''` while the tab state carries the drawn words "(venue unset)" (item 2 says the state carries "the venue-unset words' name"). The row then passes while the press opens an empty board.
- Case 7: yes. The row passes a filter to the take directly, so it passes even when the press does not put the Focus filter into the tab's state.
- Cases 8 to 16: yes. Their only stated check is the scratch-server run, which the rules file bans (Finding 4.1), and no look on landing is named in its place.
- The step line's check: the brief names no check of the line beyond the verify list. Yes: `npm run test:quick` passes with no name made a button.
- Item 1: yes. Its check is the cases' runs (banned) and no named look.
- Item 2: yes. The G124 rows can pass while the registration, the title or the identity is wrong.
- Item 3: yes. It has no unit check and no named look.
- Item 4: yes, for the same reason.
- Item 5: yes. Verify 5 passes when the sentence is deleted, or reworded and still false. Verify 7 is a prose reading, not a check of what the sentence says.
- Item 6: yes. It tests the take only, as above.

Findings: every check above can pass without the goal. The closing check for items 1 to 4 should be the look on landing, with each press's view, state and expected tab named.

## 6. Implied inputs

These inputs are implied and missing from "Cases". Each one has happened or would cost something if answered wrong.

1. **The Focus filter's Mine only off at the press while the board's own Mine only starts on** (Finding 3.3). Expected: the board holds what the name counted. For example, the board's Mine only starts in the state of the carried Focus filter, or is not offered.
2. **A second press on the same name after the Focus filter changed, or from a second Focus tab with another filter.** "Brings that tab forward" keeps the old filter, so the board's count differs from the name's. Expected: the tab is brought forward with the filter in force at the latest press.
3. **The transient board opened from the palette with no state, or a saved tab whose state no longer parses.** The palette lists every registered view (`docs/palette.md` "Views", where `track_record` appears). Expected: a message like `board.record_no_role` (`projects.yml:70`), never a board taking every project or failing.
4. **The venue-unset name kept as words.** The tally's label is `''` (`Focus.svelte:182`). If the state keeps the drawn words "(venue unset)", the board finds no tally after the catalog word changes, and a venue whose short name is literally "(venue unset)" collides with it. Expected: the state keeps the tally's label, `''` for no venue, and the title alone uses the words.
5. **One project counted twice in one tally.** This happens when a project's `waiting-on:` names one value twice, or names two people or projects that `waitingLabel` gives the same words (`waiting.ts:17-29`, `focus.ts:597-600` adds 1 per value). The name reads "(2)" and the board draws 1 project. Expected: the brief says whether the count is of projects or of values, and decision 1's claim is checked against it.
6. **Collisions inside one row.** A person and a waited-on project share one name, or two people of one name sit in two hubs. Decision 2 covers venues only. Expected: the board holds every project of the merged tally.
7. **A grant whose hub's list names no funding collection.** `fundingKey` returns undefined (`ticker.ts:220`), and so does the Grants entry's collection. Expected: the name and the ticker line keep a defined behaviour, plain text or the Funding view, instead of `pageView('', ...)`.
8. **A grant and a band funding card of a hub other than the primary.** Case 9 names "an entry of a hub other than the primary" in general, but the funding key is resolved per hub. Expected: the scheme's page in its own hub.
9. **A Needs-attention venue line whose `venue_id` names no registry venue.** `venueLoad` labels it `keyOf(id)` (`ticker.ts:594,601`). Expected: what opens, either the entry page's "entry gone" message or the Venues view as now.
10. **A venue line merged by name over two hubs.** `venueLoad` keeps the first id (`ticker.ts:596`), so the line opens one hub's venue page. Expected: stated.
11. **An application or grant with an empty title.** `Waiting` maps `entry.title` (`focus.ts:615`), while `openPage` uses `entry.title === '' ? entry.id : entry.title` (`Collection.svelte:205`). Expected: a button labelled by the id, never an empty button.
12. **Two applications of one title in two hubs.** Decision 5 draws two identical buttons. Expected: the hub's name after each, as other rows do for a hub other than the primary.
13. **The new view id colliding with a hub's `boards:` key or a collection key.** `pageBoards` refuses a board of a module's view id (`views.ts:83-91`). The rules file asks for every id a step introduces to be checked for this. Expected: a board finding, with the brief naming the view id.
14. **A funding scheme's subtask line and a snoozed entry or scheme line.** Expected: the entry's page (item 3's general sentence), with a case for each.

The prompt's other examples are answered or not reached:
- A tally whose name collides: 5 and 6 above.
- A name with a comma: each name becomes its own button, so no case is needed.
- An entry with no primary key: `pageView` is the same rule a card title uses, so there is no divergence.
- A feed entry: case 13 covers the lead line.
- A project in two hubs: two ids, each counted, so no case is needed.
- The Focus filter hiding everything: the box is not drawn, so no press is possible.
- The transient tab restored when its name no longer exists: case 8 covers the empty board.
- A funding scheme of another hub: 8 above.
- The people-registry entry: case 15.

The brief also names neither the new view id nor its `views.*` label and glyph, which the palette and `docs/palette.md` show, nor the keys of the tab state, which are saved with the layout under `~/.oculus`. The rules file ("No silent design decisions") counts both as user-visible shapes.

Findings: items 1 to 14 above, and the unnamed view id, view words and state keys.

## 7. ADRs

`ls -d docs/adr` answers "ls: docs/adr: No such file or directory". There is no ADR record.

Findings: none.

## 8. Dictated text

- `'{0}: {1}'`, the new text-catalog word (`grep -n "{0}: {1}" .scratch/migration/agents/briefs/O95.md` prints line 29). It is ASCII and is read through `t()`. Holds. `grep -rn "'{0}: {1}'" config/text` shows the same value already at `config/text/views/boards/projects.yml:44` (`board.group_picked`), in the group the new word joins. A key of its own is still right, since the meaning differs.
- "Under review: BSPC", "Waiting on: Maryam" and "Blocked" (`grep -n "Under review: BSPC\|Waiting on: Maryam"` prints lines 29, 40, 42 and 103). These are the titles the existing words and the new format give, not new text. Holds.
- "Everything in the brief is done" (`grep -n` prints line 154), the report's first line as the rules file's "Report" section gives it. Holds.
- Item 5 says what HELP and the head comments must say without giving their words, and item 6 does the same for G124's new text, so neither is dictated.

Findings: none.

## Declined to judge

- Whether item 6's rows widen G124 within its scope or need a new entry (Finding 4.3). That is the orchestrator's call or Axel's under the rules file, so this report only names the question.
- Whether the take should call `focusPage` itself or a smaller exported part of it (`keptSnapshot` with `waiting`). Section 3 gives this as a judgment, not checked by a run.
- `docs/data-map.md`'s uncommitted change in the main checkout, which this check did not read.

Agent usage: ac93e98b3cfcb9328, claude-opus-5-5, 208248 tokens, 66 tool uses, 9 min 2 s.