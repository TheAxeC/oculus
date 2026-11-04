# O141 builder report

Everything in the brief and in repair round 1 is done. No header was handed back: every `-lane` surface is 10 or more from `--panel` in every theme, with bars 1 and 2, C11 and C12 holding.

Points that need a ruling or a reading before landing, each set out below:
1. Scope and Blocked share a red in 48 themes; the two never touch (section "For the coordinator", point 2).
2. Jobs keeps `grey-d` rather than a surface tint (point 3).
3. An app colour theme converted at run time by `themeSheet` does not get the converter's `ADDED` tokens, so Tomorrow Night Blue loaded that way would draw the headers without the fix (point 4).
4. In everforest the Idea lane header's text turns from light to dark (point 5).
5. In nord, onedark and solarized the Jobs header (`grey-d`) is now a light grey-blue, and in onedark and solarized the Review header (`slate`) is light too (point 5).

## Open items of the state file, verbatim

The worktree's `.scratch/migration/orchestrator-state.md:171-175` (`grep -n '^## Open items' -A6`): the section "## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)" holds no entry. Its only text is: "An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own." The worktree's copy is the one at main's head when the worktree was made; I did not open the main checkout's copy.

## Repair round 1

Full verify list runs: 1, after the last change to a source file. No command failed, so none was rerun. The output is `W-verify-1.txt` in the scratch folder, quoted under "Verify list and checks after the last change".

### Item 1, the head comments

Each sheet's head now says, in two sentences, what the added hues do and how they were picked. The catppuccin head as it stands (`src/lib/themes/rice/catppuccin.css:1-11`):

```css
/* Catppuccin (catppuccin.com, MIT): Mocha, Macchiato and Frappe, then Latte. The teal of Macchiato
   and of Frappe is oculus's own, chosen to read apart from the theme's other status hues. The
   `--c-blue` of Frappe and the `--c-slate` of Mocha are oculus's own as well: each brings the Focus
   headers drawn in it that touch with every cluster open to a CIEDE2000 of 10 or more from each
   other and from the panel, and stays 10 or more from every other status hue of the theme, on the
   hue and on its `-txt`. Each was picked as the nearest to the palette's colour, or to tokens.css's
   where the palette gives none (the slate of Mocha), among the hexes of the palette's own block and
   an OKLCH grid around that colour (lightness 0.15 to 0.97 in steps of 0.01, chroma x0.6 to x1.4 in
   steps of 0.2, hue -20 to +20 in steps of 10), with every measure at 10.5 or more. One block per
   palette, each a set of overrides on the tokens of tokens.css; the shape every rice palette shares
   is `body.rice` in themes.css, and the theme list's rows are the `themes:` rows of
   config/defaults/appearance.yml. */
```

The same two sentences, with the hues each sheet adds:

| File | The hues it names | The colour each was picked near |
| --- | --- | --- |
| `rice/singles.css:1-21` | Nord `--c-blue`, `--c-slate`, `--c-grey-d`; Dracula `--c-grey-d`; Solarized `--c-green`, `--c-slate`, `--c-grey`, `--c-grey-d`; One Dark `--c-slate`, `--c-grey`, `--c-grey-d` | the palette's colour, tokens.css's for Nord's slate and grey-d |
| `rice/kanagawa.css:1-11` | Dragon `--c-blue`; Lotus `--c-green`, `--c-gold` | the palette's colour |
| `rice/catppuccin.css:1-12` | Frappe `--c-blue`; Mocha `--c-slate` | the palette's colour, tokens.css's for Mocha's slate |
| `rice/gruvbox.css:1-12` | dark `--c-slate`; light `--c-green` | the palette's colour, tokens.css's for the dark slate |
| `rice/rosepine.css:1-11` | Dawn `--c-blue` | the palette's pine |
| `rice/everforest.css:1-11` | dark `--c-mauve` | the palette's purple |
| `themes.css:1-22` | dark `--c-slate` | tokens.css's slate |
| converter `ADDED`, written into `vscode.css` | Tomorrow Night Blue `--c-blue`, `--c-slate`; Solarized Dark `--c-slate`; Quiet Light `--c-grey` | tokens.css's colour of the token's name (`#2563eb`, `#475569`, `#9ca3af`) |

"Its own block" is what the program reads as candidates: `start.own[theme]`, the tokens the theme's own class blocks set (`case-run.mts`, `--hue`). Three picks are own-block hexes: nord slate `#4b432c` (`--c-amber-s`), Tomorrow Night Blue slate `#7285b7` (`--c-code-comment`) and Quiet Light grey `#6d705b` (`--muted`). The rest are grid points.

The VS Code sentence differs in one place: the converter writes `--panel` where the rice heads say "the panel", and it adds "since the theme gives none", which `blockOf` enforces by failing when the mapping already gives an `ADDED` token.

### Item 2, wrapping

Every edited comment paragraph was rewrapped as a whole, greedy at 100 columns. The check, over the head of each sheet: for every line but the last, the line plus one space plus the next line's first word is over 100 columns, and no line is over 100. It printed nothing. `awk 'length>100'` over `rice/*.css`, `themes.css` and `vscode.css` prints nothing.
- `singles.css:10-21` and the paragraph it belongs to are rewrapped together.
- The Tomorrow Night Blue comment is written by the converter's `wrapped()`, at its `WIDTH = 100`.
- `themes.css:2-3` keep the base break before "VS Code" so the name stays on one line; line 2 is 97 columns. Line 3 ends short because the next word is the 42-column path `utils/migrations/convert-vscode-themes.ts`, as in the base.
- The converter's own head paragraph (`convert-vscode-themes.ts:25-35`) passes the same fill check; its one flagged line, `:21`, is an item of a list.
- `derive.ts:84-95`, the `LANE_SHARE` doc, is rewrapped whole.

### Item 3, the C3 count

```
$ grep -c '^  moved ' H2-after-final.txt
250
```

The round-0 report's 433 counted every line holding "moved", which includes the 182 `open moved` lines and the summary line `open-layout measures that moved: 182`. On the tree after this round:

```
$ grep -c '^  moved ' R1-plain.txt
312
```

### Item 4, the readers of each changed hue

Found with `grep -rnE "['\"](blue|green|gold|grey-d|mauve|slate|grey)['\"]" src` and `grep -rnoE -- "--c-(blue|green|gold|grey-d|mauve|slate|grey)(-[a-z]+)?\b" src` outside `src/lib/themes/` (`R4-var-readers.txt`, 54 lines; `--c-green-d` lines dropped, a separate token), and in config with `grep -rnE --exclude=local.yml` of the token names and of the palette hexes that map to them. A reader that takes a tone name draws the token `--c-<tone>` and its derived `-txt`, `-lane` and tints.

**blue**, changes in nord, frappe, kanagawadragon, rosepinedawn, vscode-tomorrow-night-blue:

| Reader | View |
| --- | --- |
| `src/lib/ui/display/hues.ts:10` `HUES`, read by `views/sources/repositories/graph/Lanes.svelte:37` and `views/personal/calendar/Calendar.svelte:172` | Source Control Graph lane colours; Calendar event colours |
| `state/forms/career-view.ts:40` | Career form, positions |
| `views/shared/sessions/sections/TimelineTurns.svelte:40,141` | Session timeline, prompt turns |
| `state/shared/words/tones.ts:302` (`ICON_HUES`, blue icon) | status legend icons, every view with a legend |
| `state/sources/registries/venues.ts:77` | Venues, Q2 / core A rank |
| `views/shared/changes/repo-shape.ts:30`, read by `views/sources/repositories/RepoList.svelte:308` | Repositories list, shape badge |
| `views/sessions/session-list/SessionWorkspace.svelte:85` | Sessions list, idle |
| `data/model/machine/model-machine.ts:271` with `state/sessions/terminal/terminal-marks.ts:17` | terminal, ANSI blue |
| `data/helpers/files/apps/tools/decoration-colors.ts:17,19,31,34,42` | app colour decorations (submodule, `charts.blue` and others) |
| `ui/controls/editor/kit/theme/colours.ts:443-464` | editor: info colours, minimap and ruler info, peek and merge colours |
| `views/sources/search/problem-rows.ts:176` | Search, info glyph |
| `config/catalogs/vocab.yml:184,112,295,238` | Focus Push lane; `accepted` status; `pillar`; `role` facet tone |

**green**, changes in solarized, gruvboxlight, kanagawalotus:

| Reader | View |
| --- | --- |
| `hues.ts:10` (`HUES`), as above | Source Control Graph; Calendar |
| `TimelineTurns.svelte:43` | Session timeline, agent turns |
| `tones.ts:299` | status legend icons |
| `venues.ts:84` | Venues, free to publish |
| `state/system/machine/hpc/hpc.ts:149,152` | HPC, running jobs and fill |
| `shell/rail/rail.ts:82` (`URGENT_TONES`) | rail badges: ranks the tone, draws no colour |
| `state/system/machine/recover-words.ts:137`, `views/sources/data/recover/RecoverAccess.svelte:20` | Data recovery |
| `views/personal/account-setup/AccountSetup.svelte:93`, `views/shared/forms/accounts/AccountList.svelte:87` | Account setup and accounts |
| `views/shared/card/project/CardSessions.svelte:33,64`, `views/shared/sessions/sections/AgentRows.svelte:42`, `details/detail-facts.ts:73`, `SessionWorkspace.svelte:84` | project card sessions; session agents and meter; Sessions list |
| `views/feeds/literature/LiteratureCard.svelte:178`, `views/feeds/linkedin/Linkedin.svelte:335` | Literature; LinkedIn |
| `views/system/machine/usage/Usage.svelte:97,98`, `hpc/Login.svelte:103`, `hpc/Quota.svelte:12`, `hpc/Recent.svelte:72`, `hpc/Capacity.svelte:142` | Usage; HPC |
| `views/boards/collection/rail-part.ts:15`, `registration.ts:60` | collection boards, rail badge |
| `model-machine.ts:269` with `terminal-marks.ts:15,53` | terminal, ANSI green |
| `decoration-colors.ts:22,35,40`, `colours.ts:496,499`, `editor/kit/theme/theme.ts:79` | app decorations; editor success colours and `markup.inserted` |
| `views/shared/changes/ChangeCounts.svelte:38`, `views/sources/search/RefactorPreview.svelte:265`, `search/Results.svelte:336`, `views/sources/venues/Ribbon.svelte:263` | change counts; Search; Venues ribbon |
| `vocab.yml` lines 66, 74, 119, 121, 131, 134, 136, 139, 140, 152, 183, 198, 203, 210, 271, 279, 283, 310 (`#16a34a`) | Focus Run lane, stages, statuses, band stages, `rail_color`, `data_access: open` |

**gold**, changes in kanagawalotus:

| Reader | View |
| --- | --- |
| `career-view.ts:42` | Career form, awards |
| `tones.ts:301` (yellow icon) | status legend icons |
| `terminal-marks.ts:16` | terminal, ANSI yellow |
| `decoration-colors.ts:20,41` | app decorations, `charts.yellow` |
| `colours.ts:492` | editor, bracket colour 1 |
| `vocab.yml:214` (`funding: gold`), `vocab.yml:68` (`#a16207`) | Focus Funding band column; `in-prep` stage |

**grey-d**, changes in dracula, nord, onedark, solarized: `vocab.yml:214` (`jobs: grey-d`, the Focus Jobs band column) and `vocab.yml:235` (`hub` facet tone). No reader in `src`; the palette hex `#6b7280` is used by no vocab entry.

**mauve**, changes in everforest: `vocab.yml:192`, the Focus Idea lane, its top border and its group heading. No reader in `src`.

**slate**, changes in dark, nord, onedark, solarized, mocha, gruvbox, vscode-tomorrow-night-blue, vscode-solarized-dark:

| Reader | View |
| --- | --- |
| `tones.ts:305` (black icon) | status legend icons |
| `state/feeds/inbox.ts:68` | Inbox, kinds without a tone |
| `hpc.ts:149` | HPC, jobs neither running nor pending |
| `state/sources/repositories/repositories.ts:703` | Source Control, untracked files |
| `AgentRows.svelte:45,74` | session agents, done and the fallback |
| `hpc/Recent.svelte:74` | HPC, recent jobs |
| `SessionWorkspace.svelte:87`, `CardSessions.svelte:36` | Sessions list, archived; project card sessions |
| `vocab.yml:186,145,283` | Focus Review lane; `withdrawn`; `data_access: private` |

**grey**, changes in onedark, solarized, vscode-quiet-light:

| Reader | View |
| --- | --- |
| `tones.ts:34` (`UNKNOWN_TONE`), `tones.ts:304` | every tone that resolves to nothing; status legend icons |
| `state/feeds/leads.ts:168-173`, `views/shared/card/feed/LeadCard.svelte:312,360` | Leads |
| `state/feeds/radar.ts:96` | Radar, low relevance |
| `venues.ts:78,87` | Venues |
| `repositories.ts:748`, `RepoList.svelte:308` | Source Control status fallback; Repositories list badge fallback |
| `SessionWorkspace.svelte:86`, `CardSessions.svelte:35` | Sessions list, ended; project card sessions |
| `ui/controls/editor/gutter/marks.css:64` | editor, disabled breakpoint |
| `vocab.yml:188,77,123,146-153,276,297` | Focus Backburner lane; `stopped`, `paused` and the closed statuses; `dead-ends`; `offpillar` |

The hub's own data can name these colours too; I did not read it.

### Item 5, Tomorrow Night Blue into the converter

- `themes.css` holds no Tomorrow Night Blue block, and its head is the base text plus the dark-theme sentence of item 6.
- `utils/migrations/convert-vscode-themes.ts:74-103` holds `BRINGS`, `AMONG` and the table `ADDED`, keyed by class; `describe` (`:258-259`) appends `Added by oculus: <why>` to the block comment, `blockOf` (`:263-272`) writes the entries after `mapTheme`'s and fails if the mapping already gives one, and `build` fails on a key no converted theme has (`:306-307`).
- The file head (`:33-35`) and the generated sheet's head (`headOf`, `:274-278`) say the tokens oculus adds are written from `ADDED`. No file under `docs/` names the converter or `vscode.css` (`grep -rnE 'convert-vscode-themes|vscode\.css' docs README.md CLAUDE.md` prints nothing).

The run, `node utils/migrations/convert-vscode-themes.ts`:

```
wrote .../src/lib/themes/vscode.css and .../src/lib/themes/vscode-rules.json: 19 themes of VS Code 1.137.0
```

`vscode-rules.json` is byte-equal to the base (`diff` prints nothing). `git diff -- src/lib/themes/vscode.css` (`vscode-run-diff.txt`):

```diff
@@ -5,9 +5,9 @@
    block sets the chrome tokens, the Source Control tokens, the diff's outlines of inserted and
    removed text (--diff-added-outline, --diff-deleted-outline), the Source Control Graph's three
    name colours (--c-graph-ref, --c-graph-remote, --c-graph-base), the tab tokens the theme
-   holds, the window's title bar strip (--titlebar-bg, --titlebar-txt, --titlebar-line) and the
-   six code hues; its comment names each token that VS Code's registered default or oculus's base
-   gave. */
+   holds, the window's title bar strip (--titlebar-bg, --titlebar-txt, --titlebar-line), the six
+   code hues and the tokens oculus adds to that theme (the converter's ADDED); its comment names
+   each token that VS Code's registered default or oculus's base gave and each token oculus adds. */
@@ -193,7 +193,13 @@ body.vscode-light-visual-studio {
    --titlebar-txt (titleBar.activeForeground). oculus base: --c-scm-conflict-bg,
-   --diff-added-outline, --diff-deleted-outline. */
+   --diff-added-outline, --diff-deleted-outline. Added by oculus: --c-grey is oculus's own, since
+   the theme gives none: it brings the Focus headers drawn in it that touch with every cluster
+   open to a CIEDE2000 of 10 or more from each other and from --panel, stays 10 or more from
+   every other status hue of the theme on the hue and on its -txt, and was picked as the nearest
+   to tokens.css's #9ca3af among the hexes of the theme's own block and an OKLCH grid around that
+   colour (lightness 0.15 to 0.97 in steps of 0.01, chroma x0.6 to x1.4 in steps of 0.2, hue -20
+   to +20 in steps of 10), with every measure at 10.5 or more. */
 body.vscode-quiet-light {
@@ -225,6 +231,7 @@ body.vscode-quiet-light {
     --c-code-string: #448c27;
+    --c-grey: #6d705b;
 }
@@ -729,7 +736,13 @@ body.vscode-red {
-   --diff-added-outline, --diff-deleted-outline. */
+   --diff-added-outline, --diff-deleted-outline. Added by oculus: --c-slate is oculus's own,
+   since the theme gives none: it brings ... [the same sentence, nearest to tokens.css's #475569] ... */
 body.vscode-solarized-dark {
@@ -769,6 +782,7 @@ body.vscode-solarized-dark {
     --c-code-string: #2aa198;
+    --c-slate: #505575;
 }
@@ -781,7 +795,14 @@ body.vscode-solarized-dark {
-   --diff-added-outline, --diff-deleted-outline. */
+   --diff-added-outline, --diff-deleted-outline. Added by oculus: --c-blue and --c-slate are
+   oculus's own, since the theme gives neither: each brings ... [the same sentence, nearest to
+   tokens.css's colour of its name (#2563eb, #475569)] ... */
 body.vscode-tomorrow-night-blue {
@@ -819,6 +840,8 @@ body.vscode-tomorrow-night-blue {
     --c-code-string: #d1f1a9;
+    --c-blue: #699bff;
+    --c-slate: #7285b7;
 }
```

The two elided comments are quoted in full in `vscode-run-diff.txt`. The diff reaches past the Tomorrow Night Blue block in two ways, and I kept the generated file:
- The sheet's head is `headOf`'s text, which item 5 asks to update so it names the added tokens. Copying the base `vscode.css` back would make `--check` fail on the head.
- Quiet Light and Solarized Dark get `ADDED` entries under item 6, which routes a VS Code theme's hue through this table.

After the run: `node utils/migrations/convert-vscode-themes.ts --check` prints `19 themes up to date`. `--classes` prints:

```
  base: 49 classes; first 8: dark rice mocha macchiato frappe latte everforest everforestlight; vscode-tomorrow-night-blue at 47
  worktree: 49 classes; first 8: dark rice mocha macchiato frappe latte everforest everforestlight; vscode-tomorrow-night-blue at 47
```

### Item 6, every header against the panel

C13 is the program's `--panel` with no list, which takes every tone a Focus header resolves to. Its first run, on the tree as round 0 left it (`P0-panel-all.txt`, the same 12 tones given as a list):

```
  gold-lane against --panel: min 16.7 (gruvboxlight); median 26.5; under 10 in 0
  grey-d-lane against --panel: min 8.2 (nord); median 15.8; under 10 in 3: nord 8.2, onedark 8.9, solarized 9.3
  teal-lane against --panel: min 18.6 (vscode-solarized-dark); median 25.0; under 10 in 0
  green-lane against --panel: min 11.5 (kanagawalotus); median 28.8; under 10 in 0
  blue-lane against --panel: min 8.4 (vscode-tomorrow-night-blue); median 25.3; under 10 in 1: vscode-tomorrow-night-blue 8.4
  amber-lane against --panel: min 15.3 (kanagawalotus); median 26.5; under 10 in 0
  slate-lane against --panel: min 3.2 (nord); median 14.7; under 10 in 8: nord 3.2, vscode-solarized-dark 7.8, vscode-tomorrow-night-blue 7.9, onedark 8.9, mocha 9.0, dark 9.2, gruvbox 9.2, solarized 9.3
  red-lane against --panel: min 18.1 (vscode-red); median 28.6; under 10 in 0
  grey-lane against --panel: min 8.9 (onedark); median 16.5; under 10 in 3: onedark 8.9, solarized 9.3, vscode-quiet-light 9.8
  crimson-lane against --panel: min 17.7 (vscode-red); median 28.4; under 10 in 0
  honey-lane against --panel: min 15.3 (kanagawalotus); median 33.1; under 10 in 0
  mauve-lane against --panel: min 17.2 (vscode-red); median 24.9; under 10 in 0
```

The round-0 Tomorrow Night Blue blue `#003abc` is the 8.4 in that run, so that theme's blue was searched again from tokens.css's `#2563eb`.

Its run after the change (`P1-panel-after.txt`):

```
C13 every header tone's -lane against --panel, 12 tones over 49 themes:
  green-lane against --panel: min 11.5 (kanagawalotus); median 28.8; under 10 in 0
  blue-lane against --panel: min 13.9 (dracula); median 25.3; under 10 in 0
  amber-lane against --panel: min 15.3 (kanagawalotus); median 26.5; under 10 in 0
  slate-lane against --panel: min 10.4 (vscode-dark-plus); median 15.8; under 10 in 0
  red-lane against --panel: min 18.1 (vscode-red); median 28.6; under 10 in 0
  grey-lane against --panel: min 10.5 (light); median 16.7; under 10 in 0
  crimson-lane against --panel: min 17.7 (vscode-red); median 28.4; under 10 in 0
  honey-lane against --panel: min 15.3 (kanagawalotus); median 33.1; under 10 in 0
  teal-lane against --panel: min 18.6 (vscode-solarized-dark); median 25.0; under 10 in 0
  mauve-lane against --panel: min 17.2 (vscode-red); median 24.9; under 10 in 0
  gold-lane against --panel: min 16.7 (gruvboxlight); median 26.5; under 10 in 0
  grey-d-lane against --panel: min 11.4 (dracula); median 15.8; under 10 in 0
```

The hues, each the nearest pick of `--hue <theme> <token>` with every measure at 10.5 or more, and with C13 added to the measures (files `Q1-hue.txt` to `Q5-hue.txt`; the line each pick has there):

| Theme | Token, file:line | Old to new | From old | Panel | Picked as |
| --- | --- | --- | --- | --- | --- |
| nord | `--c-slate`, `rice/singles.css:58` (added) | `#475569` (tokens.css) to `#4b432c` | 24.2 | 10.8 | own block, `--c-amber-s` |
| nord | `--c-grey-d`, `rice/singles.css:59` (added) | `#6b7280` (tokens.css) to `#dfdff4` | 32.9 | 30.1 | OKLCH L 0.91 C x1.2 h +20 |
| solarized | `--c-slate`, `rice/singles.css:177` | `#586e75` to `#aad0d1` | 30.9 | 26.7 | OKLCH L 0.83 C x1.4 h -20 |
| solarized | `--c-grey`, `rice/singles.css:178` | `#586e75` to `#60767d` | 3.1 | 10.7 | OKLCH L 0.55 C x1 h +0 |
| solarized | `--c-grey-d`, `rice/singles.css:179` | `#586e75` to `#c1ccd5` | 31.2 | 26.7 | OKLCH L 0.84 C x0.6 h +20 |
| onedark | `--c-slate`, `rice/singles.css:236` | `#5c6370` to `#b7b8cf` | 30.6 | 24.6 | OKLCH L 0.79 C x1.4 h +20 |
| onedark | `--c-grey`, `rice/singles.css:237` | `#5c6370` to `#646c7c` | 3.6 | 10.6 | OKLCH L 0.53 C x1.2 h +0 |
| onedark | `--c-grey-d`, `rice/singles.css:238` | `#5c6370` to `#bfd0de` | 35.1 | 28.4 | OKLCH L 0.85 C x1.2 h -20 |
| mocha | `--c-slate`, `rice/catppuccin.css:49` (added) | `#475569` (tokens.css) to `#335469` | 6.3 | 11.3 | OKLCH L 0.43 C x1.4 h -20 |
| gruvbox | `--c-slate`, `rice/gruvbox.css:49` (added) | `#475569` (tokens.css) to `#35576c` | 6.5 | 10.7 | OKLCH L 0.44 C x1.4 h -20 |
| dark | `--c-slate`, `themes.css:38` (added) | `#475569` (tokens.css) to `#7b81a3` | 19.1 | 16.9 | OKLCH L 0.61 C x1.4 h +20 |
| vscode-tomorrow-night-blue | `--c-blue`, converter `ADDED` | `#2563eb` (tokens.css) to `#699bff` | 18.5 | 20.5 | OKLCH L 0.70 C x0.8 h +0 |
| vscode-tomorrow-night-blue | `--c-slate`, converter `ADDED` | `#475569` (tokens.css) to `#7285b7` | 20.7 | 15.5 | own block, `--c-code-comment` |
| vscode-solarized-dark | `--c-slate`, converter `ADDED` | `#475569` (tokens.css) to `#505575` | 7.1 | 10.6 | OKLCH L 0.46 C x1.4 h +20 |
| vscode-quiet-light | `--c-grey`, converter `ADDED` | `#9ca3af` (tokens.css) to `#6d705b` | 25.3 | 16.9 | own block, `--muted` |

How the set was chosen:
- One hue per failing tone and theme: each failing measure is one tone against the panel, so the fewest hues is one per (theme, tone) under 10, 15 in all. Tomorrow Night Blue's blue is a changed round-0 hue, not a new one.
- Where slate, grey and grey-d share one hex (onedark, solarized), they were searched slate, then grey, then grey-d, each over the trial holding the ones before. This order matters: a status hue's C11 check covers slate and grey but not grey-d, so a grey-d searched first could take slate's pick and fail C11 afterwards.
- The combined trial, `--trial` of all 15 on the round-0 tree (`Q6-trial.txt`), printed `trial: open-layout measures under 10 0; bar 2 breaks 0; collapsed-only pairs under 10 13 (base 19)`.

Every one of the 15 C11 lines is at 10 or more; the plain run quotes them under C11 below.

The comments that count pairs changed with this: `vocab.yml:181` and the `derive.ts` doc now give Jobs-Review in 47 themes and Jobs-Backburner in 45, where both were 48, and both say every header's surface is 10 or more from the panel.

## For the coordinator

### 1. A grep read `config/local.yml` in round 0

A round-0 command, `grep -rn -i -- "#$h" docs README.md src config tests utils --exclude=local.yml`, took `--exclude=local.yml` as a file name after `--` and searched `config/local.yml` for 12 hex strings. It printed `grep: --exclude=local.yml: No such file or directory` and no line from that file. Every grep over `config/` since puts `--exclude=local.yml` before the paths with no `--` before it.

### 2. Scope and Blocked share a red in 48 themes

Scope moved from `#0e7490` (`c-cyan-d`) to `#e2374d` (`c-crimson`). The `--lane scope` run (`J-lane-scope.txt`) prints `Blocked: 25.5 (kanagawadragon) -> 0.0 (macchiato); under 10 in 0 -> 48 themes`; in macchiato `--c-red` and `--c-crimson` are both `#ed8796`.
- The two headers never touch: Blocked is column 2 of the `parked` row and Scope is column 1 of the `incubate` row, and the pair is in neither pair list of the 128 layouts.
- The bars do not cover two lanes of one colour that sit apart.

| Option | What the trial prints (`K-scope-<tone>.txt`, round 0) |
| --- | --- |
| (a) crimson, as built | 0 open measures under 10; 0 bar 2 breaks; 13 collapsed-only pairs under 10 |
| (b) orange | `open-layout measures under 10 5; bar 2 breaks 6` |
| (c) magenta | `open-layout measures under 10 18; bar 2 breaks 0` |
| (d) rose | `open-layout measures under 10 24; bar 2 breaks 0` |
| (e) pink | `open-layout measures under 10 36; bar 2 breaks 0` |

My recommendation, as a judgment, is (a): the bars measure headers that touch, and these two never do. If two lanes of one colour on the board count as a defect, (a) is the lazy option and (b) is the next to measure.

### 3. Jobs keeps `grey-d` rather than a surface tint

A Jobs recolour to `amber-s` would have needed 7 theme hues where round 0 took 11 (`M-base-crimson-ambers.txt`). `amber-s-lane` is under 10 from `--panel` in 26 themes (`N-panel.txt`, smallest 1.7 in rosepine), so the header would hardly differ from its panel, which C13 now forbids outright. Options: (a) as built; (b) `amber-s`, which fails C13 in 26 themes. I recommend (a).

### 4. An app colour theme does not get `ADDED`

`ADDED` is applied by the converter, after `mapTheme`. An app's colour theme converted at run time goes through `themeSheet` (`src/lib/themes/vscode-map.ts:2-8`), which does not read `ADDED`. A Tomorrow Night Blue, Solarized Dark or Quiet Light loaded as an app colour theme would therefore draw the Focus headers with tokens.css's blue, slate or grey, the values that failed C2 and C13 in the shipped copies; that an app theme reaches the Focus board this way is read from the code, not verified by a run. The 49 shipped themes the cases measure are unaffected. Options:
- (a) Leave it: an app theme is the user's own file and outside the 49 themes the cases measure.
- (b) Move the table into `vscode-map.ts`, keyed by the theme's label, so `themeSheet` and the converter apply it alike. This widens the paths to `vscode-map.ts`.
My judgment is (b), since the file's head says a theme file maps the same way wherever it is read; (a) is the lazy option.

### 5. Effects a look should read

- **Idea header text in everforest.** `--c-mauve` goes from `#d699b6` to `#f1acec`; the lane surface from `#816778` to `#8f7093`, and the derived header text flips from `#f9f0f4` to `#150314` (`L2-tokens.txt`). `contrast.test.ts` passes, but it is dark text on purple.
- **Light Jobs and Review headers in three dark themes.** The nearest passing `grey-d` in nord, onedark and solarized, and the nearest passing `slate` in onedark and solarized, are light (`#dfdff4`, `#bfd0de`, `#c1ccd5`; `#b7b8cf`, `#aad0d1`). The surfaces are halfway between those and the panel. The hues also recolour their other readers in those themes: slate draws the untracked files of Source Control, archived sessions and the Inbox fallback, so these become light grey-blue there.
- **nord slate is a brown.** `#4b432c` is nord's own `--c-amber-s`, the nearest roomy candidate to `#475569`; nord's Review header becomes brown-olive, and slate's other readers above follow it.
- **kanagawalotus gold** goes from `#77713f` to `#3a4a00`; gold also draws the terminal's ANSI yellow, the editor's first bracket colour, `charts.yellow` and the `in-prep` stage.
- **O140's program needs a copy.** Its `BASE` names `O140-base`, which no longer exists. I ran a copy that differs in that line only, `o140-case-run-on-O141-base.mts` (`diff` prints `13c13`).

## Verify list and checks after the last change

The verify list, run once after the last change (`W-verify-1.txt`):

| Verify item | Result, the lines it printed |
| --- | --- |
| 1, `npx vitest run tests/checks/look/contrast.test.ts tests/data/shapes/catalog-files/vocab.test.ts tests/checks/config/config-folder.test.ts` | `Test Files  3 passed (3)`, `Tests  108 passed \| 2 skipped (110)` |
| 2, `npm run diagrams` | wrote the six `docs/diagrams/` files; `git status --short docs` prints nothing |
| 2, `npm run test:quick` | `ok prettier`, `ok ASCII gate`, `ok svelte-kit sync`, `ok eslint`, `ok svelte-check (14.1 s): ... 581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok vitest slow`, `ok vitest`, `ok vitest checks`; `test:quick: 53.6 s; every command passed` |
| 3, the perl ASCII check over `vocab.yml` and `derive.ts` | prints nothing, `perl exit 0` |
| 4, `yaml.safe_load` of `vocab.yml` | `yaml exit 0` |
| 5, the plain case run | `C1/C2 open pairs under 10 in at least one theme: 0`; `C3 1813 collapsed-only measures read; 0 break item 3's second bar; collapsed-only pairs under 10: base 19, worktree 13`; `bars: open-layout measures under 10 0; bar 2 breaks 0; collapsed-only pairs under 10 13`; `C11 theme hues changed: 25; under 10 from a status token: 0` |

`test:quick` prints what it does not cover: `tests that reach no changed file within the import depth, other than the checks under tests/checks/source and tests/checks/tree, which run for any change under src, tests or utils; the build, the lint of unchanged files`.

Checks run while working, after the last change to a source file:

| Check | Result |
| --- | --- |
| Plain run, `npx tsx case-run.mts` (`R1-plain.txt`, 728 lines) | `C1/C2 open pairs under 10 in at least one theme: 0`; `C1 collapsed-only pairs under 10 in at least one theme: 13`; `C3 1813 collapsed-only measures read; 0 break item 3's second bar; collapsed-only pairs under 10: base 19, worktree 13`; `bars: open-layout measures under 10 0; bar 2 breaks 0; collapsed-only pairs under 10 13`; `C11 theme hues changed: 25; under 10 from a status token: 0` |
| C13, `--panel` | 12 tones, `under 10 in 0` each (quoted above) |
| C12, O140's program (`R2-o140.txt`) | worktree `C2 49 themes; 0 themes hold one; 0 measures under 10; 0 pairs under 10`; `0 pairs under 10 in some theme on the base are at 10 or more in every theme after` |
| `--classes` | `vscode-tomorrow-night-blue at 47` for both trees |
| converter `--check` | `19 themes up to date` |
| `npx vitest run` of the three verify-1 files | `Tests  108 passed \| 2 skipped (110)` |
| `npx vitest run` of the other tests that read the theme sheets (`window-guard`, `app-theme-start`, `hooks-server`) | `Tests  71 passed (71)` |
| `npx prettier --check` of the converter and every touched sheet | `All matched files use Prettier code style!` |
| `sh utils/unused-exports.sh` against `O141-base/unused-exports.txt` | `diff` prints nothing; `Unused exports (226)` |
| `LC_ALL=C grep -n '[^ -~]'` over the 11 changed files | prints nothing, exit 1 |
| History-word grep over the added lines of `git diff -U0` | every hit is `2000` of "CIEDE2000"; no other word matches |

Tests added or changed: none.

C11, the plain run's lines:

```
  C11 dark --c-slate #475569 -> #7b81a3: nearest status hue 13.9 (grey), -txt 10.6 (grey)
  C11 vscode-quiet-light --c-grey #9ca3af -> #6d705b: nearest status hue 22.4 (teal), -txt 18.7 (brass)
  C11 vscode-solarized-dark --c-slate #475569 -> #505575: nearest status hue 18.9 (blue), -txt 11.0 (grey)
  C11 vscode-tomorrow-night-blue --c-blue #2563eb -> #699bff: nearest status hue 11.6 (slate), -txt 10.5 (slate)
  C11 vscode-tomorrow-night-blue --c-slate #475569 -> #7285b7: nearest status hue 11.6 (blue), -txt 10.5 (blue)
  C11 mocha --c-slate #475569 -> #335469: nearest status hue 33.7 (grey), -txt 11.4 (blue)
  C11 frappe --c-blue #8caaee -> #8cafff: nearest status hue 16.6 (grey), -txt 14.6 (grey)
  C11 gruvbox --c-slate #475569 -> #35576c: nearest status hue 19.7 (blue), -txt 11.0 (grey)
  C11 nord --c-blue #5e81ac -> #8493db: nearest status hue 14.5 (grey), -txt 12.2 (grey)
  C11 nord --c-slate #475569 -> #4b432c: nearest status hue 34.8 (red), -txt 10.8 (amber)
  C11 nord --c-grey-d #6b7280 -> #dfdff4: nearest status hue 16.9 (grey), -txt 10.9 (grey)
  C11 everforest --c-mauve #d699b6 -> #f1acec: nearest status hue 10.7 (violet), -txt 10.7 (violet)
  C11 dracula --c-grey-d #6272a4 -> #00467d: nearest status hue 18.1 (blue), -txt 17.5 (blue)
  C11 onedark --c-slate #5c6370 -> #b7b8cf: nearest status hue 20.8 (blue), -txt 10.6 (grey)
  C11 onedark --c-grey #5c6370 -> #646c7c: nearest status hue 25.1 (violet), -txt 10.6 (slate)
  C11 onedark --c-grey-d #5c6370 -> #bfd0de: nearest status hue 10.6 (slate), -txt 10.6 (slate)
  C11 kanagawadragon --c-blue #8ba4b0 -> #b2c9d0: nearest status hue 10.5 (cyan), -txt 10.5 (cyan)
  C11 solarized --c-green #859900 -> #859638: nearest status hue 18.4 (amber), -txt 19.9 (amber)
  C11 solarized --c-slate #586e75 -> #aad0d1: nearest status hue 19.8 (cyan), -txt 12.3 (grey)
  C11 solarized --c-grey #586e75 -> #60767d: nearest status hue 16.1 (violet), -txt 12.3 (slate)
  C11 solarized --c-grey-d #586e75 -> #c1ccd5: nearest status hue 10.6 (slate), -txt 10.6 (slate)
  C11 gruvboxlight --c-green #79740e -> #6b7700: nearest status hue 19.2 (cyan), -txt 18.7 (cyan)
  C11 rosepinedawn --c-blue #286983 -> #13568a: nearest status hue 10.5 (cyan), -txt 10.5 (cyan)
  C11 kanagawalotus --c-gold #77713f -> #3a4a00: nearest status hue 21.7 (brass), -txt 11.7 (green)
  C11 kanagawalotus --c-green #6f894e -> #80b16f: nearest status hue 18.3 (teal), -txt 10.7 (teal)
C11 theme hues changed: 25; under 10 from a status token: 0
```

nord's `--c-blue` `-txt` reads 12.2 (grey) here where round 0 read 10.5 (slate), since nord's slate moved.

## The cases after the change

- **C1.** `C1/C2 open pairs under 10 in at least one theme: 0`; `C1 collapsed-only pairs under 10 in at least one theme: 13`.
- **C2.** Every open-layout pair is at 10 or more in every theme (`R1-plain.txt:79-115`).
- **C3.** `C3 1813 collapsed-only measures read; 0 break item 3's second bar; collapsed-only pairs under 10: base 19, worktree 13`, with 312 `moved` lines (item 3).
- **C4.** `vocab.yml:181` and the `derive.ts` doc name the run's 13 collapsed-only pairs with their themes (`R1-plain.txt:116-154`): Teaching-Build in 49; Jobs-Review in 47; Jobs-Backburner in 45; Funding-Revise in 41; Funding-De-risk in 32; Teaching-Run in rosepinedawn, kanagawadragon, everforest and kanagawalotus; Jobs-Idea, Review-Idea and Backburner-Idea in rosepinedawn, kanagawadragon and rosepinemoon; Teaching-Push in everforest and synthwave; Jobs-De-risk and Push-Idea in kanagawalotus; Blocked-Idea in mocha. `vocab.yml:213` names the band-header pairs among them, which are unchanged.
- **C5.** `diff` of each file against the base copy:

  | File | Lines, base to now | `diff` hunks |
  | --- | --- | --- |
  | `config/catalogs/vocab.yml` | 311 to 311 | `181c181 189c189 213c213` |
  | `src/lib/themes/derive.ts` | 320 to 327 | `84,88c84,95` |
  | `src/lib/themes/themes.css` | 109 to 116 | `13,16c13,22 31a38` |
  | `src/lib/themes/rice/singles.css` | 360 to 371 | `10,12c10,21 42c51 48a58,59 108c119 150c161 166,168c177,179 225,227c236,238` |
  | `src/lib/themes/rice/kanagawa.css` | 181 to 187 | `3,5c3,11 97c103 144c150 148c154` |
  | `src/lib/themes/rice/catppuccin.css` | 232 to 240 | `2,4c2,11 41a49 148c156` |
  | `src/lib/themes/rice/gruvbox.css` | 114 to 122 | `2,5c2,12 41a49 81c89` |
  | `src/lib/themes/rice/rosepine.css` | 184 to 190 | `2c2,8 157c163` |
  | `src/lib/themes/rice/everforest.css` | 122 to 128 | `3c3,9 45c51` |
  | `src/lib/themes/vscode.css` | 921 to 944 | `8,10c8,10 196c196,202 227a234 732c739,745 771a785 784c798,805 821a843,844` |
  | `utils/migrations/convert-vscode-themes.ts` | 457 to 500 | `33c33,35 71a74,104 211c244 224a258,259 229c264,270 235c276 258c299 264a306,307` |

  Each sheet's hunks are its head comment and its hue lines. `vscode-rules.json` equals the base. `git status --short` lists these 11 files and three ledger files of this step (`briefs/O141-cases.md`, `briefs/O141-round-1.md`, this report).
- **C6.** `contrast.test.ts` passes (verify 1).
- **C7 to C10.** The run prints the same chosen layouts and `64 of 128` lines as before; every header's `-lane` token is in all 49 themes.
- **C11, C12, C13.** Quoted above.

## The cases' first run, on the unchanged tree

From round 0 (`A-plain.txt`): 7 open-layout pairs under 10 and 19 collapsed-only pairs under 10, over 128 layouts, 20 open-layout pairs and 37 collapsed-only pairs.

| Pair | Themes under 10 on the base |
| --- | --- |
| Funding-Jobs | kanagawalotus 4.9 |
| Funding-Run | kanagawalotus 5.7, solarized 8.9, gruvboxlight 9.3 |
| Jobs-Push | dracula 0.0, nord 6.5, kanagawadragon 7.2, vscode-tomorrow-night-blue 8.3, frappe 8.9 |
| Run-Push | rosepinedawn 6.9 |
| Run-Review | kanagawalotus 7.9 |
| Review-Scope | vscode-solarized-dark 6.8, kanagawadragon 7.2, kanagawalotus 7.7, vscode-tomorrow-night-blue 8.3, vscode-abyss 9.9 |
| Scope-Idea | kanagawadragon 6.2 |

## The layout model

- Section order: `config/defaults/behavior.yml:50`, `sections: [command_center, tasks, quick_add, awaiting, band, lanes]`, drawn in that order by `Focus.svelte:314-396`, so the band is directly above the lanes.
- Band: three columns in the order Funding, Jobs, Teaching (`Band.svelte:164-189`). A column is drawn when `stages.length + gone > 0` (`:141`); the grid is `repeat(auto-fit, minmax(min(290px, 100%), 1fr))` with `gap: 8px` (`:197-201`).
- Clusters: `Lanes.svelte:267-306` draws `focus_clusters` in order; a `columns` cluster's lanes go in `focus_lanes` order in the same auto-fit grid, and the `full_width` lane has a one-column grid (`:311-319`). A folded group's body is `hidden="until-found"` (`GroupHead.svelte:173`).
- Header surfaces: `LaneHead.svelte:40` paints `--lane: var(--c-${tone}-lane)`, which is where C13 measures; the 3 px top border is `var(--c-${one.tone})` (`Lanes.svelte:211,327`, `Band.svelte:142,209`).
- Touching: neighbours in a row touch; headers of consecutive drawn rows touch when `i*m < (j+1)*n && j*n < (i+1)*m`. A folded Idea lane brings no pair of its own.

## The case-run program and every run

The source is `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o141-builder/case-run.mts`; every output named in this report sits in the same folder. It reads the base copy and the worktree, imports `parse.ts` and `derive.ts` from the worktree, and prints only. This round it gained the panel measure in `--hue` and the no-list form of `--panel` (C13). Each run is from the worktree root with `PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH npx tsx <source> [mode]`, exit 0.

| File | Mode | What it shows |
| --- | --- | --- |
| `R1-plain.txt`, `W5-plain.txt` | none | C1, C3, C7 to C11, the bars |
| `P0-panel-all.txt`, `P1-panel-after.txt` | `--panel` | C13 first and after |
| `Q1-hue.txt` to `Q5-hue.txt` | `--hue <theme> <token> [json]` | the item-6 searches |
| `Q6-trial.txt` | `--trial` | the 15 item-6 hues together |
| `R2-o140.txt` | O140's program, the one-line copy | C12 |
| (stdout) | `--classes` | item 5 |
| `vscode-run-diff.txt` | `git diff -- src/lib/themes/vscode.css` | item 5 |

Round 0's runs (`A` to `N`, `H2-after-final.txt`, `I-o140.txt`) stay in the folder.

## Judgment calls the brief left open

1. The per-theme rule for which hue to change and to what: the hue whose nearest passing value is closest to its old value in CIEDE2000, a passing value having every measure at 10.5 or more so that hex rounding cannot pull it under. In dracula `--c-blue` and `--c-grey-d` tie at 18.1, and I changed `--c-grey-d`, the one that is not a status token.
2. For a hue a palette does not set (nord, mocha, gruvbox, dark and the three VS Code themes), the colour searched near is tokens.css's, which is what the theme drew before.
3. Surface tints (`amber-s`, `red-s`) are not taken as lane tones (point 3).
4. Scope takes crimson (point 2).
5. `ADDED` holds one `why` per theme, naming all of that theme's tokens in one sentence, built from the shared `BRINGS` and `AMONG` so the three entries say the measure in the same words.
6. `--panel` with no list takes the tones from the headers the program loads, so C13 cannot miss a header tone a list would leave out.

## Files

The 11 files of the C5 table, and this report. Every comment line in the CSS files and `derive.ts` is at most 100 columns; the `vocab.yml` comments are one line each.

## The case-run program source, as run at landing (added at landing)

The source of `o141-builder/case-run.mts`, quoted whole, since the scratch folder does not outlast the session:

```ts
// O141 case-run program. Reads the theme sheets, config/defaults/appearance.yml and
// config/catalogs/vocab.yml of the base copy and of the worktree, resolves the 49 themes through
// parseBlocks, resolveTheme and deriveTokens, builds every Focus layout of the three-column model
// (band columns drawn or not, each columns cluster and each full-width lane folded or not), and
// measures every pair of headers that touches in a layout on their -lane surfaces with culori's
// differenceCiede2000. Prints only; writes nothing.
// Run from the worktree root: npx tsx <this file> [mode], the modes being --search (with
// --cross-only or --open-only), --candidates <key>, --tokens <theme>:<token>,..., --classes,
// --panel <tone>,..., --lane <key>, --trial <json> (with --on-base), --hue <theme> <token> [json].

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const WT = process.cwd();
const BASE = '/Users/axelfaes/workspace/oculus/.agents/worktrees/O141-base';

const { parseBlocks, resolveTheme } = await import(join(WT, 'src/lib/themes/parse.ts'));
const { deriveTokens } = await import(join(WT, 'src/lib/themes/derive.ts'));
const culori = await import(join(WT, 'node_modules/culori/src/index.js'));
const YAML = await import(join(WT, 'node_modules/yaml/dist/index.js'));

const de = culori.differenceCiede2000();
const LINE = 10;
const UNKNOWN_TONE = 'grey';
const TONE = /^[a-z][a-z0-9-]*$/;
const BAND = ['funding', 'jobs', 'teaching'] as const;
const BAND_LABEL: Record<string, string> = { funding: 'Funding', jobs: 'Jobs', teaching: 'Teaching' };

type Header = { id: string; label: string; written: string; token: string; tone: string };
type Row = { kind: string; headers: string[] };
type Tree = {
    names: string[];
    tokens: Record<string, Record<string, string>>;
    authored: Record<string, Record<string, string>>;
    /** The tokens a theme's own blocks set, without `:root` and the shared `rice` block. */
    own: Record<string, Record<string, string>>;
    vocab: any;
    headers: Record<string, Header>;
    order: string[];
    clusterRows: { key: string; lanes: string[] }[];
    wideLanes: string[];
};

function load(root: string): Tree {
    const dir = join(root, 'src/lib/themes');
    const sheets = [
        readFileSync(join(dir, 'tokens.css'), 'utf8'),
        readFileSync(join(dir, 'themes.css'), 'utf8'),
        ...readdirSync(join(dir, 'rice'))
            .filter((n) => n.endsWith('.css'))
            .sort()
            .map((n) => readFileSync(join(dir, 'rice', n), 'utf8')),
        readFileSync(join(dir, 'vscode.css'), 'utf8')
    ].join('\n');
    const blocks = parseBlocks(sheets);
    const rows = YAML.parse(readFileSync(join(root, 'config/defaults/appearance.yml'), 'utf8')).themes;
    const vocab = YAML.parse(readFileSync(join(root, 'config/catalogs/vocab.yml'), 'utf8'));
    const palette: Record<string, string> = vocab.palette;
    const tree: Tree = { names: [], tokens: {}, authored: {}, own: {}, vocab, headers: {}, order: [], clusterRows: [], wideLanes: [] };
    for (const row of rows) {
        const classes: string = row.class ?? '';
        for (const word of classes.split(/\s+/).filter((w) => w !== '')) {
            if (!(word in blocks)) throw new Error(`${row.name}: class ${word} has no block`);
        }
        const theme = resolveTheme(blocks, classes);
        tree.names.push(row.name);
        tree.authored[row.name] = theme;
        tree.own[row.name] = Object.assign(
            {},
            ...classes
                .split(/\s+/)
                .filter((w) => w !== '' && w !== 'rice')
                .map((w) => blocks[w])
        );
        tree.tokens[row.name] = { ...theme, ...deriveTokens(theme) };
    }
    // tones.ts toneOf: palette maps the hex (trimmed, lower case) to a token; a c- token's hue is
    // the tone, anything else the unknown tone.
    for (const lane of vocab.focus_lanes) {
        const token = palette[String(lane.color).trim().toLowerCase()] ?? '(not in palette)';
        const tone = token.startsWith('c-') && TONE.test(token.slice(2)) ? token.slice(2) : UNKNOWN_TONE;
        tree.headers[lane.key] = { id: lane.key, label: lane.label, written: lane.color, token, tone };
    }
    // tones.ts namedTone: a tone name whose c-<name> the palette holds, the unknown tone otherwise.
    for (const key of BAND) {
        const name = String(vocab.focus_lane_tones[key] ?? '').trim();
        const held = TONE.test(name) && Object.values(palette).includes(`c-${name}`);
        tree.headers[key] = {
            id: key,
            label: BAND_LABEL[key],
            written: name,
            token: held ? `c-${name}` : '(not held by the palette)',
            tone: held ? name : UNKNOWN_TONE
        };
    }
    for (const cluster of vocab.focus_clusters) {
        const lanes = vocab.focus_lanes.filter((l: any) => l.cluster === cluster.key).map((l: any) => l.key);
        if (cluster.layout === 'columns') tree.clusterRows.push({ key: cluster.key, lanes });
        else tree.wideLanes.push(...lanes);
    }
    tree.order = [...BAND, ...vocab.focus_lanes.map((l: any) => l.key)];
    return tree;
}

/** The rows a layout draws, top to bottom: the band, then the clusters, then the full-width lanes. */
function layoutRows(tree: Tree, band: string[], foldedClusters: Set<string>, foldedWide: Set<string>): Row[] {
    const rows: Row[] = [];
    if (band.length > 0) rows.push({ kind: 'band', headers: band });
    for (const c of tree.clusterRows) if (!foldedClusters.has(c.key)) rows.push({ kind: c.key, headers: c.lanes });
    for (const w of tree.wideLanes) if (!foldedWide.has(w)) rows.push({ kind: `wide:${w}`, headers: [w] });
    return rows;
}

const pairKey = (a: string, b: string, order: string[]): string =>
    order.indexOf(a) < order.indexOf(b) ? `${a}|${b}` : `${b}|${a}`;

/**
 * The touching pairs of a layout. In a row of n headers, header i spans [i/n, (i+1)/n] of the width;
 * neighbours in a row touch, and headers of consecutive drawn rows touch when their spans overlap
 * by more than a shared edge (the grids keep an 8 px gap). Compared in integers: [i/n,(i+1)/n] and
 * [j/m,(j+1)/m] overlap when i*m < (j+1)*n and j*n < (i+1)*m.
 */
function touching(rows: Row[], order: string[]): Set<string> {
    const out = new Set<string>();
    for (const row of rows) {
        for (let i = 0; i + 1 < row.headers.length; i += 1) out.add(pairKey(row.headers[i], row.headers[i + 1], order));
    }
    for (let r = 0; r + 1 < rows.length; r += 1) {
        const up = rows[r].headers;
        const down = rows[r + 1].headers;
        const n = up.length;
        const m = down.length;
        for (let i = 0; i < n; i += 1) {
            for (let j = 0; j < m; j += 1) {
                if (i * m < (j + 1) * n && j * n < (i + 1) * m) out.add(pairKey(up[i], down[j], order));
            }
        }
    }
    return out;
}

function subsets<T>(items: readonly T[]): T[][] {
    const out: T[][] = [];
    for (let mask = 0; mask < 1 << items.length; mask += 1) out.push(items.filter((_, i) => mask & (1 << i)));
    return out;
}

type Layout = { band: string[]; folded: string[]; rows: Row[]; pairs: Set<string> };

function layouts(tree: Tree): Layout[] {
    const out: Layout[] = [];
    const foldables = [...tree.clusterRows.map((c) => c.key), ...tree.wideLanes.map((w) => `wide:${w}`)];
    for (const band of subsets(BAND)) {
        for (const folded of subsets(foldables)) {
            const clusters = new Set(folded.filter((f) => !f.startsWith('wide:')));
            const wide = new Set(folded.filter((f) => f.startsWith('wide:')).map((f) => f.slice(5)));
            const rows = layoutRows(tree, band, clusters, wide);
            out.push({ band, folded, rows, pairs: touching(rows, tree.order) });
        }
    }
    return out;
}

const f = (n: number): string => (Number.isNaN(n) ? 'MISSING' : n.toFixed(1));

function distance(tree: Tree, theme: string, a: string, b: string): number {
    const t = tree.tokens[theme];
    const x = t[`--c-${tree.headers[a].tone}-lane`];
    const y = t[`--c-${tree.headers[b].tone}-lane`];
    return x && y ? de(x, y) : NaN;
}

const name = (tree: Tree, pair: string): string =>
    pair
        .split('|')
        .map((h) => tree.headers[h].label)
        .join('-');

function classify(tree: Tree): { open: string[]; collapsed: string[]; all: Layout[] } {
    const all = layouts(tree);
    const openLayout = all.find((l) => l.band.length === 3 && l.folded.length === 0)!;
    const open = [...openLayout.pairs];
    const union = new Set<string>();
    for (const l of all) for (const p of l.pairs) union.add(p);
    const collapsed = [...union].filter((p) => !openLayout.pairs.has(p));
    const byOrder = (p: string, q: string): number => {
        const [a1, b1] = p.split('|').map((h) => tree.order.indexOf(h));
        const [a2, b2] = q.split('|').map((h) => tree.order.indexOf(h));
        return a1 - a2 || b1 - b2;
    };
    return { open: open.sort(byOrder), collapsed: collapsed.sort(byOrder), all };
}

function under(tree: Tree, pair: string): { theme: string; dist: number }[] {
    const [a, b] = pair.split('|');
    return tree.names
        .map((theme) => ({ theme, dist: distance(tree, theme, a, b) }))
        .filter((x) => !(x.dist >= LINE))
        .sort((p, q) => p.dist - q.dist);
}

function smallest(tree: Tree, pair: string): { theme: string; dist: number } {
    const [a, b] = pair.split('|');
    let best = { theme: '', dist: Infinity };
    for (const theme of tree.names) {
        const dist = distance(tree, theme, a, b);
        if (Number.isNaN(dist)) return { theme, dist };
        if (dist < best.dist) best = { theme, dist };
    }
    return best;
}

function report(label: string, tree: Tree): void {
    console.log(`=== ${label}: ${tree.names.length} themes`);
    console.log('C10 the tone each header resolves to (written value -> palette token -> tone; the -lane token present in how many themes):');
    for (const id of tree.order) {
        const h = tree.headers[id];
        const present = tree.names.filter((n) => tree.tokens[n][`--c-${h.tone}-lane`] !== undefined).length;
        console.log(`  ${h.label}: ${h.written} -> ${h.token} -> ${h.tone}; --c-${h.tone}-lane in ${present} of ${tree.names.length}`);
    }
    const { open, collapsed, all } = classify(tree);
    console.log(`layouts built: ${all.length}; open-layout pairs: ${open.length}; collapsed-only pairs: ${collapsed.length}`);
    for (const [kind, list] of [['open', open], ['collapsed-only', collapsed]] as const) {
        console.log(`--- ${kind} pairs, smallest distance over the 49 themes, and every theme under 10:`);
        let count = 0;
        for (const pair of list) {
            const low = smallest(tree, pair);
            const hits = under(tree, pair);
            if (hits.length > 0) count += 1;
            console.log(
                `  ${name(tree, pair)}: min ${f(low.dist)} (${low.theme})${hits.length > 0 ? `; under 10 in ${hits.length}: ${hits.map((x) => `${x.theme} ${f(x.dist)}`).join(', ')}` : ''}`
            );
        }
        console.log(`${kind === 'open' ? 'C1/C2' : 'C1'} ${kind} pairs under 10 in at least one theme: ${count}`);
    }
}

function show(tree: Tree, label: string, l: Layout): void {
    const rows = l.rows.map((r) => `[${r.headers.map((h) => tree.headers[h].label).join(' ')}]`).join(' / ');
    console.log(`  ${label}: rows ${rows}`);
    console.log(`    touching: ${[...l.pairs].map((p) => name(tree, p)).join(', ')}`);
}

const base = load(BASE);
const wt = load(WT);

report('base', base);
report('worktree', wt);

console.log('=== C7, C8, C9: chosen layouts of the worktree model');
const all = layouts(wt);
const pick = (band: string[], folded: string[]): Layout =>
    all.find((l) => l.band.join() === band.join() && l.folded.slice().sort().join() === folded.slice().sort().join())!;
show(wt, 'C7 band Funding Jobs, every cluster open', pick(['funding', 'jobs'], []));
show(wt, 'C7 band Jobs Teaching, every cluster open', pick(['jobs', 'teaching'], []));
show(wt, 'C7 band Funding Teaching, every cluster open', pick(['funding', 'teaching'], []));
show(wt, 'C7 band Funding alone, every cluster open', pick(['funding'], []));
show(wt, 'C8 band of three, every cluster folded', pick(['funding', 'jobs', 'teaching'], ['now', 'parked', 'incubate']));
show(wt, 'C8 band Jobs alone, every cluster folded', pick(['jobs'], ['now', 'parked', 'incubate']));
for (const col of BAND) {
    const holding = all.filter((l) => l.band.includes(col)).length;
    console.log(`C9 layouts in which ${BAND_LABEL[col]} is drawn: ${holding} of ${all.length}`);
}
const ideaFold = all.filter((l) => l.folded.some((x) => x.startsWith('wide:')));
const withoutIdeaFold = new Set<string>();
for (const l of all) if (!l.folded.some((x) => x.startsWith('wide:'))) for (const p of l.pairs) withoutIdeaFold.add(p);
const onlyByIdeaFold = new Set<string>();
for (const l of ideaFold) for (const p of l.pairs) if (!withoutIdeaFold.has(p)) onlyByIdeaFold.add(p);
console.log(`pairs that only a folded Idea lane brings together: ${onlyByIdeaFold.size}`);

console.log('=== C3: every pair other than the open-layout ones, base -> worktree, in each theme');
{
    const { open, collapsed } = classify(wt);
    let read = 0;
    let broken = 0;
    for (const pair of collapsed) {
        const [a, b] = pair.split('|');
        for (const theme of wt.names) {
            const before = distance(base, theme, a, b);
            const after = distance(wt, theme, a, b);
            read += 1;
            const bad = before >= LINE ? !(after >= LINE) : !(after >= before);
            if (bad) {
                broken += 1;
                console.log(`  FAILS ${name(wt, pair)} ${theme}: ${f(before)} -> ${f(after)}`);
            }
            if (f(before) !== f(after)) console.log(`  moved ${name(wt, pair)} ${theme}: ${f(before)} -> ${f(after)}`);
        }
    }
    const count = (tree: Tree): number => collapsed.filter((p) => under(tree, p).length > 0).length;
    console.log(`C3 ${read} collapsed-only measures read; ${broken} break item 3's second bar; collapsed-only pairs under 10: base ${count(base)}, worktree ${count(wt)}`);
    let openMoved = 0;
    for (const pair of open) {
        const [a, b] = pair.split('|');
        for (const theme of wt.names) {
            const before = distance(base, theme, a, b);
            const after = distance(wt, theme, a, b);
            if (f(before) !== f(after)) {
                openMoved += 1;
                console.log(`  open moved ${name(wt, pair)} ${theme}: ${f(before)} -> ${f(after)}`);
            }
        }
    }
    console.log(`open-layout measures that moved: ${openMoved}`);
}

console.log('=== bars 1 and 2 of the worktree against the base, every theme');
{
    const r = bars(wt, 'worktree');
    console.log(`bars: open-layout measures under 10 ${r.open}; bar 2 breaks ${r.bar2}; collapsed-only pairs under 10 ${r.count}`);
}

console.log('=== C11: every theme hue whose resolved value differs from the base, with its nearest status token');
{
    let changed = 0;
    let failing = 0;
    for (const theme of wt.names) {
        for (const [token, value] of Object.entries(wt.authored[theme])) {
            if (!/^--c-[a-z][a-z0-9-]*$/.test(token) || base.authored[theme][token] === value) continue;
            changed += 1;
            const s = statusCheck(wt, theme, token.slice('--c-'.length));
            if (s.under.length > 0) failing += 1;
            console.log(`  C11 ${theme} ${token} ${base.authored[theme][token]} -> ${value}: nearest status hue ${s.hue}, -txt ${s.txt}${s.under.length ? `; UNDER 10: ${s.under.join(', ')}` : ''}`);
        }
    }
    console.log(`C11 theme hues changed: ${changed}; under 10 from a status token: ${failing}`);
}

// The joint search of item 3, on the base: every set of headers that holds one header of each
// open-layout pair under 10 (each such pair needs one of its two headers recoloured, since the
// tones are fixed per theme), of any size, and for each set every assignment of a new tone
// from the palette's c- tones present in all 49 themes, kept when the three bars hold. Bar 3
// follows from bar 2 (no pair crosses the 10 line downward), and is checked anyway.
if (process.argv.includes('--search')) {
    const palette: Record<string, string> = base.vocab.palette;
    const tones = [...new Set(Object.values(palette).filter((v) => v.startsWith('c-')).map((v) => v.slice(2)))]
        .filter((tone) => base.names.every((n) => base.tokens[n][`--c-${tone}-lane`] !== undefined))
        .sort();
    console.log(`=== search: ${tones.length} tones present in every theme: ${tones.join(' ')}`);
    const cache = new Map<string, number>();
    const dt = (theme: string, x: string, y: string): number => {
        const key = `${theme}|${x}|${y}`;
        let v = cache.get(key);
        if (v === undefined) {
            const t = base.tokens[theme];
            v = de(t[`--c-${x}-lane`], t[`--c-${y}-lane`]);
            cache.set(key, v);
        }
        return v;
    };
    const { open, collapsed } = classify(base);
    const failing = open.filter((p) => under(base, p).length > 0).map((p) => p.split('|'));
    const pool = [...new Set(failing.flat())].sort((a, b) => base.order.indexOf(a) - base.order.indexOf(b));
    const covers = subsets(pool).filter((s) => failing.every(([a, b]) => s.includes(a) || s.includes(b)));
    const minSize = Math.min(...covers.map((s) => s.length));
    console.log(`headers of the failing pairs: ${pool.map((h) => base.headers[h].label).join(' ')}; covers of any size: ${covers.length}; smallest ${minSize}`);
    const baseDist = new Map<string, number>();
    for (const p of [...open, ...collapsed]) {
        const [a, b] = p.split('|');
        for (const theme of base.names) baseDist.set(`${p}|${theme}`, distance(base, theme, a, b));
    }
    const openSet = new Set(open);
    // --cross-only is not item 3's second bar: it measures, for the hand-back, what a bar that only
    // keeps a pair at 10 or more from falling under 10 (and the count from growing) would allow.
    const CROSS_ONLY = process.argv.includes('--cross-only');
    // --open-only drops bars 2 and 3 altogether, for the same purpose: whether recolouring the
    // headers of the failing pairs can put every open-layout pair at 10 or more at all.
    const OPEN_ONLY = process.argv.includes('--open-only');
    const baseCollapsedCount = collapsed.filter((p) => under(base, p).length > 0).length;
    console.log(`joint search bar 2: ${OPEN_ONLY ? 'NONE, bar 1 alone (not the brief bars; information for the hand-back)' : CROSS_ONLY ?'CROSS-ONLY (not the brief bar; information for the hand-back)' : "item 3's second bar as the brief gives it"}`);
    type Found = { cover: string[]; tones: Record<string, string>; worstOpen: number; worstPair: string };
    const found: Found[] = [];
    // Without bar 2 nothing prunes the search, so the open-only run reads the smallest covers.
    for (const cover of OPEN_ONLY ? covers.filter((s) => s.length === minSize) : covers) {
        const assign: Record<string, string> = {};
        const toneOfHeader = (h: string): string | undefined => (cover.includes(h) ? assign[h] : base.headers[h].tone);
        const okPair = (p: string): boolean => {
            const [a, b] = p.split('|');
            const x = toneOfHeader(a);
            const y = toneOfHeader(b);
            if (x === undefined || y === undefined) return true;
            for (const theme of base.names) {
                const after = dt(theme, x, y);
                if (openSet.has(p)) {
                    if (!(after >= LINE)) return false;
                } else if (!OPEN_ONLY) {
                    const before = baseDist.get(`${p}|${theme}`)!;
                    if (before >= LINE ? !(after >= LINE) : CROSS_ONLY ? false : !(after >= before)) return false;
                }
            }
            return true;
        };
        const touched = (h: string): string[] => [...open, ...collapsed].filter((p) => p.split('|').includes(h));
        const step = (i: number): void => {
            if (i === cover.length) {
                if (CROSS_ONLY) {
                    const left = collapsed.filter((p) => {
                        const [a, b] = p.split('|');
                        return base.names.some((theme) => !(dt(theme, toneOfHeader(a)!, toneOfHeader(b)!) >= LINE));
                    }).length;
                    if (left > baseCollapsedCount) return;
                }
                let worstOpen = Infinity;
                let worstPair = '';
                for (const p of open) {
                    const [a, b] = p.split('|');
                    for (const theme of base.names) {
                        const v = dt(theme, toneOfHeader(a)!, toneOfHeader(b)!);
                        if (v < worstOpen) {
                            worstOpen = v;
                            worstPair = `${name(base, p)} ${theme}`;
                        }
                    }
                }
                found.push({ cover, tones: { ...assign }, worstOpen, worstPair });
                return;
            }
            const h = cover[i];
            for (const tone of tones) {
                if (tone === base.headers[h].tone) continue;
                assign[h] = tone;
                if (touched(h).every(okPair)) step(i + 1);
                delete assign[h];
            }
        };
        step(0);
    }
    // What stops each header alone: every tone it could take with every other header unchanged,
    // the open-layout pairs of that header left under 10 and the pairs of that header whose
    // distance would break bar 2, each with the number of themes it breaks in.
    console.log('--- each failing header alone, every other header unchanged');
    for (const h of pool) {
        console.log(`  ${base.headers[h].label} (now ${base.headers[h].tone}):`);
        let clean = 0;
        for (const tone of tones) {
            if (tone === base.headers[h].tone) continue;
            const openLeft: string[] = [];
            const breaks: string[] = [];
            for (const p of [...open, ...collapsed]) {
                const [a, b] = p.split('|');
                if (a !== h && b !== h) continue;
                const other = a === h ? b : a;
                let n = 0;
                for (const theme of base.names) {
                    const after = dt(theme, tone, base.headers[other].tone);
                    const before = baseDist.get(`${p}|${theme}`)!;
                    if (openSet.has(p) ? !(after >= LINE) : before >= LINE ? !(after >= LINE) : !(after >= before)) n += 1;
                }
                if (n > 0) (openSet.has(p) ? openLeft : breaks).push(`${name(base, p)} ${n}`);
            }
            if (openLeft.length === 0 && breaks.length === 0) clean += 1;
            console.log(`    ${tone}: open under 10 [${openLeft.join(', ')}]; bar 2 breaks [${breaks.join(', ')}]`);
        }
        console.log(`    tones that clear every pair of ${base.headers[h].label} alone: ${clean}`);
    }
    // Each failing pair on its own: every set of headers of the failing pairs that holds one of the
    // pair's two headers, and every assignment of new tones to it, kept when the pair is at 10 or
    // more in every theme, every open-layout pair at 10 or more on the base stays there, every
    // other failing open-layout pair keeps at least its base distance, and every collapsed-only
    // pair meets bar 2.
    console.log('--- each failing open-layout pair on its own');
    for (const [pa, pb] of failing) {
        const target = pairKey(pa, pb, base.order);
        let count = 0;
        let best: { worst: number; text: string } = { worst: -Infinity, text: '' };
        for (const cover of subsets(pool).filter((s) => s.includes(pa) || s.includes(pb))) {
            const assign: Record<string, string> = {};
            const toneOfHeader = (h: string): string | undefined => (cover.includes(h) ? assign[h] : base.headers[h].tone);
            const okPair = (p: string): boolean => {
                const [a, b] = p.split('|');
                const x = toneOfHeader(a);
                const y = toneOfHeader(b);
                if (x === undefined || y === undefined) return true;
                for (const theme of base.names) {
                    const after = dt(theme, x, y);
                    const before = baseDist.get(`${p}|${theme}`)!;
                    if (p === target) {
                        if (!(after >= LINE)) return false;
                    } else if (before >= LINE ? !(after >= LINE) : !(after >= before)) return false;
                }
                return true;
            };
            const touched = (h: string): string[] => [...open, ...collapsed].filter((p) => p.split('|').includes(h));
            const step = (i: number): void => {
                if (i === cover.length) {
                    count += 1;
                    let worst = Infinity;
                    for (const theme of base.names) worst = Math.min(worst, dt(theme, toneOfHeader(pa)!, toneOfHeader(pb)!));
                    if (worst > best.worst) {
                        best = { worst, text: cover.map((h) => `${base.headers[h].label} ${base.headers[h].tone}->${assign[h]}`).join(', ') };
                    }
                    return;
                }
                const h = cover[i];
                for (const tone of tones) {
                    if (tone === base.headers[h].tone) continue;
                    assign[h] = tone;
                    if (touched(h).every(okPair)) step(i + 1);
                    delete assign[h];
                }
            };
            step(0);
        }
        console.log(`  ${name(base, target)}: ${count} assignments${count > 0 ? `; best ${best.text}, smallest distance ${f(best.worst)}` : ''}`);
    }
    const bySize = (n: number): Found[] => found.filter((x) => x.cover.length === n).sort((a, b) => b.worstOpen - a.worstOpen);
    for (let n = 1; n <= pool.length; n += 1) {
        const list = bySize(n);
        console.log(`--- ${list.length} assignments of ${n} headers meet the three bars`);
        for (const x of list.slice(0, 25)) {
            console.log(`  ${x.cover.map((h) => `${base.headers[h].label} ${base.headers[h].tone}->${x.tones[h]}`).join(', ')}; smallest open distance ${f(x.worstOpen)} (${x.worstPair})`);
        }
    }
}

// The candidate search of item 3: every tone a header could take under item 3's value forms, with
// whether the three bars of item 3 hold against the base when that header alone takes it.
const at = process.argv.indexOf('--candidates');
if (at > 0) {
    const id = process.argv[at + 1];
    const palette: Record<string, string> = base.vocab.palette;
    const tones = [...new Set(Object.values(palette).filter((v) => v.startsWith('c-')).map((v) => v.slice(2)))].sort();
    const { open, collapsed } = classify(base);
    const baseCount = collapsed.filter((p) => under(base, p).length > 0).length;
    console.log(`=== candidates for ${base.headers[id].label} (now ${base.headers[id].tone})`);
    for (const tone of tones) {
        const trial: Tree = { ...base, headers: { ...base.headers, [id]: { ...base.headers[id], tone } } };
        const present = trial.names.every((n) => trial.tokens[n][`--c-${tone}-lane`] !== undefined);
        const openUnder = open.filter((p) => under(trial, p).length > 0);
        let bar2 = 0;
        for (const pair of collapsed) {
            const [a, b] = pair.split('|');
            for (const theme of trial.names) {
                const before = distance(base, theme, a, b);
                const after = distance(trial, theme, a, b);
                if (before >= LINE ? !(after >= LINE) : !(after >= before)) bar2 += 1;
            }
        }
        const count = collapsed.filter((p) => under(trial, p).length > 0).length;
        const ok = present && openUnder.length === 0 && bar2 === 0 && count <= baseCount;
        console.log(`  ${tone}: in every theme ${present}; open under 10 ${openUnder.map((p) => name(trial, p)).join(' ') || 'none'}; bar 2 breaks ${bar2}; collapsed-only under 10 ${count} (base ${baseCount})${ok ? ' MEETS ALL' : ''}`);
    }
}

// The status tokens, as O140's program reads them: the tones `statuses:` colours map to.
function statusTones(tree: Tree): string[] {
    const palette: Record<string, string> = tree.vocab.palette;
    const out = new Set<string>();
    for (const s of Object.values(tree.vocab.statuses) as any[]) {
        const token = palette[String(s.color).toLowerCase()] ?? '';
        if (token.startsWith('c-')) out.add(token.slice(2));
    }
    return [...out].sort();
}

/** A copy of a tree with lane tones and authored theme tokens laid over it, re-derived. */
function overlay(tree: Tree, lanes: Record<string, string>, tokens: Record<string, Record<string, string>>): Tree {
    const headers = { ...tree.headers };
    for (const [id, tone] of Object.entries(lanes)) headers[id] = { ...headers[id], tone };
    const next: Tree = { ...tree, headers, tokens: { ...tree.tokens }, authored: { ...tree.authored } };
    for (const [theme, set] of Object.entries(tokens)) {
        const authored = { ...tree.authored[theme], ...set };
        next.authored[theme] = authored;
        next.tokens[theme] = { ...authored, ...deriveTokens(authored) };
    }
    return next;
}

/**
 * C11's measure for one hue of one theme: its nearest status token (itself left out) on the hue and
 * on -txt, and every status token it is under 10 from, as O140's program measures.
 */
function statusCheck(tree: Tree, theme: string, hue: string): { hue: string; txt: string; under: string[] } {
    const t = tree.tokens[theme];
    const near = (m: string): { text: string; under: string[] } => {
        let best = Infinity;
        let who = '';
        const under: string[] = [];
        for (const s of statusTones(tree)) {
            if (s === hue) continue;
            const v = de(t[`--c-${hue}${m}`], t[`--c-${s}${m}`]);
            if (v < best) {
                best = v;
                who = s;
            }
            if (!(v >= LINE)) under.push(`${s}${m} ${f(v)}`);
        }
        return { text: `${f(best)} (${who})`, under };
    };
    const a = near('');
    const b = near('-txt');
    return { hue: a.text, txt: b.text, under: [...a.under, ...b.under] };
}

/** Bars 1 and 2 of a tree against the base, every theme; prints each failure. */
function bars(tree: Tree, label: string): { open: number; bar2: number; count: number } {
    const { open, collapsed } = classify(base);
    let openFail = 0;
    let bar2 = 0;
    for (const pair of open) {
        const [a, b] = pair.split('|');
        for (const theme of tree.names) {
            const v = distance(tree, theme, a, b);
            if (!(v >= LINE)) {
                openFail += 1;
                console.log(`  ${label} open under 10: ${name(tree, pair)} ${theme} ${f(v)}`);
            }
        }
    }
    for (const pair of collapsed) {
        const [a, b] = pair.split('|');
        for (const theme of tree.names) {
            const before = distance(base, theme, a, b);
            const after = distance(tree, theme, a, b);
            if (before >= LINE ? !(after >= LINE) : !(after >= before)) {
                bar2 += 1;
                console.log(`  ${label} bar 2 breaks: ${name(tree, pair)} ${theme} ${f(before)} -> ${f(after)}`);
            }
        }
    }
    const count = collapsed.filter((p) => under(tree, p).length > 0).length;
    return { open: openFail, bar2, count };
}

// --tokens <theme>:<token>,...: the resolved value of each token, base -> worktree.
const tokAt = process.argv.indexOf('--tokens');
if (tokAt > 0) {
    for (const item of process.argv.slice(tokAt + 1)) {
        const [theme, list] = item.split(':');
        const cells = list.split(',').map((tok) => `${tok} ${base.tokens[theme][tok]} -> ${wt.tokens[theme][tok]}`);
        console.log(`  ${theme}: ${cells.join('; ')}`);
    }
}

// --classes: the body classes in the order parseBlocks first meets them (the order themeClasses of
// ui/theme/theme.ts hands the Settings view), base and worktree, the first 8 of each.
if (process.argv.includes('--classes')) {
    for (const [label, root] of [['base', BASE], ['worktree', WT]] as const) {
        const dir = join(root, 'src/lib/themes');
        const text = [
            readFileSync(join(dir, 'tokens.css'), 'utf8'),
            readFileSync(join(dir, 'themes.css'), 'utf8'),
            ...readdirSync(join(dir, 'rice')).filter((n) => n.endsWith('.css')).sort().map((n) => readFileSync(join(dir, 'rice', n), 'utf8')),
            readFileSync(join(dir, 'vscode.css'), 'utf8')
        ].join('\n');
        const keys = Object.keys(parseBlocks(text)).filter((k) => k !== ':root' && k !== 'crt');
        console.log(`  ${label}: ${keys.length} classes; first 8: ${keys.slice(0, 8).join(' ')}; vscode-tomorrow-night-blue at ${keys.indexOf('vscode-tomorrow-night-blue') + 1}`);
    }
}

// --panel <tone>,...: each tone's -lane surface against the panel it is drawn on, over the 49 themes
// of the worktree: the smallest distance, the theme it falls in, and the themes under 10. With no
// list, every tone a Focus header resolves to (C13).
const panelAt = process.argv.indexOf('--panel');
if (panelAt > 0) {
    const listed = process.argv[panelAt + 1];
    const tones = listed && !listed.startsWith('--') ? listed.split(',') : [...new Set(Object.values(wt.headers).map((h) => (h as Header).tone))];
    console.log(`C13 every header tone's -lane against --panel, ${tones.length} tones over ${wt.names.length} themes:`);
    for (const tone of tones) {
        const rows = wt.names.map((n) => ({ n, d: de(wt.tokens[n][`--c-${tone}-lane`], wt.tokens[n]['--panel']) })).sort((p, q) => p.d - q.d);
        const low = rows.filter((r) => !(r.d >= LINE));
        console.log(`  ${tone}-lane against --panel: min ${f(rows[0].d)} (${rows[0].n}); median ${f(rows[Math.floor(rows.length / 2)].d)}; under 10 in ${low.length}${low.length ? `: ${low.map((r) => `${r.n} ${f(r.d)}`).join(', ')}` : ''}`);
    }
}

// --lane <key>: one header against every other header, touching or not, base and worktree, the
// smallest distance over the 49 themes and the theme it falls in.
const laneAt = process.argv.indexOf('--lane');
if (laneAt > 0) {
    const id = process.argv[laneAt + 1];
    console.log(`=== ${wt.headers[id].label} against every other header, smallest over the 49 themes, base -> worktree`);
    for (const other of wt.order) {
        if (other === id) continue;
        const b = smallest(base, pairKey(id, other, wt.order));
        const w = smallest(wt, pairKey(id, other, wt.order));
        const n = (tree: Tree): number => under(tree, pairKey(id, other, wt.order)).length;
        console.log(`  ${wt.headers[other].label}: ${f(b.dist)} (${b.theme}) -> ${f(w.dist)} (${w.theme}); under 10 in ${n(base)} -> ${n(wt)} themes`);
    }
}

// --trial <json>: lane tones and theme tokens laid over the worktree, {"lanes": {<key>: <tone>},
// "tokens": {<theme>: {<token>: <hex>}}}, measured under bars 1 and 2 and C11.
const trialAt = process.argv.indexOf('--trial');
if (trialAt > 0) {
    const spec = JSON.parse(process.argv[trialAt + 1]);
    // --on-base lays the trial over the base copy instead of the worktree.
    const tree = overlay(process.argv.includes('--on-base') ? base : wt, spec.lanes ?? {}, spec.tokens ?? {});
    console.log(`=== trial ${process.argv[trialAt + 1]}${process.argv.includes('--on-base') ? ' over the base' : ''}`);
    const r = bars(tree, 'trial');
    const { collapsed } = classify(base);
    const baseCount = collapsed.filter((p) => under(base, p).length > 0).length;
    console.log(`trial: open-layout measures under 10 ${r.open}; bar 2 breaks ${r.bar2}; collapsed-only pairs under 10 ${r.count} (base ${baseCount})`);
    for (const [theme, set] of Object.entries(spec.tokens ?? {}) as [string, Record<string, string>][]) {
        for (const token of Object.keys(set)) {
            const hue = token.slice('--c-'.length);
            const s = statusCheck(tree, theme, hue);
            console.log(`  C11 ${theme} ${token} ${wt.authored[theme][token]} -> ${set[token]}: nearest status hue ${s.hue}, -txt ${s.txt}${s.under.length ? `; UNDER 10: ${s.under.join(', ')}` : ''}`);
        }
    }
}

// --hue <theme> <token> [json]: candidate values for one theme hue, over the trial in json when
// given. Candidates are the hexes the theme's own block holds (its palette), and an OKLCH grid
// around the current value: lightness 0.15 to 0.97 in steps of 0.01, chroma x0.6 to x1.4 in steps
// of 0.2, hue -20 to +20 in steps of 10. A candidate is kept when, in that theme, no open-layout
// pair is under 10, every collapsed-only pair meets bar 2, the hue is at 10 or more from every
// status token on the hue and on -txt, and its -lane surface is 10 or more from --panel (C13).
const hueAt = process.argv.indexOf('--hue');
if (hueAt > 0) {
    const theme = process.argv[hueAt + 1];
    const token = process.argv[hueAt + 2];
    const spec = process.argv[hueAt + 3] ? JSON.parse(process.argv[hueAt + 3]) : {};
    const start = overlay(wt, spec.lanes ?? {}, spec.tokens ?? {});
    const current = start.authored[theme][token];
    const hue = token.slice('--c-'.length);
    const toOklch = culori.converter('oklch');
    const candidates = new Map<string, string>();
    for (const [k, v] of Object.entries(start.own[theme] ?? {})) {
        if (/^#[0-9a-f]{6}$/i.test(v) && v.toLowerCase() !== current.toLowerCase()) {
            const key = v.toLowerCase();
            if (!candidates.has(key)) candidates.set(key, `own block (${k})`);
        }
    }
    const o = toOklch(current);
    for (let l = 0.15; l <= 0.97; l += 0.01) {
        for (const cs of [0.6, 0.8, 1, 1.2, 1.4]) {
            for (const dh of [-20, -10, 0, 10, 20]) {
                const c = culori.clampChroma({ mode: 'oklch', l, c: o.c * cs, h: (o.h ?? 0) + dh }, 'oklch');
                const hex = culori.formatHex(c);
                if (!candidates.has(hex)) candidates.set(hex, `OKLCH L ${l.toFixed(2)} C x${cs} h ${dh >= 0 ? '+' : ''}${dh}`);
            }
        }
    }
    const { open, collapsed } = classify(base);
    const kept: { hex: string; why: string; margin: number; note: string }[] = [];
    for (const [hex, why] of candidates) {
        const tree = overlay(start, {}, { [theme]: { [token]: hex } });
        let ok = true;
        let margin = Infinity;
        // An open pair of two other hues does not move with this hue, so it is left to its own fix.
        for (const pair of open) {
            const [a, b] = pair.split('|');
            if (tree.headers[a].tone !== hue && tree.headers[b].tone !== hue) continue;
            const v = distance(tree, theme, a, b);
            if (!(v >= LINE)) ok = false;
            margin = Math.min(margin, v);
        }
        for (const pair of collapsed) {
            const [a, b] = pair.split('|');
            const before = distance(base, theme, a, b);
            const after = distance(tree, theme, a, b);
            if (before >= LINE ? !(after >= LINE) : !(after >= before)) ok = false;
        }
        const s = statusCheck(tree, theme, hue);
        if (s.under.length > 0) ok = false;
        // C13: the hue's header surface against the panel it is drawn on.
        const panel = de(tree.tokens[theme][`--c-${hue}-lane`], tree.tokens[theme]['--panel']);
        if (!(panel >= LINE)) ok = false;
        const least = Math.min(margin, parseFloat(s.hue), parseFloat(s.txt), panel);
        if (ok) kept.push({ hex, why, margin: least, note: `status hue ${s.hue}, -txt ${s.txt}; panel ${f(panel)}` });
    }
    // Nearest to the old value first, by CIEDE2000: the smallest visible change that meets the bars.
    const away = (hex: string): number => de(current, hex);
    kept.sort((p, q) => away(p.hex) - away(q.hex));
    console.log(`=== ${theme} ${token} ${current} (OKLCH L ${o.l.toFixed(3)} C ${o.c.toFixed(3)} h ${(o.h ?? 0).toFixed(1)}): ${kept.length} of ${candidates.size} candidates meet the bars`);
    // The pick: the nearest candidate whose every measure clears the 10 line by half a unit, so a
    // rounding of the hex does not put it back under.
    const roomy = kept.filter((k) => k.margin >= LINE + 0.5);
    const own = kept.filter((k) => k.why.startsWith('own'));
    for (const k of [...roomy.slice(0, 4), ...own.slice(0, 3)]) {
        console.log(`  ${k.hex} ${k.why}; ${f(away(k.hex))} from the old value; smallest measure ${f(k.margin)}; ${k.note}`);
    }
}

```

## Corrections and the measures on the final tree (added at landing)

- The table under Item 6 gave nord `--c-slate` 25.4 from its old value, gruvbox `--c-slate` 11.4 from the panel and dark `--c-slate` 16.3 from the panel; the `--hue` reruns print 24.2, 10.7 and 16.9, and the cells now read so.
- Nord `--c-blue` is `#7281c7` on main, not `#8493db`: the `--hue` run on the final tree picks it first, 6.2 from `#5e81ac`. Solarized `--c-slate` stays `#aad0d1`: the first pick there, `#a4c9cb`, puts `--c-grey-d` at 10.4, and the head comment of `rice/singles.css` says that Solarized's slate, grey and grey-d were picked in that order. The C11 lines below are from the final tree.
- Tomorrow Night Blue's `--c-blue` is `#699bff`, not the `#003abc` Item 5 names: `#003abc`'s lane measured 8.4 from `--panel`, so item 6 re-picked it.

The program's plain run on the final tree, from the gate worktree: every pair measure that moved between the base and the final tree, with its theme, before and after (312 lines; an open pair that goes from under 10 to 10 or more is a pair the change ends), then the bars and the C11 lines.

```
  moved Funding-Teaching kanagawalotus: 13.2 -> 14.1
  moved Funding-Push vscode-tomorrow-night-blue: 39.0 -> 36.9
  moved Funding-Push frappe: 27.4 -> 28.6
  moved Funding-Push nord: 28.3 -> 31.9
  moved Funding-Push kanagawadragon: 15.2 -> 14.0
  moved Funding-Push rosepinedawn: 30.5 -> 35.1
  moved Funding-Push kanagawalotus: 18.3 -> 21.1
  moved Funding-Revise kanagawalotus: 13.8 -> 19.0
  moved Funding-Review dark: 27.7 -> 29.3
  moved Funding-Review vscode-solarized-dark: 27.9 -> 30.7
  moved Funding-Review vscode-tomorrow-night-blue: 27.8 -> 31.5
  moved Funding-Review mocha: 32.3 -> 33.6
  moved Funding-Review gruvbox: 30.4 -> 33.1
  moved Funding-Review nord: 28.3 -> 22.8
  moved Funding-Review onedark: 27.0 -> 21.8
  moved Funding-Review solarized: 28.3 -> 29.3
  moved Funding-Review kanagawalotus: 4.9 -> 10.5
  moved Funding-Blocked kanagawalotus: 26.2 -> 31.4
  moved Funding-Backburner vscode-quiet-light: 22.0 -> 15.4
  moved Funding-Backburner onedark: 27.0 -> 26.3
  moved Funding-Backburner solarized: 28.3 -> 28.0
  moved Funding-Backburner kanagawalotus: 4.9 -> 10.5
  moved Funding-Scope light: 30.2 -> 26.3
  moved Funding-Scope dark: 32.6 -> 26.2
  moved Funding-Scope vscode-dark-modern: 32.4 -> 24.5
  moved Funding-Scope vscode-light-modern: 30.2 -> 26.3
  moved Funding-Scope vscode-light-2026: 30.2 -> 26.3
  moved Funding-Scope vscode-light-plus: 30.2 -> 26.3
  moved Funding-Scope vscode-light-visual-studio: 30.2 -> 26.3
  moved Funding-Scope vscode-quiet-light: 30.3 -> 26.3
  moved Funding-Scope vscode-solarized-light: 29.4 -> 26.1
  moved Funding-Scope vscode-abyss: 32.5 -> 26.1
  moved Funding-Scope vscode-dark-2026: 32.5 -> 24.2
  moved Funding-Scope vscode-dark-plus: 32.3 -> 24.9
  moved Funding-Scope vscode-dark-visual-studio: 32.3 -> 24.9
  moved Funding-Scope vscode-kimbie-dark: 31.9 -> 23.3
  moved Funding-Scope vscode-monokai: 32.0 -> 25.1
  moved Funding-Scope vscode-monokai-dimmed: 32.3 -> 24.9
  moved Funding-Scope vscode-red: 33.7 -> 17.1
  moved Funding-Scope vscode-solarized-dark: 30.8 -> 31.2
  moved Funding-Scope vscode-tomorrow-night-blue: 31.1 -> 29.4
  moved Funding-Scope vscode-dark-high-contrast: 32.2 -> 23.1
  moved Funding-Scope vscode-light-high-contrast: 30.2 -> 26.3
  moved Funding-Scope mocha: 32.9 -> 33.2
  moved Funding-Scope macchiato: 24.3 -> 24.4
  moved Funding-Scope frappe: 23.4 -> 23.2
  moved Funding-Scope gruvbox: 35.0 -> 30.6
  moved Funding-Scope nord: 30.4 -> 31.4
  moved Funding-Scope synthwave: 35.0 -> 40.3
  moved Funding-Scope tokyoneon: 30.0 -> 37.6
  moved Funding-Scope tokyonight: 30.9 -> 25.1
  moved Funding-Scope tokyostorm: 29.4 -> 24.6
  moved Funding-Scope rosepine: 32.6 -> 27.5
  moved Funding-Scope rosepinemoon: 31.5 -> 26.5
  moved Funding-Scope everforest: 19.8 -> 23.8
  moved Funding-Scope dracula: 27.8 -> 42.4
  moved Funding-Scope onedark: 26.1 -> 26.6
  moved Funding-Scope oxocarbon: 32.2 -> 44.5
  moved Funding-Scope flexoki: 28.9 -> 29.5
  moved Funding-Scope phosphor: 26.3 -> 40.8
  moved Funding-Scope phosphoramber: 27.5 -> 34.0
  moved Funding-Scope kanagawa: 24.4 -> 28.2
  moved Funding-Scope kanagawadragon: 15.2 -> 20.0
  moved Funding-Scope solarized: 27.2 -> 35.3
  moved Funding-Scope latte: 38.0 -> 32.9
  moved Funding-Scope gruvboxlight: 20.0 -> 26.0
  moved Funding-Scope rosepinedawn: 30.5 -> 25.0
  moved Funding-Scope tokyolight: 27.4 -> 21.0
  moved Funding-Scope kanagawalotus: 11.5 -> 31.4
  moved Funding-Scope everforestlight: 35.3 -> 29.4
  moved Funding-Scope flexokilight: 25.3 -> 26.7
  moved Funding-De-risk kanagawalotus: 3.3 -> 10.3
  moved Funding-Build kanagawalotus: 13.2 -> 14.1
  moved Funding-Idea everforest: 24.4 -> 29.9
  moved Funding-Idea kanagawalotus: 16.3 -> 21.0
  moved Jobs-Run nord: 22.1 -> 21.0
  moved Jobs-Run dracula: 39.9 -> 45.2
  moved Jobs-Run onedark: 26.9 -> 21.8
  moved Jobs-Run solarized: 28.5 -> 24.9
  moved Jobs-Run gruvboxlight: 11.1 -> 13.1
  moved Jobs-Run kanagawalotus: 7.9 -> 12.1
  moved Jobs-Revise nord: 26.4 -> 20.7
  moved Jobs-Revise dracula: 32.3 -> 38.8
  moved Jobs-Revise onedark: 22.1 -> 21.8
  moved Jobs-Revise solarized: 28.3 -> 30.4
  moved Jobs-Review dark: 5.4 -> 5.8
  moved Jobs-Review vscode-solarized-dark: 4.8 -> 6.5
  moved Jobs-Review vscode-tomorrow-night-blue: 5.1 -> 5.4
  moved Jobs-Review mocha: 5.4 -> 7.7
  moved Jobs-Review gruvbox: 5.5 -> 7.6
  moved Jobs-Review nord: 5.6 -> 32.0
  moved Jobs-Review dracula: 0.0 -> 10.7
  moved Jobs-Review onedark: 0.0 -> 6.6
  moved Jobs-Review solarized: 0.0 -> 4.9
  moved Jobs-Blocked nord: 20.0 -> 26.9
  moved Jobs-Blocked dracula: 27.9 -> 35.4
  moved Jobs-Blocked onedark: 23.2 -> 28.6
  moved Jobs-Blocked solarized: 37.9 -> 40.6
  moved Jobs-Backburner vscode-quiet-light: 6.5 -> 8.9
  moved Jobs-Backburner nord: 9.0 -> 12.2
  moved Jobs-Backburner dracula: 0.0 -> 10.7
  moved Jobs-Backburner onedark: 0.0 -> 18.4
  moved Jobs-Backburner solarized: 0.0 -> 16.5
  moved Jobs-Scope light: 14.6 -> 23.7
  moved Jobs-Scope dark: 11.2 -> 26.3
  moved Jobs-Scope vscode-dark-modern: 13.5 -> 25.0
  moved Jobs-Scope vscode-light-modern: 14.6 -> 23.7
  moved Jobs-Scope vscode-light-2026: 14.6 -> 23.7
  moved Jobs-Scope vscode-light-plus: 14.6 -> 23.7
  moved Jobs-Scope vscode-light-visual-studio: 14.6 -> 23.7
  moved Jobs-Scope vscode-quiet-light: 14.6 -> 23.8
  moved Jobs-Scope vscode-solarized-light: 15.4 -> 24.3
  moved Jobs-Scope vscode-abyss: 9.7 -> 27.7
  moved Jobs-Scope vscode-dark-2026: 12.6 -> 25.6
  moved Jobs-Scope vscode-dark-plus: 12.9 -> 25.7
  moved Jobs-Scope vscode-dark-visual-studio: 12.9 -> 25.7
  moved Jobs-Scope vscode-kimbie-dark: 14.8 -> 23.9
  moved Jobs-Scope vscode-monokai: 13.2 -> 25.8
  moved Jobs-Scope vscode-monokai-dimmed: 12.9 -> 25.7
  moved Jobs-Scope vscode-red: 24.2 -> 18.5
  moved Jobs-Scope vscode-solarized-dark: 6.4 -> 33.0
  moved Jobs-Scope vscode-tomorrow-night-blue: 7.0 -> 27.0
  moved Jobs-Scope vscode-dark-high-contrast: 11.9 -> 25.9
  moved Jobs-Scope vscode-light-high-contrast: 14.6 -> 23.7
  moved Jobs-Scope mocha: 13.2 -> 24.8
  moved Jobs-Scope macchiato: 14.9 -> 19.4
  moved Jobs-Scope frappe: 13.4 -> 20.0
  moved Jobs-Scope gruvbox: 13.1 -> 25.6
  moved Jobs-Scope nord: 12.7 -> 32.9
  moved Jobs-Scope synthwave: 30.2 -> 25.9
  moved Jobs-Scope tokyoneon: 24.9 -> 25.8
  moved Jobs-Scope tokyonight: 22.0 -> 23.6
  moved Jobs-Scope tokyostorm: 18.2 -> 21.8
  moved Jobs-Scope rosepine: 14.6 -> 18.6
  moved Jobs-Scope rosepinemoon: 16.1 -> 16.6
  moved Jobs-Scope everforest: 10.3 -> 26.2
  moved Jobs-Scope dracula: 25.5 -> 35.4
  moved Jobs-Scope onedark: 19.2 -> 31.4
  moved Jobs-Scope oxocarbon: 22.1 -> 23.5
  moved Jobs-Scope flexoki: 18.0 -> 23.5
  moved Jobs-Scope phosphor: 15.1 -> 51.2
  moved Jobs-Scope phosphoramber: 30.1 -> 25.7
  moved Jobs-Scope kanagawa: 15.8 -> 20.9
  moved Jobs-Scope kanagawadragon: 7.2 -> 20.5
  moved Jobs-Scope solarized: 11.5 -> 40.6
  moved Jobs-Scope latte: 19.6 -> 25.1
  moved Jobs-Scope gruvboxlight: 13.6 -> 24.7
  moved Jobs-Scope rosepinedawn: 16.0 -> 12.7
  moved Jobs-Scope tokyolight: 13.2 -> 14.7
  moved Jobs-Scope kanagawalotus: 7.7 -> 24.8
  moved Jobs-Scope everforestlight: 17.1 -> 28.6
  moved Jobs-Scope flexokilight: 15.9 -> 22.0
  moved Jobs-De-risk nord: 32.0 -> 32.4
  moved Jobs-De-risk dracula: 42.3 -> 48.9
  moved Jobs-De-risk onedark: 27.0 -> 21.2
  moved Jobs-De-risk solarized: 28.3 -> 30.4
  moved Jobs-Build nord: 20.8 -> 20.9
  moved Jobs-Build dracula: 30.5 -> 33.9
  moved Jobs-Build onedark: 24.1 -> 19.0
  moved Jobs-Build solarized: 16.5 -> 19.2
  moved Jobs-Idea nord: 13.3 -> 16.0
  moved Jobs-Idea everforest: 20.8 -> 23.7
  moved Jobs-Idea dracula: 21.9 -> 31.6
  moved Jobs-Idea onedark: 19.5 -> 20.6
  moved Jobs-Idea solarized: 28.1 -> 32.1
  moved Teaching-Run solarized: 18.6 -> 13.0
  moved Teaching-Run gruvboxlight: 22.5 -> 21.6
  moved Teaching-Push vscode-tomorrow-night-blue: 20.0 -> 18.3
  moved Teaching-Push frappe: 22.2 -> 22.7
  moved Teaching-Push nord: 20.4 -> 24.2
  moved Teaching-Push kanagawadragon: 10.2 -> 11.6
  moved Teaching-Push rosepinedawn: 10.7 -> 16.1
  moved Teaching-Review dark: 20.4 -> 21.8
  moved Teaching-Review vscode-solarized-dark: 16.1 -> 18.9
  moved Teaching-Review vscode-tomorrow-night-blue: 17.5 -> 16.9
  moved Teaching-Review mocha: 28.2 -> 27.0
  moved Teaching-Review gruvbox: 27.8 -> 27.6
  moved Teaching-Review nord: 24.4 -> 25.7
  moved Teaching-Review onedark: 24.1 -> 22.1
  moved Teaching-Review solarized: 16.5 -> 15.7
  moved Teaching-Backburner vscode-quiet-light: 19.4 -> 17.9
  moved Teaching-Backburner onedark: 24.1 -> 23.1
  moved Teaching-Backburner solarized: 16.5 -> 15.9
  moved Teaching-Scope light: 10.1 -> 45.3
  moved Teaching-Scope dark: 12.3 -> 45.5
  moved Teaching-Scope vscode-dark-modern: 12.2 -> 45.8
  moved Teaching-Scope vscode-light-modern: 10.1 -> 45.3
  moved Teaching-Scope vscode-light-2026: 10.1 -> 45.3
  moved Teaching-Scope vscode-light-plus: 10.1 -> 45.3
  moved Teaching-Scope vscode-light-visual-studio: 10.1 -> 45.3
  moved Teaching-Scope vscode-quiet-light: 10.1 -> 45.4
  moved Teaching-Scope vscode-solarized-light: 9.5 -> 45.9
  moved Teaching-Scope vscode-abyss: 12.6 -> 45.5
  moved Teaching-Scope vscode-dark-2026: 12.5 -> 45.3
  moved Teaching-Scope vscode-dark-plus: 12.2 -> 45.9
  moved Teaching-Scope vscode-dark-visual-studio: 12.2 -> 45.9
  moved Teaching-Scope vscode-kimbie-dark: 11.8 -> 46.8
  moved Teaching-Scope vscode-monokai: 11.8 -> 46.4
  moved Teaching-Scope vscode-monokai-dimmed: 12.2 -> 45.9
  moved Teaching-Scope vscode-red: 14.2 -> 43.2
  moved Teaching-Scope vscode-solarized-dark: 11.7 -> 47.1
  moved Teaching-Scope vscode-tomorrow-night-blue: 11.1 -> 42.4
  moved Teaching-Scope vscode-dark-high-contrast: 12.8 -> 45.1
  moved Teaching-Scope vscode-light-high-contrast: 10.1 -> 45.3
  moved Teaching-Scope mocha: 21.9 -> 41.1
  moved Teaching-Scope macchiato: 14.2 -> 42.2
  moved Teaching-Scope frappe: 14.0 -> 43.1
  moved Teaching-Scope gruvbox: 25.7 -> 43.9
  moved Teaching-Scope nord: 17.6 -> 40.9
  moved Teaching-Scope synthwave: 9.8 -> 51.2
  moved Teaching-Scope tokyoneon: 14.2 -> 44.2
  moved Teaching-Scope tokyonight: 14.8 -> 41.4
  moved Teaching-Scope tokyostorm: 15.0 -> 41.4
  moved Teaching-Scope rosepine: 17.9 -> 38.2
  moved Teaching-Scope rosepinemoon: 14.4 -> 37.4
  moved Teaching-Scope everforest: 8.6 -> 41.4
  moved Teaching-Scope dracula: 13.7 -> 48.9
  moved Teaching-Scope onedark: 9.5 -> 42.8
  moved Teaching-Scope oxocarbon: 10.7 -> 42.1
  moved Teaching-Scope flexoki: 7.6 -> 44.8
  moved Teaching-Scope phosphor: 7.0 -> 53.6
  moved Teaching-Scope phosphoramber: 6.9 -> 49.8
  moved Teaching-Scope kanagawa: 7.7 -> 33.0
  moved Teaching-Scope kanagawadragon: 10.2 -> 34.6
  moved Teaching-Scope solarized: 7.5 -> 46.8
  moved Teaching-Scope latte: 9.7 -> 44.8
  moved Teaching-Scope gruvboxlight: 11.5 -> 47.7
  moved Teaching-Scope rosepinedawn: 10.7 -> 37.5
  moved Teaching-Scope tokyolight: 10.1 -> 28.6
  moved Teaching-Scope kanagawalotus: 9.4 -> 37.8
  moved Teaching-Scope everforestlight: 18.9 -> 43.1
  moved Teaching-Scope flexokilight: 6.2 -> 40.9
  moved Teaching-Idea everforest: 33.9 -> 32.7
  moved Run-Scope light: 22.5 -> 51.1
  moved Run-Scope dark: 27.3 -> 53.3
  moved Run-Scope vscode-dark-modern: 26.1 -> 53.2
  moved Run-Scope vscode-light-modern: 22.5 -> 51.1
  moved Run-Scope vscode-light-2026: 22.5 -> 51.1
  moved Run-Scope vscode-light-plus: 22.5 -> 51.1
  moved Run-Scope vscode-light-visual-studio: 22.5 -> 51.1
  moved Run-Scope vscode-quiet-light: 22.6 -> 51.3
  moved Run-Scope vscode-solarized-light: 20.0 -> 50.6
  moved Run-Scope vscode-abyss: 27.4 -> 52.7
  moved Run-Scope vscode-dark-2026: 26.6 -> 52.9
  moved Run-Scope vscode-dark-plus: 25.7 -> 53.1
  moved Run-Scope vscode-dark-visual-studio: 25.7 -> 53.1
  moved Run-Scope vscode-kimbie-dark: 23.9 -> 52.9
  moved Run-Scope vscode-monokai: 24.6 -> 53.0
  moved Run-Scope vscode-monokai-dimmed: 25.7 -> 53.1
  moved Run-Scope vscode-red: 27.4 -> 51.0
  moved Run-Scope vscode-solarized-dark: 26.6 -> 52.0
  moved Run-Scope vscode-tomorrow-night-blue: 26.7 -> 52.3
  moved Run-Scope vscode-dark-high-contrast: 26.5 -> 52.3
  moved Run-Scope vscode-light-high-contrast: 22.5 -> 51.1
  moved Run-Scope mocha: 29.4 -> 47.0
  moved Run-Scope macchiato: 23.7 -> 41.1
  moved Run-Scope frappe: 23.4 -> 38.8
  moved Run-Scope gruvbox: 35.4 -> 42.3
  moved Run-Scope nord: 24.1 -> 40.8
  moved Run-Scope synthwave: 11.6 -> 51.8
  moved Run-Scope tokyoneon: 26.1 -> 53.4
  moved Run-Scope tokyonight: 31.8 -> 43.1
  moved Run-Scope tokyostorm: 32.3 -> 43.7
  moved Run-Scope rosepine: 17.0 -> 32.0
  moved Run-Scope rosepinemoon: 13.3 -> 31.1
  moved Run-Scope everforest: 12.8 -> 35.4
  moved Run-Scope dracula: 27.7 -> 57.4
  moved Run-Scope onedark: 19.5 -> 38.9
  moved Run-Scope oxocarbon: 17.6 -> 55.2
  moved Run-Scope flexoki: 19.4 -> 34.9
  moved Run-Scope phosphor: 17.4 -> 61.1
  moved Run-Scope phosphoramber: 21.1 -> 48.1
  moved Run-Scope kanagawa: 23.4 -> 39.9
  moved Run-Scope kanagawadragon: 11.8 -> 30.9
  moved Run-Scope solarized: 24.9 -> 42.0
  moved Run-Scope latte: 32.9 -> 52.8
  moved Run-Scope gruvboxlight: 12.7 -> 35.7
  moved Run-Scope rosepinedawn: 6.9 -> 31.4
  moved Run-Scope tokyolight: 25.2 -> 35.2
  moved Run-Scope kanagawalotus: 10.7 -> 35.7
  moved Run-Scope everforestlight: 33.2 -> 37.7
  moved Run-Scope flexokilight: 18.7 -> 33.6
  moved Run-Idea everforest: 33.7 -> 38.5
  moved Run-Idea solarized: 54.6 -> 49.3
  moved Run-Idea gruvboxlight: 28.3 -> 31.0
  moved Run-Idea kanagawalotus: 19.5 -> 22.4
  moved Push-De-risk vscode-tomorrow-night-blue: 48.3 -> 43.7
  moved Push-De-risk frappe: 27.4 -> 28.6
  moved Push-De-risk nord: 37.0 -> 40.2
  moved Push-De-risk kanagawadragon: 15.2 -> 14.0
  moved Push-De-risk rosepinedawn: 30.5 -> 35.1
  moved Push-Idea vscode-tomorrow-night-blue: 17.5 -> 19.7
  moved Push-Idea frappe: 18.8 -> 19.5
  moved Push-Idea nord: 15.7 -> 12.2
  moved Push-Idea everforest: 29.8 -> 28.8
  moved Push-Idea kanagawadragon: 6.2 -> 11.2
  moved Push-Idea rosepinedawn: 21.2 -> 20.5
  moved Revise-Idea everforest: 24.4 -> 29.9
  moved Review-Idea dark: 19.9 -> 16.0
  moved Review-Idea vscode-solarized-dark: 23.3 -> 19.7
  moved Review-Idea vscode-tomorrow-night-blue: 16.0 -> 15.2
  moved Review-Idea mocha: 23.1 -> 27.2
  moved Review-Idea gruvbox: 23.0 -> 28.4
  moved Review-Idea nord: 17.2 -> 21.7
  moved Review-Idea everforest: 20.8 -> 23.7
  moved Review-Idea onedark: 19.5 -> 17.6
  moved Review-Idea solarized: 28.1 -> 35.6
  moved Blocked-Idea everforest: 9.6 -> 15.3
  moved Backburner-Idea vscode-quiet-light: 18.6 -> 23.2
  moved Backburner-Idea everforest: 20.8 -> 23.7
  moved Backburner-Idea onedark: 19.5 -> 18.6
  moved Backburner-Idea solarized: 28.1 -> 28.2
bars: open-layout measures under 10 0; bar 2 breaks 0; collapsed-only pairs under 10 13
  C11 dark --c-slate #475569 -> #7b81a3: nearest status hue 13.9 (grey), -txt 10.6 (grey)
  C11 vscode-quiet-light --c-grey #9ca3af -> #6d705b: nearest status hue 22.4 (teal), -txt 18.7 (brass)
  C11 vscode-solarized-dark --c-slate #475569 -> #505575: nearest status hue 18.9 (blue), -txt 11.0 (grey)
  C11 vscode-tomorrow-night-blue --c-blue #2563eb -> #699bff: nearest status hue 11.6 (slate), -txt 10.5 (slate)
  C11 vscode-tomorrow-night-blue --c-slate #475569 -> #7285b7: nearest status hue 11.6 (blue), -txt 10.5 (blue)
  C11 mocha --c-slate #475569 -> #335469: nearest status hue 33.7 (grey), -txt 11.4 (blue)
  C11 frappe --c-blue #8caaee -> #8cafff: nearest status hue 16.6 (grey), -txt 14.6 (grey)
  C11 gruvbox --c-slate #475569 -> #35576c: nearest status hue 19.7 (blue), -txt 11.0 (grey)
  C11 nord --c-blue #5e81ac -> #7281c7: nearest status hue 17.1 (grey), -txt 10.9 (grey)
  C11 nord --c-slate #475569 -> #4b432c: nearest status hue 34.8 (red), -txt 10.8 (amber)
  C11 nord --c-grey-d #6b7280 -> #dfdff4: nearest status hue 16.9 (grey), -txt 10.7 (blue)
  C11 everforest --c-mauve #d699b6 -> #f1acec: nearest status hue 10.7 (violet), -txt 10.7 (violet)
  C11 dracula --c-grey-d #6272a4 -> #00467d: nearest status hue 18.1 (blue), -txt 17.5 (blue)
  C11 onedark --c-slate #5c6370 -> #b7b8cf: nearest status hue 20.8 (blue), -txt 10.6 (grey)
  C11 onedark --c-grey #5c6370 -> #646c7c: nearest status hue 25.1 (violet), -txt 10.6 (slate)
  C11 onedark --c-grey-d #5c6370 -> #bfd0de: nearest status hue 10.6 (slate), -txt 10.6 (slate)
  C11 kanagawadragon --c-blue #8ba4b0 -> #b2c9d0: nearest status hue 10.5 (cyan), -txt 10.5 (cyan)
  C11 solarized --c-green #859900 -> #859638: nearest status hue 18.4 (amber), -txt 19.9 (amber)
  C11 solarized --c-slate #586e75 -> #aad0d1: nearest status hue 19.8 (cyan), -txt 12.3 (grey)
  C11 solarized --c-grey #586e75 -> #60767d: nearest status hue 16.1 (violet), -txt 12.3 (slate)
  C11 solarized --c-grey-d #586e75 -> #c1ccd5: nearest status hue 10.6 (slate), -txt 10.6 (slate)
  C11 gruvboxlight --c-green #79740e -> #6b7700: nearest status hue 19.2 (cyan), -txt 18.7 (cyan)
  C11 rosepinedawn --c-blue #286983 -> #13568a: nearest status hue 10.5 (cyan), -txt 10.5 (cyan)
  C11 kanagawalotus --c-gold #77713f -> #3a4a00: nearest status hue 21.7 (brass), -txt 11.7 (green)
  C11 kanagawalotus --c-green #6f894e -> #80b16f: nearest status hue 18.3 (teal), -txt 10.7 (teal)
C11 theme hues changed: 25; under 10 from a status token: 0
```
