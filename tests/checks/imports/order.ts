// Layer 4, test helper. The folders of each layer in their order from the top down, and the check
// that holds the import graph to it.
//
// A folder is the layer and its first sub-folder (`server/core`, `state/boards`, `ui/menu`), and
// the files that sit in the layer itself are the folder named by the layer alone (`ui`, `shell`). A
// module may import a folder of its own layer only when that folder is its own or below its own in
// the layer's list, so every folder imports downward and no two folders import each other. The
// composition roots head their layers (`server/root`, `state/client`, `shell`, and `data` itself,
// whose index.ts builds the portfolio out of every data folder) since they import every folder
// beside them and none imports them; the modules every folder of a layer shares sit at its foot
// (`server/core`, `state/shared` with the catalogs in `words/`, the sentences of an answer in
// `answers/` and, in `stores/`, the shapes of the stores other stores are handed, the shell action
// and the browser test, `data/model` with the facade of every type, the files of `ui`).
//
// A listed folder that holds folders of its own may carry an inner order in INNER, read the same
// way one level down: a module of one of its sub-folders imports only its own sub-folder or one
// below it. `state/shared` is the one folder that carries one, `answers` above
// `words` above `stores`, since the three are the foot of the state layer and nothing else would
// hold an import between them.
//
// Imports between layers are the boundary test's (tests/checks/tree/boundaries.test.ts); this reads
// only imports inside one layer, the type-only ones with the runtime ones, since a type a folder
// takes from a folder above it ties the two as an import does. A `declare module` block or a
// `/// <reference path>` naming a module of the tree is refused wherever it sits, by augments.ts:
// an augmentation adds to a module from outside it, which ties the two in whichever direction it
// runs, so no order could hold it. Every folder a layer holds is listed, so a new
// folder is placed before it is used, and a listed folder the tree no longer holds is named too;
// the same holds for the sub-folders of a folder INNER names. utils/diagrams/ reads ORDER from this
// file to draw each layer's folders top down, so the list keeps the one shape its reader parses:
// `name: [...]` per layer, the folders quoted.

import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { importGraph } from './graph.ts';

const ORDER: Record<string, string[]> = {
    data: [
        'data',
        'data/sources',
        'data/snapshot',
        'data/accounts',
        'data/shapes',
        'data/helpers',
        'data/prose',
        'data/places',
        'data/model'
    ],
    server: [
        'server/root',
        'server/git',
        'server/edit',
        'server/machine',
        'server/content',
        'server/files',
        'server/sessions',
        'server/accounts',
        'server/transcripts',
        'server/core'
    ],
    state: [
        'state/client',
        'state/workbench',
        'state/feeds',
        'state/life',
        'state/sessions',
        'state/system',
        'state/boards',
        'state/sources',
        'state/forms',
        'state/shared'
    ],
    ui: [
        'ui/tabs',
        'ui/tree',
        'ui/forms',
        'ui/controls',
        'ui/menu',
        'ui/frame',
        'ui/display',
        'ui/theme',
        'ui'
    ],
    shell: [
        'shell',
        'shell/frames',
        'shell/rail',
        'shell/status',
        'shell/panes',
        'shell/keys',
        'shell/commands',
        'shell/window'
    ],
    views: [
        'views/academic',
        'views/apps',
        'views/boards',
        'views/feeds',
        'views/personal',
        'views/sessions',
        'views/sources',
        'views/structure',
        'views/system',
        'views/shared'
    ]
};

/**
 * The inner order of each listed folder that carries one, its sub-folders from the top down, read
 * as ORDER is one level down.
 */
const INNER: Record<string, string[]> = {
    'state/shared': [
        'state/shared/answers',
        'state/shared/page',
        'state/shared/words',
        'state/shared/stores'
    ]
};

/** The folder a lib-relative module sits in: its layer and first sub-folder, or its layer alone. */
function folderOf(id: string): string {
    const parts = id.split('/');
    return parts.length > 2 ? `${parts[0]}/${parts[1]}` : parts[0];
}

/**
 * The sub-folder of an inner order a lib-relative module sits in: the folder and its next
 * sub-folder, or the folder alone for a file that sits in it.
 */
function innerOf(id: string): string {
    const parts = id.split('/');
    return parts.length > 3 ? parts.slice(0, 3).join('/') : parts.slice(0, 2).join('/');
}

/** Every folder of each layer under a lib root: its sub-folders, and itself when it holds files. */
function foldersOf(libRoot: string, layers: string[]): Map<string, string[]> {
    const found = new Map<string, string[]>();
    for (const layer of layers) {
        if (!existsSync(join(libRoot, layer))) continue;
        const entries = readdirSync(join(libRoot, layer), { withFileTypes: true });
        const folders = entries
            .filter((one) => one.isDirectory())
            .map((one) => `${layer}/${one.name}`);
        const files = entries.some((one) => one.isFile() && /\.(ts|svelte)$/.test(one.name));
        found.set(layer, [...(files ? [layer] : []), ...folders].sort());
    }
    return found;
}

/** Each line of a list of folders the tree holds against the list an order places. */
function placement(held: string[], listed: string[], name: string): string[] {
    return [
        ...held
            .filter((folder) => !listed.includes(folder))
            .map((folder) => `${folder} is not placed in the ${name} order`),
        ...listed
            .filter((folder) => !held.includes(folder))
            .map((folder) => `${folder} is placed but the tree holds none`)
    ];
}

/**
 * Whether an import climbs an order: the importer's folder and the imported module's both placed in
 * the list, the imported one above the importer's.
 */
function climbs(listed: string[], from: string, to: string): boolean {
    if (to === from || !listed.includes(to) || !listed.includes(from)) return false;
    return listed.indexOf(to) < listed.indexOf(from);
}

/**
 * Every import that runs against a layer's order or a folder's inner order, as `module:line imports
 * module (its folder, above the importer's)`, and every folder an order does not place or places
 * without the tree holding it.
 */
export function findUpward(
    libRoot: string,
    order: Record<string, string[]> = ORDER,
    inner: Record<string, string[]> = INNER
): string[] {
    const found: string[] = [];
    for (const [layer, folders] of foldersOf(libRoot, Object.keys(order))) {
        found.push(...placement(folders, order[layer], layer));
    }
    for (const [folder, held] of foldersOf(libRoot, Object.keys(inner))) {
        found.push(...placement(held, inner[folder], folder));
    }
    for (const [fileRel, imports] of importGraph(libRoot, '', true)) {
        const layer = fileRel.split('/')[0];
        if (!Object.hasOwn(order, layer)) continue;
        const from = folderOf(fileRel);
        for (const one of imports) {
            const to = folderOf(one.id);
            if (climbs(order[layer], from, to)) {
                found.push(`${fileRel}:${one.line} imports ${one.id} (${to}, above ${from})`);
            }
            if (to !== from || !Object.hasOwn(inner, from)) continue;
            const [innerFrom, innerTo] = [innerOf(fileRel), innerOf(one.id)];
            if (climbs(inner[from], innerFrom, innerTo)) {
                found.push(
                    `${fileRel}:${one.line} imports ${one.id} (${innerTo}, above ${innerFrom})`
                );
            }
        }
    }
    return found.sort();
}
