// Layer 2, server (the desktop host). The build of the checkout's server, which `npm run app` runs
// once it holds the single-instance lock and before it starts the server, so the app from the
// checkout always serves the checkout's code. The build is `vite build --mode app`, which writes
// the app's own folders (process/build-folders.ts) and no folder of `npm run build`, run by
// Electron's own Node (ELECTRON_RUN_AS_NODE) in the checkout, its output printed on the app's
// output under the prefix the caller names. A packaged app runs no build.

import { spawn, type ChildProcess } from 'node:child_process';
import { join } from 'node:path';
import { APP_MODE } from '../../lib/server/root/process/build-folders.ts';
import { errorReason } from './error-line.ts';

/** What a build came to: it built, or it failed with the line of its error output that says why. */
type BuildResult = { ok: true } | { ok: false; reason: string };

/** A build in progress and the way to end it. */
export type Build = { done: Promise<BuildResult>; abort: () => void };

/** Run `vite build --mode app` in `root`, handing each output line to `say`. */
export function buildServer(root: string, say: (line: string, error: boolean) => void): Build {
    const vite = join(root, 'node_modules', 'vite', 'bin', 'vite.js');
    const child: ChildProcess = spawn(process.execPath, [vite, 'build', '--mode', APP_MODE], {
        cwd: root,
        env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
        stdio: ['ignore', 'pipe', 'pipe']
    });
    const reason = errorReason();
    const lines = (stream: NodeJS.ReadableStream | null, error: boolean): void => {
        let rest = '';
        stream?.on('data', (chunk: Buffer) => {
            const parts = (rest + chunk.toString()).split('\n');
            rest = parts.pop() ?? '';
            for (const line of parts) {
                if (line.trim() === '') continue;
                if (error) reason.note(line);
                say(line, error);
            }
        });
    };
    lines(child.stdout, false);
    lines(child.stderr, true);
    const done = new Promise<BuildResult>((resolve) => {
        child.once('error', (error) => resolve({ ok: false, reason: error.message }));
        child.once('exit', (code, signal) => {
            resolve(
                code === 0
                    ? { ok: true }
                    : { ok: false, reason: reason.text() || String(signal ?? code) }
            );
        });
    });
    return { done, abort: () => void child.kill() };
}
