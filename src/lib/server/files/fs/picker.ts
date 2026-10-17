// Layer 2, server. The folder panel of POST /api/folders/pick, a program of the platform the
// server runs on, so there is no build step and no native module: on macOS its own panel for
// choosing folders (NSOpenPanel), opened by a JavaScript for Automation script that `osascript -l
// JavaScript` runs, and on Linux, WSL2 among it, `zenity --file-selection --directory`. A server
// started by the desktop host has a parent that shows the panel instead, as a sheet on the window
// the reader is in: the state then holds `ask`, and no program is run.
//
// The panel lists and serves nothing. It answers the paths the reader chose, and a path becomes a
// root only through the add of a folder (server/edit/writes/config/lists/folders.ts), so nothing
// outside the folders of the workspace is served because a panel returned it.
//
// The panel lives only while someone waits for its answer. Each press makes an AbortController,
// which the state holds as `panel` while the panel is open, and the runner is given its signal, so
// an abort ends the program. It is aborted when the connection the request came on closes (the page
// went away, or a restart of the dev server destroyed the socket), at once when that connection is
// already gone, and by `closePicker` when the server that owns the state closes. With the desktop
// sheet the wait is raced against the same controller: the handler stops waiting and the sheet's
// late answer is read by nobody, so it adds no folder. There is no time limit, since a limit would
// end a panel the page still waits on.
//
// The subprocess is one injectable runner, so a test hands in one that prints what a panel would
// and no test opens a panel. One panel is open at a time: a request that arrives while one is open
// is answered `busy`, since a second window over the first would answer to nobody. The open panel
// is a field of the ServerContext, so two servers in one process hold two panels.
//
// The answers, each with no-store headers: `{ ok: true, paths }` (an empty list when the reader
// cancelled the panel, which osascript reports as error -128 and zenity as exit 1 with nothing
// printed, or the sheet), `{ error: 'unsupported' }` on a platform other than macOS and Linux when
// there is no parent to ask, `{ error: 'no-picker' }` when the program is not installed (zenity is
// a package of its own on Linux), `{ error: 'failed' }` when the program exits with another
// non-zero status, the parent's panel fails, or the connection or the server ended the panel
// (which no page reads), and `{ error: 'busy' }`.

import { execFile } from 'node:child_process';
import { statSync } from 'node:fs';
import { homedir } from 'node:os';
import { json } from '@sveltejs/kit';
import { tokenedBody } from '../../core/auth.ts';

/**
 * What a request may ask of the panel: the folder it opens at (the home folder when absent or not
 * an absolute path) and whether it takes one folder rather than several. A single-folder panel says
 * Choose on its button, and the other says Add.
 */
type PickOptions = { start?: string; single?: boolean };

/** Whether a path is a folder on this machine. */
function isFolder(path: string): boolean {
    try {
        return statSync(path).isDirectory();
    } catch {
        return false;
    }
}

/**
 * The options a request body carries, each kept only when it has its shape: a start that is not an
 * absolute path to a folder that exists is left out, so the panel opens at the home folder.
 */
function pickOptionsOf(body: unknown): PickOptions {
    const held = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
    const start =
        typeof held.start === 'string' && held.start.startsWith('/') && isFolder(held.start)
            ? held.start
            : undefined;
    return {
        ...(start === undefined ? {} : { start }),
        ...(held.single === true ? { single: true } : {})
    };
}

/**
 * The script the panel runs: folders only, starting at the folder asked for or the home folder,
 * with several folders to choose from unless one is asked for. The panel is drawn above every
 * window and takes the keyboard: `osascript` is a process with no window of its own, which
 * activating brings nothing forward for, so the script makes it an accessory app (activation policy
 * 1, which may own the key window and shows no Dock icon), sets the panel's level to the modal
 * panel level (8, NSModalPanelWindowLevel, above the windows of every app) and makes it key and
 * front before it runs.
 */
export function pickerScript(options: PickOptions = {}): string {
    const start =
        options.start === undefined ? '$.NSHomeDirectory()' : JSON.stringify(options.start);
    return [
        "ObjC.import('AppKit');",
        'const panel = $.NSOpenPanel.openPanel;',
        'panel.canChooseDirectories = true;',
        'panel.canChooseFiles = false;',
        'panel.canCreateDirectories = true;',
        `panel.allowsMultipleSelection = ${options.single === true ? 'false' : 'true'};`,
        `panel.prompt = ${options.single === true ? "'Choose'" : "'Add'"};`,
        `panel.directoryURL = $.NSURL.fileURLWithPath(${start});`,
        '$.NSApplication.sharedApplication.setActivationPolicy(1);',
        '$.NSApplication.sharedApplication.activateIgnoringOtherApps(true);',
        'panel.level = 8;',
        'panel.makeKeyAndOrderFront(null);',
        'const chosen = [];',
        'if (panel.runModal === 1) {',
        '    const urls = panel.URLs;',
        '    for (let at = 0; at < urls.count; at += 1) {',
        '        chosen.push(ObjC.unwrap(urls.objectAtIndex(at).path));',
        '    }',
        '}',
        "chosen.join('\\n');"
    ].join('\n');
}

/** The platforms that have a folder panel program, each a key of PANELS. */
type PanelPlatform = 'darwin' | 'linux';

/** The panel program of each platform: its argv for the options, and how it reports a cancel. */
const PANELS: Record<
    PanelPlatform,
    { argv: (options: PickOptions) => string[]; cancelled: (run: PickRun) => boolean }
> = {
    darwin: {
        argv: (options) => ['osascript', '-l', 'JavaScript', '-e', pickerScript(options)],
        // osascript's error -128 on the last line of its stderr.
        cancelled: (run) => run.code !== 0 && run.err.trimEnd().endsWith('(-128)')
    },
    linux: {
        argv: (options) => [
            'zenity',
            '--file-selection',
            '--directory',
            // A trailing slash opens the panel inside the folder rather than at its parent.
            `--filename=${options.start ?? homedir()}/`,
            ...(options.single === true ? [] : ['--multiple', '--separator=\n'])
        ],
        // zenity exits 1 with nothing printed when the reader cancels or closes the panel.
        cancelled: (run) => run.code === 1 && run.out.trim() === ''
    }
};

/** The panel program of a platform, or undefined for a platform with none. */
function panelOf(platform: NodeJS.Platform) {
    return platform === 'darwin' || platform === 'linux' ? PANELS[platform] : undefined;
}

/**
 * What the program came to: its exit status, what it printed and what it wrote to stderr, and
 * `missing` when the program was not found on the PATH.
 */
export type PickRun = { code: number | null; out: string; err: string; missing?: boolean };

/**
 * Run the program the argv names and say what it printed, with no timeout: the panel waits for
 * the reader, and the signal ends it. A signal that is aborted already starts nothing.
 */
export type PickRunner = (argv: readonly string[], signal: AbortSignal) => Promise<PickRun>;

/**
 * The panel as the parent process shows it: the chosen paths, null when the reader cancelled, and
 * a rejection when it failed.
 */
type PickAsk = (options: PickOptions) => Promise<string[] | null>;

/**
 * The panel open now, as the controller that ends it, or null with none; held by one
 * ServerContext, together with the parent's panel when the server has a parent.
 */
export type PickerState = { panel: AbortController | null; ask?: PickAsk };

/** A state with no panel open, for a ServerContext being built. */
export function pickerState(): PickerState {
    return { panel: null };
}

/** Close the panel the state holds open, as a closing server does: the run is ended. */
export function closePicker(state: PickerState): void {
    state.panel?.abort();
}

/** The part of a node Socket the handler reads: whether it is gone, and its `close` event. */
export type PickConnection = {
    destroyed: boolean;
    once(event: 'close', listener: () => void): unknown;
    off(event: 'close', listener: () => void): unknown;
};

/**
 * The three things a test replaces: the platform the server runs on, the program's runner and the
 * connection the request came on.
 */
export type PickDeps = {
    platform?: NodeJS.Platform;
    run?: PickRunner;
    connection?: PickConnection;
};

/** What every answer of this route carries besides its type: nothing of it is cached. */
const NO_STORE = { 'cache-control': 'no-store' };

/** The real runner: the argv's program, found on the PATH, with the rest as its arguments. */
const runProgram: PickRunner = ([program, ...args], signal) =>
    new Promise((resolve) => {
        execFile(program, args, { encoding: 'utf8', signal }, (error, stdout, stderr) => {
            const code = error === null ? 0 : typeof error.code === 'number' ? error.code : 1;
            const missing = error !== null && error.code === 'ENOENT';
            resolve({ code, out: stdout, err: stderr, ...(missing ? { missing } : {}) });
        });
    });

/** A promise that rejects when the signal aborts, for a wait that must end with the panel. */
function endsWith(signal: AbortSignal): Promise<never> {
    return new Promise((_, reject) => {
        const stop = (): void => reject(new Error('the panel was ended'));
        if (signal.aborted) stop();
        else signal.addEventListener('abort', stop, { once: true });
    });
}

/** The paths a run printed, one a line, the empty lines dropped. */
function pathsOf(out: string): string[] {
    return out.split('\n').filter((line) => line.trim() !== '');
}

/**
 * POST /api/folders/pick: open the folder panel and answer the folders the reader chose. The order
 * is the order of the refusals: the token, the platform (any platform with a parent to ask), a
 * panel already open, and only then the panel, refused as `no-picker` when its program is not
 * installed. The panel ends with the request's connection and with the server's close, and a
 * cancel by the reader answers no folders.
 */
export async function handlePick(
    request: Request,
    token: string,
    state: PickerState,
    deps: PickDeps = {}
): Promise<Response> {
    const read = await tokenedBody(request, token, {
        headers: NO_STORE,
        words: { token: 'token', json: 'not-json' }
    });
    if (read instanceof Response) return read;
    const options = pickOptionsOf(read.body);
    const program = panelOf(deps.platform ?? process.platform);
    if (state.ask === undefined && program === undefined) {
        return json({ error: 'unsupported' }, { status: 400, headers: NO_STORE });
    }
    if (state.panel !== null) return json({ error: 'busy' }, { status: 409, headers: NO_STORE });
    const panel = new AbortController();
    const end = (): void => panel.abort();
    state.panel = panel;
    deps.connection?.once('close', end);
    if (deps.connection?.destroyed === true) end();
    try {
        if (state.ask !== undefined) {
            const chosen = await Promise.race([state.ask(options), endsWith(panel.signal)]);
            return json({ ok: true, paths: chosen ?? [] }, { headers: NO_STORE });
        }
        if (program === undefined) throw new Error('no panel program');
        const done = await (deps.run ?? runProgram)(program.argv(options), panel.signal);
        if (done.missing === true) {
            return json({ error: 'no-picker' }, { status: 400, headers: NO_STORE });
        }
        if (program.cancelled(done)) return json({ ok: true, paths: [] }, { headers: NO_STORE });
        if (done.code !== 0 || panel.signal.aborted) {
            return json({ error: 'failed' }, { status: 500, headers: NO_STORE });
        }
        return json({ ok: true, paths: pathsOf(done.out) }, { headers: NO_STORE });
    } catch {
        return json({ error: 'failed' }, { status: 500, headers: NO_STORE });
    } finally {
        deps.connection?.off('close', end);
        state.panel = null;
    }
}
