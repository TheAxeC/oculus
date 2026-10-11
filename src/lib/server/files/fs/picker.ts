// Layer 2, server. The folder panel of POST /api/folders/pick: macOS's own panel for choosing
// folders (NSOpenPanel), opened by a JavaScript for Automation script that `osascript -l
// JavaScript` runs, so there is no build step and no native module. A server started by the
// desktop host has a parent that shows the panel instead, as a sheet on the window the reader is
// in: the state then holds `ask`, and the script is not run.
//
// The panel lists and serves nothing. It answers the paths the reader chose, and a path becomes a
// root only through the add of a root (server/edit/writes/config/lists/roots.ts or POST /api/fs),
// so nothing outside a root is served because a panel returned it.
//
// The panel lives only while someone waits for its answer. Each press makes an AbortController,
// which the state holds as `panel` while the panel is open, and the runner is given its signal, so
// an abort ends osascript. It is aborted when the connection the request came on closes (the page
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
// cancelled the panel, which osascript reports as error -128, or the sheet), `{ error:
// 'unsupported' }` off macOS when there is no parent to ask, `{ error: 'failed' }` when the script
// exits with another non-zero status, the parent's panel fails, or the connection or the server
// ended the panel (which no page reads), and `{ error: 'busy' }`.

import { execFile } from 'node:child_process';
import { json } from '@sveltejs/kit';
import { tokenedBody } from '../../core/auth.ts';

/**
 * The script the panel runs: folders only, several at once, in front, starting at the home folder.
 */
export const PICKER_SCRIPT = [
    "ObjC.import('AppKit');",
    'const panel = $.NSOpenPanel.openPanel;',
    'panel.canChooseDirectories = true;',
    'panel.canChooseFiles = false;',
    'panel.allowsMultipleSelection = true;',
    "panel.prompt = 'Add';",
    'panel.directoryURL = $.NSURL.fileURLWithPath($.NSHomeDirectory());',
    '$.NSApplication.sharedApplication.activateIgnoringOtherApps(true);',
    'const chosen = [];',
    'if (panel.runModal === 1) {',
    '    const urls = panel.URLs;',
    '    for (let at = 0; at < urls.count; at += 1) {',
    '        chosen.push(ObjC.unwrap(urls.objectAtIndex(at).path));',
    '    }',
    '}',
    "chosen.join('\\n');"
].join('\n');

/** What the script came to: its exit status, what it printed and what it wrote to stderr. */
export type PickRun = { code: number | null; out: string; err: string };

/**
 * Run the script and say what it printed, with no timeout: the panel waits for the reader, and
 * the signal ends it. A signal that is aborted already starts nothing.
 */
export type PickRunner = (script: string, signal: AbortSignal) => Promise<PickRun>;

/**
 * The panel as the parent process shows it: the chosen paths, null when the reader cancelled, and
 * a rejection when it failed.
 */
type PickAsk = () => Promise<string[] | null>;

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
 * The three things a test replaces: the platform the server runs on, the script's runner and the
 * connection the request came on.
 */
export type PickDeps = {
    platform?: NodeJS.Platform;
    run?: PickRunner;
    connection?: PickConnection;
};

/** What every answer of this route carries besides its type: nothing of it is cached. */
const NO_STORE = { 'cache-control': 'no-store' };

/** The real runner: `osascript -l JavaScript -e <script>`. */
const osascript: PickRunner = (script, signal) =>
    new Promise((resolve) => {
        execFile(
            'osascript',
            ['-l', 'JavaScript', '-e', script],
            { encoding: 'utf8', signal },
            (error, stdout, stderr) => {
                const code = error === null ? 0 : typeof error.code === 'number' ? error.code : 1;
                resolve({ code, out: stdout, err: stderr });
            }
        );
    });

/** Whether a run is the reader's Cancel: osascript's error -128 on the last line of its stderr. */
function cancelled(run: PickRun): boolean {
    return run.code !== 0 && run.err.trimEnd().endsWith('(-128)');
}

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
 * panel already open, and only then the panel. The panel ends with the request's connection and
 * with the server's close, and a cancel by the reader answers no folders.
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
    if (state.ask === undefined && (deps.platform ?? process.platform) !== 'darwin') {
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
            const chosen = await Promise.race([state.ask(), endsWith(panel.signal)]);
            return json({ ok: true, paths: chosen ?? [] }, { headers: NO_STORE });
        }
        const done = await (deps.run ?? osascript)(PICKER_SCRIPT, panel.signal);
        if (cancelled(done)) return json({ ok: true, paths: [] }, { headers: NO_STORE });
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
