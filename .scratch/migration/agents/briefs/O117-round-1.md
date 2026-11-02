# O117, repair round 1

Sent from `agents/reviews/O117-refuter.md`. Each finding has its ruling. Change these and nothing else. The builder's rules stand. Run the scoped checks, then `npm run test:quick` once, after the last change.

1. S1, `TerminalFontTools.svelte:3-4`: the comment says the reset goes "back to the configured size", which is false on Transcript, where the key has no default. It says what reset does: it takes the key of what the tab shows out, so a grid returns to the size configured under it and a transcript to `--fs-sm`.
2. S2, `ui.svelte.ts:10-13`: the sentence says each option comes from the workspace file or oculus's defaults. `terminal.transcript_font_px` has no default. Reword the sentence so it holds for that key, keeping it short.
3. S3, the report's judgment call 1: quote the grep run for a helper to reuse before each of `boundedTerminalPx`, `scaledFontPx`, `transcriptFontSize` and `writeTerminalSize`, with its output. Run it now if it was not run. No code changes on this count.
4. B1, the report's user-visible changes: state the change to `terminal.font_px`'s help with before and after, the dropped clamp sentence and "while a grid shows" included.

Add a "Repair round 1" section to the report at the same path, naming each finding and how it closed, with the check's line.
