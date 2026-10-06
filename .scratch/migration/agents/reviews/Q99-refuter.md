# Step Q99 refuter report (on .agents/worktrees/Q99, base a92681a9)

## Verification (rerun by the reviewer)

```
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh /Users/axelfaes/.claude/skills/land/templates/verify.sh .../orchestrator-state.md </dev/null   (from the worktree's tools/oculus)
 Test Files  345 passed (345)
      Tests  5502 passed (5502)
COMPLETED 1476 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
All matched files use Prettier code style!
verify: 6 commands passed
exit 0

grep -rn "splitKeys\|keyName" src tests -> nothing, exit 1
grep -n "font-size\|<li" src/lib/views/system/workbench/Pages.svelte -> nothing, exit 1
npm run diagrams -> exit 0, docs/diagrams unchanged afterwards
spec.md ASCII gate -> nothing; DESIGN.md and HELP.md non-ASCII 0 and 0
largest file 898 lines (reproduced)
npx vitest run tests/server/machine/pty -> 6 files, 80 passed, none skipped (report says 77)
npx vitest run tests/views/system/workbench/pages.test.ts -> 7 passed
npx vitest run tests/checks/diagrams -> 67 passed
npx vitest run tests/checks/imports/order.test.ts -> 13 passed
npx vitest run tests/state/client tests/state/sessions tests/server/machine/pty tests/server/root/watch/sessions.test.ts -> 24 files, 266 passed

tmux 3.7c, private server -L q99review (killed): send-keys -H of 996 bytes exit 0, 997 bytes "command too long" exit 1; file 996 bytes after both.
printf '\033[<0;20;14M' | wc -c -> 11
Cursor landing through screenAt replayed into a fresh 80x24 pane: '2 2 24' history 0, '2 23 24' history 6, '5 20 24' history 18 each replayed to the same cursor with identical screens (md5).
noServer strings: "no server running on <sock>"; with -u a missing socket gives "error connecting to <path> (No such file or directory)"; run() always passes -u.
```

## 1. Spec

- `state/sessions/terminals.svelte.ts:330` with `Terminal.svelte:146`: a following tab showing a selected Claude or Codex session's terminal (through `terminalOfSession`) does not close when that terminal ends, since `selectedTerminal()` is null for a session id. The report lists it as a limitation. The brief's item 2 names "the selected terminal"; plan.md:223 point 2 says "a tab showing a terminal that has ended closes".
- Path list widened to `data/model/model-sessions.ts`, `server/sessions/index.ts`, `server/root/watch/sessions.ts` and its test (decision B, open item Z43). Every reader of `terminals` handles the missing field (page `terminals.svelte.ts:341-346`, `:361`; server `sessions/index.ts:59-60`, `watch/sessions.ts:161`, `stores/hooks.ts:91-106`). The "a message with no list ends nothing" rule is `terminals.svelte.ts:234`, tested.
- Rulings 2, 3, 4 built and tested; ruling 5 at `Pages.svelte:278`, the press not run. Decision 1's 4096 replaced by 996, reproduced.

## 2. Proof

- Report row 1: `npx vitest run tests/server/machine/pty` "77 tests"; the rerun gives 80.
- Report's open items copy says "- None."; the state file holds Z43.
- No test covers a first `sessions` message with no list followed by one with a list (see Behaviour).

## 3. Standards

- `DESIGN.md:264` "a mouse report, a focus report or a bracketed paste reaches the program in one write" and `server/machine/pty/channel.ts:495-498` (the same claim) are false for a paste over 996 bytes: `inputChunks` treats `ESC[200~` as a complete CSI, so the text between the markers is cut into several writes.
- `state/client/context.ts:57,181` and `terminals.svelte.ts:252,330`: `identity: stateId` is injected though the file already has `identity()` at `terminals.svelte.ts:191` doing the same for Terminal tab states.
- `server/root/watch/sessions.ts:99` "Absent in a process that has no terminals, where the payload carries none" is ambiguous under the optional field (no source still sends `terminals: []`).

## 4. Behaviour

- `state/sessions/terminals.svelte.ts:338-339`: `const first = !heard; heard = true;` spends "first message" on a message with no list, so after a reload before tmux answered, a tab pinned to a terminal that ended while the page was away never closes (breaks brief decision 3). Reproduced with a scratch vitest file: "tab still open after the list: true". Fix: set `first`/`heard` only on a message whose list is an array.
- Large input: before, a literal run was one `send-keys -l` word and tmux refuses a command over about 16.3 KB (16300 bytes through, 17000 refused); after, any size arrives in 996-byte commands, about 1 s per 100 KB. The report does not state it.
- A Pages row drag released back over the same row also fires the row's click (`switchPage`). Not verified on screen.
- Outside the diff: `steerArgs` (sessions.ts:460-462) sends a steer as one `send-keys -l` word while `STEER_MAX` is 100000, so a steer over about 16.3 KB is refused.

## Not checked

- Anything needing a DOM or the browser (the Pages press, hover, drag, Enter; the tab closing on screen; the grid after attach in xterm.js).
- What a following tab draws once a selected session's terminal is gone.

Reviewer usage: 62 tool uses, 203k tokens, 15 min.

## Repair round 1, refuted (reviewer a1c799351ef79b368, delta from bc5c3bef)

### Verification

`verify.sh` from the worktree's tools/oculus: red on `npm test`, `Test Files 1 failed | 344 passed (345)`, `Tests 2 failed | 5510 passed (5512)`; `npx vitest run tests/routes/sessions/compose.test.ts` alone gives `Tests 2 failed | 9 passed (11)` (lines 134 and 170 still expect `['send-keys', '-t', ..., '-l', '--', text]`). Not a timeout. By hand: `npm run check` 0 errors (1477 files), build exit 0, format clean, lint exit 0, ASCII gate empty, largest file 898 lines, `bin/folder-check.sh` exit 0. `npx vitest run tests/server/machine/pty` 82 passed; the report's combined run 38 files, 477 tests passed. Every revert the report quotes reproduced through a load-time rewrite plugin, and a row-press copy under node.

### 1. Spec

- `server/root/watch/sessions.ts:162` `terminals: options.terminals === undefined ? null : options.terminals.list()`: round item 5 asked for the comment only; the code was changed so the comment holds (before, a watcher with no source sent `terminals: []`). Inert in production (the one caller, `server/root/context.ts:251-258`, always passes `terminals`) and tested.

### 2. Proof

- `tests/routes/sessions/compose.test.ts:134` and `:170` red: item 7 changed `steerArgs`, and the test that expects its old shape was not updated.
- The same change sends a shell start's first command (compose's shell prompt, through `steerTerminal`) as `-H` bytes; the report's reader-visible changes do not name it.
- The report's limitation (a `sessions` message before the layout loads) does not happen: `src/routes/+page.svelte:195-212` connects and calls `loadLayout()` synchronously in one `onMount`, a WebSocket's `open` and `message` come in later tasks (`socket.svelte.ts:147-167`), nothing else feeds `sessions`, and the selection is never saved.

### 3. Standards

- `HELP.md:40` still says a paste "arrives whole and never as a lone Escape followed by text"; item 4 corrected the same claim in `DESIGN.md:264` and `channel.ts` (a paste over 996 bytes arrives in several writes, in order).

### 4. Behaviour

- None beyond the red compose test.

### Not checked

- The report's 100000-character timing; anything needing the browser; the real-tmux steer beyond its pass; whether the page's write timeout covers a 302-command steer at STEER_MAX (300000 bytes of 3-byte characters, each command with its own 5 s timeout, `tmux.ts:25`).

Reviewer usage: about 45 tool uses, about 12 min.

# Closed

- First review: every finding went into repair round 1 (`agents/briefs/Q99-round1-sent.md`), and the round refutation above checked each closure.
- Proof, `compose.test.ts:134` and `:170` red: fixed at landing; both cases expect the `-H` bytes of the text, then Enter.
- Proof, the shell start's first command sent as `-H` bytes: stated in the booking.
- Proof, the report's limitation about a `sessions` message before the layout: corrected in the booking.
- Standards, `HELP.md` terminal row: fixed at landing, in the words of `DESIGN.md` and `channel.ts`.
- Spec, `watch/sessions.ts:162`: accepted and stated in the booking.
- Not checked, the write timeout at STEER_MAX: measured at landing, 6566 ms for 303 commands, under 30 s.
