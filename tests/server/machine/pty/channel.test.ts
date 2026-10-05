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

/** A driver that answers the two reads and records every command. */
function driver(): {
    driver: TerminalDriver;
    calls: string[][];
    emit(id: string, bytes: Buffer): void;
    attached(): string[];
} {
    const calls: string[][] = [];
    let output: (id: string, bytes: Buffer) => void = noop;
    let ids: string[] = [];
    const screen = SCREEN;
    // The pane the one-line screen above is: one row high, the cursor at its start.
    const cursor = '0 0 1\n';
    const list = LIST;
    const controlled = false;
    return {
        calls,
        emit: (id, bytes) => output(id, bytes),
        attached: () => ids,
        driver: {
            run(args: string[]): Promise<string> {
                calls.push(args);
                if (args[0] === 'capture-pane') return Promise.resolve(screen);
                if (args[0] === 'list-sessions') {
                    return Promise.resolve(list);
                }
                if (args[0] === 'display-message') {
                    return Promise.resolve(cursor);
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
