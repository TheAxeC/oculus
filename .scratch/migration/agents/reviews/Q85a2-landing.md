# Q85a2 landing

Position: roadmap entry oculus/migration (the cockpit-to-oculus migration); Q85a2, `zod` for the untyped input of `src/lib/server/edit`, `sessions` and `transcripts`, landed; 252 of the 289 step lines of `plan.md` are ticked, removed lines left out (`sed -n 5,471p plan.md`: `grep -c '^- '` 300, `grep -c '^- ✅'` 252, `grep -c '^- Removed by'` 11; line 472 opens the "Could run in parallel" section). Next: /spec Q85b and Q85c into the two free slots, while S3c's builder runs.

## Open items (verbatim)

- Z146 (raised 2026-10-01, step U2, its audit's "Proposed grouping", `agents/reviews/U2-audit.md:1126-1138`). How the audit's seven groups become build steps. The groups: 1 the header frame (22 px, one line, title cut with an ellipsis, actions on one line with an overflow menu); 2 control sizes (text button 26 px radius 4px, icon action 20 px with a 16 px glyph and no border, input 26 px, one 1px focus ring); 3 type and row scale (base text 13px, rows 22 px, tree indent 8 px with a 16 px twistie, off-scale sizes removed); 4 icons at 16 px (Z148); 5 row and card actions shown on hover or focus-within; 6 collections as rows (Z147); 7 empty, error and narrow states. The measured footprint of the shared parts: `ui/frame/Pane.svelte` 127 lines and `Toolbar.svelte` 30, used by 51 components; `ToolButton.svelte` 506 lines, used by 137; `ui/frame/Card.svelte` 233 lines, used by 20; 414 of the 442 `font-size` declarations under `src/lib` go through the nine `--fs-*` tokens of `themes/tokens.css`; 13 view files set a fixed px height (`grep -rl`/`grep -rho` over `src/lib`, `wc -l`). (a) One step for groups 1, 2, 3 and 5, which change the shared components and tokens above and so touch the same few files; then group 4 once Z148 is ruled, group 7, and group 6 once Z147 is ruled: four steps. For: no tiny steps; each shared change lands once and is looked at once on TEST. Against: one review covers four kinds of change. (b) Seven steps, one per group, in the order 1, 2, 3, 5, 4, 7, 6. For: each review reads one kind of change. Against: four of them are small edits to the same files. (c) No build steps: the audit stays a record. For: no work. Against: every difference it measured stays. Recommendation: (a). The lazy option is (c). Settings is S3c's, the tab strip X3c's, and the X3d parts of Changes are outside every group.
- Z147 (raised 2026-10-01, step U2, group 6 and differences 7, 10 and 15 of `agents/reviews/U2-audit.md`). Collections drawn as cards (radius 10px, a 3px coloured left rule for the status, 285 to 352 px wide, 15px titles) where VS Code draws 22 px rows with a 13px label and a count badge; it holds for projects, coauthor, archive, pillars, domains, venues, data, code, statements, funding, events, education, applications, joint-work, tasks, radar, leads, inbox, linkedin, usage, gallery, audit, config and project. (a) Rows everywhere: each collection view a list of 22 px rows with a count badge, links without the underline. For: one look across the workbench, as VS Code's. Against: the status rule of a card and the card's room for several lines of detail are lost; the largest change of the audit. (b) Rows on Projects first, looked at on TEST and shown to you, and the other views follow your ruling on it. For: you judge the change on one real view before it spreads. Against: one more look and ruling before the rest is built. (c) Keep the cards and restyle only their controls (groups 2 and 5). For: the cards keep what they show. Against: the views stay unlike VS Code's lists. Recommendation: (b). The lazy option is (c).
- Z148 (raised 2026-10-01, step U2, group 4 and difference 19 of `agents/reviews/U2-audit.md:1124`). Icons are Lucide (`DESIGN.md` "Theming"), drawn at 1em of the text beside them, so 9.5 to 15 px, mostly 11.5 px; VS Code's codicons are 16 x 16 px (`U2-vscode.css` css:241, css:252, css:133). (1) Keep Lucide and draw every icon at 16 px. For: DESIGN.md's decision stands and only the size rule changes. Against: the glyph shapes stay Lucide's, unlike VS Code's. (2) Replace the set with codicons through `config/catalogs/icons.yml`. For: glyph for glyph as VS Code. Against: every glyph id is re-mapped, several domain icons have no codicon, and it reverses DESIGN.md's decision. Recommendation: (1). The lazy option is leaving the icons at the size of their text.

## Not done

Nothing inside the brief. The step changes no view, so it has no look, and `bench: []` in `.agents/plan.yaml`, so no A/B.

## The check of Steps 1

`ListAgents`, run at 11:12, listed one running subagent, S3c's builder. Q85a2's builder a89edd47244a60bc2 and its reviewers a34f1484825697f1c and a890ccc337bb5cdfb were not listed.

## What landed

From base 4f4dcfc4, 54 paths staged on main (`git diff --cached --shortstat`: 2825 insertions, 885 deletions), the fixes at landing among them.

- Every reader of untyped input in `edit`, `sessions` and `transcripts` reads through a zod schema beside it: the write endpoint's bodies, the YAML and JSON files the writers parse, the changes-log values an undo reads, the Claude and Codex transcript records the fold, the turns reader and the usage table read, the fold cache, the overrides file, a Claude registry file and a settings file's hooks.
- The shared helpers live in `core/shapes.ts` (`unchanged`, `mapShape`, `anyNumberShape`, `filledTextShape`, `wholeShape`, `stringItemsShape`, `quickly`, `readAs`, `text`); `core/json.ts` keeps the disk readers and writers.
- A transcript record is read through `quickly`'s schema without repairs first, and through the full schema when that fails.
- A cache entry with a field of the wrong type is dropped, and its transcript is folded from the start.
- `DESIGN.md:148` names every folder of Q85a1, Q85a2 and Q85a4 and what is read in them.

## Verification on main

From `tools/oculus`, after `npm run diagrams` (exit 0; it regenerated `layer-server`, `layers` and `writes`, .dot and .svg):

```
$ npm test
 Test Files  371 passed | 20 skipped (391)
      Tests  6019 passed | 614 skipped (6633)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  442 passed | 9 skipped (451)
$ npm run check
COMPLETED 2839 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

## Fixes at landing (seven)

1. The merge with Q85a4 (`land.sh` exit 2 on five paths): `DESIGN.md:148` joined into one paragraph naming both steps' folders and inputs, with Q85a4's sentence on request bodies; `git-routes.ts` keeps Q85a4's imports, since it no longer calls `text`; `allow-duplication.txt` drops the lines each step folded away; `layer-server.dot` regenerated.
2. `core/json.ts`'s `isMap` comment names its three importers (the run over round 1, Standards 2).
3. `filledTextShape` once, in `core/shapes.ts`, imported by `fold.ts`, `stores/codex.ts` and `root/hooks.ts` (Standards 1).
4. Q85a4's own `anyNumberShape` (`machine/pty/channel.ts`, `files/search.ts`) and its inline number schemas (`files/project-files.ts`, `files/fs/bookmarks.ts`) read `core/shapes.ts`'s.
5. Q85a4's local `mapShape` (`machine/usage/accounts.ts`) becomes `heldMapShape`, built on the shared `mapShape`; `bookmarks.ts`'s item schema is the shared `mapShape`.
6. The cache offset and size read as whole numbers at the read (Spec 1, Proof 1), with a scan case that failed before the fix (`expected [ 1, 1, 1 ] to strictly equal [ 2, 3, 4 ]`).
7. Two head comments rewrapped to the 100-column rule and `bookmarks.ts` formatted, after the first verify run failed `comment-width.test.ts` and then `format:check`.

## What was found

- The first review (Opus): Spec 6, Proof 2, Standards 6, Behaviour 3, closed in round 1.
- The run over round 1 (Sonnet): Spec 1, Proof 1, Standards 2, Behaviour 0, fixed at landing (above).
- Round 0, the builder's hand-back at the cases' first run (case 23's field, the time bound), ruled in `agents/briefs/Q85a2-cases.md`.

## Agents' usage

- Brief check: claude-opus-5-5, 228,189 tokens, 56 tool uses, 9.5 min.
- Builder a89edd47244a60bc2 (claude-sonnet-5-5):

  | Run | Tokens | Tool uses | Time |
  |---|---|---|---|
  | First run (stopped at the cases) | 99,564 | 98 | 22.0 min |
  | After round 0 (the whole build) | 339,566 | 351 | 119.2 min |
  | Repair round 1 | 283,978 | 130 | 42.0 min |

- Reviewers:

  | Run | Reviewer | Model | Tokens | Tool uses | Time | Findings (Spec / Proof / Standards / Behaviour) |
  |---|---|---|---|---|---|---|
  | First review | a34f1484825697f1c | claude-opus-5-5 | 85,236 | 108 | 29.8 min | 6 / 2 / 6 / 3 |
  | Over round 1 | a890ccc337bb5cdfb | claude-sonnet-5-5 | 321,329 | 105 | 23.8 min | 1 / 1 / 2 / 0 |

- The bar: the builder's first report did not pass it. One repair round, seven fixes at landing.

## Next

/spec Q85b and Q85c; S3c's builder; Axel's rulings on Z146, Z147 and Z148.
