// Layer 2, client state. What the Settings view knows of the engine's configuration files by name:
// the extension they carry, the machine's own file, the folder of the vocabulary catalogs, and the
// one-line description each file has in the text catalog.

import { hasText, lookup } from '../../shared/words/text.ts';

/** The extension a configuration file carries. */
const CONFIG_SUFFIX = '.yml';

/**
 * The machine's own file inside the config folder. It is the client's half of the name
 * data/sources/config.ts leaves out of the merge, since nothing client-side may import a server
 * module; tests/state/system/config-files.test.ts holds the two to one another.
 */
export const LOCAL_NAME = 'local.yml';

/** The folder under config/ that holds the vocabulary catalogs. */
export const CATALOGS = 'catalogs';

/** The catalog key one file's one-line description is written under. */
export function descriptionKey(path: string): string {
    const name = path.slice(path.lastIndexOf('/') + 1);
    return `settings.desc_${name.slice(0, -CONFIG_SUFFIX.length).replace(/-/g, '_')}`;
}

/** The description of a file, or the empty string for a file the catalog has no word for. */
export function describedAs(path: string): string {
    return hasText(descriptionKey(path)) ? lookup(descriptionKey(path)) : '';
}
