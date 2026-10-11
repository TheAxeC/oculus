// Layer 2, client state. What an app's calls are judged by, as functions of their arguments: the
// words a refusal is, whether a value is plain JSON, how large a value is, and the part of a
// channel's message a root app is given.
//
// Every refusal is one fixed word as a plain string, never an `Error` object: penpal sends a
// rejected `Error` with its name, message and stack, and any other rejected value as it is, so a
// string carries nothing of the page to the app.

import type { AppRow, GitPayload, Message } from '../../../data/model/index.ts';
import { channelAccess } from '../../../data/helpers/files/apps.ts';

/** The words a call is refused with, except `refused:<reason>` and `failed:<status>`. */
export const REFUSED = {
    notDeclared: 'not_declared',
    closed: 'closed',
    tooLarge: 'too_large',
    rate: 'rate',
    declined: 'declined',
    missing: 'missing'
} as const;

/** The word for a refusal the server gave, with the reason the server named. */
export function refusedWith(reason: string): string {
    return `refused:${reason}`;
}

/**
 * A rejection with one word, as a plain string. penpal sends a rejected `Error` with its name,
 * message and stack and any other value as it is, so a string carries nothing of the page to the
 * app.
 */
export function rejectWith(word: string): Promise<never> {
    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- an Error would carry the page's stack to the app
    return Promise.reject(word);
}

/** The word for an error status the write route answered. */
export function failedWith(status: number): string {
    return `failed:${status}`;
}

/**
 * Whether a value is plain JSON: null, a boolean, a finite number, a string, or an array or plain
 * object of these with no cycle. `undefined`, `NaN`, infinity, a function, a symbol, a bigint and
 * any object with a prototype of its own (`Map`, `Date`, a class instance) are not. A value met
 * again below itself is a cycle; the same value met twice side by side is not.
 */
export function plainJson(value: unknown, path: object[] = []): boolean {
    if (value === null) return true;
    if (typeof value === 'boolean' || typeof value === 'string') return true;
    if (typeof value === 'number') return Number.isFinite(value);
    if (typeof value !== 'object') return false;
    if (path.includes(value)) return false;
    const next = [...path, value];
    if (Array.isArray(value)) return value.every((one) => plainJson(one, next));
    const proto = Object.getPrototypeOf(value) as unknown;
    if (proto !== Object.prototype && proto !== null) return false;
    return Object.values(value).every((one) => plainJson(one, next));
}

/** The text JSON gives a value, or undefined for one JSON has no text for (`undefined`, a
 * function). */
export function jsonText(value: unknown): string | undefined {
    return JSON.stringify(value);
}

/** The size in bytes of a value as the text JSON gives it, and the empty text for no value. */
function jsonBytes(value: unknown): number {
    const text = jsonText(value);
    return text === undefined ? 0 : new TextEncoder().encode(text).length;
}

/** Whether a value is larger than `kb` kilobytes of 1024 bytes. */
export function overKb(value: unknown, kb: number): boolean {
    return jsonBytes(value) > kb * 1024;
}

/** How a channel stands for one app: readable, not listed in its manifest, or closed. */
export function readAccess(row: AppRow, channel: string): 'ok' | 'not_declared' | 'closed' {
    if (!row.reads.includes(channel)) return REFUSED.notDeclared;
    const access = channelAccess(channel).access;
    if (access === 'open') return 'ok';
    return access === 'machine' && row.root === '' ? 'ok' : REFUSED.closed;
}

/**
 * The part of a message a root app is given, or the message itself for a machine app. The `git`
 * channel gives the one entry keyed by the root's folder, and the `files` channel only a notice
 * whose root is that folder and whose `folders`, when it has them, are not an empty list; the
 * bookmarks and workspaces notices name no root and reach machine apps alone.
 * A message of any other channel is whole, since the manifest reader refused a root app that
 * declares a channel it may not have. `dir` is the root's folder, or null when the file browser
 * shows no root of the app's key.
 */
export function partOf(row: AppRow, message: Message, dir: string | null): Message | null {
    if (row.root === '') return message;
    if (message.channel === 'git') {
        const held = message.payload as GitPayload;
        const entry = dir === null ? undefined : (held as Partial<GitPayload>)[dir];
        const payload: GitPayload = entry === undefined || dir === null ? {} : { [dir]: entry };
        return { ...message, payload };
    }
    if (message.channel === 'files') {
        const notice = message.payload as {
            root?: string;
            folders?: string[];
            workspaces?: boolean;
        };
        if (dir === null || notice.root !== dir) return null;
        // A notice naming no folder, and no flag, says nothing changed under the app's root.
        const empty = Array.isArray(notice.folders) && notice.folders.length === 0;
        return empty && notice.workspaces !== true ? null : message;
    }
    return message;
}

/**
 * Where the file browser shows an app's folder: the key of the root that holds it and the path
 * under that root, or null when no served root holds it. A root app is in its own root, under
 * `.oculus/apps/<name>`; a machine app is shown through whichever served root its folder lies in.
 */
export function folderIn(
    row: { root: string; name: string; folder: string },
    roots: readonly { key: string; dir: string }[]
): { root: string; path: string } | null {
    if (row.root !== '') {
        return roots.some((one) => one.key === row.root)
            ? { root: row.root, path: `.oculus/apps/${row.name}` }
            : null;
    }
    for (const one of roots) {
        const dir = one.dir.replace(/\/+$/, '');
        if (dir === '' || !row.folder.startsWith(`${dir}/`)) continue;
        return { root: one.key, path: row.folder.slice(dir.length + 1) };
    }
    return null;
}

/**
 * The frames a message from an app's host goes to: the frames of that app, restricted to the tab
 * the message names, or all of them when it names none.
 */
export function hostTargets<T extends { id: string; instance: string }>(
    frames: Iterable<T>,
    message: { app: string; tab: string }
): T[] {
    return [...frames].filter(
        (frame) =>
            frame.id === message.app && (message.tab === '' || message.tab === frame.instance)
    );
}
