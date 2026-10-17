// Layer 2, client state. The order in which a grid attaches to a terminal: the window takes the
// grid's size, and only then is the `pty:` channel asked for, since the server answers a subscribe
// with the pane captured at the window's size and the cursor placed from the pane's top
// (server/machine/pty/capture.ts, `screenAt`). A window taller than the grid, as the last grid to
// show the terminal left it, would otherwise fill the grid with the blank rows under the cursor and
// put every line above them out of view.
//
// On a socket that is open and admitted to write, the resize goes out on the socket right ahead of
// the subscribe, and the server reads the pane after it has run, so a grid is drawn as soon as the
// socket answers, a reload included, with no request to wait for. On any other socket the resize is
// posted and the channel is asked for after its answer. The resizes of one terminal go out one
// after another, so a grid mounted while the grid before it still waits on its answer (a remount,
// two quick moves of a tab) leaves the window at the size of the last one. Input typed while a
// subscribe waits is held and written right after it, since the server drops what a socket types
// before it is attached to the channel. The terminals store (terminals.svelte.ts) hands this module
// the post of a resize, and the wire (pty-wire.ts) the resize on the socket.

/** The size of a grid in cells. */
export type PtySize = { cols: number; rows: number };

/**
 * How long a resize that has not answered is waited for, in milliseconds. A tmux `resize-window`
 * answers in milliseconds, and a grid left blank longer than two seconds reads as broken, so a
 * request that never returns counts as answered.
 */
export const RESIZE_WAIT = 2000;

/** One subscribe that has not asked for its channel yet. */
type Waiting = {
    /** False once the listener was taken off: no subscribe is made and its input is dropped. */
    live: boolean;
    /** The messages typed while it waited, in order. */
    held: unknown[];
};

/** The order in which grids attach to terminals. */
export type PtyOrder = {
    /**
     * Resize the terminal's window to what `size` answers, then call `subscribe` and write the
     * input held meanwhile through `send`. `ahead` sends the resize on the socket and answers false
     * when the socket cannot take it; the resize is then posted, again for as long as the answer
     * changes while one is out, and `subscribe` waits for its answer. The call returned takes the
     * listener off: nothing more is posted or subscribed, and the held input is dropped.
     */
    attach: (
        id: string,
        size: () => PtySize,
        subscribe: () => void,
        send: (message: unknown) => boolean,
        ahead: (size: PtySize) => boolean
    ) => () => void;
    /**
     * Take a message for a terminal whose subscribe is waiting. True when it is held, false when
     * the only listeners waiting were taken off and it is dropped, and null when nothing waits, so
     * the caller writes it.
     */
    hold: (id: string, message: unknown) => boolean | null;
};

/** An answer of `request`, or `RESIZE_WAIT` passing, whichever comes first. */
function answered(request: Promise<unknown>): Promise<void> {
    return new Promise((done) => {
        const timer = setTimeout(done, RESIZE_WAIT);
        const finish = (): void => {
            clearTimeout(timer);
            done();
        };
        request.then(finish, finish);
    });
}

/** The order over `resize`, the store's post of a resize, which never rejects. */
export function createPtyOrder(
    resize: (id: string, cols: number, rows: number) => Promise<unknown>
): PtyOrder {
    const waiting = new Map<string, Waiting[]>();
    /** The last resize chain of each terminal, which the next subscribe's resize waits for. */
    const tails = new Map<string, Promise<void>>();

    function leave(id: string, entry: Waiting): void {
        const rest = (waiting.get(id) ?? []).filter((one) => one !== entry);
        if (rest.length === 0) waiting.delete(id);
        else waiting.set(id, rest);
    }

    /** Post the size until it holds still across an answer; false when the listener left. */
    async function settle(id: string, entry: Waiting, size: () => PtySize): Promise<boolean> {
        const left = (): boolean => !entry.live;
        let sent = size();
        while (!left()) {
            await answered(resize(id, sent.cols, sent.rows));
            if (left()) return false;
            const now = size();
            if (now.cols === sent.cols && now.rows === sent.rows) return true;
            sent = now;
        }
        return false;
    }

    return {
        attach(id, size, subscribe, send, ahead) {
            const entry: Waiting = { live: true, held: [] };
            waiting.set(id, [...(waiting.get(id) ?? []), entry]);
            const run = async (): Promise<void> => {
                try {
                    if (!entry.live) return;
                    if (ahead(size()) || (await settle(id, entry, size))) {
                        subscribe();
                        for (const message of entry.held) send(message);
                    }
                } finally {
                    leave(id, entry);
                }
            };
            // The first resize of a terminal is posted in this call; later ones wait their turn.
            const before = tails.get(id);
            const mine = before === undefined ? run() : before.then(run, run);
            tails.set(id, mine);
            void mine.finally(() => {
                if (tails.get(id) === mine) tails.delete(id);
            });
            return () => {
                entry.live = false;
                entry.held.length = 0;
            };
        },
        hold(id, message) {
            const entries = waiting.get(id);
            if (entries === undefined) return null;
            const newest = [...entries].reverse().find((one) => one.live);
            if (newest === undefined) return false;
            newest.held.push(message);
            return true;
        }
    };
}
