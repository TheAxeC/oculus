// Layer 4, test helper. The build of one hub on its own, for the cases that check what the readers,
// validate, the schemas and normalise make of one hub's files: the steps of data/index.ts that
// server/root/watch/build.ts runs for each hub of a workspace (`readHub`, then `builtHub`), with
// no other hub, so every record is under the key its file gives it and a reference that the hub
// does not hold is reported as the hub's own finding.

import { basename } from 'node:path';
import {
    builtHub,
    readHub,
    type EngineConfigIn,
    type HubBuild
} from '../../../src/lib/data/index.ts';
import type { PortfolioConfig, RepositoryRoot } from '../../../src/lib/data/model/index.ts';
import type { SettingsFile } from '../../../src/lib/data/snapshot/references/build.ts';
import { createChecker, type Checker } from '../../../src/lib/data/snapshot/schema/check.ts';

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
    const read = readHub(hub, config, roots, root);
    return builtHub(read, { version, checker, engine, workspace, others: {} });
}
