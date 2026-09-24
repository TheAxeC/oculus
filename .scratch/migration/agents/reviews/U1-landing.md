# U1 landing

## Open items, verbatim from the state file

- U1, the `glyph:` key on each theme row of `config/appearance.yml` (raised 2026-09-24 at U1's review; asked in chat the same day). The key names the icon drawn beside a theme in the Settings theme menu; a missing or unknown one is a finding and the entry is drawn with its words alone. Options: (a) keep the key, one line per theme, so each theme can carry its own icon; (b) no key: one fixed icon for the ordinary themes and another for the terminal themes, as the old characters did. Recommended (a): an icon per theme is a choice of the reader's, and the findings already hold it. (b) is the lazy option only in that it adds nothing.

Booked list: 1, carried for O32: O32's launch recipes in the Ordo plan skills, waiting on the Ordo session.

## NOT DONE

- The Teaching column's icon was not seen on the TEST page: this hub has no active teaching entry, so the column is not drawn; the browser case draws it from a fixture.
- The light theme was not looked at on screen; the browser cases read the theme menu and the Focus columns under light and mocha.

## What landed

U1, cherry-picked from `.agents/worktrees/U1` at base `a7769781` onto main by `tools/oculus/.scratch/migration/land.sh U1 a7769781 --no-browser` (+1,552 -817 over 86 files before the landing fixes; the browser suite run by hand afterwards).

- Every glyph is drawn as its line icon; in the ASCII mode of the terminal themes, as its stand-in. `config/catalogs/glyphs.yml` is one ASCII map of name to stand-in, each one to three characters; the unicode column is gone, and a check fails on a stand-in over three characters.
- The 28 text tokens are gone: the theme menu, the Focus columns, the Lit Watch intro, the HPC pill, the Update tray note and the refused-save line draw icons beside their words.
- The Venues cards draw a check or cross from `registries/venues.yml` as an icon; the file is unchanged. The venue sparkline is SVG bars in the text colour (shown under terminal themes, as before).
- A mark badge's hover is words. The toggle reads Icons; a choice saved under the old name is read once and kept.
- Config mistakes are findings, never a broken view: an unknown theme glyph, a repeated theme, an inherited name such as `constructor` in the glyph or icon lists.
- The ASCII gate no longer exempts `glyphs.yml`: in `land.sh` and in `agents/spec.md`'s command, following Axel's ruling that the file holds no unicode.

## What was found

The first review found the sparkline in the accent against the brief, config names that could throw a view, the rename half done, two stand-ins wider than their box, and the venue emoji still drawn; the repair round closed each. The run over the round found the radar separators drawn only by CSS and read aloud, a source-text case not named as an audit, and three glyph lookups reading inherited names; each is closed at this landing, with the HELP venue sentence and the Config view's descriptions. The orchestrator's premise that the sparkline showed on every theme was wrong: it shows under terminal themes only. Every finding is under the Closed heading of `agents/reviews/U1-refuter.md`.

## Verified on main

```
npm test -- --reporter=dot          Test Files 292 passed (292); Tests 4633 passed (4633)
npm run check                       COMPLETED 1333 FILES 0 ERRORS 0 WARNINGS
npm run build                       exit 0
npm run format:check                All matched files use Prettier code style!
npm run lint                        exit 0
the ASCII gate, no glyphs.yml pass  prints nothing
sh bin/size-check.sh                exit 0
sh bin/folder-check.sh              exit 0
grep -rn "{G\." config src          nothing
npm run test:browser                334 passed (6.8m)
node bin/revert-check.mjs           radar, venues and config-folder tests: 19 reverts, 0 unproven
```

## The look, on the TEST page

The dev server on 8790 was restarted with its dependency cache cleared. Under `vscode-dark-modern`: the Settings theme menu lists 17 themes, each with a line icon and no character outside ASCII (read from the page); the toggle reads Icons. Lit Watch: the intro has five icons, its separators are markup hidden from a screen reader, and the work area holds no character outside ASCII. Focus: Funding and Job applications draw their icons; the only non-ASCII character on the page is the accented letter of a name, which the rules keep. Venues: "WoS SCIE" and "Scopus" with a check icon, and "WoS" with a cross where a venue is not indexed, aligned with their words, no character outside ASCII.

## What is next

L5, the rail drawn like VS Code's activity bar.
