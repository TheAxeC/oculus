// Layer 2, server. The diagrams utils/diagrams/diagrams.mjs draws from the source, served
// read-only to the doc view: one `.svg` file of the engine's docs/diagrams/ folder, by its file
// name, and nothing else of that folder or around it.
//
// routes/api/(docs)/diagrams/[name]/+server.ts is the endpoint and holds nothing but its GET, since
// a route module may export only its verbs. The name is held to the shape the generator writes (a
// lower-case name of letters, digits and hyphens, then `.svg`), so a `.dot` file, a dotfile, a path
// and an escaped separator are refused before anything is opened. The folder must be the engine
// directory's own docs/diagrams/ once every link is resolved, and the file the name joins to is
// resolved again and refused unless it is a regular file directly inside that folder, so a link out
// of the engine directory or out of the folder serves nothing. Every refusal is a 404 that says
// nothing about what is on disk.
//
// The doc view passes what this answers through ui/html.ts's graph filter before it draws it. The
// headers keep the file an image when its address is opened on its own: `nosniff` holds the type,
// and the content security policy lets the file carry its own styles and nothing that loads or
// runs, the pair the file route sends with every SVG (server/files/files.ts's SVG_GUARD).

import { readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { SVG_GUARD } from '../files/files.ts';

/** The folder of the engine directory the diagrams are written to, as utils/diagrams/ names it. */
export const DIAGRAM_DIR = join('docs', 'diagrams');

/** The one shape of name this route serves: what the generator writes, and nothing else. */
export const DIAGRAM_NAME = /^[a-z0-9][a-z0-9-]*\.svg$/;

/** What an SVG answer carries, so the file stays an image wherever its address is opened. */
const HEADERS = {
    'content-type': 'image/svg+xml',
    ...SVG_GUARD,
    // The drawing changes each time the generator is run over a changed source, so the browser asks
    // again rather than draw yesterday's graph.
    'cache-control': 'no-cache'
};

/** The file a name joins to when it is one this route serves, and null for every other name. */
export function diagramPath(engine: string, name: string): string | null {
    if (!DIAGRAM_NAME.test(name)) return null;
    try {
        // The folder is where the engine directory itself puts it, not where a link at docs/ or at
        // docs/diagrams/ leads: the file must resolve to a file directly inside that path.
        const folder = join(realpathSync(engine), DIAGRAM_DIR);
        const real = realpathSync(join(folder, name));
        if (dirname(real) !== folder) return null;
        return statSync(real).isFile() ? real : null;
    } catch {
        return null;
    }
}

/** One diagram, or a 404 for any other name. */
export function serveDiagram(engine: string, name: string): Response {
    const path = diagramPath(engine, name);
    if (path === null) return new Response(null, { status: 404 });
    return new Response(readFileSync(path, 'utf8'), { status: 200, headers: HEADERS });
}
