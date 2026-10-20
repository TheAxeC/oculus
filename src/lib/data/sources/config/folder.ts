// Layer 1, data. Where oculus's own configuration lives: the folder, its two folders of shipped
// values and their descriptions, and the path of one of its files by the name the merge gives it,
// kept apart from the merge and its readers so neither imports the other for it.

import { join } from 'node:path';

/** The folder under config/ holding oculus's shipped values, one file per subject. */
export const DEFAULTS_DIR = 'defaults';

/** The folder under config/ holding the description of every option of each defaults file. */
export const OPTIONS_DIR = 'options';

/**
 * The directory oculus's YAML is read from: `<engine>/config`, always. Settings never writes in it:
 * a reader's values go to the open workspace file and the hub's own `.oculus/config.yml`.
 */
export function configDir(engine: string): string {
    return join(engine, 'config');
}

/**
 * The path of a file of oculus's config by the name loadConfig gives it in `from` and in its
 * findings: a name with no folder (`behavior.yml`) is a file of config/defaults/, and any other
 * (`catalogs/vocab.yml`) is named relative to config/.
 */
export function engineFile(engine: string, name: string): string {
    const folder = name.includes('/') ? configDir(engine) : join(configDir(engine), DEFAULTS_DIR);
    return join(folder, name);
}
