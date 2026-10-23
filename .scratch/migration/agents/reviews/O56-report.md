# O56 report

Everything in the brief is done.

Every item of "What to build" (1 to 7) is built. C2, C6, C9 and C10 on screen and the keyboard and focus of C12 are the orchestrator's look at landing, since the builder runs no page.

## First run of every case on the unchanged tree

Tests run on the unchanged tree (base 892189d7), and what they printed:

- `tests/state/shared/hubs.test.ts` (new table of item 7): 7 failed, `TypeError: hubsTaking is not a function`.
- `tests/state/forms/new-entry.test.ts`, row "is the one hub holding tasks when the primary holds none": `AssertionError: expected 'The hub has no tasks collection, so n...' to deeply equal { root: 'second', key: 'review-2' }`.
- the same file, row "is the hub chosen, the primary not": `expected { root: 'research', key: 'review' } to deeply equal { root: 'second', key: 'review-2' }`.
- the same file, row "is none for a hub chosen that holds no tasks collection": `expected { root: 'research', key: 'review' } to be 'The hub has no tasks collection, so n...'`.
- `tests/routes/hubs/hub-writes.test.ts`, row "writes the project into lab": `expected 'hub:new-idea' to be 'lab:new-idea'`.
- the same file, "refuses a new project for a hub no workspace folder carries": `expected 200 to be 404`.
- the same file, the no-root row passed (the primary, the behaviour kept).
- `tests/views/.../entry-add.test.ts` (13 passed, C1) and `tests/state/feeds/literature-home.test.ts` (passed, C8) on the unchanged tree.

Each case on the unchanged tree, by those runs and by reading the code path:

| Case | Unchanged tree |
| --- | --- |
| C1 | met (entry-add.test.ts passed; `hubChoices` gave the primary first) |
| C2 | not met: NewIdeaForm drew no Hub field; the `new-idea` body had no `root` |
| C3 | met |
| C4 | not met: Domain choices read the page's merged domains, not a hub's |
| C5 | not met: `newIdeaShape` stripped `root`; written to the primary |
| C6 | not met: Save wrote `literatureHome`'s hub (primary else first), no menu |
| C7 | not met: In Literature read only `literatureHome`'s collection |
| C8 | met (literature-home.test.ts passed) |
| C9 | not met: `addTask` took `homeCollection` (primary else first), no question |
| C9b | not met: with only `lab` holding tasks and `research` primary, refused; the words said "The hub has no tasks collection" |
| C10 | not met: the apply control opened the primary's Applications file, no menu |
| C10b | not met: opened the primary's file path whether or not it held Applications |
| C11 | met for a collection's Add only; the other paths asked nothing |
| C12 | not met: no Save, apply or palette hub list existed |
| C12b | not met: no Hub field |
| C12c | not met: NewIdeaForm said `editor.saved` and closed on an `idea_no_folder` refusal (the answer is `ok: true` with `refused`) |
| C12d | not met: no hub question existed |
| C13 | not met for `new-idea` (written to the primary); `new-entry` and `literature-save` refused with `no_hub_named` |

No case was found that the brief's own rules get wrong.

## What changed, per item

1. One rule for which hubs could take a record.
   - `src/lib/state/shared/page/hubs.ts:32` `hubsTaking(holders, primary)`: the hub names of the holders (collections or names), unique, the primary first, then the given order.
   - `src/lib/views/shared/forms/entry/entry-add.ts:52` `hubChoices` reads `hubsTaking(collectionsOfKey(collection), fs.primary())`.
   - `literatureHome` removed from `src/lib/state/feeds/literature/saved.ts`; `homeCollection` removed from `src/lib/state/forms/new-entry.ts`; `tests/state/feeds/literature-home.test.ts` deleted; `tests/state/shared/hubs.test.ts` takes its place.
2. New Project asks.
   - `src/lib/views/shared/forms/NewIdeaForm.svelte:47` the hubs are `hubsTaking` of the workspace's hub roots and the primary; the Hub Select (label `board.new_idea_hub`, `config/text/views/boards/projects.yml:34`) is drawn at line 118 only with more than one hub, the primary first and chosen.
   - `:63` `startFolder`: the primary's `newProjectFolder(tier)` for the primary (or no hub), empty for another hub; `:78` `choose` resets the Folder and clears a Domain the new hub's registry lacks; an empty Folder sends no `folder`; the save sends `root` as the hub.
   - `:74` Domain choices are `domainChoices(hub)`; `src/lib/state/client/selectors.svelte.ts:326` `domainChoices(hub)` reads `hubVocabs().lists[hub].domains`, its head comment rewritten.
   - `:104-105` the form says `answerWords(answer)` and closes only when the answer is ok with nothing refused, so `idea_no_folder` is said in the form (C12c).
   - `src/lib/state/shared/stores/shapes.ts:270` `NewIdeaFields`, `:408` `newIdea(fields, root?)`; `src/lib/state/client/writes.svelte.ts:644` sends `root` when given.
   - `src/lib/server/edit/writes/bodies.ts:92` `NewIdeaWrite.root?`, `:457` `newIdeaShape.root`.
   - `src/lib/server/edit/writes/hubs.ts:170` `rootedHome(into, root, app, unnamed)`: with `root`, `routedRoot`; null for a named hub refused 404 `server.workspace.no_hub_named`; with no `root`, `unnamed()` (`homeOf`), refused as `noHub` refuses. `src/lib/server/edit/writes.ts:687` the `new-idea` write uses it. The head of `routedRoot` (`hubs.ts:154-160`) names a new project.
   - `NewIdea.svelte` and `RadarCard.svelte` are unchanged: the form reads the hubs itself, so Lit Watch's New Project asks the same way with no prop change.
3. Save to Literature asks.
   - `src/lib/views/shared/card/feed/SaveToLiterature.svelte:44` hubs are `hubsTaking` of every collection keyed Literature; the paper is saved in any hub's Literature: In Literature, disabled; else with more than one hub a `Menu` (`src/lib/ui/menu/Menu.svelte`, its own `MenuOpener`) at `:79`, title `literature.save_hub_tip` (`config/text/views/feeds/literature.yml:105`), each hub by its name, the pick calling `saveLiterature(source, paper, hub)`; else one ToolButton saving to the single hub. Props unchanged, so `LiteratureCard.svelte` is untouched.
4. Add Task asks.
   - `src/lib/state/forms/new-entry.ts:87` `taskTitleRefusal(title)`; `:97` `taskHubOrder(collections, primary)`, which is `hubsTaking` over the tasks collections; `:127` `addTask(..., hub?)` takes the hub chosen, else `taskHubOrder(collections, primary).at(0)`, and that hub's collection; none gives `task_add_collection`, now "No hub of the workspace holds a tasks collection, so no task can be added." (`config/text/app.yml:156`).
   - `src/lib/shell/keys/lists/task-hub-list.svelte.ts` (new): the second palette list, active while a title was pressed and the query is `task-add` with that title (any other query clears it, `task-hub-list.svelte.ts:55-56`), rows `task-hub:<hub>`; `taskHubs(client)` reads `taskHubOrder` of `state/forms/new-entry`, a module the shell's row of `tests/checks/tree/boundaries.test.ts` names, so the shell imports nothing the row does not allow.
   - `src/lib/shell/keys/lists/mode-lists.svelte.ts:101-130` carries it as `taskHub` and `modeRows`; `src/lib/shell/keys/Palette.svelte:239,303,441` feeds it, selects its first row, passes it to CommandRows.
   - `src/lib/shell/keys/rows/CommandRows.svelte:109` `addTaskPressed` asks the hubs when more than one holds tasks and the title is not refused, else adds at once; `:118` `addTaskTitled(title, open, hub?)`; `:232` the title line `app.palette.task_hub_title` (`app.yml:160`) and one row per hub, kind `app.palette.kind_hub` (`app.yml:117`). Shift at the title or at the hub opens the page.
5. The apply control asks.
   - `src/lib/views/shared/card/feed/lead-apply.ts:26` `applyHubs(client)`; `applyFromLead(..., hub)` opens that hub's Applications file (the primary's view-source file for the primary, `fileUnder(held.file, roots, primary)` for another hub) with that hub's schema; with no hub holding Applications it says `leads.action.no_applications` (`config/text/views/feeds/leads.yml:10`).
   - `src/lib/views/shared/card/feed/LeadCard.svelte:101,163` a `Menu` with more than one hub (title `leads.action.applied_hub_tip`, `leads.yml:7`), else the ToolButton applying to the single hub.
6. Comments and documents: the head comments of every changed source file state item 1's rule; `docs/HELP.md:97` (`:task-add`), the Projects and Literature and Position Leads lines; `docs/apps.md:426` (`new-idea` with `root?` and every field); `docs/data-map.md:214`; `docs/diagrams/` regenerated by `npm run diagrams`.
7. Tests.
   - `tests/routes/hubs/hub-writes.test.ts`, describe 'the hub a new project is written to': rows "writes the project into $name (G8)" for `lab` (written under `lab`'s `projects/ideas/new-idea/`, id `lab:new-idea`, nothing in the primary) and for no `root` (the primary, id `hub:new-idea`); "refuses a new project for a hub no workspace folder carries, and writes nothing (G8)" with `root: 'nowhere'`.
   - `tests/state/shared/hubs.test.ts`: 'the hubs that could take a new record', 7 rows "are $name (G8)": the primary first when it is second in the workspace; the one hub that holds the collection; the workspace's order with no primary; the others when the primary does not hold the collection; none when no hub holds it; each hub once and no holder of no hub; every hub of the workspace for a new project, the primary first.
   - `tests/state/forms/new-entry.test.ts`: the `addTask` rows of item 4, assertions listed under verify 7 below.

## Each path that creates a record, and the hubs it offers now

| Path | Hubs offered |
| --- | --- |
| A collection's Add (entry form) | the hubs holding the collection, primary first; a field when more than one |
| New Project (Projects board, Lit Watch) | every hub of the workspace, primary first; a field when more than one |
| Save to Literature | the hubs holding Literature, primary first; a menu when more than one, else that hub at once |
| `:task-add` | the hubs holding tasks, primary first; a second palette list when more than one, else that hub at once |
| Apply from a lead | the hubs holding Applications, primary first; a menu when more than one, else that hub's file at once |
| Add Lead, Add to Lit Watch, LinkedIn idea | unchanged (feeds; decision 2 of the brief) |

## Cases before and after

| Case | Unchanged tree | After | Evidence after |
| --- | --- | --- | --- |
| C1 | met | met | entry-add.test.ts 8 passed; hubs.test.ts rows |
| C2 | not met | met in code; on screen at landing | hub-writes "writes the project into lab"; NewIdeaForm.svelte:47,118 |
| C3 | met | met | NewIdeaForm.svelte:118 draws the field only for more than one hub; hub-writes no-root row |
| C4 | not met | met | selectors.svelte.ts:326 reads the chosen hub's domains; NewIdeaForm.svelte:74 |
| C5 | not met | met | hub-writes "refuses a new project for a hub no workspace folder carries, and writes nothing" |
| C6 | not met | met in code; on screen at landing | SaveToLiterature.svelte:44,79 |
| C7 | not met | met | SaveToLiterature.svelte: `saved` reads every hub's Literature |
| C8 | met | met | SaveToLiterature.svelte: one hub, the ToolButton saves there; hubs.test.ts row "the others, when the primary does not hold the collection" |
| C9 | not met | met in code; on screen at landing | new-entry.test.ts "is the hub chosen, the primary not"; CommandRows.svelte:109,232 |
| C9b | not met | met | new-entry.test.ts "is the one hub holding tasks when the primary holds none"; app.yml:156 words |
| C10 | not met | met in code; on screen at landing | lead-apply.ts:26-49; LeadCard.svelte:163 |
| C10b | not met | met | lead-apply.ts: one hub, that hub's file; hubs.test.ts no-primary row |
| C11 | met (Add only) | met | hubs.test.ts row "the workspace's order, in a workspace with no primary" |
| C12 | not met | met in code; keyboard and focus at landing | Menu.svelte:14 (Escape and a pick give the focus back to the button) and MenuList.svelte:11 (bits-ui's arrows and Enter); the palette hub list is cleared when the query changes (task-hub-list.svelte.ts:55-56), and Escape closes the palette with nothing written |
| C12b | not met | met | NewIdeaForm.svelte:78 `choose` |
| C12c | not met | met | NewIdeaForm.svelte:104-105; server refuses `idea_no_folder` with no folder |
| C12d | not met | met | CommandRows.svelte:118 `addTaskTitled(asked.title, asked.open \|\| shifted, hub)` |
| C13 | not met for new-idea | met | `rootedHome` in new-entry, new-idea and literature-save; hub-writes nowhere row |

## Verify lines, from the run after the last change

1. While working, only the test files that reach the change ran: `tests/state/shared/hubs.test.ts` (7 passed), `tests/state/forms/new-entry.test.ts` (20 passed), the entry-add test (8 passed), `tests/routes/hubs/hub-writes.test.ts` (44 passed), the feeds and writes route tests (95 passed in one run), `tests/checks/tree/boundaries.test.ts` (11 passed, with `--testTimeout 0` as `test:checks` runs it), `tests/data/hubs/hub-portfolio.test.ts` (16 passed, with `--tagsFilter slow --testTimeout 20000` as `test:slow` runs it).
2. `npm run format` exited 0 and changed no file outside the step's. `npm run diagrams && npm run test:quick` (the verify list), the run after the last change, exited 0:
   ```
   ok      prettier (1.5 s): All matched files use Prettier code style!
   ok      ASCII gate (1.6 s)
   ok      svelte-kit sync (2.1 s)
   ok      svelte-check (62.2 s): 1792747291856 COMPLETED 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
   ok      eslint (71.9 s)
   ok      vitest checks (105.6 s): Duration  97.49s (transform 88.68s, setup 0ms, import 205.28s, tests 156.90s, environment 3ms)
   ok      vitest (107.9 s): Duration  100.38s (transform 174.09s, setup 0ms, import 250.89s, tests 83.68s, environment 31.61s)
   ok      vitest slow (136.3 s): Duration  128.77s (transform 9.12s, setup 0ms, import 88.18s, tests 415.97s, environment 10ms)
   test:quick: 138.6 s; every command passed
   test:quick: not covered: tests that reach no changed file within the import depth,
               the build, the lint of unchanged files
   ```
   The verify list was started four times. Two runs were stopped before they finished (one for a comment edit, one by the user's pause) and their results are lost. The third run, after the last change at that time, was red in two files: `tests/checks/tree/boundaries.test.ts` "holds across src/lib" with `"shell/keys/lists/task-hub-list.svelte.ts imports state/shared/page/hubs"` (a changed file, fixed by reading the order through `taskHubOrder` of `state/forms/new-entry`, then `boundaries.test.ts` rerun alone: 11 passed), and `tests/data/hubs/hub-portfolio.test.ts` "resolves a reference of the second hub in the primary hub when the primary alone holds the key" with `Test timed out in 20000ms` (a file the step did not change; rerun alone: 16 passed). The fourth run is the green one quoted above. No whole-suite command (`npm test`, `test:landing`, `test:checks`, `test:slow`) ran. `npm run diagrams` changed `docs/diagrams/` layers, layer-shell, layer-state, layer-views and writes (`.dot` and `.svg`).

3. ASCII gate of `spec.md` over every changed file: printed nothing, exit 0 (rerun over `new-entry.ts` and `task-hub-list.svelte.ts` after their last change: nothing).
4. Sizes (`wc -l`): Palette.svelte 519, CommandRows.svelte 269, LeadCard.svelte 317, NewIdeaForm.svelte 182, SaveToLiterature.svelte 118 (components, at most 520); writes.svelte.ts 868, hub-writes.test.ts 841, writes.ts 804, selectors.svelte.ts 747, bodies.ts 706, shapes.ts 514, every other changed file under 330, `new-entry.ts` 136 and `task-hub-list.svelte.ts` 76 (at most 880). Folders: `src/lib/shell/keys/lists` 10 items, `tests/state` 9, `tests/state/shared` 1.
5. `sh utils/unused-exports.sh` against `../migration-O56-base/unused-exports.txt`: `diff` printed nothing, exit 0.
6. `grep -rn "literatureHome\|homeCollection" src tests`: nothing (exit 1). `grep -rn "primary()" src/lib/views/shared/card/feed src/lib/views/shared/forms src/lib/shell/keys/rows`:
   - `SaveToLiterature.svelte:44`, `lead-apply.ts:27`, `NewIdeaForm.svelte:51`, `entry-add.ts:52`, `CommandRows.svelte:122`: the primary passed to `hubsTaking` for the order only.
   - `NewIdeaForm.svelte:65`: the Folder's starting value for the primary.
   - `lead-apply.ts:43`: the primary's own file path for the primary's Applications.
   - `edit/page-file.ts:19`, `registry/registry-file.svelte.ts:56,62,64`: open an existing page or registry file; they make no record.
   No path picks a hub for a new record.
7. Assertion edits, from `diff ../migration-O56-base/tests/... tests/...`:
   - `new-entry.test.ts`: `['the primary hub when there is one', [other, own], 'research', 'review']` with `toMatchObject({ key })` became `['the primary hub when there is one', [other, own], 'research', undefined, 'research', 'review']` with `toEqual({ root, key })`.
   - `['the first hub when there is no primary', [other, own], null, 'review-2']` became `[..., null, undefined, 'second', 'review-2']` with `toEqual({ root, key })`.
   - `it('is none when the primary hub holds no tasks collection'` with `made('Review', [other], 'research')` became `it('is none for a hub chosen that holds no tasks collection'` with `addedTo([other, own], 'research', 'nowhere')`, the expected words the same key; the old row's case is now the row "the one hub holding tasks when the primary holds none", which gives `{ root: 'second', key: 'review-2' }`.
   - The fixture helpers `entry(key, root?)` and `tasks(keys, root?)` became `entry(key, root)` and `tasks(keys, root = 'research')`, setting `root` directly.
   - `hub-writes.test.ts`: additions only (`diff | grep '^<'` printed nothing).
8. History-word grep over the added lines and the two new files, hits:
   - `CommandRows.svelte` comment "A title that makes no task is refused before any hub is asked": the order at run time, kept.
   - `selectors.svelte.ts` comment "None before the config's first message": the order at run time, kept.
   - `new-entry.ts` comment "what Add Task says before it asks the hub": the order at run time, kept.
   - `hub-writes.test.ts` `const before = ...` and `before.first`/`before.lab`: a variable name in test code, not a comment or title, kept.

## Judgment calls

- `rootedHome` in `hubs.ts:170` is shared by `new-entry`, `new-idea` and `literature-save`, so the three refuse a gone hub the same way (C13). It reaches outside the brief's line ranges: `writes.ts:577-585` (the `new-entry` write, outside 685-700) and `src/lib/server/edit/feeds/feed-route.ts:136` (outside the path list). `routedRoot` is no longer exported.
- New text keys: `board.new_idea_hub` (the board's own key, the brief's second option), `literature.save_hub_tip`, `leads.action.applied_hub_tip`, `leads.action.no_applications`, `app.palette.kind_hub`, `app.palette.task_hub_title`; `task_add_collection` reworded.
- The palette's hub order comes through `taskHubOrder` in `state/forms/new-entry.ts` because the shell's row in `boundaries.test.ts` names `state/forms/new-entry` and not `state/shared/page/hubs`; the row is unchanged.
- `taskTitleRefusal` checks the title before the hub list opens, so a bad title is refused without a question.
- Shift held at the title press or at the hub press opens the task's page.
- The palette's hub rows are read live from the workspace each time the list is drawn.
- `NewIdeaFields` in `shapes.ts` keeps `writes.svelte.ts` at 868 lines, under 880.
- NewIdeaForm sends `root` even with one hub.
- NewIdeaForm now closes only on a write with nothing refused, and says the answer's words, so a refused idea is said in the form (C12c).
- The apply control with no hub holding Applications says `leads.action.no_applications`.
- Both menus open downward (`placement="down"`).

## Findings, sharp edges and anything in the brief found wrong

- After a pick, the written record changes the card: Save gives way to the disabled In Literature button, and the apply control is not drawn once the lead reads applied (`LeadCard.svelte:162`). The focus Menu.svelte gives back to the button lands on an element that is then removed; C12's "the focus returns to the button" holds for Escape, not after a pick. The orchestrator's look at landing checks it.
- `root: ''` in a body is refused with `no_hub_named` and an empty name in the words.
- The pattern "the primary's view-source file for the primary, `fileUnder` for another hub" appears in six places: `lead-apply.ts:47-49` (this step), `page-file.ts:30-32`, `registry-file.svelte.ts:62-64`, `Collection.svelte:140-142`, `Person.svelte:101-103` and `focus/rows.ts:104-106` (read with `grep -n -B2 -A2 "fileUnder("`). One helper would serve all six; it is a different concern from ruling 210 and five of the files lie outside this step's paths, so it is a proposal for the orchestrator to book, not done here.
- Nothing in the brief was found wrong or impossible.

# Repair round 1

Every ruling of `agents/briefs/O56-round1.md` is done. Ruling 5 is the orchestrator's at landing and asks no work here. The verify list ran once after this round's last change, and it was green.

## Ruling 1: the focus after a pick that saves (DONE)

Save to Literature (`src/lib/views/shared/card/feed/SaveToLiterature.svelte`):
```svelte
<span class="save" bind:this={box}>
    {#if saved}
        <ToolButton label={t('literature.in_literature')} glyph="book" waiting ... />   <!-- was: disabled -->
    {:else if hubs.length > 1}
        <Menu ... waiting={saving} ... onpick={(hub: string) => void save(hub)} />
    {:else}
        <ToolButton label={t('literature.save')} glyph="book" waiting={saving} ... />   <!-- was: disabled={saving} -->
```
```ts
async function save(hub: string | undefined): Promise<void> {
    if (saving) return;
    saving = true;
    refocus = box?.contains(document.activeElement) ?? false;     // :68
    try {
        const answer = await saveLiterature(source, paper, hub);
        const refused = refusalWords(answer);
        if (refused !== '') refocus = false;                        // :72
        ...
// :82-90
$effect(() => {
    if (!saved || !refocus) return;
    untrack(() => {
        refocus = false;
        const now = document.activeElement;
        if (now === null || now === document.body) box?.querySelector('button')?.focus();
    });
});
```
What the code does:
- `Menu.svelte:14-16` gives the focus back to its opener before `onpick` runs, so when `save` starts the focus is inside `box` and `refocus` is set.
- When the paper is held, `saved` turns true and the `{#if}` swaps the opener for In Literature. That button is drawn `waiting` (`ToolButton.svelte:100`: `aria-disabled`, not `disabled`), so it stays in the focus order. Removing the focused opener leaves the focus on the body, and the effect then gives the focus to In Literature.
- The one-hub button is drawn `waiting={saving}` instead of `disabled={saving}`. It keeps the focus while the save is out and hands it to In Literature the same way.
- When the save is refused, `refocus` is cleared, so the focus stays on the Save control, which is still drawn.
- When the focus went somewhere else while the save was out, the effect leaves it there.
- The head comment states this.

`ToolButton.svelte` is unchanged: its `waiting` look already keeps the button in the focus order.

Checked by reading only. No test drives the focus, and the page and the browser are not run. The look at landing sees it with two hubs.

Apply menu on a Position Lead card: I read the base copy for where the focus goes after a press of the base's apply button.
- On the base, `applyFromLead` (base `lead-apply.ts`) calls `placeInFile`. `placeInFile` (`entry-file.ts`) opens the Applications tab beside the view and calls `arrived`. `arrived` calls `openSourceFile` with a range and no `focus: false`. `Editor.svelte` `goingTo` turns that range into a `range` command with the focus asked. `runCommand` (`ui/controls/editor/commands.ts:93`) runs `if (command.focus !== false) made.focus();`.
- So after a press that places the entry, the base leaves the focus in the Applications tab's editor, at the new entry. When a press places nothing (no file, or no tab opened), the focus stays on the apply button, and the lead is not marked applied, so the button stays drawn.
- The step's apply menu does the same. `Menu.svelte` gives the focus back to the opener, then `onpick` runs `apply`, and the editor takes the focus when the entry is placed. When nothing is placed, the lead is not applied, the Menu stays drawn, and its opener keeps the focus.
- In no case does the base leave the focus on the card while the lead reads applied. The second half of ruling 1 ("the control drawn in the menu's place takes it the same way") therefore has no case to act on, and no code was added for it. The look at landing checks where the focus lands.

## Ruling 2: a true sentence for a chosen hub that holds no collection (DONE)

The text, dictated word for word:
- `config/text/app.yml:157`: `task_hub_collection: 'The hub {0} holds no tasks collection, so no task can be added to it.'`
- `config/text/views/feeds/leads.yml:11`: `hub_no_applications: 'The hub {0} holds no Applications collection, so no application can be opened in it.'`

`src/lib/state/forms/new-entry.ts:131-137`:
```ts
if ('refusal' in made) {
    const said =
        made.refusal === 'collection' && hub !== undefined
            ? t('app.palette.task_hub_collection', hub)
            : refusalWords(made.refusal);
    return { id: '', label: '', said };
}
```
With no hub named, `addTask` takes the first hub holding tasks. It says `task_add_collection` only when no hub holds one. The doc comment of `addTask` says this.

`src/lib/views/shared/card/feed/lead-apply.ts:44-50`:
```ts
const holders = collectionsOfKey(APPLICATIONS);
const held = holders.find((one) => rootOf(one) === hub);
if (held === undefined) {
    return holders.length === 0
        ? t('leads.action.no_applications')
        : t('leads.action.hub_no_applications', hub);
}
```
The doc comment of `applyFromLead` says this.

The test row, `tests/state/forms/new-entry.test.ts:138-142`:
- Before: `it('is none for a hub chosen that holds no tasks collection', ...)`, expecting `t('app.palette.task_add_collection')`.
- After: `it('is none for a hub chosen that holds no tasks collection, said by its name', ...)`, expecting `t('app.palette.task_hub_collection', 'nowhere')`, for the same input `addedTo([other, own], 'research', 'nowhere')`.

The run on the base copy used a case-run program (ruling 262 a). It is a copy of the test file with its imports pointed at the base copy's `src`, run once, then deleted. It wrote nothing into the step's diff (`ls tests/state/forms` afterwards shows no extra file). Its source:
```
sed "s#'../../../src/#'../../../../migration-O56-base/src/#" tests/state/forms/new-entry.test.ts > tests/state/forms/new-entry-onbase.test.ts
npx vitest run tests/state/forms/new-entry-onbase.test.ts -t "said by its name"
rm tests/state/forms/new-entry-onbase.test.ts
```
Its output:
```
 FAIL  |unit| tests/state/forms/new-entry-onbase.test.ts > the hub a task is added to > is none for a hub chosen that holds no tasks collection, said by its name
Error: text key not in the text catalog (config/text/): app.palette.task_hub_collection
 Test Files  1 failed (1)
      Tests  1 failed | 19 skipped (20)
```
The base has neither the sentence nor the hub argument. In round 0, the same input on the base gave `{ root: 'research', key: 'review' }`, the task written to the primary.

After the change: `npx vitest run tests/state/forms/new-entry.test.ts` passed 20 of 20.

No test file guards `lead-apply.ts` (`grep -rln "lead-apply" tests` printed nothing). The apply case is therefore checked by reading the code at `:44-50` above.

## Ruling 3: the apply pick in flight, and every new key or asynchronous path (DONE)

`src/lib/views/shared/card/feed/LeadCard.svelte`:
```ts
let applying = $state(false);                                        // :84
async function apply(hub: string): Promise<void> {
    if (applying) return;
    applying = true;
    try {
        onsaid(await applyFromLead(client, entry, beside, hub));
    } finally {
        applying = false;
    }
}
```
The Menu's `waiting={blocked !== '' || applying}` (`:177`) and the one-hub ToolButton's `waiting={applying}` (`:187`) draw the control waiting while the placement is out. The head comment says "While the entry is being placed the control waits, and a second press or pick does nothing."

What the code does for each key and asynchronous path the step adds:
- **The palette row value `task-hub:<hub>`** (`task-hub-list.svelte.ts:51`). I grepped every row value prefix of `src/lib/shell/keys` and `src/lib/state/workbench/palette*.ts`. The prefixes are `app:`, `clone:`, `collection:`, `command:`, `config:`, `database:`, `editor:`, `eslint-config:`, `feed:`, `finding:`, `folder:`, `group:`, `hidden-view:`, `interpreter:`, `language-action:`, `language:`, `project:`, `symbol:`, `task:`, `task-hub:`, `view:` and `workspace:`.
  - No other prefix is `task-hub:`. `task:` differs at its fifth character (`:` against `-`), so no `task:` value can equal a `task-hub:` value.
  - The hub rows are drawn only while the hub list is the active mode list (`mode-lists.svelte.ts:102-104`), which replaces the other rows.
  - `hubsTaking` gives each hub once and drops the empty name, so two hub rows never share a value and no row is `task-hub:` alone.
- **A second apply pick or press while a placement is out**: does nothing (the guard above), and the control is drawn waiting.
- **A second press of the title or of a hub row while a task is being written** (Add Task): `CommandRows.svelte:115-133` adds an `adding` flag, set before `addTask` and cleared in its `.finally`. The press does nothing, so no second `new-entry` write is sent. The head comment states it.
- **`addTaskTitled` answering after the palette closed**: the write lands; the notice "Added the task" is posted (notices are the app's); with Shift held the task's page opens; then `onclose()` sets the workbench's `paletteOpen` to false (`Workbench.svelte:410`).
  - When the reader has opened the palette again in the meantime, that late `onclose()` closes it.
  - A refusal answered after the close is set as the palette's `said`. It is not shown, because the palette is closed (`Palette.svelte:342` draws nothing while closed).
  - The base's Add Task does the same after its write (base `CommandRows.svelte:98-120`). The step adds no new behaviour after the close.
- **A Save to Literature pick while a save is out**: does nothing (`saving`, as in round 0), and the opener is drawn waiting.

## Ruling 4: a before-and-after row for the apply control with no Applications file (DONE)

This row joins the table "Cases before and after":

| Case | Unchanged tree | After | Evidence after |
| --- | --- | --- | --- |
| Apply on a Position Lead, no hub holding an Applications file | opened the path the merged `collections:` names for `applications` under the primary (`config/defaults/sources.yml:41`, through `viewSourceFile`), whether or not the file was there; drew nothing with no primary (`if (file === null) return '';`) | the card says `leads.action.no_applications`, "No hub of the workspace holds an Applications collection, so no application can be opened." | `lead-apply.ts:44-48` by reading |

## Ruling 5

Ruling 5 is the orchestrator's at landing: G8's Code and Test lines in `agents/guarded.md`. No work was done here.

## Verify lines, from the run after this round's last change

Test files run while working: `tests/state/forms/new-entry.test.ts` (20 passed), and the base-copy run above.

`npm run format` exited 0. `npm run diagrams && npm run test:quick` ran once and exited 0:
```
test:quick: 43 changed file(s), from git since HEAD
test:quick: 117 test file(s)
ok      prettier (2.3 s): All matched files use Prettier code style!
ok      ASCII gate (2.4 s)
ok      svelte-kit sync (5.0 s)
ok      svelte-check (134.0 s): 1792750208175 COMPLETED 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (174.1 s)
ok      vitest checks (224.8 s): Duration  193.85s (transform 149.97s, setup 0ms, import 417.99s, tests 249.62s, environment 2ms)
ok      vitest (231.3 s): Duration  204.51s (transform 454.29s, setup 0ms, import 589.79s, tests 103.86s, environment 47.57s)
ok      vitest slow (301.8 s): Duration  275.11s (transform 23.49s, setup 0ms, import 319.93s, tests 755.82s, environment 15ms)
test:quick: 307.3 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
```
The verify list ran once in this round, and no whole-suite command ran.

The other checks over this round's files, run after the last change:
- **ASCII gate** of `spec.md` over the eight files this round changed: printed nothing.
- **Sizes**: `SaveToLiterature.svelte` 141, `LeadCard.svelte` 327, `CommandRows.svelte` 276, `new-entry.ts` 143, `lead-apply.ts` 70, `app.yml` 321, `leads.yml` 38, `new-entry.test.ts` 237.
- **Unused exports**: `sh utils/unused-exports.sh` compared with the base copy's `unused-exports.txt`; `diff` printed nothing.
- **History words** in the added lines: two hits, "refused before any hub is asked" (the rewrapped CommandRows head) and "before it asks the hub" (new-entry.ts). Both state the order at run time, and both are kept from round 0.
- `docs/diagrams/` changes stay at the same ten files as in round 0 (`git status --short docs/diagrams`).

Paths outside the round's list: none. `ToolButton.svelte` is unchanged.

Sharp edge, still open: `refocus` stays set when a save answers ok but the card's `saved` does not turn true, which happens if the server keeps the paper under ids the card does not compare by. In that case a later `saved` change on the same card would move a lost focus to In Literature. The effect moves the focus only from the body, so it never takes the focus from another element.
