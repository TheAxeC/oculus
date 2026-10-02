# M4 report: the Present view's equations as LaTeX

Everything in the brief is done, as amended by `agents/briefs/M4-cases.md` (Z236 to Z238 and the four rulings). Not verified: the look on screen (the 13 slides on TEST against their images, and whether the new `.eqcard mjx-container` rule is needed in the cockpit deck), which is the landing's step.

Open items of the state file (`orchestrator-state.md:169-182`): the section is empty. None is open.

## The hand-back and its rulings

The first run was handed back before any change (cases below). The rulings in `M4-cases.md`: (1) the typeset check runs the vendored `tex-svg.js` inside jsdom, installed in a scratch folder only; (2) `\bm` is drawn bold through MathJax 3.2.2's own `boldsymbol` extension, `\text{\small X}` is rewritten for MathJax only in `build.py`, and the check counts `merror` and red nodes with two negative controls; (3) the paths `type-scale.test.ts` line 153, `deck.css` and the extension file are added; (4) a blank `equation:` draws no card.

## The cases' first run on the unchanged tree

Measured before any change on a copy of the worktree at `.../scratchpad/m4/base` (code and data unchanged), with a scratch test and `python3 tools/present/build.py` there.

| Case | Result on the unchanged tree |
|---|---|
| 1 | 13 slides carry `equation: eq_<id>.png`, `equationImage` set, 0 present findings. With item 1's data and the code unchanged: 13 slides, 0 findings, 0 `katex-error`. |
| 2 | `\min_{x} f(x)` in an `Equation.svelte` render: `katex` present, no `<img`. Holds already. |
| 3 | `eq_x.png`, `EQ.PNG`: `equationMissing` and the finding "equation ... is in neither the deck's equations folder nor present/". `'eq_x.png '`: no finding, drawn as LaTeX. |
| 4 | Only field `equation: eq_x.png`: one slide, `hasSlideContent` true, missing-image finding. |
| 5 | `slides:` entry: finding keyed `alpha/data`, missing-image wording. |
| 6 | No `equation:`: no card. `equation: ''` and `equation: "  "`: `slide.equation` is `''` / `'  '`, `hasSlideContent` true, an empty `eqcard` drawn. |
| 7 | `\frac{` gives `katex-error` markup, no crash. Holds already. |
| 8 | `equation: 3` and `[a, b]` give no equation. Holds already. |
| 9 | `deckFrom({deck:{equations_dir:'tools/x'}}).equationsDir` is `'tools/x'`: the key had an effect. |
| 10 | `grep -rn "tools/present" src tests config --exclude=local.yml` printed 12 lines. |
| 11 | The identifier grep printed 92 lines, `equations_dir` 9 lines. |
| 12 | Original data: `present.html` had 13 `<div class="eqcard"><img src="data:image/png` cards and 0 `\[` cards. Item 1's data with the old `build.py`: no `eqcard` at all. |
| 13 | Original data: 13 image cards. |

## DONE / NOT DONE

| Row | Command and output | State |
|---|---|---|
| Item 1: 13 lines written by the named script | The script printed the 13 paths (list below). `grep -rn "equation: eq_" --include=PRESENT.md ../../projects` prints nothing. `grep -rc "^  equation: '" --include=PRESENT.md ../../projects \| grep -c ':1$'` prints `13`. Each value compared byte for byte with its `make_equations.py` entry: 13 equal. | DONE |
| Item 2: image branch removed, one finding kept | Cases 10 and 11 greps below; tests `tests/data/sources/present.test.ts` ("the equation", "equationIsImage"). | DONE |
| Item 3: cockpit deck | `python3 tools/present/build.py` prints `Wrote present.html (6557 KB) \| 16 project slides (from PRESENT.md)`; the page holds 13 `\[` equation cards, 0 image equation cards, 24 figures, and the extension inlined. Probe below: 13 cards, 0 `merror`, 0 red, both negative controls fire, `\bm{\beta}` is bold-italic, 0 network attempts. | DONE |
| Item 4: `meta.yml:5` | `config/catalogs/meta.yml` line 5 reads `'Private working dashboard - **never deploy**. Showcase = the Present view.'` | DONE |
| Item 5: tests | Files listed below; `npx vitest run` of the touched files passes; failures on the unchanged tree quoted below. | DONE |
| Item 6: diagrams | `npm run diagrams` run immediately before the full list; it ends `docs/diagrams/writes.svg`. | DONE |
| ASCII gate (the spec's perl line over `src tests bin config`) | printed nothing (`bin` does not exist in this tree; `find` says so). `LC_ALL=C grep -n '[^ -~]'` over the cockpit files I touched printed nothing except `tools/present/content/present.yml:136`, a line I did not touch. | DONE |

### The full verify list

`npm run diagrams`, then `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md`, the last (passing) run, quoted:

```
$ npm test
 Test Files  426 passed | 22 skipped (448)
      Tests  11199 passed | 621 skipped (11820)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  443 passed | 9 skipped (452)
$ npm run check
COMPLETED 2960 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
(both builds: "built in 32.87s", "built in 1m 18s")
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

Full-list runs: 3 started. The first stopped at `npm test`: `tests/views/whole/sanitise.test.ts` ("is built with inlineMarkdown by every card that draws one") timed out at 5000 ms under load; the file is not changed by this step and passed alone in a rerun (`Test Files 1 passed (1) / Tests 6 passed (6)`). The other six commands I ran one by one: `test:checks` showed two reds in files I changed (`negatives.test.ts` found three absence assertions of `tests/views/academic/present.test.ts` without a reason above them, and the comment-width check found two lines over the column), which I fixed and reran alone (`comment-width`, `negatives`, `present.test.ts`: 29 passed). The second full run I stopped before it finished when I saw its background time limit was too short. The third ran to the end and is the one quoted.

### The new and changed tests on the unchanged tree

Each test file, in its final form, copied into the unchanged copy (code and the original `PRESENT.md` data) and run with `npx vitest run <files> --testTimeout 0`: `Test Files 5 failed | 2 passed (7)`, `Tests 17 failed | 419 passed (436)`. The failures, with the assertion each prints there:

- `tests/data/sources/present.test.ts`, 8 cases: `equationIsImage` does not trim (fails on `' eq_one.png '`); `eq_x.png`, `EQ.PNG`, `'eq_x.png '` each: `expected 'eq_x.png' to be undefined` (and likewise for the other two values); image-only slide, `slides:` entry (finding wording differs); `equation: ''` and `"   "`: `expected '' to be undefined`, `expected '   ' to be undefined`.
- `tests/data/portfolio-config.test.ts` (case 9): `AssertionError: expected 'eq.png' to be undefined`.
- `tests/checks/config/integrity.test.ts` (case 1): `AssertionError: bt-operator-theory: expected 'eq_btfno.png' not to match /\.(?:png|jpe?g|svg|webp)\s*$/i`.
- `tests/views/whole/type-scale.test.ts`: `expected '.gap=fs-md' to be ''`.
- `tests/state/life/present.test.ts`, the six `reads the deck %j as the empty deck` cases: `Deck` still carries `equationsDir`, so the strict comparison fails.

Passing on the unchanged tree and after the change, since they test behaviour the change keeps: `tests/views/academic/present.test.ts` (the eqcard markup holds KaTeX and no `<img`, a broken formula gives `katex-error`, a slide without an equation draws no card) and `tests/server/edit/deck-edit.test.ts`. They are not proof of the change: the view cases would pass with the image branch back, because the data layer no longer produces an image slide, and the proof of that is the sources and portfolio-config tests above. After the change: every touched file passes in the verify list (`npm test` 426 files passed).

## Files and line counts

Written under `projects/` by item 1's script only: the 13 `PRESENT.md` files below, one line each.

| File | Lines |
|---|---|
| `tools/oculus/src/lib/data/sources/present.ts` | 403 |
| `tools/oculus/src/lib/data/index.ts` | 255 |
| `tools/oculus/src/lib/data/model/model-entities.ts` | 669 |
| `tools/oculus/src/lib/state/life/present.ts` | 444 |
| `tools/oculus/src/lib/views/academic/present/parts/Equation.svelte` | 38 |
| `tools/oculus/config/present.yml` | 273 |
| `tools/oculus/config/catalogs/options.yml` | 619 |
| `tools/oculus/config/catalogs/meta.yml` | 5 |
| `tools/oculus/config/text/findings.yml` | 110 |
| `tools/oculus/config/text/views/academic/present.yml` | 26 |
| `tools/oculus/tests/server/edit/deck-edit.test.ts` | 170 |
| `tools/oculus/tests/state/life/present.test.ts` | 821 |
| `tools/oculus/tests/data/sources/present.test.ts` | 487 |
| `tools/oculus/tests/views/academic/present.test.ts` | 313 |
| `tools/oculus/tests/data/portfolio-config.test.ts` | 167 |
| `tools/oculus/tests/checks/config/integrity.test.ts` | 246 |
| `tools/oculus/tests/views/whole/type-scale.test.ts` | 387 |
| `tools/present/build.py` | 361 |
| `tools/present/assets/js/mathconfig.js` | 12 |
| `tools/present/assets/css/deck.css` | 112 |
| `tools/present/assets/vendor/boldsymbol.js` | vendored, one minified line |
| `tools/present/README.md` | 54 |
| `tools/present/content/present.yml` | 139 |
| `tools/present/make_equations.py` | 53 |
| `tools/oculus/docs/diagrams/` | regenerated by `npm run diagrams` |

`boldsymbol.js` is `es5/input/tex/extensions/boldsymbol.js` of `mathjax@3.2.2` (Apache-2.0, taken with `npm pack mathjax@3.2.2` in the scratch folder), unmodified.

## Greps (cases 10 and 11)

- `grep -rn "tools/present" src tests config --exclude=local.yml` prints nothing.
- `grep -rn "equationImage\|equationMissing\|equationsDir\|equationsDirOf\|equationsDirShape\|equationPath\|hubPath\|equation_missing\|equation_alt" src tests config --exclude=local.yml` as the brief wrote it prints lines, because `hubPath` also matches `hubPathsOf` (`src/lib/state/boards/collection.ts` and its users) and a different function `hubPath` in `src/lib/data/sources/manifests.ts:25,101,152`. Neither is the equation code. The same grep with `\bhubPath\b` prints only `manifests.ts:25,101,152`, and every other term prints nothing. This is an error in the brief's grep, not a leftover of the step.
- `grep -rn "equations_dir" src config --exclude=local.yml` prints nothing; the only `tests/` hit is the case 9 test that plants the key.

## The 13 slides and the MathJax probe

Item 1's script output (13 paths, in the script's sorted order): `projects/archive/published/2026/hccnet-fl/PRESENT.md`, `projects/manuscripts/bt-operator-theory/PRESENT.md`, `.../btfno/PRESENT.md`, `.../bttd-source-eeg/PRESENT.md`, `.../bttn-incident-af/PRESENT.md`, `.../covert-applied/PRESENT.md`, `.../covert-theory/PRESENT.md`, `.../dongho-ecg-clustering/PRESENT.md`, `.../dries-bttr-ecg/PRESENT.md`, `.../fed-multicellular-immune/PRESENT.md`, `.../hccnet-revision/PRESENT.md`, `.../meseret-cirrhosis/PRESENT.md`, `.../raw-pls/PRESENT.md` (all except the first under `projects/manuscripts/`).

The probe is `.../scratchpad/m4/probe/deckprobe.cjs` (jsdom installed in that folder only, no repository dependency). Command and result: `node deckprobe.cjs <worktree>/tools/present/present.html`, exit 0. It loads the built page, evaluates the page's own `mathconfig.js` script and its `tex-svg.js` + `boldsymbol.js` script in a jsdom window whose `fetch`, `XMLHttpRequest` and script `src` assignment are recorded and cannot load anything, typesets the page, and per math item counts `merror` nodes and nodes with `mathcolor="red"`. Output:

```
card 1: merror 0 red 0 - \mathrm{PE}(\Delta t_i,2k)=\sin\!\Big(\t        hccnet-revision
card 2: merror 0 red 0 - \theta^{(r+1)}=\sum_{k}\tfrac{n_k}{n}\,\      hccnet-fl
card 3: merror 0 red 0 - \mathcal{L}(x)=\big\|\mathbf{F}-d\,\math      covert-applied
card 4: merror 0 red 0 - \min_{k<K}\mathbb{E}\,\|\mathbf{g}^{k}\|     covert-theory
card 5: merror 0 red 0 - \ell_{\mathrm{Cox}}=-\!\!\sum_{i:\,e_i=1     bttn-incident-af
card 6: merror 0 red 0 - T_\varepsilon=\argmin_{T\in U(a,b)}(1{-}      raw-pls
card 7: merror 0 red 0 - \mathcal{W}=\sum_{r=1}^{R}\big(A_r\,G_r\     btfno
card 8: merror 0 red 0 - \mathcal{W}=\sum_{r=1}^{R}\big(A_r\,G_r\     bt-operator-theory
card 9: merror 0 red 0 - \mathcal{M}\approx\sum_{r=1}^{R}\big[(\m     bttd-source-eeg
card 10: merror 0 red 0 - y=\sum_{k=1}^{K}\langle\,\mathcal{X},\ \    dries-bttr-ecg
card 11: merror 0 red 0 - \mathrm{ARI}=\frac{\mathrm{RI}-\mathbb{E    dongho-ecg-clustering
card 12: merror 0 red 0 - \mathbf{G}=\sum_{s}(\mathbf{X}_s-\bar{\m     fed-multicellular-immune
card 13: merror 0 red 0 - \lambda_k(t)=\lim_{\Delta\to0}\tfrac{1}{    meseret-cirrhosis
negative control n1: merror 1 red 0
negative control n2: merror 0 red 1
bm beta mml has bold-italic: true <mi mathvariant="bold-italic">&#x3B2;</mi>
eqcards 13 with mjx-container 13 bad 0 network attempts []
```

(The project names to the right are added by me from the keys; the card order is the deck's.) The probe's `bad` also counts a literal `\small`, `\bm` or `\text` left in a card's text: none. The 13 slides, file / key / `integrity.test.ts` / MathJax:

| File (under `projects/`) | Key | `integrity.test.ts` | MathJax |
|---|---|---|---|
| `manuscripts/covert-theory/PRESENT.md` | `eq_coverttheory` | passes | 0 / 0 (card 4, `\bm` bold) |
| `manuscripts/bttd-source-eeg/PRESENT.md` | `eq_bttdeeg` | passes | 0 / 0 (card 9) |
| `manuscripts/dongho-ecg-clustering/PRESENT.md` | `eq_dongho` | passes | 0 / 0 (card 11, `\small` rewritten) |
| `manuscripts/raw-pls/PRESENT.md` | `eq_rawpls` | passes | 0 / 0 (card 6, `\argmin`) |
| `manuscripts/btfno/PRESENT.md` | `eq_btfno` | passes | 0 / 0 (card 7) |
| `manuscripts/hccnet-revision/PRESENT.md` | `eq_hccnet` | passes | 0 / 0 (card 1) |
| `manuscripts/dries-bttr-ecg/PRESENT.md` | `eq_driesptb` | passes | 0 / 0 (card 10) |
| `manuscripts/bttn-incident-af/PRESENT.md` | `eq_incidentaf` | passes | 0 / 0 (card 5) |
| `manuscripts/bt-operator-theory/PRESENT.md` | `eq_btfno` | passes | 0 / 0 (card 8) |
| `manuscripts/covert-applied/PRESENT.md` | `eq_covert` | passes | 0 / 0 (card 3) |
| `manuscripts/meseret-cirrhosis/PRESENT.md` | `eq_meseret` | passes | 0 / 0 (card 13) |
| `manuscripts/fed-multicellular-immune/PRESENT.md` | `eq_immune` | passes | 0 / 0 (card 12) |
| `archive/published/2026/hccnet-fl/PRESENT.md` | `eq_hccnetfl` | passes | 0 / 0 (card 2, `\small` rewritten) |

`integrity.test.ts` ("reads an equation out of every slide that writes one, as LaTeX that typesets") asserts over all slides that write an equation: at least 13, equal to the count of `equation:` lines found by walking the `PRESENT.md` files, none ending in an image suffix, none with `katex-error` through `tex(equation, true)`, and no present finding. It runs and passes on the real hub in the worktree (`Tests 10 passed (10)`); it is per-slide in the loop, not a separate case per file.

## Judgment calls the brief left open (each reversible)

1. A blank `equation:` (empty or whitespace) is dropped in `slide()` (`data/sources/present.ts`), ruled in M4-cases point 4. A non-blank value is stored as written, not trimmed; only the image test and the finding's wording use the trimmed text.
2. The finding names the trimmed value (`equation eq_x.png names an image; a slide's equation is LaTeX`), as proposed.
3. `build.py` also has `MATHJAX_EXTENSIONS = ["boldsymbol.js"]`, and the extension's text is appended to the same inline `<script>` as `tex-svg.js` (`build.py`, after `mathjs = slurp(...)`). The extension has to register before MathJax starts; two separate script elements leave a microtask checkpoint between them. `mathconfig.js` lists it in `tex.packages` (`'[+]': ['boldsymbol']`), with `bm: ['{\\boldsymbol{#1}}', 1]` beside `argmin`.
4. `build.py` edits beyond lines 155-162: the docstring sentence at lines 9-10 (it named `make_equations.py` as the equation source), the `MATHJAX_EXTENSIONS` constant, and the script assembly. Two helpers were added: `mathjax_small` (brace-balancing rewrite of `\text{\small X}` to `{\small\text{X}}`; leaves the text alone when unbalanced or when `\small` is a prefix of a longer command) and `equation_card`. A non-string `equation:` (e.g. `3`) draws no card in the cockpit, where the old code would have raised on `os.path.join`.
5. A cockpit `equation` that names a file that does not exist is drawn as LaTeX (the text of the name), by the brief's own rule.
6. `Equation.svelte` keeps its card and `overflow-x: auto`; the `.gap` rule is gone, so the `type-scale.test.ts` row for the file is `''`.
7. `README.md` of `tools/present` also changed at line 18-20's sentence about slide assets, line 30 and line 50 (the brief's lines); `content/present.yml:9` and `make_equations.py:3-6` as the brief says.

## User-visible changes, before and after (for the look)

- Present view, any of the 13 slides (for example `covert-theory`): before, the card drew the committed image from `tools/present/assets/equations/`; after, the card draws the same LaTeX through KaTeX. Compare the 13 against `eq_<id>.png`; the two with `\text{\small ...}` (`dongho-ecg-clustering`, `hccnet-fl`) and `covert-theory` (`\bm`) are the ones whose typesetting differs most between engines.
- A slide whose `equation:` still names an image: before, the image or a "missing equation" line; after, no card and a finding `equation <name> names an image; a slide's equation is LaTeX` (Audit view).
- Settings: the key `deck.equations_dir` is no longer listed, and a `present.yml` still holding it is read without effect.
- Cockpit deck (`present.html`): before, 13 image cards; after, 13 MathJax cards, and the new rule `.eqcard mjx-container{max-width:100%;overflow-x:auto}` lets a formula wider than its column scroll (the SVGs are 40 to 75 ex wide; whether the rule is needed was not measured in a browser). Not verified on screen.

## Anything in the brief wrong or impossible, with evidence

- Item 3's premise that the vendored bundle runs under node: it needs a window (`require` fails with `Cannot find module 'xmldom-sre'`, then `window is not defined`); ruled in M4-cases point 1.
- The brief's check "no `merror`" misses MathJax's red undefined-command text (`\bm`, found in `eq_coverttheory`) and literal `\small` inside `\text{}` (`eq_dongho`, `eq_hccnetfl`); ruled in point 2.
- The case 11 grep matches `hubPathsOf` and `manifests.ts`'s own `hubPath` (above).
- `type-scale.test.ts` needed one row; ruled in point 3.
- `checks.sh` stops at the first failing command, so a timeout in an untouched file hides the six commands after it.

## Limitations I know of

- The probe's jsdom run is not a browser: layout, the width of the formulas against the cockpit column and the bold-italic beta's look are not seen. `\bm{\beta}` is checked as MathML (`bold-italic`), not on screen.
- `tools/present/present.html` and the probe folder are outside the diff (`present.html` is ignored by `.gitignore:132`). The worktree's `tools/oculus/.svelte-kit/` was regenerated by the test runs and the build.
- I ran `git --version` once by mistake; it reads no repository state. No other git command was run.

## Sentences left for O29

`.agents/skills/research-cockpit/SKILL.md` (not edited) step 6:
- line 68-69: "`tools/present/make_equations.py` - only if a **new** project needs a hero equation: add an `eq_<id>` LaTeX entry + re-run it (`pdflatex`+`pdftoppm` -> `assets/equations/`). Otherwise untouched."
- line 76: "`tools/` touch-list is just #5 (present.yml) and, for a new equation, #6 (make_equations.py)."

A new equation is now written as the slide's `equation:` LaTeX in its `PRESENT.md`; `make_equations.py` is no longer a step of a new project.

## Repair round 1

Every ruling of `agents/briefs/M4-round1.md` is done. Not verified: the look on screen. No git command was run in this round.

### Per ruling

1. B1, the space after `\small`: `tools/present/build.py:167-168` (`mathjax_small` writes `tex[after:i].lstrip()` after `{\small\text{`), so `\text{\small kept local}` becomes `{\small\text{kept local}}`. Check: the jsdom probe was extended to print the `mtext` of the rewritten groups and to fail on one that starts with a space followed by text. With `.lstrip()` taken out by hand and the deck rebuilt: `mtext of the rewritten \small groups: ["(federate&#xA0;",")","&#xA0;","&#xA0;kept local","(chance-corrected agreement)"]`, `mtext starting with a space: ["&#xA0;kept local"]`, `bad 1`, node exit 1. With the fix back and the deck rebuilt: `["(federate&#xA0;",")","&#xA0;","kept local","(chance-corrected agreement)"]`, `mtext starting with a space: []`, `bad 0`, node exit 0. The lone `&#xA0;` is the `\ ` space of the source, not part of the group's text.
2. S1: `README.md:33` (hub root) now reads "The only per-project file under `tools/` is `present/content/present.yml` (deck `order:` + the hand-maintained summary tables); a project's equation is the `equation:` LaTeX of its `PRESENT.md`." `README.md` joins the path list.
3. S4: `tools/present/README.md:50` says the deck still draws a value naming an existing image as an image, that no slide does, and that `make_equations.py` keeps the LaTeX each slide's value was taken from and renders it to PNGs. `tools/present/make_equations.py:3-7` says the same: a PNG is drawn only when a slide's `equation:` names its file, and no slide does. No sentence names a cockpit reader of the PNGs.
4. P2: `tests/checks/config/integrity.test.ts:61` (`writtenEquations`) counts the equations of one `PRESENT.md` from its parsed front matter (the `present:` map's and each `slides:` entry's that has a non-empty `id`, a value that is not text or is blank after trimming left out), and `:197` uses it over the hub's files in place of the regular expression. Because the hub holds no `slides:` entry with an equation (`grep -rln "^slides:" --include=PRESENT.md projects` prints nothing), the new case `:275` ("the count of written equations", `integrity.test.ts`) plants a `PRESENT.md` in a temporary directory with a `present:` equation, a `slides:` entry with LaTeX, one blank after trimming, one empty, one numeric and one with no id, and requires `readPresent` and `writtenEquations` to give the same count (2). Red against a reader that drops a `slides:` entry's equation (`slides.push(slide(..., { ...row, equation: undefined }))` in `src/lib/data/sources/present.ts:278`, put back afterwards): `AssertionError: expected 1 to be 2`, `Tests 1 failed | 10 passed (11)`. After: `Tests 11 passed (11)`. The file's `it` now comes from `tests/fixtures/scratch.ts`, which the scratch check requires of a file that takes a scratch directory.
5. ST1: `src/lib/data/sources/present.ts:12-14`, the head comment lists "an `equation:` that names an image (a slide's equation is LaTeX)" among the findings.
6. B3: `tools/present/build.py:337`, `if mathjs:` guards the loop that appends the extensions. Check by hand: with `assets/vendor/tex-svg.js` moved aside and the deck rebuilt, after the fix `extension script present = False` (4493 KB page); with the guard replaced by `if True:` it is `True`; the file was moved back and the guard restored, and the deck rebuilt (6557 KB).
7. B2 and B4, no code change. Before and after: an `equation:` in a `PRESENT.md` that names an image file that does not exist is drawn in the cockpit deck as LaTeX of its name (`build.py` `equation_card`), as the brief's rule says; B1's fix is above. Inputs `mathjax_small` leaves as written (run by hand on `build.mathjax_small`): `\text{ \small X}` (a space before `\small`), `\textbf{\small X}`, `\mbox{\small X}`, `\text{\footnotesize X}` and the other size commands are unchanged; in a nested `\text{\small a \text{\small b}}` only the outer group is rewritten, giving `{\small\text{a \text{\small b}}}`, so the inner `\small` is drawn as literal text by MathJax. None of the 13 slides contains one.
8. S2, S3, ST2, P1: no change, as ruled.

### Probe over the rebuilt deck

`node deckprobe.cjs <worktree>/tools/present/present.html` after `python3 tools/present/build.py` (`Wrote present.html (6557 KB) | 16 project slides (from PRESENT.md)`), exit 0:

```
card 1 to card 13: merror 0 red 0 (13 cards)
mtext of the rewritten \small groups: ["(federate&#xA0;",")","&#xA0;","kept local","(chance-corrected agreement)"]
mtext starting with a space: []
negative control n1: merror 1 red 0
negative control n2: merror 0 red 1
bm beta mml has bold-italic: true <mi mathvariant="bold-italic">&#x3B2;</mi>
eqcards 13 with mjx-container 13 bad 0 network attempts []
```

### The checks

`npm run diagrams`, then `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md`, the last run:

```
$ npm test
 Test Files  426 passed | 22 skipped (448)
      Tests  11199 passed | 621 skipped (11820)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  444 passed | 9 skipped (453)
$ npm run check
COMPLETED 2960 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
(both builds: "built in 14.19s", "built in 35.18s")
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

Full-list runs in this round: 2. The first stopped at `npm test`: `tests/server/git/autofetch.test.ts` ("fetches a clone whose path holds a space") timed out at 5000 ms; the file is not changed by this step, and run alone it gave `Test Files 1 passed (1)`, `Tests 44 passed (44)`. I ran the other six commands one by one: `npm run lint` reported `integrity.test.ts 74:9 Unsafe spread of an any value in an array` and `npm run test:checks` reported `tests/checks/tree/scratch.test.ts` (the file takes a scratch directory and declares cases with vitest's `it`). Both were in the file I changed this round; I fixed them, reran `eslint` on the file (clean) and `integrity.test.ts` with `scratch.test.ts` (`Tests 28 passed (28)`), and ran the list a second time, which is the one quoted.
