# D46 landing: the VS Code palette keys

Position: the oculus migration (cockpit to oculus), D46 the VS Code palette keys; landed, with 331 of the 364 packages of `plan.md` ticked. Next: D53 lands (its review over round 1 has three findings to fix at landing); D49 takes a free slot; D56 after D53, D55 after D50.

## Open items

- Open item 31: a pulled change to a kept machine app runs with every channel and no question while oculus runs, since the hub's `.oculus/apps` is tracked in git; options (a) ask again for an app whose files change by anything other than oculus's own editor (recommended), (b) keep `.oculus/apps` out of git, (c) leave it and describe it (the lazy option).
- Open item 32: R2's start check needs a new guarded entry for its test; options (a) a new entry G73 with one table test (recommended), (b) no entry and no test (the lazy option).

## The check of Steps 1

The builder a741dc49f99c07dba, the brief check a3a03b9da01471872 and the reviewers a7cdb86a0c105ec03 and a2f2b3fa07ace87d6 had finished; ListAgents listed none of them running (it listed a6f74cd8e4f21015b and a62a3b17bb5c16834, the agents of D41 and D50).

## NOT DONE

Nothing of the step is left undone. Not looked at on screen: Cmd+Shift+P (the same command mode as F1 by the code) and F1 inside the editor. The rows' draw time measured at the look (153 ms) was taken in a tab the browser reported hidden, under load, so it is not a figure against the 50 ms bound.

## What landed

Cmd+Shift+P and F1 open the palette's command mode; Cmd+P opens a file mode that lists the files of every served root by name and matches them in a Web Worker; Cmd+K as it was. 61 paths, one commit.

## What was found

- The review over round 1 raised three findings, each fixed at landing: the loading sentence drawn with nothing typed too; the docs naming that a served root inside a private folder lists no name; the list saying the names are being read until the first answer, and keeping its rows and its no-match sentence between keystrokes.
- Merged by hand: the key help rows of `config/text/app.yml` (D47's `m1-m5` with D46's new rows).
- The look (scratch oculus, port 8796): F1 opens the command mode; Cmd+P opens the file mode with the loading sentence until the names arrive (28 ms to 199 ms); typed rows replace the last answer's without a blank; "No file matches." stays steady over further keystrokes.

## The gate

In `.agents/worktrees/gate` at b00a6c468: `npm run diagrams && npm run test:landing`: ok ASCII gate (2.6 s); ok npm run format:check (29.1 s); ok npm run lint (109.3 s); ok npm test (277.8 s); ok npm run test:checks (349.6 s); ok npm run check, then npm run build, then npm run test:slow (469.8 s); every command passed. Main's 61 staged blobs equal the gate's by `git rev-parse`.

## Agents

- Builder a741dc49f99c07dba (claude-sonnet-5-5): 306,126 tokens, 80 tool uses, 16.3 min to the hand-back of case 9; then 75,516 tokens, 155 tool uses, 69.5 min; 243,385 tokens, 102 tool uses, 69.4 min; 319,997 tokens, 26 tool uses, 18.1 min; round 1 216,918 tokens, 89 tool uses, 61.2 min. The first report did not pass its bar; its review's findings went back in repair round 1.
- Brief check a3a03b9da01471872 (claude-opus-5-5): 214,222 tokens, 92 tool uses, 12.2 min.
- Reviewer a7cdb86a0c105ec03 (claude-opus-5-5): 301,318 tokens, 80 tool uses, 33.0 min.
- Reviewer over round 1 a2f2b3fa07ace87d6 (claude-opus-5-5): 243,263 tokens, 64 tool uses, 25.1 min.
- Fixes at landing: 3. The A/B: no `bench:` line, none run.
