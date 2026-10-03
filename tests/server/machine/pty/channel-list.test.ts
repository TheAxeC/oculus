// Layer 4, server test. How the terminal list is read from tmux and when it reaches the pages: the
// reads run concurrently and may answer in any order, a "no server" answer is confirmed by further
// reads before it is taken as an empty list, it is never taken while a control client runs (which
// only a running tmux server allows), a read that answers after the channels closed changes
// nothing, and the list's last field names the tmux server that answered.
//
// The driver is a stub whose `list-sessions` answers are held until the case settles them, one at a
// time and in the order the case chooses, and whose control client is live or not as the case says,
// so every ordering a real tmux can produce is an assertion and no tmux runs. Time is the fake
// clock of vitest.
//
// What this does NOT cover: a real tmux server failing to be reached, which no unit test can make
// happen, and the page closing a Terminal tab on an empty list, which is
// tests/state/client/terminal/terminal-tabs.test.ts.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Hub } from '../../../../src/lib/server/core/channels.ts';
import {
    NO_SERVER_CONFIRMS,
    NO_SERVER_CONFIRM_MS,
    Terminals,
    type TerminalDriver
} from '../../../../src/lib/server/machine/pty/channel.ts';
import { serverPid } from '../../../../src/lib/server/machine/pty/sessions.ts';
import { noop } from '../../../fixtures/doubles.ts';

const A = 'a1b2c3-shell';
const B = 'd4e5f6-shell';
const NO_SERVER = 'no server running on /private/tmp/tmux-501/default';
const NO_SOCKET = 'error connecting to /private/tmp/tmux-501/default (No such file or directory)';

/** The pid of the tmux server, which every row of the list carries as its last field. */
const SERVER = 9001;

/** One row of `list-sessions -F`, in the shape parseTerminal reads. */
function row(id: string, server?: number): string {
    const pid = server === undefined ? '' : `\t${server}`;
    return `oculus-${id}\t1757500000\t0\tzsh\t4242\t/tmp\t${id}\t\t\t\t${pid}\n`;
}

const LIST_A = row(A);
const LIST_AB = row(A) + row(B);
/** The list of a tmux that says which server answered. */
const LIST_A_SERVED = row(A, SERVER);

/** A read that has been asked and not answered yet. */
type Held = { resolve: (text: string) => void; reject: (error: Error) => void };

/** What the driver says of the tmux server beside its control clients, and what it was asked. */
type Server = { live: boolean; runs: boolean | 'fails'; asked: number[] };

/** A driver whose list reads wait to be answered, which counts them and says if a client runs. */
function holding(): { driver: TerminalDriver; reads: Held[]; client: Server } {
    const reads: Held[] = [];
    const client: Server = { live: false, runs: false, asked: [] };
    return {
        reads,
        client,
        driver: {
            run(args: string[]): Promise<string> {
                if (args[0] !== 'list-sessions') return Promise.resolve('');
                return new Promise((resolve, reject) => reads.push({ resolve, reject }));
            },
            onOutput: noop,
            onChange: noop,
            attached: noop,
            live: () => client.live,
            serverRuns(pid: number): Promise<boolean> {
                client.asked.push(pid);
                return client.runs === 'fails'
                    ? Promise.reject(new Error('ps failed'))
                    : Promise.resolve(client.runs);
            },
            close: noop
        }
    };
}

const open: Terminals[] = [];

function terminals(): {
    held: Terminals;
    reads: Held[];
    seen: string[][];
    client: Server;
} {
    const record = holding();
    const held = new Terminals(new Hub(), { driver: record.driver, poll: 0 });
    open.push(held);
    const seen: string[][] = [];
    held.onChange(() => seen.push((held.list() ?? []).map((one) => one.id)));
    return { held, reads: record.reads, seen, client: record.client };
}

/** Let the promises already queued run. */
async function settle(): Promise<void> {
    for (let i = 0; i < 12; i += 1) await Promise.resolve();
}

const ids = (held: Terminals): string[] | null => held.list()?.map((one) => one.id) ?? null;

/** Answer every read as it is asked, with a no-server message, until no more are asked. */
async function refuseAll(made: ReturnType<typeof terminals>, said: string): Promise<void> {
    for (let round = 0; round <= NO_SERVER_CONFIRMS; round += 1) {
        await settle();
        for (const read of made.reads.splice(0)) read.reject(new Error(said));
        await vi.advanceTimersByTimeAsync(NO_SERVER_CONFIRM_MS);
    }
    await settle();
}

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    while (open.length > 0) open.pop()?.close();
    vi.useRealTimers();
});

describe('reads that answer out of order', () => {
    it('never replace a newer list with the answer of an older read', async () => {
        const { held, reads, seen } = terminals();
        held.refresh();
        expect(reads).toHaveLength(2);
        reads[1].resolve(LIST_AB);
        await settle();
        reads[0].resolve(LIST_A);
        await settle();
        expect(ids(held)).toEqual([A, B]);
        expect(seen).toEqual([[A, B]]);
    });

    it('take the older read when it answers first, and the newer after it', async () => {
        const { held, reads, seen } = terminals();
        held.refresh();
        reads[0].resolve(LIST_A);
        await settle();
        reads[1].resolve(LIST_AB);
        await settle();
        expect(ids(held)).toEqual([A, B]);
        expect(seen).toEqual([[A], [A, B]]);
    });

    it('keep the list a read started before a newer read failed in any other way', async () => {
        const { held, reads } = terminals();
        held.refresh();
        reads[1].reject(new Error('command timed out'));
        await settle();
        reads[0].resolve(LIST_A);
        await settle();
        expect(ids(held)).toEqual([A]);
    });

    it('show nothing while the first read is in flight, and the list once it answers', async () => {
        const { held, reads } = terminals();
        await settle();
        expect(held.list()).toBeNull();
        reads[0].resolve(LIST_A);
        await settle();
        expect(ids(held)).toEqual([A]);
    });
});

describe('a read that answers after close', () => {
    it('changes nothing and tells nobody', async () => {
        const { held, reads, seen } = terminals();
        held.close();
        reads[0].resolve(LIST_A);
        await settle();
        expect(held.list()).toBeNull();
        expect(seen).toEqual([]);
    });

    it('leaves no timer behind when it closes while a no-server answer waits to be confirmed', async () => {
        const { held, reads } = terminals();
        reads[0].reject(new Error(NO_SERVER));
        await settle();
        expect(vi.getTimerCount()).toBeGreaterThan(0);
        held.close();
        expect(vi.getTimerCount()).toBe(0);
        await vi.advanceTimersByTimeAsync(NO_SERVER_CONFIRM_MS * (NO_SERVER_CONFIRMS + 1));
        expect(reads).toHaveLength(1);
        expect(held.list()).toBeNull();
    });
});

describe('a no-server answer', () => {
    /** A Terminals that has listed A, with its first read answered. */
    async function listing(): Promise<ReturnType<typeof terminals>> {
        const made = terminals();
        made.reads[0].resolve(LIST_A);
        await settle();
        made.seen.length = 0;
        return made;
    }

    it('is not an empty list while a further read lists the terminals again', async () => {
        for (const said of [NO_SERVER, NO_SOCKET]) {
            const { held, reads, seen } = await listing();
            held.refresh();
            reads[1].reject(new Error(said));
            await settle();
            // In flight: the confirming read has not been asked, and the list is still the last.
            expect(reads).toHaveLength(2);
            expect(ids(held)).toEqual([A]);
            await vi.advanceTimersByTimeAsync(NO_SERVER_CONFIRM_MS);
            expect(reads).toHaveLength(3);
            expect(ids(held)).toEqual([A]);
            reads[2].resolve(LIST_A);
            await settle();
            expect(ids(held)).toEqual([A]);
            expect(seen).toEqual([]);
            held.close();
        }
    });

    it('is the empty list once the confirming reads say it too', async () => {
        for (const said of [NO_SERVER, NO_SOCKET]) {
            const { held, reads, seen } = await listing();
            held.refresh();
            reads[1].reject(new Error(said));
            for (let confirm = 0; confirm < NO_SERVER_CONFIRMS; confirm += 1) {
                await settle();
                expect(ids(held)).toEqual([A]);
                await vi.advanceTimersByTimeAsync(NO_SERVER_CONFIRM_MS);
                reads[2 + confirm].reject(new Error(said));
            }
            await settle();
            expect(reads).toHaveLength(2 + NO_SERVER_CONFIRMS);
            expect(ids(held)).toEqual([]);
            expect(seen).toEqual([[]]);
            held.close();
        }
    });

    it('is given up on when a newer read has listed the terminals meanwhile', async () => {
        const { held, reads, seen } = await listing();
        held.refresh();
        reads[1].reject(new Error(NO_SERVER));
        await settle();
        held.refresh();
        reads[2].resolve(LIST_AB);
        await settle();
        await vi.advanceTimersByTimeAsync(NO_SERVER_CONFIRM_MS * (NO_SERVER_CONFIRMS + 1));
        expect(reads).toHaveLength(3);
        expect(ids(held)).toEqual([A, B]);
        expect(seen).toEqual([[A, B]]);
    });

    it('is the first list when nothing was listed before, once it is confirmed', async () => {
        const { held, reads } = terminals();
        reads[0].reject(new Error(NO_SERVER));
        for (let confirm = 0; confirm < NO_SERVER_CONFIRMS; confirm += 1) {
            await settle();
            expect(held.list()).toBeNull();
            await vi.advanceTimersByTimeAsync(NO_SERVER_CONFIRM_MS);
            reads[1 + confirm].reject(new Error(NO_SERVER));
        }
        await settle();
        expect(ids(held)).toEqual([]);
    });

    it('is the only failure that is read again: any other one keeps the list and asks once', async () => {
        const { held, reads, seen } = await listing();
        held.refresh();
        reads[1].reject(new Error('command timed out'));
        await settle();
        await vi.advanceTimersByTimeAsync(NO_SERVER_CONFIRM_MS * (NO_SERVER_CONFIRMS + 1));
        expect(reads).toHaveLength(2);
        expect(ids(held)).toEqual([A]);
        expect(seen).toEqual([]);
    });
});

describe('a no-server answer while a control client runs', () => {
    /** A Terminals that has listed A, whose control client is live. */
    async function attached(): Promise<ReturnType<typeof terminals>> {
        const made = terminals();
        made.reads[0].resolve(LIST_A);
        await settle();
        made.seen.length = 0;
        made.reads.length = 0;
        made.client.live = true;
        return made;
    }

    it('is never the empty list, however long every read says it: the last list stands', async () => {
        for (const said of [NO_SERVER, NO_SOCKET]) {
            const made = await attached();
            made.held.refresh();
            await refuseAll(made, said);
            await vi.advanceTimersByTimeAsync(NO_SERVER_CONFIRM_MS * (NO_SERVER_CONFIRMS + 1) * 4);
            expect(ids(made.held)).toEqual([A]);
            expect(made.seen).toEqual([]);
            made.held.close();
        }
    });

    it('is the empty list when the control client stops during the confirming reads', async () => {
        const made = await attached();
        made.held.refresh();
        made.reads[0].reject(new Error(NO_SERVER));
        await settle();
        await vi.advanceTimersByTimeAsync(NO_SERVER_CONFIRM_MS);
        made.client.live = false;
        for (let confirm = 0; confirm < NO_SERVER_CONFIRMS; confirm += 1) {
            await settle();
            expect(ids(made.held)).toEqual([A]);
            made.reads.splice(0).forEach((read) => read.reject(new Error(NO_SERVER)));
            await vi.advanceTimersByTimeAsync(NO_SERVER_CONFIRM_MS);
        }
        await settle();
        expect(ids(made.held)).toEqual([]);
        expect(made.seen).toEqual([[]]);
    });
});

describe('a no-server answer with no control client, while the tmux server runs', () => {
    /** A Terminals that has listed A from a tmux that named its server, with no control client. */
    async function served(): Promise<ReturnType<typeof terminals>> {
        const made = terminals();
        made.reads[0].resolve(LIST_A_SERVED);
        await settle();
        made.seen.length = 0;
        made.reads.length = 0;
        return made;
    }

    it('is never the empty list while the server that last listed is a running tmux', async () => {
        for (const said of [NO_SERVER, NO_SOCKET]) {
            const made = await served();
            made.client.runs = true;
            made.held.refresh();
            await refuseAll(made, said);
            await vi.advanceTimersByTimeAsync(NO_SERVER_CONFIRM_MS * (NO_SERVER_CONFIRMS + 1) * 4);
            expect(ids(made.held)).toEqual([A]);
            expect(made.seen).toEqual([]);
            expect(made.client.asked).toEqual([SERVER]);
            made.held.close();
        }
    });

    it('is the empty list after the confirming reads when that server does not run', async () => {
        const made = await served();
        made.client.runs = false;
        made.held.refresh();
        await refuseAll(made, NO_SERVER);
        expect(ids(made.held)).toEqual([]);
        expect(made.seen).toEqual([[]]);
        expect(made.client.asked).toEqual([SERVER]);
    });

    it('is the empty list when asking whether the server runs fails', async () => {
        const made = await served();
        made.client.runs = 'fails';
        made.held.refresh();
        await refuseAll(made, NO_SERVER);
        expect(ids(made.held)).toEqual([]);
    });

    it('is the empty list after the confirming reads when no read ever named a server', async () => {
        const made = terminals();
        made.client.runs = true;
        made.reads[0].reject(new Error(NO_SERVER));
        for (let confirm = 0; confirm < NO_SERVER_CONFIRMS; confirm += 1) {
            await settle();
            expect(made.held.list()).toBeNull();
            await vi.advanceTimersByTimeAsync(NO_SERVER_CONFIRM_MS);
            made.reads.splice(0).forEach((read) => read.reject(new Error(NO_SERVER)));
        }
        await settle();
        expect(ids(made.held)).toEqual([]);
        expect(made.client.asked).toEqual([]);
    });

    it('keeps the server of a newer list when an older read answers after it', async () => {
        const made = await served();
        made.held.refresh();
        made.held.refresh();
        const [older, newer] = made.reads.splice(0);
        newer.resolve(row(A, 9002));
        await settle();
        older.resolve(row(A, 9003));
        await settle();
        made.client.runs = true;
        made.held.refresh();
        await refuseAll(made, NO_SERVER);
        expect(made.client.asked).toEqual([9002]);
    });
});

describe('the server a list names', () => {
    const fields = (name: string, cwd: string, title: string, server: string): string =>
        [name, '1757500000', '0', 'zsh', '4242', cwd, '', '', title, '', '', server].join('\t');

    it('is the pid in the last field of the list, the same on every row', () => {
        const list = `${fields('oculus-a1b2c3-shell', '/ws', '', '9001')}\n${fields('mine', '/ws', '', '9001')}\n`;
        expect(serverPid(list)).toBe(9001);
        // A session that is not an oculus terminal still says which server listed it.
        expect(serverPid(`${fields('mine', '/ws', '', '77')}\n`)).toBe(77);
    });

    it('is found when the first row holds a tab or a newline in its folder or its title', () => {
        const last = fields('oculus-zzzzzz-shell', '/ws', '', '60420');
        for (const [cwd, title] of [
            ['/ws/tab\tfolder', ''],
            ['/ws/odd\nfolder', ''],
            ['/ws', 'two\nlines']
        ]) {
            const list = `${fields('oculus-aaaaaa-shell', cwd, title, '60420')}\n${last}\n`;
            expect(serverPid(list)).toBe(60420);
        }
    });

    it('is none for a list in the older shape, no rows, or a last field that is no pid', () => {
        expect(serverPid('oculus-a1b2c3-shell\t1757500000\t0\tzsh\t4242\t/ws\t\t\t\t\t\n')).toBe(
            null
        );
        expect(serverPid('')).toBe(null);
        expect(serverPid(`${fields('mine', '/ws', '', 'x')}\n`)).toBe(null);
        expect(serverPid(`${fields('mine', '/ws', '', '0')}\n`)).toBe(null);
    });
});
