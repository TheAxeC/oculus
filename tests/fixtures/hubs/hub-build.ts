// Layer 4, test helper. The build of one hub on its own, for the cases that check what the readers,
// validate, the schemas and normalise make of one hub's files: the steps of data/index.ts that
// server/root/watch/build.ts runs for each hub of a workspace (`readHubBeforeDecks`, `withDecks`,
// then `builtHub`), with no other hub, so every record is under the key its file gives it and a
// reference that the hub does not hold is reported as the hub's own finding. It also holds the scan
// rules a test hub sets as its own, since oculus names no scan folder: the folders of a research
// hub's usual layout, two of them optional, which the tests that plant projects under `projects/`
// build over. A test that merges them over oculus's defaults takes HUB_SCAN, frozen with each rule
// so no reader changes the rules another test reads, and one that writes a hub's
// `.oculus/config.yml` takes HUB_SCAN_LINES.

import { basename } from 'node:path';
import {
    builtHub,
    readHubBeforeDecks,
    withDecks,
    type EngineConfigIn,
    type HubBuild
} from '../../../src/lib/data/index.ts';
import type {
    PortfolioConfig,
    RepositoryRoot,
    ScanRule
} from '../../../src/lib/data/model/index.ts';
import type { SettingsFile } from '../../../src/lib/data/snapshot/references/build.ts';
import { createChecker, type Checker } from '../../../src/lib/data/snapshot/schema/check.ts';
import { folderGlobs } from '../../../src/lib/data/sources/documents/folder-globs.ts';

/**
 * The build of the hub at `hub` with the settings `config`, its files named under `root` (the
 * folder's base name when it is not given). `roots`, `checker`, `engine` and `workspace` are what
 * the server hands the primary hub's build; each defaults to none, and `checker` to a new one.
 */
export function buildOneHub(
    hub: string,
    config: PortfolioConfig,
    version = 0,
    roots: RepositoryRoot[] = [],
    checker: Checker = createChecker(),
    engine: EngineConfigIn | null = null,
    root: string = basename(hub),
    workspace: SettingsFile | null = null
): HubBuild {
    const [{ read }] = withDecks(
        [{ read: readHubBeforeDecks(hub, config, roots, root) }],
        folderGlobs()
    );
    return builtHub(read, { version, checker, engine, workspace, others: {} });
}

/** The scan rules of a test hub in the order the walk reads them, the list and each rule frozen. */
export const HUB_SCAN: readonly Readonly<ScanRule>[] = Object.freeze(
    [
        { dir: 'projects/ideas' },
        { dir: 'side-projects', optional: true },
        { dir: 'projects/active' },
        { dir: 'projects/manuscripts' },
        { dir: 'projects/software', optional: true },
        { dir: 'projects/coauthor' },
        { dir: 'projects/archive' }
    ].map((rule: ScanRule) => Object.freeze(rule))
);

/** HUB_SCAN as the `scan:` lines of a hub's settings file, each rule one line. */
export const HUB_SCAN_LINES = `scan:\n${HUB_SCAN.map(
    (rule) => `  - { dir: ${rule.dir}${rule.optional === true ? ', optional: true' : ''} }\n`
).join('')}`;
