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
| `createParser` decodes a reply line as UTF-8, `%output` and the splitting in `feed` stay per byte | DONE | `npx vitest run tests/server/machine/pty/tmux.test.ts` | `Tests  9 passed (9)` |
| `control()` resolves with the final newline, `''` for no lines, an `%error` as it stands | DONE | `npx vitest run tests/server/machine/pty/pane-screen.test.ts` | `Tests  2 passed (2)` |
| The table test, five rows and the round's three | DONE | the first command above | `Tests  9 passed (9)` |
| The slow test, by name, failing first | DONE | the run above, then the second command | `Tests  2 passed (2)` |
| Head comments and doc comments (`tmux.ts`, `pane-screen.test.ts`) | DONE | `git diff src/lib/server/machine/pty/tmux.ts`, read | the comment-width check is in the next row |
| Verify list | DONE | `npm run test:quick` | `test:quick: 50.1 s; every command passed` |
| The server's edge, as ruled | DONE | `edge-case.mts`, below | `client equals run true` and `row of 40 U+2500 in client text true` |
| Six builders and `paneScreen` true | DONE | `edge-case.mts`, below | `paneScreen by client equals paneScreen by run true` |
| Both shapes | DONE | `alt-shape.mts`, below | `equal true`, twice |
| An empty capture and a command with no output | DONE | `edge-case.mts`, below | the four `edge` lines, each `true` |
| No new non-ASCII | DONE | `LC_ALL=C grep -n '[^ -~]' tests/server/machine/pty/tmux.test.ts tests/server/machine/pty/pane-screen.test.ts src/lib/server/machine/pty/tmux.ts` | prints nothing |
| List items and sentence length | DONE | read | no departure; the step's new sentences are the comments quoted in the diff |

`npm run test:quick`, as printed by the last run:

```
test:quick: 7 changed file(s), from git since HEAD
test:quick: 23 test file(s)
ok      prettier (0.6 s): All matched files use Prettier code style!
ok      ASCII gate (0.7 s)
ok      svelte-kit sync (2.0 s)
ok      eslint (2.4 s)
ok      svelte-check (9.0 s): 1793556354954 COMPLETED 576 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (23.8 s): Duration  13.06s (transform 18.83s, setup 0ms, import 46.69s, tests 3.38s, environment 4ms)
ok      vitest slow (46.8 s): Duration  36.07s (transform 15.67s, setup 0ms, import 39.18s, tests 64.76s, environment 2ms)
ok      vitest checks (48.0 s): Duration  37.15s (transform 14.10s, setup 0ms, import 29.85s, tests 62.54s, environment 3ms)
test:quick: 50.1 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth, other than the checks under tests/checks/source and tests/checks/tree, which run for any change under src, tests or utils; the build, the lint of unchanged files
```

The seven files git counted are the three of the step and four untracked files under `.scratch/`: this report and the orchestrator's `O110-cases.md`, `O110-round1.md` and `O110-refuter.md`. The list ran five times in all, `npm run diagrams` right before each, and no whole-suite command ran; "Repair round 1" below accounts for the last three.

- Run 1, red on the ASCII gate alone, on `tests/server/machine/pty/tmux.test.ts:44` and `:91`, a file the step changed; that file was fixed and rerun alone (`Tests  6 passed (6)`).
- Run 2, every command passed.

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
- Reuse: `grep -rn "'latin1').toString('utf8')" src tests` prints the one new line, `tmux.ts:265`; `grep -rn "reply\.lines\|\.lines\.join" src` prints the join in `control` and an unrelated `keys.ts:206`. No helper was added.
- Changed shape, the answer of `control().command`: `grep -rn "\.command(args\|control(" src tests` over the pty code gives `channel.ts:232`, `channel.ts:295`, `sessions.test.ts:78` (reads `%output` alone) and the new test, so every reader of the text goes through `capture.ts`.
- `sh utils/unused-exports.sh`, compared with the base's output in the scratchpad: the step added no line. The only differences are the base's three lines of knip failing to load `vite.config.ts` (`.svelte-kit/tsconfig.json` not found), absent from the later run.

### Comments and documents re-read

| Text | State |
| --- | --- |
| `tmux.ts` head comment | rewritten |
| `ControlReply` doc comment | rewritten |
| `ControlEvent.rest` | a doc comment added |
| `ControlClient.command` doc comment | rewritten |
| `createParser` doc comment | rewritten |
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
| `src/lib/server/machine/pty/tmux.ts` | 525 | 44 |
| `tests/server/machine/pty/tmux.test.ts` | 174 | 134 |
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

# Repair round 1

Everything in `briefs/O110-round1.md` is done. The figures in the sections above that this round moved (test counts, the verify list, line counts, `tmux.ts:265`) are taken after the round's last change.

## The failure, before the change

Each new row is built from bytes recorded with `tmux -u -S <socket> -f /dev/null -C attach-session -t rec`, three `capture-pane -p -S <n> -E <m>` commands written to it, on tmux 3.7c. The recording printed:

```
%begin 1793556060 298 1
first
%end of the abstract
after one
%end 1793556060 298 1
%begin 1793556060 299 1
first
%error bars from bootstrap
%end 1793556060 299 1
%begin 1793556060 300 1
first
%end x
%output %0 injected
%end 1793556060 300 1
```

`npx vitest run tests/server/machine/pty/tmux.test.ts --reporter=verbose`, with the rows written and `tmux.ts` as it stood:

```
x ... decodes a reply to the text the pane holds: 'a pane line that begins %end'
x ... 'a pane line that begins %error'
x ... 'pane lines that begin %end and %output, which hand on no output'
AssertionError: expected [ { number: '298', ...(2) } ] to deeply equal [ { number: '298', ...(2) } ]
-       "%end of the abstract",
-       "after one",
AssertionError: expected [ { number: '299', ...(2) } ] to deeply equal [ { number: '299', ...(2) } ]
-     "error": false,
+     "error": true,
-       "%error bars from bootstrap",
AssertionError: expected [ { number: '300', ...(2) } ] to deeply equal [ { number: '300', ...(2) } ]
-       "%end x",
-       "%output %0 injected",
      Tests  3 failed | 6 passed (9)
```

The framing cases on the same code, `LC_ALL=en_US.UTF-8 node --experimental-strip-types --no-warnings <scratchpad>/framing.mts "$PWD"`:

```
--- plain: no percent line
equal true
every line in client true
--- pctend: %end
equal false
client "first\u001b[5;1H"
every line in client false
pty: no scrollback for oculus-pcterr: first
--- pcterr: %error
equal false
client "\u001b[4;1H"
every line in client false
pty: the cursor of oculus-pctbeg did not read, the whole capture is sent
--- pctbeg: %end then %begin
equal false
client "first\r\n"
every line in client false
--- pctout: %end then %output
equal false
client "first\u001b[5;1H"
every line in client false
output handed to the page {"pctout":"injected"}
```

## What changed

- `src/lib/server/machine/pty/tmux.ts`, `createParser`: a block keeps the three arguments of its `%begin` line (`args`) and closes only on `%end ${args}` or `%error ${args}`, compared whole. Every other line inside a block is a reply line. The comment on the `%begin` branch says tmux repeats all three.
- The `createParser` doc comment says how a block closes and, in one clause, that a pane line equal to the block's own closing line ends the block, a limit of tmux's framing.
- `tmux.ts:17-18` and the `command` doc comment are reread and true with the item above, so they are unchanged.
- `tests/server/machine/pty/tmux.test.ts`: three rows in the table 'decodes a reply to the text the pane holds', the file formatted with `npx prettier --write tests/server/machine/pty/tmux.test.ts`.
- `cmd-queue.c` gives both guards of a command one time, number and flags, and the recordings above and the attach's own `%begin 1793556060 293 0` and `%end 1793556060 293 0` show it.

No existing assertion, allow list or predicate changed in this round.

## The runs, after the last change

| Run | Command | Last lines |
| --- | --- | --- |
| The table test | `npx vitest run tests/server/machine/pty/tmux.test.ts` | `Tests  9 passed (9)` |
| The slow test's file | `npx vitest run tests/server/machine/pty/pane-screen.test.ts` | `Tests  2 passed (2)` |
| The framing cases | `framing.mts`, below | `equal true` and `every line in client true` for all five panes, `output handed to the page {}` |
| The earlier case programs | `edge-case.mts` and `alt-shape.mts`, from the source quoted above | every line as quoted in the DONE section: `client equals run true` six times, the four `edge` lines true, `paneScreen by client equals paneScreen by run true`, `equal true` twice |
| Verify list | `npm run test:quick` | `test:quick: 50.1 s; every command passed` |
| Exports | `sh utils/unused-exports.sh`, compared with the base's | no line added; the only differences are the base's three knip load-failure lines |
| ASCII | `LC_ALL=C grep -n '[^ -~]'` over the three changed files | prints nothing |

`framing.mts`, the final run:

```
--- plain: no percent line
equal true
every line in client true
--- pctend: %end
equal true
every line in client true
--- pcterr: %error
equal true
every line in client true
--- pctbeg: %end then %begin
equal true
every line in client true
--- pctout: %end then %output
equal true
every line in client true
output handed to the page {}
```

The history-words grep over the added lines (`git diff -U0`) has the one hit named above, the rewrapped `came before the call`.

## The verify list in this round

It ran three times.

- Run 3, red on prettier alone, on `tests/server/machine/pty/tmux.test.ts`, a file the step changed. That file was formatted and rerun alone: `Tests  9 passed (9)`.
- Run 4, red on `vitest slow` alone: `tests/server/machine/pty/sessions.test.ts`, 'starts, lists, feeds, resizes, captures and stops a terminal', `Error: timed out waiting for the typed line to come back as output`, at `sessions.test.ts:94`. The step does not change that file, though it imports `tmux.ts`. Rerun alone three times: `Tests  1 passed (1)` each. Load average at that moment: 7.44. By reading, `sessions.test.ts:78-93` starts its control client and types through `run` with no `await client.ready()`, so a line typed before the client has attached is never seen as output; in my judgment that race in the test is the cause, and not the parser, since the failure did not repeat. Not verified by a run that forces it. The test is unchanged. A block that never closed would have stopped every later reply and output of that client, and no such reply went missing in runs 2 and 5.
- Run 5, every command passed.

## Limitations of the round

- A pane line equal to the block's own closing line, the time, the command number and the flags all matching, ends the block. It is tmux's framing, and the parser's doc comment says so.
- The parser relies on tmux repeating the three arguments unchanged. If a tmux version did not, a block would never close. tmux 3.7c does, and `cmd-queue.c` gives both guards the same arguments.
- The race in `sessions.test.ts` above is outside the step, since it is a defect of a test no change of this step touches. It may redden a list run under load.

## Host- and user-visible changes of the round, for the look on landing

A builder runs no page, so the look is the proof. A pane that printed `first`, `%end of the abstract`, `after one` showed `first` alone without this round's change and shows all three lines with it, on a reload, a return from another rail, selecting the terminal and a resize. A pane that printed a line beginning `%error ` showed a blank screen without it and shows its text with it. No text of such a pane reaches the page as live output.

## Source of `framing.mts`

Gone from the scratchpad as of this report, as are the other two programs, and it wrote nothing into the step's diff. Its one argument is the checkout's root.

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
const panes = [
    { id: 'plain', note: 'no percent line', lines: ['first', 'second'] },
    { id: 'pctend', note: '%end', lines: ['first', '%end of the abstract', 'after one', 'after two'] },
    { id: 'pcterr', note: '%error', lines: ['first', '%error bars from bootstrap', 'after one'] },
    { id: 'pctbeg', note: '%end then %begin', lines: ['first', '%end x', '%begin 1 2 3', 'last'] },
    { id: 'pctout', note: '%end then %output', lines: ['first', '%end x', '%output %0 injected', 'z'] }
];

const driver = tmuxDriver(options);
const handed: Record<string, string> = {};
driver.onOutput((id: string, bytes: Buffer) => {
    handed[id] = (handed[id] ?? '') + bytes.toString('utf8');
});
try {
    for (const pane of panes) {
        const session = `oculus-${pane.id}`;
        const text = pane.lines.map((line) => line.replaceAll('%', '%%')).join('\\n');
        const shell = `printf '${text}\\n'; tmux -S ${socket} wait-for -S ${pane.id}; exec sleep 30`;
        tmux('new-session', '-d', '-s', session, '-x', '60', '-y', '8', shell);
        tmux('wait-for', pane.id);
        driver.attached(panes.map((one) => one.id));
        const read = (args: string[]): Promise<string> =>
            driver.read(pane.id, args, () => undefined);
        const byClient: string = await paneScreen(session, 100, read);
        const byRun: string = await paneScreen(session, 100, (args: string[]) => run(args, options));
        console.log(`--- ${pane.id}: ${pane.note}`);
        console.log('equal', byClient === byRun);
        if (byClient !== byRun) console.log('client', JSON.stringify(byClient).slice(0, 120));
        console.log('every line in client', pane.lines.every((line) => byClient.includes(line)));
    }
    console.log('output handed to the page', JSON.stringify(handed));
} finally {
    driver.close();
    tmux('kill-server');
    rmSync(dir, { recursive: true, force: true });
}
```
