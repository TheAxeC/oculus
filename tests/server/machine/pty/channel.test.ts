// The pty channels on a real Hub with a recording sink and a recording driver. No tmux runs: the
// driver records the argument list every channel operation built, which is what makes "the input
// reached send-keys" an assertion rather than a process.

import { afterEach, describe, expect } from 'vitest';
import { Hub } from '../../../../src/lib/server/core/channels.ts';
import type { Sink } from '../../../../src/lib/server/core/channels.ts';
import {
    Terminals,
    ptyChannel,
    type TerminalDriver
} from '../../../../src/lib/server/machine/pty/channel.ts';
import { cursorArgs } from '../../../../src/lib/server/machine/pty/capture.ts';
import type { Message } from '../../../../src/lib/data/model/index.ts';
import { noop } from '../../../fixtures/doubles.ts';
import { it } from '../../../fixtures/scratch.ts';

const ID = 'a1b2c3-shell';
const CHANNEL = ptyChannel(ID);
const SESSION = `oculus-${ID}`;
const TOKEN = 'a token minted for this test';
const SCREEN = 'the pane as it stands\n';
const LIST = `${SESSION}\t1757500000\t0\tcat\t4242\t/tmp\ta name\n`;

/** A sink that keeps every message it was sent, in order. */
function recorder(): { sink: Sink; messages: Message[] } {
    const messages: Message[] = [];
    return {
        messages,
        sink: {
            send: (text: string) => {
                messages.push(JSON.parse(text) as Message);
                return Promise.resolve();
            },
            close: noop
        }
    };
}

/** The `display-message` answer of a pane one row high with the cursor at its start. */
const ONE_ROW = '0 0 1\n';

/** The value each flag of the `display-message` format holds in a pane no program has touched. */
const FLAGS_AT_RESET: Record<string, string> = { wrap_flag: '1', cursor_flag: '1' };

/**
 * The answer tmux gives to the format `cursorArgs` asks: each `#{name}` of that format replaced by
 * its value in `values`, else by the reset value of a flag, so the answer fits the format whatever
 * fields it holds.
 */
function answerWith(values: Record<string, string>): string {
    const format = cursorArgs(SESSION).at(-1) ?? '';
    const known = { ...FLAGS_AT_RESET, ...values };
    return format.replace(/#\{(\w+)\}/g, (_, name: string) => known[name] ?? '0') + '\n';
}

/** The text of every `capture-pane` a driver is asked for; the one arguments' list tells which. */
type Captures = (args: string[]) => string;

/** A driver that answers the reads and records every command. */
function driver(options: { answer?: string; captures?: Captures; alternateAfter?: string } = {}): {
    driver: TerminalDriver;
    calls: string[][];
    emit(id: string, bytes: Buffer): void;
    attached(): string[];
} {
    const calls: string[][] = [];
    let output: (id: string, bytes: Buffer) => void = noop;
    let ids: string[] = [];
    const captures = options.captures ?? (() => SCREEN);
    // The cursor answer a case gives, or that of the one-row pane of the screen above.
    const cursor = options.answer ?? ONE_ROW;
    const list = LIST;
    const controlled = false;
    return {
        calls,
        emit: (id, bytes) => output(id, bytes),
        attached: () => ids,
        driver: {
            run(args: string[]): Promise<string> {
                calls.push(args);
                if (args[0] === 'capture-pane') return Promise.resolve(captures(args));
                if (args[0] === 'list-sessions') {
                    return Promise.resolve(list);
                }
                if (args[0] === 'display-message') {
                    // The read of `#{alternate_on}` alone is the one made after the alternate
                    // screen.
                    const asked = args.at(-1) === '#{alternate_on}';
                    return Promise.resolve(asked ? (options.alternateAfter ?? '1\n') : cursor);
                }
                return Promise.resolve('');
            },
            onOutput(listener): void {
                output = listener;
            },
            onChange: noop,
            attached(next: string[]): void {
                ids = [...next];
            },
            live: () => controlled,
            serverRuns: () => Promise.resolve(false),
            close: noop
        }
    };
}

/** Let every promise already queued run; the attach and the input are both asynchronous. */
async function settle(): Promise<void> {
    for (let i = 0; i < 8; i += 1) await Promise.resolve();
}

const open: Terminals[] = [];

afterEach(() => {
    while (open.length > 0) open.pop()?.close();
});

function terminals(record = driver()): { held: Terminals; hub: Hub; driver: typeof record } {
    const hub = new Hub();
    const held = new Terminals(hub, { driver: record.driver, poll: 0 });
    open.push(held);
    return { held, hub, driver: record };
}

function encode(text: string): string {
    return Buffer.from(text, 'utf8').toString('base64');
}

describe('what the page may send back', () => {
    it('refuses input from a socket that carried no token', async () => {
        const { held, driver: record } = terminals();
        const page = recorder();
        held.subscribed(page.sink, [CHANNEL], undefined, TOKEN);
        await settle();
        record.calls.length = 0;
        held.inbound(
            page.sink,
            JSON.stringify({ type: 'input', channel: CHANNEL, bytes: encode('rm -rf .\r') })
        );
        await settle();
        expect(record.calls).toEqual([]);
    });
});

describe('a socket that closed', () => {
    it('stops the delivery and leaves the tmux session alone', async () => {
        const { held, hub, driver: record } = terminals();
        const page = recorder();
        held.subscribed(page.sink, [CHANNEL], TOKEN, TOKEN);
        await settle();
        const before = page.messages.length;

        held.remove(page.sink);
        hub.remove(page.sink);
        record.emit(ID, Buffer.from('after the close'));
        await settle();
        expect(page.messages).toHaveLength(before);
        expect(record.attached()).toEqual([]);
        // Nothing was killed: the only commands were the list, the capture and no more.
        expect(record.calls.map((args) => args[0])).toEqual([
            'list-sessions',
            'capture-pane',
            'display-message'
        ]);
    });
});

describe('the list the pages are told of', () => {
    /** One row of tmux's list for a task terminal whose line ended with status 0. */
    const endedRow = (pid: number): string =>
        [
            SESSION,
            '1757500000',
            '0',
            'latexmk',
            String(pid),
            '/tmp',
            'a build',
            '',
            '',
            '',
            '',
            '{"repo":"/tmp","name":"build"}',
            '1',
            '0',
            '777'
        ].join('\t') + '\n';

    it('changes when a task terminal ends with the status it had, in a process run again', async () => {
        const record = driver();
        let rows = endedRow(4242);
        record.driver.run = (args: string[]): Promise<string> =>
            Promise.resolve(args[0] === 'list-sessions' ? rows : '');
        const { held } = terminals(record);
        let told = 0;
        held.onChange(() => (told += 1));
        held.refresh();
        await settle();
        expect(told).toBe(1);
        // The build ran again and ended with the same status before the next read.
        rows = endedRow(4243);
        held.refresh();
        await settle();
        expect(told).toBe(2);
    });
});

/** What an attaching page is sent first, as the grid receives it: the message of version 0. */
async function attachedWith(record: ReturnType<typeof driver>): Promise<string> {
    const { held } = terminals(record);
    let deliver: (message: Message) => void = noop;
    const first = new Promise<Message>((resolve) => (deliver = resolve));
    const sink: Sink = {
        send: (text: string) => {
            deliver(JSON.parse(text) as Message);
            return Promise.resolve();
        },
        close: noop
    };
    held.subscribed(sink, [CHANNEL], TOKEN, TOKEN);
    const message = await first;
    expect(message.version).toBe(0);
    return Buffer.from((message.payload as { bytes: string }).bytes, 'base64').toString('utf8');
}

/** A capture's lines as tmux prints them: `name 1` to `name <count>`, one per row. */
function rows(name: string, count: number): string {
    return Array.from({ length: count }, (_, at) => `${name} ${at + 1}\n`).join('');
}

/** The grid is written lines that end in CR LF, and the last line has no final newline. */
function crlf(capture: string): string {
    return capture.replace(/\n$/, '').replace(/\n/g, '\r\n');
}

describe('a page that attaches', () => {
    const PLACED = 'the pane as it stands\u001b[1;1H';

    it.each<{ row: string; flags: Record<string, string>; modes: string }>([
        {
            row: 'bracketed paste, application cursor keys and mouse reporting set',
            flags: { bracket_paste_flag: '1', keypad_cursor_flag: '1', mouse_standard_flag: '1' },
            // The mouse reports come after the cursor keys, in the order of the flags.
            modes: '\u001b[?2004h\u001b[?1h\u001b[?1000h'
        },
        { row: 'no mode set', flags: {}, modes: '' }
    ])(
        "gives an attaching page the modes the pane's program set, after the screen: $row",
        async ({ flags, modes }) => {
            const answer = answerWith({
                cursor_x: '0',
                cursor_y: '0',
                pane_height: '1',
                alternate_on: '0',
                ...flags
            });
            expect(await attachedWith(driver({ answer }))).toBe(PLACED + modes);
        }
    );

    // A 40x6 pane with an editor in its alternate screen, 13 lines of history and the shell's
    // cursor saved at column 1, row 5, as tmux 3.7c answered for such a pane.
    const EDITOR = {
        alternate_on: '1',
        alternate_saved_x: '1',
        alternate_saved_y: '5',
        history_size: '13',
        cursor_x: '9',
        cursor_y: '1',
        pane_height: '6',
        keypad_cursor_flag: '1',
        mouse_standard_flag: '1',
        mouse_sgr_flag: '1'
    };
    const MODES = '\u001b[?1h\u001b[?1000h\u001b[?1006h';
    const HISTORY = rows('history', 13);
    const SHELL = rows('shell', 6);
    const EDITOR_SCREEN = rows('editor', 6);
    const PLACED_EDITOR = crlf(EDITOR_SCREEN) + '\u001b[2;10H';
    const TODAYS = crlf(SCREEN) + '\u001b[2;10H' + MODES;

    /**
     * What tmux gives for each capture: the history range (`-E -1`) is the history, or with no
     * history the alternate screen's top row; `-a` is the saved normal screen, or nothing once the
     * editor left; the range of the first capture (`-S` alone) is whatever the pane holds, which
     * is not what an attach to an editor uses, and each one made takes the next of `holds`, the
     * last one again once they run out.
     */
    function panes(history: string, saved: string, holds: string[] = [SCREEN]): Captures {
        const next = [...holds];
        return (args) => {
            if (args.includes('-a')) return saved;
            if (args.includes('-E')) return history === '' ? rows('editor', 1) : history;
            if (args.includes('-S')) return (next.length > 1 ? next.shift() : next[0]) ?? SCREEN;
            return EDITOR_SCREEN;
        };
    }

    // What the pane holds once the editor has left: the shell's text, not the editor's screen.
    const AFTER = 'the shell after the editor\n';
    // tmux answers one blank line to the saved-screen capture once the program has left.
    const BLANK_LINE = '\n';

    it.each([
        {
            row: 'alternate on, with history',
            values: EDITOR,
            captures: panes(HISTORY, SHELL),
            expected:
                crlf(HISTORY + SHELL) + '\u001b[6;2H\u001b[?1049h\u001b[H' + PLACED_EDITOR + MODES
        },
        {
            row: 'alternate on, no history',
            values: { ...EDITOR, history_size: '0' },
            captures: panes('', SHELL),
            expected: crlf(SHELL) + '\u001b[6;2H\u001b[?1049h\u001b[H' + PLACED_EDITOR + MODES
        },
        {
            row: 'alternate on, no saved cursor',
            values: { ...EDITOR, alternate_saved_x: '4294967295', alternate_saved_y: '4294967295' },
            captures: panes(HISTORY, SHELL),
            expected: crlf(HISTORY + SHELL) + '\u001b[?1049h\u001b[H' + PLACED_EDITOR + MODES
        },
        {
            row: 'alternate off',
            values: { ...EDITOR, alternate_on: '0' },
            captures: panes(HISTORY, SHELL),
            expected: TODAYS
        },
        {
            row: 'alternate_on unreadable',
            values: { ...EDITOR, alternate_on: 'yes' },
            captures: panes(HISTORY, SHELL),
            expected: TODAYS
        },
        {
            row: 'the editor gone before the saved screen was read',
            values: EDITOR,
            captures: panes(HISTORY, BLANK_LINE),
            expected: TODAYS
        },
        {
            row: 'the editor gone after the alternate screen was read',
            values: EDITOR,
            captures: panes(HISTORY, SHELL, [SCREEN, AFTER]),
            alternateAfter: '0\n',
            expected: crlf(AFTER) + '\u001b[2;10H' + MODES
        }
    ])(
        "gives an attaching page a pane's shell text, then the alternate buffer with the editor's screen: $row",
        async ({ values, captures, alternateAfter, expected }) => {
            const answer = answerWith(values);
            expect(await attachedWith(driver({ answer, captures, alternateAfter }))).toBe(expected);
        }
    );
});
