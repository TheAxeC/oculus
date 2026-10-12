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
export { collectionKeys } from '../snapshot/normalise.ts';

export {
    type LocalConfig,
    DEFAULT_PORT,
    LOCAL_NAME,
    checkLocal,
    localDefaults,
    localFile,
    localSentence,
    usageAccountLabel
} from './config/local.ts';
export { loadMachine, readMachine } from './config/machine.ts';
export { configDir } from './config/folder.ts';
export {
    CATALOGS_DIR,
    TEXT_KEY,
    droppedFile,
    flattenText,
    loadConfig,
    sourceFile,
    textCatalog
} from './config/merge.ts';
export {
    type IconMemory,
    VOCAB_KEYS,
    behaviorFindings,
    glyphCatalog,
    iconCatalog,
    iconFindings,
    iconSet,
    localFindings,
    settingFindings,
    vocabCatalog
} from './config/catalogs.ts';
export {
    type AppsSettings,
    type CalendarSettings,
    type MailSettings,
    type LiteratureSettings,
    type OpenSettings,
    type LatexFormatting,
    type LintSettings,
    type ProcessesSettings,
    type SearchSettings,
    type SlurmSettings,
    appsSettings,
    autofetchMin,
    repositoryScanDepth,
    calendarSettings,
    changesKeep,
    closedPaths,
    confirmDelete,
    latexBuild,
    latexFormatting,
    lintSettings,
    literatureSettings,
    mailSettings,
    openSettings,
    processesSettings,
    refreshSettings,
    searchSettings,
    slurmSettings,
    usageTiers
} from './config/settings.ts';
export { languageFindings } from './config/sections/languages.ts';
export { latexEditingFindings, latexUnimathFindings } from './config/catalog/latex-editing.ts';
export { nestingFindings } from './config/catalog/nesting.ts';
export { optionFindings } from './config/catalog/option-findings.ts';
export { schemaFindings } from './config/catalog/schema-findings.ts';
export { themeFindings } from './config/sections/themes.ts';
