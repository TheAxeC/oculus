// Layer 2, server. The one image the page paints behind the panels: which file it is, and the
// response that carries it. routes/api/(docs)/wallpaper/+server.ts is the endpoint and holds
// nothing but the GET, since a route module may export only its verbs.
//
// The image is served rather than inlined: the picture is megabytes, the document is not, and a
// browser caches a URL. Which extensions are pictures, what is inside a folder and the streamed
// response are server/content/images.ts's, shared with the Memories wall; what is here is the one
// thing this route has of its own, which is choosing the file.
//
// The choice is `wallpaper.image` in the primary hub's `.oculus/config.yml`: empty for
// none, `random` for one image of any hub chosen once per server process, or
// `<hub name>/<file name>` for one file of the wallpaper folder of that hub. A value that names a
// hub the workspace does not list, a file the folder does not hold, a name that is a path rather
// than a file, or neither form, serves no image and is a finding. The picker in Settings lists
// every hub's images and serves each of them as `<hub name>/<file name>` (`?image=`).

import { json } from '@sveltejs/kit';
import { findingText, type TextCatalog } from '../../data/helpers/finding-text.ts';
import { wallpaperValue } from '../../data/helpers/hub-names.ts';
import type { Finding } from '../../data/model/index.ts';
import { images, isName, stream, type HubPictures } from './images.ts';

export { images } from './images.ts';

/** The `random` value of `wallpaper.image`. */
const RANDOM = 'random';

/**
 * What the owning server context remembers: the random pick, as `<hub name>/<file name>`, so one
 * image is shown for the life of the process.
 */
export type WallpaperMemory = { chosen: string | null };

export function wallpaperMemory(): WallpaperMemory {
    return { chosen: null };
}

/** One image of the wallpaper folders: its hub, its file name and the folder holding it. */
type WallpaperImage = { hub: string; file: string; dir: string };

/** Every image of every hub's wallpaper folder, hubs in the workspace's order, files by name. */
function wallpaperImages(pictures: readonly HubPictures[]): WallpaperImage[] {
    return pictures.flatMap((one) =>
        images(one.wallpaper).map((file) => ({ hub: one.hub, file, dir: one.wallpaper }))
    );
}

/**
 * The image a value names, or the id of the finding it is wrong by: `form` for a value that is
 * neither `random` nor `<hub name>/<file name>`, `name` for a file part that is a path, `hub` for a
 * hub the workspace does not list, `gone` for a file the folder does not hold. An empty value names
 * none and is no fault.
 */
function named(
    value: string,
    pictures: readonly HubPictures[]
): WallpaperImage | { fault: 'form' | 'name' | 'hub' | 'gone' } | null {
    if (value === '' || value === RANDOM) return null;
    const cut = value.indexOf('/');
    if (cut < 1) return { fault: 'form' };
    const hub = value.slice(0, cut);
    const file = value.slice(cut + 1);
    if (!isName(file)) return { fault: 'name' };
    const held = pictures.find((one) => one.hub === hub);
    if (held === undefined) return { fault: 'hub' };
    return images(held.wallpaper).includes(file)
        ? { hub, file, dir: held.wallpaper }
        : { fault: 'gone' };
}

/**
 * The image to serve for a value of `wallpaper.image`, or null when it serves none. `random` keeps
 * one image per process across every hub's images, taken again only when the kept one is no longer
 * listed.
 */
export function choose(
    value: string,
    pictures: readonly HubPictures[],
    memory: WallpaperMemory
): WallpaperImage | null {
    if (value === RANDOM) {
        const all = wallpaperImages(pictures);
        if (all.length === 0) return null;
        const kept = all.find((one) => `${one.hub}/${one.file}` === memory.chosen);
        if (kept !== undefined) return kept;
        const pick = all[Math.floor(Math.random() * all.length)];
        memory.chosen = `${pick.hub}/${pick.file}`;
        return pick;
    }
    const found = named(value, pictures);
    return found === null || 'fault' in found ? null : found;
}

/**
 * The image, its type and its cache header, streamed from disk. 404 covers every way there is no
 * image to send: no value, a value that names no image, a file that has gone since the listing.
 */
export function serve(
    value: string,
    pictures: readonly HubPictures[],
    memory: WallpaperMemory
): Response {
    const image = choose(value, pictures, memory);
    return image === null ? new Response(null, { status: 404 }) : stream(image.dir, image.file);
}

/** One image asked for by `<hub name>/<file name>`, as the picker draws its thumbnails. */
export function serveImage(asked: string, pictures: readonly HubPictures[]): Response {
    const found = named(asked, pictures);
    return found === null || 'fault' in found
        ? new Response(null, { status: 404 })
        : stream(found.dir, found.file);
}

/** The images of every hub, grouped by hub, as the picker lists them. */
export function listing(pictures: readonly HubPictures[]): Response {
    return json({
        hubs: pictures.map((one) => ({ hub: one.hub, images: images(one.wallpaper) }))
    });
}

/**
 * The finding a `wallpaper.image` value is wrong by, filed on the appearance file that holds it:
 * none for an empty value, `random` and a name that resolves to a file.
 */
export function wallpaperFindings(
    config: Record<string, unknown>,
    pictures: readonly HubPictures[],
    file: string,
    text: TextCatalog
): Finding[] {
    const value = wallpaperValue(config);
    const found = named(value, pictures);
    if (found === null || !('fault' in found)) return [];
    return [{ file, key: 'wallpaper.image', message: faultText(found.fault, text, value) }];
}

/** The sentence of one fault of a `wallpaper.image` value, worded from the text catalog. */
function faultText(
    fault: 'form' | 'name' | 'hub' | 'gone',
    text: TextCatalog,
    value: string
): string {
    if (fault === 'form') return findingText(text, 'findings.wallpaper.form', value);
    if (fault === 'name') return findingText(text, 'findings.wallpaper.name', value);
    if (fault === 'hub') return findingText(text, 'findings.wallpaper.hub', value);
    return findingText(text, 'findings.wallpaper.gone', value);
}
