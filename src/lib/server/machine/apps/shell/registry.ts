// Layer 2, server. What the running hosts have registered in the shell and what they ask the
// reader, held for the `app-shell` channel: the command handlers, status bar items, tree views and
// panels of each host, the context keys it set, and the open requests of `oculus/ui` (a message, a
// quick pick, an input box, a progress) and of the commands a host runs on a page.
//
// A request is in the payload from the moment it is made until the first answer settles it or its
// host stops, so every page the server serves shows it, a page that connects while it is open
// included. The first answer wins: a later answer is told `missing` and settles nothing. A host
// that stops settles each of its requests with `undefined`, drops everything it registered and its
// context keys, and the pages see all of it go in the next payload. A panel belongs to the page
// that opened it; the page's release, or a close of the panel's tab, ends it and tells the host.
//
// Everything a host registers is judged here before it is held: the app must be approved and
// enabled (`appActive`), a command id must start with the app's name and a dot, a tree must be a
// view of type `tree` the app declares, a panel's entry must be an `.html` file of the app, and a
// second registration of one id is refused `refused:registered`.

import { appActive } from '../../../../data/helpers/files/apps/apps.ts';
import { blankItem, changeItem } from '../../../../data/helpers/files/apps/status-items.ts';
import { text } from '../../../../data/helpers/guards.ts';
import type {
    AppPanelState,
    AppRequest,
    AppRequestBody,
    AppShellHost,
    AppShellPayload,
    AppStatusItem,
    AppTreeState,
    ContextValue
} from '../../../../data/model/index.ts';
import type { Hub } from '../../../core/channels.ts';
import { Refused } from '../host/connection.ts';
import type { ActivationEvent } from '../read/activation.ts';
import { appById, type AppsHeld, type HeldApp } from '../read/held.ts';

/** What the registry asks of the hosts: a message to a running host, and the start of one. */
export type ShellHosts = {
    /** A request to the running host of an app; rejects `host_down` when none runs. */
    request(id: string, method: string, params: unknown): Promise<unknown>;
    notify(id: string, method: string, params: unknown): void;
    /** Start the host of an app for an event when it is not running; whether it runs. */
    ensure(id: string, event: ActivationEvent): Promise<boolean>;
};

/** What the registry is made over. */
export type ShellOptions = {
    hub: Hub;
    apps: { held(): AppsHeld };
    hosts: ShellHosts;
};

/** The kinds of contribution a host registers. */
export type RegisterKind = 'command' | 'statusItem' | 'tree' | 'panel';

/** The events a page sends the registry, and the host subscribes to. */
export type PageEvent = 'visibility' | 'selection' | 'expand' | 'collapse' | 'dispose';

/** What one host registered. */
type HostState = {
    commands: Set<string>;
    status: Map<string, AppStatusItem>;
    trees: Map<string, AppTreeState>;
    panels: Map<string, AppPanelState & { page: string }>;
    context: Map<string, ContextValue>;
    /** The ids a host subscribed to for each kind of event; the empty id is every id. */
    subscribed: Map<string, Set<string>>;
};

/** A request waiting for its answer. */
type Pending = { request: AppRequest; settle: (value: unknown) => void };

/** A tree before the host fills in its fields. */
function blankTree(view: string, canSelectMany: boolean, showCollapseAll: boolean): AppTreeState {
    return {
        view,
        changes: {},
        title: '',
        description: '',
        message: '',
        badge: null,
        canSelectMany,
        showCollapseAll,
        reveal: null
    };
}

/** The registry of the shell contributions of every running host. */
export class AppShell {
    #options: ShellOptions;
    #hosts = new Map<string, HostState>();
    #open = new Map<string, Pending>();
    #next = 0;
    #published = '';

    constructor(options: ShellOptions) {
        this.#options = options;
        this.#publish();
    }

    /** The hosts the registry sends to and starts. */
    get hosts(): ShellHosts {
        return this.#options.hosts;
    }

    /** The held app with this id when it is approved, enabled and unchanged. */
    active(id: string): HeldApp | undefined {
        const app = appById(this.#options.apps.held(), id);
        return app !== undefined && appActive(app.row) ? app : undefined;
    }

    /** The approved, enabled apps, in the Views list's order. */
    actives(): HeldApp[] {
        return this.#options.apps.held().apps.filter((app) => appActive(app.row));
    }

    /** What the host of an app registered, made when the host first registers something. */
    #state(id: string): HostState {
        let state = this.#hosts.get(id);
        if (state === undefined) {
            state = {
                commands: new Set(),
                status: new Map(),
                trees: new Map(),
                panels: new Map(),
                context: new Map(),
                subscribed: new Map()
            };
            this.#hosts.set(id, state);
        }
        return state;
    }

    /** Whether the host of an app registered a handler for the command. */
    registered(id: string, command: string): boolean {
        return this.#hosts.get(id)?.commands.has(command) ?? false;
    }

    /** The context keys the host of an app set. */
    contextOf(id: string): ReadonlyMap<string, ContextValue> {
        return this.#hosts.get(id)?.context ?? new Map();
    }

    /** Hold one context key of a host. */
    setContext(id: string, key: string, value: ContextValue): void {
        this.#state(id).context.set(key, value);
        this.#publish();
    }

    /** Hold a registration of a host; `refused:registered` for an id held already. */
    register(app: HeldApp, kind: RegisterKind, id: string, options: Record<string, unknown>): void {
        const state = this.#state(app.id);
        if (kind === 'command') {
            if (state.commands.has(id)) throw new Refused('refused:registered');
            state.commands.add(id);
        } else if (kind === 'statusItem') {
            if (state.status.has(id)) throw new Refused('refused:registered');
            const alignment = options.alignment === 'right' ? 'right' : 'left';
            const priority = typeof options.priority === 'number' ? options.priority : 0;
            state.status.set(id, blankItem(id, alignment, priority));
        } else if (kind === 'tree') {
            if (state.trees.has(id)) throw new Refused('refused:registered');
            state.trees.set(
                id,
                blankTree(id, options.canSelectMany === true, options.showCollapseAll === true)
            );
        } else {
            if (state.panels.has(id)) throw new Refused('refused:registered');
            const panel = {
                id,
                viewType: text(options.viewType),
                title: text(options.title),
                entry: text(options.entry),
                preserveFocus: options.preserveFocus === true
            };
            state.panels.set(id, { ...panel, reveal: 0, page: '' });
            const { id: panelId, ...rest } = panel;
            this.ask(app, { kind: 'panel', panel: panelId, ...rest });
            return;
        }
        this.#publish();
    }

    /** Drop a registration of a host. */
    unregister(appId: string, kind: RegisterKind, id: string): void {
        const state = this.#hosts.get(appId);
        if (state === undefined) return;
        if (kind === 'command') state.commands.delete(id);
        else if (kind === 'statusItem') state.status.delete(id);
        else if (kind === 'tree') state.trees.delete(id);
        else {
            state.panels.delete(id);
            this.#withdrawPanel(appId, id);
        }
        this.#publish();
    }

    /** Fold a change a host reports into what it registered. */
    changed(appId: string, kind: RegisterKind, id: string, options: Record<string, unknown>): void {
        const state = this.#hosts.get(appId);
        if (state === undefined) return;
        if (kind === 'statusItem') {
            const item = state.status.get(id);
            if (item !== undefined) changeItem(item, options);
        } else if (kind === 'tree') this.#changeTree(state, id, options);
        else if (kind === 'panel') {
            const panel = state.panels.get(id);
            if (panel === undefined) return;
            if (typeof options.title === 'string') panel.title = options.title;
            if (options.reveal === true) panel.reveal += 1;
        }
        this.#publish();
    }

    #changeTree(state: HostState, id: string, options: Record<string, unknown>): void {
        const tree = state.trees.get(id);
        if (tree === undefined) return;
        if (Array.isArray(options.handles)) {
            for (const handle of options.handles) {
                if (typeof handle === 'string')
                    tree.changes[handle] = (tree.changes[handle] ?? 0) + 1;
            }
        } else if (options.handles === null) {
            tree.changes[''] = (tree.changes[''] ?? 0) + 1;
        }
        // A text set to undefined arrives as null and clears the field, as VS Code clears it.
        for (const field of ['title', 'description', 'message'] as const) {
            const value = options[field];
            if (typeof value === 'string') tree[field] = value;
            else if (value === null) tree[field] = '';
        }
        if (options.badge === null) tree.badge = null;
        else if (typeof options.badge === 'object') {
            const badge = options.badge as { value?: unknown; tooltip?: unknown };
            tree.badge = {
                value: typeof badge.value === 'number' ? badge.value : 0,
                tooltip: typeof badge.tooltip === 'string' ? badge.tooltip : ''
            };
        }
        if (typeof options.reveal === 'string') {
            tree.reveal = { handle: options.reveal, count: (tree.reveal?.count ?? 0) + 1 };
        }
    }

    /** Record that a host listens to the events of one kind, of one id or of every id. */
    subscribe(appId: string, kind: string, id: string): void {
        const state = this.#state(appId);
        const ids = state.subscribed.get(kind) ?? new Set<string>();
        ids.add(id);
        state.subscribed.set(kind, ids);
    }

    unsubscribe(appId: string, kind: string, id: string): void {
        this.#hosts.get(appId)?.subscribed.get(kind)?.delete(id);
    }

    /** Whether the host listens to an event of this kind for this id. */
    listens(appId: string, kind: string, id: string): boolean {
        const ids = this.#hosts.get(appId)?.subscribed.get(kind);
        return ids !== undefined && (ids.has('') || ids.has(id));
    }

    /**
     * Make a request of the reader and wait for its answer: the value the first page answers with,
     * or `undefined` when the host stops first. A quick pick or an input box cancels the one open.
     */
    ask(app: HeldApp, body: AppRequestBody): { id: string; answer: Promise<unknown> } {
        if (body.kind === 'quickPick' || body.kind === 'inputBox') this.#cancelQuickInputs();
        this.#next += 1;
        const id = `r${this.#next}`;
        const answer = new Promise<unknown>((settle) => {
            this.#open.set(id, { request: { id, app: app.id, ...body }, settle });
        });
        this.#publish();
        return { id, answer };
    }

    #cancelQuickInputs(): void {
        for (const [id, pending] of [...this.#open]) {
            const kind = pending.request.kind;
            if (kind !== 'quickPick' && kind !== 'inputBox') continue;
            this.#open.delete(id);
            pending.settle(undefined);
        }
    }

    /** End the request that asked a page to open a panel, when no page took it yet. */
    #withdrawPanel(appId: string, panel: string): void {
        for (const [id, pending] of [...this.#open]) {
            const request = pending.request;
            if (request.kind !== 'panel' || request.app !== appId || request.panel !== panel)
                continue;
            this.#open.delete(id);
            pending.settle(undefined);
        }
    }

    /** End a request without an answer, as a host does when its progress is done. */
    withdraw(id: string): void {
        const pending = this.#open.get(id);
        if (pending === undefined) return;
        this.#open.delete(id);
        pending.settle(undefined);
        this.#publish();
    }

    /** Replace the fields of an open progress request. */
    progress(id: string, change: { message?: string; percent?: number | null }): void {
        const pending = this.#open.get(id);
        if (pending?.request.kind !== 'progress') return;
        if (change.message !== undefined) pending.request.message = change.message;
        if (change.percent !== undefined) pending.request.percent = change.percent;
        this.#publish();
    }

    /** The request with this id, or undefined once it is settled. */
    requestOf(id: string): AppRequest | undefined {
        return this.#open.get(id)?.request;
    }

    /**
     * The first answer to a request settles it. A progress request is never settled by a page: its
     * Cancel tells the host. Returns `missing` for a request that is not open.
     */
    answer(id: string, result: unknown, page: string): 'ok' | 'missing' {
        const pending = this.#open.get(id);
        if (pending === undefined) return 'missing';
        const request = pending.request;
        if (request.kind === 'progress') {
            this.#options.hosts.notify(request.app, 'oculus/event', { kind: 'cancel', id });
            return 'ok';
        }
        this.#open.delete(id);
        if (request.kind === 'panel') {
            const panel = this.#hosts.get(request.app)?.panels.get(request.panel);
            if (panel !== undefined) panel.page = page;
        }
        pending.settle(result);
        this.#publish();
        return 'ok';
    }

    /** An event of a page for a host: sent when the host subscribed to it. */
    event(appId: string, kind: PageEvent, params: Record<string, unknown>, page: string): void {
        const state = this.#hosts.get(appId);
        if (state === undefined) return;
        const id = text(params.view);
        if (kind === 'dispose') {
            const panel = state.panels.get(id);
            if (panel === undefined || (panel.page !== '' && panel.page !== page)) return;
            state.panels.delete(id);
            this.#options.hosts.notify(appId, 'oculus/event', { kind, id });
            this.#publish();
            return;
        }
        if (!this.listens(appId, kind, id)) return;
        this.#options.hosts.notify(appId, 'oculus/event', { kind, ...params });
    }

    /** A page left: its panels end and their hosts are told. */
    release(page: string): void {
        for (const [appId, state] of this.#hosts) {
            for (const [id, panel] of state.panels) {
                if (panel.page !== page) continue;
                state.panels.delete(id);
                this.#options.hosts.notify(appId, 'oculus/event', { kind: 'dispose', id });
            }
        }
        this.#publish();
    }

    /** The host of an app stopped: its requests are withdrawn and everything it set goes. */
    stopped(appId: string): void {
        for (const [id, pending] of [...this.#open]) {
            if (pending.request.app !== appId) continue;
            this.#open.delete(id);
            pending.settle(undefined);
        }
        this.#hosts.delete(appId);
        this.#publish();
    }

    /** Tell the running host of an app that settings changed, with all its values. */
    settingsChanged(appId: string, keys: string[], values: Record<string, unknown>): void {
        this.#options.hosts.notify(appId, 'oculus/event', { kind: 'settings', keys, values });
    }

    /** The payload of the `app-shell` channel. */
    payload(): AppShellPayload {
        const hosts: AppShellHost[] = [...this.#hosts]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([app, state]) => ({
                app,
                commands: [...state.commands],
                statusItems: [...state.status.values()],
                trees: [...state.trees.values()],
                panels: [...state.panels.values()].map((panel) => ({
                    id: panel.id,
                    viewType: panel.viewType,
                    title: panel.title,
                    entry: panel.entry,
                    preserveFocus: panel.preserveFocus,
                    reveal: panel.reveal
                })),
                context: Object.fromEntries(state.context)
            }));
        return { hosts, requests: [...this.#open.values()].map((one) => one.request) };
    }

    #publish(): void {
        const payload = this.payload();
        const text = JSON.stringify(payload);
        if (text === this.#published) return;
        this.#published = text;
        this.#options.hub.publish('app-shell', payload);
    }
}
