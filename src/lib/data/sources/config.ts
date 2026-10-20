// Layer 1, data. Resolves the machine-local values and the text catalog from files on disk. Server
// side only: it reads the filesystem and no client module may import it. A caller passes the engine
// directory, and engineDir (data/places/engine-dir.ts, re-exported here) derives it from its own
// location so dev and the built server agree. Nothing here reads the environment: the built server
// takes the engine directory as a command-line argument (`--engine`, beside `--default-port` and
// `--handler`) and threads it down, which is how a test server is pointed at a hub in a temporary
// directory without writing into the checkout. The machine-local file of a hub sits in the hub's
// `.oculus/` folder, outside the tracked YAML, and is read by readMachine alone: loadConfig never
// merges it, so a machine's own keys never join the merged map.

/**
 * Where the checkout is: `engineDir` lives in data/places/engine-dir.ts, which imports `node:`
 * modules only so the start checks can run before the packages are known to be installed.
 */
export { engineDir } from '../places/engine-dir.ts';

/**
 * The pure reader of the `collections:` keys lives with the registry keys it excludes, client-safe.
 */
export { collectionKeys, workspaceCollectionKeys } from '../snapshot/normalise.ts';

export {
    type DownloadAccount,
    type DownloadService,
    type LocalConfig,
    DEFAULT_PORT,
    LITERATURE_KEYS,
    LOCAL_NAME,
    PROGRAM_KEYS,
    STATE_PATHS,
    checkLocal,
    localDefaults,
    localFile,
    localSentence,
    usageAccountLabel
} from './config/local.ts';
export { loadMachine, readMachine } from './config/machine.ts';
export { configDir } from './config/folder.ts';
export {
    type ConfigWhere,
    type ReplacedFile,
    CATALOGS_DIR,
    droppedFile,
    keyFile,
    loadConfig,
    sourceFile
} from './config/merge/merge.ts';
export { TEXT_KEY, textCatalog } from './config/merge/text.ts';
export { type WorkspaceLayer } from './config/merge/workspace-layer.ts';
export {
    type IconMemory,
    VOCAB_KEYS,
    glyphCatalog,
    iconCatalog,
    iconSet,
    localFindings,
    vocabCatalog
} from './config/catalogs.ts';
export {
    type CalendarSettings,
    type LiteratureSettings,
    type MailSettings,
    type SlurmSettings,
    calendarSettings,
    literatureSettings,
    mailSettings,
    refreshSettings,
    slurmSettings,
    usageTiers
} from './config/settings/connectors.ts';
export {
    type OpenSettings,
    type SearchSettings,
    autofetchMin,
    confirmDelete,
    fileIconAtArrow,
    openSettings,
    repositoryScanDepth,
    searchSettings
} from './config/settings/files.ts';
export { type LatexFormatting, latexBuild, latexFormatting } from './config/settings/latex.ts';
export { type LintSettings, lintSettings } from './config/settings/lint.ts';
export {
    type AppsSettings,
    type ProcessesSettings,
    appsSettings,
    changesKeep,
    closedPaths,
    processesSettings
} from './config/settings/machine.ts';
