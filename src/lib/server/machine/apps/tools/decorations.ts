// Layer 2, server. The file decorations of the apps' hosts, joined for the Files view. A host that
// registers a provider (`oculus/decorations/register`) is asked for the files a page draws
// (`oculus/decorations/provide`, one list of URIs, answered with the answer of each of its
// providers for each URI) and tells which files changed (`oculus/decorations/changed`).
//
// The answers of every acting app's host are joined for a file: the badges one after another in the
// Views list's order (a badge of more than two characters is dropped with a line in its host's
// output, and two characters are kept in all), the tooltips one to a line, the colour of the first
// provider that gave one, and `propagate` when a provider that gave the colour asked for it. A
// joined answer is kept until a change names the file; a provider that has not answered after
// `LATE_MS` leaves the rest of the request to be answered and the file is named as changed when it
// does, so a late answer decorates the row when it comes. A URI outside the folders of the app's
// scope is not asked of that app, and a provider that throws or answers nothing gives nothing.
//
// The changes are held for a page to read in the `app-tools` payload as the files changed lately,
// each with the epoch of its change (`AppDecorationChanges`). They are not messages of the host's
// the limits count.

import type { AppDecoration, AppDecorationChanges } from '../../../../data/model/index.ts';
import { Refused, type HostHandler, type HostNotice } from '../host/connection.ts';
import type { HostTools } from './registry.ts';
import { words } from '../../../core/words.ts';

/** The most characters of badge a file shows. */
const BADGE_MAX = 2;

/** How long a request waits for the providers before it answers what it has. */
const LATE_MS = 1000;

/** How long a changed file stays in the payload. */
const KEEP_MS = 10_000;

/** The most files the payload names before every file is told as changed. */
const FILES_MAX = 2000;

/**
 * The decorations of one file, one entry per provider of a host, nothing for a provider with none.
 */
type Given = (AppDecoration | null)[];

/** One host's provider side. */
export type DecorationHost = {
    handlers: Record<string, HostHandler>;
    notices: Record<string, HostNotice>;
    /** Whether a provider is registered. */
    registered(): boolean;
    /** Ask for the decorations of file URIs; one list of answers per URI. */
    provide(uris: string[]): Promise<Given[]>;
    stop(): void;
};

/** What the hub asks of the registry: the acting hosts' order and the scope of each. */
export type DecorationSources = {
    /** The hosts that can decorate, apps in the Views list's order. */
    hosts(): { app: string; host: DecorationHost; tools: HostTools }[];
    /** The root and path of a file URI in the scope of an app, or null. */
    place(app: string, uri: string): { root: string; path: string } | null;
    /** The file URI of a root and path in the scope of an app. */
    uriOf(app: string, root: string, path: string): string | null;
    /** A change was taken: publish the payload. */
    changed(): void;
};

/** The decorations part of one host. */
export function decorationHost(
    host: HostTools,
    heard: (uris: string[], all: boolean) => void
): DecorationHost {
    let registered = false;
    const handlers: Record<string, HostHandler> = {
        'oculus/decorations/register': () => {
            host.app();
            registered = true;
            host.changed();
            return null;
        },
        'oculus/decorations/unregister': () => {
            host.app();
            registered = false;
            host.changed();
            return null;
        }
    };
    const notices: Record<string, HostNotice> = {
        'oculus/decorations/changed': (params) => {
            host.app();
            const body = (typeof params === 'object' && params !== null ? params : {}) as {
                uris?: unknown;
                all?: unknown;
            };
            const uris = Array.isArray(body.uris)
                ? body.uris.filter((one): one is string => typeof one === 'string')
                : [];
            heard(uris, body.all === true);
        }
    };
    return {
        handlers,
        notices,
        registered: () => registered,
        async provide(uris) {
            const answer = await host.request('oculus/decorations/provide', { uris });
            if (!Array.isArray(answer)) throw new Refused('refused:answer');
            return answer.map((one) =>
                Array.isArray(one) ? one.map((given) => plain(given as unknown)) : []
            );
        },
        stop() {
            registered = false;
        }
    };
}

/** A decoration read from the host's answer, or null for none. */
function plain(value: unknown): AppDecoration | null {
    if (typeof value !== 'object' || value === null) return null;
    const one = value as Record<string, unknown>;
    return {
        badge: typeof one.badge === 'string' ? one.badge : '',
        tooltip: typeof one.tooltip === 'string' ? one.tooltip : '',
        color: typeof one.color === 'string' ? one.color : '',
        propagate: one.propagate === true
    };
}

/** The decorations of the files a page draws, joined across the apps, with their changes. */
export class Decorations {
    readonly #sources: DecorationSources;
    readonly #cache = new Map<string, AppDecoration | null>();
    readonly #waiting = new Map<string, Promise<void>>();
    readonly #recent = new Map<string, { root: string; path: string; epoch: number; at: number }>();
    readonly #now: () => number;
    #epoch = 0;
    #allAt = 0;

    constructor(sources: DecorationSources, now: () => number = Date.now) {
        this.#sources = sources;
        this.#now = now;
    }

    /** The changes a page reads. */
    changes(): AppDecorationChanges {
        this.#prune();
        return {
            epoch: this.#epoch,
            allAt: this.#allAt,
            files: [...this.#recent.values()].map(({ root, path, epoch }) => ({
                root,
                path,
                epoch
            }))
        };
    }

    /** A host told that files changed (`all` for every file). */
    changed(app: string, uris: string[], all: boolean): void {
        if (all) {
            this.#cache.clear();
            this.#epoch += 1;
            this.#allAt = this.#epoch;
            this.#recent.clear();
        } else {
            for (const uri of uris) {
                const placed = this.#sources.place(app, uri);
                if (placed === null) continue;
                this.#cache.delete(`${placed.root}\u0000${placed.path}`);
                this.#epoch += 1;
                this.#recent.set(`${placed.root}\u0000${placed.path}`, {
                    ...placed,
                    epoch: this.#epoch,
                    at: this.#now()
                });
            }
            if (this.#recent.size > FILES_MAX) {
                this.#epoch += 1;
                this.#allAt = this.#epoch;
                this.#recent.clear();
                this.#cache.clear();
            }
        }
        this.#sources.changed();
    }

    /** Forget what was joined for a host that stopped or changed what it registers. */
    reset(): void {
        this.#cache.clear();
        this.#epoch += 1;
        this.#allAt = this.#epoch;
        this.#recent.clear();
    }

    /**
     * The joined decorations of files of a root. A path whose providers have not all answered after
     * `LATE_MS` is left out of `decorations` and named in `pending`; it is named as changed when
     * the last provider answers.
     */
    async decorate(
        root: string,
        paths: string[]
    ): Promise<{ decorations: Record<string, AppDecoration | null>; pending: string[] }> {
        const decorations: Record<string, AppDecoration | null> = {};
        const pending: string[] = [];
        const wanted: string[] = [];
        for (const path of paths) {
            const key = `${root}\u0000${path}`;
            if (this.#cache.has(key)) decorations[path] = this.#cache.get(key) ?? null;
            else wanted.push(path);
        }
        if (wanted.length > 0 && this.#sources.hosts().some((one) => one.host.registered())) {
            const asked = this.#ask(root, wanted);
            const late = new Promise<'late'>((resolve) => {
                const timer = setTimeout(() => resolve('late'), LATE_MS);
                timer.unref();
                void asked.then(() => clearTimeout(timer));
            });
            await Promise.race([asked, late]);
            for (const path of wanted) {
                const key = `${root}\u0000${path}`;
                if (this.#cache.has(key)) decorations[path] = this.#cache.get(key) ?? null;
                else pending.push(path);
            }
            if (pending.length > 0) void asked.then(() => this.#late(root, pending));
        } else for (const path of wanted) decorations[path] = null;
        return { decorations, pending };
    }

    /** Ask every host for the files, join the answers and keep them. */
    #ask(root: string, paths: string[]): Promise<void> {
        const key = `${root}\u0000${paths.join('\u0000')}`;
        const running = this.#waiting.get(key);
        if (running !== undefined) return running;
        const work = this.#join(root, paths).finally(() => this.#waiting.delete(key));
        this.#waiting.set(key, work);
        return work;
    }

    async #join(root: string, paths: string[]): Promise<void> {
        const answers = new Map<string, AppDecoration[]>();
        for (const path of paths) answers.set(path, []);
        const hosts = this.#sources.hosts();
        const given = await Promise.all(
            hosts.map(async ({ app, host, tools }) => {
                if (!host.registered()) return [];
                const places: { path: string; uri: string }[] = [];
                for (const path of paths) {
                    const uri = this.#sources.uriOf(app, root, path);
                    if (uri !== null && this.#sources.place(app, uri) !== null) {
                        places.push({ path, uri });
                    }
                }
                if (places.length === 0) return [];
                try {
                    const lists = await host.provide(places.map((one) => one.uri));
                    return places.map((one, at) => ({
                        path: one.path,
                        tools,
                        list: lists[at] ?? []
                    }));
                } catch {
                    return [];
                }
            })
        );
        for (const host of given) {
            for (const { path, tools, list } of host) {
                for (const one of list) {
                    if (one === null) continue;
                    const kept = this.#checked(tools, one);
                    if (kept !== null) answers.get(path)?.push(kept);
                }
            }
        }
        for (const path of paths) {
            this.#cache.set(`${root}\u0000${path}`, joinedOf(answers.get(path) ?? []));
        }
    }

    /** Files whose answer came after the request was answered are named as changed. */
    #late(root: string, paths: string[]): void {
        for (const path of paths) {
            this.#epoch += 1;
            this.#recent.set(`${root}\u0000${path}`, {
                root,
                path,
                epoch: this.#epoch,
                at: this.#now()
            });
        }
        this.#sources.changed();
    }

    /**
     * A decoration with a badge of more than two characters loses it, with a line in the host's
     * output.
     */
    #checked(tools: HostTools, one: AppDecoration): AppDecoration | null {
        let badge = one.badge;
        if (Array.from(badge).length > BADGE_MAX) {
            tools.note(words(tools.catalog(), 'server.apps.decoration_badge', badge));
            badge = '';
        }
        if (badge === '' && one.tooltip === '' && one.color === '') return null;
        return { ...one, badge };
    }

    #prune(): void {
        const cutoff = this.#now() - KEEP_MS;
        for (const [key, one] of this.#recent) if (one.at < cutoff) this.#recent.delete(key);
    }
}

/** The answers of the providers for one file as one decoration, or null when they give nothing. */
function joinedOf(answers: readonly AppDecoration[]): AppDecoration | null {
    if (answers.length === 0) return null;
    let badge = '';
    for (const one of answers) badge += one.badge;
    const color = answers.find((one) => one.color !== '');
    const tooltips = answers.map((one) => one.tooltip).filter((one) => one !== '');
    return {
        badge: Array.from(badge).slice(0, BADGE_MAX).join(''),
        tooltip: tooltips.join('\n'),
        color: color?.color ?? '',
        propagate: color?.propagate === true
    };
}
