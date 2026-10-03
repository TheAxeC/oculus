// Layer 2, client state. The page's end of a terminal's `pty:` channel on the socket: the channel's
// name, the keystrokes and resizes a page writes on it, and the panes reading its output. The bytes
// of a pane are not state: a `pty:` channel is read through socket.listen and nothing of it is
// stored. The server sends the scrollback to the attaching socket alone at version 0 and counts the
// chunks from 1 (server/machine/pty/channel.ts, `#attach`), so the listener is told which of the
// two it was handed and a reconnect repaints rather than appending a second copy of the scrollback.
// The terminals store (terminals.svelte.ts) builds one wire over its socket and the order in which
// grids attach (pty-subscribe.ts).

import type { SocketStore } from '../../../shared/stores/shapes.ts';
import type { TerminalInput, TerminalResize } from '../../../../data/model/index.ts';
import { ptyBytesOf } from '../terminal-payloads.ts';
import { decodeBytes, encodeBytes } from './pty-bytes.ts';
import type { PtyOrder, PtySize } from './pty-subscribe.ts';

/** The prefix of a terminal's channel, the server's `ptyChannel` seen from the page. */
const PREFIX = 'pty:';

/** What a `pty:` subscriber is handed: the decoded bytes, and whether they are the scrollback. */
export type PtyListener = (bytes: Uint8Array, scrollback: boolean) => void;

/** The channel one terminal's output travels on. */
export function ptyChannel(id: string): string {
    return `${PREFIX}${id}`;
}

/** The page's calls on the `pty:` channels of its terminals. */
export function createPtyWire(socket: SocketStore, order: PtyOrder) {
    /** How many panes read each terminal's output now. */
    const reading = new Map<string, number>();

    /** Send keystrokes, which xterm.js's `onData` produced; held while a subscribe waits. */
    function sendInput(id: string, text: string): boolean {
        const input: TerminalInput = {
            type: 'input',
            channel: ptyChannel(id),
            bytes: encodeBytes(text)
        };
        const held = order.hold(id, input);
        return held ?? socket.send(input);
    }

    /**
     * Tell a terminal its pane's new size. Whole numbers from 1 to 2000, which is the range
     * server/machine/pty/channel.ts accepts.
     */
    function sendResize(id: string, cols: number, rows: number): boolean {
        const resize: TerminalResize = {
            type: 'resize',
            channel: ptyChannel(id),
            cols: Math.round(cols),
            rows: Math.round(rows)
        };
        return socket.send(resize);
    }

    /**
     * Read one terminal's output in a pane: the window takes `size` first, the channel is asked for
     * after it, and the call returned stops the reading.
     */
    function subscribePty(id: string, size: () => PtySize, onBytes: PtyListener): () => void {
        const channel = ptyChannel(id);
        reading.set(id, (reading.get(id) ?? 0) + 1);
        let released = false;
        const off = socket.listen(channel, (received) => {
            onBytes(decodeBytes(ptyBytesOf(received.payload)), received.version === 0);
        });
        const leave = order.attach(
            id,
            size,
            () => socket.subscribe([channel]),
            (message) => socket.send(message)
        );
        return () => {
            leave();
            off();
            if (released) return;
            released = true;
            const left = (reading.get(id) ?? 1) - 1;
            if (left > 0) reading.set(id, left);
            else reading.delete(id);
        };
    }

    /**
     * Stop reading one terminal's output, and stop asking for its channel on the next reconnect.
     */
    function unsubscribePty(id: string): void {
        socket.unsubscribe([ptyChannel(id)]);
    }

    return {
        sendInput,
        sendResize,
        subscribePty,
        unsubscribePty,
        subscribed: (id: string): boolean => (reading.get(id) ?? 0) > 0
    };
}
