// Layer 2, server. The dependencies of a Processes read on the machine itself: the process table
// from one `ps` run (ps.ts), the panes of oculus's tmux sessions, and `lsof` for the folders.

import { listPanes } from '../pty/sessions.ts';
import { lsofFolders } from './folders.ts';
import { readTable } from './ps.ts';
import type { ReadDeps } from './read.ts';

/** The live dependencies of a read; `projects` gives the absolute folder of every project. */
export function liveDeps(projects: () => string[]): ReadDeps {
    return {
        table: (signal) => readTable(signal === undefined ? {} : { signal }),
        panes: () => listPanes(),
        folders: (pids, signal) => lsofFolders(pids, signal === undefined ? {} : { signal }),
        projects
    };
}
