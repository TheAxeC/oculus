# O117 report: the transcript's own text size

NOT done: nothing in "What to build" is built and no code is changed. The first read of the cases found one case the brief's rules get wrong (case 12, "Smaller from no key at a text size of 1.2"), so under the brief's Cases section the step stops here and hands that case back.

## Open items of the state file, verbatim

The section "## Open items" of `.scratch/migration/orchestrator-state.md` (lines 165-172) holds its heading, its one standing paragraph and no entry:

> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

## The case handed back

**Case:** "Smaller from no key at a text size of 1.2 and an `--fs-sm` of 12: the key reads 13.4 and stays there if the text size changes, as a press on a grid pins `font_px`."

**The rules that give the result:** item 3 (the size in force is `--fs-sm` times the text scale) and item 4 (smaller moves the key by one CSS pixel from that size). The code that carries them: `stepFontPx` reads 12 off the token, `textScale()` gives 1.2 (`boundedTextSize`, `appearance.ts:317`), and the press is `current + by` as at `TerminalFontTools.svelte:19`. `writeConfigKey` writes the number as it comes (`config-key.ts:171`, `:209`) and `kept` (`config-checks.ts:110`) passes it.

**The result the rules give:** 13.399999999999999, not 13.4. The second press gives 12.399999999999999, and larger from no key gives 15.399999999999999. That number is what lands in the workspace file's `settings:` and what the Settings view's number box draws.

**The proof:** a case-run program run with `node --experimental-strip-types --no-warnings <program> "$PWD"`, its only import the tree's `boundedTextSize`. Its source:

```js
const root = process.argv[2];
globalThis.$state = (value) => value;
const { boundedTextSize } = await import(root + '/src/lib/state/shared/words/appearance.ts');
const stepFontPx = (text) => Number.parseFloat(/[\d.]+px/.exec(text)?.[0] ?? '');
for (const [name, token] of [['--fs-sm default', 'calc(12px * 1.2)'], ['--fs-sm rice', 'calc(11px * 1.2)']]) {
    const scale = boundedTextSize(1.2);
    const inForce = stepFontPx(token) * scale;
    const once = inForce - 1;
    console.log(name, 'scale', scale, 'in force', inForce, 'smaller', once, 'smaller twice', once - 1, 'larger', inForce + 1);
}
console.log('every text size, --fs-sm 12, smaller:');
for (let tenth = 7; tenth <= 16; tenth += 1) {
    const scale = boundedTextSize(tenth / 10);
    console.log(scale, 12 * scale - 1);
}
```

Its output:

```
--fs-sm default scale 1.2 in force 14.399999999999999 smaller 13.399999999999999 smaller twice 12.399999999999999 larger 15.399999999999999
--fs-sm rice scale 1.2 in force 13.2 smaller 12.2 smaller twice 11.2 larger 14.2
every text size, --fs-sm 12, smaller:
0.7 7.399999999999999
0.8 8.600000000000001
0.9 9.8
1 11
1.1 12.200000000000001
1.2 13.399999999999999
1.3 14.600000000000001
1.4 15.799999999999997
1.5 17
1.6 18.200000000000003
```

Seven of the ten text sizes give such a number at an `--fs-sm` of 12. The grid's path has the same behaviour on main at fewer sizes: `node -e "for(let t=7;t<=16;t++){const s=Math.round(t)/10;console.log(s,13*s-1)}"` prints `0.9 10.700000000000001` and `1.3 15.900000000000002` for an `--fs-md` of 13.

**What the brief must settle:** the first half of the case ("reads 13.4") and the rule ("move by one CSS pixel", with the setter clamping and nothing else) cannot both hold. The second half of the case, that the key stays when the text size changes, holds whichever way this is settled.

**Options, and my recommendation (a judgment):**

- (a) The rule gains a rounding: the one clamp item 2 asks for also rounds the size to a hundredth of a pixel, for `terminal.font_px` and the new key alike, so the key reads 13.4 and a press never writes float noise into the reader's workspace file. The cost: the grid branch's written value changes in the last digits where it is noisy today, which item 4's "they do what they do today" would have to allow. A size typed in a file or in Settings is not rounded, since `font_px` and the new key are used as given. Recommended, because the file and the Settings box are what a reader sees, and because the setter is where both keys pass.
- (b) The rounding only on the transcript's branch. This keeps item 4's grid sentence as written, and leaves one rule for two keys that item 2 asks to share.
- (c) The case is reworded to the number the rule gives. This is the lazy option: it changes the case to fit the arithmetic and leaves 13.399999999999999 in the reader's file and on the Settings box.

## The cases' first read, on the unchanged tree

Each line gives what the unchanged tree does and what the brief's rules give once built. Read at the base; `git status --short` printed nothing before this report was written.

1. **`font_px` 16, no transcript key, Transcript showing.** Tree: 16, `Math.max` of the grid's size and `--fs-sm` (`terminal-list.ts:163`). Rules: `--fs-sm` times the scale, the grid's size unread. Holds.
2. **`font_px` 10.5, transcript key 11, Transcript showing.** Tree: the key has no reader; `Math.max(10.5, 12)` gives 12. Rules: 11, with no floor. Holds.
3. **Smaller twice from no key at `--fs-sm` 12, scale 1.** Tree: writes `terminal.font_px` (`TerminalFontTools.svelte:19`). Rules: 12 - 1 is 11; `held` (`ui.svelte.ts:233`) answers the written value before its push, so the second press steps from 11 to 10, and `font_px` is not written. Holds.
4. **Smaller at 6, larger at 40.** Tree: the clamp at `ui.svelte.ts:427` for `font_px`. Rules: the shared clamp gives 6 and 40; the write of the value the file already holds answers no change and no refusal (`config-key.ts:193`). Holds.
5. **Reset on each view.** Tree: one reset, `font_px` alone (`TerminalFontTools.svelte:39`). Rules: the prop picks the one key; `resetOption` (`ui.svelte.ts:270`) takes one key out. Holds.
6. **Reset with Transcript showing and no key in any file.** Tree: not reachable, there is no such key; a row exists nowhere. Rules: with the row, `optionOf` finds the entry (`config-reset.ts:122`), `absentIn` answers true and the answer is `{ changed: [], refused: [] }` (`config-reset.ts:132`), which `tell` passes with no message (`writes.svelte.ts:125`). Holds.
7. **`font_px` 14, Live, smaller, then the same tab on Transcript.** Tree: the grid moves to 13 and the transcript follows it. Rules: the grid moves to 13, the transcript's key is unwritten and its size is unmoved. Holds.
8. **Two tabs, one on Live and one on Transcript.** Tree: both move. Rules: `TerminalBar` is mounted per tab (`Terminal.svelte:323`) and takes that tab's `session.reading`, so a press writes the key of what that tab shows; each key is one value, so two transcripts share theirs. Holds.
9. **A tab on Transcript with no terminal.** Tree: smaller writes `font_px`. Rules: `session.reading` (`transcript/tab-session.svelte.ts:41-43`) is true for a target with no terminal, the bar is drawn, smaller writes the transcript key. Holds.
10. **A key of 3, 100 or a word in `settings:`.** Tree: the path is unknown to the options, a finding `settings_unknown` (`workspace-layer.ts`, the walk from line 286). Rules: with the row, `valueProblem` (`workspace-layer.ts:228`) answers `range` (`value-rule.ts:120`) or `number` (`value-rule.ts:312`), the finding `findings.config.settings_value` names `settings.terminal.transcript_font_px` (`:289`, `:243`), `appliedValue` returns null and the merged config holds no key, so `terminalShape` reads null and the transcript draws at `--fs-sm`. Holds.
11. **A key of 13 at a text size of 1.2.** Tree: the key has no reader. Rules: `transcriptZoom` gives 13 / (13 * 1.2) for the default `--fs-md`, so `--fs-md` text draws at 13 px. Holds.
12. **Smaller from no key at a text size of 1.2 and `--fs-sm` 12.** Tree: writes `font_px`. Rules: 13.399999999999999, not 13.4. Does not hold; handed back above.
13. **The key set and reset in the Settings view.** Tree: no row. Rules: a number control with `min` and `max`, drawn empty with no value in force (`Control.svelte` head comment), as `terminal.opacity` is (`config/options/appearance.yml:100`); out of range refused by `value-rule.ts:120` on both sides of the write. Holds.
14. **A write refused or a workspace not saved.** Tree: `writeOption` drops the held value on a refusal (`ui.svelte.ts:265`) and offers Save Workspace (`:254`, `:272`). Rules: the same functions. Holds.
15. **The theme changes while no key is set.** Tree: the observer (`TranscriptBody.svelte:127-128`) calls `retakeZoom` on a `class` or `style` change of the body, and `stepFontPx` reads the token off the body. Rules: the size is read through the same call. `body.rice` sets `--fs-sm` to 11 (`src/lib/themes/themes.css:53`). Holds.

## DONE / NOT DONE

| Deliverable | State | Proof |
| --- | --- | --- |
| First read of every case | DONE | The 15 lines above; case 12 by the program output quoted above |
| 1. The key | NOT DONE | Stopped by the Cases section: `diff -rq` against the base copy over `src` and `config` printed nothing |
| 2. The ui store | NOT DONE | same |
| 3. The size in force | NOT DONE | same |
| 4. The buttons | NOT DONE | same |
| 5. Comments and pages | NOT DONE | same |
| `npm run test:quick` | NOT DONE | Not run, 0 times: no code changed |
| `grep -rn --exclude=local.yml 'transcript_font_px\|ranscriptFont' src config docs` | NOT DONE | Run before any change with `tests` added: printed nothing, so the names are free |

## Files changed

`.scratch/migration/agents/reviews/O117-report.md` only, this file. No path under `src`, `config` or `docs` is changed.

## Judgment calls

None in code. The case program was written to my scratchpad by a shell redirect, edited there once with `sed -i` to add the `$state` stub the `.svelte.ts` import needs, and deleted before this report; it changed no file of the step.

## User-visible changes

None, since nothing is built. One to name for the look once it is: a reader with no key sees the transcript at 12 px where the shipped `font_px` of 12.5 draws it at 12.5 today, which brief decision 1 already takes.

## Anything in the brief that was wrong

- Case 12, as above.
- The brief's `tab-session.svelte.ts:41-42` lives at `src/lib/views/sessions/terminal/transcript/tab-session.svelte.ts`, and the getter runs lines 41-43 (`grep -n 'get reading' -A2`). The condition is the one the brief states.

All other premises of "What is on the tree" that I checked reproduce: the line numbers in `ui.svelte.ts`, `appearance.ts`, the option row at line 72, the commented `opacity` at `config/defaults/appearance.yml:86`, `config-reset.ts:122,132`, the three words at `terminal.yml:78-80`, `docs/HELP.md:459,565` and `docs/templates.md:697`, each read with the commands of this step. The words `transcript_larger`, `transcript_reset`, `transcript_smaller` collide with nothing in `src config docs tests`.
