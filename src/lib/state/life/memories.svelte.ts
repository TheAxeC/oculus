// Layer 2, client state. The pictures on the Memories wall, each name with its width and height.
//
// The folder is not in the snapshot: it is a directory of images beside the wallpaper, not
// portfolio data, so it is fetched from GET /api/memories the first time the wall asks and read
// again after the wall adds one. The fetch is scheduled on a microtask rather than run inside the
// call, so reading this from a $derived never writes state while a derived is running, and it is
// only ever made in the browser: a server-rendered page holds nothing and asks for nothing.
//
// The sizes are what give a tile its shape before its picture has arrived. They are read off the
// answer as whole positive numbers or not at all, since the shape a tile takes is written into its
// style, and `tileRatio` is the one rule turning a size into that shape. An answer the server could
// not have meant (no list, a picture with no name, a name twice) is held as a failed read naming
// what was wrong, rather than as a wall with fewer tiles or none.

import { isMap } from '../../data/helpers/guards.ts';
import type { Picture } from '../../data/model/index.ts';

/** What the wall reads: the pictures, what a failed read failed with, and whether one is out. */
export type Wall = {
    images: Picture[];
    /** What the request failed with, or the empty string. */
    error: string;
    /** True while the first answer is still to come. */
    loading: boolean;
};

/** What the wall reads as before its first answer arrives. */
const PENDING: Wall = { images: [], error: '', loading: true };

/**
 * How far a tile's shape may leave the square: three times as wide as it is tall, or three times as
 * tall as it is wide. A picture past that, drawn at its own shape, would be a sliver across a
 * column or a column of its own, so its box stops at the bound and the picture is fitted whole
 * inside it.
 */
export const TILE_BOUND = 3;

/**
 * The `aspect-ratio` a tile of this picture takes, as width over height, held inside `TILE_BOUND`;
 * undefined when the picture has no size, which leaves the tile its default box.
 */
export function tileRatio(picture: Picture): string | undefined {
    const { width, height } = picture;
    if (width === null || height === null) return undefined;
    if (width > height * TILE_BOUND) return `${TILE_BOUND} / 1`;
    if (height > width * TILE_BOUND) return `1 / ${TILE_BOUND}`;
    return `${width} / ${height}`;
}

/** A side of a picture as the answer gave it, when it is a whole number of pixels above zero. */
function side(value: unknown): number | null {
    return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
}

/** Why an answer is not a list of pictures, as the word the wall's `error` holds. */
type Malformed = 'images_not_a_list' | 'image_without_name' | 'image_name_repeated';

/**
 * The pictures of an answer, or the word for what makes it not one: `images` that is not a list, an
 * item with no name, or a name already read, since a tile is keyed by its name. A size that is not
 * two whole positive numbers is read as none, which is a picture drawn in the default box.
 */
function pictures(value: unknown): { images: Picture[] } | { malformed: Malformed } {
    if (!Array.isArray(value)) return { malformed: 'images_not_a_list' };
    const seen = new Set<string>();
    const read: Picture[] = [];
    for (const item of value as unknown[]) {
        if (!isMap(item) || typeof item.name !== 'string')
            return { malformed: 'image_without_name' };
        if (seen.has(item.name)) return { malformed: 'image_name_repeated' };
        seen.add(item.name);
        const width = side(item.width);
        const height = side(item.height);
        const sized = width !== null && height !== null;
        read.push({ name: item.name, width: sized ? width : null, height: sized ? height : null });
    }
    return { images: read };
}

/** The pictures of the wall, held for one client. */
export type MemoriesStore = {
    wall: () => Wall;
    /** Put a list in by hand, which is what a test does where there is no fetch. */
    hold: (images: Picture[], error?: string) => void;
    /** Ask again, which is what the wall does after it has added a picture. */
    reload: () => void;
};

export function createMemories(): MemoriesStore {
    const held: { wall: Wall | null } = $state({ wall: null });

    /** Whether a request is out, so a second render does not send a second one. */
    let inflight = false;

    function wall(): Wall {
        if (held.wall === null) request();
        return held.wall ?? PENDING;
    }

    function hold(images: Picture[], error = ''): void {
        held.wall = { images, error, loading: false };
    }

    function reload(): void {
        request();
    }

    function request(): void {
        if (inflight) return;
        inflight = true;
        queueMicrotask(() => {
            void load();
        });
    }

    async function load(): Promise<void> {
        try {
            // There is no fetch while the page is rendered on the server, and nothing to show there
            // either: the wall stays pending and the browser asks for it on the first client
            // render.
            if (typeof window === 'undefined' || typeof fetch !== 'function') return;
            const response = await fetch('/api/memories');
            const body = (await response.json()) as { images?: unknown; error?: string };
            if (!response.ok) {
                held.wall = {
                    images: [],
                    error: body.error ?? String(response.status),
                    loading: false
                };
                return;
            }
            const answer = pictures(body.images);
            held.wall =
                'malformed' in answer
                    ? { images: [], error: answer.malformed, loading: false }
                    : { images: answer.images, error: '', loading: false };
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            held.wall = { images: [], error: reason, loading: false };
        } finally {
            inflight = false;
        }
    }

    return { wall, hold, reload };
}
