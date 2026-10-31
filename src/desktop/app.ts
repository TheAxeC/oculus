// Layer 2, server (the desktop host). The app: it takes the single-instance lock, builds the
// checkout's server when it runs from the checkout, starts the server as a utility process, and
// opens the first window on the port the server reports. It keeps the windows, the menu and the
// bridge, and ends the server with the app. It is a function of the default port, so a run can
// hand it another one; main.ts is the shipped call.
//
// What it does at the edges: a second start prints a line and ends; a port that is held is told
// from an oculus (`GET /api/health`) and either named or offered a window; a server that ends while
// the app runs is offered a restart; a quit stops the server and waits for it, at most five
// seconds, and leaves the tmux sessions running. Its standard output and error are guarded against
// a reader that has gone (output.ts), so a closed pipe never ends it.

import { app, Menu, nativeImage, nativeTheme, session, shell } from 'electron';
import { existsSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DESKTOP_MARK } from '../lib/data/helpers/editor/start-theme.ts';
import type { AppThemeFiles } from '../lib/data/helpers/files/apps/choices.ts';
import type { RecentEntry } from '../lib/data/helpers/keys/oculus/menu-commands.ts';
import { engineDir } from '../lib/data/sources/config.ts';
import { wordsOf } from '../lib/server/root/process/words.ts';
import { LISTEN_HOST } from '../lib/server/root/mover.ts';
import { appHandler } from '../lib/server/root/process/build-folders.ts';
import { machineFacts, machineLacks } from '../lib/server/root/process/start/first-run.ts';
import { parseAppArgs, type AppArgs } from './decide/args.ts';
import { EVENT } from './decide/channels.ts';
import { permissionGranted } from './decide/permissions.ts';
import { ZOOM_LEAST, ZOOM_MOST } from './decide/window-file.ts';
import { say as showDialog } from './dialogs.ts';
import { dropClosed, guardOutput } from './output.ts';
import { buildServer, type Build } from './server/build.ts';
import { fetchAppThemes, oculusAnswers } from './server/health.ts';
import { loginEnvironment } from './server/login-env.ts';
import { forkServer, type ServerProcess } from './server/process.ts';
import { registerBridge } from './windows/bridge.ts';
import { printPdf } from './windows/print.ts';
import { buildMenu } from './windows/menu.ts';
import { commandWindow, openInBrowser, type MenuActions } from './windows/menu-template.ts';
import { createPicker } from './windows/pick.ts';
import { startColours, startThemeNames } from './windows/start-colours.ts';
import { createWindowStore } from './windows/window-state.ts';
import { createWindows, type Entry } from './windows/windows.ts';

/** What the app is started with. */
export type StartOptions = {
    /** The port a missing local.yml means. */
    defaultPort: number;
};

/** How long a quit waits for the server to end, in milliseconds. */
const STOP_WAIT_MS = 5000;

/** How long the health of a port is waited for when a listen was refused, in milliseconds. */
const HEALTH_WAIT_MS = 2000;

/** The zoom a menu step changes by. */
const ZOOM_STEP = 0.1;

function print(line: string, error = false): void {
    dropClosed(() => {
        if (error) console.error(line);
        else console.log(line);
    });
}

export function startApp(options: StartOptions): void {
    guardOutput();
    const home = homedir();
    app.setName('oculus');
    // Page storage and the single-instance lock follow HOME, so a start under another HOME keeps
    // its own profile and never meets the real one.
    app.setPath('userData', join(home, 'Library', 'Application Support', 'oculus'));
    const checkout = engineDir();

    if (!app.requestSingleInstanceLock()) {
        const t = wordsOf(checkout);
        process.stdout.write(`${t('server.start.already_running')}\n`, () => app.exit(0));
        return;
    }
    // The sheets and the dialogs the app shows follow the page's dark theme.
    nativeTheme.themeSource = 'dark';
    process.on('SIGTERM', () => app.quit());
    process.on('SIGINT', () => app.quit());
    app.on('window-all-closed', () => undefined);
    void app.whenReady().then(() => begin(options, checkout, home));
}

/** The first of everything the app does once Electron is ready. */
async function begin(options: StartOptions, checkout: string, home: string): Promise<void> {
    const argv = process.argv.slice(app.isPackaged ? 1 : 2);
    const args = parseAppArgs(argv, {
        cwd: process.cwd(),
        fallback: checkout,
        hasConfig: (dir) => existsSync(join(dir, 'config')),
        isFile: (path) => statSync(path, { throwIfNoEntry: false })?.isFile() === true
    });
    if ('error' in args) {
        const t = wordsOf(checkout);
        await showDialog(
            {
                message: t('desktop.dialog.args_refused', args.error),
                buttons: [t('desktop.dialog.quit')]
            },
            print
        );
        app.exit(1);
        return;
    }
    await run(options, args, checkout, home);
}

async function run(
    options: StartOptions,
    args: AppArgs,
    checkout: string,
    home: string
): Promise<void> {
    const t = wordsOf(args.engine);
    const say = (message: string, buttons: string[]): Promise<number> =>
        showDialog({ message, buttons }, print);
    let server: ServerProcess | null = null;
    let build: Build | null = null;
    let origin: string | null = null;
    const state = { quitting: false };

    const icon = join(checkout, 'assets', 'app-icon.png');
    if (existsSync(icon)) app.dock?.setIcon(nativeImage.createFromPath(icon));

    const preload = fileURLToPath(new URL('./preload.cjs', import.meta.url));
    // A window onto an oculus this app did not start has no server here to tell it the app themes,
    // so the host asks that oculus for them before the window opens (`attachedThemes`).
    let attachedThemes: AppThemeFiles = {};
    const colours = () =>
        startColours(args.engine, checkout, server?.appThemes() ?? attachedThemes);
    const windows = createWindows({
        preload,
        colours,
        store: createWindowStore(join(home, '.oculus', 'window.json')),
        log: (line) => print(`[app] ${line}`),
        ownPort: (port) => server?.port() === port,
        onListening: (listener) => server?.onListening(listener) ?? (() => undefined),
        followed: (next) => {
            if (server === null) origin = next;
        }
    });
    /** The recent workspaces a page last sent, which the menu's Open Recent lists. */
    let recent: RecentEntry[] = [];
    registerBridge(
        windows,
        (address) => printPdf(address, { preload, colours: colours() }),
        (entries) => {
            recent = entries;
            setMenu();
        }
    );

    const pick = createPicker(windows, t, (message) => server?.send(message));

    const ses = session.defaultSession;
    // Every window of the app loads its pages on the default session, so the mark rides every
    // request they make, a reload's included, and tells the server the page is in the app's window,
    // which starts on `app_theme`; a browser's request never carries it.
    ses.setUserAgent(`${ses.getUserAgent()} ${DESKTOP_MARK}`);
    const originOf = (url: string): string => {
        try {
            return new URL(url).origin;
        } catch {
            return '';
        }
    };
    ses.setPermissionRequestHandler((contents, permission, callback, details) => {
        const served = windows.serverOriginOf(contents);
        callback(
            served !== null &&
                permissionGranted(permission, originOf(details.requestingUrl), served)
        );
    });
    ses.setPermissionCheckHandler((contents, permission, requestingOrigin) => {
        const served = contents === null ? null : windows.serverOriginOf(contents);
        return served !== null && permissionGranted(permission, requestingOrigin, served);
    });

    /** Bring a window forward. */
    function show(entry: Entry): void {
        if (entry.win.isMinimized()) entry.win.restore();
        entry.win.show();
        entry.win.focus();
    }

    /** Show a main window, opening one when none is open. */
    function showMain(): void {
        const main = windows.lastMain();
        if (main !== null) show(main);
        else if (origin !== null) windows.openMain(origin);
    }

    app.on('second-instance', showMain);
    app.on('activate', () => {
        if (windows.entries().length === 0) showMain();
    });

    /** Change the zoom of the window the reader is in. */
    function zoom(step: 'in' | 'out' | 'reset'): void {
        const entry = windows.focused();
        if (entry === null) return;
        const contents = entry.win.webContents;
        const now = contents.getZoomFactor();
        const next = step === 'reset' ? 1 : now + (step === 'in' ? ZOOM_STEP : -ZOOM_STEP);
        contents.setZoomFactor(Math.min(ZOOM_MOST, Math.max(ZOOM_LEAST, next)));
        windows.remember(entry);
    }

    /**
     * What the menu's items ask of the app. A page command goes to the window `commandWindow`
     * names, which is shown, with Open Recent's path as the message's one argument.
     */
    const menuActions: MenuActions = {
        newWindow: () => {
            if (origin !== null) windows.openMain(origin);
        },
        closeWindow: windows.closeFocused,
        command: (name, path) => {
            const target = commandWindow(name, windows.reader(), windows.lastMain());
            if (target === null) return;
            show(target);
            const contents = target.win.webContents;
            if (path === undefined) contents.send(EVENT, 'command', name);
            else contents.send(EVENT, 'command', name, path);
        },
        zoom,
        switchToMain: showMain,
        openInBrowser: () => {
            const where = windows.reader();
            const entry = where.kind === 'entry' ? where.entry : null;
            openInBrowser(entry, windows.lastMain(), (address) => {
                void shell.openExternal(address);
            });
        }
    };

    /** Set the application menu, over the recent workspaces a page last sent. */
    function setMenu(): void {
        Menu.setApplicationMenu(buildMenu(t, menuActions, recent));
    }
    setMenu();

    let stopped = false;
    app.on('before-quit', (event) => {
        if (stopped) return;
        event.preventDefault();
        if (state.quitting) return;
        state.quitting = true;
        windows.quitting();
        build?.abort();
        void (server?.stop(STOP_WAIT_MS) ?? Promise.resolve()).then(() => {
            stopped = true;
            app.exit(0);
        });
    });

    /** Fork the server and see what its first listen comes to. */
    async function startServer(env: NodeJS.ProcessEnv): Promise<void> {
        const forked = forkServer({
            entry: join(checkout, 'src', 'server.ts'),
            engine: args.engine,
            handler: appHandler(checkout),
            defaultPort: options.defaultPort,
            env,
            name: app.name,
            say: (line, error) => print(`[server] ${line}`, error),
            onPick: pick
        });
        server = forked;
        // Every listen, the first and each move of the port, is where the next window opens.
        forked.onListening((port) => (origin = `http://${LISTEN_HOST}:${port}`));
        forked.onLost((code, reason) => {
            if (state.quitting) return;
            void ended(code, reason, env);
        });
        const started = await forked.started;
        if (state.quitting) return;
        if (started.kind === 'listening') {
            // A restart finds its windows open. A page reconnects to the new server on its own and
            // takes its new write token; a window on another port than the new server's goes
            // there. A start finds no window.
            if (origin !== null) {
                windows.moveTo(origin);
                if (windows.lastMain() === null) windows.openMain(origin);
            }
        } else if (started.kind === 'failed') {
            await refused(forked, started.reason, started.port);
        } else {
            await ended(started.code, started.reason, env);
        }
    }

    /**
     * A first listen that failed: name the port, or offer a window onto the oculus holding it. The
     * server process is waited out first, so no second server runs while the dialog is open.
     */
    async function refused(forked: ServerProcess, reason: string, port: number): Promise<void> {
        server = null;
        await forked.stop(STOP_WAIT_MS);
        if (reason !== 'EADDRINUSE') {
            await say(t('desktop.dialog.server_failed', reason), [t('desktop.dialog.quit')]);
            app.quit();
            return;
        }
        if (!(await oculusAnswers(port, HEALTH_WAIT_MS))) {
            await say(t('desktop.dialog.port_other', port), [t('desktop.dialog.quit')]);
            app.quit();
            return;
        }
        const pressed = await say(t('desktop.dialog.port_oculus', port), [
            t('desktop.dialog.open_window'),
            t('desktop.dialog.quit')
        ]);
        if (pressed === 0) {
            origin = `http://${LISTEN_HOST}:${port}`;
            attachedThemes = await fetchAppThemes(
                port,
                startThemeNames(args.engine),
                HEALTH_WAIT_MS
            );
            windows.openMain(origin);
        } else {
            app.quit();
        }
    }

    /** A server that ended, before it listened or while the app was running. */
    async function ended(code: number, reason: string, env: NodeJS.ProcessEnv): Promise<void> {
        const pressed = await say(t('desktop.dialog.server_exited', code, reason), [
            t('desktop.dialog.restart'),
            t('desktop.dialog.quit')
        ]);
        if (pressed === 0 && !state.quitting) await startServer(env);
        else app.quit();
    }

    if (!app.isPackaged) {
        build = buildServer(checkout, (line, error) => print(`[build] ${line}`, error));
        const built = await build.done;
        build = null;
        if (state.quitting) return;
        if (!built.ok) {
            await say(t('desktop.dialog.build_failed', built.reason), [t('desktop.dialog.quit')]);
            app.exit(1);
            return;
        }
    }
    let env: NodeJS.ProcessEnv = process.env;
    let loginSlow = false;
    if (app.isPackaged) {
        const login = await loginEnvironment();
        if (login === null) loginSlow = true;
        else env = { ...process.env, ...login };
    }
    if (state.quitting) return;
    // The programs are looked up in the environment the server will get.
    const lacks = machineLacks(await machineFacts(options.defaultPort, env), t);
    const required = lacks.filter((lack) => lack.required);
    if (required.length > 0) {
        const sentences = required.map((lack) => lack.sentence).join('\n');
        await say(t('desktop.dialog.lack_refused', sentences), [t('desktop.dialog.quit')]);
        app.exit(1);
        return;
    }
    await startServer(env);
    // One sheet of the first window says everything the reader should know once the app is up: the
    // login shell that did not answer and the programs that were not found. A sheet leaves the
    // event loop running.
    const first = windows.lastMain();
    const notices = [
        ...(loginSlow ? [t('desktop.dialog.env_slow')] : []),
        ...(lacks.length > 0
            ? [t('desktop.dialog.lacks', lacks.map((lack) => lack.sentence).join('\n'))]
            : [])
    ];
    if (notices.length > 0 && first !== null) {
        const pressed = await showDialog(
            {
                message: notices.join('\n\n'),
                buttons: [t('desktop.dialog.continue'), t('desktop.dialog.quit')],
                cancel: 0,
                window: first.win
            },
            print
        );
        if (pressed === 1) app.quit();
    }
}
