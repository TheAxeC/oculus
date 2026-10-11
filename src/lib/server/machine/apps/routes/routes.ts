// Layer 2, server. The /api/ routes of the apps that approve and read, each as a function of the
// request and what it reads: POST /api/approve, GET /api/app-store and GET /api/app-open. A route
// module may export only its verbs, so everything a request does is here (or in host.ts and
// manage.ts for the host, the secrets and the management of apps) and the files under
// src/routes/api/(apps)/ are the lines that join them.
//
// The two GET routes are the page's own reads. They write nothing, answer for any app the watcher
// holds, and are called by the page alone: they sit under /api/, so the origin guard of
// src/hooks.server.ts refuses the opaque origin of an app's frame before they run. A disabled app
// is refused `closed` by both. The POST carries the write token and runs behind the process's write
// chain, as the other writes of the approvals file do; the watcher is told after its own write, so
// the app's key is in the held row before the answer is sent and a revoke stops serving at once.

import { json } from '@sveltejs/kit';
import { homedir } from 'node:os';
import trash from 'trash';
import { z } from 'zod';
import { tokenedBody } from '../../../core/auth.ts';
import { chained, type FsWrites } from '../../../core/json.ts';
import {
    appsSettings,
    closedPaths,
    configDir,
    textCatalog,
    type LocalConfig
} from '../../../../data/sources/config.ts';
import { browserRoots } from '../../../files/roots.ts';
import type { Root } from '../../../files/files.ts';
import { defaultHistoryDir } from '../../../files/fs/history.ts';
import { approveApp, defaultApprovalsPath, revokeApp } from '../../approvals/approvals.ts';
import type { AppHosts } from '../host/manager.ts';
import { appById, type AppsHeld } from '../read/held.ts';
import type { WalkLimits } from '../read/record.ts';
import { checkOpen, diskFs, type OpenFs } from '../reach/open.ts';
import { closedToApps } from '../reach/private.ts';
import type { FsContext } from '../reach/fs.ts';
import type { AppSecrets } from '../secrets/secrets.ts';
import { readStore } from '../store/store.ts';

export const NO_STORE = { 'cache-control': 'no-store' };

/** What the routes need of the watcher. */
type AppsAccess = {
    held(): AppsHeld;
    /** Read every app now, which the answers of the routes depend on. */
    reread(): void;
    keep(id: string, manifestHash: string): void;
    unkeep(id: string): void;
    /** The record file of the disabled apps. */
    stateFile(): string;
    /** The key the current workspace has in that file. */
    workspace(): string;
    /** The machine's apps folder, which may not exist yet. */
    folder(): string;
};

/** What the routes read of the process. */
export type AppsRouteOptions = {
    apps: AppsAccess;
    approvalsFile: () => string;
    writes: FsWrites;
    /** The kilobytes above which a store is not read whole. */
    storeMaxKb: () => number;
    /** The roots the file browser shows, with their directories written out. */
    roots: () => Root[];
    /** Oculus's own config folder. */
    configDir: string;
    /** The folders `closed_paths` names, or null while the key is missing or is no list. */
    closedPaths: () => readonly string[] | null;
    /** The real paths of the folders and files closed to every app. */
    privateReal: () => readonly string[];
    /** The text catalog the token refusal is worded from, read when a refusal is made. */
    text: () => Record<string, string>;
    fs: OpenFs;
    /** The most names a folder lists, and the limits a copied app folder is held to. */
    scanEntries: () => number;
    limits: () => WalkLimits;
    /** The local history's folder, where a save copies the file it replaces. */
    history: () => string;
    hosts: AppHosts;
    secrets: AppSecrets;
    /** Move a path to the system trash. */
    trash: (path: string) => Promise<void>;
};

/** What the options are made from: the parts of the process's server context the routes read. */
export type AppsRouteServer = {
    apps: AppsAccess;
    hosts: AppHosts;
    secrets: AppSecrets;
    fsWrites: FsWrites;
    engine: string;
    local: LocalConfig;
    /** The home folder; the machine's own when absent. */
    home?: string;
};

/**
 * The options of the three routes for one request. `config` is the request's one read of the
 * configuration, called when a setting or the roots are asked for.
 */
export function routeOptions(
    server: AppsRouteServer,
    config: () => Record<string, unknown>
): AppsRouteOptions {
    return {
        apps: server.apps,
        approvalsFile: () => server.local.approvals ?? defaultApprovalsPath(),
        writes: server.fsWrites,
        storeMaxKb: () => appsSettings(config()).storeMaxKb,
        roots: () => browserRoots({ config: config(), engine: server.engine, local: server.local }),
        configDir: configDir(server.engine),
        closedPaths: () => closedPaths(config()).folders,
        privateReal: () =>
            closedToApps({
                home: server.home ?? homedir(),
                engine: server.engine,
                local: server.local,
                roots: browserRoots({
                    config: config(),
                    engine: server.engine,
                    local: server.local
                })
            }),
        text: () => textCatalog(config()),
        fs: diskFs,
        scanEntries: () => appsSettings(config()).scanEntries,
        limits: () => {
            const settings = appsSettings(config());
            return { files: settings.maxFiles, bytes: settings.maxMb * 1024 * 1024 };
        },
        history: () => server.local.history ?? defaultHistoryDir(),
        hosts: server.hosts,
        secrets: server.secrets,
        trash: (path) => trash(path, { glob: false })
    };
}

/** What a read of a root's files by an app is judged by, for the app files route. */
export function reachOf(options: AppsRouteOptions): FsContext {
    return {
        roots: options.roots(),
        configDir: options.configDir,
        closedPaths: options.closedPaths(),
        privateReal: options.privateReal(),
        fs: options.fs,
        scanEntries: options.scanEntries()
    };
}

export const refuse = (error: string, status: number): Response =>
    json({ error }, { status, headers: NO_STORE });

/** The body of a POST: an approval of the hash shown, or a revoke. */
const approveShape = z.discriminatedUnion('action', [
    z.object({
        action: z.literal('approve'),
        view: z.string(),
        hash: z.string(),
        keep: z.boolean().optional()
    }),
    z.object({ action: z.literal('revoke'), view: z.string() })
]);

/**
 * POST /api/approve. An approval is of the hash the reader was shown: it is refused with 409
 * `changed` when the app's current hash is another one. `keep` holds for a machine app and a root
 * app alike. Every app is read again first, so the answer is of the disk now.
 */
export async function handleApprovePost(
    request: Request,
    token: string,
    options: AppsRouteOptions
): Promise<Response> {
    const read = await tokenedBody(request, token, { headers: NO_STORE, text: options.text });
    if (read instanceof Response) return read;
    const body = approveShape.safeParse(read.body);
    if (!body.success) return refuse('action must be approve or revoke, with its fields', 400);
    const action = body.data;
    return chained(options.writes, () => {
        options.apps.reread();
        const app = appById(options.apps.held(), action.view);
        if (app === undefined) return refuse('missing', 404);
        const file = options.approvalsFile();
        if (action.action === 'revoke') {
            const done = revokeApp(file, app.row.folder);
            if (!done.ok) return refuse(done.error, 409);
            options.apps.unkeep(app.id);
        } else {
            if (action.hash !== app.row.hash) return refuse('changed', 409);
            const label =
                app.row.root === '' ? app.row.title : `${app.row.title} (${app.row.root})`;
            const done = approveApp(file, { hash: app.row.hash, folder: app.row.folder, label });
            if (!done.ok) return refuse(done.error, 409);
            if (action.keep === true) options.apps.keep(app.id, app.manifestHash);
            else options.apps.unkeep(app.id);
        }
        options.apps.reread();
        return json({ ok: true }, { headers: NO_STORE });
    });
}

/** A query parameter given exactly once and not empty, or null. */
function once(url: URL, name: string): string | null {
    const all = url.searchParams.getAll(name);
    return all.length === 1 && all[0] !== '' ? all[0] : null;
}

/** GET /api/app-store?view=<view id>: the version and the value of one app's store. */
export function handleStoreGet(request: Request, options: AppsRouteOptions): Response {
    const view = once(new URL(request.url), 'view');
    if (view === null) return refuse('view must be given once', 400);
    const app = appById(options.apps.held(), view);
    if (app === undefined) return refuse('missing', 404);
    if (app.row.disabled) return refuse('closed', 403);
    const store = readStore(app.row.storeFile, options.storeMaxKb());
    return json({ version: store.version, value: store.value }, { headers: NO_STORE });
}

/** GET /api/app-open?app=&root=&path=: whether the app may have the file opened. */
export function handleOpenGet(request: Request, options: AppsRouteOptions): Response {
    const url = new URL(request.url);
    const view = once(url, 'app');
    const root = once(url, 'root');
    const path = once(url, 'path');
    if (view === null || root === null || path === null) {
        return refuse('app, root and path must each be given once', 400);
    }
    const app = appById(options.apps.held(), view);
    if (app === undefined) return refuse('missing', 404);
    if (app.row.disabled) return json({ result: 'closed' }, { headers: NO_STORE });
    const result = checkOpen(
        { app, root, path },
        {
            roots: options.roots(),
            configDir: options.configDir,
            closedPaths: options.closedPaths(),
            privateReal: options.privateReal(),
            fs: options.fs
        }
    );
    return json({ result }, { headers: NO_STORE });
}
