# Step D36 brief check (on main at 0e9bde803)

The brief checked: `tools/oculus/.scratch/migration/agents/briefs/D36.md`. Main moved while the check ran (2ec83cd31, 833c5932f, 0e9bde803 are ledger bookings). `git diff --stat 884716764 HEAD -- tools/oculus ':!tools/oculus/.scratch'` printed nothing, so the oculus tree the brief describes has not changed. Scratch runs were made under `$TMPDIR` only (`d36chk.*`, `d36ruff.*`). Nothing in the repository was changed.

## 1. Names

- `onPath`: `git grep -n "onPath" -- tools/oculus ':!.scratch'` finds `src/lib/server/machine/pty/latex/latex.ts:40` (import from `content/latex/recipes.ts`) and `:213`. That file is not in the paths list. Moving `onPath` to `server/core/program.ts` breaks this import.
- `tools.ts`: `git grep -n "tools\.ts"` finds `src/lib/server/content/latex/synctex.ts:6`, a head comment that says "under the time limit every LaTeX program has (tools.ts)". `synctex.ts` is on the paths list only for its import of `run`, and the head-comment list ("What is on the tree") leaves it out. The comment stops being true once `run` and its time limit move to `program.ts`.
- `EditorStatus`: `git grep -n "EditorStatus\b" -- src tests` finds `src/lib/views/sources/repositories/diff/Diff.svelte:333-344`, which builds an `EditorStatus` literal with `served: null`. That file is not in the paths. Adding a required linters field (item 5) breaks it. `source-status.svelte.ts` only passes the value along.
- The status item (`LanguageItems`): `src/lib/shell/status/status-items.ts:44-58` (`RIGHT_ITEMS`, which feeds `shown(id)` and the hide menu), the head comment at `:9-11`, `config/catalogs/glyphs.yml:233-236` and `config/catalogs/icons.yml:232-235` hold one entry per item. A new lint item needs an entry in each. None of these files is in the paths.
- The settings reader (`latexFormatting` is the model): `src/lib/data/sources/config.ts:85` re-exports the readers, and `src/lib/server/root/context.ts:241` runs `openSettings, latexFormatting, latexBuild` at start. Neither file is in the paths.
- The held ESLint object: the brief's Conventions say it is created by the server context and passed in. The server context's objects live in `src/lib/server/root/context.ts` (it creates the relay at `:247` and the debug session) and are typed in `src/lib/server/root/process/server-context.ts:39-45`. A route reaches them through `locals.server`, as `src/routes/api/(machine)/debug/+server.ts` does. Neither file is in the paths.
- `postWithToken`: `src/lib/state/shared/stores/token-post.ts:11-25` takes no `AbortSignal`, so the lint store's `AbortController` (item 3) cannot reach the fetch. The file is not in the paths.
- `command-marks.svelte.ts` and `commandMarks`: outside the paths, the only hits are ledger history under `.scratch` (left as it is) and `DESIGN.md:476` (in the paths).
- `markerOf`: a second `markerOf` is in `ui/controls/editor/kit/latex/latex-widget.ts:65`. It is a separate function and the change does not affect it.
- `COMMAND_OWNER`, `Problem`: `problems.svelte.ts:31` is in the paths. `problem-rows.ts` and `Problems.svelte` read `Problem`, and optional fields leave them true.
- "no lint panel": `git grep -n "lint panel\|linter\|linting" -- DESIGN.md HELP.md README.md docs config src` finds only `DESIGN.md:23` and `problems.svelte.ts:7` ("a later source (a linter, ...)", which stays true).
- `DESIGN.md:166`, `:476`, `HELP.md:118`, `docs/views.md:81`, `docs/configuration.md:13`: all are in the paths.
- `README.md:26` is about `npm run lint` and stays true.

Findings:
- **F1**, paths: `src/lib/server/machine/pty/latex/latex.ts` (the import of `onPath`) is missing. Fix: add it to "Paths this step writes" and to item 1's importer list.
- **F2**, head comments: `synctex.ts:6` "(tools.ts)" is missing from the head-comment list. The `approvals.ts` head comment's "There are four kinds of key" (`:6-7`) also becomes false, and the list cites only `approvals.ts:11-14`. Fix: name both places.
- **F3**, paths: `Diff.svelte` is missing. Fix: add it, or say the new `EditorStatus` field is optional.
- **F4**, paths: `shell/status/status-items.ts`, `config/catalogs/glyphs.yml` and `config/catalogs/icons.yml` are missing for the new status item. Fix: add them, and give the item's id and its `item_<id>` word in `statusbar.yml`.
- **F5**, paths: `src/lib/server/root/context.ts`, `src/lib/server/root/process/server-context.ts` and `src/lib/data/sources/config.ts` are missing. G61's Code line names `server/root/context.ts`, so its test `tests/server/root/config-cache.test.ts` must also run. Fix: add the three files, and add G61's test to Verify item 3.

## 2. The step line

The line now reads, at `plan.md:635`: "D36 linters as VS Code's: ... after D33 (ruling Z196) (ruling Z729)".

- "each language's linter run as a process on save": items 1, 2 and 3 (`saved`). ESLint becomes a held child process under O1 (c), ruled as Z729.
- "ChkTeX for LaTeX", "ruff for Python", "eslint for TypeScript and Svelte", "shellcheck for shell": item 2 (`linters.ts`, `readers.ts`, `eslint.ts`) with O8. JavaScript is added under O8.
- "their results as marks in the editor": item 4.
- "rows in D33's Problems view": item 3 (`lintProblems`).
- "`DESIGN.md:23`'s 'no lint panel' rewritten": item 7.
- "after D33": D33 is on main as b081d9da4.
- Ruling Z196 (ChkTeX included, the exclusion lifted): item 2 and item 7.

Findings:
- **F8**, the parity table: three rows are missing.
  - VS Code's Problems view draws a row's code as a link. The brief adds `href` to `Problem`, but only the marker draws it, and `problem-rows.ts` and `Problems.svelte` are not in the paths.
  - LaTeX Workshop's ChkTeX code actions are listed under "What VS Code's linting extensions do" ("a code action provider offers fixes for some warnings"), while item 2 says "ChkTeX gives none".
  - ESLint's "Disable <rule> for the entire file" is not listed.

  Fix: give each a built or left-out row with its reason. If the Problems view's link is built, add those two files to the paths.

## 3. Premises

These hold as the brief states them:
- The save path: `source.svelte.ts` is 725 lines, with `saveSourceDraft` at :542, `performSave` at :561, `postSave` at :681-690, `saved(...)` at :689 and `saveSource` at :694. Its callers are `Timeline.svelte:229` and `context.ts:726`.
- `context.ts` is 855 lines. The save hook is at :483-489, `servedRoots` at :421, the registrations at :684-686, and the comment at :640-643.
- `builds.ts:605-620` uses the `saves` counter.
- `problems.svelte.ts` is 317 lines. Its head comment is :5-9, `Problem` is :24-43, the owner comment :29-33, `ProblemSource` :46, `createProblems` :285 and `register` :290-295.
- `problem-sources.ts` is 123 lines, with the three sources at :45, :78 and :110 and the owners at :18-19.
- `command-marks.svelte.ts` is 66 lines. `markerOf` is :17-40, the severity mapping :31-32, the markers :54-58 and the teardown :61-64.
- `extension.ts` is 63 lines, with `commands?` at :29 and the composition at :45-49. `tab-language.svelte.ts` is 89 lines, with `commands:` at :73-74.
- `markers.ts`: `toMarkers` :33-70, the code link :38-46, the severities :19-30. `client.ts:355` is the only code action provider.
- `tools.ts` is 83 lines: `TOOL_TIMEOUT_MS` :16, the output limit :19, `run` :32-66, and failure read from stderr at :49-59. Its callers are `endpoint.ts:52`, `synctex.ts:21` and `texdoc.ts:11`, and no test imports it.
- `recipes.ts`: `onPath` :241-246, `TEXLIVE_PACKAGES` :59, `BREW_FORMULAE` :72.
- `LanguageItems.svelte` is 200 lines, mounted at `SourceItems.svelte:176`. `editor-status.svelte.ts` is 180 lines, and `tab-asks.svelte.ts` has `served` at :58 and :145.
- `statusbar.yml`: `ls_not_found` :105, `ls_tip_not_found` :112. `behavior.yml`: `latex:` :139-178, path keys :147-154. `settings.ts` is 803 lines, with `latexFormatting` at :526-541.
- The folder counts all reproduce: machine 10, runs 3, core 9, content/latex 10, (machine) 5, state/system 10, state/system/machine 6, language 7, data/model 10, config/text 7.
- The import order is at `order.ts:48-57`. `.agents/plan.yaml:8` has `standards: []` and `:15` has `libraries: check`.
- `package.json:39` names eslint `^10.10.0`, and the installed ESLint is v10.10.0. The formatters folder holds `json-with-metadata.js`.
- `chktex` is at the path the brief gives, v1.7.9. `ruff` is 0.16.5. `shellcheck` is not found. officium has its own ESLint.
- The hub counts reproduce exactly: 235, 807, 1236, 381, 1598, 237 and 229. The only tracked linter configs are `projects/ideas/engram/code/pyproject.toml` and `tools/oculus/eslint.config.js`.
- ChkTeX on a scratch file prints rows 12 and 2 at 3:9 and row 18 at 3:29, exit 2. `-e9` gives exit 3. A missing file gives exit 0 with `Unable to open` on stderr. A tab is counted as 8 columns (17 for character 10) and `é` as 2 bytes. Standard input with `-p` works. A literal `\n` in the format is printed as is.
- LaTeX Workshop 10.19.0 has `exec.args ["-wall","-n22","-n30","-e16","-q"]`, `linting.run onSave`, `chktex.enabled false`, the `.tex .bbx .cbx .dtx` filter (`chktex.js:307`) and `typesetting` mapped to Information (`:321`).
- ruff: F401 at 1:8-1:10 with url `.../unused-import`, exit 1. E902 for a missing file. F821. With `--no-cache`, no `.ruff_cache` is written. I001 fires with no project config.

Findings:
- **F9**, `plan.md` line numbers: the ledger moved after the brief was written. D36 is now at `:635` (not 632), D40 at `:537`, the 2026-09-13 ruling at `:815`, and Z196 at `:1015`. The line now ends "(ruling Z729)" and has a Step 0 sub-bullet, against the brief's "The line has no sub-bullets (the next line, plan.md:633, is D34's removal)". Fix: cite the ledger by step and ruling id instead of line number, and quote the line as it now reads.
- **F10**, ruff's syntax-error rows: the brief says "a row with no code (a syntax error) error". In ruff 0.16.5 such a row has `"code": "invalid-syntax"`, `"name": "invalid-syntax"`, `"url": null`, `"noqa_row": null`. The command was `ruff check --output-format json --no-cache s.py` on `def f(:`. A reader that follows the brief maps it to a warning. Fix: map `invalid-syntax` (and `E902`, `F821`) to error, accept a `url` of `null` in the schema, and offer no "Disable" or "Show documentation" for it, nor for an ESLint `fatal` row, whose `ruleId` is `null` (seen on `let x = ;`).
- **F11**, how lint rows leave with a root (Decision 4 and item 3): "as `commandProblems` maps by `served()`" is not how rows leave with a root. They leave through `watchServedRoots` with `commands.forgetOutside` and `latex.forgetOutside` (`context.ts:630-639`). `DESIGN.md:476` describes that mechanism ("in the stores' own state ... real folder compared"), and G69 guards it. A filter on `served()` drops every lint row while the workspaces load or fail, because `fs.roots()` is `currentWorkspace(workspaces()).roots` (`fs.svelte.ts:524-526`), and it compares keys, not real folders. Fix: have the lint store take a `forgetOutside(roots)` called from the same `watchServedRoots` callback, and say in the brief how this relates to G69. Otherwise the brief contradicts `DESIGN.md:476`, which under `agents/spec.md` "Read first" is a stop.
- **F6**, cancelling a run: "The request's own abort signal stops the run" (item 2, `routes.ts`; Decision 5; case 9) does not hold on this tree. In `@sveltejs/kit` 2.70.3, `node_modules/@sveltejs/kit/src/exports/node/index.js:137-146` aborts `request.signal` only when the request closes before its body has ended. A lint POST whose JSON was read never aborts. On top of that, `postWithToken` takes no signal. Fix: stop a superseded run on the server, keyed by root, path and linter (a new lint of the same file and linter kills the one in flight, as LaTeX Workshop's `linterProcess?.kill()` does), keep the client's counter for late answers, and drop the claim about the request signal. Otherwise add `token-post.ts` to the paths and verify the abort on `vite dev` and on the built server.
- **F12**, lines shared with D43: the list of what D43 also writes (line 247) is incomplete. D43's brief, now on disk, writes these as well:
  - `recipes.ts:236-246`, the same lines D36 moves `onPath` and `runnable` out of
  - `DESIGN.md:23`
  - `extension.ts`, `tab-language.svelte.ts`, `LanguageItems.svelte:80-95`
  - `settings.ts`, `server/root/context.ts:247-259`, `pty/latex/latex.ts`
  - `behavior.yml:139-178`, `config/text/views/academic/latex.yml`

  Fix: list every shared path in the brief, for the orchestrator's merge judgment. The overlap at `recipes.ts:236-246` is not a simple merge.

## 4. Cases and checks

Consistent with `agents/spec.md` (Where you work, What every package obeys): cases 1, 2, 4 to 21, 24 to 29. Each is checked by a node run, a reading or the look, and needs no page run by the builder.

Findings:
- **F13**, cases 3 and 22: each says "after the hub's ESLint configuration is approved". Without a named scratch approvals file, the builder's run writes Axel's `~/.oculus/approvals.json`. Fix: tell the builder to call `handleLint` with an approvals path under the session scratchpad, and never to write `~/.oculus`.
- **F14**, case 23: it names "a TypeScript file under no `eslint.config.*` (`tools/cockpit`)". `git ls-files tools/cockpit | grep -E "\.(ts|tsx|mts|cts|svelte)$" | wc -l` prints 0; the folder holds 14 `.js` files, and no TypeScript file outside `tools/oculus` is tracked. Fix: name a `.js` file of `tools/cockpit`, or a scratch `.ts` file.
- **F7**, case 30 and the paths' test line: a wrong value falls under G13, and G13's Test line names `settings.ts`: `tests/data/sources/config/settings.test.ts`, "one case per setting reader". By `agents/spec.md` ("An entry keeps one test per unit it covers"), the new lint reader needs a case there whatever O6 rules. The brief allows only "the tests O6's ruling names" and leaves `settings.test.ts` out of Verify item 3. Fix: add `tests/data/sources/config/settings.test.ts` to the paths and to Verify item 3, with one case for the `lint.*` reader.
- **F17**, Verify item 3: `approvals.ts` is named in the Code lines of G31, G38 and G55, and `src/lib/data/model/` in G32's. The brief runs G55's test only "once O6 is closed" and does not name G31, G32 or G38. By `agents/spec.md` ("A step whose change touches an entry's code runs that entry's test"), these run whatever O6 rules. Fix: add `tests/server/machine/approvals/approvals.test.ts` (G31), `tests/routes/sessions/compose.test.ts` (G38), `tests/server/machine/lsp/svelte-trust.test.ts` (G55, slow, run alone) and G32's test of the model file the step changes.
- **F15**, "Ids and keys": it asks the builder to confirm "D43's `latexmkrc:` unchanged". That kind is not on the tree, so the builder cannot check it. Fix: drop it from the builder's checks, and leave it to the orchestrator at landing.
- **F16**, case 2: it gives the line but not the file. Rows "at line 3" need a file whose line 3 is that line. Fix: give the four-line file (`\documentclass{article}`, `\begin{document}`, the line, `\end{document}`).
- **F23**, the worktree: the brief does not name the worktree (`.agents/worktrees/D36`), and the base copy's `git archive` leaves out `DESIGN.md`, `HELP.md` and `docs/`, which the step writes. The builder therefore cannot `diff -rq` them as `agents/spec.md` ("Where you work") requires. Fix: name the worktree, and add those paths to the base copy.

## 5. The question

Holds: cases 1 to 3 for rows, 4, 5, 7, 8, 10, 12, 13, 15, 16, 18 to 21, 23 to 28 and 30. Each needs the behaviour it names, run or read on the changed code.

These could pass without the goal being reached:
- **F6**, case 9: a node run that hands `handleLint` an aborted `AbortSignal` passes, while the real route never aborts (see section 3).
- **F18**, item 4 and case 1: item 4 only asks `markerOf` to map `info` and draw `href`. Today it marks the word at the column and ignores `endLine` and `endColumn`. Case 1 passes by chance, because `os` is a word. An ESLint range over several lines, or a ChkTeX column plus length, would be drawn wrong. Fix: require that a row naming an end draws exactly that range, and that only a row without one falls back to the word.
- **F19**, item 2 (`eslint.ts`): "shipped so that it runs from the built server and from the desktop app as from `vite dev`" has no case and no check. A child program found only under `vite dev` passes every case. Fix: add a case that runs the child from `npm run build`'s server (node over `build/`), with its path resolution named in the brief (for example `ownFolder()` from `servers.ts:276` plus a fixed path to an `.mjs` file). Also say that the child keeps its ESLint instance in function scope rather than in a module variable, under "No globals".
- **F20**, item 3 and item 5: the lint state is kept "per root and linter". Under the hub root, a `tools/cockpit` file (`no_config`) and a `tools/oculus` file (`ok`) overwrite one ESLint state, so a tab's status item shows another file's state. Fix: keep the state per file and linter (or per repository and linter), and have the status item read the state of its own tab's file.
- **F21**, item 5: "one item per linter of the tab's language" draws a ShellCheck item for a `.zsh` tab and a ChkTeX item for a `.bib`, `.sty` or `.cls` tab (all `bash` or `latex` in `config/sources.yml:105,111`), though under O8 those files are never linted. Fix: "one item per linter that takes the tab's file (O8)". Add the status bar to case 24.
- **F22**, item 2 (the ESLint approval): it dictates `isEslintConfigApproved`, `approveEslintConfig` and `revokeEslintConfig` "written as the `svelte-config:` ones are". That makes a second copy of `configKey`, `approveConfig` and `revokeConfig` (`approvals.ts:208-250`), against `agents/spec.md` ("a parser, a fold or a rule exists once") and G21. D43 adds a third with `latexmkrc:`. Fix: give those functions a key kind as a parameter, rather than copying them.

The hub's rules, as written in the brief:
- Every user-facing string from a catalog: kept in Conventions. It is incomplete only for the status item's name and glyph catalogs (F4).
- No module-level mutable state: kept for the server and the client. It is unstated for the child program (F19), and its paths miss the server context (F5).
- Layer boundaries: hold as described. The shell reads `EditorStatus`, `views/` draws the marks, `ui/` is unchanged.
- Folder and size limits: the counts reproduce. `context.ts` at 855 has room for the store and a registration. `settings.ts` at 803 has room for one reader. `approvals.ts` is 316 and `LanguageItems.svelte` 200.
- Paths coverage: incomplete. See F1, F3, F4, F5, F6 and F7. The palette files, the catalog folder `config/text/` and the diagrams are covered.

## 6. Implied inputs

Missing from "Cases", each with the result it should have:
- **F24**, ruff `noqa_row`: a finding inside a multi-line string. `E501` at row 2 reports `noqa_row` 3 (scratch run over `x = """`, a long line, `"""`). Expected: "Disable" adds `# noqa: E501` at `noqa_row`, never inside the string. Item 4 and case 26 must say `noqa_row`.
- **F25**, column units: on the line `s = "<U+1F600>"; import os`, ruff puts F401 at column 17, counted in code points, while Monaco counts UTF-16 units (18). Expected: ruff's columns and fix edits are converted to UTF-16. The same holds for ESLint fix offsets on a CRLF or BOM file. Add a case for each.
- **F26**, output past the limit: a linter whose output passes `MAX_OUTPUT` (16 MiB, `tools.ts:19`) is killed by `execFile`, and with `killed` true it reads as `timeout` (`tools.ts:55`). Expected: a state that says the output was too large, or `failed`, never `timed out`.
- **F27**, ChkTeX and a file name containing `:` (legal on macOS): the format `%f:%l:%c:...` no longer splits correctly. Expected: rows read from the right, or without `%f`.
- **F28**, an existing suppression on the line or the line above (`# noqa: E501`, `% chktex 12`, an `eslint-disable-next-line` above): expected, the new code is merged into it rather than added as a second comment.
- **F29**, comment syntax by place: an ESLint finding in a `.svelte` file's markup needs `<!-- eslint-disable-next-line rule -->`, not `//`. A ShellCheck directive above the second line of a `\`-continued command breaks the command. Expected: a comment that is valid at that place, or no Disable action offered.
- **F30**, one file under two nested served roots: today expected to give two lints and duplicate rows under two keys. Expected: one row set for the file, as D33's mapping to the deepest root does.
- **F31**, a clean tab whose file changes on disk (a git checkout, an `lsp-edit` rename across files, a write route): no lint runs, so the rows go stale. Expected: lint again when a clean tab's text is reloaded from disk.
- **F32**, inputs the prompt named:
  - a repository with only a flat `.eslintrc`: expected `no_config` and no item
  - a symlinked file inside the root: linted as its target; a symlink out of the root is refused under G2
  - a root or file path with spaces: one argument, including `-l <.chktexrc>`
  - a very large file
- **F37**, ruff's failure reason: ruff's first stderr line on a broken `pyproject.toml` is "ruff failed", and the cause is on the next `Cause:` line (scratch run, exit 2). Case 13's "first stderr line as its reason" therefore shows nothing useful. Expected: for ruff, the first `Cause:` line.

## 7. ADRs

- `.agents/plan.yaml` names no `adr` folder. `ls tools/oculus/docs/adr` and `ls docs/adr` each print "No such file or directory". There is no record, and the brief says so.

Findings: none.

## 8. Dictated text

These hold against `agents/spec.md` (Prose, the catalog rule):
- "Fix this <rule> problem", "Apply fix for SC<n>", "Disable <code> for this line", "Show documentation for <code>", "<Linter>: Fix All Auto-fixable Problems" (`grep -n "Fix this\|Apply fix for\|Disable <code>\|Show documentation\|Fix All Auto" D36.md`, line 112): hold, each as a catalog line.
- `% chktex <n>`, `# shellcheck disable=SC<n>`, `// eslint-disable-next-line <rule>` (line 112): hold as forms, with their placement under F24 and F29.
- `eslint-config:<sha256 hex>` and `:eslint-config` (`grep -n "eslint-config" D36.md`): hold.
- The owners `lint-<id>`, the section "Linting", the heading `editor`, the guide section "Linters", and the answer states `not_found`, `failed`, `timeout`, `not_approved`, `no_config`, `off` (lines 97, 109, 116, 118): hold.
- "It comes with TeX Live and MacTeX: tlmgr install chktex" (line 114): holds. It matches `latex.yml`'s `refused_program_texlive` wording.
- "Approve the repository's ESLint configuration in :eslint-config" (line 114): holds.

Findings:
- **F34**, the on/off keys: `grep -n "each \`on\` or \`off\`" D36.md` (line 116) dictates `lint.chktex: on`, `lint.ruff: on` and so on. No key in `config/*.yml` uses `on` or `off` (`grep -nE ":\s+(on|off)\s*$" config/*.yml` prints nothing), and the 22 toggles of `options.yml` are `true` and `false`. A YAML 1.1 parser, such as PyYAML in Verify item 5, reads `on` as `True`. Fix: `true`/`false` with `control: toggle`. This is a user-visible shape closed under O3, so the orchestrator decides whether to change it.
- **F35**, the linters' names: `grep -n "ESLint: not approved\|shellcheck: not found\|<Linter>\|\`eslint\`, \`shellcheck\`" D36.md` (lines 109, 112, 114, 163) shows each linter under several names. The sources are `eslint` and `shellcheck`, the status bar reads `ESLint: not approved` but `shellcheck: not found`, and the palette uses "<Linter>:". This breaks the one-name rule under Prose ("No synonym cycling"). Fix: one table in item 5 with each linter's display name for the status bar and the palette (ChkTeX, Ruff, ESLint, ShellCheck), keeping the VS Code source names only for the Problems source column, and case 12 changed to match.
- **F36**, the not-found tooltips: `grep -n "brew install shellcheck\|tlmgr install chktex\|lint.ruff_path" D36.md` (line 114). Ruff's tooltip names `lint.ruff_path`, but ChkTeX's and ShellCheck's do not name `lint.chktex_path` and `lint.shellcheck_path`, while the existing words always name the path key (`refused_tex_fmt_missing`, `refused_latexindent_missing`). The ShellCheck text is also only a fragment. Item 5 also says the names are "taken from `BREW_FORMULAE` and `TEXLIVE_PACKAGES`". Those tables are private constants of `recipes.ts` (`:59`, `:72`), whose write range in the paths is only `:230-246`, and they hold no `ruff`, `shellcheck` or `chktex` entry. Fix: write each tooltip in full with its path key, and either write the names into the catalog lines or widen `recipes.ts`'s range and export the tables.

## Declined to judge

- O6 (open item 12). It is Axel's ruling. The brief was judged around its recommendation (a).
- Whether a held ESLint child, which runs a repository's configuration in the background after approval, fits `DESIGN.md:166`'s rule that a process of repository text runs in a visible pane. The brief extends the Svelte server's precedent and rewrites `:166`. That is a design call ruled under O2, not a fact a read settles.
- The VS Code extension facts for Ruff, ESLint and ShellCheck. Only LaTeX Workshop is installed (`ls ~/.vscode/extensions`), so they were not verified. ShellCheck's behaviour was not run (it is not installed).
- The ESLint timings of 17.08 s and 6.98 s were not rerun. One unconfigured `.mjs` file took 14.8 s real here (`time eslint --format json utils/diagrams/diagrams.mjs`). Where the user-level ruff configuration lives was not found (`~/.config/ruff` and `~/Library/Application Support/ruff` are absent).

Agent usage: ab66036bc6fe3c58d, claude-opus-5-5, 275,056 tokens, 102 tool uses, 15.1 min (completion notice).

## Closed

Closed by the orchestrating session in `agents/briefs/D36.md`, on main at fbc434269. The report numbers its findings F1 to F37 and holds no F33; the other 36 are closed below.

- F1: item 1 and the path list name `server/machine/pty/latex/latex.ts` (its import at :40); D43's `programPath` moves with `onPath`.
- F2: the head-comment list names `synctex.ts:6` and `approvals.ts:6-7`; item 1 and item 2 rewrite them.
- F3: item 5 makes the `EditorStatus` field optional; `Diff.svelte` is read, unchanged.
- F4: item 5 gives the id `linter`, `statusbar.item_linter: Linters`, the glyph and the icon; the path list adds `status-items.ts`, `glyphs.yml`, `icons.yml`.
- F5: item 2 and the path list add `server/root/context.ts`, `server-context.ts` and `data/sources/config.ts`; Verify item 3 runs G61's test.
- F6: item 2 stops a superseded run on the server, keyed by root, path and linter; the page keeps its counter; the request-signal claim is gone (decision 5); case 9 runs it.
- F7: `settings.test.ts` gains the `lint.*` reader's case (item 6, case 30, Verify item 3, the path list).
- F8: the parity table adds the three rows, all built; item 2 lists LaTeX Workshop 10.19.0's ChkTeX fixes (`latex-code-actions.js:43-64`); item 4 adds ESLint's file-wide Disable; item 3 and the path list add `problem-rows.ts` and `Problems.svelte`.
- F9: the ledger is cited by step and ruling id; the step line is quoted as it reads now.
- F10: item 2 maps `invalid-syntax`, `E902` and `F821` to error, accepts a null `url`, and offers no Disable or Show documentation for a row with no rule; case 4c.
- F11: item 3 adds `forgetOutside(roots)` in the `watchServedRoots` callback; decision 4 and case 7 follow; G69's test runs in Verify.
- F12: "Shared with the steps in flight" lists every path shared with D43; D43 first, D36's base after it (Z733).
- F13: the Cases paragraph and cases 3 and 22 name an approvals file under the session scratchpad passed to `handleLint`.
- F14: case 23 names a `.js` file of `tools/cockpit`.
- F15: the `latexmkrc:` check is the orchestrator's at landing.
- F16: case 2 gives the four-line file.
- F17: Verify item 3 runs G31's, G38's, G55's and G32's tests.
- F18: item 4 draws a row's own range; case 4a.
- F19: item 2 names `eslint-child.mjs` resolved under `ownFolder()` and the instance in function scope; the built-server run is part of case 3.
- F20: item 3 keeps the state per file and linter; item 5 reads its own tab's file.
- F21: item 5 draws an item per linter that takes the tab's file; case 24 includes the status bar.
- F22: item 2 makes `configKey`, `approveConfig` and `revokeConfig` take the kind, D43's copy folded in.
- F23: the worktree is named and the base copy adds `DESIGN.md`, `HELP.md` and `docs`.
- F24: item 4 and case 26 use `noqa_row`.
- F25: item 2 converts ruff's columns to UTF-16 and takes ESLint's offsets over the text as read; case 4b.
- F26: item 1 adds the `overflow` answer, read as `failed` with `too_large`; case 13a and the tooltip.
- F27: item 2 drops `%f` from ChkTeX's format; case 24a.
- F28: item 4 merges into an existing suppression; case 26.
- F29: item 4 places each comment where it is valid; case 26.
- F30: item 2 lints once under the deepest root; case 7a.
- F31: item 3 lints a reloaded clean tab again; case 8.
- F32: cases 23 (flat `.eslintrc`), 24a (symbolic links, spaces, a `:` in a name) and 31 (a very large file).
- F34: item 6 and O3 take `true` and `false` with `control: toggle` (Z733).
- F35: item 5 names each linter once (ChkTeX, Ruff, ESLint, ShellCheck), the VS Code names kept for the source column; case 12 follows.
- F36: item 5 writes each tooltip in full with its path key and install command; `recipes.ts`'s tables are not read.
- F37: item 2 reads ruff's first `Cause:` line; case 13.

O6 is rewritten to Axel's ruling (a), open item 12, with the test files named in the Cases paragraph.

Dictated lines held, each ASCII with no dash: `item_linter: Linters`; the seven `lint_*` status words and tooltips of item 5; the Disable comment forms of item 4.
