# D43 landing

Roadmap entry: oculus/migration (the cockpit-to-oculus migration). Plan step D43, LaTeX navigation through texlab. Next: D36 (linters as VS Code's) and D39 (hub keys as links) are prepared.

## Open items

None.

## The check of Steps 1

The builder aab41ff6fa6e753ea, the brief check a87cb52c4ba0e7cc3 and both reviewers (ab62f7d574ed7cb3f, af1fd189f087d3ca2) had completed; the agent listing showed no agent of this session running.

## Not done

- Not looked at on a page: Go to Definition from a `\ref`, `\cite` completion and hover, the `\includegraphics` completion with its picture preview, the unimath symbols, the weave approval, Restart, and the `latex-unmarked` refusal. Each is covered by the route rows or unit runs named under Verification, not by the look.
- Not looked at on 8790: that server runs main's code and is Axel's to view.

## What landed

From base 3eda0630e, 107 files (+6304 -999) with the fixes at landing:

- texlab as a sixth language server entry for `latex` and `bibtex` (`servers.ts`, `adapters/texlab/`). Its program is `latex.texlab_path` or `texlab` on the PATH, found by `programPath` in `recipes.ts`. Its `workspace/configuration` is answered from the LaTeX settings, and the new `diagnostics` hook drops its `latex`-source diagnostics.
- `.bib` is its own `bibtex` language.
- The Outline shows no symbols, in place of the loading text, for a tab whose server is missing or failed.
- `latex.unimath_symbols` with `config/catalogs/unimath.yml`, and `latex.includegraphics_preview`.
- The latexmkrc and weave approval on every LaTeX step that runs repository code (`pty/latex/approval.ts`, the `approve-latex` terminal action, the status item's wait, the ask `LatexAsk.svelte`). Rerun and Restart of a kept build ask again.
- A language server request for a document whose root left the served roots is answered with nothing (`transport.ts`).
- `DESIGN.md`, `README.md`, `HELP.md`, `docs/views.md`, `docs/files-and-search.md`, `docs/terminals.md`, `docs/window.md` and `docs/configuration.md` where the step made them false.
- G55, G36, G31, G13 and G7 written into `agents/guarded.md` as open item 14 ruled.

## What was found, and the fixes at landing

The builder's first report did not pass its bar; the first review's findings went back in repair round 1, and the review over round 1 found eleven. Nine fixes at landing:

- R1-1: Rerun and Restart of a build whose file is no longer a main are refused `not-a-main` (`latexAgain`, `pty/latex/latex.ts`). Row 'refuses Rerun and Restart of a kept build whose main file is no longer a main, and respawns nothing': on the step as built `expected undefined to be 'not-a-main'`, green after.
- R1-2 (Z737, automode): a kept mark that names no folder takes it from the deepest served root holding the terminal's folder (`targetOfRepo`), and a mark with no step and main file is refused with the new word `latex-unmarked` and its sentence (`model-machine.ts`, `terminal-words.ts`, `config/text/views/academic/latex.yml`). Row 'asks again on Rerun of a kept build whose mark names no folder, and refuses one whose mark names no main file': on the step as built `Cannot read properties of undefined (reading 'latexmkrc')`, green after.
- R1-3: Cancel after a `latex-changed` re-ask keeps an automatic step's wait; `approve` carries the entry's `pressed` through the re-ask (`builds.ts`). The reviewer's PROBE C reads "approval true" after the fix, "approval false" before.
- R1-4: a re-ask keeps the first waiting time (`hold`). PROBE D reads "waiting a.tex" after the fix, "waiting b.tex" before.
- R1-5 (Z737, automode): a build that succeeds releases the clean held before a retry. The probe reads "approval null status succeeded" after the fix; before, the clean's approval stayed.
- R1-6: a `completionItem/resolve` is hooked with the completion list shown when it was asked (`Waiting.listed`, `transport/records.ts`). The probe's hook positions read `[17,19,17]` after the fix, `[17,19,19]` before.
- R1-7: the row 'asks again on Rerun of a kept build that a later press rebuilt with latexmk after a recipe with no latexmk step', which passes on the step as built and after the fixes.
- R1-10 (Z737, automode): G55's text as open item 14 ruled it, and the case-32 route row filed under G31.
- The lint error the gate's first run found at `builds.ts:441` (`run.step === 'build'`, always true there), removed.

`tests/routes/sessions/latex-approvals.test.ts` holds 19 rows, all passing.

Closed in this report:

- R1-8: `tests/routes/sessions/terminal-actions.test.ts:180` changes its expected mark from `latex: { step: 'build', main: 'main.tex' }` to `{ ..., recipe: 'latexmk', target: { id: 'alpha' } }`. On the round-0 tree it fails with `builds one main file with latexmk in the manuscript folder -> expected { ...(4) } to deeply equal { ...(4) }`.
- R1-9: the round's paths outside the brief's list, each needed by ruling 1 or by a sentence the change made false: `pty/sessions.ts` (the mark written before the respawn), `data/model/model-machine.ts` and `data/model/index.ts` (the mark's shape), `terminal/commands.svelte.ts`, `terminal-payloads.ts` and `state/client/context.ts` (Rerun and Restart asking on the page), `docs/window.md` and `docs/terminals.md` (their sentences), `tests/routes/sessions/terminal-actions.test.ts` (the mark expectation of R1-8).
- R1-11: before, Rerun and Restart of a LaTeX build or clean terminal respawned the stored line. Now they are refused when the folder no longer resolves (root not served, project gone), when the recipe in the mark no longer plans, when a program of the plan is not on the PATH, and (R1-1, R1-2) when the file is no longer a main or the mark names no main file. A folder named `latexmkrc` no longer refuses a build, since only files count as a latexmkrc.

Closed without code: the builder's disclosed slips in round 1, a `git -C /nonexistent` appended to a shell line (it failed and read nothing) and a restarted verify chain; the quoted run is the one after the last edit. The reading of ruling 6 (the status item counts the followed main's folder, not the whole served root) was taken in automode as Z737.

## Verification

Gate in `.agents/worktrees/gate` at 827d5b77c with D43's range and the fixes; every staged file is older than the run's log:

```
test:landing: 6 commands, from /Users/axelfaes/workspace/research-hub/.agents/worktrees/gate/tools/oculus
ok      ASCII gate (1.1 s)
ok      npm run lint (12.5 s): > eslint . --cache --cache-location node_modules/.cache/eslint/
ok      npm run format:check (20.6 s): All matched files use Prettier code style!
ok      npm test (131.0 s): Duration  126.42s (transform 35.76s, setup 0ms, import 351.04s, tests 114.36s, environment 158ms)
ok      npm run test:checks (239.6 s): Duration  235.73s (transform 40.52s, setup 0ms, import 150.78s, tests 343.31s, environment 5ms)
ok      npm run check, then npm run build, then npm run test:slow (255.0 s): Duration  171.14s (transform 24.35s, setup 0ms, import 207.47s, tests 308.09s, environment 218ms)
test:landing: 255.0 s; every command passed
```

G48, `npx vitest run tests/server/desktop/start.test.ts` in the gate: 5 of 5 passed; `pgrep app-harness` printed nothing afterwards. Main's staged diff is byte-equal to the gate's (`cmp` of the two `git diff --cached --binary`). The A/B: no `bench:` line, none run. Not covered: nothing here ran on Windows or Linux, and the look covers only the states listed below.

## The look

On a scratch oculus on port 8796 served from the gate, with the gate checkout as its hub and its own `HOME`, over `projects/manuscripts/btfno/manuscript/main.tex`, stopped afterwards:

- The status bar reads "texlab: ready"; the LaTeX tab draws commands, structure and math symbols.
- Hover on `\ref{thm:sep}` shows "Number 1", the theorem's source and "View on PDF".
- Build pressed with a `.latexmkrc` beside the main opens the ask "Run the LaTeX configuration of main.tex?" listing the file's path; Cancel on that pressed build leaves no wait.
- `references.bib` touched: the automatic build waits; the status item takes the warning tone with the tooltip "An automatic build or clean of main.tex waits for your approval of the code it would run. Press to see it." and no dialog opens. Pressing the item opens the ask; Cancel keeps the automatic wait; Approve builds ("built").
- The `.latexmkrc` changed: Rerun on the build terminal asks again; Approve reruns the same terminal ("Rc files read: .latexmkrc ... Nothing to do").

## Agents

- Builder aab41ff6fa6e753ea (claude-sonnet-5-5): 336,904 tokens, 488 tool uses, 120.9 min; round 1 137,048 tokens, 185 tool uses, 47.0 min.
- Brief check a87cb52c4ba0e7cc3 (claude-opus-5-5): 295,723 tokens, 99 tool uses, 14.5 min; closed inline in the brief.
- Reviewer ab62f7d574ed7cb3f (claude-opus-5-5): 346,910 tokens, 90 tool uses, 21.8 min.
- Reviewer over round 1 af1fd189f087d3ca2 (claude-opus-5-5): 306,981 tokens, 77 tool uses, 20.5 min.

First report passed its bar: no. Fixes at landing: 9.

## Next

/spec D36 and /spec D39 (D39's Step 0 holds the `diskName` item); then M7, D41 and D40.
