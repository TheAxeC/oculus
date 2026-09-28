// Layer 1, data. Where the engine's configuration lives: the one rule local.yml's reader and the
// merge of the tracked files both follow, kept apart from both so neither imports the other for it.

import { join } from 'node:path';

/**
 * The directory the engine's YAML is read from and written to: `<engine>/config`, always. The
 * machine's own local.yml sits in it beside the tracked files.
 *
 * A run that must not write the checkout names another engine directory on the command line, and
 * a write it makes, the Slides view's Save among them, edits the file under that engine: the Save
 * edits `config/present.yml` of the engine it was given.
 */
export function configDir(engine: string): string {
    return join(engine, 'config');
}
