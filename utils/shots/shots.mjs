// Layer 4, tool. `npm run docs:shots`: take the three screenshots README.md shows again, and write
// them to docs/images/focus.png (the Focus page), docs/images/projects-board.png (the Projects
// board) and docs/images/explorer.png (the Explorer with the manuscript, its PDF and Source
// Control), each 2880 by 1800 pixels: a window of 1440 by 900 CSS pixels at a scale of 2. They are
// drawn on a copy of the made-up demo hub (tests/fixtures/hubs/demo) in the Dark Modern theme, by
// an oculus server of this checkout under a scratch HOME, so nothing of the reader's own hubs,
// sessions or git identity is drawn.
//
// It needs a display (on Linux DISPLAY or WAYLAND_DISPLAY set; `xvfb-run npm run docs:shots` gives
// one), TeX's `latexmk`, git and tmux on PATH, and the packages of `npm ci`. Electron runs it
// (`electron utils/shots/shots.mjs`); its window is never shown and never takes the focus, and the
// Dock shows no icon for it on macOS. To take the shots again, run `npm run docs:shots` from the
// checkout and look at the three files before committing them.
//
// In this order:
//
//   1. Before Electron is ready: its userData folder set to a fresh temporary folder, so nothing is
//      written into the reader's own Electron profile; the scale switch; the Dock icon hidden. Then
//      the needs above are checked, and a lack ends the command with one sentence and exit 1
//      before the build and before the scratch folder is made.
//   2. `npm run build`, whose output is printed when it fails.
//   3. The scratch folder (utils/shots/scratch.mjs) and the copy's changes (utils/shots/hub.mjs).
//   4. The server on a free port (utils/shots/server.mjs).
//   5. The three states, each captured in the scratch folder (utils/shots/page.mjs).
//   6. The captures moved into docs/images/ only once all three are written, so a failed run
//      never leaves a mixed set; files of other names there are left as they are.
//   7. On success and on every failure: the program the command is running (the build, latexmk
//      or git) ended, the server ended, `tmux kill-server` run under the scratch folder's
//      TMUX_TMPDIR, the scratch folder and the userData folder removed, and Electron quit, with
//      exit 0 only when all three files are in docs/images/. Chromium writes into the userData
//      folder while Electron shuts down, so a detached shell removes it again once the process is
//      gone. The process's exit, where Node gives one, runs what the ending has not, and an
//      interrupt runs the whole of it.
//
// Its sentences to the terminal are its own literals, as every tool under utils/ prints its own:
// no view of oculus shows them, so they are not in oculus's text catalog. Electron's default app
// loads this file as an ES module and waits for its top level before Electron is ready, so the top
// level never awaits `app.whenReady()` and the work is chained on it instead.

import { app } from 'electron';
import { spawn, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, renameSync, rmSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mustRun, Refusal, runProgram } from './programs.mjs';
import { FIXTURE, freshFolder, makeScratch, removeFolder, scratchEnv } from './scratch.mjs';

/** The window's content size in CSS pixels, and the scale it is drawn at. */
const WIDTH = 1440;
const HEIGHT = 900;
const SCALE = 2;

/** How long `npm run build` may take, in milliseconds. */
const BUILD_LIMIT_MS = 600000;

/**
 * The shell program that removes the userData folder once the command's process is gone: it asks
 * every fifth of a second whether the process (`$1`) still runs, for at most a minute, then removes
 * the folder (`$2`).
 */
const REMOVE_AFTER_EXIT =
    'i=0; while kill -0 "$1" 2>/dev/null && [ "$i" -lt 300 ]; do sleep 0.2; i=$((i+1)); done; rm -rf -- "$2"';

/** How long `tmux kill-server` may take, in milliseconds. */
const TMUX_LIMIT_MS = 10000;

/** The programs the command runs by name, each with the sentence a lack of it ends the run with. */
const NEEDS = [
    [
        'latexmk',
        'latexmk is not on PATH: install TeX Live (https://tug.org/texlive/) or MacTeX, which carry it, and open a new terminal.'
    ],
    [
        'git',
        'git is not on PATH: install it from https://git-scm.com/ or with the system package manager.'
    ],
    [
        'tmux',
        'tmux is not on PATH: install it with `brew install tmux` on macOS or the tmux package of the Linux distribution.'
    ]
];

/** The repository root, two folders above this file. */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** The sentence of the first need the machine lacks, or null when it lacks none. */
async function firstLack() {
    if (
        !existsSync(join(ROOT, 'src', 'server.ts')) ||
        !existsSync(join(ROOT, FIXTURE, '.oculus', 'config.yml'))
    ) {
        return `No oculus checkout holds this file: ${ROOT} has no src/server.ts or ${FIXTURE}; run the command from a checkout of oculus.`;
    }
    let onPath;
    try {
        ({ onPath } = await import('../../src/lib/server/core/program.ts'));
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        return `src/lib/server/core/program.ts of the checkout did not load: ${reason}`;
    }
    for (const [program, sentence] of NEEDS) {
        if (!onPath(program)) return sentence;
    }
    if (
        process.platform === 'linux' &&
        (process.env.DISPLAY ?? '') === '' &&
        (process.env.WAYLAND_DISPLAY ?? '') === ''
    ) {
        return 'No display: neither DISPLAY nor WAYLAND_DISPLAY is set; run the command in a desktop session, or as `xvfb-run npm run docs:shots`.';
    }
    return null;
}

/**
 * Move the captures into docs/images/, replacing files of the same names. Each is copied into the
 * folder under a name of its own first, and all are renamed into place only once every copy is
 * written, so a failure while copying leaves the older set as it was.
 *
 * @param {Record<string, string>} names the file name of each capture, by its key
 * @param {Record<string, string>} taken the path of each capture in the scratch folder, by its key
 * @returns {string[]} the paths written
 */
function placeShots(names, taken) {
    const folder = join(ROOT, 'docs', 'images');
    mkdirSync(folder, { recursive: true });
    const staged = [];
    try {
        for (const [key, name] of Object.entries(names)) {
            const part = join(folder, `.${name}.part`);
            copyFileSync(taken[key], part);
            staged.push({ part, to: join(folder, name) });
        }
    } catch (error) {
        for (const one of staged) rmSync(one.part, { force: true });
        throw error;
    }
    for (const one of staged) renameSync(one.part, one.to);
    return staged.map((one) => one.to);
}

/** Print why the command stopped: a refusal's sentence and output, or the error itself. */
function tell(error) {
    if (error instanceof Refusal) {
        console.error(error.message);
        if (error.output !== '') console.error(error.output.trimEnd());
        return;
    }
    const said = error instanceof Error ? (error.stack ?? error.message) : String(error);
    console.error(`The command stopped on an error it does not word: ${said}`);
}

/** The command, from the settings before Electron is ready to its exit. */
async function main() {
    // Before anything else, before Electron is ready; a folder must exist to be set as a path.
    const profile = freshFolder('oculus-shots-electron-');
    app.setPath('userData', profile);
    app.commandLine.appendSwitch('force-device-scale-factor', String(SCALE));
    if (process.platform === 'darwin') app.dock?.hide();

    // Electron's default app, which runs this file, quits when its last window closes. The command
    // closes its window before it ends the server and removes its folders, and quits by itself.
    app.removeAllListeners('window-all-closed');
    app.on('window-all-closed', () => undefined);

    /** What the command has started and made, for the ending to end and remove. */
    const held = {
        /** @type {ReturnType<typeof makeScratch> | null} */
        scratch: null,
        /** @type {NodeJS.ProcessEnv} */
        env: {},
        /** @type {{ stop: () => Promise<void>, kill: () => void } | null} */
        server: null,
        tmuxEnded: false,
        finished: false
    };
    /** Ends the program the command is running (the build, latexmk or git) at an interrupt. */
    const interrupt = new AbortController();

    /** Remove the scratch folder and the userData folder; safe to run twice. */
    function removeFolders() {
        if (held.scratch !== null) removeFolder(held.scratch.dir);
        removeFolder(profile);
    }

    /**
     * Chromium writes its caches into the userData folder while Electron shuts down, after the
     * command's own ending and with no exit event of the process after `app.exit`, so a detached
     * shell removes the folder once this process is gone.
     */
    function removeProfileAfterExit() {
        const after = spawn(
            '/bin/sh',
            ['-c', REMOVE_AFTER_EXIT, 'sh', String(process.pid), profile],
            {
                detached: true,
                stdio: 'ignore'
            }
        );
        after.unref();
    }

    /** End what the command started, remove what it made, and quit Electron with `code`. */
    async function finish(code) {
        if (held.finished) return;
        held.finished = true;
        interrupt.abort();
        try {
            await held.server?.stop();
            if (held.scratch !== null) {
                const options = { cwd: held.scratch.dir, env: held.env, limitMs: TMUX_LIMIT_MS };
                await runProgram('tmux', ['kill-server'], options);
                held.tmuxEnded = true;
            }
        } finally {
            removeFolders();
            removeProfileAfterExit();
            app.exit(code);
        }
    }

    // The process's exit, where Node gives one, runs what the ending has not run yet.
    process.on('exit', () => {
        held.server?.kill();
        if (held.scratch !== null && !held.tmuxEnded) {
            spawnSync('tmux', ['kill-server'], {
                env: held.env,
                stdio: 'ignore',
                timeout: TMUX_LIMIT_MS
            });
        }
        removeFolders();
    });
    for (const signal of ['SIGINT', 'SIGTERM']) {
        process.on(signal, () => {
            console.error(
                `Stopped by ${signal}; ending the server and removing the scratch folder.`
            );
            void finish(1);
        });
    }

    /** Everything after Electron is ready, to the three files in docs/images/. */
    async function run() {
        const signal = interrupt.signal;
        console.log('Building oculus with npm run build.');
        await mustRun(
            'npm',
            ['run', 'build'],
            { cwd: ROOT, env: process.env, limitMs: BUILD_LIMIT_MS, signal },
            'npm run build failed; its output follows.'
        );
        held.scratch = makeScratch(ROOT);
        held.env = scratchEnv(held.scratch);
        console.log(`Preparing the demo copy in ${held.scratch.hub}.`);
        const { prepareHub } = await import('./hub.mjs');
        await prepareHub(held.scratch, held.env, signal, ROOT);
        const { freePort, serverOrigin, startServer } = await import('./server.mjs');
        const port = await freePort();
        console.log(`Starting the server on port ${port}.`);
        const server = startServer(ROOT, held.env, port);
        held.server = server;
        await server.ready;
        const { SHOT_NAMES, takeShots } = await import('./page.mjs');
        const taken = await takeShots({
            root: ROOT,
            origin: serverOrigin(port),
            shots: held.scratch.shots,
            width: WIDTH,
            height: HEIGHT,
            scale: SCALE
        });
        const written = placeShots(SHOT_NAMES, taken);
        for (const path of written) {
            if (statSync(path, { throwIfNoEntry: false })?.isFile() !== true) {
                throw new Refusal(`${path} is not there once the captures were moved.`);
            }
        }
        console.log(`Wrote ${written.join(', ')}.`);
    }

    const lack = await firstLack();
    if (lack !== null) {
        console.error(lack);
        void app.whenReady().then(() => finish(1));
        return;
    }
    void app
        .whenReady()
        .then(run)
        .then(
            () => finish(0),
            (error) => {
                // An interrupt already ended the command, and the failure it caused says nothing.
                if (!held.finished) tell(error);
                return finish(1);
            }
        );
}

await main();
