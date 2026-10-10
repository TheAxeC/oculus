# Step D59 brief check (on main at c18415820)

Five findings come first because the builder cannot pass, or cannot do, part of the brief as it is written:

- **Check 3e can never pass.** Its first grep, `grep -rnE 'font-size: *[0-9]' src`, also matches nine percent and em sizes that the step leaves in place (check 3, finding 1).
- **Check 3d needs a git command.** It asks for `git show HEAD:<old path> | shasum`, but `spec.md:32` and the brief's own line 157 forbid any git command, and the base copy has no `assets/` folder to compare against (check 4, finding 1).
- **One premise names a file that does not exist.** `src/lib/data/sources/roots.ts` is missing; the calls are at `src/lib/server/files/roots.ts:69` and `src/lib/data/index.ts:333` (check 3, finding 2).
- **The path list leaves out the code the side-project page needs.** That includes `:goto` in `CommandRows.svelte`, the project lookup behind `api/docs`, and the `SideProject` record, which has no `folder`, `deck` or `docs` (check 1).
- **Axel's own Help page would not change.** A Help page already saved keeps its tabs until Reset, so the cases can pass while his page still shows no documents (check 5, finding 1).

## 1. Names

Commands, run from the hub root. Every grep below used `grep -rn --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.agents --exclude-dir=secrets --exclude=local.yml`; that prefix is written as `grep ...`.

**Old asset paths.** `grep ... -e 'assets/memories' -e 'assets/wallpaper' .`
- Outside the ledger, the hits are `tools/oculus/config/appearance.yml:59,75`, `config/catalogs/options.yml:68,135` and `tests/routes/docs/memories.test.ts:4`. All of these are in the write list.
- `tools/cockpit/**` also matches. Those lines name the cockpit's own `assets/` folders, so the move does not make them false.
- Ledger hits under `tools/oculus/.scratch/` are history and stay true.
- HELP.md, DESIGN.md, README.md and `tools/oculus/docs/*.md` do not name the old folders: `grep -n "assets" HELP.md DESIGN.md README.md docs/*.md` printed nothing.
- `ls -la tools/oculus/assets/wallpaper` shows a `README.md` among the images. It moves byte-unchanged with them, and it says "`config/appearance.yml` selects the directory".

**The two keys.** `grep ... -e 'memories\.dir' -e 'wallpaper\.dir' .`
- `config/catalogs/options.yml:64,131` are in the list.
- `src/lib/state/system/config/editors/sources.ts:75` (`wallpaperDir`, the Settings view's wallpaper suggestions) is outside the list. It reads the key and stays true.

**The config cache.** `grep ... -i -e "config cache" -e "configCache" -e "parse of the config" ...`
- `tests/server/root/context-fixture.ts:151` (`createConfigCache({ engine, load: () => loadConfig(engine), ... })`, no hub) is in the list.
- `DESIGN.md:262` (the cache parses `config/` again "only when a file of the folder was added...") is in the list. The change makes it false.
- Outside the list and made false by the change:
  - `src/hooks.server.ts:70-72` ("parses the config folder again only when a file of it was added, removed or written").
  - `src/app.d.ts:18-20` (same sentence).
- `server-context.ts:88` and `context.ts:240-243` are in the list.

**The size tokens.** `grep ... -E -e '--(rail-badge-text|status-text|tree-font|tree-heading-font|tree-badge-font|button-font)\b' -e 'slide-fs-'`, without the plain reads.
- The hits are `tokens.css:112,118,179,181,187,219`, `slide.css:6-10` and `TreeItem.svelte:490` (a line-height). The fix keeps all of these true.
- `DESIGN.md:577` ("`--status-text`, both fixed at every text scale") stays true.

**`startOf` and `folderName`.** Only in `folder-opener.ts`, which is in the list. Its head comment at line 12 ("LaTeX points at it in the folder-only shape `{ root, path, label }`") becomes false and is in the list.

**`buildIndex`.** `src/lib/state/workbench/palette.ts:122` (in the list) and `src/lib/shell/keys/Palette.svelte:77,173` (outside the list, a caller that stays true).

**`:goto`.** It is handled in `src/lib/shell/keys/rows/CommandRows.svelte:76-83`, which reads `current.snapshot?.entities.projects[argument]` only. This file is outside the list, and case 11 needs it changed. Its words, `config/text/app.yml:28-29` ("Open a project in a tab", `<project id>`), are also outside the list.

**The Help arrangement.** `grep ... -i -e 'help arrangement' -e "Help page" -e 'engine:docs/apps.md' -e "group: help"`. Hits outside the list that the change makes false or leaves stale:
- `src/lib/views/system/help/Help.svelte:2-3`: "is the first tab of that page's one pane, beside the Apps guide". After the change its neighbour is Research approach.
- `src/lib/views/sources/doc/Doc.svelte:2-4`: "A hub document opens from its group in the view catalogue, a document of oculus's own folder from a link or the Help page". A hub document now also opens from the Help page.
- `src/lib/views/personal/memories/Memories.svelte:2-3`: "drawn in the Help page's right pane with two of the hub's documents". This is false today and stays false after the change.
- `tools/oculus/config/layout.yml:181`: the `docs:` comment says documents are entries "in the view catalogue". It becomes incomplete. `layout.yml` is outside the list, and so is its line 44 ("What each rail page is first made from").
- `.oculus/config/layout.yml:3,7` (hub text): "the documents of the hub that the view catalogue lists". It becomes incomplete.
- `tests/state/workbench/navigation/pages.test.ts:124` stays true.

In the list and made false or stale by the change: `HELP.md:25`, `:21-22`, `:26`; `docs/DATA-MAP.md:234`; `catalogue.ts:1-3` stays true.

**Side projects.** `grep -rn -i 'personal board\|side project'` over the docs.
- `docs/DATA-MAP.md:72` ("only Personal reads it") and `:181-182` (the "Personal" reader column) become incomplete once the project view, palette and editor read side projects. The file is in the list, but item 8 does not name these lines.
- `docs/apps.md:134` lists the `personal` wire fields. Any field the builder adds to `SideProject` changes it.
- `HELP.md:433` lists `.oculus/` contents without `memories/` and `wallpaper/`.

**Code the side-project page needs, outside the list** (read in `Project.svelte:58-71`, `ProjectCard.svelte:120-264`, `card.ts:110`):
- `api/docs` looks up `project(locals.server.hub, id)` (`src/lib/server/sessions/stores/hooks.ts:191-196`), which reads `entities.projects` only. The page's "its folder's documents" therefore needs a server change.
- `SideProject` (`src/lib/data/model/model-entities.ts:845-856`) has no `folder`, `deck` or `docs`. `ProjectCard` reads `item.project.folder`, `deckOf` reads `project.deck`, and `markdownDocNames(item.project)` reads `docs`. So `model-entities.ts` and the reader `readPersonal` (`src/lib/data/sources/manifests.ts:352`), or a client-side mapping, are needed.
- `src/lib/state/boards/board/` and `src/lib/state/boards/` each hold 10 items, at the folder limit (`ls`).
- `ProjectCard.svelte` is 509 lines and `context.ts` is 871 (`wc -l`), both close to their limits (520 and 880).

**G61.** `agents/guarded.md:179-181`.
- Its Code line names `context.ts` and `server-context.ts`, not `config-cache.ts`.
- Its Test line ends "landed by M8", which is history.

Findings:
1. The path list leaves out `src/lib/shell/keys/rows/CommandRows.svelte` (and `config/text/app.yml:28-29`), which case 11's `:goto` needs.
2. The path list leaves out the data and server code the side-project page and card need: `src/lib/data/model/model-entities.ts`, `src/lib/data/sources/manifests.ts` (`readPersonal`), and `src/lib/server/sessions/stores/hooks.ts` (`project`, behind `api/docs`). Adding fields to `SideProject` also changes the apps `portfolio` wire shape (`docs/apps.md:134`).
3. These comments become false and are outside the list: `src/hooks.server.ts:70-72`, `src/app.d.ts:18-20`, `src/lib/views/system/help/Help.svelte:2-3`, `src/lib/views/sources/doc/Doc.svelte:2-4`, `tools/oculus/config/layout.yml:44,181`, and `.oculus/config/layout.yml:3,7`.
4. `src/lib/views/personal/memories/Memories.svelte:2-3` is already false, describes the page this step changes, and is outside the list.
5. `docs/DATA-MAP.md:72,181-182` become incomplete and item 8 does not name them. `HELP.md:433` does not list the two new folders, and item 6 asks only for documents that name the old ones.
6. `tools/oculus/assets/wallpaper/README.md` moves unchanged to `.oculus/wallpaper/`. From there its "`config/appearance.yml`" reads as `.oculus/config/appearance.yml`, a file the hub layer may not hold (it is outside `HUB_LIST`).
7. G61's Code line does not name `src/lib/server/root/process/config-cache.ts`. The "Doc text" section asks for G61's text and Code line, not the Test line, which must name the new rows' titles and carries "landed by M8" (history).

## 2. The step line

`plan.md:740`, mapped to "What to build":
- **(1) The Help page's hub documents:** item 1. "In its order after the manual and before Memories": item 1 places them after the first tab, so they come before the Apps guide and Memories. "On any hub without oculus's config naming a hub path": item 1 and case 2. Item 1 also widens the step to any page a `group` names (decision 1, case 3); the step line names only the Help page.
- **(2) The config cache:** item 2. "That folder alone": item 2 and case 5. "Hub read from `local.hub` at each read": item 2 and case 6. "G61 naming both folders": the report's "Doc text". "Its test gaining a hub-layer row": item 2 and line 81.
- **(3) A personal project:** item 3. Its own page, the editor, the card and each named action, Cmd-K, and the cards and list switch each have their bullet. "Not Deposit" and "Pin and the editor write a repository's own `.oculus/project.yml`" are in the actions bullet and case 9.
- **(4) Focus folds:** item 4.
- **(5) Files and LaTeX names:** item 5.
- **(6) Memories and wallpaper:** item 6 (Z770 (a)).
- **(7) Rice sizes:** item 7. "Find why" was answered by the diagnosis (the record's Cause section); "end it" is the fix diff.
- **(8) The data map:** item 8.

Every part has a requirement.

Findings: none.

## 3. Premises

Each premise was rerun with `git show acece2a09:tools/oculus/config/layout.yml | sed -n 85,100p`, `sed -n` on each cited file, `wc -l`, `du -sh tools/oculus/assets/*`, `ls ... | wc -l`, `git ls-files tools/oculus/assets | wc -l` (30), `git check-ignore -v .oculus/memories` and `git check-ignore -v .oculus/wallpaper` (both `exit=1`), and `ls side-projects/*/present` ("no matches found").

These match:
- `layout.yml:93`, the old line 93, `.oculus/config/layout.yml:8-12`, and `docs: []` at `layout.yml:182`.
- `rail.ts:36-44`, `arrangement.ts:79-84`, `catalogue.ts:30,280`.
- `config-cache.ts:28-45`, `context.ts:248` and `:545-549`, `hooks.server.ts:88`, `guarded.md:179-181`, and the test's three rows.
- `layout.yml:67`, `Personal.svelte:104-127`, `ProjectCard.svelte` at 509 lines with lines 60, 133-141, 144-150, 173, 182, 195, 209-218, 222-229, 230 and 264.
- `model-entities.ts:845-856`, `manifest.ts:8-14` and `291-302`, `Projects.svelte:116-117,309,336`, `read.ts:42`, and the three side projects.
- `Focus.svelte:118,125,188`, `CareerPanel.svelte:84`, `folder-opener.ts:59-61,64-85`.
- 16 files at 3.7M and 34M (12 files plus `README.md`), `appearance.yml:58-59,74-75`, `options.yml:68,135`.
- `DATA-MAP.md:572-586,226-236,593` and `registries.ts:61`.
- `themes.css:732-747`, `tokens.css:112,118,125-131,132-138,179,181,187,219`, `slide.css:5-10`, `parse.ts:17`, `ApprovalPanel.svelte:108,115,130`.
- `ls docs/adr tools/oculus/docs/adr`: both missing.

Findings:
1. **Check 3e cannot pass.** `grep -rnE 'font-size: *[0-9]' src` prints 12 lines on main: the three ApprovalPanel px sizes plus nine relative sizes the step keeps. Those nine are `TabFace.svelte:399` (90%), `Breadcrumb.svelte:95` (0.9em), `FileIcon.svelte:46` (150%), `ChangeGroups.svelte:325`, `FileRow.svelte:179`, `MathPreview.svelte:95`, `FileHeader.svelte:143,149` and `OpenEditors.svelte:307`. After the fix it still prints nine lines. `grep -rnE 'font-size: *[0-9.]+px' src` prints exactly the three ApprovalPanel lines and is the form that checks what item 7 means.
2. **A premise names a file that does not exist.** Line 19's `src/lib/data/sources/roots.ts:69`, `:80`: `sed` answers "No such file or directory". `loadConfig(engine, { hub: root.dir })` is at `src/lib/server/files/roots.ts:69` and `src/lib/data/index.ts:333`. The hub-layer merge, where a key outside `HUB_LIST` becomes a finding, is `mergeHub` in `src/lib/data/sources/config/merge.ts:312-330`; Read item 7 names `src/lib/data/sources/config.ts` instead.
3. **"Only CareerPanel folds" is false.** `Focus.svelte:186` draws `Band`, which folds through `<details class="cluster" open>` (`Band.svelte:120`). `CommandCenterView.svelte:196` holds a nested `<details class="grp">` (`grep -n "details" src/lib/views/boards/focus/*.svelte`).
4. **The rice comment's lines are off by one.** Lines 20 and 43 say `themes.css:728-730` and the Step 0 line says `729-730`. Line 728 is the banner and the comment is lines 729-731 (`sed -n 726,750p`).
5. **`buildIndex` runs longer than cited.** It spans `palette.ts:122-198` (`awk` found the closing brace at 198); the brief cites 122-162.

## 4. Cases and checks

The cases were read against `agents/spec.md`. Lines 62-63 say a builder runs no page, and line 81 of the brief sends the page cases to the look at landing.

Findings:
1. **Check 3d is impossible under the rules.** It asks for `git show HEAD:<old path> | shasum`, against `spec.md:32` ("You never run a git command, read-only ones included") and the brief's own line 157. The base copy holds only `src`, `tests`, `utils` and `config` (line 7), so the builder has no base copy of `assets/` to compare.
2. **Line 157 invites a server.** "You never start ... a dev server on any port but 8811" implies the builder may start one on 8811. `spec.md:62` forbids starting a scratch oculus, and several cases can only be seen in a page (1, 2's "with no error", 12, 13, 14, 15).
3. **Cases 6 and 7 have no stated check.** Line 81 calls cases 4 to 7 G61's but makes only 4 and 5 rows. Under `spec.md:57` (one row per input that gives a different outcome), a hub switch and a hub with no layer folder ("absent", which is cached, against "unreadable", which is not) are G61 rows. Item 2 says "gains a row"; line 81 says two.
4. **Case 11 depends on a file outside the step's paths.** `:goto` lives in `CommandRows.svelte`, which is not in the path list.
5. **Case 18 rests on code outside the step's paths.** It relies on G15's code (`src/lib/data/snapshot/`), which is not in the list. Line 5 does not ask for G15 to be read.
6. **Cases 8 and 9 are look-only "on this hub".** They write Axel's real `side-projects/<slug>/project.yml`, which `spec.md:37` keeps from the builder. Case 15's add control likewise writes a real photo into `.oculus/memories` at the look.
7. **The asset move breaks two rules as written.**
   - `spec.md:37` bans writing under any hub data folder.
   - `spec.md:103` allows such a write only "through the script the brief names". Item 6 says "move the files in the worktree" and names no script.
   - `spec.md:103` also requires the report to list each hand-reworded line of hub text before and after. `docs/DATA-MAP.md` is hub text, and the brief's Report section asks for no such list.
8. **Check 3b uses the form the rules file replaces.** It names the `LC_ALL=C grep -n '[^ -~]'` form, and `spec.md:99` says the perl form "replaces the `grep '[^ -~]'` form wherever a brief or a check names it". This is minor, since the perl gate covers only `src`, `tests`, `bin` and `config`.
9. **Case 9's expected result is imprecise.** It says "the card moves to the top". The Personal board puts a pinned card first within its status group (`personal.ts:69-70,86`; the schema's `pin` help says "first among the cards of its status").
10. **Two tested entries are not on the reading list.** Line 5 asks for G8, G29, G54 and G61, while case 18 cites G15 and check 3e cites G26.

## 5. The question

Could each pass without the goal being reached?

- **Step line:** yes, see Item 1 and Item 5.
- **Item 1:** yes.
  - "A page already saved keeps its tabs (G29); a Reset of the page makes it with the documents."
  - Axel's Help page is already saved, so every case can pass while his page still shows no documents until he resets it. The ruling (Open item 36) is that the Help page shows them.
  - Item 5 migrates kept workbench layouts so that existing ones change; item 1 does not do the same for the existing Help page.
- **Item 2:** partly yes. With only the case 4 and 5 rows, the hub switch (case 6) and the absent-layer stamp (case 7) can be wrong while the test is green.
- **Item 3:** yes.
  - No case checks a repository side project's commands, sessions or documents on its page.
  - No case checks Copy context or Ask carrying title, status, eli5, next, latest and folder, or a subtask added or ticked on a side card.
  - No case checks Show in Finder.
  - Case 8 checks only title, status, eli5 and next.
- **Item 4:** no for the reload. Case 13 covers it at the look. "After the tab is moved" has no case.
- **Item 5:** yes. Item 5 and case 14 cover a kept, closed, layout. A workbench page that is open at reload is restored from the saved pages, not from a kept layout (`saved/kept.ts` against `folder-store.ts`). Its tabs can still read the folder name while every case passes.
- **Item 6:** no. Check 3d (once runnable) and case 15 at the look cover it.
- **Item 7:** yes, against its own first sentence. Check 3e cannot pass (check 3, finding 1).
  - Item 7 says "Every text under a rice theme has a font size one step below".
  - The terminal grid and the debug console draw at `terminal.font_px: 12.5` under every theme. The diagnosis's "The places" says so; `config/appearance.yml` sets the key.
  - So that text is equal, not one step below, while the red command's 17 views pass. The step line's weaker goal ("no text ... larger") holds there, since the face is monospace under both themes.
- **Item 8:** no, it is checked by reading. See check 8, finding 3 for a contradiction to avoid.
- **Cases 1, 2, 12 and 14 to 17:** no, by the look and the red command. Case 3 is no. Case 5 is no. Cases 4, 6 and 7 are covered under Item 2.

Findings:
1. Item 1 can be met while Axel's own Help page stays without documents. Whether an existing saved Help page gets the document tabs is an unbooked user-visible decision.
2. Item 5 does not cover an open workbench page restored from the saved pages.
3. Item 3's cases leave out the repository side project's commands, sessions and documents, the content of Copy context and Ask, and subtasks.
4. Item 7's first sentence does not hold for the terminal and the debug console at the configured `terminal.font_px`. The item should either exclude them by name or step them.
5. The brief's decisions 1 (document tabs on any page a `group` names) and 5 (labels dropped on restore) are user-visible. `grep -n "D59" choices.md` shows only Z770 to Z773 booked.

## 6. Implied inputs

Each of these is missing from "Cases"; the expected result follows.

1. **Axel's existing saved Help page, no Reset.** Expected, per the ruling: it shows the four documents (or, if the brief's G29 reading stands, booked as Axel's decision).
2. **An open workbench page at reload** whose saved tabs hold `label: <folder name>`. Expected: Files and LaTeX.
3. **Two `docs:` entries with the same `path` in one group**, or an entry whose path matches a tab already in the arrangement. Expected: one tab per document and the page still made. A tree that `checkWorkbench` refuses makes no page at all (`parseArrangement`, `arrangement.ts:79-84`); see `spec.md:69`.
4. **A `group` naming a page whose first pane is a split** (the sessions page). Expected: the document goes after the first tab of the first leaf pane.
5. **A press on a catalogue document row (h3 to h6) while the Help page holds that document.** Expected: the existing tab is activated (`docState`'s id is the path), not a second tab opened on the current page as `HELP.md:26` describes.
6. **A hub `.oculus/config/` folder created or removed between two requests.** Expected: the next request parses again.
7. **`hub:` in `local.yml` naming a folder that does not exist.** Expected: an absent stamp, cached, and no unreadable loop.
8. **A side project id that names nothing** (deleted folder, saved project tab). Expected: the project view's existing empty line, as for a research id.
9. **A repository side project (`root:<key>`) page.** Expected: its commands and sessions as on a research page, and its documents through `api/docs`, which today reads research projects only (`hooks.ts:191-196`).
10. **A second hub's side project write** (`lab:side:x`). Expected: it lands in the second hub's file. `writes.test.ts:42-61` covers `side:idea` and `root:r` only, so this is the G8 row line 81 allows.
11. **The Settings view over `wallpaper.dir` and `memories.dir` with the new defaults.** Expected: the suggestions of `sources.ts:114` list the images of `.oculus/wallpaper`, and the `control: folder` picker reaches the folder. `fs.ts:337-341` hides dot entries unless hidden files are asked for, so a picker walking from the hub root may not show `.oculus`. Not verified.
12. **A Focus fold key colliding with a key Focus already keeps in its instance state.** Expected: no clash (`spec.md:69`).

Findings: items 1 to 12 above.

## 7. ADRs

`ls docs/adr tools/oculus/docs/adr` printed "No such file or directory" for both (`exit=1`). `grep -n "adr\|standards" .agents/plan.yaml` shows `standards: []` at line 8 and no `adr` key.

`orchestrator-state.md:12` holds `standards: [tools/oculus/.scratch/migration/agents/spec.md]`. That differs from `plan.yaml:8`; I note it only.

Findings: none.

## 8. Dictated text

1. **Brief line 40** (`grep -n -- '--rail-badge-text: 8px;' agents/briefs/D59.md`): six CSS declarations. These are code with no prose. Holds.
2. **Brief line 41** (`grep -n 'calc(52px'`): 52, 33, 26, 22 and 17 px times `var(--text-scale, 1)`. 12/13 of 56, 36, 28, 24 and 18 rounds to these. Holds.
3. **Brief line 42** (`grep -n "h2\` reads"`): `var(--fs-lg)`, `var(--fs-xl)` and `var(--fs-sm)`, which are 14, 16 and 12 px at `tokens.css:132-138`. Holds.
4. **Brief line 46** (`grep -n "each hub's \`.oculus/config/\` layer is that hub's own"`): the data map sentence.
   - The keys in it match `HUB_LIST` (`hub-names.ts:190-212`).
   - "A key outside it ... a finding and not applied" matches `merge.ts:312-319`.
   - `repository_scan_depth` and `languages` exist (`config/sources.yml:79,83`).
   - It conflicts with `DATA-MAP.md:578`, the "Settings" row, which says a second hub's `roots:`, career file, website keys and portfolio deck are not read. "The keys a layer may set are the hub list" for every hub's layer contradicts that row unless those keys are named. The brief's "Read `HUB_LIST` and `loadConfig` for each claim" mitigates this; the sentence as given breaks `spec.md:68`'s rule that a sentence the change makes false is a defect.
5. **Brief line 38** (`grep -n 'wallpaper.dir: .oculus/wallpaper'`): the two values. Holds.
6. **Brief line 43** paraphrases the two comments. Line 44 (`grep -n 'gives this as a diff'`) points to the diff in the record's "Fix and test", whose comment words are therefore dictated.
   - The `tokens.css` comment (`grep -n 'size tokens below that a step cannot carry' agents/reviews/D59-diagnosis.md`, line 488) says "one of the size tokens below". `--rail-badge-text` (`tokens.css:112`) and `--status-text` (`:118`) are declared above the comment at 125, and the slide scale is in another file. The word "below" is false for three of the five groups it names. This breaks the rule that a comment says what the code is (`spec.md:68`).
   - The rice comment (`grep -n 'Terminal-ish rather than pixel-art'`, record line 505) keeps "Terminal-ish rather than pixel-art". The step edits that comment, and `spec.md:20` bans the 'not X but Y' construction. It breaks `spec.md:20` (and `:43`, which applies to the whole edited paragraph).
   - The `slide.css` comment holds.
7. **Brief line 27** (`grep -n 'view: doc, state: { id: <path>'`): a state shape, not prose. Holds.

Findings:
1. The dictated `tokens.css` comment's "size tokens below" is false for `--rail-badge-text`, `--status-text` and the slide scale.
2. The edited rice comment keeps "Terminal-ish rather than pixel-art", the contrast construction `spec.md:20` bans.
3. Item 8's data map sentence contradicts `DATA-MAP.md:578` for a second hub's `roots`, `career_file`, `publications_file`, `linkedin_dir` and `portfolio_deck` unless it says those are not read for a second hub.

## Declined to judge

- The red command's `RED: 292 texts` on main and its GREEN after the fix (the record's runs 2 and "Runs after the fix"). Rerunning it needs a dev server and a headless browser, which this check may not start.
- Whether `resolveRootPath` lets the Settings folder picker and the suggestions reach `.oculus/wallpaper`. I read the listing rule (`fs.ts:337-341`) but not the picker's walk.
- Whether `routed(into, write.id, app)` (`src/lib/server/edit/writes.ts:395`) already sends a second hub's side-project write to its own hub. I did not read `routed`.

Agent usage: a6e3a619d676d8cdf, claude-opus-5-5, 262,611 tokens, 106 tool uses, 12.7 min.

## Closed (the session's change to the brief for every finding above, made before the preparation commit)

- Names 1 (`:goto`): item 3 says `:goto` reaches a side project; `CommandRows.svelte` and `config/text/app.yml` added to the paths; premise added.
- Names 2 (data and server code of the side page): item 3's bullet "The data the page and card read" (folder, deck, docs on `SideProject`, `readPersonal`, `api/docs` lookup, the apps `personal` payload); `model-entities.ts`, `manifests.ts`, `hooks.ts`, `docs/apps.md` added to the paths; the folder-limit and size premises added.
- Names 3 and 4 (comments made false): "The text of every change" names each comment; each file added to the paths; `.oculus/config/layout.yml` lines 3 and 7 as hand-reworded hub text with before and after in the report.
- Names 5 (DATA-MAP 72, 181-182; HELP.md:433): items 6 and 8 name them.
- Names 6 (the wallpaper README): item 6 rewords its one sentence, before and after in the report.
- Names 7 (G61's Code and Test lines): item 2 and the report's "Doc text" ask for the text, Code (with `config-cache.ts`) and Test lines, no "landed by" note.
- Premises 1 (check 3e): the grep is `font-size: *[0-9.]+px`.
- Premises 2 (`roots.ts`): corrected to `src/lib/server/files/roots.ts:69`, `src/lib/data/index.ts:333` and `mergeHub` (`merge.ts:312-330`); Read item 7 names `merge.ts`.
- Premises 3 (Focus folds): premise rewritten with Band and CommandCenterView's nested group.
- Premises 4 (rice comment lines): 729-731 in the brief and in D59's Step 0.
- Premises 5 (`buildIndex` span): 122-198.
- Cases 1 (check 3d): no git; the base copy holds `assets`, and 3d compares `shasum` against it.
- Cases 2 (server wording): the line now says the builder starts no server, browser, Electron or app.
- Cases 3 (cases 6 and 7): item 2 lists one G61 row per outcome, the two further outcomes included; the test paragraph says which fail first.
- Cases 4 and 5: `CommandRows.svelte` in the paths; G15 added to the reading list.
- Cases 6 (writes to real files): cases 8, 9, 15 and 20 are made on a hub copy at the look, never on this hub's files.
- Cases 7 (the asset move): item 6 names the move command as the one way the files move, and the report lists hand-reworded hub text; the sparse checkout holds `.oculus/`.
- Cases 8 (3b form): 3b uses the perl form over the files outside `src`, `tests`, `bin`, `config`.
- Cases 9 (case 9's result): "first among the cards of its status".
- Cases 10 (G15, G26 not read): added to line 5.
- The question 1 (Axel's saved Help page): Z774 (a), item 1, case 21.
- The question 2 (open workbench at reload): Z776 (a), item 5, case 22.
- The question 3 (side project parts without cases): case 20.
- The question 4 (terminal and debug console): item 7 names them as drawn at `terminal.font_px` under every theme.
- The question 5 (decisions 1 and 5 unbooked): Z775 (a) and Z776 (a), booked in `choices.md` and `plan.md` Rulings.
- Implied inputs 1 to 12: cases 20 to 26 and item 1 (duplicates, split first pane, catalogue press), item 2 (folder created or removed, missing hub folder), item 3 (unknown id, second hub write row), item 6 (Settings picker).
- Dictated text 1 (the tokens.css comment's "below"): item 7 no longer dictates the comment; it names where each token is declared and the builder words it.
- Dictated text 2 ("Terminal-ish rather than pixel-art"): item 7 asks for plain statements with no contrast construction.
- Dictated text 3 (the data map sentence against line 578): item 8 keeps the keys the Settings row says a second hub does not read.
- Declined to judge (the Settings picker, `routed`): cases 25 and 19 check them.
