# Brief check of O60 (`.scratch/migration/agents/briefs/O60.md`, uncommitted), on main at b0536bf5

`git rev-parse HEAD`: `b0536bf54b9c474727b7e0d381c19b1ed21f5591`. I changed nothing. Every read and command ran in this session. Read-only git only, plus `wc`, `grep`, `sed`, `diff`, `ls`, and a yaml key listing of the hub's two settings files (read only). I did not touch `config/local.yml`.

## Names

1. **The Settings write refuses every new option file name.** `src/lib/server/edit/writes/config/config-place.ts:213`: `if (file === LOCAL_NAME || file !== basename(file)) return null;`. So `optionOf` answers null for `catalogs/vocab.yml`, `catalogs/glyphs.yml` and `schemas/manifest-schema.yml`, which are the names Decision 2 and item 7 give. Item 7 bullet 3 says "The Settings view ... edits it", and that edit cannot land without changing `config-place.ts`. That file is not in "Paths this step writes".

2. **The hub write is stored whole, which is wrong for a value that now merges by shape.** `src/lib/server/edit/writes/config/config-value.ts`, `storedForm`: `if (place.layer === 'hub') return seen;`. Its head comment at `:12-13` says the same ("a key of the hub list in the primary hub's settings file, as the whole value").
   - Under item 1's merge by word, a word removed in the Settings view is written as the whole remaining map. That map holds no `<word>: null`, so oculus's row comes back.
   - The workspace form (`familyOverride` and `recordsOverride` of `keyed.ts:122-149`) is the inverse of the workspace-first order only. It is not the inverse of the new in-place merge that item 4 uses for the six catalogs.
   - `config-value.ts` is not in the write list. The change makes its head comment false. It is under G8 (Code: `src/lib/server/edit/writes.ts and writes/`).

3. **The workspace's agents value never reaches the composer or a start.** The agents catalog is parsed from the engine file, not from the merged config:
   - `src/lib/server/machine/pty/start/compose.ts:80-88` `readAgentsFile(engine)` reads `join(configDir(engine), AGENTS_FILE)`.
   - Its callers are `compose.ts:264` (`handleAgents`, `GET /api/agents`) and `src/lib/server/machine/pty/routes.ts:283` (the start).
   - The brief lists `compose.ts` "only if the confirm rule of item 4 needs it". It does not list `src/lib/server/machine/pty/routes.ts` or `src/routes/api/(sessions)/agents/+server.ts`.
   - `parseAgents` takes text (`catalog/agents.ts:68`). Item 4 says "the merged value is read by the catalog's own reader", but that reader takes no value.

4. **The page's first load is built in a file the brief does not name.** `src/routes/+page.server.ts:62` builds `const text = platformText(textCatalog(config));` and `:64` builds `const hubs = locals.server.configCache.vocab();`. Item 5 bullet 4 and item 2 bullet 1 need both. The write list names `config-seed.ts` and `context.ts` for "the first load's `hubs` and `text`", but `config-seed.ts` only types the parts (`:33-34`). The values are made in `+page.server.ts`, which is also in O63's write list.

5. **The reader list misses files that the brief's own three greps find.** Rebuilt from the exports of `tones.ts` and `vocab-keys.ts`, plus `config(\?)?\.<vocab key>`, with `git grep -lP` over `src`: 35 + 29 + 16 hits, union 67 files. The brief says 50. The 17 files beyond the brief's 50 (`comm -13`) include real readers:
   - `src/lib/state/client/socket.svelte.ts:381` `setVocab(payload.config, payload.hubs)` and `src/lib/state/shared/page/install.ts:36` `setVocab(data.vocab, data.hubs)`. These are the installers whose call changes if `setVocab` changes.
   - `src/lib/state/boards/board/filter-menu.ts:83` and `src/lib/views/feeds/radar/Bucket.svelte:50`, `RadarIntro.svelte:35` call `toneOf` (the palette becomes a hub key). `src/lib/views/boards/focus/Band.svelte:63-65` calls `namedTone` (`focus_lane_tones`).
   - `src/lib/data/snapshot/validate.ts:234,296,490` (`closestWord`, `vocab.stages`), `src/lib/data/snapshot/references/scan.ts:306` and `src/lib/data/snapshot/schema/static.ts:51` (`vocabSource`).
   - Two more readers that none of the three greps reaches: `src/lib/views/structure/pillars/Pillars.svelte:69` `venueTiers(configMap().venue_tiers)` (item 2 names "its venue tier"), and `src/lib/server/edit/feeds/feeds.ts:454` `radarBucketKeys(engineConfig)` reading `engineConfig.radar_buckets`. With that reader, a hub's own Lit Watch bucket is refused by the radar write.
   - The domain lookups `src/lib/state/life/present.ts`, `Summary.svelte` and `DomainCard.svelte` are per hub already and need no change.
   - None of these is in the write list. The step writes them only through the "grep reaches" clause, so item 2 bullet 6 ("each of the 50 reader files") can be met while they read the primary's or oculus's list.

6. **The new-project form is not on the write list, and the change makes its comment false.** Case 8 asks that form, with `home` chosen, to offer `home`'s stages and fields. The form is `src/lib/views/shared/forms/NewIdeaForm.svelte` (`:3-18`, the Hub field from `hubsTaking`), and its head comment says another hub is one "whose settings the page does not hold" (`:14`).

7. **`HubVocab` and `HubVocabs` have readers outside the write list.** `git grep -lw "HubVocab\|HubVocabs" -- src tests` gives 13 files. Off the write list: `src/lib/state/client/selectors.svelte.ts`, `src/lib/state/shared/page/install.ts`, `src/lib/state/shared/words/themes.ts`, `src/lib/state/workbench/layout.svelte.ts`, `src/lib/state/workbench/layout/tabs/instances.ts`, `src/lib/state/workbench/layout/tabs/left-out.ts`, `src/routes/views.ts`. Each is type-only or a reader of the domains. They are hit only if a field becomes required in a literal they build; no test builds one (`git grep -lE "venue_themes|data_themes" -- tests`: 0).

8. **Sentences outside the write list that the change makes false.** `git grep -nE "replac(es|ing) oculus's (value )?whole|as the whole value|..." -- src docs config README.md`:
   - In the write list: `hub-names.ts:356`, `hub-layer.ts:3`, `workspace-layer.ts:9`, `docs/HELP.md:522`, `docs/data-map.md:80` ("these 27 keys").
   - Off it: `config-value.ts:13` (finding 2).
   - `config/defaults/sources.yml:4` stays true (it speaks of the sources keys only).

9. **The new names collide with nothing.** `localizations` has 0 hits. `locale` appears only in prose about the process locale (`tmux.ts:42`, `recover/local.ts:60`, `registry.ts:57`, `table-rows.ts:32`), not as a key. `manifest_fields` has 0 hits.

10. **Folders at the ten-item limit.** `git ls-files ... | awk -F/ ... | sort -u | wc -l` shows `src/lib/server/machine/apps/` at 10 items and `src/lib/server/machine/apps/read/` at 10. The brief's "a new module that reads a localization's folder, beside `routes/theme.ts`'s reader" fits only in `routes/` (7 items) or `read/theme-files/` (2). In `apps/` or `read/` it fails `utils/folder-check.sh`. `src/lib/data/sources/config/merge/` holds 8 items, so the brief's two new files reach exactly 10, and any third (for example a separate `manifest_fields` merge) needs a subfolder.

11. **Shared files with O63 (in flight, `.agents/worktrees/migration-O63`, `git status --short` there).**
   - **Incomplete list.** The brief's O63 bullet lists `hub-names.ts`, `vocab.yml`, `vocab.ts`, the two options files, `findings.yml`, `server.yml`, the documents and `config-folder.test.ts`. O63 also changes these files on O60's write list:
     - `src/lib/data/sources/config/merge/workspace-layer.ts` (`flaggedItems`, `:166-174`)
     - `src/lib/data/model/index.ts` (the `AuditKind` comment)
     - `src/lib/data/shapes/catalog-files/options.ts`
     - `src/lib/data/sources/config/catalog/options.ts` (+42 lines)
     - `src/lib/state/system/config/rows.ts` (`writtenWhole`, `mismatchMessage`)
     - `src/lib/server/root/context.ts` (import path)
     - `config/options/appearance.yml`
     - `src/routes/+page.server.ts` (comment only)
     - `tests/state/boards/board/board-rules.test.ts` (G124's test)

     O63 also changes `src/lib/server/edit/writes/config/config-value.ts` (findings 1 and 2), `src/lib/data/shapes/catalog-words.ts` and `value-rule.ts`. O63's brief also lists `schemas/engine.ts` and `groups.ts`.
   - **Requirements that land in parts O63 rewrites:**
     - (a) Item 8 asks for the `HUB_LIST` comment to be rewritten, and O63 rewrites the same paragraph (`hub-names.ts:357-364` in its diff). O63's version still names "the career card's host statuses, score axes and score hues", which are gone on main.
     - (b) Item 7 bullet 4 asks for "the comment at the top of each options file", and O63 rewrites the same two head-comment lines of `config/options/appearance.yml` (`:10-11`, the controls, adding `words`).
     - (c) O63 adds a `words` control (a word block) to the controls and the Settings rows. The `categories` rows that O60 must describe in `config/options/catalogs/vocab.yml` (item 7) are made of word blocks (`stages: { words: [...] }`). Built on main without O63, the `categories` family has no control for them, so the result depends on which step lands first.
     - (d) `docs/data-map.md` (66 lines changed in O63) and `docs/templates.md` (44) are the same hub-key table and template that item 8 rewrites.
   - **`portfolio.ts`.** O63 deletes `src/lib/server/root/watch/portfolio.ts` and adds `portfolio/portfolio.ts` (850 lines). Its `hubs` and `text` lines (`:608-628` there) are moved unchanged, so O60's requirement lands in a part O63 moves but does not rewrite. Whichever lands second carries the other's lines across a modify/delete conflict. The write list names only the old path, and the "at or under its base's 880" check is against the old file.

## The step line

1. "the `vocab.yml` lists and `roles:` join the hub list": item 1.
2. "a hub's `config.yml` may add fields to the project form": item 3.
3. "the workspace's `settings:` may set `agents`, `file-nesting`, `latex`, `unimath`, `glyphs`, `icons`": item 4, under key names Decision 1 takes.
4. "and the interface words": item 6.
5. "`config/options/` describes each new override so it is checked as the others are": item 7.
6. Rulings 297, 298, 299, 304 and 309, and "`localizations` ... `locale`": items 1, 3 and 5.
7. Step 0 at `plan.md:729` (raise an open item on multi-language): no build requirement; answered by rulings 297 and 309, built in item 5.
8. `:730` and `:731`: rulings, mapped to items 1, 3 and 5.
9. `:732` (Z468, no primary): item 2 bullet 1 and case 6.
10. `:733` (categories by key, "`<key>: null` removes one"): item 1 bullet 2, with the removal form of Z989 (`{ key, removed: true }`), which supersedes the line's words.
11. `:734` (`publication_kinds` moves in O63): item 1 leaves it out.
12. `:735` (O68's keys gone): a premise, with no requirement.
13. `:736`, `:738` to `:741`, `:742` to `:748` (open items 309 to 312 and 323 to 327, Z977 to Z979, Z985 to Z989): items 1 to 5 and 9 and G126.
14. `:737` ("if O63 is still in flight then, its paths ... are compared under the same rule"): the brief's O63 bullet, which is incomplete (Names 11).
15. Ruling 214 (a)'s clause "the fields oculus reads or writes keeping their shape", which the brief's summary leaves out: covered by item 3's finding for a row naming a field `manifest_schema` has.
16. No part of the line is without a requirement.

## Premises

1. **Holds.** `ls docs/adr`: "No such file or directory". `grep -rn "career_score\|career_host" config src --exclude=local.yml`: no output.
2. **Holds.** `wc -l` of the merge folder: `merge.ts` 225, `options-folder.ts` 112, `hub-layer.ts` 93, `workspace-layer.ts` 282, `keyed.ts` 149. `textCatalog` is at `text.ts:162`.
3. **`HUB_LIST` holds; the schema half does not.** `HUB_LIST` is at `hub-names.ts:365-390`, and its vocab rows are `statuses`, `chips`, `lead_statuses` and `leads_fit` with `catalogs/vocab.yml`. `grep -rn` over `config/options` finds no option entry for them. But "the editor's schema (`engine.ts:138-149`) do not show or validate them" is **false for validation**. `engine.ts:111-116` `catalogKeySchema` and `:146-148` give each hub key of a catalog file "that file's shape", per the doc comment at `:130-133`. The hub's `.oculus/config.yml` schema already validates those four keys by the vocab.yml shape.
4. **Holds.** `grep -nE "^[a-z_]+:" config/catalogs/vocab.yml`: palette 9, stages 64, forms 81, chips 92, statuses 110, lead_statuses 163, focus_lanes 172, priority_levels 186, fund_stages 193, focus_lane_tones 199, tiers 203, research_audit 210, roles 214, categories 225, publication_kinds 236, data_access 249, venue_categories 253, venue_tiers 254, radar_buckets 261. The other catalogs' top keys are as stated.
5. **Holds.** `ls config/options`: the six files. The `appearance.yml` family is at `:8-12`, and `CONTROLS` is at `catalog-words.ts:8-24`.
6. **Holds, with an omission.**
   - `readOtherHub` is at `index.ts:545`, and `portfolio.ts:636-640` (others) and `:790-796` (`scan(other.key, other.dir, other.portfolio.merged)`) are as stated. `configOptions` is at `paths.ts:61`, and `config-cache.ts:59-62` is `hub: HubSettings`.
   - Omitted: `src/lib/server/root/watch/build.ts:129-170` `buildHubs` already builds each hub's snapshot with that hub's own config (`readHub(one.dir, one.portfolio, ...)`, `builtHub`). So `normalise`, `validate` and the manifest JSON schema (`engineSchemas(raw, config)` in `index.ts:470`) already read the record's hub's values. Item 2 bullet 5 presents this as work to do.
7. **Holds.** `model/index.ts:260-291` (`ConfigPayload.hubs`, `HubVocab`, `HubVocabs = { primary, lists }`). `hubVocabOf` :611, `hubVocabs` :641, `workspaceVocabs` :666. `portfolio.ts:660-665`, `config-seed.ts:33`, `context.ts:189`. `setVocab` :111, and `tones.ts` is 319 lines. `rootOf` :22 and `hub-names.ts:10-13` (every record carries its hub in `root`) hold.
8. **Not reproduced.** "50 files (the union of three greps)": the three greps give 67 (Names 5).
9. **Holds.** Seven sections in `manifest-schema.yml` (`sed -n '/^  sections:/,/^  fields:/p'`). `schema.ts` 474, `snapshot/schema/manifest.ts` 166, `writes/manifest.ts` 735.
10. **Partly holds.** `text.ts` is 120 lines, and `setCatalog` (:23), `lookup` (:58) and `t` (:72) are there. But "positional `fillPlaceholders` at `:72`" is imprecise: `:72` is `t`, and `fillPlaceholders` is imported at `:12` from `data/helpers/finding-text.ts`. `portfolio.ts:665` holds. The first-load `text` is at `+page.server.ts:62` (Names 4).
11. **Holds.** Contributes readers: `reader.ts` 485, `reader-tools.ts` 386, `shape-tools.ts` 153, `shape.ts` 99 (and `place.ts` 29). `docs/apps.md:182` "### The points", the table at `:184-207`, `languages` at `:195`. `theme.ts:41-54` `appThemeOf`.
12. **Holds.** Workspace `settings` keys: `self`, `theme`, `code_theme`, `rice`, `terminal`, `wallpaper`, `status_bar`, `editor`, `show_tabs`, `editor_actions` (yaml listing of `research-hub/.oculus/workspaces/research-hub.yml`).
13. **Inexact.** "`confirm: true` on acceptEdits, auto, bypassPermissions and the other values that make the agent ask the reader less": `grep -n "confirm: true" config/catalogs/agents.yml` marks `:34`, `:35`, `:42`, `:77`, `:86`. The value `dontAsk` (`:37`, "Don't ask") carries none. G39 is at `guarded.md:110`.
14. **Holds.** G83 at `:61`. 124 entries (`grep -c "^- G[0-9]*\."`). G125 is O63's (Z981, `plan.md:2625`).
15. **Holds.** `portfolio.ts` is 880 lines and `index.ts` 682. `tests/data/sources/config/` holds 9 items and `src/lib/state/shared/words/` holds 9.
16. **Incomplete.** The O63 bullet (Names 11).
17. **Holds.** The verify list: `.agents/plan.yaml:4` `verification: .scratch/migration/orchestrator-state.md`.
18. **Case 18's premise is wrong.** It says the hub sets "`leads_fit`, `statuses` and the others". The hub's `.oculus/config.yml` sets `scan`, `new_project_dir`, `portfolio_deck`, `publications_file`, `linkedin_dir`, `docs`, `lint`, `slurm`, `wallpaper` and `leads_fit`, the same on disk and in `git show HEAD:.oculus/config.yml`. No `statuses`, so `leads_fit` is the hub's only vocab key.

## Cases and checks

1. **Several cases test code that G126's Code line does not name, and some of it belongs to other entries.** `spec.md:59` and `guarded.md:3` say an entry keeps one test per unit its text and Code line name, and a test belongs to one entry. G126's Code line names neither the code of cases 8, 9 and 11 nor G126's own describes:
   - Case 8 tests `src/lib/state/forms/schema.ts` and `src/lib/state/boards/board/new-project.ts`. `new-project.ts` is G124's code, tested in `board-rules.test.ts`.
   - Case 9 tests the form, `src/lib/data/snapshot/schema/manifest.ts` (G64's code) and `src/lib/server/edit/writes/manifest.ts` (G8's code).
   - Case 11's "a start ... is still asked about first" is `compose.ts`, G39's unit (its test is a row of `tests/routes/sessions/compose.test.ts`).
2. **Item 9 contradicts itself.** It says "one test file per unit", but G126's Test line names four files for the units its Code line names: `hub-layer.ts`, `workspace-layer.ts`, `keyed.ts`, `text.ts`, the new merge, `data/index.ts`, `tones.ts`, the `localizations` reader and the language catalog.
3. **Existing entries whose Code lines name files on the write list go unnamed.** The brief names G12, G13, G39, G83 and G124, but not these (`awk` over each entry's Code line):
   - G8 (`writes/`, which includes `writes/manifest.ts`)
   - G32 and G14 (`src/lib/data/index.ts`, `src/lib/data/model/`)
   - G49 (`contributes/`, `reader-tools.ts`, `shape-tools.ts`)
   - G77 (`src/lib/data/helpers/files/apps/contributes.ts`; an approved, enabled, unchanged app's contribution, which the localization point is)
   - G61 (`config-cache.ts`, `context.ts`)
   - G64 (`snapshot/schema/manifest.ts`)
   - G96 (`localRows` in `rows.ts`)

   `spec.md:59` says a step that touches an entry's code runs that entry's test. G13's own workspace-layer test (`tests/data/sources/config/workspace-layer.test.ts`, describe 'the workspace layer of loadConfig') covers the file item 4 rewrites.
4. **Cases 17 and 18 need a page.** Case 17 ("The Settings view ... shows its rows ... and edits them") and case 18 ("the Focus, Projects and Leads views draw the same words and colours") are "runs the report quotes". `spec.md:64` says a builder runs no page, and a case only a page shows names the look on landing as its proof. The brief does not say which part of 17 and 18 is a unit-level run and which is the look.
5. **The report path contradicts the rules file.** The write list's `.scratch/migration/agents/reviews/O60-report.md` and the Report section's "Write it to `.scratch/...`" break `spec.md:36` ("You never edit anything under `.scratch/`"). O63's brief does the same (precedent), but the rules file is not reconciled.
6. **G126 is not ruled by Axel.** `guarded.md:3` says "A new entry needs Axel's yes", and `spec.md:59` says a step needing a new entry "stops and asks Axel". G126 rests on Z988, an automode ruling. G124 (Z974) and G125 (Z981) were made the same way, so this is precedent, not something new in this brief.
7. **Item 2 and verify item 5 ask the `vocab-keys.ts` helpers to "take the hub's name".** They are pure layer-1 helpers over a value or a config passed in (`vocab-keys.ts:32-181`, for example `wordsWith(config, key, flag)`). A pure helper given only a hub name has no per-hub values to read without module state, which runs against `spec.md:87` (no module-level mutable state shared across module graphs). The callers that already hold the record's hub's config (the per-hub server builds) need no name.

## The question

1. **Case 6 (no primary, each lead card its own `leads_fit`).** It can pass without Z468 reaching the page. As a row of `tests/state/shared/hub-words.test.ts` it feeds per-hub vocab to the client lookups by hand. It holds whether or not the server ships each hub's `leads_fit` in a no-primary workspace (`portfolio.ts` payload, `+page.server.ts:64`), and whether or not the lead card passes the record's hub. A card that names no hub reads the union, which gives both cards `lab`'s colour, the first hub's row.
2. **Case 7.** The same applies: a lookup row holds while a board's buttons are built from `configMap().stages` (the primary's).
3. **Case 11.** It passes on the unchanged tree. The start reads `agents.yml` itself (Names 3), so a workspace value never reaches it, and "still asked about first" holds because the override has no effect.
4. **Case 16.** It passes with nothing built beyond the shipped files.
5. **Case 17.** Run fully, it fails until `config-place.ts` and `config-value.ts` change (Names 1 and 2). As written ("shows ... and edits") a reading of `rows.ts` alone could pass it, since no edit command is named.
6. **Verify item 5** (`grep -rnE "stageColor|statusPalette" src` and a read of the lookups of `tones.ts` and `vocab-keys.ts`). It can pass by renaming those module variables, and it reads only the two modules. Direct reads of a vocab key from the primary's config on the client (`Pillars.svelte:69` `configMap().venue_tiers`, the board code passing `config.stages`) are not enumerated. A per-record lookup can be left reading the primary's value while the check passes.
7. **Item 2 bullet 6 (each of the 50 files, changed or left).** It can pass with the readers outside the 50 untouched (Names 5).
8. **Item 4.** It can pass with the merged `agents` value correct in `loadConfig` while the composer and the start read the file (Names 3).
9. **Item 7 bullet 3.** It cannot pass as written without paths off the write list (Names 1 and 2). A builder keeping to the list hands back either a refusal or a "not built" row.
10. **Item 5 bullet 4.** It can pass with the language laid over `portfolio.ts:665` only, while the first page load (`+page.server.ts:62`) and the server-side `t` of `hooks.server.ts:192-197` stay English (Implied 5).
11. **The step's own check.** The step line names none beyond "so it is checked as the others are". The brief's verify list (test:quick, ASCII, unused exports, folder and size) can be all green with items 2, 4 and 7 short, for the reasons above.
12. **Items 1, 3, 6 and 8, and cases 1 to 5, 9, 10, 12 to 15.** Each would fail if its merge, finding or override were wrong at `loadConfig`, provided the rows assert the merged value and the finding's file and key as written.

## Implied inputs

1. **How a Settings edit of a hub vocab key is written.** Expected: the hub file holds the edited words, plus `<word>: null` (or `{ key, removed: true }`) for each of oculus's words the reader removed, so that the merge gives back what the reader sees. The workspace catalogs need an inverse of the in-place merge, and the brief must say whether a reorder of a catalog map can be expressed at all, since the new merge keeps oculus's order.
2. **Where a hub key is written when the workspace has no primary, or for a hub other than the primary.** Today the write is refused with no place (`config-place.ts:117-122`, the comment at `:6-8`). Item 7 says "the hub keys on the hub's settings file" without saying which hub. Expected: the primary only, and with no primary a refusal, stated.
3. **The editor schema and the removal forms.** Expected: the schema of a hub's `.oculus/config.yml` accepts `stages: { nascent: null }` and `categories: [{ key: x, removed: true }]`. Today `catalogKeySchema` (`engine.ts:111-116`) gives the whole-file shape, which would underline both. Case 17 checks neither.
4. **A folder that is no hub, in a workspace with no primary** (`hub-names.ts:11-13`: such projects take the folder's name as their hub). Expected: their per-hub vocabulary is oculus's own. Without an entry they fall to the union, and a non-hub folder's `exploring` is drawn with `lab`'s "Experimenting".
5. **Which server words follow `locale`.** These cover:
   - the server-rendered text of `hooks.server.ts:192-197`, the `t` before the catalog reaches the page
   - the route refusals worded with `words(textCatalog(config), ...)` across `src/lib/server`
   - the first-load catalog at `+page.server.ts:62`

   Expected: one stated answer. If the page is English until the push, the first frame shows English words and then Dutch ones.
6. **What republishes on an app change.** The apps watcher is `src/lib/server/root/watch/apps.ts`, which O63 also changes. Item 5 bullet 4 republishes the catalog on an app's files, approval or enablement changing, but the brief names no path for the trigger.
7. **Which file a finding names when a workspace row is bad.** `latexEditingFindings` and `latexUnimathFindings` (`catalog/latex-editing.ts:16-35`) and the nesting reader name oculus's catalog file. Item 4 says the catalog's reader "reports what it cannot use as today", so a bad workspace row is blamed on `config/catalogs/latex.yml`. Expected: the finding names the workspace file and `settings.<key>`.
8. **The order O60 and O63 land in** (Names 11): the `words` control the `categories` options need, and the moved `portfolio.ts`. Expected: one stated order, and the path O60 writes on that base.

## ADRs

1. None. `ls docs/adr`: "ls: docs/adr: No such file or directory".

## Dictated text

The checks on the three lines: `sed -n 69,71p <brief> | LC_ALL=C grep -n '[^ -~]'` printed nothing (exit 1), so the block is ASCII. The history-word grep (before, used to, no longer, still, previously, ...) printed nothing. The 'not X but Y' and dash grep printed nothing.

1. **Line 69.** `grep -n "^- G126\." .scratch/migration/agents/briefs/O60.md` gives 69. It breaks two rules:
   - (a) It states that a workspace file's `settings:` is laid over oculus's "by the shape of each key: a map ... a new key after oculus's ... every other list replaced whole". That is false for the families the workspace layer keeps in its own order: workspace entries first, per `keyed.ts:5-11` and Decision 5 (`rail` by `page`, `themes` by `name`, every map family). Those keyed lists are neither "after oculus's" nor "replaced whole". The entry would be a sentence the change makes false (`spec.md:71`).
   - (b) It holds five guarantees in one entry: the merge, the per-hub reading, the added fields, the agents confirm and the display language. `guarded.md:3` says "One entry per guarantee".
   - Otherwise its prose holds (`spec.md:21`).
2. **Line 70.** ``grep -n '^  Code: `src/lib/data/sources/config/merge/`' .scratch/migration/agents/briefs/O60.md`` gives 70. It breaks two rules:
   - (a) "the merge of item 1" names an item of this brief, not a file. In `guarded.md` it would mean nothing, and `spec.md:21` asks for the actual file to be named.
   - (b) "the readers of `localizations` and of the language catalog" names no file, so "a step whose change touches an entry's code" (`spec.md:59`) cannot be decided against it. It also leaves out units the cases test (Cases and checks 1).
3. **Line 71.** ``grep -n '^  Test: `tests/data/sources/config/layers/hub-vocab' .scratch/migration/agents/briefs/O60.md`` gives 71. Two problems:
   - (a) Three describe titles are single-quoted but contain an apostrophe ('the vocabulary a hub lays over oculus's', 'the catalogs and words a workspace lays over oculus's', 'the words of each hub's records'). `guarded.md` double-quotes such titles (`:185`, "the user's role on a project"). This is a form mismatch with no rule of `spec.md` broken.
   - (b) Four test files against the units the Code line names break `guarded.md:3` ("one test per unit it covers") as the entry is written (Cases and checks 2).

## Declined to judge

- Whether Z988's automode creation of G126 is within the self-rule's reach. The kinds `plan-orchestration` "Self-rule" leaves open are in that skill, which I was told not to invoke and did not read.
- The plan's overall Goal. `plan.md:3` is "Execution ledger for `tools/oculus/DESIGN.md`", and I did not read DESIGN.md. "The question" is answered against O60's line and its rulings as the part of the goal this step delivers.
- Whether O60 or O63 should land first.

Usage: a27b945b801bfc89b, claude-opus-5-5, 277337 tokens, 97 tool uses, 12 min 56 s.

## Closed

- O60 waits until O63 lands (spec Steps 5, the merge judged not simple on Names 11: O63 changes `workspace-layer.ts`, `rows.ts`, the options shape and catalog reader, `config-value.ts`, `+page.server.ts`, `config/options/appearance.yml`, the `HUB_LIST` comment and the hub-key documents, and adds the `words` control the `categories` options need). Every finding of this report is closed in the brief its next /spec writes from main's head after O63 lands, from the draft kept beside the ledger records; this check is not run again (spec "The brief check" 4).
- O63 landed (commit 9c42ab10). The brief was written again from main at 9c42ab10, and each finding is closed in it as follows.
- Names 1: `config-place.ts` is on the write list, and item 7 says it places an option of an options file in a subfolder, `local.yml` still refused; case 17 checks the placement at the unit level.
- Names 2: `config-value.ts` is on the write list; item 7 says it writes a hub vocab key, and a workspace catalog key, as the inverse of the merge, with no reorder offered for a map merged in oculus's place (Decision 10); its head comment is in item 7's comment list; case 19 checks the write.
- Names 3: item 4 says the composer and the start read the merged `agents` value through the catalog's parser given a value; `compose.ts`, `pty/routes.ts` and the api agents route are on the write list.
- Names 4: `+page.server.ts` is on the write list, and item 2 and item 5 name `:62` and `:64`; case 21 checks the first load.
- Names 5: the reader list is rebuilt on main at 9c42ab10 from four greps plus the three readers no grep reaches, 68 files, inlined under "What is on the tree" and on the write list; item 2 names the installers, the pure helpers called with the record's hub's values, and `feeds.ts:454` with the hub's own bucket accepted; verify item 5 reads each of the 68 and runs the greps again.
- Names 6: `NewIdeaForm.svelte` is on the write list (inside the 68), with its head comment rewritten (items 2 and 8).
- Names 7: the six type readers of `HubVocab` and `HubVocabs` outside the 68 are on the write list.
- Names 8: `config-value.ts:13` is in item 7's comment list; the other places were on the list already.
- Names 9: holds, nothing to close.
- Names 10: the localization reader goes in `src/lib/server/machine/apps/routes/` (Decision 15); `merge/` takes at most two new files.
- Names 11: O63 landed first; the brief reads main after it (`portfolio/portfolio.ts`, 855 lines, no growth; the `words` control; the `HUB_LIST` comment and the hub-key documents as O63 left them).
- Premises 3, 8, 10, 13, 16 and 18: corrected under "What is on the tree" (the editor schema already validates by the whole-file shape and item 1 makes it accept the removal forms; 68 readers; `fillPlaceholders` imported from `finding-text.ts`; the five `confirm: true` lines and `dontAsk` without one; the O63 bullet gone; case 18 says the hub sets `leads_fit` among the vocab keys).
- Cases and checks 1, 2 and 3: Z990 splits G126 into G126 to G130, one guarantee each, each Code line naming files and each Test line one file per unit; the rows of cases 8, 9, 11 and 14 go to G124, G8, G64, G39 and G49, and item 9 names them; the brief's "What is on the tree" names G8, G14, G32, G49, G61, G64, G77 and G96.
- Cases and checks 4: cases 17 and 18 say which part is a unit-level run the report quotes and which is the look on landing.
- Cases and checks 5: the Report section says the report in the worktree's copy of the ledger is the one file under `.scratch/` the builder writes, as `plan-orchestration` Steps 4 "The builder" gives it.
- Cases and checks 6: G126 to G130 rest on Z990 (automode), as G124 and G125 did; the entries are added at landing.
- Cases and checks 7: item 2 says the helpers of `vocab-keys.ts` stay pure and each caller passes the record's hub's values.
- The question 1 and 2: item 2 has the server ship every hub's values with no primary as with one, and the board lists built from the union; cases 6, 7 and 20 are rows of G127 over the shipped values.
- The question 3 and 8: closed with Names 3; case 11 asserts the start reads the merged value (a new picker value asked about first).
- The question 4: case 16 stays as G12's guard over the shipped files.
- The question 5 and 9: closed with Names 1 and 2; case 19 names the write.
- The question 6: verify item 5 is the read of the 68 files and every lookup, with the greps run again.
- The question 7: closed with Names 5.
- The question 10: closed with Implied 5.
- The question 11: the verify list now holds verify item 5 over the 68 readers, and every case is a test row or a quoted run.
- Implied 1: Decision 10 and case 19. Implied 2: Decision 11 and case 19. Implied 3: item 1's last bullet and case 17. Implied 4: Decision 12 and case 20. Implied 5: item 5's last bullet, Decision 13 and case 21. Implied 6: item 5's last bullet names `watch/apps.ts`, on the write list. Implied 7: item 4 and Decision 14, case 22. Implied 8: closed with Names 11.
- Dictated text 1, 2 and 3: the entries are G126 to G130, one guarantee each; G126 no longer says the workspace's keyed lists come after oculus's; every Code line names files; titles with an apostrophe are double-quoted.
