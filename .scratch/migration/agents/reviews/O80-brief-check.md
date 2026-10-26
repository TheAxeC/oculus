# Step O80 brief check (on main at eb87e816)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/O80.md`. `git log --oneline -1`: `eb87e816 Close O80's open items 417 to 422 under self-rule`; `git status --short`: only `?? .scratch/migration/agents/briefs/O80.md`.

The two largest findings, ahead of the details. (a) Registering the boards from config needs the registration wiring in `src/routes/views.ts`, `src/routes/+page.svelte` and `src/routes/+page.server.ts`, and five tests that call `registerAll`. None of these is in the write list. (b) Case 8's "the form asks" cannot happen. With no tier, `offersNewProject` hides New project. `NewIdeaForm` also has no tier field.

## 1. Names

- `boardRegistration`: `git grep -n "\bboardRegistration\b" -- src tests config docs README.md ':!config/local.yml'`. All hits are in `Projects.svelte:9,22-27`, which is in the paths. The static `registration` array is picked up by `registerAll` (`src/routes/views.ts:58,61-63`, `import.meta.glob` of the views). Only `registerCollections` (`src/routes/views.ts:92-115`) hands a function registration `{ views, unplaced }`, and only from the page data (`src/routes/+page.server.ts:76`, `src/routes/+page.svelte:113,152`). Boards read from the merged config need that wiring, and a config push needs it too. `src/routes/views.ts`, `+page.svelte` and `+page.server.ts` are all outside the paths. The paths name instead "`src/lib/state/workbench/navigation/rail.ts` and the files of that folder that register views"; no file in that folder registers views (`ls src/lib/state/workbench/navigation/`). Five tests call `registerAll` and expect the six board views to come from it: `tests/state/workbench/navigation/registry-glyphs.test.ts:22-24`, `tests/checks/config/arrangements.test.ts:29`, `tests/checks/config/config-folder.test.ts:535,580` and `tests/checks/source/keys.test.ts:64`. All are outside the paths, and the change makes their premise false.
- The key-built `views.${id}` lookup: `git grep -n 'views\.\${' -- src tests`. `src/lib/views/boards/projects/Projects.svelte:224 return lookup(\`views.${preset.id}\`);` builds the board pane's title from its id. Z1022 calls this lookup the lazy option, but item 1 names only the registration. `tests/checks/source/keys.test.ts:302-305` (`start: 'lookup(\`views.${preset.id}\`'`, `keys: () => boardIds(...).map((id) => \`views.${id}\`)`) is outside the paths, and the change makes it false.
- `BOARD_GROUP`: `grep -rn BOARD_GROUP src tests docs config --exclude=local.yml`. Only `CareerPanel.svelte:85,108`, which is in the paths.
- `CLUSTERS`, `IDEA`: `git grep -n "\bCLUSTERS\b\|\bIDEA\b\|lanesIn" -- src tests`. Only `focus.ts` and `Lanes.svelte`, both in the paths. The `IDEA` in `tests/data/sources/feeds.test.ts:76` is an unrelated constant. Three related hits sit in paths but are named by no item:
  - `config/options/catalogs/vocab.yml:157-160`: `cluster: ... control: choice / options: [now, parked, incubate, idea]`. The cluster words are a fixed list in the options catalog, so Settings could not give a lane a new cluster, and case 5's `later` could not be picked. The change makes this list false.
  - `src/lib/data/shapes/catalog-files/vocab.ts:45` describes `cluster` as "now, parked or incubate, drawn as three clusters, or idea". The change makes this false.
  - `docs/templates.md:290-291` uses `cluster: now`/`cluster: idea`, which stays valid.
- `GLYPHS`: `git grep -n "GLYPHS\b" -- src tests`. Only `ticker-lines.ts` and its reader `src/lib/state/boards/ticker.ts`, both in the paths. `KIND_GLYPHS`, `ROLE_GLYPHS` and `FACT_GLYPHS` are unrelated; `FACT_GLYPHS` already uses text words.
- `colourOf`: `git grep -n "\bcolourOf\b"`. The step's function is only `categories.ts:49,75`. The functions of the same name in `PaneStrip.svelte`, `theme/colours.ts`, `file-icons.ts`, `Outline.svelte` and `code-theme-pairs.test.ts` are unrelated.
- `railCount`: `categories.ts`, `rail-badges.svelte.ts` and `board-rules.test.ts`, all in the paths. Two sentences in the paths are missed by both item 6's list and verify 5's grep:
  - `src/lib/data/shapes/catalog-files/vocab.ts:265`: "A board gives the rail the count of its projects in such rows, in the colour of the first."
  - `config/options/catalogs/vocab.yml:276`: "a board gives the rail the count of its projects in such rows, in the colour of the first".
  - `grep -n "first such\|first stage\|first chip\|first row\|first word"` over both files does not print them.
- `rail_color`: item 6 adds it to `HUB_LIST` "replacing oculus's value whole" but does not name `in-place.ts`. `VOCAB_SHAPES` holds only map, rows and whole-list shapes. `layInPlace` refuses a scalar: `in-place.ts:223` `if (!Array.isArray(value)) return { wrong: 'list' };`. `hubWords` (`src/lib/data/index.ts:635-641`) gives a hub's records only the `VOCAB_SHAPES` keys. A scalar left out of `VOCAB_SHAPES` is therefore missing from a hub's own words, which `railCount` reads per hub. A scalar put in under `WHOLE` gets a wrong-kind finding.
- `lead_declined`, `lead_applied`: `src/lib/views/shared/card/feed/LeadCard.svelte:9,15` and `lead-apply.ts:6` are outside the paths. Their comments stay true. However, item 5 and case 12 ask for "the decline or apply control drawn disabled", and those controls are drawn in `LeadCard.svelte:170-184`, which is outside the paths. `leads.ts:26-29` `wordOf` is the one first-word reader behind `openWord` (`default_lead`), `appliedWord` and `declinedWord`. "Not changed" keeps `default_lead` "as it is read", so `wordOf` keeps a first-of-list reading for one caller.
- `new_idea`: `tests/server/edit/writes.test.ts:625` ("its `stage` is the first stage carrying `new_idea`") is outside the paths, and the change makes it false. `config/text/views/boards/projects.yml:47` and `Projects.svelte:285` are the unrelated text key `board.new_idea`.
- `default_task`, `default_application`: no hit outside the paths makes a false statement. `lead-apply.ts:7` says "the word carrying `default_application`" and stays true.
- `manifests` (`ticker_categories`): `vocab.yml:193`, `vocab.ts:304`, `config/options/catalogs/vocab.yml:210` and `src/lib/state/boards/ticker.ts:227` all read it as "the first word carrying it". It is a single-use flag of the same kind on the Focus command center. It is outside ruling 393's list and outside the brief. Verify 5 will hit `vocab.ts:304` and `ticker.ts:227` with no reason given for keeping them.
- `focus_lanes`: hits outside the paths are `src/lib/server/content/audit/rules.ts:58,117-165` (reads the lanes' chips only, unchanged) and `src/lib/state/shared/words/tones.ts:187` (unchanged). Two hits in the paths matter:
  - `tests/checks/config/config-folder.test.ts:215-235` lists every top-level key of `catalogs/vocab.yml` and must gain `focus_clusters` and `rail_color`. That is an edit to an existing assertion; item 10 names only "its count of described keys" (`:697 toHaveLength(35)`).
  - `vocab.yml:4` lists the map keys and the lists replaced whole. Adding the new keys makes that list incomplete.
- `unplaced_collections` pattern: three hits are outside the paths.
  - `tests/routes/edit/rail.test.ts:44-53` (`railOf` rebuilds each entry's flags) is the rail write test, and needs `project_boards`.
  - `tests/state/client/held-unsaved.test.ts:243` holds a fixture.
  - `tests/data/sources/config/rail.test.ts` holds the `unplaced_*` rows. Its titles are named under G13 in `guarded.md` (the line "the rail's `unplaced_collections`: `tests/data/sources/config/rail.test.ts`, 'words a rail with no entry flagged...'"), not under G116, G124 or G126.
- `boards:`: `config/defaults/layout.yml:226` (in the paths) says "it opens on the first board that takes it, and on the first board when none does". The code is `src/lib/state/client/selectors.svelte.ts:485-503` `boardItemOf` (`presetFor(view ?? '', ...)`), outside the paths, and `src/lib/state/boards/career.ts:108-121` `roleBoard` ("the first key of the merged `boards:` ... whose `role` holds the role's key"), also outside. Both are list-position rules on the board surfaces that the brief neither changes nor names.
- The `tiers` readers: three hits.
  - `src/lib/views/boards/projects/NewIdea.svelte:11` ("The board's tier, the first word of its `tier:`") is outside the paths, and the change makes it false.
  - `docs/apps.md:452` (`fields.tier (the first word of \`tiers\` when absent)`) is outside the paths, and the change makes it false.
  - `config/options/catalogs/vocab.yml:224` (tiers help: "the first is the tier of a new project whose form names none") is in the paths but named by no item, and verify 5 does not match it.
- The new record's hub: three places outside premise 3 and the paths.
  - `src/lib/state/shared/page/hubs.ts:7-11` (head comment: "with more than one, the path asks which, the primary first; with one, it writes there, primary or not"). Item 3's "otherwise none is chosen and the form's Add stays off" makes it false when the one hub offered is not the primary.
  - `src/lib/state/sessions/source/write-files.ts:157-178` (`home`: "else the primary's, else the first hub's"; `literatureHome`; `added`: "else the first hub's") is a first-of-list hub default that item 3 does not name.
  - `src/lib/shell/keys/Palette.svelte:299-300` and `src/lib/shell/keys/lists/task-hub-list.svelte.ts:1-4` select the first row of Add Task's hubs.
- `categories_colour`: `config/text/findings.yml:197` and `boards.ts:220` are in the paths. `tests/data/sources/config/boards.test.ts:148-154`, 'reads a row added after dead-ends with no finding', adds `{ key: 'x', label: 'x', stages: {...} }` with no `color`, which becomes a finding. The brief does not name this assertion edit.
- `docs/data-map.md:80`, "may set these 47 keys". `sed -n 713,759p src/lib/data/helpers/hub-names.ts | grep -c "{ key:"` prints 47. The file is in the paths, and the change makes the count false (49).

Findings: the registration wiring (`src/routes/views.ts`, `+page.svelte`, `+page.server.ts`) and the five `registerAll` tests are outside the paths. The `Projects.svelte:224` pane title and `keys.test.ts:302-305`. The `cluster` choice list in the options catalog. `rail_color` and `VOCAB_SHAPES`/`hubWords`. `LeadCard.svelte`, needed for the disabled controls. `NewIdea.svelte:11`, `docs/apps.md:452` and `writes.test.ts:625`. `hubs.ts:7-11` and `write-files.ts:157-178`. `vocab.ts:265`, `options vocab.yml:224,276`. `config-folder.test.ts:215-235`. `boards.test.ts:148-154`. `data-map.md:80`. `rail.test.ts` and `routes/edit/rail.test.ts` under G13 and G8.

## 2. The step line

- "the project board views registered from `layout.yml` `boards:` in its order": item 1.
- "a `focus_clusters:` list in `vocab.yml` (key, label, glyph, muted, layout `columns` or `full_width`) in place of `CLUSTERS`, `IDEA` and the cluster words of `Lanes.svelte`": item 2.
- "a `default: true` flag on one tier and the workspace's primary hub as a new record's default hub, no 'first of the list' default": item 3.
- "a Focus lane row naming what a move onto it writes": item 4.
- "each single-use flag carried by two words a config finding": item 5.
- "`color` required on every category row and the rail colour a `rail_color:` key": item 6.
- "the glyph names of `CrossLinks.svelte` and `ticker-lines.ts` in text words": item 7.
- "a `sections:` list in the `focus:` map of `behavior.yml` giving which Focus sections are drawn and in what order": item 8.

Findings: none. Every part has a requirement.

## 3. Premises

- 1, `Projects.svelte:9-28` (`sed -n 1,30p`): matches (registrations 1 to 6 at :22-27, `group: 'projects'` at :13).
- 1, `layout.yml:227-308` `boards:` with the comment at `:226` (`sed -n 220,310p config/defaults/layout.yml | cat -n`): the comment is at 226 and `boards:` at 227, but the map ends at 299 (`label_mode: short`). Line 302 is the counts comment and 303 is `counts:`. The range 227-308 runs into `counts`.
- 1, the rail entry at `layout.yml:10` (`sed -n 1,30p | cat -n`): line 10 is `{ label: "Focus", ... }`. The Projects entry is at line 11. Registries at `:17` matches.
- 1, `CareerPanel.svelte:85`: matches. `findings.yml:62-64` `unplaced*`: matches. `boardsFindings` in `sections/boards.ts:141`: matches.
- 2, `focus.ts:51,57,303,483-510,583` (`git grep -n "IDEA\b\|CLUSTERS\b\|\.cluster\b" -- src`): matches. `Lanes.svelte:28-29,232-255,257-268`: matches. `focus.yml:27-29,121,130`: matches. `vocab.yml:170-181`: matches.
- 2, `HUB_LIST` at `hub-names.ts:711-750` (`grep -n "const HUB_LIST\|^];"`): it is at 712-760.
- 3, every site (`manifest.ts:625`, `new-project.ts:81`, `Projects.svelte:362`, `NewIdeaForm.svelte:72`, `entry-add.ts:83,89,158`, `new-entry.ts:152,214`) and `vocab.yml:223-226`: match. Premise 3 omits `write-files.ts:157-178` (see check 1).
- 4, `focus.ts:306-320` (`movable`, comment 306-312, body 313-319) and `:348-380` (`moveOnto`, comment 348-357, body 358-385): match within a few lines.
- 5, the flag lines in `vocab.yml:64,133,146,163,164,166`, `manifest.ts:683`, `new-entry.ts:90`, `lead-application.ts:37`, `leads.ts:36-39,41-44,51-54`, `vocab.ts:124,168,171,186` and the options file `:63,113,116,134,137`: match. `grep -c dismissed ~/workspace/research-hub/.oculus/data/academic/leads.yml` prints 0, which matches.
- 6, `vocab.yml:245-252`, `categories.ts:47-57` (`colourOf`) and `:134-151` (`railCount`): match. The `python3 -I` program over the `stages:` map printed `in-review submitted #0ea5e9`, `in-flight de-risking #16a34a`, `idea nascent #7c5cff` and `released released #0d9488`, with rail rows `['in-flight']`. This matches the brief.
- 7, `CrossLinks.svelte:53-58` and `ticker-lines.ts:13-22`: match.
- 8, `Focus.svelte:227-300` order: matches (Career, CommandCenter, Tasks, QuickAdd, the `said` line, awaiting, Band, Empty, Lanes). `behavior.yml:38-61` (`grep -n "^focus:\|applications_sent"` prints 38 and 59): matches. `merge.ts:120-124`: matches (the doc comment of the merge).
- 9, `grep -n "^[a-z_]*:" ~/workspace/research-hub/.oculus/config.yml` prints `scan`, `new_project_dir`, `portfolio_deck`, `audit`, `linkedin_dir`, `docs`, `lint`, `slurm`, `wallpaper` and `leads_fit`, none of the listed keys, which matches. The brief does not say the workspace file was checked. `.oculus/workspaces/research-hub.yml` `settings:` holds `self`, `theme`, `code_theme`, `rice`, `terminal`, `wallpaper`, `status_bar`, `editor`, `show_tabs` and `editor_actions`, and no `rail`, `boards` or `focus`. So the premise holds for the workspace file too.

Findings: `layout.yml:227-308` should be 227-299. The rail entry at `:10` should be `:11`. `hub-names.ts:711-750` should be 712-760. Item 10 also takes for granted a "test file of the vocab check" where `focus_lanes` findings are tested. `git grep -n "focus_lanes" -- tests` hits only `hub-vocab.test.ts` (the G126 merge) and `config-folder.test.ts:222` (the key list). The lane-shape findings (`vocab.ts:60-75`) have no test, and no such file exists.

## 4. Cases and checks

- Case 1: consistent, except the `said` line. Item 8 and decision 3 move it from below Quick add (`Focus.svelte:262-266`) to above the first section, and case 1 says the Focus page is the same before and after except `dismissed`.
- Case 2: "Test (G116 or the registration's test file, named in the report)". This leaves the entry undecided. Under "What every package obeys", a test exists only as the test of an entry that names it, and the builder writes no other test. No entry names a board registration test.
- Case 3: consistent (G116).
- Case 4: the `unplaced_*` rows are under G13, not the G116, G124 and G126 that item 10 names. New `it` titles there need G13's Test line, which is the orchestrator's. The two-flagged rule, "the boards in the first one's group", decides by list position, unlike decision 4 for the single-use flags.
- Case 5: "Test (G124 'the Focus lanes' or the vocab check's file)" leaves the file open, and the vocab check's file does not exist (check 3). `cluster: later` also breaks the options catalog's `cluster` choice `[now, parked, incubate, idea]` (check 1).
- Case 6: "Test." names no file or entry.
- Case 7: "a new project written from a form naming no tier names no tier". `createIdea` refuses an undefined tier (`manifest.ts:625-631`, `idea_tier` refusal), and the status words are keyed by the tier (`idea_status_${tier}`). The case expects a behaviour no item builds. The test (G8 `tests/server/edit/writes.test.ts`, rows at `:672` and `:731` "a write that names no tier") is outside the paths.
- Case 8: under G124, "With `tier: [personal, software]`: none written, the form asks" cannot be reached. `offersNewProject` asks whether the board takes the project the write makes (`new-project.ts:64-81`), and `takes.ts:133` refuses a project with `tier === undefined` on a board naming tiers, so New project is not offered at all. `NewIdeaForm.svelte` also has no tier field (its `{#if tier !== undefined}` at `:142` only adds Folder), so nothing would ask.
- Case 9: the "Add off" half is a DOM behaviour, which is for the look. "a test of the function that picks it" names no entry (`hubsTaking` is under none).
- Cases 10 and 11: consistent (G124).
- Case 12: "the apply control drawn disabled" is a DOM behaviour (look on landing), and it is drawn in `LeadCard.svelte`, outside the paths. "the vocab check's file" does not exist.
- Case 13: the finding comes from `categoriesFindings`, whose describe in `tests/data/sources/config/boards.test.ts:143` is named by no entry. G116 names only describe 'boardsFindings'; G124 names 'the category of a project', a reader test.
- Case 14: G126's text covers maps, `categories` rows and named lists replaced whole, not a scalar. A `rail_color` row needs G126's text extended (the orchestrator's), and `in-place.ts` has no scalar shape (check 1).
- Case 15: consistent (G13 covers the config readers).
- Case 16: `config-folder.test.ts` reads the real hub only when `OCULUS_TEST_HUB` names one (`:590-591`, `it.skipIf(!REAL.asked)`). Without it the hub half is skipped.
- Item 10's G126 rows for `focus_clusters`: G126's Test line names the lists replaced whole, without `focus_clusters`, so its entry text needs extending too.

Findings: case 1 (the `said` line), case 2 (no entry), case 4 (G13 not named; a position rule), case 5 (the file is open and does not exist; the options choice), case 6 (no file), case 7 (an expected result no item builds; writes.test.ts and G8 outside the paths), case 8 (unreachable under `offersNewProject` and `takes.ts:133`; no tier field), case 12 (DOM; LeadCard outside the paths; no such file), case 13 (no entry), case 14 (G126 text; no scalar shape), case 16 (skipped without `OCULUS_TEST_HUB`).

## 5. The question

- Case 1: yes. It compares before and after on oculus's own config, which a build that still names boards, clusters or tiers by position also passes. It guards against regression and does not show the goal.
- Cases 2, 3, 5, 6, 10, 11, 13 and 15: no. Each feeds config that today's code cannot honour.
- Case 4: yes, in part. The two-flagged case passes with list position deciding the group.
- Case 7: no as written, but it cannot pass (check 4).
- Case 8: cannot pass as written (check 4).
- Case 9: yes. A test of a pick function passes while `write-files.ts:157-178` keeps "else the first hub's" and the palette's Add Task keeps its first row.
- Case 12: yes. A unit test of the one-word reader passes while `LeadCard.svelte` draws the control enabled.
- Case 14: yes. It passes on one hub while `hubWords` drops `rail_color` from a second hub's words.
- Case 16: yes. It passes with the real-hub rows skipped.
- Verify 1 (`npm run test:quick`): yes. It runs only the tests that reach the changed files.
- Verify 4 (the `.at(0)`/`[0]` grep): yes. It skips `selectors.svelte.ts` (`boardItemOf`), `career.ts` (`roleBoard`), `write-files.ts`, `rail.ts` `unplacedPage` (`.find`) and any first-of-list written as `.find(...)` or by destructuring.
- Verify 5: yes. It misses `vocab.ts:265`, `options vocab.yml:224` and `:276` (check 1).
- Verify 6: no. `grep -rn 'Z10[0-9][0-9]\|ruling 3[0-9][0-9]\|\bO7[0-9]\b\|\bO8[0-9]\b' src config docs tests --exclude=local.yml` prints nothing on main, so the check stands.
- Item 1: yes. It passes with `Projects.svelte:224` still building the pane title from `views.${id}`, and the two-flagged rule reads the first entry.
- Item 2: yes. It passes with the options catalog's `cluster` choice fixed to the four words, so "a reader changes them in Settings" is not reached.
- Item 3: yes. Item 5's "with none, as today" leaves the no-default tier case at today's `tiers.at(0)`. It passes with `write-files.ts` and the palette keeping first-hub defaults.
- Item 4: no.
- Item 5: yes. It passes with `default_lead` (`leads.ts:26-34`) and `manifests` (`ticker.ts:227`) read as "the first word carrying it", both on this step's surfaces.
- Item 6: yes, for a second hub (`hubWords`, check 1). No for oculus's own config.
- Item 7: no.
- Item 8: no.
- Item 9: yes. It passes with the sentences verify 5 misses.
- Item 10: yes. It passes with tests named under no entry (cases 2, 13) and with G13 and G126 not extended.

Findings: case 1; case 4; case 9; case 12; case 14; case 16; verify 1; verify 4; verify 5; items 1, 2, 3, 5, 6, 9 and 10, each as above.

## 6. Implied inputs

- A `boards:` key equal to a built-in view id or a collection key: missing. Expected: a finding naming the board, and the board is not registered, as `registerCollections` leaves out a key a module registers (`src/routes/views.ts:85-101`).
- A Settings edit or config push that adds or removes a board while the page runs: missing. Expected: the registrations follow the pushed config as the collection views do, and a removed board's open tab acts as a removed collection view's does.
- `project_boards` that is not true or false: missing (case 4 covers none and two). Expected: a finding beside `unplaced`, and the entry kept without the flag.
- A `focus_clusters` row whose `label` or `glyph` names no catalog word: missing. Expected, as for a board under Z1022: a finding naming the row and the field, drawn with its key or with no glyph.
- A `focus_lanes` row with no `cluster:` (`cluster` is optional in `vocab.ts:42`): missing. Expected: a finding naming the row, or the lane drawn in no cluster, stated.
- `move_writes.stage` naming a word a hub removed: missing. Expected: the word leaves `move_writes` as it leaves a lane's `stages` (`dropRemovedWords`, `hub-layer.ts:290`, which follows the options entry's `from:`), with a finding only in a hub-written list, and the lane takes no move.
- A single-use flag carried by one word in oculus's file and one in the hub's: missing. Expected: the finding names the file that gives the second word (the hub's), as item 5 says for one file.
- One hub offered that is not the primary, and a workspace with no primary (`primary()` null): missing. Expected: the one hub is chosen ("with one, it writes there", `hubs.ts:9-10`), and with no primary none is chosen and the form asks.
- `default: true` on no tier, after a hub replaces `tiers`: item 5 says "as today", which for tiers is `tiers.at(0)`. Expected: no default tier; a form naming none asks, and the server refuses a write naming none.
- `rail_color` of the wrong kind or not a hex the palette maps, and two hubs giving different `rail_color`: missing. Expected: a wrong-kind finding with oculus's value standing; with two hubs, the colour of the merged config (the primary's), stated.
- `sections:` that is not a list, and `sections: []`: missing. Expected: a G13 finding with the default used; with an empty list, nothing drawn and the `said` line placement stated.
- A text-catalog key named by a board's `label:` while the language layer replaces the catalog: not needed, since the catalog lookup is the same.

Findings: each of the above except the last is missing from "Cases".

## 7. ADRs

- `ls docs/adr` prints `No such file or directory`. `.agents/plan.yaml` names no `adr` key (`grep -n "adr" .agents/plan.yaml` prints nothing). No record exists, and the brief says so at line 5.

Findings: none.

## 8. Dictated text

`LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/briefs/O80.md` prints nothing.

- Item 1's words `views.projects`, `views.projects_glyph`: `grep -n "\`views.projects\`, \`views.projects_glyph\`" O80.md` prints 36. Holds.
- Item 2's rows (`now` ... `idea`): `grep -n "Oculus's rows: \`now\`" O80.md` prints 37. Holds, and they match today's drawing (`Lanes.svelte:232-268`).
- Item 4's rows (`run { stage: exploring }` ... `idea { stage: nascent }`): `grep -n "run \`{ stage: exploring }\`" O80.md` prints 39. Holds, and each is today's first word of the lane (`vocab.yml:172-181`).
- Item 6's colours and `rail_color` `"#16a34a"`: `grep -n "Colours (ruling 394" O80.md` prints 41. Holds (the `python3` output in check 3).
- Item 8's section words `career`, `command_center`, `tasks`, `quick_add`, `awaiting`, `band`, `lanes`: `grep -n "\`career\`, \`command_center\`" O80.md` prints 43. Holds as ASCII config values. These are config words the view knows in code. The Conventions line says "No config word ... is written in code", so the brief accepts this closed set without saying so. The same holds for `columns`, `full_width` and `title` in item 2.
- Case 2's `theses: { tier: research, label: views.projects, glyph: views.projects_glyph }`: `grep -n "theses: { tier: research" O80.md` prints 52. Holds.
- Case 5's `{ key: later, label: focus.cluster_parked, muted: true, layout: columns }`: `grep -n "{ key: later, label: focus.cluster_parked" O80.md` prints 55. Holds.
- Case 10's `{ key: push, stages: [in-prep, submit-ready], move_writes: { stage: submit-ready } }`: `grep -n "{ key: push, stages: \[in-prep, submit-ready\]" O80.md` prints 60. Holds.

Findings: none that breaks a rule. The closed sets in item 8 and item 2 sit unstated against the brief's own Conventions line (judged under "Declined to judge").

## Declined to judge

- Whether `default_lead`, the `ticker_categories` flag `manifests`, `boardItemOf`'s first-board fallback and `roleBoard`'s first matching board are inside this step. All four are list-position or first-word readings on its surfaces, but rulings 388 and 393 list neither. That is the session's or Axel's scope call.
- Whether item 8's closed set of section words and item 2's `columns`/`full_width`/`title` words count as "config words written in code" under the Conventions line, or as a fixed vocabulary of the view such as a control word. The rulings do not settle it.
- The size of `focus.ts` (612 lines) and `Lanes.svelte` (351 lines) after the change, against the 880 and 520 limits. That can only be judged once the change is written.

Agent usage: a7ff83e77970b8a37, claude-opus-5-5, 281640 tokens, 100 tool uses, 13 min 38 s.

## Closed (the session's change to the brief for every finding above, and each dictated line added after the check, made before the preparation commit)

- 1, the registration wiring and the five `registerAll` tests: item 1 now registers the boards through one function under `src/lib/state/boards/board/` and the page data, as `registerCollections` does, following a config push; `src/routes/views.ts`, `+page.svelte`, `+page.server.ts` and the five tests are in the paths; premise 1 names them; case 18 added.
- 1, `Projects.svelte:224` and `keys.test.ts:302-305`: item 1 has the pane title read the board's `label:`; item 10 names the key check's credit; premise 1 names both.
- 1, the `cluster` choice list and `vocab.ts:45`: item 2 makes the choice read the keys of `focus_clusters`; case 5 says Settings offers `later`; premise 2 names both.
- 1, `rail_color` and `VOCAB_SHAPES`/`hubWords`: item 6 adds a scalar shape to the merge so each hub's records carry its own value, with a wrong-kind finding; `src/lib/data/index.ts` in the paths; case 14 has the wrong value; premise 6 names both.
- 1, `LeadCard.svelte`: in the paths; item 5 names it for the disabled controls.
- 1, `NewIdea.svelte:11`, `docs/apps.md:452`, `writes.test.ts:625`: item 3 and item 10 name them; in the paths.
- 1, `hubs.ts:7-11` and `write-files.ts:157-178`: item 3's hub rule now takes the one hub offered, then the primary, else none, at every site, `write-files.ts` included, with a refusal where several hubs are open and no primary takes the write; premise 3 names them; case 9 extended. The palette's first selected row is kept, item 3 says why.
- 1, `vocab.ts:265`, options `vocab.yml:224,276`: item 3 and item 6 name them; verify 5's grep widened.
- 1, `config-folder.test.ts:215-235`, `boards.test.ts:148-154`, `data-map.md:80`, `vocab.yml:4`: item 9 and item 10 name each.
- 1, `rail.test.ts` (G13) and `tests/routes/edit/rail.test.ts` (G8): item 10 names each with its entry; in the paths.
- 1, `manifests` and `default_lead`: item 5 includes both, since the step line says "each single-use flag"; premise 5 names them.
- 1, `boardItemOf` and `roleBoard`: outside every ruling of the step; raised as open item 423 (kind 6) in the state file, named under "Not changed".
- 3, the line ranges `layout.yml:227-299`, the rail entry `:11`, `hub-names.ts:712-760`: corrected in premises 1 and 2.
- 3 and 4, the vocab check's test file: item 10 names a new file `tests/data/shapes/catalog-files/vocab.test.ts` under G13 for the vocabulary's shape findings, every case names its file.
- 4, case 1 and the `said` line: item 8 and decision 3 keep it after Quick add, at the top only when `quick_add` is not listed.
- 4, cases 2, 5, 6, 13: each names its file and entry (item 10).
- 4, case 4 and the position rule: kept as Z1024 rules (the first flagged read when two are, with a finding); changing it reverses a ruling, so it stays; decision list unchanged on it.
- 4, cases 7 and 8: rewritten; case 7 expects the `idea_tier` refusal, case 8 expects New project not offered; decision 8 says why no tier field is added.
- 4, cases 9 and 12: the DOM halves go to the look on landing; case 9 is a case-run program, case 12 tests the finding and the reader.
- 4, case 14 and G126: case 14 names `hub-vocab.test.ts`; the orchestrator extends G126's text at landing.
- 4, case 16: rewritten with `OCULUS_TEST_HUB`; verify 8 added.
- 5, verify 4 and 5: widened to `write-files.ts`, `ticker.ts`, `hubs.ts`, `.find(` and the missed phrases; `selectors.svelte.ts` and `career.ts` are open item 423.
- 5, items 1, 2, 3, 5, 6, 9, 10: closed by the changes above.
- 6, the implied inputs: a board key equal to a view id (item 1, case 17); a config push (item 1, case 18); `project_boards` not boolean (item 1, item 10); a cluster row naming no word and a lane naming no cluster (item 2, case 5, decision 9); `move_writes` after a hub removes a word (item 4); a flag on one word in oculus's file and one in a hub's (item 5, item 10); one non-primary hub and no primary (item 3, case 9); no default tier (item 3, case 7); `rail_color` of the wrong kind (item 6, case 14); `sections:` not a list and empty (item 8, case 15).
- Declined to judge, the closed word sets of item 8 and item 2: decision 7.
- Dictated lines added after the check: the case 5 row and case 17's `focus` key reuse the forms the check held; no other line is dictated.
