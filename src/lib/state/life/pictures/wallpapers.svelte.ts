// Layer 2, client state. The wallpaper images of every hub of the open workspace, grouped by hub,
// for the picker under the wallpaper rows of the Settings view.
//
// The list is not in the snapshot: it is fetched from GET /api/wallpaper?list the first time the
// picker asks and read again each time a picker opens (`reload`), since the folders of the
// workspace and the files in them change. The answer is held in the client state's query client.
// Only the file names come over; a tile draws its picture from the image route (`wallpaperUrl`),
// which the browser scales, so nothing here or on the server resizes a picture. An answer that is
// no list of hubs, each with a list of names, is held as a failed read naming what was wrong.

import { z } from 'zod';
import { readAs, readJson } from '../../../data/shapes/shapes.ts';
import { failedAnswer } from '../../shared/answers/answers.ts';
import { inBrowser } from '../../shared/stores/in-browser.ts';
import type { Queries } from '../../shared/stores/shapes.ts';

/** One hub's wallpaper images: the hub's name and the names of the files in its folder. */
type HubImages = { hub: string; images: string[] };

/**
 * What the picker reads: the images by hub, what a failed read failed with, and whether one is out.
 */
type WallpaperList = { hubs: HubImages[]; error: string; loading: boolean };

/** What the picker reads before the first answer arrives. */
const PENDING: WallpaperList = { hubs: [], error: '', loading: true };

/** The key of the choice, in the primary hub's `.oculus/config/appearance.yml`. */
export const WALLPAPER_KEY = 'wallpaper.image';

/** The value that shows one image of any hub, kept until the server restarts. */
export const WALLPAPER_RANDOM = 'random';

/** The address that lists the images of every hub. */
const LIST_URL = '/api/wallpaper?list';

/** The address of one image, as `<hub name>/<file name>`, which the browser draws at any size. */
export function wallpaperUrl(hub: string, file: string): string {
    return `/api/wallpaper?image=${encodeURIComponent(`${hub}/${file}`)}`;
}

/** The body of the answer: each hub with the names of its images. */
const answerShape = z.object({
    hubs: z.array(z.object({ hub: z.string(), images: z.array(z.string()) }))
});

/** The wallpaper images of the workspace, held for one client. */
export type WallpapersStore = {
    list: () => WallpaperList;
    /** Ask again, which is what the picker does after the workspace's folders changed. */
    reload: () => void;
};

/** The query key of the list. */
const KEY = ['wallpapers'];

/** Ask for the list, answering what came back as the shape the picker reads. */
async function ask(): Promise<WallpaperList> {
    try {
        const response = await fetch(LIST_URL);
        const raw = await readJson(response);
        if (raw === undefined || !response.ok) {
            return { hubs: [], error: failedAnswer(response, raw), loading: false };
        }
        const body = readAs(answerShape, raw);
        if (body === null) return { hubs: [], error: 'hubs_not_a_list', loading: false };
        return { hubs: body.hubs, error: '', loading: false };
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        return { hubs: [], error: reason, loading: false };
    }
}

export function createWallpapers(queries: Queries): WallpapersStore {
    function list(): WallpaperList {
        return queries.read(KEY, ask, { enabled: inBrowser() }).data ?? PENDING;
    }

    function reload(): void {
        if (inBrowser()) queries.refetch(KEY, ask, 'drop');
    }

    return { list, reload };
}
