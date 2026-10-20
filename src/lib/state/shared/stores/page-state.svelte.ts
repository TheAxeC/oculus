// Layer 2, client state. This page's copy of the page state the server keeps in the state folder:
// each workspace's arrangement envelope, the view states and the debugger's record (data/model/
// machine/model-page-state.ts). The page's load hands it the server's read, so the first frame
// draws from it; a save of another page arrives on the `state` channel, and every save of this page
// goes to POST /api/state.
//
// The server is the one save turn of an arrangement. A save is sent one at a time per workspace,
// made from the stamp of the envelope the server last held for it as far as this page knows, and
// marked with a stamp of its own when it is sent; a change made while a save is on its way waits,
// and only the newest waiting one is sent once the answer is in. A refused save carries the
// envelope the server holds, which this page takes, telling the layout store to run its last
// operation again on it (`again`). Another page's save heard while this page is idle is taken as it
// is; heard while a change waits, the waiting change is dropped and run again on it; heard while a
// save is on its way, it is held until the answer: a refusal is answered as above, and an admitted
// save was the older of the two, so the one heard is taken after it.
//
// View states are sent as the records changed and the records removed, gathered for a moment so a
// burst of changes is one request, and another page's batch is taken except for a record this page
// has a change of on its way, which lands after it. The debugger's record is sent whole.
//
// Every message names the page that saved (`by`), so a page never takes its own save back. A
// message whose version does not follow the one this page last read means one was missed (the
// replay of a reconnect, or a save between the load and the subscription), and the state is read
// again whole, each arrangement another page saved meanwhile taken as a heard one is.
//
// A save that did not reach the server is sent again after a pause, unless a newer one replaced it,
// and a page going away sends what waits with requests that outlive it (`flush`).

import { z } from 'zod';
import type {
    Finding,
    PageStateAnswer,
    PageStateRead,
    PageStateWrite,
    StatePayload
} from '../../../data/model/index.ts';
import { isMap } from '../../../data/helpers/guards.ts';
import { mapShape, readAs, unchangedAs } from '../../../data/shapes/shapes.ts';
import { postWithToken, type TokenSource } from './token-post.ts';
import type { EntitiesStore } from './shapes.ts';

/** The route the page state is read and written through. */
const STATE_PATH = '/api/state';

/** A read of the page state, its top-level fields checked. */
const readShape = unchangedAs<PageStateRead>(
    z.object({
        layouts: mapShape,
        views: mapShape,
        debug: z.unknown(),
        version: z.number(),
        findings: z.instanceof(Array)
    })
);

/** The answer to a write: done, refused with the envelope held, or refused with a sentence. */
const answerShape: z.ZodType<PageStateAnswer> = z.union([
    z.object({ ok: z.literal(true) }),
    z.object({ ok: z.literal(false), held: z.unknown() }).refine((one) => 'held' in one),
    z.object({ ok: z.literal(false), error: z.string() })
]);

/** How the store reaches the server: the read of the whole state, and one write. */
export type StateTransport = {
    read: () => Promise<PageStateRead | null>;
    /** Send one write; `leaving` when the page is going away and the request must outlive it. */
    send: (write: PageStateWrite, leaving?: boolean) => Promise<PageStateAnswer>;
};

/** Told when a workspace's arrangement changed under the page; `again` reruns the last change. */
type LayoutListener = (identity: string, again: boolean) => void;

/** How long view state changes are gathered before they are sent, in milliseconds. */
const GATHER_MS = 250;

/** How long a save that did not reach the server waits before it is sent again, in milliseconds. */
const RETRY_MS = 2000;

/** The store of one page's page state. */
export type PageStateStore = {
    /** The id this page names itself by in a save. */
    by: string;
    /** Take the server's read whole: at the load, and after a missed message. */
    install: (read: PageStateRead) => void;
    /** A `state` message: what saves of other pages landed. */
    heard: (version: number, payload: StatePayload) => void;
    /** The findings of the files that do not read, from the last read. */
    findings: () => Finding[];
    /** The envelope held for a workspace, as JSON text, or null when none. */
    envelope: (identity: string) => string | null;
    /** Save a workspace's arrangement: the envelope without its marks, and its record entry. */
    saveLayout: (
        identity: string,
        envelope: Record<string, unknown>,
        write: Extract<PageStateWrite, { kind: 'layout' }>['write']
    ) => void;
    /** Keep a copy of an envelope that could not be read, which no save writes over. */
    keepUnread: (identity: string, raw: string) => void;
    /** Hear a change of an arrangement under the page; the answer stops it. */
    onLayout: (listener: LayoutListener) => () => void;
    /** Every view state record, by id. */
    views: () => Record<string, unknown>;
    /** Set and remove view state records, and send the change. */
    changeViews: (set: Record<string, unknown>, remove: readonly string[]) => void;
    /** The debugger's record, or null when none is saved; another page's save replaces it. */
    debug: () => unknown;
    /** Save the debugger's record whole. */
    setDebug: (value: Record<string, unknown>) => void;
    /** Hear a write the server refused, with its sentence. */
    onRefused: (listener: (error: string) => void) => void;
    /** Send what waits now, as a page that is going away does. */
    flush: () => void;
};

/** A save's own stamp: the time and a few random letters, so two saves never share one. */
function freshStamp(): string {
    return `${String(Date.now())}-${Math.random().toString(36).slice(2, 8)}`;
}

/** The stamp an envelope carries, or null for one with none. */
function stampOf(envelope: unknown): string | null {
    return isMap(envelope) && typeof envelope.stamp === 'string' ? envelope.stamp : null;
}

/** One save waiting for its turn. */
type Waiting = {
    envelope: Record<string, unknown>;
    write: Extract<PageStateWrite, { kind: 'layout' }>['write'];
};

/**
 * The saves of one workspace: one on its way with its stamp, the newest one waiting, and one heard
 * meanwhile.
 */
type Slot = { sending: string | null; waiting: Waiting | null; heard: unknown };

/**
 * The page state store of one page. `page` names the page kind (`main`, or a float's id); every
 * browser tab and app window is a page of its own, so the name a save carries is `page` with a
 * stamp of this page's lifetime after it, and two tabs of one kind never take each other's saves
 * for their own.
 */
export function createPageState(transport: StateTransport, page: string): PageStateStore {
    const self = `${page}:${freshStamp()}`;
    const held: { views: Record<string, unknown>; debug: unknown; findings: Finding[] } = $state({
        views: {},
        debug: null,
        findings: []
    });
    /** The envelope held for each workspace, as far as this page knows: its own saves included. */
    const layouts = new Map<string, unknown>();
    /** The stamp of the envelope the server holds for each workspace, as far as this page knows. */
    const confirmed = new Map<string, string | null>();
    const slots = new Map<string, Slot>();
    const layoutListeners = new Set<LayoutListener>();
    const refusedListeners: ((error: string) => void)[] = [];
    /** The view state changes gathered and not yet sent, and the ids of those on their way. */
    let outgoing: { set: Record<string, unknown>; remove: Set<string> } = {
        set: {},
        remove: new Set()
    };
    const sendingViews = new Set<string>();
    let gathering: ReturnType<typeof setTimeout> | null = null;
    let version = 0;

    function refused(error: string): void {
        for (const listener of refusedListeners) listener(error);
    }

    function tellLayout(identity: string, again: boolean): void {
        for (const listener of layoutListeners) listener(identity, again);
    }

    function slotOf(identity: string): Slot {
        const found = slots.get(identity);
        if (found !== undefined) return found;
        const made: Slot = { sending: null, waiting: null, heard: undefined };
        slots.set(identity, made);
        return made;
    }

    function install(read: PageStateRead): void {
        version = read.version;
        layouts.clear();
        confirmed.clear();
        for (const [identity, one] of Object.entries(read.layouts)) {
            if (one.envelope === undefined) continue;
            layouts.set(identity, one.envelope);
            confirmed.set(identity, stampOf(one.envelope));
        }
        const views = { ...read.views };
        for (const [id, value] of Object.entries(outgoing.set)) views[id] = value;
        for (const id of outgoing.remove) Reflect.deleteProperty(views, id);
        held.views = views;
        held.debug = read.debug;
        held.findings = read.findings;
    }

    /**
     * Take a read made after a missed message: the view states and the debugger's record whole, and
     * each arrangement whose stamp is not the one this page knows as another page's save.
     */
    function catchUp(read: PageStateRead): void {
        version = Math.max(version, read.version);
        const views = { ...read.views };
        for (const [id, value] of Object.entries(outgoing.set)) views[id] = value;
        for (const id of outgoing.remove) Reflect.deleteProperty(views, id);
        for (const id of sendingViews) {
            if (Object.hasOwn(held.views, id)) views[id] = held.views[id];
            else Reflect.deleteProperty(views, id);
        }
        held.views = views;
        held.debug = read.debug;
        held.findings = read.findings;
        for (const [identity, one] of Object.entries(read.layouts)) {
            if (one.envelope === undefined) continue;
            const stamp = stampOf(one.envelope);
            if (stamp === confirmed.get(identity) || stamp === slotOf(identity).sending) continue;
            takeLayout(identity, one.envelope, '');
        }
    }

    /** Take an envelope another page saved for a workspace. */
    function takeLayout(identity: string, envelope: unknown, by: string): void {
        if (by === self) return;
        const slot = slotOf(identity);
        if (slot.sending !== null) {
            slot.heard = envelope;
            return;
        }
        layouts.set(identity, envelope);
        confirmed.set(identity, stampOf(envelope));
        const again = slot.waiting !== null;
        slot.waiting = null;
        tellLayout(identity, again);
    }

    function takeViews(batch: {
        by: string;
        set: Record<string, unknown>;
        remove: string[];
    }): void {
        if (batch.by === self) return;
        const mine = (id: string): boolean =>
            sendingViews.has(id) || Object.hasOwn(outgoing.set, id) || outgoing.remove.has(id);
        const views = { ...held.views };
        for (const id of batch.remove) if (!mine(id)) Reflect.deleteProperty(views, id);
        for (const [id, value] of Object.entries(batch.set)) if (!mine(id)) views[id] = value;
        held.views = views;
    }

    function heard(next: number, payload: StatePayload): void {
        // The replay of the message this page already has changes nothing; any other step than
        // the next one is a message missed or a server started again, which numbers from one.
        if (next === version) return;
        const missed = next !== version + 1;
        version = next;
        if (missed) {
            void transport.read().then((read) => {
                if (read !== null) catchUp(read);
            });
            return;
        }
        for (const [identity, one] of Object.entries(payload.layouts ?? {})) {
            takeLayout(identity, one.envelope, one.by);
        }
        for (const batch of payload.views ?? []) takeViews(batch);
        if (payload.debug !== undefined && payload.debug.by !== self) {
            held.debug = payload.debug.value;
        }
    }

    /** Send the waiting save of a workspace, when none is on its way. */
    function sendNext(identity: string): void {
        const slot = slotOf(identity);
        const next = slot.waiting;
        if (slot.sending !== null || next === null) return;
        slot.waiting = null;
        const from = confirmed.get(identity) ?? null;
        const stamp = freshStamp();
        slot.sending = stamp;
        const envelope = { ...next.envelope, stamp, from };
        layouts.set(identity, envelope);
        void transport
            .send({ kind: 'layout', identity, envelope, from, write: next.write, by: self })
            .then((answer) => answered(identity, stamp, next, answer))
            .catch(() => answered(identity, stamp, next, { ok: false, error: '' }));
    }

    /**
     * The answer to a layout save: admitted, refused with the envelope held, refused with a
     * sentence, or not answered, when the request did not reach the server. A save not answered
     * waits again, unless a newer one already waits, and is sent again after a pause.
     */
    function answered(
        identity: string,
        stamp: string,
        sent: Waiting,
        answer: PageStateAnswer
    ): void {
        const slot = slotOf(identity);
        slot.sending = null;
        const heardMeanwhile = slot.heard;
        slot.heard = undefined;
        if (
            !answer.ok &&
            'error' in answer &&
            answer.error === '' &&
            heardMeanwhile === undefined
        ) {
            slot.waiting ??= sent;
            setTimeout(() => sendNext(identity), RETRY_MS);
            return;
        }
        if (!answer.ok && 'held' in answer) {
            layouts.set(identity, answer.held);
            confirmed.set(identity, stampOf(answer.held));
            slot.waiting = null;
            tellLayout(identity, true);
            return;
        }
        if (answer.ok) confirmed.set(identity, stamp);
        else if (answer.error !== '') refused(answer.error);
        if (heardMeanwhile !== undefined) {
            layouts.set(identity, heardMeanwhile);
            confirmed.set(identity, stampOf(heardMeanwhile));
            const again = slot.waiting !== null;
            slot.waiting = null;
            tellLayout(identity, again);
            return;
        }
        sendNext(identity);
    }

    function saveLayout(
        identity: string,
        envelope: Record<string, unknown>,
        write: Waiting['write']
    ) {
        const slot = slotOf(identity);
        slot.waiting = { envelope, write };
        layouts.set(identity, { ...envelope });
        sendNext(identity);
    }

    /**
     * Send the waiting save of a workspace as the page goes away, with no answer awaited: made from
     * the save on its way when there is one, which the server holds by then if it took it.
     */
    function leaveLayout(identity: string): void {
        const slot = slotOf(identity);
        const next = slot.waiting;
        if (next === null) return;
        slot.waiting = null;
        const from = slot.sending ?? confirmed.get(identity) ?? null;
        const envelope = { ...next.envelope, stamp: freshStamp(), from };
        layouts.set(identity, envelope);
        void transport.send(
            { kind: 'layout', identity, envelope, from, write: next.write, by: self },
            true
        );
    }

    function keepUnread(identity: string, raw: string): void {
        let value: unknown = raw;
        try {
            value = JSON.parse(raw);
        } catch {
            // A text that is no JSON is kept as the text it is.
        }
        void transport.send({ kind: 'unread', identity, value, by: self }).then((answer) => {
            if (!answer.ok && 'error' in answer && answer.error !== '') refused(answer.error);
        });
    }

    function envelope(identity: string): string | null {
        const one = layouts.get(identity);
        return one === undefined ? null : JSON.stringify(one);
    }

    /** Send the gathered view state changes; `leaving` as the page goes away. */
    function sendViews(leaving = false): void {
        if (gathering !== null) clearTimeout(gathering);
        gathering = null;
        const { set, remove } = outgoing;
        if (Object.keys(set).length === 0 && remove.size === 0) return;
        outgoing = { set: {}, remove: new Set() };
        const ids = [...Object.keys(set), ...remove];
        for (const id of ids) sendingViews.add(id);
        void transport
            .send({ kind: 'views', set, remove: [...remove], by: self }, leaving)
            .then((answer) => {
                for (const id of ids) sendingViews.delete(id);
                if (answer.ok || !('error' in answer)) return;
                if (answer.error !== '') {
                    refused(answer.error);
                    return;
                }
                // Not answered: each record changed since is newer, and the others wait again.
                for (const [id, value] of Object.entries(set)) {
                    if (!Object.hasOwn(outgoing.set, id) && !outgoing.remove.has(id)) {
                        outgoing.set[id] = value;
                    }
                }
                for (const id of remove) {
                    if (!Object.hasOwn(outgoing.set, id)) outgoing.remove.add(id);
                }
                gathering ??= setTimeout(() => sendViews(), RETRY_MS);
            });
    }

    function changeViews(set: Record<string, unknown>, remove: readonly string[]): void {
        const views = { ...held.views };
        for (const id of remove) {
            Reflect.deleteProperty(views, id);
            Reflect.deleteProperty(outgoing.set, id);
            outgoing.remove.add(id);
        }
        for (const [id, value] of Object.entries(set)) {
            views[id] = value;
            outgoing.set[id] = value;
            outgoing.remove.delete(id);
        }
        held.views = views;
        gathering ??= setTimeout(() => sendViews(), GATHER_MS);
    }

    function setDebug(value: Record<string, unknown>): void {
        held.debug = value;
        void transport.send({ kind: 'debug', value, by: self }).then((answer) => {
            if (!answer.ok && 'error' in answer && answer.error !== '') refused(answer.error);
        });
    }

    return {
        by: self,
        install,
        heard,
        findings: () => held.findings,
        envelope,
        saveLayout,
        keepUnread,
        onLayout: (listener) => {
            layoutListeners.add(listener);
            return () => layoutListeners.delete(listener);
        },
        views: () => held.views,
        changeViews,
        debug: () => held.debug,
        setDebug,
        onRefused: (listener) => {
            refusedListeners.push(listener);
        },
        flush: () => {
            sendViews(true);
            for (const identity of slots.keys()) leaveLayout(identity);
        }
    };
}

/** Hand the store every message of the `state` channel the entities store keeps. */
export function hearStateChannel(
    store: Pick<PageStateStore, 'heard'>,
    entities: Pick<EntitiesStore, 'afterReceive' | 'payloadOf'>
): void {
    entities.afterReceive((message) => {
        const payload = entities.payloadOf(message, 'state');
        if (payload !== null) store.heard(message.version, payload);
    });
}

/** The store's way to the server: GET and POST /api/state, the POST with the write token. */
export function httpStateTransport(writes: TokenSource): StateTransport {
    return {
        read: async () => {
            try {
                const response = await fetch(STATE_PATH, { cache: 'no-store' });
                return response.ok ? readAs(readShape, await response.json()) : null;
            } catch {
                return null;
            }
        },
        send: async (write, leaving = false) => {
            try {
                const response = await postWithToken(STATE_PATH, write, writes, leaving);
                return readAs(answerShape, await response.json()) ?? { ok: false, error: '' };
            } catch {
                // A request that did not reach the server writes nothing and says nothing: the page
                // keeps what it shows, and its next save is sent from what the server last held.
                return { ok: false, error: '' };
            }
        }
    };
}
