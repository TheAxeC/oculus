# O124 landing

Position: roadmap entry "migration (cockpit to oculus)"; step O124, the System page's merges, landed. Next: O123, sessions move into the Explorer, its repair round's report, /refute over it, /land.

## Open items

- Open item 637 (2026-11-03), from this look. Over a wallpaper a group's sticky strip is painted at `wallpaper.panel_opacity` (0.8), so what scrolls under it shows at 20 %, sharp when `wallpaper.blur` is 0. (a) Recommended: inside a `Surface` or a tinted pane the strip paints solid `--panel`, for every view. (b) Keep it translucent as now; the lazy option. The full text is in `orchestrator-state.md`.

## The check of Steps 1

`ListAgents` shows neither O124's builder nor a reviewer of it; the only subagent listed is O123's builder.

## NOT DONE

Nothing in the brief is unbuilt. The cases below "Not seen" were not taken on a page.

## What landed

Audit is a section of Findings with one count; Gallery is a closed section of Status that mounts nothing until opened; the views `audit` and `gallery`, their tabs in `config/defaults/layout.yml` and the `audit` count row are gone; 46 paths, +1385 -1354, from base d3a38520a. `~/.oculus/layouts.json` page 6 lost the two tabs and their `views` entries.

## Checks

In the gate `npm run diagrams && npm run docs:palette && npm run test:quick` printed `test:quick: 297.1 s; every command passed`. `cmp` of main's and the gate's staged diffs reports no difference. `docs/diagrams/layers.dot` and `layers.svg` came from the gate's regeneration.

## The look

Scratch server on port 8797 from the gate, dark modern with the wallpaper, with it hidden, and mocha.

- System page's bottom pane: tabs Status, Findings, History; no Audit or Gallery tab.
- Findings: rail badge, tab count and status bar warnings all 2. Search: a word in one row gave Audit 1, Missing data 1; a word in none gave "No finding matches the search."; the tab stayed 2. Mute moved a row to Muted 1 with the tab at 1; un-mute gave 2 back.
- Fold Missing data held over a reload. A `beforematch` dispatched on a row inside folded Audit and folded Missing data opened both. Arrow keys stepped the cursor through both rows. One `data-instance` in the view.
- Status: Gallery folded with no card and no search; opened, 8 sections, 4 cards, search and Segment; Reset at the strip's right end; it stayed open over a reload. Socket, snapshot counts, line counts and hooks are drawn.
- Scrolled in a 335 px body: Gallery strip at 0, Chips strip under it at 26 px. With the wallpaper hidden the strip is solid and nothing shows through. With the wallpaper the strip is 0.8 opaque and the chips show behind it, which is GroupHead's rule for every view: open item 637.
- Mocha: Findings and Gallery read, each sample card with its own fill.
- The Views catalogue shows History y7 and Processes y8. A pane forced to 210 px keeps Reset inside the strip and wraps the bar to 54 px.
- No console error.

Not seen: a real browser find-in-page (the event was dispatched), the free float, Enter on a row and a place press, Write the website, a key choice (the fixture has no file finding, so the Files group is not drawn), both lists empty, pressing Reset, the sample cards' keyboard cursor, pressing y7 and y8.

## Findings

R1, R2, R3 of the run over round 1, closed at landing (`O124-refuter.md`, Closed). R1 records the builder's fifth run of the full list against its brief.

## Usage and bars

The first report did not pass its bar: one repair round. Fixes at landing in code: none. Builder aa1e08bc105965980: first run 243408 tokens, 30 tool uses, 8 min 3 s; build 131563, 196, 40 min 20 s; round 1 196669, 45, 23 min 32 s. Brief check a245ccc2df2413f9c: 236996, 28, 9 min 55 s. Reviewer a430c5101b0e5d36b: 303279, 41, 24 min 38 s. Reviewer over round 1 a33bae9f11781ca38: 260684, 34, 13 min 14 s. No A/B: no bench for this step.

## Next

O123's repair round report, /refute over it, /land with its data edit.
