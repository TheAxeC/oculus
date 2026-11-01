Everything in the brief is done

The brief here means `briefs/O110.md` as amended by `briefs/O110-cases.md` (ruling Z1090, option A).

## Open items of the state file

`sed -n 184,190p .scratch/migration/orchestrator-state.md` prints the section heading and its note and no item:

> ## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)
>
> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

## The ruling this report carries

The first run found the brief's sentence "Every screen read through the control client follows from this one change" false. `control()` resolved `reply.lines.join('\n')` with no final newline, and `holdsSavedScreen` (`capture.ts:187-189`) and `alternateScreenAt` (`capture.ts:210`) rely on the newline `run` keeps. Ruling Z1090: `control()` resolves a successful reply with its final newline when it has lines and `''` when it has none, an `%error` keeps its text, no reader of `capture.ts` changes, the edge case reads "equals", and one slow test joins the step in `pane-screen.test.ts`.

## The cases' first run

All on `src` as it was at the base (`diff -q src/lib/server/machine/pty/tmux.ts <base copy>` printed nothing).

**The table test.** `npx vitest run tests/server/machine/pty/tmux.test.ts --reporter=verbose`

```
x tests/server/machine/pty/tmux.test.ts > the control stream > decodes a reply to the text the pane holds: 'a line of characters above ASCII'
x ... 'the same bytes cut inside a character'
x ... 'an %error line above ASCII'
ok ... 'a reply of ASCII alone'
ok ... 'an %output line between two ASCII replies'
ok ... keeps two panes apart while their output interleaves
Tests  3 failed | 3 passed (6)
```

The failing lines (characters above ASCII named):

```
- Expected "A<U+23FA><e-acute><U+2500><emoji>Z"
+ Received the same text double-encoded, each byte of it one character
- Expected "parse error: unknown command: foo-bad-<U+23FA>"
+ Received "parse error: unknown command: foo-bad-<a-circumflex><U+008F><masculine ordinal>"
```

The first three rows fail and the last two pass, as the brief says. The rows pass after the change (see the table below); the last two passed on both, so the behaviour they preserve held.

**The server's edge.** `LC_ALL=en_US.UTF-8 node --experimental-strip-types --no-warnings <scratchpad>/edge-case.mts "$PWD"`, in the wording the program had then:

```
client line lengths [8,120]
run line lengths [4,40]
client + newline equals run false
row of 40 U+2500 in client text false
U+23FA in client text false
emoji in client text false
read "capture-pane -p -e -J -S -100 -t" client + newline equals run false
read "display-message -p -t #{cursor_x} #{cursor_y" client + newline equals run true
read "capture-pane -p -e -J -S -100 -E -1 -t" client + newline equals run false
read "capture-pane -p -e -q -a -t" client + newline equals run false
read "capture-pane -p -e -t" client + newline equals run false
read "display-message -p -t #{alternate_on}" client + newline equals run true
paneScreen by client equals paneScreen by run false
```

**The two shapes.** `<scratchpad>/alt-shape.mts`, ASCII only, so decoding plays no part:

```
--- saved screen ends in a blank row, history above it
reads through the client 8
equal false
client "h0\r\nh1\r\nh2\r\nh3\r\nh4\r\nalt\r\n\r\n\r\n\r\n\u001b[1;4H"
run    "h0\r\nh1\r\nh2\r\nh3\r\nh4\r\nh5\r\nh6\r\nh7\r\nh8\r\nh9\r\n\u001b[6;1H\u001b[?1049h\u001b[Halt\r\n\r\n\r\n\r\n\r\n\u001b[1;4H"
--- saved screen ends in a written row, history above it
reads through the client 6
equal false
client "h0\r\nh1\r\nh2\r\nh3h4\r\nh5\r\nh6\r\nh7\r\nh8\r\nh9\u001b[6;3H\u001b[?1049h\u001b[Halt\r\n\r\n\r\n\r\n\u001b[1;4H"
run    "h0\r\nh1\r\nh2\r\nh3\r\nh4\r\nh5\r\nh6\r\nh7\r\nh8\r\nh9\u001b[6;3H\u001b[?1049h\u001b[Halt\r\n\r\n\r\n\r\n\r\n\u001b[1;4H"
```

**The slow test.** With the test written and `tmux.ts` unchanged, `npx vitest run tests/server/machine/pty/pane-screen.test.ts -t 'gives the same screen through the control client as through tmux' --reporter=verbose`:

```
x tests/server/machine/pty/pane-screen.test.ts > a private tmux server > gives the same screen through the control client as through tmux 111ms
AssertionError: expected 'h0\r\nh1\r\nh2\r\nh3\r\nh4\r\nalt\r\n...' to be 'h0\r\nh1\r\nh2\r\nh3\r\nh4\r\nh5\r\nh...' // Object.is equality
Tests  1 failed | 1 skipped (2)
```

## DONE / NOT DONE

| Item | State | Command | Last line of the final run |
| --- | --- | --- | --- |
| `createParser` decodes a reply line as UTF-8, `%output` and the splitting in `feed` stay per byte | DONE | `npx vitest run tests/server/machine/pty/tmux.test.ts` | `Tests  6 passed (6)` |
| `control()` resolves with the final newline, `''` for no lines, an `%error` as it stands | DONE | `npx vitest run tests/server/machine/pty/pane-screen.test.ts` | `Tests  2 passed (2)` |
| The table test, five rows | DONE | the first command above | `Tests  6 passed (6)` |
| The slow test, by name, failing first | DONE | the run above, then the second command | `Tests  2 passed (2)` |
| Head comments and doc comments (`tmux.ts`, `pane-screen.test.ts`) | DONE | `git diff src/lib/server/machine/pty/tmux.ts`, read | the comment-width check is in the next row |
| Verify list | DONE | `npm run test:quick` | `test:quick: 85.2 s; every command passed` |
| The server's edge, as ruled | DONE | `edge-case.mts`, below | `client equals run true` and `row of 40 U+2500 in client text true` |
| Six builders and `paneScreen` true | DONE | `edge-case.mts`, below | `paneScreen by client equals paneScreen by run true` |
| Both shapes | DONE | `alt-shape.mts`, below | `equal true`, twice |
| An empty capture and a command with no output | DONE | `edge-case.mts`, below | the four `edge` lines, each `true` |
| No new non-ASCII | DONE | `LC_ALL=C grep -n '[^ -~]' tests/server/machine/pty/tmux.test.ts tests/server/machine/pty/pane-screen.test.ts src/lib/server/machine/pty/tmux.ts` | prints nothing |
| List items and sentence length | DONE | read | no departure; the step's new sentences are the comments quoted in the diff |

`npm run test:quick`, as printed:

```
test:quick: 4 changed file(s), from git since HEAD
test:quick: 23 test file(s)
ok      prettier (1.0 s): All matched files use Prettier code style!
ok      ASCII gate (1.1 s)
ok      svelte-kit sync (2.4 s)
ok      svelte-check (13.5 s): 1793555211431 COMPLETED 576 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (13.7 s)
ok      vitest (36.9 s): Duration  18.92s (transform 23.54s, setup 0ms, import 66.47s, tests 4.39s, environment 3ms)
ok      vitest slow (80.5 s): Duration  62.44s (transform 36.43s, setup 0ms, import 83.98s, tests 105.34s, environment 2ms)
ok      vitest checks (82.6 s): Duration  64.49s (transform 31.65s, setup 0ms, import 58.15s, tests 107.11s, environment 2ms)
test:quick: 85.2 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth, other than the checks under tests/checks/source and tests/checks/tree, which run for any change under src, tests or utils; the build, the lint of unchanged files
```

The fourth file git counted is the untracked `.scratch/migration/agents/briefs/O110-cases.md`, the orchestrator's. The list ran twice: the first run was red on the ASCII gate alone, on `tests/server/machine/pty/tmux.test.ts:44` and `:91` in a file the step changed; that file was fixed and rerun alone (`Tests  6 passed (6)`), then the list ran once more. `npm run diagrams` ran right before each. No whole-suite command ran.

The final case run, after the last change, `LC_ALL=en_US.UTF-8 node --experimental-strip-types --no-warnings <scratchpad>/edge-case.mts "$PWD"`:

```
client line lengths [4,40]
run line lengths [4,40]
client equals run true
row of 40 U+2500 in client text true
U+23FA in client text true
emoji in client text true
read "capture-pane -p -e -J -S -100 -t" client equals run true
read "display-message -p -t #{cursor_x} #{cursor_y" client equals run true
read "capture-pane -p -e -J -S -100 -E -1 -t" client equals run true
read "capture-pane -p -e -q -a -t" client equals run true
read "capture-pane -p -e -t" client equals run true
read "display-message -p -t #{alternate_on}" client equals run true
edge ["set-option","-g","status","on"] "" "" true
edge ["capture-pane","-p","-P","-t"] "\n" "\n" true
edge ["capture-pane","-p","-S","3"] "\n" "\n" true
edge ["display-message","-p","-t","oculus-case"] "\n" "\n" true
paneScreen by client equals paneScreen by run true
```

`set-option` is the command with no output; `capture-pane -p -P` of no pending output is the empty capture; the other two are a capture of one blank row and an empty format.

`<scratchpad>/alt-shape.mts`, the final run:

```
--- saved screen ends in a blank row, history above it
reads through the client 6
equal true
client "h0\r\nh1\r\nh2\r\nh3\r\nh4\r\nh5\r\nh6\r\nh7\r\nh8\r\nh9\r\n\u001b[6;1H\u001b[?1049h\u001b[Halt\r\n\r\n\r\n\r\n\r\n\u001b[1;4H"
--- saved screen ends in a written row, history above it
reads through the client 6
equal true
client "h0\r\nh1\r\nh2\r\nh3\r\nh4\r\nh5\r\nh6\r\nh7\r\nh8\r\nh9\u001b[6;3H\u001b[?1049h\u001b[Halt\r\n\r\n\r\n\r\n\r\n\u001b[1;4H"
```

### The six argument builders of `capture.ts`

Each answer below is the read through the control client against `run` of the same arguments, from the run above, on a pane in its alternate screen with history; `paneScreen` reached each builder.

| Builder | Answer | Result |
| --- | --- | --- |
| `captureArgs` (`capture.ts:25`) | the pane's text | right: `client equals run true`, and the characters and the row of U+2500 are in it |
| `historyArgs` (`:35`) | the lines above the screen | right: equal, and with its final newline `alternateScreenAt` no longer joins its last line to the saved screen's first (`h3h4` is gone from the second shape) |
| `savedScreenArgs` (`:44`) | the saved normal screen | right: equal, and `holdsSavedScreen` counts every row (6 reads, the LEFT path not taken, in the first shape) |
| `alternateScreenArgs` (`:49`) | the program's screen | right: equal |
| `alternateOnArgs` (`:54`) | `0` or `1` | right: numbers and flags only, equal on the unchanged tree and after; `inAlternateScreen` trims |
| `cursorArgs` (`:88`) | numbers and flags | right: numbers and flags only, equal on the unchanged tree and after; `fieldsOf` runs `trimEnd` |

A control client's reply and `run`'s answer are the same text on every read above, so no reader of `capture.ts` can tell them apart on those inputs.

### Tests the step adds or changes

- `tests/server/machine/pty/tmux.test.ts`, 'decodes a reply to the text the pane holds: $name', five rows; its failing lines are under the first run.
- `tests/server/machine/pty/pane-screen.test.ts`, 'gives the same screen through the control client as through tmux', tagged slow by the file's describe, run alone with `npx vitest run`; its failing line is under the first run. Its pane holds history as well as a blank last row, so both readers above are reached.

No existing assertion, allow list or predicate changed: `diff <base>/tests/server/machine/pty/tmux.test.ts tests/server/machine/pty/tmux.test.ts` prints only added lines. In `pane-screen.test.ts` the changed lines are the head comment and the import line (`run` to `control, run`).

### Greps

- History words over added comment lines and test titles (`git diff -U0`, the words of the rules file): one hit, `so every chunk the command saw came before the call` in the `command` doc comment, an existing sentence rewrapped, which names the order of chunks and compares with no earlier state.
- Reuse: `grep -rn "'latin1').toString('utf8')" src tests` prints the one new line, `tmux.ts:261`; `grep -rn "reply\.lines\|\.lines\.join" src` prints the join in `control` and an unrelated `keys.ts:206`. No helper was added.
- Changed shape, the answer of `control().command`: `grep -rn "\.command(args\|control(" src tests` over the pty code gives `channel.ts:232`, `channel.ts:295`, `sessions.test.ts:78` (reads `%output` alone) and the new test, so every reader of the text goes through `capture.ts`.
- `sh utils/unused-exports.sh`, compared with the base's output in the scratchpad: the step added no line. The only differences are the base's three lines of knip failing to load `vite.config.ts` (`.svelte-kit/tsconfig.json` not found), absent from the later run.

### Comments and documents re-read

| Text | State |
| --- | --- |
| `tmux.ts` head comment | rewritten |
| `ControlReply` doc comment | rewritten |
| `ControlEvent.rest` | a doc comment added |
| `ControlClient.command` doc comment | rewritten |
| `createParser` doc comment | still true |
| `control` doc comment | still true |
| `decodeOutput` doc comment | still true |
| `TerminalDriver.read` doc comment, `channel.ts:175-180` | still true |
| `capture.ts` head comment and `paneScreen`, `screenAt`, `holdsSavedScreen` doc comments | still true |
| `pane-screen.test.ts` head comment | rewritten |
| `tmux.test.ts` head comment | still true: the rows are bytes recorded with `tmux -u -S <socket> -C attach-session \| od -c` on tmux 3.7c |
| `docs/HELP.md:463`, a resized terminal is drawn again from what tmux holds | still true; no action of a user changes, so `docs/HELP.md` and `docs/apps.md` are unchanged |

## Files with line counts

From `diff -rq` of the base copy against the worktree for the two files it holds, and `git status --short` for the third. Every path is on the write list as ruled.

| File | Lines (`wc -l`) | Changed (`git diff --stat`) |
| --- | --- | --- |
| `src/lib/server/machine/pty/tmux.ts` | 520 | 25 |
| `tests/server/machine/pty/tmux.test.ts` | 133 | 93 |
| `tests/server/machine/pty/pane-screen.test.ts` | 100 | 51 |
| `.scratch/migration/agents/reviews/O110-report.md` | this file | new |

## Every judgment call the brief left open

The orchestrator may reverse each one.

1. The table is an `it.each` titled 'decodes a reply to the text the pane holds: $name', the tree's form for a table (`tests/server/machine/lsp/uris.test.ts:337`), so each row reports alone and vitest prints each row's name in quotes. G90 should name it with "every row".
2. The slow test's pane holds history above the shell's screen as well as the blank last row the ruling names, so it reaches `alternateScreenAt`'s join as well as `holdsSavedScreen`.
3. A doc comment on `ControlEvent.rest` says it is held one character per byte, since decision 2 of the brief leaves it so and the type now reads differently from a reply's lines.
4. The reply test's characters are written `\u{23fa}`, a `\u` escape in brace form.
5. The base copy is two files in the scratchpad, since the brief names none.
6. The conversion stays one expression at the `block.lines.push` line, with no helper, since it has that one caller.

## Limitations

- A pane line that begins `%end ` or `%error ` inside a reply block ends the block early. The parser behaved so at the base and the step does not touch it; it is outside the step, since it is a matter of the protocol's framing and no character of the text.
- `\r` at a reply line's end is stripped in `feed`, as at the base, on the client path alone.
- Bytes in a reply that are not UTF-8 would become U+FFFD. Read on a private socket (`printf 'a\377b\342\217c\n'` in a pane, `capture-pane -p` through `tmux -u -C attach-session | od -c`), tmux has already replaced each with the three bytes of U+FFFD, as the brief says, so the decoding changes nothing there.
- An empty `%error` still reads `tmux refused`, so the `command` comment's "the text as tmux wrote it" holds when tmux wrote some.

## Host- and user-visible changes, for the look on landing

A builder runs no page, so each row's proof is the look on landing.

| View and state | Before | After |
| --- | --- | --- |
| A Terminal tab on a pane that holds box characters and a full-width U+2500 row, on a reload | each character above ASCII drawn as several wrong characters, the row of U+2500 about three times too long, wrapped over two rows | the text as tmux holds it, the row of U+2500 on one row |
| The same pane, on a return from another rail | the same wrong text | the same right text |
| The same pane, on selecting the terminal | the same wrong text | the same right text |
| The same pane, on a resize | the same wrong text | the same right text |
| Claude's input box at the bottom of its screen, after any of those | its border wraps and breaks the box | the box drawn whole |
| A pane with a program in its alternate screen (an editor), started with blank rows at the end of the screen, on a reload | the program's screen sent into the normal buffer, the shell's text and the alternate buffer lost, so leaving the program shows no restored shell text | the program's screen in the alternate buffer, and leaving it shows the shell's text |
| A pane in its alternate screen with history and a written last row, on a reload | the last history line and the first saved row on one line, seen after leaving the program | each on its own line |
| A pane being typed in | live output was right | nothing differs |

No wording, key, setting or wire format changes. The server log's `%error` lines in `capture.ts` carry their characters whole; no page shows them.

## Anything in the brief that was wrong or impossible

- "Every screen read through the control client follows from this one change: ... on the normal and the alternate screen" was wrong, on the evidence of `alt-shape.mts` under the first run. Ruled by Z1090 and fixed in this step; the final runs above show it holds now.
- "The control-client text plus a final newline equals the `run` text" in the edge case was replaced by the ruling.
- The brief's other premises reproduced: the recorded bytes (`od -c` on a private socket), the three failing and two passing rows, and the edge case's false.

## Sources of the case-run programs

Both are gone from the scratchpad as of this report, and both wrote nothing into the step's diff. Each takes the checkout's root as its argument.

`edge-case.mts`:

```ts
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2];
const { tmuxDriver } = await import(`${root}/src/lib/server/machine/pty/channel.ts`);
const { captureArgs, paneScreen } = await import(`${root}/src/lib/server/machine/pty/capture.ts`);
const { run } = await import(`${root}/src/lib/server/machine/pty/tmux.ts`);

const dir = mkdtempSync('/tmp/o110-');
const socket = join(dir, 's');
const session = 'oculus-case';
const id = 'case';
const options = { socket };
const row = '\\342\\224\\200'.repeat(40);
const shell =
    `printf '\\342\\217\\272 \\360\\237\\230\\200\\n${row}\\n'; ` +
    `tmux -S ${socket} wait-for -S ready; exec sleep 30`;
const tmux = (...args: string[]): string =>
    execFileSync('tmux', ['-u', '-S', socket, '-f', '/dev/null', ...args], { encoding: 'utf8' });

const driver = tmuxDriver(options);
try {
    tmux('new-session', '-d', '-s', session, '-x', '40', '-y', '6', shell);
    tmux('wait-for', 'ready');
    driver.attached([id]);
    const args = captureArgs(session, 100);
    const viaClient: string = await driver.read(id, args, () => undefined);
    const viaRun: string = await run(args, options);
    const lengths = (text: string): number[] => text.split('\n').slice(0, 2).map((l) => l.length);
    console.log('client line lengths', JSON.stringify(lengths(viaClient)));
    console.log('run line lengths', JSON.stringify(lengths(viaRun)));
    console.log('client equals run', viaClient === viaRun);
    console.log('row of 40 U+2500 in client text', viaClient.includes('\u{2500}'.repeat(40)));
    console.log('U+23FA in client text', viaClient.includes('\u{23fa}'));
    console.log('emoji in client text', viaClient.includes('\u{1f600}'));

    const history = Array.from({ length: 10 }, (_, i) => `h${i}\\342\\224\\200`).join('\\n');
    const alternate =
        `printf '${history}\\n\\033[?1049h\\033[H\\342\\217\\272 alt ${row}'; ` +
        `tmux -S ${socket} wait-for -S ready2; exec sleep 30`;
    tmux('new-session', '-d', '-s', 'oculus-alt', '-x', '40', '-y', '6', alternate);
    tmux('wait-for', 'ready2');
    driver.attached([id, 'alt']);
    const seen: { args: string[]; text: string }[] = [];
    const read = async (asked: string[]): Promise<string> => {
        const text: string = await driver.read('alt', asked, () => undefined);
        seen.push({ args: asked, text });
        return text;
    };
    const screenClient: string = await paneScreen('oculus-alt', 100, read);
    const screenRun: string = await paneScreen('oculus-alt', 100, (asked: string[]) =>
        run(asked, options)
    );
    for (const one of seen) {
        const same = one.text === (await run(one.args, options));
        const name = one.args.filter((a) => a !== 'oculus-alt').join(' ').slice(0, 44);
        console.log('read', JSON.stringify(name), 'client equals run', same);
    }
    for (const asked of [
        ['set-option', '-g', 'status', 'on'],
        ['capture-pane', '-p', '-P', '-t', session],
        ['capture-pane', '-p', '-S', '3', '-E', '3', '-t', session],
        ['display-message', '-p', '-t', session, '']
    ]) {
        const client = await driver.read('alt', asked, () => undefined);
        const direct = await run(asked, options);
        const said = [JSON.stringify(client), JSON.stringify(direct), client === direct];
        console.log('edge', JSON.stringify(asked.slice(0, 4)), ...said);
    }
    console.log('paneScreen by client equals paneScreen by run', screenClient === screenRun);
} finally {
    driver.close();
    tmux('kill-server');
    rmSync(dir, { recursive: true, force: true });
}
```

`alt-shape.mts`:

```ts
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2];
const { tmuxDriver } = await import(`${root}/src/lib/server/machine/pty/channel.ts`);
const { paneScreen } = await import(`${root}/src/lib/server/machine/pty/capture.ts`);
const { run } = await import(`${root}/src/lib/server/machine/pty/tmux.ts`);

const dir = mkdtempSync('/tmp/o110-');
const socket = join(dir, 's');
const options = { socket };
const tmux = (...args: string[]): string =>
    execFileSync('tmux', ['-u', '-S', socket, '-f', '/dev/null', ...args], { encoding: 'utf8' });
const lines = Array.from({ length: 10 }, (_, i) => `h${i}`).join('\\n');
const shapes = [
    { id: 'blank', ending: '\\n', note: 'saved screen ends in a blank row, history above it' },
    { id: 'full', ending: '', note: 'saved screen ends in a written row, history above it' }
];

const driver = tmuxDriver(options);
try {
    for (const shape of shapes) {
        const session = `oculus-${shape.id}`;
        const shell =
            `printf '${lines}${shape.ending}\\033[?1049h\\033[Halt'; ` +
            `tmux -S ${socket} wait-for -S ${shape.id}; exec sleep 30`;
        tmux('new-session', '-d', '-s', session, '-x', '40', '-y', '6', shell);
        tmux('wait-for', shape.id);
        driver.attached(shapes.map((one) => one.id));
        const reads: string[] = [];
        const read = async (args: string[]): Promise<string> => {
            reads.push(args.slice(0, 8).join(' '));
            return driver.read(shape.id, args, () => undefined);
        };
        const byClient: string = await paneScreen(session, 100, read);
        const byRun: string = await paneScreen(session, 100, (args: string[]) =>
            run(args, options)
        );
        console.log(`--- ${shape.note}`);
        console.log('reads through the client', reads.length);
        console.log('equal', byClient === byRun);
        console.log('client', JSON.stringify(byClient));
        console.log('run   ', JSON.stringify(byRun));
    }
} finally {
    driver.close();
    tmux('kill-server');
    rmSync(dir, { recursive: true, force: true });
}
```
