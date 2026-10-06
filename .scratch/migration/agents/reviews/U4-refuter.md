# Step U4 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/U4, base 1dcb9627)

Pages cited are named with their section. Findings in code keep `file:line` (paths relative to `tools/oculus`, line numbers after the change, from the worktree's tree). I changed nothing. The only git I ran was `git diff 1dcb9627` and `git status --short`, from inside the worktree. I never touched `config/local.yml`, opened no browser and used neither port 8787 nor 8790. A scratch compile of `SessionWorkspace.svelte` ran from the scratchpad directory, outside the worktree.

Summary: six of the seven items hold. Item 3 is violated in one value (the `.head` gap in `Tasks.svelte:124`, 8px where the brief says 4px). All eleven cases are met or not verifiable by a reading. The full verify list is green.

## Verification (rerun by the reviewer)

```
$ npm run diagrams            (from tools/oculus; ran to the last file, docs/diagrams/writes.svg, exit 0)
$ git status --short | grep -c docs      -> 0   (diagrams regenerate to the committed text; nothing under docs changed)

$ sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md   (from tools/oculus)
$ npm test
 Test Files  418 passed | 22 skipped (440)
      Tests  10977 passed | 618 skipped (11595)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  442 passed | 9 skipped (451)
$ npm run check
1790885077135 COMPLETED 2947 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
  done
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

The brief's greps:

```
grep -n "text-transform: uppercase\|letter-spacing" src/lib/ui/display/Ticker.svelte      -> prints nothing (exit 1)
grep -n "height: var(--header-action)" src/lib/ui/menu/MenuOpener.svelte                  -> 145:        height: var(--header-action);   (inside .opener.compact:where(:not(.primary)), line 140)
grep -rnE "(padding|margin|gap|column-gap|row-gap)[^;]*\b(9|1[0-9]|2[0-9])px|border-radius: (6|8|10|12)px" src/lib/views/boards/focus src/lib/views/sessions/session-list
  CommandCenterView.svelte:222 column-gap: 16px | Tasks.svelte:113 column-gap: 16px | CareerPanel.svelte:367 padding-left: 16px | :465 padding: 2px 8px 4px 24px | :478 padding-left: 16px | TerminalRows.svelte:225 padding-left: 12px | SessionWorkspace.svelte:303 padding-left: 12px
```

The grep 3 output is the same seven lines the report names, each with its reason. I also grepped every `radius` in both folders. Only `CareerPanel.svelte:445` (`50%`) and `SessionWorkspace.svelte:321` (`--radius-pill`) are not `--input-radius` or `--radius-sm`, and both were already like that.

Commands the report quotes as evidence:

```
npx vitest run tests/views/boards/focus.test.ts tests/views/sessions/session-list.test.ts tests/ui/primitives.test.ts tests/views/whole/type-scale.test.ts tests/ui/theme/wall.test.ts tests/views/sources/repositories/commit-box.test.ts tests/views/sessions/sessions.test.ts --reporter=dot
 Test Files  7 passed (7)
      Tests  490 passed (490)
npx vitest run tests/views/boards tests/views/sessions tests/ui tests/checks --reporter=dot   (three runs of mine, on the changed tree)
 run 1: Test Files 2 failed | 90 passed (92), Tests 2 failed | 1294 passed (1296)
 run 2: 1 failed (tests/checks/tree/scratch.test.ts, "Test timed out in 5000ms")
 run 3: 3 failed | 89 passed: tests/checks/imports/order.test.ts, tests/checks/source/keys.test.ts, tests/checks/tree/scratch.test.ts, each "Test timed out in 5000ms"
```

The failures in the scoped command are 5000 ms timeouts in `tests/checks/*` files the step does not touch. That form of the command lacks the `--testTimeout 0` of `npm run test:checks`, under which all 29 check files passed above. Per the rules file ("Verify before you report") they are not the step's and I count none as a finding. Cases 4 and 7 pass in every run.

The report's "first run on the unchanged tree" outputs (`2 failed | 5 passed`, the received string for case 7) could not be rerun, since a reviewer runs no git beyond `diff` and `status` and edits nothing. Those two failures are settled by reading the base instead (see Proof 1).

## Verdicts

Items of the brief's "What to build":

- 1: holds. `MenuOpener.svelte:140` and `:154` read `.opener.compact:where(:not(.primary))` and its `:hover`. The height (`:145`), the `--fs-lg` size (`:150`) and the chip hover (`:155-156`) sit only in those two rules. `.opener.primary` (`:177-189`) overrides every other compact property, and `:191-194` keeps the accent hover. `.acts` is a stretching grid (`CommitBox.svelte:278-283`) and `Tooltip`'s `.tip` is `inline-flex` with `.tip > *:first-child { flex: 1 1 auto }` (`Tooltip.svelte:300-314`), so the button stretches by reading. `grep -rln "<Menu" src | xargs grep -ln "\bprimary\b"` lists only `Menu.svelte` and `CommitBox.svelte`, so no other opener is affected. The `:where` choice keeps specificity at (0,2,0), which `.opener.bare` (`:160`) relies on, and `wall.test.ts` and `type-scale.test.ts` follow the selector.
- 2: holds. `Ticker.svelte:428-446` has weight 400, no `text-transform` or `letter-spacing`, `--panel` fill, `--line` border, `3px 6px`, `--fs-xs` on `calc(14px * var(--text-scale, 1))`, `--input-radius`. The hover and focus rule (`:489-493`) is as before. The classes, `title` and the reveal rules are untouched (the diff touches only `.act`'s declarations), and `tests/ui/primitives.test.ts` is not in the diff and passes.
- 3: violated, in one value. Finding Spec 1 (`Tasks.svelte:124`). Every other value of the item matches: lanes, lane head, lane card, Band, Focus, week, career panel, the radii, and `QuickAdd` (nothing above 8px, unchanged). The Spec 1 `.head` gap in `CommandCenterView.svelte:233` is a judgment call, not a mismatch.
- 4: holds. `Menu.svelte` and `MenuOpener.svelte` gain `small`, and `.opener.small` (`MenuOpener.svelte:130-134`) has the same metrics as `.tool.small` (`ToolButton.svelte:243-247`). `LaneCard.svelte:117` passes `small`, and the words and `focus.move_to` name are unchanged.
- 5: holds. `SessionWorkspace.svelte:282-309` and `TerminalRows.svelte:205-231`: an 18px title line with 3px above, a 16px details line with 3px below, and the 6px sides from `RowButton`'s `padding: 0 6px`, so 40px at scale 1. The title is `--fs-sm` and the details `--fs-xs`, both on one line with an ellipsis, and `.two` and `.meta` are `display: block` so `text-overflow` applies. A row with no age draws no span and no separator (`SessionWorkspace.svelte:154-157`). `SessionList.svelte` `.rows` has no gap. The head comment (`:2-8`) and the comment at `:263` say what the row is. The rename form has no fixed height, so the row takes the field's height. I compiled `SessionWorkspace.svelte` for the server: Svelte keeps one space between sibling spans, so the details read as words and separators with single spaces, including when the age is absent.
- 6: holds. No file under `views/sources`, `views/shared` or the Files and Repositories views is in `git diff 1dcb9627 --stat`, and `CommitBox.svelte` is unchanged. The commit dropdown is the only change reaching them, through `MenuOpener.svelte`.
- 7: holds. The type-scale rows follow every changed `font-size`. `session-list.test.ts` keeps its two-line case and its head comment, which stays true, and adds the no-age and no-model cases. `wall.test.ts:119` follows the selector, and its `:138` line stays. `DESIGN.md:369`, `:404` and `:408` carry the three changes (the diff has exactly those three hunks). `HELP.md:100` states no size and is unchanged. I grepped `lane-title`, `compact.*primary`, "two 22 px", "44 px", "ONGOING" and "bold capitals" across `src`, `tests`, `DESIGN.md`, `HELP.md` and `README.md`. No sentence is made false.

Cases of the brief's "Cases":

- 1: met, by reading. After the change only `.opener.compact:where(:not(.primary))` and its `:hover` carry the 20px height, the `--fs-lg` size and the chip hover fill, and none matches a compact primary opener. On the base tree the diff shows `.opener.compact` unconditional, so it matched. The look half is under "Declined to judge".
- 2: met. By reading, `.act` has weight 400, no `text-transform`, no `letter-spacing` and the `--panel` fill, and on the base it had 700, uppercase and `--chip` (the diff's removed lines). The `primitives.test.ts` run above passes unedited.
- 3: not verifiable by me (look). Reading: the reveal, `kept`, `gone` and `open` rules are unchanged in the diff.
- 4: met. The focus.test.ts case "draws the move menu opener as the small text button" passes in my 7-file run. On the base, `Menu.svelte` has no `small` prop and `LaneCard.svelte:117` passes none, so the class cannot be rendered. That is the first-run failure, settled by reading.
- 5: met. `focus.test.ts` passes, and `type-scale.test.ts` carries `.lane-title=fs-xs` (`:127`) and passes.
- 6: met. The `session-list.test.ts` "draws each row as two lines" case is unedited and passes.
- 7: met. The new `session-list.test.ts` case passes. On the base, the markup `<span class="sep">..</span><span>{since(entry)}</span>` drew the empty span (the diff's removed lines), which is the failing first run, settled by reading.
- 8: met. The new no-model case passes.
- 9: not verifiable by me (look). By reading: 18px + 3px margin + 16px + 3px margin is 40px at scale 1. The ellipsis chain is `.line { min-width: 0; white-space: nowrap }`, `.two { display: block; overflow: hidden; text-overflow: ellipsis }` and `.one .nm` hidden with an ellipsis. Selection ink: `.row.on .two { color: inherit }`.
- 10: not verifiable by me (look). By reading: `.lane-title` is `min-width: 0`, `.lane-name` has `overflow: hidden`, `text-overflow: ellipsis` and `white-space: nowrap`, and `.count` is `flex: none`. `.lane-body` carries only a `min-height`, so `Empty` keeps its own height. The changed lines (22, 18, 16 and 14px) are all `calc(... * var(--text-scale, 1))`.
- 11: met. The full list passes: `npm test` (the boards, sessions and ui folders) and `npm run test:checks` (the checks). The scoped four-folder command is red only on the three timeouts named above.

## 1. Spec

- `src/lib/views/boards/focus/Tasks.svelte:124` (and `CommandCenterView.svelte:233`): "`gap: 8px;`" in `.head` (it was 12px). What is wrong: brief item 3 lists, for `CommandCenterView.svelte` `.week` and `Tasks.svelte`, "padding 4px 8px, radius `--input-radius`, column-gap 16px, margin-top 4px, gaps 4px", and its premises name "gap at 124" for Tasks. The builder set the title-row gap to 8px, a departure the report's declaration table shows but its DONE row for item 3 and its limitations do not name. `CommandCenterView.svelte:233` has the same 12px to 8px change. The brief names no line for it, and 8px is a defensible nearest value under its "any other gap above 8px" sentence, so only the Tasks line is a mismatch. Failure scenario: the Tasks block's title, count and pill sit 8px apart where the brief rules 4px, so the Tasks title row is 4px wider per gap than the brief's measure when the landing look reads it against the brief. Verdict: item 3 violated, in this one value, small.

## 2. Proof

- No finding that a decision rests on. Notes:
- The report's "first run on the unchanged tree" for cases 4 and 7 (`2 failed | 5 passed`, the received string `Claude / opus-5 / (empty) / 0 files / 0 prompts`) is not something a read-only reviewer can rerun. Reading the base confirms both would fail, as items 4 and 7 above say. I did not reproduce the quoted run output itself.
- The report's case-11 narration of one run that printed `3 failed` with the third failure "not identified" is consistent with what I see on this machine under load. My three runs of that scoped command fail only in unchanged `tests/checks/*` files, by 5000 ms timeouts. The report names that as unverified, so it is stated honestly.
- The new case-4 test (`tests/views/boards/focus.test.ts:194-207`) asserts the `small` class on the server-rendered opener, so it proves the prop reaches the DOM and says nothing of the size. The brief asks for exactly this assertion, and the report names the type-scale and wall rows as audits of source text, as the rules file asks.

## 3. Standards

- `tools/oculus/.scratch/migration/agents/reviews/U4-report.md`, "Open items of the state file (verbatim ...)": the quoted item is Z180 as open, from the worktree's copy (`orchestrator-state.md:140-150` of the worktree). The main checkout's state file records Z180 as ruled by Axel, (b), in its open-items section at line 191 (I read it). What is wrong: the brief asks for the open items of the state file verbatim, and the builder's copy predates the ruling. The report says so in its next paragraph. Failure scenario: a reader taking the quoted list at face value sees Z180 as unruled and U4 built on an unruled option; the next paragraph corrects it. Low, and the orchestrator holds the live list.
- No other finding. Added comments carry no step ids, dates or history (grep of the added lines for ids and history words printed nothing). No added comment line exceeds 100 columns (the one long added line is the type-scale test's data string, which was already long). The ASCII gate is in the checks line `! LC_ALL=C grep -rna '[^ -~]' src tests`. Every file stays under the size limit (`SessionWorkspace.svelte` 338 lines, `TerminalRows.svelte` 236). No new module, so no new head comment is needed, and the changed ones are true.

## 4. Behaviour

- `LaneCard.svelte:117` (`<Menu ... small ...>`) against `Ticker.svelte:437`: "`background: var(--panel);`". The Move to opener keeps `.opener`'s `--chip` fill (`MenuOpener.svelte:113`), while the ticker's small buttons, like `ToolButton`'s `.tool.small`, are on `--panel`. Brief item 4 asks only for the metrics of the small button, so this is not a deviation. The report's "Before and after" does not say that the two small buttons on the Focus board have different fills. Failure scenario: on the Focus board a lane card's Move to button and a ticker row's buttons, both "VS Code's small text button", differ in fill, and the landing look would read that as an unstated difference unless told to expect it. Low.
- No other host-visible change is unstated. The lane head's capitals, the separators' spacing (one space in place of a 4px gap) and the terminal row's whole-line cut are in the report's tables and limitations.

## Declined to judge

- Every pixel size (22, 18, 16, 40, 26 and the card heights), the hover states, the reveal, the terminal palette (`body.rice`) dropdown height, the ellipsis in a 140px pane, the text scale at 1.5 and the first-line height of a lane card. These are the orchestrator's look at landing. I checked by reading that the declared sizes, heights and tokens are what the brief and Z180 (b) ask. The card's first line also holds `ToolButton plain` name text and 19px chips, which no reading settles.
- Whether the 19px status chip in the 18px title line of a session row overflows visibly, and where the 20px row menu sits against a title line centred at 12px. These need a look.
- Whether Files and Repositories rows, heads, fields and the root head still measure 22, 22, 26 and 28. Reading shows nothing in those views changed except the commit dropdown, and the measuring is the landing's.
- The unchanged-tree first runs of cases 4 and 7 as runs (see Proof).
- Which timeouts in `tests/checks/*` the report's third failure was. Not the step's per the rules file.

Reviewer usage: left to the orchestrator.

Reviewer usage: claude-sonnet-5-5, 211,235 tokens, 47 tool uses, 23.7 min.

## Closed

- Spec 1 (`Tasks.svelte:124` `.head` gap 8px where item 3 asks 4px): fixed at landing on main, the gap set to 4px; `CommandCenterView.svelte:233` keeps 8px, the nearest value under the brief's "any other gap above 8px" sentence, as the review judged.
- Standards 1 (the report quotes Z180 as open from the worktree's older state file): no change; the report's next paragraph says Axel ruled Z180 (b), and the landing report quotes the live open items.
- Behaviour 1 (the Move to opener on `--chip`, the ticker's small buttons on `--panel`): stated in the landing report's look, no change; item 4 asks the small button's metrics only.
