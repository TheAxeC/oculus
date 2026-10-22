# O65 report: a status bar that scrolls sideways, and editor keys that work as VS Code's do

Not done: nothing in the brief or in repair round 1's rulings. Three facts the orchestrator needs before reading on:

- The verify list was started four times this round and ran to its end twice. The first full run failed at svelte-check on a type error in the new LaTeX keys test; two later runs were stopped before their end, each because a further change followed (both under "Changes beyond the rulings"). The fourth run, after the last change, passed; its lines are under "Verification".
- `tests/checks/source/comment-width.test.ts` fails on two comment lines this step does not touch, `tests/data/snapshot/reference-hub.ts:4` and `tests/data/snapshot/references.test.ts:544`. The same two lines fail the same check on the base copy (run quoted under "Verification"), so the failure is not this step's; the two files are outside the step's concern and were left unchanged. `test:quick` does not run that check.
- The look at landing is still owed for every case marked "Look"; the builder runs no page (spec.md:64).

## Open items of the state file

Verbatim from `.scratch/migration/orchestrator-state.md:190-195` in the worktree:

> ## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)
>
> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

The section holds no entry in the worktree's copy. The refuter's B2 names open item 259 (the palette's Pin Editor sentence); it is in the orchestrator's state file on main, which the builder does not read, and it is listed under "Before and after" below.

## Repair round 1: the rulings

| Ruling | State | Check that shows it |
|---|---|---|
| 1 P1, Julia's settings by rank | DONE | Julia row, base copy red and after green |
| 2 P2, `modes` in the mocked module | DONE | comment-rules runs, `grep` below |
| 3 T1, the "given up" comments | DONE | grep below, exit 1 for the stale words |
| 4 T2, the Julia `declare module` | DONE | read; the test is its one reader |
| 5 B1 and S3, LaTeX keys by file | DONE | four latex-keys rows, base copy red and after green |
| 6 B2, "Before and after" complete | DONE | section below |
| 7 S1, S2, P3 | no work; verify list count given | "Verification" |

### Ruling 1 (P1): Julia's settings do not depend on which load resolves first

`src/lib/ui/controls/editor/kit/rite/settings.ts` no longer reacts to `onLanguageEncountered` and has no `setTimeout`. Every language's settings, Julia's included, go to Monaco's language configuration service at rank 101, one above the 100 at which Monaco's public `setLanguageConfiguration` registers every language's settings, its own Julia settings included (`standaloneLanguages.js:94`). Monaco resolves a language's settings field by field, a higher rank winning (`languageConfigurationRegistry.js:181-206`), so VS Code's Julia brackets and pairs hold whenever Monaco's own arrive.

```ts
// settings.ts
export type Registry = {
    register(languageId: string, configuration: Configuration, priority: number): Monaco.IDisposable;
};
export const OCULUS_RANK = 101;
export function registerSettings(registry: Registry): void {
    for (const [id, configuration] of settings()) {
        registry.register(id, configuration, OCULUS_RANK);
    }
}

// load.ts, in start(), after the detached editor that starts the services with the overrides
async function languageSettings(): Promise<LanguageConfigurationService> {
    const [standalone, registry] = await Promise.all([
        import('monaco-editor/editor/standalone/browser/standaloneServices'),
        import('monaco-editor/editor/common/languages/languageConfigurationRegistry')
    ]);
    return standalone.StandaloneServices.get(registry.ILanguageConfigurationService);
}
...
const settings = await languageSettings();
registerSettings(settings);
```

`languageSettings()` runs after the detached editor of `start()` has started Monaco's services with the overrides (`load.ts`, the `monaco.editor.create(...)` with `widgets.services`, `diffProviderFactoryService` and `editorProgressService`), so `StandaloneServices.get` finds them started and the overrides stay in force (`standaloneServices.js:687-701`: `get` starts the services only when they are not started).

The test, `tests/ui/controls/editor/kit/comment-rules.test.ts`, describe "Julia's settings", row "keep VS Code's brackets and auto-closing pairs when Monaco gives its own after them". Its stand-in sits over Monaco's real `LanguageConfigurationRegistry`; its `setLanguageConfiguration` registers at 100, its `register` at the rank handed, and its `onLanguageEncountered` calls its callback at once. The row gives oculus's settings, lets any deferred work run, then gives Monaco's own Julia `conf` (imported from `definitions/julia/julia.js`) through `setLanguageConfiguration`, and asserts that Monaco's pairs differ from VS Code's and that the resolved brackets and auto-closing pairs are VS Code's.

- Base copy (`base-run-round1-last.log`): `FAIL ... Julia's settings > keep VS Code's brackets and auto-closing pairs when Monaco gives its own after them`, `AssertionError: expected [ [ '{', '}' ], [ '[', ']' ], <horizontal ellipsis>(1) ] to deeply equal undefined` (the base gives Julia no settings).
- The worktree before this round's change to `settings.ts` (the round-0 code, `onLanguageEncountered` then `setTimeout`): `Tests  1 failed | 32 passed (33)`, the Julia row failing with `AssertionError: expected [ { open: '{', close: '}' }, <horizontal ellipsis>(4) ] to deeply equal [ { open: '{', close: '}' }, <horizontal ellipsis>(4) ]`: Monaco's pairs won.
- After: `Tests  34 passed (34)` for the file (`npx vitest run tests/ui/controls/editor/kit/comment-rules.test.ts`).

### Ruling 2 (P2): `modes` lives in the mocked module

The record of the settings Monaco's modules give is made inside the factory of `vi.mock('monaco-editor/editor/editor.api.js', ...)` and exported from the mocked module as `modes`; `jsonMode()` reads it by `await import(EDITOR_API)`. No `vi.hoisted` and no mutable value is left at file scope: `grep -n "vi.hoisted\|^const modes\|^let " tests/ui/controls/editor/kit/comment-rules.test.ts` prints nothing. The stand-in of `monacoStandIn()` is made inside each describe.

### Ruling 3 (T1): the comments that said the chords were given up

The three comments now say what the palette lists: the actions of the editor's Cmd+K chords (and of Ctrl+K on macOS), each with the chord that runs it in the editor.

- `src/lib/shell/keys/Palette.svelte:29-30`: "and the actions of the editor's Cmd+K chords (and of Ctrl+K on macOS), each with the chord that runs it in the editor beside it."
- `src/lib/state/workbench/palette.ts:5-8`: "and those of the editor's Cmd+K chords (and of Ctrl+K on macOS). Each is under the editor's own label with the keys that run it in the editor as the hint".
- `src/lib/state/workbench/navigation/editor-status.svelte.ts:14-17`: "those of the editor's Cmd+K chords (and of Ctrl+K on macOS) with the chord that runs each in the editor (F1, which the editor gives up to the workbench and which opens the palette's command mode, has no action to list)".

The second grep, `grep -rn "gave up\|give up\|gives up\|given up\|freed" src docs config tests --exclude=local.yml`, read hit by hit. True and kept: `chords.ts:1-2` (F1, F8, Shift+F8 are given up, `freedKeys`), `kit/load.ts:2` ("the keys the editor gives up"), `keys/monaco-keys.ts:5`, `shell/Workbench.svelte:308` (F1's Monaco binding freed), `views/system/help/keys/Keys.svelte:19` ("a key bound or freed"), and the new `editor-status.svelte.ts:16` (F1). The others are about other things (a request the page gave up on, `literature/handler.ts:136,170`). A wider grep for the same claim in other words, `grep -rn "old chord\|removed chord" src tests docs config --exclude=local.yml`, found three more false comments, each rewritten to name the chord that runs the action in the editor: `ui/controls/editor/types.ts:21-22` and `editor-status.svelte.ts:39-40` ("a removed chord's old chord" became "the chord that runs it in the editor"), and `state/workbench/palette.ts:93` ("an editor action's keys or old chord" became "the keys of an editor action"). After the edits both greps print no stale hit: `grep -rn "gave up\|old chord\|removed chord" src tests docs config --exclude=local.yml` prints only the two `literature/handler.ts` lines.

### Ruling 4 (T2): the Julia `declare module`

`src/monaco-modules.d.ts` keeps `export const conf` in `declare module 'monaco-editor/languages/definitions/julia/julia.js'`, since the Julia row of ruling 1 reads it (`const { conf } = await import('monaco-editor/languages/definitions/julia/julia.js')`); `src` no longer imports the module (`grep -rn "julia/julia.js" src tests` prints the declaration and the test line alone). The new `declare module 'monaco-editor/editor/common/languages/languageConfigurationRegistry'` declares the service key and type that `load.ts` reads and the `LanguageConfigurationRegistry` class with the two members the test calls, `register` and `getLanguageConfiguration`. The head comment names each reader: the service through which `load.ts` gives oculus's settings and the apps' settings, the registry the test resolves over, and Monaco's Julia module whose settings the test gives. The sentence "Each subpath is declared here as the part of it that the tree uses" holds.

### Ruling 5 (B1 and S3): the one-press LaTeX keys in the files LaTeX Workshop binds them in

The files each key of the LaTeX tab is bound in are one table, read from LaTeX Workshop v10.19.0's `package.json`:

```ts
// data/helpers/keys/oculus/editor-keys.ts
export type LatexFileKind = 'tex' | 'bib' | 'style';
export type LatexScope = 'tex' | 'texOrBib' | 'texOrStyle';
export const LATEX_SCOPES = {
    build: 'texOrStyle', clean: 'texOrStyle', view: 'texOrStyle',
    synctex: 'tex', mathPreview: 'tex', promote: 'tex', demote: 'tex',
    item: 'tex', surround: 'tex', selectLine: 'tex', tabFocus: 'tex',
    text: 'texOrBib', math: 'texOrBib'
} as const satisfies Record<string, LatexScope>;
export function inLatexScope(scope: LatexScope, kind: LatexFileKind): boolean {
    if (scope === 'tex') return kind === 'tex';
    if (scope === 'texOrBib') return kind !== 'style';
    return kind !== 'bib';
}

// views/sources/source/latex/latex-tab.svelte.ts, actions()
const keyed = <K extends EditorKey>(scope: keyof typeof LATEX_SCOPES, key: K): K | undefined =>
    inLatexScope(LATEX_SCOPES[scope], kind) ? key : undefined;
add('oculus.latex.build', t('latex.cmd_build'), press.build, keyed('build', LATEX_PRESSES.build), menu);
```

So in a `.bib` file Cmd+Alt+B and Cmd+Alt+C are bound to nothing of the tab's and reach Monaco (Cmd+Alt+C toggles the find widget's case, `findModel.js:28-31`); in `.sty` and `.cls` Cmd+Alt+J and Cmd+Alt+M are bound to nothing, and Cmd+Alt+B, C and V stay bound. The presses are the same `KeyPress` values off macOS, where Cmd is Ctrl, so the Ctrl forms follow. A command whose key a file does not take stays in the tab's actions with no key, so the palette runs it; View, SyncTeX and Math Preview stay out of a `.bib` tab's actions, as before this round, since a `.bib` file has no PDF of its own.

Where the files are said:

- Keys view (`views/system/help/keys/rows.ts`, `inFiles`): every LaTeX row ends with its files, from `config/text/views/academic/latex.yml`: `keys_tex: '{0}, in a .tex tab'`, `keys_tex_or_bib: '{0}, in a .tex or .bib tab'`, `keys_tex_or_style: '{0}, in a .tex, .sty or .cls tab'`.
- `docs/HELP.md:161-170`: "LaTeX build / clean / view PDF, in a `.tex`, `.sty` or `.cls` tab"; "show the caret's line in the PDF, in a `.tex` tab"; "Math Preview, in a `.tex` tab / TeX view"; "promote / demote sections, in a `.tex` tab"; the text and math chords "in a `.tex` or `.bib` tab"; `\item`, Surround, select the line and tab focus "in a `.tex` tab".
- The Build button's tooltip in a `.bib` tab names no key (`LatexButtons.svelte:45`, `latex.bar_build_bare`: "Build the LaTeX project").

The test, `tests/views/sources/source/latex-keys.client.test.ts` (new), describe "the keys of a LaTeX tab, by the kind of file it shows", one row per kind, titled "$kind takes the keys LaTeX Workshop binds there". Each row makes the tab as Source.svelte makes it, in an effect root over a fresh client whose root question never answers, with one text chord (`b`, `textbf`) and one math chord (`b`, `mathbf`) and the LaTeX extension's commands handed in, and checks the commands with a key and the commands listed with none:

| Row | Keyed | Listed with no key |
|---|---|---|
| a TeX file, `paper/main.tex` | all 13 | none |
| a .bib file, `paper/refs.bib` | text.textbf, math.mathbf | build, clean, promote, demote, item, surround, selectLine, tabFocus |
| a package, `paper/style.sty` | build, clean, view | synctex, mathPreview, promote, demote, item, surround, selectLine, tabFocus, text.textbf, math.mathbf |
| a class, `paper/paper.cls` | build, clean, view | as the package |

- Base copy (`base-run-round1-last.log`), all four red: TeX `expected [ 'build', 'clean', 'demote', <horizontal ellipsis>(8) ] to deeply equal [ 'build', 'clean', 'demote', <horizontal ellipsis>(10) ]` (the base has no select-line and tab-focus chords); `.bib` `expected [ 'build', 'clean', 'demote', <horizontal ellipsis>(5) ] to deeply equal [ 'math.mathbf', 'text.textbf' ]`; package and class `expected [ 'build', 'clean', 'demote', <horizontal ellipsis>(8) ] to deeply equal [ 'build', 'clean', 'view' ]`.
- The worktree before this round's change to `latex-tab.svelte.ts`: `Tests  3 failed | 1 passed (4)`; `.bib` keyed `build, clean, math.mathbf, text.textbf`; package and class keyed `build, clean, mathPreview, synctex, view`; the TeX row passed.
- After: `Tests  4 passed (4)` (`npx vitest run tests/views/sources/source/latex-keys.client.test.ts`), and both new test files pass inside the verify run's `vitest`.

### Ruling 6 (B2)

"Before and after, for the look" below lists every user-visible change of the step, the review's five among them and ruling 5's.

### Ruling 7 (S1, S2, P3)

No work. This round ran no git command; the unchanged tree was read and run in the base copy and in a run copy of it in the session scratchpad (below). The verify list's count this round is under "Verification".

## Changes beyond the rulings

- An app's language settings rank above oculus's. With oculus's settings at rank 101, an app's settings given through `setLanguageConfiguration` at 100 would lose every field oculus sets, for an app that adds a language oculus gives settings for (an app's `shellscript`, `make`, `common-lisp` or `fortran-free-form`; `language-kit.ts:135` drops only the ids highlight.js ships). `applyAppLanguages(monaco, settings, kit, before)` now gives each app configuration through the same service at `OCULUS_RANK + 1`, and `load.ts` hands it the service at both calls. Row "an app's settings of a language > win over the settings oculus gives the language" in `comment-rules.test.ts`: oculus gives Shell `{ lineComment: '#' }`, an app gives `{ lineComment: '//' }`, and the resolved comment rule is the app's. Base copy: `AssertionError: expected undefined to deeply equal { lineComment: '#' }` (the base gives Shell no settings, so the row stops at its first assertion). After: passes, within `Tests  34 passed (34)`. `src/lib/ui/controls/editor/kit/languages/register.ts` is outside the round's path list; it is where an app's settings are given.
- The Build and View tooltips name the key of the platform. `latex.bar_build_title` and `latex.bar_view_title` read "(Cmd+Alt+B)" and "(Cmd+Alt+V)" as fixed text although `LatexButtons.svelte` hands them the key it computes; they now read `({0})`, so off macOS they say Ctrl+Alt+B and Ctrl+Alt+V. The base copy has the same fixed text (`grep -n "bar_build_title\|bar_view_title"` on its `config/text/views/academic/latex.yml`: lines 10 and 18).
- The type of the test's caret: `latex-keys.client.test.ts` hands `caret: () => ({ line: 1, column: 1, selected: 0 })`, the `Caret` of `editor-text.ts:33`.
- Comment widths: `StatusBar.svelte:30-40`, `settings.ts:50-53`, `monaco-modules.d.ts`, `editor-keys.ts:30` and the head of `comment-rules.test.ts` were rewrapped to end by the hundredth column (`tests/checks/source/comment-width.test.ts`).
- `LatexButtons.svelte` (outside the path list): ruling 5 left Build with no key in a `.bib` file, so its tooltip and head comment had to change.

## The run copy of the base

The base copy holds no `node_modules`, so a run copy was made in the scratchpad, `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o65/base-run`: the base copy's `src`, `tests`, `config` and `utils`, the worktree's `package.json`, `vite.config.ts`, `tsconfig.json` and `.svelte-kit`, `node_modules` linked to the worktree's, the two final test files copied in, and `base-run.config.ts`, which merges the linked `node_modules` into `server.fs.allow`. Command: `npx vitest run --config base-run.config.ts tests/ui/controls/editor/kit/comment-rules.test.ts tests/views/sources/source/latex-keys.client.test.ts`, log `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o65/base-run-round1-last.log`: `Tests  15 failed | 23 passed (38)`. The fifteen: the nine comment rows (shellscript, bibtex, diff, julia, latex, common-lisp, make, matlab, ocaml; `expected undefined to be defined`), the Julia row, the app row and the four LaTeX key rows, each quoted above. The refuter's report was read once with `cat` from the main checkout's `.scratch/migration/agents/reviews/O65-refuter.md`, which changes nothing.

## The cases' first run (unchanged tree, before any change)

Each case was read on the unchanged tree before the first edit. The base lines quoted are those of the base copy `.agents/worktrees/migration-O65-base/`; `sed -n` there prints `{@attach fitOneRow}` at `StatusBar.svelte:193`, `overflow: clip;` at `:371` and `:386`, `.group > :global([data-left-out])` at `:400`, `freedKeys` with `CMD_K, CTRL_K` at `chords.ts:93-95`, `keys.palette` at `rows.ts:292`, and `LATEX_CHORD_SECONDS.item` and `.surround` at `latex-tab.svelte.ts:392-396`.

- C1. Fails. `StatusBar.svelte:193` `{@attach fitOneRow}` hides items that do not fit; `:371` and `:386` `overflow: clip` scroll nothing; `:400` `.group > :global([data-left-out])` is `display: none`. No item is drawn past the width, and nothing scrolls.
- C2. Fails for the same reason: a left-out item cannot take the focus (`display: none`), and a clipped bar does not scroll a focused item into view.
- C3. Holds. The right group's `flex-direction: row-reverse` lays its items from the window's right edge with the bell last (`StatusBar.svelte:390-393` at base).
- C4. Holds. Unchecking an item in the right-click menu hides it through the ui store's hidden set and the menu keeps listing it (head comment `:25-27` at base).
- C5. Fails. `registerSettings` (`settings.ts`, 44 lines) gives settings to rite, cmake, fortran-free-form, fortran-fixed-form, jinja and svelte only; `latex` has no comment rule and no bracket pairs, so Cmd+/ does nothing and `{` adds no `}`.
- C6. Fails for shellscript, make, bibtex, matlab, ocaml, common-lisp, diff and julia (julia has Monaco's brackets but no `comments`, `definitions/julia/julia.js:1-20`).
- C7. Fails. The table test run on the base run copy (command and log under "The run copy of the base"): nine rows fail, `shellscript`, `bibtex`, `diff`, `julia`, `latex`, `common-lisp`, `make`, `matlab`, `ocaml`, each `expected undefined to be defined`; the other 23 pass.
- C8. Holds for the environment completion and the list's Enter (`latex-editing.ts:179-198`, `latex-suggest.ts:48` read: they do not depend on language settings). The `@(` suggestion leaves a stray `)` once `(` auto-closes; at base no `(` auto-closed in latex, so the stray bracket appears only with bracket settings that lack LaTeX Workshop's `["@(", ""]` pair.
- C9. Fails. `LATEX_CHORD_SECONDS` held item and surround only; Cmd+L Cmd+L and Cmd+L Ctrl+Shift+M were bound to nothing in a LaTeX tab.
- C10. Holds. `latex-tab.svelte.ts:377` (promote) and `:402` (`chordKey(first, character)`) bind them.
- C11. Holds. A `.yml` file has no LaTeX tab, so Monaco's Cmd+L `expandLineSelection` runs.
- C12. Fails. The Keys view lists no row for the two chords (they do not exist).
- C13. Read as the item 4 table below; at base the rows of Cmd+K, its 31 chords and Ctrl+K on macOS fail (freed for the palette), Cmd+L and Ctrl+Shift+M in a `.tex` tab cannot reach their commands, and Cmd+/ in `.tex` and `.slurm` comments nothing.
- C14. Fails. With `fitOneRow`, an item arriving re-runs the fit and hides other items; there is no scroll to keep.
- C15. An item left out is not drawn, so no menu opens from it; a drawn item's menu is anchored by bits-ui to the trigger element, so it follows the item where it is drawn.
- C16. Holds at base for a bar that does not scroll; the ground is `.bar`'s own background (`:404-424` at base).
- C17. Fails. `matlab` has no settings, so Shift+Alt+A has no block comment.
- C18. Fails. `common-lisp` has no settings.
- C19. Holds for Cmd+L (no LaTeX tab binds outside a file on disk under a root, `latex-tab.svelte.ts:101-106`); Cmd+/ fails (no `latex` comment rule).
- C20. Fails for `.sty`/`.cls`: the tab bound every text chord and Cmd+L first press there (`style` was not told apart). Holds for `.bib`: the text and math chords were bound, and the two new chords did not exist.
- C21. Fails. `LATEX_CHORD_SECONDS` was one constant; no Ctrl+L Ctrl+M off macOS.
- C22. Fails. `latex-tables.ts` accepted a configured text chord on `l` or `w` (only the one-character and letters checks applied).
- C23. Holds for double-click on `word` in `\textbf{word}` with Monaco's default word pattern (`\`, `{` and `}` are separators). LaTeX Workshop's pattern differs on `_`, which it does not count as a letter.
- C24. Fails. `freedKeys` (`chords.ts:93-95` at base) bound Cmd+K to no command, so it opened the palette.
- C25. Fails for the same reason: Cmd+K opened the palette.
- C26. Fails. Ctrl+K on macOS was freed and opened the palette.
- C27. Holds. Outside the editor `togglesPalette` opens and closes the palette (`workbench-keys.svelte.ts:145-150` at base).
- C28. Holds. Cmd+Shift+P, F1 and Cmd+P are the workbench's in the editor (F1 freed, the other two bound by no Monaco command).
- C29. At base the menu was not reached either way: Cmd+K was freed, so the workbench's handler called `preventDefault` and opened the palette. With the change, read below under item 6.
- C30. Fails. `rows.ts:292` words a freed chord with `keys.palette` ("run from the palette").
- C31. Holds. `chordActions` listed the Cmd+K chord actions while a source tab is on screen.

No case was found that the brief's own rules get wrong, so the build went on without a stop.
## Verification

1. The verify list, `npm run diagrams && npm run test:quick`, in the worktree. This round it was started four times: the first run went to its end and failed (`FAILED  svelte-check`, `"tests/views/sources/source/latex-keys.client.test.ts" 79:26 "Property 'selected' is missing in type '{ line: number; column: number; }' but required in type 'Caret'."`); the second and third were stopped before their end because a change followed; the fourth ran after the last change. Its lines (`/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o65/verify-round1d.log`):

```
test:quick: 43 changed file(s), from git since HEAD
test:quick: 22 test file(s)
        tests/ui/controls/editor/kit/comment-rules.test.ts: changed
        tests/views/sources/source/latex-keys.client.test.ts: changed
        tests/checks/diagrams/palette.test.ts: named for a changed file
        tests/data/sources/config/settings.test.ts: named for a changed file
        tests/routes/sessions/latex.test.ts: named for a changed file
        tests/server/desktop/menu-template.test.ts: imports at depth 1
        tests/shell/keys/clone-rows.test.ts: imports at depth 1
        tests/shell/keys/palette-page.test.ts: imports at depth 1
        tests/shell/window/menu-answer.test.ts: imports at depth 1
        tests/state/system/apps/app-keys.test.ts: imports at depth 1
        tests/checks/imports/order.test.ts: imports at depth 2
        tests/shell/keys/theme-rows.test.ts: imports at depth 2
        tests/state/client/terminal/terminal-close.test.ts: imports at depth 2
        tests/state/sessions/served-roots.client.test.ts: imports at depth 2
        tests/state/system/apps/shell.test.ts: imports at depth 2
        tests/state/workbench/debug-record.test.ts: imports at depth 2
        tests/state/workbench/layout/saved/layout-workspaces.test.ts: imports at depth 2
        tests/state/workbench/options-pages.test.ts: imports at depth 2
        tests/ui/controls/editor/reach-text.test.ts: imports at depth 2
        tests/views/shared/forms/entry-add.test.ts: imports at depth 2
        tests/views/sources/bar-actions.test.ts: imports at depth 2
        tests/views/sources/source/save-key.client.test.ts: imports at depth 2
ok      prettier (1.3 s): All matched files use Prettier code style!
ok      ASCII gate (1.4 s)
ok      svelte-kit sync (2.4 s)
ok      eslint (22.9 s)
ok      vitest (51.5 s): Duration  37.89s (transform 59.22s, setup 0ms, import 117.68s, tests 7.65s, environment 1.05s)
ok      svelte-check (54.8 s): 1792708389710 COMPLETED 536 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest slow (56.5 s): Duration  42.84s (transform 13.92s, setup 0ms, import 36.77s, tests 5.88s, environment 0ms)
ok      vitest checks (68.1 s): Duration  54.60s (transform 7.34s, setup 0ms, import 23.96s, tests 75.55s, environment 0ms)
test:quick: 70.6 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            the build, the lint of unchanged files
```

2. The tree checks on the final tree, `npx vitest run tests/checks/source/history.test.ts tests/checks/source/keys.test.ts tests/checks/tree/boundaries.test.ts tests/checks/source/comment-width.test.ts tests/checks/tree/size.test.ts --testTimeout 300000`: `Tests  1 failed | 38 passed (39)`. History (no package id, date or session phrase in a comment), the text keys, the layer boundaries and the file sizes pass. The one failure is the comment width check on `tests/data/snapshot/reference-hub.ts:4` and `tests/data/snapshot/references.test.ts:544`, files this step does not change (`cmp` with the base copy: equal). The same check on the base run copy fails on the same two lines (`npx vitest run --config base-run.config.ts tests/checks/source/comment-width.test.ts`). With the default 5000 ms timeout the machine's load made the history, keys and boundaries checks time out once; with the longer timeout they pass.

3. The two new test files, final tree: `npx vitest run tests/ui/controls/editor/kit/comment-rules.test.ts` printed `Tests  34 passed (34)`; `npx vitest run tests/views/sources/source/latex-keys.client.test.ts` printed `Tests  4 passed (4)`. Base runs quoted under each ruling.

4. Names that must be gone: `grep -rn "RemovedChord\|removedChords\|LATEX_CHORD_SECONDS\|keys\.palette\|palette: true\|run from the palette\|ABOVE_MONACO\|onLanguageEncountered('julia'" src tests config docs README.md --exclude=local.yml` printed nothing, exit 1; `grep -rn "leftOut\b\|fitOneRow\|DROP_ORDER\|one-row\.ts\|'./one-row'\|data-left-out" src docs tests` printed nothing, exit 1; `grep -rn "setTimeout" src/lib/ui/controls/editor/kit/rite/settings.ts` printed nothing, exit 1.

5. `sh utils/unused-exports.sh` against `.agents/worktrees/migration-O65-base/unused-exports.txt`:

```
1c1
< Unused exports (230)
---
> Unused exports (231)
199a200
> src/lib/ui/controls/editor/chords.ts: editorChords
```

`editorChords` is read by `utils/diagrams/palette.mjs:106` (`.editorChords(true)` on the module `ssrLoadModule` returns), which knip does not follow, and by `chordActions` in the same file. None of this round's exports (`LATEX_SCOPES`, `inLatexScope`, `LatexFileKind`, `LatexScope`, `OCULUS_RANK`, `Registry`) is listed.

6. `wc -l`: every source file at or under 880 (`kit/load.ts` 708 the largest, `state/workbench/palette.ts` 835 unchanged in length); components `StatusBar.svelte` 451, `diff/DiffEditor.svelte` 513, `LatexButtons.svelte` 65. `shell/keys/Palette.svelte` is 540 lines in the base copy and in the worktree (its comment was rewritten line for line); the size check passes.

7. ASCII: the verify run's ASCII gate passed; `LC_ALL=C grep -n "[^[:print:][:space:]]"` over the files this round changed printed nothing.

8. Files that differ from the base copy, `diff -rq` of `.agents/worktrees/migration-O65-base/` against the worktree over `src`, `tests`, `config` and `utils` (with `--exclude=local.yml`): the files of the table under "Files with line counts", `src/lib/shell/status/one-row.ts` only in the base copy, and the new `kit/rite/latex-settings.ts`, `tests/ui/controls/editor/kit/` and `tests/views/sources/source/latex-keys.client.test.ts` only in the worktree. The base copy holds no `docs`; `docs/HELP.md`, `docs/palette.md` and `docs/diagrams/*` are the documents and generated files named in the table.

## The step's items

| Item | State | Check that proves it |
|---|---|---|
| 1 status bar scrolls | DONE | read; look at landing |
| 2 nine languages' settings | DONE | comment-rules rows, Verification 3 |
| 3 table test (G121) | DONE | Verification 3 |
| 4 Monaco key table, fixes | DONE | table below; look at landing |
| 5 LaTeX chords and keys vs LaTeX Workshop | DONE | latex-keys rows; look at landing |
| 6 Cmd+K in the editor | DONE | Item 6 below; look at landing |

## Item 4: every default key Monaco 0.57 binds, against what oculus takes

How the list was made: `grep -rlE "registerCommandAndKeybindingRule|registerKeybindingRule|kbOpts|keybinding: \{|keybinding: \[|registerQuickPickCommandAndKeybindingRule"` over `node_modules/monaco-editor/esm/vs` (the TypeScript worker excluded) gives 49 files. Each file's `id`, `primary`, `mac`, `secondary`, `kbExpr`, `when` and `precondition` lines were read with grep. Of the 49, `platform/actions/common/actions.js` and `platform/keybinding/common/keybindingsRegistry.js` are the registries themselves; `find/browser/findModel.js` holds the find toggles' presses that `findController.js` registers, and is read with it. The Keyboard Shortcuts view reads the same registry at run time (`monaco-keys.ts`, `KeybindingsRegistry.getDefaultKeybindings()`), but lists only a binding whose command is an editor action with a label, so it shows fewer rows than this table (no cursor commands, no widget keys). oculus loads the whole package (`import('monaco-editor')`, `kit/load.ts:315`), so every file's bindings are registered.

What oculus binds in a source tab's editor beside Monaco: F1, F8, Shift+F8 bound to no command (`chords.ts` `freedKeys`, `load.ts:346-348`) for the workbench, as VS Code's workbench takes them; in a `.tex` LaTeX tab the presses of `editor-keys.ts` (Cmd+Alt+B, C, V, J, M, [ and ], first presses Cmd+L and Ctrl+Shift+M) and Enter and Alt+Enter (`latex-editing.ts:183-208`); Alt+F5 and Shift+Alt+F5 for the change marks (`gutter.ts:116-117`); Cmd+Enter while the rename box is open (`lsp/client.ts:352-362`, the rename with preview); and Tab or Shift+Tab right after an Escape Monaco did not take moves the focus out (`keys/tab-out.ts`). The workbench's own page keys (`page-keys.ts`: Cmd+S, Cmd+W, Cmd+N, Cmd+F, Cmd+Shift+T, Cmd+Shift+F, Cmd+Shift+H, Ctrl+Tab, Ctrl+-, F5, F9, F10, F11) reach the workbench only when the editor leaves them; of those only Cmd+F is a Monaco press, and Monaco takes it first, as in VS Code.

Language servers: `.tex` has texlab and `.yml` yaml-language-server (`src/lib/data/prose/lsp-servers.ts:175,193`) when installed and running; `.slurm` opens as `shellscript` (`config/defaults/sources.yml:82`) and has no server, as VS Code without a shell extension. "server" in a cell means the press reaches the command and the command answers what the language server provides; with no provider Monaco's precondition is false and the press runs nothing, as VS Code does for a language with no extension.

Words in the cells: "yes" the press reaches the command; "never met" the `when` is not true in a source tab, and why; "LaTeX" the press is the LaTeX tab's, as VS Code with LaTeX Workshop binds it; "Chrome?" Chrome or macOS may take the press before the page (not verified, the look decides). Function keys on a Mac keyboard need Fn unless "Use F1, F2 as standard function keys" is on.

### Cursor, selection and editing (coreCommands.js)

| Press (macOS) | Command | when | State | .tex | .slurm | .yml |
|---|---|---|---|---|---|---|
| Left / Ctrl+B | cursorLeft | textInputFocus | caret in text | yes | yes | yes |
| Shift+Left | cursorLeftSelect | textInputFocus | caret | yes | yes | yes |
| Right / Ctrl+F | cursorRight | textInputFocus | caret | yes | yes | yes |
| Shift+Right | cursorRightSelect | textInputFocus | caret | yes | yes | yes |
| Up / Ctrl+P | cursorUp | textInputFocus | caret | yes | yes | yes |
| Shift+Up | cursorUpSelect | textInputFocus | caret | yes | yes | yes |
| Down / Ctrl+N | cursorDown | textInputFocus | caret | yes | yes | yes |
| Shift+Down | cursorDownSelect | textInputFocus | caret | yes | yes | yes |
| PageUp | cursorPageUp | textInputFocus | caret | yes | yes | yes |
| Shift+PageUp | cursorPageUpSelect | textInputFocus | caret | yes | yes | yes |
| PageDown | cursorPageDown | textInputFocus | caret | yes | yes | yes |
| Shift+PageDown | cursorPageDownSelect | textInputFocus | caret | yes | yes | yes |
| Home / Cmd+Left | cursorHome | textInputFocus | caret | yes | yes | yes |
| Shift+Home / Shift+Cmd+Left | cursorHomeSelect | textInputFocus | caret | yes | yes | yes |
| Ctrl+A | cursorLineStart | textInputFocus | caret | yes | yes | yes |
| Ctrl+Shift+A | cursorLineStartSelect | textInputFocus | caret | yes | yes | yes |
| End / Cmd+Right | cursorEnd | textInputFocus | caret | yes | yes | yes |
| Shift+End / Shift+Cmd+Right | cursorEndSelect | textInputFocus | caret | yes | yes | yes |
| Ctrl+E | cursorLineEnd | textInputFocus | caret | yes | yes | yes |
| Ctrl+Shift+E | cursorLineEndSelect | textInputFocus | caret | yes | yes | yes |
| Cmd+Up | cursorTop | textInputFocus | caret | yes | yes | yes |
| Shift+Cmd+Up | cursorTopSelect | textInputFocus | caret | yes | yes | yes |
| Cmd+Down | cursorBottom | textInputFocus | caret | yes | yes | yes |
| Shift+Cmd+Down | cursorBottomSelect | textInputFocus | caret | yes | yes | yes |
| Shift+Alt+Cmd+Left/Right/Up/Down | cursorColumnSelect* | textInputFocus | caret | yes | yes | yes |
| Shift+Alt+Cmd+PageUp/PageDown | cursorColumnSelectPage* | textInputFocus | caret | yes | yes | yes |
| arrows, Shift+arrows in column mode | column selection overrides | columnSelection | never met: column selection mode is never switched on | - | - | - |
| Ctrl+PageUp | scrollLineUp | textInputFocus | caret | yes, Chrome? | yes, Chrome? | yes, Chrome? |
| Ctrl+PageDown | scrollLineDown | textInputFocus | caret | yes, Chrome? | yes, Chrome? | yes, Chrome? |
| Cmd+PageUp | scrollPageUp | textInputFocus | caret | yes | yes | yes |
| Cmd+PageDown | scrollPageDown | textInputFocus | caret | yes | yes | yes |
| Escape, Shift+Escape | cancelSelection | textInputFocus, a selection | text selected | yes | yes | yes |
| Escape, Shift+Escape | removeSecondaryCursors | textInputFocus, several cursors | Alt+click a second cursor | yes | yes | yes |
| Ctrl+O | lineBreakInsert | textInputFocus, writable | caret | yes | yes | yes |
| Shift+Tab | outdent | editorTextFocus, tab does not move focus | caret on an indented line | yes | yes | yes |
| Tab | tab | editorTextFocus, tab does not move focus | caret | yes | yes | yes |
| Backspace, Shift+Backspace, Ctrl+H, Ctrl+Backspace | deleteLeft | textInputFocus | caret | yes | yes | yes |
| Delete, Ctrl+D, Ctrl+Delete | deleteRight | textInputFocus | caret | yes | yes | yes |

Tab and Shift+Tab right after an Escape that Monaco did not take move the focus out of the editor (`keys/tab-out.ts`), an oculus rule so the keyboard is never held in the editor; VS Code has none.

### Undo, select all, clipboard (editorExtensions.js, clipboard.js)

| Press (macOS) | Command | when | State | .tex | .slurm | .yml |
|---|---|---|---|---|---|---|
| Cmd+Z | undo | editor focus | after an edit | yes | yes | yes |
| Shift+Cmd+Z | redo | editor focus | after an undo | yes | yes | yes |
| Cmd+A | editor.action.selectAll | none | caret | yes | yes | yes |
| Cmd+X | clipboardCutAction | writable | text selected | yes | yes | yes |
| Cmd+C | clipboardCopyAction | none | text selected | yes | yes | yes |
| Cmd+V | clipboardPasteAction | writable | text on the clipboard | yes | yes | yes |

In the desktop app the Edit menu's roles carry the same presses; the page takes them first (`menu-template.ts:10-12`), not verified in the app.

### Diff editor (widget/diffEditor/commands.js)

| Press (macOS) | Command | when | State | .tex | .slurm | .yml |
|---|---|---|---|---|---|---|
| F7 | accessible diff viewer next | isInDiffEditor | never met in a source tab; met in a diff tab | - | - | - |
| Shift+F7 | accessible diff viewer previous | isInDiffEditor | as above | - | - | - |
| Escape | diffEditor.exitCompareMove | comparing a moved block | never met in a source tab | - | - | - |

In a source tab F7 and Shift+F7 run the word highlight rows below.

### Anchor, brackets, transpose (anchorSelect.js, bracketMatching.js, transpose.js)

| Press (macOS) | Command | when | State | .tex | .slurm | .yml |
|---|---|---|---|---|---|---|
| Cmd+K Cmd+B | setSelectionAnchor | editorTextFocus | caret | yes | yes | yes |
| Cmd+K Cmd+K | selectFromAnchorToCursor | editorTextFocus, anchor set | after Cmd+K Cmd+B, move the caret | yes | yes | yes |
| Escape | cancelSelectionAnchor | editorTextFocus, anchor set | after Cmd+K Cmd+B | yes | yes | yes |
| Shift+Cmd+\ | jumpToBracket | editorTextFocus | caret at a bracket | yes | yes | yes |
| Alt+Cmd+Backspace | removeBrackets | editorTextFocus | caret inside a pair | yes | yes | yes |
| Ctrl+T | transposeLetters | textInputFocus, writable | caret between letters | yes | yes | yes |

Bracket rows in `.tex` use LaTeX Workshop's 70 pairs, in `.slurm` VS Code's three, in `.yml` Monaco's.

### Code actions, color picker, comments, context menu, cursor undo (codeActionCommands.js, standaloneColorPickerActions.js, comment.js, contextmenu.js, cursorUndo.js)

| Press (macOS) | Command | when | State | .tex | .slurm | .yml |
|---|---|---|---|---|---|---|
| Cmd+. | editor.action.quickFix | textInputFocus, writable, a code action provider | caret on a problem | server | none | server |
| Ctrl+Shift+R | editor.action.refactor | textInputFocus, writable, refactor actions | selection | server | none | server |
| Shift+Alt+O | editor.action.organizeImports | textInputFocus, writable, organize imports action | caret | server | none | server |
| Alt+Cmd+. | editor.action.autoFix | textInputFocus, writable, quick fixes | caret on a problem | server | none | server |
| Escape | hideColorPicker | standalone color picker shown | never met: its show command has no key and only Monaco's own command palette lists it, which oculus replaces | - | - | - |
| Enter | insertColorWithStandaloneColorPicker | standalone color picker focused | never met, as above | - | - | - |
| Cmd+/ | editor.action.commentLine | editorTextFocus, writable | caret on a line | yes (`%`) | yes (`#`) | yes (`#`) |
| Cmd+K Cmd+C | editor.action.addCommentLine | editorTextFocus, writable | caret | yes | yes | yes |
| Cmd+K Cmd+U | editor.action.removeCommentLine | editorTextFocus, writable | commented line | yes | yes | yes |
| Shift+Alt+A | editor.action.blockComment | editorTextFocus, writable | selection | runs, no block comment in LaTeX Workshop's file | runs, none in VS Code's file | runs, none in Monaco's yaml settings |
| Shift+F10 | editor.action.showContextMenu | textInputFocus | caret | yes | yes | yes |
| Cmd+U | cursorUndo | textInputFocus | after a caret move | yes | yes | yes |

### Paste and drop, cancel, find (copyPasteContribution.js, dropIntoEditorContribution.js, keybindingCancellation.js, findController.js, findModel.js)

| Press (macOS) | Command | when | State | .tex | .slurm | .yml |
|---|---|---|---|---|---|---|
| Cmd+. | change paste type | paste widget shown | a paste that offers more than one way; plain text offers one | never met with plain text | same | same |
| Escape | editor.hidePasteWidget | paste widget shown | as above | same | same | same |
| Cmd+. | change drop type | drop widget shown | a drop offering more than one way | never met with plain text | same | same |
| Escape | editor.hideDropWidget | drop widget shown | as above | same | same | same |
| Escape | editor.cancelOperation | a cancellable operation runs | while a slow go-to-definition waits | server | none | server |
| Cmd+F | actions.find | none | caret | yes | yes | yes |
| Cmd+E | actions.findWithSelection | none | selection | yes | yes | yes |
| Cmd+G / F3 | editor.action.nextMatchFindAction | editorFocus | after a find | yes | yes | yes |
| Enter | next match | find input focused | find widget open | yes | yes | yes |
| Shift+Cmd+G / Shift+F3 | previousMatchFindAction | editorFocus | after a find | yes | yes | yes |
| Shift+Enter | previous match | find input focused | find widget open | yes | yes | yes |
| Cmd+F3 | nextSelectionMatchFindAction | editorFocus | selection | yes | yes | yes |
| Shift+Cmd+F3 | previousSelectionMatchFindAction | editorFocus | selection | yes | yes | yes |
| Alt+Cmd+F | startFindReplaceAction | none | caret | yes | yes | yes |
| Escape, Shift+Escape | closeFindWidget | editorFocus, find widget visible | find widget open | yes | yes | yes |
| Alt+Cmd+C | toggleFindCaseSensitive | editorFocus | find widget open | LaTeX: Clean, as with LaTeX Workshop; Chrome? | yes, Chrome? | yes, Chrome? |
| Alt+Cmd+W | toggleFindWholeWord | editorFocus | find widget open | yes | yes | yes |
| Alt+Cmd+R | toggleFindRegex | editorFocus | find widget open | yes | yes | yes |
| Alt+Cmd+L | toggleFindInSelection | editorFocus | find widget open | yes | yes | yes |
| Alt+Cmd+P | togglePreserveCase | editorFocus | replace open | yes | yes | yes |
| Shift+Cmd+1 | replaceOne | editorFocus | replace open | yes | yes | yes |
| Enter | replaceOne | replace input focused | replace open | yes | yes | yes |
| Alt+Cmd+Enter | replaceAll | editorFocus | replace open | yes | yes | yes |
| Cmd+Enter | replaceAll | replace input focused | replace open | yes | yes | yes |
| Alt+Enter | selectAllMatches | editorFocus, find widget visible | find widget open, focus in it | yes | yes | yes |
| Up / Down, Alt+Up / Alt+Down | history.showPrevious / showNext | find input focused, history | find input after earlier searches | yes | yes | yes |

In `.tex`, Alt+Enter with the focus in the text runs the LaTeX tab's Insert Line After, as LaTeX Workshop's Alt+Enter does; with the focus in the find widget it selects all matches.

### Folding (folding.js)

| Press (macOS) | Command | when | State | .tex | .slurm | .yml |
|---|---|---|---|---|---|---|
| Alt+Cmd+] | editor.unfold | editorTextFocus | caret on a folded region | LaTeX: Demote, as with LaTeX Workshop | yes | yes |
| Alt+Cmd+[ | editor.fold | editorTextFocus | caret in a block | LaTeX: Promote, as with LaTeX Workshop | yes | yes |
| Cmd+K Cmd+] | unfoldRecursively | editorTextFocus | folded region | yes | yes | yes |
| Cmd+K Cmd+[ | foldRecursively | editorTextFocus | block | yes | yes | yes |
| Cmd+K Cmd+L | toggleFold | editorTextFocus | block | yes | yes | yes |
| Cmd+K Shift+Cmd+L | toggleFoldRecursively | editorTextFocus | block | yes | yes | yes |
| Cmd+K Cmd+/ | foldAllBlockComments | editorTextFocus | block comments | runs, LaTeX has none | runs, none | runs, none |
| Cmd+K Cmd+8 | foldAllMarkerRegions | editorTextFocus | `% region` / `#region` markers | yes | yes (VS Code's markers) | runs, Monaco's yaml settings have none |
| Cmd+K Cmd+9 | unfoldAllMarkerRegions | editorTextFocus | folded markers | yes | yes | as above |
| Cmd+K Cmd+- | foldAllExcept | editorTextFocus | caret in a block | yes | yes | yes |
| Cmd+K Cmd+= | unfoldAllExcept | editorTextFocus | folded blocks | yes | yes | yes |
| Cmd+K Cmd+0 | foldAll | editorTextFocus | blocks | yes | yes | yes |
| Cmd+K Cmd+J | unfoldAll | editorTextFocus | folded | yes | yes | yes |
| Cmd+K Cmd+1 to Cmd+7 | foldLevel1 to 7 | editorTextFocus | nested blocks | yes | yes | yes |
| Cmd+K Cmd+, | createFoldingRangeFromSelection | editorTextFocus | selection | yes | yes | yes |
| Cmd+K Cmd+. | removeManualFoldingRanges | editorTextFocus | a manual fold | yes | yes | yes |

### Format, problems, go to (formatActions.js, gotoError.js, goToCommands.js, referencesController.js, symbolNavigation.js)

| Press (macOS) | Command | when | State | .tex | .slurm | .yml |
|---|---|---|---|---|---|---|
| Shift+Alt+F | formatDocument | editorTextFocus, writable, a formatter | caret | the LaTeX tab's formatter (`latex-widget.ts:326`) | runs only with a formatter, none registered | server |
| Cmd+K Cmd+F | formatSelection | editorTextFocus, writable, selection, a range formatter | selection | server | none | server |
| Alt+F8 | marker.next | editorFocus | a problem in the file | yes | yes with a problem | yes |
| Shift+Alt+F8 | marker.prev | editorFocus | as above | yes | yes | yes |
| F8 | marker.nextInFiles | editorFocus | - | workbench (freed), walks the Problems view, as VS Code's workbench | same | same |
| Shift+F8 | marker.prevInFiles | editorFocus | - | workbench (freed) | same | same |
| Escape, Shift+Escape | closeMarkersNavigation | marker widget shown | after Alt+F8 | yes | yes | yes |
| F12 | revealDefinition | editorTextFocus, definition provider | caret on a name | server | none | server |
| Cmd+F12 | revealDefinition (web binding) and goToImplementation | editorTextFocus | caret on a name | server: implementation where the server has one, else definition | none | server |
| Cmd+K F12 / Cmd+K Cmd+F12 | revealDefinitionAside | editorTextFocus | caret on a name | server; where Monaco's standalone editor opens it is the look's | none | server |
| Alt+F12 | peekDefinition | editorTextFocus | caret on a name | server | none | server |
| Shift+Cmd+F12 | peekImplementation | editorTextFocus | caret on a name | server | none | server |
| Shift+F12 | goToReferences | editorTextFocus | caret on a name | server | none | server |
| Cmd+K F2 | togglePeekWidgetFocus | reference peek open | after Shift+F12 | server | none | server |
| F4 / F12 | goToNextReference | reference peek open | as above | server | none | server |
| Shift+F4 / Shift+F12 | goToPreviousReference | reference peek open | as above | server | none | server |
| Escape, Shift+Escape | closeReferenceSearch | reference peek open | as above | server | none | server |
| Enter / Cmd+Down | revealReference | peek tree focused | as above | server | none | server |
| Ctrl+Enter | openReferenceToSide | peek tree focused | as above | server | none | server |
| F12 | editor.gotoNextSymbolFromResult | several results of a go to | after a go to with several results | server | none | server |
| Escape | gotoNextSymbolFromResult.cancel | as above | as above | server | none | server |

VS Code desktop binds Cmd+F12 to Go to Implementation alone; Monaco adds Go to Definition on Cmd+F12 for the web, the binding VS Code for the web has. Not a failure.

### Hover, inline suggestions, in-place replace, line selection (hoverActions.js, hoverService.js, inlineCompletions commands.js, inPlaceReplace.js, lineSelection.js)

| Press (macOS) | Command | when | State | .tex | .slurm | .yml |
|---|---|---|---|---|---|---|
| Cmd+K Cmd+I | editor.action.showHover | editorTextFocus | caret on a word | yes, server hover | yes, shows problems only, and .slurm has none | yes, server hover |
| Cmd+K Cmd+I | workbench.action.showHover | none | the same press; the editor action wins in the editor | - | - | - |
| Up / Down / Left / Right | scroll the hover | hover focused | Cmd+K Cmd+I twice | yes | yes | yes |
| PageUp / Alt+Up, PageDown / Alt+Down | page the hover | hover focused | as above | yes | yes | yes |
| Home / Cmd+Up, End / Cmd+Down | hover top / bottom | hover focused | as above | yes | yes | yes |
| Alt+] / Alt+[ | next / previous inline suggestion | inline suggestion visible | never met: oculus registers no inline completion provider | - | - | - |
| Cmd+Right | inlineSuggest.acceptNextWord | inline suggestion visible | never met, as above | - | - | - |
| Tab / Shift+Tab | inline suggestion commit / alternative | inline suggestion or edit visible | never met, as above | - | - | - |
| Tab | jump to next inline edit | inline edit visible | never met, as above | - | - | - |
| Escape | hide inline completion | inline suggestion visible | never met, as above | - | - | - |
| Shift+Cmd+, | inPlaceReplace.up | editorTextFocus, writable | caret on a value | yes | yes | yes |
| Shift+Cmd+. | inPlaceReplace.down | editorTextFocus, writable | as above | yes | yes | yes |
| Cmd+L | expandLineSelection | textInputFocus | caret | LaTeX chord first press; Cmd+L Cmd+L runs it, as LaTeX Workshop binds | yes | yes |

### Lines (linesOperations.js)

| Press (macOS) | Command | when | State | .tex | .slurm | .yml |
|---|---|---|---|---|---|---|
| Shift+Alt+Up | copyLinesUpAction | editorTextFocus, writable | caret | yes | yes | yes |
| Shift+Alt+Down | copyLinesDownAction | editorTextFocus, writable | caret | yes | yes | yes |
| Alt+Up | moveLinesUpAction | editorTextFocus, writable | caret | yes | yes | yes |
| Alt+Down | moveLinesDownAction | editorTextFocus, writable | caret | yes | yes | yes |
| Cmd+K Cmd+X | trimTrailingWhitespace | editorTextFocus, writable | trailing spaces | yes | yes | yes |
| Shift+Cmd+K | deleteLines | textInputFocus, writable | caret | yes | yes | yes |
| Cmd+] | indentLines | editorTextFocus, writable | caret | yes | yes | yes |
| Cmd+[ | outdentLines | editorTextFocus, writable | indented line | yes | yes | yes |
| Shift+Cmd+Enter | insertLineBefore | editorTextFocus, writable | caret | yes | yes | yes |
| Cmd+Enter | insertLineAfter | editorTextFocus, writable | caret | yes | yes | yes |
| Cmd+Backspace | deleteAllLeft | textInputFocus, writable | caret mid-line | yes | yes | yes |
| Ctrl+K / Cmd+Delete | deleteAllRight | textInputFocus, writable | caret mid-line | yes | yes | yes |
| Ctrl+J | joinLines | editorTextFocus, writable | caret | yes | yes | yes |

### Linked editing, messages, multiple cursors (linkedEditing.js, messageController.js, multicursor.js)

| Press (macOS) | Command | when | State | .tex | .slurm | .yml |
|---|---|---|---|---|---|---|
| Shift+Cmd+F2 | editor.action.linkedEditing | editorTextFocus, writable, a linked editing provider | caret | none | none | none |
| Escape, Shift+Escape | cancelLinkedEditingInput | linked editing on | never met: no provider for the three | - | - | - |
| Escape | leaveEditorMessage | an editor message shown | type in a read-only editor (a file at HEAD) | yes | yes | yes |
| Alt+Cmd+Up | insertCursorAbove | editorTextFocus | caret | yes | yes | yes |
| Alt+Cmd+Down | insertCursorBelow | editorTextFocus | caret | yes | yes | yes |
| Shift+Alt+I | insertCursorAtEndOfEachLineSelected | editorTextFocus | lines selected | yes | yes | yes |
| Cmd+D | addSelectionToNextFindMatch | editorFocus | caret on a word | yes | yes | yes |
| Cmd+K Cmd+D | moveSelectionToNextFindMatch | editorFocus | a selection | yes | yes | yes |
| Shift+Cmd+L | selectHighlights | editorFocus | caret on a word | yes | yes | yes |
| Cmd+F2 | changeAll | editorTextFocus, writable | caret on a word | yes | yes | yes |

### Parameter hints, rename, smart select, snippets, sticky scroll (parameterHints.js, rename.js, smartSelect.js, snippetController2.js, stickyScrollActions.js)

| Press (macOS) | Command | when | State | .tex | .slurm | .yml |
|---|---|---|---|---|---|---|
| Shift+Cmd+Space | triggerParameterHints | editorTextFocus, a signature help provider | caret in a call | server | none | server |
| Escape, Shift+Escape | closeParameterHints | hints shown | as above | server | none | server |
| Up / Alt+Up / Ctrl+P | showPrevParameterHint | several signatures shown | as above | server | none | server |
| Down / Alt+Down / Ctrl+N | showNextParameterHint | as above | as above | server | none | server |
| F2 | editor.action.rename | editorTextFocus, writable, a rename provider | caret on a name | server | none | server |
| Enter | acceptRenameInput | rename box focused | after F2 | server | none | server |
| Cmd+Enter | acceptRenameInputWithPreview | rename box focused | after F2 | oculus's Rename with Preview (`lsp/client.ts:352-362`) runs it | none | same as .tex |
| Escape, Shift+Escape | cancelRenameInput | rename box focused | after F2 | server | none | server |
| Down / Up | focus next / previous rename suggestion | rename box with suggestions | after F2 | server | none | server |
| Ctrl+Shift+Cmd+Right / Ctrl+Shift+Right | smartSelect.expand | editorTextFocus | caret | yes (the LaTeX tab's ranges) | yes | yes |
| Ctrl+Shift+Cmd+Left / Ctrl+Shift+Left | smartSelect.shrink | editorTextFocus | after expand | yes | yes | yes |
| Tab | jumpToNextSnippetPlaceholder | in a snippet, a next stop | take a snippet suggestion | yes | yes | yes |
| Shift+Tab | jumpToPrevSnippetPlaceholder | in a snippet, a previous stop | as above | yes | yes | yes |
| Escape, Shift+Escape | leaveSnippet | in a snippet | as above | yes | yes | yes |
| Down / Up / Enter / Escape | sticky scroll line select / go / leave | sticky scroll focused | never met: Focus Sticky Scroll has no key and only Monaco's own command palette lists it | - | - | - |

### Suggest (suggestController.js)

| Press (macOS) | Command | when | State | .tex | .slurm | .yml |
|---|---|---|---|---|---|---|
| Ctrl+Space / Alt+Escape / Cmd+I | editor.action.triggerSuggest | textInputFocus, writable | caret after a word | yes, Ctrl+Space Chrome? (macOS input source) | same | same |
| Tab | acceptSelectedSuggestion | suggest visible | suggest open | yes | yes | yes |
| Enter | acceptSelectedSuggestion | suggest visible, accept on Enter | suggest open | yes | yes | yes |
| Shift+Enter / Shift+Tab | acceptAlternativeSelectedSuggestion | suggest visible, insert and replace range | suggest open on a word | yes | yes | yes |
| Escape, Shift+Escape | hideSuggestWidget | suggest visible | suggest open | yes | yes | yes |
| Down / Cmd+Down / Ctrl+N | selectNextSuggestion | suggest visible | suggest open | yes | yes | yes |
| PageDown / Cmd+PageDown | selectNextPageSuggestion | suggest visible | suggest open | yes | yes | yes |
| Up / Cmd+Up / Ctrl+P | selectPrevSuggestion | suggest visible | suggest open | yes | yes | yes |
| PageUp / Cmd+PageUp | selectPrevPageSuggestion | suggest visible | suggest open | yes | yes | yes |
| Ctrl+Space / Cmd+I | focusSuggestion | suggest visible, nothing focused | suggest open by typing | yes | yes | yes |
| Ctrl+Space / Cmd+I | toggleSuggestionDetails | suggest visible, an item focused | suggest open | yes | yes | yes |
| Cmd+/ | toggleExplainMode | suggest visible | suggest open | yes | yes | yes |
| Ctrl+Alt+Space | toggleSuggestionFocus | suggest visible | suggest open | yes | yes | yes |
| Tab | insertBestCompletion | tab completion on | never met: `tabCompletion` stays off, VS Code's default | - | - | - |
| Tab / Shift+Tab | insertNextSuggestion / insertPrevSuggestion | tab completion on | never met, as above | - | - | - |
| Cmd+C | suggestWidgetCopy | details focused | suggest details focused | yes | yes | yes |

### Tab focus mode, word highlight, words, word parts (toggleTabFocusMode.js, wordHighlighter.js, wordOperations.js, wordPartOperations.js)

| Press (macOS) | Command | when | State | .tex | .slurm | .yml |
|---|---|---|---|---|---|---|
| Ctrl+Shift+M | editor.action.toggleTabFocusMode | none | caret | LaTeX math chord first press; Cmd+L Ctrl+Shift+M runs it, as LaTeX Workshop binds | yes | yes |
| F7 | wordHighlight.next | editorTextFocus | caret on a word with other occurrences | yes | yes | yes |
| Shift+F7 | wordHighlight.prev | editorTextFocus | as above | yes | yes | yes |
| Alt+Left | cursorWordLeft | textInputFocus | caret | yes | yes | yes |
| Shift+Alt+Left | cursorWordLeftSelect | textInputFocus | caret | yes | yes | yes |
| Alt+Right | cursorWordEndRight | textInputFocus | caret | yes | yes | yes |
| Shift+Alt+Right | cursorWordEndRightSelect | textInputFocus | caret | yes | yes | yes |
| Alt+Backspace | deleteWordLeft | textInputFocus, writable | caret | yes | yes | yes |
| Alt+Delete | deleteWordRight | textInputFocus, writable | caret | yes | yes | yes |
| Ctrl+Alt+Backspace | deleteWordPartLeft | textInputFocus, writable | caret in camelCase or snake_case | yes | yes | yes |
| Ctrl+Alt+Delete | deleteWordPartRight | as above | as above | yes | yes | yes |
| Ctrl+Alt+Left | cursorWordPartLeft | textInputFocus | as above | yes | yes | yes |
| Ctrl+Shift+Alt+Left | cursorWordPartLeftSelect | textInputFocus | as above | yes | yes | yes |
| Ctrl+Alt+Right | cursorWordPartRight | textInputFocus | as above | yes | yes | yes |
| Ctrl+Shift+Alt+Right | cursorWordPartRightSelect | textInputFocus | as above | yes | yes | yes |

Word moves in `.tex` follow LaTeX Workshop's word pattern (letters, digits and marks; `__`, `**` and `...` each one word), so `\textbf{word}` gives `textbf` and `word`.

### Monaco's quick input, the action widget (standalone quickAccess, actionWidget.js, quickInputActions.js)

| Press (macOS) | Command | when | State | .tex | .slurm | .yml |
|---|---|---|---|---|---|---|
| F1 | editor.action.quickCommand | editorFocus | - | workbench (freed): the palette in command mode, as VS Code's F1 | same | same |
| Ctrl+G | editor.action.gotoLine | editorFocus | caret | yes, Monaco's own go-to-line box | yes | yes |
| Shift+Cmd+O | editor.action.quickOutline | editorFocus, a symbol provider | caret | server | none | server |
| Enter (with any modifiers) | quickInput.accept | quick input open | after Ctrl+G | yes | yes | yes |
| Escape | quickInput.hide | quick input open | as above | yes | yes | yes |
| Down / Ctrl+Down | quickInput.next | quick pick open | after Shift+Cmd+O | server | none | server |
| Up / Ctrl+Up | quickInput.previous | as above | as above | server | none | server |
| PageDown (any modifier) / PageUp | quickInput.pageNext / pagePrevious | as above | as above | server | none | server |
| Ctrl+Home / Ctrl+End | quickInput.first / last | as above | as above | server | none | server |
| Cmd+Down / Cmd+Up, Alt+Down / Alt+Up | next / previous separator | as above | as above | server | none | server |
| Alt+Cmd+Down / Alt+Cmd+Up | nextSeparator / previousSeparator | as above | as above | server | none | server |
| Right | quickInput.acceptInBackground | quick pick, input not focused or at its end | as above | server | none | server |
| Space | quickInput.toggleCheckbox | a quick pick with checkboxes | never met: Monaco's two boxes have none | - | - | - |
| Ctrl+Space | quickInput.toggleHover | quick pick open | as above | server | none | server |
| Escape, Shift+Escape | hideCodeActionWidget | code action menu open | after Cmd+. with actions | server | none | server |
| Escape | clearFilterCodeActionWidget | menu open and filtered | as above | server | none | server |
| Up / Cmd+Up / Ctrl+P | selectPrevCodeAction | menu open | as above | server | none | server |
| Down / Cmd+Down / Ctrl+N | selectNextCodeAction | menu open | as above | server | none | server |
| Left / Right / Space | collapse / expand / toggle section | menu with sections | as above | server | none | server |
| Enter / Cmd+. | acceptSelectedCodeAction | menu open | as above | server | none | server |
| Cmd+Enter | previewSelectedCodeAction | menu open | as above | server | none | server |

Bindings with no press on macOS, left out of the table since no key reaches them: `cursorLineStart` and siblings off macOS, `clipboardCopyWithSyntaxHighlightingAction`, `goToTypeDefinition`, `wordHighlight.trigger`, `findWithArgs`, the folding goto commands, and every Monaco command without `primary`.

Every row of the three files that does not reach its command where VS Code's (with LaTeX Workshop for `.tex`) would reached it at base for one of three causes, each fixed: Cmd+K, its 31 chords and Ctrl+K on macOS (freed for the palette: item 6, `chords.ts`, `load.ts`, `workbench-keys.svelte.ts`); Cmd+L and Ctrl+Shift+M in `.tex` (item 5: Cmd+L Cmd+L and Cmd+L Ctrl+Shift+M, `editor-keys.ts`, `latex-tab.svelte.ts`, `latex-editing.ts`); Cmd+/, Cmd+K Cmd+C/U, the brackets and the auto-closing in `.tex` and `.slurm` (item 2, `settings.ts`, `latex-settings.ts`). No other row was found failing by reading; the look presses them all.

## Item 6: what withholds a Cmd+K the editor dispatched

- Monaco's keybinding service listens on the editor's container (`standaloneServices.js:235-241`) and, for a press it finds bound or that starts a chord, calls `preventDefault` and `stopPropagation`. `workbench.action.showHover` binds Cmd+K Cmd+I with no `when` (`platform/hover/browser/hoverService.js`), so in any element inside `.monaco-editor` Cmd+K always starts a chord and never bubbles to the workbench's `onkeydown`. The find, rename and other widgets inside the editor's container are covered by the same listener, and the overflow widgets forward their keys to the editor's root (`options.ts`).
- In the desktop app the menu takes an accelerator only when the page leaves the press (`menu-template.ts:10-12`), and Monaco's `preventDefault` does not leave it, so Quick Open's Cmd+K (`desktop-keys.ts:77`) does not run. Read, not verified in the app.
- One press still reached the palette: Ctrl+K on macOS in a read-only editor, where `deleteAllRight`'s precondition `writable` is false, Monaco does not dispatch it and it bubbles to `togglesPalette`. Fixed in `workbench-keys.svelte.ts:146-149`: the handler returns for a target inside `.monaco-editor`. The menu's Quick Open is Cmd+K, not Ctrl+K, so it does not take that press.
- The audit of an app's keybindings keeps answering `palette` for Cmd+K (`oculus-keys.ts:81`, decision 10), unchanged.


## Files with line counts

| File | Lines | Note |
|---|---|---|
| `src/lib/shell/status/StatusBar.svelte` | 451 | item 1 |
| `src/lib/shell/status/one-row.ts` | deleted | item 1 |
| `src/lib/shell/status/status-items.ts` | 164 | item 1 |
| `src/lib/ui/controls/editor/kit/rite/settings.ts` | 363 | item 2; ruling 1 |
| `src/lib/ui/controls/editor/kit/rite/latex-settings.ts` | 179 | item 2, new |
| `src/lib/ui/controls/editor/kit/languages/configuration.ts` | 197 | item 2 |
| `src/lib/ui/controls/editor/kit/languages/register.ts` | 67 | outside the list: an app's settings rank above oculus's (ruling 1's rank) |
| `src/monaco-modules.d.ts` | 334 | outside the list: the types of the configuration service, its registry and Monaco's Julia module |
| `tests/ui/controls/editor/kit/comment-rules.test.ts` | 213 | item 3, new; rulings 1 and 2 |
| `tests/views/sources/source/latex-keys.client.test.ts` | 195 | ruling 5, new |
| `src/lib/data/helpers/keys/oculus/editor-keys.ts` | 150 | item 5; ruling 5 |
| `src/lib/views/sources/source/latex/latex-tab.svelte.ts` | 505 | item 5; ruling 5 |
| `src/lib/views/sources/source/latex/LatexButtons.svelte` | 65 | outside the list: Build's tooltip in a `.bib` file (ruling 5) |
| `src/lib/ui/controls/editor/kit/latex/latex-editing.ts` | 265 | item 5: the two commands the new chords run |
| `src/lib/data/sources/config/catalog/latex-tables.ts` | 172 | outside the list: a configured chord on `l`, `w` or `m` left out |
| `config/catalogs/latex.yml` | 1464 | outside the list: its line 1 comment |
| `config/text/views/academic/latex.yml` | 223 | items 5; ruling 5; the tooltips' `{0}` |
| `src/lib/views/system/help/keys/rows.ts` | 346 | items 5 and 6; ruling 5 |
| `src/lib/ui/controls/editor/chords.ts` | 154 | item 6 |
| `src/lib/ui/controls/editor/keys/monaco-keys.ts` | 76 | item 6 |
| `src/lib/ui/controls/editor/kit/load.ts` | 708 | item 6; ruling 1 |
| `src/lib/ui/controls/editor/diff/DiffEditor.svelte` | 513 | item 6, comment |
| `src/lib/ui/controls/editor/gutter/gutter.ts` | 434 | item 6, comment |
| `src/lib/ui/controls/editor/types.ts` | 162 | ruling 3's grep, comment |
| `src/lib/shell/keys/workbench-keys.svelte.ts` | 603 | item 6, Ctrl+K in a read-only editor |
| `src/lib/shell/keys/Palette.svelte` | 540 | ruling 3, comment |
| `src/lib/state/workbench/palette.ts` | 835 | ruling 3, comments |
| `src/lib/state/workbench/navigation/editor-status.svelte.ts` | 313 | ruling 3, comments |
| `src/lib/data/helpers/keys/oculus/palette-keys.ts` | 57 | item 6, doc comment |
| `src/lib/shell/keys/palette-page.ts` | 195 | outside the list: two doc comments on the chords |
| `config/text/views/system/help.yml` | 61 | item 6 |
| `config/text/palette-page.yml` | 38 | item 6 |
| `utils/diagrams/palette.mjs` | 152 | item 6 |
| `docs/HELP.md` | 550 | lines 94, 122, 128, 161-170 |
| `docs/palette.md` | 201 | written by `npm run docs:palette` |
| `docs/diagrams/*` | generated | written by `npm run diagrams` |

## Judgment calls

- J1 (for the orchestrator; the refuter ties it to open item 259). Pin Editor and Unpin Editor show `Cmd+K Shift+Enter` in the palette (`state/workbench/palette.ts:332`, `PIN_CHORD`), the chord VS Code binds them to. No key in oculus runs it: in the editor Cmd+K starts Monaco's chords and Shift+Enter is no chord of Monaco's, and outside the editor Cmd+K opens the palette. At base the press opened the palette, so it never ran either. The palette page says the items stand in for that chord (`config/text/palette-page.yml` `editor_intro`, `docs/palette.md:142`). Options: (a) bind Cmd+K Shift+Enter in every editor to pin or unpin the tab, as VS Code does, a new user-visible key; (b) keep the hint as the name of VS Code's chord; (c) drop the hint. Recommendation: (a), since the step's line asks for the editor's keys to work as VS Code's do; (c) is the lazy option. Not built, since a new key is a user-visible shape the brief does not name.
- The configured text chords leave out `m` as well as `l` and `w` (`editor-keys.ts`, `takesChordSecond`), on every platform: off macOS Ctrl+L Ctrl+M is tab focus mode, and one catalog serves every platform.
- In a `.bib` tab the palette lists Promote, Demote, Item, Surround, Select Line and Toggle Tab Focus with no key; LaTeX Workshop lists them in its command palette for any file, and binds their keys in LaTeX files alone.
- Surround runs with no selection too (it inserts `\command{}`); LaTeX Workshop's binding needs a selection.
- Ctrl+K in a read-only editor on macOS is left to the browser (no `preventDefault`), so it does nothing.
- Every Monaco editor on the page takes Cmd+K as its chord key, the merge editor's two sides and the diff editor's included, since the keybinding rules are Monaco's and global to the page.
- `tabCompletion` stays off and column selection mode is never switched on, as in VS Code's defaults, so their rows are never met.
- The LaTeX one-press keys Cmd+Alt+B, C and J are presses Chrome on macOS may keep (bookmark manager, inspect element, JavaScript console); not verified, the look decides. In a `.bib` file Cmd+Alt+B and C, and in a `.sty` or `.cls` file Cmd+Alt+J and M, now reach the editor and then the browser, so whatever Chrome binds to them runs there; not verified.
- The tooltips write the key as the palette writes keys (`chords.ts` `pressHint`): "Alt+Cmd+B" on macOS where the fixed text said "Cmd+Alt+B", and "Ctrl+Alt+B" off macOS.

## Before and after, for the look

- Status bar, wide window (TEST, any page). Before and after: left group at the left edge, right group at the right edge, the bell last at the right edge.
- Status bar, narrow window (TEST, a source tab of a LaTeX file so the LaTeX and language server items show, narrow the window until the items do not fit). Before: items from the middle disappear. After: every item drawn; the bar opens at its left end with the right group following the left group; a trackpad swipe and a wheel turn over the bar scroll it to the bell; a swipe past either end does not navigate back; no scrollbar, the bar stays 22 px.
- Status bar, Tab through the items (narrow window). Before: a left-out item cannot take the focus. After: each focused item scrolls into view, the right group walked from its right end.
- Status bar, scrolled, an item arrives or leaves (start a LaTeX build, start a debug session, an app's item). Before: the fit re-ran and hid other items. After: the scroll stays where it is, clamped.
- Status bar, scrolled, open the branch picker with the item half out of view. After: the menu anchors to the item where it is drawn.
- Status bar, debugging and with a wallpaper, scrolled. After: the orange and the translucent ground fill the whole visible bar.
- `.tex` file in a LaTeX tab (TEST, `tests/fixtures/hubs/demo/projects/active/streaming-anomaly/manuscript/main.tex`). Before: Cmd+/ does nothing; `{` adds no `}`. After: Cmd+/ puts `% ` at the line's start and removes it again; `{` after a word adds `}`; a selected word and `(` surrounds it; `\begin{`, `\left(`, `\bigl[`, `\(`, `\[` and `\{` add no closing bracket; a backtick adds `'`; Enter after `\begin{itemize}` indents the next line, and typing `\end{` outdents (not for `document`); double-click on `word` in `\textbf{word}` selects `word`; double-click on `a_b` selects `a` alone; taking the `@(` suggestion leaves no stray `)`; `\begin{` still offers the tab's environment completion and Enter in a list still adds `\item`.
- `.tex` keys. Before: Cmd+L Cmd+L and Cmd+L Ctrl+Shift+M ran nothing. After: Cmd+L Cmd+L selects the caret's line, again adds the next line; Cmd+L Ctrl+Shift+M toggles tab focus mode (then Tab moves the focus out of the editor). Unchanged: Cmd+L Cmd+B wraps in `\textbf`, Cmd+L Cmd+W surrounds, Cmd+L Cmd+Enter inserts `\item`, Cmd+Alt+[ promotes, Cmd+Alt+B, C, V, J and M build, clean, view, show the line in the PDF and open Math Preview.
- `.bib` file in a LaTeX tab. Before: Cmd+Alt+B built and Cmd+Alt+C cleaned; Cmd+Alt+[ and ] promoted and demoted; Cmd+L Cmd+Enter inserted `\item` and Cmd+L Cmd+W surrounded; Cmd+/ did nothing; the Build tooltip read "Build the LaTeX project (Cmd+Alt+B)". After: Cmd+Alt+B runs nothing of the tab's; Cmd+Alt+C, with the find widget open, toggles case-sensitive find, as in VS Code with LaTeX Workshop; Cmd+Alt+[ and ] fold and unfold; Cmd+L Cmd+Enter, Cmd+L Cmd+W, Cmd+L Cmd+L and Cmd+L Ctrl+Shift+M run nothing; Cmd+L Cmd+B still wraps and Ctrl+Shift+M Cmd+B still wraps in `\mathbf`; Cmd+/ comments with `% `; the Build tooltip reads "Build the LaTeX project"; Build and Clean are still in the palette and the bar.
- `.sty` or `.cls` file in a LaTeX tab. Before: every key of the tab was bound: Cmd+Alt+J showed the line in the PDF, Cmd+Alt+M opened Math Preview, Cmd+Alt+[ promoted, Cmd+L and Ctrl+Shift+M started the text and math chords. After: Cmd+Alt+B, C and V build, clean and view (unchanged); Cmd+Alt+J and Cmd+Alt+M run nothing of the tab's; Cmd+Alt+[ and ] fold and unfold; Cmd+L selects the line; Ctrl+Shift+M toggles tab focus mode; Cmd+L Cmd+B wraps nothing; every one of those commands is still in the palette, with no key.
- `.yml` file. Cmd+L selects the line; Cmd+/ comments with `# ` (unchanged).
- `.slurm`, `Makefile`, `.m`, `.ml`, `.lisp`, `.diff`, `.jl`. Before: Cmd+/ did nothing in each but `.jl`'s brackets. After: Cmd+/ comments with `#`, `#` at the line's start with no indent, `%`, `(* *)`, `;`, `#`, `#`; brackets auto-close. `.slurm`: `"`, `'` and the backtick auto-close outside a string, as in VS Code. `.m` with lines selected and Shift+Alt+A: `%{` and `%}` each on their own line. `.jl` before: `'` added a closing `'` and a backtick did not; after: `'` adds nothing (the transpose `A'` types as written), a backtick adds a closing backtick, whenever Monaco's own Julia settings arrive.
- A configured text chord on `m`. Before: on macOS Cmd+L Cmd+M ran the configured chord. After: a text chord configured on `m` is left out on every platform, as on `l` and `w`, since Cmd+L Cmd+M collides off macOS with tab focus mode.
- An app that adds a language oculus gives settings for (Shell, Make, Common Lisp, the Fortran forms). Before: the app's settings won, given later at the same rank. After: the app's settings still win, now by a higher rank.
- Cmd+K in the editor (`.yml` and `.tex`). Before: Cmd+K opened the palette. After: Cmd+K Cmd+C comments, Cmd+K Cmd+U uncomments, Cmd+K Cmd+0 folds all, Cmd+K Cmd+J unfolds all, Cmd+K then Q does nothing; no palette opens.
- Ctrl+K on macOS. Before: opened the palette everywhere. After: in the editor deletes to the line's end; in a read-only editor does nothing; with the focus in a view opens the palette.
- Cmd+K outside the editor (a Files row, the terminal, a form field): opens the palette, a second Cmd+K closes it (unchanged). In the editor Cmd+Shift+P and F1 open command mode, Cmd+P files (unchanged).
- Keyboard Shortcuts view (Help page, Keyboard Shortcuts tab). Before: the Cmd+K chords read "run from the palette", and the LaTeX rows named no files. After: Cmd+K Cmd+C under Add Line Comment as an editor key, Ctrl+K under Delete All Right on macOS, no row reads "run from the palette", the Cmd+K row reads "opens the palette, or closes it when it is open; in the editor it starts the editor's chords instead" (`config/text/palette-page.yml:23`, `key_open`); the LaTeX rows end with their files ("..., in a .tex tab", "..., in a .tex or .bib tab", "..., in a .tex, .sty or .cls tab") and list Cmd+L Cmd+L "Select the current line" and Cmd+L Ctrl+Shift+M "Toggle whether Tab moves the focus".
- `docs/HELP.md` keys table. Before: the LaTeX rows named no files. After: each names its files, as the Keys view.
- The Build and View tooltips off macOS. Before: "(Cmd+Alt+B)" and "(Cmd+Alt+V)". After: "(Ctrl+Alt+B)" and "(Ctrl+Alt+V)"; on macOS "(Alt+Cmd+B)" and "(Alt+Cmd+V)".
- The palette with a source tab on screen: lists the Cmd+K chord actions under Monaco's labels with the chord beside each, and Delete All Right with Ctrl+K on macOS (unchanged). The palette page (`docs/palette.md`, the Help page's palette text) says the chord runs the action in the editor, and has a new sentence, "Pin Editor and Unpin Editor stand in the palette for the chord VS Code binds them to, shown beside them." (`config/text/palette-page.yml` `editor_intro`, `docs/palette.md:142`), which open item 259 may change (J1).

## What the brief got wrong

- `features/json/jsonMode.js:137-140` does not export a `conf`: JSON's language configuration is set inside `setupMode`. The test reads it by running `setupMode` against stand-ins of the Monaco API and taking the configuration it sets.
- "Monaco merges a language's configurations field by field, so a rule set at start survives Monaco's later `conf`" holds for a field Monaco's `conf` lacks (Julia's `comments`); for a field it holds (Julia's brackets and pairs), the later entry at equal rank wins (`languageConfigurationRegistry.js:181-206`). Settled by giving oculus's settings a rank above Monaco's.
- F7 and Shift+F7 are not only the diff editor's: in a source tab they run `wordHighlight.next` and `wordHighlight.prev` (`wordHighlighter.js`).
- Item 5 names `l`, `w` and Enter as the configured chord keys that collide; Enter cannot be a configured key (the reader takes one character of `[A-Za-z0-9-]`), and `m` collides off macOS, where Ctrl+L Ctrl+M is tab focus mode.
- "Cmd+Alt+[ and ] stay promote and demote": LaTeX Workshop binds them in LaTeX files alone, not in `.bib`, `.sty` or `.cls`.
- "The LaTeX tab's keys that take an editor key (Cmd+L, Cmd+Alt+[ and ])": Cmd+Alt+C takes one too, Monaco's `toggleFindCaseSensitive` (`findModel.js:28-31`, `kbExpr: EditorContextKeys.focus`). In a `.tex` file LaTeX Workshop binds Clean to it as well, so it stays Clean there; in a `.bib` file it now reaches Monaco (ruling 5).

## Doc text

For `agents/guarded.md`:

- G121. Guarantee: Every language the editor registers has a comment rule, so Cmd+/ and Shift+Alt+A comment in a file of any of them: the settings oculus gives Monaco, or Monaco's own settings of the id, hold a `comments` field.
  Code: `src/lib/ui/controls/editor/kit/rite/settings.ts` (`registerSettings`), `src/lib/ui/controls/editor/kit/rite/latex-settings.ts`, `src/lib/ui/controls/editor/kit/languages/configuration.ts` (`languageConfiguration`).
  Test: `tests/ui/controls/editor/kit/comment-rules.test.ts`, describe 'the comment rule of every language the editor registers', '$id has a comment rule', every row (32).
- Proposed, under the next free number. Guarantee: A LaTeX tab binds each of its keys in the files LaTeX Workshop binds it in, and lists a command whose key the file does not take with no key: every key in a `.tex` file; the text and math chords alone in a `.bib` file; Build, Clean and View alone in a `.sty` or `.cls` file.
  Code: `src/lib/data/helpers/keys/oculus/editor-keys.ts` (`LATEX_SCOPES`, `inLatexScope`), `src/lib/views/sources/source/latex/latex-tab.svelte.ts` (`actions`).
  Test: `tests/views/sources/source/latex-keys.client.test.ts`, describe 'the keys of a LaTeX tab, by the kind of file it shows', every row (4).
- Proposed, under the next free number. Guarantee: Julia keeps VS Code's brackets and auto-closing pairs whenever Monaco gives its own Julia settings, and an app's settings of a language win over oculus's for the fields they hold.
  Code: `src/lib/ui/controls/editor/kit/rite/settings.ts` (`OCULUS_RANK`, `registerSettings`), `src/lib/ui/controls/editor/kit/languages/register.ts` (`applyAppLanguages`), `src/lib/ui/controls/editor/kit/load.ts` (`languageSettings`).
  Test: `tests/ui/controls/editor/kit/comment-rules.test.ts`, describes "Julia's settings" and "an app's settings of a language" (one row each).
