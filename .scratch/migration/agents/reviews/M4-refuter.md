REVIEW OF M4, FIRST RUN. Base bca66b3c, worktree /Users/axelfaes/workspace/research-hub/.agents/worktrees/M4. I changed no file in the worktree. `npm run diagrams` and the tests regenerate tracked or ignored build output there; `git status --short` is 42 lines before and after, and `git diff bca66b3c --stat` is 40 files, 275 insertions, 253 deletions. My scratch is /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/m4r/.

## Open items first
1. Sentence made false and outside the brief's path list: `/Users/axelfaes/workspace/research-hub/README.md:33` (finding S1).
2. Behaviour difference from the image and from the ruling's `{\small\text{X}}`: `mathjax_small` keeps the space after `\small`, so the deck draws a leading no-break space before "kept local" on the hccnet-fl slide (finding B1).
3. Not verified, needs the look at landing: the 13 slides on TEST against their PNGs; whether `.eqcard mjx-container{max-width:100%;overflow-x:auto}` is right in a browser; `\bm{\beta}` and the offline extension load in a real browser (I checked jsdom only).

## Verification lines
`PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams` printed `docs/diagrams/layer-views.svg` ... `docs/diagrams/writes.svg` and exited 0. Then `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md` printed (verbatim):
```
$ npm test
 ❯ |unit| tests/server/edit/config-key.test.ts (38 tests | 1 failed) 57959ms
 ❯ |unit| tests/server/git/autofetch.test.ts (44 tests | 7 failed) 56534ms
 FAIL  |unit| tests/server/edit/config-key.test.ts > a file the writer cannot write > lets the exception of a read-only file reach the route and leaves the mode as it was
Error: Test timed out in 5000ms.
 FAIL  |unit| tests/server/git/autofetch.test.ts > a real fetch through the module > moves origin/main and prunes a branch deleted on the remote   (and 6 more autofetch.test.ts cases, each "Test timed out in 5000ms.")
 Test Files  2 failed | 424 passed | 22 skipped (448)
      Tests  8 failed | 11191 passed | 621 skipped (11820)
checks: failed with exit 1: npm test
```
Both files are untouched by M4 (not in `git diff bca66b3c --stat`). Rerun alone: `npx vitest run tests/server/edit/config-key.test.ts tests/server/git/autofetch.test.ts --reporter=dot` gave `Test Files  2 passed (2)  Tests  82 passed (82)`. I do not count this as a pass of the list. checks.sh stops at the first failure, so I ran the other six commands one by one from tools/oculus:
- `npm run test:checks`: exit 0, `Test Files  29 passed | 2 skipped (31)`, `Tests  443 passed | 9 skipped (452)`
- `npm run check`: exit 0, `COMPLETED 2960 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
- `npm run build`: exit 0, `✓ built in 22.12s` and `✓ built in 58.77s`
- `npm run format:check`: exit 0, `All matched files use Prettier code style!`
- `npm run lint`: exit 0
- `! LC_ALL=C grep -rna '[^ -~]' src tests`: exit 0, no output
- The spec's perl ASCII gate over `src tests config` (no `bin`): no output. `tools/present` files: only the untouched `content/present.yml:136` (Linköping).

## Rerun of the report's evidence
- Byte comparison: a Python script that read each `PRESENT.md` front matter with `yaml.safe_load` and matched it to its `make_equations.py` entry via the old key from `git show bca66b3c:<file>` printed `13 files 0 mismatch`, OK for every file. A node script using oculus's `yaml` package printed `13 with equation; 13 equal to a make_equations entry (yaml 1.2 parser)`. `grep -rn "equation: eq_" --include=PRESENT.md projects | wc -l` printed 0; `grep -rc "^  equation: '" --include=PRESENT.md projects | grep -c ':1$'` printed 13; `git diff bca66b3c --numstat -- projects` shows 13 files, 1 added and 1 removed line each.
- build.py: `python3 tools/present/build.py` writes only to the ignored `tools/present/present.html` (`.gitignore:132`), so I ran it in a scratch copy (`m4r/tree`, projects symlinked, read only). It printed `Wrote tools/present/present.html (6557 KB) | 16 project slides (from PRESENT.md)`, and `cmp` says it is byte-identical to the worktree's `present.html`. Counts: `<div class="eqcard">\[` 13, `<div class="eqcard"><img` 0, `class="eqcard"` 13, `class="fig"` 24. "Figures as before" is not comparable: the builder's baseline dropped figures over 1 MB.
- jsdom probe: `node deckprobe.cjs <that present.html>` printed card 1 to 13 each `merror 0 red 0 -`, `negative control n1: merror 1 red 0`, `negative control n2: merror 0 red 1`, `bm beta mml has bold-italic: true <mi mathvariant="bold-italic">&#x3B2;</mi>`, `eqcards 13 with mjx-container 13 bad 0 network attempts []`, exit 0. Reproduced.
- Probe teeth, on scratch copies of build.py: with `MATHJAX_EXTENSIONS = []` the probe ends `ERR startup did not finish in 30 s (offline load failed)`. With `mathjax_small` bypassed it prints `LITERAL-MACRO` on card 2 (hccnet-fl) and card 11 (dongho), `bad 2`. So the extension and the rewrite are each needed, and the probe fails without them.
- boldsymbol.js provenance: `npm view mathjax@3.2.2 dist.shasum` is `c754d7b46a679d7f3fa03543d6b8bf124ddf9f6b`, license `Apache-2.0`, the same sha1 as the builder's `mathjax-3.2.2.tgz`. `package/es5/input/tex/extensions/boldsymbol.js` from that tarball is `cmp`-identical to `tools/present/assets/vendor/boldsymbol.js`, and `package/es5/tex-svg.js` is identical to the vendored `tex-svg.js`.
- Fails on the unchanged tree: scratch copy `m4r/base` is the worktree with the src, config, tools/present and projects diffs reverse-applied (`patch -R`) and the final test files kept. `npx vitest run <the 7 changed test files> --testTimeout 0` gave `Test Files  5 failed | 2 passed (7)`, `Tests  17 failed | 419 passed (436)`, the builder's numbers. Seven named failures with the assertion printed:
  1. portfolio-config.test.ts "reads a deck that still holds equations_dir ... no effect": `expected 'eq.png' to be undefined`
  2. integrity.test.ts "reads an equation out of every slide that writes one": `bt-operator-theory: expected 'eq_btfno.png' not to match /\.(?:png|jpe?g|svg|webp)\s*$/i`
  3. sources/present.test.ts "equationIsImage ... trimmed and in any case": `expected false to be true`
  4. sources/present.test.ts "reports the image name eq_x.png ...": `expected 'eq_x.png' to be undefined` (EQ.PNG and `'eq_x.png '` fail the same way)
  5. sources/present.test.ts `equation: ''` case: `expected '' to be undefined`
  6. state/life/present.test.ts, six "reads the deck %j as the empty deck": strict equality fails on the `equationsDir` key
  7. type-scale.test.ts "Equation.svelte": `expected '.gap=fs-md' to be ''`
- Cases 10 and 11 greps: `grep -rn "tools/present" src tests config --exclude=local.yml` prints nothing. The identifier grep as the brief wrote it prints lines (`hubPathsOf` in `state/boards/collection.ts`, Person.svelte, EntryCard.svelte, VenueCard.svelte, `show-in-files.test.ts`, and `hubPath` in `data/sources/manifests.ts:25,101,152`). With `\bhubPath\b` it prints only `manifests.ts:25,101,152`. `grep -rn "equations_dir" src config --exclude=local.yml` prints nothing; the only `tests/` hit is the case 9 test (`portfolio-config.test.ts:146,155`).
- Local changes to ASCII, size and ADR: all changed files are under limits (largest `model-entities.ts` 669 lines); `tests/data/sources` holds 9 items; no ADR folder exists (`ls docs/adr` and `ls tools/oculus/docs/adr` fail, `.agents/plan.yaml` has no adr key), so none governs the diff.

## Verdicts, "What to build"
1. The 13 slides by the named script: holds (comparison above; the diff touches one line in each of the 13 files and nothing else under `projects/`).
2. Image branch removed, one finding kept: holds. Every listed removal is in the diff; `equationIsImage` trims and lowercases; blank `equation:` is dropped in `slide()`; the finding is keyed on the slide id and `delete slide.equation` follows. Unrequested change: `IMAGE_SUFFIXES` is no longer exported (no importer found by `grep -rn IMAGE_SUFFIXES src tests`).
3. The cockpit deck: holds, with the three rulings (jsdom probe, boldsymbol extension, `\small` rewrite, `deck.css` rule). Exception: the rewrite's space handling (B1).
4. meta.yml words: holds (`meta.yml:5` reads `Showcase = the Present view.`).
5. The tests: holds. Present cases are rewritten as listed; `deck-edit.test.ts` keeps its proof with `tag_tones` as neighbour; no test reads `tools/present`.
6. Diagrams regenerated: holds (my run left the same 4 files modified; the count changes match the removed imports of `fileUrl`, `HUB_ROOT` and `t` from `Equation.svelte`).

## Verdicts, cases
1 met (integrity test; fails at base). 2 met, but the view test passes before and after, and nothing in the tests fails if `Equation.svelte` regained an `<img>` branch (an audit as to the image branch; the sources tests carry the change). 3 met (fails at base). 4 met. 5 met. 6 met. 7 met (preserved behaviour, test passes at base and after). 8 met (preserved). 9 met through `portfolioConfigFrom`/`buildPortfolio`; `deckFrom` over a deck holding `equations_dir` has no test (the zod object is not strict, `state/life/present.ts:277-297`, so it ignores the key). 10 met. 11 met only with the corrected grep; the brief's literal command cannot print nothing. 12 met (13 `\[` cards, probe all zero, controls fire). 13 met, but only by my check: the report shows no after-change run and no test (Z235). `equation_card('projects/manuscripts/btfno','eq_btfno.png')` returned `<div class="eqcard"><img src="data:image/png;base64,...`. 14 not verifiable (the look).

## Findings

### Spec
- S1. Sentence made false, outside the path list. `/Users/axelfaes/workspace/research-hub/README.md:33`: "The only per-project files under `tools/` are `present/content/present.yml` (...) and `present/make_equations.py` (a new project's equation)." After M4 a new project's equation is the `equation:` of its `PRESENT.md`, so `make_equations.py` is no longer a per-project file. Grep that found it: `grep -rnIl "make_equations\|equations_dir\|eq_[a-z]*\.png"` over the worktree. The brief check and the builder both missed it (the brief lists only `tools/present/README.md`, `content/present.yml`, `make_equations.py` and the skill). Failure scenario: a reader following the root README adds an `eq_` entry that nothing reads. Verdict: defect of the change (spec.md:59), fix at landing in `README.md:33`.
- S2. Disclosed deviation, low. `build.py` is edited outside the brief's lines 155-162 (docstring lines 9-10, `MATHJAX_EXTENSIONS` at 30-31, `mathjax_small` and `equation_card` at 144-181, the assembly in `main()` at 336-339), reported in the builder's judgment call 4 only after writing. The edits are needed by the rulings; verdict: acceptable, no action.
- S3. Disclosed, low. The report says `git --version` was run once; spec.md:30 says no git command. It reads no repository state. Verdict: no action.
- S4. The brief's own sentence "make_equations.py renders PNGs for the cockpit's own use" is carried to `tools/present/README.md:50` and `make_equations.py:5`. `grep -rn "assets/equations\|equation_img" tools` finds a consumer only in `tools/present/build.py` (the image branch, drawn only when a `PRESENT.md` names an image, which none does). No cockpit code reads them. Verdict: wording as briefed; the claimed consumer does not exist, orchestrator may reword.

### Proof
- P1. `mathjax_small` has no test (ruled, Z235), so its input cases rest on the one-off probe. My run of the function on edge inputs (below) is not in the diff or the report.
- P2. `integrity.test.ts` new case pairs `equations.length` with `written.length` from `^ +equation: *\S` over every `PRESENT.md`. An `equation:` inside a `slides:` flow entry (`- { id: x, equation: ... }`) is counted in `equations` and not in `written`, so such a slide makes the case fail although the hub is fine; a blank `equation: ''` line is counted in `written` and not in `equations`, same failure. Failure scenario: the first slides-list equation added to any project. Verdict: brittle, no current failure; the first mismatch message will not say why.
- No other finding under Proof: no known defect asserted, no threshold widened, no file-scope mutable, the unchanged-tree failures are quoted and reproduced, counts reproduced.

### Standards
- S1 above.
- ST1. The head comment of `src/lib/data/sources/present.ts:10-12` ("a figure that names no file are each a Finding") is not false but omits the image-named equation finding the file now raises. Low; the `resolveFiles` comment at 182-186 does name it.
- ST2. `Equation.svelte` keeps `{#if slide.equation !== undefined}` while its only caller, `Project.svelte:99`, already guards the same condition. A harmless duplicate guard (it satisfies the `string | undefined` type for `tex`). No action needed.
- No non-ASCII, history in comments, or file over the size limit in the diff (grep over added lines for package ids, dates and "no longer/previously/formerly" found only two lines that are not history). Names grepped across `tools/oculus/docs`, config (`--exclude=local.yml`), src, tests, `HELP.md`, `DESIGN.md`, `README.md`, `tools/present`, `tools/cockpit`: `equations_dir` (only the case 9 test), `equationImage`, `equationMissing`, `equationsDir`, `equation_missing`, `equation_alt`: none left; `make_equations` and `eq_`: only in `tools/present` and the hub `README.md:33` (S1); `equation_image`: findings.yml:40, present.ts:214, portfolio-config.test.ts:164.

### Behaviour
- B1. `mathjax_small` leaves the space after `\small` in the text. Hunk, `tools/present/build.py` (function `mathjax_small`): `out.append("{\\small\\text{" + tex[after:i] + "}")`, where `tex[after:i]` starts at the character after `\small`, so a space stays. Z237 and `choices.md` give the form `{\small\text{X}}` for `\text{\small X}`. LaTeX swallows the space after a control word. Reproduced: `\text{\small kept local}` becomes `{\small\text{ kept local}}` and MathJax's `tex2mml` gives `<mtext>&#xA0;kept local</mtext>`, against `<mtext>kept local</mtext>` for `\text{kept local}`. In `eq_hccnetfl` (`\psi_k\ \text{\small kept local}`) the deck therefore draws a no-break space after `\ `, wider than the PNG and than oculus's KaTeX. `\text{\small(chance-corrected agreement)}` and `\text{\small(federate $\theta$)}` have no space and are unaffected. The probe's `merror`, `red` and literal-macro counts are all 0 for it, so it passes. Verdict: unmet detail of Z237 on one of the 13 slides; the fix is to drop leading whitespace of `tex[after:i]` after `\small`.
- B2. Inputs `mathjax_small` leaves unrewritten or half-rewritten (outputs from running it on the listed strings; none is in the 13): `\text{ \small X}` (space before `\small`) and `\textbf{\small X}`/`\mbox{\small X}` stay literal; a second `\small` or a nested `\text{\small ...}` inside the body stays literal (`\text{\small a \text{\small b} c}` becomes `{\small\text{ a \text{\small b} c}}`); `\footnotesize`, `\large` and other size commands are not handled; an unclosed brace leaves the text unchanged (the deck draws it and MathJax reports the missing brace). Escaped braces (`\}`, `\{`), nested braces, `\\`, two occurrences, `\smaller` (left alone) and `\text{\small}` behave correctly. Failure scenario: a future slide writing `\text{\footnotesize note}` draws the literal command, and the probe's literal-macro check catches only `\small`, `\bm` and `\text`. Verdict: limits of the ruled rewrite, not a defect against the brief; worth one line in the landing report.
- B3. `tools/present/build.py` `main()` appends `boldsymbol.js` to `mathjs` unconditionally; with `assets/vendor/tex-svg.js` absent (the existing code then uses `""`), the page gets only the extension, which throws in the page. The deck has no equations then anyway. Low.
- B4. The report states the oculus before and after for the view, the finding, the settings key and the cockpit deck. It does not state B1 or that a cockpit `equation` naming a missing image file is now drawn as the file name in LaTeX (it does state this as judgment call 5, not under user-visible changes).

## Declined to judge
- The look: the 13 slides on TEST against `tools/present/assets/equations/*.png`; KaTeX against PNG sizing, including `\small` size (needs Axel's Chrome and TEST).
- The `.eqcard mjx-container` rule and the MathJax SVG widths (40 to 75 ex) in a real browser; the 1em margin MathJax gives a display container inside `.eqcard`.
- Offline load of the inlined extension in a real browser (jsdom `runScripts: 'outside-only'` only).
- `.agents/skills/research-cockpit/SKILL.md:68-69,76` (not edited, O29; the builder lists the lines).
- Apache-2.0 notice for the vendored `boldsymbol.js`: `tex-svg.js` is vendored the same way, no documented standard found.
- `config/local.yml` never opened. Ports 8787 and 8790 untouched. No server started. No file written under `projects/`.

## Usage
About 215,000 tokens of context consumed (15,000,000 at start, 14,779,000 at the end), about 60 tool calls. Full-list runs: 1 (`checks.sh`, stopped at `npm test`) plus the six remaining commands one by one, one rerun of the two timed-out files, one 7-file vitest run on the reverse-patched copy, four build.py runs in scratch, five probe runs.

Usage from the completion notice: claude-sonnet-5-5, 227,976 tokens, 69 tool uses, 37.9 min.
