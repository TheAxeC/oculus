// Layer 2, client state. The apps the page holds: the rows of the `apps` channel, the frames
// mounted for them, and everything that happens between a frame and the rest of the page.
//
// A view draws its frame through `mount`, which builds the methods of that frame over this page
// (state/system/apps/methods.ts), connects them on penpal (bridge.ts) and registers the frame to
// hear the channels its app reads, the theme and its store. One listener on the entities store
// fans every push out: an `apps` push moves the store cache, any other push goes to each mounted
// frame whose app reads that channel, and a root app is given only its own root's part.
//
// What the page holds for a tab's frame besides the element is the tab's run: whether the handshake
// failed, how many times the reader loaded the app again, and the questions a write of the app
// asked and is waiting on. A tab's frame outlives the view that draws its slot (ui/tabs/
// tab-frames.svelte.ts), so none of these is the view's own. A write that asks while another
// question of the same tab is open waits its turn, and every question that is left when the frame
// ends is answered no, so no write is left unsettled.
//
// A frame's calls to its app's host, its secrets and its files go through the methods too: the
// host and secrets calls are POSTs of the write token that name the app in the `x-oculus-app`
// header, and a file is fetched by the frame itself from the address the page judged. A message
// the host sends arrives on the `app-messages` channel and goes to the frames of that app, to the
// tab it names or to every tab. The rows of the hosts are the `app-hosts` channel's.
//
// The approval and the revoke are the two POSTs of /api/approve; the server answers after its
// watcher has read the new approval, so the row the page holds next carries the app's key.

import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { appAddress, appViewId, inAppsFolder } from '../../../data/helpers/files/apps.ts';
import { APP_HEADER, appHeaderValue } from '../../../data/helpers/files/apps.ts';
import type {
    AppHostRow,
    AppMessagesPayload,
    AppRow,
    Finding,
    Message,
    Project
} from '../../../data/model/index.ts';
import type { AppsSettings } from '../../../data/sources/config/settings.ts';
import { t } from '../../shared/words/text.ts';
import type { EntitiesStore, WritesStore } from '../../shared/stores/shapes.ts';
import { connectFrame } from './bridge.ts';
import { appTab, appTabState } from './instance.ts';
import { createFlows, type FlowsStore } from './flows.ts';
import { createManage, type ManageStore } from './manage.ts';
import {
    createMethods,
    type CommandOutcome,
    type KeyInit,
    type OpenResult,
    type ServerAnswer,
    type Theme
} from './methods.ts';
import { REFUSED, failedWith, folderIn, hostTargets, partOf, readAccess } from './rules.ts';
import { createStoreCache, type StoreAnswer } from './store-cache.ts';

export type { AppHostRow, AppRow };

/**
 * What the apps store reads of the rest of the client. The workbench's stores sit above this folder
 * in the state order, so each is described here by the calls this makes on it, and
 * state/client/context.ts hands over the stores themselves.
 */
export type AppsDeps = {
    entities: Pick<EntitiesStore, 'apps' | 'appHosts' | 'message' | 'afterReceive'>;
    /** The socket's subscription, which the host and message channels are added to. */
    socket: {
        subscribe: (channels: string[]) => void;
        onLink: (listener: () => void) => () => void;
    };
    /**
     * Run the command of that name from the commands file of a repository, as a press of it does:
     * the chain approval is asked of the reader and the terminal is shown. The repository is the
     * app's own root, or the hub for a machine app.
     */
    commands: { run: (root: string, name: string) => Promise<CommandOutcome> };
    writes: Pick<WritesStore, 'sendFromApp' | 'postCommand'>;
    ui: {
        instanceState: (id: string) => unknown;
        setInstanceState: (id: string, state: unknown) => void;
    };
    registry: { viewFor: (view: string) => { listed?: boolean } | undefined };
    layout: {
        openView: (view: string, state?: unknown) => string;
        /** Select a tab in its pane. */
        activateInstance: (id: string) => void;
        /** The page or float whose tree holds a tab, or null. */
        holding: (id: string) => { id: string } | null;
        /** Show a page; an id naming no page, a float's, changes nothing. */
        switchPage: (id: string) => void;
        showFolderInFiles: (path: string, root?: string) => string;
    };
    notices: { post: (message: string, options?: { tone?: 'error' }) => unknown };
    settings: () => AppsSettings;
    /** The roots the file browser serves, with the folder of each. */
    served: () => { key: string; dir: string }[];
    /** The project of this key, or null. */
    projectOf: (key: string) => Project | null;
    /** The fetch the store and open reads use; the page's own when absent. */
    fetch?: typeof fetch;
};

/** What a view hands over to mount a frame. */
type MountOptions = {
    frame: HTMLIFrameElement;
    /** The tab's instance id. */
    instance: string;
    /** The app's view id. */
    id: string;
    theme: () => Theme;
    /** Whether the frame has the keyboard. */
    focused: () => boolean;
    /** Raise a key event of the frame on the page's chords. */
    forwardKey: (init: KeyInit) => void;
    /** The view and the state that open a file of a root, as the Files view opens it. */
    tabFor: (root: string, path: string) => { view: string; state: unknown };
};

/** One question a write of an app asks the reader; `answer` settles the write, once. */
type AppQuestion = {
    message: string;
    detail: string;
    answer: (yes: boolean) => void;
};

/** What the page holds for a tab's frame besides the element. */
type AppRun = {
    /** The handshake did not complete in time. */
    failed: boolean;
    /** How many times the reader loaded the app again, which draws a new frame each time. */
    reloads: number;
    /** The question the reader is asked, or null while none is. */
    question: AppQuestion | null;
};

const NO_RUN: AppRun = { failed: false, reloads: 0, question: null };

type Mount = {
    destroy: () => void;
};

/** What an approve or a revoke came to. */
type ApprovalOutcome = { ok: true } | { ok: false; error: string };

export type AppsStore = ManageStore &
    FlowsStore & {
        rows: () => AppRow[];
        /** The host of every app that names one, as the Processes view and the tabs draw them. */
        hosts: () => AppHostRow[];
        /** The host row of this view id, or undefined while the app has none to show. */
        hostOf: (id: string) => AppHostRow | undefined;
        findings: () => Finding[];
        folders: () => string[];
        /** The row of this view id, or undefined. */
        rowOf: (id: string) => AppRow | undefined;
        /** Show the approval panel of an app in its tab, which opens when it is not open. */
        review: (id: string) => void;
        /** Whether the approval panel of this app is being shown in place of its frame. */
        reviewing: (id: string) => boolean;
        /** Put the approval panel away. */
        endReview: (id: string) => void;
        mount: (options: MountOptions) => Mount;
        /** The theme or the wallpaper changed: tell the frame of this tab. */
        themeChanged: (instance: string) => void;
        /** The run of a tab. */
        run: (instance: string) => AppRun;
        /** Load the app of a tab again, which is what the reader asks after a failed load. */
        reload: (instance: string) => void;
        approve: (id: string, hash: string, keep: boolean) => Promise<ApprovalOutcome>;
        revoke: (id: string) => Promise<ApprovalOutcome>;
        /** Show the app's folder in the file browser. */
        showFolder: (id: string) => void;
        /**
         * Whether the configuration the limits come from has arrived. A frame is drawn only then,
         * since its handshake timeout and its rate limits are read from it.
         */
        ready: () => boolean;
        /** The address of an app's entry file, or the empty string while the app is unapproved. */
        srcOf: (row: AppRow) => string;
        /**
         * Whether a file of a root, by the root's key and the path under it, lies in an apps
         * folder, which opens as source text and never as a page.
         */
        holds: (root: string, path: string) => boolean;
    };

/** One mounted frame, as the fan-out sees it. */
type Mounted = {
    id: string;
    instance: string;
    deliver: (message: Message) => void;
    store: (value: unknown) => void;
    theme: () => void;
    /** Hand the frame what its host sent to this tab. */
    host: (method: string, params: unknown) => void;
};

/** A question waiting for its turn, with what settles the write that asked it. */
type Waiting = { message: string; detail: string; resolve: (yes: boolean) => void };

export function createApps(deps: AppsDeps): AppsStore {
    const mounted = new Set<Mounted>();
    const reviews = new SvelteSet<string>();
    const runs = new SvelteMap<string, AppRun>();
    const waiting = new Map<string, Waiting[]>();
    const run = (instance: string): AppRun => runs.get(instance) ?? NO_RUN;
    const setRun = (instance: string, change: Partial<AppRun>): void => {
        runs.set(instance, { ...run(instance), ...change });
    };

    /**
     * Show the question at the head of the tab's line, or none when the line is empty. The page
     * that holds the tab is shown and the tab selected in its pane, since a question drawn in a tab
     * that is not on screen is not seen and the app's call waits on it.
     */
    function showFirst(instance: string): void {
        const first = waiting.get(instance)?.[0];
        if (first === undefined) {
            setRun(instance, { question: null });
            return;
        }
        let settled = false;
        // The question is drawn inside the tab, so its page is shown and the tab selected for the
        // reader to see it.
        const host = deps.layout.holding(instance);
        if (host !== null) deps.layout.switchPage(host.id);
        deps.layout.activateInstance(instance);
        setRun(instance, {
            question: {
                message: first.message,
                detail: first.detail,
                answer: (yes) => {
                    if (settled) return;
                    settled = true;
                    const line = waiting.get(instance) ?? [];
                    line.shift();
                    if (line.length === 0) waiting.delete(instance);
                    first.resolve(yes);
                    showFirst(instance);
                }
            }
        });
    }

    function ask(
        instance: string,
        question: { message: string; detail: string }
    ): Promise<boolean> {
        return new Promise((resolve) => {
            const line = waiting.get(instance) ?? [];
            line.push({ ...question, resolve });
            waiting.set(instance, line);
            if (line.length === 1) showFirst(instance);
        });
    }

    /** The frame of a tab ended: no one reads the questions left, so each is answered no. */
    function endQuestions(instance: string): void {
        const line = waiting.get(instance) ?? [];
        waiting.delete(instance);
        for (const one of line) one.resolve(false);
        if (run(instance).question !== null) setRun(instance, { question: null });
    }

    const rows = (): AppRow[] => deps.entities.apps()?.rows ?? [];
    const rowOf = (id: string): AppRow | undefined =>
        rows().find((one) => appViewId(one.root, one.name) === id);
    const get = deps.fetch ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
    // The host rows and the host's messages are channels the page subscribes to once its socket is
    // open; the subscription is asked again at every link change, since a connect names the
    // channels it starts with and a reconnect asks for them again.
    const hostChannels = (): void => deps.socket.subscribe(['app-hosts', 'app-messages']);
    hostChannels();
    deps.socket.onLink(hostChannels);
    const post = (path: string, body: unknown): ReturnType<typeof deps.writes.postCommand> =>
        deps.writes.postCommand(path, body);
    const manage = createManage(post);
    const flows = createFlows({
        manage,
        rowOf: (id) => rowOf(id),
        post,
        notices: deps.notices
    });
    const hosts = (): AppHostRow[] => deps.entities.appHosts()?.rows ?? [];

    async function fetchStore(id: string): Promise<StoreAnswer | null> {
        try {
            const response = await get(`/api/app-store?view=${encodeURIComponent(id)}`);
            const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
            return {
                status: response.status,
                version: typeof body.version === 'string' ? body.version : '',
                value: body.value ?? null
            };
        } catch {
            return null;
        }
    }

    const cache = createStoreCache({
        rows,
        mounted: (id) => [...mounted].some((one) => one.id === id),
        fetch: fetchStore,
        changed: (id, value) => {
            for (const one of mounted) if (one.id === id) one.store(value);
        }
    });

    deps.entities.afterReceive((message) => {
        if (message.channel === 'apps') {
            cache.pushed();
            return;
        }
        if (message.channel === 'app-messages') {
            for (const one of (message.payload as AppMessagesPayload).messages) {
                for (const frame of hostTargets(mounted, one)) frame.host(one.method, one.params);
            }
            return;
        }
        if (message.channel === 'app-hosts') return;
        const held = $state.snapshot(message);
        for (const one of [...mounted]) one.deliver(held);
    });

    async function checkOpen(id: string, root: string, path: string): Promise<OpenResult | null> {
        const query = new URLSearchParams({ app: id, root, path });
        try {
            const response = await get(`/api/app-open?${query.toString()}`);
            if (!response.ok) return null;
            const body = (await response.json()) as { result?: unknown };
            const result = body.result;
            return result === 'ok' || result === 'closed' || result === 'missing' ? result : null;
        } catch {
            return null;
        }
    }

    function mount(options: MountOptions): Mount {
        const told = new Set<string>();
        let alive = true;
        let lastFiles: Message | null = null;
        const sent = new Map<string, string>();
        const row = (): AppRow | undefined => rowOf(options.id);
        const dir = (): string | null => {
            const held = row();
            if (held === undefined || held.root === '') return null;
            return deps.served().find((one) => one.key === held.root)?.dir ?? null;
        };

        const refused = (kind: 'read' | 'write' | 'open' | 'rate', name: string): void => {
            const key = `${kind}:${name}`;
            if (told.has(key) || !alive) return;
            told.add(key);
            const title = row()?.title ?? options.id;
            if (kind === 'read') deps.notices.post(t('apps.refused_read', title, name));
            else if (kind === 'write') deps.notices.post(t('apps.refused_write', title, name));
            else if (kind === 'open') deps.notices.post(t('apps.refused_open', title));
            else deps.notices.post(t('apps.rate', title));
        };

        /** One POST of the app's frame to a server route that names the app in the header. */
        async function appCall(path: string, body: unknown): Promise<ServerAnswer | null> {
            const posted = await deps.writes.postCommand(path, body, {
                [APP_HEADER]: appHeaderValue(options.id)
            });
            if (!posted.ok) {
                if (posted.status === 0) return null;
                return {
                    ok: false,
                    word: posted.status === 404 ? REFUSED.missing : failedWith(posted.status)
                };
            }
            const { ok, value, word } = posted.body;
            if (ok === true) return { ok: true, value };
            return typeof word === 'string' ? { ok: false, word } : null;
        }

        const methods = createMethods({
            alive: () => alive,
            row,
            settings: deps.settings,
            held: (channel) => {
                const message = deps.entities.message(channel);
                if (message === null) return null;
                const held = $state.snapshot(message);
                if (channel === 'files' && row()?.root !== '') return lastFiles;
                return held;
            },
            dir,
            shown: (root) => deps.served().some((one) => one.key === root),
            rootKeys: () => deps.served().map((one) => one.key),
            getState: () => $state.snapshot(appTab(deps.ui.instanceState(options.instance)).value),
            setState: (value) => {
                const tab = appTab(deps.ui.instanceState(options.instance));
                deps.ui.setInstanceState(options.instance, appTabState({ ...tab, value }));
            },
            getStore: () => cache.read(options.id),
            send: (kind, body) => deps.writes.sendFromApp(body, options.id, kind),
            confirm: (question) => ask(options.instance, question),
            listed: (view) => {
                const held = deps.registry.viewFor(view);
                if (held === undefined) return 'unknown';
                return held.listed === false ? 'unlisted' : 'listed';
            },
            openView: (view) => {
                deps.layout.openView(view);
            },
            hasProject: (key) => deps.projectOf(key) !== null,
            openProject: (key) => {
                const project = deps.projectOf(key);
                if (project === null) return;
                deps.layout.openView('project', { id: key, label: project.title });
            },
            check: (root, path) => checkOpen(options.id, root, path),
            openFile: (root, path) => {
                const tab = options.tabFor(root, path);
                deps.layout.openView(tab.view, tab.state);
            },
            runCommand: (name) => deps.commands.run(row()?.root ?? '', name),
            secrets: (action, key, value) =>
                appCall('/api/app-secrets', {
                    action,
                    key,
                    ...(value === undefined ? {} : { value })
                }),
            host: (method, params) =>
                appCall('/api/app-host', {
                    action: 'request',
                    method,
                    params,
                    tab: options.instance
                }),
            openUrl: (address) => {
                window.open(address, '_blank', 'noopener,noreferrer');
            },
            theme: options.theme,
            forwardKey: (init) => {
                if (options.focused()) options.forwardKey(init);
            },
            refused
        });

        const link = connectFrame({
            frame: options.frame,
            methods,
            timeoutS: deps.settings().connectTimeoutS,
            failed: () => setRun(options.instance, { failed: true }),
            connected: () => setRun(options.instance, { failed: false })
        });

        const entry: Mounted = {
            id: options.id,
            instance: options.instance,
            theme() {
                link.theme(options.theme());
            },
            deliver(message) {
                const held = row();
                if (held === undefined || readAccess(held, message.channel) !== 'ok') return;
                const part = partOf(held, message, dir());
                if (part === null) return;
                if (held.root !== '' && message.channel === 'files') lastFiles = part;
                if (held.root !== '' && message.channel === 'git') {
                    const text = JSON.stringify(part.payload);
                    if (sent.get('git') === text) return;
                    sent.set('git', text);
                }
                link.deliver(part);
            },
            store(value) {
                link.store(value);
            },
            host(method, params) {
                link.host(method, params);
            }
        };
        mounted.add(entry);
        setRun(options.instance, { failed: false });
        // A tab of the app is drawn: the host of an app that names `onTab` starts.
        void appCall('/api/app-host', { action: 'tab' });
        return {
            destroy() {
                alive = false;
                mounted.delete(entry);
                link.destroy();
                endQuestions(options.instance);
            }
        };
    }

    async function approval(body: Record<string, unknown>): Promise<ApprovalOutcome> {
        const posted = await deps.writes.postCommand('/api/approve', body);
        if (posted.ok) return { ok: true };
        const error = posted.body.error;
        return { ok: false, error: typeof error === 'string' ? error : posted.failed };
    }

    return {
        ...manage,
        ...flows,
        rows,
        hosts,
        hostOf: (id) => hosts().find((one) => one.app === id),
        findings: () => deps.entities.apps()?.findings ?? [],
        folders: () => deps.entities.apps()?.folders ?? [],
        rowOf,
        review: (id) => {
            reviews.add(id);
            deps.layout.openView(id);
        },
        reviewing: (id) => reviews.has(id),
        endReview: (id) => {
            reviews.delete(id);
        },
        mount,
        themeChanged: (instance) => {
            for (const one of mounted) if (one.instance === instance) one.theme();
        },
        run,
        reload: (instance) =>
            setRun(instance, { failed: false, reloads: run(instance).reloads + 1 }),
        approve: (id, hash, keep) =>
            approval({ action: 'approve', view: id, hash, ...(keep ? { keep: true } : {}) }),
        revoke: (id) => approval({ action: 'revoke', view: id }),
        holds: (root, path) =>
            inAppsFolder(
                deps.entities.apps()?.folders ?? [],
                deps.served().find((one) => one.key === root)?.dir ?? '',
                path
            ),
        ready: () => {
            try {
                deps.settings();
                return true;
            } catch {
                return false;
            }
        },
        srcOf: (row) =>
            !row.approved || row.key === ''
                ? ''
                : appAddress(row.root, row.name, row.key) +
                  row.entry.split('/').map(encodeURIComponent).join('/'),
        showFolder: (id) => {
            const held = rowOf(id);
            if (held === undefined) return;
            const shown = folderIn(held, deps.served());
            if (shown === null) deps.notices.post(t('apps.folder_unshown', held.folder));
            else deps.layout.showFolderInFiles(shown.path, shown.root);
        }
    };
}
