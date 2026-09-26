# Library audit: the open items

The eight reports `library-audit-A.md` to `library-audit-H.md` cover every tracked file under `src/`, `bin/`, `tests/checks/`, `tests/fixtures/`, `tests/browser/helpers/` and the root configuration files (714 files, X3b's worktree included), and the 29 open steps of `plan.md` (O32 excluded: it waits on Ordo). Each report's coverage table was checked against `git ls-files` for its part, and every path is in a table. The files outside every part are content, not code: `assets/` (28 images), `config/` (64 YAML files), `demo/` (43 demo hub files), `docs/diagrams/` (18 generated SVGs), the three documents and `package-lock.json`; the code that reads them is under `src/` and is covered.

Every library fact below was rerun with `npm view <pkg> version license time.modified peerDependencies` on 2026-09-26; each matched the auditor's. Oculus runs svelte 5.57.0, @sveltejs/kit 2.70.3, marked 18.0.12, typescript 6.0.3, eslint 10.10.0, Node 24.21.0. Line figures are the auditors' estimates.

Each item: the options, pros and cons, one recommendation, and the lazy option named. Section C lists the capabilities where every auditor recommends keeping the code; each row is still Axel's to overrule.

## A. The code on main and in X3b

### LA1. Menus, context menus, tooltips, dialogs (`ui/menu/`, `ui/controls/Confirm`, X3b `ui/forms/Prompt`; A section 1)

Oculus has 1,912 lines: hand positioning from `getBoundingClientRect`, a body portal, document `pointerdown` listeners, two copies of a Tab trap, a menu with ArrowUp and ArrowDown only, submenus replaced in place with Back. VS Code cascades submenus to the side and has Home, End and type-ahead.

- (a) bits-ui 2.19.3, MIT, released 2026-09-22, peers `svelte ^5.33.0` and `@internationalized/date`. Headless Svelte 5 components: Dropdown Menu with cascading `Sub`, `textValue` type-ahead, Context Menu, Tooltip, Dialog, Alert Dialog, floating-ui collision handling, focus management. Unstyled, so the token rules move onto its parts. About 900 lines removed. Con: a confirm dialog in a hidden tab must be proven in the browser suite.
- (b) The platform: `<dialog>.showModal()`, `inert`, popover and CSS anchor positioning. Removes the portal and the Tab traps; the menu keyboard and cascading submenus stay by hand.
- (c) Keep, and write the missing keys and submenus by hand.

Recommendation: (a). It removes the most code and brings the VS Code menu behaviour oculus lacks. Lazy option: (c).

### LA2. Fuzzy matching and the palette (`state/workbench/palette.ts`, `shell/keys/Palette.svelte`; A 2, D G, H 2.9)

Oculus matches by lowercased substrings, with no highlight. VS Code's Quick Open, Go to File, the language picker and the Explorer filter match fuzzily with the matched characters highlighted. The palette also lacks `aria-activedescendant`.

- (a) fuzzysort 4.0.2, MIT, 2026-08-13, no peers: multi-key, `highlight()`, space-separated terms. Used for the palette, `matchingFiles`, `languageChoices` and X3a's filter toggle.
- (b) (a) plus the bits-ui Command component for the palette list (with LA1 (a)), `shouldFilter={false}`: about 150 lines of selection and key handling removed.
- (c) @leeoniya/ufuzzy 1.0.19 or fuse.js 7.5.0 in place of fuzzysort.
- (d) Keep substring matching.

Recommendation: (b) if LA1 is (a), otherwise (a). Lazy option: (d).

### LA3. Long lists (a capability oculus lacks; A 5)

No list is virtualized: `views/sources/files/tree/Tree.svelte:195` draws every row of an open folder. VS Code's lists are virtualized.

- (a) @tanstack/virtual-core 3.17.11, MIT, 2026-09-14, no dependencies, driven from `$state` inside `ui/tree/TreeView` and the other long lists.
- (b) virtua 0.52.7, MIT, 2026-09-22, a `./svelte` component, peer `svelte >=5`; pre-1.0.
- (c) Keep drawing every row.

Recommendation: (a). Lazy option: (c).

### LA4. The tree primitive (`ui/tree/`, 808 lines; A 4, H 2.8, B C7)

X3a adds multi-select, drag to move and from outside, rename, type-ahead and expand-all to the Explorer.

- (a) @zag-js/tree-view with @zag-js/svelte 1.44.0, MIT, 2026-09-14, peer `svelte >=5`, maintained by the chakra-ui organisation. Its documentation page names multiple selection (`selectionMode`), rename, type-ahead, lazy loading, checkboxes and expand all; it names no drag, so drag stays on oculus's `drag.svelte.ts`.
- (b) @headless-tree/core 1.7.0, MIT, 2026-05-17, one maintainer. Lists drag and drop including external drags, multi-select, rename, type-ahead, virtualization. React is its only binding; the Svelte binding would be oculus's own.
- (c) @vscode-elements `vscode-tree`: themes through shadow DOM from `--vscode-*` variables, outside the tokens the contrast test measures.
- (d) Keep, and write multi-select, rename and type-ahead by hand in X3a.

Recommendation: (a). It has a maintained Svelte 5 binding and covers what X3a adds except drag, which oculus already has. Lazy option: (d).

### LA5. Colour math (`themes/derive.ts`, `tests/checks/look/lane-distance.test.ts`; A 7, G 8)

Oculus writes sRGB to CIELAB, CIEDE2000, WCAG luminance and contrast by hand.

- (a) culori 4.0.2, MIT, no dependencies: `differenceCiede2000`, `wcagContrast`, `wcagLuminance`, types in @types/culori. About 80 lines in the test and the derive formulas removed.
- (b) colorjs.io 0.7.1 (pre-1.0) or chroma-js 3.2.0.
- (c) Keep.

Recommendation: (a). Lazy option: (c).

### LA6. Fetch-and-hold stores (11 caches, about 2,700 lines in `state/`; D section D)

The same pattern is written eleven times: a keyed cache, an in-flight set, a fetch on a microtask, stale on a channel version, the old answer kept while refetching, loading and error, a server-render guard (`system/docs.svelte.ts` is one).

- (a) @tanstack/svelte-query 6.3.0, MIT, released 2026-09-26, peer `svelte ^5.25.0`. A `QueryClient` built in `createClientState` and passed by context; a socket message on a channel becomes `invalidateQueries`; `createMutation` for the command stores. About 1,000 lines removed. Con: tests that hand a store a fake need a QueryClient.
- (b) Keep, with one in-house helper holding the pattern once.
- (c) Keep as is.

Recommendation: (a). Lazy option: (c). Independently of the choice, `shared/stores/post.ts` is folded into `client/writes.svelte.ts` (booked, section D).

### LA7. Runtime validation of untyped input (server and state; E C6, D F)

Hand `typeof` guards in about 40 state files and the server's JSON and YAML readers.

- (a) zod 4.6.5, MIT, 2026-09-25, no dependencies; the `data/model` types stay the facade through `satisfies z.ZodType<T>`.
- (b) valibot 1.5.0, MIT, peer `typescript >=5`.
- (c) Keep.

Recommendation: (a), the most established, typed from the schema. Lazy option: (c). The seven copies of `isRecord` go to `isMap` whatever is ruled (booked).

### LA8. Diff, word diff and three-way regions (X3b `diff-words.ts`, `diff-rows.ts`, `merge-regions.ts`; B C2 and C3, D H, H 2.4 and 2.5)

X3b hand-writes a Myers diff with a 2,000-edit cap, a word diff, a unified-diff parser and the three-way region cut.

- (a) node-diff3 3.2.1, MIT, 2026-06-03, no dependencies, for the three-way regions (`diff3MergeRegions`), and diff (jsdiff) 9.0.0, BSD-3-Clause, 2026-04-13, for `common()`, the word diff and `parsePatch`. About 280 lines removed.
- (b) node-diff3 only, with the word diff and parser left to Monaco (LA9), which draws word changes itself.
- (c) Keep.

Recommendation: (b) if LA9 moves the diff pane to Monaco's diff editor, otherwise (a). The partial-hunk patch builder (`diff-patch.ts`) stays under every option: no library builds a patch from chosen lines. Lazy option: (c).

### LA9. The Monaco step's shape (ruled L2 (a); B C1 to C3, H 2.1 and 2.4, and `editor-comparison.md`)

**Monaco against CodeMirror 6, measured again on Axel's request.** A spike in the session scratchpad (SvelteKit with adapter-node, Svelte 5, monaco-editor 0.57.0 and the CodeMirror 6 packages, oculus's `tokens.css` and `themes.css`, probed in headless Chrome) measured both costs; the report is `agents/reviews/editor-comparison.md`. The probe outputs are the agent's; the orchestrator checked the spike's build output, the `lsp` namespace in monaco-editor's CHANGELOG ("Adds native LSP support"), and the two lines of `shell/keys/workbench-keys.svelte.ts` it cites.

| | CodeMirror 6 brought to VS Code parity | Monaco made to fit oculus |
|---|---|---|
| Hand-written lines (estimate) | 3,000 to 3,800 | 1,500 to 2,100 |
| What the lines are | lookalikes of what VS Code has: the find widget, sticky scroll, overview ruler, bracket colours, the missing default keys (its VS Code keymap has 59 bindings, last released 2023), editor commands, breakpoint and diff glue | fit: the `ui/editor/` primitive, the theme from tokens (about 90 colour keys, 3-digit hex expanded), key removals, a context menu drawn by oculus, test helpers, diff staging and breakpoint glue |
| Theme tokens | `var(--token)` directly, no JavaScript | read from the computed style and redefined on a theme change; one theme per page, which is oculus's case |
| Result | close to VS Code, not VS Code | VS Code's editor |

Fit questions the spike proved through supported API: the node-adapter build with Monaco imported in an `$effect` (server bundle holds none of it), the workers through Vite's `?worker`, all 17 themes painted from tokens, `addKeybindingRules` removing a key, `contextmenu: false` handing the event to oculus, `automaticLayout` recovering a hidden tab, 9 editors and a diff editor on one page. Two defects the step must fix: Chrome focuses Monaco's EditContext `div`, which `typingIn` (`workbench-keys.svelte.ts:437`) does not treat as typing, so every typed key reaches the shell (a digit would switch pages); and Monaco refuses 3-digit hex colours. Unproven: widgets clipped by panes (`fixedOverflowWidgets` not tried), colours on the translucent wallpaper surfaces, @shikijs/monaco with 0.57, any of the 87 fixed-default colour keys left unmapped showing VS Code's colour instead of a token.

Recommendation: Monaco stands (L2 (a)). CodeMirror would cost about twice the hand lines and still not be VS Code. DESIGN.md's sentence that Terminal.svelte is the one file reading a computed token changes to name the editor primitive too.

Three questions the ruling leaves open.

1. The package.
   - (a) monaco-editor 0.57.0, MIT, Microsoft, 2026-09-24, with its native `lsp` namespace for D23 (LA16).
   - (b) @codingame/monaco-vscode-editor-api 37.1.0, MIT, 2026-09-21: Monaco built from VS Code's sources, needed only by monaco-languageclient.
   Recommendation: (a), since the native client makes (b) unnecessary. Lazy option: none; both cost the same.
2. The languages. Monaco's own grammars cover 13 of oculus's 19 (none for latex, lisp, matlab, ocaml, makefile, diff).
   - (a) @shikijs/monaco 4.4.3, MIT, 2026-08-10, with VS Code's TextMate grammars and VS Code theme files (LA22). Its fit with Monaco 0.57 is proven first in the step.
   - (b) Monarch grammars written by hand for the six, about 700 lines.
   Recommendation: (a). Lazy option: (b).
3. The diff. Monaco's diff editor compares two whole texts; `api/git` answers a unified diff. Using it means `api/git` also answers both versions of a file, a wire change.
   - (a) Add the two versions to the answer and draw every single-file diff in Monaco's diff editor; the multi-file diff is one diff editor per file; hunk and line staging stay as glue over `diff-patch.ts`.
   - (b) Keep the hand diff pane and use Monaco for the source tab only.
   Recommendation: (a). X3b lands as built, and the Monaco step removes `diff-rows.ts`, the word marks of `diff-words.ts`, `DiffFile.svelte`, most of `Diff.svelte` and `Gutter.svelte`, with X3b's browser specs as its acceptance tests. Lazy option: (b).

### LA10. The Map's layout (`state/boards/structure/graph.ts`, `views/.../Map`; C 1, D O)

Oculus has a seeded force simulation, crossing count, a score and a random tuning search, about 336 lines.

- (a) d3-force 3.0.0, ISC, last release 2021 (no open defects checked): replaces the tick loops (about 90 lines); the score and tuning stay.
- (b) @viz-js/viz, already a devDependency, neato or fdp in the page as WebAssembly: removes the whole layout search (about 330 lines) if its layouts read as well; moves the package to `dependencies`. Whether it runs in the page is not verified.
- (c) Keep.

Recommendation: (b) as a trial inside the step that takes it, with (a) as the fallback if the trial's layouts read worse. Lazy option: (c).

### LA11. Import-graph checks (`bin/diagrams/imports.mjs`, `tests/checks/imports/*`, `boundaries.test.ts`; G 2, H 2.17)

About 740 lines read imports, resolve `$lib`, find cycles and hold folder order and layer rows.

- (a) dependency-cruiser 18.4.0, MIT, 2026-09-20, `supportedTranspilers` svelte `>=3 <6` and typescript `>=2 <7` (both match), a known-violations baseline, rules generated from the order list in JavaScript. About 300 lines removed, 80 of configuration added. Augmentation (`declare module`), `import.meta.glob` and the non-import rules stay by hand. The diagrams read their edges from its `cruise()` output. Its resolution of `$lib` and markup `import()` is proven first on this tree.
- (b) eslint-plugin-boundaries 7.2.0 with eslint-plugin-import-x 4.17.1: two plugins, no augmentation, folder order as many element types.
- (c) Keep.

Recommendation: (a); Q72 then becomes running it. Lazy option: (c).

### LA12. Duplication detection (`tests/checks/tree/duplication.test.ts`, 378 lines; G 4)

A line-window match after a regex comment strip that also cuts `//` inside strings.

- (a) jscpd 5.3.2, MIT, 2026-09-23: token-based detection, Svelte per block, JSON report. The HELD and DELIBERATE ratchet stays as glue over its report, and the 690 held marks are regenerated in its terms. About 150 lines removed, 60 added.
- (b) Keep, and fix the comment strip through the TypeScript scanner (section D).

Recommendation: (a). Lazy option: (b).

### LA13. Code colour in Markdown (a capability oculus lacks; B C5)

Fenced code in documents, transcript turns and the source preview is drawn uncoloured, though highlight.js is a dependency.

- (a) marked-highlight 2.2.4, MIT, peer `marked >=4 <19`, calling oculus's `codeHtml`; the two copies of the token CSS (`Code.svelte:96-146`, `Editor.svelte:378-428`) become one stylesheet under `themes/`.
- (b) Keep uncoloured.

Recommendation: (a). Lazy option: (b).

### LA14. Terminal addons (`views/sessions/terminal/Terminal.svelte`; B C6)

xterm 6 is loaded with only the fit addon. VS Code's terminal has find and clickable links.

- (a) @xterm/addon-search 0.16.0, @xterm/addon-web-links 0.12.0 and @xterm/addon-unicode11 0.9.0, all MIT, 2026-08-30.
- (b) Keep.

Recommendation: (a). Lazy option: (b). The grid's font and selection colour come from no token today; that is booked (section D).

### LA15. Server helpers where a small library ends a defect or a table (E C3, C4, C10, C11; F 5, 10)

Each row is a separate ruling.

| Capability | Library | Recommendation | Lazy option |
|---|---|---|---|
| The Gmail reply's MIME message; the subject is not RFC 2047 encoded today (E C3) | nodemailer 10.0.10 MailComposer, MIT-0 | adopt: it ends the encoding defect | keep and hand-encode |
| Atomic writes; seven server writers call plain `writeFileSync` on files the reader owns (E C4) | write-file-atomic 8.0.0, ISC | adopt for the server writers; `bin/dispatch-note.mjs` keeps its own, since it runs by path with Node's modules only | keep |
| Image dimensions and EXIF orientation (E C10) | image-size 2.0.4, MIT | adopt | keep the parser |
| MIME types; the table misses types a manual can carry (E C11) | mime 4.1.0, MIT | adopt, the charset suffix kept for text | keep the table |
| Codex `config.toml` reading; the line scan misses dotted keys, inline tables and quoted headers (F 10) | smol-toml 1.9.0, BSD-3-Clause | adopt | keep the scan |
| Five copies of a debounce in the watchers (F 5) | perfect-debounce 2.1.0, MIT | adopt; the git watcher's throttle on its injected clock stays | one in-house helper |

## B. The open steps of plan.md (H)

### LA16. The language server client (D23; H 2.2, `editor-comparison.md`)

- (a) monaco-editor 0.57's native `lsp` namespace (`MonacoLspClient`, `WebSocketTransport`, 21 providers, push and pull diagnostics; in the package since 0.55 per its CHANGELOG). Oculus writes the per-root server spawn, the relay on its `ws` and the root URI the relay injects (the client sends `rootUri: null`), about 60 to 100 lines (estimate). Unproven against pyright and clangd; it syncs every model on the page, so diff originals and merge panes need URIs the server ignores.
- (b) monaco-languageclient 11.0.2 with vscode-ws-jsonrpc 4.0.2, both MIT, TypeFox, 2026-09-24; requires the @codingame packages (LA9 package (b)).
- (c) vscode-languageserver-protocol types with hand-written Monaco providers, 600 to 900 lines.

Recommendation: (a), the least code and no second Monaco build; (b) if the step's first proof against pyright fails. Lazy option: (c). pyright is not on PATH; the npm package `pyright` ships it.

### LA17. The debug client (D11; H 2.3)

- (a) @vscode/debugprotocol 1.68.0 types, Monaco's glyph margin for breakpoints, the Debug view by hand.
- (b) @codingame's debug service override: needs the `views` or `workbench` override, which takes over the page layout and breaks DESIGN.md's rule that the shell owns the layout.
- (c) All by hand.

Recommendation: (a). Lazy option: (c).

### LA18. Libraries for single steps (H 2.9 to 2.16)

| Step | Capability | Library | Recommendation |
|---|---|---|---|
| X3a | delete to trash | trash 10.1.1, MIT | adopt |
| X3a | file icons | seti-ui 1.11.0 (ruled) | the step reads the package's table before writing one |
| X3a | nesting patterns (`${capture}`) | none: picomatch and minimatch lack it | by hand |
| L4 | move and resize the floating pane on eight edges within the viewport | interactjs 1.10.28, MIT | adopt |
| A3 | scheduled runs, next run, catch-up | croner 10.0.1, MIT, no dependencies | adopt |
| D18 | process rows (pid, parent, user, start, CPU, memory, command) | systeminformation 5.33.13, MIT; the folder column by `lsof` | adopt |
| D14 | LaTeX outline, root and magic comments | latex-utensils 7.0.0, MIT; `texcount` and `chktex` as processes | adopt |
| E1 | the iframe message bridge, named in the design | penpal 8.0.1, MIT | name it in the design |

Lazy option in each row: the hand-built alternative.

### LA19. D15's premise (H 2.15)

D15 is ruled on the browser's own PDF viewer. That viewer does not report its page or a click position back to the page (not verified in a browser), so "position kept per file" and SyncTeX inverse search cannot be built on it.

- (a) pdfjs-dist 6.3.289, Apache-2.0, Mozilla, with `synctex` (on PATH) as a process: the page, zoom and click position are readable. A scope change of D15.
- (b) The built-in viewer as ruled, without position and SyncTeX.

Recommendation: (a). Lazy option: (b).

O30 (the native window) is a library choice by definition and is ruled at O30, after O19, as booked; H's lead is Electron 44.4.5.

### LA20. Line counts on the Status page (a new capability Axel asked for, 2026-09-26)

A table on the Status view of files, blank, comment and code lines per folder and language, with a TODO count, as cathedra's `build.py metrics` prints, written in no Python.

- (a) cloc 2.06 through the npm package `cloc` 2.6.0-cloc, GPL-2.0, released 2026-03-18: a Perl script run as a process (`/usr/bin/perl` is on macOS and Linux), `--json` output, knows TypeScript, Svelte, JavaScript, CSS and shell (`--show-lang`, run 2026-09-26). The server runs it over `git ls-files` per folder. Con: a GPL-2.0 package in oculus's dependency tree while R2 plans an MIT licence; it is run as a separate program, not linked.
- (b) scc 4.1.0, MIT or Unlicense, a Go binary installed with Homebrew: JSON output. Con: an external prerequisite every machine must install, checked at start.
- (c) sloc 0.3.2, MIT, last release 2024-02-06: no Svelte. It does not fit.
- (d) By hand over the one code reader of section D (the TypeScript scanner and `svelte/compiler`), about 150 lines (estimate).

Recommendation: (a), with the licence question Axel's to accept; (b) if a GPL package is not wanted. The TODO count is a grep over the same file list under every option. Lazy option: (d).

### LA21. Cmd+K inside the editor (`editor-comparison.md`)

Oculus opens its palette on Cmd+K (`workbench-keys.svelte.ts:88`, which ignores `defaultPrevented`); VS Code uses Cmd+K as the first key of chords (Cmd+K Cmd+C to comment, and others). Inside Monaco today Cmd+K is taken by Monaco.

- (a) Cmd+K opens the palette everywhere; Monaco's Cmd+K chords are removed with one `addKeybindingRules` null rule.
- (b) Inside the editor Cmd+K starts VS Code's chords; the palette opens by its other keys there.

Recommendation: (a): Cmd+K is a shell chord and the palette is reachable from every pane the same way. Lazy option: leave both bound, which lets Monaco take the key.

### LA22. A code theme separate from the app theme

Shiki (LA9 question 2) loads VS Code theme files as they are (`tokenColors` and `colors` are fields of `ThemeRegistrationRaw` in @shikijs/types 4.4.3) and ships 65, `dark-plus` and `light-plus` among them. Axel's VS Code settings set no `workbench.colorTheme`, so VS Code draws its default, whose syntax colours are Dark+.

- (a) A `code_theme:` key in `config/appearance.yml`: `tokens` (the syntax colours come from the oculus theme's `--c-code-*` tokens, as today) or the id of a Shiki theme, such as `dark-plus`; the editor background and chrome stay on the oculus tokens either way.
- (b) The syntax colours always come from the oculus theme.

Recommendation: (a), default `tokens`, since it gives Axel VS Code's own syntax colours without a seventeenth app theme. The key name and its values are Axel's to rule. Lazy option: (b).

## Totals

What oculus has, `cloc` 2.06 over `git ls-files` per folder on main (2026-09-26):

| Folder | Files | Code | Comment | Blank | All lines |
|---|---|---|---|---|---|
| src | 601 | 75,084 | 20,248 | 8,890 | 104,222 |
| bin | 18 | 2,945 | 1,174 | 279 | 4,398 |
| tests | 438 | 94,374 | 10,415 | 10,560 | 115,349 |
| Total | 1,057 | 172,403 | 31,837 | 19,729 | 223,969 |

What the recommendations remove from that, in all lines as `wc -l` counts them, from the auditors' estimates (midpoints where a range was given; none measured):

| Item | Lines removed (estimate) |
|---|---|
| LA1 bits-ui | 900 |
| LA2 fuzzysort and the Command list | 135 |
| LA5 culori | 110 |
| LA6 svelte-query | 1,000 |
| LA7 zod, net of 60 lines of glue | 415 |
| LA8 node-diff3 | 90 |
| LA9 Monaco (source tab, diff pane, gutter), net of a 100-line wrapper | 1,450 |
| LA10 viz-js layout (d3-force fallback: 90) | 330 |
| LA11 dependency-cruiser, net | 220 |
| LA12 jscpd, net | 90 |
| LA13 one token stylesheet for code | 50 |
| LA15 the six server helpers | 290 |
| Section D, existing dependencies and built-ins | 700 |
| Total | about 5,780 |

Tests are not in those figures. The test files that exercise the code a library replaces, counted with `grep -rlE <module paths> tests` and `wc -l` on main (whole files, so an upper bound on what is touched; how much of each goes and how much is rewritten against the library is not estimated; X3b's own tests are not on main and are not counted): LA1 17 files, 6,875 lines; LA2 5 files, 1,297; LA5 6 files, 2,094; LA6 21 files, 9,017; LA9 7 files, 1,911; LA10 2 files, 961; LA11 6 files, 2,092; LA15 images 1 file, 532.

That is about 2.6% of the 223,969 lines, or about 5.3% of the 108,620 lines of `src` and `bin`. LA3, LA4, LA13 and LA14 add capabilities oculus lacks and remove little. The open steps are not in the totals, since their code is not written yet; the libraries recommended for them avoid, by the auditors' estimates, 600 to 900 lines in D23, 300 to 500 in X3a, 150 to 250 in L4 and 150 to 250 in D11.

## C. Capabilities where every auditor recommends keeping the code

Each row is Axel's to overrule. The reason names what the candidates lack.

| Capability | Candidates checked | Why keep |
|---|---|---|
| Tab and pane layout, pages, page leaves (`shell/panes`, `ui/tabs`, `state/workbench/layout`, about 5,700 lines) | dockview 8.3.1, golden-layout, flexlayout-react, lumino, paneforge | no candidate has nested pages; dockview has no maintained Svelte binding and puts pinned and multi-row tabs in its paid edition |
| Drag and drop | pragmatic-drag-and-drop 4.0.0, svelte-dnd-action | about 120 lines saved; the edge and index rules stay |
| Keyboard chords | tinykeys and others | about 50 lines saved, glue of similar size |
| WebSocket client and server | partysocket, reconnecting-websocket; `ws` already used | the rest is the wire protocol |
| Forms and drafts | sveltekit-superforms, felte, @sjsf/form | none keeps drafts per tab or reads the YAML schema |
| Text catalog | i18next, paraglide, svelte-i18n | the catalog is pushed live; paraglide compiles at build |
| Dates | date-fns, dayjs | the words come from the catalog; duplicates are consolidated (section D) |
| Git runner and parsing | simple-git 4.0.2, isomorphic-git, nodegit | simple-git's `raw()` and force options defeat the one-call-site exact-list guarantee (DESIGN.md:128) |
| Commit graph lanes | @gitgraph/js (archived) | no maintained library lays out `git log` rows |
| File watching | @parcel/watcher, chokidar 5 | the stale-event filter, polling and throttle stay either way |
| Terminal protocol (tmux control mode) | node-pty | changes where scrollback lives |
| SSH and SLURM | ssh2, node-ssh | neither reads `~/.ssh/config` |
| Process liveness | ps-list, pidusage | turns a synchronous scan async; the stamp parser stays |
| Subprocess running | execa, tinyexec | about 35 lines; a second process API beside the gated one |
| JSONL transcript reading | stream-json, split2 | no byte-offset resume |
| OAuth and provider readers | arctic, oauth4webapi, googleapis, Graph SDK | lose the redaction the "no token logged" rule needs |
| ETag and front matter | etag, gray-matter | nothing added; a second YAML parser |
| revert-check | Stryker | no hand-written mutation, no Playwright runner, no per-case verdict |
| Size and comment-width checks | eslint `max-lines`, `@stylistic/max-len` | no ratchet, no shell or CSS coverage |
| Locks in dispatch-note | proper-lockfile (last release 2021) | no pid and start-time liveness |
| Slides, calendar, photo overlay | reveal.js, @event-calendar/core, PhotoSwipe | each takes the DOM from the pane for under 50 lines |
| Theme CSS parsing, toasts, sortable table, the tree of Files | culori's parse, svelte-sonner, tanstack table | glue about as large as the code |

## D. Fixes that use what oculus already has (booked as Q79, no ruling needed)

No new dependency: each uses a built-in, or a dependency already in `package.json`.

- `@sveltejs/kit`'s `json()` in place of the hand JSON responses (`grep -rln "new Response(JSON.stringify" src` lists 21 files).
- One `/api/` origin guard in `hooks.server.ts` `handle` in place of `sameOrigin(` in 23 files, and the two differing `sameOrigin` rules reconciled.
- Config read one way (`locals.config()`), not three.
- The three overlays that declare `aria-modal="true"` without trapping focus (`KeySheet.svelte:20`, `UpdateTray.svelte:124`, `Palette.svelte:202`), and the palette's `aria-activedescendant`, unless LA1 and LA2 replace them.
- `svelte/no-restricted-html-elements` (eslint-plugin-svelte, installed) in place of X3b's `controls.test.ts`.
- `isDeepStrictEqual` for the deep-equality code, `TextDecoder` for the text sniff, `util.parseArgs` in `bin/` and `root/args.ts`, `fs.globSync` for the 25 test walkers and the transcript walkers, `util.stripVTControlCharacters` and `timers/promises` in `usage/refresh.ts`.
- marked's `walkTokens` in place of the image renderer override; the Help view reading marked's tokens, not re-parsing its HTML with regexes; `hljs.getLanguage` before the 11-entry override table.
- `yaml` `stringify` in `bin/migrations/migrate-joint-work.mjs`, which writes YAML that fails to parse on a value holding a line break.
- The TypeScript scanner and `svelte/compiler` as the one code reader for the checks; `duplication.test.ts` stops cutting lines at `//` inside strings.
- vitest `test.extend` scratch fixtures in place of `afterAll(sweepScratch)` in 110 files, and the 131 redundant tmpdir assertions dropped.
- The seven `isRecord` copies to `isMap`; one `inside`; one `parseBranches`; one porcelain parser; one path helper; one `ago`; one local-date helper.
- `hpc.svelte.ts:33` passes a literal `'s'` plural; a catalog key per count.
- The terminal's font and selection colour from tokens; the HPC views' markup one element per line (`spec.md:47`); the unused highlight.js in Config.

X3b's `git-index.ts` `unquote` misreads git's octal-quoted paths (`caf\303\251.txt`); it is X3b's own file and is fixed at X3b's landing.
