// Layer 2, client state. What the Config view lists: the engine's own configuration files, in the
// order the view draws their cards, and how many lines one of them holds.
//
// The list is the `.yml` files of the engine's config folder itself and of its `catalogs/` folder,
// which is the set loadConfig merges its top-level keys from, plus the machine's own `local.yml`,
// which sits in the folder and is read by loadLocal alone; the catalog fragments under
// `config/text/` are read through the same root by the file browser and are not cards here. The
// machine's own file is last, after the tracked ones, and is the one card the view marks with a
// tag. Pure over the listings the file browser's store holds, so the order is checked without a
// rendering.

import type { FsEntry } from '../sources/fs.ts';

/** The extension a configuration file carries. */
export const CONFIG_SUFFIX = '.yml';

/**
 * The machine's own file inside that folder. It is the client's half of the name
 * data/sources/config.ts leaves out of the merge, since nothing client-side may import a server
 * module; tests/state/system/config-files.test.ts holds the two to one another.
 */
export const LOCAL_NAME = 'local.yml';

/** Whether one name is the machine's own file, which is what the view tags and puts last. */
export function isLocalFile(name: string): boolean {
    return name === LOCAL_NAME;
}

/** The folder under config/ that holds the vocabulary catalogs, listed as cards beside the top. */
export const CATALOGS = 'catalogs';

/**
 * The files of the two listings as paths under config/: the YAML of the folder itself, then the
 * YAML of its catalogs folder, each in name order, and the machine's own file last, which is where
 * a reader looks for it after the shared files. Nothing deeper is a card.
 */
export function configFiles(entries: FsEntry[], catalogs: FsEntry[] = []): string[] {
    const yaml = (list: FsEntry[]): string[] =>
        list
            .filter((entry) => entry.kind === 'file' && entry.name.endsWith(CONFIG_SUFFIX))
            .map((entry) => entry.name);
    const top = yaml(entries);
    const tracked = top
        .filter((name) => !isLocalFile(name))
        .sort((left, right) => left.localeCompare(right));
    const nested = yaml(catalogs)
        .sort((left, right) => left.localeCompare(right))
        .map((name) => `${CATALOGS}/${name}`);
    return top.some(isLocalFile) ? [...tracked, ...nested, LOCAL_NAME] : [...tracked, ...nested];
}

/** How many lines a file holds, which is what its card says beside its name. */
export function fileLineCount(text: string): number {
    if (text === '') return 0;
    return text.endsWith('\n') ? text.split('\n').length - 1 : text.split('\n').length;
}
