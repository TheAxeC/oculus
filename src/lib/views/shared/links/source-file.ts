// Layer 3, shared view support. What the control that opens a view's own file does, apart from the
// control so the tab it opens can be read without a rendering.

import type { ClientState } from '$lib/state/client/context';
import type { OpenOptions } from '$lib/state/workbench/layout.svelte';
import {
    libraryFileState,
    sourceFileState,
    type LibraryFile,
    type SourceFile
} from '$lib/state/sessions/source/place';

export type { LibraryFile, SourceFile };

export function openSourceFile(
    client: ClientState,
    file: SourceFile,
    options?: OpenOptions
): string {
    return client.layout.openView('source', sourceFileState(client, file), undefined, options);
}

/**
 * Open a library file a language server named, in the tab that holds it or a new one, at a line
 * and column of it. The address is the tab's identity, and the file's own name its label.
 */
export function openLibraryFile(
    client: ClientState,
    file: LibraryFile,
    options?: OpenOptions
): string {
    return client.layout.openView('source', libraryFileState(client, file), undefined, options);
}

/**
 * Open the file a reference names at its line and column: a file of a served root, or a library
 * file, which a reference carries as an address in `path` with the file's name in `library`.
 */
export function openReference(
    client: ClientState,
    file: { root: string; path: string; library?: string },
    line: number,
    column: number,
    options?: OpenOptions
): string {
    if (file.library !== undefined) {
        return openLibraryFile(
            client,
            { library: file.path, name: file.library, line, column },
            options
        );
    }
    return openSourceFile(client, { root: file.root, path: file.path, line, column }, options);
}
