// Layer 2, server. The read-only view of oculus's own `config/` folder that the Settings view
// reads its defaults from: the text of one file and the listing of one folder (`catalogs/`,
// `schemas/`, `text/`), under no workspace folder and under no other path than that folder's.
// Nothing is written here, a path that leaves the folder is refused, and a file named `local.yml`
// is never answered whatever folder holds it. A workspace that lists the folder holding the config
// as one of its folders reaches the same files through the Files view like any other file.

import { json } from '@sveltejs/kit';
import { OCULUS_CONFIG_ROOT } from '../../../data/helpers/files/address.ts';
import { LOCAL_NAME } from '../../../data/sources/config.ts';
import { configDir } from '../../../data/sources/config/folder.ts';
import { listDir } from '../fs.ts';
import { serveFile } from '../files.ts';

/**
 * One request of the view: the listing of the folder `path` names when `list` is set, else the
 * bytes of the file it names. A path with the machine's file in it, one that leaves the folder and
 * one that names nothing answer 404.
 */
export function handleOculusConfig(engine: string, path: string, query: URLSearchParams): Response {
    const roots = [{ key: OCULUS_CONFIG_ROOT, dir: configDir(engine) }];
    if (path.split('/').includes(LOCAL_NAME)) return new Response(null, { status: 404 });
    if (query.get('list') === null) return serveFile(roots, OCULUS_CONFIG_ROOT, path);
    const found = listDir(roots, OCULUS_CONFIG_ROOT, path, query.get('hidden') === '1');
    if ('error' in found) return json({ error: found.error }, { status: 404 });
    return json(
        {
            root: OCULUS_CONFIG_ROOT,
            path,
            entries: found.entries.filter((entry) => entry.name !== LOCAL_NAME)
        },
        { headers: { 'cache-control': 'no-store' } }
    );
}
