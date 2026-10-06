// Layer 3, shell. The breadcrumb over a file tab: the segments of the path its tab names (the root,
// each folder, the file), and what a press on one opens. Apart from the component so both can be
// read without a DOM.
//
// A press on the root or a folder runs `showFolderInFiles` and a press on the file runs
// `showInFiles`; the home folder is written `~` in the tab's tooltip once the server's roots answer
// has come. The Files tree draws no breadcrumb.

import type { Instance } from '$lib/state/workbench/layout';
import { crumbsOf, fileOfTab } from '$lib/state/workbench/navigation/pages';

/** One segment: its words, the root and the path it names, and whether it is the file itself. */
export type Crumb = { label: string; root: string; path: string; file: boolean };

/**
 * The segments of the path a tab shows, outermost first, or none for a tab that names no file and
 * for a file under a root the server does not serve, which the Files view could not show.
 */
export function tabCrumbs(
    tab: Pick<Instance, 'id' | 'view' | 'state'>,
    served: readonly string[]
): Crumb[] {
    const file = fileOfTab(tab);
    if (file === null || !served.includes(file.root)) return [];
    const segments = crumbsOf(file);
    return segments.map((segment, at) => ({
        label: segment.label,
        root: segment.row.root,
        path: segment.row.path,
        file: at === segments.length - 1
    }));
}

/** What a press on a segment calls: the Files view shown at a folder, and at a file. */
export type CrumbDeps = {
    showFolderInFiles: (path: string, root?: string) => string;
    showInFiles: (path: string, root?: string) => string;
};

/** A press on a segment: a folder or the root opens the Files view there, the file reveals it. */
export function crumbPicked(crumb: Crumb, deps: CrumbDeps): void {
    if (crumb.file) deps.showInFiles(crumb.path, crumb.root);
    else deps.showFolderInFiles(crumb.path, crumb.root);
}
