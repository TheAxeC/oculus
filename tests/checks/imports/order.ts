// Layer 4, test helper. The folders of each layer in their order from the top down, and the check
// that holds the import graph to it.
//
// A folder is the layer and its first sub-folder (`server/core`, `state/boards`, `ui/menu`), and
// the files that sit in the layer itself are the folder named by the layer alone (`ui`, `shell`).
// A module may import a folder of its own layer only when that folder is its own or below its own
// in the layer's list, so every folder imports downward and no two folders import each other. The
// composition roots head their layers (`server/root`, `state/client`, `shell`, and `data` itself,
// whose index.ts builds the portfolio out of every data folder) since they import every folder
// beside them and none imports them; the modules every folder of a layer shares sit at its foot
// (`server/core`, `state/stores` with the shapes of the shared stores, `state/words`, `data/model`
// with the facade of every type, the files of `ui`).
//
// Imports between layers are the boundary test's (tests/checks/tree/boundaries.test.ts); this reads
// only imports inside one layer, the type-only ones with the runtime ones, since a type a folder
// takes from a folder above it ties the two as an import does, and a `declare module` block that
// augments a module of a folder above its own, which ties them the same way from the other end.
// Every folder a layer holds is listed, so a new folder is placed before it is used, and a listed
// folder the tree no longer holds is named too. bin/diagrams/ reads ORDER from this file to draw
// each layer's folders top down, so the list keeps the one shape its reader parses: `name: [...]`
// per layer, the folders quoted.

import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { importGraph } from './graph.ts';

export const ORDER: Record<string, string[]> = {
    data: ['data', 'data/sources', 'data/snapshot', 'data/accounts', 'data/helpers', 'data/model'],
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
        'state/sessions',
        'state/system',
        'state/boards',
        'state/sources',
        'state/forms',
        'state/words',
        'state/stores'
    ],
    ui: [
        'ui/tabs',
        'ui/tree',
        'ui/forms',
        'ui/controls',
        'ui/menu',
        'ui/frame',
        'ui/display',
        'ui'
    ],
    shell: ['shell', 'shell/rail', 'shell/status', 'shell/panes', 'shell/keys'],
    views: [
        'views/academic',
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

/** The folder a lib-relative module sits in: its layer and first sub-folder, or its layer alone. */
export function folderOf(id: string): string {
    const parts = id.split('/');
    return parts.length > 2 ? `${parts[0]}/${parts[1]}` : parts[0];
}

/** Every folder of each layer under a lib root: its sub-folders, and itself when it holds files. */
export function foldersOf(libRoot: string, layers: string[]): Map<string, string[]> {
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

/**
 * Every import that runs against a layer's order, as `module:line imports module (its folder, above
 * the importer's)`, and every folder the order does not place or places without the tree holding
 * it.
 */
export function findUpward(libRoot: string, order: Record<string, string[]> = ORDER): string[] {
    const found: string[] = [];
    const layers = Object.keys(order);
    for (const [layer, folders] of foldersOf(libRoot, layers)) {
        const listed = order[layer];
        for (const folder of folders) {
            if (!listed.includes(folder))
                found.push(`${folder} is not placed in the ${layer} order`);
        }
        for (const folder of listed) {
            if (!folders.includes(folder))
                found.push(`${folder} is placed but the tree holds none`);
        }
    }
    for (const [fileRel, imports] of importGraph(libRoot, '', true)) {
        const from = folderOf(fileRel);
        const layer = fileRel.split('/')[0];
        if (!Object.hasOwn(order, layer)) continue;
        const listed = order[layer];
        for (const one of imports) {
            const to = folderOf(one.id);
            if (to === from || !listed.includes(to) || !listed.includes(from)) continue;
            if (listed.indexOf(to) > listed.indexOf(from)) continue;
            const verb = one.augments === true ? 'augments' : 'imports';
            found.push(`${fileRel}:${one.line} ${verb} ${one.id} (${to}, above ${from})`);
        }
    }
    return found.sort();
}
