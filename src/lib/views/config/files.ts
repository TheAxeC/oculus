// Layer 3, view partial. What the Config view lists: the engine's own configuration files, and the
// catalog key each one's description is written under.
//
// The list is the `.yml` files of the engine's config folder itself, which is the set loadConfig
// merges its top-level keys from; the catalog fragments under `config/text/` are read through the
// same root by the file browser and are not cards here. Apart from the component so the fold and the
// key can be read without a rendering, which is what the test that holds the descriptions to the
// files does.

import type { FsEntry } from '$lib/state/fs';

/** The extension a configuration file carries. */
const SUFFIX = '.yml';

/** The files of one listing, in name order: the YAML of the folder itself and nothing below it. */
export function configFiles(entries: FsEntry[]): string[] {
    return entries
        .filter((entry) => entry.kind === 'file' && entry.name.endsWith(SUFFIX))
        .map((entry) => entry.name)
        .sort((left, right) => left.localeCompare(right));
}

/** The catalog key one file's one-line description is written under. */
export function descriptionKey(name: string): string {
    return `config.desc_${name.slice(0, -SUFFIX.length).replace(/-/g, '_')}`;
}

/** How many lines a file holds, which is what its card says beside its name. */
export function lineCount(text: string): number {
    if (text === '') return 0;
    return text.endsWith('\n') ? text.split('\n').length - 1 : text.split('\n').length;
}
