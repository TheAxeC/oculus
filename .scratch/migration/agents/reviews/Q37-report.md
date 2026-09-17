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
