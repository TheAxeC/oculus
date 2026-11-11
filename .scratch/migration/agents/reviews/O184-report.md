# O184 report: a terminal tab's bar keeps its height when its session links

Everything in the brief is done.

## Open items of the state file

None. `sed -n 177,189p .scratch/migration/orchestrator-state.md` prints the heading "## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)", eight empty lines (178-185), then the paragraph "An entry leaves this list for the closed log the moment Axel rules on it. ..." and no entry.

## The cases' first run (unchanged tree at 5d293bf5a, by reading)

No case is one the brief's rules get wrong. Each case needs a page, so each was run by reading the CSS chain and the markup (`agents/spec.md:65`); the look on landing is the proof of each, named in the result table below.

1. A Terminal tab running a shell with no session: 33px at text scale 1. Reading: `Terminal.svelte:338` passes `session={session.target === null ? undefined : showSwitch}`, so with no session the bar holds the title and `TerminalFontTools`; the three font buttons are `compact` with a glyph (`TerminalFontTools.svelte:38-55`), so `iconOnly` (`ToolButton.svelte:52`) puts `class:compact` on them (`:72`) and `.tool.compact` sets `height: var(--header-action)` (`:170-179`), `calc(20px * var(--text-scale, 1))` (`tokens.css:198`). The `.viewbar` adds `padding: 6px 12px` and `border-bottom: 1px solid var(--line)` (`Pane.svelte:216-227`). 6 + 20 + 6 + 1 = 33. Holds on the unchanged tree.
2. The same tab after an agent's session links: the bar stays 33px. Reading: `ShowSwitch.svelte:22-38` passes no `compact`, so `iconOnly` is false and each switch is the text button `.tool` (`ToolButton.svelte:138-152`): a 16px line (`--button-line: 16px`, `tokens.css:267`), `padding: 4px 8px`, a 1px border, 26px. The bar is 6 + 26 + 6 + 1 = 39px and the grid moves down 6px. Fails on the unchanged tree; this is the defect the step fixes.
3. Live in force, default theme: Live filled, `aria-pressed="true"`, Transcript not; Transcript in force the other way, bar 33px. Reading: `active={!reading}` and `pressed={!reading}` on Live, `active={reading}` and `pressed={reading}` on Transcript (`ShowSwitch.svelte:26-27,35-36`); `.tool.active` fills with `--accent` (`ToolButton.svelte:435-439`), `aria-pressed={pressed}` (`:91`). The fill and the attribute hold on the unchanged tree; the height part fails (26px, case 2).
4. Live in force under a terminal palette with brackets on. Reading: `:global(body.rice:where(:not(.rice-plain))) .tool` sets `border: 0`, `background: none`, `padding: 3px 4px` (`ToolButton.svelte:474-479`) and the brackets are drawn on every `.tool` but rail, bare, status, cell and plain (`:491-501`), so the switches and the font buttons are both bracketed; `.tool.active` there is `background: none` and accent text (`:481-484`). The unchanged switches are 16 + 3 + 3 = 22px against the font buttons' 20px (`.tool.compact` keeps `height` and `box-sizing: border-box`; the palette rule sets only padding), so the bar is 35px with the switches and 33px without. The look and `aria-pressed` hold; the height fails on the unchanged tree.
5. A terminal palette with icons off: the stand-ins `[>]` (`config/catalogs/glyphs.yml:113`) and `(@)` (`:29`) draw as text, as the font buttons' do; `Glyph.svelte:101` gives a stand-in a `3ch` box under `body.rice`. On the unchanged tree each switch draws the stand-in and its word at the text button's height (26px with brackets off, 22px with them on), so the height fails; the stand-ins hold.
6. Live with no terminal to show (`live` false): `disabled={!live}` (`ShowSwitch.svelte:28`) sets `disabled` (`ToolButton.svelte:99`) and `.tool:disabled` draws it at `opacity: 0.5` (`:212-215`); the title is `t('sessions.terminal_show_live_none')`, "This session has no terminal to show" (`terminal.yml:111`), which does not open with "Live:". Fails on the unchanged tree. Whether the bubble opens over a disabled button is for the look on the unchanged tree first: the bubble opens on the Tooltip wrapper's pointer events (`Tooltip.svelte:144-151,309`), and whether the browser delivers those over a disabled button is not verified here.
7. Hover and keyboard focus on Live and Transcript: the tooltip text is `title` (`ToolButton.svelte:53`), "Show the terminal this session runs in" and "Read the turns of this session" (`terminal.yml:110,112`), neither opening with the name. Fails on the unchanged tree. The focus ring is `outline: 1px solid var(--accent); outline-offset: -1px` (`:452-455`), inside the 26px box there. A disabled Live carries the native `disabled` attribute (`:99`), so it is out of the tab order.
8. A screen reader's name: `named` is `iconOnly || cell || children !== undefined` (`ToolButton.svelte:54`), false for the unchanged switches, so `aria-label` is not set (`:93`); the name comes from the label's text in `<span class="label">` (`:121`). The case's `aria-label` of "Live" and "Transcript" fails on the unchanged tree, as the brief says.
9. Text scale 1.25: `--header-action` is `20px * 1.25 = 25px` for the font buttons; the unchanged switches are `16px * 1.25` (`ToolButton.svelte:148`) + 8 + 2 = 30px, so the bar grows by 5px when the session links. Fails on the unchanged tree. `--text-scale` is set on the document element (`src/lib/shell/window/appearance.svelte.ts:109`), so the `:root` token resolves with the scale.
10. Live in force and disabled at once. Reading of `src/lib/views/sessions/terminal/transcript/tab-session.svelte.ts:30-95`: it needs `reading` false (`tab.showing === 'live'`, `:71`), `target !== null` and `live` false (`tab.shown === null && elsewhere === null`, `:75`). With `tab.shown` null, `running` is null (`sessionOfTerminal(null)` finds no terminal, `open-session.ts:134-137`), so `target` is non-null only when `tab.transcript` is set (`tab-session.svelte.ts:33-35`). Every write that sets `transcript` also sets or keeps `showing: 'transcript'`: `open-session.ts:79`, and `closeEnded` sets it only for a tab that was on Transcript (`terminal-lists.ts:109-113`). `choose('live')` on a tab with no terminal of its own never restates the tab (`tab-session.svelte.ts:90-93`). A terminal that joins a tab clears `transcript` through `liveTab` (`terminal-lists.ts:154`, `terminals.svelte.ts:415,663`), and `showIn` never picks a tab with a transcript (`pageTarget`, `terminal-tabs.ts:431`). So no action in the app reaches the state. The one way in is a saved tab state whose `showing` fails its parse and falls back to `'live'` (`terminal-tabs.ts:140`) while its `transcript` parses. If reached, Live carries `.tool.active` and `:disabled`: the in-force look at half opacity, `aria-pressed="true"`. No look state is named, since no action shows it.
11. `sed -n 257p docs/HELP.md` printed "- Lock this tab keeps the tab's boxes and grids from taking typing until it is unlocked, and holds after a reload." Fails on the unchanged tree.

## Result table

| Item | State | Proof |
| --- | --- | --- |
| 1. Live and Transcript are `compact` icon buttons with their glyphs, `active`, `pressed`, `disabled={!live}` and `label` kept | DONE | `git diff src/lib/views/sessions/terminal/bar/ShowSwitch.svelte`: `+    compact` after `glyph={t('sessions.terminal_glyph')}` and after `glyph={t('sessions.transcript_glyph')}`; the other props unchanged |
| 1. Head comment says what the two buttons are | DONE | `sed -n 2,7p` of the file: "Each is an icon button as high as the font buttons beside them, so the two add no height to the bar's line when a session links. The name is the button's accessible name and begins its tooltip, ahead of what the button does, and the one in force is drawn pressed." (the word "begins", in place of "opens", fixed at landing) |
| 2. The three tips in the Lock tooltip's form, keys kept | DONE | `git diff config/text/views/sessions/terminal.yml`: `terminal_show_live_tip: 'Live: show the terminal this session runs in'`, `terminal_show_live_none: 'Live: this session has no terminal to show'`, `terminal_show_transcript_tip: 'Transcript: read the turns of this session'` |
| 3. HELP.md line 257 | DONE | `sed -n 257p docs/HELP.md`: "- Lock this tab keeps the tab's box and its grids from taking typing until it is unlocked, and holds after a reload." |
| Verify 1: `npm run diagrams && npm run test:quick`, run once | DONE | last line "test:quick: 77.5 s; every command passed" (lines quoted below) |
| Verify 2: ASCII gate over the three files | DONE | the perl command printed nothing, `echo "exit $?"` printed "exit 0"; `LC_ALL=C grep -n '[^ -~]'` over the three files printed nothing, exit 1 |
| Verify 3: HELP line | DONE | as item 3 |
| Verify 4: each case before and after | DONE | the first run above; after the change below |
| Verify 5: new sentences against the prose rules | DONE | below |
| Unused exports | DONE | `sh utils/unused-exports.sh > .agents/scratch/unused.txt` (exit 0), `diff` against `O184-base/unused-exports.txt`: no output, exit 0; no line added |
| History words in the changed comment | DONE | `sed -n 2,7p ShowSwitch.svelte \| grep -niE "before\|used to\|no longer\|still\|always has been\|always had\|as before\|previously\|the step adds\|after this package lands"`: no hit, exit 1 |

The list's output (`env -u TMPDIR npm run test:quick`, after `npm run diagrams`):

```
test:quick: 3 changed file(s), from git since HEAD
test:quick: 13 test file(s)
ok      prettier (1.0 s): All matched files use Prettier code style!
ok      ASCII gate (1.1 s)
ok      svelte-kit sync (3.0 s)
ok      eslint (16.4 s)
ok      vitest (46.7 s): Duration  25.85s (transform 18.36s, setup 0ms, import 24.93s, tests 625ms, environment 0ms)
ok      svelte-check (53.5 s): 1794388326664 COMPLETED 592 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (74.3 s): Duration  53.62s (transform 33.40s, setup 0ms, import 63.20s, tests 119.33s, environment 4ms)
test:quick: 77.5 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source, tests/checks/tree and
            tests/checks/imports, which run for any change under src, tests or
            utils; the build, the lint of unchanged files
```

The list ran once; `npm run diagrams` ran once, right before it, and changed no tracked file (`git status --short` lists only the three changed files). No whole-suite command and no single test file was run. The step adds or changes no test: no entry of `agents/guarded.md` covers the bar (`grep -n 'ShowSwitch\|terminal_show\|TerminalBar' .scratch/migration/agents/guarded.md` finds nothing; G147 at line 439 covers the choice in state, unchanged).

### The cases after the change, by reading; the proof of each is the look on landing

The look: a Terminal tab, measured with the switches absent and present, in the default theme and under a terminal palette with brackets on and with icons off, at text scale 1 and 1.25.

1. No session: 33px, unchanged (no file of that path changed).
2. Session links: each switch now has `compact` and a glyph, so `.tool.compact` gives it `height: var(--header-action)`, 20px, the font buttons' height; the bar stays 33px and the grid's top edge does not move. Look: a shell tab, then start an agent in it (or open a session's terminal), and measure the bar before and after the switches appear.
3. Live in force, default theme: `.tool.compact` sets `background: none` (`ToolButton.svelte:177`) and `.tool.active` sets `background: var(--accent)` (`:437`) at the same specificity and later in the file, so Live is filled with the accent and `--on-accent` text; `aria-pressed="true"`; Transcript unfilled, `aria-pressed="false"`. The hover fill `.tool.compact:not(.active):hover` (`:181`) skips the one in force. Transcript in force: the other way round, bar 33px. Look: a session's tab on Live, then on Transcript.
4. Terminal palette, brackets on: both switches are bracketed as the font buttons are, 20px high (the palette's `padding: 3px 4px` inside the fixed `height`); the one in force in accent text with no fill (`:481-484`). Bar 33px with and without the switches. Look: a terminal palette with brackets on, Live in force.
5. Terminal palette, icons off: `[>]` and `(@)` in a `3ch` box inside the 20px button, as the font buttons' stand-ins; same height. Look: a terminal palette with icons off.
6. Live with no terminal: half opacity; title "Live: this session has no terminal to show". Look: a tab on Transcript whose session has no terminal (a session opened from the sessions list after its terminal ended); first whether the bubble opens over the disabled Live on the unchanged tree.
7. Hover and focus: "Live: show the terminal this session runs in" and "Transcript: read the turns of this session"; the 1px inset ring inside the 20px box; a disabled Live out of the tab order. Look: hover and Tab to each.
8. Screen reader's name: `iconOnly` is true, so `named` is true and `aria-label` is "Live" and "Transcript" (`ToolButton.svelte:52,54,93`); the label is no longer drawn as words (`:117`). Look: the accessibility tree of each button.
9. Text scale 1.25: both the switches and the font buttons are `--header-action`, 25px; the bar is the same height with and without the switches. Look: text scale 1.25, a session's tab.
10. Live in force and disabled: unreachable through the app (first run, case 10); if a saved state brings it, Live is the accent fill at half opacity with `aria-pressed="true"`. No look state.
11. `sed -n 257p docs/HELP.md` prints "- Lock this tab keeps the tab's box and its grids from taking typing until it is unlocked, and holds after a reload."

## Files

From `git diff --numstat` (the base copy holds only `unused-exports.txt`, so the worktree's diff against its HEAD 5d293bf5a is the file list):

| File | Added | Removed | Lines now | On the write list |
| --- | --- | --- | --- | --- |
| `src/lib/views/sessions/terminal/bar/ShowSwitch.svelte` | 7 | 2 | 43 | yes |
| `config/text/views/sessions/terminal.yml` | 3 | 3 | 133 | yes, lines 110-112 only |
| `docs/HELP.md` | 1 | 1 | 639 | yes, line 257 only |
| `.scratch/migration/agents/reviews/O184-report.md` | new | | | yes |

No scratch file is left: `.agents/scratch/` was made for the unused-exports output and removed (`ls .agents` prints `plan.yaml`). No script was written; every edit was made with the Edit tool.

## Judgment calls the brief left open

1. The tip after the colon starts lowercase ("Live: show ...", "Transcript: read ...", "Live: this session ..."), as the Lock tooltip does ("Lock this tab: its box ..."). The orchestrator may reverse it.
2. The head comment says the two "add no height to the bar's line" rather than "the bar is 33px", so it stays true at every text scale and under the accepted wrap, where the bar gains a line.
3. Case 10 is reported as not reachable through the app, with the one way in (a saved state whose `showing` fails its parse) named.

## Prose of the new sentences (verify 5)

- The three tips and the HELP line: ASCII, no dash, no ellipsis; each states what the button or Lock does. The tips keep the earlier wording of what each button does, which matches the code: Live shows the session's terminal (`tab-session.svelte.ts:89-95`, which shows it here or in the tab that owns it), Transcript draws the session's turns. The HELP line's claims hold: Lock makes the box and the grids read-only (`SessionTools.svelte:4`, `tab-session.svelte.ts:83-86`) and `locked` is part of the saved tab state (`terminal-tabs.ts` `savedTabShape`, `locked: z.boolean()`).
- The head comment: ASCII, lines of 98, 95, 93, 97, 99 and 88 columns (`awk '{print length}'`), so it is rewrapped as one paragraph at 100 columns; `comment-width.test.ts` and `history.test.ts` passed in the list. The closing sentence "Each is a ToolButton of its own rather than a Segment, since ..." is kept from the unchanged comment and is still true: `SegmentItem` is `{ id; label; glyph? }` with no disabled flag (`segment-items.ts:5`).

## Host- or user-visible changes, before and after

| What | Before | After |
| --- | --- | --- |
| Live and Transcript on a Terminal tab's bar | text buttons with glyph and word, 26px high (22px under a terminal palette with brackets, 30px at text scale 1.25), bordered | icon buttons with glyph only, 20px (25px at 1.25), no border, as the font buttons |
| Bar height when a session links | 33px to 39px, the grid moving 6px down | 33px with and without the switches |
| The one in force | accent fill on a bordered button | accent fill on the 20px icon box (accent text with no fill under a terminal palette with brackets); Lock in the header shows pressed with the lighter `--accent-bg` (`ToolButton.svelte:245-251`), so the two pressed looks differ and the look judges them side by side |
| Hover over the one not in force | the border turns accent (`ToolButton.svelte:203-205`) | the 20px box fills with `--chip` and the glyph goes to ink (`:181-184`), no border, as the font buttons |
| Accessible name | from the word drawn in the button, no `aria-label` | `aria-label` "Live" and "Transcript"; the tooltip text as description |
| Live tooltip | "Show the terminal this session runs in" | "Live: show the terminal this session runs in" |
| Disabled Live tooltip | "This session has no terminal to show" | "Live: this session has no terminal to show" |
| Transcript tooltip | "Read the turns of this session" | "Transcript: read the turns of this session" |
| `docs/HELP.md:257` | "... keeps the tab's boxes and grids from taking typing ..." | "... keeps the tab's box and its grids from taking typing ..." |

## Wrong or impossible in the brief

Nothing that changes the work. The brief's case 10 names `tab-session.svelte.ts:70-95` without its folder; the file is `src/lib/views/sessions/terminal/transcript/tab-session.svelte.ts` (`find src -name 'tab-session*'`), and the lines read are those.

## Documents and comments re-read

- `TerminalBar.svelte:3-4` ("the Live and Transcript switch while the tab has a session to read"): still true.
- `Terminal.svelte:27` ("the bar's switch (bar/ShowSwitch.svelte) sets `showing`"): still true.
- `SessionTools.svelte:4`: still true, and agrees with the new HELP line.
- `tab-session.svelte.ts:88` ("Move the switch: ..."): still true.
- `TranscriptBody.svelte:9,16`, `tab-session.svelte.ts:7,73`, `terminal-tabs.ts:79`, `TerminalBar.svelte:54` and `tests/state/sessions/terminal/reading-tab.test.ts:1,6`: still true, none describes the switches as text buttons or gives a height (read at landing, as the review read them).
- `docs/HELP.md:257`: rewritten, as ruled.
- The grep `grep -rn "Live and Transcript\|Live or Transcript\|ShowSwitch\|show switch\|the switch" src docs README.md config --exclude=local.yml` finds no other place that describes the switches as text buttons or by height.

## Limitations

- Every height and look in this report is by reading; none is measured. The look on landing is the proof.
- The wrap the brief accepts stands: at a width where the bar fits one line without the switches and not with them, it gains a line when the session links.
