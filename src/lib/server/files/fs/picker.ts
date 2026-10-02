// Layer 2, server. The folder panel of POST /api/folders/pick: macOS's own panel for choosing
// folders (NSOpenPanel), opened by a JavaScript for Automation script that `osascript -l
// JavaScript` runs, so there is no build step and no native module.
//
// The panel lists and serves nothing. It answers the paths the reader chose, and a path becomes a
// root only through the add of a root (server/edit/writes/config/roots.ts or POST /api/fs), so
// nothing outside a root is served because a panel returned it.
//
// The subprocess is one injectable runner, so a test hands in one that prints what a panel would
// and no test opens a panel. One panel is open at a time: a request that arrives while one is open
// is answered `busy`, since a second window over the first would answer to nobody. The open state
// is a field of the ServerContext, so two servers in one process hold two panels.
//
// The answers, each with no-store headers: `{ ok: true, paths }` (an empty list when the panel was
// cancelled), `{ error: 'unsupported' }` off macOS, `{ error: 'failed' }` when the script exits
// with a non-zero status, and `{ error: 'busy' }`.

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

/** What the script came to: its exit status, and what it printed. */
export type PickRun = { code: number | null; out: string };

/** Run the script and say what it printed, with no timeout: the panel waits for the reader. */
export type PickRunner = (script: string) => Promise<PickRun>;

/** Whether a panel is open now, held by one ServerContext. */
export type PickerState = { open: boolean };

/** A state with no panel open, for a ServerContext being built. */
export function pickerState(): PickerState {
    return { open: false };
}

/** The two calls a test replaces: the platform the server runs on, and the script's runner. */
export type PickDeps = {
    platform?: NodeJS.Platform;
    run?: PickRunner;
};

/** What every answer of this route carries besides its type: nothing of it is cached. */
const NO_STORE = { 'cache-control': 'no-store' };

/** The real runner: `osascript -l JavaScript -e <script>`. */
const osascript: PickRunner = (script) =>
    new Promise((resolve) => {
        execFile(
            'osascript',
            ['-l', 'JavaScript', '-e', script],
            { encoding: 'utf8' },
            (error, stdout) => {
                const code = error === null ? 0 : typeof error.code === 'number' ? error.code : 1;
                resolve({ code, out: stdout });
            }
        );
    });

/** The paths a run printed, one a line, the empty lines dropped. */
function pathsOf(out: string): string[] {
    return out.split('\n').filter((line) => line.trim() !== '');
}

/**
 * POST /api/folders/pick: open the folder panel and answer the folders the reader chose. The order
 * is the order of the refusals: the token, the platform, a panel already open, and only then the
 * panel.
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
    if ((deps.platform ?? process.platform) !== 'darwin') {
        return json({ error: 'unsupported' }, { status: 400, headers: NO_STORE });
    }
    if (state.open) return json({ error: 'busy' }, { status: 409, headers: NO_STORE });
    state.open = true;
    try {
        const done = await (deps.run ?? osascript)(PICKER_SCRIPT);
        if (done.code !== 0) return json({ error: 'failed' }, { status: 500, headers: NO_STORE });
        return json({ ok: true, paths: pathsOf(done.out) }, { headers: NO_STORE });
    } catch {
        return json({ error: 'failed' }, { status: 500, headers: NO_STORE });
    } finally {
        state.open = false;
    }
}
