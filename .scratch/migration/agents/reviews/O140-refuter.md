O140 review report (reviewer, read-only; nothing in the worktree changed: `git status --short` after every run lists the same nine modified files and the untracked report)

## Verification lines (brief, "Verify before you report"), run from the worktree root

1. `npx vitest run tests/checks/look/contrast.test.ts tests/server/root/hooks-server.test.ts tests/server/desktop/window-guard.test.ts tests/server/desktop/app-theme-start.test.ts tests/data/sources/config/layers/hub-vocab.test.ts tests/data/shapes/catalog-files/vocab.test.ts tests/checks/config/config-folder.test.ts --reporter=dot`
```
 Test Files  7 passed (7)
      Tests  210 passed | 2 skipped (212)
```
2. `npm run diagrams` (it rewrote no tracked file: `git status --short` afterwards lists the same nine files), then `npm run test:quick`:
```
ok      prettier (0.7 s): All matched files use Prettier code style!
ok      ASCII gate (0.8 s)
ok      svelte-kit sync (2.6 s)
ok      svelte-check (8.1 s): 1793744855736 COMPLETED 581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (23.1 s): Duration  13.26s (transform 1.63s, setup 0ms, import 3.07s, tests 10.06s, environment 0ms)
ok      vitest checks (42.1 s): Duration  32.01s (transform 12.62s, setup 0ms, import 26.84s, tests 46.46s, environment 2ms)
test:quick: 44.8 s; every command passed
```
(I ran `test:quick` twice in this review. The second run's output was thrown away.)
3. `LC_ALL=C perl -ne 'print "$ARGV:$.: $_" if /[^\x20-\x7E\n]/; close ARGV if eof' config/catalogs/vocab.yml src/lib/themes/rice/*.css` printed nothing (`perl exit 0`). The full gate from the rules file (`find src tests bin config ...`) also printed nothing (`find: bin: No such file or directory`, `ascii gate exit 0`).
4. `python3 -c "import yaml; yaml.safe_load(open('config/catalogs/vocab.yml'))"`: `yaml exit 0`.
5. Case-run program. I extracted it from report lines 79-267 into `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o140-reviewer/case-run.mts`. `diff` against the builder's `.../scratchpad/o140-builder/case-run.mts` printed `SAME`. Run as `npx tsx <that path>`, its 280-line output is byte-identical to the builder's `run-final.txt` (`diff` printed nothing). Key lines:
```
C1 statuses.interview.color #7c3aed; position_stages Interview #7c3aed
C2 49 themes; 23 themes hold one; 89 measures under 10; 49 pairs under 10
C1 statuses.interview.color #ec4899; position_stages Interview #ec4899
C2 49 themes; 0 themes hold one; 0 measures under 10; 0 pairs under 10
themes whose pink or teal changed: 23
C3 1265 lane pairs read; 0 at 10 or more on the base and under 10 after
8 pairs under 10 in some theme on the base are at 10 or more in every theme after
```

Other commands the report quotes, rerun:
- `sh utils/unused-exports.sh` compared with `O140-base/unused-exports.txt`: no difference.
- The history-word grep over `git diff -U0 3680ded21` printed nothing (exit 1).
- `awk 'length($0)>100{print FILENAME": "FNR}' src/lib/themes/rice/*.css` printed nothing.
- The 31-tones python read printed `31`.
- `grep -n -- '--c-pink:\|--c-teal:' tokens.css themes.css` printed only `tokens.css:40` and `:48`. `grep -c` over `vscode.css` printed `0`.
- The `7c3aed` grep gave the hits the report lists.
- `sed -n 164,170p .scratch/migration/orchestrator-state.md` shows an empty open-items list.
- `diff` of `vocab.yml` against the base copy shows only `155c155` and `205c205`.
- The Carbon values: WebFetch of `https://unpkg.com/@carbon/colors@11.20.0/lib/index.js` quotes `var teal50 = '#009d9a';` and `var magenta30 = '#ffafd2';`, and also `teal40 = '#08bdba'` and `magenta40 = '#ff7eb6'`, which are Oxocarbon's own.
- Flexoki's README (WebFetch) lists red, orange, yellow, green, cyan, blue, purple and magenta. It has no teal.

## Item verdicts

1. holds. `diff` shows lines 155 and 205 only, `#7c3aed` changed to `#ec4899`, with the keys and alignment kept. `flagship` (:301) keeps `#7c3aed`.
2. violated, finding S1. The measured bars hold: C2 prints 0 pairs, C3 prints 0 pairs dropped under 10, and the "authored tokens that differ" section lists only 31 `--c-pink` and `--c-teal` rows. The tone requirement is not met for Gruvbox Light's teal, and the brief's hand-back clause was not followed for that block.
3. holds. All eight head comments name their added hues correctly against the diff. The Oxocarbon claims (teal 50 `#009d9a`, magenta 30 `#ffafd2`) and "Flexoki has no teal" are confirmed by the fetches above. Each comment is filled greedily at 100 columns. Checked line by line: no line ends short where the next word would fit. The one short-looking line, `singles.css:11` (66 columns), cannot take `config/defaults/appearance.yml. */` without reaching 101. A minor wording point is noted under Standards.
4. holds. The program runs with `npx tsx` from the worktree root and writes no file of the worktree. It prints C2 and C3 before and after, and the report quotes its source and both runs. The builder's scratch folder holds no other program (`ls .../o140-builder`: `case-run.mts` and its run outputs only).

## Case verdicts

- C1 met. On the worktree, `yaml.safe_load` gives `statuses.interview.color #ec4899` and `position_stages Interview ['#ec4899']`. `git show 3680ded21:config/catalogs/vocab.yml` gives `#7c3aed` for both.
- C2 met. `0 pairs under 10` after. On the base it prints 49 pairs, with pink in 14 blocks and teal in 17, the brief's 31 blocks.
- C3 met. `C3 1265 lane pairs read; 0 at 10 or more on the base and under 10 after`.
- C4 met. In the full `git diff 3680ded21`, every hunk of the eight CSS files is either the head comment or a single `--c-pink:` or `--c-teal:` line of a listed block.
- C5 met. `contrast.test.ts` passes in verify 1 (7 of 7 files) and in `test:quick`.

## Spec

- S1 (makes item 2 violated). Gruvbox Light's teal is outside the theme's tone, and the block was written instead of handed back. Place: `src/lib/themes/rice/gruvbox.css:84`.
  ```
  -    --c-teal: #427b58;
  +    --c-teal: #2cb6ae;
  ```
  - What is wrong: item 2 asks for "darker on a light one, and close to the theme's own hues". The new teal has OKLCH L 70.5, but the theme's status hues span L 43.7-61.8 (report line 498) and the teal it replaces is L 53.4. The new value is lighter than every other status hue of a light theme.
  - The brief (line 47) says: "If a block cannot meet item 2's bars together, hand it back with the run before writing it: do not loosen a bar." The builder wrote the value and left the tone question to the look as judgment call 4.
  - My probe (`.../o140-reviewer/probe.mts`, a read-only grid search through `parseBlocks`, `resolveTheme` and `deriveTokens` with the same bars) confirms the conflict is real:
    - At L 40-62 and C 0.08-0.20 (the theme's chroma range), with hue 150-220, one candidate passes, `#005725` (h 150, a green, not a teal).
    - The darkest passing teal is at L 67 (`#22aba2`, smallest status distance 10.9).
  - So no teal in the theme's tone meets the measured bars. Deciding that is a ruling, which the brief kept from the builder.
  - Failure scenario: in Gruvbox Light, an offered application's chip edge, the Focus Offered stack edge, the Build lane, the Teaching column and the Tasks edge are drawn in a bright turquoise that belongs to no other Gruvbox Light hue. The landing look then judges a value the brief said should come back first.
  - Options for the orchestrator or the user:
    - accept a light teal (L 67 is the darkest that passes);
    - rule that the teal-lane against blue-lane pair (Push against Teaching, which touch only in a collapsed layout) may stay at its base value instead of the bar.
- S2 (premise not reproduced). The brief's list of "Other users of the two tokens" (brief line 13) is incomplete for teal. `grep -rn "c-pink\|c-teal\|'pink'\|'teal'\|: pink\|: teal" src config` and `grep -rn -i 0d9488 config` also hit:
  - `vocab.yml:75` (the project stage `released`, `#0d9488`);
  - `:275` (the category `released`);
  - `:302` (the venue tier `strong`);
  - `src/lib/ui/display/hues.ts:10`, `HUES` with teal, read by `Calendar.svelte:48`/`:172` and by `graph/Lanes.svelte:37` (`var(--c-${HUES[...]}-txt)`);
  - `src/lib/ui/controls/editor/kit/theme/colours.ts:521-523` (merge editor current header, content and overview ruler);
  - `src/lib/state/feeds/inbox.ts:67` (info items);
  - `src/lib/state/system/machine/recover-words.ts:139`;
  - `src/lib/views/shared/sessions/sections/TimelineTurns.svelte:41` (tool turns).

  For pink, the list is complete (career profiles and the `form` facet only). Failure scenario: the look on landing checks only the listed views, so a teal change in the calendar, the git graph, the merge editor, the Venues tier chips or a released project's stage chip goes unseen. The consequence is B2.

## Proof

- P1. Two comments are called "still true" on evidence that cannot show it. In the report's "Re-read" section, lines 728-729, `derive.ts:83-89` (`LANE_SHARE`) and the `focus_lanes` sentence at `vocab.yml:181` ("a lane's colour differs by a CIEDE2000 of 10 or more, under every theme, from the header drawn next to it ...") are called "still true (C3)".
  - C3 only shows that no pair with teal or pink on one side dropped under 10. It does not show the sentence true.
  - On the base the sentence was false at 49 themes. The case-run output's lane rows show `kanagawadragon teal-lane: ... grey-d 6.5>13.0` and `kanagawalotus teal-lane: ... grey-d 7.2>12.8`. Jobs (`grey-d`) and Teaching (`teal`) sit side by side on the open board (`Band.svelte:165-185` draws Funding, Jobs, Teaching in that order).
  - After the change, every open-board pair with teal holds. Teal against grey, grey-d and mauve is under 10 in 0 themes after, and teal against amber was never under 10. Pairs with neither teal nor pink were not measured.
  - Failure scenario: the orchestrator books both comments as verified over 49 themes, when the step made them true for teal pairs only and nobody measured the rest.
- P2. Judgment call 5 (report line 711) keeps Carbon teal 50 because "a lighter oculus teal, `#2fd3a6`, took the teal lane from 16.6 to 8.9 against the green lane, which breaks C3".
  - Only one candidate was tried. My probe finds 435 passing Oxocarbon teals at L 67-85, C 0.10 or more, hue 165-205, for example `#45a992` (L 67, C 0.10, smallest status distance 15.5).
  - Carbon's own teal 50 is still a valid reason under item 3, since it is a hue taken from the system Oxocarbon is drawn from. But the stated reason, that lighter teals are blocked, is false.
  - Failure scenario: a ruling on Oxocarbon's dark teal (L 62.9, below the theme's 66.9-83.2) is made on the belief that no lighter teal passes.

## Standards

- One low-severity wording point at `src/lib/themes/rice/singles.css:5-7`: "it has no yellow or orange, so the warning hues are IBM Carbon's yellow 30 and orange 40 (@carbon/colors, Apache-2.0), the system it is drawn from, and its teal and pink are Carbon's teal 50 and magenta 30, which read apart from its cyan and red."
  - The "so" clause now also governs the teal and pink, so the sentence reads as if they were taken because Oxocarbon lacks yellow and orange.
  - Oxocarbon does have a teal and a pink (`#08bdba` and `#ff7eb6`, Carbon teal 40 and magenta 40).
  - Failure scenario: a maintainer reading the head comment believes Oxocarbon has no teal or pink of its own and does not see that its own ones were replaced.
- Otherwise none:
  - no non-ASCII;
  - no history words (grep above);
  - every head comment filled at 100 columns;
  - no document names the interview or offered colour (`grep -rn -i interview` over `src config docs` finds only the vocab lines and status-word lists);
  - no test pins an old value (`grep -rn interview tests` is empty, and the `#0d9488` hits in tests are fixtures with their own colours).

The `focus_lanes` comment's named examples are still true, since the step changed no red, mauve, grey, gold or amber:
- "Build and Teaching, which share teal in every theme";
- "Backburner and Jobs, which share a grey";
- "Funding and Revise, gold against amber";
- "Blocked above the Idea lane in mocha and everforest".

For its count, see "Declined to judge".

## Behaviour

- B1. The report's before and after (line 721) says the Interview stack's "block (its label and its edge, `Band.svelte:147`, `:254`) moves from purple to pink". Only the edge does. `Band.svelte:147` sets `--stage`, `:254` draws `border-left: 3px solid var(--stage, var(--line))`, and the label `.stage` is drawn in `color: var(--muted-txt, var(--muted))` (`Band.svelte` `.stage` rule). Failure scenario: at the look, the orchestrator expects a pink "INTERVIEW" label, finds a muted one, and books a false defect, or doubts the step.
- B2. Host-visible changes in the 17 teal blocks that the report does not state (see S2):
  - the `released` stage chip and category;
  - the `strong` venue tier chip;
  - the calendar and git-graph colours that cycle through `HUES`;
  - the merge editor's current-side header, content and overview-ruler colours;
  - inbox info items, the recover view's "present" state and the session timeline's tool turns.

  Each has the old and the new teal of the report's table as before and after. Failure scenario: a user on Rose Pine or Dracula sees the merge editor's current side, or a released project's chip, change colour, and no booking explains it.

## Tone of the new hues (item 2), judged from the case-run's OKLCH lines and the probe

Most new values sit inside their theme's status-hue L and C ranges, lighter on dark grounds and darker on light ones:
- dark themes: gruvbox, nord, kanagawa, kanagawadragon, rosepine, rosepinemoon, onedark, dracula, synthwave, macchiato, frappe, solarized;
- light themes: rosepinedawn, kanagawalotus, flexokilight.

Several teals lean green (everforest h 158.8, flexokilight 161.5, solarized 165.5, flexoki 168.1, kanagawalotus 170.1, against about 182 for the default `#0d9488`). In those themes cyan already holds the h 185-190 band, so the jade side is the only room. I judge them acceptable teals.

The outliers the builder lists:
- Gruvbox Light teal `#2cb6ae`: does not hold (S1). The bars force it, so the decision is the user's or the orchestrator's.
- Gruvbox Light pink `#c22d62` (C 0.187 against a maximum of 0.179): holds. It is 0.008 over the range; in-range passing pinks exist (`#a83f5c`, C 0.14), but the difference is negligible.
- Tokyo Light pink `#a83a8f` (C 0.173 against a maximum of 0.140, L 53.4): holds, marginally. The probe finds no passing pink at L 48-54 with C 0.12-0.14. In-range chroma passes only near L 40, below the theme's L range, so any choice is an outlier on one axis. The pink it replaces was C 0.180.
- Everforest pink `#ffc0cf` (L 86.9 against a range of 70.9-80.8): holds. The probe finds no passing pink inside the theme's L range with C 0.128 or less at h 340-10. It is light on a dark ground and its chroma is in range.

Outliers the builder does not list, both judged to hold:
- Everforest Light pink `#ab3560` (L 51.4 against a range of 63.4-74.7) is darker than every other status hue. That matches "darker on a light one", and its chroma is in range.
- Flexoki teal (L 76.6 against a maximum of 73.5) and Oxocarbon pink (L 84.0 against 83.2) are slightly over the range on the light side, on dark grounds.

Oxocarbon teal `#009d9a` (L 62.9 against a range of 66.9-83.2): holds as a hue from the source system. See P2.

## Declined to judge

- The count "ten of the pairs that touch only in such a layout" (`vocab.yml:181`). It needs the collapsed-layout enumeration over 49 themes, which is not on the tree: the only enumeration is the 17-theme one in `agents/reviews/Q41-report.md:730-739`, and its scripts are absent. One pair bears on it: Funding against Teaching (gold against teal), which touches only when Jobs is hidden, went from 9.6 in kanagawalotus on the base to 13.2. If the count was taken over 49 themes, it has dropped. The open-board failures on the base (P1) suggest it was not taken over 49 themes. A rerun of that enumeration settles it. The line is outside the write list.
- The rest of the open-board sentence for pairs with neither teal nor pink. That is outside the step.
- How the colours look on screen. That is for the look on landing, in a page.
- Whether Gruvbox Light's light teal is acceptable. That is the user's or the orchestrator's call (S1).

Reviewer usage: ada1bd113ba2a7360, claude-opus-5-5, 216228 tokens, 57 tool uses, 12 min 14 s.
