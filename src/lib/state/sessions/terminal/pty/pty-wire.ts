// Layer 2, client state. The page's end of a terminal's `pty:` channel on the socket: the channel's
// name, the keystrokes and resizes a page writes on it, and the panes reading its output. The bytes
// of a pane are not state: a `pty:` channel is read through socket.listen and nothing of it is
// stored. The server sends the scrollback to the attaching socket alone at version 0 and counts the
// chunks from 1 (server/machine/pty/channel.ts, `#attach`), so the listener is told which of the
// two it was handed and a reconnect repaints rather than appending a second copy of the scrollback.
// Every pane that starts reading asks for the channel on the socket, whether or not the page's
// subscription holds it already, so a pane that arrives by a move (a tab dropped across windows,
// a popped-out window closed) while another pane of the page still reads the terminal is sent the
// screen as a pane of a page load is. The channel leaves the subscription when its last pane stops
// reading.
//
// A pane that tells its terminal a new size asks for the channel again right behind the resize, and
// the server reads the screen after the resize has run. tmux and xterm.js each rewrap the lines
// they hold to the new width in their own way, and a shell redraws its prompt over what it takes
// the rewrapped lines to be, so a grid that only rewrapped can show other lines than tmux's pane
// holds; the screen sent again is tmux's own. A size the window already has asks for nothing. The
// terminals store (terminals.svelte.ts) builds one wire over its socket and the order in which
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
    /**
     * The size each terminal's window was last asked for on the socket while it could write, as
     * `cols x rows`; the server sizes nothing for a socket that cannot.
     */
    const sized = new Map<string, string>();

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
     * Send a terminal's new size on the socket. Whole numbers from 1 to 2000, which is the range
     * server/machine/pty/channel.ts accepts. False when the socket is not open.
     */
    function resizeOnSocket(id: string, cols: number, rows: number): boolean {
        const resize: TerminalResize = {
            type: 'resize',
            channel: ptyChannel(id),
            cols: Math.round(cols),
            rows: Math.round(rows)
        };
        if (!socket.send(resize)) return false;
        if (socket.admitted()) sized.set(id, `${String(resize.cols)}x${String(resize.rows)}`);
        return true;
    }

    /**
     * Tell a terminal its pane's new size, and ask for its screen again when the size changed for a
     * terminal a pane of this page reads on a socket that may write, once no subscribe of it waits
     * for its resize. False when the socket is not open.
     */
    function sendResize(id: string, cols: number, rows: number): boolean {
        const before = sized.get(id);
        if (!resizeOnSocket(id, cols, rows)) return false;
        const read = (reading.get(id) ?? 0) > 0 && !order.waits(id);
        if (read && socket.admitted() && sized.get(id) !== before) {
            socket.subscribe([ptyChannel(id)], true);
        }
        return true;
    }

    /**
     * Read one terminal's output in a pane: the window takes `size` first, on this socket when it
     * is admitted to write, the channel is asked for after it, and the call returned stops the
     * reading.
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
            () => socket.subscribe([channel], true),
            (message) => socket.send(message),
            (now) => socket.admitted() && resizeOnSocket(id, now.cols, now.rows)
        );
        return () => {
            leave();
            off();
            if (released) return;
            released = true;
            const left = (reading.get(id) ?? 1) - 1;
            if (left > 0) {
                reading.set(id, left);
                return;
            }
            reading.delete(id);
            sized.delete(id);
            socket.unsubscribe([channel]);
        };
    }

    return {
        sendInput,
        sendResize,
        subscribePty,
        subscribed: (id: string): boolean => (reading.get(id) ?? 0) > 0
    };
}
