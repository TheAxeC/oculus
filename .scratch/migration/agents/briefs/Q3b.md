# Brief: Q3b, the terminal pane behaves as a terminal

Read `../spec.md` first; it governs this package unchanged. Three items Axel raised on 2026-09-12 about the terminal pane, two to build and one established as working (`views/sessions/Terminal.svelte`, xterm.js over the `pty:` channel, tmux behind it); each is checked in Chrome on the TEST page at landing.

## What to build

1. **The text size follows the page.** `Terminal.svelte` builds its grid with `new xterm.Terminal({ theme: palette(), convertEol: false })` and no `fontSize`, so xterm's own default of 15 px applies while the page's body text is `--fs-md` (12.5 px in `themes/tokens.css`, 11.5 px in one theme block of `themes/themes.css`). The grid takes `fontSize` from a new `terminal.font_px` key of `config/appearance.yml` (a number of CSS pixels, with a comment in the file's own voice, default 12.5); when the key is absent the grid uses the computed `--fs-md` of the body, read the way `palette()` already reads the theme's tokens. `state/appearance.ts` gains `terminalFontPx(): number | null` beside `crtDefault()`, read from the merged config in `setAppearance()` with the `numberAt` helper the file has (bounded, say 6 to 40), and the view calls `fit.fit()` after the font is set, since the cell size changes with it. Tests: `tests/ui/theme.test.ts` (127 lines, where `crtDefault` is tested) asserts the key read, the bound and the null when absent; `tests/views/sessions.test.ts` needs nothing new for this item because the grid is built in the browser alone.

2. **The screen survives a view switch.** Switching the pane from the terminal to another view and back mounts `Terminal.svelte` again; its effect calls `subscribePty`, which sends the subscribe message, and the server's `#attach` in `server/pty/channel.ts` returns at `if (sinks.has(sink)) return;` because this socket is still attached: the page has no unsubscribe on the wire (`state/socket.svelte.ts` `unsubscribe()` only drops the channel from the next reconnect's list). No scrollback is sent, and the grid stays blank until the pane prints something. Fix on the server: a subscribe message naming a pty channel the sink is already attached to is a request for the screen, so `#attach` sends the version-0 scrollback again (the same capture-pane path, the same CR LF rewrite) and changes nothing else; the client's `term.reset()` on version 0 already repaints from it. Test: `tests/server/pty/channel.test.ts` (302 lines; `subscribed(page.sink, [CHANNEL], TOKEN)` is the shape) gains one case, a second `subscribed` on the same sink yields a second version-0 message with the current capture and no duplicate chunk delivery afterwards.

3. **Up arrow recalls the previous command line: established as working, nothing to build.** The path is correct in the tree: xterm's `onData` sends ESC [ A, `splitKeys()` in `server/pty/tmux.ts` maps it to tmux's `Up`, and a zsh started the way `startArgs()` starts one recalls the line on `Up` (probed 2026-09-12 with `tmux new-session -d -s oculus-probe -c ~ -x 80 -y 12 /bin/zsh`, `send-keys -l 'echo one two'`, `Enter`, `Up`, `capture-pane`: the line came back), and in Chrome on the built server on 2026-09-12 a shell terminal on the TEST page, clicked into and typed `echo one two`, Enter, then the up arrow, showed `echo one two` recalled at the prompt. The composer under the grid (`ui/Composer.svelte` line 72) has its own up-arrow history, per composer and in memory only. The worker changes nothing for this item and its report says so; what Axel saw goes back to him with the probe.

The screen wipe of item 2 was reproduced in the same Chrome check: the pane switched to Venues and back to Terminal drew an empty grid until the next output.

## Read, with line ranges

`src/lib/views/sessions/Terminal.svelte` whole (297); `src/lib/state/appearance.ts` whole (168); `src/lib/state/socket.svelte.ts` 85 to 120; `src/lib/server/pty/channel.ts` 240 to 300 and 380 to 445; `src/lib/server/pty/sessions.ts` 320 to 355; `src/lib/server/pty/tmux.ts` 277 to 355; `src/lib/ui/Composer.svelte` 55 to 95; `config/appearance.yml` whole (55); `src/lib/themes/tokens.css` 60 to 80; `tests/server/pty/channel.test.ts` 1 to 60 and 125 to 160; `tests/views/sessions.test.ts` 540 to 570 and 640 to 670; `tests/ui/theme.test.ts` whole (127).

## Facts checked on the tree, 2026-09-12 (re-check at dispatch)

- `Terminal.svelte` passes no `fontSize`; xterm 6.0 defaults it to 15 (`node_modules/@xterm/xterm/src/common/services/OptionsService.ts` line 25).
- `config/appearance.yml` holds `themes`, `wallpaper` and `crt` and no `terminal` key; `state/appearance.ts` exports `setAppearance`, `themes`, `themeClass`, `themeLabel`, `defaultTheme`, `crtDefault`, `wallpaperSettings`, `wallpaperOnTheme`, `terminalTheme`.
- `state/socket.svelte.ts` `unsubscribe()` (line 104) sends nothing; `subscribe()` (line 92) sends the subscription only for channels not already in its list, so a remount after an unmount does send one.
- `server/pty/channel.ts` `#attach` (line 391) returns early for an attached sink before the capture.
- `splitKeys()` maps `ESC [ A` and `ESC O A` to `Up` (`tmux.ts` lines 284 and 290).

## Conventions

As the spec: four-space indentation, every file under 1000 lines, ASCII, no new dependency, no hardcoded config value (the default 12.5 lives in `appearance.ts` beside the wallpaper defaults, with the comment saying it is `--fs-md`'s number), head comments, the boundary, key and colour tests passing, lint clean, no test writing outside `mkdtemp`, no test asserting a known defect.

## Verify before you report

From `tools/oculus` in the worktree, each must hold and its output is quoted: 1. `npm test` (every earlier test included). 2. `npm run check` 0 errors 0 warnings. 3. `npm run build`. 4. `npm run format:check`. 5. `npm run lint` prints nothing. 6. `LC_ALL=C grep -rna '[^ -~]' src tests` prints nothing. 7. `find src tests config -type f | xargs wc -l | sort -rn | head -3`: every file under 1000 lines.

## Report

First line: anything NOT done, or "Everything in the brief is done". Then the DONE / NOT DONE table with the seven checks and their output verbatim (the watcher suites' EMFILE failures counted apart from any other failure, named), the files with line counts, the two built items each marked done or not, and item 3 as not changed, the config key added, every judgment call left open, and anything wrong or impossible in the brief.
