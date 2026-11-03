# O125 landing

Roadmap entry: the cockpit-to-oculus migration. Step O125, a group's heading strip solid over a wallpaper. Next: O126, the Sessions tab's shape, building.

## Open items

- Open item 641 (2026-11-03), Axel's question whether the cards should show a date such as the year a paper was published. The manifest's `year` (manifest-schema.yml:60, "The year of the paper or of the project") is set in 50 of the hub's 120 manifests, in every one at the stages submitted, accepted and published; the boards already filter by it (`takes.ts:94`); no card draws it. The `public` stage flag also covers in-prep, submit-ready, submitted and revision, so the year of a paper in flight is not a publication year. (a) Recommended, a judgment: a year tag (glyph and number, tip "Year: 2025") in the facts row of the project board card and the Focus lane card, drawn only at the stages that carry both `terminal` and `public` (accepted and published), so it always reads as the year the paper appeared; a new step after O126. (b) The tag on every card whose manifest has a year; cons: 21 of the 50 read 2026 and a submitted paper's year reads as published. (c) No change; the lazy option.

## Steps 1

The runner's agent listing showed one subagent, O126's builder a60c985f78f84ef3c, running; none of O125's agents (the builder a12f7e08639814708 and the reviewers a443d746ae26f8353 and a0996b58b66546e51 had each sent their completion notice).

## Not done

Nothing in the brief is left undone. Not seen on the look: the Calendar's headings, Problems' table, a free float, the Sessions list's groups and a diff of several files, since the scratch HOME has no calendar account, no problems, no sessions and no repository; each is settled by reading the rule that paints it.

## What landed

The whole range from base 2760ac090 (the builder's work under its cases ruling, repair round 1, wip commit 0b24f492f) plus three fixes at landing, 11 paths: `docs/HELP.md`, `FloatLayer.svelte`, `UpdateTray.svelte`, `tokens.css`, `GroupHead.svelte`, `Table.svelte`, `Calendar.svelte`, `FileHeader.svelte`, `Problems.svelte`, `ProcessTable.svelte`, `Gallery.svelte`. Over a wallpaper a group's heading, a `stays` table's header row, the Calendar's header rows, a diff's file header and the Processes actions column now paint `--panel` solid with no blur; without a wallpaper nothing changes.

Verification in the gate, `npm run diagrams && npm run docs:palette && npm run test:quick` with the fixes: `test:quick: 45.6 s; every command passed`; the staged diffs of main and the gate are equal under `cmp`.

Fixes at landing: ruling 640 (the Processes actions column solid, its comment, the `tokens.css` paragraph and `docs/HELP.md:571`); R3 (`GroupHead.svelte:17-18`); R1 and R2 closed in the booking.

The look (scratch server on 8797 from the gate, wallpaper on, dark theme), computed style: every GroupHead strip seen paints `rgb(31, 31, 31)` with no backdrop filter (Focus, the docked Live HPC float, Settings, Account setup, Status's Gallery and Cards, the Update tray); the Gallery tones table's header paints `--panel`; plain table header rows paint nothing; the Processes actions column paints `--panel`. The server is stopped.

## Usage

Builder a12f7e08639814708: first run 146862 tokens, 26 tool uses, 4 min 11 s; after the cases ruling 184103 tokens, 29 tool uses, 4 min 56 s; round 1 236317 tokens, 42 tool uses, 6 min 5 s. Brief check a65323d96f2f0ed22: 169675 tokens, 65 tool uses, 7 min 59 s. Reviewer a443d746ae26f8353: 208795 tokens, 73 tool uses, 10 min 42 s. Reviewer over round 1 a0996b58b66546e51: 181256 tokens, 42 tool uses, 6 min 56 s. All claude-opus-5-5. The first report did not pass its bar: one repair round.

## Next

O126's report, its review, its round and its landing.
