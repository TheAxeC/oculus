# Brief check of O56 (a new project, a new entry and Save to Literature ask which hub), main at 29dc034d plus the uncommitted brief

Read: `.scratch/migration/agents/briefs/O56.md` (121 lines), `plan.md` top paragraph, step line (plan.md:689), rulings 210 (plan.md:2442), 207 (:2439), 209 (:2441), and 203 with its reopening (:2436, :2465), `agents/spec.md` (105 lines), `agents/guarded.md` (G8 whole, plus each entry whose Code line names a path the step writes). `git log --oneline -1` gives `29dc034d Launch O61's builder`; `git status --short` shows `?? .scratch/migration/agents/briefs/O56.md`. `config/local.yml` was not opened, and every grep over `config/` used `--exclude=local.yml`.

The plan has no "Goal" heading. Its top paragraph says the plan is the execution ledger for `tools/oculus/DESIGN.md`. The step's goal is therefore read from its line and ruling 210. Ruling 207 says nothing about hubs. Ruling 209 says "a member's private files live in their own private hub, the primary". Ruling 203 (b) bears on C4 and on new project ids: "a reference resolves in its own hub first ... a project id held by two hubs carries its hub's prefix".

## 1. Names

Command: `grep -rn --exclude=local.yml "\b<name>\b" src config docs tests README.md DESIGN.md`, run once per name. Each run prints `ugrep: warning: DESIGN.md: No such file or directory`: the oculus root has no DESIGN.md. README.md has no hit for any name.

- `hubChoices`, `hubAsk`: hits only in `src/lib/views/shared/forms/entry/entry-add.ts` (:50, :73, :68, :97, :167), which is on the write list. None outside.
- `literatureHome`: `saved.ts:24` and `SaveToLiterature.svelte:15,44` are on the list. Outside the list:
  - `tests/state/feeds/literature-home.test.ts:8,18,24`. The change makes it false: the file imports a function item 1 deletes, so it fails to load. Verify line 6 (`grep -rn "literatureHome\|homeCollection" src tests` prints nothing) can only pass if this file is deleted or rewritten, yet it is not in "Paths this step writes". spec.md:59 says "A step deletes the tests and entries its change makes obsolete".
  - `guarded.md:71` (G8 Code, "`saved.ts` (`literatureHome`)") and `guarded.md:72` (G8 Test, "`tests/state/feeds/literature-home.test.ts`, every row") become false. This is the orchestrator's file. The brief says only that new rows are named at landing; it does not say these rows go and that the shared list's new file joins G8's Code line.
- `homeCollection`: only `src/lib/state/forms/new-entry.ts:36,67`, on the list. Its behaviour is tested through `addTask` in `tests/state/forms/new-entry.test.ts:74-90` (describe 'the hub a task is added to'). The row at :85, `it('is none when the primary hub holds no tasks collection'` asserting `t('app.palette.task_add_collection')`, becomes false under item 1's rule: only `second` holds tasks, so the list is `[second]` and the task goes there. Not on the write list.
- `taskFields`: only new-entry.ts (:59, :99, :114). None outside.
- `addTask`: `CommandRows.svelte:27,99` is on the list. Outside: `tests/state/forms/new-entry.test.ts:2,8,67,127,137,159,168,175`. Item 4 changes `addTask` to take the chosen hub, so every call there becomes false or a type error. This is G8's "describe 'addTask', every row" (guarded.md:72), and it is not on the write list.
- `newIdea`:
  - On the list: `writes.ts:690` (the 685-700 range), `bodies.ts:645`, `shapes.ts:394`, `writes.svelte.ts:642,866`, `NewIdeaForm.svelte:21,49`.
  - Outside the list and still true: `writes.ts:91,246` (imports and exports), and `src/lib/server/edit/writes/apps/gate.ts:41,94` (`['new-idea', newIdea]`; an app's `root` goes through `routedRoot`, which refuses any hub other than the primary for an app, hubs.ts:155-166).
- `newIdeaShape`: only `bodies.ts:454,646`. None outside.
- `applyFromLead`: `lead-apply.ts:23` and `LeadCard.svelte:42,117`, both on the list. None outside.
- The `new-idea` write's fields (`grep -rn --exclude=local.yml "new-idea" ...`):
  - `docs/apps.md:426` (`{ kind, fields }`; `fields.id`, and `fields.tier` and `fields.folder` optional) is on the list. It becomes false once `root` exists, and it already leaves out title, short, domain and eli5.
  - Outside and still true:
    - `src/lib/data/helpers/files/apps/apps.ts:147,189`
    - `src/lib/state/system/apps/words.ts:50,57`
    - `config/text/views/apps/apps.yml:69,73`
    - `tests/server/core/changes.test.ts:453` (a body with no root)
    - `tests/server/edit/writes.test.ts:640-698` (no root)
    - the `new-idea-candidate` hits (another word)
  - Outside and made false: `src/lib/state/client/selectors.svelte.ts:322-324`, the head of `domainChoices`, which says "for the one field of the new-idea form that has any: the new project is written to the primary hub, so its domains come first". Item 2 moves the form to `hubVocabs().lists[hub].domains`. After that, `domainChoices` (selectors.svelte.ts:170, 325, 712; its one caller is NewIdeaForm.svelte:20,40) is either false or a store member with no caller. `selectors.svelte.ts` is not on the write list.
- Text keys: the brief names no new key. Lines that change or become false:
  - `config/text/views/feeds/literature.yml:107` `in_literature_tip: The Literature collection holds this paper` takes no argument, and C7 wants the hubs named. This is a changed word rather than "a new word", but the `config/text/` path item covers it.
  - `config/text/app.yml:155` `task_add_collection: The hub has no tasks collection, so no task can be added.` After item 1 the refusal comes only when no hub of the workspace holds tasks, so "The hub" no longer says the reason.
- Documents outside the list that become false:
  - `docs/data-map.md:214`: "A new project goes to the primary hub, and so does a new entry, unless more than one hub lists its collection ... Save to Literature writes to the Literature file of the primary hub when the primary holds one ... and else to the first hub that holds one." Item 6 names only HELP.md and apps.md; spec.md:70 makes this sentence a defect of the change.
  - `src/lib/server/edit/writes/hubs.ts:155-158` (the `routedRoot` head) lists "(a new entry, a paper saved to Literature)". It becomes incomplete rather than false. `hubs.ts:169` (`homeOf`, "a new project") stays true for a body with no `root`. hubs.ts is not on the list.
  - Comments on the list that need rewriting: `new-entry.ts:35`, `saved.ts:17-23`, `SaveToLiterature.svelte:2-10,43`, `NewIdeaForm.svelte:2-7`, `lead-apply.ts:1-5` (`grep -rn -i "primary, else the first\|else the first hub\|else of the first hub" src docs config tests README.md`). Item 6 covers these.
  - `write-files.ts:6` ("A write that creates its file (a new idea ...) names none") stays true.

## 2. The step line

The step line (plan.md:689): "a new project, a new entry of a collection and Save to Literature ask which hub takes it when more than one hub of the workspace could, the primary first in the list (ruling 210)". Ruling 210: "(a) ... ask which hub when more than one hub could take it, the primary first in the list; (c), the primary always, was the lazy option".

How each requirement maps to "What to build":
- "a new project ... ask": item 2.
- "a new entry of a collection ... ask": item 4 (Add Task), item 5 (apply), and the collection's and Literature's Add, which already ask (C1, entry-add.ts:68-82).
- "Save to Literature ... ask": item 3.
- "when more than one hub could [take it]": item 1 defines which hubs can.
- "the primary first in the list": item 1.
- Item 6 serves spec.md:70; item 7 serves spec.md:59 and :67.

Parts with no requirement in the line or ruling:
- Item 3's tooltip naming the hubs that hold the paper. Reading "In Literature" across every hub is needed: otherwise a paper saved to `lab` shows Save again on the card and invites a second copy. Naming the hubs in the tooltip is not needed. Reported as a part with no requirement; dropping it narrows the step.
- Item 1's removal of `literatureHome` and `homeCollection` serves the spec's DRY principle (spec.md:87), not the line.

Every client write that creates a record, from `grep -n "kind: '" src/lib/state/client/writes.svelte.ts` and `grep -rn "newEntry\b\|saveLiterature\|placeInFile\|newIdea\b\|addRadarEntry\|addLead\b\|addLinkedinIdea\|viewSourceFile(" src/lib --include='*.ts' --include='*.svelte'`:
- `new-entry`: `collectionAsk` (entry-add.ts:107, already asks) and `addTask` (CommandRows.svelte:99, item 4). Covered.
- `literature-save`: SaveToLiterature.svelte:52 (item 3) and `literatureAsk` (entry-add.ts:186, already asks). Covered.
- `new-idea`: NewIdeaForm.svelte:49, opened by NewIdea.svelte:19 and RadarCard.svelte:243 (item 2). Covered. No other opener: `grep -rn "NewIdeaForm\|NewIdea.svelte\|import NewIdea\b" src/lib`.
- `placeInFile`: only lead-apply.ts:35 (item 5). Covered.
- `lead-add` (entry-add.ts:123) and `radar-add` (entry-add.ts:149, AddForm.svelte:54): feeds, outside the line, as brief:18 says.
- `linkedin-idea` (Linkedin.svelte:126, writes.svelte.ts:506-512: "the configured folder of the primary hub, else the first"): a record-making write that the brief does not name anywhere. It is a feed (`src/lib/server/edit/feeds/feeds.ts:62,72`, kind `linkedin`), so it is outside the line like leads and radar. Brief:18 names only leads and radar; it should name LinkedIn ideas too, with the same reason.
- Writes that make no project, collection entry or saved paper, and so lie outside the line: New Note, New Workspace, bookmarks, the Memories upload, deck-edit's new deck.
- An app's `new-entry`, `new-idea` and `literature-save` reach the primary alone by design (docs/apps.md:417,428). The brief does not say so, which leaves the app path's expected result to the builder.
- A path in flight, not on the tree: O53's "Add person" (briefs/O53.md:32) writes a `new-entry` of `people` to "the hub the edited record is in" without asking, under ruling 251. Once it lands, it is a new entry of a collection that does not ask, which on its face meets ruling 210. Ruling 203 (b) (resolution in the record's own hub first) may make the record's hub the only one that "could take it". That judgment belongs to the orchestrator and is outside O56's tree.

## 3. Premises

- Step line and ruling 210: hold (`grep -n "^- O56" plan.md`, line 689; `grep -n "^- Open item 210 " plan.md`, line 2442).
- `ls docs/adr`: "No such file or directory". Holds. `grep -n "standards:" orchestrator-state.md` gives `11:standards: [.scratch/migration/agents/spec.md]`. Holds.
- entry-add.ts: `cat -n` shows the comment at 8-10, `hubChoices` at 46-60 and `hubAsk` at 62-82. The brief's "47-80" is off by one or two lines at each end; the content holds. `collectionAsk` at 89-115 with `newEntry(collection, body, root)` at :107 holds; `saveLiterature('hand', paper, hub.rootOf(chosen))` at :186 holds; `config/text/views/shared/entry-form.yml:40` `add_hub: Hub` holds.
- `bodies.ts:331-336,377-382`: `grep -n "const newEntryShape\|const literatureSaveShape\|satisfies"` gives 331/336 and 377/382. Holds.
- `writes.ts:577-590`: `fresh = newEntry(body)` is at 577 and `routedRoot` at 580. The block, with the `no_collection_in_hub` refusal, runs to 597. Holds.
- NewIdeaForm.svelte is 131 lines (`wc -l`); holds. Its openers hold. `newIdea` fields at writes.svelte.ts:642-652 hold; the doc comment starts at 637 ("636-655" covers it). `newIdeaShape` at bodies.ts:454-457 holds. `homeOf` at writes.ts:690-701 and hubs.ts:173-178 holds, with "the primary, else, for the page, the first hub".
- `newProjectFolder(tier)`, cited as `new-project.ts:20-21`: the function there is `newProjectFolder(config, tier)` (new-project.ts:20-25). The one-argument form is the selector at `selectors.svelte.ts:713`. Partly holds. It reads the merged config the config channel sends (`src/lib/server/root/watch/portfolio.ts:641,662`).
- `domainChoices()` at selectors.svelte.ts:325 and `hubVocabs()` at :235 hold; `HubVocab` at `src/lib/data/model/index.ts:309-314` holds.
- SaveToLiterature.svelte is 101 lines and is drawn by RadarCard and LiteratureCard (`grep -rln SaveToLiterature src/lib`). Holds. saved.ts:24-29 ("the primary's, else the first that holds it") and `inLiterature` at :35 hold.
- `CommandRows.svelte:98-105` calls `addTask`: holds.
- `new-entry.ts:36-41` described as "the primary's, else the first": does not hold as written. The code is `if (primary === null) return collections.at(0) ?? null; return collections.find((one) => rootOf(one) === primary) ?? null;`. With a primary that holds no tasks, the result is null, and Add Task refuses with `task_add_collection`. `tests/state/forms/new-entry.test.ts:85` asserts this. "Else the first" applies only with no primary.
- lead-apply.ts:22-48 with `viewSourceFile('collection', ..., client.fs.primary(), APPLICATIONS)` holds (lines 28-33). Missing from the brief: `viewSourceFile` (`src/lib/state/sessions/view-source.ts:72-90`) takes the path from the merged configuration's `collections:`, which is the primary's, and returns null with no primary. It cannot name another hub's Applications file. Item 5 needs that hub's own file, as `Collection.file` from `collectionsOfKey` (`model-collections.ts:137-138`) or `collectionFile` in context.ts:194-197 gives it. Also, `collectionOf(APPLICATIONS)?.schema` (lead-apply.ts:38, selectors.svelte.ts:385-390) is the primary's schema.
- `config/defaults/sources.yml:28` quote: holds (`sed -n '20,35p'`, line 28).
- "Guarded entries ... G8": incomplete. `grep -n -F` of each path over guarded.md also finds:
  - G28 (guarded.md:81), whose Code line names `src/lib/state/client/writes.svelte.ts`.
  - G77 (guarded.md:56), whose Code line names `src/lib/server/edit/writes/bodies.ts` (the `app-setting` kind).
  The brief's read item 6 sends the builder to every such entry, but "What is on the tree" names G8 alone.
- "O53 writes new-entry.ts ... on other lines": not supported. O53's brief:32 says "The key maker lives beside `taskFields` in `src/lib/state/forms/new-entry.ts` or in a file beside it, shared with it rather than copied". Its decision 4 (O53.md:94) says "one rule makes every key Add writes". So O53 reworks the key loop inside `taskFields` (new-entry.ts:71-76), the function item 4 changes (59-82). O53's write list also holds `docs/HELP.md`, `docs/apps.md` and `config/text/` (O53.md "Paths this step writes"). The O56 and O53 rows of orchestrator-state.md (lines 56-61) carry no `shared_paths:` (spec.md:97).
- O61 writes `manifest.ts`, which O56 does not change: holds. O56 relies on `createIdea`'s folder rule, `fields.folder === undefined ? config.newProjectDir[tier] : ...` (manifest.ts:623-626).
- Base copy: `ls -d .agents/worktrees/migration-O56-base` gives "No such file or directory". The brief says `/spec` makes it before the launch, so this is consistent for now.
- Decision 1's reason, "every hub has scan folders and a `new_project_dir` (its own or oculus's default)", does not hold. `config/defaults/sources.yml:20-21` says "The engine names none" and sets `new_project_dir: {}`. A hub without its own entry has no folder for any tier, and `createIdea` then refuses with `idea_no_folder` (manifest.ts:627-629).
- Item 1's placement alternative, "beside `literatureHome`", is `src/lib/state/feeds/literature/`. In `tests/checks/imports/order.ts:60-70`, `state/feeds` sits above `state/forms`, so `src/lib/state/forms/new-entry.ts` may not import from there (G17). Either `taskFields` receives the hub from its caller, or the list must live in `state/shared`.
- A literal "move" of `hubChoices` into `src/lib/state/shared/page/hubs.ts` fails G17 too. `hubChoices` takes `ClientState` (entry-add.ts:50), and `state/client` is above `state/shared`; the order test counts a type-only import as well (order.test.ts:37-50). The shared list must take plain values (the collections and the primary).

## 4. Cases and checks against the rules file

- Brief:52: "the orchestrator takes C2, C6, C9 and C10 on screen on a scratch server with two hubs at landing". spec.md:60 says the look is taken "on the workbench page named TEST in Axel's own Chrome, on his running server". The scratch server departs from the rules file with no ruling quoted. The plan's last scratch-setup look was "on Axel's yes" (orchestrator-state.md:664).
- Item 3 says "The menu is the shell's existing menu component". The menu is a `ui/` primitive, `src/lib/ui/menu/Menu.svelte` with `MenuOpener.svelte` (spec.md:52 names `Menu`). spec.md:55 bars a view from importing `shell/`. Taken literally, the wording points a view at a forbidden layer; it should name `ui/menu/Menu.svelte`.
- Item 7 together with spec.md:59 ("An entry keeps one test per unit it covers ... one row per input that gives a different outcome"):
  - `addTask` is a G8 unit ("describe 'addTask', every row") whose outcomes change: a chosen hub, and only a non-primary hub holding tasks. Item 7 asks for no `addTask` row, and the existing rows in `tests/state/forms/new-entry.test.ts` are not on the write list.
  - The G8 unit "the hub a card saves to" (`literature-home.test.ts`) loses its subject. Its replacement (which hubs hold the paper, which hub a save takes) gets no row.
  - Item 7's list table covers only the collection variant. The project variant ("every hub of the workspace, the primary first") has no row.
- Verify 6 together with the write list: verify 6 requires `literature-home.test.ts` gone, but the file is not a path the step writes (see check 1). The brief contradicts itself.
- Cases that ask the builder to check a place the step does not change:
  - C1 checks `collectionAsk`, whose file changes because `hubChoices` moves, so it is in scope.
  - C12 checks Escape, which is the behaviour of `ui/menu/Menu.svelte` (bits-ui), a file the step does not change.
  - C13's "the refusal is said in the form" checks existing refusal display (NewIdeaForm.svelte:57-61, SaveToLiterature.svelte:53-55, CommandRows `onsaid`), which the step does not change.
  - None of these breaks a rule.
- C13 does not apply to item 5. The apply control sends no write that names a hub: it opens a file and places text. A root that has left the workspace is refused by the file route (G106), with a different sentence from `no_hub_named`. The case should say which paths it covers.
- "Each new row runs once on the unchanged tree first and its failure is quoted" (item 7) agrees with spec.md:67. For the shared-list table, the failure on the unchanged tree can only be a missing export: `hubChoices` and `literatureHome` already give each listed row.
- Item 2, "an empty folder sends no folder", changes today's behaviour for the primary as well. Today an emptied Folder is sent as `folder: ''` and refused with `idea_folder_empty` (NewIdeaForm.svelte:51; manifest.ts:630-632). The brief states this, so it is not a silent decision, but the decisions list does not record it.
- Size: `wc -l` gives `writes.svelte.ts` 874 lines against the 880 limit. Adding `root` to `newIdea` and its comment leaves 6 lines of room before a split. Verify 4 and the "split" path item cover it.

## 5. The question (could it pass without the goal being reached?)

Goal: every way a record is created in a workspace of several hubs asks which hub when more than one could take it, the primary first.

- The step line itself names no check.
- Verify 1-5, 7 and 8: yes, they can pass without the goal; they are hygiene checks.
- Verify 6 (the grep for `literatureHome` and `homeCollection`): yes. A path can still pick the primary by other code, such as lead-apply.ts:31 `client.fs.primary()` or a `hubs[0]`.
- C1: yes; it is today's behaviour.
- C2: no for the Projects board. Yes for Lit Watch's New Project (RadarCard.svelte:243), which no case names. Both share NewIdeaForm, so the risk is small but not shown.
- C3: yes; today's behaviour.
- C4: no, in that it presupposes `lab` chosen; it proves the domain list follows the hub, not that the form asks.
- C5: yes. It is a server row and proves nothing about the form sending `root`.
- C6: no; it needs the menu and the write to `lab`.
- C7: yes. It proves where the card looks, not that Save asks.
- C8: yes. `literatureHome` already gives `lab` at once on the unchanged tree (saved.ts:28).
- C9 and C10: no, if taken on screen.
- C11: no for the paths that ask. It proves nothing for a path that never asks.
- C12: yes, vacuously. With no menu, Escape writes nothing.
- C13: yes. The server refusal exists for `new-entry` and `literature-save` today and does not need the client to ask.
- Item 1: yes. The table test proves the list, not that every path uses it.
- Item 2: no as built. Its only proof of the asking is C2's look; item 7's rows prove the server.
- Item 3: no as built (C6).
- Item 4: no as built (C9). `addTask` is pure state and could carry a test row, but none is asked for.
- Item 5: no as built (C10).
- Item 6: yes; documents.
- Item 7: yes. It proves the server routing and the list, not the four client paths.
- What proves the goal for the client paths is the landing look (C2, C6, C9, C10), which spec.md:65 makes the proof of DOM behaviour. With the scratch-server wording of brief:52 (check 4), that look is not where the rules file puts it.

## 6. Implied inputs

Each line gives the input, whether a case covers it, and the expected result where it is missing.

- No primary: C11. Missing part: the apply control. Brief item 5 says "with one hub it opens that file, as today", but with no primary `viewSourceFile` returns null and today nothing opens (lead-apply.ts:34 `if (file === null) return '';`). Expected: with one hub holding Applications and no primary, that hub's file opens with the entry placed. This contradicts "as today".
- One hub: C3 (New Project) and C8 (Save). Add Task and apply rely on "as today"; acceptable.
- A hub without the collection, Add Task: missing. Only `lab` holds tasks while `research` is primary. Today this refuses with `task_add_collection` (new-entry.ts:41; asserted at new-entry.test.ts:85); under item 1 it is written to `lab` at once. Expected: the task is written to `lab`'s tasks file with no question. This has a cost: a behaviour change against a committed assertion.
- A hub without the collection, apply: missing. Only `lab` holds Applications with a primary set. Today the primary's configured path under the primary's root is opened (lead-apply.ts:28-33). Expected: `lab`'s Applications file opens with the entry placed, and nothing in `research`.
- A hub without the collection, Save: covered by C8.
- A hub without a `new_project_dir` for the tier: missing. This happens with oculus's default (`new_project_dir: {}`, sources.yml:21). On the Projects board, `lab` chosen with no folder typed is refused with `idea_no_folder`, said in the form. On Lit Watch (no tier, so no Folder field, NewIdeaForm.svelte:72) the same hub can never be written. Expected: the refusal is said in the form, and on Lit Watch either the Folder field is drawn once a hub other than the primary is chosen, or the case is ruled. Cost: the reader cannot complete the form. Adding a Folder field on Lit Watch widens the step; stating the expected refusal does not.
- A hub removed: C13. It does not fit item 5 (check 4).
- Folder and domain in a non-primary hub: C2 and C4. Missing: switching the hub after typing a Folder or choosing a Domain.
  - A Folder typed for `research` and kept when `lab` is chosen writes under `lab` at that path, or is refused as outside `lab`'s scan folders.
  - A domain key of `research` kept after the switch writes a `domain:` that `lab`'s registry lacks, which goes against C4's own expected result.
  - Expected: a hub change resets the Folder to that hub's starting value (the primary's dir, or empty) and clears a domain the new hub's registry does not hold.
- A paper held by one hub: C7. Missing: Literature's own Add (entry-add.ts:166-193) of a paper `lab` holds, saved to `research`. The server refuses a duplicate only within the target file, so the paper is written a second time, against decision 4 ("A paper is saved once per workspace"). Expected under decision 4: refused, or decision 4 narrowed to "a card offers Save only while no hub holds the paper". Extending the refusal to Literature's Add widens the step; narrowing the decision's wording does not.
- Keyboard use of the menus: missing; only Escape (C12) is named. Expected: the arrow keys move through the hubs with the primary first, Enter saves to (or opens) the hub chosen, and focus returns to the button. Item 3 requires keyboard use, and spec.md:60 counts keys and focus as visible.
- Shift+Enter on Add Task with the second prompt: missing. Shift on the title row opens the task's page today (CommandRows.svelte:98-121, `opensTaskPage`). Expected: Shift held at the title press, or at the hub press, still opens the page after the write.
- An id `research` already holds, made in `lab`: no case. `createIdea` checks only the target hub's manifests (manifest.ts:609), so the write goes through. Ruling 203 (b) gives both projects their hub's prefix. Low cost; no case needed.
- `root: ''` on `new-idea` (spec.md:71, an empty key): no case. `routedRoot` gives null, so the write is refused with `no_hub_named` (hubs.ts:139-144). The builder reports this under spec.md:71; no case needed.

## 7. ADRs

`ls docs/adr` gives "No such file or directory": there is no ADR folder, so no ADR bears on the step.

## 8. Dictated text

`grep -n '"[^"]*"' .scratch/migration/agents/briefs/O56.md` lists every quoted string. Of these, only one is text the brief gives word for word for a file:

- brief:121, the first line of `.scratch/migration/agents/reviews/O56-report.md`: "Everything in the brief is done". Holds; it is the same line spec.md:82 gives.

Not dictated:
- brief:18 quotes `config/defaults/sources.yml:28`.
- brief:31, "the primary, else the first", is wording to be replaced.
- brief:12, "Hub", is an existing catalog word.
- C7 and item 3, "In Literature", is the existing value at `config/text/views/feeds/literature.yml:106`.
- Item 3's tooltip and the menu and prompt words are required by what they say, with no words given.

`LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/briefs/O56.md` prints nothing: the brief is ASCII.

## Findings whose fix widens the step

- Drawing a Folder field on Lit Watch's New Project when a hub without `new_project_dir` is chosen (check 6). Widens the step.
- Making Literature's own Add refuse a paper another hub holds, to honour decision 4 (check 6). Widens the step. The fix that does not widen is narrowing decision 4's wording.
- Every other finding is a fix inside the line's scope:
  - adding `tests/state/feeds/literature-home.test.ts`, `tests/state/forms/new-entry.test.ts`, `src/lib/state/client/selectors.svelte.ts` (`domainChoices`), `docs/data-map.md:214` and `config/text/app.yml:155` to the write list;
  - the palette files item 4 may need (`src/lib/shell/keys/Palette.svelte`, `src/lib/shell/keys/lists/`; the precedent is the language mode's second list, Palette.svelte:297-303 and `lists/language-list.svelte.ts:33-66`);
  - naming the menu file;
  - the G17 placement;
  - the cases listed in check 6;
  - the `addTask` rows;
  - the look's place;
  - the `shared_paths` with O53.

## Declined to judge

- Whether the palette can ask a second value inside `CommandRows.svelte` alone, or needs `Palette.svelte` and `src/lib/shell/keys/lists/`. A precedent exists (the language second list, Palette.svelte:297-303), but settling the files needed means designing the change, which a brief check does not do.
- Whether ruling 251's "Add person" (O53) must also ask under ruling 210. It is not on the tree at 29dc034d, and it turns on how ruling 203 (b) reads "could take it", which is the orchestrator's call.
- The exact merge order of `collectionsOfKey` beyond `mergeHubs` building "the parts in the workspace's folder order" (src/lib/data/snapshot/hubs/merge.ts:259-264). The order a workspace with no primary lists its parts was not traced further.
- The test suite was not run. A brief check reads and does not run tests, and spec.md:26 limits test runs to builders and landings.

Usage: a837bbfa456b7963d, claude-opus-5-5, 232172 tokens, 78 tool uses, 10 min 51 s

## Closed

Every finding is closed in `agents/briefs/O56.md`, inside ruling 210's line; none is raised as an open item.

- Check 1, names: the shared list is placed in `src/lib/state/shared/page/hubs.ts` with plain values (G17's order), the menu named as `src/lib/ui/menu/Menu.svelte` with `MenuOpener.svelte`, `domainChoices` given at `selectors.svelte.ts:322-325`, the selector `newProjectFolder` at `:713`.
- Check 3, premises: `writes.svelte.ts` at 874 lines; `viewSourceFile` primary only, the chosen hub's `Collection.file` and schema named; `homeCollection` with a primary that holds no tasks and its refusal `task_add_collection` (`app.yml:155`, `new-entry.test.ts:85`); LinkedIn ideas outside the line; an app's writes reach the primary alone (`docs/apps.md:417,428`); G28 and G77 named; the overlap with O53 and O61 restated with their real paths.
- Check 4, cases and the test rule: `literature-home.test.ts` deleted with `literatureHome`, the shared list's table in its place; G8's `addTask` rows follow item 4; the look's place is the configuration block's `look:`.
- Check 6, implied inputs: C9b, C10b, C12 (keyboard), C12b (a hub change resets Folder and Domain), C12c (a hub with no folder refuses with `idea_no_folder`), C12d (Shift) added; C13 limited to `new-idea`, `new-entry` and `literature-save`.
- The two findings the check said would widen the step are closed without widening it: decision 1 states that a hub with no `new_project_dir` for the tier refuses with `idea_no_folder` said in the form, Lit Watch drawing no Folder field; decision 4 reads "a card offers Save only while no hub holds the paper", Literature's own Add unchanged. Decision 1's premise is corrected: oculus's default `new_project_dir` is `{}` (`config/defaults/sources.yml:20-21`).
- C7's tooltip naming the hubs is dropped: no ruling asks for it.
- Paths added: `selectors.svelte.ts`, `writes/hubs.ts` lines 150-170, `Palette.svelte` and `src/lib/shell/keys/lists/`, `docs/data-map.md:214`, `config/text/app.yml`, `tests/state/forms/new-entry.test.ts`, `tests/state/feeds/literature-home.test.ts` (deleted).
- Declined point 1, O53's Add person under ruling 210: O53's brief writes the new person to the hub of the edited record (O53 C9), the one hub where the key resolves own hub first, so no other hub could take it and no question is asked.
