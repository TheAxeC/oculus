Auditor G report: bin/, tests/checks/, tests/fixtures/, tests/browser/helpers/, files directly under tests/, and the root files

Nothing in my part is unaudited. I read only; I edited no file and ran no git command.

## Enumeration

Command, from `tools/oculus`: `find bin tests/checks tests/fixtures tests/browser/helpers -type f | sort` printed **76** files. `find tests -maxdepth 1 -type f ! -name '*.test.ts' ! -name '*.spec.ts'` printed **0**: tests/ holds only folders. The root files add **8**: package.json, playwright.config.ts, vite.config.ts, eslint.config.js, tsconfig.json, .prettierrc, .prettierignore, .gitignore.

For X3b I diffed the file lists against `.agents/worktrees/X3b/tools/oculus`. X3b adds one file to my part, `tests/checks/source/controls.test.ts`. That gives **85 files** in total. I read `bin/revert-check.mjs` (545 lines), `playwright.config.ts` (46 lines) and `controls.test.ts` (52 lines) from the X3b worktree. Other files also differ between the worktree and main (for example duplication.test.ts and serve.ts); the brief does not name them, so I audited main's copies of those.

The versions oculus runs, from `node -e require(...).version` and `node --version`: eslint 10.10.0, typescript 6.0.3, vitest 4.1.11, svelte 5.57.0, @playwright/test 1.63.0, yaml 2.9.0, Node v24.21.0. Every library fact below comes from `npm view <pkg> version license time maintainers peerDependencies engines` or from a page fetched in this run.

## Two defects found along the way

1. **bin/migrations/migrate-joint-work.mjs:70 writes YAML that cannot be parsed.** Its `quoted()` escapes only `\` and `"`. A value holding a line break produces a file that fails to parse. I checked this by building `'k: ' + quoted('line one\nline two')` and passing it to `yaml.parse`, which throws `YAMLParseError: Missing closing "quote at line 1`. Calling `stringify({k: v}, {defaultStringType: 'QUOTE_DOUBLE'})` from the `yaml` package already in the dependencies writes it correctly.
2. **tests/checks/tree/duplication.test.ts `meaningful()` strips comments with `/\/\/.*$/`.** This also cuts a line at the `//` inside a string such as `'http://...'`, so such lines are compared truncated. I found this by reading the code; I did not run a case over it.

## Capabilities where a library is a real option

### 1. Proving a named revert turns a test red (bin/revert-check.mjs, tests/checks/bin/revert-check.test.ts)

**What oculus has.** revert-check.mjs is 545 lines in X3b; its test is 681 lines. For each case it:
- reads the `// revert: path:line => text` directives with regexes and finds the case each belongs to (`caseName`/`caseAbove`, about 50 lines);
- copies the tree to a scratch folder and links node_modules into it;
- applies the edit, then runs the one case under vitest `-t`, or under playwright `-g` after `npm run build` on a free port (`freePort`, `browserEnv`, `portTaken`);
- reads the verdict from the runner's JSON report;
- classifies the result as red, green, unproven or unchecked;
- removes the copy, including on a signal (`removeCopy`, SIGNALS).

**Candidate: @stryker-mutator/core with @stryker-mutator/vitest-runner.**
- Facts: 10.0.0, Apache-2.0, released 2026-08-14, maintainer nicojs (stryker-mutator org). The vitest-runner's peers are `vitest >=2.0.0` and core 10.0.0, which match vitest 4.1.11. Engines `node >=22`, which matches.
- Covers: tree copying (its sandbox), running tests against a mutant, mutating `.svelte` files (the default mutate glob includes svelte), and restricting mutation to a line range (`src/app.js:1-11`).
- Does not cover: the configuration page I read mentions no way to supply a hand-written replacement; mutants are generated. It lists no Playwright runner, only the generic command runner, which runs a whole command and reads its exit code. It does not bind one mutation to one named case, and it has no "unproven" verdict.

**Options.**
- Keep revert-check. Pro: it is the only tool here that checks the claim the tree's rule makes ("this case holds this rule, shown by this revert"), for both vitest and browser cases. Con: about 545 lines to maintain.
- Replace it with Stryker. Pro: automatic mutants measure the strength of the whole suite. Con: it loses the per-case named-revert contract and the browser cases, and it would be a different check.
- Keep revert-check and add Stryker beside it. This adds a tool and removes no code.

**Recommendation: keep revert-check.** Stryker lacks hand-written mutations, Playwright cases and a one-case verdict. A smaller change inside the keep option, which I have not built or tested: `vitest list --json` and `playwright test --list --reporter=json` could supply case names and locations in place of the `CASE`/`NAME` regexes. Estimate: about 40 lines fewer.

### 2. Import graph checks: cycles, folder order, layer boundaries, augmentation (tests/checks/imports/*, tests/checks/tree/boundaries.test.ts, bin/diagrams/imports.mjs)

**What oculus has.**
- `bin/diagrams/imports.mjs` (351 lines) parses TS/JS with the TypeScript compiler and Svelte with `svelte/compiler`, including `import()` in markup and `import.meta.glob`. It also reads type-only imports and `declare module` / `/// <reference>` augmentations.
- `tests/checks/imports/graph.ts` (187) resolves specifiers, including `$lib`, builds the graph and finds cycles.
- `order.ts` (179) holds folder order per layer, with the inner order of state/shared.
- `augments.ts` (30) forbids augmenting modules of the tree.
- `boundaries.test.ts` (595) holds the DESIGN.md layer rows. It also covers things that are not imports: process-wide state, which stores the shell reads, and `:global` rules that style a primitive's class.
- The test files: cycles.test.ts 129, order.test.ts 176, augments.test.ts 140.

**Candidate: dependency-cruiser.**
- Facts: 18.4.0, MIT, released 2026-09-20, maintainer sverweij. `supportedTranspilers` includes typescript `>=2.0.0 <7.0.0` and svelte `>=3.0.0 <6.0.0`, so TS 6 and Svelte 5 match. Engines `^22||^24||>=26`, which matches.
- The rules reference (fetched) documents: `type-only` and `dynamic-import` dependency types; `triple-slash-directive` and `triple-slash-file-reference`; `aliased-tsconfig-paths`; `$1` group matching from `from.path` into `to.path`; and `ignore-known` as a baseline of known violations.
- Covers: cycles (a no-circular rule that can exclude type-only imports), layer rows and folder order as forbidden rules. The configuration is JavaScript, so the rules can be generated from the ORDER list. The triple-slash half of augments is covered too.
- Does not cover, or not verified: `declare module` augmentation is not a documented dependency type. Resolution of `import.meta.glob` (one site in src) is not verified. Resolution of `$lib` through SvelteKit's generated tsconfig `extends` is not verified. The non-import rules of boundaries.test.ts stay by hand.
- Estimate: about 300 lines removed (graph.ts resolution, cycles and walk code; the import half of imports.mjs; `findUpward` in order.ts), plus about 80 lines of configuration added. What stays: augments.ts, the glob reading, the parse helpers that code.mjs uses, and the non-import rules of boundaries.test.ts.
- Layer rules: it expresses them directly as path rules. Theme tokens do not apply.

**Candidate: eslint-plugin-boundaries.**
- Facts: 7.2.0, MIT, released 2026-08-09, maintainer javierbrea, peer `eslint >=6.0.0`, which matches eslint 10.
- Covers: layer and element rules through ESLint's parser, so imports in `.svelte` script blocks reach it through eslint-plugin-svelte.
- Does not cover: cycles or augmentation. It needs a resolver for `$lib`; resolver support is not checked. Folder order needs one element type per folder.

**Candidates: eslint-plugin-import and eslint-plugin-import-x.**
- eslint-plugin-import: 2.32.0, released 2025-06-20, MIT. Its peer is `eslint ^2 ... ^9`, which **does not match eslint 10**.
- eslint-plugin-import-x: 4.17.1, MIT, released 2026-06-28, maintainer jounqin. Peer `eslint ^8.57||^9||^10` matches.
- Covers: `no-cycle` and `no-restricted-paths` zones.
- Does not cover: markup `import()` or augmentation. `.svelte` resolution is not checked.

**Candidate: madge.** 8.0.0, MIT, last release 2024-08-05. Its peer is `typescript ^5.4.4`, which **does not match TS 6.0.3**. Its readme does not mention Svelte. It does not fit.

**Options.**
- Keep the code. Pro: one reader serves both the checks and the diagrams, and it handles augmentation, globs and markup imports. Con: about 740 lines of graph code to maintain.
- Adopt dependency-cruiser as the graph reader for the checks. Pro: maintained, supports TS 6 and Svelte 5, has a known-violations baseline, an estimated net 220 lines less. Con: a second resolver whose view could drift from the one the diagrams use unless the diagrams switch too (section 3); augmentation and globs stay by hand; the checks' `revert:` proofs become depcruise rule fixtures.
- Adopt eslint-plugin-boundaries for the rows, with import-x for cycles. Con: two plugins, resolver setup, and the folder order would be written as many element types.

**Recommendation: adopt dependency-cruiser as the one import-graph reader, for the checks and as input to the diagrams.** It is the only candidate that covers cycles, type-only imports, Svelte, TS 6 and generated path rules in one tool, with a baseline for held violations. Keep by hand: augments.ts, `import.meta.glob` reading, and the non-import rules of boundaries.test.ts. First prove on this tree that `$lib` and markup `import()` resolve; a failure there means keeping the code.

### 3. The diagrams generator (bin/diagrams/*, npm run diagrams, tests/checks/diagrams/*)

**What oculus has.**

| File | Lines | What it does |
|---|---|---|
| diagrams.mjs | 189 | Entry point; `staleFiles()` |
| graphs.mjs | 511 | Layer overview, one diagram per layer, channel diagram |
| writes.mjs | 513 | Write chain from the route to disk, followed through calls |
| calls.mjs | 175 | Reads calls, parameters and aliases |
| code.mjs | 122 | Blanks comments using the TS and svelte parsers |
| labels.mjs | 448 | Label nodes placed on arrows; `labelsAcross` Bezier crossing check |
| source.mjs | 183 | Shared helpers and Graphviz text |
| imports.mjs | 351 | Import reader (shared with section 2) |

The tests are diagrams.test.ts (865) and readable.test.ts (341). Rendering uses @viz-js/viz, which is already a dependency; the SVG uses `currentColor` so the Help view draws it under any theme.

**Candidate: dependency-cruiser's `dot` and `archi` reporters** (facts as in section 2).
- Covers: the import graph as Graphviz, collapsed by folder.
- Does not cover: channels, the write chain, label nodes, the "not placed" group with file and line, the per-layer order, `currentColor` output, or the labelsAcross readability check.
- Estimate: removes nothing beyond the reader in section 2.

**Candidate: madge.** Ruled out as in section 2.

**Options.**
- Keep the drawing code. Pro: the channel and write diagrams are specific to oculus; no library draws them.
- Swap the layer diagrams to depcruise's reporter. Con: loses the label-node technique, the readability check and the theming. The Help view's look would change.

**Recommendation: keep the drawing** (graphs.mjs, writes.mjs, calls.mjs, labels.mjs, source.mjs, diagrams.mjs). No candidate draws channels, write chains or the label-node layout. If section 2 is adopted, graphs.mjs reads its import edges from dependency-cruiser's `cruise()` output instead of imports.mjs.

### 4. Duplication detection (tests/checks/tree/duplication.test.ts, allow-duplication.txt)

**What oculus has.** duplication.test.ts is 378 lines. It uses a line-window algorithm: drop comments, imports and style blocks, normalise whitespace, and report any window of 8 identical lines. It keeps a ratchet: HELD entries in allow-duplication.txt (690 non-empty lines), each keyed by a sha256 "mark" of the window, plus DELIBERATE pairs that need an `isReason` reason.

**Candidate: jscpd.**
- Facts: 5.3.2, MIT, released 2026-09-23, maintainer apk (kucherenko). No peer dependencies are listed. Engines `node >=18`.
- The readme says it detects by token, supports `--min-lines` and `--min-tokens`, tokenizes Svelte per block, and has a JSON reporter and `--ignore-pattern`.
- Covers: detection, so comment reflow and renamed identifiers stop mattering, and the regex comment stripping (defect 2) goes away.
- Does not cover: an allow list keyed per clone. It ignores files by glob only, so the HELD/DELIBERATE ratchet stays as glue over its JSON report.
- Estimate: about 150 lines removed (`meaningful`, the window matching); about 60 lines of report glue added.

**Options.**
- Keep the code. Con: it has defect 2, and it is a third comment stripper in the tree (section 6).
- Adopt jscpd with the ratchet as glue.

**Recommendation: adopt jscpd.** Detection is its whole purpose, and it is maintained (released 2026-09-23). The ratchet stays, since jscpd has no per-clone baseline. The 690 HELD marks have to be regenerated in jscpd's terms.

### 5. Size limit and comment width (bin/size-check.sh, bin/size-allow.txt, tests/checks/tree/size.test.ts, tests/checks/source/comment-width.test.ts)

**What oculus has.**
- size-check.sh (53 lines of awk) and size.test.ts (221) enforce 900 lines per file and 540 per component, with a ratchet list (size-allow.txt is 4 lines, comments only, so no file is listed today). They cover `.ts .svelte .mjs .js .sh`.
- comment-width.test.ts (82) enforces 100 columns on comment lines in `.ts .js .mjs .svelte .sh .css`. It exempts lines holding a tool directive and lines with a word too long to wrap.

**Candidates.**
- ESLint core `max-lines`, already installed: not deprecated (checked `meta.deprecated` in node_modules), options `max`, `skipComments`, `skipBlankLines`.
- `@stylistic/eslint-plugin` `max-len`: 5.10.0, MIT, released 2026-03-06, peer `eslint ^9||^10`, which matches. Options include `comments`, `ignorePattern` and `ignoreUrls` (rule README fetched). Core `max-len` is deprecated.
- Neither covers `.sh`, and max-len does not cover `.css`. eslint.config.js lints only `src/**` and `tests/**/*.ts`, so bin/ is not linted today. Neither has a count ratchet or a "remove the entry once back under the line" rule. Whether max-len sees Svelte markup comments is not verified. The long-word exemption is not expressible (`ignoreUrls` covers only part of it).
- Estimate: max-len could remove about 40 lines of comment-width.test.ts. code.ts stays for other checks.

**Options.** Keep both checks, or move the base limits into ESLint and keep the ratchet and the `.sh`/`.css` coverage by hand. Moving them splits one rule across two tools.

**Recommendation: keep.** The candidates lack the ratchet, the shell and CSS coverage, and the long-word exemption, and the code is small.

### 6. Classifying source text into code, strings and comments (tests/checks/source/code.ts, duplication `meaningful()`, html-sites `htmlSites()`)

**Finding: this duplicates dependencies oculus already has.**
- `tests/checks/source/code.ts` (146 lines) is a hand scanner for TS, Svelte and shell. Users: add-forms, comment-width, audits, scratch, and X3b's controls.test.ts.
- `bin/diagrams/code.mjs` (122 lines) does the comment blanking with the `typescript` and `svelte/compiler` parsers, which are already in the tree.
- duplication.test.ts `meaningful()` is a third, line-regex stripper.
- html-sites.test.ts `htmlSites()` scans `{@html` braces by hand, where `svelte/compiler`'s parse returns the tags directly.

**Candidates:** `typescript` 6.0.3 (`ts.createScanner` gives comment and string tokens) and `svelte/compiler` `parse`. Both are already installed.

**Recommendation:** extend code.mjs to mark string tokens and make it the one reader. Keep only the shell `#` rule by hand. Estimate: about 100 lines removed, and the `//`-inside-a-string class of error (defect 2) goes away.

### 7. Raw HTML sites and raw controls (tests/checks/source/html-sites.test.ts, X3b controls.test.ts)

**Finding: eslint-plugin-svelte (installed, 3.23.0, peer `svelte ^3.37||^4||^5` matches) is used only partly.**
- `svelte/no-at-html-tags` is on in the recommended set (checked by listing the set's rules). `grep -rn "no-at-html-tags" src | wc -l` gives 45 disable comments against 46 `{@html` sites, so each site is exempted twice: once in a disable comment and once in html-sites.test.ts's ALLOWED map.
- X3b's controls.test.ts (52 lines) forbids raw `<button>`, `<input>` and `<select>` in named folders. That is exactly `svelte/no-restricted-html-elements` (its schema takes `elements` and a `message`) with a `files` override.

**Options.**
- Keep both tests.
- Move controls to the rule (about 45 lines removed; about 10 lines of config added). Con: its `revert:` proof becomes a lint fixture.
- Move html-sites' "the expression must be a sanitise call" into `no-restricted-syntax` over svelte-eslint-parser's mustache-tag node. The node's `kind: 'raw'` field is not verified.

**Recommendation:**
- controls.test.ts: replace with `svelte/no-restricted-html-elements`.
- html-sites.test.ts: keep, since ALLOWED carries a reason per site that a lint rule cannot hold, but read the sites through `svelte/compiler` (section 6).

### 8. Colour difference (tests/checks/look/lane-distance.test.ts)

**What oculus has.** lane-distance.test.ts is 290 lines. It includes a hand-written sRGB-to-CIELAB conversion (`lab`, from line 41) and CIEDE2000 (`ciede2000`, lines 65 to about 118), plus a case over published reference pairs. contrast.test.ts uses `ratio` from src/lib/themes/derive.ts; that is src, another auditor's part.

**Candidates.**
- culori: 4.0.2, MIT, released 2025-06-27, maintainer danburzo, no peers. The API page (fetched) lists `differenceCiede2000(Kl=1, Kc=1, Kh=1)`, `wcagContrast` and `wcagLuminance`. @types/culori 4.0.1 exists.
- colorjs.io: 0.7.1, pre-1.0, MIT, released 2026-07-24. Its readme lists DeltaE 2000 and names axe as a user.
- chroma-js: 3.2.0, BSD-3-Clause AND Apache-2.0, released 2025-11-28.

All three cover the full calculation. The theme tokens are unaffected, since this is test-only.

**Options.** Keep about 80 hand lines, or use culori. Using culori drops the reference-pair case, which would then be testing the library.

**Recommendation: culori.** It has a stable major version with types, and its `wcagContrast` is the same measure `derive.ts` computes, so src can share it; the src auditor rules on that part. Estimate: about 80 lines removed.

### 9. Locks, atomic writes, pid liveness and cleanup on exit (bin/dispatch-note.mjs, tests/browser/helpers/layer.ts, revert-check `removeCopy`)

**What oculus has.**
- dispatch-note.mjs (437 lines) has a lock of about 190 lines (lines 81-278): exclusive link, a holder's pid plus its `ps` start time, age, a second lock to break a stale one, and litter sweeping. It also has an atomic write by rename (`writeNote`, about 20 lines).
- layer.ts has a second, simpler lock (`takeLock`, `flag: 'wx'`), `running(pid)` and `removeOnExit`.
- `grep -rn "process.kill(.*, 0)"` finds the pid-alive idiom in src/lib/server/sessions/registry.ts:48, bin/dispatch-note.mjs:89 and tests/browser/helpers/layer.ts:89, plus two tests. That is repetition inside the tree.

**Candidates.**
- proper-lockfile: 4.1.2, MIT, **last release 2021-01-25**. From my knowledge of the library (not checked in this run), it judges a lock stale by mtime only, so it has no holder-pid check.
- write-file-atomic: 8.0.0, ISC, released 2026-05-08 (npm org). Engines `^22.22.2||^24.15.0||>=26`; Node 24.21 matches.
- signal-exit: 4.1.0, ISC, released 2023-07-29 (isaacs).
- exit-hook: 5.1.0, MIT, 2026 (sindresorhus).

**Options.** Keep, or swap write-file-atomic in for `writeNote` (about 20 lines) and signal-exit in for `removeOnExit` (about 15 lines). dispatch-note's head comment says it uses "Node's own modules only, so a skill in another repository calls it by path". A dependency would still resolve from oculus's own node_modules when the script is run by path, but it would then need `npm install` in oculus first.

**Recommendation: keep.** proper-lockfile is unmaintained and lacks the pid and start-time liveness check that dispatch-note-race.test.ts proves. The other two save about 35 lines at the cost of that constraint.

### 10. Scratch directories (tests/fixtures/scratch.ts) and the repeated patterns across *.test.ts / *.spec.ts

**What oculus has.** scratch.ts is 54 lines: `mkdtemp`, a check that the path is inside tmpdir, `plantScratch`, and `sweepScratch`. scratch.test.ts (437 lines) enforces that it is used and swept.

**Candidates.**
- tmp: 0.2.7, MIT, released 2026-05-27. It cleans up at process exit, not per file.
- tmp-promise: 3.0.3, MIT, **last release 2021-10-26**.
- Neither removes more than the roughly 10-line `scratchDir`.

**Finding: vitest and Playwright fixtures (installed) are unused.** `grep -rn "test.extend|it.extend|base.extend" tests` found none. The repeated patterns, counted with grep:
- `afterAll(sweepScratch)` in **110** files. A vitest `test.extend` scratch fixture, and the Playwright equivalent, would tear down on its own and remove the registration half of scratch.test.ts.
- `expect(resolve(x).startsWith(resolve(tmpdir()) + sep)).toBe(true)` **131** times in **96** files. This repeats a check `scratchDir` already makes before returning (scratch.ts:21), so those assertions are redundant.
- Hand-written recursive `readdirSync` plus `isDirectory()` walkers in **25** test files, 13 of them named `walk`/`files`/`svelteFiles`/`sourceFiles`/`filesUnder`. Node 24's built-in `fs.globSync`, or `readdirSync(dir, {recursive: true})`, covers these; that form is already used once, at contrast.test.ts:67.

**Recommendation:** keep scratch.ts. Adopt `test.extend` fixtures in place of the 110 registrations, drop the 131 redundant assertions, and use `fs.globSync` in place of the walkers. tmp adds nothing over what is there.

### 11. Command-line argument parsing in bin (dispatch-note `readFlags`, revert-check and cited-lines `readArgs`, migrate-joint-work `options`)

There are four hand-written parsers of 15 to 20 lines each. The candidate is `node:util` `parseArgs`, built into Node, no dependency; `grep -rn parseArgs bin src tests` finds no use. commander and yargs are not checked. One difference: dispatch-note refuses a flag given twice, which parseArgs does not do by default.

**Recommendation:** use `parseArgs`. Estimate: about 50 lines removed.

### 12. Finding a free port (revert-check `freePort`)

The candidate is get-port: 7.2.0, MIT, released 2026-03-22. It is async, while `freePort` runs in a synchronous script by spawning a probe, and the code is 6 lines. **Recommendation: keep.**

### 13. Writing YAML in the migration (bin/migrations/migrate-joint-work.mjs)

**Finding: `yaml` is already a dependency, yet the migration quotes values by hand** (`quoted`, `personBlock`, `organisationBlock`, `metaBlock`, `workBlock`, about 60 lines). That produces defect 1. **Recommendation:** write the scalars with `yaml`'s `stringify` (or Scalar nodes set to `QUOTE_DOUBLE`) and keep the header text.

### Not a library question

- **Folder item count** (bin/folder-check.sh, 48 lines). ls-lint 2.3.1's `exists:N-M` counts per extension and per directory (docs fetched), not all items together. For eslint-plugin-project-structure 3.14.4, grepping its readme showed no per-folder item limit. Keep.
- **knip** (6.38.0, ISC, released 2026-09-23) finds unused files and exports. No check in my part does that, so it replaces nothing here.
- **The ASCII gate** exists only as the perl command in agents/spec.md; no file in my part implements it.
- **The browser test server.** playwright.config.ts already uses Playwright's built-in `webServer`, which starts, waits for and stops the server. serve.ts and hub.ts build a copy of the demo hub, a separate engine directory, HOME, and stand-ins on PATH, all specific to oculus. Keep.

## Domain logic, no library covers it (one line each)

- bin/cited-lines.mjs: checks the `path:line` citations in a report against the tree.
- bin/claude-usage.sh: writes Claude's status-line payload for the Usage watcher.
- bin/scratch-count.sh: counts scratch folders left behind by both suites.
- bin/dispatch-note.mjs (the record and CLI parts): the launch-note format read by server/sessions.
- bin/migrations/rename-program-to-pillar.ts: a one-off hub migration using src's renameKey.
- bin/migrations/migrate-joint-work.mjs (the rest): the hub's registries split.
- tests/checks/bin/*: tests of the bin scripts above.
- tests/checks/config/*: the config folder, local.yml loading, and real-hub integrity.
- tests/checks/look/contrast.test.ts, themes.ts: token pairs per theme.
- tests/checks/source/history.test.ts: the tree's own history-vocabulary rule.
- tests/checks/source/keys.test.ts, text.test.ts: oculus's own catalog and glyph system.
- tests/checks/source/add-forms.test.ts: one add form per collection per view.
- tests/checks/tree/audits.test.ts, negatives.test.ts, allow-negatives.ts, allow-audits.txt: the tree's rules about tests themselves.
- tests/checks/tree/allow-styling.ts and the styling and state rows of boundaries.test.ts: the `:global` primitive rule.
- tests/fixtures/*: synthetic portfolio, feed, session and client fixtures, `isReason`, and `realHub`.
- tests/browser/helpers/cards, files, forms, git, rail, style, words: page drivers for oculus's own views.
- Root config files: standard configuration of installed tools (vite, eslint, prettier, tsc, git).

## Coverage table

| File | Capability |
|---|---|
| .gitignore | Root config (git) |
| .prettierignore | Root config (prettier) |
| .prettierrc | Root config (prettier) |
| eslint.config.js | Lint config; host for sections 5 and 7 |
| package.json | Dependencies and scripts |
| playwright.config.ts (X3b) | Browser test server (webServer) |
| tsconfig.json | Root config (tsc) |
| vite.config.ts | Build and vitest config |
| bin/cited-lines.mjs | Domain: citation check; section 11 |
| bin/claude-usage.sh | Domain: usage payload |
| bin/diagrams/calls.mjs | Section 3: diagrams (call reader) |
| bin/diagrams/code.mjs | Sections 3 and 6: comment blanking |
| bin/diagrams/diagrams.mjs | Section 3: diagrams entry |
| bin/diagrams/graphs.mjs | Section 3: diagrams drawing |
| bin/diagrams/imports.mjs | Sections 2 and 3: import reader |
| bin/diagrams/labels.mjs | Section 3: label layout and check |
| bin/diagrams/source.mjs | Section 3: shared diagram helpers |
| bin/diagrams/writes.mjs | Section 3: write chain |
| bin/dispatch-note.mjs | Sections 9 and 11: lock, atomic write, CLI |
| bin/folder-check.sh | Folder item count (keep) |
| bin/migrations/migrate-joint-work.mjs | Section 13: YAML writing (defect 1) |
| bin/migrations/rename-program-to-pillar.ts | Domain: migration |
| bin/revert-check.mjs (X3b) | Section 1: revert proof |
| bin/scratch-count.sh | Domain: leak count |
| bin/size-allow.txt | Section 5: size ratchet |
| bin/size-check.sh | Section 5: size check |
| tests/browser/helpers/cards.ts | Domain: page driver |
| tests/browser/helpers/files.ts | Domain: file-browser fixtures |
| tests/browser/helpers/forms.ts | Domain: page driver |
| tests/browser/helpers/git.ts | Domain: git fixture |
| tests/browser/helpers/hub.ts | Browser test server: hub copy |
| tests/browser/helpers/layer.ts | Section 9: lock, exit cleanup |
| tests/browser/helpers/rail.ts | Domain: page driver |
| tests/browser/helpers/serve.ts | Browser test server |
| tests/browser/helpers/style.ts | Domain: computed-style reading |
| tests/browser/helpers/words.ts | Domain: catalog in specs |
| tests/checks/bin/cited-lines.test.ts | Domain: bin test |
| tests/checks/bin/claude-usage.test.ts | Domain: bin test |
| tests/checks/bin/dispatch-note-race.test.ts | Section 9: lock race test |
| tests/checks/bin/dispatch-note.test.ts | Section 9: bin test |
| tests/checks/bin/migrate-joint-work.test.ts | Section 13: bin test |
| tests/checks/bin/rename-pillar.test.ts | Domain: bin test |
| tests/checks/bin/revert-check.test.ts | Section 1: revert proof test |
| tests/checks/config/config-folder.test.ts | Domain: config |
| tests/checks/config/config.test.ts | Domain: config |
| tests/checks/config/integrity.test.ts | Domain: real hub |
| tests/checks/diagrams/diagrams.test.ts | Section 3: diagrams test |
| tests/checks/diagrams/readable.test.ts | Section 3: diagrams test |
| tests/checks/imports/augments.test.ts | Section 2: augmentation |
| tests/checks/imports/augments.ts | Section 2: augmentation |
| tests/checks/imports/cycles.test.ts | Section 2: cycles |
| tests/checks/imports/graph.ts | Section 2: import graph |
| tests/checks/imports/order.test.ts | Section 2: folder order |
| tests/checks/imports/order.ts | Section 2: folder order |
| tests/checks/look/contrast.test.ts | Domain: token contrast (section 8 note) |
| tests/checks/look/lane-distance.test.ts | Section 8: CIEDE2000 |
| tests/checks/look/themes.ts | Domain: theme reader |
| tests/checks/source/add-forms.test.ts | Domain: add-form rule |
| tests/checks/source/code.ts | Section 6: code scanner |
| tests/checks/source/comment-width.test.ts | Section 5: comment width |
| tests/checks/source/controls.test.ts (X3b, new) | Section 7: raw controls |
| tests/checks/source/history.test.ts | Domain: history vocabulary |
| tests/checks/source/html-sites.test.ts | Section 7: raw HTML sites |
| tests/checks/source/keys.test.ts | Domain: catalog keys |
| tests/checks/source/text.test.ts | Domain: catalog and glyphs |
| tests/checks/tree/allow-audits.txt | Domain: audit allow list |
| tests/checks/tree/allow-duplication.txt | Section 4: duplication ratchet |
| tests/checks/tree/allow-negatives.ts | Domain: negatives allow list |
| tests/checks/tree/allow-styling.ts | Domain: styling allow list |
| tests/checks/tree/audits.test.ts | Domain: audit rule |
| tests/checks/tree/boundaries.test.ts | Section 2: layer rows; domain styling/state rules |
| tests/checks/tree/duplication.test.ts | Section 4: duplication (defect 2) |
| tests/checks/tree/negatives.test.ts | Domain: negatives rule |
| tests/checks/tree/scratch.test.ts | Section 10: scratch rule |
| tests/checks/tree/size.test.ts | Section 5: size and folder checks |
| tests/fixtures/client.ts | Domain: client fixture |
| tests/fixtures/doubles.ts | Domain: test doubles |
| tests/fixtures/entities-fixture.ts | Domain: fixture |
| tests/fixtures/feeds-fixture.ts | Domain: fixture |
| tests/fixtures/kinds.ts | Domain: write kinds |
| tests/fixtures/present.ts | Domain: narrowing helper |
| tests/fixtures/real-hub.ts | Domain: hub presence |
| tests/fixtures/reason.ts | Domain: reason rule |
| tests/fixtures/scratch.ts | Section 10: scratch directories |
| tests/fixtures/sessions-fixture.ts | Domain: session fixture |

85 rows: 76 from the find command, 8 root files, and 1 file added by X3b.
