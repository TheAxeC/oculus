// Layer 1, data. The commands of oculus's own that an app may run, by their ids. They are the
// palette's colon commands (`:theme` and the others), named `oculus.<name>`. The ones that change
// only what a page shows run on a page; the ones that write configuration (`file-icons` writes
// `file_icons`), start agents, write the workspaces file or open a system panel are closed to every
// app, since no approval names what they do. The server decides a host's `executeCommand` by this
// list and a frame's `commands.execute` by the same one.

/** What an `oculus.<name>` id stands for. */
export type OculusCommandKind = 'page' | 'closed';

/** The commands a page runs for an app: what a page shows. */
const PAGE_COMMANDS: readonly string[] = [
    'oculus.theme',
    'oculus.crt',
    'oculus.tab',
    'oculus.goto'
];

/** The palette's other colon commands, which no approval covers. */
const CLOSED_COMMANDS: readonly string[] = [
    'oculus.language',
    'oculus.interpreter',
    'oculus.compile-database',
    'oculus.eslint-config',
    'oculus.file-icons',
    'oculus.update',
    'oculus.workspace',
    'oculus.workspace-save',
    'oculus.folder',
    'oculus.accent',
    'oculus.help'
];

/** The kind of an id of the `oculus.` namespace, or null for an id that names no command of it. */
export function oculusCommandKind(id: string): OculusCommandKind | null {
    if (PAGE_COMMANDS.includes(id)) return 'page';
    return CLOSED_COMMANDS.includes(id) ? 'closed' : null;
}
