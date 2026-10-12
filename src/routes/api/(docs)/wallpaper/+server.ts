// The wallpaper endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/content/wallpaper.ts and this is the few lines that join them. Without a query it
// serves the image `wallpaper.image` names; `?image=<hub name>/<file name>` serves one image of a
// hub's wallpaper folder, as the picker in Settings draws its thumbnails, and `?list` answers the
// images of every hub, grouped by hub.

import { allHubs } from '$lib/server/files/roots';
import { picturesOf } from '$lib/server/content/images';
import { listing, serve, serveImage, wallpaperValue } from '$lib/server/content/wallpaper';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url, locals }) => {
    const config = locals.config().config;
    const pictures = picturesOf(
        allHubs(locals.server.engine, config, locals.server.workspace.open())
    );
    if (url.searchParams.has('list')) return listing(pictures);
    const image = url.searchParams.get('image');
    if (image !== null) return serveImage(image, pictures);
    return serve(wallpaperValue(config), pictures, locals.server.wallpaper);
};
