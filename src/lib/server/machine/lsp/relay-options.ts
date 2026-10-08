// Layer 2, server. What the relay needs of the machine, handed to `createRelay` by the server's
// context and by a test: the folders and files its servers are found under, the roots it serves,
// the settings it reads at each use, and the pieces a test replaces (the child process, the clock,
// the registry).

import type { watch } from 'node:fs';
import type { ChangeLog } from '../../core/changes.ts';
import type { Root } from '../../files/files.ts';
import type { LatexBuilding } from '../../../data/sources/config/settings.ts';
import type { SchemaFeed } from './schema-feed.ts';
import type { Run } from './adapters/pyright/interpreter.ts';
import type { Spawn } from './held/process.ts';
import type { LibraryRules } from './library/rules.ts';
import type { Servers } from './servers.ts';

/** What the relay needs of the machine. */
export type RelayOptions = {
    /** The oculus folder, which holds `node_modules/pyright`. */
    oculus: string;
    /** The node that runs oculus. */
    node: string;
    /** The roots the file browser serves now. */
    roots: () => Root[];
    /** The folder the lsp key names, read at each use so a changed key is followed. */
    lspFolder: () => string;
    /** The approvals file. */
    approvals: () => string;
    /** The change log a choice is recorded in. */
    changes?: () => ChangeLog | undefined;
    /**
     * What decides whether a file outside every root may be named to a page, read at each file a
     * server names; absent, none may.
     */
    library?: () => LibraryRules;
    /** How a child is made; the `node:child_process` one unless a test hands a stub. */
    spawn?: Spawn;
    /**
     * The schemas of the latest snapshot build, which the YAML server is answered from and, when
     * they change, is asked for its settings again. Absent, no file has a schema.
     */
    schemas?: SchemaFeed;
    /** The registry; `createServers` over `oculus` and `node` unless a test hands one. */
    servers?: Servers;
    /** How an interpreter is asked its version. */
    run?: Run;
    exists?: (path: string) => boolean;
    /** The LaTeX settings in force, read at each texlab start and each answer it is given. */
    latex: () => LatexBuilding;
    /** oculus's own environment, whose PATH finds a server's program; `process.env` by default. */
    env?: NodeJS.ProcessEnv;
    now?: () => number;
    watchFolder?: typeof watch;
};
