M4 HANDED BACK BEFORE ANY CHANGE. NOT DONE: items 1 to 6 (nothing built). The worktree holds no edit of mine. Four things need your ruling first: the MathJax bundle does not run under bare node (brief item 3), the brief's `merror` check passes while the cockpit deck would draw wrong output for 3 of the 13 equations, a test file outside the path list needs one line, and the cockpit CSS may need a rule. M4-report.md is not written because there is no end state to report yet.

Open items of the state file (`orchestrator-state.md:169-182`): the section is empty. No item is open.

## 1. Item 3: the vendored MathJax does not run under bare node

The vendored `tex-svg.js` is MathJax 3.2.2, the browser build. The probe ran from `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/m4/probe`, outside the repository.
- Under bare node, `require` of the bundle fails with `Cannot find module 'xmldom-sre'`. `wicked-good-xpath` and `commander` are also missing.
- With those three stubbed, the next error is `MathJax(?): window is not defined`. The bundle has no lite adaptor (`grep -c liteAdaptor tex-svg.js` prints 0).
- It does run inside a jsdom window with `runScripts: 'outside-only'`. I installed jsdom with `npm install jsdom` in that scratch folder only. The repository gained no dependency.

Under jsdom, all 13 values typeset as `\[ ... \]` cards (`probe/probe2.cjs`, `values` mode). Counting a `merror` node in each item's `root.walkTree`, 0 of the 13 had one.

Ruling needed: is the jsdom-in-scratch probe acceptable for item 3 and case 12? The brief says to hand back when the bundle cannot run under node. Recommendation: yes. The lazy option is to skip the typeset check and trust the browser.

## 2. The brief's `merror` check misses three equations the cockpit deck would draw wrongly

The same probe also counted nodes with `mathcolor="red"`. MathJax 3.2.2 draws an undefined control sequence as red text, not as `merror`. Negative controls fire: `x^2^3` gives `merror:1` and `\undefinedcmd{x}` gives `red:1`.

On the 13 values with the brief's macro set (`argmin` only), the check "no `merror`" passes all 13, but:
- `eq_coverttheory` (the covert-theory slide) has `\bm`, which MathJax does not define. The deck would show `\bm` in red.
- `eq_dongho` (the dongho-ecg-clustering slide) has `\text{\small(...)}` and `eq_hccnetfl` (the archive/published/2026/hccnet-fl slide) has `\text{\small(...)}` and `\text{\small kept local}`. MathJax does not expand macros inside `\text{}`, so the deck draws the literal text `\small(chance-corrected agreement)` and `\small(federate ...`. Evidence: `probe/mml.cjs` prints `texts: ["\\small(chance-corrected agreement)"]`.

I tested these fixes in the probe:
- `bm: ['{\\mathbf{#1}}', 1]` added to `tex.macros` beside `argmin`. `\boldsymbol` is not usable, because MathJax autoloads it from the CDN and the deck is offline (`MathJax retry`). Cost: `\bm{\beta}` draws a plain beta, not a bold one.
- A rewrite `\text{\small X}` to `{\small\text{X}}`, applied in `build.py` before the value is emitted (a brace-balancing scan of about 10 lines), MathJax-side only. The PRESENT.md values and `make_equations.py` stay byte-identical. With both fixes, all 13 give `merror:0, red:0`, and no literal `\small` is left.

Ruling needed:
- (a) Apply both fixes in `build.py` and `mathconfig.js`, and make the build assertion count `merror` and red nodes. Recommended.
- (b) Accept the three defects in the public deck. This is the lazy option; it ships a visibly wrong deck.
- (c) Change the LaTeX of the three entries. This breaks Z224/Z234 and the PNG regeneration. Not recommended.

The `\small` rewrite is a user-visible mechanism that no decision names.

## 3. A path outside the brief's list is needed

- `tools/oculus/tests/views/whole/type-scale.test.ts:153` holds `'academic/present/parts/Equation.svelte': '.gap=fs-md'`. Item 2 removes `.gap` from `Equation.svelte`, so the entry must become `''` or that test fails. Request: one line in that file.
- (Possible) `tools/present/assets/css/deck.css:69-70`: `.eqcard img{max-width:100%;height:auto}` has no rule for the MathJax SVG. The 13 SVGs are 40 to 75 ex wide (`probe/width.cjs`; the widest is `eq_meseret` at 75.1 ex). The columns cannot be measured without a browser, so I cannot say whether a rule like `.eqcard mjx-container{max-width:100%;overflow-x:auto}` is needed. Request: permission to add it, to be seen at the look.

## 4. First run of the cases on the unchanged tree

The baseline is a copy of the worktree at `.../scratchpad/m4/base`. It holds `tools/oculus` and `tools/present` copied, `projects` copied with files of 1 MB or less, and the other hub folders symlinked. I ran `tests/scratchm4/first.test.ts` there (`npx vitest run ... --reporter=verbose --silent=false`), grep for cases 10 and 11 in the worktree, and `python3 tools/present/build.py` in the baseline.

| Case | Result on the unchanged tree |
|---|---|
| 1 | Original data: 13 slides carry `equation: eq_<id>.png`, `equationImage` set, 0 present findings. With item 1's script applied to the baseline copy of the data, code unchanged: 13 slides, 0 present findings, 0 `katex-error` in `tex(equation, true)`. |
| 2 | An `Equation.svelte` render of `\min_{x} f(x)`: `katex` present, no `<img`. Already holds. |
| 3 | `eq_x.png` and `EQ.PNG`: `equationMissing` and finding "equation eq_x.png is in neither the deck's equations folder nor present/". `'eq_x.png '`: no finding, the card is drawn as LaTeX (`equationIsImage` has no trim). No `equation_image` finding exists. |
| 4 | Only field `equation: eq_x.png`: one slide, `hasSlideContent` true, missing-image finding. |
| 5 | `slides:` entry: finding keyed `alpha/data`, missing-image wording. |
| 6 | No `equation:`: no card, no finding. `equation: ''` and `equation: "  "`: `slide.equation` is `''` or `'  '`, `hasSlideContent` true, and an empty `eqcard` is drawn. The brief wants no card, so `slide()` must drop a blank equation (a judgment call to list). |
| 7 | `\frac{` gives KaTeX `katex-error` markup, no crash. Already holds. |
| 8 | `equation: 3` and `[a, b]` give no equation. Already holds. |
| 9 | `deckFrom({deck:{equations_dir:'tools/x'}}).equationsDir` is `'tools/x'`, so the key does something today. |
| 10 | `grep -rn "tools/present" src tests config --exclude=local.yml \| wc -l` prints 12. |
| 11 | The first grep prints 92 lines and `grep -rn "equations_dir" src config --exclude=local.yml` prints 9. |
| 12 | Original data: `present.html` has 13 `<div class="eqcard"><img src="data:image/png` and 0 `\[` cards. With item 1's data and unchanged `build.py`: `class="eqcard"` count 0, so no equation is drawn for any slide, as the brief says. |
| 13 | Original data: image cards drawn, 13. |
| 14 | Not run (the look at landing). |

No case is wrong under the brief's own rules. Case 6 needs the blank handling above. Case 3's finding names the trimmed value by my choice, reversible. The baseline `build.py` run read a `projects` copy with large figures dropped (24 figures embedded); the figure count is not comparable to the worktree's.

## 5. Premises checked
- `grep -rn "equation: eq_" --include=PRESENT.md projects` prints 13 lines, as in the brief's table.
- No `config/local.yml` exists in the worktree. I did not read it.
- `tools/present/present.html` is ignored (`.gitignore:132`).
- The only files in the worktree newer than my start are the `.svelte-kit/` generated files from my one `integrity.test.ts` run; `.svelte-kit/` is a build artifact.

## To resume
Send the rulings on sections 1, 2 and 3. I then build items 1 to 6 as the brief says, plus whatever you rule in section 2. I write tests in their final form first and run them against the baseline copy, so the report can quote each failure on the unchanged tree. I run the full verify list once at the end. The reusable probe scripts are in the `probe/` and `base/` folders named above.
