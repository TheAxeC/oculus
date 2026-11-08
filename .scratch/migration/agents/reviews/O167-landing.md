# O167 landing

Position: the oculus migration, step O167 (the shell's controls hold one behaviour) landed. Next: the review over O151's repair round 1, then /spec O170.

Open items: none.

## Check of Steps 1

The builder a63b8b74ba892cc66 and the reviewers a05cffdf23941c5e1 and a992c66873d23d525 had ended before the landing; the runner's agent listing shows no subagent running.

## Not done

Nothing. Every case the brief and the reviews owe to the look was looked at, item 13's desktop half on a scratch desktop app (ruling 729).

## What landed

The whole range from base 2d28fe2ac (the builder's work under the round-0 rulings and repair round 1, one wip commit afaafd470) with the fixes at landing, 88 paths counted without renames, 2270 insertions and 1083 deletions:

- The Open View submenu draws each view with the rail's icon.
- The pressed "this is me" keeps its look under the pointer.
- The status bar's Tab order runs left to right, and a focused item is scrolled into view.
- The project-set view is named "Project set", apart from the Projects board.
- A control's tip closes with its menu, and the Focus filter's tip is a sentence.
- A removed collection entry or schedule stays out of its list until a snapshot or read without it arrives (G152 in `agents/guarded.md`).
- Quick open lists no file under a gitignored folder.
- The Settings search keeps at least 12em, and the controls beside it go onto the next line when they do not fit.
- Save and Save All carry words, and the "Saved into" line does not move the rows.
- A refused value marks its field, ends with a full stop and goes when the change is withdrawn; a refused or empty value leaves no unsaved dot.
- A card's and a record page's action buttons never cover the title.
- A record pressed in a page where no split fits lands as a tab of another pane.
- Under a terminal theme with brackets, no "#" stands beside an icon.
- The Present bars take at most a third of the pane, and the slide the rest.
- The Find form's labels are capitalised and stand under the strip.
- The deck counter shows only for a drawn deck.
- Item 13 needed no code change: Cmd+S and File > Save with the focus on a setting's More actions button save in the browser and in the desktop app.

Fixes at landing:

- The cherry-pick conflicts in `StatusBar.svelte`, `said.ts` and the diagrams, resolved with O168's plural helper kept and the step's text otherwise; the diagrams generated again.
- R1-T2: the head comment of `CardActions.svelte` says what the code does at a card's first draw.
- R1-T3: `RuleForm.svelte` and `GroupHead.svelte` name where `--group-strip` and `--group-strip-gap` are set.
- Ruling 721 (a): G152 and the page-entry row through `createClientState`.
- The bookmarks route: a remove, rename or reorder of a bookmark was refused with 400 "names no hub" (on main since commit 08567e63d). `OWN_BOOKMARKS` and `entriesRefusal` in `src/lib/server/edit/writes/hubs.ts` send an entry of the reader's own bookmarks to the `homeOf` target, used by the entry, reorder and delete-entry routes of `writes.ts`.
- The Settings header (`Header.svelte`) wraps its controls at text size 1.5 in a 360 px pane instead of laying them under the field.
- `landingFor` (`src/lib/state/workbench/layout/open/landing.ts`) lands a record in another pane than the one it would have split.
- One comment line of `hubs.ts` rewrapped under 100 columns.

## Verification

- In the gate worktree with the range and the fixes, `npm run diagrams && npm run docs:palette && npm run test:quick` with `TMPDIR` unset: "86 changed file(s)", "159 test file(s)", "test:quick: 376.0 s; every command passed".
- On main, the verify list through `checks.sh`: ok ASCII gate, ok prettier, ok svelte-kit sync, ok eslint, "ok svelte-check ... 590 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS", ok vitest checks, ok vitest; vitest slow failed 5 rows, each a 20000 ms timeout at a load of 10 to 13, in `tests/data/hubs/hub-portfolio.test.ts` and `tests/data/hubs/self.test.ts`. Run alone, the two files passed 33 of 33.
- `cmp` of main's and the gate's `git diff --cached --binary --no-renames` printed SAME, 88 paths.
- The verify list equals the page's commands. No A/B: the configuration names no `bench:`.

## The look

On the scratch server on 8797 from the gate and a scratch desktop app on 8798 started from the gate, both with the scratch HOME:

- C1: the Open View submenu's glyphs equal the rail's; the Views view keeps its group glyphs.
- C2: the pressed "this is me" keeps its background and border under the pointer.
- C3: Tab walks the status bar's right group left to right and skips the disabled "0 unsaved tabs".
- C4: the palette lists "Project set"; its tab reads "Projects of Axel Faes".
- C5: Escape on the Focus filter and on More leaves the focus on the trigger with no tip.
- C6: a bookmark's remove, rename, rename back, drag and drag back each answered 200, and the row went at once; `.oculus/bookmarks.yml` equals the copy's HEAD afterwards.
- C8: at text size 1 the search, its count and the controls share one line; at 1.5 the field is 12.7em with the controls on the next line, no overlap.
- C9: the Save bar is 92 px and the first row's top 263.5 px at text size 1, 186.5 px and 452.3 px at 1.5, with and without "Saved into".
- C10: "abc" gives `aria-invalid=true` and "That is not a decimal number, so nothing was written."; Escape, or the held value typed back, removes both.
- C11: a refused value shows no dot, and the status bar counts 0 unsaved tabs.
- C13: Text size staged, the focus on its More actions button. Browser: a Cmd+S keydown gave "Saved into .oculus/workspaces/research-hub.yml." and `text_size: 1.1`. Desktop: the File > Save item's click ("Save / Cmd+S") gave the same line and `text_size: 1.1`; a Cmd+S key event into the window gave `text_size: 1.2` and "No unsaved change".
- C14: LinkedIn draws its actions on the meta row; Career titles end left of the actions (1099 and 1078 px against 1120 px).
- C15: on the Pillars page (panes 539, 539 and 359 px) a pressed record opened as a tab of the Domains pane, with no split.
- C16: under rice, brackets on and off, the error box and the glyph empty state draw no "# ".
- C17: at 420 px and text size 1.5 the view bar is 202 px of a 773 px pane, and the slide is 518 px; only Present sets `--viewbar-max`.
- C18: Find, Tiers, Stages, Forms, Status chips and "Takes the decks it finds beyond the ones it names" are capitalised, and at rest no label lies under the strip.
- C19: a loaded deck reads "1 / 27"; by `Present.svelte:177-181`, a loading or failed deck shows no counter and a deck of no slide "0 / 0".
- R1-B1: a scroll of the Projects board, 128 cards, a mean frame of 8.4 ms, p95 10.2 ms, max 16.1 ms, no long task.

Every write the look made in the scratch copy was put back, and its `git status` equals its before-state (`cmp`). The real app profile under `~/Library/Application Support/oculus` was not touched.

## Found

- The bookmarks route, the Settings header and where a record lands, each fixed at landing as above.
- Ruling 720 (a): in repair round 1 the builder deleted six of its own leftover files in the session scratchpad, a write outside the worktree.
- Ruling 722 (a): a removal ended by the number of its build or read, built in O170.

## Agents

- Builder a63b8b74ba892cc66, claude-opus-5-5: first run 298079 tokens, 100 tool uses, 14.4 min; build under the round-0 rulings 258301 tokens, 856 tool uses, 118.1 min; round 1 212101 tokens, 186 tool uses, 27.6 min.
- Brief check ae8f0a511f47d2697, claude-opus-5-5: 241334 tokens, 80 tool uses, 11.1 min.
- Reviewer a05cffdf23941c5e1, claude-opus-5-5: 316753 tokens, 103 tool uses, 21.0 min.
- Reviewer over round 1 a992c66873d23d525, claude-opus-5-5: 244257 tokens, 68 tool uses, 13.1 min.
- The builder's first report did not pass its bar (repair round 1); every finding closed in the round or at landing.

## Next

The review over O151's repair round 1, then /spec O170.
