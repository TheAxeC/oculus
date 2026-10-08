// Layer 2, client state. Opening a place in a file: the state of the tab a place opens, stamped as
// a new ask of the place, and the two ways a list opens one.
//
// A single press on a list row shows the place in the pane's preview tab; Enter or a double press
// keeps the tab. Opening a view a second time with the preview option is what keeps a tab (the
// second click of a double click), which a second single press on the same file is not, so a tab
// already open over the file is pointed at the place without the option, a preview staying one.

import type { ViewSource } from '../view-source.ts';
import { libraryTabState, sourceTabState, type PlaceMore, type SourceTabState } from './draft.ts';

/** Where in a file a tab opens: a line and column, and the end of a range from there. */
type Place = {
    line?: number;
    column?: number;
    endLine?: number;
    endColumn?: number;
    /** False for an open that leaves the keyboard where it is. */
    focus?: boolean;
};

/**
 * A file of a root to open, with the words the tab carries when its own name is not what to call
 * it and the place the tab opens at when the caller knows it: a search hit names its line, a
 * reference its line and column, a problem its range, and everything that opens a whole file names
 * none. The column means the word at it is selected, and an end means the range is.
 */
export type SourceFile = ViewSource & { label?: string } & Place;

/** A library file a language server named: its address, its name and the place in it. */
export type LibraryFile = { library: string; name: string } & Place;

/** What opening a place asks of the page: the layout's three answers, and the asks counter. */
export type PlaceOpener = {
    layout: {
        openView: (
            view: 'source',
            state: SourceTabState,
            page?: string,
            options?: { preview?: boolean }
        ) => string;
        keepPreview: (id: string) => void;
        /** Whether a tab is open over the file the state names, in any pane of any page. */
        holds: (tab: SourceTabState) => boolean;
    };
    source: { nextAsked: () => number };
};

/** What a place adds to a tab's state: its end, its keyboard and a fresh ask. */
function more(opener: Pick<PlaceOpener, 'source'>, place: Place): PlaceMore {
    return {
        ...(place.endLine === undefined ? {} : { endLine: place.endLine }),
        ...(place.endColumn === undefined ? {} : { endColumn: place.endColumn }),
        ...(place.focus === undefined ? {} : { focus: place.focus }),
        asked: opener.source.nextAsked()
    };
}

/** The state of a tab over a file of a root, every open of a place stamped as a new ask of it. */
export function sourceFileState(
    opener: Pick<PlaceOpener, 'source'>,
    file: SourceFile
): SourceTabState {
    const tab = sourceTabState(file.root, file.path, file.line, file.column, more(opener, file));
    return file.label === undefined ? tab : { ...tab, label: file.label };
}

/** The state of a tab over a library file, stamped as `sourceFileState` is. */
export function libraryFileState(
    opener: Pick<PlaceOpener, 'source'>,
    file: LibraryFile
): SourceTabState {
    return libraryTabState(file.library, file.name, file.line, file.column, more(opener, file));
}

/**
 * Open a place a list names. `kept` is Enter or a double press: the tab is kept. Otherwise the
 * place shows in the pane's preview tab, unless a tab over the file is open, which is pointed at
 * the place and left as it is.
 */
export function openPlace(
    opener: PlaceOpener,
    file: SourceFile | LibraryFile,
    kept: boolean
): string {
    const tab = 'library' in file ? libraryFileState(opener, file) : sourceFileState(opener, file);
    const id = opener.layout.openView(
        'source',
        tab,
        undefined,
        opener.layout.holds(tab) || kept ? undefined : { preview: true }
    );
    if (kept) opener.layout.keepPreview(id);
    return id;
}
