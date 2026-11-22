# O188 landing report

Position: the oculus migration plan, step O188 (the server thread kept free while sessions work, slides laid out ahead, the command center's emails unfolded), landed. Next: `~/Applications/oculus.app` rebuilt from this commit and replaced.

Open items: none.

Agents stopped before the landing: the runner's agent listing showed no agent of the step.

NOT DONE: a whole green `test:quick` run (see Verification); of the look, a second Focus tab folded (case 46; the command that opens Focus goes to the one that is open) and a font change (case 37).

## What landed

The booking under O188 in `plan.md` lists it. Fixes at landing: the head comment of `FoldControl.svelte` (Standards 1); an email's age stays on its row when the row is cut (ruling 769, Behaviour 1).

## Verification

In the gate at 713444563 with the fixes at landing, `npm run diagrams && npm run docs:palette && npm run test:quick`:

- First run, 889.7 s: vitest and vitest slow failed, 14 files, under the load of a scratch copy of the hub made beside it. Time-outs, but for one assertion of `tests/routes/git/credentials.test.ts`, where a `push` start stood in another row's list.
- Second run, 332.9 s: vitest and vitest slow failed, 8 time-outs in 7 files; prettier, the ASCII gate, svelte-kit sync, eslint, svelte-check (593 files, 0 errors) and vitest checks passed.
- The 20 files that failed in either run, together, with 3 workers and a test time-out of 20000 ms: 20 files passed, 453 tests.
- A third run was stopped by Axel, and nothing was run on main. The staged diffs of main and the gate are equal under `cmp`.

## The look

On scratch servers on 8797 from the gate (the development server, then the production build) with a scratch HOME, a copy of the hub and stand-ins for `ssh` and the agents; the inbox was planted in the page.

- Emails (cases 41 to 46): folded at the start; unfolded to the headings To reply, To action / do and Unsorted with their rows; the 200-character subject is cut and the age stays, the hover words hold the whole row; `<b>`, `**` and an address drawn as their characters; a thread with no sender, no subject or no readable age drawn as the Inbox draws it; with no thread no line; a press opens the Inbox at the section, also when that section was folded; open after a reload and after the tab moved to another group.
- Slides (35 to 40): presses after a pause and six presses in 360 ms; first and last slide; Overview; presenter screen; audience window following three moves; print page of 108 pages, none overflowing; a changed slide file, a light theme, a text size of 1.4; a missing figure drawn as its words once shown, and drawn as the figure once its file was back; the prepared slides `inert`, `aria-hidden` and `visibility: hidden`, with no focus stop, no find hit and no scroll mark; `G` scrolls the shown slide.
- The Gallery's Ticker sample folds and unfolds; Usage drew the planted transcript's row; the count of sessions went from 1 to 2 when a transcript appeared.
- Slide switch, production builds before and after: forward median 109.5 to 62 ms, back 104 to 50.5 ms. After one of the 26 presses a main-thread task of 190 ms began 89 ms later, its cause not looked into.

## Found

Findings outside the brief: none.

## Agents

- Builder af764a4d90f774307, claude-opus-5-5: 248649 tokens, 518 tool uses, 5946.5 s. Its first report did not pass its bar (Behaviour 1).
- Brief check afa29be52347a316a, claude-opus-5-5: 370820 tokens, 75 tool uses, 537.3 s.
- Reviewer aaf390701b23dd659, claude-opus-5-5: 175101 tokens, 82 tool uses, 1344.7 s.

## Next

The app rebuilt and replaced, the running one closed first, with no release.
