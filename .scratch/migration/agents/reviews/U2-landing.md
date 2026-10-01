# U2 landing

Position: roadmap entry oculus/migration (the cockpit-to-oculus migration); U2, the look of every view audited on TEST against VS Code 1.137.0, landed; 251 of the 296 package lines of `plan.md` are ticked, removed lines left out (`sed -n 5,481p plan.md | grep -c '^- '` 307, `grep -c '^- ✅'` 251, `grep -c '^- Removed by'` 11). Next: S3c's builder once its brief check's findings are closed in the brief; Q85a2's landing after its round-1 review.

## Open items (verbatim)

- Z146 (raised 2026-10-01, step U2, its audit's "Proposed grouping", `agents/reviews/U2-audit.md:1126-1138`). How the audit's seven groups become build steps. The groups: 1 the header frame (22 px, one line, title cut with an ellipsis, actions on one line with an overflow menu); 2 control sizes (text button 26 px radius 4px, icon action 20 px with a 16 px glyph and no border, input 26 px, one 1px focus ring); 3 type and row scale (base text 13px, rows 22 px, tree indent 8 px with a 16 px twistie, off-scale sizes removed); 4 icons at 16 px (Z148); 5 row and card actions shown on hover or focus-within; 6 collections as rows (Z147); 7 empty, error and narrow states. The measured footprint of the shared parts: `ui/frame/Pane.svelte` 127 lines and `Toolbar.svelte` 30, used by 51 components; `ToolButton.svelte` 506 lines, used by 137; `ui/frame/Card.svelte` 233 lines, used by 20; 414 of the 442 `font-size` declarations under `src/lib` go through the nine `--fs-*` tokens of `themes/tokens.css`; 13 view files set a fixed px height (`grep -rl`/`grep -rho` over `src/lib`, `wc -l`). (a) One step for groups 1, 2, 3 and 5, which change the shared components and tokens above and so touch the same few files; then group 4 once Z148 is ruled, group 7, and group 6 once Z147 is ruled: four steps. For: no tiny steps; each shared change lands once and is looked at once on TEST. Against: one review covers four kinds of change. (b) Seven steps, one per group, in the order 1, 2, 3, 5, 4, 7, 6. For: each review reads one kind of change. Against: four of them are small edits to the same files. (c) No build steps: the audit stays a record. For: no work. Against: every difference it measured stays. Recommendation: (a). The lazy option is (c). Settings is S3c's, the tab strip X3c's, and the X3d parts of Changes are outside every group.
- Z147 (raised 2026-10-01, step U2, group 6 and differences 7, 10 and 15 of `agents/reviews/U2-audit.md`). Collections drawn as cards (radius 10px, a 3px coloured left rule for the status, 285 to 352 px wide, 15px titles) where VS Code draws 22 px rows with a 13px label and a count badge; it holds for projects, coauthor, archive, pillars, domains, venues, data, code, statements, funding, events, education, applications, joint-work, tasks, radar, leads, inbox, linkedin, usage, gallery, audit, config and project. (a) Rows everywhere: each collection view a list of 22 px rows with a count badge, links without the underline. For: one look across the workbench, as VS Code's. Against: the status rule of a card and the card's room for several lines of detail are lost; the largest change of the audit. (b) Rows on Projects first, looked at on TEST and shown to you, and the other views follow your ruling on it. For: you judge the change on one real view before it spreads. Against: one more look and ruling before the rest is built. (c) Keep the cards and restyle only their controls (groups 2 and 5). For: the cards keep what they show. Against: the views stay unlike VS Code's lists. Recommendation: (b). The lazy option is (c).
- Z148 (raised 2026-10-01, step U2, group 4 and difference 19 of `agents/reviews/U2-audit.md:1124`). Icons are Lucide (`DESIGN.md` "Theming"), drawn at 1em of the text beside them, so 9.5 to 15 px, mostly 11.5 px; VS Code's codicons are 16 x 16 px (`U2-vscode.css` css:241, css:252, css:133). (1) Keep Lucide and draw every icon at 16 px. For: DESIGN.md's decision stands and only the size rule changes. Against: the glyph shapes stay Lucide's, unlike VS Code's. (2) Replace the set with codicons through `config/catalogs/icons.yml`. For: glyph for glyph as VS Code. Against: every glyph id is re-mapped, several domain icons have no codicon, and it reverses DESIGN.md's decision. Recommendation: (1). The lazy option is leaving the icons at the size of their text.

## Not done

Nothing inside the brief. The step writes ledger files only, so it has no code to look at and no A/B (`bench: []`). Seven shots are not committed (below), each measured by computed styles instead. The cause of the Files tab of TEST's pane 0 being reopened last during the audit is not established.

## The check of Steps 1

`ListAgents`, run after 10:51, listed two running subagents, Q85a2's round reviewer and S3c's brief check; U2's builder a00c3a9bf266515e2 and its reviewers ad200f3022d402cec, a0a8d85bdf3420043 and a38a34dca830dcb25 were not listed.

## What landed

`land.sh` printed `worktree git commit: nothing staged, no wip commit made` and `nothing to copy: 86e6d8bb..U2 holds no commit`: the step's output is ledger files, which reach main by copy.

- `agents/reviews/U2-audit.md`: 56 view sections, the common differences and the proposed grouping, committed with the report at 31a11b36 and corrected at this landing.
- `agents/reviews/U2-vscode.css`: the VS Code 1.137.0 rules the audit cites, lines 1107-1115 added at this landing.
- `agents/reviews/U2-shots/`: 81 of the worktree's 88 shots (`ls | wc -l` prints 81). Not committed: `source-narrow.png` and `source-wide.png` (the text of `~/.claude/rules/never-take-the-lazy-option.md`), `present-narrow.png` and `present-wide.png` (the portfolio thesis slide), `education-narrow.png` and `education-wide.png` (institutions and evaluation roles), `customization-wide.png` (a 16 px strip with nothing to measure).
- `plan.md`: B6 of U2's first review (a Customizations row whose file is a symlink outside every root opens a source tab answering HTTP 404) booked under Q35, widened in automode.

## Verification on main

From `tools/oculus`, after `land.sh`'s own run from the repository root failed at `npm test` with `Could not read package.json` (it runs `checks.sh` there):

```
$ npm run diagrams          exit 0
$ sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md
$ npm test
 Test Files  371 passed | 20 skipped (391)
      Tests  5976 passed | 600 skipped (6576)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  442 passed | 9 skipped (451)
$ npm run check
COMPLETED 2838 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

`LC_ALL=C grep -c '[^ -~]'` prints 0 for `U2-audit.md`, `U2-vscode.css` and `U2-refuter.md`.

## Fixes at landing (eight)

Each a finding of the run over repair round 2, small and inside the brief; the refuter report's Closed heading gives each.

1. `customization-wide.png` not committed; the customization State line (`U2-audit.md:853`) says why.
2. The diff editor's live theme switch measured on TEST: a side-by-side diff of `U2-audit.md` opened from the Repositories view (453 x 615 px, both sides class `vs`, background rgb(255,255,255)); the theme switched light to dark and back through the Theme list of Settings with a `requestAnimationFrame` watcher; both sides turned `vs-dark` rgb(18,26,43) and back to `vs` rgb(255,255,255) in the same frame as the page body. `U2-audit.md:1090` states it. No difference, so Group 8 stays out of the grouping. The theme was left on light (body rgb(241,245,249), class empty).
3. `source-narrow.png` and `source-wide.png` not committed; the source State line (`:1035`) names the file as in `~/.claude/rules/`.
4. `present-narrow.png` and `present-wide.png` not committed; the present State line (`:354`) says why.
5. `education-narrow.png` and `education-wide.png` not committed; the education State line (`:278`) says why. The portfolio counts in other shots stay: Z144's classes are session or agent titles, task names, account labels and unpublished research, and the shots looked at with the Read tool show no title, name or path.
6. `U2-vscode.css:1107-1115`: VS Code's own row-action reveal rules (tree view rows, Open Editors, the terminal tabs list, the Problems list), copied from the installed stylesheet. The 29 cites of `css:86` for row and card actions now cite `css:1109, css:1110`; `grep -c "css:86\b"` prints 2, the header-action cites at `:9` and `:1056`.
7. The Problems row cites `css:832` (`grep -c css:832` prints 3) and the Timeline cites name the tree row `css:1089`.
8. The search error (`:233`), difference 13 (`:1112`) and group 7 cite the input message `css:286` as the nearest element and say what VS Code shows for an invalid regex was not measured.

## What was found

- The first review (Opus): Spec 6, Proof 5, Standards 4, Behaviour 0 as numbered findings (B1-B6, P1-P5, S1-S4; its Behaviour section records the state of TEST). Closed in rounds 1 and 2, B6 booked under Q35.
- The run over round 1 (Opus): Spec 4, Proof 2, Standards 5, Behaviour 2, closed in round 2 (the round cap's exception: item 3 unbuilt).
- The run over round 2 (Sonnet): Spec 1, Proof 1, Standards 4, Behaviour 2, all closed at landing (above).
- TEST keeps the audit's footprint: the History filter `transcript`, the Search view showing `error: unclosed group`, Customizations expanded, the Files tab last in pane 0, and the diff tab of `U2-audit.md` this landing opened in pane 1.

## Agents' usage

- Brief check: claude-opus-5-5, 160,458 tokens, 70 tool uses, 9.9 min.
- Builder a00c3a9bf266515e2 (claude-sonnet-5-5):

  | Run | Tokens | Tool uses | Time |
  |---|---|---|---|
  | First run | 244,358 | 528 | 98.3 min |
  | Repair round 1 | 143,324 | 410 | 41.3 min |
  | Repair round 2 | 298,044 | 461 | 29.8 min |

- Reviewers:

  | Run | Reviewer | Model | Tokens | Tool uses | Time | Findings (Spec / Proof / Standards / Behaviour) |
  |---|---|---|---|---|---|---|
  | First review | ad200f3022d402cec | claude-opus-5-5 | 89,273 | 212 | 18.3 min | 6 / 5 / 4 / 0 |
  | Over round 1 | a0a8d85bdf3420043 | claude-opus-5-5 | 343,545 | 188 | 13.6 min | 4 / 2 / 5 / 2 |
  | Over round 2 | a38a34dca830dcb25 | claude-sonnet-5-5 | 274,805 | 134 | 8.2 min | 1 / 1 / 4 / 2 |

- The bar: the builder's first report did not pass it. Two repair rounds (the second under the cap exception), eight fixes at landing.

## Next

Axel's rulings on Z146, Z147 and Z148, which decide U2's build steps. S3c's builder, once its brief check's findings are closed in the brief. Q85a2's landing after its round-1 review.
