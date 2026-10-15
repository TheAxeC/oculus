// Layer 2, client state. The pictures on the Memories wall, each name with its width and height.
//
// The folder is not in the snapshot: it is a directory of images beside the wallpaper, not
// portfolio data, so it is fetched from GET /api/memories the first time the wall asks and read
// again after the wall adds one. The answer is held in the client state's query client, and the
// fetch is scheduled on a microtask by state/client/queries/queries.svelte.ts rather than run
// inside the call, so reading this from a $derived never writes state while a derived is running.
// It is only ever made in the browser: a server-rendered page holds nothing and asks for nothing.
//
// The sizes are what give a tile its shape before its picture has arrived. They are read off the
// answer as whole positive numbers or not at all, since the shape a tile takes is written into its
// style, and `tileRatio` is the one rule turning a size into that shape. An answer the server could
// not have meant (no list, a picture with no name, a name twice) is held as a failed read naming
// what was wrong, rather than as a wall with fewer tiles or none.

import { z } from 'zod';
import { itemsShape, readAs, readJson } from '../../../data/shapes/shapes.ts';
import type { Picture } from '../../../data/model/index.ts';
import { failedAnswer } from '../../shared/answers/answers.ts';
import type { Queries } from '../../shared/stores/shapes.ts';
import { inBrowser } from '../../shared/stores/in-browser.ts';

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
const sideShape = z.number().refine(Number.isInteger).positive().nullable().catch(null);

/**
 * One picture of the answer: the name of the hub whose folder holds it, its name, and its size when
 * both sides read, else no size. An item that is no map, or whose hub or name is no text, fails.
 */
const pictureShape = z
    .object({ hub: z.string(), name: z.string(), width: sideShape, height: sideShape })
    .transform((item): Picture => {
        const sized = item.width !== null && item.height !== null;
        return {
            hub: item.hub,
            name: item.name,
            width: sized ? item.width : null,
            height: sized ? item.height : null
        };
    });

/** The body of the answer: the pictures as they came. */
const answerShape = z.object({ images: z.unknown().optional() });

/** Why an answer is not a list of pictures, as the word the wall's `error` holds. */
type Malformed = 'images_not_a_list' | 'image_without_name' | 'image_name_repeated';

/**
 * The pictures of an answer, or the word for what makes it not one: `images` that is not a list, an
 * item with no name, or a hub and name already read, since a tile is keyed by both. A size that is
 * not two whole positive numbers is read as none, which is a picture drawn in the default box.
 */
function pictures(value: unknown): { images: Picture[] } | { malformed: Malformed } {
    const list = readAs(itemsShape, value);
    if (list === null) return { malformed: 'images_not_a_list' };
    const seen = new Set<string>();
    const read: Picture[] = [];
    for (const item of list) {
        const picture = readAs(pictureShape, item);
        if (picture === null) return { malformed: 'image_without_name' };
        const key = `${picture.hub}/${picture.name}`;
        if (seen.has(key)) return { malformed: 'image_name_repeated' };
        seen.add(key);
        read.push(picture);
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

/** The query key of the wall. */
const KEY = ['memories'];

/** Ask for the wall, answering what came back as the shape the wall reads. */
async function ask(): Promise<Wall> {
    try {
        const response = await fetch('/api/memories');
        const raw = await readJson(response);
        if (raw === undefined || !response.ok) {
            return { images: [], error: failedAnswer(response, raw), loading: false };
        }
        const body = readAs(answerShape, raw);
        const answer = pictures(body?.images);
        return 'malformed' in answer
            ? { images: [], error: answer.malformed, loading: false }
            : { images: answer.images, error: '', loading: false };
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        return { images: [], error: reason, loading: false };
    }
}

export function createMemories(queries: Queries): MemoriesStore {
    function wall(): Wall {
        return queries.read(KEY, ask, { enabled: inBrowser() }).data ?? PENDING;
    }

    function hold(images: Picture[], error = ''): void {
        const held: Wall = { images, error, loading: false };
        queries.hold(KEY, held);
    }

    function reload(): void {
        if (inBrowser()) queries.refetch(KEY, ask, 'drop');
    }

    return { wall, hold, reload };
}
