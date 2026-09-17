Everything in the brief is done.

No open items need Axel's ruling. Three shapes need a look at landing (below): the tags, the tinted header band, and a side effect of the band on hue text colours across oculus.

## DONE / NOT DONE (all commands run from `tools/oculus` in the q37 worktree)

| Item | State | Proof |
|---|---|---|
| 1. Lanes take any tier | DONE | `laneItems` (`src/lib/state/focus.ts:183`) no longer runs the `live()` check. `backlog`, `unplaced` and `waiting` are unchanged. `npx vitest run tests/state/focus.test.ts`: 44 passed |
| 2. Status marks are `ui/Tag` with glyph, word and tone, at most `CARD_CHIPS`, and they wrap | DONE | `Lanes.svelte`: each mark is `<span class="mark"><Tag label={chipLabel} glyph={chipGlyphName} tone={statusMarkTone}/></span>`, with `.mark { flex: 0 0 auto; max-width: 100% }` inside the existing `flex-wrap: wrap` row. The ghost badge keeps `span.chipicon` and its tooltip. |
| 3. Header band, one rule for both components | DONE | New partial `src/lib/views/focus/LaneHead.svelte`, used by `Lanes.svelte` and by all three columns of `Band.svelte`. Its background is `--c-<hue>-band` and the name and count are in `--c-<hue>-txt`. The top border stays. `derive.ts` makes the band (20% hue in `--panel`) for every hue and makes each hue's `-txt` readable on it. |
| Test 1, state | DONE | New describe "laneItems over every tier" (4 cases) in `tests/state/focus.test.ts` |
| Test 2, Lanes and Band view tests | DONE | `tests/views/focus.test.ts`: the mark test now checks the word and tone; new test for every lane header's band style; Band funding header band asserted |
| Test 3, browser spec | DONE | `tests/browser/focus-look.spec.ts`, 2 tests, passing |
| Test 4, contrast covers the band pair in every theme | DONE | `tests/contrast.test.ts` measures `--c-<hue>-txt` on `--c-<hue>-band`, and adds 2 cases (band pairs in every theme; band made only from a hue and only over a panel). Output: "contrast: 3944 pairs over 17 themes" |
| Test 5, reverts run | DONE | table below |
| `npx vitest run --reporter=dot` | PASS | 233 files, 3922 tests passed (no timing reruns needed) |
| `npm run check` | PASS | "1170 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS" |
| `npm run build` | PASS | exit 0, rebuilt again after the reverts |
| `npm run format:check` | PASS | "All matched files use Prettier code style!" |
| `npm run lint` | PASS | exit 0 |
| ASCII gate (perl command of the brief) | PASS | printed nothing, exit 0 |
| `npx playwright test tests/browser/focus-look.spec.ts tests/browser/focus-buttons.spec.ts tests/browser/focus-drag.spec.ts tests/browser/board.spec.ts` | PASS | "12 passed (22.3s)". I waited for the lock and port 8792 to be free first; no lock was deleted and no pid was signalled. |

## Reverts run (each change applied, test run, file restored and `cmp` checked)
- `if (!live(project)) continue;` put back in `laneItems`: the state test "draws a coauthor and an archive project on the lane their focus names" fails, and browser test 1 fails (`toHaveCount`).
- `if (!live(project)) continue;` dropped from `waiting`: "leaves the waiting tallies over the live tiers" fails (plus the existing tallies test).
- `if (!live(project)) return false;` dropped from `backlog`: "keeps them out of the backlog and the unplaced hint" fails.
- `laneItems` sends `holding` and an unset focus to a lane: "leaves a coauthor project in holding and an archive project with no focus off every lane" fails (plus 2 others).
- Marks drawn as the old `span.chipicon`: the view test "draws each status mark as its word in the hue of its own status" fails, and browser test 1 fails (`toBeVisible`).
- `Lanes.svelte` header drawn as a plain `.lane-h` row: "draws every lane header on the band of its own hue" fails.
- `Band.svelte` funding header as a plain row: that test fails, and so does "keeps the funding lane gold...".
- `background: var(--band)` removed from `LaneHead.svelte`: browser test 2 fails.
- `band` dropped from the grounds `-txt` is made readable on (`derive.ts`): all 17 theme contrast cases fail (351 band pairs under 4.5:1).
- No band made at all: "measures the band pairs of every theme" and "mints a band only from a hue and only over a panel" fail.

## Before and after of every visible change
- **Lane cards:** status marks were a small line icon with the word only in a tooltip. They are now a `Tag` showing glyph and word in the status hue at `--fs-sm`, in the same position (after the flames, before the name). A mark that does not fit moves to the next line.
- **Lane headers (the 9 lanes, Ideas, Funding, Jobs, Teaching):**
  - Before: name in ink and count in muted grey on the panel, with the hue only as a 3 px top border.
  - After: a rounded strip filled with the hue mixed into the panel (padding 3px 6px), name and count both in the hue's text colour. The top border is kept.
  - `.lane-sub` top margin goes from 2px to 4px in both components.
- **Side effect across oculus:** each hue's `-txt` must now also clear 4.5:1 on its band, so some hue text colours shift slightly (darker in light themes, lighter in dark ones) wherever they are used, not only on the Focus board. Measured by a scratch script comparing `deriveTokens` before and after over all 17 themes: 389 of 1513 derived tokens changed, and the lowest band ratio is 4.50:1. At a 12% share it would be 202 changed, at 15% it would be 276. I kept 20% so the band is plain to see. This is a reversible choice (`BAND_SHARE` in `derive.ts`).
- **Wallpaper mode:** the header band stays opaque over the translucent lane. The colour gate (`tests/ui/colours.test.ts`) allows `color-mix` only over the four surfaces, and a translucent band would be a pair the contrast test does not measure.

## Decisions the orchestrator may reverse (internal, not user-visible keys)
- Token name `--c-<hue>-band`. `derive.ts` skips an authored hue ending in `-band`, as it skips `-bg`.
- The count now uses the hue text colour instead of muted. `--muted-txt` on the band is a pair nobody measures.
- The shared rule is the partial `views/focus/LaneHead.svelte`, since `ui/` and `views/shared/` are off limits for this step.

## Limitations
- `Projects.svelte:287` still draws status marks as a line icon (`--mark`). The brief covers the lane row only, so that view is unchanged.
- An empty or unknown tone in `focus_lane_tones` gives an undefined `--c--band`, so that header gets no fill. The border already behaves this way today.
- While measuring, a scratch run of `npx tsx` fetched `tsx` into the npx cache (`~/.npm/_npx`). Nothing was added to the project or its `package.json`.

## Grep of changed names
`grep -rn "chipicon\|--mark:\|var(--mark\|lane-h\|lane-name\|laneItems\|live()\|onBoard\|status mark" src tests HELP.md DESIGN.md README.md` gives these hits outside my own files:
- `Projects.svelte` `--mark`: another view, not touched.
- `tests/views/type-scale.test.ts`: updated (Lanes and Band lose `.lane-name` and `.count`; new `focus/LaneHead.svelte` entry).
- `tests/browser/focus-drag.spec.ts` `.lane-name`: still resolves inside `.lane`, and the spec passed.
- `DESIGN.md:300`: the "status mark keeps its hue" decision still holds.

Comments I brought up to date:
- `tests/ui/colours.test.ts` (header and the fill-token comment) now names the band.
- `live()`'s doc comment and `onBoard()`'s doc comment in `state/focus.ts`.

## Doc text (not edited, per the brief)
- **HELP.md line 74**, currently:
  `| \`focus\` | Focus | What wants attention now: deadlines, overdue items, follow-ups, the week's ticker and the career strategy. |`
  Replace with:
  `| \`focus\` | Focus | What wants attention now: deadlines, overdue items, follow-ups, the week's ticker, the lanes and the career strategy. A project of any tier, coauthor and archive included, sits on the lane its \`focus:\` names; each card shows its first two statuses as a glyph and a word in the status's colour, and each lane's header is a band of the lane's colour. |`
- **DESIGN.md line 228** (Theming paragraph): after the sentence ending "...which the contrast test also measures.", insert:
  `It derives \`--c-<hue>-band\` as well, a fifth of each hue in the panel, which the header of a Focus lane and of the Funding, Jobs and Teaching columns fills with (\`views/focus/LaneHead.svelte\`); each hue's \`-txt\` is made readable on its band too, and the contrast test measures that pair under every theme.`
- **DESIGN.md "Decisions taken"**: new bullet after line 329:
  `- 2026-09-16, Axel: the Focus board draws what a manifest places. \`laneItems\` puts a project of any tier on the lane its \`focus:\` names, so a coauthor or archive paper placed on a lane is on it; the ideas backlog and the people and venue tallies of the awaiting strip stay over the three live tiers. A lane card's status marks are \`ui/Tag\`s carrying the glyph and the word in the status's tone, and a lane header is one partial, \`views/focus/LaneHead.svelte\`, drawn on the lane's band with its name and count in the hue's text token. Package Q37.`

## Files changed (line counts now)
- `src/lib/state/focus.ts` 288
- `src/lib/themes/derive.ts` 253
- `src/lib/views/focus/LaneHead.svelte` 54 (new)
- `src/lib/views/focus/Lanes.svelte` 539
- `src/lib/views/focus/Band.svelte` 271
- `tests/state/focus.test.ts` 743
- `tests/views/focus.test.ts` 853
- `tests/contrast.test.ts` 139
- `tests/ui/colours.test.ts` 613
- `tests/views/type-scale.test.ts` 237
- `tests/browser/focus-look.spec.ts` 110 (new)


# Repair round

Everything in the repair round is done.

Still open for Axel (booked by the coordinator, not built here):
- A coauthor card's `waiting-on` is not counted in the "Awaiting a response" strip.
- In some themes, two lanes resolve to the same colour.

Premise note on item 3: the "Move to" menu never offered `holding`. `menuFor` (`Lanes.svelte:117`) lists only `lanes(config)`, and `holding` is not in `focus_lanes`. The only path that let a card vanish was the drop onto the Ideas lane. That path is now refused, and a browser case pins the menu.

## Items

| Item | State | What is on the tree |
|---|---|---|
| 1. Hue text unchanged; the header gets its own tokens | DONE | `derive.ts` is main's derivation plus a new pair per hue: `--c-<hue>-lane` (20% hue mixed into `--panel`) and `--c-<hue>-lane-txt` = `readable(<hue>-txt, lane)`. An authored `-lane` hue is skipped. The probe comparing main's `deriveTokens` with the worktree over 17 themes prints `{ mainTokens: 1513, changed: 0, lanes: 595, worstLaneRatio: 4.503 }`. The contrast test measures `-lane-txt` on `-lane` (and on the four surfaces), 6324 pairs. |
| 2. Muted clusters | DONE | `Lanes.svelte` fades `.cluster.muted .lane-sub` and `.cluster.muted .lane-body` at 0.9, no longer the whole `.lane`. The browser case multiplies the Parked (Review) header's opacity with every ancestor's and asserts 1, under light and mocha. |
| 3. Vanishing card | DONE | New `movable(project, focus)` in `state/focus.ts:202`: any project may go to a lane, only a live-tier project to `holding`. In `Lanes.svelte`, `draggedOver` and `dropped` return early when `movable` is false, so the drop is refused and the lane does not light. State case added. Browser case: the archive card's menu holds exactly the lane, priority and none items, with no Ideas item. A drag onto Ideas writes no `focus: holding` and the card stays on its lane. |
| 4. False sentences | DONE | `Focus.svelte:72` (quick add comment), `state/focus.ts:178-184` (laneItems doc), `LaneHead.svelte` head comment rewritten. `derive.ts:6-7` is main's text again and true again, since `-txt` is main's; the head comment and the `deriveTokens` doc describe the lane pair. The `colours.test.ts` comments name the lane surface. `grep -rn "\-band\b\|--band" src tests` finds 0 hits. |
| 5. Tests | DONE | Browser: no mark label with `scrollWidth > clientWidth`. Browser: header background equals `--c-<hue>-lane` and name colour equals `--c-<hue>-lane-txt`, under light and mocha. State: a software-tier project on the Build lane. Every case names its revert, all run (below). |
| 6. Visible changes | DONE | Before and after below. |

## Verification (from `tools/oculus`)

The last two edits were comments only: `state/focus.ts:178-184` and three comments in `tests/ui/colours.test.ts`. After them: `npm run check`, lint, format check, ASCII gate, build, and `npx vitest run tests/state/focus.test.ts tests/ui/colours.test.ts` (56 passed). The full vitest and browser runs below were before those two comment edits.
- `npx vitest run --reporter=dot`: "Test Files 233 passed (233)", "Tests 3923 passed (3923)", "contrast: 6324 pairs over 17 themes". No timing test needed a rerun.
- `npm run check`: "COMPLETED 1170 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS"
- `npm run build`: exit 0. `npm run lint`: exit 0. `npm run format:check`: "All matched files use Prettier code style!"
- ASCII perl gate: printed nothing, exit 0.
- `npx playwright test tests/browser/focus-look.spec.ts tests/browser/focus-buttons.spec.ts tests/browser/focus-drag.spec.ts tests/browser/board.spec.ts`: "13 passed (26.1s)". I waited for the lock and port to be free; nothing was deleted or signalled.

## Reverts run (change applied, test run, file restored and `cmp` checked)

Node suite:
- `readable(text, lane)` replaced by `text`: all 17 per-theme contrast cases red, 351 lane pairs under 4.5:1.
- No lane minted: "measures a lane header pair for every hue of every theme" and "mints a lane only from a hue and only over a panel" red.
- `-lane` skip removed: "mints a lane only..." red.
- Lane made over the chip when there is no panel: "mints a lane only..." red.
- `movable` always true: "moves a project of any tier to a lane and only a live one to holding" red.
- `if (!live(project)) continue;` back in `laneItems`: "draws a coauthor, an archive and a software project on the lane their focus names" red.
- `live` dropped from `waiting`: "leaves the waiting tallies over the live tiers" red, plus the existing tallies test.
- `live` dropped from `backlog`: "keeps them out of the backlog and the unplaced hint" red.
- `holding` or unset sent to a lane: 3 cases red, including "leaves a coauthor project in holding...".
- LaneHead style back to `var(--c-hue)` and `-txt`: the view tests "draws every lane header on the surface of its own hue..." and "keeps the funding lane gold..." red.
- Band funding header as a plain row: the same two view tests red.

Browser, `focus-look.spec.ts` (test 1 = archive card and marks, test 2 = header tokens and opacity, test 3 = menu and drop):
- Live filter back in `laneItems`: tests 1 and 3 red.
- Marks as `span.chipicon`: test 1 red.
- `.card-h` without `flex-wrap` and `.mark` without its no-shrink rule: test 1 red (a clipped label).
- Header name in `--c-<hue>-txt`: test 2 red.
- Header filled with `--c-<hue>-bg`: test 2 red.
- `.cluster.muted .lane` faded whole again: test 2 red.
- Ideas item added to `menuFor`: test 3 red.
- `movable` always true: test 3 red. The manifest read `focus: holding`.

Test 3 dispatches the card's `dragstart` and the Ideas list's `dragover`, `drop` and `dragend` itself. A pointer `dragTo` onto the below-the-fold Ideas lane fired no drop, and under that revert the test stayed green. A flame-badge press follows the drop, so the test waits on a known write before reading the file.

## Visible changes, before and after

Before-numbers below are the reviewer's measurements (1400x1000, base build), not rerun by me. After-numbers are mine, from a scratch probe spec at the same viewport on this build.
- **Lane headers (9 lanes, Ideas, Funding, Jobs, Teaching):**
  - Before: name in ink and count in `--muted-txt` at normal weight on the panel; hue only in the 3 px top border.
  - After: a rounded strip in `--c-<hue>-lane`; name and count in `--c-<hue>-lane-txt`, count at weight 600 (light, Run: `rgb(15, 118, 52)`); top border kept.
  - Header height 19 to 25 px in light, 17 to 23 px in terminal themes (after: 25 light, 23 mocha and dracula).
- **Lane sub-line:** top margin 2px to 4px in `Lanes.svelte` and `Band.svelte`.
- **Muted clusters (Parked, Incubate, Ideas):**
  - Before: the whole lane at 0.9 opacity, frame and header included.
  - After: only the sub-line and the cards' area at 0.9. The frame, top border and header draw at full opacity.
- **Status marks on lane cards:**
  - Before: a bare line icon in the status hue, word only in the tooltip.
  - After: `ui/Tag` with glyph and word in the status hue at `--fs-sm`, same position; a mark that does not fit moves whole to the next line.
  - Terminal themes: `Tag.svelte` wraps each mark in `[` `]` (`body.rice .tag:not(.bracketed)`). A glyph whose ASCII stand-in is already bracketed gets no extra pair, so the reviewer saw `[n] journal article` beside `[ >< co-author ]`.
- **Card heights and the header row:**
  - Light: `streaming-anomaly` 75 to 103 px, `tensor-sketch` (Ideas) 98 to 110 px.
  - Mocha: Push cards 57 to 80 px, Revise 72 to 95 px; after: `tensor-sketch` 117 px (no before-figure).
  - In mocha and dracula, "Move to" and the due tag drop to a second line on 4 of 7 lane cards; in light, on 2 of 7.
- **Coauthor, archive and software cards on a lane:**
  - New: they appear on the lane their `focus:` names.
  - New: their flame badge writes `priority:` and their "Move to" menu writes `focus:` and `priority:` into those manifests; before, no Focus control reached them. The flame write into an archive manifest is exercised by browser test 3. The menu write for such a card is not verified in a browser.
  - Their drop onto Ideas is refused.
- **Hue text everywhere else:** unchanged (probe: 0 of 1513 derived tokens changed).
- **Projects view:** marks unchanged in markup (icon only, `Projects.svelte:285-287`) and in colour.
- **Wallpaper:** the header strip is opaque over the translucent lane, the only form the colour gate allows for a hue fill.

## Doc text (not edited, per the brief)

**HELP.md line 74.** Current:
`| \`focus\` | Focus | What wants attention now: deadlines, overdue items, follow-ups, the week's ticker and the career strategy. |`

Replacement:
`| \`focus\` | Focus | What wants attention now: deadlines, overdue items, follow-ups, the week's ticker, the lanes and the career strategy. A project of any tier, coauthor, archive and software included, sits on the lane its \`focus:\` names, and only a project of the ideas, active or manuscripts tiers can be dropped on the Ideas lane. Each card shows its first two statuses as a glyph and a word in the status's colour, and each lane's header is a strip of the lane's colour. |`

**DESIGN.md line 228** (Theming paragraph). After the sentence ending "...which the contrast test also measures.", insert:
`For every hue it also derives \`--c-<hue>-lane\`, a fifth of the hue in the panel, which the header of a Focus lane and of the Funding, Jobs and Teaching columns fills with (\`views/focus/LaneHead.svelte\`), and \`--c-<hue>-lane-txt\`, the hue's text colour made readable on that surface first, which the header's name and count are drawn in, so no other hue text changes; the contrast test measures that pair under every theme.`

**DESIGN.md "Decisions taken"**, new bullet after line 329:
`- 2026-09-16, Axel: the Focus board draws what a manifest places. \`laneItems\` puts a project of any tier on the lane its \`focus:\` names, so a coauthor, archive or software project placed on a lane is on it, and its flames and Move to menu write its manifest as they do any card's; the ideas backlog, the unplaced hint and the people and venue tallies of the awaiting strip stay over the three live tiers, and \`movable\` refuses a drop of any other tier on the Ideas lane, since \`holding\` would take it off the board. A lane card's status marks are \`ui/Tag\`s carrying the glyph and the word in the status's tone. A lane header is one partial, \`views/focus/LaneHead.svelte\`, painted in \`--c-<hue>-lane\` and \`--c-<hue>-lane-txt\` at full opacity; a muted cluster fades a lane's sub-line and cards, never its header. Package Q37.`

## Files changed (line counts now)
- `src/lib/state/focus.ts` 300
- `src/lib/themes/derive.ts` 253
- `src/lib/views/Focus.svelte` 225
- `src/lib/views/focus/LaneHead.svelte` 57 (new)
- `src/lib/views/focus/Lanes.svelte` 547
- `src/lib/views/focus/Band.svelte` 271
- `tests/contrast.test.ts` 144
- `tests/state/focus.test.ts` 763
- `tests/ui/colours.test.ts` 613
- `tests/views/focus.test.ts` 855
- `tests/views/type-scale.test.ts` 237
- `tests/browser/focus-look.spec.ts` 204 (new)

Scratch files (probe scripts, revert variants, a probe Playwright config with a `package.json` marking it an ES module) are under `q37-builder` only.
