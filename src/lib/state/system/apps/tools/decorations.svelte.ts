// Layer 2, client state. The file decorations of the apps' providers for the rows the Files view
// draws. A row asks `of(root, path, kind)` while it is drawn; the answer is what the page holds of
// the joined decoration (null until it arrives), and a path never held is queued. The queued paths
// of one animation frame go to the server as one `decorate` request per root, at most
// `DECORATE_MAX` paths each, so a tree that draws a screenful of rows asks once.
//
// An answer is kept until the `app-tools` channel names the file as changed: the channel carries
// the files that changed lately with the epoch of each change, and the page applies those newer
// than the epoch it last read, once per animation frame however many changes arrived. The channel's
// `allAt` epoch drops every answer. A file the server could not answer in time (`pending`) is asked
// again when the channel names it, which is when its provider answers. The decoration of a file
// with `propagate` set also colours the folders above it, as far as the page has seen the file.

import { untrack } from 'svelte';
import { decorationProperty } from '../../../../data/helpers/files/apps/tools/decoration-colors.ts';
import type { AppDecoration, AppToolsPayload } from '../../../../data/model/index.ts';
import type { WritesStore } from '../../../shared/stores/shapes.ts';

/** The most paths one request names; the server refuses more. */
const DECORATE_MAX = 500;

/** What a row draws of the apps' decorations. */
export type RowDecoration = {
    /** The apps' badges joined, at most two characters. */
    badge: string;
    /** One line for each provider that gave a tooltip. */
    tooltip: string;
    /** The custom property of the colour, or null for no colour. */
    property: string | null;
};

/** What the store reads of the rest of the client. */
export type DecorationsDeps = {
    payload: () => AppToolsPayload | null;
    post: WritesStore['postCommand'];
    /** Run a function at the next animation frame. */
    frame: (run: () => void) => void;
};

/** The key a root and a path are held by. */
function keyOf(root: string, path: string): string {
    return `${root}\u0000${path}`;
}

/** The folders above a path, nearest first, up to the root. */
function ancestors(path: string): string[] {
    const found: string[] = [];
    for (let at = path.lastIndexOf('/'); at > 0; at = path.lastIndexOf('/', at - 1)) {
        found.push(path.slice(0, at));
    }
    found.push('');
    return found;
}

export function createDecorations(deps: DecorationsDeps) {
    const held = new Map<string, AppDecoration | null>();
    /** The colour a folder takes from each decorated file below it that propagates. */
    const bubbled = new Map<string, Map<string, string>>();
    const queued = new Map<string, Set<string>>();
    const asked = new Set<string>();
    let version = $state(0);
    /** Read the counter, so the reader depends on every change of the held decorations. */
    const seen = (): number => version;
    /** The epoch and the all-changed mark of a payload, read so an effect depends on both. */
    const stamp = (payload: ReturnType<DecorationsDeps['payload']>): string =>
        payload === null ? '' : `${payload.decorations.epoch}/${payload.decorations.allAt}`;
    let epoch = 0;
    let allAt = 0;
    /** Whether the requests of the queued paths wait for a frame. */
    let flushing = false;
    /** Whether the channel's follow-up waits for a frame. */
    let following = false;
    let acting = false;

    const serving = $derived((deps.payload()?.hosts ?? []).some((host) => host.decorations));

    function forget(key: string): void {
        held.delete(key);
        asked.delete(key);
        for (const sources of bubbled.values()) sources.delete(key);
    }

    function remember(root: string, path: string, decoration: AppDecoration | null): void {
        const key = keyOf(root, path);
        held.set(key, decoration);
        if (decoration?.propagate !== true || decoration.color === '') return;
        for (const folder of ancestors(path)) {
            const at = keyOf(root, folder);
            const sources = bubbled.get(at) ?? new Map<string, string>();
            sources.set(key, decoration.color);
            bubbled.set(at, sources);
        }
    }

    function flush(): void {
        flushing = false;
        for (const [root, paths] of queued) {
            const list = [...paths];
            for (let at = 0; at < list.length; at += DECORATE_MAX) {
                void ask(root, list.slice(at, at + DECORATE_MAX));
            }
        }
        queued.clear();
    }

    async function ask(root: string, paths: string[]): Promise<void> {
        const posted = await deps.post('/api/app-host', { action: 'decorate', root, paths });
        const value = posted.body.value as
            { decorations?: Record<string, AppDecoration | null> } | undefined;
        const answers = posted.ok && posted.body.ok === true ? value?.decorations : undefined;
        for (const path of paths) {
            const key = keyOf(root, path);
            if (!asked.has(key)) continue;
            const decoration = answers?.[path];
            if (decoration === undefined) asked.delete(key);
            else remember(root, path, decoration);
        }
        version += 1;
    }

    /** Take the changes the channel names that this page has not applied. */
    function apply(): void {
        const changes = deps.payload()?.decorations;
        if (changes === undefined) return;
        if (changes.allAt > allAt) {
            held.clear();
            bubbled.clear();
            asked.clear();
            allAt = changes.allAt;
        }
        for (const file of changes.files) {
            if (file.epoch > epoch) forget(keyOf(file.root, file.path));
        }
        epoch = Math.max(epoch, changes.epoch);
        version += 1;
    }

    /** Bring the held answers in line with the channel, once for the changes of one frame. */
    function follow(): void {
        if (following) return;
        following = true;
        deps.frame(() => {
            following = false;
            apply();
        });
    }

    /**
     * What the apps say of a row: the joined decoration, or for a folder the colour a decorated
     * file below it propagates. Null while nothing is held or nothing is said.
     */
    function of(root: string, path: string, kind: 'file' | 'dir'): RowDecoration | null {
        void seen();
        void deps.payload();
        if (!serving) return null;
        const key = keyOf(root, path);
        if (!held.has(key) && !asked.has(key)) {
            asked.add(key);
            const paths = queued.get(root) ?? new Set<string>();
            paths.add(path);
            queued.set(root, paths);
            if (!flushing) {
                flushing = true;
                deps.frame(flush);
            }
        }
        const own = held.get(key) ?? null;
        const above = kind === 'dir' ? [...(bubbled.get(key)?.values() ?? [])].at(0) : undefined;
        const colour = own !== null && own.color !== '' ? own.color : above;
        if (own === null && colour === undefined) return null;
        return {
            badge: own?.badge ?? '',
            tooltip: own?.tooltip ?? '',
            property: colour === undefined ? null : decorationProperty(colour)
        };
    }

    $effect.root(() => {
        $effect(() => {
            const payload = deps.payload();
            void stamp(payload);
            const now = serving;
            untrack(() => {
                if (acting !== now) {
                    acting = now;
                    held.clear();
                    bubbled.clear();
                    asked.clear();
                    version += 1;
                }
                follow();
            });
        });
    });

    return { of, serving: (): boolean => serving };
}
