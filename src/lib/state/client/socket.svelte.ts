// Layer 2, client state. The page's end of the one WebSocket: subscribe on open, hand every
// message to entities, reconnect when it drops. The server reloads on a source change in
// development (DESIGN.md, "Hot reload", second row), so a reconnect is a normal event and not an
// error state; the backoff exists so a server that is down does not spin the page.
//
// The catalog arrives on the `config` channel and is installed here rather than in entities,
// because state/words/text.ts holds it outside the reactive graph: the page's first render uses the
// catalog the server shipped as page data, and every later edit of a text catalog comes this way.
// Raising the configuration's generation once the push is installed is what draws the page again.

import { isMap } from '../../data/helpers/guards.ts';
import type { EntitiesStore } from './entities.svelte.ts';
import { configInstalled } from './generation.svelte.ts';
import { setAscii, setCatalog, setGlyphs, setIcons } from '../words/text.ts';
import { setAppearance } from '../words/appearance.ts';
import { setVocab } from '../words/tones.ts';
import type { WritesStore } from './writes.svelte.ts';
import type { ConfigPayload, Message, Subscription } from '../../data/model.ts';

export type Status = 'connecting' | 'open' | 'closed';

/** The first wait after a drop, and the ceiling it doubles to. */
const FIRST = 250;
const LONGEST = 5000;

/** One client's end of the one WebSocket. */
export type SocketStore = {
    status: () => Status;
    connect: (names: string[]) => void;
    disconnect: () => void;
    send: (message: unknown) => boolean;
    subscribe: (names: string[]) => void;
    unsubscribe: (names: string[]) => void;
    listen: (channel: string, fn: (message: Message) => void) => () => void;
    installConfig: (payload: ConfigPayload | null) => void;
};

export function createSocket(entities: EntitiesStore, writes: WritesStore): SocketStore {
    const socket: { status: Status } = $state({ status: 'closed' });

    let live: WebSocket | null = null;

    let channels: string[] = [];

    /**
     * The listeners of a channel, by channel name. A channel that has one is handed every message and
     * nothing of it is stored: entities.receive keeps one message per channel, the latest, and on a
     * `pty:` channel that rule would drop the chunk before the one that arrived.
     */
    const listeners = new Map<string, Set<(message: Message) => void>>();

    /** Whether connect() is in force; a close reconnects only while it is. */
    let wanted = false;

    let backoff = FIRST;

    let retry: ReturnType<typeof setTimeout> | null = null;

    /** The connection's state, for a view that shows it. */
    function status(): Status {
        return socket.status;
    }

    /** Open the socket and subscribe to these channels, reconnecting until disconnect() is called. */
    function connect(names: string[]): void {
        channels = [...names];
        wanted = true;
        if (live === null) {
            // A reconnect may already be waiting; it is dropped so that one connect is one socket.
            if (retry !== null) clearTimeout(retry);
            retry = null;
            open();
            return;
        }
        // Already connected: the server takes a second subscribe message as more channels on the
        // same sink and sends the current message of each.
        if (live.readyState === WebSocket.OPEN) live.send(JSON.stringify(subscription()));
    }

    /** Close the socket and stop reconnecting. */
    function disconnect(): void {
        wanted = false;
        if (retry !== null) clearTimeout(retry);
        retry = null;
        backoff = FIRST;
        const current = live;
        live = null;
        socket.status = 'closed';
        if (current !== null) current.close();
    }

    // The token goes with the subscription rather than with each message: the server remembers which
    // socket carried it, and a socket without it reads every channel and writes to none.
    function subscription(): Subscription {
        return { type: 'subscribe', channels, token: writes.writeToken() };
    }

    /**
     * Write one message on the open socket: the terminal input and resize, and nothing else the
     * server accepts from a page. False when there is no open socket, which a caller shows rather than
     * queueing: keystrokes held through a reconnect would be typed into whatever the pane shows by then.
     */
    function send(message: unknown): boolean {
        if (live?.readyState !== WebSocket.OPEN) return false;
        live.send(JSON.stringify(message));
        return true;
    }

    /**
     * Add channels to the subscription. The server takes a second subscribe message as more channels on
     * the same sink, and the list is remembered so a reconnect asks for them again.
     */
    function subscribe(names: string[]): void {
        const added = names.filter((name) => !channels.includes(name));
        if (added.length === 0) return;
        channels = [...channels, ...added];
        send(subscription());
    }

    /**
     * Take channels out of the subscription. There is no unsubscribe message on the wire, so the server
     * keeps sending on an open socket until it closes; what this stops is the next reconnect asking for
     * them, and with the listener gone the messages that still arrive are dropped.
     */
    function unsubscribe(names: string[]): void {
        channels = channels.filter((name) => !names.includes(name));
    }

    /** Hand every message on a channel to a listener. The call it returns takes the listener off. */
    function listen(channel: string, fn: (message: Message) => void): () => void {
        const held = listeners.get(channel) ?? new Set<(message: Message) => void>();
        held.add(fn);
        listeners.set(channel, held);
        return () => {
            const set = listeners.get(channel);
            if (set === undefined) return;
            set.delete(fn);
            if (set.size === 0) listeners.delete(channel);
        };
    }

    function open(): void {
        socket.status = 'connecting';
        const ws = new WebSocket(`ws://${location.host}/ws`);
        live = ws;

        ws.addEventListener('open', () => {
            backoff = FIRST;
            socket.status = 'open';
            ws.send(JSON.stringify(subscription()));
        });
        ws.addEventListener('message', (event: MessageEvent) => {
            handle(String(event.data));
        });
        // An error is followed by a close in the browser, and closing here guarantees it, so the
        // reconnect is scheduled in one place and never twice for one connection.
        ws.addEventListener('error', () => {
            ws.close();
        });
        ws.addEventListener('close', () => {
            if (live !== ws) return;
            live = null;
            socket.status = 'closed';
            if (!wanted) return;
            retry = setTimeout(() => {
                retry = null;
                open();
            }, backoff);
            backoff = Math.min(backoff * 2, LONGEST);
        });
    }

    /**
     * A map of strings out of a config key, or null when the key holds no map. Not
     * data/helpers/guards' `strings`: it reads the string values of a map, not the string items of
     * a list.
     */
    function strings(raw: unknown): Record<string, string> | null {
        if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
        const map: Record<string, string> = {};
        for (const [name, value] of Object.entries(raw)) {
            if (typeof value === 'string') map[name] = value;
        }
        return map;
    }

    /**
     * Install a config push into the stores the page draws from. The colours and the chip
     * vocabulary ride the same push as the strings: they are keys of the merged config, so an edit
     * to config/catalogs/vocab.yml recolours the page without a reload, an edit to
     * config/appearance.yml changes the theme picker's list, and the glyph vocabulary with its
     * ASCII stand-ins arrives the same way. The icons are the one part not read out of the merged
     * config: the config carries the icon names and the server turns them into the drawings this
     * installs.
     *
     * The configuration's generation is raised once at the end, after every store took its part, so a
     * component that draws again sees the new strings and the new tones together and never half of each.
     * No payload at all installs nothing and raises nothing; the frame check in handle() is what keeps a
     * payload that is not a map from reaching here.
     */
    function installConfig(payload: ConfigPayload | null): void {
        if (payload === null) return;
        setCatalog(payload.text);
        setVocab(payload.config);
        setAppearance(payload.config);
        const glyphs = strings(payload.config.glyphs);
        if (glyphs !== null) setGlyphs(glyphs);
        const ascii = strings(payload.config.ascii);
        if (ascii !== null) setAscii(ascii);
        const icons = strings(payload.icons);
        if (icons !== null) setIcons(icons);
        configInstalled();
    }

    function handle(data: string): void {
        let parsed: unknown;
        try {
            parsed = JSON.parse(data);
        } catch {
            return;
        }
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return;
        const message = parsed as Message;
        if (typeof message.channel !== 'string' || typeof message.version !== 'number') return;
        // Every channel carries a map, so a frame whose payload is anything else is dropped here and
        // each channel's reader may take its own payload type as read.
        if (!isMap(message.payload)) return;
        const heard = listeners.get(message.channel);
        if (heard !== undefined && heard.size > 0) {
            for (const fn of [...heard]) fn(message);
            return;
        }
        entities.receive(message);
        if (message.channel === 'config') installConfig(message.payload as ConfigPayload);
    }

    return { status, connect, disconnect, send, subscribe, unsubscribe, listen, installConfig };
}
