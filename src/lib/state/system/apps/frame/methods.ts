// Layer 2, client state. The methods the page exposes to one app's frame: `read`, `getTheme`,
// `getState`, `setState`, `getStore`, `setStore`, `write`, `open` and `key`, and the five groups
// the frame's `oculus` object nests: `fsAddress` (the `fs` methods), `commandsRun`, `secretsGet`,
// `secretsStore` and `secretsDelete`, and `hostRequest`. Penpal carries them under these flat
// names and the app's half (serve/oculus.js) nests them as `oculus.fs`, `oculus.commands`,
// `oculus.secrets` and `oculus.host`. Each judges the call by the app's manifest and the limits
// before it does anything, and a refusal rejects with one fixed word as a plain string
// (state/system/apps/frame/rules.ts).
//
// A file of a root never passes through the page: `fsAddress` judges the call and answers the
// address on the app's own address that the frame fetches the bytes, the listing or the stat
// from, and the server judges the real path.
//
// What a method does to the page is handed to it as a function of the context, so the whole table
// of refusals runs in a test over a context of plain functions and no frame. A call that settles
// after its frame was destroyed sends nothing and draws no notice: the context says whether the
// frame is alive, and each method asks after each wait.

import {
    CONFIRMED_WRITES,
    appAddress,
    inClosedPaths,
    inFilesEntry,
    pathSegmentsOpen
} from '../../../../data/helpers/files/apps/apps.ts';
import { createLimiter } from '../../../../data/helpers/run/limiter.ts';
import { webAddress } from '../../../../data/places/hub-address.ts';
import type { AppRequestBody, AppRow, Message } from '../../../../data/model/index.ts';
import type { AppsSettings } from '../../../../data/sources/config/settings.ts';
import { t } from '../../../shared/words/text.ts';
import { ENGINE_ROOT } from '../../../sources/fs.ts';
import type { WriteAnswer } from '../../../shared/stores/shapes.ts';
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
import { askWords } from '../words.ts';
import { uiBody } from './ui-body.ts';
import type { FrameKind } from '../shell/frames.svelte.ts';

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

/** What the server answered to a call of an app's host or secrets: the value, or the word. */
export type ServerAnswer = { ok: true; value: unknown } | { ok: false; word: string };

/** How a command run for an app ended. */
export type CommandOutcome = 'ok' | 'missing' | 'declined' | 'failed';

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
    /** The keys of the roots the file browser shows. */
    rootKeys: () => string[];
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
    /** Run a command of the app's root, in a terminal the reader sees. */
    runCommand: (name: string) => Promise<CommandOutcome>;
    /** One call of the app's secrets, or null when the request got no answer. */
    secrets: (
        action: 'get' | 'store' | 'delete',
        key: unknown,
        value?: unknown
    ) => Promise<ServerAnswer | null>;
    /** One request to the app's host, or null when the request got no answer. */
    host: (method: unknown, params: unknown) => Promise<ServerAnswer | null>;
    /** Open an address outside oculus as a browser tab, with no link back to the page. */
    openUrl: (address: string) => void;
    theme: () => Theme;
    /** Hand a key event to the page's chords. */
    forwardKey: (init: KeyInit) => void;
    /** Say once per name that the app asked for what it may not have. */
    refused: (kind: 'read' | 'write' | 'open' | 'rate', name: string) => void;
    /** Run a command by its id as the frame's app: the server's answer, or null for none. */
    execute: (id: string, args: unknown[]) => Promise<ServerAnswer | null>;
    /** Hold what the frame registers; the word it is refused with, or null. */
    register: (kind: FrameKind, id: string, options: Record<string, unknown>) => string | null;
    unregister: (kind: FrameKind, id: string) => void;
    /** Fold a change of a status item, or of the progress `id` a call of `ui` answered. */
    changed: (
        kind: 'statusItem' | 'progress',
        id: string,
        options: Record<string, unknown>
    ) => void;
    /** Whether the file is an `.html` file of the app the server holds. */
    pageExists: (entry: string) => Promise<boolean>;
    /** Open a tab drawing the entry; the panel's id. */
    openPanel: (viewType: string, title: string, entry: string, preserveFocus: boolean) => string;
    /** Ask the reader on this page alone; the request's id and the promise of its answer. */
    ask: (body: AppRequestBody) => { id: string; answer: Promise<unknown> };
    /** One declared setting of the app, as the server resolves it, or null for no answer. */
    setting: (key: string) => Promise<ServerAnswer | null>;
    /** The file of a custom editor tab, or null for a tab that has none. */
    document: {
        read: () => Promise<ServerAnswer | null>;
        save: (bytes: Uint8Array) => Promise<ServerAnswer | null>;
        dirty: (flag: boolean) => void;
    } | null;
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
    fsAddress: (op: unknown, root: unknown, path: unknown) => Promise<string>;
    commandsRun: (name: unknown) => Promise<void>;
    secretsGet: (key: unknown) => Promise<string | undefined>;
    secretsStore: (key: unknown, value: unknown) => Promise<void>;
    secretsDelete: (key: unknown) => Promise<void>;
    hostRequest: (method: unknown, params: unknown) => Promise<unknown>;
    commandsExecute: (id: unknown, args: unknown) => Promise<unknown>;
    register: (kind: unknown, id: unknown, options: unknown) => Promise<void>;
    unregister: (kind: unknown, id: unknown) => Promise<void>;
    changed: (kind: unknown, id: unknown, options: unknown) => Promise<void>;
    createPanel: (viewType: unknown, title: unknown, options: unknown) => Promise<string>;
    ui: (body: unknown) => Promise<unknown>;
    settingsGet: (key: unknown) => Promise<unknown>;
    documentRead: () => Promise<unknown>;
    documentSave: (bytes: unknown) => Promise<void>;
    documentDirty: (flag: unknown) => Promise<void>;
};

/** The reads of a root's files, each with the marker its address carries. */
const FS_MARKER: Record<string, string> = { read: '.fs', dir: '.dir', stat: '.stat' };

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

/** Whether a value is a plain object, which a frame's options are. */
function plainObject(value: unknown): value is Record<string, unknown> {
    return plainJson(value) && typeof value === 'object' && value !== null && !Array.isArray(value);
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

/** Build the methods of one frame over its context. */
export function createMethods(context: MethodsContext): Methods {
    const now = context.now ?? Date.now;
    const settings = context.settings;
    const writes = createLimiter(() => settings().writesPerMin, 60_000, now);
    const opens = createLimiter(() => settings().opensPerMin, 60_000, now);
    const keys = createLimiter(() => settings().keysPerS, 1_000, now);
    const messages = createLimiter(() => settings().messagesPerMin, 60_000, now);

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

    /** A read of a root's files that is refused `closed`, and the reader told once. */
    function fsClosed(): Promise<never> {
        context.refused('open', 'fs');
        return refuse(REFUSED.closed);
    }

    /** What the server answered to a call, as the app is told: the value, or one refusal word. */
    async function answered(answer: ServerAnswer | null): Promise<unknown> {
        if (!context.alive()) return never();
        if (answer === null) return refuse(failedWith(0));
        if (!answer.ok) return refuse(answer.word);
        return answer.value;
    }

    /** One call of the app's secrets: declared, within the write limit, then the server's. */
    async function secret(
        action: 'get' | 'store' | 'delete',
        key: unknown,
        value?: unknown
    ): Promise<unknown> {
        const row = rowOr();
        if (row === undefined) return refuse(REFUSED.missing);
        if (!row.secrets) return refuse(REFUSED.notDeclared);
        if (action !== 'get' && !writes.take()) return rateRefused();
        return answered(await context.secrets(action, key, value));
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
        },

        fsAddress(op: unknown, root: unknown, path: unknown) {
            const row = rowOr();
            if (row === undefined) return refuse(REFUSED.missing);
            const marker = isText(op)
                ? Object.entries(FS_MARKER).find(([name]) => name === op)
                : undefined;
            if (marker === undefined || !isText(root) || !isText(path)) return fsClosed();
            if (row.disabled || row.key === '') return fsClosed();
            if (root === ENGINE_ROOT) return fsClosed();
            const keys = context.rootKeys();
            if (row.root === '') {
                if (!row.readFolders.some((entry) => inFilesEntry(entry, keys, root, path))) {
                    context.refused('read', root);
                    return refuse(REFUSED.notDeclared);
                }
            } else if (root !== row.root) return fsClosed();
            const whole = path === '' && marker[0] !== 'read';
            if (!whole && !pathSegmentsOpen(path)) return fsClosed();
            const folders = settings().closedPaths.folders;
            if (folders === null || inClosedPaths(path, folders)) return fsClosed();
            if (!context.shown(root)) return refuse(REFUSED.missing);
            const tail = whole ? '' : `/${path.split('/').map(encodeURIComponent).join('/')}`;
            return Promise.resolve(
                `${appAddress(row.root, row.name, row.key)}${marker[1]}/${encodeURIComponent(root)}${tail}`
            );
        },

        async commandsRun(name: unknown) {
            if (!opens.take()) return rateRefused();
            if (rowOr() === undefined) return refuse(REFUSED.missing);
            if (!isText(name) || name === '') return refuse(REFUSED.missing);
            const outcome = await context.runCommand(name);
            if (!context.alive()) return never();
            if (outcome === 'ok') return undefined;
            return refuse(outcome === 'failed' ? failedWith(0) : REFUSED[outcome]);
        },

        secretsGet: (key: unknown) => secret('get', key) as Promise<string | undefined>,
        secretsStore: (key: unknown, value: unknown) =>
            secret('store', key, value).then(() => undefined),
        secretsDelete: (key: unknown) => secret('delete', key).then(() => undefined),

        async commandsExecute(id: unknown, args: unknown) {
            if (!opens.take()) return rateRefused();
            if (rowOr() === undefined) return refuse(REFUSED.missing);
            if (!isText(id) || id === '') return refuse(REFUSED.missing);
            const list = args ?? [];
            if (!Array.isArray(list) || !plainJson(list)) return refuse(t('apps.refused_not_json'));
            return answered(await context.execute(id, list));
        },

        register(kind: unknown, id: unknown, options: unknown) {
            if (rowOr() === undefined) return refuse(REFUSED.missing);
            if (kind !== 'command' && kind !== 'statusItem') return refuse(refusedWith('kind'));
            if (!isText(id) || id === '') return refuse(refusedWith('id'));
            const held = options ?? {};
            if (!plainObject(held)) return refuse(refusedWith('params'));
            const word = context.register(kind, id, held);
            return word === null ? Promise.resolve() : refuse(word);
        },

        unregister(kind: unknown, id: unknown) {
            if (kind !== 'command' && kind !== 'statusItem') return refuse(refusedWith('kind'));
            if (isText(id)) context.unregister(kind, id);
            return Promise.resolve();
        },

        changed(kind: unknown, id: unknown, options: unknown) {
            if (kind !== 'statusItem' && kind !== 'progress') return refuse(refusedWith('kind'));
            const held = options ?? {};
            if (!isText(id) || !plainObject(held)) return refuse(refusedWith('params'));
            context.changed(kind, id, held);
            return Promise.resolve();
        },

        async createPanel(viewType: unknown, title: unknown, options: unknown) {
            if (!opens.take()) return rateRefused();
            if (rowOr() === undefined) return refuse(REFUSED.missing);
            const held = options ?? {};
            if (!isText(viewType) || !isText(title) || !plainObject(held)) {
                return refuse(refusedWith('params'));
            }
            const entry = member(held, 'entry');
            if (!isText(entry) || !entry.endsWith('.html')) return refuse(REFUSED.missing);
            if (!(await context.pageExists(entry))) return refuse(REFUSED.missing);
            if (!context.alive()) return never();
            return context.openPanel(
                viewType,
                title,
                entry,
                member(held, 'preserveFocus') === true
            );
        },

        async ui(body: unknown) {
            const row = rowOr();
            if (row === undefined) return refuse(REFUSED.missing);
            const request = uiBody(body);
            if (request === null) return refuse(refusedWith('params'));
            if (!messages.take()) return rateRefused();
            const asked = context.ask(request);
            if (request.kind === 'progress') return asked.id;
            const answer = await asked.answer;
            if (!context.alive()) return never();
            return answer ?? null;
        },

        async settingsGet(key: unknown) {
            const row = rowOr();
            if (row === undefined) return refuse(REFUSED.missing);
            if (!isText(key) || !key.startsWith(`${row.name}.`)) return refuse(REFUSED.notDeclared);
            return answered(await context.setting(key));
        },

        async documentRead() {
            if (context.document === null) return refuse(REFUSED.notDeclared);
            return answered(await context.document.read());
        },

        async documentSave(bytes: unknown) {
            if (context.document === null) return refuse(REFUSED.notDeclared);
            if (!(bytes instanceof Uint8Array)) return refuse(refusedWith('params'));
            if (!writes.take()) return rateRefused();
            await answered(await context.document.save(bytes));
            return undefined;
        },

        documentDirty(flag: unknown) {
            if (context.document === null) return refuse(REFUSED.notDeclared);
            if (typeof flag !== 'boolean') return refuse(refusedWith('params'));
            context.document.dirty(flag);
            return Promise.resolve();
        },

        async hostRequest(method: unknown, params: unknown) {
            const row = rowOr();
            if (row === undefined) return refuse(REFUSED.missing);
            if (row.host === '') return refuse(REFUSED.notDeclared);
            if (params !== undefined && !plainJson(params))
                return refuse(t('apps.refused_not_json'));
            return answered(await context.host(method, params ?? null));
        }
    };
}
