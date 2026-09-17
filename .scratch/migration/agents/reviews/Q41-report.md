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


NOT done: none of the ruling's five items is left undone, but two results differ from what I told you before Axel ruled, and he should see both.
1. **My earlier 0.35 figure was wrong.** I said every meaning colour except Review's violet would hold at 0.35. That came from checking each lane on its own, not the whole set together. Checked together with the real `deriveTokens`, the set fails: Backburner grey / Scope cyan-d 7.03 (everforest), Scope cyan-d / De-risk indigo 9.03 (tokyonight), De-risk indigo / Build teal 7.06 (nord). No single lane change fixes all three (search: "one lane: 0" solutions), so two lanes changed: Backburner is brass instead of grey (no grey-family hue holds at all), and De-risk is violet instead of indigo.
2. **Neighbours in the wide three-column layout can still match.** The test holds only headers drawn one after another. Lanes stacked in the same column are not held, and the dracula screenshot shows it: Review, Scope, Build and Teaching are all rgb(74,108,123), and Review sits directly above Scope. The same-column figures are under "Pairs the test does not hold".

## After Axel's ruling

### DONE / NOT DONE
| Item | State | Proof |
|---|---|---|
| 1 `LANE_SHARE` 0.35 | DONE | `src/lib/themes/derive.ts:50` |
| 2 Meaning colours restored, Review chosen | DONE, with Backburner and De-risk changed (see above) | `git diff config/vocab.yml` |
| 3 Distance test holds at 0.35 under every theme | DONE | `npx vitest run tests/lane-distance.test.ts`: 20 passed |
| 3 Lane text contrast at 0.35 under every theme | DONE, no theme fails | `npx vitest run tests/contrast.test.ts`: passed, "contrast: 6341 pairs over 17 themes" |
| 4 `Focus.svelte:72-76` comment | DONE | `git diff src/lib/views/Focus.svelte` |
| `npx vitest run --reporter=dot` | Test Files 240 passed, Tests 4050 passed | |
| `npm run check` | 1193 FILES 0 ERRORS 0 WARNINGS | |
| `npm run build` | exit 0 | |
| `npm run format:check` | All matched files use Prettier code style | |
| `npm run lint` | exit 0 | |
| ASCII gate (perl command in the brief) | printed nothing | |
| `yaml.safe_load` on vocab.yml | exit 0 | |
| `npx playwright test` on focus-look, focus-buttons, focus-drag | 8 passed | port 8792 was held by another run for two waits of 45 s, then it ran |

After those runs I made one comment-only edit to the `LANE_SHARE` comment in `derive.ts`. I then reran format check, `tests/history.test.ts`, `tests/contrast.test.ts` and `tests/lane-distance.test.ts` (44 passed), and `npm run build` (exit 0).

`tests/config-folder.test.ts` and `tests/views/focus.test.ts` are back to their committed text, since the column tones are gold, violet and teal again. They pass in the full run.

### Review's hue
At 0.35 Review can only be blue, cyan, cyan-d, sky or teal: those are the only hues at least 10 from both Revise amber and Blocked red. I chose **sky** (#0ea5e9). It is a calm, quiet blue for work that is out of your hands, and it keeps a name no other lane uses: Push is blue, Scope cyan-d, Build teal.

### Lane colours
| Lane | Before my build | As first built (0.2) | Now (0.35) |
|---|---|---|---|
| Run | #16a34a green | #16a34a green | #16a34a green |
| Push | #2563eb blue | #e2374d crimson | #2563eb blue |
| Revise | #b45309 amber | #b45309 amber | #b45309 amber |
| Review | #7c5cff violet | #e2374d crimson | #0ea5e9 sky |
| Blocked | #dc2626 red | #f59e0b honey | #dc2626 red |
| Backburner | #64748b grey | #b91c1c red-d | #d4a017 brass (grey cannot hold) |
| Scope | #0e7490 cyan-d | #0e7490 cyan-d | #0e7490 cyan-d |
| De-risk | #6366f1 indigo | #ec4899 pink | #7c5cff violet (indigo cannot hold) |
| Build | #0d9488 teal | #0891b2 cyan | #0d9488 teal |
| Ideas (not changed) | mauve | mauve | mauve |
| Funding | gold | lime | gold |
| Jobs | violet | magenta | violet |
| Teaching | teal | teal | teal |

### Per theme at 0.35
The closest pair comes from the test's console output. The lowest lane text contrast comes from a scratch script over `deriveTokens`: the first figure is over every hue, the second over the hues the lanes use.

| Theme | Closest neighbours | Lowest lane text contrast (all / used) |
|---|---|---|
| light | 20.27 scope/derisk | 4.51 amber-s / 4.52 red |
| dark | 13.00 scope/derisk | 4.50 code-number / 4.52 sky |
| vscode-dark-modern | 18.47 scope/derisk | 4.50 grey / 4.51 blue |
| vscode-light-modern | 20.27 scope/derisk | 4.51 amber-s / 4.52 red |
| mocha | 17.70 holding/funding | 4.51 teal / 4.51 teal |
| gruvbox | 20.98 revise/review | 4.51 cyan / 4.51 sky |
| nord | 16.93 derisk/build | 4.50 pink / 4.51 brass |
| synthwave | 10.66 run/push | 4.50 brass / 4.50 brass |
| tokyoneon | 20.99 scope/derisk | 4.50 orange / 4.51 red |
| tokyonight | 16.17 scope/derisk | 4.52 grey / 4.54 green |
| rosepine | 11.25 run/push | 4.50 grey / 4.51 amber |
| everforest | 10.25 run/push | 4.51 code-meta / 4.52 blue |
| dracula | 21.17 scope/derisk | 4.51 cyan / 4.51 cyan-d |
| kanagawa | 15.54 scope/derisk | 4.51 orange / 4.56 blue |
| solarized | 18.31 scope/derisk | 4.52 code-comment / 4.52 blue |
| latte | 17.76 holding/funding | 4.53 indigo / 4.56 violet |
| gruvboxlight | 14.42 backburner/scope | 4.51 orange / 4.57 amber |

### Pairs the test does not hold (worst theme, scratch measurement at 0.35)
- **Same column in the wide layout:**
  - run/review 0.00 (rosepine)
  - revise/backburner 0.00 (tokyoneon)
  - review/scope 0.00 (synthwave; identical in the dracula screenshot)
  - blocked/derisk 7.41 (everforest)
  - push/blocked 19.10 and backburner/build 13.36 do hold
- **The full-width Ideas lane against De-risk:** 0.00 (gruvbox).
- **When a band column is empty and hidden:** Ideas/Jobs 0.00 (gruvbox). With Jobs hidden, Funding/Teaching is 13.36 and holds; the demo hub hides Jobs, as the screenshots show.
- **Review as blue instead of sky** does not help: review/scope is still 0.00 (rosepine).

### Reverts run (each restored afterwards; files compared equal with `cmp`)
- **Share back to 0.2, current colours:** 6 failed, naming 15 pairs. Among them: "synthwave: run (green) / push (blue) = 6.45", "rosepine: run (green) / push (blue) = 6.20", "everforest: run (green) / push (blue) = 6.95", "kanagawa: scope (cyan-d) / derisk (violet) = 8.90", "gruvboxlight: backburner (brass) / scope (cyan-d) = 8.50", "nord: revise (amber) / review (sky) = 9.88".
- **The first-built colours put back at 0.35:** 20 passed. No pair fails, so the higher share would also have held the first-built palette.
- **Earlier reverts, unchanged by the ruling:** waiting back to live tiers only (2 failed), waiting condition dropped (1 failed), `rt` term dropped (reference pair 1.608 against 2.0425), Ideas lane taken out of the drawing order (18 failed).

### Screenshots
Taken from the served build on port 8792: a scratch script started `tests/browser/serve.ts` as its own child and stopped it with SIGTERM.
- Light: `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/536c7cbc-bb5a-4968-922a-974ba41d1544/scratchpad/q41-builder/focus-light.png`
- Dracula: `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/536c7cbc-bb5a-4968-922a-974ba41d1544/scratchpad/q41-builder/focus-dracula.png`

Header backgrounds read from the page:
- Light: Run (173,222,191), Push (178,200,248), Revise (228,194,168), Review (170,223,247), Blocked (242,179,179), Backburner (239,221,173), Scope (170,206,216), De-risk (209,197,255), Build (170,217,213), Ideas (229,200,214), Funding (222,200,168), Teaching (170,217,213).
- Dracula: Run (54,114,78), Push (60,67,92), Revise (115,91,72), Review (74,108,123), Blocked (115,57,64), Backburner (110,114,84), Scope (74,108,123), De-risk (92,78,122), Build (74,108,123), Ideas (115,69,104), Funding (110,114,84), Teaching (74,108,123).

### Visible changes
- **Before:** coauthor and archive projects on a lane add nothing to the awaiting strip. **After:** they add to its people and venue counts.
- **Before:** each lane header is a pale tint, a fifth of its hue. **After:** it is a stronger tint, 35%, in every theme, and the header text is re-derived to stay at 4.5:1 or better.
- **Lane colours versus before my build:** Review violet to sky, Backburner grey to brass, De-risk indigo to violet. Every other lane and column keeps its colour.

### Doc text
**HELP.md**, append to the `focus` row (line 74):
"The Awaiting a response strip counts the people and venues of every project a board card stands for: the ideas, active and manuscripts projects, and a project of any other tier on a lane. Each lane header and each Funding, Jobs and Teaching header has a colour chosen to differ from the header drawn after it under every theme."

**DESIGN.md**, four changes:
- Line 228: "a fifth of the hue in the panel" becomes "35% of the hue in the panel".
- Append to the same paragraph: "The lane surfaces are also measured against each other: `tests/lane-distance.test.ts` derives every theme through `tests/themes.ts`, the derivation the contrast test reads, and holds each lane header at a CIEDE2000 of 10 or more from the next one drawn; lanes stacked in one column of the wide layout are not held."
- Add under `tests/` after line 111: `    lane-distance.test.ts      neighbouring Focus lane headers, every theme, CIEDE2000 at least 10`
- New log entry, which supersedes the tallies clause at line 330: "- 2026-09-17, Axel: the awaiting strip counts what the board shows, and lane headers are told apart. `waiting()` tallies the people and venues of every live project and of every project `laneItems` draws on a lane, whatever its tier; a project of another tier in holding or on no lane is not counted. A lane header's surface carries 35% of its hue (`LANE_SHARE` in `themes/derive.ts`), the share at which the lane colours keep their meanings (Run green, Push blue, Revise amber, Review sky, Blocked red, Backburner brass, Scope cyan-d, De-risk violet, Build teal; Funding gold, Jobs violet, Teaching teal) while each header stays a CIEDE2000 of 10 or more from the next one drawn under every theme, which `tests/lane-distance.test.ts` holds. Package Q41."

### Files changed
All under `tools/oculus/`:
- `config/vocab.yml` (+5 -4)
- `src/lib/state/focus.ts` (+20 -9)
- `src/lib/themes/derive.ts` (+8 -3)
- `src/lib/views/Focus.svelte` (+3 -3), comment only
- `tests/contrast.test.ts` (+5 -20)
- `tests/state/focus.test.ts` (+45 -5)
- `tests/lane-distance.test.ts`, new, 215 lines
- `tests/themes.ts`, new, 34 lines

### Limitations
- The closest-pair test only prints and asserts a distance above 0.
- The per-theme lane text contrasts come from a scratch script. The tree's check is `tests/contrast.test.ts`, which asserts 4.5:1 for every lane pair and passed.
- The larger share makes every lane header a stronger tint in all 17 themes, including the pressed-free default light theme; I have looked at light and dracula only.


Measurement only. Nothing in the worktree changed; the scratch scripts are kept in `scratchpad/q41-builder/`. The search tries all 26 lane hues for each header. At 0.35 it uses the lane colours `derive.ts` produces (`cmp` confirmed the scratch mix gives identical results at 0.35). At 0.45 and 0.5 it uses the same mix at those shares.

## Wide layout search

**Pairs held (22):**
- The 12 in drawing order.
- The 6 stacked in the same column: run/review, push/blocked, revise/backburner, review/scope, blocked/derisk, backburner/build.
- The full-width Ideas lane against Scope, De-risk, Build, Funding, Jobs and Teaching: 4 new pairs, since build/holding and holding/funding are already in drawing order.

**Scoring:** an assignment scores by how many headers keep Axel's meaning colours (Run green, Push blue, Revise amber, Blocked red, Backburner grey, Scope cyan-d, De-risk indigo, Build teal, Funding gold, Jobs violet, Teaching teal); ties go to more of the four named lanes kept. The search is exhaustive with pruning. Among equal scores it keeps the first assignment found, so other assignments with the same count may exist. Ideas stayed mauve at every share.

### 1. Does any assignment hold all 22 pairs?
Yes, at all three shares: 0.35, 0.45 and 0.5 (`node wide.ts`, `SHARE=0.45 node wide.ts`, `SHARE=0.5 node wide.ts`).

### 2. Best assignment at each share
All three keep Run green, Push blue, Revise amber and Blocked red.

| Header | 0.35 | 0.45 | 0.5 |
|---|---|---|---|
| Run | green | green | green |
| Push | blue | blue | blue |
| Revise | amber | amber | amber |
| Review | blue | blue | grey |
| Blocked | red | red | red |
| Backburner | blue | grey | grey |
| Scope | amber | amber | cyan-d |
| De-risk | cyan | blue | amber |
| Build | amber | amber | teal |
| Ideas | mauve | mauve | mauve |
| Funding | gold | gold | gold |
| Jobs | cyan | blue | grey |
| Teaching | amber | amber | teal |
| Meaning colours kept | 5 of 11 | 6 of 11 | 9 of 11 |

- **0.35 and 0.45 repeat hues heavily:** amber is on 4 headers at 0.35, and blue on 4 at 0.45.
- **0.5:** only De-risk (amber, not indigo) and Jobs (grey, not violet) are off their meaning colours. Review, Backburner and Jobs are all grey.

**Smallest distance of the 22 pairs, per theme:**

| Theme | 0.35 | 0.45 | 0.5 |
|---|---|---|---|
| light | 17.12 build/holding | 20.72 build/holding | 16.02 backburner/scope |
| dark | 18.87 build/holding | 20.25 derisk/holding | 14.91 blocked/derisk |
| vscode-dark-modern | 19.35 build/holding | 22.20 derisk/holding | 14.90 blocked/derisk |
| vscode-light-modern | 17.12 build/holding | 20.72 build/holding | 16.02 backburner/scope |
| mocha | 12.65 build/holding | 15.70 build/holding | 15.19 holding/jobs |
| gruvbox | 20.03 funding/jobs | 24.86 backburner/scope | 16.89 backburner/scope |
| nord | 17.43 derisk/holding | 14.73 derisk/holding | 10.22 jobs/teaching |
| synthwave | 10.66 run/push | 13.33 run/push | 10.94 holding/jobs |
| tokyoneon | 24.40 scope/derisk | 18.33 derisk/holding | 20.34 holding/jobs |
| tokyonight | 16.92 derisk/holding | 10.96 derisk/holding | 15.40 holding/jobs |
| rosepine | 11.25 run/push | 14.92 run/push | 13.99 holding/jobs |
| everforest | 10.25 run/push | 11.85 run/push | 10.28 backburner/scope |
| dracula | 22.41 funding/jobs | 20.52 derisk/holding | 21.88 holding/jobs |
| kanagawa | 18.13 build/holding | 18.28 backburner/scope | 13.97 jobs/teaching |
| solarized | 21.51 scope/derisk | 26.63 backburner/scope | 11.51 backburner/scope |
| latte | 17.76 build/holding | 20.33 build/holding | 18.06 holding/jobs |
| gruvboxlight | 14.42 scope/derisk | 10.88 backburner/scope | 11.09 run/review |

### 3. When no assignment holds everything
Does not apply: a full assignment exists at every share.

### 4. Lowest lane text contrast per theme
From `lanelxt2.ts`, which recomputes each lane and its text the way `derive.ts` does. Its 0.35 figures match the ones measured through `derive.ts` itself. Each cell gives the lowest over every hue, then the lowest over the hues that share's assignment uses. Nothing is below 4.50.

| Theme | 0.35 | 0.45 | 0.5 |
|---|---|---|---|
| light | 4.51 amber-s / 4.52 red | 4.52 amber / 4.52 amber | 4.55 gold / 4.55 gold |
| dark | 4.50 code-number / 4.51 cyan | 4.51 grey / 4.51 grey | 4.51 grey / 4.51 grey |
| vscode-dark-modern | 4.50 grey / 4.51 blue | 4.50 honey / 4.51 amber | 4.50 crimson / 4.50 gold |
| vscode-light-modern | 4.51 amber-s / 4.52 red | 4.52 amber / 4.52 amber | 4.55 gold / 4.55 gold |
| mocha | 4.51 teal / 4.55 green | 4.50 code-comment / 4.52 green | 4.50 purple / 4.52 gold |
| gruvbox | 4.51 cyan / 4.51 cyan | 4.50 cyan / 4.52 gold | 4.50 purple / 4.51 gold |
| nord | 4.50 pink / 4.52 mauve | 4.50 amber / 4.50 amber | 4.51 code-meta / 4.54 mauve |
| synthwave | 4.50 brass / 4.50 gold | 4.51 code-comment / 4.53 gold | 4.50 grey / 4.50 grey |
| tokyoneon | 4.50 orange / 4.51 red | 4.53 teal / 4.55 green | 4.52 orange / 4.54 teal |
| tokyonight | 4.52 grey / 4.54 green | 4.51 mauve / 4.51 mauve | 4.51 teal / 4.51 teal |
| rosepine | 4.50 grey / 4.51 amber | 4.52 crimson / 4.52 red | 4.50 green / 4.50 green |
| everforest | 4.51 code-meta / 4.52 blue | 4.51 crimson / 4.51 red | 4.51 amber / 4.51 amber |
| dracula | 4.51 cyan / 4.51 cyan | 4.51 green / 4.51 green | 4.50 code-number / 4.55 red |
| kanagawa | 4.51 orange / 4.56 blue | 4.50 brass / 4.50 gold | 4.51 code-name / 4.51 green |
| solarized | 4.52 code-comment / 4.52 blue | 4.52 code-string / 4.54 red | 4.50 indigo / 4.52 blue |
| latte | 4.53 indigo / 4.61 cyan | 4.56 code-meta / 4.61 blue | 4.50 teal / 4.50 teal |
| gruvboxlight | 4.51 orange / 4.57 amber | 4.52 amber / 4.52 amber | 4.57 orange / 4.65 red |

**Scratch scripts:**
- `wide.ts`: the search, with `SHARE`, `HOLDFREE` and `MAXCSP` switches.
- `lanetxt2.ts`: lane text contrast at a given share.
- `measure.ts`: lane colours per theme, and the CIEDE2000 function.


Measurement only. Nothing in any worktree changed.

**Method.** At each share, the lane colours come from a scratch copy of `derive.ts` (the q41 worktree's) with only the `LANE_SHARE` line changed; the 0.35 copy is byte-identical to the file (`cmp`). The search covers all 26 lane hues. It finds every largest set of hue names whose colours are pairwise at a CIEDE2000 of 10 or more under all 17 themes, then ranks those sets by the expected colours they keep: Run green, Push blue, Revise amber and Blocked red first, then Backburner grey, Scope cyan-d, Build or Teaching teal, Funding gold and Jobs violet. Ideas was free to take any hue. Scripts are kept in `scratchpad/q41-builder/`: `distinct.ts`, `pertheme.ts`, `textmin.ts`, `derive-<share>.ts`; outputs are in `distinct-<share>.out` and `pertheme-<share>.out`.

## Distinct headers search

### No full assignment exists at any share
Thirteen headers (nine lanes, Ideas, Funding, Jobs, Teaching) with distinct hue names, every pair at 10 or more under all themes, cannot be had at 0.35, 0.45, 0.5, 0.6 or 0.7.

**Why no share can fix it.** Some themes give different hue names the identical colour, and a share cannot separate identical colours. Counting identical colours as one, rosepine, dracula and everforest each have only 8 distinct lane hues, so at most 8 headers can be distinct there at any share. Reaching 13 would need new colours in those themes' blocks in `themes.css`.

### Largest distinct set per share
| Share | Largest distinct set | Best set and the headers it serves | Headers that must share |
|---|---|---|---|
| 0.35 | 3 (169 sets) | amber Revise, blue Push, red Blocked | the other 10 |
| 0.45 | 4 (91 sets) | amber Revise, red Blocked, teal Build, grey-d Backburner | the other 9 |
| 0.5 | 5 (34 sets) | green Run, grey Backburner, cyan-d Scope, mauve Ideas, orange De-risk | Push, Revise, Review, Blocked, Build, Funding, Jobs, Teaching |
| 0.6 | 7 (63 sets) | green Run, crimson Blocked, grey Backburner, cyan-d Scope, gold Funding, mauve Ideas, orange De-risk | Push, Revise, Review, Build, Jobs, Teaching |
| 0.7 | 7 (495 sets) | green Run, red Blocked, grey Backburner, cyan-d Scope, gold Funding, violet Jobs, orange De-risk | Push, Revise, Review, Build, Ideas, Teaching |

At 0.35, blue/green/red scores the same as the set shown.

### Per theme: how many hue names that theme alone keeps pairwise at 10 or more
The last column counts the theme's distinct lane colours, with identical colours counted once; it is the same at every share.

| Theme | 0.35 | 0.45 | 0.5 | 0.6 | 0.7 | Distinct colours |
|---|---|---|---|---|---|---|
| light | 10 | 12 | 14 | 16 | 16 | 26 |
| dark | 11 | 13 | 14 | 14 | 16 | 26 |
| vscode-dark-modern | 10 | 13 | 14 | 15 | 15 | 26 |
| vscode-light-modern | 10 | 12 | 14 | 16 | 16 | 26 |
| mocha | 9 | 11 | 12 | 14 | 14 | 23 |
| gruvbox | 9 | 10 | 11 | 11 | 11 | 20 |
| nord | 9 | 9 | 11 | 12 | 13 | 23 |
| synthwave | 8 | 8 | 8 | 8 | 9 | 11 |
| tokyoneon | 8 | 9 | 9 | 10 | 10 | 10 |
| tokyonight | 7 | 8 | 8 | 9 | 9 | 11 |
| rosepine | 7 | 8 | 8 | 8 | 8 | 8 |
| everforest | 5 | 5 | 6 | 7 | 7 | 8 |
| dracula | 8 | 8 | 8 | 8 | 8 | 8 |
| kanagawa | 7 | 8 | 9 | 9 | 10 | 11 |
| solarized | 6 | 7 | 7 | 9 | 9 | 9 |
| latte | 9 | 10 | 10 | 11 | 12 | 12 |
| gruvboxlight | 4 | 6 | 7 | 8 | 8 | 9 |

**Hue names given the identical colour, for the three 8-colour themes:**
- **rosepine:** amber=brass=gold=honey, blue=cyan=cyan-d, crimson=magenta=red=red-d, green=green-d=sky=teal, grey=grey-d=slate, indigo=mauve=purple=violet, orange=pink=rose
- **dracula:** amber=orange, blue=grey=grey-d=slate, brass=gold=honey, crimson=red=red-d, cyan=cyan-d=sky=teal, green=green-d=lime, indigo=purple=violet, magenta=mauve=pink=rose
- **everforest:** amber=brass=gold=honey, blue=cyan=cyan-d=sky, crimson=red=red-d, green=green-d=lime, grey=grey-d=slate, indigo=magenta=mauve=pink=purple=rose=violet

### At 0.7, why each sharing header cannot keep its expected hue
Each line gives the theme and the set colour it comes too close to (or matches).
- **Revise amber,** in 16 of 17 themes:
  - identical to gold in tokyoneon, tokyonight, rosepine, everforest, solarized, latte and gruvboxlight
  - identical to orange in mocha and dracula
  - below 10 against gold or orange in light, dark, both VS Code themes, gruvbox, nord and kanagawa
- **Push blue:** identical to cyan-d in rosepine and everforest, identical to grey in dracula; also fails in dark (violet 9.5), gruvbox (cyan-d 8.6) and synthwave (cyan-d 4.6).
- **Ideas mauve:** identical to violet in gruvbox, nord, rosepine and everforest; also fails in mocha (red 7.4), synthwave (violet 9.6), tokyonight (violet 5.7) and gruvboxlight (violet 8.3).
- **Build or Teaching teal:** identical to cyan-d in synthwave, dracula, solarized and gruvboxlight, identical to green in rosepine; also fails in everforest (green 7.7).

The same breakdown for the other shares is in `pertheme-<share>.out`.

### Review and De-risk
Both ranked lists are empty at every share. The best set at each share is already the largest possible, so no further hue sits at 10 or more from all its members under every theme, and there is no fitting hue for either header to rank. I have not chosen a hue for either.

### Lowest header text contrast per share
Over all 17 themes and every lane hue, unrounded (`textmin.ts`). No lane text pair falls below 4.5 at any share.

| Share | Lowest | Where |
|---|---|---|
| 0.35 | 4.5006 | vscode-dark-modern, grey |
| 0.45 | 4.5001 | mocha, code-comment |
| 0.5 | 4.5000 | latte, teal |
| 0.6 | 4.5005 | vscode-dark-modern, lime |
| 0.7 | 4.5012 | vscode-dark-modern, code-number |


NOT done: `tests/contrast.test.ts` fails at 0.5 in 7 themes (mocha, nord, synthwave, tokyoneon, everforest, dracula, kanagawa), 200 pairs in all. Every failing pair is a `--c-<hue>-lane-txt` measured against a page surface (`--bg`, `--panel`, `--card`, `--chip`). None is lane text on its own lane surface, and no other token fails.

Why this is a decision for you, and what I did not do:
- `LaneHead.svelte:42` is the only place `--c-<hue>-lane-txt` is painted, and it sits on `--lane`. The failing pairs are drawn nowhere.
- At half share, the lane surface in a dark theme is light enough that `readable()` turns its text dark. That dark text fails on the page colours the test also measures it against.
- The possible fix is to have the test measure lane text only on its own lane surface. That narrows the check's rule, so I left the threshold and the test's pairs untouched.

Hues whose lane text fails on the page surfaces:
- mocha: cyan, gold, green, lime, pink, red-t, sky, teal
- nord: amber, cyan, gold, green, honey, lime, sky, teal
- synthwave: amber, blue, brass, cyan, cyan-d, gold, green, green-d, honey, lime, sky, teal
- tokyoneon: green, green-d, lime
- everforest: amber, brass, gold, honey
- dracula: amber, brass, cyan, cyan-d, gold, green, green-d, honey, lime, orange, sky, teal
- kanagawa: brass, gold, honey

Proof: `npx vitest run tests/contrast.test.ts`, 7 failed; 200 `+` lines, all of the form `--c-<hue>-lane-txt on --<surface>`, zero on `--c-*`.

## After Axel's choice (a)

### DONE / NOT DONE
| Item | State | Proof |
|---|---|---|
| 1 `LANE_SHARE` 0.5 | DONE | `src/lib/themes/derive.ts:51` |
| 2 Distance test holds 22 pairs of three named kinds | DONE | `npx vitest run tests/lane-distance.test.ts`: 20 passed |
| 3 Colours, with Review, De-risk and Jobs chosen deliberately | DONE | `git diff config/vocab.yml` |
| 4 `tests/contrast.test.ts` at 0.5 | NOT DONE (red, see above) | 7 failed |
| `npx vitest run --reporter=dot` | Test Files 1 failed, 239 passed; Tests 7 failed, 4043 passed | the 7 are the contrast cases |
| `npm run check` | 1193 FILES 0 ERRORS 0 WARNINGS | |
| `npm run build` | exit 0 | |
| `npm run format:check` | All matched files use Prettier code style | |
| `npm run lint` | exit 0 | |
| ASCII gate (perl command in the brief) | 0 lines | |
| `yaml.safe_load` on vocab.yml | exit 0 | |
| `npx playwright test` on focus-look, focus-buttons, focus-drag | 8 passed | after two 45 s waits for another run's port |

### The distance test
- **Layout read from the markup:** `rows()` puts each cluster's lanes three to a row (`.lanes`, three columns), the Ideas lane alone across the width (`.lanes.one`), then the band's Funding, Jobs and Teaching.
- **The three kinds, named in the head comment and in every failure line:**
  - "next in drawing order": 12 pairs
  - "stacked in one column": 6 pairs, asserted as run/review, push/blocked, revise/backburner, review/scope, blocked/derisk, backburner/build
  - "beside the full-width Ideas lane": 4 pairs, asserted as holding/scope, holding/derisk, holding/jobs, holding/teaching
  - build/holding and holding/funding are already "next" pairs, so each is counted once.
- **Failure line format:** "`<theme>: stacked in one column review (slate) / scope (cyan-d) = 8.93`".

### Review, De-risk and Jobs
Candidates are the hues that keep all 22 pairs at 10 or more under every theme, with every other header fixed (`scratchpad/q41-builder/choose05.ts`).
- **Review:**
  - Ranked: slate, grey-d, grey (used by Backburner).
  - **Choice: slate (#475569).** It is the quiet blue-grey of work sitting out of your hands, and no other header uses it. Worst pair: 10.28 against Scope in everforest.
- **De-risk:**
  - Ranked: honey, amber (used by Revise), brass, gold (used by Funding), slate, grey-d, grey (used).
  - **Choice: honey (#f59e0b).** It is the clearest caution colour, warm and well apart from Scope's cyan-d and Build's teal, and unused. Worst pair: 17.97 against Build in everforest.
- **Jobs:**
  - Ranked: slate, grey-d, grey (used by Backburner). No violet-like hue fits.
  - **Choice: grey-d.** It is the only fit left unused once Review takes slate. Worst pair: 10.94 against Ideas in synthwave.

### Colour per header
| Header | Before my build | Now |
|---|---|---|
| Run | #16a34a green | #16a34a green |
| Push | #2563eb blue | #2563eb blue |
| Revise | #b45309 amber | #b45309 amber |
| Review | #7c5cff violet | #475569 slate |
| Blocked | #dc2626 red | #dc2626 red |
| Backburner | #64748b grey (palette `muted`) | #9ca3af grey |
| Scope | #0e7490 cyan-d | #0e7490 cyan-d |
| De-risk | #6366f1 indigo | #f59e0b honey |
| Build | #0d9488 teal | #0d9488 teal |
| Ideas | #b5638a mauve | #b5638a mauve (not changed) |
| Funding | gold | gold |
| Jobs | violet | grey-d |
| Teaching | teal | teal |

### Shared hues
- **By name:** only Build and Teaching share one (teal). They do not touch: Build is in the incubate row, Teaching in the band, with the Ideas lane between.
- **Same colour under a different name** (from the dracula screenshot's header colours): Push, Review and Backburner are one colour; Scope, Build and Teaching are one; De-risk and Funding are one. None of those pairs touch.

### Smallest distance per theme over the 22 pairs
| Theme | Distance | Pair |
|---|---|---|
| light | 13.06 | stacked review/scope |
| dark | 11.41 | stacked review/scope |
| vscode-dark-modern | 12.16 | stacked review/scope |
| vscode-light-modern | 13.06 | stacked review/scope |
| mocha | 12.74 | stacked review/scope |
| gruvbox | 12.44 | stacked review/scope |
| nord | 10.22 | stacked backburner/build |
| synthwave | 10.94 | Ideas/jobs |
| tokyoneon | 20.34 | Ideas/jobs |
| tokyonight | 15.40 | Ideas/jobs |
| rosepine | 13.99 | Ideas/jobs |
| everforest | 10.28 | next backburner/scope |
| dracula | 21.88 | Ideas/jobs |
| kanagawa | 13.97 | next jobs/teaching |
| solarized | 11.51 | next backburner/scope |
| latte | 18.06 | Ideas/jobs |
| gruvboxlight | 11.09 | stacked run/review |

### Lowest lane text contrast per theme (lane text on its own lane)
From `scratchpad/q41-builder/lanetxt05.ts`, which reads `deriveTokens` at 0.5. Each cell is over every hue / over the hues the headers use.

| Theme | All hues / used hues |
|---|---|
| light | 4.55 gold / 4.55 gold |
| dark | 4.51 grey / 4.51 grey |
| vscode-dark-modern | 4.50 crimson / 4.50 gold |
| vscode-light-modern | 4.55 gold / 4.55 gold |
| mocha | 4.50 purple / 4.52 gold |
| gruvbox | 4.50 purple / 4.51 gold |
| nord | 4.51 code-meta / 4.52 honey |
| synthwave | 4.50 grey / 4.50 grey |
| tokyoneon | 4.52 orange / 4.54 teal |
| tokyonight | 4.51 teal / 4.51 teal |
| rosepine | 4.50 green / 4.50 green |
| everforest | 4.51 amber / 4.51 amber |
| dracula | 4.50 code-number / 4.55 red |
| kanagawa | 4.51 code-name / 4.51 green |
| solarized | 4.50 indigo / 4.52 blue |
| latte | 4.50 teal / 4.50 teal |
| gruvboxlight | 4.57 orange / 4.65 red |

### Reverts run (each restored and compared equal with `cmp`)
- **Share back to 0.35 with these colours:** 7 failed, naming 19 pairs. Stacked-pair examples: "dark: stacked in one column review (slate) / scope (cyan-d) = 8.93", "nord: stacked in one column backburner (grey) / build (teal) = 7.56", "everforest: stacked in one column review (slate) / scope (cyan-d) = 7.03", "gruvboxlight: stacked in one column run (green) / review (slate) = 8.20". The failures also include next-in-order and Ideas pairs.
- **Review set to Run's hue (#16a34a):** 18 failed: all 17 themes plus the closest-pair case. Each theme prints "stacked in one column run (green) / review (green) = 0.00".

### Screenshots
Taken at 1600 wide from this build, on port 8792, through the browser suite's `tests/browser/serve.ts` started as this script's own child:
- `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/536c7cbc-bb5a-4968-922a-974ba41d1544/scratchpad/q41-builder/shots05/focus-light.png`
- `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/536c7cbc-bb5a-4968-922a-974ba41d1544/scratchpad/q41-builder/shots05/focus-dark.png`
- `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/536c7cbc-bb5a-4968-922a-974ba41d1544/scratchpad/q41-builder/shots05/focus-dracula.png`

The header colours read from the page confirm the half share. For example, light Run is rgb(138,209,164), and 0.5 x 22 + 0.5 x 255 = 138.

**An earlier attempt reached another run's server.** On port 8792, a server started by another step answered while mine had exited: my build was older than `derive.ts` after the reverts. That attempt opened Focus there in a fresh browser and switched it to dark and dracula. Whether that theme choice was written into that run's temporary appearance store is not verified. The screenshots from that attempt showed the 0.2 colours and were deleted. `shots3.ts` now waits for a free port and refuses a server that is not its own.

### Doc text
**HELP.md**, append to the `focus` row (line 74):
"The Awaiting a response strip counts the people and venues of every project a board card stands for: the ideas, active and manuscripts projects, and a project of any other tier on a lane. Each lane header and each Funding, Jobs and Teaching header has a colour chosen to differ from every header it touches under every theme: the next one drawn, the one stacked above or below it, and the full-width Ideas lane."

**DESIGN.md**, four changes:
- Line 228: "a fifth of the hue in the panel" becomes "half the hue in the panel".
- Append to the same paragraph: "The lane surfaces are also measured against each other: `tests/lane-distance.test.ts` derives every theme through `tests/themes.ts`, the derivation the contrast test reads, reads the rows Lanes.svelte and Band.svelte draw, and holds every pair of headers that touch at a CIEDE2000 of 10 or more: each header and the next one drawn, a header and the one stacked below it in the three-column layout, and the full-width Ideas lane against the rows above and below it."
- Add under `tests/` after line 111: `    lane-distance.test.ts      Focus lane headers that touch, every theme, CIEDE2000 at least 10`
- New log entry, which supersedes the tallies clause at line 330: "- 2026-09-17, Axel: the awaiting strip counts what the board shows, and lane headers that touch are told apart. `waiting()` tallies the people and venues of every live project and of every project `laneItems` draws on a lane, whatever its tier; a project of another tier in holding or on no lane is not counted. A lane header's surface is half its hue and half the panel (`LANE_SHARE` in `themes/derive.ts`). The lane colours are Run green, Push blue, Revise amber, Review slate, Blocked red, Backburner grey, Scope cyan-d, De-risk honey, Build teal, with the Ideas lane mauve and the columns Funding gold, Jobs grey-d and Teaching teal, so every pair of headers that touch (next in drawing order, stacked in one column, beside the full-width Ideas lane) stays a CIEDE2000 of 10 or more apart under every theme, which `tests/lane-distance.test.ts` holds. Package Q41."

### Files changed
All under `tools/oculus/`:
- `config/vocab.yml` (+6 -5)
- `src/lib/state/focus.ts` (+20 -9)
- `src/lib/themes/derive.ts` (+9 -3)
- `src/lib/views/Focus.svelte` (+3 -3), comment only
- `tests/config-folder.test.ts` (+1 -1), Jobs tone grey-d
- `tests/contrast.test.ts` (+5 -20)
- `tests/state/focus.test.ts` (+45 -5)
- `tests/lane-distance.test.ts`, new, 290 lines
- `tests/themes.ts`, new, 34 lines

### Limitations
- **Duplicate colours:** in dracula, several headers that do not touch are one colour (see Shared hues).
- **Dark-theme header text:** it is now dark on a lighter strip, which the contrast failure above reflects.
- **Hidden band columns:** the distance test covers the layout with all three band columns drawn. When a column is empty and hidden, the pairs that form are not held.
