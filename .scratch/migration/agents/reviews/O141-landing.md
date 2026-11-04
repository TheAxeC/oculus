# O141 landing

Position: the oculus migration plan (`.scratch/migration/plan.md`), step O141, the Focus lane colours measured in every theme, landed; next: none queued (in flight 0 of 6).

## Open items

None.

## The check of Steps 1

The runner's agent listing (ListAgents) shows no agent of O141: the builder a75e398d248021445 and the reviewers a9237e0891ab87709 and aa99a0f580a6576fd have finished.

## NOT DONE

- The look at the git graph's lanes and the calendar's account colours in the themes whose blue or green changed: the scratch hub's Repositories graph is empty ("Nothing is on the channel yet") and its calendar unconfigured, so neither could be shown. Booked in `agents/reviews/owed-looks.md` under "To take".

## What landed

- `config/catalogs/vocab.yml`: Scope's lane colour `#0e7490` becomes the crimson `#e2374d`; the `focus_lanes` comment (line 182) and the band comment (line 214) give the measured state: with every cluster open, every header 10 or more from the headers beside, above and below it and from the panel in every theme; the 13 pairs that touch only in a collapsed layout and are under 10 in at least one theme, each with its themes.
- `src/lib/themes/derive.ts`: the `LANE_SHARE` doc says the same.
- 25 theme hues of their own, each 10 or more from every status hue of its theme on the hue and on `-txt`, in `rice/catppuccin.css`, `everforest.css`, `gruvbox.css`, `kanagawa.css`, `rosepine.css`, `singles.css`, `themes.css` (dark `--c-slate`) and `vscode.css`; each head comment names its hues and the rule that picked them.
- `utils/migrations/convert-vscode-themes.ts`: a table `ADDED` of the tokens oculus adds to a converted theme, which writes Tomorrow Night Blue's `--c-blue` and `--c-slate`, Solarized Dark's `--c-slate` and Quiet Light's `--c-grey` into `vscode.css`; Tomorrow Night Blue keeps place 47 of the Settings class-word list.
- `src/lib/themes/vscode-map.ts`: the head comment says the converter alone adds the `ADDED` tokens, and an app's colour theme does not get them.

## What was found, and the fixes at landing

- Standards 1 over round 1: nord `--c-blue` `#8493db` becomes `#7281c7`, the first pick of the case-run program's `--hue` on the final tree; Solarized `--c-slate` stays `#aad0d1`, since the first pick `#a4c9cb` puts `--c-grey-d` at 10.4, and the head comment of `rice/singles.css` says Solarized's slate, grey and grey-d were picked in that order.
- Standards 2 over round 1: `vscode-map.ts`'s head comment, as above.
- `vocab.yml:182` names Jobs against Review as "`grey-d` against `slate`" in place of "a dark grey".
- Proof 1 over round 1: `O141-report.md` quotes the case-run program's source and the 312 moved pair measures of the final tree, before and after.
- Proof 2 over round 1: the report's three wrong cells corrected (24.2, 10.7, 16.9).
- Spec 1 over round 1: the report says Tomorrow Night Blue's blue is `#699bff`, not `#003abc`, and why.
- Accepted as built and written to `.scratch/migration/choices.md`: `ADDED` kept in the converter; the hues whose values depart from their names (nord's brown `--c-slate`, `--c-grey-d` lighter than `--c-grey` in nord, onedark and solarized), which ruling 672 (a) named in its cons.
- The automode choices written to `.scratch/choices.md` moved into `.scratch/migration/choices.md`, and `.scratch/choices.md` is deleted.

## Verification

The measures on the final tree, from the gate worktree:

```
bars: open-layout measures under 10 0; bar 2 breaks 0; collapsed-only pairs under 10 13
C11 theme hues changed: 25; under 10 from a status token: 0
C13: each of the 12 header tones "under 10 in 0" against --panel
O140 program: C2 ... 0 pairs under 10
node utils/migrations/convert-vscode-themes.ts --check: 19 themes up to date
--classes: vscode-tomorrow-night-blue at 47
```

The landing list in the gate worktree at main's head f34d3c777, `npm run diagrams && npm run docs:palette && npm run test:quick`, exit 0, after the fixes:

```
test:quick: 12 changed file(s), from git since HEAD
test:quick: 15 test file(s)
ok      prettier (1.1 s): All matched files use Prettier code style!
ok      ASCII gate (1.2 s)
ok      svelte-kit sync (2.7 s)
ok      eslint (14.8 s)
ok      svelte-check (16.5 s): 1793789481244 COMPLETED 581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest slow (39.7 s)
ok      vitest (40.8 s)
ok      vitest checks (60.3 s)
test:quick: 63.3 s; every command passed
```

Not covered: tests that reach no changed file within the import depth, the build, the lint of unchanged files. On main the same range cherry-picked with the fixes, the staged diff equal under `cmp` to the gate's. A/B: none, `bench: []`. The verify list unchanged.

## The look

On a scratch server on 8797 from the gate, with a scratch HOME, each theme set by its body class at zoom 0.5: the Focus lane headers in vscode-dark-modern, nord, solarized, kanagawalotus, everforest and Tomorrow Night Blue, and the band headers in dracula, kanagawalotus and nord. Every header is distinct and readable; Scope's crimson sits beside Blocked's red; everforest's Idea header text is dark. The git graph and the calendar could not be shown (NOT DONE above). The server is stopped and 8797 is free.

## Agents

- Builder a75e398d248021445 (claude-opus-5-5): first run 257865 tokens, 63 tool uses, 16 min 37 s; round 0 320603 tokens, 171 tool uses, 32 min 27 s; round 1 245584 tokens, 135 tool uses, 20 min 44 s.
- Brief check a6792e18665cffd1a (claude-opus-5-5): 179435 tokens, 45 tool uses, 7 min 28 s.
- Reviewer a9237e0891ab87709 (claude-opus-5-5): 251769 tokens, 72 tool uses, 16 min 49 s.
- Reviewer over round 1 aa99a0f580a6576fd (claude-opus-5-5): 234288 tokens, 51 tool uses, 11 min 35 s.

The builder's first report did not pass its bar (a hand-back of item 3, round 0, one repair round). No diagnosis record.

## Next

No step is queued.
