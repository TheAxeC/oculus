# Cases ruling: O161, round 0, cheaper cards

Size: a full step

Your first run handed back the stand-in design over Cmd+F. Axel ruled on it (ruling 713): every card stays built and in the page, and the step cuts the per-card work instead. This ruling replaces the brief `agents/briefs/O161.md` in whole: its "What is on the tree", "What to build", "Cases", "Paths this step writes", "Decisions", "Libraries checked", "Read", "Verify before you report" and "Report" are the ones below, and nothing of the brief's stand-ins, grid watch or callers' words is built. The rules of `.scratch/migration/agents/spec.md` and `.scratch/migration/agents/guarded.md` govern it unchanged. No ADR touches this step (the repository has no `docs/adr` folder: `test -d docs/adr || echo "no docs/adr"` prints `no docs/adr`).

Your worktree is at the base 75bf4dd10; main is now at ca24a1132. None of the files this ruling names changed between the two (`git diff --stat 75bf4dd10 ca24a1132 --` over them prints nothing), so the lines below hold in your worktree.

## What is on the tree (read on main at ca24a1132)

- **The step line and its ruling.** `plan.md` step O161, tagged `(ruling 713)`. Ruling 713 (`plan.md` Rulings, "Open item 713"), Axel's (a): every card stays built and in the page, so Cmd+F is unchanged ("keep Cmd+F unchanged, this is not negotiable"); O161 profiles the main-thread task that makes Lit Watch's 678 cards and then cuts the per-card work the profile shows; `content-visibility: auto` alone was the lazy option.
- **The profile.** Taken by the orchestrator on the scratch server (port 8797, the scratch hub's 678 Lit Watch papers, Vite dev mode as Axel runs it), in headless Chrome over the DevTools protocol, sampling every 0.2 ms from the click on the Lit Watch tab to two frames after 678 `[data-card]` exist: 7.02 s. The profile is `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/O161prof/litwatch.cpuprofile` (open it in Chrome DevTools' Performance panel, or read it as JSON), with the tables `self.txt` (self time) and `total.txt` (inclusive time) beside it. Line numbers in it are of Vite's compiled output, not of the source. Inclusive times of the app's own code (from `total.txt`):
  - `RadarCard` 3.73 s, within it `get actions` (the `actions` derived, `RadarCard.svelte:200`) 2.90 s.
  - `pageOf` (`src/lib/state/forms/page-entry.ts`) 1.70 s, nearly all `feedPage` 1.69 s, of which `feedIdents` 1.46 s and `uniqueIdents` 1.43 s (`src/lib/state/shared/page/idents.ts:51-68`, called from `feedIdents` at `:70`; `feedPage` is `page-entry.ts:207`, and `pageOf` the function at `:321` inside the client's page reader). `feedPage` calls `feedIdents(kind, feed.entries)` over the whole feed and then `feed.entries.find(...)`, once for each card: 678 cards each build the identities of all 678 entries, each identity read through `readAs` (zod `safeParse`, 143 ms self, with `runChecks` 145 ms and `inst._zod.run` 171 ms self). This is quadratic in the feed's length.
  - The per-card context menu: bits-ui `Floating_layer` 1.84 s and `Floating_layer_anchor` 1.37 s, `Context_menu` 1.06 s and `Context_menu_trigger` 1.14 s, reached through `src/lib/ui/menu/ContextMenu.svelte` (1.26 s inclusive) from `RecordCard.svelte`; `src/lib/ui/frame/Card.svelte` 1.36 s. Every card builds its menu's root, trigger and floating layer when it mounts, though no menu is open.
  - `why` (`RadarCard.svelte`, its note) 1.41 s inclusive; DOMPurify 291 ms self and `parseFromString` 137 ms self, from `inlineMarkdown` (`$lib/ui/html`) run per card.
  - `CardActions.svelte` 260 ms self in one anonymous function.
  - Layout reads during the mount: `getClientRects` 170 ms and `getBoundingClientRect` 97 ms self.
  - Svelte's runtime (`get`, `is_dirty`, `reconnect`, `update_reaction`) about 1.2 s self, and the garbage collector 384 ms, which follow from the work above.
- **The cards that share the costly parts.** `grep -ln "ContextMenu\|RecordCard\|CardActions"` over `src/lib/views/shared/card/{project,record,feed}/*.svelte` lists `ProjectCard.svelte`, `RecordCard.svelte`, `LeadCard.svelte`, `PostCard.svelte`, `RadarCard.svelte`: the project boards, Position Leads, LinkedIn and Lit Watch draw their cards through them, so a cut there reaches every card view.
- **Sizes.** `wc -l`: `ContextMenu.svelte` 189, `RecordCard.svelte` 356, `CardActions.svelte` 306, `page-entry.ts` 421, `idents.ts` 80, `Card.svelte` 335, `RadarCard.svelte` 398.
- **Tests.** `tests/state/forms/page-entry.test.ts` holds `describe('pageOf', ...)` (`:155-332`), among them 'finds a feed entry by its internal id and writes it by that id' and 'finds no page for a feed entry with no key, whatever identity the feed gives it'; `guarded.md` names the entry pages' reads under its data entry (`:277-278`). Views have no entry in `guarded.md` (line 3: "Views have no entry: the look on TEST covers them").
- **A step in flight writes the same file.** O164 (in flight, its worktree `.agents/worktrees/migration-O164`) adds `EntryPage`, `pageLookup` and `entryPage` to `src/lib/state/forms/page-entry.ts` after `pageView`; this step changes `feedPage` and `pageOf` there. The orchestrator merges the two at landing; keep your change to `feedPage`, `pageOf` and what they call, and do not move or reformat the rest of the file.

## What to build

1. **Profile first.** Before changing code, read the profile above and confirm, from the source, which code each costly entry of it is (the derived, the call, the component), and quote that mapping in the report. Where the profile shows work this brief does not name below and that is per card and costs more than 100 ms in total, it is part of this step: cut it the same way, or say in the report why it cannot be cut without changing what a card draws or does.
2. **A card's page found without the whole feed.** The page of a feed entry (`pageOf` to `feedPage`) is found in time that does not grow with the number of cards: the identities of a feed's entries (`feedIdents`) are built once per list of entries and shared by every card of that list, with a map from identity to entry in place of the `find`, and rebuilt when the list changes (a new array of entries from the socket, a write the server took). The page each card gets is the page it gets today, for every case of `page-entry.test.ts`'s `pageOf` describe and for a feed whose entries array is replaced.
3. **A card's menu built when it is opened.** A card's context menu (`ContextMenu.svelte` as `RecordCard.svelte` and the cards above use it) builds its bits-ui root, trigger wrapper and floating layer when the menu is first opened (the right click, the menu key, Shift+F10, the card's own menu button where it has one), not when the card mounts. Opened, it is the menu of today: the same items in the same order, the same position at the pointer or the card, the same keys inside it, the same focus on open and on close, the same z-order over other surfaces. The card's DOM and text when no menu is open are as today, apart from the menu's own hidden parts, which hold no text a reader sees.
4. **A card's markdown made once per text.** The note's HTML (`inlineMarkdown`, `src/lib/ui/html.ts:466`, which purifies through DOMPurify) is not parsed again for a text already parsed: one result per distinct text and per `math` argument (`inlineMarkdown(text, math)`; a result made with a math drawing is never served to a call without one, or the reverse), shared, the HTML byte for byte as today.
5. **The other per-card work of the profile.** `CardActions.svelte`'s costly function and the layout reads during the mount (`getClientRects`, `getBoundingClientRect`): find their callers from the source, and cut them when they are per-card work a card does not need at mount (a measure that can run when it is used, a value computed once per list). A layout read that a drawn result needs stays, and the report says which and why.
6. **Nothing a reader sees or does changes.** Every card stays built and in the page (no stand-in, no card drawn later, no `content-visibility`, no virtual list). Each card's text, its order in the page, its look under every theme, its attributes (`data-card`, roles, labels), its keys, its cursor, its reveal, its drag where the view has one and its menu are as today. So Cmd+F, in the browser tab and in the desktop app's find bar (`src/routes/find/+page.svelte`), finds the same words, shows the same count, in the same order, and Enter and Shift+Enter step through them as today.
7. **The words.** The head comment and the doc comments of every file and function you change say what each does now, with no history. `docs/HELP.md` is not changed (ruling "Help redesigned"); a sentence of it, of `docs/data-map.md` or of `docs/decks.md` the change makes false is named in the report with its line.
8. **The time to show.** The time Lit Watch (the scratch hub's 678 papers) and the research hub's Projects board take to show their cards is measured by the orchestrator before and after on the scratch server at landing, by the method of the profile above: from the click on the view's tab to two frames after its cards exist, three runs each, the mean given. The after time must be below the before time for both views; an after time not below it is a finding for the repair round. The report gives, from the source, the work it removed per card and its expected share of the 7.02 s, as an estimate marked as one.

## Cases

Your first task after this ruling is the first run of every case below on the unchanged tree, before any change: each case run or read in the code, its result quoted. A case the brief's rules get wrong is handed back with the rule and the result before any code changes. Cases C1 and C2 are tests; the rest are checked by reading and by the orchestrator's look at landing.

- C1: `pageOf` over a feed of several entries, two of which share a title and one of which has no key, asked for each card's identity: each card gets the page it gets on the unchanged tree (same `key`, `writeId`, `title`, `values`, `null` for the entry with no key). Unchanged tree: the existing `pageOf` cases pass; the report quotes their run.
- C2: `pageOf` asked for an entry, then the feed's entries array replaced by a new array in which that entry's fields changed and a new entry was added at the top: the page has the new fields, and the new entry's page is found. Unchanged tree: passes (nothing is kept between calls); this is the case that guards the shared identities of item 2 against a stale list, written as a new case under the existing `pageOf` describe.
- C3: Lit Watch opened with 678 papers: all 678 cards are in the page, each card's `textContent` equal to the unchanged tree's, in the same order. Unchanged tree: the count and a hash of the joined `textContent` the look records before the change.
- C4: Cmd+F for a common word of the titles on Lit Watch, in the browser tab and in the app's find bar: the count, the order and the cards Enter steps through are those of the unchanged tree. Unchanged tree: as the look records them.
- C5: right click on a card, the menu key on a card under the cursor, and Shift+F10: the menu opens with today's items in today's order at today's place; Escape closes it and focus returns where it does today; a second card's menu opened after the first closes it as today. Unchanged tree: as the look records it.
- C6: the card cursor's keys over Lit Watch and a project board, Enter on a card, and the palette revealing a card far down: as today.
- C7: a write the server took on a Lit Watch card (a relevance changed from its menu): the card shows the new value and its page opens with it. Unchanged tree: as the look records it.
- C8: a new paper arriving over the socket while Lit Watch is open: the card appears in its place, its menu and its page are its own, not another card's.
- C9: the project boards, Position Leads and LinkedIn: their cards look and act as today, their menus open as today.

## Paths this step writes

- `src/lib/state/forms/page-entry.ts`, `feedPage`, `pageOf` and their doc comments only
- `src/lib/state/shared/page/idents.ts`
- `src/lib/ui/menu/ContextMenu.svelte`
- `src/lib/ui/html.ts`, `inlineMarkdown` and its doc comment only
- `src/lib/views/shared/card/record/RecordCard.svelte`
- `src/lib/views/shared/card/record/CardActions.svelte`
- `src/lib/views/shared/card/feed/RadarCard.svelte`
- `src/lib/ui/frame/Card.svelte`
- any other file the profile's per-card work of item 1 or item 5 leads to, named in the report with the profile entry that led there; never `src/lib/views/shared/card/project/*`, `src/lib/views/shared/card/card.ts` or `src/lib/views/boards/focus/*`, which O164 writes
- `tests/state/forms/page-entry.test.ts`, the case C2 under the `pageOf` describe
- the generated diagrams `docs/diagrams/*.dot` and `*.svg` if `npm run diagrams` changes them
- `.scratch/migration/agents/reviews/O161-report.md`

## Decisions taken in this brief (each reversible, none silent)

1. The shared identities of item 2 are kept per entries array (a `WeakMap` keyed by the array, so a new array from the socket or a write gives new identities and an old one is let go), not in a module-level store; the rules file's "No globals" holds, and a `WeakMap` keyed by the array holds no state shared across lists.
2. The menu of item 3 is built on first open and then kept for that card, so a second open costs nothing more and a menu's own state behaves as today.
3. The markdown results of item 4 are kept per text in a bounded map inside the module that makes them, frozen strings, so a long session does not grow it without end; its bound is named in the code.

## Libraries checked

- None found: the step removes work from existing code and adds no capability. bits-ui (already a dependency) is kept; its menu is built later, not replaced.
- The step adds no dependency.

## Read, with sections or line ranges

- the profile's `self.txt` and `total.txt`, whole
- `src/lib/state/forms/page-entry.ts`, `feedPage` and `pageOf` and what they call; `src/lib/state/shared/page/idents.ts` whole
- `src/lib/ui/menu/ContextMenu.svelte`, `src/lib/views/shared/card/record/RecordCard.svelte`, `CardActions.svelte`, `src/lib/views/shared/card/feed/RadarCard.svelte`, `src/lib/ui/frame/Card.svelte` whole
- `tests/state/forms/page-entry.test.ts:155-332`

## Conventions

The rules file's character set; Svelte markup one element per line where an element has several attributes; no literal user-facing words in a component; the size limit on every file (a file that would pass it is split by concern); the ten-item folder rule; no globals.

## Verify before you report

Run from the worktree's root, each must hold:

1. `npm run test:quick` once after the last change; it prints `every command passed`. The report quotes its lines.
2. `npx vitest run tests/state/forms/page-entry.test.ts tests/checks/tree/size.test.ts <every other test file that names a changed file> --reporter=dot`, quoted with the grep that listed the files; C2 seen passing, and C1's cases passing before and after.
3. The ASCII gate of the rules file (its perl form) over the changed files prints nothing.
4. `wc -l` of the changed files: each at or under the size limit.
5. `sh utils/unused-exports.sh` compared with the base's lines (`.agents/worktrees/O161-base/unused-exports.txt`): each line the step adds is quoted with what was done to it.
6. The history-word grep of the rules file over the comment lines you added or changed, quoted.

The builder starts no server and opens no page: C3 to C9 and item 8's timing are the orchestrator's look at landing on the scratch server. The plan's whole verify list runs once, at landing on main.

The worktree is `.agents/worktrees/migration-O161`. The base copy is `.agents/worktrees/O161-base`.

## Report

Write it to `.scratch/migration/agents/reviews/O161-report.md`, in the rules file's character set, with these parts in this order.

- The first line: anything NOT done, or "Everything in the brief is done".
- The open items of the state file, verbatim.
- The cases' first run: every case by its name, with the run or the reading of the unchanged code that checked it.
- The profile mapping of item 1: each costly entry, the source it is, and what was done to it.
- The DONE / NOT DONE table with the checks above and their output as printed.
- The files with line counts, from `diff -rq` against the base copy.
- Every user-visible change with its before and after (there should be none), written so the look can be taken from it, and what the look should compare for C3 to C9.
- The head comments that describe the changed behaviour, each 'still true' or 'rewritten'.
- Every judgment call the brief left open.
- Anything in the brief that was wrong or impossible, with the evidence.
