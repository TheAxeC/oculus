// Layer 2, server. The watcher of the apps: it finds the apps of the machine's folder and of each
// root the file browser shows while oculus runs, and publishes them on the `apps` channel.
//
// It owns the handles it needs and no more. A recursive `fs.watch` lies over the real path of the
// machine's apps folder, of each shown root's `.oculus/apps` (the engine's config folder holds no
// apps) and of each app folder that is itself a link, since a recursive watch does not follow a
// link; a plain one lies over each folder that holds the store of a listed app; and the approvals
// file is watched by its own path and opened again after every event, since a write by rename
// replaces the file. It never watches `~/.oculus` as a whole, whose other files change on every
// write. A burst of events is one read after a short quiet, lodash's `debounce` with a maximum wait
// as every watcher here has; a read walks and hashes every app again. An event from a store folder
// alone changes nothing but the stores' sizes and versions, which are read without a walk.
//
// A folder that does not exist is no finding. One timer looks again at every folder it waits for
// (the machine's, a root's `.oculus/apps`, a store folder, the approvals file) every two seconds
// and starts watching each when it appears. The roots are read again on a `config` push and when
// the saved workspaces file changes, which is polled as the git watcher polls it, so a root added
// in the page is read at the next tick and a root that leaves the file browser loses its handles.
//
// The keeping of a machine app (the app stays approved while its files change, until its manifest
// changes or the process ends) is held here, in memory, as the hash of the manifest approved.

import { existsSync, lstatSync, watch, type FSWatcher } from 'node:fs';
import { homedir } from 'node:os';
import { isAbsolute, join, resolve } from 'node:path';
import { debounce as debounced } from 'lodash-es';
import type { AppRow } from '../../../data/model/index.ts';
import { appsSettings, localFile, type LocalConfig } from '../../../data/sources/config.ts';
import type { Hub, Sink } from '../../core/channels.ts';
import {
    pollFile,
    systemClock,
    type Clock,
    type FilePoll,
    type Timer
} from '../../core/file-poll.ts';
import { expandHome, type Root } from '../../files/files.ts';
import { defaultWorkspacesPath } from '../../files/fs.ts';
import { approvedApps, defaultApprovalsPath } from '../../machine/approvals/approvals.ts';
import { noApps, payloadOf, type AppsHeld } from '../../machine/apps/held.ts';
import { scanApps } from '../../machine/apps/scan.ts';
import { defaultAppData, readStore } from '../../machine/apps/store.ts';
import type { Watcher } from './portfolio.ts';

/** Milliseconds of quiet after the last event before one read. */
const DEBOUNCE = 300;
/** Milliseconds the first event of a burst waits at most for its read. */
const MAX_WAIT = 2 * DEBOUNCE;
/** Milliseconds between two looks for a folder that is not there yet. */
const LOOK = 2000;
/** Milliseconds between two stats of the saved workspaces file. */
const POLL = 500;

export type AppsWatcher = Watcher & {
    /** The state the last read left. */
    held(): AppsHeld;
    /** Read every app now, and publish when the result differs from the one held. */
    reread(): void;
    /** Read the stores' sizes and versions now, which a store write moves and nothing else. */
    rereadStores(): void;
    /**
     * Take the paths the machine's own values name again (the apps folder, the approvals file, the
     * saved workspaces file) and the roots the file browser shows now, then read every app.
     */
    follow(): void;
    /** Keep a machine app approved while its files change, as long as its manifest is this one. */
    keep(id: string, manifestHash: string): void;
    /** End the keeping of an app. */
    unkeep(id: string): void;
};

export type AppsWatchOptions = {
    /** The directory the configuration is read from. */
    engine: string;
    /** The second secret the address keys are made with. */
    secret: string;
    /** The machine's own values as they are now. */
    local: () => LocalConfig;
    /** The merged configuration as it is now. */
    config: () => Record<string, unknown>;
    /** The roots the file browser shows as it is now. */
    roots: () => Root[];
    /** The folder the machine apps' stores live in; `~/.oculus/app-data` when absent. */
    appData?: string;
    clock?: Clock;
    /** Milliseconds of quiet before a read; a value over MAX_WAIT is the wait. */
    debounce?: number;
    look?: number;
    poll?: number;
};

/** The machine's apps folder: `apps_dir` resolved as the other folders of local.yml are. */
function machineFolder(local: LocalConfig, engine: string): string {
    const dir = local.appsDir;
    if (dir === undefined) return join(homedir(), '.oculus', 'apps');
    const home = expandHome(dir);
    return isAbsolute(home) ? home : resolve(engine, home);
}

function reason(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/** Whether something is at the path, a link that points at nothing included. */
function present(path: string): boolean {
    try {
        lstatSync(path);
        return true;
    } catch {
        return false;
    }
}

/** Start the apps watcher; it reads once before it returns. */
export function watchApps(hub: Hub, options: AppsWatchOptions): AppsWatcher {
    const clock = options.clock ?? systemClock;
    const quiet = options.debounce ?? DEBOUNCE;
    const kept = new Map<string, string>();
    const appData = options.appData ?? defaultAppData();
    const handles = new Map<string, FSWatcher>();
    let state: AppsHeld = noApps();
    let roots: Root[] = [];
    let published = '';
    let closed = false;
    let fullPending = false;
    let approvalsHandle: { path: string; handle: FSWatcher } | null = null;
    let workspaces: { path: string; poll: FilePoll } | null = null;
    let looking: Timer | null = null;
    let missing: string[] = [];

    const approvalsPath = (): string => options.local().approvals ?? defaultApprovalsPath();
    const workspacesPath = (): string => options.local().workspaces ?? defaultWorkspacesPath();

    const publish = (): void => {
        const payload = payloadOf(state);
        const text = JSON.stringify(payload);
        if (text === published) return;
        published = text;
        hub.publish('apps', payload);
    };

    /** The folders that hold the stores of the apps held, each once. */
    const storeFolders = (): string[] => {
        const folders = new Set<string>();
        for (const app of state.apps) folders.add(join(app.row.storeFile, '..'));
        return [...folders];
    };

    const close = (path: string): void => {
        handles.get(path)?.close();
        handles.delete(path);
    };

    const open = (path: string, recursive: boolean, full: boolean): void => {
        if (handles.has(path)) return;
        try {
            const handle = watch(path, { recursive, persistent: false }, () => {
                if (closed) return;
                if (full) fullPending = true;
                queued();
            });
            handle.on('error', () => {
                close(path);
                fullPending = true;
                queued();
            });
            handles.set(path, handle);
        } catch (error) {
            console.error(`apps watch: cannot watch ${path}: ${reason(error)}`);
        }
    };

    /** Open the approvals file's handle, and open it again after every event. */
    const openApprovals = (): void => {
        const path = approvalsPath();
        if (approvalsHandle !== null) {
            if (approvalsHandle.path === path) return;
            approvalsHandle.handle.close();
            approvalsHandle = null;
        }
        if (!existsSync(path)) return;
        try {
            const handle = watch(path, { persistent: false }, () => {
                if (closed) return;
                handle.close();
                if (approvalsHandle?.handle === handle) approvalsHandle = null;
                fullPending = true;
                queued();
            });
            handle.on('error', () => {
                handle.close();
                if (approvalsHandle?.handle === handle) approvalsHandle = null;
            });
            approvalsHandle = { path, handle };
        } catch (error) {
            console.error(`apps watch: cannot watch ${path}: ${reason(error)}`);
        }
    };

    /** The folders waiting to appear: each path a read would start watching if it were there. */
    const waitingFor = (): string[] => {
        const waiting: string[] = [];
        const machine = machineFolder(options.local(), options.engine);
        waiting.push(machine);
        for (const root of roots) {
            waiting.push(join(expandHome(root.dir), '.oculus', 'apps'));
        }
        waiting.push(...storeFolders());
        waiting.push(approvalsPath());
        return waiting.filter((path) => !present(path));
    };

    /** Watch what the last read found, drop what it does not hold, and look for the rest. */
    const arrange = (): void => {
        const recursive = new Set([...state.folders, ...state.links]);
        const plain = new Set(storeFolders().filter((folder) => present(folder)));
        for (const path of [...handles.keys()]) {
            if (!recursive.has(path) && !plain.has(path)) close(path);
        }
        for (const path of recursive) open(path, true, true);
        for (const path of plain) if (!recursive.has(path)) open(path, false, false);
        openApprovals();
        missing = waitingFor();
        if (missing.length > 0 && looking === null && !closed) schedule();
    };

    const schedule = (): void => {
        looking = clock.setTimeout(() => {
            looking = null;
            if (closed) return;
            if (missing.some((path) => present(path))) read();
            else if (missing.length > 0) schedule();
        }, options.look ?? LOOK);
    };

    /** A full read: the roots, the machine's values, the approvals file, and every folder. */
    const read = (): void => {
        if (closed) return;
        fullPending = false;
        const local = options.local();
        const config = options.config();
        const settings = appsSettings(config);
        state = scanApps({
            machine: machineFolder(local, options.engine),
            localFile: localFile(options.engine),
            roots: roots.map((root) => ({ ...root, dir: expandHome(root.dir) })),
            config,
            settings,
            port: local.port,
            approved: approvedApps(approvalsPath()),
            kept,
            secret: options.secret,
            appData
        });
        arrange();
        publish();
    };

    /** A read of the stores alone: every app's size and version of its store file. */
    const readStores = (): void => {
        if (closed) return;
        const limit = appsSettings(options.config()).storeMaxKb;
        const before = state.apps;
        const apps = state.apps.map((app) => {
            const store = readStore(app.row.storeFile, limit, false);
            if (store.bytes === app.row.storeBytes && store.version === app.row.storeVersion) {
                return app;
            }
            const row: AppRow = {
                ...app.row,
                storeBytes: store.bytes,
                storeVersion: store.version
            };
            return { ...app, row };
        });
        if (apps.every((app, index) => app === before[index])) return;
        state = { ...state, apps };
        publish();
    };

    const queued = debounced(
        () => {
            if (closed) return;
            if (fullPending) read();
            else readStores();
        },
        quiet,
        { maxWait: MAX_WAIT }
    );

    /** Read the roots the file browser shows now. */
    const readRoots = (): void => {
        try {
            roots = options.roots();
        } catch (error) {
            console.error(`apps watch: the roots could not be read: ${reason(error)}`);
        }
    };

    /** Poll the saved workspaces file, taking the file the machine's values name now. */
    const pollWorkspaces = (): void => {
        const path = workspacesPath();
        if (workspaces !== null && workspaces.path === path) return;
        workspaces?.poll.close();
        const poll = pollFile(path, { clock, every: options.poll ?? POLL }, () => {
            poll.reading();
            fullPending = true;
            readRoots();
            queued();
        });
        poll.reading();
        workspaces = { path, poll };
    };

    const sink: Sink = {
        send: (text: string) => {
            try {
                if ((JSON.parse(text) as { channel?: string }).channel === 'config') {
                    fullPending = true;
                    readRoots();
                    queued();
                }
            } catch (error) {
                console.error(`apps watch: unreadable message: ${reason(error)}`);
            }
            return Promise.resolve();
        },
        close: () => {
            // The probe holds no handle, so closing it frees nothing.
        }
    };

    readRoots();
    pollWorkspaces();
    read();
    hub.subscribe(sink, ['config']);

    return {
        held: () => state,
        reread(): void {
            queued.cancel();
            readRoots();
            read();
        },
        rereadStores(): void {
            queued.cancel();
            readStores();
        },
        follow(): void {
            readRoots();
            pollWorkspaces();
            queued.cancel();
            read();
        },
        keep(id: string, manifestHash: string): void {
            kept.set(id, manifestHash);
        },
        unkeep(id: string): void {
            kept.delete(id);
        },
        close(): void {
            closed = true;
            queued.cancel();
            hub.remove(sink);
            for (const path of [...handles.keys()]) close(path);
            approvalsHandle?.handle.close();
            approvalsHandle = null;
            workspaces?.poll.close();
            workspaces = null;
            if (looking !== null) clock.clearTimeout(looking);
            looking = null;
        }
    };
}
