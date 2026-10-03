# D14 landing

Position: roadmap entry oculus/migration (the cockpit-to-oculus migration); D14, LaTeX everywhere, landed. Next: S4, the Settings editor finished, with Z306, SP-a, P-a and ST-a, its look including a draft dropped by a live push.

## Open items (verbatim)

- Z276 (2026-10-02, at Axel's question whether O34 covers the task "A second person in the hub" in `tasks/tasks.yml`): it does not. O34 reads the signed-in person in one place, which is the base that task needs; the task's three parts (a Focus board per person, a private-or-shared marker per field and document with private as the default, the group views of shared deadlines, who waits on whom and the meeting rotation) are in no step, and D10 waits on a second person too. Options: (a) one new step O36 after O34 with those three parts, so the plan ends with the hub usable by your group; (b) leave the task in `tasks/tasks.yml` until someone else works in the hub, as its note says, and open a step then. For (a): the remote server is built with several users in mind and the privacy marker is cheapest to add before anything is shared. Against (a): it builds for people who are not using the hub yet. Recommended (b): the task's own condition is not met, and O34 already leaves the one place a person is read. (b) is also the cheaper option, chosen because the condition is unmet, not because it costs less.
- Z274 (2026-10-02, Axel's word that oculus is now a full IDE rather than a dashboard): a new name for oculus. See the state file's open items for the full entry (where the name lives, options (a) the rename in O33, (b) a step of its own now, (c) keep the name; recommended (a) with scriptorium; (c) is the lazy option).
- Z314 (2026-10-03, the owed look Q81): a Confirm drawn over the update tray. Taking it needs `tasks.skip_permissions` on in `config/behavior.yml` for the look and back off after; the permission classifier refused that edit, so it waits on Axel. Options: (a) Axel allows the edit for the look, which is reverted and checked with `git diff --exit-code -- tools/oculus/config`; (b) Axel takes the point himself on TEST; (c) the point is dropped from the look. Recommendation: (a), since the look then runs as every other look does and leaves no write behind.
- Z315 (2026-10-03, the owed look Q79c): the Live HPC jobs table and a job's log. The cluster was unreachable from this machine (`ssh: connect to host hpc-head1.ewi.utwente.nl port 22: Operation timed out`), which needs the UT network or EduVPN, Axel's account. Options: (a) Axel connects EduVPN and the look is taken then; (b) the point is dropped from the look. Recommendation: (a).
- Z251 (2026-10-02 09:40, all steps): fewer repair rounds. See the state file's open items for the full entry; Axel took (d) through Z253, (a) stands meanwhile, and Z251 is ruled after ten steps have landed under the new rules.

## Not done

Nothing inside the brief. `bench: []`, so no A/B. The seven defects the look found (below) are step D14b, ruled Z318, not fixed here: three need their causes found at /spec, and the rest change the build's terminal, the store's reads and the row menu beyond a landing fix.

## The check of Steps 1

ListAgents at 05:00 listed no subagent, only two idle peer sessions (ordo-01, research-hub-d8). D14's builder `aaadccaabfd482ca7` and its reviewers `a3769009482f05dfa` and `a9abcd12e349e6eea` were not listed.

## What landed

From base eaf8034f, on main with the landing fixes (`git diff --cached --shortstat` at the commit, quoted in the commit's booking).

- The LaTeX view `latex`, instance state `{ root, path }`, opened by Open LaTeX in the Files row menu on a `.tex` file or a folder whose listing holds one; the tab draws the `journals` glyph.
- The folder forms of `/api/latex` (`root` with `path`, `file`, `outline`, `count`) beside the project form, which gains `outline` and `count`; the `latex` action of the terminal route for a folder's main.
- Several mains per folder, each with build, clean, PDF, log, Count Words (texcount) and its outline; the build is latexmk with the program a magic comment names.
- Build on save under `latex.auto_build` (`on_save` by default, or `never`), one build at a time per main file, and a Build press while a build of the main is under way shows that build's terminal and builds once more after it.
- The build log's errors and warnings as markers in a source tab and as the problems list; the math hover (KaTeX) and the picture hover.
- Format Document on a `.tex` source tab through the program `latex.formatter` names (`none`, `latexindent`, `tex-fmt` or `badness`, default `none`), each with a path key, found on PATH when empty (Z280 (c)).
- One LaTeX reader at `data/prose/latex.ts` (latex-utensils), the Files Outline included, held per client state as `latexReader`.
- Every LaTeX refusal a word whose whole sentence is a catalog key (Z317).
- `HELP.md`, `DESIGN.md`, the text catalogs, `behavior.yml`, `options.yml` and the regenerated diagrams.

## Verification on main

`npm run build` alone first (exit 0), then from `tools/oculus`:

```
$ npm test
 Test Files  536 passed | 24 skipped (560)
      Tests  13358 passed | 640 skipped (13998)
$ npm run test:checks
 Test Files  30 passed | 2 skipped (32)
      Tests  467 passed | 9 skipped (476)
$ npm run check
COMPLETED 3231 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

The slow-tagged tests are outside the verify list. The two that fixes 12 and 13 concern pass: `npx vitest run tests/server/core/paths.test.ts tests/data/helpers/files/paths.test.ts` 2 files, 19 tests passed; `npx vitest run tests/server/edit/yaml/yaml-edit.test.ts` 1 file, 58 tests passed.

## Fixes at landing

The findings of the run over repair round 1 (`agents/reviews/D14-refuter.md`, "Closed"), each small and inside the brief:

1. Behaviour 1 and Standards 1: `run()` in `state/sessions/latex.svelte.ts` for a build of a main whose build is under way (`underway`: its request out, its terminal not yet listed, or its terminal live) sets `again` and answers that build's terminal, the request's answer while it is out, and starts no second latexmk; `build()` keeps its own check so a save never waits. Two cases in `tests/state/sessions/latex/building.test.ts` ("a Build press while a build of the main file is under way"); with the check in `run()` replaced by `if (false)` both fail ("Tests  2 failed | 11 passed (13)"), and with it 13 of 13 pass.
2. Behaviour 3: a terminal the sessions list never named ends only once `GET /api/terminal` (`readListed` in `state/sessions/terminal/pty-io.ts`) lacks it; a failed read keeps the build. Three cases replace the old one (three pushes with the server holding the terminal, 3 GETs; the server not holding it; a failed read and then a read that ends it); with `void confirm(key, one)` replaced by `finish(key, one)` two of them fail ("keeps one build across pushes that lack its terminal while the server still holds it", "keeps the build when the read of the server list fails, and ends it at a later read").
3. Behaviour 2, Spec 1 and Standards 5: `outlineOf` answers `{ sections, partial, unread }`; a main the parser refused is listed under `partial` and drawn "not fully read: <file>", a file over 2 MB or unreadable under `unread` and drawn "not read, over 2 MB or unreadable: <file>", and "The file holds no sections." only when both are empty; the scan's doc comment names its three known differences from the parser (`\verb`, a title ending in `\\`, a one-line verbatim block). A view case for an unread main file.
4. Standards 2 and 3 (Z317): every refusal of the LaTeX endpoint and of the terminal route's `latex` action is a word (`LATEX_REFUSALS` in `data/prose/latex.ts`, the ops words `outside` and `missing`), its sentence a `refused_*` key said through `refusedAnswer`; no engine word is filled into a sentence, and a root without a path is refused `not-an-action`.
5. Standards 4: the lazy reader is held per client state (`latexReader`, made by `createLatexReader()` in `state/client/context.ts`), not at module scope, since the spec forbids module state and the kit's `let loading` precedent is not a ruling.
6. Standards 6: `mains` and `buildState` stay exported, as brief item 1 names them.
7. Z280 (c): the four keys in `behavior.yml`'s `latex:` section with their `options.yml` entries (a choice and three paths) and Settings editors; `latexFormatting` in `data/sources/config/settings.ts`, checked at boot (`server/root/context.ts`), with a boot refusal test that fails without the check and a `describe('latexFormatting')` in `tests/data/sources/config/settings.test.ts`; Format Document sends the file's name, and the endpoint runs `latexindent -s -`, `tex-fmt --stdin` or `badness format --stdin-filepath <file> -`.
8. Proof 1: the per-test lines of the builder's final tests on the unchanged tree and on the tree before repair round 1 are `agents/reviews/D14-first-runs.txt` (1624 lines; 185 failed and 1378 passed lines over the two runs). The test the round run found passing before the round, `building.test.ts` "starts a new build after a terminal the list never named, once pushes found it absent", is replaced by the three cases of fix 2.
9. Proof 2: the line counts after the last change, by `wc -l`: `latex.svelte.ts` 744, `building.test.ts` 305, `folder.test.ts` 647, `latex-fixture.ts` 94, `views/academic/latex.test.ts` 335, `data/prose/latex.ts` 306, `endpoint.ts` 287.
10. Proof 3: the builder's async table, two cells corrected: `onSaved` "after close or forgotten" and `build` "after close" cannot occur, since the store builds whether or not a view is open; the tests the cells named test a filter and a failed request.
11. Proof 4: DONE row 4's proof (`tests/views/sources/files/menu/latex-menu.test.ts`) is an audit: its cases are titled "audits that", as the tree check requires of a case under `tests/views/` that does not render.
12. The slow-tagged `tests/server/core/paths.test.ts` names the only four functions called `inside` or `inside...` under `src` (lines 89-102); D14's two are renamed: `inside` in `ui/controls/editor/kit/latex.ts` to `resolveAgainst`, and `inside(text, group)` in `data/prose/latex.ts` to `groupText`.
13. The slow-tagged real-hub walk of `tests/server/edit/yaml/yaml-edit.test.ts` skips side-tier rules (`!isSideTier(rule)`); it was red on main's head 248bb23a before D14, shown on a clean detached copy.

## The look (TEST, localhost:8790, tab 812136282)

Dark theme, 2026-10-03 04:30 to 05:00, on a scratch folder `zz-look-d14/` at the hub root (first `main.tex` and `sec/b.tex`; then two mains, `main.tex` and `other.tex`, and `fig/dot.png`), removed afterwards; `~/.oculus/changes.jsonl` (f3d06124, 37 lines), `workspaces.json` (1bf5d57a) and `config/behavior.yml` (231c72f8) hash as before the look, `~/.oculus/history` holds the same 3 folders, and no latexmk, pdflatex or texcount process is left.

Seen working:
- Open LaTeX in a folder's row menu (once its listing is held) and on a `.tex` file; the LaTeX tab with the `journals` glyph.
- The outline (Intro, Part B from `sec/b.tex`, End); a folder with two mains draws both rows, each with build, clean, count words and outline.
- Count Words: "12 words", the same as `texcount -1 -sum -inc main.tex`.
- A first build: the building line, then "PDF 04:40", "1 problems" and "1 errors, 0 warnings"; the marker hover "Undefined control sequence. latex".
- Two Build presses during one build sent one POST.
- The confirming reads of `GET /api/terminal` for a terminal the sessions list had not named.
- The math hover (KaTeX).
- Format Document with `latex.formatter: tex-fmt` removed line 11's indent; with `none` it asked `/api/latex` (409) and drew "No LaTeX formatter is chosen. Choose one under latex.formatter in Settings."; `behavior.yml` put back and its hash checked.
- The project tab (MoBTE, `projects/manuscripts/btfno`) draws the shared rows for its three mains (`main.tex`, `ReproducibilityChecklist.tex`, `supplement.tex`) with their PDF times and "no errors"; nothing was pressed there.
- `latexindent` (a Perl module missing from the local install) and `badness` (not installed) were not run here; their command lines are covered by the endpoint's tests with stand-in programs.

Seven defects found, booked as step D14b (Z318):

1. A build whose latexmk exits at once (its PDF up to date): the Terminal tab is shown for a tmux session that has already ended, its `resize` POST is refused 400 with tmux's own text "can't find window: oculus-2dadf3-shell", and the tab stays empty, so latexmk's output is lost. The other ordering of the same race refuses the start itself: `startTerminal` (`server/machine/pty/sessions.ts:426-466`) runs `set-option` and `listTerminals` after the session ended, shown on a private tmux socket (`tmux -L d14probe` `set-option` exits 1, "no server running").
2. A first build of `other.tex` wrote `other.pdf`, and the row kept "no PDF yet": POST /api/terminal at 22.9 s, the folder read at 23.2 s, the confirming GET /api/terminal at 23.4 s, and no folder read after the build ended. The row caught up only at the next build's read.
3. The LaTeX view opened again after its folder changed sent no GET to `/api/latex` and drew the old answer (one main, "PDF 04:40", "1 errors") for a folder that by then held two mains and no PDF; only a reload of the page read it again.
4. Cmd+Z after Format Document did not undo the format, though HELP.md calls it an undoable edit; typing is undone.
5. The problems button says "1 problems".
6. `funding/2026-nwo-enw-xs/proposal-ls`, which holds `main.tex`, offers no Open LaTeX in its row menu until it has been expanded (`row-menu.ts:180-185` reads only a held listing); after expanding, the item is there.
7. The picture hover over `\includegraphics[width=2cm]{fig/dot}` draws an empty box: the image loads (`/api/file/hub/zz-look-d14/fig/dot.png`, natural width 16) but draws 0 by 0 px inside a 22 by 14 px widget, which was sized before the image loaded.

Not a defect, on reading: the Files tree hides `other.aux`, `other.log` and `other.fls` because the hub's `.gitignore` ignores them (lines 87, 88, 93) and Show Ignored Files is off by default, as HELP.md says.

The tabs the look opened are closed; TEST keeps its other 55 tabs.

## Agents' usage

- Brief check (claude-sonnet-5-5): 272,742 tokens, 109 tool uses, 15.3 min.
- Builder `aaadccaabfd482ca7` (claude-sonnet-5-5, ordo-high): 262,810 tokens, 505 tool uses, 234.3 min; round 1, the same builder resumed: 265,815 tokens, 316 tool uses, 86.2 min.
- Reviewer `a3769009482f05dfa` (claude-opus-5-5, ordo-high), first run: 329,067 tokens, 85 tool uses, 22.0 min.
- Reviewer `a9abcd12e349e6eea` (claude-opus-5-5, ordo-high), over round 1: 285,766 tokens, 78 tool uses, 20.7 min.
- The builder's first report did not pass its bar; one repair round; thirteen fixes at landing, Z280 (c) among them.
