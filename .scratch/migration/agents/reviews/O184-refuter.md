# Refuter report of O184

Verification lines, run from /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O184 with `export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`.

1. `env -u TMPDIR sh -c 'npm run diagrams && npm run test:quick' 2>&1 | tail -25`, run once. These are the last lines it printed:
```
        tests/checks/tree/size.test.ts: scans the source text of a changed file
ok      prettier (0.8 s): All matched files use Prettier code style!
ok      ASCII gate (0.9 s)
ok      svelte-kit sync (3.2 s)
ok      eslint (2.3 s)
ok      svelte-check (9.8 s): 1794388649428 COMPLETED 592 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (21.0 s): Duration  8.47s (transform 5.14s, setup 0ms, import 7.85s, tests 460ms, environment 0ms)
ok      vitest checks (57.0 s): Duration  43.92s (transform 16.88s, setup 0ms, import 34.05s, tests 79.52s, environment 3ms)
test:quick: 60.3 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source, tests/checks/tree and
            tests/checks/imports, which run for any change under src, tests or
            utils; the build, the lint of unchanged files
```
The list it selected includes `tests/checks/source/comment-width.test.ts`, `tests/checks/source/history.test.ts`, `tests/checks/tree/size.test.ts` and `tests/routes/sessions/terminal.test.ts` ("named for a changed file"). After the run, `git status --short` lists only ` M config/text/views/sessions/terminal.yml`, ` M docs/HELP.md`, ` M src/lib/views/sessions/terminal/bar/ShowSwitch.svelte` and `?? .scratch/migration/agents/reviews/O184-report.md`, so `npm run diagrams` changed no tracked file.

2. The ASCII gate (perl form of `agents/spec.md:103`) over the three changed files printed nothing, `exit 0`. `LC_ALL=C grep -n '[^ -~]'` over the same three files plus the report printed nothing, `grep exit 1`.

3. `sed -n 257p docs/HELP.md` prints:
`- Lock this tab keeps the tab's box and its grids from taking typing until it is unlocked, and holds after a reload.`

4. The commands the report quotes, run again:
- `sh utils/unused-exports.sh | diff - ../O184-base/unused-exports.txt` gives no output, `diff exit 0`.
- `grep -n 'ShowSwitch\|terminal_show\|TerminalBar' .scratch/migration/agents/guarded.md` gives no output, exit 1.
- `sed -n 2,7p ShowSwitch.svelte | grep -niE "<the history words>"` gives no hit, exit 1. The report grepped lines 2-6; see Proof 1.
- `sed -n 177,189p .scratch/migration/orchestrator-state.md` prints the heading, eight empty lines and the closing paragraph. It holds no entry, as the report says.
- `sed -n 2,7p ShowSwitch.svelte | awk '{print length}'` prints 98 95 93 97 99 88, as reported.
- `wc -l`: ShowSwitch.svelte 43, terminal.yml 133, HELP.md 639, as reported. ShowSwitch.svelte was 38 lines at the base (`git show 5d293bf5a:... | wc -l`).
- `ls -a .agents` lists only `plan.yaml`, so no scratch folder is left.

## Verdicts

Items of "What to build":
1. The switches at the bar's size: **holds**. `git diff 5d293bf5a` adds `compact` to both `ToolButton`s (`ShowSwitch.svelte:29,39`). `glyph`, `label`, `title`, `active`, `pressed` and `disabled={!live}` are unchanged. With `compact` and a glyph, `iconOnly` is true (`ToolButton.svelte:52`), which gives `class:compact` (`:72`), `height: var(--header-action)` (`:170-179`) and `aria-label={label}` (`:54,93`). The head comment (`ShowSwitch.svelte:2-7`) says the two are icon buttons as high as the font buttons, that the name is the accessible name and opens the tooltip, and that the one in force is drawn pressed. The kept Segment sentence is still true. The paragraph is rewrapped at 100 columns.
2. The name in the tooltip: **holds**. `terminal.yml:110-112` now read `'Live: show the terminal this session runs in'`, `'Live: this session has no terminal to show'` and `'Transcript: read the turns of this session'`. The keys are unchanged, the strings are single-quoted as `:107` is, and the form matches the Lock tooltip (name, colon, lowercase clause). The disabled tip keeps its reason.
3. The Lock line of HELP.md: **holds**. Only line 257 changed: "boxes and grids" became "box and its grids", and the rest of the line is byte-identical to `git show 5d293bf5a:docs/HELP.md | sed -n 257p`.

"No other file changes": **holds**. `git status --short` shows the three files and the report. The hunks stay inside the line ranges on the write list.

Cases (each case that needs a page is judged by reading the CSS and markup; the look on landing settles it):
- No session, bar 33px: **met by reading**. 6 + 20 + 6 + 1 (`Pane.svelte:216-227`, `tokens.css:198`). This file is unchanged.
- Session links, still 33px, grid does not move: **met by reading**. The switches are now `.tool.compact` at `--header-action`, the font buttons' height. Settled by the look: measure the bar before and after the switches appear.
- Live in force, default theme, filled and `aria-pressed="true"`, and the reverse for Transcript: **met by reading**. `.tool.active` (`ToolButton.svelte:435-439`) comes after `.tool.compact` (`:170-179`) at the same specificity, so its `background: var(--accent)` wins over `background: none`. `aria-pressed={pressed}` is unchanged.
- Terminal palette with brackets on: **met by reading**. The rule `body.rice:where(:not(.rice-plain)) .tool` (`:474-479`) sets padding, border and background but no height, so the fixed `height` with `box-sizing: border-box` (`:172-174`) keeps 20px. `.tool.active` there is accent text with no fill (`:481-484`). The brackets apply to compact buttons as they do to the font buttons (`:491-501`).
- Terminal palette with icons off: **met by reading**. The stand-ins are `terminal: "[>]"` and `chat: "(@)"` (`glyphs.yml:113,29`), each in a `3ch` box (`Glyph.svelte:101`), inside the same fixed height.
- Live with no terminal: **partial, not verifiable beyond reading**. Half opacity (`:212-215`) and the title "Live: this session has no terminal to show" are met by reading. Whether the bubble opens over a disabled button is left, as the brief asks, to the look on the unchanged tree first.
- Hover and focus: **met by reading** for the tooltip text and the 1px inset ring (`:452-455`), which sits inside the 20px box. A disabled Live keeps the native `disabled` attribute (`:99`), so it stays out of the tab order. The bubble itself is seen at the look.
- Screen reader's name: **met by reading**. `named` is true for an icon-only button, so `aria-label` is "Live" and "Transcript".
- Text scale 1.25: **met by reading**. The only scaled token is `--header-action`, set in `tokens.css:198`; `grep -- "--header-action"` finds no other place that sets it.
- Live in force and disabled at once: **met by reading**. I followed the writes the report cites: `open-session.ts:79` sets `showing: 'transcript'` with `transcript`; `pressTarget` picks only a tab already reading a session or an empty one; `moveInto` and `attachTerminal` apply `liveTab`; `pageTarget` skips tabs with a transcript; `TerminalStart` (the composer that could add a terminal) is not drawn while `session.reading` (`Terminal.svelte:378-409`). I found no app path that reaches `showing: 'live'` with `shown === null` and `transcript !== null`. The only way in is a saved or configured state whose `showing` parses to `'live'`.
- `sed -n 257p docs/HELP.md`: **met**, line quoted above.

## Spec
none

## Proof
1. Belongs to item 1 (head comment). `O184-report.md:39` gives the history-word grep as `sed -n 2,6p ShowSwitch.svelte | grep ...`, but the changed comment runs to line 7: `+    // is disabled while the session has no terminal and a Segment has no disabled item.` is a changed line, since the paragraph was rewrapped. `agents/spec.md:44` asks for the grep over every comment line the step adds or changes. My run over lines 2-7 finds no hit, so the result stands and no decision rests on it. The scenario is a later reader trusting the quoted command as covering the whole comment when it does not.

## Standards
1. Belongs to item 1 (head comment). `ShowSwitch.svelte:4-5`: "The name is the button's accessible name and opens its tooltip, ahead of what the button does". This is a judgment: "opens its tooltip" can be read as the name triggering the bubble, when it means the tooltip's text begins with the name; the brief's own wording was "opens with". The scenario is a maintainer who reads it as a statement about what makes the tooltip appear and looks for code tying the label to opening the bubble. The prose rule at stake is `agents/spec.md:21` (plain and exact). This is minor and can be fixed at landing.
2. Belongs to item 1. `agents/spec.md:72` asks the report to list every head comment and doc line that describes the changed behaviour as "still true" or "rewritten". The report (`O184-report.md:119-126`) lists `TerminalBar.svelte:3-4`, `Terminal.svelte:27`, `SessionTools.svelte:4`, `tab-session.svelte.ts:88` and `docs/HELP.md:257`. It leaves out lines the brief names: `TranscriptBody.svelte:9,16`, `tab-session.svelte.ts:7,73`, `terminal-tabs.ts:79`, `TerminalBar.svelte:54` and `tests/state/sessions/terminal/reading-tab.test.ts:1,6`. I read each one (`sed -n`), and all are still true, since none describes the switches as text buttons or gives a height. The defect is in the report's shape only.

## Behaviour
1. Belongs to item 1. The report's before-and-after table (`O184-report.md:104-113`) does not state that the hover look changes. Before, a text button under the pointer turned its border accent (`ToolButton.svelte:203-205`, `.tool:not(.active):hover:not(:disabled) { border-color: var(--accent) }`). After, a compact button that is not in force fills with `--chip` and its colour goes to ink (`:181-184`), and there is no border. The scenario is the look on landing, read against the table, which does not expect the chip fill on hover over Transcript while Live is in force. The fill matches the font buttons, so it is consistent, but it is a visible change and needs its row.

## Declined to judge
- The first lines of my `test:quick` run (the changed-file and test-file counts): I piped the run through `tail -25` and the brief allows one run. The lines shown end with "every command passed".
- Whether the tooltip bubble opens over a disabled button (case 6), all pixel heights and the grid's top edge: these need a page, and I run none. They are for the look on landing.
- Whether `.tool.active` with `opacity: 0.5` reads well for the in-force-and-disabled state: this needs a page, and per the reading above the app does not reach the state.
- Commit or branch facts beyond `git diff 5d293bf5a`, `git status --short` and `git show 5d293bf5a:<path>`: these are outside the git commands I may run.

## Closed

1. Proof 1: fixed at landing. The report's history-word grep is rewritten to lines 2-7, with the reviewer's run over them (no hit).
2. Standards 1: fixed at landing. `ShowSwitch.svelte:4-5` "opens its tooltip" becomes "begins its tooltip".
3. Standards 2: fixed at landing. The report's still-true list gains the lines the brief names, each read and still true.
4. Behaviour 1: fixed at landing. The report's before-and-after table gains the hover row (border accent before, chip fill with ink after), and the look checks it.

Usage: a0bbb4de829304e8e, claude-opus-5-5, 147919 tokens, 35 tool uses, 318 s.
