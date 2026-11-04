# O141 builder report

Everything in the brief is done.

Five points need a ruling or a reading before landing; each is set out with its evidence under "For the coordinator first" below:
1. A grep I ran read `config/local.yml`, which the brief forbids. It printed no line from that file.
2. Scope is now crimson. It sits under 10 from Blocked's red in 48 themes. The two never touch in any layout.
3. I passed over the literal choice rule in one place. A Jobs recolour to `amber-s` would need 7 theme hues instead of 11, but that header then all but vanishes into the panel.
4. The Tomorrow Night Blue override in themes.css moves that class from place 47 to place 2 in the Settings class-word list.
5. In everforest the Idea lane header's text turns from light to dark.

## Open items of the state file, verbatim

`.scratch/migration/orchestrator-state.md:171-175`: the section "## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)" holds no entry. Its only text under the heading is: "An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own."

## For the coordinator first

### 1. A grep read `config/local.yml`

This command, run while checking the changed hexes against docs, read `config/local.yml`:

```sh
for h in 6272a4 5e81ac ...; do grep -rn -i -- "#$h" docs README.md src config tests utils --exclude=local.yml | ...; done
```

The `--` ends the options, so grep took `--exclude=local.yml` as a file name. It printed `grep: --exclude=local.yml: No such file or directory` and searched all of `config/`, `config/local.yml` included, for 12 hex strings. No line of its output came from `config/local.yml`. Every grep after it puts `--exclude=local.yml` before the paths, for example `grep -rn -i --exclude=local.yml -- "#$h" docs README.md src config tests utils`, and none of those printed that error.

### 2. Scope and Blocked now share a red in 48 themes

Scope moved from `#0e7490` (`c-cyan-d`) to `#e2374d` (`c-crimson`). The program's `--lane scope` run (`J-lane-scope.txt`) prints `Blocked: 25.5 (kanagawadragon) -> 0.0 (macchiato); under 10 in 0 -> 48 themes`, and in macchiato `--c-red` and `--c-crimson` are both `#ed8796` (`L2-tokens.txt`).
- The two headers never touch. Blocked is column 2 of the `parked` row and Scope is column 1 of the `incubate` row, and the pair `Blocked-Scope` is in neither the open nor the collapsed-only list of the 128 layouts.
- The bars do not cover two lanes of one colour that sit apart, so this is a user-visible effect outside them.
- The options, each measured on the changed tree with `--trial '{"lanes":{"scope":"<tone>"}}'` (files `K-scope-<tone>.txt`):

| Option | What the trial prints |
| --- | --- |
| (a) crimson, as built | 0 open measures under 10; 0 bar 2 breaks; 13 collapsed-only pairs under 10 |
| (b) orange | `open-layout measures under 10 5; bar 2 breaks 6` (Scope-De-risk in gruvbox, tokyonight, tokyostorm, onedark and kanagawadragon; Funding-Scope in vscode-red, tokyonight, tokyostorm, onedark, kanagawadragon and tokyolight) |
| (c) magenta | `open-layout measures under 10 18; bar 2 breaks 0`, all of them Scope-Idea |
| (d) rose | `open-layout measures under 10 24; bar 2 breaks 0` |
| (e) pink | `open-layout measures under 10 36; bar 2 breaks 0` |

Options (b) to (e) each need more theme hues on top of the 11 the tree already has. My recommendation, as a judgment, is (a). The brief's bars measure headers that touch, and these two never do. If Axel counts two lanes of one colour on the board as a defect, (a) is the lazy option and (b) is the next to measure.

### 3. Where I passed over the literal choice rule: no surface tints as lane tones

The cases file says to choose "the change that ends each failing pair with the fewest theme hues changed". A Jobs recolour to `amber-s` ends more pairs at once. Over the base, `--on-base --trial '{"lanes":{"scope":"crimson","jobs":"amber-s"}}'` leaves 8 open measures under 10, in 7 themes (`M-base-crimson-ambers.txt`): vscode-red, solarized, gruvboxlight, kanagawalotus, dracula, rosepinedawn and everforest. Fixing those would take 7 theme hues where the built change takes 11.

I did not take it, and `--panel` (`N-panel.txt`) gives the reason. `amber-s` is a surface tint, and in half the themes its lane surface is close to the panel the header is drawn on:

| Surface against `--panel` | Smallest | Median | Themes under 10 |
| --- | --- | --- | --- |
| `amber-s-lane` | 1.7 (rosepine) | 7.1 | 26 |
| `red-s-lane` | 1.7 (rosepine) | 7.1 | 28 |
| `grey-d-lane`, the Jobs tone now | 8.2 (nord) | 15.8 | 3 |

With `amber-s` the Jobs header would hardly differ from the panel in 26 themes. In the light theme its surface would be `#faecc6`. `red-s`, the only other Jobs tone with at most one bar-2 break in `E-candidates.txt`, behaves the same.
- Options: (a) as built, Jobs keeps `grey-d`, 11 theme hues; (b) Jobs to `amber-s` and 7 theme hues.
- I recommend (a), as a judgment. (b) changes fewer hues, but it costs the header its colour.

### 4. Tomorrow Night Blue's blue lives in themes.css, which moves it in the Settings class list

The theme's block in vscode.css sets no `--c-blue`, so before this change the theme took tokens.css's `#2563eb`. vscode.css is generated: its head says to change the converter and run it, never the file. So the override is a block of its own in themes.css:

```css
/* --- VS Code Tomorrow Night Blue: oculus's blue -------------------------- */
/* The theme's block in vscode.css sets no `--c-blue`, so the theme would take the blue of
   tokens.css. This `--c-blue` is oculus's own: the value nearest that blue that sets the Focus
   board's lane and band headers 10 or more apart in CIEDE2000 and stays 10 or more from the
   theme's other status hues. */
body.vscode-tomorrow-night-blue {
    --c-blue: #003abc;
}
```

`parseBlocks` merges the two blocks of the class, and the converter's `readBases` (`utils/migrations/convert-vscode-themes.ts:174-180`) reads only `:root` and `body.dark` of themes.css, so the next conversion run is unaffected. The class's first appearance is now in themes.css, though, and `themeClasses()` (`src/lib/ui/theme/theme.ts:161`) lists classes in that order. The Settings view offers that list as the words of a theme's `class` (`settings/scopes/lists.svelte.ts:42`). The program's `--classes` run prints:

```
  base: 49 classes; first 8: dark rice mocha macchiato frappe latte everforest everforestlight; vscode-tomorrow-night-blue at 47
  worktree: 49 classes; first 8: dark vscode-tomorrow-night-blue rice mocha macchiato frappe latte everforest; vscode-tomorrow-night-blue at 2
```

Options:
- (a) Keep it as built.
- (b) Give the converter a per-theme token it writes into the generated block. This widens the paths to `utils/migrations/convert-vscode-themes.ts`, rerunning it rewrites vscode.css, and it puts a hand-chosen value inside a file that converts VS Code's own colours.
- (c) Hand-edit vscode.css. A rerun loses the edit, and the file's head forbids it.

My judgment is (a). themes.css is where oculus's hand-written tokens live, and the only cost is the order of one suggestion. (c) is the lazy option.

### 5. Other effects a look should read

- **Idea header text in everforest.** `--c-mauve` goes from `#d699b6` to `#f1acec`. The lane surface goes from `#816778` to `#8f7093`, and the derived header text flips from `#f9f0f4` to `#150314` (`L2-tokens.txt`). `contrast.test.ts` passes, so the text reads, but it is dark on purple where every other dark-theme header has light text. The group heading (`--c-mauve-txt`) goes from `#d699b6` to `#f1acec`.
- **kanagawalotus gold.** `--c-gold` goes from `#77713f` to `#3a4a00`, a darker olive. Gold also draws the terminal's ANSI yellow (`terminal-marks.ts:16`, `decoration-colors.ts:41`), the editor's first bracket colour (`colours.ts:492`), `charts.yellow`, and the `in-prep` stage (`vocab.yml:68`, `#a16207`). The other hue of the failing pair, `--c-grey-d`, has a passing value `#39352c` 19.7 from its old value, against gold's 17.3 (`F-hue-search.txt`, `G-hue-search.txt`). It has no direct user outside the theme sheets, but it is the farther move. I kept the one rule: the nearer passing value. Switching would leave the yellow alone at the cost of a larger move of the Jobs header.
- **Headers against the panel.** This lies outside the brief's bars and is not changed. The `--panel` run shows three header tones under 10 against the panel they are drawn on:
  - `grey-d-lane` (Jobs) in nord 8.2, onedark 8.9 and solarized 9.3.
  - `slate-lane` (Review) in 8 themes, nord the lowest at 3.2.
  - `grey-lane` (Backburner) in onedark, solarized and vscode-quiet-light.

  That is a different concern from header-to-header distance. It is reported here so the coordinator can fold it into a step.
- **O140's program needed a copy.** Its `BASE` is `/Users/axelfaes/workspace/oculus/.agents/worktrees/O140-base`, which no longer exists: run as is, it exits 1 with `path: '.../O140-base/src/lib/themes/tokens.css'`. I ran a copy that differs in that one line only, `o140-case-run-on-O141-base.mts` in my scratch folder (`diff` prints `13c13`, `O140-base` to `O141-base`). The base only feeds its "base" half; the `C2` line for the worktree is computed on the worktree alone.

## The cases' first run, on the unchanged tree

Runs A (`A-plain.txt`) and B (`B-search.txt`) of the round before stand as the first run.
- **C1.** Run A prints `C1/C2 open pairs under 10 in at least one theme: 7` and `C1 collapsed-only pairs under 10 in at least one theme: 19`, with 128 layouts, 20 open-layout pairs and 37 collapsed-only pairs.
- **C2.** Run A has 7 open-layout pairs under 10:

  | Pair | Themes |
  | --- | --- |
  | Funding-Jobs | kanagawalotus 4.9 |
  | Funding-Run | kanagawalotus 5.7, solarized 8.9, gruvboxlight 9.3 |
  | Jobs-Push | dracula 0.0, nord 6.5, kanagawadragon 7.2, vscode-tomorrow-night-blue 8.3, frappe 8.9 |
  | Run-Push | rosepinedawn 6.9 |
  | Run-Review | kanagawalotus 7.9 |
  | Review-Scope | vscode-solarized-dark 6.8, kanagawadragon 7.2, kanagawalotus 7.7, vscode-tomorrow-night-blue 8.3, vscode-abyss 9.9 |
  | Scope-Idea | kanagawadragon 6.2 |

- **C3.** Run A, on identical trees: `C3 1813 collapsed-only measures read; 0 break item 3's second bar; collapsed-only pairs under 10: base 19, worktree 19`.
- **C4.** `vocab.yml:181` claimed the open-layout pairs were at 10 or more in every theme, which run A shows false (7 pairs), and "ten" collapsed-only pairs under 10 where run A counts 19. `derive.ts:83-89` made the same open-layout claim. `vocab.yml:213` said "the Idea lane above them", which is false: the band is drawn above the lanes (`behavior.yml:50`).
- **C5.** `diff` of `vocab.yml` and `derive.ts` against the base copy printed nothing.
- **C6.** `npx vitest run tests/checks/look/contrast.test.ts tests/data/shapes/catalog-files/vocab.test.ts tests/checks/config/config-folder.test.ts`: `Tests  108 passed | 2 skipped (110)`.
- **C7.** The chosen layouts of run A. With the band holding Funding and Jobs, the touching pairs include `Funding-Run, Funding-Push, Jobs-Push, Jobs-Revise`. With Funding alone: `Funding-Run, Funding-Push, Funding-Revise`.
- **C8.** With all three band columns and every cluster folded: `Funding-Jobs, Jobs-Teaching, Funding-Idea, Jobs-Idea, Teaching-Idea`. With Jobs alone and every cluster folded: `Jobs-Idea`.
- **C9.** `Band.svelte:141` draws a column when `stages.length + gone > 0`. The run prints `C9 layouts in which Funding is drawn: 64 of 128`, and the same for Jobs and Teaching.
- **C10.** Every lane hex maps through `palette:` to a `c-` tone, and every band value is a tone name the palette holds. Every one of the 13 headers has its `-lane` token in all 49 themes.
- **C11 and C12.** They did not exist at the first run. O140's program ran on the unchanged tree in round 1 and printed `0 pairs under 10`.

## DONE / NOT DONE

| Deliverable | State | Proof, the last line it printed |
| --- | --- | --- |
| Item 1, layout model | DONE | the read under "The layout model as confirmed" |
| Item 2, case-run program | DONE | `npx tsx <scratch>/case-run.mts`: exit 0, `C11 theme hues changed: 11; under 10 from a status token: 0` |
| Item 3, recolour | DONE | Scope to `#e2374d` and 11 theme hues; `bars: open-layout measures under 10 0; bar 2 breaks 0; collapsed-only pairs under 10 13` |
| Item 4, three comments rewritten | DONE | `vocab.yml:181`, `vocab.yml:213`, `derive.ts:83-95`; read pair by pair against the run (C4 below) |
| Theme head comments | DONE | the head comments of 7 sheets; `diff` against the base, C5 below |
| Verify 1, three test files | passes | `Tests  108 passed \| 2 skipped (110)`, `scoped exit 0` |
| Verify 2, `npm run diagrams` | passes | `diagrams exit 0`; `git status --short` shows no change under `docs/` |
| Verify 2, `npm run test:quick` | passes | `test:quick: 62.0 s; every command passed` |
| Verify 3, ASCII perl over `vocab.yml` and `derive.ts` | prints nothing | no output |
| spec.md ASCII gate, `LC_ALL=C grep -n '[^ -~]'` over the 9 touched files | prints nothing | no output |
| Verify 4, `yaml.safe_load` | exit 0 | `yaml 0` |
| Verify 5, C2 and C3 after the last change | hold | `C1/C2 open pairs under 10 in at least one theme: 0`; `C3 1813 collapsed-only measures read; 0 break item 3's second bar; collapsed-only pairs under 10: base 19, worktree 13` |
| C11 | holds | 11 lines, each at 10 or more; `under 10 from a status token: 0` |
| C12, O140's program | holds | `C2 49 themes; 0 themes hold one; 0 measures under 10; 0 pairs under 10` |
| `sh utils/unused-exports.sh` against the base list | same | `diff` against `O141-base/unused-exports.txt`: exit 0 |
| History words in added comment lines | no history wording | grep below |

Full verify list runs: 1, after the last change. No command failed, so nothing was rerun alone, and `uptime` read `load averages: 8.79 5.57 4.17` afterwards. Tests added or changed: none.

The spec.md history grep over the added lines of the 9 files:

```sh
diff ../O141-base/$f $f | grep '^>' | grep -n -i -E "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands|O1[0-9]{2}|Q[0-9]+|D[0-9]+c|20[0-9]{2}"
```

It hit 10 lines, each judged:
- Every hit in a CSS file and in `derive.ts` is `2000` in "CIEDE2000", the name of the measure.
- `vocab.yml:181` matches `2000` twice and `before` once. That `before` is in "the glyph name drawn before the lane's label", a sentence of the base line I did not change (the base line has it too: `grep -c -i before` prints 1).
- `vocab.yml:213` matches only `2000`.

## The cases after the change

- **C1.** The plain run (`H2-after-final.txt`, 621 lines) prints, for the worktree, `C1/C2 open pairs under 10 in at least one theme: 0` and `C1 collapsed-only pairs under 10 in at least one theme: 13`.
- **C2.** Every open-layout pair is at 10 or more in every theme. These are the smallest over the 49 themes:

  | Pair | Smallest | Pair | Smallest |
  | --- | --- | --- | --- |
  | Funding-Jobs | 10.5 (kanagawalotus) | Revise-Backburner | 11.1 (phosphoramber) |
  | Funding-Run | 10.7 (flexokilight) | Review-Blocked | 12.7 (rosepinedawn) |
  | Jobs-Teaching | 10.1 (phosphor) | Review-Scope | 12.7 (rosepinedawn) |
  | Jobs-Push | 10.1 (macchiato) | Blocked-Backburner | 12.7 (rosepinedawn) |
  | Teaching-Revise | 18.0 (kanagawadragon) | Blocked-De-risk | 17.0 (tokyolight) |
  | Run-Push | 12.0 (rosepinedawn) | Backburner-Build | 10.1 (phosphor) |
  | Run-Review | 11.2 (kanagawadragon) | Scope-De-risk | 17.0 (tokyolight) |
  | Push-Revise | 14.0 (kanagawadragon) | Scope-Idea | 10.2 (vscode-solarized-light) |
  | Push-Blocked | 21.6 (nord) | De-risk-Build | 14.6 (tokyolight) |
  | De-risk-Idea | 13.8 (kanagawalotus) | Build-Idea | 15.7 (kanagawadragon) |

- **C3.** The run prints `C3 1813 collapsed-only measures read; 0 break item 3's second bar; collapsed-only pairs under 10: base 19, worktree 13`. The bars section prints `bars: open-layout measures under 10 0; bar 2 breaks 0; collapsed-only pairs under 10 13`. Every collapsed-only pair meets bar 2 with the theme hues changed.
  - These 6 pairs left the under-10 set: Funding-Review and Funding-Backburner (kanagawalotus 4.9 to 10.5), Jobs-Run (kanagawalotus 7.9 to 12.1), and Jobs-Scope, Teaching-Scope and Run-Scope (the Scope recolour).
  - The run reports 433 `moved` lines (`grep -c moved`): 182 open-layout measures and 251 collapsed-only measures whose rounded value changed. They are in `H2-after-final.txt`, lines 172-606.
- **C4.** The comments, read pair by pair against the run.
  - `vocab.yml:181` names 13 pairs:
    - Teaching and Build in 49 themes (`under 10 in 49`).
    - Jobs-Review and Jobs-Backburner in 48 each (`under 10 in 48`, both).
    - Funding-Revise in 41.
    - Funding-De-risk in 32.
    - Teaching-Run in rosepinedawn, kanagawadragon, everforest and kanagawalotus.
    - Jobs-Idea, Review-Idea and Backburner-Idea, each in rosepinedawn, kanagawadragon and rosepinemoon.
    - Teaching-Push in everforest and synthwave.
    - Jobs-De-risk in kanagawalotus.
    - Push-Idea in kanagawalotus.
    - Blocked-Idea in mocha.

    These are the run's 13 pairs, with the same themes.
  - The `derive.ts` doc names the same 13 pairs and counts.
  - `vocab.yml:213` says that the three band hues differ from each other by 10 or more whichever are drawn. The run shows Funding-Jobs at least 10.5 and Jobs-Teaching at least 10.1 (open pairs), and Funding-Teaching at least 14.1 (collapsed-only). It names the 9 pairs that involve a band header (Teaching-Build, Jobs-Review, Jobs-Backburner, Funding-Revise, Funding-De-risk, Teaching-Run, Teaching-Push, Jobs-De-risk, Jobs-Idea), which are the band-header pairs among the 13.
- **C5.** `diff` against the base copy:
  - `vocab.yml`: `181c181`, `189c189`, `213c213` and nothing else.
  - `derive.ts`: `84,88c84,94`, the `LANE_SHARE` doc only.
  - Each rice sheet: its head comment plus its changed hue lines:
    - singles.css: `42c45`, `108c111`, `150c153`.
    - kanagawa.css: `97c100`, `144c147`, `148c151`.
    - catppuccin.css: `148c150`.
    - gruvbox.css: `81c83`.
    - rosepine.css: `157c159`.
    - everforest.css: `45c48`.
  - themes.css: its head comment (`3,4c3,5`) and the added block (`42a44,52`), whose one declaration is the changed hue.
  - No other file of `src tests utils config` differs (`git status --short` lists only these 9 and the two ledger files of this step).
- **C6.** `contrast.test.ts` passes: the three-file run prints `Test Files  3 passed (3)`.
- **C7 to C10.** The final run prints the same chosen layouts and the same `64 of 128` lines as the first run. The tone table now reads `Scope: #e2374d -> c-crimson -> crimson; --c-crimson-lane in 49 of 49`.
- **C11.** The plain run prints one line for every theme hue whose resolved value differs from the base:

  ```
    C11 vscode-tomorrow-night-blue --c-blue #2563eb -> #003abc: nearest status hue 14.4 (slate), -txt 12.3 (slate)
    C11 frappe --c-blue #8caaee -> #8cafff: nearest status hue 16.6 (grey), -txt 14.6 (grey)
    C11 nord --c-blue #5e81ac -> #8493db: nearest status hue 14.5 (grey), -txt 10.5 (slate)
    C11 everforest --c-mauve #d699b6 -> #f1acec: nearest status hue 10.7 (violet), -txt 10.7 (violet)
    C11 dracula --c-grey-d #6272a4 -> #00467d: nearest status hue 18.1 (blue), -txt 17.5 (blue)
    C11 kanagawadragon --c-blue #8ba4b0 -> #b2c9d0: nearest status hue 10.5 (cyan), -txt 10.5 (cyan)
    C11 solarized --c-green #859900 -> #859638: nearest status hue 18.4 (amber), -txt 19.9 (amber)
    C11 gruvboxlight --c-green #79740e -> #6b7700: nearest status hue 19.2 (cyan), -txt 18.7 (cyan)
    C11 rosepinedawn --c-blue #286983 -> #13568a: nearest status hue 10.5 (cyan), -txt 10.5 (cyan)
    C11 kanagawalotus --c-gold #77713f -> #3a4a00: nearest status hue 21.7 (brass), -txt 11.7 (green)
    C11 kanagawalotus --c-green #6f894e -> #80b16f: nearest status hue 18.3 (teal), -txt 10.7 (teal)
  C11 theme hues changed: 11; under 10 from a status token: 0
  ```

  The status tokens are those `statuses:` maps to, as O140's program reads them: `c-amber c-blue c-brass c-cyan c-green c-grey c-orange c-pink c-red c-sky c-slate c-teal c-violet`. O140's program lists the same 11 tokens under "authored tokens that differ between base and worktree", and `themes whose pink or teal changed: 0`.
- **C12.** O140's program from the worktree prints `C2 49 themes; 0 themes hold one; 0 measures under 10; 0 pairs under 10`, `C3 1265 lane pairs read; 0 at 10 or more on the base and under 10 after` and `0 pairs under 10 in some theme on the base are at 10 or more in every theme after` (`I-o140.txt`, 163 lines; run through the one-line copy of point 5 above).

## The layout model as confirmed

- Section order: `config/defaults/behavior.yml:50` `sections: [command_center, tasks, quick_add, awaiting, band, lanes]`, drawn in that order by `Focus.svelte:314-396`, so the band is directly above the lanes.
- Band: three columns drawn by one snippet in the order Funding, Jobs, Teaching (`Band.svelte:164-189`).
  - A column is drawn when `stages.length + gone > 0` (`:141`).
  - The band is drawn only when `anything` (`:160`), and it folds as a whole (`:161`).
  - The grid is `repeat(auto-fit, minmax(min(290px, 100%), 1fr))` with `gap: 8px` (`:197-201`). auto-fit collapses the empty tracks, so k drawn columns split the width into k.
- Clusters: `Lanes.svelte:267-306` draws `focus_clusters` in order (`clusters`, `state/boards/focus.ts:103`).
  - The lanes of a `columns` cluster go in `focus_lanes` order (`lanesIn`, `focus.ts:752`) in the same auto-fit grid (`Lanes.svelte:311-315`).
  - The `full_width` lane has a one-column grid of its own (`:317-319`).
- Folding: a folded group's body is `hidden="until-found"` (`GroupHead.svelte:173`), so a folded cluster draws no lane header.
- Header surfaces:
  - `LaneHead.svelte:40` paints `--lane: var(--c-${tone}-lane); --lane-txt: var(--c-${tone}-lane-txt)`.
  - The lane's 3 px top border is `border-top: 3px solid var(--tone, var(--line))` with `--tone: var(--c-${one.tone})` (`Lanes.svelte:211,327`). The band's is the same (`Band.svelte:142,209`).
  - A lane's tone comes from `toneOf(row.color)` and a band tone from `namedTone` (`Band.svelte:83-87`, `tones.ts:207-212`).
- Touching, as the program models it (`case-run.mts` `touching`): neighbours in a row touch. Headers of consecutive drawn rows touch when `i*m < (j+1)*n && j*n < (i+1)*m`, which is true when their spans overlap by more than a shared edge. A folded Idea lane brings no pair together that no other layout does (`pairs that only a folded Idea lane brings together: 0`).

The pairs:
- 20 open-layout pairs: Funding-Jobs, Funding-Run, Jobs-Teaching, Jobs-Push, Teaching-Revise, Run-Push, Run-Review, Push-Revise, Push-Blocked, Revise-Backburner, Review-Blocked, Review-Scope, Blocked-Backburner, Blocked-De-risk, Backburner-Build, Scope-De-risk, Scope-Idea, De-risk-Build, De-risk-Idea, Build-Idea.
- 37 collapsed-only pairs: Funding-Teaching, Funding-Push, Funding-Revise, Funding-Review, Funding-Blocked, Funding-Backburner, Funding-Scope, Funding-De-risk, Funding-Build, Funding-Idea, Jobs-Run, Jobs-Revise, Jobs-Review, Jobs-Blocked, Jobs-Backburner, Jobs-Scope, Jobs-De-risk, Jobs-Build, Jobs-Idea, Teaching-Run, Teaching-Push, Teaching-Review, Teaching-Blocked, Teaching-Backburner, Teaching-Scope, Teaching-De-risk, Teaching-Build, Teaching-Idea, Run-Scope, Run-Idea, Push-De-risk, Push-Idea, Revise-Build, Revise-Idea, Review-Idea, Blocked-Idea, Backburner-Idea.

## The case-run program and every run

The source is `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o141-builder/case-run.mts`, 765 lines. It reads the base copy and the worktree, imports `parse.ts` and `derive.ts` from the worktree for both trees (the step changes neither function), and prints only. Every output named here sits in the same folder.

The runs after the change, each from the worktree root with `PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH npx tsx <source> [mode]`, every one exit 0:

| File | Mode | What it shows |
| --- | --- | --- |
| `H-after.txt`, `H2-after-final.txt` (621 lines each) | none | C1, C3, C7 to C11 and the bars. `H2` was run with the final source, and `diff` against `H` printed nothing. |
| `J-lane-scope.txt` | `--lane scope` | Scope against every header (each colour, below) |
| `L-tokens.txt`, `L2-tokens.txt`, `L3-txt.txt` | `--tokens ...` | the surfaces before and after (user-visible changes, below) |
| `K-scope-<tone>.txt`, 7 files | `--trial '{"lanes":{"scope":"<tone>"}}'` | the Scope alternatives of point 2 |
| `M-base-crimson.txt` | `--on-base --trial '{"lanes":{"scope":"crimson"}}'` | `open-layout measures under 10 12; bar 2 breaks 0; collapsed-only pairs under 10 16 (base 19)` |
| `M-base-crimson-ambers.txt` | `--on-base --trial '{"lanes":{"scope":"crimson","jobs":"amber-s"}}'` | `open-layout measures under 10 8; bar 2 breaks 0; collapsed-only pairs under 10 13 (base 19)` |
| `N-panel.txt` | `--panel amber-s,red-s,red-t,grey-d,gold,teal,crimson,cyan-d,slate,grey,mauve` | point 3 and point 5 |
| (stdout) | `--classes` | point 4 |
| `I-o140.txt` | O140's program, the one-line copy | C12 |

The runs that chose the values were made on the unchanged tree, before any edit:
- `F-hue-search.txt` and `G-hue-search.txt` hold the `--hue` searches.
- `--trial` runs of the combined set printed `trial: open-layout measures under 10 0; bar 2 breaks 0; collapsed-only pairs under 10 13 (base 19)`.

The final run reproduces that result on the changed tree. The `--hue` header line and the pick for each changed hue:

```
=== dracula --c-grey-d #6272a4 (OKLCH L 0.560 C 0.080 h 270.1): 346 of 1779 candidates meet the bars
  #00467d OKLCH L 0.39 C x1.4 h -20; 18.1 from the old value; smallest measure 10.7; status hue 18.1 (blue), -txt 17.5 (blue)
=== nord --c-blue #5e81ac (OKLCH L 0.594 C 0.077 h 254.0): 421 of 1713 candidates meet the bars
  #8493db OKLCH L 0.68 C x1.4 h +20; 10.2 from the old value; smallest measure 10.5; status hue 14.5 (grey), -txt 10.5 (slate)
=== kanagawadragon --c-blue #8ba4b0 (OKLCH L 0.704 C 0.033 h 228.4): 677 of 1998 candidates meet the bars
  #b2c9d0 OKLCH L 0.82 C x0.8 h -10; 10.5 from the old value; smallest measure 10.5; status hue 10.5 (cyan), -txt 10.5 (cyan)
=== frappe --c-blue #8caaee (OKLCH L 0.742 C 0.104 h 265.7): 615 of 1608 candidates meet the bars
  #8cafff OKLCH L 0.76 C x1.2 h +0; 2.3 from the old value; smallest measure 10.5; status hue 16.6 (grey), -txt 14.6 (grey)
=== vscode-tomorrow-night-blue --c-blue #2563eb (OKLCH L 0.546 C 0.215 h 262.9): 214 of 873 candidates meet the bars
  #003abc OKLCH L 0.42 C x1 h +0; 13.9 from the old value; smallest measure 10.6; status hue 14.4 (slate), -txt 12.3 (slate)
=== solarized --c-green #859900 (OKLCH L 0.644 C 0.151 h 118.6): 934 of 1199 candidates meet the bars
  #859638 OKLCH L 0.64 C x0.8 h +0; 4.8 from the old value; smallest measure 11.6; status hue 18.4 (amber), -txt 19.9 (amber)
=== gruvboxlight --c-green #79740e (OKLCH L 0.546 C 0.112 h 106.5): 784 of 1403 candidates meet the bars
  #6b7700 OKLCH L 0.54 C x1.2 h +10; 4.9 from the old value; smallest measure 12.1; status hue 19.2 (cyan), -txt 18.7 (cyan)
=== kanagawalotus --c-gold #77713f (OKLCH L 0.542 C 0.070 h 102.4): 257 of 1757 candidates meet the bars
  #3a4a00 OKLCH L 0.38 C x1.4 h +20; 17.3 from the old value; smallest measure 10.5; status hue 21.7 (brass), -txt 11.7 (green)
=== kanagawalotus --c-green #6f894e (OKLCH L 0.595 C 0.089 h 128.3): 686 of 1728 candidates meet the bars
  #80b16f OKLCH L 0.71 C x1.2 h +10; 12.7 from the old value; smallest measure 10.6; status hue 18.3 (teal), -txt 10.7 (teal)
=== rosepinedawn --c-blue #286983 (OKLCH L 0.491 C 0.077 h 228.0): 371 of 1526 candidates meet the bars
  #13568a OKLCH L 0.44 C x1.4 h +20; 10.5 from the old value; smallest measure 10.5; status hue 10.5 (cyan), -txt 10.5 (cyan)
=== everforest --c-mauve #d699b6 (OKLCH L 0.750 C 0.082 h 349.2): 227 of 1832 candidates meet the bars
  #f1acec OKLCH L 0.83 C x1.4 h -20; 10.7 from the old value; smallest measure 10.7; status hue 10.7 (violet), -txt 10.7 (violet)
```

The other hue of each failing pair was searched the same way, and its nearest pick was farther from its old value:
- dracula `--c-blue`: 18.1. This is a tie, broken as judgment call 3 says.
- nord, kanagawadragon, frappe and tomorrow-night-blue `--c-grey-d`: 25.4, 23.4, 19.4 and 28.5.
- kanagawalotus `--c-grey-d`: 19.7.
- solarized `--c-gold`: 10.7.
- gruvboxlight `--c-gold`: 12.5.
- rosepinedawn `--c-green`: 30.3.
- everforest `--c-crimson`: 12.4.

The source as it stands:

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
// of the worktree: the smallest distance, the theme it falls in, and the themes under 10.
const panelAt = process.argv.indexOf('--panel');
if (panelAt > 0) {
    for (const tone of process.argv[panelAt + 1].split(',')) {
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
// given. Candidates are the hexes the theme's own block holds (its palette), and the current value
// moved in OKLCH lightness at its own hue and chroma. A candidate is kept when, in that theme, no
// open-layout pair is under 10, every collapsed-only pair meets bar 2, and the hue is at 10 or more
// from every status token on the hue and on -txt.
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
        const least = Math.min(margin, parseFloat(s.hue), parseFloat(s.txt));
        if (ok) kept.push({ hex, why, margin: least, note: `status hue ${s.hue}, -txt ${s.txt}` });
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

## Each colour changed

### The Scope lane: `vocab.yml:189`, `#0e7490` (`c-cyan-d`) to `#e2374d` (`c-crimson`)

It ends Review-Scope in all five themes and Scope-Idea in kanagawadragon:

| Pair | Theme | Before | After |
| --- | --- | --- | --- |
| Review-Scope | vscode-solarized-dark | 6.8 | 34.0 |
| Review-Scope | kanagawadragon | 7.2 | 20.5 |
| Review-Scope | kanagawalotus | 7.7 | 24.8 |
| Review-Scope | vscode-tomorrow-night-blue | 8.3 | 26.9 |
| Review-Scope | vscode-abyss | 9.9 | 29.0 |
| Scope-Idea | kanagawadragon | 6.2 | 19.1 |

Scope against every header, the smallest over the 49 themes, before and after (`--lane scope`):

| Header | Touches Scope | Before | After | Themes under 10 |
| --- | --- | --- | --- | --- |
| Funding | collapsed-only | 11.5 (kanagawalotus) | 17.1 (vscode-red) | 0 to 0 |
| Jobs | collapsed-only | 6.4 (vscode-solarized-dark) | 12.7 (rosepinedawn) | 5 to 0 |
| Teaching | collapsed-only | 6.2 (flexokilight) | 28.6 (tokyolight) | 12 to 0 |
| Run | collapsed-only | 6.9 (rosepinedawn) | 30.9 (kanagawadragon) | 1 to 0 |
| Push | never | 0.0 (rosepine) | 23.1 (tokyolight) | 13 to 0 |
| Revise | never | 15.2 (kanagawadragon) | 10.3 (frappe) | 0 to 0 |
| Review | open | 6.8 (vscode-solarized-dark) | 12.7 (rosepinedawn) | 5 to 0 |
| Blocked | never | 25.5 (kanagawadragon) | 0.0 (macchiato) | 0 to 48 |
| Backburner | never | 7.2 (kanagawadragon) | 12.7 (rosepinedawn) | 2 to 0 |
| De-risk | open | 12.1 (kanagawalotus) | 17.0 (tokyolight) | 0 to 0 |
| Build | never | 6.2 (flexokilight) | 28.6 (tokyolight) | 12 to 0 |
| Idea | open | 6.2 (kanagawadragon) | 10.2 (vscode-solarized-light) | 1 to 0 |

Other users on screen: `#e2374d` is the palette's `c-crimson` (`vocab.yml:12`). No other vocab entry uses it, and no component outside `src/lib/themes/` names `--c-crimson`.

### The theme hues

The "before to after" figures are the program's `moved` lines for that theme.

| Theme | Token, file:line | Old to new | Pairs it ends, before to after | Other pairs it moves, before to after |
| --- | --- | --- | --- | --- |
| dracula | `--c-grey-d`, `rice/singles.css:111` | `#6272a4` to `#00467d` | Jobs-Push 0.0 to 10.7 (open); Jobs-Review and Jobs-Backburner 0.0 to 10.7 (collapsed-only) | Funding-Jobs 42.3 to 48.9, Jobs-Teaching 30.5 to 33.9, Jobs-Idea 21.9 to 31.6 |
| nord | `--c-blue`, `rice/singles.css:45` | `#5e81ac` to `#8493db` | Jobs-Push 6.5 to 11.5 | Push-Idea 15.7 to 11.7, Push-Blocked 24.5 to 21.6, Run-Push 25.0 to 27.3 |
| kanagawadragon | `--c-blue`, `rice/kanagawa.css:100` | `#8ba4b0` to `#b2c9d0` | Jobs-Push 7.2 to 12.9; Push-Idea 6.2 to 11.2 (collapsed-only) | Push-Revise 15.2 to 14.0, Teaching-Push 10.2 to 11.6 |
| frappe | `--c-blue`, `rice/catppuccin.css:150` | `#8caaee` to `#8cafff` | Jobs-Push 8.9 to 10.5 | Run-Push 30.3 to 31.5, Push-Blocked 23.8 to 24.5 |
| vscode-tomorrow-night-blue | `--c-blue`, `themes.css:50` (was tokens.css `:root`) | `#2563eb` to `#003abc` | Jobs-Push 8.3 to 10.6 | Push-Blocked 30.4 to 28.7, Teaching-Push 20.0 to 22.5 |
| kanagawalotus | `--c-gold`, `rice/kanagawa.css:147` | `#77713f` to `#3a4a00` | Funding-Jobs 4.9 to 10.5; Funding-Review and Funding-Backburner 4.9 to 10.5, Funding-De-risk 3.3 to 10.3 (collapsed-only) | Funding-Teaching 13.2 to 14.1, Funding-Revise 13.8 to 19.0 |
| kanagawalotus | `--c-green`, `rice/kanagawa.css:151` | `#6f894e` to `#80b16f` | Run-Review 7.9 to 12.1; Jobs-Run 7.9 to 12.1 (collapsed-only); with the gold, Funding-Run 5.7 to 14.4 | Run-Push 18.8 to 20.9, Run-Idea 19.5 to 22.4 |
| solarized | `--c-green`, `rice/singles.css:153` | `#859900` to `#859638` | Funding-Run 8.9 to 11.6 | Teaching-Run 18.6 to 13.0, Run-Push 43.4 to 35.5, Run-Review 28.5 to 22.2 |
| gruvboxlight | `--c-green`, `rice/gruvbox.css:83` | `#79740e` to `#6b7700` | Funding-Run 9.3 to 12.1 | Run-Review 11.1 to 13.1, Run-Push 22.2 to 22.0 |
| rosepinedawn | `--c-blue`, `rice/rosepine.css:159` | `#286983` to `#13568a` | Run-Push 6.9 to 12.0 | Teaching-Push 10.7 to 16.1, Jobs-Push 16.0 to 15.8, Push-Blocked 31.6 to 30.2 |
| everforest | `--c-mauve`, `rice/everforest.css:48` | `#d699b6` to `#f1acec` | Scope-Idea, which the Scope recolour alone puts at 9.6 (`M-base-crimson.txt`), stays at 15.3; Blocked-Idea 9.6 to 15.3 (collapsed-only) | Build-Idea 33.9 to 32.7, De-risk-Idea 24.4 to 29.9 |

C11 for each is quoted under "The cases after the change".

The hue's other users on screen, found with `grep -rnE --include='*.svelte' --include='*.ts' --include='*.css' -- "--c-<hue>..." src` outside `src/lib/themes/`, and in vocab through the palette hex:
- `--c-blue` (nord, kanagawadragon, frappe, rosepinedawn, vscode-tomorrow-night-blue):
  - The Push lane, the `accepted` status (`vocab.yml:112`), `pillar` (`vocab.yml:295`) and the `role` filter tone (`vocab.yml:238`).
  - `colours.ts` (20 lines: the editor's info colours, peek border, `charts.blue`, bracket 3, the merge "incoming" colours).
  - `decoration-colors.ts` (5), `problem-rows.ts:176` (the info glyph) and `terminal-marks.ts:17` (ANSI blue).
  - Every component that takes a tone (Chip, Tag, Card, MenuList and others) when the tone is blue.
- `--c-grey-d` (dracula): the Jobs band column and the `hub` filter tone (`vocab.yml:235`). No direct user. Its palette hex `#6b7280` is used by no vocab entry.
- `--c-green` (solarized, gruvboxlight, kanagawalotus):
  - The Run lane and the 18 vocab entries coloured `#16a34a` (`vocab.yml` lines 66, 74, 119, 121, 131, 134, 136, 139, 140, 152, 183, 198, 203, 210, 271, 279, 283, 310). Among them are the de-risking and published stages, the statuses running, active, doing, ongoing, awarded, granted and ready, the Submitted, Active and Ongoing band stages, `rail_color` and `data_access: open`.
  - `decoration-colors.ts` (3), `colours.ts` (2), `terminal-marks.ts` (2), and one line each in `Capacity.svelte`, `Ribbon.svelte`, `Results.svelte`, `RefactorPreview.svelte`, `ChangeCounts.svelte`, `CardSessions.svelte`, `Linkedin.svelte` and `editor/kit/theme/theme.ts:79` (`markup.inserted`).
- `--c-gold` (kanagawalotus): the Funding band column and the `in-prep` stage (`vocab.yml:68`, `#a16207`); `colours.ts:492` (bracket 1); `decoration-colors.ts` (`charts.yellow`, `terminal.ansiYellow`); `terminal-marks.ts:16` (ANSI yellow).
- `--c-mauve` (everforest): the Idea lane, its top border and its group heading (`vocab.yml:192`). No direct user.

In each changed theme, the tokens that shared the old hex keep it: for example dracula's `--c-blue`, `--c-slate`, `--c-grey` and `--c-graph-ref` stay `#6272a4`, and kanagawadragon's `--c-cyan`, `--c-sky` and `--c-graph-ref` stay `#8ba4b0` (the old-hex grep). No sentence of `docs/` or `README.md` names a changed hue. `grep -rn -i --exclude=local.yml` of every old and new hex over `docs README.md src config tests utils` finds the old hexes only in the theme sheets, in `vocab.yml`'s palette and lane rows, in tests that use them as arbitrary colours (`vocab.test.ts:60,78`, the `#2563eb` cases) and in `docs/templates.md`'s commented vocab examples (`color: "#2563eb"` at lines 375, 403, 535, 1275), none of which names a theme. The grep of the theme names beside a hue word over `docs README.md` printed nothing.

## Files

| File | Lines, base to now | Changed lines (`diff`, both sides) |
| --- | --- | --- |
| `config/catalogs/vocab.yml` | 311 to 311 | 6 |
| `src/lib/themes/derive.ts` | 320 to 326 | 16 |
| `src/lib/themes/themes.css` | 109 to 119 | 14 |
| `src/lib/themes/rice/singles.css` | 360 to 363 | 15 |
| `src/lib/themes/rice/kanagawa.css` | 181 to 184 | 11 |
| `src/lib/themes/rice/catppuccin.css` | 232 to 234 | 12 |
| `src/lib/themes/rice/gruvbox.css` | 114 to 116 | 12 |
| `src/lib/themes/rice/rosepine.css` | 184 to 186 | 12 |
| `src/lib/themes/rice/everforest.css` | 122 to 125 | 11 |
| `.scratch/migration/agents/reviews/O141-report.md` | this report | |

Every comment line in the CSS and TS files is at most 100 columns (`awk 'length($0)>100'` over themes.css, every sheet of `rice/` and `derive.ts` prints nothing). The `vocab.yml` comments are one line each.

## Judgment calls the brief left open

1. "Side by side" means direct neighbours in a row. Rows touch when their column spans overlap by more than an edge.
2. A folded Idea lane is modelled as a layout and brings no pair of its own (`0`).
3. The per-theme rule for which hue of a failing pair to change, and to what. I change the hue whose nearest passing value is closest to its old value in CIEDE2000, a passing value having every measure at 10.5 or more so that hex rounding cannot pull it under. In dracula, `--c-blue` and `--c-grey-d` have the same old value and tie at 18.1, so I changed `--c-grey-d`. It is not a status token, and `--c-blue`, `--c-slate` and `--c-grey` (all `#6272a4`) are.
4. The candidates are the theme's own-block hexes, its published palette, plus an OKLCH grid around the old value (L 0.15 to 0.97 in 0.01 steps, chroma x0.6 to x1.4, hue -20 to +20). None of the 11 picks is an own-block hex: in every listing an own-block candidate either fails a bar or is farther. So each head comment names the hue as oculus's own and gives the rule.
5. Surface tints (`amber-s`, `red-s`) are not taken as lane tones (point 3 above).
6. Scope takes crimson, the fewest-hues route among the Scope tones measured (point 2 above).
7. The Tomorrow Night Blue override sits in themes.css (point 4 above).
8. The `derive.ts` doc's last sentence, "A smaller share folds those neighbours into one colour in a theme that gives two hues near values", is not in the rewrite. No run of this step measured another `LANE_SHARE`. The doc now states only what the run measured at 0.5.
9. The head comments follow the wording O140 used ("oculus's own, chosen to read apart from ..."), extended with the rule in one sentence. A comment that changes a non-status hue (`--c-mauve`) says "every status hue of the theme". One that changes a status hue says "every other status hue" or "the theme's other status hues".
10. In `vocab.yml:181`, "a dark grey against a slate and a grey" names the tokens `grey-d`, `slate` and `grey`. In dracula `--c-grey-d` is now a dark blue, but dracula is not among the 48 themes the sentence counts.

## Host- or user-visible changes

Header surface (`-lane`), header text (`-lane-txt`) and the 3 px top border (the hue itself), before and after, from `L-tokens.txt`, `L2-tokens.txt` and `L3-txt.txt`:

| Header | Theme | Surface | Text | Top border |
| --- | --- | --- | --- | --- |
| Scope | light (default) | `#86b9c7` to `#f09ba6` | `#084758` to `#891322` | `#0e7490` to `#e2374d` |
| Scope | vscode-dark-modern | `#164957` to `#802b36` | `#23bfea` to `#f1a1ab` | `#0e7490` to `#e2374d` |
| Scope | kanagawadragon | `#546064` to `#704843` | | |
| Scope | vscode-tomorrow-night-blue | `#074c70` to `#712d4f` | | |
| Scope | kanagawalotus | `#a6b1a0` to `#dd9687` | | |
| Scope | vscode-solarized-dark | `#074f63` to `#713141` | | |
| Scope | vscode-abyss | `#074054` to `#712132` | | |
| Scope | everforest | `#89595d` (crimson, unchanged in this theme) | | |
| Jobs | dracula | `#454e6d` to `#143859` | `#bbc2d7` to `#35a6ff` | `#6272a4` to `#00467d` |
| Push | nord | `#4c617f` to `#5f6a96` | `#d6dfe9` to `#f1f3fa` | `#5e81ac` to `#8493db` |
| Push | kanagawadragon | `#546064` to `#677274` | `#d3dde1` to `#f1f5f6` | `#8ba4b0` to `#b2c9d0` |
| Push | frappe | `#5e6f9a` to `#5e71a2` | `#f6f8fd` to `#fcfdfe` | `#8caaee` to `#8cafff` |
| Push | vscode-tomorrow-night-blue | `#12439e` to `#002f86` | `#9db8f5` to `#739efe` | `#2563eb` to `#003abc` |
| Push | rosepinedawn | `#93b1bb` to `#89a8be` | `#194354` to `#0c3a5d` | `#286983` to `#13568a` |
| Funding | kanagawalotus | `#b4ae7d` to `#969b5e` | `#403e22` to `#222b00` | `#77713f` to `#3a4a00` |
| Run | kanagawalotus | `#b0ba85` to `#b9ce95` | `#394728` to `#39562e` | `#6f894e` to `#80b16f` |
| Run | solarized | `#466721` to `#46663d` | `#cbea00` to `#d3dea6` | `#859900` to `#859638` |
| Run | gruvboxlight | `#bab26a` to `#b3b463` | `#413e07` to `#3c4300` | `#79740e` to `#6b7700` |
| Idea | everforest | `#816778` to `#8f7093` | `#f9f0f4` to `#150314` | `#d699b6` to `#f1acec` |

- The Idea lane's group heading is drawn in `--c-mauve-txt`. It changes only in everforest, `#d699b6` to `#f1acec`. In the default theme and every VS Code theme the Idea lane is unchanged.
- The Scope header changes in every theme, since `c-cyan-d` and `c-crimson` resolve to tokens.css's `#0e7490` and `#e2374d` in the default theme and in the VS Code themes alike.
- Each changed theme hue also recolours the other users listed under "Each colour changed", in that theme only.
- The Settings class-word list order changes as point 4 shows.

## What in the brief was wrong or impossible

- **C5's "`diff` of `derive.ts` shows only lines 83-89".** The diff is the `LANE_SHARE` doc only, but the doc now runs over `derive.ts:83-95`. Naming 13 pairs and their themes, which item 4 asks for, takes 11 lines where the old doc had 5.
- **The cases file's C5 for themes.css.** For each theme file, C5 expects only changed hue lines and the head comment. In themes.css the changed hue is an added block of 9 lines with its own comment, because the theme it belongs to has no hand-written block anywhere.
- **The brief names O140's program for C12.** Its base path `.agents/worktrees/O140-base` no longer exists (`ENOENT` on `tokens.css`), so it cannot run as written (point 5 above).
