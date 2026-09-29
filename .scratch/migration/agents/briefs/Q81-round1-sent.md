# Q81 repair round 1 (sent 2026-09-29)

The round starts at the worktree commit `67d7fef0`, which is the step's work as you left it, committed by the orchestrator. The findings are those of `agents/reviews/Q81-refuter.md`. Every item below is a known change: nothing here asks you to find a cause, reproduce a fault or measure until a condition holds.

You work in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/Q81/tools/oculus` and nowhere else. The rules file, the brief and the cases ruling still hold. Five things are forbidden:
- running any git command in any checkout; `git -C` and `git status` count;
- starting a tmux session on the default server;
- running a browser test;
- writing any `// revert:` line;
- writing anything under `.scratch/` other than your report.

## Rulings on what the review raised

- **The judgment calls the review read as inside the brief stay:**
  - `Modal.svelte` with its levels;
  - `watchShown`;
  - Search's `field` prop;
  - the type-ahead by DOM order with CSS `order: -1`;
  - the hand-written `aria-controls` on the palette input;
  - the context menu opened from the keyboard by a dispatched `contextmenu` event;
  - the Tooltip's capture-phase Escape;
  - `TextPart` re-exported from `palette.ts`.
- **The submenu chevron is ruled in:** VS Code draws one on an item with its own list.
- **`menuClosing` is ruled in:** the pick is held until the focus is back on the opener. This keeps the focus on a dialog that the pick opens.
- **These follow from the brief's items and stay; the report states each with its before and after (change 8):**
  - Tab in an open menu closes it (bits-ui's menu);
  - a pointer opening a menu focuses the list, not its first choice;
  - a tooltip flips to the other side near a window edge;
  - the palette's Home and End move the selection, not the caret;
  - a Confirm and the Memories overlay hold the keyboard for the whole workbench while they show;
  - the menu lists on the body at z-index 70;
  - a ground closing on pointer down;
  - the palette's words matched over the title as well as the label and text.

## Change

1. **The focus a dialog gives is quiet.** DESIGN.md:306 keeps a tooltip from opening on the focus that a closing menu gives back. A modal's focus is the same kind of move, so it gets the same rule. In `ui/frame/Modal.svelte`:
   - The focus given back when the ground goes goes through `focusQuietly` (`ui/menu/tooltip-target.ts`) instead of `came.focus()`.
   - A box with no `onopen` no longer takes bits-ui's automatic first focus. `opened` always prevents the default. It then calls `onopen` when given. Otherwise it puts the focus, through `focusQuietly`, on the first tabbable element inside the content. This means the tray's Close button takes the keyboard without its tooltip opening.
   - `DESIGN.md:306`'s sentence on the quiet focus names the focus a dialog gives, on opening and on going, beside the focus a closing menu gives back. The head comment of `Modal.svelte` says so too.
   - The quiet focus runs only in a browser, so it is left to the look. Add no test that asserts it over source text.
2. **The palette's match highlight is the Search view's.** `.hit` in `Palette.svelte` is `color: var(--accent-txt, var(--accent)); font-weight: 700;`. This is the look `views/sources/search/Results.svelte`'s `.match` draws, so oculus has one match look. It is the colour the theme already gives search matches, as the brief's decision 4 asks first. The report states the weight against decision 4's 600.
3. **`match` and `languageChoices` go.**
   - Nothing under `src` reads them; only tests do. `agents/spec.md` rules out code built for no need.
   - The tests read `ranked(index, query).map((found) => found.item)` and `languageMatches(query).map((found) => found.choice)`, or assert on those results directly.
   - Every other reader of the two names is updated. That includes any head comment or `DESIGN.md` sentence naming them: grep for both names across `src`, `tests`, `DESIGN.md` and `HELP.md`.
4. **Case 8 is held by the submenu itself.**
   - `tests/ui/menu/menu.test.ts`'s first case asserts that the choice holding a list carries bits-ui's sub-trigger attribute. Read its exact name from `node_modules/bits-ui/dist/bits/menu/menu.svelte.js:1215`, `getBitsAttr("sub-trigger")`.
   - It also keeps the `aria-haspopup` and no-Back assertions.
   - Its "Red when" names the in-place list put back. Quote the case red with the old in-place `MenuList` put back and `menu_back` removed, as the review ran it, then put the file back.
5. **Case 3 is held by the title-first rule.**
   - `tests/state/workbench/palette.test.ts`'s title-first case uses two items built so that fuzzysort's score alone ranks the text-only match above the title match. For example, the text holds the query as a whole word, and the title holds its letters spread out in order. The ranking must then come from `titled`.
   - Quote the case red with `Number(right.titled) - Number(left.titled) ||` removed from `ranked`, then put it back.
6. **Comments and a title.**
   - `Palette.svelte:403` says what the Command's box does now, with no "as the palette did before it".
   - `tests/shell/keys/workbench-keys.test.ts:315-318` says what the case holds, with no "no longer".
   - The title of `tests/state/sources/files.test.ts:147` names fuzzy matching.
7. **The audits are marked.** Each of these tests stays green with the step undone, as the review ran it. Each says in its comment that it is an audit of the markup the step keeps, and names no revert it does not turn red:
   - `tests/shell/keys/workbench-keys.test.ts:330`;
   - the "Red when" comment added to `tests/ui/controls/prompt.test.ts:34`;
   - `tests/ui/primitives.test.ts` "is drawn in place as a modal alert dialog";
   - `tests/ui/menu/tooltip.test.ts` "draws a presentational wrapper that describes nothing";
   - `tests/ui/menu/menu.test.ts`'s second case.

## Report corrections

8. **Under the visible changes, with before and after:**
   - the rulings' list above;
   - the dialogs' quiet focus of change 1;
   - the tray's first focus (before: none; after: Close, quietly);
   - the pick answered after the menu has closed (before: in the click);
   - the chevron;
   - the menu lists at z-index 70 on the body (before: 2 inside their surface);
   - the match highlight of change 2.
9. **The widened paths are named as widenings:** `state/shared/words/fuzzy.ts` and the seven test files the review lists.
10. **The dependencies:**
    - the packages the lock adds transitively, with their licences as the review read them;
    - that `runed`'s optional peer `@sveltejs/kit` turns about 30 existing lock entries from `"dev": true` to `"devOptional": true` or drops the flag.
11. **The cases' first-run table.**
    - Each row is labelled by the brief's case number and name. In the brief, 2 is the views alone, 3 is title first, 6 is the language list and 7 is the files filter.
    - The grep row gives 15 and 14, which is what the greps give on the base.
    - Rerun the first run for any case changed by this round.
12. **The type-ahead reason.** bits-ui 2.19.3 declares `textValue` on Item (`types.d.ts:58`), but its type-ahead reads only `textContent` (`internal/dom-typeahead.svelte.js:29-32`).
13. **The git command.** The report states that `git -C . status` was run in the worktree, against the rule, and that no git command was run in this round.
14. **For each new or changed case**, quote its failure with the change it guards undone, then put the file back.
15. **The open items.** The report's first section is the open items as the main checkout's `tools/oculus/.scratch/migration/orchestrator-state.md` lists them when you finish.

## Tests

1. While working, run only the test files you change.
2. Then run `npm run check`, `npm run format:check`, `npm run lint` and `npm run diagrams`.
3. Do not run the full verify list: the orchestrator runs it on main at landing.

Rewrite the report at `.agents/worktrees/Q81/tools/oculus/.scratch/migration/agents/reviews/Q81-report.md` with these items, in the brief's shape.
