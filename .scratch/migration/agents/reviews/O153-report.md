# O153 report: Deposit in every project card's menu

Everything in the brief is done

## Open items of the state file

Quoted verbatim from `.scratch/migration/orchestrator-state.md:179-181`. No entry follows the paragraph, so the list holds nothing.

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
```

## The cases' first run (unchanged tree, before any change)

Every case was read on the base as it stood. No case contradicts the brief's rules, so nothing was handed back.

- C1 (a Projects board card). `sed -n 295,320p src/lib/views/boards/projects/Projects.svelte` prints the call `<Card {item} {now} cursor={cursor === item.id} more=... onmore=... label=... tab=... staleLag={lag} onsaid=... />` at `:305-315`, with no `deposit`. `ProjectCard.svelte:108` read `deposit = false,` and the row was pushed only under `if (deposit) {` at `:239`. On the base, the board card's menu held no Deposit. The order comes from `record-menu.ts:85`, `actions: ['ask', 'editor', 'edit', 'pin', 'copy', 'deposit', 'clone', 'cloned'],` in the run with `heading: () => ''`. A project card has no action of its own outside the named ids, and no `archive` or `delete`, so Deposit sits after Copy Context, before Clone or Cloned-in when either is drawn, and last otherwise.
- C2 (Person view and a Listing). `cat -n src/lib/views/shared/card/record/sets/ProjectCards.svelte` prints the call at `:65-75` with no `deposit`. `grep -rn 'ProjectCards' Person.svelte Listing.svelte` prints `Person.svelte:271`, `Person.svelte:286`, `Listing.svelte:115` and `Listing.svelte:130`, all drawing through this partial. On the base those cards held no Deposit.
- C3 (the project page's card). `Project.svelte:142` read `deposit` inside `<ProjectCard ... page deposit documents={false} ... />`, so the row was drawn there once (`ProjectCard.svelte:239-247`). There was one Deposit row and no other.
- C4 (pressing Deposit on a board card). The board card had no row on the base. The project page's row called `openBeside('deposit', recordField(item.id))` (`ProjectCard.svelte:245`), and Edit Manifest on every card calls `openBeside('editor', recordField(item.id))` (`:188`). `openBeside`'s doc comment (`opening.ts:198-200`) reads "Show a view in a new pane to the right of the pane holding the instance activated last, which is what a view asked for beside the one being read means."
- C5 (a project read from a repository, a project of a second hub). `grep -n 'export function recordField' -A6 src/lib/state/shared/page/records.ts` prints `export function recordField(id: string): RecordAddress {` / `return addressOfId(id);`. The row names the record by the item's own internal id, whatever the hub or placement.
- C6 (the strip). `ProjectCard.svelte:405` read `strip={['ask', 'workbench', 'page']}`.
- C8 (the keyboard menu). `RecordCard.svelte:16-17` reads "The opener, a right-click anywhere on the card, and the context menu key and Shift+F10 on a control of the card open the same menu". `RecordCard.svelte:219` reads `const runs = $derived(menuRuns(every));`, and both `:297` (`groups={runs}`, the "..." menu) and `:328` (`<ContextMenu {label} groups={runs} own ...>`) draw that same `runs`.
- C9 (no `code/`). `sed -n 358,372p src/lib/server/git/deposit/deposit.ts` prints `if (!existsSync(deposit.code)) {` / `return { ...failed(words(text, 'server.deposit.no_code')), plan: null };`, and `grep -n 'no_code' config/text/server.yml` prints `278:            no_code: The project has no code/ to deposit`. The view's plan says so for any project, whichever card opened it.
- C10 (the Deposit view already open). `opening.ts:200-201` reads "A view already open is activated where it is, exactly as openView activates it". `openInto` (`:246-290`) looks the view up by `stateId(state)` through `holderOf`, `findInFloats` and `findView`/`findIn`, and activates the one it finds.
- C7 (no use of the removed prop). `grep -rn '\bdeposit\b' src/lib/views --include='*.svelte'` on the base listed `src/lib/views/boards/project/Project.svelte:142:                deposit`, the one attribute on a `ProjectCard`, plus the prop's own lines in `ProjectCard.svelte:31, 89, 90, 108, 239`. The other hits are in `views/boards/deposit/`, the Deposit view's own files.

## Result per case (after the change)

| Case | Result | Proof |
| --- | --- | --- |
| C1 | Row drawn on every board card, run with no heading, after Copy Context | `ProjectCard.svelte:202-209` in the base array, no condition; `record-menu.ts:85` unchanged; look on landing |
| C2 | Same on Person and Listing cards | `ProjectCards.svelte:65-75` draws `ProjectCard`, which now always carries the row; look on landing (Person view) |
| C3 | Project page: one Deposit row | `Project.svelte` passes no `deposit`; the row is in `actions` once (`grep -rn 'deposit' ...` below shows one `id: 'deposit'`); look on landing |
| C4 | Press opens the Deposit view beside the board | `ProjectCard.svelte:207` `openBeside('deposit', recordField(item.id));`, the call Edit Manifest makes (`:188`); look on landing |
| C5 | Repository and second-hub projects carry the row, naming their own record | `recordField(item.id)` at `:207`; no branch on tier, hub or placement |
| C6 | Strip unchanged | `ProjectCard.svelte:401` `strip={['ask', 'workbench', 'page']}` |
| C8 | Keyboard menu holds Deposit | Same `runs` feed both menus (`RecordCard.svelte:219, 297, 328`); look on landing |
| C9 | No `code/`: row drawn, view says `server.deposit.no_code` | The row has no condition; `deposit.ts:368-369`; look on landing |
| C10 | Open Deposit tab is activated | `opening.ts:200-201`, `openInto` lookup by state id |
| C7 | No attribute `deposit` left | grep below lists no attribute; `svelte-check` 0 errors in `test:quick` |

## DONE / NOT DONE

| Item | State | Command and output |
| --- | --- | --- |
| 1. Row on every card, prop removed | DONE | `git diff src` shows the prop's doc comment and type (`- /** Whether the deposit action belongs in this card's controls. */`, `- deposit?: boolean;`), the default `- deposit = false,` and the `if (deposit) {` block removed, and the row added to the base array after `copy` |
| 2. Project page stops passing `deposit`, head comment rewritten | DONE | `git diff src` shows `- deposit` at the call and the head paragraph rewritten (quoted below) |
| 3. Head comment of the card, HELP.md:299, other false sentences | DONE | `git diff` shows `docs/HELP.md:299` reading "Copy Context, Deposit and Clone, or the folder"; item 3 grep below |
| V1. diagrams, palette, `test:quick` once | DONE | `npm run diagrams` and `npm run docs:palette` ran (they changed no file: `git status --short` lists only the three files below); `test:quick` output quoted below |
| V2. grep of `deposit` in the two files | DONE | quoted below |
| V3. ASCII gate and the check over touched files | DONE | prints nothing (quoted below) |
| V4. `wc -l` | DONE | `426 ProjectCard.svelte`, `212 Project.svelte`, both under 520 |
| V5. unused exports against the base | DONE | `diff` prints nothing, exit 0; 335 lines both sides |
| V6. `deposit` across src, tests, config, docs, README.md | DONE | below |
| V7. history-word grep | DONE | below |
| V8. prose read | DONE | below |

### V1, `npm run test:quick` (run once; no whole-suite command run)

```
test:quick: 3 changed file(s), from git since HEAD
test:quick: 9 test file(s)
        tests/checks/source/catalog-file-keys.test.ts: scans the source text of a changed file
        tests/checks/source/comment-width.test.ts: scans the source text of a changed file
        tests/checks/source/history.test.ts: scans the source text of a changed file
        tests/checks/source/html-sites.test.ts: scans the source text of a changed file
        tests/checks/source/keys.test.ts: scans the source text of a changed file
        tests/checks/source/strip-types.test.ts: scans the source text of a changed file
        tests/checks/tree/boundaries.test.ts: scans the source text of a changed file
        tests/checks/tree/duplication.test.ts: scans the source text of a changed file
        tests/checks/tree/size.test.ts: scans the source text of a changed file
ok      prettier (1.1 s): All matched files use Prettier code style!
ok      ASCII gate (1.1 s)
ok      svelte-kit sync (2.9 s)
ok      eslint (14.8 s)
ok      svelte-check (35.7 s): 1793917742620 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (46.9 s): Duration  30.80s (transform 21.22s, setup 0ms, import 38.14s, tests 51.06s, environment 3ms)
test:quick: 50.0 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
```

The list ran once. No test was added or changed, so there is no failing line on the unchanged tree to quote.

### V2 and C7, `grep -rn 'deposit' src/lib/views/shared/card/project/ProjectCard.svelte src/lib/views/boards/project/Project.svelte`

```
src/lib/views/shared/card/project/ProjectCard.svelte:32:    // included; the row opens the project's deposit beside the card. The team is the TEAM row of
src/lib/views/shared/card/project/ProjectCard.svelte:203:                id: 'deposit',
src/lib/views/shared/card/project/ProjectCard.svelte:204:                label: t('project.card.deposit'),
src/lib/views/shared/card/project/ProjectCard.svelte:205:                glyph: t('project.card.deposit_glyph'),
src/lib/views/shared/card/project/ProjectCard.svelte:207:                    openBeside('deposit', recordField(item.id));
src/lib/views/boards/project/Project.svelte:29:    // Open project page action. The card carries the deposit control on every page that draws it,
src/lib/views/boards/project/Project.svelte:30:    // whatever the project's tier or placement; the deposit mirrors the `code/` folder of the
```

Each hit read: `:32` is the rewritten head comment (item 3); `:203-207` is the row with no condition (item 1); `Project.svelte:29-30` is the rewritten head comment (item 2). No prop, default or attribute is left. `grep -rn '\bdeposit\b' src/lib/views --include='*.svelte' | grep -v 'views/boards/deposit/'` prints the same six lines without `:205` (which has `deposit_glyph`), and no attribute `deposit` on a `ProjectCard` or `Card`.

### V3, ASCII gate

The rules file's perl form over `$(find src tests bin config -type f ! -name local.yml)` printed one line, `find: bin: No such file or directory`, and nothing else (exit 0): the tree has no `bin` folder, and the gate covered `src`, `tests` and `config`. The same perl check without the `config/` exception over `ProjectCard.svelte`, `Project.svelte` and `docs/HELP.md` printed nothing (exit 0), and `LC_ALL=C grep -n '[^ -~]'` over the same three files printed nothing (exit 1). `awk 'length > 100'` over the two components printed nothing.

### V5, unused exports

`sh utils/unused-exports.sh > <scratchpad>/unused-O153.txt; diff .agents/worktrees/O153-base/unused-exports.txt <scratchpad>/unused-O153.txt` (the base file at `/Users/axelfaes/workspace/oculus/.agents/worktrees/O153-base/unused-exports.txt`) printed nothing, exit 0. The step adds no line.

### V6, `deposit` across src, tests, config, docs and README.md

`grep -rn 'deposit_glyph\|card.deposit\|deposit=' tests` printed nothing on the base and the step changes no test. `grep -rliE 'deposit' src docs README.md config --exclude=local.yml` lists the files; every one outside the Deposit view, the deposit server code and the deposit client store was read for a sentence placing the deposit on the project page alone:

- `src/lib/state/workbench/layout/open/float/folder-opener.ts:16-18`: the Deposit tab of a workbench page opened for a project; it says nothing about the card's menu. True as it stands.
- `src/lib/views/boards/deposit/Deposit.svelte:2`: "A deposit opens from a project and is not listed in the view catalogue." True as it stands.
- `config/text/views/boards/deposit.yml:43`: `none: No project chosen. Open the deposit from a project card.` True as it stands, and now true of every card.
- `src/lib/views/shared/card/record/record-menu.ts:11`: lists "Copy Context, Deposit, Clone or the Cloned-in entry" in the run with no heading, with no page condition. True as it stands.
- `docs/HELP.md:85`: the workbench page's tabs, "Deposit (for a project with a deposit)". A different surface; true as it stands.
- `docs/HELP.md:299`: rewritten (item 3).
- `docs/HELP.md:303` and `:315`: true as they stand, as the brief says.
- `card.ts`, `CardFacts.svelte`, `filter-menu.ts`, `presets.ts`, `projects.yml`, `templates.md`, `data-map.md`: the code status value `deposited` or the Zenodo deposit fields, nothing about where the row is drawn. `palette.md:22` is the palette's row for the Deposit view. `landing.ts:1` names a deposit among what a view opens for. `layout.yml:192` is the workbench page's Deposit tab. All true as they stand.
- `README.md`: no hit.

No other file carries a false sentence, so the write list did not grow.

### V7, history-word grep

`git diff -U0 | grep '^+' | grep -v '^+++'`, saved to the scratchpad, then `grep -niE "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands|O1[0-9][0-9]|20[0-9][0-9]-"` over it, printed one hit:

```
1:+- **A project card.** A card on a board is always drawn closed. Its title, its Open project page action and Enter on the keyboard cursor open the project page beside the board as a preview tab. The
```

The hit is the HELP.md:299 line, which changed only by losing "(on the project page)". The matched word is "before" in the line's existing "an empty documents pane before an empty terminals pane", which gives an order of panes and is not a comparison with an earlier state. The added and changed comment lines of the two components give no hit.

### V8, prose read of each new or changed sentence

- `ProjectCard.svelte:31-33`: "Every card carries the Deposit row in its menu, on every page that draws it, a project read from a repository included; the row opens the project's deposit beside the card." Plain, ASCII, names the row and its effect; no departure.
- `Project.svelte:28-29`: "with `page` on: this tab's card draws its blocks in two columns under the closed card and has no Open project page action." No departure.
- `Project.svelte:29-31`: "The card carries the deposit control on every page that draws it, whatever the project's tier or placement; the deposit mirrors the `code/` folder of the project's own folder." No departure. The rest of that paragraph is rewrapped at 100 columns with its words unchanged.
- `docs/HELP.md:299`: "... Copy Context, Deposit and Clone, or the folder the repository is cloned in." No departure.

## Files, from `diff -rq` against the base copy

`diff -rq` of `O153-base/{src,tests,config,utils}` against the worktree's (config with `-x local.yml`) prints two lines; the base copy holds no `docs/`, so `docs/HELP.md` is taken from `git status --short` (` M docs/HELP.md`, ` M src/lib/views/boards/project/Project.svelte`, ` M src/lib/views/shared/card/project/ProjectCard.svelte`).

| File | Lines (`wc -l`) | In write list |
| --- | --- | --- |
| `src/lib/views/shared/card/project/ProjectCard.svelte` | 426 | yes |
| `src/lib/views/boards/project/Project.svelte` | 212 | yes |
| `docs/HELP.md` (line 299 only) | 632 | yes |
| `.scratch/migration/agents/reviews/O153-report.md` | this file | yes |

`git diff --stat`: 3 files changed, 22 insertions(+), 27 deletions(-). No script edited a file; every edit was made with the Edit tool. The scratchpad files (`unused-O153.txt`, `added-O153.txt`) are outside the worktree.

## Host- and user-visible changes, for the look

- C1, a Projects board. Open Projects with cards mode, hover a project card and press "...". Before: the run with no heading read Ask, Edit Manifest, Pin to Top, Copy Context, then Clone or Cloned-in when present. After: Deposit (glyph `published`) stands after Copy Context and before Clone or Cloned-in; on a card with neither it is last in that run. The Open and Add runs are unchanged.
- C2, the Person view. Open a person page whose sections list projects (the person `self: true` gives the most cards) and open a card's "..." menu. Before: no Deposit. After: Deposit as in C1. A Listing (an Awaiting box name, such as "Under review: <venue>") draws the same cards.
- C3, the project page. Open any project page and its card's "..." menu. Before and after: one Deposit row in the same place.
- C4, press Deposit on a board card. After: the Deposit view for that project opens in a pane to the right of the board, where Edit Manifest on the same card opens the editor. Before: no row on the board card.
- C8, keyboard. Tab to a control of a board card and press Shift+F10, or the context menu key. After: the menu holds Deposit in the same place as the "..." menu. A right-click on the card shows the same.
- C9, a project with no `code/` and no `code_availability` repository or url (a personal project or an idea). After: its board card's menu holds Deposit, and pressing it opens the Deposit view, whose plan reads "The project has no code/ to deposit" once a mirror exists, or the view's no-mirror message before one.
- C6, the strip under the pointer is unchanged: Ask, Open Workbench (while served), Open project page.

## Head comments, doc comments and docs paragraphs that describe the changed behaviour

- `ProjectCard.svelte` head comment, the paragraph at `:29-34`: rewritten.
- `ProjectCard.svelte` doc comment of `actions` (`:156`, "Every action of the card, unordered: record-menu.ts orders the strip and the menu's runs."): true as it stands.
- `ProjectCard.svelte` the prop doc comment of `deposit`: removed with the prop.
- `Project.svelte` head comment, the paragraph at `:27-35`: rewritten.
- `record-menu.ts:11` head comment: true as it stands.
- `RecordCard.svelte:16-17` head comment (one menu for the opener, the right-click and the keyboard): true as it stands.
- `opening.ts:198-207` doc comment of `openBeside`: true as it stands.
- `Projects.svelte:95-97` head comment ("The card is views/shared/card/project/ProjectCard.svelte, since views/boards/project/Project.svelte draws the same one."): true as it stands.
- `ProjectCards.svelte:1-7` head comment: true as it stands.
- `docs/HELP.md:299`: rewritten. `docs/HELP.md:303` and `:315`: true as they stand.
- `config/text/views/boards/deposit.yml:43`: true as it stands.

## Anything in the brief that was wrong or impossible

- Verify item 3 runs the gate over `src tests bin config`, and the tree has no `bin` folder: `find` prints `find: bin: No such file or directory` and the gate covers the other three folders. The check is unaffected.
- Verify item 5 gives the base list as `.agents/worktrees/O153-base/unused-exports.txt`; that path is relative to the main checkout's root (`/Users/axelfaes/workspace/oculus`). From the worktree's root it does not exist (`ls` printed `No such file or directory`). The comparison used the absolute path.
- Nothing else in the brief was wrong.
