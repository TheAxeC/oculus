// Layer 3, view partial of Source.svelte. What a LaTeX source tab adds to its editor: the problems
// of the latest build of this file as markers, the preview of math and pictures, and Format
// Document through the server's tex-fmt (state/sessions/latex.svelte.ts). The editor draws them
// (ui/controls/editor/kit/latex-widget.ts); this module is what the page hands it.
//
// A picture path in the text is resolved from the folder of the main file the tab builds through
// (`rootOf`), else from the file's own folder, and a file exists when the folder's listing, which
// the file browser reads too, names it.

import type { ClientState } from '$lib/state/client/context';
import { nameOf } from '$lib/state/sources/fs';
import type { EditorExtension } from '$lib/ui/controls/editor/types';
import { latexExtension } from '$lib/ui/controls/editor/kit/latex-widget';
import { fileUrl } from '../../shared/links/file-url';

/** The folder part of a path against a root, the empty string for a file in the root itself. */
function folderOf(path: string): string {
    const at = path.lastIndexOf('/');
    return at < 0 ? '' : path.slice(0, at);
}

/**
 * The editor extension of one LaTeX file of a root. It reads the diagnostics of the latex store
 * when it is made, so a derived value over it is made again whenever a build lands.
 */
export function latexEditor(
    client: ClientState,
    file: { root: string; path: string },
    say: (words: string) => void
): EditorExtension {
    const { root, path } = file;
    const problems = client.latex
        .latexDiagnostics()
        .filter((one) => one.root === root && one.file === path)
        .map((one) => ({ line: one.line ?? 1, severity: one.severity, message: one.message }));
    let folder: Promise<string> | null = null;
    return latexExtension({
        problems,
        folder: () => {
            folder ??= client.latex
                .rootOf(root, path)
                .then((found) => (found === null ? folderOf(path) : found.path));
            return folder;
        },
        exists: async (target) => {
            const listing = await client.fs.readListing(root, folderOf(target));
            return listing.entries.some(
                (one) => one.kind === 'file' && one.name === nameOf(target)
            );
        },
        address: (target) => fileUrl(root, target),
        format: (text) => client.latex.format(text, path),
        say
    });
}
