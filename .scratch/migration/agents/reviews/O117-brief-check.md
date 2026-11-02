Brief check of step O117. Nothing in the repository was changed: `git status --short` prints the same three lines before and after (`.scratch/migration/orchestrator-state.md`, `.scratch/migration/plan.md`, `.scratch/migration/agents/briefs/O117.md`). One case-run program ran in my scratchpad, on scratch workspace files, and was deleted.

Summary: 1 case is wrong against the tree (case 10). 3 cases can pass without the goal (cases 1, 7, 9). The look can pass without the goal unless it presses a button. 2 comments that the step makes false or incomplete are missing from the brief's list. 2 sentences of `terminal.font_px`'s help need care. 1 verify command omits a safety flag. Every premise command reproduces, except that the base copy is not on the tree yet.

## 1. Names

Commands, with exclusions for `node_modules`, `.scratch`, `.agents`, `.svelte-kit`, `build`, `dist`, `.git` and `local.yml`:
- `grep -rnI ... -e font_px -e 'fontPx\b' -e terminalFontPx .`
- `grep -rnI ... -e transcriptZoom -e setTerminalFont -e TerminalFontTools -e terminal_larger -e terminal_smaller -e terminal_reset -e gridFontSize -e stepFontPx -e bodyFontPx .`

Hits outside "Paths this step writes":
- `tests/data/sources/config/workspace-layer.test.ts:36,42,43`: `font_px: 14` over `{ ...shipped }`. Not made false: the new key has no default, so `shipped` gains nothing.
- `docs/templates.md:697`: `terminal: { font_px: 14 }`. Not made false.
- `src/lib/data/sources/config/merge/workspace-layer.ts:5`: the same example in a comment. Not made false.
- `src/lib/views/system/machine/debug/Console.svelte:41,48,56`: reads `terminalFont` and `terminalFontPx`, a grid. Not made false.
- `src/lib/views/sessions/terminal/grid/TerminalGrid.svelte:19,71,167,296,424`: `gridFontSize` and `terminalFont`, unchanged. Not made false.
- `.scratch/migration/orchestrator-history.md`: log lines. Left as they are.

Collision check for the new names:
- `grep -rnI ... -e transcript_font_px -e transcriptFont -e transcript_larger -e transcript_reset -e transcript_smaller -e setTranscriptFont .` prints nothing, so no new name collides.
- `grep -rn '<TranscriptBody\|<TerminalBar\|<TerminalFontTools' src` prints one mount each (`Terminal.svelte:323`, `Terminal.svelte:376`, `TerminalBar.svelte:105`), so no other caller needs the prop.

Hits inside the write list that the brief's paragraph list does not name are under check 4, finding F6.

## 2. The step line

Command: `sed -n 1607,1608p .scratch/migration/plan.md`.

- "a key `terminal.transcript_font_px`": item 1.
- "written by a Terminal tab's font buttons while the Transcript shows": item 4, with item 2 as its setter.
- "left out meaning the `--fs-sm` size": item 3, and item 1's help.
- "`terminal.font_px` then sizes the grids alone": items 3, 4 and 5.
- "the 12 px floor goes": item 3 ("has no floor").
- Ruling 629 (`plan.md:3422`) says the same as the step line.

No part of the line lacks a requirement. No requirement lacks a part: the three labels serve "while the Transcript shows", and the setter rewrite and item 5 serve items 2 and 4 and `spec.md:72`.

`plan.md` has no Goal line at its top: `grep -n -i '^goal\|^## goal\|\*\*Goal' .scratch/migration/plan.md` prints nothing. I used the goal your prompt states.

## 3. Premises

- `grep -n 'font_px' src/lib/state/workbench/ui.svelte.ts`: lines 10, 339, 424, 427. `grep -n` puts `terminalFont` at 338 and `setTerminalFont` at 422. As the brief says.
- `grep -n 'transcriptZoom' -A5 src/lib/views/sessions/terminal/terminal-list.ts`: line 163 is `Math.max(gridFontSize(chosen, scale) ?? Number.NaN, stepFontPx('--fs-sm') * scale)`. As the brief says.
- `grep -rn 'terminalFont' src`: `TranscriptBody.svelte:73,107`, `TerminalGrid.svelte:296,424`, `Console.svelte:48,56` and the rest. As the brief says.
- `TerminalBar.svelte:105`, `Terminal.svelte:375` and `:323`: as the brief says. `TerminalFontTools.svelte` has no props.
- `appearance.ts`: `terminalShape` at line 200 (head comment from 196), getter at 607. The brief's 199-221 holds.
- `config/options/appearance.yml:72`, `config/defaults/appearance.yml:79,81`, `config/text/views/sessions/terminal.yml:78-80`, `docs/HELP.md:459,565`, `docs/templates.md:697`: as the brief says.
- `config-reset.ts:122` and `:132`: as the brief says.
- `terminal.opacity` and `editor.opacity` have rows and no default key (`config/options/appearance.yml:100`, `config/options/behavior.yml:493`). As the brief says. Both have a commented line in the defaults (`config/defaults/appearance.yml:86`, `config/defaults/behavior.yml:365`), which the brief does not mention; see F11.
- `grep -rln 'gridFontSize\|transcriptZoom\|terminalFont' tests` prints nothing, rc 1. As the brief says. The command does not match `setTerminalFont`, whose T is a capital. `grep -rln 'gridFontSize\|transcriptZoom\|erminalFont\|font_px' tests` prints only `tests/data/sources/config/workspace-layer.test.ts`, by `font_px`, so the brief's sentence is true and its command is narrower than the sentence.
- "No guarded entry covers the size": `grep -n -i 'font\|transcript\|zoom\|writeOption\|resetOption\|config-reset\|option row\|orphan\|fs-sm' .scratch/migration/agents/guarded.md` shows transcript-reading entries and none on a font or a zoom. Holds. `appearance.ts` is named under one entry near `guarded.md:406`, for its `themes` unit, which this step does not change.
- The base copy: `ls .agents/worktrees/O117-base` prints "No such file or directory". The spec skill's description orders the worktree after the brief check, so I read this as not yet made. The sentence is false until then.
- Every `file:line` in the brief's comment list holds: `TranscriptBody.svelte:27-31` by `grep -n`, `TerminalFontTools.svelte:2-5`, `TerminalBar.svelte:2-9`, `ui.svelte.ts:10`.
- The brief names no worktree, though `spec.md:32` says the brief does. O116's brief names none either (`grep -n 'worktree' .scratch/migration/agents/briefs/O116.md`: lines 19 and 92 only), so it is carried at dispatch.

## 4. Cases and checks

F1. Case 10 is wrong on the tree: "A key of 3 or 100 in a file: read as 6 and 40."

The key has no default, and `placeOf` (`config-place.ts:135`) puts it only in the workspace file's `settings:`. There the row's `min` and `max` refuse the value before `terminalShape` sees it (`workspace-layer.ts:228`, `value-rule.ts` `numberProblem`). The case program, using `loadConfig` as `workspace-layer.test.ts` does, with the row-holding keys `font_px` and `terminal.opacity`:

```
font_px 3    -> font_px: 12.5, "settings.terminal.font_px must be a number from 6 to 40; oculus's value stands"
font_px 100  -> the same
font_px big  -> font_px: 12.5, "settings.terminal.font_px must be a number; oculus's value stands"
opacity 5    -> opacity: undefined, "settings.terminal.opacity must be a number from 0 to 1; oculus's value stands"
```

Expected for the new key: 3, 100 and a non-number each give a finding naming `settings.terminal.transcript_font_px`, and the key reads as left out, so the transcript draws at `--fs-sm`. The bound in `terminalShape` stays as item 1 asks. It is not what acts on a workspace value. As written, this case triggers the brief's stop at the builder's first read.

F10. The sentence opening "Cases" says the clamp bounds a wrong configuration. For a file, the option row does that; the clamp bounds only the buttons, in the setter. It should say so.

The other cases agree with `spec.md` and with `guarded.md` (no test, read with `file:line`, look at landing). `spec.md:60` allows no test without an entry, so "The builder writes no test" holds.

Cases that ask the builder to read a place the step does not change:
- Case 6 reads `config-reset.ts:132`. It is on the new key's path, and the case program shows it with the stand-in key (`reset-absent {"changed":[],"refused":[]}`).
- Case 11 reads `writeOption` and `resetOption`, unchanged but reached by the new setter.
- Case 12 reads the observer in `TranscriptBody`, unchanged. `body.rice` (`themes.css:51`) is a class on the observed element, so it is reached.

Each is a read of the path the new key takes, not a stray explanation. None needs removing.

F6. Two comments are missing from the brief's list and fall under `spec.md:72`:
- `terminal-list.ts:3`: "the grid's font size and the zoom that draws a transcript at it". False after the step. The brief's entry "`terminal-list.ts` on `transcriptZoom`" reads as the doc comment at 156-160.
- `TranscriptBody.svelte:122-124`: "the font setting" and "which `--fs-md` is read through". Case 12 rests on `--fs-sm` being read the same way, so the paragraph is incomplete after the step.

Both files are on the write list, so no path is added.

## 5. The question

The goal asked: the transcript has its own text size, written by the tab's buttons while it shows, the grid unaffected, both free of the floor.

- Check on the step's line: there is none. Line 1608 only points to the brief.
- Verify 1, `npm run test:quick`: yes, it can pass without the goal. No test names any of this, and the step adds none, so it proves type, lint and format only.
- Verify 2, the grep: yes, it can pass without the goal. It shows the names exist, not what they do.
- Case 1 (`font_px` 10.5, no key): yes, F2. It passes on the unchanged tree: `Math.max(10.5, 12)` at `terminal-list.ts:163` gives 12, the expected size. It needs a `font_px` above `--fs-sm`, for example 16, which draws 16 today and must draw 12.
- Case 2 (key 11): no. The unchanged tree ignores the key, and 11 is below the old floor.
- Case 3 (Smaller twice, 11 then 10): no. It fixes the start at `--fs-sm`, not the grid's size, and states `font_px` unchanged.
- Case 4 (6 and 40): no for the clamp. It does not bear on the goal alone.
- Case 5 (reset each way): no.
- Case 6 (reset, no key): no. It needs the row; without one, `config-reset.ts:122` refuses.
- Case 7 (Live, smaller): yes, F3. No start size is given. From 10.5 the unchanged tree also leaves the transcript at 12, so the second sentence passes there. It needs a start above `--fs-sm`, for example `font_px` 14.
- Case 8 (two tabs): no. It needs the prop per tab.
- Case 9 (no terminal, "the buttons work"): yes, F4. It passes while the buttons write `terminal.font_px`, as they do today. It should read: smaller writes the transcript key and `terminal.font_px` is unchanged. `TerminalFontTools` is outside the `{#if row}` at `TerminalBar.svelte:83-105`, and `Pane.svelte:86` draws `bar` whenever it is given.
- Case 10: wrong, F1.
- Case 11 (refused, unsaved): no. It is a shared path.
- Case 12 (theme): only a read of the function can pass it. The arrival of the theme is seen only on screen, so it belongs to the look.
- Item 1: a read of the row and the reader. No on the row; F7 on the words.
- Item 2: no, given case 3's two presses read the held value.
- Item 3: no, a read of `Math.max` gone suffices, together with case 2.
- Item 4: no, given cases 3, 5 and 9 once F4 is fixed.
- Item 5: yes, until F6 is fixed. The report's list marks only the listed paragraphs.
- The look (`spec.md:61`): yes, F5. With the hub's `font_px` of 10.5 and no key, the transcript reads zoom 0.923077 before the step and after it, so a look without a press sees no difference. The workspace file holds `terminal: font_px: 10.5` (`grep -n -A4 terminal ~/workspace/research-hub/.oculus/workspaces/research-hub.yml`); the zoom figure is the O115 booking at `plan.md:1604`, not measured here. The brief should name the states:
  - Transcript, Smaller twice: zoom 0.846154 then 0.769231 under a 13 px `--fs-md`, below the old floor.
  - A second tab on Live: the grid still at 10.5, untouched by those presses.
  - Live, Smaller: the transcript's zoom unchanged.
  - Reset on each.

## 6. Implied inputs

Not stated, with no case. Each has an expected result here:
- A set key with a text size other than 1. It has happened: `tests/state/workbench/options-pages.test.ts:155` uses 1.2. A wrong rule draws the wrong size with no error. Expected: key 13 at scale 1.2 draws 13 px, the zoom being 13 divided by (`--fs-md` times 1.2). Missing from Cases; decision 2 states the rule and no case reads it.
- Smaller from no key at a scale other than 1. Expected: the key is `--fs-sm` times the scale minus 1, for example 13.4 at 1.2, and it stays there if the text size later changes. Missing. It decides whether a press pins the size against the scale, which a user would notice.
- The key set in the Settings view, and its Settings Reset. The row makes this reachable. Expected: as the buttons, out of range refused by the row. `terminal.opacity` is the precedent. Missing; the look should cover it.

Stated by none, but no case is needed:
- A workspace `terminal:` in flow form, the form `docs/HELP.md:565` shows. Stand-in `terminal.opacity`: `writeConfigKey` gives `terminal: { font_px: 14, opacity: 0.5 }`, no refusal; `resetConfig` gives `terminal: { font_px: 14 }`.
- No `terminal:` block: `reset-noterm {"changed":[],"refused":[]}`.
- The last key of the map: `reset-only` leaves `folders: []`, which removes `settings:` too. This is the same path as every option.
- `--fs-sm` unreadable. The setter at `ui.svelte.ts:423` treats a non-finite size as a reset, so a raw NaN reaching it resets. With no key that resets nothing. Keeping the `current !== undefined` guard of `TerminalFontTools.svelte:19` covers it.
- `terminal` not a map: the fallback at `appearance.ts:225` and the initial value at line 176 need the new field, which the type check forces.

## 7. ADRs

`ls docs/adr` prints "No such file or directory", rc 1. Confirmed: no ADR folder.

## 8. Dictated text

- `grep -n 'Larger transcript text\|Reset transcript text size\|Smaller transcript text' .scratch/migration/agents/briefs/O117.md`: line 29. Holds: ASCII, the same shape as `terminal_larger` and its siblings, and the view's word is "Transcript" (`config/text/views/sessions/transcript.yml:19`). `grep` finds no key of these names.
  - A reader must be a literal per branch: `transcript ? t('sessions.transcript_larger') : t('sessions.terminal_larger')`. A `t(cond ? 'a' : 'b')` is a dynamic reader under `tests/checks/source/keys.test.ts:668`, and `grep -rnE "\bt\([a-zA-Z.]+ \? '" src/lib/views` prints none.
- `grep -n 'transcript_font_px' .scratch/migration/agents/briefs/O117.md`: lines 26, 37 and 92. The key name holds.
- `grep -n 'each view keeping' .scratch/migration/agents/briefs/O117.md`: line 30, the words for `docs/HELP.md:459`. Holds.
- Item 1's help content (line 26). Holds: `--fs-sm` as a token already carries the scale (`tokens.css:167`).
- Decision 1, "11 px under the terminal themes" (`grep -n '11 px' .scratch/migration/agents/briefs/O117.md`). Holds: `themes.css:53`, `body.rice`.

F7. `grep -n 'terminal.font_px' .scratch/migration/agents/briefs/O117.md`, line 30, says the help and the defaults comment "stop naming the transcript". Two sentences of that help need care:
- "The text size buttons of a terminal tab write this key" (`config/options/appearance.yml:75`) is half true after the step. It should say "while a grid shows", which does not name the transcript, and the brief should say so. Rule: `spec.md:72`.
- "a value is clamped to 6 to 40" is already untrue of a file, per F1. The step rewrites this help, so the sentence should go. Item 1's row must not copy it. No path is added; a requirement is added to item 5, for the orchestrator to judge.

F9. `grep -n "grep -rn 'transcript_font_px" .scratch/migration/agents/briefs/O117.md`, line 92. The dictated command greps `config` without `--exclude=local.yml` and leaves the flag to a following clause. It should sit in the command. `ls config` lists no `local.yml` in this checkout, but the safety rule covers every grep over `config/`. Also, `transcriptFont` does not match `setTranscriptFont`; the setter's line is found only through the key literal.

F8. `grep -n 'stated once' .scratch/migration/agents/briefs/O117.md`, line 29, breaks no rule, but a builder may lift line 375 into a derived boolean, and `session.target.session` at `Terminal.svelte:378` then loses its null narrowing. `tab-session.svelte.ts:41-42` defines `reading` as `tab.showing === 'transcript' && target !== null`, so `session.reading` alone is that condition. The prop can be `transcript={session.reading}` with line 375 left alone.

F11. Reported for the orchestrator to judge, since it adds a requirement. Both left-out keys have a commented line in the defaults (`config/defaults/appearance.yml:86`, `config/defaults/behavior.yml:365`). Item 1 forbids a key and is silent on such a line. With item 5 taking the transcript out of the defaults comment, the defaults file would then name no transcript size at all. One commented `# transcript_font_px:` line, in a file already on the write list, would keep the form.

## Declined to judge

- Whether the `sessions` catalog group declared in seven files under `config/text/views/sessions/` meets `spec.md:51` ("a catalog group lives in exactly one file"). It is the tree's existing form, and the brief joins the group where the buttons' words already are.
- Whether a press should pin the size against the text scale (second implied input). Decision 2 and the ruling leave it to the rule as stated. I give the result of that rule, not a view on it.
- How the Settings view draws a number row with no value. Not read beyond the `terminal.opacity` precedent.

## Closed

- F1, case 10: rewritten to what the tree does: the option row refuses the value with a finding, and the key reads as left out.
- F10: the sentence opening Cases rewritten: the row bounds a file, the setter bounds the buttons.
- F2, case 1: `font_px` 16. F3, case 7: starts from `font_px` 14. F4, case 9: states which key is written.
- F5: the look's states named under a new heading "The look at landing", the orchestrator's work, adding nothing to the builder.
- F6: `terminal-list.ts:3` and `TranscriptBody.svelte:122-124` added to the list.
- F7: item 5 says what the help says of the buttons and drops the clamp sentence; item 1's row does not copy it.
- F8: item 4 passes `session.reading`, with `Terminal.svelte:375` left alone, and says the labels are one literal per branch.
- F9: the grep carries `--exclude=local.yml` and matches `TranscriptFont`.
- F11: item 1 adds one commented line in the defaults file, already on the path list, the form both left-out keys have.
- Implied inputs: two cases added for a text scale other than 1, and one for the Settings row.
- The base copy sentence is made true by Steps 7 before dispatch.

## Usage: a8796edb0856c6314, claude-opus-5-5, 188468 tokens, 25 tool uses, 515 s
