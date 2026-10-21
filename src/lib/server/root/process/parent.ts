// Layer 2, server. What the server process and the process that started it say to each other, and
// the body that identifies an oculus. The desktop host forks `src/server.ts` as a utility process;
// the process's parent port is the one channel between them, and both ends import the shapes from
// here so a message is spelled once.
//
// The server says `listening` on every listen of the http server (the first one and each move of
// the port), `failed` when the first listen fails, and `pick-folders` when the reader asks for a
// folder panel, with the folder to open at and whether one folder is wanted. The host answers a
// `pick-folders` with a `picked` carrying the same id and either the chosen paths, `cancelled`, or
// `failed`. The server also says `app-themes` before its first listen and after every read of the
// apps that changes them: the colour themes of apps the `theme` and `app_theme` options name, as a
// page's first load carries them (machine/apps/routes/theme.ts, `firstAppThemes`), which the host
// fills a new window by (desktop/windows/start-colours.ts).
//
// `HEALTH_BODY` is what `GET /api/health` answers. The host asks that route on a port that refused
// the server, so a port held by an oculus is told from a port held by another program.

import type { AppThemeFile, AppThemeFiles } from '../../../data/helpers/files/apps/choices.ts';

/** The body of `GET /api/health`. */
export const HEALTH_BODY = { app: 'oculus' } as const;

/** What the server process says to its parent. */
export type ServerMessage =
    | { kind: 'listening'; port: number }
    | { kind: 'failed'; reason: string; port: number }
    | { kind: 'pick-folders'; id: number; start?: string; single?: true }
    | { kind: 'app-themes'; files: AppThemeFiles };

/** What the parent says to the server process. */
export type MainMessage =
    | { kind: 'picked'; id: number; paths: string[] }
    | { kind: 'picked'; id: number; cancelled: true }
    | { kind: 'picked'; id: number; failed: true };

/** The parent port of a utility process, as far as this module uses it. */
export type ParentPort = {
    postMessage(message: unknown): void;
    on(event: 'message', listener: (event: { data: unknown }) => void): void;
};

/** The channel to the parent: what is sent, and who hears what the parent sends. */
type Parent = {
    send: (message: ServerMessage) => void;
    onMain: (listener: (message: MainMessage) => void) => void;
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function isPort(value: unknown): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 65535;
}

function isId(value: unknown): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

/** The kinds of VS Code theme a theme file may be. */
const UI_THEMES: readonly unknown[] = ['vs', 'vs-dark', 'hc-black', 'hc-light'];

/** The theme file one raw value is, or null for a value not shaped as one. */
function readThemeFile(raw: unknown): AppThemeFile | null {
    if (!isRecord(raw) || !isRecord(raw.theme) || !UI_THEMES.includes(raw.uiTheme)) return null;
    const { colors, tokenColors } = raw.theme;
    if (typeof raw.label !== 'string' || typeof raw.app !== 'string') return null;
    if (!isRecord(colors) || !Array.isArray(tokenColors)) return null;
    if (!Object.values(colors).every((one) => typeof one === 'string')) return null;
    return {
        theme: { colors: colors as Record<string, string>, tokenColors },
        uiTheme: raw.uiTheme as AppThemeFile['uiTheme'],
        label: raw.label,
        app: raw.app
    };
}

/** The theme files by saved name one raw value is, or null when one entry is not shaped as one. */
function readThemeFiles(raw: unknown): AppThemeFiles | null {
    if (!isRecord(raw)) return null;
    const files: AppThemeFiles = {};
    for (const [name, value] of Object.entries(raw)) {
        const file = value === null ? null : readThemeFile(value);
        if (value !== null && file === null) return null;
        files[name] = file;
    }
    return files;
}

/** The message of the server process one raw value is, or null for a value of no known kind. */
export function readServerMessage(raw: unknown): ServerMessage | null {
    if (!isRecord(raw)) return null;
    if (raw.kind === 'listening' && isPort(raw.port)) return { kind: 'listening', port: raw.port };
    if (raw.kind === 'failed' && typeof raw.reason === 'string' && isPort(raw.port)) {
        return { kind: 'failed', reason: raw.reason, port: raw.port };
    }
    if (raw.kind === 'pick-folders' && isId(raw.id)) {
        return {
            kind: 'pick-folders',
            id: raw.id,
            ...(typeof raw.start === 'string' && raw.start !== '' ? { start: raw.start } : {}),
            ...(raw.single === true ? { single: true as const } : {})
        };
    }
    if (raw.kind === 'app-themes') {
        const files = readThemeFiles(raw.files);
        return files === null ? null : { kind: 'app-themes', files };
    }
    return null;
}

/** The message of the parent one raw value is, or null for a value of no known kind. */
function readMainMessage(raw: unknown): MainMessage | null {
    if (!isRecord(raw) || raw.kind !== 'picked' || !isId(raw.id)) return null;
    if (raw.cancelled === true) return { kind: 'picked', id: raw.id, cancelled: true };
    if (raw.failed === true) return { kind: 'picked', id: raw.id, failed: true };
    if (Array.isArray(raw.paths) && raw.paths.every((one) => typeof one === 'string')) {
        return { kind: 'picked', id: raw.id, paths: raw.paths };
    }
    return null;
}

/**
 * The channel over a utility process's parent port, or null for a process with no parent. A
 * message of the parent of no known kind is ignored.
 */
export function parentOf(port: ParentPort | undefined): Parent | null {
    if (port === undefined) return null;
    return {
        send: (message) => port.postMessage(message),
        onMain: (listener) =>
            port.on('message', (event) => {
                const message = readMainMessage(event.data);
                if (message !== null) listener(message);
            })
    };
}

/**
 * The folder panel as the parent shows it, for the picker's `ask`: sends `pick-folders` and
 * answers when the `picked` of the same id arrives. A `picked` whose id names no request in flight
 * is ignored. The answer is the chosen paths, null for a cancel, and a failure rejects.
 */
export function askParentToPick(
    parent: Parent
): (options: { start?: string; single?: boolean }) => Promise<string[] | null> {
    let next = 0;
    const waiting = new Map<number, (message: MainMessage) => void>();
    parent.onMain((message) => {
        const answer = waiting.get(message.id);
        if (answer === undefined) return;
        waiting.delete(message.id);
        answer(message);
    });
    return (options) =>
        new Promise((resolve, reject) => {
            const id = next;
            next += 1;
            waiting.set(id, (message) => {
                if ('paths' in message) resolve(message.paths);
                else if ('cancelled' in message) resolve(null);
                else reject(new Error('the folder panel failed'));
            });
            parent.send({
                kind: 'pick-folders',
                id,
                ...(options.start === undefined ? {} : { start: options.start }),
                ...(options.single === true ? { single: true as const } : {})
            });
        });
}
