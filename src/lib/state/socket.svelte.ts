// Layer 2, client state. The page's end of the one WebSocket: subscribe on open, hand every
// message to entities, reconnect when it drops. The server reloads on a source change in
// development (DESIGN.md, "Hot reload", second row), so a reconnect is a normal event and not an
// error state; the backoff exists so a server that is down does not spin the page.
//
// The catalog arrives on the `config` channel and is installed here rather than in entities,
// because state/text.ts holds it outside the reactive graph: the page's first render uses the
// catalog the server shipped as page data, and every later edit of config/text.yml comes this way.

import { receive } from './entities.svelte.ts';
import { setAscii, setCatalog, setGlyphs } from './text.ts';
import { setAppearance } from './appearance.ts';
import { setVocab } from './tones.ts';
import type { ConfigPayload, Message, Subscription } from '../data/model.ts';

export type Status = 'connecting' | 'open' | 'closed';

/** The first wait after a drop, and the ceiling it doubles to. */
const FIRST = 250;
const LONGEST = 5000;

const socket: { status: Status } = $state({ status: 'closed' });

let live: WebSocket | null = null;
let channels: string[] = [];
/** Whether connect() is in force; a close reconnects only while it is. */
let wanted = false;
let backoff = FIRST;
let retry: ReturnType<typeof setTimeout> | null = null;

/** The connection's state, for a view that shows it. */
export function status(): Status {
    return socket.status;
}

/** Open the socket and subscribe to these channels, reconnecting until disconnect() is called. */
export function connect(names: string[]): void {
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
export function disconnect(): void {
    wanted = false;
    if (retry !== null) clearTimeout(retry);
    retry = null;
    backoff = FIRST;
    const current = live;
    live = null;
    socket.status = 'closed';
    if (current !== null) current.close();
}

function subscription(): Subscription {
    return { type: 'subscribe', channels };
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

/** A map of strings out of a config key, or null when the key holds no map. */
function strings(raw: unknown): Record<string, string> | null {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
    const map: Record<string, string> = {};
    for (const [name, value] of Object.entries(raw)) {
        if (typeof value === 'string') map[name] = value;
    }
    return map;
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
    receive(message);
    if (message.channel === 'config') {
        const payload = message.payload as ConfigPayload | null;
        if (payload === null || typeof payload !== 'object') return;
        if (payload.text) setCatalog(payload.text);
        // The colours and the chip vocabulary ride the same push: they are keys of the merged
        // config, so an edit to config/vocab.yml recolours the page without a reload, and an edit
        // to config/appearance.yml changes the theme picker's list the same way.
        if (payload.config) {
            setVocab(payload.config);
            setAppearance(payload.config);
        }
        // The glyph vocabulary and its ASCII stand-ins ride on the same channel: they are two keys
        // of the merged config, so an edit to config/glyphs.yml reaches the page by the push that
        // already carries the strings.
        const glyphs = strings(payload.config?.glyphs);
        if (glyphs !== null) setGlyphs(glyphs);
        const ascii = strings(payload.config?.ascii);
        if (ascii !== null) setAscii(ascii);
    }
}
