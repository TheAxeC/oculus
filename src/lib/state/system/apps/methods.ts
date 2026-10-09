// Layer 2, client state. The nine methods the page exposes to one app's frame: `read`, `getTheme`,
// `getState`, `setState`, `getStore`, `setStore`, `write`, `open` and `key`. Each judges the call
// by the app's manifest and the limits before it does anything, and a refusal rejects with one
// fixed word as a plain string (state/system/apps/rules.ts).
//
// What a method does to the page is handed to it as a function of the context, so the whole table
// of refusals runs in a test over a context of plain functions and no frame. A call that settles
// after its frame was destroyed sends nothing and draws no notice: the context says whether the
// frame is alive, and each method asks after each wait.

import {
    CONFIRMED_WRITES,
    inClosedPaths,
    pathSegmentsOpen
} from '../../../data/helpers/files/apps.ts';
import { webAddress } from '../../../data/places/hub-address.ts';
import type { AppRow, Message } from '../../../data/model/index.ts';
import type { AppsSettings } from '../../../data/sources/config/settings.ts';
import { t } from '../../shared/words/text.ts';
import { ENGINE_ROOT } from '../../sources/fs.ts';
import type { WriteAnswer } from '../../shared/stores/shapes.ts';
import { createLimiter } from './limits.ts';
import {
    REFUSED,
    failedWith,
    jsonText,
    overKb,
    partOf,
    plainJson,
    readAccess,
    refusedWith,
    rejectWith
} from './rules.ts';
import { askWords } from './words.ts';

/** The theme as the frame is told it. */
export type Theme = { name: string; tokens: Record<string, string>; wall: boolean };

/** The key event a frame forwards: the fields a chord reads. */
export type KeyInit = {
    key: string;
    code: string;
    altKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
    shiftKey: boolean;
};

/** The answer to `check`: what the server says of a file target. */
export type OpenResult = 'ok' | 'closed' | 'missing';

/** What a method needs of the page, per frame. */
export type MethodsContext = {
    /** False once the frame was destroyed. */
    alive: () => boolean;
    /** The app's row as the page holds it now, or undefined once the app is gone. */
    row: () => AppRow | undefined;
    settings: () => AppsSettings;
    /** The newest message of a channel the page holds, for this frame. */
    held: (channel: string) => Message | null;
    /** The folder of the root an app belongs to, null for a machine app or a root not shown. */
    dir: () => string | null;
    /** Whether the file browser shows a root of this key. */
    shown: (root: string) => boolean;
    getState: () => unknown;
    setState: (value: unknown) => void;
    getStore: () => Promise<unknown>;
    /** One write of the app, to the write route with the app's headers. */
    send: (kind: string, body: unknown) => Promise<WriteAnswer>;
    /** Ask the reader; resolves true for a yes. */
    confirm: (question: { message: string; detail: string }) => Promise<boolean>;
    /** Whether the catalogue lists a view of this id, lists none, or the registry has no such id.
     * */
    listed: (view: string) => 'listed' | 'unlisted' | 'unknown';
    openView: (view: string) => void;
    hasProject: (key: string) => boolean;
    openProject: (key: string) => void;
    /** The server's answer for a file target, or null when the request got none. */
    check: (root: string, path: string) => Promise<OpenResult | null>;
    openFile: (root: string, path: string) => void;
    /** Open an address outside oculus as a browser tab, with no link back to the page. */
    openUrl: (address: string) => void;
    theme: () => Theme;
    /** Hand a key event to the page's chords. */
    forwardKey: (init: KeyInit) => void;
    /** Say once per name that the app asked for what it may not have. */
    refused: (kind: 'read' | 'write' | 'open' | 'rate', name: string) => void;
    now?: () => number;
};

/** The methods as penpal exposes them. */
export type Methods = {
    read: (channel: string) => Promise<{ version: number; payload: unknown } | null>;
    getTheme: () => Promise<Theme>;
    getState: () => Promise<unknown>;
    setState: (value: unknown) => Promise<void>;
    getStore: () => Promise<unknown>;
    setStore: (value: unknown) => Promise<void>;
    write: (kind: string, body: unknown) => Promise<void>;
    open: (target: unknown) => Promise<void>;
    key: (init: unknown) => Promise<void>;
};

/** A promise that never settles: the answer to a call whose frame is gone. */
function never(): Promise<never> {
    return new Promise(() => undefined);
}

/** A rejection with one word, as a plain string. */
function refuse(word: string): Promise<never> {
    return rejectWith(word);
}

const isText = (value: unknown): value is string => typeof value === 'string';

/** The one own key of a plain object, or null when it has none or more. */
function soleKey(value: unknown): string | null {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
    const keys = Object.keys(value);
    return keys.length === 1 ? keys[0] : null;
}

/** A plain object's member, or undefined. */
function member(value: unknown, key: string): unknown {
    return typeof value === 'object' && value !== null
        ? (value as Record<string, unknown>)[key]
        : undefined;
}

/** A name a frame sent as the notice quotes it: a string as it is, anything else as JSON. */
function nameOf(value: unknown): string {
    if (typeof value === 'string') return value;
    return jsonText(value) ?? '';
}

/** The target of a write named in the question: the body as short text. */
function targetOf(body: unknown): string {
    const text = jsonText(body);
    if (text === undefined) return '';
    return text.length > 300 ? `${text.slice(0, 300)}...` : text;
}

/** Whether a key event from a frame has the shape the page reads, and every field in it. */
function keyInit(value: unknown): KeyInit | null {
    if (typeof value !== 'object' || value === null) return null;
    const one = value as Record<string, unknown>;
    if (!isText(one.key) || !isText(one.code)) return null;
    const flags = [one.altKey, one.ctrlKey, one.metaKey, one.shiftKey];
    if (!flags.every((flag) => typeof flag === 'boolean')) return null;
    return {
        key: one.key,
        code: one.code,
        altKey: one.altKey as boolean,
        ctrlKey: one.ctrlKey as boolean,
        metaKey: one.metaKey as boolean,
        shiftKey: one.shiftKey as boolean
    };
}

/** What a write route answer is as the app is told: nothing, or one refusal word. */
function answerWord(answer: WriteAnswer): string | null {
    if (answer.ok && answer.refused.length === 0) return null;
    if (answer.ok) return refusedWith(answer.refused[0].reason);
    const status = answer.status ?? 0;
    if (status >= 400 && status < 500 && answer.error !== undefined && answer.error !== '') {
        return refusedWith(answer.error);
    }
    return failedWith(status);
}

/** Build the nine methods of one frame over its context. */
export function createMethods(context: MethodsContext): Methods {
    const now = context.now ?? Date.now;
    const settings = context.settings;
    const writes = createLimiter(() => settings().writesPerMin, 60_000, now);
    const opens = createLimiter(() => settings().opensPerMin, 60_000, now);
    const keys = createLimiter(() => settings().keysPerS, 1_000, now);

    function rowOr(): AppRow | undefined {
        return context.row();
    }

    /** A call over its limit: refused `rate`, and the reader told once per mount. */
    function rateRefused(): Promise<never> {
        context.refused('rate', 'rate');
        return refuse(REFUSED.rate);
    }

    /** Send one write as the app, and settle with its answer's word. */
    async function sendWrite(kind: string, body: unknown): Promise<void> {
        const answer = await context.send(kind, body);
        if (!context.alive()) return never();
        const word = answerWord(answer);
        if (word !== null) return refuse(word);
        return undefined;
    }

    return {
        read(channel: string) {
            const row = rowOr();
            if (row === undefined) return refuse(REFUSED.missing);
            const access = readAccess(row, nameOf(channel));
            if (access !== 'ok') {
                context.refused('read', nameOf(channel));
                return refuse(access);
            }
            const held = context.held(channel);
            const part = held === null ? null : partOf(row, held, context.dir());
            return Promise.resolve(
                part === null ? null : { version: part.version, payload: part.payload }
            );
        },

        getTheme: () => Promise.resolve(context.theme()),

        getState: () => Promise.resolve(context.getState() ?? null),

        setState(value: unknown) {
            if (!plainJson(value)) return refuse(t('apps.refused_not_json'));
            if (overKb(value, settings().stateMaxKb)) return refuse(REFUSED.tooLarge);
            context.setState(value);
            return Promise.resolve();
        },

        getStore() {
            return context.getStore().then(
                (value) => (context.alive() ? value : never()),
                (word: unknown) => (context.alive() ? refuse(String(word)) : never())
            );
        },

        setStore(value: unknown) {
            if (!plainJson(value)) return refuse(t('apps.refused_not_json'));
            if (overKb(value, settings().storeMaxKb)) return refuse(REFUSED.tooLarge);
            if (!writes.take()) return rateRefused();
            return sendWrite('app-store', { store: value });
        },

        async write(kind: string, body: unknown) {
            const row = rowOr();
            if (row === undefined) return refuse(REFUSED.missing);
            if (!isText(kind) || !row.writes.includes(kind)) {
                context.refused('write', nameOf(kind));
                return refuse(REFUSED.notDeclared);
            }
            if (!writes.take()) return rateRefused();
            if (CONFIRMED_WRITES.includes(kind)) {
                const yes = await context.confirm({
                    message: t('apps.confirm_write', row.title, askWords(kind), targetOf(body)),
                    detail: ''
                });
                if (!context.alive()) return never();
                if (!yes) return refuse(REFUSED.declined);
            }
            return sendWrite(kind, body);
        },

        async open(target: unknown) {
            if (!opens.take()) return rateRefused();
            const row = rowOr();
            if (row === undefined) return refuse(REFUSED.missing);
            const shape = soleKey(target);
            const closed = (): Promise<never> => {
                context.refused('open', 'open');
                return refuse(REFUSED.closed);
            };
            if (shape === 'view') {
                const view = member(target, 'view');
                if (!isText(view)) return closed();
                const listed = context.listed(view);
                if (listed === 'unknown') return refuse(REFUSED.missing);
                if (listed === 'unlisted') return closed();
                context.openView(view);
                return undefined;
            }
            if (shape === 'project') {
                const key = member(target, 'project');
                if (!isText(key)) return closed();
                if (!context.hasProject(key)) return refuse(REFUSED.missing);
                context.openProject(key);
                return undefined;
            }
            if (shape === 'url') {
                const address = webAddress(member(target, 'url'));
                if (address === null) return closed();
                const yes = await context.confirm({
                    message: t('apps.confirm_open_url', row.title),
                    detail: address
                });
                if (!context.alive()) return never();
                if (!yes) return refuse(REFUSED.declined);
                context.openUrl(address);
                return undefined;
            }
            if (shape !== 'file') return closed();
            const file = member(target, 'file');
            const root = member(file, 'root');
            const path = member(file, 'path');
            if (typeof file !== 'object' || file === null || Array.isArray(file)) return closed();
            if (Object.keys(file).length !== 2 || !isText(root) || !isText(path)) return closed();
            const folders = settings().closedPaths.folders;
            if (folders === null) return closed();
            if (!pathSegmentsOpen(path) || inClosedPaths(path, folders)) return closed();
            if (root === ENGINE_ROOT) return closed();
            if (row.root !== '' && root !== row.root) return closed();
            if (!context.shown(root)) return refuse(REFUSED.missing);
            const result = await context.check(root, path);
            if (!context.alive()) return never();
            if (result === null) return refuse(failedWith(0));
            if (result === 'closed') return closed();
            if (result === 'missing') return refuse(REFUSED.missing);
            context.openFile(root, path);
            return undefined;
        },

        key(init: unknown) {
            const event = keyInit(init);
            if (event === null || !keys.take()) return Promise.resolve();
            context.forwardKey(event);
            return Promise.resolve();
        }
    };
}
