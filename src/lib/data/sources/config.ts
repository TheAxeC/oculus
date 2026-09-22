// Layer 1, data. Resolves the machine-local values and the text catalog from files on disk.
// Server side only: it reads the filesystem and no client module may import it.
// A caller passes the engine directory, and engineDir derives it from this module's own location
// so dev and the built server agree. Nothing here reads the environment: the built server takes the
// engine directory as its one command-line argument and threads it down, which is how a test server
// is pointed at a hub in a temporary directory without writing into the checkout. The machine-local
// file sits in the config directory with the tracked YAML and is read by loadLocal alone: loadConfig
// leaves it out, so a machine's own keys never join the merged map.

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Walk up from a starting file until a directory holds both package.json and config/.
 * In development that lands on tools/oculus from src/lib/data/sources; in the adapter-node
 * build it lands on the same directory from build/server/chunks.
 */
export function engineDir(from: string = fileURLToPath(import.meta.url)): string {
    let dir = dirname(from);
    for (;;) {
        if (existsSync(join(dir, 'package.json')) && existsSync(join(dir, 'config'))) return dir;
        const up = dirname(dir);
        if (up === dir) throw new Error(`no oculus engine directory above ${from}`);
        dir = up;
    }
}

/** The pure reader of the `collections:` keys lives with the registry keys it excludes, client-safe. */
export { collectionKeys } from '../snapshot/normalise.ts';

export {
    type LocalConfig,
    DEFAULT_PORT,
    LOCAL_NAME,
    checkLocal,
    loadLocal,
    loadLocalOrDefaults,
    localDefaults,
    usageAccountLabel
} from './config/local.ts';
export {
    CATALOGS_DIR,
    TEXT_KEY,
    configDir,
    flattenText,
    loadConfig,
    textCatalog
} from './config/merge.ts';
export {
    type IconMemory,
    VOCAB_KEYS,
    asciiCatalog,
    behaviorFindings,
    glyphCatalog,
    iconCatalog,
    iconFindings,
    iconSet,
    vocabCatalog
} from './config/catalogs.ts';
export {
    type CalendarSettings,
    type MailSettings,
    type OpenSettings,
    type SearchSettings,
    type SlurmSettings,
    calendarSettings,
    changesKeep,
    mailSettings,
    openSettings,
    searchSettings,
    slurmSettings,
    usageTiers
} from './config/settings.ts';
