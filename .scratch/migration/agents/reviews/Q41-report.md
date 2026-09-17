# Step Q41 builder report

NOT done: the comment at `src/lib/views/Focus.svelte:72-76` is now false and I have not fixed it, because the brief bars editing any view. It still says the strip's people and venue tallies read only the three live tiers. The replacement text is under "Doc text". Everything else in the brief is done.

**Open item for you to rule on (a premise found wrong).** Neighbouring lanes are now at least 10 apart under every theme, but only by giving up most of the lanes' colour meanings. The brief assumed the meanings could mostly stay.
- **Why:** a lane header is 20% hue mixed into the panel, and several themes give different hue names near-identical values (dracula: blue, grey and slate are the same; gruvbox: violet, magenta, pink and mauve are the same).
- **What that forces:** the usable hues split into two groups, and neighbours must come from opposite groups:
  - A: amber, blue, brass, cyan, cyan-d, gold, green, green-d, honey, lime, sky, teal
  - B: crimson, magenta, mauve, orange, pink, purple, red, red-d, rose, violet
  - grey, grey-d, slate and indigo are 10 apart from no other hue in every theme, so they cannot be used at all.
- **Consequences:**
  - Run green and Blocked red cannot both hold: they sit four places apart, so they must come from the same group.
  - With the Ideas lane fixed at mauve (B), Blocked must come from group A, so it cannot be red at all.
  - Push, Review, Backburner, De-risk and Jobs must come from group B.
- **How I measured it:** a search over all 26 hues x 17 themes in scratch, confirmed by the test.
- **Possible fix, not built (only a scratch reimplementation of the mix, outside my paths):** raise the lane share (`LANE_SHARE`) in `themes/derive.ts`. At 0.35, Run green, Push blue, Revise amber, Blocked red, Backburner grey, Scope cyan-d, De-risk indigo, Build teal, Funding gold, Jobs violet and Teaching teal all hold at 10 or more; only Review cannot be violet. The lane text contrast at that share is not measured.

## DONE / NOT DONE
| Item | State | Proof |
|---|---|---|
| 1 Strip counts every project the board shows | DONE | `npx vitest run tests/state/focus.test.ts`: 46 passed |
| 2 Neighbouring headers at CIEDE2000 10 or more | DONE (meanings mostly lost, see above) | `npx vitest run tests/lane-distance.test.ts`: 20 passed |
| 3 Distance test under every theme | DONE, `tests/lane-distance.test.ts` | same |
| Contrast test shares the theme derivation | DONE, through `tests/themes.ts` | full suite green |
| Focus.svelte comment corrected | NOT DONE (view path barred) | - |
| `npx vitest run --reporter=dot` | Test Files 240 passed, Tests 4050 passed | second run; the first run's `server/git.test.ts` timeout and `mail/poll.test.ts` failure both passed alone (41 passed) and in the rerun |
| `npm run check` | 1193 FILES 0 ERRORS 0 WARNINGS | |
| `npm run build` | exit 0 | |
| `npm run format:check` | All matched files use Prettier code style | |
| `npm run lint` | exit 0 | |
| ASCII gate (perl command in the brief) | printed nothing | |
| `yaml.safe_load` on vocab.yml | exit 0 | |
| `npx playwright test` on focus-look, focus-buttons, focus-drag | 8 passed | |

## Measure and neighbours
- **Measure:** CIEDE2000 of 10 or more. `derive.ts` has no colour-distance measure, only the WCAG contrast ratio.
- **Neighbours (my decision, reversible):** each header and the next one in the order the markup draws them: the lanes cluster by cluster, then Ideas, Funding, Jobs, Teaching. That is 12 pairs, and also the stacking order of the one-column layout.
- **Why the wider set is not used:** the fuller grid reading is impossible. With the full-width Ideas lane touching all of Scope, De-risk, Build, Funding, Jobs and Teaching, no hue for the Ideas lane works: the best is 8.5 with mauve, and no hue at all reaches 10.
- **Pairs not held, after the change:**
  - Wide layout, same column: revise/backburner 5.47 (mocha), blocked/derisk 7.90 (rosepine); the other same-column pairs clear 11.
  - Full-width Ideas lane: derisk/holding 0.00 (gruvbox); holding/teaching 9.90 (rosepine); scope/holding 11.14.
  - When a band column is empty and hidden: holding/jobs 0.00 (gruvbox), funding/teaching 3.37 (everforest).

## Lane colours, before and after
| Lane | Before | After |
|---|---|---|
| Run | #16a34a green | #16a34a green |
| Push | #2563eb blue | #e2374d crimson |
| Revise | #b45309 amber | #b45309 amber |
| Review | #7c5cff violet | #e2374d crimson |
| Blocked | #dc2626 red | #f59e0b honey |
| Backburner | #64748b grey (palette `muted`) | #b91c1c red-d |
| Scope | #0e7490 cyan-d | #0e7490 cyan-d |
| De-risk | #6366f1 indigo | #ec4899 pink |
| Build | #0d9488 teal | #0891b2 cyan |
| Ideas (not changed) | #b5638a mauve | #b5638a mauve |
| Funding | gold | lime |
| Jobs | violet | magenta |
| Teaching | teal | teal |

No `palette:` additions were needed.

## Smallest neighbour distance per theme
| Theme | Before | After |
|---|---|---|
| light | 8.46 backburner/scope | 11.09 push/revise |
| dark | 6.86 backburner/scope | 11.08 push/revise |
| vscode-dark-modern | 9.58 backburner/scope | 13.12 push/revise |
| vscode-light-modern | 8.46 backburner/scope | 11.09 push/revise |
| mocha | 6.97 review/blocked | 10.75 push/revise |
| gruvbox | 6.20 derisk/build | 15.71 derisk/build |
| nord | 4.24 derisk/build | 10.30 build/holding |
| synthwave | 6.45 run/push | 11.37 push/revise |
| tokyoneon | 11.96 backburner/scope | 19.14 scope/derisk |
| tokyonight | 6.87 scope/derisk | 11.87 build/holding |
| rosepine | 6.20 run/push | 11.14 build/holding |
| everforest | 4.22 backburner/scope | 13.58 scope/derisk |
| dracula | 11.95 backburner/scope | 12.94 push/revise |
| kanagawa | 6.31 backburner/scope | 11.42 push/revise |
| solarized | 4.86 backburner/scope | 16.44 backburner/scope |
| latte | 11.09 backburner/scope | 18.61 push/revise |
| gruvboxlight | 5.34 backburner/scope | 11.32 holding/funding |

## Reverts run (each restored afterwards; files compared equal with `cmp`)
- **Waiting back to `if (!live(project)) continue;`:** 2 failed. Both "counts ... on a lane" tests get Some One 1 where 2 is expected.
- **Waiting condition dropped entirely:** 1 failed. "leaves a project of another tier that is on no lane out" gets count 7 where 1 is expected.
- **Old lane colours put back:** 14 failed (every theme except tokyoneon, dracula and latte), with 37 pairs named. Examples: "nord: derisk (indigo) / build (teal) = 4.24", "everforest: backburner (grey) / scope (cyan-d) = 4.22", "gruvboxlight: review (violet) / blocked (red) = 5.69".
- **The `rt` term dropped from ciede2000:** the reference-pairs test fails, 1.6080 against 2.0425.
- **The Ideas lane taken out of `heads`:** 18 failed (the drawing-order test and all 17 themes: length 11, not 12).

## Visible changes
- **Before:** a coauthor or archive project on a lane that is waiting on a person or submitted to a venue adds nothing to the strip. **After:** it adds to that person's or venue's count. A project of another tier in holding, or off every lane, still adds nothing.
- **Lane colours:** every lane and column header, and each lane's top border and drag highlight, change colour as in the table.
- **Not looked at in a browser:** I took no screenshots.

## Doc text
**HELP.md**, append to the `focus` row (line 74):
"The Awaiting a response strip counts the people and venues of every project a board card stands for: the ideas, active and manuscripts projects, and a project of any other tier on a lane. Each lane header and each Funding, Jobs and Teaching header has a colour chosen to differ from the header drawn next to it under every theme."

**DESIGN.md**, three changes:
- Add under `tests/` after `contrast.test.ts` (line 111): `    lane-distance.test.ts      neighbouring Focus lane headers, every theme, CIEDE2000 at least 10`
- Append to the paragraph at line 228: "The lane surfaces are also measured against each other: `tests/lane-distance.test.ts` derives every theme through `tests/themes.ts`, the derivation the contrast test reads, and holds each lane header at a CIEDE2000 of 10 or more from the next one drawn."
- New log entry. It supersedes the clause at line 330 that says the people and venue tallies stay over the three live tiers:
  "- 2026-09-17, Axel: the awaiting strip counts what the board shows. `waiting()` tallies the people and venues of every live project and of every project `laneItems` draws on a lane, whatever its tier, so every card that says "Waiting on" is counted; a project of another tier in holding or on no lane is not. The colours of `focus_lanes` and `focus_lane_tones` are chosen so each header differs from the next one drawn (the lanes cluster by cluster, the Ideas lane, then the Funding, Jobs and Teaching columns) by a CIEDE2000 of 10 or more under every theme, and `tests/lane-distance.test.ts` holds it. Package Q41."

**Focus.svelte:72-76**, replacement comment:
"The projects quick add may write to: the three live tiers, the ones the ideas backlog reads. The awaiting strip's people and venue tallies read them and every project of another tier drawn on a lane, since a lane draws a project of any tier whose `focus:` names it."

## Files changed
All under `tools/oculus/`:
- `config/vocab.yml` (+9 -8)
- `src/lib/state/focus.ts` (+20 -9)
- `tests/state/focus.test.ts` (+45 -5)
- `tests/contrast.test.ts` (+5 -20)
- `tests/lane-distance.test.ts`, new, 215 lines
- `tests/themes.ts`, new, 34 lines
- `tests/config-folder.test.ts` (+2 -2) and `tests/views/focus.test.ts` (+9 -3). Both are outside decision 4's list; they pinned `gold`/`violet` and went red with the tone change. The views test now reads the funding tone from config and asserts it is not the stage green.

## Judgment calls and limitations
- `tests/themes.ts` is a new helper file. The brief allowed editing `contrast.test.ts` "only to share its theme derivation", and a shared helper was the way to do that.
- `waiting()` reuses `laneItems` itself to find the projects on a lane, so the rule exists once. It costs one extra lane sort per call; that cost was not measured.
- Push and Review now share crimson. They are not neighbours, but the same colour sits in two clusters.
- The CIEDE2000 code lives only in the test file. It is checked against 9 rows of Sharma, Wu and Dalal's published table and two sRGB-to-Lab values.
- The "names the closest pair" case prints and asserts only that the distance is above 0.
- No `.scratch`, hub data, `HELP.md` or `DESIGN.md` file was touched.
