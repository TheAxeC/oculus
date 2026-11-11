# Brief check of O184 (`.scratch/migration/agents/briefs/O184.md`, oculus main at bf75b131c)

## Names

The step changes these names: the three values of `sessions.terminal_show_live_tip`, `sessions.terminal_show_live_none` and `sessions.terminal_show_transcript_tip`; the props of the two `ToolButton`s in `ShowSwitch.svelte` (it adds `compact`) and that file's head comment; the sentence at `docs/HELP.md:257`. Two greps cover them: `grep -rn --exclude=local.yml 'terminal_show_live\|terminal_show_transcript_tip\|view_transcript\|terminal_lock_tip' tests src docs config README.md`, and `grep -rn --exclude=local.yml -i 'live and transcript\|...\|the switch' src docs README.md config tests` together with `grep -rn "\bLive\b" src/lib/views/sessions src/lib/state/sessions tests/state/sessions`.

1. The three tip keys have no hit outside the write list. The only hits are `ShowSwitch.svelte:24,33` and `terminal.yml:110-112`.
2. `view_transcript` (the Transcript label, which the step keeps) is also used at `src/lib/views/sessions/session-detail/SessionDetail.svelte:55` and `config/text/views/sessions/transcript.yml:22`. The step leaves the key and its value alone, so neither hit becomes false.
3. Places that name `ShowSwitch` or the Live/Transcript switch outside the write list. Read against the change, each stays true, because none of them says the switches are text buttons or 26px:
   - `Terminal.svelte:27` ("the bar's switch (bar/ShowSwitch.svelte) sets `showing`"), `:77` and `:343-344`
   - `TerminalBar.svelte:3-4` ("the Live and Transcript switch ... (ShowSwitch.svelte, the `session` snippet)") and `:54`
   - `TranscriptBody.svelte:9,16`
   - `tab-session.svelte.ts:7,73,88`
   - `terminal-tabs.ts:79`
   - `tests/state/sessions/terminal/reading-tab.test.ts:1,6`
4. Ledger and log hits: `.scratch/migration/plan.md`, `agents/reviews/O114-report.md:125,205-206` ("`ShowSwitch` is two `ToolButton`s, since `Segment` has no disabled item"), `agents/reviews/O183-refuter.md:146`. These are records and stay true as records. O114:206 also stays true of the code.
5. The lock wording. `grep -rn "boxes and grids\|box and its grids\|box and every grid" src docs config tests README.md --exclude=local.yml` finds `docs/HELP.md:257` (in the write list), `terminal.yml:107` (the source of the new words) and `SessionTools.svelte:4` ("box and every grid of the tab read-only"). The last one agrees with the new HELP line and is not made false.

## The step line

The step line is `plan.md:1739`. Its parts map onto the brief as follows:

1. "are 26px labelled text buttons ... bar grows from 33 to 39px ... grid jumps 6px" is the premise. It is served by brief:13-14, and by brief:28 ("The grid does not move when the session links").
2. "become 20px `compact` icon buttons with their glyphs (`terminal`, `chat`)" is served by What to build 1 (brief:24).
3. "the name in the tooltip" is served by What to build 2 (brief:25).
4. "the one in force shown pressed" is served by What to build 1 ("Each keeps `active` and `pressed`") and Decision 1 (brief:65).
5. "as the font buttons beside them" is served by What to build 1. The font buttons carry no `title`, so their tooltip is the label alone (`ToolButton.svelte:53`, `TerminalFontTools.svelte:38-55`). "The name in the tooltip ... as the font buttons" could therefore mean a tooltip that is the name alone. The brief instead takes the Lock tooltip's form "Name: what it does". It records this as Decision 2 (brief:66), so the choice is not silent, but the brief should say it departs from the font buttons in this one respect.
6. "so the bar is 33px with and without them" is served by What to build 1 and brief:28.
7. "`docs/HELP.md:257` says Lock keeps 'the tab's box and its grids' ..." is served by What to build 3 (brief:26).
8. "(ruling Release v1.1.0 queue empty)" has no requirement in the brief, and needs none. The ruling (`plan.md:3740`) is the condition for releasing v1.1.0 and says nothing about what this step contains.
9. Authority for the HELP line. What to build 3 cites "ruling Look flaws". That ruling (`plan.md:3699`) only says that look flaws are booked as steps. Two rules restrict HELP.md: `agents/spec.md:72` ("No step adds to or rewrites `docs/HELP.md` ... except ... a line Axel ruled into a step's brief") and the ruling "Help redesigned" (`plan.md:3691`). What lets this step write HELP.md is Axel's (a) on open item 754, whose option text (`plan.md:1740`) says "In every option `docs/HELP.md:257` is changed to the Lock tooltip's words". The ruling line itself (`plan.md:3739`) does not mention HELP. The brief should cite `plan.md:1740` and the exception in `spec.md:72`, so that the builder and the reviewer do not read the HELP edit as a breach of either rule.

## Premises

Each premise was rerun on main at bf75b131c (`git log --oneline -3`).

1. brief:11. `sed -n 205,240p src/lib/ui/frame/Pane.svelte` shows `.viewbar` at 216-227 with `padding: 6px 12px`, `border-bottom: 1px solid var(--line)` and `align-items: center`. Holds. The brief does not mention `flex-wrap: wrap`, `gap: 6px`, `max-height: var(--viewbar-max, 50%)` or `overflow-y: auto` at 219-224; they do not change the premise.
2. brief:12. `wc -l` gives TerminalBar.svelte 131, which holds, and `Terminal.svelte:338` holds. `showSwitch` is at `Terminal.svelte:343-345` (snippet open, `<ShowSwitch .../>`, close), not 342-344 as the brief says.
3. brief:13. `wc -l` gives TerminalFontTools.svelte 55 and `.tool.compact` is at `ToolButton.svelte:170-179`; both hold. `--header-action` is at `tokens.css:198`; holds. The 33px figure comes from the O183 look (`agents/reviews/O183-landing.md:27`, "grows from 33 to 39px"); holds.
4. brief:14. ShowSwitch.svelte is 38 lines; holds. The text button is `ToolButton.svelte:136-152` (comment 136-137, rule 138-152); 153 is a blank line, which is immaterial.
5. brief:15. Every line number is one too high, as `sed -n 50,120p src/lib/ui/controls/ToolButton.svelte` shows:
   - `iconOnly` is at :52, not :53.
   - The tooltip `tip` is at :53, not :54.
   - :54 holds `named = iconOnly || cell || children !== undefined`; the brief's ":55" is wrong.
   - `aria-label={named ? label : undefined}` is at :93, not :94.
   - `class:compact={iconOnly}` is at :72, not :73.
   - `.tool.active` at 435-439 holds.
6. brief:16. `terminal.yml:79` (`terminal_glyph: terminal`) and `transcript.yml:4` (`transcript_glyph: chat`) both hold.
7. brief:17. The words at `terminal.yml:109-112` and `transcript.yml:22` hold. The brief's claim that "grep -rln of these keys over tests src docs config finds only ShowSwitch.svelte and terminal.yml" does not hold: `view_transcript` is also found at `src/lib/views/sessions/session-detail/SessionDetail.svelte:55` and `config/text/views/sessions/transcript.yml:22`. Its conclusion still holds: no test reads these keys.
8. brief:18. `terminal_lock_tip` at `terminal.yml:107` holds.
9. brief:19. `sed -n 257p docs/HELP.md` prints "- Lock this tab keeps the tab's boxes and grids from taking typing until it is unlocked, and holds after a reload."; holds. `grep -n 'Transcript\|\bLive\b' docs/HELP.md` finds only lines 45, 540 and 578, all Live HPC; holds.
10. brief:20. `grep -rln ShowSwitch tests` returns exit 1 with no output, and `grep -n 'ShowSwitch\|TerminalBar\|terminal/bar' agents/guarded.md` returns exit 1; holds. G147 (`guarded.md:439`) covers the Live/Transcript choice in state, not the component.
11. brief:5. `ls docs/adr` fails: "No such file or directory", exit 1. Holds.

## Cases and checks

1. The case-checking rule (brief:47) and the first run (brief:44) contradict the rules file. Brief:47 has every case "checked by a run the report quotes: a measurement in a browser on a scratch server from the worktree ... with the element's `getBoundingClientRect()`". `agents/spec.md:65` says "A builder runs no page: it starts no scratch oculus for a browser and drives no headless browser, whatever a brief says", and `spec.md:67` sends every behaviour that needs a DOM to the look on landing. `spec.md:3` and brief:5 make the rules file govern. As written, cases 1 to 8 (brief:34-41) can only be checked by the builder by reading the CSS chain (`compact` -> `.tool.compact` `height: var(--header-action)` -> `.viewbar` padding and line), with the look on landing named as their proof. The brief should say exactly that, and the first run of those cases on the unchanged tree should be a reading.
2. brief:61 bans every script except one the step builds, and needs Axel's approval for any other. `spec.md:66` allows a case-run program without approval. The brief is stricter than the rules file, which `spec.md:3` does not allow a brief to be. The practical effect is small, since the cases here need a page.
3. Case 3 (brief:36), "Live is drawn filled (`.tool.active`)", is false under a terminal palette with brackets on. `ToolButton.svelte:481-484` (`body.rice:where(:not(.rice-plain)) .tool.active { background: none; color: var(--accent-txt, ...) }`) draws the active button as accent text with no fill. The case states its result for one theme family without saying so.
4. Case 8 (brief:41) asks the builder to check `.viewbar`'s `flex-wrap` (Pane.svelte, unchanged) and `Toolbar`'s lack of `overflow` (`TerminalBar.svelte:82`, unchanged). These are places the step does not change. The case works as a check that nothing regressed, but the step changes neither place, and it does not test the goal.
5. Case 1 (brief:34) checks a state in which `ShowSwitch` is not drawn, so it measures only unchanged code. It is legitimate only as the reference height for case 2.
6. Case 9 (brief:42) quotes the HELP line without its leading "- ", while Verify 3 (`sed -n 257p`) prints the line with it. This is a small inconsistency the builder should be told about.
7. The Verify list (brief:88-94) leaves out `npm run diagrams`, which `spec.md:26` requires "right before each run of the list". Verify 2 uses the `grep '[^ -~]'` form and asks only for "no line the step added". `spec.md:78` says the output "must print nothing", and `spec.md:103` replaces that form with the perl gate for src, tests, bin and config. On main the brief's grep prints nothing (`LC_ALL=C grep -n '[^ -~]' ShowSwitch.svelte terminal.yml docs/HELP.md`, no output), so the weaker wording changes no outcome today.

## The question

1. Case 1 (no session, 33px) passes on the unchanged tree. It is the baseline and does not show the goal by itself.
2. Case 2 (33px after linking, grid top unchanged) cannot pass without the goal at text scale 1 in the default theme. It needs a linked agent, so the brief already sends it to the look.
3. Case 3 (the one in force filled, `aria-pressed`, 33px on Transcript): the fill and `aria-pressed` parts pass on the unchanged tree, because text buttons already take `.tool.active`. Only "the bar is still 33px" ties the case to the goal.
4. Case 4 (disabled Live's tooltip opens with "Live:") passes with the strings rewritten and the buttons still text buttons. It shows the tooltip goal, not the height goal.
5. Case 5 (hover tooltips open with "Live:" and "Transcript:") behaves the same way as case 4.
6. Case 6 (`aria-label` "Live" and "Transcript") cannot pass on the unchanged tree. A text button has no `aria-label`, because `named` is false (`ToolButton.svelte:54,93`). It would also pass with `bare` in place of `compact`. In the bar, a `bare` button takes `--bare-box`'s fallback `--tab-action`, 22px (`ToolButton.svelte:231-232`, `tokens.css:193`), making the bar 35px; case 2 catches that, case 6 alone does not.
7. Case 7 (same height at text scale 1.25) cannot pass without the goal. Before the change the bar is about 43px with the switches against 38px without, by reading the CSS (not measured).
8. Case 8 (wrapping) does not test the goal and could pass with the bar's height changing when the session links (see Implied inputs 5).
9. Case 9 (the HELP line) cannot pass without the HELP goal, since it is the exact text.
10. The check on the step's line, "the bar is 33px with and without them", taken at scale 1 in the default theme, could pass with the bar differing at another scale. Case 7 closes that gap. It could not pass with text buttons forced to 20px by new CSS, because brief:30 forbids changes to `ToolButton.svelte` and case 6 needs the icon-only path.
11. What to build 1 cannot pass without the height goal, provided nothing else in the bar is taller than `--header-action`. The title is 13px words (`TerminalTitle.svelte:93`), under 20px by reading, not measured.
12. What to build 2 cannot pass without the tooltip goal. Without it a compact button with `title` shows the old strings, which carry no name (`ToolButton.svelte:53`).
13. What to build 3 cannot pass without the HELP goal.
14. Verify 1 (`npm run test:quick`) passes without the goal: no test covers `ShowSwitch`.
15. Verify 2 (character set) passes without the goal.
16. Verify 3 (`sed -n 257p`) cannot pass without the HELP goal.
17. Verify 4 (measurements before and after) cannot pass without the goal if the measurements are taken. Under `spec.md:65` the builder cannot take them, so as written this item is either breached or left NOT DONE.
18. Verify 5 (prose read) passes without the goal.

## Implied inputs

1. A terminal palette with brackets on (`body.rice` without `rice-plain`). `ToolButton.svelte:474-479` sets `padding: 3px 4px` and `border: 0` on `.tool`. That selector outranks `.tool.compact`, but it sets no height, so the 20px height of 170-179 stands. `:481-484` draws the active button as accent text with no fill, and `:491-501` adds the brackets. This input is missing from Cases, and a wrong answer at the look costs a misjudged case 3. Expected result: the bar is 33px with and without the switches; the switches draw as the font buttons do; the one in force is in accent text with no fill; `aria-pressed` is as in case 3.
2. A terminal palette with `rice.icons` off. The glyphs then draw as text stand-ins, `terminal: "[>]"` (`config/catalogs/glyphs.yml:113`) and `chat: "(@)"` (`:29`), inside the brackets. With the words gone, the stand-ins are all that names the switches on the bar. Expected result: the same height, the stand-ins drawn as the font buttons' `[+]` and `[-]` are. Missing; worth stating for the look.
3. Keyboard focus. Tab reaches Transcript and an enabled Live. The focus ring is the 1px inset outline (`ToolButton.svelte:452-455`), and the tooltip opens on keyboard focus (`Tooltip.svelte:29-32`). A disabled Live is out of the tab order (`disabled` at `ToolButton.svelte:99`), so a keyboard reader never reaches its reason. Missing from Cases. Expected result: on keyboard focus the ring sits inside the 20px box and the tooltip opens with "Live:" or "Transcript:".
4. The tooltip of a disabled button. Case 4 says the disabled Live's tooltip opens on hover. The bubble's trigger is the wrapper span (`Tooltip.svelte:19-23`), and whether the browser hands pointer events over a `disabled` button to that wrapper is not verified. `tool-button.ts:39-41` expects the reason to be shown in `title`. The first run at the look, on the unchanged tree whose disabled Live already has "This session has no terminal to show", settles it. If it does not open there, case 4 asks for something the code has never done, and that defect should be named before the build.
5. The width at which the bar fits on one line without the switches but wraps with them. `Toolbar` wraps on its own (`Toolbar.svelte:3-4`). In that band of widths the bar gains a row, and the grid moves, the moment the session links, whatever the switch height. Missing from Cases; case 8 states no expectation for the moment of linking. Expected result: the brief should say whether that growth is accepted (it is the wrapping every bar has) so that neither the look nor the reviewer counts it against the goal.
6. Live both in force and disabled. This happens when `showing` is 'live' with no shown terminal and no terminal elsewhere (`tab-session.svelte.ts:70-76`), and Live would then draw accent-filled at half opacity. Whether the state can be reached is not verified (`choose` at :89-95 refuses to switch to Live with no terminal, but a tab that loses its terminal while on Live was not traced). Name it if it can be reached.
7. Two pressed looks on one tab. Lock in the header is `bare`, and its pressed state is `--accent-bg` (`ToolButton.svelte:245-251`). The switches are `compact`, and their active state is the full `--accent` fill (`:435-439`). Decision 1 (brief:65) takes the full fill. The report's "before and after" should name this so the look judges it.
8. The accessible description. The tooltip's hidden copy is the control's `aria-describedby` (`Tooltip.svelte:34-36`), so a screen reader reads "Live", then "Live: show the terminal ...", the name twice, as it already does for Lock. This is a judgment and needs no case.
9. Text scales other than 1 and 1.25. `--text-scale` is any number (`appearance.svelte.ts:109`). Both the switches and the font buttons read `--header-action`, so cases 1 and 7 cover the rule. Not missing.
10. The rename field in the bar (`TerminalTitle.svelte:52-53`, `RenameField`) can change the bar's height whether or not a session is linked. That is a different concern from this step's goal. Not missing.

## ADRs

1. `.agents/plan.yaml` names no `adr` folder (`grep -n 'adr' .agents/plan.yaml`, exit 1). `ls docs/adr` gives "No such file or directory", exit 1. There are no records, so the step touches none.

## Dictated text

1. brief:42, found by `grep -n "Lock this tab keeps the tab's box and its grids" .scratch/migration/agents/briefs/O184.md`: "Lock this tab keeps the tab's box and its grids from taking typing until it is unlocked, and holds after a reload." Holds against `agents/spec.md` "The working rules" (line 21: plain, ASCII, no em dash, no quips, no 'not X but Y'), "No history" (line 44: none of its words appear), and "One line per paragraph" (line 57). As a judgment, "its grids" after "the tab's box" can be read as the box's grids, but the words are the ones the step line dictates (`plan.md:1739`).
2. brief:26 (the same grep, pattern "the tab's box and its grids", finds lines 26 and 42): the phrase "the tab's box and its grids". Holds, as in 1.
3. brief:37-38, found by `grep -n '"Live:"\|"Transcript:"' .scratch/migration/agents/briefs/O184.md`: the openings "Live:" and "Transcript:" of the three tooltips. Only the opening words are dictated; the rest is described ("then what the button does"). Holds: ASCII, and inside a YAML string holding ": " they must be single-quoted, which brief:84 says.

## Declined to judge

1. Whether a disabled button inside the Tooltip wrapper opens its bubble on hover in the desktop app's Chromium. This needs a page, and this check runs none; the look settles it (Implied inputs 4).
2. The bar's measured height in any state, and the title's line height at 1.25 or under a monospace terminal palette. These need a page; the heights above come from reading the CSS.
3. Whether `tests/checks/tree/duplication.test.ts` flags the two `ToolButton` blocks of `ShowSwitch.svelte` once `compact` is added. I did not read its window rule; `npm run test:quick` settles it.
4. Whether the "Live in force and disabled" state can be reached (Implied inputs 6). I did not trace every path that removes a tab's terminal.

## Closed

- Names 1 to 5: no change needed; the places outside the paths are listed in the brief's "What is on the tree" as read and still true.
- The step line 5: What to build 2 says the switches' tooltip departs from the font buttons' (the label alone), since the switches have a sentence to say.
- The step line 9: What to build 3 cites ruling Open item 754 (`plan.md:1740`) and the exception of `agents/spec.md:72`; "What is on the tree" quotes it; the Rulings line "Open item 754" now names the HELP line.
- Premises 2, 4, 5 and 7: the line numbers and the `view_transcript` hits corrected in "What is on the tree".
- Cases and checks 1 and The question 17: the Cases section opens with `agents/spec.md:65`: every page case is checked by reading the CSS chain and the markup, the first run is that reading, and each row names the look on landing as its proof; Verify 4 says the same.
- Cases and checks 2: the script paragraph allows a case-run program as `agents/spec.md:66` does.
- Cases and checks 3 and Implied inputs 1, 2: a case for a terminal palette with brackets (accent text, no fill) and one with icons off (the stand-ins); Decision 1 names both looks.
- Cases and checks 4 and Implied inputs 5: the wrapping case removed; "What to build" states that a bar gaining a line by wrapping when the session links is accepted.
- Cases and checks 5: the first case says it is the reference height.
- Cases and checks 6: the last case and Verify 3 quote the line with its leading "- ".
- Cases and checks 7: Verify 1 runs `npm run diagrams` before `npm run test:quick`; Verify 2 is the perl gate of `agents/spec.md:103`, which prints nothing.
- Implied inputs 3: the hover case covers keyboard focus, the ring inside the 20px box, and a disabled Live out of the tab order.
- Implied inputs 4: the disabled case says the bubble over a disabled button is seen at the look on the unchanged tree first, and booked as a look flaw if it never opened.
- Implied inputs 6: a case asks the builder to read `tab-session.svelte.ts:70-95` and say whether Live can be in force and disabled.
- Implied inputs 7: Decision 1 names Lock's `--accent-bg` beside the switches' full fill, for the look.
- Implied inputs 8 to 10, ADRs, Dictated text: no change needed.

Usage: aa2f320938434f843, claude-opus-5-5, 150981 tokens, 44 tool uses, 398 s.
