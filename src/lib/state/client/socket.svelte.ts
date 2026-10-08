// Layer 2, client state. The page's end of the one WebSocket: subscribe on open, hand every
// message to entities, reconnect when it drops. The server reloads on a source change in
// development (DESIGN.md, "Hot reload", second row), so a reconnect is a normal event and not an
// error state; the backoff exists so a server that is down does not spin the page.
//
// The catalog arrives on the `config` channel and is installed here rather than in entities,
// because state/shared/words/text.ts holds it outside the reactive graph: the page's first render
// uses the catalog the server shipped as page data, and every later edit of a text catalog comes
// this way. Raising the configuration's generation once the push is installed is what draws the
// page again.
//
// The page starts from the configuration its own HTML was built from, seeded here with the newest
// push version that read is at least as new as (server/root/config-seed.ts), when the seed passes
// the schema of a `config` payload. A `config` push at or below that version is dropped: it is the
// hub's replay of a read made before the page's, and installing it would put the values from before
// a config change back for the watcher's debounce.
//
// The payload carries the address the server listens at. A server that moves to another port
// (a changed `port` in local.yml) reports its new address on the open socket, and the page goes
// there with its path, query and hash and the host name the reader used, carrying its arrangement
// and settings across the change of origin (workbench/layout/saved/carry.ts). It follows only a
// change of the address it holds, the first it heard or the last it followed, only when its own
// port is that address's port (a page opened at `localhost` has the port, and one reached through a
// forwarded port of another number does not), and only once the new address answers, so a page
// forwarded under the same number, whose new port its own machine does not serve, stays put.
//
// A socket is admitted to write when the token its subscription carries is the server's. The first
// open is admitted by the token the page was loaded with. After a reconnect the server may be a
// restarted one that minted another token, so the socket is admitted once the page's load has run
// again (`writes.renewToken`) and a changed token has gone out in a subscribe of no channels, since
// a frame written before that is refused. A holder of a channel that must not lose its first
// message to the refusal, as a language server's initialize would be, waits for `admitted`.

import { z } from 'zod';
import {
    anyNumberShape,
    mapOfShape,
    mapShape,
    readAs,
    unchanged
} from '../../data/shapes/shapes.ts';
import type { EntitiesStore } from './entities.svelte.ts';
import { payloadShapes } from './payloads.ts';
import { configInstalled } from '../shared/words/generation.svelte.ts';
import { setCatalog, setGlyphs, setIcons } from '../shared/words/text.ts';
import { setAppearance } from '../shared/words/appearance.ts';
import { setVocab } from '../shared/words/tones.ts';
import type { WritesStore } from './writes.svelte.ts';
import { carryWorkbench } from '../workbench/layout/saved/carry.ts';
import type {
    AppsPayload,
    ConfigPayload,
    HostInfo,
    Message,
    Subscription,
    Unsubscription
} from '../../data/model/index.ts';
import { byKey } from '../../data/helpers/guards.ts';
import { SOURCE_PREFIX } from '../../data/helpers/files/address.ts';
import type { SocketStore, Status } from '../shared/stores/shapes.ts';

export type { SocketStore, Status };

/**
 * A frame the server sends: its channel, its version (any number, as the wire has always taken
 * one) and a payload that is a map, answered as the parsed frame itself.
 */
const frameShape = unchanged(
    z.object({ channel: z.string(), version: anyNumberShape, payload: mapShape })
) satisfies z.ZodType<Message>;

/** The strings of a config key's map: the map's own entries whose value is a string. */
const stringMapShape = mapOfShape(z.string());

/** The first wait after a drop, and the ceiling it doubles to. */
const FIRST = 250;
const LONGEST = 5000;

/**
 * The page's own address with the port of the address the server reports now, or null when that
 * address is no URL.
 */
export function addressAfterMove(href: string, address: string): string | null {
    try {
        const moved = new URL(href);
        moved.port = new URL(address).port;
        return moved.href;
    } catch {
        return null;
    }
}

/** The port of an address, empty for the scheme's own, or null when it is no URL. */
function portOf(address: string): string | null {
    try {
        return new URL(address).port;
    } catch {
        return null;
    }
}

export function createSocket(entities: EntitiesStore, writes: WritesStore): SocketStore {
    const socket: { status: Status; admitted: boolean } = $state({
        status: 'closed',
        admitted: false
    });

    /** Called whenever the status or the admission changes. */
    const linked = new Set<() => void>();

    function link(change: () => void): void {
        change();
        for (const fn of [...linked]) fn();
    }

    let live: WebSocket | null = null;

    let channels: string[] = [];

    /**
     * The listeners of a channel, by channel name. A channel that has one is handed every message
     * and nothing of it is stored: entities.receive keeps one message per channel, the latest, and
     * on a `pty:` channel that rule would drop the chunk before the one that arrived.
     */
    const listeners = new Map<string, Set<(message: Message) => void>>();

    /** Whether connect() is in force; a close reconnects only while it is. */
    let wanted = false;

    let backoff = FIRST;

    /** The newest `config` push version the seeded configuration is at least as new as. */
    let seededThrough = -1;
    /** The newest `apps` push version the seeded apps are at least as new as. */
    let seededApps = -1;
    /** Whether a socket of this page has opened before, so the next open is a reconnect. */
    let opened = false;
    /** The token the last subscribe message carried to the server. */
    let sentToken = '';

    let retry: ReturnType<typeof setTimeout> | null = null;

    /** The address the server reported when this page first heard one. */
    let reported: string | null = null;

    /** The connection's state, for a view that shows it. */
    function status(): Status {
        return socket.status;
    }

    /** Whether the open socket's subscription carries the token the server holds. */
    function admitted(): boolean {
        return socket.admitted;
    }

    /** Hear every change of the status or the admission; the call it returns stops hearing. */
    function onLink(fn: () => void): () => void {
        linked.add(fn);
        return () => linked.delete(fn);
    }

    /**
     * Open the socket and subscribe to these channels, reconnecting until disconnect() is called.
     */
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
        link(() => {
            socket.status = 'closed';
            socket.admitted = false;
        });
        if (current !== null) current.close();
    }

    // The token goes with the subscription rather than with each message: the server remembers
    // which socket carried it, and a socket without it reads every channel and writes to none.
    function subscription(): Subscription {
        sentToken = writes.writeToken();
        return { type: 'subscribe', channels, token: sentToken };
    }

    // A token installed after the socket subscribed (the page's load run again after a restart or
    // a 403) goes to the server in a subscribe message of no channels, which admits the socket to
    // write without attaching its terminals again.
    writes.onToken(() => {
        if (live?.readyState !== WebSocket.OPEN || writes.writeToken() === sentToken) return;
        sentToken = writes.writeToken();
        live.send(JSON.stringify({ type: 'subscribe', channels: [], token: sentToken }));
        if (!socket.admitted) link(() => (socket.admitted = true));
    });

    /**
     * Write one message on the open socket: the terminal input and resize, the unsubscribe message
     * of a `source:` channel, and nothing else the server accepts from a page. False when there is
     * no open socket, which a caller shows rather than queueing: keystrokes held through a
     * reconnect would be typed into whatever the pane shows by then.
     */
    function send(message: unknown): boolean {
        if (live?.readyState !== WebSocket.OPEN) return false;
        live.send(JSON.stringify(message));
        return true;
    }

    /**
     * Add channels to the subscription. The server takes a second subscribe message as more
     * channels on the same sink, and the list is remembered so a reconnect asks for them again.
     */
    function subscribe(names: string[]): void {
        const added = names.filter((name) => !channels.includes(name));
        if (added.length === 0) return;
        channels = [...channels, ...added];
        send(subscription());
    }

    /**
     * Take channels out of the subscription: the next reconnect does not ask for them again, and
     * with the listener gone the messages that arrive for them are dropped. The `source:` channels
     * among them are also dropped on the server with an unsubscribe message, since the server polls
     * a file for as long as some socket holds its channel; every other channel stays subscribed on
     * an open socket until it closes.
     */
    function unsubscribe(names: string[]): void {
        const dropped = names.filter((name) => channels.includes(name));
        channels = channels.filter((name) => !names.includes(name));
        const files = dropped.filter((name) => name.startsWith(SOURCE_PREFIX));
        if (files.length === 0) return;
        const message: Unsubscription = { type: 'unsubscribe', channels: files };
        send(message);
    }

    /**
     * Hand every message on a channel to a listener. The call it returns takes the listener off.
     */
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
        link(() => (socket.status = 'connecting'));
        const ws = new WebSocket(`ws://${location.host}/ws`);
        live = ws;

        ws.addEventListener('open', () => {
            backoff = FIRST;
            const reconnected = opened;
            // The seed's bound names a version of the hub the page was built against. A reconnect
            // may reach a restarted server, whose hub numbers its pushes from the start again, so
            // after the first open every push is taken.
            if (reconnected) {
                seededThrough = -1;
                seededApps = -1;
                entities.reconnected();
            }
            opened = true;
            ws.send(JSON.stringify(subscription()));
            // The listeners hear the open after the subscription is written, so a frame they
            // write follows the token on the wire.
            link(() => {
                socket.status = 'open';
                socket.admitted = !reconnected;
            });
            // A restarted server minted a new write token. The page's load hands it over, so a
            // reconnect runs the load again, and a token that changed goes out through onToken.
            if (reconnected) {
                void writes
                    .renewToken()
                    .then(() => {
                        if (live === ws && !socket.admitted) link(() => (socket.admitted = true));
                    })
                    .catch(() => undefined);
            }
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
            link(() => {
                socket.status = 'closed';
                socket.admitted = false;
            });
            if (!wanted) return;
            retry = setTimeout(() => {
                retry = null;
                open();
            }, backoff);
            backoff = Math.min(backoff * 2, LONGEST);
        });
    }

    /**
     * Keep the first address the server reports, and go to the page's own address on the new port
     * when a later push reports another one and the page is served at the port of the address it
     * holds, once that address answers.
     */
    function followServer(host: HostInfo): void {
        if (reported === null) {
            reported = host.address;
            return;
        }
        if (host.address === reported) return;
        const moved = addressAfterMove(location.href, host.address);
        if (moved === null || portOf(location.href) !== portOf(reported)) return;
        reported = host.address;
        void goWhenAnswered(moved);
    }

    /**
     * Go to `moved` when it answers: a page whose port is forwarded under the same number reaches
     * a port of its own machine that nothing serves, and stays where it is rather than land on an
     * error page. The arrangement and the settings are written into the window's name, for the
     * origin the page goes to, just before it goes.
     */
    async function goWhenAnswered(moved: string): Promise<void> {
        try {
            await fetch(moved, { mode: 'no-cors', cache: 'no-store' });
        } catch {
            return;
        }
        try {
            carryWorkbench(localStorage, window, new URL(moved).origin);
        } catch {
            // A page without storage follows without the arrangement.
        }
        location.assign(moved);
    }

    /**
     * Install a config push into the stores the page draws from. The colours and the chip
     * vocabulary ride the same push as the strings: they are keys of the merged config, so an edit
     * to config/catalogs/vocab.yml recolours the page without a reload, an edit to
     * config/appearance.yml changes the theme picker's list, and the glyph vocabulary, each name
     * with its ASCII stand-in, arrives the same way. The icons are the one part not read out of the
     * merged config: the config carries the icon names and the server turns them into the drawings
     * this installs.
     *
     * The configuration's generation is raised once at the end, after every store took its part, so
     * a component that draws again sees the new strings and the new tones together and never half
     * of each. No payload at all installs nothing and raises nothing; the frame check in handle()
     * is what keeps a payload that is not a map from reaching here.
     */
    function installConfig(payload: ConfigPayload | null): void {
        if (payload === null) return;
        followServer(payload.host);
        setCatalog(payload.text);
        setVocab(payload.config);
        setAppearance(payload.config);
        const glyphs = readAs(stringMapShape, payload.config.glyphs);
        if (glyphs !== null) setGlyphs(glyphs);
        const icons = readAs(stringMapShape, payload.icons);
        if (icons !== null) setIcons(icons);
        configInstalled();
    }

    /**
     * Take no `config` push at or below `through`, and put the page's own configuration on the
     * channel when the seed carries it. The stores the catalog lives in were filled from the same
     * read before the first render, so nothing is installed again here. The seed is held to the
     * schema a frame's payload is held to; one that fails it is not held, and the push the socket
     * subscribes with is the page's configuration instead, so the channel only ever holds a payload
     * a schema accepted.
     */
    function seedConfig(payload: ConfigPayload | undefined, through: number): void {
        if (payload !== undefined && !payloadShapes.config.safeParse(payload).success) return;
        seededThrough = through;
        if (payload === undefined) return;
        followServer(payload.host);
        entities.receive({ channel: 'config', version: through, payload });
    }

    /**
     * Take no `apps` push at or below `through`, and put the apps the page was built from on the
     * channel. A seed that fails the channel's schema is not held.
     */
    function seedApps(payload: AppsPayload, through: number): void {
        if (!payloadShapes.apps.safeParse(payload).success) return;
        seededApps = Math.max(seededApps, through);
        entities.receive({ channel: 'apps', version: through, payload });
    }

    function handle(data: string): void {
        let parsed: unknown;
        try {
            parsed = JSON.parse(data);
        } catch {
            return;
        }
        const frame = frameShape.safeParse(parsed);
        if (!frame.success) return;
        const message = frame.data;
        // A channel the page types is checked on its top-level fields, so each channel's reader
        // takes its payload as the type the data model declares.
        const shape = byKey<z.ZodType>(payloadShapes, message.channel);
        if (shape !== undefined && !shape.safeParse(message.payload).success) return;
        if (message.channel === 'config' && message.version <= seededThrough) return;
        if (message.channel === 'apps' && message.version <= seededApps) return;
        const heard = listeners.get(message.channel);
        if (heard !== undefined && heard.size > 0) {
            for (const fn of [...heard]) fn(message);
            return;
        }
        entities.receive(message);
        if (message.channel === 'config') installConfig(entities.payloadOf(message, 'config'));
    }

    return {
        status,
        admitted,
        onLink,
        connect,
        disconnect,
        send,
        subscribe,
        unsubscribe,
        listen,
        installConfig,
        seedConfig,
        seedApps
    };
}
