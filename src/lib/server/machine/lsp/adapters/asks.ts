// Layer 2, server. What the registry (servers.ts) hands the hooks of an entry: the notification an
// entry has written to its server after `initialized`, the change of a path a server that watches
// paths is told, what a handler of a server request knows and may do, and the document an entry
// filters the diagnostics of. They live here and servers.ts names them again, so an adapter reads
// them without importing the registry.

import type { SchemaSet } from '../../../../data/snapshot/schema/set.ts';
import type { ServedRoot } from '../uris.ts';

/** A notification written to a server right after `initialized`. */
export type Registration = { method: string; params?: unknown };

/** A request asked of a server ahead of the notice of changes on disk, as `introduce` words it. */
export type Introduction = { method: string; params: unknown };

/** What happened to a file or folder, as a server that watches paths is told. */
export type ChangeKind = 'create' | 'change' | 'delete';

/** What an entry's handler of a server request knows and may do. */
export type ServerAsk = {
    root: ServedRoot;
    /** Every served root. */
    roots: readonly ServedRoot[];
    schemas: SchemaSet;
    /**
     * Ask the server, as `notice` words it, about each change under a file or folder, by a real
     * path; `parents` also tells the creation of a folder the path lies in. A second call with the
     * same `id` replaces the first, and the paths followed end with the server.
     */
    follow(
        id: string,
        real: string,
        parents: boolean,
        notice: (real: string, kind: ChangeKind) => { method: string; params: unknown }
    ): void;
    /** Stop following the paths of an `id`; an id that is not followed is left alone. */
    unfollow(id: string): void;
    /** The request being answered reads the file at this address; the relay keeps count. */
    reading?(uri: unknown): void;
};

/** A document a server published diagnostics for, with the text the page holds it at. */
export type DiagnosticView = {
    /** The file's real path. */
    real: string;
    text: string;
    root: ServedRoot;
    roots: readonly ServedRoot[];
    /** The flat text catalog; empty when the relay holds none. */
    catalog: Record<string, string>;
};
