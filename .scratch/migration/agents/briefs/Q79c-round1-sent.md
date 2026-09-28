# Q79c repair round 1 (sent 2026-09-28)

The round starts at the worktree commit `787dc14c` (the step's work as you left it, committed by the orchestrator). The findings are those of `agents/reviews/Q79c-refuter.md`. Every item below is a known change: nothing here asks you to find a cause, reproduce a fault or measure. You work in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/Q79c/tools/oculus` and nowhere else, run no git command of any kind in any checkout, and write under `.scratch/` only your report. Never open, print or grep `config/local.yml` in any checkout. The rules file and the brief still hold.

## Rulings on what stays

- The Memories add press that opens the file chooser has no unit test: the suite has no DOM, so `bind:this` never binds. It is seen at the landing look on TEST. The report says so under its cases, as now.
- `languageOf` asking highlight.js first for every extension stays: painting `.html`, `.svg`, `.diff`, `.patch`, `.jsonc`, `.mk` and the other aliases of a registered grammar is what the brief's resolution through `languageNamed` is for. Item 8 states it in the report.
- `ManualPart`'s place in `data/model/index.ts` is put in alphabetical order with the list around it.

## Change

1. The terminal's font and selection are proved on the code Terminal.svelte runs. The options the grid is built with and the re-apply on a theme or font change come from pure functions in `views/sessions/terminal/grid-look.ts`: one that returns the options object handed to `new xterm.Terminal` from the look and the font size (the `convertEol: false` and the size folded in as now), and one that writes a look onto an existing options object (the theme, and the font family only when it differs). `Terminal.svelte:275-281` and `:359-363` call them and do nothing else with the look. Cases, on those functions: the built options carry `fontFamily` equal to `--font-mono`'s value and `theme.selectionBackground` equal to `--accent-bg`'s; the re-apply over an options object holding another font and another selection colour leaves both equal to the look's. The case names drop "audits", since they now test the code the component runs.
2. The card's "more" control is found by its own word. `tests/views/shared/card/cardlinks.test.ts`'s `CONTROL` becomes a pattern built from the catalog's `project.card.more_tags` with its `{0}` as `\d+`, so the three checks at `:162`, `:165` and `:209` say that no control offering the rest is drawn, whatever variant draws it. The comment above it says that.
3. `languages()` in `state/sources/fs.ts` returns every language a name can resolve to: the grammars the code window registers (`registered()` of `state/shared/words/languages.ts`), since `languageOf` reaches any of them through `languageNamed`, together with the values of `LANGUAGES` and `NAMES`. Its head comment says that. The `fs-shape.test.ts` case "names only languages the code window has registered" also checks that `languageOf` of each of these names gives a registered language: `a.ts a.js a.py a.yml a.yaml a.md a.css a.r a.ini a.toml a.json a.ipynb a.sh a.tex a.xml a.svelte a.html a.svg a.diff a.jsonc a.mk Makefile a.txt a.unknown`.
4. `DESIGN.md:282`, the sentence "The extension map of `state/sources/fs.ts` is what reaches them ...", says how a name reaches a grammar now: highlight.js's own names and aliases first (so `.toml` and `.ini` read as ini, `.html` and `.svg` as xml, `.diff` and `.patch` as diff), then the extension map of `state/sources/fs.ts` for what highlight.js does not name (`.ipynb` as json, `.svelte` as xml), then a file called `Makefile` matched by its whole name lowercased. Keep the rest of the paragraph.
5. `ui/controls/RowButton.svelte`'s head comment says what the primitive is used for now: the pressable body of a list row beside the row's own controls, of one line or several, as the Sessions list, a card's sessions and the project tab draw it; the pointer to `ui/tree/TreeItem.svelte` stays for a row of an explorer tree.
6. The stop control of `views/sessions/session-list/TerminalRows.svelte` is one ToolButton whose label, title and content follow `arming`, so the element that has focus when the reader presses it once is the element the second press confirms. Case: rendering the row with `arming` unset and with `arming` equal to the entry's id gives one control in each, carrying the stop label and the confirm label respectively.
7. The status capsule of `views/boards/focus/CareerPanel.svelte` is pressable over its whole area, padding and border included: the capsule's look is drawn by the button itself, and the wrapping `span.move` goes, through a ToolButton prop or variant if the primitive needs one (the variant documented in its head comment, like `plain`). The hover stays as now. The press area is seen at the landing look.

## Report corrections

8. Under "Reader-visible changes", with the before and after: the source tab now paints `.html`, `.svg`, `.diff`, `.patch`, `.jsonc`, `.mk`, `.gyp`, `.plist`, `.xsd`, `.json5`, `.mak`, `.make`, `.mkd`, `.mkdown`, `.ipython`, `.xhtml`, `.rss`, `.atom`, `.xsl`, `.wsf` and `.xjb` files, which were plain text; the stop control keeps focus between its two presses; the status capsule presses over its whole area.
9. Under "Proof", the change of `cardlinks.test.ts`'s predicate from `not.toContain('class="tool')` to the more control's own word, and why: the cross-links are ToolButtons now.
10. For each new or changed case, quote its failure with the change it guards undone, then put the file back.

## Tests

Run only the test files you change while working, then `npm run check`, `npm run format:check` and `npm run lint`. Do not run the full verify list: the orchestrator runs it on main at landing.

Rewrite the report at `.agents/worktrees/Q79c/tools/oculus/.scratch/migration/agents/reviews/Q79c-report.md` with these items, in the brief's shape, its first section the open items as the main checkout's `tools/oculus/.scratch/migration/orchestrator-state.md` lists them when you finish.

## Ruled on the builder's report (2026-09-28)

- Item 1's "the case names drop audits" is withdrawn. `tests/checks/tree/audits.test.ts` names every case under `tests/views/` that renders nothing an audit, and the two grid-look cases render nothing, so they keep the prefix (the builder's option (a)). They test `gridOptions` and `applyLook`, the two functions `Terminal.svelte` calls, and the report cites them as coverage of those functions and not of the component. The lazy option was (c), adding them to `allow-audits.txt`, which takes no new entries.
