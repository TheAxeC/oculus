# Step D13a refuter report (on .agents/worktrees/D13a, base fcde80b7)

A page this report cites is named with its section. A finding in code keeps its `file:line`.

## Verification (rerun by the reviewer)

```
$ sh ~/.claude/skills/land/templates/checks.sh .../orchestrator-state.md </dev/null   (from the worktree's tools/oculus, load average 4.77 8.57 10.47 at start)
$ npm test
 Test Files  2 failed | 359 passed (361)
      Tests  2 failed | 5732 passed | 1 skipped (5735)
   FAIL tests/server/git/git-ops.test.ts > ... routes each action to its own operation with its own fields: Test timed out in 5000ms.
   FAIL tests/server/machine/pty/sessions.test.ts > starts, lists, feeds, resizes, captures and stops a terminal: timed out waiting for the typed line to come back as output
checks: failed with exit 1: npm test

$ npx vitest run tests/server/git/git-ops.test.ts tests/server/machine/pty/sessions.test.ts   (alone; neither file is touched by the step)
 Test Files  2 passed (2)
      Tests  56 passed (56)

The rest of the list, run by hand in the script's order because checks.sh stops at the first red:
$ npm run check          exit 0: COMPLETED 2096 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build          exit 0: "built in 18.64s" and "built in 44.74s"
$ npm run format:check   exit 0: All matched files use Prettier code style!
$ npm run lint           exit 0, no output after "eslint ."
$ ! LC_ALL=C grep -rna '[^ -~]' src tests     grep exit 1, prints nothing (pass)

Brief verify item 2:
$ grep -rlE "StandaloneCodeEditor|shikiToMonaco" build/server     prints nothing, exit 1
$ grep -rlE "monaco|shiki|tmLanguage|vscode-textmate" build/server   prints nothing
$ grep -rlE "addKeybindingRules|data-editor-host|kind_editor|oculus-mark" build/server   prints nothing (see Proof 1)
Brief verify item 3:
$ bash bin/folder-check.sh   exit 0

Claims rerun:
- Cmd+K chords in installed monaco-editor 0.57.0: grep of `KeyChord(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, ...)` under esm/vs gives 26 binding sites in 10 files: 13 folding sites plus the foldLevel loop (7), 2 comment, 2 anchorSelect, formatSelection, trimTrailingWhitespace, moveSelectionToNextFindMatch, editor.action.showHover, revealDefinitionAside (2 bindings: K F12 and K Cmd+F12), togglePeekWidgetFocus (referencesController.js:289), workbench.action.showHover (hoverService.js:100). That is 31 ids, the brief's 29 plus the builder's two. WinCtrl+KeyK is bound only by deleteAllRight (linesOperations.js:694). Reproduced.
- Null-rule behaviour: keybindingResolver.js `_addKeyPress` treats the one-chord null item as a prefix that shadows every Cmd+K chord, `resolve` answers KbFound with commandId null, and abstractKeybindingService.js:240-247 sets shouldPreventDefault only in chord mode, so the key is not prevented and bubbles to the shell. Reproduced by reading.
- Colour keys: 433 distinct literal `registerColor('<key>'` keys under esm/vs; no non-literal call outside colorUtils.js's own definitions; colours.ts names 433 keys, none missing, none extra. Reproduced.
- Contrast: a node probe over the 17 themes of config/appearance.yml (parse.ts, derive.ts): 102 pairs, 79 bare hues under 4.5:1 on --panel, the -txt forms 4.82 to 5.95, none under 4.5, --c-green-txt and --c-red-txt none under 4.5. The 79 reproduces; the builder's range 5.01 to 5.82 does not (Proof 3).
- Shiki ids: all 18 ids in `bundledLanguages` of the installed shiki 4.4.3; `plaintext` is not among them, as grammars.ts assumes. Reproduced.
- Lock: 47 packages added, 0 removed; every one of them is reachable from the three pinned packages; licenses MIT 46, ISC 1; shiki 4.4.3 MIT, monaco-editor 0.57.0 MIT, @shikijs/monaco 4.4.3 MIT. Reproduced.
- Removed helpers: `grep -rnw "lineStart|withEnding|indentUnit|convertIndent|caretOf"` over src tests config bin and the three documents finds only private `lineStart` functions in server/edit/list-edit.ts, server/edit/yaml-edit.ts and server/accounts/connect/rows.ts, which are separate functions. At base, `git grep` finds the exported ones used only by source.svelte.ts, editor-text.ts, the source views and their three test files. Reproduced.
```

## 1. Spec

- `src/lib/ui/controls/editor/theme.ts:30-65`: the scope rules paint `--c-code-*-txt`, `--c-green-txt` and `--c-red-txt`. The brief's item 3 and case 4 name the bare hues `--c-code-*`, `--c-green` and `--c-red`, so this is a substitute for a shape the brief named, and case 4's test (`theme.test.ts:147-156`) expects the `-txt` names. On the evidence the substitute reads true. At base the old mirror painted the `-txt` forms: base `tests/ui/colours.test.ts` held both `shared/code/Code.svelte` and `sources/source/Editor.svelte` to `var(--c-code-*-txt)`, and `Code.svelte:98-150` paints `-txt` today. The bare-hue measure also reproduces (79 of 102 under 4.5:1). The orchestrator has to rule on it, since the brief named the bare hues.
- `theme.ts:50-60`: the meta hue is given to `meta.preprocessor`, `meta.directive`, `meta.tag`, `entity.name.tag`, `punctuation` and `variable`, and not to the bare `meta` scope the brief's item 3 names. The report gives it as judgment call 4, so it is a decision about the brief's own scope list and needs the orchestrator's ruling.
- `theme.ts:61-62` with `node_modules/@shikijs/monaco/dist/index.mjs` (the `setTheme` wrapper, `const c = normalizeColor(rule.foreground); if (!c) return;`): item 3 asks for "bold and italic as the code window's strong and emphasis rules draw them", and the editor draws neither. The two rules carry a fontStyle and no foreground. The bridge builds its colour-and-style-to-scope map only from rules that have a foreground, so a token Shiki marks bold or italic is handed to Monaco with the scope `""`. Reproduced with a node probe (`.scratch-refute/bold.mjs`, the installed shiki and @shikijs/monaco, the markdown grammar, a theme with the same two rules). Shiki's own tokens carry fontStyle 2 on `**bold**` and 1 on `*it*`, and the provider the bridge registers answers `{"startIndex":5,"scopes":""}` and `{"startIndex":18,"scopes":""}` for them. No test covers this: `scopeToken` is tested, and the path through the bridge is not.
- `src/lib/ui/controls/editor/load.ts:75-77`: `noSemanticValidation: true` for TypeScript and JavaScript. Item 1 says "Monaco's own language services for those languages stay on". The report gives this as judgment call 5 rather than raising it as a decision on a brief item.
- The diff writes paths outside the brief's "Paths this step writes": `views/sources/source/Gutter.svelte`, `state/sessions/source.svelte.ts`, `state/shared/words/languages.ts`, `data/helpers/editor.ts`, `state/client/selectors.svelte.ts`, `config/behavior.yml`, `tests/state/sessions/source.test.ts`, `tests/state/workbench/navigation/editor-text.test.ts`, `tests/shell/status/status-bar.test.ts`, `tests/ui/colours.test.ts`, `tests/views/whole/type-scale.test.ts`, `tests/checks/tree/boundaries.test.ts`, `tests/checks/tree/allow-styling.ts` and `tests/checks/source/html-sites.test.ts`. Each is named with a reason in the report, and most are forced (stale allow entries, removed exports). Five of them are paths of the in-flight Q79b or Q96 briefs, and the dispatch block's `shared_paths` for D13a does not record them. D13a's hunks, for the merge at landing:
  - `DESIGN.md`: one hunk `@@ -281,17 +281,18 @@`. It rewrites lines 284, 288 and 294 (now 295) and adds line 289. Q96 changes line 306.
  - `tests/ui/colours.test.ts`: one hunk `@@ -546,18 +546,29 @@`, the "the code window palette" describe (the `it.each` becomes two cases). The file is in Q79b's list and in the Q96/Q79b overlap named in `Q96-round1-sent.md`.
  - `tests/views/whole/type-scale.test.ts`: two hunks. `@@ -227,7 +227,7 @@` sets the `VIEWS` entry `'sources/source/Editor.svelte': ''`, and `@@ -279,6 +279,7 @@` adds the `PASS_THROUGH` entry `'src/lib/ui/controls/editor/Editor.svelte': '.editor=fs-sm'`. Q96 and Q79b both change this file.
  - `tests/checks/source/html-sites.test.ts`: one hunk `@@ -35,9 +35,7 @@`, which removes the `ALLOWED` key `views/sources/source/Editor.svelte:painted`. Q79b rewrites this file's site reader at lines 40-80.
  - `tests/checks/tree/boundaries.test.ts`: one hunk `@@ -241,8 +241,14 @@`, a FROZEN docstring paragraph and the entry `lib/ui/controls/editor/load.ts:loading`. Q79b changes `selectorAt` at lines 376-383.
  - `tests/checks/tree/allow-styling.ts`: one hunk `@@ -124,10 +124,6 @@`, which removes the `HELD` entry for `Editor.svelte ... .input :global(.area)`. The Q79b and Q96 briefs do not list this file (grep of both briefs), so the reviewer has not seen an overlap here.
  - `docs/diagrams/`: regenerated, a mechanical rerun as the state file says.

## 2. Proof

- Brief case 12 and verify item 2, and the report's DONE row "Server build holds no Monaco or Shiki": the check cannot fail. `src/routes/+layout.ts:2` is `export const ssr = false`, and `build/server` holds no component at all: the greps for `data-editor-host`, `kind_editor`, `oculus-mark` and `addKeybindingRules` print nothing. A static `import * as monaco from 'monaco-editor'` in `Editor.svelte` would leave the grep just as empty. The check is the brief's own. It is still an audit, not a proof, and the builder's first run shows it green on the unchanged tree as well.
- `tests/checks/tree/boundaries.test.ts:245-251` adds a file-scope mutable, `load.ts:39` `let loading`, and exempts it in `FROZEN`. `load.ts:68` also writes the global `self.MonacoEnvironment`. Brief item 1 asks for "a module-level promise" and names `self.MonacoEnvironment.getWorker`, so both are the brief's mechanism and not a check dodged. They still meet spec.md's "No globals" principle ("no module-level mutable state"; "Nothing in a brief overrides anything here"). The tree's precedent for a once-per-page library loader is viz-js, whose loader the client state holds (`state/client/context.ts` `graphviz`, DESIGN.md's Map decision). The ui layer cannot read client state, but it could be handed the loader as a prop. Whether the brief's module-level promise stands is the orchestrator's call.
- The report's "`-txt` forms clear 5.01 to 5.82": the reviewer's probe over the same 17 themes gives 4.82 to 5.95. The decision that rests on it, painting the scopes with the `-txt` forms because they clear 4.5:1, holds either way (none under 4.5 in the rerun). The 79 of 102 reproduces.
- `tests/ui/colours.test.ts:564`, "paints the editor's scopes through those six and nothing else": it reads the text of `theme.ts` with a regular expression. It is an assertion over source text, which spec.md ("What every package obeys") says is an audit, but its comment calls it "Red when". The behaviour is proved elsewhere, by `theme.test.ts:159-176` (Shiki colours a Python comment, keyword and string in the tokens' `-txt` hues).
- `tests/ui/controls/editor/chords.test.ts:99-107`: its comment says "Red when a Cmd+K chord of the package is missing from the list", but the test compares with the hand list `CMD_K` in the test file, not with the package. A Cmd+K chord a later Monaco adds leaves it green. The test meets case 6 as the brief wrote it; the comment claims more than the test does.
- `tests/ui/controls/editor/gutter.test.ts:103-108` asserts that each blamed number string has one length (`numbers(1)` has the length of `numbers(2)`). Monaco puts the string into an HTML string without `white-space: pre` (see Standards 1), so the padding it measures is collapsed on screen. The test holds a property the rendered column does not have.

## 3. Standards

- `src/lib/ui/controls/editor/gutter.ts:119-125` with `Editor.svelte:320`: the blame words, which include `line.author` from git (`file-git.ts:106`, `t('repositories.blame_gutter', line.author, ...)`), are returned by the `lineNumbers` function. Monaco 0.57 puts that string unescaped into the margin's HTML: `lineNumbers.js:158`, `` `<div class="line-numbers..." ...>${renderLineNumber}</div>` ``, rendered through `viewLayer.js:387` `innerHTML`. A commit author named with markup (any cloned repository's history) is injected into the page. This breaks spec.md "What every package obeys", "A value from the hub or a feed that reaches HTML or a shell is untrusted". The same path collapses the `padEnd`/`padStart` spaces, since `lineNumbers.css` sets no `white-space: pre`.
- `src/lib/ui/controls/editor/load.ts:6-8` ("the server renders the editor's host and never reaches this code") and `Editor.svelte:7-9` ("draws the text as a plain block on the server and on the first frame") are false for the running app, which has `ssr = false` (`src/routes/+layout.ts:2`). The server renders no component, and the plain block is drawn only in the unit suite's `svelte/server` render and on the client before load. A head comment the diff makes false breaks spec.md "What every package obeys".
- `src/lib/ui/forms/TextArea.svelte:24-25`: the `onscroll` prop, commented "The caller may keep a visual mirror aligned with this field", now has no caller. Its only user was the old source `Editor.svelte` (base line 287, `onscroll={sync}`). `grep -rn "<TextArea" -A14 src` shows no `onscroll=`. The diff leaves a dead public prop and a comment about a mirror that no longer exists (spec.md principles, YAGNI; "a sentence ... that the change makes false").
- `tests/views/sources/source.test.ts:250-252`: two stacked `// Red when` comments above one test. The first ("handed the highlighter's name without the paint limit read") describes the paint-limit test below it, not this one.
- `src/lib/ui/controls/editor/types.ts:15` `EditorAction` repeats `state/workbench/navigation/editor-status.svelte.ts:410` `EditorAction` field for field, and `gutter.ts:26` `EditorBlame` repeats `file-git.ts:119` `BlameRow`. That is two definitions of each shape (spec.md principles, DRY). The layer rule explains the separate copies, but no single place owns the shape.
- The builder ran `git -C . diff --stat` in the worktree. spec.md "Where you work" says "You never run a git command", and the state file says the `-C` form is forbidden under `.codex/rules`. The command was read-only and wrote nothing. The report states it.

## 4. Behaviour

- In the editor, the quick diff marks and the blamed line numbers are now mouse-only Monaco decorations. At base they were `ToolButton`s in `Gutter.svelte` (head comment: "A mark is a button that opens the file's diff at that change"), reachable by Tab and pressable by keyboard. After the change a keyboard reader cannot open a mark's diff from a writable file (the status bar's blame item still opens the caret line's commit). The report's before and after ("Gutter.svelte rows beside the textarea" to decorations) does not state this loss.
- Markdown bold and italic drew at weight 700 and in italic in the old mirror (the `.hljs-strong` and `.hljs-emphasis` rules). In the editor they draw plain (Spec 3). The report does not state it.
- The blame column's words are left-ragged and their padding collapsed (Standards 1), and a name holding `<` or `&` renders as markup or an entity. The report does not state it.
- Every theme change loads a new Shiki theme (`oculus-<n>`) into the page's one highlighter, and `shikiToMonaco` defines every loaded theme again and registers a new tokens provider per language (`load.ts:98-103`). What is held grows with each switch in a session, and the old providers are never disposed. The report does not state it.

## Not checked

- Everything case 14 names in a browser (no browser run): Shiki colouring per language, the repaint on a theme switch (whether Monaco re-tokenises on the re-registered providers and the new colour map), Cmd+K and macOS Ctrl+K reaching the palette from inside Monaco, the palette action running on the caret's line, Escape then Tab leaving, mark and blame presses, the context menu's colours, the Markdown preview following the scroll, and a hidden tab redrawing.
- Wall mode (`Editor.svelte:458-470`): whether the minimap canvas, sticky scroll, the overview ruler and the current-line highlight stay opaque over the wallpaper while the three overridden surfaces go translucent.
- Whether the first editor of a page flashes Monaco's default `vs` theme between `editor.create` (`Editor.svelte:168`) and the first `paint` resolving.
- The runtime order of the model effect's cleanup and `onDestroy` on unmount. The code is safe in either order (`Editor.svelte:262-268`, `406-411`), which was read, not run.
- The report's file line counts and the bundle-size figures (no decision rests on them).

Reviewer usage: not measured exactly; about 65 tool uses, roughly 300k tokens, about 35 minutes.

# Repair round 1, refuted

Tree hash after the round: `(git diff fcde80b7; git status --short) | md5` = f9faf3d3ebb7fe9afc7e33ca0b698235.

## Verification (from the worktree's `tools/oculus`)

```
$ npm test
 Test Files  362 passed (362)
      Tests  5746 passed | 1 skipped (5747)
$ npm run check
COMPLETED 2097 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
✓ built in 6.52s
✓ built in 17.96s
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 6 commands passed
```

The report's quoted commands, rerun, each reproduced: the `.line-numbers{white-space:pre}` rule in the built CSS; no `onscroll` in `TextArea.svelte` or its callers; no editor code in `build/server`; the editor folder at 10 items and `bin/folder-check.sh` exit 0; the contrast probe (17 themes, bare hues under 4.5:1 on 79 of 102 pairs, the `-txt` code roles 4.82 to 5.95 with none under, green and red `-txt` 4.88 to 13.06 with none under); no Monaco binding of F5; every `wc -l` the report gives.

Reverts run on copies under `.scratch-refute-r1/`, the unreverted copy green: the escape removed, `token: null` on bold and italic, one highlighter kept across paints, the dispose removed, the signature check removed, `stepMark` unsorted, Open Change falling back to the first mark, Previous bound without Shift; each red.

## Verdicts

Every item of "What to build" holds (Documents except the sentences under Standards 2). Cases 2 to 13 met (4 as ruled, 12 as an audit, 13 by reading); cases 1 and 14 not verifiable here (the look).

## Spec

1. `Editor.svelte:194-210`, `palette.ts:141-153`: the three mark actions are listed for a source tab with no marks, where choosing them does nothing (judgment call 12). Round item 4 did not say. A user-visible choice nothing named. The ids `oculus.editor.*` are search text, so the query `oculus` lists the three.
2. `gutter.ts:118,125`: the hints are the literals `Alt+F5` and `Shift+Alt+F5` on every platform, while `chordHint` (`chords.ts:97-110`) writes per platform (judgment call 13). `HELP.md:82` writes `Alt+F5` for the Diff view, and the round said "Alt+F5".

## Proof

1. `gutter.test.ts:209-212` (`numbersWidth`, used at 192-196) measures the escaped text while the column holds the unescaped length (`blameWidth`, `gutter.ts:222-225`); the case holds only because its authors carry no escaped character. With the author `A & B` it goes red on correct code.

## Standards

1. `gutter.ts:105-108` says the palette's hint is written from `codes`; the hints are literals, and `KeyPress` has no `alt`, so a change to `keys` leaves the hint wrong and `gutter.test.ts:116-124` checks the two apart.
2. `types.ts:15`, `Palette.svelte:18-21`, `DESIGN.md:284` describe the palette's editor items as the removed Cmd+K chords with their old chord only; the mark actions made that untrue.

## Behaviour

None beyond Spec 1 and 2.

## Declined to judge

Case 14's look; whether Monaco's tokenizer can call a disposed highlighter's provider from a pass scheduled before the new providers (needs a live Monaco); the palette tests' reverts (they render through the tree's SvelteKit configuration); Monaco's `editor.action.toggleHighContrast` registration; the inline-edit gutter indicator (no inline-completions provider is registered).

Reviewer usage: 212738 tokens, 57 tool uses, 10 min (completion notice).
